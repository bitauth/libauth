/* istanbul ignore file */ // TODO: stabilize & test

import { CommonState, StackState } from '../../state';
import { Operation } from '../../virtual-machine';
import { opNot } from './arithmetic';
import {
  applyError,
  CommonAuthenticationError,
  ErrorState,
  ExecutionStackState,
  stackElementIsTruthy
} from './common';
import { CommonOpcodes } from './opcodes';

export const opVerify = <
  State extends StackState & ErrorState<Errors>,
  Errors
>(): Operation<State> => (state: State) => {
  const element = state.stack.pop();
  // tslint:disable-next-line:no-if-statement
  if (!element) {
    return applyError<State, Errors>(
      CommonAuthenticationError.emptyStack,
      state
    );
  }
  return stackElementIsTruthy(element)
    ? state
    : applyError<State, Errors>(CommonAuthenticationError.failedVerify, state);
};

export const conditionalFlowControlOperations = <
  Opcodes,
  State extends CommonState<Opcodes, Errors>,
  Errors
>() => ({
  [CommonOpcodes.OP_VERIFY]: opVerify<State, Errors>()
});

export const opIf = <
  State extends StackState & ExecutionStackState & ErrorState<Errors>,
  Errors
>(): Operation<State> => (state: State) => {
  const element = state.stack.pop();
  // tslint:disable-next-line:no-if-statement
  if (!element) {
    return applyError<State, Errors>(
      CommonAuthenticationError.emptyStack,
      state
    );
  }
  // tslint:disable-next-line:no-expression-statement
  state.executionStack.push(stackElementIsTruthy(element)); // TODO: are any chains not using `SCRIPT_VERIFY_MINIMALIF` ?
  return state;
};

export const opNotIf = <
  State extends StackState & ExecutionStackState & ErrorState<Errors>,
  Errors
>(): Operation<State> => {
  const not = opNot<State, Errors>();
  const ifOp = opIf<State, Errors>();
  return (state: State) => ifOp(not(state));
};

export const opEndIf = <
  State extends ExecutionStackState & ErrorState<Errors>,
  Errors
>(): Operation<State> => (state: State) => {
  const element = state.executionStack.pop();
  // tslint:disable-next-line:no-if-statement
  if (element === undefined) {
    return applyError<State, Errors>(
      CommonAuthenticationError.unexpectedEndIf,
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
  // tslint:disable-next-line:no-if-statement
  if (top === undefined) {
    return applyError<State, Errors>(
      CommonAuthenticationError.unexpectedElse,
      state
    );
  }
  // tslint:disable-next-line:no-object-mutation no-expression-statement
  state.executionStack[state.executionStack.length - 1] = !top;
  return state;
};

export const unconditionalFlowControlOperations = <
  Opcodes,
  State extends CommonState<Opcodes, Errors>,
  Errors
>() => ({
  [CommonOpcodes.OP_IF]: opIf<State, Errors>(),
  [CommonOpcodes.OP_NOTIF]: opNotIf<State, Errors>(),
  [CommonOpcodes.OP_ELSE]: opElse<State, Errors>(),
  [CommonOpcodes.OP_ENDIF]: opEndIf<State, Errors>()
});
