import { pbkdf2HmacSha512, sha256 } from '../crypto/crypto.js';
import { binToBinString, utf8ToBin } from '../format/format.js';

/* eslint-disable import/no-internal-modules */
import bip39ChineseSimplified from './word-lists/bip39.chinese-simplified.json' assert { type: 'json' };
import bip39ChineseTraditional from './word-lists/bip39.chinese-traditional.json' assert { type: 'json' };
import bip39Czech from './word-lists/bip39.czech.json' assert { type: 'json' };
import bip39English from './word-lists/bip39.english.json' assert { type: 'json' };
import bip39French from './word-lists/bip39.french.json' assert { type: 'json' };
import bip39Italian from './word-lists/bip39.italian.json' assert { type: 'json' };
import bip39Japanese from './word-lists/bip39.japanese.json' assert { type: 'json' };
import bip39Korean from './word-lists/bip39.korean.json' assert { type: 'json' };
import bip39Portuguese from './word-lists/bip39.portuguese.json' assert { type: 'json' };
import bip39Spanish from './word-lists/bip39.spanish.json' assert { type: 'json' };
/* eslint-enable import/no-internal-modules */

export {
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
};

export enum MnemonicErrors {
  invalidEntropy = 'Invalid Entropy: Must be between 16 and 32 bytes and divisible by 4',
  invalidMnemonic = 'Invalid Mnemonic: Phrase word count must be divisible by 3',
  invalidWordList = 'Invalid Word List Length: Word list must contain exactly 2048 words',
  invalidChecksum = 'Invalid Checksum: Checksum failed for the given phrase',
  invalidWord = 'Invalid word(s): Phrase contains word that does not exist in word list',
}

type Bip39Mnemonic = {
  success: true;
  phrase: string;
};

/**
 * Determine whether the given word list is valid.
 *
 * @param wordList - the word list
 */
export const isValidBip39WordList = (wordList: string[]) => {
  const validWordListLength = 2048;
  return wordList.length === validWordListLength;
};

/**
 * Determine whether the given entropy is valid.
 *
 * @param entropy - the entropy bytes
 */
export const isValidBip39Entropy = (entropy: Uint8Array) => {
  const minEntropyBytes = 16;
  const maxEntropyBytes = 32;
  const entropyDivisibility = 4;

  return (
    entropy.length >= minEntropyBytes &&
    entropy.length <= maxEntropyBytes &&
    entropy.length % entropyDivisibility === 0
  );
};

/**
 * Derive checksum bits for the given entropy bytes.
 *
 * @param entropy - the entropy bytes
 */
export const deriveBip39ChecksumBits = (entropy: Uint8Array) => {
  const bitsPerByte = 8;
  const checksumRatio = 32;
  const ENT = entropy.length * bitsPerByte;
  const CS = ENT / checksumRatio;
  const hash = sha256.hash(entropy);
  return binToBinString(hash).slice(0, CS);
};

/**
 * Derive the entropy for the given BIP39 mnemonic phrase.
 *
 * @param mnemonic - the mnemonic phrase
 * @param wordList - the word list to use
 */
// eslint-disable-next-line complexity
export const deriveBip39EntropyFromMnemonic = (
  mnemonic: string,
  wordList: string[],
) => {
  if (!isValidBip39WordList(wordList)) {
    return MnemonicErrors.invalidWordList;
  }

  const words = mnemonic.normalize('NFKD').split(' ');

  const mnemonicPhraseDivisibility = 3;
  if (words.length % mnemonicPhraseDivisibility !== 0) {
    return MnemonicErrors.invalidMnemonic;
  }

  // make sure each word in mnemonic exists in the given word list.
  const wordsExist = words.every((word: string) => wordList.includes(word));
  if (!wordsExist) {
    return MnemonicErrors.invalidWord;
  }

  // define constants to improve legibility
  const base2 = 2;
  const bitStringLength = 11;

  // convert word indices to 11 bit binary strings
  const bitString = words
    .map((word: string): string => {
      const index = wordList.indexOf(word);
      return index.toString(base2).padStart(bitStringLength, '0');
    })
    .join('');

  // split the binary string into ENT/CS
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  const dividerIndex = Math.floor(bitString.length / 33) * 32;
  const entropyBits = bitString.slice(0, dividerIndex);
  const checksumBits = bitString.slice(dividerIndex);

  // calculate the checksum and compare
  const entropy = new Uint8Array(
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    entropyBits.match(/(?:.{1,8})/gu)!.map((bin) => parseInt(bin, 2)),
  );

  /*
   * NOTE: This is probably unnecessary, but is in the bip39 npm package.
   *       I have left it here in case there is some edge-case I am unaware of.
   */
  if (!isValidBip39Entropy(entropy)) {
    return MnemonicErrors.invalidEntropy;
  }

  const newChecksum = deriveBip39ChecksumBits(entropy);
  if (newChecksum !== checksumBits) {
    return MnemonicErrors.invalidChecksum;
  }

  return entropy;
};

