import {
  bigIntToBinUint64LE,
  bigIntToBitcoinVarInt,
  numberToBinUint32LE
} from '../../../format/format';

/* eslint-disable camelcase */
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
/* eslint-enable camelcase */

const enum Internal {
  mask5Bits = 0b11111,
  sha256HashByteLength = 32
}

export const isDefinedSigningSerializationType = (byte: number) => {
  const baseType =
    // eslint-disable-next-line no-bitwise
    byte &
    // eslint-disable-next-line no-bitwise
    ~(SigningSerializationFlag.fork_id | SigningSerializationFlag.single_input);
  return (
    baseType >= SigningSerializationFlag.all_outputs &&
    baseType <= SigningSerializationFlag.corresponding_output
  );
};

const match = (type: Uint8Array, flag: SigningSerializationFlag) =>
  // eslint-disable-next-line no-bitwise
  (type[0] & flag) !== 0;

const equals = (
  type: Uint8Array,
  flag: SigningSerializationFlag
  // eslint-disable-next-line no-bitwise
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
 * @param signingSerializationType - the signing serialization type to test
 * @param transactionOutpoints - see `generateSigningSerializationBCH`
 */
export const hashPrevouts = ({
  sha256,
  signingSerializationType,
  transactionOutpoints
}: {
  sha256: { hash: (input: Uint8Array) => Uint8Array };
  signingSerializationType: Uint8Array;
  transactionOutpoints: Uint8Array;
}) =>
  shouldSerializeSingleInput(signingSerializationType)
    ? emptyHash()
    : sha256.hash(sha256.hash(transactionOutpoints));

/**
 * Return the proper `hashSequence` value for a given a signing serialization
 * type.
 * @param signingSerializationType - the signing serialization type to test
 * @param transactionSequenceNumbers - see
 * `generateSigningSerializationBCH`
 */
export const hashSequence = ({
  sha256,
  signingSerializationType,
  transactionSequenceNumbers
}: {
  sha256: { hash: (input: Uint8Array) => Uint8Array };
  signingSerializationType: Uint8Array;
  transactionSequenceNumbers: Uint8Array;
}) =>
  !shouldSerializeSingleInput(signingSerializationType) &&
  !shouldSerializeCorrespondingOutput(signingSerializationType) &&
  !shouldSerializeNoOutputs(signingSerializationType)
    ? sha256.hash(sha256.hash(transactionSequenceNumbers))
    : emptyHash();

/**
 * Return the proper `hashOutputs` value for a given a signing serialization
 * type.
 * @param signingSerializationType - the signing serialization type to test
 * @param transactionOutputs - see `generateSigningSerializationBCH`
 * @param correspondingOutput - see `generateSigningSerializationBCH`
 */
export const hashOutputs = ({
  correspondingOutput,
  sha256,
  signingSerializationType,
  transactionOutputs
}: {
  sha256: { hash: (input: Uint8Array) => Uint8Array };
  signingSerializationType: Uint8Array;
  transactionOutputs: Uint8Array;
  correspondingOutput: Uint8Array | undefined;
}) =>
  !shouldSerializeCorrespondingOutput(signingSerializationType) &&
  !shouldSerializeNoOutputs(signingSerializationType)
    ? sha256.hash(sha256.hash(transactionOutputs))
    : shouldSerializeCorrespondingOutput(signingSerializationType)
    ? correspondingOutput === undefined
      ? emptyHash()
      : sha256.hash(sha256.hash(correspondingOutput))
    : emptyHash();

/**
 * Serialize the signature-protected properties of a transaction following the
 * algorithm required by the `signingSerializationType` of a signature.
 */
export const generateSigningSerializationBCH = ({
  correspondingOutput,
  coveredBytecode,
  forkId = new Uint8Array([0, 0, 0]),
  locktime,
  outpointIndex,
  outpointTransactionHash,
  outputValue,
  sequenceNumber,
  sha256,
  signingSerializationType,
  transactionOutpoints,
  transactionOutputs,
  transactionSequenceNumbers,
  version
}: {
  sha256: { hash: (input: Uint8Array) => Uint8Array };
  /**
   * The version number of the transaction.
   */
  version: number;
  /**
   * The serialization of output amounts and locking bytecode values (A.K.A.
   * `hashOutputs` with `SIGHASH_ALL`) – only used if `ALL` is set.
   */
  transactionOutpoints: Uint8Array;
  /**
   * The serialization of all input sequence numbers. (A.K.A. `hashSequence`) –
   * used if none of `ANYONECANPAY`, `SINGLE`, or `NONE` are set.
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
   * The serialized script currently being executed, beginning at the
   * `lastCodeSeparator`.
   */
  coveredBytecode: Uint8Array;
  /**
   * The value of the outpoint in satoshis.
   */
  outputValue: number;
  /**
   * The sequence number of the input (A.K.A. `nSequence`).
   */
  sequenceNumber: number;
  /**
   * The serialization of the output at the same index as this input (A.K.A.
   * `hashOutputs` with `SIGHASH_SINGLE`) – only used if `SINGLE` is set.
   */
  correspondingOutput: Uint8Array | undefined;
  /**
   * The serialization of all input outpoints (A.K.A. `hashPrevouts`) – used if
   * `ANYONECANPAY` is not set.
   */
  transactionOutputs: Uint8Array;
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
}) =>
  new Uint8Array([
    ...numberToBinUint32LE(version),
    ...hashPrevouts({ sha256, signingSerializationType, transactionOutpoints }),
    ...hashSequence({
      sha256,
      signingSerializationType,
      transactionSequenceNumbers
    }),
    ...outpointTransactionHash.slice().reverse(),
    ...numberToBinUint32LE(outpointIndex),
    ...Uint8Array.from([
      ...bigIntToBitcoinVarInt(BigInt(coveredBytecode.length)),
      ...coveredBytecode
    ]),
    ...bigIntToBinUint64LE(BigInt(outputValue)),
    ...numberToBinUint32LE(sequenceNumber),
    ...hashOutputs({
      correspondingOutput,
      sha256,
      signingSerializationType,
      transactionOutputs
    }),
    ...numberToBinUint32LE(locktime),
    ...signingSerializationType,
    ...forkId
  ]);

/**
 * @param signingSerializationType - the 32-bit number indicating the signing
 * serialization algorithm to use
 */
export const isLegacySigningSerialization = (
  signingSerializationType: number
) => {
  // eslint-disable-next-line no-bitwise, @typescript-eslint/no-magic-numbers
  const forkValue = signingSerializationType >> 8;
  // eslint-disable-next-line no-bitwise, @typescript-eslint/no-magic-numbers
  const newForkValue = (forkValue ^ 0xdead) | 0xff0000;
  // eslint-disable-next-line no-bitwise, @typescript-eslint/no-magic-numbers
  const sighashType = (newForkValue << 8) | (signingSerializationType & 0xff);
  // eslint-disable-next-line no-bitwise
  return (sighashType & SigningSerializationFlag.fork_id) === 0;
};
