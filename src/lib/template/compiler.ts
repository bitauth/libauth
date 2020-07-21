import { TransactionContextCommon } from '../transaction/transaction-types';
import {
  AuthenticationErrorCommon,
  generateBytecodeMap,
  OpcodesCommon,
} from '../vm/instruction-sets/instruction-sets';
import {
  AuthenticationProgramCommon,
  AuthenticationProgramStateCommon,
  AuthenticationProgramStateExecutionStack,
  AuthenticationProgramStateMinimum,
  AuthenticationProgramStateStack,
} from '../vm/vm-types';

import { CompilerDefaults } from './compiler-defaults';
import { compilerOperationsCommon } from './compiler-operations';
import {
  AnyCompilationEnvironment,
  BytecodeGenerationResult,
  CompilationData,
  CompilationEnvironment,
  Compiler,
} from './compiler-types';
import { compileScript } from './language/compile';
import { CompilationResult } from './language/language-types';
import { generateScenarioCommon } from './scenarios';
import { AuthenticationTemplate } from './template-types';

/**
 * Create a `Compiler` from the provided compilation environment. This method
 * requires a full `CompilationEnvironment` and does not instantiate any new
 * crypto or VM implementations.
 *
 * @param compilationEnvironment - the environment from which to create the
 * compiler
 */
export const createCompiler = <
  TransactionContext extends TransactionContextCommon,
  Environment extends AnyCompilationEnvironment<TransactionContext>,
  Opcodes extends number = number,
  ProgramState extends AuthenticationProgramStateStack &
    AuthenticationProgramStateExecutionStack &
    AuthenticationProgramStateMinimum<
      Opcodes
    > = AuthenticationProgramStateStack &
    AuthenticationProgramStateExecutionStack &
    AuthenticationProgramStateMinimum<Opcodes>
>(
  compilationEnvironment: Environment
): Compiler<TransactionContext, Environment, ProgramState> => ({
  environment: compilationEnvironment,
  generateBytecode: <Debug extends boolean>(
    scriptId: string,
    data: CompilationData<TransactionContext>,
    debug = false
  ) => {
    const result = compileScript<ProgramState, TransactionContext>(
      scriptId,
      data,
      compilationEnvironment
    );
    return (debug
      ? result
      : result.success
      ? { bytecode: result.bytecode, success: true }
      : {
          errorType: result.errorType,
          errors: result.errors,
          success: false,
        }) as Debug extends true
      ? CompilationResult<ProgramState>
      : BytecodeGenerationResult<ProgramState>;
  },
  generateScenario: ({ unlockingScriptId, scenarioId }) =>
    generateScenarioCommon({
      environment: compilationEnvironment,
      scenarioId,
      unlockingScriptId,
    }),
});

const nullHashLength = 32;

/**
 * A common `createAuthenticationProgram` implementation for most compilers.
 *
 * Accepts the compiled contents of an evaluation and produces a
 * `AuthenticationProgramCommon` which can be evaluated to produce the resulting
 * program state.
 *
 * The precise shape of the authentication program produced by this method is
 * critical to the determinism of BTL evaluations for the compiler in which it
 * is used, it therefore must be standardized between compiler implementations.
 *
 * @param evaluationBytecode - the compiled bytecode to incorporate in the
 * created authentication program
 */
export const createAuthenticationProgramEvaluationCommon = (
  evaluationBytecode: Uint8Array
): AuthenticationProgramCommon => ({
  inputIndex: 0,
  sourceOutput: {
    lockingBytecode: evaluationBytecode,
    satoshis: Uint8Array.from([0, 0, 0, 0, 0, 0, 0, 0]),
  },
  spendingTransaction: {
    inputs: [
      {
        outpointIndex: 0,
        outpointTransactionHash: new Uint8Array(nullHashLength),
        sequenceNumber: 0,
        unlockingBytecode: Uint8Array.of(),
      },
    ],
    locktime: 0,
    outputs: [
      {
        lockingBytecode: Uint8Array.of(),
        satoshis: Uint8Array.from([0, 0, 0, 0, 0, 0, 0, 0]),
      },
    ],
    version: 0,
  },
});

/**
 * Synchronously create a compiler using the default common environment. Because
 * this compiler has no access to Secp256k1, Sha256, or a VM, it cannot compile
 * evaluations or operations which require key derivation or hashing.
 *
 * @param scriptsAndOverrides - a compilation environment from which properties
 * will be used to override properties of the default common compilation
 * environment – must include the `scripts` property
 */
export const createCompilerCommonSynchronous = <
  Environment extends AnyCompilationEnvironment<TransactionContextCommon>,
  ProgramState extends AuthenticationProgramStateCommon<Opcodes, Errors>,
  Opcodes extends number = OpcodesCommon,
  Errors = AuthenticationErrorCommon
>(
  scriptsAndOverrides: Environment
): Compiler<TransactionContextCommon, Environment, ProgramState> => {
  return createCompiler<
    TransactionContextCommon,
    Environment,
    Opcodes,
    ProgramState
  >({
    ...{
      createAuthenticationProgram: createAuthenticationProgramEvaluationCommon,
      opcodes: generateBytecodeMap(OpcodesCommon),
      operations: compilerOperationsCommon,
    },
    ...scriptsAndOverrides,
  });
};

