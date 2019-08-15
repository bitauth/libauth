import {
  AuthenticationProgramStateCommon,
  ErrorState,
  StackState
} from '../../state';

import {
  combineOperations,
  pushToStack,
  useOneScriptNumber,
  useThreeScriptNumbers,
  useTwoScriptNumbers
} from './combinators';
import { opVerify } from './flow-control';
import { OpcodesCommon } from './opcodes';
import { bigIntToScriptNumber, booleanToScriptNumber } from './types';

export const op1Add = <
  State extends StackState & ErrorState<Errors>,
  Errors
>(flags: {
  requireMinimalEncoding: boolean;
}) => (state: State) =>
  useOneScriptNumber(
    state,
    (nextState, value) =>
      // tslint:disable-next-line: restrict-plus-operands
      pushToStack(nextState, bigIntToScriptNumber(value + BigInt(1))),
    flags.requireMinimalEncoding
  );

export const op1Sub = <
  State extends StackState & ErrorState<Errors>,
  Errors
>(flags: {
  requireMinimalEncoding: boolean;
}) => (state: State) =>
  useOneScriptNumber(
    state,
    (nextState, value) =>
      pushToStack(nextState, bigIntToScriptNumber(value - BigInt(1))),
    flags.requireMinimalEncoding
  );

export const opNegate = <
  State extends StackState & ErrorState<Errors>,
  Errors
>(flags: {
  requireMinimalEncoding: boolean;
}) => (state: State) =>
  useOneScriptNumber(
    state,
    (nextState, value) => pushToStack(nextState, bigIntToScriptNumber(-value)),
    flags.requireMinimalEncoding
  );

export const opAbs = <
  State extends StackState & ErrorState<Errors>,
  Errors
>(flags: {
  requireMinimalEncoding: boolean;
}) => (state: State) =>
  useOneScriptNumber(
    state,
    (nextState, value) =>
      pushToStack(nextState, bigIntToScriptNumber(value < 0 ? -value : value)),
    flags.requireMinimalEncoding
  );

export const opNot = <
  State extends StackState & ErrorState<Errors>,
  Errors
>(flags: {
  requireMinimalEncoding: boolean;
}) => (state: State) =>
  useOneScriptNumber(
    state,
    (nextState, value) =>
      pushToStack(
        nextState,
        value === BigInt(0)
          ? bigIntToScriptNumber(BigInt(1))
          : bigIntToScriptNumber(BigInt(0))
      ),
    flags.requireMinimalEncoding
  );

export const op0NotEqual = <
  State extends StackState & ErrorState<Errors>,
  Errors
>(flags: {
  requireMinimalEncoding: boolean;
}) => (state: State) =>
  useOneScriptNumber(
    state,
    (nextState, value) =>
      pushToStack(
        nextState,
        value !== BigInt(0)
          ? bigIntToScriptNumber(BigInt(1))
          : bigIntToScriptNumber(BigInt(0))
      ),
    flags.requireMinimalEncoding
  );

export const opAdd = <
  State extends StackState & ErrorState<Errors>,
  Errors
>(flags: {
  requireMinimalEncoding: boolean;
}) => (state: State) =>
  useTwoScriptNumbers(
    state,
    (nextState, firstValue, secondValue) =>
      // tslint:disable-next-line: restrict-plus-operands
      pushToStack(nextState, bigIntToScriptNumber(firstValue + secondValue)),
    flags.requireMinimalEncoding
  );

export const opSub = <
  State extends StackState & ErrorState<Errors>,
  Errors
>(flags: {
  requireMinimalEncoding: boolean;
}) => (state: State) =>
  useTwoScriptNumbers(
    state,
    (nextState, firstValue, secondValue) =>
      pushToStack(nextState, bigIntToScriptNumber(firstValue - secondValue)),
    flags.requireMinimalEncoding
  );

export const opBoolAnd = <
  State extends StackState & ErrorState<Errors>,
  Errors
>(flags: {
  requireMinimalEncoding: boolean;
}) => (state: State) =>
  useTwoScriptNumbers(
    state,
    (nextState, firstValue, secondValue) =>
      pushToStack(
        nextState,
        booleanToScriptNumber(
          firstValue !== BigInt(0) && secondValue !== BigInt(0)
        )
      ),
    flags.requireMinimalEncoding
  );

export const opBoolOr = <
  State extends StackState & ErrorState<Errors>,
  Errors
>(flags: {
  requireMinimalEncoding: boolean;
}) => (state: State) =>
  useTwoScriptNumbers(
    state,
    (nextState, firstValue, secondValue) =>
      pushToStack(
        nextState,
        booleanToScriptNumber(
          firstValue !== BigInt(0) || secondValue !== BigInt(0)
        )
      ),
    flags.requireMinimalEncoding
  );

export const opNumEqual = <
  State extends StackState & ErrorState<Errors>,
  Errors
>(flags: {
  requireMinimalEncoding: boolean;
}) => (state: State) =>
  useTwoScriptNumbers(
    state,
    (nextState, firstValue, secondValue) =>
      pushToStack(nextState, booleanToScriptNumber(firstValue === secondValue)),
    flags.requireMinimalEncoding
  );

export const opNumEqualVerify = <
  State extends StackState & ErrorState<Errors>,
  Errors
>(flags: {
  requireMinimalEncoding: boolean;
}) =>
  combineOperations(
    opNumEqual<State, Errors>(flags),
    opVerify<State, Errors>()
  );

export const opNumNotEqual = <
  State extends StackState & ErrorState<Errors>,
  Errors
