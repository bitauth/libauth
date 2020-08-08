/* eslint-disable functional/no-expression-statement, @typescript-eslint/no-magic-numbers */
import test, { Macro } from 'ava';
import { fc, testProp } from 'ava-fast-check';

import {
  bigIntToBinUint256BEClamped,
  bigIntToBinUint64LE,
  bigIntToBinUint64LEClamped,
  bigIntToBinUintLE,
  bigIntToBitcoinVarInt,
  binToBigIntUint256BE,
  binToBigIntUint64LE,
  binToBigIntUintBE,
  binToBigIntUintLE,
  binToHex,
  binToNumberUint16LE,
  binToNumberUint32LE,
  binToNumberUintLE,
  hexToBin,
  numberToBinInt32TwosCompliment,
  numberToBinUint16BE,
  numberToBinUint16LE,
  numberToBinUint16LEClamped,
  numberToBinUint32BE,
  numberToBinUint32LE,
  numberToBinUint32LEClamped,
  numberToBinUintLE,
  readBitcoinVarInt,
  varIntPrefixToSize,
} from '../lib';

test('numberToBinUint16LE', (t) => {
  t.deepEqual(numberToBinUint16LE(0), Uint8Array.from([0, 0]));
  t.deepEqual(numberToBinUint16LE(1), Uint8Array.from([1, 0]));
  t.deepEqual(numberToBinUint16LE(0x1234), Uint8Array.from([0x34, 0x12]));
});

test('numberToBinUint16BE', (t) => {
  t.deepEqual(numberToBinUint16BE(0), Uint8Array.from([0, 0]));
  t.deepEqual(numberToBinUint16BE(1), Uint8Array.from([0, 1]));
  t.deepEqual(numberToBinUint16BE(0x1234), Uint8Array.from([0x12, 0x34]));
});

test('numberToBinUint16LE vs. numberToBinUint16LEClamped: behavior on overflow', (t) => {
  t.deepEqual(
    numberToBinUint16LE(0x01_0000),
    numberToBinUint16LE(0x01_0000 % (0xffff + 1))
  );
  t.deepEqual(
    numberToBinUint16LEClamped(0x01_0000),
    Uint8Array.from([0xff, 0xff])
  );
});

test('numberToBinUint16LE vs. numberToBinUint16LEClamped: behavior on negative numbers', (t) => {
  t.deepEqual(numberToBinUint16LE(-2), numberToBinUint16LE(0xffff - 1));
  t.deepEqual(numberToBinUint16LEClamped(-2), Uint8Array.from([0, 0]));
});

test('numberToBinUint32LE', (t) => {
  t.deepEqual(numberToBinUint32LE(0), Uint8Array.from([0, 0, 0, 0]));
  t.deepEqual(numberToBinUint32LE(1), Uint8Array.from([1, 0, 0, 0]));
  t.deepEqual(numberToBinUint32LE(0x1234), Uint8Array.from([0x34, 0x12, 0, 0]));
  t.deepEqual(
    numberToBinUint32LE(0x12345678),
    Uint8Array.from([0x78, 0x56, 0x34, 0x12])
  );
});

test('numberToBinUint32BE', (t) => {
  t.deepEqual(numberToBinUint32BE(0), Uint8Array.from([0, 0, 0, 0]));
  t.deepEqual(numberToBinUint32BE(1), Uint8Array.from([0, 0, 0, 1]));
  t.deepEqual(numberToBinUint32BE(0x1234), Uint8Array.from([0, 0, 0x12, 0x34]));
  t.deepEqual(
    numberToBinUint32BE(0x12345678),
    Uint8Array.from([0x12, 0x34, 0x56, 0x78])
  );
});

test('numberToBinUint32LE vs. numberToBinUint32LEClamped: behavior on overflow', (t) => {
  t.deepEqual(
    numberToBinUint32LE(0x01_0000_0000),
    numberToBinUint32LE(0x01_0000_0000 % (0xffffffff + 1))
  );
  t.deepEqual(
    numberToBinUint32LEClamped(0x01_0000_0000),
    Uint8Array.from([0xff, 0xff, 0xff, 0xff])
  );
});

test('numberToBinUint32LE: behavior on negative numbers', (t) => {
  t.deepEqual(numberToBinUint32LE(-2), numberToBinUint32LE(0xffffffff - 1));
  t.deepEqual(numberToBinUint32LEClamped(-2), Uint8Array.from([0, 0, 0, 0]));
});

