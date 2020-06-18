import { CompilationData, Compiler } from '../template/compiler-types';
import {
  CompilationError,
  CompilationResultParseError,
  CompilationResultReduceError,
  CompilationResultResolveError,
} from '../template/language/language-types';
import {
  allErrorsAreRecoverable,
  extractResolvedVariableBytecodeMap,
} from '../template/language/language-utils';

import {
  encodeOutpoints,
  encodeOutput,
  encodeOutputsForSigning,
  encodeSequenceNumbersForSigning,
} from './transaction-serialization';
import {
  BytecodeGenerationCompletionInput,
  BytecodeGenerationCompletionOutput,
  BytecodeGenerationErrorBase,
  BytecodeGenerationErrorLocking,
  BytecodeGenerationErrorUnlocking,
  Input,
  InputTemplate,
  Output,
  OutputTemplate,
  TransactionContextCommon,
  TransactionGenerationAttempt,
  TransactionGenerationError,
  TransactionTemplateFixed,
} from './transaction-types';

const returnFailedCompilationDirective = <
  Type extends 'locking' | 'unlocking'
>({
  index,
  result,
  type,
}: {
  index: number;
  result:
    | CompilationResultParseError
    | CompilationResultResolveError
    | CompilationResultReduceError<unknown>;
  type: Type;
}) => {
  return {
    errors: result.errors.map((error) => ({
      ...error,
      error: `Failed compilation of ${type} directive at index "${index}": ${error.error}`,
    })),
    index,
    ...(result.errorType === 'parse' ? {} : { resolved: result.resolve }),
    type,
  };
};

export const compileOutputTemplate = <
  CompilerType extends Compiler<TransactionContextCommon, unknown, unknown>
>({
  outputTemplate,
  index,
}: {
  outputTemplate: OutputTemplate<CompilerType>;
  index: number;
}): Output | BytecodeGenerationErrorLocking => {
  if ('script' in outputTemplate.lockingBytecode) {
    const directive = outputTemplate.lockingBytecode;
    const data = directive.data === undefined ? {} : directive.data;
    const result = directive.compiler.generateBytecode(
      directive.script,
      data,
      true
    );
    return result.success
      ? {
          lockingBytecode: result.bytecode,
          satoshis: outputTemplate.satoshis,
        }
      : returnFailedCompilationDirective({ index, result, type: 'locking' });
  }
  return {
    lockingBytecode: outputTemplate.lockingBytecode.slice(),
    satoshis: outputTemplate.satoshis,
  };
};

export const compileInputTemplate = <
  CompilerType extends Compiler<TransactionContextCommon, unknown, unknown>
>({
  inputTemplate,
  index,
  outputs,
  template,
  transactionOutpoints,
  transactionSequenceNumbers,
}: {
  inputTemplate: InputTemplate<CompilerType>;
  index: number;
  outputs: Output[];
  template: Readonly<TransactionTemplateFixed<CompilerType>>;
  transactionOutpoints: Uint8Array;
  transactionSequenceNumbers: Uint8Array;
}): Input | BytecodeGenerationErrorUnlocking => {
  if ('script' in inputTemplate.unlockingBytecode) {
    const directive = inputTemplate.unlockingBytecode;
    const correspondingOutput = outputs[index] as Output | undefined;
    const result = directive.compiler.generateBytecode(
      directive.script,
      {
        ...directive.data,
        transactionContext: {
          correspondingOutput:
            correspondingOutput === undefined
              ? undefined
              : encodeOutput(correspondingOutput),
          locktime: template.locktime,
          outpointIndex: inputTemplate.outpointIndex,
          outpointTransactionHash: inputTemplate.outpointTransactionHash.slice(),
          outputValue: directive.satoshis,
          sequenceNumber: inputTemplate.sequenceNumber,
          transactionOutpoints: transactionOutpoints.slice(),
          transactionOutputs: encodeOutputsForSigning(outputs),
          transactionSequenceNumbers: transactionSequenceNumbers.slice(),
          version: template.version,
        },
      },
      true
    );
    return result.success
      ? {
          outpointIndex: inputTemplate.outpointIndex,
          outpointTransactionHash: inputTemplate.outpointTransactionHash.slice(),
          sequenceNumber: inputTemplate.sequenceNumber,
          unlockingBytecode: result.bytecode,
        }
      : returnFailedCompilationDirective({ index, result, type: 'unlocking' });
  }
  return {
    outpointIndex: inputTemplate.outpointIndex,
    outpointTransactionHash: inputTemplate.outpointTransactionHash.slice(),
    sequenceNumber: inputTemplate.sequenceNumber,
    unlockingBytecode: inputTemplate.unlockingBytecode.slice(),
  };
};

