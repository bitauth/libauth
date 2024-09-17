import type { VmbTestDefinitionGroup } from '../../lib.js';
import { minimalScenarioNonStandard, minimalScenarioStandard, minimalScenarioStandardPlusBytes, repeat } from '../bch-vmb-test-mixins.js';

export default [
  [
    'Transaction validation benchmarks',
    [
      ['<1> <1> <520>', `OP_NUM2BIN OP_DUP OP_2DUP ${repeat('OP_3DUP', 78)} ${repeat('OP_2DROP', 119)}`, 'Within BCH_2023_05 P2SH/standard, single-input limits, maximize bytes pushed to the stack', ['nop2sh_ignore'], minimalScenarioStandard],
      ['', `<1> <1> <520> OP_NUM2BIN OP_DUP OP_2DUP ${repeat('OP_3DUP', 78)} ${repeat('OP_2DROP', 119)}`, 'Within BCH_2023_05 nonP2SH/nonstandard, single-input limits, maximize bytes pushed to the stack', ['invalid', 'p2sh_ignore', '2023_nop2sh_nonstandard'], minimalScenarioStandardPlusBytes(3)],
      ['<1> <$(<1> <397> OP_NUM2BIN)> <$(<1> <520> OP_NUM2BIN)> <$(<2> <520> OP_NUM2BIN)>', `OP_2DUP ${repeat('OP_3DUP', 79)} ${repeat('OP_2DROP', 121)}`, 'Within BCH_2023_05 P2SH/standard, single-input limits, maximize stack usage', ['nop2sh_ignore'], minimalScenarioStandard],
      ['<1> <$(<1> <397> OP_NUM2BIN)> <$(<1> <520> OP_NUM2BIN)> <$(<2> <520> OP_NUM2BIN)>', `OP_2DUP ${repeat('OP_3DUP', 79)} ${repeat('OP_2DROP', 121)}`, 'Within BCH_2023_05 nonP2SH/nonstandard, single-input limits, maximize stack usage', ['p2sh_ignore'], minimalScenarioNonStandard],
      ['<0>', `OP_DUP OP_2DUP ${repeat('OP_3DUP', 332)} ${repeat('OP_1ADD', 1174)} OP_DROP ${repeat('<20> OP_CHECKMULTISIGVERIFY', 45)} <7> OP_CHECKMULTISIG`, 'Within BCH_2025_05 P2SH/standard, single-input limits, maximize stack usage checking (OP_1ADD)', ['2023_invalid', 'nop2sh_ignore'], minimalScenarioStandard],
      ['<$(<0> <2500> OP_NUM2BIN)>', `OP_BIN2NUM OP_DUP OP_2DUP ${repeat('OP_3DUP', 332)} ${repeat('OP_1ADD', 9527)} OP_DROP ${repeat('<20> OP_CHECKMULTISIGVERIFY', 45)} <7> OP_CHECKMULTISIG`, 'Within BCH_2025_05 nonP2SH/nonstandard, single-input limits, maximize stack usage checking (OP_1ADD)', ['2023_invalid', '2025_nonstandard', 'p2sh_ignore'], minimalScenarioStandard],
      ['<0>', `OP_DUP OP_2DUP ${repeat('OP_3DUP', 332)} ${repeat('OP_TOALTSTACK', 999)} ${repeat('OP_1ADD', 312)} OP_0NOTEQUAL`, 'Within BCH_2025_05 P2SH/standard, single-input limits, maximize alternate stack usage checking (OP_1ADD)', ['2023_invalid', 'nop2sh_ignore'], minimalScenarioStandard],
      ['<$(<0> <1251> OP_NUM2BIN)>', `OP_BIN2NUM OP_DUP OP_2DUP ${repeat('OP_3DUP', 332)} ${repeat('OP_TOALTSTACK', 999)} ${repeat('OP_1ADD', 8665)} OP_0NOTEQUAL`, 'Within BCH_2025_05 nonP2SH/nonstandard, single-input limits, maximize alternate stack usage checking (OP_1ADD)', ['2023_invalid', '2025_nonstandard', 'p2sh_ignore'], minimalScenarioStandard],
      [
        '<0>',
        `OP_DUP OP_2DUP ${repeat('OP_3DUP', 332)} ${repeat('OP_NOTIF OP_NOTIF OP_NOTIF OP_3DUP', 33)} OP_NOTIF OP_DUP ${repeat('OP_1ADD', 940)} ${repeat('OP_ENDIF', 100)} OP_DROP ${repeat('<20> OP_CHECKMULTISIGVERIFY', 45)} <7> OP_CHECKMULTISIG`,
        'Within BCH_2025_05 P2SH/standard, single-input limits, maximize control stack and stack usage checking (OP_NOTIF, OP_1ADD)',
        ['2023_invalid', 'nop2sh_ignore'],
        minimalScenarioStandard,
      ],
      [
        '<$(<0> <1249> OP_NUM2BIN)>',
        `OP_BIN2NUM OP_DUP OP_2DUP ${repeat('OP_3DUP', 332)} ${repeat('OP_NOTIF OP_NOTIF OP_NOTIF OP_3DUP', 33)} OP_NOTIF OP_DUP ${repeat('OP_1ADD', 9293)} ${repeat('OP_ENDIF', 100)} OP_DROP ${repeat('<20> OP_CHECKMULTISIGVERIFY', 45)} <7> OP_CHECKMULTISIG`,
        'Within BCH_2025_05 nonP2SH/nonstandard, single-input limits, maximize control stack and stack usage checking (OP_NOTIF, OP_1ADD)',
        ['2023_invalid', '2025_nonstandard', 'p2sh_ignore'],
        minimalScenarioStandard,
      ],
      ['<1>', `OP_DUP OP_2DUP ${repeat('OP_3DUP', 234)} ${repeat('OP_IF', 100)} ${repeat('OP_ENDIF OP_IF', 605)} ${repeat('OP_ENDIF', 100)}`, 'Within BCH_2025_05 P2SH/standard, single-input limits, maximize control stack usage checking (OP_IF)', ['2023_invalid', 'nop2sh_ignore'], minimalScenarioStandard],
      ['<1>', `OP_DUP OP_2DUP ${repeat('OP_3DUP', 32)} ${repeat('OP_IF', 100)} ${repeat('OP_ELSE', 1411)} ${repeat('OP_ENDIF', 100)} <1>`, 'Within BCH_2025_05 P2SH/standard, single-input limits, maximize control stack usage checking (OP_ELSE)', ['2023_invalid', 'nop2sh_ignore'], minimalScenarioStandard],
    ],
  ],
] as const satisfies VmbTestDefinitionGroup[];
