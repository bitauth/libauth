import { range } from '../format/format';

import { AuthenticationProgramStateBCH } from './instruction-sets/instruction-sets';
import { AuthenticationProgramStateMinimum } from './vm-types';

/**
 * Operations define the behavior of an opcode in an `InstructionSet`.
 *
 * Operations should be written as efficiently as possible, and may safely
 * mutate the `ProgramState`. If needed, the `AuthenticationVirtualMachine`
 * will clone the `ProgramState` before providing it to an operation.
 */
export type Operation<ProgramState> = (state: ProgramState) => ProgramState;

/**
 * Test a program state, returning an error message
 */
export type TestState<ProgramState> = (state: ProgramState) => string | true;
export interface InstructionSetOperationMapping<ProgramState> {
  [opcode: number]: Operation<ProgramState>;
}

/**
 * An `InstructionSet` is a mapping of methods which define the operation of
 * an `AuthenticationVirtualMachine`. An instruction set is specific to a
 * single consensus setting of a single network, e.g. `BCH_2019_05_Mandatory`, `BCH_2019_05_Standard` or `BTC_2017_08_Mandatory`.
 *
 * An instruction set is composed of `Operation`s which take a `ProgramState`
 * and return a `ProgramState`, as well as the `clone`, `continue`, `evaluate`,
 * and `verify` "lifecycle" methods.
 *
 * Each operation is assigned to its `opcode` number (between 0 and 255). When
 * evaluating instructions, the virtual machine will select an Operation based
 * on its opcode. Any opcodes which are unassigned by the instruction set will
 * use the `undefined` operation.
 */
export interface InstructionSet<AuthenticationProgram, ProgramState> {
  /**
   * Take a `ProgramState` and return a new copy of that `ProgramState`.
   *
   * @remarks
   * This method is used internally by `stateEvaluate`, `stateStep`, and
   * `stateDebug` to prevent the `AuthenticationVirtualMachine` from mutating an
   * input when mutation is not desirable.
   */
  clone: Operation<ProgramState>;

  /**
   * Test the ProgramState to determine if execution should continue.
   *
   * @remarks
   * This method is used internally by the `AuthenticationVirtualMachine`'s
   * `stateEvaluate` and `stateDebug` methods after each operation, and should
   * usually test for errors or program completion. This method is exposed via
   * the `AuthenticationVirtualMachine`'s `stateContinue` method.
   */
  // eslint-disable-next-line functional/no-mixed-type
  continue: (state: ProgramState) => boolean;

  /**
   * Evaluate a program to completion given the `AuthenticationVirtualMachine`'s
   * `stateEvaluate` method.
   *
   * @remarks
   * Each `AuthenticationVirtualMachine` can have precise operation requirements
   * modifying the ways in which `AuthenticationProgram`s and `ProgramState`s
   * are interpreted. (In the C++ implementations, these requirements are
   * encoded in `VerifyScript`, and can significantly modify the semantics of
   * the basic `EvalScript` system.)
   *
   * This method is used internally by the `AuthenticationVirtualMachine`'s
   * `evaluate` and `debug` methods. It should perform any necessary operations
   * and validations before returning a fully-evaluated `ProgramState`.
   *
   * @privateRemarks
   * When using the `debug` method, the `stateEvaluate` parameter is given a
   * a modified `stateDebug` which shares the same method signature as
   * `stateEvaluate` but saves intermediate states for use in the returned
   * array. When the method returns, the last `ProgramState` is added to the
   * array of saved intermediate states, and the full array is returned. This
   * allows the same implementation to be used for both `evaluate` and `debug`.
   *
   * Due to this behavior, the ordering of `ProgramState`s in debugging results
   * depends upon the order in which `stateEvaluate` is called in this method.
   * If `stateEvaluate` is called multiple times, the intermediate results from
   * the first call will be appear before the results of the second call, etc.
   */
  evaluate: (
    program: AuthenticationProgram,
    stateEvaluate: (state: Readonly<ProgramState>) => ProgramState
  ) => ProgramState;

