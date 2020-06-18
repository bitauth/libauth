/* eslint-disable functional/no-expression-statement */
import test from 'ava';

import { reduceScript, stringify } from '../../lib';

test('reduceScript: does not throw on empty array', (t) => {
  const reduced = reduceScript([]);
  t.deepEqual(
    reduced,
    {
      bytecode: Uint8Array.of(),
      range: {
        endColumn: 0,
        endLineNumber: 0,
        startColumn: 0,
        startLineNumber: 0,
      },
      script: [],
    },
    stringify(reduced)
  );
});

test('reduceScript: resolution error', (t) => {
  const reduced = reduceScript([
    {
      range: {
        endColumn: 8,
        endLineNumber: 1,
        startColumn: 1,
        startLineNumber: 1,
      },
      type: 'error',
      value: 'Unknown identifier "unknown".',
    },
  ]);
  t.deepEqual(
    reduced,
    {
      bytecode: Uint8Array.of(),
      errors: [
        {
          error:
            'Tried to reduce a BTL script with resolution errors: Unknown identifier "unknown".',
          range: {
            endColumn: 8,
            endLineNumber: 1,
            startColumn: 1,
            startLineNumber: 1,
          },
        },
      ],
      range: {
        endColumn: 8,
        endLineNumber: 1,
        startColumn: 1,
        startLineNumber: 1,
      },
      script: [
        {
          bytecode: Uint8Array.of(),
          errors: [
            {
              error:
                'Tried to reduce a BTL script with resolution errors: Unknown identifier "unknown".',
              range: {
                endColumn: 8,
                endLineNumber: 1,
                startColumn: 1,
                startLineNumber: 1,
              },
            },
          ],
          range: {
            endColumn: 8,
            endLineNumber: 1,
            startColumn: 1,
            startLineNumber: 1,
          },
        },
      ],
    },
    stringify(reduced)
  );
});

test('reduceScript: invalid ResolvedScript', (t) => {
  t.throws(() =>
    reduceScript([
      {
        range: {
          endColumn: 2,
          endLineNumber: 1,
          startColumn: 1,
          startLineNumber: 1,
        },
        type: "uncaught because the consumer isn't using TypeScript" as 'error',
        value: 'Another kind of value',
      },
    ])
  );
});
