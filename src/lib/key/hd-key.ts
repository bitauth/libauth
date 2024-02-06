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
  BaseConversionError,
  bigIntToBinUint256BEClamped,
  binToBase58,
  binToBigIntUint256BE,
  flattenBinArray,
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
 * `0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364140`
 * is a valid private key. This range is part of the definition of the
 * secp256k1 elliptic curve parameters.
 *
 * This method does not require a `Secp256k1` implementation.
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
  const maximumSecp256k1PrivateKey = [255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 254, 186, 174, 220, 230, 175, 72, 160, 59, 191, 210, 94, 140, 208, 54, 65, 63]; // eslint-disable-line @typescript-eslint/no-magic-numbers

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

/**
 * The decoded contents of an HD public or private key.
 */
export type HdKeyParameters<
  NodeType extends HdPrivateNodeValid | HdPublicNode,
> = {
  node: NodeType;
  network: HdKeyNetwork;
};

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
  valid: true;
};

/**
 * An invalid private node in a Hierarchical Deterministic (HD) key tree. This
 * is almost impossibly rare in a securely-random 32-byte Uint8Array, with a
 * probability less than 1 in 2^127.
 *
 * If this occurs during derivation from a seed, the error should be handled
 * and a different seed should be used. If this occurs during HD derivation,
 * BIP32 standardizes the procedure for skipping the offending key material by
 * using the next child index. I.e. the node ultimately derived at the invalid
 * child index is a duplicate of the node derived at `index + 1`.
 */
export type HdPrivateNodeInvalid = HdNodeBase & {
  /**
   * The 32-byte derivation result that is not a valid Secp256k1 private key.
   * This is almost impossibly rare in a securely-random 32-byte Uint8Array,
   * with a probability less than 1 in 2^127.
   *
   * See {@link validateSecp256k1PrivateKey} for details.
   */
  invalidPrivateKey: Uint8Array;
  valid: false;
};

/**
 * A valid HD private node for which the parent node is known (and
 * `parentIdentifier` is guaranteed to be defined).
 */
export type HdPrivateNodeKnownParent = HdPrivateNodeValid & {
  parentIdentifier: Uint8Array;
};

/**
 * A private node in a Hierarchical Deterministic (HD) key tree. To confirm the
 * validity of this node, check the value of its `valid` property.
 *
 * Note, HD nodes are network-independent. A network is required only when
 * encoding the node as an HD key or using a derived public key in an address.
 */
export type HdPrivateNode = HdPrivateNodeInvalid | HdPrivateNodeValid;

/**
 * A public node in a Hierarchical Deterministic (HD) key tree.
 *
 * Note, HD nodes are network-independent. A network is required only when
 * encoding the node as an HD key or using a derived public key in an address.
 */
export type HdPublicNode = HdNodeBase & {
  /**
   * This {@link HdPublicNode}'s valid 33-byte Secp256k1 compressed public key.
   */
  publicKey: Uint8Array;
};

/**
 * An HD public node for which the parent node is known (and `parentIdentifier`
 * is guaranteed to be defined).
 */
export type HdPublicNodeKnownParent = HdPublicNode & {
  parentIdentifier: Uint8Array;
};

/**
 * The HMAC SHA-512 key used by BIP32, "Bitcoin seed"
 * (`utf8ToBin('Bitcoin seed')`)
 */
const bip32HmacSha512Key = utf8ToBin('Bitcoin seed');
const halfHmacSha512Length = 32;
/**
 * Derive an {@link HdPrivateNode} from the provided seed following the BIP32
 * specification. A seed should include between 16 bytes and 64 bytes of
 * entropy (recommended: 32 bytes).
 *
 * @param seed - the entropy from which to derive the {@link HdPrivateNode}
 * @param assumeValidity - if set, the derived private key will not be checked
 * for validity, and will be assumed valid if `true` or invalid if `false` (this
 * is useful for testing)
 * @param crypto - an optional object containing an implementation of sha512
 * @param hmacSha512Key - the HMAC SHA-512 key to use (defaults the HMAC SHA-512
 * key used by BIP32, `utf8ToBin('Bitcoin seed')`
 */
export const deriveHdPrivateNodeFromSeed = <
  AssumedValidity extends boolean | undefined,
