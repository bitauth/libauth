import { Sha256 } from '../crypto/crypto';
import { OpcodesCommon } from '../vm/instruction-sets/common/opcodes';

import {
  Base58AddressFormatVersion,
  Base58AddressNetwork,
  decodeBase58Address,
  encodeBase58AddressFormat,
} from './base58-address';
import {
  CashAddressNetworkPrefix,
  CashAddressType,
  decodeCashAddress,
  encodeCashAddress,
} from './cash-address';

/**
 * The most common address types used on bitcoin and bitcoin-like networks. Each
 * address type represents a commonly used locking bytecode pattern.
 *
 * @remarks
 * Addresses are strings which encode information about the network and
 * `lockingBytecode` to which a transaction output can pay.
 *
 * Several address formats exist – `Base58Address` was the format used by the
 * original satoshi client, and is still in use on several active chains (see
 * `encodeBase58Address`). On Bitcoin Cash, the `CashAddress` standard is most
 * common (See `encodeCashAddress`).
 */
export enum AddressType {
  /**
   * Pay to Public Key (P2PK). This address type is uncommon, and primarily
   * occurs in early blocks because the original satoshi implementation mined
   * rewards to P2PK addresses.
   *
   * There are no standardized address formats for representing a P2PK address.
   * Instead, most applications use the `AddressType.p2pkh` format.
   */
  p2pk = 'P2PK',
  /**
   * Pay to Public Key Hash (P2PKH). The most common address type. P2PKH
   * addresses lock funds using a single private key.
   */
  p2pkh = 'P2PKH',
  /**
   * Pay to Script Hash (P2SH). An address type which locks funds to the hash of
   * a script provided in the spending transaction. See BIP13 for details.
   */
  p2sh = 'P2SH',
  /**
   * This `AddressType` represents an address using an unknown or uncommon
   * locking bytecode pattern for which no standardized address formats exist.
   */
  unknown = 'unknown',
}

/**
 * An object representing the contents of an address. This can be used to encode
 * an address or its locking bytecode.
 *
 * See `lockingBytecodeToAddressContents` for details.
 */
export interface AddressContents {
  type: AddressType;
  payload: Uint8Array;
}

/**
 * Attempt to match a lockingBytecode to a standard address type for use in
 * address encoding. (See `AddressType` for details.)
 *
 * For a locking bytecode matching the Pay to Public Key Hash (P2PKH) pattern,
 * the returned `type` is `AddressType.p2pkh` and `payload` is the `HASH160` of
 * the public key.
 *
 * For a locking bytecode matching the Pay to Script Hash (P2SH) pattern, the
 * returned `type` is `AddressType.p2sh` and `payload` is the `HASH160` of the
 * redeeming bytecode, A.K.A. "redeem script hash".
 *
 * For a locking bytecode matching the Pay to Public Key (P2PK) pattern, the
 * returned `type` is `AddressType.p2pk` and `payload` is the full public key.
 *
 * Any other locking bytecode will return a `type` of `AddressType.unknown` and
 * a payload of the unmodified `bytecode`.
 *
 * @param bytecode - the locking bytecode to match
 */
