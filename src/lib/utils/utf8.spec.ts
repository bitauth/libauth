// tslint:disable:no-expression-statement
import test from 'ava';
import * as fc from 'fast-check';

import { hexToBin } from './hex';
import { binToUtf8, utf8ToBin } from './utf8';

const maxUint8Number = 255;
const fcUint8Array = (minLength: number, maxLength: number) =>
  fc
    .array(fc.integer(0, maxUint8Number), minLength, maxLength)
    .map(a => Uint8Array.from(a));

test('utf8ToBin', t => {
  t.deepEqual(utf8ToBin('👍'), hexToBin('f09f918d'));
});

test('binToUtf8', t => {
  t.deepEqual(binToUtf8(hexToBin('f09f918d')), '👍');
});

const testBinLength = 100;
test('utf8ToBin <-> binToUtf8', t => {
  const inverse = fc.property(
    fcUint8Array(0, testBinLength),
    input => binToUtf8(utf8ToBin(binToUtf8(input))) === binToUtf8(input)
  );
  t.notThrows(() => {
    fc.assert(inverse);
  });
});
