// tslint:disable:no-expression-statement no-magic-numbers no-bitwise
import { ExecutionContext, test } from 'ava';
import { randomBytes } from 'crypto';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  CompressionFlag,
  ContextFlag,
  getEmbeddedSecp256k1Binary,
  instantiateSecp256k1Wasm,
  instantiateSecp256k1WasmBytes,
  Secp256k1Wasm
} from './secp256k1Wasm';

// test vectors (from `zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo wrong`, m/0 and m/1):

// prettier-ignore
const messageHash = new Uint8Array([0xda, 0xde, 0x12, 0xe0, 0x6a, 0x5b, 0xbf, 0x5e, 0x11, 0x16, 0xf9, 0xbc, 0x44, 0x99, 0x8b, 0x87, 0x68, 0x13, 0xe9, 0x48, 0xe1, 0x07, 0x07, 0xdc, 0xb4, 0x80, 0x08, 0xa1, 0xda, 0xf3, 0x51, 0x2d]);

// prettier-ignore
const privkey = new Uint8Array([0xf8, 0x5d, 0x4b, 0xd8, 0xa0, 0x3c, 0xa1, 0x06, 0xc9, 0xde, 0xb4, 0x7b, 0x79, 0x18, 0x03, 0xda, 0xc7, 0xf0, 0x33, 0x38, 0x09, 0xe3, 0xf1, 0xdd, 0x04, 0xd1, 0x82, 0xe0, 0xab, 0xa6, 0xe5, 0x53]);

// prettier-ignore
const pubkeyUncompressed = new Uint8Array([0x04, 0x76, 0xea, 0x9e, 0x36, 0xa7, 0x5d, 0x2e, 0xcf, 0x9c, 0x93, 0xa0, 0xbe, 0x76, 0x88, 0x5e, 0x36, 0xf8, 0x22, 0x52, 0x9d, 0xb2, 0x2a, 0xcf, 0xdc, 0x76, 0x1c, 0x9b, 0x5b, 0x45, 0x44, 0xf5, 0xc5, 0x6d, 0xd5, 0x3b, 0x07, 0xc7, 0xa9, 0x83, 0xbb, 0x2d, 0xdd, 0x71, 0x55, 0x1f, 0x06, 0x33, 0x19, 0x4a, 0x2f, 0xe3, 0x30, 0xf9, 0x0a, 0xaf, 0x67, 0x5d, 0xde, 0x25, 0xb1, 0x37, 0xef, 0xd2, 0x85]);

// prettier-ignore
const pubkeyCompressed = new Uint8Array([0x03, 0x76, 0xea, 0x9e, 0x36, 0xa7, 0x5d, 0x2e, 0xcf, 0x9c, 0x93, 0xa0, 0xbe, 0x76, 0x88, 0x5e, 0x36, 0xf8, 0x22, 0x52, 0x9d, 0xb2, 0x2a, 0xcf, 0xdc, 0x76, 0x1c, 0x9b, 0x5b, 0x45, 0x44, 0xf5, 0xc5]);

// prettier-ignore
const sigDER = new Uint8Array([0x30, 0x45, 0x02, 0x21, 0x00, 0xab, 0x4c, 0x6d, 0x9b, 0xa5, 0x1d, 0xa8, 0x30, 0x72, 0x61, 0x5c, 0x33, 0xa9, 0x88, 0x7b, 0x75, 0x64, 0x78, 0xe6, 0xf9, 0xde, 0x38, 0x10, 0x85, 0xf5, 0x18, 0x3c, 0x97, 0x60, 0x3f, 0xc6, 0xff, 0x02, 0x20, 0x29, 0x72, 0x21, 0x88, 0xbd, 0x93, 0x7f, 0x54, 0xc8, 0x61, 0x58, 0x2c, 0xa6, 0xfc, 0x68, 0x5b, 0x8d, 0xa2, 0xb4, 0x0d, 0x05, 0xf0, 0x6b, 0x36, 0x83, 0x74, 0xd3, 0x5e, 0x4a, 0xf2, 0xb7, 0x64]);

