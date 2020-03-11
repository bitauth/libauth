import { binToHex, flattenBinArray } from '../../format/format';

import { OpcodesBCH } from './bch/bch';
import { OpcodesBTC } from './btc/btc';
import {
  AuthenticationInstruction,
  AuthenticationInstructionPush,
  ParsedAuthenticationInstruction,
  ParsedAuthenticationInstructionMalformed,
  ParsedAuthenticationInstructionPushMalformedLength,
  ParsedAuthenticationInstructions
} from './instruction-sets-types';

export const authenticationInstructionIsMalformed = <Opcodes>(
  instruction: ParsedAuthenticationInstruction<Opcodes>
): instruction is ParsedAuthenticationInstructionMalformed<Opcodes> =>
  (instruction as ParsedAuthenticationInstructionMalformed<Opcodes>).malformed;

export const authenticationInstructionsAreMalformed = <Opcodes>(
  instructions: ParsedAuthenticationInstructions<Opcodes>
): instructions is ParsedAuthenticationInstructionMalformed<Opcodes>[] =>
  instructions.length > 0 &&
  authenticationInstructionIsMalformed(instructions[instructions.length - 1]);

export const authenticationInstructionsAreNotMalformed = <Opcodes>(
  instructions: ParsedAuthenticationInstructions<Opcodes>
): instructions is AuthenticationInstruction<Opcodes>[] =>
  !authenticationInstructionsAreMalformed(instructions);

enum CommonPushOpcodes {
  OP_0 = 0x00,
  OP_PUSHDATA_1 = 0x4c,
  OP_PUSHDATA_2 = 0x4d,
  OP_PUSHDATA_4 = 0x4e
}

enum Bytes {
  Uint8 = 1,
  Uint16 = 2,
  Uint32 = 4
}

/**
 * Note: this implementation assumes `script` is defined and long enough to read
 * the specified number of bytes. If necessary, validation should be done before
 * calling this method.
 *
 * @param script - the Uint8Array from which to read
 * @param index - the index from which to begin reading
 * @param length - the number of bytes to read
 */
export const readLittleEndianNumber = (
  script: Uint8Array,
  index: number,
  length: Bytes
) => {
  const view = new DataView(script.buffer, index, length);
  const readAsLittleEndian = true;
  return length === Bytes.Uint8
    ? view.getUint8(0)
    : length === Bytes.Uint16
    ? view.getUint16(0, readAsLittleEndian)
    : view.getUint32(0, readAsLittleEndian);
};

/**
 * Note: this implementation assumes `script` is defined and long enough to
 * write the specified number of bytes. It also assumes the provided `number` is
 * representable in `length` bytes.
 *
 * If necessary, validation should be done before calling this method.
 *
 * @param script - the Uint8Array to which the number should be written
 * @param index - the index at which to begin writing
 * @param length - the number of bytes to use
 * @param value - the number to write at `script[index]`
 */
export const writeLittleEndianNumber = (
  script: Uint8Array,
  index: number,
  length: Bytes,
  value: number
  // eslint-disable-next-line max-params
) => {
  const view = new DataView(script.buffer, index, length);
  const writeAsLittleEndian = true;
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions, functional/no-expression-statement
  length === Bytes.Uint8
    ? view.setUint8(0, value)
    : length === Bytes.Uint16
    ? view.setUint16(0, value, writeAsLittleEndian)
    : view.setUint32(0, value, writeAsLittleEndian);
  return script;
};

export const numberToLittleEndianBin = (value: number, length: Bytes) => {
  const array = new Uint8Array(length);
  return writeLittleEndianNumber(array, 0, length, value);
};

/**
 * Returns the number of bytes used to indicate the length of the push in this
 * operation.
 * @param opcode - an opcode between 0x00 and 0x4e
 */
export const lengthBytesForPushOpcode = (opcode: number): number =>
  opcode < CommonPushOpcodes.OP_PUSHDATA_1
    ? 0
    : opcode === CommonPushOpcodes.OP_PUSHDATA_1
    ? Bytes.Uint8
    : opcode === CommonPushOpcodes.OP_PUSHDATA_2
    ? Bytes.Uint16
    : Bytes.Uint32;

/**
 * Parse one instruction from the provided script.
 *
 * Returns an object with an `instruction` referencing a
 * `ParsedAuthenticationInstruction`, and a `nextIndex` indicating the next
 * index from which to read. If the next index is greater than or equal to the
 * length of the script, the script has been fully parsed.
 *
 * The final `ParsedAuthenticationInstruction` from a serialized script may be
 * malformed if 1) the final operation is a push and 2) too few bytes remain for
 * the push operation to complete.
 *
 * @param script - the script from which to read the next instruction
 * @param index - the offset from which to begin reading
 */