  /**
   * A mapping of `opcode` numbers (between 0 and 255) to `Operations`. When the
   * `AuthenticationVirtualMachine` encounters an instruction for the specified
   * `opcode`, the program state will be passed to the specified operation.
   */
  // eslint-disable-next-line functional/no-mixed-type
  operations: InstructionSetOperationMapping<ProgramState>;

  /**
   * This operation is called when an undefined opcode is encountered.
   *
   * @remarks
   * This method should usually mark the ProgramState with an error.
   */
  undefined: Operation<ProgramState>;

  /**
   * Verify a program state has completed evaluation successfully.
   *
   * @remarks
   * This method should return `true` if the evaluation was successful, or
   * an error message on failure.
   */
  // eslint-disable-next-line functional/no-mixed-type
  verify: (state: ProgramState) => string | true;
}

/**
 * A set of pure-functions allowing authentication programs to be evaluated and
 * inspected.
 */
export interface AuthenticationVirtualMachine<
  AuthenticationProgram,
  ProgramState
> {
  /**
   * Debug a program by fully evaluating it, cloning and adding each
   * intermediate `ProgramState` to the returned array. The first `ProgramState`
   * in the returned array is the initial program state, and the last
   * `ProgramState` in the returned array is the result of the evaluation.
   *
   * Note, If the virtual machine is multi-phasic (as is the case with all
   * bitcoin forks), the initial program state at the start of of each phase
   * will appear in the debug trace. For example, all inputs in all bitcoin
   * forks use at least two phases 1) the unlocking phase 2) the locking
   * phase. Inputs which match the P2SH format perform a third P2SH phase. Other
   * virtual machines may include different phases (e.g. the SegWit phase in
   * BTC). For each phase performed, the count of program states in the final
   * debug trace will increase by one, even if the phase includes no
   * instructions.
   *
   * @remarks
   * Even for simple virtual machines, this method includes one final program
   * state in addition to the output which would otherwise be produced by
   * `stateDebug`. This occurs because the `evaluate` method of the instruction
   * set must return one final program state after `stateContinue` has produced
   * a `false`. Often, this is cloned from the previous program state, but it
   * is also possible that this final state will include changes produced by
   * the remaining portion of the instruction set's `evaluate` method (e.g. P2SH
   * evaluation). In any case, this final program state is **not a
   * "duplicate"**: it is the finalized result of the complete virtual machine
   * evaluation.
   *
   * @param state - the `AuthenticationProgram` to debug
   */
  debug: (program: Readonly<AuthenticationProgram>) => ProgramState[];

  /**
   * Fully evaluate a program, returning the resulting `ProgramState`.
   *
   * @param state - the `AuthenticationProgram` to evaluate
   */
  evaluate: (program: Readonly<AuthenticationProgram>) => ProgramState;

  /**
   * Test the ProgramState to determine if execution should continue.
   */
  stateContinue: (state: Readonly<ProgramState>) => boolean;

  /**
   * Return an array of program states by fully evaluating `state`, cloning and
   * adding each intermediate state to the returned array. The first
   * `ProgramState` in the returned array is the initial program state, and the
   * last `ProgramState` in the returned array is the first program state which
   * returns `false` when provided to `stateContinue`.
   *
   * Note, this method is typically an implementation detail of the virtual
   * machine and cannot produce a final result. In most cases, `debug` is the
   * proper method to debug a program.
   */
  stateDebug: (state: Readonly<ProgramState>) => ProgramState[];

  /**
   * Return a new program state by cloning and fully evaluating `state`.
   *
   * To evaluate a state, the state is cloned and provided to `stateStepMutate`
   * until a final result is obtained (a `ProgramState` which returns `false`
   * when provided to `stateContinue`).
   *
   * Note, this method is typically an implementation detail of the virtual
   * machine and cannot produce a final result. In most cases, `evaluate` is the
   * proper method to evaluate a program.
   *
   * @param state - the program state to evaluate
   */
  stateEvaluate: (state: Readonly<ProgramState>) => ProgramState;

  /**
   * Clones and return a new program state advanced by one step.
   *
   * @param state - the program state to advance
   */
  stateStep: (state: Readonly<ProgramState>) => ProgramState;

  /**
   * A faster, less-safe version of `step` which directly modifies the provided
   * program state.
   *
   * @param state - the program state to mutate
   */
  stateStepMutate: (state: ProgramState) => ProgramState;

  /**
   * Verify a program state has completed evaluation successfully.
   *
   * @remarks
   * This method verifies a final `ProgramState` as emitted by the `evaluate` or
   * `debug` methods. When manually using the `stateStep` or `stateStepMutate`
   * methods, ensure the `ProgramState` has finished evaluation using the
   * `stateContinue` method.
   * @param state - the program state to verify
   */
  verify: (state: ProgramState) => true | string;
}

