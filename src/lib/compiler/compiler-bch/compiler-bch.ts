import {
  hash256,
  ripemd160 as internalRipemd160,
  secp256k1 as internalSecp256k1,
  sha256 as internalSha256,
  sha512 as internalSha512,
} from '../../crypto/crypto.js';
import type {
  AnyCompilerConfiguration,
  AuthenticationProgramStateBch,
  CompilationContextBch,
  CompilationData,
  CompilerConfiguration,
  CompilerOperationResult,
  Sha256,
  WalletTemplate,
} from '../../lib.js';
import { encodeTokenPrefix } from '../../message/message.js';
import {
  createVirtualMachineBch,
  generateBytecodeMap,
  generateSigningSerializationBch,
  OpcodesBchSpec,
  SigningSerializationFlag,
  SigningSerializationTypeBch,
} from '../../vm/vm.js';
import {
  attemptCompilerOperations,
  compilerOperationAttemptBytecodeResolution,
  compilerOperationHelperCompileScript,
  compilerOperationHelperDeriveHdKeyPrivate,
  compilerOperationHelperGenerateCoveredBytecode,
  compilerOperationRequires,
} from '../compiler-operation-helpers.js';
import { compilerOperationsCommon } from '../compiler-operations.js';
import {
  compilerConfigurationToCompilerBch,
  createAuthenticationProgramEvaluationCommon,
  walletTemplateToCompilerConfiguration,
} from '../compiler-utils.js';

export type CompilerOperationsKeyBch =
  | 'data_signature'
  | 'ecdsa_signature'
  | 'public_key'
  | 'schnorr_data_signature'
  | 'schnorr_signature';

export enum SigningSerializationAlgorithmIdentifier {
  /**
   * A.K.A. `SIGHASH_ALL|SIGHASH_FORKID`
   */
  allOutputs = 'all_outputs',
  /**
   * A.K.A. `SIGHASH_ALL|SIGHASH_UTXOS|SIGHASH_FORKID`
   */
  allOutputsAllUtxos = 'all_outputs_all_utxos',
  /**
   * A.K.A. `SIGHASH_ALL|SIGHASH_FORKID|ANYONECANPAY`
   */
  allOutputsSingleInput = 'all_outputs_single_input',
  /**
   * A.K.A. `SIGHASH_ALL|SIGHASH_UTXOS|SIGHASH_FORKID|ANYONECANPAY`
   */
  allOutputsSingleInputInvalidAllUtxos = 'all_outputs_single_input_INVALID_all_utxos',
  /**
   * A.K.A. `SIGHASH_SINGLE|SIGHASH_FORKID`
   */
  correspondingOutput = 'corresponding_output',
  /**
   * A.K.A. `SIGHASH_SINGLE|SIGHASH_UTXOS|SIGHASH_FORKID`
   */
  correspondingOutputAllUtxos = 'corresponding_output_all_utxos',
  /**
   * A.K.A. `SIGHASH_SINGLE|SIGHASH_FORKID|ANYONECANPAY`
   */
  correspondingOutputSingleInput = 'corresponding_output_single_input',
  /**
   * A.K.A. `SIGHASH_SINGLE|SIGHASH_UTXOS|SIGHASH_FORKID|ANYONECANPAY`
   */
  correspondingOutputSingleInputInvalidAllUtxos = 'corresponding_output_single_input_INVALID_all_utxos',
  /**
   * An alias for `all_outputs_all_utxos`
   * (A.K.A. `SIGHASH_ALL|SIGHASH_UTXOS|SIGHASH_FORKID`),
   * the most secure signing serialization algorithm.
   *
   * Note that as of 2022, `all_outputs` (A.K.A. `SIGHASH_ALL|SIGHASH_FORKID`)
   * is more commonly used and is therefore a better choice for privacy in
   * common, existing contract types.
   */
  default = 'default',
  /**
   * A.K.A `SIGHASH_NONE|SIGHASH_FORKID`
   */
  noOutputs = 'no_outputs',
  /**
   * A.K.A `SIGHASH_NONE|SIGHASH_UTXOS|SIGHASH_FORKID`
   */
  noOutputsAllUtxos = 'no_outputs_all_utxos',
  /**
   * A.K.A `SIGHASH_NONE|SIGHASH_FORKID|ANYONECANPAY`
   */
  noOutputsSingleInput = 'no_outputs_single_input',
  /**
   * A.K.A. `SIGHASH_NONE|SIGHASH_UTXOS|SIGHASH_FORKID|ANYONECANPAY`
   */
  noOutputsSingleInputInvalidAllUtxos = 'no_outputs_single_input_INVALID_all_utxos',
}

