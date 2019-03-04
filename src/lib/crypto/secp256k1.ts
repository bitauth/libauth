import {
  CompressionFlag,
  ContextFlag,
  instantiateSecp256k1Wasm,
  instantiateSecp256k1WasmBytes,
  Secp256k1Wasm
} from '../bin/bin';

// tslint:disable-next-line:no-magic-numbers
export type RecoveryId = 0 | 1 | 2 | 3;

export interface RecoverableSignature {
  recoveryId: RecoveryId; // tslint:disable-line:readonly-keyword
  signature: Uint8Array; // tslint:disable-line:readonly-keyword
}

/**
 * An object which exposes a set of purely-functional Secp256k1 methods.
 *
 * Under the hood, this object uses a [[Secp256k1Wasm]] instance to provide it's
 * functionality. Because WebAssembly modules are dynamically-instantiated at
 * runtime, this object must be created and awaited from `instantiateSecp256k1`
 * or `instantiateSecp256k1Bytes`.
 *
 * **These methods do not check the length of provided parameters. Calling them
 * with improperly-sized parameters will likely cause incorrect behavior or
 * runtime errors.**
 *
 * ## Example
 *
 * ```typescript
 * import { instantiateSecp256k1 } from 'bitcoin-ts';
 * import { msgHash, pubkey, sig } from './somewhere';
 *
 * (async () => {
 *   const secp256k1 = await instantiateSecp256k1();
 *   secp256k1.verifySignatureDERLowS(sig, pubkey, msgHash)
 *     ? console.log('🚀 Signature valid')
 *     : console.log('❌ Signature invalid');
 * })();
 * ```
 */
export interface Secp256k1 {
  /**
   * Add `tweakValue` to the `privateKey`
   *
   * Throws if the private key is invalid or if the addition failed.
   *
   * @param privateKey a valid secp256k1 private key
   * @param tweakValue 256 bit value to tweak by (BE)
   */
  readonly addTweakPrivateKey: (
    privateKey: Uint8Array,
    tweakValue: Uint8Array
  ) => Uint8Array;

  /**
   * Tweak a `publicKey` by adding `tweakValue` times the generator to it.
   *
   * Throws if the provided public key could not be parsed, is not valid or if
   * the addition failed.
   *
   * The returned public key will be in compressed format.
   *
   * @param publicKey a public key.
   * @param tweakValue 256 bit value to tweak by (BE)
   */
  readonly addTweakPublicKeyCompressed: (
    publicKey: Uint8Array,
    tweakValue: Uint8Array
  ) => Uint8Array;

  /**
   * Tweak a `publicKey` by adding `tweakValue` times the generator to it.
   *
   * Throws if the provided public key could not be parsed, is not valid or if
   * the addition failed.
   *
   * The returned public key will be in uncompressed format.
   *
   * @param publicKey a public key.
   * @param tweakValue 256 bit value to tweak by (BE)
   */
  readonly addTweakPublicKeyUncompressed: (
    publicKey: Uint8Array,
    tweakValue: Uint8Array
  ) => Uint8Array;

  /**
   * Compress a valid ECDSA public key. Returns a public key in compressed
   * format (33 bytes, header byte 0x02 or 0x03).
   *
   * This function supports parsing compressed (33 bytes, header byte 0x02 or
   * 0x03), uncompressed (65 bytes, header byte 0x04), or hybrid (65 bytes,
   * header byte 0x06 or 0x07) format public keys.
   *
   * Throws if the provided public key could not be parsed or is not valid.
   *
   * @param privateKey a public key to compress
   */
  readonly compressPublicKey: (publicKey: Uint8Array) => Uint8Array;

  /**
   * Derive a compressed public key from a valid secp256k1 private key.
   *
   * Throws if the provided private key is too large (see `validatePrivateKey`).
   *
   * @param privateKey a valid secp256k1, 32-byte private key
   */
  readonly derivePublicKeyCompressed: (privateKey: Uint8Array) => Uint8Array;

  /**
   * Derive an uncompressed public key from a valid secp256k1 private key.
   *
   * Throws if the provided private key is too large (see `validatePrivateKey`).
   *
   * @param privateKey a valid secp256k1, 32-byte private key
   */
  readonly derivePublicKeyUncompressed: (privateKey: Uint8Array) => Uint8Array;

