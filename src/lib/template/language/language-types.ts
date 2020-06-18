import { AuthenticationInstruction } from '../../vm/instruction-sets/instruction-sets-types';
import {
  AuthenticationProgramStateMinimum,
  AuthenticationProgramStateStack,
} from '../../vm/vm-types';

export interface Range {
  endColumn: number;
  endLineNumber: number;
  startColumn: number;
  startLineNumber: number;
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
  | 'BigIntLiteral'
  | 'BinaryLiteral'
  | 'HexLiteral';

type RecursiveSegmentType = 'Push' | 'Evaluation';

interface BitauthTemplatingLanguageSegment extends MarkedNode {
  name: string;
}

interface BtlStringSegment extends BitauthTemplatingLanguageSegment {
  name: StringSegmentType;
  value: string;
}

interface BtlRecursiveSegment extends BitauthTemplatingLanguageSegment {
  name: RecursiveSegmentType;
  value: BtlScriptSegment;
}

export interface BtlScriptSegment extends BitauthTemplatingLanguageSegment {
  name: 'Script';
  value: (BtlRecursiveSegment | BtlStringSegment)[];
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

export interface ResolvedSegmentVariableBytecode
  extends ResolvedSegmentBase,
    ResolutionDebug,
    ResolutionSignature {
  type: 'bytecode';
  value: Uint8Array;
  /**
   * The full identifier (including any compilation operations) of the variable
   * which resolved to this `value`, e.g. `my_key.signature.all_outputs` or
   * `my_key.public_key`.
   */
  variable: string;
}

export interface ResolvedSegmentScriptBytecode extends ResolvedSegmentBase {
  /**
   * The full identifier of the script which resolved to this `value`.
   */
  script: string;
  /**
   * The source `ResolvedScript` which was compiled to produce this `value`.
   */
  source: ResolvedScript;
  type: 'bytecode';
  value: Uint8Array;
}

export interface ResolvedSegmentOpcodeBytecode extends ResolvedSegmentBase {
  /**
   * The identifier for this opcode, e.g. `OP_1` or `OP_CHECKSIG`.
   */
  opcode: string;
  type: 'bytecode';
  value: Uint8Array;
}

export type ResolvedSegmentLiteralType =
  | 'BigIntLiteral'
  | 'BinaryLiteral'
  | 'HexLiteral'
  | 'UTF8Literal';

export interface ResolvedSegmentLiteralBytecode extends ResolvedSegmentBase {
  literal: string;
  literalType: ResolvedSegmentLiteralType;
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
  /**
   * The full identifier (including any compilation operations) of the variable
   * missing from compilation, e.g. `my_key.signature.all_outputs` or
   * `my_key.public_key`. Only present if the error is recoverable – the error
   * can be resolved by providing the variable in the compilation data.
   */
  missingIdentifier?: string;

