import { formatError } from '../format/format.js';

import {
  decodeBech32,
  encodeBech32,
  extractNonBech32Characters,
  isBech32CharacterSet,
  regroupBits,
} from './bech32.js';

export enum CashAddressNetworkPrefix {
  mainnet = 'bitcoincash',
  testnet = 'bchtest',
  regtest = 'bchreg',
}
/**
 * The CashAddress specification standardizes the format of the version byte:
 * - Most significant bit: reserved, must be `0`
 * - next 4 bits: Address Type
 * - 3 least significant bits: Payload Length
 *
 * Two Address Type values are currently standardized:
 * - 0 (`0b0000`): P2PKH
 * - 1 (`0b0001`): P2SH
 *
 * And two are proposed by `CHIP-2022-02-CashTokens`:
 * - 2 (`0b0010`): P2PKH + Token Support
 * - 3 (`0b0011`): P2SH + Token Support
 *
 * The CashAddress specification standardizes expected payload length using
 * {@link CashAddressLengthBits}. Currently, two length bit values are in use by
 * standard CashAddress types:
 * - `0` (`0b000`): 20 bytes (in use by `p2pkh` and `p2sh20`)
 * - `3` (`0b011`): 32 bytes (in use by `p2sh32`)
 */
export enum CashAddressVersionByte {
  /**
   * Pay to Public Key Hash (P2PKH): `0b00000000`
   *
   * - Most significant bit: `0` (reserved)
   * - Address Type bits: `0000` (P2PKH)
   * - Length bits: `000` (20 bytes)
   */
  p2pkh = 0b00000000,
  /**
   * 20-byte Pay to Script Hash (P2SH20): `0b00001000`
   *
   * - Most significant bit: `0` (reserved)
   * - Address Type bits: `0001` (P2SH)
   * - Length bits: `000` (20 bytes)
   */
  p2sh20 = 0b00001000,
  /**
   * 32-byte Pay to Script Hash (P2SH20): `0b00001000`
   *
   * - Most significant bit: `0` (reserved)
   * - Address Type bits: `0001` (P2SH)
   * - Length bits: `011` (32 bytes)
   */
  p2sh32 = 0b00001011,
  /**
   * Pay to Public Key Hash (P2PKH) with token support: `0b00010000`
   *
   * - Most significant bit: `0` (reserved)
   * - Address Type bits: `0010` (P2PKH + Tokens)
   * - Length bits: `000` (20 bytes)
   */
  p2pkhWithTokens = 0b00010000,
  /**
   * 20-byte Pay to Script Hash (P2SH20) with token support: `0b00011000`
   * - Most significant bit: `0` (reserved)
   * - Address Type bits: `0011` (P2SH + Tokens)
   * - Length bits: `000` (20 bytes)
   */
  p2sh20WithTokens = 0b00011000,
  /**
   * 32-byte Pay to Script Hash (P2SH32) with token support: `0b00011011`
   * - Most significant bit: `0` (reserved)
   * - Address Type bits: `0011` (P2SH + Tokens)
   * - Length bits: `011` (32 bytes)
   */
  p2sh32WithTokens = 0b00011011,
}

/**
 * The address types currently defined in the CashAddress specification. See
 * also: {@link CashAddressVersionByte}.
 */
export enum CashAddressType {
  /**
   * Pay to Public Key Hash (P2PKH): `0b0000`
   */
  p2pkh = 'p2pkh',
  /**
   * Pay to Script Hash (P2SH): `0b0001`
   *
   * Note, this type is used for both {@link CashAddressVersionByte.p2sh20} and
   * {@link CashAddressVersionByte.p2sh32}.
   */
  p2sh = 'p2sh',
  /**
   * Pay to Public Key Hash (P2PKH) with token support: `0b0010`
   */
  p2pkhWithTokens = 'p2pkhWithTokens',
  /**
   * Pay to Script Hash (P2SH) with token support: `0b0011`
   *
   * Note, this type is used for both
   * {@link CashAddressVersionByte.p2sh20WithTokens} and
   * {@link CashAddressVersionByte.p2sh32WithTokens}.
   */
  p2shWithTokens = 'p2shWithTokens',
}

/**
 * The address type bits currently defined in the CashAddress specification.
 * These map to: {@link CashAddressType}.
 */
export enum CashAddressTypeBits {
  /**
   * Pay to Public Key Hash (P2PKH)
   */
  p2pkh = 0,
  /**
   * Pay to Script Hash (P2SH)
   */
  p2sh = 1,
  /**
   * Pay to Public Key Hash (P2PKH) with token support
   */
  p2pkhWithTokens = 2,
  /**
   * Pay to Script Hash (P2SH) with token support
   */
  p2shWithTokens = 3,
}

