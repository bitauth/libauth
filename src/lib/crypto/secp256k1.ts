import {
  CompressionFlag,
  ContextFlag,
  instantiateSecp256k1Wasm,
  instantiateSecp256k1WasmBytes,
  Secp256k1Wasm
} from '../bin';

/**
 * Create and wrap a Secp256k1 WebAssembly instance to expose a set of
 * purely-functional Secp256k1 methods. For slightly faster initialization, use
 * `instantiateSecp256k1Bytes`.
 *
 * @param randomSeed a 32-byte random seed used to randomize the secp256k1
 * context after creation. See the description in `instantiateSecp256k1Bytes`
 * for details.
 */
export async function instantiateSecp256k1(
  randomSeed?: Uint8Array
): Promise<Secp256k1> {
  return wrapSecp256k1Wasm(await instantiateSecp256k1Wasm(), randomSeed);
}

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
export async function instantiateSecp256k1Bytes(
  webassemblyBytes: ArrayBuffer,
  randomSeed?: Uint8Array
): Promise<Secp256k1> {
  return wrapSecp256k1Wasm(
    await instantiateSecp256k1WasmBytes(webassemblyBytes),
    randomSeed
  );
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
   * Throws if the provided private key is not valid (see `validatePrivateKey`).
   *
   * @param privateKey a valid secp256k1 private key
   */
  readonly derivePublicKeyCompressed: (privateKey: Uint8Array) => Uint8Array;

  /**
   * Derive an uncompressed public key from a valid secp256k1 private key.
   *
   * Throws if the provided private key is not valid (see `validatePrivateKey`).
   *
   * @param privateKey a valid secp256k1 private key
   */
  readonly derivePublicKeyUncompressed: (privateKey: Uint8Array) => Uint8Array;

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
   * Create an ECDSA signature in compact format. The created signature is
   * always in lower-S form and follows RFC 6979.
   *
   * Throws if the provided private key is not valid (see `validatePrivateKey`).
   *
   * @param privateKey
   * @param messageHash
   */
  readonly signMessageHashCompact: (
    privateKey: Uint8Array,
    messageHash: Uint8Array
  ) => Uint8Array;

  /**
   * Create an ECDSA signature in DER format. The created signature is always in
   * lower-S form and follows RFC 6979.
   *
   * Throws if the provided private key is not valid (see `validatePrivateKey`).
   *
   * @param privateKey
   * @param messageHash
   */
  readonly signMessageHashDER: (
    privateKey: Uint8Array,
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
   * Uncompress a valid ECDSA public key. Returns a public key in uncompressed
   * format (65 bytes, header byte 0x04).
   *
   * This function supports parsing compressed (33 bytes, header byte 0x02 or
   * 0x03), uncompressed (65 bytes, header byte 0x04), or hybrid (65 bytes,
   * header byte 0x06 or 0x07) format public keys.
   *
   * Throws if the provided public key could not be parsed or is not valid.
   *
   * @param privateKey a public key to uncompress
   */
  readonly uncompressPublicKey: (publicKey: Uint8Array) => Uint8Array;

  /**
   * Verify that a private key is valid for secp256k1.
   *
   * Nearly every 256-bit number is a valid secp256k1 private key. Specifically,
   * any 256-bit number from `0x1` to `0xFFFF FFFF FFFF FFFF FFFF FFFF FFFF FFFE
   * BAAE DCE6 AF48 A03B BFD2 5E8C D036 4140` is a valid private key. This
   * range is part of the definition of the secp256k1 elliptic curve parameters.
   *
   * This method returns true if the private key is valid or false if it isn't.
   *
   * @param privateKey a private key to validate
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

/**
 * @param secp256k1Wasm a Secp256k1Wasm object
 * @param randomSeed a 32-byte random seed used to randomize the context after
 * creation
 */
function wrapSecp256k1Wasm(
  secp256k1Wasm: Secp256k1Wasm,
  randomSeed?: Uint8Array
): Secp256k1 {
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
  const sigScratch = secp256k1Wasm.malloc(72);
  const publicKeyScratch = secp256k1Wasm.malloc(65);
  const messageHashScratch = secp256k1Wasm.malloc(32);
  const internalPublicKeyPtr = secp256k1Wasm.malloc(64);
  const internalSigPtr = secp256k1Wasm.malloc(64);
  const privateKeyPtr = secp256k1Wasm.malloc(32);

  const lengthPtr = secp256k1Wasm.malloc(4);
  // tslint:disable-next-line:no-bitwise
  const lengthPtrView32 = lengthPtr >> 2;

  // tslint:disable:no-expression-statement no-if-statement

  function convertPublicKey(
    compressed: boolean
  ): (publicKey: Uint8Array) => Uint8Array {
    return publicKey => {
      if (!parsePublicKey(publicKey)) {
        throw new Error('Failed to parse public key.');
      }
      return getSerializedPublicKey(compressed);
    };
  }

  function convertSignature(
    wasDER: boolean
  ): (signature: Uint8Array) => Uint8Array {
    return signature => {
      parseOrThrow(signature, wasDER);
      return wasDER ? getCompactSig() : getDERSig();
    };
  }

  function derivePublicKey(
    compressed: boolean
  ): (privateKey: Uint8Array) => Uint8Array {
    return privateKey => {
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
  }

  function fillMessageHashScratch(messageHash: Uint8Array): void {
    secp256k1Wasm.heapU8.set(messageHash, messageHashScratch);
  }

  function fillPrivateKeyPtr(privateKey: Uint8Array): void {
    secp256k1Wasm.heapU8.set(privateKey, privateKeyPtr);
  }

  function getCompactSig(): Uint8Array {
    secp256k1Wasm.signatureSerializeCompact(
      contextPtr,
      sigScratch,
      internalSigPtr
    );
    return secp256k1Wasm.readHeapU8(sigScratch, 64);
  }

  function getDERSig(): Uint8Array {
    setLengthPtr(72);
    secp256k1Wasm.signatureSerializeDER(
      contextPtr,
      sigScratch,
      lengthPtr,
      internalSigPtr
    );
    return secp256k1Wasm.readHeapU8(sigScratch, getLengthPtr());
  }

  function getLengthPtr(): number {
    return secp256k1Wasm.heapU32[lengthPtrView32];
  }

  function getSerializedPublicKey(compressed: boolean): Uint8Array {
    compressed
      ? serializePublicKey(33, CompressionFlag.COMPRESSED)
      : serializePublicKey(65, CompressionFlag.UNCOMPRESSED);
    return secp256k1Wasm.readHeapU8(publicKeyScratch, getLengthPtr());
  }

  function modifySignature(
    DER: boolean,
    normalize: boolean
  ): (signature: Uint8Array) => Uint8Array {
    return signature => {
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
  }

  function normalizeSignature(): void {
    secp256k1Wasm.signatureNormalize(
      contextPtr,
      internalSigPtr,
      internalSigPtr
    );
  }

  function parseAndNormalizeSignature(
    signature: Uint8Array,
    DER: boolean,
    normalize: boolean
  ): boolean {
    const ret = parseSignature(signature, DER);
    if (normalize) {
      normalizeSignature();
    }
    return ret;
  }

  function parseOrThrow(signature: Uint8Array, DER: boolean): void {
    if (!parseSignature(signature, DER)) {
      throw new Error('Failed to parse signature.');
    }
  }

  function parsePublicKey(publicKey: Uint8Array): boolean {
    secp256k1Wasm.heapU8.set(publicKey, publicKeyScratch);
    return secp256k1Wasm.pubkeyParse(
      contextPtr,
      internalPublicKeyPtr,
      publicKeyScratch,
      publicKey.length as 33 | 65
    )
      ? true
      : false;
  }

  function parseSignature(signature: Uint8Array, DER: boolean): boolean {
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
  }

  function serializePublicKey(length: number, flag: number): void {
    setLengthPtr(length);
    secp256k1Wasm.pubkeySerialize(
      contextPtr,
      publicKeyScratch,
      lengthPtr,
      internalPublicKeyPtr,
      flag
    );
  }

  function setLengthPtr(value: number): void {
    secp256k1Wasm.heapU32.set([value], lengthPtrView32);
  }

  function signMessageHash(
    DER: boolean
  ): (privateKey: Uint8Array, messageHash: Uint8Array) => Uint8Array {
    return (privateKey, messageHash) => {
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
          setLengthPtr(72);
          secp256k1Wasm.signatureSerializeDER(
            contextPtr,
            sigScratch,
            lengthPtr,
            internalSigPtr
          );
          return secp256k1Wasm.readHeapU8(sigScratch, getLengthPtr());
        } else {
          secp256k1Wasm.signatureSerializeCompact(
            contextPtr,
            sigScratch,
            internalSigPtr
          );
          return secp256k1Wasm.readHeapU8(sigScratch, 64);
        }
      });
    };
  }

  function verifyMessage(messageHash: Uint8Array): boolean {
    fillMessageHashScratch(messageHash);
    if (
      !secp256k1Wasm.verify(
        contextPtr,
        internalSigPtr,
        messageHashScratch,
        internalPublicKeyPtr
      )
    ) {
      return false;
    }
    return true;
  }

  function verifySignature(
    DER: boolean,
    normalize: boolean
  ): (
    signature: Uint8Array,
    publicKey: Uint8Array,
    messageHash: Uint8Array
  ) => boolean {
    return (signature, publicKey, messageHash) =>
      parsePublicKey(publicKey)
        ? parseAndNormalizeSignature(signature, DER, normalize)
          ? verifyMessage(messageHash)
          : false
        : false;
  }

  function withPrivateKey<T>(privateKey: Uint8Array, instructions: () => T): T {
    fillPrivateKeyPtr(privateKey);
    const ret = instructions();
    zeroOutPrivateKeyPtr();
    return ret;
  }

  function zeroOutPrivateKeyPtr(): void {
    zeroOutPtr(privateKeyPtr, 32);
  }

  function zeroOutPtr(pointer: number, bytes: number): void {
    secp256k1Wasm.heapU8.fill(0, pointer, pointer + bytes);
  }

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
  if (randomSeed) {
    const randomSeedPtr = messageHashScratch;
    secp256k1Wasm.heapU8.set(randomSeed, randomSeedPtr);
    secp256k1Wasm.contextRandomize(contextPtr, randomSeedPtr);
    zeroOutPtr(randomSeedPtr, 32);
  }

  return {
    compressPublicKey: convertPublicKey(true),
    derivePublicKeyCompressed: derivePublicKey(true),
    derivePublicKeyUncompressed: derivePublicKey(false),
    malleateSignatureCompact: modifySignature(false, false),
    malleateSignatureDER: modifySignature(true, false),
    normalizeSignatureCompact: modifySignature(false, true),
    normalizeSignatureDER: modifySignature(true, true),
    signMessageHashCompact: signMessageHash(false),
    signMessageHashDER: signMessageHash(true),
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
}
