import type { VmbTestDefinitionGroup } from '../../lib.js';

export default [
  [
    'Conditionals',
    [
      ['<0>', 'OP_IF <0> OP_ENDIF <1>', 'OP_IF'],
      ['<1>', 'OP_NOTIF <0> OP_ENDIF <1>', 'OP_NOTIF'],
      ['<0> OP_IF', '<1>', 'Unbalanced OP_IF in unlocking bytecode', ['invalid']],
      ['<0> OP_IF', 'OP_ENDIF <1>', 'Unbalanced OP_IF, must OP_ENDIF in active bytecode', ['invalid']],
      ['<1> ', 'OP_IF <1>', 'Unbalanced OP_IF in locking bytecode', ['invalid']],
      ['<0> OP_NOTIF', '<1>', 'Unbalanced OP_NOTIF in unlocking bytecode', ['invalid']],
      ['<0> OP_NOTIF', 'OP_ENDIF <1>', 'Unbalanced OP_NOTIF, must OP_ENDIF in active bytecode', ['invalid']],
      ['<1> ', 'OP_NOTIF <1>', 'Unbalanced OP_NOTIF in locking bytecode', ['invalid']],
      ['<0>', 'OP_IF <0> OP_IF OP_ENDIF <1>', 'unbalanced OP_IF fails evaluation even if not executed', ['invalid']],
      ['<0>', 'OP_IF <1> OP_NOTIF OP_ENDIF <1>', 'unbalanced OP_NOTIF fails evaluation even if not executed', ['invalid']],
    ],
  ],
  [
    'Conditionally executed operations',
    [
      // TODO: all other conditional operations
      ['<0>', 'OP_IF OP_BEGIN <0> OP_UNTIL OP_ENDIF <1>', 'OP_BEGIN/OP_UNTIL are conditionally executed', ['chip_loops']],
      ['<1>', 'OP_IF OP_BEGIN <0> OP_UNTIL OP_ENDIF <1>', 'OP_BEGIN/OP_UNTIL fail on infinite loops', ['chip_loops_invalid']],
      ['<0>', 'OP_IF OP_INPUTINDEX OP_ENDIF OP_INPUTINDEX OP_INPUTINDEX OP_EQUAL', 'OP_INPUTINDEX is conditionally executed'],
      ['<0>', 'OP_IF OP_ACTIVEBYTECODE OP_ENDIF OP_ACTIVEBYTECODE OP_ACTIVEBYTECODE OP_EQUAL', 'OP_ACTIVEBYTECODE is conditionally executed'],
      ['<0>', 'OP_IF OP_TXVERSION OP_ENDIF OP_TXVERSION OP_TXVERSION OP_EQUAL', 'OP_TXVERSION is conditionally executed'],
      ['<0>', 'OP_IF OP_TXINPUTCOUNT OP_ENDIF OP_TXINPUTCOUNT OP_TXINPUTCOUNT OP_EQUAL', 'OP_TXINPUTCOUNT is conditionally executed'],
      ['<0>', 'OP_IF OP_TXOUTPUTCOUNT OP_ENDIF OP_TXOUTPUTCOUNT OP_TXOUTPUTCOUNT OP_EQUAL', 'OP_TXOUTPUTCOUNT is conditionally executed'],
      ['<0>', 'OP_IF OP_TXLOCKTIME OP_ENDIF OP_TXLOCKTIME OP_TXLOCKTIME OP_EQUAL', 'OP_TXLOCKTIME is conditionally executed'],
      ['<0>', 'OP_IF <0> OP_UTXOVALUE OP_ENDIF <0> OP_UTXOVALUE <0> OP_UTXOVALUE OP_EQUAL', 'OP_UTXOVALUE is conditionally executed'],
      ['<0>', 'OP_IF <0> OP_UTXOBYTECODE OP_ENDIF <0> OP_UTXOBYTECODE <0> OP_UTXOBYTECODE OP_EQUAL', 'OP_UTXOBYTECODE is conditionally executed'],
      ['<0>', 'OP_IF <0> OP_OUTPOINTTXHASH OP_ENDIF <0> OP_OUTPOINTTXHASH <0> OP_OUTPOINTTXHASH OP_EQUAL', 'OP_OUTPOINTTXHASH is conditionally executed'],
      ['<0>', 'OP_IF <0> OP_OUTPOINTINDEX OP_ENDIF <0> OP_OUTPOINTINDEX <0> OP_OUTPOINTINDEX OP_EQUAL', 'OP_OUTPOINTINDEX is conditionally executed'],
      ['<0>', 'OP_IF <0> OP_INPUTBYTECODE OP_ENDIF <0> OP_INPUTBYTECODE <0> OP_INPUTBYTECODE OP_EQUAL', 'OP_INPUTBYTECODE is conditionally executed'],
      ['<0>', 'OP_IF <0> OP_INPUTSEQUENCENUMBER OP_ENDIF <0> OP_INPUTSEQUENCENUMBER <0> OP_INPUTSEQUENCENUMBER OP_EQUAL', 'OP_INPUTSEQUENCENUMBER is conditionally executed'],
      ['<0>', 'OP_IF <0> OP_OUTPUTVALUE OP_ENDIF <0> OP_OUTPUTVALUE <0> OP_OUTPUTVALUE OP_EQUAL', 'OP_OUTPUTVALUE is conditionally executed'],
      ['<0>', 'OP_IF <0> OP_OUTPUTBYTECODE OP_ENDIF <0> OP_OUTPUTBYTECODE <0> OP_OUTPUTBYTECODE OP_EQUAL', 'OP_OUTPUTBYTECODE is conditionally executed'],
      // CHIPS:
      ['<0>', 'OP_IF <0> OP_UTXOTOKENCATEGORY OP_ENDIF <0> OP_UTXOTOKENCATEGORY <0> OP_UTXOTOKENCATEGORY OP_EQUAL', 'OP_UTXOTOKENCATEGORY is conditionally executed', []],
      ['<0>', 'OP_IF <0> OP_OUTPUTTOKENCATEGORY OP_ENDIF <0> OP_OUTPUTTOKENCATEGORY <0> OP_OUTPUTTOKENCATEGORY OP_EQUAL', 'OP_OUTPUTTOKENCATEGORY is conditionally executed', []],
      ['<0>', 'OP_IF <0> OP_UTXOTOKENCOMMITMENT OP_ENDIF <0> OP_UTXOTOKENCOMMITMENT <0> OP_UTXOTOKENCOMMITMENT OP_EQUAL', 'OP_UTXOTOKENCOMMITMENT is conditionally executed', []],
      ['<0>', 'OP_IF <0> OP_OUTPUTTOKENCOMMITMENT OP_ENDIF <0> OP_OUTPUTTOKENCOMMITMENT <0> OP_OUTPUTTOKENCOMMITMENT OP_EQUAL', 'OP_OUTPUTTOKENCOMMITMENT is conditionally executed', []],
      ['<0>', 'OP_IF <0> OP_UTXOTOKENAMOUNT OP_ENDIF <0> OP_UTXOTOKENAMOUNT <0> OP_UTXOTOKENAMOUNT OP_EQUAL', 'OP_UTXOTOKENAMOUNT is conditionally executed', []],
      ['<0>', 'OP_IF <0> OP_OUTPUTTOKENAMOUNT OP_ENDIF <0> OP_OUTPUTTOKENAMOUNT <0> OP_OUTPUTTOKENAMOUNT OP_EQUAL', 'OP_OUTPUTTOKENAMOUNT is conditionally executed', []],
    ],
  ],
  [
    'Unexecuted operations',
    [
      // TODO: all OP_UNKNOWNs
      ['<0>', 'OP_IF <0> OP_UTXOTOKENCATEGORY OP_DROP OP_ENDIF <1>', 'OP_UTXOTOKENCATEGORY not executed', []],
      ['<1>', 'OP_IF <0> OP_UTXOTOKENCATEGORY OP_DROP OP_ENDIF <1>', 'OP_UTXOTOKENCATEGORY executed', []],
      ['<0>', 'OP_IF <0> OP_OUTPUTTOKENCATEGORY OP_DROP OP_ENDIF <1>', 'OP_OUTPUTTOKENCATEGORY not executed', []],
      ['<1>', 'OP_IF <0> OP_OUTPUTTOKENCATEGORY OP_DROP OP_ENDIF <1>', 'OP_OUTPUTTOKENCATEGORY executed', []],
      ['<0>', 'OP_IF <0> OP_UTXOTOKENCOMMITMENT OP_DROP OP_ENDIF <1>', 'OP_UTXOTOKENCOMMITMENT not executed', []],
      ['<1>', 'OP_IF <0> OP_UTXOTOKENCOMMITMENT OP_DROP OP_ENDIF <1>', 'OP_UTXOTOKENCOMMITMENT executed', []],
      ['<0>', 'OP_IF <0> OP_OUTPUTTOKENCOMMITMENT OP_DROP OP_ENDIF <1>', 'OP_OUTPUTTOKENCOMMITMENT not executed', []],
      ['<1>', 'OP_IF <0> OP_OUTPUTTOKENCOMMITMENT OP_DROP OP_ENDIF <1>', 'OP_OUTPUTTOKENCOMMITMENT executed', []],
      ['<0>', 'OP_IF <0> OP_UTXOTOKENAMOUNT OP_DROP OP_ENDIF <1>', 'OP_UTXOTOKENAMOUNT not executed', []],
      ['<1>', 'OP_IF <0> OP_UTXOTOKENAMOUNT OP_DROP OP_ENDIF <1>', 'OP_UTXOTOKENAMOUNT executed', []],
      ['<0>', 'OP_IF <0> OP_OUTPUTTOKENAMOUNT OP_DROP OP_ENDIF <1>', 'OP_OUTPUTTOKENAMOUNT not executed', []],
      ['<1>', 'OP_IF <0> OP_OUTPUTTOKENAMOUNT OP_DROP OP_ENDIF <1>', 'OP_OUTPUTTOKENAMOUNT executed', []],
    ],
  ],
] as const satisfies VmbTestDefinitionGroup[];
