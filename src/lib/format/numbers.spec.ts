/* eslint-disable functional/no-expression-statement, @typescript-eslint/no-magic-numbers */
import test, { Macro } from 'ava';
import { fc, testProp } from 'ava-fast-check';

import {
  bigIntToBinUint64LE,
  bigIntToBinUintLE,
  bigIntToBitcoinVarInt,
  binToBigIntUint64LE,
  binToBigIntUintLE,
  binToNumberUint32LE,
  binToNumberUintLE,
  hexToBin,
  numberToBinInt32TwosCompliment,
  numberToBinUint16LE,
  numberToBinUint32LE,
  numberToBinUintLE,
  readBitcoinVarInt,
  varIntPrefixToSize
} from '../lib';

test('numberToBinUint16LE', t => {
  t.deepEqual(numberToBinUint16LE(0), new Uint8Array([0, 0]));
  t.deepEqual(numberToBinUint16LE(1), new Uint8Array([1, 0]));
  t.deepEqual(numberToBinUint16LE(0x1234), new Uint8Array([0x34, 0x12]));
});

test('numberToBinUint16LE: returns maximum on overflow', t => {
  t.deepEqual(numberToBinUint16LE(0x01_0000), new Uint8Array([0xff, 0xff]));
});

test('numberToBinUint16LE: returns minimum on negative numbers', t => {
  t.deepEqual(numberToBinUint16LE(-1), new Uint8Array([0, 0]));
});

test('numberToBinUint32LE', t => {
  t.deepEqual(numberToBinUint32LE(0), new Uint8Array([0, 0, 0, 0]));
  t.deepEqual(numberToBinUint32LE(1), new Uint8Array([1, 0, 0, 0]));
  t.deepEqual(numberToBinUint32LE(0x1234), new Uint8Array([0x34, 0x12, 0, 0]));
  t.deepEqual(
    numberToBinUint32LE(0x12345678),
    new Uint8Array([0x78, 0x56, 0x34, 0x12])
  );
});

test('numberToBinUint32LE: returns maximum on overflow', t => {
  t.deepEqual(
    numberToBinUint32LE(0x01_0000_0000),
    new Uint8Array([0xff, 0xff, 0xff, 0xff])
  );
});

test('numberToBinUint32LE: returns minimum on negative numbers', t => {
  t.deepEqual(numberToBinUint32LE(-1), new Uint8Array([0, 0, 0, 0]));
});

test('numberToBinInt32TwosCompliment', t => {
  t.deepEqual(numberToBinInt32TwosCompliment(0), new Uint8Array([0, 0, 0, 0]));
  t.deepEqual(numberToBinInt32TwosCompliment(1), new Uint8Array([1, 0, 0, 0]));
  t.deepEqual(
    numberToBinInt32TwosCompliment(-0xffffffff),
    new Uint8Array([1, 0, 0, 0])
  );
  t.deepEqual(
    numberToBinInt32TwosCompliment(0xffffffff),
    new Uint8Array([255, 255, 255, 255])
  );
  t.deepEqual(
    numberToBinInt32TwosCompliment(-1),
    new Uint8Array([255, 255, 255, 255])
  );
  t.deepEqual(
    numberToBinInt32TwosCompliment(0xffff),
    new Uint8Array([255, 255, 0, 0])
  );
  t.deepEqual(
    numberToBinInt32TwosCompliment(-0xffff),
    new Uint8Array([1, 0, 255, 255])
  );
  t.deepEqual(
    numberToBinInt32TwosCompliment(1234567890),
    new Uint8Array([210, 2, 150, 73])
  );
  t.deepEqual(
    numberToBinInt32TwosCompliment(-1234567890),
    new Uint8Array([46, 253, 105, 182])
  );
});

test('bigIntToBinUint64LE', t => {
  t.deepEqual(
    bigIntToBinUint64LE(BigInt(0)),
    new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0])
  );
  t.deepEqual(
    bigIntToBinUint64LE(BigInt(0x01)),
    new Uint8Array([0x01, 0, 0, 0, 0, 0, 0, 0])
  );
  t.deepEqual(
    bigIntToBinUint64LE(BigInt(0x12345678)),
    new Uint8Array([0x78, 0x56, 0x34, 0x12, 0, 0, 0, 0])
  );
  t.deepEqual(
    bigIntToBinUint64LE(BigInt(Number.MAX_SAFE_INTEGER)),
    new Uint8Array([255, 255, 255, 255, 255, 255, 31, 0])
  );
  t.deepEqual(
    bigIntToBinUint64LE(BigInt('0xffffffffffffffff')),
    new Uint8Array([255, 255, 255, 255, 255, 255, 255, 255])
  );
});

test('bigIntToBinUint64LE: returns maximum on overflow', t => {
  t.deepEqual(
    bigIntToBinUint64LE(BigInt('0x010000000000000000')),
    new Uint8Array([0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff])
  );
});

test('bigIntToBinUint64LE: returns minimum on negative numbers', t => {
  t.deepEqual(
    bigIntToBinUint64LE(BigInt(-1)),
    new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0])
  );
});

test('bigIntToBitcoinVarInt: truncates larger values', t => {
  t.deepEqual(
    bigIntToBitcoinVarInt(BigInt('0x010000000000000000')),
    new Uint8Array([0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff])
  );
});

test('binToNumberUintLE', t => {
  t.deepEqual(binToNumberUintLE(new Uint8Array([0x12])), 0x12);
  t.deepEqual(binToNumberUintLE(new Uint8Array([0x34, 0x12])), 0x1234);
  t.deepEqual(binToNumberUintLE(new Uint8Array([0x56, 0x34, 0x12])), 0x123456);
  t.deepEqual(
    binToNumberUintLE(new Uint8Array([0x78, 0x56, 0x34, 0x12])),
    0x12345678
  );
  t.deepEqual(
    binToNumberUintLE(new Uint8Array([0x90, 0x78, 0x56, 0x34, 0x12])),
    0x1234567890
  );
});