// prettier-ignore
const sigCompact = new Uint8Array([0xab, 0x4c, 0x6d, 0x9b, 0xa5, 0x1d, 0xa8, 0x30, 0x72, 0x61, 0x5c, 0x33, 0xa9, 0x88, 0x7b, 0x75, 0x64, 0x78, 0xe6, 0xf9, 0xde, 0x38, 0x10, 0x85, 0xf5, 0x18, 0x3c, 0x97, 0x60, 0x3f, 0xc6, 0xff, 0x29, 0x72, 0x21, 0x88, 0xbd, 0x93, 0x7f, 0x54, 0xc8, 0x61, 0x58, 0x2c, 0xa6, 0xfc, 0x68, 0x5b, 0x8d, 0xa2, 0xb4, 0x0d, 0x05, 0xf0, 0x6b, 0x36, 0x83, 0x74, 0xd3, 0x5e, 0x4a, 0xf2, 0xb7, 0x64]);

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
  t.not(rawRSigPtr,0);
  t.is(secp256k1Wasm.signRecoverable(contextPtr, rawRSigPtr, sigHashPtr, privkeyPtr),1);
  
  // the r and s portions of the signature should match that of a non-recoverable signature
  const rIDPtr = secp256k1Wasm.malloc(4);
  const compactRSigPtr = secp256k1Wasm.malloc(64);
  t.not(compactRSigPtr,0);
  secp256k1Wasm.recoverableSignatureSerialize(
    contextPtr,
    compactRSigPtr,
	rIDPtr,
	rawRSigPtr
  );
  const compactRSig = secp256k1Wasm.readHeapU8(compactRSigPtr, 64);
  const rID = secp256k1Wasm.heapU32[rIDPtr >> 2];
  
  t.deepEqual(compactRSig, sigCompact);
  t.is(rID,1);
  
  // re-parsing the signature should produce the same internal format.
  const rawRSig2Ptr = secp256k1Wasm.malloc(65);
  t.is(secp256k1Wasm.recoverableSignatureParse(contextPtr, rawRSig2Ptr, compactRSigPtr, rID),1);
  t.deepEqual(secp256k1Wasm.readHeapU8(rawRSigPtr, 65), secp256k1Wasm.readHeapU8(rawRSig2Ptr, 65));
  
  // the recovered public key should match the derived public key
  const recoveredPublicKeyPtr = secp256k1Wasm.malloc(65);
  const recoveredPublicKeyCompressedPtr = secp256k1Wasm.malloc(33);
  const recoveredPublicKeyCompressedLengthPtr = secp256k1Wasm.mallocSizeT(33);
  
  t.is(secp256k1Wasm.recover(contextPtr, recoveredPublicKeyPtr, rawRSigPtr, sigHashPtr),1);
  
  secp256k1Wasm.pubkeySerialize(
    contextPtr,
    recoveredPublicKeyCompressedPtr,
    recoveredPublicKeyCompressedLengthPtr,
    recoveredPublicKeyPtr,
    CompressionFlag.COMPRESSED
  );
  t.deepEqual(pubkeyCompressed, secp256k1Wasm.readHeapU8(recoveredPublicKeyCompressedPtr, 33));
};

const binary = getEmbeddedSecp256k1Binary();

test('getEmbeddedSecp256k1Binary returns the proper binary', t => {
  const path = join(__dirname, 'secp256k1.wasm');
  const binaryFromDisk = readFileSync(path).buffer;
  t.deepEqual(binary, binaryFromDisk);
});

test('Secp256k1Wasm instantiated with embedded binary', async t => {
  const secp256k1Wasm = await instantiateSecp256k1Wasm();
  testSecp256k1Wasm(t, secp256k1Wasm);
});

test('Secp256k1Wasm instantiated with bytes', async t => {
  const secp256k1Wasm = await instantiateSecp256k1WasmBytes(binary);
  testSecp256k1Wasm(t, secp256k1Wasm);
});
