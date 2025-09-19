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

import { AuthenticationErrorBchSpec } from './bch-spec-errors.js';
import { OpcodesBchSpec } from './bch-spec-opcodes.js';

export const opEval = <State extends AuthenticationProgramStateBch2026>(
  state: State,
) => {
  if (executionIsActive(state)) {
    return useOneStackItem(state, (nextState, [item]) => {
      const newInstructions = decodeAuthenticationInstructions(item);

      if (authenticationInstructionsAreMalformed(newInstructions)) {
        return applyError(
          nextState,
          AuthenticationErrorBchSpec.malformedEval,
          `Malformed instruction: ${disassembleAuthenticationInstructionMalformed(
            OpcodesBchSpec,
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
