import type {
  AuthenticationProgramStateError,
  AuthenticationProgramStateResourceLimits,
  AuthenticationProgramStateStack,
} from '../../../../lib.js';
import {
  applyError,
  AuthenticationErrorCommon,
  bigIntToVmNumber,
  booleanToVmNumber,
  combineOperations,
  measureArithmeticCost,
  opVerify,
  pushToStack,
  pushToStackVmNumberChecked,
  useOneVmNumber,
  useThreeVmNumbers,
  useTwoVmNumbers,
} from '../../common/common.js';

import { bigIntRange, ConsensusBch2025 } from './bch-2025-consensus.js';

export const op1AddChipBigInt = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack,
>(
  state: State,
) =>
  useOneVmNumber(
    state,
    (nextState, [value]) =>
      pushToStackVmNumberChecked(nextState, value + 1n, bigIntRange),
    { maximumVmNumberByteLength: ConsensusBch2025.maximumVmNumberLength },
  );

export const op1SubChipBigInt = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack,
>(
  state: State,
) =>
  useOneVmNumber(
    state,
    (nextState, [value]) =>
      pushToStackVmNumberChecked(nextState, value - 1n, bigIntRange),
    { maximumVmNumberByteLength: ConsensusBch2025.maximumVmNumberLength },
  );

export const opNegateChipBigInt = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack,
>(
  state: State,
) =>
  useOneVmNumber(
    state,
    (nextState, [value]) => pushToStack(nextState, [bigIntToVmNumber(-value)]),
    { maximumVmNumberByteLength: ConsensusBch2025.maximumVmNumberLength },
  );

export const opAbsChipBigInt = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack,
>(
  state: State,
) =>
  useOneVmNumber(
    state,
    (nextState, [value]) =>
      pushToStack(nextState, [bigIntToVmNumber(value < 0 ? -value : value)]),
    { maximumVmNumberByteLength: ConsensusBch2025.maximumVmNumberLength },
  );

export const opNotChipBigInt = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack,
>(
  state: State,
) =>
  useOneVmNumber(
    state,
    (nextState, [value]) =>
      pushToStack(nextState, [
        value === 0n ? bigIntToVmNumber(1n) : bigIntToVmNumber(0n),
      ]),
    { maximumVmNumberByteLength: ConsensusBch2025.maximumVmNumberLength },
  );

export const op0NotEqualChipBigInt = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack,
>(
  state: State,
) =>
  useOneVmNumber(
    state,
    (nextState, [value]) =>
      pushToStack(nextState, [
        value === 0n ? bigIntToVmNumber(0n) : bigIntToVmNumber(1n),
      ]),
    { maximumVmNumberByteLength: ConsensusBch2025.maximumVmNumberLength },
  );

export const opAddChipBigInt = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack,
>(
  state: State,
) =>
  useTwoVmNumbers(
    state,
    (nextState, [firstValue, secondValue]) =>
      pushToStackVmNumberChecked(
        nextState,
        firstValue + secondValue,
        bigIntRange,
      ),
    { maximumVmNumberByteLength: ConsensusBch2025.maximumVmNumberLength },
  );

export const opSubChipBigInt = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack,
>(
  state: State,
) =>
  useTwoVmNumbers(
    state,
    (nextState, [firstValue, secondValue]) =>
      pushToStackVmNumberChecked(
        nextState,
        firstValue - secondValue,
        bigIntRange,
      ),
    { maximumVmNumberByteLength: ConsensusBch2025.maximumVmNumberLength },
  );

export const opBoolAndChipBigInt = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack,
>(
  state: State,
) =>
  useTwoVmNumbers(
    state,
    (nextState, [firstValue, secondValue]) =>
      pushToStack(nextState, [
        booleanToVmNumber(firstValue !== 0n && secondValue !== 0n),
      ]),
    { maximumVmNumberByteLength: ConsensusBch2025.maximumVmNumberLength },
  );

export const opBoolOrChipBigInt = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack,
>(
  state: State,
) =>
  useTwoVmNumbers(
    state,
    (nextState, [firstValue, secondValue]) =>
      pushToStack(nextState, [
        booleanToVmNumber(firstValue !== 0n || secondValue !== 0n),
      ]),
    { maximumVmNumberByteLength: ConsensusBch2025.maximumVmNumberLength },
  );

export const opNumEqualChipBigInt = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack,
>(
  state: State,
) =>
  useTwoVmNumbers(
    state,
    (nextState, [firstValue, secondValue]) =>
      pushToStack(nextState, [booleanToVmNumber(firstValue === secondValue)]),
    { maximumVmNumberByteLength: ConsensusBch2025.maximumVmNumberLength },
  );

export const opNumEqualVerifyChipBigInt = combineOperations(
  opNumEqualChipBigInt,
  opVerify,
);

