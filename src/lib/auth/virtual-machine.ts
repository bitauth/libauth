/* istanbul ignore file */ // TODO: stabilize & test

import { range } from '../utils/utils';
import { BitcoinCashAuthenticationProgramState } from './instruction-sets/instruction-sets';
import { MinimumProgramState } from './state';

/**
 * Operations define the behavior of an opcode in an InstructionSet.
 *
 * Operations should be written as efficiently as possible, and may safely
 * mutate the ProgramState. If needed, the AuthenticationVirtualMachine
 * will clone the ProgramState before providing it to an operation.
 */
export type Operation<ProgramState> = (state: ProgramState) => ProgramState;
export type Guard<ProgramState> = (state: ProgramState) => boolean;

/**
 * An `InstructionSet` is a dictionary of methods which defines the operation of
 * an `AuthenticationVirtualMachine`. This instruction set is usually specific
 * to a single network, e.g. `BCH` or `BTC`.
 *
 * An instruction set is composed of `Operation`s which take a `ProgramState`
 * and return a `ProgramState`, as well as the `clone` and `continue`
 * "lifecycle" methods.
 *
 * Each operation is assigned to its `opcode` number (between 0 and 255). When
 * evaluating instructions, the virtual machine will select an Operation based
 * on its opcode. Any opcodes which are unassigned by the instruction set will
 * use the `undefined` operation.
 */
export interface InstructionSet<ProgramState> {
  /**
   * This method should take a ProgramState and return a new copy of that
   * ProgramState. It's used internally by `evaluate`, `step`, and `debug` to
   * prevent the AuthenticationVirtualMachine from mutating an input when
   * mutation is not desirable (e.g. when performance is not a priority).
   */
  readonly clone: Operation<ProgramState>;

  /**
   * This method should test the ProgramState to determine if execution should
   * continue. It's used internally by the `evaluate` and `debug` methods, and
   * should usually test for errors or program completion.
   */
  readonly continue: Guard<ProgramState>;

  /**
   * A mapping of `opcode` numbers (between 0 and 255) to `Operations`. When the
   * `AuthenticationVirtualMachine` encounters an instruction for the specified
   * `opcode`, the program state will be passed to the specified operation.
   */
  readonly operations: {
    readonly [opcode: number]: Operation<ProgramState>;
  };

  /**
   * This operation is called when an undefined opcode is encountered. It should
   * usually mark the ProgramState with an error.
   */
  readonly undefined: Operation<ProgramState>;
}

/**
 * A set of pure-functions allowing authentication programs to be evaluated and
 * inspected.
 */
export interface AuthenticationVirtualMachine<ProgramState> {
  /**
   * Return an array of program states by fully evaluating `state`, cloning and
   * adding each intermediate state to the returned array.
   */
  // tslint:disable-next-line:readonly-array
  readonly debug: (state: Readonly<ProgramState>) => ProgramState[];

  /**
   * Return a new program state by cloning and fully evaluating `state`.
   * @param state the program state to evaluate
   */
  readonly evaluate: (state: Readonly<ProgramState>) => ProgramState;

  /**
   * Clones and return a new program state advanced by one step.
   * @param state the program state to advance
   */
  readonly step: (state: Readonly<ProgramState>) => ProgramState;

  /**
   * A faster, less-safe version of `step` which directly modifies the provided
   * program state.
   * @param state the program state to mutate
   */
  readonly stepMutate: (state: ProgramState) => ProgramState;
}

/**
 * Create an AuthenticationVirtualMachine to evaluate authentication programs
 * constructed from operations in the `instructionSet`.
 * @param instructionSet an `InstructionSet`
 */
export const createAuthenticationVirtualMachine = <
  ProgramState extends MinimumProgramState = BitcoinCashAuthenticationProgramState
>(
  instructionSet: InstructionSet<ProgramState>
): AuthenticationVirtualMachine<ProgramState> => {
  const availableOpcodes = 256;
  const operators = range(availableOpcodes).map(codepoint =>
    // tslint:disable-next-line: strict-type-predicates
    instructionSet.operations[codepoint] === undefined
      ? instructionSet.undefined
      : instructionSet.operations[codepoint]
  );

  const getCodepoint = (state: ProgramState) => state.instructions[state.ip];

  const after = (state: ProgramState) => {
    // tslint:disable-next-line:no-object-mutation no-expression-statement
    state.ip++;
    return state;
  };

  const getOperation = (state: ProgramState) =>
    operators[getCodepoint(state).opcode];

  const stepMutate = (state: ProgramState) => after(getOperation(state)(state));

  /**
   * When we get real tail call optimization, this can be replaced
   * with recursion.
   */
  const untilComplete = (
    state: ProgramState,
    stepFunction: (state: ProgramState) => ProgramState
  ) => {
    while (instructionSet.continue(state)) {
      // tslint:disable-next-line:no-parameter-reassignment no-expression-statement
      state = stepFunction(state);
    }
    return state;
  };

  const clone = (state: ProgramState) => instructionSet.clone(state);

  const evaluate = (state: ProgramState) =>
    untilComplete(clone(state), stepMutate);

  const stepDebug = (state: ProgramState) => {
    const operator = getOperation(state);
    return after(operator(clone(state)));
  };

  const debug = (state: ProgramState) => {
    // tslint:disable-next-line:prefer-const no-let readonly-array
    let trace: ProgramState[] = [];
    untilComplete(state, (currentState: ProgramState) => {
      const nextState = stepDebug(currentState);
      // tslint:disable-next-line:no-expression-statement
      trace.push(nextState);
      return nextState;
    });
    return trace;
  };

  const step = (state: ProgramState) => stepMutate(clone(state));

  return { debug, evaluate, step, stepMutate };
};
