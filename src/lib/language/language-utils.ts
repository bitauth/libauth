import { binToHex, flattenBinArray } from '../format/format.js';
import type {
  AuthenticationInstruction,
  AuthenticationInstructionMalformed,
  AuthenticationInstructionMaybeMalformed,
  AuthenticationProgramStateAlternateStack,
  AuthenticationProgramStateControlStack,
  AuthenticationProgramStateError,
  AuthenticationProgramStateMinimum,
  AuthenticationProgramStateStack,
  CompilationError,
  CompilationErrorRecoverable,
  EvaluationSample,
  Range,
  ResolvedScript,
  ResolvedSegmentLiteralType,
  ScriptReductionTraceChildNode,
  ScriptReductionTraceScriptNode,
} from '../lib.js';
import {
  authenticationInstructionIsMalformed,
  decodeAuthenticationInstructions,
  encodeAuthenticationInstructionMalformed,
  OpcodesBCHCHIPs,
  vmNumberToBigInt,
} from '../vm/vm.js';

const pluckStartPosition = (range: Range) => ({
  startColumn: range.startColumn,
  startLineNumber: range.startLineNumber,
});

const pluckEndPosition = (range: Range) => ({
  endColumn: range.endColumn,
  endLineNumber: range.endLineNumber,
});

/**
 * Combine an array of `Range`s into a single larger `Range`.
 *
 * @param ranges - an array of `Range`s
 * @param parentRange - the range to assume if `ranges` is an empty array
 */
export const mergeRanges = (
  ranges: Range[],
  parentRange = {
    endColumn: 0,
    endLineNumber: 0,
    startColumn: 0,
    startLineNumber: 0,
  } as Range,
) => {
  const minimumRangesToMerge = 2;
  const unsortedMerged =
    ranges.length < minimumRangesToMerge
      ? ranges.length === 1
        ? // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          ranges[0]!
        : parentRange
      : ranges.reduce<Range>(
          // eslint-disable-next-line complexity
          (merged, range) => ({
            ...(range.endLineNumber > merged.endLineNumber
              ? pluckEndPosition(range)
              : range.endLineNumber === merged.endLineNumber &&
                  range.endColumn > merged.endColumn
                ? pluckEndPosition(range)
                : pluckEndPosition(merged)),
            ...(range.startLineNumber < merged.startLineNumber
              ? pluckStartPosition(range)
              : range.startLineNumber === merged.startLineNumber &&
                  range.startColumn < merged.startColumn
                ? pluckStartPosition(range)
                : pluckStartPosition(merged)),
          }),
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          ranges[0]!,
        );
  return {
    ...pluckEndPosition(unsortedMerged),
    ...pluckStartPosition(unsortedMerged),
  };
};

/**
 * Returns true if the `outerRange` fully contains the `innerRange`, otherwise,
 * `false`.
 *
 * @param outerRange - the bounds of the outer range
 * @param innerRange - the inner range to test
 * @param exclusive - disallow the `innerRange` from overlapping the
 * `outerRange` (such that the outer start and end columns may not be equal) –
 * defaults to `true`
 */
// eslint-disable-next-line complexity
export const containsRange = (
  outerRange: Range,
  innerRange: Range,
  exclusive = true,
) => {
  const startsAfter =
    outerRange.startLineNumber < innerRange.startLineNumber
      ? true
      : outerRange.startLineNumber === innerRange.startLineNumber
        ? exclusive
          ? outerRange.startColumn < innerRange.startColumn
          : outerRange.startColumn <= innerRange.startColumn
        : false;
  const endsBefore =
    outerRange.endLineNumber > innerRange.endLineNumber
      ? true
      : outerRange.endLineNumber === innerRange.endLineNumber
        ? exclusive
          ? outerRange.endColumn > innerRange.endColumn
          : outerRange.endColumn >= innerRange.endColumn
        : false;
  return startsAfter && endsBefore;
};

