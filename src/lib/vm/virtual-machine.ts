import { range } from '../format/format.js';
import type {
  AuthenticationProgramCommon,
  AuthenticationProgramStateCommon,
  AuthenticationProgramStateMinimum,
  AuthenticationProgramStateTransactionContext,
  ResolvedTransactionCommon,
} from '../lib.js';

/**
 * Operations define the behavior of an opcode in an {@link InstructionSet}.
 *
 * Operations should be written as efficiently as possible, and may safely
 * mutate the `ProgramState`. If needed, the
 * {@link AuthenticationVirtualMachine} will clone the `ProgramState` before
 * providing it to an operation.
 */
export type Operation<ProgramState> = (state: ProgramState) => ProgramState;

/**
 * Test a program state, returning an error message.
 */
export type TestState<ProgramState> = (state: ProgramState) => string | true;
export type InstructionSetOperationMapping<ProgramState> = {
  [opcode: number]: Operation<ProgramState>;
};

/**
 * An {@link InstructionSet} is a mapping of methods that define the operation
 * of an {@link AuthenticationVirtualMachine}.
 *
 * An instruction set is composed of {@link Operation}s that take a
 * `ProgramState` and return a `ProgramState`, as well as several instruction
 * set "lifecycle" methods.
 *
 * Each operation is assigned to its `opcode` number (between 0 and 255). When
 * evaluating instructions, the virtual machine will select an {@link Operation}
 * based on its opcode. Any opcodes that are unassigned by the instruction set
 * will use the `undefined` operation.
 */
export type InstructionSet<
  ResolvedTransaction,
  AuthenticationProgram,
  ProgramState,
> = {
  /**
   * Test the ProgramState to determine if execution should continue.
   *
   * @remarks
   * This method is used internally by the
   * {@link AuthenticationVirtualMachine}'s `stateEvaluate` and `stateDebug`
   * methods after each operation, and should usually test for errors or program
   * completion. This method is exposed via the
   * {@link AuthenticationVirtualMachine}'s `stateContinue` method.
   */
  continue: (state: ProgramState) => boolean;

  /**
   * Evaluate a program to completion given the
   * {@link AuthenticationVirtualMachine}'s `stateEvaluate` method.
   *
   * @remarks
   * Each {@link AuthenticationVirtualMachine} can have precise operation
   * requirements modifying the ways in which `AuthenticationProgram`s and
   * `ProgramState`s are interpreted. (In the C++ implementations, these
   * requirements are encoded in `VerifyScript`, and can significantly modify
   * the behavior of the basic `EvalScript` system.) For example, the secondary
   * evaluation step required for P2SH can be performed in this method.
   *
   * This method is used internally by the
   * {@link AuthenticationVirtualMachine}'s `evaluate` and `debug` methods. It
   * should perform any necessary operations and validations before returning a
   * fully-evaluated `ProgramState`.
   *
   * @privateRemarks
   * When using the `debug` method, the `stateEvaluate` parameter is given a
   * a modified `stateDebug` that shares the same method signature as
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
    {
      stateEvaluate,
      stateInitialize,
      stateOverride,
    }: {
      stateEvaluate: (state: ProgramState) => ProgramState;
      stateInitialize: (
        program: AuthenticationProgram,
      ) => Partial<ProgramState>;
      stateOverride?: Partial<ProgramState>;
    },
  ) => ProgramState;

  /**
   * An optional operation to be performed after every executed virtual machine
   * operation. This is useful for implementing logic that is common to all
   * operations, e.g. stack depth or memory usage, operation count, etc.
   */
  every?: Operation<ProgramState>;

  /**
   * Return a a partial program state including all properties that must be
   * initialized at the beginning of evaluation. If not set, `stateInitialize`
   * will return an object with an empty `metrics` object.
   */
  initialize?: (program: AuthenticationProgram) => Partial<ProgramState>;

  /**
   * A mapping of `opcode` numbers (between 0 and 255) to `Operations`. When the
   * {@link AuthenticationVirtualMachine} encounters an instruction for the
   * specified `opcode`, the program state will be passed to the
   * specified operation.
   */

  operations: InstructionSetOperationMapping<ProgramState>;

  /**
   * This operation is called when an undefined opcode is encountered.
   *
   * @remarks
   * This method should usually mark the ProgramState with an error.
   */
  undefined: Operation<ProgramState>;

  /**
   * Verify that a program state has completed evaluation successfully.
   *
   * @remarks
   * This method should return `true` if the evaluation was successful, or
   * an error message on failure.
   */

  success: (state: ProgramState) => string | true;

  /**
   * Verify a transaction given the {@link InstructionSet}'s `evaluate` and
   * `success` methods and a fully-resolved transaction (e.g. the decoded
   * transaction and an array of the outputs spent by its inputs).
   *
   * This method should perform all possible stateless transaction validation
   * but should not attempt to perform any kinds of network state-sensitive
   * validation (ensuring source outputs remain unspent, validating claimed
   * absolute or relative locktime values against current network conditions,
   * etc.), as such results could not be safely cached.
   *
   * @remarks
   * This method should return `true` if the transaction is valid, or an error
   * message (`string`) on failure.
   */
  verify: (
    resolvedTransaction: ResolvedTransaction,
    {
      evaluate,
      success,
      initialize,
    }: {
      evaluate: (
        program: AuthenticationProgram,
        options?: { stateOverride?: Partial<ProgramState> },
      ) => ProgramState;
      success: (state: ProgramState) => string | true;
      initialize: (program: AuthenticationProgram) => Partial<ProgramState>;
    },
  ) => string | true;
};