export const cashAddressTypeToTypeBits: {
  [key in CashAddressType]: CashAddressTypeBits;
} = {
  [CashAddressType.p2pkh]: CashAddressTypeBits.p2pkh,
  [CashAddressType.p2sh]: CashAddressTypeBits.p2sh,
  [CashAddressType.p2pkhWithTokens]: CashAddressTypeBits.p2pkhWithTokens,
  [CashAddressType.p2shWithTokens]: CashAddressTypeBits.p2shWithTokens,
};

export const cashAddressTypeBitsToType: {
  [key in CashAddressTypeBits]: CashAddressType;
} = {
  [CashAddressTypeBits.p2pkh]: CashAddressType.p2pkh,
  [CashAddressTypeBits.p2sh]: CashAddressType.p2sh,
  [CashAddressTypeBits.p2pkhWithTokens]: CashAddressType.p2pkhWithTokens,
  [CashAddressTypeBits.p2shWithTokens]: CashAddressType.p2shWithTokens,
};

/* eslint-disable @typescript-eslint/naming-convention */
export const cashAddressLengthBitsToLength = {
  0: 20,
  1: 24,
  2: 28,
  3: 32,
  4: 40,
  5: 48,
  6: 56,
  7: 64,
} as const;

export const cashAddressLengthToLengthBits = {
  20: 0,
  24: 1,
  28: 2,
  32: 3,
  40: 4,
  48: 5,
  56: 6,
  64: 7,
} as const;
/* eslint-enable @typescript-eslint/naming-convention */

export type CashAddressAvailableTypeBits =
  // prettier-ignore
  0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15;

export type CashAddressSupportedLength =
  keyof typeof cashAddressLengthToLengthBits;
export type CashAddressLengthBits = keyof typeof cashAddressLengthBitsToLength;

const enum Constants {
  cashAddressTypeBitsShift = 3,
  base32WordLength = 5,
  base256WordLength = 8,
  payloadSeparator = 0,
  asciiLowerCaseStart = 96,
  finiteFieldOrder = 32,
  cashAddressReservedBitMask = 0b10000000,
  cashAddressTypeBits = 0b1111,
  cashAddressLengthBits = 0b111,
  /**
   * In ASCII, each pair of upper and lower case characters share the same 5 least
   * significant bits.
   */
  asciiCaseInsensitiveBits = 0b11111,
  maximumCashAddressFormatVersion = 255,
}

/**
 * Encode a CashAddress version byte for the given address type and payload
 * length. See {@link CashAddressVersionByte} for more information.
 *
 * The `type` parameter must be a number between `0` and `15`, and `bitLength`
 * must be one of the standardized lengths. To use the contents of a variable,
 * cast it to {@link CashAddressType} or
 * {@link CashAddressSupportedLength} respectively,
 * e.g.:
 * ```ts
 * const type = 3 as CashAddressType;
 * const length = 20 as CashAddressSupportedLength;
 * getCashAddressVersionByte(type, length);
 * ```
 *
 * For the reverse, see {@link decodeCashAddressVersionByte}.
 *
 * @param typeBits - The address type bit of the payload being encoded.
 * @param length - The length of the payload being encoded.
 */
export const encodeCashAddressVersionByte = (
  typeBits: CashAddressAvailableTypeBits,
  length: CashAddressSupportedLength,
) =>
  // eslint-disable-next-line no-bitwise
  (typeBits << Constants.cashAddressTypeBitsShift) |
  cashAddressLengthToLengthBits[length];

export enum CashAddressVersionByteDecodingError {
  reservedBitSet = 'Reserved bit is set.',
}

/**
 * Decode a CashAddress version byte. For a list of known versions, see
 * {@link CashAddressVersionByte}.
 *
 * For the reverse, see {@link encodeCashAddressVersionByte}.
 *
 * @param version - The version byte to decode.
 */
export const decodeCashAddressVersionByte = (version: number) =>
  // eslint-disable-next-line no-negated-condition, no-bitwise
  (version & Constants.cashAddressReservedBitMask) !== 0
    ? CashAddressVersionByteDecodingError.reservedBitSet
    : {
        length:
          cashAddressLengthBitsToLength[
            // eslint-disable-next-line no-bitwise
            (version &
              Constants.cashAddressLengthBits) as keyof typeof cashAddressLengthBitsToLength
          ],
        typeBits:
          // eslint-disable-next-line no-bitwise
          (version >>> Constants.cashAddressTypeBitsShift) &
          Constants.cashAddressTypeBits,
      };

