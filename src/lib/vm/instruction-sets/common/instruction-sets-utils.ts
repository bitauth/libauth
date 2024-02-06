import {
  isPayToPublicKey,
  isPayToPublicKeyHash,
  isPayToScriptHash20,
  isPayToScriptHash32,
} from '../../../address/address.js';
import {
  binToHex,
  flattenBinArray,
  numberToBinUint16LE,
  numberToBinUint32LE,
} from '../../../format/format.js';
import type {
  AuthenticationInstruction,
  AuthenticationInstructionMalformed,
  AuthenticationInstructionMaybeMalformed,
  AuthenticationInstructionPush,
  AuthenticationInstructionPushMalformedLength,
  AuthenticationInstructions,
  AuthenticationInstructionsMalformed,
  AuthenticationInstructionsMaybeMalformed,
  Output,
} from '../../../lib.js';
import { encodeTransactionOutput } from '../../../message/message.js';
import { OpcodesBCH } from '../bch/2023/bch-2023-opcodes.js';
import { OpcodesBTC } from '../btc/btc-opcodes.js';

/**
 * A type-guard that checks if the provided instruction is malformed.
 * @param instruction - the instruction to check
 */
export const authenticationInstructionIsMalformed = (
  instruction: AuthenticationInstructionMaybeMalformed,
): instruction is AuthenticationInstructionMalformed =>
  'malformed' in instruction;

/**
 * A type-guard that checks if the final instruction in the provided array of
 * instructions is malformed. (Only the final instruction can be malformed.)
 * @param instructions - the array of instructions to check
 */
export const authenticationInstructionsAreMalformed = (
  instructions: AuthenticationInstructionsMaybeMalformed,
): instructions is AuthenticationInstructionsMalformed =>
  instructions.length > 0 &&
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  authenticationInstructionIsMalformed(instructions[instructions.length - 1]!);

export const authenticationInstructionsArePushInstructions = (
  instructions: AuthenticationInstructions,
): instructions is AuthenticationInstructionPush[] =>
  instructions.every((instruction) => 'data' in instruction);

const enum CommonPushOpcodes {
  OP_0 = 0x00,
  OP_PUSHDATA_1 = 0x4c,
  OP_PUSHDATA_2 = 0x4d,
  OP_PUSHDATA_4 = 0x4e,
}

const uint8Bytes = 1;
const uint16Bytes = 2;
const uint32Bytes = 4;

/**
 * Decode a little endian number of `length` from virtual machine `bytecode`
 * beginning at `index`.
 */
export const decodeLittleEndianNumber = (
  bytecode: Uint8Array,
  index: number,
  length: typeof uint8Bytes | typeof uint16Bytes | typeof uint32Bytes,
) => {
  const view = new DataView(bytecode.buffer, index, length);
  const readAsLittleEndian = true;
  return length === uint8Bytes
    ? view.getUint8(0)
    : length === uint16Bytes
      ? view.getUint16(0, readAsLittleEndian)
      : view.getUint32(0, readAsLittleEndian);
};

/**
 * Returns the number of bytes used to indicate the length of the push in this
 * operation.
 * @param opcode - an opcode between 0x00 and 0xff
 */
export const opcodeToPushLength = (
  opcode: number,
): typeof uint8Bytes | typeof uint16Bytes | typeof uint32Bytes | 0 =>
  ({
    [CommonPushOpcodes.OP_PUSHDATA_1]: uint8Bytes as typeof uint8Bytes,
    [CommonPushOpcodes.OP_PUSHDATA_2]: uint16Bytes as typeof uint16Bytes,
    [CommonPushOpcodes.OP_PUSHDATA_4]: uint32Bytes as typeof uint32Bytes,
  })[opcode] ?? 0;

/**
 * Decode one instruction from the provided virtual machine bytecode.
 *
 * Returns an object with an `instruction` referencing a
 * {@link AuthenticationInstructionMaybeMalformed}, and a `nextIndex` indicating
 * the next index from which to read. If the next index is greater than or equal
 * to the length of the bytecode, the bytecode has been fully decoded.
 *
 * The final {@link AuthenticationInstructionMaybeMalformed} in the bytecode may
 * be malformed if 1) the final operation is a push and 2) too few bytes remain
 * for the push operation to complete.
 *
 * @param bytecode - the virtual machine bytecode from which to read the next
 * instruction
 * @param index - the index from which to begin reading
 */
