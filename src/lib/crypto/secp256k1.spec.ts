/* eslint-disable functional/no-expression-statement, @typescript-eslint/no-magic-numbers, max-lines, max-params, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-assignment */
// cspell:ignore recid
/* global Buffer */

import { randomBytes } from 'crypto';

import test from 'ava';
import * as elliptic from 'elliptic';
import * as fc from 'fast-check';
import * as secp256k1Node from 'secp256k1';

import {
  getEmbeddedSecp256k1Binary,
  instantiateSecp256k1,
  instantiateSecp256k1Bytes,
  Secp256k1,
} from '../lib';

// test vectors (from `zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo wrong`, m/0 and m/1):

// prettier-ignore
const keyTweakVal = new Uint8Array([0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01]);

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
const privkeyTweakedAdd = new Uint8Array([0xf9, 0x5e, 0x4c, 0xd9, 0xa1, 0x3d, 0xa2, 0x07, 0xca, 0xdf, 0xb5, 0x7c, 0x7a, 0x19, 0x04, 0xdb, 0xc8, 0xf1, 0x34, 0x39, 0x0a, 0xe4, 0xf2, 0xde, 0x05, 0xd2, 0x83, 0xe1, 0xac, 0xa7, 0xe6, 0x54]);

// prettier-ignore
const pubkeyTweakedAddUncompressed = new Uint8Array([0x04, 0x6f, 0x1d, 0xf3, 0x4a, 0x81, 0xdf, 0x8c, 0xec, 0x18, 0x33, 0x34, 0xce, 0xb2, 0x56, 0x49, 0x9e, 0xc6, 0xe7, 0x57, 0x04, 0x57, 0x57, 0x6a, 0x92, 0x37, 0x1b, 0x74, 0x75, 0xc3, 0x4f, 0x2c, 0x19, 0xa8, 0xed, 0xd5, 0xc4, 0x29, 0x44, 0x80, 0xc1, 0xb0, 0xb3, 0x3c, 0xc8, 0xa4, 0xfd, 0x0a, 0x5c, 0x53, 0xc3, 0xd8, 0x9b, 0xd7, 0x93, 0xa7, 0x1f, 0x78, 0x03, 0x5c, 0x74, 0x00, 0xab, 0x34, 0xfc]);

// prettier-ignore
const pubkeyTweakedAddCompressed = new Uint8Array([0x02, 0x6f, 0x1d, 0xf3, 0x4a, 0x81, 0xdf, 0x8c, 0xec, 0x18, 0x33, 0x34, 0xce, 0xb2, 0x56, 0x49, 0x9e, 0xc6, 0xe7, 0x57, 0x04, 0x57, 0x57, 0x6a, 0x92, 0x37, 0x1b, 0x74, 0x75, 0xc3, 0x4f, 0x2c, 0x19]);

// prettier-ignore
const privkeyTweakedMul = new Uint8Array([0x29, 0x9f, 0x6a, 0x4d, 0xe3, 0xa0, 0xfd, 0x06, 0x8c, 0x80, 0x31, 0xef, 0xd6, 0xcf, 0x3a, 0xc6, 0xb8, 0x89, 0x02, 0x5e, 0x65, 0xd2, 0xe6, 0x2d, 0x8e, 0xb9, 0xd6, 0x88, 0x2a, 0xc2, 0x1a, 0x4a]);

// prettier-ignore
const pubkeyTweakedMulUncompressed = new Uint8Array([0x04, 0xb7, 0x98, 0x58, 0x0c, 0x33, 0x8c, 0x02, 0xed, 0xc3, 0x8a, 0xd9, 0xb6, 0x19, 0x7d, 0x4c, 0x56, 0x64, 0xe6, 0xaa, 0x85, 0x49, 0x10, 0xad, 0xa7, 0x5d, 0xc6, 0x10, 0x14, 0x2b, 0x5a, 0x7a, 0x38, 0xb5, 0x0f, 0xb1, 0x55, 0x6c, 0x03, 0x3d, 0x7f, 0xb2, 0x24, 0x21, 0x69, 0x01, 0xc2, 0x86, 0x05, 0x26, 0xad, 0xeb, 0x74, 0xa8, 0x50, 0xf2, 0x9a, 0x50, 0x8f, 0x7a, 0xb3, 0x0b, 0x66, 0x20, 0x74]);

// prettier-ignore
const pubkeyTweakedMulCompressed = new Uint8Array([0x02, 0xb7, 0x98, 0x58, 0x0c, 0x33, 0x8c, 0x02, 0xed, 0xc3, 0x8a, 0xd9, 0xb6, 0x19, 0x7d, 0x4c, 0x56, 0x64, 0xe6, 0xaa, 0x85, 0x49, 0x10, 0xad, 0xa7, 0x5d, 0xc6, 0x10, 0x14, 0x2b, 0x5a, 0x7a, 0x38]);

// prettier-ignore
const sigDER = new Uint8Array([0x30, 0x45, 0x02, 0x21, 0x00, 0xab, 0x4c, 0x6d, 0x9b, 0xa5, 0x1d, 0xa8, 0x30, 0x72, 0x61, 0x5c, 0x33, 0xa9, 0x88, 0x7b, 0x75, 0x64, 0x78, 0xe6, 0xf9, 0xde, 0x38, 0x10, 0x85, 0xf5, 0x18, 0x3c, 0x97, 0x60, 0x3f, 0xc6, 0xff, 0x02, 0x20, 0x29, 0x72, 0x21, 0x88, 0xbd, 0x93, 0x7f, 0x54, 0xc8, 0x61, 0x58, 0x2c, 0xa6, 0xfc, 0x68, 0x5b, 0x8d, 0xa2, 0xb4, 0x0d, 0x05, 0xf0, 0x6b, 0x36, 0x83, 0x74, 0xd3, 0x5e, 0x4a, 0xf2, 0xb7, 0x64]);

// prettier-ignore
const sigDERHighS = new Uint8Array([0x30, 0x46, 0x02, 0x21, 0x00, 0xab, 0x4c, 0x6d, 0x9b, 0xa5, 0x1d, 0xa8, 0x30, 0x72, 0x61, 0x5c, 0x33, 0xa9, 0x88, 0x7b, 0x75, 0x64, 0x78, 0xe6, 0xf9, 0xde, 0x38, 0x10, 0x85, 0xf5, 0x18, 0x3c, 0x97, 0x60, 0x3f, 0xc6, 0xff, 0x02, 0x21, 0x00, 0xd6, 0x8d, 0xde, 0x77, 0x42, 0x6c, 0x80, 0xab, 0x37, 0x9e, 0xa7, 0xd3, 0x59, 0x03, 0x97, 0xa3, 0x2d, 0x0c, 0x28, 0xd9, 0xa9, 0x58, 0x35, 0x05, 0x3c, 0x5d, 0x8b, 0x2e, 0x85, 0x43, 0x89, 0xdd]);

