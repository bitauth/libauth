/* eslint-disable functional/no-expression-statement, @typescript-eslint/no-magic-numbers */
import test from 'ava';
import { fc, testProp } from 'ava-fast-check';

import { binStringToBin, binToBinString, isBinString } from '../lib';

const maxUint8Number = 255;
const fcUint8Array = (minLength: number, maxLength: number) =>
  fc
    .array(fc.integer(0, maxUint8Number), minLength, maxLength)
    .map((a) => Uint8Array.from(a));

test('isBinString', (t) => {
  t.deepEqual(isBinString('0'), false);
  t.deepEqual(isBinString('01'), false);
  t.deepEqual(isBinString('00000000'), true);
  t.deepEqual(isBinString('0000000 '), false);
  t.deepEqual(isBinString('00000001'), true);
  t.deepEqual(isBinString('00000002'), false);
  t.deepEqual(isBinString('0000000100000001'), true);
  t.deepEqual(isBinString('000000010000000100000001'), true);
});

test('binStringToBin', (t) => {
  t.deepEqual(binStringToBin('0010101001100100'), Uint8Array.from([42, 100]));
});

test('binToBinString', (t) => {
  t.deepEqual(binToBinString(Uint8Array.from([42, 100])), '0010101001100100');
});

testProp(
  '[fast-check] binStringToBin <-> binToBinString',
  [fcUint8Array(0, 100)],
  (t, input) =>
    t.deepEqual(
      binToBinString(binStringToBin(binToBinString(input))),
      binToBinString(input)
    )
);
