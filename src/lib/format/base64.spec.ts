/* eslint-disable functional/no-expression-statement, @typescript-eslint/no-magic-numbers */
import test from 'ava';

import { base64ToBin, binToBase64, isBase64 } from '../lib';

test('isBase64', (t) => {
  t.deepEqual(isBase64('YWJj'), true);
  t.deepEqual(isBase64('YWJjZA=='), true);
  t.deepEqual(isBase64('YWJ&'), false);
  t.deepEqual(isBase64('YWJ'), false);
  t.deepEqual(isBase64('YW'), false);
  t.deepEqual(isBase64('Y'), false);
});

test('base64ToBin works as expected', (t) => {
  const abc = new Uint8Array([97, 98, 99]);
  const abcd = new Uint8Array([97, 98, 99, 100]);
  const abcde = new Uint8Array([97, 98, 99, 100, 101]);
  t.deepEqual(base64ToBin('YWJj'), abc);
  t.deepEqual(base64ToBin('YWJjZA=='), abcd);
  t.deepEqual(base64ToBin('YWJjZGU='), abcde);
});

test('binToBase64 works as expected', (t) => {
  const abc = 'YWJj';
  const abcd = 'YWJjZA==';
  const abcde = 'YWJjZGU=';
  t.deepEqual(binToBase64(Uint8Array.from([97, 98, 99])), abc);
  t.deepEqual(binToBase64(Uint8Array.from([97, 98, 99, 100])), abcd);
  t.deepEqual(binToBase64(Uint8Array.from([97, 98, 99, 100, 101])), abcde);
});
