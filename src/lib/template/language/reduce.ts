import { flattenBinArray } from '../../format/format';
import { OpcodesCommon } from '../../vm/instruction-sets/common/opcodes';
import { encodeDataPush } from '../../vm/instruction-sets/instruction-sets';
import { AuthenticationInstruction } from '../../vm/instruction-sets/instruction-sets-types';
import {
  authenticationInstructionsAreNotMalformed,
  disassembleBytecode,
  parseBytecode,
} from '../../vm/instruction-sets/instruction-sets-utils';
import { MinimumProgramState, StackState } from '../../vm/state';
import { AuthenticationVirtualMachine } from '../../vm/virtual-machine';

import {
  ErrorInformation,
  EvaluationSample,
  EvaluationSampleValid,
  InstructionAggregation,
  InstructionAggregationError,
  InstructionAggregationSuccess,
  Range,
  ResolvedScript,
  SampledEvaluationError,
  SampledEvaluationSuccess,
  ScriptReductionTraceChildNode,
  ScriptReductionTraceContainerNode,
  ScriptReductionTraceNode,
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
  const unsortedMerged = ranges.reduce<Range>(
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
    (ranges[0] as Range | undefined) ?? parentRange
  );
  return {
    ...pluckEndPosition(unsortedMerged),
    ...pluckStartPosition(unsortedMerged),
  };
};

const emptyReductionTraceNode = (range: Range) => ({
  bytecode: Uint8Array.of(),
  range,
});

/**
 * Parse reduced nodes into groups of non-malformed instructions.
 *
 * @remarks
 * This method incrementally concatenates the reduced bytecode from each node,
 * parsing the result into arrays of `InstructionAggregation`s. Each node can
 * contain only a portion of an instruction (like a long push operation), or it
 * may contain multiple instructions (like a long hex literal representing a
 * string of bytecode).
 *
 * @param nodes - an array of reduced nodes to parse
 */
// eslint-disable-next-line complexity
export const aggregatedParseReductionTraceNodes = <Opcodes>(
  nodes: readonly ScriptReductionTraceNode[]
):
  | InstructionAggregationSuccess<Opcodes>
  | InstructionAggregationError<Opcodes> => {
  const aggregations: InstructionAggregation<Opcodes>[] = [];
  // eslint-disable-next-line functional/no-let
  let ip = 0;
  // eslint-disable-next-line functional/no-let, init-declarations
  let incomplete: { bytecode: Uint8Array; range: Range } | undefined;
  // eslint-disable-next-line functional/no-loop-statement
  for (const node of nodes) {
    const { bytecode, range } =
      incomplete === undefined
        ? { bytecode: node.bytecode, range: node.range }
        : {
            bytecode: flattenBinArray([incomplete.bytecode, node.bytecode]),
            range: mergeRanges([incomplete.range, node.range]),
          };
    // eslint-disable-next-line functional/no-expression-statement
    incomplete = undefined;
    const parsed = parseBytecode<Opcodes>(bytecode);
    // eslint-disable-next-line functional/no-conditional-statement
    if (parsed.length === 0) {
      // eslint-disable-next-line functional/no-expression-statement, functional/immutable-data
      aggregations.push({
        instructions: [],
        lastIp: ip,
        range,
      });
      // eslint-disable-next-line functional/no-conditional-statement
    } else if (authenticationInstructionsAreNotMalformed(parsed)) {
      // eslint-disable-next-line functional/no-expression-statement
      ip += parsed.length;
      // eslint-disable-next-line functional/no-expression-statement, functional/immutable-data
      aggregations.push({
        instructions: parsed,
        lastIp: ip,
        range,
      });
      // eslint-disable-next-line functional/no-conditional-statement
    } else {
      // eslint-disable-next-line functional/no-expression-statement
      incomplete = { bytecode, range };
    }
  }
  return {
    aggregations,
    success: true,
    ...(incomplete === undefined
      ? undefined
      : {
          remainingBytecode: incomplete.bytecode,
          remainingRange: incomplete.range,
          success: false,
        }),
  };
};

