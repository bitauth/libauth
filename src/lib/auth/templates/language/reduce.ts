import { flattenBinArray } from '../../../format/format';
import { OpcodesCommon } from '../../instruction-sets/common/opcodes';
import { encodeDataPush } from '../../instruction-sets/instruction-sets';
import { AuthenticationInstruction } from '../../instruction-sets/instruction-sets-types';
import {
  authenticationInstructionsAreNotMalformed,
  disassembleBytecode,
  parseBytecode,
} from '../../instruction-sets/instruction-sets-utils';
import { MinimumProgramState, StackState } from '../../state';
import { AuthenticationVirtualMachine } from '../../virtual-machine';

import { ErrorInformation } from './errors';
import { Range, ResolvedScript } from './resolve';

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
 * @param ranges - an array of `Range`s
 */
export const mergeRanges = (ranges: Range[]) => {
  const unsortedMerged = ranges.reduce<Range>(
    // eslint-disable-next-line complexity
    (merged, range) => ({
      ...(range.startLineNumber < merged.startLineNumber
        ? pluckStartPosition(range)
        : range.startLineNumber === merged.startLineNumber &&
          range.startColumn < merged.startColumn
        ? pluckStartPosition(range)
        : pluckStartPosition(merged)),
      ...(range.endLineNumber > merged.endLineNumber
        ? pluckEndPosition(range)
        : range.endLineNumber === merged.endLineNumber &&
          range.endColumn > merged.endColumn
        ? pluckEndPosition(range)
        : pluckEndPosition(merged)),
    }),
    ranges[0]
  );
  return {
    ...pluckStartPosition(unsortedMerged),
    ...pluckEndPosition(unsortedMerged),
  };
};

/**
 * The result of reducing a single BTL script node.
 */
export interface ScriptReductionTraceNode {
  bytecode: Uint8Array;
  errors?: ErrorInformation[] | undefined;
  range: Range;
}
interface ScriptReductionTraceErrorNode extends ScriptReductionTraceNode {
  errors?: ErrorInformation[];
}

export interface ScriptReductionTraceContainerNode<ProgramState>
  extends ScriptReductionTraceNode {
  source: ScriptReductionTraceChildNode<ProgramState>[];
}

export type ScriptReductionTraceChildNode<ProgramState> =
  | ScriptReductionTraceNode
  | ScriptReductionTraceContainerNode<ProgramState>
  | ScriptReductionTraceErrorNode
  | ScriptReductionTraceEvaluationNode<ProgramState>;

export interface TraceSample<ProgramState> {
  range: Range;
  state: ProgramState;
}

export interface ScriptReductionTraceEvaluationNode<ProgramState>
  extends ScriptReductionTraceContainerNode<ProgramState> {
  samples: TraceSample<ProgramState>[];
}

const emptyReductionTraceNode = (range: Range) => ({
  bytecode: Uint8Array.of(),
  range,
});

/**
 * Aggregate instructions to build groups of non-malformed instructions.
 */
