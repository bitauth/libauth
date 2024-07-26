/* eslint-disable @typescript-eslint/no-magic-numbers */
/**
 * See `bch-vmb-tests.ts` for details about modifying this file.
 */

import type { VmbTestDefinitionGroup } from '../../lib.js';
import { bigIntToBinUint64LE, binToHex, cashAssemblyToBin, hashTransactionUiOrder, hexToBin, range } from '../../lib.js';
import { simpleP2pkhOutput, slot0Scenario, slot2Scenario, slot9Scenario } from '../bch-vmb-test-mixins.js';

export const inspectionTestDefinitionsBch: VmbTestDefinitionGroup = [
  'Transaction inspection',
  [
    ['<0>', 'OP_INPUTINDEX OP_EQUAL', 'OP_INPUTINDEX returns the index of the input currently being evaluated (0)', [], slot0Scenario],
    ['<0>', 'OP_INPUTINDEX OP_EQUAL', 'OP_INPUTINDEX returns the index of the input currently being evaluated (1, expects 0)', ['invalid']],
    ['<1>', 'OP_INPUTINDEX OP_EQUAL', 'OP_INPUTINDEX returns the index of the input currently being evaluated (1)'],
    ['<2>', 'OP_INPUTINDEX OP_EQUAL', 'OP_INPUTINDEX returns the index of the input currently being evaluated (2)', [], slot2Scenario],
    ['<9>', 'OP_INPUTINDEX OP_EQUAL', 'OP_INPUTINDEX returns the index of the input currently being evaluated (9)', [], slot9Scenario],
    ['<OP_ACTIVEBYTECODE OP_EQUAL>', 'OP_ACTIVEBYTECODE OP_EQUAL', 'OP_ACTIVEBYTECODE returns the bytecode currently being evaluated'],
    ['<OP_SIZE <5> OP_EQUALVERIFY OP_ACTIVEBYTECODE OP_EQUAL>', 'OP_SIZE <5> OP_EQUALVERIFY OP_ACTIVEBYTECODE OP_EQUAL', 'OP_ACTIVEBYTECODE returns the bytecode currently being evaluated (check size)'],
    ['<OP_DUP OP_SIZE <8> OP_EQUALVERIFY OP_ACTIVEBYTECODE OP_EQUALVERIFY OP_ACTIVEBYTECODE OP_EQUAL>', 'OP_DUP OP_SIZE <8> OP_EQUALVERIFY OP_ACTIVEBYTECODE OP_EQUALVERIFY OP_ACTIVEBYTECODE OP_EQUAL', 'OP_ACTIVEBYTECODE returns the same bytecode each time (without OP_CODESEPARATOR)'],
    ['<OP_ACTIVEBYTECODE OP_EQUAL>', 'OP_SIZE <2> OP_EQUALVERIFY OP_CODESEPARATOR OP_ACTIVEBYTECODE OP_EQUAL', 'OP_ACTIVEBYTECODE respects OP_CODESEPARATOR'],
    ['<OP_EQUALVERIFY OP_ACTIVEBYTECODE OP_EQUAL>', 'OP_SIZE <3> OP_CODESEPARATOR OP_EQUALVERIFY OP_ACTIVEBYTECODE OP_EQUAL', 'OP_ACTIVEBYTECODE respects a single OP_CODESEPARATOR (includes the OP_EQUALVERIFY)'],
    ['<OP_CODESEPARATOR OP_ACTIVEBYTECODE OP_EQUAL>', 'OP_SIZE <3> OP_EQUALVERIFY OP_CODESEPARATOR OP_ACTIVEBYTECODE OP_EQUAL', 'Active bytecode begins after the last OP_CODESEPARATOR', ['invalid']],
    ['<OP_ACTIVEBYTECODE OP_CODESEPARATOR OP_EQUAL>', 'OP_SIZE <3> OP_CODESEPARATOR OP_EQUALVERIFY OP_CODESEPARATOR OP_ACTIVEBYTECODE OP_CODESEPARATOR OP_EQUAL', 'OP_ACTIVEBYTECODE returns only the bytecode after the last executed OP_CODESEPARATOR'],
    [
      '<OP_ACTIVEBYTECODE OP_CODESEPARATOR OP_EQUAL> <OP_ACTIVEBYTECODE OP_EQUALVERIFY OP_CODESEPARATOR OP_ACTIVEBYTECODE OP_CODESEPARATOR OP_EQUAL>',
      'OP_SIZE <6> OP_CODESEPARATOR OP_EQUALVERIFY OP_CODESEPARATOR OP_ACTIVEBYTECODE OP_EQUALVERIFY OP_CODESEPARATOR OP_ACTIVEBYTECODE OP_CODESEPARATOR OP_EQUAL',
      'OP_ACTIVEBYTECODE returns only the bytecode after the last executed OP_CODESEPARATOR (two OP_ACTIVEBYTECODEs)',
    ],
    [
      '<OP_EQUALVERIFY OP_ACTIVEBYTECODE OP_EQUAL> <OP_ACTIVEBYTECODE OP_CODESEPARATOR OP_EQUALVERIFY OP_ACTIVEBYTECODE OP_EQUAL> <OP_ACTIVEBYTECODE OP_EQUALVERIFY OP_CODESEPARATOR OP_ACTIVEBYTECODE OP_CODESEPARATOR OP_EQUALVERIFY OP_ACTIVEBYTECODE OP_EQUAL> <OP_ACTIVEBYTECODE OP_EQUALVERIFY OP_CODESEPARATOR OP_ACTIVEBYTECODE OP_EQUALVERIFY OP_CODESEPARATOR OP_ACTIVEBYTECODE OP_CODESEPARATOR OP_EQUALVERIFY OP_ACTIVEBYTECODE OP_EQUAL>',
      'OP_ACTIVEBYTECODE OP_EQUALVERIFY OP_CODESEPARATOR OP_ACTIVEBYTECODE OP_EQUALVERIFY OP_CODESEPARATOR OP_ACTIVEBYTECODE OP_CODESEPARATOR OP_EQUALVERIFY OP_ACTIVEBYTECODE OP_EQUAL',
      'OP_ACTIVEBYTECODE works before and after multiple OP_CODESEPARATORs',
    ],
    ['<1>', 'OP_INPUTINDEX OP_UTXOBYTECODE OP_ACTIVEBYTECODE OP_EQUALVERIFY', '"OP_INPUTINDEX OP_UTXOBYTECODE" and "OP_ACTIVEBYTECODE" differ in P2SH contracts (working nonP2SH)', ['p2sh_invalid']],
    ['<OP_HASH160 OP_PUSHBYTES_20>', 'OP_ACTIVEBYTECODE OP_HASH160 <OP_EQUAL> OP_CAT OP_CAT OP_INPUTINDEX OP_UTXOBYTECODE OP_EQUAL', '"OP_INPUTINDEX OP_UTXOBYTECODE" and "OP_ACTIVEBYTECODE" differ in P2SH contracts (working P2SH20)', ['invalid', 'p2sh20_standard']],
    ['<OP_HASH256 OP_PUSHBYTES_32>', 'OP_ACTIVEBYTECODE OP_HASH256 <OP_EQUAL> OP_CAT OP_CAT OP_INPUTINDEX OP_UTXOBYTECODE OP_EQUAL', '"OP_INPUTINDEX OP_UTXOBYTECODE" and "OP_ACTIVEBYTECODE" differ in P2SH contracts (working P2SH32)', ['invalid', 'p2sh32_standard']],
    ['<0>', 'OP_TXVERSION OP_EQUAL', 'OP_TXVERSION (version == 0); only versions 1 and 2 are valid', ['invalid'], { transaction: { version: 0 } }],
    ['<1>', 'OP_TXVERSION OP_EQUAL', 'OP_TXVERSION (version == 1)', [], { transaction: { version: 1 } }],
    ['<2>', 'OP_TXVERSION OP_EQUAL', 'OP_TXVERSION (version == 2)'],
    ['<3>', 'OP_TXVERSION OP_EQUAL', 'OP_TXVERSION (version == 2, while version 3 is expected)', ['invalid']],
    ['<3>', 'OP_TXVERSION OP_EQUAL', 'OP_TXVERSION (version == 3); only versions 1 and 2 are valid', ['invalid'], { transaction: { version: 3 } }],
    ['<123456>', 'OP_TXVERSION OP_EQUAL', 'OP_TXVERSION (version == 123456)', ['invalid'], { transaction: { version: 123456 } }],
    // Libauth considers version to be an unsigned integer, but the Satoshi implementation considers it to be signed
    ['<-2>', 'OP_TXVERSION OP_EQUAL', 'OP_TXVERSION (version 0xfeffffff; 4294967294 unsigned, -2 signed)', ['invalid'], { transaction: { version: 4294967294 } }],
    ['<-1>', 'OP_TXVERSION OP_EQUAL', 'OP_TXVERSION (version 0xffffffff; 4294967295 unsigned, -1 signed)', ['invalid'], { transaction: { version: 4294967295 } }],
    ['<2>', 'OP_TXINPUTCOUNT OP_EQUAL', 'OP_TXINPUTCOUNT (2 inputs)'],
    ['<1>', 'OP_TXINPUTCOUNT OP_EQUAL', 'OP_TXINPUTCOUNT (2 inputs, 1 expected)', ['invalid']],
    ['<1> <"100-byte tx size minimum 123456789012345678901234567890">', 'OP_DROP OP_TXINPUTCOUNT OP_EQUAL', 'OP_TXINPUTCOUNT (1 input)', [], { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }] } }],
    ['<3>', 'OP_TXINPUTCOUNT OP_EQUAL', 'OP_TXINPUTCOUNT (3 inputs)', [], slot2Scenario],
    ['<10>', 'OP_TXINPUTCOUNT OP_EQUAL', 'OP_TXINPUTCOUNT (10 inputs)', [], slot9Scenario],
    ['<101>', 'OP_TXINPUTCOUNT OP_EQUAL', 'OP_TXINPUTCOUNT (101 inputs)', [], { sourceOutputs: [{ lockingBytecode: ['slot'] }, ...range(100).map(() => ({ lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 }))], transaction: { inputs: [{ unlockingBytecode: ['slot'] }, ...range(100).map(() => ({ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }))] } }],
    ['<1>', 'OP_TXOUTPUTCOUNT OP_EQUAL', 'OP_TXOUTPUTCOUNT (1 output)'],
    ['<2>', 'OP_TXOUTPUTCOUNT OP_EQUAL', 'OP_TXOUTPUTCOUNT (2 outputs)', [], { transaction: { outputs: [...range(2).map(() => ({ lockingBytecode: { script: 'vmbTestNullData' } }))] } }],
    ['<3>', 'OP_TXOUTPUTCOUNT OP_EQUAL', 'OP_TXOUTPUTCOUNT (3 outputs)', [], { transaction: { outputs: [...range(3).map(() => ({ lockingBytecode: { script: 'vmbTestNullData' } }))] } }],
    ['<20>', 'OP_TXOUTPUTCOUNT OP_EQUAL', 'OP_TXOUTPUTCOUNT (20 outputs)', [], { transaction: { outputs: [...range(20).map(() => ({ lockingBytecode: { script: 'vmbTestNullData' } }))] } }],
    ['<100>', 'OP_TXOUTPUTCOUNT OP_EQUAL', 'OP_TXOUTPUTCOUNT (100 outputs; non-standard beyond per-transaction OP_RETURN data limit)', ['nonstandard'], { transaction: { outputs: [...range(100).map(() => ({ lockingBytecode: { script: 'vmbTestNullData' } }))] } }],
    ['<0>', 'OP_TXLOCKTIME OP_EQUAL', 'OP_TXLOCKTIME (locktime == 0)'],
    ['<1>', 'OP_TXLOCKTIME OP_EQUAL', 'OP_TXLOCKTIME (locktime == 0, but expects 1)', ['invalid']],
    ['<1>', 'OP_TXLOCKTIME OP_EQUAL', 'OP_TXLOCKTIME (locktime == 1)', [], { transaction: { locktime: 1 } }],
    ['<2>', 'OP_TXLOCKTIME OP_EQUAL', 'OP_TXLOCKTIME (locktime == 2)', [], { transaction: { locktime: 2 } }],
    ['<499_999_999>', 'OP_TXLOCKTIME OP_EQUAL', 'OP_TXLOCKTIME (locktime == 499999999, the maximum block height)', [], { transaction: { locktime: 499_999_999 } }],
    ['<500_000_000>', 'OP_TXLOCKTIME OP_EQUAL', 'OP_TXLOCKTIME (locktime == 500000000, the minimum UNIX timestamp)', [], { transaction: { locktime: 500_000_000 } }],
    ['<4_294_967_294>', 'OP_TXLOCKTIME OP_EQUAL', 'OP_TXLOCKTIME (locktime == 4294967294)', [], { transaction: { locktime: 4_294_967_294 } }],
    ['<4_294_967_295>', 'OP_TXLOCKTIME OP_EQUAL', 'OP_TXLOCKTIME (locktime == 4294967295)', [], { transaction: { locktime: 4_294_967_295 } }],
    ['<10_000> <0>', 'OP_UTXOVALUE OP_EQUAL', 'OP_UTXOVALUE (10000)'],
    ['<10_001> <0>', 'OP_UTXOVALUE OP_EQUAL', 'OP_UTXOVALUE (10000, expects 10001)', ['invalid']],
    ['<1>', '<0> OP_UTXOVALUE OP_DROP', 'OP_UTXOVALUE (ignore result)'],
    ['<1>', '<1> OP_UTXOVALUE OP_DROP', 'OP_UTXOVALUE (ignore result, index 1)'],
    ['<1>', '<-1> OP_UTXOVALUE OP_DROP', 'OP_UTXOVALUE (ignore result, negative index)', ['invalid']],
    ['<1>', '<0x0100> OP_UTXOVALUE OP_DROP', 'OP_UTXOVALUE (ignore result, index 1, non-minimally encoded)', ['invalid']],
    ['<1>', '<2> OP_UTXOVALUE OP_DROP', 'OP_UTXOVALUE (ignore result, index 2, greater than maximum index)', ['invalid']],
    ['<10_000> <1>', 'OP_UTXOVALUE OP_EQUAL', 'OP_UTXOVALUE (10000; input 1)'],
    ['<123_456> <100>', 'OP_UTXOVALUE OP_EQUAL', 'OP_UTXOVALUE (123456; input 101)', [], { sourceOutputs: [{ lockingBytecode: ['slot'] }, ...range(100).map(() => ({ lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 123_456 }))], transaction: { inputs: [{ unlockingBytecode: ['slot'] }, ...range(100).map(() => ({ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }))] } }],
    ['<123_456_789> <0>', 'OP_UTXOVALUE OP_EQUAL', 'OP_UTXOVALUE (1.23456789 BCH)', [], { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 123_456_789 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ lockingBytecode: binToHex(cashAssemblyToBin('OP_RETURN <"100-byte tx size minimum 1234567">') as Uint8Array) }] } }],
    [
      '<2_100_000_000_000_000> <0>',
      'OP_UTXOVALUE OP_EQUAL',
      'OP_UTXOVALUE (21,000,000 BCH)',
      [],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: binToHex(bigIntToBinUint64LE(21_000_000n * 100_000_000n)) }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ lockingBytecode: binToHex(cashAssemblyToBin('OP_RETURN <"100-byte tx size minimum 1234">') as Uint8Array) }] } },
    ],
    [
      '<9223372036854775807> <0>',
      'OP_UTXOVALUE OP_EQUAL',
      'OP_UTXOVALUE (maximum VM Number satoshis)',
      [],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: binToHex(bigIntToBinUint64LE(9223372036854775807n)) }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ lockingBytecode: binToHex(cashAssemblyToBin('OP_RETURN <"100-byte tx size minimum 123">') as Uint8Array) }] } },
    ],
    [
      '<9223372036854775808> <0>',
      'OP_UTXOVALUE OP_EQUAL',
      'OP_UTXOVALUE (9223372036854775808 satoshis, exceeds maximum VM Number)',
      ['invalid'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: binToHex(bigIntToBinUint64LE(9223372036854775808n)) }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ lockingBytecode: binToHex(cashAssemblyToBin('OP_RETURN <"100-byte tx size minimum 123">') as Uint8Array) }] } },
    ],
    ['<<1> OP_UTXOBYTECODE OP_EQUAL>', '<1> OP_UTXOBYTECODE OP_EQUAL', 'OP_UTXOBYTECODE (<<1> OP_UTXOBYTECODE OP_EQUAL>; nonP2SH)', ['p2sh_invalid']],
    ['<0xa914baae9f614b7d4cde00a5c2ea454f59b5a3f91a2d87>', '<1> OP_UTXOBYTECODE OP_EQUAL', 'OP_UTXOBYTECODE (<<1> OP_UTXOBYTECODE OP_EQUAL>; P2SH20)', ['invalid', 'p2sh20_standard']],
    ['<0x76a91460011c6bf3f1dd98cff576437b9d85de780f497488ac>', '<0> OP_UTXOBYTECODE OP_EQUAL', 'OP_UTXOBYTECODE (<simple p2pkh output>; input 0)'],
    ['<1>', '<0> OP_UTXOBYTECODE OP_DROP', 'OP_UTXOBYTECODE (ignore result, input 0)'],
    ['<1>', '<1> OP_UTXOBYTECODE OP_DROP', 'OP_UTXOBYTECODE (ignore result, input 1)'],
    ['<1>', '<-1> OP_UTXOBYTECODE OP_DROP', 'OP_UTXOBYTECODE (ignore result, negative input)', ['invalid']],
    ['<1>', '<0x0100> OP_UTXOBYTECODE OP_DROP', 'OP_UTXOBYTECODE (ignore result, input 1, non-minimally encoded)', ['invalid']],
    ['<1>', '<2> OP_UTXOBYTECODE OP_DROP', 'OP_UTXOBYTECODE (ignore result, input 2, greater than maximum input index)', ['invalid']],
    [
      `<<0x${range(513)
        .map((i) => binToHex(Uint8Array.of(i)))
        .join('')}> OP_DROP <1> OP_UTXOBYTECODE OP_EQUAL>`,
      `<0x${range(513)
        .map((i) => binToHex(Uint8Array.of(i)))
        .join('')}> OP_DROP <1> OP_UTXOBYTECODE OP_EQUAL`,
      'OP_UTXOBYTECODE (maximum size UTXO bytecode)',
      ['p2sh_ignore'],
    ],
    [
      '<1>',
      `<0x${range(513)
        .map((i) => binToHex(Uint8Array.of(i)))
        .join('')}> OP_DROP <1> OP_UTXOBYTECODE OP_DROP`,
      'OP_UTXOBYTECODE (ignore result, not excessive size)',
      ['p2sh_ignore'],
    ],
    [
      '<1>',
      `<0x${range(514)
        .map((i) => binToHex(Uint8Array.of(i)))
        .join('')}> OP_DROP <1> OP_UTXOBYTECODE OP_DROP`,
      'OP_UTXOBYTECODE (ignore result, excessive size)',
      ['invalid', 'p2sh_ignore'],
    ],
    [
      '<<0x00 42> OP_EQUAL> <<0x00 13> OP_EQUAL> <<0x00 7> OP_EQUAL> <<0x00 3> OP_EQUAL> <<0x00 2> OP_EQUAL> <<0x00 1> OP_EQUAL> <<0> OP_UTXOBYTECODE OP_EQUALVERIFY <1> OP_CODESEPARATOR OP_UTXOBYTECODE OP_EQUALVERIFY <2> OP_UTXOBYTECODE OP_EQUALVERIFY <3> OP_UTXOBYTECODE OP_CODESEPARATOR OP_EQUALVERIFY <7> OP_UTXOBYTECODE OP_EQUALVERIFY <13> OP_UTXOBYTECODE OP_EQUALVERIFY OP_CODESEPARATOR <42> OP_UTXOBYTECODE OP_EQUAL>',
      '<0> OP_UTXOBYTECODE OP_EQUALVERIFY <1> OP_CODESEPARATOR OP_UTXOBYTECODE OP_EQUALVERIFY <2> OP_UTXOBYTECODE OP_EQUALVERIFY <3> OP_UTXOBYTECODE OP_CODESEPARATOR OP_EQUALVERIFY <7> OP_UTXOBYTECODE OP_EQUALVERIFY <13> OP_UTXOBYTECODE OP_EQUALVERIFY OP_CODESEPARATOR <42> OP_UTXOBYTECODE OP_EQUAL',
      'multiple OP_UTXOBYTECODEs, OP_CODESEPARATOR has no effect (50 inputs)',
      ['invalid', 'nop2sh_nonstandard'],
      { sourceOutputs: [{ lockingBytecode: ['slot'] }, ...range(49, 1).map((i) => ({ lockingBytecode: { script: `lock${i}` }, valueSatoshis: 10_000 }))], transaction: { inputs: [{ unlockingBytecode: ['slot'] }, ...range(49, 1).map((i) => ({ unlockingBytecode: { script: `unlock${i}` } }))] } },
      range(49, 1).reduce((agg, i) => ({ ...agg, [`unlock${i}`]: { script: `<0x00 ${i}>`, unlocks: `lock${i}` }, [`lock${i}`]: { lockingType: 'standard', script: `<0x00 ${i}> OP_EQUAL` } }), {}),
    ],
    [
      '<OP_HASH160 <$(<<0x00 3> OP_EQUAL> OP_HASH160)> OP_EQUAL> <OP_HASH160 <$(<<0x00 2> OP_EQUAL> OP_HASH160)> OP_EQUAL> <OP_HASH160 <$(<<0x00 1> OP_EQUAL> OP_HASH160)> OP_EQUAL> <OP_HASH160 <$(<<0> OP_UTXOBYTECODE OP_EQUALVERIFY OP_CODESEPARATOR <1> OP_UTXOBYTECODE OP_EQUALVERIFY OP_CODESEPARATOR <2> OP_UTXOBYTECODE OP_EQUALVERIFY OP_CODESEPARATOR <3> OP_UTXOBYTECODE OP_EQUAL> OP_HASH160)> OP_EQUAL>',
      '<0> OP_UTXOBYTECODE OP_EQUALVERIFY OP_CODESEPARATOR <1> OP_UTXOBYTECODE OP_EQUALVERIFY OP_CODESEPARATOR <2> OP_UTXOBYTECODE OP_EQUALVERIFY OP_CODESEPARATOR <3> OP_UTXOBYTECODE OP_EQUAL',
      'multiple OP_UTXOBYTECODEs, OP_CODESEPARATOR has no effect (50 inputs, P2SH20)',
      ['invalid', 'p2sh20_standard'],
      { sourceOutputs: [{ lockingBytecode: ['slot'] }, ...range(49, 1).map((i) => ({ lockingBytecode: { script: `lock${i}` }, valueSatoshis: 10_000 }))], transaction: { inputs: [{ unlockingBytecode: ['slot'] }, ...range(49, 1).map((i) => ({ unlockingBytecode: { script: `unlock${i}` } }))] } },
      range(49, 1).reduce((agg, i) => ({ ...agg, [`unlock${i}`]: { script: `<0x00 ${i}>`, unlocks: `lock${i}` }, [`lock${i}`]: { lockingType: 'p2sh20', script: `<0x00 ${i}> OP_EQUAL` } }), {}),
    ],
    [
      '<OP_HASH256 <$(<<0x00 3> OP_EQUAL> OP_HASH256)> OP_EQUAL> <OP_HASH256 <$(<<0x00 2> OP_EQUAL> OP_HASH256)> OP_EQUAL> <OP_HASH256 <$(<<0x00 1> OP_EQUAL> OP_HASH256)> OP_EQUAL> <OP_HASH256 <$(<<0> OP_UTXOBYTECODE OP_EQUALVERIFY OP_CODESEPARATOR <1> OP_UTXOBYTECODE OP_EQUALVERIFY OP_CODESEPARATOR <2> OP_UTXOBYTECODE OP_EQUALVERIFY OP_CODESEPARATOR <3> OP_UTXOBYTECODE OP_EQUAL> OP_HASH256)> OP_EQUAL>',
      '<0> OP_UTXOBYTECODE OP_EQUALVERIFY OP_CODESEPARATOR <1> OP_UTXOBYTECODE OP_EQUALVERIFY OP_CODESEPARATOR <2> OP_UTXOBYTECODE OP_EQUALVERIFY OP_CODESEPARATOR <3> OP_UTXOBYTECODE OP_EQUAL',
      'multiple OP_UTXOBYTECODEs, OP_CODESEPARATOR has no effect (50 inputs, P2SH32)',
      ['invalid', 'p2sh32_standard'],
      { sourceOutputs: [{ lockingBytecode: ['slot'] }, ...range(49, 1).map((i) => ({ lockingBytecode: { script: `lock${i}` }, valueSatoshis: 10_000 }))], transaction: { inputs: [{ unlockingBytecode: ['slot'] }, ...range(49, 1).map((i) => ({ unlockingBytecode: { script: `unlock${i}` } }))] } },
      range(49, 1).reduce((agg, i) => ({ ...agg, [`unlock${i}`]: { script: `<0x00 ${i}>`, unlocks: `lock${i}` }, [`lock${i}`]: { lockingType: 'p2sh32', script: `<0x00 ${i}> OP_EQUAL` } }), {}),
    ],
    ['<0x0100000000000000000000000000000000000000000000000000000000000000>', '<0> OP_OUTPOINTTXHASH OP_EQUAL', 'OP_OUTPOINTTXHASH (input 0)'],
    ['<0x0100000000000000000000000000000000000000000000000000000000000000>', '<1> OP_OUTPOINTTXHASH OP_EQUAL', 'OP_OUTPOINTTXHASH (input 1)'],
    [
      '<0x6fe28c0ab6f1b372c1a6a246ae63f74f931e8365e15a089c68d6190000000000>',
      '<1> OP_OUTPOINTTXHASH OP_EQUAL',
      'OP_OUTPOINTTXHASH returns in OP_HASH256 order (genesis block)',
      [],
      {
        sourceOutputs: [{ lockingBytecode: ['slot'] }, { lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 }],
        transaction: { inputs: [{ unlockingBytecode: ['slot'] }, { outpointTransactionHash: binToHex(hashTransactionUiOrder(hexToBin('0100000000000000000000000000000000000000000000000000000000000000000000003ba3edfd7a7b12b27ac72c3e67768f617fc81bc3888a51323a9fb8aa4b1e5e4a29ab5f49ffff001d1dac2b7c'))), unlockingBytecode: { script: 'unlockEmptyP2sh20' } }] },
      },
    ],
    ['<0x0000000000000000000000000000000000000000000000000000000000000001>', '<1> OP_OUTPOINTTXHASH OP_EQUAL', 'OP_OUTPOINTTXHASH (input 1, expected 0x00...01)', ['invalid']],
    [
      '<0x000000000000000000000000000000000000000000000000000000000000001>',
      '<1> OP_OUTPOINTTXHASH OP_EQUAL',
      'OP_OUTPOINTTXHASH (input 1, 0x00...01)',
      [],
      { sourceOutputs: [{ lockingBytecode: ['slot'] }, { lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }, { outpointTransactionHash: '0100000000000000000000000000000000000000000000000000000000000000', unlockingBytecode: { script: 'unlockEmptyP2sh20' } }] } },
    ],
    ['<1>', '<0> OP_OUTPOINTTXHASH OP_DROP', 'OP_OUTPOINTTXHASH (ignore result, input 0)'],
    ['<1>', '<1> OP_OUTPOINTTXHASH OP_DROP', 'OP_OUTPOINTTXHASH (ignore result, input 1)'],
    ['<1>', '<0x0100> OP_OUTPOINTTXHASH OP_DROP', 'OP_OUTPOINTTXHASH (ignore result, input 1, non-minimally encoded)', ['invalid']],
    ['<1>', '<-1> OP_OUTPOINTTXHASH OP_DROP', 'OP_OUTPOINTTXHASH (ignore result, negative input)', ['invalid']],
    ['<1>', '<2> OP_OUTPOINTTXHASH OP_DROP', 'OP_OUTPOINTTXHASH (ignore result, input 2, greater than maximum input)', ['invalid']],
    ['<1>', '<2> OP_OUTPOINTTXHASH OP_DROP', 'OP_OUTPOINTTXHASH (ignore result, input 2)', [], { sourceOutputs: [{ lockingBytecode: ['slot'] }, ...range(2).map(() => ({ lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 }))], transaction: { inputs: [{ unlockingBytecode: ['slot'] }, ...range(2).map(() => ({ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }))] } }],
    [
      '<42> <13> <3>',
      '<0> OP_OUTPOINTTXHASH <0> OP_OUTPOINTTXHASH OP_EQUALVERIFY <1> OP_OUTPOINTTXHASH <1> OP_OUTPOINTTXHASH OP_EQUALVERIFY <3> OP_OUTPOINTTXHASH <1> OP_SPLIT OP_DROP OP_EQUALVERIFY <13> OP_OUTPOINTTXHASH <1> OP_SPLIT OP_DROP OP_EQUALVERIFY <42> OP_OUTPOINTTXHASH <1> OP_SPLIT OP_DROP OP_EQUAL',
      'multiple OP_OUTPOINTTXHASHs (50 inputs)',
      [],
      {
        sourceOutputs: [{ lockingBytecode: ['slot'] }, ...range(49, 1).map(() => ({ lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 }))],
        transaction: { inputs: [{ unlockingBytecode: ['slot'] }, ...range(49, 1).map((i) => ({ outpointTransactionHash: binToHex(Uint8Array.of(i)).padStart(64, '0'), unlockingBytecode: { script: 'unlockEmptyP2sh20' } }))] },
      },
    ],
    ['<0>', '<0> OP_OUTPOINTINDEX OP_EQUAL', 'OP_OUTPOINTINDEX (input 0)'],
    ['<1>', '<1> OP_OUTPOINTINDEX OP_EQUAL', 'OP_OUTPOINTINDEX (input 1)'],
    ['<0>', '<1> OP_OUTPOINTINDEX OP_EQUAL', 'OP_OUTPOINTINDEX (input 1, expected 0)', ['invalid']],
    ['<1>', '<1> OP_OUTPOINTINDEX OP_EQUAL', 'OP_OUTPOINTINDEX (input 1, 1)', [], { sourceOutputs: [{ lockingBytecode: ['slot'] }, { lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }, { outpointIndex: 1, unlockingBytecode: { script: 'unlockEmptyP2sh20' } }] } }],
    ['<1>', '<0> OP_OUTPOINTINDEX OP_DROP', 'OP_OUTPOINTINDEX (ignore result, input 0)'],
    ['<1>', '<1> OP_OUTPOINTINDEX OP_DROP', 'OP_OUTPOINTINDEX (ignore result, input 1)'],
    ['<1>', '<0x0100> OP_OUTPOINTINDEX OP_DROP', 'OP_OUTPOINTINDEX (ignore result, input 1, non-minimally encoded)', ['invalid']],
    ['<1>', '<-1> OP_OUTPOINTINDEX OP_DROP', 'OP_OUTPOINTINDEX (ignore result, negative input)', ['invalid']],
    ['<1>', '<2> OP_OUTPOINTINDEX OP_DROP', 'OP_OUTPOINTINDEX (ignore result, input 2, greater than maximum input index)', ['invalid']],
    ['<1>', '<2> OP_OUTPOINTINDEX OP_DROP', 'OP_OUTPOINTINDEX (ignore result, input 2)', [], { sourceOutputs: [{ lockingBytecode: ['slot'] }, ...range(2).map(() => ({ lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 }))], transaction: { inputs: [{ unlockingBytecode: ['slot'] }, ...range(2).map(() => ({ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }))] } }],
    [
      '<42> <13> <3>',
      '<0> OP_OUTPOINTINDEX <0> OP_EQUALVERIFY <1> OP_OUTPOINTINDEX <1> OP_OUTPOINTINDEX OP_EQUALVERIFY <3> OP_OUTPOINTINDEX OP_EQUALVERIFY <13> OP_OUTPOINTINDEX OP_EQUALVERIFY <42> OP_OUTPOINTINDEX OP_EQUAL',
      'multiple OP_OUTPOINTINDEXs (50 inputs)',
      [],
      { sourceOutputs: [{ lockingBytecode: ['slot'] }, ...range(49, 1).map(() => ({ lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 }))], transaction: { inputs: [{ unlockingBytecode: ['slot'] }, ...range(49, 1).map((i) => ({ outpointIndex: i, unlockingBytecode: { script: 'unlockEmptyP2sh20' } }))] } },
    ],
    ['<0>', 'OP_INPUTBYTECODE <<0x7dfb529d352908ee0a88a0074c216b09793d6aa8c94c7640bb4ced51eaefc75d0aef61f7685d0307491e2628da3d4f91e86329265a4a58ca27a41ec0b8910779c3> <0x03a524f43d6166ad3567f18b0a5c769c6ab4dc02149f4d5095ccf4e8ffa293e785>> OP_EQUAL', 'OP_INPUTBYTECODE (input 0)'],
    ['<1>', 'OP_INPUTBYTECODE <<1>> OP_EQUAL', 'OP_INPUTBYTECODE (self, nonP2SH)', ['invalid', 'nop2sh_nonstandard']],
    ['', '<1> OP_INPUTBYTECODE <0> OP_EQUAL', 'OP_INPUTBYTECODE (self, empty input bytecode, nonP2SH)', ['invalid', 'nop2sh_nonstandard']],
    ['<OP_DUP OP_SIZE OP_SWAP OP_CAT OP_CODESEPARATOR OP_NIP OP_DUP OP_CAT OP_CODESEPARATOR <1> OP_INPUTBYTECODE OP_EQUALVERIFY <1>>', 'OP_DUP OP_SIZE OP_SWAP OP_CAT OP_CODESEPARATOR OP_NIP OP_DUP OP_CAT OP_CODESEPARATOR <1> OP_INPUTBYTECODE OP_EQUALVERIFY <1>', 'OP_INPUTBYTECODE, OP_CODESEPARATOR in redeem bytecode has no effect (self, P2SH)', ['invalid', 'p2sh_standard']],
    ['<1>', 'OP_INPUTBYTECODE <2> OP_SPLIT OP_CODESEPARATOR OP_HASH160 <OP_HASH160 OP_PUSHBYTES_20> OP_SWAP OP_CAT <OP_EQUAL> OP_CAT OP_CODESEPARATOR <1> OP_UTXOBYTECODE OP_EQUALVERIFY <1> OP_SPLIT OP_DROP <<1>> OP_EQUAL', 'OP_INPUTBYTECODE, OP_CODESEPARATOR in redeem bytecode has no effect (self, P2SH20, compare OP_UTXOBYTECODE)', ['invalid', 'p2sh20_standard']],
    ['<1>', 'OP_INPUTBYTECODE <2> OP_SPLIT OP_CODESEPARATOR OP_HASH256 <OP_HASH256 OP_PUSHBYTES_32> OP_SWAP OP_CAT <OP_EQUAL> OP_CAT OP_CODESEPARATOR <1> OP_UTXOBYTECODE OP_EQUALVERIFY <1> OP_SPLIT OP_DROP <<1>> OP_EQUAL', 'OP_INPUTBYTECODE, OP_CODESEPARATOR in redeem bytecode has no effect (self, P2SH32, compare OP_UTXOBYTECODE)', ['invalid', 'p2sh32_standard']],
    ['<1>', 'OP_INPUTBYTECODE <1> OP_EQUAL', 'OP_INPUTBYTECODE (input 1, expected missing OP_PUSHBYTES_1)', ['invalid']],
    ['<1>', '<0> OP_INPUTBYTECODE OP_DROP', 'OP_INPUTBYTECODE (ignore result, input 0)'],
    ['<1>', '<1> OP_INPUTBYTECODE OP_DROP', 'OP_INPUTBYTECODE (ignore result, input 1)'],
    ['<1>', '<0x0100> OP_INPUTBYTECODE OP_DROP', 'OP_INPUTBYTECODE (ignore result, input 1, non-minimally encoded)', ['invalid']],
    ['<1>', '<-1> OP_INPUTBYTECODE OP_DROP', 'OP_INPUTBYTECODE (ignore result, negative input)', ['invalid']],
    ['<1>', '<2> OP_INPUTBYTECODE OP_DROP', 'OP_INPUTBYTECODE (ignore result, input 2, greater than maximum input index)', ['invalid']],
    ['<1>', '<2> OP_INPUTBYTECODE OP_DROP', 'OP_INPUTBYTECODE (ignore result, input 2)', [], { sourceOutputs: [{ lockingBytecode: ['slot'] }, ...range(2).map(() => ({ lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 }))], transaction: { inputs: [{ unlockingBytecode: ['slot'] }, ...range(2).map(() => ({ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }))] } }],
    [
      '<<0x00 42> <<0x00 42> OP_EQUAL>> <<0x00 13> <<0x00 13> OP_EQUAL>> <<0x00 7> <<0x00 7> OP_EQUAL>> <<0x00 1> <<0x00 1> OP_EQUAL>>',
      `<0> OP_INPUTBYTECODE <0> OP_INPUTBYTECODE OP_EQUALVERIFY <1> OP_INPUTBYTECODE OP_EQUALVERIFY <7> OP_INPUTBYTECODE OP_EQUALVERIFY <13> OP_INPUTBYTECODE OP_EQUALVERIFY <42> OP_INPUTBYTECODE OP_EQUAL`,
      'multiple OP_INPUTBYTECODEs (50 inputs)',
      [],
      { sourceOutputs: [{ lockingBytecode: ['slot'] }, ...range(49, 1).map((i) => ({ lockingBytecode: { script: `lock${i}` }, valueSatoshis: 10_000 }))], transaction: { inputs: [{ unlockingBytecode: ['slot'] }, ...range(49, 1).map((i) => ({ unlockingBytecode: { script: `unlock${i}` } }))] } },
      range(49, 1).reduce((agg, i) => ({ ...agg, [`unlock${i}`]: { script: `<0x00 ${i}>`, unlocks: `lock${i}` }, [`lock${i}`]: { lockingType: 'p2sh20', script: `<0x00 ${i}> OP_EQUAL` } }), {}),
    ],
    [
      `<0x${range(517)
        .map((i) => binToHex(Uint8Array.of(i)))
        .join('')}>`,
      `<<0x${range(517)
        .map((i) => binToHex(Uint8Array.of(i)))
        .join('')}>> <1> OP_INPUTBYTECODE OP_EQUAL OP_NIP`,
      'OP_INPUTBYTECODE (maximum size)',
      ['p2sh_ignore'],
    ],
    [
      `<0x${range(518)
        .map((i) => binToHex(Uint8Array.of(i)))
        .join('')}>`,
      `<<0x${range(518)
        .map((i) => binToHex(Uint8Array.of(i)))
        .join('')}>> <1> OP_INPUTBYTECODE OP_EQUAL OP_NIP`,
      'OP_INPUTBYTECODE (excessive size)',
      ['invalid', 'p2sh_ignore'],
    ],
    [
      `<1> <0x${range(511)
        .map((i) => binToHex(Uint8Array.of(i)))
        .join('')}>`,
      `OP_DROP <1> OP_INPUTBYTECODE OP_DROP`,
      'OP_INPUTBYTECODE (ignore result, not excessive size)',
    ],
    [
      `<1> <0x${range(518)
        .map((i) => binToHex(Uint8Array.of(i)))
        .join('')}>`,
      `OP_DROP <1> OP_INPUTBYTECODE OP_DROP`,
      'OP_INPUTBYTECODE (ignore result, excessive size)',
      ['invalid'],
    ],
    ['<0>', '<0> OP_INPUTSEQUENCENUMBER OP_EQUAL', 'OP_INPUTSEQUENCENUMBER (input 0)'],
    ['<0>', '<1> OP_INPUTSEQUENCENUMBER OP_EQUAL', 'OP_INPUTSEQUENCENUMBER (input 1)'],
    ['<1>', '<1> OP_INPUTSEQUENCENUMBER OP_EQUAL', 'OP_INPUTSEQUENCENUMBER (input 1, expected 1)', ['invalid']],
    ['<1>', '<1> OP_INPUTSEQUENCENUMBER OP_EQUAL', 'OP_INPUTSEQUENCENUMBER (input 1, 1)', [], { sourceOutputs: [{ lockingBytecode: ['slot'] }, { lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }, { sequenceNumber: 1, unlockingBytecode: { script: 'unlockEmptyP2sh20' } }] } }],
    [
      '<4294967295>',
      '<0> OP_INPUTSEQUENCENUMBER OP_EQUAL',
      'OP_INPUTSEQUENCENUMBER (input 0 sequence number: 4294967295; disables locktime support)',
      [],
      { sourceOutputs: [{ lockingBytecode: ['slot'] }, { lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 }], transaction: { inputs: [{ sequenceNumber: 4294967295, unlockingBytecode: ['slot'] }, { unlockingBytecode: { script: 'unlockEmptyP2sh20' } }] } },
    ],
    [
      '<4294967294>',
      '<1> OP_CHECKLOCKTIMEVERIFY OP_DROP <0> OP_INPUTSEQUENCENUMBER OP_EQUAL',
      'OP_INPUTSEQUENCENUMBER (input 0 sequence number: 4294967294; locktime not disabled)',
      [],
      {
        sourceOutputs: [{ lockingBytecode: ['slot'] }, { lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 }],
        transaction: {
          inputs: [{ sequenceNumber: 4294967294, unlockingBytecode: ['slot'] }, { unlockingBytecode: { script: 'unlockEmptyP2sh20' } }],
          locktime: 1,
        },
      },
    ],
    [
      '<4294967295>',
      '<1> OP_CHECKLOCKTIMEVERIFY OP_DROP <0> OP_INPUTSEQUENCENUMBER OP_EQUAL',
      'OP_INPUTSEQUENCENUMBER (input 0 sequence number: 4294967295; while locktime is not disabled for this transaction, it is disabled for input 0, causing a failure)',
      ['invalid'],
      {
        sourceOutputs: [{ lockingBytecode: ['slot'] }, { lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 }],
        transaction: {
          inputs: [{ sequenceNumber: 4294967295, unlockingBytecode: ['slot'] }, { unlockingBytecode: { script: 'unlockEmptyP2sh20' } }],
          locktime: 1,
        },
      },
    ],
    [
      '<4294967295>',
      '<1> OP_INPUTSEQUENCENUMBER OP_EQUAL',
      'OP_INPUTSEQUENCENUMBER (input 1 sequence number: 4294967295; disables locktime support)',
      [],
      { sourceOutputs: [{ lockingBytecode: ['slot'] }, { lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }, { sequenceNumber: 4294967295, unlockingBytecode: { script: 'unlockEmptyP2sh20' } }] } },
    ],
    [
      '<4294967294>',
      '<1> OP_CHECKLOCKTIMEVERIFY OP_DROP <1> OP_INPUTSEQUENCENUMBER OP_EQUAL',
      'OP_INPUTSEQUENCENUMBER (input 1 sequence number: 4294967294; locktime enabled)',
      [],
      { sourceOutputs: [{ lockingBytecode: ['slot'] }, { lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }, { sequenceNumber: 4294967294, unlockingBytecode: { script: 'unlockEmptyP2sh20' } }], locktime: 1 } },
    ],
    [
      '<4294967295>',
      '<1> OP_CHECKLOCKTIMEVERIFY OP_DROP <1> OP_INPUTSEQUENCENUMBER OP_EQUAL',
      'OP_INPUTSEQUENCENUMBER (input 1 sequence number: 4294967295; locktime is disabled for input 1, but remains enabled for input 0)',
      [],
      { sourceOutputs: [{ lockingBytecode: ['slot'] }, { lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }, { sequenceNumber: 4294967295, unlockingBytecode: { script: 'unlockEmptyP2sh20' } }], locktime: 1 } },
    ],
    ['<1>', '<0> OP_INPUTSEQUENCENUMBER OP_DROP', 'OP_INPUTSEQUENCENUMBER (ignore result, input 0)'],
    ['<1>', '<1> OP_INPUTSEQUENCENUMBER OP_DROP', 'OP_INPUTSEQUENCENUMBER (ignore result, input 1)'],
    ['<1>', '<0x0100> OP_INPUTSEQUENCENUMBER OP_DROP', 'OP_INPUTSEQUENCENUMBER (ignore result, input 1, non-minimally encoded)', ['invalid']],
    ['<1>', '<-1> OP_INPUTSEQUENCENUMBER OP_DROP', 'OP_INPUTSEQUENCENUMBER (ignore result, negative input)', ['invalid']],
    ['<1>', '<2> OP_INPUTSEQUENCENUMBER OP_DROP', 'OP_INPUTSEQUENCENUMBER (ignore result, input 2, greater than maximum input index)', ['invalid']],
    ['<1>', '<2> OP_INPUTSEQUENCENUMBER OP_DROP', 'OP_INPUTSEQUENCENUMBER (ignore result, input 2)', [], { sourceOutputs: [{ lockingBytecode: ['slot'] }, ...range(2).map(() => ({ lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 }))], transaction: { inputs: [{ unlockingBytecode: ['slot'] }, ...range(2).map(() => ({ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }))] } }],
    [
      '<42> <13> <3>',
      '<0> OP_INPUTSEQUENCENUMBER <0> OP_EQUALVERIFY <1> OP_INPUTSEQUENCENUMBER <1> OP_INPUTSEQUENCENUMBER OP_EQUALVERIFY <3> OP_INPUTSEQUENCENUMBER OP_EQUALVERIFY <13> OP_INPUTSEQUENCENUMBER OP_EQUALVERIFY <42> OP_INPUTSEQUENCENUMBER OP_EQUAL',
      'multiple OP_INPUTSEQUENCENUMBERs (50 inputs)',
      [],
      { sourceOutputs: [{ lockingBytecode: ['slot'] }, ...range(49, 1).map(() => ({ lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 }))], transaction: { inputs: [{ unlockingBytecode: ['slot'] }, ...range(49, 1).map((i) => ({ sequenceNumber: i, unlockingBytecode: { script: 'unlockEmptyP2sh20' } }))] } },
    ],
    ['<0>', '<0> OP_OUTPUTVALUE OP_EQUAL', 'OP_OUTPUTVALUE (output 0)'],
    ['<10_000>', '<0> OP_OUTPUTVALUE OP_EQUAL', 'OP_OUTPUTVALUE (output 0, expected 10_000)', ['invalid']],
    ['<10_000>', '<0> OP_OUTPUTVALUE OP_EQUAL', 'OP_OUTPUTVALUE (output 0, 10_000)', [], { transaction: { outputs: [{ valueSatoshis: 10_000 }] } }],
    ['<1>', '<0> OP_OUTPUTVALUE OP_DROP', 'OP_OUTPUTVALUE (ignore result, output 0)'],
    ['<1>', '<0x0000> OP_OUTPUTVALUE OP_DROP', 'OP_OUTPUTVALUE (ignore result, output 0, non-minimally encoded)', ['invalid']],
    ['<1>', '<-1> OP_OUTPUTVALUE OP_DROP', 'OP_OUTPUTVALUE (ignore result, negative output)', ['invalid'], { transaction: { outputs: [{ valueSatoshis: 10_000 }, { valueSatoshis: 10_001 }] } }],
    ['<1>', '<2> OP_OUTPUTVALUE OP_DROP', 'OP_OUTPUTVALUE (ignore result, output 2, greater than maximum output index)', ['invalid'], { transaction: { outputs: [{ valueSatoshis: 10_000 }, { valueSatoshis: 10_001 }] } }],
    ['<1>', '<2> OP_OUTPUTVALUE OP_DROP', 'OP_OUTPUTVALUE (ignore result, output 2)', [], { sourceOutputs: [simpleP2pkhOutput, { lockingBytecode: ['slot'], valueSatoshis: 100_000 }], transaction: { outputs: [{ valueSatoshis: 10_000 }, { valueSatoshis: 10_001 }, { valueSatoshis: 10_002 }] } }],
    [
      '<10_042> <10_013> <10_007> <10_001>',
      `<0> OP_OUTPUTVALUE <0> OP_OUTPUTVALUE OP_EQUALVERIFY <1> OP_OUTPUTVALUE OP_EQUALVERIFY <7> OP_OUTPUTVALUE OP_EQUALVERIFY <13> OP_OUTPUTVALUE OP_EQUALVERIFY <42> OP_OUTPUTVALUE OP_EQUAL`,
      'multiple OP_OUTPUTVALUEs (50 inputs)',
      [],
      { sourceOutputs: [simpleP2pkhOutput, { lockingBytecode: ['slot'], valueSatoshis: 1_000_000 }], transaction: { outputs: [...range(50).map((i) => ({ valueSatoshis: 10_000 + i }))] } },
    ],
    ['<123_456_789> <0>', 'OP_OUTPUTVALUE OP_EQUAL', 'OP_OUTPUTVALUE (1.23456789 BCH)', [], { sourceOutputs: [simpleP2pkhOutput, { lockingBytecode: ['slot'], valueSatoshis: 1_000_000_000 }], transaction: { outputs: [{ valueSatoshis: 123_456_789 }] } }],
    ['<2_100_000_000_000_000> <0>', 'OP_OUTPUTVALUE OP_EQUAL', 'OP_OUTPUTVALUE (21,000,000 BCH)', [], { sourceOutputs: [simpleP2pkhOutput, { lockingBytecode: ['slot'], valueSatoshis: 2_100_000_000_000_000 }], transaction: { outputs: [{ valueSatoshis: binToHex(bigIntToBinUint64LE(21_000_000n * 100_000_000n)) }] } }],
    ['<9223372036854775807> <0>', 'OP_OUTPUTVALUE OP_EQUAL', 'OP_OUTPUTVALUE (maximum VM Number satoshis)', [], { sourceOutputs: [simpleP2pkhOutput, { lockingBytecode: ['slot'], valueSatoshis: 'ffffffffffffff7f' }], transaction: { outputs: [{ valueSatoshis: binToHex(bigIntToBinUint64LE(9223372036854775807n)) }] } }],
    ['<9223372036854775808> <0>', 'OP_OUTPUTVALUE OP_EQUAL', 'OP_OUTPUTVALUE (9223372036854775808 satoshis, exceeds maximum VM Number)', ['invalid'], { transaction: { outputs: [{ valueSatoshis: binToHex(bigIntToBinUint64LE(9223372036854775808n)) }] } }],
    ['<OP_RETURN <"vmb_test">>', '<0> OP_OUTPUTBYTECODE OP_EQUAL', 'OP_OUTPUTBYTECODE (output 0)'],
    ['<OP_RETURN>', '<0> OP_OUTPUTBYTECODE OP_EQUAL', 'OP_OUTPUTBYTECODE (output 0, expected <OP_RETURN>)', ['invalid']],
    ['<OP_RETURN>', '<0> OP_OUTPUTBYTECODE OP_EQUAL', 'OP_OUTPUTBYTECODE (output 0, <OP_RETURN>)', [], { transaction: { outputs: [{ lockingBytecode: binToHex(cashAssemblyToBin('OP_RETURN') as Uint8Array), valueSatoshis: 10_000 }] } }],
    ['<OP_DROP OP_CODESEPARATOR <1>>', '<0> OP_CODESEPARATOR OP_OUTPUTBYTECODE OP_EQUAL', 'OP_OUTPUTBYTECODE, OP_CODESEPARATOR has no effect (output 0, <OP_DROP OP_CODESEPARATOR <1>>)', ['nonstandard'], { transaction: { outputs: [{ lockingBytecode: binToHex(cashAssemblyToBin('OP_DROP OP_CODESEPARATOR <1>') as Uint8Array), valueSatoshis: 10_000 }] } }],
    ['<1>', '<0> OP_OUTPUTBYTECODE OP_DROP', 'OP_OUTPUTBYTECODE (ignore result, output 0)'],
    ['<1>', '<0x0000> OP_OUTPUTBYTECODE OP_DROP', 'OP_OUTPUTBYTECODE (ignore result, output 0, non-minimally encoded)', ['invalid']],
    ['<1>', '<-1> OP_OUTPUTBYTECODE OP_DROP', 'OP_OUTPUTBYTECODE (ignore result, negative output index)', ['invalid'], { transaction: { outputs: [{ valueSatoshis: 10_000 }, { valueSatoshis: 10_001 }] } }],
    ['<1>', '<2> OP_OUTPUTBYTECODE OP_DROP', 'OP_OUTPUTBYTECODE (ignore result, output 2, greater than maximum output index)', ['invalid'], { transaction: { outputs: [{ valueSatoshis: 10_000 }, { valueSatoshis: 10_001 }] } }],
    ['<1>', '<2> OP_OUTPUTBYTECODE OP_DROP', 'OP_OUTPUTBYTECODE (ignore result, output 2)', [], { sourceOutputs: [simpleP2pkhOutput, { lockingBytecode: ['slot'], valueSatoshis: 100_000 }], transaction: { outputs: [{ valueSatoshis: 10_000 }, { valueSatoshis: 10_001 }, { valueSatoshis: 10_002 }] } }],
    [
      '<OP_RETURN <42>> <OP_RETURN <13>> <OP_RETURN <7>> <OP_RETURN <1>>',
      `<0> OP_OUTPUTBYTECODE <0> OP_OUTPUTBYTECODE OP_EQUALVERIFY <1> OP_OUTPUTBYTECODE OP_EQUALVERIFY <7> OP_OUTPUTBYTECODE OP_EQUALVERIFY <13> OP_OUTPUTBYTECODE OP_EQUALVERIFY <42> OP_OUTPUTBYTECODE OP_EQUAL`,
      'multiple OP_OUTPUTBYTECODEs (50 inputs)',
      [],
      { sourceOutputs: [simpleP2pkhOutput, { lockingBytecode: ['slot'], valueSatoshis: 100_000_000 }], transaction: { outputs: [...range(50).map((i) => ({ lockingBytecode: binToHex(cashAssemblyToBin(`OP_RETURN <${i}>`) as Uint8Array), valueSatoshis: 10_000 + i }))] } },
    ],
    [
      `<OP_RETURN <0x${range(516)
        .map((i) => binToHex(Uint8Array.of(i)))
        .join('')}>>`,
      `<0> OP_OUTPUTBYTECODE OP_EQUAL`,
      'OP_OUTPUTBYTECODE (maximum size)',
      ['nonstandard'],
      {
        transaction: {
          outputs: [
            {
              lockingBytecode: binToHex(
                cashAssemblyToBin(
                  `OP_RETURN <0x${range(516)
                    .map((i) => binToHex(Uint8Array.of(i)))
                    .join('')}>`,
                ) as Uint8Array,
              ),
            },
          ],
        },
      },
    ],
    [
      `<OP_RETURN <0x${range(517)
        .map((i) => binToHex(Uint8Array.of(i)))
        .join('')}>>`,
      `<0> OP_OUTPUTBYTECODE OP_EQUAL`,
      'OP_OUTPUTBYTECODE (excessive size)',
      ['invalid'],
      {
        transaction: {
          outputs: [
            {
              lockingBytecode: binToHex(
                cashAssemblyToBin(
                  `OP_RETURN <0x${range(517)
                    .map((i) => binToHex(Uint8Array.of(i)))
                    .join('')}>`,
                ) as Uint8Array,
              ),
            },
          ],
        },
      },
    ],
    [
      `<1>`,
      `<0> OP_OUTPUTBYTECODE OP_DROP`,
      'OP_OUTPUTBYTECODE (ignore result, not excessive size)',
      ['nonstandard'],
      {
        transaction: {
          outputs: [
            {
              lockingBytecode: binToHex(
                cashAssemblyToBin(
                  `OP_RETURN <0x${range(516)
                    .map((i) => binToHex(Uint8Array.of(i)))
                    .join('')}>`,
                ) as Uint8Array,
              ),
            },
          ],
        },
      },
    ],
    [
      `<1>`,
      `<0> OP_OUTPUTBYTECODE OP_DROP`,
      'OP_OUTPUTBYTECODE (ignore result, excessive size)',
      ['invalid'],
      {
        transaction: {
          outputs: [
            {
              lockingBytecode: binToHex(
                cashAssemblyToBin(
                  `OP_RETURN <0x${range(517)
                    .map((i) => binToHex(Uint8Array.of(i)))
                    .join('')}>`,
                ) as Uint8Array,
              ),
            },
          ],
        },
      },
    ],
  ],
];
