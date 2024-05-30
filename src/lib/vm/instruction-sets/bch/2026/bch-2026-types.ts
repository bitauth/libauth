import type {
  AuthenticationProgramBch,
  AuthenticationProgramStateBch2025,
  AuthenticationVirtualMachine,
  ResolvedTransactionBch,
} from '../../../../lib.js';

export type AuthenticationProgramStateBch2026 =
  AuthenticationProgramStateBch2025;

export type AuthenticationVirtualMachineBch2026 = AuthenticationVirtualMachine<
  ResolvedTransactionBch,
  AuthenticationProgramBch,
  AuthenticationProgramStateBch2026
>;