export type MaskedProgramState<
  ProgramState extends
    AuthenticationProgramStateMinimum = AuthenticationProgramStateCommon,
> = Omit<ProgramState, 'instructions' | 'program'> & {
  /**
   * The resolved instruction that was executed to arrive at this program state.
   *
   * Set to `undefined` for the last (duplicated) program state produced by each
   * bytecode evaluation.
   */
  instruction:
    | AuthenticationProgramStateMinimum['instructions'][number]
    | undefined;
};

/**
 * A set of pure-functions allowing transactions and their authentication
 * programs to be evaluated and inspected.
 */
export type AuthenticationVirtualMachine<
  ResolvedTransaction,
  AuthenticationProgram,
  ProgramState extends AuthenticationProgramStateMinimum,
> = {
  /**
   * Debug a program by fully evaluating it, cloning and adding each
   * intermediate `ProgramState` to the returned array. The first `ProgramState`
   * in the returned array is the initial program state, and the last
   * `ProgramState` in the returned array is the result of the evaluation.
   *
   * Note, If the virtual machine is multi-phasic (as is the case with all known
   * bitcoin forks due to P2SH), the initial program state at the start of each
   * phase will appear in the debug trace. For example, all inputs in all
   * bitcoin forks use at least two phases 1) the unlocking phase 2) the locking
   * phase. Inputs that match the P2SH format perform a third P2SH phase. Other
   * virtual machines may include different phases (e.g. the SegWit phase in
   * BTC). For each phase performed, the count of program states in the final
   * debug trace will increase by one, even if the phase includes no
   * instructions.
   *
   * @remarks
   * Even for simple virtual machines, this method includes one final program
   * state in addition to the output that would otherwise be produced by
   * `stateDebug`. This occurs because the `evaluate` method of the instruction
   * set must return one final program state after `stateContinue` has produced
   * a `false`. Often, this is cloned from the previous program state, but it
   * is also possible that this final state will include changes produced by
   * the remaining portion of the instruction set's `evaluate` method (e.g. P2SH
   * evaluation). In any case, this final program state is **not a
   * "duplicate"**: it is the finalized result of the complete virtual machine
   * evaluation.
   *
   * @param state - the {@link AuthenticationProgram} to debug
   */
  debug: <MaskProgramState extends boolean = false>(
    program: AuthenticationProgram,
    options?: {
      /**
       * Improve performance and reduce the memory footprint of the resulting
       * debug trace by excluding `program` and `instructions` and instead
       * including a resolved `instruction` in each returned program state.
       */
      maskProgramState?: MaskProgramState;
      stateOverride?: Partial<ProgramState>;
    },
  ) => (MaskProgramState extends true
    ? MaskedProgramState<ProgramState>
    : ProgramState)[];

  /**
   * Fully evaluate a program, returning the resulting `ProgramState`.
   *
   * @param state - the {@link AuthenticationProgram} to evaluate
   */
  evaluate: (
    program: AuthenticationProgram,
    options?: { stateOverride?: Partial<ProgramState> },
  ) => ProgramState;

  /**
   * Clone the provided ProgramState.
   */
  stateClone: (state: ProgramState) => ProgramState;

  /**
   * Test the ProgramState to determine if execution should continue.
   */
  stateContinue: (state: ProgramState) => boolean;

  /**
   * Return an array of program states by fully evaluating `state`, cloning and
   * adding each intermediate state to the returned array. The first
   * `ProgramState` in the returned array is the initial program state, and the
   * last `ProgramState` in the returned array is the first program state that
   * returns `false` when provided to `stateContinue`.
   *
   * Note, this method is typically an implementation detail of the virtual
   * machine and cannot produce a final result. In most cases, `debug` is the
   * proper method to debug a program.
   */
  stateDebug: (state: ProgramState) => ProgramState[];

  /**
   * Return a new program state by cloning and fully evaluating `state`.
   *
   * To evaluate a state, the state is cloned and provided to `stateStepMutate`
   * until a final result is obtained (a `ProgramState` that returns `false`
   * when provided to `stateContinue`).
   *
   * Note, this method is typically an implementation detail of the virtual
   * machine and cannot produce a final result. In most cases, `evaluate` is the
   * proper method to evaluate a program.
   *
   * @param state - the program state to evaluate
   */
  stateEvaluate: (state: ProgramState) => ProgramState;

  /**
   * Return a a partial program state including all properties that must be
   * initialized at the beginning of evaluation.
   */
  stateInitialize: (program: AuthenticationProgram) => Partial<ProgramState>;

  /**
   * Clones and return a new program state advanced by one step.
   *
   * @param state - the program state to advance
   */
  stateStep: (state: ProgramState) => ProgramState;

  /**
   * A faster, less-safe version of `step` that directly modifies the provided
   * program state.
   *
   * @param state - the program state to mutate
   */
  stateStepMutate: (state: ProgramState) => ProgramState;

  /**
   * Verify that a program state has completed evaluation successfully.
   *
   * @remarks
   * This method verifies a final `ProgramState` as emitted by the `evaluate` or
   * `debug` methods. When manually using the `stateStep` or `stateStepMutate`
   * methods, ensure the `ProgramState` has finished evaluation using the
   * `stateContinue` method.
   * @param state - the program state to verify
   */
  stateSuccess: (state: ProgramState) => string | true;

  /**
   * Statelessly verify a fully-resolved transaction (e.g. the decoded
   * transaction and an array of source outputs that are spent by its inputs).
   *
   * Returns `true` if the transaction is valid or an error message on failure.
   *
   * @remarks
   * While the virtual machine can perform all stateless components of
   * transaction validation, many applications also require stateful validation
   * – e.g. checking for conflicting transactions (double-spends) – before
   * accepting a transaction.
   *
   * For example, before a statelessly verified BCH transaction can be added to
   * a block, node implementations must confirm that:
   * - All `spentOutputs` are still unspent.
   * - The transaction's claimed relative and absolute locktime values meet
   * consensus requirements. (For determinism, time and confirmation-related VM
   * operations are performed using the precise `locktime` and `sequenceNumber`
   * values encoded in the transaction rather than "current" values on the
   * network at validation time. While these values may allow the VM to verify
   * the transaction, implementations must still ensure that the values are
   * consistent with reality before accepting the transaction. See BIP65, BIP68,
   * and BIP112 for details.)
   */
  verify: (resolvedTransaction: ResolvedTransaction) => string | true;
};

