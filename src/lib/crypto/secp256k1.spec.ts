// tslint:disable:no-expression-statement
import { test } from 'ava';
import { randomBytes } from 'crypto';
import * as elliptic from 'elliptic';
import * as fc from 'fast-check';
// import * as secp256k1Node from 'secp256k1';
import { getEmbeddedSecp256k1Binary } from '../bin';
import { instantiateSecp256k1, instantiateSecp256k1Bytes } from './secp256k1';

// Test vectors (from `zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo wrong`, m/0 and m/1):

// prettier-ignore
const messageHash = new Uint8Array([0xda, 0xde, 0x12, 0xe0, 0x6a, 0x5b, 0xbf, 0x5e, 0x11, 0x16, 0xf9, 0xbc, 0x44, 0x99, 0x8b, 0x87, 0x68, 0x13, 0xe9, 0x48, 0xe1, 0x07, 0x07, 0xdc, 0xb4, 0x80, 0x08, 0xa1, 0xda, 0xf3, 0x51, 0x2d]);

// prettier-ignore
const privkey = new Uint8Array([0xf8, 0x5d, 0x4b, 0xd8, 0xa0, 0x3c, 0xa1, 0x06, 0xc9, 0xde, 0xb4, 0x7b, 0x79, 0x18, 0x03, 0xda, 0xc7, 0xf0, 0x33, 0x38, 0x09, 0xe3, 0xf1, 0xdd, 0x04, 0xd1, 0x82, 0xe0, 0xab, 0xa6, 0xe5, 0x53]);

// prettier-ignore
const secp256k1OrderN = new Uint8Array([0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xfe, 0xba, 0xae, 0xdc, 0xe6, 0xaf, 0x48, 0xa0, 0x3b, 0xbf, 0xd2, 0x5e, 0x8c, 0xd0, 0x36, 0x41, 0x41]);

// prettier-ignore
const pubkeyUncompressed = new Uint8Array([0x04, 0x76, 0xea, 0x9e, 0x36, 0xa7, 0x5d, 0x2e, 0xcf, 0x9c, 0x93, 0xa0, 0xbe, 0x76, 0x88, 0x5e, 0x36, 0xf8, 0x22, 0x52, 0x9d, 0xb2, 0x2a, 0xcf, 0xdc, 0x76, 0x1c, 0x9b, 0x5b, 0x45, 0x44, 0xf5, 0xc5, 0x6d, 0xd5, 0x3b, 0x07, 0xc7, 0xa9, 0x83, 0xbb, 0x2d, 0xdd, 0x71, 0x55, 0x1f, 0x06, 0x33, 0x19, 0x4a, 0x2f, 0xe3, 0x30, 0xf9, 0x0a, 0xaf, 0x67, 0x5d, 0xde, 0x25, 0xb1, 0x37, 0xef, 0xd2, 0x85]);

// prettier-ignore
const pubkeyCompressed = new Uint8Array([0x03, 0x76, 0xea, 0x9e, 0x36, 0xa7, 0x5d, 0x2e, 0xcf, 0x9c, 0x93, 0xa0, 0xbe, 0x76, 0x88, 0x5e, 0x36, 0xf8, 0x22, 0x52, 0x9d, 0xb2, 0x2a, 0xcf, 0xdc, 0x76, 0x1c, 0x9b, 0x5b, 0x45, 0x44, 0xf5, 0xc5]);

// prettier-ignore
const sigDER = new Uint8Array([0x30, 0x45, 0x02, 0x21, 0x00, 0xab, 0x4c, 0x6d, 0x9b, 0xa5, 0x1d, 0xa8, 0x30, 0x72, 0x61, 0x5c, 0x33, 0xa9, 0x88, 0x7b, 0x75, 0x64, 0x78, 0xe6, 0xf9, 0xde, 0x38, 0x10, 0x85, 0xf5, 0x18, 0x3c, 0x97, 0x60, 0x3f, 0xc6, 0xff, 0x02, 0x20, 0x29, 0x72, 0x21, 0x88, 0xbd, 0x93, 0x7f, 0x54, 0xc8, 0x61, 0x58, 0x2c, 0xa6, 0xfc, 0x68, 0x5b, 0x8d, 0xa2, 0xb4, 0x0d, 0x05, 0xf0, 0x6b, 0x36, 0x83, 0x74, 0xd3, 0x5e, 0x4a, 0xf2, 0xb7, 0x64]);

