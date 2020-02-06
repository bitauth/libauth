/* eslint-disable functional/no-expression-statement, @typescript-eslint/no-magic-numbers */
import test from 'ava';

import {
  bigIntToBinUint64LE,
  binToBigIntUint64LE,
  binToNumberUint16LE,
  binToNumberUint32LE,
  numberToBinUint16LE,
  numberToBinUint32LE
} from './numbers';

test('numberToBinUint16LE', t => {
  t.deepEqual(numberToBinUint16LE(0x1234), new Uint8Array([0x34, 0x12]));
});

test('binToNumberUint16LE', t => {
  t.deepEqual(binToNumberUint16LE(new Uint8Array([0x34, 0x12])), 0x1234);
});

test('numberToBinUint32LE', t => {
  t.deepEqual(
    numberToBinUint32LE(0x12345678),
    new Uint8Array([0x78, 0x56, 0x34, 0x12])
  );
});

test('binToNumberUint32LE', t => {
  t.deepEqual(
    binToNumberUint32LE(new Uint8Array([0x78, 0x56, 0x34, 0x12])),
    0x12345678
  );
});

// TODO: When BigInt lands in TypeScript, include more cases here
test('bigIntToBinUint64LE', t => {
  t.deepEqual(
    bigIntToBinUint64LE(BigInt(0x12345678)),
    new Uint8Array([0x78, 0x56, 0x34, 0x12, 0, 0, 0, 0])
  );
});

test('binToBigIntUint64LE', t => {
  t.deepEqual(
    binToBigIntUint64LE(new Uint8Array([0x78, 0x56, 0x34, 0x12, 0, 0, 0, 0])),
    BigInt(0x12345678)
  );
});
