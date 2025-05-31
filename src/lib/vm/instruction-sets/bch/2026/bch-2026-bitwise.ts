import type {
  AuthenticationProgramStateError,
  AuthenticationProgramStateResourceLimits,
  AuthenticationProgramStateStack,
} from '../../../../lib.js';
import {
  applyError,
  pushToStack,
  pushToStackVmNumberChecked,
  useOneStackItem,
  useOneVmNumber,
} from '../../common/common.js';

import { ConsensusBch2026 } from './bch-2026-consensus.js';
import { AuthenticationErrorBch2026 } from './bch-2026-errors.js';

const enum Constants {
  allBits = 0xff,
  bitsPerByte = 8,
}

export const opInvert = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack,
>(
  state: State,
): State =>
  useOneStackItem(state, (nextState, [a]) =>
    // eslint-disable-next-line no-bitwise
    pushToStack(nextState, [a.map((v) => v ^ Constants.allBits)]),
  );

const useOneShiftBitCount = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateResourceLimits &
    AuthenticationProgramStateStack,
>(
  state: State,
  shiftOperation: (nextState: State, [bitCount]: [bigint]) => State,
  { maximumStackItemLength = ConsensusBch2026.maximumStackItemLength } = {},
) => {
  const maximumBitCount = maximumStackItemLength * Constants.bitsPerByte;

  return useOneVmNumber(state, (nextState, [bitCount]) => {
    if (bitCount < 0n || bitCount > maximumBitCount) {
      return applyError(
        nextState,
        AuthenticationErrorBch2026.invalidShiftBitCount,
        `Bit count (${bitCount}) is outside of the valid range: 0 to ${maximumBitCount} (inclusive).`,
      );
    }
    return shiftOperation(nextState, [bitCount]);
  });
};

const createOpShiftNum =
  (
    maximumStackItemLength: number,
    shiftOperation: (numericValue: bigint, bitCount: bigint) => bigint,
  ) =>
  <
    State extends AuthenticationProgramStateError &
      AuthenticationProgramStateResourceLimits &
      AuthenticationProgramStateStack,
  >(
    state: State,
  ): State =>
    useOneShiftBitCount(
      state,
      (nextState, [bitCount]) =>
        useOneVmNumber(nextState, (finalState, [numericValue]) => {
          const result = shiftOperation(numericValue, bitCount);
          return pushToStackVmNumberChecked(finalState, result, {
            hasEncodingCost: true,
            maximumVmNumberByteLength: maximumStackItemLength,
          });
        }),
      { maximumStackItemLength },
    );

export const createOpLShiftNum = ({
  maximumStackItemLength = ConsensusBch2026.maximumStackItemLength,
} = {}) =>
  createOpShiftNum(
    maximumStackItemLength,
    // eslint-disable-next-line no-bitwise
    (numericValue, bitCount) => numericValue << bitCount,
  );

export const createOpRShiftNum = ({
  maximumStackItemLength = ConsensusBch2026.maximumStackItemLength,
} = {}) =>
  createOpShiftNum(
    maximumStackItemLength,
    // eslint-disable-next-line no-bitwise
    (numericValue, bitCount) => numericValue >> bitCount,
  );

// eslint-disable-next-line functional/no-return-void
const copyWholeBytes = (
  src: Uint8Array,
  dst: Uint8Array,
  byteShift: number,
  left: boolean,
  // eslint-disable-next-line @typescript-eslint/max-params
) => {
  if (byteShift >= src.length) return;
  if (left) {
    // eslint-disable-next-line functional/no-expression-statements
    dst.set(src.subarray(byteShift), 0);
    return;
  }
  // eslint-disable-next-line functional/no-expression-statements
  dst.set(src.subarray(0, src.length - byteShift), byteShift);
};

