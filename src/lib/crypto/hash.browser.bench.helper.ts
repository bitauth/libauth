/* global window, crypto */
/* eslint-disable functional/no-let, @typescript-eslint/init-declarations, functional/no-expression-statement, functional/no-conditional-statement */
import * as asmCrypto from 'asmcrypto.js';
import suite from 'chuhai';
import * as hashJs from 'hash.js';

import { HashFunction } from '../bin/bin';

import {
  instantiateRipemd160,
  instantiateSha1,
  instantiateSha256,
  instantiateSha512,
} from './crypto';

// eslint-disable-next-line functional/no-return-void
declare const benchError: (error: string) => void;
// eslint-disable-next-line functional/no-return-void
declare const benchComplete: () => void;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isUint8Array = (array: any): array is Uint8Array =>
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  array?.constructor?.name === 'Uint8Array';

const compare = (a?: Uint8Array, b?: Uint8Array) => {
  if (!isUint8Array(a) || !isUint8Array(b) || a.toString() !== b.toString()) {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    benchError(`\nInvalid result: ${a} is not equal to ${b}\n`);
  }
};

const randomBytes = (bytes: number) =>
  crypto.getRandomValues(new Uint8Array(bytes));

const singlePassBrowserBenchmark = async ({
  hashFunction,
  hashFunctionName,
  inputLength,
  subtleCryptoAlgorithmName,
}: {
  hashFunction: HashFunction;
  hashFunctionName: 'ripemd160' | 'sha1' | 'sha256' | 'sha512';
  inputLength: number;
  subtleCryptoAlgorithmName?: 'SHA-1' | 'SHA-256' | 'SHA-512';
}) =>
  suite(
    `browser: ${hashFunctionName}: hash a ${inputLength}-byte input`,
    (s) => {
      let message = randomBytes(inputLength);
      let hash: Uint8Array | null;

      s.cycle(() => {
        if (hash === null) {
          benchError(
            `asmcrypto.js produced a null result given message: ${message.toString()}`
          );
        } else {
          compare(hash, hashFunction.hash(message));
        }
        message = randomBytes(inputLength);
      });

      s.bench('libauth', () => {
        hash = hashFunction.hash(message);
      });

      s.bench('hash.js', () => {
        hash = new Uint8Array(
          hashJs[hashFunctionName]().update(message).digest()
        );
      });

      if (typeof subtleCryptoAlgorithmName === 'string') {
        s.bench(
          'crypto.subtle',
          (deferred) => {
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            window.crypto.subtle
              .digest(subtleCryptoAlgorithmName, message)
              .then((buffer) => {
                hash = new Uint8Array(buffer);
                deferred.resolve();
              });
          },
          {
            defer: true,
          }
        );
        // eslint-disable-next-line @typescript-eslint/naming-convention
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
    }
  );

const mb = 1_000_000;

const incrementalBrowserBenchmark = async ({
  chunkSize,
  hashFunction,
  hashFunctionName,
  totalInput,
}: {
  hashFunction: HashFunction;
  hashFunctionName: 'ripemd160' | 'sha1' | 'sha256' | 'sha512';
  totalInput: number;
  chunkSize: number;
}) =>
  suite(
    `browser: ${hashFunctionName}: incrementally hash a ${
      totalInput / mb
    }MB input in ${chunkSize / mb}MB chunks`,
    (s) => {
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
        if (hash === null) {
          benchError(
            `asmcrypto.js produced a null result given message: ${message.toString()}`
          );
        } else {
          compare(new Uint8Array(hash), hashFunction.hash(message));
        }
        nextCycle();
      });

      s.bench('libauth', () => {
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

      if (hashFunctionName !== 'ripemd160') {
        // eslint-disable-next-line @typescript-eslint/naming-convention
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

const browserBenchmarks = async ({
  hashFunction,
  hashFunctionName,
  subtleCryptoAlgorithmName,
}: {
  hashFunction: HashFunction;
  hashFunctionName: 'ripemd160' | 'sha1' | 'sha256' | 'sha512';
  subtleCryptoAlgorithmName?: 'SHA-1' | 'SHA-256' | 'SHA-512';
}) => {
  /* eslint-disable @typescript-eslint/no-magic-numbers */
  await singlePassBrowserBenchmark({
    hashFunction,
    hashFunctionName,
    inputLength: 32,
    subtleCryptoAlgorithmName,
  });
  await singlePassBrowserBenchmark({
    hashFunction,
    hashFunctionName,
    inputLength: 100,
    subtleCryptoAlgorithmName,
  });
  await singlePassBrowserBenchmark({
    hashFunction,
    hashFunctionName,
    inputLength: 1_000,
    subtleCryptoAlgorithmName,
  });
  await singlePassBrowserBenchmark({
    hashFunction,
    hashFunctionName,
    inputLength: 10_000,
    subtleCryptoAlgorithmName,
  });
  await incrementalBrowserBenchmark({
    chunkSize: mb,
    hashFunction,
    hashFunctionName,
    totalInput: mb * 32,
  });
  /* eslint-enable @typescript-eslint/no-magic-numbers */
};

(async () => {
  const sha1 = await instantiateSha1();
  const sha256 = await instantiateSha256();
  const sha512 = await instantiateSha512();
  const ripemd160 = await instantiateRipemd160();

  await browserBenchmarks({
    hashFunction: sha1,
    hashFunctionName: 'sha1',
    subtleCryptoAlgorithmName: 'SHA-1',
  });
  await browserBenchmarks({
    hashFunction: sha256,
    hashFunctionName: 'sha256',
    subtleCryptoAlgorithmName: 'SHA-256',
  });
  await browserBenchmarks({
    hashFunction: sha512,
    hashFunctionName: 'sha512',
    subtleCryptoAlgorithmName: 'SHA-512',
  });
  await browserBenchmarks({
    hashFunction: ripemd160,
    hashFunctionName: 'ripemd160',
  });

  benchComplete();
})().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
});
