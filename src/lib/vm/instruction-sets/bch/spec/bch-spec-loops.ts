import type { AuthenticationProgramStateBchSpec } from '../../../../lib.js';
import {
  applyError,
  ConsensusCommon,
  encodeAuthenticationInstructions,
  pushToControlStack,
  useOneStackItem,
} from '../../common/common.js';

import { AuthenticationErrorBchSpec } from './bch-spec-errors.js';

export const opBegin = <State extends AuthenticationProgramStateBchSpec>(
  state: State,
) => pushToControlStack(state, state.ip);

export const opUntil = <State extends AuthenticationProgramStateBchSpec>(
  state: State,
) => {
  // eslint-disable-next-line functional/immutable-data
  const controlValue = state.controlStack.pop();
  if (typeof controlValue !== 'number') {
    return applyError(state, AuthenticationErrorBchSpec.unexpectedUntil);
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
    if (item.length === 1 && item[0] === 1) {
      return nextState;
    }
    // eslint-disable-next-line functional/no-expression-statements, functional/immutable-data
    nextState.ip = controlValue - 1;
    return nextState;
  });
};
