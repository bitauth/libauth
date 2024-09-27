import type { VmbTestDefinitionGroup } from '../../lib.js';

export default [
  [
    'Standard and P2SH transaction inputs may only include push operations',
    [
      ['<0> OP_IF OP_RESERVED OP_ENDIF', '<1>', 'OP_RESERVED is invalid in unlocking bytecode (even if not executed)', ['invalid']],
      ['OP_NOP', '<1>', 'OP_NOP is invalid in unlocking bytecode', ['invalid']],
      // TODO: ensure all non-push opcodes are invalid when found in unlocking bytecode
      ['<0> OP_UTXOTOKENCATEGORY', '<0> OP_EQUAL', 'OP_UTXOTOKENCATEGORY is invalid in unlocking bytecode', ['invalid']],
      ['<0> OP_OUTPUTTOKENCATEGORY', '<0> OP_EQUAL', 'OP_OUTPUTTOKENCATEGORY is invalid in unlocking bytecode', ['invalid']],
      ['<0> OP_UTXOTOKENCOMMITMENT', '<0> OP_EQUAL', 'OP_UTXOTOKENCOMMITMENT is invalid in unlocking bytecode', ['invalid']],
      ['<0> OP_OUTPUTTOKENCOMMITMENT', '<0> OP_EQUAL', 'OP_OUTPUTTOKENCOMMITMENT is invalid in unlocking bytecode', ['invalid']],
      ['<0> OP_UTXOTOKENAMOUNT', '<0> OP_EQUAL', 'OP_UTXOTOKENAMOUNT is invalid in unlocking bytecode', ['invalid']],
      ['<0> OP_OUTPUTTOKENAMOUNT', '<0> OP_EQUAL', 'OP_OUTPUTTOKENAMOUNT is invalid in unlocking bytecode', ['invalid']],
    ],
  ],
] as const satisfies VmbTestDefinitionGroup[];
