/* eslint-disable functional/no-expression-statement */
import test from 'ava';

import {
  BtlScriptSegment,
  IdentifierResolutionFunction,
  IdentifierResolutionType,
  parseScript,
  resolveScriptSegment,
} from '../../lib';

test('resolveScriptSegment: error on unrecognized parse results', (t) => {
  const segment = {
    end: {
      column: 24,
      line: 1,
      offset: 23,
    },
    name: 'Script',
    start: {
      column: 1,
      line: 1,
      offset: 0,
    },
    value: [
      {
        end: {
          column: 24,
          line: 1,
          offset: 23,
        },
        name: 'Unknown' as 'Identifier',
        start: {
          column: 1,
          line: 1,
          offset: 0,
        },
        value: 'unrecognized_expression',
      },
    ],
  } as BtlScriptSegment;
  t.deepEqual(
    resolveScriptSegment(segment, () => ({
      bytecode: Uint8Array.of(),
      status: true,
      type: IdentifierResolutionType.variable,
    })),
    [
      {
        range: {
          endColumn: 24,
          endLineNumber: 1,
          startColumn: 1,
          startLineNumber: 1,
        },
        type: 'error',
        value: 'Unrecognized segment: Unknown',
      },
    ]
  );
});

test('resolveScriptSegment: marks unknown identifier types', (t) => {
  const parseResult = parseScript('some_identifier');
  if (!parseResult.status) {
    t.fail('Parse failed.');
    return;
  }
  const malformedResolver: IdentifierResolutionFunction = () => ({
    bytecode: Uint8Array.of(),
    status: true,
    type: 'unknown-type' as IdentifierResolutionType.variable,
  });
  const resolved = resolveScriptSegment(parseResult.value, malformedResolver);
  t.deepEqual(resolved, [
    {
      range: {
        endColumn: 16,
        endLineNumber: 1,
        startColumn: 1,
        startLineNumber: 1,
      },
      type: 'bytecode' as const,
      unknown: 'some_identifier',
      value: Uint8Array.of(),
    },
  ] as unknown);
});
