/**
 * Encode a positive integer as a little-endian Uint8Array. For values exceeding
 * `Number.MAX_SAFE_INTEGER` (`9007199254740991`), use `bigIntToBinUintLE`.
 * Negative values will return the same result as `0`.
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
  // eslint-disable-next-line functional/no-expression-statement
  bin.length > bytes ? fixedBytes.fill(maxValue) : fixedBytes.set(bin);
  return fixedBytes;
};

/**
 * Encode a positive integer as a 2-byte Uint16LE Uint8Array, clamping the
 * results. (Values exceeding `0xffff` return the same result as `0xffff`,
 * negative values will return the same result as `0`.)
 *
 * @param value - the number to encode
 */
export const numberToBinUint16LEClamped = (value: number) => {
  const uint16 = 2;
  return binToFixedLength(numberToBinUintLE(value), uint16);
};

/**
 * Encode a positive integer as a 4-byte Uint32LE Uint8Array, clamping the
 * results. (Values exceeding `0xffffffff` return the same result as
 * `0xffffffff`, negative values will return the same result as `0`.)
 *
 * @param value - the number to encode
 */
export const numberToBinUint32LEClamped = (value: number) => {
  const uint32 = 4;
  return binToFixedLength(numberToBinUintLE(value), uint32);
};

/**
 * Encode a positive integer as a 2-byte Uint16LE Uint8Array.
 *
 * This method will return an incorrect result for values outside of the range
 * `0` to `0xffff`.
 *
 * @param value - the number to encode
 */
export const numberToBinUint16LE = (value: number) => {
  const uint16Length = 2;
  const bin = new Uint8Array(uint16Length);
  const writeAsLittleEndian = true;
  const view = new DataView(bin.buffer, bin.byteOffset, bin.byteLength);
  // eslint-disable-next-line functional/no-expression-statement
  view.setUint16(0, value, writeAsLittleEndian);
  return bin;
};

/**
 * Encode an integer as a 2-byte Int16LE Uint8Array.
 *
 * This method will return an incorrect result for values outside of the range
 * `0x0000` to `0xffff`.
 *
 * @param value - the number to encode
 */
export const numberToBinInt16LE = (value: number) => {
  const int16Length = 2;
  const bin = new Uint8Array(int16Length);
  const writeAsLittleEndian = true;
  const view = new DataView(bin.buffer, bin.byteOffset, bin.byteLength);
  // eslint-disable-next-line functional/no-expression-statement
  view.setInt16(0, value, writeAsLittleEndian);
  return bin;
};

/**
 * Encode an integer as a 4-byte Uint32LE Uint8Array.
 *
 * This method will return an incorrect result for values outside of the range
 * `0x00000000` to `0xffffffff`.
 *
 * @param value - the number to encode
 */
export const numberToBinInt32LE = (value: number) => {
  const int32Length = 4;
  const bin = new Uint8Array(int32Length);
  const writeAsLittleEndian = true;
  const view = new DataView(bin.buffer, bin.byteOffset, bin.byteLength);
  // eslint-disable-next-line functional/no-expression-statement
  view.setInt32(0, value, writeAsLittleEndian);
  return bin;
};

/**
 * Decode a 2-byte Int16LE Uint8Array into a number.
 *
 * Throws if `bin` is shorter than 2 bytes.
 *
 * @param bin - the Uint8Array to decode
 */
export const binToNumberInt16LE = (bin: Uint8Array) => {
  const view = new DataView(bin.buffer, bin.byteOffset, bin.byteLength);
  const readAsLittleEndian = true;
  return view.getInt16(0, readAsLittleEndian);
};

/**
 * Decode a 4-byte Int32LE Uint8Array into a number.
 *
 * Throws if `bin` is shorter than 4 bytes.
 *
 * @param bin - the Uint8Array to decode
 */
export const binToNumberInt32LE = (bin: Uint8Array) => {
  const view = new DataView(bin.buffer, bin.byteOffset, bin.byteLength);
  const readAsLittleEndian = true;
  return view.getInt32(0, readAsLittleEndian);
};

