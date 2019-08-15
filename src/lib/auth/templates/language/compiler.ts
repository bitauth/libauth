import {
  instantiateSecp256k1,
  instantiateSha256,
  Secp256k1
} from '../../../crypto/crypto';
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

export interface OperationDataBCH {
  coveredScript: Uint8Array;
  // tslint:disable-next-line: no-mixed-interface
  hashCorrespondingOutput: () => Uint8Array;
  hashTransactionOutpoints: () => Uint8Array;
  hashTransactionOutputs: () => Uint8Array;
  hashTransactionSequenceNumbers: () => Uint8Array;
  // tslint:disable-next-line: no-mixed-interface
  locktime: number;
  outpointIndex: number;
  outpointTransactionHash: Uint8Array;
  outputValue: bigint;
  sequenceNumber: number;
  version: number;
}

export enum SigningSerializationIdentifier {
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

enum ScriptGenerationError {
  missingVm = 'An evaluation is required, but no VM was provided.',
  missingSha256 = 'Sha256 is required, but no implementation was provided.',
  missingSecp256k1 = 'Secp256k1 is required, but no implementation was provided.'
}

// tslint:disable-next-line: cyclomatic-complexity
const getSigningSerializationType = (
  signingSerializationIdentifier: string
) => {
  switch (signingSerializationIdentifier) {
    case SigningSerializationIdentifier.all_outputs:
      return Uint8Array.of(
        // tslint:disable-next-line: no-bitwise
        SigningSerializationFlag.all_outputs | SigningSerializationFlag.fork_id
      );
    case SigningSerializationIdentifier.all_outputs_single_input:
      return Uint8Array.of(
        // tslint:disable-next-line: no-bitwise
        SigningSerializationFlag.all_outputs |
          SigningSerializationFlag.single_input |
          SigningSerializationFlag.fork_id
      );
    case SigningSerializationIdentifier.corresponding_output:
      return Uint8Array.of(
        // tslint:disable-next-line: no-bitwise
        SigningSerializationFlag.corresponding_output |
          SigningSerializationFlag.fork_id
      );
    case SigningSerializationIdentifier.corresponding_output_single_input:
      return Uint8Array.of(
        // tslint:disable-next-line: no-bitwise
        SigningSerializationFlag.corresponding_output |
          SigningSerializationFlag.single_input |
          SigningSerializationFlag.fork_id
      );
    case SigningSerializationIdentifier.no_outputs:
      return Uint8Array.of(
        // tslint:disable-next-line: no-bitwise
        SigningSerializationFlag.no_outputs | SigningSerializationFlag.fork_id
      );
    case SigningSerializationIdentifier.no_outputs_single_input:
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

enum SignatureIdentifier {
  variableIdIndex = 0,
  signingTargetIndex = 2,
  expectedSegments = 3
}

export const compilerOperationBCHGenerateSignature = <
  OperationData extends OperationDataBCH
>(
  name: string,
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
  if (identifierSegments.length !== SignatureIdentifier.expectedSegments) {
    return `Invalid signature identifier. Signatures must be of the form: "[name].${name}.[signing serialization type]".`;
  }
  const variableId = identifierSegments[SignatureIdentifier.variableIdIndex];
  const signingSerializationIdentifier =
    identifierSegments[SignatureIdentifier.signingTargetIndex];
  const signingSerializationType = getSigningSerializationType(
    signingSerializationIdentifier
  );
  // tslint:disable-next-line: no-if-statement
  if (signingSerializationType === undefined) {
    return `Unknown signing serialization identifier, "${signingSerializationIdentifier}".`;
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
      operationData.version,
      operationData.hashTransactionOutpoints,
      operationData.hashTransactionSequenceNumbers,
      operationData.outpointTransactionHash,
      operationData.outpointIndex,
      operationData.coveredScript,
      operationData.outputValue,
      operationData.sequenceNumber,
      operationData.hashCorrespondingOutput,
      operationData.hashTransactionOutputs,
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
  OperationData extends OperationDataBCH
>(
  name: string,
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
  if (identifierSegments.length !== SignatureIdentifier.expectedSegments) {
    return `Invalid data signature identifier. Data signatures must be of the form: "[name].${name}.[target script ID]".`;
  }
  const variableId = identifierSegments[SignatureIdentifier.variableIdIndex];
  const scriptId = identifierSegments[SignatureIdentifier.signingTargetIndex];
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
    const digest = sha256.hash(compiledTarget);
    return signingAlgorithm(secp256k1)(privateKey, digest);
  }
  return `Identifier "${identifier}" refers to a data signature, but no signatures or private keys for "${variableId}" were provided in the compilation data.`;
};

export const getCompilerOperationsBCH = <
  OperationData extends OperationDataBCH
>(): CompilationEnvironment<OperationData>['operations'] => ({
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
    shnorr_signature: compilerOperationBCHGenerateSignature(
      'shnorr_signature',
      secp256k1 => secp256k1.signMessageHashSchnorr
    ),
    signature: compilerOperationBCHGenerateSignature(
      'signature',
      secp256k1 => secp256k1.signMessageHashDER
    )
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

/**
 * TODO: describe
 *
 * @param overrides a compilation environment from which properties will be used
 * to override properties of the default BCH environment
 */
export const createCompilerBCH = async <
  CompilerOperationData extends OperationDataBCH,
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
      createState: (
        // tslint:disable-next-line: no-any
        instructions: Array<AuthenticationInstruction<any>>
      ) =>
        createAuthenticationProgramStateCommon(
          instructions,
          [],
          createAuthenticationProgramExternalStateCommonEmpty()
        ),
      opcodes: generateBytecodeMap(OpcodesBCH),
      operations: getCompilerOperationsBCH<CompilerOperationData>(),
      secp256k1,
      sha256,
      vm
    },
    ...overrides
  });
};
