import { Secp256k1, Sha256 } from '../../../lib';
import { hexToBin, utf8ToBin } from '../../../utils/utils';
import {
  AuthenticationInstruction,
  AuthenticationVirtualMachine,
  bigIntToScriptNumber
} from '../../auth';
import { AuthenticationTemplateVariable } from '../types';

import { CompilationResultSuccess, compileScript } from './compile';
import { BtlScriptSegment, MarkedNode } from './parse';

export interface Range {
  endColumn: number;
  endLineNumber: number;
  startColumn: number;
  startLineNumber: number;
}

const pluckRange = (node: MarkedNode): Range => ({
  endColumn: node.end.column,
  endLineNumber: node.end.line,
  startColumn: node.start.column,
  startLineNumber: node.start.line
});

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
  script = 'script'
}

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
  | { error: string; status: false };

enum Constants {
  hexByte = 2
}

export const resolveScriptSegment = (
  segment: BtlScriptSegment,
  resolveIdentifiers: IdentifierResolutionFunction
): ResolvedScript => {
  // tslint:disable-next-line: cyclomatic-complexity
  const resolved = segment.value.map<ResolvedSegment>(child => {
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
                    opcode: identifier
                  }
                : result.type === IdentifierResolutionType.variable
                ? {
                    variable: identifier
                  }
                : // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                result.type === IdentifierResolutionType.script
                ? { script: identifier, source: result.source }
                : ({ unknown: identifier } as never))
            }
          : {
              range,
              type: 'error' as const,
              value: result.error
            };
        return ret;
      }
      case 'Push':
        return {
          range,
          type: 'push' as const,
          value: resolveScriptSegment(child.value, resolveIdentifiers)
        };
      case 'Evaluation':
        return {
          range,
          type: 'evaluation' as const,
          value: resolveScriptSegment(child.value, resolveIdentifiers)
        };
      case 'BigIntLiteral':
        return {
          literalType: 'BigIntLiteral' as const,
          range,
          type: 'bytecode' as const,
          value: bigIntToScriptNumber(child.value)
        };
      case 'HexLiteral':
        return child.value.length % Constants.hexByte === 0
          ? {
              literalType: 'HexLiteral' as const,
              range,
              type: 'bytecode' as const,
              value: hexToBin(child.value)
            }
          : {
              range,
              type: 'error' as const,
              value: `Improperly formed HexLiteral. HexLiteral must have a length divisible by 2, but this HexLiteral has a length of ${child.value.length}.`
            };
      case 'UTF8Literal':
        return {
          literalType: 'UTF8Literal' as const,
          range,
          type: 'bytecode' as const,
          value: utf8ToBin(child.value)
        };
      case 'Comment':
        return {
          range,
          type: 'comment' as const,
          value: child.value
        };
      default:
        return {
          range,
          type: 'error' as const,
          value: `Unrecognized segment: ${child}`
        };
    }
  });

  return resolved.length === 0
    ? [{ range: pluckRange(segment), type: 'comment' as const, value: '' }]
    : resolved;
};

export type CompilerOperationTypes =
  | AuthenticationTemplateVariable['type']
  | 'SigningSerialization';

/**
 * Returns the bytecode result on success or an error message on failure.
 */
export type CompilerOperation<
  CompilerOperationData = {},
  Checked extends CompilerOperationTypes | undefined = undefined
> = (
  identifier: string,
  compilationData: Checked extends 'Key'
    ? Required<Pick<CompilationData<CompilerOperationData>, 'keys'>> &
        CompilationData<CompilerOperationData>
    : Checked extends 'HDKey'
    ? Required<Pick<CompilationData<CompilerOperationData>, 'hdKeys'>> &
        CompilationData<CompilerOperationData>
    : Checked extends 'WalletData'
    ? Required<Pick<CompilationData<CompilerOperationData>, 'walletData'>> &
        CompilationData<CompilerOperationData>
    : Checked extends 'AddressData'
    ? Required<Pick<CompilationData<CompilerOperationData>, 'addressData'>> &
        CompilationData<CompilerOperationData>
    : CompilationData<CompilerOperationData>,
  compilationEnvironment: CompilationEnvironment<CompilerOperationData>
) => Uint8Array | string;

export type CompilerOperationsMinimal = 'public_key' | 'signature';

/**
 * The full context required to compile a given Bitauth Template – everything
 * required for the compiler to generate the final script code (targeting a
 * specific `AuthenticationVirtualMachine`).
 *
 * A `CompilationEnvironment` must include a subset of the script's
 * `AuthenticationTemplate` – all the variables and scripts referenced
 * (including children of children) by the script in question.
 *
 * The context must also include an object mapping of opcode identifiers to the
 * bytecode they generate.
 *
 * If keys are used, an implementation of `sha256` and `secp256k1` is
 * required. If the script requires evaluations during compilation, the
 * evaluating `AuthenticationVirtualMachine` must also be included.
 */
