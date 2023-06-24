import test from 'ava';

import {
  bip39WordListEnglish,
  deriveBip39MnemonicFromEntropy,
  deriveBip39SeedFromMnemonic,
  hexToBin,
} from '../lib.js';

// TODO: Split each function into own test.
const vectors = test.macro<
  [
    {
      entropy: Uint8Array;
      mnemonic: string;
      seed: Uint8Array;
    }[]
  ]
>({
  exec: (t, vectors) => {
    for (const vector of vectors) {
      const mnemonic = deriveBip39MnemonicFromEntropy(
        vector.entropy,
        bip39WordListEnglish
      );

      const seed = deriveBip39SeedFromMnemonic(mnemonic, 'TREZOR');

      t.deepEqual(mnemonic, vector.mnemonic);
      t.deepEqual(seed, vector.seed);
    }
  },
  title: (title) => `[crypto] BIP39 Test Vector - ${title ?? '?'}`,
});

// Vectors are taken from: https://github.com/trezor/python-mnemonic/blob/master/vectors.json

test('English', vectors, [
  {
    entropy: hexToBin('00000000000000000000000000000000'),
    mnemonic:
      'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
    passphrase: 'TREZOR',
    seed: hexToBin(
      'c55257c360c07c72029aebc1b53c05ed0362ada38ead3e3e9efa3708e53495531f09a6987599d18264c1e1c92f2cf141630c7a3c4ab7c81b2f001698e7463b04'
    ),
  },
  {
    entropy: hexToBin('7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f'),
    mnemonic:
      'legal winner thank year wave sausage worth useful legal winner thank yellow',
    passphrase: 'TREZOR',
    seed: hexToBin(
      '2e8905819b8723fe2c1d161860e5ee1830318dbf49a83bd451cfb8440c28bd6fa457fe1296106559a3c80937a1c1069be3a3a5bd381ee6260e8d9739fce1f607'
    ),
  },
  {
    entropy: hexToBin(
      '7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f'
    ),
    mnemonic:
      'legal winner thank year wave sausage worth useful legal winner thank year wave sausage worth useful legal winner thank year wave sausage worth title',
    passphrase: 'TREZOR',
    seed: hexToBin(
      'bc09fca1804f7e69da93c2f2028eb238c227f2e9dda30cd63699232578480a4021b146ad717fbb7e451ce9eb835f43620bf5c514db0f8add49f5d121449d3e87'
    ),
  },
]);

/*
test.todo('bip39 word lists include 2048 words', (t) => {
  const expectedLength = 2048;
  t.deepEqual(bip39WordListEnglish.length, expectedLength);
});*/
