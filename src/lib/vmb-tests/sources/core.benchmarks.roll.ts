import type { VmbTestDefinitionGroup } from '../../lib.js';
import { minimalScenarioStandard, repeat } from '../bch-vmb-test-mixins.js';

export default [
  [
    'Transaction validation benchmarks',
    [
      ['<1> <1> <520>', `OP_NUM2BIN OP_DUP OP_2DUP ${repeat('OP_3DUP', 76)} ${repeat(`<${4 + 76 * 3}> OP_ROLL`, 6)} ${repeat('OP_2DROP', 116)}`, 'Within BCH_2023_05 P2SH/standard, single-input limits, maximize bytes pushed to the stack, inner OP_ROLLs (6)', ['nop2sh_ignore'], minimalScenarioStandard],
      ['<1> <1> <520>', `OP_NUM2BIN OP_DUP OP_2DUP ${repeat('OP_3DUP', 70)} ${repeat(`<${4 + 70 * 3}> OP_ROLL`, 21)} ${repeat('OP_2DROP', 107)}`, 'Within BCH_2023_05 P2SH/standard, single-input limits, maximize bytes pushed to the stack, inner OP_ROLLs (21)', ['nop2sh_ignore'], minimalScenarioStandard],
      ['<1> <1> <520>', `OP_NUM2BIN OP_DUP OP_2DUP ${repeat('OP_3DUP', 50)} ${repeat(`<${4 + 50 * 3}> OP_ROLL`, 71)} ${repeat('OP_2DROP', 77)}`, 'Within BCH_2023_05 P2SH/standard, single-input limits, maximize bytes pushed to the stack, inner OP_ROLLs (71)', ['nop2sh_ignore'], minimalScenarioStandard],
      [repeat('<1>', 999), repeat('<998> OP_ROLL', 201), 'Within BCH_2023_05 P2SH/standard, single-input limits, maximize abusive OP_ROLL (ends with non-clean stack)', ['invalid'], minimalScenarioStandard],
      [`<0> <0> <0> <0>`, `${repeat('OP_3DUP', 331)} OP_2DUP ${repeat('<998> OP_ROLL', 293)} ${repeat('<20> OP_CHECKMULTISIGVERIFY', 45)} <7> OP_CHECKMULTISIG`, 'Within BCH_2025_05 P2SH/standard, single-input limits, maximize OP_ROLL', ['2023_invalid', 'nop2sh_invalid'], minimalScenarioStandard],
    ],
  ],
] as const satisfies VmbTestDefinitionGroup[];
