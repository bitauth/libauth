import {
  ripemd160 as internalRipemd160,
  secp256k1 as internalSecp256k1,
  sha256 as internalSha256,
  sha512 as internalSha512,
} from '../crypto/crypto.js';
import { compileScript } from '../language/language.js';
import type {
  AnyCompilerConfiguration,
  AuthenticationProgramCommon,
  AuthenticationProgramStateCommon,
  AuthenticationProgramStateControlStack,
  AuthenticationProgramStateMinimum,
  AuthenticationProgramStateStack,
  BytecodeGenerationResult,
  CompilationContextBCH,
  CompilationData,
  CompilationResult,
  Compiler,
  CompilerConfiguration,
  WalletTemplate,
} from '../lib.js';
import {
  generateBytecodeMap,
  Opcodes,
  OpcodesBCH,
  OpcodesBTC,
} from '../vm/vm.js';

import { compilerOperationsCommon } from './compiler-operations.js';
import { generateScenarioBCH } from './scenarios.js';

/**
 * Create a {@link Compiler.generateBytecode} method given a compiler
 * configuration.
 */
export const createCompilerGenerateBytecodeFunction =
  <
    CompilationContext extends CompilationContextBCH,
    Configuration extends AnyCompilerConfiguration<CompilationContext>,
    ProgramState extends AuthenticationProgramStateControlStack &
      AuthenticationProgramStateMinimum &
      AuthenticationProgramStateStack,
  >(
    compilerConfiguration: Configuration,
  ) =>
  <Debug extends boolean>({
    data,
    debug,
    scriptId,
  }: {
    scriptId: string;
    data: CompilationData<CompilationContext>;
    debug?: boolean;
  }) => {
    const result = compileScript<ProgramState, CompilationContext>(
      scriptId,
      data,
      compilerConfiguration,
    );
    return (
      debug === true
        ? result
        : result.success
          ? { bytecode: result.bytecode, success: true }
          : {
              errorType: result.errorType,
              errors: result.errors,
              success: false,
            }
    ) as Debug extends true
      ? CompilationResult<ProgramState>
      : BytecodeGenerationResult<ProgramState>;
  };

/**
 * Create a {@link Compiler} from the provided compiler configuration. This
 * method requires a full {@link CompilerConfiguration} and does not provide any
 * crypto or VM implementations.
 *
 * @param configuration - the configuration from which to create the compiler
 */
export const compilerConfigurationToCompilerBCH = <
  Configuration extends AnyCompilerConfiguration<CompilationContextBCH>,
  ProgramState extends AuthenticationProgramStateControlStack &
    AuthenticationProgramStateMinimum &
    AuthenticationProgramStateStack,
>(
  configuration: Configuration,
): Compiler<CompilationContextBCH, Configuration, ProgramState> => {
  const generateBytecode =
    createCompilerGenerateBytecodeFunction(configuration);
  return {
    configuration,
    generateBytecode,
    generateScenario: ({
      lockingScriptId,
      unlockingScriptId,
      scenarioId,
      debug,
    }) =>
      generateScenarioBCH(
        {
          configuration,
          generateBytecode,
          lockingScriptId,
          scenarioId,
          unlockingScriptId,
        },
        debug,
      ),
  };
};

export const compilerConfigurationToCompiler =
  compilerConfigurationToCompilerBCH;

const nullHashLength = 32;

/**
 * A common {@link createAuthenticationProgram} implementation for
 * most compilers.
 *
 * Accepts the compiled contents of an evaluation and produces a
 * {@link AuthenticationProgramCommon} that can be evaluated to produce the
 * resulting program state.
 *
 * The precise shape of the authentication program produced by this method is
 * critical to the determinism of CashAssembly evaluations for the compiler in
 * which it is used, it therefore must be standardized between compiler
 * implementations.
 *
 * @param evaluationBytecode - the compiled bytecode to incorporate in the
 * created authentication program
 */
