import type {
  AuthenticationProgramStateControlStack,
  AuthenticationProgramStateError,
  AuthenticationProgramStateResourceLimits,
  AuthenticationProgramStateStack,
  InstructionSetOperationMapping,
  Operation,
} from '../../../lib.js';

import { ConsensusCommon } from './consensus.js';
import { applyError, AuthenticationErrorCommon } from './errors.js';
import {
  bigIntToVmNumber,
  isVmNumberError,
  vmNumberToBigInt,
} from './instruction-sets-utils.js';

export const incrementOperationCount =
  <State extends { operationCount: number }>(
    operation: Operation<State>,
  ): Operation<State> =>
  (state: State) => {
    const nextState = operation(state);
    // eslint-disable-next-line functional/no-expression-statements, functional/immutable-data
    nextState.operationCount += 1;
    return nextState;
  };

export const executionIsActive = <
  State extends AuthenticationProgramStateControlStack<unknown>,
>(
  state: State,
) => state.controlStack.every((item) => item !== false);

export const conditionallyEvaluate =
  <State extends AuthenticationProgramStateControlStack<unknown>>(
    operation: Operation<State>,
  ): Operation<State> =>
  (state: State) =>
    executionIsActive(state) ? operation(state) : state;

/**
 * Map a function over each operation in an {@link InstructionSet.operations}
 * object, assigning the result to the same `opcode` in the resulting object.
 * @param operationMap - an operations map from an {@link InstructionSet}
 * @param combinators - a list of functions to apply (in order) to
 * each operation
 */
export const mapOverOperations = <State>(
  combinators: ((operation: Operation<State>) => Operation<State>)[],
  operationMap: InstructionSetOperationMapping<State>,
) =>
  Object.keys(operationMap).reduce<InstructionSetOperationMapping<State>>(
    (result, opcode) => ({
      ...result,
      [opcode]: combinators.reduce<Operation<State>>(
        (op, combinator) => combinator(op),
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        operationMap[Number(opcode)]!,
      ),
    }),
    {},
  );

/**
 * Pop one stack item off of `state.stack` and provide that item to `operation`.
 */
export const useOneStackItem = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack,
>(
  state: State,
  operation: (nextState: State, [value]: [Uint8Array]) => State,
) => {
  // eslint-disable-next-line functional/immutable-data
  const item = state.stack.pop();
  if (item === undefined) {
    return applyError(state, AuthenticationErrorCommon.emptyStack);
  }
  return operation(state, [item]);
};

export const useTwoStackItems = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack,
>(
  state: State,
  operation: (
    nextState: State,
    [valueTop, valueTwo]: [Uint8Array, Uint8Array],
  ) => State,
) =>
  useOneStackItem(state, (nextState, [valueTwo]) =>
    useOneStackItem(nextState, (lastState, [valueTop]) =>
      operation(lastState, [valueTop, valueTwo]),
    ),
  );

export const useThreeStackItems = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack,
>(
  state: State,
  operation: (
    nextState: State,
    [valueTop, valueTwo, valueThree]: [Uint8Array, Uint8Array, Uint8Array],
  ) => State,
) =>
  useOneStackItem(state, (nextState, [valueThree]) =>
    useTwoStackItems(nextState, (lastState, [valueTop, valueTwo]) =>
      operation(lastState, [valueTop, valueTwo, valueThree]),
    ),
  );

export const useFourStackItems = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack,
>(
  state: State,
  operation: (
    nextState: State,
    [valueTop, valueTwo, valueThree, valueFour]: [
      Uint8Array,
      Uint8Array,
      Uint8Array,
      Uint8Array,
    ],
  ) => State,
) =>
  useTwoStackItems(state, (nextState, [valueThree, valueFour]) =>
    useTwoStackItems(nextState, (lastState, [valueTop, valueTwo]) =>
      operation(lastState, [valueTop, valueTwo, valueThree, valueFour]),
    ),
  );

