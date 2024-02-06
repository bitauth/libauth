/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable max-lines */
import test from 'ava';

import type { Range } from '../lib.js';
import {
  AuthenticationErrorCommon,
  compileCashAssembly,
  containsRange,
  createAuthenticationProgramEvaluationCommon,
  createCompilerBCH,
  createCompilerCommon,
  createVirtualMachineBCH,
  extractBytecodeResolutions,
  extractEvaluationSamples,
  extractEvaluationSamplesRecursive,
  extractUnexecutedRanges,
  hexToBin,
  mergeRanges,
  Opcodes,
  stringifyErrors,
  stringifyTestVector,
} from '../lib.js';

test('mergeRanges', (t) => {
  t.deepEqual(
    mergeRanges([
      { endColumn: 3, endLineNumber: 1, startColumn: 0, startLineNumber: 1 },
      { endColumn: 1, endLineNumber: 3, startColumn: 6, startLineNumber: 0 },
    ]),
    { endColumn: 1, endLineNumber: 3, startColumn: 6, startLineNumber: 0 },
  );
  t.deepEqual(
    mergeRanges([
      { endColumn: 4, endLineNumber: 0, startColumn: 0, startLineNumber: 0 },
      { endColumn: 8, endLineNumber: 1, startColumn: 6, startLineNumber: 1 },
    ]),
    { endColumn: 8, endLineNumber: 1, startColumn: 0, startLineNumber: 0 },
  );
  t.deepEqual(
    mergeRanges([
      { endColumn: 1, endLineNumber: 1, startColumn: 5, startLineNumber: 0 },
      { endColumn: 8, endLineNumber: 1, startColumn: 0, startLineNumber: 0 },
    ]),
    { endColumn: 8, endLineNumber: 1, startColumn: 0, startLineNumber: 0 },
  );
});

test('containsRange', (t) => {
  t.deepEqual(
    containsRange(
      { endColumn: 1, endLineNumber: 3, startColumn: 6, startLineNumber: 0 },
      { endColumn: 3, endLineNumber: 1, startColumn: 0, startLineNumber: 1 },
    ),
    true,
  );
  t.deepEqual(
    containsRange(
      { endColumn: 4, endLineNumber: 0, startColumn: 0, startLineNumber: 0 },
      { endColumn: 8, endLineNumber: 1, startColumn: 6, startLineNumber: 1 },
    ),
    false,
  );
  t.deepEqual(
    containsRange(
      { endColumn: 8, endLineNumber: 1, startColumn: 0, startLineNumber: 0 },
      { endColumn: 1, endLineNumber: 1, startColumn: 5, startLineNumber: 0 },
    ),
    true,
  );
  t.deepEqual(
    containsRange(
      { endColumn: 5, endLineNumber: 1, startColumn: 1, startLineNumber: 1 },
      { endColumn: 5, endLineNumber: 1, startColumn: 1, startLineNumber: 1 },
      false,
    ),
    true,
  );
});

test('compileCashAssembly', (t) => {
  const successful = compileCashAssembly('<0x010203>');
  t.deepEqual(
    successful,
    hexToBin('03010203'),
    stringifyTestVector(successful),
  );
  const failed = compileCashAssembly('<bad>');
  t.deepEqual(
    failed,
    'CashAssembly compilation error: [1, 2]: Unknown identifier "bad".',
    stringifyTestVector(failed),
  );
});

test('extractBytecodeResolutions', (t) => {
  const compiler = createCompilerCommon({
    scripts: {
      pushNumbers: '<1> var',
      t: 'pushNumbers OP_ADD <0x03> OP_EQUAL <"abc"> OP_DROP <0b11> OP_EQUAL var2',
    },
    variables: { var: { type: 'AddressData' }, var2: { type: 'AddressData' } },
  });

  const compiled = compiler.generateBytecode({
    data: { bytecode: { var: Uint8Array.of(0) } },
    debug: true,
    scriptId: 't',
  });

  if (!('resolve' in compiled)) {
    t.fail(stringifyTestVector(compiled));
    return;
  }
  const result = extractBytecodeResolutions(compiled.resolve);
  t.deepEqual(
    result,
    [
      {
        bytecode: hexToBin('01'),
        text: '1',
        type: 'BigIntLiteral',
      },
      {
        bytecode: hexToBin('00'),
        text: 'var',
        type: 'variable',
      },
      {
        bytecode: hexToBin('5100'),
        text: 'pushNumbers',
        type: 'script',
      },
      {
        bytecode: hexToBin('93'),
        text: 'OP_ADD',
        type: 'opcode',
      },
      {
        bytecode: hexToBin('03'),
        text: '03',
        type: 'HexLiteral',
      },
      {
        bytecode: hexToBin('87'),
        text: 'OP_EQUAL',
        type: 'opcode',
      },
      {
        bytecode: hexToBin('616263'),
        text: 'abc',
        type: 'UTF8Literal',
      },
      {
        bytecode: hexToBin('75'),
        text: 'OP_DROP',
        type: 'opcode',
      },
      {
        bytecode: hexToBin('03'),
        text: '11',
        type: 'BinaryLiteral',
      },
      {
        bytecode: hexToBin('87'),
        text: 'OP_EQUAL',
        type: 'opcode',
      },
    ],
    stringifyTestVector(result),
  );
});

test('extractEvaluationSamples: empty trace', (t) => {
  const result = extractEvaluationSamples({
    evaluationRange: {
      endColumn: 0,
      endLineNumber: 0,
      startColumn: 0,
      startLineNumber: 0,
    },
    nodes: [],
    trace: [],
  });
  t.deepEqual(
    result,
    {
      samples: [],
      unmatchedStates: [],
    },
    stringifyTestVector(result),
  );
});

const unexecutedLock = `OP_TOALTSTACK
OP_IF
    <2>
    OP_FROMALTSTACK
    OP_IF
        <3>
        $(
            <1>
            OP_IF
                <<4>>
            OP_ELSE
                <<5>>
            OP_ENDIF
        )
    0x675667 // OP_ELSE OP_6 OP_ELSE
    OP_ENDIF
OP_ELSE
    <7>
    OP_FROMALTSTACK
    OP_IF
        <$(
            <7> <1> OP_ADD
        )>
    OP_ENDIF
OP_ENDIF`;

const vm = createVirtualMachineBCH();
const compiler = createCompilerBCH({
  scripts: {
    docs: '0x00 0x01 0xab01 0xcd9300 $(OP_3 <0x00> OP_SWAP OP_CAT) 0x010203',
    /**
     * Second node closes an open sample, then fails during an internal state.
     * The sample should use the error state and the instruction that caused
     * it, ignoring any later (unexecuted) instructions.
     */
    error1: '0x01 $(<0xab OP_RETURN OP_0>)',
    /**
     * `OP_0 OP_PUSHDATA_2 600 0x62[600 times]` - fails as first instruction of
     * second node: `Push exceeds the push size limit of 520 bytes.`
     */
    error2:
      '0x004d5802 "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"',
    /**
     * The second node causes an error, so only two samples and no unmatched
     * states are returned.
     */
    error3: 'OP_0 OP_RETURN OP_0 OP_0',
    nested: `OP_0

<
  $(
  0x0000
    $($(<OP_1>)

      OP_2
      OP_ADD

    )
    $( <"abc">
    )
  OP_CAT
  OP_CAT
  )
  $(
    <0>
    <0>
  $(<OP_CAT>))
>`,
    nonPushingOpcodeUnlock: 'OP_1 OP_DUP',
    unexecuted00: `<0> <0> ${unexecutedLock}`,
    unexecuted01: `<0> <1> ${unexecutedLock}`,
    unexecuted10: `<1> <0> ${unexecutedLock}`,
    unexecuted11: `<1> <1> ${unexecutedLock}`,
    unexecutedEmpty: ``,
  },
});

