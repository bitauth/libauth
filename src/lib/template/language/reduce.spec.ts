/* eslint-disable functional/no-expression-statement, @typescript-eslint/no-magic-numbers */
import test, { Macro } from 'ava';

import {
  aggregatedParseReductionTraceNodes,
  AuthenticationErrorBCH,
  AuthenticationInstruction,
  AuthenticationProgramBCH,
  AuthenticationProgramStateBCH,
  AuthenticationVirtualMachine,
  compileScript,
  createAuthenticationProgramExternalStateCommonEmpty,
  createAuthenticationProgramStateCommon,
  instantiateVirtualMachineBCH,
  mergeRanges,
  OpcodesBCH,
  reduceScript,
  ResolvedScript,
  sampledEvaluateReductionTraceNodes,
  stringify,
} from '../../lib';

test('mergeRanges', (t) => {
  t.deepEqual(
    mergeRanges([
      { endColumn: 3, endLineNumber: 1, startColumn: 0, startLineNumber: 1 },
      { endColumn: 1, endLineNumber: 3, startColumn: 6, startLineNumber: 0 },
    ]),
    { endColumn: 1, endLineNumber: 3, startColumn: 6, startLineNumber: 0 }
  );
  t.deepEqual(
    mergeRanges([
      { endColumn: 4, endLineNumber: 0, startColumn: 0, startLineNumber: 0 },
      { endColumn: 8, endLineNumber: 1, startColumn: 6, startLineNumber: 1 },
    ]),
    { endColumn: 8, endLineNumber: 1, startColumn: 0, startLineNumber: 0 }
  );
  t.deepEqual(
    mergeRanges([
      { endColumn: 1, endLineNumber: 1, startColumn: 5, startLineNumber: 0 },
      { endColumn: 8, endLineNumber: 1, startColumn: 0, startLineNumber: 0 },
    ]),
    { endColumn: 8, endLineNumber: 1, startColumn: 0, startLineNumber: 0 }
  );
});

const aggregatedParse: Macro<[
  string,
  ReturnType<typeof aggregatedParseReductionTraceNodes>
]> = (t, script, expected) => {
  const compiled = compileScript('test', {}, { scripts: { test: script } });
  if (!compiled.success) {
    t.fail(stringify(compiled));
    return;
  }
  const aggregated = aggregatedParseReductionTraceNodes(compiled.reduce.source);
  t.deepEqual(aggregated, expected, stringify(aggregated));
};
// eslint-disable-next-line functional/immutable-data
aggregatedParse.title = (title) =>
  `aggregatedParseReductionTraceNodes: ${title ?? '?'}`;

test('empty script', aggregatedParse, '', {
  aggregations: [
    {
      instructions: [],
      lastIp: 0,
      range: {
        endColumn: 1,
        endLineNumber: 1,
        startColumn: 1,
        startLineNumber: 1,
      },
    },
  ],
  success: true,
});

test('push one byte', aggregatedParse, '0x01 "a"', {
  aggregations: [
    {
      instructions: [
        {
          data: Uint8Array.of(0x61),
          opcode: 1,
        },
      ],
      lastIp: 1,
      range: {
        endColumn: 9,
        endLineNumber: 1,
        startColumn: 1,
        startLineNumber: 1,
      },
    },
  ],
  success: true,
});

test('several aggregations', aggregatedParse, '0x01 "a" <"b"> <"c">', {
  aggregations: [
    {
      instructions: [
        {
          data: Uint8Array.of(0x61),
          opcode: 1,
        },
      ],
      lastIp: 1,
      range: {
        endColumn: 9,
        endLineNumber: 1,
        startColumn: 1,
        startLineNumber: 1,
      },
    },
    {
      instructions: [
        {
          data: Uint8Array.of(0x62),
          opcode: 1,
        },
      ],
      lastIp: 2,
      range: {
        endColumn: 15,
        endLineNumber: 1,
        startColumn: 10,
        startLineNumber: 1,
      },
    },
    {
      instructions: [
        {
          data: Uint8Array.of(0x63),
          opcode: 1,
        },
      ],
      lastIp: 3,
      range: {
        endColumn: 21,
        endLineNumber: 1,
        startColumn: 16,
        startLineNumber: 1,
      },
    },
  ],
  success: true,
});

test(
  'aggregation including multiple instructions',
  aggregatedParse,
  '0x010203040506',

  {
    aggregations: [
      {
        instructions: [
          {
            data: Uint8Array.of(0x02),
            opcode: 1,
          },
          {
            data: Uint8Array.from([0x04, 0x05, 0x06]),
            opcode: 3,
          },
        ],
        lastIp: 2,
        range: {
          endColumn: 15,
          endLineNumber: 1,
          startColumn: 1,
          startLineNumber: 1,
        },
      },
    ],
    success: true,
  }
);

