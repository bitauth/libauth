import { binToHex, hexToBin } from '../format/hex';
import {
  bigIntToBinUint256BEClamped,
  bigIntToBinUint64LE,
} from '../format/numbers';
import { deriveHdPrivateNodeFromSeed, encodeHdPrivateKey } from '../key/hd-key';
import {
  Output,
  TransactionContextCommon,
} from '../transaction/transaction-types';

import { CompilerDefaults } from './compiler-defaults';
import {
  AnyCompilationEnvironmentIgnoreOperations,
  CompilationData,
  Scenario,
} from './compiler-types';
import { compileScript, compileScriptRaw } from './language/compile';
import { CompilationError } from './language/language-types';
import { stringifyErrors } from './language/language-utils';
import {
  AuthenticationTemplateKey,
  AuthenticationTemplateScenario,
  AuthenticationTemplateScenarioData,
  AuthenticationTemplateScenarioOutput,
} from './template-types';

/**
 * The contents of an `AuthenticationTemplateScenario` without the `name` and
 * `description`.
 */
export type ScenarioDefinition = Pick<
  AuthenticationTemplateScenario,
  'data' | 'transaction' | 'value'
>;

type RequiredTwoLevels<T> = {
  [P in keyof T]-?: Required<T[P]>;
};

/**
 * All scenarios extend the default scenario, so the `data`, `transaction` (and
 * all `transaction` properties), and `value` properties are guaranteed to be
 * defined in an extended scenario definition.
 */
export type ExtendedScenarioDefinition = Required<
  Pick<ScenarioDefinition, 'data'>
> &
  RequiredTwoLevels<Pick<ScenarioDefinition, 'transaction'>> &
  Required<Pick<ScenarioDefinition, 'value'>>;

/*
 * & {
 *   value: Uint8Array;
 * };
 */

/**
 * Given a compilation environment, generate the default scenario which is
 * extended by all the environments scenarios.
 *
 * For details on default scenario generation, see
 * `AuthenticationTemplateScenario.extends`.
 *
 * @param environment - the compilation environment from which to generate the
 * default scenario
 */
// eslint-disable-next-line complexity
export const generateDefaultScenarioDefinition = <
  Environment extends AnyCompilationEnvironmentIgnoreOperations<
    TransactionContext
  >,
  TransactionContext
