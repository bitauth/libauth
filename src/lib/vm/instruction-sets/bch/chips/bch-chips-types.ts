import type {
  AuthenticationInstruction,
  AuthenticationProgramBCH,
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
  ResolvedTransactionBCH,
} from '../../../../lib.js';
import {
  cloneAuthenticationInstruction,
  cloneAuthenticationProgramCommon,
  cloneStack,
} from '../../common/common.js';

/**
 * Consensus settings for the `BCH_CHIPs` instruction set.
 */
export enum ConsensusBCHCHIPs {
  maximumTransactionVersion = 2,
  bannedTransactionSize = 64,
  maximumHashDigestIterations = 660,
}

export type AuthenticationProgramStateControlStackCHIPs =
  AuthenticationProgramStateControlStack<boolean | number>;

export type AuthenticationProgramStateResourceLimitsBCHCHIPs = {
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

export type AuthenticationProgramStateBCHCHIPs =
  AuthenticationProgramStateAlternateStack &
    AuthenticationProgramStateCodeSeparator &
    AuthenticationProgramStateControlStackCHIPs &
    AuthenticationProgramStateError &
    AuthenticationProgramStateMinimum &
    AuthenticationProgramStateResourceLimitsBCHCHIPs &
    AuthenticationProgramStateSignatureAnalysis &
    AuthenticationProgramStateStack &
    AuthenticationProgramStateTransactionContext;

export type AuthenticationVirtualMachineBCHCHIPs = AuthenticationVirtualMachine<
  ResolvedTransactionBCH,
  AuthenticationProgramBCH,
  AuthenticationProgramStateBCHCHIPs
>;

/**
 * @deprecated use `structuredClone` instead
 */
export const cloneAuthenticationProgramStateBCHCHIPs = <
  State extends AuthenticationProgramStateBCHCHIPs,
>(
  state: State,
) => ({
  ...(state.error === undefined ? {} : { error: state.error }),
  alternateStack: cloneStack(state.alternateStack),
  controlStack: state.controlStack.slice(),
  hashDigestIterations: state.hashDigestIterations,
  instructions: state.instructions.map(cloneAuthenticationInstruction),
  ip: state.ip,
  lastCodeSeparator: state.lastCodeSeparator,
  program: cloneAuthenticationProgramCommon(state.program),
  repeatedBytes: state.repeatedBytes,
  signedMessages: state.signedMessages.map((item) => ({
    digest: item.digest.slice(),
    ...('serialization' in item
      ? { serialization: item.serialization.slice() }
      : { message: item.message.slice() }),
  })),
  stack: cloneStack(state.stack),
});

export const createAuthenticationProgramStateBCHCHIPs = ({
  program,
  instructions,
  stack,
}: {
  program: AuthenticationProgramCommon;
  instructions: AuthenticationInstruction[];
  stack: Uint8Array[];
}): AuthenticationProgramStateBCHCHIPs => ({
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
