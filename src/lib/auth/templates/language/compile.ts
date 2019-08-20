import { MinimumProgramState, StackState } from '../../state';

import { getResolutionErrors } from './errors';
import { BitAuthScriptSegment, parseScript } from './parse';
import { reduceScript, ScriptReductionTraceContainerNode } from './reduce';
import {
  CompilationData,
  CompilationEnvironment,
  createIdentifierResolver,
  Range,
  ResolvedScript,
  resolveScriptSegment
} from './resolve';

export interface CompilationResultResolve {
  parse: BitAuthScriptSegment;
  resolve: ResolvedScript;
}

export interface CompilationResultReduce<ProgramState>
  extends CompilationResultResolve {
  reduce: ScriptReductionTraceContainerNode<ProgramState>;
}

export interface CompilationResultErrorBase {
  errors: CompilationError[];
  errorType: string;
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

/**
 * Note, `compileScript` is the recommended API for using this method.
 */
// tslint:disable-next-line: cyclomatic-complexity
export const compileScriptText = <
  ProgramState = StackState & MinimumProgramState,
  CompilerOperationData = {}
>(
  script: string,
  data: CompilationData<CompilerOperationData>,
  environment: CompilationEnvironment<CompilerOperationData>,
  scriptId?: string
): CompilationResult<ProgramState> => {
  // tslint:disable-next-line: no-if-statement
  if (script.length === 0) {
    return {
      errorType: 'parse',
      errors: [
        {
          error: 'Tried to compile an empty string as a script.',
          range: {
            endColumn: 0,
            endLineNumber: 0,
            startColumn: 0,
            startLineNumber: 0
          }
        }
      ],
      success: false
    };
  }
  const parseResult = parseScript(script);
  // tslint:disable-next-line: no-if-statement
  if (!parseResult.status) {
    return {
      errorType: 'parse',
      errors: [
        {
          error: `Encountered unexpected input while parsing script. Expected ${parseResult.expected.join(
            ', '
          )}`,
          range: {
            endColumn: parseResult.index.line,
            endLineNumber: parseResult.index.line,
            startColumn: parseResult.index.line,
            startLineNumber: parseResult.index.line
          }
        }
      ],
      success: false
    };
  }
  const resolver = createIdentifierResolver(scriptId, data, environment);
  const resolvedScript = resolveScriptSegment(parseResult.value, resolver);
  const resolutionErrors = getResolutionErrors(resolvedScript);
  // tslint:disable-next-line: no-if-statement
  if (resolutionErrors.length !== 0) {
    return {
      errorType: 'resolve',
      errors: resolutionErrors,
      parse: parseResult.value,
      resolve: resolvedScript,
      success: false
    };
  }
  const reduction = reduceScript(
    resolvedScript,
    environment.vm,
    environment.createState
  );
  return {
    ...(reduction.errors === undefined
      ? { success: true }
      : { success: false, errorType: 'reduce', errors: reduction.errors }),
    bytecode: reduction.bytecode,
    parse: parseResult.value,
    reduce: reduction,
    resolve: resolvedScript
  };
};

/**
 * Parse, resolve, and reduce the provided Bitauth script using the provided
 * `data` and `environment`.
 */
export const compileScript = <
  ProgramState = StackState & MinimumProgramState,
  CompilerOperationData = {}
>(
  scriptId: string,
  data: CompilationData<CompilerOperationData>,
  environment: CompilationEnvironment<CompilerOperationData>
): CompilationResult<ProgramState> => {
  const script = environment.scripts[scriptId] as string | undefined;
  // tslint:disable-next-line: no-if-statement
  if (script === undefined) {
    return {
      errorType: 'parse',
      errors: [
        {
          error: `No script with an ID of '${scriptId}' was provided in the compilation environment.`,
          range: {
            endColumn: 0,
            endLineNumber: 0,
            startColumn: 0,
            startLineNumber: 0
          }
        }
      ],
      success: false
    };
  }
  return compileScriptText<ProgramState, CompilerOperationData>(
    script,
    data,
    environment,
    scriptId
  );
};