// eslint-disable-next-line complexity
export const decodeAuthenticationInstruction = (
  bytecode: Uint8Array,
  index: number,
): {
  instruction: AuthenticationInstructionMaybeMalformed;
  nextIndex: number;
} => {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const opcode = bytecode[index]!;
  if (opcode > CommonPushOpcodes.OP_PUSHDATA_4) {
    return {
      instruction: {
        opcode,
      },
      nextIndex: index + 1,
    };
  }
  const lengthBytes = opcodeToPushLength(opcode);

  if (lengthBytes !== 0 && index + lengthBytes >= bytecode.length) {
    const sliceStart = index + 1;
    const sliceEnd = sliceStart + lengthBytes;
    return {
      instruction: {
        expectedLengthBytes: lengthBytes,
        length: bytecode.slice(sliceStart, sliceEnd),
        malformed: true,
        opcode,
      },
      nextIndex: sliceEnd,
    };
  }

  const dataBytes =
    lengthBytes === 0
      ? opcode
      : decodeLittleEndianNumber(bytecode, index + 1, lengthBytes);
  const dataStart = index + 1 + lengthBytes;
  const dataEnd = dataStart + dataBytes;
  return {
    instruction: {
      data: bytecode.slice(dataStart, dataEnd),
      ...(dataEnd > bytecode.length
        ? {
            expectedDataBytes: dataEnd - dataStart,
            malformed: true,
          }
        : undefined),
      opcode,
    },
    nextIndex: dataEnd,
  };
};

/**
 * @param instruction - the {@link AuthenticationInstruction} to clone.
 * @returns A copy of the provided {@link AuthenticationInstruction}.
 *
 * @deprecated use `structuredClone` instead
 */
export const cloneAuthenticationInstruction = (
  instruction: AuthenticationInstruction,
): AuthenticationInstruction => ({
  ...('data' in instruction ? { data: instruction.data } : {}),
  opcode: instruction.opcode,
});

/**
 * Decode authentication virtual machine bytecode (`lockingBytecode` or
 * `unlockingBytecode`) into {@link AuthenticationInstructionsMaybeMalformed}.
 * The method {@link authenticationInstructionsAreMalformed} can be used to
 * check if these instructions include a malformed instruction. If not, they are
 * valid {@link AuthenticationInstructions}.
 *
 * @param bytecode - the authentication virtual machine bytecode to decode
 */
export const decodeAuthenticationInstructions = (bytecode: Uint8Array) => {
  const instructions = [] as AuthenticationInstructionsMaybeMalformed;
  // eslint-disable-next-line functional/no-let
  let i = 0;
  // eslint-disable-next-line functional/no-loop-statements
  while (i < bytecode.length) {
    const { instruction, nextIndex } = decodeAuthenticationInstruction(
      bytecode,
      i,
    );
    // eslint-disable-next-line functional/no-expression-statements
    i = nextIndex;
    // eslint-disable-next-line functional/no-expression-statements, functional/immutable-data
    (instructions as AuthenticationInstruction[]).push(
      instruction as AuthenticationInstruction,
    );
  }
  return instructions;
};

/**
 * OP_0 is the only single-word push. All other push instructions will
 * disassemble to multiple ASM words. (OP_1-OP_16 are handled like normal
 * operations.)
 */
const isMultiWordPush = (opcode: number) => opcode !== CommonPushOpcodes.OP_0;
const formatAsmPushHex = (data: Uint8Array) =>
  data.length > 0 ? `0x${binToHex(data)}` : '';
const formatMissingBytesAsm = (missing: number) =>
  `[missing ${missing} byte${missing === 1 ? '' : 's'}]`;
const hasMalformedLength = (
  instruction: AuthenticationInstructionMalformed,
): instruction is AuthenticationInstructionPushMalformedLength =>
  'length' in instruction;
const isPushData = (pushOpcode: number) =>
  pushOpcode >= CommonPushOpcodes.OP_PUSHDATA_1;

/**
 * Disassemble a malformed authentication instruction into a string description.
 * @param opcodes - a mapping of possible opcodes to their string representation
 * @param instruction - the {@link AuthenticationInstructionMalformed} to
 * disassemble
 */
