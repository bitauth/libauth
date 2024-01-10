import { binStringToBin, hexToBin, utf8ToBin } from '../format/format.js';
import type {
  AnyCompilerConfiguration,
  AuthenticationProgramStateControlStack,
  AuthenticationProgramStateMinimum,
  AuthenticationProgramStateStack,
  CashAssemblyScriptSegment,
  CompilationData,
  CompilationResultSuccess,
  CompilerOperation,
  CompilerOperationResult,
  IdentifierResolutionFunction,
  MarkedNode,
  Range,
  ResolvedScript,
  ResolvedSegment,
  WalletTemplateVariable,
} from '../lib.js';
import { bigIntToVmNumber } from '../vm/vm.js';

import type { CompilationResult } from './language-types.js';
import {
  IdentifierResolutionErrorType,
  IdentifierResolutionType,
} from './language-types.js';
import { getResolutionErrors, stringifyErrors } from './language-utils.js';
import { parseScript } from './parse.js';
import { reduceScript } from './reduce.js';

const pluckRange = (node: MarkedNode): Range => ({
  endColumn: node.end.column,
  endLineNumber: node.end.line,
  startColumn: node.start.column,
  startLineNumber: node.start.line,
});

const removeNumericSeparators = (numericLiteral: string) =>
  numericLiteral.replace(/_/gu, '');

export const resolveScriptSegment = <ProgramState>(
  segment: CashAssemblyScriptSegment,
  resolveIdentifiers: IdentifierResolutionFunction<ProgramState>,
): ResolvedScript<ProgramState> => {
  // eslint-disable-next-line complexity
  const resolved = segment.value.map<ResolvedSegment<ProgramState>>((child) => {
    const range = pluckRange(child);
    switch (child.name) {
      case 'Identifier': {
        const identifier = child.value;
        const result = resolveIdentifiers(identifier);
        const ret = result.status
          ? {
              range,
              type: 'bytecode' as const,
              value: result.bytecode,
              ...(result.type === IdentifierResolutionType.opcode
                ? {
                    opcode: identifier,
                  }
                : result.type === IdentifierResolutionType.variable
                  ? {
                      ...('debug' in result ? { debug: result.debug } : {}),
                      ...('signature' in result
                        ? { signature: result.signature }
                        : {}),
                      variable: identifier,
                    }
                  : // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    result.type === IdentifierResolutionType.script
                    ? { script: identifier, source: result.source }
                    : ({ unknown: identifier } as never)),
            }
          : {
              ...('debug' in result ? { debug: result.debug } : {}),
              ...('recoverable' in result && result.recoverable
                ? {
                    missingIdentifier: identifier,
                    owningEntity: result.entityOwnership,
                  }
                : {}),
              range,
              type: 'error' as const,
              value: result.error,
            };
        return ret;
      }
      case 'Push':
        return {
          range,
          type: 'push' as const,
          value: resolveScriptSegment(child.value, resolveIdentifiers),
        };
      case 'Evaluation':
        return {
          range,
          type: 'evaluation' as const,
          value: resolveScriptSegment(child.value, resolveIdentifiers),
        };
      case 'BigIntLiteral':
        return {
          literal: child.value,
          literalType: 'BigIntLiteral' as const,
          range,
          type: 'bytecode' as const,
          value: bigIntToVmNumber(BigInt(removeNumericSeparators(child.value))),
        };
      case 'BinaryLiteral':
        return {
          literal: child.value,
          literalType: 'BinaryLiteral' as const,
          range,
          type: 'bytecode' as const,
          value: binStringToBin(removeNumericSeparators(child.value)),
        };
      case 'HexLiteral':
        return {
          literal: child.value,
          literalType: 'HexLiteral' as const,
          range,
          type: 'bytecode' as const,
          value: hexToBin(removeNumericSeparators(child.value)),
        };
      case 'UTF8Literal':
        return {
          literal: child.value,
          literalType: 'UTF8Literal' as const,
          range,
          type: 'bytecode' as const,
          value: utf8ToBin(child.value),
        };
      case 'Comment':
        return {
          range,
          type: 'comment' as const,
          value: child.value,
        };
      default:
        return {
          range,
          type: 'error' as const,
          value: `Unrecognized segment: ${(child as { name: string }).name}`,
        };
    }
  });

  return resolved.length === 0
    ? [{ range: pluckRange(segment), type: 'comment' as const, value: '' }]
    : resolved;
};