// eslint-disable-next-line complexity
export const readAuthenticationInstruction = <Opcodes = number>(
  script: Uint8Array,
  index: number
): {
  instruction: ParsedAuthenticationInstruction<Opcodes>;
  nextIndex: number;
} => {
  const opcode = script[index];
  if (opcode > CommonPushOpcodes.OP_PUSHDATA_4) {
    return {
      instruction: {
        opcode: (opcode as unknown) as Opcodes
      },
      nextIndex: index + 1
    };
  }
  const lengthBytes = lengthBytesForPushOpcode(opcode);
  const pushBytes = lengthBytes === 0;

  if (!pushBytes && index + lengthBytes >= script.length) {
    const sliceStart = index + 1;
    const sliceEnd = sliceStart + lengthBytes;
    return {
      instruction: {
        expectedLengthBytes: lengthBytes,
        length: script.slice(sliceStart, sliceEnd),
        malformed: true,
        opcode: (opcode as unknown) as Opcodes
      },
      nextIndex: sliceEnd
    };
  }

  const dataBytes = pushBytes
    ? opcode
    : readLittleEndianNumber(script, index + 1, lengthBytes);
  const dataStart = index + 1 + lengthBytes;
  const dataEnd = dataStart + dataBytes;
  return {
    instruction: {
      data: script.slice(dataStart, dataEnd),
      ...(dataEnd > script.length
        ? {
            expectedDataBytes: dataEnd - dataStart,
            malformed: true
          }
        : undefined),
      opcode: (opcode as unknown) as Opcodes
    },
    nextIndex: dataEnd
  };
};

/**
 * Parse authentication bytecode (`lockingBytecode` or `unlockingBytecode`)
 * into `ParsedAuthenticationInstructions`. The method
 * `authenticationInstructionsAreMalformed` can be used to check if these
 * instructions include a malformed instruction. If not, they are valid
 * `AuthenticationInstructions`.
 *
 * This implementation is common to most bitcoin forks, but the type parameter
 * can be used to strongly type the resulting instructions. For example:
 *
 * ```js
 *  const instructions = parseAuthenticationBytecode<OpcodesBCH>(script);
 * ```
 *
 * @param script - the serialized script to parse
 */
export const parseBytecode = <Opcodes = number>(script: Uint8Array) => {
  const instructions: ParsedAuthenticationInstructions<Opcodes> = [];
  // eslint-disable-next-line functional/no-let
  let i = 0;
  // eslint-disable-next-line functional/no-loop-statement
  while (i < script.length) {
    const { instruction, nextIndex } = readAuthenticationInstruction<Opcodes>(
      script,
      i
    );
    // eslint-disable-next-line functional/no-expression-statement
    i = nextIndex;
    // eslint-disable-next-line functional/no-expression-statement, functional/immutable-data
    instructions.push(instruction);
  }
  return instructions;
};

const isPush = <Opcodes>(
  instruction: AuthenticationInstruction<Opcodes>
): instruction is AuthenticationInstructionPush<Opcodes> =>
  (instruction as AuthenticationInstructionPush<Opcodes>).data !== undefined;

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
const hasMalformedLength = <Opcodes>(
  instruction: ParsedAuthenticationInstructionMalformed<Opcodes>
): instruction is ParsedAuthenticationInstructionPushMalformedLength<Opcodes> =>
  (instruction as ParsedAuthenticationInstructionPushMalformedLength<Opcodes>)
    .length !== undefined;
const isPushData = (pushOpcode: number) =>
  lengthBytesForPushOpcode(pushOpcode) > 0;

export const disassembleParsedAuthenticationInstructionMalformed = <
  Opcodes = number
>(
  opcodes: { readonly [opcode: number]: string },
  instruction: ParsedAuthenticationInstructionMalformed<Opcodes>
): string =>
  `${opcodes[(instruction.opcode as unknown) as number]} ${
    hasMalformedLength(instruction)
      ? `${formatAsmPushHex(instruction.length)}${formatMissingBytesAsm(
          instruction.expectedLengthBytes - instruction.length.length
        )}`
      : `${
          isPushData((instruction.opcode as unknown) as number)
            ? `${instruction.expectedDataBytes} `
            : ''
        }${formatAsmPushHex(instruction.data)}${formatMissingBytesAsm(
          instruction.expectedDataBytes - instruction.data.length
        )}`
  }`;

export const disassembleAuthenticationInstruction = <Opcodes = number>(
  opcodes: { readonly [opcode: number]: string },
  instruction: AuthenticationInstruction<Opcodes>
): string =>
  `${opcodes[(instruction.opcode as unknown) as number]}${
    isPush(instruction) &&
    isMultiWordPush((instruction.opcode as unknown) as number)
      ? ` ${
          isPushData((instruction.opcode as unknown) as number)
            ? `${instruction.data.length} `
            : ''
        }${formatAsmPushHex(instruction.data)}`
      : ''
  }`;

export const disassembleParsedAuthenticationInstruction = <Opcodes = number>(
  opcodes: { readonly [opcode: number]: string },
  instruction: ParsedAuthenticationInstruction<Opcodes>
): string =>
  authenticationInstructionIsMalformed(instruction)
    ? disassembleParsedAuthenticationInstructionMalformed<Opcodes>(
        opcodes,
        instruction
      )
    : disassembleAuthenticationInstruction<Opcodes>(opcodes, instruction);

