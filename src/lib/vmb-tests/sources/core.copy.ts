import type { VmbTestDefinitionGroup } from '../../lib.js';

export default [
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
] as const satisfies VmbTestDefinitionGroup[];
