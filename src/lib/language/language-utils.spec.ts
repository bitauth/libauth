/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable max-lines */
import test from 'ava';

import type { Range } from '../lib.js';
import {
  assertSuccess,
  compileCashAssembly,
  containsRange,
  createAuthenticationProgramEvaluationCommon,
  createCompilerBch,
  createCompilerCommon,
  createVirtualMachineBch,
  createVirtualMachineBchSpec,
  extractBytecodeResolutions,
  extractEvaluationSamples,
  extractEvaluationSamplesRecursive,
  extractUnexecutedRanges,
  hexToBin,
  mergeRanges,
  Opcodes,
  OpcodesBch,
  stringifyDebugTraceSummary,
  stringifyErrors,
  stringifyTestVector,
  summarizeDebugTrace,
  walletTemplateToCompilerBch,
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

const vm = createVirtualMachineBch();
const vmSpec = createVirtualMachineBchSpec();
const compiler = createCompilerBch({
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
    loops: `<0> <0>
OP_BEGIN
  <0> OP_BEGIN OP_1ADD OP_DUP <2> OP_EQUAL OP_UNTIL // hidden nested loop
  OP_ADD
  OP_SWAP OP_1ADD OP_SWAP
  OP_OVER 
  <0> OP_BEGIN // visible nested loop
    OP_1ADD
    OP_DUP <3>
    OP_EQUAL
  OP_UNTIL
  OP_EQUAL
OP_UNTIL
OP_NIP`,
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

  const internalProgram = createAuthenticationProgramEvaluationCommon(
    hexToBin('5301007c7e'),
  );

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
            metrics: {
              executedInstructionCount: 0,
              hashDigestIterations: 0,
              maxMemoryUsage: 0,
              signatureCheckCount: 0,
            },
            operationCount: 0,
            program: internalProgram,
            repeatedBytes: 0,
            signedMessages: [],
            stack: [],
            transactionLengthBytes: 10062,
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
            metrics: {
              executedInstructionCount: 0,
              hashDigestIterations: 0,
              maxMemoryUsage: 0,
              signatureCheckCount: 0,
            },
            operationCount: 0,
            program: internalProgram,
            repeatedBytes: 0,
            signedMessages: [],
            stack: [],
            transactionLengthBytes: 10062,
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
            metrics: {
              executedInstructionCount: 1,
              hashDigestIterations: 0,
              maxMemoryUsage: 1,
              signatureCheckCount: 0,
            },
            operationCount: 0,
            program: internalProgram,
            repeatedBytes: 0,
            signedMessages: [],
            stack: [hexToBin('03')],
            transactionLengthBytes: 10062,
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
            metrics: {
              executedInstructionCount: 2,
              hashDigestIterations: 0,
              maxMemoryUsage: 2,
              signatureCheckCount: 0,
            },
            operationCount: 0,
            program: internalProgram,
            repeatedBytes: 0,
            signedMessages: [],
            stack: [hexToBin('03'), hexToBin('00')],
            transactionLengthBytes: 10062,
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
            metrics: {
              executedInstructionCount: 3,
              hashDigestIterations: 0,
              maxMemoryUsage: 2,
              signatureCheckCount: 0,
            },
            operationCount: 1,
            program: internalProgram,
            repeatedBytes: 0,
            signedMessages: [],
            stack: [hexToBin('00'), hexToBin('03')],
            transactionLengthBytes: 10062,
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
            metrics: {
              executedInstructionCount: 4,
              hashDigestIterations: 0,
              maxMemoryUsage: 2,
              signatureCheckCount: 0,
            },
            operationCount: 2,
            program: internalProgram,
            repeatedBytes: 0,
            signedMessages: [],
            stack: [hexToBin('0003')],
            transactionLengthBytes: 10062,
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
            metrics: {
              executedInstructionCount: 4,
              hashDigestIterations: 0,
              maxMemoryUsage: 2,
              signatureCheckCount: 0,
            },
            operationCount: 2,
            program: internalProgram,
            repeatedBytes: 0,
            signedMessages: [],
            stack: [hexToBin('0003')],
            transactionLengthBytes: 10062,
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
        metrics: {
          executedInstructionCount: 0,
          signatureCheckCount: 0,
        },
        operationCount: 0,
        program,
        signedMessages: [],
        stack: [],
        transactionLengthBytes: 10062,
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
        metrics: {
          executedInstructionCount: 0,
          signatureCheckCount: 0,
        },
        operationCount: 0,
        program,
        signedMessages: [],
        stack: [],
        transactionLengthBytes: 10062,
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
        metrics: {
          executedInstructionCount: 1,
          signatureCheckCount: 0,
        },
        operationCount: 0,
        program,
        signedMessages: [],
        stack: [hexToBin('')],
        transactionLengthBytes: 10062,
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
        metrics: {
          executedInstructionCount: 2,
          signatureCheckCount: 0,
        },
        operationCount: 0,
        program,
        signedMessages: [],
        stack: [hexToBin(''), hexToBin('ab')],
        transactionLengthBytes: 10062,
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
        metrics: {
          executedInstructionCount: 3,
          signatureCheckCount: 0,
        },
        operationCount: 0,
        program,
        signedMessages: [],
        stack: [hexToBin(''), hexToBin('ab'), hexToBin('cd')],
        transactionLengthBytes: 10062,
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
        metrics: {
          executedInstructionCount: 4,
          signatureCheckCount: 0,
        },
        operationCount: 1,
        program,
        signedMessages: [],
        stack: [hexToBin(''), hexToBin('f8')],
        transactionLengthBytes: 10062,
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
        metrics: {
          executedInstructionCount: 5,
          signatureCheckCount: 0,
        },
        operationCount: 1,
        program,
        signedMessages: [],
        stack: [hexToBin(''), hexToBin('f8'), hexToBin('')],
        transactionLengthBytes: 10062,
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
        metrics: {
          executedInstructionCount: 6,
          signatureCheckCount: 0,
        },
        operationCount: 1,
        program,
        signedMessages: [],
        stack: [hexToBin(''), hexToBin('f8'), hexToBin(''), hexToBin('')],
        transactionLengthBytes: 10062,
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
        metrics: {
          executedInstructionCount: 7,
          signatureCheckCount: 0,
        },
        operationCount: 1,
        program,
        signedMessages: [],
        stack: [
          hexToBin(''),
          hexToBin('f8'),
          hexToBin(''),
          hexToBin(''),
          hexToBin('010203'),
        ],
        transactionLengthBytes: 10062,
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
        metrics: {
          executedInstructionCount: 7,
          signatureCheckCount: 0,
        },
        operationCount: 1,
        program,
        signedMessages: [],
        stack: [
          hexToBin(''),
          hexToBin('f8'),
          hexToBin(''),
          hexToBin(''),
          hexToBin('010203'),
        ],
        transactionLengthBytes: 10062,
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

test.failing('extractEvaluationSamples: error in initial validation', (t) => {
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
        metrics: { executedInstructionCount: 0, signatureCheckCount: 0 },
        operationCount: 0,
        program,
        signedMessages: [],
        stack: [],
        transactionLengthBytes: 62,
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

    const internalProgram = createAuthenticationProgramEvaluationCommon(
      hexToBin('03ab6a00'),
    );
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
              metrics: {
                executedInstructionCount: 0,
                hashDigestIterations: 0,
                maxMemoryUsage: 0,
                signatureCheckCount: 0,
              },
              operationCount: 0,
              program: internalProgram,
              repeatedBytes: 0,
              signedMessages: [],
              stack: [],
              transactionLengthBytes: 10062,
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
              metrics: {
                executedInstructionCount: 0,
                hashDigestIterations: 0,
                maxMemoryUsage: 0,
                signatureCheckCount: 0,
              },
              operationCount: 0,
              program: internalProgram,
              repeatedBytes: 0,
              signedMessages: [],
              stack: [],
              transactionLengthBytes: 10062,
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
              metrics: {
                executedInstructionCount: 1,
                hashDigestIterations: 0,
                maxMemoryUsage: 3,
                signatureCheckCount: 0,
              },
              operationCount: 0,
              program: internalProgram,
              repeatedBytes: 0,
              signedMessages: [],
              stack: [hexToBin('ab6a00')],
              transactionLengthBytes: 10062,
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
              metrics: {
                executedInstructionCount: 1,
                hashDigestIterations: 0,
                maxMemoryUsage: 3,
                signatureCheckCount: 0,
              },
              operationCount: 0,
              program: internalProgram,
              repeatedBytes: 0,
              signedMessages: [],
              stack: [hexToBin('ab6a00')],
              transactionLengthBytes: 10062,
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
          metrics: {
            executedInstructionCount: 0,
            signatureCheckCount: 0,
          },
          operationCount: 0,
          program,
          signedMessages: [],
          stack: [],
          transactionLengthBytes: 10062,
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
          metrics: {
            executedInstructionCount: 0,
            signatureCheckCount: 0,
          },
          operationCount: 0,
          program,
          signedMessages: [],
          stack: [],
          transactionLengthBytes: 10062,
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
          metrics: {
            executedInstructionCount: 1,
            signatureCheckCount: 0,
          },
          operationCount: 0,
          program,
          signedMessages: [],
          stack: [hexToBin('ab')],
          transactionLengthBytes: 10062,
        },
        {
          alternateStack: [],
          controlStack: [],
          error: 'Program called an OP_RETURN operation.',
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
          metrics: {
            executedInstructionCount: 2,
            signatureCheckCount: 0,
          },
          operationCount: 1,
          program,
          signedMessages: [],
          stack: [hexToBin('ab')],
          transactionLengthBytes: 10062,
        },
        {
          alternateStack: [],
          controlStack: [],
          error: 'Program called an OP_RETURN operation.',
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
          metrics: {
            executedInstructionCount: 2,
            signatureCheckCount: 0,
          },
          operationCount: 1,
          program,
          signedMessages: [],
          stack: [hexToBin('ab')],
          transactionLengthBytes: 10062,
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
        metrics: { executedInstructionCount: 0, signatureCheckCount: 0 },
        operationCount: 0,
        program,
        signedMessages: [],
        stack: [],
        transactionLengthBytes: 10062,
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
        metrics: { executedInstructionCount: 0, signatureCheckCount: 0 },
        operationCount: 0,
        program,
        signedMessages: [],
        stack: [],
        transactionLengthBytes: 10062,
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
        metrics: { executedInstructionCount: 1, signatureCheckCount: 0 },
        operationCount: 0,
        program,
        signedMessages: [],
        stack: [hexToBin('')],
        transactionLengthBytes: 10062,
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
        metrics: { executedInstructionCount: 2, signatureCheckCount: 0 },
        operationCount: 0,
        program,
        signedMessages: [],
        stack: [hexToBin('')],
        transactionLengthBytes: 10062,
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
        metrics: { executedInstructionCount: 2, signatureCheckCount: 0 },
        operationCount: 0,
        program,
        signedMessages: [],
        stack: [hexToBin('')],
        transactionLengthBytes: 10062,
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

test.failing(
  'extractEvaluationSamples: error3 - error occurs, so final state is dropped',
  (t) => {
    const result = compiler.generateBytecode({
      data: {},
      debug: true,
      scriptId: 'error3',
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
          metrics: { executedInstructionCount: 0, signatureCheckCount: 0 },
          operationCount: 0,
          program,
          signedMessages: [],
          stack: [],
          transactionLengthBytes: 10062,
        },
        {
          alternateStack: [],
          controlStack: [],
          instructions: [
            { data: hexToBin(''), opcode: 0 },
            { opcode: 106 },
            { data: hexToBin(''), opcode: 0 },
            { data: hexToBin(''), opcode: 0 },
          ],
          ip: 0,
          lastCodeSeparator: -1,
          metrics: { executedInstructionCount: 0, signatureCheckCount: 0 },
          operationCount: 0,
          program,
          signedMessages: [],
          stack: [],
          transactionLengthBytes: 10062,
        },
        {
          alternateStack: [],
          controlStack: [],
          instructions: [
            { data: hexToBin(''), opcode: 0 },
            { opcode: 106 },
            { data: hexToBin(''), opcode: 0 },
            { data: hexToBin(''), opcode: 0 },
          ],
          ip: 1,
          lastCodeSeparator: -1,
          metrics: { executedInstructionCount: 1, signatureCheckCount: 0 },
          operationCount: 0,
          program,
          signedMessages: [],
          stack: [hexToBin('')],
          transactionLengthBytes: 10062,
        },
        {
          alternateStack: [],
          controlStack: [],
          error: 'Program called an OP_RETURN operation.',
          instructions: [
            { data: hexToBin(''), opcode: 0 },
            { opcode: 106 },
            { data: hexToBin(''), opcode: 0 },
            { data: hexToBin(''), opcode: 0 },
          ],
          ip: 2,
          lastCodeSeparator: -1,
          metrics: { executedInstructionCount: 2, signatureCheckCount: 0 },
          operationCount: 1,
          program,
          signedMessages: [],
          stack: [hexToBin('')],
          transactionLengthBytes: 10062,
        },
        {
          alternateStack: [],
          controlStack: [],
          error: 'Program called an OP_RETURN operation.',
          instructions: [
            { data: hexToBin(''), opcode: 0 },
            { opcode: 106 },
            { data: hexToBin(''), opcode: 0 },
            { data: hexToBin(''), opcode: 0 },
          ],
          ip: 2,
          lastCodeSeparator: -1,
          metrics: { executedInstructionCount: 2, signatureCheckCount: 0 },
          operationCount: 1,
          program,
          signedMessages: [],
          stack: [hexToBin('')],
          transactionLengthBytes: 10062,
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
  },
);

test.failing('extractEvaluationSamples: supports loops', (t) => {
  const result = compiler.generateBytecode({
    data: {},
    debug: true,
    scriptId: 'loops',
  });
  if (!result.success) {
    t.fail(stringifyErrors(result.errors));
    return;
  }
  const program = createAuthenticationProgramEvaluationCommon(result.bytecode);
  const nodes = result.reduce.script;
  const evaluationRange = result.reduce.range;
  const traceWithUnlockingPhaseAndFinalState = vmSpec.debug(program);
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
        push: {
          bytecode: hexToBin(''),
          range: {
            endColumn: 3,
            endLineNumber: 1,
            startColumn: 2,
            startLineNumber: 1,
          },
          script: [
            {
              bytecode: hexToBin(''),
              range: {
                endColumn: 3,
                endLineNumber: 1,
                startColumn: 2,
                startLineNumber: 1,
              },
            },
          ],
        },
        range: {
          endColumn: 4,
          endLineNumber: 1,
          startColumn: 1,
          startLineNumber: 1,
        },
      },
      {
        bytecode: hexToBin('00'),
        push: {
          bytecode: hexToBin(''),
          range: {
            endColumn: 7,
            endLineNumber: 1,
            startColumn: 6,
            startLineNumber: 1,
          },
          script: [
            {
              bytecode: hexToBin(''),
              range: {
                endColumn: 7,
                endLineNumber: 1,
                startColumn: 6,
                startLineNumber: 1,
              },
            },
          ],
        },
        range: {
          endColumn: 8,
          endLineNumber: 1,
          startColumn: 5,
          startLineNumber: 1,
        },
      },
      {
        bytecode: hexToBin('65'),
        range: {
          endColumn: 9,
          endLineNumber: 2,
          startColumn: 1,
          startLineNumber: 2,
        },
      },
      {
        bytecode: hexToBin('00'),
        push: {
          bytecode: hexToBin(''),
          range: {
            endColumn: 5,
            endLineNumber: 3,
            startColumn: 4,
            startLineNumber: 3,
          },
          script: [
            {
              bytecode: hexToBin(''),
              range: {
                endColumn: 5,
                endLineNumber: 3,
                startColumn: 4,
                startLineNumber: 3,
              },
            },
          ],
        },
        range: {
          endColumn: 6,
          endLineNumber: 3,
          startColumn: 3,
          startLineNumber: 3,
        },
      },
      {
        bytecode: hexToBin('65'),
        range: {
          endColumn: 15,
          endLineNumber: 3,
          startColumn: 7,
          startLineNumber: 3,
        },
      },
      {
        bytecode: hexToBin('8b'),
        range: {
          endColumn: 23,
          endLineNumber: 3,
          startColumn: 16,
          startLineNumber: 3,
        },
      },
      {
        bytecode: hexToBin('76'),
        range: {
          endColumn: 30,
          endLineNumber: 3,
          startColumn: 24,
          startLineNumber: 3,
        },
      },
      {
        bytecode: hexToBin('52'),
        push: {
          bytecode: hexToBin('02'),
          range: {
            endColumn: 33,
            endLineNumber: 3,
            startColumn: 32,
            startLineNumber: 3,
          },
          script: [
            {
              bytecode: hexToBin('02'),
              range: {
                endColumn: 33,
                endLineNumber: 3,
                startColumn: 32,
                startLineNumber: 3,
              },
            },
          ],
        },
        range: {
          endColumn: 34,
          endLineNumber: 3,
          startColumn: 31,
          startLineNumber: 3,
        },
      },
      {
        bytecode: hexToBin('87'),
        range: {
          endColumn: 43,
          endLineNumber: 3,
          startColumn: 35,
          startLineNumber: 3,
        },
      },
      {
        bytecode: hexToBin('66'),
        range: {
          endColumn: 52,
          endLineNumber: 3,
          startColumn: 44,
          startLineNumber: 3,
        },
      },
      {
        bytecode: hexToBin(''),
        range: {
          endColumn: 74,
          endLineNumber: 3,
          startColumn: 53,
          startLineNumber: 3,
        },
      },
      {
        bytecode: hexToBin('93'),
        range: {
          endColumn: 9,
          endLineNumber: 4,
          startColumn: 3,
          startLineNumber: 4,
        },
      },
      {
        bytecode: hexToBin('7c'),
        range: {
          endColumn: 10,
          endLineNumber: 5,
          startColumn: 3,
          startLineNumber: 5,
        },
      },
      {
        bytecode: hexToBin('8b'),
        range: {
          endColumn: 18,
          endLineNumber: 5,
          startColumn: 11,
          startLineNumber: 5,
        },
      },
      {
        bytecode: hexToBin('7c'),
        range: {
          endColumn: 26,
          endLineNumber: 5,
          startColumn: 19,
          startLineNumber: 5,
        },
      },
      {
        bytecode: hexToBin('78'),
        range: {
          endColumn: 10,
          endLineNumber: 6,
          startColumn: 3,
          startLineNumber: 6,
        },
      },
      {
        bytecode: hexToBin('00'),
        push: {
          bytecode: hexToBin(''),
          range: {
            endColumn: 5,
            endLineNumber: 7,
            startColumn: 4,
            startLineNumber: 7,
          },
          script: [
            {
              bytecode: hexToBin(''),
              range: {
                endColumn: 5,
                endLineNumber: 7,
                startColumn: 4,
                startLineNumber: 7,
              },
            },
          ],
        },
        range: {
          endColumn: 6,
          endLineNumber: 7,
          startColumn: 3,
          startLineNumber: 7,
        },
      },
      {
        bytecode: hexToBin('65'),
        range: {
          endColumn: 15,
          endLineNumber: 7,
          startColumn: 7,
          startLineNumber: 7,
        },
      },
      {
        bytecode: hexToBin(''),
        range: {
          endColumn: 38,
          endLineNumber: 7,
          startColumn: 16,
          startLineNumber: 7,
        },
      },
      {
        bytecode: hexToBin('8b'),
        range: {
          endColumn: 12,
          endLineNumber: 8,
          startColumn: 5,
          startLineNumber: 8,
        },
      },
      {
        bytecode: hexToBin('76'),
        range: {
          endColumn: 11,
          endLineNumber: 9,
          startColumn: 5,
          startLineNumber: 9,
        },
      },
      {
        bytecode: hexToBin('53'),
        push: {
          bytecode: hexToBin('03'),
          range: {
            endColumn: 14,
            endLineNumber: 9,
            startColumn: 13,
            startLineNumber: 9,
          },
          script: [
            {
              bytecode: hexToBin('03'),
              range: {
                endColumn: 14,
                endLineNumber: 9,
                startColumn: 13,
                startLineNumber: 9,
              },
            },
          ],
        },
        range: {
          endColumn: 15,
          endLineNumber: 9,
          startColumn: 12,
          startLineNumber: 9,
        },
      },
      {
        bytecode: hexToBin('87'),
        range: {
          endColumn: 13,
          endLineNumber: 10,
          startColumn: 5,
          startLineNumber: 10,
        },
      },
      {
        bytecode: hexToBin('66'),
        range: {
          endColumn: 11,
          endLineNumber: 11,
          startColumn: 3,
          startLineNumber: 11,
        },
      },
      {
        bytecode: hexToBin('87'),
        range: {
          endColumn: 11,
          endLineNumber: 12,
          startColumn: 3,
          startLineNumber: 12,
        },
      },
      {
        bytecode: hexToBin('66'),
        range: {
          endColumn: 9,
          endLineNumber: 13,
          startColumn: 1,
          startLineNumber: 13,
        },
      },
      {
        bytecode: hexToBin('77'),
        range: {
          endColumn: 7,
          endLineNumber: 14,
          startColumn: 1,
          startLineNumber: 14,
        },
      },
    ],
    stringifyTestVector(nodes),
  );

  const instructions = [
    { data: hexToBin(''), opcode: 0 },
    { data: hexToBin(''), opcode: 0 },
    { opcode: 101 },
    { data: hexToBin(''), opcode: 0 },
    { opcode: 101 },
    { opcode: 139 },
    { opcode: 118 },
    { opcode: 82 },
    { opcode: 135 },
    { opcode: 102 },
    { opcode: 147 },
    { opcode: 124 },
    { opcode: 139 },
    { opcode: 124 },
    { opcode: 120 },
    { data: hexToBin(''), opcode: 0 },
    { opcode: 101 },
    { opcode: 139 },
    { opcode: 118 },
    { opcode: 83 },
    { opcode: 135 },
    { opcode: 102 },
    { opcode: 135 },
    { opcode: 102 },
    { opcode: 119 },
  ];

  t.deepEqual(
    traceWithUnlockingPhaseAndFinalState,
    [
      {
        alternateStack: [],
        controlStack: [],
        instructions: [],
        ip: 0,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 0,
          hashDigestIterations: 0,
          maxMemoryUsage: 0,
          signatureCheckCount: 0,
        },
        operationCount: 0,
        program,
        repeatedBytes: 0,
        signedMessages: [],
        stack: [],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [],
        instructions,
        ip: 0,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 0,
          hashDigestIterations: 0,
          maxMemoryUsage: 0,
          signatureCheckCount: 0,
        },
        operationCount: 0,
        program,
        repeatedBytes: 0,
        signedMessages: [],
        stack: [],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [],
        instructions,
        ip: 1,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 1,
          hashDigestIterations: 0,
          maxMemoryUsage: 0,
          signatureCheckCount: 0,
        },
        operationCount: 0,
        program,
        repeatedBytes: 0,
        signedMessages: [],
        stack: [hexToBin('')],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [],
        instructions,
        ip: 2,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 2,
          hashDigestIterations: 0,
          maxMemoryUsage: 0,
          signatureCheckCount: 0,
        },
        operationCount: 0,
        program,
        repeatedBytes: 0,
        signedMessages: [],
        stack: [hexToBin(''), hexToBin('')],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2],
        instructions,
        ip: 3,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 3,
          hashDigestIterations: 0,
          maxMemoryUsage: 0,
          signatureCheckCount: 0,
        },
        operationCount: 0,
        program,
        repeatedBytes: 0,
        signedMessages: [],
        stack: [hexToBin(''), hexToBin('')],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2],
        instructions,
        ip: 4,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 4,
          hashDigestIterations: 0,
          maxMemoryUsage: 0,
          signatureCheckCount: 0,
        },
        operationCount: 0,
        program,
        repeatedBytes: 0,
        signedMessages: [],
        stack: [hexToBin(''), hexToBin(''), hexToBin('')],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2, 4],
        instructions,
        ip: 5,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 5,
          hashDigestIterations: 0,
          maxMemoryUsage: 0,
          signatureCheckCount: 0,
        },
        operationCount: 0,
        program,
        repeatedBytes: 0,
        signedMessages: [],
        stack: [hexToBin(''), hexToBin(''), hexToBin('')],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2, 4],
        instructions,
        ip: 6,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 6,
          hashDigestIterations: 0,
          maxMemoryUsage: 1,
          signatureCheckCount: 0,
        },
        operationCount: 1,
        program,
        repeatedBytes: 0,
        signedMessages: [],
        stack: [hexToBin(''), hexToBin(''), hexToBin('01')],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2, 4],
        instructions,
        ip: 7,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 7,
          hashDigestIterations: 0,
          maxMemoryUsage: 2,
          signatureCheckCount: 0,
        },
        operationCount: 2,
        program,
        repeatedBytes: 0,
        signedMessages: [],
        stack: [hexToBin(''), hexToBin(''), hexToBin('01'), hexToBin('01')],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2, 4],
        instructions,
        ip: 8,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 8,
          hashDigestIterations: 0,
          maxMemoryUsage: 3,
          signatureCheckCount: 0,
        },
        operationCount: 2,
        program,
        repeatedBytes: 0,
        signedMessages: [],
        stack: [
          hexToBin(''),
          hexToBin(''),
          hexToBin('01'),
          hexToBin('01'),
          hexToBin('02'),
        ],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2, 4],
        instructions,
        ip: 9,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 9,
          hashDigestIterations: 0,
          maxMemoryUsage: 3,
          signatureCheckCount: 0,
        },
        operationCount: 3,
        program,
        repeatedBytes: 0,
        signedMessages: [],
        stack: [hexToBin(''), hexToBin(''), hexToBin('01'), hexToBin('')],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2],
        instructions,
        ip: 4,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 10,
          hashDigestIterations: 0,
          maxMemoryUsage: 3,
          signatureCheckCount: 0,
        },
        operationCount: 3,
        program,
        repeatedBytes: 5,
        signedMessages: [],
        stack: [hexToBin(''), hexToBin(''), hexToBin('01')],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2, 4],
        instructions,
        ip: 5,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 11,
          hashDigestIterations: 0,
          maxMemoryUsage: 3,
          signatureCheckCount: 0,
        },
        operationCount: 3,
        program,
        repeatedBytes: 5,
        signedMessages: [],
        stack: [hexToBin(''), hexToBin(''), hexToBin('01')],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2, 4],
        instructions,
        ip: 6,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 12,
          hashDigestIterations: 0,
          maxMemoryUsage: 3,
          signatureCheckCount: 0,
        },
        operationCount: 4,
        program,
        repeatedBytes: 5,
        signedMessages: [],
        stack: [hexToBin(''), hexToBin(''), hexToBin('02')],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2, 4],
        instructions,
        ip: 7,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 13,
          hashDigestIterations: 0,
          maxMemoryUsage: 3,
          signatureCheckCount: 0,
        },
        operationCount: 5,
        program,
        repeatedBytes: 5,
        signedMessages: [],
        stack: [hexToBin(''), hexToBin(''), hexToBin('02'), hexToBin('02')],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2, 4],
        instructions,
        ip: 8,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 14,
          hashDigestIterations: 0,
          maxMemoryUsage: 3,
          signatureCheckCount: 0,
        },
        operationCount: 5,
        program,
        repeatedBytes: 5,
        signedMessages: [],
        stack: [
          hexToBin(''),
          hexToBin(''),
          hexToBin('02'),
          hexToBin('02'),
          hexToBin('02'),
        ],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2, 4],
        instructions,
        ip: 9,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 15,
          hashDigestIterations: 0,
          maxMemoryUsage: 3,
          signatureCheckCount: 0,
        },
        operationCount: 6,
        program,
        repeatedBytes: 5,
        signedMessages: [],
        stack: [hexToBin(''), hexToBin(''), hexToBin('02'), hexToBin('01')],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2],
        instructions,
        ip: 10,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 16,
          hashDigestIterations: 0,
          maxMemoryUsage: 3,
          signatureCheckCount: 0,
        },
        operationCount: 6,
        program,
        repeatedBytes: 10,
        signedMessages: [],
        stack: [hexToBin(''), hexToBin(''), hexToBin('02')],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2],
        instructions,
        ip: 11,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 17,
          hashDigestIterations: 0,
          maxMemoryUsage: 3,
          signatureCheckCount: 0,
        },
        operationCount: 7,
        program,
        repeatedBytes: 10,
        signedMessages: [],
        stack: [hexToBin(''), hexToBin('02')],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2],
        instructions,
        ip: 12,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 18,
          hashDigestIterations: 0,
          maxMemoryUsage: 3,
          signatureCheckCount: 0,
        },
        operationCount: 8,
        program,
        repeatedBytes: 10,
        signedMessages: [],
        stack: [hexToBin('02'), hexToBin('')],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2],
        instructions,
        ip: 13,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 19,
          hashDigestIterations: 0,
          maxMemoryUsage: 3,
          signatureCheckCount: 0,
        },
        operationCount: 9,
        program,
        repeatedBytes: 10,
        signedMessages: [],
        stack: [hexToBin('02'), hexToBin('01')],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2],
        instructions,
        ip: 14,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 20,
          hashDigestIterations: 0,
          maxMemoryUsage: 3,
          signatureCheckCount: 0,
        },
        operationCount: 10,
        program,
        repeatedBytes: 10,
        signedMessages: [],
        stack: [hexToBin('01'), hexToBin('02')],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2],
        instructions,
        ip: 15,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 21,
          hashDigestIterations: 0,
          maxMemoryUsage: 3,
          signatureCheckCount: 0,
        },
        operationCount: 11,
        program,
        repeatedBytes: 10,
        signedMessages: [],
        stack: [hexToBin('01'), hexToBin('02'), hexToBin('01')],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2],
        instructions,
        ip: 16,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 22,
          hashDigestIterations: 0,
          maxMemoryUsage: 3,
          signatureCheckCount: 0,
        },
        operationCount: 11,
        program,
        repeatedBytes: 10,
        signedMessages: [],
        stack: [hexToBin('01'), hexToBin('02'), hexToBin('01'), hexToBin('')],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2, 16],
        instructions,
        ip: 17,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 23,
          hashDigestIterations: 0,
          maxMemoryUsage: 3,
          signatureCheckCount: 0,
        },
        operationCount: 11,
        program,
        repeatedBytes: 10,
        signedMessages: [],
        stack: [hexToBin('01'), hexToBin('02'), hexToBin('01'), hexToBin('')],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2, 16],
        instructions,
        ip: 18,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 24,
          hashDigestIterations: 0,
          maxMemoryUsage: 4,
          signatureCheckCount: 0,
        },
        operationCount: 12,
        program,
        repeatedBytes: 10,
        signedMessages: [],
        stack: [hexToBin('01'), hexToBin('02'), hexToBin('01'), hexToBin('01')],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2, 16],
        instructions,
        ip: 19,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 25,
          hashDigestIterations: 0,
          maxMemoryUsage: 5,
          signatureCheckCount: 0,
        },
        operationCount: 13,
        program,
        repeatedBytes: 10,
        signedMessages: [],
        stack: [
          hexToBin('01'),
          hexToBin('02'),
          hexToBin('01'),
          hexToBin('01'),
          hexToBin('01'),
        ],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2, 16],
        instructions,
        ip: 20,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 26,
          hashDigestIterations: 0,
          maxMemoryUsage: 6,
          signatureCheckCount: 0,
        },
        operationCount: 13,
        program,
        repeatedBytes: 10,
        signedMessages: [],
        stack: [
          hexToBin('01'),
          hexToBin('02'),
          hexToBin('01'),
          hexToBin('01'),
          hexToBin('01'),
          hexToBin('03'),
        ],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2, 16],
        instructions,
        ip: 21,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 27,
          hashDigestIterations: 0,
          maxMemoryUsage: 6,
          signatureCheckCount: 0,
        },
        operationCount: 14,
        program,
        repeatedBytes: 10,
        signedMessages: [],
        stack: [
          hexToBin('01'),
          hexToBin('02'),
          hexToBin('01'),
          hexToBin('01'),
          hexToBin(''),
        ],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2],
        instructions,
        ip: 16,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 28,
          hashDigestIterations: 0,
          maxMemoryUsage: 6,
          signatureCheckCount: 0,
        },
        operationCount: 14,
        program,
        repeatedBytes: 15,
        signedMessages: [],
        stack: [hexToBin('01'), hexToBin('02'), hexToBin('01'), hexToBin('01')],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2, 16],
        instructions,
        ip: 17,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 29,
          hashDigestIterations: 0,
          maxMemoryUsage: 6,
          signatureCheckCount: 0,
        },
        operationCount: 14,
        program,
        repeatedBytes: 15,
        signedMessages: [],
        stack: [hexToBin('01'), hexToBin('02'), hexToBin('01'), hexToBin('01')],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2, 16],
        instructions,
        ip: 18,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 30,
          hashDigestIterations: 0,
          maxMemoryUsage: 6,
          signatureCheckCount: 0,
        },
        operationCount: 15,
        program,
        repeatedBytes: 15,
        signedMessages: [],
        stack: [hexToBin('01'), hexToBin('02'), hexToBin('01'), hexToBin('02')],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2, 16],
        instructions,
        ip: 19,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 31,
          hashDigestIterations: 0,
          maxMemoryUsage: 6,
          signatureCheckCount: 0,
        },
        operationCount: 16,
        program,
        repeatedBytes: 15,
        signedMessages: [],
        stack: [
          hexToBin('01'),
          hexToBin('02'),
          hexToBin('01'),
          hexToBin('02'),
          hexToBin('02'),
        ],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2, 16],
        instructions,
        ip: 20,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 32,
          hashDigestIterations: 0,
          maxMemoryUsage: 6,
          signatureCheckCount: 0,
        },
        operationCount: 16,
        program,
        repeatedBytes: 15,
        signedMessages: [],
        stack: [
          hexToBin('01'),
          hexToBin('02'),
          hexToBin('01'),
          hexToBin('02'),
          hexToBin('02'),
          hexToBin('03'),
        ],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2, 16],
        instructions,
        ip: 21,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 33,
          hashDigestIterations: 0,
          maxMemoryUsage: 6,
          signatureCheckCount: 0,
        },
        operationCount: 17,
        program,
        repeatedBytes: 15,
        signedMessages: [],
        stack: [
          hexToBin('01'),
          hexToBin('02'),
          hexToBin('01'),
          hexToBin('02'),
          hexToBin(''),
        ],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2],
        instructions,
        ip: 16,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 34,
          hashDigestIterations: 0,
          maxMemoryUsage: 6,
          signatureCheckCount: 0,
        },
        operationCount: 17,
        program,
        repeatedBytes: 20,
        signedMessages: [],
        stack: [hexToBin('01'), hexToBin('02'), hexToBin('01'), hexToBin('02')],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2, 16],
        instructions,
        ip: 17,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 35,
          hashDigestIterations: 0,
          maxMemoryUsage: 6,
          signatureCheckCount: 0,
        },
        operationCount: 17,
        program,
        repeatedBytes: 20,
        signedMessages: [],
        stack: [hexToBin('01'), hexToBin('02'), hexToBin('01'), hexToBin('02')],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2, 16],
        instructions,
        ip: 18,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 36,
          hashDigestIterations: 0,
          maxMemoryUsage: 6,
          signatureCheckCount: 0,
        },
        operationCount: 18,
        program,
        repeatedBytes: 20,
        signedMessages: [],
        stack: [hexToBin('01'), hexToBin('02'), hexToBin('01'), hexToBin('03')],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2, 16],
        instructions,
        ip: 19,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 37,
          hashDigestIterations: 0,
          maxMemoryUsage: 6,
          signatureCheckCount: 0,
        },
        operationCount: 19,
        program,
        repeatedBytes: 20,
        signedMessages: [],
        stack: [
          hexToBin('01'),
          hexToBin('02'),
          hexToBin('01'),
          hexToBin('03'),
          hexToBin('03'),
        ],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2, 16],
        instructions,
        ip: 20,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 38,
          hashDigestIterations: 0,
          maxMemoryUsage: 6,
          signatureCheckCount: 0,
        },
        operationCount: 19,
        program,
        repeatedBytes: 20,
        signedMessages: [],
        stack: [
          hexToBin('01'),
          hexToBin('02'),
          hexToBin('01'),
          hexToBin('03'),
          hexToBin('03'),
          hexToBin('03'),
        ],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2, 16],
        instructions,
        ip: 21,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 39,
          hashDigestIterations: 0,
          maxMemoryUsage: 6,
          signatureCheckCount: 0,
        },
        operationCount: 20,
        program,
        repeatedBytes: 20,
        signedMessages: [],
        stack: [
          hexToBin('01'),
          hexToBin('02'),
          hexToBin('01'),
          hexToBin('03'),
          hexToBin('01'),
        ],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2],
        instructions,
        ip: 22,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 40,
          hashDigestIterations: 0,
          maxMemoryUsage: 6,
          signatureCheckCount: 0,
        },
        operationCount: 20,
        program,
        repeatedBytes: 25,
        signedMessages: [],
        stack: [hexToBin('01'), hexToBin('02'), hexToBin('01'), hexToBin('03')],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2],
        instructions,
        ip: 23,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 41,
          hashDigestIterations: 0,
          maxMemoryUsage: 6,
          signatureCheckCount: 0,
        },
        operationCount: 21,
        program,
        repeatedBytes: 25,
        signedMessages: [],
        stack: [hexToBin('01'), hexToBin('02'), hexToBin('')],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [],
        instructions,
        ip: 2,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 42,
          hashDigestIterations: 0,
          maxMemoryUsage: 6,
          signatureCheckCount: 0,
        },
        operationCount: 21,
        program,
        repeatedBytes: 46,
        signedMessages: [],
        stack: [hexToBin('01'), hexToBin('02')],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2],
        instructions,
        ip: 3,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 43,
          hashDigestIterations: 0,
          maxMemoryUsage: 6,
          signatureCheckCount: 0,
        },
        operationCount: 21,
        program,
        repeatedBytes: 46,
        signedMessages: [],
        stack: [hexToBin('01'), hexToBin('02')],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2],
        instructions,
        ip: 4,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 44,
          hashDigestIterations: 0,
          maxMemoryUsage: 6,
          signatureCheckCount: 0,
        },
        operationCount: 21,
        program,
        repeatedBytes: 46,
        signedMessages: [],
        stack: [hexToBin('01'), hexToBin('02'), hexToBin('')],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2, 4],
        instructions,
        ip: 5,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 45,
          hashDigestIterations: 0,
          maxMemoryUsage: 6,
          signatureCheckCount: 0,
        },
        operationCount: 21,
        program,
        repeatedBytes: 46,
        signedMessages: [],
        stack: [hexToBin('01'), hexToBin('02'), hexToBin('')],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2, 4],
        instructions,
        ip: 6,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 46,
          hashDigestIterations: 0,
          maxMemoryUsage: 6,
          signatureCheckCount: 0,
        },
        operationCount: 22,
        program,
        repeatedBytes: 46,
        signedMessages: [],
        stack: [hexToBin('01'), hexToBin('02'), hexToBin('01')],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2, 4],
        instructions,
        ip: 7,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 47,
          hashDigestIterations: 0,
          maxMemoryUsage: 6,
          signatureCheckCount: 0,
        },
        operationCount: 23,
        program,
        repeatedBytes: 46,
        signedMessages: [],
        stack: [hexToBin('01'), hexToBin('02'), hexToBin('01'), hexToBin('01')],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2, 4],
        instructions,
        ip: 8,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 48,
          hashDigestIterations: 0,
          maxMemoryUsage: 6,
          signatureCheckCount: 0,
        },
        operationCount: 23,
        program,
        repeatedBytes: 46,
        signedMessages: [],
        stack: [
          hexToBin('01'),
          hexToBin('02'),
          hexToBin('01'),
          hexToBin('01'),
          hexToBin('02'),
        ],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2, 4],
        instructions,
        ip: 9,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 49,
          hashDigestIterations: 0,
          maxMemoryUsage: 6,
          signatureCheckCount: 0,
        },
        operationCount: 24,
        program,
        repeatedBytes: 46,
        signedMessages: [],
        stack: [hexToBin('01'), hexToBin('02'), hexToBin('01'), hexToBin('')],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2],
        instructions,
        ip: 4,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 50,
          hashDigestIterations: 0,
          maxMemoryUsage: 6,
          signatureCheckCount: 0,
        },
        operationCount: 24,
        program,
        repeatedBytes: 51,
        signedMessages: [],
        stack: [hexToBin('01'), hexToBin('02'), hexToBin('01')],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2, 4],
        instructions,
        ip: 5,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 51,
          hashDigestIterations: 0,
          maxMemoryUsage: 6,
          signatureCheckCount: 0,
        },
        operationCount: 24,
        program,
        repeatedBytes: 51,
        signedMessages: [],
        stack: [hexToBin('01'), hexToBin('02'), hexToBin('01')],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2, 4],
        instructions,
        ip: 6,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 52,
          hashDigestIterations: 0,
          maxMemoryUsage: 6,
          signatureCheckCount: 0,
        },
        operationCount: 25,
        program,
        repeatedBytes: 51,
        signedMessages: [],
        stack: [hexToBin('01'), hexToBin('02'), hexToBin('02')],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2, 4],
        instructions,
        ip: 7,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 53,
          hashDigestIterations: 0,
          maxMemoryUsage: 6,
          signatureCheckCount: 0,
        },
        operationCount: 26,
        program,
        repeatedBytes: 51,
        signedMessages: [],
        stack: [hexToBin('01'), hexToBin('02'), hexToBin('02'), hexToBin('02')],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2, 4],
        instructions,
        ip: 8,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 54,
          hashDigestIterations: 0,
          maxMemoryUsage: 6,
          signatureCheckCount: 0,
        },
        operationCount: 26,
        program,
        repeatedBytes: 51,
        signedMessages: [],
        stack: [
          hexToBin('01'),
          hexToBin('02'),
          hexToBin('02'),
          hexToBin('02'),
          hexToBin('02'),
        ],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2, 4],
        instructions,
        ip: 9,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 55,
          hashDigestIterations: 0,
          maxMemoryUsage: 6,
          signatureCheckCount: 0,
        },
        operationCount: 27,
        program,
        repeatedBytes: 51,
        signedMessages: [],
        stack: [hexToBin('01'), hexToBin('02'), hexToBin('02'), hexToBin('01')],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2],
        instructions,
        ip: 10,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 56,
          hashDigestIterations: 0,
          maxMemoryUsage: 6,
          signatureCheckCount: 0,
        },
        operationCount: 27,
        program,
        repeatedBytes: 56,
        signedMessages: [],
        stack: [hexToBin('01'), hexToBin('02'), hexToBin('02')],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2],
        instructions,
        ip: 11,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 57,
          hashDigestIterations: 0,
          maxMemoryUsage: 6,
          signatureCheckCount: 0,
        },
        operationCount: 28,
        program,
        repeatedBytes: 56,
        signedMessages: [],
        stack: [hexToBin('01'), hexToBin('04')],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2],
        instructions,
        ip: 12,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 58,
          hashDigestIterations: 0,
          maxMemoryUsage: 6,
          signatureCheckCount: 0,
        },
        operationCount: 29,
        program,
        repeatedBytes: 56,
        signedMessages: [],
        stack: [hexToBin('04'), hexToBin('01')],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2],
        instructions,
        ip: 13,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 59,
          hashDigestIterations: 0,
          maxMemoryUsage: 6,
          signatureCheckCount: 0,
        },
        operationCount: 30,
        program,
        repeatedBytes: 56,
        signedMessages: [],
        stack: [hexToBin('04'), hexToBin('02')],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2],
        instructions,
        ip: 14,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 60,
          hashDigestIterations: 0,
          maxMemoryUsage: 6,
          signatureCheckCount: 0,
        },
        operationCount: 31,
        program,
        repeatedBytes: 56,
        signedMessages: [],
        stack: [hexToBin('02'), hexToBin('04')],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2],
        instructions,
        ip: 15,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 61,
          hashDigestIterations: 0,
          maxMemoryUsage: 6,
          signatureCheckCount: 0,
        },
        operationCount: 32,
        program,
        repeatedBytes: 56,
        signedMessages: [],
        stack: [hexToBin('02'), hexToBin('04'), hexToBin('02')],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2],
        instructions,
        ip: 16,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 62,
          hashDigestIterations: 0,
          maxMemoryUsage: 6,
          signatureCheckCount: 0,
        },
        operationCount: 32,
        program,
        repeatedBytes: 56,
        signedMessages: [],
        stack: [hexToBin('02'), hexToBin('04'), hexToBin('02'), hexToBin('')],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2, 16],
        instructions,
        ip: 17,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 63,
          hashDigestIterations: 0,
          maxMemoryUsage: 6,
          signatureCheckCount: 0,
        },
        operationCount: 32,
        program,
        repeatedBytes: 56,
        signedMessages: [],
        stack: [hexToBin('02'), hexToBin('04'), hexToBin('02'), hexToBin('')],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2, 16],
        instructions,
        ip: 18,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 64,
          hashDigestIterations: 0,
          maxMemoryUsage: 6,
          signatureCheckCount: 0,
        },
        operationCount: 33,
        program,
        repeatedBytes: 56,
        signedMessages: [],
        stack: [hexToBin('02'), hexToBin('04'), hexToBin('02'), hexToBin('01')],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2, 16],
        instructions,
        ip: 19,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 65,
          hashDigestIterations: 0,
          maxMemoryUsage: 6,
          signatureCheckCount: 0,
        },
        operationCount: 34,
        program,
        repeatedBytes: 56,
        signedMessages: [],
        stack: [
          hexToBin('02'),
          hexToBin('04'),
          hexToBin('02'),
          hexToBin('01'),
          hexToBin('01'),
        ],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2, 16],
        instructions,
        ip: 20,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 66,
          hashDigestIterations: 0,
          maxMemoryUsage: 6,
          signatureCheckCount: 0,
        },
        operationCount: 34,
        program,
        repeatedBytes: 56,
        signedMessages: [],
        stack: [
          hexToBin('02'),
          hexToBin('04'),
          hexToBin('02'),
          hexToBin('01'),
          hexToBin('01'),
          hexToBin('03'),
        ],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2, 16],
        instructions,
        ip: 21,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 67,
          hashDigestIterations: 0,
          maxMemoryUsage: 6,
          signatureCheckCount: 0,
        },
        operationCount: 35,
        program,
        repeatedBytes: 56,
        signedMessages: [],
        stack: [
          hexToBin('02'),
          hexToBin('04'),
          hexToBin('02'),
          hexToBin('01'),
          hexToBin(''),
        ],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2],
        instructions,
        ip: 16,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 68,
          hashDigestIterations: 0,
          maxMemoryUsage: 6,
          signatureCheckCount: 0,
        },
        operationCount: 35,
        program,
        repeatedBytes: 61,
        signedMessages: [],
        stack: [hexToBin('02'), hexToBin('04'), hexToBin('02'), hexToBin('01')],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2, 16],
        instructions,
        ip: 17,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 69,
          hashDigestIterations: 0,
          maxMemoryUsage: 6,
          signatureCheckCount: 0,
        },
        operationCount: 35,
        program,
        repeatedBytes: 61,
        signedMessages: [],
        stack: [hexToBin('02'), hexToBin('04'), hexToBin('02'), hexToBin('01')],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2, 16],
        instructions,
        ip: 18,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 70,
          hashDigestIterations: 0,
          maxMemoryUsage: 6,
          signatureCheckCount: 0,
        },
        operationCount: 36,
        program,
        repeatedBytes: 61,
        signedMessages: [],
        stack: [hexToBin('02'), hexToBin('04'), hexToBin('02'), hexToBin('02')],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2, 16],
        instructions,
        ip: 19,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 71,
          hashDigestIterations: 0,
          maxMemoryUsage: 6,
          signatureCheckCount: 0,
        },
        operationCount: 37,
        program,
        repeatedBytes: 61,
        signedMessages: [],
        stack: [
          hexToBin('02'),
          hexToBin('04'),
          hexToBin('02'),
          hexToBin('02'),
          hexToBin('02'),
        ],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2, 16],
        instructions,
        ip: 20,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 72,
          hashDigestIterations: 0,
          maxMemoryUsage: 6,
          signatureCheckCount: 0,
        },
        operationCount: 37,
        program,
        repeatedBytes: 61,
        signedMessages: [],
        stack: [
          hexToBin('02'),
          hexToBin('04'),
          hexToBin('02'),
          hexToBin('02'),
          hexToBin('02'),
          hexToBin('03'),
        ],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2, 16],
        instructions,
        ip: 21,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 73,
          hashDigestIterations: 0,
          maxMemoryUsage: 6,
          signatureCheckCount: 0,
        },
        operationCount: 38,
        program,
        repeatedBytes: 61,
        signedMessages: [],
        stack: [
          hexToBin('02'),
          hexToBin('04'),
          hexToBin('02'),
          hexToBin('02'),
          hexToBin(''),
        ],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2],
        instructions,
        ip: 16,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 74,
          hashDigestIterations: 0,
          maxMemoryUsage: 6,
          signatureCheckCount: 0,
        },
        operationCount: 38,
        program,
        repeatedBytes: 66,
        signedMessages: [],
        stack: [hexToBin('02'), hexToBin('04'), hexToBin('02'), hexToBin('02')],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2, 16],
        instructions,
        ip: 17,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 75,
          hashDigestIterations: 0,
          maxMemoryUsage: 6,
          signatureCheckCount: 0,
        },
        operationCount: 38,
        program,
        repeatedBytes: 66,
        signedMessages: [],
        stack: [hexToBin('02'), hexToBin('04'), hexToBin('02'), hexToBin('02')],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2, 16],
        instructions,
        ip: 18,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 76,
          hashDigestIterations: 0,
          maxMemoryUsage: 6,
          signatureCheckCount: 0,
        },
        operationCount: 39,
        program,
        repeatedBytes: 66,
        signedMessages: [],
        stack: [hexToBin('02'), hexToBin('04'), hexToBin('02'), hexToBin('03')],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2, 16],
        instructions,
        ip: 19,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 77,
          hashDigestIterations: 0,
          maxMemoryUsage: 6,
          signatureCheckCount: 0,
        },
        operationCount: 40,
        program,
        repeatedBytes: 66,
        signedMessages: [],
        stack: [
          hexToBin('02'),
          hexToBin('04'),
          hexToBin('02'),
          hexToBin('03'),
          hexToBin('03'),
        ],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2, 16],
        instructions,
        ip: 20,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 78,
          hashDigestIterations: 0,
          maxMemoryUsage: 6,
          signatureCheckCount: 0,
        },
        operationCount: 40,
        program,
        repeatedBytes: 66,
        signedMessages: [],
        stack: [
          hexToBin('02'),
          hexToBin('04'),
          hexToBin('02'),
          hexToBin('03'),
          hexToBin('03'),
          hexToBin('03'),
        ],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2, 16],
        instructions,
        ip: 21,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 79,
          hashDigestIterations: 0,
          maxMemoryUsage: 6,
          signatureCheckCount: 0,
        },
        operationCount: 41,
        program,
        repeatedBytes: 66,
        signedMessages: [],
        stack: [
          hexToBin('02'),
          hexToBin('04'),
          hexToBin('02'),
          hexToBin('03'),
          hexToBin('01'),
        ],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2],
        instructions,
        ip: 22,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 80,
          hashDigestIterations: 0,
          maxMemoryUsage: 6,
          signatureCheckCount: 0,
        },
        operationCount: 41,
        program,
        repeatedBytes: 71,
        signedMessages: [],
        stack: [hexToBin('02'), hexToBin('04'), hexToBin('02'), hexToBin('03')],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2],
        instructions,
        ip: 23,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 81,
          hashDigestIterations: 0,
          maxMemoryUsage: 6,
          signatureCheckCount: 0,
        },
        operationCount: 42,
        program,
        repeatedBytes: 71,
        signedMessages: [],
        stack: [hexToBin('02'), hexToBin('04'), hexToBin('')],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [],
        instructions,
        ip: 2,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 82,
          hashDigestIterations: 0,
          maxMemoryUsage: 6,
          signatureCheckCount: 0,
        },
        operationCount: 42,
        program,
        repeatedBytes: 92,
        signedMessages: [],
        stack: [hexToBin('02'), hexToBin('04')],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2],
        instructions,
        ip: 3,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 83,
          hashDigestIterations: 0,
          maxMemoryUsage: 6,
          signatureCheckCount: 0,
        },
        operationCount: 42,
        program,
        repeatedBytes: 92,
        signedMessages: [],
        stack: [hexToBin('02'), hexToBin('04')],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2],
        instructions,
        ip: 4,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 84,
          hashDigestIterations: 0,
          maxMemoryUsage: 6,
          signatureCheckCount: 0,
        },
        operationCount: 42,
        program,
        repeatedBytes: 92,
        signedMessages: [],
        stack: [hexToBin('02'), hexToBin('04'), hexToBin('')],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2, 4],
        instructions,
        ip: 5,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 85,
          hashDigestIterations: 0,
          maxMemoryUsage: 6,
          signatureCheckCount: 0,
        },
        operationCount: 42,
        program,
        repeatedBytes: 92,
        signedMessages: [],
        stack: [hexToBin('02'), hexToBin('04'), hexToBin('')],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2, 4],
        instructions,
        ip: 6,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 86,
          hashDigestIterations: 0,
          maxMemoryUsage: 6,
          signatureCheckCount: 0,
        },
        operationCount: 43,
        program,
        repeatedBytes: 92,
        signedMessages: [],
        stack: [hexToBin('02'), hexToBin('04'), hexToBin('01')],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2, 4],
        instructions,
        ip: 7,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 87,
          hashDigestIterations: 0,
          maxMemoryUsage: 6,
          signatureCheckCount: 0,
        },
        operationCount: 44,
        program,
        repeatedBytes: 92,
        signedMessages: [],
        stack: [hexToBin('02'), hexToBin('04'), hexToBin('01'), hexToBin('01')],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2, 4],
        instructions,
        ip: 8,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 88,
          hashDigestIterations: 0,
          maxMemoryUsage: 6,
          signatureCheckCount: 0,
        },
        operationCount: 44,
        program,
        repeatedBytes: 92,
        signedMessages: [],
        stack: [
          hexToBin('02'),
          hexToBin('04'),
          hexToBin('01'),
          hexToBin('01'),
          hexToBin('02'),
        ],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2, 4],
        instructions,
        ip: 9,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 89,
          hashDigestIterations: 0,
          maxMemoryUsage: 6,
          signatureCheckCount: 0,
        },
        operationCount: 45,
        program,
        repeatedBytes: 92,
        signedMessages: [],
        stack: [hexToBin('02'), hexToBin('04'), hexToBin('01'), hexToBin('')],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2],
        instructions,
        ip: 4,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 90,
          hashDigestIterations: 0,
          maxMemoryUsage: 6,
          signatureCheckCount: 0,
        },
        operationCount: 45,
        program,
        repeatedBytes: 97,
        signedMessages: [],
        stack: [hexToBin('02'), hexToBin('04'), hexToBin('01')],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2, 4],
        instructions,
        ip: 5,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 91,
          hashDigestIterations: 0,
          maxMemoryUsage: 6,
          signatureCheckCount: 0,
        },
        operationCount: 45,
        program,
        repeatedBytes: 97,
        signedMessages: [],
        stack: [hexToBin('02'), hexToBin('04'), hexToBin('01')],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2, 4],
        instructions,
        ip: 6,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 92,
          hashDigestIterations: 0,
          maxMemoryUsage: 6,
          signatureCheckCount: 0,
        },
        operationCount: 46,
        program,
        repeatedBytes: 97,
        signedMessages: [],
        stack: [hexToBin('02'), hexToBin('04'), hexToBin('02')],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2, 4],
        instructions,
        ip: 7,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 93,
          hashDigestIterations: 0,
          maxMemoryUsage: 6,
          signatureCheckCount: 0,
        },
        operationCount: 47,
        program,
        repeatedBytes: 97,
        signedMessages: [],
        stack: [hexToBin('02'), hexToBin('04'), hexToBin('02'), hexToBin('02')],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2, 4],
        instructions,
        ip: 8,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 94,
          hashDigestIterations: 0,
          maxMemoryUsage: 6,
          signatureCheckCount: 0,
        },
        operationCount: 47,
        program,
        repeatedBytes: 97,
        signedMessages: [],
        stack: [
          hexToBin('02'),
          hexToBin('04'),
          hexToBin('02'),
          hexToBin('02'),
          hexToBin('02'),
        ],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2, 4],
        instructions,
        ip: 9,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 95,
          hashDigestIterations: 0,
          maxMemoryUsage: 6,
          signatureCheckCount: 0,
        },
        operationCount: 48,
        program,
        repeatedBytes: 97,
        signedMessages: [],
        stack: [hexToBin('02'), hexToBin('04'), hexToBin('02'), hexToBin('01')],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2],
        instructions,
        ip: 10,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 96,
          hashDigestIterations: 0,
          maxMemoryUsage: 6,
          signatureCheckCount: 0,
        },
        operationCount: 48,
        program,
        repeatedBytes: 102,
        signedMessages: [],
        stack: [hexToBin('02'), hexToBin('04'), hexToBin('02')],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2],
        instructions,
        ip: 11,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 97,
          hashDigestIterations: 0,
          maxMemoryUsage: 6,
          signatureCheckCount: 0,
        },
        operationCount: 49,
        program,
        repeatedBytes: 102,
        signedMessages: [],
        stack: [hexToBin('02'), hexToBin('06')],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2],
        instructions,
        ip: 12,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 98,
          hashDigestIterations: 0,
          maxMemoryUsage: 6,
          signatureCheckCount: 0,
        },
        operationCount: 50,
        program,
        repeatedBytes: 102,
        signedMessages: [],
        stack: [hexToBin('06'), hexToBin('02')],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2],
        instructions,
        ip: 13,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 99,
          hashDigestIterations: 0,
          maxMemoryUsage: 6,
          signatureCheckCount: 0,
        },
        operationCount: 51,
        program,
        repeatedBytes: 102,
        signedMessages: [],
        stack: [hexToBin('06'), hexToBin('03')],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2],
        instructions,
        ip: 14,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 100,
          hashDigestIterations: 0,
          maxMemoryUsage: 6,
          signatureCheckCount: 0,
        },
        operationCount: 52,
        program,
        repeatedBytes: 102,
        signedMessages: [],
        stack: [hexToBin('03'), hexToBin('06')],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2],
        instructions,
        ip: 15,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 101,
          hashDigestIterations: 0,
          maxMemoryUsage: 6,
          signatureCheckCount: 0,
        },
        operationCount: 53,
        program,
        repeatedBytes: 102,
        signedMessages: [],
        stack: [hexToBin('03'), hexToBin('06'), hexToBin('03')],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2],
        instructions,
        ip: 16,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 102,
          hashDigestIterations: 0,
          maxMemoryUsage: 6,
          signatureCheckCount: 0,
        },
        operationCount: 53,
        program,
        repeatedBytes: 102,
        signedMessages: [],
        stack: [hexToBin('03'), hexToBin('06'), hexToBin('03'), hexToBin('')],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2, 16],
        instructions,
        ip: 17,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 103,
          hashDigestIterations: 0,
          maxMemoryUsage: 6,
          signatureCheckCount: 0,
        },
        operationCount: 53,
        program,
        repeatedBytes: 102,
        signedMessages: [],
        stack: [hexToBin('03'), hexToBin('06'), hexToBin('03'), hexToBin('')],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2, 16],
        instructions,
        ip: 18,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 104,
          hashDigestIterations: 0,
          maxMemoryUsage: 6,
          signatureCheckCount: 0,
        },
        operationCount: 54,
        program,
        repeatedBytes: 102,
        signedMessages: [],
        stack: [hexToBin('03'), hexToBin('06'), hexToBin('03'), hexToBin('01')],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2, 16],
        instructions,
        ip: 19,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 105,
          hashDigestIterations: 0,
          maxMemoryUsage: 6,
          signatureCheckCount: 0,
        },
        operationCount: 55,
        program,
        repeatedBytes: 102,
        signedMessages: [],
        stack: [
          hexToBin('03'),
          hexToBin('06'),
          hexToBin('03'),
          hexToBin('01'),
          hexToBin('01'),
        ],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2, 16],
        instructions,
        ip: 20,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 106,
          hashDigestIterations: 0,
          maxMemoryUsage: 6,
          signatureCheckCount: 0,
        },
        operationCount: 55,
        program,
        repeatedBytes: 102,
        signedMessages: [],
        stack: [
          hexToBin('03'),
          hexToBin('06'),
          hexToBin('03'),
          hexToBin('01'),
          hexToBin('01'),
          hexToBin('03'),
        ],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2, 16],
        instructions,
        ip: 21,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 107,
          hashDigestIterations: 0,
          maxMemoryUsage: 6,
          signatureCheckCount: 0,
        },
        operationCount: 56,
        program,
        repeatedBytes: 102,
        signedMessages: [],
        stack: [
          hexToBin('03'),
          hexToBin('06'),
          hexToBin('03'),
          hexToBin('01'),
          hexToBin(''),
        ],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2],
        instructions,
        ip: 16,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 108,
          hashDigestIterations: 0,
          maxMemoryUsage: 6,
          signatureCheckCount: 0,
        },
        operationCount: 56,
        program,
        repeatedBytes: 107,
        signedMessages: [],
        stack: [hexToBin('03'), hexToBin('06'), hexToBin('03'), hexToBin('01')],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2, 16],
        instructions,
        ip: 17,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 109,
          hashDigestIterations: 0,
          maxMemoryUsage: 6,
          signatureCheckCount: 0,
        },
        operationCount: 56,
        program,
        repeatedBytes: 107,
        signedMessages: [],
        stack: [hexToBin('03'), hexToBin('06'), hexToBin('03'), hexToBin('01')],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2, 16],
        instructions,
        ip: 18,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 110,
          hashDigestIterations: 0,
          maxMemoryUsage: 6,
          signatureCheckCount: 0,
        },
        operationCount: 57,
        program,
        repeatedBytes: 107,
        signedMessages: [],
        stack: [hexToBin('03'), hexToBin('06'), hexToBin('03'), hexToBin('02')],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2, 16],
        instructions,
        ip: 19,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 111,
          hashDigestIterations: 0,
          maxMemoryUsage: 6,
          signatureCheckCount: 0,
        },
        operationCount: 58,
        program,
        repeatedBytes: 107,
        signedMessages: [],
        stack: [
          hexToBin('03'),
          hexToBin('06'),
          hexToBin('03'),
          hexToBin('02'),
          hexToBin('02'),
        ],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2, 16],
        instructions,
        ip: 20,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 112,
          hashDigestIterations: 0,
          maxMemoryUsage: 6,
          signatureCheckCount: 0,
        },
        operationCount: 58,
        program,
        repeatedBytes: 107,
        signedMessages: [],
        stack: [
          hexToBin('03'),
          hexToBin('06'),
          hexToBin('03'),
          hexToBin('02'),
          hexToBin('02'),
          hexToBin('03'),
        ],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2, 16],
        instructions,
        ip: 21,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 113,
          hashDigestIterations: 0,
          maxMemoryUsage: 6,
          signatureCheckCount: 0,
        },
        operationCount: 59,
        program,
        repeatedBytes: 107,
        signedMessages: [],
        stack: [
          hexToBin('03'),
          hexToBin('06'),
          hexToBin('03'),
          hexToBin('02'),
          hexToBin(''),
        ],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2],
        instructions,
        ip: 16,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 114,
          hashDigestIterations: 0,
          maxMemoryUsage: 6,
          signatureCheckCount: 0,
        },
        operationCount: 59,
        program,
        repeatedBytes: 112,
        signedMessages: [],
        stack: [hexToBin('03'), hexToBin('06'), hexToBin('03'), hexToBin('02')],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2, 16],
        instructions,
        ip: 17,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 115,
          hashDigestIterations: 0,
          maxMemoryUsage: 6,
          signatureCheckCount: 0,
        },
        operationCount: 59,
        program,
        repeatedBytes: 112,
        signedMessages: [],
        stack: [hexToBin('03'), hexToBin('06'), hexToBin('03'), hexToBin('02')],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2, 16],
        instructions,
        ip: 18,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 116,
          hashDigestIterations: 0,
          maxMemoryUsage: 6,
          signatureCheckCount: 0,
        },
        operationCount: 60,
        program,
        repeatedBytes: 112,
        signedMessages: [],
        stack: [hexToBin('03'), hexToBin('06'), hexToBin('03'), hexToBin('03')],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2, 16],
        instructions,
        ip: 19,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 117,
          hashDigestIterations: 0,
          maxMemoryUsage: 6,
          signatureCheckCount: 0,
        },
        operationCount: 61,
        program,
        repeatedBytes: 112,
        signedMessages: [],
        stack: [
          hexToBin('03'),
          hexToBin('06'),
          hexToBin('03'),
          hexToBin('03'),
          hexToBin('03'),
        ],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2, 16],
        instructions,
        ip: 20,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 118,
          hashDigestIterations: 0,
          maxMemoryUsage: 6,
          signatureCheckCount: 0,
        },
        operationCount: 61,
        program,
        repeatedBytes: 112,
        signedMessages: [],
        stack: [
          hexToBin('03'),
          hexToBin('06'),
          hexToBin('03'),
          hexToBin('03'),
          hexToBin('03'),
          hexToBin('03'),
        ],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2, 16],
        instructions,
        ip: 21,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 119,
          hashDigestIterations: 0,
          maxMemoryUsage: 6,
          signatureCheckCount: 0,
        },
        operationCount: 62,
        program,
        repeatedBytes: 112,
        signedMessages: [],
        stack: [
          hexToBin('03'),
          hexToBin('06'),
          hexToBin('03'),
          hexToBin('03'),
          hexToBin('01'),
        ],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2],
        instructions,
        ip: 22,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 120,
          hashDigestIterations: 0,
          maxMemoryUsage: 6,
          signatureCheckCount: 0,
        },
        operationCount: 62,
        program,
        repeatedBytes: 117,
        signedMessages: [],
        stack: [hexToBin('03'), hexToBin('06'), hexToBin('03'), hexToBin('03')],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [2],
        instructions,
        ip: 23,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 121,
          hashDigestIterations: 0,
          maxMemoryUsage: 6,
          signatureCheckCount: 0,
        },
        operationCount: 63,
        program,
        repeatedBytes: 117,
        signedMessages: [],
        stack: [hexToBin('03'), hexToBin('06'), hexToBin('01')],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [],
        instructions,
        ip: 24,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 122,
          hashDigestIterations: 0,
          maxMemoryUsage: 6,
          signatureCheckCount: 0,
        },
        operationCount: 63,
        program,
        repeatedBytes: 138,
        signedMessages: [],
        stack: [hexToBin('03'), hexToBin('06')],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [],
        instructions,
        ip: 25,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 123,
          hashDigestIterations: 0,
          maxMemoryUsage: 6,
          signatureCheckCount: 0,
        },
        operationCount: 64,
        program,
        repeatedBytes: 138,
        signedMessages: [],
        stack: [hexToBin('06')],
        transactionLengthBytes: 10062,
      },
      {
        alternateStack: [],
        controlStack: [],
        instructions,
        ip: 25,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 123,
          hashDigestIterations: 0,
          maxMemoryUsage: 6,
          signatureCheckCount: 0,
        },
        operationCount: 64,
        program,
        repeatedBytes: 138,
        signedMessages: [],
        stack: [hexToBin('06')],
        transactionLengthBytes: 10062,
      },
    ],
    stringifyTestVector(traceWithUnlockingPhaseAndFinalState),
  );

  t.deepEqual(extracted, {
    samples: [],
    unmatchedStates: [],
  });
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

    const internalProgram1 = createAuthenticationProgramEvaluationCommon(
      hexToBin('0151'),
    );
    const internalProgram2 = createAuthenticationProgramEvaluationCommon(
      hexToBin('515293'),
    );
    const internalProgram3 = createAuthenticationProgramEvaluationCommon(
      hexToBin('03616263'),
    );
    const internalProgram4 = createAuthenticationProgramEvaluationCommon(
      hexToBin('0000036162637e7e'),
    );
    const internalProgram5 = createAuthenticationProgramEvaluationCommon(
      hexToBin('017e'),
    );
    const internalProgram6 = createAuthenticationProgramEvaluationCommon(
      hexToBin('00007e'),
    );

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
                                metrics: {
                                  executedInstructionCount: 0,
                                  hashDigestIterations: 0,
                                  maxMemoryUsage: 0,
                                  signatureCheckCount: 0,
                                },
                                operationCount: 0,
                                program: internalProgram1,
                                repeatedBytes: 0,
                                signedMessages: [],
                                stack: [],
                                transactionLengthBytes: 10062,
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
                                metrics: {
                                  executedInstructionCount: 0,
                                  hashDigestIterations: 0,
                                  maxMemoryUsage: 0,
                                  signatureCheckCount: 0,
                                },
                                operationCount: 0,
                                program: internalProgram1,
                                repeatedBytes: 0,
                                signedMessages: [],
                                stack: [],
                                transactionLengthBytes: 10062,
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
                                metrics: {
                                  executedInstructionCount: 1,
                                  hashDigestIterations: 0,
                                  maxMemoryUsage: 1,
                                  signatureCheckCount: 0,
                                },
                                operationCount: 0,
                                program: internalProgram1,
                                repeatedBytes: 0,
                                signedMessages: [],
                                stack: [hexToBin('51')],
                                transactionLengthBytes: 10062,
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
                                metrics: {
                                  executedInstructionCount: 1,
                                  hashDigestIterations: 0,
                                  maxMemoryUsage: 1,
                                  signatureCheckCount: 0,
                                },
                                operationCount: 0,
                                program: internalProgram1,
                                repeatedBytes: 0,
                                signedMessages: [],
                                stack: [hexToBin('51')],
                                transactionLengthBytes: 10062,
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
                          metrics: {
                            executedInstructionCount: 0,
                            hashDigestIterations: 0,
                            maxMemoryUsage: 0,
                            signatureCheckCount: 0,
                          },
                          operationCount: 0,
                          program: internalProgram2,
                          repeatedBytes: 0,
                          signedMessages: [],
                          stack: [],
                          transactionLengthBytes: 10062,
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
                          metrics: {
                            executedInstructionCount: 0,
                            hashDigestIterations: 0,
                            maxMemoryUsage: 0,
                            signatureCheckCount: 0,
                          },
                          operationCount: 0,
                          program: internalProgram2,
                          repeatedBytes: 0,
                          signedMessages: [],
                          stack: [],
                          transactionLengthBytes: 10062,
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
                          metrics: {
                            executedInstructionCount: 1,
                            hashDigestIterations: 0,
                            maxMemoryUsage: 1,
                            signatureCheckCount: 0,
                          },
                          operationCount: 0,
                          program: internalProgram2,
                          repeatedBytes: 0,
                          signedMessages: [],
                          stack: [hexToBin('01')],
                          transactionLengthBytes: 10062,
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
                          metrics: {
                            executedInstructionCount: 2,
                            hashDigestIterations: 0,
                            maxMemoryUsage: 2,
                            signatureCheckCount: 0,
                          },
                          operationCount: 0,
                          program: internalProgram2,
                          repeatedBytes: 0,
                          signedMessages: [],
                          stack: [hexToBin('01'), hexToBin('02')],
                          transactionLengthBytes: 10062,
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
                          metrics: {
                            executedInstructionCount: 3,
                            hashDigestIterations: 0,
                            maxMemoryUsage: 2,
                            signatureCheckCount: 0,
                          },
                          operationCount: 1,
                          program: internalProgram2,
                          repeatedBytes: 0,
                          signedMessages: [],
                          stack: [hexToBin('03')],
                          transactionLengthBytes: 10062,
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
                          metrics: {
                            executedInstructionCount: 3,
                            hashDigestIterations: 0,
                            maxMemoryUsage: 2,
                            signatureCheckCount: 0,
                          },
                          operationCount: 1,
                          program: internalProgram2,
                          repeatedBytes: 0,
                          signedMessages: [],
                          stack: [hexToBin('03')],
                          transactionLengthBytes: 10062,
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
                          metrics: {
                            executedInstructionCount: 0,
                            hashDigestIterations: 0,
                            maxMemoryUsage: 0,
                            signatureCheckCount: 0,
                          },
                          operationCount: 0,
                          program: internalProgram3,
                          repeatedBytes: 0,
                          signedMessages: [],
                          stack: [],
                          transactionLengthBytes: 10062,
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
                          metrics: {
                            executedInstructionCount: 0,
                            hashDigestIterations: 0,
                            maxMemoryUsage: 0,
                            signatureCheckCount: 0,
                          },
                          operationCount: 0,
                          program: internalProgram3,
                          repeatedBytes: 0,
                          signedMessages: [],
                          stack: [],
                          transactionLengthBytes: 10062,
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
                          metrics: {
                            executedInstructionCount: 1,
                            hashDigestIterations: 0,
                            maxMemoryUsage: 3,
                            signatureCheckCount: 0,
                          },
                          operationCount: 0,
                          program: internalProgram3,
                          repeatedBytes: 0,
                          signedMessages: [],
                          stack: [hexToBin('616263')],
                          transactionLengthBytes: 10062,
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
                          metrics: {
                            executedInstructionCount: 1,
                            hashDigestIterations: 0,
                            maxMemoryUsage: 3,
                            signatureCheckCount: 0,
                          },
                          operationCount: 0,
                          program: internalProgram3,
                          repeatedBytes: 0,
                          signedMessages: [],
                          stack: [hexToBin('616263')],
                          transactionLengthBytes: 10062,
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
                    metrics: {
                      executedInstructionCount: 0,
                      hashDigestIterations: 0,
                      maxMemoryUsage: 0,
                      signatureCheckCount: 0,
                    },
                    operationCount: 0,
                    program: internalProgram4,
                    repeatedBytes: 0,
                    signedMessages: [],
                    stack: [],
                    transactionLengthBytes: 10062,
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
                    metrics: {
                      executedInstructionCount: 0,
                      hashDigestIterations: 0,
                      maxMemoryUsage: 0,
                      signatureCheckCount: 0,
                    },
                    operationCount: 0,
                    program: internalProgram4,
                    repeatedBytes: 0,
                    signedMessages: [],
                    stack: [],
                    transactionLengthBytes: 10062,
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
                    metrics: {
                      executedInstructionCount: 1,
                      hashDigestIterations: 0,
                      maxMemoryUsage: 0,
                      signatureCheckCount: 0,
                    },
                    operationCount: 0,
                    program: internalProgram4,
                    repeatedBytes: 0,
                    signedMessages: [],
                    stack: [hexToBin('')],
                    transactionLengthBytes: 10062,
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
                    metrics: {
                      executedInstructionCount: 2,
                      hashDigestIterations: 0,
                      maxMemoryUsage: 0,
                      signatureCheckCount: 0,
                    },
                    operationCount: 0,
                    program: internalProgram4,
                    repeatedBytes: 0,
                    signedMessages: [],
                    stack: [hexToBin(''), hexToBin('')],
                    transactionLengthBytes: 10062,
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
                    metrics: {
                      executedInstructionCount: 3,
                      hashDigestIterations: 0,
                      maxMemoryUsage: 3,
                      signatureCheckCount: 0,
                    },
                    operationCount: 0,
                    program: internalProgram4,
                    repeatedBytes: 0,
                    signedMessages: [],
                    stack: [hexToBin(''), hexToBin(''), hexToBin('616263')],
                    transactionLengthBytes: 10062,
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
                    metrics: {
                      executedInstructionCount: 4,
                      hashDigestIterations: 0,
                      maxMemoryUsage: 3,
                      signatureCheckCount: 0,
                    },
                    operationCount: 1,
                    program: internalProgram4,
                    repeatedBytes: 0,
                    signedMessages: [],
                    stack: [hexToBin(''), hexToBin('616263')],
                    transactionLengthBytes: 10062,
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
                    metrics: {
                      executedInstructionCount: 5,
                      hashDigestIterations: 0,
                      maxMemoryUsage: 3,
                      signatureCheckCount: 0,
                    },
                    operationCount: 2,
                    program: internalProgram4,
                    repeatedBytes: 0,
                    signedMessages: [],
                    stack: [hexToBin('616263')],
                    transactionLengthBytes: 10062,
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
                    metrics: {
                      executedInstructionCount: 5,
                      hashDigestIterations: 0,
                      maxMemoryUsage: 3,
                      signatureCheckCount: 0,
                    },
                    operationCount: 2,
                    program: internalProgram4,
                    repeatedBytes: 0,
                    signedMessages: [],
                    stack: [hexToBin('616263')],
                    transactionLengthBytes: 10062,
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
                          metrics: {
                            executedInstructionCount: 0,
                            hashDigestIterations: 0,
                            maxMemoryUsage: 0,
                            signatureCheckCount: 0,
                          },
                          operationCount: 0,
                          program: internalProgram5,
                          repeatedBytes: 0,
                          signedMessages: [],
                          stack: [],
                          transactionLengthBytes: 10062,
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
                          metrics: {
                            executedInstructionCount: 0,
                            hashDigestIterations: 0,
                            maxMemoryUsage: 0,
                            signatureCheckCount: 0,
                          },
                          operationCount: 0,
                          program: internalProgram5,
                          repeatedBytes: 0,
                          signedMessages: [],
                          stack: [],
                          transactionLengthBytes: 10062,
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
                          metrics: {
                            executedInstructionCount: 1,
                            hashDigestIterations: 0,
                            maxMemoryUsage: 1,
                            signatureCheckCount: 0,
                          },
                          operationCount: 0,
                          program: internalProgram5,
                          repeatedBytes: 0,
                          signedMessages: [],
                          stack: [hexToBin('7e')],
                          transactionLengthBytes: 10062,
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
                          metrics: {
                            executedInstructionCount: 1,
                            hashDigestIterations: 0,
                            maxMemoryUsage: 1,
                            signatureCheckCount: 0,
                          },
                          operationCount: 0,
                          program: internalProgram5,
                          repeatedBytes: 0,
                          signedMessages: [],
                          stack: [hexToBin('7e')],
                          transactionLengthBytes: 10062,
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
                    metrics: {
                      executedInstructionCount: 0,
                      hashDigestIterations: 0,
                      maxMemoryUsage: 0,
                      signatureCheckCount: 0,
                    },
                    operationCount: 0,
                    program: internalProgram6,
                    repeatedBytes: 0,
                    signedMessages: [],
                    stack: [],
                    transactionLengthBytes: 10062,
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
                    metrics: {
                      executedInstructionCount: 0,
                      hashDigestIterations: 0,
                      maxMemoryUsage: 0,
                      signatureCheckCount: 0,
                    },
                    operationCount: 0,
                    program: internalProgram6,
                    repeatedBytes: 0,
                    signedMessages: [],
                    stack: [],
                    transactionLengthBytes: 10062,
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
                    metrics: {
                      executedInstructionCount: 1,
                      hashDigestIterations: 0,
                      maxMemoryUsage: 0,
                      signatureCheckCount: 0,
                    },
                    operationCount: 0,
                    program: internalProgram6,
                    repeatedBytes: 0,
                    signedMessages: [],
                    stack: [hexToBin('')],
                    transactionLengthBytes: 10062,
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
                    metrics: {
                      executedInstructionCount: 2,
                      hashDigestIterations: 0,
                      maxMemoryUsage: 0,
                      signatureCheckCount: 0,
                    },
                    operationCount: 0,
                    program: internalProgram6,
                    repeatedBytes: 0,
                    signedMessages: [],
                    stack: [hexToBin(''), hexToBin('')],
                    transactionLengthBytes: 10062,
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
                    metrics: {
                      executedInstructionCount: 3,
                      hashDigestIterations: 0,
                      maxMemoryUsage: 0,
                      signatureCheckCount: 0,
                    },
                    operationCount: 1,
                    program: internalProgram6,
                    repeatedBytes: 0,
                    signedMessages: [],
                    stack: [hexToBin('')],
                    transactionLengthBytes: 10062,
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
                    metrics: {
                      executedInstructionCount: 3,
                      hashDigestIterations: 0,
                      maxMemoryUsage: 0,
                      signatureCheckCount: 0,
                    },
                    operationCount: 1,
                    program: internalProgram6,
                    repeatedBytes: 0,
                    signedMessages: [],
                    stack: [hexToBin('')],
                    transactionLengthBytes: 10062,
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
          metrics: {
            executedInstructionCount: 0,
            signatureCheckCount: 0,
          },
          operationCount: 0,
          program,
          signedMessages: [],
          stack: [],
          transactionLengthBytes: 10062,
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
          metrics: {
            executedInstructionCount: 0,
            signatureCheckCount: 0,
          },
          operationCount: 0,
          program,
          signedMessages: [],
          stack: [],
          transactionLengthBytes: 10062,
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
          metrics: {
            executedInstructionCount: 1,
            signatureCheckCount: 0,
          },
          operationCount: 0,
          program,
          signedMessages: [],
          stack: [hexToBin('')],
          transactionLengthBytes: 10062,
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
          metrics: {
            executedInstructionCount: 2,
            signatureCheckCount: 0,
          },
          operationCount: 0,
          program,
          signedMessages: [],
          stack: [hexToBin(''), hexToBin('616263')],
          transactionLengthBytes: 10062,
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
          metrics: {
            executedInstructionCount: 2,
            signatureCheckCount: 0,
          },
          operationCount: 0,
          program,
          signedMessages: [],
          stack: [hexToBin(''), hexToBin('616263')],
          transactionLengthBytes: 10062,
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
              metrics: {
                executedInstructionCount: 0,
                signatureCheckCount: 0,
              },
              operationCount: 0,
              program: {
                inputIndex: 0,
                sourceOutputs: [
                  {
                    lockingBytecode: hexToBin('0003616263'),
                    valueSatoshis: 0n,
                  },
                ],
                transaction: program.transaction,
              },
              signedMessages: [],
              stack: [],
              transactionLengthBytes: 10062,
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
              metrics: {
                executedInstructionCount: 1,
                signatureCheckCount: 0,
              },
              operationCount: 0,
              program: {
                inputIndex: 0,
                sourceOutputs: [
                  {
                    lockingBytecode: hexToBin('0003616263'),
                    valueSatoshis: 0n,
                  },
                ],
                transaction: program.transaction,
              },
              signedMessages: [],
              stack: [hexToBin('')],
              transactionLengthBytes: 10062,
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
              metrics: {
                executedInstructionCount: 0,
                hashDigestIterations: 0,
                maxMemoryUsage: 0,
                signatureCheckCount: 0,
              },
              operationCount: 0,
              program: {
                inputIndex: 0,
                sourceOutputs: [
                  {
                    lockingBytecode: hexToBin('0000036162637e7e'),
                    valueSatoshis: 0n,
                  },
                ],
                transaction: program.transaction,
              },
              repeatedBytes: 0,
              signedMessages: [],
              stack: [],
              transactionLengthBytes: 10062,
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
                  metrics: {
                    executedInstructionCount: 1,
                    hashDigestIterations: 0,
                    maxMemoryUsage: 0,
                    signatureCheckCount: 0,
                  },
                  operationCount: 0,
                  program: {
                    inputIndex: 0,
                    sourceOutputs: [
                      {
                        lockingBytecode: hexToBin('0000036162637e7e'),
                        valueSatoshis: 0n,
                      },
                    ],
                    transaction: program.transaction,
                  },
                  repeatedBytes: 0,
                  signedMessages: [],
                  stack: [hexToBin('')],
                  transactionLengthBytes: 10062,
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
              metrics: {
                executedInstructionCount: 2,
                hashDigestIterations: 0,
                maxMemoryUsage: 0,
                signatureCheckCount: 0,
              },
              operationCount: 0,
              program: {
                inputIndex: 0,
                sourceOutputs: [
                  {
                    lockingBytecode: hexToBin('0000036162637e7e'),
                    valueSatoshis: 0n,
                  },
                ],
                transaction: program.transaction,
              },
              repeatedBytes: 0,
              signedMessages: [],
              stack: [hexToBin(''), hexToBin('')],
              transactionLengthBytes: 10062,
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
              metrics: {
                executedInstructionCount: 0,
                hashDigestIterations: 0,
                maxMemoryUsage: 0,
                signatureCheckCount: 0,
              },
              operationCount: 0,
              program: {
                inputIndex: 0,
                sourceOutputs: [
                  {
                    lockingBytecode: hexToBin('515293'),
                    valueSatoshis: 0n,
                  },
                ],
                transaction: program.transaction,
              },
              repeatedBytes: 0,
              signedMessages: [],
              stack: [],
              transactionLengthBytes: 10062,
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
              metrics: {
                executedInstructionCount: 0,
                hashDigestIterations: 0,
                maxMemoryUsage: 0,
                signatureCheckCount: 0,
              },
              operationCount: 0,
              program: {
                inputIndex: 0,
                sourceOutputs: [
                  {
                    lockingBytecode: hexToBin('0151'),
                    valueSatoshis: 0n,
                  },
                ],
                transaction: program.transaction,
              },
              repeatedBytes: 0,
              signedMessages: [],
              stack: [],
              transactionLengthBytes: 10062,
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
              metrics: {
                executedInstructionCount: 1,
                hashDigestIterations: 0,
                maxMemoryUsage: 1,
                signatureCheckCount: 0,
              },
              operationCount: 0,
              program: {
                inputIndex: 0,
                sourceOutputs: [
                  {
                    lockingBytecode: hexToBin('0151'),
                    valueSatoshis: 0n,
                  },
                ],
                transaction: program.transaction,
              },
              repeatedBytes: 0,
              signedMessages: [],
              stack: [hexToBin('51')],
              transactionLengthBytes: 10062,
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
              metrics: {
                executedInstructionCount: 1,
                hashDigestIterations: 0,
                maxMemoryUsage: 1,
                signatureCheckCount: 0,
              },
              operationCount: 0,
              program: {
                inputIndex: 0,
                sourceOutputs: [
                  {
                    lockingBytecode: hexToBin('515293'),
                    valueSatoshis: 0n,
                  },
                ],
                transaction: program.transaction,
              },
              repeatedBytes: 0,
              signedMessages: [],
              stack: [hexToBin('01')],
              transactionLengthBytes: 10062,
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
              metrics: {
                executedInstructionCount: 2,
                hashDigestIterations: 0,
                maxMemoryUsage: 2,
                signatureCheckCount: 0,
              },
              operationCount: 0,
              program: {
                inputIndex: 0,
                sourceOutputs: [
                  {
                    lockingBytecode: hexToBin('515293'),
                    valueSatoshis: 0n,
                  },
                ],
                transaction: program.transaction,
              },
              repeatedBytes: 0,
              signedMessages: [],
              stack: [hexToBin('01'), hexToBin('02')],
              transactionLengthBytes: 10062,
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
              metrics: {
                executedInstructionCount: 3,
                hashDigestIterations: 0,
                maxMemoryUsage: 2,
                signatureCheckCount: 0,
              },
              operationCount: 1,
              program: {
                inputIndex: 0,
                sourceOutputs: [
                  {
                    lockingBytecode: hexToBin('515293'),
                    valueSatoshis: 0n,
                  },
                ],
                transaction: program.transaction,
              },
              repeatedBytes: 0,
              signedMessages: [],
              stack: [hexToBin('03')],
              transactionLengthBytes: 10062,
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
              metrics: {
                executedInstructionCount: 0,
                hashDigestIterations: 0,
                maxMemoryUsage: 0,
                signatureCheckCount: 0,
              },
              operationCount: 0,
              program: {
                inputIndex: 0,
                sourceOutputs: [
                  {
                    lockingBytecode: hexToBin('03616263'),
                    valueSatoshis: 0n,
                  },
                ],
                transaction: program.transaction,
              },
              repeatedBytes: 0,
              signedMessages: [],
              stack: [],
              transactionLengthBytes: 10062,
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
              metrics: {
                executedInstructionCount: 1,
                hashDigestIterations: 0,
                maxMemoryUsage: 3,
                signatureCheckCount: 0,
              },
              operationCount: 0,
              program: {
                inputIndex: 0,
                sourceOutputs: [
                  {
                    lockingBytecode: hexToBin('03616263'),
                    valueSatoshis: 0n,
                  },
                ],
                transaction: program.transaction,
              },
              repeatedBytes: 0,
              signedMessages: [],
              stack: [hexToBin('616263')],
              transactionLengthBytes: 10062,
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
              metrics: {
                executedInstructionCount: 3,
                hashDigestIterations: 0,
                maxMemoryUsage: 3,
                signatureCheckCount: 0,
              },
              operationCount: 0,
              program: {
                inputIndex: 0,
                sourceOutputs: [
                  {
                    lockingBytecode: hexToBin('0000036162637e7e'),
                    valueSatoshis: 0n,
                  },
                ],
                transaction: program.transaction,
              },
              repeatedBytes: 0,
              signedMessages: [],
              stack: [hexToBin(''), hexToBin(''), hexToBin('616263')],
              transactionLengthBytes: 10062,
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
              metrics: {
                executedInstructionCount: 4,
                hashDigestIterations: 0,
                maxMemoryUsage: 3,
                signatureCheckCount: 0,
              },
              operationCount: 1,
              program: {
                inputIndex: 0,
                sourceOutputs: [
                  {
                    lockingBytecode: hexToBin('0000036162637e7e'),
                    valueSatoshis: 0n,
                  },
                ],
                transaction: program.transaction,
              },
              repeatedBytes: 0,
              signedMessages: [],
              stack: [hexToBin(''), hexToBin('616263')],
              transactionLengthBytes: 10062,
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
              metrics: {
                executedInstructionCount: 5,
                hashDigestIterations: 0,
                maxMemoryUsage: 3,
                signatureCheckCount: 0,
              },
              operationCount: 2,
              program: {
                inputIndex: 0,
                sourceOutputs: [
                  {
                    lockingBytecode: hexToBin('0000036162637e7e'),
                    valueSatoshis: 0n,
                  },
                ],
                transaction: program.transaction,
              },
              repeatedBytes: 0,
              signedMessages: [],
              stack: [hexToBin('616263')],
              transactionLengthBytes: 10062,
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
              metrics: {
                executedInstructionCount: 0,
                hashDigestIterations: 0,
                maxMemoryUsage: 0,
                signatureCheckCount: 0,
              },
              operationCount: 0,
              program: {
                inputIndex: 0,
                sourceOutputs: [
                  {
                    lockingBytecode: hexToBin('00007e'),
                    valueSatoshis: 0n,
                  },
                ],
                transaction: program.transaction,
              },
              repeatedBytes: 0,
              signedMessages: [],
              stack: [],
              transactionLengthBytes: 10062,
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
              metrics: {
                executedInstructionCount: 1,
                hashDigestIterations: 0,
                maxMemoryUsage: 0,
                signatureCheckCount: 0,
              },
              operationCount: 0,
              program: {
                inputIndex: 0,
                sourceOutputs: [
                  {
                    lockingBytecode: hexToBin('00007e'),
                    valueSatoshis: 0n,
                  },
                ],
                transaction: program.transaction,
              },
              repeatedBytes: 0,
              signedMessages: [],
              stack: [hexToBin('')],
              transactionLengthBytes: 10062,
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
              metrics: {
                executedInstructionCount: 2,
                hashDigestIterations: 0,
                maxMemoryUsage: 0,
                signatureCheckCount: 0,
              },
              operationCount: 0,
              program: {
                inputIndex: 0,
                sourceOutputs: [
                  {
                    lockingBytecode: hexToBin('00007e'),
                    valueSatoshis: 0n,
                  },
                ],
                transaction: program.transaction,
              },
              repeatedBytes: 0,
              signedMessages: [],
              stack: [hexToBin(''), hexToBin('')],
              transactionLengthBytes: 10062,
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
              metrics: {
                executedInstructionCount: 0,
                hashDigestIterations: 0,
                maxMemoryUsage: 0,
                signatureCheckCount: 0,
              },
              operationCount: 0,
              program: {
                inputIndex: 0,
                sourceOutputs: [
                  {
                    lockingBytecode: hexToBin('017e'),
                    valueSatoshis: 0n,
                  },
                ],
                transaction: program.transaction,
              },
              repeatedBytes: 0,
              signedMessages: [],
              stack: [],
              transactionLengthBytes: 10062,
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
              metrics: {
                executedInstructionCount: 1,
                hashDigestIterations: 0,
                maxMemoryUsage: 1,
                signatureCheckCount: 0,
              },
              operationCount: 0,
              program: {
                inputIndex: 0,
                sourceOutputs: [
                  {
                    lockingBytecode: hexToBin('017e'),
                    valueSatoshis: 0n,
                  },
                ],
                transaction: program.transaction,
              },
              repeatedBytes: 0,
              signedMessages: [],
              stack: [hexToBin('7e')],
              transactionLengthBytes: 10062,
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
              metrics: {
                executedInstructionCount: 3,
                hashDigestIterations: 0,
                maxMemoryUsage: 0,
                signatureCheckCount: 0,
              },
              operationCount: 1,
              program: {
                inputIndex: 0,
                sourceOutputs: [
                  {
                    lockingBytecode: hexToBin('00007e'),
                    valueSatoshis: 0n,
                  },
                ],
                transaction: program.transaction,
              },
              repeatedBytes: 0,
              signedMessages: [],
              stack: [hexToBin('')],
              transactionLengthBytes: 10062,
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
              metrics: {
                executedInstructionCount: 2,
                signatureCheckCount: 0,
              },
              operationCount: 0,
              program: {
                inputIndex: 0,
                sourceOutputs: [
                  {
                    lockingBytecode: hexToBin('0003616263'),
                    valueSatoshis: 0n,
                  },
                ],
                transaction: program.transaction,
              },
              signedMessages: [],
              stack: [hexToBin(''), hexToBin('616263')],
              transactionLengthBytes: 10062,
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
            metrics: {
              executedInstructionCount: 2,
              signatureCheckCount: 0,
            },
            operationCount: 0,
            program: {
              inputIndex: 0,
              sourceOutputs: [
                {
                  lockingBytecode: hexToBin('0003616263'),
                  valueSatoshis: 0n,
                },
              ],
              transaction: program.transaction,
            },
            signedMessages: [],
            stack: [hexToBin(''), hexToBin('616263')],
            transactionLengthBytes: 10062,
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