>(
  seed: Uint8Array,
  assumeValidity?: AssumedValidity,
  crypto: { sha512: { hash: Sha512['hash'] } } = {
    sha512: internalSha512,
  },
  hmacSha512Key = bip32HmacSha512Key,
  // eslint-disable-next-line @typescript-eslint/max-params
) => {
  const mac = hmacSha512(hmacSha512Key, seed, crypto.sha512);
  const privateKey = mac.slice(0, halfHmacSha512Length);
  const chainCode = mac.slice(halfHmacSha512Length);
  const depth = 0;
  const childIndex = 0;
  const parentFingerprint = Uint8Array.from([0, 0, 0, 0]);
  const valid = assumeValidity ?? validateSecp256k1PrivateKey(privateKey);
  return (
    valid
      ? { chainCode, childIndex, depth, parentFingerprint, privateKey, valid }
      : {
          chainCode,
          childIndex,
          depth,
          invalidPrivateKey: privateKey,
          parentFingerprint,
          valid,
        }
  ) as AssumedValidity extends true
    ? HdPrivateNodeValid
    : AssumedValidity extends false
      ? HdPrivateNodeInvalid
      : HdPrivateNode;
};

/**
 * Derive the public identifier for a given {@link HdPrivateNode}. This is used
 * to uniquely identify HD nodes in software. The first 4 bytes of this
 * identifier are considered its "fingerprint".
 *
 * @param hdPrivateNode - the {@link HdPrivateNode} from which to derive the
 * public identifier (not require to be valid)
 * @param crypto - an optional object containing implementations implementations
 * of sha256, ripemd160, and secp256k1 compressed public key derivation to use
 */
export const deriveHdPrivateNodeIdentifier = (
  hdPrivateNode: HdPrivateNodeValid,
  crypto: {
    sha256: { hash: Sha256['hash'] };
    ripemd160: { hash: Ripemd160['hash'] };
    secp256k1: {
      derivePublicKeyCompressed: Secp256k1['derivePublicKeyCompressed'];
    };
  } = {
    ripemd160: internalRipemd160,
    secp256k1: internalSecp256k1,
    sha256: internalSha256,
  },
) => {
  const publicKey = crypto.secp256k1.derivePublicKeyCompressed(
    hdPrivateNode.privateKey,
  );
  if (typeof publicKey === 'string') return publicKey;
  return crypto.ripemd160.hash(crypto.sha256.hash(publicKey));
};

/**
 * Derive the public identifier for a given {@link HdPublicNode}. This is used
 * to uniquely identify HD nodes in software. The first 4 bytes of this
 * identifier are considered its fingerprint.
 *
 * @param node - the {@link HdPublicNode} from which to derive the identifier
 * @param crypto - an optional object containing implementations of sha256 and
 * ripemd160 to use
 */
