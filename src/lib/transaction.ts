import { Sha256 } from './crypto/sha256';
import {
  bigIntToBinUint64LE,
  bigIntToBitcoinVarInt,
  binToBigIntUint64LE,
  binToHex,
  binToNumberUint32LE,
  flattenBinArray,
  numberToBinUint32LE,
  readBitcoinVarInt,
} from './format/format';

/**
 * Data type representing a Transaction Input.
 */
export interface Input<Bytecode = Uint8Array, HashRepresentation = Uint8Array> {
  /**
   * The index of the output in the transaction from which this input is spent.
   *
   * @remarks
   * An "outpoint" is a reference (A.K.A. "pointer") to a specific output in a
   * previous transaction.
   */
  outpointIndex: number;
  /**
   * A.K.A. `Transaction ID`
   *
   * The hash of the raw transaction from which this input is spent in
   * big-endian byte order. This is the order typically seen in block explorers
   * and user interfaces.
   *
   * @remarks
   * An "outpoint" is a reference (A.K.A. "pointer") to a specific output in a
   * previous transaction.
   *
   * Serialized raw bitcoin transactions encode this value in little-endian byte
   * order. However, it is more common to use big-endian byte order when
   * displaying transaction hashes. (In part because the SHA-256 specification
   * defines its output as big-endian, so this byte order is output by most
   * cryptographic libraries.)
   */
  outpointTransactionHash: HashRepresentation;
  /**
   * TODO: summarize BIP 68
   */
  sequenceNumber: number;
  /**
   * The bytecode used to unlock a transaction output. To spend an output,
   * unlocking bytecode must be included in a transaction input which – when
   * evaluated in the authentication virtual machine with the locking bytecode –
   * completes in valid state.
   *
   * A.K.A. `scriptSig` or "unlocking script"
   */
  unlockingBytecode: Bytecode;
}

/**
 * Data type representing a Transaction Output.
 */
export interface Output<Bytecode = Uint8Array, Amount = number> {
  /**
   * The bytecode used to encumber a transaction output. To spend the output,
   * unlocking bytecode must be included in a transaction input which – when
   * evaluated with the locking bytecode – completes in valid state.
   *
   * A.K.A. `scriptPubKey` or "locking script"
   */
  readonly lockingBytecode: Bytecode;
  /**
   * The value of the output in satoshis, the smallest unit of bitcoin. There
   * are 100 satoshis in a bit, and 100,000,000 satoshis in a bitcoin.
   */
  readonly satoshis: Amount;
}

/**
 * Data type representing a Transaction.
 */
export interface Transaction<InputType = Input, OutputType = Output> {
  /**
   * An array of inputs included in this transaction.
   *
   * Input order is critical to signing serializations, and reordering inputs
   * may invalidate transactions.
   */
  inputs: InputType[];
  /**
   * The locktime at which this transaction is considered valid.
   *
   * Locktime can be provided as either a timestamp or a block height. Values
   * less than `500000000` are understood to be a block height (the current
   * block number in the chain, beginning from block 0). Values greater than or
   * equal to `500000000` are understood to be a UNIX timestamp.
   *
   * For validating timestamp values, the median timestamp of the last 11 blocks
   * is used. The precise behavior is defined in BIP113.
   *
   * If the `sequenceNumber` of every transaction input is set to `0xffffffff`
   * (4294967295), locktime is ignored, and the transaction may be added to a
   * block (even if the specified locktime has not yet been reached).
   */
  locktime: number;

  /**
   * An array of outputs included in this transaction.
   *
   * Output order is critical to signing serializations, and reordering outputs
   * may invalidate transactions.
   */
  outputs: OutputType[];
  /**
   * The version of this transaction. Since BIP68, most transactions use a
   * version of `2`.
   */
  version: number;
}

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
 * Serialize a single input.
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
 * Serialize a set of inputs for inclusion in a serialized transaction.
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
 * Serialize a single output.
 * @param output - the output to serialize
 */
export const serializeOutput = (output: Output) =>
  flattenBinArray([
    bigIntToBinUint64LE(BigInt(output.satoshis)),
    bigIntToBitcoinVarInt(BigInt(output.lockingBytecode.length)),
    output.lockingBytecode,
  ]);

/**
 * Serialize a set of outputs for inclusion in a serialized transaction.
 *
 * Format: [BitcoinVarInt: output count] [serialized outputs]
 *
 * @param outputs - the set of outputs to serialize
 */
export const serializeOutputsForTransaction = (outputs: readonly Output[]) =>
  flattenBinArray([
    bigIntToBitcoinVarInt(BigInt(outputs.length)),
    ...outputs.map(serializeOutput),
  ]);

/**
 * TODO: document return type (note outpointTransactionHash is little-endian – most UIs display big-endian transaction hashes)
 *
 * Note: this method throws runtime errors when attempting to decode improperly
 * encoded transactions.
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
 * TODO: doc
 */
export const serializeTransaction = (tx: Transaction) =>
  flattenBinArray([
    numberToBinUint32LE(tx.version),
    serializeInputs(tx.inputs),
    serializeOutputsForTransaction(tx.outputs),
    numberToBinUint32LE(tx.locktime),
  ]);

/**
 * Derive a standard identifier from a serialized data structure.
 *
 * @remarks
 * By convention, Bitcoin transaction and block identifiers are derived by
 * double-sha256 hashing their serialized form, and reversing the byte order.
 * (The result of sha256 is defined by its specification as big-endian, and
 * bitcoin displays hashes in little-endian format.)
 *
 * @returns an identifier in little-endian byte order
 *
 * @param data - the serialized raw data being identified
 * @param sha256 - an implementation of sha256
 */
export const getBitcoinIdentifier = (
  data: Uint8Array,
  sha256: { hash: Sha256['hash'] }
) => sha256.hash(sha256.hash(data)).reverse();

/**
 * Derive a standard transaction identifier from a serialized transaction.
 *
 * @returns a Transaction ID in little-endian byte order
 *
 * @param transaction - the serialized transaction
 * @param sha256 - an implementation of sha256
 */
export const getBitcoinTransactionId = (
  transaction: Uint8Array,
  sha256: { hash: Sha256['hash'] }
) => binToHex(getBitcoinIdentifier(transaction, sha256));

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
 * Get the signing serialization for a series of outputs.
 * @param outputs - the series of outputs to serialize
 */
export const serializeOutputsForSigning = (outputs: readonly Output[]) =>
  flattenBinArray(outputs.map(serializeOutput));

/**
 * Serialize a series of input sequence numbers.
 *
 * @param inputs - the series of inputs from which to extract the sequence numbers
 */
export const serializeSequenceNumbers = (
  inputs: readonly { sequenceNumber: number }[]
) => flattenBinArray(inputs.map((i) => numberToBinUint32LE(i.sequenceNumber)));
