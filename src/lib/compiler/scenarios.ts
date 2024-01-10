/* eslint-disable max-lines */
import {
  bigIntToBinUint256BEClamped,
  binToHex,
  binToValueSatoshis,
  hexToBin,
} from '../format/format.js';
import { deriveHdPrivateNodeFromSeed, encodeHdPrivateKey } from '../key/key.js';
import { compileScriptRaw, stringifyErrors } from '../language/language.js';
import type {
  AnyCompilerConfigurationIgnoreOperations,
  CompilationContextBCH,
  CompilationData,
  CompilationError,
  CompilationResult,
  CompilationResultSuccess,
  Compiler,
  Output,
  Scenario,
  ScenarioGenerationDebuggingResult,
  WalletTemplateKey,
  WalletTemplateScenario,
  WalletTemplateScenarioBytecode,
  WalletTemplateScenarioData,
  WalletTemplateScenarioOutput,
} from '../lib.js';

import { CompilerDefaults } from './compiler-defaults.js';

/**
 * The contents of an {@link WalletTemplateScenario} without the `name`
 * and `description`.
 */
export type ScenarioDefinition = Pick<
  WalletTemplateScenario,
  'data' | 'sourceOutputs' | 'transaction'
>;

type RequiredTwoLevels<T> = {
  [P in keyof T]-?: Required<T[P]>;
};

/**
 * A scenario definition produced when a child scenario `extends` a parent
 * scenario; this "extended" scenario definition is the same as the parent
 * scenario definition, but any properties defined in the child scenario
 * definition replace those found in the parent scenario definition.
 *
 * All scenarios extend the default scenario, so the `data`, `transaction` (and
 * all `transaction` properties), and `sourceOutputs` properties are guaranteed
 * to be defined in any extended scenario definition.
 */
export type ExtendedScenarioDefinition = Required<
  Pick<ScenarioDefinition, 'data'>
> &
  Required<Pick<ScenarioDefinition, 'sourceOutputs'>> &
  RequiredTwoLevels<Pick<ScenarioDefinition, 'transaction'>>;

/**
 * Given a compiler configuration, generate the default scenario that is
 * extended by all the configuration's scenarios.
 *
 * For details on default scenario generation, see
 * {@link WalletTemplateScenario.extends}.
 *
 * @param configuration - the compiler configuration from which to generate the
 * default scenario
 */
// eslint-disable-next-line complexity
export const generateDefaultScenarioDefinition = <
  Configuration extends
    AnyCompilerConfigurationIgnoreOperations<CompilationContext>,
  CompilationContext,
