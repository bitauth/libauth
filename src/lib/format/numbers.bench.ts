/* eslint-disable functional/no-let, @typescript-eslint/init-declarations, functional/no-expression-statement */

import { randomBytes } from 'crypto';

import test from 'ava';
import suite from 'chuhai';

import {
  bigIntToBinUint64LE,
  bigIntToBinUint64LEClamped,
  binToBigIntUint64LE,
  binToBigIntUintBE,
  binToHex,
  binToNumberUint16LE,
  binToNumberUint32LE,
  numberToBinUint16LE,
  numberToBinUint16LEClamped,
  numberToBinUint32LE,
  numberToBinUint32LEClamped,
} from '../lib';

test(`node: binToBigIntUintBE vs. binToHex -> BigInt()`, async (t) => {
  await suite(t.title, (s) => {
    let sourceBin: Uint8Array;
    let num: BigInt;
    let result: BigInt;

    const nextCycle = () => {
      const uint256Length = 32;
      sourceBin = Uint8Array.from(randomBytes(uint256Length));
      num = binToBigIntUintBE(sourceBin);
    };
    nextCycle();

    s.bench('binToBigIntUintBE', () => {
      result = binToBigIntUintBE(sourceBin);
    });
    s.bench('binToHex -> BigInt()', () => {
      result = BigInt(`0x${binToHex(sourceBin)}`);
    });

    s.cycle(() => {
      t.deepEqual(result, num);
      nextCycle();
    });
  });
});

test(`node: numberToBinUint16LE vs. numberToBinUint16LEClamped`, async (t) => {
  await suite(t.title, (s) => {
    let expectedBin: Uint8Array;
    let num: number;
    let resultBin: Uint8Array;

    const nextCycle = () => {
      const uint16Length = 2;
      expectedBin = Uint8Array.from(randomBytes(uint16Length));
      num = binToNumberUint16LE(expectedBin);
    };
    nextCycle();

    s.bench('numberToBinUint16LE', () => {
      resultBin = numberToBinUint16LE(num);
    });
    s.bench('numberToBinUint16LEClamped', () => {
      resultBin = numberToBinUint16LEClamped(num);
    });

    s.cycle(() => {
      t.deepEqual(resultBin, expectedBin);
      nextCycle();
    });
  });
});

test(`node: numberToBinUint32LE vs. numberToBinUint32LEClamped`, async (t) => {
  await suite(t.title, (s) => {
    let expectedBin: Uint8Array;
    let num: number;
    let resultBin: Uint8Array;

    const nextCycle = () => {
      const uint32Length = 4;
      expectedBin = Uint8Array.from(randomBytes(uint32Length));
      num = binToNumberUint32LE(expectedBin);
    };
    nextCycle();

    s.bench('numberToBinUint32LE', () => {
      resultBin = numberToBinUint32LE(num);
    });
    s.bench('numberToBinUint32LEClamped', () => {
      resultBin = numberToBinUint32LEClamped(num);
    });

    s.cycle(() => {
      t.deepEqual(resultBin, expectedBin);
      nextCycle();
    });
  });
});

test(`node: bigIntToBinUint64LE vs. bigIntToBinUint64LEClamped`, async (t) => {
  await suite(t.title, (s) => {
    let expectedBin: Uint8Array;
    let num: bigint;
    let resultBin: Uint8Array;

    const nextCycle = () => {
      const uint64Length = 8;
      expectedBin = Uint8Array.from(randomBytes(uint64Length));
      num = binToBigIntUint64LE(expectedBin);
    };
    nextCycle();

    s.bench('bigIntToBinUint64LE', () => {
      resultBin = bigIntToBinUint64LE(num);
    });
    s.bench('bigIntToBinUint64LEClamped', () => {
      resultBin = bigIntToBinUint64LEClamped(num);
    });

    s.cycle(() => {
      t.deepEqual(resultBin, expectedBin);
      nextCycle();
    });
  });
});