>(
  environment: Environment
): string | ExtendedScenarioDefinition => {
  const { variables, entityOwnership } = environment;

  const keyVariableIds =
    variables === undefined
      ? []
      : Object.entries(variables)
          .filter(
            (entry): entry is [string, AuthenticationTemplateKey] =>
              entry[1].type === 'Key'
          )
          .map(([id]) => id);

  const entityIds =
    entityOwnership === undefined
      ? []
      : Object.keys(
          Object.values(entityOwnership).reduce(
            (all, entityId) => ({ ...all, [entityId]: true }),
            {}
          )
        );

  const valueMap = [...keyVariableIds, ...entityIds]
    .sort(([idA], [idB]) => idA.localeCompare(idB))
    .reduce<{ [variableOrEntityId: string]: Uint8Array }>(
      (all, id, index) => ({
        ...all,
        [id]: bigIntToBinUint256BEClamped(BigInt(index + 1)),
      }),
      {}
    );

  const privateKeys =
    variables === undefined
      ? undefined
      : Object.entries(variables).reduce<{ [id: string]: string }>(
          (all, [variableId, variable]) =>
            variable.type === 'Key'
              ? {
                  ...all,
                  [variableId]: binToHex(valueMap[variableId]),
                }
              : all,
          {}
        );

  const defaultScenario: ExtendedScenarioDefinition = {
    data: {
      currentBlockHeight: CompilerDefaults.defaultScenarioCurrentBlockHeight as const,
      currentBlockTime: CompilerDefaults.defaultScenarioCurrentBlockTime as const,
      ...(privateKeys === undefined || Object.keys(privateKeys).length === 0
        ? {}
        : { keys: { privateKeys } }),
    },
    transaction: {
      inputs: [{ unlockingBytecode: null }],
      locktime: CompilerDefaults.defaultScenarioTransactionLocktime as const,
      outputs: [
        {
          lockingBytecode: CompilerDefaults.defaultScenarioTransactionOutputsLockingBytecodeHex as const,
        },
      ],
      version: CompilerDefaults.defaultScenarioTransactionVersion as const,
    },
    value: CompilerDefaults.defaultScenarioValue as const,
  };

  const hasHdKeys =
    variables === undefined
      ? false
      : Object.values(variables).findIndex(
          (variable) => variable.type === 'HdKey'
        ) !== -1;

  if (!hasHdKeys) {
    return defaultScenario;
  }

  const { sha256, sha512 } = environment;
  if (sha256 === undefined) {
    return 'An implementations of "sha256" is required to generate defaults for HD keys, but the "sha256" property is not included in this compilation environment.';
  }
  if (sha512 === undefined) {
    return 'An implementations of "sha512" is required to generate defaults for HD keys, but the "sha512" property is not included in this compilation environment.';
  }
  const crypto = { sha256, sha512 };

  const hdPrivateKeys = entityIds.reduce((all, entityId) => {
    /**
     * The first 5,000,000,000 seeds have been tested, scenarios are
     * unlikely to exceed this number of entities.
     */
    const assumeValid = true;
    const masterNode = deriveHdPrivateNodeFromSeed(
      crypto,
      valueMap[entityId],
      assumeValid
    );
    const hdPrivateKey = encodeHdPrivateKey(crypto, {
      network: 'mainnet',
      node: masterNode,
    });

    return { ...all, [entityId]: hdPrivateKey };
  }, {});

  return {
    ...defaultScenario,
    data: {
      ...defaultScenario.data,
      hdKeys: {
        addressIndex: CompilerDefaults.defaultScenarioAddressIndex as const,
        hdPrivateKeys,
      },
    },
  };
};

/**
 * Extend the `data` property of a scenario definition with values from a parent
 * scenario definition. Returns the extended value for `data`.
 *
 * @param parentData - the scenario `data` which is extended by the child
 * scenario
 * @param childData - the scenario `data` which may override values from the
 * parent scenario
 */
// eslint-disable-next-line complexity
export const extendScenarioDefinitionData = (
  parentData: NonNullable<AuthenticationTemplateScenario['data']>,
  childData: NonNullable<AuthenticationTemplateScenario['data']>
) => {
  return {
    ...parentData,
    ...childData,
    ...(parentData.bytecode === undefined && childData.bytecode === undefined
      ? {}
      : {
          bytecode: {
            ...parentData.bytecode,
            ...childData.bytecode,
          },
        }),
    ...(parentData.hdKeys === undefined && childData.hdKeys === undefined
      ? {}
      : {
          hdKeys: {
            ...parentData.hdKeys,
            ...childData.hdKeys,
            ...(parentData.hdKeys?.hdPrivateKeys === undefined &&
            childData.hdKeys?.hdPrivateKeys === undefined
              ? {}
              : {
                  hdPrivateKeys: {
                    ...parentData.hdKeys?.hdPrivateKeys,
                    ...childData.hdKeys?.hdPrivateKeys,
                  },
                }),
            ...(parentData.hdKeys?.hdPublicKeys === undefined &&
            childData.hdKeys?.hdPublicKeys === undefined
              ? {}
              : {
                  hdPublicKeys: {
                    ...parentData.hdKeys?.hdPublicKeys,
                    ...childData.hdKeys?.hdPublicKeys,
                  },
                }),
          },
        }),
    ...(parentData.keys === undefined && childData.keys === undefined
      ? {}
      : {
          keys: {
            privateKeys: {
              ...parentData.keys?.privateKeys,
              ...childData.keys?.privateKeys,
            },
          },
        }),
  };
};

