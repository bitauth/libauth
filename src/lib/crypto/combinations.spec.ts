import test from 'ava';

import { hash160, hash256, hexToBin, utf8ToBin } from '../lib.js';

test('hash160', (t) => {
  t.deepEqual(
    hash160(hexToBin('')),
    hexToBin('b472a266d0bd89c13706a4132ccfb16f7c3b9fcb'),
  );
  t.deepEqual(
    hash160(utf8ToBin('abc')),
    hexToBin('bb1be98c142444d7a56aa3981c3942a978e4dc33'),
  );
});

test('hash256', (t) => {
  t.deepEqual(
    hash256(hexToBin('')),
    hexToBin(
      '5df6e0e2761359d30a8275058e299fcc0381534545f55cf43e41983f5d4c9456',
    ),
  );
  t.deepEqual(
    hash256(utf8ToBin('abc')),
    hexToBin(
      '4f8b42c22dd3729b519ba6f68d2da7cc5b2d606d05daed5ad5128cc03e6c6358',
    ),
  );
});
