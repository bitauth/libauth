import {
  AuthenticationErrorBCH,
  createAuthenticationProgramExternalStateCommonEmpty,
  createAuthenticationProgramStateCommon,
  generateBytecodeMap,
  OpcodesBCH,
} from '../vm/instruction-sets/instruction-sets';
import { AuthenticationInstruction } from '../vm/instruction-sets/instruction-sets-types';
import {
  AuthenticationProgramStateCommon,
  MinimumProgramState,
  StackState,
} from '../vm/state';

import { compilerOperationsCommon } from './compiler-operations';
import {
  AnyCompilationEnvironment,
  CompilationData,
  Compiler,
  CompilerOperationDataCommon,
} from './compiler-types';
import { compileScript } from './language/compile';

/**
 * Create a `Compiler` from the provided compilation environment. This method
 * requires a full `CompilationEnvironment` and does not instantiate any new
 * crypto or VM implementations.
 *
 * @param compilationEnvironment - the environment from which to create the
 * compiler
 */
export const createCompiler = <
  CompilerOperationData,
  Environment extends AnyCompilationEnvironment<CompilerOperationData>,
  ProgramState = StackState & MinimumProgramState
>(
  compilationEnvironment: Environment
): Compiler<CompilerOperationData, ProgramState> => ({
  generateBytecode: (
    script: string,
    data: CompilationData<CompilerOperationData>,
    // TODO: TS bug?
    // eslint-disable-next-line @typescript-eslint/no-inferrable-types
    debug: boolean = false
    // TODO: is there a way to avoid this `any`?
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): any => {
    const result = compileScript<ProgramState, CompilerOperationData>(
      script,
      data,
      compilationEnvironment
    );
    return debug
      ? result
      : result.success
      ? { bytecode: result.bytecode, success: true }
      : { errorType: result.errorType, errors: result.errors, success: false };
  },
});

/**
 * A common `createState` implementation for most compilers.
 *
 * @param instructions - the list of instructions to incorporate in the created
 * state.
 */
export const compilerCreateStateCommon = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  instructions: AuthenticationInstruction<any>[]
) =>
  createAuthenticationProgramStateCommon(
    instructions,
    [],
    createAuthenticationProgramExternalStateCommonEmpty()
  );

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
  CompilerOperationData extends CompilerOperationDataCommon,
  Environment extends AnyCompilationEnvironment<CompilerOperationData>,
  ProgramState extends AuthenticationProgramStateCommon<Opcodes, Errors>,
  Opcodes = OpcodesBCH,
  Errors = AuthenticationErrorBCH
>(
  scriptsAndOverrides: Environment
): Compiler<CompilerOperationData, ProgramState> => {
  return createCompiler<CompilerOperationData, Environment, ProgramState>({
    ...{
      createState: compilerCreateStateCommon,
      opcodes: generateBytecodeMap(OpcodesBCH),
      operations: compilerOperationsCommon,
    },
    ...scriptsAndOverrides,
  });
};
