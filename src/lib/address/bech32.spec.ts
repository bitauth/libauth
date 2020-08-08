/* eslint-disable functional/no-expression-statement, @typescript-eslint/no-magic-numbers */
import test from 'ava';
import { testProp } from 'ava-fast-check';
import * as fc from 'fast-check';

import {
  Bech32DecodingError,
  bech32PaddedToBin,
  binToBech32Padded,
  binToUtf8,
  BitRegroupingError,
  decodeBech32,
  encodeBech32,
  isBech32CharacterSet,
  regroupBits,
} from '../lib';

test('regroupBits', (t) => {
  t.deepEqual(
    regroupBits({
      bin: [0b11111111, 0b11111111],
      resultWordLength: 1,
      sourceWordLength: 8,
    }),
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
  );
  t.deepEqual(
    regroupBits({
      bin: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      resultWordLength: 8,
      sourceWordLength: 1,
    }),
    [0b11111111, 0b11111111]
  );
  t.deepEqual(
    regroupBits({
      bin: [0b11111111, 0b11111111],
      resultWordLength: 2,
      sourceWordLength: 8,
    }),
    [0b11, 0b11, 0b11, 0b11, 0b11, 0b11, 0b11, 0b11]
  );
  t.deepEqual(
    regroupBits({
      bin: [0b11, 0b11, 0b11, 0b11, 0b11, 0b11, 0b11, 0b11],
      resultWordLength: 8,
      sourceWordLength: 2,
    }),
    [0b11111111, 0b11111111]
  );
  t.deepEqual(
    regroupBits({
      bin: [0b11111111, 0b11111111],
      resultWordLength: 3,
      sourceWordLength: 8,
    }),
    [0b111, 0b111, 0b111, 0b111, 0b111, 0b100]
  );
  t.deepEqual(
    regroupBits({
      bin: [0b111, 0b111, 0b111, 0b111, 0b111, 0b100],
      resultWordLength: 8,
      sourceWordLength: 3,
    }),
    /**
     * The 2 padding bit are now considered significant, so we have to add
     * padding to encode them.
     */
    [0b11111111, 0b11111111, 0b00]
  );
  t.deepEqual(
    regroupBits({
      bin: [0b11111111, 0b11111111],
      resultWordLength: 4,
      sourceWordLength: 8,
    }),
    [0b1111, 0b1111, 0b1111, 0b1111]
  );
  t.deepEqual(
    regroupBits({
      bin: [0b1111, 0b1111, 0b1111, 0b1111],
      resultWordLength: 8,
      sourceWordLength: 4,
    }),
    [0b11111111, 0b11111111]
  );
  t.deepEqual(
    regroupBits({
      bin: [0b11111111, 0b11111111],
      resultWordLength: 5,
      sourceWordLength: 8,
    }),
    [0b11111, 0b11111, 0b11111, 0b10000]
  );
  t.deepEqual(
    regroupBits({
      bin: [0b11111, 0b11111, 0b11111, 0b10000],
      resultWordLength: 8,
      sourceWordLength: 5,
    }),
    [0b11111111, 0b11111111, 0b0000]
  );
  t.deepEqual(
    regroupBits({
      bin: [0b11111111, 0b11111111],
      resultWordLength: 6,
      sourceWordLength: 8,
    }),
    [0b111111, 0b111111, 0b111100]
  );
  t.deepEqual(
    regroupBits({
      bin: [0b111111, 0b111111, 0b111100],
      resultWordLength: 8,
      sourceWordLength: 6,
    }),
    [0b11111111, 0b11111111, 0b00]
  );
  t.deepEqual(
    regroupBits({
      bin: [0b11111111, 0b11111111],
      resultWordLength: 7,
      sourceWordLength: 8,
    }),
    [0b1111111, 0b1111111, 0b1100000]
  );
  t.deepEqual(
    regroupBits({
      bin: [0b1111111, 0b1111111, 0b1100000],
      resultWordLength: 8,
      sourceWordLength: 7,
    }),
    [0b11111111, 0b11111111, 0b00000]
  );
  t.deepEqual(
    regroupBits({
      bin: [0b11111111, 0b11111111],
      resultWordLength: 8,
      sourceWordLength: 8,
    }),
    [0b11111111, 0b11111111]
  );
  t.deepEqual(
    regroupBits({
      bin: Uint8Array.from([0b11111111, 0b11111111]),
      resultWordLength: 8,
      sourceWordLength: 8,
    }),
    [0b11111111, 0b11111111]
  );
  t.deepEqual(
    regroupBits({ bin: [256], resultWordLength: 5, sourceWordLength: 8 }),
    BitRegroupingError.integerOutOfRange
  );
  t.deepEqual(
    regroupBits({
      allowPadding: false,
      bin: [0b11111, 0b11111, 0b11111, 0b10001],
      resultWordLength: 8,
      sourceWordLength: 5,
    }),
    BitRegroupingError.requiresDisallowedPadding
  );
  t.deepEqual(
    regroupBits({
      allowPadding: false,
      /**
       * `tf`
       */
      bin: [11, 9],
      resultWordLength: 8,
      sourceWordLength: 5,
    }),
    BitRegroupingError.requiresDisallowedPadding
  );
  t.deepEqual(
    regroupBits({
      allowPadding: false,
      bin: [0b00000],
      resultWordLength: 8,
      sourceWordLength: 5,
    }),
    BitRegroupingError.hasDisallowedPadding
  );
});

