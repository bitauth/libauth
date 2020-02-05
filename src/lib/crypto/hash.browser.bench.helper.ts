// tslint:disable:no-expression-statement no-unsafe-any
/* global window, crypto */
/* eslint-disable functional/no-let, init-declarations */
import * as asmCrypto from 'asmcrypto.js';
import suite from 'chuhai';
import * as hashJs from 'hash.js';

import { HashFunction } from '../bin/bin';

import {
  instantiateRipemd160,
  instantiateSha1,
  instantiateSha256,
  instantiateSha512
} from './crypto';

declare const benchError: (error: string) => void;
declare const benchComplete: () => void;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isUint8Array = (array: any): array is Uint8Array =>
  array && array.constructor.name === 'Uint8Array';

const compare = (a?: Uint8Array, b?: Uint8Array) => {
  // tslint:disable-next-line:no-if-statement
  if (!isUint8Array(a) || !isUint8Array(b) || a.toString() !== b.toString()) {
    benchError(`
  Invalid result: ${a} is not equal to ${b}
  `);
  }
};

const randomBytes = (bytes: number) =>
  crypto.getRandomValues(new Uint8Array(bytes));

const singlePassBrowserBenchmark = async (
  hashFunction: HashFunction,
  hashFunctionName: 'ripemd160' | 'sha1' | 'sha256' | 'sha512',
  inputLength: number,
  subtleCryptoAlgorithmName?: 'SHA-1' | 'SHA-256' | 'SHA-512'
) =>
  suite(`browser: ${hashFunctionName}: hash a ${inputLength}-byte input`, s => {
    // tslint:disable:no-let prefer-const
    let message = randomBytes(inputLength);
    let hash: Uint8Array | null;

    s.cycle(() => {
      // tslint:disable-next-line:no-if-statement strict-boolean-expressions
      if (hash) {
        compare(hash, hashFunction.hash(message));
      } else {
        benchError(
          `asmcrypto.js produced a null result given message: ${message}`
        );
      }
      message = randomBytes(inputLength);
    });

    s.bench('bitcoin-ts', () => {
      hash = hashFunction.hash(message);
    });

    s.bench('hash.js', () => {
      hash = new Uint8Array(
        hashJs[hashFunctionName]()
          .update(message)
          .digest()
      );
    });

    // tslint:disable-next-line:no-if-statement
    if (subtleCryptoAlgorithmName) {
      s.bench(
        'crypto.subtle',
        deferred => {
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          window.crypto.subtle
            .digest(subtleCryptoAlgorithmName, message)
            .then(buffer => {
              hash = new Uint8Array(buffer);
              deferred.resolve();
            });
        },
        {
          defer: true
        }
      );
      const Algorithm =
        subtleCryptoAlgorithmName === 'SHA-1'
          ? asmCrypto.Sha1
          : subtleCryptoAlgorithmName === 'SHA-256'
          ? asmCrypto.Sha256
          : asmCrypto.Sha512;
      s.bench('asmcrypto.js', () => {
        const instance = new Algorithm();
        hash = instance.process(message).finish().result;
      });
    }
  });

const MB = 1_000_000;

const incrementalBrowserBenchmark = async (
  hashFunction: HashFunction,
  hashFunctionName: 'ripemd160' | 'sha1' | 'sha256' | 'sha512',
  totalInput: number,
  chunkSize: number
) =>
  suite(
    `browser: ${hashFunctionName}: incrementally hash a ${totalInput /
      MB}MB input in ${chunkSize / MB}MB chunks`,
    s => {
      let message: Uint8Array;
      let messageChunks: readonly Uint8Array[];
      let hash: Uint8Array | ArrayBuffer | readonly number[] | null;

      const nextCycle = () => {
        /**
         * We can't get this much entropy, so we just use 0s here.
         */
        message = new Uint8Array(totalInput).fill(0);
        const chunkCount = Math.ceil(message.length / chunkSize);
        messageChunks = Array.from({ length: chunkCount }).map((_, index) =>
          message.slice(index * chunkSize, index * chunkSize + chunkSize)
        );
      };
      nextCycle();

      s.cycle(() => {
        // tslint:disable-next-line:no-if-statement strict-boolean-expressions
        if (hash) {
          compare(new Uint8Array(hash), hashFunction.hash(message));
        } else {
          benchError(
            `asmcrypto.js produced a null result given message: ${message}`
          );
        }
        nextCycle();
      });

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
            hashJs[hashFunctionName]()
          )
          .digest();
      });

      // tslint:disable-next-line:no-if-statement
      if (hashFunctionName !== 'ripemd160') {
        const Algorithm =
          hashFunctionName === 'sha1'
            ? asmCrypto.Sha1
            : hashFunctionName === 'sha256'
            ? asmCrypto.Sha256
            : asmCrypto.Sha512;
        s.bench('asmcrypto.js', () => {
          const instance = new Algorithm();
          hash = instance.process(message).finish().result;
        });
      }
    }
  );

const browserBenchmarks = async (
  func: HashFunction,
  name: 'ripemd160' | 'sha1' | 'sha256' | 'sha512',
  subtle?: 'SHA-1' | 'SHA-256' | 'SHA-512'
) => {
  // tslint:disable:no-magic-numbers
  await singlePassBrowserBenchmark(func, name, 32, subtle);
  await singlePassBrowserBenchmark(func, name, 100, subtle);
  await singlePassBrowserBenchmark(func, name, 1_000, subtle);
  await singlePassBrowserBenchmark(func, name, 10_000, subtle);

  await incrementalBrowserBenchmark(func, name, MB * 32, MB);
};

(async () => {
  const sha1 = await instantiateSha1();
  const sha256 = await instantiateSha256();
  const sha512 = await instantiateSha512();
  const ripemd160 = await instantiateRipemd160();

  await browserBenchmarks(sha1, 'sha1', 'SHA-1');
  await browserBenchmarks(sha256, 'sha256', 'SHA-256');
  await browserBenchmarks(sha512, 'sha512', 'SHA-512');
  await browserBenchmarks(ripemd160, 'ripemd160');

  benchComplete();
})().catch(err => {
  // eslint-disable-next-line no-console
  console.error(err);
});
