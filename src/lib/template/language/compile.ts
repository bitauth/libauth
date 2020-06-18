import { AuthenticationVirtualMachine } from '../../vm/virtual-machine';
import {
  AuthenticationProgramStateExecutionStack,
  AuthenticationProgramStateMinimum,
  AuthenticationProgramStateStack,
} from '../../vm/vm-types';
import { createCompilerCommonSynchronous } from '../compiler';
import { CompilationData, CompilationEnvironment } from '../compiler-types';

import { CompilationResult, CompilationResultSuccess } from './language-types';
import { getResolutionErrors } from './language-utils';
import { parseScript } from './parse';
import { reduceScript } from './reduce';
import { createIdentifierResolver, resolveScriptSegment } from './resolve';

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
  // eslint-disable-next-line functional/no-conditional-statement
  if (newArray.length !== expectedArray.length) {
    // eslint-disable-next-line functional/no-expression-statement, functional/immutable-data
    newArray.push('the end of the script');
  }
  const withoutLastElement = newArray.slice(0, newArray.length - 1);
  const lastElement = newArray[newArray.length - 1];
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

/**
 * This method is generally for internal use. The `compileScript` method is the
 * recommended API for direct compilation.
 */
export const compileScriptContents = <
  ProgramState extends AuthenticationProgramStateStack &
    AuthenticationProgramStateExecutionStack = AuthenticationProgramStateStack &
    AuthenticationProgramStateExecutionStack,
  TransactionContext = unknown