export const createAuthenticationProgramEvaluationCommon = (
  evaluationBytecode: Uint8Array,
): AuthenticationProgramCommon => ({
  inputIndex: 0,
  sourceOutputs: [
    {
      lockingBytecode: evaluationBytecode,
      valueSatoshis: 0n,
    },
  ],
  transaction: {
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
        valueSatoshis: 0n,
      },
    ],
    version: 0,
  },
});

/**
 * Create a compiler using the default common compiler configuration. Because
 * this compiler has no access to a VM, it cannot compile evaluations.
 *
 * @param scriptsAndOverrides - a compiler configuration from which properties
 * will be used to override properties of the default common compiler
 * configuration – must include the `scripts` property
 */
export const createCompilerCommon = <
  Configuration extends CompilerConfiguration<CompilationContextBCH>,
  ProgramState extends AuthenticationProgramStateCommon,
>(
  scriptsAndOverrides: Configuration,
): Compiler<CompilationContextBCH, Configuration, ProgramState> =>
  compilerConfigurationToCompilerBCH<Configuration, ProgramState>({
    ...{
      createAuthenticationProgram: createAuthenticationProgramEvaluationCommon,
      opcodes: generateBytecodeMap(Opcodes),
      operations: compilerOperationsCommon,
      ripemd160: internalRipemd160,
      secp256k1: internalSecp256k1,
      sha256: internalSha256,
      sha512: internalSha512,
    },
    ...scriptsAndOverrides,
  });

/**
 * Perform a simplified compilation on a CashAssembly script containing only hex
 * literals, bigint literals, UTF8 literals, and push statements. Scripts may
 * not contain variables/operations, evaluations, or opcode identifiers (use hex
 * literals instead).
 *
 * This is useful for accepting complex user input in advanced interfaces,
 * especially for `AddressData` and `WalletData`.
 *
 * Returns the compiled bytecode as a `Uint8Array`, or throws an error message.
 *
 * @param script - a simple CashAssembly script containing no variables or
 * evaluations
 */
export const compileCashAssembly = (script: string) => {
  const result = createCompilerCommon({
    opcodes: {},
    operations: {},
    scripts: { script },
  }).generateBytecode({ data: {}, scriptId: 'script' });
  if (result.success) {
    return result.bytecode;
  }
  return `CashAssembly compilation error:${result.errors.reduce(
    (all, { error, range }) =>
      `${all} [${range.startLineNumber}, ${range.startColumn}]: ${error}`,
    '',
  )}`;
};

/**
 * Re-assemble a string of disassembled bytecode
 * (see {@link disassembleBytecode}).
 *
 * @param opcodes - a mapping of opcodes to their respective Uint8Array
 * representation
 * @param disassembledBytecode - the disassembled bytecode to re-assemble
 */
export const assembleBytecode = (
  opcodes: { [opcode: string]: Uint8Array },
  disassembledBytecode: string,
) => {
  const configuration = {
    opcodes,
    scripts: { asm: disassembledBytecode },
  };
  return createCompilerCommon<
    typeof configuration,
    AuthenticationProgramStateCommon
  >(configuration).generateBytecode({ data: {}, scriptId: 'asm' });
};

/**
 * Re-assemble a string of disassembled BCH bytecode; see
 * {@link disassembleBytecodeBCH}.
 *
 * Note, this method performs automatic minimization of push instructions.
 *
 * @param disassembledBytecode - the disassembled BCH bytecode to re-assemble
 */
export const assembleBytecodeBCH = (disassembledBytecode: string) =>
  assembleBytecode(generateBytecodeMap(OpcodesBCH), disassembledBytecode);

/**
 * A convenience method to compile CashAssembly (using
 * {@link assembleBytecodeBCH}) to bytecode. If compilation fails, errors are
 * returned as a string.
 */
export const cashAssemblyToBin = (cashAssemblyScript: string) => {
  const result = assembleBytecodeBCH(cashAssemblyScript);
  return result.success
    ? result.bytecode
    : `CashAssembly compilation ${result.errorType} error: ${result.errors
        .map((err) => err.error)
        .join(' ')}`;
};

