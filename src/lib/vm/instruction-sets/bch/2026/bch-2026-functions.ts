import { binToHex } from '../../../../format/format.js';
import type {
  AuthenticationInstructionMalformed,
  AuthenticationProgramStateControlStack,
  AuthenticationProgramStateError,
  AuthenticationProgramStateFunctionTable,
  AuthenticationProgramStateMinimum,
  AuthenticationProgramStateStack,
} from '../../../../lib.js';
import {
  applyError,
  authenticationInstructionsAreMalformed,
  decodeAuthenticationInstructions,
  disassembleAuthenticationInstructionMalformed,
  pushToControlStack,
  useOneStackItem,
} from '../../common/common.js';

import { ConsensusBch2026 } from './bch-2026-consensus.js';
import { AuthenticationErrorBch2026 } from './bch-2026-errors.js';
import { OpcodesBch2026 } from './bch-2026-opcodes.js';

export const createOpDefine =
  ({
    maximumFunctionIdentifierLength = ConsensusBch2026.maximumFunctionIdentifierLength,
  } = {}) =>
  <
    State extends AuthenticationProgramStateError &
      AuthenticationProgramStateFunctionTable &
      AuthenticationProgramStateStack,
  >(
    state: State,
  ) =>
    useOneStackItem(state, (nextState, [functionIdentifier]) => {
      const functionTableKey = binToHex(functionIdentifier);
      if (functionIdentifier.length > maximumFunctionIdentifierLength) {
        return applyError(
          nextState,
          AuthenticationErrorBch2026.functionIdentifierExcessiveLength,
          `Function identifier has excessive length. Maximum length: ${maximumFunctionIdentifierLength}. Provided length: ${functionIdentifier.length}. Provided identifier: 0x${functionTableKey}.`,
        );
      }
      if (nextState.functionTable[functionTableKey] !== undefined) {
        return applyError(
          nextState,
          AuthenticationErrorBch2026.functionIdentifierPreviouslyDefined,
          `Function identifier: 0x${functionTableKey}. Existing contents: ${binToHex(
            nextState.functionTable[functionTableKey],
          )}.`,
        );
      }
      return useOneStackItem(nextState, (finalState, [functionBody]) => {
        // eslint-disable-next-line functional/no-expression-statements, functional/immutable-data
        finalState.functionTable[functionTableKey] = functionBody;
        // eslint-disable-next-line functional/no-expression-statements, functional/immutable-data
        finalState.functionCount += 1;
        return finalState;
      });
    });

export const opInvoke = <
  State extends AuthenticationProgramStateControlStack &
    AuthenticationProgramStateError &
    AuthenticationProgramStateFunctionTable &
    AuthenticationProgramStateMinimum &
    AuthenticationProgramStateStack,
>(
  state: State,
) =>
  useOneStackItem(state, (nextState, [functionIdentifier]) => {
    const functionTableKey = binToHex(functionIdentifier);
    const functionBody = nextState.functionTable[functionTableKey];
    if (functionBody === undefined) {
      return applyError(
        nextState,
        AuthenticationErrorBch2026.functionIdentifierUndefined,
        `Function identifier: 0x${functionTableKey}.`,
      );
    }
    const newInstructions = decodeAuthenticationInstructions(functionBody);
    if (authenticationInstructionsAreMalformed(newInstructions)) {
      return applyError(
        nextState,
        AuthenticationErrorBch2026.malformedFunction,
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