export const disassembleAuthenticationInstructionMalformed = (
  opcodes: { [opcode: number]: string },
  instruction: AuthenticationInstructionMalformed,
): string =>
  `${opcodes[instruction.opcode] ?? 'OP_UNKNOWN'} ${
    hasMalformedLength(instruction)
      ? `${formatAsmPushHex(instruction.length)}${formatMissingBytesAsm(
          instruction.expectedLengthBytes - instruction.length.length,
        )}`
      : `${
          isPushData(instruction.opcode)
            ? `${instruction.expectedDataBytes} `
            : ''
        }${formatAsmPushHex(instruction.data)}${formatMissingBytesAsm(
          instruction.expectedDataBytes - instruction.data.length,
        )}`
  }`;

/**
 * Disassemble a properly-formed authentication instruction into a string
 * description.
 * @param opcodes - a mapping of possible opcodes to their string representation
 * @param instruction - the instruction to disassemble
 */
export const disassembleAuthenticationInstruction = (
  opcodes: { [opcode: number]: string },
  instruction: AuthenticationInstruction,
): string =>
  `${opcodes[instruction.opcode] ?? 'OP_UNKNOWN'}${
    'data' in instruction && isMultiWordPush(instruction.opcode)
      ? ` ${
          isPushData(instruction.opcode) ? `${instruction.data.length} ` : ''
        }${formatAsmPushHex(instruction.data)}`
      : ''
  }`;

/**
 * Disassemble a single {@link AuthenticationInstructionMaybeMalformed} into its
 * ASM representation.
 *
 * @param opcodes - a mapping of possible opcodes to their string representation
 * @param instruction - the instruction to disassemble
 */
export const disassembleAuthenticationInstructionMaybeMalformed = (
  opcodes: { [opcode: number]: string },
  instruction: AuthenticationInstructionMaybeMalformed,
): string =>
  authenticationInstructionIsMalformed(instruction)
    ? disassembleAuthenticationInstructionMalformed(opcodes, instruction)
    : disassembleAuthenticationInstruction(opcodes, instruction);

/**
 * Disassemble an array of {@link AuthenticationInstructionMaybeMalformed}
 * (including potentially malformed instructions) into its ASM representation.
 *
 * This method supports disassembling an array including multiple
 * {@link AuthenticationInstructionMaybeMalformed}s, rather than the more
 * constrained {@link AuthenticationInstructionsMaybeMalformed} (may only
 * include one malformed instruction as the last item in the array).
 *
 * @param opcodes - a mapping of possible opcodes to their string representation
 * @param instructions - the array of instructions to disassemble
 */
export const disassembleAuthenticationInstructionsMaybeMalformed = (
  opcodes: { [opcode: number]: string },
  instructions: AuthenticationInstructionMaybeMalformed[],
): string =>
  instructions
    .map((instruction) =>
      disassembleAuthenticationInstructionMaybeMalformed(opcodes, instruction),
    )
    .join(' ');

/**
 * Disassemble authentication bytecode into a lossless ASM representation. (All
 * push operations are represented with the same opcodes used in the bytecode,
 * even when non-minimally encoded.)
 *
 * @param opcodes - a mapping of possible opcodes to their string representation
 * @param bytecode - the authentication bytecode to disassemble
 */
export const disassembleBytecode = (
  opcodes: { [opcode: number]: string },
  bytecode: Uint8Array,
) =>
  disassembleAuthenticationInstructionsMaybeMalformed(
    opcodes,
    decodeAuthenticationInstructions(bytecode),
  );

/**
 * Disassemble BCH authentication bytecode into its ASM representation.
 *
 * Note, this method automatically uses the latest BCH instruction set. To
 * manually select an instruction set, use {@link disassembleBytecode}.
 *
 * @param bytecode - the virtual machine bytecode to disassemble
 */
export const disassembleBytecodeBCH = (bytecode: Uint8Array) =>
  disassembleAuthenticationInstructionsMaybeMalformed(
    OpcodesBCH,
    decodeAuthenticationInstructions(bytecode),
  );

/**
 * Disassemble BTC authentication bytecode into its ASM representation.
 *
 * Note, this method automatically uses the latest BTC instruction set. To
 * manually select an instruction set, use {@link disassembleBytecode}.
 *
 * @param bytecode - the virtual machine bytecode to disassemble
 */