/**
 * Derive a mnemonic phrase from the given entropy
 *
 * @param entropy - the entropy (must be between 16 to 32 bytes and divisible by 4)
 * @param wordList - the word list to use
 */
export const deriveBip39MnemonicFromEntropy = (
  entropy: Uint8Array,
  wordList: string[],
) => {
  if (!isValidBip39Entropy(entropy)) {
    return MnemonicErrors.invalidEntropy;
  }

  if (!isValidBip39WordList(wordList)) {
    return MnemonicErrors.invalidWordList;
  }

  const entropyBits = binToBinString(entropy);
  const checksumBits = deriveBip39ChecksumBits(entropy);

  const bits = entropyBits + checksumBits;
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const chunks = bits.match(/(?:.{1,11})/gu)!;
  const words = chunks.map((binary: string): string => {
    const index = parseInt(binary, 2);
    const word = wordList[index];
    // @ts-expect-error-next-line
    return word;
  });

  /*
   * NOTE: Japanese uses an ideographic space separator.
   *       So we check if the first word is Japanese and then join using \u3000.
   */
  const phrase =
    wordList[0] === '\u3042\u3044\u3053\u304f\u3057\u3093'
      ? words.join('\u3000')
      : words.join(' ');

  return {
    phrase,
    success: true,
  } as Bip39Mnemonic;
};

/**
 * Derive a BIP39 seed from the given mnemonic
 *
 * @param mnemonic - the mnemonic phrase
 * @param passphrase - the passphrase
 */
export const deriveBip39SeedFromMnemonic = (
  mnemonic: string,
  passphrase?: string,
) => {
  const mnemonicNormalized = mnemonic.normalize('NFKD');

  const salt = `mnemonic${passphrase ?? ''}`;
  const saltNormalized = salt.normalize('NFKD');

  const mnemonicBuffer = utf8ToBin(mnemonicNormalized);
  const saltBuffer = utf8ToBin(saltNormalized);

  const derivedKeyLength = 64;
  const iterations = 2048;

  return pbkdf2HmacSha512({
    derivedKeyLength,
    iterations,
    password: mnemonicBuffer,
    salt: saltBuffer,
  });
};

/**
 * Securely generate a valid BIP39 Mnemonic given a secure source of randomness.
 *
 * **Node.js Usage**
 * ```ts
 * import { randomBytes } from 'crypto';
 * import { bip39English, generateBip39Mnemonic } from '@bitauth/libauth';
 *
 * const key = generateBip39Mnemonic(bip39English, () => randomBytes(32));
 * ```
 *
 * **Browser Usage**
 * ```ts
 * import { bip39English, generateBip39Mnemonic } from '@bitauth/libauth';
 *
 * const key = generateBip39Mnemonic(bip39English, () =>
 *   window.crypto.getRandomValues(new Uint8Array(32))
 * );
 * ```
 *
 * @param wordList - an 2048 length array of words to use as the word list
 * @param secureRandom - a method that returns a securely-random 16-32-byte Uint8Array
 */
export const generateBip39Mnemonic = (
  wordList: string[],
  secureRandom: () => Uint8Array,
) => {
  if (!isValidBip39WordList(wordList)) {
    return MnemonicErrors.invalidWordList;
  }

  const entropy = secureRandom();

  if (!isValidBip39Entropy(entropy)) {
    return MnemonicErrors.invalidEntropy;
  }

  return deriveBip39MnemonicFromEntropy(entropy, wordList);
};