export const opNumNotEqualChipBigInt = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack,
>(
  state: State,
) =>
  useTwoVmNumbers(
    state,
    (nextState, [firstValue, secondValue]) =>
      pushToStack(nextState, [booleanToVmNumber(firstValue !== secondValue)]),
    { maximumVmNumberByteLength: ConsensusBch2025.maximumVmNumberLength },
  );

export const opLessThanChipBigInt = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack,
>(
  state: State,
) =>
  useTwoVmNumbers(
    state,
    (nextState, [firstValue, secondValue]) =>
      pushToStack(nextState, [booleanToVmNumber(firstValue < secondValue)]),
    { maximumVmNumberByteLength: ConsensusBch2025.maximumVmNumberLength },
  );

export const opLessThanOrEqualChipBigInt = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack,
>(
  state: State,
) =>
  useTwoVmNumbers(
    state,
    (nextState, [firstValue, secondValue]) =>
      pushToStack(nextState, [booleanToVmNumber(firstValue <= secondValue)]),
    { maximumVmNumberByteLength: ConsensusBch2025.maximumVmNumberLength },
  );

export const opGreaterThanChipBigInt = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack,
>(
  state: State,
) =>
  useTwoVmNumbers(
    state,
    (nextState, [firstValue, secondValue]) =>
      pushToStack(nextState, [booleanToVmNumber(firstValue > secondValue)]),
    { maximumVmNumberByteLength: ConsensusBch2025.maximumVmNumberLength },
  );

export const opGreaterThanOrEqualChipBigInt = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack,
>(
  state: State,
) =>
  useTwoVmNumbers(
    state,
    (nextState, [firstValue, secondValue]) =>
      pushToStack(nextState, [booleanToVmNumber(firstValue >= secondValue)]),
    { maximumVmNumberByteLength: ConsensusBch2025.maximumVmNumberLength },
  );

export const opMinChipBigInt = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack,
>(
  state: State,
) =>
  useTwoVmNumbers(
    state,
    (nextState, [firstValue, secondValue]) =>
      pushToStackVmNumberChecked(
        nextState,
        firstValue < secondValue ? firstValue : secondValue,
        bigIntRange,
      ),
    { maximumVmNumberByteLength: ConsensusBch2025.maximumVmNumberLength },
  );

export const opMaxChipBigInt = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack,
>(
  state: State,
) =>
  useTwoVmNumbers(
    state,
    (nextState, [firstValue, secondValue]) =>
      pushToStackVmNumberChecked(
        nextState,
        firstValue > secondValue ? firstValue : secondValue,
        bigIntRange,
      ),
    { maximumVmNumberByteLength: ConsensusBch2025.maximumVmNumberLength },
  );

export const opWithinChipBigInt = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack,
>(
  state: State,
) =>
  useThreeVmNumbers(
    state,
    (nextState, [firstValue, secondValue, thirdValue]) =>
      pushToStack(nextState, [
        booleanToVmNumber(secondValue <= firstValue && firstValue < thirdValue),
      ]),
    { maximumVmNumberByteLength: ConsensusBch2025.maximumVmNumberLength },
  );

export const opMulChipBigInt = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateResourceLimits &
    AuthenticationProgramStateStack,
>(
  state: State,
) =>
  measureArithmeticCost(state, () =>
    useTwoVmNumbers(
      state,
      (nextState, [firstValue, secondValue]) =>
        pushToStackVmNumberChecked(
          nextState,
          firstValue * secondValue,
          bigIntRange,
        ),
      { maximumVmNumberByteLength: ConsensusBch2025.maximumVmNumberLength },
    ),
  );

export const opDivChipBigInt = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateResourceLimits &
    AuthenticationProgramStateStack,
>(
  state: State,
) =>
  measureArithmeticCost(state, () =>
    useTwoVmNumbers(
      state,
      (nextState, [firstValue, secondValue]) =>
        secondValue === 0n
          ? applyError(nextState, AuthenticationErrorCommon.divisionByZero)
          : pushToStack(nextState, [
              bigIntToVmNumber(firstValue / secondValue),
            ]),
      { maximumVmNumberByteLength: ConsensusBch2025.maximumVmNumberLength },
    ),
  );

export const opModChipBigInt = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateResourceLimits &
    AuthenticationProgramStateStack,
>(
  state: State,
) =>
  measureArithmeticCost(state, () =>
    useTwoVmNumbers(
      state,
      (nextState, [firstValue, secondValue]) =>
        secondValue === 0n
          ? applyError(nextState, AuthenticationErrorCommon.divisionByZero)
          : pushToStack(nextState, [
              bigIntToVmNumber(firstValue % secondValue),
            ]),
      { maximumVmNumberByteLength: ConsensusBch2025.maximumVmNumberLength },
    ),
  );
