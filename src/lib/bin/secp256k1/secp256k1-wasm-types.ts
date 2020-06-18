// cSpell:ignore noncefp, ndata, outputlen

/**
 * bitflags used in secp256k1's public API (translated from secp256k1.h)
 */

/* eslint-disable no-bitwise, @typescript-eslint/no-magic-numbers */
/** All flags' lower 8 bits indicate what they're for. Do not use directly. */
// const SECP256K1_FLAGS_TYPE_MASK = (1 << 8) - 1;
const SECP256K1_FLAGS_TYPE_CONTEXT = 1 << 0;
const SECP256K1_FLAGS_TYPE_COMPRESSION = 1 << 1;
/** The higher bits contain the actual data. Do not use directly. */
const SECP256K1_FLAGS_BIT_CONTEXT_VERIFY = 1 << 8;
const SECP256K1_FLAGS_BIT_CONTEXT_SIGN = 1 << 9;
const SECP256K1_FLAGS_BIT_COMPRESSION = 1 << 8;

/** Flags to pass to secp256k1_context_create. */
const SECP256K1_CONTEXT_VERIFY =
  SECP256K1_FLAGS_TYPE_CONTEXT | SECP256K1_FLAGS_BIT_CONTEXT_VERIFY;
const SECP256K1_CONTEXT_SIGN =
  SECP256K1_FLAGS_TYPE_CONTEXT | SECP256K1_FLAGS_BIT_CONTEXT_SIGN;
const SECP256K1_CONTEXT_NONE = SECP256K1_FLAGS_TYPE_CONTEXT;

/** Flag to pass to secp256k1_ec_pubkey_serialize and secp256k1_ec_privkey_export. */
const SECP256K1_EC_COMPRESSED =
  SECP256K1_FLAGS_TYPE_COMPRESSION | SECP256K1_FLAGS_BIT_COMPRESSION;
const SECP256K1_EC_UNCOMPRESSED = SECP256K1_FLAGS_TYPE_COMPRESSION;

/**
 * Flag to pass to a Secp256k1.contextCreate method.
 *
 * The purpose of context structures is to cache large precomputed data tables
 * that are expensive to construct, and also to maintain the randomization data
 * for blinding.
 *
 * You can create a context with only VERIFY or only SIGN capabilities, or you
 * can use BOTH. (NONE can be used for conversion/serialization.)
 */
export enum ContextFlag {
  NONE = SECP256K1_CONTEXT_NONE as 1,
  VERIFY = SECP256K1_CONTEXT_VERIFY as 257,
  SIGN = SECP256K1_CONTEXT_SIGN as 513,
  BOTH = SECP256K1_CONTEXT_SIGN | (SECP256K1_CONTEXT_VERIFY as 769),
}

/**
 * Flag to pass a Secp256k1 public key serialization method.
 *
 * You can indicate COMPRESSED (33 bytes, header byte 0x02 or 0x03) or
 * UNCOMPRESSED (65 bytes, header byte 0x04) format.
 */
export enum CompressionFlag {
  COMPRESSED = SECP256K1_EC_COMPRESSED as 258,
  UNCOMPRESSED = SECP256K1_EC_UNCOMPRESSED as 2,
}
/* eslint-enable no-bitwise, @typescript-eslint/no-magic-numbers */

/**
 * An object which wraps the WebAssembly implementation of `libsecp256k1`.
 *
 * Because WebAssembly modules are dynamically-instantiated at runtime, this
 * object must be created and awaited from `instantiateSecp256k1Wasm` or
 * `instantiateSecp256k1WasmBytes`.
 *
 * **It's very unlikely that consumers will need to use this interface directly.
 * See [[Secp256k1]] for a more purely-functional API.**
 */
export interface Secp256k1Wasm {
  /**
   * Create a Secp256k1 context object.
   *
   * The purpose of context structures is to cache large precomputed data tables
   * that are expensive to construct, and also to maintain the randomization
   * data for blinding.
   *
   * Do not create a new context object for each operation, as construction is
   * far slower than all other API calls (~100 times slower than an ECDSA
   * verification).
   * @param context - a `Context` flag representing the capabilities needed
   */
  readonly contextCreate: (context: ContextFlag) => number;