test('isBech32CharacterSet', (t) => {
  t.deepEqual(isBech32CharacterSet(''), true);
  t.deepEqual(isBech32CharacterSet('qq'), true);
  // cspell: disable-next-line
  t.deepEqual(isBech32CharacterSet('qpzry9x8gf2tvdw0s3jn54khce6mua7l'), true);
  t.deepEqual(isBech32CharacterSet('1u'), false);
  // cspell: disable-next-line
  t.deepEqual(isBech32CharacterSet(':qqqsyqc'), false);
});

test('decodeBech32', (t) => {
  t.deepEqual(decodeBech32(''), []);
  t.deepEqual(decodeBech32('qq'), [0, 0]);
  t.deepEqual(decodeBech32('qqq'), [0, 0, 0]);
  t.deepEqual(decodeBech32('qqqq'), [0, 0, 0, 0]);
  t.deepEqual(
    // cspell: disable-next-line
    decodeBech32('qpzry9x8gf2tvdw0s3jn54khce6mua7l'),
    // prettier-ignore
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31]
  );
});

test('encodeBech32', (t) => {
  t.deepEqual(encodeBech32([]), '');
  t.deepEqual(encodeBech32([0, 0]), 'qq');
  t.deepEqual(encodeBech32([0, 0, 0]), 'qqq');
  t.deepEqual(encodeBech32([0, 0, 0, 0]), 'qqqq');
  t.deepEqual(
    // prettier-ignore
    encodeBech32([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31]),
    // cspell: disable-next-line
    'qpzry9x8gf2tvdw0s3jn54khce6mua7l'
  );
});

test('binToBech32Padded', (t) => {
  t.deepEqual(binToBech32Padded(Uint8Array.of(0)), 'qq');
  t.deepEqual(binToBech32Padded(Uint8Array.of(255)), 'lu');
  // cspell: disable-next-line
  t.deepEqual(binToBech32Padded(Uint8Array.of(0, 1, 2, 3)), 'qqqsyqc');
});

test('bech32PaddedToBin', (t) => {
  t.deepEqual(
    bech32PaddedToBin('qqq'),
    BitRegroupingError.hasDisallowedPadding
  );
  t.deepEqual(bech32PaddedToBin('qq'), Uint8Array.of(0));
  t.deepEqual(
    bech32PaddedToBin('tf'),
    BitRegroupingError.requiresDisallowedPadding
  );
  t.deepEqual(bech32PaddedToBin('lu'), Uint8Array.of(255));
  // cspell: disable-next-line
  t.deepEqual(bech32PaddedToBin('qqqsyqc'), Uint8Array.of(0, 1, 2, 3));
  t.deepEqual(
    bech32PaddedToBin('qqq1'),
    Bech32DecodingError.notBech32CharacterSet
  );
});

const max5BitNumber = 31;
const maxUint8Number = 255;
const fcUint8Array = (minLength: number, maxLength: number) =>
  fc
    .array(fc.integer(0, maxUint8Number), minLength, maxLength)
    .map((a) => Uint8Array.from(a));
const maxBinLength = 100;

testProp(
  '[fast-check] encodeBech32 <-> decodeBech32',
  [fc.array(fc.integer(0, max5BitNumber), 0, maxBinLength)],
  (t, input) => {
    t.deepEqual(decodeBech32(encodeBech32(input)), input);
  }
);

testProp(
  '[fast-check] bech32PaddedToBin <-> binToBech32Padded',
  [fcUint8Array(0, maxBinLength)],
  (t, input) => {
    t.deepEqual(
      binToBech32Padded(
        bech32PaddedToBin(binToBech32Padded(input)) as Uint8Array
      ),
      binToBech32Padded(input)
    );
  }
);

testProp(
  '[fast-check] binToBech32Padded -> isBech32',
  [fcUint8Array(0, maxBinLength)],
  (t, input) => t.true(isBech32CharacterSet(binToBech32Padded(input)))
);

testProp(
  '[fast-check] isBech32: matches round trip results',
  [fcUint8Array(0, maxBinLength)],
  (t, input) => {
    const maybeBech32 = binToUtf8(input);
    const tryBin = bech32PaddedToBin(maybeBech32);
    if (typeof tryBin === 'string') {
      // skip
      t.pass();
      return;
    }
    t.deepEqual(binToBech32Padded(tryBin), maybeBech32);
  }
);
