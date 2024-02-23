import test from 'ava';

import { formatError, unknownValue } from '../lib.js';

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
  t.throws(() => {
    unknownValue(val);
  });
});