/**
 * Extract a list of the errors that occurred while resolving a script.
 *
 * @param resolvedScript - the result of {@link resolveScript} from which to
 * extract errors
 */
export const getResolutionErrors = <ProgramState>(
  resolvedScript: ResolvedScript<ProgramState>,
): CompilationError[] =>
  resolvedScript.reduce<CompilationError[]>((errors, segment) => {
    switch (segment.type) {
      case 'error':
        return [
          ...errors,
          {
            error: segment.value,
            ...(segment.missingIdentifier === undefined
              ? {}
              : {
                  missingIdentifier: segment.missingIdentifier,
                  owningEntity: segment.owningEntity,
                }),
            range: segment.range,
          },
        ];
      case 'push':
      case 'evaluation':
        return [...errors, ...getResolutionErrors(segment.value)];
      default:
        return errors;
    }
  }, []);

/**
 * Verify that every error in the provided array can be resolved by providing
 * additional variables in the compilation data (rather than deeper issues, like
 * problems with the wallet template or wallet implementation).
 *
 * Note, errors are only recoverable if the "entity ownership" of each missing
 * identifier is known (specified in `CompilationData`'s `entityOwnership`).
 *
 * @param errors - an array of compilation errors
 */
export const allErrorsAreRecoverable = (
  errors: CompilationError[],
): errors is CompilationErrorRecoverable[] =>
  errors.every(
    (error) => 'missingIdentifier' in error && 'owningEntity' in error,
  );

/**
 * A single resolution for a {@link ResolvedSegment}. The `variable`, `script`,
 * or `opcode` property contains the full identifier that resolved
 * to `bytecode`.
 */
export type CashAssemblyResolution = {
  bytecode: Uint8Array;
  type: ResolvedSegmentLiteralType | 'opcode' | 'script' | 'variable';
  text: string;
};

/**
 * Get an array of all resolutions used in a {@link ResolvedScript}.
 * @param resolvedScript - the resolved script to search
 */
export const extractBytecodeResolutions = <ProgramState>(
  resolvedScript: ResolvedScript<ProgramState>,
): CashAssemblyResolution[] =>
  // eslint-disable-next-line complexity
  resolvedScript.reduce<CashAssemblyResolution[]>((all, segment) => {
    switch (segment.type) {
      case 'push':
      case 'evaluation':
        return [...all, ...extractBytecodeResolutions(segment.value)];
      case 'bytecode':
        if ('variable' in segment) {
          return [
            ...all,
            {
              bytecode: segment.value,
              text: segment.variable,
              type: 'variable',
            },
          ];
        }
        if ('script' in segment) {
          return [
            ...all,
            ...extractBytecodeResolutions(segment.source.resolve),
            {
              bytecode: segment.value,
              text: segment.script,
              type: 'script',
            },
          ];
        }
        if ('opcode' in segment) {
          return [
            ...all,
            {
              bytecode: segment.value,
              text: segment.opcode,
              type: 'opcode',
            },
          ];
        }
        return [
          ...all,
          {
            bytecode: segment.value,
            text: segment.literal,
            type: segment.literalType,
          },
        ];
      default:
        return all;
    }
  }, []);

/**
 * Extract an object mapping the variable identifiers used in a
 * {@link ResolvedScript} to their resolved bytecode.
 *
 * @param resolvedScript - the resolved script to search
 */
export const extractResolvedVariableBytecodeMap = <ProgramState>(
  resolvedScript: ResolvedScript<ProgramState>,
) =>
  extractBytecodeResolutions(resolvedScript).reduce<{
    [fullIdentifier: string]: Uint8Array;
  }>(
    (all, resolution) =>
      resolution.type === 'variable'
        ? { ...all, [resolution.text]: resolution.bytecode }
        : all,
    {},
  );

