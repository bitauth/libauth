import {
  Base58AddressFormatVersion,
  decodeBase58AddressFormat,
  encodeBase58AddressFormat,
} from '../address/address.js';
import { sha256 as internalSha256 } from '../crypto/crypto.js';
import type { Sha256 } from '../lib.js';

export enum WalletImportFormatError {
  incorrectLength = 'The WIF private key payload is not the correct length.',
}

/**
 * The network and address format in which a WIF-encoded private key is expected
 * to be used.
 *
 * WIF-encoding is generally used to encode private keys for Pay to Public
 * Key (P2PKH) addresses – each WIF-encoded private key specifies the
 * compression of the public key to use in the P2PKH address:
 *
 * - The values `mainnet` and `testnet` indicate that the address should use the
 * compressed form of the derived public key (33 bytes, beginning with `0x02` or
 * `0x03`) on the respective network.
 * - The less common `mainnet-uncompressed` and `testnet-uncompressed` values
 * indicate that the address should use the uncompressed form of the public key
 * (65 bytes beginning with `0x04`) on the specified network.
 */
export type WalletImportFormatType =
  | 'mainnet'
  | 'mainnetUncompressed'
  | 'testnet'
  | 'testnetUncompressed';

/**
 * Encode a private key using Wallet Import Format (WIF).
 *
 * WIF encodes the 32-byte private key, a 4-byte checksum, and a `type`
 * indicating the intended usage for the private key. See
 * {@link WalletImportFormatType} for details.
 *
 * @remarks
 * WIF-encoding uses the Base58Address format with version
 * {@link Base58AddressFormatVersion.wif} (`128`/`0x80`) or
 * {@link Base58AddressFormatVersion.wifTestnet} (`239`/`0xef`), respectively.
 *
 * To indicate that the private key is intended for use in a P2PKH address using
 * the compressed form of its derived public key, a `0x01` is appended to the
 * payload prior to encoding. For the uncompressed construction, the extra byte
 * is omitted.
 *
 * @param privateKey - a 32-byte Secp256k1 ECDSA private key
 * @param type - the intended usage of the private key (e.g. `mainnet` or
 * `testnet`)
 * @param sha256 - an implementation of sha256
 */
export const encodePrivateKeyWif = (
  privateKey: Uint8Array,
  type: WalletImportFormatType,
  sha256: { hash: Sha256['hash'] } = internalSha256,
) => {
  const compressedByte = 0x01;
  const mainnet = type === 'mainnet' || type === 'mainnetUncompressed';
  const compressed = type === 'mainnet' || type === 'testnet';
  const payload = compressed
    ? Uint8Array.from([...privateKey, compressedByte])
    : privateKey;
  return encodeBase58AddressFormat(
    mainnet
      ? Base58AddressFormatVersion.wif
      : Base58AddressFormatVersion.wifTestnet,
    payload,
    sha256,
  );
};

/**
 * Decode a private key using Wallet Import Format (WIF). See
 * {@link encodePrivateKeyWif} for details.
 *
 * @param wifKey - the private key to decode (in Wallet Import Format)
 * @param sha256 - an implementation of sha256
 */
// eslint-disable-next-line complexity
export const decodePrivateKeyWif = (
  wifKey: string,
  sha256: { hash: Sha256['hash'] } = internalSha256,
) => {
  const compressedPayloadLength = 33;
  const decoded = decodeBase58AddressFormat(wifKey, sha256);
  if (typeof decoded === 'string') return decoded;
  const mainnet = decoded.version === Base58AddressFormatVersion.wif;
  const compressed = decoded.payload.length === compressedPayloadLength;
  const privateKey = compressed
    ? decoded.payload.slice(0, -1)
    : decoded.payload;

  const type: WalletImportFormatType = mainnet
    ? compressed
      ? 'mainnet'
      : 'mainnetUncompressed'
    : compressed
      ? 'testnet'
      : 'testnetUncompressed';

  return { privateKey, type };
};
