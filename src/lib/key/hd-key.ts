/* eslint-disable max-lines */
import {
  hmacSha512,
  ripemd160 as internalRipemd160,
  secp256k1 as internalSecp256k1,
  sha256 as internalSha256,
  sha512 as internalSha512,
} from '../crypto/crypto.js';
import {
  base58ToBin,
  bigIntToBinUint256BEClamped,
  binsAreEqual,
  binToBase58,
  binToBigIntUint256BE,
  binToHex,
  flattenBinArray,
  formatError,
  numberToBinUint32BE,
  utf8ToBin,
} from '../format/format.js';
import type { Ripemd160, Secp256k1, Sha256, Sha512 } from '../lib.js';

const enum Secp256k1Constants {
  privateKeyLength = 32,
}

/**
 * Verify that a private key is valid for the Secp256k1 curve. Returns `true`
 * for success, or `false` on failure.
 *
 * Private keys are 256-bit numbers encoded as a 32-byte, big-endian Uint8Array.
 * Nearly every 256-bit number is a valid secp256k1 private key. Specifically,
 * any 256-bit number greater than `0x01` and less than
 * `0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141`
 * is a valid private key. This range is part of the definition of the
 * secp256k1 elliptic curve parameters.
 *
 * This method does not require a `Secp256k1` implementation.
 *
 * @param privateKey - The private key to validate.
 */
export const validateSecp256k1PrivateKey = (privateKey: Uint8Array) => {
  if (
    privateKey.length !== Secp256k1Constants.privateKeyLength ||
    privateKey.every((value) => value === 0)
  ) {
    return false;
  }

  /**
   * The largest possible Secp256k1 private key – equal to the order of the
   * Secp256k1 curve minus one.
   */
  // prettier-ignore
  const maximumSecp256k1PrivateKey = [255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 254, 186, 174, 220, 230, 175, 72, 160, 59, 191, 210, 94, 140, 208, 54, 65, 64]; // eslint-disable-line @typescript-eslint/no-magic-numbers

  const firstDifference = privateKey.findIndex(
    (value, i) => value !== maximumSecp256k1PrivateKey[i],
  );

  if (
    firstDifference === -1 ||
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    privateKey[firstDifference]! < maximumSecp256k1PrivateKey[firstDifference]!
  ) {
    return true;
  }

  return false;
};

/**
 * The networks that can be referenced by an HD public or private key.
 */
export type HdKeyNetwork = 'mainnet' | 'testnet';

type HdNodeBase = {
  /**
   * 32 bytes of additional entropy that can be used to derive HD child nodes.
   */
  chainCode: Uint8Array;
  /**
   * The child index at which this node is derived from its parent node
   * (identified via `parentFingerprint`). Indexes less than `0x80000000`
   * (`2147483648`) use standard derivation, while indexes equal to or greater
   * than `0x80000000` use the "hardened" derivation algorithm. The maximum
   * index is `0xffffffff` (`4294967295`).
   *
   * In BIP32 HD derivation paths, hardened indexes are usually represented by
   * subtracting the hardened index offset (`2147483648`) and appending `'` to
   * the child index number. E.g. `0'` is a `childIndex` of `2147483648`, and
   * `2'` is a `childIndex` of `2147483650`.
   */
  childIndex: number;
  /**
   * The depth of this node, between `0` (for master nodes) and `255`. E.g. for
   * a path of `m/0/0`, `depth` is `2`.
   */
  depth: number;
  /**
   * The first 4 bytes of the parent node's identifier. This is used to quickly
   * identify the parent node in data structures, but collisions can occur. To
   * resolve collisions, use the full parent identifier. (See
   * {@link deriveHdPublicNodeIdentifier} for details.)
   */
  parentFingerprint: Uint8Array;
  /**
   * The full identifier of the parent node. This can be used to resolve
   * collisions where two possible parent nodes share a `parentFingerprint`.
   * Since the full `parentIdentifier` is not encoded in BIP32 HD keys, it
   * might be unknown.
   */
  parentIdentifier?: Uint8Array;
};

/**
 * A valid private node in a Hierarchical Deterministic (HD) key tree. This node
 * can be used to derive further nodes, or the private key can be used to
 * generate a wallet address.
 */
export type HdPrivateNodeValid = HdNodeBase & {
  /**
   * This {@link HdPrivateNode}'s 32-byte valid Secp256k1 private key.
   */
  privateKey: Uint8Array;
};

/**
 * An invalid private node in a Hierarchical Deterministic (HD) key tree. This
 * is almost impossibly rare in a securely-random 32-byte Uint8Array
 * (probability less than 1 in 2^127).
 *
 * If this occurs during derivation from a seed, the error should be handled
 * and a different seed should be used. If this occurs during HD derivation,
 * BIP32 standardizes the procedure for skipping the offending key material by
 * using the next child index. I.e. the node ultimately derived at the invalid
 * child index is a duplicate of the node derived at `index + 1`.
 */
export type HdPrivateNodeInvalid = HdNodeBase & {
  /**
   * The 32-byte derivation result that caused this node to be invalid (either
   * an invalid Secp256k1 private key or a tweak value which causes the
   * resulting key to be invalid). This is almost impossibly rare in a
   * securely-random 32-byte Uint8Array (probability less than 1 in 2^127).
   *
   * See {@link validateSecp256k1PrivateKey} for details.
   */
  invalidMaterial: Uint8Array;
};

/**
 * A private node in a Hierarchical Deterministic (HD) key tree. To confirm the
 * validity of this node, try `if ('invalidMaterial' in node) ...`.
 *
 * Note, HD nodes are network-independent. A network is required only when
 * encoding the node as an HD key or using a derived public key in an address.
 */
export type HdPrivateNode = HdPrivateNodeInvalid | HdPrivateNodeValid;

/**
 * An HD private node for which the parent node is known (and `parentIdentifier`
 * is guaranteed to be defined).
 */
export type HdPrivateNodeKnownParent<
  HdPrivateNodeType extends HdPrivateNode = HdPrivateNodeValid,
> = HdPrivateNodeType & {
  parentIdentifier: Uint8Array;
};

/**
 * A public node in a Hierarchical Deterministic (HD) key tree.
 *
 * Note, HD nodes are network-independent. A network is required only when
 * encoding the node as an HD key or using a derived public key in an address.
 */
export type HdPublicNodeValid = HdNodeBase & {
  /**
   * This {@link HdPublicNodeValid}'s valid 33-byte Secp256k1 compressed
   * public key.
   */
  publicKey: Uint8Array;
};

/**
 * An invalid public node in a Hierarchical Deterministic (HD) key tree. This
 * is almost impossibly rare in a securely-random 32-byte Uint8Array
 * (probability less than 1 in 2^127). See {@link HdPrivateNodeInvalid}
 * for details.
 */
export type HdPublicNodeInvalid = HdNodeBase & {
  /**
   * The 32-byte derivation result that caused this node to be invalid. This is
   * almost impossibly rare in a securely-random 32-byte Uint8Array (probability
   * less than 1 in 2^127).
   *
   * See {@link validateSecp256k1PrivateKey} for details.
   */
  invalidMaterial: Uint8Array;
};

/**
 * A private node in a Hierarchical Deterministic (HD) key tree. To confirm the
 * validity of this node, check the value of its `valid` property.
 *
 * Note, HD nodes are network-independent. A network is required only when
 * encoding the node as an HD key or using a derived public key in an address.
 */
export type HdPublicNode = HdPublicNodeInvalid | HdPublicNodeValid;

/**
 * An HD public node for which the parent node is known (and `parentIdentifier`
 * is guaranteed to be defined).
 */
export type HdPublicNodeKnownParent<
  HdPublicNodeType extends HdPublicNode = HdPublicNodeValid,
> = HdPublicNodeType & {
  parentIdentifier: Uint8Array;
};

/**
 * The decoded contents of an HD public or private key.
 */
export type DecodedHdKey<
  NodeType extends HdPrivateNodeValid | HdPublicNodeValid =
    | HdPrivateNodeValid
    | HdPublicNodeValid,
> = {
  node: NodeType;
  network: HdKeyNetwork;
};

/**
 * An error in the derivation of child HD public or private nodes.
 */
