/* istanbul ignore file */ // TODO: stabilize & test

import { CommonState, StackState } from '../../state';
import { ErrorState } from './common';
import { CommonOpcodes } from './opcodes';

export const opCheckLockTimeVerify = <
  State extends StackState & ErrorState<Errors> & { readonly locktime: number },
  Errors
>() => (state: State) =>
  // TODO:
  state;

export const timeOperations = <
  Opcodes,
  State extends CommonState<Opcodes, Errors>,
  Errors
>() => ({
  [CommonOpcodes.OP_CHECKLOCKTIMEVERIFY]: opCheckLockTimeVerify<State, Errors>()
});
