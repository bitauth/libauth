// tslint:disable:no-expression-statement
import { test } from 'ava';
import { crypto } from 'bcoin';
import { createHash } from 'crypto';
import * as fc from 'fast-check';
import { readFileSync } from 'fs';
import * as hashJs from 'hash.js';
import { join } from 'path';
import {
  getEmbeddedRipemd160Binary,
  instantiateRipemd160,
  instantiateRipemd160Bytes
} from './ripemd160';

const stringToCharsUint8Array = (str: string) =>
  new Uint8Array([...str].map(c => c.charCodeAt(0)));

// fast-check helper
const fcUint8Array = (minLength: number, maxLength: number) =>
  fc
    .array(fc.integer(0, 255), minLength, maxLength)
    .map(a => Uint8Array.from(a));

// 'abc' -> '8eb208f7e05d987a9b044a8e98c6b087f15a0bfc'
// prettier-ignore
const abcHash = new Uint8Array([142, 178, 8, 247, 224, 93, 152, 122, 155, 4, 74, 142, 152, 198, 176, 135, 241, 90, 11, 252]);

// 'test' -> '5e52fee47e6b070565f74372468cdc699de89107'
// prettier-ignore
const testHash = new Uint8Array([94, 82, 254, 228, 126, 107, 7, 5, 101, 247, 67, 114, 70, 140, 220, 105, 157, 232, 145, 7]);

// 'bitcoin-ts' -> '7217be7f5d75391d4d1be94bda6679d52d65d2c7'
// prettier-ignore
const bitcoinTsHash = new Uint8Array([114, 23, 190, 127, 93, 117, 57, 29, 77, 27, 233, 75, 218, 102, 121, 213, 45, 101, 210, 199]);

const binary = getEmbeddedRipemd160Binary();

test('getEmbeddedRipemd160Binary returns the proper binary', t => {
  const path = join(__dirname, '..', 'bin', 'ripemd160', 'ripemd160.wasm');
  const binaryFromDisk = readFileSync(path).buffer;
  t.deepEqual(binary, binaryFromDisk);
});

test('Ripemd160 instantiated with embedded binary', async t => {
  const ripemd160 = await instantiateRipemd160();
  t.deepEqual(ripemd160.hash(stringToCharsUint8Array('abc')), abcHash);
  t.deepEqual(ripemd160.hash(stringToCharsUint8Array('test')), testHash);
  t.deepEqual(
    ripemd160.hash(stringToCharsUint8Array('bitcoin-ts')),
    bitcoinTsHash
  );
});

const testLength = 10000;

test('Ripemd160 instantiated with bytes', async t => {
  const ripemd160 = await instantiateRipemd160Bytes(binary);

  const equivalentToNative = fc.property(
    fcUint8Array(0, testLength),
    message => {
      const hash = createHash('ripemd160');
      t.deepEqual(
        new Uint8Array(hash.update(Buffer.from(message)).digest()),
        ripemd160.hash(message)
      );
    }
  );
  t.notThrows(() => fc.assert(equivalentToNative));
  const equivalentToBcoin = fc.property(
    fcUint8Array(0, testLength),
    message => {
      t.deepEqual(
        new Uint8Array(crypto.ripemd160(message)),
        ripemd160.hash(message)
      );
    }
  );
  t.notThrows(() => fc.assert(equivalentToBcoin));
  const equivalentToHashJs = fc.property(
    fcUint8Array(0, testLength),
    message => {
      t.deepEqual(
        new Uint8Array(hashJs
          .ripemd160()
          .update(message)
          // TODO: remove `as any` when this PR is merged: https://github.com/indutny/hash.js/pull/16
          .digest() as any),
        ripemd160.hash(message)
      );
    }
  );
  t.notThrows(() => fc.assert(equivalentToHashJs));
});

test('Ripemd160 incremental hashing', async t => {
  const ripemd160 = await instantiateRipemd160();
  t.deepEqual(
    ripemd160.final(
      ripemd160.update(
        ripemd160.update(
          ripemd160.update(ripemd160.init(), stringToCharsUint8Array('a')),
          stringToCharsUint8Array('b')
        ),
        stringToCharsUint8Array('c')
      )
    ),
    abcHash
  );
  t.deepEqual(
    ripemd160.final(
      ripemd160.update(ripemd160.init(), stringToCharsUint8Array('test'))
    ),
    testHash
  );
  t.deepEqual(
    ripemd160.final(
      ripemd160.update(
        ripemd160.update(ripemd160.init(), stringToCharsUint8Array('bitcoin')),
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
      const chunks = Array.from({ length: chunkCount }).map((_, index) =>
        message.slice(index * chunkSize, index * chunkSize + chunkSize)
      );
      const incrementalResult = ripemd160.final(
        chunks.reduce(
          (state, chunk) => ripemd160.update(state, chunk),
          ripemd160.init()
        )
      );
      const singlePassResult = ripemd160.hash(message);
      t.deepEqual(incrementalResult, singlePassResult);
    }
  );
  t.notThrows(() => fc.assert(equivalentToSinglePass));
});
