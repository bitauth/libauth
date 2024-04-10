import test from 'ava';

import {
  binToUtf8,
  hexToBin,
  length,
  lossyNormalize,
  segment,
  utf8ToBin,
} from '../lib.js';

import { testProp } from '@fast-check/ava';
import fc from 'fast-check';

const maxUint8Number = 255;
const fcUint8Array = (minLength: number, maxLength: number) =>
  fc
    .array(fc.integer({ max: maxUint8Number, min: 0 }), {
      maxLength,
      minLength,
    })
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
    t.deepEqual(binToUtf8(utf8ToBin(binToUtf8(input))), binToUtf8(input)),
);

const nonNormal = 'ﬁt🚀👫👨‍👩‍👧‍👦';
test('lossyNormalize', (t) => {
  t.deepEqual(lossyNormalize(nonNormal), 'fit🚀👫👨‍👩‍👧‍👦');
});

test('segment', (t) => {
  t.deepEqual(
    [...nonNormal],
    ['ﬁ', 't', '🚀', '👫', '👨', '‍', '👩', '‍', '👧', '‍', '👦'],
  );
  t.deepEqual(segment(nonNormal), ['ﬁ', 't', '🚀', '👫', '👨‍👩‍👧‍👦']);
});

test('length', (t) => {
  t.deepEqual(nonNormal.length, 17);
  t.deepEqual(length(nonNormal), 5);
});