test('numberToBinUintLE', (t) => {
  t.deepEqual(
    numberToBinUintLE(Number.MAX_SAFE_INTEGER),
    Uint8Array.from([255, 255, 255, 255, 255, 255, 31])
  );
});

test('numberToBinInt32TwosCompliment', (t) => {
  t.deepEqual(numberToBinInt32TwosCompliment(0), Uint8Array.from([0, 0, 0, 0]));
  t.deepEqual(numberToBinInt32TwosCompliment(1), Uint8Array.from([1, 0, 0, 0]));
  t.deepEqual(
    numberToBinInt32TwosCompliment(-0xffffffff),
    Uint8Array.from([1, 0, 0, 0])
  );
  t.deepEqual(
    numberToBinInt32TwosCompliment(0xffffffff),
    Uint8Array.from([255, 255, 255, 255])
  );
  t.deepEqual(
    numberToBinInt32TwosCompliment(-1),
    Uint8Array.from([255, 255, 255, 255])
  );
  t.deepEqual(
    numberToBinInt32TwosCompliment(0xffff),
    Uint8Array.from([255, 255, 0, 0])
  );
  t.deepEqual(
    numberToBinInt32TwosCompliment(-0xffff),
    Uint8Array.from([1, 0, 255, 255])
  );
  t.deepEqual(
    numberToBinInt32TwosCompliment(1234567890),
    Uint8Array.from([210, 2, 150, 73])
  );
  t.deepEqual(
    numberToBinInt32TwosCompliment(-1234567890),
    Uint8Array.from([46, 253, 105, 182])
  );
});

test('bigIntToBinUint64LE', (t) => {
  t.deepEqual(
    bigIntToBinUint64LE(BigInt(0)),
    Uint8Array.from([0, 0, 0, 0, 0, 0, 0, 0])
  );
  t.deepEqual(
    bigIntToBinUint64LE(BigInt(0x01)),
    Uint8Array.from([0x01, 0, 0, 0, 0, 0, 0, 0])
  );
  t.deepEqual(
    bigIntToBinUint64LE(BigInt(0x12345678)),
    Uint8Array.from([0x78, 0x56, 0x34, 0x12, 0, 0, 0, 0])
  );
  t.deepEqual(
    bigIntToBinUint64LE(BigInt(Number.MAX_SAFE_INTEGER)),
    Uint8Array.from([255, 255, 255, 255, 255, 255, 31, 0])
  );
  t.deepEqual(
    bigIntToBinUint64LE(BigInt('0xffffffffffffffff')),
    Uint8Array.from([255, 255, 255, 255, 255, 255, 255, 255])
  );
});

test('bigIntToBinUint64LE vs. bigIntToBinUint64LEClamped: behavior on overflow', (t) => {
  t.deepEqual(
    bigIntToBinUint64LE(BigInt('0x010000000000000000')),
    bigIntToBinUint64LE(
      BigInt('0x010000000000000000') %
        (BigInt('0xffffffffffffffff') + BigInt(1))
    )
  );
  t.deepEqual(
    bigIntToBinUint64LEClamped(BigInt('0x010000000000000000')),
    Uint8Array.from([0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff])
  );
});

test('bigIntToBinUint64LE vs. bigIntToBinUint64LEClamped: behavior on negative numbers', (t) => {
  t.deepEqual(
    bigIntToBinUint64LE(BigInt(-1)),
    Uint8Array.from([0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff])
  );
  t.deepEqual(
    bigIntToBinUint64LEClamped(BigInt(-1)),
    Uint8Array.from([0, 0, 0, 0, 0, 0, 0, 0])
  );
});

test('bigIntToBitcoinVarInt: larger values return modulo result after opcode', (t) => {
  t.deepEqual(
    bigIntToBitcoinVarInt(BigInt('0x010000000000000001')),
    Uint8Array.from([0xff, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00])
  );
});

