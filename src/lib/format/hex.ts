/**
 * Returns an array of incrementing values starting at `begin` and incrementing by one for `length`.
 *
 * E.g.: `range(3)` → `[0, 1, 2]` and `range(3, 1)` → `[1, 2, 3]`
 *
 * @param length - the number of elements in the array
 * @param begin - the index at which the range starts (default: `0`)
 */
export const range = (length: number, begin = 0) =>
  Array.from({ length }, (_, index) => begin + index);

/**
 * Split a string into an array of `chunkLength` strings. The final string may have a length between 1 and `chunkLength`.
 *
 * E.g.: `splitEvery('abcde', 2)` → `['ab', 'cd', 'e']`
 */
export const splitEvery = (input: string, chunkLength: number) =>
  range(Math.ceil(input.length / chunkLength))
    .map((index) => index * chunkLength)
    .map((begin) => input.slice(begin, begin + chunkLength));

const hexByteWidth = 2;
const hexadecimal = 16;

/**
 * Decode a hexadecimal-encoded string into a Uint8Array.
 *
 * E.g.: `hexToBin('2a64ff')` → `new Uint8Array([42, 100, 255])`
 *
 * Note, this method always completes. If `validHex` is not divisible by 2,
 * the final byte will be parsed as if it were prepended with a `0` (e.g. `aaa`
 * is interpreted as `aa0a`). If `validHex` is potentially malformed, check
 * it with `isHex` before calling this method.
 *
 * @param validHex - a string of valid, hexadecimal-encoded data
 */
export const hexToBin = (validHex: string) =>
  Uint8Array.from(
    splitEvery(validHex, hexByteWidth).map((byte) =>
      parseInt(byte, hexadecimal)
    )
  );

/**
 * For use before `hexToBin`. Returns true if the provided string is valid
 * hexadecimal (length is divisible by 2, only uses hexadecimal characters).
 * @param maybeHex - a string to test
 */
export const isHex = (maybeHex: string) =>
  maybeHex.length % hexByteWidth === 0 && !/[^a-fA-F0-9]/u.test(maybeHex);

/**
 * Encode a Uint8Array into a hexadecimal-encoded string.
 *
 * E.g.: `binToHex(new Uint8Array([42, 100, 255]))` → `'2a64ff'`
 *
 * @param bytes - a Uint8Array to encode
 */
export const binToHex = (bytes: Uint8Array) =>
  bytes.reduce(
    (str, byte) => str + byte.toString(hexadecimal).padStart(hexByteWidth, '0'),
    ''
  );

/**
 * Decode a hexadecimal-encoded string into bytes, reverse it, then re-encode.
 *
 * @param validHex - a string of valid, hexadecimal-encoded data. See
 * `hexToBin` for more information.
 */
export const swapEndianness = (validHex: string) =>
  binToHex(hexToBin(validHex).reverse());

/**
 * Reduce an array of `Uint8Array`s into a single `Uint8Array`.
 * @param array - the array of `Uint8Array`s to flatten
 */
export const flattenBinArray = (array: readonly Uint8Array[]) => {
  const totalLength = array.reduce((total, bin) => total + bin.length, 0);
  const flattened = new Uint8Array(totalLength);
  // eslint-disable-next-line functional/no-expression-statement
  array.reduce((index, bin) => {
    // eslint-disable-next-line functional/no-expression-statement
    flattened.set(bin, index);
    return index + bin.length;
  }, 0);
  return flattened;
};