  /**
   * Malleate a compact-encoded ECDSA signature.
   *
   * This is done by negating the S value modulo the order of the curve,
   * "flipping" the sign of the random point R which is not included in the
   * signature.
   *
   * Throws if compact-signature parsing fails.
   *
   * @param signature a compact-encoded ECDSA signature to malleate, max 72
   * bytes
   */
  readonly malleateSignatureCompact: (signature: Uint8Array) => Uint8Array;

  /**
   * Malleate a DER-encoded ECDSA signature.
   *
   * This is done by negating the S value modulo the order of the curve,
   * "flipping" the sign of the random point R which is not included in the
   * signature.
   *
   * Throws if DER-signature parsing fails.
   *
   * @param signature a DER-encoded ECDSA signature to malleate, max 72 bytes
   */
  readonly malleateSignatureDER: (signature: Uint8Array) => Uint8Array;

  /**
   * Add `tweakValue` to the `privateKey`
   *
   * @param privateKey a valid secp256k1 private key
   * @param tweakValue 256 bit value to tweak by (BE)
   *
   */
  readonly mulTweakPrivateKey: (
    privateKey: Uint8Array,
    tweakValue: Uint8Array
  ) => Uint8Array;

  /**
   * Tweak a `publicKey` by multiplying `tweakValue` to it.
   *
   * Throws if the provided public key could not be parsed, is not valid or if
   * the multiplication failed.
   * The returned public key will be in compressed format.
   *
   * @param publicKey a public key.
   * @param tweakValue 256 bit value to tweak by (BE)
   */
  readonly mulTweakPublicKeyCompressed: (
    publicKey: Uint8Array,
    tweakValue: Uint8Array
  ) => Uint8Array;

  /**
   * Tweak a `publicKey` by multiplying `tweakValue` to it.
   *
   * Throws if the provided public key could not be parsed, is not valid or if
   * the multiplication failed.
   * The returned public key will be in uncompressed format.
   *
   * @param publicKey a public key.
   * @param tweakValue 256 bit value to tweak by (BE)
   */

  readonly mulTweakPublicKeyUncompressed: (
    publicKey: Uint8Array,
    tweakValue: Uint8Array
  ) => Uint8Array;

  /**
   * Normalize a compact-encoded ECDSA signature to lower-S form.
   *
   * Throws if compact-signature parsing fails.
   *
   * @param signature a compact-encoded ECDSA signature to normalize to lower-S
   * form, max 72 bytes
   */
  readonly normalizeSignatureCompact: (signature: Uint8Array) => Uint8Array;

  /**
   * Normalize a DER-encoded ECDSA signature to lower-S form.
   *
   * Throws if DER-signature parsing fails.
   *
   * @param signature a DER-encoded ECDSA signature to normalize to lower-S
   * form, max 72 bytes
   */
  readonly normalizeSignatureDER: (signature: Uint8Array) => Uint8Array;

  /**
   * Compute a compressed public key from a valid signature, recovery number,
   * and the `messageHash` used to generate them.
   *
   * Throws if the provided arguments are mismatched.
   *
   * @param signature an ECDSA signature in compact format.
   * @param recovery the recovery number.
   * @param messageHash the hash used to generate the signature and recovery
   * number
   */
  readonly recoverPublicKeyCompressed: (
    signature: Uint8Array,
    recoveryId: RecoveryId,
    messageHash: Uint8Array
  ) => Uint8Array;

  /**
   * Compute an uncompressed public key from a valid signature, recovery
   * number, and the `messageHash` used to generate them.
   *
   * Throws if the provided arguments are mismatched.
   *
   * @param signature an ECDSA signature in compact format.
   * @param recovery the recovery number.
   * @param messageHash the hash used to generate the signature and recovery
   * number
   */
  readonly recoverPublicKeyUncompressed: (
    signature: Uint8Array,
    recoveryId: RecoveryId,
    messageHash: Uint8Array
  ) => Uint8Array;

