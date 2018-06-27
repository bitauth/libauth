export interface HashFunction {
  readonly hash: (input: Uint8Array) => Uint8Array;
  readonly init: () => Uint8Array;
  readonly update: (rawState: Uint8Array, input: Uint8Array) => Uint8Array;
  readonly final: (rawState: Uint8Array) => Uint8Array;
}

/**
 * Note, most of this method is translated and boiled-down from the wasm-pack
 * workflow. Significant changes to wasm-bindgen or wasm-pack build will likely
 * require modifications to this method.
 */
export async function instantiateRustWasm(
  webassemblyBytes: ArrayBuffer,
  expectedImportModuleName: string,
  hashExportName: string,
  initExportName: string,
  updateExportName: string,
  finalExportName: string
): Promise<HashFunction> {
  const wasm = (await WebAssembly.instantiate(webassemblyBytes, {
    [expectedImportModuleName]: {
      /**
       * This would only be called in cases where a `__wbindgen_malloc` failed.
       * Since `__wbindgen_malloc` isn't exposed to consumers, this error
       * can only be encountered if the code below is broken.
       */
      __wbindgen_throw: /* istanbul ignore next */ (
        ptr: number,
        len: number
      ) => {
        throw new Error(
          Array.from(getUint8Memory().subarray(ptr, ptr + len))
            .map(num => String.fromCharCode(num))
            .join('')
        );
      }
    }
  })).instance.exports;

  // tslint:disable:no-let no-if-statement no-expression-statement
  let cachedUint8Memory: Uint8Array | undefined;
  let cachedUint32Memory: Uint32Array | undefined;
  let cachedGlobalArgumentPtr: number | undefined;

  function globalArgumentPtr(): number {
    if (cachedGlobalArgumentPtr === undefined) {
      cachedGlobalArgumentPtr = wasm.__wbindgen_global_argument_ptr() as number;
    }
    return cachedGlobalArgumentPtr;
  }
  function getUint8Memory(): Uint8Array {
    if (
      cachedUint8Memory === undefined ||
      cachedUint8Memory.buffer !== wasm.memory.buffer
    ) {
      cachedUint8Memory = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8Memory;
  }
  function getUint32Memory(): Uint32Array {
    if (
      cachedUint32Memory === undefined ||
      cachedUint32Memory.buffer !== wasm.memory.buffer
    ) {
      cachedUint32Memory = new Uint32Array(wasm.memory.buffer);
    }
    return cachedUint32Memory;
  }
  // tslint:enable:no-let no-if-statement

  function passArray8ToWasm(array: Uint8Array): ReadonlyArray<number> {
    const ptr: number = wasm.__wbindgen_malloc(array.length);
    getUint8Memory().set(array, ptr);
    return [ptr, array.length];
  }

  function getArrayU8FromWasm(ptr: number, len: number): Uint8Array {
    return getUint8Memory().subarray(ptr, ptr + len);
  }

  function hash(input: Uint8Array): Uint8Array {
    const [ptr0, len0] = passArray8ToWasm(input);
    const retPtr = globalArgumentPtr();
    try {
      wasm[hashExportName](retPtr, ptr0, len0);
      const mem = getUint32Memory();
      const ptr = mem[retPtr / 4];
      const len = mem[retPtr / 4 + 1];
      const realRet = getArrayU8FromWasm(ptr, len).slice();
      wasm.__wbindgen_free(ptr, len);
      return realRet;
    } finally {
      wasm.__wbindgen_free(ptr0, len0);
    }
  }

  function init(): Uint8Array {
    const retPtr = globalArgumentPtr();
    wasm[initExportName](retPtr);
    const mem = getUint32Memory();
    const ptr = mem[retPtr / 4];
    const len = mem[retPtr / 4 + 1];
    const realRet = getArrayU8FromWasm(ptr, len).slice();
    wasm.__wbindgen_free(ptr, len);
    return realRet;
  }

  function update(rawState: Uint8Array, input: Uint8Array): Uint8Array {
    const [ptr0, len0] = passArray8ToWasm(rawState);
    const [ptr1, len1] = passArray8ToWasm(input);
    const retPtr = globalArgumentPtr();
    try {
      wasm[updateExportName](retPtr, ptr0, len0, ptr1, len1);
      const mem = getUint32Memory();
      const ptr = mem[retPtr / 4];
      const len = mem[retPtr / 4 + 1];
      const realRet = getArrayU8FromWasm(ptr, len).slice();
      wasm.__wbindgen_free(ptr, len * 1);
      return realRet;
    } finally {
      rawState.set(getUint8Memory().subarray(ptr0 / 1, ptr0 / 1 + len0));
      wasm.__wbindgen_free(ptr0, len0 * 1);
      wasm.__wbindgen_free(ptr1, len1 * 1);
    }
  }

  function final(rawState: Uint8Array): Uint8Array {
    const [ptr0, len0] = passArray8ToWasm(rawState);
    const retPtr = globalArgumentPtr();
    try {
      wasm[finalExportName](retPtr, ptr0, len0);
      const mem = getUint32Memory();
      const ptr = mem[retPtr / 4];
      const len = mem[retPtr / 4 + 1];
      const realRet = getArrayU8FromWasm(ptr, len).slice();
      wasm.__wbindgen_free(ptr, len * 1);
      return realRet;
    } finally {
      rawState.set(getUint8Memory().subarray(ptr0 / 1, ptr0 / 1 + len0));
      wasm.__wbindgen_free(ptr0, len0 * 1);
    }
  }
  // tslint:enable:no-expression-statement
  return {
    final,
    hash,
    init,
    update
  };
}
