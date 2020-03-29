import { Sha256 } from '../crypto/crypto';
import {
  base58ToBin,
  BaseConversionError,
  binToBase58,
  flattenBinArray,
} from '../format/format';

/**
 * Base58 version byte values for common Base58Address format versions.
 */
export enum Base58AddressFormatVersion {
  /**
   * A Pay to Public Key Hash (P2PKH) address – base58 encodes to a leading `1`.
   *
   * Hex: `0x00`
   */
  p2pkh = 0,
  /**
   * A Pay to Script Hash (P2SH) address – base58 encodes to a leading `3`.
   *
   * Hex: `0x05`
   */
  p2sh = 5,
  /**
   * A private key in Wallet Import Format. For private keys used with
   * uncompressed public keys, the payload is 32 bytes and causes the version
   * to be encoded as a `5`. For private keys used with compressed public keys,
   * a final `0x01` byte is appended to the private key, increasing the payload
   * to 33 bytes, and causing the version to be encoded as a `K` or `L`.
   *
   * Hex: `0x80`
   */
  wif = 128,
  /**
   * A testnet Pay to Public Key Hash (P2PKH) address – base58 encodes to a
   * leading `m` or `n`.
   *
   * Hex: `0x6f`
   */
  p2pkhTestnet = 111,
  /**
   * A testnet Pay to Script Hash (P2SH) address – base58 encodes to a leading
   * `2`.
   *
   * Hex: `0xc4`
   */
  p2shTestnet = 196,
  /**
   * A private key in Wallet Import Format intended for testnet use. For private
   * keys used with uncompressed public keys, the payload is 32 bytes and causes
   * the version to be encoded as a `9`. For private keys used with compressed
   * public keys, a final `0x01` byte is appended to the private key, increasing
   * the payload to 33 bytes, and causing the version to be encoded as a `c`.
   *
   * Hex: `0xef`
   */
  wifTestnet = 239,
  /**
   * A Pay to Public Key Hash (P2PKH) address intended for use on the Bitcoin
   * Cash network – base58 encodes to a leading `C`. This version was
   * temporarily used by the Copay project before the CashAddress format was
   * standardized.
   *
   * Hex: `0x1c`
   */
  p2pkhCopayBCH = 28,
  /**
   * A Pay to Script Hash (P2SH) address intended for use on the Bitcoin
   * Cash network – base58 encodes to a leading `H`. This version was
   * temporarily used by the Copay project before the CashAddress format was
   * standardized.
   *
   * Hex: `0x28`
   */
  p2shCopayBCH = 40,
}

/**
 * The available networks for common Base58Address versions.
 */
export type Base58AddressNetwork = 'mainnet' | 'testnet' | 'copay-bch';

/**
 * Encode a payload using the Base58Address format, the original address format
 * used by the Satoshi implementation.
 *
 * Note, this method does not enforce error handling via the type system. The
 * returned string will not be a valid Base58Address if `hash` is not exactly 20
 * bytes. If needed, validate the length of `hash` before calling this method.
 *
 * @remarks
 * A Base58Address includes a 1-byte prefix to indicate the address version, a
 * variable-length payload, and a 4-byte checksum:
 *
 * `[version: 1 byte] [payload: variable length] [checksum: 4 bytes]`
 *
 * The checksum is the first 4 bytes of the double-SHA256 hash of the version
 * byte followed by the payload.
 *
 * @param sha256 - an implementation of sha256 (a universal implementation is
 * available via `instantiateSha256`)
 * @param version - the address version byte (see `Base58Version`)
 * @param payload - the Uint8Array payload to encode
 */
export const encodeBase58AddressFormat = <
  VersionType extends number = Base58AddressFormatVersion
>(
  sha256: { hash: Sha256['hash'] },
  version: VersionType,
  payload: Uint8Array
) => {
  const checksumBytes = 4;
  const content = Uint8Array.from([version, ...payload]);
  const checksum = sha256.hash(sha256.hash(content)).slice(0, checksumBytes);
  const bin = flattenBinArray([content, checksum]);
  return binToBase58(bin);
};

/**
 * Encode a hash as a Base58Address.
 *
 * Note, this method does not enforce error handling via the type system. The
 * returned string will not be a valid Base58Address if `hash` is not exactly 20
 * bytes. If needed, validate the length of `hash` before calling this method.
 *
 * For other standards which use the Base58Address format but have other version
 * or length requirements, use `encodeCashAddressFormat`.
 *
 * @param sha256 - an implementation of sha256 (a universal implementation is
 * available via `instantiateSha256`)
 * @param type - the type of address to encode: `p2pkh`, `p2sh`,
 * `p2pkh-testnet`, or `p2sh-testnet`
 * @param hash - the 20-byte hash to encode
 * (`RIPEMD160(SHA256(public key or bytecode))`)
 */
