import type {
  AuthenticationInstructionPush,
  AuthenticationProgramStateBCHCHIPs,
  AuthenticationProgramStateControlStackCHIPs,
  AuthenticationProgramStateError,
  AuthenticationProgramStateMinimum,
  AuthenticationProgramStateStack,
  Operation,
} from '../../../../lib.js';
import {
  applyError,
  AuthenticationErrorCommon,
  ConsensusCommon,
  encodeAuthenticationInstructions,
  isMinimalDataPush,
  pushToStack,
  stackItemIsTruthy,
  useOneStackItem,
} from '../../common/common.js';

import { AuthenticationErrorBCHCHIPs } from './bch-chips-errors.js';

const executionIsActive = <
  State extends AuthenticationProgramStateControlStackCHIPs,
>(
  state: State,
) => state.controlStack.every((item) => item !== false);

/**
 * An implementation of {@link conditionallyEvaluate} that supports
 * `CHIP-2021-05-loops`.
 */
export const conditionallyEvaluateChipLoops =
  <State extends AuthenticationProgramStateControlStackCHIPs>(
    operation: Operation<State>,
  ): Operation<State> =>
  (state: State) =>
    executionIsActive(state) ? operation(state) : state;

export const undefinedOperationChipLoops = conditionallyEvaluateChipLoops(
  <
    State extends AuthenticationProgramStateControlStackCHIPs &
      AuthenticationProgramStateError,
  >(
    state: State,
  ) => applyError(state, AuthenticationErrorCommon.unknownOpcode),
);

export const pushOperationChipLoops =
  <
    State extends AuthenticationProgramStateControlStackCHIPs &
      AuthenticationProgramStateError &
      AuthenticationProgramStateMinimum &
      AuthenticationProgramStateStack,
  >(
    maximumPushSize = ConsensusCommon.maximumStackItemLength as number,
  ): Operation<State> =>
  (state: State) => {
    const instruction = state.instructions[
      state.ip
    ] as AuthenticationInstructionPush;
    return instruction.data.length > maximumPushSize
      ? applyError(
          state,
          `${AuthenticationErrorCommon.exceededMaximumStackItemLength} Item length: ${instruction.data.length} bytes.`,
        )
      : executionIsActive(state)
        ? isMinimalDataPush(instruction.opcode, instruction.data)
          ? pushToStack(state, instruction.data)
          : applyError(state, AuthenticationErrorCommon.nonMinimalPush)
        : state;
  };

/**
 * Return the provided state with the provided value pushed to its control stack.
 * @param state - the state to update and return
 * @param data - the value to push to the stack
 */
export const pushToControlStackChipLoops = <
  State extends AuthenticationProgramStateControlStackCHIPs,
>(
  state: State,
  value: boolean | number,
) => {
  // eslint-disable-next-line functional/no-expression-statements, functional/immutable-data
  state.controlStack.push(value);
  return state;
};

export const opIfChipLoops = <
  State extends AuthenticationProgramStateControlStackCHIPs &
    AuthenticationProgramStateError &
    AuthenticationProgramStateStack,
>(
  state: State,
) => {
  if (executionIsActive(state)) {
    return useOneStackItem(state, (nextState, [item]) =>
      pushToControlStackChipLoops(nextState, stackItemIsTruthy(item)),
    );
  }
  return pushToControlStackChipLoops(state, false);
};

export const opNotIfChipLoops = <
  State extends AuthenticationProgramStateControlStackCHIPs &
    AuthenticationProgramStateError &
    AuthenticationProgramStateStack,
>(
  state: State,
) => {
  if (executionIsActive(state)) {
    return useOneStackItem(state, (nextState, [item]) =>
      pushToControlStackChipLoops(nextState, !stackItemIsTruthy(item)),
    );
  }
  return pushToControlStackChipLoops(state, false);
};

export const opEndIfChipLoops = <
  State extends AuthenticationProgramStateControlStackCHIPs &
    AuthenticationProgramStateError,
>(
  state: State,
) => {
  // eslint-disable-next-line functional/immutable-data
  const element = state.controlStack.pop();
  if (typeof element !== 'boolean') {
    return applyError(state, AuthenticationErrorCommon.unexpectedEndIf);
  }
  return state;
};

export const opElseChipLoops = <
  State extends AuthenticationProgramStateControlStackCHIPs &
    AuthenticationProgramStateError,
>(
  state: State,
) => {
  const top = state.controlStack[state.controlStack.length - 1];
  if (typeof top !== 'boolean') {
    return applyError(state, AuthenticationErrorCommon.unexpectedElse);
  }
  // eslint-disable-next-line functional/no-expression-statements, functional/immutable-data
  state.controlStack[state.controlStack.length - 1] = !top;
  return state;
};

export const opBegin = <State extends AuthenticationProgramStateBCHCHIPs>(
  state: State,
) => pushToControlStackChipLoops(state, state.ip);

export const opUntil = <State extends AuthenticationProgramStateBCHCHIPs>(
  state: State,
) => {
  // eslint-disable-next-line functional/immutable-data
  const controlValue = state.controlStack.pop();
  if (typeof controlValue !== 'number') {
    return applyError(state, AuthenticationErrorBCHCHIPs.unexpectedUntil);
  }
  // eslint-disable-next-line functional/no-expression-statements, functional/immutable-data
  state.repeatedBytes += encodeAuthenticationInstructions(
    state.instructions.slice(controlValue, state.ip),
  ).length;
  const activeBytecodeLength = encodeAuthenticationInstructions(
    state.instructions,
  ).length;
  if (
    state.repeatedBytes + activeBytecodeLength >
    ConsensusCommon.maximumBytecodeLength
  ) {
    return applyError(
      state,
      AuthenticationErrorBCHCHIPs.excessiveLooping,
      `Repeated bytes: ${state.repeatedBytes}; active bytecode length: ${activeBytecodeLength}`,
    );
  }
  return useOneStackItem(state, (nextState, [item]) => {
    if (item.length === 1 && item[0] === 1) {
      return nextState;
    }
    // eslint-disable-next-line functional/no-expression-statements, functional/immutable-data
    nextState.ip = controlValue - 1;
    return nextState;
  });
};
