const enum ByteLength {
  uint8 = 1,
  uint16 = 2,
  uint32 = 4,
  uint64 = 8
}

/**
 * Encode a positive integer as a little-endian Uint8Array. For values exceeding
 * `Number.MAX_SAFE_INTEGER`, use `bigIntToBinUintLE`. Negative values will
 * return the same result as `0`.
 *
 * @param value - the number to encode
 */
export const numberToBinUintLE = (value: number) => {
  const baseUint8Array = 256;
  const result: number[] = [];
  // eslint-disable-next-line functional/no-let
  let remaining = value;
  // eslint-disable-next-line functional/no-loop-statement
  while (remaining >= baseUint8Array) {
    // eslint-disable-next-line functional/no-expression-statement, functional/immutable-data
    result.push(remaining % baseUint8Array);
    // eslint-disable-next-line functional/no-expression-statement
    remaining = Math.floor(remaining / baseUint8Array);
  }
  // eslint-disable-next-line functional/no-conditional-statement, functional/no-expression-statement, functional/immutable-data
  if (remaining > 0) result.push(remaining);
  return Uint8Array.from(result);
};

/**
 * Fill a new Uint8Array of a specific byte-length with the contents of a given
 * Uint8Array, truncating or padding the Uint8Array with zeros.
 *
 * @param bin - the Uint8Array to resize
 * @param bytes - the desired byte-length
 */
export const binToFixedLength = (bin: Uint8Array, bytes: number) => {
  const fixedBytes = new Uint8Array(bytes);
  const maxValue = 255;
  // eslint-disable-next-line functional/no-expression-statement, @typescript-eslint/no-unused-expressions
  bin.length > bytes ? fixedBytes.fill(maxValue) : fixedBytes.set(bin);
  return fixedBytes;
};

/**
 * Encode a number as a 2-byte Uint16LE Uint8Array.
 *
 * This method will truncate values larger than the maximum: `0xffff`. Negative
 * values will return the same result as `0`.
 *
 * @param value - the number to encode
 */
export const numberToBinUint16LE = (value: number) =>
  binToFixedLength(numberToBinUintLE(value), ByteLength.uint16);

/**
 * Encode a number as a 4-byte Uint32LE Uint8Array.
 *
 * This method will truncate values larger than the maximum: `0xffffffff`.
 * Negative values will return the same result as `0`.
 *
 * @param value - the number to encode
 */
export const numberToBinUint32LE = (value: number) =>
  binToFixedLength(numberToBinUintLE(value), ByteLength.uint32);

/**
 * Encode a BigInt as little-endian Uint8Array. Negative values will return the
 * same result as `0`.
 *
 * @param value - the number to encode
 */
export const bigIntToBinUintLE = (value: bigint) => {
  const baseUint8Array = 256;
  const base = BigInt(baseUint8Array);
  const result: number[] = [];
  // eslint-disable-next-line functional/no-let
  let remaining = value;
  // eslint-disable-next-line functional/no-loop-statement
  while (remaining >= base) {
    // eslint-disable-next-line functional/no-expression-statement, functional/immutable-data
    result.push(Number(remaining % base));
    // eslint-disable-next-line functional/no-expression-statement
    remaining /= base;
  }
  // eslint-disable-next-line functional/no-conditional-statement, functional/no-expression-statement, functional/immutable-data
  if (remaining > BigInt(0)) result.push(Number(remaining));

  return Uint8Array.from(result.length > 0 ? result : [0]);
};

/**
 * Encode a positive BigInt as an 8-byte Uint64LE Uint8Array.
 *
 * This method will truncate values larger than the maximum:
 * `0xffff_ffff_ffff_ffff`. Negative values will return the same result as `0`.
 *
 * @param value - the number to encode
 */
export const bigIntToBinUint64LE = (value: bigint) =>
  binToFixedLength(bigIntToBinUintLE(value), ByteLength.uint64);

/**
 * Encode an integer as a 4-byte, little-endian Uint8Array using the number's
 * two's compliment representation (the format used by JavaScript's bitwise
 * operators).
 *
 * @remarks
 * The C++ bitcoin implementations sometimes represent short vectors using
 * signed 32-bit integers (e.g. `sighashType`). This method can be used to test
 * compatibility with those implementations.
 *
 * @param value - the number to encode
 */
export const numberToBinInt32TwosCompliment = (value: number) => {
  const bytes = 4;
  const bitsInAByte = 8;
  const bin = new Uint8Array(bytes);
  // eslint-disable-next-line functional/no-let, functional/no-loop-statement, no-plusplus
  for (let offset = 0; offset < bytes; offset++) {
    // eslint-disable-next-line functional/no-expression-statement, functional/immutable-data
    bin[offset] = value;
    // eslint-disable-next-line functional/no-expression-statement, no-bitwise, no-param-reassign
    value >>>= bitsInAByte;
  }
  return bin;
};

