import {
  instantiateSecp256k1,
  instantiateSha256,
  Secp256k1,
} from '../../crypto/crypto';
import {
  bigIntToBinUint64LE,
  bigIntToBitcoinVarInt,
  numberToBinUint32LE,
} from '../../format/format';
import {
  generateSigningSerializationBCH,
  SigningSerializationFlag,
} from '../instruction-sets/common/signing-serialization';
import {
  AuthenticationProgramStateBCH,
  createAuthenticationProgramExternalStateCommonEmpty,
  createAuthenticationProgramStateCommon,
  generateBytecodeMap,
  instantiateVirtualMachineBCH,
  instructionSetBCHCurrentStrict,
  OpcodesBCH,
} from '../instruction-sets/instruction-sets';
import { AuthenticationInstruction } from '../instruction-sets/instruction-sets-types';
import { MinimumProgramState, StackState } from '../state';

import {
  CompilationResult,
  CompilationResultError,
  compileScript,
} from './language/compile';
import {
  CompilationData,
  CompilationEnvironment,
  resolveScriptIdentifier,
} from './language/resolve';

export interface CompilerOperationDataBCH {
  correspondingOutput?: Uint8Array;
  coveredBytecode: Uint8Array;
  locktime: number;
  outpointIndex: number;
  outpointTransactionHash: Uint8Array;
  outputValue: number;
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

/* eslint-disable camelcase */
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
  no_outputs_single_input = 'no_outputs_single_input',
}
/* eslint-enable camelcase */

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
  | 'covered_bytecode_length'
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
  missingSecp256k1 = 'Secp256k1 is required, but no implementation was provided.',
}