/**
 * Generate a `Transaction` given a `TransactionTemplate` and any applicable
 * compilers and compilation data.
 *
 * Returns either a `Transaction` or an array of compilation errors.
 *
 * For each `CompilationDirective`, the `transactionContext` property will be
 * automatically provided to the compiler. All other necessary `CompilationData`
 * properties must be specified in the `TransactionTemplate`.
 *
 * @param template - the `TransactionTemplate` from which to create the
 * `Transaction`
 */
export const generateTransaction = <
  CompilerType extends Compiler<TransactionContextCommon, unknown, unknown>
>(
  template: Readonly<TransactionTemplateFixed<CompilerType>>
): TransactionGenerationAttempt => {
  const outputResults = template.outputs.map((outputTemplate, index) =>
    compileOutputTemplate({
      index,
      outputTemplate,
    })
  );

  const outputCompilationErrors = outputResults.filter(
    (result): result is BytecodeGenerationErrorLocking => 'errors' in result
  );
  if (outputCompilationErrors.length > 0) {
    const outputCompletions = outputResults
      .map<BytecodeGenerationCompletionOutput | BytecodeGenerationErrorLocking>(
        (result, index) =>
          'lockingBytecode' in result
            ? { index, output: result, type: 'output' }
            : result
      )
      .filter(
        (result): result is BytecodeGenerationCompletionOutput =>
          'output' in result
      );
    return {
      completions: outputCompletions,
      errors: outputCompilationErrors,
      stage: 'outputs',
      success: false,
    };
  }
  const outputs = outputResults as Output[];

  const inputSerializationElements = template.inputs.map((inputTemplate) => ({
    outpointIndex: inputTemplate.outpointIndex,
    outpointTransactionHash: inputTemplate.outpointTransactionHash.slice(),
    sequenceNumber: inputTemplate.sequenceNumber,
  }));
  const transactionOutpoints = encodeOutpoints(inputSerializationElements);
  const transactionSequenceNumbers = encodeSequenceNumbersForSigning(
    inputSerializationElements
  );
  const inputResults = template.inputs.map((inputTemplate, index) =>
    compileInputTemplate({
      index,
      inputTemplate,
      outputs,
      template,
      transactionOutpoints,
      transactionSequenceNumbers,
    })
  );

  const inputCompilationErrors = inputResults.filter(
    (result): result is BytecodeGenerationErrorUnlocking => 'errors' in result
  );
  if (inputCompilationErrors.length > 0) {
    const inputCompletions = inputResults
      .map<
        BytecodeGenerationCompletionInput | BytecodeGenerationErrorUnlocking
      >((result, index) =>
        'unlockingBytecode' in result
          ? { index, input: result, type: 'input' }
          : result
      )
      .filter(
        (result): result is BytecodeGenerationCompletionInput =>
          'input' in result
      );
    return {
      completions: inputCompletions,
      errors: inputCompilationErrors,
      stage: 'inputs',
      success: false,
    };
  }
  const inputs = inputResults as Input[];

  return {
    success: true,
    transaction: {
      inputs,
      locktime: template.locktime,
      outputs,
      version: template.version,
    },
  };
};

