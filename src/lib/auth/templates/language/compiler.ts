import {
  instantiateSecp256k1,
  instantiateSha256,
  Secp256k1
} from '../../../crypto/crypto';
import {
  bigIntToBinUint64LE,
  bigIntToBitcoinVarInt,
  numberToBinUint32LE
} from '../../../utils/utils';
import {
  AuthenticationInstruction,
  createAuthenticationProgramExternalStateCommonEmpty,
  generateBytecodeMap,
  generateSigningSerializationBCH,
  MinimumProgramState,
  OpcodesBCH,
  SigningSerializationFlag,
  StackState
} from '../../auth';
import {
  AuthenticationProgramStateBCH,
  createAuthenticationProgramStateCommon,
  instantiateVirtualMachineBCH,
  instructionSetBCHCurrentStrict
} from '../../instruction-sets/instruction-sets';

import { CompilationError, CompilationResult, compileScript } from './compile';
import {
  CompilationData,
  CompilationEnvironment,
  resolveScriptIdentifier
} from './resolve';

export interface CompilerOperationDataBCH {
  correspondingOutput?: Uint8Array;
  coveredBytecode: Uint8Array;
  locktime: number;
  outpointIndex: number;
  outpointTransactionHash: Uint8Array;
  outputValue: bigint;
  sequenceNumber: number;
  transactionOutpoints: Uint8Array;
  transactionOutputs: Uint8Array;
  transactionSequenceNumbers: Uint8Array;
  version: number;
}

export type CompilerOperationsKeyBCH =
  | 'data_signature'
  | 'public_key'
  | 'schnorr_data_signature'
  | 'schnorr_signature'
  | 'signature';

export enum SigningSerializationAlgorithmIdentifier {
  /**
   * A.K.A. `SIGHASH_ALL`
   */
  all_outputs = 'all_outputs',
  /**
   * A.K.A. `SIGHASH_ALL|ANYONE_CAN_PAY`
   */
  all_outputs_single_input = 'all_outputs_single_input',
  /**
   * A.K.A. `SIGHASH_SINGLE`
   */
  corresponding_output = 'corresponding_output',
  /**
   * A.K.A. `SIGHASH_SINGLE|ANYONE_CAN_PAY`
   */
  corresponding_output_single_input = 'corresponding_output_single_input',
  /**
   * A.K.A `SIGHASH_NONE`
   */
  no_outputs = 'no_outputs',
  /**
   * A.K.A `SIGHASH_NONE|ANYONE_CAN_PAY`
   */
  no_outputs_single_input = 'no_outputs_single_input'
}

export type CompilerOperationsSigningSerializationFullBCH =
  | 'full_all_outputs'
  | 'full_all_outputs_single_input'
  | 'full_corresponding_output'
  | 'full_corresponding_output_single_input'
  | 'full_no_outputs'
  | 'full_no_outputs_single_input';

export type CompilerOperationsSigningSerializationComponentBCH =
  | 'version'
  | 'transaction_outpoints'
  | 'transaction_outpoints_hash'
  | 'transaction_sequence_numbers'
  | 'transaction_sequence_numbers_hash'
  | 'outpoint_transaction_hash'
  | 'outpoint_index'
  | 'covered_bytecode_prefix'
  | 'covered_bytecode'
  | 'output_value'
  | 'sequence_number'
  | 'corresponding_output'
  | 'corresponding_output_hash'
  | 'transaction_outputs'
  | 'transaction_outputs_hash'
  | 'locktime';

export type CompilerOperationsSigningSerializationBCH =
  | CompilerOperationsSigningSerializationComponentBCH
  | CompilerOperationsSigningSerializationFullBCH;

export type CompilerOperationsBCH =
  | CompilerOperationsKeyBCH
  | CompilerOperationsSigningSerializationBCH;

enum ScriptGenerationError {
  missingVm = 'An evaluation is required, but no VM was provided.',
  missingSha256 = 'Sha256 is required, but no implementation was provided.',
  missingSecp256k1 = 'Secp256k1 is required, but no implementation was provided.'
}