// prettier-ignore
const sigCompact = new Uint8Array([0xab, 0x4c, 0x6d, 0x9b, 0xa5, 0x1d, 0xa8, 0x30, 0x72, 0x61, 0x5c, 0x33, 0xa9, 0x88, 0x7b, 0x75, 0x64, 0x78, 0xe6, 0xf9, 0xde, 0x38, 0x10, 0x85, 0xf5, 0x18, 0x3c, 0x97, 0x60, 0x3f, 0xc6, 0xff, 0x29, 0x72, 0x21, 0x88, 0xbd, 0x93, 0x7f, 0x54, 0xc8, 0x61, 0x58, 0x2c, 0xa6, 0xfc, 0x68, 0x5b, 0x8d, 0xa2, 0xb4, 0x0d, 0x05, 0xf0, 0x6b, 0x36, 0x83, 0x74, 0xd3, 0x5e, 0x4a, 0xf2, 0xb7, 0x64]);

// prettier-ignore
const sigCompactHighS = new Uint8Array([0xab, 0x4c, 0x6d, 0x9b, 0xa5, 0x1d, 0xa8, 0x30, 0x72, 0x61, 0x5c, 0x33, 0xa9, 0x88, 0x7b, 0x75, 0x64, 0x78, 0xe6, 0xf9, 0xde, 0x38, 0x10, 0x85, 0xf5, 0x18, 0x3c, 0x97, 0x60, 0x3f, 0xc6, 0xff, 0xd6, 0x8d, 0xde, 0x77, 0x42, 0x6c, 0x80, 0xab, 0x37, 0x9e, 0xa7, 0xd3, 0x59, 0x03, 0x97, 0xa3, 0x2d, 0x0c, 0x28, 0xd9, 0xa9, 0x58, 0x35, 0x05, 0x3c, 0x5d, 0x8b, 0x2e, 0x85, 0x43, 0x89, 0xdd]);

// prettier-ignore
const schnorrMsgHash = new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);

// prettier-ignore
const sigSchnorr = new Uint8Array([0xb5, 0x10, 0x41, 0x58, 0x7d, 0xa9, 0x46, 0xeb, 0x67, 0x9c, 0xb3, 0x93, 0x6e, 0x1d, 0xbe, 0x5b, 0xf1, 0xd0, 0xd8, 0xac, 0xff, 0x37, 0x8d, 0xc9, 0xc6, 0xc2, 0x0a, 0x32, 0x9f, 0xb0, 0x1b, 0x79, 0xad, 0x65, 0x54, 0x65, 0xf2, 0x26, 0xa0, 0x28, 0x7b, 0x2d, 0xcf, 0x0e, 0x74, 0x6b, 0xc4, 0x55, 0xa9, 0x40, 0xfe, 0x01, 0xbc, 0xd8, 0x0f, 0xa9, 0xb6, 0x63, 0x3e, 0xcb, 0xe0, 0xc7, 0x04, 0x33]);

const sigRecovery = 1;

// libauth setup
const secp256k1Promise = instantiateSecp256k1();
const binary = getEmbeddedSecp256k1Binary();