export const deriveHdPublicNodeIdentifier = (
  node: HdPublicNode,
  crypto: {
    ripemd160: { hash: Ripemd160['hash'] };
    sha256: { hash: Sha256['hash'] };
  } = { ripemd160: internalRipemd160, sha256: internalSha256 },
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

/**
 * An error in the decoding of an HD public or private key.
 */
export enum HdKeyDecodingError {
  incorrectLength = 'HD key decoding error: length is incorrect (must encode 82 bytes).',
  invalidChecksum = 'HD key decoding error: checksum is invalid.',
  invalidPrivateNode = 'HD key decoding error: the key for this HD private node is not a valid Secp256k1 private key.',
  missingPrivateKeyPaddingByte = 'HD key decoding error: version indicates a private key, but the key data is missing a padding byte.',
  privateKeyExpected = 'HD key decoding error: expected an HD private key, but encountered an HD public key.',
  publicKeyExpected = 'HD key decoding error: expected an HD public key, but encountered an HD private key.',
  unknownCharacter = 'HD key decoding error: key includes a non-base58 character.',
  unknownVersion = 'HD key decoding error: key uses an unknown version.',
}

/**
 * Decode an HD private key as defined by BIP32, returning a `node` and a
 * `network`. Decoding errors are returned as strings.
 *
 * If the type of the key is known, use {@link decodeHdPrivateKey} or
 * {@link decodeHdPublicKey}.
 *
 * @param hdKey - a BIP32 HD private key or HD public key
 * @param crypto -  an optional object containing an implementation of sha256
 * to use
 */
// eslint-disable-next-line complexity
export const decodeHdKey = (
  hdKey: string,
  crypto: { sha256: { hash: Sha256['hash'] } } = { sha256: internalSha256 },
) => {
  const decoded = base58ToBin(hdKey);
  if (decoded === BaseConversionError.unknownCharacter)
    return HdKeyDecodingError.unknownCharacter;

  const expectedLength = 82;
  if (decoded.length !== expectedLength)
    return HdKeyDecodingError.incorrectLength;

  const checksumIndex = 78;
  const payload = decoded.slice(0, checksumIndex);
  const checksumBits = decoded.slice(checksumIndex);
  const checksum = crypto.sha256.hash(crypto.sha256.hash(payload));
  if (!checksumBits.every((value, i) => value === checksum[i])) {
    return HdKeyDecodingError.invalidChecksum;
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
  const keyData = decoded.slice(keyDataIndex, checksumIndex);

  const isPrivateKey =
    version === HdKeyVersion.mainnetPrivateKey ||
    version === HdKeyVersion.testnetPrivateKey;

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
            valid: true,
          } as HdPrivateNodeValid)
        : ({
            chainCode,
            childIndex,
            depth,
            invalidPrivateKey: privateKey,
            parentFingerprint,
            valid: false,
          } as HdPrivateNodeInvalid),
      version,
    };
  }

  const isPublicKey =
    version === HdKeyVersion.mainnetPublicKey ||
    version === HdKeyVersion.testnetPublicKey;

  if (!isPublicKey) {
    return HdKeyDecodingError.unknownVersion;
  }

  return {
    node: {
      chainCode,
      childIndex,
      depth,
      parentFingerprint,
      publicKey: keyData,
    } as HdPublicNode,
    version,
  };
};

/**
 * Decode an HD private key as defined by BIP32.
 *
 * This method is similar to {@link decodeHdKey} but ensures that the result is
 * a valid HD private node. Decoding error messages are returned as strings.
 *
 * @param hdPrivateKey - a BIP32 HD private key
 * @param crypto -  an optional object containing an implementation of sha256
 * to use
 */
export const decodeHdPrivateKey = (
  hdPrivateKey: string,
  crypto: { sha256: { hash: Sha256['hash'] } } = { sha256: internalSha256 },
) => {
  const decoded = decodeHdKey(hdPrivateKey, crypto);
  if (typeof decoded === 'string') return decoded;

  if ('publicKey' in decoded.node) {
    return HdKeyDecodingError.privateKeyExpected;
  }

  if (!decoded.node.valid) {
    return HdKeyDecodingError.invalidPrivateNode;
  }

  if (decoded.version === HdKeyVersion.mainnetPrivateKey) {
    return {
      network: 'mainnet',
      node: decoded.node,
    } as HdKeyParameters<HdPrivateNodeValid>;
  }

  return {
    network: 'testnet',
    node: decoded.node,
  } as HdKeyParameters<HdPrivateNodeValid>;
};

/**
 * Decode an HD public key as defined by BIP32.
 *
 * This method is similar to {@link decodeHdKey} but ensures that the result is
 * an HD public node. Decoding error messages are returned as strings.
 *
 * @param hdPublicKey - a BIP32 HD public key
 * @param crypto - an optional object containing an implementation of sha256
 * to use
 */
export const decodeHdPublicKey = (
  hdPublicKey: string,
  crypto: { sha256: { hash: Sha256['hash'] } } = { sha256: internalSha256 },
) => {
  const decoded = decodeHdKey(hdPublicKey, crypto);
  if (typeof decoded === 'string') return decoded;

  if (decoded.version === HdKeyVersion.mainnetPublicKey) {
    return {
      network: 'mainnet',
      node: decoded.node,
    } as HdKeyParameters<HdPublicNode>;
  }
  if (decoded.version === HdKeyVersion.testnetPublicKey) {
    return {
      network: 'testnet',
      node: decoded.node,
    } as HdKeyParameters<HdPublicNode>;
  }
  return HdKeyDecodingError.publicKeyExpected;
};

