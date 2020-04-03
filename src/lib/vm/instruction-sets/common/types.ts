export enum ScriptNumberError {
  outOfRange = 'Failed to parse Script Number: overflows Script Number range.',
  requiresMinimal = 'Failed to parse Script Number: the number is not minimally-encoded.',
}

export const isScriptNumberError = (
  value: BigInt | ScriptNumberError
): value is ScriptNumberError =>
  value === ScriptNumberError.outOfRange ||
  value === ScriptNumberError.requiresMinimal;

const normalMaximumScriptNumberByteLength = 4;

/**
 * This method attempts to parse a "Script Number", a format with which numeric
 * values are represented on the stack. (The Satoshi implementation calls this
 * `CScriptNum`.)
 *
 * If `bytes` is a valid Script Number, this method returns the represented
 * number in BigInt format. If `bytes` is not valid, a `ScriptNumberError` is
 * returned.
 *
 * All common operations accepting numeric parameters or pushing numeric values
 * to the stack currently use the Script Number format. The binary format of
 * numbers wouldn't be important if they could only be operated on by arithmetic
 * operators, but since the results of these operations may become input to
 * other operations (e.g. hashing), the specific representation is consensus-
 * critical.
 *
 * Parsing of Script Numbers is limited to 4 bytes (with the exception of
 * OP_CHECKLOCKTIMEVERIFY and OP_CHECKSEQUENCEVERIFY, which read up to 5-bytes).
 * The bytes are read as a signed integer (for 32-bits: inclusive range from
 * -2^31 + 1 to 2^31 - 1) in little-endian byte order. Script Numbers must
 * further be encoded as minimally as possible (no zero-padding). See code/tests
 * for details.
 *
 * @remarks
 * Operators may push numeric results to the stack which exceed the current
 * 4-byte length limit of Script Numbers. While these stack elements would
 * otherwise be valid Script Numbers, because of the 4-byte length limit, they
 * can only be used as non-numeric values in later operations.
 *
 * Most other implementations currently parse Script Numbers into 64-bit
 * integers to operate on them (rather than integers of arbitrary size like
 * BigInt). Currently, no operators are at risk of overflowing 64-bit integers
 * given 32-bit integer inputs, but future operators may require additional
 * refactoring in those implementations.
 *
 * @param bytes - a Uint8Array from the stack
 * @param requireMinimalEncoding - if true, this method returns an error when
 * parsing non-minimally encoded Script Numbers
 * @param maximumScriptNumberByteLength - the maximum valid number of bytes
 */
// eslint-disable-next-line complexity
export const parseBytesAsScriptNumber = (
  bytes: Uint8Array,
  {
    maximumScriptNumberByteLength = normalMaximumScriptNumberByteLength,
    requireMinimalEncoding = true,
  }: {
    maximumScriptNumberByteLength?: number;
    requireMinimalEncoding?: boolean;
  } = {
    maximumScriptNumberByteLength: normalMaximumScriptNumberByteLength,
    requireMinimalEncoding: true,
  }
): bigint | ScriptNumberError => {
  if (bytes.length === 0) {
    return BigInt(0);
  }
  if (bytes.length > maximumScriptNumberByteLength) {
    return ScriptNumberError.outOfRange;
  }
  const mostSignificantByte = bytes[bytes.length - 1];
  const secondMostSignificantByte = bytes[bytes.length - 1 - 1];
  const allButTheSignBit = 0b1111_111;
  const justTheSignBit = 0b1000_0000;

  if (
    requireMinimalEncoding &&
    // eslint-disable-next-line no-bitwise
    (mostSignificantByte & allButTheSignBit) === 0 &&
    // eslint-disable-next-line no-bitwise
    (bytes.length <= 1 || (secondMostSignificantByte & justTheSignBit) === 0)
  ) {
    return ScriptNumberError.requiresMinimal;
  }

  const bitsPerByte = 8;
  const signFlippingByte = 0x80;
  // eslint-disable-next-line functional/no-let
  let result = BigInt(0);
  // eslint-disable-next-line functional/no-let, functional/no-loop-statement, no-plusplus
  for (let byte = 0; byte < bytes.length; byte++) {
    // eslint-disable-next-line functional/no-expression-statement,  no-bitwise
    result |= BigInt(bytes[byte]) << BigInt(byte * bitsPerByte);
  }

  /* eslint-disable no-bitwise */
  const isNegative = (bytes[bytes.length - 1] & signFlippingByte) !== 0;
  return isNegative
    ? -(
        result &
        ~(BigInt(signFlippingByte) << BigInt(bitsPerByte * (bytes.length - 1)))
      )
    : result;
  /* eslint-enable no-bitwise */
};

/**
 * Convert a BigInt into the "Script Number" format. See
 * `parseBytesAsScriptNumber` for more information.
 *
 * @param integer - the BigInt to encode as a Script Number
 */
// eslint-disable-next-line complexity
export const bigIntToScriptNumber = (integer: bigint): Uint8Array => {
  if (integer === BigInt(0)) {
    return new Uint8Array();
  }

  const bytes: number[] = [];
  const isNegative = integer < 0;
  const byteStates = 0xff;
  const bitsPerByte = 8;
  // eslint-disable-next-line functional/no-let
  let remaining = isNegative ? -integer : integer;
  // eslint-disable-next-line functional/no-loop-statement
  while (remaining > 0) {
    // eslint-disable-next-line functional/no-expression-statement, functional/immutable-data, no-bitwise
    bytes.push(Number(remaining & BigInt(byteStates)));
    // eslint-disable-next-line functional/no-expression-statement, no-bitwise
    remaining >>= BigInt(bitsPerByte);
  }

  const signFlippingByte = 0x80;
  // eslint-disable-next-line no-bitwise, functional/no-conditional-statement
  if ((bytes[bytes.length - 1] & signFlippingByte) > 0) {
    // eslint-disable-next-line functional/no-expression-statement, functional/immutable-data
    bytes.push(isNegative ? signFlippingByte : 0x00);
    // eslint-disable-next-line functional/no-conditional-statement
  } else if (isNegative) {
    // eslint-disable-next-line functional/no-expression-statement, functional/immutable-data, no-bitwise
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
  // eslint-disable-next-line functional/no-let, functional/no-loop-statement, no-plusplus
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
 * Convert a boolean into Script Number format (the type used to express
 * boolean values emitted by several operations).
 *
 * @param value - the boolean value to convert
 */
export const booleanToScriptNumber = (value: boolean) =>
  value ? bigIntToScriptNumber(BigInt(1)) : bigIntToScriptNumber(BigInt(0));
