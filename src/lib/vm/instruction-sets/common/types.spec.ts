import test from 'ava';

import {
  bigIntToVmNumber,
  binToHex,
  booleanToVmNumber,
  decodeVmNumber,
  hexToBin,
  stackItemIsTruthy,
  VmNumberError,
} from '../../../lib.js';

// Derived from https://github.com/bitcoinjs/bitcoinjs-lib
const minimallyEncodedVmNumbers: readonly [string, bigint][] = [
  /* spell-checker:disable */
  ['', BigInt(0)],
  ['01', BigInt(1)],
  ['02', BigInt(2)],
  ['03', BigInt(3)],
  ['7e', BigInt(126)],
  ['7f', BigInt(127)],
  ['8000', BigInt(128)],
  ['8100', BigInt(129)],
  ['8200', BigInt(130)],
  ['ff00', BigInt(255)],
  ['fe7f', BigInt(32766)],
  ['ff7f', BigInt(32767)],
  ['008000', BigInt(32768)],
  ['018000', BigInt(32769)],
  ['028000', BigInt(32770)],
  ['ffff00', BigInt(65535)],
  ['ffffff00', BigInt(16777215)],
  ['feff7f', BigInt(8388606)],
  ['ffff7f', BigInt(8388607)],
  ['00008000', BigInt(8388608)],
  ['01008000', BigInt(8388609)],
  ['02008000', BigInt(8388610)],
  ['feffff7f', BigInt(2147483646)],
  ['ffffff7f', BigInt(2147483647)],
  ['ffffffff', BigInt(-2147483647)],
  ['feffffff', BigInt(-2147483646)],
  ['fdffffff', BigInt(-2147483645)],
  ['ffffff80', BigInt(-16777215)],
  ['01008080', BigInt(-8388609)],
  ['00008080', BigInt(-8388608)],
  ['ffffff', BigInt(-8388607)],
  ['feffff', BigInt(-8388606)],
  ['fdffff', BigInt(-8388605)],
  ['ffff80', BigInt(-65535)],
  ['018080', BigInt(-32769)],
  ['008080', BigInt(-32768)],
  ['ffff', BigInt(-32767)],
  ['feff', BigInt(-32766)],
  ['fdff', BigInt(-32765)],
  ['ff80', BigInt(-255)],
  ['8180', BigInt(-129)],
  ['8080', BigInt(-128)],
  ['ff', BigInt(-127)],
  ['fe', BigInt(-126)],
  ['fd', BigInt(-125)],
  ['82', BigInt(-2)],
  ['81', BigInt(-1)],
  /* spell-checker:enable */
];

const nonMinimallyEncodedVmNumbers: readonly [string, bigint][] = [
  ['00', BigInt(0)],
  ['0000', BigInt(0)],
  ['80', BigInt(0)],
  ['0080', BigInt(0)],
  ['0180', BigInt(-1)],
  ['010080', BigInt(-1)],
  ['01000080', BigInt(-1)],
  ['0100000080', BigInt(-1)],
  ['abcdef4280', BigInt(-1123012011)],
];

const equivalentVmNumbers: readonly [string, string][] = [
  ['01020380', '010283'],
  ['0102030480', '01020384'],
  ['abcdef4280', 'abcdefc2'],
];

test('decodeVmNumber', (t) => {
  minimallyEncodedVmNumbers.map((pair) => {
    t.deepEqual(decodeVmNumber(hexToBin(pair[0])), pair[1]);
    t.deepEqual(
      decodeVmNumber(hexToBin(pair[0]), {
        requireMinimalEncoding: true,
      }),
      pair[1]
    );
    t.deepEqual(
      decodeVmNumber(hexToBin(pair[0]), {
        maximumVmNumberByteLength: 4,
        requireMinimalEncoding: true,
      }),
      pair[1]
    );
    return undefined;
  });
  [...minimallyEncodedVmNumbers, ...nonMinimallyEncodedVmNumbers].map(
    (pair) => {
      t.deepEqual(
        decodeVmNumber(hexToBin(pair[0]), {
          maximumVmNumberByteLength: 5,
          requireMinimalEncoding: false,
        }),
        pair[1]
      );
      return undefined;
    }
  );
  nonMinimallyEncodedVmNumbers.map((pair) => {
    t.deepEqual(
      decodeVmNumber(hexToBin(pair[0]), {
        maximumVmNumberByteLength: 5,
      }),
      VmNumberError.requiresMinimal
    );
    t.deepEqual(
      decodeVmNumber(hexToBin(pair[0]), {
        maximumVmNumberByteLength: 5,
        requireMinimalEncoding: true,
      }),
      VmNumberError.requiresMinimal
    );
    return undefined;
  });
  equivalentVmNumbers.map((pair) => {
    t.deepEqual(
      decodeVmNumber(hexToBin(pair[0]), {
        maximumVmNumberByteLength: 5,
        requireMinimalEncoding: false,
      }),
      decodeVmNumber(hexToBin(pair[1]), {
        maximumVmNumberByteLength: 5,
        requireMinimalEncoding: true,
      })
    );
    return undefined;
  });
  t.deepEqual(
    decodeVmNumber(hexToBin('abcdef1234'), {
      maximumVmNumberByteLength: 4,
    }),
    VmNumberError.outOfRange
  );
  t.deepEqual(
    decodeVmNumber(hexToBin('abcdef1234'), {
      maximumVmNumberByteLength: 5,
    }),
    BigInt(223656005035)
  );
});

test('bigIntToVmNumber', (t) => {
  minimallyEncodedVmNumbers.map((pair) => {
    t.deepEqual(binToHex(bigIntToVmNumber(pair[1])), pair[0]);
    return undefined;
  });
});

// TODO: more test vectors
test('stackElementIsTruthy', (t) => {
  t.is(stackItemIsTruthy(bigIntToVmNumber(BigInt(0))), false);
  t.is(stackItemIsTruthy(bigIntToVmNumber(BigInt(1))), true);
});

test('booleanToVmNumber', (t) => {
  t.deepEqual(booleanToVmNumber(false), bigIntToVmNumber(BigInt(0)));
  t.deepEqual(booleanToVmNumber(true), bigIntToVmNumber(BigInt(1)));
});