/**
 * Disassemble an array of `ParsedAuthenticationInstructions` (including
 * potentially malformed instructions) into its ASM representation.
 *
 * @param script - the array of instructions to disassemble
 */
export const disassembleParsedAuthenticationInstructions = <Opcodes = number>(
  opcodes: { readonly [opcode: number]: string },
  instructions: readonly ParsedAuthenticationInstruction<Opcodes>[]
): string =>
  instructions
    .map(instruction =>
      disassembleParsedAuthenticationInstruction<Opcodes>(opcodes, instruction)
    )
    .join(' ');

/**
 * Disassemble authentication bytecode into a lossless ASM representation.
 *
 * TODO: a similar method which re-formats ASM strings, converting HexLiterals to Script Numbers or UTF8Literals.
 *
 * @param opcodes - the set to use when determining the name of opcodes, e.g. `OpcodesBCH`
 * @param bytecode - the authentication bytecode to disassemble
 */
export const disassembleBytecode = <Opcode = number>(
  opcodes: { readonly [opcode: number]: string },
  bytecode: Uint8Array
) =>
  disassembleParsedAuthenticationInstructions(
    opcodes,
    parseBytecode<Opcode>(bytecode)
  );

/**
 * Disassemble BCH authentication bytecode into its ASM representation.
 * @param bytecode - the authentication bytecode to disassemble
 */
export const disassembleBytecodeBCH = (bytecode: Uint8Array) =>
  disassembleParsedAuthenticationInstructions(
    OpcodesBCH,
    parseBytecode<OpcodesBCH>(bytecode)
  );

// TODO: assembleBytecodeBCH – instantiate synchronous compiler, throw any errors

/**
 * Disassemble BTC authentication bytecode into its ASM representation.
 * @param bytecode - the authentication bytecode to disassemble
 */
export const disassembleBytecodeBTC = (bytecode: Uint8Array) =>
  disassembleParsedAuthenticationInstructions(
    OpcodesBTC,
    parseBytecode<OpcodesBTC>(bytecode)
  );

// TODO: assembleBytecodeBTC

const getLengthBytes = <Opcodes>(
  instruction: AuthenticationInstructionPush<Opcodes>
) =>
  numberToLittleEndianBin(
    instruction.data.length,
    lengthBytesForPushOpcode((instruction.opcode as unknown) as number)
  );

export const serializeAuthenticationInstruction = <Opcodes = number>(
  instruction: AuthenticationInstruction<Opcodes>
) =>
  Uint8Array.from([
    (instruction.opcode as unknown) as number,
    ...(isPush(instruction)
      ? [
          ...(isPushData((instruction.opcode as unknown) as number)
            ? getLengthBytes(instruction)
            : []),
          ...instruction.data
        ]
      : [])
  ]);

export const serializeParsedAuthenticationInstructionMalformed = <
  Opcodes = number
>(
  instruction: ParsedAuthenticationInstructionMalformed<Opcodes>
) =>
  Uint8Array.from([
    (instruction.opcode as unknown) as number,
    ...(hasMalformedLength(instruction)
      ? instruction.length
      : isPushData((instruction.opcode as unknown) as number)
      ? numberToLittleEndianBin(
          instruction.expectedDataBytes,
          lengthBytesForPushOpcode((instruction.opcode as unknown) as number)
        )
      : []),
    ...(hasMalformedLength(instruction) ? [] : instruction.data)
  ]);

export const serializeParsedAuthenticationInstruction = <Opcodes = number>(
  instruction: ParsedAuthenticationInstruction<Opcodes>
): Uint8Array =>
  authenticationInstructionIsMalformed(instruction)
    ? serializeParsedAuthenticationInstructionMalformed(instruction)
    : serializeAuthenticationInstruction(instruction);

export const serializeAuthenticationInstructions = <Opcodes = number>(
  instructions: readonly AuthenticationInstruction<Opcodes>[]
) => flattenBinArray(instructions.map(serializeAuthenticationInstruction));

export const serializeParsedAuthenticationInstructions = <Opcodes = number>(
  instructions: readonly ParsedAuthenticationInstruction<Opcodes>[]
) =>
  flattenBinArray(instructions.map(serializeParsedAuthenticationInstruction));

/**
 * Create an object where each key is an opcode identifier and each value is
 * the bytecode value (`Uint8Array`) it represents.
 * @param opcodes - An opcode enum, e.g. `OpcodesBCH`
 */
export const generateBytecodeMap = (opcodes: object) =>
  Object.entries(opcodes)
    .filter<[string, number]>(
      (entry): entry is [string, number] => typeof entry[1] === 'number'
    )
    .reduce<{
      [opcode: string]: Uint8Array;
    }>(
      (identifiers, pair) => ({
        ...identifiers,
        [pair[0]]: Uint8Array.of(pair[1])
      }),
      {}
    );