// eslint-disable-next-line complexity
const getSigningSerializationType = (
  algorithmIdentifier: string,
  prefix = '',
) => {
  switch (algorithmIdentifier) {
    case `${prefix}${SigningSerializationAlgorithmIdentifier.allOutputs}`:
      return Uint8Array.of(SigningSerializationTypeBch.allOutputs);
    case `${prefix}${SigningSerializationAlgorithmIdentifier.allOutputsAllUtxos}`:
    case `${prefix}${SigningSerializationAlgorithmIdentifier.default}`:
      return Uint8Array.of(SigningSerializationTypeBch.allOutputsAllUtxos);
    case `${prefix}${SigningSerializationAlgorithmIdentifier.allOutputsSingleInput}`:
      return Uint8Array.of(SigningSerializationTypeBch.allOutputsSingleInput);
    case `${prefix}${SigningSerializationAlgorithmIdentifier.allOutputsSingleInputInvalidAllUtxos}`:
      return Uint8Array.of(
        // eslint-disable-next-line no-bitwise
        SigningSerializationFlag.allOutputs |
          SigningSerializationFlag.singleInput |
          SigningSerializationFlag.utxos |
          SigningSerializationFlag.forkId,
      );
    case `${prefix}${SigningSerializationAlgorithmIdentifier.correspondingOutput}`:
      return Uint8Array.of(SigningSerializationTypeBch.correspondingOutput);
    case `${prefix}${SigningSerializationAlgorithmIdentifier.correspondingOutputAllUtxos}`:
      return Uint8Array.of(
        SigningSerializationTypeBch.correspondingOutputAllUtxos,
      );
    case `${prefix}${SigningSerializationAlgorithmIdentifier.correspondingOutputSingleInput}`:
      return Uint8Array.of(
        SigningSerializationTypeBch.correspondingOutputSingleInput,
      );
    case `${prefix}${SigningSerializationAlgorithmIdentifier.correspondingOutputSingleInputInvalidAllUtxos}`:
      return Uint8Array.of(
        // eslint-disable-next-line no-bitwise
        SigningSerializationFlag.correspondingOutput |
          SigningSerializationFlag.singleInput |
          SigningSerializationFlag.utxos |
          SigningSerializationFlag.forkId,
      );
    case `${prefix}${SigningSerializationAlgorithmIdentifier.noOutputs}`:
      return Uint8Array.of(SigningSerializationTypeBch.noOutputs);
    case `${prefix}${SigningSerializationAlgorithmIdentifier.noOutputsAllUtxos}`:
      return Uint8Array.of(SigningSerializationTypeBch.noOutputsAllUtxos);
    case `${prefix}${SigningSerializationAlgorithmIdentifier.noOutputsSingleInput}`:
      return Uint8Array.of(SigningSerializationTypeBch.noOutputsSingleInput);
    case `${prefix}${SigningSerializationAlgorithmIdentifier.noOutputsSingleInputInvalidAllUtxos}`:
      return Uint8Array.of(
        // eslint-disable-next-line no-bitwise
        SigningSerializationFlag.noOutputs |
          SigningSerializationFlag.singleInput |
          SigningSerializationFlag.utxos |
          SigningSerializationFlag.forkId,
      );
    default:
      return undefined;
  }
};

