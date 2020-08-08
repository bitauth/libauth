/* eslint-disable functional/no-expression-statement */
import test from 'ava';
import { testProp } from 'ava-fast-check';
import * as fc from 'fast-check';

import { binToUtf8, hexToBin, utf8ToBin } from '../lib';

const maxUint8Number = 255;
const fcUint8Array = (minLength: number, maxLength: number) =>
  fc
    .array(fc.integer(0, maxUint8Number), minLength, maxLength)
    .map((a) => Uint8Array.from(a));

test('utf8ToBin', (t) => {
  t.deepEqual(utf8ToBin('👍'), hexToBin('f09f918d'));
});

test('binToUtf8', (t) => {
  t.deepEqual(binToUtf8(hexToBin('f09f918d')), '👍');
});

const testBinLength = 100;
testProp(
  '[fast-check] utf8ToBin <-> binToUtf8',
  [fcUint8Array(0, testBinLength)],
  (t, input) =>
    t.deepEqual(binToUtf8(utf8ToBin(binToUtf8(input))), binToUtf8(input))
);
