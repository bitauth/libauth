import type {
  AuthenticationProgramBch,
  AuthenticationProgramStateBch,
  AuthenticationVirtualMachine,
  ResolvedTransactionBch,
} from '../../../../lib.js';

export type AuthenticationProgramStateResourceLimitsBch2025 = {
  /**
   * An unsigned integer counter use to count the total number of hash digest
   * iterations that required during this evaluation.
   */
  hashDigestIterations: number;
};

export type AuthenticationProgramStateBch2025 = AuthenticationProgramStateBch &
  AuthenticationProgramStateResourceLimitsBch2025;

export type AuthenticationVirtualMachineBch2025 = AuthenticationVirtualMachine<
  ResolvedTransactionBch,
  AuthenticationProgramBch,
  AuthenticationProgramStateBch2025
>;
