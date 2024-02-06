import { hash256, sha256 as internalSha256 } from '../crypto/crypto.js';
import {
  bigIntToCompactUint,
  binToHex,
  flattenBinArray,
  formatError,
  numberToBinUint32LE,
  readCompactUintMinimal,
  readItemCount,
  readMultiple,
  valueSatoshisToBin,
} from '../format/format.js';
import type {
  Input,
  MaybeReadResult,
  Output,
  ReadPosition,
  Sha256,
  TransactionCommon,
} from '../lib.js';

import {
  readBytes,
  readCompactUintPrefixedBin,
  readRemainingBytes,
  readUint32LE,
  readUint64LE,
} from './read-components.js';
import { NonFungibleTokenCapability } from './transaction-types.js';

const enum TransactionConstants {
  outpointTransactionHashLength = 32,
}

/**
 * Encode a single input for inclusion in an encoded transaction.
 *
 * @param input - the input to encode
 */
export const encodeTransactionInput = (input: Input) =>
  flattenBinArray([
    input.outpointTransactionHash.slice().reverse(),
    numberToBinUint32LE(input.outpointIndex),
    bigIntToCompactUint(BigInt(input.unlockingBytecode.length)),
    input.unlockingBytecode,
    numberToBinUint32LE(input.sequenceNumber),
  ]);

export enum TransactionDecodingError {
  transaction = 'Error reading transaction.',
  endsWithUnexpectedBytes = 'Error decoding transaction: the provided input includes unexpected bytes after the encoded transaction.',
  input = 'Error reading transaction input.',
  inputs = 'Error reading transaction inputs.',
  output = 'Error reading transaction output.',
  outputs = 'Error reading transaction outputs.',
  lockingBytecodeLength = 'Error reading locking bytecode length.',
}

/**
 * Read a transaction {@link Input} from the provided {@link ReadPosition},
 * returning either an error message (as a string) or an object containing the
 * {@link Input} and the next {@link ReadPosition}.
 * @param position - the {@link ReadPosition} at which to start reading the
 * transaction output
 */
export const readTransactionInput = (
  position: ReadPosition,
): MaybeReadResult<Input> => {
  const inputRead = readMultiple(position, [
    readBytes(TransactionConstants.outpointTransactionHashLength),
    readUint32LE,
    readCompactUintPrefixedBin,
    readUint32LE,
  ]);
  if (typeof inputRead === 'string') {
    return formatError(TransactionDecodingError.input, inputRead);
  }
  const {
    position: nextPosition,
    result: [
      outpointTransactionHash,
      outpointIndex,
      unlockingBytecode,
      sequenceNumber,
    ],
  } = inputRead;
  return {
    position: nextPosition,
    result: {
      outpointIndex,
      outpointTransactionHash: outpointTransactionHash.reverse(),
      sequenceNumber,
      unlockingBytecode,
    },
  };
};

/**
 * Encode a set of {@link Input}s for inclusion in an encoded transaction
 * including the prefixed number of inputs.
 *
 * Format: [CompactUint: input count] [encoded inputs]
 *
 * @param inputs - the set of inputs to encode
 */
export const encodeTransactionInputs = (inputs: Input[]) =>
  flattenBinArray([
    bigIntToCompactUint(BigInt(inputs.length)),
    ...inputs.map(encodeTransactionInput),
  ]);

/**
 * Read a set of transaction {@link Input}s beginning at {@link ReadPosition}.
 * A CompactUint will be read to determine the number of inputs, and that
 * number of transaction inputs will be read and returned. Returns either an
 * error message (as a string) or an object containing the array of inputs and
 * the next {@link ReadPosition}.
 *
 * @param position - the {@link ReadPosition} at which to start reading the
 * transaction inputs
 */
export const readTransactionInputs = (
  position: ReadPosition,
): MaybeReadResult<Input[]> => {
  const inputsRead = readItemCount(position, readTransactionInput);
  if (typeof inputsRead === 'string') {
    return formatError(TransactionDecodingError.inputs, inputsRead);
  }
  return inputsRead;
};