/**
 * Decode the provided HD private key and compute its identifier. Error messages
 * are returned as a string.
 */
export const hdPrivateKeyToIdentifier = (
  hdPrivateKey: string,
  crypto: { sha256: { hash: Sha256['hash'] } } = { sha256: internalSha256 },
) => {
  const privateKeyParams = decodeHdPrivateKey(hdPrivateKey, crypto);
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
  crypto: { sha256: { hash: Sha256['hash'] } } = { sha256: internalSha256 },
) => {
  const publicKeyParams = decodeHdPublicKey(hdPublicKey, crypto);
  if (typeof publicKeyParams === 'string') {
    return publicKeyParams;
  }
  return deriveHdPublicNodeIdentifier(publicKeyParams.node);
};

/**
 * Encode an HD private key (as defined by BIP32) payload (without the checksum)
 * given a valid {@link HdPrivateNode} and network.
 *
 * @param keyParameters - a valid HD private node and the network for which to
 * encode the key
 * @param crypto - an optional object containing an implementation of sha256
 * to use
 */
export const encodeHdPrivateKeyPayload = (
  keyParameters: HdKeyParameters<HdPrivateNodeValid>,
) => {
  const version = numberToBinUint32BE(
    keyParameters.network === 'mainnet'
      ? HdKeyVersion.mainnetPrivateKey
      : HdKeyVersion.testnetPrivateKey,
  );
  const depth = Uint8Array.of(keyParameters.node.depth);
  const childIndex = numberToBinUint32BE(keyParameters.node.childIndex);
  const isPrivateKey = Uint8Array.of(0x00);
  const payload = flattenBinArray([
    version,
    depth,
    keyParameters.node.parentFingerprint,
    childIndex,
    keyParameters.node.chainCode,
    isPrivateKey,
    keyParameters.node.privateKey,
  ]);
  return payload;
};

/**
 * Encode an HD private key (as defined by BIP32) given a valid
 * {@link HdPrivateNode} and network.
 *
 * @param keyParameters - a valid HD private node and the network for which to
 * encode the key
 * @param crypto - an optional object containing an implementation of sha256
 * to use
 */
export const encodeHdPrivateKey = (
  keyParameters: HdKeyParameters<HdPrivateNodeValid>,
  crypto: { sha256: { hash: Sha256['hash'] } } = { sha256: internalSha256 },
) => {
  const payload = encodeHdPrivateKeyPayload(keyParameters);
  const checksumLength = 4;
  const checksum = crypto.sha256
    .hash(crypto.sha256.hash(payload))
    .slice(0, checksumLength);
  return binToBase58(flattenBinArray([payload, checksum]));
};

/**
 * Encode an HD public key (as defined by BIP32) given an HD public node.
 *
 * @param keyParameters - an HD public node and the network for which to encode
 * the key
 * @param crypto - an optional object containing an implementation of sha256
 * to use
 */