export enum BuiltInVariables {
  currentBlockTime = 'current_block_time',
  currentBlockHeight = 'current_block_height',
  signingSerialization = 'signing_serialization',
}

const attemptCompilerOperation = <
  CompilationContext,
  Configuration extends AnyCompilerConfiguration<CompilationContext>,
>({
  data,
  configuration,
  identifier,
  matchingOperations,
  operationExample = 'operation_identifier',
  operationId,
  variableId,
  variableType,
}: {
  data: CompilationData<CompilationContext>;
  configuration: Configuration;
  identifier: string;
  matchingOperations:
    | CompilerOperation<CompilationContext>
    | { [x: string]: CompilerOperation<CompilationContext> | undefined }
    | undefined;
  operationId: string | undefined;
  variableId: string;
  variableType: string;
  operationExample?: string;
}): CompilerOperationResult<true> => {
  if (matchingOperations === undefined) {
    return {
      error: `The "${variableId}" variable type can not be resolved because the "${variableType}" operation has not been included in this compiler's configuration.`,
      status: 'error',
    };
  }
  if (typeof matchingOperations === 'function') {
    const operation = matchingOperations;
    return operation(identifier, data, configuration);
  }
  if (operationId === undefined) {
    return {
      error: `This "${variableId}" variable could not be resolved because this compiler's "${variableType}" operations require an operation identifier, e.g. '${variableId}.${operationExample}'.`,
      status: 'error',
    };
  }
  const operation = matchingOperations[operationId];
  if (operation === undefined) {
    return {
      error: `The identifier "${identifier}" could not be resolved because the "${variableId}.${operationId}" operation is not available to this compiler.`,
      status: 'error',
    };
  }
  return operation(identifier, data, configuration);
};

/**
 * If the identifier can be successfully resolved as a variable, the result is
 * returned as a Uint8Array. If the identifier references a known variable, but
 * an error occurs in resolving it, the error is returned as a string.
 * Otherwise, the identifier is not recognized as a variable, and this method
 * simply returns `false`.
 *
 * @param identifier - The full identifier used to describe this operation, e.g.
 * `owner.signature.all_outputs`.
 * @param data - The {@link CompilationData} provided to the compiler
 * @param configuration - The {@link CompilerConfiguration} provided to
 * the compiler
 */
export const resolveVariableIdentifier = <
  CompilationContext,
  Configuration extends AnyCompilerConfiguration<CompilationContext>,
>({
  data,
  configuration,
  identifier,
}: {
  data: CompilationData<CompilationContext>;
  configuration: Configuration;
  identifier: string;
}): CompilerOperationResult<true> => {
  const [variableId, operationId] = identifier.split('.') as [
    string,
    string | undefined,
  ];

  switch (variableId) {
    case BuiltInVariables.currentBlockHeight:
      return attemptCompilerOperation({
        configuration,
        data,
        identifier,
        matchingOperations: configuration.operations?.currentBlockHeight,
        operationId,
        variableId,
        variableType: 'currentBlockHeight',
      });
    case BuiltInVariables.currentBlockTime:
      return attemptCompilerOperation({
        configuration,
        data,
        identifier,
        matchingOperations: configuration.operations?.currentBlockTime,
        operationId,
        variableId,
        variableType: 'currentBlockTime',
      });
    case BuiltInVariables.signingSerialization:
      return attemptCompilerOperation({
        configuration,
        data,
        identifier,
        matchingOperations: configuration.operations?.signingSerialization,
        operationExample: 'version',
        operationId,
        variableId,
        variableType: 'signingSerialization',
      });
    default: {
      const expectedVariable: WalletTemplateVariable | undefined =
        configuration.variables?.[variableId];

      if (expectedVariable === undefined) {
        return { status: 'skip' };
      }
      return attemptCompilerOperation({
        configuration,
        data,
        identifier,
        operationId,
        variableId,
        ...{
          // eslint-disable-next-line @typescript-eslint/naming-convention
          AddressData: {
            matchingOperations: configuration.operations?.addressData,
            variableType: 'addressData',
          },
          // eslint-disable-next-line @typescript-eslint/naming-convention
          HdKey: {
            matchingOperations: configuration.operations?.hdKey,
            operationExample: 'public_key',
            variableType: 'hdKey',
          },
          // eslint-disable-next-line @typescript-eslint/naming-convention
          Key: {
            matchingOperations: configuration.operations?.key,
            operationExample: 'public_key',
            variableType: 'key',
          },
          // eslint-disable-next-line @typescript-eslint/naming-convention
          WalletData: {
            matchingOperations: configuration.operations?.walletData,
            variableType: 'walletData',
          },
        }[expectedVariable.type],
      });
    }
  }
};

