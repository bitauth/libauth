import {
  hash256,
  ripemd160 as internalRipemd160,
  sha1 as internalSha1,
  sha256 as internalSha256,
} from '../../../../crypto/crypto.js';
import type {
  AuthenticationProgramStateError,
  AuthenticationProgramStateMinimum,
  AuthenticationProgramStateResourceLimitsBch2025,
  AuthenticationProgramStateStack,
  Operation,
  Ripemd160,
  Sha1,
  Sha256,
} from '../../../../lib.js';
import {
  applyError,
  pushToStack,
  useOneStackItem,
} from '../../common/common.js';
import { ConsensusBchSpec } from '../spec/bch-spec-consensus.js';
import { AuthenticationErrorBchSpec } from '../spec/bch-spec-errors.js';

/**
 * Given a message length, compute and return the number of hash digest
 * iterations required. (See `CHIP-2021-05-vm-limits`)
 */
export const countHashDigestIterations = (messageLength: number) =>
  // eslint-disable-next-line no-bitwise, @typescript-eslint/no-magic-numbers
  1 + (((messageLength + 8) / 64) | 0);

/**
 * Given a program state, increment the hash digest iteration count for a
 * message of the provided length. If the total would exceed the maximum, append
 * an error.
 *
 * @param state - the program state
 * @param messageLength - the message length
 * @param operation - the operation to execute if no error occurred
 */
export const incrementHashDigestIterations = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateResourceLimitsBch2025,
>(
  state: State,
  messageLength: number,
  operation: (nextState: State) => State,
) => {
  const requiredTotalIterations =
    state.hashDigestIterations + countHashDigestIterations(messageLength);
  if (requiredTotalIterations > ConsensusBchSpec.maximumHashDigestIterations) {
    return applyError(
      state,
      AuthenticationErrorBchSpec.excessiveHashing,
      `Required cumulative iterations: ${requiredTotalIterations}`,
    );
  }
  return operation(state);
};

export const opRipemd160ChipLimits =
  <
    State extends AuthenticationProgramStateError &
      AuthenticationProgramStateMinimum &
      AuthenticationProgramStateResourceLimitsBch2025 &
      AuthenticationProgramStateStack,
  >(
    {
      ripemd160,
    }: {
      ripemd160: { hash: Ripemd160['hash'] };
    } = { ripemd160: internalRipemd160 },
  ): Operation<State> =>
  (state: State) =>
    useOneStackItem(state, (nextState, [value]) =>
      incrementHashDigestIterations(nextState, value.length, (finalState) =>
        pushToStack(finalState, ripemd160.hash(value)),
      ),
    );

export const opSha1ChipLimits =
  <
    State extends AuthenticationProgramStateError &
      AuthenticationProgramStateMinimum &
      AuthenticationProgramStateResourceLimitsBch2025 &
      AuthenticationProgramStateStack,
  >(
    {
      sha1,
    }: {
      sha1: { hash: Sha1['hash'] };
    } = { sha1: internalSha1 },
  ): Operation<State> =>
  (state: State) =>
    useOneStackItem(state, (nextState, [value]) =>
      incrementHashDigestIterations(nextState, value.length, (finalState) =>
        pushToStack(finalState, sha1.hash(value)),
      ),
    );

export const opSha256ChipLimits =
  <
    State extends AuthenticationProgramStateError &
      AuthenticationProgramStateMinimum &
      AuthenticationProgramStateResourceLimitsBch2025 &
      AuthenticationProgramStateStack,
  >(
    {
      sha256,
    }: {
      sha256: {
        hash: Sha256['hash'];
      };
    } = { sha256: internalSha256 },
  ): Operation<State> =>
  (state: State) =>
    useOneStackItem(state, (nextState, [value]) =>
      incrementHashDigestIterations(nextState, value.length, (finalState) =>
        pushToStack(finalState, sha256.hash(value)),
      ),
    );

export const opHash160ChipLimits =
  <
    State extends AuthenticationProgramStateError &
      AuthenticationProgramStateMinimum &
      AuthenticationProgramStateResourceLimitsBch2025 &
      AuthenticationProgramStateStack,
  >(
    {
      ripemd160,
      sha256,
    }: {
      sha256: { hash: Sha256['hash'] };
      ripemd160: { hash: Ripemd160['hash'] };
    } = { ripemd160: internalRipemd160, sha256: internalSha256 },
  ): Operation<State> =>
  (state: State) =>
    useOneStackItem(state, (nextState, [value]) =>
      incrementHashDigestIterations(nextState, value.length, (finalState) =>
        pushToStack(finalState, ripemd160.hash(sha256.hash(value))),
      ),
    );

export const opHash256ChipLimits =
  <
    State extends AuthenticationProgramStateError &
      AuthenticationProgramStateMinimum &
      AuthenticationProgramStateResourceLimitsBch2025 &
      AuthenticationProgramStateStack,
  >(
    {
      sha256,
    }: {
      sha256: {
        hash: Sha256['hash'];
      };
    } = { sha256: internalSha256 },
  ): Operation<State> =>
  (state: State) =>
    useOneStackItem(state, (nextState, [value]) =>
      incrementHashDigestIterations(nextState, value.length, (finalState) =>
        pushToStack(finalState, hash256(value, sha256)),
      ),
    );
