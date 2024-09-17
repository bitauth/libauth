import type { TestValues, VmbTestDefinitionGroup } from '../../lib.js';
import { packedTransactionScenario, repeat } from '../bch-vmb-test-mixins.js';
import { mapTestCases, setExpectedResults } from '../bch-vmb-test-utils.js';

const hashOps: TestValues[] = ['OP_RIPEMD160', 'OP_SHA1', 'OP_SHA256', 'OP_HASH160', 'OP_HASH256'].map((value) => [[value, value]]);

export default [
  [
    'Transaction validation benchmarks',
    [
      ...setExpectedResults(mapTestCases(['<1>', `<0> ${repeat('<520> OP_NUM2BIN $0', 100)} OP_DROP`, 'Within BCH_2023_05 P2SH20/standard, single-input limits, maximize bytes $0 hashed (packed transaction)'], hashOps, { scenario: packedTransactionScenario('p2sh20', 181) }), {
        'Within BCH_2023_05 P2SH20/standard, single-input limits, maximize bytes OP_HASH160 hashed (packed transaction)': ['nonstandard', 'nop2sh_ignore', '2023_p2sh_standard'],
        'Within BCH_2023_05 P2SH20/standard, single-input limits, maximize bytes OP_HASH256 hashed (packed transaction)': ['nonstandard', 'nop2sh_ignore', '2023_p2sh_standard'],
        'Within BCH_2023_05 P2SH20/standard, single-input limits, maximize bytes OP_RIPEMD160 hashed (packed transaction)': ['nonstandard', 'nop2sh_ignore', '2023_p2sh_standard'],
        'Within BCH_2023_05 P2SH20/standard, single-input limits, maximize bytes OP_SHA1 hashed (packed transaction)': ['nonstandard', 'nop2sh_ignore', '2023_p2sh_standard'],
        'Within BCH_2023_05 P2SH20/standard, single-input limits, maximize bytes OP_SHA256 hashed (packed transaction)': ['nonstandard', 'nop2sh_ignore', '2023_p2sh_standard'],
      }),
    ],
  ],
] as const satisfies VmbTestDefinitionGroup[];
