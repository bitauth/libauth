import {
  instantiateRipemd160,
  instantiateSecp256k1,
  instantiateSha1,
  instantiateSha256,
  instantiateSha512,
  Sha256,
} from '../../crypto/crypto';
import { TransactionContextCommon } from '../../transaction/transaction-types';
import {
  generateSigningSerializationBCH,
  SigningSerializationFlag,
} from '../../vm/instruction-sets/common/signing-serialization';
import {
  AuthenticationProgramStateBCH,
  createInstructionSetBCH,
  generateBytecodeMap,
  getFlagsForInstructionSetBCH,
  instructionSetBCHCurrentStrict,
  OpcodesBCH,
} from '../../vm/instruction-sets/instruction-sets';
import { createAuthenticationVirtualMachine } from '../../vm/virtual-machine';
import {
  authenticationTemplateToCompilationEnvironment,
  createAuthenticationProgramEvaluationCommon,
  createCompiler,
} from '../compiler';
import {
  attemptCompilerOperations,
  compilerOperationAttemptBytecodeResolution,
  compilerOperationHelperCompileScript,
  compilerOperationHelperDeriveHdKeyPrivate,
  compilerOperationHelperGenerateCoveredBytecode,
  compilerOperationRequires,
} from '../compiler-operation-helpers';
import { compilerOperationsCommon } from '../compiler-operations';
import {
  AnyCompilationEnvironment,
  CompilationData,
  CompilationEnvironment,
  CompilerOperationResult,
} from '../compiler-types';
import { AuthenticationTemplate } from '../template-types';

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
  allOutputs = 'all_outputs',
  /**
   * A.K.A. `SIGHASH_ALL|ANYONE_CAN_PAY`
   */
  allOutputsSingleInput = 'all_outputs_single_input',
  /**
   * A.K.A. `SIGHASH_SINGLE`
   */
  correspondingOutput = 'corresponding_output',
  /**
   * A.K.A. `SIGHASH_SINGLE|ANYONE_CAN_PAY`
   */
  correspondingOutputSingleInput = 'corresponding_output_single_input',
  /**
   * A.K.A `SIGHASH_NONE`
   */
  noOutputs = 'no_outputs',
  /**
   * A.K.A `SIGHASH_NONE|ANYONE_CAN_PAY`
   */
  noOutputsSingleInput = 'no_outputs_single_input',
}

// eslint-disable-next-line complexity
const getSigningSerializationType = (
  algorithmIdentifier: string,
  prefix = ''
) => {
  switch (algorithmIdentifier) {
    case `${prefix}${SigningSerializationAlgorithmIdentifier.allOutputs}`:
      return Uint8Array.of(
        // eslint-disable-next-line no-bitwise
        SigningSerializationFlag.allOutputs | SigningSerializationFlag.forkId
      );
    case `${prefix}${SigningSerializationAlgorithmIdentifier.allOutputsSingleInput}`:
      return Uint8Array.of(
        // eslint-disable-next-line no-bitwise
        SigningSerializationFlag.allOutputs |
          SigningSerializationFlag.singleInput |
          SigningSerializationFlag.forkId
      );
    case `${prefix}${SigningSerializationAlgorithmIdentifier.correspondingOutput}`:
      return Uint8Array.of(
        // eslint-disable-next-line no-bitwise
        SigningSerializationFlag.correspondingOutput |
          SigningSerializationFlag.forkId
      );
    case `${prefix}${SigningSerializationAlgorithmIdentifier.correspondingOutputSingleInput}`:
      return Uint8Array.of(
        // eslint-disable-next-line no-bitwise
        SigningSerializationFlag.correspondingOutput |
          SigningSerializationFlag.singleInput |
          SigningSerializationFlag.forkId
      );
    case `${prefix}${SigningSerializationAlgorithmIdentifier.noOutputs}`:
      return Uint8Array.of(
        // eslint-disable-next-line no-bitwise
        SigningSerializationFlag.noOutputs | SigningSerializationFlag.forkId
      );
    case `${prefix}${SigningSerializationAlgorithmIdentifier.noOutputsSingleInput}`:
      return Uint8Array.of(
        // eslint-disable-next-line no-bitwise
        SigningSerializationFlag.noOutputs |
          SigningSerializationFlag.singleInput |
          SigningSerializationFlag.forkId
      );
    default:
      return undefined;
  }
};

