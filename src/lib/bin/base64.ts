export const decodeBase64String = (base64Text: string) => {
  // base64 decode derived from: https://github.com/niklasvh/base64-arraybuffer
  // prettier-ignore
  const chars =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  // tslint:disable:no-magic-numbers
  const lookup = new Uint8Array(123);
  // tslint:disable-next-line:no-let
  for (let i = 0; i < chars.length; i++) {
    // tslint:disable-next-line:no-object-mutation no-expression-statement
    lookup[chars.charCodeAt(i)] = i;
  }
  const bufferLengthEstimate = base64Text.length * 0.75;
  const stringLength = base64Text.length;
  const bufferLength =
    base64Text[base64Text.length - 1] === '='
      ? base64Text[base64Text.length - 2] === '='
        ? bufferLengthEstimate - 2
        : bufferLengthEstimate - 1
      : bufferLengthEstimate;
  const buffer = new ArrayBuffer(bufferLength);
  const bytes = new Uint8Array(buffer);
  // tslint:disable-next-line:no-let
  let p = 0;
  // tslint:disable-next-line:no-let
  for (let i = 0; i < stringLength; i += 4) {
    const encoded1 = lookup[base64Text.charCodeAt(i)];
    const encoded2 = lookup[base64Text.charCodeAt(i + 1)];
    const encoded3 = lookup[base64Text.charCodeAt(i + 2)];
    const encoded4 = lookup[base64Text.charCodeAt(i + 3)];
    // tslint:disable:no-bitwise no-expression-statement no-object-mutation
    bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
    bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
    bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
    // tslint:enable:no-bitwise no-expression-statement no-object-mutation no-magic-numbers
  }
  return buffer;
};