  /**
   * Convert a compact-encoded ECDSA signature to DER encoding.
   *
   * Throws if parsing of compact-encoded signature fails.
   *
   * @param signature a compact-encoded ECDSA signature to convert
   */
  readonly signatureCompactToDER: (signature: Uint8Array) => Uint8Array;

  /**
   * Convert a DER-encoded ECDSA signature to compact encoding.
   *
   * Throws if parsing of DER-encoded signature fails.
   *
   * @param signature a DER-encoded ECDSA signature to convert
   */
  readonly signatureDERToCompact: (signature: Uint8Array) => Uint8Array;

  /**
   * Create an ECDSA signature in compact format. The created signature is
   * always in lower-S form and follows RFC 6979.
   *
   * Throws if the provided private key is too large (see `validatePrivateKey`).
   *
   * @param privateKey a valid secp256k1 private key
   * @param messageHash the 32-byte message hash to be signed
   */
  readonly signMessageHashCompact: (
    privateKey: Uint8Array,
    messageHash: Uint8Array
  ) => Uint8Array;

  /**
   * Create an ECDSA signature in DER format. The created signature is always in
   * lower-S form and follows RFC 6979.
   *
   * Throws if the provided private key is too large (see `validatePrivateKey`).
   *
   * @param privateKey a valid secp256k1, 32-byte private key
   * @param messageHash the 32-byte message hash to be signed
   */
  readonly signMessageHashDER: (
    privateKey: Uint8Array,
    messageHash: Uint8Array
  ) => Uint8Array;

  /**
   * Create an ECDSA signature in compact format. The created signature is
   * always in lower-S form and follows RFC 6979.
   *
   * Also returns a recovery number for use in the `recoverPublicKey*`
   * functions
   *
   * Throws if the provided private key is too large (see `validatePrivateKey`).
   *
   * @param privateKey a valid secp256k1, 32-byte private key
   * @param messageHash the 32-byte message hash to be signed
   */
  readonly signMessageHashRecoverableCompact: (
    privateKey: Uint8Array,
    messageHash: Uint8Array
  ) => RecoverableSignature;

  /**
   * Uncompress a valid ECDSA public key. Returns a public key in uncompressed
   * format (65 bytes, header byte 0x04).
   *
   * This function supports parsing compressed (33 bytes, header byte 0x02 or
   * 0x03), uncompressed (65 bytes, header byte 0x04), or hybrid (65 bytes,
   * header byte 0x06 or 0x07) format public keys.
   *
   * Throws if the provided public key could not be parsed or is not valid.
   *
   * @param publicKey a public key to uncompress
   */
  readonly uncompressPublicKey: (publicKey: Uint8Array) => Uint8Array;

  /**
   * Verify that a private key is valid for secp256k1. Note, this library
   * requires all public keys to be provided as 32-byte Uint8Arrays (an array
   * length of 32).
   *
   * Nearly every 256-bit number is a valid secp256k1 private key. Specifically,
   * any 256-bit number from `0x1` to `0xFFFF FFFF FFFF FFFF FFFF FFFF FFFF FFFE
   * BAAE DCE6 AF48 A03B BFD2 5E8C D036 4140` is a valid private key. This
   * range is part of the definition of the secp256k1 elliptic curve parameters.
   *
   * This method returns true if the private key is valid or false if it isn't.
   *
   * @param privateKey a 32-byte private key to validate
   */
  readonly validatePrivateKey: (privateKey: Uint8Array) => boolean;

  /**
   * Normalize a signature to lower-S form, then `verifySignatureCompactLowS`.
   *
   * @param signature a compact-encoded ECDSA signature to verify, max 72 bytes
   * @param publicKey a public key, in either compressed (33-byte) or
   * uncompressed (65-byte) format
   * @param messageHash the 32-byte message hash signed by the signature
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
   * @param signature a compact-encoded ECDSA signature to verify, max 72 bytes
   * @param publicKey a public key, in either compressed (33-byte) or
   * uncompressed (65-byte) format
   * @param messageHash the 32-byte message hash signed by the signature
   */
  readonly verifySignatureCompactLowS: (
    signature: Uint8Array,
    publicKey: Uint8Array,
    messageHash: Uint8Array
  ) => boolean;