/**
 * Extend a child scenario definition with values from a parent scenario
 * definition. Returns the extended values for `data`, `transaction`, and
 * `value`.
 *
 * @param parentScenario - the scenario which is extended by the child scenario
 * @param childScenario - the scenario which may override values from the parent
 * scenario
 */
// eslint-disable-next-line complexity
export const extendScenarioDefinition = <
  ParentScenarioType extends AuthenticationTemplateScenario
>(
  parentScenario: ParentScenarioType,
  childScenario: AuthenticationTemplateScenario
) => {
  return {
    ...(parentScenario.data === undefined && childScenario.data === undefined
      ? {}
      : {
          data: extendScenarioDefinitionData(
            parentScenario.data ?? {},
            childScenario.data ?? {}
          ),
        }),
    ...(parentScenario.transaction === undefined &&
    childScenario.transaction === undefined
      ? {}
      : {
          transaction: {
            ...parentScenario.transaction,
            ...childScenario.transaction,
          },
        }),
    ...(parentScenario.value === undefined && childScenario.value === undefined
      ? {}
      : { value: childScenario.value ?? parentScenario.value }),
  } as ParentScenarioType extends ExtendedScenarioDefinition
    ? ExtendedScenarioDefinition
    : ScenarioDefinition;
};

/**
 * Generate the full scenario which is extended by the provided scenario
 * identifier. Scenarios for which `extends` is `undefined` extend the default
 * scenario for the provided compilation environment.
 *
 * @param scenarioId - the identifier of the scenario for from which to select
 * the extended scenario
 * @param environment - the compilation environment from which to generate the
 * extended scenario
 * @param sourceScenarioIds - an array of scenario identifiers indicating the
 * path taken to arrive at the current scenario - used to detect and prevent
 * cycles in extending scenarios (defaults to `[]`)
 */
// eslint-disable-next-line complexity
export const generateExtendedScenario = <
  Environment extends AnyCompilationEnvironmentIgnoreOperations<
    TransactionContext
  >,
  TransactionContext
>({
  environment,
  scenarioId,
  sourceScenarioIds = [],
}: {
  environment: Environment;
  scenarioId?: string;
  sourceScenarioIds?: string[];
}): string | ExtendedScenarioDefinition => {
  if (scenarioId === undefined) {
    return generateDefaultScenarioDefinition<Environment, TransactionContext>(
      environment
    );
  }

  if (sourceScenarioIds.includes(scenarioId)) {
    return `Cannot extend scenario "${scenarioId}": scenario "${scenarioId}" extends itself. Scenario inheritance path: ${sourceScenarioIds.join(
      ' → '
    )}`;
  }
  const scenario = environment.scenarios?.[scenarioId];
  if (scenario === undefined) {
    return `Cannot extend scenario "${scenarioId}": a scenario with the identifier ${scenarioId} is not included in this compilation environment.`;
  }
  const parentScenario =
    scenario.extends === undefined
      ? generateDefaultScenarioDefinition<Environment, TransactionContext>(
          environment
        )
      : generateExtendedScenario<Environment, TransactionContext>({
          environment,
          scenarioId: scenario.extends,
          sourceScenarioIds: [...sourceScenarioIds, scenarioId],
        });
  if (typeof parentScenario === 'string') {
    return parentScenario;
  }

  return extendScenarioDefinition(parentScenario, scenario);
};

/**
 * Derive standard `CompilationData` properties from an extended scenario
 * definition.
 * @param definition - a scenario definition which has been extended by the
 * default scenario definition
 */
