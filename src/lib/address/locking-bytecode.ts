import { sha256 as internalSha256 } from '../crypto/crypto.js';
import { formatError, unknownValue } from '../format/format.js';
import type {
  Base58AddressNetwork,
  CashAddressNetworkPrefix,
  Sha256,
} from '../lib.js';

import {
  Base58AddressFormatVersion,
  decodeBase58Address,
  encodeBase58AddressFormat,
} from './base58-address.js';
import {
  CashAddressEncodingError,
  CashAddressType,
  decodeCashAddress,
  encodeCashAddress,
} from './cash-address.js';

/**
 * The most common address types used on Bitcoin Cash and similar networks. Each
 * address type represents a commonly used locking bytecode pattern.
 *
 * @remarks
 * Addresses are strings that encode information about the network and
 * `lockingBytecode` to which a transaction output can pay.
 *
 * Several address formats exist – `Base58Address` was the format used by the
 * original satoshi client, and is still in use on several active chains (see
 * {@link encodeBase58Address}). On Bitcoin Cash, the `CashAddress` standard is
 * most common (See {@link encodeCashAddress}).
 */
export enum LockingBytecodeType {
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
   * 20-byte Pay to Script Hash (P2SH20). An address type that locks funds to
   * the 20-byte hash of a script provided in the spending transaction. See
   * BIPs 13 and 16 for details.
   */
  p2sh20 = 'P2SH20',
  /**
   * 32-byte Pay to Script Hash (P2SH32). An address type that locks funds to
   * the 32-byte hash of a script provided in the spending transaction.
   */
  p2sh32 = 'P2SH32',
}

/**
 * An object representing the contents of an address of a known address type.
 * This can be used to encode an address or its locking bytecode.
 */
export type KnownAddressTypeContents = {
  type: `${LockingBytecodeType}`;
  payload: Uint8Array;
};

export type UnknownAddressTypeContents = {
  /**
   * This address type represents an address using an unknown or uncommon
   * locking bytecode pattern for which no standardized address formats exist.
   */
  type: 'unknown';
  payload: Uint8Array;
};

/**
 * An object representing the contents of an address. This can be used to encode
 * an address or its locking bytecode.
 *
 * See {@link lockingBytecodeToAddressContents} for details.
 */
export type AddressContents =
  | KnownAddressTypeContents
  | UnknownAddressTypeContents;

const enum Opcodes {
  OP_0 = 0x00,
  OP_PUSHBYTES_20 = 0x14,
  OP_PUSHBYTES_32 = 0x20,
  OP_PUSHBYTES_33 = 0x21,
  OP_PUSHBYTES_65 = 0x41,
  OP_DUP = 0x76,
  OP_EQUAL = 0x87,
  OP_EQUALVERIFY = 0x88,
  OP_SHA256 = 0xa8,
  OP_HASH160 = 0xa9,
  OP_HASH256 = 0xaa,
  OP_CHECKSIG = 0xac,
}

const enum PayToPublicKeyUncompressed {
  length = 67,
  lastElement = 66,
}

export const isPayToPublicKeyUncompressed = (lockingBytecode: Uint8Array) =>
  lockingBytecode.length === PayToPublicKeyUncompressed.length &&
  lockingBytecode[0] === Opcodes.OP_PUSHBYTES_65 &&
  lockingBytecode[PayToPublicKeyUncompressed.lastElement] ===
    Opcodes.OP_CHECKSIG;

const enum PayToPublicKeyCompressed {
  length = 35,
  lastElement = 34,
}

export const isPayToPublicKeyCompressed = (lockingBytecode: Uint8Array) =>
  lockingBytecode.length === PayToPublicKeyCompressed.length &&
  lockingBytecode[0] === Opcodes.OP_PUSHBYTES_33 &&
  lockingBytecode[PayToPublicKeyCompressed.lastElement] === Opcodes.OP_CHECKSIG;

export const isPayToPublicKey = (lockingBytecode: Uint8Array) =>
  isPayToPublicKeyCompressed(lockingBytecode) ||
  isPayToPublicKeyUncompressed(lockingBytecode);