const enum CashTokens {
  PREFIX_TOKEN = 0xef,
  HAS_AMOUNT = 0b00010000,
  HAS_NFT = 0b00100000,
  HAS_COMMITMENT_LENGTH = 0b01000000,
  RESERVED_BIT = 0b10000000,
  // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
  categoryLength = 32,
  tokenBitfieldIndex = 33,
  minimumPrefixLength = 34,
  tokenFormatMask = 0xf0,
  nftCapabilityMask = 0x0f,
  maximumCapability = 2,
  // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
  useBinaryOutput = 2,
}

const maximumTokenAmount = 9223372036854775807n;

export const nftCapabilityNumberToLabel = [
  NonFungibleTokenCapability.none,
  NonFungibleTokenCapability.mutable,
  NonFungibleTokenCapability.minting,
] as const;
export const nftCapabilityLabelToNumber: {
  [key in NonFungibleTokenCapability]: number;
} = {
  [NonFungibleTokenCapability.none]: 0,
  [NonFungibleTokenCapability.mutable]: 1,
  [NonFungibleTokenCapability.minting]: 2,
} as const;

export enum CashTokenDecodingError {
  invalidPrefix = 'Error reading token prefix.',
  insufficientLength = 'Invalid token prefix: insufficient length.',
  reservedBit = 'Invalid token prefix: reserved bit is set.',
  invalidCapability = 'Invalid token prefix: capability must be none (0), mutable (1), or minting (2).',
  commitmentWithoutNft = 'Invalid token prefix: commitment requires an NFT.',
  capabilityWithoutNft = 'Invalid token prefix: capability requires an NFT.',
  commitmentLengthZero = 'Invalid token prefix: if encoded, commitment length must be greater than 0.',
  invalidCommitment = 'Invalid token prefix: invalid non-fungible token commitment.',
  invalidAmountEncoding = 'Invalid token prefix: invalid fungible token amount encoding.',
  zeroAmount = 'Invalid token prefix: if encoded, fungible token amount must be greater than 0.',
  excessiveAmount = 'Invalid token prefix: exceeds maximum fungible token amount of 9223372036854775807.',
  noTokens = 'Invalid token prefix: must encode at least one token.',
}

/**
 * Read a token amount from the provided {@link ReadPosition}, returning either
 * an error message (as a string) or an object containing the value and the next
 * {@link ReadPosition}.
 *
 * @param position - the {@link ReadPosition} at which to start reading the
 * token amount.
 */
export const readTokenAmount = (
  position: ReadPosition,
): MaybeReadResult<bigint> => {
  const amountRead = readCompactUintMinimal(position);
  if (typeof amountRead === 'string') {
    return formatError(
      CashTokenDecodingError.invalidAmountEncoding,
      amountRead,
    );
  }
  if (amountRead.result > maximumTokenAmount) {
    return formatError(
      CashTokenDecodingError.excessiveAmount,
      `Encoded amount: ${amountRead.result}`,
    );
  }
  if (amountRead.result === 0n) {
    return formatError(CashTokenDecodingError.zeroAmount);
  }
  return amountRead;
};

/**
 * Attempt to read a transaction {@link Output}'s token prefix from the provided
 * {@link ReadPosition}, returning either an error message (as a string) or an
 * object containing the (optional) token information and the
 * next {@link ReadPosition}.
 *
 * Rather than using this function directly, most applications
 * should use {@link readLockingBytecodeWithPrefix}.
 *
 * @param position - the {@link ReadPosition} at which to start reading the
 * token prefix
 */
