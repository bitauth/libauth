import { Secp256k1, Sha256 } from '../../../lib';
import { hexToBin, utf8ToBin } from '../../../utils/utils';
import {
  AuthenticationInstruction,
  AuthenticationVirtualMachine,
  bigIntToScriptNumber
} from '../../auth';
import { AuthenticationTemplateVariable } from '../types';

import { compileScript } from './compile';
import { BitAuthScriptSegment, MarkedNode } from './parse';

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

interface ResolvedSegmentPush<T> extends ResolvedSegmentBase {
  type: 'push';
  value: T;
}

interface ResolvedSegmentEvaluation<T> extends ResolvedSegmentBase {
  type: 'evaluation';
  value: T;
}

interface ResolvedSegmentBytecode extends ResolvedSegmentBase {
  type: 'bytecode';
  value: Uint8Array;
  variable?: string;
}

interface ResolvedSegmentComment extends ResolvedSegmentBase {
  type: 'comment';
  value: string;
}

interface ResolvedSegmentError extends ResolvedSegmentBase {
  type: 'error';
  value: string;
}

type ResolvedSegment =
  | ResolvedSegmentPush<ResolvedScript>
  | ResolvedSegmentEvaluation<ResolvedScript>
  | ResolvedSegmentBytecode
  | ResolvedSegmentComment
  | ResolvedSegmentError;

export interface ResolvedScript extends Array<ResolvedSegment> {}

export enum IdentifierResolutionType {
  opcode = 'opcode',
  variable = 'variable',
  script = 'script',
  unknown = 'unknown'
}

export type IdentifierResolutionFunction = (
  identifier: string
) =>
  | { bytecode: Uint8Array; status: true; type: IdentifierResolutionType }
  | { error: string; status: false };

enum Constants {
  hexByte = 2
}

export const resolveScriptSegment = (
  segment: BitAuthScriptSegment,
  resolveIdentifiers: IdentifierResolutionFunction
): ResolvedScript => {
  // tslint:disable-next-line: cyclomatic-complexity
  const resolved = segment.value.map(child => {
    const range = pluckRange(child);
    switch (child.name) {
      case 'Identifier':
        const identifier = child.value;
        const result = resolveIdentifiers(identifier);
        return result.status
          ? {
              range,
              type: 'bytecode' as 'bytecode',
              value: result.bytecode,
              ...(result.type === IdentifierResolutionType.variable
                ? {
                    variable: identifier
                  }
                : undefined)
            }
          : {
              range,
              type: 'error' as 'error',
              value: result.error
            };
      case 'Push':
        return {
          range,
          type: 'push' as 'push',
          value: resolveScriptSegment(child.value, resolveIdentifiers)
        };
      case 'Evaluation':
        return {
          range,
          type: 'evaluation' as 'evaluation',
          value: resolveScriptSegment(child.value, resolveIdentifiers)
        };
      case 'BigIntLiteral':
        return {
          range,
          type: 'bytecode' as 'bytecode',
          value: bigIntToScriptNumber(child.value)
        };
      case 'HexLiteral':
        return child.value.length % Constants.hexByte === 0
          ? {
              range,
              type: 'bytecode' as 'bytecode',
              value: hexToBin(child.value)
            }
          : {
              range,
              type: 'error' as 'error',
              value: `Improperly formed HexLiteral. HexLiteral must have a length divisible by 2, but this HexLiteral has a length of ${child.value.length}.`
            };
      case 'UTF8Literal':
        return {
          range,
          type: 'bytecode' as 'bytecode',
          value: utf8ToBin(child.value)
        };
      case 'Comment':
        return {
          range,
          type: 'comment' as 'comment',
          value: child.value
        };
      default:
        return {
          range,
          type: 'error' as 'error',
          value: `Unrecognized segment: ${child}`
        };
    }
  });

  return resolved.length === 0
    ? [{ range: pluckRange(segment), type: 'comment' as 'comment', value: '' }]
    : resolved;
};