// prettier-ignore
const sigDERHighS = new Uint8Array([0x30, 0x46, 0x02, 0x21, 0x00, 0xab, 0x4c, 0x6d, 0x9b, 0xa5, 0x1d, 0xa8, 0x30, 0x72, 0x61, 0x5c, 0x33, 0xa9, 0x88, 0x7b, 0x75, 0x64, 0x78, 0xe6, 0xf9, 0xde, 0x38, 0x10, 0x85, 0xf5, 0x18, 0x3c, 0x97, 0x60, 0x3f, 0xc6, 0xff, 0x02, 0x21, 0x00, 0xd6, 0x8d, 0xde, 0x77, 0x42, 0x6c, 0x80, 0xab, 0x37, 0x9e, 0xa7, 0xd3, 0x59, 0x03, 0x97, 0xa3, 0x2d, 0x0c, 0x28, 0xd9, 0xa9, 0x58, 0x35, 0x05, 0x3c, 0x5d, 0x8b, 0x2e, 0x85, 0x43, 0x89, 0xdd]);

// prettier-ignore
const sigCompact = new Uint8Array([0xab, 0x4c, 0x6d, 0x9b, 0xa5, 0x1d, 0xa8, 0x30, 0x72, 0x61, 0x5c, 0x33, 0xa9, 0x88, 0x7b, 0x75, 0x64, 0x78, 0xe6, 0xf9, 0xde, 0x38, 0x10, 0x85, 0xf5, 0x18, 0x3c, 0x97, 0x60, 0x3f, 0xc6, 0xff, 0x29, 0x72, 0x21, 0x88, 0xbd, 0x93, 0x7f, 0x54, 0xc8, 0x61, 0x58, 0x2c, 0xa6, 0xfc, 0x68, 0x5b, 0x8d, 0xa2, 0xb4, 0x0d, 0x05, 0xf0, 0x6b, 0x36, 0x83, 0x74, 0xd3, 0x5e, 0x4a, 0xf2, 0xb7, 0x64]);

// prettier-ignore
const sigCompactHighS = new Uint8Array([0xab, 0x4c, 0x6d, 0x9b, 0xa5, 0x1d, 0xa8, 0x30, 0x72, 0x61, 0x5c, 0x33, 0xa9, 0x88, 0x7b, 0x75, 0x64, 0x78, 0xe6, 0xf9, 0xde, 0x38, 0x10, 0x85, 0xf5, 0x18, 0x3c, 0x97, 0x60, 0x3f, 0xc6, 0xff, 0xd6, 0x8d, 0xde, 0x77, 0x42, 0x6c, 0x80, 0xab, 0x37, 0x9e, 0xa7, 0xd3, 0x59, 0x03, 0x97, 0xa3, 0x2d, 0x0c, 0x28, 0xd9, 0xa9, 0x58, 0x35, 0x05, 0x3c, 0x5d, 0x8b, 0x2e, 0x85, 0x43, 0x89, 0xdd]);

// bitcoin-ts setup
const secp256k1Promise = instantiateSecp256k1();
const binary = getEmbeddedSecp256k1Binary();
type ellipticKeyPair = any;

// elliptic setup & helpers
const ec = new elliptic.ec('secp256k1');
const setupElliptic = (array: Uint8Array) => {
  const key: ellipticKeyPair = ec.keyFromPrivate(array);
  const pubUncompressed = new Uint8Array(key.getPublic().encode());
  const pubCompressed = new Uint8Array(key.getPublic().encodeCompressed());
  return {
    key,
    pubCompressed,
    pubUncompressed
  };
};
const ellipticSignMessageDER = (key: ellipticKeyPair, message: Uint8Array) =>
  new Uint8Array(key.sign(message).toDER());
