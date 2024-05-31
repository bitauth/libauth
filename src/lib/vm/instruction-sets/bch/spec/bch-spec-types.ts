import type {
  AuthenticationProgramBch,
  AuthenticationProgramStateBch2025,
  AuthenticationVirtualMachine,
  ResolvedTransactionBch,
} from '../../../../lib.js';

export type AuthenticationProgramStateResourceLimitsBchSpec = {
  /**
   * An unsigned integer counter used by `OP_UNTIL` to prevent excessive use of
   * loops.
   */
  repeatedBytes: number;
};

export type AuthenticationProgramStateBchSpec =
  AuthenticationProgramStateBch2025 &
    AuthenticationProgramStateResourceLimitsBchSpec;

export type AuthenticationVirtualMachineBchSpec = AuthenticationVirtualMachine<
  ResolvedTransactionBch,
  AuthenticationProgramBch,
  AuthenticationProgramStateBchSpec
>;
