import { ConsensusBCH } from '../bch/bch';

import { isDefinedSigningSerializationType } from './signing-serialization';

const enum PublicKey {
  uncompressedByteLength = 65,
  uncompressedHeaderByte = 0x04,
  compressedByteLength = 33,
  compressedHeaderByteEven = 0x02,
  compressedHeaderByteOdd = 0x03,
}

export const isValidUncompressedPublicKeyEncoding = (publicKey: Uint8Array) =>
  publicKey.length === PublicKey.uncompressedByteLength &&
  publicKey[0] === PublicKey.uncompressedHeaderByte;

export const isValidCompressedPublicKeyEncoding = (publicKey: Uint8Array) =>
  publicKey.length === PublicKey.compressedByteLength &&
  (publicKey[0] === PublicKey.compressedHeaderByteEven ||
    publicKey[0] === PublicKey.compressedHeaderByteOdd);

export const isValidPublicKeyEncoding = (publicKey: Uint8Array) =>
  isValidCompressedPublicKeyEncoding(publicKey) ||
  isValidUncompressedPublicKeyEncoding(publicKey);

const enum ASN1 {
  sequenceTagType = 0x30,
  integerTagType = 0x02,
}

const enum DER {
  minimumLength = 8,
  maximumLength = 72,

  sequenceTagIndex = 0,
  sequenceLengthIndex = 1,
  rTagIndex = 2,
  rLengthIndex = 3,
  rValueIndex = 4,

  sequenceTagByte = 1,
  sequenceLengthByte = 1,
  integerTagByte = 1,
  integerLengthByte = 1,
  // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
  sequenceMetadataBytes = sequenceTagByte + sequenceLengthByte,
  // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
  integerMetadataBytes = integerTagByte + integerLengthByte,
  minimumSValueBytes = 1,
  // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
  minimumNonRValueBytes = sequenceMetadataBytes +
    integerMetadataBytes +
    integerMetadataBytes +
    minimumSValueBytes,
}

const enum Mask {
  negative = 0x80,
}

const isNegative = (value: number) =>
  // eslint-disable-next-line no-bitwise
  (value & Mask.negative) !== 0;

const hasUnnecessaryPadding = (
  length: number,
  firstByte: number,
  secondByte: number
) => length > 1 && firstByte === 0 && !isNegative(secondByte);

const isValidInteger = (
  signature: Uint8Array,
  tagIndex: number,
  length: number,
  valueIndex: number
  // eslint-disable-next-line max-params
) =>
  signature[tagIndex] === ASN1.integerTagType &&
  length !== 0 &&
  !isNegative(signature[valueIndex]) &&
  !hasUnnecessaryPadding(
    length,
    signature[valueIndex],
    signature[valueIndex + 1]
  );

/**
 * Validate a DER-encoded signature.
 *
 * @remarks
 * This function is consensus-critical since BIP66, but differs from the BIP66
 * specification in that it does not validate the existence of a signing
 * serialization type byte at the end of the signature (to support
 * OP_CHECKDATASIG). To validate a bitcoin-encoded signature (including null
 * signatures), use `isValidSignatureEncodingBCH`.
 *
 * @privateRemarks
 * From the Bitcoin ABC C++ implementation:
 *
 * Format: 0x30 [total-length] 0x02 [R-length] [R] 0x02 [S-length] [S]
 * total-length: 1-byte length descriptor of everything that follows,
 * excluding the sighash byte.
 * R-length: 1-byte length descriptor of the R value that follows.
 * R: arbitrary-length big-endian encoded R value. It must use the
 * shortest possible encoding for a positive integers (which means no null
 * bytes at the start, except a single one when the next byte has its highest
 * bit set).
 * S-length: 1-byte length descriptor of the S value that follows.
 * S: arbitrary-length big-endian encoded S value. The same rules apply.
 */
// eslint-disable-next-line complexity
export const isValidSignatureEncodingDER = (signature: Uint8Array) => {
  const correctLengthRange =
    signature.length > DER.minimumLength &&
    signature.length < DER.maximumLength;
  const correctSequenceTagType =
    signature[DER.sequenceTagIndex] === ASN1.sequenceTagType;
  const correctSequenceLength =
    signature[DER.sequenceLengthIndex] ===
    signature.length - DER.sequenceMetadataBytes;
  const rLength = signature[DER.rLengthIndex] as number | undefined;
  if (rLength === undefined) {
    return false;
  }
  const consistentRLength =
    rLength <= signature.length - DER.minimumNonRValueBytes;
  const rIsValid = isValidInteger(
    signature,
    DER.rTagIndex,
    rLength,
    DER.rValueIndex
  );
  const sTagIndex = DER.rValueIndex + rLength; // eslint-disable-line @typescript-eslint/restrict-plus-operands
  const sLengthIndex = sTagIndex + 1;
  const sLength = signature[sLengthIndex] as number | undefined;
  if (sLength === undefined) {
    return false;
  }
  const sValueIndex = sLengthIndex + 1;
  const consistentSLength = sValueIndex + sLength === signature.length;
  const sIsValid = isValidInteger(signature, sTagIndex, sLength, sValueIndex);
  return (
    correctLengthRange &&
    correctSequenceTagType &&
    correctSequenceLength &&
    consistentRLength &&
    rIsValid &&
    consistentSLength &&
    sIsValid
  );
};

/**
 * Validate the encoding of a transaction signature, including a signing
 * serialization type byte (A.K.A. "sighash" byte).
 *
 * @param transactionSignature - the full transaction signature
 */
export const isValidSignatureEncodingBCHTransaction = (
  transactionSignature: Uint8Array
) =>
  transactionSignature.length === 0 ||
  transactionSignature.length === ConsensusBCH.schnorrSignatureLength + 1 ||
  (isDefinedSigningSerializationType(
    transactionSignature[transactionSignature.length - 1]
  ) &&
    isValidSignatureEncodingDER(
      transactionSignature.slice(0, transactionSignature.length - 1)
    ));

/**
 * Split a bitcoin-encoded signature into a signature and signing serialization
 * type.
 *
 * While a bitcoin-encoded signature only includes a single byte to encode the
 * signing serialization type, a 3-byte forkId can be appended to the signing
 * serialization to provide replay-protection between different forks. (See
 * Bitcoin Cash's Replay Protected Sighash spec for details.)
 *
 * @param signature - a signature which passes `isValidSignatureEncoding`
 */
export const decodeBitcoinSignature = (encodedSignature: Uint8Array) => ({
  signature: encodedSignature.slice(0, encodedSignature.length - 1),
  signingSerializationType: new Uint8Array([
    encodedSignature[encodedSignature.length - 1],
  ]),
});