const enum PayToPublicKeyHash {
  length = 25,
  lastElement = 24,
}

// eslint-disable-next-line complexity
export const isPayToPublicKeyHash = (lockingBytecode: Uint8Array) =>
  lockingBytecode.length === PayToPublicKeyHash.length &&
  lockingBytecode[0] === Opcodes.OP_DUP &&
  lockingBytecode[1] === Opcodes.OP_HASH160 &&
  lockingBytecode[2] === Opcodes.OP_PUSHBYTES_20 &&
  lockingBytecode[23] === Opcodes.OP_EQUALVERIFY &&
  lockingBytecode[24] === Opcodes.OP_CHECKSIG;

const enum PayToScriptHash20 {
  length = 23,
  lastElement = 22,
}

export const isPayToScriptHash20 = (lockingBytecode: Uint8Array) =>
  lockingBytecode.length === PayToScriptHash20.length &&
  lockingBytecode[0] === Opcodes.OP_HASH160 &&
  lockingBytecode[1] === Opcodes.OP_PUSHBYTES_20 &&
  lockingBytecode[PayToScriptHash20.lastElement] === Opcodes.OP_EQUAL;

const enum PayToScriptHash32 {
  length = 35,
  lastElement = 34,
}

export const isPayToScriptHash32 = (lockingBytecode: Uint8Array) =>
  lockingBytecode.length === PayToScriptHash32.length &&
  lockingBytecode[0] === Opcodes.OP_HASH256 &&
  lockingBytecode[1] === Opcodes.OP_PUSHBYTES_32 &&
  lockingBytecode[PayToScriptHash32.lastElement] === Opcodes.OP_EQUAL;

const enum AddressPayload {
  p2pkhStart = 3,
  p2pkhEnd = 23,
  p2sh20Start = 2,
  p2sh20End = 22,
  // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
  p2sh32Start = 2,
  p2sh32End = 34,
  p2pkUncompressedStart = 1,
  p2pkUncompressedEnd = 66,
  // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
  p2pkCompressedStart = 1,
  p2sh20Length = 20,
  p2sh32Length = 32,
  compressedPublicKeyLength = 33,
  // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
  p2pkCompressedEnd = 34,
}

/**
 * Attempt to match a lockingBytecode to a standard address type for use in
 * address encoding. (See {@link LockingBytecodeType} for details.)
 *
 * For a locking bytecode matching the Pay to Public Key Hash (P2PKH) pattern,
 * the returned `type` is {@link LockingBytecodeType.p2pkh} and `payload` is the
 * `HASH160` of the public key.
 *
 * For a locking bytecode matching the 20-byte Pay to Script Hash (P2SH20)
 * pattern, the returned `type` is {@link LockingBytecodeType.p2sh20} and
 * `payload` is the `HASH160` of the redeeming bytecode, A.K.A. "redeem
 * script hash".
 *
 * For a locking bytecode matching the Pay to Public Key (P2PK) pattern, the
 * returned `type` is {@link LockingBytecodeType.p2pk} and `payload` is the full
 * public key.
 *
 * Any other locking bytecode will return a `type` of
 * {@link LockingBytecodeType.unknown} and a payload of the
 * unmodified `bytecode`.
 *
 * @param bytecode - the locking bytecode to match
 */

