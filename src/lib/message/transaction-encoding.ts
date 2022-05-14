import { sha256 as internalSha256 } from '../crypto/default-crypto-instances.js';
import {
  bigIntToVarInt,
  binToHex,
  binToNumberUint32LE,
  decodeVarInt,
  flattenBinArray,
  numberToBinUint32LE,
} from '../format/format.js';
import type { Input, Output, Sha256, TransactionCommon } from '../lib';

/**
 * Encode a single input for inclusion in an encoded transaction.
 *
 * @param input - the input to encode
 */
export const encodeTransactionInput = (input: Input) =>
  flattenBinArray([
    input.outpointTransactionHash.slice().reverse(),
    numberToBinUint32LE(input.outpointIndex),
    bigIntToVarInt(BigInt(input.unlockingBytecode.length)),
    input.unlockingBytecode,
    numberToBinUint32LE(input.sequenceNumber),
  ]);

/**
 * Decode a transaction {@link Input} from a Uint8Array containing the encoded
 * transaction input beginning at `index`.
 *
 * Note: this method throws runtime errors when attempting to decode an
 * improperly-encoded input.
 *
 * @param bin - the raw transaction from which to read the input
 * @param index - the index at which the input begins
 */
export const decodeTransactionInputUnsafe = (
  bin: Uint8Array,
  index: number
) => {
  const sha256HashBytes = 32;
  const uint32Bytes = 4;
  const indexAfterTxHash = index + sha256HashBytes;
  const outpointTransactionHash = bin.slice(index, indexAfterTxHash).reverse();
  const indexAfterOutpointIndex = indexAfterTxHash + uint32Bytes;
  const outpointIndex = binToNumberUint32LE(
    bin.subarray(indexAfterTxHash, indexAfterOutpointIndex)
  );
  const { nextIndex: indexAfterBytecodeLength, value: bytecodeLength } =
    decodeVarInt(bin, indexAfterOutpointIndex);
  const indexAfterBytecode = indexAfterBytecodeLength + Number(bytecodeLength);
  const unlockingBytecode = bin.slice(
    indexAfterBytecodeLength,
    indexAfterBytecode
  );
  const nextIndex = indexAfterBytecode + uint32Bytes;
  const sequenceNumber = binToNumberUint32LE(
    bin.subarray(indexAfterBytecode, nextIndex)
  );
  return {
    input: {
      outpointIndex,
      outpointTransactionHash,
      sequenceNumber,
      unlockingBytecode,
    },
    nextIndex,
  };
};

/**
 * Encode a set of {@link Input}s for inclusion in an encoded transaction
 * including the prefixed number of inputs.
 *
 * Format: [VarInt: input count] [encoded inputs]
 *
 * @param inputs - the set of inputs to encode
 */
export const encodeTransactionInputs = (inputs: readonly Input[]) =>
  flattenBinArray([
    bigIntToVarInt(BigInt(inputs.length)),
    ...inputs.map(encodeTransactionInput),
  ]);

/**
 * Decode an array of items following a VarInt (see {@link decodeVarInt}). A
 * VarInt will be read beginning at `index`, and then the encoded number of
 * items will be decoded using `itemDecoder`.
 *
 * Note: the decoder produced by this method throws runtime errors when
 * attempting to decode improperly-encoded items.
 *
 * @param itemDecoder - a function used to decode each encoded item
 */
export const createVarIntItemUnsafeDecoder =
  <Item, Key extends string, KeyPlural extends string>(
    key: Key,
    itemDecoder: (
      bin: Uint8Array,
      index: number
    ) => { [key in Key]: Item } & { nextIndex: number },
    keyPlural: KeyPlural
  ) =>
  (bin: Uint8Array, index = 0) => {
    const { nextIndex: indexAfterItemCount, value: itemCount } = decodeVarInt(
      bin,
      index
    );
    // eslint-disable-next-line functional/no-let
    let cursor = indexAfterItemCount;
    const items = [];
    // eslint-disable-next-line functional/no-let, functional/no-loop-statement, no-plusplus
    for (let i = 0; i < Number(itemCount); i++) {
      // const { [key]: item, nextIndex } = itemDecoder(bin, cursor);
      const result = itemDecoder(bin, cursor);
      const item = result[key];
      // eslint-disable-next-line functional/no-expression-statement
      cursor = result.nextIndex;
      // eslint-disable-next-line functional/no-expression-statement, functional/immutable-data
      items.push(item);
    }
    return { [keyPlural]: items, nextIndex: cursor } as {
      [key in KeyPlural]: Item[];
    } & { nextIndex: number };
  };

