import { Immutable } from '../format/format';

/**
 * The list of 32 symbols used in Bech32 encoding.
 */
// cspell: disable-next-line
export const bech32CharacterSet = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';

/**
 * An object mapping each of the 32 symbols used in Bech32 encoding to their respective index in the character set.
 */
// prettier-ignore
export const bech32CharacterSetIndex = { q: 0, p: 1, z: 2, r: 3, y: 4, '9': 5, x: 6, '8': 7, g: 8, f: 9, '2': 10, t: 11, v: 12, d: 13, w: 14, '0': 15, s: 16, '3': 17, j: 18, n: 19, '5': 20, '4': 21, k: 22, h: 23, c: 24, e: 25, '6': 26, m: 27, u: 28, a: 29, '7': 30, l: 31 } as const; // eslint-disable-line sort-keys

export enum BitRegroupingError {
  integerOutOfRange = 'An integer provided in the source array is out of the range of the specified source word length.',
  hasDisallowedPadding = 'Encountered padding when padding was disallowed.',
  requiresDisallowedPadding = 'Encoding requires padding while padding is disallowed.',
}

/* eslint-disable functional/no-let, no-bitwise, functional/no-expression-statement, functional/no-conditional-statement, complexity */
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
 * @param bin - an array of numbers representing the bits to regroup. Each item
 * must be a number within the range of `sourceWordLength`
 * @param sourceWordLength - the bit-length of each number in `bin`, e.g. to
 * regroup bits from a `Uint8Array`, use `8` (must be a positive integer)
 * @param resultWordLength - the bit-length of each number in the desired result
 * array, e.g. to regroup bits into 4-bit numbers, use `4` (must be a positive
 * integer)
 * @param allowPadding - whether to allow the use of padding for `bin` values
 * where the provided number of bits cannot be directly mapped to an equivalent
 * result array (remaining bits are filled with `0`), defaults to `true`
 * @privateRemarks
 * Derived from: https://github.com/sipa/bech32
 */
export const regroupBits = ({
  bin,
  sourceWordLength,
  resultWordLength,
  allowPadding = true,
}: {
  bin: Immutable<Uint8Array> | readonly number[];
  sourceWordLength: number;
  resultWordLength: number;
  allowPadding?: boolean;
}) => {
  let accumulator = 0;
  let bits = 0;
  const result = [];
  const maxResultInt = (1 << resultWordLength) - 1;
  // eslint-disable-next-line functional/no-loop-statement, @typescript-eslint/prefer-for-of, no-plusplus
  for (let p = 0; p < bin.length; ++p) {
    const value = bin[p];
    if (value < 0 || value >> sourceWordLength !== 0) {
      return BitRegroupingError.integerOutOfRange;
    }
    accumulator = (accumulator << sourceWordLength) | value;
    bits += sourceWordLength;
    // eslint-disable-next-line functional/no-loop-statement
    while (bits >= resultWordLength) {
      bits -= resultWordLength;
      // eslint-disable-next-line functional/immutable-data
      result.push((accumulator >> bits) & maxResultInt);
    }
  }

  if (allowPadding) {
    if (bits > 0) {
      // eslint-disable-next-line functional/immutable-data
      result.push((accumulator << (resultWordLength - bits)) & maxResultInt);
    }
  } else if (bits >= sourceWordLength) {
    return BitRegroupingError.hasDisallowedPadding;
  } else if (((accumulator << (resultWordLength - bits)) & maxResultInt) > 0) {
    return BitRegroupingError.requiresDisallowedPadding;
  }
  return result;
};
/* eslint-enable functional/no-let, no-bitwise, functional/no-expression-statement, functional/no-conditional-statement, complexity */

/**
 * Encode an array of numbers as a base32 string using the Bech32 character set.
 *
 * Note, this method always completes. For a valid result, all items in
 * `base32IntegerArray` must be between `0` and `32`.
 *
 * @param base32IntegerArray - the array of 5-bit integers to encode
 */
export const encodeBech32 = (base32IntegerArray: readonly number[]) => {
  // eslint-disable-next-line functional/no-let
  let result = '';
  // eslint-disable-next-line @typescript-eslint/prefer-for-of, functional/no-let, functional/no-loop-statement, no-plusplus
  for (let i = 0; i < base32IntegerArray.length; i++) {
    // eslint-disable-next-line functional/no-expression-statement
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
 * @param validBech32 - the bech32-encoded string to decode
 */
export const decodeBech32 = (validBech32: string) => {
  const result: typeof bech32CharacterSetIndex[keyof typeof bech32CharacterSetIndex][] = [];
  // eslint-disable-next-line @typescript-eslint/prefer-for-of, functional/no-let, functional/no-loop-statement, no-plusplus
  for (let i = 0; i < validBech32.length; i++) {
    // eslint-disable-next-line functional/no-expression-statement, functional/immutable-data
    result.push(
      bech32CharacterSetIndex[
        validBech32[i] as keyof typeof bech32CharacterSetIndex
      ]
    );
  }
  return result;
};

const nonBech32Characters = new RegExp(`[^${bech32CharacterSet}]`, 'u');
const base32WordLength = 5;
const base256WordLength = 8;

/**
 * Validate that a string uses only characters from the bech32 character set.
 *
 * @param maybeBech32 - a string to test for valid Bech32 encoding
 */
export const isBech32CharacterSet = (maybeBech32: string) =>
  !nonBech32Characters.test(maybeBech32);

export enum Bech32DecodingError {
  notBech32CharacterSet = 'Bech32 decoding error: input contains characters outside of the Bech32 character set.',
}

/**
 * Convert a padded bech32-encoded string (without checksum) to a Uint8Array,
 * removing the padding. If the string is not valid Bech32, or if the array of
 * 5-bit integers would require padding to be regrouped into 8-bit bytes, this
 * method returns an error message.
 *
 * This method is the reverse of `binToBech32Padded`.
 *
 * @param bech32Padded - the padded bech32-encoded string to decode
 */
export const bech32PaddedToBin = (bech32Padded: string) => {
  const result = isBech32CharacterSet(bech32Padded)
    ? regroupBits({
        allowPadding: false,
        bin: decodeBech32(bech32Padded),
        resultWordLength: base256WordLength,
        sourceWordLength: base32WordLength,
      })
    : Bech32DecodingError.notBech32CharacterSet;
  return typeof result === 'string' ? result : Uint8Array.from(result);
};

/**
 * Convert a Uint8Array to a padded bech32-encoded string (without a checksum),
 * adding padding bits as necessary to convert all bytes to 5-bit integers.
 *
 * This method is the reverse of `bech32PaddedToBin`.
 *
 * @param bytes - the Uint8Array to bech32 encode
 */
export const binToBech32Padded = (bytes: Immutable<Uint8Array>) =>
  encodeBech32(
    regroupBits({
      bin: bytes,
      resultWordLength: base32WordLength,
      sourceWordLength: base256WordLength,
    }) as number[]
  );