test.failing('extractEvaluationSamples: documentation example', (t) => {
  const result = compiler.generateBytecode({
    data: {},
    debug: true,
    scriptId: 'docs',
  });
  if (!result.success) {
    t.fail(stringifyErrors(result.errors));
    return;
  }
  const program = createAuthenticationProgramEvaluationCommon(result.bytecode);
  const nodes = result.reduce.script;
  const evaluationRange = result.reduce.range;
  const traceWithUnlockingPhaseAndFinalState = vm.debug(program);
  const actualTrace = traceWithUnlockingPhaseAndFinalState.slice(1, -1);
  /**
   * We double the debugging trace just to test that the extra states are
   * returned in `unmatchedStates`.
   */
  const trace = [...actualTrace, ...actualTrace];
  const extracted = extractEvaluationSamples({
    evaluationRange,
    nodes,
    trace,
  });

  t.deepEqual(
    nodes,
    [
      {
        bytecode: hexToBin('00'),
        range: {
          endColumn: 5,
          endLineNumber: 1,
          startColumn: 1,
          startLineNumber: 1,
        },
      },
      {
        bytecode: hexToBin('01'),
        range: {
          endColumn: 10,
          endLineNumber: 1,
          startColumn: 6,
          startLineNumber: 1,
        },
      },
      {
        bytecode: hexToBin('ab01'),
        range: {
          endColumn: 17,
          endLineNumber: 1,
          startColumn: 11,
          startLineNumber: 1,
        },
      },
      {
        bytecode: hexToBin('cd9300'),
        range: {
          endColumn: 26,
          endLineNumber: 1,
          startColumn: 18,
          startLineNumber: 1,
        },
      },
      {
        bytecode: hexToBin('0003'),
        range: {
          endColumn: 56,
          endLineNumber: 1,
          startColumn: 27,
          startLineNumber: 1,
        },
        source: {
          bytecode: hexToBin('5301007c7e'),
          range: {
            endColumn: 55,
            endLineNumber: 1,
            startColumn: 29,
            startLineNumber: 1,
          },
          script: [
            {
              bytecode: hexToBin('53'),
              range: {
                endColumn: 33,
                endLineNumber: 1,
                startColumn: 29,
                startLineNumber: 1,
              },
            },
            {
              bytecode: hexToBin('0100'),
              push: {
                bytecode: hexToBin('00'),
                range: {
                  endColumn: 39,
                  endLineNumber: 1,
                  startColumn: 35,
                  startLineNumber: 1,
                },
                script: [
                  {
                    bytecode: hexToBin('00'),
                    range: {
                      endColumn: 39,
                      endLineNumber: 1,
                      startColumn: 35,
                      startLineNumber: 1,
                    },
                  },
                ],
              },
              range: {
                endColumn: 40,
                endLineNumber: 1,
                startColumn: 34,
                startLineNumber: 1,
              },
            },
            {
              bytecode: hexToBin('7c'),
              range: {
                endColumn: 48,
                endLineNumber: 1,
                startColumn: 41,
                startLineNumber: 1,
              },
            },
            {
              bytecode: hexToBin('7e'),
              range: {
                endColumn: 55,
                endLineNumber: 1,
                startColumn: 49,
                startLineNumber: 1,
              },
            },
          ],
        },
        trace: [
          {
            alternateStack: [],
            controlStack: [],
            instructions: [],
            ip: 0,
            lastCodeSeparator: -1,
            operationCount: 0,
            program,
            signatureOperationsCount: 0,
            signedMessages: [],
            stack: [],
          },
          {
            alternateStack: [],
            controlStack: [],
            instructions: [
              {
                opcode: 83,
              },
              {
                data: hexToBin('00'),
                opcode: 1,
              },
              {
                opcode: 124,
              },
              {
                opcode: 126,
              },
            ],
            ip: 0,
            lastCodeSeparator: -1,
            operationCount: 0,
            program,
            signatureOperationsCount: 0,
            signedMessages: [],
            stack: [],
          },
          {
            alternateStack: [],
            controlStack: [],
            instructions: [
              {
                opcode: 83,
              },
              {
                data: hexToBin('00'),
                opcode: 1,
              },
              {
                opcode: 124,
              },
              {
                opcode: 126,
              },
            ],
            ip: 1,
            lastCodeSeparator: -1,
            operationCount: 0,
            program,
            signatureOperationsCount: 0,
            signedMessages: [],
            stack: [hexToBin('03')],
          },
          {
            alternateStack: [],
            controlStack: [],
            instructions: [
              {
                opcode: 83,
              },
              {
                data: hexToBin('00'),
                opcode: 1,
              },
              {
                opcode: 124,
              },
              {
                opcode: 126,
              },
            ],
            ip: 2,
            lastCodeSeparator: -1,
            operationCount: 0,
            program,
            signatureOperationsCount: 0,
            signedMessages: [],
            stack: [hexToBin('03'), hexToBin('00')],
          },
          {
            alternateStack: [],
            controlStack: [],
            instructions: [
              {
                opcode: 83,
              },
              {
                data: hexToBin('00'),
                opcode: 1,
              },
              {
                opcode: 124,
              },
              {
                opcode: 126,
              },
            ],
            ip: 3,
            lastCodeSeparator: -1,
            operationCount: 1,
            program,
            signatureOperationsCount: 0,
            signedMessages: [],
            stack: [hexToBin('00'), hexToBin('03')],
          },
          {
            alternateStack: [],
            controlStack: [],
            instructions: [
              {
                opcode: 83,
              },
              {
                data: hexToBin('00'),
                opcode: 1,
              },
              {
                opcode: 124,
              },
              {
                opcode: 126,
              },
            ],
            ip: 4,
            lastCodeSeparator: -1,
            operationCount: 2,
            program,
            signatureOperationsCount: 0,
            signedMessages: [],
            stack: [hexToBin('0003')],
          },
          {
            alternateStack: [],
            controlStack: [],
            instructions: [
              {
                opcode: 83,
              },
              {
                data: hexToBin('00'),
                opcode: 1,
              },
              {
                opcode: 124,
              },
              {
                opcode: 126,
              },
            ],
            ip: 4,
            lastCodeSeparator: -1,
            operationCount: 2,
            program,
            signatureOperationsCount: 0,
            signedMessages: [],
            stack: [hexToBin('0003')],
          },
        ],
      },
      {
        bytecode: hexToBin('010203'),
        range: {
          endColumn: 65,
          endLineNumber: 1,
          startColumn: 57,
          startLineNumber: 1,
        },
      },
    ],
    stringifyTestVector(nodes),
  );

  t.deepEqual(
    traceWithUnlockingPhaseAndFinalState,
    [
      {
        alternateStack: [],
        controlStack: [],
        instructions: [],
        ip: 0,
        lastCodeSeparator: -1,
        operationCount: 0,
        program,
        signatureOperationsCount: 0,
        signedMessages: [],
        stack: [],
      },
      {
        alternateStack: [],
        controlStack: [],
        instructions: [
          {
            data: hexToBin(''),
            opcode: 0,
          },
          {
            data: hexToBin('ab'),
            opcode: 1,
          },
          {
            data: hexToBin('cd'),
            opcode: 1,
          },
          {
            opcode: 147,
          },
          {
            data: hexToBin(''),
            opcode: 0,
          },
          {
            data: hexToBin(''),
            opcode: 0,
          },
          {
            data: hexToBin('010203'),
            opcode: 3,
          },
        ],
        ip: 0,
        lastCodeSeparator: -1,
        operationCount: 0,
        program,
        signatureOperationsCount: 0,
        signedMessages: [],
        stack: [],
      },
      {
        alternateStack: [],
        controlStack: [],
        instructions: [
          {
            data: hexToBin(''),
            opcode: 0,
          },
          {
            data: hexToBin('ab'),
            opcode: 1,
          },
          {
            data: hexToBin('cd'),
            opcode: 1,
          },
          {
            opcode: 147,
          },
          {
            data: hexToBin(''),
            opcode: 0,
          },
          {
            data: hexToBin(''),
            opcode: 0,
          },
          {
            data: hexToBin('010203'),
            opcode: 3,
          },
        ],
        ip: 1,
        lastCodeSeparator: -1,
        operationCount: 0,
        program,
        signatureOperationsCount: 0,
        signedMessages: [],
        stack: [hexToBin('')],
      },
      {
        alternateStack: [],
        controlStack: [],
        instructions: [
          {
            data: hexToBin(''),
            opcode: 0,
          },
          {
            data: hexToBin('ab'),
            opcode: 1,
          },
          {
            data: hexToBin('cd'),
            opcode: 1,
          },
          {
            opcode: 147,
          },
          {
            data: hexToBin(''),
            opcode: 0,
          },
          {
            data: hexToBin(''),
            opcode: 0,
          },
          {
            data: hexToBin('010203'),
            opcode: 3,
          },
        ],
        ip: 2,
        lastCodeSeparator: -1,
        operationCount: 0,
        program,
        signatureOperationsCount: 0,
        signedMessages: [],
        stack: [hexToBin(''), hexToBin('ab')],
      },
      {
        alternateStack: [],
        controlStack: [],
        instructions: [
          {
            data: hexToBin(''),
            opcode: 0,
          },
          {
            data: hexToBin('ab'),
            opcode: 1,
          },
          {
            data: hexToBin('cd'),
            opcode: 1,
          },
          {
            opcode: 147,
          },
          {
            data: hexToBin(''),
            opcode: 0,
          },
          {
            data: hexToBin(''),
            opcode: 0,
          },
          {
            data: hexToBin('010203'),
            opcode: 3,
          },
        ],
        ip: 3,
        lastCodeSeparator: -1,
        operationCount: 0,
        program,
        signatureOperationsCount: 0,
        signedMessages: [],
        stack: [hexToBin(''), hexToBin('ab'), hexToBin('cd')],
      },
      {
        alternateStack: [],
        controlStack: [],
        instructions: [
          {
            data: hexToBin(''),
            opcode: 0,
          },
          {
            data: hexToBin('ab'),
            opcode: 1,
          },
          {
            data: hexToBin('cd'),
            opcode: 1,
          },
          {
            opcode: 147,
          },
          {
            data: hexToBin(''),
            opcode: 0,
          },
          {
            data: hexToBin(''),
            opcode: 0,
          },
          {
            data: hexToBin('010203'),
            opcode: 3,
          },
        ],
        ip: 4,
        lastCodeSeparator: -1,
        operationCount: 1,
        program,
        signatureOperationsCount: 0,
        signedMessages: [],
        stack: [hexToBin(''), hexToBin('f8')],
      },
      {
        alternateStack: [],
        controlStack: [],
        instructions: [
          {
            data: hexToBin(''),
            opcode: 0,
          },
          {
            data: hexToBin('ab'),
            opcode: 1,
          },
          {
            data: hexToBin('cd'),
            opcode: 1,
          },
          {
            opcode: 147,
          },
          {
            data: hexToBin(''),
            opcode: 0,
          },
          {
            data: hexToBin(''),
            opcode: 0,
          },
          {
            data: hexToBin('010203'),
            opcode: 3,
          },
        ],
        ip: 5,
        lastCodeSeparator: -1,
        operationCount: 1,
        program,
        signatureOperationsCount: 0,
        signedMessages: [],
        stack: [hexToBin(''), hexToBin('f8'), hexToBin('')],
      },
      {
        alternateStack: [],
        controlStack: [],
        instructions: [
          {
            data: hexToBin(''),
            opcode: 0,
          },
          {
            data: hexToBin('ab'),
            opcode: 1,
          },
          {
            data: hexToBin('cd'),
            opcode: 1,
          },
          {
            opcode: 147,
          },
          {
            data: hexToBin(''),
            opcode: 0,
          },
          {
            data: hexToBin(''),
            opcode: 0,
          },
          {
            data: hexToBin('010203'),
            opcode: 3,
          },
        ],
        ip: 6,
        lastCodeSeparator: -1,
        operationCount: 1,
        program,
        signatureOperationsCount: 0,
        signedMessages: [],
        stack: [hexToBin(''), hexToBin('f8'), hexToBin(''), hexToBin('')],
      },
      {
        alternateStack: [],
        controlStack: [],
        instructions: [
          {
            data: hexToBin(''),
            opcode: 0,
          },
          {
            data: hexToBin('ab'),
            opcode: 1,
          },
          {
            data: hexToBin('cd'),
            opcode: 1,
          },
          {
            opcode: 147,
          },
          {
            data: hexToBin(''),
            opcode: 0,
          },
          {
            data: hexToBin(''),
            opcode: 0,
          },
          {
            data: hexToBin('010203'),
            opcode: 3,
          },
        ],
        ip: 7,
        lastCodeSeparator: -1,
        operationCount: 1,
        program,
        signatureOperationsCount: 0,
        signedMessages: [],
        stack: [
          hexToBin(''),
          hexToBin('f8'),
          hexToBin(''),
          hexToBin(''),
          hexToBin('010203'),
        ],
      },
      {
        alternateStack: [],
        controlStack: [],
        instructions: [
          {
            data: hexToBin(''),
            opcode: 0,
          },
          {
            data: hexToBin('ab'),
            opcode: 1,
          },
          {
            data: hexToBin('cd'),
            opcode: 1,
          },
          {
            opcode: 147,
          },
          {
            data: hexToBin(''),
            opcode: 0,
          },
          {
            data: hexToBin(''),
            opcode: 0,
          },
          {
            data: hexToBin('010203'),
            opcode: 3,
          },
        ],
        ip: 7,
        lastCodeSeparator: -1,
        operationCount: 1,
        program,
        signatureOperationsCount: 0,
        signedMessages: [],
        stack: [
          hexToBin(''),
          hexToBin('f8'),
          hexToBin(''),
          hexToBin(''),
          hexToBin('010203'),
        ],
      },
    ],
    stringifyTestVector(traceWithUnlockingPhaseAndFinalState),
  );

  t.deepEqual(extracted, {
    samples: [
      {
        evaluationRange,
        internalStates: [],
        range: {
          endColumn: 1,
          endLineNumber: 1,
          startColumn: 1,
          startLineNumber: 1,
        },
        state: trace[0],
      },
      {
        evaluationRange,
        instruction: { data: Uint8Array.of(), opcode: 0 },
        internalStates: [],
        range: nodes[0]!.range,
        state: trace[1],
      },
      {
        evaluationRange,
        instruction: { data: hexToBin('ab'), opcode: 1 },
        internalStates: [],
        range: mergeRanges([nodes[1]!.range, nodes[2]!.range]),
        state: trace[2],
      },
      {
        evaluationRange,
        instruction: { data: hexToBin('cd'), opcode: 1 },
        internalStates: [],
        range: mergeRanges([nodes[2]!.range, nodes[3]!.range]),
        state: trace[3],
      },
      {
        evaluationRange,
        instruction: { data: Uint8Array.of(), opcode: 0 },
        internalStates: [
          {
            instruction: { opcode: 0x93 },
            state: trace[4],
          },
        ],
        range: nodes[3]!.range,
        state: trace[5],
      },
      {
        evaluationRange,
        instruction: { data: Uint8Array.of(), opcode: 0 },
        internalStates: [],
        range: nodes[4]!.range,
        state: trace[6],
      },
      {
        evaluationRange,
        instruction: { data: hexToBin('010203'), opcode: 3 },
        internalStates: [],
        range: mergeRanges([nodes[4]!.range, nodes[5]!.range]),
        state: trace[7],
      },
    ],
    unmatchedStates: actualTrace,
  });
});