/**
 * Format a list of {@link CompilationError}s into a single string, with an
 * error start position following each error. E.g. for line 1, column 2:
 * `The error message. [1, 2]`
 *
 * Errors are separated with the `separator`, which defaults to `; `, e.g.:
 * `The first error message. [1, 2]; The second error message. [3, 4]`
 *
 * @param errors - an array of compilation errors
 * @param separator - the characters with which to join the formatted errors.
 */
export const stringifyErrors = (errors: CompilationError[], separator = '; ') =>
  errors
    .map(
      (error) =>
        `[${error.range.startLineNumber}, ${error.range.startColumn}] ${error.error}`,
    )
    .join(separator);

export type SampleExtractionResult<ProgramState> = {
  /**
   * The samples successfully extracted from the provided `nodes` and `trace`.
   *
   * In a successful evaluation, one sample will be produced for each state in
   * `trace` with the exception of the last state (the evaluation result), which
   * will be returned in `unmatchedStates`.
   *
   * In an unsuccessful evaluation, the `trace` states will be exhausted before
   * all `nodes` have been matched. In this case, all matched samples are
   * returned, and the final state (the evaluation result) is dropped. This can
   * be detected by checking if the length of `unmatchedStates` is `0`.
   */
  samples: EvaluationSample<ProgramState>[];
  /**
   * If the provided `nodes` are exhausted before all states from `trace` have
   * been matched, the remaining "unmatched" states are returned. This is useful
   * for extracting samples for an evaluation involving two or more
   * compilations.
   *
   * In a successful evaluation, after samples have been extracted from each set
   * of `nodes`, the final `trace` state (the evaluation result) will be
   * returned in `unmatchedStates`.
   */
  unmatchedStates: ProgramState[];
};

