export type RecoveryId = 0 | 1 | 2 | 3;

export interface RecoverableSignature {
  recoveryId: RecoveryId;
  signature: Uint8Array;
}

/**
 * An object that exposes a set of purely-functional Secp256k1 methods.
 *
 * ## Example
 *
 * ```typescript
 * import { secp256k1 } from '@bitauth/libauth';
 * import { msgHash, pubkey, sig } from './somewhere';
 *
 * secp256k1.verifySignatureDERLowS(sig, pubkey, msgHash)
 *   ? console.log('🚀 Signature valid')
 *   : console.log('❌ Signature invalid');
 * ```
 */
export interface Secp256k1 {
  /**
   * Tweak a privateKey by adding `tweakValue` to it.
   *
   * Returns an error message if the private key is invalid or if the addition
   * fails.
   *
   * @param privateKey - a valid secp256k1 private key
   * @param tweakValue - 256 bit value to tweak by (BE)
   */
  readonly addTweakPrivateKey: (
    privateKey: Uint8Array,
    tweakValue: Uint8Array
  ) => Uint8Array | string;

  /**
   * Tweak a `publicKey` by adding `tweakValue` times the generator to it.
   *
   * Returns an error message if the provided public key could not be parsed or
   * is not valid, or if the addition failed.
   *
   * The returned public key will be in compressed format.
   *
   * @param publicKey - a public key.
   * @param tweakValue - 256 bit value to tweak by (BE)
   */
  readonly addTweakPublicKeyCompressed: (
    publicKey: Uint8Array,
    tweakValue: Uint8Array
  ) => Uint8Array | string;

  /**
   * Tweak a `publicKey` by adding `tweakValue` times the generator to it.
   *
   * Returns an error message if the provided public key could not be parsed or
   * is not valid, or if the addition failed.
   *
   * The returned public key will be in uncompressed format.
   *
   * @param publicKey - a public key.
   * @param tweakValue - 256 bit value to tweak by (BE)
   */
  readonly addTweakPublicKeyUncompressed: (
    publicKey: Uint8Array,
    tweakValue: Uint8Array
  ) => Uint8Array | string;

  /**
   * Compress a valid ECDSA public key. Returns a public key in compressed
   * format (33 bytes, header byte 0x02 or 0x03).
   *
   * This function supports parsing compressed (33 bytes, header byte 0x02 or
   * 0x03), uncompressed (65 bytes, header byte 0x04), or hybrid (65 bytes,
   * header byte 0x06 or 0x07) format public keys.
   *
   * Returns an error message if the provided public key could not be parsed or
   * is not valid.
   *
   * @param privateKey - a public key to compress
   */
  readonly compressPublicKey: (publicKey: Uint8Array) => Uint8Array | string;

  /**
   * Derive a compressed public key from a valid secp256k1 private key.
   *
   * Returns an error message if the provided private key is too large (see
   * `validatePrivateKey`).
   *
   * @param privateKey - a valid secp256k1, 32-byte private key
   */
  readonly derivePublicKeyCompressed: (
    privateKey: Uint8Array
  ) => Uint8Array | string;

  /**
   * Derive an uncompressed public key from a valid secp256k1 private key.
   *
   * Returns an error message if the provided private key is too large (see
   * `validatePrivateKey`).
   *
   * @param privateKey - a valid secp256k1, 32-byte private key
   */
  readonly derivePublicKeyUncompressed: (
    privateKey: Uint8Array
  ) => Uint8Array | string;

  /**
   * Malleate a compact-encoded ECDSA signature.
   *
   * This is done by negating the S value modulo the order of the curve,
   * "flipping" the sign of the random point R that is not included in the
   * signature.
   *
   * Returns an error message if compact-signature parsing fails.
   *
   * @param signature - a compact-encoded ECDSA signature to malleate, max 72
   * bytes
   */
  readonly malleateSignatureCompact: (
    signature: Uint8Array
  ) => Uint8Array | string;

  /**
   * Malleate a DER-encoded ECDSA signature.
   *
   * This is done by negating the S value modulo the order of the curve,
   * "flipping" the sign of the random point R that is not included in the
   * signature.
   *
   * Returns an error message if DER-signature parsing fails.
   *
   * @param signature - a DER-encoded ECDSA signature to malleate, max 72 bytes
   */
  readonly malleateSignatureDER: (signature: Uint8Array) => Uint8Array | string;

  /**
   * Tweak a privateKey by multiplying it by a `tweakValue`.
   *
   * Returns an error message if the private key is invalid or if the
   * multiplication fails.
   *
   * @param privateKey - a valid secp256k1 private key
   * @param tweakValue - 256 bit value to tweak by (BE)
   *
   */
  readonly mulTweakPrivateKey: (
    privateKey: Uint8Array,
    tweakValue: Uint8Array
  ) => Uint8Array | string;

