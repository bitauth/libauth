// tslint:disable:no-expression-statement no-magic-numbers no-unsafe-any
import { test } from 'ava';
import * as fc from 'fast-check';
import { binToHex, hexToBin, range, splitEvery } from './utils';

const maxUint8Number = 255;
const fcUint8Array = (minLength: number, maxLength: number) =>
  fc
    .array(fc.integer(0, maxUint8Number), minLength, maxLength)
    .map(a => Uint8Array.from(a));

test('range', t => {
  t.deepEqual(range(3), [0, 1, 2]);
  t.deepEqual(range(3, 1), [1, 2, 3]);
});

test('splitEvery', t => {
  t.deepEqual(splitEvery('abcd', 2), ['ab', 'cd']);
  t.deepEqual(splitEvery('abcde', 2), ['ab', 'cd', 'e']);
});

test('hexToBin', t => {
  t.deepEqual(
    hexToBin('0001022a646566ff'),
    new Uint8Array([0, 1, 2, 42, 100, 101, 102, 255])
  );
});

test('binToHex', t => {
  t.deepEqual(
    binToHex(new Uint8Array([0, 1, 2, 42, 100, 101, 102, 255])),
    '0001022a646566ff'
  );
});

test('hexToBin <-> binToHex', t => {
  const inverse = fc.property(
    fcUint8Array(0, 100),
    input => binToHex(hexToBin(binToHex(input))) === binToHex(input)
  );
  t.notThrows(() => fc.assert(inverse));
});
