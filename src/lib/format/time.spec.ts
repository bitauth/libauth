import test from 'ava';
import { fc, testProp } from 'ava-fast-check';

import {
  dateToLocktime,
  dateToLocktimeBin,
  decodeLocktime,
  hexToBin,
  LocktimeError,
  locktimeToDate,
  maximumLocktimeDate,
  maximumLocktimeTimestamp,
  minimumLocktimeDate,
  minimumLocktimeTimestamp,
} from '../lib.js';

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
  t.deepEqual(decodeLocktime(hexToBin('0069a25d')), new Date('2019-10-13'));
  t.deepEqual(decodeLocktime(hexToBin('d090371c')), 473403600);
  t.deepEqual(decodeLocktime(hexToBin('')), LocktimeError.incorrectLength);
  t.deepEqual(decodeLocktime(hexToBin('00')), LocktimeError.incorrectLength);
  t.deepEqual(
    decodeLocktime(hexToBin('0000000000')),
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
  '[fast-check] dateToLocktimeBin <-> decodeLocktime',
  [fc.date({ max: maximumLocktimeDate, min: minimumLocktimeDate })],
  (t, date) => {
    const withSecondResolution = new Date(
      Math.round(date.getTime() / 1000) * 1000
    );
    t.deepEqual(
      (
        decodeLocktime(
          dateToLocktimeBin(withSecondResolution) as Uint8Array
        ) as Date
      ).getTime(),
      withSecondResolution.getTime()
    );
  }
);