  /**
   * Normalize a signature to lower-S form, then `verifySignatureDERLowS`.
   *
   * @param signature a DER-encoded ECDSA signature to verify, max 72 bytes
   * @param publicKey a public key, in either compressed (33-byte) or
   * uncompressed (65-byte) format
   * @param messageHash the 32-byte message hash signed by the signature
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
   * @param signature a DER-encoded ECDSA signature to verify, max 72 bytes
   * @param publicKey a public key, in either compressed (33-byte) or
   * uncompressed (65-byte) format
   * @param messageHash the 32-byte message hash signed by the signature
   */
  readonly verifySignatureDERLowS: (
    signature: Uint8Array,
    publicKey: Uint8Array,
    messageHash: Uint8Array
  ) => boolean;
}

const enum ByteLength {
  maxSig = 72,
  maxPublicKey = 65,
  messageHash = 32,
  internalPublicKey = 64,
  compressedPublicKey = 33,
  uncompressedPublicKey = 65,
  internalSig = 64,
  compactSig = 64,
  recoverableSig = 65,
  privateKey = 32,
  randomSeed = 32
}

/**
 * @param secp256k1Wasm a Secp256k1Wasm object
 * @param randomSeed a 32-byte random seed used to randomize the context after
 * creation
 */
const wrapSecp256k1Wasm = (
  secp256k1Wasm: Secp256k1Wasm,
  randomSeed?: Uint8Array
): Secp256k1 => {
  /**
   * Currently, this wrapper creates a context with both SIGN and VERIFY
   * capabilities. For better initialization performance, consumers could
   * re-implement a wrapper with only the capabilities they require.
   */
  const contextPtr = secp256k1Wasm.contextCreate(ContextFlag.BOTH);

  /**
   * Since all of these methods are single-threaded and synchronous, we can
   * reuse allocated WebAssembly memory for each method without worrying about
   * calls interfering with each other. Likewise, these spaces never need to be
   * `free`d, since we will continue using them until this entire object (and
   * with it, the entire WebAssembly instance) is garbage collected.
   *
   * If malicious javascript gained access to this object, it should be
   * considered a critical vulnerability in the consumer. However, as a best
   * practice, we zero out private keys below when we're finished with them.
   */
  const sigScratch = secp256k1Wasm.malloc(ByteLength.maxSig);
  const publicKeyScratch = secp256k1Wasm.malloc(ByteLength.maxPublicKey);
  const messageHashScratch = secp256k1Wasm.malloc(ByteLength.messageHash);
  const internalPublicKeyPtr = secp256k1Wasm.malloc(
    ByteLength.internalPublicKey
  );
  const internalSigPtr = secp256k1Wasm.malloc(ByteLength.internalSig);
  const privateKeyPtr = secp256k1Wasm.malloc(ByteLength.privateKey);

  const internalRSigPtr = secp256k1Wasm.malloc(ByteLength.recoverableSig);
  // tslint:disable-next-line:no-magic-numbers
  const recoveryNumPtr = secp256k1Wasm.malloc(4);
  // tslint:disable-next-line:no-bitwise no-magic-numbers
  const recoveryNumPtrView32 = recoveryNumPtr >> 2;

  const getRecoveryNumPtr = () => secp256k1Wasm.heapU32[recoveryNumPtrView32];

  // tslint:disable-next-line:no-magic-numbers
  const lengthPtr = secp256k1Wasm.malloc(4);
  // tslint:disable-next-line:no-bitwise no-magic-numbers
  const lengthPtrView32 = lengthPtr >> 2;

  // tslint:disable:no-expression-statement no-if-statement

  const parsePublicKey = (publicKey: Uint8Array) => {
    secp256k1Wasm.heapU8.set(publicKey, publicKeyScratch);
    return secp256k1Wasm.pubkeyParse(
      contextPtr,
      internalPublicKeyPtr,
      publicKeyScratch,
      // tslint:disable-next-line:no-magic-numbers
      publicKey.length as 33 | 65
    ) === 1
      ? true
      : false;
  };

  const setLengthPtr = (value: number) => {
    secp256k1Wasm.heapU32.set([value], lengthPtrView32);
  };

  const getLengthPtr = () => secp256k1Wasm.heapU32[lengthPtrView32];

  const serializePublicKey = (length: number, flag: number) => {
    setLengthPtr(length);
    secp256k1Wasm.pubkeySerialize(
      contextPtr,
      publicKeyScratch,
      lengthPtr,
      internalPublicKeyPtr,
      flag
    );
    return secp256k1Wasm.readHeapU8(publicKeyScratch, getLengthPtr()).slice();
  };

  const getSerializedPublicKey = (compressed: boolean) =>
    compressed
      ? serializePublicKey(
          ByteLength.compressedPublicKey,
          CompressionFlag.COMPRESSED
        )
      : serializePublicKey(
          ByteLength.uncompressedPublicKey,
          CompressionFlag.UNCOMPRESSED
        );

  const convertPublicKey = (
    compressed: boolean
  ): ((publicKey: Uint8Array) => Uint8Array) => publicKey => {
    if (!parsePublicKey(publicKey)) {
      throw new Error('Failed to parse public key.');
    }
    return getSerializedPublicKey(compressed);
  };

  const parseSignature = (signature: Uint8Array, DER: boolean) => {
    secp256k1Wasm.heapU8.set(signature, sigScratch);
    return DER
      ? secp256k1Wasm.signatureParseDER(
          contextPtr,
          internalSigPtr,
          sigScratch,
          signature.length
        ) === 1
      : secp256k1Wasm.signatureParseCompact(
          contextPtr,
          internalSigPtr,
          sigScratch
        ) === 1;
  };

  const parseOrThrow = (signature: Uint8Array, DER: boolean) => {
    if (!parseSignature(signature, DER)) {
      throw new Error('Failed to parse signature.');
    }
  };

  const getCompactSig = () => {
    secp256k1Wasm.signatureSerializeCompact(
      contextPtr,
      sigScratch,
      internalSigPtr
    );
    return secp256k1Wasm.readHeapU8(sigScratch, ByteLength.compactSig).slice();
  };

  const getDERSig = () => {
    setLengthPtr(ByteLength.maxSig);
    secp256k1Wasm.signatureSerializeDER(
      contextPtr,
      sigScratch,
      lengthPtr,
      internalSigPtr
    );
    return secp256k1Wasm.readHeapU8(sigScratch, getLengthPtr()).slice();
  };

  const convertSignature = (
    wasDER: boolean
  ): ((signature: Uint8Array) => Uint8Array) => signature => {
    parseOrThrow(signature, wasDER);
    return wasDER ? getCompactSig() : getDERSig();
  };

  const fillPrivateKeyPtr = (privateKey: Uint8Array) => {
    secp256k1Wasm.heapU8.set(privateKey, privateKeyPtr);
  };

  const zeroOutPtr = (pointer: number, bytes: number) => {
    secp256k1Wasm.heapU8.fill(0, pointer, pointer + bytes);
  };

  const zeroOutPrivateKeyPtr = () => {
    zeroOutPtr(privateKeyPtr, ByteLength.privateKey);
  };

  const withPrivateKey = <T>(
    privateKey: Uint8Array,
    instructions: () => T
  ): T => {
    fillPrivateKeyPtr(privateKey);
    const ret = instructions();
    zeroOutPrivateKeyPtr();
    return ret;
  };

  const derivePublicKey = (
    compressed: boolean
  ): ((privateKey: Uint8Array) => Uint8Array) => privateKey => {
    const invalid = withPrivateKey<boolean>(
      privateKey,
      () =>
        secp256k1Wasm.pubkeyCreate(
          contextPtr,
          internalPublicKeyPtr,
          privateKeyPtr
        ) !== 1
    );

    if (invalid) {
      throw new Error('Cannot derive public key from invalid private key.');
    }

    return getSerializedPublicKey(compressed);
  };

  const fillMessageHashScratch = (messageHash: Uint8Array) => {
    secp256k1Wasm.heapU8.set(messageHash, messageHashScratch);
  };

  const normalizeSignature = () => {
    secp256k1Wasm.signatureNormalize(
      contextPtr,
      internalSigPtr,
      internalSigPtr
    );
  };

  const modifySignature = (
    DER: boolean,
    normalize: boolean
  ): ((signature: Uint8Array) => Uint8Array) => signature => {
    parseOrThrow(signature, DER);
    if (normalize) {
      normalizeSignature();
    } else {
      secp256k1Wasm.signatureMalleate(
        contextPtr,
        internalSigPtr,
        internalSigPtr
      );
    }
    return DER ? getDERSig() : getCompactSig();
  };

  const parseAndNormalizeSignature = (
    signature: Uint8Array,
    DER: boolean,
    normalize: boolean
  ) => {
    const ret = parseSignature(signature, DER);
    if (normalize) {
      normalizeSignature();
    }
    return ret;
  };

  const signMessageHash = (
    DER: boolean
  ): ((privateKey: Uint8Array, messageHash: Uint8Array) => Uint8Array) => (
    privateKey,
    messageHash
  ) => {
    fillMessageHashScratch(messageHash);
    return withPrivateKey<Uint8Array>(privateKey, () => {
      const failed =
        secp256k1Wasm.sign(
          contextPtr,
          internalSigPtr,
          messageHashScratch,
          privateKeyPtr
        ) !== 1;

      if (failed) {
        throw new Error(
          'Failed to sign message hash. The private key is not valid.'
        );
      }

      if (DER) {
        setLengthPtr(ByteLength.maxSig);
        secp256k1Wasm.signatureSerializeDER(
          contextPtr,
          sigScratch,
          lengthPtr,
          internalSigPtr
        );
        return secp256k1Wasm.readHeapU8(sigScratch, getLengthPtr()).slice();
      } else {
        secp256k1Wasm.signatureSerializeCompact(
          contextPtr,
          sigScratch,
          internalSigPtr
        );
        return secp256k1Wasm
          .readHeapU8(sigScratch, ByteLength.compactSig)
          .slice();
      }
    });
  };

  const verifyMessage = (messageHash: Uint8Array) => {
    fillMessageHashScratch(messageHash);
    return (
      secp256k1Wasm.verify(
        contextPtr,
        internalSigPtr,
        messageHashScratch,
        internalPublicKeyPtr
      ) === 1
    );
  };

  const verifySignature = (
    DER: boolean,
    normalize: boolean
  ): ((
    signature: Uint8Array,
    publicKey: Uint8Array,
    messageHash: Uint8Array
  ) => boolean) => (signature, publicKey, messageHash) =>
    parsePublicKey(publicKey) &&
    parseAndNormalizeSignature(signature, DER, normalize) &&
    verifyMessage(messageHash);

  const signMessageHashRecoverable = (
    privateKey: Uint8Array,
    messageHash: Uint8Array
  ): RecoverableSignature => {
    fillMessageHashScratch(messageHash);
    return withPrivateKey<RecoverableSignature>(privateKey, () => {
      if (
        secp256k1Wasm.signRecoverable(
          contextPtr,
          internalRSigPtr,
          messageHashScratch,
          privateKeyPtr
        ) !== 1
      ) {
        throw new Error(
          'Failed to sign message hash. The private key is not valid.'
        );
      }
      secp256k1Wasm.recoverableSignatureSerialize(
        contextPtr,
        sigScratch,
        recoveryNumPtr,
        internalRSigPtr
      );

      return {
        recoveryId: getRecoveryNumPtr() as RecoveryId,
        signature: secp256k1Wasm
          .readHeapU8(sigScratch, ByteLength.compactSig)
          .slice()
      };
    });
  };
  const recoverPublicKey = (
    compressed: boolean
  ): ((
    signature: Uint8Array,
    recoveryId: RecoveryId,
    messageHash: Uint8Array
  ) => Uint8Array) => (signature, recoveryId, messageHash) => {
    fillMessageHashScratch(messageHash);
    secp256k1Wasm.heapU8.set(signature, sigScratch);
    if (
      secp256k1Wasm.recoverableSignatureParse(
        contextPtr,
        internalRSigPtr,
        sigScratch,
        recoveryId
      ) !== 1
    ) {
      throw new Error(
        'Failed to recover public key. Could not parse signature.'
      );
    }
    if (
      secp256k1Wasm.recover(
        contextPtr,
        internalPublicKeyPtr,
        internalRSigPtr,
        messageHashScratch
      ) !== 1
    ) {
      throw new Error(
        'Failed to recover public key. The compact signature, recovery, or message hash is invalid.'
      );
    }
    return getSerializedPublicKey(compressed);
  };

  const addTweakPrivateKey = (
    privateKey: Uint8Array,
    tweakValue: Uint8Array
  ): Uint8Array => {
    fillMessageHashScratch(tweakValue);
    return withPrivateKey<Uint8Array>(privateKey, () => {
      if (
        secp256k1Wasm.privkeyTweakAdd(
          contextPtr,
          privateKeyPtr,
          messageHashScratch
        ) !== 1
      ) {
        throw new Error('Private key is invalid or adding failed.');
      }
      return secp256k1Wasm
        .readHeapU8(privateKeyPtr, ByteLength.privateKey)
        .slice();
    });
  };

  const mulTweakPrivateKey = (
    privateKey: Uint8Array,
    tweakValue: Uint8Array
  ): Uint8Array => {
    fillMessageHashScratch(tweakValue);
    return withPrivateKey<Uint8Array>(privateKey, () => {
      if (
        secp256k1Wasm.privkeyTweakMul(
          contextPtr,
          privateKeyPtr,
          messageHashScratch
        ) !== 1
      ) {
        throw new Error('Private key is invalid or multiplying failed.');
      }
      return secp256k1Wasm
        .readHeapU8(privateKeyPtr, ByteLength.privateKey)
        .slice();
    });
  };

  const addTweakPublicKey = (
    compressed: boolean
  ): ((publicKey: Uint8Array, tweakValue: Uint8Array) => Uint8Array) => (
    publicKey,
    tweakValue
  ) => {
    if (!parsePublicKey(publicKey)) {
      throw new Error('Failed to parse public key.');
    }
    fillMessageHashScratch(tweakValue);
    if (
      secp256k1Wasm.pubkeyTweakAdd(
        contextPtr,
        internalPublicKeyPtr,
        messageHashScratch
      ) !== 1
    ) {
      throw new Error('Adding failed');
    }
    return getSerializedPublicKey(compressed);
  };

  const mulTweakPublicKey = (
    compressed: boolean
  ): ((publicKey: Uint8Array, tweakValue: Uint8Array) => Uint8Array) => (
    publicKey,
    tweakValue
  ) => {
    if (!parsePublicKey(publicKey)) {
      throw new Error('Failed to parse public key.');
    }
    fillMessageHashScratch(tweakValue);
    if (
      secp256k1Wasm.pubkeyTweakMul(
        contextPtr,
        internalPublicKeyPtr,
        messageHashScratch
      ) !== 1
    ) {
      throw new Error('Multiplying failed');
    }
    return getSerializedPublicKey(compressed);
  };

  /**
   * The value of this precaution is debatable, especially in the context of
   * javascript and WebAssembly.
   *
   * In the secp256k1 C library, context randomization is an additional layer of
   * security from side-channel attacks which attempt to extract private key
   * information by analyzing things like a CPU's emitted radio frequencies or
   * power usage.
   *
   * In this library, these attacks seem even less likely, since the "platform"
   * on which this code will be executed (e.g. V8) is likely to obscure any
   * such signals.
   *
   * Still, out of an abundance of caution (and because no one has produced a
   * definitive proof indicating that this is not helpful), this library exposes
   * the ability to randomize the context like the C library. Depending on the
   * intended application, consumers can decide whether or not to randomize.
   */
  if (randomSeed !== undefined) {
    const randomSeedPtr = messageHashScratch;
    secp256k1Wasm.heapU8.set(randomSeed, randomSeedPtr);
    secp256k1Wasm.contextRandomize(contextPtr, randomSeedPtr);
    zeroOutPtr(randomSeedPtr, ByteLength.randomSeed);
  }

  return {
    addTweakPrivateKey,
    addTweakPublicKeyCompressed: addTweakPublicKey(true),
    addTweakPublicKeyUncompressed: addTweakPublicKey(false),
    compressPublicKey: convertPublicKey(true),
    derivePublicKeyCompressed: derivePublicKey(true),
    derivePublicKeyUncompressed: derivePublicKey(false),
    malleateSignatureCompact: modifySignature(false, false),
    malleateSignatureDER: modifySignature(true, false),
    mulTweakPrivateKey,
    mulTweakPublicKeyCompressed: mulTweakPublicKey(true),
    mulTweakPublicKeyUncompressed: mulTweakPublicKey(false),
    normalizeSignatureCompact: modifySignature(false, true),
    normalizeSignatureDER: modifySignature(true, true),
    recoverPublicKeyCompressed: recoverPublicKey(true),
    recoverPublicKeyUncompressed: recoverPublicKey(false),
    signMessageHashCompact: signMessageHash(false),
    signMessageHashDER: signMessageHash(true),
    signMessageHashRecoverableCompact: signMessageHashRecoverable,
    signatureCompactToDER: convertSignature(false),
    signatureDERToCompact: convertSignature(true),
    uncompressPublicKey: convertPublicKey(false),
    validatePrivateKey: privateKey =>
      withPrivateKey<boolean>(
        privateKey,
        () => secp256k1Wasm.seckeyVerify(contextPtr, privateKeyPtr) === 1
      ),
    verifySignatureCompact: verifySignature(false, true),
    verifySignatureCompactLowS: verifySignature(false, false),
    verifySignatureDER: verifySignature(true, true),
    verifySignatureDERLowS: verifySignature(true, false)
  };
  // tslint:enable:no-expression-statement no-if-statement
};

