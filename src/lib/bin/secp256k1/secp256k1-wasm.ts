// cSpell:ignore memcpy, anyfunc
import { base64ToBin } from '../../utils/utils';

import {
  CompressionFlag,
  ContextFlag,
  Secp256k1Wasm
} from './secp256k1-wasm-types';
import { secp256k1Base64Bytes } from './secp256k1.base64';

export { ContextFlag, CompressionFlag, Secp256k1Wasm };

// tslint:disable:no-unsafe-any
const wrapSecp256k1Wasm = (
  instance: WebAssembly.Instance,
  heapU8: Uint8Array,
  heapU32: Uint32Array
): Secp256k1Wasm => ({
  contextCreate: context =>
    // tslint:disable-next-line: no-any
    (instance.exports as any)._secp256k1_context_create(context),
  contextRandomize: (contextPtr, seedPtr) =>
    // tslint:disable-next-line: no-any
    (instance.exports as any)._secp256k1_context_randomize(contextPtr, seedPtr),

  // tslint:disable-next-line: no-any
  free: pointer => (instance.exports as any)._free(pointer),
  heapU32,
  heapU8,
  instance,
  // tslint:disable-next-line: no-any
  malloc: bytes => (instance.exports as any)._malloc(bytes),
  mallocSizeT: num => {
    // tslint:disable-next-line:no-magic-numbers no-any
    const pointer = (instance.exports as any)._malloc(4);
    // tslint:disable-next-line:no-bitwise no-magic-numbers
    const pointerView32 = pointer >> 2;
    // tslint:disable-next-line:no-expression-statement
    heapU32.set([num], pointerView32);
    return pointer;
  },
  mallocUint8Array: array => {
    // tslint:disable-next-line: no-any
    const pointer = (instance.exports as any)._malloc(array.length);
    // tslint:disable-next-line:no-expression-statement
    heapU8.set(array, pointer);
    return pointer;
  },
  privkeyTweakAdd: (contextPtr, secretKeyPtr, tweakNum256Ptr) =>
    // tslint:disable-next-line: no-any
    (instance.exports as any)._secp256k1_ec_privkey_tweak_add(
      contextPtr,
      secretKeyPtr,
      tweakNum256Ptr
    ),
  privkeyTweakMul: (contextPtr, secretKeyPtr, tweakNum256Ptr) =>
    // tslint:disable-next-line: no-any
    (instance.exports as any)._secp256k1_ec_privkey_tweak_mul(
      contextPtr,
      secretKeyPtr,
      tweakNum256Ptr
    ),
  pubkeyCreate: (contextPtr, publicKeyPtr, secretKeyPtr) =>
    // tslint:disable-next-line: no-any
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
    // tslint:disable-next-line: no-any
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
    // tslint:disable-next-line: no-any
    (instance.exports as any)._secp256k1_ec_pubkey_serialize(
      contextPtr,
      outputPtr,
      outputLengthPtr,
      publicKeyPtr,
      compression
    ),
  pubkeyTweakAdd: (contextPtr, publicKeyPtr, tweakNum256Ptr) =>
    // tslint:disable-next-line: no-any
    (instance.exports as any)._secp256k1_ec_pubkey_tweak_add(
      contextPtr,
      publicKeyPtr,
      tweakNum256Ptr
    ),
  pubkeyTweakMul: (contextPtr, publicKeyPtr, tweakNum256Ptr) =>
    // tslint:disable-next-line: no-any
    (instance.exports as any)._secp256k1_ec_pubkey_tweak_mul(
      contextPtr,
      publicKeyPtr,
      tweakNum256Ptr
    ),
  readHeapU8: (pointer, bytes) => new Uint8Array(heapU8.buffer, pointer, bytes),
  readSizeT: pointer => {
    // tslint:disable-next-line:no-bitwise no-magic-numbers
    const pointerView32 = pointer >> 2;
    return heapU32[pointerView32];
  },
  recover: (contextPtr, outputPubkeyPointer, rSigPtr, msg32Ptr) =>
    // tslint:disable-next-line: no-any
    (instance.exports as any)._secp256k1_ecdsa_recover(
      contextPtr,
      outputPubkeyPointer,
      rSigPtr,
      msg32Ptr
    ),
  recoverableSignatureParse: (contextPtr, outputRSigPtr, inputSigPtr, rid) =>
    // tslint:disable-next-line: no-any
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
    // tslint:disable-next-line: no-any
    (instance.exports as any)._secp256k1_ecdsa_recoverable_signature_serialize_compact(
      contextPtr,
      sigOutPtr,
      recIDOutPtr,
      rSigPtr
    ),
  schnorrSign: (contextPtr, outputSigPtr, msg32Ptr, secretKeyPtr) =>
    // tslint:disable-next-line: no-any
    (instance.exports as any)._secp256k1_schnorr_sign(
      contextPtr,
      outputSigPtr,
      msg32Ptr,
      secretKeyPtr
    ),
  schnorrVerify: (contextPtr, sigPtr, msg32Ptr, publicKeyPtr) =>
    // tslint:disable-next-line: no-any
    (instance.exports as any)._secp256k1_schnorr_verify(
      contextPtr,
      sigPtr,
      msg32Ptr,
      publicKeyPtr
    ),
  seckeyVerify: (contextPtr, secretKeyPtr) =>
    // tslint:disable-next-line: no-any
    (instance.exports as any)._secp256k1_ec_seckey_verify(
      contextPtr,
      secretKeyPtr
    ),
  sign: (contextPtr, outputSigPtr, msg32Ptr, secretKeyPtr) =>
    // tslint:disable-next-line: no-any
    (instance.exports as any)._secp256k1_ecdsa_sign(
      contextPtr,
      outputSigPtr,
      msg32Ptr,
      secretKeyPtr
    ),
  signRecoverable: (contextPtr, outputRSigPtr, msg32Ptr, secretKeyPtr) =>
    // tslint:disable-next-line: no-any
    (instance.exports as any)._secp256k1_ecdsa_sign_recoverable(
      contextPtr,
      outputRSigPtr,
      msg32Ptr,
      secretKeyPtr
    ),
  signatureMalleate: (contextPtr, outputSigPtr, inputSigPtr) =>
    // tslint:disable-next-line: no-any
    (instance.exports as any)._secp256k1_ecdsa_signature_malleate(
      contextPtr,
      outputSigPtr,
      inputSigPtr
    ),
  signatureNormalize: (contextPtr, outputSigPtr, inputSigPtr) =>
    // tslint:disable-next-line: no-any
    (instance.exports as any)._secp256k1_ecdsa_signature_normalize(
      contextPtr,
      outputSigPtr,
      inputSigPtr
    ),
  signatureParseCompact: (contextPtr, sigOutPtr, compactSigInPtr) =>
    // tslint:disable-next-line: no-any
    (instance.exports as any)._secp256k1_ecdsa_signature_parse_compact(
      contextPtr,
      sigOutPtr,
      compactSigInPtr
    ),
  signatureParseDER: (contextPtr, sigOutPtr, sigDERInPtr, sigDERInLength) =>
    // tslint:disable-next-line: no-any
    (instance.exports as any)._secp256k1_ecdsa_signature_parse_der(
      contextPtr,
      sigOutPtr,
      sigDERInPtr,
      sigDERInLength
    ),
  signatureSerializeCompact: (contextPtr, outputCompactSigPtr, inputSigPtr) =>
    // tslint:disable-next-line: no-any
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
    // tslint:disable-next-line: no-any
    (instance.exports as any)._secp256k1_ecdsa_signature_serialize_der(
      contextPtr,
      outputDERSigPtr,
      outputDERSigLengthPtr,
      inputSigPtr
    ),
  verify: (contextPtr, sigPtr, msg32Ptr, pubkeyPtr) =>
    // tslint:disable-next-line: no-any
    (instance.exports as any)._secp256k1_ecdsa_verify(
      contextPtr,
      sigPtr,
      msg32Ptr,
      pubkeyPtr
    )
});
// tslint:enable:no-unsafe-any

