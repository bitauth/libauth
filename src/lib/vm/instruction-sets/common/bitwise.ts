import { Operation } from '../../virtual-machine';
import {
  AuthenticationProgramStateCommon,
  AuthenticationProgramStateError,
  AuthenticationProgramStateStack,
} from '../../vm-types';

import {
  combineOperations,
  pushToStack,
  useTwoStackItems,
} from './combinators';
import { opVerify } from './flow-control';
import { OpcodesCommon } from './opcodes';
import { booleanToScriptNumber } from './types';

const areEqual = (a: Uint8Array, b: Uint8Array) => {
  if (a.length !== b.length) {
    return false;
  }
  // eslint-disable-next-line functional/no-let, functional/no-loop-statement, no-plusplus
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
};

export const opEqual = <
  State extends AuthenticationProgramStateStack &
    AuthenticationProgramStateError<Errors>,
  Errors
>(): Operation<State> => (state: State) =>
  useTwoStackItems(state, (nextState, [element1, element2]) =>
    pushToStack(nextState, booleanToScriptNumber(areEqual(element1, element2)))
  );

export const opEqualVerify = <
  State extends AuthenticationProgramStateStack &
    AuthenticationProgramStateError<Errors>,
  Errors
>(): Operation<State> =>
  combineOperations(opEqual<State, Errors>(), opVerify<State, Errors>());

export const bitwiseOperations = <
  Opcodes,
  State extends AuthenticationProgramStateCommon<Opcodes, Errors>,
  Errors
>() => ({
  [OpcodesCommon.OP_EQUAL]: opEqual<State, Errors>(),
  [OpcodesCommon.OP_EQUALVERIFY]: opEqualVerify<State, Errors>(),
});