>({
  data,
  environment,
  script,
}: {
  script: string;
  data: CompilationData<TransactionContext>;
  environment: CompilationEnvironment<TransactionContext>;
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
  const resolver = createIdentifierResolver({ data, environment });
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
  const reduction = reduceScript<ProgramState, unknown>(
    resolvedScript,
    environment.vm,
    environment.createAuthenticationProgram
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

const emptyRange = () => ({
  endColumn: 0,
  endLineNumber: 0,
  startColumn: 0,
  startLineNumber: 0,
});

/**
 * This method is generally for internal use. The `compileScript` method is the
 * recommended API for direct compilation.
 */
export const compileScriptRaw = <
  ProgramState extends AuthenticationProgramStateStack &
    AuthenticationProgramStateExecutionStack &
    AuthenticationProgramStateMinimum = AuthenticationProgramStateStack &
    AuthenticationProgramStateExecutionStack &
    AuthenticationProgramStateMinimum,
  TransactionContext = unknown
>({
  data,
  environment,
  scriptId,
}: {
  data: CompilationData<TransactionContext>;
  environment: CompilationEnvironment<TransactionContext>;
  scriptId: string;
}): CompilationResult<ProgramState> => {
  const script = environment.scripts[scriptId] as string | undefined;
  if (script === undefined) {
    return {
      errorType: 'parse',
      errors: [
        {
          error: `No script with an ID of "${scriptId}" was provided in the compilation environment.`,
          range: emptyRange(),
        },
      ],
      success: false,
    };
  }

  if (environment.sourceScriptIds?.includes(scriptId) === true) {
    return {
      errorType: 'parse',
      errors: [
        {
          error: `A circular dependency was encountered: script "${scriptId}" relies on itself to be generated. (Source scripts: ${environment.sourceScriptIds.join(
            ' → '
          )})`,
          range: emptyRange(),
        },
      ],
      success: false,
    };
  }
  const sourceScriptIds =
    environment.sourceScriptIds === undefined
      ? [scriptId]
      : [...environment.sourceScriptIds, scriptId];

  return compileScriptContents<ProgramState, TransactionContext>({
    data,
    environment: { ...environment, sourceScriptIds },
    script,
  });
};

export const compileScriptP2shLocking = <AuthenticationProgram, ProgramState>({
  lockingBytecode,
  vm,
}: {
  lockingBytecode: Uint8Array;
  vm:
    | AuthenticationVirtualMachine<AuthenticationProgram, ProgramState>
    | undefined;
}) => {
  const compiler = createCompilerCommonSynchronous({
    scripts: {
      p2shLocking: 'OP_HASH160 <$(<lockingBytecode> OP_HASH160)> OP_EQUAL',
    },
    variables: { lockingBytecode: { type: 'AddressData' } },
    vm,
  });
  return compiler.generateBytecode('p2shLocking', {
    bytecode: { lockingBytecode },
  });
};

export const compileScriptP2shUnlocking = <ProgramState>({
  lockingBytecode,
  unlockingBytecode,
}: {
  lockingBytecode: Uint8Array;
  unlockingBytecode: Uint8Array;
}) => {
  const compiler = createCompilerCommonSynchronous({
    scripts: {
      p2shUnlocking: 'unlockingBytecode <lockingBytecode>',
    },
    variables: {
      lockingBytecode: { type: 'AddressData' },
      unlockingBytecode: { type: 'AddressData' },
    },
  });
  return compiler.generateBytecode('p2shUnlocking', {
    bytecode: { lockingBytecode, unlockingBytecode },
  }) as CompilationResultSuccess<ProgramState>;
};

/**
 * Parse, resolve, and reduce the selected script using the provided `data` and
 * `environment`.
 *
 * Note, locktime validation only occurs if `transactionContext` is provided in
 * the environment.
 */
// eslint-disable-next-line complexity
export const compileScript = <
  ProgramState extends AuthenticationProgramStateStack &
    AuthenticationProgramStateExecutionStack &
    AuthenticationProgramStateMinimum = AuthenticationProgramStateStack &
    AuthenticationProgramStateExecutionStack &
    AuthenticationProgramStateMinimum,
  TransactionContext extends { locktime: number; sequenceNumber: number } = {
    locktime: number;
    sequenceNumber: number;
  }
>(
  scriptId: string,
  data: CompilationData<TransactionContext>,
  environment: CompilationEnvironment<TransactionContext>
): CompilationResult<ProgramState> => {
  const locktimeDisablingSequenceNumber = 0xffffffff;
  const lockTimeTypeBecomesTimestamp = 500000000;
  if (data.transactionContext?.locktime !== undefined) {
    if (
      environment.unlockingScriptTimeLockTypes?.[scriptId] === 'height' &&
      data.transactionContext.locktime >= lockTimeTypeBecomesTimestamp
    ) {
      return {
        errorType: 'parse',
        errors: [
          {
            error: `The script "${scriptId}" requires a height-based locktime (less than 500,000,000), but this transaction uses a timestamp-based locktime ("${data.transactionContext.locktime}").`,
            range: emptyRange(),
          },
        ],
        success: false,
      };
    }
    if (
      environment.unlockingScriptTimeLockTypes?.[scriptId] === 'timestamp' &&
      data.transactionContext.locktime < lockTimeTypeBecomesTimestamp
    ) {
      return {
        errorType: 'parse',
        errors: [
          {
            error: `The script "${scriptId}" requires a timestamp-based locktime (greater than or equal to 500,000,000), but this transaction uses a height-based locktime ("${data.transactionContext.locktime}").`,
            range: emptyRange(),
          },
        ],
        success: false,
      };
    }
  }

  if (
    data.transactionContext?.sequenceNumber !== undefined &&
    environment.unlockingScriptTimeLockTypes?.[scriptId] !== undefined &&
    data.transactionContext.sequenceNumber === locktimeDisablingSequenceNumber
  ) {
    return {
      errorType: 'parse',
      errors: [
        {
          error: `The script "${scriptId}" requires a locktime, but this input's sequence number is set to disable transaction locktime (0xffffffff). This will cause the OP_CHECKLOCKTIMEVERIFY operation to error when the transaction is verified. To be valid, this input must use a sequence number which does not disable locktime.`,
          range: emptyRange(),
        },
      ],
      success: false,
    };
  }

  const rawResult = compileScriptRaw<ProgramState, TransactionContext>({
    data,
    environment,
    scriptId,
  });

  if (!rawResult.success) {
    return rawResult;
  }

  const unlocks = environment.unlockingScripts?.[scriptId];
  const unlockingScriptType =
    unlocks === undefined
      ? undefined
      : environment.lockingScriptTypes?.[unlocks];
  const isP2shUnlockingScript = unlockingScriptType === 'p2sh';

  const lockingScriptType = environment.lockingScriptTypes?.[scriptId];
  const isP2shLockingScript = lockingScriptType === 'p2sh';

  if (isP2shLockingScript) {
    const transformedResult = compileScriptP2shLocking<unknown, ProgramState>({
      lockingBytecode: rawResult.bytecode,
      vm: environment.vm,
    });
    if (!transformedResult.success) {
      return transformedResult;
    }
    return {
      ...rawResult,
      bytecode: transformedResult.bytecode,
      transformed: 'p2sh-locking',
    };
  }

  if (isP2shUnlockingScript) {
    const lockingBytecodeResult = compileScriptRaw<
      ProgramState,
      TransactionContext
    >({
      data,
      environment,
      scriptId: unlocks as string,
    });
    if (!lockingBytecodeResult.success) {
      return lockingBytecodeResult;
    }
    const transformedResult = compileScriptP2shUnlocking<ProgramState>({
      lockingBytecode: lockingBytecodeResult.bytecode,
      unlockingBytecode: rawResult.bytecode,
    });
    return {
      ...rawResult,
      bytecode: transformedResult.bytecode,
      transformed: 'p2sh-unlocking',
    };
  }

  return rawResult;
};