export const disassembleBytecodeBTC = (bytecode: Uint8Array) =>
  disassembleAuthenticationInstructionsMaybeMalformed(
    OpcodesBTC,
    decodeAuthenticationInstructions(bytecode),
  );

/**
 * Create an object where each key is an opcode identifier and each value is
 * the bytecode value (`Uint8Array`) it represents.
 * @param opcodes - An opcode enum, e.g. {@link OpcodesBCH}
 */
export const generateBytecodeMap = (opcodes: { [opcode: string]: unknown }) =>
  Object.entries(opcodes)
    .filter<[string, number]>(
      (entry): entry is [string, number] => typeof entry[1] === 'number',
    )
    .reduce<{ [opcode: string]: Uint8Array }>(
      (identifiers, pair) => ({
        ...identifiers,
        [pair[0]]: Uint8Array.of(pair[1]),
      }),
      {},
    );

const getInstructionLengthBytes = (
  instruction: AuthenticationInstructionPush,
) => {
  const { opcode } = instruction;
  const expectedLength = opcodeToPushLength(opcode);
  return expectedLength === uint8Bytes
    ? Uint8Array.of(instruction.data.length)
    : expectedLength === uint16Bytes
      ? numberToBinUint16LE(instruction.data.length)
      : numberToBinUint32LE(instruction.data.length);
};

/**
 * Re-encode a valid authentication instruction.
 * @param instruction - the instruction to encode
 */
export const encodeAuthenticationInstruction = (
  instruction: AuthenticationInstruction,
) =>
  Uint8Array.from([
    instruction.opcode,
    ...('data' in instruction
      ? [
          ...(isPushData(instruction.opcode)
            ? getInstructionLengthBytes(instruction)
            : []),
          ...instruction.data,
        ]
      : []),
  ]);

/**
 * Re-encode a malformed authentication instruction.
 * @param instruction - the {@link AuthenticationInstructionMalformed} to encode
 */
export const encodeAuthenticationInstructionMalformed = (
  instruction: AuthenticationInstructionMalformed,
) => {
  const { opcode } = instruction;

  if (hasMalformedLength(instruction)) {
    return Uint8Array.from([opcode, ...instruction.length]);
  }

  if (isPushData(opcode)) {
    return Uint8Array.from([
      opcode,
      ...(opcode === CommonPushOpcodes.OP_PUSHDATA_1
        ? Uint8Array.of(instruction.expectedDataBytes)
        : opcode === CommonPushOpcodes.OP_PUSHDATA_2
          ? numberToBinUint16LE(instruction.expectedDataBytes)
          : numberToBinUint32LE(instruction.expectedDataBytes)),
      ...instruction.data,
    ]);
  }

  return Uint8Array.from([opcode, ...instruction.data]);
};

/**
 * Re-encode a potentially-malformed authentication instruction.
 * @param instruction - the {@link AuthenticationInstructionMaybeMalformed}
 * to encode
 */
export const encodeAuthenticationInstructionMaybeMalformed = (
  instruction: AuthenticationInstructionMaybeMalformed,
): Uint8Array =>
  authenticationInstructionIsMalformed(instruction)
    ? encodeAuthenticationInstructionMalformed(instruction)
    : encodeAuthenticationInstruction(instruction);

/**
 * Re-encode an array of valid authentication instructions.
 * @param instructions - the array of valid instructions to encode
 */
export const encodeAuthenticationInstructions = (
  instructions: AuthenticationInstruction[],
) => flattenBinArray(instructions.map(encodeAuthenticationInstruction));

/**
 * Re-encode an array of potentially-malformed authentication instructions.
 * @param instructions - the array of
 * {@link AuthenticationInstructionMaybeMalformed}s to encode
 */
export const encodeAuthenticationInstructionsMaybeMalformed = (
  instructions: AuthenticationInstructionMaybeMalformed[],
) =>
  flattenBinArray(
    instructions.map(encodeAuthenticationInstructionMaybeMalformed),
  );

export enum VmNumberError {
  outOfRange = 'Failed to decode VM Number: overflows VM Number range.',
  requiresMinimal = 'Failed to decode VM Number: the number is not minimally-encoded.',
}

export const isVmNumberError = (
  value: VmNumberError | bigint,
): value is VmNumberError =>
  value === VmNumberError.outOfRange || value === VmNumberError.requiresMinimal;

const typicalMaximumVmNumberByteLength = 8;

