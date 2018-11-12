// tslint:disable:no-expression-statement no-magic-numbers
import test from 'ava';
import { decodeBase64String } from './base64';

test('decodeBase64String works as expected', t => {
  const abc = new Uint8Array([97, 98, 99]).buffer;
  const abcd = new Uint8Array([97, 98, 99, 100]).buffer;
  const abcde = new Uint8Array([97, 98, 99, 100, 101]).buffer;
  t.deepEqual(decodeBase64String('YWJj'), abc);
  t.deepEqual(decodeBase64String('YWJjZA=='), abcd);
  t.deepEqual(decodeBase64String('YWJjZGU='), abcde);
});
