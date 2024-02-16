import { numberToBinUint32BE } from '../format/format.js';

import type { HmacFunction } from './hmac.js';
import { hmacSha256, hmacSha512 } from './hmac.js';

export enum Pbkdf2Errors {
  invalidIterations = 'Invalid PBKDF2 Parameters: Iterations must be a positive integer',
  invalidDerivedKeyLength = 'Invalid PBKDF2 Parameters: Derived Key Length must be a positive integer',
  invalidHmacLength = 'Invalid HMAC length: HMAC length must be a positive integer',
}

/**
 * An object representing the parameters to use with PBKDF2 (Password-Based Key Derivation Function 2).
 */
export type Pbkdf2Parameters = {
  /** The length of the derived key in bytes. */
  derivedKeyLength: number;
  password: Uint8Array;
  iterations: number;
  salt: Uint8Array;
};

/**
 * Instantiate a PBKDF2 function as specified by RFC 2898.
 *
 * @param hmacFunction - the HMAC function to use
 * @param hmacByteLength - the byte-length of the HMAC function
 */
export const instantiatePbkdf2Function =
  (hmacFunction: HmacFunction, hmacByteLength: number) =>
  // eslint-disable-next-line complexity
  (parameters: Pbkdf2Parameters) => {
    /* eslint-disable functional/immutable-data, functional/no-let, functional/no-loop-statements, functional/no-expression-statements, no-bitwise, no-plusplus */
    const { password, salt, iterations, derivedKeyLength } = parameters;

    if (!Number.isInteger(iterations) || iterations <= 0) {
      return Pbkdf2Errors.invalidIterations;
    }

    if (!Number.isInteger(derivedKeyLength) || derivedKeyLength <= 0) {
      return Pbkdf2Errors.invalidDerivedKeyLength;
    }

    if (!Number.isInteger(hmacByteLength) || hmacByteLength <= 0) {
      return Pbkdf2Errors.invalidHmacLength;
    }

    const iterationCountByteLength = 4;

    const derivedKey = new Uint8Array(derivedKeyLength);
    const block = new Uint8Array(salt.length + iterationCountByteLength);
    block.set(salt, 0);

    let destPos = 0;
    const length = Math.ceil(derivedKeyLength / hmacByteLength);

    for (let i = 1; i <= length; i++) {
      const iterationUint32BEEncoded = numberToBinUint32BE(i);
      block.set(iterationUint32BEEncoded, salt.length);

      const T = hmacFunction(password, block);
      let U = T;

      for (let j = 1; j < iterations; j++) {
        U = hmacFunction(password, U);

        for (let k = 0; k < hmacByteLength; k++) {
          // @ts-expect-error-next-line
          T[k] ^= U[k];
        }
      }

      // Truncate the results to the maximum key length.
      const truncated = T.subarray(0, derivedKeyLength);

      derivedKey.set(truncated, destPos);
      destPos += hmacByteLength;
    }

    return derivedKey;
    /* eslint-enable functional/immutable-data, functional/no-let, functional/no-loop-statements, functional/no-expression-statements, no-bitwise, no-plusplus */
  };

const hmacSha256ByteLength = 32;

/**
 * Derive a key using PBKDF2 and the HMAC SHA256 function as specified in RFC 2898.
 *
 * @param parameters - the PBKDF2 parameters to use
 * @param sha256Hmac - the SHA256 HMAC implementation to use
 */
export const pbkdf2HmacSha256 = (
  parameters: Pbkdf2Parameters,
  sha256Hmac: HmacFunction = hmacSha256,
) => instantiatePbkdf2Function(sha256Hmac, hmacSha256ByteLength)(parameters);

const hmacSha512ByteLength = 64;

/**
 * Derive a key using PBKDF2 and the HMAC SHA512 function as specified in RFC 2898.
 *
 * @param parameters - the PBKDF2 parameters to use
 * @param sha512Hmac - the SHA512 HMAC implementation to use
 */
export const pbkdf2HmacSha512 = (
  parameters: Pbkdf2Parameters,
  sha512Hmac: HmacFunction = hmacSha512,
) => instantiatePbkdf2Function(sha512Hmac, hmacSha512ByteLength)(parameters);
