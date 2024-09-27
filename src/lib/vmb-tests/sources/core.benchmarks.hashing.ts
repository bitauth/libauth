import type { TestValues, VmbTestDefinitionGroup } from '../../lib.js';
import { minimalScenarioStandard, minimalScenarioStandardPlusBytes, repeat } from '../bch-vmb-test-mixins.js';
import { generateTestCases, mapTestCases, setExpectedResults } from '../bch-vmb-test-utils.js';

const hashOpcodes = ['OP_RIPEMD160', 'OP_SHA1', 'OP_SHA256', 'OP_HASH160', 'OP_HASH256'];
const hashOps: TestValues[] = hashOpcodes.map((value) => [[value, value]]);

export default [
  [
    'Transaction validation benchmarks',
    [
      ...setExpectedResults(mapTestCases(['<1>', `<0> ${repeat('<520> OP_NUM2BIN $0', 100)} OP_DROP`, 'Within BCH_2023_05 P2SH/standard, single-input limits, maximize bytes $0 hashed'], hashOps, { scenario: minimalScenarioStandard }), {
        'Within BCH_2023_05 P2SH/standard, single-input limits, maximize bytes OP_HASH160 hashed': ['nonstandard', 'nop2sh_ignore', '2023_p2sh_standard'],
        'Within BCH_2023_05 P2SH/standard, single-input limits, maximize bytes OP_HASH256 hashed': ['nonstandard', 'nop2sh_ignore', '2023_p2sh_standard'],
        'Within BCH_2023_05 P2SH/standard, single-input limits, maximize bytes OP_RIPEMD160 hashed': ['nonstandard', 'nop2sh_ignore', '2023_p2sh_standard'],
        'Within BCH_2023_05 P2SH/standard, single-input limits, maximize bytes OP_SHA1 hashed': ['nonstandard', 'nop2sh_ignore', '2023_p2sh_standard'],
        'Within BCH_2023_05 P2SH/standard, single-input limits, maximize bytes OP_SHA256 hashed': ['nonstandard', 'nop2sh_ignore', '2023_p2sh_standard'],
      }),
      ...setExpectedResults(mapTestCases(['<1>', `<0> ${repeat('<520> OP_NUM2BIN $0', 100)} OP_DROP`, 'Within BCH_2023_05 nonP2SH/nonstandard, single-input limits, maximize bytes $0 hashed'], hashOps, { scenario: minimalScenarioStandardPlusBytes(2) }), {
        'Within BCH_2023_05 nonP2SH/nonstandard, single-input limits, maximize bytes OP_HASH160 hashed': ['invalid', 'p2sh_ignore', '2023_nop2sh_nonstandard'],
        'Within BCH_2023_05 nonP2SH/nonstandard, single-input limits, maximize bytes OP_HASH256 hashed': ['invalid', 'p2sh_ignore', '2023_nop2sh_nonstandard'],
        'Within BCH_2023_05 nonP2SH/nonstandard, single-input limits, maximize bytes OP_RIPEMD160 hashed': ['invalid', 'p2sh_ignore', '2023_nop2sh_nonstandard'],
        'Within BCH_2023_05 nonP2SH/nonstandard, single-input limits, maximize bytes OP_SHA1 hashed': ['invalid', 'p2sh_ignore', '2023_nop2sh_nonstandard'],
        'Within BCH_2023_05 nonP2SH/nonstandard, single-input limits, maximize bytes OP_SHA256 hashed': ['invalid', 'p2sh_ignore', '2023_nop2sh_nonstandard'],
      }),
      ...setExpectedResults(mapTestCases(['<1>', `<0> <488> OP_NUM2BIN OP_DUP OP_2DUP ${repeat('OP_3DUP', 27)} ${repeat('$0 OP_CAT', 84)} $0 OP_DROP`, 'Within BCH_2023_05 P2SH20/standard limits, maximize hash digests per byte, then total bytes $0 hashed'], hashOps, { scenario: minimalScenarioStandard }), {
        'Within BCH_2023_05 P2SH20/standard limits, maximize hash digests per byte, then total bytes OP_HASH160 hashed': ['nonstandard', 'nop2sh_ignore', '2023_p2sh_standard'],
        'Within BCH_2023_05 P2SH20/standard limits, maximize hash digests per byte, then total bytes OP_HASH256 hashed': ['nonstandard', 'nop2sh_ignore', '2023_p2sh_standard'],
        'Within BCH_2023_05 P2SH20/standard limits, maximize hash digests per byte, then total bytes OP_RIPEMD160 hashed': ['nonstandard', 'nop2sh_ignore', '2023_p2sh_standard'],
        'Within BCH_2023_05 P2SH20/standard limits, maximize hash digests per byte, then total bytes OP_SHA1 hashed': ['nonstandard', 'nop2sh_ignore', '2023_p2sh_standard'],
        'Within BCH_2023_05 P2SH20/standard limits, maximize hash digests per byte, then total bytes OP_SHA256 hashed': ['nonstandard', 'nop2sh_ignore', '2023_p2sh_standard'],
      }),
      ...setExpectedResults(mapTestCases(['<1>', `<0> <488> OP_NUM2BIN OP_DUP OP_2DUP ${repeat('OP_3DUP', 27)} ${repeat('$0 OP_CAT', 84)} $0 OP_DROP`, 'Within BCH_2023_05 nonP2SH/nonstandard limits, maximize hash digests per byte, then total bytes $0 hashed'], hashOps, { scenario: minimalScenarioStandardPlusBytes(2) }), {
        'Within BCH_2023_05 nonP2SH/nonstandard limits, maximize hash digests per byte, then total bytes OP_HASH160 hashed': ['invalid', 'p2sh_ignore', '2023_nop2sh_nonstandard'],
        'Within BCH_2023_05 nonP2SH/nonstandard limits, maximize hash digests per byte, then total bytes OP_HASH256 hashed': ['invalid', 'p2sh_ignore', '2023_nop2sh_nonstandard'],
        'Within BCH_2023_05 nonP2SH/nonstandard limits, maximize hash digests per byte, then total bytes OP_RIPEMD160 hashed': ['invalid', 'p2sh_ignore', '2023_nop2sh_nonstandard'],
        'Within BCH_2023_05 nonP2SH/nonstandard limits, maximize hash digests per byte, then total bytes OP_SHA1 hashed': ['invalid', 'p2sh_ignore', '2023_nop2sh_nonstandard'],
        'Within BCH_2023_05 nonP2SH/nonstandard limits, maximize hash digests per byte, then total bytes OP_SHA256 hashed': ['invalid', 'p2sh_ignore', '2023_nop2sh_nonstandard'],
      }),

      ...setExpectedResults(generateTestCases(['<1> <$1>', `OP_NUM2BIN $0`, '$0 hash $1 bytes'], [hashOpcodes.map((value) => [value, value]), ['1335', '1336', '1399', '1400', '9975', '9976', '10000'].map((value) => [value, value])], { scenario: minimalScenarioStandard }), {
        'OP_HASH160 hash 10000 bytes': ['nonstandard', 'nop2sh_invalid', '2023_invalid'],
        'OP_HASH160 hash 1335 bytes': ['2023_invalid'],
        'OP_HASH160 hash 1336 bytes': ['nonstandard', '2023_invalid'],
        'OP_HASH160 hash 1399 bytes': ['nonstandard', '2023_invalid'],
        'OP_HASH160 hash 1400 bytes': ['nonstandard', '2023_invalid'],
        'OP_HASH160 hash 9975 bytes': ['nonstandard', '2023_invalid'],
        'OP_HASH160 hash 9976 bytes': ['nonstandard', 'nop2sh_invalid', '2023_invalid'],
        'OP_HASH256 hash 10000 bytes': ['nonstandard', 'nop2sh_invalid', '2023_invalid'],
        'OP_HASH256 hash 1335 bytes': ['2023_invalid'],
        'OP_HASH256 hash 1336 bytes': ['nonstandard', '2023_invalid'],
        'OP_HASH256 hash 1399 bytes': ['nonstandard', '2023_invalid'],
        'OP_HASH256 hash 1400 bytes': ['nonstandard', '2023_invalid'],
        'OP_HASH256 hash 9975 bytes': ['nonstandard', '2023_invalid'],
        'OP_HASH256 hash 9976 bytes': ['nonstandard', 'nop2sh_invalid', '2023_invalid'],
        'OP_RIPEMD160 hash 10000 bytes': ['nonstandard', '2023_invalid'],
        'OP_RIPEMD160 hash 1335 bytes': ['2023_invalid'],
        'OP_RIPEMD160 hash 1336 bytes': ['2023_invalid'],
        'OP_RIPEMD160 hash 1399 bytes': ['2023_invalid'],
        'OP_RIPEMD160 hash 1400 bytes': ['nonstandard', '2023_invalid'],
        'OP_RIPEMD160 hash 9975 bytes': ['nonstandard', '2023_invalid'],
        'OP_RIPEMD160 hash 9976 bytes': ['nonstandard', '2023_invalid'],
        'OP_SHA1 hash 10000 bytes': ['nonstandard', '2023_invalid'],
        'OP_SHA1 hash 1335 bytes': ['2023_invalid'],
        'OP_SHA1 hash 1336 bytes': ['2023_invalid'],
        'OP_SHA1 hash 1399 bytes': ['2023_invalid'],
        'OP_SHA1 hash 1400 bytes': ['nonstandard', '2023_invalid'],
        'OP_SHA1 hash 9975 bytes': ['nonstandard', '2023_invalid'],
        'OP_SHA1 hash 9976 bytes': ['nonstandard', '2023_invalid'],
        'OP_SHA256 hash 10000 bytes': ['nonstandard', '2023_invalid'],
        'OP_SHA256 hash 1335 bytes': ['2023_invalid'],
        'OP_SHA256 hash 1336 bytes': ['2023_invalid'],
        'OP_SHA256 hash 1399 bytes': ['2023_invalid'],
        'OP_SHA256 hash 1400 bytes': ['nonstandard', '2023_invalid'],
        'OP_SHA256 hash 9975 bytes': ['nonstandard', '2023_invalid'],
        'OP_SHA256 hash 9976 bytes': ['nonstandard', '2023_invalid'],
      }),
    ],
  ],
] as const satisfies VmbTestDefinitionGroup[];
