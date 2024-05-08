import type {
  AuthenticationInstruction,
  AuthenticationProgramBch,
  AuthenticationProgramCommon,
  AuthenticationProgramStateAlternateStack,
  AuthenticationProgramStateCodeSeparator,
  AuthenticationProgramStateControlStack,
  AuthenticationProgramStateError,
  AuthenticationProgramStateMinimum,
  AuthenticationProgramStateSignatureAnalysis,
  AuthenticationProgramStateStack,
  AuthenticationProgramStateTransactionContext,
  AuthenticationVirtualMachine,
  ResolvedTransactionBch,
} from '../../../../lib.js';

/**
 * Consensus settings for the `BCH_SPEC` instruction set.
 */
export enum ConsensusBchSpec {
  maximumTransactionVersion = 2,
  bannedTransactionSize = 64,
  maximumHashDigestIterations = 1000,
}

export type AuthenticationProgramStateControlStackBchSpec =
  AuthenticationProgramStateControlStack<boolean | number>;

export type AuthenticationProgramStateResourceLimitsBchSpec = {
  /**
   * An unsigned integer counter used by `OP_UNTIL` to prevent excessive use of
   * loops.
   */
  repeatedBytes: number;
  /**
   * An unsigned integer counter use to count the total number of hash digest
   * iterations that required during this evaluation.
   */
  hashDigestIterations: number;
};

export type AuthenticationProgramStateBchSpec =
  AuthenticationProgramStateAlternateStack &
    AuthenticationProgramStateCodeSeparator &
    AuthenticationProgramStateControlStackBchSpec &
    AuthenticationProgramStateError &
    AuthenticationProgramStateMinimum &
    AuthenticationProgramStateResourceLimitsBchSpec &
    AuthenticationProgramStateSignatureAnalysis &
    AuthenticationProgramStateStack &
    AuthenticationProgramStateTransactionContext;

export type AuthenticationVirtualMachineBchSpec = AuthenticationVirtualMachine<
  ResolvedTransactionBch,
  AuthenticationProgramBch,
  AuthenticationProgramStateBchSpec
>;

export const createAuthenticationProgramStateBchSpec = ({
  program,
  instructions,
  stack,
}: {
  program: AuthenticationProgramCommon;
  instructions: AuthenticationInstruction[];
  stack: Uint8Array[];
}): AuthenticationProgramStateBchSpec => ({
  alternateStack: [],
  controlStack: [],
  hashDigestIterations: 0,
  instructions,
  ip: 0,
  lastCodeSeparator: -1,
  program,
  repeatedBytes: 0,
  signedMessages: [],
  stack,
});
