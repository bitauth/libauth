import { Sha256 } from './crypto/sha256';
import {
  bigIntToBinUint64LE,
  bigIntToBitcoinVarInt,
  binToBigIntUint64LE,
  binToHex,
  binToNumberUint32LE,
  flattenBinArray,
  numberToBinUint32LE,
  readBitcoinVarInt
} from './utils/utils';

/**
 * Data type representing a Transaction Input.
 */
export interface Input {
  /**
   * The index of the output in the transaction from which this input is spent.
   *
   * An "outpoint" is a reference ("pointer") to an output in a previous
   * transaction.
   */
  outpointIndex: number;
  /**
   * A.K.A. `Transaction ID`
   *
   * The hash of the raw transaction from which this input is spent in
   * big-endian byte order.
   *
   * @remarks
   * An "outpoint" is a reference (A.K.A. "pointer") to an output in a previous
   * transaction.
   *
   * TODO: clarify: in what order to block explorers display hashes? In what
   * order are hashes serialized?
   *
   * Serialized raw bitcoin transactions encode this value in little-endian byte
   * order. However, it is more common to use big-endian byte order when
   * displaying transaction hashes. (In part because the SHA-256 specification
   * defines its output as big-endian, so this byte order is output by most
   * cryptographic libraries.)
   */
  outpointTransactionHash: Uint8Array;
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
  unlockingBytecode: Uint8Array;
}

/**
 * Data type representing a Transaction Output.
 */
export interface Output {
  /**
   * The bytecode used to encumber a transaction output. To spend the output,
   * unlocking bytecode must be included in a transaction input which – when
   * evaluated with the locking bytecode – completes in valid state.
   *
   * A.K.A. `scriptPubKey` or "locking script"
   */
  readonly lockingBytecode: Uint8Array;
  /**
   * The value of the output in satoshis, the smallest unit of bitcoin. There
   * are 100 satoshis in a bit, and 100,000,000 satoshis in a bitcoin.
   */
  readonly satoshis: bigint;
}

/**
 * Data type representing a Transaction.
 */
export interface Transaction {
  /**
   * An array of inputs included in this transaction.
   *
   * Input order is critical to signing serializations, and reordering inputs
   * may invalidate transactions.
   */
  inputs: Input[];
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
  outputs: Output[];
  /**
   * The version of this transaction. Since BIP68, most transactions use a
   * version of `2`.
   */
  version: number;
}

const enum ByteLength {
  uint32 = 4,
  uint64 = 8,
  sha256Hash = 32
}

/**
 * @param bin the raw transaction from which to read the input
 * @param offset the offset at which the input begins
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
    nextOffset: offsetAfterScriptLength,
    value: scriptLength
  } = readBitcoinVarInt(bin, offsetAfterOutpointIndex);
  const offsetAfterScript = offsetAfterScriptLength + Number(scriptLength);
  const unlockingBytecode = bin.slice(
    offsetAfterScriptLength,
    offsetAfterScript
  );
  const nextOffset = offsetAfterScript + ByteLength.uint32;
  const sequenceNumber = binToNumberUint32LE(
    bin.subarray(offsetAfterScript, nextOffset)
  );
  return {
    input: {
      outpointIndex,
      outpointTransactionHash,
      sequenceNumber,
      unlockingBytecode
    },
    nextOffset
  };
};

/**
 * Serialize a single input.
 * @param output the input to serialize
 */
export const serializeInput = (input: Input) =>
  flattenBinArray([
    input.outpointTransactionHash.slice().reverse(),
    numberToBinUint32LE(input.outpointIndex),
    bigIntToBitcoinVarInt(BigInt(input.unlockingBytecode.length)),
    input.unlockingBytecode,
    numberToBinUint32LE(input.sequenceNumber)
  ]);

/**
 * Serialize a set of inputs for inclusion in a serialized transaction.
 *
 * Format: <BitcoinVarInt: input count> <serialized inputs>
 *
 * @param inputs the set of inputs to serialize
 */
export const serializeInputs = (inputs: ReadonlyArray<Input>) =>
  flattenBinArray([
    bigIntToBitcoinVarInt(BigInt(inputs.length)),
    ...inputs.map(serializeInput)
  ]);

/**
 * @param bin the raw transaction from which to read the output
 * @param offset the offset at which the output begins
 */
export const readTransactionOutput = (bin: Uint8Array, offset: number) => {
  const offsetAfterSatoshis = offset + ByteLength.uint64;
  const satoshis = binToBigIntUint64LE(
    bin.subarray(offset, offsetAfterSatoshis)
  );
  const { nextOffset: offsetAfterScriptLength, value } = readBitcoinVarInt(
    bin,
    offsetAfterSatoshis
  );
  const scriptLength = Number(value);
  const nextOffset = offsetAfterScriptLength + scriptLength;
  const lockingBytecode =
    scriptLength === 0
      ? new Uint8Array()
      : bin.slice(offsetAfterScriptLength, nextOffset);

  return {
    nextOffset,
    output: {
      lockingBytecode,
      satoshis
    }
  };
};

/**
 * Serialize a single output.
 * @param output the output to serialize
 */
export const serializeOutput = (output: Output) =>
  flattenBinArray([
    bigIntToBinUint64LE(BigInt(output.satoshis)),
    bigIntToBitcoinVarInt(BigInt(output.lockingBytecode.length)),
    output.lockingBytecode
  ]);

