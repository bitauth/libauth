import type { VmbTestDefinitionGroup } from '../../lib.js';
import { add1Tests } from '../bch-vmb-test-mixins.bigint.js';
import { mapTestCases, setExpectedResults } from '../bch-vmb-test-utils.js';

export default [
  [
    'BigInt',
    [
      ...setExpectedResults(mapTestCases(['<0x$1>', '<0x$0> OP_1ADD OP_EQUAL', 'OP_1ADD $0'], add1Tests), {
        'OP_1ADD 1-byte number (all bits set)': [],
        'OP_1ADD 1-byte number (alternating bits set)': [],
        'OP_1ADD 1-byte number (highest-bit set)': [],
        'OP_1ADD 1-byte number (one bit set per byte)': ['skip'],
        'OP_1ADD 4096-byte number (all bits set)': ['chip_bigint', 'nonstandard'],
        'OP_1ADD 4096-byte number (alternating bits set)': ['chip_bigint', 'nonstandard'],
        'OP_1ADD 4096-byte number (highest-bit set)': ['chip_bigint', 'nonstandard'],
        'OP_1ADD 4096-byte number (one bit set per byte)': ['chip_bigint', 'nonstandard'],
        'OP_1ADD 512-byte number (all bits set)': ['chip_bigint'],
        'OP_1ADD 512-byte number (alternating bits set)': ['chip_bigint'],
        'OP_1ADD 512-byte number (highest-bit set)': ['chip_bigint'],
        'OP_1ADD 512-byte number (one bit set per byte)': ['chip_bigint'],
        'OP_1ADD 64-byte number (all bits set)': ['chip_bigint'],
        'OP_1ADD 64-byte number (alternating bits set)': ['chip_bigint'],
        'OP_1ADD 64-byte number (highest-bit set)': ['chip_bigint'],
        'OP_1ADD 64-byte number (one bit set per byte)': ['chip_bigint'],
        'OP_1ADD 8-byte number (all bits set)': [],
        'OP_1ADD 8-byte number (alternating bits set)': [],
        'OP_1ADD 8-byte number (highest-bit set)': [],
        'OP_1ADD 8-byte number (one bit set per byte)': [],
        'OP_1ADD 8192-byte number (all bits set)': ['chip_bigint', 'nonstandard', 'p2sh_invalid'],
        'OP_1ADD 8192-byte number (alternating bits set)': ['chip_bigint', 'nonstandard', 'p2sh_invalid'],
        'OP_1ADD 8192-byte number (highest-bit set)': ['chip_bigint', 'nonstandard', 'p2sh_invalid'],
        'OP_1ADD 8192-byte number (one bit set per byte)': ['chip_bigint', 'nonstandard', 'p2sh_invalid'],
      }),
    ],
  ],
] as const satisfies VmbTestDefinitionGroup[];
