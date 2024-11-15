import type { VmbTestDefinitionGroup } from '../../lib.js';
import { notTests } from '../bch-vmb-test-mixins.bigint.js';
import { mapTestCases, setExpectedResults } from '../bch-vmb-test-utils.js';

export default [
  [
    'BigInt',
    [
      ...setExpectedResults(mapTestCases(['<$1>', '<$0> OP_NOT OP_EQUAL', 'OP_NOT $0'], notTests, { prefixAsHexLiterals: true }), {
        'OP_NOT 1-byte number (all bits set)': [],
        'OP_NOT 1-byte number (alternating bits set)': [],
        'OP_NOT 1-byte number (highest-bit set)': [],
        'OP_NOT 1-byte number (one bit set per byte)': ['skip'],
        'OP_NOT 4096-byte number (all bits set)': ['chip_bigint', 'nonstandard'],
        'OP_NOT 4096-byte number (alternating bits set)': ['chip_bigint', 'nonstandard'],
        'OP_NOT 4096-byte number (highest-bit set)': ['chip_bigint', 'nonstandard'],
        'OP_NOT 4096-byte number (one bit set per byte)': ['chip_bigint', 'nonstandard'],
        'OP_NOT 512-byte number (all bits set)': ['chip_bigint'],
        'OP_NOT 512-byte number (alternating bits set)': ['chip_bigint'],
        'OP_NOT 512-byte number (highest-bit set)': ['chip_bigint'],
        'OP_NOT 512-byte number (one bit set per byte)': ['chip_bigint'],
        'OP_NOT 64-byte number (all bits set)': ['chip_bigint'],
        'OP_NOT 64-byte number (alternating bits set)': ['chip_bigint'],
        'OP_NOT 64-byte number (highest-bit set)': ['chip_bigint'],
        'OP_NOT 64-byte number (one bit set per byte)': ['chip_bigint'],
        'OP_NOT 8-byte number (all bits set)': [],
        'OP_NOT 8-byte number (alternating bits set)': [],
        'OP_NOT 8-byte number (highest-bit set)': [],
        'OP_NOT 8-byte number (one bit set per byte)': [],
        'OP_NOT 8192-byte number (all bits set)': ['chip_bigint', 'nonstandard'],
        'OP_NOT 8192-byte number (alternating bits set)': ['chip_bigint', 'nonstandard'],
        'OP_NOT 8192-byte number (highest-bit set)': ['chip_bigint', 'nonstandard'],
        'OP_NOT 8192-byte number (one bit set per byte)': ['chip_bigint', 'nonstandard'],
      }),
    ],
  ],
] as const satisfies VmbTestDefinitionGroup[];