// tslint:disable-next-line: cyclomatic-complexity
const getSigningSerializationType = (
  algorithmIdentifier: string,
  prefix = ''
) => {
  switch (algorithmIdentifier) {
    case `${prefix}${SigningSerializationAlgorithmIdentifier.all_outputs}`:
      return Uint8Array.of(
        // tslint:disable-next-line: no-bitwise
        SigningSerializationFlag.all_outputs | SigningSerializationFlag.fork_id
      );
    case `${prefix}${SigningSerializationAlgorithmIdentifier.all_outputs_single_input}`:
      return Uint8Array.of(
        // tslint:disable-next-line: no-bitwise
        SigningSerializationFlag.all_outputs |
          SigningSerializationFlag.single_input |
          SigningSerializationFlag.fork_id
      );
    case `${prefix}${SigningSerializationAlgorithmIdentifier.corresponding_output}`:
      return Uint8Array.of(
        // tslint:disable-next-line: no-bitwise
        SigningSerializationFlag.corresponding_output |
          SigningSerializationFlag.fork_id
      );
    case `${prefix}${SigningSerializationAlgorithmIdentifier.corresponding_output_single_input}`:
      return Uint8Array.of(
        // tslint:disable-next-line: no-bitwise
        SigningSerializationFlag.corresponding_output |
          SigningSerializationFlag.single_input |
          SigningSerializationFlag.fork_id
      );
    case `${prefix}${SigningSerializationAlgorithmIdentifier.no_outputs}`:
      return Uint8Array.of(
        // tslint:disable-next-line: no-bitwise
        SigningSerializationFlag.no_outputs | SigningSerializationFlag.fork_id
      );
    case `${prefix}${SigningSerializationAlgorithmIdentifier.no_outputs_single_input}`:
      return Uint8Array.of(
        // tslint:disable-next-line: no-bitwise
        SigningSerializationFlag.no_outputs |
          SigningSerializationFlag.single_input |
          SigningSerializationFlag.fork_id
      );
    default:
      return undefined;
  }
};

enum SignatureIdentifierConstants {
  variableIdIndex = 0,
  signingTargetIndex = 2,
  expectedSegments = 3
}

export const compilerOperationBCHGenerateSignature = <
  OperationData extends CompilerOperationDataBCH
>(
  name: 'signature' | 'schnorr_signature',
  signingAlgorithm: (
    secp256k1: Secp256k1
  ) => (privateKey: Uint8Array, messageHash: Uint8Array) => Uint8Array
) => (
  // tslint:disable-next-line: cyclomatic-complexity
  identifier: string,
  data: Required<Pick<CompilationData<OperationData>, 'keys'>> &
    CompilationData<OperationData>,
  environment: CompilationEnvironment<OperationData>
) => {
  const keys = data.keys;
  const signatures = keys.signatures;
  const privateKeys = keys.privateKeys;
  // tslint:disable-next-line: no-if-statement
  if (
    signatures !== undefined &&
    (signatures[identifier] as Uint8Array | undefined) !== undefined
  ) {
    return signatures[identifier];
  }
  const identifierSegments = identifier.split('.');
  // tslint:disable-next-line: no-if-statement
  if (
    identifierSegments.length !== SignatureIdentifierConstants.expectedSegments
  ) {
    return `Invalid signature identifier. Signatures must be of the form: "[variable_id].${name}.[signing_serialization_type]".`;
  }
  const variableId =
    identifierSegments[SignatureIdentifierConstants.variableIdIndex];
  const algorithm =
    identifierSegments[SignatureIdentifierConstants.signingTargetIndex];
  const signingSerializationType = getSigningSerializationType(algorithm);
  // tslint:disable-next-line: no-if-statement
  if (signingSerializationType === undefined) {
    return `Unknown signing serialization algorithm, "${algorithm}".`;
  }
  // tslint:disable-next-line: no-if-statement
  if (
    privateKeys !== undefined &&
    (privateKeys[variableId] as Uint8Array | undefined) !== undefined
  ) {
    const privateKey = privateKeys[variableId];
    const operationData = data.operationData;
    // tslint:disable-next-line: no-if-statement
    if (operationData === undefined) {
      return `Could not construct the signature "${identifier}", signing serialization data was not provided in the compilation data.`;
    }
    const secp256k1 = environment.secp256k1;
    // tslint:disable-next-line: no-if-statement
    if (secp256k1 === undefined) {
      return ScriptGenerationError.missingSecp256k1;
    }
    const sha256 = environment.sha256;
    // tslint:disable-next-line: no-if-statement
    if (sha256 === undefined) {
      return ScriptGenerationError.missingSha256;
    }
    const serialization = generateSigningSerializationBCH(
      sha256,
      operationData.version,
      operationData.transactionOutpoints,
      operationData.transactionSequenceNumbers,
      operationData.outpointTransactionHash,
      operationData.outpointIndex,
      operationData.coveredBytecode,
      operationData.outputValue,
      operationData.sequenceNumber,
      operationData.correspondingOutput,
      operationData.transactionOutputs,
      operationData.locktime,
      signingSerializationType
    );
    const digest = sha256.hash(sha256.hash(serialization));
    const bitcoinEncodedSignature = Uint8Array.from([
      ...signingAlgorithm(secp256k1)(privateKey, digest),
      ...signingSerializationType
    ]);
    return bitcoinEncodedSignature;
  }
  return `Identifier "${identifier}" refers to a signature, but no signatures or private keys for "${variableId}" were provided in the compilation data.`;
};