/**
 * This method is like `instantiateSecp256k1`, but requires the consumer to
 * `Window.fetch` or `fs.readFile` the `secp256k1.wasm` binary and provide it to
 * this method as `webassemblyBytes`. This skips a base64 decoding of an
 * embedded binary.
 *
 * ### Randomizing the Context with `randomSeed`
 * This method also accepts an optional, 32-byte `randomSeed`, which is passed
 * to the `contextRandomize` method in the underlying WebAssembly.
 *
 * The value of this precaution is debatable, especially in the context of
 * javascript and WebAssembly.
 *
 * In the secp256k1 C library, context randomization is an additional layer of
 * security from side-channel attacks which attempt to extract private key
 * information by analyzing things like a CPU's emitted radio frequencies or
 * power usage.
 *
 * In this library, these attacks seem even less likely, since the "platform"
 * on which this code will be executed (e.g. V8) is likely to obscure any
 * such signals.
 *
 * Still, out of an abundance of caution (and because no one has produced a
 * definitive proof indicating that this is not helpful), this library exposes
 * the ability to randomize the context like the C library. Depending on the
 * intended application, consumers can decide whether or not to randomize.
 *
 * @param webassemblyBytes an ArrayBuffer containing the bytes from bitcoin-ts'
 * `secp256k1.wasm` binary. Providing this buffer manually may be faster than
 * the internal base64 decode which happens in `instantiateSecp256k1`.
 * @param randomSeed a 32-byte random seed used to randomize the secp256k1
 * context after creation. See above for details.
 */
export const instantiateSecp256k1Bytes = async (
  webassemblyBytes: ArrayBuffer,
  randomSeed?: Uint8Array
): Promise<Secp256k1> =>
  wrapSecp256k1Wasm(
    await instantiateSecp256k1WasmBytes(webassemblyBytes),
    randomSeed
  );

/**
 * Create and wrap a Secp256k1 WebAssembly instance to expose a set of
 * purely-functional Secp256k1 methods. For slightly faster initialization, use
 * `instantiateSecp256k1Bytes`.
 *
 * @param randomSeed a 32-byte random seed used to randomize the secp256k1
 * context after creation. See the description in `instantiateSecp256k1Bytes`
 * for details.
 */
export const instantiateSecp256k1 = async (
  randomSeed?: Uint8Array
): Promise<Secp256k1> =>
  wrapSecp256k1Wasm(await instantiateSecp256k1Wasm(), randomSeed);