export enum HdNodeDerivationError {
  childIndexExceedsMaximum = 'HD node derivation error: child index exceeds maximum (4294967295).',
  requiresZeroDepthNode = 'HD node derivation error: absolute derivation requires an HD node with a depth of 0.',
  hardenedDerivationRequiresPrivateNode = 'HD node derivation error: derivation for hardened child indexes (indexes greater than or equal to 2147483648) requires an HD private node.',
  invalidAbsoluteDerivationPath = 'HD node derivation error: invalid absolute derivation path; path must begin with "m" or "M" and contain only positive child index numbers, separated by forward slashes ("/"), with zero or one apostrophe ("\'") after each child index number.',
  invalidRelativeDerivationPath = 'HD node derivation error: invalid relative derivation path; path must contain only positive child index numbers, separated by forward slashes ("/"), with zero or one apostrophe ("\'") after each child index number.',
  invalidDerivedKey = 'HD node derivation error: an astronomically rare HMAC-SHA512 result produced an invalid Secp256k1 key.',
  invalidPrivateDerivationPrefix = 'HD node derivation error: private derivation paths must begin with "m".',
  invalidPublicDerivationPrefix = 'HD node derivation error: public derivation paths must begin with "M".',
}

/**
 * An error in the decoding of an HD public or private key.
 */
export enum HdKeyDecodingError {
  incorrectLength = 'HD key decoding error: length is incorrect (must encode 82 bytes).',
  invalidChecksum = 'HD key decoding error: checksum is invalid.',
  invalidPublicKey = 'HD key decoding error: the public key for this HD public node is not a valid Secp256k1 public key.',
  invalidPrivateKey = 'HD key decoding error: the key for this HD private node is not a valid Secp256k1 private key.',
  missingPrivateKeyPaddingByte = 'HD key decoding error: version indicates a private key, but the key data is missing a padding byte.',
  privateKeyExpected = 'HD key decoding error: expected an HD private key, but encountered an HD public key.',
  publicKeyExpected = 'HD key decoding error: expected an HD public key, but encountered an HD private key.',
  unknownCharacter = 'HD key decoding error: key includes a non-base58 character.',
  unknownVersion = 'HD key decoding error: key uses an unknown version.',
  zeroDepthWithNonZeroChildIndex = 'HD key decoding error: key encodes a depth of zero with a non-zero child index.',
  zeroDepthWithNonZeroParentFingerprint = 'HD key decoding error: key encodes a depth of zero with a non-zero parent fingerprint.',
}

/**
 * An error in the encoding of an HD public or private key.
 */
export enum HdKeyEncodingError {
  invalidChainCodeLength = 'HD key encoding error: invalid chain code length. Chain code must be 32 bytes.',
  invalidChildDepth = 'HD key encoding error: invalid child depth. Child depth must be between 0 and 255 (inclusive).',
  invalidChildIndex = 'HD key encoding error: invalid child index. Child index must be between 0 and 4294967295 (inclusive).',
  invalidParentFingerprintLength = 'HD key encoding error: invalid parent fingerprint length. Parent fingerprint must be 4 bytes.',
  invalidPrivateKeyLength = 'HD key encoding error: invalid private key length. Secp256k1 private keys must be 32 bytes.',
  invalidPublicKeyLength = 'HD key encoding error: invalid public key length. Public key must be 33 bytes (compressed).',
  invalidPublicKey = 'HD key encoding error: the public key for this HD public node is not a valid Secp256k1 public key.',
  zeroDepthWithNonZeroChildIndex = 'HD key encoding error: attempted to encode a zero depth key with a non-zero child index.',
  zeroDepthWithNonZeroParentFingerprint = 'HD key encoding error: attempted to encode a zero depth key with a non-zero parent fingerprint.',
}

const enum Bip32Constants {
  parentFingerprintLength = 4,
  halfHmacSha512Length = 32,
  publicKeyLength = 33,
  hdKeyLength = 82,
  hdKeyChecksumIndex = 78,
  // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
  hdKeyChecksumLength = 4,
  maximumEncodingDepth = 255,
  maximumChildIndex = 4294967295,
}

const emptyParentFingerprint = Uint8Array.from([0, 0, 0, 0]);

/**
 * The HMAC SHA-512 key used by BIP32, "Bitcoin seed"
 * (`utf8ToBin('Bitcoin seed')`)
 */
export const bip32HmacSha512Key = utf8ToBin('Bitcoin seed');
/**
 * Derive an {@link HdPrivateNode} from the provided seed following the BIP32
 * specification. A seed should include between 16 bytes and 64 bytes of
 * entropy (recommended: 32 bytes).
 *
 * @param seed - the entropy from which to derive the {@link HdPrivateNode}
 */
export const deriveHdPrivateNodeFromSeed = <
  AssumeValidity extends boolean | undefined,
  ThrowErrors extends boolean = true,
>(
  seed: Uint8Array,
  {
    assumeValidity,
    crypto = { sha512: internalSha512 },
    hmacSha512Key = bip32HmacSha512Key,
    throwErrors = true as ThrowErrors,
  }: {
    /**
     * If set, the derived private key will not be checked for validity, and
     * will be assumed valid if `true` or invalid if `false` (this is useful
     * for testing).
     */
    assumeValidity?: AssumeValidity;
    /**
     * An optional object containing an implementation of sha512.
     */
    crypto?: { sha512: { hash: Sha512['hash'] } };
    /**
     * The HMAC SHA-512 key to use (defaults to the HMAC SHA-512 key used by
     * BIP32, `utf8ToBin('Bitcoin seed')`.
     */
    hmacSha512Key?: Uint8Array;
    /**
     * If `true`, invalid key derivations (probability less than 1 in 2^127)
     * will throw an `Error` rather than returning an
     * {@link HdPrivateNodeInvalid} (defaults to `true`).
     */
    throwErrors?: ThrowErrors;
  } = {},
) => {
  const mac = hmacSha512(hmacSha512Key, seed, crypto.sha512);
  const privateKey = mac.slice(0, Bip32Constants.halfHmacSha512Length);
  const chainCode = mac.slice(Bip32Constants.halfHmacSha512Length);
  const depth = 0;
  const childIndex = 0;
  const parentFingerprint = emptyParentFingerprint.slice();
  const valid = assumeValidity ?? validateSecp256k1PrivateKey(privateKey);
  if (throwErrors && !valid)
    // eslint-disable-next-line functional/no-throw-statements
    throw new Error(HdNodeDerivationError.invalidDerivedKey);
  return (
    valid
      ? { chainCode, childIndex, depth, parentFingerprint, privateKey }
      : {
          chainCode,
          childIndex,
          depth,
          invalidMaterial: privateKey,
          parentFingerprint,
        }
  ) as AssumeValidity extends false
    ? ThrowErrors extends false
      ? HdPrivateNode
      : HdPrivateNodeValid
    : HdPrivateNodeValid;
};

/**
 * Derive the public identifier for a given {@link HdPrivateNode}. This is used
 * to uniquely identify HD nodes in software. The first 4 bytes of this
 * identifier are considered its "fingerprint".
 *
 * @param hdPrivateNode - The {@link HdPrivateNode} from which to derive the
 * public identifier.
 */
export const deriveHdPrivateNodeIdentifier = (
  hdPrivateNode: HdPrivateNodeValid,
  {
    crypto = {
      ripemd160: internalRipemd160,
      secp256k1: internalSecp256k1,
      sha256: internalSha256,
    },
  }: {
    /**
     * An optional object containing implementations of sha256 hashing,
     * ripemd160 hashing, and secp256k1 compressed public key derivation to use.
     */
    crypto?: {
      sha256: { hash: Sha256['hash'] };
      ripemd160: { hash: Ripemd160['hash'] };
      secp256k1: {
        derivePublicKeyCompressed: Secp256k1['derivePublicKeyCompressed'];
      };
    };
  } = {},
) => {
  const publicKey = crypto.secp256k1.derivePublicKeyCompressed(
    hdPrivateNode.privateKey,
  );
  if (typeof publicKey === 'string') return publicKey;
  return crypto.ripemd160.hash(crypto.sha256.hash(publicKey));
};

/**
 * Derive the public identifier for a given {@link HdPublicNodeValid}. This is
 * used to uniquely identify HD nodes in software. The first 4 bytes of this
 * identifier are considered its fingerprint.
 *
 * @param node - The {@link HdPublicNodeValid} from which to derive the
 * public identifier.
 */
export const deriveHdPublicNodeIdentifier = (
  node: HdPublicNodeValid,
  {
    crypto = { ripemd160: internalRipemd160, sha256: internalSha256 },
  }: {
    /**
     * An optional object containing implementations of sha256 and ripemd160
     * to use.
     */
    crypto?: {
      ripemd160: { hash: Ripemd160['hash'] };
      sha256: { hash: Sha256['hash'] };
    };
  } = {},
) => crypto.ripemd160.hash(crypto.sha256.hash(node.publicKey));

