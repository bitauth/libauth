import {
  Compiler,
  CompilerOperationDataCommon,
} from '../template/compiler-types';

import {
  serializeOutpoints,
  serializeOutput,
  serializeOutputsForSigning,
  serializeSequenceNumbersForSigning,
} from './transaction-serialization';
import {
  BytecodeGenerationError,
  Input,
  InputTemplate,
  Output,
  OutputTemplate,
  TransactionGenerationResult,
  TransactionTemplateFixed,
} from './transaction-types';

/**
 *
 * @param outputTemplate -
 * @param index -
 */
export const compileOutputTemplate = <
  CompilerType extends Compiler<CompilerOperationDataCommon, unknown, unknown>
>({
  outputTemplate,
  index,
}: {
  outputTemplate: OutputTemplate<CompilerType>;
  index: number;
}): Output | BytecodeGenerationError => {
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
      : {
          errors: result.errors.map((error) => ({
            ...error,
            error: `Failed compilation of locking directive at index "${index}": ${error.error}`,
          })),
          index,
          ...(result.errorType === 'parse' ? {} : { resolved: result.resolve }),
        };
  }
  return {
    lockingBytecode: outputTemplate.lockingBytecode.slice(),
    satoshis: outputTemplate.satoshis,
  };
};

/**
 * TODO: doc
 */
export const compileInputTemplate = <
  CompilerType extends Compiler<CompilerOperationDataCommon, unknown, unknown>
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
}): Input | BytecodeGenerationError => {
  if ('script' in inputTemplate.unlockingBytecode) {
    const unlockingDirective = inputTemplate.unlockingBytecode;

    const lockingResult = compileOutputTemplate({
      index,
      outputTemplate: unlockingDirective.output,
    });

    if ('errors' in lockingResult) {
      // TODO: do we need to distinguish the errors in the lockingBytecode compilation from errors in the final unlockingBytecode compilation?
      return lockingResult;
    }

    const unlockingResult = unlockingDirective.compiler.generateBytecode(
      unlockingDirective.script,
      {
        ...unlockingDirective.data,
        operationData: {
          correspondingOutput: serializeOutput(outputs[index]),
          coveredBytecode: lockingResult.lockingBytecode,
          locktime: template.locktime,
          outpointIndex: inputTemplate.outpointIndex,
          outpointTransactionHash: inputTemplate.outpointTransactionHash.slice(),
          outputValue: unlockingDirective.output.satoshis,
          sequenceNumber: inputTemplate.sequenceNumber,
          transactionOutpoints: transactionOutpoints.slice(),
          transactionOutputs: serializeOutputsForSigning(outputs),
          transactionSequenceNumbers: transactionSequenceNumbers.slice(),
          version: template.version,
        },
      },
      true
    );

    return unlockingResult.success
      ? {
          outpointIndex: inputTemplate.outpointIndex,
          outpointTransactionHash: inputTemplate.outpointTransactionHash.slice(),
          sequenceNumber: inputTemplate.sequenceNumber,
          unlockingBytecode: unlockingResult.bytecode,
        }
      : {
          errors: unlockingResult.errors.map((error) => ({
            ...error,
            error: `Input ${index}: ${error.error}`,
          })),
          index,
          ...(unlockingResult.errorType === 'parse'
            ? {}
            : { resolved: unlockingResult.resolve }),
        };
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
 * For each `CompilationDirective`, the `operationData` property will be
 * automatically provided to the compiler. All other necessary `CompilationData`
 * properties must be specified in the `TransactionTemplate`.
 *
 * @param template - the `TransactionTemplate` from which to create the
 * `Transaction`
 */
export const generateTransaction = <
  CompilerType extends Compiler<CompilerOperationDataCommon, unknown, unknown>
>(
  template: Readonly<TransactionTemplateFixed<CompilerType>>
): TransactionGenerationResult => {
  const outputResults = template.outputs.map((outputTemplate, index) =>
    compileOutputTemplate({
      index,
      outputTemplate,
    })
  );

  const outputCompilationErrors = outputResults.filter(
    (result): result is BytecodeGenerationError => 'errors' in result
  );
  if (outputCompilationErrors.length > 0) {
    return {
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
  const transactionOutpoints = serializeOutpoints(inputSerializationElements);
  const transactionSequenceNumbers = serializeSequenceNumbersForSigning(
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
    (result): result is BytecodeGenerationError => 'errors' in result
  );

  if (inputCompilationErrors.length > 0) {
    return { errors: inputCompilationErrors, stage: 'inputs', success: false };
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