/**
 * A text-formatting method to pretty-print the list of expected inputs
 * (`Encountered unexpected input while parsing script. Expected ...`). If
 * present, the `EOF` expectation is always moved to the end of the list.
 * @param expectedArray - the alphabetized list of expected inputs produced by
 * `parseScript`
 */
export const describeExpectedInput = (expectedArray: string[]) => {
  /**
   * The constant used by the parser to denote the end of the input
   */
  const EOF = 'EOF';
  const newArray = expectedArray.filter((value) => value !== EOF);
  // eslint-disable-next-line functional/no-conditional-statements
  if (newArray.length !== expectedArray.length) {
    // eslint-disable-next-line functional/no-expression-statements, functional/immutable-data
    newArray.push('the end of the script');
  }
  const withoutLastElement = newArray.slice(0, newArray.length - 1);
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const lastElement = newArray[newArray.length - 1]!;
  const arrayRequiresCommas = 3;
  const arrayRequiresOr = 2;
  return `Encountered unexpected input while parsing script. Expected ${
    newArray.length >= arrayRequiresCommas
      ? withoutLastElement.join(', ').concat(`, or ${lastElement}`)
      : newArray.length === arrayRequiresOr
        ? newArray.join(' or ')
        : lastElement
  }.`;
};

export const createEmptyRange = () => ({
  endColumn: 0,
  endLineNumber: 0,
  startColumn: 0,
  startLineNumber: 0,
});

/**
 * This method is generally for internal use. The {@link compileScript} method
 * is the recommended API for direct compilation.
 */
export const compileScriptRaw = <
  ProgramState extends AuthenticationProgramStateControlStack &
    AuthenticationProgramStateMinimum &
    AuthenticationProgramStateStack = AuthenticationProgramStateControlStack &
    AuthenticationProgramStateMinimum &
    AuthenticationProgramStateStack,
  CompilationContext = unknown,
>({
  data,
  configuration,
  scriptId,
}: {
  data: CompilationData<CompilationContext>;
  configuration: AnyCompilerConfiguration<CompilationContext>;
  scriptId: string;
}): CompilationResult<ProgramState> => {
  const script = configuration.scripts[scriptId];
  if (script === undefined) {
    return {
      errorType: 'parse',
      errors: [
        {
          error: `No script with an ID of "${scriptId}" was provided in the compiler configuration.`,
          range: createEmptyRange(),
        },
      ],
      success: false,
    };
  }

  if (configuration.sourceScriptIds?.includes(scriptId) === true) {
    return {
      errorType: 'parse',
      errors: [
        {
          error: `A circular dependency was encountered: script "${scriptId}" relies on itself to be generated. (Source scripts: ${configuration.sourceScriptIds.join(
            ' → ',
          )})`,
          range: createEmptyRange(),
        },
      ],
      success: false,
    };
  }
  const sourceScriptIds =
    configuration.sourceScriptIds === undefined
      ? [scriptId]
      : [...configuration.sourceScriptIds, scriptId];

  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  return compileScriptContents<ProgramState, CompilationContext>({
    configuration: { ...configuration, sourceScriptIds },
    data,
    script,
  });
};

/**
 * Compile an internal script identifier.
 *
 * @remarks
 * If the identifier can be successfully resolved as a script, the script is
 * compiled and returned as a {@link CompilationResultSuccess}. If an error
 * occurs in compiling it, the error is returned as a string.
 *
 * Otherwise, the identifier is not recognized as a script, and this method
 * simply returns `false`.
 */
export const resolveScriptIdentifier = <CompilationContext, ProgramState>({
  data,
  configuration,
  identifier,
}: {
  /**
   * The identifier of the script to be resolved
   */
  identifier: string;
  /**
   * The provided {@link CompilationData}
   */
  data: CompilationData<CompilationContext>;
  /**
   * the provided {@link CompilerConfiguration}
   */
  configuration: AnyCompilerConfiguration<CompilationContext>;
}): CompilationResultSuccess<ProgramState> | string | false => {
  if (configuration.scripts[identifier] === undefined) {
    return false;
  }

  const result = compileScriptRaw({
    configuration,
    data,
    scriptId: identifier,
  });
  if (result.success) {
    return result;
  }

  return `Compilation error in resolved script "${identifier}": ${stringifyErrors(
    result.errors,
  )}`;
};

