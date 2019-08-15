// tslint:disable:no-expression-statement no-magic-numbers
import test from 'ava';

import { base64ToBin, binToBase64 } from './base64';

test('base64ToBin works as expected', t => {
  const abc = new Uint8Array([97, 98, 99]);
  const abcd = new Uint8Array([97, 98, 99, 100]);
  const abcde = new Uint8Array([97, 98, 99, 100, 101]);
  t.deepEqual(base64ToBin('YWJj'), abc);
  t.deepEqual(base64ToBin('YWJjZA=='), abcd);
  t.deepEqual(base64ToBin('YWJjZGU='), abcde);
});

test('binToBase64 works as expected', t => {
  const abc = 'YWJj';
  const abcd = 'YWJjZA==';
  const abcde = 'YWJjZGU=';
  t.deepEqual(binToBase64(Uint8Array.from([97, 98, 99])), abc);
  t.deepEqual(binToBase64(Uint8Array.from([97, 98, 99, 100])), abcd);
  t.deepEqual(binToBase64(Uint8Array.from([97, 98, 99, 100, 101])), abcde);
});