// eslint-disable-next-line complexity
export const readTokenPrefix = (
  position: ReadPosition,
): MaybeReadResult<{ token?: NonNullable<Output['token']> }> => {
  const { bin, index } = position;
  if (bin[index] !== CashTokens.PREFIX_TOKEN) {
    return { position, result: {} };
  }
  if (bin.length < index + CashTokens.minimumPrefixLength) {
    return formatError(
      CashTokenDecodingError.insufficientLength,
      `The minimum possible length is ${
        CashTokens.minimumPrefixLength
      }. Missing bytes: ${
        CashTokens.minimumPrefixLength - (bin.length - index)
      }`,
    );
  }
  const category = bin
    .slice(index + 1, index + CashTokens.tokenBitfieldIndex)
    .reverse();
  const tokenBitfield = bin[index + CashTokens.tokenBitfieldIndex]!; // eslint-disable-line @typescript-eslint/no-non-null-assertion
  /* eslint-disable no-bitwise */
  const prefixStructure = tokenBitfield & CashTokens.tokenFormatMask;
  if ((prefixStructure & CashTokens.RESERVED_BIT) !== 0) {
    return formatError(
      CashTokenDecodingError.reservedBit,
      `Bitfield: 0b${tokenBitfield.toString(CashTokens.useBinaryOutput)}`,
    );
  }
  const nftCapabilityInt = tokenBitfield & CashTokens.nftCapabilityMask;
  if (nftCapabilityInt > CashTokens.maximumCapability) {
    return formatError(
      CashTokenDecodingError.invalidCapability,
      `Capability value: ${nftCapabilityInt}`,
    );
  }
  const capability = nftCapabilityNumberToLabel[nftCapabilityInt]!; // eslint-disable-line @typescript-eslint/no-non-null-assertion
  const hasNft = (prefixStructure & CashTokens.HAS_NFT) !== 0;
  const hasCommitmentLength =
    (prefixStructure & CashTokens.HAS_COMMITMENT_LENGTH) !== 0;
  if (hasCommitmentLength && !hasNft) {
    return formatError(
      CashTokenDecodingError.commitmentWithoutNft,
      `Bitfield: 0b${tokenBitfield.toString(CashTokens.useBinaryOutput)}`,
    );
  }
  const hasAmount = (prefixStructure & CashTokens.HAS_AMOUNT) !== 0;
  /* eslint-enable no-bitwise */
  const nextPosition = {
    bin,
    index: index + CashTokens.tokenBitfieldIndex + 1,
  };
  if (hasNft) {
    const commitmentRead = hasCommitmentLength
      ? readCompactUintPrefixedBin(nextPosition)
      : { position: nextPosition, result: Uint8Array.of() };
    if (typeof commitmentRead === 'string') {
      return formatError(
        CashTokenDecodingError.invalidCommitment,
        commitmentRead,
      );
    }
    if (hasCommitmentLength && commitmentRead.result.length === 0) {
      return formatError(CashTokenDecodingError.commitmentLengthZero);
    }
    const amountRead = hasAmount
      ? readTokenAmount(commitmentRead.position)
      : { position: commitmentRead.position, result: 0n };
    if (typeof amountRead === 'string') {
      return amountRead;
    }
    return {
      position: amountRead.position,
      result: {
        token: {
          amount: amountRead.result,
          category,
          nft: { capability, commitment: commitmentRead.result },
        },
      },
    };
  }
  if (capability !== NonFungibleTokenCapability.none) {
    return formatError(
      CashTokenDecodingError.capabilityWithoutNft,
      `Bitfield: 0b${tokenBitfield.toString(CashTokens.useBinaryOutput)}`,
    );
  }
  if (!hasAmount) {
    return formatError(
      CashTokenDecodingError.noTokens,
      `Bitfield: 0b${tokenBitfield.toString(CashTokens.useBinaryOutput)}`,
    );
  }
  const amountRead = readTokenAmount(nextPosition);
  if (typeof amountRead === 'string') {
    return amountRead;
  }
  return {
    position: amountRead.position,
    result: { token: { amount: amountRead.result, category } },
  };
};

/**
 * Read the locking bytecode and token prefix (if present) of a transaction
 * {@link Output}, beginning at the `CompactUint` indicating the
 * combined length.
 * @param position - the {@link ReadPosition} at which to start reading the
 * optional token prefix and locking bytecode
 */