export const encodeHdPublicKey = (
  keyParameters: HdKeyParameters<HdPublicNode>,
  crypto: { sha256: { hash: Sha256['hash'] } } = { sha256: internalSha256 },
) => {
  const version = numberToBinUint32BE(
    keyParameters.network === 'mainnet'
      ? HdKeyVersion.mainnetPublicKey
      : HdKeyVersion.testnetPublicKey,
  );
  const depth = Uint8Array.of(keyParameters.node.depth);
  const childIndex = numberToBinUint32BE(keyParameters.node.childIndex);
  const payload = flattenBinArray([
    version,
    depth,
    keyParameters.node.parentFingerprint,
    childIndex,
    keyParameters.node.chainCode,
    keyParameters.node.publicKey,
  ]);
  const checksumLength = 4;
  const checksum = crypto.sha256
    .hash(crypto.sha256.hash(payload))
    .slice(0, checksumLength);
  return binToBase58(flattenBinArray([payload, checksum]));
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
 * @param node - a valid HD private node
 * @param crypto - an optional object containing an implementation of secp256k1
 * compressed public key derivation to use
 */
export const deriveHdPublicNode = <
  PrivateNode extends HdPrivateNodeValid = HdPrivateNodeValid,
>(
  node: PrivateNode,
  crypto: {
    secp256k1: {
      derivePublicKeyCompressed: Secp256k1['derivePublicKeyCompressed'];
    };
  } = { secp256k1: internalSecp256k1 },
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
    : HdPublicNode;

/**
 * An error in the derivation of child HD public or private nodes.
 */
export enum HdNodeDerivationError {
  childIndexExceedsMaximum = 'HD key derivation error: child index exceeds maximum (4294967295).',
  nextChildIndexRequiresHardenedAlgorithm = 'HD key derivation error: an incredibly rare HMAC-SHA512 result occurred, and incrementing the child index would require switching to the hardened algorithm.',
  hardenedDerivationRequiresPrivateNode = 'HD key derivation error: derivation for hardened child indexes (indexes greater than or equal to 2147483648) requires an HD private node.',
  invalidDerivationPath = 'HD key derivation error: invalid derivation path - paths must begin with "m" or "M" and contain only forward slashes ("/"), apostrophes ("\'"), or positive child index numbers.',
  invalidPrivateDerivationPrefix = 'HD key derivation error: private derivation paths must begin with "m".',
  invalidPublicDerivationPrefix = 'HD key derivation error: public derivation paths must begin with "M".',
}

/**
 * Derive a child HD private node from an HD private node.
 *
 * To derive a child HD public node, use {@link deriveHdPublicNode} on the
 * result of this method. If the child uses a non-hardened index, it's also
 * possible to use {@link deriveHdPublicNodeChild}.
 *
 * @privateRemarks
 * The {@link Secp256k1.addTweakPrivateKey} method throws if the tweak is out of
 * range or if the resulting private key would be invalid. The procedure to
 * handle this error is standardized by BIP32: return the HD node at the next
 * child index. (Regardless, this scenario is incredibly unlikely without a
 * weakness in HMAC-SHA512.)
 *
 * @param node - the valid HD private node from which to derive the child node
 * @param index - the index at which to derive the child node - indexes greater
 * than or equal to the hardened index offset (`0x80000000`/`2147483648`) are
 * derived using the "hardened" derivation algorithm
 * @param crypto - an optional object containing implementations of sha256,
 * ripemd160, secp256k1 compressed public key derivation, and secp256k1 private
 * key "tweak addition" (application of the EC group operation)
 */
// eslint-disable-next-line complexity
export const deriveHdPrivateNodeChild = (
  node: HdPrivateNodeValid,
  index: number,
  crypto: {
    ripemd160: { hash: Ripemd160['hash'] };
    secp256k1: {
      addTweakPrivateKey: Secp256k1['addTweakPrivateKey'];
      derivePublicKeyCompressed: Secp256k1['derivePublicKeyCompressed'];
    };
    sha256: { hash: Sha256['hash'] };
    sha512: { hash: Sha512['hash'] };
  } = {
    ripemd160: internalRipemd160,
    secp256k1: internalSecp256k1,
    sha256: internalSha256,
    sha512: internalSha512,
  },
):
  | HdNodeDerivationError.childIndexExceedsMaximum
  | HdNodeDerivationError.nextChildIndexRequiresHardenedAlgorithm
  | HdPrivateNodeKnownParent => {
  const maximumIndex = 0xffffffff;
  if (index > maximumIndex) {
    return HdNodeDerivationError.childIndexExceedsMaximum;
  }

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
    if (index === hardenedIndexOffset - 1) {
      return HdNodeDerivationError.nextChildIndexRequiresHardenedAlgorithm;
    }
    return deriveHdPrivateNodeChild(node, index + 1, crypto);
  }
  const parentIdentifier = deriveHdPrivateNodeIdentifier(node, crypto);
  const parentFingerprintLength = 4;
  return {
    chainCode: nextChainCode,
    childIndex: index,
    depth: node.depth + 1,
    parentFingerprint: parentIdentifier.slice(0, parentFingerprintLength),
    parentIdentifier,
    privateKey: nextPrivateKey,
    valid: true,
  } as HdPrivateNodeKnownParent;
};

/**
 * Derive a non-hardened child HD public node from an HD public node.
 *
 * Because hardened derivation also requires knowledge of the parent private
 * node, it's not possible to use an HD public node to derive a hardened child
 * HD public node.
 *
 * Though private keys cannot be derived from HD public keys, sharing HD public
 * keys still carries risk. Along with allowing an attacker to associate wallet
 * addresses together (breaking privacy), should an attacker gain knowledge of a
 * single child private key, **it's possible to derive all parent HD private
 * keys**. See {@link crackHdPrivateNodeFromHdPublicNodeAndChildPrivateNode}
 * for details.
 *
 * @privateRemarks
 * The {@link secp256k1.addTweakPublicKeyCompressed} method returns an error as
 * a string if the tweak is out of range or if the resulting public key would be
 * invalid. The procedure to handle this error is standardized by BIP32: return
 * the HD node at the next child index. (Regardless, this scenario is incredibly
 * unlikely without a weakness in HMAC-SHA512.)
 *
 * @param node - the HD public node from which to derive the child public node
 * @param index - the index at which to derive the child node
 * @param crypto - an optional object containing implementations of sha256,
 * sha512, ripemd160, and secp256k1 compressed public key "tweak addition"
 * (application of the EC group operation)
 */
export const deriveHdPublicNodeChild = (
  node: HdPublicNode,
  index: number,
  crypto: {
    ripemd160: { hash: Ripemd160['hash'] };
    secp256k1: {
      addTweakPublicKeyCompressed: Secp256k1['addTweakPublicKeyCompressed'];
    };
    sha256: { hash: Sha256['hash'] };
    sha512: { hash: Sha512['hash'] };
  } = {
    ripemd160: internalRipemd160,
    secp256k1: internalSecp256k1,
    sha256: internalSha256,
    sha512: internalSha512,
  },
):
  | HdNodeDerivationError.hardenedDerivationRequiresPrivateNode
  | HdNodeDerivationError.nextChildIndexRequiresHardenedAlgorithm
  | HdPublicNodeKnownParent => {
  const hardenedIndexOffset = 0x80000000;
  if (index >= hardenedIndexOffset) {
    return HdNodeDerivationError.hardenedDerivationRequiresPrivateNode;
  }

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
    if (index === hardenedIndexOffset - 1) {
      return HdNodeDerivationError.nextChildIndexRequiresHardenedAlgorithm;
    }
    return deriveHdPublicNodeChild(node, index + 1, crypto);
  }
  const parentIdentifier = deriveHdPublicNodeIdentifier(node, crypto);
  const parentFingerprintLength = 4;
  return {
    chainCode: nextChainCode,
    childIndex: index,
    depth: node.depth + 1,
    parentFingerprint: parentIdentifier.slice(0, parentFingerprintLength),
    parentIdentifier,
    publicKey: nextPublicKey,
  } as HdPublicNodeKnownParent;
};