export const useSixStackItems = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack,
>(
  state: State,
  operation: (
    nextState: State,
    [valueTop, valueTwo, valueThree, valueFour, valueFive, valueSix]: [
      Uint8Array,
      Uint8Array,
      Uint8Array,
      Uint8Array,
      Uint8Array,
      Uint8Array,
    ],
  ) => State,
) =>
  useFourStackItems(
    state,
    (nextState, [valueThree, valueFour, valueFive, valueSix]) =>
      useTwoStackItems(nextState, (lastState, [valueTop, valueTwo]) =>
        operation(lastState, [
          valueTop,
          valueTwo,
          valueThree,
          valueFour,
          valueFive,
          valueSix,
        ]),
      ),
  );

const typicalMaximumVmNumberByteLength = 8;

export const useOneVmNumber = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack,
>(
  state: State,
  operation: (nextState: State, [value]: [bigint]) => State,
  {
    maximumVmNumberByteLength = typicalMaximumVmNumberByteLength,
    requireMinimalEncoding = true,
  }: {
    maximumVmNumberByteLength?: number;
    requireMinimalEncoding?: boolean;
  } = {
    maximumVmNumberByteLength: typicalMaximumVmNumberByteLength,
    requireMinimalEncoding: true,
  },
) =>
  useOneStackItem(state, (nextState, [item]) => {
    const value = vmNumberToBigInt(item, {
      maximumVmNumberByteLength,
      requireMinimalEncoding,
    });
    if (isVmNumberError(value)) {
      return applyError(
        state,
        AuthenticationErrorCommon.invalidVmNumber,
        value,
      );
    }
    return operation(nextState, [value]);
  });

export const useTwoVmNumbers = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack,
>(
  state: State,
  operation: (
    nextState: State,
    [firstValue, secondValue]: [bigint, bigint],
  ) => State,
  {
    maximumVmNumberByteLength = typicalMaximumVmNumberByteLength,
    requireMinimalEncoding = true,
  }: {
    maximumVmNumberByteLength?: number;
    requireMinimalEncoding?: boolean;
  } = {
    maximumVmNumberByteLength: typicalMaximumVmNumberByteLength,
    requireMinimalEncoding: true,
  },
) =>
  useOneVmNumber(
    state,
    (nextState, [secondValue]) =>
      useOneVmNumber(
        nextState,
        (lastState, [firstValue]) =>
          operation(lastState, [firstValue, secondValue]),
        {
          maximumVmNumberByteLength,
          requireMinimalEncoding,
        },
      ),
    {
      maximumVmNumberByteLength,
      requireMinimalEncoding,
    },
  );

export const useThreeVmNumbers = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack,
>(
  state: State,
  operation: (
    nextState: State,
    [firstValue, secondValue, thirdValue]: [bigint, bigint, bigint],
  ) => State,
  {
    maximumVmNumberByteLength = typicalMaximumVmNumberByteLength,
    requireMinimalEncoding = true,
  }: {
    maximumVmNumberByteLength?: number;
    requireMinimalEncoding?: boolean;
  } = {
    maximumVmNumberByteLength: typicalMaximumVmNumberByteLength,
    requireMinimalEncoding: true,
  },
) =>
  useTwoVmNumbers(
    state,
    (nextState, [secondValue, thirdValue]) =>
      useOneVmNumber(
        nextState,
        (lastState, [firstValue]) =>
          operation(lastState, [firstValue, secondValue, thirdValue]),
        {
          maximumVmNumberByteLength,
          requireMinimalEncoding,
        },
      ),
    {
      maximumVmNumberByteLength,
      requireMinimalEncoding,
    },
  );

/**
 * Return the provided state with the provided value pushed to its stack.
 * @param state - the state to update and return
 * @param data - the values to push to the stack
 * @param pushedBytes - the number of bytes this operation should add to
 * `state.metrics.stackPushedBytes`; defaults to the sum of all `data` lengths
 */
export const pushToStack = <State extends AuthenticationProgramStateStack>(
  state: State,
  data: Uint8Array[],
  { pushedBytes = data.reduce((acc, item) => acc + item.length, 0) } = {},
) => {
  // eslint-disable-next-line functional/no-expression-statements, functional/immutable-data
  state.stack.push(...data);
  // eslint-disable-next-line functional/no-expression-statements, functional/immutable-data
  state.metrics.stackPushedBytes += pushedBytes;
  return state;
};