export const readLockingBytecodeWithPrefix = (
  position: ReadPosition,
): MaybeReadResult<{
  lockingBytecode: Uint8Array;
  token?: NonNullable<Output['token']>;
}> => {
  const bytecodeRead = readCompactUintPrefixedBin(position);
  if (typeof bytecodeRead === 'string') {
    return formatError(
      TransactionDecodingError.lockingBytecodeLength,
      bytecodeRead,
    );
  }
  const { result: contents, position: nextPosition } = bytecodeRead;
  const contentsRead = readMultiple({ bin: contents, index: 0 }, [
    readTokenPrefix,
    readRemainingBytes,
  ]);
  if (typeof contentsRead === 'string') {
    return formatError(CashTokenDecodingError.invalidPrefix, contentsRead);
  }
  const {
    result: [{ token }, lockingBytecode],
  } = contentsRead;
  return {
    position: nextPosition,
    result: { lockingBytecode, ...(token === undefined ? {} : { token }) },
  };
};

/**
 * Read a transaction {@link Output} from the provided {@link ReadPosition},
 * returning either an error message (as a string) or an object containing the
 * {@link Output} and the next {@link ReadPosition}.
 *
 * @param position - the {@link ReadPosition} at which to start reading the
 * transaction output
 */
export const readTransactionOutput = (
  position: ReadPosition,
): MaybeReadResult<Output> => {
  const outputRead = readMultiple(position, [
    readUint64LE,
    readLockingBytecodeWithPrefix,
  ]);
  if (typeof outputRead === 'string') {
    return formatError(TransactionDecodingError.output, outputRead);
  }
  const {
    position: nextPosition,
    result: [valueSatoshis, { lockingBytecode, token }],
  } = outputRead;
  return {
    position: nextPosition,
    result: {
      lockingBytecode,
      ...(token === undefined ? {} : { token }),
      valueSatoshis,
    },
  };
};

/**
 * Given {@link Output.token} data, encode a token prefix.
 *
 * This function does not fail, but returns an empty Uint8Array if the token
 * data does not encode any tokens (even if `token.category` is set).
 *
 * @param token - the token data to encode
 */
// eslint-disable-next-line complexity
export const encodeTokenPrefix = (token: Output['token']) => {
  if (token === undefined || (token.nft === undefined && token.amount < 1n)) {
    return Uint8Array.of();
  }
  const hasNft = token.nft === undefined ? 0 : CashTokens.HAS_NFT;
  const capabilityInt =
    token.nft === undefined
      ? 0
      : nftCapabilityLabelToNumber[token.nft.capability];
  const hasCommitmentLength =
    token.nft !== undefined && token.nft.commitment.length > 0
      ? CashTokens.HAS_COMMITMENT_LENGTH
      : 0;
  const hasAmount = token.amount > 0n ? CashTokens.HAS_AMOUNT : 0;
  const tokenBitfield =
    // eslint-disable-next-line no-bitwise
    hasNft | hasCommitmentLength | hasAmount | capabilityInt;
  return flattenBinArray([
    Uint8Array.of(CashTokens.PREFIX_TOKEN),
    token.category.slice().reverse(),
    Uint8Array.of(tokenBitfield),
    ...(hasCommitmentLength === 0
      ? []
      : [
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          bigIntToCompactUint(BigInt(token.nft!.commitment.length)),
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          token.nft!.commitment,
        ]),
    ...(hasAmount === 0 ? [] : [bigIntToCompactUint(token.amount)]),
  ]);
};

/**
 * Encode a single {@link Output} for inclusion in an encoded transaction.
 *
 * @param output - the output to encode
 */
export const encodeTransactionOutput = (output: Output) => {
  const lockingBytecodeField = flattenBinArray([
    encodeTokenPrefix(output.token),
    output.lockingBytecode,
  ]);
  return flattenBinArray([
    valueSatoshisToBin(output.valueSatoshis),
    bigIntToCompactUint(BigInt(lockingBytecodeField.length)),
    lockingBytecodeField,
  ]);
};

