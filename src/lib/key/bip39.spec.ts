import { randomBytes } from 'crypto';

import test from 'ava';

import {
  Bip39Error,
  bip39WordListChineseSimplified,
  bip39WordListChineseTraditional,
  bip39WordListCzech,
  bip39WordListEnglish,
  bip39WordListFrench,
  bip39WordListItalian,
  bip39WordListJapanese,
  bip39WordListKorean,
  bip39WordListPortuguese,
  bip39WordListSpanish,
  decodeBip39Mnemonic,
  deriveSeedFromBip39Mnemonic,
  encodeBip39Mnemonic,
  generateBip39Mnemonic,
  hexToBin,
} from '../lib.js';

// eslint-disable-next-line import/no-restricted-paths, import/no-internal-modules
import bip39Vectors from './fixtures/bip39.vectors.json' assert { type: 'json' };

const invalidWordList = ['word', 'list', 'must', 'have', '2048', 'words'];

test('decodeBip39Mnemonic: works', (t) => {
  t.deepEqual(
    decodeBip39Mnemonic(
      'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
      bip39WordListEnglish,
    ),
    hexToBin('00000000000000000000000000000000'),
  );
  t.is(
    decodeBip39Mnemonic(
      'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon',
      bip39WordListEnglish,
    ),
    `${Bip39Error.invalidMnemonicLength} Word count: 11.`,
  );
  t.is(
    decodeBip39Mnemonic(
      'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon banana',
      bip39WordListEnglish,
    ),
    `${Bip39Error.invalidChecksum} Encoded: 0001; computed: 1100.`,
  );
  t.is(
    decodeBip39Mnemonic(
      'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
      invalidWordList,
    ),
    `${Bip39Error.invalidWordListLength} Word list length: 6.`,
  );
  t.is(
    decodeBip39Mnemonic(
      'missing abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
      bip39WordListEnglish,
    ),
    `${Bip39Error.unknownWord} Unknown word(s): missing.`,
  );
});

test('encodeBip39Mnemonic: works', (t) => {
  t.deepEqual(
    encodeBip39Mnemonic(
      hexToBin('00000000000000000000000000000000'),
      bip39WordListEnglish,
    ),
    {
      phrase:
        'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
      success: true,
    },
  );
  t.is(
    encodeBip39Mnemonic(
      hexToBin('000000000000000000000000000000'),
      bip39WordListEnglish,
    ),
    `${Bip39Error.invalidEntropyLength} Entropy length: 15.`,
  );
  t.is(
    encodeBip39Mnemonic(
      hexToBin('00000000000000000000000000000000'),
      invalidWordList,
    ),
    `${Bip39Error.invalidWordListLength} Word list length: 6.`,
  );
});

test('deriveSeedFromBip39Mnemonic: works', (t) => {
  t.deepEqual(
    deriveSeedFromBip39Mnemonic(
      'control verify parent ordinary manual talent jelly fame poverty cup that clump',
    ),
    hexToBin(
      'cae92979480452578d43ed55ff17dc80877ecc48e3771bd1430a35e54584b3099258c53cbe2b76a70aac0ef27c4bbc3b32a85ce4cdddf00aa6870aeb308488af',
    ),
  );
  t.deepEqual(
    deriveSeedFromBip39Mnemonic(
      'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
      'TREZOR',
    ),
    hexToBin(
      'c55257c360c07c72029aebc1b53c05ed0362ada38ead3e3e9efa3708e53495531f09a6987599d18264c1e1c92f2cf141630c7a3c4ab7c81b2f001698e7463b04',
    ),
  );
});

test('generateBip39Mnemonic: works', (t) => {
  const valid24WordEntropyFunction = () => randomBytes(32);
  const valid12WordEntropyFunction = () => randomBytes(16);
  const invalidEntropyFunction = () => randomBytes(17);
  const valid24WordMnemonic = generateBip39Mnemonic(
    bip39WordListEnglish,
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
  const valid12WordMnemonic = generateBip39Mnemonic(
    bip39WordListEnglish,
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
  t.is(
    generateBip39Mnemonic(bip39WordListEnglish, invalidEntropyFunction),
    `${Bip39Error.invalidEntropyLength} Entropy length: 17.`,
  );
  t.is(
    generateBip39Mnemonic(invalidWordList, valid24WordEntropyFunction),
    `${Bip39Error.invalidWordListLength} Word list length: 6.`,
  );
});

const wordListByLanguage: { [key: string]: string[] } = {
  // eslint-disable-next-line camelcase
  chinese_simplified: bip39WordListChineseSimplified,
  // eslint-disable-next-line camelcase
  chinese_traditional: bip39WordListChineseTraditional,
  czech: bip39WordListCzech,
  english: bip39WordListEnglish,
  french: bip39WordListFrench,
  italian: bip39WordListItalian,
  japanese: bip39WordListJapanese,
  korean: bip39WordListKorean,
  portuguese: bip39WordListPortuguese,
  spanish: bip39WordListSpanish,
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
    const wordList = wordListByLanguage[vector.wordList];
    if (wordList === undefined) {
      t.fail(`Failed to find word list for language ${vector.wordList}`);
      return;
    }
    const mnemonic = encodeBip39Mnemonic(hexToBin(vector.entropy), wordList);
    if (typeof mnemonic === 'string') {
      t.fail('Failed to derive mnemonic from entropy');
      return;
    }
    const entropy = decodeBip39Mnemonic(vector.mnemonic, wordList);
    const seed = deriveSeedFromBip39Mnemonic(mnemonic.phrase);
    const seedUsingPassphrase = deriveSeedFromBip39Mnemonic(
      mnemonic.phrase,
      vector.passphrase,
    );
    t.deepEqual(mnemonic.phrase, vector.mnemonic);
    t.deepEqual(seed, hexToBin(vector.seed));
    t.deepEqual(seedUsingPassphrase, hexToBin(vector.seedUsingPassphrase));
    t.deepEqual(entropy, hexToBin(vector.entropy));
  }
});

test('Word List Vectors', vectors, bip39Vectors);
