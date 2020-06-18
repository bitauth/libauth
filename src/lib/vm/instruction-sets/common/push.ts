import {
  numberToBinUint16LE,
  numberToBinUint32LE,
} from '../../../format/format';
import { range } from '../../../format/hex';
import { Operation } from '../../virtual-machine';
import {
  AuthenticationProgramStateError,
  AuthenticationProgramStateExecutionStack,
  AuthenticationProgramStateMinimum,
  AuthenticationProgramStateStack,
} from '../../vm-types';
import { AuthenticationInstructionPush } from '../instruction-sets-types';

import { pushToStack } from './combinators';
import { applyError, AuthenticationErrorCommon } from './errors';
import { OpcodesCommon } from './opcodes';
import { bigIntToScriptNumber } from './types';

export enum PushOperationConstants {
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
   * Standard consensus parameter for most Bitcoin forks.
   */
  maximumPushSize = 520,
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
 * This method conservatively encodes a `Uint8Array` as a data push. For Script
 * Numbers which can be pushed using a single opcode (-1 through 16), the
 * equivalent bytecode value is returned. Other `data` values will be prefixed
 * with the proper opcode and push length bytes (if necessary) to create the
 * minimal push instruction.
 *
 * Note, while some single-byte Script Number pushes will be minimally-encoded
 * by this method, all larger inputs will be encoded as-is (it cannot be assumed
 * that inputs are intended to be used as Script Numbers). To encode the push of
 * a Script Number, minimally-encode the number before passing it to this
 * method, e.g.:
 * `encodeDataPush(bigIntToScriptNumber(parseBytesAsScriptNumber(nonMinimalNumber)))`.
 *
 * The maximum `bytecode` length which can be encoded for a push in the Bitcoin
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
      ? data[0] !== 0 && data[0] <= PushOperationConstants.pushNumberOpcodes
        ? Uint8Array.of(
            data[0] + PushOperationConstants.pushNumberOpcodesOffset
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
export const isMinimalDataPush = (opcode: number, data: Uint8Array) =>
  data.length === 0
    ? opcode === PushOperationConstants.OP_0
    : data.length === 1
    ? data[0] >= 1 && data[0] <= PushOperationConstants.pushNumberOpcodes
      ? opcode === data[0] + PushOperationConstants.pushNumberOpcodesOffset
      : data[0] === PushOperationConstants.negativeOne
      ? opcode === PushOperationConstants.OP_1NEGATE
      : true
    : data.length <= PushOperationConstants.maximumPushByteOperationSize
    ? opcode === data.length
    : data.length <= PushOperationConstants.maximumPushData1Size
    ? opcode === PushOperationConstants.OP_PUSHDATA_1
    : data.length <= PushOperationConstants.maximumPushData2Size
    ? opcode === PushOperationConstants.OP_PUSHDATA_2
    : true;

export const pushByteOpcodes: readonly OpcodesCommon[] = [
  OpcodesCommon.OP_PUSHBYTES_1,
  OpcodesCommon.OP_PUSHBYTES_2,
  OpcodesCommon.OP_PUSHBYTES_3,
  OpcodesCommon.OP_PUSHBYTES_4,
  OpcodesCommon.OP_PUSHBYTES_5,
  OpcodesCommon.OP_PUSHBYTES_6,
  OpcodesCommon.OP_PUSHBYTES_7,
  OpcodesCommon.OP_PUSHBYTES_8,
  OpcodesCommon.OP_PUSHBYTES_9,
  OpcodesCommon.OP_PUSHBYTES_10,
  OpcodesCommon.OP_PUSHBYTES_11,
  OpcodesCommon.OP_PUSHBYTES_12,
  OpcodesCommon.OP_PUSHBYTES_13,
  OpcodesCommon.OP_PUSHBYTES_14,
  OpcodesCommon.OP_PUSHBYTES_15,
  OpcodesCommon.OP_PUSHBYTES_16,
  OpcodesCommon.OP_PUSHBYTES_17,
  OpcodesCommon.OP_PUSHBYTES_18,
  OpcodesCommon.OP_PUSHBYTES_19,
  OpcodesCommon.OP_PUSHBYTES_20,
  OpcodesCommon.OP_PUSHBYTES_21,
  OpcodesCommon.OP_PUSHBYTES_22,
  OpcodesCommon.OP_PUSHBYTES_23,
  OpcodesCommon.OP_PUSHBYTES_24,
  OpcodesCommon.OP_PUSHBYTES_25,
  OpcodesCommon.OP_PUSHBYTES_26,
  OpcodesCommon.OP_PUSHBYTES_27,
  OpcodesCommon.OP_PUSHBYTES_28,
  OpcodesCommon.OP_PUSHBYTES_29,
  OpcodesCommon.OP_PUSHBYTES_30,
  OpcodesCommon.OP_PUSHBYTES_31,
  OpcodesCommon.OP_PUSHBYTES_32,
  OpcodesCommon.OP_PUSHBYTES_33,
  OpcodesCommon.OP_PUSHBYTES_34,
  OpcodesCommon.OP_PUSHBYTES_35,
  OpcodesCommon.OP_PUSHBYTES_36,
  OpcodesCommon.OP_PUSHBYTES_37,
  OpcodesCommon.OP_PUSHBYTES_38,
  OpcodesCommon.OP_PUSHBYTES_39,
  OpcodesCommon.OP_PUSHBYTES_40,
  OpcodesCommon.OP_PUSHBYTES_41,
  OpcodesCommon.OP_PUSHBYTES_42,
  OpcodesCommon.OP_PUSHBYTES_43,
  OpcodesCommon.OP_PUSHBYTES_44,
  OpcodesCommon.OP_PUSHBYTES_45,
  OpcodesCommon.OP_PUSHBYTES_46,
  OpcodesCommon.OP_PUSHBYTES_47,
  OpcodesCommon.OP_PUSHBYTES_48,
  OpcodesCommon.OP_PUSHBYTES_49,
  OpcodesCommon.OP_PUSHBYTES_50,
  OpcodesCommon.OP_PUSHBYTES_51,
  OpcodesCommon.OP_PUSHBYTES_52,
  OpcodesCommon.OP_PUSHBYTES_53,
  OpcodesCommon.OP_PUSHBYTES_54,
  OpcodesCommon.OP_PUSHBYTES_55,
  OpcodesCommon.OP_PUSHBYTES_56,
  OpcodesCommon.OP_PUSHBYTES_57,
  OpcodesCommon.OP_PUSHBYTES_58,
  OpcodesCommon.OP_PUSHBYTES_59,
  OpcodesCommon.OP_PUSHBYTES_60,
  OpcodesCommon.OP_PUSHBYTES_61,
  OpcodesCommon.OP_PUSHBYTES_62,
  OpcodesCommon.OP_PUSHBYTES_63,
  OpcodesCommon.OP_PUSHBYTES_64,
  OpcodesCommon.OP_PUSHBYTES_65,
  OpcodesCommon.OP_PUSHBYTES_66,
  OpcodesCommon.OP_PUSHBYTES_67,
  OpcodesCommon.OP_PUSHBYTES_68,
  OpcodesCommon.OP_PUSHBYTES_69,
  OpcodesCommon.OP_PUSHBYTES_70,
  OpcodesCommon.OP_PUSHBYTES_71,
  OpcodesCommon.OP_PUSHBYTES_72,
  OpcodesCommon.OP_PUSHBYTES_73,
  OpcodesCommon.OP_PUSHBYTES_74,
  OpcodesCommon.OP_PUSHBYTES_75,
];

const executionIsActive = <
  State extends AuthenticationProgramStateExecutionStack
>(
  state: State
) => state.executionStack.every((item) => item);

export const pushOperation = <
  Opcodes,
  State extends AuthenticationProgramStateStack &
    AuthenticationProgramStateMinimum<Opcodes> &
    AuthenticationProgramStateError<Errors> &
    AuthenticationProgramStateExecutionStack,
  Errors
>(
  flags: { requireMinimalEncoding: boolean },
  maximumPushSize = PushOperationConstants.maximumPushSize
): Operation<State> => (state: State) => {
  const instruction = state.instructions[
    state.ip
  ] as AuthenticationInstructionPush<Opcodes>;
  return instruction.data.length > maximumPushSize
    ? applyError<State, Errors>(
        AuthenticationErrorCommon.exceedsMaximumPush,
        state
      )
    : executionIsActive(state)
    ? flags.requireMinimalEncoding &&
      !isMinimalDataPush(
        (instruction.opcode as unknown) as number,
        instruction.data
      )
      ? applyError<State, Errors>(
          AuthenticationErrorCommon.nonMinimalPush,
          state
        )
      : pushToStack(state, instruction.data)
    : state;
};

export const pushOperations = <
  Opcodes,
  State extends AuthenticationProgramStateStack &
    AuthenticationProgramStateMinimum<Opcodes> &
    AuthenticationProgramStateError<Errors> &
    AuthenticationProgramStateExecutionStack,
  Errors
>(
  flags: { requireMinimalEncoding: boolean },
  maximumPushSize = PushOperationConstants.maximumPushSize
) => {
  const push = pushOperation<Opcodes, State, Errors>(flags, maximumPushSize);
  return range(PushOperationConstants.highestPushDataOpcode + 1).reduce<{
    readonly [opcode: number]: Operation<State>;
  }>((group, i) => ({ ...group, [i]: push }), {});
};

export const pushNumberOpcodes: readonly OpcodesCommon[] = [
  OpcodesCommon.OP_1NEGATE,
  OpcodesCommon.OP_1,
  OpcodesCommon.OP_2,
  OpcodesCommon.OP_3,
  OpcodesCommon.OP_4,
  OpcodesCommon.OP_5,
  OpcodesCommon.OP_6,
  OpcodesCommon.OP_7,
  OpcodesCommon.OP_8,
  OpcodesCommon.OP_9,
  OpcodesCommon.OP_10,
  OpcodesCommon.OP_11,
  OpcodesCommon.OP_12,
  OpcodesCommon.OP_13,
  OpcodesCommon.OP_14,
  OpcodesCommon.OP_15,
  OpcodesCommon.OP_16,
];

const op1NegateValue = -1;

export const pushNumberOperations = <
  Opcodes,
  ProgramState extends AuthenticationProgramStateStack &
    AuthenticationProgramStateMinimum<Opcodes>
>() =>
  pushNumberOpcodes
    .map<[OpcodesCommon, Uint8Array]>((opcode, i) => [
      opcode,
      [op1NegateValue, ...range(PushOperationConstants.pushNumberOpcodes, 1)]
        .map(BigInt)
        .map(bigIntToScriptNumber)[i],
    ])
    .reduce<{
      readonly [opcode: number]: Operation<ProgramState>;
    }>(
      (group, pair) => ({
        ...group,
        [pair[0]]: (state: ProgramState) => pushToStack(state, pair[1].slice()),
      }),
      {}
    );