/**
 * Method extracted from Emscripten's preamble.js
 */
const isLittleEndian = (buffer: ArrayBuffer): boolean => {
  const littleEndian = true;
  const notLittleEndian = false;
  const heap16 = new Int16Array(buffer);
  const heap32 = new Int32Array(buffer);
  const heapU8 = new Uint8Array(buffer);
  // tslint:disable:no-expression-statement no-object-mutation no-magic-numbers
  heap32[0] = 1668509029;
  heap16[1] = 25459;
  // tslint:enable:no-expression-statement no-object-mutation
  // tslint:disable-next-line:no-magic-numbers
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
 * @param webassemblyBytes A buffer containing the secp256k1 binary.
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
    maximum: TOTAL_MEMORY / WASM_PAGE_SIZE
  });

  /* istanbul ignore if  */
  // tslint:disable-next-line:no-if-statement
  if (!isLittleEndian(wasmMemory.buffer)) {
    // note: this block is excluded from test coverage. It's A) hard to test
    // (must be either tested on big-endian hardware or a big-endian buffer
    // mock) and B) extracted from Emscripten's preamble.js, where it should
    // be tested properly.
    throw new Error('Runtime error: expected the system to be little-endian.');
  }

  // tslint:disable:no-magic-numbers
  const STATIC_BASE = GLOBAL_BASE;
  const STATICTOP_INITIAL = STATIC_BASE + 67696 + 16;
  const DYNAMICTOP_PTR = STATICTOP_INITIAL;
  const DYNAMICTOP_PTR_SIZE = 4;
  // tslint:disable-next-line:no-bitwise
  const STATICTOP = (STATICTOP_INITIAL + DYNAMICTOP_PTR_SIZE + 15) & -16;
  const STACKTOP = alignMemory(STACK_ALIGN, STATICTOP);
  const STACK_BASE = STACKTOP;
  const STACK_MAX = STACK_BASE + TOTAL_STACK;
  const DYNAMIC_BASE = alignMemory(STACK_ALIGN, STACK_MAX);

  const heapU8 = new Uint8Array(wasmMemory.buffer);
  const heap32 = new Int32Array(wasmMemory.buffer);
  const heapU32 = new Uint32Array(wasmMemory.buffer);
  // tslint:disable-next-line:no-expression-statement no-bitwise no-object-mutation
  heap32[DYNAMICTOP_PTR >> 2] = DYNAMIC_BASE;

  const TABLE_SIZE = 6;
  const MAX_TABLE_SIZE = 6;

  // tslint:enable:no-magic-numbers

  // tslint:disable-next-line:no-let
  let getErrNoLocation: (() => number) | undefined;

  // note: A number of methods below are excluded from test coverage. They are
  // a) not part of the regular usage of this library (should only be evaluated
  // if the consumer mis-implements the library and exist only to make
  // debugging easier) and B) already tested adequately in Emscripten, from
  // which this section is extracted.
  const env = {
    DYNAMICTOP_PTR,
    STACKTOP,
    ___setErrNo: /* istanbul ignore next */ (value: number) => {
      // tslint:disable-next-line:no-if-statement
      if (getErrNoLocation !== undefined) {
        // tslint:disable-next-line:no-bitwise no-expression-statement no-object-mutation no-magic-numbers
        heap32[getErrNoLocation() >> 2] = value;
      }
      return value;
    },
    _abort: /* istanbul ignore next */ (err = 'Secp256k1 Error') => {
      throw new Error(err);
    },
    _emscripten_memcpy_big: /* istanbul ignore next */ (
      dest: number,
      src: number,
      num: number
    ) => {
      // tslint:disable-next-line:no-expression-statement
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
    getTotalMemory: () => TOTAL_MEMORY
  };

  const info = {
    env: {
      ...env,
      memory: wasmMemory,
      memoryBase: STATIC_BASE,
      table: new WebAssembly.Table({
        element: 'anyfunc',
        initial: TABLE_SIZE,
        maximum: MAX_TABLE_SIZE
      }),
      tableBase: 0
    },
    global: { NaN, Infinity }
  };

  return WebAssembly.instantiate(webassemblyBytes, info).then(result => {
    //
    // tslint:disable-next-line:no-expression-statement no-unsafe-any no-any
    getErrNoLocation = result.instance.exports.___errno_location as any;

    return wrapSecp256k1Wasm(result.instance, heapU8, heapU32);
  });
};

export const getEmbeddedSecp256k1Binary = () =>
  base64ToBin(secp256k1Base64Bytes).buffer;

/**
 * An ultimately-portable (but slower) version of `instantiateSecp256k1Bytes`
 * which does not require the consumer to provide the secp256k1 binary buffer.
 */
export const instantiateSecp256k1Wasm = async (): Promise<Secp256k1Wasm> =>
  instantiateSecp256k1WasmBytes(getEmbeddedSecp256k1Binary());
