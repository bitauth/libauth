/* eslint-disable functional/no-expression-statement */
import test from 'ava';

import {
  AuthenticationInstruction,
  AuthenticationProgramStateBCH,
  createAuthenticationProgramExternalStateCommonEmpty,
  createAuthenticationProgramStateCommon,
  instantiateVirtualMachineBCH,
  OpcodesBCH,
  sampledEvaluateReductionTraceNodes,
} from '../../../lib';

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
