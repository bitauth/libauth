import { pbkdf2HmacSha512, sha256 } from '../crypto/crypto.js';
import {
  binStringToBin,
  binToBinString,
  formatError,
  splitEvery,
  utf8ToBin,
} from '../format/format.js';

import { generateRandomSeed } from './key-utils.js';
/* eslint-disable import/no-internal-modules */
import bip39WordListChineseSimplified from './word-lists/bip39.chinese-simplified.json' assert { type: 'json' };
import bip39WordListChineseTraditional from './word-lists/bip39.chinese-traditional.json' assert { type: 'json' };
import bip39WordListCzech from './word-lists/bip39.czech.json' assert { type: 'json' };
import bip39WordListEnglish from './word-lists/bip39.english.json' assert { type: 'json' };
import bip39WordListFrench from './word-lists/bip39.french.json' assert { type: 'json' };
import bip39WordListItalian from './word-lists/bip39.italian.json' assert { type: 'json' };
import bip39WordListJapanese from './word-lists/bip39.japanese.json' assert { type: 'json' };
import bip39WordListKorean from './word-lists/bip39.korean.json' assert { type: 'json' };
import bip39WordListPortuguese from './word-lists/bip39.portuguese.json' assert { type: 'json' };
import bip39WordListSpanish from './word-lists/bip39.spanish.json' assert { type: 'json' };
/* eslint-enable import/no-internal-modules */

export {
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
};

export enum Bip39Error {
  invalidEntropyLength = 'BIP39 Error: invalid entropy length. Entropy length must be 16, 20, 24, 28, or 32 bytes.',
  invalidMnemonicLength = 'BIP39 Error: invalid mnemonic length. Word count must be divisible by 3.',
  invalidWordListLength = 'BIP39 Error: invalid word list length. BIP39 word lists must contain exactly 2048 words.',
  invalidChecksum = 'BIP39 Error: invalid checksum. Checksum failed for the given mnemonic phrase.',
  unknownWord = 'BIP39 Error: unknown word(s). Mnemonic phrase contains one or more words that do not exist in the word list.',
}

export type Bip39MnemonicResult = {
  success: true;
  phrase: string;
};

const enum Bip39 {
  base2 = 2,
  phraseWordCountStepSize = 3,
  entropyLengthStepSize = 4,
  bitsPerByte = 8,
  bitsPerWord = 11,
  minEntropyBytes = 16,
  maxEntropyBytes = 32,
  // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
  checksumRatio = 32,
  validWordListLength = 2048,
}

/**
 * Verify that the provided BIP39 word list contains exactly 2048 words.
 *
 * @param wordList - the word list
 */
export const isValidBip39WordList = (wordList: string[]) =>
  wordList.length === Bip39.validWordListLength;

/**
 * Verify that the length of the provided entropy is valid for BIP39: 16, 20,
 * 24, 28, or 32 bytes.
 *
 * @param entropy - the entropy bytes
 */
export const isValidBip39EntropyLength = (entropy: Uint8Array) =>
  entropy.length >= Bip39.minEntropyBytes &&
  entropy.length <= Bip39.maxEntropyBytes &&
  entropy.length % Bip39.entropyLengthStepSize === 0;

/**
 * Derive BIP39 checksum bits for the given entropy bytes.
 *
 * @param entropy - the entropy bytes
 */
export const deriveBip39ChecksumBits = (entropy: Uint8Array) => {
  const ENT = entropy.length * Bip39.bitsPerByte;
  const CS = ENT / Bip39.checksumRatio;
  const hash = sha256.hash(entropy);
  return binToBinString(hash).slice(0, CS);
};

/**
 * Decode the provided BIP39 mnemonic phrase using the provided word list.
 *
 * @param mnemonic - the mnemonic phrase
 * @param wordList - the word list to use
 */