test('incomplete instruction', aggregatedParse, '<<1> <2>> 0x02 <3>', {
  aggregations: [
    {
      instructions: [
        {
          data: Uint8Array.from([OpcodesBCH.OP_1, OpcodesBCH.OP_2]),
          opcode: 2,
        },
      ],
      lastIp: 1,
      range: {
        endColumn: 10,
        endLineNumber: 1,
        startColumn: 1,
        startLineNumber: 1,
      },
    },
  ],
  remainingBytecode: Uint8Array.from([
    OpcodesBCH.OP_PUSHBYTES_2,
    OpcodesBCH.OP_3,
  ]),
  remainingRange: {
    endColumn: 19,
    endLineNumber: 1,
    startColumn: 11,
    startLineNumber: 1,
  },
  success: false,
});

const parentRange = {
  endColumn: 999,
  endLineNumber: 999,
  startColumn: 999,
  startLineNumber: 999,
};
const vmPromise = instantiateVirtualMachineBCH();
const stateBCH = ({
  instructions,
  stack,
}: {
  instructions: AuthenticationInstruction<OpcodesBCH>[];
  stack: Uint8Array[];
}) =>
  createAuthenticationProgramStateCommon<OpcodesBCH, AuthenticationErrorBCH>({
    externalState: createAuthenticationProgramExternalStateCommonEmpty(),
    instructions,
    stack,
  }) as AuthenticationProgramStateBCH;
const getState = (instructions: AuthenticationInstruction<OpcodesBCH>[]) =>
  stateBCH({ instructions, stack: [] });

const sampledEvaluate: Macro<[
  string,
  ReturnType<typeof sampledEvaluateReductionTraceNodes>
]> = async (t, script, expected) => {
  const vm = await vmPromise;
  const compiled = compileScript(
    'test',
    {},
    {
      opcodes: {
        OP_0: Uint8Array.of(0x00),
        OP_1: Uint8Array.of(0x51),
        OP_2: Uint8Array.of(0x52),
        OP_ADD: Uint8Array.of(0x93),
        OP_RETURN: Uint8Array.of(0x6a),
      },
      scripts: { test: script },
    }
  );
  if (!compiled.success) {
    t.fail(stringify(compiled));
    return;
  }
  const evaluation = sampledEvaluateReductionTraceNodes<
    OpcodesBCH,
    AuthenticationProgramStateBCH,
    AuthenticationProgramBCH
  >({
    createState: getState,
    nodes: compiled.reduce.source,
    parentRange,
    vm,
  });
  t.deepEqual(evaluation, expected, stringify(evaluation));
};
// eslint-disable-next-line functional/immutable-data
sampledEvaluate.title = (title) =>
  `sampledEvaluateReductionTraceNodes: ${title ?? '?'}`;

test('can return empty bytecode', sampledEvaluate, 'OP_0', {
  bytecode: Uint8Array.of(),
  samples: [
    {
      range: {
        endColumn: 5,
        endLineNumber: 1,
        startColumn: 1,
        startLineNumber: 1,
      },
      state: {
        ...stateBCH({
          instructions: [{ data: Uint8Array.of(), opcode: 0 }],
          stack: [Uint8Array.of()],
        }),
        ip: 1,
      },
    },
  ],
  success: true,
});

test('OP_1 OP_2 OP_ADD', sampledEvaluate, 'OP_1 OP_2 OP_ADD', {
  bytecode: Uint8Array.of(0x03),
  samples: [
    {
      range: {
        endColumn: 5,
        endLineNumber: 1,
        startColumn: 1,
        startLineNumber: 1,
      },
      state: {
        ...stateBCH({
          instructions: [{ opcode: 81 }, { opcode: 82 }, { opcode: 147 }],
          stack: [Uint8Array.of(0x01)],
        }),
        ip: 1,
      },
    },
    {
      range: {
        endColumn: 10,
        endLineNumber: 1,
        startColumn: 6,
        startLineNumber: 1,
      },
      state: {
        ...stateBCH({
          instructions: [{ opcode: 81 }, { opcode: 82 }, { opcode: 147 }],
          stack: [Uint8Array.of(0x01), Uint8Array.of(0x02)],
        }),
        ip: 2,
      },
    },
    {
      range: {
        endColumn: 17,
        endLineNumber: 1,
        startColumn: 11,
        startLineNumber: 1,
      },
      state: {
        ...stateBCH({
          instructions: [{ opcode: 81 }, { opcode: 82 }, { opcode: 147 }],
          stack: [Uint8Array.of(0x03)],
        }),
        ip: 3,
        operationCount: 1,
      },
    },
  ],
  success: true,
});