  /**
   * Updates the context randomization to protect against side-channel leakage.
   *
   * Returns 1 if the randomization was successfully updated, or 0 if not.
   *
   * While secp256k1 code is written to be constant-time no matter what secret
   * values are, it's possible that a future compiler may output code which isn't,
   * and also that the CPU may not emit the same radio frequencies or draw the same
   * amount power for all values.
   *
   * This function provides a seed which is combined into the blinding value: that
   * blinding value is added before each multiplication (and removed afterwards) so
   * that it does not affect function results, but shields against attacks which
   * rely on any input-dependent behavior.
   *
   * You should call this after `contextCreate` or
   * secp256k1_context_clone, and may call this repeatedly afterwards.
   *
   * @param contextPtr - pointer to a context object
   * @param seedPtr - pointer to a 32-byte random seed
   */
  readonly contextRandomize: (contextPtr: number, seedPtr: number) => 1 | 0;

  /**
   * Frees a pointer allocated by the `malloc` method.
   * @param pointer - the pointer to be freed
   */
  readonly free: (pointer: number) => number;

  // eslint-disable-next-line functional/no-mixed-type
  readonly heapU32: Uint32Array;
  readonly heapU8: Uint8Array;
  readonly instance: WebAssembly.Instance;

  /**
   * Allocates the given number of bytes in WebAssembly memory.
   * @param malloc - the number of bytes to allocate
   */
  // eslint-disable-next-line functional/no-mixed-type
  readonly malloc: (bytes: number) => number;

  /**
   * The Secp256k1 library accepts a pointer to a `size_t outputlen` for both
   * `ec_pubkey_serialize` & `ecdsa_signature_serialize_der`.
   *
   * This is a convenience method to create and set the value of those pointers.
   * @param value - the value of the `size_t` (e.g. the buffer length)
   */
  readonly mallocSizeT: (value: number) => number;

  /**
   * Allocates space for the provided array, and assigns the array to the space.
   *
   * @param array - a Uint8Array to allocate in WebAssembly memory
   */
  readonly mallocUint8Array: (array: Uint8Array) => number;

  /**
   * Tweak a _privateKey_ by adding _tweak_ to it.
   * Returns 1 if adding succeeded, 0 otherwise.
   *
   * @param contextPtr - pointer to a context object
   * @param secretKeyPtr - pointer to a 32 byte private key
   * @param tweakNum256Ptr - pointer to a 256 bit int representing the tweak value
   */
  readonly privkeyTweakAdd: (
    contextPtr: number,
    secretKeyPtr: number,
    tweakNum256Ptr: number
  ) => 1 | 0;

  /**
   * Tweak a _privateKey_ by multiplying _tweak_ to it.
   * Returns 1 if multiplying succeeded, 0 otherwise.
   *
   * @param contextPtr - pointer to a context object
   * @param secretKeyPtr - pointer to a 32 byte private key
   * @param tweakNum256Ptr - pointer to a 256 bit int representing the tweak value
   */
  readonly privkeyTweakMul: (
    contextPtr: number,
    secretKeyPtr: number,
    tweakNum256Ptr: number
  ) => 1 | 0;

  /**
   * Compute the public key for a secret key.
   *
   *  Returns 1 if the secret was valid and public key stored, otherwise 0.
   *
   * @param contextPtr - pointer to a context object, initialized for signing
   * @param publicKeyPtr - pointer to the created public key (note, this is an
   * internal representation, and must be serialized for outside use)
   * @param secretKeyPtr - pointer to a 32-byte private key
   */
  readonly pubkeyCreate: (
    contextPtr: number,
    publicKeyPtr: number,
    secretKeyPtr: number
  ) => 1 | 0;

