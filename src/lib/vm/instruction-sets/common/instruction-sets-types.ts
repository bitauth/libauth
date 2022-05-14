/**
 * A well-formed "push" authentication instruction (`OP_PUSHBYTES*` or
 * `OP_PUSHDATA*`).
 */
export interface AuthenticationInstructionPush {
  /**
   * The data to be pushed to the stack.
   */
  readonly data: Uint8Array;
  /**
   * The opcode used to push this data.
   */
  readonly opcode: number;
}

/**
 * An authentication instruction indicating an operation (as opposed to a
 * {@link AuthenticationInstructionPush}).
 */
export interface AuthenticationInstructionOperation {
  /**
   * The opcode of this instruction's operation.
   */
  readonly opcode: number;
}

/**
 * A well-formed instruction used by an {@link AuthenticationVirtualMachine}.
 */
export type AuthenticationInstruction =
  | AuthenticationInstructionOperation
  | AuthenticationInstructionPush;

/**
 * An array of {@link AuthenticationInstruction}s.
 */
export type AuthenticationInstructions = AuthenticationInstruction[];

type Uint8Bytes = 1;
type Uint16Bytes = 2;
type Uint32Bytes = 4;

/**
 * A malformed `OP_PUSHDATA*` authentication instruction in which the length
 * byte is incomplete (the bytecode ends before enough bytes can be read).
 */
export interface AuthenticationInstructionPushMalformedLength {
  /**
   * The expected number of length bytes (`length.length`) for this
   * `OP_PUSHDATA*` operation.
   */
  readonly expectedLengthBytes: Uint8Bytes | Uint16Bytes | Uint32Bytes;
  /**
   * The length `Uint8Array` provided. This instruction is malformed because the
   * length of this `Uint8Array` is shorter than the `expectedLengthBytes`.
   */
  readonly length: Uint8Array;
  readonly malformed: true;
  readonly opcode: number;
}

/**
 * A malformed "push" authentication instruction in which the pushed data is
 * incomplete (the bytecode ends before enough bytes can be read).
 */
export interface AuthenticationInstructionPushMalformedData {
  /**
   * The data `Uint8Array` provided. This instruction is malformed because the
   * length of this `Uint8Array` is shorter than the `expectedDataBytes`.
   */
  readonly data: Uint8Array;
  /**
   * The expected number of `data` bytes for this push operation.
   */
  readonly expectedDataBytes: number;
  readonly malformed: true;
  readonly opcode: number;
}

/**
 * A malformed authentication instruction (the bytecode ends before enough bytes
 * can be read).
 */
export type AuthenticationInstructionMalformed =
  | AuthenticationInstructionPushMalformedData
  | AuthenticationInstructionPushMalformedLength;

/**
 * A potentially-malformed {@link AuthenticationInstruction}. If `malformed` is
 * `true`, this could be either
 * {@link AuthenticationInstructionPushMalformedLength} or
 * {@link AuthenticationInstructionPushMalformedData}.
 *
 * If the final instruction is a push operation that requires more bytes than
 * are available in the remaining bytecode, that instruction will have a
 * `malformed` property with a value of `true`.
 */
export type AuthenticationInstructionMaybeMalformed =
  | AuthenticationInstruction
  | AuthenticationInstructionMalformed;

export type AuthenticationInstructionsMalformed = [
  ...AuthenticationInstruction[],
  AuthenticationInstructionMalformed
];

/**
 * An array of authentication instructions that may end with a malformed
 * instruction.
 */
export type AuthenticationInstructionsMaybeMalformed =
  | AuthenticationInstructions
  | AuthenticationInstructionsMalformed;
