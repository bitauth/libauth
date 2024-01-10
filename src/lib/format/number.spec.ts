import test from 'ava';

import {
  bigIntToBinUint256BEClamped,
  bigIntToBinUint64LE,
  bigIntToBinUint64LEClamped,
  bigIntToBinUintLE,
  bigIntToCompactUint,
  binToBigIntUint256BE,
  binToBigIntUint64LE,
  binToBigIntUintBE,
  binToBigIntUintLE,
  binToHex,
  binToNumberInt16LE,
  binToNumberInt32LE,
  binToNumberUint16LE,
  binToNumberUint32LE,
  binToNumberUintLE,
  CompactUintError,
  compactUintPrefixToSize,
  compactUintToBigInt,
  hexToBin,
  int32SignedToUnsigned,
  int32UnsignedToSigned,
  numberToBinInt16LE,
  numberToBinInt32LE,
  numberToBinInt32TwosCompliment,
  numberToBinUint16BE,
  numberToBinUint16LE,
  numberToBinUint16LEClamped,
  numberToBinUint32BE,
  numberToBinUint32LE,
  numberToBinUint32LEClamped,
  numberToBinUintLE,
  readCompactUint,
  readCompactUintMinimal,
} from '../lib.js';

import { fc, testProp } from '@fast-check/ava';

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
    numberToBinUint16LE(0x01_0000 % (0xffff + 1)),
  );
  t.deepEqual(
    numberToBinUint16LEClamped(0x01_0000),
    Uint8Array.from([0xff, 0xff]),
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
    Uint8Array.from([0x78, 0x56, 0x34, 0x12]),
  );
});

test('numberToBinUint32BE', (t) => {
  t.deepEqual(numberToBinUint32BE(0), Uint8Array.from([0, 0, 0, 0]));
  t.deepEqual(numberToBinUint32BE(1), Uint8Array.from([0, 0, 0, 1]));
  t.deepEqual(numberToBinUint32BE(0x1234), Uint8Array.from([0, 0, 0x12, 0x34]));
  t.deepEqual(
    numberToBinUint32BE(0x12345678),
    Uint8Array.from([0x12, 0x34, 0x56, 0x78]),
  );
});

test('numberToBinUint32LE vs. numberToBinUint32LEClamped: behavior on overflow', (t) => {
  t.deepEqual(
    numberToBinUint32LE(0x01_0000_0000),
    numberToBinUint32LE(0x01_0000_0000 % (0xffffffff + 1)),
  );
  t.deepEqual(
    numberToBinUint32LEClamped(0x01_0000_0000),
    Uint8Array.from([0xff, 0xff, 0xff, 0xff]),
  );
});

test('numberToBinUint32LE: behavior on negative numbers', (t) => {
  t.deepEqual(numberToBinUint32LE(-2), numberToBinUint32LE(0xffffffff - 1));
  t.deepEqual(numberToBinUint32LEClamped(-2), Uint8Array.from([0, 0, 0, 0]));
});

test('numberToBinUintLE', (t) => {
  t.deepEqual(
    numberToBinUintLE(Number.MAX_SAFE_INTEGER),
    Uint8Array.from([255, 255, 255, 255, 255, 255, 31]),
  );
});

test('numberToBinInt16LE', (t) => {
  t.deepEqual(numberToBinInt16LE(0), Uint8Array.from([0, 0]));
  t.deepEqual(numberToBinInt16LE(1), Uint8Array.from([1, 0]));
  t.deepEqual(numberToBinInt16LE(0x1234), Uint8Array.from([0x34, 0x12]));
  t.deepEqual(numberToBinInt16LE(-0x1234), Uint8Array.from([0xcc, 0xed]));
});