/**
 * Serialize a set of outputs for inclusion in a serialized transaction.
 *
 * Format: <BitcoinVarInt: output count> <serialized outputs>
 *
 * @param outputs the set of outputs to serialize
 */
export const serializeOutputs = (outputs: ReadonlyArray<Output>) =>
  flattenBinArray([
    bigIntToBitcoinVarInt(BigInt(outputs.length)),
    ...outputs.map(serializeOutput)
  ]);

/**
 * TODO: document return type (note outpointTransactionHash is little-endian – most UIs display big-endian transaction hashes)
 *
 * Note: this method throws runtime errors when attempting to decode improperly
 * encoded transactions.
 *
 * @param bin the raw transaction to decode
 */
export const deserializeTransaction = (bin: Uint8Array): Transaction => {
  const version = binToNumberUint32LE(bin.subarray(0, ByteLength.uint32));
  const offsetAfterVersion = ByteLength.uint32;
  const {
    nextOffset: offsetAfterInputCount,
    value: inputCount
  } = readBitcoinVarInt(bin, offsetAfterVersion);
  // tslint:disable-next-line:no-let prefer-const
  let cursor = offsetAfterInputCount;
  // tslint:disable-next-line:no-let prefer-const
  let inputs = [];
  // tslint:disable-next-line:no-let
  for (let i = 0; i < Number(inputCount); i++) {
    const { input, nextOffset } = readTransactionInput(bin, cursor);
    // tslint:disable-next-line:no-expression-statement
    cursor = nextOffset;
    // tslint:disable-next-line:no-expression-statement
    inputs.push(input);
  }
  const {
    nextOffset: offsetAfterOutputCount,
    value: outputCount
  } = readBitcoinVarInt(bin, cursor);
  // tslint:disable-next-line:no-expression-statement
  cursor = offsetAfterOutputCount;
  // tslint:disable-next-line:no-let prefer-const
  let outputs = [];
  // tslint:disable-next-line:no-let
  for (let i = 0; i < Number(outputCount); i++) {
    const { output, nextOffset } = readTransactionOutput(bin, cursor);
    // tslint:disable-next-line:no-expression-statement
    cursor = nextOffset;
    // tslint:disable-next-line:no-expression-statement
    outputs.push(output);
  }
  const locktime = binToNumberUint32LE(
    bin.subarray(cursor, cursor + ByteLength.uint32)
  );
  return {
    inputs,
    locktime,
    outputs,
    version
  };
};

/**
 * TODO: doc
 */
export const serializeTransaction = (tx: Transaction) =>
  flattenBinArray([
    numberToBinUint32LE(tx.version),
    serializeInputs(tx.inputs),
    serializeOutputs(tx.outputs),
    numberToBinUint32LE(tx.locktime)
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
 * @param data the serialized raw data being identified
 * @param sha256 an implementation of sha256
 */
export const getBitcoinIdentifier = (data: Uint8Array, sha256: Sha256) =>
  sha256.hash(sha256.hash(data)).reverse();

/**
 * Derive a standard transaction identifier from a serialized transaction.
 *
 * @returns a Transaction ID in little-endian byte order
 *
 * @param transaction the serialized transaction
 * @param sha256 an implementation of sha256
 */
export const getBitcoinTransactionId = (
  transaction: Uint8Array,
  sha256: Sha256
) => binToHex(getBitcoinIdentifier(transaction, sha256));

/**
 * Get the hash of an output. (For use in `hashCorrespondingOutput`.)
 * @param output the output to hash
 * @param sha256 an implementation of sha256
 */
export const getOutputHash = (output: Output, sha256: Sha256) =>
  sha256.hash(sha256.hash(serializeOutput(output)));

/**
 * Get the hash of all outpoints in a series of inputs. (For use in
 * `hashTransactionOutpoints`.)
 *
 * @param inputs the series of inputs from which to extract the outpoints
 * @param sha256 an implementation of sha256
 */
export const getOutpointsHash = (
  inputs: ReadonlyArray<Input>,
  sha256: Sha256
) =>
  sha256.hash(
    sha256.hash(
      flattenBinArray(
        inputs.map(i =>
          flattenBinArray([
            i.outpointTransactionHash.slice().reverse(),
            numberToBinUint32LE(i.outpointIndex)
          ])
        )
      )
    )
  );

/**
 * Get the hash of a series of outputs. (Primarily for use in
 * `hashTransactionOutputs`)
 * @param outputs the series of outputs to serialize and hash
 * @param sha256 an implementation of sha256
 */
export const getOutputsHash = (
  outputs: ReadonlyArray<Output>,
  sha256: Sha256
) => sha256.hash(sha256.hash(flattenBinArray(outputs.map(serializeOutput))));

/**
 * Get the hash of a series of input sequence numbers. (Primarily for use in
 * `hashTransactionSequenceNumbers`)
 *
 * @param inputs the series of inputs from which to extract the sequence numbers
 * @param sha256 an implementation of sha256
 */
export const getSequenceNumbersHash = (
  inputs: ReadonlyArray<Input>,
  sha256: Sha256
) =>
  sha256.hash(
    sha256.hash(
      flattenBinArray(inputs.map(i => numberToBinUint32LE(i.sequenceNumber)))
    )
  );