/**
 * Extract a set of "evaluation samples" from the result of a CashAssembly
 * compilation and a matching debug trace (from `vm.debug`), pairing program
 * states with the source ranges that produced them – like a "source map" for
 * complete evaluations. This is useful for omniscient debuggers like
 * Bitauth IDE.
 *
 * Returns an array of samples and an array of unmatched program states
 * remaining if `nodes` doesn't contain enough instructions to consume all
 * program states provided in `trace`. Returned samples are ordered by the
 * ending position (line and column) of their range.
 *
 * If all program states are consumed before the available nodes are exhausted,
 * the remaining nodes are ignored (the produced samples end at the last
 * instruction for which a program state exists). This usually occurs when an
 * error halts evaluation before the end of the script. (Note: if this occurs,
 * the final trace state will not be used, as it is expected to be the
 * duplicated final result produced by `vm.debug`, and should not be matched
 * with the next instruction. The returned `unmatchedStates` will have a length
 * of `0`.)
 *
 * This method allows for samples to be extracted from a single evaluation;
 * most applications should use
 * {@link extractEvaluationSamplesRecursive} instead.
 *
 * @remarks
 * This method incrementally concatenates the reduced bytecode from each node,
 * parsing the result into evaluation samples.
 *
 * Each node can contain only a portion of an instruction (like a long push
 * operation), or it can contain multiple instructions (like a long hex literal
 * representing a string of bytecode or an evaluation that is not wrapped by a
 * push).
 *
 * If a node contains only a portion of an instruction, the bytecode from
 * additional nodes are concatenated (and ranges merged) until an instruction
 * can be created. If any bytecode remains after a sample has been created, the
 * next sample begins in the same range. (For this reason, it's possible that
 * samples overlap.)
 *
 * If a node contains more than one instruction, the intermediate states
 * produced before the final state for that sample are saved to the sample's
 * `intermediateStates` array.
 *
 * If the program states in `trace` are exhausted before the final instruction
 * in a sample (usually caused by an evaluation error), the last instruction
 * with a matching program state is used for the sample (with its program
 * state), and the unmatched instructions are ignored. (This allows the "last
 * known state" to be displayed for the sample that caused evaluation to halt.)
 *
 * ---
 *
 * For example, the following script demonstrates many of these cases:
 *
 * `0x00 0x01 0xab01 0xcd9300 $(OP_3 <0x00> OP_SWAP OP_CAT) 0x010203`
 *
 * Which compiles to `0x0001ab01cd93000003010203`, disassembled:
 *
 * `OP_0 OP_PUSHBYTES_1 0xab OP_PUSHBYTES_1 0xcd OP_ADD OP_0 OP_0 OP_PUSHBYTES_3 0x010203`
 *
 * In the script, there are 6 top-level nodes (identified below within `[]`):
 *
 * `[0x00] [0x01] [0xab01] [0xcd9300] [$(OP_3 <0x00> OP_SWAP OP_CAT)] [0x010203]`
 *
 * These nodes together encode 7 instructions, some within a single node, and
 * some split between several nodes. Below we substitute the evaluation for its
 * result `0x0003` to group instructions by `[]`:
 *
 * `[0x00] [0x01 0xab][01 0xcd][93][00] [0x00][03 0x010203]`
 *
 * The "resolution" of samples is limited to the range of single nodes: nodes
 * cannot always be introspected to determine where contained instructions begin
 * and end. For example, it is ambiguous which portions of the evaluation are
 * responsible for the initial `0x00` and which are responsible for the `0x03`.
 *
 * For this reason, the range of each sample is limited to the range(s) of one
 * or more adjacent nodes. Samples may overlap in the range of a node that is
 * responsible for both ending a previous sample and beginning a new sample.
 * (Though, only 2 samples can overlap. If a node is responsible for more than 2
 * instructions, the second sample includes `internalStates` for instructions
 * that occur before the end of the second sample.)
 *
 * In this case, there are 6 samples identified below within `[]`, where each
 * `[` is closed by the closest following `]` (no nesting):
 *
 * `[0x00] [0x01 [0xab01] [0xcd9300]] [[$(OP_3 <0x00> OP_SWAP OP_CAT)] 0x010203]`
 *
 * The ranges for each sample (in terms of nodes) are as follows:
 * - Sample 1: node 1
 * - Sample 2: node 2 + node 3
 * - Sample 3: node 3 + node 4
 * - Sample 4: node 4
 * - Sample 5: node 5
 * - Sample 6: node 5 + node 6
 *
 * Note that the following samples overlap:
 * - Sample 2 and Sample 3
 * - Sample 3 and Sample 4
 * - Sample 5 and Sample 6
 *
 * Finally, note that Sample 4 will have one internal state produced by the
 * `OP_ADD` instruction. Sample 4 then ends with the `OP_0` (`0x00`) instruction
 * at the end of the `0xcd9300` node.
 *
 * ---
 *
 * Note, this implementation relies on the expectation that `trace` begins with
 * the initial program state, contains a single program state per instruction,
 * and ends with the final program state (as produced by `vm.debug`). It also
 * expects the `bytecode` provided by nodes to be parsable by
 * {@link decodeAuthenticationInstructions}.
 */
