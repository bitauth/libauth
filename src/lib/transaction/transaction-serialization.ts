import { Sha256 } from '../crypto/sha256';
import {
  bigIntToBitcoinVarInt,
  binToHex,
  binToNumberUint32LE,
  flattenBinArray,
  numberToBinUint32LE,
  readBitcoinVarInt,
} from '../format/format';

import { Input, Output, Transaction } from './transaction-types';

/**
 * @param bin - the raw transaction from which to read the input
 * @param offset - the offset at which the input begins
 */
export const readTransactionInput = (bin: Uint8Array, offset: number) => {
  const sha256HashBytes = 32;
  const uint32Bytes = 4;
  const offsetAfterTxHash = offset + sha256HashBytes;
  const outpointTransactionHash = bin
    .slice(offset, offsetAfterTxHash)
    .reverse();
  const offsetAfterOutpointIndex = offsetAfterTxHash + uint32Bytes;
  const outpointIndex = binToNumberUint32LE(
    bin.subarray(offsetAfterTxHash, offsetAfterOutpointIndex)
  );
  const {
    nextOffset: offsetAfterBytecodeLength,
    value: bytecodeLength,
  } = readBitcoinVarInt(bin, offsetAfterOutpointIndex);
  const offsetAfterBytecode =
    offsetAfterBytecodeLength + Number(bytecodeLength);
  const unlockingBytecode = bin.slice(
    offsetAfterBytecodeLength,
    offsetAfterBytecode
  );
  const nextOffset = offsetAfterBytecode + uint32Bytes;
  const sequenceNumber = binToNumberUint32LE(
    bin.subarray(offsetAfterBytecode, nextOffset)
  );
  return {
    input: {
      outpointIndex,
      outpointTransactionHash,
      sequenceNumber,
      unlockingBytecode,
    },
    nextOffset,
  };
};

/**
 * Encode a single input for inclusion in an encoded transaction.
 *
 * @param output - the input to encode
 */
export const encodeInput = (input: Input) =>
  flattenBinArray([
    input.outpointTransactionHash.slice().reverse(),
    numberToBinUint32LE(input.outpointIndex),
    bigIntToBitcoinVarInt(BigInt(input.unlockingBytecode.length)),
    input.unlockingBytecode,
    numberToBinUint32LE(input.sequenceNumber),
  ]);

/**
 * Encode a set of inputs for inclusion in an encoded transaction including
 * the prefixed number of inputs.
 *
 * Format: [BitcoinVarInt: input count] [encoded inputs]
 *
 * @param inputs - the set of inputs to encode
 */
export const encodeInputs = (inputs: readonly Input[]) =>
  flattenBinArray([
    bigIntToBitcoinVarInt(BigInt(inputs.length)),
    ...inputs.map(encodeInput),
  ]);

/**
 * Read a single transaction output from an encoded transaction.
 *
 * @param bin - the raw transaction from which to read the output
 * @param offset - the offset at which the output begins
 */
export const readTransactionOutput = (bin: Uint8Array, offset: number) => {
  const uint64Bytes = 8;
  const offsetAfterSatoshis = offset + uint64Bytes;
  const satoshis = bin.slice(offset, offsetAfterSatoshis);
  const { nextOffset: offsetAfterScriptLength, value } = readBitcoinVarInt(
    bin,
    offsetAfterSatoshis
  );
  const bytecodeLength = Number(value);
  const nextOffset = offsetAfterScriptLength + bytecodeLength;
  const lockingBytecode =
    bytecodeLength === 0
      ? new Uint8Array()
      : bin.slice(offsetAfterScriptLength, nextOffset);

  return {
    nextOffset,
    output: {
      lockingBytecode,
      satoshis,
    },
  };
};

/**
 * Encode a single output for inclusion in an encoded transaction.
 *
 * @param output - the output to encode
 */
export const encodeOutput = (output: Output) =>
  flattenBinArray([
    output.satoshis,
    bigIntToBitcoinVarInt(BigInt(output.lockingBytecode.length)),
    output.lockingBytecode,
  ]);

/**
 * Encode a set of outputs for inclusion in an encoded transaction
 * including the prefixed number of outputs.
 *
 * Format: [BitcoinVarInt: output count] [encoded outputs]
 *
 * @param outputs - the set of outputs to encode
 */
export const encodeOutputsForTransaction = (outputs: readonly Output[]) =>
  flattenBinArray([
    bigIntToBitcoinVarInt(BigInt(outputs.length)),
    ...outputs.map(encodeOutput),
  ]);

/**
 * Decode a `Uint8Array` using the version 1 or 2 raw transaction format.
 *
 * Note: this method throws runtime errors when attempting to decode messages
 * which do not properly follow the transaction format. If the input is
 * untrusted, use `decodeTransaction`.
 *
 * @param bin - the raw message to decode
 */