// eslint-disable-next-line complexity
export const lockingBytecodeToAddressContents = (
  bytecode: Uint8Array,
): AddressContents => {
  if (isPayToPublicKeyHash(bytecode)) {
    return {
      payload: bytecode.slice(
        AddressPayload.p2pkhStart,
        AddressPayload.p2pkhEnd,
      ),
      type: LockingBytecodeType.p2pkh,
    };
  }

  if (isPayToScriptHash20(bytecode)) {
    return {
      payload: bytecode.slice(
        AddressPayload.p2sh20Start,
        AddressPayload.p2sh20End,
      ),
      type: LockingBytecodeType.p2sh20,
    };
  }

  if (isPayToScriptHash32(bytecode)) {
    return {
      payload: bytecode.slice(
        AddressPayload.p2sh32Start,
        AddressPayload.p2sh32End,
      ),
      type: LockingBytecodeType.p2sh32,
    };
  }

  if (isPayToPublicKeyUncompressed(bytecode)) {
    return {
      payload: bytecode.slice(
        AddressPayload.p2pkUncompressedStart,
        AddressPayload.p2pkUncompressedEnd,
      ),
      type: LockingBytecodeType.p2pk,
    };
  }

  if (isPayToPublicKeyCompressed(bytecode)) {
    return {
      payload: bytecode.slice(
        AddressPayload.p2pkCompressedStart,
        AddressPayload.p2pkCompressedEnd,
      ),
      type: LockingBytecodeType.p2pk,
    };
  }

  return { payload: bytecode.slice(), type: 'unknown' };
};

/**
 * Given the 20-byte {@link hash160} of a compressed public key, return a P2PKH
 * locking bytecode:
 * `OP_DUP OP_HASH160 OP_PUSHBYTES_20 publicKeyHash OP_EQUALVERIFY OP_CHECKSIG`.
 *
 * This method does not validate `publicKeyHash` in any way; inputs of incorrect
 * lengths will produce incorrect results.
 *
 * @param publicKeyHash - the 20-byte hash of the compressed public key
 * @returns
 */
export const encodeLockingBytecodeP2pkh = (publicKeyHash: Uint8Array) =>
  Uint8Array.from([
    Opcodes.OP_DUP,
    Opcodes.OP_HASH160,
    Opcodes.OP_PUSHBYTES_20,
    ...publicKeyHash,
    Opcodes.OP_EQUALVERIFY,
    Opcodes.OP_CHECKSIG,
  ]);

/**
 * Given the 20-byte {@link hash160} of a P2SH20 redeem bytecode, encode a
 * P2SH20 locking bytecode:
 * `OP_HASH160 OP_PUSHBYTES_20 redeemBytecodeHash OP_EQUAL`.
 *
 * This method does not validate `p2sh20Hash` in any way; inputs of incorrect
 * lengths will produce incorrect results.
 *
 * @param p2sh20Hash - the 20-byte, p2sh20 redeem bytecode hash
 */
export const encodeLockingBytecodeP2sh20 = (p2sh20Hash: Uint8Array) =>
  Uint8Array.from([
    Opcodes.OP_HASH160,
    Opcodes.OP_PUSHBYTES_20,
    ...p2sh20Hash,
    Opcodes.OP_EQUAL,
  ]);

/**
 * Given the 32-byte {@link hash256} of a P2SH32 redeem bytecode, encode a
 * P2SH32 locking bytecode:
 * `OP_HASH256 OP_PUSHBYTES_32 redeemBytecodeHash OP_EQUAL`.
 *
 * This method does not validate `p2sh32Hash` in any way; inputs of incorrect
 * lengths will produce incorrect results.
 *
 * @param p2sh32Hash - the 32-byte, p2sh32 redeem bytecode hash
 */
export const encodeLockingBytecodeP2sh32 = (p2sh32Hash: Uint8Array) =>
  Uint8Array.from([
    Opcodes.OP_HASH256,
    Opcodes.OP_PUSHBYTES_32,
    ...p2sh32Hash,
    Opcodes.OP_EQUAL,
  ]);

/**
 * Given a 33-byte compressed or 65-byte uncompressed public key, encode a P2PK
 * locking bytecode: `OP_PUSHBYTES_33 publicKey OP_CHECKSIG` or
 * `OP_PUSHBYTES_65 publicKey OP_CHECKSIG`.
 *
 * This method does not validate `publicKey` in any way; inputs of incorrect
 * lengths will produce incorrect results.
 *
 * @param publicKey - the 33-byte or 65-byte public key
 */