// eslint-disable-next-line complexity
export const extractEvaluationSamples = <ProgramState>({
  evaluationRange,
  nodes,
  trace,
}: {
  /**
   * The range of the script node that was evaluated to produce the `trace`
   */
  evaluationRange: Range;
  /**
   * An array of reduced nodes to parse
   */
  nodes: ScriptReductionTraceScriptNode<ProgramState>['script'];
  /**
   * The `vm.debug` result to map to these nodes
   */
  trace: ProgramState[];
}): SampleExtractionResult<ProgramState> => {
  const traceWithoutFinalState =
    trace.length > 1 ? trace.slice(0, -1) : trace.slice();
  if (traceWithoutFinalState.length === 0) {
    return {
      samples: [],
      unmatchedStates: [],
    };
  }
  const samples: EvaluationSample<ProgramState>[] = [
    {
      evaluationRange,
      internalStates: [],
      range: {
        endColumn: evaluationRange.startColumn,
        endLineNumber: evaluationRange.startLineNumber,
        startColumn: evaluationRange.startColumn,
        startLineNumber: evaluationRange.startLineNumber,
      },
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      state: traceWithoutFinalState[0]!,
    },
  ];

  // eslint-disable-next-line functional/no-let
  let nextState = 1;
  // eslint-disable-next-line functional/no-let
  let nextNode = 0;
  // eslint-disable-next-line functional/no-let, @typescript-eslint/init-declarations
  let incomplete: { bytecode: Uint8Array; range: Range } | undefined;
  // eslint-disable-next-line functional/no-loop-statements
  while (nextState < traceWithoutFinalState.length && nextNode < nodes.length) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const currentNode = nodes[nextNode]!;
    const { mergedBytecode, mergedRange } =
      incomplete === undefined
        ? {
            mergedBytecode: currentNode.bytecode,
            mergedRange: currentNode.range,
          }
        : {
            mergedBytecode: flattenBinArray([
              incomplete.bytecode,
              currentNode.bytecode,
            ]),
            mergedRange: mergeRanges([incomplete.range, currentNode.range]),
          };

    const decoded = decodeAuthenticationInstructions(mergedBytecode);

    const [zeroth] = decoded;
    const hasNonMalformedInstructions =
      zeroth !== undefined && !('malformed' in zeroth);

    if (hasNonMalformedInstructions) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const lastInstruction = decoded[decoded.length - 1]!;
      const validInstructions: AuthenticationInstruction[] =
        authenticationInstructionIsMalformed(lastInstruction)
          ? decoded.slice(0, decoded.length - 1)
          : decoded;
      const firstUnmatchedStateIndex = nextState + validInstructions.length;
      const matchingStates = traceWithoutFinalState.slice(
        nextState,
        firstUnmatchedStateIndex,
      );
      const pairedStates = validInstructions.map((instruction, index) => ({
        instruction,
        state: matchingStates[index],
      }));

      /**
       * Guaranteed to have a defined `state` (or the loop would have exited).
       */
      const firstPairedState = pairedStates[0] as {
        instruction: AuthenticationInstructionMaybeMalformed;
        state: ProgramState;
      };

      const closesCurrentlyOpenSample = incomplete !== undefined;
      // eslint-disable-next-line functional/no-conditional-statements
      if (closesCurrentlyOpenSample) {
        // eslint-disable-next-line functional/no-expression-statements, functional/immutable-data
        samples.push({
          evaluationRange,
          instruction: firstPairedState.instruction,
          internalStates: [],
          range: mergedRange,
          state: firstPairedState.state,
        });
      }

      const firstUndefinedStateIndex = pairedStates.findIndex(
        ({ state }) => state === undefined,
      );
      const sampleHasError = firstUndefinedStateIndex !== -1;
      const sampleClosingIndex = sampleHasError
        ? firstUndefinedStateIndex - 1
        : pairedStates.length - 1;

      const closesASecondSample =
        !closesCurrentlyOpenSample || sampleClosingIndex > 0;
      // eslint-disable-next-line functional/no-conditional-statements
      if (closesASecondSample) {
        const finalState = pairedStates[sampleClosingIndex] as {
          instruction: AuthenticationInstructionMaybeMalformed;
          state: ProgramState;
        };
        const secondSamplePairsBegin = closesCurrentlyOpenSample ? 1 : 0;
        const internalStates = pairedStates.slice(
          secondSamplePairsBegin,
          sampleClosingIndex,
        ) as {
          instruction: AuthenticationInstructionMaybeMalformed;
          state: ProgramState;
        }[];
        // eslint-disable-next-line functional/no-expression-statements, functional/immutable-data
        samples.push({
          evaluationRange,
          instruction: finalState.instruction,
          internalStates,
          range: currentNode.range,
          state: finalState.state,
        });
      }

      // eslint-disable-next-line functional/no-expression-statements
      nextState = firstUnmatchedStateIndex;
      // eslint-disable-next-line functional/no-conditional-statements
      if (authenticationInstructionIsMalformed(lastInstruction)) {
        // eslint-disable-next-line functional/no-expression-statements
        incomplete = {
          bytecode: encodeAuthenticationInstructionMalformed(lastInstruction),
          range: currentNode.range,
        };
        // eslint-disable-next-line functional/no-conditional-statements
      } else {
        // eslint-disable-next-line functional/no-expression-statements
        incomplete = undefined;
      }
      // eslint-disable-next-line functional/no-conditional-statements
    } else {
      const lastInstruction = decoded[decoded.length - 1] as
        | AuthenticationInstructionMalformed
        | undefined;

      // eslint-disable-next-line functional/no-expression-statements
      incomplete =
        lastInstruction === undefined
          ? undefined
          : {
              bytecode:
                encodeAuthenticationInstructionMalformed(lastInstruction),
              range: mergedRange,
            };
    }
    // eslint-disable-next-line functional/no-expression-statements
    nextNode += 1;
  }

  /**
   * Because we ran out of `trace` states before all `nodes` were matched, we
   * know an error occurred which halted evaluation. This error is indicated in
   * the result by returning an empty array of `unmatchedStates`. Successful
   * evaluations will always return at least one unmatched state: the final
   * "evaluation result" state produced by `vm.debug`.
   */
  const errorOccurred = nextNode < nodes.length;
  const unmatchedStates: ProgramState[] = errorOccurred
    ? []
    : trace.slice(nextState);

  return {
    samples,
    unmatchedStates,
  };
};