test(
  'returns evaluation errors',
  sampledEvaluate,
  'OP_1 OP_RETURN OP_2 OP_ADD',
  {
    bytecode: Uint8Array.of(),
    errors: [
      {
        error:
          'Failed to reduce evaluation: Program called an OP_RETURN operation.',
        range: {
          endColumn: 15,
          endLineNumber: 1,
          startColumn: 6,
          startLineNumber: 1,
        },
      },
    ],
    samples: [
      {
        range: {
          endColumn: 5,
          endLineNumber: 1,
          startColumn: 1,
          startLineNumber: 1,
        },
        state: {
          ...stateBCH({
            instructions: [
              { opcode: 81 },
              { opcode: 106 },
              { opcode: 82 },
              { opcode: 147 },
            ],
            stack: [Uint8Array.of(0x01)],
          }),
          ip: 1,
        },
      },
      {
        range: {
          endColumn: 15,
          endLineNumber: 1,
          startColumn: 6,
          startLineNumber: 1,
        },
        state: {
          ...stateBCH({
            instructions: [
              { opcode: 81 },
              { opcode: 106 },
              { opcode: 82 },
              { opcode: 147 },
            ],
            stack: [Uint8Array.of(0x01)],
          }),
          error: 'Program called an OP_RETURN operation.',
          ip: 2,
          operationCount: 1,
        },
      },
      {
        range: {
          endColumn: 20,
          endLineNumber: 1,
          startColumn: 16,
          startLineNumber: 1,
        },
        state: undefined,
      },
      {
        range: {
          endColumn: 27,
          endLineNumber: 1,
          startColumn: 21,
          startLineNumber: 1,
        },
        state: undefined,
      },
    ],
    success: false,
  } as ReturnType<typeof sampledEvaluateReductionTraceNodes>
);

test('sampledEvaluateReductionTraceNodes: bad vm: empty trace', (t) => {
  const compiled = compileScript('t', {}, { scripts: { t: '0x00' } });
  if (!compiled.success) {
    t.fail(stringify(compiled));
    return;
  }
  const vmEmptyTrace = ({
    stateDebug: () => [],
  } as unknown) as AuthenticationVirtualMachine<
    AuthenticationProgramBCH,
    AuthenticationProgramStateBCH
  >;
  const evaluationEmptyTrace = sampledEvaluateReductionTraceNodes<
    OpcodesBCH,
    AuthenticationProgramStateBCH,
    AuthenticationProgramBCH
  >({
    createState: getState,
    nodes: compiled.reduce.source,
    parentRange,
    vm: vmEmptyTrace,
  });
  if (evaluationEmptyTrace.success) {
    t.fail();
    return;
  }
  t.deepEqual(
    evaluationEmptyTrace.errors,
    [
      {
        error:
          'Failed to reduce evaluation: vm.stateDebug produced no valid program states.',
        range: {
          endColumn: 5,
          endLineNumber: 1,
          startColumn: 1,
          startLineNumber: 1,
        },
      },
    ],
    stringify(evaluationEmptyTrace)
  );
});

test('sampledEvaluateReductionTraceNodes: bad vm: incomplete trace without error, ending before first sample', (t) => {
  const compiled = compileScript('t', {}, { scripts: { t: '0x000000' } });
  if (!compiled.success) {
    t.fail(stringify(compiled));
    return;
  }
  const vmIncompleteTraceWithoutErrorProperty = ({
    stateDebug: () => [{ ip: 1 }, { ip: 2 }],
  } as unknown) as AuthenticationVirtualMachine<
    AuthenticationProgramBCH,
    AuthenticationProgramStateBCH
  >;
  const evaluationIncompleteTrace = sampledEvaluateReductionTraceNodes<
    OpcodesBCH,
    AuthenticationProgramStateBCH,
    AuthenticationProgramBCH
  >({
    createState: getState,
    nodes: compiled.reduce.source,
    parentRange,
    vm: vmIncompleteTraceWithoutErrorProperty,
  });
  if (evaluationIncompleteTrace.success) {
    t.fail();
    return;
  }
  t.deepEqual(
    evaluationIncompleteTrace.errors,
    [
      {
        error:
          'Failed to reduce evaluation: vm.stateDebug failed to produce program states for any samples and provided no error message.',
        range: {
          endColumn: 9,
          endLineNumber: 1,
          startColumn: 1,
          startLineNumber: 1,
        },
      },
    ],
    stringify(evaluationIncompleteTrace)
  );
});

