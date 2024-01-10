import type { Ripemd160, Sha256 } from '../lib.js';

import {
  ripemd160 as internalRipemd160,
  sha256 as internalSha256,
} from './default-crypto-instances.js';

/**
 * Hash the given payload with sha256, then hash the 32-byte result with
 * ripemd160, returning a 20-byte hash.
 *
 * This hash is used in both {@link AddressType.p2pkh} and
 * {@link AddressType.p2sh20} addresses.
 *
 * @param payload - the Uint8Array to hash
 */
export const hash160 = (
  payload: Uint8Array,
  crypto: {
    ripemd160: { hash: Ripemd160['hash'] };
    sha256: { hash: Sha256['hash'] };
  } = { ripemd160: internalRipemd160, sha256: internalSha256 },
) => crypto.ripemd160.hash(crypto.sha256.hash(payload));

/**
 * Hash the given payload with sha256, then hash the 32-byte result with
 * one final round of sha256, returning a 32-byte hash.
 *
 * This type of hash is used to generate identifiers for transactions and blocks
 * (and therefore in block mining).
 *
 * @param payload - the Uint8Array to hash
 */
export const hash256 = (
  payload: Uint8Array,
  sha256: { hash: Sha256['hash'] } = internalSha256,
) => sha256.hash(sha256.hash(payload));