/**
 * Similar to {@link extractEvaluationSamples}, but recursively extracts samples
 * from evaluations within the provided array of nodes.
 *
 * Because CashAssembly evaluations are fully self-contained, there should never
 * be unmatched states from evaluations within a script reduction trace tree.
 * (For this reason, this method does not return the `unmatchedStates` from
 * nested evaluations.)
 *
 * Returned samples are ordered by the ending position (line and column) of
 * their range. Samples from CashAssembly evaluations that occur within an
 * outer evaluation appear before their parent sample (which uses their result).
 */
export const extractEvaluationSamplesRecursive = <ProgramState>({
  /**
   * The range of the script node that was evaluated to produce the `trace`
   */
  evaluationRange,
  /**
   * An array of reduced nodes to parse
   */
  nodes,
  /**
   * The `vm.debug` result to map to these nodes
   */
  trace,
}: {
  evaluationRange: Range;
  nodes: ScriptReductionTraceScriptNode<ProgramState>['script'];
  trace: ProgramState[];
}): SampleExtractionResult<ProgramState> => {
  const extractEvaluations = (
    node: ScriptReductionTraceChildNode<ProgramState>,
    depth = 1,
  ): EvaluationSample<ProgramState>[] => {
    if ('push' in node) {
      return node.push.script.reduce<EvaluationSample<ProgramState>[]>(
        (all, childNode) => [...all, ...extractEvaluations(childNode, depth)],
        [],
      );
    }
    if ('source' in node) {
      const childSamples = node.source.script.reduce<
        EvaluationSample<ProgramState>[]
      >(
        (all, childNode) => [
          ...all,
          ...extractEvaluations(childNode, depth + 1),
        ],
        [],
      );
      const traceWithoutUnlockingPhase = node.trace.slice(1);
      const evaluationBeginToken = '$(';
      const evaluationEndToken = ')';
      const extracted = extractEvaluationSamples<ProgramState>({
        evaluationRange: {
          endColumn: node.range.endColumn - evaluationEndToken.length,
          endLineNumber: node.range.endLineNumber,
          startColumn: node.range.startColumn + evaluationBeginToken.length,
          startLineNumber: node.range.startLineNumber,
        },
        nodes: node.source.script,
        trace: traceWithoutUnlockingPhase,
      });
      return [...extracted.samples, ...childSamples];
    }
    return [];
  };

  const { samples, unmatchedStates } = extractEvaluationSamples<ProgramState>({
    evaluationRange,
    nodes,
    trace,
  });

  const childSamples = nodes.reduce<EvaluationSample<ProgramState>[]>(
    (all, node) => [...all, ...extractEvaluations(node)],
    [],
  );

  const endingOrderedSamples = [...samples, ...childSamples].sort((a, b) => {
    const linesOrdered = a.range.endLineNumber - b.range.endLineNumber;
    return linesOrdered === 0
      ? a.range.endColumn - b.range.endColumn
      : linesOrdered;
  });

  return {
    samples: endingOrderedSamples,
    unmatchedStates,
  };
};

