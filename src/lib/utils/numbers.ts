const enum ByteLength {
  uint8 = 1,
  uint16 = 2,
  uint32 = 4,
  uint64 = 8
}

const enum BinaryInfo {
  bitsInAByte = 8,
  base = 2
}

/**
 * Encode a number as a little-endian Uint8Array.
 *
 * Note: For valid results, value must be within the range representable by the
 * specified number of bytes. For values exceeding Number.MAX_SAFE_INTEGER, use
 * `bigIntToBinUintLE`.
 *
 * @param value the number to convert into a Uint32LE Uint8Array
 * @param bytes the number of bytes to read
 */
export const numberToBinUintLE = (value: number, bytes: number) => {
  const bin = new Uint8Array(bytes);
  // eslint-disable-next-line functional/no-let
  for (let offset = 0; offset < bytes; offset++) {
    // tslint:disable-next-line:no-object-mutation no-expression-statement
    bin[offset] = value;
    // tslint:disable-next-line:no-bitwise no-parameter-reassignment no-expression-statement
    value = value >>> BinaryInfo.bitsInAByte;
  }
  return bin;
};

/**
 * Encode a number as a 2-byte Uint16LE Uint8Array.
 *
 * Note: For valid results, value must be between 0 and 0xffff.
 *
 * @param value the number to convert into a Uint16LE Uint8Array
 */
export const numberToBinUint16LE = (value: number) =>
  numberToBinUintLE(value, ByteLength.uint16);

/**
 * Encode a number as a 4-byte Uint32LE Uint8Array.
 *
 * Note: For valid results, value must be between 0 and 0xffffffff.
 *
 * @param value the number to convert into a Uint32LE Uint8Array
 */
export const numberToBinUint32LE = (value: number) =>
  numberToBinUintLE(value, ByteLength.uint32);

/**
 * Decode a little-endian Uint8Array into a number.
 *
 * @param bin the Uint8Array to decode
 * @param bytes the number of bytes to read
 */
export const binToNumberUintLE = (bin: Uint8Array, bytes: number) => {
  // eslint-disable-next-line functional/no-let
  let value = 0;
  // eslint-disable-next-line functional/no-let
  for (let offset = 0; offset < bytes; offset++) {
    // tslint:disable-next-line:no-bitwise no-expression-statement
    value += bin[offset] * BinaryInfo.base ** (BinaryInfo.bitsInAByte * offset);
  }
  return value;
};

/**
 * Decode a 2-byte Uint16LE Uint8Array into a number.
 *
 * @param bin the Uint8Array to decode
 */
export const binToNumberUint16LE = (bin: Uint8Array) =>
  binToNumberUintLE(bin, ByteLength.uint16);

/**
 * Decode a 4-byte Uint32LE Uint8Array into a number.
 *
 * @param bin the Uint8Array to decode
 */
export const binToNumberUint32LE = (bin: Uint8Array) =>
  binToNumberUintLE(bin, ByteLength.uint32);

/**
 * Return a BigInt as little-endian Uint8Array.
 *
 * Note: For valid results, value must be between 0 and 0xffff ffff ffff ffff.
 * @param value the number to convert into a little-endian Uint8Array
 * @param bytes the byte length of the Uint8Array to return
 */
export const bigIntToBinUintLE = (value: bigint, bytes: number) => {
  const bin = new Uint8Array(bytes);
  // eslint-disable-next-line functional/no-let
  for (let offset = 0; offset < bytes; offset++) {
    // tslint:disable-next-line:no-object-mutation no-expression-statement
    bin[offset] = Number(value);
    // tslint:disable-next-line:no-bitwise no-parameter-reassignment no-expression-statement
    value = value >> BigInt(BinaryInfo.bitsInAByte);
  }
  return bin;
};

/**
 * Return a BigInt as Uint64LE Uint8Array.
 *
 * Note: For valid results, value must be within the range representable by the
 * specified number of bytes.
 *
 * @param value the number to convert into a little-endian Uint8Array
 */
export const bigIntToBinUint64LE = (value: bigint) =>
  bigIntToBinUintLE(value, ByteLength.uint64);

/**
 * Decode a little-endian Uint8Array into a BigInt.
 *
 * @param bin the Uint8Array to decode
 */
export const binToBigIntUintLE = (bin: Uint8Array, bytes: number) => {
  const base = 2;
  const bitsInAByte = 8;
  // eslint-disable-next-line functional/no-let
  let value = BigInt(0);
  // eslint-disable-next-line functional/no-let
  for (let offset = 0; offset < bytes; offset++) {
    // tslint:disable-next-line:no-bitwise no-expression-statement
    value += BigInt(bin[offset] * base ** (bitsInAByte * offset));
  }
  return value;
};

/**
 * Decode an 8-byte Uint64LE Uint8Array into a BigInt.
 *
 * @param bin the Uint8Array to decode
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

const varIntPrefixToSize = (firstByte: number) => {
  switch (firstByte) {
    default:
      return ByteLength.uint8;
    case VarInt.Uint16Prefix:
      return ByteLength.uint16;
    case VarInt.Uint32Prefix:
      return ByteLength.uint32;
    case VarInt.Uint64Prefix:
      return ByteLength.uint64;
  }
};

/**
 * Read a Bitcoin VarInt (Variable-length integer) from a Uint8Array, returning
 * the `nextOffset` after the VarInt and the value as a BigInt.
 *
 * @param bin the Uint8Array from which to read the VarInt
 * @param offset the offset at which the input begins
 */
export const readBitcoinVarInt = (bin: Uint8Array, offset: number) => {
  const bytes = varIntPrefixToSize(bin[offset]);
  return {
    nextOffset: offset + bytes,
    value: binToBigIntUintLE(bin.subarray(offset, offset + bytes), bytes)
  };
};

/**
 * Encode a BigInt as a Bitcoin VarInt (Variable-length integer).
 *
 * Note: the maximum value of a Bitcoin VarInt is 0xffff ffff ffff ffff. This
 * method will produce invalid results for larger values.
 *
 * @param value the BigInt to encode (no larger than 0xffff ffff ffff ffff)
 */
export const bigIntToBitcoinVarInt = (value: bigint) =>
  value <= BigInt(VarInt.Uint8MaxValue)
    ? bigIntToBinUintLE(value, ByteLength.uint8)
    : value <= BigInt(VarInt.Uint16MaxValue)
    ? Uint8Array.from([
        VarInt.Uint16Prefix,
        ...bigIntToBinUintLE(value, ByteLength.uint16)
      ])
    : value <= BigInt(VarInt.Uint32MaxValue)
    ? Uint8Array.from([
        VarInt.Uint32Prefix,
        ...bigIntToBinUintLE(value, ByteLength.uint32)
      ])
    : Uint8Array.from([
        VarInt.Uint64Prefix,
        ...bigIntToBinUintLE(value, ByteLength.uint64)
      ]);