test('numberToBinInt32LE', (t) => {
  t.deepEqual(numberToBinInt32LE(0), Uint8Array.from([0, 0, 0, 0]));
  t.deepEqual(numberToBinInt32LE(1), Uint8Array.from([1, 0, 0, 0]));
  t.deepEqual(numberToBinInt32LE(0x1234), Uint8Array.from([0x34, 0x12, 0, 0]));
  t.deepEqual(
    numberToBinInt32LE(-0x1234),
    Uint8Array.from([0xcc, 0xed, 0xff, 0xff]),
  );
  t.deepEqual(
    numberToBinUint32LE(0x12345678),
    Uint8Array.from([0x78, 0x56, 0x34, 0x12]),
  );
  t.deepEqual(
    numberToBinInt32LE(-0x12345678),
    Uint8Array.from([0x88, 0xa9, 0xcb, 0xed]),
  );
});

test('numberToBinInt32TwosCompliment', (t) => {
  t.deepEqual(numberToBinInt32TwosCompliment(0), Uint8Array.from([0, 0, 0, 0]));
  t.deepEqual(numberToBinInt32TwosCompliment(1), Uint8Array.from([1, 0, 0, 0]));
  t.deepEqual(
    numberToBinInt32TwosCompliment(-0xffffffff),
    Uint8Array.from([1, 0, 0, 0]),
  );
  t.deepEqual(
    numberToBinInt32TwosCompliment(0xffffffff),
    Uint8Array.from([255, 255, 255, 255]),
  );
  t.deepEqual(
    numberToBinInt32TwosCompliment(-1),
    Uint8Array.from([255, 255, 255, 255]),
  );
  t.deepEqual(
    numberToBinInt32TwosCompliment(0xffff),
    Uint8Array.from([255, 255, 0, 0]),
  );
  t.deepEqual(
    numberToBinInt32TwosCompliment(-0xffff),
    Uint8Array.from([1, 0, 255, 255]),
  );
  t.deepEqual(
    numberToBinInt32TwosCompliment(1234567890),
    Uint8Array.from([210, 2, 150, 73]),
  );
  t.deepEqual(
    numberToBinInt32TwosCompliment(-1234567890),
    Uint8Array.from([46, 253, 105, 182]),
  );
});

test('bigIntToBinUint64LE', (t) => {
  t.deepEqual(
    bigIntToBinUint64LE(0n),
    Uint8Array.from([0, 0, 0, 0, 0, 0, 0, 0]),
  );
  t.deepEqual(
    bigIntToBinUint64LE(0x01n),
    Uint8Array.from([0x01, 0, 0, 0, 0, 0, 0, 0]),
  );
  t.deepEqual(
    bigIntToBinUint64LE(0x12345678n),
    Uint8Array.from([0x78, 0x56, 0x34, 0x12, 0, 0, 0, 0]),
  );
  t.deepEqual(
    bigIntToBinUint64LE(BigInt(Number.MAX_SAFE_INTEGER)),
    Uint8Array.from([255, 255, 255, 255, 255, 255, 31, 0]),
  );
  t.deepEqual(
    bigIntToBinUint64LE(0xffffffffffffffffn),
    Uint8Array.from([255, 255, 255, 255, 255, 255, 255, 255]),
  );
});

test('bigIntToBinUint64LE vs. bigIntToBinUint64LEClamped: behavior on overflow', (t) => {
  t.deepEqual(
    bigIntToBinUint64LE(0x010000000000000000n),
    bigIntToBinUint64LE(0x010000000000000000n % (0xffffffffffffffffn + 1n)),
  );
  t.deepEqual(
    bigIntToBinUint64LEClamped(0x010000000000000000n),
    Uint8Array.from([0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff]),
  );
});

test('bigIntToBinUint64LE vs. bigIntToBinUint64LEClamped: behavior on negative numbers', (t) => {
  t.deepEqual(
    bigIntToBinUint64LE(-1n),
    Uint8Array.from([0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff]),
  );
  t.deepEqual(
    bigIntToBinUint64LEClamped(-1n),
    Uint8Array.from([0, 0, 0, 0, 0, 0, 0, 0]),
  );
});

test('bigIntToCompactUint: larger values return modulo result after opcode', (t) => {
  t.deepEqual(
    bigIntToCompactUint(0x010000000000000001n),
    Uint8Array.from([0xff, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]),
  );
});

