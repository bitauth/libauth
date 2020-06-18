import { Immutable } from '../format/format';

import {
  decodeBech32,
  encodeBech32,
  isBech32CharacterSet,
  regroupBits,
} from './bech32';

export enum CashAddressNetworkPrefix {
  mainnet = 'bitcoincash',
  testnet = 'bchtest',
  regtest = 'bchreg',
}

export const cashAddressBitToSize = {
  0: 160,
  1: 192,
  2: 224,
  3: 256,
  4: 320,
  5: 384,
  6: 448,
  7: 512,
} as const;

export const cashAddressSizeToBit = {
  160: 0,
  192: 1,
  224: 2,
  256: 3,
  320: 4,
  384: 5,
  448: 6,
  512: 7,
} as const;

/**
 * The CashAddress specification standardizes the format of the version byte:
 * - Most significant bit: reserved, must be `0`
 * - next 4 bits: Address Type
 * - 3 least significant bits: Hash Size
 *
 * Only two Address Type values are currently standardized:
 * - 0 (`0b0000`): P2PKH
 * - 1 (`0b0001`): P2SH
 *
 * While both P2PKH and P2SH addresses always use 160 bit hashes, the
 * CashAddress specification standardizes other sizes for future use (or use by
 * other systems), see `CashAddressSizeBit`.
 *
 * With these constraints, only two version byte values are currently standard.
 */
export enum CashAddressVersionByte {
  /**
   * Pay to Public Key Hash (P2PKH): `0b00000000`
   *
   * - Most significant bit: `0` (reserved)
   * - Address Type bits: `0000` (P2PKH)
   * - Size bits: `000` (160 bits)
   */
  P2PKH = 0b00000000,
  /**
   * Pay to Script Hash (P2SH): `0b00001000`
   *
   * - Most significant bit: `0` (reserved)
   * - Address Type bits: `0001` (P2SH)
   * - Size bits: `000` (160 bits)
   */
  P2SH = 0b00001000,
}

/**
 * The address types currently defined in the CashAddress specification. See
 * also: `CashAddressVersionByte`.
 */
export enum CashAddressType {
  /**
   * Pay to Public Key Hash (P2PKH)
   */
  P2PKH = 0,
  /**
   * Pay to Script Hash (P2SH)
   */
  P2SH = 1,
}

const cashAddressTypeBitShift = 3;

export type CashAddressAvailableTypes =
  // prettier-ignore
  0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15;

export type CashAddressAvailableSizesInBits = keyof typeof cashAddressSizeToBit;
export type CashAddressAvailableSizes = keyof typeof cashAddressBitToSize;

/**
 * Encode a CashAddress version byte for the given address type and hash length.
 * See `CashAddressVersionByte` for more information.
 *
 * The `type` parameter must be a number between `0` and `15`, and `bitLength`
 * must be one of the standardized lengths. To use the contents of a variable,
 * cast it to `CashAddressType` or `CashAddressSize` respectively, e.g.:
 * ```ts
 * const type = 3 as CashAddressType;
 * const size = 160 as CashAddressSize;
 * getCashAddressVersionByte(type, size);
 * ```
 * @param type - the address type of the hash being encoded
 * @param bitLength - the bit length of the hash being encoded
 */
export const encodeCashAddressVersionByte = (
  type: CashAddressAvailableTypes,
  bitLength: CashAddressAvailableSizesInBits
  // eslint-disable-next-line no-bitwise
) => (type << cashAddressTypeBitShift) | cashAddressSizeToBit[bitLength];

const cashAddressReservedBitMask = 0b10000000;
const cashAddressTypeBits = 0b1111;
const cashAddressSizeBits = 0b111;
const empty = 0;

export enum CashAddressVersionByteDecodingError {
  reservedBitSet = 'Reserved bit is set.',
}

/**
 * Decode a CashAddress version byte.
 * @param version - the version byte to decode
 */