// eslint-disable-next-line complexity
const aggregatedParseReductionTraceNodes = <Opcodes>(
  nodes: readonly ScriptReductionTraceNode[]
): InstructionAggregationResult<Opcodes> => {
  const aggregations: InstructionAggregation<Opcodes>[] = [];
  // eslint-disable-next-line functional/no-let
  let ip = 0;
  // eslint-disable-next-line functional/no-let, init-declarations
  let incomplete: { bytecode: Uint8Array; range: Range } | undefined;
  // eslint-disable-next-line functional/no-loop-statement
  for (const node of nodes) {
    const bytecode =
      incomplete === undefined
        ? node.bytecode
        : flattenBinArray([incomplete.bytecode, node.bytecode]);
    const range =
      incomplete === undefined
        ? node.range
        : mergeRanges([incomplete.range, node.range]);
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
 * Evaluate an array of `InstructionAggregation`s with the provided
 * `AuthenticationVirtualMachine`, matching the results back to their source
 * ranges.
 */
export const evaluateInstructionAggregations = <
  Opcodes,
  ProgramState extends MinimumProgramState<Opcodes> & { error?: string }
>(
  aggregations: InstructionAggregation<Opcodes>[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  vm: AuthenticationVirtualMachine<any, ProgramState>,
  getState: (instructions: AuthenticationInstruction<Opcodes>[]) => ProgramState
): InstructionAggregationEvaluationResult<ProgramState> => {
  const nonEmptyAggregations = aggregations.filter(
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
  const trace = vm.stateDebug(getState(evaluationPlan.instructions));
  const samples = evaluationPlan.breakpoints.map<
    EvaluationSample<ProgramState>
  >((breakpoint) => ({
    range: breakpoint.range,
    state: trace[breakpoint.ip - 1],
  }));
  const firstInvalidSample = samples.findIndex(
    (sample) => sample.state === undefined
  );
  const errorSample =
    (samples[firstInvalidSample - 1] as
      | EvaluationSample<ProgramState>
      | undefined) ??
    (samples[firstInvalidSample] as EvaluationSample<ProgramState> | undefined);
  return errorSample === undefined
    ? {
        samples: samples as EvaluationSampleValid<ProgramState>[],
        success: true,
      }
    : {
        errors: [
          {
            error:
              errorSample.state === undefined
                ? `Failed to reduce evaluation: vm.stateDebug produced no valid program states.`
                : `Failed to reduce evaluation: ${
                    errorSample.state.error ?? 'unknown error'
                  }`,
            range: errorSample.range,
          },
        ],
        samples,
        success: false,
      };
};

/**
 * Incrementally evaluate an array of `ScriptReductionTraceNode`s, returning a
 * trace of the evaluation and the resulting top stack item (`evaluationResult`)
 * if successful.
 *
 * @param nodes - an array of reduced nodes
 * @param vm - the `AuthenticationVirtualMachine` to use in the evaluation
 * @param getState - a method which should generate a new ProgramState given an
 * array of `instructions`
 */
// eslint-disable-next-line complexity
export const sampledEvaluateReductionTraceNodes = <
  Opcodes,
  ProgramState extends MinimumProgramState<Opcodes> &
    StackState & { error?: string }
>(
  nodes: ScriptReductionTraceNode[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  vm: AuthenticationVirtualMachine<any, ProgramState>,
  getState: (instructions: AuthenticationInstruction<Opcodes>[]) => ProgramState
): SampledEvaluationResult<ProgramState> => {
  const parsed = aggregatedParseReductionTraceNodes<Opcodes>(nodes);
  const evaluated = evaluateInstructionAggregations(
    parsed.aggregations,
    vm,
    getState
  );
  if (parsed.success && evaluated.success) {
    const samples =
      evaluated.samples.length > 0
        ? evaluated.samples
        : [{ range: parsed.aggregations[0].range, state: getState([]) }];
    const lastSample = samples[samples.length - 1];
    const lastStackItem = lastSample.state.stack[
      lastSample.state.stack.length - 1
    ] as Uint8Array | undefined;
    const evaluationResult =
      lastStackItem === undefined ? Uint8Array.of() : lastStackItem.slice();
    return {
      bytecode: evaluationResult,
      samples,
      success: true,
    };
  }
  return {
    bytecode: Uint8Array.of(),
    errors: [
      ...(parsed.success
        ? []
        : [
            {
              error: `A sample is malformed and cannot be evaluated: ${disassembleBytecode(
                OpcodesCommon,
                parsed.remainingBytecode
              )}`,
              range: parsed.remainingRange,
            },
          ]),
      ...(evaluated.success ? [] : evaluated.errors),
    ],
    samples: evaluated.samples,
    success: false,
  };
};

/**
 * This method will throw an error if provided a `compiledScript` with
 * compilation errors. To check for compilation errors, use `getCompileErrors`.
 * @param compiledScript - the `CompiledScript` to reduce
 * @param vm - the `AuthenticationVirtualMachine` to use for evaluations
 * @param createState - a method which returns the base `ProgramState` used when initializing evaluations
 */
export const reduceScript = <
  ProgramState extends StackState & MinimumProgramState<Opcodes>,
  Opcodes
>(
  compiledScript: ResolvedScript,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  vm?: AuthenticationVirtualMachine<any, ProgramState>,
  createState?: (
    instructions: AuthenticationInstruction<Opcodes>[]
  ) => ProgramState
): ScriptReductionTraceContainerNode<ProgramState> => {
  const source = compiledScript.map<
    ScriptReductionTraceChildNode<ProgramState>
    // eslint-disable-next-line complexity
  >((segment) => {
    switch (segment.type) {
      case 'bytecode':
        return { bytecode: segment.value, range: segment.range };
      case 'push': {
        if (segment.value.length === 0) {
          return emptyReductionTraceNode(segment.range);
        }
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
        if (segment.value.length === 0) {
          return emptyReductionTraceNode(segment.range);
        }
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
        const evaluated = sampledEvaluateReductionTraceNodes(
          reductionTrace.source,
          vm,
          createState
        );
        const errors = [
          ...(reductionTrace.errors === undefined ? [] : reductionTrace.errors),
          ...(evaluated.success ? [] : evaluated.errors),
        ];
        return {
          ...(errors.length > 0
            ? {
                errors,
                ...emptyReductionTraceNode(segment.range),
              }
            : {
                bytecode: evaluated.bytecode,
                range: segment.range,
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
      default:
        return new Error(
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
    range: mergeRanges(reduction.ranges),
    source,
  };
};

export interface InstructionAggregation<Opcodes> {
  instructions: AuthenticationInstruction<Opcodes>[];
  lastIp: number;
  range: Range;
}

export interface InstructionAggregationSuccess<Opcodes> {
  aggregations: InstructionAggregation<Opcodes>[];
  success: true;
}

export interface InstructionAggregationError<Opcodes> {
  aggregations: InstructionAggregation<Opcodes>[];
  remainingBytecode: Uint8Array;
  remainingRange: Range;
  success: false;
}

export type InstructionAggregationResult<Opcodes> =
  | InstructionAggregationSuccess<Opcodes>
  | InstructionAggregationError<Opcodes>;

export interface EvaluationSample<ProgramState> {
  range: Range;
  state: ProgramState | undefined;
}

export interface EvaluationSampleValid<ProgramState> {
  range: Range;
  state: ProgramState;
}

export interface InstructionAggregationEvaluationError<ProgramState> {
  errors: ErrorInformation[];
  samples: EvaluationSample<ProgramState>[];
  success: false;
}

export interface InstructionAggregationEvaluationSuccess<ProgramState> {
  samples: EvaluationSampleValid<ProgramState>[];
  success: true;
}

type InstructionAggregationEvaluationResult<ProgramState> =
  | InstructionAggregationEvaluationError<ProgramState>
  | InstructionAggregationEvaluationSuccess<ProgramState>;

export interface SampledEvaluationSuccess<ProgramState> {
  bytecode: Uint8Array;
  samples: EvaluationSampleValid<ProgramState>[];
  success: true;
}
export interface SampledEvaluationError<ProgramState> {
  bytecode: Uint8Array;
  errors: ErrorInformation[];
  samples: EvaluationSample<ProgramState>[];
  success: false;
}

export type SampledEvaluationResult<ProgramState> =
  | SampledEvaluationSuccess<ProgramState>
  | SampledEvaluationError<ProgramState>;

export interface FlattenedTraceSample<ProgramState>
  extends TraceSample<ProgramState> {
  /**
   * The nesting-depth of this sample. (E.g. the first level of evaluation has a
   * depth of `1`, an evaluation inside of it will produce samples with a depth
   * of `2`, etc.)
   */
  depth: number;
}