/**
 * Create an AuthenticationVirtualMachine to evaluate authentication programs
 * constructed from operations in the `instructionSet`.
 * @param instructionSet - an `InstructionSet`
 */
export const createAuthenticationVirtualMachine = <
  AuthenticationProgram,
  ProgramState extends AuthenticationProgramStateMinimum = AuthenticationProgramStateBCH
>(
  instructionSet: InstructionSet<AuthenticationProgram, ProgramState>
): AuthenticationVirtualMachine<AuthenticationProgram, ProgramState> => {
  const availableOpcodes = 256;
  const operators = range(availableOpcodes).map((codepoint) =>
    (instructionSet.operations[codepoint] as
      | Operation<ProgramState>
      | undefined) === undefined
      ? instructionSet.undefined
      : instructionSet.operations[codepoint]
  );

  const getCodepoint = (state: ProgramState) => state.instructions[state.ip];

  const after = (state: ProgramState) => {
    // eslint-disable-next-line functional/no-expression-statement, functional/immutable-data
    state.ip += 1;
    return state;
  };

  const getOperation = (state: ProgramState) =>
    operators[getCodepoint(state).opcode];

  const stateStepMutate = (state: ProgramState) =>
    after(getOperation(state)(state));

  const stateContinue = instructionSet.continue;

  /**
   * When we get real tail call optimization, this can be replaced
   * with recursion.
   */
  const untilComplete = (
    state: ProgramState,
    stepFunction: (state: ProgramState) => ProgramState
  ) => {
    // eslint-disable-next-line functional/no-loop-statement
    while (stateContinue(state)) {
      // eslint-disable-next-line functional/no-expression-statement, no-param-reassign
      state = stepFunction(state);
    }
    return state;
  };

  const clone = (state: ProgramState) => instructionSet.clone(state);
  const { verify } = instructionSet;

  const stateEvaluate = (state: ProgramState) =>
    untilComplete(clone(state), stateStepMutate);

  const stateDebugStep = (state: ProgramState) => {
    const operator = getOperation(state);
    return after(operator(clone(state)));
  };

  const stateDebug = (state: ProgramState) => {
    const trace: ProgramState[] = [];
    // eslint-disable-next-line functional/no-expression-statement, functional/immutable-data
    trace.push(state);
    // eslint-disable-next-line functional/no-expression-statement
    untilComplete(state, (currentState: ProgramState) => {
      const nextState = stateDebugStep(currentState);
      // eslint-disable-next-line functional/no-expression-statement, functional/immutable-data
      trace.push(nextState);
      return nextState;
    });
    return trace;
  };

  const stateStep = (state: ProgramState) => stateStepMutate(clone(state));

  const evaluate = (program: AuthenticationProgram) =>
    instructionSet.evaluate(program, stateEvaluate);

  const debug = (program: AuthenticationProgram) => {
    const results: ProgramState[] = [];
    const proxyDebug = (state: ProgramState) => {
      const debugResult = stateDebug(state);
      // eslint-disable-next-line functional/no-expression-statement, functional/immutable-data
      results.push(...debugResult);
      return (
        (debugResult[debugResult.length - 1] as ProgramState | undefined) ??
        state
      );
    };
    const finalResult = instructionSet.evaluate(program, proxyDebug);
    return [...results, finalResult];
  };

  return {
    debug,
    evaluate,
    stateContinue,
    stateDebug,
    stateEvaluate,
    stateStep,
    stateStepMutate,
    verify,
  };
};