export interface CompilationEnvironment<
  CompilerOperationData = {},
  CompilerOperations extends string = CompilerOperationsMinimal
> {
  /**
   * A method which accepts an array of `AuthenticationInstruction`s, and
   * returns a ProgramState. This method will be used to generate the initial
   * ProgramState for `evaluation`s.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createState?: (instructions: AuthenticationInstruction<any>[]) => any;
  /**
   * An object mapping opcode identifiers to the bytecode they generate.
   */
  // eslint-disable-next-line functional/no-mixed-type
  opcodes?: {
    [opcodeIdentifier: string]: Uint8Array;
  };
  /**
   * An object specifying the operations made available by this
   * CompilationEnvironment for each variable type, e.g. keys may support public
   * key derivation and multiple signature types.
   */
  operations?: {
    [key in CompilerOperationTypes]?: {
      [operationId in CompilerOperations]?: CompilerOperation<
        CompilerOperationData,
        key
      >;
    };
  };
  /**
   * An object mapping script identifiers to the text of script in Bitauth
   * Templating Language.
   *
   * To avoid compilation errors, this object must contain all scripts
   * referenced by the script being compiled (including children of children).
   */
  scripts: {
    [scriptId: string]: string;
  };
  /**
   * An implementation of secp256k1 is required for any scripts which include
   * signatures.
   */
  secp256k1?: Secp256k1;
  /**
   * An implementation of sha256 is required for any scripts which include
   * signatures.
   */
  sha256?: Sha256;
  /**
   * The "breadcrumb" path of script IDs currently being resolved. (E.g.
   * `["grandparentId", "parentId"]`) BTL identifier resolution must be acyclic.
   *
   * To prevent an infinite loop, `IdentifierResolutionFunction`s must abort
   * resolution if they encounter their own `id` while resolving another
   * identifier. Likewise, child scripts being resolved by a parent script
   * may not reference any script which is already in the process of being
   * resolved.
   */
  sourceScriptIds?: string[];
  /**
   * An object mapping Bitauth variable identifiers to the
   * `AuthenticationTemplateVariable` describing them.
   *
   * To avoid compilation errors, this object must contain all variables
   * referenced by the script being compiled (including in child scripts).
   */
  variables?: {
    [variableId: string]: AuthenticationTemplateVariable;
  };
  /**
   * The AuthenticationVirtualMachine on which BTL `evaluation` results will be
   * computed.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  vm?: AuthenticationVirtualMachine<any, any>;
}

export interface CompilationData<CompilerOperationData> {
  addressData?: {
    [id: string]: Uint8Array;
  };
  currentBlockHeight?: number;
  currentBlockTime?: Date;
  /**
   * TODO: implement `HDKeys` support (similar to `keys`, `HDKeys` simply takes `index` and `derivationHardened` into account. Note: no current plans to support more complex paths, users needing that kind of control should use `keys` manually.)
   */
  hdKeys?: {
    /**
     * TODO: describe that `derivationHardened` and `index` refer to the script derivation index and hardening settings. (The parent account is controlled by `templateDerivationIndex` and `templateDerivationHardened` in `CompilerEnvironment.variables`)
     */
    derivationHardened?: boolean;
    index: number;
    privateHdKeys?: {
      [id: string]: Uint8Array;
    };
    publicHdKeys?: {
      [id: string]: Uint8Array;
    };
    signatures?: {
      [id: string]: Uint8Array;
    };
  };
  keys?: {
    privateKeys?: {
      [id: string]: Uint8Array;
    };
    publicKeys?: {
      [id: string]: Uint8Array;
    };
    /**
     * Signatures provided to us by other entities. Since we don't have their
     * private key, we'll need them to send us a valid signature to include in
     * the proper spots. The provided `id` should match the full identifier for
     * the signature, e.g. `variable.signature.all_outputs`.
     */
    signatures?: {
      [id: string]: Uint8Array;
    };
  };
  operationData?: CompilerOperationData;
  walletData?: {
    [id: string]: Uint8Array;
  };
}

enum Time {
  msPerLocktimeSecond = 1000
}

const dateToLockTime = (date: Date) =>
  bigIntToScriptNumber(
    BigInt(Math.round(date.getTime() / Time.msPerLocktimeSecond))
  );

const articleAndVariableType = (variableType: CompilerOperationTypes) =>
  `${variableType === 'HDKey' ? 'an' : 'a'} ${variableType}`;

