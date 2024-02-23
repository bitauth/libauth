import {
  pbkdf2HmacSha512 as internalPbkdf2HmacSha512,
  sha512 as internalSha512,
  sha256,
} from '../crypto/crypto.js';
import {
  binStringToBin,
  binToBinString,
  formatError,
  splitEvery,
  utf8ToBin,
} from '../format/format.js';
import type { Sha512 } from '../lib.js';

import { deriveHdPrivateNodeFromSeed } from './hd-key.js';
import { generateRandomBytes } from './key-utils.js';
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
  invalidMnemonicLength = 'BIP39 Error: invalid mnemonic length. Word count must be 12, 15, 18, 21, or 24.',
  invalidWordListLength = 'BIP39 Error: invalid word list length. BIP39 word lists must contain exactly 2048 words.',
  invalidChecksum = 'BIP39 Error: invalid checksum for the given mnemonic phrase.',
  unknownWord = 'BIP39 Error: unknown word(s). The mnemonic phrase contains one or more words that do not exist in the word list.',
}

export type Bip39MnemonicResult = {
  success: true;
  /**
   * The BIP39 mnemonic phrase.
   */
  phrase: string;
};

export type Bip39ValidEntropyLength = 16 | 20 | 24 | 28 | 32;

const enum Bip39 {
  base2 = 2,
  wordCountStepSize = 3,
  entropyLengthStepSize = 4,
  bitsPerByte = 8,
  bitsPerWord = 11,
  minWordCount = 12,
  maxWordCount = 24,
  minEntropyBytes = 16,
  maxEntropyBytes = 32,
  // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
  checksumRatio = 32,
  derivedKeyLength = 64,
  validWordListLength = 2048,
  // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
  pbkdf2Iterations = 2048,
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
 * Note, this method always completes. For a valid result, `entropy` must
 * satisfy {@link isValidBip39EntropyLength}.
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
 * Reverses {@link encodeBip39MnemonicNonStandard}.
 *
 * See {@link decodeBip39Mnemonic} to decode using the English word list.
 *
 * @param mnemonic - the BIP39 mnemonic phrase
 * @param wordList - the word list to use
 */
// eslint-disable-next-line complexity
export const decodeBip39MnemonicNonStandard = (
  mnemonic: string,
  wordList: string[],
) => {
  if (!isValidBip39WordList(wordList)) {
    return formatError(
      Bip39Error.invalidWordListLength,
      `Word list length: ${wordList.length}.`,
    );
  }
  const words = mnemonic.normalize('NFKD').split(' ');
  if (
    words.length % Bip39.wordCountStepSize !== 0 ||
    words.length < Bip39.minWordCount ||
    words.length > Bip39.maxWordCount
  ) {
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
    (words.length / Bip39.wordCountStepSize) * Bip39.checksumRatio;
  const entropyBits = binString.slice(0, splitIndex);
  const checksumBits = binString.slice(splitIndex);
  const entropy = binStringToBin(entropyBits);
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
 * Decode the provided BIP39 mnemonic phrase using the English word list.
 * Reverses {@link encodeBip39Mnemonic}.
 *
 * See {@link decodeBip39MnemonicNonStandard} for other word lists.
 *
 * @param mnemonic - the BIP39 mnemonic phrase
 */
export const decodeBip39Mnemonic = (mnemonic: string) =>
  decodeBip39MnemonicNonStandard(mnemonic, bip39WordListEnglish);

/**
 * Encode the provided entropy in a BIP39 mnemonic phrase using a custom word
 * list. Reverses {@link decodeBip39MnemonicNonStandard}.
 *
 * See {@link encodeBip39Mnemonic} to encode using the English word list.
 *
 * If the provided `entropy` and `wordList` each has a valid length, this method
 * will never error.
 *
 * @param entropy - the entropy (length must be 16, 20, 24, 28, or 32 bytes)
 * @param wordList - the word list to use
 */
export const encodeBip39MnemonicNonStandard = (
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
 * Encode the provided entropy in an English BIP39 mnemonic phrase.
 * Reverses {@link decodeBip39Mnemonic}.
 *
 * Even for localized applications, English is the safest choice for BIP39
 * mnemonic phrase encoding. English mnemonic phrases are the most widely used
 * and supported by ecosystem tooling, meaning they can be more reliably error
 * corrected than phrases using other word lists, and they are more likely to be
 * recognized as valuable by humans and generalized automation, e.g.
 * organizational secret scanning and anti-exfiltration software. Note also that
 * specialized exfiltration efforts are unlikely to be thwarted by obscuring
 * mnemonic phrases with localized or custom word lists; instead, consider using
 * a passphrase during seed derivation.
 *
 * If the provided `entropy` is a valid length, this method will never error.
 *
 * To use other word lists, see {@link encodeBip39MnemonicNonStandard}.
 *
 * @param entropy - the entropy (length must be 16, 20, 24, 28, or 32 bytes)
 */
export const encodeBip39Mnemonic = (entropy: Uint8Array) =>
  encodeBip39MnemonicNonStandard(entropy, bip39WordListEnglish);

/**
 * Derive a seed from the provided BIP39 mnemonic phrase.
 *
 * Note that by design, **BIP39 seed derivation is one-way**: seeds derived from
 * a mnemonic phrase cannot be used to recover the source phrase. Additionally,
 * BIP39 seed derivation does not perform any validation on the provided
 * mnemonic phrase, **allowing derivation from any string**.
 *
 * For use cases in which a particular mnemonic phrase is expected to be
 * correctly formed (with a valid checksum), first verify that it can be decoded
 * with {@link decodeBip39Mnemonic}.
 *
 * @param mnemonic - the BIP39 mnemonic phrase
 * @param passphrase - an optional passphrase (defaults to `undefined`)
 * @param crypto - an optional object containing an implementation of PBKDF2
 * using HMAC SHA512 (defaults to the internal WASM implementations)
 */
export const deriveSeedFromBip39Mnemonic = (
  mnemonic: string,
  passphrase?: string,
  crypto: { pbkdf2HmacSha512: typeof internalPbkdf2HmacSha512 } = {
    pbkdf2HmacSha512: internalPbkdf2HmacSha512,
  },
) => {
  const mnemonicNormalized = mnemonic.normalize('NFKD');
  const salt = `mnemonic${passphrase ?? ''}`;
  const saltNormalized = salt.normalize('NFKD');
  const mnemonicBin = utf8ToBin(mnemonicNormalized);
  const saltBin = utf8ToBin(saltNormalized);
  return crypto.pbkdf2HmacSha512({
    derivedKeyLength: Bip39.derivedKeyLength,
    iterations: Bip39.pbkdf2Iterations,
    password: mnemonicBin,
    salt: saltBin,
  }) as Uint8Array;
};

/**
 * Derive an {@link HdPrivateNode} from the provided BIP39 mnemonic phrase
 * following the BIP32 and BIP39 specifications.
 *
 * Note that by design, **BIP39 seed derivation is one-way**: seeds derived from
 * a mnemonic phrase cannot be used to recover the source phrase. Additionally,
 * BIP39 seed derivation does not perform any validation on the provided
 * mnemonic phrase, **allowing derivation from any string**.
 *
 * For use cases in which a particular mnemonic phrase is expected to be
 * correctly formed (with a valid checksum), first verify that it can be decoded
 * with {@link decodeBip39Mnemonic}.
 *
 * @param mnemonic - the BIP39 mnemonic phrase
 * @param passphrase - an optional passphrase (defaults to `undefined`)
 * @param crypto - an optional object containing an implementation of SHA-512
 * and PBKDF2 using HMAC SHA-512 (defaults to the internal WASM implementations)
 * @param hmacSha512Key - the HMAC SHA-512 key to use (defaults the HMAC SHA-512
 * key used by BIP32, `utf8ToBin('Bitcoin seed')`
 */
export const deriveHdPrivateNodeFromBip39Mnemonic = (
  mnemonic: string,
  passphrase?: string,
  crypto: {
    pbkdf2HmacSha512: typeof internalPbkdf2HmacSha512;
    sha512: { hash: Sha512['hash'] };
  } = {
    pbkdf2HmacSha512: internalPbkdf2HmacSha512,
    sha512: internalSha512,
  },
  hmacSha512Key?: Uint8Array,
  // eslint-disable-next-line @typescript-eslint/max-params
) =>
  deriveHdPrivateNodeFromSeed(
    deriveSeedFromBip39Mnemonic(mnemonic, passphrase, crypto),
    undefined,
    crypto,
    hmacSha512Key,
  );

/**
 * Generate a new, cryptographically secure, BIP39 mnemonic phrase using a
 * localized or custom word list.
 *
 * See {@link generateBip39Mnemonic} to generate a standard, 12-word English
 * mnemonic phrase.
 *
 * See {@link encodeBip39Mnemonic} to encode existing entropy as a BIP39
 * mnemonic phrase.
 *
 * **Usage**
 * ```ts
 * import { bip39WordListSpanish, generateBip39Mnemonic } from '@bitauth/libauth';
 *
 * const result = generateBip39Mnemonic(bip39WordListSpanish, 32);
 * if(typeof result === 'string') {
 *   throw new Error(result);
 * }
 * const { phrase } = result;
 * ```
 *
 * @param wordList - a 2048-word array to use as the BIP39 word list
 * @param entropyLength - the entropy length to generate – 16, 20, 24, 28, or 32
 * bytes (defaults to 16).
 */
export const generateBip39MnemonicNonStandard = (
  wordList: string[],
  entropyLength: Bip39ValidEntropyLength = Bip39.minEntropyBytes,
) => {
  if (!isValidBip39WordList(wordList)) {
    return formatError(
      Bip39Error.invalidWordListLength,
      `Word list length: ${wordList.length}.`,
    );
  }
  const entropy = generateRandomBytes(entropyLength);
  if (!isValidBip39EntropyLength(entropy)) {
    return formatError(
      Bip39Error.invalidEntropyLength,
      `Entropy length: ${entropy.length}.`,
    );
  }
  return encodeBip39MnemonicNonStandard(entropy, wordList);
};

/**
 * Generate a new, cryptographically secure, 12-word English BIP39
 * mnemonic phrase.
 *
 * See {@link generateBip39MnemonicNonStandard} to use a localized or custom
 * word list.
 *
 * See {@link encodeBip39Mnemonic} to encode existing entropy as a BIP39
 * mnemonic phrase.
 *
 * **Usage**
 * ```ts
 * import { generateBip39Mnemonic } from '@bitauth/libauth';
 *
 * const phrase = generateBip39Mnemonic();
 * ```
 */
export const generateBip39Mnemonic = () =>
  (
    generateBip39MnemonicNonStandard(
      bip39WordListEnglish,
      Bip39.minEntropyBytes,
    ) as Bip39MnemonicResult
  ).phrase;

export type Bip39MnemonicCorrection = {
  /**
   * The corrected BIP39 mnemonic phrase.
   */
  phrase: string;
  /**
   * An array of ranges (in ascending order) indicating the `start` and `end`
   * indexes of each correction within the corrected phrase. Corrections in
   * which only deletions occurred (e.g. an excess space or letter was removed)
   * are indicated by zero-length ranges (where `start` is equal to `end`).
   */
  corrections: {
    /**
     * The index of the corrected phrase at which this correction range begins.
     */
    start: number;
    /**
     * The index of the corrected phrase at which this correction range ends.
     * The correction range includes the characters up to, but not including,
     * the character indicated by the `end` index. Corrections requiring only
     * deletions are indicated by `end` indexes equal to their `start` index.
     */
    end: number;
  }[];
  /**
   * A user-friendly description of the type of correction performed. This
   * should be displayed to the user to inform them about other kinds of
   * corrective action that may be necessary.
   */
  description: string;
};

// cSpell:ignore aban

/**
 * TODO: not yet implemented; see also: {@link attemptCashAddressFormatErrorCorrection}
 *
 * Attempt to automatically correct any typographical errors in a BIP39 mnemonic
 * phrase, returning correction information for the closest matching valid
 * mnemonic phrase.
 *
 * Note that by design, BIP39 allows seed derivation from any NFKD-normalized
 * string, including phrases containing an incorrect or unrecognized checksum.
 *
 * **Indiscriminate use of this function during BIP39 mnemonic phrase import
 * would prevent the use of seeds derived from such nonstandard phrases.**
 *
 * Instead, this function should be used to offer an end user the best possible
 * correction for the provided mnemonic phrase, e.g.:
 *
 * ```
 * Warning: the BIP39 mnemonic phrase you entered appears to have typographical
 * errors. The phrase could be corrected to:
 *
 * [Render the corrected phrase, emphasizing all correction ranges.]
 *
 * Correction description: [render Bip39MnemonicCorrection.description]
 *
 * Would you like to use this corrected phrase?
 *
 * [Button: "Use corrected phrase"] [Button: "Use phrase with errors"]
 * ```
 *
 * This function attempts the following corrections, returning a
 * {@link Bip39MnemonicCorrection} as soon as a BIP39 mnemonic phrase with a
 * valid checksum is produced:
 *
 * - Trim whitespace from the beginning and end of the phrase
 * - Convert the phrase to lowercase characters
 * - Identify the best candidate word list from `possibleWordLists` with which
 * to correct errors by counting exact prefix matches, e.g. `aban` is a prefix
 * match for both English and French. If two word lists share the same number of
 * matches, the earlier index in `possibleWordLists` is prioritized. (Note that
 * `100` words are shared between the French and English word lists, and `1275`
 * words are shared between the Chinese Traditional and Chinese Simplified word
 * lists. Because this function is intended to correct standard BIP39 mnemonic
 * phrases, we assume that all correct words are found in a single word list.
 * - Deduplicate spaces between words, ensuring the expected space separator is
 * used (for the Japanese word list, an ideographic space separator: `\u3000`).
 * - Attempt to verify the checksum for all valid subsets of the phrase by
 * slicing the phrase at 24, 21, 18, 15, and 12 words. In these cases, the
 * additional words may have been entered in error, or they may be part of a
 * passphrase recorded in the same location as the phrase. The returned
 * {@link Bip39MnemonicCorrection.description} indicates that the user should
 * review the source material to see if the deleted word(s) are a passphrase.
 * - For every word where an exact match is not found, develop a ranked list of
 * possible matches:
 *   - Attempt to extend the word by finding all word(s) in the selected word
 * list with a matching prefix (i.e. only the first few characters of the
 * correct word were included in the incorrect phrase). If multiple prefix
 * matches are found, rank them in word list order (in later steps, all of these
 * matches are considered to have a similarity of `1`).
 *   - If no prefix matches were found, compute the Jaro similarity between
 * the unknown word and every word in the candidate word list, adding all
 * words to the ranked list in descending-similarity, then word list order.
 * - Attempt to find a corrected phrase with the minimum possible correction by
 * validating the checksum for each candidate combination in ranked order:
 *   - Beginning with a similarity target of 1, create candidate combinations
 * by replacing unknown words with all possible matches having a similarity
 * equal to or greater than the target.
 *   - If any unknown words have no matches meeting the similarity target, lower
 * the similarity target to the value of the next-most-similar match for that
 * word, using only that match in this correction iteration.
 *   - If no phrases with a valid checksum are found, repeat these steps with
 * the lowered similarity target, excluding previously-tried combinations.
 *
 * If no plausible matches are found, or if the provided phrase has an invalid
 * word count (after attempting to correct whitespace errors), an error (string)
 * is returned.
 *
 * Note, this method does not attempt to correct mnemonic phrases with an
 * incorrect word count; in these cases, the user should be asked to either
 * identify and provide the missing words or use a dedicated brute-forcing tool
 * (if words have been lost).
 *
 * @param mnemonic - the BIP39 mnemonic phrase to error-correct
 * @param possibleWordLists - an array of BIP39 word lists that may be in use by
 * the BIP39 mnemonic
 */
export const attemptBip39MnemonicErrorCorrection = /* c8 ignore next */ (
  /* c8 ignore next 3 */
  _mnemonic: string,
  _possibleWordLists: string[][],
): Bip39MnemonicCorrection | string => 'TODO: not yet implemented';

// export enum Bip39MnemonicCorrectionError {}
