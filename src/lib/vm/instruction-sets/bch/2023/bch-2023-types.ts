import type {
  AnyCompilerConfiguration,
  AuthenticationProgramCommon,
  AuthenticationProgramStateCommon,
  AuthenticationVirtualMachine,
  CompilationContext,
  Compiler,
  Input,
  Output,
  ResolvedTransactionCommon,
  TransactionCommon,
} from '../../../../lib.js';

export type ResolvedTransactionBch = ResolvedTransactionCommon;
export type ResolvedTransaction = ResolvedTransactionBch;
/**
 * @deprecated Alias of `ResolvedTransactionBch` for backwards-compatibility.
 */
export type ResolvedTransactionBCH = ResolvedTransactionBch;
export type AuthenticationProgramBch = AuthenticationProgramCommon;
export type AuthenticationProgram = AuthenticationProgramBch;
/**
 * @deprecated Alias of `AuthenticationProgramBch` for backwards-compatibility.
 */
export type AuthenticationProgramBCH = AuthenticationProgramBch;
export type AuthenticationProgramStateBch = AuthenticationProgramStateCommon;
export type AuthenticationProgramState = AuthenticationProgramStateBch;
/**
 * @deprecated Alias of `AuthenticationProgramStateBch` for backwards-compatibility.
 */
export type AuthenticationProgramStateBCH = AuthenticationProgramStateBch;
export type AuthenticationVirtualMachineBch = AuthenticationVirtualMachine<
  ResolvedTransactionBch,
  AuthenticationProgramBch,
  AuthenticationProgramStateBch
>;
/**
 * @deprecated Alias of `AuthenticationProgramStateBch` for backwards-compatibility.
 */
export type AuthenticationVirtualMachineBCH = AuthenticationVirtualMachineBch;
export type TransactionBch<
  InputType = Input,
  OutputType = Output,
> = TransactionCommon<InputType, OutputType>;
/**
 * @deprecated Alias of `TransactionBch` for backwards-compatibility.
 */
export type TransactionBCH = TransactionBch;
export type Transaction<
  InputType = Input,
  OutputType = Output,
> = TransactionBch<InputType, OutputType>;
export type CompilationContextBch = CompilationContext<
  TransactionBch<Input<Uint8Array | undefined>>
>;
/**
 * @deprecated Alias of `CompilationContextBch` for backwards-compatibility.
 */
export type CompilationContextBCH = CompilationContextBch;
export type CompilerBch = Compiler<
  CompilationContextBch,
  AnyCompilerConfiguration<CompilationContextBch>,
  AuthenticationProgramStateBch
>;
/**
 * @deprecated Alias of `CompilerBch` for backwards-compatibility.
 */
export type CompilerBCH = CompilerBch;
