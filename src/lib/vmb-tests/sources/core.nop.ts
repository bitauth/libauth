import type { VmbTestDefinitionGroup } from '../../lib.js';

export default [
  [
    'OP_NOP1-OP_NOP10 expansion range',
    [
      ['<1>', 'OP_NOP1', 'OP_NOP1 is non-standard', ['nonstandard']],
      ['<1>', 'OP_NOP4', 'OP_NOP4 is non-standard', ['nonstandard']],
      ['<1>', 'OP_NOP5', 'OP_NOP5 is non-standard', ['nonstandard']],
      ['<1>', 'OP_NOP6', 'OP_NOP6 is non-standard', ['nonstandard']],
      ['<1>', 'OP_NOP7', 'OP_NOP7 is non-standard', ['nonstandard']],
      ['<1>', 'OP_NOP8', 'OP_NOP8 is non-standard', ['nonstandard']],
      ['<1>', 'OP_NOP9', 'OP_NOP9 is non-standard', ['nonstandard']],
      ['<1>', 'OP_NOP10', 'OP_NOP10 is non-standard', ['nonstandard']],
    ],
  ],
] as const satisfies VmbTestDefinitionGroup[];
