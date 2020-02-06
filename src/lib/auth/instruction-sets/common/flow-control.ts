import {
  AuthenticationProgramStateCommon,
  ErrorState,
  ExecutionStackState,
  StackState
} from '../../state';
import { Operation } from '../../virtual-machine';

import { opNot } from './arithmetic';
import { conditionallyEvaluate, useOneStackItem } from './combinators';
import { stackItemIsTruthy } from './common';
import { applyError, AuthenticationErrorCommon } from './errors';
import { OpcodesCommon } from './opcodes';

export const opVerify = <
  State extends StackState & ErrorState<Errors>,
  Errors
>(): Operation<State> => (state: State) =>
  useOneStackItem(state, (nextState, item) =>
    stackItemIsTruthy(item)
      ? nextState
      : applyError<State, Errors>(
          AuthenticationErrorCommon.failedVerify,
          nextState
        )
  );

export const reservedOperation = <
  State extends ErrorState<Errors>,
  Errors
>() => (state: State) =>
  applyError<State, Errors>(AuthenticationErrorCommon.calledReserved, state);

export const opReturn = <State extends ErrorState<Errors>, Errors>() => (
  state: State
) => applyError<State, Errors>(AuthenticationErrorCommon.calledReturn, state);

export const conditionalFlowControlOperations = <
  Opcodes,
  State extends AuthenticationProgramStateCommon<Opcodes, Errors>,
  Errors
>() => ({
  [OpcodesCommon.OP_RESERVED]: reservedOperation<State, Errors>(),
  [OpcodesCommon.OP_VER]: reservedOperation<State, Errors>(),
  [OpcodesCommon.OP_VERIFY]: opVerify<State, Errors>(),
  [OpcodesCommon.OP_RETURN]: opReturn<State, Errors>(),
  [OpcodesCommon.OP_RESERVED1]: reservedOperation<State, Errors>(),
  [OpcodesCommon.OP_RESERVED2]: reservedOperation<State, Errors>()
});

export const opIf = <
  State extends StackState & ExecutionStackState & ErrorState<Errors>,
  Errors
>(): Operation<State> => (state: State) => {
  if (state.executionStack.every(item => item)) {
    // eslint-disable-next-line functional/immutable-data
    const element = state.stack.pop();
    if (element === undefined) {
      return applyError<State, Errors>(
        AuthenticationErrorCommon.emptyStack,
        state
      );
    }
    // eslint-disable-next-line functional/no-expression-statement, functional/immutable-data
    state.executionStack.push(stackItemIsTruthy(element));
    return state;
  }
  // eslint-disable-next-line functional/no-expression-statement, functional/immutable-data
  state.executionStack.push(false);
  return state;
};

export const opNotIf = <
  State extends StackState & ExecutionStackState & ErrorState<Errors>,
  Errors
>(flags: {
  requireMinimalEncoding: boolean;
}): Operation<State> => {
  const not = conditionallyEvaluate(opNot<State, Errors>(flags));
  const ifOp = opIf<State, Errors>();
  return (state: State) => ifOp(not(state));
};

export const opEndIf = <
  State extends ExecutionStackState & ErrorState<Errors>,
  Errors
>(): Operation<State> => (state: State) => {
  // eslint-disable-next-line functional/immutable-data
  const element = state.executionStack.pop();
  if (element === undefined) {
    return applyError<State, Errors>(
      AuthenticationErrorCommon.unexpectedEndIf,
      state
    );
  }
  return state;
};

export const opElse = <
  State extends ExecutionStackState & ErrorState<Errors>,
  Errors
>(): Operation<State> => (state: State) => {
  const top = state.executionStack[state.executionStack.length - 1] as
    | boolean
    | undefined;
  if (top === undefined) {
    return applyError<State, Errors>(
      AuthenticationErrorCommon.unexpectedElse,
      state
    );
  }
  // eslint-disable-next-line functional/no-expression-statement, functional/immutable-data
  state.executionStack[state.executionStack.length - 1] = !top;
  return state;
};

export const unconditionalFlowControlOperations = <
  Opcodes,
  State extends AuthenticationProgramStateCommon<Opcodes, Errors>,
  Errors
>(flags: {
  requireMinimalEncoding: boolean;
}) => ({
  [OpcodesCommon.OP_IF]: opIf<State, Errors>(),
  [OpcodesCommon.OP_NOTIF]: opNotIf<State, Errors>(flags),
  [OpcodesCommon.OP_VERIF]: reservedOperation<State, Errors>(),
  [OpcodesCommon.OP_VERNOTIF]: reservedOperation<State, Errors>(),
  [OpcodesCommon.OP_ELSE]: opElse<State, Errors>(),
  [OpcodesCommon.OP_ENDIF]: opEndIf<State, Errors>()
});
