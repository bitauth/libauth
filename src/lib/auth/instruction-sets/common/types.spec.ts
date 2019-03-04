// tslint:disable:no-expression-statement no-magic-numbers
import test from 'ava';
import { binToHex, hexToBin } from '../../../utils/utils';
import {
  bigIntToScriptNumber,
  booleanToScriptNumber,
  parseBytesAsScriptNumber,
  ScriptNumberError,
  stackElementIsTruthy
} from './common';

/**
 * Derived from https://github.com/bitcoinjs/bitcoinjs-lib
 */
const validScriptNumbers: ReadonlyArray<[string, bigint]> = [
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
  ['81', BigInt(-1)]
];

const invalidScriptNumbers: ReadonlyArray<[string, string]> = [
  ['00', ScriptNumberError.requiresMinimal],
  ['0000', ScriptNumberError.requiresMinimal],
  ['80', ScriptNumberError.requiresMinimal]
];

test('parseBytesAsScriptNumber', t => {
  [...validScriptNumbers, ...invalidScriptNumbers].map(pair => {
    t.deepEqual(parseBytesAsScriptNumber(hexToBin(pair[0])), pair[1]);
  });
});

test('bigIntToScriptNumber', t => {
  validScriptNumbers.map(pair => {
    t.deepEqual(binToHex(bigIntToScriptNumber(pair[1])), pair[0]);
  });
});

// TODO: more test vectors
test('stackElementIsTruthy', t => {
  t.is(stackElementIsTruthy(bigIntToScriptNumber(BigInt(0))), false);
  t.is(stackElementIsTruthy(bigIntToScriptNumber(BigInt(1))), true);
});

test('booleanToScriptNumber', t => {
  t.deepEqual(booleanToScriptNumber(false), bigIntToScriptNumber(BigInt(0)));
  t.deepEqual(booleanToScriptNumber(true), bigIntToScriptNumber(BigInt(1)));
});
