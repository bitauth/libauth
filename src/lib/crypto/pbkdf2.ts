import { numberToBinUint32BE } from '../format/format.js';
import { hmacSha256, hmacSha512 } from './crypto.js';

export enum Pbkdf2Errors {
  invalidIterationsError = 'Invalid PBKDF2 Parameters: Iterations must be a positive integer',
  invalidDerivedKeyLengthError = 'Invalid PBKDF2 Parameters: Derived Key Length must be a positive integer',
  invalidHmacLength = 'Invalid HMAC length: HMAC length must be a positive integer',
}

/**
 * An object representing the parameters to use with PBKDF2 (Password-Based Key Derivation Function 2).
 */
export interface Pbkdf2Parameters {
  /** The length of the derived key in bytes. */
  derivedKeyLength: number;
  password: Uint8Array;
  iterations: number;
  salt: Uint8Array;
}

export const instantiatePbkdf2Function =
  (hmacFunction: (secret: Uint8Array, message: Uint8Array) => Uint8Array, hmacLength: number) =>
  (parameters: Pbkdf2Parameters) => {
    /* eslint-disable functional/no-let, functional/no-loop-statement, functional/no-expression-statement, no-bitwise, no-plusplus */
    const { password, salt, iterations, derivedKeyLength } = parameters;

    if (!Number.isInteger(iterations) || iterations <= 0) {
      return Pbkdf2Errors.invalidIterationsError;
    }

    if (!Number.isInteger(derivedKeyLength) || derivedKeyLength <= 0) {
      return Pbkdf2Errors.invalidDerivedKeyLengthError;
    }

    if (!Number.isInteger(hmacLength) || hmacLength <= 0) {
      return Pbkdf2Errors.invalidHmacLength;
    }

    const iterationCountByteSize = 4;

    const derivedKey = new Uint8Array(derivedKeyLength);
    const block = new Uint8Array(salt.length + iterationCountByteSize);
    block.set(salt, 0);

    let destPos = 0;
    const length = Math.ceil(derivedKeyLength / hmacLength);

    for (let i = 1; i <= length; i++) {
      const iterationUint32BEEncoded = numberToBinUint32BE(i);
      block.set(iterationUint32BEEncoded, salt.length);

      const T = hmacFunction(password, block);
      let U = T;

      for (let j = 1; j < iterations; j++) {
        U = hmacFunction(password, U);

        for (let k = 0; k < hmacLength; k++) {
          // @ts-expect-error-next-line
          T[k] ^= U[k];
        }
      }

      // Truncate the results to the maximum key length.
      const truncated = T.subarray(0, derivedKeyLength);

      derivedKey.set(truncated, destPos);
      destPos += hmacLength;
    }

    return derivedKey;
    /* eslint-enable functional/no-let, functional/no-loop-statement, functional/no-expression-statement, no-bitwise, no-plusplus */
  }

export const pbkdf2HmacSha256 = (
  parameters: Pbkdf2Parameters,
  sha256Hmac: (secret: Uint8Array, message: Uint8Array) => Uint8Array = hmacSha256
) => {
  return instantiatePbkdf2Function(sha256Hmac, 32)(parameters);
}

export const pbkdf2HmacSha512 = (
  parameters: Pbkdf2Parameters,
  sha512Hmac: (secret: Uint8Array, message: Uint8Array) => Uint8Array = hmacSha512
) => {
  return instantiatePbkdf2Function(sha512Hmac, 64)(parameters);
}
