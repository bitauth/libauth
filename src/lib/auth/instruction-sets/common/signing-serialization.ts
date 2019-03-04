/* istanbul ignore file */ // TODO: stabilize & test

import {
  bigIntToBinUint64LE,
  bigIntToBitcoinVarInt,
  numberToBinUint32LE
} from '../../../..';

/**
 * A.K.A. `sighash` flags
 */
export enum SigningSerializationFlag {
  ALL = 0x01,
  NONE = 0x02,
  SINGLE = 0x03,
  FORKID = 0x40,
  ANYONECANPAY = 0x80
}

const enum Internal {
  mask5Bits = 0x1f,
  sha256HashByteLength = 32
}

const match = (type: Uint8Array, flag: SigningSerializationFlag) =>
  // tslint:disable-next-line:no-bitwise
  (type[0] & flag) !== 0;

const equals = (
  type: Uint8Array,
  flag: SigningSerializationFlag
  // tslint:disable-next-line:no-bitwise
) => (type[0] & Internal.mask5Bits) === flag;

const anyoneCanPay = (type: Uint8Array) =>
  match(type, SigningSerializationFlag.ANYONECANPAY);

const sigSerializeSingle = (type: Uint8Array) =>
  equals(type, SigningSerializationFlag.SINGLE);

const sigSerializeNone = (type: Uint8Array) =>
  equals(type, SigningSerializationFlag.NONE);

const emptyHash = () => new Uint8Array(Internal.sha256HashByteLength).fill(0);

/**
 * Return the proper `hashPrevouts` value for a given a signing serialization
 * type.
 * @param signingSerializationType the signing serialization type to test
 * @param transactionOutpointsHash see `generateBitcoinCashSigningSerialization`
 */
const hashPrevouts = (
  signingSerializationType: Uint8Array,
  transactionOutpointsHash: Uint8Array
) =>
  anyoneCanPay(signingSerializationType)
    ? emptyHash()
    : transactionOutpointsHash;

/**
 * Return the proper `hashSequence` value for a given a signing serialization
 * type.
 * @param signingSerializationType the signing serialization type to test
 * @param transactionSequenceNumbersHash see
 * `generateBitcoinCashSigningSerialization`
 */
const hashSequence = (
  signingSerializationType: Uint8Array,
  transactionSequenceNumbersHash: Uint8Array
) =>
  anyoneCanPay(signingSerializationType) ||
  !sigSerializeSingle(signingSerializationType) ||
  !sigSerializeNone(signingSerializationType)
    ? transactionSequenceNumbersHash
    : emptyHash();

/**
 * Return the proper `hashOutputs` value for a given a signing serialization
 * type.
 * @param signingSerializationType the signing serialization type to test
 * @param transactionOutputsHash see `generateBitcoinCashSigningSerialization`
 * @param correspondingOutputHash see `generateBitcoinCashSigningSerialization`
 */
const hashOutputs = (
  signingSerializationType: Uint8Array,
  transactionOutputsHash: Uint8Array,
  correspondingOutputHash: Uint8Array
) =>
  !sigSerializeSingle(signingSerializationType) &&
  !sigSerializeNone(signingSerializationType)
    ? transactionOutputsHash
    : sigSerializeSingle(signingSerializationType)
    ? correspondingOutputHash
    : emptyHash();

/**
 * Serialize the signature-protected properties of a transaction following the
 * algorithm required by the `signingSerializationType` of a signature.
 *
 * @param version the version number of the transaction
 * @param transactionOutpointsHash the 32-byte double SHA256 hash of the
 * serialization of all input outpoints (A.K.A. `hashPrevouts`) – used if
 * `ANYONECANPAY` is not set
 * @param transactionSequenceNumbersHash the double SHA256 hash of the
 * serialization of all input sequence numbers. (A.K.A. `hashSequence`) – used
 * if none of `ANYONECANPAY`, `SINGLE`, or `NONE` are set.
 * @param outpointTransactionHash the big-endian (standard) transaction hash of
 * the outpoint being spent.
 * @param outpointIndex the index of the outpoint being spent in
 * `outpointTransactionHash`
 * @param coveredScript the script currently being executed, beginning at the
 * `lastCodeSeparator`.
 * @param outputValue the value of the outpoint in satoshis
 * @param sequenceNumber the sequence number of the input (A.K.A. `nSequence`)
 * @param correspondingOutputHash The double SHA256 of the serialization of the
 * output at the same index as this input (A.K.A. `hashOutputs` with
 * `SIGHASH_SINGLE`) – only used if `SINGLE` is set
 * @param transactionOutputsHash the double SHA256 of the serialization of
 * output amounts and locking scripts (A.K.A. `hashOutputs` with `SIGHASH_ALL`)
 * – only used if `ALL` is set
 * @param locktime the locktime of the transaction
 * @param signingSerializationType the signing serialization type of the
 * signature (A.K.A. `sighash` type)
 * @param forkId while a bitcoin-encoded signature only includes a single byte
 * to encode the signing serialization type, a 3-byte forkId can be appended to
 * provide replay-protection between different forks. (See Bitcoin Cash's Replay
 * Protected Sighash spec for details.)
 */
export const generateBitcoinCashSigningSerialization = (
  version: number,
  // TODO: consider making all hashes functions to allow for lazy evaluation
  transactionOutpointsHash: Uint8Array,
  transactionSequenceNumbersHash: Uint8Array,
  outpointTransactionHash: Uint8Array,
  outpointIndex: number,
  coveredScript: Uint8Array,
  outputValue: bigint,
  sequenceNumber: number,
  correspondingOutputHash: Uint8Array,
  transactionOutputsHash: Uint8Array,
  locktime: number,
  signingSerializationType: Uint8Array,
  forkId = new Uint8Array([0, 0, 0])
) =>
  new Uint8Array([
    ...numberToBinUint32LE(version),
    ...hashPrevouts(signingSerializationType, transactionOutpointsHash),
    ...hashSequence(signingSerializationType, transactionSequenceNumbersHash),
    ...outpointTransactionHash.slice().reverse(),
    ...numberToBinUint32LE(outpointIndex),
    ...Uint8Array.from([
      ...bigIntToBitcoinVarInt(BigInt(coveredScript.length)),
      ...coveredScript
    ]),
    ...bigIntToBinUint64LE(outputValue),
    ...numberToBinUint32LE(sequenceNumber),
    ...hashOutputs(
      signingSerializationType,
      transactionOutputsHash,
      correspondingOutputHash
    ),
    ...numberToBinUint32LE(locktime),
    ...signingSerializationType,
    ...forkId
  ]);