// eslint-disable-next-line complexity
const getSigningSerializationType = (
  algorithmIdentifier: string,
  prefix = ''
) => {
  switch (algorithmIdentifier) {
    case `${prefix}${SigningSerializationAlgorithmIdentifier.all_outputs}`:
      return Uint8Array.of(
        // eslint-disable-next-line no-bitwise
        SigningSerializationFlag.all_outputs | SigningSerializationFlag.fork_id
      );
    case `${prefix}${SigningSerializationAlgorithmIdentifier.all_outputs_single_input}`:
      return Uint8Array.of(
        // eslint-disable-next-line no-bitwise
        SigningSerializationFlag.all_outputs |
          SigningSerializationFlag.single_input |
          SigningSerializationFlag.fork_id
      );
    case `${prefix}${SigningSerializationAlgorithmIdentifier.corresponding_output}`:
      return Uint8Array.of(
        // eslint-disable-next-line no-bitwise
        SigningSerializationFlag.corresponding_output |
          SigningSerializationFlag.fork_id
      );
    case `${prefix}${SigningSerializationAlgorithmIdentifier.corresponding_output_single_input}`:
      return Uint8Array.of(
        // eslint-disable-next-line no-bitwise
        SigningSerializationFlag.corresponding_output |
          SigningSerializationFlag.single_input |
          SigningSerializationFlag.fork_id
      );
    case `${prefix}${SigningSerializationAlgorithmIdentifier.no_outputs}`:
      return Uint8Array.of(
        // eslint-disable-next-line no-bitwise
        SigningSerializationFlag.no_outputs | SigningSerializationFlag.fork_id
      );
    case `${prefix}${SigningSerializationAlgorithmIdentifier.no_outputs_single_input}`:
      return Uint8Array.of(
        // eslint-disable-next-line no-bitwise
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
  expectedSegments = 3,
}

export const compilerOperationBCHGenerateSignature = <
  OperationData extends CompilerOperationDataBCH
>(
  name: 'signature' | 'schnorr_signature',
  signingAlgorithm: (secp256k1: {
    signMessageHashSchnorr: Secp256k1['signMessageHashSchnorr'];
    signMessageHashDER: Secp256k1['signMessageHashDER'];
  }) => (privateKey: Uint8Array, messageHash: Uint8Array) => Uint8Array
  // eslint-disable-next-line complexity
) => (
  identifier: string,
  data: Required<Pick<CompilationData<OperationData>, 'keys'>> &
    CompilationData<OperationData>,
  environment: CompilationEnvironment<OperationData>
) => {
  const { keys } = data;
  const { signatures, privateKeys } = keys;
  if (
    signatures !== undefined &&
    (signatures[identifier] as Uint8Array | undefined) !== undefined
  ) {
    return signatures[identifier];
  }
  const identifierSegments = identifier.split('.');
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
  if (signingSerializationType === undefined) {
    return `Unknown signing serialization algorithm, "${algorithm}".`;
  }
  if (
    privateKeys !== undefined &&
    (privateKeys[variableId] as Uint8Array | undefined) !== undefined
  ) {
    const privateKey = privateKeys[variableId];
    const { operationData } = data;
    if (operationData === undefined) {
      return `Could not construct the signature "${identifier}", signing serialization data was not provided in the compilation data.`;
    }
    const { secp256k1 } = environment;
    if (secp256k1 === undefined) {
      return ScriptGenerationError.missingSecp256k1;
    }
    const { sha256 } = environment;
    if (sha256 === undefined) {
      return ScriptGenerationError.missingSha256;
    }
    const serialization = generateSigningSerializationBCH({
      correspondingOutput: operationData.correspondingOutput,
      coveredBytecode: operationData.coveredBytecode,
      locktime: operationData.locktime,
      outpointIndex: operationData.outpointIndex,
      outpointTransactionHash: operationData.outpointTransactionHash,
      outputValue: operationData.outputValue,
      sequenceNumber: operationData.sequenceNumber,
      sha256,
      signingSerializationType,
      transactionOutpoints: operationData.transactionOutpoints,
      transactionOutputs: operationData.transactionOutputs,
      transactionSequenceNumbers: operationData.transactionSequenceNumbers,
      version: operationData.version,
    });
    const digest = sha256.hash(sha256.hash(serialization));
    const bitcoinEncodedSignature = Uint8Array.from([
      ...signingAlgorithm(secp256k1)(privateKey, digest),
      ...signingSerializationType,
    ]);
    return bitcoinEncodedSignature;
  }
  return `Identifier "${identifier}" refers to a signature, but no matching signatures or private keys for "${variableId}" were provided in the compilation data.`;
};

export const compilerOperationBCHGenerateDataSignature = <
  OperationData extends CompilerOperationDataBCH
>(
  name: 'data_signature' | 'schnorr_data_signature',
  signingAlgorithm: (secp256k1: {
    signMessageHashSchnorr: Secp256k1['signMessageHashSchnorr'];
    signMessageHashDER: Secp256k1['signMessageHashDER'];
  }) => (privateKey: Uint8Array, messageHash: Uint8Array) => Uint8Array
  // eslint-disable-next-line complexity
) => (
  identifier: string,
  data: Required<Pick<CompilationData<OperationData>, 'keys'>> &
    CompilationData<OperationData>,
  environment: CompilationEnvironment<OperationData>
) => {
  const { keys } = data;
  const { signatures, privateKeys } = keys;
  if (
    signatures !== undefined &&
    (signatures[identifier] as Uint8Array | undefined) !== undefined
  ) {
    return signatures[identifier];
  }
  const identifierSegments = identifier.split('.');
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

  const compiledTarget = resolveScriptIdentifier({
    data,
    environment,
    identifier: scriptId,
  });
  if (signingTarget === undefined || compiledTarget === false) {
    return `Data signature tried to sign an unknown target script, "${scriptId}".`;
  }
  if (typeof compiledTarget === 'string') {
    return compiledTarget;
  }

  if (
    privateKeys !== undefined &&
    (privateKeys[variableId] as Uint8Array | undefined) !== undefined
  ) {
    const privateKey = privateKeys[variableId];
    const { secp256k1 } = environment;
    if (secp256k1 === undefined) {
      return ScriptGenerationError.missingSecp256k1;
    }
    const { sha256 } = environment;
    if (sha256 === undefined) {
      return ScriptGenerationError.missingSha256;
    }
    const digest = sha256.hash(compiledTarget.bytecode);
    return signingAlgorithm(secp256k1)(privateKey, digest);
  }
  return `Identifier "${identifier}" refers to a data signature, but no matching signatures or private keys for "${variableId}" were provided in the compilation data.`;
};

enum SigningSerializationIdentifierConstants {
  operationIndex = 1,
  expectedSegments = 2,
}

// eslint-disable-next-line complexity
export const compilerOperationBCHGenerateSigningSerialization = <
  OperationData extends CompilerOperationDataBCH
>(
  identifier: string,
  data: CompilationData<OperationData>,
  environment: CompilationEnvironment<OperationData>
) => {
  const identifierSegments = identifier.split('.');
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
  const { operationData } = data;
  if (operationData === undefined) {
    return `Could not construct the signing serialization "${identifier}", signing serialization data was not provided in the compilation data.`;
  }
  const { sha256 } = environment;
  if (sha256 === undefined) {
    return ScriptGenerationError.missingSha256;
  }
  // eslint-disable-next-line functional/no-conditional-statement
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
      case 'covered_bytecode_length':
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
        return bigIntToBinUint64LE(BigInt(operationData.outputValue));
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
  return generateSigningSerializationBCH({
    correspondingOutput: operationData.correspondingOutput,
    coveredBytecode: operationData.coveredBytecode,
    locktime: operationData.locktime,
    outpointIndex: operationData.outpointIndex,
    outpointTransactionHash: operationData.outpointTransactionHash,
    outputValue: operationData.outputValue,
    sequenceNumber: operationData.sequenceNumber,
    sha256,
    signingSerializationType,
    transactionOutpoints: operationData.transactionOutpoints,
    transactionOutputs: operationData.transactionOutputs,
    transactionSequenceNumbers: operationData.transactionSequenceNumbers,
    version: operationData.version,
  });
};

/* eslint-disable camelcase */
export const getCompilerOperationsBCH = (): CompilationEnvironment<
  CompilerOperationDataBCH,
  CompilerOperationsBCH
>['operations'] => ({
  Key: {
    data_signature: compilerOperationBCHGenerateDataSignature(
      'data_signature',
      (secp256k1) => secp256k1.signMessageHashDER
    ),
    // eslint-disable-next-line complexity
    public_key: (identifier, data, environment) => {
      const { keys } = data;
      const { publicKeys, privateKeys } = keys;
      const [variableId] = identifier.split('.');
      if (
        publicKeys !== undefined &&
        (publicKeys[variableId] as Uint8Array | undefined) !== undefined
      ) {
        return publicKeys[variableId];
      }
      if (
        privateKeys !== undefined &&
        (privateKeys[variableId] as Uint8Array | undefined) !== undefined
      ) {
        const { secp256k1 } = environment;
        return secp256k1 === undefined
          ? ScriptGenerationError.missingSecp256k1
          : secp256k1.derivePublicKeyCompressed(privateKeys[variableId]);
      }
      return `Identifier "${identifier}" refers to a public key, but no public or private keys for "${variableId}" were provided in the compilation data.`;
    },
    schnorr_data_signature: compilerOperationBCHGenerateDataSignature(
      'schnorr_data_signature',
      (secp256k1) => secp256k1.signMessageHashSchnorr
    ),
    schnorr_signature: compilerOperationBCHGenerateSignature(
      'schnorr_signature',
      (secp256k1) => secp256k1.signMessageHashSchnorr
    ),
    signature: compilerOperationBCHGenerateSignature(
      'signature',
      (secp256k1) => secp256k1.signMessageHashDER
    ),
  },
  SigningSerialization: {
    corresponding_output: compilerOperationBCHGenerateSigningSerialization,
    corresponding_output_hash: compilerOperationBCHGenerateSigningSerialization,
    covered_bytecode: compilerOperationBCHGenerateSigningSerialization,
    covered_bytecode_length: compilerOperationBCHGenerateSigningSerialization,
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
    version: compilerOperationBCHGenerateSigningSerialization,
  },
});
/* eslint-enable camelcase */

export type BytecodeGenerationResult<ProgramState> =
  | {
      bytecode: Uint8Array;
      success: true;
    }
  | CompilationResultError<ProgramState>;

/**
 * A `Compiler` is a wrapper around a specific `CompilationEnvironment` which
 * exposes a purely-functional interface and allows for stronger type checking.
 */
export interface Compiler<CompilerOperationData, ProgramState> {
  // eslint-disable-next-line functional/no-method-signature
  generateBytecode(
    script: string,
    data: CompilationData<CompilerOperationData>,
    debug: true
  ): CompilationResult<ProgramState>;
  // eslint-disable-next-line functional/no-method-signature
  generateBytecode(
    script: string,
    data: CompilationData<CompilerOperationData>,
    debug?: false
  ): BytecodeGenerationResult<ProgramState>;
}

/**
 * Create a `Compiler` from the provided compilation environment. This method
 * requires a full `CompilationEnvironment` and does not instantiate any new
 * crypto or VM implementations.
 *
 * @param compilationEnvironment - the environment from which to create the
 * compiler
 */
export const createCompiler = <
  CompilerOperationData,
  ProgramState = StackState & MinimumProgramState
>(
  compilationEnvironment: CompilationEnvironment<CompilerOperationData>
): Compiler<CompilerOperationData, ProgramState> => ({
  generateBytecode: (
    script: string,
    data: CompilationData<CompilerOperationData>,
    // TODO: TS bug?
    // eslint-disable-next-line @typescript-eslint/no-inferrable-types
    debug: boolean = false
    // TODO: is there a way to avoid this `any`?
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): any => {
    const result = compileScript<ProgramState, CompilerOperationData>(
      script,
      data,
      compilationEnvironment
    );
    return debug
      ? result
      : result.success
      ? { bytecode: result.bytecode, success: true }
      : { errorType: result.errorType, errors: result.errors, success: false };
  },
});

/**
 * A common `createState` implementation for most compilers.
 *
 * @param instructions - the list of instructions to incorporate in the created
 * state.
 */
export const compilerCreateStateCommon = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  instructions: AuthenticationInstruction<any>[]
) =>
  createAuthenticationProgramStateCommon(
    instructions,
    [],
    createAuthenticationProgramExternalStateCommonEmpty()
  );

/**
 * Create a compiler using the default BCH environment.
 *
 * Internally instantiates the necessary crypto and VM implementations – use
 * `createCompiler` for more control.
 *
 * @param overrides - a compilation environment from which properties will be used
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
    instantiateVirtualMachineBCH(instructionSetBCHCurrentStrict),
  ]);
  return createCompiler<CompilerOperationData, ProgramState>({
    ...{
      createState: compilerCreateStateCommon,
      opcodes: generateBytecodeMap(OpcodesBCH),
      operations: getCompilerOperationsBCH(),
      secp256k1,
      sha256,
      vm,
    },
    ...overrides,
  });
};
