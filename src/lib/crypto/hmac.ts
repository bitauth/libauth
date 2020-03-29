import { flattenBinArray } from '../format/hex';

import { Sha256 } from './sha256';
import { Sha512 } from './sha512';

/**
 * Instantiate a hash-based message authentication code (HMAC) function as
 * specified by RFC 2104.
 *
 * @param hashFunction - a cryptographic hash function which iterates a basic
 * compression function on blocks of data
 * @param blockByteLength - the byte-length of blocks used in `hashFunction`
 */
export const instantiateHmacFunction = (
  hashFunction: (input: Uint8Array) => Uint8Array,
  blockByteLength: number
) => (secret: Uint8Array, message: Uint8Array) => {
  const key = new Uint8Array(blockByteLength).fill(0);
  // eslint-disable-next-line functional/no-expression-statement
  key.set(secret.length > blockByteLength ? hashFunction(secret) : secret, 0);

  const innerPaddingFill = 0x36;
  const innerPadding = new Uint8Array(blockByteLength).fill(innerPaddingFill);
  // eslint-disable-next-line no-bitwise
  const innerPrefix = innerPadding.map((pad, index) => pad ^ key[index]);
  const innerContent = flattenBinArray([innerPrefix, message]);
  const innerResult = hashFunction(innerContent);

  const outerPaddingFill = 0x5c;
  const outerPadding = new Uint8Array(blockByteLength).fill(outerPaddingFill);
  // eslint-disable-next-line no-bitwise
  const outerPrefix = outerPadding.map((pad, index) => pad ^ key[index]);
  return hashFunction(flattenBinArray([outerPrefix, innerResult]));
};

const sha256BlockByteLength = 64;

/**
 * Create a hash-based message authentication code using HMAC-SHA256 as
 * specified in `RFC 4231`. Returns a 32-byte Uint8Array.
 *
 * Secrets longer than the block byte-length (64 bytes) are hashed before
 * use, shortening their length to the minimum recommended length (32 bytes).
 * See `RFC 2104` for details.
 *
 * @param sha256 - an implementation of Sha256
 * @param secret - the secret key (recommended length: 32-64 bytes)
 * @param message - the message to authenticate
 */
export const hmacSha256 = (
  sha256: { hash: Sha256['hash'] },
  secret: Uint8Array,
  message: Uint8Array
) =>
  instantiateHmacFunction(sha256.hash, sha256BlockByteLength)(secret, message);

const sha512BlockByteLength = 128;

/**
 * Create a hash-based message authentication code using HMAC-SHA512 as
 * specified in `RFC 4231`. Returns a 64-byte Uint8Array.
 *
 * Secrets longer than the block byte-length (128 bytes) are hashed before
 * use, shortening their length to the minimum recommended length (64 bytes).
 * See `RFC 2104` for details.
 *
 * @param sha512 - an implementation of Sha512
 * @param secret - the secret key (recommended length: 64-128 bytes)
 * @param message - the message to authenticate
 */
export const hmacSha512 = (
  sha512: { hash: Sha512['hash'] },
  secret: Uint8Array,
  message: Uint8Array
) =>
  instantiateHmacFunction(sha512.hash, sha512BlockByteLength)(secret, message);
