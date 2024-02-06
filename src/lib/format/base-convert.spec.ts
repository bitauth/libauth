import test from 'ava';

import type { BaseConverter } from '../lib.js';
import {
  base58ToBin,
  BaseConversionError,
  binToBase58,
  createBaseConverter,
  hexToBin,
  range,
  utf8ToBin,
} from '../lib.js';

// eslint-disable-next-line import/no-restricted-paths, import/no-internal-modules
import base58Json from './fixtures/base58_encode_decode.json' assert { type: 'json' };

import { fc, testProp } from '@fast-check/ava';

const base58Vectors = Object.values(base58Json).filter(
  (item) => Array.isArray(item) && item.every((x) => typeof x === 'string'),
);

const base2 = createBaseConverter('01') as BaseConverter;

const base2Vector = test.macro<[string, Uint8Array]>({
  exec: (t, string, bin) => {
    t.deepEqual(base2.decode(string), bin);
    t.deepEqual(base2.encode(bin), string);
  },
  title: (_, string) => `createBaseConverter - base2: ${string}`,
});

test(base2Vector, '', Uint8Array.of());
test(base2Vector, '0', Uint8Array.of(0));
test(base2Vector, '00', Uint8Array.of(0, 0));
test(base2Vector, '001', Uint8Array.of(0, 0, 1));
test(base2Vector, '0010', Uint8Array.of(0, 0, 2));
test(base2Vector, '001111', Uint8Array.of(0, 0, 15));
test(base2Vector, '0011111111', Uint8Array.of(0, 0, 255));
test(base2Vector, '111111111111', Uint8Array.of(15, 255));
test(
  base2Vector,
  '11111111000000001111111100000000',
  Uint8Array.of(255, 0, 255, 0),
);

const base16 = createBaseConverter('0123456789abcdef') as BaseConverter;

const base16Vector = test.macro<[string, Uint8Array]>({
  exec: (t, string, bin) => {
    t.deepEqual(base16.decode(string), bin);
    t.deepEqual(base16.encode(bin), string);
  },
  title: (_, string) => `createBaseConverter - base16: ${string}`,
});

test(base16Vector, '', Uint8Array.of());
test(base16Vector, '0', Uint8Array.of(0));
test(base16Vector, '000f', Uint8Array.of(0, 0, 0, 15));
test(base16Vector, '0fff', Uint8Array.of(0, 15, 255));
test(base16Vector, 'ffff', Uint8Array.of(255, 255));

const base58Vector = test.macro<[string, Uint8Array]>({
  exec: (t, string, bin) => {
    t.deepEqual(base58ToBin(string), bin);
    t.deepEqual(binToBase58(bin), string);
  },
  title: (_, string) => `base58ToBin - binToBase58: ${string}`,
});

test(base58Vector, '', Uint8Array.of());
test(base58Vector, '1', Uint8Array.of(0));
test(base58Vector, '1111', Uint8Array.of(0, 0, 0, 0));
test(base58Vector, '2g', utf8ToBin('a'));
test(base58Vector, 'a3gV', utf8ToBin('bbb'));
test(base58Vector, 'aPEr', utf8ToBin('ccc'));
test(
  base58Vector,
  '1NS17iag9jJgTHD1VXjvLCEnZuQ3rJDE9L',
  hexToBin('00eb15231dfceb60925886b67d065299925915aeb172c06647'),
);

test('createBaseConverter: alphabet too long', (t) => {
  t.deepEqual(
    createBaseConverter(
      range(255)
        .map((i) => String.fromCharCode(i))
        .join(''),
    ),
    BaseConversionError.tooLong,
  );
});

test('createBaseConverter: ambiguous character in alphabet', (t) => {
  t.deepEqual(
    createBaseConverter('00'),
    BaseConversionError.ambiguousCharacter,
  );
});

test('base58ToBin: unknown character', (t) => {
  t.deepEqual(base58ToBin('#'), BaseConversionError.unknownCharacter);
});

testProp(
  '[fast-check] base2.encode <-> base2.encode',
  [fc.uint8Array({ maxLength: 100, minLength: 0 })],
  (t, input) =>
    t.deepEqual(
      base2.encode(base2.decode(base2.encode(input)) as Uint8Array),
      base2.encode(input),
    ),
);

testProp(
  '[fast-check] base16.encode <-> base16.encode',
  [fc.uint8Array({ maxLength: 100, minLength: 0 })],
  (t, input) =>
    t.deepEqual(
      base16.encode(base16.decode(base16.encode(input)) as Uint8Array),
      base16.encode(input),
    ),
);

const base26 = createBaseConverter(
  // cspell: disable-next-line
  'abcdefghijklmnopqrstuvwxyz',
) as BaseConverter;

testProp(
  '[fast-check] base26.encode <-> base26.encode',
  [fc.uint8Array({ maxLength: 100, minLength: 0 })],
  (t, input) =>
    t.deepEqual(
      base26.encode(base26.decode(base26.encode(input)) as Uint8Array),
      base26.encode(input),
    ),
);

const base42 = createBaseConverter(
  '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghi',
) as BaseConverter;

testProp(
  '[fast-check] base42.encode <-> base42.encode',
  [fc.uint8Array({ maxLength: 100, minLength: 0 })],
  (t, input) =>
    t.deepEqual(
      base42.encode(base42.decode(base42.encode(input)) as Uint8Array),
      base42.encode(input),
    ),
);

testProp(
  '[fast-check] binToBase58 <-> base58ToBin',
  [fc.uint8Array({ maxLength: 100, minLength: 0 })],
  (t, input) =>
    t.deepEqual(
      binToBase58(base58ToBin(binToBase58(input)) as Uint8Array),
      binToBase58(input),
    ),
);

test('base58 Test Vectors', (t) => {
  t.truthy(base58Vectors);
  // eslint-disable-next-line functional/no-loop-statements
  for (const [binHex, base58] of base58Vectors) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    t.deepEqual(base58ToBin(base58!) as Uint8Array, hexToBin(binHex!));
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    t.deepEqual(binToBase58(hexToBin(binHex!)), base58);
  }
});
