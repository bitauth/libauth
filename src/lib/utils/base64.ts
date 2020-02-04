// base64 encode/decode derived from: https://github.com/niklasvh/base64-arraybuffer

const chars =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

const base64GroupLength = 4;
const nonBase64Chars = new RegExp(`[^${chars}=]`);

/**
 * For use before `base64ToBin`. Returns true if the provided string is valid
 * base64 (length is divisible by 4, only uses base64 characters).
 * @param maybeHex a string to test
 */
export const isBase64 = (maybeBase64: string) =>
  maybeBase64.length % base64GroupLength === 0 &&
  !nonBase64Chars.test(maybeBase64);

/**
 * Convert a base64-encoded string to a Uint8Array.
 *
 * Note, this method always completes. If `validBase64` is not valid base64, an
 * incorrect result will be returned. If `validBase64` is potentially malformed,
 * check it with `isBase64` before calling this method.
 *
 * @param validBase64 a valid base64-encoded string to decode
 */
export const base64ToBin = (validBase64: string) => {
  // tslint:disable:no-magic-numbers
  const lookup = new Uint8Array(123);
  // tslint:disable-next-line:no-let
  for (let i = 0; i < chars.length; i++) {
    // tslint:disable-next-line:no-object-mutation no-expression-statement
    lookup[chars.charCodeAt(i)] = i;
  }
  const bufferLengthEstimate = validBase64.length * 0.75;
  const stringLength = validBase64.length;
  const bufferLength =
    validBase64[validBase64.length - 1] === '='
      ? validBase64[validBase64.length - 2] === '='
        ? bufferLengthEstimate - 2
        : bufferLengthEstimate - 1
      : bufferLengthEstimate;
  const buffer = new ArrayBuffer(bufferLength);
  const bytes = new Uint8Array(buffer);
  // tslint:disable-next-line:no-let
  let p = 0;
  // tslint:disable-next-line:no-let
  for (let i = 0; i < stringLength; i += 4) {
    const encoded1 = lookup[validBase64.charCodeAt(i)];
    const encoded2 = lookup[validBase64.charCodeAt(i + 1)];
    const encoded3 = lookup[validBase64.charCodeAt(i + 2)];
    const encoded4 = lookup[validBase64.charCodeAt(i + 3)];
    // tslint:disable:no-bitwise no-expression-statement no-object-mutation
    bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
    bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
    bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
    // tslint:enable:no-bitwise no-expression-statement no-object-mutation no-magic-numbers
  }
  return bytes;
};

/**
 * Convert a Uint8Array to a base64-encoded string.
 * @param bytes the Uint8Array to base64 encode
 */
// tslint:disable:no-magic-numbers no-bitwise no-expression-statement
export const binToBase64 = (bytes: Uint8Array) => {
  let result = ''; // tslint:disable-line: no-let
  // tslint:disable-next-line: no-let
  for (let i = 0; i < bytes.length; i += 3) {
    result += chars[bytes[i] >> 2];
    result += chars[((bytes[i] & 3) << 4) | (bytes[i + 1] >> 4)];
    result += chars[((bytes[i + 1] & 15) << 2) | (bytes[i + 2] >> 6)];
    result += chars[bytes[i + 2] & 63];
  }
  // tslint:enable:no-bitwise no-expression-statement
  const padded =
    bytes.length % 3 === 2
      ? `${result.substring(0, result.length - 1)}=`
      : bytes.length % 3 === 1
      ? `${result.substring(0, result.length - 2)}==`
      : result;
  // tslint:enable: no-magic-numbers
  return padded;
};
