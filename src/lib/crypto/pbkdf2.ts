import { numberToBinUint32BE } from '../format/format.js';

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

/**
 * Computes the PBKDF2 (Password-Based Key Derivation Function 2) algorithm using the provided parameters.
 *
 * @param parameters - The object containing the parameters for the PBKDF2 algorithm.
 * @param hmacFunction - The HMAC (Hash-based Message Authentication Code) function used in the PBKDF2 algorithm.
 * @param hmacLength - The length of the output produced by the HMAC function.
 */
export const pbkdf2 = (
  parameters: Pbkdf2Parameters,
  hmacFunction: (secret: Uint8Array, message: Uint8Array) => Uint8Array,
  hmacLength: number
): Uint8Array => {
  /* eslint-disable functional/no-let, functional/no-loop-statement, functional/no-expression-statement, no-bitwise, no-plusplus */
  const iterationCountByteSize = 4;
  const { password, salt, iterations, derivedKeyLength } = parameters;

  const derivedKey = new Uint8Array(derivedKeyLength);
  const block = new Uint8Array(salt.length + iterationCountByteSize);
  block.set(salt, 0);

  let destPos = 0;
  const length = Math.ceil(derivedKeyLength / hmacLength);

  for (let iteration = 1; iteration <= length; iteration++) {
    const iterationUint32BEEncoded = numberToBinUint32BE(iteration);
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
};
