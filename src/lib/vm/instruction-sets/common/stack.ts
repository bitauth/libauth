import type {
  AuthenticationProgramStateAlternateStack,
  AuthenticationProgramStateError,
  AuthenticationProgramStateStack,
} from '../../../lib.js';

import {
  pushToStack,
  useFourStackItems,
  useOneStackItem,
  useOneVmNumber,
  useSixStackItems,
  useThreeStackItems,
  useTwoStackItems,
} from './combinators.js';
import { applyError, AuthenticationErrorCommon } from './errors.js';
import {
  bigIntToVmNumber,
  stackItemIsTruthy,
} from './instruction-sets-utils.js';

export const opToAltStack = <
  State extends AuthenticationProgramStateAlternateStack &
    AuthenticationProgramStateStack,
>(
  state: State,
) =>
  useOneStackItem(state, (nextState, [item]) => {
    // eslint-disable-next-line functional/no-expression-statements, functional/immutable-data
    nextState.alternateStack.push(item);
    return nextState;
  });

export const opFromAltStack = <
  State extends AuthenticationProgramStateAlternateStack &
    AuthenticationProgramStateError &
    AuthenticationProgramStateStack,
>(
  state: State,
) => {
  // eslint-disable-next-line functional/immutable-data
  const item = state.alternateStack.pop();
  if (item === undefined) {
    return applyError(state, AuthenticationErrorCommon.emptyAlternateStack);
  }
  return pushToStack(state, [item]);
};

export const op2Drop = <State extends AuthenticationProgramStateStack>(
  state: State,
) => useTwoStackItems(state, (nextState) => nextState);

export const op2Dup = <State extends AuthenticationProgramStateStack>(
  state: State,
) =>
  useTwoStackItems(state, (nextState, [a, b]) =>
    pushToStack(nextState, [a, b, a.slice(), b.slice()], {
      pushedBytes: a.length + b.length,
    }),
  );

export const op3Dup = <State extends AuthenticationProgramStateStack>(
  state: State,
) =>
  useThreeStackItems(state, (nextState, [a, b, c]) =>
    pushToStack(nextState, [a, b, c, a.slice(), b.slice(), c.slice()], {
      pushedBytes: a.length + b.length + c.length,
    }),
  );

export const op2Over = <State extends AuthenticationProgramStateStack>(
  state: State,
) =>
  useFourStackItems(state, (nextState, [a, b, c, d]) =>
    pushToStack(nextState, [a, b, c, d, a.slice(), b.slice()], {
      pushedBytes: a.length + b.length,
    }),
  );

export const op2Rot = <State extends AuthenticationProgramStateStack>(
  state: State,
) =>
  useSixStackItems(state, (nextState, [a, b, c, d, e, f]) =>
    pushToStack(nextState, [c, d, e, f, a, b], {
      pushedBytes: a.length + b.length,
    }),
  );

export const op2Swap = <State extends AuthenticationProgramStateStack>(
  state: State,
) =>
  useFourStackItems(state, (nextState, [a, b, c, d]) =>
    pushToStack(nextState, [c, d, a, b], {
      pushedBytes: 0,
    }),
  );

export const opIfDup = <State extends AuthenticationProgramStateStack>(
  state: State,
) =>
  useOneStackItem(state, (nextState, [item]) =>
    stackItemIsTruthy(item)
      ? pushToStack(nextState, [item, item.slice()], {
          pushedBytes: item.length,
        })
      : pushToStack(nextState, [item], {
          pushedBytes: 0,
        }),
  );

export const opDepth = <State extends AuthenticationProgramStateStack>(
  state: State,
) => pushToStack(state, [bigIntToVmNumber(BigInt(state.stack.length))]);

export const opDrop = <State extends AuthenticationProgramStateStack>(
  state: State,
) => useOneStackItem(state, (nextState) => nextState);

export const opDup = <State extends AuthenticationProgramStateStack>(
  state: State,
) =>
  useOneStackItem(state, (nextState, [item]) =>
    pushToStack(nextState, [item, item.slice()], {
      pushedBytes: item.length,
    }),
  );

export const opNip = <State extends AuthenticationProgramStateStack>(
  state: State,
) =>
  useTwoStackItems(state, (nextState, [, b]) =>
    pushToStack(nextState, [b], { pushedBytes: 0 }),
  );

export const opOver = <State extends AuthenticationProgramStateStack>(
  state: State,
) =>
  useTwoStackItems(state, (nextState, [a, b]) =>
    pushToStack(nextState, [a, b, a.slice()], {
      pushedBytes: a.length,
    }),
  );

export const opPick = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack,
>(
  state: State,
) =>
  useOneVmNumber(state, (nextState, [depth]) => {
    const item = nextState.stack[nextState.stack.length - 1 - Number(depth)];
    if (item === undefined) {
      return applyError(
        state,
        AuthenticationErrorCommon.invalidStackIndex,
        `Current stack depth: ${nextState.stack.length}; requested depth: ${depth}.`,
      );
    }
    return pushToStack(nextState, [item.slice()]);
  });

export const opRoll = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack,
>(
  state: State,
) =>
  useOneVmNumber(state, (nextState, [depthBigInt]) => {
    const depth = Number(depthBigInt);
    const index = nextState.stack.length - 1 - depth;
    if (index < 0 || index > nextState.stack.length - 1) {
      return applyError(
        state,
        AuthenticationErrorCommon.invalidStackIndex,
        `Current stack depth: ${nextState.stack.length}; requested depth: ${depth}.`,
      );
    }
    // eslint-disable-next-line functional/immutable-data, @typescript-eslint/no-non-null-assertion
    const item = nextState.stack.splice(index, 1)[0]!;
    return pushToStack(nextState, [item], { pushedBytes: item.length + depth });
  });

export const opRot = <State extends AuthenticationProgramStateStack>(
  state: State,
) =>
  useThreeStackItems(state, (nextState, [a, b, c]) =>
    pushToStack(nextState, [b, c, a], {
      pushedBytes: 0,
    }),
  );

export const opSwap = <State extends AuthenticationProgramStateStack>(
  state: State,
) =>
  useTwoStackItems(state, (nextState, [a, b]) =>
    pushToStack(nextState, [b, a], {
      pushedBytes: 0,
    }),
  );

export const opTuck = <State extends AuthenticationProgramStateStack>(
  state: State,
) =>
  useTwoStackItems(state, (nextState, [a, b]) =>
    pushToStack(nextState, [b.slice(), a, b], {
      pushedBytes: b.length,
    }),
  );

export const opSize = <State extends AuthenticationProgramStateStack>(
  state: State,
) =>
  useOneStackItem(state, (nextState, [item]) => {
    const size = bigIntToVmNumber(BigInt(item.length));
    return pushToStack(nextState, [item, size], {
      pushedBytes: size.length,
    });
  });
