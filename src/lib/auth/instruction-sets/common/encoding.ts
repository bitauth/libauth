const enum PublicKey {
  uncompressedByteLength = 65,
  uncompressedHeaderByte = 0x04,
  compressedByteLength = 33,
  compressedHeaderByteEven = 0x02,
  compressedHeaderByteOdd = 0x03
}

export const isValidUncompressedPublicKeyEncoding = (publicKey: Uint8Array) =>
  publicKey.length === PublicKey.uncompressedByteLength &&
  publicKey[0] === PublicKey.uncompressedHeaderByte
    ? true
    : false;

export const isValidCompressedPublicKeyEncoding = (publicKey: Uint8Array) =>
  publicKey.length === PublicKey.compressedByteLength &&
  (publicKey[0] === PublicKey.compressedHeaderByteEven ||
    publicKey[0] === PublicKey.compressedHeaderByteOdd)
    ? true
    : false;

export const isValidPublicKeyEncoding = (publicKey: Uint8Array) =>
  isValidCompressedPublicKeyEncoding(publicKey) ||
  isValidUncompressedPublicKeyEncoding(publicKey);

const enum ASN1 {
  sequenceTagType = 0x30,
  integerTagType = 0x02
}

const enum Sig {
  minimumPossibleLength = 9,
  maximumPossibleLength = 73,

  sequenceTagIndex = 0,
  sequenceLengthIndex = 1,
  rTagIndex = 2,
  rLengthIndex = 3,
  rIndex = 4,

  nonSequenceBytes = 3,
  bytesExcludingIntegers = 7
}

const enum Mask {
  negative = 0x80
}

const isNegative = (value: number) =>
  // tslint:disable-next-line:no-bitwise
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
  index: number
) =>
  signature[tagIndex] === ASN1.integerTagType &&
  length !== 0 &&
  !isNegative(signature[index]) &&
  !hasUnnecessaryPadding(length, signature[index], signature[index + 1]);

/**
 * Validate a bitcoin-encoded signature.
 *
 * From the C++ implementation:
 *
 * A canonical signature exists of: <30> <total len> <02> <len R> <R> <02> <len
 * S> <S> <hashtype>, where R and S are not negative (their first byte has its
 * highest bit not set), and not excessively padded (do not start with a 0 byte,
 * unless an otherwise negative number follows, in which case a single 0 byte is
 * necessary and even required).
 *
 * See https://bitcointalk.org/index.php?topic=8392.msg127623#msg127623
 *
 * This function is consensus-critical since BIP66.
 */
// TODO: unit test cases for each clause
// tslint:disable-next-line:cyclomatic-complexity
export const isValidSignatureEncoding = (signature: Uint8Array) => {
  const rLength = signature[Sig.rLengthIndex];
  const sTagIndex = Sig.rIndex + rLength;
  const sLengthIndex = sTagIndex + 1;
  const sLength = signature[sLengthIndex];
  const sIndex = sLengthIndex + 1;

  return (
    signature.length > Sig.minimumPossibleLength &&
    signature.length < Sig.maximumPossibleLength &&
    signature[Sig.sequenceTagIndex] === ASN1.sequenceTagType &&
    signature[Sig.sequenceLengthIndex] ===
      signature.length - Sig.nonSequenceBytes &&
    signature.length === rLength + sLength + Sig.bytesExcludingIntegers &&
    isValidInteger(signature, Sig.rTagIndex, rLength, Sig.rIndex) &&
    isValidInteger(signature, sTagIndex, sLength, sIndex)
  );
};

/**
 * Split a bitcoin-encoded signature into a signature and signing serialization
 * type.
 *
 * While a bitcoin-encoded signature only includes a single byte to encode the
 * signing serialization type, a 3-byte forkId can be appended to the signing
 * serialization to provide replay-protection between different forks. (See
 * Bitcoin Cash's Replay Protected Sighash spec for details.)
 *
 * @param signature a signature which passes `isValidSignatureEncoding`
 */
// TODO: unit test with and without forkId
export const decodeBitcoinSignature = (encodedSignature: Uint8Array) => ({
  signature: encodedSignature.slice(0, encodedSignature.length - 1),
  signingSerializationType: new Uint8Array([
    encodedSignature[encodedSignature.length - 1]
  ])
});