/**
 * Read a set of transaction {@link Output}s beginning at {@link ReadPosition}.
 * A CompactUint will be read to determine the number of outputs, and that
 * number of transaction outputs will be read and returned. Returns either an
 * error message (as a string) or an object containing the array of outputs and
 * the next {@link ReadPosition}.
 *
 * @param position - the {@link ReadPosition} at which to start reading the
 * transaction outputs
 */
export const readTransactionOutputs = (
  position: ReadPosition,
): MaybeReadResult<Output[]> => {
  const outputsRead = readItemCount(position, readTransactionOutput);
  if (typeof outputsRead === 'string') {
    return formatError(TransactionDecodingError.outputs, outputsRead);
  }
  return outputsRead;
};

/**
 * Encode a set of {@link Output}s for inclusion in an encoded transaction
 * including the prefixed number of outputs. Note, this encoding differs from
 * {@link encodeTransactionOutputsForSigning} (used for signing serializations).
 *
 * Format: [CompactUint: output count] [encoded outputs]
 *
 * @param outputs - the set of outputs to encode
 */
export const encodeTransactionOutputs = (outputs: Output[]) =>
  flattenBinArray([
    bigIntToCompactUint(BigInt(outputs.length)),
    ...outputs.map(encodeTransactionOutput),
  ]);

/**
 * Read a version 1 or 2 transaction beginning at {@link ReadPosition},
 * returning either an error message (as a string) or an object containing the
 * {@link Transaction} and the next {@link ReadPosition}. Rather than using this
 * function directly, most applications should
 * use {@link decodeTransactionCommon}.
 *
 * @param position - the {@link ReadPosition} at which to start reading the
 * {@link TransactionCommon}
 */
export const readTransactionCommon = (
  position: ReadPosition,
): MaybeReadResult<TransactionCommon> => {
  const transactionRead = readMultiple(position, [
    readUint32LE,
    readTransactionInputs,
    readTransactionOutputs,
    readUint32LE,
  ]);
  if (typeof transactionRead === 'string') {
    return formatError(TransactionDecodingError.transaction, transactionRead);
  }
  const {
    position: nextPosition,
    result: [version, inputs, outputs, locktime],
  } = transactionRead;
  return {
    position: nextPosition,
    result: { inputs, locktime, outputs, version },
  };
};

export const readTransaction = readTransactionCommon;

export const readTransactionOutputNonTokenAware = (
  pos: ReadPosition,
): MaybeReadResult<Output> => {
  const outputRead = readMultiple(pos, [
    readUint64LE,
    readCompactUintPrefixedBin,
  ]);
  if (typeof outputRead === 'string') {
    return formatError(TransactionDecodingError.output, outputRead);
  }
  const {
    position: nextPosition,
    result: [valueSatoshis, lockingBytecode],
  } = outputRead;
  return {
    position: nextPosition,
    result: { lockingBytecode, valueSatoshis },
  };
};

export const readTransactionOutputsNonTokenAware = (
  pos: ReadPosition,
): MaybeReadResult<Output[]> => {
  const outputsRead = readItemCount(pos, readTransactionOutputNonTokenAware);
  if (typeof outputsRead === 'string') {
    return formatError(TransactionDecodingError.outputs, outputsRead);
  }
  return outputsRead;
};

/**
 * Read a version 1 or 2 transaction beginning at a {@link ReadPosition} as if
 * CHIP-2022-02-CashTokens were not deployed, returning either an error message
 * (as a string) or an object containing the {@link Transaction} and the next
 * {@link ReadPosition}.
 *
 * This function emulates legacy transaction parsing to test behavior prior to
 * deployment of CHIP-2022-02-CashTokens; most applications should instead
 * use {@link readTransactionCommon}.
 *
 * @param position - the {@link ReadPosition} at which to start reading the
 * {@link TransactionCommon}
 */