test('summarizeDebugTrace, stringifyDebugTraceSummary', (t) => {
  const { program } = assertSuccess(
    walletTemplateToCompilerBch({
      entities: {},
      scripts: {
        lock: {
          lockingType: 'standard',
          script: `OP_DUP OP_TOALTSTACK OP_IF <2> OP_ELSE 0xff OP_ENDIF OP_FROMALTSTACK OP_ADD <3> OP_EQUAL`,
        },
        unlock: { script: '<1>', unlocks: 'lock' },
      },
      supported: ['BCH_2022_05'],
      version: 0,
    }).generateScenario({ unlockingScriptId: 'unlock' }),
  );
  const trace = createVirtualMachineBch(true).debug(program);
  const summary = summarizeDebugTrace(trace);
  const formatted = stringifyDebugTraceSummary(summary, {
    opcodes: {
      ...OpcodesBch,
      [OpcodesBch.OP_UNKNOWN255]: undefined as unknown as string,
    },
  });
  t.deepEqual(
    formatted,
    `0. OP_1:                0x01(1)
=>                      0x01(1)
0. OP_DUP:              0x01(1) 0x01(1)
1. OP_TOALTSTACK:       0x01(1)| alt: 0x01(1)
2. OP_IF:               | alt: 0x01(1)
3. OP_2:                0x02(2)| alt: 0x01(1)
4. OP_ELSE:             0x02(2)| alt: 0x01(1)
5. (skip)OP_UNKNOWN255: 0x02(2)| alt: 0x01(1)
6. (skip)OP_ENDIF:      0x02(2)| alt: 0x01(1)
7. OP_FROMALTSTACK:     0x02(2) 0x01(1)
8. OP_ADD:              0x03(3)
9. OP_3:                0x03(3) 0x03(3)
10. OP_EQUAL:           0x01(1)
=>                      0x01(1)`,
    stringifyTestVector(formatted),
  );
});

