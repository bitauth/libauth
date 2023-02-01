const utf8Encoder = new TextEncoder();

/**
 * Interpret a string as UTF-8 and encode it as a Uint8Array.
 * @param utf8 - the string to encode
 */
export const utf8ToBin = (utf8: string) => utf8Encoder.encode(utf8);

const utf8Decoder = new TextDecoder();
/**
 * Decode a Uint8Array as a UTF-8 string.
 * @param bytes - the Uint8Array to decode
 */
export const binToUtf8 = (bytes: Uint8Array) => utf8Decoder.decode(bytes);
