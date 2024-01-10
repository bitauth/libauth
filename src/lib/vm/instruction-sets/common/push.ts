import {
  numberToBinUint16LE,
  numberToBinUint32LE,
} from '../../../format/format.js';
import type {
  AuthenticationInstructionPush,
  AuthenticationProgramStateControlStack,
  AuthenticationProgramStateError,
  AuthenticationProgramStateMinimum,
  AuthenticationProgramStateStack,
  Operation,
} from '../../../lib.js';

import { pushToStack } from './combinators.js';
import { ConsensusCommon } from './consensus.js';
import { applyError, AuthenticationErrorCommon } from './errors.js';
import { bigIntToVmNumber } from './instruction-sets-utils.js';

const enum PushOperationConstants {
  OP_0 = 0,
  /**
   * OP_PUSHBYTES_75
   */
  maximumPushByteOperationSize = 0x4b,
  OP_PUSHDATA_1 = 0x4c,
  OP_PUSHDATA_2 = 0x4d,
  OP_PUSHDATA_4 = 0x4e,
  /**
   * OP_PUSHDATA_4
   */
  // eslint-disable-next-line @typescript-eslint/prefer-literal-enum-member
  highestPushDataOpcode = OP_PUSHDATA_4,
  /**
   * For OP_1 to OP_16, `opcode` is the number offset by `0x50` (80):
   *
   * `OP_N = 0x50 + N`
   *
   * OP_0 is really OP_PUSHBYTES_0 (`0x00`), so it does not follow this pattern.
   */
  pushNumberOpcodesOffset = 0x50,
  /** OP_1 through OP_16 */
  pushNumberOpcodes = 16,
  negativeOne = 0x81,
  OP_1NEGATE = 79,
  /**
   * 256 - 1
   */
  maximumPushData1Size = 255,
  /**
   * 256 ** 2 - 1
   */
  maximumPushData2Size = 65535,
  /**
   * 256 ** 4 - 1
   */
  maximumPushData4Size = 4294967295,
}

/**
 * Returns the minimal bytecode required to push the provided `data` to the
 * stack.
 *
 * @remarks
 * This method conservatively encodes a `Uint8Array` as a data push. For VM
 * Numbers that can be pushed using a single opcode (-1 through 16), the
 * equivalent bytecode value is returned. Other `data` values will be prefixed
 * with the proper opcode and push length bytes (if necessary) to create the
 * minimal push instruction.
 *
 * Note, while some single-byte VM Number pushes will be minimally-encoded by
 * this method, all larger inputs will be encoded as-is (it cannot be assumed
 * that inputs are intended to be used as VM Numbers). To encode the push of a
 * VM Number, minimally-encode the number before passing it to this
 * method, e.g.:
 * `encodeDataPush(bigIntToVmNumber(decodeVmNumber(nonMinimalNumber)))`.
 *
 * The maximum `bytecode` length that can be encoded for a push in the Bitcoin
 * system is `4294967295` (~4GB). This method assumes a smaller input – if
 * `bytecode` has the potential to be longer, it should be checked (and the
 * error handled) prior to calling this method.
 *
 * @param data - the Uint8Array to push to the stack
 */
// eslint-disable-next-line complexity
export const encodeDataPush = (data: Uint8Array) =>
  data.length <= PushOperationConstants.maximumPushByteOperationSize
    ? data.length === 0
      ? Uint8Array.of(0)
      : data.length === 1
        ? // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          data[0] !== 0 && data[0]! <= PushOperationConstants.pushNumberOpcodes
          ? Uint8Array.of(
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              data[0]! + PushOperationConstants.pushNumberOpcodesOffset,
            )
          : data[0] === PushOperationConstants.negativeOne
            ? Uint8Array.of(PushOperationConstants.OP_1NEGATE)
            : Uint8Array.from([1, ...data])
        : Uint8Array.from([data.length, ...data])
    : data.length <= PushOperationConstants.maximumPushData1Size
      ? Uint8Array.from([
          PushOperationConstants.OP_PUSHDATA_1,
          data.length,
          ...data,
        ])
      : data.length <= PushOperationConstants.maximumPushData2Size
        ? Uint8Array.from([
            PushOperationConstants.OP_PUSHDATA_2,
            ...numberToBinUint16LE(data.length),
            ...data,
          ])
        : Uint8Array.from([
            PushOperationConstants.OP_PUSHDATA_4,
            ...numberToBinUint32LE(data.length),
            ...data,
          ]);

/**
 * Returns true if the provided `data` is minimally-encoded by the provided
 * `opcode`.
 * @param opcode - the opcode used to push `data`
 * @param data - the contents of the push
 */
// eslint-disable-next-line complexity
export const isMinimalDataPush = (opcode: number, data: Uint8Array) => {
  if (data.length === 0) {
    return opcode === PushOperationConstants.OP_0;
  }
  if (data.length === 1) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    if (data[0]! >= 1 && data[0]! <= PushOperationConstants.pushNumberOpcodes) {
      return (
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        opcode === data[0]! + PushOperationConstants.pushNumberOpcodesOffset
      );
    }
    if (data[0] === PushOperationConstants.negativeOne) {
      return opcode === PushOperationConstants.OP_1NEGATE;
    }
    return true;
  }
  if (data.length <= PushOperationConstants.maximumPushByteOperationSize) {
    return opcode === data.length;
  }
  if (data.length <= PushOperationConstants.maximumPushData1Size) {
    return opcode === PushOperationConstants.OP_PUSHDATA_1;
  }
  if (data.length <= PushOperationConstants.maximumPushData2Size) {
    return opcode === PushOperationConstants.OP_PUSHDATA_2;
  }
  if (data.length <= PushOperationConstants.maximumPushData4Size) {
    return opcode === PushOperationConstants.OP_PUSHDATA_4;
  }
  return false;
};

const executionIsActive = <
  State extends AuthenticationProgramStateControlStack,
>(
  state: State,
) => state.controlStack.every((item) => item);

// TODO: add tests that verify the order of operations below (are non-minimal pushes OK inside unexecuted conditionals?)

export const pushOperation =
  <
    State extends AuthenticationProgramStateControlStack &
      AuthenticationProgramStateError &
      AuthenticationProgramStateMinimum &
      AuthenticationProgramStateStack,
  >(
    maximumPushSize = ConsensusCommon.maximumStackItemLength as number,
  ): Operation<State> =>
  (state: State) => {
    const instruction = state.instructions[
      state.ip
    ] as AuthenticationInstructionPush;
    return instruction.data.length > maximumPushSize
      ? applyError(
          state,
          `${AuthenticationErrorCommon.exceededMaximumStackItemLength} Item length: ${instruction.data.length} bytes.`,
        )
      : executionIsActive(state)
        ? isMinimalDataPush(instruction.opcode, instruction.data)
          ? pushToStack(state, instruction.data)
          : applyError(state, AuthenticationErrorCommon.nonMinimalPush)
        : state;
  };

/**
 * @param number - the number that is pushed to the stack by this operation.
 * @returns an operation that pushes a number to the stack.
 */
export const pushNumberOperation = <
  ProgramState extends AuthenticationProgramStateMinimum &
    AuthenticationProgramStateStack,
>(
  number: number,
) => {
  const value = bigIntToVmNumber(BigInt(number));
  return (state: ProgramState) => pushToStack(state, value);
};
