import {
  bigIntToBinUint64LE,
  bigIntToBitcoinVarInt,
  numberToBinUint32LE
} from '../../../..';

/**
 * A.K.A. `sighash` flags
 */
export enum SigningSerializationFlag {
  /**
   * A.K.A. `SIGHASH_ALL`
   */
  all_outputs = 0x01,
  /**
   * A.K.A `SIGHASH_NONE`
   */
  no_outputs = 0x02,
  /**
   * A.K.A. `SIGHASH_SINGLE`
   */
  corresponding_output = 0x03,
  fork_id = 0x40,
  /**
   * A.K.A `ANYONE_CAN_PAY`
   */
  single_input = 0x80
}

const enum Internal {
  mask5Bits = 0b11111,
  sha256HashByteLength = 32
}

export const isDefinedSigningSerializationType = (byte: number) => {
  const baseType =
    byte &
    // tslint:disable-next-line: no-bitwise
    ~(SigningSerializationFlag.fork_id | SigningSerializationFlag.single_input);
  return (
    baseType >= SigningSerializationFlag.all_outputs &&
    baseType <= SigningSerializationFlag.corresponding_output
  );
};

const match = (type: Uint8Array, flag: SigningSerializationFlag) =>
  // tslint:disable-next-line:no-bitwise
  (type[0] & flag) !== 0;

const equals = (
  type: Uint8Array,
  flag: SigningSerializationFlag
  // tslint:disable-next-line:no-bitwise
) => (type[0] & Internal.mask5Bits) === flag;

const shouldSerializeSingleInput = (type: Uint8Array) =>
  match(type, SigningSerializationFlag.single_input);

const shouldSerializeCorrespondingOutput = (type: Uint8Array) =>
  equals(type, SigningSerializationFlag.corresponding_output);

const shouldSerializeNoOutputs = (type: Uint8Array) =>
  equals(type, SigningSerializationFlag.no_outputs);

const emptyHash = () => new Uint8Array(Internal.sha256HashByteLength).fill(0);

/**
 * Return the proper `hashPrevouts` value for a given a signing serialization
 * type.
 * @param signingSerializationType the signing serialization type to test
 * @param hashTransactionOutpoints see `generateSigningSerializationBCH`
 */
const hashPrevouts = (
  signingSerializationType: Uint8Array,
  hashTransactionOutpoints: () => Uint8Array
) =>
  shouldSerializeSingleInput(signingSerializationType)
    ? emptyHash()
    : hashTransactionOutpoints();

/**
 * Return the proper `hashSequence` value for a given a signing serialization
 * type.
 * @param signingSerializationType the signing serialization type to test
 * @param hashTransactionSequenceNumbers see
 * `generateSigningSerializationBCH`
 */
const hashSequence = (
  signingSerializationType: Uint8Array,
  hashTransactionSequenceNumbers: () => Uint8Array
) =>
  !shouldSerializeSingleInput(signingSerializationType) &&
  !shouldSerializeCorrespondingOutput(signingSerializationType) &&
  !shouldSerializeNoOutputs(signingSerializationType)
    ? hashTransactionSequenceNumbers()
    : emptyHash();

/**
 * Return the proper `hashOutputs` value for a given a signing serialization
 * type.
 * @param signingSerializationType the signing serialization type to test
 * @param hashTransactionOutputs see `generateSigningSerializationBCH`
 * @param hashCorrespondingOutput see `generateSigningSerializationBCH`
 */
const hashOutputs = (
  signingSerializationType: Uint8Array,
  hashTransactionOutputs: () => Uint8Array,
  hashCorrespondingOutput: () => Uint8Array
) =>
  !shouldSerializeCorrespondingOutput(signingSerializationType) &&
  !shouldSerializeNoOutputs(signingSerializationType)
    ? hashTransactionOutputs()
    : shouldSerializeCorrespondingOutput(signingSerializationType)
    ? hashCorrespondingOutput()
    : emptyHash();

/**
 * Serialize the signature-protected properties of a transaction following the
 * algorithm required by the `signingSerializationType` of a signature.
 *
 * @param version the version number of the transaction
 * @param hashTransactionOutpoints a function returning the 32-byte double
 * SHA256 hash of the serialization of all input outpoints (A.K.A.
 * `hashPrevouts`) – used if `ANYONECANPAY` is not set
 * @param hashTransactionSequenceNumbers a function returning the double SHA256
 * hash of the serialization of all input sequence numbers. (A.K.A.
 * `hashSequence`) – used if none of `ANYONECANPAY`, `SINGLE`, or `NONE` are
 * set.
 * @param outpointTransactionHash the big-endian (standard) transaction hash of
 * the outpoint being spent.
 * @param outpointIndex the index of the outpoint being spent in
 * `outpointTransactionHash`
 * @param coveredScript the script currently being executed, beginning at the
 * `lastCodeSeparator`.
 * @param outputValue the value of the outpoint in satoshis
 * @param sequenceNumber the sequence number of the input (A.K.A. `nSequence`)
 * @param hashCorrespondingOutput The double SHA256 of the serialization of the
 * output at the same index as this input (A.K.A. `hashOutputs` with
 * `SIGHASH_SINGLE`) – only used if `SINGLE` is set
 * @param hashTransactionOutputs the double SHA256 of the serialization of
 * output amounts and locking bytecode values (A.K.A. `hashOutputs` with
 * `SIGHASH_ALL`)
 * – only used if `ALL` is set
 * @param locktime the locktime of the transaction
 * @param signingSerializationType the signing serialization type of the
 * signature (A.K.A. `sighash` type)
 * @param forkId while a bitcoin-encoded signature only includes a single byte
 * to encode the signing serialization type, a 3-byte forkId can be appended to
 * provide replay-protection between different forks. (See Bitcoin Cash's Replay
 * Protected Sighash spec for details.)
 */
export const generateSigningSerializationBCH = (
  version: number,
  hashTransactionOutpoints: () => Uint8Array,
  hashTransactionSequenceNumbers: () => Uint8Array,
  outpointTransactionHash: Uint8Array,
  outpointIndex: number,
  coveredScript: Uint8Array,
  outputValue: bigint,
  sequenceNumber: number,
  hashCorrespondingOutput: () => Uint8Array,
  hashTransactionOutputs: () => Uint8Array,
  locktime: number,
  signingSerializationType: Uint8Array,
  forkId = new Uint8Array([0, 0, 0])
) =>
  new Uint8Array([
    ...numberToBinUint32LE(version),
    ...hashPrevouts(signingSerializationType, hashTransactionOutpoints),
    ...hashSequence(signingSerializationType, hashTransactionSequenceNumbers),
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
      hashTransactionOutputs,
      hashCorrespondingOutput
    ),
    ...numberToBinUint32LE(locktime),
    ...signingSerializationType,
    ...forkId
  ]);

/**
 * @param signingSerializationType the 32-bit number indicating the signing
 * serialization algorithm to use
 */
export const isLegacySigningSerialization = (
  signingSerializationType: number
) => {
  // tslint:disable-next-line: no-bitwise no-magic-numbers
  const forkValue = signingSerializationType >> 8;
  // tslint:disable-next-line: no-bitwise no-magic-numbers
  const newForkValue = (forkValue ^ 0xdead) | 0xff0000;
  // tslint:disable-next-line: no-bitwise no-magic-numbers
  const sighashType = (newForkValue << 8) | (signingSerializationType & 0xff);
  // tslint:disable-next-line: no-bitwise
  return (sighashType & SigningSerializationFlag.fork_id) === 0;
};
