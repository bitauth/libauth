/**
 * See `bch-vmb-tests.ts` for details about modifying this file.
 */

import type { VmbTestDefinitionGroup } from '../lib.js';

export const loopsTestDefinitionsBch: VmbTestDefinitionGroup = [
  'CHIP-2021-05-loops',
  [
    // TODO: support P2SH32
    ['<1> <1>', 'OP_BEGIN OP_DUP OP_UNTIL OP_DROP', '[TODO: support P2SH32] loop until the first 0x01', ['chip_loops', 'p2sh32_ignore']],
    // TODO: support P2SH32
    ['<1> <0>', 'OP_BEGIN OP_DUP OP_UNTIL OP_DROP', '[TODO: support P2SH32] infinite loops fail after exhausting repeated bytes limit', ['chip_loops_invalid', 'p2sh32_ignore']],
  ],
];
