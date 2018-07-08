// tslint:disable:no-expression-statement no-let
import { test } from 'ava';
import * as bcrypto from 'bcrypto';
import suite from 'chuhai';
import { createHash, randomBytes } from 'crypto';
import * as hashJs from 'hash.js';
import { HashFunction } from '../bin/bin';

export const benchmarkHashingFunction = <T extends HashFunction>(
  hashFunctionName: string,
  hashFunctionPromise: Promise<T>,
  nodeJsAlgorithm: 'ripemd160' | 'sha256' | 'sha512' | 'sha1'
) => {
  const singlePassBench = (inputLength: number) => {
    test(`bench: ${hashFunctionName}: hash a ${inputLength}-byte input`, async t => {
      const hashFunction = await hashFunctionPromise;
      await suite(t.title, s => {
        let message: Uint8Array;
        let hash: Uint8Array;
        // we let Node.js use the message as a Node.js buffer
        // (may slightly overestimate Node.js native performance)
        let nodeJsBuffer: Buffer;
        const nextCycle = () => {
          message = randomBytes(inputLength);
          nodeJsBuffer = Buffer.from(message);
        };
        nextCycle();
        s.bench('bitcoin-ts', () => {
          hash = hashFunction.hash(message);
        });
        s.bench('hash.js', () => {
          // TODO: remove `as any` when this PR is merged: https://github.com/indutny/hash.js/pull/16
          hash = hashJs[nodeJsAlgorithm]()
            .update(message)
            // tslint:disable-next-line:no-any
            .digest() as any;
        });
        s.bench('bcoin', () => {
          // tslint:disable-next-line:no-unsafe-any
          hash = bcrypto[nodeJsAlgorithm](message);
        });
        s.bench('Node.js native', () => {
          hash = createHash(nodeJsAlgorithm)
            .update(nodeJsBuffer)
            .digest();
        });
        s.cycle(() => {
          t.deepEqual(new Uint8Array(hash), hashFunction.hash(message));
          nextCycle();
        });
      });
    });
  };

  const MB = 1e6;

  const incrementalBench = (totalInput: number, chunkSize: number) => {
    test(`bench: ${hashFunctionName}: incrementally hash a ${totalInput /
      MB}MB input in ${chunkSize / MB}MB chunks`, async t => {
      const hashFunction = await hashFunctionPromise;
      await suite(t.title, s => {
        let message: Uint8Array;
        let messageChunks: ReadonlyArray<Uint8Array>;
        let nodeJsChunks: ReadonlyArray<Buffer>;
        let hash: Uint8Array;
        const nextCycle = () => {
          message = randomBytes(totalInput);
          const chunkCount = Math.ceil(message.length / chunkSize);
          messageChunks = Array.from({ length: chunkCount }).map((_, index) =>
            message.slice(index * chunkSize, index * chunkSize + chunkSize)
          );
          nodeJsChunks = messageChunks.map(chunk => Buffer.from(chunk));
        };
        nextCycle();
        s.bench('bitcoin-ts', () => {
          hash = hashFunction.final(
            messageChunks.reduce(
              (state, chunk) => hashFunction.update(state, chunk),
              hashFunction.init()
            )
          );
        });
        s.bench('hash.js', () => {
          hash = messageChunks
            .reduce(
              (state, chunk) => state.update(chunk),
              hashJs[nodeJsAlgorithm]()
            )
            // TODO: remove `as any` when this PR is merged: https://github.com/indutny/hash.js/pull/16
            // tslint:disable-next-line:no-any
            .digest() as any;
        });
        s.bench('Node.js native', () => {
          hash = nodeJsChunks
            .reduce(
              (state, chunk) => state.update(chunk),
              createHash(nodeJsAlgorithm)
            )
            .digest();
        });
        s.cycle(() => {
          t.deepEqual(new Uint8Array(hash), hashFunction.hash(message));
          nextCycle();
        });
      });
    });
  };

  // tslint:disable:no-magic-numbers
  singlePassBench(32);
  singlePassBench(100);
  singlePassBench(1000);
  singlePassBench(10000);

  incrementalBench(MB * 32, MB);
  // tslint:disable:no-magic-numbers
};