/**
 * Convert a string into an array of 5-bit numbers, representing the characters
 * in a case-insensitive way.
 *
 * @param prefix - The prefix to mask.
 */
export const maskCashAddressPrefix = (prefix: string) => {
  const result = [];
  // eslint-disable-next-line functional/no-let, functional/no-loop-statements, no-plusplus
  for (let i = 0; i < prefix.length; i++) {
    // eslint-disable-next-line functional/no-expression-statements, no-bitwise, functional/immutable-data
    result.push(prefix.charCodeAt(i) & Constants.asciiCaseInsensitiveBits);
  }
  return result;
};

// prettier-ignore
const bech32GeneratorMostSignificantByte = [0x98, 0x79, 0xf3, 0xae, 0x1e]; // eslint-disable-line @typescript-eslint/no-magic-numbers
// prettier-ignore
const bech32GeneratorRemainingBytes = [0xf2bc8e61, 0xb76d99e2, 0x3e5fb3c4, 0x2eabe2a8, 0x4f43e470]; // eslint-disable-line @typescript-eslint/no-magic-numbers

/**
 * Perform the CashAddress polynomial modulo operation, which is based on the
 * Bech32 polynomial modulo operation, but the returned checksum is 40 bits,
 * rather than 30.
 *
 * A.K.A. `PolyMod`
 *
 * @remarks
 * Notes from C++ implementation:
 * This function will compute what 8 5-bit values to XOR into the last 8 input
 * values, in order to make the checksum 0. These 8 values are packed together
 * in a single 40-bit integer. The higher bits correspond to earlier values.
 *
 * The input is interpreted as a list of coefficients of a polynomial over F
 * = GF(32), with an implicit 1 in front. If the input is [v0,v1,v2,v3,v4],
 * that polynomial is v(x) = 1*x^5 + v0*x^4 + v1*x^3 + v2*x^2 + v3*x + v4.
 * The implicit 1 guarantees that [v0,v1,v2,...] has a distinct checksum
 * from [0,v0,v1,v2,...].
 *
 * The output is a 40-bit integer whose 5-bit groups are the coefficients of
 * the remainder of v(x) mod g(x), where g(x) is the cashaddr generator, x^8
 * + [19]*x^7 + [3]*x^6 + [25]*x^5 + [11]*x^4 + [25]*x^3 + [3]*x^2 + [19]*x
 * + [1]. g(x) is chosen in such a way that the resulting code is a BCH
 * code, guaranteeing detection of up to 4 errors within a window of 1025
 * characters. Among the various possible BCH codes, one was selected to in
 * fact guarantee detection of up to 5 errors within a window of 160
 * characters and 6 errors within a window of 126 characters. In addition,
 * the code guarantee the detection of a burst of up to 8 errors.
 *
 * Note that the coefficients are elements of GF(32), here represented as
 * decimal numbers between []. In this finite field, addition is just XOR of
 * the corresponding numbers. For example, [27] + [13] = [27 ^ 13] = [22].
 * Multiplication is more complicated, and requires treating the bits of
 * values themselves as coefficients of a polynomial over a smaller field,
 * GF(2), and multiplying those polynomials mod a^5 + a^3 + 1. For example,
 * [5] * [26] = (a^2 + 1) * (a^4 + a^3 + a) = (a^4 + a^3 + a) * a^2 + (a^4 +
 * a^3 + a) = a^6 + a^5 + a^4 + a = a^3 + 1 (mod a^5 + a^3 + 1) = [9].
 *
 * During the course of the loop below, `c` contains the bit-packed
 * coefficients of the polynomial constructed from just the values of v that
 * were processed so far, mod g(x). In the above example, `c` initially
 * corresponds to 1 mod (x), and after processing 2 inputs of v, it
 * corresponds to x^2 + v0*x + v1 mod g(x). As 1 mod g(x) = 1, that is the
 * starting value for `c`.
 *
 * @param v - Array of 5-bit integers over which the checksum is to be computed.
 */