/**
 * The 4-byte version indicating the network and type of an {@link HdPrivateKey}
 * or {@link HdPublicKey}.
 */
export enum HdKeyVersion {
  /**
   * Version indicating the HD key is an {@link HdPrivateKey} intended for use
   * on the main network. Base58 encoding at the expected length of an HD key
   * results in a prefix of `xprv`.
   *
   * Hex: `0x0488ade4`
   */
  mainnetPrivateKey = 0x0488ade4,
  /**
   * Version indicating the HD key is an {@link HdPrivateKey} intended for use
   * on the main network. Base58 encoding at the expected length of an HD key
   * results in a prefix of `xpub`.
   *
   * Hex: `0x0488b21e`
   */
  mainnetPublicKey = 0x0488b21e,
  /**
   * Version indicating the HD key is an {@link HdPrivateKey} intended for use
   * on the test network. Base58 encoding at the expected length of an HD key
   * results in a prefix of `tprv`.
   *
   * Hex: `0x04358394`
   */
  testnetPrivateKey = 0x04358394,
  /**
   * Version indicating the HD key is an {@link HdPrivateKey} intended for use
   * on the test network. Base58 encoding at the expected length of an HD key
   * results in a prefix of `tpub`.
   *
   * Hex: `0x043587cf`
   */
  testnetPublicKey = 0x043587cf,
}

export const hdKeyVersionIsPublicKey = (version: number) =>
  version === HdKeyVersion.mainnetPublicKey ||
  version === HdKeyVersion.testnetPublicKey;

export const hdKeyVersionIsPrivateKey = (version: number) =>
  version === HdKeyVersion.mainnetPrivateKey ||
  version === HdKeyVersion.testnetPrivateKey;

/**
 * Decode a string following the HD key format as defined by BIP32, returning a
 * `node` and a `version`. Decoding errors are returned as strings.
 *
 * This is a less strict variant of {@link decodeHdKey}; most applications
 * should instead use {@link decodeHdKey}, or if the type of the key is known,
 * either {@link decodeHdPrivateKey} or {@link decodeHdPublicKey}.
 *
 * @param hdKey - A BIP32 HD private key or HD public key.
 */
// eslint-disable-next-line complexity
export const decodeHdKeyUnchecked = (
  hdKey: string,
  {
    crypto = { secp256k1: internalSecp256k1, sha256: internalSha256 },
  }: {
    /**
     * An optional object containing an implementation of sha256 and a Secp256k1
     * `validatePublicKey` to use.
     */
    crypto?: {
      secp256k1: {
        validatePublicKey: Secp256k1['validatePublicKey'];
      };
      sha256: { hash: Sha256['hash'] };
    };
  } = {},
) => {
  const decoded = base58ToBin(hdKey);
  if (typeof decoded === 'string')
    return formatError(HdKeyDecodingError.unknownCharacter, decoded);

  if (decoded.length !== Bip32Constants.hdKeyLength)
    return formatError(
      HdKeyDecodingError.incorrectLength,
      `Length: ${decoded.length}.`,
    );

  const payload = decoded.slice(0, Bip32Constants.hdKeyChecksumIndex);
  const checksumBits = decoded.slice(Bip32Constants.hdKeyChecksumIndex);
  const checksum = crypto.sha256.hash(crypto.sha256.hash(payload));
  if (!checksumBits.every((value, i) => value === checksum[i])) {
    return formatError(
      HdKeyDecodingError.invalidChecksum,
      `Encoded: ${binToHex(checksumBits)}; computed: ${binToHex(
        checksum.slice(0, Bip32Constants.hdKeyChecksumLength),
      )}.`,
    );
  }

  const depthIndex = 4;
  const fingerprintIndex = 5;
  const childIndexIndex = 9;
  const chainCodeIndex = 13;
  const keyDataIndex = 45;

  const version = new DataView(
    decoded.buffer,
    decoded.byteOffset,
    depthIndex,
  ).getUint32(0);
  const depth = decoded[depthIndex];
  const parentFingerprint = decoded.slice(fingerprintIndex, childIndexIndex);
  const childIndex = new DataView(
    decoded.buffer,
    decoded.byteOffset + childIndexIndex,
    decoded.byteOffset + chainCodeIndex,
  ).getUint32(0);
  const chainCode = decoded.slice(chainCodeIndex, keyDataIndex);
  const keyData = decoded.slice(
    keyDataIndex,
    Bip32Constants.hdKeyChecksumIndex,
  );

  const isPrivateKey = hdKeyVersionIsPrivateKey(version);
  if (isPrivateKey && keyData[0] !== 0x00) {
    return HdKeyDecodingError.missingPrivateKeyPaddingByte;
  }
  if (isPrivateKey) {
    const privateKey = keyData.slice(1);
    const valid = validateSecp256k1PrivateKey(privateKey);
    return {
      node: valid
        ? ({
            chainCode,
            childIndex,
            depth,
            parentFingerprint,
            privateKey,
          } as HdPrivateNodeValid)
        : ({
            chainCode,
            childIndex,
            depth,
            invalidMaterial: privateKey,
            parentFingerprint,
          } as HdPrivateNodeInvalid),
      version,
    };
  }

  const isPublicKey = hdKeyVersionIsPublicKey(version);
  if (!isPublicKey) {
    return formatError(
      HdKeyDecodingError.unknownVersion,
      `Version: ${version}`,
    );
  }

  const publicKey = keyData;
  const valid = crypto.secp256k1.validatePublicKey(publicKey);
  return {
    node: valid
      ? ({
          chainCode,
          childIndex,
          depth,
          parentFingerprint,
          publicKey,
        } as HdPublicNodeValid)
      : ({
          chainCode,
          childIndex,
          depth,
          invalidMaterial: publicKey,
          parentFingerprint,
        } as HdPublicNodeInvalid),
    version,
  };
};

/**
 * Decode an HD key as defined by BIP32, returning a `node` and a `network`.
 * Decoding errors are returned as strings.
 *
 * If the type of the key is known, use {@link decodeHdPrivateKey} or
 * {@link decodeHdPublicKey}. For a variant with less strict validation,
 * use {@link decodeHdKeyUnchecked}.
 *
 * @param hdKey - A BIP32 HD private key or HD public key.
 */
// eslint-disable-next-line complexity
export const decodeHdKey = (
  hdKey: string,
  {
    crypto = { secp256k1: internalSecp256k1, sha256: internalSha256 },
  }: {
    /**
     * An optional object containing an implementation of sha256 and a Secp256k1
     * `validatePublicKey` to use.
     */
    crypto?: {
      secp256k1: {
        validatePublicKey: Secp256k1['validatePublicKey'];
      };
      sha256: { hash: Sha256['hash'] };
    };
  } = {},
): DecodedHdKey | string => {
  const decoded = decodeHdKeyUnchecked(hdKey, { crypto });
  if (typeof decoded === 'string') return decoded;
  const { node, version } = decoded;

  if (node.depth === 0) {
    if (node.childIndex !== 0) {
      return formatError(
        HdKeyDecodingError.zeroDepthWithNonZeroChildIndex,
        `Child index: ${node.childIndex}.`,
      );
    }
    if (!binsAreEqual(node.parentFingerprint, emptyParentFingerprint)) {
      return formatError(
        HdKeyDecodingError.zeroDepthWithNonZeroParentFingerprint,
        `Parent fingerprint: ${node.parentFingerprint.join(',')}.`,
      );
    }
  }

  const isPublicKey = hdKeyVersionIsPublicKey(version);

  if ('invalidMaterial' in node) {
    return isPublicKey
      ? formatError(
          HdKeyDecodingError.invalidPublicKey,
          `Invalid public key: ${binToHex(node.invalidMaterial)}.`,
        )
      : formatError(HdKeyDecodingError.invalidPrivateKey);
  }

  const network: HdKeyNetwork =
    version === HdKeyVersion.mainnetPrivateKey ||
    version === HdKeyVersion.mainnetPublicKey
      ? 'mainnet'
      : 'testnet';

  return { network, node };
};

/**
 * Decode an HD private key as defined by BIP32.
 *
 * This method is similar to {@link decodeHdKey} but ensures that the result is
 * a valid HD private node. Decoding error messages are returned as strings.
 *
 * @param hdPrivateKey - A BIP32 HD private key.
 */