/**
 * Incrementally evaluate an array of `ScriptReductionTraceNode`s, returning a
 * trace of the evaluation and the resulting bytecode (the stack item remaining
 * at the end of the evaluation).
 *
 * @remarks
 * This method implements evaluations for Bitauth Templating Language (BTL). It
 * accepts the list of reduced nodes which occur inside the evaluation, and it
 * returns both the result of the evaluation and a set of "samples" – snapshots
 * of the evaluation after each instruction – for use in debugging.
 *
 * BTL evaluations must produce exactly one stack item, the contents of which
 * are then interpreted as bytecode. Evaluations which complete with more than
 * one item on the stack (or no items on the stack) result in a compilation
 * error.
 *
 * It is possible for BTL evaluations to produce no bytecode – an evaluation
 * which executes only `OP_0` will push an empty stack item (which is how `0` is
 * represented on the stack).
 *
 * @privateRemarks
 * This method creates an "evaluation plan" by reducing the aggregated
 * instructions into a list of "breakpoints" and an array of all instructions.
 * An initial `ProgramState` is created by passing the instructions to
 * `getState`, and the program state is fully evaluated using the `vm`'s
 * `stateDebug` method. For each breakpoint, a "sample" is returned including 1)
 * the range which generated the instruction(s) and 2) the program state
 * immediately following the evaluation of the instruction(s).
 *
 * Notably, errors for malformed instructions are emitted only after attempting
 * to evaluate the well-formed instructions. This is useful in IDEs to allow
 * most of the evaluations samples to still be returned for visualization, even
 * if the evaluation contains later errors.
 *
 * @param nodes - an array of reduced nodes – this must include at least one
 * node
 * @param vm - the `AuthenticationVirtualMachine` to use in the evaluation
 * @param createState - a method which should generate a new ProgramState given
 * an array of instructions
 * @param parentRange - the range of the parent node (returned as the range of
 * empty `node` arrays)
 */
// eslint-disable-next-line complexity
export const sampledEvaluateReductionTraceNodes = <
  Opcodes,
  ProgramState extends MinimumProgramState<Opcodes> &
    StackState & { error?: string },
  AuthenticationProgram
>({
  createState,
  nodes,
  parentRange,
  vm,
}: {
  nodes: ScriptReductionTraceNode[];
  vm: AuthenticationVirtualMachine<AuthenticationProgram, ProgramState>;
  createState: (
    instructions: AuthenticationInstruction<Opcodes>[]
  ) => ProgramState;
  parentRange: Range;
}):
  | SampledEvaluationSuccess<ProgramState>
  | SampledEvaluationError<ProgramState> => {
  const parsed = aggregatedParseReductionTraceNodes<Opcodes>(nodes);
  const nonEmptyAggregations = parsed.aggregations.filter(
    (aggregation) => aggregation.instructions.length > 0
  );
  const evaluationPlan = nonEmptyAggregations.reduce<{
    breakpoints: { ip: number; range: Range }[];
    instructions: AuthenticationInstruction<Opcodes>[];
  }>(
    (plan, aggregation) => {
      const instructions = [...plan.instructions, ...aggregation.instructions];
      return {
        breakpoints: [
          ...plan.breakpoints,
          { ip: aggregation.lastIp, range: aggregation.range },
        ],
        instructions,
      };
    },
    { breakpoints: [], instructions: [] }
  );

  if (evaluationPlan.breakpoints.length === 0) {
    return {
      bytecode: Uint8Array.of(),
      errors: [
        {
          error: `An evaluation must leave an item on the stack, but this evaluation contains no operations. To return an empty result, push an empty stack item ("OP_0").`,
          range: mergeRanges(
            nodes.map((node) => node.range),
            parentRange
          ),
        },
      ],
      samples: [],
      success: false,
    };
  }

  const trace = vm.stateDebug(createState(evaluationPlan.instructions));
  const samples = evaluationPlan.breakpoints.map<
    EvaluationSample<ProgramState>
  >((breakpoint) => ({
    range: breakpoint.range,
    state: trace[breakpoint.ip - 1],
  }));

  if (!parsed.success) {
    return {
      bytecode: Uint8Array.of(),
      errors: [
        {
          error: `An instruction is malformed and cannot be evaluated: ${disassembleBytecode(
            OpcodesCommon,
            parsed.remainingBytecode
          )}`,
          range: parsed.remainingRange,
        },
      ],
      samples,
      success: false,
    };
  }

  const hasInvalidSamples = samples.some((s) => s.state === undefined);
  if (hasInvalidSamples) {
    const firstInvalidSample = samples.findIndex((s) => s.state === undefined);
    const errorSample = samples[firstInvalidSample - 1] as
      | EvaluationSampleValid<ProgramState>
      | undefined;
    const errorBeforeFirstSample = firstInvalidSample === 0;
    const lastTraceItem = trace[trace.length - 1];
    const errorMessage = errorBeforeFirstSample
      ? lastTraceItem === undefined
        ? 'vm.stateDebug produced no valid program states.'
        : lastTraceItem.error ??
          'vm.stateDebug failed to produce program states for any samples and provided no error message.'
      : (errorSample as EvaluationSampleValid<ProgramState>).state.error ??
        `vm.stateDebug failed to produce all expected program states and provided no error message.`;
    const range = errorBeforeFirstSample
      ? samples[0].range
      : samples[firstInvalidSample - 1].range;
    return {
      bytecode: Uint8Array.of(),
      errors: [
        { error: `Failed to reduce evaluation: ${errorMessage}`, range },
      ],
      samples,
      success: false,
    };
  }

  const lastSample = samples[samples.length - 1] as EvaluationSampleValid<
    ProgramState
  >;
  if (lastSample.state.error !== undefined) {
    return {
      bytecode: Uint8Array.of(),
      errors: [
        {
          error: `Failed to reduce evaluation: ${lastSample.state.error}`,
          range: lastSample.range,
        },
      ],
      samples,
      success: false,
    };
  }
  if (lastSample.state.stack.length === 0) {
    return {
      bytecode: Uint8Array.of(),
      errors: [
        {
          error: `An evaluation must leave an item on the stack, but this evaluation completed with an empty stack. To return an empty result, push an empty stack item ("OP_0").`,
          range: lastSample.range,
        },
      ],
      samples,
      success: false,
    };
  }
  if (lastSample.state.stack.length > 1) {
    return {
      bytecode: Uint8Array.of(),
      errors: [
        {
          error: `Evaluations return a single item from the stack, but this evaluation completed with more than one stack item.`,
          range: lastSample.range,
        },
      ],
      samples,
      success: false,
    };
  }
  return {
    bytecode: lastSample.state.stack[0],
    samples: samples as EvaluationSampleValid<ProgramState>[],
    success: true,
  };
};

