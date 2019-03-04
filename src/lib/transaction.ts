/* istanbul ignore file */ // TODO: stabilize & test

import { Sha256 } from './crypto/sha256';
import {
  bigIntToBinUint64LE,
  bigIntToBitcoinVarInt,
  binToBigIntUint64LE,
  binToHex,
  binToNumberUint32LE,
  numberToBinUint32LE,
  readBitcoinVarInt
} from './utils/utils';

export interface Input {
  /**
   * The index of the output in the transaction from which this input is spent.
   *
   * An "outpoint" is a reference ("pointer") to an output in a previous
   * transaction.
   */
  readonly outpointIndex: number;
  /**
   * A.K.A. `Transaction ID`
   *
   * The hash of the raw transaction from which this input is spent (in
   * big-endian byte order).
   *
   * An "outpoint" is a reference ("pointer") to an output in a previous
   * transaction.
   *
   * Serialized raw bitcoin transactions encode this value in little-endian byte
   * order. However, it is more common to use big-endian byte order when
   * displaying transaction hashes. (In part because the SHA-256 specification
   * defines its output as big-endian, so this byte order is output by most
   * cryptographic libraries.)
   */
  readonly outpointTransactionHash: Uint8Array;
  /**
   * TODO: summarize BIP 68
   */
  readonly sequenceNumber: number;
  /**
   * The script used to unlock a transaction output. To spend an output, an
   * unlocking script must be included in a transaction input which – when
   * evaluated in the authentication virtual machine with a locking script –
   * completes in valid state.
   */
  readonly unlockingScript: Uint8Array;
}

export interface Output {
  /**
   * The script used to encumber a transaction output. To spend the output, an
   * unlocking script must be included in a transaction input which – when
   * evaluated with the locking script – completes in valid state.
   */
  readonly lockingScript: Uint8Array;
  /**
   * The value of the output in satoshis, the smallest unit of bitcoin. There
   * are 100 satoshis in a bit, and 100,000,000 satoshis in a bitcoin.
   */
  readonly satoshis: bigint;
}

export interface Transaction {
  /** TODO: */
  readonly inputs: ReadonlyArray<Input>;
  /** TODO: */
  readonly locktime: number;
  /** TODO: */
  readonly outputs: ReadonlyArray<Output>;
  /** TODO: */
  readonly version: number;
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
  const unlockingScript = bin.slice(offsetAfterScriptLength, offsetAfterScript);
  const nextOffset = offsetAfterScript + ByteLength.uint32;
  const sequenceNumber = binToNumberUint32LE(
    bin.subarray(offsetAfterScript, nextOffset)
  );
  return {
    input: {
      outpointIndex,
      outpointTransactionHash,
      sequenceNumber,
      unlockingScript
    },
    nextOffset
  };
};

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
  const lockingScript =
    scriptLength === 0
      ? new Uint8Array()
      : bin.slice(offsetAfterScriptLength, nextOffset);

  return {
    nextOffset,
    output: {
      lockingScript,
      satoshis
    }
  };
};

/**
 * TODO: document return type (note outpointTransactionHash is little-endian – most UIs display big-endian transaction hashes)
 *
 * This method may throw runtime errors when attempting to decode improperly
 * encoded transactions.
 *
 * @param bin the raw transaction to decode
 */
export const decodeRawTransaction = (bin: Uint8Array): Transaction => {
  const version = binToNumberUint32LE(bin.subarray(0, ByteLength.uint32));
  const offsetAfterVersion = ByteLength.uint32;
  const {
    nextOffset: offsetAfterInputCount,
    value: inputCount
  } = readBitcoinVarInt(bin, offsetAfterVersion);
  // tslint:disable-next-line:no-let prefer-const
  let cursor = offsetAfterInputCount;
  // tslint:disable-next-line:readonly-array no-let prefer-const
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
  // tslint:disable-next-line:readonly-array no-let prefer-const
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

// TODO:
// export const encodeRawTransaction = () => {};

/**
 * Derive a standard identifier from a serialized data structure.
 *
 * By convention, Bitcoin transaction and block identifiers are derived by
 * double-sha256 hashing their serialized form, and reversing the byte order.
 * (The result of sha256 is defined by its specification as big-endian, and
 * bitcoin displays hashes in little-endian format.)
 *
 * @param data the serialized raw data being identified
 * @param sha256 an implementation of sha256
 */
export const getBitcoinIdentifier = (data: Uint8Array, sha256: Sha256) =>
  binToHex(sha256.hash(sha256.hash(data)).reverse());

/**
 * Derive a standard transaction identifier from a serialized raw transaction.
 *
 * @param rawTransaction the serialized raw transaction
 * @param sha256 an implementation of sha256
 */
export const getBitcoinTransactionId = getBitcoinIdentifier;

/**
 * Get the hash of a output. (For use in `correspondingOutputHash`.)
 * @param output the output to hash
 * @param sha256 an implementation of sha256
 */
export const getOutputHash = (output: Output, sha256: Sha256) =>
  sha256.hash(
    sha256.hash(
      Uint8Array.from([
        ...bigIntToBinUint64LE(output.satoshis),
        ...output.lockingScript
      ])
    )
  );

/**
 * Get the hash of all outpoints in a series of inputs. (For use in
 * `transactionOutpointsHash`.)
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
      Uint8Array.from(
        inputs.reduce<ReadonlyArray<number>>(
          (accumulated, input) => [
            ...accumulated,
            ...input.outpointTransactionHash.slice().reverse(),
            ...numberToBinUint32LE(input.outpointIndex)
          ],
          []
        )
      )
    )
  );

/**
 * Serialize a single output.
 * @param output the output to serialize
 */
export const serializeOutput = (output: Output) =>
  Uint8Array.from([
    ...bigIntToBinUint64LE(BigInt(output.satoshis)),
    ...bigIntToBitcoinVarInt(BigInt(output.lockingScript.length)),
    ...output.lockingScript
  ]);

/**
 * Serialize a set of outputs for inclusion in a serialized transaction.
 *
 * Format: <BitcoinVarInt: output count> <serialized outputs>
 *
 * @param outputs the set of outputs to serialize
 */
export const serializeOutputs = (outputs: ReadonlyArray<Output>) =>
  Uint8Array.from([
    ...bigIntToBitcoinVarInt(BigInt(outputs.length)),
    ...outputs.reduce<ReadonlyArray<number>>(
      (accumulated, output) => [...accumulated, ...serializeOutput(output)],
      []
    )
  ]);

/**
 * Get the hash of a series of outputs. (Primarily for use in
 * `transactionOutputsHash`)
 * @param outputs the series of outputs to serialize and hash
 * @param sha256 an implementation of sha256
 */
export const getOutputsHash = (
  outputs: ReadonlyArray<Output>,
  sha256: Sha256
) =>
  sha256.hash(
    sha256.hash(
      Uint8Array.from([
        ...outputs.reduce<ReadonlyArray<number>>(
          (accumulated, output) => [...accumulated, ...serializeOutput(output)],
          []
        )
      ])
    )
  );

/**
 * Get the hash of a series of input sequence numbers. (Primarily for use in
 * `transactionSequenceNumbersHash`)
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
      Uint8Array.from([
        ...inputs.reduce<ReadonlyArray<number>>(
          (accumulated, input) => [
            ...accumulated,
            ...numberToBinUint32LE(input.sequenceNumber)
          ],
          []
        )
      ])
    )
  );
