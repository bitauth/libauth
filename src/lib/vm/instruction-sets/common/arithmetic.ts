import {
  AuthenticationProgramStateCommon,
  AuthenticationProgramStateError,
  AuthenticationProgramStateStack,
} from '../../vm-types';

import {
  combineOperations,
  pushToStack,
  useOneScriptNumber,
  useThreeScriptNumbers,
  useTwoScriptNumbers,
} from './combinators';
import { opVerify } from './flow-control';
import { OpcodesCommon } from './opcodes';
import { bigIntToScriptNumber, booleanToScriptNumber } from './types';

export const op1Add = <
  State extends AuthenticationProgramStateStack &
    AuthenticationProgramStateError<Errors>,
  Errors
>({
  requireMinimalEncoding,
}: {
  requireMinimalEncoding: boolean;
}) => (state: State) =>
  useOneScriptNumber(
    state,
    (nextState, [value]) =>
      pushToStack(nextState, bigIntToScriptNumber(value + BigInt(1))),
    { requireMinimalEncoding }
  );

export const op1Sub = <
  State extends AuthenticationProgramStateStack &
    AuthenticationProgramStateError<Errors>,
  Errors
>({
  requireMinimalEncoding,
}: {
  requireMinimalEncoding: boolean;
}) => (state: State) =>
  useOneScriptNumber(
    state,
    (nextState, [value]) =>
      pushToStack(nextState, bigIntToScriptNumber(value - BigInt(1))),
    { requireMinimalEncoding }
  );

export const opNegate = <
  State extends AuthenticationProgramStateStack &
    AuthenticationProgramStateError<Errors>,
  Errors
>({
  requireMinimalEncoding,
}: {
  requireMinimalEncoding: boolean;
}) => (state: State) =>
  useOneScriptNumber(
    state,
    (nextState, [value]) =>
      pushToStack(nextState, bigIntToScriptNumber(-value)),
    { requireMinimalEncoding }
  );

export const opAbs = <
  State extends AuthenticationProgramStateStack &
    AuthenticationProgramStateError<Errors>,
  Errors
>({
  requireMinimalEncoding,
}: {
  requireMinimalEncoding: boolean;
}) => (state: State) =>
  useOneScriptNumber(
    state,
    (nextState, [value]) =>
      pushToStack(nextState, bigIntToScriptNumber(value < 0 ? -value : value)),
    { requireMinimalEncoding }
  );

export const opNot = <
  State extends AuthenticationProgramStateStack &
    AuthenticationProgramStateError<Errors>,
  Errors
>({
  requireMinimalEncoding,
}: {
  requireMinimalEncoding: boolean;
}) => (state: State) =>
  useOneScriptNumber(
    state,
    (nextState, [value]) =>
      pushToStack(
        nextState,
        value === BigInt(0)
          ? bigIntToScriptNumber(BigInt(1))
          : bigIntToScriptNumber(BigInt(0))
      ),
    { requireMinimalEncoding }
  );

export const op0NotEqual = <
  State extends AuthenticationProgramStateStack &
    AuthenticationProgramStateError<Errors>,
  Errors
>({
  requireMinimalEncoding,
}: {
  requireMinimalEncoding: boolean;
}) => (state: State) =>
  useOneScriptNumber(
    state,
    (nextState, [value]) =>
      pushToStack(
        nextState,
        value === BigInt(0)
          ? bigIntToScriptNumber(BigInt(0))
          : bigIntToScriptNumber(BigInt(1))
      ),
    { requireMinimalEncoding }
  );

export const opAdd = <
  State extends AuthenticationProgramStateStack &
    AuthenticationProgramStateError<Errors>,
  Errors
>({
  requireMinimalEncoding,
}: {
  requireMinimalEncoding: boolean;
}) => (state: State) =>
  useTwoScriptNumbers(
    state,
    (nextState, [firstValue, secondValue]) =>
      pushToStack(nextState, bigIntToScriptNumber(firstValue + secondValue)),
    { requireMinimalEncoding }
  );

export const opSub = <
  State extends AuthenticationProgramStateStack &
    AuthenticationProgramStateError<Errors>,
  Errors
>({
  requireMinimalEncoding,
}: {
  requireMinimalEncoding: boolean;
}) => (state: State) =>
  useTwoScriptNumbers(
    state,
    (nextState, [firstValue, secondValue]) =>
      pushToStack(nextState, bigIntToScriptNumber(firstValue - secondValue)),
    { requireMinimalEncoding }
  );

export const opBoolAnd = <
  State extends AuthenticationProgramStateStack &
    AuthenticationProgramStateError<Errors>,
  Errors
>({
  requireMinimalEncoding,
}: {
  requireMinimalEncoding: boolean;
}) => (state: State) =>
  useTwoScriptNumbers(
    state,
    (nextState, [firstValue, secondValue]) =>
      pushToStack(
        nextState,
        booleanToScriptNumber(
          firstValue !== BigInt(0) && secondValue !== BigInt(0)
        )
      ),
    { requireMinimalEncoding }
  );

export const opBoolOr = <
  State extends AuthenticationProgramStateStack &
    AuthenticationProgramStateError<Errors>,
  Errors