/**
 * Create a partial `CompilationEnvironment` from an `AuthenticationTemplate` by
 * extracting and formatting the `scripts` and `variables` properties.
 *
 * Note, if this `AuthenticationTemplate` might be malformed, first validate it
 * with `validateAuthenticationTemplate`.
 *
 * @param template - the `AuthenticationTemplate` from which to extract the
 * compilation environment
 */
export const authenticationTemplateToCompilationEnvironment = (
  template: AuthenticationTemplate
): Pick<
  CompilationEnvironment,
  | 'entityOwnership'
  | 'scenarios'
  | 'scripts'
  | 'variables'
  | 'unlockingScripts'
  | 'lockingScriptTypes'
  | 'unlockingScriptTimeLockTypes'
> => {
  const scripts = Object.entries(template.scripts).reduce<
    CompilationEnvironment['scripts']
  >((all, [id, def]) => ({ ...all, [id]: def.script }), {});
  const variables = Object.values(template.entities).reduce<
    CompilationEnvironment['variables']
  >((all, entity) => ({ ...all, ...entity.variables }), {});
  const entityOwnership = Object.entries(template.entities).reduce<
    CompilationEnvironment['entityOwnership']
  >(
    (all, [entityId, entity]) => ({
      ...all,
      ...Object.keys(entity.variables ?? {}).reduce(
        (entityVariables, variableId) => ({
          ...entityVariables,
          [variableId]: entityId,
        }),
        {}
      ),
    }),
    {}
  );
  const unlockingScripts = Object.entries(template.scripts).reduce<
    CompilationEnvironment['unlockingScripts']
  >(
    (all, [id, def]) =>
      'unlocks' in def && (def.unlocks as string | undefined) !== undefined
        ? { ...all, [id]: def.unlocks }
        : all,
    {}
  );
  const unlockingScriptTimeLockTypes = Object.entries(template.scripts).reduce<
    CompilationEnvironment['unlockingScriptTimeLockTypes']
  >(
    (all, [id, def]) =>
      'timeLockType' in def && def.timeLockType !== undefined
        ? { ...all, [id]: def.timeLockType }
        : all,
    {}
  );
  const lockingScriptTypes = Object.entries(template.scripts).reduce<
    CompilationEnvironment['lockingScriptTypes']
  >(
    (all, [id, def]) =>
      'lockingType' in def &&
      (def.lockingType as string | undefined) !== undefined
        ? { ...all, [id]: def.lockingType }
        : all,
    {}
  );
  const scenarios =
    template.scenarios === undefined
      ? undefined
      : Object.entries(template.scenarios).reduce<
          CompilationEnvironment['scenarios']
        >((all, [id, def]) => ({ ...all, [id]: def }), {});
  return {
    entityOwnership,
    lockingScriptTypes,
    ...(scenarios === undefined ? {} : { scenarios }),
    scripts,
    unlockingScriptTimeLockTypes,
    unlockingScripts,
    variables,
  };
};

/**
 * Create a partial `CompilationEnvironment` from an `AuthenticationTemplate`,
 * virtualizing all script tests as unlocking and locking script pairs.
 *
 * @param template - the authentication template from which to extract the
 * compilation environment
 */
export const authenticationTemplateToCompilationEnvironmentVirtualizedTests = (
  template: AuthenticationTemplate
): ReturnType<typeof authenticationTemplateToCompilationEnvironment> => {
  const virtualizedScripts = Object.entries(template.scripts).reduce<
    typeof template.scripts
  >((all, [scriptId, script]) => {
    if ('tests' in script) {
      return {
        ...all,
        ...script.tests.reduce<typeof template.scripts>(
          (tests, test, index) => {
            const pushTestedScript = script.pushed === true;
            const checkScriptId = `${CompilerDefaults.virtualizedTestCheckScriptPrefix}${scriptId}_${index}`;
            const virtualizedLockingScriptId = `${CompilerDefaults.virtualizedTestLockingScriptPrefix}${scriptId}_${index}`;
            const virtualizedUnlockingScriptId = `${CompilerDefaults.virtualizedTestUnlockingScriptPrefix}${scriptId}_${index}`;
            return {
              ...tests,
              [checkScriptId]: { script: test.check },
              [virtualizedLockingScriptId]: {
                script: pushTestedScript
                  ? `<${scriptId}> ${checkScriptId}`
                  : `${scriptId} ${checkScriptId}`,
              },
              [virtualizedUnlockingScriptId]: {
                script: test.setup ?? '',
                unlocks: virtualizedLockingScriptId,
              },
            };
          },
          {}
        ),
      };
    }
    return all;
  }, {});
  const templateWithVirtualizedTests: AuthenticationTemplate = {
    ...template,
    scripts: {
      ...template.scripts,
      ...virtualizedScripts,
    },
  };
  return authenticationTemplateToCompilationEnvironment(
    templateWithVirtualizedTests
  );
};
