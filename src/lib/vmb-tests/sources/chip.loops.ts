import type { VmbTestDefinitionGroup } from '../../lib.js';

export default [
  [
    'CHIP-2021-05-loops',
    [
      ['<1> <1>', 'OP_BEGIN OP_DUP OP_UNTIL OP_DROP', 'loop until the first 0x01', ['chip_loops']],
      ['<1> <0>', 'OP_BEGIN OP_DUP OP_UNTIL OP_DROP', 'infinite loops fail after exhausting repeated bytes limit', ['chip_loops_invalid']],
    ],
  ],
] as const satisfies VmbTestDefinitionGroup[];