export const compilerOperationBCHGenerateDataSignature = <
  OperationData extends CompilerOperationDataBCH
>(
  name: 'data_signature' | 'schnorr_data_signature',
  signingAlgorithm: (
    secp256k1: Secp256k1
  ) => (privateKey: Uint8Array, messageHash: Uint8Array) => Uint8Array
) => (
  // tslint:disable-next-line: cyclomatic-complexity
  identifier: string,
  data: Required<Pick<CompilationData<OperationData>, 'keys'>> &
    CompilationData<OperationData>,
  environment: CompilationEnvironment<OperationData>
) => {
  const keys = data.keys;
  const signatures = keys.signatures;
  const privateKeys = keys.privateKeys;
  // tslint:disable-next-line: no-if-statement
  if (
    signatures !== undefined &&
    (signatures[identifier] as Uint8Array | undefined) !== undefined
  ) {
    return signatures[identifier];
  }
  const identifierSegments = identifier.split('.');
  // tslint:disable-next-line: no-if-statement
  if (
    identifierSegments.length !== SignatureIdentifierConstants.expectedSegments
  ) {
    return `Invalid data signature identifier. Data signatures must be of the form: "[variable_id].${name}.[target_script_id]".`;
  }
  const variableId =
    identifierSegments[SignatureIdentifierConstants.variableIdIndex];
  const scriptId =
    identifierSegments[SignatureIdentifierConstants.signingTargetIndex];
  const signingTarget = environment.scripts[scriptId] as string | undefined;

  const compiledTarget = resolveScriptIdentifier(scriptId, data, environment);
  // tslint:disable-next-line: no-if-statement
  if (signingTarget === undefined || compiledTarget === false) {
    return `Data signature tried to sign an unknown target script, "${scriptId}".`;
  }
  // tslint:disable-next-line: no-if-statement
  if (typeof compiledTarget === 'string') {
    return compiledTarget;
  }

  // tslint:disable-next-line: no-if-statement
  if (
    privateKeys !== undefined &&
    (privateKeys[variableId] as Uint8Array | undefined) !== undefined
  ) {
    const privateKey = privateKeys[variableId];
    const secp256k1 = environment.secp256k1;
    // tslint:disable-next-line: no-if-statement
    if (secp256k1 === undefined) {
      return ScriptGenerationError.missingSecp256k1;
    }
    const sha256 = environment.sha256;
    // tslint:disable-next-line: no-if-statement
    if (sha256 === undefined) {
      return ScriptGenerationError.missingSha256;
    }
    const digest = sha256.hash(compiledTarget.bytecode);
    return signingAlgorithm(secp256k1)(privateKey, digest);
  }
  return `Identifier "${identifier}" refers to a data signature, but no signatures or private keys for "${variableId}" were provided in the compilation data.`;
};

enum SigningSerializationIdentifierConstants {
  operationIndex = 1,
  expectedSegments = 2
}

export const compilerOperationBCHGenerateSigningSerialization = <
  OperationData extends CompilerOperationDataBCH