test('extractEvaluationSamples: error in initial validation', (t) => {
  const result = compiler.generateBytecode({
    data: {},
    debug: true,
    scriptId: 'nonPushingOpcodeUnlock',
  });
  if (!result.success) {
    t.fail(stringifyErrors(result.errors));
    return;
  }
  const nullHashLength = 32;
  const program = {
    inputIndex: 0,
    sourceOutputs: [
      {
        lockingBytecode: Uint8Array.of(Opcodes.OP_1),
        valueSatoshis: 0n,
      },
    ],
    transaction: {
      inputs: [
        {
          outpointIndex: 0,
          outpointTransactionHash: new Uint8Array(nullHashLength),
          sequenceNumber: 0,
          unlockingBytecode: result.bytecode,
        },
      ],
      locktime: 0,
      outputs: [
        {
          lockingBytecode: Uint8Array.of(),
          valueSatoshis: 0n,
        },
      ],
      version: 0,
    },
  };

  const nodes = result.reduce.script;
  const evaluationRange = result.reduce.range;
  const trace = vm.debug(program);
  const extracted = extractEvaluationSamples({
    evaluationRange,
    nodes,
    trace,
  });
  t.deepEqual(
    nodes,
    [
      {
        bytecode: hexToBin('51'),
        range: {
          endColumn: 5,
          endLineNumber: 1,
          startColumn: 1,
          startLineNumber: 1,
        },
      },
      {
        bytecode: hexToBin('76'),
        range: {
          endColumn: 12,
          endLineNumber: 1,
          startColumn: 6,
          startLineNumber: 1,
        },
      },
    ],
    stringifyTestVector(nodes),
  );

  t.deepEqual(
    trace,
    [
      {
        alternateStack: [],
        controlStack: [],
        error: 'Unlocking bytecode may contain only push operations.',
        instructions: [
          {
            opcode: 81,
          },
          {
            opcode: 118,
          },
        ],
        ip: 0,
        lastCodeSeparator: -1,
        operationCount: 0,
        program,
        signatureOperationsCount: 0,
        signedMessages: [],
        stack: [],
      },
    ],
    stringifyTestVector(trace),
  );

  t.deepEqual(extracted, {
    samples: [
      {
        evaluationRange,
        internalStates: [],
        range: {
          endColumn: 1,
          endLineNumber: 1,
          startColumn: 1,
          startLineNumber: 1,
        },
        state: trace[0],
      },
    ],
    unmatchedStates: [],
  });
});

test.failing(
  "extractEvaluationSamples: node closes an open sample, then errors before the node's last instruction",
  (t) => {
    const result = compiler.generateBytecode({
      data: {},
      debug: true,
      scriptId: 'error1',
    });
    if (!result.success) {
      t.fail(stringifyErrors(result.errors));
      return;
    }
    const program = createAuthenticationProgramEvaluationCommon(
      result.bytecode,
    );
    const nodes = result.reduce.script;
    const evaluationRange = result.reduce.range;
    const traceWithUnlockingPhaseAndFinalState = vm.debug(program);
    const trace = traceWithUnlockingPhaseAndFinalState.slice(1);
    const extracted = extractEvaluationSamples({
      evaluationRange,
      nodes,
      trace,
    });
    t.deepEqual(
      nodes,
      [
        {
          bytecode: hexToBin('01'),
          range: {
            endColumn: 5,
            endLineNumber: 1,
            startColumn: 1,
            startLineNumber: 1,
          },
        },
        {
          bytecode: hexToBin('ab6a00'),
          range: {
            endColumn: 30,
            endLineNumber: 1,
            startColumn: 6,
            startLineNumber: 1,
          },
          source: {
            bytecode: hexToBin('03ab6a00'),
            range: {
              endColumn: 29,
              endLineNumber: 1,
              startColumn: 8,
              startLineNumber: 1,
            },
            script: [
              {
                bytecode: hexToBin('03ab6a00'),
                push: {
                  bytecode: hexToBin('ab6a00'),
                  range: {
                    endColumn: 28,
                    endLineNumber: 1,
                    startColumn: 9,
                    startLineNumber: 1,
                  },
                  script: [
                    {
                      bytecode: hexToBin('ab'),
                      range: {
                        endColumn: 13,
                        endLineNumber: 1,
                        startColumn: 9,
                        startLineNumber: 1,
                      },
                    },
                    {
                      bytecode: hexToBin('6a'),
                      range: {
                        endColumn: 23,
                        endLineNumber: 1,
                        startColumn: 14,
                        startLineNumber: 1,
                      },
                    },
                    {
                      bytecode: hexToBin('00'),
                      range: {
                        endColumn: 28,
                        endLineNumber: 1,
                        startColumn: 24,
                        startLineNumber: 1,
                      },
                    },
                  ],
                },
                range: {
                  endColumn: 29,
                  endLineNumber: 1,
                  startColumn: 8,
                  startLineNumber: 1,
                },
              },
            ],
          },
          trace: [
            {
              alternateStack: [],
              controlStack: [],
              instructions: [],
              ip: 0,
              lastCodeSeparator: -1,
              operationCount: 0,
              program,
              signatureOperationsCount: 0,
              signedMessages: [],
              stack: [],
            },
            {
              alternateStack: [],
              controlStack: [],
              instructions: [
                {
                  data: hexToBin('ab6a00'),
                  opcode: 3,
                },
              ],
              ip: 0,
              lastCodeSeparator: -1,
              operationCount: 0,
              program,
              signatureOperationsCount: 0,
              signedMessages: [],
              stack: [],
            },
            {
              alternateStack: [],
              controlStack: [],
              instructions: [
                {
                  data: hexToBin('ab6a00'),
                  opcode: 3,
                },
              ],
              ip: 1,
              lastCodeSeparator: -1,
              operationCount: 0,
              program,
              signatureOperationsCount: 0,
              signedMessages: [],
              stack: [hexToBin('ab6a00')],
            },
            {
              alternateStack: [],
              controlStack: [],
              instructions: [
                {
                  data: hexToBin('ab6a00'),
                  opcode: 3,
                },
              ],
              ip: 1,
              lastCodeSeparator: -1,
              operationCount: 0,
              program,
              signatureOperationsCount: 0,
              signedMessages: [],
              stack: [hexToBin('ab6a00')],
            },
          ],
        },
      ],
      stringifyTestVector(nodes),
    );

    t.deepEqual(
      traceWithUnlockingPhaseAndFinalState,
      [
        {
          alternateStack: [],
          controlStack: [],
          instructions: [],
          ip: 0,
          lastCodeSeparator: -1,
          operationCount: 0,
          program,
          signatureOperationsCount: 0,
          signedMessages: [],
          stack: [],
        },
        {
          alternateStack: [],
          controlStack: [],
          instructions: [
            {
              data: hexToBin('ab'),
              opcode: 1,
            },
            {
              opcode: 106,
            },
            {
              data: hexToBin(''),
              opcode: 0,
            },
          ],
          ip: 0,
          lastCodeSeparator: -1,
          operationCount: 0,
          program,
          signatureOperationsCount: 0,
          signedMessages: [],
          stack: [],
        },
        {
          alternateStack: [],
          controlStack: [],
          instructions: [
            {
              data: hexToBin('ab'),
              opcode: 1,
            },
            {
              opcode: 106,
            },
            {
              data: hexToBin(''),
              opcode: 0,
            },
          ],
          ip: 1,
          lastCodeSeparator: -1,
          operationCount: 0,
          program,
          signatureOperationsCount: 0,
          signedMessages: [],
          stack: [hexToBin('ab')],
        },
        {
          alternateStack: [],
          controlStack: [],
          error: AuthenticationErrorCommon.calledReturn,
          instructions: [
            {
              data: hexToBin('ab'),
              opcode: 1,
            },
            {
              opcode: 106,
            },
            {
              data: hexToBin(''),
              opcode: 0,
            },
          ],
          ip: 2,
          lastCodeSeparator: -1,
          operationCount: 1,
          program,
          signatureOperationsCount: 0,
          signedMessages: [],
          stack: [hexToBin('ab')],
        },
        {
          alternateStack: [],
          controlStack: [],
          error: AuthenticationErrorCommon.calledReturn,
          instructions: [
            {
              data: hexToBin('ab'),
              opcode: 1,
            },
            {
              opcode: 106,
            },
            {
              data: hexToBin(''),
              opcode: 0,
            },
          ],
          ip: 2,
          lastCodeSeparator: -1,
          operationCount: 1,
          program,
          signatureOperationsCount: 0,
          signedMessages: [],
          stack: [hexToBin('ab')],
        },
      ],
      stringifyTestVector(traceWithUnlockingPhaseAndFinalState),
    );

    t.deepEqual(
      extracted,
      {
        samples: [
          {
            evaluationRange,
            internalStates: [],
            range: {
              endColumn: 1,
              endLineNumber: 1,
              startColumn: 1,
              startLineNumber: 1,
            },
            state: trace[0],
          },
          {
            evaluationRange,
            instruction: { data: hexToBin('ab'), opcode: 1 },
            internalStates: [],
            range: mergeRanges([nodes[0]!.range, nodes[1]!.range]),
            state: trace[1],
          },
          {
            evaluationRange,
            instruction: { opcode: Opcodes.OP_RETURN },
            internalStates: [],
            range: nodes[1]!.range,
            state: trace[2],
          },
        ],
        unmatchedStates: [],
      },
      stringifyTestVector(extracted),
    );
  },
);

