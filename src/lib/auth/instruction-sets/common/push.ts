/* istanbul ignore file */ // TODO: stabilize & test

import { range } from '../../../utils/hex';
import { MinimumProgramState, StackState } from '../../state';
import { Operation } from '../../virtual-machine';
import {
  AuthenticationInstructionPush,
  Bytes,
  numberToLittleEndianBin
} from '../instruction-sets';
import { CommonOpcodes } from './opcodes';
import { bigIntToScriptNumber } from './types';

export enum PushOperationConstants {
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
  maximumPushData2Size = 65536,
  /**
   * 256 ** 4 - 1
   */
  maximumPushData4Size = 4294967295
}

/**
 * Prefix a `Uint8Array` with the proper opcode and push length bytes (if
 * necessary) to create a push instruction for `data`.
 *
 * Note, the maximum `bytecode` length which can be encoded for a push in the
 * Bitcoin system is `4294967295` (~4GB). This method assumes a smaller input – if
 * `bytecode` has the potential to be longer, it should be checked (and the
 * error handled) prior to calling this method.
 *
 * @param data the Uint8Array to push to the stack
 */
// tslint:disable-next-line:cyclomatic-complexity
export const prefixDataPush = (data: Uint8Array) =>
  data.length <= PushOperationConstants.maximumPushByteOperationSize
    ? data.length === 1 && data[0] <= PushOperationConstants.pushNumberOpcodes
      ? Uint8Array.of(data[0] + PushOperationConstants.pushNumberOpcodesOffset)
      : Uint8Array.from([data.length, ...data])
    : data.length <= PushOperationConstants.maximumPushData1Size
    ? Uint8Array.from([
        PushOperationConstants.OP_PUSHDATA_1,
        ...numberToLittleEndianBin(data.length, Bytes.Uint8),
        ...data
      ])
    : data.length <= PushOperationConstants.maximumPushData2Size
    ? Uint8Array.from([
        PushOperationConstants.OP_PUSHDATA_2,
        ...numberToLittleEndianBin(data.length, Bytes.Uint16),
        ...data
      ])
    : Uint8Array.from([
        PushOperationConstants.OP_PUSHDATA_4,
        ...numberToLittleEndianBin(data.length, Bytes.Uint32),
        ...data
      ]);

export const pushByteOpcodes: ReadonlyArray<CommonOpcodes> = [
  CommonOpcodes.OP_PUSHBYTES_1,
  CommonOpcodes.OP_PUSHBYTES_2,
  CommonOpcodes.OP_PUSHBYTES_3,
  CommonOpcodes.OP_PUSHBYTES_4,
  CommonOpcodes.OP_PUSHBYTES_5,
  CommonOpcodes.OP_PUSHBYTES_6,
  CommonOpcodes.OP_PUSHBYTES_7,
  CommonOpcodes.OP_PUSHBYTES_8,
  CommonOpcodes.OP_PUSHBYTES_9,
  CommonOpcodes.OP_PUSHBYTES_10,
  CommonOpcodes.OP_PUSHBYTES_11,
  CommonOpcodes.OP_PUSHBYTES_12,
  CommonOpcodes.OP_PUSHBYTES_13,
  CommonOpcodes.OP_PUSHBYTES_14,
  CommonOpcodes.OP_PUSHBYTES_15,
  CommonOpcodes.OP_PUSHBYTES_16,
  CommonOpcodes.OP_PUSHBYTES_17,
  CommonOpcodes.OP_PUSHBYTES_18,
  CommonOpcodes.OP_PUSHBYTES_19,
  CommonOpcodes.OP_PUSHBYTES_20,
  CommonOpcodes.OP_PUSHBYTES_21,
  CommonOpcodes.OP_PUSHBYTES_22,
  CommonOpcodes.OP_PUSHBYTES_23,
  CommonOpcodes.OP_PUSHBYTES_24,
  CommonOpcodes.OP_PUSHBYTES_25,
  CommonOpcodes.OP_PUSHBYTES_26,
  CommonOpcodes.OP_PUSHBYTES_27,
  CommonOpcodes.OP_PUSHBYTES_28,
  CommonOpcodes.OP_PUSHBYTES_29,
  CommonOpcodes.OP_PUSHBYTES_30,
  CommonOpcodes.OP_PUSHBYTES_31,
  CommonOpcodes.OP_PUSHBYTES_32,
  CommonOpcodes.OP_PUSHBYTES_33,
  CommonOpcodes.OP_PUSHBYTES_34,
  CommonOpcodes.OP_PUSHBYTES_35,
  CommonOpcodes.OP_PUSHBYTES_36,
  CommonOpcodes.OP_PUSHBYTES_37,
  CommonOpcodes.OP_PUSHBYTES_38,
  CommonOpcodes.OP_PUSHBYTES_39,
  CommonOpcodes.OP_PUSHBYTES_40,
  CommonOpcodes.OP_PUSHBYTES_41,
  CommonOpcodes.OP_PUSHBYTES_42,
  CommonOpcodes.OP_PUSHBYTES_43,
  CommonOpcodes.OP_PUSHBYTES_44,
  CommonOpcodes.OP_PUSHBYTES_45,
  CommonOpcodes.OP_PUSHBYTES_46,
  CommonOpcodes.OP_PUSHBYTES_47,
  CommonOpcodes.OP_PUSHBYTES_48,
  CommonOpcodes.OP_PUSHBYTES_49,
  CommonOpcodes.OP_PUSHBYTES_50,
  CommonOpcodes.OP_PUSHBYTES_51,
  CommonOpcodes.OP_PUSHBYTES_52,
  CommonOpcodes.OP_PUSHBYTES_53,
  CommonOpcodes.OP_PUSHBYTES_54,
  CommonOpcodes.OP_PUSHBYTES_55,
  CommonOpcodes.OP_PUSHBYTES_56,
  CommonOpcodes.OP_PUSHBYTES_57,
  CommonOpcodes.OP_PUSHBYTES_58,
  CommonOpcodes.OP_PUSHBYTES_59,
  CommonOpcodes.OP_PUSHBYTES_60,
  CommonOpcodes.OP_PUSHBYTES_61,
  CommonOpcodes.OP_PUSHBYTES_62,
  CommonOpcodes.OP_PUSHBYTES_63,
  CommonOpcodes.OP_PUSHBYTES_64,
  CommonOpcodes.OP_PUSHBYTES_65,
  CommonOpcodes.OP_PUSHBYTES_66,
  CommonOpcodes.OP_PUSHBYTES_67,
  CommonOpcodes.OP_PUSHBYTES_68,
  CommonOpcodes.OP_PUSHBYTES_69,
  CommonOpcodes.OP_PUSHBYTES_70,
  CommonOpcodes.OP_PUSHBYTES_71,
  CommonOpcodes.OP_PUSHBYTES_72,
  CommonOpcodes.OP_PUSHBYTES_73,
  CommonOpcodes.OP_PUSHBYTES_74,
  CommonOpcodes.OP_PUSHBYTES_75
];

