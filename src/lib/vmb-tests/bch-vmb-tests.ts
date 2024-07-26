/**
 * See the [Libauth VMB Tests Readme](./readme.md) for background information on
 * VMB tests.
 *
 * Below is the source data structure used to generate Libauth's Bitcoin Cash
 * (BCH) Virtual Machine Bytecode (VMB) tests (`bch_vmb_tests.json` and all
 * `bch_vmb_tests_*.json` files). Compiling from this file allows us to easily
 * 1) validate the data structure, and 2) reproducibly generate artifacts like
 * public keys, hashes, and signatures.
 *
 * To add tests to this file:
 *  1. Clone the Libauth repo and install dependencies using `yarn install`.
 *  2. Add the new tests below.
 *  3. Run `yarn dev:vmb_tests` to quickly regenerate and run all vmb tests.
 *  5. Ensure everything is working, then send your PR.
 *
 * Note: for performance reasons, this file is not exported by the library, but
 * it can still be directly imported.
 */

import type { VmbTestDefinitionGroup } from '../lib.js';

import { vmbTestGroupToVmbTests } from './bch-vmb-test-utils.js';
import { loopsTestDefinitionsBch } from './sources/bch-vmb-tests.chip.loops.js';
import { benchmarkTestDefinitionsBch } from './sources/bch-vmb-tests.core.benchmarks.js';
import { cashTokenTestDefinitionsBch } from './sources/bch-vmb-tests.core.cashtokens.js';
import { inspectionTestDefinitionsBch } from './sources/bch-vmb-tests.core.inspection.js';
import { limitsTestDefinitionsBch } from './sources/bch-vmb-tests.core.limits.js';
import { pushOperationsTestDefinitionsBch } from './sources/bch-vmb-tests.core.push.js';
import { signingSerializationTestDefinitionsBch } from './sources/bch-vmb-tests.core.signing-serialization.js';

/**
 * The source data structure used to generate the Libauth BCH VMB test
 * vectors (`bch_vmb_tests.json` and all `bch_vmb_*_tx.json` files).
 */
