import type { VmbTestDefinitionGroup } from '../../lib.js';
import { smallZerosAndOnes, zerosAndOnes } from '../bch-vmb-test-mixins.bigint.js';
import { generateTestCases, setExpectedResults } from '../bch-vmb-test-utils.js';

export default [
  [
    'BigInt',
    [
      ...setExpectedResults(generateTestCases(['<$0>', '<$1> OP_BIN2NUM OP_EQUAL', 'OP_BIN2NUM $1 is $0'], [smallZerosAndOnes, zerosAndOnes]), {
        'OP_BIN2NUM negative one is negative one': [],
        'OP_BIN2NUM negative one is negative zero': ['invalid'],
        'OP_BIN2NUM negative one is one': ['invalid'],
        'OP_BIN2NUM negative one is padded negative one': ['invalid'],
        'OP_BIN2NUM negative one is padded negative zero': ['invalid'],
        'OP_BIN2NUM negative one is padded one': ['invalid'],
        'OP_BIN2NUM negative one is padded zero': ['invalid'],
        'OP_BIN2NUM negative one is zero': ['invalid'],
        'OP_BIN2NUM negative zero is negative one': ['invalid'],
        'OP_BIN2NUM negative zero is negative zero': ['invalid'],
        'OP_BIN2NUM negative zero is one': ['invalid'],
        'OP_BIN2NUM negative zero is padded negative one': ['invalid'],
        'OP_BIN2NUM negative zero is padded negative zero': ['invalid'],
        'OP_BIN2NUM negative zero is padded one': ['invalid'],
        'OP_BIN2NUM negative zero is padded zero': ['invalid'],
        'OP_BIN2NUM negative zero is zero': [],
        'OP_BIN2NUM one is negative one': ['invalid'],
        'OP_BIN2NUM one is negative zero': ['invalid'],
        'OP_BIN2NUM one is one': [],
        'OP_BIN2NUM one is padded negative one': ['invalid'],
        'OP_BIN2NUM one is padded negative zero': ['invalid'],
        'OP_BIN2NUM one is padded one': ['invalid'],
        'OP_BIN2NUM one is padded zero': ['invalid'],
        'OP_BIN2NUM one is zero': ['invalid'],
        'OP_BIN2NUM padded negative one (520 bytes) is negative one': ['2023_p2sh_invalid'],
        'OP_BIN2NUM padded negative one (520 bytes) is negative zero': ['invalid'],
        'OP_BIN2NUM padded negative one (520 bytes) is one': ['invalid'],
        'OP_BIN2NUM padded negative one (520 bytes) is padded negative one': ['invalid'],
        'OP_BIN2NUM padded negative one (520 bytes) is padded negative zero': ['invalid'],
        'OP_BIN2NUM padded negative one (520 bytes) is padded one': ['invalid'],
        'OP_BIN2NUM padded negative one (520 bytes) is padded zero': ['invalid'],
        'OP_BIN2NUM padded negative one (520 bytes) is zero': ['invalid'],
        'OP_BIN2NUM padded negative one (521 bytes) is negative one': ['chip_bigint'],
        'OP_BIN2NUM padded negative one (521 bytes) is negative zero': ['invalid'],
        'OP_BIN2NUM padded negative one (521 bytes) is one': ['invalid'],
        'OP_BIN2NUM padded negative one (521 bytes) is padded negative one': ['invalid'],
        'OP_BIN2NUM padded negative one (521 bytes) is padded negative zero': ['invalid'],
        'OP_BIN2NUM padded negative one (521 bytes) is padded one': ['invalid'],
        'OP_BIN2NUM padded negative one (521 bytes) is padded zero': ['invalid'],
        'OP_BIN2NUM padded negative one (521 bytes) is zero': ['invalid'],
        'OP_BIN2NUM padded negative one is negative one': [],
        'OP_BIN2NUM padded negative one is negative zero': ['invalid'],
        'OP_BIN2NUM padded negative one is one': ['invalid'],
        'OP_BIN2NUM padded negative one is padded negative one': ['invalid'],
        'OP_BIN2NUM padded negative one is padded negative zero': ['invalid'],
        'OP_BIN2NUM padded negative one is padded one': ['invalid'],
        'OP_BIN2NUM padded negative one is padded zero': ['invalid'],
        'OP_BIN2NUM padded negative one is zero': ['invalid'],
        'OP_BIN2NUM padded negative zero (520 bytes) is negative one': ['invalid'],
        'OP_BIN2NUM padded negative zero (520 bytes) is negative zero': ['invalid'],
        'OP_BIN2NUM padded negative zero (520 bytes) is one': ['invalid'],
        'OP_BIN2NUM padded negative zero (520 bytes) is padded negative one': ['invalid'],
        'OP_BIN2NUM padded negative zero (520 bytes) is padded negative zero': ['invalid'],
        'OP_BIN2NUM padded negative zero (520 bytes) is padded one': ['invalid'],
        'OP_BIN2NUM padded negative zero (520 bytes) is padded zero': ['invalid'],
        'OP_BIN2NUM padded negative zero (520 bytes) is zero': ['2023_p2sh_invalid'],
        'OP_BIN2NUM padded negative zero (521 bytes) is negative one': ['invalid'],
        'OP_BIN2NUM padded negative zero (521 bytes) is negative zero': ['invalid'],
        'OP_BIN2NUM padded negative zero (521 bytes) is one': ['invalid'],
        'OP_BIN2NUM padded negative zero (521 bytes) is padded negative one': ['invalid'],
        'OP_BIN2NUM padded negative zero (521 bytes) is padded negative zero': ['invalid'],
        'OP_BIN2NUM padded negative zero (521 bytes) is padded one': ['invalid'],
        'OP_BIN2NUM padded negative zero (521 bytes) is padded zero': ['invalid'],
        'OP_BIN2NUM padded negative zero (521 bytes) is zero': ['chip_bigint'],
        'OP_BIN2NUM padded negative zero is negative one': ['invalid'],
        'OP_BIN2NUM padded negative zero is negative zero': ['invalid'],
        'OP_BIN2NUM padded negative zero is one': ['invalid'],
        'OP_BIN2NUM padded negative zero is padded negative one': ['invalid'],
        'OP_BIN2NUM padded negative zero is padded negative zero': ['invalid'],
        'OP_BIN2NUM padded negative zero is padded one': ['invalid'],
        'OP_BIN2NUM padded negative zero is padded zero': ['invalid'],
        'OP_BIN2NUM padded negative zero is zero': [],
        'OP_BIN2NUM padded one (520 bytes) is negative one': ['invalid'],
        'OP_BIN2NUM padded one (520 bytes) is negative zero': ['invalid'],
        'OP_BIN2NUM padded one (520 bytes) is one': ['2023_p2sh_invalid'],
        'OP_BIN2NUM padded one (520 bytes) is padded negative one': ['invalid'],
        'OP_BIN2NUM padded one (520 bytes) is padded negative zero': ['invalid'],
        'OP_BIN2NUM padded one (520 bytes) is padded one': ['invalid'],
        'OP_BIN2NUM padded one (520 bytes) is padded zero': ['invalid'],
        'OP_BIN2NUM padded one (520 bytes) is zero': ['invalid'],
        'OP_BIN2NUM padded one (521 bytes) is negative one': ['invalid'],
        'OP_BIN2NUM padded one (521 bytes) is negative zero': ['invalid'],
        'OP_BIN2NUM padded one (521 bytes) is one': ['chip_bigint'],
        'OP_BIN2NUM padded one (521 bytes) is padded negative one': ['invalid'],
        'OP_BIN2NUM padded one (521 bytes) is padded negative zero': ['invalid'],
        'OP_BIN2NUM padded one (521 bytes) is padded one': ['invalid'],
        'OP_BIN2NUM padded one (521 bytes) is padded zero': ['invalid'],
        'OP_BIN2NUM padded one (521 bytes) is zero': ['invalid'],
        'OP_BIN2NUM padded one is negative one': ['invalid'],
        'OP_BIN2NUM padded one is negative zero': ['invalid'],
        'OP_BIN2NUM padded one is one': [],
        'OP_BIN2NUM padded one is padded negative one': ['invalid'],
        'OP_BIN2NUM padded one is padded negative zero': ['invalid'],
        'OP_BIN2NUM padded one is padded one': ['invalid'],
        'OP_BIN2NUM padded one is padded zero': ['invalid'],
        'OP_BIN2NUM padded one is zero': ['invalid'],
        'OP_BIN2NUM padded zero (520 bytes) is negative one': ['invalid'],
        'OP_BIN2NUM padded zero (520 bytes) is negative zero': ['invalid'],
        'OP_BIN2NUM padded zero (520 bytes) is one': ['invalid'],
        'OP_BIN2NUM padded zero (520 bytes) is padded negative one': ['invalid'],
        'OP_BIN2NUM padded zero (520 bytes) is padded negative zero': ['invalid'],
        'OP_BIN2NUM padded zero (520 bytes) is padded one': ['invalid'],
        'OP_BIN2NUM padded zero (520 bytes) is padded zero': ['invalid'],
        'OP_BIN2NUM padded zero (520 bytes) is zero': ['2023_p2sh_invalid'],
        'OP_BIN2NUM padded zero (521 bytes) is negative one': ['invalid'],
        'OP_BIN2NUM padded zero (521 bytes) is negative zero': ['invalid'],
        'OP_BIN2NUM padded zero (521 bytes) is one': ['invalid'],
        'OP_BIN2NUM padded zero (521 bytes) is padded negative one': ['invalid'],
        'OP_BIN2NUM padded zero (521 bytes) is padded negative zero': ['invalid'],
        'OP_BIN2NUM padded zero (521 bytes) is padded one': ['invalid'],
        'OP_BIN2NUM padded zero (521 bytes) is padded zero': ['invalid'],
        'OP_BIN2NUM padded zero (521 bytes) is zero': ['chip_bigint'],
        'OP_BIN2NUM padded zero is negative one': ['invalid'],
        'OP_BIN2NUM padded zero is negative zero': ['invalid'],
        'OP_BIN2NUM padded zero is one': ['invalid'],
        'OP_BIN2NUM padded zero is padded negative one': ['invalid'],
        'OP_BIN2NUM padded zero is padded negative zero': ['invalid'],
        'OP_BIN2NUM padded zero is padded one': ['invalid'],
        'OP_BIN2NUM padded zero is padded zero': ['invalid'],
        'OP_BIN2NUM padded zero is zero': [],
        'OP_BIN2NUM zero is negative one': ['invalid'],
        'OP_BIN2NUM zero is negative zero': ['invalid'],
        'OP_BIN2NUM zero is one': ['invalid'],
        'OP_BIN2NUM zero is padded negative one': ['invalid'],
        'OP_BIN2NUM zero is padded negative zero': ['invalid'],
        'OP_BIN2NUM zero is padded one': ['invalid'],
        'OP_BIN2NUM zero is padded zero': ['invalid'],
        'OP_BIN2NUM zero is zero': [],
      }),
      ...setExpectedResults(generateTestCases(['<$0>', 'OP_BIN2NUM', 'OP_BIN2NUM $0 is truthy'], [zerosAndOnes]), {
        'OP_BIN2NUM negative one is truthy': [],
        'OP_BIN2NUM negative zero is truthy': ['invalid'],
        'OP_BIN2NUM one is truthy': [],
        'OP_BIN2NUM padded negative one (520 bytes) is truthy': [],
        'OP_BIN2NUM padded negative one (521 bytes) is truthy': ['chip_bigint'],
        'OP_BIN2NUM padded negative one is truthy': [],
        'OP_BIN2NUM padded negative zero (520 bytes) is truthy': ['invalid'],
        'OP_BIN2NUM padded negative zero (521 bytes) is truthy': ['chip_bigint_invalid'],
        'OP_BIN2NUM padded negative zero is truthy': ['invalid'],
        'OP_BIN2NUM padded one (520 bytes) is truthy': [],
        'OP_BIN2NUM padded one (521 bytes) is truthy': ['chip_bigint'],
        'OP_BIN2NUM padded one is truthy': [],
        'OP_BIN2NUM padded zero (520 bytes) is truthy': ['invalid'],
        'OP_BIN2NUM padded zero (521 bytes) is truthy': ['chip_bigint_invalid'],
        'OP_BIN2NUM padded zero is truthy': ['invalid'],
        'OP_BIN2NUM zero is truthy': ['invalid'],
      }),
      ...setExpectedResults(generateTestCases(['<$0>', 'OP_NOT', 'OP_NOT $0 is truthy (without OP_BIN2NUM)'], [zerosAndOnes]), {
        'OP_NOT negative one is truthy (without OP_BIN2NUM)': ['invalid'],
        'OP_NOT negative zero is truthy (without OP_BIN2NUM)': ['invalid'],
        'OP_NOT one is truthy (without OP_BIN2NUM)': ['invalid'],
        'OP_NOT padded negative one (520 bytes) is truthy (without OP_BIN2NUM)': ['invalid'],
        'OP_NOT padded negative one (521 bytes) is truthy (without OP_BIN2NUM)': ['chip_bigint_invalid'],
        'OP_NOT padded negative one is truthy (without OP_BIN2NUM)': ['invalid'],
        'OP_NOT padded negative zero (520 bytes) is truthy (without OP_BIN2NUM)': ['invalid'],
        'OP_NOT padded negative zero (521 bytes) is truthy (without OP_BIN2NUM)': ['chip_bigint_invalid'],
        'OP_NOT padded negative zero is truthy (without OP_BIN2NUM)': ['invalid'],
        'OP_NOT padded one (520 bytes) is truthy (without OP_BIN2NUM)': ['invalid'],
        'OP_NOT padded one (521 bytes) is truthy (without OP_BIN2NUM)': ['chip_bigint_invalid'],
        'OP_NOT padded one is truthy (without OP_BIN2NUM)': ['invalid'],
        'OP_NOT padded zero (520 bytes) is truthy (without OP_BIN2NUM)': ['invalid'],
        'OP_NOT padded zero (521 bytes) is truthy (without OP_BIN2NUM)': ['chip_bigint_invalid'],
        'OP_NOT padded zero is truthy (without OP_BIN2NUM)': ['invalid'],
        'OP_NOT zero is truthy (without OP_BIN2NUM)': [],
      }),
      ...setExpectedResults(generateTestCases(['<$0>', 'OP_NOT OP_BIN2NUM', 'OP_NOT OP_BIN2NUM $0 is truthy'], [zerosAndOnes]), {
        'OP_NOT OP_BIN2NUM negative one is truthy': ['invalid'],
        'OP_NOT OP_BIN2NUM negative zero is truthy': ['invalid'],
        'OP_NOT OP_BIN2NUM one is truthy': ['invalid'],
        'OP_NOT OP_BIN2NUM padded negative one (520 bytes) is truthy': ['invalid'],
        'OP_NOT OP_BIN2NUM padded negative one (521 bytes) is truthy': ['chip_bigint_invalid'],
        'OP_NOT OP_BIN2NUM padded negative one is truthy': ['invalid'],
        'OP_NOT OP_BIN2NUM padded negative zero (520 bytes) is truthy': ['invalid'],
        'OP_NOT OP_BIN2NUM padded negative zero (521 bytes) is truthy': ['chip_bigint_invalid'],
        'OP_NOT OP_BIN2NUM padded negative zero is truthy': ['invalid'],
        'OP_NOT OP_BIN2NUM padded one (520 bytes) is truthy': ['invalid'],
        'OP_NOT OP_BIN2NUM padded one (521 bytes) is truthy': ['chip_bigint_invalid'],
        'OP_NOT OP_BIN2NUM padded one is truthy': ['invalid'],
        'OP_NOT OP_BIN2NUM padded zero (520 bytes) is truthy': ['invalid'],
        'OP_NOT OP_BIN2NUM padded zero (521 bytes) is truthy': ['chip_bigint_invalid'],
        'OP_NOT OP_BIN2NUM padded zero is truthy': ['invalid'],
        'OP_NOT OP_BIN2NUM zero is truthy': [],
      }),
      ...setExpectedResults(generateTestCases(['<$0>', 'OP_BIN2NUM OP_NOT', 'OP_BIN2NUM OP_NOT $0 is truthy'], [zerosAndOnes]), {
        'OP_BIN2NUM OP_NOT negative one is truthy': ['invalid'],
        'OP_BIN2NUM OP_NOT negative zero is truthy': [],
        'OP_BIN2NUM OP_NOT one is truthy': ['invalid'],
        'OP_BIN2NUM OP_NOT padded negative one (520 bytes) is truthy': ['invalid'],
        'OP_BIN2NUM OP_NOT padded negative one (521 bytes) is truthy': ['chip_bigint_invalid'],
        'OP_BIN2NUM OP_NOT padded negative one is truthy': ['invalid'],
        'OP_BIN2NUM OP_NOT padded negative zero (520 bytes) is truthy': [],
        'OP_BIN2NUM OP_NOT padded negative zero (521 bytes) is truthy': ['chip_bigint'],
        'OP_BIN2NUM OP_NOT padded negative zero is truthy': [],
        'OP_BIN2NUM OP_NOT padded one (520 bytes) is truthy': ['invalid'],
        'OP_BIN2NUM OP_NOT padded one (521 bytes) is truthy': ['chip_bigint_invalid'],
        'OP_BIN2NUM OP_NOT padded one is truthy': ['invalid'],
        'OP_BIN2NUM OP_NOT padded zero (520 bytes) is truthy': [],
        'OP_BIN2NUM OP_NOT padded zero (521 bytes) is truthy': ['chip_bigint'],
        'OP_BIN2NUM OP_NOT padded zero is truthy': [],
        'OP_BIN2NUM OP_NOT zero is truthy': [],
      }),

      [`<0x12b4> <0x1234 0x80>`, 'OP_BIN2NUM OP_EQUAL', 'OP_BIN2NUM Non-minimal negative number'],
      [`<0x0100000000000000000000000000000000000000000000000000000000000000000000003ba3edfd7a7b12b27ac72c3e67768f617fc81bc3888a51323a9fb8aa4b1e5e4a29ab5f49ffff001d1dac2b7c>`, 'OP_HASH256 OP_1ADD', 'OP_1ADD genesis block header hash without OP_BIN2NUM', ['chip_bigint_invalid']],
      [`<0x0100000000000000000000000000000000000000000000000000000000000000000000003ba3edfd7a7b12b27ac72c3e67768f617fc81bc3888a51323a9fb8aa4b1e5e4a29ab5f49ffff001d1dac2b7c>`, 'OP_HASH256 OP_BIN2NUM OP_1ADD', 'OP_1ADD genesis block header hash with OP_BIN2NUM', ['chip_bigint']],
    ],
  ],
] as const satisfies VmbTestDefinitionGroup[];