>(
  // tslint:disable-next-line: cyclomatic-complexity
  identifier: string,
  data: CompilationData<OperationData>,
  environment: CompilationEnvironment<OperationData>
) => {
  const identifierSegments = identifier.split('.');
  // tslint:disable-next-line: no-if-statement
  if (
    identifierSegments.length !==
    SigningSerializationIdentifierConstants.expectedSegments
  ) {
    return `Invalid signing serialization operation. Include the desired component or algorithm, e.g. "signing_serialization.version" or "signing_serialization.all_outputs".`;
  }
  const algorithmOrComponent =
    identifierSegments[SigningSerializationIdentifierConstants.operationIndex];
  const signingSerializationType = getSigningSerializationType(
    algorithmOrComponent,
    'full_'
  );
  const operationData = data.operationData;
  // tslint:disable-next-line: no-if-statement
  if (operationData === undefined) {
    return `Could not construct the signing serialization "${identifier}", signing serialization data was not provided in the compilation data.`;
  }
  const sha256 = environment.sha256;
  // tslint:disable-next-line: no-if-statement
  if (sha256 === undefined) {
    return ScriptGenerationError.missingSha256;
  }
  // tslint:disable-next-line: no-if-statement
  if (signingSerializationType === undefined) {
    switch (
      algorithmOrComponent as CompilerOperationsSigningSerializationComponentBCH
    ) {
      case 'corresponding_output':
        return operationData.correspondingOutput === undefined
          ? Uint8Array.of()
          : operationData.correspondingOutput;
      case 'corresponding_output_hash':
        return operationData.correspondingOutput === undefined
          ? Uint8Array.of()
          : sha256.hash(sha256.hash(operationData.correspondingOutput));
      case 'covered_bytecode_prefix':
        return bigIntToBitcoinVarInt(
          BigInt(operationData.coveredBytecode.length)
        );
      case 'covered_bytecode':
        return operationData.coveredBytecode;
      case 'locktime':
        return numberToBinUint32LE(operationData.locktime);
      case 'outpoint_index':
        return numberToBinUint32LE(operationData.outpointIndex);
      case 'outpoint_transaction_hash':
        return operationData.outpointTransactionHash;
      case 'output_value':
        return bigIntToBinUint64LE(operationData.outputValue);
      case 'sequence_number':
        return numberToBinUint32LE(operationData.sequenceNumber);
      case 'transaction_outpoints':
        return operationData.transactionOutpoints;
      case 'transaction_outpoints_hash':
        return sha256.hash(sha256.hash(operationData.transactionOutpoints));
      case 'transaction_outputs':
        return operationData.transactionOutputs;
      case 'transaction_outputs_hash':
        return sha256.hash(sha256.hash(operationData.transactionOutputs));
      case 'transaction_sequence_numbers':
        return operationData.transactionSequenceNumbers;
      case 'transaction_sequence_numbers_hash':
        return sha256.hash(
          sha256.hash(operationData.transactionSequenceNumbers)
        );
      case 'version':
        return numberToBinUint32LE(operationData.version);
      default:
        return `Unknown signing serialization algorithm or component, "${algorithmOrComponent}".`;
    }
  }
  return generateSigningSerializationBCH(
    sha256,
    operationData.version,
    operationData.transactionOutpoints,
    operationData.transactionSequenceNumbers,
    operationData.outpointTransactionHash,
    operationData.outpointIndex,
    operationData.coveredBytecode,
    operationData.outputValue,
    operationData.sequenceNumber,
    operationData.correspondingOutput,
    operationData.transactionOutputs,
    operationData.locktime,
    signingSerializationType
  );
};

export const getCompilerOperationsBCH = (): CompilationEnvironment<
  CompilerOperationDataBCH,
  CompilerOperationsBCH
