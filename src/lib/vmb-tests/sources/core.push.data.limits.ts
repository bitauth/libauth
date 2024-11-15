import type { VmbTestDefinitionGroup } from '../../lib.js';
import { generateTestCases, setExpectedResults } from '../bch-vmb-test-utils.js';

export default [
  [
    'PUSHDATA limits',
    [
      ...setExpectedResults(
        generateTestCases(
          ['OP_PUSHDATA_2 $0 $(<0> <$0> OP_NUM2BIN)', 'OP_SIZE <$0> OP_EQUAL OP_NIP', 'OP_PUSHDATA_2 $0'],
          [
            [
              ['520 bytes', '520'],
              ['521 bytes', '521'],
              ['1,640 bytes', '1_640'],
              ['1,641 bytes', '1_641'],
              ['9,990 bytes', '9_990'],
              ['9,991 bytes', '9_991'],
              ['9,997 bytes', '9_997'],
              ['9,998 bytes', '9_998'],
              ['10,000 bytes', '10_000'],
            ],
          ],
        ),
        {
          'OP_PUSHDATA_2 1,640 bytes': ['2023_invalid'],
          'OP_PUSHDATA_2 1,641 bytes': ['nonstandard', '2023_invalid'],
          'OP_PUSHDATA_2 10,000 bytes': ['invalid'],
          'OP_PUSHDATA_2 520 bytes': [],
          'OP_PUSHDATA_2 521 bytes': ['2023_invalid'],
          'OP_PUSHDATA_2 9,990 bytes': ['nonstandard', '2023_invalid'],
          'OP_PUSHDATA_2 9,991 bytes': ['2023_invalid', 'p2sh_invalid'],
          'OP_PUSHDATA_2 9,997 bytes': ['2023_invalid', 'p2sh_invalid'],
          'OP_PUSHDATA_2 9,998 bytes': ['invalid'],
        },
      ),

      ['OP_PUSHDATA_2 0xffff $(<0> <65535> OP_NUM2BIN)', 'OP_SIZE <65535> OP_EQUAL OP_NIP', 'Max OP_PUSHDATA_2 in unlocking bytecode', ['invalid', 'spec']],
      ['OP_PUSHDATA_4 0x00000100 $(<0> <65536> OP_NUM2BIN)', 'OP_SIZE <65536> OP_EQUAL OP_NIP', 'Min OP_PUSHDATA_4 in unlocking bytecode', ['invalid', 'spec']],
    ],
  ],
] as const satisfies VmbTestDefinitionGroup[];
