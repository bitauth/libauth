import {
  bigIntToBinUint64LE,
  bigIntToBitcoinVarInt,
  numberToBinUint32LE,
} from '../format/numbers';
import { dateToLocktime } from '../format/time';
import { decodeHdPublicKey, deriveHdPath } from '../key/hd-key';
import { bigIntToScriptNumber } from '../vm/instruction-sets/instruction-sets';

import { CompilerDefaults } from './compiler-defaults';
import {
  attemptCompilerOperations,
  compilerOperationHelperAddressIndex,
  compilerOperationHelperDeriveHdPrivateNode,
  compilerOperationHelperUnknownEntity,
  compilerOperationRequires,
} from './compiler-operation-helpers';
import { HdKey } from './template-types';

export const compilerOperationAddressData = compilerOperationRequires({
  canBeSkipped: false,
  dataProperties: ['addressData'],
  environmentProperties: [],
  operation: (identifier, data) => {
    const { addressData } = data;
    if (identifier in addressData) {
      return addressData[identifier];
    }
    return `Identifier "${identifier}" refers to an AddressData, but "${identifier}" was not provided in the CompilationData "addressData".`;
  },
});

export const compilerOperationWalletData = compilerOperationRequires({
  canBeSkipped: false,
  dataProperties: ['walletData'],
  environmentProperties: [],
  operation: (identifier, data) => {
    const { walletData } = data;
    if (identifier in walletData) {
      return walletData[identifier];
    }
    return `Identifier "${identifier}" refers to a WalletData, but "${identifier}" was not provided in the CompilationData "walletData".`;
  },
});

export const compilerOperationCurrentBlockTime = compilerOperationRequires({
  canBeSkipped: false,
  dataProperties: ['currentBlockTime'],
  environmentProperties: [],
  operation: (_, data) => dateToLocktime(data.currentBlockTime),
});

export const compilerOperationCurrentBlockHeight = compilerOperationRequires({
  canBeSkipped: false,
  dataProperties: ['currentBlockHeight'],
  environmentProperties: [],
  operation: (_, data) => bigIntToScriptNumber(BigInt(data.currentBlockHeight)),
});

export const compilerOperationSigningSerializationCorrespondingOutput = compilerOperationRequires(
  {
    canBeSkipped: false,
    dataProperties: ['operationData'],
    environmentProperties: [],
    operation: (_, data) =>
      data.operationData.correspondingOutput === undefined
        ? Uint8Array.of()
        : data.operationData.correspondingOutput,
  }
);

export const compilerOperationSigningSerializationCorrespondingOutputHash = compilerOperationRequires(
  {
    canBeSkipped: false,
    dataProperties: ['operationData'],
    environmentProperties: ['sha256'],
    operation: (_, data, environment) =>
      data.operationData.correspondingOutput === undefined
        ? Uint8Array.of()
        : environment.sha256.hash(
            environment.sha256.hash(data.operationData.correspondingOutput)
          ),
  }
);

export const compilerOperationSigningSerializationCoveredBytecode = compilerOperationRequires(
  {
    canBeSkipped: false,
    dataProperties: ['operationData'],
    environmentProperties: [],
    operation: (_, data) => data.operationData.coveredBytecode,
  }
);

export const compilerOperationSigningSerializationCoveredBytecodeLength = compilerOperationRequires(
  {
    canBeSkipped: false,
    dataProperties: ['operationData'],
    environmentProperties: [],
    operation: (_, data) =>
      bigIntToBitcoinVarInt(BigInt(data.operationData.coveredBytecode.length)),
  }
);

export const compilerOperationSigningSerializationLocktime = compilerOperationRequires(
  {
    canBeSkipped: false,
    dataProperties: ['operationData'],
    environmentProperties: [],
    operation: (_, data) => numberToBinUint32LE(data.operationData.locktime),
  }
);

export const compilerOperationSigningSerializationOutpointIndex = compilerOperationRequires(
  {
    canBeSkipped: false,
    dataProperties: ['operationData'],
    environmentProperties: [],
    operation: (_, data) =>
      numberToBinUint32LE(data.operationData.outpointIndex),
  }
);

export const compilerOperationSigningSerializationOutpointTransactionHash = compilerOperationRequires(
  {
    canBeSkipped: false,
    dataProperties: ['operationData'],
    environmentProperties: [],
    operation: (_, data) => data.operationData.outpointTransactionHash,
  }
);

export const compilerOperationSigningSerializationOutputValue = compilerOperationRequires(
  {
    canBeSkipped: false,
    dataProperties: ['operationData'],
    environmentProperties: [],
    operation: (_, data) =>
      bigIntToBinUint64LE(BigInt(data.operationData.outputValue)),
  }
);

export const compilerOperationSigningSerializationSequenceNumber = compilerOperationRequires(
  {
    canBeSkipped: false,
    dataProperties: ['operationData'],
    environmentProperties: [],
    operation: (_, data) =>
      numberToBinUint32LE(data.operationData.sequenceNumber),
  }
);

export const compilerOperationSigningSerializationTransactionOutpoints = compilerOperationRequires(
  {
    canBeSkipped: false,
    dataProperties: ['operationData'],
    environmentProperties: [],
    operation: (_, data) => data.operationData.transactionOutpoints,
  }
);

