/* eslint-disable functional/no-expression-statement, @typescript-eslint/no-magic-numbers */
import { randomBytes } from 'crypto';
import { readFileSync } from 'fs';
import { join } from 'path';

import test, { ExecutionContext } from 'ava';

import {
  CompressionFlag,
  ContextFlag,
  getEmbeddedSecp256k1Binary,
  instantiateSecp256k1Wasm,
  instantiateSecp256k1WasmBytes,
  Secp256k1Wasm,
} from '../../lib';

// test vectors from `zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo wrong` (`xprv9s21ZrQH143K2PfMvkNViFc1fgumGqBew45JD8SxA59Jc5M66n3diqb92JjvaR61zT9P89Grys12kdtV4EFVo6tMwER7U2hcUmZ9VfMYPLC`), m/0 and m/1:

// prettier-ignore
const keyTweakVal = new Uint8Array([0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01]);

// prettier-ignore
const messageHash = new Uint8Array([0xda, 0xde, 0x12, 0xe0, 0x6a, 0x5b, 0xbf, 0x5e, 0x11, 0x16, 0xf9, 0xbc, 0x44, 0x99, 0x8b, 0x87, 0x68, 0x13, 0xe9, 0x48, 0xe1, 0x07, 0x07, 0xdc, 0xb4, 0x80, 0x08, 0xa1, 0xda, 0xf3, 0x51, 0x2d]);

// prettier-ignore
const privkey = new Uint8Array([0xf8, 0x5d, 0x4b, 0xd8, 0xa0, 0x3c, 0xa1, 0x06, 0xc9, 0xde, 0xb4, 0x7b, 0x79, 0x18, 0x03, 0xda, 0xc7, 0xf0, 0x33, 0x38, 0x09, 0xe3, 0xf1, 0xdd, 0x04, 0xd1, 0x82, 0xe0, 0xab, 0xa6, 0xe5, 0x53]);

// prettier-ignore
const pubkeyUncompressed = new Uint8Array([0x04, 0x76, 0xea, 0x9e, 0x36, 0xa7, 0x5d, 0x2e, 0xcf, 0x9c, 0x93, 0xa0, 0xbe, 0x76, 0x88, 0x5e, 0x36, 0xf8, 0x22, 0x52, 0x9d, 0xb2, 0x2a, 0xcf, 0xdc, 0x76, 0x1c, 0x9b, 0x5b, 0x45, 0x44, 0xf5, 0xc5, 0x6d, 0xd5, 0x3b, 0x07, 0xc7, 0xa9, 0x83, 0xbb, 0x2d, 0xdd, 0x71, 0x55, 0x1f, 0x06, 0x33, 0x19, 0x4a, 0x2f, 0xe3, 0x30, 0xf9, 0x0a, 0xaf, 0x67, 0x5d, 0xde, 0x25, 0xb1, 0x37, 0xef, 0xd2, 0x85]);

// prettier-ignore
const pubkeyCompressed = new Uint8Array([0x03, 0x76, 0xea, 0x9e, 0x36, 0xa7, 0x5d, 0x2e, 0xcf, 0x9c, 0x93, 0xa0, 0xbe, 0x76, 0x88, 0x5e, 0x36, 0xf8, 0x22, 0x52, 0x9d, 0xb2, 0x2a, 0xcf, 0xdc, 0x76, 0x1c, 0x9b, 0x5b, 0x45, 0x44, 0xf5, 0xc5]);

// prettier-ignore
const privkeyTweakedAdd = new Uint8Array([0xf9, 0x5e, 0x4c, 0xd9, 0xa1, 0x3d, 0xa2, 0x07, 0xca, 0xdf, 0xb5, 0x7c, 0x7a, 0x19, 0x04, 0xdb, 0xc8, 0xf1, 0x34, 0x39, 0x0a, 0xe4, 0xf2, 0xde, 0x05, 0xd2, 0x83, 0xe1, 0xac, 0xa7, 0xe6, 0x54]);

// prettier-ignore
const pubkeyTweakedAddCompressed = new Uint8Array([0x02, 0x6f, 0x1d, 0xf3, 0x4a, 0x81, 0xdf, 0x8c, 0xec, 0x18, 0x33, 0x34, 0xce, 0xb2, 0x56, 0x49, 0x9e, 0xc6, 0xe7, 0x57, 0x04, 0x57, 0x57, 0x6a, 0x92, 0x37, 0x1b, 0x74, 0x75, 0xc3, 0x4f, 0x2c, 0x19]);

