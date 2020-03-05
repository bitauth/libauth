import { Secp256k1 } from '../crypto/crypto';

/**
 * Securely generate a valid Secp256k1 private key given a secure source of
 * randomness.
 *
 * **Node.js Usage**
 * ```ts
 * import { randomBytes } from 'crypto';
 * import { generatePrivateKey, instantiateSecp256k1 } from 'bitcoin-ts';
 *
 * (async () => {
 *   const secp256k1 = await instantiateSecp256k1();
 *   const key = generatePrivateKey(secp256k1, () => randomBytes(32));
 *   // ...
 * })();
 * ```
 *
 * **Browser Usage**
 * ```ts
 * import { generatePrivateKey, instantiateSecp256k1 } from 'bitcoin-ts';
 *
 * (async () => {
 *   const secp256k1 = await instantiateSecp256k1();
 *   const key = generatePrivateKey(secp256k1, () =>
 *     window.crypto.getRandomValues(new Uint8Array(32))
 *   );
 *   // ...
 * })();
 * ```
 *
 * @param secp256k1 - an implementation of Secp256k1
 * @param secureRandom - a method which returns a securely-random 32-byte
 * Uint8Array
 */
export const generatePrivateKey = (
  secp256k1: { validatePrivateKey: Secp256k1['validatePrivateKey'] },
  secureRandom: () => Uint8Array
) => {
  // eslint-disable-next-line functional/no-let, init-declarations
  let maybeKey: Uint8Array;
  // eslint-disable-next-line functional/no-loop-statement
  do {
    // eslint-disable-next-line functional/no-expression-statement
    maybeKey = secureRandom();
  } while (!secp256k1.validatePrivateKey(maybeKey));
  return maybeKey;
};