export const encodeLockingBytecodeP2pk = (publicKey: Uint8Array) =>
  publicKey.length === AddressPayload.compressedPublicKeyLength
    ? Uint8Array.from([
        Opcodes.OP_PUSHBYTES_33,
        ...publicKey,
        Opcodes.OP_CHECKSIG,
      ])
    : Uint8Array.from([
        Opcodes.OP_PUSHBYTES_65,
        ...publicKey,
        Opcodes.OP_CHECKSIG,
      ]);

/**
 * Get the locking bytecode for a {@link KnownAddressTypeContents}. See
 * {@link lockingBytecodeToAddressContents} for details.
 *
 * @param addressContents - the `AddressContents` to encode
 */
export const addressContentsToLockingBytecode = ({
  payload,
  type,
}: KnownAddressTypeContents): Uint8Array => {
  if (type === LockingBytecodeType.p2pkh) {
    return encodeLockingBytecodeP2pkh(payload);
  }
  if (type === LockingBytecodeType.p2sh20) {
    return encodeLockingBytecodeP2sh20(payload);
  }
  if (type === LockingBytecodeType.p2sh32) {
    return encodeLockingBytecodeP2sh32(payload);
  }
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (type === LockingBytecodeType.p2pk) {
    return encodeLockingBytecodeP2pk(payload);
  }
  return unknownValue(
    type,
    `Unrecognized addressContents type: ${type as string}`,
  );
};

/**
 * Encode a locking bytecode as a CashAddress given a network prefix.
 *
 * If `bytecode` matches a standard pattern, it is encoded using the proper
 * address type and returned as a valid CashAddress (string).
 *
 * If `bytecode` cannot be encoded as an address (i.e. because the pattern is
 * not standard), the resulting {@link AddressContents} is returned.
 *
 * @param bytecode - the locking bytecode to encode
 * @param prefix - the network prefix to use, e.g. `bitcoincash`, `bchtest`, or
 * `bchreg`, defaults to `bitcoincash`
 * @param options - an object describing address options, defaults to
 * `{ tokenSupport: false }`
 */
// eslint-disable-next-line complexity
export const lockingBytecodeToCashAddress = (
  bytecode: Uint8Array,
  prefix: `${CashAddressNetworkPrefix}` = 'bitcoincash',
  options = { tokenSupport: false },
) => {
  const contents = lockingBytecodeToAddressContents(bytecode);
  if (contents.type === LockingBytecodeType.p2pkh) {
    return options.tokenSupport
      ? encodeCashAddress(
          prefix,
          CashAddressType.p2pkhWithTokens,
          contents.payload,
        )
      : encodeCashAddress(prefix, CashAddressType.p2pkh, contents.payload);
  }
  if (
    contents.type === LockingBytecodeType.p2sh20 ||
    contents.type === LockingBytecodeType.p2sh32
  ) {
    return options.tokenSupport
      ? encodeCashAddress(
          prefix,
          CashAddressType.p2shWithTokens,
          contents.payload,
        )
      : encodeCashAddress(prefix, CashAddressType.p2sh, contents.payload);
  }
  if (contents.type === 'P2PK') {
    return {
      error: CashAddressEncodingError.noTypeBitsValueStandardizedForP2pk,
    };
  }
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (contents.type === 'unknown') {
    return { error: CashAddressEncodingError.unknownLockingBytecodeType };
  }
  return unknownValue(
    contents.type,
    `Unrecognized locking bytecode type: ${contents.type as string}`,
  );
};

export enum LockingBytecodeGenerationError {
  unsupportedPayloadLength = 'Error generating locking bytecode: no standard locking bytecode patterns support a payload of this length.',
}
/**
 * Convert a CashAddress to its respective locking bytecode.
 *
 * This method returns the locking bytecode and network prefix. If an error
 * occurs, an error message is returned as a string.
 *
 * @param address - the CashAddress to convert
 */
