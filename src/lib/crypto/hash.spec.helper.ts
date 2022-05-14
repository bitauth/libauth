/* global Buffer */
/* eslint-disable functional/no-expression-statement, functional/no-return-void */
import { createHash } from 'crypto';
import { readFileSync } from 'fs';
import { join } from 'path';

import test from 'ava';
import bcrypto from 'bcrypto';
import fc from 'fast-check';
import hashJs from 'hash.js';

import type { HashFunction } from '../lib';
import { utf8ToBin } from '../lib.js';

const testLength = 10000;

const maxUint8Number = 255;
const fcUint8Array = (minLength: number, maxLength: number) =>
  fc
    .array(fc.integer({ max: maxUint8Number, min: 0 }), {
      maxLength,
      minLength,
    })
    .map((a) => Uint8Array.from(a));

export const testHashFunction = <T extends HashFunction>({
  abcHash,
  libauthHash,
  getEmbeddedBinary,
  hashFunctionName,
  instantiate,
  instantiateBytes,
  nodeJsAlgorithm,
  testHash,
}: {
  hashFunctionName: string;
  getEmbeddedBinary: () => ArrayBuffer;
  instantiate: () => Promise<T>;
  instantiateBytes: (webassemblyBytes: ArrayBuffer) => Promise<T>;
  abcHash: Uint8Array;
  testHash: Uint8Array;
  libauthHash: Uint8Array;
  nodeJsAlgorithm: 'ripemd160' | 'sha1' | 'sha256' | 'sha512';
}) => {
  const binary = getEmbeddedBinary();
  const bcryptoAlgorithm = nodeJsAlgorithm.toUpperCase() as
    | 'RIPEMD160'
    | 'SHA1'
    | 'SHA256'
    | 'SHA512';

  test(`[crypto] ${hashFunctionName} getEmbeddedBinary returns the proper binary`, (t) => {
    const path = join(
      new URL('.', import.meta.url).pathname,
      '..',
      'bin',
      `${hashFunctionName}`,
      `${hashFunctionName}.wasm`
    );
    const binaryFromDisk = readFileSync(path).buffer;
    t.deepEqual(binary, binaryFromDisk);
  });

  test(`[crypto] ${hashFunctionName} instantiated with embedded binary`, async (t) => {
    const hashFunction = await instantiate();
    t.deepEqual(hashFunction.hash(utf8ToBin('abc')), abcHash);
    t.deepEqual(hashFunction.hash(utf8ToBin('test')), testHash);
    t.deepEqual(hashFunction.hash(utf8ToBin('libauth')), libauthHash);
  });

  test(`[fast-check] [crypto] ${hashFunctionName} instantiated with bytes`, async (t) => {
    const hashFunction = await instantiateBytes(binary);

    const equivalentToNative = fc.property(
      fcUint8Array(0, testLength),
      (message) => {
        const hash = createHash(nodeJsAlgorithm);
        t.deepEqual(
          new Uint8Array(hash.update(Buffer.from(message)).digest()),
          hashFunction.hash(message)
        );
      }
    );

    const equivalentToBcoin = fc.property(
      fcUint8Array(0, testLength),
      (message) => {
        t.deepEqual(
          new Uint8Array(
            bcrypto[bcryptoAlgorithm].digest(Buffer.from(message))
          ),
          hashFunction.hash(message)
        );
      }
    );

    const equivalentToHashJs = fc.property(
      fcUint8Array(0, testLength),
      (message) => {
        t.deepEqual(
          new Uint8Array(hashJs[nodeJsAlgorithm]().update(message).digest()),
          hashFunction.hash(message)
        );
      }
    );
    t.notThrows(() => {
      fc.assert(equivalentToNative);
      fc.assert(equivalentToBcoin);
      fc.assert(equivalentToHashJs);
    });
  });

  test(`[crypto] ${hashFunctionName} incremental hashing`, async (t) => {
    const hashFunction = await instantiate();
    t.deepEqual(
      hashFunction.final(
        hashFunction.update(
          hashFunction.update(
            hashFunction.update(hashFunction.init(), utf8ToBin('a')),
            utf8ToBin('b')
          ),
          utf8ToBin('c')
        )
      ),
      abcHash
    );
    t.deepEqual(
      hashFunction.final(
        hashFunction.update(hashFunction.init(), utf8ToBin('test'))
      ),
      testHash
    );
    t.deepEqual(
      hashFunction.final(
        hashFunction.update(
          hashFunction.update(hashFunction.init(), utf8ToBin('lib')),
          utf8ToBin('auth')
        )
      ),
      libauthHash
    );

    const equivalentToSinglePass = fc.property(
      fcUint8Array(1, testLength),
      fc.integer({ max: testLength, min: 1 }),
      (message, chunkSize) => {
        const chunkCount = Math.ceil(message.length / chunkSize);
        const chunks = Array.from({ length: chunkCount })
          .map((_, index) => index * chunkSize)
          .map((startIndex) =>
            message.slice(startIndex, startIndex + chunkSize)
          );
        const incrementalResult = hashFunction.final(
          chunks.reduce(
            (state, chunk) => hashFunction.update(state, chunk),
            hashFunction.init()
          )
        );
        const singlePassResult = hashFunction.hash(message);
        t.deepEqual(incrementalResult, singlePassResult);
      }
    );
    t.notThrows(() => {
      fc.assert(equivalentToSinglePass);
    });
  });
};
