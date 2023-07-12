import test from 'ava';

import {
  bip39WordListEnglish,
  deriveBip39EntropyFromMnemonic,
  deriveBip39MnemonicFromEntropy,
  deriveBip39SeedFromMnemonic,
  hexToBin,
} from '../lib.js';

// Fixtures are taken from: https://github.com/trezor/python-mnemonic/blob/master/vectors.json

const fixture = [
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
      '80808080808080808080808080808080'
    ),
    mnemonic:
      'letter advice cage absurd amount doctor acoustic avoid letter advice cage above',
    passphrase: 'TREZOR',
    seed: hexToBin(
      'd71de856f81a8acc65e6fc851a38d4d7ec216fd0796d0a6827a3ad6ed5511a30fa280f12eb2e47ed2ac03b5c462a0358d18d69fe4f985ec81778c1b370b652a8'
    ),
  },
  {
    entropy: hexToBin(
      'ffffffffffffffffffffffffffffffff'
    ),
    mnemonic:
      'zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo wrong',
    passphrase: 'TREZOR',
    seed: hexToBin(
      'ac27495480225222079d7be181583751e86f571027b0497b5b5d11218e0a8a13332572917f0f8e5a589620c6f15b11c61dee327651a14c34e18231052e48c069'
    ),
  },
  {
    entropy: hexToBin(
      '000000000000000000000000000000000000000000000000'
    ),
    mnemonic:
      'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon agent',
    passphrase: 'TREZOR',
    seed: hexToBin(
      '035895f2f481b1b0f01fcf8c289c794660b289981a78f8106447707fdd9666ca06da5a9a565181599b79f53b844d8a71dd9f439c52a3d7b3e8a79c906ac845fa'
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
]

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

      const entropy = deriveBip39EntropyFromMnemonic(vector.mnemonic, bip39WordListEnglish);

      t.deepEqual(mnemonic, vector.mnemonic);
      t.deepEqual(seed, vector.seed);
      t.deepEqual(entropy, vector.entropy);

      console.log(entropy);
      console.log(vector.entropy);
    }
  },
  title: (title) => `[crypto] BIP39 Test Vector - ${title ?? '?'}`,
});

test('English', vectors, fixture);


/*
test.todo('bip39 word lists include 2048 words', (t) => {
  const expectedLength = 2048;
  t.deepEqual(bip39WordListEnglish.length, expectedLength);
});*/
