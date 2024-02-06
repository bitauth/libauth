import { hash256, sha256 as internalSha256 } from '../../../crypto/crypto.js';
import {
  bigIntToCompactUint,
  flattenBinArray,
  numberToBinUint32LE,
  valueSatoshisToBin,
} from '../../../format/format.js';
import type { CompilationContextBCH, Sha256 } from '../../../lib.js';
import {
  encodeTokenPrefix,
  encodeTransactionInputSequenceNumbersForSigning,
  encodeTransactionOutpoints,
  encodeTransactionOutput,
  encodeTransactionOutputsForSigning,
} from '../../../message/message.js';

/**
 * A.K.A. `sighash` flags
 */
export enum SigningSerializationFlag {
  /**
   * A.K.A. `SIGHASH_ALL`
   */
  allOutputs = 0x01,
  /**
   * A.K.A `SIGHASH_NONE`
   */
  noOutputs = 0x02,
  /**
   * A.K.A. `SIGHASH_SINGLE`
   */
  correspondingOutput = 0x03,
  /**
   * A.K.A. `SIGHASH_UTXOS`
   */
  utxos = 0x20,
  forkId = 0x40,
  /**
   * A.K.A `ANYONE_CAN_PAY`/`SIGHASH_ANYONECANPAY`
   */
  singleInput = 0x80,
}

/* eslint-disable no-bitwise, @typescript-eslint/prefer-literal-enum-member */
export enum SigningSerializationType {
  allOutputs = SigningSerializationFlag.allOutputs |
    SigningSerializationFlag.forkId,
  allOutputsAllUtxos = SigningSerializationFlag.allOutputs |
    SigningSerializationFlag.utxos |
    SigningSerializationFlag.forkId,
  allOutputsSingleInput = SigningSerializationFlag.allOutputs |
    SigningSerializationFlag.singleInput |
    SigningSerializationFlag.forkId,
  correspondingOutput = SigningSerializationFlag.correspondingOutput |
    SigningSerializationFlag.forkId,
  correspondingOutputAllUtxos = SigningSerializationFlag.correspondingOutput |
    SigningSerializationFlag.utxos |
    SigningSerializationFlag.forkId,
  correspondingOutputSingleInput = SigningSerializationFlag.correspondingOutput |
    SigningSerializationFlag.singleInput |
    SigningSerializationFlag.forkId,
  noOutputs = SigningSerializationFlag.noOutputs |
    SigningSerializationFlag.forkId,
  noOutputsAllUtxos = SigningSerializationFlag.noOutputs |
    SigningSerializationFlag.utxos |
    SigningSerializationFlag.forkId,
  noOutputsSingleInput = SigningSerializationFlag.noOutputs |
    SigningSerializationFlag.singleInput |
    SigningSerializationFlag.forkId,
}
/* eslint-enable no-bitwise, @typescript-eslint/prefer-literal-enum-member */

// eslint-disable-next-line @typescript-eslint/naming-convention
export const SigningSerializationTypeBCH = SigningSerializationType;

const enum Internal {
  mask5Bits = 0b11111,
  sha256HashByteLength = 32,
}

const match = (type: Uint8Array, flag: SigningSerializationFlag) =>
  // eslint-disable-next-line no-bitwise, @typescript-eslint/no-non-null-assertion
  (type[0]! & flag) !== 0;

const equals = (
  type: Uint8Array,
  flag: SigningSerializationFlag,
  // eslint-disable-next-line no-bitwise, @typescript-eslint/no-non-null-assertion
) => (type[0]! & Internal.mask5Bits) === flag;

const shouldSerializeSingleInput = (type: Uint8Array) =>
  match(type, SigningSerializationFlag.singleInput);

const shouldSerializeCorrespondingOutput = (type: Uint8Array) =>
  equals(type, SigningSerializationFlag.correspondingOutput);

const shouldSerializeNoOutputs = (type: Uint8Array) =>
  equals(type, SigningSerializationFlag.noOutputs);

const shouldSerializeUtxos = (type: Uint8Array) =>
  match(type, SigningSerializationFlag.utxos);

const emptyHash = () => new Uint8Array(Internal.sha256HashByteLength).fill(0);

/**
 * Return the proper `hashPrevouts` value for a given a signing serialization
 * type.
 */
