import { randomBytes } from 'crypto';

import test from 'ava';
import { fc, testProp } from 'ava-fast-check';

import {
  generatePrivateKey,
  hexToBin,
  secp256k1,
  validateSecp256k1PrivateKey,
} from '../lib.js';

const privateKeyLength = 32;
const maximumUint8Value = 255;

const secureRandom = () => randomBytes(privateKeyLength);

test('validateSecp256k1PrivateKey', (t) => {
  t.false(validateSecp256k1PrivateKey(hexToBin('')));
  t.false(validateSecp256k1PrivateKey(hexToBin('00')));
  t.false(
    validateSecp256k1PrivateKey(
      hexToBin(
        '0000000000000000000000000000000000000000000000000000000000000000'
      )
    )
  );
  t.true(
    validateSecp256k1PrivateKey(
      hexToBin(
        '0000000000000000000000000000000000000000000000000000000000000001'
      )
    )
  );
  t.true(
    validateSecp256k1PrivateKey(
      hexToBin(
        '00ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'
      )
    )
  );
  t.true(
    validateSecp256k1PrivateKey(
      hexToBin(
        'fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd036413f'
      )
    )
  );
  t.false(
    validateSecp256k1PrivateKey(
      hexToBin(
        'fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364140'
      )
    )
  );
});

const secp256k1OrderNFFBytes = 15;

const almostInvalid = Array(secp256k1OrderNFFBytes).fill(
  maximumUint8Value
) as number[];
const theRest = privateKeyLength - almostInvalid.length;

testProp(
  '[fast-check] validateSecp256k1PrivateKey <-> Secp256k1.validatePrivateKey',
  [
    fc
      .array(fc.integer(0, maximumUint8Value), theRest, theRest)
      .map((random) => Uint8Array.from([...almostInvalid, ...random])),
  ],
  (t, input) => {
    t.deepEqual(
      validateSecp256k1PrivateKey(input),
      secp256k1.validatePrivateKey(input)
    );
  }
);

test('generatePrivateKey: works', (t) => {
  const key = generatePrivateKey(secureRandom);
  t.true(secp256k1.validatePrivateKey(key));
});

test('generatePrivateKey: tries until success', (t) => {
  // eslint-disable-next-line functional/no-let
  let calls = 0;
  const entropy = [
    Uint8Array.from(Array(privateKeyLength).fill(maximumUint8Value)),
    Uint8Array.from(Array(privateKeyLength).fill(1)),
  ];
  const mockEntropy = () => {
    calls += 1;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return entropy[calls]!;
  };

  const key = generatePrivateKey(mockEntropy);
  t.deepEqual(key, entropy[1]);
  t.deepEqual(calls, 1);
});
