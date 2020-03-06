/* eslint-disable functional/no-expression-statement */
import { randomBytes } from 'crypto';

import test from 'ava';

import { generatePrivateKey, instantiateSecp256k1 } from '../lib';

const privateKeyLength = 32;
const maximumUint8Value = 255;

const secureRandom = () => randomBytes(privateKeyLength);

const secp256k1Promise = instantiateSecp256k1();

test('generatePrivateKey: works', async t => {
  const secp256k1 = await secp256k1Promise;
  const key = generatePrivateKey(secp256k1, secureRandom);
  t.true(secp256k1.validatePrivateKey(key));
});

test('generatePrivateKey: tries until success', async t => {
  const secp256k1 = await secp256k1Promise;
  // eslint-disable-next-line functional/no-let
  let calls = 0;
  const entropy = [
    // eslint-disable-next-line functional/immutable-data
    Uint8Array.from(Array(privateKeyLength).fill(maximumUint8Value)),
    // eslint-disable-next-line functional/immutable-data
    Uint8Array.from(Array(privateKeyLength).fill(1))
  ];
  const mockEntropy = () => {
    // eslint-disable-next-line no-plusplus
    calls++;
    return entropy[calls];
  };

  const key = generatePrivateKey(secp256k1, mockEntropy);
  t.deepEqual(key, entropy[1]);
  t.deepEqual(calls, 1);
});