>(
  configuration: Configuration,
): ExtendedScenarioDefinition | string => {
  const { variables, entityOwnership } = configuration;

  const keyVariableIds =
    variables === undefined
      ? []
      : Object.entries(variables)
          .filter(
            (entry): entry is [string, WalletTemplateKey] =>
              entry[1].type === 'Key',
          )
          .map(([id]) => id);

  const entityIds =
    entityOwnership === undefined
      ? []
      : Object.keys(
          Object.values(entityOwnership).reduce(
            (all, entityId) => ({ ...all, [entityId]: true }),
            {},
          ),
        );

  const valueMap = [...keyVariableIds, ...entityIds]
    .sort((idA, idB) => idA.localeCompare(idB, 'en'))
    .reduce<{ [variableOrEntityId: string]: Uint8Array }>(
      (all, id, index) => ({
        ...all,
        [id]: bigIntToBinUint256BEClamped(BigInt(index + 1)),
      }),
      {},
    );

  const privateKeys =
    variables === undefined
      ? undefined
      : Object.entries(variables).reduce<{ [id: string]: string }>(
          (all, [variableId, variable]) =>
            variable.type === 'Key'
              ? {
                  ...all,
                  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                  [variableId]: binToHex(valueMap[variableId]!),
                }
              : all,
          {},
        );

  const defaultScenario: ExtendedScenarioDefinition = {
    data: {
      currentBlockHeight:
        CompilerDefaults.defaultScenarioCurrentBlockHeight as const,
      currentBlockTime:
        CompilerDefaults.defaultScenarioCurrentBlockTime as const,
      ...(privateKeys === undefined || Object.keys(privateKeys).length === 0
        ? {}
        : { keys: { privateKeys } }),
    },
    sourceOutputs: [{ lockingBytecode: ['slot'] }],
    transaction: {
      inputs: [{ unlockingBytecode: ['slot'] }],
      locktime: CompilerDefaults.defaultScenarioTransactionLocktime as const,
      outputs: [
        {
          lockingBytecode:
            CompilerDefaults.defaultScenarioOutputLockingBytecode as string,
        },
      ],
      version: CompilerDefaults.defaultScenarioTransactionVersion as const,
    },
  };

  const hasHdKeys =
    variables === undefined
      ? false
      : Object.values(variables).findIndex(
          (variable) => variable.type === 'HdKey',
        ) !== -1;

  if (!hasHdKeys) {
    return defaultScenario;
  }

  const { sha256, sha512 } = configuration;
  if (sha256 === undefined) {
    return 'An implementations of "sha256" is required to generate defaults for HD keys, but the "sha256" property is not included in this compiler configuration.';
  }
  if (sha512 === undefined) {
    return 'An implementations of "sha512" is required to generate defaults for HD keys, but the "sha512" property is not included in this compiler configuration.';
  }
  const crypto = { sha256, sha512 };

  const hdPrivateKeys = entityIds.reduce((all, entityId) => {
    /**
     * The first 5,000,000,000 seeds have been tested, scenarios are
     * unlikely to exceed this number of entities.
     */
    const assumeValid = true;
    const masterNode = deriveHdPrivateNodeFromSeed(
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      valueMap[entityId]!,
      assumeValid,
      crypto,
    );
    const hdPrivateKey = encodeHdPrivateKey(
      {
        network: 'mainnet',
        node: masterNode,
      },
      crypto,
    );

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
 * @param parentData - the scenario `data` that is extended by the child
 * scenario
 * @param childData - the scenario `data` that may override values from the
 * parent scenario
 */
// eslint-disable-next-line complexity
export const extendScenarioDefinitionData = (
  parentData: NonNullable<WalletTemplateScenario['data']>,
  childData: NonNullable<WalletTemplateScenario['data']>,
) => ({
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
});

/**
 * Extend a child scenario definition with values from a parent scenario
 * definition. Returns the extended values for `data`, `transaction`, and
 * `value`.
 *
 * @param parentScenario - the scenario that is extended by the child scenario
 * @param childScenario - the scenario that may override values from the parent
 * scenario
 */
// eslint-disable-next-line complexity
export const extendScenarioDefinition = <
  ParentScenarioType extends WalletTemplateScenario,
>(
  parentScenario: ParentScenarioType,
  childScenario: WalletTemplateScenario,
) =>
  ({
    ...(parentScenario.data === undefined && childScenario.data === undefined
      ? {}
      : {
          data: extendScenarioDefinitionData(
            parentScenario.data ?? {},
            childScenario.data ?? {},
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
    ...(parentScenario.sourceOutputs === undefined &&
    childScenario.sourceOutputs === undefined
      ? {}
      : {
          sourceOutputs:
            childScenario.sourceOutputs ?? parentScenario.sourceOutputs,
        }),
  }) as ParentScenarioType extends ExtendedScenarioDefinition
    ? ExtendedScenarioDefinition
    : ScenarioDefinition;

/**
 * Generate the full scenario that is extended by the provided scenario
 * identifier. Scenarios for which `extends` is `undefined` extend the default
 * scenario for the provided compiler configuration.
 */
// eslint-disable-next-line complexity
export const generateExtendedScenario = <
  Configuration extends
    AnyCompilerConfigurationIgnoreOperations<CompilationContext>,
  CompilationContext,
>({
  configuration,
  scenarioId,
  sourceScenarioIds = [],
}: {
  /**
   * The compiler configuration from which to generate the extended scenario
   */
  configuration: Configuration;
  /**
   * The identifier of the scenario from which to generate the extended scenario
   */
  scenarioId?: string | undefined;
  /**
   * an array of scenario identifiers indicating the path taken to arrive at the
   * current scenario - used to detect and prevent cycles in extending scenarios
   * (defaults to `[]`)
   */
  sourceScenarioIds?: string[];
}): ExtendedScenarioDefinition | string => {
  if (scenarioId === undefined) {
    return generateDefaultScenarioDefinition<Configuration, CompilationContext>(
      configuration,
    );
  }

  if (sourceScenarioIds.includes(scenarioId)) {
    return `Cannot extend scenario "${scenarioId}": scenario "${scenarioId}" extends itself. Scenario inheritance path: ${sourceScenarioIds.join(
      ' → ',
    )}`;
  }
  const scenario = configuration.scenarios?.[scenarioId];
  if (scenario === undefined) {
    return `Cannot extend scenario "${scenarioId}": a scenario with the identifier ${scenarioId} is not included in this compiler configuration.`;
  }
  const parentScenario =
    scenario.extends === undefined
      ? generateDefaultScenarioDefinition<Configuration, CompilationContext>(
          configuration,
        )
      : generateExtendedScenario<Configuration, CompilationContext>({
          configuration,
          scenarioId: scenario.extends,
          sourceScenarioIds: [...sourceScenarioIds, scenarioId],
        });
  if (typeof parentScenario === 'string') {
    return parentScenario;
  }

  return extendScenarioDefinition(parentScenario, scenario);
};

/**
 * Derive standard {@link CompilationData} properties from an extended scenario
 * definition.
 *
 * @param definition - a scenario definition that has been extended by the
 * default scenario definition
 */
// eslint-disable-next-line complexity
export const extendedScenarioDefinitionToCompilationData = (
  definition: Required<Pick<ScenarioDefinition, 'data'>> & ScenarioDefinition,
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
            {},
          ),
        },
      }
    : {}),
});

/**
 * Extend a {@link CompilationData} object with the compiled result of the
 * bytecode scripts provided by an {@link WalletTemplateScenarioData}.
 */
export const extendCompilationDataWithScenarioBytecode = <
  Configuration extends
    AnyCompilerConfigurationIgnoreOperations<CompilationContext>,
  CompilationContext,
>({
  compilationData,
  configuration,
  scenarioDataBytecodeScripts,
}: {
  /**
   * The compilation data to extend.
   */
  compilationData: CompilationData<CompilationContext>;
  /**
   * The compiler configuration in which to compile the scripts.
   */
  configuration: Configuration;
  /**
   * The {@link WalletTemplateScenarioData.bytecode} property.
   */
  scenarioDataBytecodeScripts: NonNullable<
    WalletTemplateScenarioData['bytecode']
  >;
}) => {
  const prefixBytecodeScriptId = (id: string) =>
    `${CompilerDefaults.scenarioBytecodeScriptPrefix}${id}`;
  const bytecodeScripts = Object.entries(scenarioDataBytecodeScripts).reduce<{
    [bytecodeScriptIdentifier: string]: string;
  }>(
    (all, [id, script]) => ({
      ...all,
      [prefixBytecodeScriptId(id)]: script,
    }),
    {},
  );

  const bytecodeScriptExtendedConfiguration: Configuration = {
    ...configuration,
    scripts: {
      ...configuration.scripts,
      ...bytecodeScripts,
    },
  };

  const bytecodeCompilations: (
    | {
        bytecode: Uint8Array;
        id: string;
      }
    | {
        errors: CompilationError[] | [CompilationError];
        id: string;
      }
  )[] = Object.keys(scenarioDataBytecodeScripts).map((id) => {
    const result = compileScriptRaw({
      configuration: bytecodeScriptExtendedConfiguration,
      data: compilationData,
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
      result,
    ): result is {
      errors: CompilationError[] | [CompilationError];
      id: string;
    } => 'errors' in result,
  );
  if (failedResults.length > 0) {
    return failedResults
      .map(
        (result) =>
          `Compilation error while generating bytecode for "${
            result.id
          }": ${stringifyErrors(result.errors)}`,
      )
      .join('; ');
  }

  const compiledBytecode = (
    bytecodeCompilations as {
      bytecode: Uint8Array;
      id: string;
    }[]
  ).reduce<{ [fullIdentifier: string]: Uint8Array }>(
    (all, result) => ({ ...all, [result.id]: result.bytecode }),
    {},
  );

  return {
    ...(Object.keys(compiledBytecode).length > 0
      ? { bytecode: compiledBytecode }
      : {}),
    ...compilationData,
  } as CompilationData<CompilationContext>;
};

/**
 * Compile a {@link WalletTemplateScenarioOutput.valueSatoshis},
 * returning the `Uint8Array` result.
 */
export const compileWalletTemplateScenarioValueSatoshis = (
  valueSatoshisDefinition: WalletTemplateScenarioOutput<boolean>['valueSatoshis'] = CompilerDefaults.defaultScenarioOutputValueSatoshis,
) =>
  typeof valueSatoshisDefinition === 'string'
    ? binToValueSatoshis(hexToBin(valueSatoshisDefinition))
    : BigInt(valueSatoshisDefinition);

/**
 * Compile an {@link WalletTemplateScenarioBytecode} definition for an
 * {@link WalletTemplateScenario}, returning either a
 * simple `Uint8Array` result or a full CashAssembly {@link CompilationResult}.
 */
// eslint-disable-next-line complexity
export const compileWalletTemplateScenarioBytecode = <
  Configuration extends AnyCompilerConfigurationIgnoreOperations,
  GenerateBytecode extends Compiler<
    CompilationContextBCH,
    Configuration,
    ProgramState
  >['generateBytecode'],
  ProgramState,
>({
  bytecodeDefinition,
  compilationContext,
  configuration,
  defaultOverride,
  extendedScenario,
  generateBytecode,
  lockingOrUnlockingScriptIdUnderTest,
}: {
  bytecodeDefinition: WalletTemplateScenarioBytecode;
  compilationContext?: CompilationContextBCH;
  configuration: Configuration;
  extendedScenario: ExtendedScenarioDefinition;
  defaultOverride: WalletTemplateScenarioData;
  generateBytecode: GenerateBytecode;
  lockingOrUnlockingScriptIdUnderTest?: string;
}):
  | CompilationResult<ProgramState>
  | Uint8Array
  | { errors: [{ error: string }]; success: false } => {
  if (typeof bytecodeDefinition === 'string') {
    return hexToBin(bytecodeDefinition);
  }

  const scriptId =
    bytecodeDefinition.script === undefined ||
    Array.isArray(bytecodeDefinition.script)
      ? lockingOrUnlockingScriptIdUnderTest
      : bytecodeDefinition.script;

  /**
   * The script ID to compile. If `undefined`, we are attempting to "copy" the
   * script ID in a scenario generation that does not define a locking or
   * unlocking script under test (e.g. the scenario is only used for debugging
   * values in an editor) - in these cases, simply return an empty `Uint8Array`.
   */
  if (scriptId === undefined) {
    return hexToBin('');
  }

  const overrides = bytecodeDefinition.overrides ?? defaultOverride;
  const overriddenDataDefinition = extendScenarioDefinitionData(
    extendedScenario.data,
    overrides,
  );
  const data = extendCompilationDataWithScenarioBytecode({
    compilationData: extendedScenarioDefinitionToCompilationData({
      data: overriddenDataDefinition,
    }),
    configuration,
    scenarioDataBytecodeScripts: overriddenDataDefinition.bytecode ?? {},
  });

  if (typeof data === 'string') {
    const error = `Could not compile scenario "data.bytecode": ${data}`;
    return { errors: [{ error }], success: false };
  }

  return generateBytecode({
    data: { ...data, compilationContext },
    debug: true,
    scriptId,
  });
};

/**
 * Compile a {@link WalletTemplateScenarioOutput.token},
 * returning the {@link Output.token} result.
 */
// eslint-disable-next-line complexity
export const compileScenarioOutputTokenData = (
  output: WalletTemplateScenarioOutput<boolean>,
): Pick<Output, 'token'> =>
  output.token === undefined
    ? {}
    : {
        token: {
          amount: BigInt(output.token.amount ?? 0),
          // TODO: doesn't verify length
          category: hexToBin(
            output.token.category ??
              CompilerDefaults.defaultScenarioOutputTokenCategory,
          ),
          ...(output.token.nft === undefined
            ? {}
            : {
                nft: {
                  capability: output.token.nft.capability ?? 'none',
                  commitment: hexToBin(output.token.nft.commitment ?? ''),
                },
              }),
        },
      };

/**
 * Generate a scenario given a compiler configuration. If neither `scenarioId`
 * or `unlockingScriptId` are provided, the default scenario for the compiler
 * configuration will be generated.
 *
 * Returns either the full `CompilationData` for the selected scenario or an
 * error message (as a `string`).
 *
 * Note, this method should typically not be used directly, use
 * {@link Compiler.generateScenario} instead.
 */
// eslint-disable-next-line complexity
export const generateScenarioBCH = <
  Configuration extends AnyCompilerConfigurationIgnoreOperations,
  GenerateBytecode extends Compiler<
    CompilationContextBCH,
    Configuration,
    ProgramState
  >['generateBytecode'],
  ProgramState,
  Debug extends boolean,
>(
  {
    configuration,
    generateBytecode,
    scenarioId,
    unlockingScriptId,
    lockingScriptId: providedLockingScriptId,
  }: {
    /**
     * The compiler configuration from which to generate the scenario.
     */
    configuration: Configuration;

    generateBytecode: GenerateBytecode;
    /**
     * The ID of the scenario to generate. If `undefined`, the default scenario.
     */
    scenarioId?: string | undefined;
    /**
     * The ID of the unlocking script under test by this scenario. If
     * `undefined` but required by the scenario, an error will be produced.
     */
    unlockingScriptId?: string | undefined;

    /**
     * If this scenario does not require an `unlockingScriptId` (an "isolated"
     * locking script with no defined unlocking scripts), the ID of the locking
     * script to generate for this scenario.
     *
     * If `unlockingScriptId` is defined, the locking script ID will be read
     * from `configuration`, and an error will be produced if `lockingScriptId`
     * is also defined.
     */
    lockingScriptId?: string | undefined;
  },
  debug?: Debug,
):
  | string
  | (Debug extends true
      ? ScenarioGenerationDebuggingResult<ProgramState>
      : Scenario) => {
  const { scenarioDefinition, scenarioName } =
    scenarioId === undefined
      ? { scenarioDefinition: {}, scenarioName: `the default scenario` }
      : {
          scenarioDefinition: configuration.scenarios?.[scenarioId],
          scenarioName: `scenario "${scenarioId}"`,
        };

  if (scenarioDefinition === undefined) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return `Cannot generate ${scenarioName}: a scenario definition with the identifier ${scenarioId!} is not included in this compiler configuration.`;
  }

  const parentScenario = generateExtendedScenario<
    Configuration,
    CompilationContextBCH
  >({ configuration, scenarioId });
  if (typeof parentScenario === 'string') {
    return `Cannot generate ${scenarioName}: ${parentScenario}`;
  }

  const extendedScenario = extendScenarioDefinition(
    parentScenario,
    scenarioDefinition,
  );
  const partialCompilationData =
    extendedScenarioDefinitionToCompilationData(extendedScenario);
  const fullCompilationData = extendCompilationDataWithScenarioBytecode({
    compilationData: partialCompilationData,
    configuration,
    scenarioDataBytecodeScripts: extendedScenario.data.bytecode ?? {},
  });

  if (typeof fullCompilationData === 'string') {
    return `Cannot generate ${scenarioName}. ${fullCompilationData}`;
  }

  if (
    extendedScenario.transaction.inputs.length !==
    extendedScenario.sourceOutputs.length
  ) {
    return `Cannot generate ${scenarioName}: could not match source outputs with inputs - "sourceOutputs" must be the same length as "transaction.inputs".`;
  }

  const testedInputs = extendedScenario.transaction.inputs.filter((input) =>
    Array.isArray(input.unlockingBytecode),
  );
  if (testedInputs.length !== 1) {
    return `Cannot generate ${scenarioName}: the specific input under test in this scenario is ambiguous - "transaction.inputs" must include exactly one input that has "unlockingBytecode" set to ["slot"].`;
  }
  const testedInputIndex = extendedScenario.transaction.inputs.findIndex(
    (input) => Array.isArray(input.unlockingBytecode),
  );

  const testedSourceOutputs = extendedScenario.sourceOutputs.filter((output) =>
    Array.isArray(output.lockingBytecode),
  );
  if (testedSourceOutputs.length !== 1) {
    return `Cannot generate ${scenarioName}: the source output unlocked by the input under test in this scenario is ambiguous - "sourceOutputs" must include exactly one output that has "lockingBytecode" set to ["slot"].`;
  }

  if (
    !Array.isArray(
      extendedScenario.sourceOutputs[testedInputIndex]?.lockingBytecode,
    )
  ) {
    return `Cannot generate ${scenarioName}: the source output unlocked by the input under test in this scenario is ambiguous - the ["slot"] in "transaction.inputs" and "sourceOutputs" must be at the same index.`;
  }

  if (
    unlockingScriptId !== undefined &&
    providedLockingScriptId !== undefined
  ) {
    return `Cannot generate ${scenarioName}: a scenario cannot be generated with both unlocking and locking script IDs defined. If an unlocking script is provided, the associated locking script ID must be read from the template.`;
  }

  const lockingScriptId =
    providedLockingScriptId ??
    (unlockingScriptId === undefined
      ? undefined
      : configuration.unlockingScripts?.[unlockingScriptId]);

  if (unlockingScriptId !== undefined && lockingScriptId === undefined) {
    return `Cannot generate ${scenarioName} using unlocking script "${unlockingScriptId}": the locking script unlocked by "${unlockingScriptId}" is not provided in this compiler configuration.`;
  }

  const sourceOutputCompilations = extendedScenario.sourceOutputs.map(
    (sourceOutput, index) => {
      const slot = Array.isArray(sourceOutput.lockingBytecode);
      const bytecodeDefinition = slot
        ? lockingScriptId === undefined
          ? (CompilerDefaults.defaultScenarioBytecode as string)
          : { script: lockingScriptId }
        : sourceOutput.lockingBytecode ?? {};
      const defaultOverride = {};
      return {
        compiled: {
          lockingBytecode: compileWalletTemplateScenarioBytecode({
            bytecodeDefinition,
            configuration,
            defaultOverride,
            extendedScenario,
            generateBytecode,
            lockingOrUnlockingScriptIdUnderTest: lockingScriptId,
          }),
          valueSatoshis: compileWalletTemplateScenarioValueSatoshis(
            sourceOutput.valueSatoshis,
          ),
          ...compileScenarioOutputTokenData(sourceOutput),
        },
        index,
        slot,
        type: 'source output' as const,
      };
    },
  );

  const lockingCompilation = sourceOutputCompilations.find(
    (compilation) => compilation.slot,
  )?.compiled.lockingBytecode as CompilationResult<ProgramState>;

  const transactionOutputCompilations =
    extendedScenario.transaction.outputs.map((transactionOutput, index) => {
      const defaultOverride = { hdKeys: { addressIndex: 1 } };
      return {
        compiled: {
          lockingBytecode: compileWalletTemplateScenarioBytecode({
            bytecodeDefinition: transactionOutput.lockingBytecode ?? {},
            configuration,
            defaultOverride,
            extendedScenario,
            generateBytecode,
            lockingOrUnlockingScriptIdUnderTest: lockingScriptId,
          }),
          valueSatoshis: compileWalletTemplateScenarioValueSatoshis(
            transactionOutput.valueSatoshis,
          ),
          ...compileScenarioOutputTokenData(transactionOutput),
        },
        index,
        type: 'transaction output' as const,
      };
    });

  const outputCompilationErrors = [
    ...sourceOutputCompilations,
    ...transactionOutputCompilations,
  ].reduce<string[]>((accumulated, result) => {
    if ('errors' in result.compiled.lockingBytecode) {
      return [
        ...accumulated,
        ...result.compiled.lockingBytecode.errors.map(
          (errorObject) =>
            `Failed compilation of ${result.type} at index ${result.index}: ${errorObject.error}`,
        ),
      ];
    }
    return accumulated;
  }, []);

  if (outputCompilationErrors.length > 0) {
    const error = `Cannot generate ${scenarioName}: ${outputCompilationErrors.join(
      ' ',
    )}`;
    if (debug === true) {
      return {
        lockingCompilation,
        scenario: error,
      } as Debug extends true
        ? ScenarioGenerationDebuggingResult<ProgramState>
        : Scenario;
    }
    return error;
  }
  const sourceOutputCompilationsSuccess =
    sourceOutputCompilations as WalletTemplateScenarioOutputSuccessfulCompilation[];
  const transactionOutputCompilationsSuccess =
    transactionOutputCompilations as WalletTemplateScenarioOutputSuccessfulCompilation[];

  type WalletTemplateScenarioOutputSuccessfulCompilation = {
    compiled: {
      lockingBytecode: CompilationResultSuccess<ProgramState> | Uint8Array;
      valueSatoshis: bigint;
      token?: Output['token'];
    };
    index: number;
    slot?: boolean;
    type: string;
  };

  const extractOutput = (
    compilation: WalletTemplateScenarioOutputSuccessfulCompilation,
  ) => {
    const { lockingBytecode, valueSatoshis, token } = compilation.compiled;
    return {
      lockingBytecode:
        'bytecode' in lockingBytecode
          ? lockingBytecode.bytecode
          : lockingBytecode,
      valueSatoshis,
      ...(token === undefined ? {} : { token }),
    };
  };

  const sourceOutputs = sourceOutputCompilationsSuccess.map(extractOutput);
  const outputs = transactionOutputCompilationsSuccess.map(extractOutput);

  const inputsContext = extendedScenario.transaction.inputs.map(
    (input, inputIndex) => ({
      outpointIndex: input.outpointIndex ?? inputIndex,
      // TODO: doesn't verify length
      outpointTransactionHash: hexToBin(
        input.outpointTransactionHash ??
          CompilerDefaults.defaultScenarioInputOutpointTransactionHash,
      ),
      sequenceNumber:
        input.sequenceNumber ??
        CompilerDefaults.defaultScenarioInputSequenceNumber,
      unlockingBytecode: undefined,
    }),
  );

  const transactionInputCompilations = extendedScenario.transaction.inputs.map(
    (input, index) => {
      const slot = Array.isArray(input.unlockingBytecode);
      const bytecodeDefinition = Array.isArray(input.unlockingBytecode)
        ? unlockingScriptId === undefined
          ? (CompilerDefaults.defaultScenarioBytecode as string)
          : { script: unlockingScriptId }
        : input.unlockingBytecode ?? {};
      const defaultOverride = {};
      return {
        compiled: {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          outpointIndex: inputsContext[index]!.outpointIndex,
          outpointTransactionHash:
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            inputsContext[index]!.outpointTransactionHash,
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          sequenceNumber: inputsContext[index]!.sequenceNumber,
          unlockingBytecode: compileWalletTemplateScenarioBytecode({
            bytecodeDefinition,
            compilationContext: {
              inputIndex: index,
              sourceOutputs,
              transaction: {
                inputs: inputsContext,
                locktime: extendedScenario.transaction.locktime,
                outputs,
                version: extendedScenario.transaction.version,
              },
            },
            configuration,
            defaultOverride,
            extendedScenario,
            generateBytecode,
            lockingOrUnlockingScriptIdUnderTest: unlockingScriptId,
          }),
        },
        index,
        slot,
      };
    },
  );

  const unlockingCompilation = transactionInputCompilations.find(
    (compilation) => compilation.slot,
  )?.compiled.unlockingBytecode as CompilationResult<ProgramState>;

  type WalletTemplateScenarioInputSuccessfulCompilation = {
    compiled: {
      outpointIndex: number;
      outpointTransactionHash: Uint8Array;
      sequenceNumber: number;
      unlockingBytecode: CompilationResultSuccess<ProgramState> | Uint8Array;
    };
    index: number;
    slot?: boolean;
    type: string;
  };

  const inputCompilationErrors = transactionInputCompilations.reduce<string[]>(
    (accumulated, result) => {
      if ('errors' in result.compiled.unlockingBytecode) {
        return [
          ...accumulated,
          ...result.compiled.unlockingBytecode.errors.map(
            (errorObject) =>
              `Failed compilation of input at index ${result.index}: ${errorObject.error}`,
          ),
        ];
      }
      return accumulated;
    },
    [],
  );

  if (inputCompilationErrors.length > 0) {
    const error = `Cannot generate ${scenarioName}: ${inputCompilationErrors.join(
      ' ',
    )}`;
    if (debug === true) {
      return {
        lockingCompilation,
        scenario: error,
        unlockingCompilation,
      } as Debug extends true
        ? ScenarioGenerationDebuggingResult<ProgramState>
        : Scenario;
    }
    return error;
  }

  const transactionInputCompilationsSuccess =
    transactionInputCompilations as WalletTemplateScenarioInputSuccessfulCompilation[];

  const inputs = transactionInputCompilationsSuccess.map((compilation) => {
    const {
      outpointIndex,
      outpointTransactionHash,
      sequenceNumber,
      unlockingBytecode,
    } = compilation.compiled;
    return {
      outpointIndex,
      outpointTransactionHash,
      sequenceNumber,
      unlockingBytecode:
        'bytecode' in unlockingBytecode
          ? unlockingBytecode.bytecode
          : unlockingBytecode,
    };
  });

  const scenario: Scenario = {
    data: fullCompilationData,
    program: {
      inputIndex: testedInputIndex,
      sourceOutputs,
      transaction: {
        inputs,
        locktime: extendedScenario.transaction.locktime,
        outputs,
        version: extendedScenario.transaction.version,
      },
    },
  };

  return (
    debug === true
      ? { lockingCompilation, scenario, unlockingCompilation }
      : scenario
  ) as Debug extends true
    ? ScenarioGenerationDebuggingResult<ProgramState>
    : Scenario;
};
