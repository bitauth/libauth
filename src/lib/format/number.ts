import type { MaybeReadResult, ReadPosition } from '../lib.js';

import { formatError } from './error.js';

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
  // eslint-disable-next-line functional/no-loop-statements
  while (remaining >= baseUint8Array) {
    // eslint-disable-next-line functional/no-expression-statements, functional/immutable-data
    result.push(remaining % baseUint8Array);
    // eslint-disable-next-line functional/no-expression-statements
    remaining = Math.floor(remaining / baseUint8Array);
  }
  // eslint-disable-next-line functional/no-conditional-statements, functional/no-expression-statements, functional/immutable-data
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
  // eslint-disable-next-line functional/no-expression-statements, @typescript-eslint/no-unused-expressions
  bin.length > bytes ? fixedBytes.fill(maxValue) : fixedBytes.set(bin);
  return fixedBytes;
};

/**
 * Encode a positive integer as a 2-byte Uint16LE Uint8Array, clamping the
 * results – values exceeding `0xffff` (`65535`) return the same result as
 * `0xffff`, negative values will return the same result as `0`.
 *
 * @param value - the number to encode
 */
export const numberToBinUint16LEClamped = (value: number) => {
  const uint16 = 2;
  return binToFixedLength(numberToBinUintLE(value), uint16);
};

/**
 * Encode a positive integer as a 4-byte Uint32LE Uint8Array, clamping the
 * results – values exceeding `0xffffffff` (`4294967295`) return the same result
 * as `0xffffffff`, negative values will return the same result as `0`.
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
 * `0` to `0xffff` (`65535`). If applicable, applications should handle such
 * cases prior to calling this method.
 *
 * @param value - the number to encode
 */
export const numberToBinUint16LE = (value: number) => {
  const uint16Length = 2;
  const bin = new Uint8Array(uint16Length);
  const writeAsLittleEndian = true;
  const view = new DataView(bin.buffer, bin.byteOffset, bin.byteLength);
  // eslint-disable-next-line functional/no-expression-statements
  view.setUint16(0, value, writeAsLittleEndian);
  return bin;
};

/**
 * Encode an integer as a 2-byte Int16LE Uint8Array.
 *
 * This method will return an incorrect result for values outside of the range
 * `0x0000` to `0xffff` (`65535`). If applicable, applications should handle
 * such cases prior to calling this method.
 *
 * @param value - the number to encode
 */
export const numberToBinInt16LE = (value: number) => {
  const int16Length = 2;
  const bin = new Uint8Array(int16Length);
  const writeAsLittleEndian = true;
  const view = new DataView(bin.buffer, bin.byteOffset, bin.byteLength);
  // eslint-disable-next-line functional/no-expression-statements
  view.setInt16(0, value, writeAsLittleEndian);
  return bin;
};

/**
 * Encode an integer as a 4-byte Uint32LE Uint8Array.
 *
 * This method will return an incorrect result for values outside of the range
 * `0x00000000` to `0xffffffff` (`4294967295`). If applicable, applications
 * should handle such cases prior to calling this method.
 *
 * @param value - the number to encode
 */
