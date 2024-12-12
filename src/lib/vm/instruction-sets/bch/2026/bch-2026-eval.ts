import type {
  AuthenticationInstructionMalformed,
  AuthenticationProgramStateBch2026,
} from '../../../../lib.js';
import {
  applyError,
  authenticationInstructionsAreMalformed,
  decodeAuthenticationInstructions,
  disassembleAuthenticationInstructionMalformed,
  executionIsActive,
  pushToControlStack,
  useOneStackItem,
} from '../../common/common.js';

import { AuthenticationErrorBch2026 } from './bch-2026-errors.js';
import { OpcodesBch2026 } from './bch-2026-opcodes.js';

export const opEval = <State extends AuthenticationProgramStateBch2026>(
  state: State,
) => {
  if (executionIsActive(state)) {
    return useOneStackItem(state, (nextState, [item]) => {
      const newInstructions = decodeAuthenticationInstructions(item);

      if (authenticationInstructionsAreMalformed(newInstructions)) {
        return applyError(
          nextState,
          AuthenticationErrorBch2026.malformedEval,
          `Malformed instruction: ${disassembleAuthenticationInstructionMalformed(
            OpcodesBch2026,
            newInstructions[
              newInstructions.length - 1
            ] as AuthenticationInstructionMalformed,
          )}.`,
        );
      }

      const manuallyAdvance = 1;
      const finalState = pushToControlStack(nextState, {
        instructions: nextState.instructions,
        ip: nextState.ip + manuallyAdvance,
      });
      finalState.ip = 0 - manuallyAdvance; // eslint-disable-line functional/no-expression-statements, functional/immutable-data
      finalState.instructions = newInstructions; // eslint-disable-line functional/no-expression-statements, functional/immutable-data
      return finalState;
    });
  }
  return state;
};
