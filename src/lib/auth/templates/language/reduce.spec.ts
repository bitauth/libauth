// tslint:disable:no-expression-statement no-magic-numbers
import test from 'ava';

import {
  AuthenticationInstruction,
  createAuthenticationProgramExternalStateCommonEmpty,
  createAuthenticationProgramStateCommon
} from '../../auth';
import {
  AuthenticationProgramStateBCH,
  instantiateVirtualMachineBCH,
  OpcodesBCH
} from '../../instruction-sets/bch/bch';

import { sampledEvaluateReductionTraceNodes } from './reduce';

const vmPromise = instantiateVirtualMachineBCH();
const createCreateStateWithStack = <Opcodes, Errors>(stack: Uint8Array[]) => (
  instructions: ReadonlyArray<AuthenticationInstruction<Opcodes>>
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

test('sampledEvaluateReductionTraceNodes: empty evaluation', async t => {
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
            startLineNumber: 1
          }
        }
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
            startLineNumber: 1
          },
          state
        }
      ],
      success: true
    }
  );
});
