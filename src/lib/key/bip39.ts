import { bip39WordListEnglish } from './bip39.english.js';

import { pbkdf2HmacSha512, sha256 } from '../crypto/crypto.js';
import { binToBinString, utf8ToBin } from '../format/format.js';

export { bip39WordListEnglish };

export enum MnemonicErrors {
  invalidEntropyError = 'Invalid Entropy: TODO',
  invalidWordIndex = 'Invalid Word Index: TODO',
}

/*
interface Mnemonic {
  type: 'BIP39';
  phrase: string;
}
*/

// TODO: Just inline if only used once (think will be used in deriveEntropyFromMnemonic though)
export const deriveBip39ChecksumBits = (entropyBuffer: Uint8Array) => {
  const ENT = entropyBuffer.length * 8;
  const CS = ENT / 32;
  const hash = sha256.hash(entropyBuffer);
  return binToBinString(hash).slice(0, CS);
};

/*
export const deriveBip39EntropyFromMnemonic = (
  mnemonic: string,
  wordlist: string[]
) => {
  // TODO
};
*/

export const deriveBip39MnemonicFromEntropy = (
  entropy: Uint8Array,
  wordlist: string[]
) => {
  // 128 <= ENT <= 256
  if (entropy.length < 16) {
    return MnemonicErrors.invalidEntropyError;
  }
  if (entropy.length > 32) {
    return MnemonicErrors.invalidEntropyError;
  }
  if (entropy.length % 4 !== 0) {
    return MnemonicErrors.invalidEntropyError;
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
  return deriveBip39MnemonicFromEntropy(secureRandom(), wordlist);
}