test('summarizeDebugTrace, stringifyDebugTraceSummary (truncated)', (t) => {
  const { program } = assertSuccess(
    walletTemplateToCompilerBch({
      entities: {},
      scripts: {
        lock: {
          lockingType: 'standard',
          script: `OP_DUP OP_TOALTSTACK OP_IF <2> OP_ELSE 0xff OP_ENDIF OP_FROMALTSTACK OP_ADD <3> OP_EQUAL`,
        },
        unlock: { script: '<1>', unlocks: 'lock' },
      },
      supported: ['BCH_2022_05'],
      version: 0,
    }).generateScenario({ unlockingScriptId: 'unlock' }),
  );
  const trace = createVirtualMachineBch(true).debug(program);
  const summary = summarizeDebugTrace(trace);
  const formatted = stringifyDebugTraceSummary(summary, {
    opcodes: {
      ...OpcodesBch,
      [OpcodesBch.OP_UNKNOWN255]: undefined as unknown as string,
    },
    printLineCount: 5,
  });
  t.deepEqual(
    formatted,
    `[9 steps truncated]
7. OP_FROMALTSTACK:     0x02(2) 0x01(1)
8. OP_ADD:              0x03(3)
9. OP_3:                0x03(3) 0x03(3)
10. OP_EQUAL:           0x01(1)
=>                      0x01(1)`,
    stringifyTestVector(formatted),
  );
});

