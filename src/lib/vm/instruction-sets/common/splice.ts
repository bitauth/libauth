import {
  AuthenticationProgramStateError,
  AuthenticationProgramStateStack,
} from '../../vm-types';

import { pushToStack, useOneStackItem } from './combinators';
import { OpcodesCommon } from './opcodes';
import { bigIntToScriptNumber } from './types';

export const opSize = <State extends AuthenticationProgramStateStack>() => (
  state: State
) =>
  useOneStackItem(state, (nextState, [item]) =>
    pushToStack(nextState, item, bigIntToScriptNumber(BigInt(item.length)))
  );

export const spliceOperations = <
  State extends AuthenticationProgramStateStack &
    AuthenticationProgramStateError<Errors>,
  Errors
>() => ({
  [OpcodesCommon.OP_SIZE]: opSize<State>(),
});
