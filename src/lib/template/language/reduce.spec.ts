/* eslint-disable functional/no-expression-statement */
import test from 'ava';

import {
  AuthenticationInstruction,
  AuthenticationProgramStateBCH,
  createAuthenticationProgramExternalStateCommonEmpty,
  createAuthenticationProgramStateCommon,
  instantiateVirtualMachineBCH,
  mergeRanges,
  OpcodesBCH,
  sampledEvaluateReductionTraceNodes,
} from '../../lib';

const vmPromise = instantiateVirtualMachineBCH();
const createCreateStateWithStack = <Opcodes, Errors>(stack: Uint8Array[]) => (
  instructions: readonly AuthenticationInstruction<Opcodes>[]
) =>
  createAuthenticationProgramStateCommon<Opcodes, Errors>(
    instructions,
    stack,
    createAuthenticationProgramExternalStateCommonEmpty()
  );
const state = createCreateStateWithStack<
  OpcodesBCH,
  AuthenticationProgramStateBCH
>([])([]) as AuthenticationProgramStateBCH;
const getState = () => state;

test('sampledEvaluateReductionTraceNodes: empty evaluation', async (t) => {
  const vm = await vmPromise;
  t.deepEqual(
    sampledEvaluateReductionTraceNodes<
      OpcodesBCH,
      AuthenticationProgramStateBCH
    >(
      [
        {
          bytecode: Uint8Array.of(),
          range: {
            endColumn: 1,
            endLineNumber: 1,
            startColumn: 1,
            startLineNumber: 1,
          },
        },
      ],
      vm,
      getState
    ),
    {
      bytecode: Uint8Array.of(),
      samples: [
        {
          range: {
            endColumn: 1,
            endLineNumber: 1,
            startColumn: 1,
            startLineNumber: 1,
          },
          state,
        },
      ],
      success: true,
    }
  );
});

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