export const compilerOperationSigningSerializationTransactionOutpointsHash = compilerOperationRequires(
  {
    canBeSkipped: false,
    dataProperties: ['operationData'],
    environmentProperties: ['sha256'],
    operation: (_, data, environment) =>
      environment.sha256.hash(
        environment.sha256.hash(data.operationData.transactionOutpoints)
      ),
  }
);

export const compilerOperationSigningSerializationTransactionOutputs = compilerOperationRequires(
  {
    canBeSkipped: false,
    dataProperties: ['operationData'],
    environmentProperties: [],
    operation: (_, data) => data.operationData.transactionOutputs,
  }
);

export const compilerOperationSigningSerializationTransactionOutputsHash = compilerOperationRequires(
  {
    canBeSkipped: false,
    dataProperties: ['operationData'],
    environmentProperties: ['sha256'],
    operation: (_, data, environment) =>
      environment.sha256.hash(
        environment.sha256.hash(data.operationData.transactionOutputs)
      ),
  }
);

export const compilerOperationSigningSerializationTransactionSequenceNumbers = compilerOperationRequires(
  {
    canBeSkipped: false,
    dataProperties: ['operationData'],
    environmentProperties: [],
    operation: (_, data) => data.operationData.transactionSequenceNumbers,
  }
);

export const compilerOperationSigningSerializationTransactionSequenceNumbersHash = compilerOperationRequires(
  {
    canBeSkipped: false,
    dataProperties: ['operationData'],
    environmentProperties: ['sha256'],
    operation: (_, data, environment) =>
      environment.sha256.hash(
        environment.sha256.hash(data.operationData.transactionSequenceNumbers)
      ),
  }
);

export const compilerOperationSigningSerializationVersion = compilerOperationRequires(
  {
    canBeSkipped: false,
    dataProperties: ['operationData'],
    environmentProperties: [],
    operation: (_, data) => numberToBinUint32LE(data.operationData.version),
  }
);

export const compilerOperationKeyPublicKeyCommon = attemptCompilerOperations(
  [
    compilerOperationRequires({
      canBeSkipped: true,
      dataProperties: ['keys'],
      environmentProperties: [],
      operation: (identifier, data) => {
        const { keys } = data;
        const { publicKeys } = keys;
        const [variableId] = identifier.split('.');
        if (
          publicKeys !== undefined &&
          (publicKeys[variableId] as Uint8Array | undefined) !== undefined
        ) {
          return publicKeys[variableId];
        }
        return false;
      },
    }),
  ],
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
        return secp256k1.derivePublicKeyCompressed(privateKeys[variableId]);
      }
      return `Identifier "${identifier}" refers to a public key, but no public or private keys for "${variableId}" were provided in the compilation data.`;
    },
  })
);

export const compilerOperationHdKeyPublicKeyCommon = attemptCompilerOperations(
  [
    compilerOperationRequires({
      canBeSkipped: true,
      dataProperties: ['hdKeys'],
      environmentProperties: [],
      operation: (identifier, data) => {
        const { hdKeys } = data;
        const { derivedPublicKeys } = hdKeys;
        const [variableId] = identifier.split('.');

        if (
          derivedPublicKeys !== undefined &&
          (derivedPublicKeys[variableId] as Uint8Array | undefined) !==
            undefined
        ) {
          return derivedPublicKeys[variableId];
        }

        return false;
      },
    }),
  ],
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
      (identifier, data, environment) => {
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
        const hdKey = environment.variables[variableId] as HdKey;

        if (entityHdPrivateKey !== undefined) {
          const privateResult = compilerOperationHelperDeriveHdPrivateNode({
            addressIndex,
            entityHdPrivateKey,
            entityId,
            environment,
            hdKey,
            identifier,
          });
          if (typeof privateResult === 'string') return privateResult;
          return environment.secp256k1.derivePublicKeyCompressed(privateResult);
        }

        const entityHdPublicKey =
          hdPublicKeys === undefined ? undefined : hdPublicKeys[entityId];

        if (entityHdPublicKey === undefined) {
          return `Identifier "${identifier}" refers to an HdKey owned by "${entityId}", but an HD private key or HD public key for this entity was not provided in the compilation data.`;
        }

        const addressOffset =
          hdKey.addressOffset ?? CompilerDefaults.hdKeyAddressOffset;
        const privateDerivationPath =
          hdKey.privateDerivationPath ??
          CompilerDefaults.hdKeyPrivateDerivationPath;
        const publicDerivationPath =
          hdKey.publicDerivationPath ?? privateDerivationPath.replace('m', 'M');

        const i = addressIndex + addressOffset;
        const instancePath = publicDerivationPath.replace('i', i.toString());

        const masterContents = decodeHdPublicKey(
          environment,
          entityHdPublicKey
        );
        if (typeof masterContents === 'string') {
          return `Could not generate "${identifier}" – the HD public key provided for "${entityId}" could not be decoded: ${masterContents}`;
        }

        const instanceNode = deriveHdPath(
          environment,
          masterContents.node,
          instancePath
        );

        if (typeof instanceNode === 'string') {
          return `Could not generate "${identifier}" – the path "${instancePath}" could not be derived for entity "${entityId}": ${instanceNode}`;
        }

        return instanceNode.publicKey;
      },
  })
);

/* eslint-disable camelcase */
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
/* eslint-enable camelcase */
