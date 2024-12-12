import type { VmbTestDefinitionGroup } from '../../lib.js';

export default [
  [
    'OP_POW',
    [
      ['<2>', '<0> OP_POW <1> OP_EQUAL', '2 ** 0 === 1', ['chip_pow']],
      ['<2>', '<0> OP_POW', '2 ** 0', ['chip_pow']],
      ['', 'OP_POW', 'No stack items', ['chip_pow_invalid']],
      ['<2>', 'OP_POW', '1 stack item', ['chip_pow_invalid']],
      ['<2>', '<32> OP_POW <4_294_967_296> OP_EQUAL', '2 ** 32', ['chip_pow']],
      ['<3>', '<32> OP_POW <1_853_020_188_851_841> OP_EQUAL', '3 ** 32', ['chip_pow']],
    ],
  ],
] as const satisfies VmbTestDefinitionGroup[];
