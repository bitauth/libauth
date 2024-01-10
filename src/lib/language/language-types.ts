import type {
  AuthenticationInstruction,
  AuthenticationProgramStateMinimum,
  AuthenticationProgramStateStack,
} from '../lib.js';

export type Range = {
  endColumn: number;
  endLineNumber: number;
  startColumn: number;
  startLineNumber: number;
};

export type SourcePosition = {
  column: number;
  line: number;
  offset: number;
};

export type MarkedNode = {
  end: SourcePosition;
  start: SourcePosition;
};

type StringSegmentType =
  | 'BigIntLiteral'
  | 'BinaryLiteral'
  | 'Comment'
  | 'HexLiteral'
  | 'Identifier'
  | 'UTF8Literal';

type RecursiveSegmentType = 'Evaluation' | 'Push';

type CashAssemblyLanguageSegment = MarkedNode & {
  name: string;
};

type CashAssemblyStringSegment = CashAssemblyLanguageSegment & {
  name: StringSegmentType;
  value: string;
};

type CashAssemblyRecursiveSegment = CashAssemblyLanguageSegment & {
  name: RecursiveSegmentType;
  value: CashAssemblyScriptSegment;
};

export type CashAssemblyScriptSegment = CashAssemblyLanguageSegment & {
  name: 'Script';
  value: (CashAssemblyRecursiveSegment | CashAssemblyStringSegment)[];
};

export type ParseResult =
  | { expected: string[]; index: SourcePosition; status: false }
  | { status: true; value: CashAssemblyScriptSegment };

type ResolvedSegmentBase = {
  range: Range;
  type: string;
};

export type ResolvedSegmentPush<T> = ResolvedSegmentBase & {
  type: 'push';
  value: T;
};

export type ResolvedSegmentEvaluation<T> = ResolvedSegmentBase & {
  type: 'evaluation';
  value: T;
};

export type ResolvedSegmentVariableBytecode = ResolutionDebug &
  ResolutionSignature &
  ResolvedSegmentBase & {
    type: 'bytecode';
    value: Uint8Array;
    /**
     * The full identifier (including any compilation operations) of the variable
     * that resolved to this `value`, e.g. `my_key.signature.all_outputs` or
     * `my_key.public_key`.
     */
    variable: string;
  };

export type ResolvedSegmentScriptBytecode<ProgramState> =
  ResolvedSegmentBase & {
    /**
     * The full identifier of the script that resolved to this `value`.
     */
    script: string;
    /**
     * The source {@link ResolvedScript} that was compiled to produce
     * this `value`.
     */
    source: CompilationResultSuccess<ProgramState>;
    type: 'bytecode';
    value: Uint8Array;
  };

export type ResolvedSegmentOpcodeBytecode = ResolvedSegmentBase & {
  /**
   * The identifier for this opcode, e.g. `OP_1` or `OP_CHECKSIG`.
   */
  opcode: string;
  type: 'bytecode';
  value: Uint8Array;
};

export type ResolvedSegmentLiteralType =
  | 'BigIntLiteral'
  | 'BinaryLiteral'
  | 'HexLiteral'
  | 'UTF8Literal';

export type ResolvedSegmentLiteralBytecode = ResolvedSegmentBase & {
  literal: string;
  literalType: ResolvedSegmentLiteralType;
  type: 'bytecode';
  value: Uint8Array;
};

export type ResolvedSegmentBytecode<ProgramState> =
  | ResolvedSegmentLiteralBytecode
  | ResolvedSegmentOpcodeBytecode
  | ResolvedSegmentScriptBytecode<ProgramState>
  | ResolvedSegmentVariableBytecode;

export type ResolvedSegmentComment = ResolvedSegmentBase & {
  type: 'comment';
  value: string;
};

export type ResolvedSegmentError = ResolvedSegmentBase & {
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
};

export type ResolvedSegment<ProgramState> =
  | ResolvedSegmentBytecode<ProgramState>
  | ResolvedSegmentComment
  | ResolvedSegmentError
  | ResolvedSegmentEvaluation<ResolvedScript<ProgramState>>
  | ResolvedSegmentPush<ResolvedScript<ProgramState>>;