/**
 * Re-assemble a string of disassembled BCH bytecode; see
 * {@link disassembleBytecodeBTC}.
 *
 * Note, this method performs automatic minimization of push instructions.
 *
 * @param disassembledBytecode - the disassembled BTC bytecode to re-assemble
 */
export const assembleBytecodeBTC = (disassembledBytecode: string) =>
  assembleBytecode(generateBytecodeMap(OpcodesBTC), disassembledBytecode);

/**
 * Create a partial {@link CompilerConfiguration} from an
 * {@link WalletTemplate} by extracting and formatting the `scripts` and
 * `variables` properties.
 *
 * Note, if this {@link WalletTemplate} might be malformed, first
 * validate it with {@link importWalletTemplate}.
 *
 * @param template - the {@link WalletTemplate} from which to extract
 * the compiler configuration
 */
export const walletTemplateToCompilerConfiguration = (
  template: WalletTemplate,
): Pick<
  CompilerConfiguration,
  | 'entityOwnership'
  | 'lockingScriptTypes'
  | 'scenarios'
  | 'scripts'
  | 'unlockingScripts'
  | 'unlockingScriptTimeLockTypes'
  | 'variables'
> => {
  /**
   * Template scripts including virtualized test scripts.
   */
  const virtualizedScripts: WalletTemplate['scripts'] = Object.entries(
    template.scripts,
  ).reduce<WalletTemplate['scripts']>((all, [scriptId, script]) => {
    if ('tests' in script) {
      return {
        ...all,
        ...Object.entries(script.tests).reduce<WalletTemplate['scripts']>(
          (tests, [testId, test]) => {
            const pushTestedScript = script.pushed === true;
            const checkScriptId = `${scriptId}.${testId}.check`;
            const virtualizedLockingScriptId = `${scriptId}.${testId}.lock`;
            const virtualizedUnlockingScriptId = `${scriptId}.${testId}.unlock`;
            return {
              ...tests,
              [checkScriptId]: { script: test.check },
              [virtualizedLockingScriptId]: {
                lockingType: 'p2sh20',
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
          {},
        ),
      };
    }
    return all;
  }, {});
  const allScripts = {
    ...template.scripts,
    ...virtualizedScripts,
  };
  const scripts = Object.entries(allScripts).reduce<
    CompilerConfiguration['scripts']
  >((all, [id, def]) => ({ ...all, [id]: def.script }), {});
  const variables = Object.values(template.entities).reduce<
    CompilerConfiguration['variables']
  >((all, entity) => ({ ...all, ...entity.variables }), {});
  const entityOwnership = Object.entries(template.entities).reduce<
    CompilerConfiguration['entityOwnership']
  >(
    (all, [entityId, entity]) => ({
      ...all,
      ...Object.keys(entity.variables ?? {}).reduce(
        (entityVariables, variableId) => ({
          ...entityVariables,
          [variableId]: entityId,
        }),
        {},
      ),
    }),
    {},
  );
  const unlockingScripts = Object.entries(allScripts).reduce<
    CompilerConfiguration['unlockingScripts']
  >(
    (all, [id, def]) =>
      'unlocks' in def && (def.unlocks as string | undefined) !== undefined
        ? { ...all, [id]: def.unlocks }
        : all,
    {},
  );
  const unlockingScriptTimeLockTypes = Object.entries(allScripts).reduce<
    CompilerConfiguration['unlockingScriptTimeLockTypes']
  >(
    (all, [id, def]) =>
      'timeLockType' in def && def.timeLockType !== undefined
        ? { ...all, [id]: def.timeLockType }
        : all,
    {},
  );
  const lockingScriptTypes = Object.entries(allScripts).reduce<
    CompilerConfiguration['lockingScriptTypes']
  >(
    (all, [id, def]) =>
      'lockingType' in def &&
      (def.lockingType as string | undefined) !== undefined
        ? { ...all, [id]: def.lockingType }
        : all,
    {},
  );
  const scenarios =
    template.scenarios === undefined
      ? undefined
      : Object.entries(template.scenarios).reduce<
          CompilerConfiguration['scenarios']
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
