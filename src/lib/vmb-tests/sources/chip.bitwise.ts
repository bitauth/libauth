import type { VmbTestDefinitionGroup } from '../../lib.js';

export default [
  // TODO: boundaries, generated tests, ['Transaction validation benchmarks', []],
  [
    'OP_INVERT',
    [
      [`<0>`, `OP_INVERT <0> OP_EQUAL`, 'Empty item (0)', ['chip_bitwise']],
      [`<1>`, `OP_INVERT <0> OP_EQUAL`, '<1> OP_INVERT <0> OP_EQUAL (reject)', ['chip_bitwise_invalid']],
      [`<0x00>`, `OP_INVERT <0xff> OP_EQUAL`, '0x00 -> 0xff', ['chip_bitwise']],
      [`<0x00>`, `OP_INVERT <0x00> OP_EQUAL`, '<0x00> OP_INVERT <0x00> OP_EQUAL', ['chip_bitwise_invalid']],
      [`<0xff>`, `OP_INVERT <0x00> OP_EQUAL`, '0xff -> 0x00', ['chip_bitwise']],
      [`<0x12345678>`, `OP_INVERT <0xedcba987> OP_EQUAL`, '0x12345678 -> 0xedcba987', ['chip_bitwise']],
      [`<0xdeadbeef>`, `OP_INVERT <0x21524110> OP_EQUAL`, '0xdeadbeef -> 0x21524110', ['chip_bitwise']],
    ],
  ],
  [
    'OP_LSHIFTNUM',
    [
      [`<1> <1>`, `OP_LSHIFTNUM <2> OP_EQUAL`, '1 << 1 == 2', ['chip_bitwise']],
      [`<1> <1>`, `OP_LSHIFTNUM <1> OP_EQUAL`, '1 << 1 == 1 (reject)', ['chip_bitwise_invalid']],
      [`<1> <0>`, `OP_LSHIFTNUM <1> OP_EQUAL`, '1 << 0 == 1', ['chip_bitwise']],
      [`<0> <0>`, `OP_LSHIFTNUM <0> OP_EQUAL`, '0 << 0 == 0', ['chip_bitwise']],
      [`<0> <-1>`, `OP_LSHIFTNUM <1> OP_EQUAL`, '0 << -1 == 0', ['chip_bitwise_invalid']],
      [`<1> <-1>`, `OP_LSHIFTNUM <1> OP_EQUAL`, '1 << -1 == 0', ['chip_bitwise_invalid']],
      [`<1> <-1>`, `OP_LSHIFTNUM <1> OP_EQUAL`, '1 << -1 == -1', ['chip_bitwise_invalid']],
      [`<1000> <0>`, `OP_LSHIFTNUM <1000> OP_EQUAL`, '1000 << 0 == 1000', ['chip_bitwise']],
      [`<-1> <1>`, `OP_LSHIFTNUM <-2> OP_EQUAL`, '-1 << 1 == -2', ['chip_bitwise']],
      [`<128> <8>`, `OP_LSHIFTNUM <32768> OP_EQUAL`, '128 << 8 = 32768', ['chip_bitwise']],
      [`<1> <8>`, `OP_LSHIFTNUM <256> OP_EQUAL`, '1 << 8 = 256', ['chip_bitwise']],
      [`<1> <16>`, `OP_LSHIFTNUM <65536> OP_EQUAL`, '1 << 16 = 65536', ['chip_bitwise']],
      [`<0> <80000>`, `OP_LSHIFTNUM <0> OP_EQUAL`, '0 << 80000 == 0', ['chip_bitwise']],
      [`<0> <80001>`, `OP_LSHIFTNUM <0> OP_EQUAL`, '0 << 80001 == 0 (reject)', ['chip_bitwise_invalid']],
    ],
  ],
  [
    'OP_LSHIFTBIN',
    [
      // TODO: fail shifts longer than binary_data length?
      [`<0> <80000>`, `OP_LSHIFTNUM <0> OP_EQUAL`, '0 << 80000 == 0', ['chip_bitwise']],
      [`<0> <80001>`, `OP_LSHIFTNUM <0> OP_EQUAL`, '0 << 80001 == 0 (reject)', ['chip_bitwise_invalid']],
      [`<0b00110100_01111011> <1>`, `OP_LSHIFTBIN <0b01101000_11110110> OP_EQUAL`, '1 bit', ['chip_bitwise']],
      [`<0b00110100_01111011> <2>`, `OP_LSHIFTBIN <0b1101000_111101100> OP_EQUAL`, '2 bits', ['chip_bitwise']],
      [`<0b00110100_01111011> <3>`, `OP_LSHIFTBIN <0b1010001_111011000> OP_EQUAL`, '3 bits', ['chip_bitwise']],
      [`<0b00110100_01111011> <3>`, `OP_LSHIFTBIN <0b1010001_111011000> OP_EQUAL`, '3 bits', ['chip_bitwise']],
    ],
  ],
] as const satisfies VmbTestDefinitionGroup[];
