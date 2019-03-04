/* istanbul ignore file */ // TODO: stabilize & test

import { useOneStackItem } from './combinators';
import {
  applyError,
  CommonAuthenticationError,
  ErrorState,
  StackState
} from './common';
import { CommonOpcodes } from './opcodes';

// TODO: unit test:
// empty stack
// element is clone (mutations to one element don't affect the other)
// duplicates
export const opDup = <
  State extends StackState & ErrorState<Errors>,
  Errors
>() => (state: State) => {
  // tslint:disable-next-line:no-if-statement
  if (state.stack.length === 0) {
    return applyError<State, Errors>(
      CommonAuthenticationError.emptyStack,
      state
    );
  }
  const element = state.stack[state.stack.length - 1];
  const clone = element.slice();
  // tslint:disable-next-line:no-expression-statement
  state.stack.push(clone);
  return state;
};

export const opDrop = <State extends StackState>() => (state: State) =>
  useOneStackItem(state, (nextState, _) => nextState);

export const stackOperations = <
  State extends StackState & ErrorState<Errors>,
  Errors
>() => ({
  [CommonOpcodes.OP_DUP]: opDup<State, Errors>(),
  [CommonOpcodes.OP_DROP]: opDrop<State>()
});