export const compilerOperationHelperComputeSignatureBch = ({
  coveredBytecode,
  identifier,
  compilationContext,
  operationName,
  privateKey,
  sha256,
  sign,
}: {
  coveredBytecode: Uint8Array;
  identifier: string;
  privateKey: Uint8Array;
  compilationContext: CompilationContextBch;
  operationName: string;
  sign: (
    privateKey: Uint8Array,
    messageHash: Uint8Array,
  ) => Uint8Array | string;
  sha256: { hash: Sha256['hash'] };
}): CompilerOperationResult => {
  const [, , algorithm, unknown] = identifier.split('.') as (
    | string
    | undefined
  )[];
  if (unknown !== undefined) {
    return {
      error: `Unknown component in "${identifier}" - the fragment "${unknown}" is not recognized.`,
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
  const serialization = generateSigningSerializationBch(
    compilationContext,
    { coveredBytecode, signingSerializationType },
    sha256,
  );
  const digest = hash256(serialization, sha256);
  const bitcoinEncodedSignature = Uint8Array.from([
    ...(sign(privateKey, digest) as Uint8Array),
    ...signingSerializationType,
  ]);
  return {
    bytecode: bitcoinEncodedSignature,
    signature: { serialization },
    status: 'success',
  };
};

export const compilerOperationHelperHdKeySignatureBch = ({
  operationName,
  secp256k1Method,
}: {
  operationName: string;
  secp256k1Method:
    | 'addTweakPrivateKey'
    | 'addTweakPublicKeyCompressed'
    | 'derivePublicKeyCompressed'
    | 'signMessageHashDER'
    | 'signMessageHashSchnorr';
}) =>
  attemptCompilerOperations(
    [compilerOperationAttemptBytecodeResolution],
    compilerOperationRequires({
      canBeSkipped: false,
      configurationProperties: [
        'entityOwnership',
        'ripemd160',
        'secp256k1',
        'sha256',
        'sha512',
        'variables',
        'sourceScriptIds',
        'unlockingScripts',
      ],
      dataProperties: ['hdKeys', 'compilationContext'],
      operation: (identifier, data, configuration): CompilerOperationResult => {
        const { hdKeys, compilationContext } = data;
        const { secp256k1, sha256, sourceScriptIds, unlockingScripts } =
          configuration;

        const derivationResult = compilerOperationHelperDeriveHdKeyPrivate({
          configuration,
          hdKeys,
          identifier,
        });
        if (derivationResult.status === 'error') return derivationResult;

        const result = compilerOperationHelperGenerateCoveredBytecode({
          configuration,
          data,
          identifier,
          sourceScriptIds,
          unlockingScripts,
        });

        if ('error' in result) {
          return result;
        }

        return compilerOperationHelperComputeSignatureBch({
          compilationContext,
          coveredBytecode: result,
          identifier,
          operationName,
          privateKey: derivationResult.bytecode,
          sha256,
          sign: secp256k1[secp256k1Method],
        });
      },
    }),
  );

export const compilerOperationHdKeyEcdsaSignatureBch =
  compilerOperationHelperHdKeySignatureBch({
    operationName: 'ecdsa_signature',
    secp256k1Method: 'signMessageHashDER',
  });
export const compilerOperationHdKeySchnorrSignatureBch =
  compilerOperationHelperHdKeySignatureBch({
    operationName: 'schnorr_signature',
    secp256k1Method: 'signMessageHashSchnorr',
  });

export const compilerOperationHelperKeySignatureBch = ({
  operationName,
  secp256k1Method,
}: {
  operationName: string;
  secp256k1Method:
    | 'addTweakPrivateKey'
    | 'addTweakPublicKeyCompressed'
    | 'derivePublicKeyCompressed'
    | 'signMessageHashDER'
    | 'signMessageHashSchnorr';
}) =>
  attemptCompilerOperations(
    [compilerOperationAttemptBytecodeResolution],
    compilerOperationRequires({
      canBeSkipped: false,
      configurationProperties: [
        'sha256',
        'secp256k1',
        'unlockingScripts',
        'sourceScriptIds',
      ],
      dataProperties: ['keys', 'compilationContext'],
      operation: (identifier, data, configuration): CompilerOperationResult => {
        const { keys, compilationContext } = data;
        const { secp256k1, sha256, unlockingScripts, sourceScriptIds } =
          configuration;
        const { privateKeys } = keys;
        const [variableId] = identifier.split('.') as [string];

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
          configuration,
          data,
          identifier,
          sourceScriptIds,
          unlockingScripts,
        });

        if ('error' in result) {
          return result;
        }

        return compilerOperationHelperComputeSignatureBch({
          compilationContext,
          coveredBytecode: result,
          identifier,
          operationName,
          privateKey,
          sha256,
          sign: secp256k1[secp256k1Method],
        });
      },
    }),
  );

export const compilerOperationKeyEcdsaSignatureBch =
  compilerOperationHelperKeySignatureBch({
    operationName: 'ecdsa_signature',
    secp256k1Method: 'signMessageHashDER',
  });
