import {
  AuthenticationProgramStateAlternateStack,
  AuthenticationProgramStateError,
  AuthenticationProgramStateStack,
} from '../../vm-types';

import {
  pushToStack,
  useFourStackItems,
  useOneScriptNumber,
  useOneStackItem,
  useSixStackItems,
  useThreeStackItems,
  useTwoStackItems,
} from './combinators';
import { applyError, AuthenticationErrorCommon } from './errors';
import { OpcodesCommon } from './opcodes';
import { bigIntToScriptNumber, stackItemIsTruthy } from './types';

export const opToAltStack = <
  State extends AuthenticationProgramStateStack &
    AuthenticationProgramStateAlternateStack
>() => (state: State) =>
  useOneStackItem(state, (nextState, [item]) => {
    // eslint-disable-next-line functional/no-expression-statement, functional/immutable-data
    nextState.alternateStack.push(item);
    return nextState;
  });

export const opFromAltStack = <
  State extends AuthenticationProgramStateStack &
    AuthenticationProgramStateAlternateStack &
    AuthenticationProgramStateError<Errors>,
  Errors
>() => (state: State) => {
  // eslint-disable-next-line functional/immutable-data
  const item = state.alternateStack.pop();
  if (item === undefined) {
    return applyError<State, Errors>(
      AuthenticationErrorCommon.emptyAlternateStack,
      state
    );
  }
  return pushToStack(state, item);
};

export const op2Drop = <State extends AuthenticationProgramStateStack>() => (
  state: State
) => useTwoStackItems(state, (nextState) => nextState);

export const op2Dup = <State extends AuthenticationProgramStateStack>() => (
  state: State
) =>
  useTwoStackItems(state, (nextState, [a, b]) =>
    pushToStack(nextState, a, b, a.slice(), b.slice())
  );

export const op3Dup = <State extends AuthenticationProgramStateStack>() => (
  state: State
) =>
  useThreeStackItems(state, (nextState, [a, b, c]) =>
    pushToStack(nextState, a, b, c, a.slice(), b.slice(), c.slice())
  );

export const op2Over = <State extends AuthenticationProgramStateStack>() => (
  state: State
) =>
  useFourStackItems(state, (nextState, [a, b, c, d]) =>
    pushToStack(nextState, a, b, c, d, a.slice(), b.slice())
  );

export const op2Rot = <State extends AuthenticationProgramStateStack>() => (
  state: State
) =>
  useSixStackItems(state, (nextState, [a, b, c, d, e, f]) =>
    pushToStack(nextState, c, d, e, f, a, b)
  );

export const op2Swap = <State extends AuthenticationProgramStateStack>() => (
  state: State
) =>
  useFourStackItems(state, (nextState, [a, b, c, d]) =>
    pushToStack(nextState, c, d, a, b)
  );

export const opIfDup = <State extends AuthenticationProgramStateStack>() => (
  state: State
) =>
  useOneStackItem(state, (nextState, [item]) =>
    pushToStack(
      nextState,
      ...(stackItemIsTruthy(item) ? [item, item.slice()] : [item])
    )
  );

export const opDepth = <State extends AuthenticationProgramStateStack>() => (
  state: State
) => pushToStack(state, bigIntToScriptNumber(BigInt(state.stack.length)));

export const opDrop = <State extends AuthenticationProgramStateStack>() => (
  state: State
) => useOneStackItem(state, (nextState) => nextState);

export const opDup = <State extends AuthenticationProgramStateStack>() => (
  state: State
) =>
  useOneStackItem(state, (nextState, [item]) =>
    pushToStack(nextState, item, item.slice())
  );

export const opNip = <State extends AuthenticationProgramStateStack>() => (
  state: State
) => useTwoStackItems(state, (nextState, [, b]) => pushToStack(nextState, b));

export const opOver = <State extends AuthenticationProgramStateStack>() => (
  state: State
) =>
  useTwoStackItems(state, (nextState, [a, b]) =>
    pushToStack(nextState, a, b, a.slice())
  );