test('summarizeDebugTrace, stringifyDebugTraceSummary (error)', (t) => {
  const { program } = assertSuccess(
    walletTemplateToCompilerBch({
      entities: {},
      scripts: {
        lock: {
          lockingType: 'standard',
          script: `OP_DUP OP_TOALTSTACK OP_IF <2> OP_ELSE 0xff OP_ENDIF OP_FROMALTSTACK OP_ADD <3> OP_EQUAL`,
        },
        unlock: { script: '<0>', unlocks: 'lock' },
      },
      supported: ['BCH_2022_05'],
      version: 0,
    }).generateScenario({ unlockingScriptId: 'unlock' }),
  );
  const trace = createVirtualMachineBch(true).debug(program);
  const summary = summarizeDebugTrace(trace);
  const formatted = stringifyDebugTraceSummary(summary);
  t.deepEqual(
    formatted,
    `0. OP_0:                0x(0)
=>                      0x(0)
0. OP_DUP:              0x(0) 0x(0)
1. OP_TOALTSTACK:       0x(0)| alt: 0x(0)
2. OP_IF:               | alt: 0x(0)
3. (skip)OP_2:          | alt: 0x(0)
4. (skip)OP_ELSE:       | alt: 0x(0)
5. OP_UNKNOWN255:       Called an unknown opcode.
6. OP_ENDIF:            Called an unknown opcode.`,
    stringifyTestVector(formatted),
  );
});
