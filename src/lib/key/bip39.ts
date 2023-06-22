import { bip39WordListEnglish } from './bip39.english.js';

export const bip39Something = (words = bip39WordListEnglish.split('\n')) =>
  words;