export const hashPrevouts = (
  {
    signingSerializationType,
    transactionOutpoints,
  }: {
    /**
     * The signing serialization type to test
     */
    signingSerializationType: Uint8Array;
    /**
     * See {@link generateSigningSerializationComponentsBCH}
     */
    transactionOutpoints: Uint8Array;
  },
  sha256: { hash: Sha256['hash'] } = internalSha256,
) =>
  shouldSerializeSingleInput(signingSerializationType)
    ? emptyHash()
    : hash256(transactionOutpoints, sha256);

/**
 * Return the proper `hashUtxos` value for a given a signing serialization
 * type.
 */
export const hashUtxos = (
  {
    signingSerializationType,
    transactionUtxos,
  }: {
    /**
     * The signing serialization type to test
     */
    signingSerializationType: Uint8Array;
    /**
     * See {@link generateSigningSerializationComponentsBCH}
     */
    transactionUtxos: Uint8Array;
  },
  sha256: { hash: Sha256['hash'] } = internalSha256,
) =>
  shouldSerializeUtxos(signingSerializationType)
    ? hash256(transactionUtxos, sha256)
    : Uint8Array.of();

/**
 * Return the proper `hashSequence` value for a given a signing serialization
 * type.
 */
export const hashSequence = (
  {
    signingSerializationType,
    transactionSequenceNumbers,
  }: {
    /**
     * The signing serialization type to test
     */
    signingSerializationType: Uint8Array;
    /**
     * See {@link generateSigningSerializationComponentsBCH}
     */
    transactionSequenceNumbers: Uint8Array;
  },
  sha256: { hash: Sha256['hash'] } = internalSha256,
) =>
  !shouldSerializeSingleInput(signingSerializationType) &&
  !shouldSerializeCorrespondingOutput(signingSerializationType) &&
  !shouldSerializeNoOutputs(signingSerializationType)
    ? hash256(transactionSequenceNumbers, sha256)
    : emptyHash();

/**
 * Return the proper `hashOutputs` value for a given a signing serialization
 * type.
 */
export const hashOutputs = (
  {
    correspondingOutput,
    signingSerializationType,
    transactionOutputs,
  }: {
    /**
     * The signing serialization type to test
     */
    signingSerializationType: Uint8Array;
    /**
     * See {@link generateSigningSerializationComponentsBCH}
     */
    transactionOutputs: Uint8Array;
    /**
     * See {@link generateSigningSerializationComponentsBCH}
     */
    correspondingOutput: Uint8Array | undefined;
  },
  sha256: { hash: Sha256['hash'] } = internalSha256,
) =>
  !shouldSerializeCorrespondingOutput(signingSerializationType) &&
  !shouldSerializeNoOutputs(signingSerializationType)
    ? hash256(transactionOutputs, sha256)
    : shouldSerializeCorrespondingOutput(signingSerializationType)
      ? correspondingOutput === undefined
        ? emptyHash()
        : hash256(correspondingOutput, sha256)
      : emptyHash();

/**
 * Encode the signature-protected properties of a transaction following the
 * algorithm required by the `signingSerializationType` of a signature.
 *
 * Note: When validating transactions with multiple signatures,
 * performance-critical applications should use a memoized sha256 implementation
 * to avoid re-computing hashes.
 */
