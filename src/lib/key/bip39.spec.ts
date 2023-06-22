import test from 'ava';

import { bip39WordListEnglish } from '../lib.js';

test.todo('bip39 word lists include 2048 words', (t) => {
  const expectedLength = 2048;
  t.deepEqual(bip39WordListEnglish.length, expectedLength);
});
