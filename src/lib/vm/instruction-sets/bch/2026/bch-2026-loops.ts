import type { AuthenticationProgramStateBch2026 } from '../../../../lib.js';
import {
  applyError,
  ConsensusCommon,
  encodeAuthenticationInstructions,
  executionIsActive,
  pushToControlStack,
  stackItemIsTruthy,
  useOneStackItem,
} from '../../common/common.js';
import { AuthenticationErrorBchSpec } from '../spec/bch-spec-errors.js';

const enum Constants {
  markInactiveOpBegin = -1,
}

export const opBegin = <State extends AuthenticationProgramStateBch2026>(
  state: State,
) =>
  executionIsActive(state)
    ? pushToControlStack(state, state.ip)
    : pushToControlStack(state, Constants.markInactiveOpBegin);

export const opUntil = <State extends AuthenticationProgramStateBch2026>(
  state: State,
) => {
  // eslint-disable-next-line functional/immutable-data
  const controlValue = state.controlStack.pop();
  if (typeof controlValue !== 'number') {
    return applyError(state, AuthenticationErrorBchSpec.unexpectedUntil);
  }
  if (!executionIsActive(state)) {
    return controlValue === Constants.markInactiveOpBegin
      ? state
      : applyError(
          state,
          AuthenticationErrorBchSpec.unexpectedUntilMissingEndIf,
        );
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
      AuthenticationErrorBchSpec.excessiveLooping,
      `Repeated bytes: ${state.repeatedBytes}; active bytecode length: ${activeBytecodeLength}`,
    );
  }
  return useOneStackItem(state, (nextState, [item]) => {
    if (stackItemIsTruthy(item)) {
      return nextState;
    }
    // eslint-disable-next-line functional/no-expression-statements, functional/immutable-data
    nextState.ip = controlValue - 1;
    return nextState;
  });
};
