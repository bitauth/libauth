import { MinimumProgramState, StackState } from '../../state';

import { getResolutionErrors } from './errors';
import { BtlScriptSegment, parseScript } from './parse';
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
  parse: BtlScriptSegment;
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

enum Formatting {
  requiresCommas = 3,
  requiresOr = 2
}

/**
 * The constant used by the parser to denote the end of the input
 */
const EOF = 'EOF';
/**
 * A text-formatting method to pretty-print the list of expected inputs
 * (`Encountered unexpected input while parsing script. Expected ...`). If
 * present, the `EOF` expectation is always moved to the end of the list.
 * @param expectedArray - the alphabetized list of expected inputs produced by
 * `parseScript`
 */
const describeExpectedInput = (expectedArray: string[]) => {
  const newArray = expectedArray.filter(value => value !== EOF);
  // eslint-disable-next-line functional/no-conditional-statement
  if (newArray.length !== expectedArray.length) {
    // eslint-disable-next-line functional/no-expression-statement, functional/immutable-data
    newArray.push('the end of the script');
  }
  const withoutLastElement = newArray.slice(0, newArray.length - 1);
  const lastElement = newArray[newArray.length - 1];
  return `Encountered unexpected input while parsing script. Expected ${
    newArray.length >= Formatting.requiresCommas
      ? withoutLastElement.join(', ').concat(`, or ${lastElement}`)
      : newArray.length === Formatting.requiresOr
      ? newArray.join(' or ')
      : lastElement
  }.`;
};

/**
 * Note, `compileScript` is the recommended API for using this method.
 */
export const compileScriptText = <
  ProgramState = StackState & MinimumProgramState,
  CompilerOperationData = {}
>(
  script: string,
  data: CompilationData<CompilerOperationData>,
  environment: CompilationEnvironment<CompilerOperationData>,
  scriptId?: string
): CompilationResult<ProgramState> => {
  const parseResult = parseScript(script);
  if (!parseResult.status) {
    return {
      errorType: 'parse',
      errors: [
        {
          error: describeExpectedInput(parseResult.expected),
          range: {
            endColumn: parseResult.index.column,
            endLineNumber: parseResult.index.line,
            startColumn: parseResult.index.column,
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
      ? { bytecode: reduction.bytecode, success: true }
      : { errorType: 'reduce', errors: reduction.errors, success: false }),
    parse: parseResult.value,
    reduce: reduction,
    resolve: resolvedScript
  };
};

/**
 * Parse, resolve, and reduce the provided BTL script using the provided `data`
 * and `environment`.
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
