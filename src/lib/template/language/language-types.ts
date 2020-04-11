import { AuthenticationInstruction } from '../../vm/instruction-sets/instruction-sets-types';
import { MinimumProgramState, StackState } from '../../vm/state';

export interface Range {
  endColumn: number;
  endLineNumber: number;
  startColumn: number;
  startLineNumber: number;
}

export interface ErrorInformation {
  error: string;
  range: Range;
}

export interface SourcePosition {
  column: number;
  line: number;
  offset: number;
}

export interface MarkedNode {
  end: SourcePosition;
  start: SourcePosition;
}

type StringSegmentType =
  | 'Comment'
  | 'Identifier'
  | 'UTF8Literal'
  | 'HexLiteral';

type RecursiveSegmentType = 'Push' | 'Evaluation';

interface BitauthTemplatingLanguageSegment extends MarkedNode {
  name: string;
}

interface BtlStringSegment extends BitauthTemplatingLanguageSegment {
  name: StringSegmentType;
  value: string;
}

interface BtlBigIntSegment extends BitauthTemplatingLanguageSegment {
  name: 'BigIntLiteral';
  value: bigint;
}

interface BtlRecursiveSegment extends BitauthTemplatingLanguageSegment {
  name: RecursiveSegmentType;
  value: BtlScriptSegment;
}

export interface BtlScriptSegment extends BitauthTemplatingLanguageSegment {
  name: 'Script';
  value: (BtlRecursiveSegment | BtlBigIntSegment | BtlStringSegment)[];
}

export type ParseResult =
  | { expected: string[]; index: SourcePosition; status: false }
  | { status: true; value: BtlScriptSegment };

interface ResolvedSegmentBase {
  range: Range;
  type: string;
}

export interface ResolvedSegmentPush<T> extends ResolvedSegmentBase {
  type: 'push';
  value: T;
}

export interface ResolvedSegmentEvaluation<T> extends ResolvedSegmentBase {
  type: 'evaluation';
  value: T;
}

export interface ResolvedSegmentVariableBytecode extends ResolvedSegmentBase {
  type: 'bytecode';
  value: Uint8Array;
  variable: string;
}

export interface ResolvedSegmentScriptBytecode extends ResolvedSegmentBase {
  script: string;
  source: ResolvedScript;
  type: 'bytecode';
  value: Uint8Array;
}

export interface ResolvedSegmentOpcodeBytecode extends ResolvedSegmentBase {
  opcode: string;
  type: 'bytecode';
  value: Uint8Array;
}

export interface ResolvedSegmentLiteralBytecode extends ResolvedSegmentBase {
  literalType: 'BigIntLiteral' | 'HexLiteral' | 'UTF8Literal';
  type: 'bytecode';
  value: Uint8Array;
}

export type ResolvedSegmentBytecode =
  | ResolvedSegmentLiteralBytecode
  | ResolvedSegmentOpcodeBytecode
  | ResolvedSegmentScriptBytecode
  | ResolvedSegmentVariableBytecode;

export interface ResolvedSegmentComment extends ResolvedSegmentBase {
  type: 'comment';
  value: string;
}

export interface ResolvedSegmentError extends ResolvedSegmentBase {
  type: 'error';
  value: string;
}

export type ResolvedSegment =
  | ResolvedSegmentPush<ResolvedScript>
  | ResolvedSegmentEvaluation<ResolvedScript>
  | ResolvedSegmentBytecode
  | ResolvedSegmentComment
  | ResolvedSegmentError;

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ResolvedScript extends Array<ResolvedSegment> {}

export enum IdentifierResolutionType {
  opcode = 'opcode',
  variable = 'variable',
  script = 'script',
}

export enum IdentifierResolutionErrorType {
  unknown = 'unknown',
  variable = 'variable',
  script = 'script',
}

/**
 * A method which accepts a string and returns either the successfully resolved
 * bytecode or an error. The string will never be empty (`''`), so resolution
 * can skip checking the string's length.
 */
export type IdentifierResolutionFunction = (
  identifier: string
) =>
  | {
      bytecode: Uint8Array;
      status: true;
      type: IdentifierResolutionType.opcode | IdentifierResolutionType.variable;
    }
  | {
      bytecode: Uint8Array;
      source: ResolvedScript;
      status: true;
      type: IdentifierResolutionType.script;
    }
  | {
      error: string;
      type:
        | IdentifierResolutionErrorType.variable
        | IdentifierResolutionErrorType.unknown;
      status: false;
    }
  | {
      error: string;
      type: IdentifierResolutionErrorType.script;
      scriptId: string;
      status: false;
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
  errors: ErrorInformation[];
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

/**
 * The ProgramState at a particular point in a sampled evaluation.
 */
export interface TraceSample<ProgramState> {
  range: Range;
  state: ProgramState;
}

export interface ScriptReductionTraceEvaluationNode<ProgramState>
  extends ScriptReductionTraceContainerNode<ProgramState> {
  samples: TraceSample<ProgramState>[];
}

/**
 * A group of instructions which when read together are not malformed (contain
 * incomplete push instructions). For example, the BTL `0x03 'a' 'b' 'c'` would
 * be malformed if not evaluated together, since the `0x03` becomes
 * `OP_PUSHBYTES_3`, and the UTF8 literals compile to `0x616263`.
 */
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

export interface EvaluationSample<ProgramState> {
  range: Range;
  /**
   * This may be undefined if an error occurred before this sample was taken.
   */
  state: ProgramState | undefined;
}

export interface EvaluationSampleValid<ProgramState> {
  range: Range;
  state: ProgramState;
}

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

export interface CompilationResultResolve {
  parse: BtlScriptSegment;
  resolve: ResolvedScript;
}

export interface CompilationResultReduce<ProgramState>
  extends CompilationResultResolve {
  reduce: ScriptReductionTraceContainerNode<ProgramState>;
}

export interface CompilationResultErrorBase {
  errors: CompilationError[];
  errorType: 'parse' | 'resolve' | 'reduce';
  success: false;
}

export interface CompilationError {
  error: string;
  range: Range;
}

export interface CompilationResultParseError
  extends CompilationResultErrorBase {
  /**
   * The `parse` stage produces only a single parse error at a time.
   */
  errors: [CompilationError];
  errorType: 'parse';
}
export interface CompilationResultResolveError
  extends CompilationResultResolve,
    CompilationResultErrorBase {
  errorType: 'resolve';
}

export interface CompilationResultReduceError<ProgramState>
  extends CompilationResultReduce<ProgramState>,
    CompilationResultErrorBase {
  errorType: 'reduce';
}

export type CompilationResultError<ProgramState> =
  | CompilationResultParseError
  | CompilationResultResolveError
  | CompilationResultReduceError<ProgramState>;

export interface CompilationResultSuccess<ProgramState>
  extends CompilationResultReduce<ProgramState> {
  bytecode: Uint8Array;
  success: true;
}

export type CompilationResult<
  ProgramState = StackState & MinimumProgramState
> =
  | CompilationResultSuccess<ProgramState>
  | CompilationResultError<ProgramState>;
