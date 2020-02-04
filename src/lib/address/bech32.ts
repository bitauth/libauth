/**
 * The list of 32 symbols used in Bech32 encoding.
 */
// cspell: disable-next-line
export const bech32CharacterSet = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';

/**
 * An object mapping each of the 32 symbols used in Bech32 encoding to their respective index in the character set.
 */
// prettier-ignore
export const bech32CharacterSetIndex = { q: 0, p: 1, z: 2, r: 3, y: 4, '9': 5, x: 6, '8': 7, g: 8, f: 9, '2': 10, t: 11, v: 12, d: 13, w: 14, '0': 15, s: 16, '3': 17, j: 18, n: 19, '5': 20, '4': 21, k: 22, h: 23, c: 24, e: 25, '6': 26, m: 27, u: 28, a: 29, '7': 30, l: 31 } as const; // tslint:disable-line: object-literal-sort-keys

export enum BitRegroupingError {
  integerOutOfRange = 'An integer provided in the source array is out of the range of the specified source word length.',
  hasDisallowedPadding = 'Encountered padding when padding was disallowed.',
  requiresDisallowedPadding = 'Encoding requires padding while padding is disallowed.'
}

// cSpell:ignore Pieter, Wuille
/**
 * Given an array of integers, regroup bits from `sourceWordLength` to
 * `resultWordLength`, returning a new array of integers between 0 and
 * toWordLength^2.
 *
 * Note, if `bin` is within the range of `sourceWordLength` and `padding` is
 * `true`, this method will never error.
 *
 * A.K.A. `convertbits`
 *
 * @internalRemarks
 * Derived from: https://github.com/sipa/bech32
 * Copyright (c) 2017 Pieter Wuille, MIT License
 */
// tslint:disable-next-line: cyclomatic-complexity
export const regroupBits = (
  bin: Uint8Array | number[],
  sourceWordLength: number,
  resultWordLength: number,
  padding = true
) => {
  // tslint:disable-next-line: no-let
  let accumulator = 0;
  // tslint:disable-next-line: no-let
  let bits = 0;
  const result = [];
  // tslint:disable-next-line: no-bitwise
  const maxResultInt = (1 << resultWordLength) - 1;
  // tslint:disable-next-line: prefer-for-of no-let
  for (let p = 0; p < bin.length; ++p) {
    const value = bin[p];
    // tslint:disable-next-line: no-if-statement no-bitwise
    if (value < 0 || value >> sourceWordLength !== 0) {
      return BitRegroupingError.integerOutOfRange;
    }
    // tslint:disable-next-line: no-expression-statement no-bitwise
    accumulator = (accumulator << sourceWordLength) | value;
    // tslint:disable-next-line: no-expression-statement
    bits += sourceWordLength;
    while (bits >= resultWordLength) {
      // tslint:disable-next-line: no-expression-statement
      bits -= resultWordLength;
      // tslint:disable-next-line: no-expression-statement no-bitwise
      result.push((accumulator >> bits) & maxResultInt);
    }
  }
  // tslint:disable-next-line: no-if-statement
  if (padding) {
    // tslint:disable-next-line: no-if-statement
    if (bits > 0) {
      // tslint:disable-next-line: no-expression-statement no-bitwise
      result.push((accumulator << (resultWordLength - bits)) & maxResultInt);
    }
    // tslint:disable-next-line: no-if-statement
  } else if (bits >= sourceWordLength) {
    return BitRegroupingError.hasDisallowedPadding;
    // tslint:disable-next-line: no-if-statement no-bitwise
  } else if (((accumulator << (resultWordLength - bits)) & maxResultInt) > 0) {
    return BitRegroupingError.requiresDisallowedPadding;
  }
  return result;
};

/**
 * Encode an array of numbers as a base32 string using the Bech32 character set.
 *
 * Note, this method always completes. For a valid result, all items in
 * `base32IntegerArray` must be between `0` and `32`.
 *
 * @param base32IntegerArray the array of 5-bit integers to encode
 */
