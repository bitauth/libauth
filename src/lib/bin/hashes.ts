import { binsAreEqual } from '../format/hex.js';

export type HashFunction = {
  final: (rawState: Uint8Array) => Uint8Array;
  hash: (input: Uint8Array) => Uint8Array;
  init: () => Uint8Array;
  update: (rawState: Uint8Array, input: Uint8Array) => Uint8Array;
};

/* eslint-disable @typescript-eslint/require-await, functional/no-return-void, functional/no-expression-statements, @typescript-eslint/no-magic-numbers, @typescript-eslint/naming-convention */
/**
 * Reads in a wasm binary as an ArrayBuffer, checks if it was compressed and
 * decompresses it if necessary. Returns a Response object with the wasm binary compatible with WebAssembly.instantiateStreaming.
 */
export const streamWasmArrayBuffer = async (
  wasmArrayBuffer: ArrayBuffer,
): Promise<Response> => {
  // currently, we consume the data in a single chunk, but when ReadableStream.from() becomes widely available, we can switch to it
  const wasmStream = new ReadableStream({
    start(controller): void {
      controller.enqueue(new Uint8Array(wasmArrayBuffer));
      controller.close();
    },
  });

  // if source is uncompressed, then return as is
  if (
    binsAreEqual(
      new Uint8Array(wasmArrayBuffer, 0, 4),
      new Uint8Array([0x00, 0x61, 0x73, 0x6d]),
    )
  ) {
    return new Response(wasmStream, {
      headers: new Headers({ 'content-type': 'application/wasm' }),
    });
  }

  // otherwise, decompress the source
  return new Response(wasmStream.pipeThrough(new DecompressionStream('gzip')), {
    headers: new Headers({ 'content-type': 'application/wasm' }),
  });
};
/* eslint-enable @typescript-eslint/require-await, functional/no-return-void, functional/no-expression-statements, @typescript-eslint/no-magic-numbers, @typescript-eslint/naming-convention */

/* eslint-disable functional/no-conditional-statements, functional/no-let, functional/no-expression-statements, no-underscore-dangle, functional/no-try-statements, @typescript-eslint/no-magic-numbers, @typescript-eslint/max-params, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-non-null-assertion */
/**
 * Note, most of this method is translated and boiled-down from the wasm-pack
 * workflow. Significant changes to wasm-bindgen or wasm-pack build will likely
 * require modifications to this method.
 */