/**
 * Partially clone a `ProgramState`, avoiding duplication of components that are
 * never expected to change (improving performance and memory footprint). Note,
 * this could make mutation-related bugs in VMs harder to track down (mutations
 * in later operations can create confusion in the "history" returned by
 * `vm.debug`), but the performance and memory benefits are worth the added
 * development and testing effort.
 * @param state - the state to clone
 * @param referenceOnlyKeys - keys which should be copied entirely by reference
 * @param shallowCloneArrayKeys - keys to arrays which should be shallow cloned
 */
export const partiallyCloneProgramState = <
  ProgramState extends
    AuthenticationProgramStateMinimum = AuthenticationProgramStateCommon,
>(
  state: ProgramState,
  referenceOnlyKeys = ['instructions', 'program'],
  shallowCloneArrayKeys = [
    'alternateStack',
    'controlStack',
    'signedMessages',
    'stack',
  ],
) =>
  Object.fromEntries(
    Object.entries(state).map(([key, value]) =>
      referenceOnlyKeys.includes(key)
        ? [key, value]
        : shallowCloneArrayKeys.includes(key)
          ? [key, (value as unknown[]).slice()]
          : [key, structuredClone(value)],
    ),
  ) as ProgramState;

/**
 * Given a `ProgramState`, clone and return a {@link MaskedProgramState} from
 * which `instructions` and `program` are excluded.
 * @param state - the `ProgramState` to mask
 */