test('binToNumberUintLE', (t) => {
  t.deepEqual(binToNumberUintLE(Uint8Array.from([0x12])), 0x12);
  t.deepEqual(binToNumberUintLE(Uint8Array.from([0x34, 0x12])), 0x1234);
  t.deepEqual(
    binToNumberUintLE(Uint8Array.from([0x78, 0x56, 0x34, 0x12])),
    0x12345678
  );
  t.deepEqual(
    binToNumberUintLE(Uint8Array.from([0x90, 0x78, 0x56, 0x34, 0x12])),
    0x1234567890
  );
  t.deepEqual(
    binToNumberUintLE(Uint8Array.from([255, 255, 255, 255, 255, 255, 31])),
    Number.MAX_SAFE_INTEGER
  );
  t.deepEqual(binToNumberUintLE(Uint8Array.from([0x56, 0x34, 0x12])), 0x123456);
  const data = Uint8Array.from([0x90, 0x78, 0x56, 0x34, 0x12]);
  const view = data.subarray(2);
  t.deepEqual(binToNumberUintLE(view), 0x123456);
  t.throws(() => {
    binToNumberUintLE(Uint8Array.of(0x12), 2);
  });
});

testProp(
  '[fast-check] numberToBinUintLE <-> binToNumberUintLE',
  [fc.integer(0, Number.MAX_SAFE_INTEGER)],
  (t, maxSafeInt) =>
    t.deepEqual(binToNumberUintLE(numberToBinUintLE(maxSafeInt)), maxSafeInt)
);

test('binToNumberUint16LE', (t) => {
  t.deepEqual(binToNumberUint16LE(Uint8Array.from([0x34, 0x12])), 0x1234);
  const data = Uint8Array.from([0x90, 0x78, 0x56, 0x34, 0x12, 0x00]);
  const view = data.subarray(2, 4);
  t.deepEqual(binToNumberUint16LE(view), 0x3456);
});

test('binToNumberUint16LE: ignores bytes after the 2nd', (t) => {
  t.deepEqual(
    binToNumberUint16LE(Uint8Array.from([0x78, 0x56, 0x34, 0x12, 0xff])),
    0x5678
  );
});

test('binToNumberUint32LE', (t) => {
  t.deepEqual(
    binToNumberUint32LE(Uint8Array.from([0x78, 0x56, 0x34, 0x12])),
    0x12345678
  );
  const data = Uint8Array.from([0x90, 0x78, 0x56, 0x34, 0x12, 0x00]);
  const view = data.subarray(2);
  t.deepEqual(binToNumberUint32LE(view), 0x123456);
});

test('binToNumberUint32LE: ignores bytes after the 4th', (t) => {
  t.deepEqual(
    binToNumberUint32LE(Uint8Array.from([0x78, 0x56, 0x34, 0x12, 0xff])),
    0x12345678
  );
});

test('binToBigIntUintBE', (t) => {
  t.deepEqual(binToBigIntUintBE(Uint8Array.from([0x12])), BigInt(0x12));
  t.deepEqual(binToBigIntUintBE(Uint8Array.from([0x12, 0x34])), BigInt(0x1234));
  t.deepEqual(
    binToBigIntUintBE(Uint8Array.from([0x12, 0x34, 0x56])),
    BigInt(0x123456)
  );
  t.deepEqual(
    binToBigIntUintBE(Uint8Array.from([0x12, 0x34, 0x56, 0x78])),
    BigInt(0x12345678)
  );
  t.deepEqual(
    binToBigIntUintBE(Uint8Array.from([0x12, 0x34, 0x56, 0x78, 0x90])),
    BigInt(0x1234567890)
  );
  t.deepEqual(
    binToBigIntUintBE(
      Uint8Array.from([0x12, 0x34, 0x56, 0x78, 0x90, 0xab, 0xcd, 0xef])
    ),
    BigInt('0x1234567890abcdef')
  );
  t.deepEqual(
    binToBigIntUintBE(Uint8Array.from([0x56, 0x78, 0x90, 0xab, 0xcd, 0xef])),
    BigInt('0x567890abcdef')
  );
  const d = Uint8Array.from([0x12, 0x34, 0x56, 0x78, 0x90, 0xab, 0xcd, 0xef]);
  const view = d.subarray(2);
  t.deepEqual(binToBigIntUintBE(view), BigInt('0x567890abcdef'));
  t.throws(() => {
    binToBigIntUintBE(Uint8Array.of(0x12), 2);
  });
});