  /**
   * Parse a variable-length public key into the pubkey object.
   *
   * Returns 1 if the public key was fully valid, or 0 if the public key could
   * not be parsed or is invalid.
   *
   *  This function supports parsing compressed (33 bytes, header byte 0x02 or
   *  0x03), uncompressed (65 bytes, header byte 0x04), or hybrid (65 bytes, header
   *  byte 0x06 or 0x07) format public keys.
   *
   * @param contextPtr - pointer to a context object
   * @param publicKeyOutPtr - a pointer to a 64 byte space where the parsed public
   * key will be written. (internal format)
   * @param publicKeyInPtr - pointer to a serialized public key
   * @param publicKeyInLength - the number of bytes to read from `publicKeyInPtr`
   * (Note, this should be a simple integer, rather than a `size_t` pointer as
   * is required by the serialization methods.)
   */
  readonly pubkeyParse: (
    contextPtr: number,
    publicKeyOutPtr: number,
    publicKeyInPtr: number,
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    publicKeyInLength: 33 | 65
  ) => 1 | 0;

  /**
   * Serialize a pubkey object into a serialized byte sequence.
   *
   *  Always returns 1.
   *
   * @param contextPtr - pointer to a context object
   * @param outputPtr - pointer to a 65-byte (if uncompressed) or 33-byte (if
   * compressed) byte array in which to place the serialized key
   * @param outputLengthPtr - pointer to an integer which is initially set to the
   * size of output, and is overwritten with the written size
   * @param publicKeyPtr - pointer to a public key (parsed, internal format)
   * @param compression - a CompressionFlag indicating compressed or uncompressed
   */
  readonly pubkeySerialize: (
    contextPtr: number,
    outputPtr: number,
    outputLengthPtr: number,
    publicKeyPtr: number,
    compression: CompressionFlag
  ) => 1;

  /**
   * Tweak a _publicKey_ by adding _tweak_ times the generator to it.
   * Returns 1 if adding succeeded, 0 otherwise.
   *
   * @param contextPtr - pointer to a context object
   * @param publicKeyPtr - pointer to a 64 byte space representing a public key
   * (internal format)
   * @param tweakNum256Ptr - pointer to a 256 bit int representing the tweak value
   */

  readonly pubkeyTweakAdd: (
    contextPtr: number,
    publicKeyPtr: number,
    tweakNum256Ptr: number
  ) => 1 | 0;

  /**
   * Tweak a _publicKey_ by multiplying it by a _tweak_ value.
   * Returns 1 if multiplying succeeded, 0 otherwise.
   *
   * @param contextPtr - pointer to a context object
   * @param publicKeyPtr - pointer to a 64 byte space representing a public key
   * (internal format)
   * @param tweakNum256Ptr - pointer to a 256 bit int representing the tweak value
   */

  readonly pubkeyTweakMul: (
    contextPtr: number,
    publicKeyPtr: number,
    tweakNum256Ptr: number
  ) => 1 | 0;

  /**
   * Read from WebAssembly memory by creating a new Uint8Array beginning at
   * `pointer` and continuing through the number of `bytes` provided.
   *
   * @param pointer - a pointer to the beginning of the Uint8Array element
   * @param bytes - the number of bytes to copy
   */
  readonly readHeapU8: (pointer: number, bytes: number) => Uint8Array;

  /**
   * Read a `size_t` from WebAssembly memory.
   *
   * @param pointer - a pointer to the `size_t` variable to read
   */
  readonly readSizeT: (pointer: number) => number;

  /**
   * Compute the public key given a recoverable signature and message hash.
   *
   * Returns 1 if the signature was valid and public key stored, otherwise 0.
   *
   * @param contextPtr - pointer to a context object, initialized for signing
   * @param publicKeyPtr - pointer to the created public key (note, this is an
   * internal representation, and must be serialized for outside use)
   * @param rSigPtr - pointer to a recoverable signature (internal format)
   * @param msg32Ptr - pointer to the 32-byte message hash the signed by this
   * signature
   */
  readonly recover: (
    contextPtr: number,
    publicKeyPtr: number,
    rSigPtr: number,
    msg32Ptr: number
  ) => 1 | 0;