export const opPick = <
  State extends AuthenticationProgramStateStack &
    AuthenticationProgramStateError<Errors>,
  Errors
>({
  requireMinimalEncoding,
}: {
  requireMinimalEncoding: boolean;
}) => (state: State) =>
  useOneScriptNumber(
    state,
    (nextState, depth) => {
      const item = nextState.stack[
        nextState.stack.length - 1 - Number(depth)
      ] as Uint8Array | undefined;
      if (item === undefined) {
        return applyError<State, Errors>(
          AuthenticationErrorCommon.invalidStackIndex,
          state
        );
      }
      return pushToStack(nextState, item.slice());
    },
    { requireMinimalEncoding }
  );

export const opRoll = <
  State extends AuthenticationProgramStateStack &
    AuthenticationProgramStateError<Errors>,
  Errors
>({
  requireMinimalEncoding,
}: {
  requireMinimalEncoding: boolean;
}) => (state: State) =>
  useOneScriptNumber(
    state,
    (nextState, depth) => {
      const index = nextState.stack.length - 1 - Number(depth);
      if (index < 0 || index > nextState.stack.length - 1) {
        return applyError<State, Errors>(
          AuthenticationErrorCommon.invalidStackIndex,
          state
        );
      }
      // eslint-disable-next-line functional/immutable-data
      return pushToStack(nextState, nextState.stack.splice(index, 1)[0]);
    },
    { requireMinimalEncoding }
  );

export const opRot = <State extends AuthenticationProgramStateStack>() => (
  state: State
) =>
  useThreeStackItems(state, (nextState, [a, b, c]) =>
    pushToStack(nextState, b, c, a)
  );

export const opSwap = <State extends AuthenticationProgramStateStack>() => (
  state: State
) =>
  useTwoStackItems(state, (nextState, [a, b]) => pushToStack(nextState, b, a));

export const opTuck = <State extends AuthenticationProgramStateStack>() => (
  state: State
) =>
  useTwoStackItems(state, (nextState, [a, b]) =>
    pushToStack(nextState, b.slice(), a, b)
  );

export const stackOperations = <
  State extends AuthenticationProgramStateStack &
    AuthenticationProgramStateAlternateStack &
    AuthenticationProgramStateError<Errors>,
  Errors
>(flags: {
  requireMinimalEncoding: boolean;
}) => ({
  [OpcodesCommon.OP_TOALTSTACK]: opToAltStack<State>(),
  [OpcodesCommon.OP_FROMALTSTACK]: opFromAltStack<State, Errors>(),
  [OpcodesCommon.OP_2DROP]: op2Drop<State>(),
  [OpcodesCommon.OP_2DUP]: op2Dup<State>(),
  [OpcodesCommon.OP_3DUP]: op3Dup<State>(),
  [OpcodesCommon.OP_2OVER]: op2Over<State>(),
  [OpcodesCommon.OP_2ROT]: op2Rot<State>(),
  [OpcodesCommon.OP_2SWAP]: op2Swap<State>(),
  [OpcodesCommon.OP_IFDUP]: opIfDup<State>(),
  [OpcodesCommon.OP_DEPTH]: opDepth<State>(),
  [OpcodesCommon.OP_DROP]: opDrop<State>(),
  [OpcodesCommon.OP_DUP]: opDup<State>(),
  [OpcodesCommon.OP_NIP]: opNip<State>(),
  [OpcodesCommon.OP_OVER]: opOver<State>(),
  [OpcodesCommon.OP_PICK]: opPick<State, Errors>(flags),
  [OpcodesCommon.OP_ROLL]: opRoll<State, Errors>(flags),
  [OpcodesCommon.OP_ROT]: opRot<State>(),
  [OpcodesCommon.OP_SWAP]: opSwap<State>(),
  [OpcodesCommon.OP_TUCK]: opTuck<State>(),
});
