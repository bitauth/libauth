/* eslint-disable functional/no-expression-statement, @typescript-eslint/no-magic-numbers */
import test from 'ava';

import { sortObjectKeys, stringify, stringifyTestVector } from '../lib';

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

test('sortObjectKeys', (t) => {
  t.deepEqual(sortObjectKeys(BigInt(0)), BigInt(0));
  t.deepEqual(sortObjectKeys(Uint8Array.of(32, 32)), Uint8Array.of(32, 32));
  t.deepEqual(
    sortObjectKeys({
      b: { ...{ c: 1 }, a: 2, b: null },
      ...{ a: Uint8Array.of(2), c: Uint8Array.of(3) },
    }),
    { a: Uint8Array.of(2), b: { a: 2, b: null, c: 1 }, c: Uint8Array.of(3) }
  );
  const func = (x: number) => x * 2;
  t.deepEqual(sortObjectKeys(func), func);
  const sym = Symbol('A');
  t.deepEqual(sortObjectKeys(sym), sym);
  t.deepEqual(
    sortObjectKeys([
      3,
      2,
      { b: Uint8Array.of(1), ...{ a: Uint8Array.of(2), c: Uint8Array.of(3) } },
      1,
    ]),
    [3, 2, { a: Uint8Array.of(2), b: Uint8Array.of(1), c: Uint8Array.of(3) }, 1]
  );
});

test('stringifyTestVector', (t) => {
  const one = stringifyTestVector({
    ...{ b: [1, 2, { a: 1, ...{ c: Uint8Array.of(2) }, b: 3 }] },
    a: { a: 1, ...{ c: BigInt(2) }, b: 3 },
  });
  t.deepEqual(
    one,
    `{
  "a": {
    "a": 1,
    "b": 3,
    "c": BigInt('2')
  },
  "b": [
    1,
    2,
    {
      "a": 1,
      "b": 3,
      "c": hexToBin('02')
    }
  ]
}`,
    one
  );
});
