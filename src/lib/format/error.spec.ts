import test from 'ava';

import {
  assertSuccess,
  binToHex,
  decodeCashAddress,
  formatError,
  unknownValue,
} from '../lib.js';

const enum TestConstEnum {
  one = 'TestConstEnum one.',
}
enum TestEnum {
  one = 'TestEnum one.',
}

test('formatError', (t) => {
  t.deepEqual(
    formatError(TestConstEnum.one, 'More text.'),
    'TestConstEnum one. More text.',
  );
  t.deepEqual(formatError(TestEnum.one, 'More.'), 'TestEnum one. More.');
  t.deepEqual(formatError('Anything.'), 'Anything.');
  t.deepEqual(formatError('Anything.', 'Details.'), 'Anything. Details.');
});

test('unknownValue', (t) => {
  const val = 'something' as never;
  t.throws(
    () => {
      unknownValue(val);
    },
    {
      message:
        'Received an unknown value; this should have been caught by TypeScript - are your types correct? something',
    },
  );
});

test('assertSuccess', (t) => {
  const resultError = 'error' as Uint8Array | string;
  const resultSuccess = Uint8Array.of(0) as Uint8Array | string;
  t.throws(
    () => {
      assertSuccess(resultError);
    },
    {
      message: 'Expected a successful result, but encountered an error: error',
    },
  );
  const unwrapped: Uint8Array = assertSuccess(resultSuccess);
  t.deepEqual(unwrapped, Uint8Array.of(0));
  t.throws(
    () => {
      assertSuccess(resultError, 'Custom prefix: ');
    },
    {
      message: 'Custom prefix: error',
    },
  );
});

test('assertSuccess (tsdoc example)', (t) => {
  const address = 'bitcoincash:zq2azmyyv6dtgczexyalqar70q036yund5j2mspghf';
  const decoded = decodeCashAddress(address);
  const tokenAddress = assertSuccess(decoded);
  t.deepEqual(
    binToHex(tokenAddress.payload),
    '15d16c84669ab46059313bf0747e781f1d13936d',
  );
});
