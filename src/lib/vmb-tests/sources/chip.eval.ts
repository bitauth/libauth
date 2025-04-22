import { range } from '../../format/format.js';
import type { VmbTestDefinitionGroup } from '../../lib.js';
import { packedTransactionScenario, repeat } from '../bch-vmb-test-mixins.js';

export default [
  [
    'Transaction validation benchmarks',
    [
      [``, `<OP_ACTIVEBYTECODE OP_EVAL> OP_EVAL`, 'OP_EVAL infinite recursion (OP_ACTIVEBYTECODE)', ['chip_eval_invalid']],
      [``, `<OP_ACTIVEBYTECODE OP_EVAL> OP_EVAL`, 'OP_EVAL infinite recursion, packed inputs (OP_ACTIVEBYTECODE)', ['chip_eval_invalid', 'p2sh_ignore'], packedTransactionScenario('p2s', 2437)],
      [``, `<OP_DUP OP_EVAL> OP_DUP OP_EVAL`, 'OP_EVAL infinite recursion (OP_DUP)', ['chip_eval_invalid']],
      [`<1> <50> <OP_1SUB OP_IFDUP OP_IF OP_ACTIVEBYTECODE OP_EVAL OP_ENDIF> <27> <OP_1SUB OP_IFDUP OP_IF OP_ACTIVEBYTECODE OP_EVAL OP_ENDIF>`, `OP_EVAL OP_EVAL`, 'OP_EVAL recursive OP_1SUB countdown', ['chip_eval']],
      [`<1> <50> <OP_1SUB OP_IFDUP OP_IF OP_ACTIVEBYTECODE OP_EVAL OP_ENDIF> <27> <OP_1SUB OP_IFDUP OP_IF OP_ACTIVEBYTECODE OP_EVAL OP_ENDIF>`, `OP_EVAL OP_EVAL`, 'OP_EVAL recursive OP_1SUB countdown, packed inputs', ['chip_eval', 'p2sh_ignore'], packedTransactionScenario('p2s', 1665)],
      [`<1> <1> <0> <0> <0>`, `${repeat('OP_3DUP', 62)} OP_BEGIN OP_EVAL OP_UNTIL`, 'Within BCH_2026_05 standard, single-input limits, maximize OP_EVAL density within a loop', ['chip_eval', 'p2sh_ignore']],
      [`<1> <1> <0> <0> <0>`, `${repeat('OP_3DUP', 62)} OP_BEGIN OP_EVAL OP_UNTIL`, 'Within BCH_2026_05 standard, single-input limits, maximize OP_EVAL density within a loop, packed inputs', ['chip_eval', 'p2sh_ignore'], packedTransactionScenario('p2s', 2172)],
      [
        `<1>`,
        `<0x4d00014cfd4cfa4cf74cf44cf14cee4ceb4ce84ce54ce24cdf4cdc4cd94cd64cd34cd04ccd4cca4cc74cc44cc14cbe4cbb4cb84cb54cb24caf4cac4ca94ca64ca34ca04c9d4c9a4c974c944c914c8e4c8b4c884c854c824c7f4c7c4c794c764c734c704c6d4c6a4c674c644c614c5e4c5b4c584c554c524c4f4c4c4a48464442403e3c3a38363432302e2c2a28262422201e1c1a18161412100e0c0a0806040200> <0x6262626262626262626262> OP_DUP OP_DUP OP_CAT OP_CAT OP_DUP OP_DUP OP_CAT OP_CAT OP_CAT OP_EVAL`,
        'Within BCH_2026_05 standard, single-input limits, maximize OP_EVAL nesting (OP_EVAL to depth 100)',
        ['chip_eval', 'p2sh_ignore'],
      ],
      [
        `<1>`,
        `<0x4d00014cfd4cfa4cf74cf44cf14cee4ceb4ce84ce54ce24cdf4cdc4cd94cd64cd34cd04ccd4cca4cc74cc44cc14cbe4cbb4cb84cb54cb24caf4cac4ca94ca64ca34ca04c9d4c9a4c974c944c914c8e4c8b4c884c854c824c7f4c7c4c794c764c734c704c6d4c6a4c674c644c614c5e4c5b4c584c554c524c4f4c4c4a48464442403e3c3a38363432302e2c2a28262422201e1c1a18161412100e0c0a0806040200> <0x6262626262626262626262> OP_DUP OP_DUP OP_CAT OP_CAT OP_DUP OP_DUP OP_CAT OP_CAT OP_CAT OP_EVAL`,
        'Within BCH_2026_05 standard, single-input limits, maximize OP_EVAL nesting (OP_EVAL to depth 100), packed inputs',
        ['chip_eval', 'p2sh_ignore'],
        packedTransactionScenario('p2s', 2379),
      ],
    ],
  ],
  [
    'OP_EVAL',
    [
      [`<OP_1>`, `OP_EVAL`, 'Works', ['chip_eval']],
      [`<OP_1>`, `OP_EVAL OP_1 OP_EQUAL`, 'OP_1 OP_EVAL equivalent to OP_1', ['chip_eval']],
      [``, `OP_EVAL OP_1`, 'Requires a stack item', ['chip_eval_invalid']],
      [`<OP_13>`, `OP_EVAL OP_13 OP_EQUAL`, 'OP_13 OP_EVAL equivalent to OP_13', ['chip_eval']],
      [`<<OP_1> OP_EVAL>`, `OP_EVAL`, 'Can be nested', ['chip_eval']],
      [`<<<OP_1> OP_EVAL> OP_EVAL>`, `OP_EVAL`, 'Can be nested (2x)', ['chip_eval']],
      [`<<<OP_7> OP_EVAL> OP_EVAL>`, `OP_EVAL OP_7 OP_EQUAL`, 'Can be nested (3x)', ['chip_eval']],
      [
        `< ${range(99)
          .map(() => '<')
          .join('')} OP_1 ${range(99)
          .map(() => '> OP_EVAL')
          .join('')} >`,
        `OP_EVAL`,
        'Can be nested (99x)',
        ['chip_eval'],
      ],
      [
        `< ${range(100)
          .map(() => '<')
          .join('')} OP_1 ${range(100)
          .map(() => '> OP_EVAL')
          .join('')} >`,
        `OP_EVAL`,
        'Control stack limited to depth of 100',
        ['chip_eval_invalid'],
      ],
      [
        ``,
        `${range(50)
          .map(() => '<1> OP_IF <')
          .join('')} OP_1 ${range(50)
          .map(() => '> OP_EVAL OP_ENDIF')
          .join('')}`,
        'Nesting with OP_IF/OP_ENDIF to depth 100, "OP_1" at 100',
        ['chip_eval', 'p2s_nonstandard'],
      ],
      [
        ``,
        `${range(50)
          .map(() => '<1> OP_IF <')
          .join('')} OP_1 OP_IF OP_1 OP_ENDIF ${range(50)
          .map(() => '> OP_EVAL OP_ENDIF')
          .join('')}`,
        'Nesting with OP_IF/OP_ENDIF to depth 100, OP_IF at 100',
        ['chip_eval_invalid'],
      ],
      [
        ``,
        `${range(49)
          .map(() => '<1> OP_IF <')
          .join('')} <1> OP_IF <1> OP_IF <1> OP_ENDIF OP_ENDIF ${range(49)
          .map(() => '> OP_EVAL OP_ENDIF')
          .join('')}`,
        'Nesting with OP_IF/OP_ENDIF to depth 100, OP_IF at 99',
        ['chip_eval', 'p2s_nonstandard'],
      ],
      [
        ``,
        `${range(49)
          .map(() => '<1> OP_IF <')
          .join('')} <0> OP_NOTIF <1> OP_NOTIF <0> OP_ELSE <1> OP_ENDIF OP_ENDIF ${range(49)
          .map(() => '> OP_EVAL OP_ENDIF')
          .join('')}`,
        'Nesting with OP_IF/OP_ENDIF to depth 100, OP_NOTIF + OP_ELSE at 99',
        ['chip_eval', 'p2s_nonstandard'],
      ],
      [
        ``,
        `${range(50)
          .map(() => '<1> OP_IF <')
          .join('')} OP_1 OP_ELSE ${range(50)
          .map(() => '> OP_EVAL OP_ENDIF')
          .join('')}`,
        'Nesting with OP_IF/OP_ENDIF to depth 100, unexpected OP_ELSE',
        ['chip_eval_invalid'],
      ],
      [
        ``,
        `${range(50)
          .map(() => '<1> OP_IF <')
          .join('')} <OP_1> OP_EVAL ${range(50)
          .map(() => '> OP_EVAL OP_ENDIF')
          .join('')}`,
        'Nesting with OP_IF/OP_ENDIF to depth 100, attempt "<OP_1> OP_EVAL" at 100',
        ['chip_eval_invalid'],
      ],
      [
        ``,
        `${range(50)
          .map(() => '<1> OP_IF <')
          .join('')} OP_1 OP_0 OP_EVAL ${range(50)
          .map(() => '> OP_EVAL OP_ENDIF')
          .join('')}`,
        'Nesting with OP_IF/OP_ENDIF to depth 100, attempt "OP_1 OP_0 OP_EVAL" (evaluation of empty bytecode) at 100',
        ['chip_eval_invalid'],
      ],
      [`<<OP_2 OP_2 OP_ADD> OP_EVAL>`, `OP_EVAL OP_4 OP_EQUAL`, '((2 2 +)) 4 =', ['chip_eval']],
      [`<<OP_2 OP_2 OP_SUB> OP_EVAL>`, `OP_EVAL OP_0 OP_EQUAL`, '((2 2 -)) 0 =', ['chip_eval']],
      [`<<OP_2 OP_2 OP_ADD> OP_EVAL>`, `OP_EVAL OP_0 OP_EQUAL`, '((2 2 +)) 0 = (reject)', ['chip_eval_invalid']],
      [`<<OP_2 OP_2 OP_SUB> OP_EVAL>`, `OP_EVAL OP_4 OP_EQUAL`, '((2 2 -)) 4 = (reject)', ['chip_eval_invalid']],
      [`<<OP_2> OP_EVAL OP_2 OP_ADD>`, `OP_EVAL OP_4 OP_EQUAL`, '((2) 2 +) 4 =', ['chip_eval']],
      [`<OP_2 <OP_2> OP_EVAL OP_ADD>`, `OP_EVAL OP_4 OP_EQUAL`, '(2 (2) +) 4 =', ['chip_eval']],
      [`<OP_2 OP_2 <OP_ADD> OP_EVAL>`, `OP_EVAL OP_4 OP_EQUAL`, '(2 2 (+)) 4 =', ['chip_eval']],
      [`<OP_2 OP_2 <OP_ADD> OP_EVAL>`, `OP_EVAL OP_4 <OP_EQUAL> OP_EVAL`, '(2 2 (+)) 4 (=)', ['chip_eval']],
      [`<OP_2>`, `<OP_2 OP_ADD> OP_CAT OP_EVAL OP_4 OP_EQUAL`, 'Concatenated instructions', ['chip_eval']],
      [`<OP_ACTIVEBYTECODE>`, `OP_DUP OP_EVAL OP_EQUAL`, 'Exposes evaluated instructions to OP_ACTIVEBYTECODE', ['chip_eval']],
      [`<6>`, `<0> <1> OP_ROT <OP_1SUB OP_TOALTSTACK OP_SWAP OP_OVER OP_ADD OP_FROMALTSTACK OP_IFDUP OP_IF OP_ACTIVEBYTECODE OP_ELSE <0> OP_ENDIF OP_EVAL> OP_EVAL OP_NIP <13> OP_EQUAL`, 'Fibonacci to 13', ['chip_eval']],
      [`<1>`, `<OP_IF <1> OP_ENDIF> OP_EVAL`, 'OP_IF inside OP_EVAL', ['chip_eval']],
      [`<0>`, `<OP_IF <1> OP_ENDIF> OP_EVAL`, 'OP_IF inside OP_EVAL (reject)', ['chip_eval_invalid']],
      [`<0>`, `<OP_IF <0> OP_ELSE <1> OP_ENDIF> OP_EVAL`, 'OP_IF + OP_ELSE inside OP_EVAL', ['chip_eval']],
      [`<1>`, `<OP_IF <0> OP_ELSE <1> OP_ENDIF> OP_EVAL`, 'OP_IF + OP_ELSE inside OP_EVAL (reject)', ['chip_eval_invalid']],
      [`<0>`, `<OP_NOTIF <1> OP_ENDIF> OP_EVAL`, 'OP_NOTIF inside OP_EVAL', ['chip_eval']],
      [`<1>`, `<OP_NOTIF <1> OP_ENDIF> OP_EVAL`, 'OP_NOTIF inside OP_EVAL (reject)', ['chip_eval_invalid']],
      [`<1>`, `<OP_NOTIF <0> OP_ELSE <1> OP_ENDIF> OP_EVAL`, 'OP_NOTIF + OP_ELSE inside OP_EVAL', ['chip_eval']],
      [`<0>`, `<OP_NOTIF <0> OP_ELSE <1> OP_ENDIF> OP_EVAL`, 'OP_NOTIF + OP_ELSE inside OP_EVAL (reject)', ['chip_eval_invalid']],
      [`<1>`, `<OP_IF <1>> OP_EVAL`, 'Unclosed OP_IF inside OP_EVAL', ['chip_eval_invalid']],
      [`<1>`, `<OP_IF <1>> OP_EVAL OP_ENDIF`, 'Unclosed OP_IF inside OP_EVAL, attempt outer close', ['chip_eval_invalid']],
      [`<1> <1>`, `<OP_IF> OP_EVAL`, 'Single OP_IF inside OP_EVAL', ['chip_eval_invalid']],
      [`<1> <1>`, `<OP_IF> OP_EVAL OP_ENDIF`, 'Single OP_IF inside OP_EVAL, attempt outer close', ['chip_eval_invalid']],
    ],
  ],
] as const satisfies VmbTestDefinitionGroup[];