// eslint-disable-next-line complexity
export const extendedScenarioDefinitionToCompilationData = (
  definition: ScenarioDefinition & Required<Pick<ScenarioDefinition, 'data'>>
): CompilationData => ({
  ...(definition.data.currentBlockHeight === undefined
    ? {}
    : {
        currentBlockHeight: definition.data.currentBlockHeight,
      }),
  ...(definition.data.currentBlockTime === undefined
    ? {}
    : {
        currentBlockTime: definition.data.currentBlockTime,
      }),
  ...(definition.data.hdKeys === undefined
    ? {}
    : {
        hdKeys: {
          ...(definition.data.hdKeys.addressIndex === undefined
            ? {}
            : {
                addressIndex: definition.data.hdKeys.addressIndex,
              }),
          ...(definition.data.hdKeys.hdPrivateKeys !== undefined &&
          Object.keys(definition.data.hdKeys.hdPrivateKeys).length > 0
            ? {
                hdPrivateKeys: definition.data.hdKeys.hdPrivateKeys,
              }
            : {}),
          ...(definition.data.hdKeys.hdPublicKeys === undefined
            ? {}
            : {
                hdPublicKeys: definition.data.hdKeys.hdPublicKeys,
              }),
        },
      }),
  ...(definition.data.keys?.privateKeys !== undefined &&
  Object.keys(definition.data.keys.privateKeys).length > 0
    ? {
        keys: {
          privateKeys: Object.entries(definition.data.keys.privateKeys).reduce(
            (all, [id, hex]) => ({ ...all, [id]: hexToBin(hex) }),
            {}
          ),
        },
      }
    : {}),
});

/**
 * Extend a `CompilationData` object with the compiled result of the bytecode
 * scripts provided by a `AuthenticationTemplateScenarioData`.
 *
 * @param compilationData - the compilation data to extend
 * @param environment - the compilation environment in which to compile the
 * scripts
 * @param scenarioDataBytecodeScripts - the `data.bytecode` property of an
 * `AuthenticationTemplateScenarioData`
 */
export const extendCompilationDataWithScenarioBytecode = <
  Environment extends AnyCompilationEnvironmentIgnoreOperations<
    TransactionContext
  >,
  TransactionContext
