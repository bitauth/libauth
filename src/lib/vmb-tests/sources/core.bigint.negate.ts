import type { VmbTestDefinitionGroup } from '../../lib.js';
import { negateTests } from '../bch-vmb-test-mixins.bigint.js';
import { mapTestCases, setExpectedResults } from '../bch-vmb-test-utils.js';

export default [
  [
    'BigInt',
    [
      ...setExpectedResults(mapTestCases(['<0x$1>', '<0x$0> OP_NEGATE OP_EQUAL', 'OP_NEGATE $0'], negateTests), {
        'OP_NEGATE 1-byte number (all bits set)': [],
        'OP_NEGATE 1-byte number (alternating bits set)': [],
        'OP_NEGATE 1-byte number (highest-bit set)': [],
        'OP_NEGATE 1-byte number (one bit set per byte)': ['skip'],
        'OP_NEGATE 4096-byte number (all bits set)': ['p2s_nonstandard', '2023_invalid', '2025_p2sh_nonstandard'],
        'OP_NEGATE 4096-byte number (alternating bits set)': ['p2s_nonstandard', '2023_invalid', '2025_p2sh_nonstandard'],
        'OP_NEGATE 4096-byte number (highest-bit set)': ['p2s_nonstandard', '2023_invalid', '2025_p2sh_nonstandard'],
        'OP_NEGATE 4096-byte number (one bit set per byte)': ['p2s_nonstandard', '2023_invalid', '2025_p2sh_nonstandard'],
        'OP_NEGATE 512-byte number (all bits set)': ['p2s_nonstandard', '2023_invalid'],
        'OP_NEGATE 512-byte number (alternating bits set)': ['p2s_nonstandard', '2023_invalid'],
        'OP_NEGATE 512-byte number (highest-bit set)': ['p2s_nonstandard', '2023_invalid'],
        'OP_NEGATE 512-byte number (one bit set per byte)': ['p2s_nonstandard', '2023_invalid'],
        'OP_NEGATE 64-byte number (all bits set)': ['2023_invalid'],
        'OP_NEGATE 64-byte number (alternating bits set)': ['2023_invalid'],
        'OP_NEGATE 64-byte number (highest-bit set)': ['2023_invalid'],
        'OP_NEGATE 64-byte number (one bit set per byte)': ['2023_invalid'],
        'OP_NEGATE 8-byte number (all bits set)': [],
        'OP_NEGATE 8-byte number (alternating bits set)': [],
        'OP_NEGATE 8-byte number (highest-bit set)': [],
        'OP_NEGATE 8-byte number (one bit set per byte)': [],
        'OP_NEGATE 8192-byte number (all bits set)': ['nonstandard', 'p2sh_invalid', '2023_invalid'],
        'OP_NEGATE 8192-byte number (alternating bits set)': ['nonstandard', 'p2sh_invalid', '2023_invalid'],
        'OP_NEGATE 8192-byte number (highest-bit set)': ['nonstandard', 'p2sh_invalid', '2023_invalid'],
        'OP_NEGATE 8192-byte number (one bit set per byte)': ['nonstandard', 'p2sh_invalid', '2023_invalid'],
      }),
    ],
  ],
] as const satisfies VmbTestDefinitionGroup[];