const ellipticCheckSignature = (
  sig: Uint8Array,
  key: ellipticKeyPair,
  message: Uint8Array
): boolean => key.verify(message, sig);

// fast-check helpers
const fcUint8Array = (minLength: number, maxLength: number) =>
  fc
    .array(fc.integer(0, 255), minLength, maxLength)
    .map(a => Uint8Array.from(a));
const fcUint8Array32 = () => fcUint8Array(32, 32);

test('instantiateSecp256k1 with binary', async t => {
  const secp256k1 = await instantiateSecp256k1Bytes(binary);
  t.true(
    secp256k1.verifySignatureDERLowS(sigDER, pubkeyCompressed, messageHash)
  );
});

test('instantiateSecp256k1 with randomization', async t => {
  const secp256k1 = await instantiateSecp256k1(randomBytes(32));
  t.true(
    secp256k1.verifySignatureDERLowS(sigDER, pubkeyUncompressed, messageHash)
  );
});

test('secp256k1.compressPublicKey', async t => {
  const secp256k1 = await secp256k1Promise;
  t.deepEqual(
    secp256k1.compressPublicKey(pubkeyUncompressed),
    pubkeyCompressed
  );
  t.throws(() => secp256k1.compressPublicKey(new Uint8Array(65)));
});

test('secp256k1.derivePublicKeyCompressed', async t => {
  const secp256k1 = await secp256k1Promise;
  t.deepEqual(secp256k1.derivePublicKeyCompressed(privkey), pubkeyCompressed);
  t.throws(() => secp256k1.derivePublicKeyCompressed(secp256k1OrderN));
});

test('secp256k1.derivePublicKeyUncompressed', async t => {
  const secp256k1 = await secp256k1Promise;
  t.deepEqual(
    secp256k1.derivePublicKeyUncompressed(privkey),
    pubkeyUncompressed
  );
  t.throws(() => secp256k1.derivePublicKeyUncompressed(secp256k1OrderN));
});

test('secp256k1.malleateSignatureDER', async t => {
  const secp256k1 = await secp256k1Promise;
  t.deepEqual(secp256k1.malleateSignatureDER(sigDER), sigDERHighS);
  // TODO: fast-check

  // const malleationIsJustNegation = fc.property(
  //   fcUint8Array32(),
  //   fcUint8Array32(),
  //   (privkey, message) => {
  //     // derive public key, sign message, verifyLowS
  //     // malleate, verify
  //     // malleate again, confirm result is deepEqual to initial
  //   }
  // );
  // t.notThrows(() => fc.assert(malleationIsJustNegation));
});

test('secp256k1.malleateSignatureCompact', async t => {
  const secp256k1 = await secp256k1Promise;
  t.deepEqual(secp256k1.malleateSignatureCompact(sigCompact), sigCompactHighS);
  // TODO: fast-check
});

test('secp256k1.normalizeSignatureCompact', async t => {
  const secp256k1 = await secp256k1Promise;
  t.deepEqual(secp256k1.normalizeSignatureCompact(sigCompactHighS), sigCompact);
  // TODO: fast-check
});

test('secp256k1.normalizeSignatureDER', async t => {
  const secp256k1 = await secp256k1Promise;
  t.deepEqual(secp256k1.normalizeSignatureDER(sigDERHighS), sigDER);
  // TODO: fast-check
});

test('secp256k1.signMessageHashCompact', async t => {
  const secp256k1 = await secp256k1Promise;
  t.deepEqual(
    secp256k1.signMessageHashCompact(privkey, messageHash),
    sigCompact
  );
  t.throws(() =>
    secp256k1.signMessageHashCompact(secp256k1OrderN, messageHash)
  );
  // TODO: fast-check
});

test('secp256k1.signMessageHashDER', async t => {
  const secp256k1 = await secp256k1Promise;
  t.deepEqual(secp256k1.signMessageHashDER(privkey, messageHash), sigDER);
  t.throws(() => secp256k1.signMessageHashDER(secp256k1OrderN, messageHash));
  // TODO: fast-check
});

