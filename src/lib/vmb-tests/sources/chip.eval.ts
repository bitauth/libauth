import { range } from '../../format/format.js';
import type { VmbTestDefinitionGroup } from '../../lib.js';

export default [
  [
    'OP_EVAL',
    [
      [`<OP_1>`, `OP_EVAL`, 'Works', ['chip_eval']],
      [``, `OP_EVAL OP_1`, 'Requires a stack item', ['chip_eval_invalid']],
      [`<<OP_1> OP_EVAL>`, `OP_EVAL`, 'Can be nested', ['chip_eval']],
      [`<<<OP_1> OP_EVAL> OP_EVAL>`, `OP_EVAL`, 'Can be nested (2x)', ['chip_eval']],
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
        'Nesting with OP_IF/OP_ENDIF to depth 100',
        ['chip_eval', '2026_nop2sh_nonstandard'],
      ],
      [
        ``,
        `${range(50)
          .map(() => '<1> OP_IF <')
          .join('')} OP_1 ${range(50)
          .map(() => '> OP_EVAL OP_ENDIF')
          .join('')}`,
        'Nesting with OP_IF/OP_ENDIF to depth 100',
        ['chip_eval', '2026_nop2sh_nonstandard'],
      ],
      [
        ``,
        `${range(50)
          .map(() => '<1> OP_IF <')
          .join('')} OP_1 ${range(50)
          .map(() => '> OP_EVAL OP_ENDIF')
          .join('')}`,
        'Nesting with OP_IF/OP_ENDIF to depth 100, "OP_1" at 100',
        ['chip_eval', '2026_nop2sh_nonstandard'],
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
      [`<OP_ACTIVEBYTECODE OP_DUP>`, `OP_EVAL OP_EQUAL`, 'Exposes evaluated instructions to OP_ACTIVEBYTECODE', ['chip_eval']],
      [`<6>`, `<0> <1> OP_ROT <OP_1SUB OP_TOALTSTACK OP_SWAP OP_OVER OP_ADD OP_FROMALTSTACK OP_IFDUP OP_IF OP_ACTIVEBYTECODE OP_ELSE <0> OP_ENDIF OP_EVAL> OP_EVAL OP_NIP <13> OP_EQUAL`, 'Fibonacci to 13', ['chip_eval']],
    ],
  ],
] as const satisfies VmbTestDefinitionGroup[];
