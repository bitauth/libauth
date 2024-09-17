import type { VmbTestDefinitionGroup } from '../../lib.js';
import { minimalScenarioStandard, minimalScenarioStandardPlusBytes, repeat } from '../bch-vmb-test-mixins.js';

export default [
  [
    'Transaction validation benchmarks',
    [
      ['<-2>', `OP_DUP OP_2DUP ${repeat('OP_3DUP', 47)} OP_DUP ${repeat(`<0xffffffff7f> ${repeat('OP_MUL', 24)} OP_DROP`, 5)} <0xffffff7f> ${repeat('OP_MUL', 26)}`, 'Within BCH_2023_05 P2SH/standard, single-input limits, maximize OP_MUL', ['nop2sh_ignore'], minimalScenarioStandard],
      ['<-2>', `OP_DUP OP_2DUP ${repeat('OP_3DUP', 47)} OP_DUP ${repeat(`<0xffffffff7f> ${repeat('OP_MUL', 24)} OP_DROP`, 5)} <0xffffff7f> ${repeat('OP_MUL', 26)}`, 'Within BCH_2023_05 P2SH/standard, single-input limits, maximize OP_MUL', ['nonstandard', 'p2sh_ignore'], minimalScenarioStandardPlusBytes(1)],
    ],
  ],
] as const satisfies VmbTestDefinitionGroup[];
