import { Sha256 } from '../crypto/sha256';
import {
  bigIntToBinUint64LE,
  bigIntToBitcoinVarInt,
  binToBigIntUint64LE,
  binToHex,
  binToNumberUint32LE,
  flattenBinArray,
  numberToBinUint32LE,
  readBitcoinVarInt,
} from '../format/format';

import {
  Input,
  Output,
  OutputUncappedAmount,
  Transaction,
} from './transaction-types';

const enum ByteLength {
  uint32 = 4,
  uint64 = 8,
  sha256Hash = 32,
}

/**
 * @param bin - the raw transaction from which to read the input
 * @param offset - the offset at which the input begins
 */
export const readTransactionInput = (bin: Uint8Array, offset: number) => {
  const offsetAfterTxHash = offset + ByteLength.sha256Hash;
  const outpointTransactionHash = bin
    .slice(offset, offsetAfterTxHash)
    .reverse();
  const offsetAfterOutpointIndex = offsetAfterTxHash + ByteLength.uint32;
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
  const nextOffset = offsetAfterBytecode + ByteLength.uint32;
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
 * Serialize a single input for inclusion in a serialized transaction.
 *
 * @param output - the input to serialize
 */
export const serializeInput = (input: Input) =>
  flattenBinArray([
    input.outpointTransactionHash.slice().reverse(),
    numberToBinUint32LE(input.outpointIndex),
    bigIntToBitcoinVarInt(BigInt(input.unlockingBytecode.length)),
    input.unlockingBytecode,
    numberToBinUint32LE(input.sequenceNumber),
  ]);

/**
 * Serialize a set of inputs for inclusion in a serialized transaction including
 * the prefixed number of inputs.
 *
 * Format: [BitcoinVarInt: input count] [serialized inputs]
 *
 * @param inputs - the set of inputs to serialize
 */
export const serializeInputs = (inputs: readonly Input[]) =>
  flattenBinArray([
    bigIntToBitcoinVarInt(BigInt(inputs.length)),
    ...inputs.map(serializeInput),
  ]);

/**
 * Read a single transaction output from a serialized transaction.
 *
 * @param bin - the raw transaction from which to read the output
 * @param offset - the offset at which the output begins
 */
export const readTransactionOutput = (bin: Uint8Array, offset: number) => {
  const offsetAfterSatoshis = offset + ByteLength.uint64;
  const satoshis = Number(
    binToBigIntUint64LE(bin.subarray(offset, offsetAfterSatoshis))
  );
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
 * Serialize a single output for inclusion in a serialized transaction.
 *
 * @param output - the output to serialize
 */
export const serializeOutput = (output: OutputUncappedAmount) =>
  flattenBinArray([
    typeof output.satoshis === 'number'
      ? bigIntToBinUint64LE(BigInt(output.satoshis))
      : output.satoshis,
    bigIntToBitcoinVarInt(BigInt(output.lockingBytecode.length)),
    output.lockingBytecode,
  ]);

/**
 * Serialize a set of outputs for inclusion in a serialized transaction
 * including the prefixed number of outputs.
 *
 * Format: [BitcoinVarInt: output count] [serialized outputs]
 *
 * @param outputs - the set of outputs to serialize
 */
export const serializeOutputsForTransaction = (
  outputs: readonly OutputUncappedAmount[]
) =>
  flattenBinArray([
    bigIntToBitcoinVarInt(BigInt(outputs.length)),
    ...outputs.map(serializeOutput),
  ]);

/**
 * Deserialize a serialized transaction into a `Transaction`.
 *
 * Note: this method throws runtime errors when attempting to deserialize
 * improperly serialized transactions. If the input is untrusted, catch errors
 * thrown by this method to ensure it is a valid serialization.
 *
 * @param bin - the raw transaction to decode
 */
export const deserializeTransaction = (bin: Uint8Array): Transaction => {
  const version = binToNumberUint32LE(bin.subarray(0, ByteLength.uint32));
  const offsetAfterVersion = ByteLength.uint32;
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
    bin.subarray(cursor, cursor + ByteLength.uint32)
  );
  return {
    inputs,
    locktime,
    outputs,
    version,
  };
};

/**
 * Serialize a `Transaction` using the standard P2P network format. This
 * serialization is also used when computing the transaction's hash (A.K.A.
 * "transaction ID" or "TXID").
 */
export const serializeTransaction = <
  TransactionType extends Transaction<
    Input,
    Output<Uint8Array, number | Uint8Array>
  > = Transaction
>(
  tx: TransactionType
) =>
  flattenBinArray([
    numberToBinUint32LE(tx.version),
    serializeInputs(tx.inputs),
    serializeOutputsForTransaction(tx.outputs),
    numberToBinUint32LE(tx.locktime),
  ]);

/**
 * Compute a transaction hash (A.K.A. "transaction ID" or "TXID") from a
 * serialized transaction in big-endian byte order. This is the byte order
 * typically used by block explorers and other user interfaces.
 *
 * @returns the transaction hash as a string
 *
 * @param transaction - the serialized transaction
 * @param sha256 - an implementation of sha256
 */
export const getTransactionHashBE = (
  sha256: { hash: Sha256['hash'] },
  transaction: Uint8Array
) => sha256.hash(sha256.hash(transaction));

/**
 * Compute a transaction hash (A.K.A. "transaction ID" or "TXID") from a
 * serialized transaction in little-endian byte order. This is the byte order
 * used in P2P network messages.
 *
 * @remarks
 * The result of sha256 is defined by its specification as big-endian, but
 * bitcoin message formats always reverse the order of this result for
 * serialization in P2P network messages.
 *
 * @returns the transaction hash in little-endian byte order
 *
 * @param transaction - the serialized transaction
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
 * @param transaction - the serialized transaction
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
export const serializeOutpoints = (
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
 * Serialize an array of transaction outputs for use in transaction signing
 * serializations.
 *
 * @param outputs - the array of outputs to serialize
 */
export const serializeOutputsForSigning = (outputs: readonly Output[]) =>
  flattenBinArray(outputs.map(serializeOutput));

/**
 * Serialize an array of input sequence numbers for use in transaction signing
 * serializations.
 *
 * @param inputs - the array of inputs from which to extract the sequence
 * numbers
 */
export const serializeSequenceNumbersForSigning = (
  inputs: readonly { sequenceNumber: number }[]
) => flattenBinArray(inputs.map((i) => numberToBinUint32LE(i.sequenceNumber)));