  /**
   * Tweak a `publicKey` by multiplying `tweakValue` to it.
   *
   * Returns an error message if the provided public key could not be parsed or
   * is not valid, or if the multiplication failed.
   *
   * The returned public key will be in compressed format.
   *
   * @param publicKey - a public key.
   * @param tweakValue - 256 bit value to tweak by (BE)
   */
  readonly mulTweakPublicKeyCompressed: (
    publicKey: Uint8Array,
    tweakValue: Uint8Array
  ) => Uint8Array | string;

  /**
   * Tweak a `publicKey` by multiplying `tweakValue` to it.
   *
   * Returns an error message if the provided public key could not be parsed or
   * is not valid, or if the multiplication failed.
   *
   * The returned public key will be in uncompressed format.
   *
   * @param publicKey - a public key.
   * @param tweakValue - 256 bit value to tweak by (BE)
   */

  readonly mulTweakPublicKeyUncompressed: (
    publicKey: Uint8Array,
    tweakValue: Uint8Array
  ) => Uint8Array | string;

  /**
   * Normalize a compact-encoded ECDSA signature to lower-S form.
   *
   * Returns an error message if compact-signature parsing fails.
   *
   * @param signature - a compact-encoded ECDSA signature to normalize to
   * lower-S form, max 72 bytes
   */
  readonly normalizeSignatureCompact: (
    signature: Uint8Array
  ) => Uint8Array | string;

  /**
   * Normalize a DER-encoded ECDSA signature to lower-S form.
   *
   * Returns an error message if DER-signature parsing fails.
   *
   * @param signature - a DER-encoded ECDSA signature to normalize to lower-S
   * form, max 72 bytes
   */
  readonly normalizeSignatureDER: (
    signature: Uint8Array
  ) => Uint8Array | string;

  /**
   * Compute a compressed public key from a valid signature, recovery number,
   * and the `messageHash` used to generate them.
   *
   * Returns an error message if the provided arguments are mismatched.
   *
   * @param signature - an ECDSA signature in compact format
   * @param recovery - the recovery number
   * @param messageHash - the hash used to generate the signature and recovery
   * number
   */
  readonly recoverPublicKeyCompressed: (
    signature: Uint8Array,
    recoveryId: RecoveryId,
    messageHash: Uint8Array
  ) => Uint8Array | string;

  /**
   * Compute an uncompressed public key from a valid signature, recovery
   * number, and the `messageHash` used to generate them.
   *
   * Returns an error message if the provided arguments are mismatched.
   *
   * @param signature - an ECDSA signature in compact format
   * @param recovery - the recovery number
   * @param messageHash - the hash used to generate the signature and recovery
   * number
   */
  readonly recoverPublicKeyUncompressed: (
    signature: Uint8Array,
    recoveryId: RecoveryId,
    messageHash: Uint8Array
  ) => Uint8Array | string;

  /**
   * Convert a compact-encoded ECDSA signature to DER encoding.
   *
   * Returns an error message if parsing of compact-encoded signature fails.
   *
   * @param signature - a compact-encoded ECDSA signature to convert
   */
  readonly signatureCompactToDER: (
    signature: Uint8Array
  ) => Uint8Array | string;

  /**
   * Convert a DER-encoded ECDSA signature to compact encoding.
   *
   * Returns an error message if parsing of DER-encoded signature fails.
   *
   * @param signature - a DER-encoded ECDSA signature to convert
   */
  readonly signatureDERToCompact: (
    signature: Uint8Array
  ) => Uint8Array | string;

  /**
   * Create an ECDSA signature in compact format. The created signature is
   * always in lower-S form and follows RFC 6979.
   *
   * Returns an error message if the provided private key is too large (see
   * `validatePrivateKey`).
   *
   * @param privateKey - a valid secp256k1 private key
   * @param messageHash - the 32-byte message hash to be signed
   */
  readonly signMessageHashCompact: (
    privateKey: Uint8Array,
    messageHash: Uint8Array
  ) => Uint8Array | string;

  /**
   * Create an ECDSA signature in DER format. The created signature is always in
   * lower-S form and follows RFC 6979.
   *
   * Returns an error message if the provided private key is too large (see
   * `validatePrivateKey`).
   *
   * @param privateKey - a valid secp256k1, 32-byte private key
   * @param messageHash - the 32-byte message hash to be signed
   */
  readonly signMessageHashDER: (
    privateKey: Uint8Array,
    messageHash: Uint8Array
  ) => Uint8Array | string;

  /**
   * Create an ECDSA signature in compact format. The created signature is
   * always in lower-S form and follows RFC 6979.
   *
   * Also returns a recovery number for use in the `recoverPublicKey*`
   * functions
   *
   * Returns an error message if the provided private key is too large (see
   * `validatePrivateKey`).
   *
   * @param privateKey - a valid secp256k1, 32-byte private key
   * @param messageHash - the 32-byte message hash to be signed
   */
  readonly signMessageHashRecoverableCompact: (
    privateKey: Uint8Array,
    messageHash: Uint8Array
  ) => RecoverableSignature | string;