export const compilerOperationHelperComputeSignatureBCH = ({
  coveredBytecode,
  identifier,
  transactionContext,
  operationName,
  privateKey,
  sha256,
  sign,
}: {
  coveredBytecode: Uint8Array;
  identifier: string;
  privateKey: Uint8Array;
  transactionContext: TransactionContextCommon;
  operationName: string;
  sign: (privateKey: Uint8Array, messageHash: Uint8Array) => Uint8Array;
  sha256: { hash: Sha256['hash'] };
}): CompilerOperationResult => {
  const [, , algorithm, unknown] = identifier.split('.') as (
    | string
    | undefined
  )[];
  if (unknown !== undefined) {
    return {
      error: `Unknown component in "${identifier}" – the fragment "${unknown}" is not recognized.`,
      status: 'error',
    };
  }

  if (algorithm === undefined) {
    return {
      error: `Invalid signature identifier. Signatures must be of the form: "[variable_id].${operationName}.[signing_serialization_type]".`,
      status: 'error',
    };
  }

  const signingSerializationType = getSigningSerializationType(algorithm);
  if (signingSerializationType === undefined) {
    return {
      error: `Unknown signing serialization algorithm, "${algorithm}".`,
      status: 'error',
    };
  }

  const serialization = generateSigningSerializationBCH({
    correspondingOutput: transactionContext.correspondingOutput,
    coveredBytecode,
    locktime: transactionContext.locktime,
    outpointIndex: transactionContext.outpointIndex,
    outpointTransactionHash: transactionContext.outpointTransactionHash,
    outputValue: transactionContext.outputValue,
    sequenceNumber: transactionContext.sequenceNumber,
    sha256,
    signingSerializationType,
    transactionOutpoints: transactionContext.transactionOutpoints,
    transactionOutputs: transactionContext.transactionOutputs,
    transactionSequenceNumbers: transactionContext.transactionSequenceNumbers,
    version: transactionContext.version,
  });
  const digest = sha256.hash(sha256.hash(serialization));
  const bitcoinEncodedSignature = Uint8Array.from([
    ...sign(privateKey, digest),
    ...signingSerializationType,
  ]);
  return {
    bytecode: bitcoinEncodedSignature,
    signature: { serialization },
    status: 'success',
  };
};

export const compilerOperationHelperHdKeySignatureBCH = ({
  operationName,
  secp256k1Method,
}: {
  operationName: string;
  secp256k1Method: keyof NonNullable<CompilationEnvironment['secp256k1']>;
}) =>
  attemptCompilerOperations(
    [compilerOperationAttemptBytecodeResolution],
    compilerOperationRequires({
      canBeSkipped: false,
      dataProperties: ['hdKeys', 'transactionContext'],
      environmentProperties: [
        'entityOwnership',
        'ripemd160',
        'secp256k1',
        'sha256',
        'sha512',
        'variables',
        'sourceScriptIds',
        'unlockingScripts',
      ],
      operation: (identifier, data, environment): CompilerOperationResult => {
        const { hdKeys, transactionContext } = data;
        const {
          secp256k1,
          sha256,
          sourceScriptIds,
          unlockingScripts,
        } = environment;

        const derivationResult = compilerOperationHelperDeriveHdKeyPrivate({
          environment,
          hdKeys,
          identifier,
        });
        if (derivationResult.status === 'error') return derivationResult;

        const result = compilerOperationHelperGenerateCoveredBytecode({
          data,
          environment,
          identifier,
          sourceScriptIds,
          unlockingScripts,
        });

        if ('error' in result) {
          return result;
        }

        return compilerOperationHelperComputeSignatureBCH({
          coveredBytecode: result,
          identifier,
          operationName,
          privateKey: derivationResult.bytecode,
          sha256,
          sign: secp256k1[secp256k1Method],
          transactionContext,
        });
      },
    })
  );

export const compilerOperationHdKeyEcdsaSignatureBCH = compilerOperationHelperHdKeySignatureBCH(
  {
    operationName: 'signature',
    secp256k1Method: 'signMessageHashDER',
  }
);
export const compilerOperationHdKeySchnorrSignatureBCH = compilerOperationHelperHdKeySignatureBCH(
  {
    operationName: 'schnorr_signature',
    secp256k1Method: 'signMessageHashSchnorr',
  }
);

