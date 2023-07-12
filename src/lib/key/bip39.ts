import { bip39WordListEnglish } from './bip39.english.js';

import { pbkdf2HmacSha512, sha256 } from '../crypto/crypto.js';
import { binStringToBin, binToBinString, utf8ToBin } from '../format/format.js';

export { bip39WordListEnglish };

export enum MnemonicErrors {
  invalidEntropyError = 'Invalid Entropy: Must be between 16 and 32 bytes and divisible by 4',
  invalidMnemonic = 'Invalid Mnemonic: Word count must be divisible by 3',
  invalidWordList = 'Invalid Word List Length: Word list must contain exactly 2048 words',
  invalidWordIndex = 'Invalid Word Index: TODO',
  invalidChecksum = 'Invalid Checksum: TODO',
}

interface Bip39Mnemonic {
  success: true;
  phrase: string;
}

// TODO: Just inline if only used once (think will be used in deriveEntropyFromMnemonic though)
export const deriveBip39ChecksumBits = (entropyBuffer: Uint8Array) => {
  const ENT = entropyBuffer.length * 8;
  const CS = ENT / 32;
  const hash = sha256.hash(entropyBuffer);
  return binToBinString(hash).slice(0, CS);
};

export const deriveBip39EntropyFromMnemonic = (
  mnemonic: string,
  wordlist: string[]
) => {
  if (wordlist.length !== 2048) {
    return MnemonicErrors.invalidWordList;
  }

  const words = mnemonic.normalize('NFKD').split(' ');

  if (words.length % 3 !== 0) {
    return MnemonicErrors.invalidMnemonic;
  }

  // convert word indices to 11 bit binary strings
  const bits = words
    .map((word: string): string => {
      const index = wordlist!.indexOf(word);

      if (index === -1) {
        return MnemonicErrors.invalidWordIndex;
      }

      return index.toString(2).padStart(11, '0');
    })
    .join('');

  // split the binary string into ENT/CS
  const dividerIndex = Math.floor(bits.length / 33) * 32;
  const entropyBits = bits.slice(0, dividerIndex);
  const checksumBits = bits.slice(dividerIndex);

  // calculate the checksum and compare
  const entropy = new Uint8Array(
    entropyBits.match(/(.{1,8})/g)!.map((bin) => parseInt(bin, 2))
  );

  if (entropy.length < 16 || entropy.length > 32 || entropy.length % 4 !== 0) {
    return MnemonicErrors.invalidEntropyError;
  }

  const newChecksum = deriveBip39ChecksumBits(entropy);
  if (newChecksum !== checksumBits) {
    return MnemonicErrors.invalidChecksum;
  }

  return entropy;
};

export const deriveBip39MnemonicFromEntropy = (
  entropy: Uint8Array,
  wordlist: string[]
) => {
  // 128 <= ENT <= 256
  if (entropy.length < 16 || entropy.length > 32 || entropy.length % 4 !== 0) {
    return MnemonicErrors.invalidEntropyError;
  }

  if (wordlist.length !== 2048) {
    return MnemonicErrors.invalidWordList;
  }

  const entropyBits = binToBinString(entropy);
  const checksumBits = deriveBip39ChecksumBits(entropy);

  const bits = entropyBits + checksumBits;
  const chunks = bits.match(/(.{1,11})/g)!;
  const words = chunks.map((binary: string): string => {
    const index = parseInt(binary, 2);
    const word = wordlist[index];

    if (!word) {
      return MnemonicErrors.invalidWordIndex;
    }

    return word;
  });

  // TODO: Return a type, not just a string as strings indicate errors.
  return wordlist[0] === '\u3042\u3044\u3053\u304f\u3057\u3093' // Japanese wordlist
    ? words.join('\u3000')
    : words.join(' ');
};

export const deriveBip39SeedFromMnemonic = (
  mnemonic: string,
  password?: string
) => {
  const mnemonicNormalized = mnemonic.normalize('NFKD');

  const salt = 'mnemonic' + (password || '');
  const saltNormalized = salt.normalize('NFKD');

  const mnemonicBuffer = utf8ToBin(mnemonicNormalized);
  const saltBuffer = utf8ToBin(saltNormalized);

  return pbkdf2HmacSha512({
    password: mnemonicBuffer,
    salt: saltBuffer,
    derivedKeyLength: 64,
    iterations: 2048,
  });
};

export function generateBip39Mnemonic(
  wordlist: string[] = bip39WordListEnglish,
  secureRandom: () => Uint8Array
): string {
  if (wordlist.length !== 2048) {
    return MnemonicErrors.invalidWordList;
  }

  const entropy = secureRandom();

  if (entropy.length < 16 || entropy.length > 32 || entropy.length % 4 !== 0) {
    return MnemonicErrors.invalidEntropyError;
  }

  return deriveBip39MnemonicFromEntropy(entropy, wordlist);
}