// Derived from the `bitcore-lib-cash` implementation (does not require BigInt): https://github.com/bitpay/bitcore
export const cashAddressPolynomialModulo = (v: number[]) => {
  /* eslint-disable functional/no-let, functional/no-loop-statements, functional/no-expression-statements, no-bitwise, @typescript-eslint/no-magic-numbers */
  let mostSignificantByte = 0;
  let lowerBytes = 1;
  let c = 0;
  // eslint-disable-next-line @typescript-eslint/prefer-for-of, no-plusplus
  for (let j = 0; j < v.length; j++) {
    c = mostSignificantByte >>> 3;
    mostSignificantByte &= 0x07;
    mostSignificantByte <<= 5;
    mostSignificantByte |= lowerBytes >>> 27;
    lowerBytes &= 0x07ffffff;
    lowerBytes <<= 5;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    lowerBytes ^= v[j]!;
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < bech32GeneratorMostSignificantByte.length; ++i) {
      // eslint-disable-next-line functional/no-conditional-statements
      if (c & (1 << i)) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        mostSignificantByte ^= bech32GeneratorMostSignificantByte[i]!;
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        lowerBytes ^= bech32GeneratorRemainingBytes[i]!;
      }
    }
  }
  lowerBytes ^= 1;
  // eslint-disable-next-line functional/no-conditional-statements
  if (lowerBytes < 0) {
    lowerBytes ^= 1 << 31;
    lowerBytes += (1 << 30) * 2;
  }
  return mostSignificantByte * (1 << 30) * 4 + lowerBytes;
  /* eslint-enable functional/no-let, functional/no-loop-statements, functional/no-expression-statements, no-bitwise, @typescript-eslint/no-magic-numbers */
};

/**
 * Convert the checksum returned by {@link cashAddressPolynomialModulo} to an
 * array of 5-bit positive integers that can be Base32 encoded.
 * @param checksum - A 40 bit checksum returned by
 * {@link cashAddressPolynomialModulo}.
 */
export const cashAddressChecksumToUint5Array = (checksum: number) => {
  const result = [];
  // eslint-disable-next-line functional/no-let, functional/no-loop-statements, no-plusplus
  for (let i = 0; i < Constants.base256WordLength; ++i) {
    // eslint-disable-next-line functional/no-expression-statements, no-bitwise, @typescript-eslint/no-magic-numbers, functional/immutable-data
    result.push(checksum & 31);
    // eslint-disable-next-line functional/no-expression-statements, @typescript-eslint/no-magic-numbers, no-param-reassign
    checksum /= 32;
  }
  // eslint-disable-next-line functional/immutable-data
  return result.reverse();
};

export enum CashAddressFormatEncodingError {
  excessiveVersion = 'CashAddress format encoding error: version must be 255 or less.',
}

export enum CashAddressEncodingError {
  noTypeBitsValueStandardizedForP2pk = 'CashAddress encoding error: no CashAddress type bit has been standardized for P2PK locking bytecode.',
  unsupportedPayloadLength = 'CashAddress encoding error: a payload of this length can not be encoded as a valid CashAddress.',
  unknownLockingBytecodeType = 'CashAddress encoding error: unknown locking bytecode type.',
}

export type DecodedCashAddressFormat = {
  /**
   * The payload of the CashAddress-formatted string.
   */
  payload: Uint8Array;
  /**
   * The prefix before the colon (`:`) indicating the network or protocol to
   * associate with the CashAddress-formatted string (for standard
   * CashAddresses, a {@link CashAddressNetworkPrefix}). Note that the
   * CashAddress Format checksum encodes the prefix in a case-insensitive way.
   */
  prefix: string;
  /**
   * A single byte indicating the version of this CashAddress-formatted string
   * (for standard CashAddresses, a {@link CashAddressVersionByte}).
   */
  version: number;
};

export type CashAddressResult = {
  /**
   * The successfully encoded CashAddress.
   */
  address: string;
};

/**
 * Encode a payload as a CashAddress-like string using the CashAddress format.
 *
 * Note that this function defaults to throwing encoding errors. To handle
 * errors in a type-safe way, set `throwErrors` to `false`.
 *
 * For the reverse, see {@link decodeCashAddressFormat}.
 *
 * To encode a standard CashAddress, use {@link encodeCashAddress}.
 */
export const encodeCashAddressFormat = <ThrowErrors extends boolean = true>({
  payload,
  prefix,
  throwErrors = true as ThrowErrors,
  version,
}: DecodedCashAddressFormat & {
  /**
   * If `true`, this function will throw an `Error` if the
   * provided `version` is invalid (greater than `255`) rather than returning
   * the error as a string (defaults to `true`).
   */
  throwErrors?: ThrowErrors;
}): ThrowErrors extends true
  ? CashAddressResult
  : CashAddressResult | string => {
  const checksum40BitPlaceholder = [0, 0, 0, 0, 0, 0, 0, 0];
  if (version > Constants.maximumCashAddressFormatVersion) {
    return formatError(
      CashAddressFormatEncodingError.excessiveVersion,
      `Version: ${version}.`,
      throwErrors,
    );
  }
  const payloadContents = regroupBits({
    bin: Uint8Array.from([version, ...payload]),
    resultWordLength: Constants.base32WordLength,
    sourceWordLength: Constants.base256WordLength,
  }) as number[];
  const checksumContents = [
    ...maskCashAddressPrefix(prefix),
    Constants.payloadSeparator,
    ...payloadContents,
    ...checksum40BitPlaceholder,
  ];
  const checksum = cashAddressPolynomialModulo(checksumContents);
  const encoded = [
    ...payloadContents,
    ...cashAddressChecksumToUint5Array(checksum),
  ];
  const address = `${prefix}:${encodeBech32(encoded)}`;
  return { address };
};