const stateIsExecuting = (
  state: AuthenticationProgramStateControlStack<boolean | number>,
) => state.controlStack.every((item) => item !== false);

/**
 * Extract an array of ranges that were unused by an evaluation. This is useful
 * in development tooling for fading out or hiding code that is unimportant to
 * the current evaluation being tested.
 *
 * @remarks
 * Only ranges that are guaranteed to be unimportant to an evaluation are
 * returned by this method. These ranges are extracted from samples that:
 * - are preceded by a sample that ends with execution disabled (e.g. an
 * unsuccessful `OP_IF`)
 * - end with execution disabled, and
 * - contain no `internalStates` that enable execution.
 *
 * Note, internal states that temporarily re-enable and then disable execution
 * again can still have an effect on the parent evaluation, so this method
 * conservatively excludes such samples. For example, the hex literal
 * `0x675167`, which encodes `OP_ELSE OP_1 OP_ELSE`, could begin and end with
 * states in which execution is disabled, yet a `1` is pushed to the stack
 * during the sample's evaluation. (Samples like this are unusual, and can
 * almost always be reformatted to clearly separate the executed and unexecuted
 * instructions.)
 *
 * @param samples - an array of samples ordered by the ending position (line and
 * column) of their range.
 * @param evaluationBegins - the line and column at which the initial sample's
 * evaluation range begins (where the preceding state is assumed to be
 * executing), defaults to `1,1`
 */
export const extractUnexecutedRanges = <
  ProgramState extends AuthenticationProgramStateControlStack<boolean | number>,
>(
  samples: EvaluationSample<ProgramState>[],
  evaluationBegins = '1,1',
) => {
  const reduced = samples.reduce<{
    precedingStateSkipsByEvaluation: {
      [evaluationStartLineAndColumn: string]: boolean;
    };
    unexecutedRanges: Range[];
  }>(
    (all, sample) => {
      const { precedingStateSkipsByEvaluation, unexecutedRanges } = all;
      const currentEvaluationStartLineAndColumn = `${sample.evaluationRange.startLineNumber},${sample.evaluationRange.startColumn}`;
      const precedingStateSkips =
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        precedingStateSkipsByEvaluation[currentEvaluationStartLineAndColumn]!;
      const endsWithSkip = !stateIsExecuting(sample.state);
      const sampleHasNoExecutedInstructions =
        endsWithSkip &&
        sample.internalStates.every((group) => !stateIsExecuting(group.state));
      if (precedingStateSkips && sampleHasNoExecutedInstructions) {
        return {
          precedingStateSkipsByEvaluation: {
            ...precedingStateSkipsByEvaluation,
            [currentEvaluationStartLineAndColumn]: true,
          },
          unexecutedRanges: [...unexecutedRanges, sample.range],
        };
      }
      return {
        precedingStateSkipsByEvaluation: {
          ...precedingStateSkipsByEvaluation,
          [currentEvaluationStartLineAndColumn]: endsWithSkip,
        },
        unexecutedRanges,
      };
    },
    {
      precedingStateSkipsByEvaluation: {
        [evaluationBegins]: false,
      },
      unexecutedRanges: [],
    },
  );

  const canHaveContainedRanges = 2;
  const containedRangesExcluded =
    reduced.unexecutedRanges.length < canHaveContainedRanges
      ? reduced.unexecutedRanges
      : reduced.unexecutedRanges.slice(0, -1).reduceRight<Range[]>(
          (all, range) => {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            if (containsRange(all[0]!, range)) {
              return all;
            }
            return [range, ...all];
          },
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          [reduced.unexecutedRanges[reduced.unexecutedRanges.length - 1]!],
        );
  return containedRangesExcluded;
};