test('extractEvaluationSamples: node that closes an open sample with an error', (t) => {
  const result = compiler.generateBytecode({
    data: {},
    debug: true,
    scriptId: 'error2',
  });
  if (!result.success) {
    t.fail(stringifyErrors(result.errors));
    return;
  }
  const program = createAuthenticationProgramEvaluationCommon(result.bytecode);
  const nodes = result.reduce.script;
  const evaluationRange = result.reduce.range;
  const traceWithUnlockingPhaseAndFinalState = vm.debug(program);
  const trace = traceWithUnlockingPhaseAndFinalState.slice(1);
  const extracted = extractEvaluationSamples({
    evaluationRange,
    nodes,
    trace,
  });
  t.deepEqual(
    nodes,
    [
      {
        bytecode: hexToBin('004d5802'),
        range: {
          endColumn: 11,
          endLineNumber: 1,
          startColumn: 1,
          startLineNumber: 1,
        },
      },
      {
        bytecode: hexToBin(
          '626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262',
        ),
        range: {
          endColumn: 614,
          endLineNumber: 1,
          startColumn: 12,
          startLineNumber: 1,
        },
      },
    ],
    stringifyTestVector(nodes),
  );

  t.deepEqual(
    traceWithUnlockingPhaseAndFinalState,
    [
      {
        alternateStack: [],
        controlStack: [],
        instructions: [],
        ip: 0,
        lastCodeSeparator: -1,
        operationCount: 0,
        program,
        signatureOperationsCount: 0,
        signedMessages: [],
        stack: [],
      },
      {
        alternateStack: [],
        controlStack: [],
        instructions: [
          {
            data: hexToBin(''),
            opcode: 0,
          },
          {
            data: hexToBin(
              '626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262',
            ),
            opcode: 77,
          },
        ],
        ip: 0,
        lastCodeSeparator: -1,
        operationCount: 0,
        program,
        signatureOperationsCount: 0,
        signedMessages: [],
        stack: [],
      },
      {
        alternateStack: [],
        controlStack: [],
        instructions: [
          {
            data: hexToBin(''),
            opcode: 0,
          },
          {
            data: hexToBin(
              '626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262',
            ),
            opcode: 77,
          },
        ],
        ip: 1,
        lastCodeSeparator: -1,
        operationCount: 0,
        program,
        signatureOperationsCount: 0,
        signedMessages: [],
        stack: [hexToBin('')],
      },
      {
        alternateStack: [],
        controlStack: [],
        error:
          'Program attempted to push a stack item that exceeded the maximum stack item length (520 bytes). Item length: 600 bytes.',
        instructions: [
          {
            data: hexToBin(''),
            opcode: 0,
          },
          {
            data: hexToBin(
              '626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262',
            ),
            opcode: 77,
          },
        ],
        ip: 2,
        lastCodeSeparator: -1,
        operationCount: 0,
        program,
        signatureOperationsCount: 0,
        signedMessages: [],
        stack: [hexToBin('')],
      },
      {
        alternateStack: [],
        controlStack: [],
        error:
          'Program attempted to push a stack item that exceeded the maximum stack item length (520 bytes). Item length: 600 bytes.',
        instructions: [
          {
            data: hexToBin(''),
            opcode: 0,
          },
          {
            data: hexToBin(
              '626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262',
            ),
            opcode: 77,
          },
        ],
        ip: 2,
        lastCodeSeparator: -1,
        operationCount: 0,
        program,
        signatureOperationsCount: 0,
        signedMessages: [],
        stack: [hexToBin('')],
      },
    ],
    stringifyTestVector(traceWithUnlockingPhaseAndFinalState),
  );

  t.deepEqual(extracted, {
    samples: [
      {
        evaluationRange,
        internalStates: [],
        range: {
          endColumn: 1,
          endLineNumber: 1,
          startColumn: 1,
          startLineNumber: 1,
        },
        state: trace[0],
      },
      {
        evaluationRange,
        instruction: { data: Uint8Array.of(), opcode: 0 },
        internalStates: [],
        range: nodes[0]!.range,
        state: trace[1],
      },
      {
        evaluationRange,
        instruction: {
          data: hexToBin(
            '626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262',
          ),
          opcode: 77,
        },
        internalStates: [],
        range: mergeRanges([nodes[0]!.range, nodes[1]!.range]),
        state: trace[2],
      },
    ],
    unmatchedStates: [trace[3]],
  });
});

test('extractEvaluationSamples: error3 - error occurs, so final state is dropped', (t) => {
  const result = compiler.generateBytecode({
    data: {},
    debug: true,
    scriptId: 'error3',
  });
  if (!result.success) {
    t.fail(stringifyErrors(result.errors));
    return;
  }
  const program = createAuthenticationProgramEvaluationCommon(result.bytecode);
  const nodes = result.reduce.script;
  const evaluationRange = result.reduce.range;
  const traceWithUnlockingPhaseAndFinalState = vm.debug(program);
  const trace = traceWithUnlockingPhaseAndFinalState.slice(1, -1);
  const extracted = extractEvaluationSamples({
    evaluationRange,
    nodes,
    trace,
  });
  t.deepEqual(
    nodes,
    [
      {
        bytecode: hexToBin('00'),
        range: {
          endColumn: 5,
          endLineNumber: 1,
          startColumn: 1,
          startLineNumber: 1,
        },
      },
      {
        bytecode: hexToBin('6a'),
        range: {
          endColumn: 15,
          endLineNumber: 1,
          startColumn: 6,
          startLineNumber: 1,
        },
      },
      {
        bytecode: hexToBin('00'),
        range: {
          endColumn: 20,
          endLineNumber: 1,
          startColumn: 16,
          startLineNumber: 1,
        },
      },
      {
        bytecode: hexToBin('00'),
        range: {
          endColumn: 25,
          endLineNumber: 1,
          startColumn: 21,
          startLineNumber: 1,
        },
      },
    ],
    stringifyTestVector(nodes),
  );

  t.deepEqual(
    traceWithUnlockingPhaseAndFinalState,
    [
      {
        alternateStack: [],
        controlStack: [],
        instructions: [],
        ip: 0,
        lastCodeSeparator: -1,
        operationCount: 0,
        program,
        signatureOperationsCount: 0,
        signedMessages: [],
        stack: [],
      },
      {
        alternateStack: [],
        controlStack: [],
        instructions: [
          {
            data: hexToBin(''),
            opcode: 0,
          },
          {
            opcode: 106,
          },
          {
            data: hexToBin(''),
            opcode: 0,
          },
          {
            data: hexToBin(''),
            opcode: 0,
          },
        ],
        ip: 0,
        lastCodeSeparator: -1,
        operationCount: 0,
        program,
        signatureOperationsCount: 0,
        signedMessages: [],
        stack: [],
      },
      {
        alternateStack: [],
        controlStack: [],
        instructions: [
          {
            data: hexToBin(''),
            opcode: 0,
          },
          {
            opcode: 106,
          },
          {
            data: hexToBin(''),
            opcode: 0,
          },
          {
            data: hexToBin(''),
            opcode: 0,
          },
        ],
        ip: 1,
        lastCodeSeparator: -1,
        operationCount: 0,
        program,
        signatureOperationsCount: 0,
        signedMessages: [],
        stack: [hexToBin('')],
      },
      {
        alternateStack: [],
        controlStack: [],
        error: 'Program called an OP_RETURN operation.',
        instructions: [
          {
            data: hexToBin(''),
            opcode: 0,
          },
          {
            opcode: 106,
          },
          {
            data: hexToBin(''),
            opcode: 0,
          },
          {
            data: hexToBin(''),
            opcode: 0,
          },
        ],
        ip: 2,
        lastCodeSeparator: -1,
        operationCount: 1,
        program,
        signatureOperationsCount: 0,
        signedMessages: [],
        stack: [hexToBin('')],
      },
      {
        alternateStack: [],
        controlStack: [],
        error: 'Program called an OP_RETURN operation.',
        instructions: [
          {
            data: hexToBin(''),
            opcode: 0,
          },
          {
            opcode: 106,
          },
          {
            data: hexToBin(''),
            opcode: 0,
          },
          {
            data: hexToBin(''),
            opcode: 0,
          },
        ],
        ip: 2,
        lastCodeSeparator: -1,
        operationCount: 1,
        program,
        signatureOperationsCount: 0,
        signedMessages: [],
        stack: [hexToBin('')],
      },
    ],
    stringifyTestVector(traceWithUnlockingPhaseAndFinalState),
  );

  t.deepEqual(
    extracted,
    {
      samples: [
        {
          evaluationRange,
          internalStates: [],
          range: {
            endColumn: 1,
            endLineNumber: 1,
            startColumn: 1,
            startLineNumber: 1,
          },
          state: trace[0],
        },
        {
          evaluationRange,
          instruction: { data: Uint8Array.of(), opcode: 0 },
          internalStates: [],
          range: nodes[0]!.range,
          state: trace[1],
        },
      ],
      unmatchedStates: [],
    },
    stringifyTestVector(extracted),
  );
});