export const instantiateRustWasm = async (
  webassemblyBytes: ArrayBuffer,
  expectedImportModuleName: string,
  hashExportName: string,
  initExportName: string,
  updateExportName: string,
  finalExportName: string,
): Promise<HashFunction> => {
  const webassemblyByteStream = await streamWasmArrayBuffer(webassemblyBytes);
  const wasm = (
    await WebAssembly.instantiateStreaming(webassemblyByteStream, {
      [expectedImportModuleName]: {
        /**
         * This would only be called in cases where a `__wbindgen_malloc` failed.
         * Since `__wbindgen_malloc` isn't exposed to consumers, this error
         * can only be encountered if the code below is broken.
         */
        /* c8 ignore next 10 */
        // eslint-disable-next-line camelcase, @typescript-eslint/naming-convention
        __wbindgen_throw: (ptr: number, len: number) => {
          // eslint-disable-next-line functional/no-throw-statements
          throw new Error(
            // eslint-disable-next-line @typescript-eslint/no-use-before-define
            Array.from(getUint8Memory().subarray(ptr, ptr + len))
              .map((num) => String.fromCharCode(num))
              .join(''),
          );
        },
      },
    })
  ).instance.exports as unknown as any; // eslint-disable-line @typescript-eslint/no-explicit-any

  let cachedUint8Memory: Uint8Array | undefined; // eslint-disable-line @typescript-eslint/init-declarations
  let cachedUint32Memory: Uint32Array | undefined; // eslint-disable-line @typescript-eslint/init-declarations
  let cachedGlobalArgumentPtr: number | undefined; // eslint-disable-line @typescript-eslint/init-declarations

  const globalArgumentPtr = () => {
    if (cachedGlobalArgumentPtr === undefined) {
      cachedGlobalArgumentPtr = wasm.__wbindgen_global_argument_ptr();
    }

    return cachedGlobalArgumentPtr!;
  };
  /**
   * Must be hoisted for `__wbindgen_throw`.
   */
  // eslint-disable-next-line func-style
  function getUint8Memory(): Uint8Array {
    if (
      cachedUint8Memory === undefined ||
      cachedUint8Memory.buffer !== wasm.memory.buffer
    ) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      cachedUint8Memory = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8Memory;
  }
  const getUint32Memory = () => {
    if (
      cachedUint32Memory === undefined ||
      cachedUint32Memory.buffer !== wasm.memory.buffer
    ) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      cachedUint32Memory = new Uint32Array(wasm.memory.buffer);
    }
    return cachedUint32Memory;
  };

  const passArray8ToWasm = (array: Uint8Array) => {
    const ptr: number = wasm.__wbindgen_malloc(array.length);
    getUint8Memory().set(array, ptr);
    return [ptr, array.length];
  };

  const getArrayU8FromWasm = (ptr: number, len: number) =>
    getUint8Memory().subarray(ptr, ptr + len);

  const hash = (input: Uint8Array) => {
    const [ptr0, len0] = passArray8ToWasm(input);
    const retPtr = globalArgumentPtr();
    try {
      wasm[hashExportName](retPtr, ptr0, len0);
      const mem = getUint32Memory();
      const ptr = mem[retPtr / 4]!;
      const len = mem[retPtr / 4 + 1]!;
      const realRet = getArrayU8FromWasm(ptr, len).slice();
      wasm.__wbindgen_free(ptr, len);
      return realRet;
    } finally {
      wasm.__wbindgen_free(ptr0, len0);
    }
  };

  const init = () => {
    const retPtr = globalArgumentPtr();
    wasm[initExportName](retPtr);
    const mem = getUint32Memory();
    const ptr = mem[retPtr / 4]!;
    const len = mem[retPtr / 4 + 1]!;
    const realRet = getArrayU8FromWasm(ptr, len).slice();
    wasm.__wbindgen_free(ptr, len);
    return realRet;
  };

  const update = (rawState: Uint8Array, input: Uint8Array) => {
    const [ptr0, len0] = passArray8ToWasm(rawState) as [number, number];
    const [ptr1, len1] = passArray8ToWasm(input);
    const retPtr = globalArgumentPtr();
    try {
      wasm[updateExportName](retPtr, ptr0, len0, ptr1, len1);
      const mem = getUint32Memory();
      const ptr = mem[retPtr / 4]!;
      const len = mem[retPtr / 4 + 1]!;
      const realRet = getArrayU8FromWasm(ptr, len).slice();
      wasm.__wbindgen_free(ptr, len);
      return realRet;
    } finally {
      rawState.set(getUint8Memory().subarray(ptr0 / 1, ptr0 / 1 + len0));
      wasm.__wbindgen_free(ptr0, len0);
      wasm.__wbindgen_free(ptr1, len1);
    }
  };

  const final = (rawState: Uint8Array) => {
    const [ptr0, len0] = passArray8ToWasm(rawState) as [number, number];
    const retPtr = globalArgumentPtr();
    try {
      wasm[finalExportName](retPtr, ptr0, len0);
      const mem = getUint32Memory();
      const ptr = mem[retPtr / 4]!;
      const len = mem[retPtr / 4 + 1]!;
      const realRet = getArrayU8FromWasm(ptr, len).slice();
      wasm.__wbindgen_free(ptr, len);
      return realRet;
    } finally {
      rawState.set(getUint8Memory().subarray(ptr0 / 1, ptr0 / 1 + len0));
      wasm.__wbindgen_free(ptr0, len0);
    }
  };
  return {
    final,
    hash,
    init,
    update,
  };
};
/* eslint-enable functional/no-conditional-statements, functional/no-let, functional/no-expression-statements, no-underscore-dangle, functional/no-try-statements, @typescript-eslint/no-magic-numbers, @typescript-eslint/max-params, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-non-null-assertion */