type PrivateResults<NodeType> = NodeType extends HdPrivateNodeKnownParent
  ? HdPrivateNodeKnownParent
  :
      | HdNodeDerivationError.childIndexExceedsMaximum
      | HdNodeDerivationError.nextChildIndexRequiresHardenedAlgorithm
      | HdPrivateNodeValid;

type PublicResults<NodeType> = NodeType extends HdPublicNodeKnownParent
  ? HdPublicNodeKnownParent
  :
      | HdNodeDerivationError.hardenedDerivationRequiresPrivateNode
      | HdNodeDerivationError.nextChildIndexRequiresHardenedAlgorithm
      | HdPublicNode;

/**
 * This type is a little complex because resulting HD nodes may not have a known
 * parent (defined `parentIdentifier`) if the provided node does not have a
 * known parent and the path is either `m` or `M` (returning the provided node).
 */
type ReductionResults<NodeType> = NodeType extends HdPrivateNodeValid
  ? PrivateResults<NodeType>
  : PublicResults<NodeType>;

/**
 * Derive a child HD node from a parent node given a derivation path. The
 * resulting node is the same type as the parent node (private nodes return
 * private nodes, public nodes return public nodes).
 *
 * @remarks
 * The derivation path uses the notation specified in BIP32:
 *
 * The first character must be either `m` for private derivation or `M` for
 * public derivation, followed by sets of `/` and a number representing the
 * child index used in the derivation at that depth. Hardened derivation is
 * represented by a trailing `'`, and may only appear in private derivation
 * paths (hardened derivation requires knowledge of the private key). Hardened
 * child indexes are represented with the hardened index offset (`2147483648`)
 * subtracted.
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
 * to `deriveHdPublicNode`.
 *
 * @param node - the HD node from which to begin the derivation (for paths
 * beginning with `m`, an {@link HdPrivateNodeValid}; for paths beginning with
 * `M`, an {@link HdPublicNode})
 * @param path - the BIP32 derivation path, e.g. `m/0/1'/2` or `M/3/4/5`
 * @param crypto - an optional object containing implementations of sha256,
 * sha512, ripemd160, and secp256k1 derivation functions
 */