/**
 * Reduce a resolved script, returning the resulting bytecode and a trace of the
 * reduction process.
 *
 * This method will return an error if provided a `resolvedScript` with
 * resolution errors. To check for resolution errors, use `getResolutionErrors`.
 *
 * @param resolvedScript - the `CompiledScript` to reduce
 * @param vm - the `AuthenticationVirtualMachine` to use for evaluations
 * @param createState - a method which returns the base `ProgramState` used when
 * initializing evaluations
 */
export const reduceScript = <
  ProgramState extends StackState & MinimumProgramState<Opcodes>,
  Opcodes,
  AuthenticationProgram
>(
  resolvedScript: ResolvedScript,
  vm?: AuthenticationVirtualMachine<AuthenticationProgram, ProgramState>,
  createState?: (
    instructions: AuthenticationInstruction<Opcodes>[]
  ) => ProgramState
): ScriptReductionTraceContainerNode<ProgramState> => {
  const source = resolvedScript.map<
    ScriptReductionTraceChildNode<ProgramState>
    // eslint-disable-next-line complexity
  >((segment) => {
    switch (segment.type) {
      case 'bytecode':
        return { bytecode: segment.value, range: segment.range };
      case 'push': {
        const push = reduceScript(segment.value, vm, createState);
        const bytecode = encodeDataPush(push.bytecode);
        return {
          bytecode,
          ...(push.errors === undefined ? undefined : { errors: push.errors }),
          range: segment.range,
          source: [push],
        };
      }
      case 'evaluation': {
        if (typeof vm === 'undefined' || typeof createState === 'undefined') {
          return {
            errors: [
              {
                error:
                  'Both a VM and a createState method are required to reduce evaluations.',
                range: segment.range,
              },
            ],
            ...emptyReductionTraceNode(segment.range),
          };
        }
        const reductionTrace = reduceScript(segment.value, vm, createState);
        if (reductionTrace.errors !== undefined) {
          return {
            errors: reductionTrace.errors,
            samples: [],
            source: [reductionTrace],
            ...emptyReductionTraceNode(segment.range),
          };
        }
        const evaluated = sampledEvaluateReductionTraceNodes({
          createState,
          nodes: reductionTrace.source,
          parentRange: segment.range,
          vm,
        });
        return {
          ...(evaluated.success
            ? {
                bytecode: evaluated.bytecode,
                range: segment.range,
              }
            : {
                errors: evaluated.errors,
                ...emptyReductionTraceNode(segment.range),
              }),
          samples: evaluated.samples,
          source: [reductionTrace],
        };
      }
      case 'comment':
        return emptyReductionTraceNode(segment.range);
      case 'error':
        return {
          errors: [
            {
              error: `Tried to reduce a BTL script with resolution errors: ${segment.value}`,
              range: segment.range,
            },
          ],
          ...emptyReductionTraceNode(segment.range),
        };
      // eslint-disable-next-line functional/no-conditional-statement
      default:
        // eslint-disable-next-line functional/no-throw-statement, @typescript-eslint/no-throw-literal, no-throw-literal
        throw new Error(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          `"${(segment as any).type as string}" is not a known segment type.`
        ) as never;
    }
  });
  const reduction = source.reduce<{
    bytecode: Uint8Array[];
    errors?: ErrorInformation[] | undefined;
    ranges: Range[];
  }>(
    (all, segment) => ({
      bytecode: [...all.bytecode, segment.bytecode],
      ranges: [...all.ranges, segment.range],
      ...(all.errors !== undefined || segment.errors !== undefined
        ? {
            errors: [
              ...(all.errors === undefined ? [] : all.errors),
              ...(segment.errors === undefined ? [] : segment.errors),
            ],
          }
        : undefined),
    }),
    { bytecode: [], ranges: [] }
  );

  return {
    ...(reduction.errors === undefined
      ? undefined
      : { errors: reduction.errors }),
    bytecode: flattenBinArray(reduction.bytecode),
    range: mergeRanges(
      reduction.ranges,
      resolvedScript.length === 0 ? undefined : resolvedScript[0].range
    ),
    source,
  };
};
