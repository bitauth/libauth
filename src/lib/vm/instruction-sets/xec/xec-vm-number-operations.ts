import type {
  AuthenticationProgramStateError,
  AuthenticationProgramStateStack,
} from '../../../lib.js';
import {
  applyError,
  AuthenticationErrorCommon,
  bigIntToVmNumber,
  booleanToVmNumber,
  combineOperations,
  opVerify,
  padMinimallyEncodedVmNumber,
  pushToStack,
  useOneStackItem,
  useOneVmNumber,
  useThreeVmNumbers,
  useTwoVmNumbers,
} from '../common/common.js';

import { ConsensusXEC } from './xec-types.js';

const maximumVmNumberByteLength = ConsensusXEC.maximumVmNumberLength;

export const opPick4Byte = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack,
>(
  state: State,
) =>
  useOneVmNumber(state, (nextState, depth) => {
    const item = nextState.stack[nextState.stack.length - 1 - Number(depth)];
    if (item === undefined) {
      return applyError(state, AuthenticationErrorCommon.invalidStackIndex);
    }
    return pushToStack(nextState, item.slice());
  });

export const opRoll4Byte = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack,
>(
  state: State,
) =>
  useOneVmNumber(state, (nextState, depth) => {
    const index = nextState.stack.length - 1 - Number(depth);
    if (index < 0 || index > nextState.stack.length - 1) {
      return applyError(state, AuthenticationErrorCommon.invalidStackIndex);
    }
    // eslint-disable-next-line functional/immutable-data, @typescript-eslint/no-non-null-assertion
    return pushToStack(nextState, nextState.stack.splice(index, 1)[0]!);
  });

export const opSplit4Byte = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack,
>(
  state: State,
) =>
  useOneVmNumber(
    state,
    (nextState, value) => {
      const index = Number(value);
      return useOneStackItem(nextState, (finalState, [item]) =>
        index < 0 || index > item.length
          ? applyError(finalState, AuthenticationErrorCommon.invalidSplitIndex)
          : pushToStack(finalState, item.slice(0, index), item.slice(index)),
      );
    },
    { maximumVmNumberByteLength },
  );

export const opNum2Bin4Byte = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack,
>(
  state: State,
) =>
  useOneVmNumber(state, (nextState, value) => {
    const targetLength = Number(value);
    return targetLength > ConsensusXEC.maximumStackItemLength
      ? applyError(
          nextState,
          AuthenticationErrorCommon.exceededMaximumStackItemLength,
        )
      : useOneVmNumber(
          nextState,
          (finalState, [target]) => {
            const minimallyEncoded = bigIntToVmNumber(target);
            return minimallyEncoded.length > targetLength
              ? applyError(
                  finalState,
                  AuthenticationErrorCommon.insufficientLength,
                )
              : minimallyEncoded.length === targetLength
                ? pushToStack(finalState, minimallyEncoded)
                : pushToStack(
                    finalState,
                    padMinimallyEncodedVmNumber(minimallyEncoded, targetLength),
                  );
          },
          {
            maximumVmNumberByteLength: ConsensusXEC.maximumStackItemLength,
            requireMinimalEncoding: false,
          },
        );
  });

export const opBin2Num4Byte = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack,
>(
  state: State,
) =>
  useOneVmNumber(
    state,
    (nextState, [target]) => {
      const minimallyEncoded = bigIntToVmNumber(target);
      return minimallyEncoded.length > ConsensusXEC.maximumVmNumberLength
        ? applyError(
            nextState,
            AuthenticationErrorCommon.exceededMaximumVmNumberLength,
          )
        : pushToStack(nextState, minimallyEncoded);
    },
    {
      maximumVmNumberByteLength: ConsensusXEC.maximumStackItemLength,
      requireMinimalEncoding: false,
    },
  );

export const op1Add4Byte = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack,
>(
  state: State,
) =>
  useOneVmNumber(
    state,
    (nextState, [value]) =>
      pushToStack(nextState, bigIntToVmNumber(value + 1n)),
    { maximumVmNumberByteLength },
  );

export const op1Sub4Byte = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack,
>(
  state: State,
) =>
  useOneVmNumber(
    state,
    (nextState, [value]) =>
      pushToStack(nextState, bigIntToVmNumber(value - 1n)),
    { maximumVmNumberByteLength },
  );

export const opNegate4Byte = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack,
>(
  state: State,
) =>
  useOneVmNumber(
    state,
    (nextState, [value]) => pushToStack(nextState, bigIntToVmNumber(-value)),
    { maximumVmNumberByteLength },
  );

export const opAbs4Byte = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack,
>(
  state: State,
) =>
  useOneVmNumber(
    state,
    (nextState, [value]) =>
      pushToStack(nextState, bigIntToVmNumber(value < 0 ? -value : value)),
    { maximumVmNumberByteLength },
  );

export const opNot4Byte = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack,
>(
  state: State,
) =>
  useOneVmNumber(
    state,
    (nextState, [value]) =>
      pushToStack(
        nextState,
        value === 0n ? bigIntToVmNumber(1n) : bigIntToVmNumber(0n),
      ),
    { maximumVmNumberByteLength },
  );