export const decodeHdPrivateKey = (
  hdPrivateKey: string,
  {
    crypto = { secp256k1: internalSecp256k1, sha256: internalSha256 },
  }: {
    /**
     * An optional object containing an implementation of sha256 and a
     * Secp256k1 `validatePublicKey` to use.
     */
    crypto?: {
      secp256k1: { validatePublicKey: Secp256k1['validatePublicKey'] };
      sha256: { hash: Sha256['hash'] };
    };
  } = {},
): DecodedHdKey<HdPrivateNodeValid> | string => {
  const decoded = decodeHdKey(hdPrivateKey, { crypto });
  if (typeof decoded === 'string') return decoded;
  const { network, node } = decoded;
  if ('publicKey' in node) {
    return HdKeyDecodingError.privateKeyExpected;
  }
  return { network, node };
};

/**
 * Decode an HD public key as defined by BIP32.
 *
 * This method is similar to {@link decodeHdKey} but ensures that the result is
 * a valid HD public node. Decoding error messages are returned as strings.
 *
 * @param hdPublicKey - A BIP32 HD public key.
 */
export const decodeHdPublicKey = (
  hdPublicKey: string,
  {
    crypto = { secp256k1: internalSecp256k1, sha256: internalSha256 },
  }: {
    /**
     * An optional object containing an implementation of sha256 and a Secp256k1
     * `validatePublicKey` to use.
     */
    crypto?: {
      secp256k1: { validatePublicKey: Secp256k1['validatePublicKey'] };
      sha256: { hash: Sha256['hash'] };
    };
  } = {},
): DecodedHdKey<HdPublicNodeValid> | string => {
  const decoded = decodeHdKey(hdPublicKey, { crypto });
  if (typeof decoded === 'string') return decoded;
  const { network, node } = decoded;
  if ('privateKey' in node) {
    return HdKeyDecodingError.publicKeyExpected;
  }
  return { network, node };
};

/**
 * Decode the provided HD private key and compute its identifier. Error messages
 * are returned as a string.
 */
export const hdPrivateKeyToIdentifier = (
  hdPrivateKey: string,
  {
    crypto = { secp256k1: internalSecp256k1, sha256: internalSha256 },
  }: {
    crypto?: {
      secp256k1: { validatePublicKey: Secp256k1['validatePublicKey'] };
      sha256: { hash: Sha256['hash'] };
    };
  } = {},
) => {
  const privateKeyParams = decodeHdPrivateKey(hdPrivateKey, { crypto });
  if (typeof privateKeyParams === 'string') {
    return privateKeyParams;
  }
  return deriveHdPrivateNodeIdentifier(privateKeyParams.node);
};

/**
 * Decode the provided HD public key and compute its identifier. Error messages
 * are returned as a string.
 */
export const hdPublicKeyToIdentifier = (
  hdPublicKey: string,
  {
    crypto = { secp256k1: internalSecp256k1, sha256: internalSha256 },
  }: {
    crypto?: {
      secp256k1: { validatePublicKey: Secp256k1['validatePublicKey'] };
      sha256: { hash: Sha256['hash'] };
    };
  } = {},
) => {
  const publicKeyParams = decodeHdPublicKey(hdPublicKey, { crypto });
  if (typeof publicKeyParams === 'string') {
    return publicKeyParams;
  }
  return deriveHdPublicNodeIdentifier(publicKeyParams.node);
};

/**
 * Encode the metadata portion of an HD key payload.
 */
// eslint-disable-next-line complexity
export const encodeHdKeyPayloadMetadata = <ThrowErrors extends boolean = true>({
  version,
  keyParameters,
  throwErrors = true as ThrowErrors,
}: {
  keyParameters: DecodedHdKey;
  /**
   * If `true`, this function will throw an `Error` when the provided HD node
   * cannot be encoded using the BIP32 serialization, format rather than
   * returning the error as a string (defaults to `true`).
   */
  throwErrors?: ThrowErrors;
  version: Uint8Array;
}): ThrowErrors extends true ? Uint8Array : Uint8Array | string => {
  if (keyParameters.node.depth === 0) {
    if (keyParameters.node.childIndex !== 0) {
      return formatError(
        HdKeyEncodingError.zeroDepthWithNonZeroChildIndex,
        `Child index: ${keyParameters.node.childIndex}.`,
        throwErrors,
      );
    }
    if (
      !binsAreEqual(
        keyParameters.node.parentFingerprint,
        emptyParentFingerprint,
      )
    ) {
      return formatError(
        HdKeyEncodingError.zeroDepthWithNonZeroParentFingerprint,
        `Parent fingerprint: ${keyParameters.node.parentFingerprint.join(
          ',',
        )}.`,
        throwErrors,
      );
    }
  }
  if (
    keyParameters.node.chainCode.length !== Bip32Constants.halfHmacSha512Length
  ) {
    return formatError(
      HdKeyEncodingError.invalidChainCodeLength,
      `Chain code length: ${keyParameters.node.chainCode.length}.`,
      throwErrors,
    );
  }
  if (
    keyParameters.node.parentFingerprint.length !==
    Bip32Constants.parentFingerprintLength
  ) {
    return formatError(
      HdKeyEncodingError.invalidParentFingerprintLength,
      `Parent fingerprint length: ${keyParameters.node.parentFingerprint.length}.`,
      throwErrors,
    );
  }
  if (
    keyParameters.node.depth < 0 ||
    keyParameters.node.depth > Bip32Constants.maximumEncodingDepth
  ) {
    return formatError(
      HdKeyEncodingError.invalidChildDepth,
      `Depth: ${keyParameters.node.depth}.`,
      throwErrors,
    );
  }
  const depth = Uint8Array.of(keyParameters.node.depth);
  if (
    keyParameters.node.childIndex < 0 ||
    keyParameters.node.childIndex > Bip32Constants.maximumChildIndex
  ) {
    return formatError(
      HdKeyEncodingError.invalidChildIndex,
      `Child index: ${keyParameters.node.childIndex}.`,
      throwErrors,
    ) as ThrowErrors extends true ? Uint8Array : Uint8Array | string;
  }
  const childIndex = numberToBinUint32BE(keyParameters.node.childIndex);
  const payload = flattenBinArray([
    version,
    depth,
    keyParameters.node.parentFingerprint,
    childIndex,
    keyParameters.node.chainCode,
  ]);
  return payload;
};

/**
 * Encode an HD private key (as defined by BIP32) payload (without the checksum)
 * given a valid {@link HdPrivateNode} and network.
 *
 * Note that this function defaults to throwing encoding errors. To handle
 * errors in a type-safe way, set `throwErrors` to `false`.
 *
 * @param keyParameters - A valid HD private node and the network for which to
 * encode the key.
 */
export const encodeHdPrivateKeyPayload = <ThrowErrors extends boolean = true>(
  keyParameters: DecodedHdKey<HdPrivateNodeValid>,
  {
    throwErrors = true as ThrowErrors,
  }: {
    /**
     * If `true`, this function will throw an `Error` when the provided HD node
     * has a `depth` exceeding the maximum depth that can be encoded using the
     * BIP32 serialization format rather than returning the error as a string
     * (defaults to `true`).
     */
    throwErrors?: ThrowErrors;
  } = {},
): ThrowErrors extends true ? Uint8Array : Uint8Array | string => {
  const version = numberToBinUint32BE(
    keyParameters.network === 'mainnet'
      ? HdKeyVersion.mainnetPrivateKey
      : HdKeyVersion.testnetPrivateKey,
  );
  if (
    keyParameters.node.privateKey.length !== Bip32Constants.halfHmacSha512Length
  ) {
    return formatError(
      HdKeyEncodingError.invalidPrivateKeyLength,
      `Private key length: ${keyParameters.node.privateKey.length}.`,
      throwErrors,
    );
  }
  const metadata = encodeHdKeyPayloadMetadata({
    keyParameters,
    throwErrors,
    version,
  });
  if (typeof metadata === 'string') {
    return metadata;
  }
  const isPrivateKey = Uint8Array.of(0x00);
  const payload = flattenBinArray([
    metadata,
    isPrivateKey,
    keyParameters.node.privateKey,
  ]);
  return payload;
};

/**
 * Encode an HD public key (as defined by BIP32) payload (without the checksum)
 * given a valid {@link HdPublicNodeValid} and network.
 *
 * Note that this function defaults to throwing encoding errors. To handle
 * errors in a type-safe way, set `throwErrors` to `false`.
 *
 * @param keyParameters - A valid HD public node and the network for which to
 * encode the key.
 */
