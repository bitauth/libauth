import { ErrorState, StackState } from '../../state';

import { pushToStack, useOneStackItem } from './combinators';
import { OpcodesCommon } from './opcodes';
import { bigIntToScriptNumber } from './types';

export const opSize = <State extends StackState>() => (state: State) =>
  useOneStackItem(state, (nextState, [item]) =>
    pushToStack(nextState, item, bigIntToScriptNumber(BigInt(item.length)))
  );

export const spliceOperations = <
  State extends StackState & ErrorState<Errors>,
  Errors
>() => ({
  [OpcodesCommon.OP_SIZE]: opSize<State>(),
});
