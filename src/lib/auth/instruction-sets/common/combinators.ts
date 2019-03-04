/* istanbul ignore file */ // TODO: stabilize & test

import { ErrorState, StackState } from '../../state';
import { InstructionSet, Operation } from '../../virtual-machine';
import {
  applyError,
  CommonAuthenticationError,
  isScriptNumberError,
  parseBytesAsScriptNumber
} from './common';

export const incrementOperationCount = <
  // tslint:disable-next-line:readonly-keyword
  ProgramState extends { operationCount: number }
>(
  operation: Operation<ProgramState>
): Operation<ProgramState> => (state: ProgramState) => {
  const nextState = operation(state);
  // tslint:disable-next-line:no-object-mutation no-expression-statement
  nextState.operationCount++;
  return nextState;
};

export const conditionallyEvaluate = <
  // tslint:disable-next-line:readonly-keyword readonly-array
  ProgramState extends { executionStack: boolean[] }
>(
  operation: Operation<ProgramState>
): Operation<ProgramState> => (state: ProgramState) =>
  state.executionStack.every(item => item) ? operation(state) : state;

/**
 * Map a function over each operation in an `InstructionSet.operations` object,
 * assigning the result to the same `opcode` in the resulting object.
 * @param operations an operations map from an `InstructionSet`
 * @param combinator a function to apply to each operation
 */
export const mapOverOperations = <ProgramState>(
  operations: InstructionSet<ProgramState>['operations'],
  combinator: (operation: Operation<ProgramState>) => Operation<ProgramState>
) =>
  Object.keys(operations).reduce<{
    readonly [opcode: number]: Operation<ProgramState>;
  }>(
    (result, operation) => ({
      ...result,
      [operation]: combinator(operations[parseInt(operation, 10)])
    }),
    {}
  );

export const useTwoScriptNumbers = <
  State extends StackState & ErrorState<Errors>,
  Errors
>(
  state: State,
  operation: (
    nextState: State,
    firstValue: bigint,
    secondValue: bigint
  ) => State
) => {
  const topItem = state.stack.pop();
  const secondItem = state.stack.pop();
  // tslint:disable-next-line:no-if-statement
  if (!topItem || !secondItem) {
    return applyError<State, Errors>(
      CommonAuthenticationError.emptyStack,
      state
    );
  }
  const firstValue = parseBytesAsScriptNumber(secondItem);
  const secondValue = parseBytesAsScriptNumber(topItem);

  // tslint:disable-next-line:no-if-statement
  if (isScriptNumberError(firstValue) || isScriptNumberError(secondValue)) {
    return applyError<State, Errors>(
      CommonAuthenticationError.invalidNaturalNumber,
      state
    );
  }
  return operation(state, firstValue, secondValue);
};

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
      CommonAuthenticationError.emptyStack,
      state
    );
  }
  return operation(state, item);
};

/**
 * Return the provided state with the provided value pushed to its stack.
 * @param state the state to update and return
 * @param data the value to push to the stack
 */
export const pushToStack = <State extends StackState>(
  state: State,
  data: Uint8Array
) => {
  // tslint:disable-next-line:no-expression-statement
  state.stack.push(data);
  return state;
};

export const combineOperations = <State>(
  firstOperation: Operation<State>,
  secondOperation: Operation<State>
) => (state: State) => secondOperation(firstOperation(state));
