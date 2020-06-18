/* global Buffer */
/* eslint-disable functional/no-expression-statement */
import { createHash } from 'crypto';
import { readFileSync } from 'fs';
import { join } from 'path';

import test from 'ava';
import * as bcrypto from 'bcrypto';
import * as fc from 'fast-check';
import * as hashJs from 'hash.js';

import { HashFunction } from '../bin/bin';

const testLength = 10000;

const stringToCharsUint8Array = (str: string) =>
  new Uint8Array([...str].map((c) => c.charCodeAt(0)));

const maxUint8Number = 255;
const fcUint8Array = (minLength: number, maxLength: number) =>
  fc
    .array(fc.integer(0, maxUint8Number), minLength, maxLength)
    .map((a) => Uint8Array.from(a));

export const testHashFunction = <T extends HashFunction>({
  abcHash,
  bitcoinTsHash,
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
  bitcoinTsHash: Uint8Array;
  nodeJsAlgorithm: 'ripemd160' | 'sha256' | 'sha512' | 'sha1';
}) => {
  const binary = getEmbeddedBinary();
  const bcryptoAlgorithm = nodeJsAlgorithm.toUpperCase() as
    | 'RIPEMD160'
    | 'SHA256'
    | 'SHA512'
    | 'SHA1';

  test(`[crypto] ${hashFunctionName} getEmbeddedBinary returns the proper binary`, (t) => {
    const path = join(
      __dirname,
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
    t.deepEqual(hashFunction.hash(stringToCharsUint8Array('abc')), abcHash);
    t.deepEqual(hashFunction.hash(stringToCharsUint8Array('test')), testHash);
    t.deepEqual(
      hashFunction.hash(stringToCharsUint8Array('bitcoin-ts')),
      bitcoinTsHash
    );
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
            hashFunction.update(
              hashFunction.init(),
              stringToCharsUint8Array('a')
            ),
            stringToCharsUint8Array('b')
          ),
          stringToCharsUint8Array('c')
        )
      ),
      abcHash
    );
    t.deepEqual(
      hashFunction.final(
        hashFunction.update(
          hashFunction.init(),
          stringToCharsUint8Array('test')
        )
      ),
      testHash
    );
    t.deepEqual(
      hashFunction.final(
        hashFunction.update(
          hashFunction.update(
            hashFunction.init(),
            stringToCharsUint8Array('bitcoin')
          ),
          stringToCharsUint8Array('-ts')
        )
      ),
      bitcoinTsHash
    );

    const equivalentToSinglePass = fc.property(
      fcUint8Array(1, testLength),
      fc.integer(1, testLength),
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
