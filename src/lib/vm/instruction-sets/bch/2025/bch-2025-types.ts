import type {
  AuthenticationProgramBch,
  AuthenticationProgramStateBch,
  AuthenticationVirtualMachine,
  ResolvedTransactionBch,
} from '../../../../lib.js';

export type AuthenticationProgramStateBch2025 = AuthenticationProgramStateBch;

export type AuthenticationVirtualMachineBch2025 = AuthenticationVirtualMachine<
  ResolvedTransactionBch,
  AuthenticationProgramBch,
  AuthenticationProgramStateBch2025
>;