test('sampledEvaluateReductionTraceNodes: bad vm: incomplete trace without error', (t) => {
  const compiled = compileScript('t', {}, { scripts: { t: '0x00 0x00 0x00' } });
  if (!compiled.success) {
    t.fail(stringify(compiled));
    return;
  }
  const vmIncompleteTraceWithoutErrorProperty = ({
    stateDebug: () => [{ ip: 1 }, { ip: 2 }],
  } as unknown) as AuthenticationVirtualMachine<
    AuthenticationProgramBCH,
    AuthenticationProgramStateBCH
  >;
  const evaluationIncompleteTrace = sampledEvaluateReductionTraceNodes<
    OpcodesBCH,
    AuthenticationProgramStateBCH,
    AuthenticationProgramBCH
  >({
    createState: getState,
    nodes: compiled.reduce.source,
    parentRange,
    vm: vmIncompleteTraceWithoutErrorProperty,
  });
  if (evaluationIncompleteTrace.success) {
    t.fail();
    return;
  }
  t.deepEqual(
    evaluationIncompleteTrace.errors,
    [
      {
        error:
          'Failed to reduce evaluation: vm.stateDebug failed to produce all expected program states and provided no error message.',
        range: {
          endColumn: 10,
          endLineNumber: 1,
          startColumn: 6,
          startLineNumber: 1,
        },
      },
    ],
    stringify(evaluationIncompleteTrace)
  );
});

test('sampledEvaluateReductionTraceNodes: does not throw on empty push nodes', (t) => {
  /**
   * Modified version of `<>`. In normal use, each node.value would have a
   * single `comment` node.
   */
  const emptyPush = [
    {
      range: {
        endColumn: 3,
        endLineNumber: 1,
        startColumn: 1,
        startLineNumber: 1,
      },
      type: 'push',
      value: [],
    },
  ];
  const reduced = reduceScript(emptyPush as ResolvedScript);
  t.deepEqual(
    reduced,
    {
      bytecode: Uint8Array.of(0),
      range: {
        endColumn: 3,
        endLineNumber: 1,
        startColumn: 1,
        startLineNumber: 1,
      },
      source: [
        {
          bytecode: Uint8Array.of(0),
          range: {
            endColumn: 3,
            endLineNumber: 1,
            startColumn: 1,
            startLineNumber: 1,
          },
          source: [
            {
              bytecode: Uint8Array.of(),
              range: {
                endColumn: 0,
                endLineNumber: 0,
                startColumn: 0,
                startLineNumber: 0,
              },
              source: [],
            },
          ],
        },
      ],
    },
    stringify(reduced)
  );
});

test('sampledEvaluateReductionTraceNodes: does not throw on empty evaluation nodes', async (t) => {
  const vm = await vmPromise;
  /**
   * Modified version of `$()`. In normal use, node.value would have a
   * single `comment` node.
   */
  const unusualResolvedScript = [
    {
      range: {
        endColumn: 4,
        endLineNumber: 1,
        startColumn: 1,
        startLineNumber: 1,
      },
      type: 'evaluation',
      value: [],
    },
  ];
  const reduced = reduceScript(
    unusualResolvedScript as ResolvedScript,
    vm,
    getState
  );
  t.deepEqual(
    reduced,
    {
      bytecode: Uint8Array.of(),
      errors: [
        {
          error:
            'An evaluation must leave an item on the stack, but this evaluation contains no operations. To return an empty result, push an empty stack item ("OP_0").',
          range: {
            endColumn: 4,
            endLineNumber: 1,
            startColumn: 1,
            startLineNumber: 1,
          },
        },
      ],
      range: {
        endColumn: 4,
        endLineNumber: 1,
        startColumn: 1,
        startLineNumber: 1,
      },
      source: [
        {
          bytecode: Uint8Array.of(),
          errors: [
            {
              error:
                'An evaluation must leave an item on the stack, but this evaluation contains no operations. To return an empty result, push an empty stack item ("OP_0").',
              range: {
                endColumn: 4,
                endLineNumber: 1,
                startColumn: 1,
                startLineNumber: 1,
              },
            },
          ],
          range: {
            endColumn: 4,
            endLineNumber: 1,
            startColumn: 1,
            startLineNumber: 1,
          },
          samples: [],
          source: [
            {
              bytecode: Uint8Array.of(),
              range: {
                endColumn: 0,
                endLineNumber: 0,
                startColumn: 0,
                startLineNumber: 0,
              },
              source: [],
            },
          ],
        },
      ],
    },
    stringify(reduced)
  );
});

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
      source: [],
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
      value: "Unknown identifier 'unknown'.",
    },
  ]);
  t.deepEqual(
    reduced,
    {
      bytecode: Uint8Array.of(),
      errors: [
        {
          error:
            "Tried to reduce a BTL script with resolution errors: Unknown identifier 'unknown'.",
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
      source: [
        {
          bytecode: Uint8Array.of(),
          errors: [
            {
              error:
                "Tried to reduce a BTL script with resolution errors: Unknown identifier 'unknown'.",
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
