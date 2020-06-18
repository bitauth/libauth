import { bigIntToBitcoinVarInt, numberToBinUint32LE } from '../format/numbers';
import { decodeHdPublicKey, deriveHdPath } from '../key/hd-key';
import { bigIntToScriptNumber } from '../vm/instruction-sets/instruction-sets';

import { CompilerDefaults } from './compiler-defaults';
import {
  attemptCompilerOperations,
  compilerOperationAttemptBytecodeResolution,
  compilerOperationHelperAddressIndex,
  compilerOperationHelperDeriveHdPrivateNode,
  compilerOperationHelperGenerateCoveredBytecode,
  compilerOperationHelperUnknownEntity,
  compilerOperationRequires,
} from './compiler-operation-helpers';
import { CompilerOperationResult } from './compiler-types';
import { AuthenticationTemplateHdKey } from './template-types';

export const compilerOperationAddressData = compilerOperationRequires({
  canBeSkipped: false,
  dataProperties: ['bytecode'],
  environmentProperties: [],
  operation: (identifier, data) => {
    const { bytecode } = data;
    if (identifier in bytecode) {
      return { bytecode: bytecode[identifier], status: 'success' };
    }
    return {
      error: `Identifier "${identifier}" refers to an AddressData, but "${identifier}" was not provided in the CompilationData "bytecode".`,
      recoverable: true,
      status: 'error',
    };
  },
});

export const compilerOperationWalletData = compilerOperationRequires({
  canBeSkipped: false,
  dataProperties: ['bytecode'],
  environmentProperties: [],
  operation: (identifier, data) => {
    const { bytecode } = data;
    if (identifier in bytecode) {
      return { bytecode: bytecode[identifier], status: 'success' };
    }
    return {
      error: `Identifier "${identifier}" refers to a WalletData, but "${identifier}" was not provided in the CompilationData "bytecode".`,
      recoverable: true,
      status: 'error',
    };
  },
});

export const compilerOperationCurrentBlockTime = compilerOperationRequires({
  canBeSkipped: false,
  dataProperties: ['currentBlockTime'],
  environmentProperties: [],
  operation: (_, data) => {
    return {
      bytecode: numberToBinUint32LE(data.currentBlockTime),
      status: 'success',
    };
  },
});

export const compilerOperationCurrentBlockHeight = compilerOperationRequires({
  canBeSkipped: false,
  dataProperties: ['currentBlockHeight'],
  environmentProperties: [],
  operation: (_, data) => ({
    bytecode: bigIntToScriptNumber(BigInt(data.currentBlockHeight)),
    status: 'success',
  }),
});

export const compilerOperationSigningSerializationCorrespondingOutput = compilerOperationRequires(
  {
    canBeSkipped: false,
    dataProperties: ['transactionContext'],
    environmentProperties: [],
    operation: (_, data) =>
      data.transactionContext.correspondingOutput === undefined
        ? { bytecode: Uint8Array.of(), status: 'success' }
        : {
            bytecode: data.transactionContext.correspondingOutput,
            status: 'success',
          },
  }
);

export const compilerOperationSigningSerializationCorrespondingOutputHash = compilerOperationRequires(
  {
    canBeSkipped: false,
    dataProperties: ['transactionContext'],
    environmentProperties: ['sha256'],
    operation: (_, data, environment) =>
      data.transactionContext.correspondingOutput === undefined
        ? { bytecode: Uint8Array.of(), status: 'success' }
        : {
            bytecode: environment.sha256.hash(
              environment.sha256.hash(
                data.transactionContext.correspondingOutput
              )
            ),
            status: 'success',
          },
  }
);

const compilerOperationHelperSigningSerializationCoveredBytecode = (
  returnLength: boolean
) =>
  compilerOperationRequires({
    canBeSkipped: false,
    dataProperties: ['transactionContext'],
    environmentProperties: ['sourceScriptIds', 'unlockingScripts'],
    operation: (identifier, data, environment) => {
      const { unlockingScripts, sourceScriptIds } = environment;
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

      return {
        bytecode: returnLength
          ? bigIntToBitcoinVarInt(BigInt(result.length))
          : result,
        status: 'success',
      };
    },
  });

export const compilerOperationSigningSerializationCoveredBytecode = compilerOperationHelperSigningSerializationCoveredBytecode(
  false
);
export const compilerOperationSigningSerializationCoveredBytecodeLength = compilerOperationHelperSigningSerializationCoveredBytecode(
  true
);

export const compilerOperationSigningSerializationLocktime = compilerOperationRequires(
  {
    canBeSkipped: false,
    dataProperties: ['transactionContext'],
    environmentProperties: [],
    operation: (_, data) => ({
      bytecode: numberToBinUint32LE(data.transactionContext.locktime),
      status: 'success',
    }),
  }
);

export const compilerOperationSigningSerializationOutpointIndex = compilerOperationRequires(
  {
    canBeSkipped: false,
    dataProperties: ['transactionContext'],
    environmentProperties: [],
    operation: (_, data) => ({
      bytecode: numberToBinUint32LE(data.transactionContext.outpointIndex),
      status: 'success',
    }),
  }
);

