import {
  Input,
  Output,
  serializeOutpoints,
  serializeOutput,
  serializeOutputsForSigning,
  serializeSequenceNumbers,
  Transaction,
} from '../../transaction';
import { AuthenticationProgramStateBCH } from '../instruction-sets/instruction-sets';

import {
  Compiler,
  CompilerOperationDataBCH,
  createCompilerBCH,
} from './compiler';
import { CompilationError } from './language/compile';
import { CompilationData, CompilationEnvironment } from './language/resolve';
import {
  AuthenticationTemplate,
  AuthenticationTemplateVariable,
} from './types';

/**
 * TODO: finish implementing
 * - validate all types
 * - enforce no duplicate IDs (all must be unique among entities, variables, and scripts)
 *
 * Parse and validate an authentication template, returning either an error
 * message or the validated `AuthenticationTemplate`.
 * @param maybeTemplate - object to validate as an authentication template
 */
// tslint:disable-next-line: no-any
export const validateAuthenticationTemplate = (
  maybeTemplate: unknown
): string | AuthenticationTemplate => {
  // tslint:disable-next-line: no-if-statement
  if (typeof maybeTemplate !== 'object' || maybeTemplate === null) {
    return 'A valid AuthenticationTemplate must be an object.';
  }
  // tslint:disable-next-line: no-if-statement
  if ((maybeTemplate as { version?: unknown }).version !== 0) {
    return 'Only version 0 authentication templates are currently supported.';
  }
  // TODO: finish
  return maybeTemplate as AuthenticationTemplate;
};

/**
 * Create a partial `CompilationEnvironment` from an `AuthenticationTemplate` by
 * extracting and formatting the `scripts` and `variables` properties.
 *
 * Note, if this `AuthenticationTemplate` might be malformed, first validate it
 * with `validateAuthenticationTemplate`.
 *
 * @param template - the `AuthenticationTemplate` from which to extract the
 * compilation environment
 */
export const authenticationTemplateToCompilationEnvironment = (
  template: AuthenticationTemplate
) => {
  const scripts = Object.entries(template.scripts).reduce<{
    [scriptId: string]: string;
  }>((all, [id, def]) => ({ ...all, [id]: def.script }), {});
  const variables = Object.values(template.entities).reduce<{
    [variableId: string]: AuthenticationTemplateVariable;
  }>((all, entity) => ({ ...all, ...entity.variables }), {});
  return { scripts, variables };
};

/**
 * Create a BCH `Compiler` from an `AuthenticationTemplate` and an optional set
 * of overrides.
 * @param template - the `AuthenticationTemplate` from which to create the BCH
 * compiler
 * @param overrides - a compilation environment from which properties will be
 * used to override properties of the default BCH environment
 */
export const authenticationTemplateToCompilerBCH = async <
  CompilerOperationData extends CompilerOperationDataBCH,
  ProgramState extends AuthenticationProgramStateBCH
>(
  template: AuthenticationTemplate,
  overrides?: CompilationEnvironment<CompilerOperationData>
): Promise<Compiler<CompilerOperationData, ProgramState>> =>
  createCompilerBCH({
    ...overrides,
    ...authenticationTemplateToCompilationEnvironment(template),
  });

export interface CompilationDirective<CompilationDataType, CompilerType> {
  compiler: CompilerType;
  data?: CompilationDataType;
  script: string;
}

export interface CompilationDirectiveUnlocking<
  CompilationDataType,
  CompilerType
> extends CompilationDirective<CompilationDataType, CompilerType> {
  output: Output<
    CompilationDirective<CompilationDataType, CompilerType> | Uint8Array
  >;
}

export type InputTemplate<CompilationDataType, CompilerType> = Input<
  CompilationDirectiveUnlocking<CompilationDataType, CompilerType> | Uint8Array
>;

export type OutputTemplate<CompilationDataType, CompilerType> = Output<
  CompilationDirective<CompilationDataType, CompilerType> | Uint8Array
>;

export type TransactionTemplate<
  CompilationDataType,
  CompilerType
> = Transaction<
  InputTemplate<CompilationDataType, CompilerType>,
  OutputTemplate<CompilationDataType, CompilerType>
>;

export type TransactionGenerationResult =
  | { success: true; transaction: Transaction }
  | { success: false; errors: CompilationError[] };

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
 * Note: this method does not currently support the correct signing of inputs
 * utilizing `OP_CODESEPARATOR`. Transactions including these inputs will be
 * invalid.
 *
 * @param template - the `TransactionTemplate` from which to create the
 * `Transaction`
 */
export const generateTransactionBCH = <
  CompilerType extends Compiler<CompilerOperationDataBCH, unknown>
