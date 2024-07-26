import { binsAreEqual } from '../../../format/format.js';
import type {
  AuthenticationProgramStateError,
  AuthenticationProgramStateResourceLimits,
  AuthenticationProgramStateStack,
  Operation,
} from '../../../lib.js';

import {
  combineOperations,
  measureBitwiseCost,
  pushToStack,
  useTwoStackItems,
} from './combinators.js';
import { applyError, AuthenticationErrorCommon } from './errors.js';
import { opVerify } from './flow-control.js';
import { booleanToVmNumber } from './instruction-sets-utils.js';

export const opEqual = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack,
>(
  state: State,
) =>
  useTwoStackItems(state, (nextState, [element1, element2]) =>
    pushToStack(nextState, [
      booleanToVmNumber(binsAreEqual(element1, element2)),
    ]),
  );

export const opEqualVerify = combineOperations(opEqual, opVerify);

export const bitwiseOperation =
  <
    State extends AuthenticationProgramStateError &
      AuthenticationProgramStateResourceLimits &
      AuthenticationProgramStateStack,
  >(
    combine: (a: Uint8Array, b: Uint8Array) => Uint8Array,
  ): Operation<State> =>
  (state: State) =>
    measureBitwiseCost(state, () =>
      useTwoStackItems(state, (nextState, [a, b]) =>
        a.length === b.length
          ? pushToStack(nextState, [combine(a, b)])
          : applyError(
              nextState,
              AuthenticationErrorCommon.mismatchedBitwiseOperandLength,
            ),
      ),
    );

// eslint-disable-next-line no-bitwise, @typescript-eslint/no-non-null-assertion
export const opAnd = bitwiseOperation((a, b) => a.map((v, i) => v & b[i]!)) as <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack,
>(
  state: State,
) => State;

// eslint-disable-next-line no-bitwise, @typescript-eslint/no-non-null-assertion
export const opOr = bitwiseOperation((a, b) => a.map((v, i) => v | b[i]!)) as <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack,
>(
  state: State,
) => State;

// eslint-disable-next-line no-bitwise, @typescript-eslint/no-non-null-assertion
export const opXor = bitwiseOperation((a, b) => a.map((v, i) => v ^ b[i]!)) as <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack,
>(
  state: State,
) => State;
