// tslint:disable:no-expression-statement no-let
import { test } from 'ava';
import { crypto } from 'bcoin';
import suite from 'chuhai';
import { createHash, randomBytes } from 'crypto';
import * as hashJs from 'hash.js';
import { instantiateRipemd160 } from './ripemd160';

const ripemd160Promise = instantiateRipemd160();

function ripemd160Bench(inputLength: number): void {
  test(`bench: ripemd160: hash a ${inputLength}-byte input`, async t => {
    const ripemd160 = await ripemd160Promise;
    await suite(t.title, s => {
      let message: Uint8Array;
      let hash: Uint8Array;
      // We let Node.js use the message as a Node.js buffer
      // (may slightly overestimate Node.js native performance)
      let nodeJsBuffer: Buffer;
      function nextCycle(): void {
        message = randomBytes(inputLength);
        nodeJsBuffer = Buffer.from(message);
      }
      nextCycle();
      s.bench('bitcoin-ts', () => {
        hash = ripemd160.hash(message);
      });
      s.bench('hash.js', () => {
        // TODO: remove `as any` when this PR is merged: https://github.com/indutny/hash.js/pull/16
        hash = hashJs
          .ripemd160()
          .update(message)
          .digest() as any;
      });
      s.bench('bcoin', () => {
        hash = crypto.ripemd160(message);
      });
      s.bench('Node.js native', () => {
        hash = createHash('ripemd160')
          .update(nodeJsBuffer)
          .digest();
      });
      s.cycle(() => {
        t.deepEqual(new Uint8Array(hash), ripemd160.hash(message));
        nextCycle();
      });
    });
  });
}

ripemd160Bench(32);
ripemd160Bench(1000);
ripemd160Bench(100000);

test('bench: ripemd160: incrementally hash a 32-MB input', async t => {
  const ripemd160 = await ripemd160Promise;
  await suite(t.title, s => {
    let message: Uint8Array;
    let messageChunks: ReadonlyArray<Uint8Array>;
    let nodeJsChunks: ReadonlyArray<Buffer>;
    let hash: Uint8Array;
    function nextCycle(): void {
      message = randomBytes(32e6);
      const chunkSize = 1e6;
      const chunkCount = Math.ceil(message.length / chunkSize);
      messageChunks = Array.from({ length: chunkCount }).map((_, index) =>
        message.slice(index * chunkSize, index * chunkSize + chunkSize)
      );
      nodeJsChunks = messageChunks.map(chunk => Buffer.from(chunk));
    }
    nextCycle();
    s.bench('bitcoin-ts', () => {
      hash = ripemd160.final(
        messageChunks.reduce(
          (state, chunk) => ripemd160.update(state, chunk),
          ripemd160.init()
        )
      );
    });
    s.bench('hash.js', () => {
      hash = messageChunks
        .reduce((state, chunk) => state.update(chunk), hashJs.ripemd160())
        // TODO: remove `as any` when this PR is merged: https://github.com/indutny/hash.js/pull/16
        .digest() as any;
    });
    s.bench('Node.js native', () => {
      hash = nodeJsChunks
        .reduce((state, chunk) => state.update(chunk), createHash('ripemd160'))
        .digest();
    });
    s.cycle(() => {
      t.deepEqual(new Uint8Array(hash), ripemd160.hash(message));
      nextCycle();
    });
  });
});