// eslint-disable-next-line complexity
export const decodeBip39Mnemonic = (mnemonic: string, wordList: string[]) => {
  if (!isValidBip39WordList(wordList)) {
    return formatError(
      Bip39Error.invalidWordListLength,
      `Word list length: ${wordList.length}.`,
    );
  }
  const words = mnemonic.normalize('NFKD').split(' ');
  if (words.length % Bip39.phraseWordCountStepSize !== 0) {
    return formatError(
      Bip39Error.invalidMnemonicLength,
      `Word count: ${words.length}.`,
    );
  }
  const unknownWords = words.filter((word) => !wordList.includes(word));
  if (unknownWords.length !== 0) {
    return formatError(
      Bip39Error.unknownWord,
      `Unknown word(s): ${unknownWords.join(', ')}.`,
    );
  }
  const binString = words
    .map((word: string): string => {
      const index = wordList.indexOf(word);
      return index.toString(Bip39.base2).padStart(Bip39.bitsPerWord, '0');
    })
    .join('');
  const splitIndex =
    (words.length / Bip39.phraseWordCountStepSize) * Bip39.checksumRatio;
  const entropyBits = binString.slice(0, splitIndex);
  const checksumBits = binString.slice(splitIndex);
  const entropy = binStringToBin(entropyBits);
  if (!isValidBip39EntropyLength(entropy)) {
    return formatError(
      Bip39Error.invalidEntropyLength,
      `Entropy length: ${entropy.length}.`,
    );
  }
  const newChecksum = deriveBip39ChecksumBits(entropy);
  if (newChecksum !== checksumBits) {
    return formatError(
      Bip39Error.invalidChecksum,
      `Encoded: ${checksumBits}; computed: ${newChecksum}.`,
    );
  }
  return entropy;
};

/**
 * Encode the provided entropy in a BIP 39 mnemonic phrase.
 *
 * @param entropy - the entropy (length must be 16, 20, 24, 28, or 32 bytes)
 * @param wordList - the word list to use
 */
export const encodeBip39Mnemonic = (
  entropy: Uint8Array,
  wordList: string[],
) => {
  if (!isValidBip39EntropyLength(entropy)) {
    return formatError(
      Bip39Error.invalidEntropyLength,
      `Entropy length: ${entropy.length}.`,
    );
  }
  if (!isValidBip39WordList(wordList)) {
    return formatError(
      Bip39Error.invalidWordListLength,
      `Word list length: ${wordList.length}.`,
    );
  }
  const entropyBits = binToBinString(entropy);
  const checksumBits = deriveBip39ChecksumBits(entropy);
  const bits = entropyBits + checksumBits;
  const chunks = splitEvery(bits, Bip39.bitsPerWord);
  const words = chunks.map((binary: string): string => {
    const index = parseInt(binary, 2);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const word = wordList[index]!;
    return word;
  });

  /*
   * Japanese phrases use an ideographic space separator; if the first word is
   * Japanese, join using `\u3000`.
   */
  const phrase =
    wordList[0] === '\u3042\u3044\u3053\u304f\u3057\u3093'
      ? words.join('\u3000')
      : words.join(' ');

  return { phrase, success: true } as Bip39MnemonicResult;
};

/**
 * Derive a seed from the provided BIP39 mnemonic phrase.
 *
 * @param mnemonic - the mnemonic phrase
 * @param passphrase - an optional passphrase
 */
export const deriveSeedFromBip39Mnemonic = (
  mnemonic: string,
  passphrase?: string,
) => {
  const mnemonicNormalized = mnemonic.normalize('NFKD');
  const salt = `mnemonic${passphrase ?? ''}`;
  const saltNormalized = salt.normalize('NFKD');
  const mnemonicBin = utf8ToBin(mnemonicNormalized);
  const saltBin = utf8ToBin(saltNormalized);
  const derivedKeyLength = 64;
  const iterations = 2048;
  return pbkdf2HmacSha512({
    derivedKeyLength,
    iterations,
    password: mnemonicBin,
    salt: saltBin,
  });
};

/**
 * Securely generate a valid BIP39 Mnemonic given a secure source of randomness.
 *
 * **Node.js Usage**
 * ```ts
 * import { bip39WordListEnglish, generateBip39Mnemonic } from '@bitauth/libauth';
 *
 * const phrase = generateBip39Mnemonic(bip39WordListEnglish);
 * ```
 *
 * **Browser Usage**
 * ```ts
 * import { bip39WordListEnglish, generateBip39Mnemonic } from '@bitauth/libauth';
 *
 * const phrase = generateBip39Mnemonic(bip39WordListEnglish);
 * ```
 *
 * @param wordList - a 2048-word array to use as the BIP39 word list
 * @param secureRandom - a method that returns a securely-random, 16 to 32-byte
 * Uint8Array
 */
export const generateBip39Mnemonic = (
  wordList: string[],
  secureRandom: () => Uint8Array = generateRandomSeed,
) => {
  if (!isValidBip39WordList(wordList)) {
    return formatError(
      Bip39Error.invalidWordListLength,
      `Word list length: ${wordList.length}.`,
    );
  }
  const entropy = secureRandom();
  if (!isValidBip39EntropyLength(entropy)) {
    return formatError(
      Bip39Error.invalidEntropyLength,
      `Entropy length: ${entropy.length}.`,
    );
  }
  return encodeBip39Mnemonic(entropy, wordList);
};