export const op0NotEqual4Byte = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack,
>(
  state: State,
) =>
  useOneVmNumber(
    state,
    (nextState, [value]) =>
      pushToStack(
        nextState,
        value === 0n ? bigIntToVmNumber(0n) : bigIntToVmNumber(1n),
      ),
    { maximumVmNumberByteLength },
  );

export const opAdd4Byte = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack,
>(
  state: State,
) =>
  useTwoVmNumbers(
    state,
    (nextState, [firstValue, secondValue]) =>
      pushToStack(nextState, bigIntToVmNumber(firstValue + secondValue)),
    { maximumVmNumberByteLength },
  );

export const opSub4Byte = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack,
>(
  state: State,
) =>
  useTwoVmNumbers(
    state,
    (nextState, [firstValue, secondValue]) =>
      pushToStack(nextState, bigIntToVmNumber(firstValue - secondValue)),
    { maximumVmNumberByteLength },
  );

export const opDiv4Byte = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack,
>(
  state: State,
) =>
  useTwoVmNumbers(
    state,
    (nextState, [a, b]) =>
      b === 0n
        ? applyError(nextState, AuthenticationErrorCommon.divisionByZero)
        : pushToStack(nextState, bigIntToVmNumber(a / b)),
    { maximumVmNumberByteLength },
  );

export const opMod4Byte = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack,
>(
  state: State,
) =>
  useTwoVmNumbers(
    state,
    (nextState, [a, b]) =>
      b === 0n
        ? applyError(nextState, AuthenticationErrorCommon.divisionByZero)
        : pushToStack(nextState, bigIntToVmNumber(a % b)),
    { maximumVmNumberByteLength },
  );

export const opBoolAnd4Byte = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack,
>(
  state: State,
) =>
  useTwoVmNumbers(
    state,
    (nextState, [firstValue, secondValue]) =>
      pushToStack(
        nextState,
        booleanToVmNumber(firstValue !== 0n && secondValue !== 0n),
      ),
    { maximumVmNumberByteLength },
  );

export const opBoolOr4Byte = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack,
>(
  state: State,
) =>
  useTwoVmNumbers(
    state,
    (nextState, [firstValue, secondValue]) =>
      pushToStack(
        nextState,
        booleanToVmNumber(firstValue !== 0n || secondValue !== 0n),
      ),
    { maximumVmNumberByteLength },
  );

export const opNumEqual4Byte = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack,
>(
  state: State,
) =>
  useTwoVmNumbers(
    state,
    (nextState, [firstValue, secondValue]) =>
      pushToStack(nextState, booleanToVmNumber(firstValue === secondValue)),
    { maximumVmNumberByteLength },
  );

export const opNumEqualVerify4Byte = combineOperations(
  opNumEqual4Byte,
  opVerify,
);

export const opNumNotEqual4Byte = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack,
>(
  state: State,
) =>
  useTwoVmNumbers(
    state,
    (nextState, [firstValue, secondValue]) =>
      pushToStack(nextState, booleanToVmNumber(firstValue !== secondValue)),
    { maximumVmNumberByteLength },
  );

export const opLessThan4Byte = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack,
>(
  state: State,
) =>
  useTwoVmNumbers(
    state,
    (nextState, [firstValue, secondValue]) =>
      pushToStack(nextState, booleanToVmNumber(firstValue < secondValue)),
    { maximumVmNumberByteLength },
  );

export const opLessThanOrEqual4Byte = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack,
>(
  state: State,
) =>
  useTwoVmNumbers(
    state,
    (nextState, [firstValue, secondValue]) =>
      pushToStack(nextState, booleanToVmNumber(firstValue <= secondValue)),
    { maximumVmNumberByteLength },
  );

export const opGreaterThan4Byte = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack,
>(
  state: State,
) =>
  useTwoVmNumbers(
    state,
    (nextState, [firstValue, secondValue]) =>
      pushToStack(nextState, booleanToVmNumber(firstValue > secondValue)),
    { maximumVmNumberByteLength },
  );

export const opGreaterThanOrEqual4Byte = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack,
>(
  state: State,
) =>
  useTwoVmNumbers(
    state,
    (nextState, [firstValue, secondValue]) =>
      pushToStack(nextState, booleanToVmNumber(firstValue >= secondValue)),
    { maximumVmNumberByteLength },
  );

export const opMin4Byte = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack,
>(
  state: State,
) =>
  useTwoVmNumbers(
    state,
    (nextState, [firstValue, secondValue]) =>
      pushToStack(
        nextState,
        bigIntToVmNumber(firstValue < secondValue ? firstValue : secondValue),
      ),
    { maximumVmNumberByteLength },
  );

export const opMax4Byte = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack,
>(
  state: State,
) =>
  useTwoVmNumbers(
    state,
    (nextState, [firstValue, secondValue]) =>
      pushToStack(
        nextState,
        bigIntToVmNumber(firstValue > secondValue ? firstValue : secondValue),
      ),
    { maximumVmNumberByteLength },
  );

export const opWithin4Byte = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack,
>(
  state: State,
) =>
  useThreeVmNumbers(
    state,
    (nextState, [firstValue, secondValue, thirdValue]) =>
      pushToStack(
        nextState,
        booleanToVmNumber(secondValue <= firstValue && firstValue < thirdValue),
      ),
    { maximumVmNumberByteLength },
  );