  /**
   * Create a Secp256k1 EC-Schnorr-SHA256 signature (Bitcoin Cash construction).
   *
   * Signatures are 64-bytes, non-malleable, and support both batch validation
   * and multiparty signing. Nonces are generated using RFC6979, where the
   * Section 3.6, 16-byte ASCII "additional data" is set to `Schnorr+SHA256  `.
   * This avoids leaking a private key by inadvertently creating both an ECDSA
   * signature and a Schnorr signature using the same nonce.
   *
   * Returns an error message if the provided private key is too large (see
   * `validatePrivateKey`).
   *
   * @param privateKey - a valid secp256k1, 32-byte private key
   * @param messageHash - the 32-byte message hash to be signed
   */
  readonly signMessageHashSchnorr: (
    privateKey: Uint8Array,
    messageHash: Uint8Array
  ) => Uint8Array | string;

  /**
   * Uncompress a valid ECDSA public key. Returns a public key in uncompressed
   * format (65 bytes, header byte 0x04).
   *
   * This function supports parsing compressed (33 bytes, header byte 0x02 or
   * 0x03), uncompressed (65 bytes, header byte 0x04), or hybrid (65 bytes,
   * header byte 0x06 or 0x07) format public keys.
   *
   * Returns an error message if the provided public key could not be parsed or
   * is not valid.
   *
   * @param publicKey - a public key to uncompress
   */
  readonly uncompressPublicKey: (publicKey: Uint8Array) => Uint8Array | string;

  /**
   * Verify that a private key is valid for secp256k1. Note, this library
   * requires all public keys to be provided as 32-byte Uint8Arrays (an array
   * length of 32).
   *
   * Nearly every 256-bit number is a valid secp256k1 private key. Specifically,
   * any 256-bit number greater than or equal to `0x01` and less than
   * `0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364140`
   * is a valid private key. This range is part of the definition of the
   * secp256k1 elliptic curve parameters.
   *
   * This method returns true if the private key is valid or false if it isn't.
   *
   * @param privateKey - a 32-byte private key to validate
   */
  readonly validatePrivateKey: (privateKey: Uint8Array) => boolean;

  /**
   * Verify that a public key is valid for secp256k1.
   *
   * This method returns true if the public key is valid or false if it isn't.
   *
   * @param publicKey - a public key to validate
   */
  readonly validatePublicKey: (publicKey: Uint8Array) => boolean;

  /**
   * Normalize a signature to lower-S form, then `verifySignatureCompactLowS`.
   *
   * @param signature - a compact-encoded ECDSA signature to verify, max 72 bytes
   * @param publicKey - a public key, in either compressed (33-byte) or
   * uncompressed (65-byte) format
   * @param messageHash - the 32-byte message hash signed by the signature
   */
  readonly verifySignatureCompact: (
    signature: Uint8Array,
    publicKey: Uint8Array,
    messageHash: Uint8Array
  ) => boolean;

  /**
   * Verify a compact-encoded ECDSA `signature` using the provided `publicKey`
   * and `messageHash`. This method also returns false if the signature is not
   * in normalized lower-S form.
   *
   * @param signature - a compact-encoded ECDSA signature to verify, max 72 bytes
   * @param publicKey - a public key, in either compressed (33-byte) or
   * uncompressed (65-byte) format
   * @param messageHash - the 32-byte message hash signed by the signature
   */
  readonly verifySignatureCompactLowS: (
    signature: Uint8Array,
    publicKey: Uint8Array,
    messageHash: Uint8Array
  ) => boolean;

  /**
   * Normalize a signature to lower-S form, then `verifySignatureDERLowS`.
   *
   * @param signature - a DER-encoded ECDSA signature to verify, max 72 bytes
   * @param publicKey - a public key, in either compressed (33-byte) or
   * uncompressed (65-byte) format
   * @param messageHash - the 32-byte message hash signed by the signature
   */
  readonly verifySignatureDER: (
    signature: Uint8Array,
    publicKey: Uint8Array,
    messageHash: Uint8Array
  ) => boolean;

  /**
   * Verify a DER-encoded ECDSA `signature` using the provided `publicKey` and
   * `messageHash`. This method also returns false if the signature is not in
   * normalized lower-S form.
   *
   * @param signature - a DER-encoded ECDSA signature to verify, max 72 bytes
   * @param publicKey - a public key, in either compressed (33-byte) or
   * uncompressed (65-byte) format
   * @param messageHash - the 32-byte message hash signed by the signature
   */
  readonly verifySignatureDERLowS: (
    signature: Uint8Array,
    publicKey: Uint8Array,
    messageHash: Uint8Array
  ) => boolean;

  /**
   * Verify a Secp256k1 EC-Schnorr-SHA256 signature (Bitcoin Cash construction).
   *
   * @param signature - a 64-byte schnorr signature to verify
   * @param publicKey - a public key, in either compressed (33-byte) or
   * uncompressed (65-byte) format
   * @param messageHash - the 32-byte message hash signed by the signature
   */
  readonly verifySignatureSchnorr: (
    signature: Uint8Array,
    publicKey: Uint8Array,
    messageHash: Uint8Array
  ) => boolean;
}