export const isValidCashAddressPayloadLength = (
  length: number,
): length is CashAddressSupportedLength =>
  (cashAddressLengthToLengthBits[length as CashAddressSupportedLength] as
    | CashAddressLengthBits
    | undefined) !== undefined;

export type DecodedCashAddressNonStandard = {
  /**
   * The payload of the CashAddress. For P2PKH, the public key hash; for
   * P2SH, the redeem bytecode hash.
   */
  payload: Uint8Array;
  /**
   * The prefix before the colon (`:`) indicating the network associated with
   * this CashAddress (usually a {@link CashAddressNetworkPrefix}). Note that
   * the CashAddress checksum encodes the prefix in a case-insensitive way.
   */
  prefix: string;
  /**
   * The type bit of the version byte; an integer between `0` and
   * `15` (inclusive).
   */
  typeBits: CashAddressAvailableTypeBits;
};

/**
 * Encode a payload as a CashAddress. This function is similar to
 * {@link encodeCashAddress} but supports non-standard `prefix`es and `type`s.
 *
 * Note that this function defaults to throwing encoding errors. To handle
 * errors in a type-safe way, set `throwErrors` to `false`.
 *
 * For other address standards that closely follow the CashAddress
 * specification (but have alternative version byte requirements), use
 * {@link encodeCashAddressFormat}.
 *
 * For the reverse, see {@link decodeCashAddressNonStandard}.
 */
export const encodeCashAddressNonStandard = <
  ThrowErrors extends boolean = true,
>({
  payload,
  prefix,
  throwErrors = true as ThrowErrors,
  typeBits,
}: DecodedCashAddressNonStandard & {
  /**
   * If `true`, this function will throw an `Error` if the provided `payload`
   * length is invalid rather than returning the error as a string (defaults
   * to `true`).
   */
  throwErrors?: ThrowErrors;
}): ThrowErrors extends true
  ? CashAddressResult
  : CashAddressResult | string => {
  const { length } = payload;
  if (!isValidCashAddressPayloadLength(length)) {
    return formatError(
      CashAddressEncodingError.unsupportedPayloadLength,
      `Payload length: ${length}.`,
      throwErrors,
    );
  }
  return encodeCashAddressFormat({
    payload,
    prefix,
    throwErrors,
    version: encodeCashAddressVersionByte(typeBits, length),
  });
};

export type DecodedCashAddress = {
  /**
   * The payload of the CashAddress. For P2PKH, the public key hash; for
   * P2SH, the redeem bytecode hash.
   */
  payload: Uint8Array;
  /**
   * The {@link CashAddressNetworkPrefix} before the colon (`:`) indicating the
   * network associated with this CashAddress.
   */
  prefix: `${CashAddressNetworkPrefix}`;
  /**
   * The {@link CashAddressType} of the CashAddress.
   */
  type: `${CashAddressType}`;
};

/**
 * Encode a payload as a CashAddress.
 *
 * Note that this function defaults to throwing encoding errors. To handle
 * errors in a type-safe way, set `throwErrors` to `false`.
 *
 * To encode a CashAddress with a custom/unknown prefix or type bit, see
 * {@link encodeCashAddressNonStandard}. For other address standards that
 * closely follow the CashAddress specification (but have alternative version
 * byte requirements), use {@link encodeCashAddressFormat}.
 *
 * To decode a CashAddress, use {@link decodeCashAddress}.
 *
 * @returns If `throwErrors` is `true`, the CashAddress as a `string`. If
 * `throwErrors` is `false`, a {@link CashAddressResult} on successful encoding
 * or an error message as a `string`.
 */
