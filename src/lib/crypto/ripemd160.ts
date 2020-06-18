import {
  HashFunction,
  instantiateRustWasm,
  ripemd160Base64Bytes,
} from '../bin/bin';
import { base64ToBin } from '../format/format';

export interface Ripemd160 extends HashFunction {
  /**
   * Finish an incremental ripemd160 hashing computation.
   *
   * Returns the final hash.
   *
   * @param rawState - a raw state returned by `update`
   */
  readonly final: (rawState: Uint8Array) => Uint8Array;

  /**
   * Returns the ripemd160 hash of the provided input.
   *
   * To incrementally construct a ripemd160 hash (e.g. for streaming), use
   * `init`, `update`, and `final`.
   *
   * @param input - a Uint8Array to be hashed using ripemd160
   */
  readonly hash: (input: Uint8Array) => Uint8Array;

  /**
   * Begin an incremental ripemd160 hashing computation.
   *
   * The returned raw state can be provided to `update` with additional input to
   * advance the computation.
   *
   * ## Example
   * ```ts
   * const state1 = ripemd160.init();
   * const state2 = ripemd160.update(state1, new Uint8Array([1, 2, 3]));
   * const state3 = ripemd160.update(state2, new Uint8Array([4, 5, 6]));
   * const hash = ripemd160.final(state3);
   * ```
   */
  readonly init: () => Uint8Array;

  /**
   * Add input to an incremental ripemd160 hashing computation.
   *
   * Returns a raw state which can again be passed to `update` with additional
   * input to continue the computation.
   *
   * When the computation has been updated with all input, pass the raw state to
   * `final` to finish and return a hash.
   *
   * @param rawState - a raw state returned by either `init` or `update`
   * @param input - a Uint8Array to be added to the ripemd160 computation
   */
  readonly update: (rawState: Uint8Array, input: Uint8Array) => Uint8Array;
}

/**
 * The most performant way to instantiate ripemd160 functionality. To avoid
 * using Node.js or DOM-specific APIs, you can use `instantiateRipemd160`.
 *
 * @param webassemblyBytes - A buffer containing the ripemd160 binary.
 */
export const instantiateRipemd160Bytes = async (
  webassemblyBytes: ArrayBuffer
): Promise<Ripemd160> => {
  const wasm = await instantiateRustWasm(
    webassemblyBytes,
    './ripemd160',
    'ripemd160',
    'ripemd160_init',
    'ripemd160_update',
    'ripemd160_final'
  );
  return {
    final: wasm.final,
    hash: wasm.hash,
    init: wasm.init,
    update: wasm.update,
  };
};

export const getEmbeddedRipemd160Binary = () =>
  base64ToBin(ripemd160Base64Bytes).buffer;

const cachedRipemd160: { cache?: Promise<Ripemd160> } = {};

/**
 * An ultimately-portable (but slower) version of `instantiateRipemd160Bytes`
 * which does not require the consumer to provide the ripemd160 binary buffer.
 */
export const instantiateRipemd160 = async (): Promise<Ripemd160> => {
  if (cachedRipemd160.cache !== undefined) {
    return cachedRipemd160.cache;
  }
  const result = instantiateRipemd160Bytes(getEmbeddedRipemd160Binary());
  // eslint-disable-next-line functional/immutable-data, functional/no-expression-statement
  cachedRipemd160.cache = result;
  return result;
};