export const maskStaticProgramState = <
  ProgramState extends
    AuthenticationProgramStateMinimum = AuthenticationProgramStateCommon,
>(
  state: ProgramState,
) => {
  const maskedState = partiallyCloneProgramState(state) as unknown as Partial<
    AuthenticationProgramStateMinimum &
      AuthenticationProgramStateTransactionContext &
      MaskedProgramState<AuthenticationProgramStateMinimum>
  >;
  // eslint-disable-next-line functional/no-expression-statements, functional/immutable-data
  delete maskedState.instructions;
  // eslint-disable-next-line functional/no-expression-statements, functional/immutable-data
  delete maskedState.program;
  // eslint-disable-next-line functional/no-expression-statements, functional/immutable-data
  maskedState.instruction = state.instructions[state.ip];
  return maskedState as MaskedProgramState<ProgramState>;
};

/**
 * Create an {@link AuthenticationVirtualMachine} to evaluate authentication
 * programs constructed from operations in the `instructionSet`.
 * @param instructionSet - an {@link InstructionSet}
 */
export const createVirtualMachine = <
  ResolvedTransaction = ResolvedTransactionCommon,
  AuthenticationProgram = AuthenticationProgramCommon,
  ProgramState extends
    AuthenticationProgramStateMinimum = AuthenticationProgramStateCommon,
>(
  instructionSet: InstructionSet<
    ResolvedTransaction,
    AuthenticationProgram,
    ProgramState
  >,
): AuthenticationVirtualMachine<
  ResolvedTransaction,
  AuthenticationProgram,
  ProgramState