// eslint-disable-next-line complexity
export const cashAddressToLockingBytecode = (address: string) => {
  const decoded = decodeCashAddress(address);
  if (typeof decoded === 'string') return decoded;
  if (
    decoded.payload.length !== AddressPayload.p2sh20Length &&
    decoded.payload.length !== AddressPayload.p2sh32Length
  ) {
    return formatError(
      LockingBytecodeGenerationError.unsupportedPayloadLength,
      `Payload length: ${decoded.payload.length}`,
    );
  }
  if (
    decoded.type === CashAddressType.p2pkh ||
    decoded.type === CashAddressType.p2pkhWithTokens
  ) {
    return {
      bytecode: addressContentsToLockingBytecode({
        payload: decoded.payload,
        type: LockingBytecodeType.p2pkh,
      }),
      options: {
        tokenSupport: decoded.type === CashAddressType.p2pkhWithTokens,
      },
      prefix: decoded.prefix,
    };
  }
  if (
    decoded.type === CashAddressType.p2sh ||
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    decoded.type === CashAddressType.p2shWithTokens
  ) {
    return {
      bytecode: addressContentsToLockingBytecode({
        payload: decoded.payload,
        type:
          decoded.payload.length === AddressPayload.p2sh32Length
            ? LockingBytecodeType.p2sh32
            : LockingBytecodeType.p2sh20,
      }),
      options: {
        tokenSupport: decoded.type === CashAddressType.p2shWithTokens,
      },
      prefix: decoded.prefix,
    };
  }
  return unknownValue(
    decoded.type,
    `Unrecognized address type: ${decoded.type as string}`,
  );
};

/**
 * Encode a locking bytecode as a Base58Address for a given network.
 *
 * If `bytecode` matches a standard pattern, it is encoded using the proper
 * address type and returned as a valid Base58Address (string).
 *
 * If `bytecode` cannot be encoded as an address (i.e. because the pattern is
 * not standard), the resulting {@link AddressContents} is returned.
 *
 * Note, Base58Addresses cannot accept tokens; to accept tokens,
 * use {@link lockingBytecodeToCashAddress} with `options.tokenSupport` set
 * to `true`.
 *
 * @param bytecode - the locking bytecode to encode
 * @param network - the network for which to encode the address (`mainnet`,
 * `testnet`, or 'copayBCH'), defaults to `mainnet`
 * @param sha256 - an implementation of sha256 (defaults to the internal WASM
 * implementation)
 */
export const lockingBytecodeToBase58Address = (
  bytecode: Uint8Array,
  network: `${Base58AddressNetwork}` = 'mainnet',
  sha256: { hash: Sha256['hash'] } = internalSha256,
) => {
  const contents = lockingBytecodeToAddressContents(bytecode);

  if (contents.type === LockingBytecodeType.p2pkh) {
    return encodeBase58AddressFormat(
      {
        copayBCH: Base58AddressFormatVersion.p2pkhCopayBCH,
        mainnet: Base58AddressFormatVersion.p2pkh,
        testnet: Base58AddressFormatVersion.p2pkhTestnet,
      }[network],
      contents.payload,
      sha256,
    );
  }
  if (contents.type === LockingBytecodeType.p2sh20) {
    return encodeBase58AddressFormat(
      {
        copayBCH: Base58AddressFormatVersion.p2sh20CopayBCH,
        mainnet: Base58AddressFormatVersion.p2sh20,
        testnet: Base58AddressFormatVersion.p2sh20Testnet,
      }[network],
      contents.payload,
      sha256,
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
  address: string,
  sha256: { hash: Sha256['hash'] } = internalSha256,
) => {
  const decoded = decodeBase58Address(address, sha256);
  if (typeof decoded === 'string') return decoded;

  return {
    bytecode: addressContentsToLockingBytecode({
      payload: decoded.payload,
      type: [
        Base58AddressFormatVersion.p2pkh,
        Base58AddressFormatVersion.p2pkhCopayBCH,
        Base58AddressFormatVersion.p2pkhTestnet,
      ].includes(decoded.version)
        ? LockingBytecodeType.p2pkh
        : LockingBytecodeType.p2sh20,
    }),
    version: decoded.version,
  };
};