// eslint-disable-next-line complexity
export const lockingBytecodeToAddressContents = (
  bytecode: Uint8Array
): AddressContents => {
  const p2pkhLength = 25;
  if (
    bytecode.length === p2pkhLength &&
    bytecode[0] === OpcodesCommon.OP_DUP &&
    bytecode[1] === OpcodesCommon.OP_HASH160 &&
    bytecode[2] === OpcodesCommon.OP_PUSHBYTES_20 &&
    bytecode[23] === OpcodesCommon.OP_EQUALVERIFY &&
    bytecode[24] === OpcodesCommon.OP_CHECKSIG
  ) {
    const start = 3;
    const end = 23;
    return { payload: bytecode.slice(start, end), type: AddressType.p2pkh };
  }

  const p2shLength = 23;
  if (
    bytecode.length === p2shLength &&
    bytecode[0] === OpcodesCommon.OP_HASH160 &&
    bytecode[1] === OpcodesCommon.OP_PUSHBYTES_20 &&
    bytecode[22] === OpcodesCommon.OP_EQUAL
  ) {
    const start = 2;
    const end = 22;
    return { payload: bytecode.slice(start, end), type: AddressType.p2sh };
  }

  const p2pkUncompressedLength = 67;
  if (
    bytecode.length === p2pkUncompressedLength &&
    bytecode[0] === OpcodesCommon.OP_PUSHBYTES_65 &&
    bytecode[66] === OpcodesCommon.OP_CHECKSIG
  ) {
    const start = 1;
    const end = 66;
    return { payload: bytecode.slice(start, end), type: AddressType.p2pk };
  }

  const p2pkCompressedLength = 35;
  if (
    bytecode.length === p2pkCompressedLength &&
    bytecode[0] === OpcodesCommon.OP_PUSHBYTES_33 &&
    bytecode[34] === OpcodesCommon.OP_CHECKSIG
  ) {
    const start = 1;
    const end = 34;
    return { payload: bytecode.slice(start, end), type: AddressType.p2pk };
  }

  return {
    payload: bytecode.slice(),
    type: AddressType.unknown,
  };
};

/**
 * Get the locking bytecode for a valid `AddressContents` object. See
 * `lockingBytecodeToAddressContents` for details.
 *
 * For `AddressContents` of `type` `AddressType.unknown`, this method returns
 * the `payload` without modification.
 *
 * @param addressContents - the `AddressContents` to encode
 */
export const addressContentsToLockingBytecode = (
  addressContents: AddressContents
) => {
  if (addressContents.type === AddressType.p2pkh) {
    return Uint8Array.from([
      OpcodesCommon.OP_DUP,
      OpcodesCommon.OP_HASH160,
      OpcodesCommon.OP_PUSHBYTES_20,
      ...addressContents.payload,
      OpcodesCommon.OP_EQUALVERIFY,
      OpcodesCommon.OP_CHECKSIG,
    ]);
  }
  if (addressContents.type === AddressType.p2sh) {
    return Uint8Array.from([
      OpcodesCommon.OP_HASH160,
      OpcodesCommon.OP_PUSHBYTES_20,
      ...addressContents.payload,
      OpcodesCommon.OP_EQUAL,
    ]);
  }
  if (addressContents.type === AddressType.p2pk) {
    const compressedPublicKeyLength = 33;
    return addressContents.payload.length === compressedPublicKeyLength
      ? Uint8Array.from([
          OpcodesCommon.OP_PUSHBYTES_33,
          ...addressContents.payload,
          OpcodesCommon.OP_CHECKSIG,
        ])
      : Uint8Array.from([
          OpcodesCommon.OP_PUSHBYTES_65,
          ...addressContents.payload,
          OpcodesCommon.OP_CHECKSIG,
        ]);
  }
  return addressContents.payload;
};

/**
 * Encode a locking bytecode as a CashAddress given a network prefix.
 *
 * If `bytecode` matches either the P2PKH or P2SH pattern, it is encoded using
 * the proper address type and returned as a valid CashAddress (string).
 *
 * If `bytecode` cannot be encoded as an address (i.e. because the pattern is
 * not standard), the resulting `AddressContents` is returned.
 *
 * @param bytecode - the locking bytecode to encode
 * @param prefix - the network prefix to use, e.g. `bitcoincash`, `bchtest`, or
 * `bchreg`
 */
export const lockingBytecodeToCashAddress = <
  Prefix extends string = CashAddressNetworkPrefix
