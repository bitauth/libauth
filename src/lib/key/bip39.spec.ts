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

// Custom test vectors generated using the bip39 NPM library.
// eslint-disable-next-line import/no-restricted-paths, import/no-internal-modules
import bip39Vectors from './fixtures/bip39.vectors.json' assert { type: 'json' };

const invalidWordList = ['wordlist', 'must', 'have', '2048', 'words'];

test('deriveBip39EntropyFromMnemonic: works', (t) => {
  // Valid mnemonic..
  t.deepEqual(
    deriveBip39EntropyFromMnemonic(
      'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
      bip39English,
    ),
    hexToBin('00000000000000000000000000000000'),
  );

  // Invalid Mnemonic (not divisible by 3 - 11 words).
  t.is(
    deriveBip39EntropyFromMnemonic(
      'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon',
      bip39English,
    ),
    MnemonicErrors.invalidMnemonic,
  );

  // Invalid Checksum (banana).
  t.is(
    deriveBip39EntropyFromMnemonic(
      'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon banana',
      bip39English,
    ),
    MnemonicErrors.invalidChecksum,
  );

  // Invalid Word List (5 words - must be 2048).
  t.is(
    deriveBip39EntropyFromMnemonic(
      'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
      invalidWordList,
    ),
    MnemonicErrors.invalidWordList,
  );

  // Invalid Word not in Word List ("fnord").
  t.is(
    deriveBip39EntropyFromMnemonic(
      'fnord abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
      bip39English,
    ),
    MnemonicErrors.invalidWord,
  );
});

test('deriveBip39MnemonicFromEntropy: works', (t) => {
  // 12 words/ (English).
  t.deepEqual(
    deriveBip39MnemonicFromEntropy(
      hexToBin('00000000000000000000000000000000'),
      bip39English,
    ),
    {
      phrase:
        'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
      success: true,
    },
  );

  // Invalid Entropy (15 bytes).
  t.is(
    deriveBip39MnemonicFromEntropy(
      hexToBin('000000000000000000000000000000'),
      bip39English,
    ),
    MnemonicErrors.invalidEntropy,
  );

  // Invalid Word List (5 words - must be 2048).
  t.is(
    deriveBip39MnemonicFromEntropy(
      hexToBin('00000000000000000000000000000000'),
      invalidWordList,
    ),
    MnemonicErrors.invalidWordList,
  );
});

test('deriveBip39SeedFromMnemonic: works', (t) => {
  // 12 words.
  t.deepEqual(
    deriveBip39SeedFromMnemonic(
      'control verify parent ordinary manual talent jelly fame poverty cup that clump',
    ),
    hexToBin(
      'cae92979480452578d43ed55ff17dc80877ecc48e3771bd1430a35e54584b3099258c53cbe2b76a70aac0ef27c4bbc3b32a85ce4cdddf00aa6870aeb308488af',
    ),
  );

  // 12 words with passphrase.
  t.deepEqual(
    deriveBip39SeedFromMnemonic(
      'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
      'TREZOR',
    ),
    hexToBin(
      'c55257c360c07c72029aebc1b53c05ed0362ada38ead3e3e9efa3708e53495531f09a6987599d18264c1e1c92f2cf141630c7a3c4ab7c81b2f001698e7463b04',
    ),
  );
});

test('generateBip39Mnemonic: works', (t) => {
  // Entropy functions.
  const valid24WordEntropyFunction = () => randomBytes(32);
  const valid12WordEntropyFunction = () => randomBytes(16);
  const invalidEntropyFunction = () => randomBytes(17);

  // Generate a 24 word mnemonic.
  const valid24WordMnemonic = generateBip39Mnemonic(
    bip39English,
    valid24WordEntropyFunction,
  );
  if (typeof valid24WordMnemonic === 'string') {
    t.fail(valid24WordMnemonic);
    return;
  }
  if (valid24WordMnemonic.phrase.split(' ').length !== 24) {
    t.fail('Expected mnemonic of phrase of 24 words');
    return;
  }

  // Generate a 12 word mnemonic.
  const valid12WordMnemonic = generateBip39Mnemonic(
    bip39English,
    valid12WordEntropyFunction,
  );
  if (typeof valid12WordMnemonic === 'string') {
    t.fail(valid12WordMnemonic);
    return;
  }
  if (valid12WordMnemonic.phrase.split(' ').length !== 12) {
    t.fail('Expected mnemonic of phrase of 12 words');
    return;
  }

  // Use an invalid entropy function and expect it to fail.
  t.is(
    generateBip39Mnemonic(bip39English, invalidEntropyFunction),
    MnemonicErrors.invalidEntropy,
  );

  // Use an invalid word list and expect it to fail.
  t.is(
    generateBip39Mnemonic(invalidWordList, valid24WordEntropyFunction),
    MnemonicErrors.invalidWordList,
  );
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
      passphrase: string;
      seed: string;
      seedUsingPassphrase: string;
      wordList: string;
    }[],
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
      wordList,
    );

    if (typeof mnemonic === 'string') {
      t.fail('Failed to derive mnemonic from entropy');
      return;
    }

    const entropy = deriveBip39EntropyFromMnemonic(vector.mnemonic, wordList);

    const seed = deriveBip39SeedFromMnemonic(
      mnemonic.phrase,
    );

    const seedUsingPassphrase = deriveBip39SeedFromMnemonic(
      mnemonic.phrase,
      vector.passphrase,
    );

    t.deepEqual(mnemonic.phrase, vector.mnemonic);
    t.deepEqual(seed, hexToBin(vector.seed));
    t.deepEqual(seedUsingPassphrase, hexToBin(vector.seedUsingPassphrase));
    t.deepEqual(entropy, hexToBin(vector.entropy));
  }
});

test('Wordlist Vectors', vectors, bip39Vectors);