/**
 * Encode a positive integer as a 2-byte Uint16LE Uint8Array.
 *
 * This method will return an incorrect result for values outside of the range
 * `0` to `0xffff`.
 *
 * @param value - the number to encode
 */
export const numberToBinUint16BE = (value: number) => {
  const uint16Length = 2;
  const bin = new Uint8Array(uint16Length);
  const writeAsLittleEndian = false;
  const view = new DataView(bin.buffer, bin.byteOffset, bin.byteLength);
  // eslint-disable-next-line functional/no-expression-statement
  view.setUint16(0, value, writeAsLittleEndian);
  return bin;
};

/**
 * Encode a positive number as a 4-byte Uint32LE Uint8Array.
 *
 * This method will return an incorrect result for values outside of the range
 * `0` to `0xffffffff`.
 *
 * @param value - the number to encode
 */
export const numberToBinUint32LE = (value: number) => {
  const uint32Length = 4;
  const bin = new Uint8Array(uint32Length);
  const writeAsLittleEndian = true;
  const view = new DataView(bin.buffer, bin.byteOffset, bin.byteLength);
  // eslint-disable-next-line functional/no-expression-statement
  view.setUint32(0, value, writeAsLittleEndian);
  return bin;
};

/**
 * Encode a positive number as a 4-byte Uint32BE Uint8Array.
 *
 * This method will return an incorrect result for values outside of the range
 * `0` to `0xffffffff`.
 *
 * @param value - the number to encode
 */
export const numberToBinUint32BE = (value: number) => {
  const uint32Length = 4;
  const bin = new Uint8Array(uint32Length);
  const writeAsLittleEndian = false;
  const view = new DataView(bin.buffer, bin.byteOffset, bin.byteLength);
  // eslint-disable-next-line functional/no-expression-statement
  view.setUint32(0, value, writeAsLittleEndian);
  return bin;
};

/**
 * Encode a positive BigInt as little-endian Uint8Array. Negative values will
 * return the same result as `0`.
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
 * Encode a positive BigInt as an 8-byte Uint64LE Uint8Array, clamping the
 * results. (Values exceeding `0xffff_ffff_ffff_ffff` return the same result as
 * `0xffff_ffff_ffff_ffff`, negative values return the same result as `0`.)
 *
 * @param value - the number to encode
 */
export const bigIntToBinUint64LEClamped = (value: bigint) => {
  const uint64 = 8;
  return binToFixedLength(bigIntToBinUintLE(value), uint64);
};

/**
 * Encode a positive BigInt as an 8-byte Uint64LE Uint8Array.
 *
 * This method will return an incorrect result for values outside of the range
 * `0` to `0xffff_ffff_ffff_ffff`.
 *
 * @param value - the number to encode
 */
export const bigIntToBinUint64LE = (value: bigint) => {
  const uint64LengthInBits = 64;
  const valueAsUint64 = BigInt.asUintN(uint64LengthInBits, value);
  const fixedLengthBin = bigIntToBinUint64LEClamped(valueAsUint64);
  return fixedLengthBin;
};

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
  for (let index = 0; index < bytes; index++) {
    // eslint-disable-next-line functional/no-expression-statement, functional/immutable-data
    bin[index] = value;
    // eslint-disable-next-line functional/no-expression-statement, no-bitwise, no-param-reassign
    value >>>= bitsInAByte;
  }
  return bin;
};

/**
 * Decode a little-endian Uint8Array of any length into a number. For numbers
 * larger than `Number.MAX_SAFE_INTEGER` (`9007199254740991`), use
 * `binToBigIntUintLE`.
 *
 * The `bytes` parameter can be set to constrain the expected length (default:
 * `bin.length`). This method throws if `bin.length` is not equal to `bytes`.
 *
 * @privateRemarks
 * We avoid a bitwise strategy here because JavaScript uses 32-bit signed
 * integers for bitwise math, so larger numbers are converted incorrectly. E.g.
 * `2147483648 << 8` is `0`, while `2147483648n << 8n` is `549755813888n`.
 *
 * @param bin - the Uint8Array to decode
 * @param bytes - the number of bytes to read (default: `bin.length`)
 */