/**
 * Decode a little-endian Uint8Array into a number.
 *
 * Throws if `bin` is shorter than `bytes`.
 *
 * @param bin - the Uint8Array to decode
 * @param bytes - the number of bytes to read (default: `bin.length`)
 */
export const binToNumberUintLE = (bin: Uint8Array, bytes = bin.length) => {
  const binBase = 2;
  const bitsInAByte = 8;
  // eslint-disable-next-line functional/no-let
  let value = 0;
  // eslint-disable-next-line functional/no-let, functional/no-loop-statement, no-plusplus
  for (let offset = 0; offset < bytes; offset++) {
    // eslint-disable-next-line functional/no-expression-statement
    value += bin[offset] * binBase ** (bitsInAByte * offset);
  }
  return value;
};

/**
 * Decode a 4-byte Uint32LE Uint8Array into a number.
 *
 * Throws if `bin` is shorter than 4 bytes.
 *
 * @param bin - the Uint8Array to decode
 */
export const binToNumberUint32LE = (bin: Uint8Array) =>
  binToNumberUintLE(bin, ByteLength.uint32);

/**
 * Decode a little-endian Uint8Array into a BigInt.
 *
 * Throws if `bin` is shorter than `bytes`.
 *
 * @param bin - the Uint8Array to decode
 * @param bytes - the number of bytes to read (default: `bin.length`)
 */
export const binToBigIntUintLE = (bin: Uint8Array, bytes = bin.length) => {
  const base = 2;
  const bitsInAByte = 8;
  // eslint-disable-next-line functional/no-let
  let value = BigInt(0);
  // eslint-disable-next-line functional/no-let, functional/no-loop-statement, no-plusplus
  for (let offset = 0; offset < bytes; offset++) {
    // eslint-disable-next-line functional/no-expression-statement
    value +=
      BigInt(bin[offset]) *
      BigInt(base) ** (BigInt(bitsInAByte) * BigInt(offset));
  }
  return value;
};

/**
 * Decode an 8-byte Uint64LE Uint8Array into a BigInt.
 *
 * Throws if `bin` is shorter than 8 bytes.
 *
 * @param bin - the Uint8Array to decode
 */
export const binToBigIntUint64LE = (bin: Uint8Array) =>
  binToBigIntUintLE(bin, ByteLength.uint64);

const enum VarInt {
  Uint8MaxValue = 0xfc,
  Uint16Prefix = 0xfd,
  Uint16MaxValue = 0xffff,
  Uint32Prefix = 0xfe,
  Uint32MaxValue = 0xffffffff,
  Uint64Prefix = 0xff
}

/**
 * Get the expected byte length of a Bitcoin VarInt given a first byte.
 *
 * @param firstByte - the first byte of the VarInt
 */
export const varIntPrefixToSize = (firstByte: number) => {
  switch (firstByte) {
    default:
      return ByteLength.uint8;
    case VarInt.Uint16Prefix:
      return ByteLength.uint16 + 1;
    case VarInt.Uint32Prefix:
      return ByteLength.uint32 + 1;
    case VarInt.Uint64Prefix:
      return ByteLength.uint64 + 1;
  }
};

/**
 * Read a Bitcoin VarInt (Variable-length integer) from a Uint8Array, returning
 * the `nextOffset` after the VarInt and the value as a BigInt.
 *
 * @param bin - the Uint8Array from which to read the VarInt
 * @param offset - the offset at which the VarInt begins
 */
export const readBitcoinVarInt = (bin: Uint8Array, offset = 0) => {
  const bytes = varIntPrefixToSize(bin[offset]);
  const hasPrefix = bytes !== 1;
  return {
    nextOffset: offset + bytes,
    value: hasPrefix
      ? binToBigIntUintLE(bin.subarray(offset + 1, offset + bytes), bytes - 1)
      : binToBigIntUintLE(bin.subarray(offset, offset + bytes), 1)
  };
};

/**
 * Encode a BigInt as a Bitcoin VarInt (Variable-length integer).
 *
 * Note: the maximum value of a Bitcoin VarInt is `0xffff_ffff_ffff_ffff`. This
 * method will truncate results for larger values.
 *
 * @param value - the BigInt to encode (no larger than `0xffff_ffff_ffff_ffff`)
 */
export const bigIntToBitcoinVarInt = (value: bigint) =>
  value <= BigInt(VarInt.Uint8MaxValue)
    ? bigIntToBinUintLE(value)
    : value <= BigInt(VarInt.Uint16MaxValue)
    ? Uint8Array.from([
        VarInt.Uint16Prefix,
        ...numberToBinUint16LE(Number(value))
      ])
    : value <= BigInt(VarInt.Uint32MaxValue)
    ? Uint8Array.from([
        VarInt.Uint32Prefix,
        ...numberToBinUint32LE(Number(value))
      ])
    : Uint8Array.from([VarInt.Uint64Prefix, ...bigIntToBinUint64LE(value)]);