testProp(
  '[fast-check] numberToBinUintLE <-> binToNumberUintLE',
  [fc.integer(0, Number.MAX_SAFE_INTEGER)],
  maxSafeInt => binToNumberUintLE(numberToBinUintLE(maxSafeInt)) === maxSafeInt
);

test('binToNumberUint32LE', t => {
  t.deepEqual(
    binToNumberUint32LE(new Uint8Array([0x78, 0x56, 0x34, 0x12])),
    0x12345678
  );
});

test('binToNumberUint32LE: ignores bytes after the 4th', t => {
  t.deepEqual(
    binToNumberUint32LE(new Uint8Array([0x78, 0x56, 0x34, 0x12, 0xff])),
    0x12345678
  );
});

test('binToBigIntUintLE', t => {
  t.deepEqual(binToBigIntUintLE(new Uint8Array([0x12])), BigInt(0x12));
  t.deepEqual(binToBigIntUintLE(new Uint8Array([0x34, 0x12])), BigInt(0x1234));
  t.deepEqual(
    binToBigIntUintLE(new Uint8Array([0x56, 0x34, 0x12])),
    BigInt(0x123456)
  );
  t.deepEqual(
    binToBigIntUintLE(new Uint8Array([0x78, 0x56, 0x34, 0x12])),
    BigInt(0x12345678)
  );
  t.deepEqual(
    binToBigIntUintLE(new Uint8Array([0x90, 0x78, 0x56, 0x34, 0x12])),
    BigInt(0x1234567890)
  );
  t.deepEqual(
    binToBigIntUintLE(
      new Uint8Array([0xef, 0xcd, 0xab, 0x90, 0x78, 0x56, 0x34, 0x12])
    ),
    BigInt('0x1234567890abcdef')
  );
});

testProp(
  '[fast-check] bigIntToBinUintLE <-> binToBigIntUintLE',
  [fc.bigUintN(65)],
  uint65 => binToBigIntUintLE(bigIntToBinUintLE(uint65)) === uint65
);

test('binToBigIntUint64LE', t => {
  t.deepEqual(
    binToBigIntUint64LE(new Uint8Array([0x78, 0x56, 0x34, 0x12, 0, 0, 0, 0])),
    BigInt(0x12345678)
  );
});

test('readBitcoinVarInt: offset is optional', t => {
  t.deepEqual(readBitcoinVarInt(hexToBin('00')), {
    nextOffset: 1,
    value: BigInt(0x00)
  });
});

const varIntVector: Macro<[string, bigint, number, number?, string?]> = (
  t,
  hex,
  value,
  nextOffset,
  start = 0,
  expected = hex
  // eslint-disable-next-line max-params
) => {
  t.deepEqual(readBitcoinVarInt(hexToBin(hex), start), {
    nextOffset,
    value
  });
  t.deepEqual(bigIntToBitcoinVarInt(value), hexToBin(expected));
};

// eslint-disable-next-line functional/immutable-data
varIntVector.title = (_, string) =>
  `readBitcoinVarInt/bigIntToBitcoinVarInt: ${string}`;

test(varIntVector, '00', BigInt(0x00), 1);
test(varIntVector, '01', BigInt(0x01), 1);
test(varIntVector, '12', BigInt(0x12), 1);
test(varIntVector, '6a', BigInt(0x6a), 1);
test(varIntVector, '00006a', BigInt(0x6a), 3, 2, '6a');
test(varIntVector, 'fc', BigInt(0xfc), 1);
test(varIntVector, 'fdfd00', BigInt(0x00fd), 3);
test(varIntVector, '000000fdfd00', BigInt(0xfd), 6, 3, 'fdfd00');
test(varIntVector, 'fdfe00', BigInt(0x00fe), 3);
test(varIntVector, 'fdff00', BigInt(0x00ff), 3);
test(varIntVector, 'fd1111', BigInt(0x1111), 3);
test(varIntVector, 'fd1234', BigInt(0x3412), 3);
test(varIntVector, 'fdfeff', BigInt(0xfffe), 3);
test(varIntVector, 'fdffff', BigInt(0xffff), 3);
test(varIntVector, 'fe00000100', BigInt(0x010000), 5);
test(varIntVector, '00fe00000100', BigInt(0x010000), 6, 1, 'fe00000100');
test(varIntVector, 'fe01000100', BigInt(0x010001), 5);
test(varIntVector, 'fe11111111', BigInt(0x11111111), 5);
test(varIntVector, 'fe12345678', BigInt(0x78563412), 5);
test(varIntVector, 'feffffffff', BigInt(0xffffffff), 5);
test(varIntVector, 'ff0000000001000000', BigInt(0x0100000000), 9);
test(
  varIntVector,
  '0000ff0000000001000000',
  BigInt(0x0100000000),
  11,
  2,
  'ff0000000001000000'
);
test(varIntVector, 'ff0100000001000000', BigInt(0x0100000001), 9);
test(varIntVector, 'ff1111111111111111', BigInt('0x1111111111111111'), 9);
test(varIntVector, 'ff1234567890abcdef', BigInt('0xefcdab9078563412'), 9);

testProp(
  '[fast-check] bigIntToBitcoinVarInt <-> readBitcoinVarInt',
  [fc.bigUintN(64)],
  uint64 => {
    const varInt = bigIntToBitcoinVarInt(uint64);
    const expectedOffset = varIntPrefixToSize(varInt[0]);
    const result = readBitcoinVarInt(varInt);
    return result.nextOffset === expectedOffset && result.value === uint64;
  }
);
