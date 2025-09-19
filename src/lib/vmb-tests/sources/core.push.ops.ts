import type { VmbTestDefinitionGroup } from '../../lib.js';
import { generateTestCases, setExpectedResults } from '../bch-vmb-test-utils.js';

export default [
  [
    'Operations which push to the stack',
    [
      ...setExpectedResults(
        generateTestCases(
          ['<0> <$0>', 'OP_NUM2BIN OP_TOALTSTACK OP_FROMALTSTACK OP_SIZE <$0> OP_EQUAL OP_NIP', 'OP_TOALTSTACK/OP_FROMALTSTACK $0'],
          [
            [
              ['520 bytes', '520'],
              ['521 bytes', '521'],
              ['10,000 bytes', '10_000'],
              ['10,001 bytes', '10_001'],
            ],
          ],
        ),
        {
          'OP_TOALTSTACK/OP_FROMALTSTACK 10,000 bytes': ['2023_invalid'],
          'OP_TOALTSTACK/OP_FROMALTSTACK 10,001 bytes': ['invalid'],
          'OP_TOALTSTACK/OP_FROMALTSTACK 520 bytes': [],
          'OP_TOALTSTACK/OP_FROMALTSTACK 521 bytes': ['2023_invalid'],
        },
      ),
    ],
  ],
] as const satisfies VmbTestDefinitionGroup[];