const residualLeftShift = (buf: Uint8Array, bitShift: number): Uint8Array => {
  // eslint-disable-next-line functional/no-let
  let carry = 0;
  // eslint-disable-next-line functional/no-loop-statements, functional/no-let, no-plusplus
  for (let i = buf.length - 1; i >= 0; i--) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const v = buf[i]!;
    // eslint-disable-next-line functional/no-expression-statements, functional/immutable-data, no-bitwise
    buf[i] = ((v << bitShift) | carry) & Constants.allBits;
    // eslint-disable-next-line functional/no-expression-statements, no-bitwise
    carry = v >> (Constants.bitsPerByte - bitShift);
  }
  return buf;
};

const residualRightShift = (buf: Uint8Array, bitShift: number): Uint8Array => {
  // eslint-disable-next-line functional/no-let
  let carry = 0;
  // eslint-disable-next-line functional/no-loop-statements, functional/no-let, no-plusplus
  for (let i = 0; i < buf.length; i++) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const v = buf[i]!;
    // eslint-disable-next-line functional/no-expression-statements, functional/immutable-data, no-bitwise
    buf[i] = ((v >> bitShift) | carry) & Constants.allBits;
    // eslint-disable-next-line functional/no-expression-statements, no-bitwise
    carry = (v << (Constants.bitsPerByte - bitShift)) & Constants.allBits;
  }
  return buf;
};

const shiftFixed = (
  src: Uint8Array,
  bitCount: bigint,
  isLeftShift: boolean,
): Uint8Array => {
  const s = Number(bitCount);
  if (!s || !src.length) return src.slice();

  const len = src.length;
  const dst = new Uint8Array(len);
  const byteShift = Math.floor(s / Constants.bitsPerByte);
  const bitShift = s % Constants.bitsPerByte;

  // eslint-disable-next-line functional/no-expression-statements
  copyWholeBytes(src, dst, byteShift, isLeftShift);
  if (!bitShift) return dst;

  return isLeftShift
    ? residualLeftShift(dst, bitShift)
    : residualRightShift(dst, bitShift);
};

/**
 * Perform a fixed-length, logical left shift of `bin` by the `bitCount`,
 * equivalent to `OP_LSHIFTBIN` in the Bitcoin Cash VM.
 * @param bin - the Uint8Array to shift.
 * @param bitCount - the count of bits by which to shift `bin`.
 */
export const binaryShiftLeft = (bin: Uint8Array, bitCount: bigint) =>
  shiftFixed(bin, bitCount, true);

/**
 * Perform a fixed-length, logical right shift of `bin` by the `bitCount`,
 * equivalent to `OP_RSHIFTBIN` in the Bitcoin Cash VM.
 * @param bin - the Uint8Array to shift.
 * @param bitCount - the count of bits by which to shift `bin`.
 */
export const binaryShiftRight = (bin: Uint8Array, bitCount: bigint) =>
  shiftFixed(bin, bitCount, false);

const createOpShiftBin =
  (
    maximumStackItemLength: number,
    shiftOperation: (bin: Uint8Array, bitCount: bigint) => Uint8Array,
  ) =>
  <
    State extends AuthenticationProgramStateError &
      AuthenticationProgramStateResourceLimits &
      AuthenticationProgramStateStack,
  >(
    state: State,
  ): State =>
    useOneShiftBitCount(
      state,
      (nextState, [bitCount]) =>
        useOneStackItem(nextState, (finalState, [bin]) =>
          pushToStack(finalState, [shiftOperation(bin, bitCount)]),
        ),
      { maximumStackItemLength },
    );

export const createOpLShiftBin = ({
  maximumStackItemLength = ConsensusBch2026.maximumStackItemLength,
} = {}) => createOpShiftBin(maximumStackItemLength, binaryShiftLeft);

export const createOpRShiftBin = ({
  maximumStackItemLength = ConsensusBch2026.maximumStackItemLength,
} = {}) => createOpShiftBin(maximumStackItemLength, binaryShiftRight);