export const compilerOperationKeySchnorrSignatureBch =
  compilerOperationHelperKeySignatureBch({
    operationName: 'schnorr_signature',
    secp256k1Method: 'signMessageHashSchnorr',
  });

export const compilerOperationHelperComputeDataSignatureBch = <
  Data extends CompilationData,
  Configuration extends AnyCompilerConfiguration<CompilationContextBch>,
>({
  data,
  configuration,
  identifier,
  operationName,
  privateKey,
  sha256,
  sign,
}: {
  data: Data;
  configuration: Configuration;
  identifier: string;
  privateKey: Uint8Array;
  operationName: string;
  sign: (
    privateKey: Uint8Array,
    messageHash: Uint8Array,
  ) => Uint8Array | string;
  sha256: { hash: Sha256['hash'] };
}): CompilerOperationResult => {
  const [, , scriptId, unknown] = identifier.split('.') as [
    string,
    string | undefined,
    string | undefined,
    string | undefined,
  ];

  if (unknown !== undefined) {
    return {
      error: `Unknown component in "${identifier}" - the fragment "${unknown}" is not recognized.`,
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
    configuration,
    data,
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
    bytecode: sign(privateKey, digest) as Uint8Array,
    signature: { digest, message: result },
    status: 'success',
  };
};

export const compilerOperationHelperKeyDataSignatureBch = ({
  operationName,
  secp256k1Method,
}: {
  operationName: string;
  secp256k1Method:
    | 'addTweakPrivateKey'
    | 'addTweakPublicKeyCompressed'
    | 'derivePublicKeyCompressed'
    | 'signMessageHashDER'
    | 'signMessageHashSchnorr';
}) =>
  attemptCompilerOperations(
    [compilerOperationAttemptBytecodeResolution],
    compilerOperationRequires({
      canBeSkipped: false,
      configurationProperties: ['sha256', 'secp256k1'],
      dataProperties: ['keys'],
      operation: (identifier, data, configuration): CompilerOperationResult => {
        const { keys } = data;
        const { secp256k1, sha256 } = configuration;
        const { privateKeys } = keys;
        const [variableId] = identifier.split('.') as [string];

        const privateKey =
          privateKeys === undefined ? undefined : privateKeys[variableId];

        if (privateKey === undefined) {
          return {
            error: `Identifier "${identifier}" refers to a Key, but a private key for "${variableId}" (or an existing signature) was not provided in the compilation data.`,
            recoverable: true,
            status: 'error',
          };
        }

        return compilerOperationHelperComputeDataSignatureBch<
          typeof data,
          typeof configuration
        >({
          configuration,
          data,
          identifier,
          operationName,
          privateKey,
          sha256,
          sign: secp256k1[secp256k1Method],
        });
      },
    }),
  );

export const compilerOperationKeyEcdsaDataSignatureBch =
  compilerOperationHelperKeyDataSignatureBch({
    operationName: 'ecdsa_data_signature',
    secp256k1Method: 'signMessageHashDER',
  });
export const compilerOperationKeySchnorrDataSignatureBch =
  compilerOperationHelperKeyDataSignatureBch({
    operationName: 'schnorr_data_signature',
    secp256k1Method: 'signMessageHashSchnorr',
  });

export const compilerOperationHelperHdKeyDataSignatureBch = ({
  operationName,
  secp256k1Method,
}: {
  operationName: string;
  secp256k1Method:
    | 'addTweakPrivateKey'
    | 'addTweakPublicKeyCompressed'
    | 'derivePublicKeyCompressed'
    | 'signMessageHashDER'
    | 'signMessageHashSchnorr';
}) =>
  attemptCompilerOperations(
    [compilerOperationAttemptBytecodeResolution],
    compilerOperationRequires({
      canBeSkipped: false,
      configurationProperties: [
        'entityOwnership',
        'ripemd160',
        'secp256k1',
        'sha256',
        'sha512',
        'variables',
      ],
      dataProperties: ['hdKeys'],
      operation: (identifier, data, configuration) => {
        const { hdKeys } = data;
        const { secp256k1, sha256 } = configuration;

        const derivationResult = compilerOperationHelperDeriveHdKeyPrivate({
          configuration,
          hdKeys,
          identifier,
        });
        if (derivationResult.status === 'error') return derivationResult;

        return compilerOperationHelperComputeDataSignatureBch<
          typeof data,
          typeof configuration
        >({
          configuration,
          data,
          identifier,
          operationName,
          privateKey: derivationResult.bytecode,
          sha256,
          sign: secp256k1[secp256k1Method],
        });
      },
    }),
  );

export const compilerOperationHdKeyEcdsaDataSignatureBch =
  compilerOperationHelperHdKeyDataSignatureBch({
    operationName: 'ecdsa_data_signature',
    secp256k1Method: 'signMessageHashDER',
  });
export const compilerOperationHdKeySchnorrDataSignatureBch =
  compilerOperationHelperHdKeyDataSignatureBch({
    operationName: 'schnorr_data_signature',
    secp256k1Method: 'signMessageHashSchnorr',
  });

export const compilerOperationSigningSerializationTokenPrefix =
  compilerOperationRequires({
    canBeSkipped: false,
    configurationProperties: [],
    dataProperties: ['compilationContext'],
    operation: (_, data) => ({
      bytecode: encodeTokenPrefix(
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        data.compilationContext.sourceOutputs[
          data.compilationContext.inputIndex
        ]!.token,
      ),
      status: 'success',
    }),
  });

export const compilerOperationSignatureRenamed = (identifier: string) => ({
  error: `The "signature" compiler operation was renamed to "ecdsa_signature". Consider fixing this error by changing "${identifier}" to "${identifier.replace(
    'signature',
    'schnorr_signature',
  )}" (schnorr signatures reduce transaction sizes and enable multi-party signature aggregation).`,
  status: 'error',
});

export const compilerOperationDataSignatureRenamed = (identifier: string) => ({
  error: `The "data_signature" compiler operation was renamed to "ecdsa_data_signature". Consider fixing this error by changing "${identifier}" to "${identifier.replace(
    'data_signature',
    'schnorr_data_signature',
  )}" (schnorr signatures reduce transaction sizes and enable multi-party signature aggregation).`,
  status: 'error',
});

export const compilerOperationSigningSerializationFullBch =
  compilerOperationRequires({
    canBeSkipped: false,
    configurationProperties: ['sha256', 'sourceScriptIds', 'unlockingScripts'],
    dataProperties: ['compilationContext'],
    operation: (identifier, data, configuration): CompilerOperationResult => {
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
          error: `Unknown component in "${identifier}" - the fragment "${unknownPart}" is not recognized.`,
          status: 'error',
        };
      }

      const signingSerializationType = getSigningSerializationType(
        algorithmOrComponent,
        'full_',
      );
      if (signingSerializationType === undefined) {
        return {
          error: `Unknown signing serialization algorithm, "${algorithmOrComponent}".`,
          status: 'error',
        };
      }

      const { sha256, sourceScriptIds, unlockingScripts } = configuration;
      const result = compilerOperationHelperGenerateCoveredBytecode({
        configuration,
        data,
        identifier,
        sourceScriptIds,
        unlockingScripts,
      });

      if ('error' in result) {
        return result;
      }

      const { compilationContext } = data;
      return {
        bytecode: generateSigningSerializationBch(
          compilationContext,
          {
            coveredBytecode: result,
            signingSerializationType,
          },
          sha256,
        ),
        status: 'success',
      };
    },
  });