test.failing(
  'extractEvaluationSamplesRecursive: complex, deeply-nested script with irregular spacing',
  (t) => {
    const result = compiler.generateBytecode({
      data: {},
      debug: true,
      scriptId: 'nested',
    });
    if (!result.success) {
      t.fail(stringifyErrors(result.errors));
      return;
    }
    const program = createAuthenticationProgramEvaluationCommon(
      result.bytecode,
    );
    const nodes = result.reduce.script;
    const evaluationRange = result.reduce.range;
    const traceWithUnlockingPhaseAndFinalState = vm.debug(program);
    const trace = traceWithUnlockingPhaseAndFinalState.slice(1);
    const sampleResult = extractEvaluationSamplesRecursive({
      evaluationRange,
      nodes,
      trace,
    });
    t.deepEqual(
      nodes,
      [
        {
          bytecode: hexToBin('00'),
          range: {
            endColumn: 5,
            endLineNumber: 1,
            startColumn: 1,
            startLineNumber: 1,
          },
        },
        {
          bytecode: hexToBin('03616263'),
          push: {
            bytecode: hexToBin('616263'),
            range: {
              endColumn: 15,
              endLineNumber: 20,
              startColumn: 3,
              startLineNumber: 4,
            },
            script: [
              {
                bytecode: hexToBin('616263'),
                range: {
                  endColumn: 4,
                  endLineNumber: 16,
                  startColumn: 3,
                  startLineNumber: 4,
                },
                source: {
                  bytecode: hexToBin('0000036162637e7e'),
                  range: {
                    endColumn: 9,
                    endLineNumber: 15,
                    startColumn: 3,
                    startLineNumber: 5,
                  },
                  script: [
                    {
                      bytecode: hexToBin('0000'),
                      range: {
                        endColumn: 9,
                        endLineNumber: 5,
                        startColumn: 3,
                        startLineNumber: 5,
                      },
                    },
                    {
                      bytecode: hexToBin('03'),
                      range: {
                        endColumn: 6,
                        endLineNumber: 11,
                        startColumn: 5,
                        startLineNumber: 6,
                      },
                      source: {
                        bytecode: hexToBin('515293'),
                        range: {
                          endColumn: 13,
                          endLineNumber: 9,
                          startColumn: 7,
                          startLineNumber: 6,
                        },
                        script: [
                          {
                            bytecode: hexToBin('51'),
                            range: {
                              endColumn: 16,
                              endLineNumber: 6,
                              startColumn: 7,
                              startLineNumber: 6,
                            },
                            source: {
                              bytecode: hexToBin('0151'),
                              range: {
                                endColumn: 15,
                                endLineNumber: 6,
                                startColumn: 9,
                                startLineNumber: 6,
                              },
                              script: [
                                {
                                  bytecode: hexToBin('0151'),
                                  push: {
                                    bytecode: hexToBin('51'),
                                    range: {
                                      endColumn: 14,
                                      endLineNumber: 6,
                                      startColumn: 10,
                                      startLineNumber: 6,
                                    },
                                    script: [
                                      {
                                        bytecode: hexToBin('51'),
                                        range: {
                                          endColumn: 14,
                                          endLineNumber: 6,
                                          startColumn: 10,
                                          startLineNumber: 6,
                                        },
                                      },
                                    ],
                                  },
                                  range: {
                                    endColumn: 15,
                                    endLineNumber: 6,
                                    startColumn: 9,
                                    startLineNumber: 6,
                                  },
                                },
                              ],
                            },
                            trace: [
                              {
                                alternateStack: [],
                                controlStack: [],
                                instructions: [],
                                ip: 0,
                                lastCodeSeparator: -1,
                                operationCount: 0,
                                program,
                                signatureOperationsCount: 0,
                                signedMessages: [],
                                stack: [],
                              },
                              {
                                alternateStack: [],
                                controlStack: [],
                                instructions: [
                                  {
                                    data: hexToBin('51'),
                                    opcode: 1,
                                  },
                                ],
                                ip: 0,
                                lastCodeSeparator: -1,
                                operationCount: 0,
                                program,
                                signatureOperationsCount: 0,
                                signedMessages: [],
                                stack: [],
                              },
                              {
                                alternateStack: [],
                                controlStack: [],
                                instructions: [
                                  {
                                    data: hexToBin('51'),
                                    opcode: 1,
                                  },
                                ],
                                ip: 1,
                                lastCodeSeparator: -1,
                                operationCount: 0,
                                program,
                                signatureOperationsCount: 0,
                                signedMessages: [],
                                stack: [hexToBin('51')],
                              },
                              {
                                alternateStack: [],
                                controlStack: [],
                                instructions: [
                                  {
                                    data: hexToBin('51'),
                                    opcode: 1,
                                  },
                                ],
                                ip: 1,
                                lastCodeSeparator: -1,
                                operationCount: 0,
                                program,
                                signatureOperationsCount: 0,
                                signedMessages: [],
                                stack: [hexToBin('51')],
                              },
                            ],
                          },
                          {
                            bytecode: hexToBin('52'),
                            range: {
                              endColumn: 11,
                              endLineNumber: 8,
                              startColumn: 7,
                              startLineNumber: 8,
                            },
                          },
                          {
                            bytecode: hexToBin('93'),
                            range: {
                              endColumn: 13,
                              endLineNumber: 9,
                              startColumn: 7,
                              startLineNumber: 9,
                            },
                          },
                        ],
                      },
                      trace: [
                        {
                          alternateStack: [],
                          controlStack: [],
                          instructions: [],
                          ip: 0,
                          lastCodeSeparator: -1,
                          operationCount: 0,
                          program,
                          signatureOperationsCount: 0,
                          signedMessages: [],
                          stack: [],
                        },
                        {
                          alternateStack: [],
                          controlStack: [],
                          instructions: [
                            {
                              opcode: 81,
                            },
                            {
                              opcode: 82,
                            },
                            {
                              opcode: 147,
                            },
                          ],
                          ip: 0,
                          lastCodeSeparator: -1,
                          operationCount: 0,
                          program,
                          signatureOperationsCount: 0,
                          signedMessages: [],
                          stack: [],
                        },
                        {
                          alternateStack: [],
                          controlStack: [],
                          instructions: [
                            {
                              opcode: 81,
                            },
                            {
                              opcode: 82,
                            },
                            {
                              opcode: 147,
                            },
                          ],
                          ip: 1,
                          lastCodeSeparator: -1,
                          operationCount: 0,
                          program,
                          signatureOperationsCount: 0,
                          signedMessages: [],
                          stack: [hexToBin('01')],
                        },
                        {
                          alternateStack: [],
                          controlStack: [],
                          instructions: [
                            {
                              opcode: 81,
                            },
                            {
                              opcode: 82,
                            },
                            {
                              opcode: 147,
                            },
                          ],
                          ip: 2,
                          lastCodeSeparator: -1,
                          operationCount: 0,
                          program,
                          signatureOperationsCount: 0,
                          signedMessages: [],
                          stack: [hexToBin('01'), hexToBin('02')],
                        },
                        {
                          alternateStack: [],
                          controlStack: [],
                          instructions: [
                            {
                              opcode: 81,
                            },
                            {
                              opcode: 82,
                            },
                            {
                              opcode: 147,
                            },
                          ],
                          ip: 3,
                          lastCodeSeparator: -1,
                          operationCount: 1,
                          program,
                          signatureOperationsCount: 0,
                          signedMessages: [],
                          stack: [hexToBin('03')],
                        },
                        {
                          alternateStack: [],
                          controlStack: [],
                          instructions: [
                            {
                              opcode: 81,
                            },
                            {
                              opcode: 82,
                            },
                            {
                              opcode: 147,
                            },
                          ],
                          ip: 3,
                          lastCodeSeparator: -1,
                          operationCount: 1,
                          program,
                          signatureOperationsCount: 0,
                          signedMessages: [],
                          stack: [hexToBin('03')],
                        },
                      ],
                    },
                    {
                      bytecode: hexToBin('616263'),
                      range: {
                        endColumn: 6,
                        endLineNumber: 13,
                        startColumn: 5,
                        startLineNumber: 12,
                      },
                      source: {
                        bytecode: hexToBin('03616263'),
                        range: {
                          endColumn: 15,
                          endLineNumber: 12,
                          startColumn: 8,
                          startLineNumber: 12,
                        },
                        script: [
                          {
                            bytecode: hexToBin('03616263'),
                            push: {
                              bytecode: hexToBin('616263'),
                              range: {
                                endColumn: 14,
                                endLineNumber: 12,
                                startColumn: 9,
                                startLineNumber: 12,
                              },
                              script: [
                                {
                                  bytecode: hexToBin('616263'),
                                  range: {
                                    endColumn: 14,
                                    endLineNumber: 12,
                                    startColumn: 9,
                                    startLineNumber: 12,
                                  },
                                },
                              ],
                            },
                            range: {
                              endColumn: 15,
                              endLineNumber: 12,
                              startColumn: 8,
                              startLineNumber: 12,
                            },
                          },
                        ],
                      },
                      trace: [
                        {
                          alternateStack: [],
                          controlStack: [],
                          instructions: [],
                          ip: 0,
                          lastCodeSeparator: -1,
                          operationCount: 0,
                          program,
                          signatureOperationsCount: 0,
                          signedMessages: [],
                          stack: [],
                        },
                        {
                          alternateStack: [],
                          controlStack: [],
                          instructions: [
                            {
                              data: hexToBin('616263'),
                              opcode: 3,
                            },
                          ],
                          ip: 0,
                          lastCodeSeparator: -1,
                          operationCount: 0,
                          program,
                          signatureOperationsCount: 0,
                          signedMessages: [],
                          stack: [],
                        },
                        {
                          alternateStack: [],
                          controlStack: [],
                          instructions: [
                            {
                              data: hexToBin('616263'),
                              opcode: 3,
                            },
                          ],
                          ip: 1,
                          lastCodeSeparator: -1,
                          operationCount: 0,
                          program,
                          signatureOperationsCount: 0,
                          signedMessages: [],
                          stack: [hexToBin('616263')],
                        },
                        {
                          alternateStack: [],
                          controlStack: [],
                          instructions: [
                            {
                              data: hexToBin('616263'),
                              opcode: 3,
                            },
                          ],
                          ip: 1,
                          lastCodeSeparator: -1,
                          operationCount: 0,
                          program,
                          signatureOperationsCount: 0,
                          signedMessages: [],
                          stack: [hexToBin('616263')],
                        },
                      ],
                    },
                    {
                      bytecode: hexToBin('7e'),
                      range: {
                        endColumn: 9,
                        endLineNumber: 14,
                        startColumn: 3,
                        startLineNumber: 14,
                      },
                    },
                    {
                      bytecode: hexToBin('7e'),
                      range: {
                        endColumn: 9,
                        endLineNumber: 15,
                        startColumn: 3,
                        startLineNumber: 15,
                      },
                    },
                  ],
                },
                trace: [
                  {
                    alternateStack: [],
                    controlStack: [],
                    instructions: [],
                    ip: 0,
                    lastCodeSeparator: -1,
                    operationCount: 0,
                    program,
                    signatureOperationsCount: 0,
                    signedMessages: [],
                    stack: [],
                  },
                  {
                    alternateStack: [],
                    controlStack: [],
                    instructions: [
                      {
                        data: hexToBin(''),
                        opcode: 0,
                      },
                      {
                        data: hexToBin(''),
                        opcode: 0,
                      },
                      {
                        data: hexToBin('616263'),
                        opcode: 3,
                      },
                      {
                        opcode: 126,
                      },
                      {
                        opcode: 126,
                      },
                    ],
                    ip: 0,
                    lastCodeSeparator: -1,
                    operationCount: 0,
                    program,
                    signatureOperationsCount: 0,
                    signedMessages: [],
                    stack: [],
                  },
                  {
                    alternateStack: [],
                    controlStack: [],
                    instructions: [
                      {
                        data: hexToBin(''),
                        opcode: 0,
                      },
                      {
                        data: hexToBin(''),
                        opcode: 0,
                      },
                      {
                        data: hexToBin('616263'),
                        opcode: 3,
                      },
                      {
                        opcode: 126,
                      },
                      {
                        opcode: 126,
                      },
                    ],
                    ip: 1,
                    lastCodeSeparator: -1,
                    operationCount: 0,
                    program,
                    signatureOperationsCount: 0,
                    signedMessages: [],
                    stack: [hexToBin('')],
                  },
                  {
                    alternateStack: [],
                    controlStack: [],
                    instructions: [
                      {
                        data: hexToBin(''),
                        opcode: 0,
                      },
                      {
                        data: hexToBin(''),
                        opcode: 0,
                      },
                      {
                        data: hexToBin('616263'),
                        opcode: 3,
                      },
                      {
                        opcode: 126,
                      },
                      {
                        opcode: 126,
                      },
                    ],
                    ip: 2,
                    lastCodeSeparator: -1,
                    operationCount: 0,
                    program,
                    signatureOperationsCount: 0,
                    signedMessages: [],
                    stack: [hexToBin(''), hexToBin('')],
                  },
                  {
                    alternateStack: [],
                    controlStack: [],
                    instructions: [
                      {
                        data: hexToBin(''),
                        opcode: 0,
                      },
                      {
                        data: hexToBin(''),
                        opcode: 0,
                      },
                      {
                        data: hexToBin('616263'),
                        opcode: 3,
                      },
                      {
                        opcode: 126,
                      },
                      {
                        opcode: 126,
                      },
                    ],
                    ip: 3,
                    lastCodeSeparator: -1,
                    operationCount: 0,
                    program,
                    signatureOperationsCount: 0,
                    signedMessages: [],
                    stack: [hexToBin(''), hexToBin(''), hexToBin('616263')],
                  },
                  {
                    alternateStack: [],
                    controlStack: [],
                    instructions: [
                      {
                        data: hexToBin(''),
                        opcode: 0,
                      },
                      {
                        data: hexToBin(''),
                        opcode: 0,
                      },
                      {
                        data: hexToBin('616263'),
                        opcode: 3,
                      },
                      {
                        opcode: 126,
                      },
                      {
                        opcode: 126,
                      },
                    ],
                    ip: 4,
                    lastCodeSeparator: -1,
                    operationCount: 1,
                    program,
                    signatureOperationsCount: 0,
                    signedMessages: [],
                    stack: [hexToBin(''), hexToBin('616263')],
                  },
                  {
                    alternateStack: [],
                    controlStack: [],
                    instructions: [
                      {
                        data: hexToBin(''),
                        opcode: 0,
                      },
                      {
                        data: hexToBin(''),
                        opcode: 0,
                      },
                      {
                        data: hexToBin('616263'),
                        opcode: 3,
                      },
                      {
                        opcode: 126,
                      },
                      {
                        opcode: 126,
                      },
                    ],
                    ip: 5,
                    lastCodeSeparator: -1,
                    operationCount: 2,
                    program,
                    signatureOperationsCount: 0,
                    signedMessages: [],
                    stack: [hexToBin('616263')],
                  },
                  {
                    alternateStack: [],
                    controlStack: [],
                    instructions: [
                      {
                        data: hexToBin(''),
                        opcode: 0,
                      },
                      {
                        data: hexToBin(''),
                        opcode: 0,
                      },
                      {
                        data: hexToBin('616263'),
                        opcode: 3,
                      },
                      {
                        opcode: 126,
                      },
                      {
                        opcode: 126,
                      },
                    ],
                    ip: 5,
                    lastCodeSeparator: -1,
                    operationCount: 2,
                    program,
                    signatureOperationsCount: 0,
                    signedMessages: [],
                    stack: [hexToBin('616263')],
                  },
                ],
              },
              {
                bytecode: hexToBin(''),
                range: {
                  endColumn: 15,
                  endLineNumber: 20,
                  startColumn: 3,
                  startLineNumber: 17,
                },
                source: {
                  bytecode: hexToBin('00007e'),
                  range: {
                    endColumn: 14,
                    endLineNumber: 20,
                    startColumn: 5,
                    startLineNumber: 18,
                  },
                  script: [
                    {
                      bytecode: hexToBin('00'),
                      push: {
                        bytecode: hexToBin(''),
                        range: {
                          endColumn: 7,
                          endLineNumber: 18,
                          startColumn: 6,
                          startLineNumber: 18,
                        },
                        script: [
                          {
                            bytecode: hexToBin(''),
                            range: {
                              endColumn: 7,
                              endLineNumber: 18,
                              startColumn: 6,
                              startLineNumber: 18,
                            },
                          },
                        ],
                      },
                      range: {
                        endColumn: 8,
                        endLineNumber: 18,
                        startColumn: 5,
                        startLineNumber: 18,
                      },
                    },
                    {
                      bytecode: hexToBin('00'),
                      push: {
                        bytecode: hexToBin(''),
                        range: {
                          endColumn: 7,
                          endLineNumber: 19,
                          startColumn: 6,
                          startLineNumber: 19,
                        },
                        script: [
                          {
                            bytecode: hexToBin(''),
                            range: {
                              endColumn: 7,
                              endLineNumber: 19,
                              startColumn: 6,
                              startLineNumber: 19,
                            },
                          },
                        ],
                      },
                      range: {
                        endColumn: 8,
                        endLineNumber: 19,
                        startColumn: 5,
                        startLineNumber: 19,
                      },
                    },
                    {
                      bytecode: hexToBin('7e'),
                      range: {
                        endColumn: 14,
                        endLineNumber: 20,
                        startColumn: 3,
                        startLineNumber: 20,
                      },
                      source: {
                        bytecode: hexToBin('017e'),
                        range: {
                          endColumn: 13,
                          endLineNumber: 20,
                          startColumn: 5,
                          startLineNumber: 20,
                        },
                        script: [
                          {
                            bytecode: hexToBin('017e'),
                            push: {
                              bytecode: hexToBin('7e'),
                              range: {
                                endColumn: 12,
                                endLineNumber: 20,
                                startColumn: 6,
                                startLineNumber: 20,
                              },
                              script: [
                                {
                                  bytecode: hexToBin('7e'),
                                  range: {
                                    endColumn: 12,
                                    endLineNumber: 20,
                                    startColumn: 6,
                                    startLineNumber: 20,
                                  },
                                },
                              ],
                            },
                            range: {
                              endColumn: 13,
                              endLineNumber: 20,
                              startColumn: 5,
                              startLineNumber: 20,
                            },
                          },
                        ],
                      },
                      trace: [
                        {
                          alternateStack: [],
                          controlStack: [],
                          instructions: [],
                          ip: 0,
                          lastCodeSeparator: -1,
                          operationCount: 0,
                          program,
                          signatureOperationsCount: 0,
                          signedMessages: [],
                          stack: [],
                        },
                        {
                          alternateStack: [],
                          controlStack: [],
                          instructions: [
                            {
                              data: hexToBin('7e'),
                              opcode: 1,
                            },
                          ],
                          ip: 0,
                          lastCodeSeparator: -1,
                          operationCount: 0,
                          program,
                          signatureOperationsCount: 0,
                          signedMessages: [],
                          stack: [],
                        },
                        {
                          alternateStack: [],
                          controlStack: [],
                          instructions: [
                            {
                              data: hexToBin('7e'),
                              opcode: 1,
                            },
                          ],
                          ip: 1,
                          lastCodeSeparator: -1,
                          operationCount: 0,
                          program,
                          signatureOperationsCount: 0,
                          signedMessages: [],
                          stack: [hexToBin('7e')],
                        },
                        {
                          alternateStack: [],
                          controlStack: [],
                          instructions: [
                            {
                              data: hexToBin('7e'),
                              opcode: 1,
                            },
                          ],
                          ip: 1,
                          lastCodeSeparator: -1,
                          operationCount: 0,
                          program,
                          signatureOperationsCount: 0,
                          signedMessages: [],
                          stack: [hexToBin('7e')],
                        },
                      ],
                    },
                  ],
                },
                trace: [
                  {
                    alternateStack: [],
                    controlStack: [],
                    instructions: [],
                    ip: 0,
                    lastCodeSeparator: -1,
                    operationCount: 0,
                    program,
                    signatureOperationsCount: 0,
                    signedMessages: [],
                    stack: [],
                  },
                  {
                    alternateStack: [],
                    controlStack: [],
                    instructions: [
                      {
                        data: hexToBin(''),
                        opcode: 0,
                      },
                      {
                        data: hexToBin(''),
                        opcode: 0,
                      },
                      {
                        opcode: 126,
                      },
                    ],
                    ip: 0,
                    lastCodeSeparator: -1,
                    operationCount: 0,
                    program,
                    signatureOperationsCount: 0,
                    signedMessages: [],
                    stack: [],
                  },
                  {
                    alternateStack: [],
                    controlStack: [],
                    instructions: [
                      {
                        data: hexToBin(''),
                        opcode: 0,
                      },
                      {
                        data: hexToBin(''),
                        opcode: 0,
                      },
                      {
                        opcode: 126,
                      },
                    ],
                    ip: 1,
                    lastCodeSeparator: -1,
                    operationCount: 0,
                    program,
                    signatureOperationsCount: 0,
                    signedMessages: [],
                    stack: [hexToBin('')],
                  },
                  {
                    alternateStack: [],
                    controlStack: [],
                    instructions: [
                      {
                        data: hexToBin(''),
                        opcode: 0,
                      },
                      {
                        data: hexToBin(''),
                        opcode: 0,
                      },
                      {
                        opcode: 126,
                      },
                    ],
                    ip: 2,
                    lastCodeSeparator: -1,
                    operationCount: 0,
                    program,
                    signatureOperationsCount: 0,
                    signedMessages: [],
                    stack: [hexToBin(''), hexToBin('')],
                  },
                  {
                    alternateStack: [],
                    controlStack: [],
                    instructions: [
                      {
                        data: hexToBin(''),
                        opcode: 0,
                      },
                      {
                        data: hexToBin(''),
                        opcode: 0,
                      },
                      {
                        opcode: 126,
                      },
                    ],
                    ip: 3,
                    lastCodeSeparator: -1,
                    operationCount: 1,
                    program,
                    signatureOperationsCount: 0,
                    signedMessages: [],
                    stack: [hexToBin('')],
                  },
                  {
                    alternateStack: [],
                    controlStack: [],
                    instructions: [
                      {
                        data: hexToBin(''),
                        opcode: 0,
                      },
                      {
                        data: hexToBin(''),
                        opcode: 0,
                      },
                      {
                        opcode: 126,
                      },
                    ],
                    ip: 3,
                    lastCodeSeparator: -1,
                    operationCount: 1,
                    program,
                    signatureOperationsCount: 0,
                    signedMessages: [],
                    stack: [hexToBin('')],
                  },
                ],
              },
            ],
          },
          range: {
            endColumn: 2,
            endLineNumber: 21,
            startColumn: 1,
            startLineNumber: 3,
          },
        },
      ],
      stringifyTestVector(nodes),
    );

    t.deepEqual(
      traceWithUnlockingPhaseAndFinalState,
      [
        {
          alternateStack: [],
          controlStack: [],
          instructions: [],
          ip: 0,
          lastCodeSeparator: -1,
          operationCount: 0,
          program,
          signatureOperationsCount: 0,
          signedMessages: [],
          stack: [],
        },
        {
          alternateStack: [],
          controlStack: [],
          instructions: [
            {
              data: hexToBin(''),
              opcode: 0,
            },
            {
              data: hexToBin('616263'),
              opcode: 3,
            },
          ],
          ip: 0,
          lastCodeSeparator: -1,
          operationCount: 0,
          program,
          signatureOperationsCount: 0,
          signedMessages: [],
          stack: [],
        },
        {
          alternateStack: [],
          controlStack: [],
          instructions: [
            {
              data: hexToBin(''),
              opcode: 0,
            },
            {
              data: hexToBin('616263'),
              opcode: 3,
            },
          ],
          ip: 1,
          lastCodeSeparator: -1,
          operationCount: 0,
          program,
          signatureOperationsCount: 0,
          signedMessages: [],
          stack: [hexToBin('')],
        },
        {
          alternateStack: [],
          controlStack: [],
          instructions: [
            {
              data: hexToBin(''),
              opcode: 0,
            },
            {
              data: hexToBin('616263'),
              opcode: 3,
            },
          ],
          ip: 2,
          lastCodeSeparator: -1,
          operationCount: 0,
          program,
          signatureOperationsCount: 0,
          signedMessages: [],
          stack: [hexToBin(''), hexToBin('616263')],
        },
        {
          alternateStack: [],
          controlStack: [],
          instructions: [
            {
              data: hexToBin(''),
              opcode: 0,
            },
            {
              data: hexToBin('616263'),
              opcode: 3,
            },
          ],
          ip: 2,
          lastCodeSeparator: -1,
          operationCount: 0,
          program,
          signatureOperationsCount: 0,
          signedMessages: [],
          stack: [hexToBin(''), hexToBin('616263')],
        },
      ],
      stringifyTestVector(traceWithUnlockingPhaseAndFinalState),
    );

    t.deepEqual(
      sampleResult,
      {
        samples: [
          {
            evaluationRange: {
              endColumn: 2,
              endLineNumber: 21,
              startColumn: 1,
              startLineNumber: 1,
            },
            internalStates: [],
            range: {
              endColumn: 1,
              endLineNumber: 1,
              startColumn: 1,
              startLineNumber: 1,
            },
            state: {
              alternateStack: [],
              controlStack: [],
              instructions: [
                {
                  data: hexToBin(''),
                  opcode: 0,
                },
                {
                  data: hexToBin('616263'),
                  opcode: 3,
                },
              ],
              ip: 0,
              lastCodeSeparator: -1,
              operationCount: 0,
              program,
              signatureOperationsCount: 0,
              signedMessages: [],
              stack: [],
            },
          },
          {
            evaluationRange: {
              endColumn: 2,
              endLineNumber: 21,
              startColumn: 1,
              startLineNumber: 1,
            },
            instruction: {
              data: hexToBin(''),
              opcode: 0,
            },
            internalStates: [],
            range: {
              endColumn: 5,
              endLineNumber: 1,
              startColumn: 1,
              startLineNumber: 1,
            },
            state: {
              alternateStack: [],
              controlStack: [],
              instructions: [
                {
                  data: hexToBin(''),
                  opcode: 0,
                },
                {
                  data: hexToBin('616263'),
                  opcode: 3,
                },
              ],
              ip: 1,
              lastCodeSeparator: -1,
              operationCount: 0,
              program,
              signatureOperationsCount: 0,
              signedMessages: [],
              stack: [hexToBin('')],
            },
          },
          {
            evaluationRange: {
              endColumn: 3,
              endLineNumber: 16,
              startColumn: 5,
              startLineNumber: 4,
            },
            internalStates: [],
            range: {
              endColumn: 5,
              endLineNumber: 4,
              startColumn: 5,
              startLineNumber: 4,
            },
            state: {
              alternateStack: [],
              controlStack: [],
              instructions: [
                {
                  data: hexToBin(''),
                  opcode: 0,
                },
                {
                  data: hexToBin(''),
                  opcode: 0,
                },
                {
                  data: hexToBin('616263'),
                  opcode: 3,
                },
                {
                  opcode: 126,
                },
                {
                  opcode: 126,
                },
              ],
              ip: 0,
              lastCodeSeparator: -1,
              operationCount: 0,
              program,
              signatureOperationsCount: 0,
              signedMessages: [],
              stack: [],
            },
          },
          {
            evaluationRange: {
              endColumn: 3,
              endLineNumber: 16,
              startColumn: 5,
              startLineNumber: 4,
            },
            instruction: {
              data: hexToBin(''),
              opcode: 0,
            },
            internalStates: [
              {
                instruction: {
                  data: hexToBin(''),
                  opcode: 0,
                },
                state: {
                  alternateStack: [],
                  controlStack: [],
                  instructions: [
                    {
                      data: hexToBin(''),
                      opcode: 0,
                    },
                    {
                      data: hexToBin(''),
                      opcode: 0,
                    },
                    {
                      data: hexToBin('616263'),
                      opcode: 3,
                    },
                    {
                      opcode: 126,
                    },
                    {
                      opcode: 126,
                    },
                  ],
                  ip: 1,
                  lastCodeSeparator: -1,
                  operationCount: 0,
                  program,
                  signatureOperationsCount: 0,
                  signedMessages: [],
                  stack: [hexToBin('')],
                },
              },
            ],
            range: {
              endColumn: 9,
              endLineNumber: 5,
              startColumn: 3,
              startLineNumber: 5,
            },
            state: {
              alternateStack: [],
              controlStack: [],
              instructions: [
                {
                  data: hexToBin(''),
                  opcode: 0,
                },
                {
                  data: hexToBin(''),
                  opcode: 0,
                },
                {
                  data: hexToBin('616263'),
                  opcode: 3,
                },
                {
                  opcode: 126,
                },
                {
                  opcode: 126,
                },
              ],
              ip: 2,
              lastCodeSeparator: -1,
              operationCount: 0,
              program,
              signatureOperationsCount: 0,
              signedMessages: [],
              stack: [hexToBin(''), hexToBin('')],
            },
          },
          {
            evaluationRange: {
              endColumn: 5,
              endLineNumber: 11,
              startColumn: 7,
              startLineNumber: 6,
            },
            internalStates: [],
            range: {
              endColumn: 7,
              endLineNumber: 6,
              startColumn: 7,
              startLineNumber: 6,
            },
            state: {
              alternateStack: [],
              controlStack: [],
              instructions: [
                {
                  opcode: 81,
                },
                {
                  opcode: 82,
                },
                {
                  opcode: 147,
                },
              ],
              ip: 0,
              lastCodeSeparator: -1,
              operationCount: 0,
              program,
              signatureOperationsCount: 0,
              signedMessages: [],
              stack: [],
            },
          },
          {
            evaluationRange: {
              endColumn: 15,
              endLineNumber: 6,
              startColumn: 9,
              startLineNumber: 6,
            },
            internalStates: [],
            range: {
              endColumn: 9,
              endLineNumber: 6,
              startColumn: 9,
              startLineNumber: 6,
            },
            state: {
              alternateStack: [],
              controlStack: [],
              instructions: [
                {
                  data: hexToBin('51'),
                  opcode: 1,
                },
              ],
              ip: 0,
              lastCodeSeparator: -1,
              operationCount: 0,
              program,
              signatureOperationsCount: 0,
              signedMessages: [],
              stack: [],
            },
          },
          {
            evaluationRange: {
              endColumn: 15,
              endLineNumber: 6,
              startColumn: 9,
              startLineNumber: 6,
            },
            instruction: {
              data: hexToBin('51'),
              opcode: 1,
            },
            internalStates: [],
            range: {
              endColumn: 15,
              endLineNumber: 6,
              startColumn: 9,
              startLineNumber: 6,
            },
            state: {
              alternateStack: [],
              controlStack: [],
              instructions: [
                {
                  data: hexToBin('51'),
                  opcode: 1,
                },
              ],
              ip: 1,
              lastCodeSeparator: -1,
              operationCount: 0,
              program,
              signatureOperationsCount: 0,
              signedMessages: [],
              stack: [hexToBin('51')],
            },
          },
          {
            evaluationRange: {
              endColumn: 5,
              endLineNumber: 11,
              startColumn: 7,
              startLineNumber: 6,
            },
            instruction: {
              opcode: 81,
            },
            internalStates: [],
            range: {
              endColumn: 16,
              endLineNumber: 6,
              startColumn: 7,
              startLineNumber: 6,
            },
            state: {
              alternateStack: [],
              controlStack: [],
              instructions: [
                {
                  opcode: 81,
                },
                {
                  opcode: 82,
                },
                {
                  opcode: 147,
                },
              ],
              ip: 1,
              lastCodeSeparator: -1,
              operationCount: 0,
              program,
              signatureOperationsCount: 0,
              signedMessages: [],
              stack: [hexToBin('01')],
            },
          },
          {
            evaluationRange: {
              endColumn: 5,
              endLineNumber: 11,
              startColumn: 7,
              startLineNumber: 6,
            },
            instruction: {
              opcode: 82,
            },
            internalStates: [],
            range: {
              endColumn: 11,
              endLineNumber: 8,
              startColumn: 7,
              startLineNumber: 8,
            },
            state: {
              alternateStack: [],
              controlStack: [],
              instructions: [
                {
                  opcode: 81,
                },
                {
                  opcode: 82,
                },
                {
                  opcode: 147,
                },
              ],
              ip: 2,
              lastCodeSeparator: -1,
              operationCount: 0,
              program,
              signatureOperationsCount: 0,
              signedMessages: [],
              stack: [hexToBin('01'), hexToBin('02')],
            },
          },
          {
            evaluationRange: {
              endColumn: 5,
              endLineNumber: 11,
              startColumn: 7,
              startLineNumber: 6,
            },
            instruction: {
              opcode: 147,
            },
            internalStates: [],
            range: {
              endColumn: 13,
              endLineNumber: 9,
              startColumn: 7,
              startLineNumber: 9,
            },
            state: {
              alternateStack: [],
              controlStack: [],
              instructions: [
                {
                  opcode: 81,
                },
                {
                  opcode: 82,
                },
                {
                  opcode: 147,
                },
              ],
              ip: 3,
              lastCodeSeparator: -1,
              operationCount: 1,
              program,
              signatureOperationsCount: 0,
              signedMessages: [],
              stack: [hexToBin('03')],
            },
          },
          {
            evaluationRange: {
              endColumn: 5,
              endLineNumber: 13,
              startColumn: 7,
              startLineNumber: 12,
            },
            internalStates: [],
            range: {
              endColumn: 7,
              endLineNumber: 12,
              startColumn: 7,
              startLineNumber: 12,
            },
            state: {
              alternateStack: [],
              controlStack: [],
              instructions: [
                {
                  data: hexToBin('616263'),
                  opcode: 3,
                },
              ],
              ip: 0,
              lastCodeSeparator: -1,
              operationCount: 0,
              program,
              signatureOperationsCount: 0,
              signedMessages: [],
              stack: [],
            },
          },
          {
            evaluationRange: {
              endColumn: 5,
              endLineNumber: 13,
              startColumn: 7,
              startLineNumber: 12,
            },
            instruction: {
              data: hexToBin('616263'),
              opcode: 3,
            },
            internalStates: [],
            range: {
              endColumn: 15,
              endLineNumber: 12,
              startColumn: 8,
              startLineNumber: 12,
            },
            state: {
              alternateStack: [],
              controlStack: [],
              instructions: [
                {
                  data: hexToBin('616263'),
                  opcode: 3,
                },
              ],
              ip: 1,
              lastCodeSeparator: -1,
              operationCount: 0,
              program,
              signatureOperationsCount: 0,
              signedMessages: [],
              stack: [hexToBin('616263')],
            },
          },
          {
            evaluationRange: {
              endColumn: 3,
              endLineNumber: 16,
              startColumn: 5,
              startLineNumber: 4,
            },
            instruction: {
              data: hexToBin('616263'),
              opcode: 3,
            },
            internalStates: [],
            range: {
              endColumn: 6,
              endLineNumber: 13,
              startColumn: 5,
              startLineNumber: 6,
            },
            state: {
              alternateStack: [],
              controlStack: [],
              instructions: [
                {
                  data: hexToBin(''),
                  opcode: 0,
                },
                {
                  data: hexToBin(''),
                  opcode: 0,
                },
                {
                  data: hexToBin('616263'),
                  opcode: 3,
                },
                {
                  opcode: 126,
                },
                {
                  opcode: 126,
                },
              ],
              ip: 3,
              lastCodeSeparator: -1,
              operationCount: 0,
              program,
              signatureOperationsCount: 0,
              signedMessages: [],
              stack: [hexToBin(''), hexToBin(''), hexToBin('616263')],
            },
          },
          {
            evaluationRange: {
              endColumn: 3,
              endLineNumber: 16,
              startColumn: 5,
              startLineNumber: 4,
            },
            instruction: {
              opcode: 126,
            },
            internalStates: [],
            range: {
              endColumn: 9,
              endLineNumber: 14,
              startColumn: 3,
              startLineNumber: 14,
            },
            state: {
              alternateStack: [],
              controlStack: [],
              instructions: [
                {
                  data: hexToBin(''),
                  opcode: 0,
                },
                {
                  data: hexToBin(''),
                  opcode: 0,
                },
                {
                  data: hexToBin('616263'),
                  opcode: 3,
                },
                {
                  opcode: 126,
                },
                {
                  opcode: 126,
                },
              ],
              ip: 4,
              lastCodeSeparator: -1,
              operationCount: 1,
              program,
              signatureOperationsCount: 0,
              signedMessages: [],
              stack: [hexToBin(''), hexToBin('616263')],
            },
          },
          {
            evaluationRange: {
              endColumn: 3,
              endLineNumber: 16,
              startColumn: 5,
              startLineNumber: 4,
            },
            instruction: {
              opcode: 126,
            },
            internalStates: [],
            range: {
              endColumn: 9,
              endLineNumber: 15,
              startColumn: 3,
              startLineNumber: 15,
            },
            state: {
              alternateStack: [],
              controlStack: [],
              instructions: [
                {
                  data: hexToBin(''),
                  opcode: 0,
                },
                {
                  data: hexToBin(''),
                  opcode: 0,
                },
                {
                  data: hexToBin('616263'),
                  opcode: 3,
                },
                {
                  opcode: 126,
                },
                {
                  opcode: 126,
                },
              ],
              ip: 5,
              lastCodeSeparator: -1,
              operationCount: 2,
              program,
              signatureOperationsCount: 0,
              signedMessages: [],
              stack: [hexToBin('616263')],
            },
          },
          {
            evaluationRange: {
              endColumn: 14,
              endLineNumber: 20,
              startColumn: 5,
              startLineNumber: 17,
            },
            internalStates: [],
            range: {
              endColumn: 5,
              endLineNumber: 17,
              startColumn: 5,
              startLineNumber: 17,
            },
            state: {
              alternateStack: [],
              controlStack: [],
              instructions: [
                {
                  data: hexToBin(''),
                  opcode: 0,
                },
                {
                  data: hexToBin(''),
                  opcode: 0,
                },
                {
                  opcode: 126,
                },
              ],
              ip: 0,
              lastCodeSeparator: -1,
              operationCount: 0,
              program,
              signatureOperationsCount: 0,
              signedMessages: [],
              stack: [],
            },
          },
          {
            evaluationRange: {
              endColumn: 14,
              endLineNumber: 20,
              startColumn: 5,
              startLineNumber: 17,
            },
            instruction: {
              data: hexToBin(''),
              opcode: 0,
            },
            internalStates: [],
            range: {
              endColumn: 8,
              endLineNumber: 18,
              startColumn: 5,
              startLineNumber: 18,
            },
            state: {
              alternateStack: [],
              controlStack: [],
              instructions: [
                {
                  data: hexToBin(''),
                  opcode: 0,
                },
                {
                  data: hexToBin(''),
                  opcode: 0,
                },
                {
                  opcode: 126,
                },
              ],
              ip: 1,
              lastCodeSeparator: -1,
              operationCount: 0,
              program,
              signatureOperationsCount: 0,
              signedMessages: [],
              stack: [hexToBin('')],
            },
          },
          {
            evaluationRange: {
              endColumn: 14,
              endLineNumber: 20,
              startColumn: 5,
              startLineNumber: 17,
            },
            instruction: {
              data: hexToBin(''),
              opcode: 0,
            },
            internalStates: [],
            range: {
              endColumn: 8,
              endLineNumber: 19,
              startColumn: 5,
              startLineNumber: 19,
            },
            state: {
              alternateStack: [],
              controlStack: [],
              instructions: [
                {
                  data: hexToBin(''),
                  opcode: 0,
                },
                {
                  data: hexToBin(''),
                  opcode: 0,
                },
                {
                  opcode: 126,
                },
              ],
              ip: 2,
              lastCodeSeparator: -1,
              operationCount: 0,
              program,
              signatureOperationsCount: 0,
              signedMessages: [],
              stack: [hexToBin(''), hexToBin('')],
            },
          },
          {
            evaluationRange: {
              endColumn: 13,
              endLineNumber: 20,
              startColumn: 5,
              startLineNumber: 20,
            },
            internalStates: [],
            range: {
              endColumn: 5,
              endLineNumber: 20,
              startColumn: 5,
              startLineNumber: 20,
            },
            state: {
              alternateStack: [],
              controlStack: [],
              instructions: [
                {
                  data: hexToBin('7e'),
                  opcode: 1,
                },
              ],
              ip: 0,
              lastCodeSeparator: -1,
              operationCount: 0,
              program,
              signatureOperationsCount: 0,
              signedMessages: [],
              stack: [],
            },
          },
          {
            evaluationRange: {
              endColumn: 13,
              endLineNumber: 20,
              startColumn: 5,
              startLineNumber: 20,
            },
            instruction: {
              data: hexToBin('7e'),
              opcode: 1,
            },
            internalStates: [],
            range: {
              endColumn: 13,
              endLineNumber: 20,
              startColumn: 5,
              startLineNumber: 20,
            },
            state: {
              alternateStack: [],
              controlStack: [],
              instructions: [
                {
                  data: hexToBin('7e'),
                  opcode: 1,
                },
              ],
              ip: 1,
              lastCodeSeparator: -1,
              operationCount: 0,
              program,
              signatureOperationsCount: 0,
              signedMessages: [],
              stack: [hexToBin('7e')],
            },
          },
          {
            evaluationRange: {
              endColumn: 14,
              endLineNumber: 20,
              startColumn: 5,
              startLineNumber: 17,
            },
            instruction: {
              opcode: 126,
            },
            internalStates: [],
            range: {
              endColumn: 14,
              endLineNumber: 20,
              startColumn: 3,
              startLineNumber: 20,
            },
            state: {
              alternateStack: [],
              controlStack: [],
              instructions: [
                {
                  data: hexToBin(''),
                  opcode: 0,
                },
                {
                  data: hexToBin(''),
                  opcode: 0,
                },
                {
                  opcode: 126,
                },
              ],
              ip: 3,
              lastCodeSeparator: -1,
              operationCount: 1,
              program,
              signatureOperationsCount: 0,
              signedMessages: [],
              stack: [hexToBin('')],
            },
          },
          {
            evaluationRange: {
              endColumn: 2,
              endLineNumber: 21,
              startColumn: 1,
              startLineNumber: 1,
            },
            instruction: {
              data: hexToBin('616263'),
              opcode: 3,
            },
            internalStates: [],
            range: {
              endColumn: 2,
              endLineNumber: 21,
              startColumn: 1,
              startLineNumber: 3,
            },
            state: {
              alternateStack: [],
              controlStack: [],
              instructions: [
                {
                  data: hexToBin(''),
                  opcode: 0,
                },
                {
                  data: hexToBin('616263'),
                  opcode: 3,
                },
              ],
              ip: 2,
              lastCodeSeparator: -1,
              operationCount: 0,
              program,
              signatureOperationsCount: 0,
              signedMessages: [],
              stack: [hexToBin(''), hexToBin('616263')],
            },
          },
        ],
        unmatchedStates: [
          {
            alternateStack: [],
            controlStack: [],
            instructions: [
              {
                data: hexToBin(''),
                opcode: 0,
              },
              {
                data: hexToBin('616263'),
                opcode: 3,
              },
            ],
            ip: 2,
            lastCodeSeparator: -1,
            operationCount: 0,
            program,
            signatureOperationsCount: 0,
            signedMessages: [],
            stack: [hexToBin(''), hexToBin('616263')],
          },
        ],
      },
      stringifyTestVector(sampleResult),
    );
  },
);

