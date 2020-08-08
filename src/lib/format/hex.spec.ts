/* eslint-disable functional/no-expression-statement, @typescript-eslint/no-magic-numbers */
import test from 'ava';
import { fc, testProp } from 'ava-fast-check';

import {
  binToHex,
  hexToBin,
  isHex,
  range,
  splitEvery,
  swapEndianness,
} from '../lib';

const maxUint8Number = 255;
const fcUint8Array = (minLength: number, maxLength: number) =>
  fc
    .array(fc.integer(0, maxUint8Number), minLength, maxLength)
    .map((a) => Uint8Array.from(a));

test('range', (t) => {
  t.deepEqual(range(3), [0, 1, 2]);
  t.deepEqual(range(3, 1), [1, 2, 3]);
});

test('splitEvery', (t) => {
  t.deepEqual(splitEvery('abcd', 2), ['ab', 'cd']);
  t.deepEqual(splitEvery('abcde', 2), ['ab', 'cd', 'e']);
});

test('isHex', (t) => {
  t.deepEqual(isHex('0001022a646566ff'), true);
  t.deepEqual(isHex('0001022A646566Ff'), true);
  t.deepEqual(isHex('0001022A646566FF'), true);
  t.deepEqual(isHex('0001022A646566F'), false);
  t.deepEqual(isHex('0001022A646566FG'), false);
});

test('hexToBin', (t) => {
  t.deepEqual(
    hexToBin('0001022a646566ff'),
    Uint8Array.from([0, 1, 2, 42, 100, 101, 102, 255])
  );
  t.deepEqual(
    hexToBin('0001022A646566FF'),
    Uint8Array.from([0, 1, 2, 42, 100, 101, 102, 255])
  );
});

test('binToHex', (t) => {
  t.deepEqual(
    binToHex(Uint8Array.from([0, 1, 2, 42, 100, 101, 102, 255])),
    '0001022a646566ff'
  );
});

testProp(
  '[fast-check] hexToBin <-> binToHex',
  [fcUint8Array(0, 100)],
  (t, input) =>
    t.deepEqual(binToHex(hexToBin(binToHex(input))), binToHex(input))
);

test('swapEndianness', (t) => {
  t.deepEqual(swapEndianness('0001022a646566ff'), 'ff6665642a020100');
});
