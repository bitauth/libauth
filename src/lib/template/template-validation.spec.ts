/* eslint-disable functional/no-expression-statement */
import test, { Macro } from 'ava';

import { stringify, validateAuthenticationTemplate } from '../lib';

const testValidation: Macro<[
  unknown,
  ReturnType<typeof validateAuthenticationTemplate>
]> = (t, input, expected) => {
  const result = validateAuthenticationTemplate(input);
  t.deepEqual(result, expected, stringify(result));
};

// eslint-disable-next-line functional/immutable-data
testValidation.title = (title) =>
  `validateAuthenticationTemplate: ${title ?? '?'}`;

test(
  'must be an object',
  testValidation,
  'a string',
  'A valid AuthenticationTemplate must be an object.'
);

test(
  'must be version 0',
  testValidation,
  { version: 1 },
  'Only version 0 authentication templates are currently supported.'
);