export const encodeCashAddress = <ThrowErrors extends boolean = true>({
  payload,
  prefix = 'bitcoincash',
  throwErrors = true as ThrowErrors,
  type,
}: Omit<DecodedCashAddress, 'prefix'> & {
  /**
   * The {@link CashAddressNetworkPrefix} before the colon (`:`) indicating the
   * network to associate with this CashAddress. Defaults to `bitcoincash`
   * (A.K.A. mainnet).
   */
  prefix?: `${CashAddressNetworkPrefix}`;
  /**
   * If `true`, this function will throw an `Error` when the
   * provided `payload` length is invalid rather than returning the error as a
   * string (defaults to `true`).
   */
  throwErrors?: ThrowErrors;
}) =>
  encodeCashAddressNonStandard({
    payload,
    prefix,
    throwErrors,
    typeBits: cashAddressTypeToTypeBits[type],
  }) as ThrowErrors extends true
    ? CashAddressResult
    : CashAddressResult | string;

export enum CashAddressDecodingError {
  improperPadding = 'CashAddress decoding error: the payload is improperly padded.',
  invalidCharacters = 'CashAddress decoding error: the payload contains unexpected characters.',
  invalidChecksum = 'CashAddress decoding error: invalid checksum - please review the address for errors.',
  invalidFormat = 'CashAddress decoding error: CashAddresses should be of the form "prefix:payload".',
  mismatchedPayloadLength = 'CashAddress decoding error: mismatched payload length for specified address version.',
  reservedBit = 'CashAddress decoding error: unknown CashAddress version, reserved bit set.',
  unknownAddressType = 'CashAddress decoding error: unknown CashAddress type.',
}

/**
 * Decode and validate a string using the CashAddress format. This is more
 * lenient than {@link decodeCashAddress}, which also validates the contents of
 * the version byte.
 *
 * Note, this method requires `address` to include a network prefix. To
 * decode a string with an unknown prefix, try
 * {@link decodeCashAddressFormatWithoutPrefix}.
 *
 * For the reverse, see {@link encodeCashAddressFormat}.
 *
 * @param address - The CashAddress-like string to decode.
 */
// eslint-disable-next-line complexity
export const decodeCashAddressFormat = (address: string) => {
  const parts = address.toLowerCase().split(':');
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  if (parts.length !== 2 || parts[0] === '' || parts[1] === '') {
    return formatError(
      CashAddressDecodingError.invalidFormat,
      `Provided address: "${address}".`,
    );
  }
  const [prefix, payload] = parts as [string, string];
  if (!isBech32CharacterSet(payload)) {
    return formatError(
      CashAddressDecodingError.invalidCharacters,
      `Invalid characters: ${extractNonBech32Characters(payload).join(', ')}.`,
    );
  }
  const decodedPayload = decodeBech32(payload);

  const polynomial = [
    ...maskCashAddressPrefix(prefix),
    Constants.payloadSeparator,
    ...decodedPayload,
  ];
  if (cashAddressPolynomialModulo(polynomial) !== 0) {
    return CashAddressDecodingError.invalidChecksum;
  }

  const checksum40BitPlaceholderLength = 8;
  const payloadContents = regroupBits({
    allowPadding: false,
    bin: decodedPayload.slice(0, -checksum40BitPlaceholderLength),
    resultWordLength: Constants.base256WordLength,
    sourceWordLength: Constants.base32WordLength,
  });

  if (typeof payloadContents === 'string') {
    return formatError(
      CashAddressDecodingError.improperPadding,
      payloadContents,
    );
  }

  const [version, ...contents] = payloadContents as [number, ...number[]];
  const result = Uint8Array.from(contents);

  return { payload: result, prefix, version } as DecodedCashAddressFormat;
};

/**
 * Decode and validate a CashAddress, strictly checking the version byte
 * according to the CashAddress specification. This is important for error
 * detection in CashAddresses.
 *
 * This function is similar to {@link decodeCashAddress} but supports
 * non-standard `type`s.
 *
 * For other address-like standards that closely follow the CashAddress
 * specification (but have alternative version byte requirements), use
 * {@link decodeCashAddressFormat}.
 *
 * Note, this method requires that CashAddresses include a network prefix. To
 * decode an address with an unknown prefix, try
 * {@link decodeCashAddressFormatWithoutPrefix}.
 *
 * For the reverse, see {@link encodeCashAddressNonStandard}.
 *
 * @param address - The CashAddress to decode.
 */
export const decodeCashAddressNonStandard = (address: string) => {
  const decoded = decodeCashAddressFormat(address);
  if (typeof decoded === 'string') {
    return decoded;
  }
  const info = decodeCashAddressVersionByte(decoded.version);

  if (info === CashAddressVersionByteDecodingError.reservedBitSet) {
    return formatError(CashAddressDecodingError.reservedBit);
  }

  if (decoded.payload.length !== info.length) {
    return formatError(
      CashAddressDecodingError.mismatchedPayloadLength,
      `Version byte indicated a byte length of ${info.length}, but the payload is ${decoded.payload.length} bytes.`,
    );
  }

  return {
    payload: decoded.payload,
    prefix: decoded.prefix,
    typeBits: info.typeBits,
  } as DecodedCashAddressNonStandard;
};