/**
 * Decode a set of transaction {@link Input}s from a Uint8Array beginning at
 * `index`. A VarInt will be read beginning at `index`, and then the encoded
 * number of transaction inputs will be decoded and returned.
 *
 * Note: this method throws runtime errors when attempting to decode
 * improperly-encoded sets of inputs.
 *
 * @param bin - the raw transaction from which to read the inputs
 * @param index - the index at which the VarInt count begins
 */
export const decodeTransactionInputsUnsafe = createVarIntItemUnsafeDecoder(
  'input',
  decodeTransactionInputUnsafe,
  'inputs'
) as (
  bin: Uint8Array,
  index?: number
) => {
  inputs: {
    outpointIndex: number;
    outpointTransactionHash: Uint8Array;
    sequenceNumber: number;
    unlockingBytecode: Uint8Array;
  }[];
  nextIndex: number;
};

/**
 * Decode a transaction {@link Output} from a Uint8Array containing the encoded
 * transaction output beginning at `index`.
 *
 * Note: this method throws runtime errors when attempting to decode an
 * improperly-encoded output.
 *
 * @param bin - the raw transaction from which to read the output
 * @param index - the index at which the output begins
 */
export const decodeTransactionOutputUnsafe = (
  bin: Uint8Array,
  index: number
) => {
  const uint64Bytes = 8;
  const indexAfterSatoshis = index + uint64Bytes;
  const valueSatoshis = bin.slice(index, indexAfterSatoshis);
  const { nextIndex: indexAfterScriptLength, value } = decodeVarInt(
    bin,
    indexAfterSatoshis
  );
  const bytecodeLength = Number(value);
  const nextIndex = indexAfterScriptLength + bytecodeLength;
  const lockingBytecode =
    bytecodeLength === 0
      ? new Uint8Array()
      : bin.slice(indexAfterScriptLength, nextIndex);

  return {
    nextIndex,
    output: {
      lockingBytecode,
      valueSatoshis,
    },
  };
};

/**
 * Encode a single {@link Output} for inclusion in an encoded transaction.
 *
 * @param output - the output to encode
 */
export const encodeTransactionOutput = (output: Output) =>
  flattenBinArray([
    output.valueSatoshis,
    bigIntToVarInt(BigInt(output.lockingBytecode.length)),
    output.lockingBytecode,
  ]);

/**
 * Decode a set of transaction {@link Output}s from a Uint8Array beginning at
 * `index`. A VarInt will be read beginning at `index`, and then the encoded
 * number of transaction outputs will be decoded and returned.
 *
 * Note: this method throws runtime errors when attempting to decode
 * improperly-encoded sets of outputs.
 *
 * @param bin - the raw transaction from which to read the outputs
 * @param index - the index at which the VarInt count begins
 */
export const decodeTransactionOutputsUnsafe = createVarIntItemUnsafeDecoder(
  'output',
  decodeTransactionOutputUnsafe,
  'outputs'
) as (
  bin: Uint8Array,
  index?: number
) => {
  outputs: {
    lockingBytecode: Uint8Array;
    valueSatoshis: Uint8Array;
  }[];
  nextIndex: number;
};

/**
 * Encode a set of {@link Output}s for inclusion in an encoded transaction
 * including the prefixed number of outputs. Note, this encoding differs from
 * {@link encodeTransactionOutputsForSigning} (used for signing serializations).
 *
 * Format: [VarInt: output count] [encoded outputs]
 *
 * @param outputs - the set of outputs to encode
 */
export const encodeTransactionOutputs = (outputs: readonly Output[]) =>
  flattenBinArray([
    bigIntToVarInt(BigInt(outputs.length)),
    ...outputs.map(encodeTransactionOutput),
  ]);

/**
 * Decode a `Uint8Array` using the version 1 or 2 raw transaction format.
 *
 * Note: this method throws runtime errors when attempting to decode messages
 * which do not properly follow the transaction format. If the input is
 * untrusted, use {@link decodeTransaction}.
 *
 * @param bin - the raw message to decode
 */