export const encodeHdPublicKeyPayload = <ThrowErrors extends boolean = true>(
  keyParameters: DecodedHdKey<HdPublicNodeValid>,
  {
    throwErrors = true as ThrowErrors,
  }: {
    /**
     * If `true`, this function will throw an `Error` when the provided HD node
     * has a `depth` exceeding the maximum depth that can be encoded using the
     * BIP32 serialization format rather than returning the error as a string
     * (defaults to `true`).
     */
    throwErrors?: ThrowErrors;
  } = {},
): ThrowErrors extends true ? Uint8Array : Uint8Array | string => {
  const version = numberToBinUint32BE(
    keyParameters.network === 'mainnet'
      ? HdKeyVersion.mainnetPublicKey
      : HdKeyVersion.testnetPublicKey,
  );
  if (keyParameters.node.publicKey.length !== Bip32Constants.publicKeyLength) {
    return formatError(
      HdKeyEncodingError.invalidPublicKeyLength,
      `Public key length: ${keyParameters.node.publicKey.length}.`,
      throwErrors,
    );
  }
  const metadata = encodeHdKeyPayloadMetadata({
    keyParameters,
    throwErrors,
    version,
  });
  if (typeof metadata === 'string') {
    return metadata;
  }
  const payload = flattenBinArray([metadata, keyParameters.node.publicKey]);
  return payload;
};

/**
 * Encode an HD public or private key (as defined by BIP32) payload with
 * a checksum.
 *
 * @param payload - the HD public or private key payload to encode
 */
export const encodeHdKeyPayloadWithChecksum = (
  payload: Uint8Array,
  {
    crypto = { sha256: internalSha256 },
  }: {
    /**
     *  An optional object containing an implementation of sha256 to use.
     */
    crypto?: { sha256: { hash: Sha256['hash'] } };
  } = {},
) => {
  const checksumLength = 4;
  const checksum = crypto.sha256
    .hash(crypto.sha256.hash(payload))
    .slice(0, checksumLength);
  return binToBase58(flattenBinArray([payload, checksum]));
};

export type HdPrivateKeyEncodeResult = {
  /**
   * The HD private key.
   */
  hdPrivateKey: string;
};

/**
 * Encode an HD private key (as defined by BIP32) given a valid
 * {@link HdPrivateNode} and network.
 *
 * Note that this function defaults to throwing encoding errors. To handle
 * errors in a type-safe way, set `throwErrors` to `false`.
 *
 * @param keyParameters - A valid HD private node and the network for which to
 * encode the key.
 */
export const encodeHdPrivateKey = <ThrowErrors extends boolean = true>(
  keyParameters: DecodedHdKey<HdPrivateNodeValid>,
  {
    crypto = { sha256: internalSha256 },
    throwErrors = true as ThrowErrors,
  }: {
    /**
     * An optional object containing an implementation of sha256 to use.
     */
    crypto?: { sha256: { hash: Sha256['hash'] } };
    /**
     * If `true`, this function will throw an `Error` when the provided HD node
     * has a `depth` exceeding the maximum depth that can be encoded using the
     * BIP32 serialization format rather than returning the error as a string
     * (defaults to `true`).
     */
    throwErrors?: ThrowErrors;
  } = {},
): ThrowErrors extends true
  ? HdPrivateKeyEncodeResult
  : HdPrivateKeyEncodeResult | string => {
  const payload = encodeHdPrivateKeyPayload(keyParameters, { throwErrors });
  return typeof payload === 'string'
    ? (payload as ThrowErrors extends true ? never : string)
    : { hdPrivateKey: encodeHdKeyPayloadWithChecksum(payload, { crypto }) };
};

export type HdPublicKeyEncodeResult = {
  /**
   * The HD public key.
   */
  hdPublicKey: string;
};

/**
 * Encode an HD public key (as defined by BIP32) given a valid
 * {@link HdPublicNodeValid} and network.
 *
 * Note that this function defaults to throwing encoding errors. To handle
 * errors in a type-safe way, set `throwErrors` to `false`.
 *
 * @param keyParameters - An HD public node and the network for which to encode
 * the key.
 */
export const encodeHdPublicKey = <ThrowErrors extends boolean = true>(
  keyParameters: DecodedHdKey<HdPublicNodeValid>,
  {
    crypto = { secp256k1: internalSecp256k1, sha256: internalSha256 },
    throwErrors = true as ThrowErrors,
  }: {
    /**
     * An optional object containing an implementation of sha256 to use.
     */
    crypto?: {
      secp256k1: { validatePublicKey: Secp256k1['validatePublicKey'] };
      sha256: { hash: Sha256['hash'] };
    };
    /**
     * If `true`, this function will throw an `Error` when the provided HD node
     * has a `depth` exceeding the maximum depth that can be encoded using the
     * BIP32 serialization format rather than returning the error as a string
     * (defaults to `true`).
     */
    throwErrors?: ThrowErrors;
  } = {},
): ThrowErrors extends true
  ? HdPublicKeyEncodeResult
  : HdPublicKeyEncodeResult | string => {
  if (!crypto.secp256k1.validatePublicKey(keyParameters.node.publicKey)) {
    return formatError(
      HdKeyEncodingError.invalidPublicKey,
      `Invalid public key: "${binToHex(keyParameters.node.publicKey)}".`,
      throwErrors,
    );
  }
  const payload = encodeHdPublicKeyPayload(keyParameters, { throwErrors });
  return typeof payload === 'string'
    ? (payload as ThrowErrors extends true ? never : string)
    : { hdPublicKey: encodeHdKeyPayloadWithChecksum(payload, { crypto }) };
};

/**
 * Derive the HD public node of an HD private node.
 *
 * Though private keys cannot be derived from HD public keys, sharing HD public
 * keys still carries risk. Along with allowing an attacker to associate wallet
 * addresses together (breaking privacy), should an attacker gain knowledge of a
 * single child private key, **it's possible to derive all parent HD private
 * keys**. See {@link crackHdPrivateNodeFromHdPublicNodeAndChildPrivateNode} for
 * details.
 *
 * To derive an HD public key from an encoded HD private key,
 * use {@link deriveHdPublicKey}.
 *
 * @param node - A valid HD private node.
 */
export const deriveHdPublicNode = <
  PrivateNode extends HdPrivateNodeValid = HdPrivateNodeValid,
>(
  node: PrivateNode,
  {
    crypto = { secp256k1: internalSecp256k1 },
  }: {
    /**
     * An optional object containing an implementation of secp256k1
     * compressed public key derivation to use.
     */
    crypto?: {
      secp256k1: {
        derivePublicKeyCompressed: Secp256k1['derivePublicKeyCompressed'];
      };
    };
  } = {},
) =>
  ({
    chainCode: node.chainCode,
    childIndex: node.childIndex,
    depth: node.depth,
    parentFingerprint: node.parentFingerprint,
    ...(node.parentIdentifier === undefined
      ? {}
      : { parentIdentifier: node.parentIdentifier }),
    publicKey: crypto.secp256k1.derivePublicKeyCompressed(node.privateKey),
  }) as PrivateNode extends HdPrivateNodeKnownParent
    ? HdPublicNodeKnownParent
    : HdPublicNodeValid;

/**
 * Derive the HD public key of an HD private key.
 *
 * Though private keys cannot be derived from HD public keys, sharing HD public
 * keys still carries risk. Along with allowing an attacker to associate wallet
 * addresses together (breaking privacy), should an attacker gain knowledge of a
 * single child private key, **it's possible to derive all parent HD private
 * keys**. See {@link crackHdPrivateNodeFromHdPublicNodeAndChildPrivateNode} for
 * details.
 *
 * To derive the HD public node of an already-decoded HD private node,
 * use {@link deriveHdPublicNode}.
 *
 * Note that this function defaults to throwing errors. To handle errors in a
 * type-safe way, set `throwErrors` to `false`.
 *
 * @param hdPrivateKey - A BIP32 HD private key.
 */
