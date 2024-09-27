import type { TestValues, VmbTestDefinitionGroup } from '../../lib.js';
import { minimalScenarioNonStandard, minimalScenarioStandard, repeat } from '../bch-vmb-test-mixins.js';
import { mapTestCases, setExpectedResults } from '../bch-vmb-test-utils.js';

const addAndSub: TestValues[] = ['OP_ADD', 'OP_SUB'].map((value) => [[value, value]]);

export default [
  [
    'Transaction validation benchmarks',
    [
      ...setExpectedResults(mapTestCases(['<0xffffffffff7f>', `OP_DUP OP_2DUP ${repeat('OP_3DUP', 49)} ${repeat('$0 $0 $0', 50)}`, 'Within BCH_2023_05 P2SH/standard, single-input limits, maximize $0'], addAndSub, { scenario: minimalScenarioStandard }), {
        'Within BCH_2023_05 P2SH/standard, single-input limits, maximize OP_ADD': ['nop2sh_ignore'],
        'Within BCH_2023_05 P2SH/standard, single-input limits, maximize OP_SUB': ['nop2sh_ignore'],
      }),
      ...setExpectedResults(mapTestCases(['<0xffffffffff7f>', `OP_DUP OP_2DUP ${repeat('OP_3DUP', 49)} ${repeat('$0 $0 $0', 50)}`, 'Within BCH_2023_05 nonP2SH/nonstandard, single-input limits, maximize $0'], addAndSub, { scenario: minimalScenarioNonStandard }), {
        'Within BCH_2023_05 nonP2SH/nonstandard, single-input limits, maximize OP_ADD': ['nonstandard', 'p2sh_ignore'],
        'Within BCH_2023_05 nonP2SH/nonstandard, single-input limits, maximize OP_SUB': ['nonstandard', 'p2sh_ignore'],
      }),
      ['<0xffffffffffffff7f> <0xffffffffffff7f>', `OP_2DUP ${repeat('OP_3DUP', 49)} ${repeat('OP_SUB', 150)}`, 'Within BCH_2023_05 P2SH/standard, single-input limits, maximize OP_SUB (minimize 0 results)', ['nop2sh_ignore'], minimalScenarioStandard],
      ['<0x3fffffffffffffffffffffffffffff>', `<10000> OP_NUM2BIN OP_REVERSEBYTES OP_DUP OP_ADD`, 'Within BCH_2025_05 P2SH/standard, single-input limits, maximize OP_ADD operand bytes', ['2023_invalid', 'nop2sh_ignore'], minimalScenarioStandard],
      ['<0xffffffffffffffffffffffffffffff>', `<9999> OP_NUM2BIN OP_REVERSEBYTES OP_DUP OP_ADD`, 'Within BCH_2025_05 P2SH/standard, single-input limits, maximize OP_SUB operand bytes', ['2023_invalid', 'nop2sh_ignore'], minimalScenarioStandard],
      ['<0xffffffff>', `${repeat('OP_DUP OP_CAT', 11)} OP_DUP OP_ADD`, 'Within BCH_2025_05 P2SH/standard, single-input limits, maximize (OP_DUP OP_CAT) OP_ADD operand bytes', ['2023_invalid', 'nop2sh_ignore'], minimalScenarioStandard],
      ['<0xffffffff>', `${repeat('OP_DUP OP_CAT', 11)} OP_DUP OP_SUB OP_NOT`, 'Within BCH_2025_05 P2SH20/standard, single-input limits, maximize (OP_DUP OP_CAT) OP_SUB operand bytes (OP_DUP OP_SUB OP_NOT)', ['2023_invalid', 'nop2sh_ignore', 'p2sh32_ignore'], minimalScenarioStandard],
      ['<0xffffffff>', `${repeat('OP_DUP OP_CAT', 11)} <1> OP_SUB`, 'Within BCH_2025_05 P2SH20/standard, single-input limits, maximize (OP_DUP OP_CAT) OP_SUB operand bytes (<1> OP_SUB)', ['2023_invalid', 'nop2sh_ignore', 'p2sh32_ignore'], minimalScenarioStandard],
      ['<0xffffffff>', `${repeat('OP_DUP OP_CAT', 7)} OP_DUP OP_2DUP ${repeat('OP_3DUP', 24)} ${repeat('OP_ADD', 75)}`, 'Within BCH_2025_05 P2SH20/standard, single-input limits, balance (OP_DUP OP_CAT) OP_ADD density and operand bytes', ['2023_invalid', 'nop2sh_ignore', 'p2sh32_ignore'], minimalScenarioStandard],
    ],
  ],
] as const satisfies VmbTestDefinitionGroup[];