/**
 * This method attempts to decode a VM Number, a format in which numeric values
 * are represented on the stack. (The Satoshi implementation calls this
 * `CScriptNum`.)
 *
 * If `bytes` is a valid VM Number, this method returns the represented number
 * in BigInt format. If `bytes` is not valid, a {@link VmNumberError}
 * is returned.
 *
 * All common operations accepting numeric parameters or pushing numeric values
 * to the stack currently use the VM Number format. The binary format of numbers
 * wouldn't be important if they could only be operated on by arithmetic
 * operators, but since the results of these operations may become input to
 * other operations (e.g. hashing), the specific representation is consensus-
 * critical.
 *
 * @param bytes - a Uint8Array from the stack
 */
// eslint-disable-next-line complexity
export const vmNumberToBigInt = (
  bytes: Uint8Array,
  {
    maximumVmNumberByteLength = typicalMaximumVmNumberByteLength,
    requireMinimalEncoding = true,
  }: {
    /**
     * The maximum valid number of bytes in a VM Number.
     */
    maximumVmNumberByteLength?: number;
    /**
     * If `true`, this method returns an error when parsing non-minimally
     * encoded VM Numbers.
     */
    requireMinimalEncoding?: boolean;
  } = {
    maximumVmNumberByteLength: typicalMaximumVmNumberByteLength,
    requireMinimalEncoding: true,
  },
): VmNumberError | bigint => {
  if (bytes.length === 0) {
    return 0n;
  }
  if (bytes.length > maximumVmNumberByteLength) {
    return VmNumberError.outOfRange;
  }
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const mostSignificantByte = bytes[bytes.length - 1]!;
  const secondMostSignificantByte = bytes[bytes.length - 1 - 1];
  const allButTheSignBit = 0b1111_111;
  const justTheSignBit = 0b1000_0000;

  if (
    requireMinimalEncoding &&
    // eslint-disable-next-line no-bitwise
    (mostSignificantByte & allButTheSignBit) === 0 &&
    // eslint-disable-next-line no-bitwise, @typescript-eslint/no-non-null-assertion
    (bytes.length <= 1 || (secondMostSignificantByte! & justTheSignBit) === 0)
  ) {
    return VmNumberError.requiresMinimal;
  }

  const bitsPerByte = 8;
  const signFlippingByte = 0x80;
  // eslint-disable-next-line functional/no-let
  let result = 0n;
  // eslint-disable-next-line functional/no-let, functional/no-loop-statements, no-plusplus
  for (let byte = 0; byte < bytes.length; byte++) {
    // eslint-disable-next-line functional/no-expression-statements,  no-bitwise, @typescript-eslint/no-non-null-assertion
    result |= BigInt(bytes[byte]!) << BigInt(byte * bitsPerByte);
  }

  /* eslint-disable no-bitwise */
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const isNegative = (bytes[bytes.length - 1]! & signFlippingByte) !== 0;
  return isNegative
    ? -(
        result &
        ~(BigInt(signFlippingByte) << BigInt(bitsPerByte * (bytes.length - 1)))
      )
    : result;
  /* eslint-enable no-bitwise */
};

/**
 * Convert a BigInt into the VM Number format. See {@link vmNumberToBigInt} for
 * more information.
 *
 * @param integer - the BigInt to encode as a VM Number
 */
// eslint-disable-next-line complexity
export const bigIntToVmNumber = (integer: bigint): Uint8Array => {
  if (integer === 0n) {
    return new Uint8Array();
  }

  const bytes: number[] = [];
  const isNegative = integer < 0;
  const byteStates = 0xff;
  const bitsPerByte = 8;
  // eslint-disable-next-line functional/no-let
  let remaining = isNegative ? -integer : integer;
  // eslint-disable-next-line functional/no-loop-statements
  while (remaining > 0) {
    // eslint-disable-next-line functional/no-expression-statements, functional/immutable-data, no-bitwise
    bytes.push(Number(remaining & BigInt(byteStates)));
    // eslint-disable-next-line functional/no-expression-statements, no-bitwise
    remaining >>= BigInt(bitsPerByte);
  }

  const signFlippingByte = 0x80;
  // eslint-disable-next-line no-bitwise, functional/no-conditional-statements, @typescript-eslint/no-non-null-assertion
  if ((bytes[bytes.length - 1]! & signFlippingByte) > 0) {
    // eslint-disable-next-line functional/no-expression-statements, functional/immutable-data
    bytes.push(isNegative ? signFlippingByte : 0x00);
    // eslint-disable-next-line functional/no-conditional-statements
  } else if (isNegative) {
    // eslint-disable-next-line functional/no-expression-statements, functional/immutable-data, no-bitwise
    bytes[bytes.length - 1] |= signFlippingByte;
  }
  return new Uint8Array(bytes);
};