/**
 * Return an {@link IdentifierResolutionFunction} for use in
 * {@link resolveScriptSegment}.
 *
 * @param scriptId - the `id` of the script for which the resulting
 * `IdentifierResolutionFunction` will be used.
 */
export const createIdentifierResolver =
  <CompilationContext, ProgramState>({
    data,
    configuration,
  }: {
    /**
     * The actual variable values (private keys, shared wallet data, shared
     * address data, etc.) to use in resolving variables.
     */
    data: CompilationData<CompilationContext>;
    /**
     * A snapshot of the configuration around `scriptId`, see
     * {@link CompilerConfiguration} for details
     */
    configuration: AnyCompilerConfiguration<CompilationContext>;
  }): IdentifierResolutionFunction<ProgramState> =>
  // eslint-disable-next-line complexity
  (
    identifier: string,
  ): ReturnType<IdentifierResolutionFunction<ProgramState>> => {
    const opcodeResult: Uint8Array | undefined =
      configuration.opcodes?.[identifier];
    if (opcodeResult !== undefined) {
      return {
        bytecode: opcodeResult,
        status: true,
        type: IdentifierResolutionType.opcode,
      };
    }
    const variableResult = resolveVariableIdentifier({
      configuration,
      data,
      identifier,
    });
    if (variableResult.status !== 'skip') {
      return variableResult.status === 'error'
        ? {
            ...('debug' in variableResult
              ? { debug: variableResult.debug }
              : {}),
            error: variableResult.error,
            ...(configuration.entityOwnership === undefined
              ? {}
              : {
                  entityOwnership:
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    configuration.entityOwnership[identifier.split('.')[0]!],
                }),
            recoverable: 'recoverable' in variableResult,
            status: false,
            type: IdentifierResolutionErrorType.variable,
          }
        : {
            ...('debug' in variableResult
              ? { debug: variableResult.debug }
              : {}),
            bytecode: variableResult.bytecode,
            ...('signature' in variableResult
              ? {
                  signature: variableResult.signature,
                }
              : {}),
            status: true,
            type: IdentifierResolutionType.variable,
          };
    }
    const scriptResult = resolveScriptIdentifier({
      configuration,
      data,
      identifier,
    });
    if (scriptResult !== false) {
      return typeof scriptResult === 'string'
        ? {
            error: scriptResult,
            scriptId: identifier,
            status: false,
            type: IdentifierResolutionErrorType.script,
          }
        : {
            bytecode: scriptResult.bytecode,
            source: scriptResult,
            status: true,
            type: IdentifierResolutionType.script,
          };
    }
    return {
      error: `Unknown identifier "${identifier}".`,
      status: false,
      type: IdentifierResolutionErrorType.unknown,
    };
  };

/**
 * This method is generally for internal use. The {@link compileScript} method
 * is the recommended API for direct compilation.
 */
export const compileScriptContents = <
  ProgramState extends AuthenticationProgramStateControlStack &
    AuthenticationProgramStateStack = AuthenticationProgramStateControlStack &
    AuthenticationProgramStateStack,
  CompilationContext = unknown,
>({
  data,
  configuration,
  script,
}: {
  script: string;
  data: CompilationData<CompilationContext>;
  configuration: AnyCompilerConfiguration<CompilationContext>;
}): CompilationResult<ProgramState> => {
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
            startLineNumber: parseResult.index.line,
          },
        },
      ],
      success: false,
    };
  }
  const resolver = createIdentifierResolver({ configuration, data });
  const resolvedScript = resolveScriptSegment(parseResult.value, resolver);
  const resolutionErrors = getResolutionErrors(resolvedScript);
  if (resolutionErrors.length !== 0) {
    return {
      errorType: 'resolve',
      errors: resolutionErrors,
      parse: parseResult.value,
      resolve: resolvedScript,
      success: false,
    };
  }
  const reduction = reduceScript<ProgramState, unknown, unknown>(
    resolvedScript,
    configuration.vm,
    configuration.createAuthenticationProgram,
  );
  return {
    ...(reduction.errors === undefined
      ? { bytecode: reduction.bytecode, success: true }
      : { errorType: 'reduce', errors: reduction.errors, success: false }),
    parse: parseResult.value,
    reduce: reduction,
    resolve: resolvedScript,
  };
};