test('secp256k1.signatureCompactToDER', async t => {
  const secp256k1 = await secp256k1Promise;
  t.deepEqual(secp256k1.signatureCompactToDER(sigCompact), sigDER);
  // TODO: fast-check
});

test('secp256k1.signatureDERToCompact', async t => {
  const secp256k1 = await secp256k1Promise;
  t.deepEqual(secp256k1.signatureDERToCompact(sigDER), sigCompact);
  const DERWithBrokenEncoding = sigDER.slice().fill(0, 0, 1);
  t.throws(() => {
    secp256k1.signatureDERToCompact(DERWithBrokenEncoding);
  });
  // TODO: fast-check
});

test('secp256k1.uncompressPublicKey', async t => {
  const secp256k1 = await secp256k1Promise;
  t.deepEqual(
    secp256k1.uncompressPublicKey(pubkeyCompressed),
    pubkeyUncompressed
  );
  t.throws(() => secp256k1.uncompressPublicKey(new Uint8Array(33)));
});

test('secp256k1.validatePrivateKey', async t => {
  const secp256k1 = await secp256k1Promise;
  t.true(secp256k1.validatePrivateKey(privkey));
  t.false(secp256k1.validatePrivateKey(secp256k1OrderN));
  // TODO: fast-check
});

test('secp256k1.verifySignatureCompact', async t => {
  const secp256k1 = await secp256k1Promise;
  t.true(
    secp256k1.verifySignatureCompact(
      sigCompactHighS,
      pubkeyCompressed,
      messageHash
    )
  );
  // TODO: fast-check
});

test('secp256k1.verifySignatureCompactLowS', async t => {
  const secp256k1 = await secp256k1Promise;
  t.true(
    secp256k1.verifySignatureCompactLowS(
      sigCompact,
      pubkeyCompressed,
      messageHash
    )
  );
  // TODO: fast-check
});

test('secp256k1.verifySignatureDER', async t => {
  const secp256k1 = await secp256k1Promise;
  t.true(
    secp256k1.verifySignatureDER(sigDERHighS, pubkeyCompressed, messageHash)
  );
  // TODO: fast-check
});

test('secp256k1.verifySignatureDERLowS', async t => {
  const secp256k1 = await secp256k1Promise;
  t.true(
    secp256k1.verifySignatureDERLowS(sigDER, pubkeyCompressed, messageHash)
  );
  const pubkeyWithBrokenEncoding = pubkeyCompressed.slice().fill(0, 0, 1);
  t.false(
    secp256k1.verifySignatureDERLowS(
      sigDER,
      pubkeyWithBrokenEncoding,
      messageHash
    )
  );
  const DERWithBrokenEncoding = sigDER.slice().fill(0, 0, 1);
  t.false(
    secp256k1.verifySignatureDERLowS(
      DERWithBrokenEncoding,
      pubkeyCompressed,
      messageHash
    )
  );
  const DERWithBadSignature = sigDER.slice().fill(0, 6, 7);
  t.false(
    secp256k1.verifySignatureDERLowS(
      DERWithBadSignature,
      pubkeyCompressed,
      messageHash
    )
  );
  const verifiesDERSignaturesLikeElliptic = fc.property(
    fcUint8Array32(),
    fcUint8Array32(),
    fc.boolean(),
    (privateKey, message, compressed) => {
      const { key, pubUncompressed, pubCompressed } = setupElliptic(privateKey);
      const sig = ellipticSignMessageDER(key, message);
      const pub = compressed ? pubCompressed : pubUncompressed;
      const verifiesWithElliptic = ellipticCheckSignature(sig, key, message);
      const verifies = secp256k1.verifySignatureDERLowS(
        secp256k1.normalizeSignatureDER(sig),
        pub,
        message
      );
      return verifiesWithElliptic === verifies;
    }
  );
  t.notThrows(() => fc.assert(verifiesDERSignaturesLikeElliptic));
});