  /**
   * Available if both `missingIdentifier` is provided and the `entityOwnership`
   * for the referenced variable is available in the compilation data.
   */
  owningEntity?: string;
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

export interface ResolutionDebug {
  /**
   * An additional, complex property which may be returned by custom
   * compiler operations. For use in extending the compiler to support
   * additional return information like `CompilerOperationSuccessSignature`.
   */
  debug?: unknown;
}

export interface ResolutionSignature {
  signature?:
    | {
        /**
         * The transaction signing serialization signed by a signature. This
         * signing serialization is hashed twice with `sha256`, and the
         * digest is signed.
         */
        serialization: Uint8Array;
      }
    | {
        /**
         * The raw message signed by a data signature. This message is
         * hashed once with `sha256`, and the digest is signed.
         */
        message: Uint8Array;
      };
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
      type: IdentifierResolutionType.opcode;
    }
  | ({
      bytecode: Uint8Array;
      status: true;
      type: IdentifierResolutionType.variable;
    } & ResolutionDebug &
      ResolutionSignature)
  | {
      bytecode: Uint8Array;
      source: ResolvedScript;
      status: true;
      type: IdentifierResolutionType.script;
    }
  | ({
      error: string;
      type: IdentifierResolutionErrorType.variable;
      status: false;
      recoverable: boolean;
      /**
       * Only available if this variable is present in the environment's
       * `entityOwnership`.
       */
      entityOwnership?: string;
    } & ResolutionDebug)
  | {
      error: string;
      type: IdentifierResolutionErrorType.script;
      scriptId: string;
      status: false;
    }
  | {
      error: string;
      type: IdentifierResolutionErrorType.unknown;
      status: false;
    };

/**
 * The result of reducing a single BTL script node.
 */
export interface ScriptReductionTraceNode {
  bytecode: Uint8Array;
  errors?: CompilationError[] | undefined;
  range: Range;
}
interface ScriptReductionTraceErrorNode extends ScriptReductionTraceNode {
  errors: CompilationError[];
}

export interface ScriptReductionTraceScriptNode<ProgramState>
  extends ScriptReductionTraceNode {
  script: ScriptReductionTraceChildNode<ProgramState>[];
}

export interface ScriptReductionTracePushNode<ProgramState>
  extends ScriptReductionTraceNode {
  push: ScriptReductionTraceScriptNode<ProgramState>;
}

export interface ScriptReductionTraceEvaluationNode<ProgramState>
  extends ScriptReductionTraceNode {
  trace: ProgramState[];
  source: ScriptReductionTraceScriptNode<ProgramState>;
}

export type ScriptReductionTraceChildNode<ProgramState> =
  | ScriptReductionTraceNode
  | ScriptReductionTraceErrorNode
  | ScriptReductionTracePushNode<ProgramState>
  | ScriptReductionTraceEvaluationNode<ProgramState>;

/**
 * The ProgramState at a particular point in a sampled evaluation.
 */
export interface TraceSample<ProgramState> {
  range: Range;
  state: ProgramState;
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

/**
 * An evaluation sample extracted from a script reduction trace – includes the
 * range of the evaluation from which the sample was extracted, the instruction
 * which was evaluated, the range in the source script over which the
 * instruction was defined, and the resulting program state.
 */
export interface EvaluationSample<ProgramState, Opcodes = number> {
  /**
   * The range of the evaluation node in which this sample was generated.
   *
   * This can be used to identify which other samples were part of the same
   * evaluation that produced this sample.
   */
  evaluationRange: Range;
  /**
   * The final instruction which was evaluated during this sample.
   *
   * Note, the first sample from any evaluation is the initial state before any
   * instructions are executed, so its `instruction` is `undefined`. For all
   * other samples, `instruction` must be defined.
   */
  instruction?: AuthenticationInstruction<Opcodes>;
  /**
   * An ordered array of instructions and program states which occurred within
   * the range of a single reduction trace node before the final instruction and
   * state (assigned to `instruction` and `state`, respectively).
   *
   * This occurs in unusual cases where multiple opcodes are defined in the same
   * reduced node, e.g. a long hex literal of operations as bytecode or an
   * evaluation which is not wrapped in a push.
   *
   * Usually, this will be an empty array.
   */
  internalStates: {
    instruction: AuthenticationInstruction<Opcodes>;
    state: ProgramState;
  }[];
  /**
   * The range over which this sample was defined in the source script.
   */
  range: Range;
  /**
   * The program state after the evaluation of this sample's `instruction`.
   */
  state: ProgramState;
}

export interface CompilationResultResolve {
  parse: BtlScriptSegment;
  resolve: ResolvedScript;
}

export interface CompilationResultReduce<ProgramState>
  extends CompilationResultResolve {
  reduce: ScriptReductionTraceScriptNode<ProgramState>;
}

export interface CompilationResultErrorBase {
  errors: CompilationError[];
  errorType: 'parse' | 'resolve' | 'reduce';
  success: false;
}

export type CompilationError =
  | CompilationErrorFatal
  | CompilationErrorRecoverable;

/**
 * A compilation error from which it is not possible to recover. This includes
 * problems with the authentication template, missing dependencies in the
 * compilation environment, and other errors which likely require meaningful
 * software changes.
 */
export interface CompilationErrorFatal {
  /**
   * A message describing the compilation error.
   */
  error: string;
  /**
   * The range in the source text to which this error can be traced. This is
   * useful for highlighting/underlining the cause of the error in development.
   */
  range: Range;
}

/**
 * A compilation error from which recovery can happen without template or
 * software changes. This happens when a required variable is not provided in
 * the compilation data. If this variable can be added to the compilation data,
 * the error will be resolved.
 *
 * If a compilation fails due only to recoverable errors, the IDs of the missing
 * variables can be extracted and used to request action by the user or another
 * system.
 */
export interface CompilationErrorRecoverable extends CompilationErrorFatal {
  /**
   * The variable ID of the variable which – if provided in the compilation data
   * – would resolve this error.
   */
  missingIdentifier: string;
  /**
   * The ID of the entity which owns the variable referenced by
   * `missingIdentifier`.
   */
  owningEntity: string;
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
  /**
   * The transformation type of the resulting bytecode.
   *
   * Set to `p2sh-locking` if the resulting bytecode was transformed into a P2SH
   * locking script (`OP_HASH160 <$(<result> OP_HASH160)> OP_EQUAL`).
   *
   * Set to `p2sh-unlocking` if the resulting bytecode was transformed into a
   * P2SH unlocking script (`result <locking_script>`).
   *
   * This property is not defined if the result was not transformed.
   */
  transformed?: 'p2sh-locking' | 'p2sh-unlocking';
}

export type CompilationResult<
  ProgramState = AuthenticationProgramStateStack &
    AuthenticationProgramStateMinimum
> =
  | CompilationResultSuccess<ProgramState>
  | CompilationResultError<ProgramState>;