export const decodeCashAddressVersionByte = (version: number) =>
  // eslint-disable-next-line no-negated-condition, no-bitwise
  (version & cashAddressReservedBitMask) !== empty
    ? CashAddressVersionByteDecodingError.reservedBitSet
    : {
        bitLength:
          cashAddressBitToSize[
            // eslint-disable-next-line no-bitwise
            (version & cashAddressSizeBits) as keyof typeof cashAddressBitToSize
          ],
        // eslint-disable-next-line no-bitwise
        type: (version >>> cashAddressTypeBitShift) & cashAddressTypeBits,
      };

/**
 * In ASCII, each pair of upper and lower case characters share the same 5 least
 * significant bits.
 */
const asciiCaseInsensitiveBits = 0b11111;

/**
 * Convert a string into an array of 5-bit numbers, representing the
 * characters in a case-insensitive way.
 * @param prefix - the prefix to mask
 */
export const maskCashAddressPrefix = (prefix: string) => {
  const result = [];
  // eslint-disable-next-line functional/no-let, functional/no-loop-statement, no-plusplus
  for (let i = 0; i < prefix.length; i++) {
    // eslint-disable-next-line functional/no-expression-statement, no-bitwise, functional/immutable-data
    result.push(prefix.charCodeAt(i) & asciiCaseInsensitiveBits);
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
 * Notes from Bitcoin ABC:
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
 * @privateRemarks
 * Derived from the `bitcore-lib-cash` implementation, which does not require
 * BigInt: https://github.com/bitpay/bitcore
 *
 * @param v - Array of 5-bit integers over which the checksum is to be computed
 */
export const cashAddressPolynomialModulo = (v: readonly number[]) => {
  /* eslint-disable functional/no-let, functional/no-loop-statement, functional/no-expression-statement, no-bitwise, @typescript-eslint/no-magic-numbers */
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
    lowerBytes ^= v[j];
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < bech32GeneratorMostSignificantByte.length; ++i) {
      // eslint-disable-next-line functional/no-conditional-statement
      if (c & (1 << i)) {
        mostSignificantByte ^= bech32GeneratorMostSignificantByte[i];
        lowerBytes ^= bech32GeneratorRemainingBytes[i];
      }
    }
  }
  lowerBytes ^= 1;
  // eslint-disable-next-line functional/no-conditional-statement
  if (lowerBytes < 0) {
    lowerBytes ^= 1 << 31;
    lowerBytes += (1 << 30) * 2;
  }
  return mostSignificantByte * (1 << 30) * 4 + lowerBytes;
  /* eslint-enable functional/no-let, functional/no-loop-statement, functional/no-expression-statement, no-bitwise, @typescript-eslint/no-magic-numbers */
};

const base32WordLength = 5;
const base256WordLength = 8;

/**
 * Convert the checksum returned by `cashAddressPolynomialModulo` to an array of
 * 5-bit positive integers which can be Base32 encoded.
 * @param checksum - a 40 bit checksum returned by `cashAddressPolynomialModulo`
 */
export const cashAddressChecksumToUint5Array = (checksum: number) => {
  const result = [];
  // eslint-disable-next-line functional/no-let, functional/no-loop-statement, no-plusplus
  for (let i = 0; i < base256WordLength; ++i) {
    // eslint-disable-next-line functional/no-expression-statement, no-bitwise, @typescript-eslint/no-magic-numbers, functional/immutable-data
    result.push(checksum & 31);
    // eslint-disable-next-line functional/no-expression-statement, @typescript-eslint/no-magic-numbers, no-param-reassign
    checksum /= 32;
  }
  // eslint-disable-next-line functional/immutable-data
  return result.reverse();
};

const payloadSeparator = 0;

/**
 * Encode a hash as a CashAddress-like string using the CashAddress format.
 *
 * To encode a standard CashAddress, use `encodeCashAddress`.
 *
 * @param prefix - a valid prefix indicating the network for which to encode the
 * address – must be only lowercase letters
 * @param version - a single byte indicating the version of this address
 * @param hash - the hash to encode
 */
export const encodeCashAddressFormat = <
  Prefix extends string = CashAddressNetworkPrefix,
  Version extends number = CashAddressVersionByte
