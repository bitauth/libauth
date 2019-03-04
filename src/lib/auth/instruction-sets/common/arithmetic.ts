/* istanbul ignore file */ // TODO: stabilize & test

import { CommonState, StackState } from '../../state';
import { pushToStack, useTwoScriptNumbers } from './combinators';
import { applyError, CommonAuthenticationError, ErrorState } from './common';
import { CommonOpcodes } from './opcodes';
import {
  bigIntToScriptNumber,
  booleanToScriptNumber,
  parseBytesAsScriptNumber
} from './types';

export const opNot = <
  State extends StackState & ErrorState<Errors>,
  Errors
>() => (state: State) => {
  const element = state.stack.pop();
  // tslint:disable-next-line:no-if-statement
  if (!element) {
    return applyError<State, Errors>(
      CommonAuthenticationError.emptyStack,
      state
    );
  }
  const value = parseBytesAsScriptNumber(element);
  // tslint:disable-next-line:no-expression-statement
  state.stack.push(
    value === BigInt(0)
      ? bigIntToScriptNumber(BigInt(1))
      : bigIntToScriptNumber(BigInt(0))
  );
  return state;
};

export const opAdd = <
  State extends StackState & ErrorState<Errors>,
  Errors
>() => (state: State) =>
  useTwoScriptNumbers(state, (nextState, firstValue, secondValue) =>
    // tslint:disable-next-line: restrict-plus-operands
    pushToStack(nextState, bigIntToScriptNumber(firstValue + secondValue))
  );

export const opSub = <
  State extends StackState & ErrorState<Errors>,
  Errors
>() => (state: State) =>
  useTwoScriptNumbers(state, (nextState, firstValue, secondValue) =>
    pushToStack(nextState, bigIntToScriptNumber(firstValue - secondValue))
  );

export const opBoolAnd = <
  State extends StackState & ErrorState<Errors>,
  Errors
>() => (state: State) =>
  useTwoScriptNumbers(state, (nextState, firstValue, secondValue) =>
    pushToStack(
      nextState,
      booleanToScriptNumber(
        firstValue !== BigInt(0) && secondValue !== BigInt(0)
      )
    )
  );

export const opBoolOr = <
  State extends StackState & ErrorState<Errors>,
  Errors
>() => (state: State) =>
  useTwoScriptNumbers(state, (nextState, firstValue, secondValue) =>
    pushToStack(
      nextState,
      booleanToScriptNumber(
        firstValue !== BigInt(0) || secondValue !== BigInt(0)
      )
    )
  );

export const opNumEqual = <
  State extends StackState & ErrorState<Errors>,
  Errors
>() => (state: State) =>
  useTwoScriptNumbers(state, (nextState, firstValue, secondValue) =>
    pushToStack(nextState, booleanToScriptNumber(firstValue === secondValue))
  );

export const opNumNotEqual = <
  State extends StackState & ErrorState<Errors>,
  Errors
>() => (state: State) =>
  useTwoScriptNumbers(state, (nextState, firstValue, secondValue) =>
    pushToStack(nextState, booleanToScriptNumber(firstValue !== secondValue))
  );

export const opLessThan = <
  State extends StackState & ErrorState<Errors>,
  Errors
>() => (state: State) =>
  useTwoScriptNumbers(state, (nextState, firstValue, secondValue) =>
    pushToStack(nextState, booleanToScriptNumber(firstValue < secondValue))
  );

export const opLessThanOrEqual = <
  State extends StackState & ErrorState<Errors>,
  Errors
>() => (state: State) =>
  useTwoScriptNumbers(state, (nextState, firstValue, secondValue) =>
    pushToStack(nextState, booleanToScriptNumber(firstValue <= secondValue))
  );

export const opGreaterThan = <
  State extends StackState & ErrorState<Errors>,
  Errors
>() => (state: State) =>
  useTwoScriptNumbers(state, (nextState, firstValue, secondValue) =>
    pushToStack(nextState, booleanToScriptNumber(firstValue > secondValue))
  );

export const opGreaterThanOrEqual = <
  State extends StackState & ErrorState<Errors>,
  Errors
>() => (state: State) =>
  useTwoScriptNumbers(state, (nextState, firstValue, secondValue) =>
    pushToStack(nextState, booleanToScriptNumber(firstValue >= secondValue))
  );

export const arithmeticOperations = <
  Opcodes,
  State extends CommonState<Opcodes, Errors>,
  Errors
>() => ({
  [CommonOpcodes.OP_NOT]: opNot<State, Errors>(),
  [CommonOpcodes.OP_ADD]: opAdd<State, Errors>(),
  [CommonOpcodes.OP_SUB]: opSub<State, Errors>(),
  [CommonOpcodes.OP_BOOLAND]: opBoolAnd<State, Errors>(),
  [CommonOpcodes.OP_BOOLOR]: opBoolOr<State, Errors>(),
  [CommonOpcodes.OP_NUMEQUAL]: opNumEqual<State, Errors>(),
  [CommonOpcodes.OP_NUMNOTEQUAL]: opNumNotEqual<State, Errors>(),
  [CommonOpcodes.OP_LESSTHAN]: opLessThan<State, Errors>(),
  [CommonOpcodes.OP_LESSTHANOREQUAL]: opLessThanOrEqual<State, Errors>(),
  [CommonOpcodes.OP_GREATERTHAN]: opGreaterThan<State, Errors>(),
  [CommonOpcodes.OP_GREATERTHANOREQUAL]: opGreaterThanOrEqual<State, Errors>()
});
