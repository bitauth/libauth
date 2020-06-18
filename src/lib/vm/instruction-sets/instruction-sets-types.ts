export interface AuthenticationInstructionPush<Opcodes = number> {
  /**
   * The data to be pushed to the stack.
   */
  readonly data: Uint8Array;
  /**
   * The opcode used to push this data.
   */
  readonly opcode: Opcodes;
}

export interface AuthenticationInstructionOperation<Opcodes = number> {
  /**
   * The opcode of this instruction's operation.
   */
  readonly opcode: Opcodes;
}

/**
 * A properly-formed instruction used by an `AuthenticationVirtualMachine`.
 */
export type AuthenticationInstruction<Opcodes = number> =
  | AuthenticationInstructionPush<Opcodes>
  | AuthenticationInstructionOperation<Opcodes>;

export type AuthenticationInstructions<
  Opcodes = number
> = AuthenticationInstruction<Opcodes>[];

type Uint8Bytes = 1;
type Uint16Bytes = 2;
type Uint32Bytes = 4;
export interface ParsedAuthenticationInstructionPushMalformedLength<
  Opcodes = number
> {
  /**
   * The expected number of length bytes (`length.length`) for this `PUSHDATA` operation.
   */
  readonly expectedLengthBytes: Uint8Bytes | Uint16Bytes | Uint32Bytes;
  /**
   * The length `Uint8Array` provided. This instruction is malformed because the length of this `Uint8Array` is shorter than the `expectedLengthBytes`.
   */
  readonly length: Uint8Array;
  readonly malformed: true;
  readonly opcode: Opcodes;
}

export interface ParsedAuthenticationInstructionPushMalformedData<
  Opcodes = number
> {
  /**
   * The data `Uint8Array` provided. This instruction is malformed because the length of this `Uint8Array` is shorter than the `expectedDataBytes`.
   */
  readonly data: Uint8Array;
  /**
   * The expected number of data bytes (`data.length`) for this push operation.
   */
  readonly expectedDataBytes: number;
  readonly malformed: true;
  readonly opcode: Opcodes;
}

export type ParsedAuthenticationInstructionMalformed<Opcodes = number> =
  | ParsedAuthenticationInstructionPushMalformedLength<Opcodes>
  | ParsedAuthenticationInstructionPushMalformedData<Opcodes>;

/**
 * A potentially-malformed `AuthenticationInstruction`. If `malformed` is
 * `true`, this could be either
 * `ParsedAuthenticationInstructionPushMalformedLength` or
 * `ParsedAuthenticationInstructionPushMalformedData`
 *
 * If the final instruction is a push operation which requires more bytes than
 * are available in the remaining portion of a serialized script, that
 * instruction will have a `malformed` property with a value of `true`.
 * .
 */
export type ParsedAuthenticationInstruction<Opcodes = number> =
  | AuthenticationInstruction<Opcodes>
  | ParsedAuthenticationInstructionMalformed<Opcodes>;

/**
 * An array of authentication instructions which may end with a malformed
 * instruction.
 *
 * **Implementation note**: this type can be improved by only marking the final
 * element as potentially malformed. This is waiting on:
 * https://github.com/Microsoft/TypeScript/issues/1360
 *
 * The following type can be used when it doesn't produce the error,
 * `A rest element must be last in a tuple type. [1256]`:
 * ```ts
 * export type ParsedAuthenticationInstructions<Opcodes = number> = [
 *   ...AuthenticationInstruction<Opcodes>,
 *   ParsedAuthenticationInstruction<Opcodes>
 * ];
 * ```
 */
export type ParsedAuthenticationInstructions<Opcodes = number> = (
  | AuthenticationInstruction<Opcodes>
  | ParsedAuthenticationInstruction<Opcodes>
)[];