/**
 * Returns the bytecode result on success or an error message on failure.
 */
export type CompilerOperation<
  CompilerOperationData = {},
  Checked extends AuthenticationTemplateVariable['type'] | undefined = undefined
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
    : Checked extends 'CurrentBlockTime'
    ? Required<
        Pick<CompilationData<CompilerOperationData>, 'currentBlockTime'>
      > &
        CompilationData<CompilerOperationData>
    : Checked extends 'CurrentBlockHeight'
    ? Required<
        Pick<CompilationData<CompilerOperationData>, 'currentBlockHeight'>
      > &
        CompilationData<CompilerOperationData>
    : CompilationData<CompilerOperationData>,
  compilationEnvironment: CompilationEnvironment<CompilerOperationData>
) => Uint8Array | string;

/**
 * The full context required to compile a given BitAuth Template – everything
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
export interface CompilationEnvironment<CompilerOperationData = {}> {
  /**
   * A method which accepts an array of `AuthenticationInstruction`s, and
   * returns a ProgramState. This method will be used to generate the initial
   * ProgramState for `evaluation`s.
   */
  createState?: (
    // tslint:disable-next-line: no-any
    instructions: Array<AuthenticationInstruction<any>>
  ) => // tslint:disable-next-line: no-any
  any;
  /**
   * An object mapping opcode identifiers to the bytecode they generate.
   */
  // tslint:disable-next-line: no-mixed-interface
  opcodes?: {
    [opcodeIdentifier: string]: Uint8Array;
  };
  /**
   * An object specifying the operations made available by this
   * CompilationEnvironment for each variable type, e.g. keys may support public
   * key derivation and multiple signature types.
   */
  operations?: {
    [key in AuthenticationTemplateVariable['type']]?: {
      [operationId: string]: CompilerOperation<CompilerOperationData, key>;
    };
  };
  /**
   * An object mapping script identifiers to the text of script in BitAuth
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
   * ["grandparentId", "parentId"])
   *
   * BitAuth Script identifier resolution must be acyclic.
   *
   * To prevent an infinite loop, `IdentifierResolutionFunction`s must abort
   * resolution if they encounter their own `id` while resolving another
   * identifier. Likewise, child scripts being resolved by a parent script
   * may not reference any script which is already in the process of being
   * resolved.
   */
  sourceScriptIds?: string[];
  /**
   * An object mapping BitAuth variable identifiers to the
   * `AuthenticationTemplateVariable` describing them.
   *
   * To avoid compilation errors, this object must contain all variables
   * referenced by the script being compiled (including in child scripts).
   */
  variables?: {
    [variableId: string]: AuthenticationTemplateVariable;
  };
  /**
   * The AuthenticationVirtualMachine on which BitAuth script `evaluation`
   * results will be computed.
   */
  // TODO: more specific signature?
  // tslint:disable-next-line: no-any
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

enum Constants {
  msPerLocktimeSecond = 1000
}

/**
 * Convert a Javascript `Date` object to its equivalent LockTime
 * representation in an `AuthenticationVirtualMachine`.
 *
 * TODO: this method should error past the overflow Date and for dates which
 * would become BlockHeights when encoded. Validate correctness after
 * `OP_CHECKLOCKTIMEVERIFY` is implemented.
 *
 * @param date the Date to convert to a BlockTime Uint8Array
 */
export const dateToLockTime = (date: Date) =>
  bigIntToScriptNumber(
    BigInt(Math.round(date.getTime() / Constants.msPerLocktimeSecond))
  );

const articleAndVariableType = (
  variableType: AuthenticationTemplateVariable['type']
) => `${variableType === 'HDKey' ? 'an' : 'a'} ${variableType}`;

