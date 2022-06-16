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
} from '../../../../lib';
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

export interface AuthenticationProgramStateResourceLimitsBCHCHIPs {
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
}

export interface AuthenticationProgramStateBCHCHIPs
  extends AuthenticationProgramStateMinimum,
    AuthenticationProgramStateStack,
    AuthenticationProgramStateAlternateStack,
    AuthenticationProgramStateControlStackCHIPs,
    AuthenticationProgramStateError,
    AuthenticationProgramStateCodeSeparator,
    AuthenticationProgramStateSignatureAnalysis,
    AuthenticationProgramStateTransactionContext,
    AuthenticationProgramStateResourceLimitsBCHCHIPs {}

export type AuthenticationVirtualMachineBCHCHIPs = AuthenticationVirtualMachine<
  ResolvedTransactionBCH,
  AuthenticationProgramBCH,
  AuthenticationProgramStateBCHCHIPs
>;

export const cloneAuthenticationProgramStateBCHCHIPs = <
  State extends AuthenticationProgramStateBCHCHIPs
>(
  state: Readonly<State>
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
  signedMessages: cloneStack(state.signedMessages),
  stack: cloneStack(state.stack),
});

export const createAuthenticationProgramStateBCHCHIPs = ({
  program,
  instructions,
  stack,
}: {
  program: Readonly<AuthenticationProgramCommon>;
  instructions: readonly AuthenticationInstruction[];
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