/**
 * Given a stack, return a summary of the stack's contents, encoding valid VM
 * numbers as numbers, and all other stack items as hex literals.
 *
 * @param stack - a stack of Uint8Array values
 */
export const summarizeStack = (stack: Uint8Array[]) =>
  stack.map((item) => {
    const asNumber = vmNumberToBigInt(item);
    return `0x${binToHex(item)}${
      typeof asNumber === 'string' ? '' : `(${asNumber.toString()})`
    }`;
  });

/**
 * Given a debug trace (produced by {@link AuthenticationVirtualMachine.debug}),
 * return an array summarizing each step of the trace. Note, debug traces
 * include the full program state at the beginning of each evaluation step; the
 * summary produced by this method instead shows the resulting stacks after each
 * evaluation step.
 */
export const summarizeDebugTrace = <
  Trace extends (AuthenticationProgramStateAlternateStack &
    AuthenticationProgramStateControlStack<unknown> &
    AuthenticationProgramStateError &
    AuthenticationProgramStateMinimum &
    AuthenticationProgramStateStack)[],
>(
  trace: Trace,
) =>
  trace.reduce<
    {
      alternateStack: string[];
      error?: string;
      execute: boolean;
      instruction: AuthenticationInstruction | undefined;
      ip: number;
      stack: string[];
    }[]
  >(
    // eslint-disable-next-line @typescript-eslint/max-params
    (steps, state, stateIndex, states) => {
      const nextState = states[stateIndex + 1];
      return nextState === undefined
        ? steps
        : [
            ...steps,
            {
              alternateStack: summarizeStack(nextState.alternateStack),
              ...(nextState.error === undefined
                ? {}
                : { error: nextState.error }),
              execute:
                state.controlStack[state.controlStack.length - 1] !== false,
              instruction: state.instructions[state.ip],
              ip: state.ip,
              stack: summarizeStack(nextState.stack),
            },
          ];
    },
    [],
  );

/**
 * Return a string with the result of {@link summarizeDebugTrace} including one
 * step per line.
 *
 * @param summary - a summary produced by {@link summarizeDebugTrace}
 */
export const stringifyDebugTraceSummary = (
  summary: ReturnType<typeof summarizeDebugTrace>,
  {
    opcodes,
    padInstruction,
  }: {
    /**
     * An opcode enum, e.g. {@link OpcodesBCH}.
     */
    opcodes: { [opcode: number]: string };
    /**
     * The width of the instruction column.
     */
    padInstruction: number;
  } = {
    opcodes: OpcodesBCHCHIPs,
    padInstruction: 23,
  },
) =>
  summary
    .map(
      // eslint-disable-next-line complexity
      (line) =>
        `${(line.instruction === undefined
          ? '=>'
          : `${line.ip}. ${line.execute ? '' : '(skip)'}${
              opcodes[line.instruction.opcode] ??
              `OP_UNKNOWN${line.instruction.opcode}`
            }:`
        ).padEnd(padInstruction)} ${
          typeof line.error === 'string'
            ? line.error
            : `${line.stack.join(' ')}${
                line.alternateStack.length === 0
                  ? ''
                  : `| alt: ${line.alternateStack.join(' ')}`
              }`
        }`,
    )
    .join('\n');