export const binToNumberUintLE = (bin: Uint8Array, bytes = bin.length) => {
  const base = 2;
  const bitsInAByte = 8;

  if (bin.length !== bytes) {
    // eslint-disable-next-line functional/no-throw-statement
    throw new TypeError(`Bin length must be ${bytes}.`);
  }
  return new Uint8Array(bin.buffer, bin.byteOffset, bin.length).reduce(
    (accumulated, byte, i) => accumulated + byte * base ** (bitsInAByte * i),
    0
  );
};

/**
 * Decode a 2-byte Uint16LE Uint8Array into a number.
 *
 * Throws if `bin` is shorter than 2 bytes.
 *
 * @param bin - the Uint8Array to decode
 */
export const binToNumberUint16LE = (bin: Uint8Array) => {
  const view = new DataView(bin.buffer, bin.byteOffset, bin.byteLength);
  const readAsLittleEndian = true;
  return view.getUint16(0, readAsLittleEndian);
};

/**
 * Decode a 4-byte Uint32LE Uint8Array into a number.
 *
 * Throws if `bin` is shorter than 4 bytes.
 *
 * @param bin - the Uint8Array to decode
 */
export const binToNumberUint32LE = (bin: Uint8Array) => {
  const view = new DataView(bin.buffer, bin.byteOffset, bin.byteLength);
  const readAsLittleEndian = true;
  return view.getUint32(0, readAsLittleEndian);
};

/**
 * Decode a big-endian Uint8Array of any length into a BigInt. If starting from
 * a hex value, consider using the BigInt constructor instead:
 * ```
 * BigInt(`0x${hex}`)
 * ```
 *
 * The `bytes` parameter can be set to constrain the expected length (default:
 * `bin.length`). This method throws if `bin.length` is not equal to `bytes`.
 *
 * @param bin - the Uint8Array to decode
 * @param bytes - the number of bytes to read (default: `bin.length`)
 */
export const binToBigIntUintBE = (bin: Uint8Array, bytes = bin.length) => {
  const bitsInAByte = 8;
  const shift = BigInt(bitsInAByte);

  if (bin.length !== bytes) {
    // eslint-disable-next-line functional/no-throw-statement
    throw new TypeError(`Bin length must be ${bytes}.`);
  }
  return new Uint8Array(bin.buffer, bin.byteOffset, bin.length).reduce(
    // eslint-disable-next-line no-bitwise
    (accumulated, byte) => (accumulated << shift) | BigInt(byte),
    BigInt(0)
  );
};

/**
 * Decode an unsigned, 32-byte big-endian Uint8Array into a BigInt. This can be
 * used to decode Uint8Array-encoded cryptographic primitives like private
 * keys, public keys, curve parameters, and signature points.
 *
 * If starting from a hex value, consider using the BigInt constructor instead:
 * ```
 * BigInt(`0x${hex}`)
 * ```
 * @param bin - the Uint8Array to decode
 */
export const binToBigIntUint256BE = (bin: Uint8Array) => {
  const uint256Bytes = 32;
  return binToBigIntUintBE(bin, uint256Bytes);
};

/**
 * Encode a positive BigInt into an unsigned 32-byte big-endian Uint8Array. This
 * can be used to encoded numbers for cryptographic primitives like private
 * keys, public keys, curve parameters, and signature points.
 *
 * Negative values will return the same result as `0`, values higher than
 * 2^256-1 will return the maximum expressible unsigned 256-bit value
 * (`0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff`).
 *
 * @param value - the BigInt to encode
 */
export const bigIntToBinUint256BEClamped = (value: bigint) => {
  const uint256Bytes = 32;
  return binToFixedLength(bigIntToBinUintLE(value), uint256Bytes).reverse();
};

/**
 * Decode a little-endian Uint8Array of any length into a BigInt.
 *
 * The `bytes` parameter can be set to constrain the expected length (default:
 * `bin.length`). This method throws if `bin.length` is not equal to `bytes`.
 *
 * @param bin - the Uint8Array to decode
 * @param bytes - the number of bytes to read (default: `bin.length`)
 */