export const pushOperation = <
  Opcodes,
  ProgramState extends StackState & MinimumProgramState<Opcodes>
>(): Operation<ProgramState> => (state: ProgramState) => {
  const instruction = state.instructions[
    state.ip
  ] as AuthenticationInstructionPush<Opcodes>;
  // tslint:disable-next-line:no-expression-statement
  state.stack.push(instruction.data);
  return state;
};

export const pushOperations = <
  Opcodes,
  ProgramState extends StackState & MinimumProgramState<Opcodes>
>() => {
  const push = pushOperation<Opcodes, ProgramState>();
  return range(PushOperationConstants.highestPushDataOpcode + 1).reduce<{
    readonly [opcode: number]: Operation<ProgramState>;
  }>((group, i) => ({ ...group, [i]: push }), {});
};

export const pushNumberOpcodes: ReadonlyArray<CommonOpcodes> = [
  CommonOpcodes.OP_1NEGATE,
  CommonOpcodes.OP_1,
  CommonOpcodes.OP_2,
  CommonOpcodes.OP_3,
  CommonOpcodes.OP_4,
  CommonOpcodes.OP_5,
  CommonOpcodes.OP_6,
  CommonOpcodes.OP_7,
  CommonOpcodes.OP_8,
  CommonOpcodes.OP_9,
  CommonOpcodes.OP_10,
  CommonOpcodes.OP_11,
  CommonOpcodes.OP_12,
  CommonOpcodes.OP_13,
  CommonOpcodes.OP_14,
  CommonOpcodes.OP_15,
  CommonOpcodes.OP_16
];

export const pushNumberOperations = <
  Opcodes,
  ProgramState extends StackState & MinimumProgramState<Opcodes>
>() =>
  pushNumberOpcodes
    .map<[CommonOpcodes, Uint8Array]>((opcode, i) => [
      opcode,
      [-1, ...range(PushOperationConstants.pushNumberOpcodes, 1)]
        .map(BigInt)
        .map(bigIntToScriptNumber)[i]
    ])
    .reduce<{
      readonly [opcode: number]: Operation<ProgramState>;
    }>(
      (group, pair) => ({
        ...group,
        [pair[0]]: (state: ProgramState) => {
          // tslint:disable-next-line:no-expression-statement
          state.stack.push(pair[1].slice());
          return state;
        }
      }),
      {}
    );