export const encodeBech32 = (base32IntegerArray: number[]) => {
  // tslint:disable-next-line: no-let
  let result = '';
  // tslint:disable-next-line: prefer-for-of no-let
  for (let i = 0; i < base32IntegerArray.length; i++) {
    // tslint:disable-next-line: no-expression-statement
    result += bech32CharacterSet[base32IntegerArray[i]];
  }
  return result;
};

/**
 * Decode a Bech32-encoded string into an array of 5-bit integers.
 *
 * Note, this method always completes. If `validBech32` is not valid bech32,
 * an incorrect result will be returned. If `validBech32` is potentially
 * malformed, check it with `isBech32` before calling this method.
 *
 * @param validBech32 the bech32-encoded string to decode
 */
export const decodeBech32 = (validBech32: string) => {
  const result: Array<
    typeof bech32CharacterSetIndex[keyof typeof bech32CharacterSetIndex]
  > = [];
  // tslint:disable-next-line: prefer-for-of no-let
  for (let i = 0; i < validBech32.length; i++) {
    // tslint:disable-next-line: no-expression-statement
    result.push(
      bech32CharacterSetIndex[
        validBech32[i] as keyof typeof bech32CharacterSetIndex
      ]
    );
  }
  return result;
};

const nonBech32Characters = new RegExp(`[^${bech32CharacterSet}]`);
const base32WordLength = 5;
const base256WordLength = 8;

/**
 * Validate that a string is bech32 encoded (without a checksum). The string
 * must use only the bech32 character set, and it must be padded correctly, i.e.
 * it must encode a multiple of 8 bits.
 *
 * @param maybeBech32 a string to test for valid Bech32 encoding
 */
export const isBech32 = (maybeBech32: string) => {
  const expectedPadding =
    (maybeBech32.length * base32WordLength) % base256WordLength;
  const last5Bits = bech32CharacterSetIndex[
    maybeBech32[maybeBech32.length] as keyof typeof bech32CharacterSetIndex
  ] as
    | typeof bech32CharacterSetIndex[keyof typeof bech32CharacterSetIndex]
    | undefined;
  const onlyBech32Characters = !nonBech32Characters.test(maybeBech32);
  const noExcessivePadding = expectedPadding < base32WordLength;
  // tslint:disable-next-line: no-bitwise
  const mask = (1 << expectedPadding) - 1;
  // tslint:disable-next-line: no-bitwise
  const expectedPaddingIsZeroFilled = (Number(last5Bits) & mask) === 0;
  return (
    onlyBech32Characters && noExcessivePadding && expectedPaddingIsZeroFilled
  );
};

export enum Bech32DecodingError {
  notBech32Padded = 'Bech32 decoding error: input is not in Bech32 padded format.'
}

/**
 * Convert a padded bech32-encoded string (without checksum) to a Uint8Array,
 * removing the padding. If the string is not valid Bech32, or if the array of
 * 5-bit integers would require padding to be regrouped into 8-bit bytes, this
 * method returns an error message.
 *
 * This method is the reverse of `binToBech32Padded`.
 *
 * @param bech32Padded the padded bech32-encoded string to decode
 */
export const bech32PaddedToBin = (bech32Padded: string) => {
  const result = !isBech32(bech32Padded)
    ? Bech32DecodingError.notBech32Padded
    : regroupBits(
        decodeBech32(bech32Padded),
        base32WordLength,
        base256WordLength,
        false
      );
  return typeof result === 'string' ? result : Uint8Array.from(result);
};

/**
 * Convert a Uint8Array to a padded bech32-encoded string (without a checksum),
 * adding padding bits as necessary to convert all bytes to 5-bit integers.
 *
 * This method is the reverse of `bech32PaddedToBin`.
 *
 * @param bytes the Uint8Array to bech32 encode
 */
export const binToBech32Padded = (bytes: Uint8Array) =>
  encodeBech32(regroupBits(
    bytes,
    base256WordLength,
    base32WordLength
  ) as number[]);
