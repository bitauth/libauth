import { flattenBinArray } from '../../format/hex';
import {
  AuthenticationInstruction,
  ParsedAuthenticationInstruction,
  ParsedAuthenticationInstructionMalformed,
} from '../../vm/instruction-sets/instruction-sets-types';
import {
  authenticationInstructionIsMalformed,
  parseBytecode,
  serializeParsedAuthenticationInstructionMalformed,
} from '../../vm/instruction-sets/instruction-sets-utils';
import { AuthenticationProgramStateExecutionStack } from '../../vm/vm';
import { createCompilerCommonSynchronous } from '../compiler';

import {
  CompilationError,
  CompilationErrorRecoverable,
  EvaluationSample,
  Range,
  ResolvedScript,
  ResolvedSegmentLiteralType,
  ScriptReductionTraceChildNode,
  ScriptReductionTraceScriptNode,
} from './language-types';

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
  } as Range
) => {
  const minimumRangesToMerge = 2;
  const unsortedMerged =
    ranges.length < minimumRangesToMerge
      ? ranges.length === 1
        ? ranges[0]
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
          ranges[0]
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
  exclusive = true
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
 * Perform a simplified compilation on a Bitauth Templating Language (BTL)
 * script containing only hex literals, bigint literals, UTF8 literals, and push
 * statements. Scripts may not contain variables/operations, evaluations, or
 * opcode identifiers (use hex literals instead).
 *
 * This is useful for accepting complex user input in advanced interfaces,
 * especially for `AddressData` and `WalletData`.
 *
 * Returns the compiled bytecode as a `Uint8Array`, or throws an error message.
 *
 * @param script - a simple BTL script containing no variables or evaluations
 */
export const compileBtl = (script: string) => {
  const result = createCompilerCommonSynchronous({
    scripts: { script },
  }).generateBytecode('script', {});
  if (result.success) {
    return result.bytecode;
  }
  return `BTL compilation error:${result.errors.reduce(
    (all, { error, range }) =>
      `${all} [${range.startLineNumber}, ${range.startColumn}]: ${error}`,
    ''
  )}`;
};

/**
 * Extract a list of the errors which occurred while resolving a script.
 *
 * @param resolvedScript - the result of `resolveScript` from which to extract
 * errors
 */
export const getResolutionErrors = (
  resolvedScript: ResolvedScript
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
 * problems with the authentication template or wallet implementation).
 *
 * Note, errors are only recoverable if the "entity ownership" of each missing
 * identifier is known (specified in `CompilationData`'s `entityOwnership`).
 *
 * @param errors - an array of compilation errors
 */
export const allErrorsAreRecoverable = (
  errors: CompilationError[]
): errors is CompilationErrorRecoverable[] =>
  errors.every(
    (error) => 'missingIdentifier' in error && 'owningEntity' in error
  );

/**
 * A single resolution for a `ResolvedSegment`. The `variable`, `script`, or
 * `opcode` property contains the full identifier which resolved to `bytecode`.
 */
export interface BtlResolution {
  bytecode: Uint8Array;
  type: 'variable' | 'script' | 'opcode' | ResolvedSegmentLiteralType;
  text: string;
}

/**
 * Get an array of all resolutions used in a `ResolvedScript`.
 * @param resolvedScript - the resolved script to search
 */
export const extractBytecodeResolutions = (
  resolvedScript: ResolvedScript
): BtlResolution[] =>
  // eslint-disable-next-line complexity
  resolvedScript.reduce<BtlResolution[]>((all, segment) => {
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
            ...extractBytecodeResolutions(segment.source),
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
 * Extract an object mapping the variable identifiers used in a `ResolvedScript`
 * to their resolved bytecode.
 *
 * @param resolvedScript - the resolved script to search
 */
export const extractResolvedVariableBytecodeMap = (
  resolvedScript: ResolvedScript
) =>
  extractBytecodeResolutions(resolvedScript).reduce<{
    [fullIdentifier: string]: Uint8Array;
  }>(
    (all, resolution) =>
      resolution.type === 'variable'
        ? { ...all, [resolution.text]: resolution.bytecode }
        : all,
    {}
  );

/**
 * Format a list of `CompilationError`s into a single string, with an error
 * start position following each error. E.g. for line 1, column 2:
 * `The error message. [1, 2]`
 *
 * Errors are separated with the `separator`, which defaults to `; `, e.g.:
 * `The first error message. [1, 2]; The second error message. [3, 4]`
 *
 * @param errors - an array of compilation errors
 * @param separator - the characters with which to join the formatted errors.
 */
export const stringifyErrors = (
  errors: CompilationError[],
  separator = '; '
) => {
  return `${errors
    .map(
      (error) =>
        `[${error.range.startLineNumber}, ${error.range.startColumn}] ${error.error}`
    )
    .join(separator)}`;
};

export interface SampleExtractionResult<ProgramState, Opcodes = number> {
  /**
   * The samples successfully extracted from the provided `nodes` and `trace`.
   *
   * In a successful evaluation, one sample will be produced for each state in
   * `trace` with the exception of the last state (the evaluation result) which
   * will be returned in `unmatchedStates`.
   *
   * In an unsuccessful evaluation, the `trace` states will be exhausted before
   * all `nodes` have been matched. In this case, all matched samples are
   * returned, and the final state (the evaluation result) is dropped. This can
   * be detected by checking if the length of `unmatchedStates` is `0`.
   */
  samples: EvaluationSample<ProgramState, Opcodes>[];
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
}

/**
 * Extract a set of "evaluation samples" from the result of a BTL compilation
 * and a matching debug trace (from `vm.debug`), pairing program states with the
 * source ranges which produced them – like a "source map" for complete
 * evaluations. This is useful for omniscient debuggers like Bitauth IDE.
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
 * most applications should use `extractEvaluationSamplesRecursive` instead.
 *
 * @remarks
 * This method incrementally concatenates the reduced bytecode from each node,
 * parsing the result into evaluation samples.
 *
 * Each node can contain only a portion of an instruction (like a long push
 * operation), or it can contain multiple instructions (like a long hex literal
 * representing a string of bytecode or an evaluation which is not wrapped by a
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
 * known state" to be displayed for the sample which caused evaluation to halt.)
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
 * or more adjacent nodes. Samples may overlap in the range of a node which is
 * responsible for both ending a previous sample and beginning a new sample.
 * (Though, only 2 samples can overlap. If a node is responsible for more than 2
 * instructions, the second sample includes `internalStates` for instructions
 * which occur before the end of the second sample.)
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
 * expects the `bytecode` provided by nodes to be parsable by `parseBytecode`.
 *
 * @param evaluationRange - the range of the script node which was evaluated to
 * produce the `trace`
 * @param nodes - an array of reduced nodes to parse
 * @param trace - the `vm.debug` result to map to these nodes
 */
// eslint-disable-next-line complexity
export const extractEvaluationSamples = <ProgramState, Opcodes = number>({
  evaluationRange,
  nodes,
  trace,
}: {
  evaluationRange: Range;
  nodes: ScriptReductionTraceScriptNode<ProgramState>['script'];
  trace: ProgramState[];
}): SampleExtractionResult<ProgramState, Opcodes> => {
  const traceWithoutFinalState =
    trace.length > 1 ? trace.slice(0, -1) : trace.slice();
  if (traceWithoutFinalState.length === 0) {
    return {
      samples: [],
      unmatchedStates: [],
    };
  }
  const samples: EvaluationSample<ProgramState, Opcodes>[] = [
    {
      evaluationRange,
      internalStates: [],
      range: {
        endColumn: evaluationRange.startColumn,
        endLineNumber: evaluationRange.startLineNumber,
        startColumn: evaluationRange.startColumn,
        startLineNumber: evaluationRange.startLineNumber,
      },
      state: traceWithoutFinalState[0],
    },
  ];

  // eslint-disable-next-line functional/no-let
  let nextState = 1;
  // eslint-disable-next-line functional/no-let
  let nextNode = 0;
  // eslint-disable-next-line functional/no-let, @typescript-eslint/init-declarations
  let incomplete: { bytecode: Uint8Array; range: Range } | undefined;
  // eslint-disable-next-line functional/no-loop-statement
  while (nextState < traceWithoutFinalState.length && nextNode < nodes.length) {
    const currentNode = nodes[nextNode];
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

    const parsed = parseBytecode<Opcodes>(mergedBytecode);

    const hasNonMalformedInstructions =
      parsed.length !== 0 && !('malformed' in parsed[0]);

    if (hasNonMalformedInstructions) {
      const lastInstruction = parsed[parsed.length - 1];
      const validInstructions = (authenticationInstructionIsMalformed(
        lastInstruction
      )
        ? parsed.slice(0, parsed.length - 1)
        : parsed) as AuthenticationInstruction<Opcodes>[];
      const firstUnmatchedStateIndex = nextState + validInstructions.length;
      const matchingStates = traceWithoutFinalState.slice(
        nextState,
        firstUnmatchedStateIndex
      );
      const pairedStates = validInstructions.map((instruction, index) => ({
        instruction,
        state: matchingStates[index] as ProgramState | undefined,
      }));

      /**
       * Guaranteed to have a defined `state` (or the loop would have exited).
       */
      const firstPairedState = pairedStates[0] as {
        instruction: ParsedAuthenticationInstruction<Opcodes>;
        state: ProgramState;
      };

      const closesCurrentlyOpenSample = incomplete !== undefined;
      // eslint-disable-next-line functional/no-conditional-statement
      if (closesCurrentlyOpenSample) {
        // eslint-disable-next-line functional/no-expression-statement, functional/immutable-data
        samples.push({
          evaluationRange,
          instruction: firstPairedState.instruction,
          internalStates: [],
          range: mergedRange,
          state: firstPairedState.state,
        });
      }

      const firstUndefinedStateIndex = pairedStates.findIndex(
        ({ state }) => state === undefined
      );
      const sampleHasError = firstUndefinedStateIndex !== -1;
      const sampleClosingIndex = sampleHasError
        ? firstUndefinedStateIndex - 1
        : pairedStates.length - 1;

      const closesASecondSample =
        !closesCurrentlyOpenSample || sampleClosingIndex > 0;
      // eslint-disable-next-line functional/no-conditional-statement
      if (closesASecondSample) {
        const finalState = pairedStates[sampleClosingIndex] as {
          instruction: ParsedAuthenticationInstruction<Opcodes>;
          state: ProgramState;
        };
        const secondSamplePairsBegin = closesCurrentlyOpenSample ? 1 : 0;
        const internalStates = pairedStates.slice(
          secondSamplePairsBegin,
          sampleClosingIndex
        ) as {
          instruction: ParsedAuthenticationInstruction<Opcodes>;
          state: ProgramState;
        }[];
        // eslint-disable-next-line functional/no-expression-statement, functional/immutable-data
        samples.push({
          evaluationRange,
          instruction: finalState.instruction,
          internalStates,
          range: currentNode.range,
          state: finalState.state,
        });
      }

      // eslint-disable-next-line functional/no-expression-statement
      nextState = firstUnmatchedStateIndex;
      // eslint-disable-next-line functional/no-conditional-statement
      if (authenticationInstructionIsMalformed(lastInstruction)) {
        // eslint-disable-next-line functional/no-expression-statement
        incomplete = {
          bytecode: serializeParsedAuthenticationInstructionMalformed(
            lastInstruction
          ),
          range: currentNode.range,
        };
        // eslint-disable-next-line functional/no-conditional-statement
      } else {
        // eslint-disable-next-line functional/no-expression-statement
        incomplete = undefined;
      }
      // eslint-disable-next-line functional/no-conditional-statement
    } else {
      const lastInstruction = parsed[parsed.length - 1] as
        | ParsedAuthenticationInstructionMalformed<Opcodes>
        | undefined;

      // eslint-disable-next-line functional/no-expression-statement
      incomplete =
        lastInstruction === undefined
          ? undefined
          : {
              bytecode: serializeParsedAuthenticationInstructionMalformed(
                lastInstruction
              ),
              range: mergedRange,
            };
    }
    // eslint-disable-next-line functional/no-expression-statement
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
 * Similar to `extractEvaluationSamples`, but recursively extracts samples from
 * evaluations within the provided array of nodes.
 *
 * Because BTL evaluations are fully self-contained, there should never be
 * unmatched states from evaluations within a script reduction trace tree. (For
 * this reason, this method does not return the `unmatchedStates` from nested
 * evaluations.)
 *
 * Returned samples are ordered by the ending position (line and column) of
 * their range. Samples from BTL evaluations which occur within an outer
 * evaluation appear before their parent sample (which uses their result).
 *
 * @param evaluationRange - the range of the script node which was evaluated to
 * produce the `trace`
 * @param nodes - an array of reduced nodes to parse
 * @param trace - the `vm.debug` result to map to these nodes
 */
export const extractEvaluationSamplesRecursive = <
  ProgramState,
  Opcodes = number
>({
  evaluationRange,
  nodes,
  trace,
}: {
  evaluationRange: Range;
  nodes: ScriptReductionTraceScriptNode<ProgramState>['script'];
  trace: ProgramState[];
}): SampleExtractionResult<ProgramState, Opcodes> => {
  const extractEvaluations = (
    node: ScriptReductionTraceChildNode<ProgramState>,
    depth = 1
  ): EvaluationSample<ProgramState, Opcodes>[] => {
    if ('push' in node) {
      return node.push.script.reduce<EvaluationSample<ProgramState, Opcodes>[]>(
        (all, childNode) => [...all, ...extractEvaluations(childNode, depth)],
        []
      );
    }
    if ('source' in node) {
      const childSamples = node.source.script.reduce<
        EvaluationSample<ProgramState, Opcodes>[]
      >(
        (all, childNode) => [
          ...all,
          ...extractEvaluations(childNode, depth + 1),
        ],
        []
      );
      const traceWithoutUnlockingPhase = node.trace.slice(1);
      const evaluationBeginToken = '$(';
      const evaluationEndToken = ')';
      const extracted = extractEvaluationSamples<ProgramState, Opcodes>({
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

  const { samples, unmatchedStates } = extractEvaluationSamples<
    ProgramState,
    Opcodes
  >({
    evaluationRange,
    nodes,
    trace,
  });

  const childSamples = nodes.reduce<EvaluationSample<ProgramState, Opcodes>[]>(
    (all, node) => [...all, ...extractEvaluations(node)],
    []
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

const stateIsExecuting = (state: AuthenticationProgramStateExecutionStack) =>
  state.executionStack.every((item) => item);

/**
 * Extract an array of ranges which were unused by an evaluation. This is useful
 * in development tooling for fading out or hiding code which is unimportant to
 * the current evaluation being tested.
 *
 * @remarks
 * Only ranges which are guaranteed to be unimportant to an evaluation are
 * returned by this method. These ranges are extracted from samples which:
 * - are preceded by a sample which ends with execution disabled (e.g. an
 * unsuccessful `OP_IF`)
 * - end with execution disabled, and
 * - contain no `internalStates` which enable execution.
 *
 * Note, internal states which temporarily re-enable and then disable execution
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
  ProgramState extends AuthenticationProgramStateExecutionStack,
  Opcodes = number
>(
  samples: EvaluationSample<ProgramState, Opcodes>[],
  evaluationBegins = '1,1'
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
        precedingStateSkipsByEvaluation[currentEvaluationStartLineAndColumn];
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
    }
  );

  const canHaveContainedRanges = 2;
  const containedRangesExcluded =
    reduced.unexecutedRanges.length < canHaveContainedRanges
      ? reduced.unexecutedRanges
      : reduced.unexecutedRanges.slice(0, -1).reduceRight<Range[]>(
          (all, range) => {
            if (containsRange(all[0], range)) {
              return all;
            }
            return [range, ...all];
          },
          [reduced.unexecutedRanges[reduced.unexecutedRanges.length - 1]]
        );
  return containedRangesExcluded;
};