export const readTransactionNonTokenAware = (
  position: ReadPosition,
): MaybeReadResult<TransactionCommon> => {
  const transactionRead = readMultiple(position, [
    readUint32LE,
    readTransactionInputs,
    readTransactionOutputsNonTokenAware,
    readUint32LE,
  ]);
  if (typeof transactionRead === 'string') {
    return formatError(TransactionDecodingError.transaction, transactionRead);
  }
  const {
    position: nextPosition,
    result: [version, inputs, outputs, locktime],
  } = transactionRead;
  return {
    position: nextPosition,
    result: { inputs, locktime, outputs, version },
  };
};

/**
 * Decode a {@link TransactionCommon} according to the version 1/2 P2P network
 * transaction format.
 *
 * This function verifies that the provided `bin` contains only one transaction
 * and no additional data. To read a transaction from a specific location within
 * a `Uint8Array`, use {@link readTransactionCommon}.
 *
 * @param bin - the encoded transaction to decode
 */
export const decodeTransactionCommon = (
  bin: Uint8Array,
): TransactionCommon | string => {
  const transactionRead = readTransactionCommon({ bin, index: 0 });
  if (typeof transactionRead === 'string') {
    return transactionRead;
  }
  if (transactionRead.position.index !== bin.length) {
    return formatError(
      TransactionDecodingError.endsWithUnexpectedBytes,
      `Encoded transaction ends at index ${
        transactionRead.position.index - 1
      }, leaving ${
        bin.length - transactionRead.position.index
      } remaining bytes.`,
    );
  }
  return transactionRead.result;
};
export const decodeTransactionBCH = decodeTransactionCommon;
export const decodeTransaction = decodeTransactionBCH;

/**
 * Decode a {@link TransactionCommon} from a trusted source according to the
 * version 1/2 P2P network transaction format.
 *
 * Note: this method throws runtime errors when attempting to decode messages
 * which do not properly follow the transaction format. If the input is
 * untrusted, use {@link decodeTransactionCommon}.
 *
 * @param bin - the raw message to decode
 */
export const decodeTransactionUnsafeCommon = (
  bin: Uint8Array,
): TransactionCommon => {
  const result = decodeTransactionCommon(bin);
  if (typeof result === 'string') {
    // eslint-disable-next-line functional/no-throw-statements
    throw new Error(result);
  }
  return result;
};
export const decodeTransactionUnsafeBCH = decodeTransactionUnsafeCommon;
export const decodeTransactionUnsafe = decodeTransactionUnsafeBCH;

/**
 * Encode a {@link Transaction} using the standard P2P network format. This
 * serialization is also used when computing the transaction's hash (A.K.A.
 * "transaction ID" or "TXID").
 */
export const encodeTransactionCommon = (tx: TransactionCommon) =>
  flattenBinArray([
    numberToBinUint32LE(tx.version),
    encodeTransactionInputs(tx.inputs),
    encodeTransactionOutputs(tx.outputs),
    numberToBinUint32LE(tx.locktime),
  ]);
export const encodeTransactionBCH = encodeTransactionCommon;
export const encodeTransaction = encodeTransactionBCH;

/**
 * @deprecated use `structuredClone` instead
 */
export const cloneTransactionInputsCommon = <
  Transaction extends TransactionCommon,
>(
  inputs: Transaction['inputs'],
) =>
  inputs.map((input) => ({
    outpointIndex: input.outpointIndex,
    outpointTransactionHash: input.outpointTransactionHash.slice(),
    sequenceNumber: input.sequenceNumber,
    unlockingBytecode: input.unlockingBytecode.slice(),
  }));

/**
 * @deprecated use `structuredClone` instead
 */
export const cloneTransactionOutputsCommon = <
  Transaction extends TransactionCommon,
