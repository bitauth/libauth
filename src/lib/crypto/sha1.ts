import type { HashFunction } from '../lib.js';

import {
  base64ToBin,
  instantiateRustWasm,
  sha1Base64Bytes,
} from './dependencies.js';

export type Sha1 = HashFunction & {
  /**
   * Finish an incremental sha1 hashing computation.
   *
   * Returns the final hash.
   *
   * @param rawState - a raw state returned by `update`.
   */
  final: (rawState: Uint8Array) => Uint8Array;

  /**
   * Returns the sha1 hash of the provided input.
   *
   * To incrementally construct a sha1 hash (e.g. for streaming), use `init`,
   * `update`, and `final`.
   *
   * @param input - a Uint8Array to be hashed using sha1
   */
  hash: (input: Uint8Array) => Uint8Array;

  /**
   * Begin an incremental sha1 hashing computation.
   *
   * The returned raw state can be provided to `update` with additional input to
   * advance the computation.
   *
   * ## Example
   * ```ts
   * const state1 = sha1.init();
   * const state2 = sha1.update(state1, new Uint8Array([1, 2, 3]));
   * const state3 = sha1.update(state2, new Uint8Array([4, 5, 6]));
   * const hash = sha1.final(state3);
   * ```
   */
  init: () => Uint8Array;

  /**
   * Add input to an incremental sha1 hashing computation.
   *
   * Returns a raw state that can again be passed to `update` with additional
   * input to continue the computation.
   *
   * When the computation has been updated with all input, pass the raw state to
   * `final` to finish and return a hash.
   *
   * @param rawState - a raw state returned by either `init` or `update`
   * @param input - a Uint8Array to be added to the sha1 computation
   */
  update: (rawState: Uint8Array, input: Uint8Array) => Uint8Array;
};

/**
 * The most performant way to instantiate sha1 functionality. To avoid
 * using Node.js or DOM-specific APIs, you can use {@link instantiateSha1}.
 *
 * @param webassemblyBytes - A buffer containing the sha1 binary.
 */
export const instantiateSha1Bytes = async (
  webassemblyBytes: ArrayBuffer,
): Promise<Sha1> => {
  const wasm = await instantiateRustWasm(
    webassemblyBytes,
    './sha1',
    'sha1',
    'sha1_init',
    'sha1_update',
    'sha1_final',
  );
  return {
    final: wasm.final,
    hash: wasm.hash,
    init: wasm.init,
    update: wasm.update,
  };
};

export const getEmbeddedSha1Binary = (): ArrayBuffer =>
  base64ToBin(sha1Base64Bytes).buffer;

/**
 * An ultimately-portable (but slower) version of {@link instantiateSha1Bytes}
 * that does not require the consumer to provide the sha1 binary buffer.
 */
export const instantiateSha1 = async (): Promise<Sha1> =>
  instantiateSha1Bytes(getEmbeddedSha1Binary());