  /**
   * Parse an ECDSA signature in compact (64 bytes) format with a recovery
   * number. Returns 1 when the signature could be parsed, 0 otherwise.
   *
   * The signature must consist of a 32-byte big endian R value, followed by a
   * 32-byte big endian S value. If R or S fall outside of [0..order-1], the
   * encoding is invalid. R and S with value 0 are allowed in the encoding.
   *
   * After the call, sig will always be initialized. If parsing failed or R or
   * S are zero, the resulting sig value is guaranteed to fail validation for
   * any message and public key.
   *
   * @param contextPtr - pointer to a context object
   * @param outputRSigPtr - a pointer to a 65 byte space where the parsed signature
   * will be written. (internal format)
   * @param inputSigPtr - pointer to a serialized signature in compact format
   * @param rid - the recovery number, as an int. (Not a pointer)
   */
  readonly recoverableSignatureParse: (
    contextPtr: number,
    outputRSigPtr: number,
    inputSigPtr: number,
    rid: number
  ) => 1 | 0;

  /**
   * Serialize a recoverable ECDSA signature in compact (64 byte) format along
   * with the recovery number. Always returns 1.
   *
   * See `recoverableSignatureParse` for details about the encoding.
   *
   * @param contextPtr - pointer to a context object
   * @param sigOutPtr - pointer to a 64-byte space to store the compact
   * serialization
   * @param recIDOutPtr - pointer to an int which will store the recovery number
   * @param rSigPtr - pointer to the 65-byte signature to be serialized
   * (internal format)
   */
  readonly recoverableSignatureSerialize: (
    contextPtr: number,
    sigOutPtr: number,
    recIDOutPtr: number,
    rSigPtr: number
  ) => 1;

  /**
   * Create a Secp256k1 EC-Schnorr-SHA256 signature (BCH construction).
   *
   * Signatures are 64-bytes, non-malleable, and support both batch validation
   * and multiparty signing. Nonces are generated using RFC6979, where the
   * Section 3.6, 16-byte ASCII "additional data" is set to `Schnorr+SHA256  `.
   * This avoids leaking a private key by inadvertently creating both an ECDSA
   * signature and a Schnorr signature using the same nonce.
   *
   * Returns 1 if the signature was created, 0 if the nonce generation function
   * failed, or the private key was invalid.
   *
   * Note, this WebAssembly Secp256k1 implementation does not currently support
   * the final two arguments from the C library, `noncefp` and `ndata`. The
   * default nonce generation function, `secp256k1_nonce_function_default`, is
   * always used.
   *
   * @param contextPtr - pointer to a context object, initialized for signing
   * @param outputSigPtr - pointer to a 64 byte space where the signature will
   * be written
   * @param msg32Ptr - pointer to the 32-byte message hash being signed
   * @param secretKeyPtr - pointer to a 32-byte secret key
   */
  readonly schnorrSign: (
    contextPtr: number,
    outputSigPtr: number,
    msg32Ptr: number,
    secretKeyPtr: number
  ) => 1 | 0;

  /**
   * Verify a Secp256k1 EC-Schnorr-SHA256 signature (BCH construction).
   *
   * Returns 1 if the signature is valid or 0 on failure.
   *
   * @param contextPtr - pointer to a context object, initialized for
   * verification.
   * @param sigPtr - pointer to the 64-byte schnorr signature being verified
   * @param msg32Ptr - pointer to the 32-byte message hash being verified
   * @param pubkeyPtr - pointer to the parsed pubkey with which to verify
   * (internal format)
   */
  readonly schnorrVerify: (
    contextPtr: number,
    sigPtr: number,
    msg32Ptr: number,
    publicKeyPtr: number
  ) => 1 | 0;

  /**
   * Verify an ECDSA secret key.
   *
   * Returns 1 if the secret key is valid, or 0 if the secret key is invalid.
   *
   * @param contextPtr - pointer to a context object
   * @param secretKeyPtr - pointer to a 32-byte secret key
   */
  readonly seckeyVerify: (contextPtr: number, secretKeyPtr: number) => 1 | 0;

