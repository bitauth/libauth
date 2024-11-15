import type {
  AuthenticationProgramBch,
  AuthenticationProgramStateBch2026,
  AuthenticationVirtualMachine,
  ResolvedTransactionBch,
} from '../../../../lib.js';

export type AuthenticationProgramStateResourceLimitsBchSpec = {
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

export type AuthenticationProgramStateBchSpec =
  AuthenticationProgramStateBch2026 &
    AuthenticationProgramStateResourceLimitsBchSpec;

export type AuthenticationVirtualMachineBchSpec = AuthenticationVirtualMachine<
  ResolvedTransactionBch,
  AuthenticationProgramBch,
  AuthenticationProgramStateBchSpec
>;