export const deriveHdPublicKey = <ThrowErrors extends boolean = true>(
  privateKey: string,
  {
    crypto = { secp256k1: internalSecp256k1, sha256: internalSha256 },
    throwErrors = true as ThrowErrors,
  }: {
    /**
     * An optional object containing an implementation of sha256 and a Secp256k1
     * `derivePublicKeyCompressed` and `validatePublicKey` to use.
     */
    crypto?: {
      secp256k1: {
        derivePublicKeyCompressed: Secp256k1['derivePublicKeyCompressed'];
        validatePublicKey: Secp256k1['validatePublicKey'];
      };
      sha256: {
        hash: Sha256['hash'];
      };
    };
    /**
     * If `true`, this function will throw an `Error` when the provided HD
     * private key is invalid rather than returning the error as a string
     * (defaults to `true`).
     */
    throwErrors?: ThrowErrors;
  } = {},
): ThrowErrors extends true
  ? HdPublicKeyEncodeResult
  : HdPublicKeyEncodeResult | string => {
  const decoded = decodeHdPrivateKey(privateKey, { crypto });
  if (typeof decoded === 'string') {
    return formatError(decoded, undefined, throwErrors);
  }
  const node = deriveHdPublicNode(decoded.node, { crypto });
  return encodeHdPublicKey(
    { network: decoded.network, node },
    { crypto, throwErrors },
  );
};

/**
 * Derive a child HD private node from an HD private node.
 *
 * To derive a child HD public node, use {@link deriveHdPublicNode} on the
 * result of this method. If the child uses a non-hardened index, it's also
 * possible to use {@link deriveHdPublicNodeChild}.
 *
 * Note that this function defaults to throwing errors. To handle errors in a
 * type-safe way, set `throwErrors` to `false`.
 *
 * This function has a less than 1 in 2^127 probability of producing
 * an invalid result (where the resulting private key is not a valid Secp256k1
 * private key, see {@link validateSecp256k1PrivateKey}). While this scenario is
 * unlikely to ever occur without a weakness in HMAC-SHA512, the
 * `returnInvalidNodes` parameter can be set to `true` to return the resulting
 * {@link HdPrivateNodeInvalid} rather than an error (defaults to `false`).
 *
 * @param node - The valid HD private node from which to derive the child node.
 * @param index - The index at which to derive the child node - indexes greater
 * than or equal to the hardened index offset (`0x80000000`/`2147483648`) are
 * derived using the "hardened" derivation algorithm.
 */
// eslint-disable-next-line complexity
export const deriveHdPrivateNodeChild = <
  ThrowErrors extends boolean = true,
  ReturnInvalidNodes extends boolean = false,
>(
  node: HdPrivateNodeValid,
  index: number,
  {
    crypto = {
      ripemd160: internalRipemd160,
      secp256k1: internalSecp256k1,
      sha256: internalSha256,
      sha512: internalSha512,
    },
    throwErrors = true as ThrowErrors,
    returnInvalidNodes = false as ReturnInvalidNodes,
  }: {
    /**
     * An optional object containing implementations of sha256,  ripemd160,
     * secp256k1 compressed public key derivation, and secp256k1 private key
     * "tweak addition" (application of the EC group operation).
     */
    crypto?: {
      ripemd160: { hash: Ripemd160['hash'] };
      secp256k1: {
        addTweakPrivateKey: Secp256k1['addTweakPrivateKey'];
        derivePublicKeyCompressed: Secp256k1['derivePublicKeyCompressed'];
      };
      sha256: { hash: Sha256['hash'] };
      sha512: { hash: Sha512['hash'] };
    };
    /**
     * If `true`, this function will throw an `Error` rather than returning
     * derivation errors as a string (defaults to `true`).
     */
    throwErrors?: ThrowErrors;
    /**
     * If `false`, invalid derivations (probability less than 1 in 2^127) will
     * produce an error rather than an {@link HdPrivateNodeInvalid} (defaults
     * to `false`). To return the invalid node rather than throwing an error,
     * `throwErrors` must also be set to `false`.
     */
    returnInvalidNodes?: ReturnInvalidNodes;
  } = {},
): ThrowErrors extends true
  ? HdPrivateNodeKnownParent
  : ReturnInvalidNodes extends false
    ? HdPrivateNodeKnownParent | string
    : HdPrivateNodeKnownParent<HdPrivateNode> | string => {
  const maximumIndex = 0xffffffff;
  if (index > maximumIndex) {
    return formatError(
      HdNodeDerivationError.childIndexExceedsMaximum,
      `Child index: ${index}.`,
      throwErrors,
    );
  }
  const parentIdentifier = deriveHdPrivateNodeIdentifier(node, { crypto });
  const parentFingerprint = parentIdentifier.slice(
    0,
    Bip32Constants.parentFingerprintLength,
  );
  const depth = node.depth + 1;
  const hardenedIndexOffset = 0x80000000;
  const useHardenedAlgorithm = index >= hardenedIndexOffset;
  const keyMaterial = useHardenedAlgorithm
    ? node.privateKey
    : (crypto.secp256k1.derivePublicKeyCompressed(
        node.privateKey,
      ) as Uint8Array);

  const serialization = Uint8Array.from([
    ...(useHardenedAlgorithm ? [0x00] : []),
    ...keyMaterial,
    ...numberToBinUint32BE(index),
  ]);
  const derivation = hmacSha512(node.chainCode, serialization, crypto.sha512);
  const tweakValueLength = 32;
  const tweakValue = derivation.slice(0, tweakValueLength);
  const nextChainCode = derivation.slice(tweakValueLength);
  const nextPrivateKey = crypto.secp256k1.addTweakPrivateKey(
    node.privateKey,
    tweakValue,
  );
  if (typeof nextPrivateKey === 'string') {
    const error = formatError(
      HdNodeDerivationError.invalidDerivedKey,
      `Invalid child index: ${index}.`,
      throwErrors,
    );
    if (returnInvalidNodes) {
      return {
        chainCode: nextChainCode,
        childIndex: index,
        depth,
        invalidMaterial: tweakValue,
        parentFingerprint,
        parentIdentifier,
      } as ThrowErrors extends true
        ? HdPrivateNodeKnownParent
        : ReturnInvalidNodes extends false
          ? HdPrivateNodeKnownParent | string
          : HdPrivateNodeKnownParent<HdPrivateNode> | string;
    }
    return error;
  }
  return {
    chainCode: nextChainCode,
    childIndex: index,
    depth,
    parentFingerprint,
    parentIdentifier,
    privateKey: nextPrivateKey,
  } as HdPrivateNodeKnownParent;
};

/**
 * Derive a non-hardened, child HD public node from an HD public node.
 *
 * Because hardened derivation also requires knowledge of the parent private
 * node, it's not possible to use an HD public node to derive a hardened child
 * HD public node. (See {@link deriveHdPath} or {@link deriveHdPublicNode}.)
 *
 * Though private keys cannot be derived from HD public keys, sharing HD public
 * keys still carries risk. Along with allowing an attacker to associate wallet
 * addresses together (breaking privacy), should an attacker gain knowledge of a
 * single child private key, **it's possible to derive all parent HD private
 * keys**. See {@link crackHdPrivateNodeFromHdPublicNodeAndChildPrivateNode}
 * for details.
 *
 * This function has a less than 1 in 2^127 probability of producing
 * an invalid result (where the resulting public key is not a valid Secp256k1
 * public key). While this scenario is unlikely to ever occur without a weakness
 * in HMAC-SHA512, the `returnInvalidNodes` parameter can be set to `true` to
 * return the resulting {@link HdPrivateNodeInvalid} rather than an error
 * (defaults to `false`).
 *
 * @param node - The valid HD public node from which to derive the child
 * public node.
 * @param index - The index at which to derive the child node.
 */
export const deriveHdPublicNodeChild = <
  ThrowErrors extends boolean = true,
  ReturnInvalidNodes extends boolean = false,
