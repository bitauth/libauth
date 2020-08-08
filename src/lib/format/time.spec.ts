/* eslint-disable functional/no-expression-statement, @typescript-eslint/no-magic-numbers */
import test from 'ava';
import { fc, testProp } from 'ava-fast-check';

import {
  dateToLocktime,
  dateToLocktimeBin,
  hexToBin,
  LocktimeError,
  locktimeToDate,
  maximumLocktimeDate,
  maximumLocktimeTimestamp,
  minimumLocktimeDate,
  minimumLocktimeTimestamp,
  parseLocktimeBin,
} from '../lib';

test('dateToLocktime', (t) => {
  t.deepEqual(dateToLocktime(new Date('2019-10-13')), 1570924800);
  t.deepEqual(
    dateToLocktime(new Date('2107-01-01')),
    LocktimeError.dateOutOfRange
  );
});

test('dateToLocktimeBin', (t) => {
  t.deepEqual(dateToLocktimeBin(new Date('2019-10-13')), hexToBin('0069a25d'));
  t.deepEqual(
    dateToLocktimeBin(new Date('2107-01-01')),
    LocktimeError.dateOutOfRange
  );
});

test('parseLockTime', (t) => {
  t.deepEqual(parseLocktimeBin(hexToBin('0069a25d')), new Date('2019-10-13'));
  t.deepEqual(parseLocktimeBin(hexToBin('d090371c')), 473403600);
  t.deepEqual(parseLocktimeBin(hexToBin('')), LocktimeError.incorrectLength);
  t.deepEqual(parseLocktimeBin(hexToBin('00')), LocktimeError.incorrectLength);
  t.deepEqual(
    parseLocktimeBin(hexToBin('0000000000')),
    LocktimeError.incorrectLength
  );
});

testProp(
  '[fast-check] dateToLocktime <-> locktimeToDate',
  [fc.integer(minimumLocktimeTimestamp, maximumLocktimeTimestamp)],
  (t, timestamp) =>
    t.deepEqual(dateToLocktime(locktimeToDate(timestamp) as Date), timestamp)
);

testProp(
  '[fast-check] dateToLocktimeBin <-> parseLocktimeBin',
  [fc.date({ max: maximumLocktimeDate, min: minimumLocktimeDate })],
  (t, date) => {
    const withSecondResolution = new Date(
      Math.round(date.getTime() / 1000) * 1000
    );
    t.deepEqual(
      (parseLocktimeBin(
        dateToLocktimeBin(withSecondResolution) as Uint8Array
      ) as Date).getTime(),
      withSecondResolution.getTime()
    );
  }
);