>(
  prefix: Prefix,
  version: Version,
  hash: Immutable<Uint8Array>
) => {
  const checksum40BitPlaceholder = [0, 0, 0, 0, 0, 0, 0, 0];
  const payloadContents = regroupBits({
    bin: Uint8Array.from([version, ...hash]),
    resultWordLength: base32WordLength,
    sourceWordLength: base256WordLength,
  }) as number[];
  const checksumContents = [
    ...maskCashAddressPrefix(prefix),
    payloadSeparator,
    ...payloadContents,
    ...checksum40BitPlaceholder,
  ];
  const checksum = cashAddressPolynomialModulo(checksumContents);
  const payload = [
    ...payloadContents,
    ...cashAddressChecksumToUint5Array(checksum),
  ];
  return `${prefix}:${encodeBech32(payload)}`;
};

export enum CashAddressEncodingError {
  unsupportedHashLength = 'CashAddress encoding error: a hash of this length can not be encoded as a valid CashAddress.',
}

const isValidBitLength = (
  bitLength: number
): bitLength is CashAddressAvailableSizesInBits =>
  (cashAddressSizeToBit[bitLength as CashAddressAvailableSizesInBits] as
    | CashAddressAvailableSizes
    | undefined) !== undefined;
/**
 * Encode a hash as a CashAddress.
 *
 * Note, this method does not enforce error handling via the type system. The
 * returned string may be a `CashAddressEncodingError.unsupportedHashLength`
 * if `hash` is not a valid length. Check the result if the input is potentially
 * malformed.
 *
 * For other address standards which closely follow the CashAddress
 * specification (but have alternative version byte requirements), use
 * `encodeCashAddressFormat`.
 *
 * @param prefix - a valid prefix indicating the network for which to encode the
 * address (usually a `CashAddressNetworkPrefix`) – must be only lowercase
 * letters
 * @param type - the `CashAddressType` to encode in the version byte – usually a
 * `CashAddressType`
 * @param hash - the hash to encode (for P2PKH, the public key hash; for P2SH,
 * the redeeming bytecode hash)
 */
export const encodeCashAddress = <
  Prefix extends string = CashAddressNetworkPrefix,
  Type extends CashAddressAvailableTypes = CashAddressType
>(
  prefix: Prefix,
  type: Type,
  hash: Uint8Array
) => {
  const bitLength = hash.length * base256WordLength;
  if (!isValidBitLength(bitLength)) {
    return CashAddressEncodingError.unsupportedHashLength;
  }
  return encodeCashAddressFormat(
    prefix,
    encodeCashAddressVersionByte(type, bitLength),
    hash
  );
};

export enum CashAddressDecodingError {
  improperPadding = 'CashAddress decoding error: the payload is improperly padded.',
  invalidCharacters = 'CashAddress decoding error: the payload contains non-bech32 characters.',
  invalidChecksum = 'CashAddress decoding error: please review the address for errors.',
  invalidFormat = 'CashAddress decoding error: CashAddresses should be of the form "prefix:payload".',
  mismatchedHashLength = 'CashAddress decoding error: mismatched hash length for specified address version.',
  reservedByte = 'CashAddress decoding error: unknown CashAddress version, reserved byte set.',
}

/**
 * Decode and validate a string using the CashAddress format. This is more
 * lenient than `decodeCashAddress`, which also validates the contents of the
 * version byte.
 *
 * Note, this method requires `address` to include a network prefix. To
 * decode a string with an unknown prefix, try
 * `decodeCashAddressFormatWithoutPrefix`.
 *
 * @param address - the CashAddress-like string to decode
 */