/**
 * Returns true if the provided stack item is "truthy" in the sense required
 * by several operations (anything but zero and "negative zero").
 *
 * The Satoshi implementation calls this method `CastToBool`.
 *
 * @param item - the stack item to check for truthiness
 */
export const stackItemIsTruthy = (item: Uint8Array) => {
  const signFlippingByte = 0x80;
  // eslint-disable-next-line functional/no-let, functional/no-loop-statements, no-plusplus
  for (let i = 0; i < item.length; i++) {
    if (item[i] !== 0) {
      if (i === item.length - 1 && item[i] === signFlippingByte) {
        return false;
      }
      return true;
    }
  }
  return false;
};

/**
 * Convert a boolean into VM Number format (the type used to express
 * boolean values emitted by several operations).
 *
 * @param value - the boolean value to convert
 */
export const booleanToVmNumber = (value: boolean) =>
  value ? bigIntToVmNumber(1n) : bigIntToVmNumber(0n);

const enum Opcodes {
  OP_0 = 0x00,
  OP_PUSHBYTES_20 = 0x14,
  OP_PUSHBYTES_33 = 0x21,
  OP_PUSHBYTES_65 = 0x41,
  OP_1NEGATE = 0x4f,
  OP_RESERVED = 0x50,
  OP_1 = 0x51,
  OP_16 = 0x60,
  OP_RETURN = 0x6a,
  OP_DUP = 0x76,
  OP_EQUAL = 0x87,
  OP_EQUALVERIFY = 0x88,
  OP_SHA256 = 0xa8,
  OP_HASH160 = 0xa9,
  OP_CHECKSIG = 0xac,
  OP_CHECKMULTISIG = 0xae,
}

/**
 * From C++ implementation:
 * Note that IsPushOnly() *does* consider OP_RESERVED to be a push-type
 * opcode, however execution of OP_RESERVED fails, so it's not relevant to
 * P2SH/BIP62 as the scriptSig would fail prior to the P2SH special
 * validation code being executed.
 */
export const isPushOperation = (opcode: number) => opcode <= Opcodes.OP_16;

export const isPushOnly = (bytecode: Uint8Array) => {
  const instructions = decodeAuthenticationInstructions(bytecode);
  return instructions.every((instruction) =>
    isPushOperation(instruction.opcode),
  );
};

export const isPushOnlyAccurate = (bytecode: Uint8Array) => {
  const instructions = decodeAuthenticationInstructions(bytecode);
  return (
    !authenticationInstructionsAreMalformed(instructions) &&
    authenticationInstructionsArePushInstructions(instructions)
  );
};

/**
 * Test if the provided locking bytecode is an arbitrary data output.
 * A.K.A. `TX_NULL_DATA`, "data carrier", OP_RETURN output
 * @param lockingBytecode - the locking bytecode to test
 */
export const isArbitraryDataOutput = (lockingBytecode: Uint8Array) =>
  lockingBytecode.length >= 1 &&
  lockingBytecode[0] === Opcodes.OP_RETURN &&
  isPushOnly(lockingBytecode.slice(1));

const enum Dust {
  /**
   * The standard dust limit relies on a hard-coded expectation of a typical
   * P2PKH-spending input (spent using a 72-byte ECDSA signature).
   *
   * This value includes:
   * - Outpoint transaction hash: 32 bytes
   * - Outpoint index: 4 bytes
   * - Unlocking bytecode length: 1 byte
   * - Push of 72-byte ECDSA signature: 72 + 1 byte
   * - Push of public key: 33 + 1 byte
   * - Sequence number: 4 bytes
   */
  p2pkhInputLength = 148,
  minimumFeeMultiple = 3,
  standardDustRelayFee = 1000,
  // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
  bytesPerKb = 1000,
}

