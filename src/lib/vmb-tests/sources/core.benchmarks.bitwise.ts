import type { TestValues, VmbTestDefinitionGroup } from '../../lib.js';
import { minimalScenarioStandard, minimalScenarioStandardPlusBytes, repeat } from '../bch-vmb-test-mixins.js';
import { mapTestCases, setExpectedResults } from '../bch-vmb-test-utils.js';

const bitwiseOps: TestValues[] = ['OP_AND', 'OP_OR', 'OP_XOR'].map((value) => [[value, value]]);

export default [
  [
    'Transaction validation benchmarks',
    [
      ...setExpectedResults(mapTestCases(['<1> <520>', `OP_NUM2BIN OP_DUP OP_2DUP ${repeat('OP_3DUP $0 $0 $0', 48)} OP_2DUP $0 $0 $0 $0 $0`, 'Within BCH_2023_05 P2SH/standard, single-input limits, maximize $0'], bitwiseOps, { scenario: minimalScenarioStandard }), {
        'Within BCH_2023_05 P2SH/standard, single-input limits, maximize OP_AND': ['nop2sh_ignore'],
        'Within BCH_2023_05 P2SH/standard, single-input limits, maximize OP_OR': ['nop2sh_ignore'],
        'Within BCH_2023_05 P2SH/standard, single-input limits, maximize OP_XOR': ['invalid'],
      }),
      ['<1> <520>', `OP_NUM2BIN OP_DUP OP_2DUP ${repeat('OP_3DUP OP_XOR OP_XOR OP_XOR', 48)} OP_2DUP OP_XOR OP_XOR OP_XOR OP_XOR OP_DROP`, 'Within BCH_2023_05 P2SH/standard, single-input limits, maximize OP_XOR (trailing OP_DROP)', ['nop2sh_ignore'], minimalScenarioStandard],

      ...setExpectedResults(mapTestCases(['<1> <520>', `OP_NUM2BIN OP_DUP OP_2DUP ${repeat('OP_3DUP $0 $0 $0', 48)} OP_2DUP $0 $0 $0 $0 $0`, 'Within BCH_2023_05 nonP2SH/nonstandard, single-input limits, maximize $0'], bitwiseOps, { scenario: minimalScenarioStandardPlusBytes(2) }), {
        'Within BCH_2023_05 nonP2SH/nonstandard, single-input limits, maximize OP_AND': ['invalid', '2023_nonstandard', 'p2sh_ignore'],
        'Within BCH_2023_05 nonP2SH/nonstandard, single-input limits, maximize OP_OR': ['invalid', '2023_nonstandard', 'p2sh_ignore'],
        'Within BCH_2023_05 nonP2SH/nonstandard, single-input limits, maximize OP_XOR': ['invalid'],
      }),
      ['<1> <520>', `OP_NUM2BIN OP_DUP OP_2DUP ${repeat('OP_3DUP OP_XOR OP_XOR OP_XOR', 48)} OP_2DUP OP_XOR OP_XOR OP_XOR OP_XOR OP_DROP`, 'Within BCH_2023_05 nonP2SH/nonstandard, single-input limits, maximize OP_XOR (trailing OP_DROP)', ['invalid', '2023_nonstandard', 'p2sh_ignore'], minimalScenarioStandardPlusBytes(2)],

      ...setExpectedResults(mapTestCases(['<1> <10_000>', `OP_NUM2BIN OP_DUP OP_2DUP ${repeat('OP_3DUP $0 $0 $0', 409)} $0 $0 $0`, 'Beyond single-input limits, maximize $0 (otherwise-standard P2SH)'], bitwiseOps, { scenario: minimalScenarioStandard }), {
        'Beyond single-input limits, maximize OP_AND (otherwise-standard P2SH)': ['invalid', 'nop2sh_ignore'],
        'Beyond single-input limits, maximize OP_OR (otherwise-standard P2SH)': ['invalid', 'nop2sh_ignore'],
        'Beyond single-input limits, maximize OP_XOR (otherwise-standard P2SH)': ['invalid'],
      }),
      ['<1> <10_000>', `OP_NUM2BIN OP_DUP OP_2DUP ${repeat('OP_3DUP OP_XOR OP_XOR OP_XOR', 409)} OP_XOR OP_XOR OP_DROP`, 'Beyond single-input limits, maximize OP_XOR (otherwise-standard P2SH, trailing OP_DROP)', ['invalid', 'nop2sh_ignore'], minimalScenarioStandard],

      ...setExpectedResults(mapTestCases(['<1> <10_000>', `OP_NUM2BIN OP_DUP $0`, 'Within BCH_2025_05 P2SH/standard, single-input limits, maximize $0'], bitwiseOps, { scenario: minimalScenarioStandard }), {
        'Within BCH_2025_05 P2SH/standard, single-input limits, maximize OP_AND': ['2023_invalid', 'nop2sh_ignore'],
        'Within BCH_2025_05 P2SH/standard, single-input limits, maximize OP_OR': ['2023_invalid', 'nop2sh_ignore'],
        'Within BCH_2025_05 P2SH/standard, single-input limits, maximize OP_XOR': ['invalid'],
      }),

      ...setExpectedResults(mapTestCases(['<1> <479>', `OP_NUM2BIN OP_DUP OP_2DUP ${repeat('OP_3DUP', 332)} ${repeat('$0', 994)} ${repeat('OP_3DUP', 77)} ${repeat('$0', 236)}`, 'Within BCH_2025_05 P2SH/standard, single-input limits, maximize $0 density, then operand bytes, then stack usage'], bitwiseOps, { scenario: minimalScenarioStandard }), {
        'Within BCH_2025_05 P2SH/standard, single-input limits, maximize OP_AND density, then operand bytes, then stack usage': ['2023_invalid', 'nop2sh_ignore'],
        'Within BCH_2025_05 P2SH/standard, single-input limits, maximize OP_OR density, then operand bytes, then stack usage': ['2023_invalid', 'nop2sh_ignore'],
        'Within BCH_2025_05 P2SH/standard, single-input limits, maximize OP_XOR density, then operand bytes, then stack usage': ['2023_invalid', 'nop2sh_ignore'],
      }),

      ['<1> <520>', `OP_NUM2BIN OP_DUP OP_2DUP ${repeat('OP_3DUP OP_3DUP OP_EQUALVERIFY OP_EQUALVERIFY OP_EQUALVERIFY', 39)} OP_EQUALVERIFY OP_EQUAL`, 'Within BCH_2023_05 P2SH/standard, single-input limits, maximize OP_EQUAL', ['nop2sh_ignore'], minimalScenarioStandard],
      ['<1> <520>', `OP_NUM2BIN OP_DUP OP_2DUP ${repeat('OP_3DUP OP_3DUP OP_EQUALVERIFY OP_EQUALVERIFY OP_EQUALVERIFY', 39)} OP_EQUALVERIFY OP_EQUAL`, 'Within BCH_2023_05 nonP2SH/nonstandard, single-input limits, maximize OP_EQUAL', ['invalid', '2023_nonstandard', 'p2sh_ignore'], minimalScenarioStandardPlusBytes(2)],
    ],
  ],
] as const satisfies VmbTestDefinitionGroup[];
