import { createHmac } from 'crypto';

import test from 'ava';

import {
  binToHex,
  hexToBin,
  hmacSha256,
  hmacSha512,
  sha256,
  sha512,
} from '../lib.js';

import { fc, testProp } from '@fast-check/ava';

const vectors = test.macro<
  [{ secret: string; message: string; sha256: string; sha512: string }]
>({
  exec: (t, vector) => {
    t.deepEqual(
      hmacSha256(hexToBin(vector.secret), hexToBin(vector.message), sha256),
      hexToBin(vector.sha256),
    );
    t.deepEqual(
      hmacSha512(hexToBin(vector.secret), hexToBin(vector.message), sha512),
      hexToBin(vector.sha512),
    );
  },
  title: (title) => `[crypto] HMAC Test Vector #${title ?? '?'} (RFC 4231)`,
});

test('1', vectors, {
  message: '4869205468657265',
  secret: '0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b',
  sha256: 'b0344c61d8db38535ca8afceaf0bf12b881dc200c9833da726e9376c2e32cff7',
  sha512:
    '87aa7cdea5ef619d4ff0b4241a1d6cb02379f4e2ce4ec2787ad0b30545e17cdedaa833b7d6b8a702038b274eaea3f4e4be9d914eeb61f1702e696c203a126854',
});

test('2', vectors, {
  message: '7768617420646f2079612077616e7420666f72206e6f7468696e673f',
  secret: '4a656665',
  sha256: '5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843',
  sha512:
    '164b7a7bfcf819e2e395fbe73b56e0a387bd64222e831fd610270cd7ea2505549758bf75c05a994a6d034f65f8f0e6fdcaeab1a34d4a6b4b636e070a38bce737',
});

test('3', vectors, {
  message: '7768617420646f2079612077616e7420666f72206e6f7468696e673f',
  secret: '4a656665',
  sha256: '5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843',
  sha512:
    '164b7a7bfcf819e2e395fbe73b56e0a387bd64222e831fd610270cd7ea2505549758bf75c05a994a6d034f65f8f0e6fdcaeab1a34d4a6b4b636e070a38bce737',
});

test('4', vectors, {
  message:
    'cdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcd',
  secret: '0102030405060708090a0b0c0d0e0f10111213141516171819',
  sha256: '82558a389a443c0ea4cc819899f2083a85f0faa3e578f8077a2e3ff46729665b',
  sha512:
    'b0ba465637458c6990e5a8c5f61d4af7e576d97ff94b872de76f8050361ee3dba91ca5c11aa25eb4d679275cc5788063a5f19741120c4f2de2adebeb10a298dd',
});

test('5', vectors, {
  message: '546573742057697468205472756e636174696f6e',
  secret: '0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c',
  sha256: 'a3b6167473100ee06e0c796c2955552bfa6f7c0a6a8aef8b93f860aab0cd20c5',
  sha512:
    '415fad6271580a531d4179bc891d87a650188707922a4fbb36663a1eb16da008711c5b50ddd0fc235084eb9d3364a1454fb2ef67cd1d29fe6773068ea266e96b',
});

test('6', vectors, {
  message:
    '54657374205573696e67204c6172676572205468616e20426c6f636b2d53697a65204b6579202d2048617368204b6579204669727374',
  secret:
    'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  sha256: '60e431591ee0b67f0d8a26aacbf5b77f8e0bc6213728c5140546040f0ee37f54',
  sha512:
    '80b24263c7c1a3ebb71493c1dd7be8b49b46d1f41b4aeec1121b013783f8f3526b56d037e05f2598bd0fd2215d6a1e5295e64f73f63f0aec8b915a985d786598',
});

test('7', vectors, {
  message:
    '5468697320697320612074657374207573696e672061206c6172676572207468616e20626c6f636b2d73697a65206b657920616e642061206c6172676572207468616e20626c6f636b2d73697a6520646174612e20546865206b6579206e6565647320746f20626520686173686564206265666f7265206265696e6720757365642062792074686520484d414320616c676f726974686d2e',
  secret:
    'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  sha256: '9b09ffa71b942fcb27635fbcd5b0e944bfdc63644f0713938a7f51535c3a35e2',
  sha512:
    'e37b6a775dc87dbaa4dfa9f96e5e3ffddebd71f8867289865df5a32d20cdc944b6022cac3c4982b10d5eeb55c3e4de15134676fb6de0446065c97440fa8c6a58',
});

testProp(
  '[fast-check] [crypto] hmacSha256 is equivalent to Node.js native HMAC-SHA256',
  [
    fc.uint8Array({ maxLength: 100, minLength: 1 }),
    fc.uint8Array({ maxLength: 100, minLength: 1 }),
  ],
  (t, secret, message) => {
    t.deepEqual(
      binToHex(hmacSha256(secret, message)),
      createHmac('sha256', secret).update(message).digest('hex'),
    );
  },
);

testProp(
  '[fast-check] [crypto] hmacSha512 is equivalent to Node.js native HMAC-SHA512',
  [
    fc.uint8Array({ maxLength: 100, minLength: 0 }),
    fc.uint8Array({ maxLength: 100, minLength: 0 }),
  ],
  (t, secret, message) => {
    t.deepEqual(
      binToHex(hmacSha512(secret, message)),
      createHmac('sha512', secret).update(message).digest('hex'),
    );
  },
);
