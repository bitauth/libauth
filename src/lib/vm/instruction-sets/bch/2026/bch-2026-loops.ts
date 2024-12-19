import type { AuthenticationProgramStateBch2026 } from '../../../../lib.js';
import {
  applyError,
  executionIsActive,
  pushToControlStack,
  stackItemIsTruthy,
  useOneStackItem,
} from '../../common/common.js';

import { AuthenticationErrorBch2026 } from './bch-2026-errors.js';

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
    return applyError(state, AuthenticationErrorBch2026.unexpectedUntil);
  }
  if (!executionIsActive(state)) {
    return controlValue === Constants.markInactiveOpBegin
      ? state
      : applyError(
          state,
          AuthenticationErrorBch2026.unexpectedUntilMissingEndIf,
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
