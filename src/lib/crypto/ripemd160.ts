import {
  decodeBase64String,
  instantiateRustWasm,
  ripemd160Base64Bytes
} from '../bin';

export interface Ripemd160 {
  /**
   * Returns the ripemd160 hash of the provided input.
   *
   * To incrementally construct a ripemd160 hash (e.g. for streaming), use
   * `ripemd160Init`, `ripemd160Update`, and `ripemd160Final`.
   *
   * @param input a Uint8Array to be hashed using ripemd160
   */
  readonly hash: (input: Uint8Array) => Uint8Array;

  /**
   * Begin an incremental ripemd160 hashing computation.
   *
   * The returned raw state can be provided to `ripemd160Update` with additional
   * input to advance the computation.
   *
   * ## Example
   * ```ts
   * const state1 = ripemd160Init();
   * const state2 = ripemd160Update(state1, new Uint8Array([1, 2, 3]));
   * const state3 = ripemd160Update(state2, new Uint8Array([4, 5, 6]));
   * const hash = ripemd160Final(state3);
   * ```
   */
  readonly init: () => Uint8Array;

  /**
   * Add input to an incremental ripemd160 hashing computation.
   *
   * Returns a raw state which can again be passed to `ripemd160Update` with
   * additional input to continue the computation.
   *
   * When the computation has been updated with all input, pass the raw state to
   * `ripemd160Final` to finish and return a hash.
   *
   * @param rawState a raw state returned by either `ripemd160Init` or
   * `ripemd160Update`.
   * @param input a Uint8Array to be added to the ripemd160 computation
   */
  readonly update: (rawState: Uint8Array, input: Uint8Array) => Uint8Array;

  /**
   * Finish an incremental ripemd160 hashing computation.
   *
   * Returns the final hash.
   *
   * @param rawState a raw state returned by `ripemd160Update`.
   */
  readonly final: (rawState: Uint8Array) => Uint8Array;
}

/**
 * An ultimately-portable (but slower) version of `instantiateRipemd160Bytes`
 * which does not require the consumer to provide the ripemd160 binary buffer.
 */
export async function instantiateRipemd160(): Promise<Ripemd160> {
  return instantiateRipemd160Bytes(getEmbeddedRipemd160Binary());
}

/**
 * The most performant way to instantiate ripemd160 functionality. To avoid
 * using Node.js or DOM-specific APIs, you can use `instantiateRipemd160`.
 *
 * @param webassemblyBytes A buffer containing the ripemd160 binary.
 */
export async function instantiateRipemd160Bytes(
  webassemblyBytes: ArrayBuffer
): Promise<Ripemd160> {
  const wasm = await instantiateRustWasm(webassemblyBytes, './ripemd160');
  return {
    final: wasm.final,
    hash: wasm.hash,
    init: wasm.init,
    update: wasm.update
  };
}

export function getEmbeddedRipemd160Binary(): ArrayBuffer {
  return decodeBase64String(ripemd160Base64Bytes);
}