>({
  requireMinimalEncoding,
}: {
  requireMinimalEncoding: boolean;
}) => (state: State) =>
  useTwoScriptNumbers(
    state,
    (nextState, [firstValue, secondValue]) =>
      pushToStack(
        nextState,
        booleanToScriptNumber(
          firstValue !== BigInt(0) || secondValue !== BigInt(0)
        )
      ),
    { requireMinimalEncoding }
  );

export const opNumEqual = <
  State extends AuthenticationProgramStateStack &
    AuthenticationProgramStateError<Errors>,
  Errors
>({
  requireMinimalEncoding,
}: {
  requireMinimalEncoding: boolean;
}) => (state: State) =>
  useTwoScriptNumbers(
    state,
    (nextState, [firstValue, secondValue]) =>
      pushToStack(nextState, booleanToScriptNumber(firstValue === secondValue)),
    { requireMinimalEncoding }
  );

export const opNumEqualVerify = <
  State extends AuthenticationProgramStateStack &
    AuthenticationProgramStateError<Errors>,
  Errors
>(flags: {
  requireMinimalEncoding: boolean;
}) =>
  combineOperations(
    opNumEqual<State, Errors>(flags),
    opVerify<State, Errors>()
  );

export const opNumNotEqual = <
  State extends AuthenticationProgramStateStack &
    AuthenticationProgramStateError<Errors>,
  Errors
>({
  requireMinimalEncoding,
}: {
  requireMinimalEncoding: boolean;
}) => (state: State) =>
  useTwoScriptNumbers(
    state,
    (nextState, [firstValue, secondValue]) =>
      pushToStack(nextState, booleanToScriptNumber(firstValue !== secondValue)),
    { requireMinimalEncoding }
  );

export const opLessThan = <
  State extends AuthenticationProgramStateStack &
    AuthenticationProgramStateError<Errors>,
  Errors
>({
  requireMinimalEncoding,
}: {
  requireMinimalEncoding: boolean;
}) => (state: State) =>
  useTwoScriptNumbers(
    state,
    (nextState, [firstValue, secondValue]) =>
      pushToStack(nextState, booleanToScriptNumber(firstValue < secondValue)),
    { requireMinimalEncoding }
  );

export const opLessThanOrEqual = <
  State extends AuthenticationProgramStateStack &
    AuthenticationProgramStateError<Errors>,
  Errors
>({
  requireMinimalEncoding,
}: {
  requireMinimalEncoding: boolean;
}) => (state: State) =>
  useTwoScriptNumbers(
    state,
    (nextState, [firstValue, secondValue]) =>
      pushToStack(nextState, booleanToScriptNumber(firstValue <= secondValue)),
    { requireMinimalEncoding }
  );

export const opGreaterThan = <
  State extends AuthenticationProgramStateStack &
    AuthenticationProgramStateError<Errors>,
  Errors
>({
  requireMinimalEncoding,
}: {
  requireMinimalEncoding: boolean;
}) => (state: State) =>
  useTwoScriptNumbers(
    state,
    (nextState, [firstValue, secondValue]) =>
      pushToStack(nextState, booleanToScriptNumber(firstValue > secondValue)),
    { requireMinimalEncoding }
  );

export const opGreaterThanOrEqual = <
  State extends AuthenticationProgramStateStack &
    AuthenticationProgramStateError<Errors>,
  Errors
>({
  requireMinimalEncoding,
}: {
  requireMinimalEncoding: boolean;
}) => (state: State) =>
  useTwoScriptNumbers(
    state,
    (nextState, [firstValue, secondValue]) =>
      pushToStack(nextState, booleanToScriptNumber(firstValue >= secondValue)),
    { requireMinimalEncoding }
  );

export const opMin = <
  State extends AuthenticationProgramStateStack &
    AuthenticationProgramStateError<Errors>,
  Errors
>({
  requireMinimalEncoding,
}: {
  requireMinimalEncoding: boolean;
}) => (state: State) =>
  useTwoScriptNumbers(
    state,
    (nextState, [firstValue, secondValue]) =>
      pushToStack(
        nextState,
        bigIntToScriptNumber(
          firstValue < secondValue ? firstValue : secondValue
        )
      ),
    { requireMinimalEncoding }
  );

export const opMax = <
  State extends AuthenticationProgramStateStack &
    AuthenticationProgramStateError<Errors>,
  Errors
>({
  requireMinimalEncoding,
}: {
  requireMinimalEncoding: boolean;
}) => (state: State) =>
  useTwoScriptNumbers(
    state,
    (nextState, [firstValue, secondValue]) =>
      pushToStack(
        nextState,
        bigIntToScriptNumber(
          firstValue > secondValue ? firstValue : secondValue
        )
      ),
    { requireMinimalEncoding }
  );

export const opWithin = <
  State extends AuthenticationProgramStateStack &
    AuthenticationProgramStateError<Errors>,
  Errors
>({
  requireMinimalEncoding,
}: {
  requireMinimalEncoding: boolean;
}) => (state: State) =>
  useThreeScriptNumbers(
    state,
    (nextState, [firstValue, secondValue, thirdValue]) =>
      pushToStack(
        nextState,
        booleanToScriptNumber(
          secondValue <= firstValue && firstValue < thirdValue
        )
      ),
    { requireMinimalEncoding }
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
  [OpcodesCommon.OP_WITHIN]: opWithin<State, Errors>(flags),
});