export const compilerOperationSigningSerializationOutpointTransactionHash = compilerOperationRequires(
  {
    canBeSkipped: false,
    dataProperties: ['transactionContext'],
    environmentProperties: [],
    operation: (_, data) => ({
      bytecode: data.transactionContext.outpointTransactionHash,
      status: 'success',
    }),
  }
);

export const compilerOperationSigningSerializationOutputValue = compilerOperationRequires(
  {
    canBeSkipped: false,
    dataProperties: ['transactionContext'],
    environmentProperties: [],
    operation: (_, data) => ({
      bytecode: data.transactionContext.outputValue,
      status: 'success',
    }),
  }
);

export const compilerOperationSigningSerializationSequenceNumber = compilerOperationRequires(
  {
    canBeSkipped: false,
    dataProperties: ['transactionContext'],
    environmentProperties: [],
    operation: (_, data) => ({
      bytecode: numberToBinUint32LE(data.transactionContext.sequenceNumber),
      status: 'success',
    }),
  }
);

export const compilerOperationSigningSerializationTransactionOutpoints = compilerOperationRequires(
  {
    canBeSkipped: false,
    dataProperties: ['transactionContext'],
    environmentProperties: [],
    operation: (_, data) => ({
      bytecode: data.transactionContext.transactionOutpoints,
      status: 'success',
    }),
  }
);

export const compilerOperationSigningSerializationTransactionOutpointsHash = compilerOperationRequires(
  {
    canBeSkipped: false,
    dataProperties: ['transactionContext'],
    environmentProperties: ['sha256'],
    operation: (_, data, environment) => ({
      bytecode: environment.sha256.hash(
        environment.sha256.hash(data.transactionContext.transactionOutpoints)
      ),
      status: 'success',
    }),
  }
);

export const compilerOperationSigningSerializationTransactionOutputs = compilerOperationRequires(
  {
    canBeSkipped: false,
    dataProperties: ['transactionContext'],
    environmentProperties: [],
    operation: (_, data) => ({
      bytecode: data.transactionContext.transactionOutputs,
      status: 'success',
    }),
  }
);

export const compilerOperationSigningSerializationTransactionOutputsHash = compilerOperationRequires(
  {
    canBeSkipped: false,
    dataProperties: ['transactionContext'],
    environmentProperties: ['sha256'],
    operation: (_, data, environment) => ({
      bytecode: environment.sha256.hash(
        environment.sha256.hash(data.transactionContext.transactionOutputs)
      ),
      status: 'success',
    }),
  }
);

export const compilerOperationSigningSerializationTransactionSequenceNumbers = compilerOperationRequires(
  {
    canBeSkipped: false,
    dataProperties: ['transactionContext'],
    environmentProperties: [],
    operation: (_, data) => ({
      bytecode: data.transactionContext.transactionSequenceNumbers,
      status: 'success',
    }),
  }
);

export const compilerOperationSigningSerializationTransactionSequenceNumbersHash = compilerOperationRequires(
  {
    canBeSkipped: false,
    dataProperties: ['transactionContext'],
    environmentProperties: ['sha256'],
    operation: (_, data, environment) => ({
      bytecode: environment.sha256.hash(
        environment.sha256.hash(
          data.transactionContext.transactionSequenceNumbers
        )
      ),
      status: 'success',
    }),
  }
);

export const compilerOperationSigningSerializationVersion = compilerOperationRequires(
  {
    canBeSkipped: false,
    dataProperties: ['transactionContext'],
    environmentProperties: [],
    operation: (_, data) => ({
      bytecode: numberToBinUint32LE(data.transactionContext.version),
      status: 'success',
    }),
  }
);

export const compilerOperationKeyPublicKeyCommon = attemptCompilerOperations(
  [compilerOperationAttemptBytecodeResolution],
  compilerOperationRequires({
    canBeSkipped: false,
    dataProperties: ['keys'],
    environmentProperties: ['secp256k1'],
    operation: (identifier, data, environment) => {
      const { keys } = data;
      const { secp256k1 } = environment;
      const { privateKeys } = keys;
      const [variableId] = identifier.split('.');

      if (
        privateKeys !== undefined &&
        (privateKeys[variableId] as Uint8Array | undefined) !== undefined
      ) {
        return {
          bytecode: secp256k1.derivePublicKeyCompressed(
            privateKeys[variableId]
          ),
          status: 'success',
        };
      }
      return {
        error: `Identifier "${identifier}" refers to a public key, but no public or private keys for "${variableId}" were provided in the compilation data.`,
        recoverable: true,
        status: 'error',
      };
    },
  })
);