const extractUnexecutedRangesMacro = test.macro<[string, Range[], boolean?]>({
  // eslint-disable-next-line @typescript-eslint/max-params
  exec: (t, scriptId, ranges, specifyStart) => {
    const result = compiler.generateBytecode({
      data: {},
      debug: true,
      scriptId,
    });
    if (!result.success) {
      t.fail(stringifyErrors(result.errors));
      return;
    }
    const testProgram = createAuthenticationProgramEvaluationCommon(
      result.bytecode,
    );
    const nodes = result.reduce.script;
    const evaluationRange = result.reduce.range;
    const traceWithUnlockingPhaseAndFinalState = vm.debug(testProgram);
    const trace = traceWithUnlockingPhaseAndFinalState.slice(1, -1);
    const { samples } = extractEvaluationSamplesRecursive({
      evaluationRange,
      nodes,
      trace,
    });
    const unexecutedRanges = extractUnexecutedRanges(
      samples,
      specifyStart === undefined ? undefined : '1,1',
    );
    t.deepEqual(
      unexecutedRanges,
      ranges,
      stringifyTestVector(unexecutedRanges),
    );
  },
  title: (_, scriptId) => `extractUnexecutedRangesMacro: ${scriptId}`,
});

test(
  extractUnexecutedRangesMacro,
  'unexecuted00',
  [
    {
      endColumn: 8,
      endLineNumber: 3,
      startColumn: 5,
      startLineNumber: 3,
    },
    {
      endColumn: 20,
      endLineNumber: 4,
      startColumn: 5,
      startLineNumber: 4,
    },
    {
      endColumn: 10,
      endLineNumber: 5,
      startColumn: 5,
      startLineNumber: 5,
    },
    {
      endColumn: 12,
      endLineNumber: 6,
      startColumn: 9,
      startLineNumber: 6,
    },
    {
      endColumn: 10,
      endLineNumber: 14,
      startColumn: 9,
      startLineNumber: 7,
    },
    {
      endColumn: 13,
      endLineNumber: 15,
      startColumn: 5,
      startLineNumber: 15,
    },
    {
      endColumn: 13,
      endLineNumber: 16,
      startColumn: 5,
      startLineNumber: 16,
    },
    {
      endColumn: 11,
      endLineNumber: 23,
      startColumn: 9,
      startLineNumber: 21,
    },
  ],
  true,
);

