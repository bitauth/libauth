import { randomBytes } from 'crypto';

import test from 'ava';

import {
  EntropyGenerationError,
  generateDeterministicEntropy,
  generateHdPrivateNode,
  generatePrivateKey,
  generateRandomBytes,
  generateRandomBytesUnchecked,
  hexToBin,
  minimumEventsPerEntropyBits,
  secp256k1,
  sha256,
  shannonEntropyPerEvent,
  validateSecp256k1PrivateKey,
} from '../lib.js';

import { fc, testProp } from '@fast-check/ava';

const privateKeyLength = 32;
const maximumUint8Value = 255;

const secureRandom = () => randomBytes(privateKeyLength);

test('validateSecp256k1PrivateKey', (t) => {
  t.false(validateSecp256k1PrivateKey(hexToBin('')));
  t.false(validateSecp256k1PrivateKey(hexToBin('00')));
  t.false(
    validateSecp256k1PrivateKey(
      hexToBin(
        '0000000000000000000000000000000000000000000000000000000000000000',
      ),
    ),
  );
  t.true(
    validateSecp256k1PrivateKey(
      hexToBin(
        '0000000000000000000000000000000000000000000000000000000000000001',
      ),
    ),
  );
  t.true(
    validateSecp256k1PrivateKey(
      hexToBin(
        '00ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
      ),
    ),
  );
  t.true(
    validateSecp256k1PrivateKey(
      hexToBin(
        'fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd036413f',
      ),
    ),
  );
  t.true(
    validateSecp256k1PrivateKey(
      hexToBin(
        'fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364140',
      ),
    ),
  );
  t.false(
    validateSecp256k1PrivateKey(
      hexToBin(
        'fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141',
      ),
    ),
  );
});

const secp256k1OrderNFFBytes = 15;

const almostInvalid = Array(secp256k1OrderNFFBytes).fill(
  maximumUint8Value,
) as number[];
const theRest = privateKeyLength - almostInvalid.length;

testProp(
  '[fast-check] validateSecp256k1PrivateKey <-> Secp256k1.validatePrivateKey',
  [
    fc
      .array(fc.integer({ max: maximumUint8Value, min: 0 }), {
        maxLength: theRest,
        minLength: theRest,
      })
      .map((random) => Uint8Array.from([...almostInvalid, ...random])),
  ],
  (t, input) => {
    t.deepEqual(
      validateSecp256k1PrivateKey(input),
      secp256k1.validatePrivateKey(input),
    );
  },
);

test('generateRandomBytesUnchecked: works', (t) => {
  t.truthy(generateRandomBytesUnchecked(10));
});

test('generateRandomBytesUnchecked: accepts crypto object', (t) => {
  t.truthy(generateRandomBytesUnchecked(10, crypto));
});

test('generateRandomBytes: works', (t) => {
  t.truthy(generateRandomBytes(10));
});

test('generateRandomBytes: accepts generation function', (t) => {
  t.truthy(generateRandomBytes(10, generateRandomBytesUnchecked));
});

test('generateRandomBytes: throws on null results', (t) => {
  const notRandom = (_length: number) => null as unknown as Uint8Array;
  t.throws(() => generateRandomBytes(32, notRandom), {
    message: `${EntropyGenerationError.duplicateResults} First result: [null]; second result: [null].`,
  });
});

test('generateRandomBytes: throws on undefined results', (t) => {
  const notRandom = (_length: number) => undefined as unknown as Uint8Array;
  t.throws(() => generateRandomBytes(32, notRandom), {
    message: `${EntropyGenerationError.duplicateResults} First result: [undefined]; second result: [undefined].`,
  });
});

test('generateRandomBytes: throws on duplicate Uint8Array results', (t) => {
  const notRandom = (length: number) => new Uint8Array(length);
  t.throws(() => generateRandomBytes(32, notRandom), {
    message: `${EntropyGenerationError.duplicateResults} First result: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]; second result: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0].`,
  });
});

test('generateRandomBytes: throws on duplicate Uint8Array results (filled)', (t) => {
  const notRandom = (length: number) => new Uint8Array(length).fill(0xff);
  t.throws(() => generateRandomBytes(32, notRandom), {
    message: `${EntropyGenerationError.duplicateResults} First result: [255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255]; second result: [255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255].`,
  });
});

test('generateRandomBytes: succeeds on unique Uint8Array results', (t) => {
  const state = { counter: 0 };
  const notRandom = (length: number) =>
    // eslint-disable-next-line no-plusplus
    new Uint8Array(length).fill(state.counter++);
  t.deepEqual(generateRandomBytes(32, notRandom), new Uint8Array(32));
});

test('generatePrivateKey: works', (t) => {
  const key = generatePrivateKey(secureRandom);
  t.true(secp256k1.validatePrivateKey(key));
});

test('generatePrivateKey: works with default entropy source', (t) => {
  const key = generatePrivateKey();
  t.true(validateSecp256k1PrivateKey(key));
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

test('generateHdPrivateNode: tries until success', (t) => {
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

  const key = generateHdPrivateNode(mockEntropy);
  t.deepEqual(key.seed, entropy[1]);
  t.deepEqual(calls, 1);
});

test('shannonEntropyPerEvent', (t) => {
  t.deepEqual(shannonEntropyPerEvent(2), Math.log2(2));
  t.deepEqual(shannonEntropyPerEvent(20), Math.log2(20));
});

test('minimumEventsPerEntropyBits', (t) => {
  t.deepEqual(minimumEventsPerEntropyBits(2), 128);
  t.deepEqual(minimumEventsPerEntropyBits(6), 50);
  t.deepEqual(minimumEventsPerEntropyBits(20), 30);
});

test('generateDeterministicEntropy', (t) => {
  t.deepEqual(
    generateDeterministicEntropy(6, [1, 2, 3, 4, 5, 6], {
      requiredEntropyBits: 0,
    }),
    hexToBin(
      '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',
    ),
  );
  t.deepEqual(
    generateDeterministicEntropy(12, [1, 2, 3, 4, 5, 6, 7]),
    `${EntropyGenerationError.insufficientEntropy} With 12 possible results per event, a minimum of 36 events are required to obtain sufficient entropy. Events provided: 7.`,
  );
  t.deepEqual(
    generateDeterministicEntropy(1_048_576, [1, 2, 3, 4, 5, 6, 7]),
    hexToBin(
      '8bb0cf6eb9b17d0f7d22b456f121257dc1254e1f01665370476383ea776df414',
    ),
  );
  t.deepEqual(
    generateDeterministicEntropy(6, [1, 2, 3, 4, 5, 6]),
    `${EntropyGenerationError.insufficientEntropy} With 6 possible results per event, a minimum of 50 events are required to obtain sufficient entropy. Events provided: 6.`,
  );
  t.deepEqual(
    generateDeterministicEntropy(0, [1]),
    `${EntropyGenerationError.insufficientEntropy} With 0 possible results per event, a minimum of 0 events are required to obtain sufficient entropy. Events provided: 1.`,
  );
  t.deepEqual(
    generateDeterministicEntropy(20, [13, 4, 10], {
      crypto: { sha256 },
      requiredEntropyBits: 12,
    }),
    hexToBin(
      '6dd4f2758287be9f38e0e93c71146c76e90f83f0b8c9b49760fc0b594494607b',
    ),
  );
  t.deepEqual(
    generateDeterministicEntropy(20, [13, 4], { requiredEntropyBits: 12 }),
    `${EntropyGenerationError.insufficientEntropy} With 20 possible results per event, a minimum of 3 events are required to obtain sufficient entropy. Events provided: 2.`,
  );
});