> => {
  const availableOpcodes = 256;
  const operators = range(availableOpcodes).map(
    (codepoint) =>
      instructionSet.operations[codepoint] ?? instructionSet.undefined,
  );

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const getCodepoint = (state: ProgramState) => state.instructions[state.ip]!;

  const after = (state: ProgramState) => {
    // eslint-disable-next-line functional/no-expression-statements, functional/immutable-data
    state.ip += 1;
    // eslint-disable-next-line functional/no-expression-statements, functional/immutable-data
    state.metrics.evaluatedInstructionCount += 1;
    return state;
  };

  const getOperation = (state: ProgramState) =>
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    operators[getCodepoint(state).opcode]!;

  const noOp = ((state) => state) as Operation<ProgramState>;
  const stateEvery = instructionSet.every ?? noOp;

  const stateStepMutate = (state: ProgramState) => {
    const operator = getOperation(state);
    return after(stateEvery(operator(state)));
  };

  const stateContinue = instructionSet.continue;

  /**
   * When we get real tail call optimization, this can be replaced
   * with recursion.
   */
  const untilComplete = (
    state: ProgramState,
    stepFunction: (state: ProgramState) => ProgramState,
  ) => {
    // eslint-disable-next-line functional/no-loop-statements
    while (stateContinue(state)) {
      // eslint-disable-next-line functional/no-expression-statements, no-param-reassign
      state = stepFunction(state);
    }
    return state;
  };

  const initialize =
    instructionSet.initialize ??
    ((_program) =>
      ({ metrics: { evaluatedInstructionCount: 0 } }) as Partial<ProgramState>);
  const stateClone = partiallyCloneProgramState;
  const { success } = instructionSet;

  const stateEvaluate = (state: ProgramState) =>
    untilComplete(stateClone(state), stateStepMutate);

  const stateDebugStep = (state: ProgramState) => {
    const operator = getOperation(state);
    return after(stateEvery(operator(stateClone(state))));
  };

  const stateDebug = (state: ProgramState): ProgramState[] => {
    const trace: ProgramState[] = [];
    // eslint-disable-next-line functional/no-expression-statements, functional/immutable-data
    trace.push(state);
    // eslint-disable-next-line functional/no-expression-statements
    untilComplete(state, (currentState: ProgramState) => {
      const nextState = stateDebugStep(currentState);
      // eslint-disable-next-line functional/no-expression-statements, functional/immutable-data
      trace.push(nextState);
      return nextState;
    });
    return trace;
  };

  const stateStep = (state: ProgramState) => stateStepMutate(stateClone(state));

  const evaluate = (
    program: AuthenticationProgram,
    { stateOverride }: { stateOverride?: Partial<ProgramState> } = {},
  ) =>
    instructionSet.evaluate(program, {
      stateEvaluate,
      stateInitialize: initialize,
      stateOverride,
    });

  const debug = <MaskProgramState extends boolean = false>(
    program: AuthenticationProgram,
    {
      stateOverride,
      maskProgramState = false as MaskProgramState,
    }: {
      maskProgramState?: MaskProgramState;
      stateOverride?: Partial<ProgramState>;
    } = {},
  ) => {
    const results: ProgramState[] = [];
    const proxyDebug = (state: ProgramState) => {
      const debugResult = stateDebug(state);
      // eslint-disable-next-line functional/no-expression-statements, functional/immutable-data
      results.push(...debugResult);
      return debugResult[debugResult.length - 1] ?? state;
    };
    const finalResult = instructionSet.evaluate(program, {
      stateEvaluate: proxyDebug,
      stateInitialize: initialize,
      stateOverride,
    });
    const trace = [...results, finalResult];
    return (
      maskProgramState ? trace.map(maskStaticProgramState) : trace
    ) as (MaskProgramState extends true
      ? MaskedProgramState<ProgramState>
      : ProgramState)[];
  };

  const verify = (resolvedTransaction: ResolvedTransaction) =>
    instructionSet.verify(resolvedTransaction, {
      evaluate,
      initialize,
      success,
    });

  return {
    debug,
    evaluate,
    stateClone,
    stateContinue,
    stateDebug,
    stateEvaluate,
    stateInitialize: initialize,
    stateStep,
    stateStepMutate,
    stateSuccess: success,
    verify,
  };
};

export const createAuthenticationVirtualMachine = createVirtualMachine;