// eslint-disable-next-line complexity
export const deriveHdPath = <
  NodeType extends HdPrivateNodeValid | HdPublicNode,
>(
  node: NodeType,
  path: string,
  crypto: {
    ripemd160: { hash: Ripemd160['hash'] };
    secp256k1: {
      addTweakPrivateKey: Secp256k1['addTweakPrivateKey'];
      addTweakPublicKeyCompressed: Secp256k1['addTweakPublicKeyCompressed'];
      derivePublicKeyCompressed: Secp256k1['derivePublicKeyCompressed'];
    };
    sha256: { hash: Sha256['hash'] };
    sha512: { hash: Sha512['hash'] };
  } = {
    ripemd160: internalRipemd160,
    secp256k1: internalSecp256k1,
    sha256: internalSha256,
    sha512: internalSha512,
  },
):
  | HdNodeDerivationError.invalidDerivationPath
  | HdNodeDerivationError.invalidPrivateDerivationPrefix
  | HdNodeDerivationError.invalidPublicDerivationPrefix
  | ReductionResults<NodeType> => {
  const validDerivationPath = /^[mM](?:\/[0-9]+'?)*$/u;
  if (!validDerivationPath.test(path)) {
    return HdNodeDerivationError.invalidDerivationPath;
  }

  const parsed = path.split('/');

  const isPrivateDerivation = 'privateKey' in node;

  if (isPrivateDerivation && parsed[0] !== 'm') {
    return HdNodeDerivationError.invalidPrivateDerivationPrefix;
  }

  if (!isPrivateDerivation && parsed[0] !== 'M') {
    return HdNodeDerivationError.invalidPublicDerivationPrefix;
  }

  const base = 10;
  const hardenedIndexOffset = 0x80000000;
  const indexes = parsed
    .slice(1)
    .map((index) =>
      index.endsWith("'")
        ? parseInt(index.slice(0, -1), base) + hardenedIndexOffset
        : parseInt(index, base),
    );

  return (
    isPrivateDerivation
      ? indexes.reduce(
          (result, nextIndex) =>
            typeof result === 'string'
              ? result
              : deriveHdPrivateNodeChild(result, nextIndex, crypto),
          node as PrivateResults<HdPrivateNodeValid>, // eslint-disable-line @typescript-eslint/prefer-reduce-type-parameter
        )
      : indexes.reduce(
          (result, nextIndex) =>
            typeof result === 'string'
              ? result
              : deriveHdPublicNodeChild(result, nextIndex, crypto),
          node as PublicResults<HdPublicNode>, // eslint-disable-line @typescript-eslint/prefer-reduce-type-parameter
        )
  ) as ReductionResults<NodeType>;
};

export enum HdNodeCrackingError {
  cannotCrackHardenedDerivation = 'HD node cracking error: cannot crack an HD parent node using hardened child node.',
}

/**
 * Derive the HD private node from a HD public node, given any non-hardened
 * child private node.
 *
 * @remarks
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
 * private node
 * @param childPrivateNode - any non-hardened child private node of the parent
 * node (only the `privateKey` and the `childIndex` are required)
 * * @param crypto - an optional object containing an implementation of sha512
 */
export const crackHdPrivateNodeFromHdPublicNodeAndChildPrivateNode = <
  PublicNode extends HdPublicNode = HdPublicNode,
>(
  parentPublicNode: PublicNode,
  childPrivateNode: { childIndex: number; privateKey: Uint8Array },
  crypto: { sha512: { hash: Sha512['hash'] } } = { sha512: internalSha512 },
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
    valid: true,
  } as PublicNode extends HdPublicNodeKnownParent
    ? HdPrivateNodeKnownParent
    : HdPrivateNodeValid;
};
