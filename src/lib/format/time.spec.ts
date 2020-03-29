/* eslint-disable functional/no-expression-statement, @typescript-eslint/no-magic-numbers */
import test from 'ava';
import { fc, testProp } from 'ava-fast-check';

import {
  dateToLocktime,
  hexToBin,
  LocktimeError,
  maximumLocktimeDate,
  minimumLocktimeDate,
  parseLocktime,
} from '../lib';

test('dateToLockTime', (t) => {
  t.deepEqual(dateToLocktime(new Date('2019-10-13')), hexToBin('0069a25d'));
  t.deepEqual(dateToLocktime(new Date('2107-01-01')), LocktimeError.outOfRange);
});

test('parseLockTime', (t) => {
  t.deepEqual(parseLocktime(hexToBin('0069a25d')), new Date('2019-10-13'));
  t.deepEqual(parseLocktime(hexToBin('d090371c')), 473403600);
  t.deepEqual(parseLocktime(hexToBin('')), LocktimeError.incorrectLength);
  t.deepEqual(parseLocktime(hexToBin('00')), LocktimeError.incorrectLength);
  t.deepEqual(
    parseLocktime(hexToBin('0000000000')),
    LocktimeError.incorrectLength
  );
});

testProp(
  '[fast-check] dateToLockTime <-> parseLockTime',
  [fc.date({ max: maximumLocktimeDate, min: minimumLocktimeDate })],
  (date) => {
    const withSecondResolution = new Date(
      Math.round(date.getTime() / 1000) * 1000
    );
    return (
      (parseLocktime(
        dateToLocktime(withSecondResolution) as Uint8Array
      ) as Date).getTime() === withSecondResolution.getTime()
    );
  }
);