/**
 * TODO: fundamentally unsound, migrate to PST format
 *
 * Extract a map of successfully resolved variables to their resolved bytecode.
 *
 * @param transactionGenerationError - a transaction generation attempt where
 * `success` is `false`
 */
export const extractResolvedVariables = (
  transactionGenerationError: TransactionGenerationError
) =>
  (transactionGenerationError.errors as BytecodeGenerationErrorBase[]).reduce<{
    [fullIdentifier: string]: Uint8Array;
  }>(
    (all, error) =>
      error.resolved === undefined
        ? all
        : { ...all, ...extractResolvedVariableBytecodeMap(error.resolved) },
    {}
  );

/**
 * TODO: fundamentally unsound, migrate to PST format
 *
 * Given an unsuccessful transaction generation result, extract a map of the
 * identifiers missing from the compilation mapped to the entity which owns each
 * variable.
 *
 * Returns `false` if any errors are fatal (the error either cannot be resolved
 * by providing a variable, or the entity ownership of the required variable was
 * not provided in the compilation data).
 *
 * @param transactionGenerationError - a transaction generation result where
 * `success` is `false`
 */
export const extractMissingVariables = (
  transactionGenerationError: TransactionGenerationError
) => {
  const allErrors = (transactionGenerationError.errors as BytecodeGenerationErrorBase[]).reduce<
    CompilationError[]
  >((all, error) => [...all, ...error.errors], []);

  if (!allErrorsAreRecoverable(allErrors)) {
    return false;
  }

  return allErrors.reduce<{ [fullIdentifier: string]: string }>(
    (all, error) => ({
      ...all,
      [error.missingIdentifier]: error.owningEntity,
    }),
    {}
  );
};

/**
 * TODO: fundamentally unsound, migrate to PST format
 *
 * Safely extend a compilation data with resolutions provided by other entities
 * (via `extractResolvedVariables`).
 *
 * It is security-critical that compilation data only be extended with expected
 * identifiers from the proper owning entity of each variable. See
 * `CompilationData.bytecode` for details.
 *
 * Returns `false` if any errors are fatal (the error either cannot be resolved
 * by providing a variable, or the entity ownership of the required variable was
 * not provided in the compilation data).
 *
 * @remarks
 * To determine which identifiers are required by a given compilation, the
 * compilation is first attempted with only trusted variables: variables owned
 * or previously verified (like `WalletData`) by the compiling entity. If this
 * compilation produces a `TransactionGenerationError`, the error can be
 * provided to `safelyExtendCompilationData`, along with the trusted compilation
 * data and a mapping of untrusted resolutions (where the result of
 * `extractResolvedVariables` is assigned to the entity ID of the entity from
 * which they were received).
 *
 * The first compilation must use only trusted compilation data
 */
export const safelyExtendCompilationData = <
  TransactionContext = TransactionContextCommon
>(
  transactionGenerationError: TransactionGenerationError,
  trustedCompilationData: CompilationData<TransactionContext>,
  untrustedResolutions: {
    [providedByEntityId: string]: ReturnType<typeof extractResolvedVariables>;
  }
): false | CompilationData<TransactionContext> => {
  const missing = extractMissingVariables(transactionGenerationError);
  if (missing === false) return false;
  const selectedResolutions = Object.entries(missing).reduce<{
    [fullIdentifier: string]: Uint8Array;
  }>((all, [identifier, entityId]) => {
    const entityResolution = untrustedResolutions[entityId] as
      | {
          [fullIdentifier: string]: Uint8Array;
        }
      | undefined;
    if (entityResolution === undefined) {
      return all;
    }
    const resolution = entityResolution[identifier] as Uint8Array | undefined;
    if (resolution === undefined) {
      return all;
    }
    return { ...all, [identifier]: resolution };
  }, {});
  return {
    ...trustedCompilationData,
    bytecode: {
      ...selectedResolutions,
      ...trustedCompilationData.bytecode,
    },
  };
};