export const compilerOperationHdKeyPublicKeyCommon = attemptCompilerOperations(
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
    operation:
      // eslint-disable-next-line complexity
      (identifier, data, environment): CompilerOperationResult => {
        const { hdKeys } = data;
        const { hdPrivateKeys, addressIndex, hdPublicKeys } = hdKeys;
        const [variableId] = identifier.split('.');

        const entityId = environment.entityOwnership[variableId] as
          | string
          | undefined;
        if (entityId === undefined) {
          return compilerOperationHelperUnknownEntity(identifier, variableId);
        }

        if (addressIndex === undefined) {
          return compilerOperationHelperAddressIndex(identifier);
        }

        const entityHdPrivateKey =
          hdPrivateKeys === undefined ? undefined : hdPrivateKeys[entityId];

        /**
         * Guaranteed to be an `HdKey` if this method is reached in the compiler.
         */
        const hdKey = environment.variables[
          variableId
        ] as AuthenticationTemplateHdKey;

        if (entityHdPrivateKey !== undefined) {
          const privateResult = compilerOperationHelperDeriveHdPrivateNode({
            addressIndex,
            entityHdPrivateKey,
            entityId,
            environment,
            hdKey,
            identifier,
          });
          if (privateResult.status === 'error') return privateResult;
          return {
            bytecode: environment.secp256k1.derivePublicKeyCompressed(
              privateResult.bytecode
            ),
            status: 'success',
          };
        }

        const entityHdPublicKey =
          hdPublicKeys === undefined ? undefined : hdPublicKeys[entityId];

        if (entityHdPublicKey === undefined) {
          return {
            error: `Identifier "${identifier}" refers to an HdKey owned by "${entityId}", but an HD private key or HD public key for this entity was not provided in the compilation data.`,
            recoverable: true,
            status: 'error',
          };
        }

        const addressOffset =
          hdKey.addressOffset ?? CompilerDefaults.hdKeyAddressOffset;
        const privateDerivationPath =
          hdKey.privateDerivationPath ??
          CompilerDefaults.hdKeyPrivateDerivationPath;
        const publicDerivationPath =
          hdKey.publicDerivationPath ?? privateDerivationPath.replace('m', 'M');

        const validPublicPathWithIndex = /^M(?:\/(?:[0-9]+|i))*$/u;
        if (!validPublicPathWithIndex.test(publicDerivationPath)) {
          return {
            error: `Could not generate ${identifier} – the path "${publicDerivationPath}" is not a valid "publicDerivationPath".`,
            status: 'error',
          };
        }

        const i = addressIndex + addressOffset;
        const instancePath = publicDerivationPath.replace('i', i.toString());

        const masterContents = decodeHdPublicKey(
          environment,
          entityHdPublicKey
        );
        if (typeof masterContents === 'string') {
          return {
            error: `Could not generate "${identifier}" – the HD public key provided for "${entityId}" could not be decoded: ${masterContents}`,
            status: 'error',
          };
        }

        const instanceNode = deriveHdPath(
          environment,
          masterContents.node,
          instancePath
        );

        if (typeof instanceNode === 'string') {
          return {
            error: `Could not generate "${identifier}" – the path "${instancePath}" could not be derived for entity "${entityId}": ${instanceNode}`,
            status: 'error',
          };
        }

        return { bytecode: instanceNode.publicKey, status: 'success' };
      },
  })
);

/* eslint-disable camelcase, @typescript-eslint/naming-convention */
export const compilerOperationsCommon = {
  addressData: compilerOperationAddressData,
  currentBlockHeight: compilerOperationCurrentBlockHeight,
  currentBlockTime: compilerOperationCurrentBlockTime,
  hdKey: {
    public_key: compilerOperationHdKeyPublicKeyCommon,
  },
  key: {
    public_key: compilerOperationKeyPublicKeyCommon,
  },
  signingSerialization: {
    corresponding_output: compilerOperationSigningSerializationCorrespondingOutput,
    corresponding_output_hash: compilerOperationSigningSerializationCorrespondingOutputHash,
    covered_bytecode: compilerOperationSigningSerializationCoveredBytecode,
    covered_bytecode_length: compilerOperationSigningSerializationCoveredBytecodeLength,
    locktime: compilerOperationSigningSerializationLocktime,
    outpoint_index: compilerOperationSigningSerializationOutpointIndex,
    outpoint_transaction_hash: compilerOperationSigningSerializationOutpointTransactionHash,
    output_value: compilerOperationSigningSerializationOutputValue,
    sequence_number: compilerOperationSigningSerializationSequenceNumber,
    transaction_outpoints: compilerOperationSigningSerializationTransactionOutpoints,
    transaction_outpoints_hash: compilerOperationSigningSerializationTransactionOutpointsHash,
    transaction_outputs: compilerOperationSigningSerializationTransactionOutputs,
    transaction_outputs_hash: compilerOperationSigningSerializationTransactionOutputsHash,
    transaction_sequence_numbers: compilerOperationSigningSerializationTransactionSequenceNumbers,
    transaction_sequence_numbers_hash: compilerOperationSigningSerializationTransactionSequenceNumbersHash,
    version: compilerOperationSigningSerializationVersion,
  },
  walletData: compilerOperationWalletData,
};
/* eslint-enable camelcase, @typescript-eslint/naming-convention */
