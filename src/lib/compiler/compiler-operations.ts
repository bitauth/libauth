import {
  bigIntToCompactUint,
  numberToBinUint32LE,
  valueSatoshisToBin,
} from '../format/format.js';
import { decodeHdPublicKey, deriveHdPath } from '../key/key.js';
import type { CompilerOperationResult, WalletTemplateHdKey } from '../lib.js';
import {
  encodeTransactionInputSequenceNumbersForSigning,
  encodeTransactionOutpoints,
  encodeTransactionOutputsForSigning,
} from '../message/message.js';
import {
  bigIntToVmNumber,
  generateSigningSerializationComponentsBCH,
} from '../vm/vm.js';

import { CompilerDefaults } from './compiler-defaults.js';
import {
  attemptCompilerOperations,
  compilerOperationAttemptBytecodeResolution,
  compilerOperationHelperAddressIndex,
  compilerOperationHelperDeriveHdPrivateNode,
  compilerOperationHelperGenerateCoveredBytecode,
  compilerOperationHelperUnknownEntity,
  compilerOperationRequires,
} from './compiler-operation-helpers.js';

export const compilerOperationAddressData = compilerOperationRequires({
  canBeSkipped: false,
  configurationProperties: [],
  dataProperties: ['bytecode'],
  operation: (identifier, data) => {
    const bytecode = data.bytecode[identifier];
    if (bytecode !== undefined) {
      return { bytecode, status: 'success' };
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
  configurationProperties: [],
  dataProperties: ['bytecode'],
  operation: (identifier, data) => {
    const bytecode = data.bytecode[identifier];
    if (bytecode !== undefined) {
      return { bytecode, status: 'success' };
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
  configurationProperties: [],
  dataProperties: ['currentBlockTime'],
  operation: (_, data) => ({
    bytecode: numberToBinUint32LE(data.currentBlockTime),
    status: 'success',
  }),
});

export const compilerOperationCurrentBlockHeight = compilerOperationRequires({
  canBeSkipped: false,
  configurationProperties: [],
  dataProperties: ['currentBlockHeight'],
  operation: (_, data) => ({
    bytecode: bigIntToVmNumber(BigInt(data.currentBlockHeight)),
    status: 'success',
  }),
});

export const compilerOperationSigningSerializationCorrespondingOutput =
  compilerOperationRequires({
    canBeSkipped: false,
    configurationProperties: [],
    dataProperties: ['compilationContext'],
    operation: (_, data) => {
      const { correspondingOutput } = generateSigningSerializationComponentsBCH(
        data.compilationContext,
      );
      return correspondingOutput === undefined
        ? { bytecode: Uint8Array.of(), status: 'success' }
        : {
            bytecode: correspondingOutput,
            status: 'success',
          };
    },
  });

export const compilerOperationSigningSerializationCorrespondingOutputHash =
  compilerOperationRequires({
    canBeSkipped: false,
    configurationProperties: ['sha256'],
    dataProperties: ['compilationContext'],
    operation: (_, data, configuration) => {
      const { correspondingOutput } = generateSigningSerializationComponentsBCH(
        data.compilationContext,
      );
      return correspondingOutput === undefined
        ? { bytecode: Uint8Array.of(), status: 'success' }
        : {
            bytecode: configuration.sha256.hash(
              configuration.sha256.hash(correspondingOutput),
            ),
            status: 'success',
          };
    },
  });

const compilerOperationHelperSigningSerializationCoveredBytecode = (
  returnLength: boolean,
) =>
  compilerOperationRequires({
    canBeSkipped: false,
    configurationProperties: ['sourceScriptIds', 'unlockingScripts'],
    dataProperties: ['compilationContext'],
    operation: (identifier, data, configuration) => {
      const { unlockingScripts, sourceScriptIds } = configuration;
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

      return {
        bytecode: returnLength
          ? bigIntToCompactUint(BigInt(result.length))
          : result,
        status: 'success',
      };
    },
  });

export const compilerOperationSigningSerializationCoveredBytecode =
  compilerOperationHelperSigningSerializationCoveredBytecode(false);
export const compilerOperationSigningSerializationCoveredBytecodeLength =
  compilerOperationHelperSigningSerializationCoveredBytecode(true);

export const compilerOperationSigningSerializationLocktime =
  compilerOperationRequires({
    canBeSkipped: false,
    configurationProperties: [],
    dataProperties: ['compilationContext'],
    operation: (_, data) => ({
      bytecode: numberToBinUint32LE(
        data.compilationContext.transaction.locktime,
      ),
      status: 'success',
    }),
  });

export const compilerOperationSigningSerializationOutpointIndex =
  compilerOperationRequires({
    canBeSkipped: false,
    configurationProperties: [],
    dataProperties: ['compilationContext'],
    operation: (_, data) => ({
      bytecode: numberToBinUint32LE(
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        data.compilationContext.transaction.inputs[
          data.compilationContext.inputIndex
        ]!.outpointIndex,
      ),
      status: 'success',
    }),
  });

export const compilerOperationSigningSerializationOutpointTransactionHash =
  compilerOperationRequires({
    canBeSkipped: false,
    configurationProperties: [],
    dataProperties: ['compilationContext'],
    operation: (_, data) => ({
      bytecode:
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        data.compilationContext.transaction.inputs[
          data.compilationContext.inputIndex
        ]!.outpointTransactionHash,
      status: 'success',
    }),
  });

export const compilerOperationSigningSerializationOutputValue =
  compilerOperationRequires({
    canBeSkipped: false,
    configurationProperties: [],
    dataProperties: ['compilationContext'],
    operation: (_, data) => ({
      bytecode: valueSatoshisToBin(
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        data.compilationContext.sourceOutputs[
          data.compilationContext.inputIndex
        ]!.valueSatoshis,
      ),
      status: 'success',
    }),
  });

export const compilerOperationSigningSerializationSequenceNumber =
  compilerOperationRequires({
    canBeSkipped: false,
    configurationProperties: [],
    dataProperties: ['compilationContext'],
    operation: (_, data) => ({
      bytecode: numberToBinUint32LE(
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        data.compilationContext.transaction.inputs[
          data.compilationContext.inputIndex
        ]!.sequenceNumber,
      ),
      status: 'success',
    }),
  });

export const compilerOperationSigningSerializationTransactionOutpoints =
  compilerOperationRequires({
    canBeSkipped: false,
    configurationProperties: [],
    dataProperties: ['compilationContext'],
    operation: (_, data) => ({
      bytecode: encodeTransactionOutpoints(
        data.compilationContext.transaction.inputs,
      ),
      status: 'success',
    }),
  });

export const compilerOperationSigningSerializationTransactionOutpointsHash =
  compilerOperationRequires({
    canBeSkipped: false,
    configurationProperties: ['sha256'],
    dataProperties: ['compilationContext'],
    operation: (_, data, configuration) => ({
      bytecode: configuration.sha256.hash(
        configuration.sha256.hash(
          encodeTransactionOutpoints(
            data.compilationContext.transaction.inputs,
          ),
        ),
      ),
      status: 'success',
    }),
  });

export const compilerOperationSigningSerializationTransactionOutputs =
  compilerOperationRequires({
    canBeSkipped: false,
    configurationProperties: [],
    dataProperties: ['compilationContext'],
    operation: (_, data) => ({
      bytecode: encodeTransactionOutputsForSigning(
        data.compilationContext.transaction.outputs,
      ),
      status: 'success',
    }),
  });

export const compilerOperationSigningSerializationTransactionOutputsHash =
  compilerOperationRequires({
    canBeSkipped: false,
    configurationProperties: ['sha256'],
    dataProperties: ['compilationContext'],
    operation: (_, data, configuration) => ({
      bytecode: configuration.sha256.hash(
        configuration.sha256.hash(
          encodeTransactionOutputsForSigning(
            data.compilationContext.transaction.outputs,
          ),
        ),
      ),
      status: 'success',
    }),
  });

export const compilerOperationSigningSerializationTransactionSequenceNumbers =
  compilerOperationRequires({
    canBeSkipped: false,
    configurationProperties: [],
    dataProperties: ['compilationContext'],
    operation: (_, data) => ({
      bytecode: encodeTransactionInputSequenceNumbersForSigning(
        data.compilationContext.transaction.inputs,
      ),
      status: 'success',
    }),
  });

export const compilerOperationSigningSerializationTransactionSequenceNumbersHash =
  compilerOperationRequires({
    canBeSkipped: false,
    configurationProperties: ['sha256'],
    dataProperties: ['compilationContext'],
    operation: (_, data, configuration) => ({
      bytecode: configuration.sha256.hash(
        configuration.sha256.hash(
          encodeTransactionInputSequenceNumbersForSigning(
            data.compilationContext.transaction.inputs,
          ),
        ),
      ),
      status: 'success',
    }),
  });

export const compilerOperationSigningSerializationVersion =
  compilerOperationRequires({
    canBeSkipped: false,
    configurationProperties: [],
    dataProperties: ['compilationContext'],
    operation: (_, data) => ({
      bytecode: numberToBinUint32LE(
        data.compilationContext.transaction.version,
      ),
      status: 'success',
    }),
  });

export const compilerOperationKeyPublicKeyCommon = attemptCompilerOperations(
  [compilerOperationAttemptBytecodeResolution],
  compilerOperationRequires({
    canBeSkipped: false,
    configurationProperties: ['secp256k1'],
    dataProperties: ['keys'],
    operation: (identifier, data, configuration) => {
      const { keys } = data;
      const { secp256k1 } = configuration;
      const { privateKeys } = keys;
      const [variableId] = identifier.split('.') as [string];

      if (privateKeys?.[variableId] !== undefined) {
        return {
          bytecode: secp256k1.derivePublicKeyCompressed(
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            privateKeys[variableId]!,
          ) as Uint8Array,
          status: 'success',
        };
      }
      return {
        error: `Identifier "${identifier}" refers to a public key, but no public or private keys for "${variableId}" were provided in the compilation data.`,
        recoverable: true,
        status: 'error',
      };
    },
  }),
);

export const compilerOperationHdKeyPublicKeyCommon = attemptCompilerOperations(
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
    operation:
      // eslint-disable-next-line complexity
      (identifier, data, configuration): CompilerOperationResult => {
        const { hdKeys } = data;
        const { hdPrivateKeys, addressIndex, hdPublicKeys } = hdKeys;
        const [variableId] = identifier.split('.') as [string];

        const entityId = configuration.entityOwnership[variableId];
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
        const hdKey = configuration.variables[
          variableId
        ] as WalletTemplateHdKey;

        if (entityHdPrivateKey !== undefined) {
          const privateResult = compilerOperationHelperDeriveHdPrivateNode({
            addressIndex,
            configuration,
            entityHdPrivateKey,
            entityId,
            hdKey,
            identifier,
          });
          if (privateResult.status === 'error') return privateResult;
          return {
            bytecode: configuration.secp256k1.derivePublicKeyCompressed(
              privateResult.bytecode,
            ) as Uint8Array,
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
            error: `Could not generate ${identifier} - the path "${publicDerivationPath}" is not a valid "publicDerivationPath".`,
            status: 'error',
          };
        }

        const i = addressIndex + addressOffset;
        const instancePath = publicDerivationPath.replace('i', i.toString());

        const masterContents = decodeHdPublicKey(
          entityHdPublicKey,
          configuration,
        );
        if (typeof masterContents === 'string') {
          return {
            error: `Could not generate "${identifier}" - the HD public key provided for "${entityId}" could not be decoded: ${masterContents}`,
            status: 'error',
          };
        }

        const instanceNode = deriveHdPath(
          masterContents.node,
          instancePath,
          configuration,
        );

        if (typeof instanceNode === 'string') {
          return {
            error: `Could not generate "${identifier}" - the path "${instancePath}" could not be derived for entity "${entityId}": ${instanceNode}`,
            status: 'error',
          };
        }

        return { bytecode: instanceNode.publicKey, status: 'success' };
      },
  }),
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
    corresponding_output:
      compilerOperationSigningSerializationCorrespondingOutput,
    corresponding_output_hash:
      compilerOperationSigningSerializationCorrespondingOutputHash,
    covered_bytecode: compilerOperationSigningSerializationCoveredBytecode,
    covered_bytecode_length:
      compilerOperationSigningSerializationCoveredBytecodeLength,
    locktime: compilerOperationSigningSerializationLocktime,
    outpoint_index: compilerOperationSigningSerializationOutpointIndex,
    outpoint_transaction_hash:
      compilerOperationSigningSerializationOutpointTransactionHash,
    output_value: compilerOperationSigningSerializationOutputValue,
    sequence_number: compilerOperationSigningSerializationSequenceNumber,
    transaction_outpoints:
      compilerOperationSigningSerializationTransactionOutpoints,
    transaction_outpoints_hash:
      compilerOperationSigningSerializationTransactionOutpointsHash,
    transaction_outputs:
      compilerOperationSigningSerializationTransactionOutputs,
    transaction_outputs_hash:
      compilerOperationSigningSerializationTransactionOutputsHash,
    transaction_sequence_numbers:
      compilerOperationSigningSerializationTransactionSequenceNumbers,
    transaction_sequence_numbers_hash:
      compilerOperationSigningSerializationTransactionSequenceNumbersHash,
    version: compilerOperationSigningSerializationVersion,
  },
  walletData: compilerOperationWalletData,
};
/* eslint-enable camelcase, @typescript-eslint/naming-convention */
