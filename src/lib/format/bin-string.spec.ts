import test from 'ava';

import { binStringToBin, binToBinString, isBinString } from '../lib.js';

import { fc, testProp } from '@fast-check/ava';

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
  [fc.uint8Array({ maxLength: 100, minLength: 0 })],
  (t, input) =>
    t.deepEqual(
      binToBinString(binStringToBin(binToBinString(input))),
      binToBinString(input),
    ),
);
