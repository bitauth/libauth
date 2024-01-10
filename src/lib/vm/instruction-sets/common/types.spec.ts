import test from 'ava';

import {
  bigIntToVmNumber,
  binToHex,
  booleanToVmNumber,
  hexToBin,
  stackItemIsTruthy,
  VmNumberError,
  vmNumberToBigInt,
} from '../../../lib.js';

// Derived from https://github.com/bitcoinjs/bitcoinjs-lib
const minimallyEncodedVmNumbers: [string, bigint][] = [
  /* spell-checker:disable */
  ['', 0n],
  ['01', 1n],
  ['02', 2n],
  ['03', 3n],
  ['7e', 126n],
  ['7f', 127n],
  ['8000', 128n],
  ['8100', 129n],
  ['8200', 130n],
  ['ff00', 255n],
  ['fe7f', 32766n],
  ['ff7f', 32767n],
  ['008000', 32768n],
  ['018000', 32769n],
  ['028000', 32770n],
  ['ffff00', 65535n],
  ['ffffff00', 16777215n],
  ['feff7f', 8388606n],
  ['ffff7f', 8388607n],
  ['00008000', 8388608n],
  ['01008000', 8388609n],
  ['02008000', 8388610n],
  ['feffff7f', 2147483646n],
  ['ffffff7f', 2147483647n],
  ['ffffffff', -2147483647n],
  ['feffffff', -2147483646n],
  ['fdffffff', -2147483645n],
  ['ffffff80', -16777215n],
  ['01008080', -8388609n],
  ['00008080', -8388608n],
  ['ffffff', -8388607n],
  ['feffff', -8388606n],
  ['fdffff', -8388605n],
  ['ffff80', -65535n],
  ['018080', -32769n],
  ['008080', -32768n],
  ['ffff', -32767n],
  ['feff', -32766n],
  ['fdff', -32765n],
  ['ff80', -255n],
  ['8180', -129n],
  ['8080', -128n],
  ['ff', -127n],
  ['fe', -126n],
  ['fd', -125n],
  ['82', -2n],
  ['81', -1n],
  /* spell-checker:enable */
];

const nonMinimallyEncodedVmNumbers: [string, bigint][] = [
  ['00', 0n],
  ['0000', 0n],
  ['80', 0n],
  ['0080', 0n],
  ['0180', -1n],
  ['010080', -1n],
  ['01000080', -1n],
  ['0100000080', -1n],
  ['abcdef4280', -1123012011n],
];

const equivalentVmNumbers: [string, string][] = [
  ['01020380', '010283'],
  ['0102030480', '01020384'],
  ['abcdef4280', 'abcdefc2'],
];

test('decodeVmNumber', (t) => {
  minimallyEncodedVmNumbers.map((pair) => {
    t.deepEqual(vmNumberToBigInt(hexToBin(pair[0])), pair[1]);
    t.deepEqual(
      vmNumberToBigInt(hexToBin(pair[0]), {
        requireMinimalEncoding: true,
      }),
      pair[1],
    );
    t.deepEqual(
      vmNumberToBigInt(hexToBin(pair[0]), {
        maximumVmNumberByteLength: 4,
        requireMinimalEncoding: true,
      }),
      pair[1],
    );
    return undefined;
  });
  [...minimallyEncodedVmNumbers, ...nonMinimallyEncodedVmNumbers].map(
    (pair) => {
      t.deepEqual(
        vmNumberToBigInt(hexToBin(pair[0]), {
          maximumVmNumberByteLength: 5,
          requireMinimalEncoding: false,
        }),
        pair[1],
      );
      return undefined;
    },
  );
  nonMinimallyEncodedVmNumbers.map((pair) => {
    t.deepEqual(
      vmNumberToBigInt(hexToBin(pair[0]), {
        maximumVmNumberByteLength: 5,
      }),
      VmNumberError.requiresMinimal,
    );
    t.deepEqual(
      vmNumberToBigInt(hexToBin(pair[0]), {
        maximumVmNumberByteLength: 5,
        requireMinimalEncoding: true,
      }),
      VmNumberError.requiresMinimal,
    );
    return undefined;
  });
  equivalentVmNumbers.map((pair) => {
    t.deepEqual(
      vmNumberToBigInt(hexToBin(pair[0]), {
        maximumVmNumberByteLength: 5,
        requireMinimalEncoding: false,
      }),
      vmNumberToBigInt(hexToBin(pair[1]), {
        maximumVmNumberByteLength: 5,
        requireMinimalEncoding: true,
      }),
    );
    return undefined;
  });
  t.deepEqual(
    vmNumberToBigInt(hexToBin('abcdef1234'), {
      maximumVmNumberByteLength: 4,
    }),
    VmNumberError.outOfRange,
  );
  t.deepEqual(
    vmNumberToBigInt(hexToBin('abcdef1234'), {
      maximumVmNumberByteLength: 5,
    }),
    223656005035n,
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
  t.is(stackItemIsTruthy(bigIntToVmNumber(0n)), false);
  t.is(stackItemIsTruthy(bigIntToVmNumber(1n)), true);
});

test('booleanToVmNumber', (t) => {
  t.deepEqual(booleanToVmNumber(false), bigIntToVmNumber(0n));
  t.deepEqual(booleanToVmNumber(true), bigIntToVmNumber(1n));
});
