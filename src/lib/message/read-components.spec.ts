import test from 'ava';

import type { ReadResult } from '../lib.js';
import {
  bigIntToBinUint64LE,
  hexToBin,
  numberToBinUint32LE,
  readBytes,
  ReadBytesError,
  readUint32LE,
  ReadUint32LEError,
  readUint64LE,
  ReadUint64LEError,
  /*
   * readCompactUintPrefixedBin,
   * readRemainingBytes,
   * readUint64LE,
   */
} from '../lib.js';

test('readBytes', (t) => {
  const bin = hexToBin('00010203');
  t.deepEqual(
    readBytes(1)({ bin, index: 4 }),
    `${ReadBytesError.insufficientLength} Bytes requested: 1; remaining bytes: 0`,
  );
  const notMutated = { bin, index: 0 };
  const result = readBytes(1)(notMutated);
  t.deepEqual(result, {
    position: { bin, index: 1 },
    result: hexToBin('00'),
  });
  t.deepEqual(notMutated, { bin, index: 0 });
  const newBin = (result as ReadResult<Uint8Array>).result;
  newBin.fill(0xff);
  t.deepEqual(newBin, hexToBin('ff'));
  t.deepEqual(notMutated.bin, bin);
  t.deepEqual(readBytes(3)({ bin, index: 1 }), {
    position: { bin, index: 4 },
    result: hexToBin('010203'),
  });
});

test('readUint32LE', (t) => {
  const bin = hexToBin('00010203');
  const num = 0x03020100;
  const result = {
    position: { bin, index: 4 },
    result: num,
  };
  t.deepEqual(readUint32LE({ bin, index: 0 }), result);
  t.deepEqual(bin, numberToBinUint32LE(num));
  result.position.bin.fill(0xff);
  const mutates = hexToBin('ffffffff');
  t.deepEqual(bin, mutates);
  t.deepEqual(
    readUint32LE({ bin: hexToBin('0001'), index: 0 }),
    `${ReadUint32LEError.insufficientBytes} Remaining bytes: 2`,
  );
});

test('readUint64LE', (t) => {
  const bin = hexToBin('00010203ffffffff');
  const num = 0xffff_ffff_0302_0100n;
  const result = {
    position: { bin, index: 8 },
    result: num,
  };
  t.deepEqual(readUint64LE({ bin, index: 0 }), result);
  t.deepEqual(bin, bigIntToBinUint64LE(num));
  result.position.bin.fill(0xff);
  const mutates = hexToBin('ffffffffffffffff');
  t.deepEqual(bin, mutates);
  t.deepEqual(
    readUint64LE({ bin: hexToBin('00010203'), index: 0 }),
    `${ReadUint64LEError.insufficientBytes} Remaining bytes: 4`,
  );
});

test.todo('readCompactUintPrefixedBin');
test.todo('readRemainingBytes');
