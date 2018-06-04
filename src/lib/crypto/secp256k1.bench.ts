// tslint:disable:no-expression-statement no-let
import { test } from 'ava';
import suite from 'chuhai';
import { randomBytes } from 'crypto';
import * as elliptic from 'elliptic';
import * as secp256k1Node from 'secp256k1';
import { instantiateSecp256k1, Secp256k1 } from './secp256k1';

const secp256k1Promise = instantiateSecp256k1();

function getValidPrivateKey(secp256k1: Secp256k1): Uint8Array {
  let privKey: Uint8Array;
  do {
    privKey = randomBytes(32);
  } while (!secp256k1.validatePrivateKey(privKey));
  return privKey;
}

async function setup(): Promise<{
  readonly ellipticEc: any;
  readonly secp256k1: Secp256k1;
}> {
  return {
    ellipticEc: new elliptic.ec('secp256k1'),
    secp256k1: await secp256k1Promise
  };
}

/**
 * Note: elliptic doesn't document an equivalent to verifySignatureDERLowS, so
 * these benchmarks slightly overestimates elliptic's performance in
 * applications where Low-S verification is required (i.e. Bitcoin).
 */
test('bench: secp256k1: verify signature Low-S, uncompressed pubkey', async t => {
  const { ellipticEc, secp256k1 } = await setup();
  await suite(t.title, s => {
    let messageHash: Uint8Array;
    let pubkeyUncompressed: Uint8Array;
    let sigDER: Uint8Array;
    let result: boolean;
    function nextCycle(): void {
      const privKey = getValidPrivateKey(secp256k1);
      messageHash = randomBytes(32);
      pubkeyUncompressed = secp256k1.derivePublicKeyUncompressed(privKey);
      sigDER = secp256k1.signMessageHashDER(privKey, messageHash);
      result = false;
    }
    nextCycle();
    s.bench('bitcoin-ts', () => {
      result = secp256k1.verifySignatureDERLowS(
        sigDER,
        pubkeyUncompressed,
        messageHash
      );
    });
    s.bench('elliptic', () => {
      result = ellipticEc
        .keyFromPublic(new Buffer(pubkeyUncompressed).toString('hex'), 'hex')
        .verify(messageHash, sigDER);
    });
    s.bench('secp256k1-node', () => {
      result = secp256k1Node.verify(
        messageHash,
        secp256k1Node.signatureImport(sigDER),
        pubkeyUncompressed
      );
    });
    s.cycle(() => {
      t.true(result);
      nextCycle();
    });
  });
});

test('bench: secp256k1: verify signature Low-S, compressed pubkey', async t => {
  const { ellipticEc, secp256k1 } = await setup();
  await suite(t.title, s => {
    let messageHash: Uint8Array;
    let pubkeyCompressed: Uint8Array;
    let sigDER: Uint8Array;
    let result: boolean;
    function nextCycle(): void {
      const privKey = getValidPrivateKey(secp256k1);
      messageHash = randomBytes(32);
      pubkeyCompressed = secp256k1.derivePublicKeyCompressed(privKey);
      sigDER = secp256k1.signMessageHashDER(privKey, messageHash);
      result = false;
    }
    nextCycle();
    s.bench('bitcoin-ts', () => {
      result = secp256k1.verifySignatureDERLowS(
        sigDER,
        pubkeyCompressed,
        messageHash
      );
    });
    s.bench('elliptic', () => {
      result = ellipticEc
        .keyFromPublic(new Buffer(pubkeyCompressed).toString('hex'), 'hex')
        .verify(messageHash, sigDER);
    });
    s.bench('secp256k1-node', () => {
      result = secp256k1Node.verify(
        messageHash,
        secp256k1Node.signatureImport(sigDER),
        pubkeyCompressed
      );
    });
    s.cycle(() => {
      t.true(result);
      nextCycle();
    });
  });
});

test('bench: secp256k1: derive compressed pubkey', async t => {
  const { ellipticEc, secp256k1 } = await setup();
  await suite(t.title, s => {
    let privKey: Uint8Array;
    let pubkeyCompressedExpected: Uint8Array;
    let pubkeyCompressedBenchmark: Uint8Array;
    function nextCycle(): void {
      privKey = getValidPrivateKey(secp256k1);
      pubkeyCompressedExpected = secp256k1.derivePublicKeyCompressed(privKey);
    }
    nextCycle();
    s.bench('bitcoin-ts', () => {
      pubkeyCompressedBenchmark = secp256k1.derivePublicKeyCompressed(privKey);
    });
    s.bench('elliptic', () => {
      pubkeyCompressedBenchmark = ellipticEc
        .keyFromPrivate(privKey)
        .getPublic()
        .encodeCompressed();
    });
    s.bench('secp256k1-node', () => {
      pubkeyCompressedBenchmark = secp256k1Node.publicKeyCreate(privKey, true);
    });
    s.cycle(() => {
      t.deepEqual(
        pubkeyCompressedExpected,
        new Uint8Array(pubkeyCompressedBenchmark)
      );
      nextCycle();
    });
  });
});

test('bench: secp256k1: create DER Low-S signature', async t => {
  const { ellipticEc, secp256k1 } = await setup();
  await suite(t.title, s => {
    let privKey: Uint8Array;
    let messageHash: Uint8Array;
    let sigDERExpected: Uint8Array;
    let sigDERBenchmark: Uint8Array;
    function nextCycle(): void {
      privKey = getValidPrivateKey(secp256k1);
      messageHash = randomBytes(32);
      sigDERExpected = secp256k1.signMessageHashDER(privKey, messageHash);
    }
    nextCycle();
    s.bench('bitcoin-ts', () => {
      sigDERBenchmark = secp256k1.signMessageHashDER(privKey, messageHash);
    });
    s.bench('elliptic', () => {
      sigDERBenchmark = ellipticEc
        .keyFromPrivate(privKey)
        .sign(messageHash)
        .toDER();
    });
    s.bench('secp256k1-node', () => {
      sigDERBenchmark = secp256k1Node.signatureExport(
        secp256k1Node.sign(messageHash, privKey).signature
      );
    });
    s.cycle(() => {
      /**
       * Since Elliptic doesn't document a way to create Low-S signatures, we
       * normalize the results to validate them. This may overestimate
       * Elliptic's performance slightly.
       */
      t.deepEqual(
        sigDERExpected,
        secp256k1.normalizeSignatureDER(new Uint8Array(sigDERBenchmark))
      );
      nextCycle();
    });
  });
});