>(
  node: HdPublicNodeValid,
  index: number,
  {
    crypto = {
      ripemd160: internalRipemd160,
      secp256k1: internalSecp256k1,
      sha256: internalSha256,
      sha512: internalSha512,
    },
    returnInvalidNodes = false as ReturnInvalidNodes,
    throwErrors = true as ThrowErrors,
  }: {
    /**
     * An optional object containing implementations of sha256, sha512,
     * ripemd160, and secp256k1 compressed public key "tweak addition"
     * (application of the EC group operation).
     */
    crypto?: {
      ripemd160: { hash: Ripemd160['hash'] };
      secp256k1: {
        addTweakPublicKeyCompressed: Secp256k1['addTweakPublicKeyCompressed'];
      };
      sha256: { hash: Sha256['hash'] };
      sha512: { hash: Sha512['hash'] };
    };
    /**
     * If `false`, invalid derivations (probability less than 1 in 2^127) will
     * return an error rather than an {@link HdPublicNodeInvalid} (defaults
     * to `false`). To return the invalid node rather than throwing an error,
     * `throwErrors` must also be set to `false`.
     */
    returnInvalidNodes?: ReturnInvalidNodes;
    /**
     * If `true`, this function will throw an `Error` rather than returning
     * derivation errors as a string (defaults to `true`).
     */
    throwErrors?: ThrowErrors;
  } = {},
): ThrowErrors extends true
  ? HdPublicNodeKnownParent
  : ReturnInvalidNodes extends false
    ? HdPublicNodeKnownParent | string
    : HdPublicNodeKnownParent<HdPublicNode> | string => {
  const hardenedIndexOffset = 0x80000000;
  if (index >= hardenedIndexOffset) {
    return formatError(
      HdNodeDerivationError.hardenedDerivationRequiresPrivateNode,
      `Requested index: ${index}.`,
      throwErrors,
    );
  }
  const parentIdentifier = deriveHdPublicNodeIdentifier(node, { crypto });
  const parentFingerprint = parentIdentifier.slice(
    0,
    Bip32Constants.parentFingerprintLength,
  );
  const depth = node.depth + 1;
  const serialization = Uint8Array.from([
    ...node.publicKey,
    ...numberToBinUint32BE(index),
  ]);
  const derivation = hmacSha512(node.chainCode, serialization, crypto.sha512);
  const tweakValueLength = 32;
  const tweakValue = derivation.slice(0, tweakValueLength);
  const nextChainCode = derivation.slice(tweakValueLength);
  const nextPublicKey = crypto.secp256k1.addTweakPublicKeyCompressed(
    node.publicKey,
    tweakValue,
  );
  if (typeof nextPublicKey === 'string') {
    const error = formatError(
      HdNodeDerivationError.invalidDerivedKey,
      `Invalid child index: ${index}.`,
      throwErrors,
    );
    if (returnInvalidNodes) {
      return {
        chainCode: nextChainCode,
        childIndex: index,
        depth,
        invalidMaterial: tweakValue,
        parentFingerprint,
        parentIdentifier,
      } as ThrowErrors extends true
        ? HdPublicNodeKnownParent
        : ReturnInvalidNodes extends false
          ? HdPublicNodeKnownParent | string
          : HdPublicNodeKnownParent<HdPublicNode> | string;
    }
    return error;
  }
  return {
    chainCode: nextChainCode,
    childIndex: index,
    depth,
    parentFingerprint,
    parentIdentifier,
    publicKey: nextPublicKey,
  } as HdPublicNodeKnownParent;
};

export type HdNodeKnownParent<
  NodeType extends HdPrivateNodeValid | HdPublicNodeValid,
> = NodeType extends HdPrivateNodeValid
  ? HdPrivateNodeKnownParent
  : HdPublicNodeKnownParent;

type RelativeDerivation<
  NodeType extends HdPrivateNodeValid | HdPublicNodeValid,
  Path extends string,
> = Path extends '' ? NodeType : HdNodeKnownParent<NodeType>;

/**
 * Derive a child HD node from a parent node given a relative derivation path.
 * The resulting node is the same type as the parent node – private nodes return
 * private nodes, public nodes return public nodes. (To prevent implementation
 * errors, this function will not internally derive a public node from any
 * private node; for public derivation, use {@link deriveHdPublicNode} at the
 * desired BIP32 account level and provide the HD public key to this function.)
 *
 * Where possible, consider instead using {@link deriveHdPath} to reduce the
 * likelihood of implementation errors.
 *
 * By default, this function throws an `Error` rather than returning the error
 * as string when the provided path is invalid or cannot be derived from the
 * provided HD node (e.g. the path requests an excessive child index, a hardened
 * path is requested from a public node, or an astronomically rare HMAC-SHA512
 * result produces and invalid node).
 *
 * While the throwing behavior is reasonable for the common case of deriving
 * known, fixed paths (e.g. the BCH account as standardized by SLIP44 at
 * `m/44'/145'/0'`), **it is recommended that `throwErrors` be set to `false`
 * for use cases where dynamic or user-specified paths might be derived**. In
 * these cases, deliberate error handling is recommended, e.g. saving any data
 * and safely shutting down, displaying troubleshooting information to the
 * user, etc.
 *
 * The derivation path uses the notation specified in BIP32; see
 * {@link deriveHdPath} for details.
 *
 * @param node - The HD node from which to begin the derivation – for private
 * derivation, an {@link HdPrivateNodeValid}; for public derivation,
 * an {@link HdPublicNodeValid}.
 * @param path - The relative BIP32 derivation path, e.g. `1'/2` or `3/4/5`.
 */
export const deriveHdPathRelative = <
  NodeType extends HdPrivateNodeValid | HdPublicNodeValid,
  Path extends string,
  ThrowErrors extends boolean = true,
>(
  node: NodeType,
  path: Path,
  {
    crypto = {
      ripemd160: internalRipemd160,
      secp256k1: internalSecp256k1,
      sha256: internalSha256,
      sha512: internalSha512,
    },
    throwErrors = true as ThrowErrors,
  }: {
    /**
     * An optional object containing implementations of sha256 hashing, sha512
     * hashing, ripemd160 hashing, and secp256k1 derivation functions.
     */
    crypto?: {
      ripemd160: { hash: Ripemd160['hash'] };
      secp256k1: {
        addTweakPrivateKey: Secp256k1['addTweakPrivateKey'];
        addTweakPublicKeyCompressed: Secp256k1['addTweakPublicKeyCompressed'];
        derivePublicKeyCompressed: Secp256k1['derivePublicKeyCompressed'];
      };
      sha256: { hash: Sha256['hash'] };
      sha512: { hash: Sha512['hash'] };
    };
    /**
     * If `true`, this function will throw an `Error` rather than returning the
     * error as a string when the provided path is invalid or cannot be derived
     * from the provided HD node (defaults to `true`).
     */
    throwErrors?: ThrowErrors;
  } = {},
): ThrowErrors extends true
  ? RelativeDerivation<NodeType, Path>
  : RelativeDerivation<NodeType, Path> | string => {
  if (path === '') {
    return node as RelativeDerivation<NodeType, Path>;
  }
  const validRelativeDerivationPath = /^(?:[0-9]+'?)(?:\/[0-9]+'?)*$/u;
  if (!validRelativeDerivationPath.test(path)) {
    return formatError(
      HdNodeDerivationError.invalidRelativeDerivationPath,
      `Invalid path: "${path}".`,
      throwErrors,
    );
  }
  const parsed = path.split('/');
  const isPrivateDerivation = 'privateKey' in node;
  const base = 10;
  const hardenedIndexOffset = 0x80000000;
  const indexes = parsed.map((index) =>
    index.endsWith("'")
      ? parseInt(index.slice(0, -1), base) + hardenedIndexOffset
      : parseInt(index, base),
  );
  return (
    isPrivateDerivation
      ? indexes.reduce<HdPrivateNodeValid | string>(
          (result, nextIndex) =>
            typeof result === 'string'
              ? result
              : deriveHdPrivateNodeChild(result, nextIndex, {
                  crypto,
                  throwErrors,
                }),
          node,
        )
      : indexes.reduce<HdPublicNodeValid | string>(
          (result, nextIndex) =>
            typeof result === 'string'
              ? result
              : deriveHdPublicNodeChild(result, nextIndex, {
                  crypto,
                  throwErrors,
                }),
          node,
        )
  ) as ThrowErrors extends true
    ? RelativeDerivation<NodeType, Path>
    : RelativeDerivation<NodeType, Path> | string;
};

type AbsoluteDerivation<
  NodeType extends HdPrivateNodeValid | HdPublicNodeValid,
  Path extends string,
> = NodeType extends HdNodeKnownParent<HdPrivateNodeValid | HdPublicNodeValid>
  ? /* deriveHdPath requires a master key for absolute derivation */
    never
  : Path extends 'M'
    ? NodeType extends HdPublicNodeValid
      ? NodeType
      : /* Only public nodes can return themselves */
        never
    : Path extends 'm'
      ? NodeType extends HdPrivateNodeValid
        ? NodeType
        : /* Only private nodes can return themselves */
          never
      : /**
         * Unfortunately, paths of type `string` can still have the value `m` or
         * `M`, so we still have to return `NodeType` in this union:
         */
        HdNodeKnownParent<NodeType> | NodeType;

