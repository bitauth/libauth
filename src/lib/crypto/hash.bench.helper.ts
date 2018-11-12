// tslint:disable:no-expression-statement no-let no-unsafe-any
import * as asmCrypto from 'asmcrypto.js';
import test from 'ava';
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
  const singlePassNodeBenchmark = (inputLength: number) => {
    const bcryptoAlgorithm = nodeJsAlgorithm.toUpperCase() as
      | 'RIPEMD160'
      | 'SHA256'
      | 'SHA512'
      | 'SHA1';
    test(`node: ${hashFunctionName}: hash a ${inputLength}-byte input`, async t => {
      const hashFunction = await hashFunctionPromise;
      await suite(t.title, s => {
        let message: Uint8Array;
        let hash: Uint8Array | ReadonlyArray<number> | null;
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
          hash = hashJs[nodeJsAlgorithm]()
            .update(message)
            .digest();
        });
        s.bench('bcoin', () => {
          hash = bcrypto[bcryptoAlgorithm].digest(Buffer.from(message));
        });
        s.bench('node.js native', () => {
          hash = createHash(nodeJsAlgorithm)
            .update(nodeJsBuffer)
            .digest();
        });
        // tslint:disable-next-line:no-if-statement
        if (nodeJsAlgorithm !== 'ripemd160') {
          const algorithm =
            nodeJsAlgorithm === 'sha1'
              ? asmCrypto.Sha1
              : nodeJsAlgorithm === 'sha256'
              ? asmCrypto.Sha256
              : asmCrypto.Sha512;
          s.bench('asmcrypto.js', () => {
            const instance = new algorithm();
            hash = instance.process(message).finish().result;
          });
        }
        s.cycle(() => {
          // tslint:disable-next-line:no-if-statement
          if (hash === null) {
            t.fail(
              `asmcrypto.js failed to produce a hash for message: ${message}`
            );
          } else {
            t.deepEqual(new Uint8Array(hash), hashFunction.hash(message));
            nextCycle();
          }
        });
      });
    });
  };

  const MB = 1_000_000;

  const incrementalNodeBenchmark = (totalInput: number, chunkSize: number) => {
    test(`node: ${hashFunctionName}: incrementally hash a ${totalInput /
      MB}MB input in ${chunkSize / MB}MB chunks`, async t => {
      const hashFunction = await hashFunctionPromise;
      await suite(t.title, s => {
        let message: Uint8Array;
        let messageChunks: ReadonlyArray<Uint8Array>;
        let nodeJsChunks: ReadonlyArray<Buffer>;
        let hash: Uint8Array | ReadonlyArray<number> | null;
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
            .digest();
        });
        s.bench('node.js native', () => {
          hash = nodeJsChunks
            .reduce(
              (state, chunk) => state.update(chunk),
              createHash(nodeJsAlgorithm)
            )
            .digest();
        });
        // tslint:disable-next-line:no-if-statement
        if (nodeJsAlgorithm !== 'ripemd160') {
          const algorithm =
            nodeJsAlgorithm === 'sha1'
              ? asmCrypto.Sha1
              : nodeJsAlgorithm === 'sha256'
              ? asmCrypto.Sha256
              : asmCrypto.Sha512;
          s.bench('asmcrypto.js', () => {
            const instance = new algorithm();
            hash = instance.process(message).finish().result;
          });
        }
        s.cycle(() => {
          // tslint:disable-next-line:no-if-statement
          if (hash === null) {
            t.fail(
              `asmcrypto.js failed to produce a hash for message: ${message}`
            );
          } else {
            t.deepEqual(new Uint8Array(hash), hashFunction.hash(message));
            nextCycle();
          }
        });
      });
    });
  };

  // tslint:disable:no-magic-numbers
  singlePassNodeBenchmark(32);
  singlePassNodeBenchmark(100);
  singlePassNodeBenchmark(1_000);
  singlePassNodeBenchmark(10_000);

  incrementalNodeBenchmark(MB * 32, MB);
  // tslint:disable:no-magic-numbers
};
