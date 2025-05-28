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
  useOneVmNumber,
} from '../../common/common.js';

import { ConsensusBch2026 } from './bch-2026-consensus.js';
import { AuthenticationErrorBch2026 } from './bch-2026-errors.js';
import { OpcodesBch2026 } from './bch-2026-opcodes.js';

export const createOpDefine =
  ({
    maximumFunctionIdentifier = ConsensusBch2026.maximumFunctionIdentifier,
    minimumFunctionIdentifier = ConsensusBch2026.minimumFunctionIdentifier,
  } = {}) =>
  <
    State extends AuthenticationProgramStateError &
      AuthenticationProgramStateFunctionTable &
      AuthenticationProgramStateStack,
  >(
    state: State,
  ) =>
    useOneVmNumber(state, (nextState, [providedInteger]) => {
      const functionIdentifier = Number(providedInteger);
      if (
        functionIdentifier < minimumFunctionIdentifier ||
        functionIdentifier > maximumFunctionIdentifier
      ) {
        return applyError(
          nextState,
          AuthenticationErrorBch2026.functionIdentifierInvalid,
          `Function identifier (${functionIdentifier}) is outside of the valid range: ${minimumFunctionIdentifier} to ${maximumFunctionIdentifier} (inclusive).`,
        );
      }
      if (nextState.functionTable[functionIdentifier] !== undefined) {
        return applyError(
          nextState,
          AuthenticationErrorBch2026.functionIdentifierPreviouslyDefined,
          `Function identifier: ${functionIdentifier}. Existing contents: ${binToHex(
            nextState.functionTable[functionIdentifier],
          )}.`,
        );
      }
      return useOneStackItem(nextState, (finalState, [functionBody]) => {
        // eslint-disable-next-line functional/no-expression-statements, functional/immutable-data
        finalState.functionTable[functionIdentifier] = functionBody;
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
  useOneVmNumber(state, (nextState, [providedInteger]) => {
    const functionTableIndex = Number(providedInteger);
    const functionBody = nextState.functionTable[functionTableIndex];
    if (functionBody === undefined) {
      return applyError(
        nextState,
        AuthenticationErrorBch2026.functionIdentifierUndefined,
        `Function identifier: ${functionTableIndex}.`,
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
