import { ErrorState, ExecutionStackState, StackState } from '../../state';
import {
  InstructionSetOperationMapping,
  Operation
} from '../../virtual-machine';

import { isScriptNumberError, parseBytesAsScriptNumber } from './common';
import { applyError, AuthenticationErrorCommon } from './errors';

export const incrementOperationCount = <
  State extends { operationCount: number }
>(
  operation: Operation<State>
): Operation<State> => (state: State) => {
  const nextState = operation(state);
  // tslint:disable-next-line:no-object-mutation no-expression-statement
  nextState.operationCount += 1;
  return nextState;
};

export const conditionallyEvaluate = <State extends ExecutionStackState>(
  operation: Operation<State>
): Operation<State> => (state: State) =>
  state.executionStack.every(item => item) ? operation(state) : state;

/**
 * Map a function over each operation in an `InstructionSet.operations` object,
 * assigning the result to the same `opcode` in the resulting object.
 * @param operations an operations map from an `InstructionSet`
 * @param combinator a function to apply to each operation
 */
export const mapOverOperations = <State>(
  operations: InstructionSetOperationMapping<State>,
  ...combinators: Array<(operation: Operation<State>) => Operation<State>>
) =>
  Object.keys(operations).reduce<{
    [opcode: number]: Operation<State>;
  }>(
    (result, operation) => ({
      ...result,
      [operation]: combinators.reduce(
        (op, combinator) => combinator(op),
        operations[parseInt(operation, 10)]
      )
    }),
    {}
  );

/**
 * Pop one stack item off of `state.stack` and provide that item to `operation`.
 */
export const useOneStackItem = <
  State extends StackState & ErrorState<Errors>,
  Errors
>(
  state: State,
  operation: (nextState: State, value: Uint8Array) => State
) => {
  const item = state.stack.pop();
  // tslint:disable-next-line:no-if-statement
  if (!item) {
    return applyError<State, Errors>(
      AuthenticationErrorCommon.emptyStack,
      state
    );
  }
  return operation(state, item);
};

export const useTwoStackItems = <
  State extends StackState & ErrorState<Errors>,
  Errors
>(
  state: State,
  operation: (
    nextState: State,
    valueTop: Uint8Array,
    valueTwo: Uint8Array
  ) => State
) =>
  useOneStackItem(state, (nextState, valueTwo) =>
    useOneStackItem(nextState, (lastState, valueTop) =>
      operation(lastState, valueTop, valueTwo)
    )
  );

export const useThreeStackItems = <
  State extends StackState & ErrorState<Errors>,
  Errors
>(
  state: State,
  operation: (
    nextState: State,
    valueTop: Uint8Array,
    valueTwo: Uint8Array,
    valueThree: Uint8Array
  ) => State
) =>
  useOneStackItem(state, (nextState, valueThree) =>
    useTwoStackItems(nextState, (lastState, valueTop, valueTwo) =>
      operation(lastState, valueTop, valueTwo, valueThree)
    )
  );

export const useFourStackItems = <
  State extends StackState & ErrorState<Errors>,
  Errors
>(
  state: State,
  operation: (
    nextState: State,
    valueTop: Uint8Array,
    valueTwo: Uint8Array,
    valueThree: Uint8Array,
    valueFour: Uint8Array
  ) => State
) =>
  useTwoStackItems(state, (nextState, valueThree, valueFour) =>
    useTwoStackItems(nextState, (lastState, valueTop, valueTwo) =>
      operation(lastState, valueTop, valueTwo, valueThree, valueFour)
    )
  );

export const useSixStackItems = <
  State extends StackState & ErrorState<Errors>,
  Errors
>(
  state: State,
  operation: (
    nextState: State,
    valueTop: Uint8Array,
    valueTwo: Uint8Array,
    valueThree: Uint8Array,
    valueFour: Uint8Array,
    valueFive: Uint8Array,
    valueSix: Uint8Array
  ) => State
) =>
  useFourStackItems(
    state,
    (nextState, valueThree, valueFour, valueFive, valueSix) =>
      useTwoStackItems(nextState, (lastState, valueTop, valueTwo) =>
        operation(
          lastState,
          valueTop,
          valueTwo,
          valueThree,
          valueFour,
          valueFive,
          valueSix
        )
      )
  );

export const useOneScriptNumber = <
  State extends StackState & ErrorState<Errors>,
  Errors
>(
  state: State,
  operation: (nextState: State, value: bigint) => State,
  requireMinimalEncoding: boolean,
  maximumScriptNumberByteLength = 4
) =>
  useOneStackItem(state, (nextState, item) => {
    const value = parseBytesAsScriptNumber(
      item,
      requireMinimalEncoding,
      maximumScriptNumberByteLength
    );
    // tslint:disable-next-line: no-if-statement
    if (isScriptNumberError(value)) {
      return applyError<State, Errors>(
        AuthenticationErrorCommon.invalidScriptNumber,
        state
      );
    }
    return operation(nextState, value);
  });

export const useTwoScriptNumbers = <
  State extends StackState & ErrorState<Errors>,
  Errors
>(
  state: State,
  operation: (
    nextState: State,
    firstValue: bigint,
    secondValue: bigint
  ) => State,
  requireMinimalEncoding: boolean,
  maximumScriptNumberByteLength = 4
) =>
  useOneScriptNumber(
    state,
    (nextState, secondValue) =>
      useOneScriptNumber(
        nextState,
        (lastState, firstValue) =>
          operation(lastState, firstValue, secondValue),
        requireMinimalEncoding,
        maximumScriptNumberByteLength
      ),
    requireMinimalEncoding,
    maximumScriptNumberByteLength
  );

export const useThreeScriptNumbers = <
  State extends StackState & ErrorState<Errors>,
  Errors
>(
  state: State,
  operation: (
    nextState: State,
    firstValue: bigint,
    secondValue: bigint,
    thirdValue: bigint
  ) => State,
  requireMinimalEncoding: boolean,
  maximumScriptNumberByteLength = 4
) =>
  useTwoScriptNumbers(
    state,
    (nextState, secondValue, thirdValue) =>
      useOneScriptNumber(
        nextState,
        (lastState, firstValue) =>
          operation(lastState, firstValue, secondValue, thirdValue),
        requireMinimalEncoding,
        maximumScriptNumberByteLength
      ),
    requireMinimalEncoding,
    maximumScriptNumberByteLength
  );

/**
 * Return the provided state with the provided value pushed to its stack.
 * @param state the state to update and return
 * @param data the value to push to the stack
 */
export const pushToStack = <State extends StackState>(
  state: State,
  ...data: Uint8Array[]
) => {
  // tslint:disable-next-line:no-expression-statement
  state.stack.push(...data);
  return state;
};

// TODO: if firstOperation errors, secondOperation might overwrite the error
export const combineOperations = <State>(
  firstOperation: Operation<State>,
  secondOperation: Operation<State>
) => (state: State) => secondOperation(firstOperation(state));
