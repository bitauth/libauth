import type {
  AuthenticationProgramBch,
  AuthenticationProgramStateBch2025,
  AuthenticationVirtualMachine,
  ResolvedTransactionBch,
} from '../../../../lib.js';

export type AuthenticationProgramStateResourceLimitsBch2026 = {
  /**
   * An unsigned integer counter used by `OP_UNTIL` to prevent excessive use of
   * loops.
   */
  repeatedBytes: number;
  metrics: {
    /**
     * An unsigned integer reflecting the highest cumulative stack and
     * alternate stack memory usage reached across all input evaluations. This
     * metric is implemented for research purposes and not required by
     * the VM.
     */
    maxMemoryUsage: number;
  };
};

export type AuthenticationProgramStateBch2026 =
  AuthenticationProgramStateBch2025 &
    AuthenticationProgramStateResourceLimitsBch2026;

export type AuthenticationVirtualMachineBch2026 = AuthenticationVirtualMachine<
  ResolvedTransactionBch,
  AuthenticationProgramBch,
  AuthenticationProgramStateBch2026
>;
