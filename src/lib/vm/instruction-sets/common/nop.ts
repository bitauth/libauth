import type { AuthenticationProgramStateError } from '../../../lib.js';

import { applyError, AuthenticationErrorCommon } from './errors.js';

export const opNop = <State>(state: State) => state;

export const opNopDisallowed = <State extends AuthenticationProgramStateError>(
  state: State,
) => applyError(state, AuthenticationErrorCommon.calledUpgradableNop);

/**
 * "Disabled" operations are explicitly forbidden from occurring anywhere in VM
 * bytecode, even within an unexecuted branch.
 */
export const disabledOperation = <
  State extends AuthenticationProgramStateError,
>(
  state: State,
) => applyError(state, AuthenticationErrorCommon.unknownOpcode);
