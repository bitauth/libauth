import {
  HashFunction,
  instantiateRustWasm,
  sha512Base64Bytes,
} from '../bin/bin';
import { base64ToBin } from '../format/format';

export interface Sha512 extends HashFunction {
  /**
   * Finish an incremental sha512 hashing computation.
   *
   * Returns the final hash.
   *
   * @param rawState - a raw state returned by `update`.
   */
  readonly final: (rawState: Uint8Array) => Uint8Array;

  /**
   * Returns the sha512 hash of the provided input.
   *
   * To incrementally construct a sha512 hash (e.g. for streaming), use `init`,
   * `update`, and `final`.
   *
   * @param input - a Uint8Array to be hashed using sha512
   */
  readonly hash: (input: Uint8Array) => Uint8Array;

  /**
   * Begin an incremental sha512 hashing computation.
   *
   * The returned raw state can be provided to `update` with additional input to
   * advance the computation.
   *
   * ## Example
   * ```ts
   * const state1 = sha512.init();
   * const state2 = sha512.update(state1, new Uint8Array([1, 2, 3]));
   * const state3 = sha512.update(state2, new Uint8Array([4, 5, 6]));
   * const hash = sha512.final(state3);
   * ```
   */
  readonly init: () => Uint8Array;

  /**
   * Add input to an incremental sha512 hashing computation.
   *
   * Returns a raw state which can again be passed to `update` with additional
   * input to continue the computation.
   *
   * When the computation has been updated with all input, pass the raw state to
   * `final` to finish and return a hash.
   *
   * @param rawState - a raw state returned by either `init` or `update`
   * @param input - a Uint8Array to be added to the sha512 computation
   */
  readonly update: (rawState: Uint8Array, input: Uint8Array) => Uint8Array;
}

/**
 * The most performant way to instantiate sha512 functionality. To avoid
 * using Node.js or DOM-specific APIs, you can use `instantiateSha512`.
 *
 * @param webassemblyBytes - A buffer containing the sha512 binary.
 */
export const instantiateSha512Bytes = async (
  webassemblyBytes: ArrayBuffer
): Promise<Sha512> => {
  const wasm = await instantiateRustWasm(
    webassemblyBytes,
    './sha512',
    'sha512',
    'sha512_init',
    'sha512_update',
    'sha512_final'
  );
  return {
    final: wasm.final,
    hash: wasm.hash,
    init: wasm.init,
    update: wasm.update,
  };
};

export const getEmbeddedSha512Binary = () =>
  base64ToBin(sha512Base64Bytes).buffer;

const cachedSha512: { cache?: Promise<Sha512> } = {};

/**
 * An ultimately-portable (but slower) version of `instantiateSha512Bytes`
 * which does not require the consumer to provide the sha512 binary buffer.
 */
export const instantiateSha512 = async (): Promise<Sha512> => {
  if (cachedSha512.cache !== undefined) {
    return cachedSha512.cache;
  }
  const result = instantiateSha512Bytes(getEmbeddedSha512Binary());
  // eslint-disable-next-line functional/immutable-data, functional/no-expression-statement
  cachedSha512.cache = result;
  return result;
};