>(
  bytecode: Uint8Array,
  prefix: Prefix
) => {
  const contents = lockingBytecodeToAddressContents(bytecode);
  if (contents.type === AddressType.p2pkh) {
    return encodeCashAddress(prefix, CashAddressType.P2PKH, contents.payload);
  }
  if (contents.type === AddressType.p2sh) {
    return encodeCashAddress(prefix, CashAddressType.P2SH, contents.payload);
  }

  return contents;
};

export enum LockingBytecodeEncodingError {
  unknownCashAddressType = 'This CashAddress uses an unknown address type.',
}

/**
 * Convert a CashAddress to its respective locking bytecode.
 *
 * This method returns the locking bytecode and network prefix. If an error
 * occurs, an error message is returned as a string.
 *
 * @param address - the CashAddress to convert
 */
export const cashAddressToLockingBytecode = (address: string) => {
  const decoded = decodeCashAddress(address);
  if (typeof decoded === 'string') return decoded;

  if (decoded.type === CashAddressType.P2PKH) {
    return {
      bytecode: addressContentsToLockingBytecode({
        payload: decoded.hash,
        type: AddressType.p2pkh,
      }),
      prefix: decoded.prefix,
    };
  }

  if (decoded.type === CashAddressType.P2SH) {
    return {
      bytecode: addressContentsToLockingBytecode({
        payload: decoded.hash,
        type: AddressType.p2sh,
      }),
      prefix: decoded.prefix,
    };
  }

  return LockingBytecodeEncodingError.unknownCashAddressType;
};

/**
 * Encode a locking bytecode as a Base58Address for a given network.
 *
 * If `bytecode` matches either the P2PKH or P2SH pattern, it is encoded using
 * the proper address type and returned as a valid Base58Address (string).
 *
 * If `bytecode` cannot be encoded as an address (i.e. because the pattern is
 * not standard), the resulting `AddressContents` is returned.
 *
 * @param sha256 - an implementation of sha256 (a universal implementation is
 * available via `instantiateSha256`)
 * @param bytecode - the locking bytecode to encode
 * @param network - the network for which to encode the address (`mainnet` or
 * `testnet`)
 */
export const lockingBytecodeToBase58Address = (
  sha256: { hash: Sha256['hash'] },
  bytecode: Uint8Array,
  network: Base58AddressNetwork
) => {
  const contents = lockingBytecodeToAddressContents(bytecode);

  if (contents.type === AddressType.p2pkh) {
    return encodeBase58AddressFormat(
      sha256,
      {
        'copay-bch': Base58AddressFormatVersion.p2pkhCopayBCH,
        mainnet: Base58AddressFormatVersion.p2pkh,
        testnet: Base58AddressFormatVersion.p2pkhTestnet,
      }[network],
      contents.payload
    );
  }
  if (contents.type === AddressType.p2sh) {
    return encodeBase58AddressFormat(
      sha256,
      {
        'copay-bch': Base58AddressFormatVersion.p2shCopayBCH,
        mainnet: Base58AddressFormatVersion.p2sh,
        testnet: Base58AddressFormatVersion.p2shTestnet,
      }[network],
      contents.payload
    );
  }

  return contents;
};

/**
 * Convert a Base58Address to its respective locking bytecode.
 *
 * This method returns the locking bytecode and network version. If an error
 * occurs, an error message is returned as a string.
 *
 * @param address - the CashAddress to convert
 */
export const base58AddressToLockingBytecode = (
  sha256: { hash: Sha256['hash'] },
  address: string
) => {
  const decoded = decodeBase58Address(sha256, address);
  if (typeof decoded === 'string') return decoded;

  return {
    bytecode: addressContentsToLockingBytecode({
      payload: decoded.payload,
      type: [
        Base58AddressFormatVersion.p2pkh,
        Base58AddressFormatVersion.p2pkhCopayBCH,
        Base58AddressFormatVersion.p2pkhTestnet,
      ].includes(decoded.version)
        ? AddressType.p2pkh
        : AddressType.p2sh,
    }),
    version: decoded.version,
  };
};