>(
  template: Readonly<TransactionTemplate<CompilationData<never>, CompilerType>>
): TransactionGenerationResult => {
  const outputResults = template.outputs.map<Output | CompilationError[]>(
    (outputTemplate, outputIndex) => {
      // tslint:disable-next-line: no-if-statement
      if ('script' in outputTemplate.lockingBytecode) {
        const directive = outputTemplate.lockingBytecode;
        const data = directive.data === undefined ? {} : directive.data;
        const result = directive.compiler.generateBytecode(
          directive.script,
          data
        );
        return result.success
          ? {
              lockingBytecode: result.bytecode,
              satoshis: outputTemplate.satoshis,
            }
          : result.errors.map((error) => ({
              error: `Output ${outputIndex}: ${error.error}`,
              range: error.range,
            }));
      }
      return {
        lockingBytecode: outputTemplate.lockingBytecode.slice(),
        satoshis: outputTemplate.satoshis,
      };
    }
  );

  const outputCompilationErrors = outputResults
    .filter((output): output is CompilationError[] => Array.isArray(output))
    .reduce((all, entry) => [...all, ...entry], []);
  // tslint:disable-next-line: no-if-statement
  if (outputCompilationErrors.length > 0) {
    return { errors: outputCompilationErrors, success: false };
  }
  const outputs = outputResults as Output[];

  const inputSerializationElements = template.inputs.map((inputTemplate) => ({
    outpointIndex: inputTemplate.outpointIndex,
    outpointTransactionHash: inputTemplate.outpointTransactionHash.slice(),
    sequenceNumber: inputTemplate.sequenceNumber,
  }));
  const transactionOutpoints = serializeOutpoints(inputSerializationElements);
  const transactionSequenceNumbers = serializeSequenceNumbers(
    inputSerializationElements
  );
  const inputResults = template.inputs.map<Input | CompilationError[]>(
    // eslint-disable-next-line complexity
    (inputTemplate, inputIndex) => {
      // eslint-disable-next-line functional/no-let, init-declarations
      let unlockingBytecode: Uint8Array;
      if ('script' in inputTemplate.unlockingBytecode) {
        const unlockingDirective = inputTemplate.unlockingBytecode;

        // eslint-disable-next-line functional/no-let, init-declarations
        let lockingBytecode: Uint8Array;

        if ('script' in unlockingDirective.output.lockingBytecode) {
          const lockingDirective = unlockingDirective.output.lockingBytecode;
          const data =
            lockingDirective.data === undefined ? {} : lockingDirective.data;
          const lockingResult = lockingDirective.compiler.generateBytecode(
            lockingDirective.script,
            data
          );

          if (!lockingResult.success) {
            return lockingResult.errors.map((error) => ({
              error: `Input ${inputIndex} – Output Directive: ${error.error}`,
              range: error.range,
            }));
          }

          // eslint-disable-next-line functional/no-expression-statement
          lockingBytecode = lockingResult.bytecode;
          // eslint-disable-next-line functional/no-conditional-statement
        } else {
          // eslint-disable-next-line functional/no-expression-statement
          lockingBytecode = unlockingDirective.output.lockingBytecode.slice();
        }
        const operationData: CompilerOperationDataBCH = {
          correspondingOutput: serializeOutput(outputs[inputIndex]),
          coveredBytecode: lockingBytecode,
          locktime: template.locktime,
          outpointIndex: inputTemplate.outpointIndex,
          outpointTransactionHash: inputTemplate.outpointTransactionHash.slice(),
          outputValue: unlockingDirective.output.satoshis,
          sequenceNumber: inputTemplate.sequenceNumber,
          transactionOutpoints: transactionOutpoints.slice(),
          transactionOutputs: serializeOutputsForSigning(outputs),
          transactionSequenceNumbers: transactionSequenceNumbers.slice(),
          version: template.version,
        };
        const unlockingResult = unlockingDirective.compiler.generateBytecode(
          unlockingDirective.script,
          {
            ...unlockingDirective.data,
            operationData,
          }
        );
        // tslint:disable-next-line: no-if-statement
        if (!unlockingResult.success) {
          return unlockingResult.errors.map((error) => ({
            error: `Input ${inputIndex}: ${error.error}`,
            range: error.range,
          }));
        }
        // eslint-disable-next-line functional/no-expression-statement
        unlockingBytecode = unlockingResult.bytecode;
        // eslint-disable-next-line functional/no-conditional-statement
      } else {
        // eslint-disable-next-line functional/no-expression-statement
        unlockingBytecode = inputTemplate.unlockingBytecode.slice();
      }
      return {
        outpointIndex: inputTemplate.outpointIndex,
        outpointTransactionHash: inputTemplate.outpointTransactionHash.slice(),
        sequenceNumber: inputTemplate.sequenceNumber,
        unlockingBytecode,
      };
    }
  );

  const inputCompilationErrors = inputResults
    .filter((output): output is CompilationError[] => Array.isArray(output))
    .reduce((all, entry) => [...all, ...entry], []);
  if (inputCompilationErrors.length > 0) {
    return { errors: inputCompilationErrors, success: false };
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