/**
 * Derive a child HD node from a master node given an absolute derivation path.
 * The resulting node is the same type as the parent node – private nodes return
 * private nodes, public nodes return public nodes. (To prevent implementation
 * errors, this function will not internally derive a public node from any
 * private node; for public derivation, use {@link deriveHdPublicNode} at the
 * desired BIP32 account level and provide the HD public key to this function.)
 *
 * The derivation path uses the notation specified in BIP32: the first character
 * must be either `m` for private derivation or `M` for public derivation,
 * followed by sets of `/` and a number representing the child index used in the
 * derivation at that depth. Hardened derivation is represented by a trailing
 * `'`, and may only appear in private derivation paths (hardened derivation
 * requires knowledge of the private key). Hardened child indexes are
 * represented with the hardened index offset (`2147483648`) subtracted.
 *
 * For example, `m/0/1'/2` uses private derivation (`m`), with child indexes in
 * the following order:
 *
 * `derivePrivate(derivePrivate(derivePrivate(node, 0), 2147483648 + 1), 2)`
 *
 * Likewise, `M/3/4/5` uses public derivation (`M`), with child indexes in the
 * following order:
 *
 * `derivePublic(derivePublic(derivePublic(node, 3), 4), 5)`
 *
 * Because hardened derivation requires a private node, paths that specify
 * public derivation (`M`) using hardened derivation (`'`) will return an error.
 * To derive the public node associated with a child private node that requires
 * hardened derivation, begin with private derivation, then provide the result
 * to {@link deriveHdPublicNode} or {@link deriveHdPathRelative}.
 *
 * By default, this function throws an `Error` rather than returning the error
 * as string when the provided path is invalid or cannot be derived from the
 * provided HD node (e.g. the path requests an excessive child index, a hardened
 * path is requested from a public node, or an astronomically rare HMAC-SHA512
 * result produces and invalid node).
 *
 * While the throwing behavior is reasonable for the common case of deriving
 * known, fixed paths (e.g. the BCH account as standardized by SLIP44 at
 * `m/44'/145'/0'`), **it is recommended that `throwErrors` be set to `false`
 * for use cases where dynamic or user-specified paths might be derived**. In
 * these cases, deliberate error handling is recommended, e.g. saving any data
 * and safely shutting down, displaying troubleshooting information to the
 * user, etc.
 *
 * @param node - The HD node from which to begin the derivation – for paths
 * beginning with `m`, an {@link HdPrivateNodeValid}; for paths beginning with
 * `M`, an {@link HdPublicNodeValid}.
 * @param path - The BIP32 derivation path, e.g. `m/0/1'/2` or `M/3/4/5`.
 */
// eslint-disable-next-line complexity
export const deriveHdPath = <
  NodeType extends HdPrivateNodeValid | HdPublicNodeValid,
  Path extends string,
  ThrowErrors extends boolean = true,
>(
  node: NodeType,
  path: Path,
  {
    crypto = {
      ripemd160: internalRipemd160,
      secp256k1: internalSecp256k1,
      sha256: internalSha256,
      sha512: internalSha512,
    },
    throwErrors = true as ThrowErrors,
  }: {
    /**
     * An optional object containing implementations of sha256 hashing, sha512
     * hashing, ripemd160 hashing, and secp256k1 derivation functions.
     */
    crypto?: {
      ripemd160: { hash: Ripemd160['hash'] };
      secp256k1: {
        addTweakPrivateKey: Secp256k1['addTweakPrivateKey'];
        addTweakPublicKeyCompressed: Secp256k1['addTweakPublicKeyCompressed'];
        derivePublicKeyCompressed: Secp256k1['derivePublicKeyCompressed'];
      };
      sha256: { hash: Sha256['hash'] };
      sha512: { hash: Sha512['hash'] };
    };
    /**
     * If `true`, this function will throw an `Error` rather than returning the
     * error as a string when the provided path is invalid or cannot be derived
     * from the provided HD node (defaults to `true`).
     */
    throwErrors?: ThrowErrors;
  } = {},
): ThrowErrors extends true
  ? AbsoluteDerivation<NodeType, Path>
  : AbsoluteDerivation<NodeType, Path> | string => {
  if (node.depth !== 0) {
    return formatError(
      HdNodeDerivationError.requiresZeroDepthNode,
      `Depth of provided HD node: ${node.depth}.`,
      throwErrors,
    );
  }
  const validDerivationPath = /^[mM](?:\/[0-9]+'?)*$/u;
  if (!validDerivationPath.test(path)) {
    return formatError(
      HdNodeDerivationError.invalidAbsoluteDerivationPath,
      `Invalid path: "${path}".`,
      throwErrors,
    );
  }
  const parsed = path.split('/');
  const isPrivateDerivation = 'privateKey' in node;
  if (isPrivateDerivation && parsed[0] !== 'm') {
    return formatError(
      HdNodeDerivationError.invalidPrivateDerivationPrefix,
      `Invalid path: "${path}".`,
      throwErrors,
    );
  }
  if (!isPrivateDerivation && parsed[0] !== 'M') {
    return formatError(
      HdNodeDerivationError.invalidPublicDerivationPrefix,
      `Invalid path: "${path}".`,
      throwErrors,
    );
  }
  if (parsed.length === 1) {
    return node as AbsoluteDerivation<NodeType, Path>;
  }

  const relativePath = parsed.slice(1).join('/');
  return deriveHdPathRelative(node, relativePath, {
    crypto,
    throwErrors,
  }) as AbsoluteDerivation<NodeType, Path>;
};

export enum HdNodeCrackingError {
  cannotCrackHardenedDerivation = 'HD node cracking error: cannot crack an HD parent node using hardened child node.',
}

/**
 * Derive the HD private node from a HD public node, given any non-hardened
 * child private node.
 *
 * This exploits the "non-hardened" BIP32 derivation algorithm. Because
 * non-hardened derivation only requires knowledge of the "chain code" (rather
 * than requiring knowledge of the parent private key) it's possible to
 * calculate the value by which the parent private key is "tweaked" to arrive at
 * the child private key. Since we have the child private key, we simply
 * subtract this "tweaked" amount to get back to the parent private key.
 *
 * The BIP32 "hardened" derivation algorithm is designed to address this
 * weakness. Using hardened derivation, child private nodes can be shared
 * without risk of leaking the parent private node, but this comes at the cost
 * of public node derivation. Given only a parent public node, it is not
 * possible to derive hardened child public keys, so applications must choose
 * between support for HD public node derivation or support for sharing child
 * private nodes.
 *
 * @param parentPublicNode - the parent HD public node for which to derive a
 * private node.
 * @param childPrivateNode - Any non-hardened child private node of the parent
 * node (only the `privateKey` and the `childIndex` are required).
 */
export const crackHdPrivateNodeFromHdPublicNodeAndChildPrivateNode = <
  PublicNode extends HdPublicNodeValid = HdPublicNodeValid,
>(
  parentPublicNode: PublicNode,
  childPrivateNode: { childIndex: number; privateKey: Uint8Array },
  {
    crypto = { sha512: internalSha512 },
  }: {
    /**
     * An optional object containing an implementation of sha512.
     */
    crypto?: { sha512: { hash: Sha512['hash'] } };
  } = {},
) => {
  const hardenedIndexOffset = 0x80000000;
  if (childPrivateNode.childIndex >= hardenedIndexOffset) {
    return HdNodeCrackingError.cannotCrackHardenedDerivation;
  }
  const serialization = Uint8Array.from([
    ...parentPublicNode.publicKey,
    ...numberToBinUint32BE(childPrivateNode.childIndex),
  ]);

  const derivation = hmacSha512(
    parentPublicNode.chainCode,
    serialization,
    crypto.sha512,
  );
  const tweakValueLength = 32;
  const tweakValue = binToBigIntUint256BE(
    derivation.slice(0, tweakValueLength),
  );
  const childPrivateValue = binToBigIntUint256BE(childPrivateNode.privateKey);
  const secp256k1OrderN =
    0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n;
  const trueMod = (n: bigint, m: bigint) => ((n % m) + m) % m;

  const parentPrivateValue = trueMod(
    childPrivateValue - tweakValue,
    secp256k1OrderN,
  );
  const privateKey = bigIntToBinUint256BEClamped(parentPrivateValue);

  return {
    chainCode: parentPublicNode.chainCode,
    childIndex: parentPublicNode.childIndex,
    depth: parentPublicNode.depth,
    parentFingerprint: parentPublicNode.parentFingerprint,
    ...(parentPublicNode.parentIdentifier === undefined
      ? {}
      : { parentIdentifier: parentPublicNode.parentIdentifier }),
    privateKey,
  } as PublicNode extends HdPublicNodeKnownParent
    ? HdPrivateNodeKnownParent
    : HdPrivateNodeValid;
};