export type ResolvedScript<ProgramState> = ResolvedSegment<ProgramState>[];

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

export type ResolutionDebug = {
  /**
   * An additional, complex property that may be returned by custom
   * compiler operations. For use in extending the compiler to support
   * additional return information like
   * {@link CompilerOperationSuccessSignature}.
   */
  debug?: unknown;
};

export type ResolutionSignature = {
  signature?:
    | {
        /**
         * The raw message signed by a data signature. This message is
         * hashed once with `sha256`, and the digest is signed.
         */
        message: Uint8Array;
      }
    | {
        /**
         * The transaction signing serialization signed by a signature. This
         * signing serialization is hashed twice with `sha256`, and the
         * digest is signed.
         */
        serialization: Uint8Array;
      };
};

/**
 * A method that accepts a string and returns either the successfully resolved
 * bytecode or an error. The string will never be empty (`''`), so resolution
 * can skip checking the string's length.
 */
export type IdentifierResolutionFunction<ProgramState> = (
  identifier: string,
) =>
  | {
      bytecode: Uint8Array;
      source: CompilationResultSuccess<ProgramState>;
      status: true;
      type: IdentifierResolutionType.script;
    }
  | {
      bytecode: Uint8Array;
      status: true;
      type: IdentifierResolutionType.opcode;
    }
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
    }
  | (ResolutionDebug &
      ResolutionSignature & {
        bytecode: Uint8Array;
        status: true;
        type: IdentifierResolutionType.variable;
      })
  | (ResolutionDebug & {
      error: string;
      type: IdentifierResolutionErrorType.variable;
      status: false;
      recoverable: boolean;
      /**
       * Only available if this variable is present in the configuration's
       * `entityOwnership`.
       */
      entityOwnership?: string;
    });

/**
 * The result of reducing a single CashAssembly script node.
 */
export type ScriptReductionTraceNode = {
  bytecode: Uint8Array;
  errors?: CompilationError[] | undefined;
  range: Range;
};
type ScriptReductionTraceErrorNode = ScriptReductionTraceNode & {
  errors: CompilationError[];
};

export type ScriptReductionTraceScriptNode<ProgramState> =
  ScriptReductionTraceNode & {
    script: ScriptReductionTraceChildNode<ProgramState>[];
  };

export type ScriptReductionTracePushNode<ProgramState> =
  ScriptReductionTraceNode & {
    push: ScriptReductionTraceScriptNode<ProgramState>;
  };

export type ScriptReductionTraceEvaluationNode<ProgramState> =
  ScriptReductionTraceNode & {
    trace: ProgramState[];
    source: ScriptReductionTraceScriptNode<ProgramState>;
  };

export type ScriptReductionTraceChildNode<ProgramState> =
  | ScriptReductionTraceErrorNode
  | ScriptReductionTraceEvaluationNode<ProgramState>
  | ScriptReductionTraceNode
  | ScriptReductionTracePushNode<ProgramState>;

/**
 * The ProgramState at a particular point in a sampled evaluation.
 */
export type TraceSample<ProgramState> = {
  range: Range;
  state: ProgramState;
};

/**
 * A group of instructions that when read together are not malformed (contain
 * incomplete push instructions). For example, the CashAssembly
 * `0x03 'a' 'b' 'c'` would be malformed if not evaluated together, since the
 * `0x03` becomes `OP_PUSHBYTES_3`, and the UTF8 literals compile to `0x616263`.
 */
export type InstructionAggregation = {
  instructions: AuthenticationInstruction[];
  lastIp: number;
  range: Range;
};

export type InstructionAggregationSuccess = {
  aggregations: InstructionAggregation[];
  success: true;
};

export type InstructionAggregationError = {
  aggregations: InstructionAggregation[];
  remainingBytecode: Uint8Array;
  remainingRange: Range;
  success: false;
};

/**
 * An evaluation sample extracted from a script reduction trace – includes the
 * range of the evaluation from which the sample was extracted, the instruction
 * that was evaluated, the range in the source script over which the
 * instruction was defined, and the resulting program state.
 */
