/* eslint-disable no-underscore-dangle, max-params, @typescript-eslint/naming-convention */
// cSpell:ignore memcpy, anyfunc
import { base64ToBin } from '../../format/format';

import {
  CompressionFlag,
  ContextFlag,
  Secp256k1Wasm,
} from './secp256k1-wasm-types';
import { secp256k1Base64Bytes } from './secp256k1.base64';

export { ContextFlag, CompressionFlag, Secp256k1Wasm };

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
const wrapSecp256k1Wasm = (
  instance: WebAssembly.Instance,
  heapU8: Uint8Array,
  heapU32: Uint32Array
): Secp256k1Wasm => ({
  contextCreate: (context) =>
    (instance.exports as any)._secp256k1_context_create(context),
  contextRandomize: (contextPtr, seedPtr) =>
    (instance.exports as any)._secp256k1_context_randomize(contextPtr, seedPtr),

  free: (pointer) => (instance.exports as any)._free(pointer),
  heapU32,
  heapU8,
  instance,
  malloc: (bytes) => (instance.exports as any)._malloc(bytes),
  mallocSizeT: (num) => {
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    const pointer = (instance.exports as any)._malloc(4);
    // eslint-disable-next-line no-bitwise, @typescript-eslint/no-magic-numbers
    const pointerView32 = pointer >> 2;
    // eslint-disable-next-line functional/no-expression-statement
    heapU32.set([num], pointerView32);
    return pointer;
  },
  mallocUint8Array: (array) => {
    const pointer = (instance.exports as any)._malloc(array.length);
    // eslint-disable-next-line functional/no-expression-statement
    heapU8.set(array, pointer);
    return pointer;
  },
  privkeyTweakAdd: (contextPtr, secretKeyPtr, tweakNum256Ptr) =>
    (instance.exports as any)._secp256k1_ec_privkey_tweak_add(
      contextPtr,
      secretKeyPtr,
      tweakNum256Ptr
    ),
  privkeyTweakMul: (contextPtr, secretKeyPtr, tweakNum256Ptr) =>
    (instance.exports as any)._secp256k1_ec_privkey_tweak_mul(
      contextPtr,
      secretKeyPtr,
      tweakNum256Ptr
    ),
  pubkeyCreate: (contextPtr, publicKeyPtr, secretKeyPtr) =>
    (instance.exports as any)._secp256k1_ec_pubkey_create(
      contextPtr,
      publicKeyPtr,
      secretKeyPtr
    ),
  pubkeyParse: (
    contextPtr,
    publicKeyOutPtr,
    publicKeyInPtr,
    publicKeyInLength
  ) =>
    (instance.exports as any)._secp256k1_ec_pubkey_parse(
      contextPtr,
      publicKeyOutPtr,
      publicKeyInPtr,
      publicKeyInLength
    ),
  pubkeySerialize: (
    contextPtr,
    outputPtr,
    outputLengthPtr,
    publicKeyPtr,
    compression
  ) =>
    (instance.exports as any)._secp256k1_ec_pubkey_serialize(
      contextPtr,
      outputPtr,
      outputLengthPtr,
      publicKeyPtr,
      compression
    ),
  pubkeyTweakAdd: (contextPtr, publicKeyPtr, tweakNum256Ptr) =>
    (instance.exports as any)._secp256k1_ec_pubkey_tweak_add(
      contextPtr,
      publicKeyPtr,
      tweakNum256Ptr
    ),
  pubkeyTweakMul: (contextPtr, publicKeyPtr, tweakNum256Ptr) =>
    (instance.exports as any)._secp256k1_ec_pubkey_tweak_mul(
      contextPtr,
      publicKeyPtr,
      tweakNum256Ptr
    ),
  readHeapU8: (pointer, bytes) => new Uint8Array(heapU8.buffer, pointer, bytes),
  readSizeT: (pointer) => {
    // eslint-disable-next-line no-bitwise, @typescript-eslint/no-magic-numbers
    const pointerView32 = pointer >> 2;
    return heapU32[pointerView32];
  },
  recover: (contextPtr, outputPubkeyPointer, rSigPtr, msg32Ptr) =>
    (instance.exports as any)._secp256k1_ecdsa_recover(
      contextPtr,
      outputPubkeyPointer,
      rSigPtr,
      msg32Ptr
    ),
  recoverableSignatureParse: (contextPtr, outputRSigPtr, inputSigPtr, rid) =>
    (instance.exports as any)._secp256k1_ecdsa_recoverable_signature_parse_compact(
      contextPtr,
      outputRSigPtr,
      inputSigPtr,
      rid
    ),
  recoverableSignatureSerialize: (
    contextPtr,
    sigOutPtr,
    recIDOutPtr,
    rSigPtr
  ) =>
    (instance.exports as any)._secp256k1_ecdsa_recoverable_signature_serialize_compact(
      contextPtr,
      sigOutPtr,
      recIDOutPtr,
      rSigPtr
    ),
  schnorrSign: (contextPtr, outputSigPtr, msg32Ptr, secretKeyPtr) =>
    (instance.exports as any)._secp256k1_schnorr_sign(
      contextPtr,
      outputSigPtr,
      msg32Ptr,
      secretKeyPtr
    ),
  schnorrVerify: (contextPtr, sigPtr, msg32Ptr, publicKeyPtr) =>
    (instance.exports as any)._secp256k1_schnorr_verify(
      contextPtr,
      sigPtr,
      msg32Ptr,
      publicKeyPtr
    ),
  seckeyVerify: (contextPtr, secretKeyPtr) =>
    (instance.exports as any)._secp256k1_ec_seckey_verify(
      contextPtr,
      secretKeyPtr
    ),
  sign: (contextPtr, outputSigPtr, msg32Ptr, secretKeyPtr) =>
    (instance.exports as any)._secp256k1_ecdsa_sign(
      contextPtr,
      outputSigPtr,
      msg32Ptr,
      secretKeyPtr
    ),
  signRecoverable: (contextPtr, outputRSigPtr, msg32Ptr, secretKeyPtr) =>
    (instance.exports as any)._secp256k1_ecdsa_sign_recoverable(
      contextPtr,
      outputRSigPtr,
      msg32Ptr,
      secretKeyPtr
    ),
  signatureMalleate: (contextPtr, outputSigPtr, inputSigPtr) =>
    (instance.exports as any)._secp256k1_ecdsa_signature_malleate(
      contextPtr,
      outputSigPtr,
      inputSigPtr
    ),
  signatureNormalize: (contextPtr, outputSigPtr, inputSigPtr) =>
    (instance.exports as any)._secp256k1_ecdsa_signature_normalize(
      contextPtr,
      outputSigPtr,
      inputSigPtr
    ),
  signatureParseCompact: (contextPtr, sigOutPtr, compactSigInPtr) =>
    (instance.exports as any)._secp256k1_ecdsa_signature_parse_compact(
      contextPtr,
      sigOutPtr,
      compactSigInPtr
    ),
  signatureParseDER: (contextPtr, sigOutPtr, sigDERInPtr, sigDERInLength) =>
    (instance.exports as any)._secp256k1_ecdsa_signature_parse_der(
      contextPtr,
      sigOutPtr,
      sigDERInPtr,
      sigDERInLength
    ),
  signatureSerializeCompact: (contextPtr, outputCompactSigPtr, inputSigPtr) =>
    (instance.exports as any)._secp256k1_ecdsa_signature_serialize_compact(
      contextPtr,
      outputCompactSigPtr,
      inputSigPtr
    ),
  signatureSerializeDER: (
    contextPtr,
    outputDERSigPtr,
    outputDERSigLengthPtr,
    inputSigPtr
  ) =>
    (instance.exports as any)._secp256k1_ecdsa_signature_serialize_der(
      contextPtr,
      outputDERSigPtr,
      outputDERSigLengthPtr,
      inputSigPtr
    ),
  verify: (contextPtr, sigPtr, msg32Ptr, pubkeyPtr) =>
    (instance.exports as any)._secp256k1_ecdsa_verify(
      contextPtr,
      sigPtr,
      msg32Ptr,
      pubkeyPtr
    ),
});
/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */

