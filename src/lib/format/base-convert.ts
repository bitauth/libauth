export enum BaseConversionError {
  tooLong = 'An alphabet may be no longer than 254 characters.',
  ambiguousCharacter = 'A character code may only appear once in a single alphabet.',
  unknownCharacter = 'Encountered an unknown character for this alphabet.',
}

export interface BaseConverter {
  decode: (source: string) => Uint8Array | BaseConversionError.unknownCharacter;
  encode: (input: Uint8Array) => string;
}

/**
 * Create a `BaseConverter`, which exposes methods for encoding and decoding
 * `Uint8Array`s using bitcoin-style padding: each leading zero in the input is
 * replaced with the zero-index character of the `alphabet`, then the remainder
 * of the input is encoded as a large number in the specified alphabet.
 *
 * For example, using the alphabet `01`, the input `[0, 15]` is encoded `01111`
 * – a single `0` represents the leading padding, followed by the base2 encoded
 * `0x1111` (15). With the same alphabet, the input `[0, 0, 255]` is encoded
 * `0011111111` - only two `0` characters are required to represent both
 * leading zeros, followed by the base2 encoded `0x11111111` (255).
 *
 * **This is not compatible with `RFC 3548`'s `Base16`, `Base32`, or `Base64`.**
 *
 * If the alphabet is malformed, this method returns the error as a `string`.
 *
 * @param alphabet - an ordered string which maps each index to a character,
 * e.g. `0123456789`.
 * @privateRemarks
 * Algorithm from the `base-x` implementation (which is derived from the
 * original Satoshi implementation): https://github.com/cryptocoinjs/base-x
 */
export const createBaseConverter = (
  alphabet: string
): BaseConversionError | BaseConverter => {
  const undefinedValue = 255;
  const uint8ArrayBase = 256;

  if (alphabet.length >= undefinedValue) return BaseConversionError.tooLong;

  const alphabetMap = new Uint8Array(uint8ArrayBase).fill(undefinedValue);

  // eslint-disable-next-line functional/no-loop-statement, functional/no-let, no-plusplus
  for (let index = 0; index < alphabet.length; index++) {
    const characterCode = alphabet.charCodeAt(index);
    if (alphabetMap[characterCode] !== undefinedValue) {
      return BaseConversionError.ambiguousCharacter;
    }
    // eslint-disable-next-line functional/no-expression-statement, functional/immutable-data
    alphabetMap[characterCode] = index;
  }

  const base = alphabet.length;
  const paddingCharacter = alphabet.charAt(0);
  const factor = Math.log(base) / Math.log(uint8ArrayBase);
  const inverseFactor = Math.log(uint8ArrayBase) / Math.log(base);

  return {
    // eslint-disable-next-line complexity
    decode: (input: string) => {
      if (input.length === 0) return Uint8Array.of();

      const firstNonZeroIndex = input
        .split('')
        .findIndex((character) => character !== paddingCharacter);
      if (firstNonZeroIndex === -1) {
        return new Uint8Array(input.length);
      }

      const requiredLength = Math.floor(
        (input.length - firstNonZeroIndex) * factor + 1
      );
      const decoded = new Uint8Array(requiredLength);

      /* eslint-disable functional/no-let, functional/no-expression-statement */
      let nextByte = firstNonZeroIndex;
      let remainingBytes = 0;

      // eslint-disable-next-line functional/no-loop-statement
      while ((input[nextByte] as string | undefined) !== undefined) {
        let carry = alphabetMap[input.charCodeAt(nextByte)];
        if (carry === undefinedValue)
          return BaseConversionError.unknownCharacter;

        let digit = 0;
        // eslint-disable-next-line functional/no-loop-statement
        for (
          let steps = requiredLength - 1;
          (carry !== 0 || digit < remainingBytes) && steps !== -1;
          // eslint-disable-next-line no-plusplus
          steps--, digit++
        ) {
          carry += Math.floor(base * decoded[steps]);
          // eslint-disable-next-line functional/immutable-data
          decoded[steps] = Math.floor(carry % uint8ArrayBase);
          carry = Math.floor(carry / uint8ArrayBase);
        }

        remainingBytes = digit;
        // eslint-disable-next-line no-plusplus
        nextByte++;
      }
      /* eslint-enable functional/no-let, functional/no-expression-statement */

      const firstNonZeroResultDigit = decoded.findIndex((value) => value !== 0);

      const bin = new Uint8Array(
        firstNonZeroIndex + (requiredLength - firstNonZeroResultDigit)
      );
      // eslint-disable-next-line functional/no-expression-statement
      bin.set(decoded.slice(firstNonZeroResultDigit), firstNonZeroIndex);
      return bin;
    },
    // eslint-disable-next-line complexity
    encode: (input: Uint8Array) => {
      if (input.length === 0) return '';

      const firstNonZeroIndex = input.findIndex((byte) => byte !== 0);
      if (firstNonZeroIndex === -1) {
        return paddingCharacter.repeat(input.length);
      }

      const requiredLength = Math.floor(
        (input.length - firstNonZeroIndex) * inverseFactor + 1
      );
      const encoded = new Uint8Array(requiredLength);

      /* eslint-disable functional/no-let, functional/no-expression-statement */
      let nextByte = firstNonZeroIndex;
      let remainingBytes = 0;
      // eslint-disable-next-line functional/no-loop-statement
      while (nextByte !== input.length) {
        let carry = input[nextByte];
        let digit = 0;
        // eslint-disable-next-line functional/no-loop-statement
        for (
          let steps = requiredLength - 1;
          (carry !== 0 || digit < remainingBytes) && steps !== -1;
          // eslint-disable-next-line no-plusplus
          steps--, digit++
        ) {
          carry += Math.floor(uint8ArrayBase * encoded[steps]);
          // eslint-disable-next-line functional/immutable-data
          encoded[steps] = Math.floor(carry % base);
          carry = Math.floor(carry / base);
        }
        remainingBytes = digit;
        // eslint-disable-next-line no-plusplus
        nextByte++;
      }
      /* eslint-enable functional/no-let, functional/no-expression-statement */

      const firstNonZeroResultDigit = encoded.findIndex((value) => value !== 0);

      const padding = paddingCharacter.repeat(firstNonZeroIndex);
      return encoded
        .slice(firstNonZeroResultDigit)
        .reduce((all, digit) => all + alphabet.charAt(digit), padding);
    },
  };
};

export const bitcoinBase58Alphabet =
  '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

const base58 = createBaseConverter(bitcoinBase58Alphabet) as BaseConverter;

/**
 * Convert a bitcoin-style base58-encoded string to a Uint8Array.
 *
 * See `createBaseConverter` for format details.
 * @param input - a valid base58-encoded string to decode
 */
export const base58ToBin = base58.decode;

/**
 * Convert a Uint8Array to a bitcoin-style base58-encoded string.
 *
 * See `createBaseConverter` for format details.
 * @param input - the Uint8Array to base58 encode
 */
export const binToBase58 = base58.encode;