/**
 * Decode and validate a CashAddress, strictly checking the version byte
 * according to the CashAddress specification. This is important for error
 * detection in CashAddresses.
 *
 * To decode CashAddresses with non-standard `type`s,
 * see {@link decodeCashAddressNonStandard}.
 *
 * For other address-like standards that closely follow the CashAddress
 * specification (but have alternative version byte requirements), use
 * {@link decodeCashAddressFormat}.
 *
 * Note, this method requires that CashAddresses include a network prefix. To
 * decode an address with an unknown prefix, try
 * {@link decodeCashAddressFormatWithoutPrefix}.
 *
 * To encode a CashAddress, use {@link encodeCashAddress}.
 *
 * @param address - The CashAddress to decode.
 */
export const decodeCashAddress = (address: string) => {
  const decoded = decodeCashAddressNonStandard(address);
  if (typeof decoded === 'string') {
    return decoded;
  }
  const type = cashAddressTypeBitsToType[
    decoded.typeBits as keyof typeof cashAddressTypeBitsToType
  ] as CashAddressType | undefined;
  if (type === undefined) {
    return formatError(
      CashAddressDecodingError.unknownAddressType,
      `Type bit value: ${decoded.typeBits}.`,
    );
  }
  return {
    payload: decoded.payload,
    prefix: decoded.prefix,
    type,
  } as DecodedCashAddress;
};

/**
 * Attempt to decode and validate a CashAddress against a list of possible
 * prefixes. If the correct prefix is known, use {@link decodeCashAddress}.
 *
 * @param address - The CashAddress to decode.
 * @param possiblePrefixes - The network prefixes to try.
 */
// decodeCashAddressWithoutPrefix
export const decodeCashAddressFormatWithoutPrefix = (
  address: string,
  possiblePrefixes: string[] = [
    CashAddressNetworkPrefix.mainnet,
    CashAddressNetworkPrefix.testnet,
    CashAddressNetworkPrefix.regtest,
  ],
) => {
  // eslint-disable-next-line functional/no-loop-statements
  for (const prefix of possiblePrefixes) {
    const attempt = decodeCashAddressFormat(`${prefix}:${address}`);
    if (attempt !== CashAddressDecodingError.invalidChecksum) {
      return attempt;
    }
  }
  return CashAddressDecodingError.invalidChecksum;
};

/**
 * Convert a CashAddress polynomial to CashAddress string format.
 *
 * @remarks
 * CashAddress polynomials take the form:
 *
 * `[lowest 5 bits of each prefix character] 0 [payload + checksum]`
 *
 * This method remaps the 5-bit integers in the prefix location to the matching
 * ASCII lowercase characters, replaces the separator with `:`, and then Bech32
 * encodes the remaining payload and checksum.
 *
 * @param polynomial - An array of 5-bit integers representing the terms of a
 * CashAddress polynomial.
 */
export const cashAddressPolynomialToCashAddress = (polynomial: number[]) => {
  const separatorPosition = polynomial.indexOf(0);
  const prefix = polynomial
    .slice(0, separatorPosition)
    .map((integer) =>
      String.fromCharCode(Constants.asciiLowerCaseStart + integer),
    )
    .join('');
  const contents = encodeBech32(polynomial.slice(separatorPosition + 1));
  return `${prefix}:${contents}`;
};

export enum CashAddressFormatCorrectionError {
  tooManyErrors = 'CashAddress format correction error: this address cannot be corrected as it contains more than 2 errors.',
}

export type CashAddressFormatCorrection = {
  /**
   * The corrected address in CashAddressFormat (including the prefix).
   */
  address: string;
  /**
   * An array of up to two numbers (in ascending order) indicating the index of
   * each corrected character within the corrected address.
   */
  corrections: [] | [number, number] | [number];
};