/* eslint-disable functional/immutable-data, functional/no-expression-statement, @typescript-eslint/no-magic-numbers, functional/no-conditional-statement, no-bitwise, functional/no-throw-statement */
/**
 * Method extracted from Emscripten's preamble.js
 */
const isLittleEndian = (buffer: ArrayBuffer): boolean => {
  const littleEndian = true;
  const notLittleEndian = false;
  const heap16 = new Int16Array(buffer);
  const heap32 = new Int32Array(buffer);
  const heapU8 = new Uint8Array(buffer);
  heap32[0] = 1668509029;
  heap16[1] = 25459;
  return heapU8[2] !== 115 || heapU8[3] !== 99
    ? /* istanbul ignore next */ notLittleEndian
    : littleEndian;
};

/**
 * Method derived from Emscripten's preamble.js
 */
const alignMemory = (factor: number, size: number) =>
  Math.ceil(size / factor) * factor;

/**
 * The most performant way to instantiate secp256k1 functionality. To avoid
 * using Node.js or DOM-specific APIs, you can use `instantiateSecp256k1`.
 *
 * Note, most of this method is translated and boiled-down from Emscripten's
 * preamble.js. Significant changes to the WASM build or breaking updates to
 * Emscripten will likely require modifications to this method.
 *
 * @param webassemblyBytes - A buffer containing the secp256k1 binary.
 */