// eslint-disable-next-line complexity
export const decodeCashAddressFormat = (address: string) => {
  const parts = address.toLowerCase().split(':');
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  if (parts.length !== 2 || parts[0] === '' || parts[1] === '') {
    return CashAddressDecodingError.invalidFormat;
  }
  const [prefix, payload] = parts;
  if (!isBech32CharacterSet(payload)) {
    return CashAddressDecodingError.invalidCharacters;
  }
  const decodedPayload = decodeBech32(payload);

  const polynomial = [
    ...maskCashAddressPrefix(prefix),
    payloadSeparator,
    ...decodedPayload,
  ];
  if (cashAddressPolynomialModulo(polynomial) !== 0) {
    return CashAddressDecodingError.invalidChecksum;
  }

  const checksum40BitPlaceholderLength = 8;
  const payloadContents = regroupBits({
    allowPadding: false,
    bin: decodedPayload.slice(0, -checksum40BitPlaceholderLength),
    resultWordLength: base256WordLength,
    sourceWordLength: base32WordLength,
  });

  if (typeof payloadContents === 'string') {
    return CashAddressDecodingError.improperPadding;
  }

  const [version, ...hashContents] = payloadContents;
  const hash = Uint8Array.from(hashContents);

  return { hash, prefix, version };
};

/**
 * Decode and validate a CashAddress, strictly checking the version byte
 * according to the CashAddress specification. This is important for error
 * detection in CashAddresses.
 *
 * For other address-like standards which closely follow the CashAddress
 * specification (but have alternative version byte requirements), use
 * `decodeCashAddressFormat`.
 *
 * Note, this method requires that CashAddresses include a network prefix. To
 * decode an address with an unknown prefix, try
 * `decodeCashAddressFormatWithoutPrefix`.
 *
 * @param address - the CashAddress to decode
 */
export const decodeCashAddress = (address: string) => {
  const decoded = decodeCashAddressFormat(address);
  if (typeof decoded === 'string') {
    return decoded;
  }
  const info = decodeCashAddressVersionByte(decoded.version);

  if (info === CashAddressVersionByteDecodingError.reservedBitSet) {
    return CashAddressDecodingError.reservedByte;
  }

  if (decoded.hash.length * base256WordLength !== info.bitLength) {
    return CashAddressDecodingError.mismatchedHashLength;
  }

  return {
    hash: decoded.hash,
    prefix: decoded.prefix,
    type: info.type,
  };
};

/**
 * Attempt to decode and validate a CashAddress against a list of possible
 * prefixes. If the correct prefix is known, use `decodeCashAddress`.
 *
 * @param address - the CashAddress to decode
 * @param possiblePrefixes - the network prefixes to try
 */
// decodeCashAddressWithoutPrefix
export const decodeCashAddressFormatWithoutPrefix = (
  address: string,
  possiblePrefixes: readonly string[] = [
    CashAddressNetworkPrefix.mainnet,
    CashAddressNetworkPrefix.testnet,
    CashAddressNetworkPrefix.regtest,
  ]
) => {
  // eslint-disable-next-line functional/no-loop-statement
  for (const prefix of possiblePrefixes) {
    const attempt = decodeCashAddressFormat(`${prefix}:${address}`);
    if (attempt !== CashAddressDecodingError.invalidChecksum) {
      return attempt;
    }
  }
  return CashAddressDecodingError.invalidChecksum;
};

const asciiLowerCaseStart = 96;

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
 * @param polynomial - an array of 5-bit integers representing the terms of a
 * CashAddress polynomial
 */
export const cashAddressPolynomialToCashAddress = (
  polynomial: readonly number[]
) => {
  const separatorPosition = polynomial.indexOf(0);
  const prefix = polynomial
    .slice(0, separatorPosition)
    .map((integer) => String.fromCharCode(asciiLowerCaseStart + integer))
    .join('');
  const contents = encodeBech32(polynomial.slice(separatorPosition + 1));
  return `${prefix}:${contents}`;
};

export enum CashAddressCorrectionError {
  tooManyErrors = 'This address has more than 2 errors and cannot be corrected.',
}

const finiteFieldOrder = 32;