/**
 * Given a number of bytes and a fee rate in satoshis-per-kilobyte, return the
 * minimum required fee. This calculation in important for standardness in dust
 * threshold calculation.
 *
 * @param length - the number of bytes for which the fee is to be paid
 * @param feeRateSatsPerKb - the fee rate in satoshis per 1000 bytes
 */
export const getMinimumFee = (length: bigint, feeRateSatsPerKb: bigint) => {
  if (length < 1n) return 0n;
  const truncated = (length * feeRateSatsPerKb) / BigInt(Dust.bytesPerKb);
  return truncated === 0n ? 1n : truncated;
};

export const getDustThresholdForLength = (
  outputLength: number,
  dustRelayFeeSatPerKb = BigInt(Dust.standardDustRelayFee),
) => {
  const expectedTotalLength = outputLength + Dust.p2pkhInputLength;
  return (
    BigInt(Dust.minimumFeeMultiple) *
    getMinimumFee(BigInt(expectedTotalLength), dustRelayFeeSatPerKb)
  );
};

/**
 * Given an {@link Output} and (optionally) a dust relay fee in
 * satoshis-per-kilobyte, return the minimum satoshi value for this output to
 * not be considered a "dust output". **For nodes to relay or mine a transaction
 * with this output, the output must have a satoshi value greater than or equal
 * to this threshold.**
 *
 * By standardness, if an output is expected to cost more than 1/3 of it's value
 * in fees to spend, it is considered dust. When calculating the expected fee,
 * the input size is assumed to be (at least) the size of a typical P2PKH input
 * spent using a 72-byte ECDSA signature, 148 bytes:
 * - Outpoint transaction hash: 32 bytes
 * - Outpoint index: 4 bytes
 * - Unlocking bytecode length: 1 byte
 * - Push of 72-byte ECDSA signature: 72 + 1 byte
 * - Push of public key: 33 + 1 byte
 * - Sequence number: 4 bytes
 *
 * The encoded length of the serialized output is added to 148 bytes, and the
 * dust threshold for the output is 3 times the minimum fee for the total bytes.
 * For a P2PKH output (34 bytes) and the standard 1000 sat/Kb dust relay fee,
 * this results in a dust limit of `546` satoshis (`(34+148)*3*1000/1000`).
 *
 * Note, arbitrary data outputs are not required to meet the dust limit as
 * they are provably unspendable and can be pruned from the UTXO set.
 *
 * @param output - the output to test
 * @param dustRelayFeeSatPerKb - the "dust relay fee", defaults to `1000n`
 */
export const getDustThreshold = (
  output: Output,
  dustRelayFeeSatPerKb = BigInt(Dust.standardDustRelayFee),
) => {
  if (isArbitraryDataOutput(output.lockingBytecode)) {
    return 0n;
  }
  const encodedOutputLength = encodeTransactionOutput(output).length;
  return getDustThresholdForLength(encodedOutputLength, dustRelayFeeSatPerKb);
};

/**
 * Given an {@link Output} and (optionally) a dust relay fee in
 * satoshis-per-kilobyte, return `true` if the provided output is considered
 * a "dust output", or `false` otherwise.
 *
 * @param output - the output to test
 * @param dustRelayFeeSatPerKb - the "dust relay fee", defaults to `1000n`
 */
export const isDustOutput = (
  output: Output,
  dustRelayFeeSatPerKb = BigInt(Dust.standardDustRelayFee),
) => output.valueSatoshis < getDustThreshold(output, dustRelayFeeSatPerKb);

const enum PublicKey {
  uncompressedByteLength = 65,
  uncompressedHeaderByte = 0x04,
  compressedByteLength = 33,
  compressedHeaderByteEven = 0x02,
  compressedHeaderByteOdd = 0x03,
}

export const isValidUncompressedPublicKeyEncoding = (publicKey: Uint8Array) =>
  publicKey.length === PublicKey.uncompressedByteLength &&
  publicKey[0] === PublicKey.uncompressedHeaderByte;

export const isValidCompressedPublicKeyEncoding = (publicKey: Uint8Array) =>
  publicKey.length === PublicKey.compressedByteLength &&
  (publicKey[0] === PublicKey.compressedHeaderByteEven ||
    publicKey[0] === PublicKey.compressedHeaderByteOdd);

export const isValidPublicKeyEncoding = (publicKey: Uint8Array) =>
  isValidCompressedPublicKeyEncoding(publicKey) ||
  isValidUncompressedPublicKeyEncoding(publicKey);