export const instantiateSecp256k1WasmBytes = async (
  webassemblyBytes: ArrayBuffer
): Promise<Secp256k1Wasm> => {
  const STACK_ALIGN = 16;
  const GLOBAL_BASE = 1024;
  const WASM_PAGE_SIZE = 65536;
  const TOTAL_STACK = 5242880;
  const TOTAL_MEMORY = 16777216;

  const wasmMemory = new WebAssembly.Memory({
    initial: TOTAL_MEMORY / WASM_PAGE_SIZE,
    maximum: TOTAL_MEMORY / WASM_PAGE_SIZE,
  });

  /* istanbul ignore if  */
  if (!isLittleEndian(wasmMemory.buffer)) {
    /*
     * note: this block is excluded from test coverage. It's A) hard to test
     * (must be either tested on big-endian hardware or a big-endian buffer
     * mock) and B) extracted from Emscripten's preamble.js, where it should
     * be tested properly.
     */
    throw new Error('Runtime error: expected the system to be little-endian.');
  }

  const STATIC_BASE = GLOBAL_BASE;
  const STATICTOP_INITIAL = STATIC_BASE + 67696 + 16;
  const DYNAMICTOP_PTR = STATICTOP_INITIAL;
  const DYNAMICTOP_PTR_SIZE = 4;
  const STATICTOP = (STATICTOP_INITIAL + DYNAMICTOP_PTR_SIZE + 15) & -16;
  const STACKTOP = alignMemory(STACK_ALIGN, STATICTOP);
  const STACK_BASE = STACKTOP;
  const STACK_MAX = STACK_BASE + TOTAL_STACK;
  const DYNAMIC_BASE = alignMemory(STACK_ALIGN, STACK_MAX);

  const heapU8 = new Uint8Array(wasmMemory.buffer);
  const heap32 = new Int32Array(wasmMemory.buffer);
  const heapU32 = new Uint32Array(wasmMemory.buffer);
  heap32[DYNAMICTOP_PTR >> 2] = DYNAMIC_BASE;

  const TABLE_SIZE = 6;
  const MAX_TABLE_SIZE = 6;

  // eslint-disable-next-line functional/no-let, @typescript-eslint/init-declarations
  let getErrNoLocation: (() => number) | undefined;

  /*
   * note: A number of methods below are excluded from test coverage. They are
   * a) not part of the regular usage of this library (should only be evaluated
   * if the consumer mis-implements the library and exist only to make
   * debugging easier) and B) already tested adequately in Emscripten, from
   * which this section is extracted.
   */
  const env = {
    DYNAMICTOP_PTR,
    STACKTOP,
    ___setErrNo: /* istanbul ignore next */ (value: number) => {
      if (getErrNoLocation !== undefined) {
        heap32[getErrNoLocation() >> 2] = value;
      }
      return value;
    },
    _abort: /* istanbul ignore next */ (err = 'Secp256k1 Error') => {
      throw new Error(err);
    },
    // eslint-disable-next-line camelcase
    _emscripten_memcpy_big: /* istanbul ignore next */ (
      dest: number,
      src: number,
      num: number
    ) => {
      heapU8.set(heapU8.subarray(src, src + num), dest);
      return dest;
    },
    abort: /* istanbul ignore next */ (err = 'Secp256k1 Error') => {
      throw new Error(err);
    },
    abortOnCannotGrowMemory: /* istanbul ignore next */ () => {
      throw new Error('Secp256k1 Error: abortOnCannotGrowMemory was called.');
    },
    enlargeMemory: /* istanbul ignore next */ () => {
      throw new Error('Secp256k1 Error: enlargeMemory was called.');
    },
    getTotalMemory: () => TOTAL_MEMORY,
  };

  const info = {
    env: {
      ...env,
      memory: wasmMemory,
      memoryBase: STATIC_BASE,
      table: new WebAssembly.Table({
        element: 'anyfunc',
        initial: TABLE_SIZE,
        maximum: MAX_TABLE_SIZE,
      }),
      tableBase: 0,
    },
    global: { Infinity, NaN },
  };

  return WebAssembly.instantiate(webassemblyBytes, info).then((result) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
    getErrNoLocation = result.instance.exports.___errno_location as any;

    return wrapSecp256k1Wasm(result.instance, heapU8, heapU32);
  });
};
/* eslint-enable functional/immutable-data, functional/no-expression-statement, @typescript-eslint/no-magic-numbers, functional/no-conditional-statement, no-bitwise, functional/no-throw-statement */

export const getEmbeddedSecp256k1Binary = () =>
  base64ToBin(secp256k1Base64Bytes).buffer;

/**
 * An ultimately-portable (but slower) version of `instantiateSecp256k1Bytes`
 * which does not require the consumer to provide the secp256k1 binary buffer.
 */
export const instantiateSecp256k1Wasm = async (): Promise<Secp256k1Wasm> =>
  instantiateSecp256k1WasmBytes(getEmbeddedSecp256k1Binary());