const attemptCompilerOperation = <CompilerOperationData>(
  identifier: string,
  operationId: string,
  variableType: AuthenticationTemplateVariable['type'],
  environment: CompilationEnvironment<CompilerOperationData>,
  data: CompilationData<CompilerOperationData>
) => {
  // tslint:disable-next-line: no-if-statement
  if (
    environment.operations !== undefined &&
    environment.operations[variableType] !== undefined
  ) {
    const operationsForType = environment.operations[variableType];
    if (operationsForType !== undefined) {
      const operation = operationsForType[operationId];
      // tslint:disable-next-line: no-if-statement
      if ((operation as typeof operation | undefined) !== undefined) {
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
  CurrentBlockHeight: 'currentBlockHeight',
  CurrentBlockTime: 'currentBlockTime',
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
  CurrentBlockHeight: (_, data) =>
    bigIntToScriptNumber(BigInt(data.currentBlockHeight as number)),
  CurrentBlockTime: (_, data) => dateToLockTime(data.currentBlockTime as Date),
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
    ['a', 'e', 'i', 'o', 'u'].indexOf(word[0].toLowerCase()) === -1 ? 'a' : 'an'
  } "${word}"`;

/**
 * If the identifer can be successfully resolved as a variable, the result is
 * returned as a Uint8Array. If the identifier references a known variable, but
 * an error occurs in resolving it, the error is returned as a string.
 * Otherwise, the identifier is not recognized as a variable, and this method
 * simply returns `false`.
 */
export const resolveAuthenticationTemplateVariable = <CompilerOperationData>(
  identifier: string,
  environment: CompilationEnvironment<CompilerOperationData>,
  data: CompilationData<CompilerOperationData>
): Uint8Array | string | false => {
  const splitId = identifier.split('.');
  const isOperation = splitId.length > 1;
  const variableId = splitId[0];
  const operationId = splitId[1];
  // tslint:disable-next-line: no-if-statement
  if (environment.variables === undefined) {
    return false;
  }
  const selected = environment.variables[variableId] as
    | AuthenticationTemplateVariable
    | undefined;
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
    : isOperation
    ? attemptCompilerOperation(
        identifier,
        operationId,
        selected.type,
        environment,
        data
      )
    : defaultActionByVariableType[selected.type](identifier, data, variableId);
};

/**
 * Compile an internal script identifier.
 *
 * @remarks
 * If the identifer can be successfully resolved as a script, the script is
 * compiled and returned as a `Uint8Array`. If an error occurs in compiling it,
 * the error is returned as a string.
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
export const resolveScriptIdentifier = <CompilerOperationData>(
  identifier: string,
  data: CompilationData<CompilerOperationData>,
  environment: CompilationEnvironment<CompilerOperationData>,
  parentIdentifier?: string
): Uint8Array | string | false => {
  // tslint:disable-next-line: no-if-statement
  if ((environment.scripts[identifier] as string | undefined) === undefined) {
    return false;
  }
  // tslint:disable-next-line: no-if-statement
  if (
    parentIdentifier !== undefined &&
    environment.sourceScriptIds !== undefined &&
    environment.sourceScriptIds.indexOf(parentIdentifier) !== -1
  ) {
    return `A circular dependency was encountered. Script "${identifier}" relies on itself to be generated. (Parent scripts: ${environment.sourceScriptIds.join(
      ', '
    )})`;
  }
  const result = compileScript(identifier, data, {
    ...environment,
    sourceScriptIds: [
      ...(environment.sourceScriptIds !== undefined
        ? environment.sourceScriptIds
        : []),
      ...(parentIdentifier !== undefined ? [parentIdentifier] : [])
    ]
  });
  return result.success
    ? result.bytecode
    : `Compilation error in resolved script, ${identifier}: ${result.errors.join(
        ', '
      )}`;
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
        ? { status: false, error: variableResult }
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
        ? { status: false, error: scriptResult }
        : {
            bytecode: scriptResult,
            status: true,
            type: IdentifierResolutionType.script
          };
    }
    return { status: false, error: `Unknown identifier '${identifier}'.` };
  };