export const compilerOperationHelperKeySignatureBCH = ({
  operationName,
  secp256k1Method,
}: {
  operationName: string;
  secp256k1Method: keyof NonNullable<CompilationEnvironment['secp256k1']>;
}) =>
  attemptCompilerOperations(
    [compilerOperationAttemptBytecodeResolution],
    compilerOperationRequires({
      canBeSkipped: false,
      dataProperties: ['keys', 'transactionContext'],
      environmentProperties: [
        'sha256',
        'secp256k1',
        'unlockingScripts',
        'sourceScriptIds',
      ],
      operation: (identifier, data, environment): CompilerOperationResult => {
        const { keys, transactionContext } = data;
        const {
          secp256k1,
          sha256,
          unlockingScripts,
          sourceScriptIds,
        } = environment;
        const { privateKeys } = keys;
        const [variableId] = identifier.split('.');

        const privateKey =
          privateKeys === undefined ? undefined : privateKeys[variableId];

        if (privateKey === undefined) {
          return {
            error: `Identifier "${identifier}" refers to a Key, but a private key for "${variableId}" (or an existing signature) was not provided in the compilation data.`,
            recoverable: true,
            status: 'error',
          };
        }

        const result = compilerOperationHelperGenerateCoveredBytecode({
          data,
          environment,
          identifier,
          sourceScriptIds,
          unlockingScripts,
        });

        if ('error' in result) {
          return result;
        }

        return compilerOperationHelperComputeSignatureBCH({
          coveredBytecode: result,
          identifier,
          operationName,
          privateKey,
          sha256,
          sign: secp256k1[secp256k1Method],
          transactionContext,
        });
      },
    })
  );

export const compilerOperationKeyEcdsaSignatureBCH = compilerOperationHelperKeySignatureBCH(
  {
    operationName: 'signature',
    secp256k1Method: 'signMessageHashDER',
  }
);
export const compilerOperationKeySchnorrSignatureBCH = compilerOperationHelperKeySignatureBCH(
  {
    operationName: 'schnorr_signature',
    secp256k1Method: 'signMessageHashSchnorr',
  }
);

export const compilerOperationHelperComputeDataSignatureBCH = <
  Data extends CompilationData,
  Environment extends AnyCompilationEnvironment<TransactionContextCommon>
>({
  data,
  environment,
  identifier,
  operationName,
  privateKey,
  sha256,
  sign,
}: {
  data: Data;
  environment: Environment;
  identifier: string;
  privateKey: Uint8Array;
  operationName: string;
  sign: (privateKey: Uint8Array, messageHash: Uint8Array) => Uint8Array;
  sha256: { hash: Sha256['hash'] };
}): CompilerOperationResult => {
  const [, , scriptId, unknown] = identifier.split('.') as [
    string,
    string | undefined,
    string | undefined,
    string | undefined
  ];

  if (unknown !== undefined) {
    return {
      error: `Unknown component in "${identifier}" – the fragment "${unknown}" is not recognized.`,
      status: 'error',
    };
  }

  if (scriptId === undefined) {
    return {
      error: `Invalid data signature identifier. Data signatures must be of the form: "[variable_id].${operationName}.[target_script_id]".`,
      status: 'error',
    };
  }

  const result = compilerOperationHelperCompileScript({
    data,
    environment,
    targetScriptId: scriptId,
  });

  if (result === false) {
    return {
      error: `Data signature tried to sign an unknown target script, "${scriptId}".`,
      status: 'error',
    };
  }

  if ('error' in result) {
    return result;
  }

  const digest = sha256.hash(result);
  return {
    bytecode: sign(privateKey, digest),
    signature: { message: result },
    status: 'success',
  };
};

export const compilerOperationHelperKeyDataSignatureBCH = ({
  operationName,
  secp256k1Method,
}: {
  operationName: string;
  secp256k1Method: keyof NonNullable<CompilationEnvironment['secp256k1']>;
}) =>
  attemptCompilerOperations(
    [compilerOperationAttemptBytecodeResolution],
    compilerOperationRequires({
      canBeSkipped: false,
      dataProperties: ['keys'],
      environmentProperties: ['sha256', 'secp256k1'],
      operation: (identifier, data, environment): CompilerOperationResult => {
        const { keys } = data;
        const { secp256k1, sha256 } = environment;
        const { privateKeys } = keys;
        const [variableId] = identifier.split('.');

        const privateKey =
          privateKeys === undefined ? undefined : privateKeys[variableId];

        if (privateKey === undefined) {
          return {
            error: `Identifier "${identifier}" refers to a Key, but a private key for "${variableId}" (or an existing signature) was not provided in the compilation data.`,
            recoverable: true,
            status: 'error',
          };
        }

        return compilerOperationHelperComputeDataSignatureBCH<
          typeof data,
          typeof environment
        >({
          data,
          environment,
          identifier,
          operationName,
          privateKey,
          sha256,
          sign: secp256k1[secp256k1Method],
        });
      },
    })
  );

