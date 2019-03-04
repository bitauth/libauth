/* istanbul ignore file */ // TODO: stabilize & test

import { CommonState, StackState } from '../../state';
import { Operation } from '../../virtual-machine';
import { combineOperations } from './combinators';
import { applyError, CommonAuthenticationError, ErrorState } from './common';
import { opVerify } from './flow-control';
import { CommonOpcodes } from './opcodes';
import { booleanToScriptNumber } from './types';

const areEqual = (a: Uint8Array, b: Uint8Array) => {
  // tslint:disable-next-line:no-if-statement
  if (a.length !== b.length) {
    return false;
  }
  // tslint:disable-next-line:no-let
  for (let i = 0; i < a.length; i++) {
    // tslint:disable-next-line:no-if-statement
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
};

export const opEqual = <
  State extends StackState & ErrorState<Errors>,
  Errors
>(): Operation<State> => (state: State) => {
  const element1 = state.stack.pop();
  const element2 = state.stack.pop();
  // tslint:disable-next-line:no-if-statement
  if (!element1 || !element2) {
    return applyError<State, Errors>(
      CommonAuthenticationError.emptyStack,
      state
    );
  }
  const result = booleanToScriptNumber(areEqual(element1, element2));
  // tslint:disable-next-line:no-expression-statement
  state.stack.push(result);
  return state;
};

export const opEqualVerify = <
  State extends StackState & ErrorState<Errors>,
  Errors
>(): Operation<State> =>
  combineOperations(opEqual<State, Errors>(), opVerify<State, Errors>());

export const bitwiseOperations = <
  Opcodes,
  State extends CommonState<Opcodes, Errors>,
  Errors
>() => ({
  [CommonOpcodes.OP_EQUAL]: opEqual<State, Errors>(),
  [CommonOpcodes.OP_EQUALVERIFY]: opEqualVerify<State, Errors>()
});