// prettier-ignore
const privkeyTweakedMul = new Uint8Array([0x29, 0x9f, 0x6a, 0x4d, 0xe3, 0xa0, 0xfd, 0x06, 0x8c, 0x80, 0x31, 0xef, 0xd6, 0xcf, 0x3a, 0xc6, 0xb8, 0x89, 0x02, 0x5e, 0x65, 0xd2, 0xe6, 0x2d, 0x8e, 0xb9, 0xd6, 0x88, 0x2a, 0xc2, 0x1a, 0x4a]);

// prettier-ignore
const pubkeyTweakedMulCompressed = new Uint8Array([0x02, 0xb7, 0x98, 0x58, 0x0c, 0x33, 0x8c, 0x02, 0xed, 0xc3, 0x8a, 0xd9, 0xb6, 0x19, 0x7d, 0x4c, 0x56, 0x64, 0xe6, 0xaa, 0x85, 0x49, 0x10, 0xad, 0xa7, 0x5d, 0xc6, 0x10, 0x14, 0x2b, 0x5a, 0x7a, 0x38]);

// prettier-ignore
const sigDER = new Uint8Array([0x30, 0x45, 0x02, 0x21, 0x00, 0xab, 0x4c, 0x6d, 0x9b, 0xa5, 0x1d, 0xa8, 0x30, 0x72, 0x61, 0x5c, 0x33, 0xa9, 0x88, 0x7b, 0x75, 0x64, 0x78, 0xe6, 0xf9, 0xde, 0x38, 0x10, 0x85, 0xf5, 0x18, 0x3c, 0x97, 0x60, 0x3f, 0xc6, 0xff, 0x02, 0x20, 0x29, 0x72, 0x21, 0x88, 0xbd, 0x93, 0x7f, 0x54, 0xc8, 0x61, 0x58, 0x2c, 0xa6, 0xfc, 0x68, 0x5b, 0x8d, 0xa2, 0xb4, 0x0d, 0x05, 0xf0, 0x6b, 0x36, 0x83, 0x74, 0xd3, 0x5e, 0x4a, 0xf2, 0xb7, 0x64]);

// prettier-ignore
const sigCompact = new Uint8Array([0xab, 0x4c, 0x6d, 0x9b, 0xa5, 0x1d, 0xa8, 0x30, 0x72, 0x61, 0x5c, 0x33, 0xa9, 0x88, 0x7b, 0x75, 0x64, 0x78, 0xe6, 0xf9, 0xde, 0x38, 0x10, 0x85, 0xf5, 0x18, 0x3c, 0x97, 0x60, 0x3f, 0xc6, 0xff, 0x29, 0x72, 0x21, 0x88, 0xbd, 0x93, 0x7f, 0x54, 0xc8, 0x61, 0x58, 0x2c, 0xa6, 0xfc, 0x68, 0x5b, 0x8d, 0xa2, 0xb4, 0x0d, 0x05, 0xf0, 0x6b, 0x36, 0x83, 0x74, 0xd3, 0x5e, 0x4a, 0xf2, 0xb7, 0x64]);

// prettier-ignore
const schnorrMsgHash = new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);

// prettier-ignore
const sigSchnorr = new Uint8Array([0xb5, 0x10, 0x41, 0x58, 0x7d, 0xa9, 0x46, 0xeb, 0x67, 0x9c, 0xb3, 0x93, 0x6e, 0x1d, 0xbe, 0x5b, 0xf1, 0xd0, 0xd8, 0xac, 0xff, 0x37, 0x8d, 0xc9, 0xc6, 0xc2, 0x0a, 0x32, 0x9f, 0xb0, 0x1b, 0x79, 0xad, 0x65, 0x54, 0x65, 0xf2, 0x26, 0xa0, 0x28, 0x7b, 0x2d, 0xcf, 0x0e, 0x74, 0x6b, 0xc4, 0x55, 0xa9, 0x40, 0xfe, 0x01, 0xbc, 0xd8, 0x0f, 0xa9, 0xb6, 0x63, 0x3e, 0xcb, 0xe0, 0xc7, 0x04, 0x33]);