export const compilerOperationKeyEcdsaDataSignatureBCH = compilerOperationHelperKeyDataSignatureBCH(
  {
    operationName: 'data_signature',
    secp256k1Method: 'signMessageHashDER',
  }
);
export const compilerOperationKeySchnorrDataSignatureBCH = compilerOperationHelperKeyDataSignatureBCH(
  {
    operationName: 'schnorr_data_signature',
    secp256k1Method: 'signMessageHashSchnorr',
  }
);

export const compilerOperationHelperHdKeyDataSignatureBCH = ({
  operationName,
  secp256k1Method,
}: {
  operationName: string;
  secp256k1Method: keyof NonNullable<CompilationEnvironment['secp256k1']>;
}) =>
  attemptCompilerOperations(
    [compilerOperationAttemptBytecodeResolution],
    compilerOperationRequires({
      canBeSkipped: false,
      dataProperties: ['hdKeys'],
      environmentProperties: [
        'entityOwnership',
        'ripemd160',
        'secp256k1',
        'sha256',
        'sha512',
        'variables',
      ],
      operation: (identifier, data, environment) => {
        const { hdKeys } = data;
        const { secp256k1, sha256 } = environment;

        const derivationResult = compilerOperationHelperDeriveHdKeyPrivate({
          environment,
          hdKeys,
          identifier,
        });
        if (derivationResult.status === 'error') return derivationResult;

        return compilerOperationHelperComputeDataSignatureBCH<
          typeof data,
          typeof environment
        >({
          data,
          environment,
          identifier,
          operationName,
          privateKey: derivationResult.bytecode,
          sha256,
          sign: secp256k1[secp256k1Method],
        });
      },
    })
  );

export const compilerOperationHdKeyEcdsaDataSignatureBCH = compilerOperationHelperHdKeyDataSignatureBCH(
  {
    operationName: 'data_signature',
    secp256k1Method: 'signMessageHashDER',
  }
);
export const compilerOperationHdKeySchnorrDataSignatureBCH = compilerOperationHelperHdKeyDataSignatureBCH(
  {
    operationName: 'schnorr_data_signature',
    secp256k1Method: 'signMessageHashSchnorr',
  }
);

export const compilerOperationSigningSerializationFullBCH = compilerOperationRequires(
  {
    canBeSkipped: false,
    dataProperties: ['transactionContext'],
    environmentProperties: ['sha256', 'sourceScriptIds', 'unlockingScripts'],
    operation: (identifier, data, environment): CompilerOperationResult => {
      const [, algorithmOrComponent, unknownPart] = identifier.split('.') as (
        | string
        | undefined
      )[];

      if (algorithmOrComponent === undefined) {
        return {
          error: `Invalid signing serialization operation. Include the desired component or algorithm, e.g. "signing_serialization.version".`,
          status: 'error',
        };
      }

      if (unknownPart !== undefined) {
        return {
          error: `Unknown component in "${identifier}" – the fragment "${unknownPart}" is not recognized.`,
          status: 'error',
        };
      }

      const signingSerializationType = getSigningSerializationType(
        algorithmOrComponent,
        'full_'
      );
      if (signingSerializationType === undefined) {
        return {
          error: `Unknown signing serialization algorithm, "${algorithmOrComponent}".`,
          status: 'error',
        };
      }

      const { sha256, sourceScriptIds, unlockingScripts } = environment;
      const result = compilerOperationHelperGenerateCoveredBytecode({
        data,
        environment,
        identifier,
        sourceScriptIds,
        unlockingScripts,
      });

      if ('error' in result) {
        return result;
      }

      const { transactionContext } = data;
      return {
        bytecode: generateSigningSerializationBCH({
          correspondingOutput: transactionContext.correspondingOutput,
          coveredBytecode: result,
          locktime: transactionContext.locktime,
          outpointIndex: transactionContext.outpointIndex,
          outpointTransactionHash: transactionContext.outpointTransactionHash,
          outputValue: transactionContext.outputValue,
          sequenceNumber: transactionContext.sequenceNumber,
          sha256,
          signingSerializationType,
          transactionOutpoints: transactionContext.transactionOutpoints,
          transactionOutputs: transactionContext.transactionOutputs,
          transactionSequenceNumbers:
            transactionContext.transactionSequenceNumbers,
          version: transactionContext.version,
        }),
        status: 'success',
      };
    },
  }
);

