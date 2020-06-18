import { splitEvery } from './hex';

const binaryByteWidth = 8;
const binary = 2;

/**
 * Decode a binary-encoded string into a Uint8Array.
 *
 * E.g.: `binStringToBin('0010101001100100')` → `new Uint8Array([42, 100])`
 *
 * Note, this method always completes. If `binaryDigits` is not divisible by 8,
 * the final byte will be parsed as if it were prepended with `0`s (e.g. `1`
 * is interpreted as `00000001`). If `binaryDigits` is potentially malformed,
 * check it with `isBinString` before calling this method.
 *
 * @param validHex - a string of valid, hexadecimal-encoded data
 */
export const binStringToBin = (binaryDigits: string) =>
  Uint8Array.from(
    splitEvery(binaryDigits, binaryByteWidth).map((byteString) =>
      parseInt(byteString, binary)
    )
  );

/**
 * Encode a Uint8Array into a binary-encoded string.
 *
 * E.g.: `binToBinString(Uint8Array.from([42, 100]))` → `'0010101001100100'`
 *
 * @param bytes - a Uint8Array to encode
 */
export const binToBinString = (bytes: Uint8Array) =>
  bytes.reduce(
    (str, byte) => str + byte.toString(binary).padStart(binaryByteWidth, '0'),
    ''
  );

/**
 * For use before `binStringToBin`. Returns true if the provided string is a
 * valid binary string (length is divisible by 8 and only uses the characters
 * `0` and `1`).
 * @param maybeBinString - a string to test
 */
export const isBinString = (maybeBinString: string) =>
  maybeBinString.length % binaryByteWidth === 0 &&
  !/[^01]/u.test(maybeBinString);