/* eslint-disable camelcase, @typescript-eslint/naming-convention */
export const compilerOperationsBch = {
  ...compilerOperationsCommon,
  hdKey: {
    data_signature: compilerOperationDataSignatureRenamed,
    ecdsa_data_signature: compilerOperationHdKeyEcdsaDataSignatureBch,
    ecdsa_signature: compilerOperationHdKeyEcdsaSignatureBch,
    public_key: compilerOperationsCommon.hdKey.public_key,
    schnorr_data_signature: compilerOperationHdKeySchnorrDataSignatureBch,
    schnorr_signature: compilerOperationHdKeySchnorrSignatureBch,
    signature: compilerOperationSignatureRenamed,
  },
  key: {
    data_signature: compilerOperationDataSignatureRenamed,
    ecdsa_data_signature: compilerOperationKeyEcdsaDataSignatureBch,
    ecdsa_signature: compilerOperationKeyEcdsaSignatureBch,
    public_key: compilerOperationsCommon.key.public_key,
    schnorr_data_signature: compilerOperationKeySchnorrDataSignatureBch,
    schnorr_signature: compilerOperationKeySchnorrSignatureBch,
    signature: compilerOperationSignatureRenamed,
  },
  signingSerialization: {
    ...compilerOperationsCommon.signingSerialization,
    full_all_outputs: compilerOperationSigningSerializationFullBch,
    full_all_outputs_all_utxos: compilerOperationSigningSerializationFullBch,
    full_all_outputs_single_input: compilerOperationSigningSerializationFullBch,
    full_all_outputs_single_input_INVALID_all_utxos:
      compilerOperationSigningSerializationFullBch,
    full_corresponding_output: compilerOperationSigningSerializationFullBch,
    full_corresponding_output_all_utxos:
      compilerOperationSigningSerializationFullBch,
    full_corresponding_output_single_input:
      compilerOperationSigningSerializationFullBch,
    full_corresponding_output_single_input_INVALID_all_utxos:
      compilerOperationSigningSerializationFullBch,
    full_default: compilerOperationSigningSerializationFullBch,
    full_no_outputs: compilerOperationSigningSerializationFullBch,
    full_no_outputs_all_utxos: compilerOperationSigningSerializationFullBch,
    full_no_outputs_single_input: compilerOperationSigningSerializationFullBch,
    full_no_outputs_single_input_INVALID_all_utxos:
      compilerOperationSigningSerializationFullBch,
    token_prefix: compilerOperationSigningSerializationTokenPrefix,
  },
};
/* eslint-enable camelcase, @typescript-eslint/naming-convention */
/**
 * @deprecated Alias of `compilerOperationsBch` for backwards-compatibility.
 */