/* eslint-disable camelcase, @typescript-eslint/naming-convention */
export const compilerOperationsBCH = {
  ...compilerOperationsCommon,
  hdKey: {
    data_signature: compilerOperationHdKeyEcdsaDataSignatureBCH,
    public_key: compilerOperationsCommon.hdKey.public_key,
    schnorr_data_signature: compilerOperationHdKeySchnorrDataSignatureBCH,
    schnorr_signature: compilerOperationHdKeySchnorrSignatureBCH,
    signature: compilerOperationHdKeyEcdsaSignatureBCH,
  },
  key: {
    data_signature: compilerOperationKeyEcdsaDataSignatureBCH,
    public_key: compilerOperationsCommon.key.public_key,
    schnorr_data_signature: compilerOperationKeySchnorrDataSignatureBCH,
    schnorr_signature: compilerOperationKeySchnorrSignatureBCH,
    signature: compilerOperationKeyEcdsaSignatureBCH,
  },
  signingSerialization: {
    ...compilerOperationsCommon.signingSerialization,
    full_all_outputs: compilerOperationSigningSerializationFullBCH,
    full_all_outputs_single_input: compilerOperationSigningSerializationFullBCH,
    full_corresponding_output: compilerOperationSigningSerializationFullBCH,
    full_corresponding_output_single_input: compilerOperationSigningSerializationFullBCH,
    full_no_outputs: compilerOperationSigningSerializationFullBCH,
    full_no_outputs_single_input: compilerOperationSigningSerializationFullBCH,
  },
};
/* eslint-enable camelcase, @typescript-eslint/naming-convention */

export type TransactionContextBCH = TransactionContextCommon;
export type CompilationEnvironmentBCH = CompilationEnvironment<
  TransactionContextBCH,
  CompilerOperationsKeyBCH
>;

/**
 * Create a compiler using the default BCH environment.
 *
 * Internally instantiates the necessary crypto and VM implementations – use
 * `createCompiler` for more control.
 *
 * @param scriptsAndOverrides - a compilation environment from which properties
 * will be used to override properties of the default BCH environment – must
 * include the `scripts` property
 */
export const createCompilerBCH = async <
  TransactionContext extends TransactionContextCommon,
  Environment extends AnyCompilationEnvironment<TransactionContext>,
  ProgramState extends AuthenticationProgramStateBCH
>(
  scriptsAndOverrides: Environment
) => {
  const [sha1, sha256, sha512, ripemd160, secp256k1] = await Promise.all([
    instantiateSha1(),
    instantiateSha256(),
    instantiateSha512(),
    instantiateRipemd160(),
    instantiateSecp256k1(),
  ]);
  const vm = createAuthenticationVirtualMachine(
    createInstructionSetBCH({
      flags: getFlagsForInstructionSetBCH(instructionSetBCHCurrentStrict),
      ripemd160,
      secp256k1,
      sha1,
      sha256,
    })
  );
  return createCompiler<
    TransactionContext,
    Environment,
    OpcodesBCH,
    ProgramState
  >({
    ...{
      createAuthenticationProgram: createAuthenticationProgramEvaluationCommon,
      opcodes: generateBytecodeMap(OpcodesBCH),
      operations: compilerOperationsBCH,
      ripemd160,
      secp256k1,
      sha256,
      sha512,
      vm,
    },
    ...scriptsAndOverrides,
  });
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
  TransactionContext extends TransactionContextCommon,
  Environment extends AnyCompilationEnvironment<TransactionContext>,
  ProgramState extends AuthenticationProgramStateBCH
>(
  template: AuthenticationTemplate,
  overrides?: CompilationEnvironment<TransactionContext>
) =>
  createCompilerBCH<TransactionContext, Environment, ProgramState>({
    ...overrides,
    ...authenticationTemplateToCompilationEnvironment(template),
  } as Environment);
