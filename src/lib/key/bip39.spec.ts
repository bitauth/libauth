import { randomBytes } from 'crypto';

import test from 'ava';

import {
  bip39ChineseSimplified,
  bip39ChineseTraditional,
  bip39Czech,
  bip39English,
  bip39French,
  bip39Italian,
  bip39Japanese,
  bip39Korean,
  bip39Portuguese,
  bip39Spanish,
  deriveBip39EntropyFromMnemonic,
  deriveBip39MnemonicFromEntropy,
  deriveBip39SeedFromMnemonic,
  generateBip39Mnemonic,
  hexToBin,
  MnemonicErrors,
} from '../lib.js';

// The below fixtures are converted from: https://github.com/trezor/python-mnemonic/blob/master/vectors.json
// eslint-disable-next-line import/no-restricted-paths, import/no-internal-modules
import bip39Trezor from './fixtures/bip39.trezor.json' assert { type: 'json' };
// Custom test vectors generated using the bip39 NPM library.
// eslint-disable-next-line import/no-restricted-paths, import/no-internal-modules
import bip39Valid from './fixtures/bip39.valid.json' assert { type: 'json' };

const valid24WordEntropyFunction = () => randomBytes(32);
const valid12WordEntropyFunction = () => randomBytes(16);
const invalidEntropyFunction = () => randomBytes(17);
const invalidWordList = ['wordlist', 'must', 'have', '2048', 'words'];

test('generateBip39Mnemonic: works', (t) => {
  const valid24WordMnemonic = generateBip39Mnemonic(bip39English, valid24WordEntropyFunction);
  if (typeof valid24WordMnemonic === 'string') {
    t.fail(valid24WordMnemonic);
  }

  const valid12WordMnemonic = generateBip39Mnemonic(bip39English, valid12WordEntropyFunction);
  if (typeof valid12WordMnemonic === 'string') {
    t.fail(valid12WordMnemonic);
  }

  t.is(generateBip39Mnemonic(bip39English, invalidEntropyFunction), MnemonicErrors.invalidEntropyError);

  t.is(generateBip39Mnemonic(invalidWordList, valid24WordEntropyFunction), MnemonicErrors.invalidWordList);
});

// eslint-disable-next-line complexity
const getWordListForLanguage = (language: string) => {
  switch (language) {
    case 'chinese_simplified':
      return bip39ChineseSimplified;
    case 'chinese_traditional':
      return bip39ChineseTraditional;
    case 'czech':
      return bip39Czech;
    case 'english':
      return bip39English;
    case 'french':
      return bip39French;
    case 'italian':
      return bip39Italian;
    case 'japanese':
      return bip39Japanese;
    case 'korean':
      return bip39Korean;
    case 'portuguese':
      return bip39Portuguese;
    case 'spanish':
      return bip39Spanish;
  }

  return 'No matching word list for given language';
};

const vectors = test.macro<
  [
    {
      entropy: string;
      mnemonic: string;
      passphrase?: string;
      seed: string;
      wordList: string;
    }[]
  ]
>((t, validVectors) => {
  // eslint-disable-next-line functional/no-loop-statements
  for (const vector of validVectors) {
    const wordList = getWordListForLanguage(vector.wordList);

    if (typeof wordList === 'string') {
      t.fail(`Failed to find wordlist for language ${vector.wordList}`);

      return;
    }

    const mnemonic = deriveBip39MnemonicFromEntropy(
      hexToBin(vector.entropy),
      wordList
    );

    if (typeof mnemonic === 'string') {
      t.fail('Failed to derive mnemonic from entropy');

      return;
    }

    const entropy = deriveBip39EntropyFromMnemonic(vector.mnemonic, wordList);

    const seed = deriveBip39SeedFromMnemonic(
      mnemonic.phrase,
      vector.passphrase
    );

    t.deepEqual(mnemonic.phrase, vector.mnemonic);
    t.deepEqual(seed, hexToBin(vector.seed));
    t.deepEqual(entropy, hexToBin(vector.entropy));
  }
});

test('Trezor Vectors', vectors, bip39Trezor);
test('Valid Vectors', vectors, bip39Valid);