test('binToNumberUintLE', (t) => {
  t.deepEqual(binToNumberUintLE(Uint8Array.from([0x12])), 0x12);
  t.deepEqual(binToNumberUintLE(Uint8Array.from([0x34, 0x12])), 0x1234);
  t.deepEqual(
    binToNumberUintLE(Uint8Array.from([0x78, 0x56, 0x34, 0x12])),
    0x12345678,
  );
  t.deepEqual(
    binToNumberUintLE(Uint8Array.from([0x90, 0x78, 0x56, 0x34, 0x12])),
    0x1234567890,
  );
  t.deepEqual(
    binToNumberUintLE(Uint8Array.from([255, 255, 255, 255, 255, 255, 31])),
    Number.MAX_SAFE_INTEGER,
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
  [fc.integer({ max: Number.MAX_SAFE_INTEGER, min: 0 })],
  (t, maxSafeInt) =>
    t.deepEqual(binToNumberUintLE(numberToBinUintLE(maxSafeInt)), maxSafeInt),
);

test('binToNumberUint16LE', (t) => {
  t.deepEqual(binToNumberUint16LE(Uint8Array.from([0x34, 0x12])), 0x1234);
  const data = Uint8Array.from([0x90, 0x78, 0x56, 0x34, 0x12, 0x00]);
  const view = data.subarray(2, 4);
  t.deepEqual(binToNumberUint16LE(view), 0x3456);
});

test('binToNumberInt16LE', (t) => {
  t.deepEqual(binToNumberInt16LE(Uint8Array.from([0x34, 0x12])), 0x1234);
  t.deepEqual(binToNumberInt16LE(Uint8Array.from([0xcc, 0xed])), -0x1234);
});

test('binToNumberInt32LE', (t) => {
  t.deepEqual(
    binToNumberInt32LE(Uint8Array.from([0x78, 0x56, 0x34, 0x12])),
    0x12345678,
  );

  t.deepEqual(
    binToNumberInt32LE(Uint8Array.from([0x88, 0xa9, 0xcb, 0xed])),
    -0x12345678,
  );
});

test('binToNumberUint16LE: ignores bytes after the 2nd', (t) => {
  t.deepEqual(
    binToNumberUint16LE(Uint8Array.from([0x78, 0x56, 0x34, 0x12, 0xff])),
    0x5678,
  );
});

test('binToNumberUint32LE', (t) => {
  t.deepEqual(
    binToNumberUint32LE(Uint8Array.from([0x78, 0x56, 0x34, 0x12])),
    0x12345678,
  );
  const data = Uint8Array.from([0x90, 0x78, 0x56, 0x34, 0x12, 0x00]);
  const view = data.subarray(2);
  t.deepEqual(binToNumberUint32LE(view), 0x123456);
});

test('binToNumberUint32LE: ignores bytes after the 4th', (t) => {
  t.deepEqual(
    binToNumberUint32LE(Uint8Array.from([0x78, 0x56, 0x34, 0x12, 0xff])),
    0x12345678,
  );
});

test('binToBigIntUintBE', (t) => {
  t.deepEqual(binToBigIntUintBE(Uint8Array.from([0x12])), 0x12n);
  t.deepEqual(binToBigIntUintBE(Uint8Array.from([0x12, 0x34])), 0x1234n);
  t.deepEqual(
    binToBigIntUintBE(Uint8Array.from([0x12, 0x34, 0x56])),
    0x123456n,
  );
  t.deepEqual(
    binToBigIntUintBE(Uint8Array.from([0x12, 0x34, 0x56, 0x78])),
    0x12345678n,
  );
  t.deepEqual(
    binToBigIntUintBE(Uint8Array.from([0x12, 0x34, 0x56, 0x78, 0x90])),
    0x1234567890n,
  );
  t.deepEqual(
    binToBigIntUintBE(
      Uint8Array.from([0x12, 0x34, 0x56, 0x78, 0x90, 0xab, 0xcd, 0xef]),
    ),
    0x1234567890abcdefn,
  );
  t.deepEqual(
    binToBigIntUintBE(Uint8Array.from([0x56, 0x78, 0x90, 0xab, 0xcd, 0xef])),
    0x567890abcdefn,
  );
  const d = Uint8Array.from([0x12, 0x34, 0x56, 0x78, 0x90, 0xab, 0xcd, 0xef]);
  const view = d.subarray(2);
  t.deepEqual(binToBigIntUintBE(view), 0x567890abcdefn);
  t.throws(() => {
    binToBigIntUintBE(Uint8Array.of(0x12), 2);
  });
});

test('binToBigIntUint256BE and bigIntToBinUint256BEClamped', (t) => {
  t.deepEqual(binToBigIntUint256BE(new Uint8Array(32)), 0n);
  t.deepEqual(bigIntToBinUint256BEClamped(0n), new Uint8Array(32));
  t.deepEqual(bigIntToBinUint256BEClamped(-1n), new Uint8Array(32));
  const secp256k1OrderNHex =
    'fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141';
  const secp256k1OrderNBin = hexToBin(secp256k1OrderNHex);
  const secp256k1OrderN = BigInt(`0x${secp256k1OrderNHex}`);
  t.deepEqual(binToBigIntUint256BE(secp256k1OrderNBin), secp256k1OrderN);
  t.deepEqual(bigIntToBinUint256BEClamped(secp256k1OrderN), secp256k1OrderNBin);
  const max = new Uint8Array(32);
  max.fill(255);
  const overMax = new Uint8Array(33);

  overMax[0] = 255;
  t.deepEqual(
    bigIntToBinUint256BEClamped(BigInt(`0x${binToHex(overMax)}`)),
    max,
  );
});

testProp(
  '[fast-check] binToBigIntUint256BE <-> bigIntToBinUint256BEClamped',
  [fc.bigUintN(256)],
  (t, uint256) =>
    t.deepEqual(
      binToBigIntUint256BE(bigIntToBinUint256BEClamped(uint256)),
      uint256,
    ),
);

test('binToBigIntUintLE', (t) => {
  t.deepEqual(binToBigIntUintLE(Uint8Array.from([0x12])), 0x12n);
  t.deepEqual(binToBigIntUintLE(Uint8Array.from([0x34, 0x12])), 0x1234n);
  t.deepEqual(
    binToBigIntUintLE(Uint8Array.from([0x56, 0x34, 0x12])),
    0x123456n,
  );
  t.deepEqual(
    binToBigIntUintLE(Uint8Array.from([0x78, 0x56, 0x34, 0x12])),
    0x12345678n,
  );
  t.deepEqual(
    binToBigIntUintLE(Uint8Array.from([0x90, 0x78, 0x56, 0x34, 0x12])),
    0x1234567890n,
  );
  t.deepEqual(
    binToBigIntUintLE(
      Uint8Array.from([0xef, 0xcd, 0xab, 0x90, 0x78, 0x56, 0x34, 0x12]),
    ),
    0x1234567890abcdefn,
  );
  t.deepEqual(
    binToBigIntUintLE(Uint8Array.from([0xab, 0x90, 0x78, 0x56, 0x34, 0x12])),
    0x1234567890abn,
  );
  const d = Uint8Array.from([0xef, 0xcd, 0xab, 0x90, 0x78, 0x56, 0x34, 0x12]);
  const view = d.subarray(2);
  t.deepEqual(binToBigIntUintLE(view), 0x1234567890abn);
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
  },
);

testProp(
  '[fast-check] bigIntToBinUintLE <-> binToBigIntUintLE',
  [fc.bigUintN(65)],
  (t, uint65) =>
    t.deepEqual(binToBigIntUintLE(bigIntToBinUintLE(uint65)), uint65),
);

test('binToBigIntUint64LE', (t) => {
  t.deepEqual(
    binToBigIntUint64LE(Uint8Array.from([0x78, 0x56, 0x34, 0x12, 0, 0, 0, 0])),
    0x12345678n,
  );
  t.deepEqual(
    binToBigIntUint64LE(
      Uint8Array.from([0xef, 0xcd, 0xab, 0x89, 0x67, 0x45, 0x23, 0x01]),
    ),
    0x0123456789abcdefn,
  );
  t.deepEqual(
    binToBigIntUint64LE(
      Uint8Array.from([
        0xef, 0xcd, 0xab, 0x89, 0x67, 0x45, 0x23, 0x01, 0x00, 0x00,
      ]),
    ),
    0x0123456789abcdefn,
  );
  const data = Uint8Array.from([0x90, 0x78, 0x56, 0x34, 0x12, 0, 0, 0, 0, 0]);
  const view = data.subarray(2);
  t.deepEqual(binToBigIntUint64LE(view), 0x123456n);
  t.throws(() =>
    binToBigIntUint64LE(Uint8Array.from([0x78, 0x56, 0x34, 0x12])),
  );
});

test('compactUintPrefixToSize', (t) => {
  t.deepEqual(compactUintPrefixToSize(0), 1);
  t.deepEqual(compactUintPrefixToSize(252), 1);
  t.deepEqual(compactUintPrefixToSize(253), 3);
  t.deepEqual(compactUintPrefixToSize(254), 5);
  t.deepEqual(compactUintPrefixToSize(255), 9);
});

test('readCompactUint', (t) => {
  t.deepEqual(readCompactUint({ bin: Uint8Array.from([252]), index: 0 }), {
    position: { bin: Uint8Array.from([252]), index: 1 },
    result: 252n,
  });
  t.deepEqual(readCompactUint({ bin: Uint8Array.from([0]), index: 0 }), {
    position: { bin: Uint8Array.from([0]), index: 1 },
    result: 0n,
  });
  t.deepEqual(
    readCompactUint({ bin: Uint8Array.from([253, 0, 0]), index: 0 }),
    { position: { bin: Uint8Array.from([253, 0, 0]), index: 3 }, result: 0n },
  );
  t.deepEqual(
    readCompactUint({ bin: Uint8Array.from([254, 0, 0, 0, 0]), index: 0 }),
    {
      position: { bin: Uint8Array.from([254, 0, 0, 0, 0]), index: 5 },
      result: 0n,
    },
  );
  t.deepEqual(
    readCompactUint({
      bin: Uint8Array.from([255, 0, 0, 0, 0, 0, 0, 0, 0]),
      index: 0,
    }),
    {
      position: {
        bin: Uint8Array.from([255, 0, 0, 0, 0, 0, 0, 0, 0]),
        index: 9,
      },
      result: 0n,
    },
  );
  t.deepEqual(
    readCompactUint({ bin: Uint8Array.from([253, 253, 0]), index: 0 }),
    {
      position: { bin: Uint8Array.from([253, 253, 0]), index: 3 },
      result: 253n,
    },
  );
  t.deepEqual(
    readCompactUint({ bin: Uint8Array.from([]), index: 0 }),
    CompactUintError.noPrefix,
  );
});

test('readCompactUintMinimal', (t) => {
  t.deepEqual(readCompactUintMinimal({ bin: Uint8Array.from([1]), index: 0 }), {
    position: { bin: Uint8Array.from([1]), index: 1 },
    result: 1n,
  });
  t.deepEqual(
    readCompactUintMinimal({ bin: Uint8Array.from([253, 1, 0]), index: 0 }),
    `${CompactUintError.nonMinimal} Value: 1, encoded length: 3, canonical length: 1`,
  );
});

test('compactUintToBigInt', (t) => {
  t.deepEqual(compactUintToBigInt(Uint8Array.from([252])), 252n);
  t.deepEqual(compactUintToBigInt(Uint8Array.from([253, 253, 0])), 253n);
  t.deepEqual(
    compactUintToBigInt(Uint8Array.from([253])),
    'Error reading CompactUint: insufficient bytes. CompactUint prefix 253 requires at least 3 bytes. Remaining bytes: 1',
  );
  t.deepEqual(
    compactUintToBigInt(Uint8Array.from([253, 0, 254, 0])),
    'Error decoding CompactUint: unexpected bytes after CompactUint. CompactUint ends at index 3, but input includes 4 bytes.',
  );
});

const compactUintVector = test.macro<
  [string, bigint, number, number?, string?]
>({
  // eslint-disable-next-line @typescript-eslint/max-params
  exec: (t, hex, value, nextIndex, start = 0, expected = hex) => {
    t.deepEqual(readCompactUint({ bin: hexToBin(hex), index: start }), {
      position: { bin: hexToBin(hex), index: nextIndex },
      result: value,
    });
    t.deepEqual(bigIntToCompactUint(value), hexToBin(expected));
  },
  title: (_, string) => `compactUintToBigInt/bigIntToCompactUint: ${string}`,
});

/* spell-checker: disable */
test(compactUintVector, '00', 0x00n, 1);
test(compactUintVector, '01', 0x01n, 1);
test(compactUintVector, '12', 0x12n, 1);
test(compactUintVector, '6a', 0x6an, 1);
test(compactUintVector, '00006a', 0x6an, 3, 2, '6a');
test(compactUintVector, 'fc', 0xfcn, 1);
test(compactUintVector, 'fdfd00', 0x00fdn, 3);
test(compactUintVector, '000000fdfd00', 0xfdn, 6, 3, 'fdfd00');
test(compactUintVector, 'fdfe00', 0x00fen, 3);
test(compactUintVector, 'fdff00', 0x00ffn, 3);
test(compactUintVector, 'fd1111', 0x1111n, 3);
test(compactUintVector, 'fd1234', 0x3412n, 3);
test(compactUintVector, 'fdfeff', 0xfffen, 3);
test(compactUintVector, 'fdffff', 0xffffn, 3);
test(compactUintVector, 'fe00000100', 0x010000n, 5);
test(compactUintVector, '00fe00000100', 0x010000n, 6, 1, 'fe00000100');
test(compactUintVector, 'fe01000100', 0x010001n, 5);
test(compactUintVector, 'fe11111111', 0x11111111n, 5);
test(compactUintVector, 'fe12345678', 0x78563412n, 5);
test(compactUintVector, 'feffffffff', 0xffffffffn, 5);
test(compactUintVector, 'ff0000000001000000', 0x0100000000n, 9);
/* spell-checker: enable */

test(
  compactUintVector,
  '0000ff0000000001000000',
  0x0100000000n,
  11,
  2,
  'ff0000000001000000',
);
test(compactUintVector, 'ff0100000001000000', 0x0100000001n, 9);
test(compactUintVector, 'ff1111111111111111', 0x1111111111111111n, 9);
test(compactUintVector, 'ff1234567890abcdef', 0xefcdab9078563412n, 9);

testProp(
  '[fast-check] bigIntToCompactUint <-> compactUintToBigInt',
  [fc.bigUintN(64)],
  (t, uint64) => {
    const compactUint = bigIntToCompactUint(uint64);
    const result = compactUintToBigInt(compactUint);
    t.deepEqual(result, uint64);
  },
);

test('int32SignedToUnsigned/int32UnsignedToSigned', (t) => {
  t.deepEqual(int32SignedToUnsigned(1), 1);
  t.deepEqual(int32SignedToUnsigned(-1), 4294967295);
  t.deepEqual(int32SignedToUnsigned(-2), 4294967294);
  t.deepEqual(int32UnsignedToSigned(4294967294), -2);
  t.deepEqual(int32UnsignedToSigned(4294967295), -1);
  t.deepEqual(int32UnsignedToSigned(1), 1);
});

testProp(
  '[fast-check] int32UnsignedToSigned <-> int32SignedToUnsigned',
  [fc.integer({ max: 2 ** 32 - 1, min: 0 })],
  (t, uint32) => {
    const signed = int32UnsignedToSigned(uint32);
    const unsigned = int32SignedToUnsigned(signed);
    t.deepEqual(unsigned, uint32);
  },
);
