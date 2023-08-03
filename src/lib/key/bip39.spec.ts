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
  hexToBin,
} from '../lib.js';

// The below fixtures are converted from: https://github.com/trezor/python-mnemonic/blob/master/vectors.json
// eslint-disable-next-line import/no-restricted-paths, import/no-internal-modules
import bip39Trezor from './fixtures/bip39.trezor.json' assert { type: 'json' };

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
      passphrase: string;
      seed: string;
      wordList: string;
    }[]
  ]
>({
  exec: (t, vectors) => {
    for (const vector of vectors) {
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
  },
  title: (title) => `[crypto] BIP39 Test Vector - ${title ?? '?'}`,
});

test('Trezor Vectors', vectors, bip39Trezor);