const attemptCompilerOperation = <CompilerOperationData>(
  identifier: string,
  operationId: string,
  variableType: CompilerOperationTypes,
  environment: CompilationEnvironment<CompilerOperationData>,
  data: CompilationData<CompilerOperationData>
) => {
  // tslint:disable-next-line: no-if-statement
  if (environment.operations !== undefined) {
    const operationsForType = environment.operations[variableType];
    if (operationsForType !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const operation = (operationsForType as any)[operationId] as
        | CompilerOperation<CompilerOperationData, typeof variableType>
        | undefined;
      // tslint:disable-next-line: no-if-statement
      if (operation !== undefined) {
        return operation(
          identifier,
          data as Required<typeof data>,
          environment
        );
      }
    }
  }
  return `Identifer "${identifier}" refers to ${articleAndVariableType(
    variableType
  )} operation "${operationId}" which is not available to this compiler.`;
};

const variableTypeToDataProperty: {
  [type in AuthenticationTemplateVariable['type']]: keyof CompilationData<{}>;
} = {
  AddressData: 'addressData',
  HDKey: 'hdKeys',
  Key: 'keys',
  WalletData: 'walletData'
};

const defaultActionByVariableType: {
  [type in AuthenticationTemplateVariable['type']]: <CompilerOperationData>(
    identifier: string,
    data: CompilationData<CompilerOperationData>,
    variableId: string
  ) => string | Uint8Array;
} = {
  AddressData: (identifier, data, variableId) =>
    data.addressData !== undefined &&
    (data.addressData[variableId] as Uint8Array | undefined) !== undefined
      ? data.addressData[variableId]
      : `Identifier "${identifier}" refers to an AddressData, but no AddressData for "${variableId}" were provided in the compilation data.`,
  HDKey: identifier =>
    `Identifier "${identifier}" refers to an HDKey, but does not specify an operation, e.g. "${identifier}.public_key".`,
  Key: identifier =>
    `Identifier "${identifier}" refers to a Key, but does not specify an operation, e.g. "${identifier}.public_key".`,
  WalletData: (identifier, data, variableId) =>
    data.walletData !== undefined &&
    (data.walletData[variableId] as Uint8Array | undefined) !== undefined
      ? data.walletData[variableId]
      : `Identifier "${identifier}" refers to a WalletData, but no WalletData for "${variableId}" were provided in the compilation data.`
};

const aOrAnQuotedString = (word: string) =>
  `${
    ['a', 'e', 'i', 'o', 'u'].includes(word[0].toLowerCase()) ? 'an' : 'a'
  } "${word}"`;

export enum BuiltInVariables {
  currentBlockTime = 'current_block_time',
  currentBlockHeight = 'current_block_height',
  signingSerialization = 'signing_serialization'
}

/**
 * If the identifer can be successfully resolved as a variable, the result is
 * returned as a Uint8Array. If the identifier references a known variable, but
 * an error occurs in resolving it, the error is returned as a string.
 * Otherwise, the identifier is not recognized as a variable, and this method
 * simply returns `false`.
 */
// tslint:disable-next-line: cyclomatic-complexity
export const resolveAuthenticationTemplateVariable = <CompilerOperationData>(
  identifier: string,
  environment: CompilationEnvironment<CompilerOperationData>,
  data: CompilationData<CompilerOperationData>
): Uint8Array | string | false => {
  const splitId = identifier.split('.');
  const variableId = splitId[0]; // eslint-disable-line prefer-destructuring
  const operationId = splitId[1] as string | undefined;

  switch (variableId) {
    case BuiltInVariables.currentBlockHeight:
      return data.currentBlockHeight === undefined
        ? 'Tried to resolve the built-in variable "current_block_height", but the "currentBlockHeight" property was not provided in the compilation data.'
        : bigIntToScriptNumber(BigInt(data.currentBlockHeight));
    case BuiltInVariables.currentBlockTime:
      return data.currentBlockTime === undefined
        ? 'Tried to resolve the built-in variable "current_block_time", but the "currentBlockTime" property was not provided in the compilation data.'
        : dateToLockTime(data.currentBlockTime);
    case BuiltInVariables.signingSerialization:
      return operationId === undefined
        ? 'Tried to resolve an operation for the built-in variable "signing_serialization", but no operation was provided. Provide an operation like "signing_serialization.[operation]".'
        : attemptCompilerOperation(
            identifier,
            operationId,
            'SigningSerialization',
            environment,
            data
          );
    default: {
      const selected =
        environment.variables &&
        (environment.variables[variableId] as
          | AuthenticationTemplateVariable
          | undefined);
      // tslint:disable-next-line: no-if-statement
      if (selected === undefined) {
        return false;
      }
      return data[variableTypeToDataProperty[selected.type]] === undefined
        ? `Identifier "${identifier}" is a ${
            selected.type
          }, but the compilation data does not include ${aOrAnQuotedString(
            variableTypeToDataProperty[selected.type]
          )} property.`
        : operationId === undefined
        ? defaultActionByVariableType[selected.type](
            identifier,
            data,
            variableId
          )
        : attemptCompilerOperation(
            identifier,
            operationId,
            selected.type,
            environment,
            data
          );
    }
  }
};

