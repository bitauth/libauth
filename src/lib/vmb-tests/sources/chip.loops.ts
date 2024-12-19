import type { VmbTestDefinitionGroup } from '../../lib.js';
import { packedTransactionScenario } from '../bch-vmb-test-mixins.js';

export default [
  [
    'Transaction validation benchmarks',
    [
      ['', '<0> OP_BEGIN OP_DUP OP_UNTIL', 'infinite loop, packed inputs', ['chip_loops_invalid', 'p2sh_ignore'], packedTransactionScenario('nop2sh', 2437)],
      ['', '<0> <520> OP_NUM2BIN OP_BEGIN OP_DUP OP_UNTIL', 'infinite loop of max duplication, packed inputs', ['chip_loops_invalid', 'p2sh_ignore'], packedTransactionScenario('nop2sh', 2437)],
    ],
  ],
  [
    'OP_BEGIN/OP_UNTIL',
    [
      ['<0>', 'OP_BEGIN OP_DUP OP_UNTIL', 'infinite loop', ['chip_loops_invalid']],
      ['<1> <1>', 'OP_BEGIN OP_DUP OP_UNTIL OP_DROP', 'loop until the first 0x01', ['chip_loops']],
      ['<1> <0>', 'OP_BEGIN OP_DUP OP_UNTIL OP_DROP', 'infinite loop, attempt success', ['chip_loops_invalid']],
      ['<6>', '<0> <1> OP_ROT OP_BEGIN OP_1SUB OP_TOALTSTACK OP_SWAP OP_OVER OP_ADD OP_FROMALTSTACK OP_IFDUP OP_NOT OP_UNTIL OP_NIP <13> OP_EQUAL', 'Fibonacci to 13', ['chip_loops']],
    ],
  ],
] as const satisfies VmbTestDefinitionGroup[];
