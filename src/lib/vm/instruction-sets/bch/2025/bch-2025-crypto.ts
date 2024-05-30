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

import { ConsensusBch2025 } from './bch-2025-consensus.js';
import { AuthenticationErrorBch2025 } from './bch-2025-errors.js';

/**
 * Given a message length, compute and return the number of hash digest
 * iterations required. (See `CHIP-2021-05-vm-limits`)
 */
export const lengthToHashDigestIterationCount = (messageLength: number) =>
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
  {
    strict,
    messageLength,
    resultIsHashed,
  }: {
    /**
     * If `true`, the limit will use
     * {@link ConsensusBch2025.standardHashDigestIterationsPerByte}, otherwise
     * it will use
     * {@link ConsensusBch2025.nonstandardHashDigestIterationsPerByte}.
     */
    strict: boolean;
    /**
     * The length of the message to be hashed.
     */
    messageLength: number;
    /**
     * If `true`, the result of the initial hashing process is to be provided to
     * the hashing function one final time (i.e. for `OP_HASH160`
     * and `OP_HASH256`).
     */
    resultIsHashed: boolean;
  },
  operation: (nextState: State) => State,
) => {
  const requiredTotalIterations =
    state.metrics.hashDigestIterations +
    (resultIsHashed ? 1 : 0) +
    lengthToHashDigestIterationCount(messageLength);
  const maximumIterationsPerByte = strict
    ? ConsensusBch2025.standardHashDigestIterationsPerByte
    : ConsensusBch2025.nonstandardHashDigestIterationsPerByte;
  const maximumHashDigestIterations = Math.floor(
    maximumIterationsPerByte * state.transactionLengthBytes,
  );
  if (requiredTotalIterations > maximumHashDigestIterations) {
    return applyError(
      state,
      AuthenticationErrorBch2025.excessiveHashing,
      `Spending transaction byte length: ${
        state.transactionLengthBytes
      }; maximum hash digest iterations: ${maximumHashDigestIterations} (${maximumIterationsPerByte} hash digest iterations per ${
        strict ? 'standard' : 'nonstandard'
      } spending-transaction byte); expected hash digest iterations following operation: ${requiredTotalIterations}.`,
    );
  }
  // eslint-disable-next-line functional/no-expression-statements, functional/immutable-data
  state.metrics.hashDigestIterations = requiredTotalIterations;
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
      strict,
      ripemd160,
    }: {
      /**
       * If `true`, the limit will use
       * {@link ConsensusBch2025.standardHashDigestIterationsPerByte}, otherwise
       * it will use
       * {@link ConsensusBch2025.nonstandardHashDigestIterationsPerByte}.
       */
      strict: boolean;
      ripemd160: { hash: Ripemd160['hash'] };
    } = { ripemd160: internalRipemd160, strict: true },
  ): Operation<State> =>
  (state: State) =>
    useOneStackItem(state, (nextState, [value]) =>
      incrementHashDigestIterations(
        nextState,
        { messageLength: value.length, resultIsHashed: false, strict },
        (finalState) => pushToStack(finalState, ripemd160.hash(value)),
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
      strict,
    }: {
      sha1: { hash: Sha1['hash'] };
      /**
       * If `true`, the limit will use
       * {@link ConsensusBch2025.standardHashDigestIterationsPerByte}, otherwise
       * it will use
       * {@link ConsensusBch2025.nonstandardHashDigestIterationsPerByte}.
       */
      strict: boolean;
    } = { sha1: internalSha1, strict: true },
  ): Operation<State> =>
  (state: State) =>
    useOneStackItem(state, (nextState, [value]) =>
      incrementHashDigestIterations(
        nextState,
        { messageLength: value.length, resultIsHashed: false, strict },
        (finalState) => pushToStack(finalState, sha1.hash(value)),
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
      strict,
    }: {
      sha256: {
        hash: Sha256['hash'];
      };
      /**
       * If `true`, the limit will use
       * {@link ConsensusBch2025.standardHashDigestIterationsPerByte}, otherwise
       * it will use
       * {@link ConsensusBch2025.nonstandardHashDigestIterationsPerByte}.
       */
      strict: boolean;
    } = { sha256: internalSha256, strict: true },
  ): Operation<State> =>
  (state: State) =>
    useOneStackItem(state, (nextState, [value]) =>
      incrementHashDigestIterations(
        nextState,
        { messageLength: value.length, resultIsHashed: false, strict },
        (finalState) => pushToStack(finalState, sha256.hash(value)),
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
      strict,
    }: {
      sha256: { hash: Sha256['hash'] };
      ripemd160: { hash: Ripemd160['hash'] };
      /**
       * If `true`, the limit will use
       * {@link ConsensusBch2025.standardHashDigestIterationsPerByte}, otherwise
       * it will use
       * {@link ConsensusBch2025.nonstandardHashDigestIterationsPerByte}.
       */
      strict: boolean;
    } = { ripemd160: internalRipemd160, sha256: internalSha256, strict: true },
  ): Operation<State> =>
  (state: State) =>
    useOneStackItem(state, (nextState, [value]) =>
      incrementHashDigestIterations(
        nextState,
        { messageLength: value.length, resultIsHashed: true, strict },
        (finalState) =>
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
      strict,
    }: {
      sha256: {
        hash: Sha256['hash'];
      };
      /**
       * If `true`, the limit will use
       * {@link ConsensusBch2025.standardHashDigestIterationsPerByte}, otherwise
       * it will use
       * {@link ConsensusBch2025.nonstandardHashDigestIterationsPerByte}.
       */
      strict: boolean;
    } = { sha256: internalSha256, strict: true },
  ): Operation<State> =>
  (state: State) =>
    useOneStackItem(state, (nextState, [value]) =>
      incrementHashDigestIterations(
        nextState,
        { messageLength: value.length, resultIsHashed: true, strict },
        (finalState) => pushToStack(finalState, hash256(value, sha256)),
      ),
    );