export const compilerOperationsBCH = compilerOperationsBch;

export type CompilerConfigurationBch = CompilerConfiguration<
  CompilationContextBch,
  CompilerOperationsKeyBch
>;
/**
 * @deprecated Alias of `CompilerConfigurationBch` for backwards-compatibility.
 */
export type CompilerConfigurationBCH = CompilerConfigurationBch;

/**
 * Create a compiler using the default BCH compiler configuration.
 *
 * Internally instantiates the necessary crypto and VM implementations – use
 * {@link compilerConfigurationToCompilerBch} for more control.
 *
 * @param configuration - a compiler configuration from which properties
 * will be used to override properties of the default BCH configuration – must
 * include the `scripts` property
 */
export const createCompilerBch = <
  Configuration extends CompilerConfiguration<CompilationContextBch>,
  ProgramState extends AuthenticationProgramStateBch,
>(
  configuration: Configuration,
) =>
  compilerConfigurationToCompilerBch<Configuration, ProgramState>({
    ...{
      createAuthenticationProgram: createAuthenticationProgramEvaluationCommon,
      opcodes: generateBytecodeMap(OpcodesBchSpec),
      operations: compilerOperationsBch,
      ripemd160: internalRipemd160,
      secp256k1: internalSecp256k1,
      sha256: internalSha256,
      sha512: internalSha512,
      vm: configuration.vm ?? createVirtualMachineBch(),
    },
    ...configuration,
  });
export const createCompiler = createCompilerBch;
/**
 * @deprecated Alias of `createCompilerBch` for backwards-compatibility.
 */
export const createCompilerBCH = createCompilerBch;

/**
 * Create a BCH `Compiler` from a `WalletTemplate` and an optional set
 * of overrides.
 * @param template - the `WalletTemplate` from which to create the BCH
 * compiler
 * @param overrides - a compiler configuration from which properties will be
 * used to override properties of the default BCH configuration
 */
export const walletTemplateToCompilerBch = <
  Configuration extends CompilerConfiguration<CompilationContextBch>,
  ProgramState extends AuthenticationProgramStateBch,
>(
  template: WalletTemplate,
  overrides?: Configuration,
) =>
  createCompilerBch<Configuration, ProgramState>({
    ...overrides,
    ...walletTemplateToCompilerConfiguration(template),
  } as Configuration);

/**
 * @deprecated Alias of `walletTemplateToCompilerBch` for backwards-compatibility.
 */
export const walletTemplateToCompilerBCH = walletTemplateToCompilerBch;
