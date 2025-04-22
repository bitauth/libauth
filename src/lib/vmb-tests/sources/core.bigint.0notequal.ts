import type { VmbTestDefinitionGroup } from '../../lib.js';
import { zeroNotEqualTests } from '../bch-vmb-test-mixins.bigint.js';
import { mapTestCases, setExpectedResults } from '../bch-vmb-test-utils.js';

export default [
  [
    'BigInt',
    [
      ...setExpectedResults(mapTestCases(['<$1>', '<$0> OP_0NOTEQUAL OP_EQUAL', 'OP_0NOTEQUAL $0'], zeroNotEqualTests, { prefixAsHexLiterals: true }), {
        'OP_0NOTEQUAL 1-byte number (all bits set)': [],
        'OP_0NOTEQUAL 1-byte number (alternating bits set)': [],
        'OP_0NOTEQUAL 1-byte number (highest-bit set)': [],
        'OP_0NOTEQUAL 1-byte number (one bit set per byte)': ['skip'],
        'OP_0NOTEQUAL 4096-byte number (all bits set)': ['p2s_nonstandard', '2023_invalid', '2025_p2sh_nonstandard'],
        'OP_0NOTEQUAL 4096-byte number (alternating bits set)': ['p2s_nonstandard', '2023_invalid', '2025_p2sh_nonstandard'],
        'OP_0NOTEQUAL 4096-byte number (highest-bit set)': ['p2s_nonstandard', '2023_invalid', '2025_p2sh_nonstandard'],
        'OP_0NOTEQUAL 4096-byte number (one bit set per byte)': ['p2s_nonstandard', '2023_invalid', '2025_p2sh_nonstandard'],
        'OP_0NOTEQUAL 512-byte number (all bits set)': ['p2s_nonstandard', '2023_invalid'],
        'OP_0NOTEQUAL 512-byte number (alternating bits set)': ['p2s_nonstandard', '2023_invalid'],
        'OP_0NOTEQUAL 512-byte number (highest-bit set)': ['p2s_nonstandard', '2023_invalid'],
        'OP_0NOTEQUAL 512-byte number (one bit set per byte)': ['p2s_nonstandard', '2023_invalid'],
        'OP_0NOTEQUAL 64-byte number (all bits set)': ['2023_invalid'],
        'OP_0NOTEQUAL 64-byte number (alternating bits set)': ['2023_invalid'],
        'OP_0NOTEQUAL 64-byte number (highest-bit set)': ['2023_invalid'],
        'OP_0NOTEQUAL 64-byte number (one bit set per byte)': ['2023_invalid'],
        'OP_0NOTEQUAL 8-byte number (all bits set)': [],
        'OP_0NOTEQUAL 8-byte number (alternating bits set)': [],
        'OP_0NOTEQUAL 8-byte number (highest-bit set)': [],
        'OP_0NOTEQUAL 8-byte number (one bit set per byte)': [],
        'OP_0NOTEQUAL 8192-byte number (all bits set)': ['p2s_nonstandard', '2023_invalid', '2025_p2sh_nonstandard'],
        'OP_0NOTEQUAL 8192-byte number (alternating bits set)': ['p2s_nonstandard', '2023_invalid', '2025_p2sh_nonstandard'],
        'OP_0NOTEQUAL 8192-byte number (highest-bit set)': ['p2s_nonstandard', '2023_invalid', '2025_p2sh_nonstandard'],
        'OP_0NOTEQUAL 8192-byte number (one bit set per byte)': ['p2s_nonstandard', '2023_invalid', '2025_p2sh_nonstandard'],
      }),
    ],
  ],
] as const satisfies VmbTestDefinitionGroup[];
