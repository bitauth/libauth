import type { VmbTestDefinitionGroup } from '../../lib.js';
import { lessThanTests } from '../bch-vmb-test-mixins.bigint.js';
import { mapTestCases, setExpectedResults } from '../bch-vmb-test-utils.js';

export default [
  [
    'BigInt',
    [
      ...setExpectedResults(mapTestCases(['<$2>', '<$0> <$1> OP_LESSTHAN OP_EQUAL', 'OP_LESSTHAN $0 and $1'], lessThanTests, { prefixAsHexLiterals: true }), {
        'OP_LESSTHAN 1-byte number (all bits set) and 1-byte number (all bits set)': [],
        'OP_LESSTHAN 1-byte number (all bits set) and 4096-byte number (all bits set)': ['chip_bigint', 'nonstandard'],
        'OP_LESSTHAN 1-byte number (all bits set) and 512-byte number (all bits set)': ['chip_bigint'],
        'OP_LESSTHAN 1-byte number (all bits set) and 64-byte number (all bits set)': ['chip_bigint'],
        'OP_LESSTHAN 1-byte number (all bits set) and 8-byte number (all bits set)': [],
        'OP_LESSTHAN 1-byte number (all bits set) and 8192-byte number (all bits set)': ['chip_bigint', 'nonstandard'],
        'OP_LESSTHAN 1-byte number (alternating bits set) and 1-byte number (alternating bits set)': [],
        'OP_LESSTHAN 1-byte number (alternating bits set) and 4096-byte number (alternating bits set)': ['chip_bigint', 'nonstandard'],
        'OP_LESSTHAN 1-byte number (alternating bits set) and 512-byte number (alternating bits set)': ['chip_bigint'],
        'OP_LESSTHAN 1-byte number (alternating bits set) and 64-byte number (alternating bits set)': ['chip_bigint'],
        'OP_LESSTHAN 1-byte number (alternating bits set) and 8-byte number (alternating bits set)': [],
        'OP_LESSTHAN 1-byte number (alternating bits set) and 8192-byte number (alternating bits set)': ['chip_bigint', 'nonstandard'],
        'OP_LESSTHAN 1-byte number (highest-bit set) and 1-byte number (highest-bit set)': [],
        'OP_LESSTHAN 1-byte number (highest-bit set) and 4096-byte number (highest-bit set)': ['chip_bigint', 'nonstandard'],
        'OP_LESSTHAN 1-byte number (highest-bit set) and 512-byte number (highest-bit set)': ['chip_bigint'],
        'OP_LESSTHAN 1-byte number (highest-bit set) and 64-byte number (highest-bit set)': ['chip_bigint'],
        'OP_LESSTHAN 1-byte number (highest-bit set) and 8-byte number (highest-bit set)': [],
        'OP_LESSTHAN 1-byte number (highest-bit set) and 8192-byte number (highest-bit set)': ['chip_bigint', 'nonstandard'],
        'OP_LESSTHAN 1-byte number (one bit set per byte) and 1-byte number (one bit set per byte)': ['skip'],
        'OP_LESSTHAN 1-byte number (one bit set per byte) and 4096-byte number (one bit set per byte)': ['skip'],
        'OP_LESSTHAN 1-byte number (one bit set per byte) and 512-byte number (one bit set per byte)': ['skip'],
        'OP_LESSTHAN 1-byte number (one bit set per byte) and 64-byte number (one bit set per byte)': ['skip'],
        'OP_LESSTHAN 1-byte number (one bit set per byte) and 8-byte number (one bit set per byte)': ['skip'],
        'OP_LESSTHAN 1-byte number (one bit set per byte) and 8192-byte number (one bit set per byte)': ['skip'],
        'OP_LESSTHAN 4096-byte number (all bits set) and 1-byte number (all bits set)': ['chip_bigint', 'nonstandard'],
        'OP_LESSTHAN 4096-byte number (all bits set) and 4096-byte number (all bits set)': ['chip_bigint', 'nonstandard'],
        'OP_LESSTHAN 4096-byte number (all bits set) and 512-byte number (all bits set)': ['chip_bigint', 'nonstandard'],
        'OP_LESSTHAN 4096-byte number (all bits set) and 64-byte number (all bits set)': ['chip_bigint', 'nonstandard'],
        'OP_LESSTHAN 4096-byte number (all bits set) and 8-byte number (all bits set)': ['chip_bigint', 'nonstandard'],
        'OP_LESSTHAN 4096-byte number (all bits set) and 8192-byte number (all bits set)': ['chip_bigint_invalid'],
        'OP_LESSTHAN 4096-byte number (alternating bits set) and 1-byte number (alternating bits set)': ['chip_bigint', 'nonstandard'],
        'OP_LESSTHAN 4096-byte number (alternating bits set) and 4096-byte number (alternating bits set)': ['chip_bigint', 'nonstandard'],
        'OP_LESSTHAN 4096-byte number (alternating bits set) and 512-byte number (alternating bits set)': ['chip_bigint', 'nonstandard'],
        'OP_LESSTHAN 4096-byte number (alternating bits set) and 64-byte number (alternating bits set)': ['chip_bigint', 'nonstandard'],
        'OP_LESSTHAN 4096-byte number (alternating bits set) and 8-byte number (alternating bits set)': ['chip_bigint', 'nonstandard'],
        'OP_LESSTHAN 4096-byte number (alternating bits set) and 8192-byte number (alternating bits set)': ['chip_bigint_invalid'],
        'OP_LESSTHAN 4096-byte number (highest-bit set) and 1-byte number (highest-bit set)': ['chip_bigint', 'nonstandard'],
        'OP_LESSTHAN 4096-byte number (highest-bit set) and 4096-byte number (highest-bit set)': ['chip_bigint', 'nonstandard'],
        'OP_LESSTHAN 4096-byte number (highest-bit set) and 512-byte number (highest-bit set)': ['chip_bigint', 'nonstandard'],
        'OP_LESSTHAN 4096-byte number (highest-bit set) and 64-byte number (highest-bit set)': ['chip_bigint', 'nonstandard'],
        'OP_LESSTHAN 4096-byte number (highest-bit set) and 8-byte number (highest-bit set)': ['chip_bigint', 'nonstandard'],
        'OP_LESSTHAN 4096-byte number (highest-bit set) and 8192-byte number (highest-bit set)': ['chip_bigint_invalid'],
        'OP_LESSTHAN 4096-byte number (one bit set per byte) and 1-byte number (one bit set per byte)': ['chip_bigint', 'nonstandard'],
        'OP_LESSTHAN 4096-byte number (one bit set per byte) and 4096-byte number (one bit set per byte)': ['chip_bigint', 'nonstandard'],
        'OP_LESSTHAN 4096-byte number (one bit set per byte) and 512-byte number (one bit set per byte)': ['chip_bigint', 'nonstandard'],
        'OP_LESSTHAN 4096-byte number (one bit set per byte) and 64-byte number (one bit set per byte)': ['chip_bigint', 'nonstandard'],
        'OP_LESSTHAN 4096-byte number (one bit set per byte) and 8-byte number (one bit set per byte)': ['chip_bigint', 'nonstandard'],
        'OP_LESSTHAN 4096-byte number (one bit set per byte) and 8192-byte number (one bit set per byte)': ['chip_bigint_invalid'],
        'OP_LESSTHAN 512-byte number (all bits set) and 1-byte number (all bits set)': ['chip_bigint'],
        'OP_LESSTHAN 512-byte number (all bits set) and 4096-byte number (all bits set)': ['chip_bigint', 'nonstandard'],
        'OP_LESSTHAN 512-byte number (all bits set) and 512-byte number (all bits set)': ['chip_bigint'],
        'OP_LESSTHAN 512-byte number (all bits set) and 64-byte number (all bits set)': ['chip_bigint'],
        'OP_LESSTHAN 512-byte number (all bits set) and 8-byte number (all bits set)': ['chip_bigint'],
        'OP_LESSTHAN 512-byte number (all bits set) and 8192-byte number (all bits set)': ['chip_bigint', 'nonstandard'],
        'OP_LESSTHAN 512-byte number (alternating bits set) and 1-byte number (alternating bits set)': ['chip_bigint'],
        'OP_LESSTHAN 512-byte number (alternating bits set) and 4096-byte number (alternating bits set)': ['chip_bigint', 'nonstandard'],
        'OP_LESSTHAN 512-byte number (alternating bits set) and 512-byte number (alternating bits set)': ['chip_bigint'],
        'OP_LESSTHAN 512-byte number (alternating bits set) and 64-byte number (alternating bits set)': ['chip_bigint'],
        'OP_LESSTHAN 512-byte number (alternating bits set) and 8-byte number (alternating bits set)': ['chip_bigint'],
        'OP_LESSTHAN 512-byte number (alternating bits set) and 8192-byte number (alternating bits set)': ['chip_bigint', 'nonstandard'],
        'OP_LESSTHAN 512-byte number (highest-bit set) and 1-byte number (highest-bit set)': ['chip_bigint'],
        'OP_LESSTHAN 512-byte number (highest-bit set) and 4096-byte number (highest-bit set)': ['chip_bigint', 'nonstandard'],
        'OP_LESSTHAN 512-byte number (highest-bit set) and 512-byte number (highest-bit set)': ['chip_bigint'],
        'OP_LESSTHAN 512-byte number (highest-bit set) and 64-byte number (highest-bit set)': ['chip_bigint'],
        'OP_LESSTHAN 512-byte number (highest-bit set) and 8-byte number (highest-bit set)': ['chip_bigint'],
        'OP_LESSTHAN 512-byte number (highest-bit set) and 8192-byte number (highest-bit set)': ['chip_bigint', 'nonstandard'],
        'OP_LESSTHAN 512-byte number (one bit set per byte) and 1-byte number (one bit set per byte)': ['chip_bigint'],
        'OP_LESSTHAN 512-byte number (one bit set per byte) and 4096-byte number (one bit set per byte)': ['chip_bigint', 'nonstandard'],
        'OP_LESSTHAN 512-byte number (one bit set per byte) and 512-byte number (one bit set per byte)': ['chip_bigint'],
        'OP_LESSTHAN 512-byte number (one bit set per byte) and 64-byte number (one bit set per byte)': ['chip_bigint'],
        'OP_LESSTHAN 512-byte number (one bit set per byte) and 8-byte number (one bit set per byte)': ['chip_bigint'],
        'OP_LESSTHAN 512-byte number (one bit set per byte) and 8192-byte number (one bit set per byte)': ['chip_bigint', 'nonstandard'],
        'OP_LESSTHAN 64-byte number (all bits set) and 1-byte number (all bits set)': ['chip_bigint'],
        'OP_LESSTHAN 64-byte number (all bits set) and 4096-byte number (all bits set)': ['chip_bigint', 'nonstandard'],
        'OP_LESSTHAN 64-byte number (all bits set) and 512-byte number (all bits set)': ['chip_bigint'],
        'OP_LESSTHAN 64-byte number (all bits set) and 64-byte number (all bits set)': ['chip_bigint'],
        'OP_LESSTHAN 64-byte number (all bits set) and 8-byte number (all bits set)': ['chip_bigint'],
        'OP_LESSTHAN 64-byte number (all bits set) and 8192-byte number (all bits set)': ['chip_bigint', 'nonstandard'],
        'OP_LESSTHAN 64-byte number (alternating bits set) and 1-byte number (alternating bits set)': ['chip_bigint'],
        'OP_LESSTHAN 64-byte number (alternating bits set) and 4096-byte number (alternating bits set)': ['chip_bigint', 'nonstandard'],
        'OP_LESSTHAN 64-byte number (alternating bits set) and 512-byte number (alternating bits set)': ['chip_bigint'],
        'OP_LESSTHAN 64-byte number (alternating bits set) and 64-byte number (alternating bits set)': ['chip_bigint'],
        'OP_LESSTHAN 64-byte number (alternating bits set) and 8-byte number (alternating bits set)': ['chip_bigint'],
        'OP_LESSTHAN 64-byte number (alternating bits set) and 8192-byte number (alternating bits set)': ['chip_bigint', 'nonstandard'],
        'OP_LESSTHAN 64-byte number (highest-bit set) and 1-byte number (highest-bit set)': ['chip_bigint'],
        'OP_LESSTHAN 64-byte number (highest-bit set) and 4096-byte number (highest-bit set)': ['chip_bigint', 'nonstandard'],
        'OP_LESSTHAN 64-byte number (highest-bit set) and 512-byte number (highest-bit set)': ['chip_bigint'],
        'OP_LESSTHAN 64-byte number (highest-bit set) and 64-byte number (highest-bit set)': ['chip_bigint'],
        'OP_LESSTHAN 64-byte number (highest-bit set) and 8-byte number (highest-bit set)': ['chip_bigint'],
        'OP_LESSTHAN 64-byte number (highest-bit set) and 8192-byte number (highest-bit set)': ['chip_bigint', 'nonstandard'],
        'OP_LESSTHAN 64-byte number (one bit set per byte) and 1-byte number (one bit set per byte)': ['chip_bigint'],
        'OP_LESSTHAN 64-byte number (one bit set per byte) and 4096-byte number (one bit set per byte)': ['chip_bigint', 'nonstandard'],
        'OP_LESSTHAN 64-byte number (one bit set per byte) and 512-byte number (one bit set per byte)': ['chip_bigint'],
        'OP_LESSTHAN 64-byte number (one bit set per byte) and 64-byte number (one bit set per byte)': ['chip_bigint'],
        'OP_LESSTHAN 64-byte number (one bit set per byte) and 8-byte number (one bit set per byte)': ['chip_bigint'],
        'OP_LESSTHAN 64-byte number (one bit set per byte) and 8192-byte number (one bit set per byte)': ['chip_bigint', 'nonstandard'],
        'OP_LESSTHAN 8-byte number (all bits set) and 1-byte number (all bits set)': [],
        'OP_LESSTHAN 8-byte number (all bits set) and 4096-byte number (all bits set)': ['chip_bigint', 'nonstandard'],
        'OP_LESSTHAN 8-byte number (all bits set) and 512-byte number (all bits set)': ['chip_bigint'],
        'OP_LESSTHAN 8-byte number (all bits set) and 64-byte number (all bits set)': ['chip_bigint'],
        'OP_LESSTHAN 8-byte number (all bits set) and 8-byte number (all bits set)': [],
        'OP_LESSTHAN 8-byte number (all bits set) and 8192-byte number (all bits set)': ['chip_bigint', 'nonstandard'],
        'OP_LESSTHAN 8-byte number (alternating bits set) and 1-byte number (alternating bits set)': [],
        'OP_LESSTHAN 8-byte number (alternating bits set) and 4096-byte number (alternating bits set)': ['chip_bigint', 'nonstandard'],
        'OP_LESSTHAN 8-byte number (alternating bits set) and 512-byte number (alternating bits set)': ['chip_bigint'],
        'OP_LESSTHAN 8-byte number (alternating bits set) and 64-byte number (alternating bits set)': ['chip_bigint'],
        'OP_LESSTHAN 8-byte number (alternating bits set) and 8-byte number (alternating bits set)': [],
        'OP_LESSTHAN 8-byte number (alternating bits set) and 8192-byte number (alternating bits set)': ['chip_bigint', 'nonstandard'],
        'OP_LESSTHAN 8-byte number (highest-bit set) and 1-byte number (highest-bit set)': [],
        'OP_LESSTHAN 8-byte number (highest-bit set) and 4096-byte number (highest-bit set)': ['chip_bigint', 'nonstandard'],
        'OP_LESSTHAN 8-byte number (highest-bit set) and 512-byte number (highest-bit set)': ['chip_bigint'],
        'OP_LESSTHAN 8-byte number (highest-bit set) and 64-byte number (highest-bit set)': ['chip_bigint'],
        'OP_LESSTHAN 8-byte number (highest-bit set) and 8-byte number (highest-bit set)': [],
        'OP_LESSTHAN 8-byte number (highest-bit set) and 8192-byte number (highest-bit set)': ['chip_bigint', 'nonstandard'],
        'OP_LESSTHAN 8-byte number (one bit set per byte) and 1-byte number (one bit set per byte)': [],
        'OP_LESSTHAN 8-byte number (one bit set per byte) and 4096-byte number (one bit set per byte)': ['chip_bigint', 'nonstandard'],
        'OP_LESSTHAN 8-byte number (one bit set per byte) and 512-byte number (one bit set per byte)': ['chip_bigint'],
        'OP_LESSTHAN 8-byte number (one bit set per byte) and 64-byte number (one bit set per byte)': ['chip_bigint'],
        'OP_LESSTHAN 8-byte number (one bit set per byte) and 8-byte number (one bit set per byte)': [],
        'OP_LESSTHAN 8-byte number (one bit set per byte) and 8192-byte number (one bit set per byte)': ['chip_bigint', 'nonstandard'],
        'OP_LESSTHAN 8192-byte number (all bits set) and 1-byte number (all bits set)': ['chip_bigint', 'nonstandard'],
        'OP_LESSTHAN 8192-byte number (all bits set) and 4096-byte number (all bits set)': ['chip_bigint_invalid'],
        'OP_LESSTHAN 8192-byte number (all bits set) and 512-byte number (all bits set)': ['chip_bigint', 'nonstandard'],
        'OP_LESSTHAN 8192-byte number (all bits set) and 64-byte number (all bits set)': ['chip_bigint', 'nonstandard'],
        'OP_LESSTHAN 8192-byte number (all bits set) and 8-byte number (all bits set)': ['chip_bigint', 'nonstandard'],
        'OP_LESSTHAN 8192-byte number (all bits set) and 8192-byte number (all bits set)': ['chip_bigint_invalid'],
        'OP_LESSTHAN 8192-byte number (alternating bits set) and 1-byte number (alternating bits set)': ['chip_bigint', 'nonstandard'],
        'OP_LESSTHAN 8192-byte number (alternating bits set) and 4096-byte number (alternating bits set)': ['chip_bigint_invalid'],
        'OP_LESSTHAN 8192-byte number (alternating bits set) and 512-byte number (alternating bits set)': ['chip_bigint', 'nonstandard'],
        'OP_LESSTHAN 8192-byte number (alternating bits set) and 64-byte number (alternating bits set)': ['chip_bigint', 'nonstandard'],
        'OP_LESSTHAN 8192-byte number (alternating bits set) and 8-byte number (alternating bits set)': ['chip_bigint', 'nonstandard'],
        'OP_LESSTHAN 8192-byte number (alternating bits set) and 8192-byte number (alternating bits set)': ['chip_bigint_invalid'],
        'OP_LESSTHAN 8192-byte number (highest-bit set) and 1-byte number (highest-bit set)': ['chip_bigint', 'nonstandard'],
        'OP_LESSTHAN 8192-byte number (highest-bit set) and 4096-byte number (highest-bit set)': ['chip_bigint_invalid'],
        'OP_LESSTHAN 8192-byte number (highest-bit set) and 512-byte number (highest-bit set)': ['chip_bigint', 'nonstandard'],
        'OP_LESSTHAN 8192-byte number (highest-bit set) and 64-byte number (highest-bit set)': ['chip_bigint', 'nonstandard'],
        'OP_LESSTHAN 8192-byte number (highest-bit set) and 8-byte number (highest-bit set)': ['chip_bigint', 'nonstandard'],
        'OP_LESSTHAN 8192-byte number (highest-bit set) and 8192-byte number (highest-bit set)': ['chip_bigint_invalid'],
        'OP_LESSTHAN 8192-byte number (one bit set per byte) and 1-byte number (one bit set per byte)': ['chip_bigint', 'nonstandard'],
        'OP_LESSTHAN 8192-byte number (one bit set per byte) and 4096-byte number (one bit set per byte)': ['chip_bigint_invalid'],
        'OP_LESSTHAN 8192-byte number (one bit set per byte) and 512-byte number (one bit set per byte)': ['chip_bigint', 'nonstandard'],
        'OP_LESSTHAN 8192-byte number (one bit set per byte) and 64-byte number (one bit set per byte)': ['chip_bigint', 'nonstandard'],
        'OP_LESSTHAN 8192-byte number (one bit set per byte) and 8-byte number (one bit set per byte)': ['chip_bigint', 'nonstandard'],
        'OP_LESSTHAN 8192-byte number (one bit set per byte) and 8192-byte number (one bit set per byte)': ['chip_bigint_invalid'],
      }),
    ],
  ],
] as const satisfies VmbTestDefinitionGroup[];