>({
  compilationData,
  environment,
  scenarioDataBytecodeScripts,
}: {
  compilationData: CompilationData<TransactionContext>;
  environment: Environment;
  scenarioDataBytecodeScripts: NonNullable<
    AuthenticationTemplateScenarioData['bytecode']
  >;
}) => {
  const prefixBytecodeScriptId = (id: string) =>
    `${CompilerDefaults.scenarioBytecodeScriptPrefix}${id}`;
  const bytecodeScripts = Object.entries(scenarioDataBytecodeScripts).reduce<{
    [bytecodeScriptIdentifier: string]: string;
  }>((all, [id, script]) => {
    return {
      ...all,
      [prefixBytecodeScriptId(id)]: script,
    };
  }, {});

  const bytecodeScriptExtendedEnvironment: Environment = {
    ...environment,
    scripts: {
      ...environment.scripts,
      ...bytecodeScripts,
    },
  };

  const bytecodeCompilations: (
    | {
        bytecode: Uint8Array;
        id: string;
      }
    | {
        errors: [CompilationError] | CompilationError[];
        id: string;
      }
  )[] = Object.keys(scenarioDataBytecodeScripts).map((id) => {
    const result = compileScriptRaw({
      data: compilationData,
      environment: bytecodeScriptExtendedEnvironment,
      scriptId: prefixBytecodeScriptId(id),
    });
    if (result.success) {
      return {
        bytecode: result.bytecode,
        id,
      };
    }
    return {
      errors: result.errors,
      id,
    };
  });

  const failedResults = bytecodeCompilations.filter(
    (
      result
    ): result is {
      errors: [CompilationError] | CompilationError[];
      id: string;
    } => 'errors' in result
  );
  if (failedResults.length > 0) {
    return `${failedResults
      .map(
        (result) =>
          `Compilation error while generating bytecode for "${
            result.id
          }": ${stringifyErrors(result.errors)}`
      )
      .join('; ')}`;
  }

  const compiledBytecode = (bytecodeCompilations as {
    bytecode: Uint8Array;
    id: string;
  }[]).reduce<{
    [fullIdentifier: string]: Uint8Array;
  }>((all, result) => ({ ...all, [result.id]: result.bytecode }), {});

  return {
    ...(Object.keys(compiledBytecode).length > 0
      ? { bytecode: compiledBytecode }
      : {}),
    ...compilationData,
  } as CompilationData<TransactionContext>;
};

/**
 * The default `lockingBytecode` value for scenario outputs is a new empty
 * object (`{}`).
 */
const getScenarioOutputDefaultLockingBytecode = () => ({});

/**
 * Generate a scenario given a compilation environment. If neither `scenarioId`
 * or `unlockingScriptId` are provided, the default scenario for the compilation
 * environment will be generated.
 *
 * Returns either the full `CompilationData` for the selected scenario or an
 * error message (as a `string`).
 *
 * @param scenarioId - the ID of the scenario to generate – if `undefined`, the
 * default scenario
 * @param unlockingScriptId - the ID of the unlocking script under test by this
 * scenario – if `undefined` but required by the scenario, an error will be
 * produced
 * @param environment - the compilation environment from which to generate the
 * scenario
 */
// eslint-disable-next-line complexity
export const generateScenarioCommon = <
  Environment extends AnyCompilationEnvironmentIgnoreOperations
>({
  environment,
  scenarioId,
  unlockingScriptId,
}: {
  environment: Environment;
  scenarioId?: string;
  unlockingScriptId?: string;
}): Scenario | string => {
  const { scenario, scenarioName } =
    scenarioId === undefined
      ? { scenario: {}, scenarioName: `the default scenario` }
      : {
          scenario: environment.scenarios?.[scenarioId],
          scenarioName: `scenario "${scenarioId}"`,
        };

  if (scenario === undefined) {
    return `Cannot generate ${scenarioName}: a scenario with the identifier ${
      scenarioId as string
    } is not included in this compilation environment.`;
  }

  const parentScenario = generateExtendedScenario<
    Environment,
    TransactionContextCommon
  >({ environment, scenarioId });
  if (typeof parentScenario === 'string') {
    return `Cannot generate ${scenarioName}: ${parentScenario}`;
  }

  const extendedScenario = extendScenarioDefinition(parentScenario, scenario);
  const partialCompilationData = extendedScenarioDefinitionToCompilationData(
    extendedScenario
  );
  const fullCompilationData = extendCompilationDataWithScenarioBytecode({
    compilationData: partialCompilationData,
    environment,
    scenarioDataBytecodeScripts: extendedScenario.data.bytecode ?? {},
  });

  if (typeof fullCompilationData === 'string') {
    return `Cannot generate ${scenarioName}: ${fullCompilationData}`;
  }

  const testedInputs = extendedScenario.transaction.inputs.filter(
    (input) => input.unlockingBytecode === null
  );
  if (testedInputs.length !== 1) {
    return `Cannot generate ${scenarioName}: the specific input under test in this scenario is ambiguous – "transaction.inputs" must include exactly one input which has "unlockingBytecode" set to "null".`;
  }
  const testedInputIndex = extendedScenario.transaction.inputs.findIndex(
    (input) => input.unlockingBytecode === null
  );

  const outputs = extendedScenario.transaction.outputs.map<
    Required<AuthenticationTemplateScenarioOutput>
  >((output) => ({
    lockingBytecode:
      output.lockingBytecode ?? getScenarioOutputDefaultLockingBytecode(),
    satoshis: output.satoshis ?? CompilerDefaults.defaultScenarioOutputSatoshis,
  }));

  const compiledOutputResults = outputs.map<string | Output>(
    // eslint-disable-next-line complexity
    (output, index) => {
      const satoshis =
        typeof output.satoshis === 'string'
          ? hexToBin(output.satoshis)
          : bigIntToBinUint64LE(BigInt(output.satoshis));
      if (typeof output.lockingBytecode === 'string') {
        return {
          lockingBytecode: hexToBin(output.lockingBytecode),
          satoshis,
        };
      }

      const specifiedLockingScriptId = output.lockingBytecode.script;
      const impliedLockingScriptId =
        unlockingScriptId === undefined
          ? undefined
          : environment.unlockingScripts?.[unlockingScriptId];
      const scriptId =
        typeof specifiedLockingScriptId === 'string'
          ? specifiedLockingScriptId
          : impliedLockingScriptId;

      if (scriptId === undefined) {
        if (unlockingScriptId === undefined) {
          return `Cannot generate locking bytecode for output ${index}: this output is set to use the script unlocked by the unlocking script under test, but an unlocking script ID was not provided for scenario generation.`;
        }
        return `Cannot generate locking bytecode for output ${index}: the locking script unlocked by "${unlockingScriptId}" is not provided in this compilation environment.`;
      }

      const overriddenDataDefinition =
        output.lockingBytecode.overrides === undefined
          ? undefined
          : extendScenarioDefinitionData(
              extendedScenario.data,
              output.lockingBytecode.overrides
            );

      const overriddenCompilationData =
        overriddenDataDefinition === undefined
          ? undefined
          : extendCompilationDataWithScenarioBytecode({
              compilationData: extendedScenarioDefinitionToCompilationData({
                data: overriddenDataDefinition,
              }),
              environment,
              scenarioDataBytecodeScripts:
                overriddenDataDefinition.bytecode ?? {},
            });

      if (typeof overriddenCompilationData === 'string') {
        return `Cannot generate locking bytecode for output ${index}: ${overriddenCompilationData}`;
      }

      const data =
        overriddenCompilationData === undefined
          ? fullCompilationData
          : overriddenCompilationData;

      const result = compileScript(scriptId, data, environment);

      if (!result.success) {
        return `Cannot generate locking bytecode for output ${index}: ${stringifyErrors(
          result.errors
        )}`;
      }

      return { lockingBytecode: result.bytecode, satoshis };
    }
  );

  const outputCompilationErrors = compiledOutputResults.filter(
    (result): result is string => typeof result === 'string'
  );
  if (outputCompilationErrors.length > 0) {
    return `Cannot generate ${scenarioName}: ${outputCompilationErrors.join(
      '; '
    )}`;
  }
  const compiledOutputs = compiledOutputResults as Output[];

  const sourceSatoshis =
    typeof extendedScenario.value === 'number'
      ? bigIntToBinUint64LE(BigInt(extendedScenario.value))
      : hexToBin(extendedScenario.value);

  const unlockingBytecodeUnderTest = undefined;
  return {
    data: fullCompilationData,
    program: {
      inputIndex: testedInputIndex,
      sourceOutput: { satoshis: sourceSatoshis },
      spendingTransaction: {
        // eslint-disable-next-line complexity
        inputs: extendedScenario.transaction.inputs.map((input) => ({
          outpointIndex:
            input.outpointIndex ??
            CompilerDefaults.defaultScenarioInputOutpointIndex,
          outpointTransactionHash: hexToBin(
            input.outpointTransactionHash ??
              CompilerDefaults.defaultScenarioInputOutpointTransactionHash
          ),
          sequenceNumber:
            input.sequenceNumber ??
            CompilerDefaults.defaultScenarioInputSequenceNumber,
          unlockingBytecode:
            input.unlockingBytecode === null
              ? unlockingBytecodeUnderTest
              : hexToBin(
                  typeof input.unlockingBytecode === 'string'
                    ? input.unlockingBytecode
                    : CompilerDefaults.defaultScenarioInputUnlockingBytecodeHex
                ),
        })),
        locktime: extendedScenario.transaction.locktime,
        outputs: compiledOutputs,
        version: extendedScenario.transaction.version,
      },
    },
  };
};