export const decodeTransactionUnsafe = (bin: Uint8Array): Transaction => {
  const uint32Bytes = 4;
  const version = binToNumberUint32LE(bin.subarray(0, uint32Bytes));
  const offsetAfterVersion = uint32Bytes;
  const {
    nextOffset: offsetAfterInputCount,
    value: inputCount,
  } = readBitcoinVarInt(bin, offsetAfterVersion);
  // eslint-disable-next-line functional/no-let
  let cursor = offsetAfterInputCount;
  const inputs = [];
  // eslint-disable-next-line functional/no-let, functional/no-loop-statement, no-plusplus
  for (let i = 0; i < Number(inputCount); i++) {
    const { input, nextOffset } = readTransactionInput(bin, cursor);
    // eslint-disable-next-line functional/no-expression-statement
    cursor = nextOffset;
    // eslint-disable-next-line functional/no-expression-statement, functional/immutable-data
    inputs.push(input);
  }
  const {
    nextOffset: offsetAfterOutputCount,
    value: outputCount,
  } = readBitcoinVarInt(bin, cursor);
  // eslint-disable-next-line functional/no-expression-statement
  cursor = offsetAfterOutputCount;
  const outputs = [];
  // eslint-disable-next-line functional/no-let, functional/no-loop-statement, no-plusplus
  for (let i = 0; i < Number(outputCount); i++) {
    const { output, nextOffset } = readTransactionOutput(bin, cursor);
    // eslint-disable-next-line functional/no-expression-statement
    cursor = nextOffset;
    // eslint-disable-next-line functional/no-expression-statement, functional/immutable-data
    outputs.push(output);
  }
  const locktime = binToNumberUint32LE(
    bin.subarray(cursor, cursor + uint32Bytes)
  );
  return {
    inputs,
    locktime,
    outputs,
    version,
  };
};

export enum TransactionDecodingError {
  invalidFormat = 'Transaction decoding error: message does not follow the version 1 or version 2 transaction format.',
}

/**
 * Decode a `Uint8Array` using the version 1 or 2 raw transaction format.
 *
 * @param bin - the raw message to decode
 */
export const decodeTransaction = (bin: Uint8Array) => {
  // eslint-disable-next-line functional/no-try-statement
  try {
    return decodeTransactionUnsafe(bin);
  } catch {
    return TransactionDecodingError.invalidFormat;
  }
};

/**
 * Encode a `Transaction` using the standard P2P network format. This
 * serialization is also used when computing the transaction's hash (A.K.A.
 * "transaction ID" or "TXID").
 */
export const encodeTransaction = (tx: Transaction) =>
  flattenBinArray([
    numberToBinUint32LE(tx.version),
    encodeInputs(tx.inputs),
    encodeOutputsForTransaction(tx.outputs),
    numberToBinUint32LE(tx.locktime),
  ]);

/**
 * Compute a transaction hash (A.K.A. "transaction ID" or "TXID") from an
 * encoded transaction in big-endian byte order. This is the byte order
 * typically used by block explorers and other user interfaces.
 *
 * @returns the transaction hash as a string
 *
 * @param transaction - the encoded transaction
 * @param sha256 - an implementation of sha256
 */
export const getTransactionHashBE = (
  sha256: { hash: Sha256['hash'] },
  transaction: Uint8Array
) => sha256.hash(sha256.hash(transaction));

/**
 * Compute a transaction hash (A.K.A. "transaction ID" or "TXID") from an
 * encoded transaction in little-endian byte order. This is the byte order
 * used in P2P network messages.
 *
 * @remarks
 * The result of sha256 is defined by its specification as big-endian, but
 * bitcoin message formats always reverse the order of this result for
 * serialization in P2P network messages.
 *
 * @returns the transaction hash in little-endian byte order
 *
 * @param transaction - the encoded transaction
 * @param sha256 - an implementation of sha256
 */
export const getTransactionHashLE = (
  sha256: { hash: Sha256['hash'] },
  transaction: Uint8Array
) => getTransactionHashBE(sha256, transaction).reverse();

/**
 * Return a `Transaction`'s hash as a string (in big-endian byte order as is
 * common for user interfaces).
 *
 * @param transaction - the encoded transaction
 * @param sha256 - an implementation of sha256
 */
export const getTransactionHash = (
  sha256: { hash: Sha256['hash'] },
  transaction: Uint8Array
) => binToHex(getTransactionHashBE(sha256, transaction));

/**
 * Get the hash of all outpoints in a series of inputs. (For use in
 * `hashTransactionOutpoints`.)
 *
 * @param inputs - the series of inputs from which to extract the outpoints
 * @param sha256 - an implementation of sha256
 */
export const encodeOutpoints = (
  inputs: readonly {
    outpointIndex: number;
    outpointTransactionHash: Uint8Array;
  }[]
) =>
  flattenBinArray(
    inputs.map((i) =>
      flattenBinArray([
        i.outpointTransactionHash.slice().reverse(),
        numberToBinUint32LE(i.outpointIndex),
      ])
    )
  );

/**
 * Encode an array of transaction outputs for use in transaction signing
 * serializations.
 *
 * @param outputs - the array of outputs to encode
 */
export const encodeOutputsForSigning = (outputs: readonly Output[]) =>
  flattenBinArray(outputs.map(encodeOutput));

/**
 * Encode an array of input sequence numbers for use in transaction signing
 * serializations.
 *
 * @param inputs - the array of inputs from which to extract the sequence
 * numbers
 */
export const encodeSequenceNumbersForSigning = (
  inputs: readonly { sequenceNumber: number }[]
) => flattenBinArray(inputs.map((i) => numberToBinUint32LE(i.sequenceNumber)));