export const encodeSigningSerializationBCH = (
  {
    correspondingOutput,
    coveredBytecode,
    forkId = new Uint8Array([0, 0, 0]),
    locktime,
    outpointIndex,
    outpointTransactionHash,
    outputTokenPrefix,
    outputValue,
    sequenceNumber,
    signingSerializationType,
    transactionOutpoints,
    transactionOutputs,
    transactionSequenceNumbers,
    transactionUtxos,
    version,
  }: {
    /**
     * The version number of the transaction.
     */
    version: number;
    /**
     * The serialization of all input outpoints (A.K.A. {@link hashPrevouts}) –
     * used if `ANYONECANPAY` is not set.
     */
    transactionOutpoints: Uint8Array;
    /**
     * The serialization of all input sequence numbers. (A.K.A.
     * {@link hashSequence}) – used if none of `ANYONECANPAY`, `SINGLE`, or
     * `NONE` are set.
     */
    transactionSequenceNumbers: Uint8Array;
    /**
     * The big-endian (standard) transaction hash of the outpoint being spent.
     */
    outpointTransactionHash: Uint8Array;
    /**
     * The index of the outpoint being spent in `outpointTransactionHash`.
     */
    outpointIndex: number;
    /**
     * The encoded script currently being executed, beginning at the
     * `lastCodeSeparator`.
     */
    coveredBytecode: Uint8Array;
    /**
     * The encoded token prefix of the output being spent
     * (see {@link encodeTokenPrefix}).
     *
     * If the output includes no tokens, a zero-length Uint8Array.
     */
    outputTokenPrefix: Uint8Array;
    /**
     * The 8-byte `Uint64LE`-encoded value of the outpoint in satoshis (see
     * {@link bigIntToBinUint64LE}).
     */
    outputValue: Uint8Array;
    /**
     * The sequence number of the input (A.K.A. `nSequence`).
     */
    sequenceNumber: number;
    /**
     * The serialization of the output at the same index as this input (A.K.A.
     * {@link hashOutputs} with `SIGHASH_SINGLE`) – only used if `SINGLE`
     * is set.
     */
    correspondingOutput: Uint8Array | undefined;
    /**
     * The serialization of output amounts and locking bytecode values (A.K.A.
     * {@link hashOutputs} with `SIGHASH_ALL`) – only used if `ALL` is set.
     */
    transactionOutputs: Uint8Array;
    /**
     * The signing serialization of all UTXOs spent by the transaction's inputs
     * (concatenated in input order).
     */
    transactionUtxos: Uint8Array;
    /**
     * The locktime of the transaction.
     */
    locktime: number;
    /**
     * The signing serialization type of the signature (A.K.A. `sighash` type).
     */
    signingSerializationType: Uint8Array;
    /**
     * While a bitcoin-encoded signature only includes a single byte to encode the
     * signing serialization type, a 3-byte forkId can be appended to provide
     * replay-protection between different forks. (See Bitcoin Cash's Replay
     * Protected Sighash spec for details.)
     */
    forkId?: Uint8Array;
  },
  sha256: { hash: Sha256['hash'] } = internalSha256,
) =>
  flattenBinArray([
    numberToBinUint32LE(version),
    hashPrevouts({ signingSerializationType, transactionOutpoints }, sha256),
    hashUtxos({ signingSerializationType, transactionUtxos }, sha256),
    hashSequence(
      {
        signingSerializationType,
        transactionSequenceNumbers,
      },
      sha256,
    ),
    outpointTransactionHash.slice().reverse(),
    numberToBinUint32LE(outpointIndex),
    outputTokenPrefix,
    bigIntToCompactUint(BigInt(coveredBytecode.length)),
    coveredBytecode,
    outputValue,
    numberToBinUint32LE(sequenceNumber),
    hashOutputs(
      {
        correspondingOutput,
        signingSerializationType,
        transactionOutputs,
      },
      sha256,
    ),
    numberToBinUint32LE(locktime),
    signingSerializationType,
    forkId,
  ]);

/**
 * The signing serialization components that are shared between all of the
 * inputs in a transaction.
 */
export type SigningSerializationTransactionComponentsBCH = {
  /**
   * A time or block height at which the transaction is considered valid (and
   * can be added to the block chain). This allows signers to create time-locked
   * transactions that may only become valid in the future.
   */
  locktime: number;
  /**
   * A.K.A. the serialization for {@link hashPrevouts}
   *
   * The signing serialization of all input outpoints. (See BIP143 or Bitcoin
   * Cash's Replay Protected Sighash spec for details.)
   */
  transactionOutpoints: Uint8Array;
  /*
   * A.K.A. the serialization for {@link hashOutputs} with `SIGHASH_ALL`
   *
   * The signing serialization of output amounts and locking scripts. (See
   * BIP143 or Bitcoin Cash's Replay Protected Sighash spec for details.)
   */
  transactionOutputs: Uint8Array;
  /*
   * A.K.A. the serialization for {@link hashSequence}
   *
   * The signing serialization of all input sequence numbers. (See BIP143 or
   * Bitcoin Cash's Replay Protected Sighash spec for details.)
   */
  transactionSequenceNumbers: Uint8Array;
  /**
   * A.K.A. the serialization for {@link hashUtxos}
   *
   * The signing serialization of all UTXOs spent by the transaction's inputs
   * (concatenated in input order).
   */
  transactionUtxos: Uint8Array;
  /**
   * The transaction's version.
   */
  version: number;
};

/**
 * All signing serialization components for a particular transaction input.
 */