>(
  outputs: Transaction['outputs'],
) =>
  outputs.map((output) => ({
    lockingBytecode: output.lockingBytecode.slice(),
    ...(output.token === undefined
      ? {}
      : {
          token: {
            amount: output.token.amount,
            category: output.token.category.slice(),
            ...(output.token.nft === undefined
              ? {}
              : {
                  nft: {
                    capability: output.token.nft.capability,
                    commitment: output.token.nft.commitment.slice(),
                  },
                }),
          },
        }),
    valueSatoshis: output.valueSatoshis,
  }));

/**
 * @deprecated use `structuredClone` instead
 */
export const cloneTransactionCommon = <Transaction extends TransactionCommon>(
  transaction: Transaction,
) => ({
  inputs: cloneTransactionInputsCommon(transaction.inputs),
  locktime: transaction.locktime,
  outputs: cloneTransactionOutputsCommon(transaction.outputs),
  version: transaction.version,
});

/**
 * Compute a transaction hash (A.K.A. "transaction ID" or "TXID") from an
 * encoded transaction in P2P network message order. This is the byte order
 * produced by most sha256 libraries and used by encoded P2P network messages.
 * It is also the byte order produced by `OP_SHA256` and `OP_HASH256` in the
 * virtual machine.
 *
 * @returns the transaction hash in P2P network message byte order
 *
 * @param transaction - the encoded transaction
 * @param sha256 - an implementation of sha256
 */
export const hashTransactionP2pOrder = (
  transaction: Uint8Array,
  sha256: { hash: Sha256['hash'] } = internalSha256,
) => hash256(transaction, sha256);

/**
 * Compute a transaction hash (A.K.A. "transaction ID" or "TXID") from an
 * encoded transaction in user interface byte order. This is the byte order
 * typically used by block explorers, wallets, and other user interfaces.
 *
 * To return this result as a `string`, use {@link hashTransaction}.
 *
 * @returns the transaction hash in User Interface byte order
 *
 * @param transaction - the encoded transaction
 * @param sha256 - an implementation of sha256
 */
export const hashTransactionUiOrder = (
  transaction: Uint8Array,
  sha256: { hash: Sha256['hash'] } = internalSha256,
) => hashTransactionP2pOrder(transaction, sha256).reverse();

/**
 * Return an encoded {@link Transaction}'s hash/ID as a string in user interface
 * byte order (typically used by wallets and block explorers).
 *
 * To return this result as a `Uint8Array`, use {@link hashTransactionUiOrder}.
 *
 * @param transaction - the encoded transaction
 */
export const hashTransaction = (transaction: Uint8Array) =>
  binToHex(hashTransactionUiOrder(transaction));

/**
 * Encode all outpoints in a series of transaction inputs. (For use in
 * {@link hashTransactionOutpoints}.)
 *
 * @param inputs - the series of inputs from which to extract the outpoints
 */
export const encodeTransactionOutpoints = (
  inputs: {
    outpointIndex: number;
    outpointTransactionHash: Uint8Array;
  }[],
) =>
  flattenBinArray(
    inputs.map((i) =>
      flattenBinArray([
        i.outpointTransactionHash.slice().reverse(),
        numberToBinUint32LE(i.outpointIndex),
      ]),
    ),
  );

/**
 * Encode an array of transaction {@link Output}s for use in transaction signing
 * serializations. Note, this encoding differs from
 * {@link encodeTransactionOutputs} (used for encoding full transactions).
 *
 * @param outputs - the array of outputs to encode
 */
export const encodeTransactionOutputsForSigning = (outputs: Output[]) =>
  flattenBinArray(outputs.map(encodeTransactionOutput));

/**
 * Encode the sequence numbers of an array of transaction inputs for use in
 * transaction signing serializations.
 *
 * @param inputs - the array of inputs from which to extract the sequence
 * numbers
 */
export const encodeTransactionInputSequenceNumbersForSigning = (
  inputs: { sequenceNumber: number }[],
) => flattenBinArray(inputs.map((i) => numberToBinUint32LE(i.sequenceNumber)));
