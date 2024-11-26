import type {
  AuthenticationProgramBch,
  AuthenticationProgramStateBch2026,
  AuthenticationVirtualMachine,
  ResolvedTransactionBch,
} from '../../../../lib.js';

export type AuthenticationProgramStateBchSpec =
  AuthenticationProgramStateBch2026;

export type AuthenticationVirtualMachineBchSpec = AuthenticationVirtualMachine<
  ResolvedTransactionBch,
  AuthenticationProgramBch,
  AuthenticationProgramStateBchSpec
>;