  /**
   * Create an ECDSA signature. The created signature is always in lower-S form.
   *
   * Returns 1 if the signature was created, 0 if the nonce generation function
   * failed, or the private key was invalid.
   *
   * Note, this WebAssembly Secp256k1 implementation does not currently support
   * the final two arguments from the C library, `noncefp` and `ndata`. The
   * default nonce generation function, `secp256k1_nonce_function_default`, is
   * always used.
   *
   * @param contextPtr - pointer to a context object, initialized for signing
   * @param outputSigPtr - pointer to a 64 byte space where the signature will be
   * written (internal format)
   * @param msg32Ptr - pointer to the 32-byte message hash being signed
   * @param secretKeyPtr - pointer to a 32-byte secret key
   */
  readonly sign: (
    contextPtr: number,
    outputSigPtr: number,
    msg32Ptr: number,
    secretKeyPtr: number
  ) => 1 | 0;

  /**
   * Malleate an ECDSA signature.
   *
   * This is done by negating the S value modulo the order of the curve,
   * "flipping" the sign of the random point R which is not included in the
   * signature.
   *
   * This method is added by Libauth to make testing of `signatureNormalize`
   * easier.
   *
   * @param contextPtr - pointer to a context object
   * @param outputSigPtr - pointer to a 64 byte space where the malleated
   * signature will be written (internal format)
   * @param inputSigPtr - pointer to a signature to malleate
   */
  readonly signatureMalleate: (
    contextPtr: number,
    outputSigPtr: number,
    inputSigPtr: number
  ) => 1;

  /**
   * Convert a signature to a normalized lower-S form.
   *
   * Returns 1 if inputSigPtr was not normalized, 0 if inputSigPtr was already
   * normalized.
   *
   * With ECDSA a third-party can forge a second distinct signature of the same
   * message, given a single initial signature, but without knowing the key. This
   * is done by negating the S value modulo the order of the curve, "flipping"
   * the sign of the random point R which is not included in the signature.
   *
   * Forgery of the same message isn't universally problematic, but in systems
   * where message malleability or uniqueness of signatures is important this can
   * cause issues. This forgery can be blocked by all verifiers forcing signers
   * to use a normalized form.
   *
   * The lower-S form reduces the size of signatures slightly on average when
   * variable length encodings (such as DER) are used and is cheap to verify,
   * making it a good choice. Security of always using lower-S is assured because
   * anyone can trivially modify a signature after the fact to enforce this
   * property anyway.
   *
   * The lower S value is always between `0x1` and
   * `0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A0`,
   * inclusive.
   *
   * No other forms of ECDSA malleability are known and none seem likely, but
   * there is no formal proof that ECDSA, even with this additional restriction,
   * is free of other malleability. Commonly used serialization schemes will also
   * accept various non-unique encodings, so care should be taken when this
   * property is required for an application.
   *
   * The `sign` function will by default create signatures in the lower-S form,
   * and `verify` will not accept others. In case signatures come from a system
   * that cannot enforce this property, `signatureNormalize` must be called
   * before verification.
   *
   * @param contextPtr - pointer to a context object
   * @param outputSigPtr - pointer to a 64 byte space where the normalized
   * signature will be written (internal format)
   * @param inputSigPtr - pointer to a signature to check/normalize (internal
   * format)
   */
  readonly signatureNormalize: (
    contextPtr: number,
    outputSigPtr: number,
    inputSigPtr: number
  ) => 1 | 0;

  /**
   * Parse an ECDSA signature in compact (64 bytes) format. Returns 1 when the
   * signature could be parsed, 0 otherwise.
   *
   * The signature must consist of a 32-byte big endian R value, followed by a
   * 32-byte big endian S value. If R or S fall outside of [0..order-1], the
   * encoding is invalid. R and S with value 0 are allowed in the encoding.
   *
   * After the call, sig will always be initialized. If parsing failed or R or
   * S are zero, the resulting sig value is guaranteed to fail validation for
   * any message and public key.
   *
   * @param contextPtr - pointer to a context object
   * @param sigOutPtr - a pointer to a 64 byte space where the parsed signature
   * will be written. (internal format)
   * @param compactSigInPtr - pointer to a serialized signature in compact format
   */
  readonly signatureParseCompact: (
    contextPtr: number,
    sigOutPtr: number,
    compactSigInPtr: number
  ) => 1 | 0;