// eslint-disable-next-line complexity
export const pushNumberOpcodeToNumber = (opcode: number) => {
  if (opcode === Opcodes.OP_0) {
    return 0;
  }
  if (opcode === Opcodes.OP_1NEGATE) {
    return -1;
  }
  if (
    !Number.isInteger(opcode) ||
    opcode < Opcodes.OP_1 ||
    opcode > Opcodes.OP_16
  ) {
    return false;
  }
  return opcode - Opcodes.OP_RESERVED;
};

const enum Multisig {
  minimumInstructions = 4,
  keyStart = 1,
  keyEnd = -2,
  maximumStandardN = 3,
}

// eslint-disable-next-line complexity
export const isSimpleMultisig = (lockingBytecode: Uint8Array) => {
  const instructions = decodeAuthenticationInstructions(lockingBytecode);
  if (authenticationInstructionsAreMalformed(instructions)) {
    return false;
  }

  const lastIndex = instructions.length - 1;
  if (
    instructions.length < Multisig.minimumInstructions ||
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    instructions[lastIndex]!.opcode !== Opcodes.OP_CHECKMULTISIG
  ) {
    return false;
  }

  /**
   * The required count of signers (the `m` in `m-of-n`).
   */
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const m = pushNumberOpcodeToNumber(instructions[0]!.opcode);
  /**
   * The total count of signers (the `n` in `m-of-n`).
   */
  const n = pushNumberOpcodeToNumber(
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    instructions[lastIndex - 1]!.opcode,
  );

  if (n === false || m === false) {
    return false;
  }

  const publicKeyInstructions = instructions.slice(
    Multisig.keyStart,
    Multisig.keyEnd,
  );

  if (!authenticationInstructionsArePushInstructions(publicKeyInstructions)) {
    return false;
  }

  const publicKeys = publicKeyInstructions.map(
    (instruction) => instruction.data,
  );

  if (publicKeys.some((key) => !isValidPublicKeyEncoding(key))) {
    return false;
  }

  return { m, n, publicKeys };
};

// eslint-disable-next-line complexity
export const isStandardMultisig = (lockingBytecode: Uint8Array) => {
  const multisigProperties = isSimpleMultisig(lockingBytecode);
  if (multisigProperties === false) {
    return false;
  }

  const { m, n } = multisigProperties;
  if (n < 1 || n > Multisig.maximumStandardN || m < 1 || m > n) {
    return false;
  }
  return true;
};

export const isStandardOutputBytecode = (lockingBytecode: Uint8Array) =>
  isPayToPublicKeyHash(lockingBytecode) ||
  isPayToScriptHash20(lockingBytecode) ||
  isPayToPublicKey(lockingBytecode) ||
  isArbitraryDataOutput(lockingBytecode) ||
  isStandardMultisig(lockingBytecode);

// eslint-disable-next-line complexity
export const isStandardOutputBytecode2023 = (lockingBytecode: Uint8Array) =>
  isPayToPublicKeyHash(lockingBytecode) ||
  isPayToScriptHash20(lockingBytecode) ||
  isPayToScriptHash32(lockingBytecode) ||
  isPayToPublicKey(lockingBytecode) ||
  isArbitraryDataOutput(lockingBytecode) ||
  isStandardMultisig(lockingBytecode);

const enum SegWit {
  minimumLength = 4,
  maximumLength = 42,
  OP_0 = 0,
  OP_1 = 81,
  OP_16 = 96,
  versionAndLengthBytes = 2,
}

/**
 * Test a stack item for the SegWit Recovery Rules activated in `BCH_2019_05`.
 *
 * @param bytecode - the stack item to test
 */
// eslint-disable-next-line complexity
export const isWitnessProgram = (bytecode: Uint8Array) => {
  const correctLength =
    bytecode.length >= SegWit.minimumLength &&
    bytecode.length <= SegWit.maximumLength;
  const validVersionPush =
    bytecode[0] === SegWit.OP_0 ||
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    (bytecode[0]! >= SegWit.OP_1 && bytecode[0]! <= SegWit.OP_16);
  const correctLengthByte =
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    bytecode[1]! + SegWit.versionAndLengthBytes === bytecode.length;
  return correctLength && validVersionPush && correctLengthByte;
};
