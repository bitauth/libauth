/**
 * Verify that a private key is valid for the Secp256k1 curve. Returns `true`
 * for success, or `false` on failure.
 *
 * Private keys are 256-bit numbers encoded as a 32-byte, big-endian Uint8Array.
 * Nearly every 256-bit number is a valid secp256k1 private key. Specifically,
 * any 256-bit number greater than `0x01` and less than
 * `0xFFFF FFFF FFFF FFFF FFFF FFFF FFFF FFFE BAAE DCE6 AF48 A03B BFD2 5E8C D036 4140`
 * is a valid private key. This range is part of the definition of the
 * secp256k1 elliptic curve parameters.
 *
 * This method does not require the `Secp256k1` WASM implementation (available
 * via `instantiateSecp256k1`).
 */
export const validateSecp256k1PrivateKey = (privateKey: Uint8Array) => {
  const privateKeyLength = 32;
  if (
    privateKey.length !== privateKeyLength ||
    privateKey.every((value) => value === 0)
  ) {
    return false;
  }

  /**
   * The largest possible Secp256k1 private key – equal to the order of the
   * Secp256k1 curve minus one.
   */
  // prettier-ignore
  const maximumSecp256k1PrivateKey = [255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 254, 186, 174, 220, 230, 175, 72, 160, 59, 191, 210, 94, 140, 208, 54, 65, 63]; // eslint-disable-line @typescript-eslint/no-magic-numbers

  const firstDifference = privateKey.findIndex(
    (value, i) => value !== maximumSecp256k1PrivateKey[i]
  );

  if (
    firstDifference === -1 ||
    privateKey[firstDifference] < maximumSecp256k1PrivateKey[firstDifference]
  ) {
    return true;
  }

  return false;
};

/**
 * Securely generate a valid Secp256k1 private key given a secure source of
 * randomness.
 *
 * **Node.js Usage**
 * ```ts
 * import { randomBytes } from 'crypto';
 * import { generatePrivateKey } from '@bitauth/libauth';
 *
 * const key = generatePrivateKey(secp256k1, () => randomBytes(32));
 * ```
 *
 * **Browser Usage**
 * ```ts
 * import { generatePrivateKey } from '@bitauth/libauth';
 *
 * const key = generatePrivateKey(secp256k1, () =>
 *   window.crypto.getRandomValues(new Uint8Array(32))
 * );
 * ```
 *
 * @param secp256k1 - an implementation of Secp256k1
 * @param secureRandom - a method which returns a securely-random 32-byte
 * Uint8Array
 */
export const generatePrivateKey = (secureRandom: () => Uint8Array) => {
  // eslint-disable-next-line functional/no-let, @typescript-eslint/init-declarations
  let maybeKey: Uint8Array;
  // eslint-disable-next-line functional/no-loop-statement
  do {
    // eslint-disable-next-line functional/no-expression-statement
    maybeKey = secureRandom();
  } while (!validateSecp256k1PrivateKey(maybeKey));
  return maybeKey;
};