export const vmbTestDefinitionsBch: VmbTestDefinitionGroup[] = [
  ...pushOperationsTestDefinitionsBch,
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
    'Operations copy by value',
    [
      // TODO: all other operations that push
      ['', 'OP_INPUTINDEX OP_INPUTINDEX OP_1ADD OP_EQUAL OP_NOT', 'each OP_INPUTINDEX pushes an independent stack item'],
      ['', 'OP_ACTIVEBYTECODE OP_ACTIVEBYTECODE OP_REVERSEBYTES OP_EQUAL OP_NOT', 'each OP_ACTIVEBYTECODE pushes an independent stack item'],
      ['', 'OP_TXVERSION OP_TXVERSION OP_1ADD OP_EQUAL OP_NOT', 'each OP_TXVERSION pushes an independent stack item'],
      ['', 'OP_TXINPUTCOUNT OP_TXINPUTCOUNT OP_1ADD OP_EQUAL OP_NOT', 'each OP_TXINPUTCOUNT pushes an independent stack item'],
      ['', 'OP_TXOUTPUTCOUNT OP_TXOUTPUTCOUNT OP_1ADD OP_EQUAL OP_NOT', 'each OP_TXOUTPUTCOUNT pushes an independent stack item'],
      ['', 'OP_TXLOCKTIME OP_TXLOCKTIME OP_1ADD OP_EQUAL OP_NOT', 'each OP_TXLOCKTIME pushes an independent stack item'],
      ['', '<1> OP_UTXOVALUE <1> OP_UTXOVALUE OP_1ADD OP_EQUAL OP_NOT', 'each OP_UTXOVALUE pushes an independent stack item'],
      ['', '<1> OP_UTXOBYTECODE <1> OP_UTXOBYTECODE OP_REVERSEBYTES OP_EQUAL OP_NOT', 'each OP_UTXOBYTECODE pushes an independent stack item'],
      ['', '<1> OP_OUTPOINTTXHASH <1> OP_OUTPOINTTXHASH <0xf000000000000000000000000000000000000000000000000000000000000001> OP_XOR OP_EQUAL OP_NOT', 'each OP_OUTPOINTTXHASH pushes an independent stack item'],
      ['', '<1> OP_OUTPOINTINDEX <1> OP_OUTPOINTINDEX OP_1ADD OP_EQUAL OP_NOT', 'each OP_OUTPOINTINDEX pushes an independent stack item'],
      ['', '<0> OP_INPUTBYTECODE <0> OP_INPUTBYTECODE OP_REVERSEBYTES OP_EQUAL OP_NOT', 'each OP_INPUTBYTECODE pushes an independent stack item'],
      ['', '<1> OP_INPUTSEQUENCENUMBER <1> OP_INPUTSEQUENCENUMBER OP_1ADD OP_EQUAL OP_NOT', 'each OP_INPUTSEQUENCENUMBER pushes an independent stack item'],
      ['', '<0> OP_OUTPUTVALUE <0> OP_OUTPUTVALUE OP_1ADD OP_EQUAL OP_NOT', 'each OP_OUTPUTVALUE pushes an independent stack item'],
      ['', '<0> OP_OUTPUTBYTECODE <0> OP_OUTPUTBYTECODE OP_REVERSEBYTES OP_EQUAL OP_NOT', 'each OP_OUTPUTBYTECODE pushes an independent stack item'],
      // CHIPS:
      [
        '',
        '<0> OP_UTXOTOKENCATEGORY <0> OP_UTXOTOKENCATEGORY OP_REVERSEBYTES OP_EQUAL OP_NOT',
        'each OP_UTXOTOKENCATEGORY pushes an independent stack item',
        [],
        { sourceOutputs: [{ lockingBytecode: ['slot'], token: { amount: 1, nft: { commitment: '010203' } }, valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ token: { amount: 1, nft: { commitment: '010203' } }, valueSatoshis: 1_000 }] } },
      ],
      [
        '',
        '<0> OP_OUTPUTTOKENCATEGORY <0> OP_OUTPUTTOKENCATEGORY OP_REVERSEBYTES OP_EQUAL OP_NOT',
        'each OP_OUTPUTTOKENCATEGORY pushes an independent stack item',
        [],
        { sourceOutputs: [{ lockingBytecode: ['slot'], token: { amount: 1, nft: { commitment: '010203' } }, valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ token: { amount: 1, nft: { commitment: '010203' } }, valueSatoshis: 1_000 }] } },
      ],
      [
        '',
        '<0> OP_UTXOTOKENCOMMITMENT <0> OP_UTXOTOKENCOMMITMENT OP_REVERSEBYTES OP_EQUAL OP_NOT',
        'each OP_UTXOTOKENCOMMITMENT pushes an independent stack item',
        [],
        { sourceOutputs: [{ lockingBytecode: ['slot'], token: { amount: 1, nft: { commitment: '010203' } }, valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ token: { amount: 1, nft: { commitment: '010203' } }, valueSatoshis: 1_000 }] } },
      ],
      [
        '',
        '<0> OP_OUTPUTTOKENCOMMITMENT <0> OP_OUTPUTTOKENCOMMITMENT OP_REVERSEBYTES OP_EQUAL OP_NOT',
        'each OP_OUTPUTTOKENCOMMITMENT pushes an independent stack item',
        [],
        { sourceOutputs: [{ lockingBytecode: ['slot'], token: { amount: 1, nft: { commitment: '010203' } }, valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ token: { amount: 1, nft: { commitment: '010203' } }, valueSatoshis: 1_000 }] } },
      ],
      [
        '',
        '<0> OP_UTXOTOKENAMOUNT <0> OP_UTXOTOKENAMOUNT OP_1ADD OP_EQUAL OP_NOT',
        'each OP_UTXOTOKENAMOUNT pushes an independent stack item',
        [],
        { sourceOutputs: [{ lockingBytecode: ['slot'], token: { amount: 1, nft: { commitment: '010203' } }, valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ token: { amount: 1, nft: { commitment: '010203' } }, valueSatoshis: 1_000 }] } },
      ],
      [
        '',
        '<0> OP_OUTPUTTOKENAMOUNT <0> OP_OUTPUTTOKENAMOUNT OP_1ADD OP_EQUAL OP_NOT',
        'each OP_OUTPUTTOKENAMOUNT pushes an independent stack item',
        [],
        { sourceOutputs: [{ lockingBytecode: ['slot'], token: { amount: 1, nft: { commitment: '010203' } }, valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ token: { amount: 1, nft: { commitment: '010203' } }, valueSatoshis: 1_000 }] } },
      ],
    ],
  ],
  limitsTestDefinitionsBch,
  ['Formatting', [['<0> <520>', 'OP_NUM2BIN OP_HASH256 <520> OP_NUM2BIN OP_HASH256 <0x1ad88784b424b39ad15854e96346fc94f73db487c165f0a9bdd5f348ad4c463c> OP_EQUAL', 'NUM2BIN allows 32-byte number inputs']]],
  [
    'Disabled/failing/unknown/new operations',
    [
      // TODO: all OP_UNKNOWNs
      ['<0>', 'OP_IF OP_RESERVED OP_ENDIF <1>', 'OP_RESERVED is standard if not executed'],
      ['<1>', 'OP_IF OP_RESERVED OP_ENDIF <1>', 'OP_RESERVED fails evaluation if executed', ['invalid']],
      ['<0>', 'OP_IF OP_VER OP_ENDIF <1>', 'OP_VER is standard if not executed'],
      ['<1>', 'OP_IF OP_VER OP_ENDIF <1>', 'OP_VER fails evaluation if executed', ['invalid']],
      ['<0>', 'OP_IF OP_VERIF OP_ENDIF <1>', 'OP_VERIF fails evaluation even if not executed', ['invalid']],
      ['<0>', 'OP_IF OP_VERNOTIF OP_ENDIF <1>', 'OP_VERNOTIF fails evaluation even if not executed', ['invalid']],
      ['<0>', 'OP_IF OP_RETURN OP_ENDIF <1>', 'OP_RETURN is standard if not executed'],
      ['<1>', 'OP_IF OP_RETURN OP_ENDIF <1>', 'OP_RETURN fails evaluation if executed', ['invalid']],
      ['<0>', 'OP_IF OP_INVERT OP_ENDIF <1>', 'OP_INVERT fails evaluation even if not executed', ['invalid']],
      ['<0>', 'OP_IF OP_RESERVED1 OP_ENDIF <1>', 'OP_RESERVED1 is standard if not executed'],
      ['<1>', 'OP_IF OP_RESERVED1 OP_ENDIF <1>', 'OP_RESERVED1 fails evaluation if executed', ['invalid']],
      ['<0>', 'OP_IF OP_RESERVED2 OP_ENDIF <1>', 'OP_RESERVED2 is standard if not executed'],
      ['<1>', 'OP_IF OP_RESERVED2 OP_ENDIF <1>', 'OP_RESERVED2 fails evaluation if executed', ['invalid']],
      ['<0>', 'OP_IF OP_2MUL OP_ENDIF <1>', 'OP_2MUL fails evaluation even if not executed', ['invalid']],
      ['<0>', 'OP_IF OP_2DIV OP_ENDIF <1>', 'OP_2DIV fails evaluation even if not executed', ['invalid']],
      ['<0>', 'OP_IF OP_LSHIFT OP_ENDIF <1>', 'OP_LSHIFT fails evaluation even if not executed', ['invalid']],
      ['<0>', 'OP_IF OP_RSHIFT OP_ENDIF <1>', 'OP_RSHIFT fails evaluation even if not executed', ['invalid']],
      // CHIPs:
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
  inspectionTestDefinitionsBch,
  cashTokenTestDefinitionsBch,
  signingSerializationTestDefinitionsBch,
  benchmarkTestDefinitionsBch,
  loopsTestDefinitionsBch,
];

export const vmbTestsBch = vmbTestDefinitionsBch.map(vmbTestGroupToVmbTests);