export const numberToBinInt32LE = (value: number) => {
  const int32Length = 4;
  const bin = new Uint8Array(int32Length);
  const writeAsLittleEndian = true;
  const view = new DataView(bin.buffer, bin.byteOffset, bin.byteLength);
  // eslint-disable-next-line functional/no-expression-statements
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
 * `0` to `0xffff` (`65535`). If applicable, applications should handle such
 * cases prior to calling this method.
 *
 * @param value - the number to encode
 */
export const numberToBinUint16BE = (value: number) => {
  const uint16Length = 2;
  const bin = new Uint8Array(uint16Length);
  const writeAsLittleEndian = false;
  const view = new DataView(bin.buffer, bin.byteOffset, bin.byteLength);
  // eslint-disable-next-line functional/no-expression-statements
  view.setUint16(0, value, writeAsLittleEndian);
  return bin;
};

/**
 * Encode a positive number as a 4-byte Uint32LE Uint8Array.
 *
 * This method will return an incorrect result for values outside of the range
 * `0` to `0xffffffff` (`4294967295`). If applicable, applications should handle
 * such cases prior to calling this method.
 *
 * @param value - the number to encode
 */
export const numberToBinUint32LE = (value: number) => {
  const uint32Length = 4;
  const bin = new Uint8Array(uint32Length);
  const writeAsLittleEndian = true;
  const view = new DataView(bin.buffer, bin.byteOffset, bin.byteLength);
  // eslint-disable-next-line functional/no-expression-statements
  view.setUint32(0, value, writeAsLittleEndian);
  return bin;
};

/**
 * Encode a positive number as a 4-byte Uint32BE Uint8Array.
 *
 * This method will return an incorrect result for values outside of the range
 * `0` to `0xffffffff` (`4294967295`). If applicable, applications should handle
 * such cases prior to calling this method.
 *
 * @param value - the number to encode
 */
export const numberToBinUint32BE = (value: number) => {
  const uint32Length = 4;
  const bin = new Uint8Array(uint32Length);
  const writeAsLittleEndian = false;
  const view = new DataView(bin.buffer, bin.byteOffset, bin.byteLength);
  // eslint-disable-next-line functional/no-expression-statements
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
  // eslint-disable-next-line functional/no-loop-statements
  while (remaining >= base) {
    // eslint-disable-next-line functional/no-expression-statements, functional/immutable-data
    result.push(Number(remaining % base));
    // eslint-disable-next-line functional/no-expression-statements
    remaining /= base;
  }
  // eslint-disable-next-line functional/no-conditional-statements, functional/no-expression-statements, functional/immutable-data
  if (remaining > 0n) result.push(Number(remaining));

  return Uint8Array.from(result.length > 0 ? result : [0]);
};

/**
 * Encode a positive BigInt as an 8-byte Uint64LE Uint8Array, clamping the
 * results – values exceeding `0xffff_ffff_ffff_ffff` (`18446744073709551615`)
 * return the same result as `0xffff_ffff_ffff_ffff`, negative values return the
 * same result as `0`.
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
 * `0` to `0xffff_ffff_ffff_ffff` (`18446744073709551615`).
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
  // eslint-disable-next-line functional/no-let, functional/no-loop-statements, no-plusplus
  for (let index = 0; index < bytes; index++) {
    // eslint-disable-next-line functional/no-expression-statements, functional/immutable-data
    bin[index] = value;
    // eslint-disable-next-line functional/no-expression-statements, no-bitwise, no-param-reassign
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
    // eslint-disable-next-line functional/no-throw-statements
    throw new TypeError(`Bin length must be ${bytes}.`);
  }
  return new Uint8Array(bin.buffer, bin.byteOffset, bin.length).reduce(
    (accumulated, byte, i) => accumulated + byte * base ** (bitsInAByte * i),
    0,
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
    // eslint-disable-next-line functional/no-throw-statements
    throw new TypeError(`Bin length must be ${bytes}.`);
  }
  return new Uint8Array(bin.buffer, bin.byteOffset, bin.length).reduce(
    // eslint-disable-next-line no-bitwise
    (accumulated, byte) => (accumulated << shift) | BigInt(byte),
    0n,
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
    // eslint-disable-next-line functional/no-throw-statements
    throw new TypeError(`Bin length must be ${bytes}.`);
  }
  return new Uint8Array(bin.buffer, bin.byteOffset, bin.length).reduceRight(
    // eslint-disable-next-line no-bitwise
    (accumulated, byte) => (accumulated << BigInt(bitsInAByte)) | BigInt(byte),
    0n,
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

/**
 * Decode an {@link Output.valueSatoshis} into a `BigInt`. This is an alias for
 * {@link binToBigIntUint64LE}.
 *
 * Throws if the provided value is shorter than 8 bytes.
 */
export const binToValueSatoshis = binToBigIntUint64LE;

/**
 * Encode a `BigInt` into an {@link Output.valueSatoshis}. This is an alias for
 * {@link bigIntToBinUint64LE}.
 *
 * This method will return an incorrect result for values outside of the range 0
 * to 0xffff_ffff_ffff_ffff (`18446744073709551615`).
 */
export const valueSatoshisToBin = bigIntToBinUint64LE;

const enum CompactUint {
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
 * Get the expected byte length of a CompactUint given a first byte.
 *
 * @param firstByte - the first byte of the CompactUint
 */
export const compactUintPrefixToSize = (firstByte: number) => {
  switch (firstByte) {
    case CompactUint.uint16Prefix:
      return CompactUint.uint16 + 1;
    case CompactUint.uint32Prefix:
      return CompactUint.uint32 + 1;
    case CompactUint.uint64Prefix:
      return CompactUint.uint64 + 1;
    default:
      return CompactUint.uint8;
  }
};

export enum CompactUintError {
  noPrefix = 'Error reading CompactUint: requires at least one byte.',
  insufficientBytes = 'Error reading CompactUint: insufficient bytes.',
  nonMinimal = 'Error reading CompactUint: CompactUint is not minimally encoded.',
  excessiveBytes = 'Error decoding CompactUint: unexpected bytes after CompactUint.',
}

/**
 * Read a non-minimally-encoded `CompactUint` (see {@link bigIntToCompactUint})
 * from the provided {@link ReadPosition}, returning either an error message (as
 * a string) or an object containing the value and the
 * next {@link ReadPosition}.
 *
 * Rather than this function, most applications should
 * use {@link readCompactUintMinimal}.
 *
 * @param position - the {@link ReadPosition} at which to start reading the
 * `CompactUint`
 */
export const readCompactUint = (
  position: ReadPosition,
): MaybeReadResult<bigint> => {
  const { bin, index } = position;
  const prefix = bin[index];
  if (prefix === undefined) {
    return formatError(CompactUintError.noPrefix);
  }
  const bytes = compactUintPrefixToSize(prefix);
  if (bin.length - index < bytes) {
    return formatError(
      CompactUintError.insufficientBytes,
      `CompactUint prefix ${prefix} requires at least ${bytes} bytes. Remaining bytes: ${
        bin.length - index
      }`,
    );
  }
  const hasPrefix = bytes !== 1;
  const contents = hasPrefix
    ? bin.subarray(index + 1, index + bytes)
    : bin.subarray(index, index + bytes);

  return {
    position: { bin, index: index + bytes },
    result: binToBigIntUintLE(contents),
  };
};

/**
 * Encode a positive BigInt as a `CompactUint` (Satoshi's variable-length,
 * positive integer format).
 *
 * Note: the maximum value of a CompactUint is `0xffff_ffff_ffff_ffff`
 * (`18446744073709551615`). This method will return an incorrect result for
 * values outside of the range `0` to `0xffff_ffff_ffff_ffff`. If applicable,
 * applications should handle such cases prior to calling this method.
 *
 * @param value - the BigInt to encode (must be no larger than
 * `0xffff_ffff_ffff_ffff`)
 */
export const bigIntToCompactUint = (value: bigint) =>
  value <= BigInt(CompactUint.uint8MaxValue)
    ? Uint8Array.of(Number(value))
    : value <= BigInt(CompactUint.uint16MaxValue)
      ? Uint8Array.from([
          CompactUint.uint16Prefix,
          ...numberToBinUint16LE(Number(value)),
        ])
      : value <= BigInt(CompactUint.uint32MaxValue)
        ? Uint8Array.from([
            CompactUint.uint32Prefix,
            ...numberToBinUint32LE(Number(value)),
          ])
        : Uint8Array.from([
            CompactUint.uint64Prefix,
            ...bigIntToBinUint64LE(value),
          ]);

/**
 * Read a minimally-encoded `CompactUint` from the provided
 * {@link ReadPosition}, returning either an error message (as a string) or an
 * object containing the value and the next {@link ReadPosition}.
 *
 * @param position - the {@link ReadPosition} at which to start reading the
 * `CompactUint`
 */
export const readCompactUintMinimal = (
  position: ReadPosition,
): MaybeReadResult<bigint> => {
  const read = readCompactUint(position);
  if (typeof read === 'string') {
    return read;
  }
  const readLength = read.position.index - position.index;
  const canonicalEncoding = bigIntToCompactUint(read.result);
  if (readLength !== canonicalEncoding.length) {
    return formatError(
      CompactUintError.nonMinimal,
      `Value: ${read.result.toString()}, encoded length: ${readLength}, canonical length: ${
        canonicalEncoding.length
      }`,
    );
  }
  return read;
};

/**
 * Decode a minimally-encoded `CompactUint` (Satoshi's variable-length, positive
 * integer format) from a Uint8Array, returning the value as a BigInt. This
 * function returns an error if the entire input is not consumed – to read a
 * `CompactUint` from a position within a larger `Uint8Array`,
 * use {@link readCompactUintMinimal} or {@link readCompactUint}.
 *
 * @param bin - the Uint8Array from which to read the CompactUint
 */
export const compactUintToBigInt = (bin: Uint8Array) => {
  const read = readCompactUintMinimal({ bin, index: 0 });
  if (typeof read === 'string') {
    return read;
  }
  if (read.position.index !== bin.length) {
    return formatError(
      CompactUintError.excessiveBytes,
      `CompactUint ends at index ${read.position.index}, but input includes ${bin.length} bytes.`,
    );
  }
  return read.result;
};

/**
 * Convert a signed integer into it's two's compliment unsigned equivalent, e.g.
 * `0b11111111111111111111111111111110` is `-2` as a signed integer or
 * `4294967294` as an unsigned integer.
 */
export const int32SignedToUnsigned = (int32: number) =>
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  Uint32Array.from(Int32Array.of(int32))[0]!;

/**
 * Convert an unsigned integer into it's two's compliment signed equivalent,
 * e.g. `0b11111111111111111111111111111110` is `4294967294` as an unsigned
 * integer or `-2` as a signed integer.
 */
export const int32UnsignedToSigned = (int32: number) =>
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  Int32Array.from(Uint32Array.of(int32))[0]!;