>['operations'] => ({
  Key: {
    data_signature: compilerOperationBCHGenerateDataSignature(
      'data_signature',
      secp256k1 => secp256k1.signMessageHashDER
    ),
    // tslint:disable-next-line: cyclomatic-complexity
    public_key: (identifier, data, environment) => {
      const keys = data.keys;
      const publicKeys = keys.publicKeys;
      const privateKeys = keys.privateKeys;
      const variableId = identifier.split('.')[0];
      // tslint:disable-next-line: no-if-statement
      if (
        publicKeys !== undefined &&
        (publicKeys[variableId] as Uint8Array | undefined) !== undefined
      ) {
        return publicKeys[variableId];
      }
      // tslint:disable-next-line: no-if-statement
      if (
        privateKeys !== undefined &&
        (privateKeys[variableId] as Uint8Array | undefined) !== undefined
      ) {
        const secp256k1 = environment.secp256k1;
        return secp256k1 === undefined
          ? ScriptGenerationError.missingSecp256k1
          : secp256k1.derivePublicKeyCompressed(privateKeys[variableId]);
      }
      return `Identifier "${identifier}" refers to a public key, but no public or private keys for "${variableId}" were provided in the compilation data.`;
    },
    schnorr_data_signature: compilerOperationBCHGenerateDataSignature(
      'schnorr_data_signature',
      secp256k1 => secp256k1.signMessageHashSchnorr
    ),
    schnorr_signature: compilerOperationBCHGenerateSignature(
      'schnorr_signature',
      secp256k1 => secp256k1.signMessageHashSchnorr
    ),
    signature: compilerOperationBCHGenerateSignature(
      'signature',
      secp256k1 => secp256k1.signMessageHashDER
    )
  },
  SigningSerialization: {
    corresponding_output: compilerOperationBCHGenerateSigningSerialization,
    corresponding_output_hash: compilerOperationBCHGenerateSigningSerialization,
    covered_bytecode: compilerOperationBCHGenerateSigningSerialization,
    covered_bytecode_prefix: compilerOperationBCHGenerateSigningSerialization,
    full_all_outputs: compilerOperationBCHGenerateSigningSerialization,
    full_all_outputs_single_input: compilerOperationBCHGenerateSigningSerialization,
    full_corresponding_output: compilerOperationBCHGenerateSigningSerialization,
    full_corresponding_output_single_input: compilerOperationBCHGenerateSigningSerialization,
    full_no_outputs: compilerOperationBCHGenerateSigningSerialization,
    full_no_outputs_single_input: compilerOperationBCHGenerateSigningSerialization,
    locktime: compilerOperationBCHGenerateSigningSerialization,
    outpoint_index: compilerOperationBCHGenerateSigningSerialization,
    outpoint_transaction_hash: compilerOperationBCHGenerateSigningSerialization,
    output_value: compilerOperationBCHGenerateSigningSerialization,
    sequence_number: compilerOperationBCHGenerateSigningSerialization,
    transaction_outpoints: compilerOperationBCHGenerateSigningSerialization,
    transaction_outpoints_hash: compilerOperationBCHGenerateSigningSerialization,
    transaction_outputs: compilerOperationBCHGenerateSigningSerialization,
    transaction_outputs_hash: compilerOperationBCHGenerateSigningSerialization,
    transaction_sequence_numbers: compilerOperationBCHGenerateSigningSerialization,
    transaction_sequence_numbers_hash: compilerOperationBCHGenerateSigningSerialization,
    version: compilerOperationBCHGenerateSigningSerialization
  }
});

export interface Compiler<CompilerOperationData, ProgramState> {
  debug: (
    script: string,
    data: CompilationData<CompilerOperationData>
  ) => CompilationResult<ProgramState>;
  generate: (
    script: string,
    data: CompilationData<CompilerOperationData>
  ) =>
    | {
        bytecode: Uint8Array;
        success: true;
      }
    | {
        errors: CompilationError[];
        errorType: string;
        success: false;
      };
}

/**
 * TODO: describe
 * @param compilationEnvironment the environment from which to create the compiler
 */
export const createCompiler = <
  CompilerOperationData,
  ProgramState = StackState & MinimumProgramState
>(
  compilationEnvironment: CompilationEnvironment<CompilerOperationData>
): Compiler<CompilerOperationData, ProgramState> => ({
  debug: (script: string, data: CompilationData<CompilerOperationData>) =>
    compileScript<ProgramState, CompilerOperationData>(
      script,
      data,
      compilationEnvironment
    ),
  generate: (
    script: string,
    data: CompilationData<CompilerOperationData>
  ):
    | { bytecode: Uint8Array; success: true }
    | { errors: CompilationError[]; errorType: string; success: false } => {
    const result = compileScript<ProgramState, CompilerOperationData>(
      script,
      data,
      compilationEnvironment
    );
    return result.success
      ? { success: true, bytecode: result.bytecode }
      : { success: false, errorType: result.errorType, errors: result.errors };
  }
});

export const createStateCompilerBCH = (
  // tslint:disable-next-line: no-any
  instructions: Array<AuthenticationInstruction<any>>
) =>
  createAuthenticationProgramStateCommon(
    instructions,
    [],
    createAuthenticationProgramExternalStateCommonEmpty()
  );

/**
 * TODO: describe
 *
 * @param overrides a compilation environment from which properties will be used
 * to override properties of the default BCH environment
 */
export const createCompilerBCH = async <
  CompilerOperationData extends CompilerOperationDataBCH,
  ProgramState extends AuthenticationProgramStateBCH
>(
  overrides: CompilationEnvironment<CompilerOperationData>
): Promise<Compiler<CompilerOperationData, ProgramState>> => {
  const [sha256, secp256k1, vm] = await Promise.all([
    instantiateSha256(),
    instantiateSecp256k1(),
    instantiateVirtualMachineBCH(instructionSetBCHCurrentStrict)
  ]);
  return createCompiler<CompilerOperationData, ProgramState>({
    ...{
      createState: createStateCompilerBCH,
      opcodes: generateBytecodeMap(OpcodesBCH),
      operations: getCompilerOperationsBCH(),
      secp256k1,
      sha256,
      vm
    },
    ...overrides
  });
};
