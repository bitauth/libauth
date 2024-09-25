import type { VmbTestDefinitionGroup } from '../../lib.js';
import { minimalScenarioStandard, minimalScenarioStandardPlusBytes, repeat } from '../bch-vmb-test-mixins.js';

export default [
  [
    'Transaction validation benchmarks',
    [
      ['<-2>', `OP_DUP OP_2DUP ${repeat('OP_3DUP', 47)} OP_DUP ${repeat(`<0xffffffff7f> ${repeat('OP_MUL', 24)} OP_DROP`, 5)} <0xffffff7f> ${repeat('OP_MUL', 26)}`, 'Within BCH_2023_05 P2SH/standard, single-input limits, maximize OP_MUL', ['nop2sh_ignore'], minimalScenarioStandard],
      ['<-2>', `OP_DUP OP_2DUP ${repeat('OP_3DUP', 47)} OP_DUP ${repeat(`<0xffffffff7f> ${repeat('OP_MUL', 24)} OP_DROP`, 5)} <0xffffff7f> ${repeat('OP_MUL', 26)}`, 'Within BCH_2023_05 P2SH/standard, single-input limits, maximize OP_MUL', ['nonstandard', 'p2sh_ignore'], minimalScenarioStandardPlusBytes(1)],
      ['<0xffffffff>', `${repeat('OP_DUP OP_CAT', 11)} <0xff> OP_MUL`, 'Within BCH_2025_05 P2SH/standard, single-input limits, maximize 1-by-8192 byte OP_MUL (all bits set, long bottom operand)', ['2023_invalid', 'nop2sh_ignore'], minimalScenarioStandard],
      ['<0xffffffff>', `${repeat('OP_DUP OP_CAT', 11)} <0xff> OP_SWAP OP_MUL`, 'Within BCH_2025_05 P2SH/standard, single-input limits, maximize 1-by-8192 byte OP_MUL (all bits set, long top operand)', ['2023_invalid', 'nop2sh_ignore'], minimalScenarioStandard],
      ['<0xffffffff>', `OP_DUP OP_DUP ${repeat('OP_DUP OP_CAT', 10)} OP_ROT OP_ROT OP_CAT OP_MUL`, 'Within BCH_2025_05 P2SH20/standard, single-input limits, maximize 4096-by-8 byte OP_MUL (all bits set)', ['2023_invalid', 'nop2sh_ignore'], minimalScenarioStandard],
      ['<0xffffffff>', `${repeat('OP_DUP OP_CAT', 2)} OP_DUP ${repeat('OP_DUP OP_CAT', 7)} OP_MUL`, 'Within BCH_2025_05 P2SH/standard, single-input limits, maximize 16-by-2048 byte OP_MUL (all bits set)', ['2023_invalid', 'nop2sh_ignore'], minimalScenarioStandard],
      ['<0xffffffff>', `${repeat('OP_DUP OP_CAT', 3)} OP_DUP ${repeat('OP_DUP OP_CAT', 5)} OP_MUL`, 'Within BCH_2025_05 P2SH/standard, single-input limits, maximize 32-by-1024 byte OP_MUL (all bits set)', ['2023_invalid', 'nop2sh_ignore'], minimalScenarioStandard],
      ['<0xffffffff>', `${repeat('OP_DUP OP_CAT', 4)} OP_DUP ${repeat('OP_DUP OP_CAT', 3)} OP_MUL`, 'Within BCH_2025_05 P2SH/standard, single-input limits, maximize 64-by-512 byte OP_MUL (all bits set)', ['2023_invalid', 'nop2sh_ignore'], minimalScenarioStandard],
      ['<0xffffffff>', `${repeat('OP_DUP OP_CAT', 5)} OP_DUP ${repeat('OP_DUP OP_CAT', 1)} OP_MUL`, 'Within BCH_2025_05 P2SH/standard, single-input limits, maximize 128-by-256 byte OP_MUL (all bits set)', ['2023_invalid', 'nop2sh_ignore'], minimalScenarioStandard],
      ['<0xffffffff>', `${repeat('OP_DUP OP_CAT', 3)} OP_DUP ${repeat('OP_DUP OP_CAT', 2)} OP_DUP OP_ROT OP_CAT OP_DUP OP_CAT OP_MUL`, 'Within BCH_2025_05 P2SH/standard, single-input limits, maximize 128-by-320 byte OP_MUL (all bits set)', ['2023_invalid', 'nop2sh_ignore'], minimalScenarioStandard],
      // ['<0xff> <195>', `OP_NUM2BIN OP_REVERSEBYTES OP_DUP OP_MUL`, 'Within BCH_2025_05 P2SH/standard, single-input limits, maximize square OP_MUL (195-by-195 byte) (highest byte set)', ['2023_invalid', 'nop2sh_ignore'], minimalScenarioStandard],

      // ['<0xff> <7893>', `OP_NUM2BIN OP_REVERSEBYTES OP_16 OP_MUL`, 'Within BCH_2025_05 P2SH20/standard, single-input limits, maximize top-operand OP_MUL (1-by-7893 byte) (highest byte set)', ['2023_invalid', 'nop2sh_ignore', 'p2sh32_ignore'], minimalScenarioStandard],

      // ['<0xff> <7888>', `OP_NUM2BIN OP_REVERSEBYTES OP_16 OP_MUL`, 'Within BCH_2025_05 P2SH32/standard, single-input limits, maximize top-operand OP_MUL (1-by-7893 byte) (highest byte set)', ['2023_invalid', 'nop2sh_ignore', 'p2sh20_ignore'], minimalScenarioStandard],

      // ['<0xff> <8052>', `OP_NUM2BIN OP_REVERSEBYTES <0xff> OP_MUL`, 'Within BCH_2025_05 P2SH20/standard, single-input limits, maximize 1-byte OP_MUL (1-by-8052 byte) (highest byte set)', ['2023_invalid', 'nop2sh_ignore', 'p2sh32_ignore'], minimalScenarioStandard],

      // ['<0xff> <8048>', `OP_NUM2BIN OP_REVERSEBYTES <0xff> OP_MUL`, 'Within BCH_2025_05 P2SH32/standard, single-input limits, maximize 1-byte OP_MUL (1-by-8052 byte) (highest byte set)', ['2023_invalid', 'nop2sh_ignore', 'p2sh20_ignore'], minimalScenarioStandard],
    ],
  ],
] as const satisfies VmbTestDefinitionGroup[];