  /**
   * Parse a DER ECDSA signature.
   *
   * Returns 1 when the signature could be parsed, 0 otherwise.
   *
   * This function will accept any valid DER encoded signature, even if the
   * encoded numbers are out of range.
   *
   * After the call, sig will always be initialized. If parsing failed or the
   * encoded numbers are out of range, signature validation with it is
   * guaranteed to fail for every message and public key.
   *
   * @param contextPtr - pointer to a context object
   * @param sigOutPtr - a pointer to a 64 byte space where the parsed signature
   * will be written. (internal format)
   * @param sigDERInPtr - pointer to a DER serialized signature
   * @param sigDERInLength - the number of bytes to read from `sigDERInPtr` (Note,
   * this should be a simple integer, rather than a `size_t` pointer as is
   * required by the serialization methods.)
   */
  readonly signatureParseDER: (
    contextPtr: number,
    sigOutPtr: number,
    sigDERInPtr: number,
    sigDERInLength: number
  ) => 1 | 0;

  /**
   * Serialize an ECDSA signature in compact (64 byte) format. Always returns 1.
   *
   * See `signatureParseCompact` for details about the encoding.
   *
   * @param contextPtr - pointer to a context object
   * @param outputCompactSigPtr - pointer to a 64-byte space to store the compact
   * serialization
   * @param inputSigPtr - pointer to the 64-byte signature to be serialized
   * (internal format)
   */
  readonly signatureSerializeCompact: (
    contextPtr: number,
    outputCompactSigPtr: number,
    inputSigPtr: number
  ) => 1;

  /**
   * Serialize an ECDSA signature in DER format.
   *
   * Returns 1 if enough space was available to serialize, 0 otherwise.
   *
   * @param contextPtr - pointer to a context object
   * @param outputDERSigPtr - pointer to a 72 byte space to store the DER
   * serialization
   * @param outputDERSigLengthPtr - pointer to a `size_t` integer. Initially,
   * this should be set to the length of `outputDERSigPtr` (72). After the call
   * it will be set to the length of the serialization (even if 0 was returned).
   * @param inputSigPtr - pointer to the 64-byte signature to be serialized
   * (internal format)
   */
  readonly signatureSerializeDER: (
    contextPtr: number,
    outputDERSigPtr: number,
    outputDERSigLengthPtr: number,
    inputSigPtr: number
  ) => 1 | 0;

  /**
   * Create a recoverable ECDSA signature. The created signature is always in
   * lower-S form.
   *
   * Returns 1 if the signature was created, 0 if the nonce generation function
   * failed, or the private key was invalid.
   *
   * Note, this WebAssembly Secp256k1 implementation does not currently support
   * the final two arguments from the C library, `noncefp` and `ndata`. The
   * default nonce generation function, `secp256k1_nonce_function_default`, is
   * always used.
   *
   * @param contextPtr - pointer to a context object, initialized for signing
   * @param outputRSigPtr - pointer to a 65 byte space where the signature will
   * be written (internal format)
   * @param msg32Ptr - pointer to the 32-byte message hash being signed
   * @param secretKeyPtr - pointer to a 32-byte secret key
   */
  readonly signRecoverable: (
    contextPtr: number,
    outputRSigPtr: number,
    msg32Ptr: number,
    secretKeyPtr: number
  ) => 1 | 0;

  /**
   * Verify an ECDSA signature.
   *
   * Returns 1 if the signature is valid, 0 if the signature is incorrect or
   * failed parsing.
   *
   * To avoid accepting malleable signatures, only ECDSA signatures in lower-S
   * form are accepted.
   *
   * If you need to accept ECDSA signatures from sources that do not obey this
   * rule, apply secp256k1_ecdsa_signature_normalize to the signature prior to
   * validation, but be aware that doing so results in malleable signatures.
   *
   * @param contextPtr - pointer to a context object, initialized for
   * verification.
   * @param sigPtr - pointer to the parsed signature being verified (internal
   * format)
   * @param msg32Ptr - pointer to the 32-byte message hash being verified
   * @param pubkeyPtr - pointer to the parsed pubkey with which to verify
   * (internal format)
   */
  readonly verify: (
    contextPtr: number,
    sigPtr: number,
    msg32Ptr: number,
    pubkeyPtr: number
  ) => 1 | 0;
}