/**
 * Attempt to correct up to 2 errors in a CashAddress. The CashAddress must be
 * properly formed (include a prefix and only contain Bech32 characters).
 *
 * ## **Improper use of this method carries the risk of lost funds.**
 *
 * It is strongly advised that this method only be used under explicit user
 * control. With enough errors, this method is likely to find a plausible
 * correction for any address (but for which no private key exists). This is
 * effectively equivalent to burning the funds.
 *
 * Only 2 substitution errors can be corrected (or a single swap) – deletions
 * and insertions (errors which shift many other characters and change the
 * length of the payload) can never be safely corrected and will produce an
 * error.
 *
 * Errors can be corrected in both the prefix and the payload, but attempting to
 * correct errors in the prefix prior to this method can improve results, e.g.
 * for `bchtest:qq2azmyyv6dtgczexyalqar70q036yund53jvfde0x`, the string
 * `bchtest:qq2azmyyv6dtgczexyalqar70q036yund53jvfdecc` can be corrected, while
 * `typo:qq2azmyyv6dtgczexyalqar70q036yund53jvfdecc` can not.
 *
 * @privateRemarks
 * Derived from: https://github.com/deadalnix/cashaddressed
 *
 * @param address - the CashAddress on which to attempt error correction
 */
// eslint-disable-next-line complexity
export const attemptCashAddressFormatErrorCorrection = (address: string) => {
  const parts = address.toLowerCase().split(':');
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  if (parts.length !== 2 || parts[0] === '' || parts[1] === '') {
    return CashAddressDecodingError.invalidFormat;
  }
  const [prefix, payload] = parts;
  if (!isBech32CharacterSet(payload)) {
    return CashAddressDecodingError.invalidCharacters;
  }
  const decodedPayload = decodeBech32(payload);

  const polynomial = [...maskCashAddressPrefix(prefix), 0, ...decodedPayload];

  const originalChecksum = cashAddressPolynomialModulo(polynomial);
  if (originalChecksum === 0) {
    return {
      address: cashAddressPolynomialToCashAddress(polynomial),
      corrections: [],
    };
  }

  const syndromes: { [index: string]: number } = {};
  // eslint-disable-next-line functional/no-let, functional/no-loop-statement, no-plusplus
  for (let term = 0; term < polynomial.length; term++) {
    // eslint-disable-next-line functional/no-let, functional/no-loop-statement, no-plusplus
    for (let errorVector = 1; errorVector < finiteFieldOrder; errorVector++) {
      // eslint-disable-next-line functional/no-expression-statement, no-bitwise, functional/immutable-data
      polynomial[term] ^= errorVector;

      const correct = cashAddressPolynomialModulo(polynomial);
      if (correct === 0) {
        return {
          address: cashAddressPolynomialToCashAddress(polynomial),
          corrections: [term],
        };
      }
      // eslint-disable-next-line no-bitwise
      const s0 = (BigInt(correct) ^ BigInt(originalChecksum)).toString();
      // eslint-disable-next-line functional/no-expression-statement, functional/immutable-data
      syndromes[s0] = term * finiteFieldOrder + errorVector;

      // eslint-disable-next-line functional/no-expression-statement, no-bitwise, functional/immutable-data
      polynomial[term] ^= errorVector;
    }
  }

  // eslint-disable-next-line functional/no-loop-statement
  for (const [s0, pe] of Object.entries(syndromes)) {
    // eslint-disable-next-line no-bitwise
    const s1Location = (BigInt(s0) ^ BigInt(originalChecksum)).toString();
    const s1 = syndromes[s1Location] as number | undefined;
    if (s1 !== undefined) {
      const correctionIndex1 = Math.trunc(pe / finiteFieldOrder);
      const correctionIndex2 = Math.trunc(s1 / finiteFieldOrder);
      // eslint-disable-next-line functional/no-expression-statement, no-bitwise, functional/immutable-data
      polynomial[correctionIndex1] ^= pe % finiteFieldOrder;
      // eslint-disable-next-line functional/no-expression-statement, no-bitwise, functional/immutable-data
      polynomial[correctionIndex2] ^= s1 % finiteFieldOrder;
      return {
        address: cashAddressPolynomialToCashAddress(polynomial),
        corrections: [correctionIndex1, correctionIndex2].sort((a, b) => a - b),
      };
    }
  }

  return CashAddressCorrectionError.tooManyErrors;
};