export type EvaluationSample<ProgramState> = {
  /**
   * The range of the evaluation node in which this sample was generated.
   *
   * This can be used to identify which other samples were part of the same
   * evaluation that produced this sample.
   */
  evaluationRange: Range;
  /**
   * The final instruction that was evaluated during this sample.
   *
   * Note, the first sample from any evaluation is the initial state before any
   * instructions are executed, so its `instruction` is `undefined`. For all
   * other samples, `instruction` must be defined.
   */
  instruction?: AuthenticationInstruction;
  /**
   * An ordered array of instructions and program states that occurred within
   * the range of a single reduction trace node before the final instruction and
   * state (assigned to `instruction` and `state`, respectively).
   *
   * This occurs in unusual cases where multiple opcodes are defined in the same
   * reduced node, e.g. a long hex literal of operations as bytecode or an
   * evaluation that is not wrapped in a push.
   *
   * Usually, this will be an empty array.
   */
  internalStates: {
    instruction: AuthenticationInstruction;
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
};

export type CompilationResultResolve<ProgramState> = {
  parse: CashAssemblyScriptSegment;
  resolve: ResolvedScript<ProgramState>;
};

export type CompilationResultReduce<ProgramState> =
  CompilationResultResolve<ProgramState> & {
    reduce: ScriptReductionTraceScriptNode<ProgramState>;
  };

export type CompilationResultErrorBase = {
  errors: CompilationError[];
  errorType: 'parse' | 'reduce' | 'resolve';
  success: false;
};

export type CompilationError =
  | CompilationErrorFatal
  | CompilationErrorRecoverable;

/**
 * A compilation error from which it is not possible to recover. This includes
 * problems with the wallet template, missing dependencies in the compiler
 * configuration, and other errors that likely require meaningful
 * software changes.
 */
export type CompilationErrorFatal = {
  /**
   * A message describing the compilation error.
   */
  error: string;
  /**
   * The range in the source text to which this error can be traced. This is
   * useful for highlighting/underlining the cause of the error in development.
   */
  range: Range;
};

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
export type CompilationErrorRecoverable = CompilationErrorFatal & {
  /**
   * The variable ID of the variable that – if provided in the compilation data
   * – would resolve this error.
   */
  missingIdentifier: string;
  /**
   * The ID of the entity that owns the variable referenced by
   * `missingIdentifier`.
   */
  owningEntity: string;
};

export type CompilationResultParseError = CompilationResultErrorBase & {
  /**
   * The `parse` stage produces only a single parse error at a time.
   */
  errors: [CompilationError];
  errorType: 'parse';
};
export type CompilationResultResolveError<ProgramState> =
  CompilationResultErrorBase &
    CompilationResultResolve<ProgramState> & {
      errorType: 'resolve';
    };

export type CompilationResultReduceError<ProgramState> =
  CompilationResultErrorBase &
    CompilationResultReduce<ProgramState> & {
      errorType: 'reduce';
    };

export type CompilationResultError<ProgramState> =
  | CompilationResultParseError
  | CompilationResultReduceError<ProgramState>
  | CompilationResultResolveError<ProgramState>;

export type CompilationResultSuccess<ProgramState> =
  CompilationResultReduce<ProgramState> & {
    bytecode: Uint8Array;
    success: true;
    /**
     * The transformation type of the resulting bytecode.
     *
     * Set to `p2sh20-locking` if the resulting bytecode was transformed into a
     * P2SH20 locking script (`OP_HASH160 <$(<result> OP_HASH160)> OP_EQUAL`).
     *
     * Set to `p2sh20-unlocking` if the resulting bytecode was transformed into a
     * P2SH20 unlocking script (`result <locking_script>`).
     *
     * This property is not defined if the result was not transformed.
     */
    transformed?:
      | 'p2sh20-locking'
      | 'p2sh20-unlocking'
      | 'p2sh32-locking'
      | 'p2sh32-unlocking';
  };

export type CompilationResult<
  ProgramState = AuthenticationProgramStateMinimum &
    AuthenticationProgramStateStack,
> =
  | CompilationResultError<ProgramState>
  | CompilationResultSuccess<ProgramState>;