export type SigningSerializationComponentsBCH =
  SigningSerializationTransactionComponentsBCH & {
    /*
     * A.K.A. the serialization for {@link hashOutputs} with `SIGHASH_SINGLE`
     *
     * The signing serialization of the output at the same index as this input. If
     * this input's index is larger than the total number of outputs (such that
     * there is no corresponding output), this should be `undefined`. (See BIP143
     * or Bitcoin Cash's Replay Protected Sighash spec for details.)
     */
    correspondingOutput: Uint8Array | undefined;
    /**
     * The index (within the previous transaction) of the outpoint being spent by
     * this input.
     */
    outpointIndex: number;
    /**
     * The hash/ID of the transaction from which the outpoint being spent by this
     * input originated.
     */
    outpointTransactionHash: Uint8Array;
    /**
     * The 8-byte `Uint64LE`-encoded value of the output being spent in satoshis
     * (see {@link bigIntToBinUint64LE}).
     */
    outputValue: Uint8Array;
    /**
     * The encoded token prefix of the output being spent
     * (see {@link encodeTokenPrefix}).
     *
     * If the output includes no tokens, a zero-length Uint8Array.
     */
    outputTokenPrefix: Uint8Array;
    /**
     * The `sequenceNumber` associated with the input being validated. See
     * {@link Input.sequenceNumber} for details.
     */
    sequenceNumber: number;
  };

/**
 * Generate the encoded components of a BCH signing serialization from
 * compilation context.
 */
export const generateSigningSerializationComponentsBCH = (
  context: CompilationContextBCH,
): SigningSerializationComponentsBCH => ({
  correspondingOutput:
    context.inputIndex < context.transaction.outputs.length
      ? encodeTransactionOutput(
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          context.transaction.outputs[context.inputIndex]!,
        )
      : undefined,
  locktime: context.transaction.locktime,
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  outpointIndex: context.transaction.inputs[context.inputIndex]!.outpointIndex,
  outpointTransactionHash:
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    context.transaction.inputs[context.inputIndex]!.outpointTransactionHash,
  outputTokenPrefix: encodeTokenPrefix(
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    context.sourceOutputs[context.inputIndex]!.token,
  ),
  outputValue: valueSatoshisToBin(
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    context.sourceOutputs[context.inputIndex]!.valueSatoshis,
  ),
  sequenceNumber:
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    context.transaction.inputs[context.inputIndex]!.sequenceNumber,
  transactionOutpoints: encodeTransactionOutpoints(context.transaction.inputs),
  transactionOutputs: encodeTransactionOutputsForSigning(
    context.transaction.outputs,
  ),
  transactionSequenceNumbers: encodeTransactionInputSequenceNumbersForSigning(
    context.transaction.inputs,
  ),
  transactionUtxos: encodeTransactionOutputsForSigning(context.sourceOutputs),
  version: context.transaction.version,
});

/**
 * Generate the signing serialization for a particular transaction input
 * following the algorithm required by the provided `signingSerializationType`.
 *
 * Note: When validating transactions with multiple signatures,
 * performance-critical applications should use a memoized sha256 implementation
 * to avoid re-computing hashes.
 */
export const generateSigningSerializationBCH = (
  context: CompilationContextBCH,
  {
    coveredBytecode,
    signingSerializationType,
  }: {
    /**
     * The encoded script currently being executed, beginning at the
     * `lastCodeSeparator`.
     */
    coveredBytecode: Uint8Array;
    /**
     * The signing serialization type of the signature (A.K.A. `sighash` type).
     */
    signingSerializationType: Uint8Array;
  },
  sha256: { hash: Sha256['hash'] } = internalSha256,
) =>
  encodeSigningSerializationBCH(
    {
      ...generateSigningSerializationComponentsBCH(context),
      coveredBytecode,
      signingSerializationType,
    },
    sha256,
  );

/**
 * @param signingSerializationType - the 32-bit number indicating the signing
 * serialization algorithm to use
 */
export const isLegacySigningSerialization = (
  signingSerializationType: number,
) => {
  // eslint-disable-next-line no-bitwise, @typescript-eslint/no-magic-numbers
  const forkValue = signingSerializationType >> 8;
  // eslint-disable-next-line no-bitwise, @typescript-eslint/no-magic-numbers
  const newForkValue = (forkValue ^ 0xdead) | 0xff0000;
  // eslint-disable-next-line no-bitwise, @typescript-eslint/no-magic-numbers
  const sighashType = (newForkValue << 8) | (signingSerializationType & 0xff);
  // eslint-disable-next-line no-bitwise
  return (sighashType & SigningSerializationFlag.forkId) === 0;
};