/**
 * Attempt to correct up to 2 errors in a CashAddress-formatted string. The
 * string must include the prefix and only contain Bech32 characters.
 *
 * ## **CAUTION: improper use of this function can lead to lost funds.**
 *
 * Using error correction of CashAddress-like formats degrades error detection,
 * i.e. if the payload contains more than 2 errors, it is possible that error
 * correction will "correct" the payload to a plausible but incorrect payload.
 *
 * For applications which proceed to take irreversible actions – like sending a
 * payment – **naive usage of CashAddress Format error correction can lead to
 * vulnerabilities and lost funds**.
 *
 * It is strongly advised that this method only be used in fail-safe
 * applications (e.g. automatic correction of CashAddress-formatted private key
 * material during wallet recovery) or under explicit user control (e.g. "The
 * address you entered is invalid, please review the highlighted characters and
 * try again.").
 *
 * Only 2 substitution errors can be corrected (or a single swap) – deletions
 * and insertions (errors that shift many other characters and change the
 * length of the payload) can never be safely corrected and will produce an
 * error.
 *
 * Errors can be corrected in both the prefix and the payload, but attempting to
 * correct errors in the prefix prior to this method can improve results, e.g.
 * for `bchtest:qq2azmyyv6dtgczexyalqar70q036yund53jvfde0x`, the string
 * `bchtest:qq2azmyyv6dtgczexyalqar70q036yund53jvfdecc` can be corrected, while
 * `typo:qq2azmyyv6dtgczexyalqar70q036yund53jvfdecc` can not.
 *
 * @param address - The address or formatted data to correct.
 */
// Derived from: https://github.com/deadalnix/cashaddressed
// eslint-disable-next-line complexity
export const attemptCashAddressFormatErrorCorrection = (address: string) => {
  const parts = address.toLowerCase().split(':');
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  if (parts.length !== 2 || parts[0] === '' || parts[1] === '') {
    return CashAddressDecodingError.invalidFormat;
  }
  const [prefix, payload] = parts as [string, string];
  if (!isBech32CharacterSet(payload)) {
    return formatError(
      CashAddressDecodingError.invalidCharacters,
      `Invalid characters: ${extractNonBech32Characters(payload).join(', ')}.`,
    );
  }
  const decodedPayload = decodeBech32(payload);

  const polynomial = [...maskCashAddressPrefix(prefix), 0, ...decodedPayload];

  const originalChecksum = cashAddressPolynomialModulo(polynomial);
  if (originalChecksum === 0) {
    return {
      address: cashAddressPolynomialToCashAddress(polynomial),
      corrections: [],
    } as CashAddressFormatCorrection;
  }

  const syndromes: { [index: string]: number } = {};
  // eslint-disable-next-line functional/no-let, functional/no-loop-statements, no-plusplus
  for (let term = 0; term < polynomial.length; term++) {
    // eslint-disable-next-line functional/no-loop-statements
    for (
      // eslint-disable-next-line functional/no-let
      let errorVector = 1;
      errorVector < Constants.finiteFieldOrder;
      // eslint-disable-next-line no-plusplus
      errorVector++
    ) {
      // eslint-disable-next-line functional/no-expression-statements, no-bitwise, @typescript-eslint/no-non-null-assertion
      polynomial[term]! ^= errorVector;

      const correct = cashAddressPolynomialModulo(polynomial);
      if (correct === 0) {
        return {
          address: cashAddressPolynomialToCashAddress(polynomial),
          corrections: [term],
        } as CashAddressFormatCorrection;
      }
      // eslint-disable-next-line no-bitwise
      const s0 = (BigInt(correct) ^ BigInt(originalChecksum)).toString();
      // eslint-disable-next-line functional/no-expression-statements, functional/immutable-data
      syndromes[s0] = term * Constants.finiteFieldOrder + errorVector;
      // eslint-disable-next-line functional/no-expression-statements, no-bitwise, @typescript-eslint/no-non-null-assertion
      polynomial[term]! ^= errorVector;
    }
  }

  // eslint-disable-next-line functional/no-loop-statements
  for (const [s0, pe] of Object.entries(syndromes)) {
    // eslint-disable-next-line no-bitwise
    const s1Location = (BigInt(s0) ^ BigInt(originalChecksum)).toString();
    const s1 = syndromes[s1Location];
    if (s1 !== undefined) {
      const correctionIndex1 = Math.trunc(pe / Constants.finiteFieldOrder);
      const correctionIndex2 = Math.trunc(s1 / Constants.finiteFieldOrder);
      // eslint-disable-next-line functional/no-expression-statements, no-bitwise, @typescript-eslint/no-non-null-assertion
      polynomial[correctionIndex1]! ^= pe % Constants.finiteFieldOrder;
      // eslint-disable-next-line functional/no-expression-statements, no-bitwise, @typescript-eslint/no-non-null-assertion
      polynomial[correctionIndex2]! ^= s1 % Constants.finiteFieldOrder;
      return {
        address: cashAddressPolynomialToCashAddress(polynomial),
        corrections: [correctionIndex1, correctionIndex2].sort((a, b) => a - b),
      } as CashAddressFormatCorrection;
    }
  }

  return CashAddressFormatCorrectionError.tooManyErrors;
};