/**
 * If the provided item exceeds the maximum stack item length, apply an error.
 * Otherwise, return the provided state with the item pushed to its stack.
 * @param state - the state to update and return
 * @param item - the value to push to the stack
 */
export const pushToStackChecked = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack,
>(
  state: State,
  item: Uint8Array,
  {
    maximumStackItemLength = ConsensusCommon.maximumStackItemLength as number,
  } = {},
) => {
  if (item.length > maximumStackItemLength) {
    return applyError(
      state,
      AuthenticationErrorCommon.exceededMaximumStackItemLength,
      `Maximum stack item length: ${maximumStackItemLength}; item length: ${item.length} bytes.`,
    );
  }
  // eslint-disable-next-line functional/no-expression-statements, functional/immutable-data
  state.stack.push(item);
  // eslint-disable-next-line functional/no-expression-statements, functional/immutable-data
  state.metrics.stackPushedBytes += item.length;
  return state;
};

/**
 * Return the provided state with the VM number pushed to its stack.
 * @param state - the state to update and return
 * @param vmNumber - the number to push to the stack
 */
export const pushToStackVmNumber = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack,
>(
  state: State,
  vmNumber: bigint,
) => pushToStack(state, [bigIntToVmNumber(vmNumber)]);

/**
 * If the provided number is outside the VM number range, apply an error.
 * Otherwise, return the provided state with the VM number pushed to its stack.
 * @param state - the state to update and return
 * @param vmNumber - the VM number to push to the stack
 */
export const pushToStackVmNumberChecked = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateResourceLimits &
    AuthenticationProgramStateStack,
>(
  state: State,
  vmNumber: bigint,
  {
    maximumVmNumberByteLength = ConsensusCommon.maximumVmNumberByteLength as number,
    hasEncodingCost = false,
  } = {},
) => {
  const encoded = bigIntToVmNumber(vmNumber);
  if (encoded.length > maximumVmNumberByteLength) {
    return applyError(
      state,
      AuthenticationErrorCommon.overflowsVmNumberRange,
      `Maximum VM number byte length: ${maximumVmNumberByteLength}; encoded number length: ${encoded.length}.`,
    );
  }
  // eslint-disable-next-line functional/no-expression-statements, functional/immutable-data
  state.metrics.arithmeticCost += hasEncodingCost ? encoded.length : 0;
  return pushToStack(state, [encoded]);
};

export const combineOperations =
  <State>(
    firstOperation: Operation<State>,
    secondOperation: Operation<State>,
  ) =>
  (state: State) =>
    secondOperation(firstOperation(state));

/**
 * Given a message length, compute and return the number of hash digest
 * iterations required. (See `CHIP-2021-05-vm-limits`)
 */
export const lengthToHashDigestIterationCount = (messageLength: number) =>
  // eslint-disable-next-line no-bitwise, @typescript-eslint/no-magic-numbers
  1 + (((messageLength + 8) / 64) | 0);

/**
 * Given a program state, increment the hash digest iteration count for a
 * message of the provided length. If the total would exceed the maximum, append
 * an error.
 */
export const incrementHashDigestIterations = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateResourceLimits,
>(
  state: State,
  {
    messageLength,
    resultIsHashed,
  }: {
    /**
     * The length of the message to be hashed.
     */
    messageLength: number;
    /**
     * If `true`, the result of the initial hashing process is to be provided to
     * the hashing function one final time (i.e. for `OP_HASH160`
     * and `OP_HASH256`).
     */
    resultIsHashed: boolean;
  },
  /**
   * The operation to execute if no error occurred
   */
  operation: (nextState: State) => State,
) => {
  const newIterations = lengthToHashDigestIterationCount(messageLength);
  const secondRound = resultIsHashed ? 1 : 0;
  const requiredTotalIterations =
    state.metrics.hashDigestIterations + newIterations + secondRound;
  // eslint-disable-next-line functional/no-expression-statements, functional/immutable-data
  state.metrics.hashDigestIterations = requiredTotalIterations;
  return operation(state);
};