const testSecp256k1Wasm = (
  t: ExecutionContext,
  secp256k1Wasm: Secp256k1Wasm
) => {
  t.truthy(secp256k1Wasm.heapU32);
  t.truthy(secp256k1Wasm.heapU8);
  t.truthy(secp256k1Wasm.instance);

  const contextPtr = secp256k1Wasm.contextCreate(ContextFlag.BOTH);
  {
    const seedPtr = secp256k1Wasm.mallocUint8Array(
      new Uint8Array(randomBytes(32))
    );
    t.is(secp256k1Wasm.contextRandomize(contextPtr, seedPtr), 1);
    secp256k1Wasm.free(seedPtr);
  }
  const privkeyPtr = secp256k1Wasm.mallocUint8Array(privkey);
  t.is(secp256k1Wasm.seckeyVerify(contextPtr, privkeyPtr), 1);

  // derive the public key from the private key
  const rawPubkeyPtr = secp256k1Wasm.malloc(64);
  t.is(secp256k1Wasm.pubkeyCreate(contextPtr, rawPubkeyPtr, privkeyPtr), 1);

  // serialize, uncompressed
  const uncompressedOutputPtr = secp256k1Wasm.malloc(65);
  const uncompressedOutputLengthPtr = secp256k1Wasm.mallocSizeT(65);
  secp256k1Wasm.pubkeySerialize(
    contextPtr,
    uncompressedOutputPtr,
    uncompressedOutputLengthPtr,
    rawPubkeyPtr,
    CompressionFlag.UNCOMPRESSED
  );
  const uncompressedLength = secp256k1Wasm.readSizeT(
    uncompressedOutputLengthPtr
  );
  const uncompressedPublicKey = secp256k1Wasm.readHeapU8(
    uncompressedOutputPtr,
    uncompressedLength
  );
  t.deepEqual(pubkeyUncompressed, uncompressedPublicKey);

  // serialize, compressed
  const compressedOutputPtr = secp256k1Wasm.malloc(33);
  const compressedOutputLengthPtr = secp256k1Wasm.mallocSizeT(33);
  secp256k1Wasm.pubkeySerialize(
    contextPtr,
    compressedOutputPtr,
    compressedOutputLengthPtr,
    rawPubkeyPtr,
    CompressionFlag.COMPRESSED
  );
  const compressedLength = secp256k1Wasm.readSizeT(compressedOutputLengthPtr);
  const compressedPublicKey = secp256k1Wasm.readHeapU8(
    compressedOutputPtr,
    compressedLength
  );
  t.deepEqual(pubkeyCompressed, compressedPublicKey);

  // parse the uncompressed pubkey, convert it to compressed
  const rawPubkey2Ptr = secp256k1Wasm.malloc(64);
  t.is(
    secp256k1Wasm.pubkeyParse(
      contextPtr,
      rawPubkey2Ptr,
      uncompressedOutputPtr,
      65
    ),
    1
  );
  const compressedOutput2Ptr = secp256k1Wasm.malloc(33);
  const compressedOutput2LengthPtr = secp256k1Wasm.mallocSizeT(33);
  t.is(
    secp256k1Wasm.pubkeySerialize(
      contextPtr,
      compressedOutput2Ptr,
      compressedOutput2LengthPtr,
      rawPubkey2Ptr,
      CompressionFlag.COMPRESSED
    ),
    1
  );
  const convertedLength = secp256k1Wasm.readSizeT(compressedOutput2LengthPtr);
  const convertedPublicKey = secp256k1Wasm.readHeapU8(
    compressedOutput2Ptr,
    convertedLength
  );
  t.deepEqual(convertedPublicKey, pubkeyCompressed);
  t.deepEqual(convertedPublicKey, compressedPublicKey);

  // sign sigHash using privkey
  const rawSigPtr = secp256k1Wasm.malloc(64);
  const sigHashPtr = secp256k1Wasm.mallocUint8Array(messageHash);
  t.is(secp256k1Wasm.sign(contextPtr, rawSigPtr, sigHashPtr, privkeyPtr), 1);

  // serialize the signature in DER format
  const sigDERPtr = secp256k1Wasm.malloc(72);
  const sigDERLengthPtr = secp256k1Wasm.mallocSizeT(72);
  t.is(
    secp256k1Wasm.signatureSerializeDER(
      contextPtr,
      sigDERPtr,
      sigDERLengthPtr,
      rawSigPtr
    ),
    1
  );
  const sigDERLength = secp256k1Wasm.readSizeT(sigDERLengthPtr);
  t.is(sigDERLength, 71);
  const signatureDER = secp256k1Wasm.readHeapU8(sigDERPtr, sigDERLength);
  t.deepEqual(signatureDER, sigDER);

  // parse the DER format signature
  const rawSig2Ptr = secp256k1Wasm.malloc(64);
  t.is(
    secp256k1Wasm.signatureParseDER(
      contextPtr,
      rawSig2Ptr,
      sigDERPtr,
      sigDERLength
    ),
    1
  );

  // serialize the signature in compact format
  const compactSigPtr = secp256k1Wasm.malloc(64);
  secp256k1Wasm.signatureSerializeCompact(
    contextPtr,
    compactSigPtr,
    rawSig2Ptr
  );
  const compactSig = secp256k1Wasm.readHeapU8(compactSigPtr, 64);
  t.deepEqual(compactSig, sigCompact);

  // parse the compact format signature
  const rawSig3Ptr = secp256k1Wasm.malloc(64);
  t.is(
    secp256k1Wasm.signatureParseCompact(contextPtr, rawSig3Ptr, compactSigPtr),
    1
  );

  // verify the signature
  t.is(
    secp256k1Wasm.verify(contextPtr, rawSig3Ptr, sigHashPtr, rawPubkeyPtr),
    1
  );

  // malleate, verify and fail
  const malleatedSigPtr = secp256k1Wasm.malloc(64);
  const malleatedTwicePtr = secp256k1Wasm.malloc(64);
  secp256k1Wasm.signatureMalleate(contextPtr, malleatedSigPtr, rawSig3Ptr);
  secp256k1Wasm.signatureMalleate(
    contextPtr,
    malleatedTwicePtr,
    malleatedSigPtr
  );
  t.is(
    secp256k1Wasm.verify(contextPtr, malleatedSigPtr, sigHashPtr, rawPubkeyPtr),
    0
  );
  const rawSig3 = secp256k1Wasm.readHeapU8(rawSig3Ptr, 64);
  const malleatedTwiceSig = secp256k1Wasm.readHeapU8(malleatedTwicePtr, 64);
  t.deepEqual(rawSig3, malleatedTwiceSig);

  // normalize, verify and pass
  const normalizedSigPtr = secp256k1Wasm.malloc(64);
  t.is(
    secp256k1Wasm.signatureNormalize(
      contextPtr,
      normalizedSigPtr,
      malleatedSigPtr
    ),
    1
  );
  t.is(
    secp256k1Wasm.verify(
      contextPtr,
      normalizedSigPtr,
      sigHashPtr,
      rawPubkeyPtr
    ),
    1
  );

  // recovery signature
  const rawRSigPtr = secp256k1Wasm.malloc(65);
  t.not(rawRSigPtr, 0);
  t.is(
    secp256k1Wasm.signRecoverable(
      contextPtr,
      rawRSigPtr,
      sigHashPtr,
      privkeyPtr
    ),
    1
  );

  // the r and s portions of the signature should match that of a non-recoverable signature
  const rIDPtr = secp256k1Wasm.malloc(4);
  const compactRSigPtr = secp256k1Wasm.malloc(64);
  t.not(compactRSigPtr, 0);
  secp256k1Wasm.recoverableSignatureSerialize(
    contextPtr,
    compactRSigPtr,
    rIDPtr,
    rawRSigPtr
  );
  const compactRSig = secp256k1Wasm.readHeapU8(compactRSigPtr, 64);
  // eslint-disable-next-line no-bitwise
  const rID = secp256k1Wasm.heapU32[rIDPtr >> 2];

  t.deepEqual(compactRSig, sigCompact);
  t.is(rID, 1);

  // re-parsing the signature should produce the same internal format.
  const rawRSig2Ptr = secp256k1Wasm.malloc(65);
  t.is(
    secp256k1Wasm.recoverableSignatureParse(
      contextPtr,
      rawRSig2Ptr,
      compactRSigPtr,
      rID
    ),
    1
  );
  t.deepEqual(
    secp256k1Wasm.readHeapU8(rawRSigPtr, 65),
    secp256k1Wasm.readHeapU8(rawRSig2Ptr, 65)
  );

  // the recovered public key should match the derived public key
  const recoveredPublicKeyPtr = secp256k1Wasm.malloc(65);
  const recoveredPublicKeyCompressedPtr = secp256k1Wasm.malloc(33);
  const recoveredPublicKeyCompressedLengthPtr = secp256k1Wasm.mallocSizeT(33);

  t.is(
    secp256k1Wasm.recover(
      contextPtr,
      recoveredPublicKeyPtr,
      rawRSigPtr,
      sigHashPtr
    ),
    1
  );

  secp256k1Wasm.pubkeySerialize(
    contextPtr,
    recoveredPublicKeyCompressedPtr,
    recoveredPublicKeyCompressedLengthPtr,
    recoveredPublicKeyPtr,
    CompressionFlag.COMPRESSED
  );
  t.deepEqual(
    pubkeyCompressed,
    secp256k1Wasm.readHeapU8(recoveredPublicKeyCompressedPtr, 33)
  );

  // skipping uncompressed checks since we already verified that parsing and serializing works.

  const keyTweakPtr = secp256k1Wasm.malloc(32);

  const privkeyTweakedAddPtr = secp256k1Wasm.malloc(32);
  const rawPubkeyDerivedTweakedAddPtr = secp256k1Wasm.malloc(64);
  const pubkeyDerivedTweakedAddCompressedPtr = secp256k1Wasm.malloc(33);
  const pubkeyDerivedTweakedAddCompressedLengthPtr = secp256k1Wasm.mallocSizeT(
    33
  );
  const rawPubkeyTweakedAddPtr = secp256k1Wasm.malloc(64);
  const pubkeyTweakedAddCompressedPtr = secp256k1Wasm.malloc(33);
  const pubkeyTweakedAddCompressedLengthPtr = secp256k1Wasm.mallocSizeT(33);

  const privkeyTweakedMulPtr = secp256k1Wasm.malloc(32);
  const rawPubkeyDerivedTweakedMulPtr = secp256k1Wasm.malloc(64);
  const pubkeyDerivedTweakedMulCompressedPtr = secp256k1Wasm.malloc(33);
  const pubkeyDerivedTweakedMulCompressedLengthPtr = secp256k1Wasm.mallocSizeT(
    33
  );
  const rawPubkeyTweakedMulPtr = secp256k1Wasm.malloc(64);
  const pubkeyTweakedMulCompressedPtr = secp256k1Wasm.malloc(33);
  const pubkeyTweakedMulCompressedLengthPtr = secp256k1Wasm.mallocSizeT(33);

  t.not(rawPubkeyTweakedMulPtr, 0);
  t.not(pubkeyTweakedMulCompressedPtr, 0);
  t.not(pubkeyTweakedMulCompressedLengthPtr, 0);

  // set pre determine values
  secp256k1Wasm.heapU8.set(keyTweakVal, keyTweakPtr);

  secp256k1Wasm.heapU8.set(privkey, privkeyTweakedAddPtr);
  // we already verified that rawPubkeyPtr matches the given pubkeyCompressed, so let's re-use that.
  secp256k1Wasm.heapU8.copyWithin(
    rawPubkeyTweakedAddPtr,
    rawPubkeyPtr,
    rawPubkeyPtr + 64
  );

  secp256k1Wasm.heapU8.set(privkey, privkeyTweakedMulPtr);
  secp256k1Wasm.heapU8.copyWithin(
    rawPubkeyTweakedMulPtr,
    rawPubkeyPtr,
    rawPubkeyPtr + 64
  );

  /*
   * actually test the stuff
   * tweak add
   */
  t.is(
    secp256k1Wasm.privkeyTweakAdd(
      contextPtr,
      privkeyTweakedAddPtr,
      keyTweakPtr
    ),
    1
  );
  t.deepEqual(
    secp256k1Wasm.readHeapU8(privkeyTweakedAddPtr, 32),
    privkeyTweakedAdd
  );
  t.is(
    secp256k1Wasm.pubkeyCreate(
      contextPtr,
      rawPubkeyDerivedTweakedAddPtr,
      privkeyTweakedAddPtr
    ),
    1
  );
  secp256k1Wasm.pubkeySerialize(
    contextPtr,
    pubkeyDerivedTweakedAddCompressedPtr,
    pubkeyDerivedTweakedAddCompressedLengthPtr,
    rawPubkeyDerivedTweakedAddPtr,
    CompressionFlag.COMPRESSED
  );
  t.deepEqual(
    secp256k1Wasm.readHeapU8(pubkeyDerivedTweakedAddCompressedPtr, 33),
    pubkeyTweakedAddCompressed
  );
  t.is(
    secp256k1Wasm.pubkeyTweakAdd(
      contextPtr,
      rawPubkeyTweakedAddPtr,
      keyTweakPtr
    ),
    1
  );
  secp256k1Wasm.pubkeySerialize(
    contextPtr,
    pubkeyTweakedAddCompressedPtr,
    pubkeyTweakedAddCompressedLengthPtr,
    rawPubkeyTweakedAddPtr,
    CompressionFlag.COMPRESSED
  );
  t.deepEqual(
    secp256k1Wasm.readHeapU8(pubkeyTweakedAddCompressedPtr, 33),
    pubkeyTweakedAddCompressed
  );

  // tweak mul
  t.is(
    secp256k1Wasm.privkeyTweakMul(
      contextPtr,
      privkeyTweakedMulPtr,
      keyTweakPtr
    ),
    1
  );
  t.deepEqual(
    secp256k1Wasm.readHeapU8(privkeyTweakedMulPtr, 32),
    privkeyTweakedMul
  );
  t.is(
    secp256k1Wasm.pubkeyCreate(
      contextPtr,
      rawPubkeyDerivedTweakedMulPtr,
      privkeyTweakedMulPtr
    ),
    1
  );
  secp256k1Wasm.pubkeySerialize(
    contextPtr,
    pubkeyDerivedTweakedMulCompressedPtr,
    pubkeyDerivedTweakedMulCompressedLengthPtr,
    rawPubkeyDerivedTweakedMulPtr,
    CompressionFlag.COMPRESSED
  );
  t.deepEqual(
    secp256k1Wasm.readHeapU8(pubkeyDerivedTweakedMulCompressedPtr, 33),
    pubkeyTweakedMulCompressed
  );
  t.is(
    secp256k1Wasm.pubkeyTweakMul(
      contextPtr,
      rawPubkeyTweakedMulPtr,
      keyTweakPtr
    ),
    1
  );
  secp256k1Wasm.pubkeySerialize(
    contextPtr,
    pubkeyTweakedMulCompressedPtr,
    pubkeyTweakedMulCompressedLengthPtr,
    rawPubkeyTweakedMulPtr,
    CompressionFlag.COMPRESSED
  );
  t.deepEqual(
    secp256k1Wasm.readHeapU8(pubkeyTweakedMulCompressedPtr, 33),
    pubkeyTweakedMulCompressed
  );

  // create schnorr signature
  const schnorrSigPtr = secp256k1Wasm.malloc(64);
  const schnorrMsgHashPtr = secp256k1Wasm.mallocUint8Array(schnorrMsgHash);
  t.is(
    secp256k1Wasm.schnorrSign(
      contextPtr,
      schnorrSigPtr,
      schnorrMsgHashPtr,
      privkeyPtr
    ),
    1
  );
  t.deepEqual(secp256k1Wasm.readHeapU8(schnorrSigPtr, 64), sigSchnorr);

  // verify the schnorr signature
  t.is(
    secp256k1Wasm.schnorrVerify(
      contextPtr,
      schnorrSigPtr,
      schnorrMsgHashPtr,
      rawPubkeyPtr
    ),
    1
  );
};

const binary = getEmbeddedSecp256k1Binary();

test('[crypto] getEmbeddedSecp256k1Binary returns the proper binary', (t) => {
  const path = join(__dirname, 'secp256k1.wasm');
  const binaryFromDisk = readFileSync(path).buffer;
  t.deepEqual(binary, binaryFromDisk);
});

test('[crypto] Secp256k1Wasm instantiated with embedded binary', async (t) => {
  const secp256k1Wasm = await instantiateSecp256k1Wasm();
  testSecp256k1Wasm(t, secp256k1Wasm);
});

test('[crypto] Secp256k1Wasm instantiated with bytes', async (t) => {
  const secp256k1Wasm = await instantiateSecp256k1WasmBytes(binary);
  testSecp256k1Wasm(t, secp256k1Wasm);
});
