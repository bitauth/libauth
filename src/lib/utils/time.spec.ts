/* eslint-disable functional/no-expression-statement, @typescript-eslint/no-magic-numbers */
import test from 'ava';

import { ScriptNumberError } from '../auth/auth';

import { hexToBin } from './hex';
import { dateToLockTime, parseLockTime } from './time';

test('dateToLockTime', t => {
  t.deepEqual(dateToLockTime(new Date('2019-10-13')), hexToBin('0069a25d'));
});

test('parseLockTime', t => {
  t.deepEqual(parseLockTime(hexToBin('0069a25d')), new Date('2019-10-13'));
  t.deepEqual(parseLockTime(hexToBin('d090371c')), 473403600);
  t.deepEqual(
    parseLockTime(hexToBin('0000000000')),
    ScriptNumberError.outOfRange
  );
});

// TODO: upgrade fast-check
test.todo('dateToLockTime <-> parseLockTime');
