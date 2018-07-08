/**
 * Returns an array of incrementing values starting at `begin` and incrementing by one for `length`.
 *
 * E.g.: `range(3)` => `[0, 1, 2]` and `range(3, 1)` => `[1, 2, 3]`
 *
 * @param length the number of elements in the array
 * @param begin the index at which the range starts (default: `0`)
 */
export const range = (length: number, begin: number = 0) =>
  Array.from({ length }, (_, index) => begin + index);

/**
 * Split a string into an array of `chunkLength` strings. The final string may have a length between 1 and `chunkLength`.
 *
 * E.g.: `splitEvery('abcde', 2)` => `['ab', 'cd', 'e']`
 */
export const splitEvery = (input: string, chunkLength: number) =>
  range(Math.ceil(input.length / chunkLength))
    .map(index => index * chunkLength)
    .map(begin => input.slice(begin, begin + chunkLength));

const hexByteWidth = 2;
const hexadecimal = 16;

/**
 * Decode a hexadecimal-encoded string into a Uint8Array.
 *
 * E.g.: `hexToBin('2a64ff')` => `new Uint8Array([42, 100, 255])`
 *
 * @param hex a string of hexadecimal-encoded data
 */
export const hexToBin = (hex: string) =>
  new Uint8Array(
    splitEvery(hex, hexByteWidth).map(byte => parseInt(byte, hexadecimal))
  );

/**
 * Encode a Uint8Array into a hexadecimal-encoded string.
 *
 * E.g.: `binToHex(new Uint8Array([42, 100, 255]))` => `'2a64ff'`
 *
 * @param bytes a Uint8Array to encode
 */
export const binToHex = (bytes: Uint8Array) =>
  bytes.reduce(
    (str, byte) => str + byte.toString(hexadecimal).padStart(hexByteWidth, '0'),
    ''
  );