// elliptic setup & helpers
const ec = new elliptic.ec('secp256k1'); // eslint-disable-line new-cap
const setupElliptic = (privateKey: Uint8Array) => {
  const key = ec.keyFromPrivate(privateKey);
  const pubUncompressed = new Uint8Array(
    key.getPublic().encode('array', false)
  );
  const pubCompressed = new Uint8Array(key.getPublic().encodeCompressed());
  return {
    key,
    pubCompressed,
    pubUncompressed,
  };
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ellipticSignMessageDER = (key: any, message: Uint8Array) =>
  new Uint8Array(key.sign(message).toDER());
const ellipticCheckSignature = (
  sig: Uint8Array,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  key: any,
  message: Uint8Array
): boolean => key.verify(message, sig);

// fast-check helpers
const fcUint8Array = (minLength: number, maxLength: number) =>
  fc
    .array(fc.integer(0, 255), minLength, maxLength)
    .map((a) => Uint8Array.from(a));
const fcUint8Array32 = () => fcUint8Array(32, 32);
const fcValidPrivateKey = (secp256k1: Secp256k1) =>
  fcUint8Array32().filter((generated) =>
    secp256k1.validatePrivateKey(generated)
  );

test('[crypto] instantiateSecp256k1 with binary', async (t) => {
  const secp256k1 = await instantiateSecp256k1Bytes(binary);
  t.true(
    secp256k1.verifySignatureDERLowS(sigDER, pubkeyCompressed, messageHash)
  );
});

test('[crypto] instantiateSecp256k1 with randomization', async (t) => {
  const secp256k1 = await instantiateSecp256k1(randomBytes(32));
  t.true(
    secp256k1.verifySignatureDERLowS(sigDER, pubkeyUncompressed, messageHash)
  );
});

test('[crypto] secp256k1.addTweakPrivateKey', async (t) => {
  const secp256k1 = await secp256k1Promise;
  t.deepEqual(
    secp256k1.addTweakPrivateKey(privkey, keyTweakVal),
    privkeyTweakedAdd
  );
  t.throws(() => secp256k1.addTweakPrivateKey(privkey, Buffer.alloc(32, 255)));
});

test('[fast-check] [crypto] secp256k1.addTweakPrivateKey', async (t) => {
  const secp256k1 = await secp256k1Promise;
  const equivalentToSecp256k1Node = fc.property(
    fcValidPrivateKey(secp256k1),
    (privateKey) => {
      t.deepEqual(
        secp256k1.addTweakPrivateKey(privateKey, keyTweakVal),
        new Uint8Array(
          secp256k1Node.privateKeyTweakAdd(privateKey, keyTweakVal)
        )
      );
    }
  );
  t.notThrows(() => fc.assert(equivalentToSecp256k1Node));
  /*
   * the elliptic library doesn't implement public or private key tweaking.
   * perhaps future tests can do the math in JavaScript and compare with that.
   */
});

test('[crypto] secp256k1.addTweakPublicKeyCompressed', async (t) => {
  const secp256k1 = await secp256k1Promise;
  t.deepEqual(
    secp256k1.addTweakPublicKeyCompressed(pubkeyCompressed, keyTweakVal),
    pubkeyTweakedAddCompressed
  );
  t.throws(() => {
    secp256k1.addTweakPublicKeyCompressed(new Uint8Array(65), keyTweakVal);
  });
  t.throws(() => {
    secp256k1.addTweakPublicKeyCompressed(
      pubkeyCompressed,
      Buffer.alloc(32, 255)
    );
  });
});

test('[fast-check] [crypto] secp256k1.addTweakPublicKeyCompressed', async (t) => {
  const secp256k1 = await secp256k1Promise;
  const equivalentToSecp256k1Node = fc.property(
    fcValidPrivateKey(secp256k1),
    (privateKey) => {
      const pubkeyC = secp256k1.derivePublicKeyCompressed(privateKey);
      t.deepEqual(
        secp256k1.addTweakPublicKeyCompressed(pubkeyC, keyTweakVal),
        new Uint8Array(
          secp256k1Node.publicKeyTweakAdd(pubkeyC, keyTweakVal, true)
        )
      );
    }
  );
  t.notThrows(() => fc.assert(equivalentToSecp256k1Node));
  /*
   * the elliptic library doesn't implement public or private key tweaking.
   * perhaps future tests can do the math in JavaScript and compare with that.
   */
});

test('[crypto] secp256k1.addTweakPublicKeyUncompressed', async (t) => {
  const secp256k1 = await secp256k1Promise;
  t.deepEqual(
    secp256k1.addTweakPublicKeyUncompressed(pubkeyUncompressed, keyTweakVal),
    pubkeyTweakedAddUncompressed
  );
  t.throws(() => {
    secp256k1.addTweakPublicKeyUncompressed(new Uint8Array(65), keyTweakVal);
  });
  t.throws(() => {
    secp256k1.addTweakPublicKeyUncompressed(
      pubkeyCompressed,
      Buffer.alloc(32, 255)
    );
  });
});

test('[fast-check] [crypto] secp256k1.addTweakPublicKeyUncompressed', async (t) => {
  const secp256k1 = await secp256k1Promise;
  const equivalentToSecp256k1Node = fc.property(
    fcValidPrivateKey(secp256k1),
    (privateKey) => {
      const pubkeyU = secp256k1.derivePublicKeyUncompressed(privateKey);
      t.deepEqual(
        secp256k1.addTweakPublicKeyUncompressed(pubkeyU, keyTweakVal),
        new Uint8Array(
          secp256k1Node.publicKeyTweakAdd(pubkeyU, keyTweakVal, false)
        )
      );
    }
  );
  t.notThrows(() => fc.assert(equivalentToSecp256k1Node));
  /*
   * the elliptic library doesn't implement public or private key tweaking.
   * perhaps future tests can do the math in JavaScript and compare with that.
   */
});

test('[crypto] secp256k1.compressPublicKey', async (t) => {
  const secp256k1 = await secp256k1Promise;
  t.deepEqual(
    secp256k1.compressPublicKey(pubkeyUncompressed),
    pubkeyCompressed
  );
  t.throws(() => secp256k1.compressPublicKey(new Uint8Array(65)));
});

test('[fast-check] [crypto] secp256k1.compressPublicKey', async (t) => {
  const secp256k1 = await secp256k1Promise;
  const reversesUncompress = fc.property(
    fcValidPrivateKey(secp256k1),
    (privateKey) => {
      const pubkeyC = secp256k1.derivePublicKeyCompressed(privateKey);
      t.deepEqual(
        pubkeyC,
        secp256k1.compressPublicKey(secp256k1.uncompressPublicKey(pubkeyC))
      );
    }
  );

  const equivalentToSecp256k1Node = fc.property(
    fcValidPrivateKey(secp256k1),
    (privateKey) => {
      const pubkeyU = secp256k1.derivePublicKeyUncompressed(privateKey);
      t.deepEqual(
        secp256k1.compressPublicKey(pubkeyU),
        new Uint8Array(secp256k1Node.publicKeyConvert(pubkeyU, true))
      );
    }
  );

  const equivalentToElliptic = fc.property(
    fcValidPrivateKey(secp256k1),
    (privateKey) => {
      const pubkeyU = secp256k1.derivePublicKeyUncompressed(privateKey);
      t.deepEqual(
        secp256k1.compressPublicKey(pubkeyU),
        new Uint8Array(ec.keyFromPublic(pubkeyU).getPublic().encodeCompressed())
      );
    }
  );
  t.notThrows(() => {
    fc.assert(reversesUncompress);
    fc.assert(equivalentToSecp256k1Node);
    fc.assert(equivalentToElliptic);
  });
});

test('[crypto] secp256k1.derivePublicKeyCompressed', async (t) => {
  const secp256k1 = await secp256k1Promise;
  t.deepEqual(secp256k1.derivePublicKeyCompressed(privkey), pubkeyCompressed);
  t.throws(() => secp256k1.derivePublicKeyCompressed(secp256k1OrderN));
});

test('[fast-check] [crypto] secp256k1.derivePublicKeyCompressed', async (t) => {
  const secp256k1 = await secp256k1Promise;
  const isEquivalentToDeriveUncompressedThenCompress = fc.property(
    fcValidPrivateKey(secp256k1),
    (privateKey) => {
      const pubkeyU = secp256k1.derivePublicKeyUncompressed(privateKey);
      const pubkeyC = secp256k1.derivePublicKeyCompressed(privateKey);
      t.deepEqual(pubkeyC, secp256k1.compressPublicKey(pubkeyU));
    }
  );

  const equivalentToSecp256k1Node = fc.property(
    fcValidPrivateKey(secp256k1),
    (privateKey) => {
      t.deepEqual(
        secp256k1.derivePublicKeyCompressed(privateKey),
        new Uint8Array(secp256k1Node.publicKeyCreate(privateKey, true))
      );
    }
  );

  const equivalentToElliptic = fc.property(
    fcValidPrivateKey(secp256k1),
    (privateKey) => {
      t.deepEqual(
        secp256k1.derivePublicKeyCompressed(privateKey),
        setupElliptic(privateKey).pubCompressed
      );
    }
  );
  t.notThrows(() => {
    fc.assert(isEquivalentToDeriveUncompressedThenCompress);
    fc.assert(equivalentToSecp256k1Node);
    fc.assert(equivalentToElliptic);
  });
});

test('[crypto] secp256k1.derivePublicKeyUncompressed', async (t) => {
  const secp256k1 = await secp256k1Promise;
  t.deepEqual(
    secp256k1.derivePublicKeyUncompressed(privkey),
    pubkeyUncompressed
  );
  t.throws(() => secp256k1.derivePublicKeyUncompressed(secp256k1OrderN));
});

test('[fast-check] [crypto] secp256k1.derivePublicKeyUncompressed', async (t) => {
  const secp256k1 = await secp256k1Promise;
  const isEquivalentToDeriveCompressedThenUncompress = fc.property(
    fcValidPrivateKey(secp256k1),
    (privateKey) => {
      const pubkeyC = secp256k1.derivePublicKeyCompressed(privateKey);
      const pubkeyU = secp256k1.derivePublicKeyUncompressed(privateKey);
      t.deepEqual(pubkeyU, secp256k1.uncompressPublicKey(pubkeyC));
    }
  );

  const equivalentToSecp256k1Node = fc.property(
    fcValidPrivateKey(secp256k1),
    (privateKey) => {
      t.deepEqual(
        secp256k1.derivePublicKeyUncompressed(privateKey),
        new Uint8Array(secp256k1Node.publicKeyCreate(privateKey, false))
      );
    }
  );

  const equivalentToElliptic = fc.property(
    fcValidPrivateKey(secp256k1),
    (privateKey) => {
      t.deepEqual(
        secp256k1.derivePublicKeyUncompressed(privateKey),
        setupElliptic(privateKey).pubUncompressed
      );
    }
  );
  t.notThrows(() => {
    fc.assert(isEquivalentToDeriveCompressedThenUncompress);
    fc.assert(equivalentToSecp256k1Node);
    fc.assert(equivalentToElliptic);
  });
});

test('[crypto] secp256k1.malleateSignatureDER', async (t) => {
  const secp256k1 = await secp256k1Promise;
  t.deepEqual(secp256k1.malleateSignatureDER(sigDER), sigDERHighS);
});

test('[fast-check] [crypto] secp256k1.malleateSignatureDER', async (t) => {
  const secp256k1 = await secp256k1Promise;
  const malleationIsJustNegation = fc.property(
    fcValidPrivateKey(secp256k1),
    fcUint8Array32(),
    (privateKey, message) => {
      const { key } = setupElliptic(privateKey);
      const pubkey = secp256k1.derivePublicKeyCompressed(privateKey);
      const sig = secp256k1.signMessageHashDER(privateKey, message);
      t.true(secp256k1.verifySignatureDERLowS(sig, pubkey, message));
      t.true(ellipticCheckSignature(sig, key, message));
      const malleated = secp256k1.malleateSignatureDER(sig);
      t.true(secp256k1.verifySignatureDER(malleated, pubkey, message));
      t.true(ellipticCheckSignature(malleated, key, message));
      t.false(secp256k1.verifySignatureDERLowS(malleated, pubkey, message));
      t.deepEqual(sig, secp256k1.malleateSignatureDER(malleated));
    }
  );
  t.notThrows(() => {
    fc.assert(malleationIsJustNegation);
  });
});

test('[crypto] secp256k1.malleateSignatureCompact', async (t) => {
  const secp256k1 = await secp256k1Promise;
  t.deepEqual(secp256k1.malleateSignatureCompact(sigCompact), sigCompactHighS);
});

test('[fast-check] [crypto] secp256k1.malleateSignatureCompact', async (t) => {
  const secp256k1 = await secp256k1Promise;
  const malleationIsJustNegation = fc.property(
    fcValidPrivateKey(secp256k1),
    fcUint8Array32(),
    (privateKey, message) => {
      const pubkey = secp256k1.derivePublicKeyCompressed(privateKey);
      const sig = secp256k1.signMessageHashCompact(privateKey, message);
      t.true(secp256k1.verifySignatureCompactLowS(sig, pubkey, message));
      t.true(secp256k1Node.ecdsaVerify(sig, message, pubkey));
      const malleated = secp256k1.malleateSignatureCompact(sig);
      t.true(secp256k1.verifySignatureCompact(malleated, pubkey, message));
      t.false(secp256k1.verifySignatureCompactLowS(malleated, pubkey, message));
      t.false(secp256k1Node.ecdsaVerify(malleated, message, pubkey));
      const malleatedMalleated = secp256k1.malleateSignatureCompact(malleated);
      t.true(secp256k1Node.ecdsaVerify(malleatedMalleated, message, pubkey));
      t.true(
        secp256k1.verifySignatureCompactLowS(
          malleatedMalleated,
          pubkey,
          message
        )
      );
      t.deepEqual(sig, malleatedMalleated);
    }
  );
  t.notThrows(() => {
    fc.assert(malleationIsJustNegation);
  });
});

test('[crypto] secp256k1.mulTweakPrivateKey', async (t) => {
  const secp256k1 = await secp256k1Promise;
  t.deepEqual(
    secp256k1.mulTweakPrivateKey(privkey, keyTweakVal),
    privkeyTweakedMul
  );
  t.throws(() => secp256k1.mulTweakPrivateKey(privkey, Buffer.alloc(32, 255)));
});

test('[fast-check] [crypto] secp256k1.mulTweakPrivateKey', async (t) => {
  const secp256k1 = await secp256k1Promise;
  const equivalentToSecp256k1Node = fc.property(
    fcValidPrivateKey(secp256k1),
    (privateKey) => {
      t.deepEqual(
        secp256k1.mulTweakPrivateKey(privateKey, keyTweakVal),
        new Uint8Array(
          secp256k1Node.privateKeyTweakMul(privateKey, keyTweakVal)
        )
      );
    }
  );
  t.notThrows(() => fc.assert(equivalentToSecp256k1Node));
  /*
   * the elliptic library doesn't implement public or private key tweaking.
   * perhaps future tests can do the math in JavaScript and compare with that.
   */
});

test('[crypto] secp256k1.mulTweakPublicKeyCompressed', async (t) => {
  const secp256k1 = await secp256k1Promise;
  t.deepEqual(
    secp256k1.mulTweakPublicKeyCompressed(pubkeyCompressed, keyTweakVal),
    pubkeyTweakedMulCompressed
  );
  t.throws(() => {
    secp256k1.mulTweakPublicKeyCompressed(new Uint8Array(65), keyTweakVal);
  });
  t.throws(() => {
    secp256k1.mulTweakPublicKeyCompressed(
      pubkeyCompressed,
      Buffer.alloc(32, 255)
    );
  });
});

test('[fast-check] [crypto] secp256k1.mulTweakPublicKeyCompressed', async (t) => {
  const secp256k1 = await secp256k1Promise;
  const equivalentToSecp256k1Node = fc.property(
    fcValidPrivateKey(secp256k1),
    (privateKey) => {
      const pubkeyC = secp256k1.derivePublicKeyCompressed(privateKey);
      t.deepEqual(
        secp256k1.mulTweakPublicKeyCompressed(pubkeyC, keyTweakVal),
        new Uint8Array(
          secp256k1Node.publicKeyTweakMul(pubkeyC, keyTweakVal, true)
        )
      );
    }
  );
  t.notThrows(() => fc.assert(equivalentToSecp256k1Node));
  /*
   * the elliptic library doesn't implement public or private key tweaking.
   * perhaps future tests can do the math in JavaScript and compare with that.
   */
});

test('[crypto] secp256k1.mulTweakPublicKeyUncompressed', async (t) => {
  const secp256k1 = await secp256k1Promise;
  t.deepEqual(
    secp256k1.mulTweakPublicKeyUncompressed(pubkeyUncompressed, keyTweakVal),
    pubkeyTweakedMulUncompressed
  );
  t.throws(() => {
    secp256k1.mulTweakPublicKeyUncompressed(new Uint8Array(65), keyTweakVal);
  });
  t.throws(() => {
    secp256k1.mulTweakPublicKeyUncompressed(
      pubkeyCompressed,
      Buffer.alloc(32, 255)
    );
  });
});

test('[fast-check] [crypto] secp256k1.mulTweakPublicKeyUncompressed', async (t) => {
  const secp256k1 = await secp256k1Promise;
  const equivalentToSecp256k1Node = fc.property(
    fcValidPrivateKey(secp256k1),
    (privateKey) => {
      const pubkeyU = secp256k1.derivePublicKeyUncompressed(privateKey);
      t.deepEqual(
        secp256k1.mulTweakPublicKeyUncompressed(pubkeyU, keyTweakVal),
        new Uint8Array(
          secp256k1Node.publicKeyTweakMul(pubkeyU, keyTweakVal, false)
        )
      );
    }
  );
  t.notThrows(() => fc.assert(equivalentToSecp256k1Node));
  /*
   * the elliptic library doesn't implement public or private key tweaking.
   * perhaps future tests can do the math in JavaScript and compare with that.
   */
});

test('[crypto] secp256k1.normalizeSignatureCompact', async (t) => {
  const secp256k1 = await secp256k1Promise;
  t.deepEqual(secp256k1.normalizeSignatureCompact(sigCompactHighS), sigCompact);
});

test('[fast-check] [crypto] secp256k1.normalizeSignatureCompact', async (t) => {
  const secp256k1 = await secp256k1Promise;
  const malleateThenNormalizeEqualsInitial = fc.property(
    fcValidPrivateKey(secp256k1),
    fcUint8Array32(),
    (privateKey, hash) => {
      const sig = secp256k1.signMessageHashCompact(privateKey, hash);
      t.deepEqual(
        sig,
        secp256k1.normalizeSignatureCompact(
          secp256k1.malleateSignatureCompact(sig)
        )
      );
    }
  );

  const equivalentToSecp256k1Node = fc.property(
    fcValidPrivateKey(secp256k1),
    fcUint8Array32(),
    (privateKey, hash) => {
      const sig = secp256k1.signMessageHashCompact(privateKey, hash);
      const malleated = secp256k1.malleateSignatureCompact(sig);
      t.deepEqual(
        secp256k1.normalizeSignatureCompact(malleated),
        new Uint8Array(secp256k1Node.signatureNormalize(malleated))
      );
    }
  );

  t.notThrows(() => {
    fc.assert(malleateThenNormalizeEqualsInitial);
    fc.assert(equivalentToSecp256k1Node);
  });
});

test('[crypto] secp256k1.normalizeSignatureDER', async (t) => {
  const secp256k1 = await secp256k1Promise;
  t.deepEqual(secp256k1.normalizeSignatureDER(sigDERHighS), sigDER);
});

test('[fast-check] [crypto] secp256k1.normalizeSignatureDER', async (t) => {
  const secp256k1 = await secp256k1Promise;
  const malleateThenNormalizeEqualsInitial = fc.property(
    fcValidPrivateKey(secp256k1),
    fcUint8Array32(),
    (privateKey, hash) => {
      const sig = secp256k1.signMessageHashDER(privateKey, hash);
      t.deepEqual(
        sig,
        secp256k1.normalizeSignatureDER(secp256k1.malleateSignatureDER(sig))
      );
    }
  );

  const equivalentToSecp256k1Node = fc.property(
    fcValidPrivateKey(secp256k1),
    fcUint8Array32(),
    (privateKey, hash) => {
      const sig = secp256k1.signMessageHashDER(privateKey, hash);
      const malleated = secp256k1.malleateSignatureDER(sig);
      t.deepEqual(
        secp256k1.normalizeSignatureDER(malleated),
        new Uint8Array(
          secp256k1Node.signatureExport(
            secp256k1Node.signatureNormalize(
              secp256k1Node.signatureImport(malleated)
            )
          )
        )
      );
    }
  );

  t.notThrows(() => {
    fc.assert(malleateThenNormalizeEqualsInitial);
    fc.assert(equivalentToSecp256k1Node);
  });
});

test('[crypto] secp256k1.recoverPublicKeyCompressed', async (t) => {
  const secp256k1 = await secp256k1Promise;
  t.deepEqual(
    secp256k1.recoverPublicKeyCompressed(sigCompact, sigRecovery, messageHash),
    pubkeyCompressed
  );
  t.throws(() =>
    secp256k1.recoverPublicKeyCompressed(
      new Uint8Array(64).fill(255),
      sigRecovery,
      messageHash
    )
  );
  const failRecover = 2;
  t.throws(() =>
    secp256k1.recoverPublicKeyCompressed(sigCompact, failRecover, messageHash)
  );
});

test('[fast-check] [crypto] secp256k1.recoverPublicKeyCompressed', async (t) => {
  const secp256k1 = await secp256k1Promise;
  const equivalentToSecp256k1Node = fc.property(
    fcValidPrivateKey(secp256k1),
    fcUint8Array32(),
    (privateKey, hash) => {
      const recoverableStuff = secp256k1.signMessageHashRecoverableCompact(
        privateKey,
        hash
      );
      t.deepEqual(
        secp256k1.recoverPublicKeyCompressed(
          recoverableStuff.signature,
          recoverableStuff.recoveryId,
          hash
        ),
        new Uint8Array(
          secp256k1Node.ecdsaRecover(
            recoverableStuff.signature,
            recoverableStuff.recoveryId,
            hash,
            true
          )
        )
      );
    }
  );
  t.notThrows(() => fc.assert(equivalentToSecp256k1Node));
});

test('[crypto] secp256k1.recoverPublicKeyUncompressed', async (t) => {
  const secp256k1 = await secp256k1Promise;
  t.deepEqual(
    secp256k1.recoverPublicKeyUncompressed(
      sigCompact,
      sigRecovery,
      messageHash
    ),
    pubkeyUncompressed
  );
});

test('[fast-check] [crypto] secp256k1.recoverPublicKeyUncompressed', async (t) => {
  const secp256k1 = await secp256k1Promise;
  const equivalentToSecp256k1Node = fc.property(
    fcValidPrivateKey(secp256k1),
    fcUint8Array32(),
    (privateKey, hash) => {
      const recoverableStuff = secp256k1.signMessageHashRecoverableCompact(
        privateKey,
        hash
      );
      t.deepEqual(
        secp256k1.recoverPublicKeyUncompressed(
          recoverableStuff.signature,
          recoverableStuff.recoveryId,
          hash
        ),
        new Uint8Array(
          secp256k1Node.ecdsaRecover(
            recoverableStuff.signature,
            recoverableStuff.recoveryId,
            hash,
            false
          )
        )
      );
    }
  );
  t.notThrows(() => fc.assert(equivalentToSecp256k1Node));
});

test('[crypto] secp256k1.signMessageHashCompact', async (t) => {
  const secp256k1 = await secp256k1Promise;
  t.deepEqual(
    secp256k1.signMessageHashCompact(privkey, messageHash),
    sigCompact
  );
  t.throws(() =>
    secp256k1.signMessageHashCompact(secp256k1OrderN, messageHash)
  );
});

test('[fast-check] [crypto] secp256k1.signMessageHashCompact', async (t) => {
  const secp256k1 = await secp256k1Promise;
  const equivalentToSecp256k1Node = fc.property(
    fcValidPrivateKey(secp256k1),
    fcUint8Array32(),
    (privateKey, hash) => {
      t.deepEqual(
        secp256k1.signMessageHashCompact(privateKey, hash),
        new Uint8Array(secp256k1Node.ecdsaSign(hash, privateKey).signature)
      );
    }
  );

  const equivalentToElliptic = fc.property(
    fcValidPrivateKey(secp256k1),
    fcUint8Array32(),
    (privateKey, hash) => {
      const { key } = setupElliptic(privateKey);
      t.deepEqual(
        secp256k1.signMessageHashCompact(privateKey, hash),
        secp256k1.signatureDERToCompact(
          secp256k1.normalizeSignatureDER(ellipticSignMessageDER(key, hash))
        )
      );
    }
  );

  t.notThrows(() => {
    fc.assert(equivalentToSecp256k1Node);
    fc.assert(equivalentToElliptic);
  });
});

test('[crypto] secp256k1.signMessageHashDER', async (t) => {
  const secp256k1 = await secp256k1Promise;
  t.deepEqual(secp256k1.signMessageHashDER(privkey, messageHash), sigDER);
  t.throws(() => secp256k1.signMessageHashDER(secp256k1OrderN, messageHash));
});

test('[fast-check] [crypto] secp256k1.signMessageHashDER', async (t) => {
  const secp256k1 = await secp256k1Promise;
  const equivalentToSecp256k1Node = fc.property(
    fcValidPrivateKey(secp256k1),
    fcUint8Array32(),
    (privateKey, hash) => {
      t.deepEqual(
        secp256k1.signMessageHashDER(privateKey, hash),
        new Uint8Array(
          secp256k1Node.signatureExport(
            secp256k1Node.ecdsaSign(hash, privateKey).signature
          )
        )
      );
    }
  );

  const equivalentToElliptic = fc.property(
    fcValidPrivateKey(secp256k1),
    fcUint8Array32(),
    (privateKey, hash) => {
      const { key } = setupElliptic(privateKey);
      t.deepEqual(
        secp256k1.signMessageHashDER(privateKey, hash),
        secp256k1.normalizeSignatureDER(ellipticSignMessageDER(key, hash))
      );
    }
  );

  t.notThrows(() => {
    fc.assert(equivalentToSecp256k1Node);
    fc.assert(equivalentToElliptic);
  });
});

test('[crypto] secp256k1.signMessageHashRecoverableCompact', async (t) => {
  const secp256k1 = await secp256k1Promise;
  const recoverableStuff = secp256k1.signMessageHashRecoverableCompact(
    privkey,
    messageHash
  );
  t.is(recoverableStuff.recoveryId, sigRecovery);
  t.deepEqual(recoverableStuff.signature, sigCompact);
  t.throws(() =>
    secp256k1.signMessageHashRecoverableCompact(secp256k1OrderN, messageHash)
  );
});

test('[fast-check] [crypto] secp256k1.signMessageHashRecoverableCompact', async (t) => {
  const secp256k1 = await secp256k1Promise;
  const equivalentToSecp256k1Node = fc.property(
    fcValidPrivateKey(secp256k1),
    fcUint8Array32(),
    (privateKey, hash) => {
      const nodeRecoverableStuff = secp256k1Node.ecdsaSign(hash, privateKey);
      t.deepEqual(
        secp256k1.signMessageHashRecoverableCompact(privateKey, hash),
        {
          recoveryId: nodeRecoverableStuff.recid,
          signature: new Uint8Array(nodeRecoverableStuff.signature),
        }
      );
    }
  );
  t.notThrows(() => fc.assert(equivalentToSecp256k1Node));
});

test('[crypto] secp256k1.signatureCompactToDER', async (t) => {
  const secp256k1 = await secp256k1Promise;
  t.deepEqual(secp256k1.signatureCompactToDER(sigCompact), sigDER);
});

test('[fast-check] [crypto] secp256k1.signatureCompactToDER', async (t) => {
  const secp256k1 = await secp256k1Promise;
  const reversesCompress = fc.property(
    fcValidPrivateKey(secp256k1),
    (privateKey) => {
      const pubkeyU = secp256k1.derivePublicKeyUncompressed(privateKey);
      t.deepEqual(
        pubkeyU,
        secp256k1.uncompressPublicKey(secp256k1.compressPublicKey(pubkeyU))
      );
    }
  );

  const equivalentToSecp256k1Node = fc.property(
    fcValidPrivateKey(secp256k1),
    fcUint8Array32(),
    (privateKey, hash) => {
      const sig = secp256k1.signMessageHashCompact(privateKey, hash);
      t.deepEqual(
        new Uint8Array(secp256k1Node.signatureExport(sig)),
        secp256k1.signatureCompactToDER(sig)
      );
    }
  );

  t.notThrows(() => {
    fc.assert(reversesCompress);
    fc.assert(equivalentToSecp256k1Node);
  });
});

test('[crypto] secp256k1.signatureDERToCompact', async (t) => {
  const secp256k1 = await secp256k1Promise;
  t.deepEqual(secp256k1.signatureDERToCompact(sigDER), sigCompact);
  const sigDERWithBrokenEncoding = sigDER.slice().fill(0, 0, 1);
  t.throws(() => {
    secp256k1.signatureDERToCompact(sigDERWithBrokenEncoding);
  });
});

test('[fast-check] [crypto] secp256k1.signatureDERToCompact', async (t) => {
  const secp256k1 = await secp256k1Promise;
  const equivalentToSecp256k1Node = fc.property(
    fcValidPrivateKey(secp256k1),
    fcUint8Array32(),
    (privateKey, hash) => {
      const sig = secp256k1.signMessageHashDER(privateKey, hash);
      t.deepEqual(
        new Uint8Array(secp256k1Node.signatureImport(sig)),
        secp256k1.signatureDERToCompact(sig)
      );
    }
  );
  t.notThrows(() => {
    fc.assert(equivalentToSecp256k1Node);
  });
});

test('[crypto] secp256k1.uncompressPublicKey', async (t) => {
  const secp256k1 = await secp256k1Promise;
  t.deepEqual(
    secp256k1.uncompressPublicKey(pubkeyCompressed),
    pubkeyUncompressed
  );
  t.throws(() => secp256k1.uncompressPublicKey(new Uint8Array(33)));
});

test('[fast-check] [crypto] secp256k1.uncompressPublicKey', async (t) => {
  const secp256k1 = await secp256k1Promise;
  const equivalentToSecp256k1Node = fc.property(
    fcValidPrivateKey(secp256k1),
    (privateKey) => {
      const pubkeyC = secp256k1.derivePublicKeyCompressed(privateKey);
      t.deepEqual(
        new Uint8Array(secp256k1Node.publicKeyConvert(pubkeyC, false)),
        secp256k1.uncompressPublicKey(pubkeyC)
      );
    }
  );
  t.notThrows(() => {
    fc.assert(equivalentToSecp256k1Node);
  });
});

test('[crypto] secp256k1.validatePrivateKey', async (t) => {
  const secp256k1 = await secp256k1Promise;
  t.true(secp256k1.validatePrivateKey(privkey));
  t.false(secp256k1.validatePrivateKey(secp256k1OrderN));
});

test('[fast-check] [crypto] secp256k1.validatePrivateKey', async (t) => {
  const secp256k1 = await secp256k1Promise;
  // eslint-disable-next-line functional/immutable-data
  const almostInvalid = Array(15).fill(255);
  // invalid >= 0xFFFF FFFF FFFF FFFF FFFF FFFF FFFF FFFE BAAE DCE6 AF48 A03B BFD2 5E8C D036 4140
  const theRest = 32 - almostInvalid.length;
  const equivalentToSecp256k1Node = fc.property(
    fc
      .array(fc.integer(0, 255), theRest, theRest)
      .map((random) => Uint8Array.from([...almostInvalid, ...random])),
    (privateKey) =>
      secp256k1.validatePrivateKey(privateKey) ===
      secp256k1Node.privateKeyVerify(privateKey)
  );
  t.notThrows(() => {
    fc.assert(equivalentToSecp256k1Node);
  });
});

test('[crypto] secp256k1.verifySignatureCompact', async (t) => {
  const secp256k1 = await secp256k1Promise;
  t.true(
    secp256k1.verifySignatureCompact(
      sigCompactHighS,
      pubkeyCompressed,
      messageHash
    )
  );
});

test('[fast-check] [crypto] secp256k1.verifySignatureCompact', async (t) => {
  const secp256k1 = await secp256k1Promise;
  const equivalentToSecp256k1Node = fc.property(
    fcValidPrivateKey(secp256k1),
    fcUint8Array32(),
    fc.boolean(),
    fc.boolean(),
    (privateKey, message, compressed, invalidate) => {
      const pubUncompressed = secp256k1Node.publicKeyCreate(privateKey, false);
      const pubCompressed = secp256k1Node.publicKeyCreate(privateKey, true);
      const sig = secp256k1Node.ecdsaSign(message, privateKey).signature;
      const testSig = invalidate ? sig.fill(0, 6, 7) : sig;
      const pub = compressed ? pubCompressed : pubUncompressed;
      const malleated = secp256k1.malleateSignatureCompact(testSig);
      return (
        secp256k1Node.ecdsaVerify(testSig, message, pub) ===
        secp256k1.verifySignatureCompact(malleated, pub, message)
      );
    }
  );

  const equivalentToElliptic = fc.property(
    fcValidPrivateKey(secp256k1),
    fcUint8Array32(),
    fc.boolean(),
    fc.boolean(),
    (privateKey, message, compressed, invalidate) => {
      const { key, pubUncompressed, pubCompressed } = setupElliptic(privateKey);
      const sig = ellipticSignMessageDER(key, message);
      const testSig = invalidate ? sig.fill(0, 6, 20) : sig;
      const pub = compressed ? pubCompressed : pubUncompressed;
      const compactSig = secp256k1.signatureDERToCompact(testSig);
      return (
        ellipticCheckSignature(testSig, key, message) ===
        secp256k1.verifySignatureCompact(compactSig, pub, message)
      );
    }
  );

  t.notThrows(() => {
    fc.assert(equivalentToSecp256k1Node);
    fc.assert(equivalentToElliptic);
  });
});

test('[crypto] secp256k1.verifySignatureCompactLowS', async (t) => {
  const secp256k1 = await secp256k1Promise;
  t.true(
    secp256k1.verifySignatureCompactLowS(
      sigCompact,
      pubkeyCompressed,
      messageHash
    )
  );
});

test('[fast-check] [crypto] secp256k1.verifySignatureCompactLowS', async (t) => {
  const secp256k1 = await secp256k1Promise;
  const equivalentToSecp256k1Node = fc.property(
    fcValidPrivateKey(secp256k1),
    fcUint8Array32(),
    fc.boolean(),
    fc.boolean(),
    (privateKey, message, compressed, invalidate) => {
      const pubUncompressed = secp256k1Node.publicKeyCreate(privateKey, false);
      const pubCompressed = secp256k1Node.publicKeyCreate(privateKey, true);
      const sig = secp256k1Node.ecdsaSign(message, privateKey).signature;
      const testSig = invalidate ? sig.fill(0, 6, 7) : sig;
      const pub = compressed ? pubCompressed : pubUncompressed;
      return (
        secp256k1Node.ecdsaVerify(testSig, message, pub) ===
        secp256k1.verifySignatureCompactLowS(testSig, pub, message)
      );
    }
  );

  const equivalentToElliptic = fc.property(
    fcValidPrivateKey(secp256k1),
    fcUint8Array32(),
    fc.boolean(),
    fc.boolean(),
    (privateKey, message, compressed, invalidate) => {
      const { key, pubUncompressed, pubCompressed } = setupElliptic(privateKey);
      const sig = secp256k1.normalizeSignatureDER(
        ellipticSignMessageDER(key, message)
      );
      const testSig = invalidate ? sig.fill(0, 6, 20) : sig;
      const pub = compressed ? pubCompressed : pubUncompressed;
      const compactSig = secp256k1.signatureDERToCompact(testSig);
      return (
        ellipticCheckSignature(testSig, key, message) ===
        secp256k1.verifySignatureCompactLowS(compactSig, pub, message)
      );
    }
  );

  t.notThrows(() => {
    fc.assert(equivalentToSecp256k1Node);
    fc.assert(equivalentToElliptic);
  });
});

test('[crypto] secp256k1.verifySignatureDER', async (t) => {
  const secp256k1 = await secp256k1Promise;
  t.true(
    secp256k1.verifySignatureDER(sigDERHighS, pubkeyCompressed, messageHash)
  );
});

test('[crypto] secp256k1.verifySignatureDERLowS', async (t) => {
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
  const sigDERWithBrokenEncoding = sigDER.slice().fill(0, 0, 1);
  t.false(
    secp256k1.verifySignatureDERLowS(
      sigDERWithBrokenEncoding,
      pubkeyCompressed,
      messageHash
    )
  );
  const sigDERWithBadSignature = sigDER.slice().fill(0, 6, 7);
  t.false(
    secp256k1.verifySignatureDERLowS(
      sigDERWithBadSignature,
      pubkeyCompressed,
      messageHash
    )
  );
});

test('[fast-check] [crypto] secp256k1.verifySignatureDERLowS', async (t) => {
  const secp256k1 = await secp256k1Promise;
  const equivalentToSecp256k1Node = fc.property(
    fcValidPrivateKey(secp256k1),
    fcUint8Array32(),
    fc.boolean(),
    fc.boolean(),
    (privateKey, message, compressed, invalidate) => {
      const pubUncompressed = secp256k1Node.publicKeyCreate(privateKey, false);
      const pubCompressed = secp256k1Node.publicKeyCreate(privateKey, true);
      const original = secp256k1Node.ecdsaSign(message, privateKey).signature;
      const sig = secp256k1Node.signatureExport(original);
      const testSig = invalidate ? sig.fill(0, 6, 7) : sig;
      const pub = compressed ? pubCompressed : pubUncompressed;
      const imported = secp256k1Node.signatureImport(testSig);
      return (
        secp256k1Node.ecdsaVerify(imported, message, pub) ===
        secp256k1.verifySignatureDERLowS(testSig, pub, message)
      );
    }
  );

  const equivalentToElliptic = fc.property(
    fcValidPrivateKey(secp256k1),
    fcUint8Array32(),
    fc.boolean(),
    fc.boolean(),
    (privateKey, message, compressed, invalidate) => {
      const { key, pubUncompressed, pubCompressed } = setupElliptic(privateKey);
      const sig = ellipticSignMessageDER(key, message);
      const testSig = invalidate ? sig.fill(0, 6, 7) : sig;
      const pub = compressed ? pubCompressed : pubUncompressed;
      return (
        ellipticCheckSignature(testSig, key, message) ===
        secp256k1.verifySignatureDERLowS(
          secp256k1.normalizeSignatureDER(testSig),
          pub,
          message
        )
      );
    }
  );

  t.notThrows(() => {
    fc.assert(equivalentToSecp256k1Node);
    fc.assert(equivalentToElliptic);
  });
});

test('[crypto] secp256k1.signMessageHashSchnorr', async (t) => {
  const secp256k1 = await secp256k1Promise;
  t.deepEqual(
    secp256k1.signMessageHashSchnorr(privkey, schnorrMsgHash),
    sigSchnorr
  );
  t.throws(() =>
    secp256k1.signMessageHashSchnorr(secp256k1OrderN, schnorrMsgHash)
  );
});

test('[fast-check] [crypto] secp256k1.signMessageHashSchnorr', async (t) => {
  const secp256k1 = await secp256k1Promise;
  const createsValidSignatures = fc.property(
    fcValidPrivateKey(secp256k1),
    fcUint8Array32(),
    fc.boolean(),
    (privateKey, hash, invalidate) => {
      const publicKey = secp256k1.derivePublicKeyCompressed(privateKey);
      const signature = secp256k1.signMessageHashSchnorr(privateKey, hash);
      t.is(
        secp256k1.verifySignatureSchnorr(
          invalidate ? signature : signature.fill(0),
          publicKey,
          hash
        ),
        invalidate
      );
    }
  );
  t.notThrows(() => {
    fc.assert(createsValidSignatures);
  });
});

test('[crypto] secp256k1.verifySchnorr', async (t) => {
  const secp256k1 = await secp256k1Promise;
  t.true(
    secp256k1.verifySignatureSchnorr(
      sigSchnorr,
      pubkeyCompressed,
      schnorrMsgHash
    )
  );
  const pubkeyWithBrokenEncoding = pubkeyCompressed.slice().fill(0, 0, 1);
  t.false(
    secp256k1.verifySignatureSchnorr(
      sigSchnorr,
      pubkeyWithBrokenEncoding,
      schnorrMsgHash
    )
  );
  const sigSchnorrWithBadSignature = sigSchnorr.slice().fill(0, 6, 7);
  t.false(
    secp256k1.verifySignatureSchnorr(
      sigSchnorrWithBadSignature,
      pubkeyCompressed,
      schnorrMsgHash
    )
  );

  // test vectors from Bitcoin ABC libsecp256k1

  /* Test vector 1 */
  // prettier-ignore
  const pk1 = Uint8Array.from([0x02, 0x79, 0xbe, 0x66, 0x7e, 0xf9, 0xdc, 0xbb, 0xac, 0x55, 0xa0, 0x62, 0x95, 0xce, 0x87, 0x0b, 0x07, 0x02, 0x9b, 0xfc, 0xdb, 0x2d, 0xce, 0x28, 0xd9, 0x59, 0xf2, 0x81, 0x5b, 0x16, 0xf8, 0x17, 0x98]);
  // prettier-ignore
  const msg1 = Uint8Array.from([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
  // prettier-ignore
  const sig1 = Uint8Array.from([0x78, 0x7a, 0x84, 0x8e, 0x71, 0x04, 0x3d, 0x28, 0x0c, 0x50, 0x47, 0x0e, 0x8e, 0x15, 0x32, 0xb2, 0xdd, 0x5d, 0x20, 0xee, 0x91, 0x2a, 0x45, 0xdb, 0xdd, 0x2b, 0xd1, 0xdf, 0xbf, 0x18, 0x7e, 0xf6, 0x70, 0x31, 0xa9, 0x88, 0x31, 0x85, 0x9d, 0xc3, 0x4d, 0xff, 0xee, 0xdd, 0xa8, 0x68, 0x31, 0x84, 0x2c, 0xcd, 0x00, 0x79, 0xe1, 0xf9, 0x2a, 0xf1, 0x77, 0xf7, 0xf2, 0x2c, 0xc1, 0xdc, 0xed, 0x05]);
  t.is(secp256k1.verifySignatureSchnorr(sig1, pk1, msg1), true);

  /* Test vector 2 */
  // prettier-ignore
  const pk2 = Uint8Array.from([0x02, 0xdf, 0xf1, 0xd7, 0x7f, 0x2a, 0x67, 0x1c, 0x5f, 0x36, 0x18, 0x37, 0x26, 0xdb, 0x23, 0x41, 0xbe, 0x58, 0xfe, 0xae, 0x1d, 0xa2, 0xde, 0xce, 0xd8, 0x43, 0x24, 0x0f, 0x7b, 0x50, 0x2b, 0xa6, 0x59]);
  // prettier-ignore
  const msg2 = Uint8Array.from([0x24, 0x3f, 0x6a, 0x88, 0x85, 0xa3, 0x08, 0xd3, 0x13, 0x19, 0x8a, 0x2e, 0x03, 0x70, 0x73, 0x44, 0xa4, 0x09, 0x38, 0x22, 0x29, 0x9f, 0x31, 0xd0, 0x08, 0x2e, 0xfa, 0x98, 0xec, 0x4e, 0x6c, 0x89]);
  // prettier-ignore
  const sig2 = Uint8Array.from([0x2a, 0x29, 0x8d, 0xac, 0xae, 0x57, 0x39, 0x5a, 0x15, 0xd0, 0x79, 0x5d, 0xdb, 0xfd, 0x1d, 0xcb, 0x56, 0x4d, 0xa8, 0x2b, 0x0f, 0x26, 0x9b, 0xc7, 0x0a, 0x74, 0xf8, 0x22, 0x04, 0x29, 0xba, 0x1d, 0x1e, 0x51, 0xa2, 0x2c, 0xce, 0xc3, 0x55, 0x99, 0xb8, 0xf2, 0x66, 0x91, 0x22, 0x81, 0xf8, 0x36, 0x5f, 0xfc, 0x2d, 0x03, 0x5a, 0x23, 0x04, 0x34, 0xa1, 0xa6, 0x4d, 0xc5, 0x9f, 0x70, 0x13, 0xfd]);
  t.is(secp256k1.verifySignatureSchnorr(sig2, pk2, msg2), true);

  /* Test vector 6: R.y is not a quadratic residue */
  // prettier-ignore
  const pk6 = Uint8Array.from([0x02, 0xdf, 0xf1, 0xd7, 0x7f, 0x2a, 0x67, 0x1c, 0x5f, 0x36, 0x18, 0x37, 0x26, 0xdb, 0x23, 0x41, 0xbe, 0x58, 0xfe, 0xae, 0x1d, 0xa2, 0xde, 0xce, 0xd8, 0x43, 0x24, 0x0f, 0x7b, 0x50, 0x2b, 0xa6, 0x59]);
  // prettier-ignore
  const msg6 = Uint8Array.from([0x24, 0x3f, 0x6a, 0x88, 0x85, 0xa3, 0x08, 0xd3, 0x13, 0x19, 0x8a, 0x2e, 0x03, 0x70, 0x73, 0x44, 0xa4, 0x09, 0x38, 0x22, 0x29, 0x9f, 0x31, 0xd0, 0x08, 0x2e, 0xfa, 0x98, 0xec, 0x4e, 0x6c, 0x89]);
  // prettier-ignore
  const sig6 = Uint8Array.from([0x2a, 0x29, 0x8d, 0xac, 0xae, 0x57, 0x39, 0x5a, 0x15, 0xd0, 0x79, 0x5d, 0xdb, 0xfd, 0x1d, 0xcb, 0x56, 0x4d, 0xa8, 0x2b, 0x0f, 0x26, 0x9b, 0xc7, 0x0a, 0x74, 0xf8, 0x22, 0x04, 0x29, 0xba, 0x1d, 0xfa, 0x16, 0xae, 0xe0, 0x66, 0x09, 0x28, 0x0a, 0x19, 0xb6, 0x7a, 0x24, 0xe1, 0x97, 0x7e, 0x46, 0x97, 0x71, 0x2b, 0x5f, 0xd2, 0x94, 0x39, 0x14, 0xec, 0xd5, 0xf7, 0x30, 0x90, 0x1b, 0x4a, 0xb7]);
  t.is(secp256k1.verifySignatureSchnorr(sig6, pk6, msg6), false);
});
