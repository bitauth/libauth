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

      ['<0xffffffff>', `${repeat('OP_DUP OP_CAT', 11)} <0xff> OP_DIV`, 'Within BCH_2025_05 P2SH/standard, single-input limits, maximize 1-by-8192 byte OP_DIV (all bits set, long bottom operand)', ['2023_invalid', 'nop2sh_ignore', 'p2sh32_ignore'], minimalScenarioStandard],
      ['<0xffffffff>', `${repeat('OP_DUP OP_CAT', 11)} <0xff> OP_SWAP OP_DIV OP_NOT`, 'Within BCH_2025_05 P2SH/standard, single-input limits, maximize 1-by-8192 byte OP_DIV (all bits set, long top operand)', ['2023_invalid', 'nop2sh_ignore'], minimalScenarioStandard],
      ['<0xffffffff>', `OP_DUP OP_DUP ${repeat('OP_DUP OP_CAT', 10)} OP_ROT OP_ROT OP_CAT OP_DIV`, 'Within BCH_2025_05 P2SH20/standard, single-input limits, maximize 4096-by-8 byte OP_DIV (all bits set)', ['2023_invalid', 'nop2sh_ignore'], minimalScenarioStandard],
      ['<0xffffffff>', `${repeat('OP_DUP OP_CAT', 2)} OP_DUP ${repeat('OP_DUP OP_CAT', 7)} OP_DIV OP_NOT`, 'Within BCH_2025_05 P2SH/standard, single-input limits, maximize 16-by-2048 byte OP_DIV (all bits set)', ['2023_invalid', 'nop2sh_ignore'], minimalScenarioStandard],
      ['<0xffffffff>', `${repeat('OP_DUP OP_CAT', 3)} OP_DUP ${repeat('OP_DUP OP_CAT', 5)} OP_DIV OP_NOT`, 'Within BCH_2025_05 P2SH/standard, single-input limits, maximize 32-by-1024 byte OP_DIV (all bits set)', ['2023_invalid', 'nop2sh_ignore'], minimalScenarioStandard],
      ['<0xffffffff>', `${repeat('OP_DUP OP_CAT', 4)} OP_DUP ${repeat('OP_DUP OP_CAT', 3)} OP_DIV OP_NOT`, 'Within BCH_2025_05 P2SH/standard, single-input limits, maximize 64-by-512 byte OP_DIV (all bits set)', ['2023_invalid', 'nop2sh_ignore'], minimalScenarioStandard],
      ['<0xffffffff>', `${repeat('OP_DUP OP_CAT', 5)} OP_DUP ${repeat('OP_DUP OP_CAT', 1)} OP_DIV OP_NOT`, 'Within BCH_2025_05 P2SH/standard, single-input limits, maximize 128-by-256 byte OP_DIV (all bits set)', ['2023_invalid', 'nop2sh_ignore'], minimalScenarioStandard],
      ['<0xffffffff>', `${repeat('OP_DUP OP_CAT', 3)} OP_DUP ${repeat('OP_DUP OP_CAT', 2)} OP_DUP OP_ROT OP_CAT OP_DUP OP_CAT OP_DIV OP_NOT`, 'Within BCH_2025_05 P2SH/standard, single-input limits, maximize 128-by-320 byte OP_DIV (all bits set)', ['2023_invalid', 'nop2sh_ignore', 'p2sh32_ignore'], minimalScenarioStandard],
      ['<0xff>', `<195> OP_NUM2BIN OP_REVERSEBYTES OP_DUP OP_DIV`, 'Within BCH_2025_05 P2SH/standard, single-input limits, maximize square OP_DIV (195-by-195 byte) (highest byte set)', ['2023_invalid', 'nop2sh_ignore'], minimalScenarioStandard],
      ['<0xff> <8033>', `OP_NUM2BIN OP_REVERSEBYTES <0xff> OP_DIV`, 'Within BCH_2025_05 P2SH20/standard, single-input limits, maximize 1-byte OP_DIV (1-by-8033 byte) (highest byte set)', ['2023_invalid', 'nop2sh_ignore', 'p2sh32_ignore'], minimalScenarioStandard],
      ['<0xff> <8028>', `OP_NUM2BIN OP_REVERSEBYTES <0xff> OP_DIV`, 'Within BCH_2025_05 P2SH32/standard, single-input limits, maximize 1-byte OP_DIV (1-by-8028 byte) (highest byte set)', ['2023_invalid', 'nop2sh_ignore', 'p2sh20_ignore'], minimalScenarioStandard],

      ['<0xffffffff>', `${repeat('OP_DUP OP_CAT', 11)} <0xff> OP_MOD`, 'Within BCH_2025_05 P2SH/standard, single-input limits, maximize 1-by-8192 byte OP_MOD (all bits set, long bottom operand)', ['2023_invalid', 'nop2sh_ignore', 'p2sh32_ignore'], minimalScenarioStandard],
      ['<0xffffffff>', `${repeat('OP_DUP OP_CAT', 11)} <0xff> OP_SWAP OP_MOD`, 'Within BCH_2025_05 P2SH/standard, single-input limits, maximize 1-by-8192 byte OP_MOD (all bits set, long top operand)', ['2023_invalid', 'nop2sh_ignore'], minimalScenarioStandard],
      ['<0xffffffff>', `OP_DUP OP_DUP ${repeat('OP_DUP OP_CAT', 10)} OP_ROT OP_ROT OP_CAT OP_MOD`, 'Within BCH_2025_05 P2SH20/standard, single-input limits, maximize 4096-by-8 byte OP_MOD (all bits set)', ['2023_invalid', 'nop2sh_ignore'], minimalScenarioStandard],
      ['<0xffffffff>', `${repeat('OP_DUP OP_CAT', 2)} OP_DUP ${repeat('OP_DUP OP_CAT', 7)} OP_MOD`, 'Within BCH_2025_05 P2SH/standard, single-input limits, maximize 16-by-2048 byte OP_MOD (all bits set)', ['2023_invalid', 'nop2sh_ignore'], minimalScenarioStandard],
      ['<0xffffffff>', `${repeat('OP_DUP OP_CAT', 3)} OP_DUP ${repeat('OP_DUP OP_CAT', 5)} OP_MOD`, 'Within BCH_2025_05 P2SH/standard, single-input limits, maximize 32-by-1024 byte OP_MOD (all bits set)', ['2023_invalid', 'nop2sh_ignore'], minimalScenarioStandard],
      ['<0xffffffff>', `${repeat('OP_DUP OP_CAT', 4)} OP_DUP ${repeat('OP_DUP OP_CAT', 3)} OP_MOD`, 'Within BCH_2025_05 P2SH/standard, single-input limits, maximize 64-by-512 byte OP_MOD (all bits set)', ['2023_invalid', 'nop2sh_ignore'], minimalScenarioStandard],
      ['<0xffffffff>', `${repeat('OP_DUP OP_CAT', 5)} OP_DUP ${repeat('OP_DUP OP_CAT', 1)} OP_MOD`, 'Within BCH_2025_05 P2SH/standard, single-input limits, maximize 128-by-256 byte OP_MOD (all bits set)', ['2023_invalid', 'nop2sh_ignore'], minimalScenarioStandard],
      ['<0xffffffff>', `${repeat('OP_DUP OP_CAT', 3)} OP_DUP ${repeat('OP_DUP OP_CAT', 2)} OP_DUP OP_ROT OP_CAT OP_DUP OP_CAT OP_MOD`, 'Within BCH_2025_05 P2SH/standard, single-input limits, maximize 128-by-320 byte OP_MOD (all bits set)', ['2023_invalid', 'nop2sh_ignore', 'p2sh32_ignore'], minimalScenarioStandard],
      ['<0xff> <198>', `OP_NUM2BIN OP_REVERSEBYTES OP_DUP OP_MOD OP_NOT`, 'Within BCH_2025_05 P2SH/standard, single-input limits, maximize square OP_MOD (198-by-198 byte) (highest byte set)', ['2023_invalid', 'nop2sh_ignore'], minimalScenarioStandard],
      ['<0xff> <10000>', `OP_NUM2BIN OP_REVERSEBYTES <0xffff> OP_MOD`, 'Within BCH_2025_05 P2SH/standard, single-input limits, maximize 1-byte OP_MOD (1-by-10000 byte) (highest byte set)', ['2023_invalid', 'nop2sh_ignore'], minimalScenarioStandard],
    ],
  ],
] as const satisfies VmbTestDefinitionGroup[];
