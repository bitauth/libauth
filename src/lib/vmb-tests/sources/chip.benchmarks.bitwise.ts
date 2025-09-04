import type { VmbTestDefinitionGroup } from '../../lib.js';
// import { packedTransactionScenario } from '../bch-vmb-test-mixins.js';

const maxNumberBase = '<0> <9999> OP_NUM2BIN OP_INVERT';
const maxNumberSuffix = '<0x7f> OP_CAT';
const maxNumber = `${maxNumberBase} ${maxNumberSuffix}`;
const minNumber = '<0> <10000> OP_NUM2BIN OP_INVERT';
const minNumberMaxNumber = `${maxNumberBase} OP_DUP <0xff> OP_CAT OP_SWAP  ${maxNumberSuffix}`;

export default [
  [
    'Transaction validation benchmarks',
    [
      ['', '<0> <8049> OP_NUM2BIN OP_INVERT OP_INVERT OP_INVERT', 'max-cost OP_INVERT', ['chip_bitwise', 'p2sh_ignore']],
      // ['', '<0> <8049> OP_NUM2BIN OP_INVERT OP_INVERT OP_INVERT', 'max-cost OP_INVERT, packed inputs', ['chip_bitwise', 'p2sh_ignore'], packedTransactionScenario('p2s', 2437)],
      [``, `<0> <10000> OP_NUM2BIN OP_BEGIN OP_INVERT <0> OP_UNTIL`, 'infinite loop of OP_INVERT', ['chip_bitwise_invalid', 'p2sh_ignore']],
      ['', '<0> <79998> OP_LSHIFTNUM OP_DROP <1> <48366> OP_LSHIFTNUM', 'max-cost OP_LSHIFTNUM', ['chip_bitwise', 'p2sh_ignore']],
      // ['', '<1> <79998> OP_LSHIFTNUM OP_DROP <1> <48366> OP_LSHIFTNUM', 'max-cost OP_LSHIFTNUM, packed inputs', ['chip_bitwise', 'p2sh_ignore'], packedTransactionScenario('p2s', 2437)],
      ['', `<1> ${minNumber} OP_LSHIFTNUM`, ' invalid OP_LSHIFTNUM (by min_number)', ['chip_bitwise_invalid', 'p2sh_ignore']],
      ['', 'OP_BEGIN <1> <79998> OP_LSHIFTNUM <0> OP_UNTIL', 'infinite loop of max OP_LSHIFTNUM (1 << 79998)', ['chip_bitwise_invalid', 'p2sh_ignore']],
      ['', 'OP_BEGIN <0> <18446744073709551615> OP_LSHIFTNUM <0> OP_UNTIL', 'infinite loop of max OP_LSHIFTNUM (0 << 18446744073709551615)', ['chip_bitwise_invalid', 'p2sh_ignore']],
      ['', 'OP_BEGIN <1> <18446744073709551615> OP_LSHIFTNUM <0> OP_UNTIL', 'infinite loop of max OP_LSHIFTNUM (1 << 18446744073709551615)', ['chip_bitwise_invalid', 'p2sh_ignore']],
      ['', `OP_BEGIN <0> ${maxNumber} OP_LSHIFTNUM <0> OP_UNTIL`, 'infinite loop of max OP_LSHIFTNUM (0 << max_number)', ['chip_bitwise_invalid', 'p2sh_ignore']],
      ['', `OP_BEGIN <1> ${maxNumber} OP_LSHIFTNUM <0> OP_UNTIL`, 'infinite loop of max OP_LSHIFTNUM (1 << max_number)', ['chip_bitwise_invalid', 'p2sh_ignore']],
      ['', `OP_BEGIN <0> ${maxNumber} OP_DUP OP_LSHIFTNUM <0> OP_UNTIL`, 'infinite loop of max OP_LSHIFTNUM (max_number << max_number)', ['chip_bitwise_invalid', 'p2sh_ignore']],
      ['', `OP_BEGIN <1> ${minNumberMaxNumber} OP_LSHIFTNUM <0> OP_UNTIL`, 'infinite loop of max OP_LSHIFTNUM (min_number << max_number)', ['chip_bitwise_invalid', 'p2sh_ignore']],
      // ['<$(<0> <10> OP_NUM2BIN)>', `OP_DROP ${maxNumber} OP_DUP OP_RSHIFTNUM <0> OP_EQUAL`, 'max-cost OP_RSHIFTNUM (max_number >> max_number), packed inputs', ['chip_bitwise', 'p2sh_ignore'], packedTransactionScenario('p2s', 1921)],
      ['<$(<0> <23> OP_NUM2BIN)>', `OP_DROP ${minNumberMaxNumber} OP_RSHIFTNUM <-1> OP_EQUAL`, 'max-cost OP_RSHIFTNUM (min_number >> max_number)', ['chip_bitwise', 'p2sh_ignore']],
      ['', `<0> ${maxNumber} OP_RSHIFTNUM <0> OP_EQUAL`, 'max-cost OP_RSHIFTNUM (0 >> max_number)', ['chip_bitwise', 'p2sh_ignore']],
      // ['', `<0> ${maxNumber} OP_RSHIFTNUM <0> OP_EQUAL`, 'max-cost OP_RSHIFTNUM (0 >> max_number), packed inputs', ['chip_bitwise', 'p2sh_ignore'], packedTransactionScenario('p2s', 2437)],
      ['', `OP_BEGIN <0> ${maxNumber} OP_RSHIFTNUM <0> OP_UNTIL`, 'infinite loop of max OP_RSHIFTNUM (0 >> max_number)', ['chip_bitwise_invalid', 'p2sh_ignore']],
      ['', `OP_BEGIN <0> ${minNumber} OP_RSHIFTNUM <0> OP_UNTIL`, 'infinite loop of max OP_RSHIFTNUM (0 >> minNumber)', ['chip_bitwise_invalid', 'p2sh_ignore']],
    ],
  ],
] as const satisfies VmbTestDefinitionGroup[];
