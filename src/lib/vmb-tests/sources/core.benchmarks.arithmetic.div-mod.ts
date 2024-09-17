import type { TestValues, VmbTestDefinitionGroup } from '../../lib.js';
import { minimalScenarioNonStandard, minimalScenarioStandard, repeat } from '../bch-vmb-test-mixins.js';
import { mapTestCases, setExpectedResults } from '../bch-vmb-test-utils.js';

const divAndMod: TestValues[] = ['OP_DIV', 'OP_MOD'].map((value) => [[value, value]]);

export default [
  [
    'Transaction validation benchmarks',
    [
      ...setExpectedResults(mapTestCases(['<0xffffffffff7f> <0x00ffffff7e>', `OP_2DUP ${repeat('OP_3DUP', 49)} ${repeat('$0 $0 $0 $0 OP_SUB $0 $0 $0 OP_SUB', 16)} $0 $0 $0 $0 OP_SUB $0 OP_0NOTEQUAL`, 'Within BCH_2023_05 P2SH/standard, single-input limits, maximize $0'], divAndMod, { scenario: minimalScenarioStandard }), {
        'Within BCH_2023_05 P2SH/standard, single-input limits, maximize OP_DIV': ['nop2sh_ignore'],
        'Within BCH_2023_05 P2SH/standard, single-input limits, maximize OP_MOD': ['nop2sh_ignore'],
      }),
      ...setExpectedResults(mapTestCases(['<0xffffffffff7f> <0x00ffffff7e>', `OP_2DUP ${repeat('OP_3DUP', 49)} ${repeat('$0 $0 $0 $0 OP_SUB $0 $0 $0 OP_SUB', 16)} $0 $0 $0 $0 OP_SUB $0 OP_0NOTEQUAL`, 'Within BCH_2023_05 P2SH/standard, single-input limits, maximize $0'], divAndMod, { scenario: minimalScenarioNonStandard }), {
        'Within BCH_2023_05 P2SH/standard, single-input limits, maximize OP_DIV': ['nonstandard', 'p2sh_ignore'],
        'Within BCH_2023_05 P2SH/standard, single-input limits, maximize OP_MOD': ['nonstandard', 'p2sh_ignore'],
      }),
    ],
  ],
] as const satisfies VmbTestDefinitionGroup[];