>(flags: {
  requireMinimalEncoding: boolean;
}) => (state: State) =>
  useTwoScriptNumbers(
    state,
    (nextState, firstValue, secondValue) =>
      pushToStack(nextState, booleanToScriptNumber(firstValue !== secondValue)),
    flags.requireMinimalEncoding
  );

export const opLessThan = <
  State extends StackState & ErrorState<Errors>,
  Errors
>(flags: {
  requireMinimalEncoding: boolean;
}) => (state: State) =>
  useTwoScriptNumbers(
    state,
    (nextState, firstValue, secondValue) =>
      pushToStack(nextState, booleanToScriptNumber(firstValue < secondValue)),
    flags.requireMinimalEncoding
  );

export const opLessThanOrEqual = <
  State extends StackState & ErrorState<Errors>,
  Errors
>(flags: {
  requireMinimalEncoding: boolean;
}) => (state: State) =>
  useTwoScriptNumbers(
    state,
    (nextState, firstValue, secondValue) =>
      pushToStack(nextState, booleanToScriptNumber(firstValue <= secondValue)),
    flags.requireMinimalEncoding
  );

export const opGreaterThan = <
  State extends StackState & ErrorState<Errors>,
  Errors
>(flags: {
  requireMinimalEncoding: boolean;
}) => (state: State) =>
  useTwoScriptNumbers(
    state,
    (nextState, firstValue, secondValue) =>
      pushToStack(nextState, booleanToScriptNumber(firstValue > secondValue)),
    flags.requireMinimalEncoding
  );

export const opGreaterThanOrEqual = <
  State extends StackState & ErrorState<Errors>,
  Errors
>(flags: {
  requireMinimalEncoding: boolean;
}) => (state: State) =>
  useTwoScriptNumbers(
    state,
    (nextState, firstValue, secondValue) =>
      pushToStack(nextState, booleanToScriptNumber(firstValue >= secondValue)),
    flags.requireMinimalEncoding
  );

export const opMin = <
  State extends StackState & ErrorState<Errors>,
  Errors
>(flags: {
  requireMinimalEncoding: boolean;
}) => (state: State) =>
  useTwoScriptNumbers(
    state,
    (nextState, firstValue, secondValue) =>
      pushToStack(
        nextState,
        bigIntToScriptNumber(
          firstValue < secondValue ? firstValue : secondValue
        )
      ),
    flags.requireMinimalEncoding
  );

export const opMax = <
  State extends StackState & ErrorState<Errors>,
  Errors
>(flags: {
  requireMinimalEncoding: boolean;
}) => (state: State) =>
  useTwoScriptNumbers(
    state,
    (nextState, firstValue, secondValue) =>
      pushToStack(
        nextState,
        bigIntToScriptNumber(
          firstValue > secondValue ? firstValue : secondValue
        )
      ),
    flags.requireMinimalEncoding
  );

export const opWithin = <
  State extends StackState & ErrorState<Errors>,
  Errors
>(flags: {
  requireMinimalEncoding: boolean;
}) => (state: State) =>
  useThreeScriptNumbers(
    state,
    (nextState, firstValue, secondValue, thirdValue) =>
      pushToStack(
        nextState,
        booleanToScriptNumber(
          secondValue <= firstValue && firstValue < thirdValue
        )
      ),
    flags.requireMinimalEncoding
  );

export const arithmeticOperations = <
  Opcodes,
  State extends AuthenticationProgramStateCommon<Opcodes, Errors>,
  Errors
>(flags: {
  requireMinimalEncoding: boolean;
}) => ({
  [OpcodesCommon.OP_1ADD]: op1Add<State, Errors>(flags),
  [OpcodesCommon.OP_1SUB]: op1Sub<State, Errors>(flags),
  [OpcodesCommon.OP_NEGATE]: opNegate<State, Errors>(flags),
  [OpcodesCommon.OP_ABS]: opAbs<State, Errors>(flags),
  [OpcodesCommon.OP_NOT]: opNot<State, Errors>(flags),
  [OpcodesCommon.OP_0NOTEQUAL]: op0NotEqual<State, Errors>(flags),
  [OpcodesCommon.OP_ADD]: opAdd<State, Errors>(flags),
  [OpcodesCommon.OP_SUB]: opSub<State, Errors>(flags),
  [OpcodesCommon.OP_BOOLAND]: opBoolAnd<State, Errors>(flags),
  [OpcodesCommon.OP_BOOLOR]: opBoolOr<State, Errors>(flags),
  [OpcodesCommon.OP_NUMEQUAL]: opNumEqual<State, Errors>(flags),
  [OpcodesCommon.OP_NUMEQUALVERIFY]: opNumEqualVerify<State, Errors>(flags),
  [OpcodesCommon.OP_NUMNOTEQUAL]: opNumNotEqual<State, Errors>(flags),
  [OpcodesCommon.OP_LESSTHAN]: opLessThan<State, Errors>(flags),
  [OpcodesCommon.OP_LESSTHANOREQUAL]: opLessThanOrEqual<State, Errors>(flags),
  [OpcodesCommon.OP_GREATERTHAN]: opGreaterThan<State, Errors>(flags),
  [OpcodesCommon.OP_GREATERTHANOREQUAL]: opGreaterThanOrEqual<State, Errors>(
    flags
  ),
  [OpcodesCommon.OP_MIN]: opMin<State, Errors>(flags),
  [OpcodesCommon.OP_MAX]: opMax<State, Errors>(flags),
  [OpcodesCommon.OP_WITHIN]: opWithin<State, Errors>(flags)
});