test('binToBigIntUint256BE and bigIntToBinUint256BEClamped', (t) => {
  t.deepEqual(binToBigIntUint256BE(new Uint8Array(32)), BigInt(0));
  t.deepEqual(bigIntToBinUint256BEClamped(BigInt(0)), new Uint8Array(32));
  t.deepEqual(bigIntToBinUint256BEClamped(BigInt(-1)), new Uint8Array(32));
  const secp256k1OrderNHex =
    'fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141';
  const secp256k1OrderNBin = hexToBin(secp256k1OrderNHex);
  const secp256k1OrderN = BigInt(`0x${secp256k1OrderNHex}`);
  t.deepEqual(binToBigIntUint256BE(secp256k1OrderNBin), secp256k1OrderN);
  t.deepEqual(bigIntToBinUint256BEClamped(secp256k1OrderN), secp256k1OrderNBin);
  const max = new Uint8Array(32);
  max.fill(255);
  const overMax = new Uint8Array(33);
  // eslint-disable-next-line functional/immutable-data
  overMax[0] = 255;
  t.deepEqual(
    bigIntToBinUint256BEClamped(BigInt(`0x${binToHex(overMax)}`)),
    max
  );
});

testProp(
  '[fast-check] binToBigIntUint256BE <-> bigIntToBinUint256BEClamped',
  [fc.bigUintN(256)],
  (t, uint256) =>
    t.deepEqual(
      binToBigIntUint256BE(bigIntToBinUint256BEClamped(uint256)),
      uint256
    )
);

test('binToBigIntUintLE', (t) => {
  t.deepEqual(binToBigIntUintLE(Uint8Array.from([0x12])), BigInt(0x12));
  t.deepEqual(binToBigIntUintLE(Uint8Array.from([0x34, 0x12])), BigInt(0x1234));
  t.deepEqual(
    binToBigIntUintLE(Uint8Array.from([0x56, 0x34, 0x12])),
    BigInt(0x123456)
  );
  t.deepEqual(
    binToBigIntUintLE(Uint8Array.from([0x78, 0x56, 0x34, 0x12])),
    BigInt(0x12345678)
  );
  t.deepEqual(
    binToBigIntUintLE(Uint8Array.from([0x90, 0x78, 0x56, 0x34, 0x12])),
    BigInt(0x1234567890)
  );
  t.deepEqual(
    binToBigIntUintLE(
      Uint8Array.from([0xef, 0xcd, 0xab, 0x90, 0x78, 0x56, 0x34, 0x12])
    ),
    BigInt('0x1234567890abcdef')
  );
  t.deepEqual(
    binToBigIntUintLE(Uint8Array.from([0xab, 0x90, 0x78, 0x56, 0x34, 0x12])),
    BigInt('0x1234567890ab')
  );
  const d = Uint8Array.from([0xef, 0xcd, 0xab, 0x90, 0x78, 0x56, 0x34, 0x12]);
  const view = d.subarray(2);
  t.deepEqual(binToBigIntUintLE(view), BigInt('0x1234567890ab'));
  t.throws(() => {
    binToBigIntUintLE(Uint8Array.of(0x12), 2);
  });
});

testProp(
  '[fast-check] bigIntToBinUintLE <-> binToBigIntUintBE -> reverse',
  [fc.bigUintN(256)],
  (t, uint256) => {
    const bin = bigIntToBinUintLE(uint256);
    const binReverse = bin.slice().reverse();
    t.deepEqual(binToBigIntUintBE(binReverse), binToBigIntUintLE(bin));
  }
);

testProp(
  '[fast-check] bigIntToBinUintLE <-> binToBigIntUintLE',
  [fc.bigUintN(65)],
  (t, uint65) =>
    t.deepEqual(binToBigIntUintLE(bigIntToBinUintLE(uint65)), uint65)
);

test('binToBigIntUint64LE', (t) => {
  t.deepEqual(
    binToBigIntUint64LE(Uint8Array.from([0x78, 0x56, 0x34, 0x12, 0, 0, 0, 0])),
    BigInt(0x12345678)
  );
  const data = Uint8Array.from([0x90, 0x78, 0x56, 0x34, 0x12, 0, 0, 0, 0, 0]);
  const view = data.subarray(2);
  t.deepEqual(binToBigIntUint64LE(view), BigInt(0x123456));
});

test('readBitcoinVarInt: offset is optional', (t) => {
  t.deepEqual(readBitcoinVarInt(hexToBin('00')), {
    nextOffset: 1,
    value: BigInt(0x00),
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
    value,
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
  (t, uint64) => {
    const varInt = bigIntToBitcoinVarInt(uint64);
    const expectedOffset = varIntPrefixToSize(varInt[0]);
    const result = readBitcoinVarInt(varInt);
    t.deepEqual(result, { nextOffset: expectedOffset, value: uint64 });
  }
);