export const encodeBase58Address = (
  sha256: { hash: Sha256['hash'] },
  type:
    | 'p2pkh'
    | 'p2sh'
    | 'p2pkh-testnet'
    | 'p2sh-testnet'
    | 'p2pkh-copay-bch'
    | 'p2sh-copay-bch',
  payload: Uint8Array
) =>
  encodeBase58AddressFormat(
    sha256,
    {
      p2pkh: Base58AddressFormatVersion.p2pkh,
      'p2pkh-copay-bch': Base58AddressFormatVersion.p2pkhCopayBCH,
      'p2pkh-testnet': Base58AddressFormatVersion.p2pkhTestnet,
      p2sh: Base58AddressFormatVersion.p2sh,
      'p2sh-copay-bch': Base58AddressFormatVersion.p2shCopayBCH,
      'p2sh-testnet': Base58AddressFormatVersion.p2shTestnet,
    }[type],
    payload
  );

export enum Base58AddressError {
  unknownCharacter = 'Base58Address error: address may only contain valid base58 characters.',
  tooShort = 'Base58Address error: address is too short to be valid.',
  invalidChecksum = 'Base58Address error: address has an invalid checksum.',
  unknownAddressVersion = 'Base58Address error: address uses an unknown address version.',
  incorrectLength = 'Base58Address error: the encoded payload is not the correct length (20 bytes).',
}

/**
 * Attempt to decode a Base58Address-formatted string. This is more lenient than
 * `decodeCashAddress`, which also validates the address version.
 *
 * Returns the contents of the address or an error message as a string.
 *
 * @param sha256 - an implementation of sha256 (a universal implementation is
 * available via `instantiateSha256`)
 * @param address - the string to decode as a base58 address
 */
export const decodeBase58AddressFormat = (
  sha256: { hash: Sha256['hash'] },
  address: string
) => {
  const checksumBytes = 4;
  const bin = base58ToBin(address);
  if (bin === BaseConversionError.unknownCharacter) {
    return Base58AddressError.unknownCharacter;
  }
  const minimumBase58AddressLength = 5;
  if (bin.length < minimumBase58AddressLength) {
    return Base58AddressError.tooShort;
  }

  const content = bin.slice(0, -checksumBytes);
  const checksum = bin.slice(-checksumBytes);

  const expectedChecksum = sha256
    .hash(sha256.hash(content))
    .slice(0, checksumBytes);

  if (!checksum.every((value, i) => value === expectedChecksum[i])) {
    return Base58AddressError.invalidChecksum;
  }

  return {
    payload: content.slice(1),
    version: content[0],
  };
};

/**
 * Decode and validate a Base58Address, strictly checking the version and
 * payload length.
 *
 * For other address-like standards which closely follow the Base58Address
 * format (but have alternative version byte requirements), use
 * `decodeBase58AddressFormat`.
 *
 * @remarks
 * Because the Wallet Import Format (WIF) private key serialization format uses
 * the Base58Address format, some libraries allow WIF key decoding via the same
 * method as base58 address decoding. This method strictly accepts only
 * Base58Address types, but WIF keys can be decoded with `decodePrivateKeyWif`.
 *
 * @param sha256 - an implementation of sha256 (a universal implementation is
 * available via `instantiateSha256`)
 * @param address - the string to decode as a base58 address
 */
export const decodeBase58Address = (
  sha256: { hash: Sha256['hash'] },
  address: string
) => {
  const decoded = decodeBase58AddressFormat(sha256, address);
  if (typeof decoded === 'string') return decoded;

  if (
    ![
      Base58AddressFormatVersion.p2pkh,
      Base58AddressFormatVersion.p2sh,
      Base58AddressFormatVersion.p2pkhTestnet,
      Base58AddressFormatVersion.p2shTestnet,
      Base58AddressFormatVersion.p2pkhCopayBCH,
      Base58AddressFormatVersion.p2shCopayBCH,
    ].includes(decoded.version)
  ) {
    return Base58AddressError.unknownAddressVersion;
  }

  const hash160Length = 20;
  if (decoded.payload.length !== hash160Length) {
    return Base58AddressError.incorrectLength;
  }

  return decoded;
};
