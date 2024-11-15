import type { VmbTestDefinitionGroup } from '../../lib.js';
import { ternaryOpcodes } from '../bch-vmb-test-mixins.bigint.js';
import { repeat } from '../bch-vmb-test-mixins.js';
import { generateTestCases, setExpectedResults } from '../bch-vmb-test-utils.js';

export default [
  [
    'BigInt ternary operation limits',
    [
      ...setExpectedResults(
        generateTestCases(
          [`<${repeat('$1', 625)}>`, `${repeat('OP_DUP OP_CAT', 4)} $2 $0`, '$2 $0, 10,000 bytes of $1'],
          [
            ternaryOpcodes,
            [
              ['0x00', '0x00'],
              ['0x7f', '0x7f'],
              ['0x80', '0x80'],
              ['0xff', '0xff'],
            ],
            [
              ['OP_BIN2NUM OP_DUP OP_DUP', 'OP_BIN2NUM OP_DUP OP_DUP'],
              ['OP_BIN2NUM OP_DUP OP_DUP OP_NEGATE', 'OP_BIN2NUM OP_DUP OP_DUP OP_NEGATE'],
              ['OP_BIN2NUM OP_DUP OP_DUP OP_ABS', 'OP_BIN2NUM OP_DUP OP_DUP OP_ABS'],
              ['OP_BIN2NUM OP_DUP OP_DUP OP_1ADD', 'OP_BIN2NUM OP_DUP OP_DUP OP_1ADD'],
              ['OP_BIN2NUM OP_DUP OP_DUP OP_1SUB', 'OP_BIN2NUM OP_DUP OP_DUP OP_1SUB'],
              ['OP_BIN2NUM OP_DUP <0>', 'OP_BIN2NUM OP_DUP <0>'],
              ['OP_BIN2NUM OP_DUP <1>', 'OP_BIN2NUM OP_DUP <1>'],
            ],
          ],
        ),
        {
          'OP_BIN2NUM OP_DUP <0> OP_WITHIN, 10,000 bytes of 0x00': ['invalid'],
          'OP_BIN2NUM OP_DUP <0> OP_WITHIN, 10,000 bytes of 0x7f': ['invalid'],
          'OP_BIN2NUM OP_DUP <0> OP_WITHIN, 10,000 bytes of 0x80': ['2023_invalid'],
          'OP_BIN2NUM OP_DUP <0> OP_WITHIN, 10,000 bytes of 0xff': ['2023_invalid'],
          'OP_BIN2NUM OP_DUP <1> OP_WITHIN, 10,000 bytes of 0x00': ['2023_invalid'],
          'OP_BIN2NUM OP_DUP <1> OP_WITHIN, 10,000 bytes of 0x7f': ['invalid'],
          'OP_BIN2NUM OP_DUP <1> OP_WITHIN, 10,000 bytes of 0x80': ['2023_invalid'],
          'OP_BIN2NUM OP_DUP <1> OP_WITHIN, 10,000 bytes of 0xff': ['2023_invalid'],
          'OP_BIN2NUM OP_DUP OP_DUP OP_1ADD OP_WITHIN, 10,000 bytes of 0x00': ['2023_invalid'],
          'OP_BIN2NUM OP_DUP OP_DUP OP_1ADD OP_WITHIN, 10,000 bytes of 0x7f': ['2023_invalid'],
          'OP_BIN2NUM OP_DUP OP_DUP OP_1ADD OP_WITHIN, 10,000 bytes of 0x80': ['2023_invalid'],
          'OP_BIN2NUM OP_DUP OP_DUP OP_1ADD OP_WITHIN, 10,000 bytes of 0xff': ['2023_invalid'],
          'OP_BIN2NUM OP_DUP OP_DUP OP_1SUB OP_WITHIN, 10,000 bytes of 0x00': ['invalid'],
          'OP_BIN2NUM OP_DUP OP_DUP OP_1SUB OP_WITHIN, 10,000 bytes of 0x7f': ['invalid'],
          'OP_BIN2NUM OP_DUP OP_DUP OP_1SUB OP_WITHIN, 10,000 bytes of 0x80': ['invalid'],
          'OP_BIN2NUM OP_DUP OP_DUP OP_1SUB OP_WITHIN, 10,000 bytes of 0xff': ['invalid'],
          'OP_BIN2NUM OP_DUP OP_DUP OP_ABS OP_WITHIN, 10,000 bytes of 0x00': ['invalid'],
          'OP_BIN2NUM OP_DUP OP_DUP OP_ABS OP_WITHIN, 10,000 bytes of 0x7f': ['invalid'],
          'OP_BIN2NUM OP_DUP OP_DUP OP_ABS OP_WITHIN, 10,000 bytes of 0x80': ['2023_invalid'],
          'OP_BIN2NUM OP_DUP OP_DUP OP_ABS OP_WITHIN, 10,000 bytes of 0xff': ['2023_invalid'],
          'OP_BIN2NUM OP_DUP OP_DUP OP_NEGATE OP_WITHIN, 10,000 bytes of 0x00': ['invalid'],
          'OP_BIN2NUM OP_DUP OP_DUP OP_NEGATE OP_WITHIN, 10,000 bytes of 0x7f': ['invalid'],
          'OP_BIN2NUM OP_DUP OP_DUP OP_NEGATE OP_WITHIN, 10,000 bytes of 0x80': ['2023_invalid'],
          'OP_BIN2NUM OP_DUP OP_DUP OP_NEGATE OP_WITHIN, 10,000 bytes of 0xff': ['2023_invalid'],
          'OP_BIN2NUM OP_DUP OP_DUP OP_WITHIN, 10,000 bytes of 0x00': ['invalid'],
          'OP_BIN2NUM OP_DUP OP_DUP OP_WITHIN, 10,000 bytes of 0x7f': ['invalid'],
          'OP_BIN2NUM OP_DUP OP_DUP OP_WITHIN, 10,000 bytes of 0x80': ['invalid'],
          'OP_BIN2NUM OP_DUP OP_DUP OP_WITHIN, 10,000 bytes of 0xff': ['invalid'],
        },
      ),
    ],
  ],
] as const satisfies VmbTestDefinitionGroup[];
