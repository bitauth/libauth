/* eslint-disable functional/no-expression-statement, @typescript-eslint/no-magic-numbers */
import test from 'ava';

import { stringify } from '../lib';

test('stringify', (t) => {
  t.deepEqual(stringify(BigInt(0)), '"<bigint: 0n>"');
  t.deepEqual(stringify({ a: BigInt(0) }), '{\n  "a": "<bigint: 0n>"\n}');
  t.deepEqual(stringify(Uint8Array.of(32, 32)), '"<Uint8Array: 0x2020>"');
  t.deepEqual(
    stringify({ b: Uint8Array.of(32, 32) }),
    '{\n  "b": "<Uint8Array: 0x2020>"\n}'
  );
  t.deepEqual(
    stringify((x: number) => x * 2),
    '"<function: (x) => x * 2>"'
  );
  t.deepEqual(
    stringify({ c: (x: number) => x * 2 }),
    '{\n  "c": "<function: (x) => x * 2>"\n}'
  );
  t.deepEqual(stringify(Symbol('A')), '"<symbol: Symbol(A)>"');
  t.deepEqual(
    stringify({ d: Symbol('A') }),
    '{\n  "d": "<symbol: Symbol(A)>"\n}'
  );
});
