import type {
  AuthenticationProgramStateError,
  AuthenticationProgramStateStack,
} from '../../../lib.js';

import {
  combineOperations,
  pushToStack,
  pushToStackVmNumberChecked,
  useOneVmNumber,
  useThreeVmNumbers,
  useTwoVmNumbers,
} from './combinators.js';
import { applyError, AuthenticationErrorCommon } from './errors.js';
import { opVerify } from './flow-control.js';
import {
  bigIntToVmNumber,
  booleanToVmNumber,
} from './instruction-sets-utils.js';

export const op1Add = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack,
>(
  state: State,
) =>
  useOneVmNumber(state, (nextState, [value]) =>
    pushToStackVmNumberChecked(nextState, value + 1n),
  );

export const op1Sub = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack,
>(
  state: State,
) =>
  useOneVmNumber(state, (nextState, [value]) =>
    pushToStack(nextState, bigIntToVmNumber(value - 1n)),
  );

export const opNegate = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack,
>(
  state: State,
) =>
  useOneVmNumber(state, (nextState, [value]) =>
    pushToStack(nextState, bigIntToVmNumber(-value)),
  );

export const opAbs = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack,
>(
  state: State,
) =>
  useOneVmNumber(state, (nextState, [value]) =>
    pushToStack(nextState, bigIntToVmNumber(value < 0 ? -value : value)),
  );

export const opNot = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack,
>(
  state: State,
) =>
  useOneVmNumber(state, (nextState, [value]) =>
    pushToStack(
      nextState,
      value === 0n ? bigIntToVmNumber(1n) : bigIntToVmNumber(0n),
    ),
  );

export const op0NotEqual = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack,
>(
  state: State,
) =>
  useOneVmNumber(state, (nextState, [value]) =>
    pushToStack(
      nextState,
      value === 0n ? bigIntToVmNumber(0n) : bigIntToVmNumber(1n),
    ),
  );

export const opAdd = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack,
>(
  state: State,
) =>
  useTwoVmNumbers(state, (nextState, [firstValue, secondValue]) =>
    pushToStackVmNumberChecked(nextState, firstValue + secondValue),
  );

export const opSub = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack,
>(
  state: State,
) =>
  useTwoVmNumbers(state, (nextState, [firstValue, secondValue]) =>
    pushToStack(nextState, bigIntToVmNumber(firstValue - secondValue)),
  );

export const opBoolAnd = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack,
>(
  state: State,
) =>
  useTwoVmNumbers(state, (nextState, [firstValue, secondValue]) =>
    pushToStack(
      nextState,
      booleanToVmNumber(firstValue !== 0n && secondValue !== 0n),
    ),
  );

export const opBoolOr = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack,
>(
  state: State,
) =>
  useTwoVmNumbers(state, (nextState, [firstValue, secondValue]) =>
    pushToStack(
      nextState,
      booleanToVmNumber(firstValue !== 0n || secondValue !== 0n),
    ),
  );

export const opNumEqual = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack,
>(
  state: State,
) =>
  useTwoVmNumbers(state, (nextState, [firstValue, secondValue]) =>
    pushToStack(nextState, booleanToVmNumber(firstValue === secondValue)),
  );

export const opNumEqualVerify = combineOperations(opNumEqual, opVerify);

export const opNumNotEqual = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack,
>(
  state: State,
) =>
  useTwoVmNumbers(state, (nextState, [firstValue, secondValue]) =>
    pushToStack(nextState, booleanToVmNumber(firstValue !== secondValue)),
  );

export const opLessThan = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack,
>(
  state: State,
) =>
  useTwoVmNumbers(state, (nextState, [firstValue, secondValue]) =>
    pushToStack(nextState, booleanToVmNumber(firstValue < secondValue)),
  );

export const opLessThanOrEqual = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack,
>(
  state: State,
) =>
  useTwoVmNumbers(state, (nextState, [firstValue, secondValue]) =>
    pushToStack(nextState, booleanToVmNumber(firstValue <= secondValue)),
  );

export const opGreaterThan = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack,
>(
  state: State,
) =>
  useTwoVmNumbers(state, (nextState, [firstValue, secondValue]) =>
    pushToStack(nextState, booleanToVmNumber(firstValue > secondValue)),
  );

export const opGreaterThanOrEqual = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack,
>(
  state: State,
) =>
  useTwoVmNumbers(state, (nextState, [firstValue, secondValue]) =>
    pushToStack(nextState, booleanToVmNumber(firstValue >= secondValue)),
  );

export const opMin = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack,
>(
  state: State,
) =>
  useTwoVmNumbers(state, (nextState, [firstValue, secondValue]) =>
    pushToStack(
      nextState,
      bigIntToVmNumber(firstValue < secondValue ? firstValue : secondValue),
    ),
  );

export const opMax = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack,
>(
  state: State,
) =>
  useTwoVmNumbers(state, (nextState, [firstValue, secondValue]) =>
    pushToStack(
      nextState,
      bigIntToVmNumber(firstValue > secondValue ? firstValue : secondValue),
    ),
  );

export const opWithin = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack,
>(
  state: State,
) =>
  useThreeVmNumbers(state, (nextState, [firstValue, secondValue, thirdValue]) =>
    pushToStack(
      nextState,
      booleanToVmNumber(secondValue <= firstValue && firstValue < thirdValue),
    ),
  );

export const opMul = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack,
>(
  state: State,
) =>
  useTwoVmNumbers(state, (nextState, [firstValue, secondValue]) =>
    pushToStackVmNumberChecked(nextState, firstValue * secondValue),
  );

export const opDiv = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack,
>(
  state: State,
) =>
  useTwoVmNumbers(state, (nextState, [firstValue, secondValue]) =>
    secondValue === 0n
      ? applyError(nextState, AuthenticationErrorCommon.divisionByZero)
      : pushToStack(nextState, bigIntToVmNumber(firstValue / secondValue)),
  );

export const opMod = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack,
>(
  state: State,
) =>
  useTwoVmNumbers(state, (nextState, [firstValue, secondValue]) =>
    secondValue === 0n
      ? applyError(nextState, AuthenticationErrorCommon.divisionByZero)
      : pushToStack(nextState, bigIntToVmNumber(firstValue % secondValue)),
  );