export const decodeTransactionUnsafeCommon = (
  bin: Uint8Array
): TransactionCommon => {
  const uint32Bytes = 4;
  const version = binToNumberUint32LE(bin.subarray(0, uint32Bytes));
  const indexAfterVersion = uint32Bytes;
  const { inputs, nextIndex: indexAfterInputs } = decodeTransactionInputsUnsafe(
    bin,
    indexAfterVersion
  );
  const { outputs, nextIndex: indexAfterOutputs } =
    decodeTransactionOutputsUnsafe(bin, indexAfterInputs);
  const locktime = binToNumberUint32LE(
    bin.subarray(indexAfterOutputs, indexAfterOutputs + uint32Bytes)
  );
  return {
    inputs,
    locktime,
    outputs,
    version,
  };
};
export const decodeTransactionUnsafeBCH = decodeTransactionUnsafeCommon;
export const decodeTransactionUnsafe = decodeTransactionUnsafeBCH;

export enum TransactionDecodingError {
  invalidFormat = 'Transaction decoding error: message does not follow the version 1 or version 2 transaction format.',
}

/**
 * Decode a `Uint8Array` using the version 1 or 2 raw transaction format.
 *
 * @param bin - the raw message to decode
 */
export const decodeTransactionCommon = (bin: Uint8Array) => {
  // eslint-disable-next-line functional/no-try-statement
  try {
    return decodeTransactionUnsafeCommon(bin);
  } catch {
    return TransactionDecodingError.invalidFormat;
  }
};
export const decodeTransactionBCH = decodeTransactionCommon;
export const decodeTransaction = decodeTransactionBCH;

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

export const cloneTransactionInputsCommon = <
  Transaction extends TransactionCommon
>(
  inputs: Readonly<Transaction>['inputs']
) =>
  inputs.map((input) => ({
    outpointIndex: input.outpointIndex,
    outpointTransactionHash: input.outpointTransactionHash.slice(),
    sequenceNumber: input.sequenceNumber,
    unlockingBytecode: input.unlockingBytecode.slice(),
  }));

export const cloneTransactionOutputsCommon = <
  Transaction extends TransactionCommon
>(
  outputs: Readonly<Transaction>['outputs']
) =>
  outputs.map((output) => ({
    lockingBytecode: output.lockingBytecode.slice(),
    valueSatoshis: output.valueSatoshis.slice(),
  }));

export const cloneTransactionCommon = <Transaction extends TransactionCommon>(
  transaction: Readonly<Transaction>
) => ({
  inputs: cloneTransactionInputsCommon(transaction.inputs),
  locktime: transaction.locktime,
  outputs: cloneTransactionOutputsCommon(transaction.outputs),
  version: transaction.version,
});

/**
 * Compute a transaction hash (A.K.A. "transaction ID" or "TXID") from an
 * encoded transaction in P2P network message order. This is the byte order
 * produced by most sha256 libraries and used in most P2P network messages. It
 * is also the byte order produced by `OP_SHA256` and `OP_HASH256` in the
 * virtual machine.
 *
 * @returns the transaction hash in P2P network message byte order
 *
 * @param transaction - the encoded transaction
 * @param sha256 - an implementation of sha256
 */
export const hashTransactionP2pOrder = (
  transaction: Uint8Array,
  sha256: { hash: Sha256['hash'] } = internalSha256
) => sha256.hash(sha256.hash(transaction));

/**
 * Compute a transaction hash (A.K.A. "transaction ID" or "TXID") from an
 * encoded transaction in user interface byte order. This is the byte order
 * typically used by block explorers, wallets, and other user interfaces.
 *
 * @returns the transaction hash in User Interface byte order
 *
 * @param transaction - the encoded transaction
 * @param sha256 - an implementation of sha256
 */
export const hashTransactionUiOrder = (
  transaction: Uint8Array,
  sha256: { hash: Sha256['hash'] } = internalSha256
) => hashTransactionP2pOrder(transaction, sha256).reverse();

/**
 * Return an encoded {@link Transaction}'s hash/ID as a string in user interface
 * byte order (typically used by wallets and block explorers).
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
 * Encode an array of transaction {@link Output}s for use in transaction signing
 * serializations. Note, this encoding differs from
 * {@link encodeTransactionOutputs} (used for encoding full transactions).
 *
 * @param outputs - the array of outputs to encode
 */
export const encodeTransactionOutputsForSigning = (
  outputs: readonly Output[]
) => flattenBinArray(outputs.map(encodeTransactionOutput));

/**
 * Encode the sequence numbers of an array of transaction inputs for use in
 * transaction signing serializations.
 *
 * @param inputs - the array of inputs from which to extract the sequence
 * numbers
 */
export const encodeTransactionInputSequenceNumbersForSigning = (
  inputs: readonly { sequenceNumber: number }[]
) => flattenBinArray(inputs.map((i) => numberToBinUint32LE(i.sequenceNumber)));