test(extractUnexecutedRangesMacro, 'unexecuted01', [
  {
    endColumn: 8,
    endLineNumber: 3,
    startColumn: 5,
    startLineNumber: 3,
  },
  {
    endColumn: 20,
    endLineNumber: 4,
    startColumn: 5,
    startLineNumber: 4,
  },
  {
    endColumn: 10,
    endLineNumber: 5,
    startColumn: 5,
    startLineNumber: 5,
  },
  {
    endColumn: 12,
    endLineNumber: 6,
    startColumn: 9,
    startLineNumber: 6,
  },
  {
    endColumn: 10,
    endLineNumber: 14,
    startColumn: 9,
    startLineNumber: 7,
  },
  {
    endColumn: 13,
    endLineNumber: 15,
    startColumn: 5,
    startLineNumber: 15,
  },
  {
    endColumn: 13,
    endLineNumber: 16,
    startColumn: 5,
    startLineNumber: 16,
  },
]);

test(extractUnexecutedRangesMacro, 'unexecuted10', [
  {
    endColumn: 12,
    endLineNumber: 6,
    startColumn: 9,
    startLineNumber: 6,
  },
  {
    endColumn: 10,
    endLineNumber: 14,
    startColumn: 9,
    startLineNumber: 7,
  },
  {
    endColumn: 8,
    endLineNumber: 18,
    startColumn: 5,
    startLineNumber: 18,
  },
  {
    endColumn: 20,
    endLineNumber: 19,
    startColumn: 5,
    startLineNumber: 19,
  },
  {
    endColumn: 10,
    endLineNumber: 20,
    startColumn: 5,
    startLineNumber: 20,
  },
  {
    endColumn: 11,
    endLineNumber: 23,
    startColumn: 9,
    startLineNumber: 21,
  },
  {
    endColumn: 13,
    endLineNumber: 24,
    startColumn: 5,
    startLineNumber: 24,
  },
]);

test(extractUnexecutedRangesMacro, 'unexecuted11', [
  {
    endColumn: 22,
    endLineNumber: 12,
    startColumn: 17,
    startLineNumber: 12,
  },
  {
    endColumn: 8,
    endLineNumber: 18,
    startColumn: 5,
    startLineNumber: 18,
  },
  {
    endColumn: 20,
    endLineNumber: 19,
    startColumn: 5,
    startLineNumber: 19,
  },
  {
    endColumn: 10,
    endLineNumber: 20,
    startColumn: 5,
    startLineNumber: 20,
  },
  {
    endColumn: 11,
    endLineNumber: 23,
    startColumn: 9,
    startLineNumber: 21,
  },
  {
    endColumn: 13,
    endLineNumber: 24,
    startColumn: 5,
    startLineNumber: 24,
  },
]);

test(extractUnexecutedRangesMacro, 'unexecutedEmpty', []);
