import type { AuthenticationProgramStateMinimum } from '../../../../lib.js';

export const opCodeSeparatorChipLimits = <
  State extends AuthenticationProgramStateMinimum & {
    lastCodeSeparator: number;
  },
>(
  state: State,
) => {
  // eslint-disable-next-line functional/no-expression-statements, functional/immutable-data
  state.lastCodeSeparator = state.ip;
  return state;
};