/**
 * Compile an internal script identifier.
 *
 * @remarks
 * If the identifer can be successfully resolved as a script, the script is
 * compiled and returned as a CompilationResultSuccess. If an error occurs in
 * compiling it, the error is returned as a string.
 *
 * Otherwise, the identifier is not recognized as a script, and this method
 * simply returns `false`.
 *
 * @param identifier the identifier of the script to be resolved
 * @param data the provided CompilationData
 * @param environment the provided CompilationEnvironment
 * @param parentIdentifier the identifier of the script which references the
 * script being resolved (for detecting circular dependencies)
 */
// tslint:disable-next-line: cyclomatic-complexity
export const resolveScriptIdentifier = <CompilerOperationData, ProgramState>(
  identifier: string,
  data: CompilationData<CompilerOperationData>,
  environment: CompilationEnvironment<CompilerOperationData>,
  parentIdentifier?: string
): CompilationResultSuccess<ProgramState> | string | false => {
  // tslint:disable-next-line: no-if-statement
  if ((environment.scripts[identifier] as string | undefined) === undefined) {
    return false;
  }
  // tslint:disable-next-line: no-if-statement
  if (
    parentIdentifier !== undefined &&
    environment.sourceScriptIds !== undefined &&
    environment.sourceScriptIds.includes(parentIdentifier)
  ) {
    return `A circular dependency was encountered. Script "${identifier}" relies on itself to be generated. (Parent scripts: ${environment.sourceScriptIds.join(
      ', '
    )})`;
  }
  const result = compileScript(identifier, data, {
    ...environment,
    sourceScriptIds: [
      ...(environment.sourceScriptIds === undefined
        ? []
        : environment.sourceScriptIds),
      ...(parentIdentifier === undefined ? [] : [parentIdentifier])
    ]
  });
  return result.success
    ? result
    : `Compilation error in resolved script, ${identifier}: ${result.errors
        .map(
          ({ error, range }) =>
            `${error} [${range.startLineNumber}, ${range.startColumn}]`
        )
        .join(', ')}`;
};

/**
 * Return an `IdentifierResolutionFunction` for use in `resolveScriptSegment`.
 *
 * @param scriptId the `id` of the script for which the resulting
 * `IdentifierResolutionFunction` will be used.
 * @param environment a snapshot of the context around `scriptId`. See
 * `CompilationEnvironment` for details.
 * @param data the actual variable values (private keys, shared wallet data,
 * shared address data, etc.) to use in resolving variables.
 */
export const createIdentifierResolver = <CompilerOperationData>(
  scriptId: string | undefined,
  data: CompilationData<CompilerOperationData>,
  environment: CompilationEnvironment<CompilerOperationData>
): IdentifierResolutionFunction =>
  // tslint:disable-next-line: cyclomatic-complexity
  (identifier: string) => {
    const opcodeResult: Uint8Array | undefined =
      environment.opcodes &&
      (environment.opcodes[identifier] as Uint8Array | undefined);
    // tslint:disable-next-line: no-if-statement
    if (opcodeResult !== undefined) {
      return {
        bytecode: opcodeResult,
        status: true,
        type: IdentifierResolutionType.opcode
      };
    }
    const variableResult = resolveAuthenticationTemplateVariable(
      identifier,
      environment,
      data
    );
    // tslint:disable-next-line: no-if-statement
    if (variableResult !== false) {
      return typeof variableResult === 'string'
        ? { error: variableResult, status: false }
        : {
            bytecode: variableResult,
            status: true,
            type: IdentifierResolutionType.variable
          };
    }
    const scriptResult = resolveScriptIdentifier(
      identifier,
      data,
      environment,
      scriptId
    );
    // tslint:disable-next-line: no-if-statement
    if (scriptResult !== false) {
      return typeof scriptResult === 'string'
        ? { error: scriptResult, status: false }
        : {
            bytecode: scriptResult.bytecode,
            source: scriptResult.resolve,
            status: true,
            type: IdentifierResolutionType.script
          };
    }
    return { error: `Unknown identifier '${identifier}'.`, status: false };
  };