export const binToBigIntUintLE = (bin: Uint8Array, bytes = bin.length) => {
  const bitsInAByte = 8;

  if (bin.length !== bytes) {
    // eslint-disable-next-line functional/no-throw-statement
    throw new TypeError(`Bin length must be ${bytes}.`);
  }
  return new Uint8Array(bin.buffer, bin.byteOffset, bin.length).reduceRight(
    // eslint-disable-next-line no-bitwise
    (accumulated, byte) => (accumulated << BigInt(bitsInAByte)) | BigInt(byte),
    BigInt(0)
  );
};

/**
 * Decode an 8-byte Uint64LE Uint8Array into a BigInt.
 *
 * Throws if `bin` is shorter than 8 bytes.
 *
 * @param bin - the Uint8Array to decode
 */
export const binToBigIntUint64LE = (bin: Uint8Array) => {
  const uint64LengthInBytes = 8;
  const truncatedBin =
    bin.length > uint64LengthInBytes ? bin.slice(0, uint64LengthInBytes) : bin;
  return binToBigIntUintLE(truncatedBin, uint64LengthInBytes);
};

const enum VarInt {
  uint8MaxValue = 0xfc,
  uint16Prefix = 0xfd,
  uint16MaxValue = 0xffff,
  uint32Prefix = 0xfe,
  uint32MaxValue = 0xffffffff,
  uint64Prefix = 0xff,
  uint8 = 1,
  uint16 = 2,
  uint32 = 4,
  uint64 = 8,
}

/**
 * Get the expected byte length of a Bitcoin VarInt given a first byte.
 *
 * @param firstByte - the first byte of the VarInt
 */
export const varIntPrefixToSize = (firstByte: number) => {
  switch (firstByte) {
    case VarInt.uint16Prefix:
      return VarInt.uint16 + 1;
    case VarInt.uint32Prefix:
      return VarInt.uint32 + 1;
    case VarInt.uint64Prefix:
      return VarInt.uint64 + 1;
    default:
      return VarInt.uint8;
  }
};

/**
 * Decode a VarInt (Satoshi's Variable-length integer format) from a Uint8Array,
 * returning the `nextIndex` after the VarInt and the value as a BigInt.
 *
 * Note: throws a runtime error if `bin` has a length of `0`.
 *
 * @param bin - the Uint8Array from which to read the VarInt
 * @param index - the index at which the VarInt begins
 */
export const decodeVarInt = (bin: Uint8Array, index = 0) => {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const bytes = varIntPrefixToSize(bin[index]!);
  const hasPrefix = bytes !== 1;
  return {
    nextIndex: index + bytes,
    value: hasPrefix
      ? binToBigIntUintLE(bin.subarray(index + 1, index + bytes), bytes - 1)
      : binToBigIntUintLE(bin.subarray(index, index + bytes), 1),
  };
};

/**
 * Encode a positive BigInt as a VarInt (Satoshi's Variable-length integer).
 *
 * Note: the maximum value of a VarInt is `0xffff_ffff_ffff_ffff`. This method
 * will return an incorrect result for values outside of the range `0` to
 * `0xffff_ffff_ffff_ffff`. If applicable, applications should handle such cases
 * prior to calling this method.
 *
 * @param value - the BigInt to encode (must be no larger than
 * `0xffff_ffff_ffff_ffff`)
 */
export const bigIntToVarInt = (value: bigint) =>
  value <= BigInt(VarInt.uint8MaxValue)
    ? Uint8Array.of(Number(value))
    : value <= BigInt(VarInt.uint16MaxValue)
    ? Uint8Array.from([
        VarInt.uint16Prefix,
        ...numberToBinUint16LE(Number(value)),
      ])
    : value <= BigInt(VarInt.uint32MaxValue)
    ? Uint8Array.from([
        VarInt.uint32Prefix,
        ...numberToBinUint32LE(Number(value)),
      ])
    : Uint8Array.from([VarInt.uint64Prefix, ...bigIntToBinUint64LE(value)]);
