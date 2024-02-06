/* eslint-disable @typescript-eslint/no-magic-numbers, max-lines */
/**
 * See `bch-vmb-tests.ts` for details about modifying this file.
 */

import type { VmbTestDefinitionGroup } from '../lib.js';
import { binToHex, cashAssemblyToBin, range } from '../lib.js';

export const cashTokenTestDefinitionsBCH: VmbTestDefinitionGroup = [
  'CHIP-2022-02-CashTokens',
  [
    // mint only immutable tokens
    [
      '',
      '<1>',
      'mint immutable NFT (with genesis input, index 0, 5-byte commitment)',
      ['nonstandard', 'chip_cashtokens'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ token: { nft: { commitment: '010203ff00' } }, valueSatoshis: 1000 }] } },
    ],
    [
      '',
      '<1>',
      'mint immutable NFT (with genesis input, index 0, 5-byte commitment: P2SH20 dust, P2SH32 dust)',
      ['nonstandard', 'chip_cashtokens', 'chip_cashtokens_p2sh20_nonstandard', 'chip_cashtokens_p2sh32_nonstandard'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ token: { nft: { commitment: '010203ff00' } }, valueSatoshis: 659 }] } },
    ],
    [
      '',
      '<1>',
      'mint immutable NFT (with genesis input, index 0, 5-byte commitment: P2SH20 non-dust minimum, P2SH32 dust)',
      ['nonstandard', 'chip_cashtokens', 'chip_cashtokens_p2sh32_nonstandard'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ token: { nft: { commitment: '010203ff00' } }, valueSatoshis: 660 }] } },
    ],
    [
      '',
      '<1>',
      'mint immutable NFT (with genesis input, index 0, 5-byte commitment: P2SH32 dust maximum)',
      ['nonstandard', 'chip_cashtokens', 'chip_cashtokens_p2sh32_nonstandard'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ token: { nft: { commitment: '010203ff00' } }, valueSatoshis: 695 }] } },
    ],
    [
      '',
      '<1>',
      'mint immutable NFT (with genesis input, index 0, 6-byte commitment)',
      ['nonstandard', 'chip_cashtokens'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ token: { nft: { commitment: '01020304ff00' } }, valueSatoshis: 699 }] } },
    ],
    [
      '',
      '<1>',
      'mint immutable NFT (with genesis input, index 0, 6-byte commitment: P2SH20 dust, P2SH32 dust)',
      ['nonstandard', 'chip_cashtokens', 'chip_cashtokens_p2sh20_nonstandard', 'chip_cashtokens_p2sh32_nonstandard'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ token: { nft: { commitment: '01020304ff00' } }, valueSatoshis: 662 }] } },
    ],
    [
      '',
      '<1>',
      'mint immutable NFT (with genesis input, index 0, 6-byte commitment: P2SH20 non-dust minimum, P2SH32 dust)',
      ['nonstandard', 'chip_cashtokens', 'chip_cashtokens_p2sh32_nonstandard'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ token: { nft: { commitment: '01020304ff00' } }, valueSatoshis: 663 }] } },
    ],
    [
      '',
      '<1>',
      'mint immutable NFT (with genesis input, index 0, 6-byte commitment: P2SH32 dust maximum)',
      ['nonstandard', 'chip_cashtokens', 'chip_cashtokens_p2sh32_nonstandard'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ token: { nft: { commitment: '01020304ff00' } }, valueSatoshis: 698 }] } },
    ],
    ['', '<1>', 'mint immutable NFT without authorization (pre-activation token forgery)', ['nonstandard', 'chip_cashtokens_invalid'], { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ token: { nft: { commitment: '010203ff' } }, valueSatoshis: 1_000 }] } }],
    [
      '',
      '<1>',
      'mint immutable NFT (without genesis input)',
      ['nonstandard', 'chip_cashtokens_invalid'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ outpointIndex: 1, unlockingBytecode: ['slot'] }], outputs: [{ token: { category: '0000000000000000000000000000000000000000000000000000000000000001', nft: { commitment: '010203ff00' } }, valueSatoshis: 1_000 }] } },
    ],
    [
      '',
      '<1>',
      'mint immutable NFT (with genesis input, index 1)',
      ['nonstandard', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], valueSatoshis: 10_000 },
        ],
        transaction: {
          inputs: [
            { outpointIndex: 1, unlockingBytecode: { script: 'unlockEmptyP2sh20' } },
            { outpointIndex: 0, outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000003', unlockingBytecode: ['slot'] },
          ],
          outputs: [{ token: { category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { commitment: '010203ff00' } }, valueSatoshis: 1_000 }],
        },
      },
    ],
    [
      '',
      '<1>',
      'mint immutable NFT (wrong genesis input)',
      ['nonstandard', 'chip_cashtokens_invalid'],
      {
        sourceOutputs: [{ lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 }, { lockingBytecode: ['slot'] }],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { outpointIndex: 1, outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000003', unlockingBytecode: ['slot'] }], outputs: [{ token: { category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { commitment: '010203ff00' } }, valueSatoshis: 1_000 }] },
      },
    ],
    [
      '',
      '<1>',
      'mint multiple immutable NFTs (2 pairs of duplicates)',
      ['nonstandard', 'chip_cashtokens'],
      {
        sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }],
        transaction: {
          inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }],
          outputs: [
            { token: { nft: { commitment: '010203ff00' } }, valueSatoshis: 1_000 },
            { token: { nft: { commitment: '010203ff00' } }, valueSatoshis: 1_000 },
            { token: { nft: { commitment: '' } }, valueSatoshis: 1_000 },
            { token: { nft: { commitment: '' } }, valueSatoshis: 1_000 },
          ],
        },
      },
    ],
    // mint only mutable tokens
    [
      '',
      '<1>',
      'mint mutable NFT (with genesis input, index 0)',
      ['nonstandard', 'chip_cashtokens'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ token: { nft: { capability: 'mutable', commitment: '010203ff00' } }, valueSatoshis: 1_000 }] } },
    ],
    ['', '<1>', 'mint mutable NFT without authorization (pre-activation token forgery)', ['nonstandard', 'chip_cashtokens_invalid'], { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ token: { nft: { capability: 'mutable', commitment: '010203ff' } }, valueSatoshis: 1_000 }] } }],
    [
      '',
      '<1>',
      'mint mutable NFT (without genesis input)',
      ['nonstandard', 'chip_cashtokens_invalid'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ outpointIndex: 1, unlockingBytecode: ['slot'] }], outputs: [{ token: { category: '0000000000000000000000000000000000000000000000000000000000000001', nft: { capability: 'mutable', commitment: '010203ff00' } }, valueSatoshis: 1_000 }] } },
    ],
    [
      '',
      '<1>',
      'mint mutable NFT (with genesis input, index 1)',
      ['nonstandard', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], valueSatoshis: 10_000 },
        ],
        transaction: {
          inputs: [
            { outpointIndex: 1, unlockingBytecode: { script: 'unlockEmptyP2sh20' } },
            { outpointIndex: 0, outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000003', unlockingBytecode: ['slot'] },
          ],
          outputs: [{ token: { category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { capability: 'mutable', commitment: '010203ff00' } }, valueSatoshis: 1_000 }],
        },
      },
    ],
    [
      '',
      '<1>',
      'mint mutable NFT (wrong genesis input)',
      ['nonstandard', 'chip_cashtokens_invalid'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], valueSatoshis: 10_000 },
        ],
        transaction: {
          inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { outpointIndex: 1, outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000003', unlockingBytecode: ['slot'] }],
          outputs: [{ token: { category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { capability: 'mutable', commitment: '010203ff00' } }, valueSatoshis: 1_000 }],
        },
      },
    ],
    [
      '',
      '<1>',
      'mint multiple mutable NFTs (2 pairs of duplicates)',
      ['nonstandard', 'chip_cashtokens'],
      {
        sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }],
        transaction: {
          inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }],
          outputs: [
            { token: { nft: { capability: 'mutable', commitment: '010203ff00' } }, valueSatoshis: 1_000 },
            { token: { nft: { capability: 'mutable', commitment: '010203ff00' } }, valueSatoshis: 1_000 },
            { token: { nft: { capability: 'mutable', commitment: '' } }, valueSatoshis: 1_000 },
            { token: { nft: { capability: 'mutable', commitment: '' } }, valueSatoshis: 1_000 },
          ],
        },
      },
    ],
    // mint only minting tokens
    [
      '',
      '<1>',
      'mint minting NFT (with genesis input, index 0)',
      ['nonstandard', 'chip_cashtokens'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ token: { nft: { capability: 'minting', commitment: '010203ff00' } }, valueSatoshis: 1_000 }] } },
    ],
    ['', '<1>', 'mint minting NFT without authorization (pre-activation token forgery)', ['nonstandard', 'chip_cashtokens_invalid'], { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ token: { nft: { capability: 'minting', commitment: '010203ff' } }, valueSatoshis: 1_000 }] } }],
    [
      '',
      '<1>',
      'mint minting NFT (without genesis input)',
      ['nonstandard', 'chip_cashtokens_invalid'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ outpointIndex: 1, unlockingBytecode: ['slot'] }], outputs: [{ token: { category: '0000000000000000000000000000000000000000000000000000000000000001', nft: { capability: 'minting', commitment: '010203ff00' } }, valueSatoshis: 1_000 }] } },
    ],
    [
      '',
      '<1>',
      'mint minting NFT (with genesis input, index 1)',
      ['nonstandard', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], valueSatoshis: 10_000 },
        ],
        transaction: {
          inputs: [
            { outpointIndex: 1, unlockingBytecode: { script: 'unlockEmptyP2sh20' } },
            { outpointIndex: 0, outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000003', unlockingBytecode: ['slot'] },
          ],
          outputs: [{ token: { category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { capability: 'minting', commitment: '010203ff00' } }, valueSatoshis: 1_000 }],
        },
      },
    ],
    [
      '',
      '<1>',
      'mint minting NFT (wrong genesis input)',
      ['nonstandard', 'chip_cashtokens_invalid'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], valueSatoshis: 10_000 },
        ],
        transaction: {
          inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { outpointIndex: 1, outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000003', unlockingBytecode: ['slot'] }],
          outputs: [{ token: { category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { capability: 'minting', commitment: '010203ff00' } }, valueSatoshis: 1_000 }],
        },
      },
    ],
    [
      '',
      '<1>',
      'mint multiple minting NFTs (2 pairs of duplicates)',
      ['nonstandard', 'chip_cashtokens'],
      {
        sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }],
        transaction: {
          inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }],
          outputs: [
            { token: { nft: { capability: 'minting', commitment: '010203ff00' } }, valueSatoshis: 1_000 },
            { token: { nft: { capability: 'minting', commitment: '010203ff00' } }, valueSatoshis: 1_000 },
            { token: { nft: { capability: 'minting', commitment: '' } }, valueSatoshis: 1_000 },
            { token: { nft: { capability: 'minting', commitment: '' } }, valueSatoshis: 1_000 },
          ],
        },
      },
    ],
    // mint only fungible tokens
    [
      '',
      '<1>',
      'mint fungible tokens (with genesis input, index 0)',
      ['nonstandard', 'chip_cashtokens'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ token: { amount: '9223372036854775806' }, valueSatoshis: 1000 }] } },
    ],
    [
      '',
      '<1>',
      'mint fungible tokens (with genesis input, index 0, P2SH20 dust, P2SH32 dust)',
      ['nonstandard', 'chip_cashtokens', 'chip_cashtokens_p2sh20_nonstandard', 'chip_cashtokens_p2sh32_nonstandard'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ token: { amount: '9223372036854775806' }, valueSatoshis: 668 }] } },
    ],
    [
      '',
      '<1>',
      'mint fungible tokens (with genesis input, index 0, P2SH20 non-dust minimum, P2SH32 dust)',
      ['nonstandard', 'chip_cashtokens', 'chip_cashtokens_p2sh32_nonstandard'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ token: { amount: '9223372036854775806' }, valueSatoshis: 669 }] } },
    ],
    [
      '',
      '<1>',
      'mint fungible tokens (with genesis input, index 0, P2SH32 dust maximum)',
      ['nonstandard', 'chip_cashtokens', 'chip_cashtokens_p2sh32_nonstandard'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ token: { amount: '9223372036854775806' }, valueSatoshis: 704 }] } },
    ],
    [
      '',
      '<1>',
      'mint fungible tokens (with genesis input, index 0, P2SH32 non-dust minimum)',
      ['nonstandard', 'chip_cashtokens'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ token: { amount: '9223372036854775806' }, valueSatoshis: 705 }] } },
    ],
    ['', '<1>', 'mint fungible tokens without authorization (pre-activation token forgery)', ['nonstandard', 'chip_cashtokens_invalid'], { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ token: { amount: '9223372036854775807' }, valueSatoshis: 1_000 }] } }],
    [
      '',
      '<1>',
      'mint fungible tokens (without genesis input)',
      ['nonstandard', 'chip_cashtokens_invalid'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ outpointIndex: 1, unlockingBytecode: ['slot'] }], outputs: [{ token: { amount: '9223372036854775807', category: '0000000000000000000000000000000000000000000000000000000000000001' }, valueSatoshis: 1_000 }] } },
    ],
    [
      '',
      '<1>',
      'mint fungible tokens (with genesis input, index 1)',
      ['nonstandard', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], valueSatoshis: 10_000 },
        ],
        transaction: {
          inputs: [
            { outpointIndex: 1, unlockingBytecode: { script: 'unlockEmptyP2sh20' } },
            { outpointIndex: 0, outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000003', unlockingBytecode: ['slot'] },
          ],
          outputs: [{ token: { amount: 1000, category: '0000000000000000000000000000000000000000000000000000000000000003' }, valueSatoshis: 1_000 }],
        },
      },
    ],
    [
      '',
      '<1>',
      'mint fungible tokens (wrong genesis input)',
      ['nonstandard', 'chip_cashtokens_invalid'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { outpointIndex: 1, outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000003', unlockingBytecode: ['slot'] }], outputs: [{ token: { amount: 1000, category: '0000000000000000000000000000000000000000000000000000000000000003' }, valueSatoshis: 1_000 }] },
      },
    ],
    [
      '',
      '<1>',
      'mint fungible tokens to multiple outputs',
      ['nonstandard', 'chip_cashtokens'],
      {
        sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }],
        transaction: {
          inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }],
          outputs: [
            { token: { amount: 1000 }, valueSatoshis: 1_000 },
            { token: { amount: 1000 }, valueSatoshis: 1_000 },
            { token: { amount: 1000 }, valueSatoshis: 2_000 },
            { token: { amount: 1000 }, valueSatoshis: 3_000 },
          ],
        },
      },
    ],
    [
      '',
      '<1>',
      'mint fungible token supply of 1',
      ['nonstandard', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: ['slot'], valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: ['slot'] }, { unlockingBytecode: { script: 'unlockEmptyP2sh20' } }], outputs: [{ lockingBytecode: 'ef010000000000000000000000000000000000000000000000000000000000000010016a', valueSatoshis: 1_000 }] },
      },
    ],
    [
      '',
      '<1>',
      'attempt to mint fungible token supply of 0',
      ['nonstandard', 'chip_cashtokens_invalid'],
      {
        sourceOutputs: [
          { lockingBytecode: ['slot'], valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: ['slot'] }, { unlockingBytecode: { script: 'unlockEmptyP2sh20' } }], outputs: [{ lockingBytecode: 'ef010000000000000000000000000000000000000000000000000000000000000010006a', valueSatoshis: 1_000 }] },
      },
    ],
    [
      '',
      '<1>',
      'mint fungible token supply of 253',
      ['nonstandard', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: ['slot'], valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }, { unlockingBytecode: { script: 'unlockEmptyP2sh20' } }], outputs: [{ token: { amount: 253 }, valueSatoshis: 1_000 }] },
      },
    ],
    [
      '',
      '<1>',
      'mint fungible token supply of 65535',
      ['nonstandard', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: ['slot'], valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }, { unlockingBytecode: { script: 'unlockEmptyP2sh20' } }], outputs: [{ token: { amount: 65535 }, valueSatoshis: 1_000 }] },
      },
    ],
    [
      '',
      '<1>',
      'mint fungible token supply of 4294967295',
      ['nonstandard', 'chip_cashtokens'],
      {
        sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }],
        transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ token: { amount: 4294967295 }, valueSatoshis: 1_000 }] },
      },
    ],
    [
      '',
      '<1>',
      'mint maximum fungible token supply (9223372036854775807)',
      ['nonstandard', 'chip_cashtokens'],
      {
        sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }],
        transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ token: { amount: '9223372036854775807' }, valueSatoshis: 1_000 }] },
      },
    ],
    [
      '',
      '<1>',
      'mint excessive fungible token supply (9223372036854775808)',
      ['nonstandard', 'chip_cashtokens_invalid'],
      {
        sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }],
        transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ token: { amount: '9223372036854775808' }, valueSatoshis: 1_000 }] },
      },
    ],
    [
      '',
      '<1>',
      'mint maximum fungible token supply (4611686018427387903 + 4611686018427387904)',
      ['nonstandard', 'chip_cashtokens'],
      {
        sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }],
        transaction: {
          inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }],
          outputs: [
            { token: { amount: '4611686018427387903' }, valueSatoshis: 1_000 },
            { token: { amount: '4611686018427387904' }, valueSatoshis: 1_000 },
          ],
        },
      },
    ],
    [
      '',
      '<1>',
      'mint excessive fungible token supply (4611686018427387904 + 4611686018427387904)',
      ['nonstandard', 'chip_cashtokens_invalid'],
      {
        sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }],
        transaction: {
          inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }],
          outputs: [
            { token: { amount: '4611686018427387904' }, valueSatoshis: 1_000 },
            { token: { amount: '4611686018427387904' }, valueSatoshis: 1_000 },
          ],
        },
      },
    ],
    // mint fungible tokens and immutable tokens
    [
      '',
      '<1>',
      'mint fungible tokens and immutable NFTs (with genesis input, index 0)',
      ['nonstandard', 'chip_cashtokens'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ token: { amount: 1_000, nft: { commitment: '010203ff00' } }, valueSatoshis: 1_000 }] } },
    ],
    [
      '',
      '<1>',
      'mint fungible tokens and immutable NFTs (with genesis input, index 0, P2SH20 dust, P2SH32 dust)',
      ['nonstandard', 'chip_cashtokens', 'chip_cashtokens_p2sh20_nonstandard', 'chip_cashtokens_p2sh32_nonstandard'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ token: { amount: 1_000, nft: { commitment: '010203ff00' } }, valueSatoshis: 668 }] } },
    ],
    [
      '',
      '<1>',
      'mint fungible tokens and immutable NFTs (with genesis input, index 0, P2SH32 dust maximum)',
      ['nonstandard', 'chip_cashtokens', 'chip_cashtokens_p2sh32_nonstandard'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ token: { amount: 1_000, nft: { commitment: '010203ff00' } }, valueSatoshis: 704 }] } },
    ],
    [
      '',
      '<1>',
      'mint fungible tokens and immutable NFTs (with genesis input, index 0, P2SH32 non-dust minimum)',
      ['nonstandard', 'chip_cashtokens'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ token: { amount: 1_000, nft: { commitment: '010203ff00' } }, valueSatoshis: 705 }] } },
    ],
    ['', '<1>', 'mint fungible tokens and immutable NFT without authorization (pre-activation token forgery)', ['nonstandard', 'chip_cashtokens_invalid'], { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ token: { amount: 1_000, nft: { commitment: '010203ff' } }, valueSatoshis: 1_000 }] } }],
    [
      '',
      '<1>',
      'mint fungible tokens and immutable NFT (without genesis input)',
      ['nonstandard', 'chip_cashtokens_invalid'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ outpointIndex: 1, unlockingBytecode: ['slot'] }], outputs: [{ token: { amount: 1_000, category: '0000000000000000000000000000000000000000000000000000000000000001', nft: { commitment: '010203ff00' } }, valueSatoshis: 1_000 }] } },
    ],
    [
      '',
      '<1>',
      'mint fungible tokens and immutable NFT (with genesis input, index 1)',
      ['nonstandard', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], valueSatoshis: 10_000 },
        ],
        transaction: {
          inputs: [
            { outpointIndex: 1, unlockingBytecode: { script: 'unlockEmptyP2sh20' } },
            { outpointIndex: 0, outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000003', unlockingBytecode: ['slot'] },
          ],
          outputs: [{ token: { amount: 1_000, category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { commitment: '010203ff00' } }, valueSatoshis: 1_000 }],
        },
      },
    ],
    [
      '',
      '<1>',
      'mint fungible tokens and immutable NFT (wrong genesis input)',
      ['nonstandard', 'chip_cashtokens_invalid'],
      {
        sourceOutputs: [{ lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 }, { lockingBytecode: ['slot'] }],
        transaction: {
          inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { outpointIndex: 1, outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000003', unlockingBytecode: ['slot'] }],
          outputs: [{ token: { amount: 1_000, category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { commitment: '010203ff00' } }, valueSatoshis: 1_000 }],
        },
      },
    ],
    [
      '',
      '<1>',
      'mint fungible tokens and multiple immutable NFTs (2 pairs of duplicates)',
      ['nonstandard', 'chip_cashtokens'],
      {
        sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }],
        transaction: {
          inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }],
          outputs: [
            { token: { amount: 1, nft: { commitment: '010203ff00' } }, valueSatoshis: 1_000 },
            { token: { amount: 253, nft: { commitment: '010203ff00' } }, valueSatoshis: 1_000 },
            { token: { amount: 65536, nft: { commitment: '' } }, valueSatoshis: 1_000 },
            { token: { amount: 4294967296, nft: { commitment: '' } }, valueSatoshis: 1_000 },
          ],
        },
      },
    ],
    // mint fungible tokens and mutable tokens
    [
      '',
      '<1>',
      'mint fungible tokens and mutable NFT (with genesis input, index 0)',
      ['nonstandard', 'chip_cashtokens'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ token: { amount: 1_000, nft: { capability: 'mutable', commitment: '010203ff00' } }, valueSatoshis: 1_000 }] } },
    ],
    [
      '',
      '<1>',
      'mint fungible tokens and mutable NFT without authorization (pre-activation token forgery)',
      ['nonstandard', 'chip_cashtokens_invalid'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ token: { amount: 1_000, nft: { capability: 'mutable', commitment: '010203ff' } }, valueSatoshis: 1_000 }] } },
    ],
    [
      '',
      '<1>',
      'mint fungible tokens and mutable NFT (without genesis input)',
      ['nonstandard', 'chip_cashtokens_invalid'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ outpointIndex: 1, unlockingBytecode: ['slot'] }], outputs: [{ token: { amount: 1_000, category: '0000000000000000000000000000000000000000000000000000000000000001', nft: { capability: 'mutable', commitment: '010203ff00' } }, valueSatoshis: 1_000 }] } },
    ],
    [
      '',
      '<1>',
      'mint fungible tokens and mutable NFT (with genesis input, index 1)',
      ['nonstandard', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], valueSatoshis: 10_000 },
        ],
        transaction: {
          inputs: [
            { outpointIndex: 1, unlockingBytecode: { script: 'unlockEmptyP2sh20' } },
            { outpointIndex: 0, outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000003', unlockingBytecode: ['slot'] },
          ],
          outputs: [{ token: { amount: 1_000, category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { capability: 'mutable', commitment: '010203ff00' } }, valueSatoshis: 1_000 }],
        },
      },
    ],
    [
      '',
      '<1>',
      'mint fungible tokens and mutable NFT (wrong genesis input)',
      ['nonstandard', 'chip_cashtokens_invalid'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], valueSatoshis: 10_000 },
        ],
        transaction: {
          inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { outpointIndex: 1, outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000003', unlockingBytecode: ['slot'] }],
          outputs: [{ token: { amount: 1_000, category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { capability: 'mutable', commitment: '010203ff00' } }, valueSatoshis: 1_000 }],
        },
      },
    ],
    [
      '',
      '<1>',
      'mint fungible tokens and multiple mutable NFTs (2 pairs of duplicates)',
      ['nonstandard', 'chip_cashtokens'],
      {
        sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }],
        transaction: {
          inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }],
          outputs: [
            { token: { amount: 1, nft: { capability: 'mutable', commitment: '010203ff00' } }, valueSatoshis: 1_000 },
            { token: { amount: 253, nft: { capability: 'mutable', commitment: '010203ff00' } }, valueSatoshis: 1_000 },
            { token: { amount: 65536, nft: { capability: 'mutable', commitment: '' } }, valueSatoshis: 1_000 },
            { token: { amount: 4294967296, nft: { capability: 'mutable', commitment: '' } }, valueSatoshis: 1_000 },
          ],
        },
      },
    ],
    // mint fungible tokens and minting tokens
    [
      '',
      '<1>',
      'mint fungible tokens and minting NFT (with genesis input, index 0)',
      ['nonstandard', 'chip_cashtokens'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ token: { amount: 1_000, nft: { capability: 'minting', commitment: '010203ff00' } }, valueSatoshis: 1_000 }] } },
    ],
    [
      '',
      '<1>',
      'mint fungible tokens and minting NFT without authorization (pre-activation token forgery)',
      ['nonstandard', 'chip_cashtokens_invalid'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ token: { amount: 1_000, nft: { capability: 'minting', commitment: '010203ff' } }, valueSatoshis: 1_000 }] } },
    ],
    [
      '',
      '<1>',
      'mint fungible tokens and minting NFT (without genesis input)',
      ['nonstandard', 'chip_cashtokens_invalid'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ outpointIndex: 1, unlockingBytecode: ['slot'] }], outputs: [{ token: { amount: 1_000, category: '0000000000000000000000000000000000000000000000000000000000000001', nft: { capability: 'minting', commitment: '010203ff00' } }, valueSatoshis: 1_000 }] } },
    ],
    [
      '',
      '<1>',
      'mint fungible tokens and minting NFT (with genesis input, index 1)',
      ['nonstandard', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], valueSatoshis: 10_000 },
        ],
        transaction: {
          inputs: [
            { outpointIndex: 1, unlockingBytecode: { script: 'unlockEmptyP2sh20' } },
            { outpointIndex: 0, outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000003', unlockingBytecode: ['slot'] },
          ],
          outputs: [{ token: { amount: 1_000, category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { capability: 'minting', commitment: '010203ff00' } }, valueSatoshis: 1_000 }],
        },
      },
    ],
    [
      '',
      '<1>',
      'mint fungible tokens and minting NFT (wrong genesis input)',
      ['nonstandard', 'chip_cashtokens_invalid'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], valueSatoshis: 10_000 },
        ],
        transaction: {
          inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { outpointIndex: 1, outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000003', unlockingBytecode: ['slot'] }],
          outputs: [{ token: { amount: 1_000, category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { capability: 'minting', commitment: '010203ff00' } }, valueSatoshis: 1_000 }],
        },
      },
    ],
    [
      '',
      '<1>',
      'mint fungible tokens and multiple minting NFTs (2 pairs of duplicates)',
      ['nonstandard', 'chip_cashtokens'],
      {
        sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }],
        transaction: {
          inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }],
          outputs: [
            { token: { amount: 1, nft: { capability: 'minting', commitment: '010203ff00' } }, valueSatoshis: 1_000 },
            { token: { amount: 253, nft: { capability: 'minting', commitment: '010203ff00' } }, valueSatoshis: 1_000 },
            { token: { amount: 65536, nft: { capability: 'minting', commitment: '' } }, valueSatoshis: 1_000 },
            { token: { amount: 4294967296, nft: { capability: 'minting', commitment: '' } }, valueSatoshis: 1_000 },
          ],
        },
      },
    ],
    [
      '',
      '<1>',
      'mint fungible tokens with mutable and immutable NFTs',
      ['nonstandard', 'chip_cashtokens'],
      {
        sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }],
        transaction: {
          inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }],
          outputs: [
            { token: { amount: 1, nft: { capability: 'mutable', commitment: '010203ff00' } }, valueSatoshis: 1_000 },
            { token: { amount: 253, nft: { capability: 'mutable', commitment: '010203ff00' } }, valueSatoshis: 1_000 },
            { token: { amount: 65536, nft: { capability: 'none', commitment: '' } }, valueSatoshis: 1_000 },
            { token: { amount: 4294967296, nft: { capability: 'none', commitment: '' } }, valueSatoshis: 1_000 },
          ],
        },
      },
    ],
    [
      '',
      '<1>',
      'mint all token types',
      ['nonstandard', 'chip_cashtokens'],
      {
        sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }],
        transaction: {
          inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }],
          outputs: [
            { token: { amount: 1, nft: { capability: 'minting', commitment: '010203ff00' } }, valueSatoshis: 1_000 },
            { token: { amount: 253, nft: { capability: 'mutable', commitment: '010203ff00' } }, valueSatoshis: 1_000 },
            { token: { amount: 65536, nft: { capability: 'none', commitment: '' } }, valueSatoshis: 1_000 },
            { token: { amount: 4294967296, nft: { capability: 'none', commitment: '' } }, valueSatoshis: 1_000 },
            { valueSatoshis: 1_000 },
          ],
        },
      },
    ],
    [
      '',
      '<1>',
      'mint all token types (output 0 P2SH32 non-dust minimum)',
      ['nonstandard', 'chip_cashtokens'],
      {
        sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }],
        transaction: {
          inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }],
          outputs: [
            { token: { amount: 1, nft: { capability: 'minting', commitment: '010203ff00' } }, valueSatoshis: 699 },
            { token: { amount: 253, nft: { capability: 'mutable', commitment: '010203ff00' } }, valueSatoshis: 1_000 },
            { token: { amount: 65536, nft: { capability: 'none', commitment: '' } }, valueSatoshis: 1_000 },
            { token: { amount: 4294967296, nft: { capability: 'none', commitment: '' } }, valueSatoshis: 1_000 },
            { valueSatoshis: 1_000 },
          ],
        },
      },
    ],
    [
      '',
      '<1>',
      'mint all token types (output 0 P2SH20 dust)',
      ['nonstandard', 'chip_cashtokens', 'chip_cashtokens_p2sh20_nonstandard', 'chip_cashtokens_p2sh32_nonstandard'],
      {
        sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }],
        transaction: {
          inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }],
          outputs: [
            { token: { amount: 1, nft: { capability: 'minting', commitment: '010203ff00' } }, valueSatoshis: 662 },
            { token: { amount: 253, nft: { capability: 'mutable', commitment: '010203ff00' } }, valueSatoshis: 1_000 },
            { token: { amount: 65536, nft: { capability: 'none', commitment: '' } }, valueSatoshis: 1_000 },
            { token: { amount: 4294967296, nft: { capability: 'none', commitment: '' } }, valueSatoshis: 1_000 },
            { valueSatoshis: 1_000 },
          ],
        },
      },
    ],
    [
      '',
      '<1>',
      'mint all token types (output 0 P2SH32 dust)',
      ['nonstandard', 'chip_cashtokens', 'chip_cashtokens_p2sh32_nonstandard'],
      {
        sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }],
        transaction: {
          inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }],
          outputs: [
            { token: { amount: 1, nft: { capability: 'minting', commitment: '010203ff00' } }, valueSatoshis: 663 },
            { token: { amount: 253, nft: { capability: 'mutable', commitment: '010203ff00' } }, valueSatoshis: 1_000 },
            { token: { amount: 65536, nft: { capability: 'none', commitment: '' } }, valueSatoshis: 1_000 },
            { token: { amount: 4294967296, nft: { capability: 'none', commitment: '' } }, valueSatoshis: 1_000 },
            { valueSatoshis: 1_000 },
          ],
        },
      },
    ],
    [
      '',
      '<1>',
      'mint all token types (output 1 P2SH32 non-dust minimum)',
      ['nonstandard', 'chip_cashtokens'],
      {
        sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }],
        transaction: {
          inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }],
          outputs: [
            { token: { amount: 1, nft: { capability: 'minting', commitment: '010203ff00' } }, valueSatoshis: 1_000 },
            { token: { amount: 253, nft: { capability: 'mutable', commitment: '010203ff00' } }, valueSatoshis: 705 },
            { token: { amount: 65536, nft: { capability: 'none', commitment: '' } }, valueSatoshis: 1_000 },
            { token: { amount: 4294967296, nft: { capability: 'none', commitment: '' } }, valueSatoshis: 1_000 },
            { valueSatoshis: 1_000 },
          ],
        },
      },
    ],
    [
      '',
      '<1>',
      'mint all token types (output 1 P2SH20 dust)',
      ['nonstandard', 'chip_cashtokens', 'chip_cashtokens_p2sh20_nonstandard', 'chip_cashtokens_p2sh32_nonstandard'],
      {
        sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }],
        transaction: {
          inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }],
          outputs: [
            { token: { amount: 1, nft: { capability: 'minting', commitment: '010203ff00' } }, valueSatoshis: 1_000 },
            { token: { amount: 253, nft: { capability: 'mutable', commitment: '010203ff00' } }, valueSatoshis: 668 },
            { token: { amount: 65536, nft: { capability: 'none', commitment: '' } }, valueSatoshis: 1_000 },
            { token: { amount: 4294967296, nft: { capability: 'none', commitment: '' } }, valueSatoshis: 1_000 },
            { valueSatoshis: 1_000 },
          ],
        },
      },
    ],
    [
      '',
      '<1>',
      'mint all token types (output 1 P2SH32 dust)',
      ['nonstandard', 'chip_cashtokens', 'chip_cashtokens_p2sh32_nonstandard'],
      {
        sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }],
        transaction: {
          inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }],
          outputs: [
            { token: { amount: 1, nft: { capability: 'minting', commitment: '010203ff00' } }, valueSatoshis: 1_000 },
            { token: { amount: 253, nft: { capability: 'mutable', commitment: '010203ff00' } }, valueSatoshis: 669 },
            { token: { amount: 65536, nft: { capability: 'none', commitment: '' } }, valueSatoshis: 1_000 },
            { token: { amount: 4294967296, nft: { capability: 'none', commitment: '' } }, valueSatoshis: 1_000 },
            { valueSatoshis: 1_000 },
          ],
        },
      },
    ],
    [
      '',
      '<1>',
      'mint all token types (output 2 P2SH32 non-dust minimum)',
      ['nonstandard', 'chip_cashtokens'],
      {
        sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }],
        transaction: {
          inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }],
          outputs: [
            { token: { amount: 1, nft: { capability: 'minting', commitment: '010203ff00' } }, valueSatoshis: 1_000 },
            { token: { amount: 253, nft: { capability: 'mutable', commitment: '010203ff00' } }, valueSatoshis: 1_000 },
            { token: { amount: 65536, nft: { capability: 'none', commitment: '' } }, valueSatoshis: 693 },
            { token: { amount: 4294967296, nft: { capability: 'none', commitment: '' } }, valueSatoshis: 1_000 },
            { valueSatoshis: 1_000 },
          ],
        },
      },
    ],
    [
      '',
      '<1>',
      'mint all token types (output 2 P2SH20 dust)',
      ['nonstandard', 'chip_cashtokens', 'chip_cashtokens_p2sh20_nonstandard', 'chip_cashtokens_p2sh32_nonstandard'],
      {
        sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }],
        transaction: {
          inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }],
          outputs: [
            { token: { amount: 1, nft: { capability: 'minting', commitment: '010203ff00' } }, valueSatoshis: 1_000 },
            { token: { amount: 253, nft: { capability: 'mutable', commitment: '010203ff00' } }, valueSatoshis: 1_000 },
            { token: { amount: 65536, nft: { capability: 'none', commitment: '' } }, valueSatoshis: 656 },
            { token: { amount: 4294967296, nft: { capability: 'none', commitment: '' } }, valueSatoshis: 1_000 },
            { valueSatoshis: 1_000 },
          ],
        },
      },
    ],
    [
      '',
      '<1>',
      'mint all token types (output 2 P2SH32 dust)',
      ['nonstandard', 'chip_cashtokens', 'chip_cashtokens_p2sh32_nonstandard'],
      {
        sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }],
        transaction: {
          inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }],
          outputs: [
            { token: { amount: 1, nft: { capability: 'minting', commitment: '010203ff00' } }, valueSatoshis: 1_000 },
            { token: { amount: 253, nft: { capability: 'mutable', commitment: '010203ff00' } }, valueSatoshis: 1_000 },
            { token: { amount: 65536, nft: { capability: 'none', commitment: '' } }, valueSatoshis: 657 },
            { token: { amount: 4294967296, nft: { capability: 'none', commitment: '' } }, valueSatoshis: 1_000 },
            { valueSatoshis: 1_000 },
          ],
        },
      },
    ],
    [
      '',
      '<1>',
      'mint all token types (output 3 P2SH32 non-dust minimum)',
      ['nonstandard', 'chip_cashtokens'],
      {
        sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }],
        transaction: {
          inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }],
          outputs: [
            { token: { amount: 1, nft: { capability: 'minting', commitment: '010203ff00' } }, valueSatoshis: 1_000 },
            { token: { amount: 253, nft: { capability: 'mutable', commitment: '010203ff00' } }, valueSatoshis: 1_000 },
            { token: { amount: 65536, nft: { capability: 'none', commitment: '' } }, valueSatoshis: 1_000 },
            { token: { amount: 4294967296, nft: { capability: 'none', commitment: '' } }, valueSatoshis: 705 },
            { valueSatoshis: 1_000 },
          ],
        },
      },
    ],
    [
      '',
      '<1>',
      'mint all token types (output 3 P2SH20 dust)',
      ['nonstandard', 'chip_cashtokens', 'chip_cashtokens_p2sh20_nonstandard', 'chip_cashtokens_p2sh32_nonstandard'],
      {
        sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }],
        transaction: {
          inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }],
          outputs: [
            { token: { amount: 1, nft: { capability: 'minting', commitment: '010203ff00' } }, valueSatoshis: 1_000 },
            { token: { amount: 253, nft: { capability: 'mutable', commitment: '010203ff00' } }, valueSatoshis: 1_000 },
            { token: { amount: 65536, nft: { capability: 'none', commitment: '' } }, valueSatoshis: 1_000 },
            { token: { amount: 4294967296, nft: { capability: 'none', commitment: '' } }, valueSatoshis: 668 },
            { valueSatoshis: 1_000 },
          ],
        },
      },
    ],
    [
      '',
      '<1>',
      'mint all token types (output 3 P2SH32 dust)',
      ['nonstandard', 'chip_cashtokens', 'chip_cashtokens_p2sh32_nonstandard'],
      {
        sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }],
        transaction: {
          inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }],
          outputs: [
            { token: { amount: 1, nft: { capability: 'minting', commitment: '010203ff00' } }, valueSatoshis: 1_000 },
            { token: { amount: 253, nft: { capability: 'mutable', commitment: '010203ff00' } }, valueSatoshis: 1_000 },
            { token: { amount: 65536, nft: { capability: 'none', commitment: '' } }, valueSatoshis: 1_000 },
            { token: { amount: 4294967296, nft: { capability: 'none', commitment: '' } }, valueSatoshis: 669 },
            { valueSatoshis: 1_000 },
          ],
        },
      },
    ],
    // multi-category minting
    [
      '',
      '<1>',
      'mint multiple categories (fungible tokens, immutable tokens)',
      ['nonstandard', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], valueSatoshis: 10_000 },
        ],
        transaction: {
          inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { outpointIndex: 0, outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000003', unlockingBytecode: ['slot'] }],
          outputs: [
            { token: { amount: 1_000, category: '0000000000000000000000000000000000000000000000000000000000000001' }, valueSatoshis: 1_000 },
            { token: { amount: 2_000, category: '0000000000000000000000000000000000000000000000000000000000000001' }, valueSatoshis: 1_000 },
            { token: { category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { commitment: '010203ff00' } }, valueSatoshis: 1_000 },
            { token: { category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { commitment: '010203ff00' } }, valueSatoshis: 1_000 },
          ],
        },
      },
    ],
    [
      '',
      '<1>',
      'mint multiple categories (fungible tokens of wrong category, immutable tokens)',
      ['nonstandard', 'chip_cashtokens_invalid'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], valueSatoshis: 10_000 },
        ],
        transaction: {
          inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { outpointIndex: 0, outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000003', unlockingBytecode: ['slot'] }],
          outputs: [
            { token: { amount: 1_000 }, valueSatoshis: 1_000 },
            { token: { amount: 2_000 }, valueSatoshis: 1_000 },
            { token: { category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { commitment: '010203ff00' } }, valueSatoshis: 1_000 },
            { token: { category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { commitment: '010203ff00' } }, valueSatoshis: 1_000 },
          ],
        },
      },
    ],
    [
      '',
      '<1>',
      'mint maximum fungible supply for multiple categories',
      ['nonstandard', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], valueSatoshis: 10_000 },
        ],
        transaction: {
          inputs: [
            { outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: { script: 'unlockEmptyP2sh20' } },
            { outpointIndex: 0, outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000003', unlockingBytecode: ['slot'] },
          ],
          outputs: [
            { token: { amount: '4611686018427387903', nft: { capability: 'minting' } }, valueSatoshis: 1_000 },
            { token: { amount: '4611686018427387904' }, valueSatoshis: 1_000 },
            { token: { amount: '4611686018427387903', category: '0000000000000000000000000000000000000000000000000000000000000003' }, valueSatoshis: 1_000 },
            { token: { amount: '4611686018427387904', category: '0000000000000000000000000000000000000000000000000000000000000003' }, valueSatoshis: 1_000 },
          ],
        },
      },
    ],
    [
      '',
      '<1>',
      'mint maximum fungible supply for multiple categories (excessive in one category)',
      ['nonstandard', 'chip_cashtokens_invalid'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], valueSatoshis: 10_000 },
        ],
        transaction: {
          inputs: [
            { outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: { script: 'unlockEmptyP2sh20' } },
            { outpointIndex: 0, outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000003', unlockingBytecode: ['slot'] },
          ],
          outputs: [
            { token: { amount: '4611686018427387904', nft: { capability: 'minting' } }, valueSatoshis: 1_000 },
            { token: { amount: '4611686018427387904' }, valueSatoshis: 1_000 },
            { token: { amount: '4611686018427387903', category: '0000000000000000000000000000000000000000000000000000000000000003' }, valueSatoshis: 1_000 },
            { token: { amount: '4611686018427387904', category: '0000000000000000000000000000000000000000000000000000000000000003' }, valueSatoshis: 1_000 },
          ],
        },
      },
    ],
    [
      '',
      '<1>',
      'mint immutable tokens while moving immutable tokens of another category (duplicate commitments)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { category: '0000000000000000000000000000000000000000000000000000000000000004', nft: { commitment: '04050607' } }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { category: '0000000000000000000000000000000000000000000000000000000000000004', nft: { commitment: '0405060708' } }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], valueSatoshis: 10_000 },
        ],
        transaction: {
          inputs: [
            { outpointIndex: 1, unlockingBytecode: { script: 'unlockEmptyP2sh20' } },
            { outpointIndex: 2, unlockingBytecode: { script: 'unlockEmptyP2sh20' } },
            { outpointIndex: 0, outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] },
          ],
          outputs: [
            { token: { nft: { commitment: '04050607' } }, valueSatoshis: 1_000 },
            { token: { nft: { commitment: '0405060708' } }, valueSatoshis: 1_000 },
            { token: { category: '0000000000000000000000000000000000000000000000000000000000000004', nft: { commitment: '04050607' } }, valueSatoshis: 1_000 },
            { token: { category: '0000000000000000000000000000000000000000000000000000000000000004', nft: { commitment: '0405060708' } }, valueSatoshis: 1_000 },
          ],
        },
      },
    ],
    [
      '',
      '<1>',
      'mint immutable tokens while moving immutable tokens of another category (attempt to modify a moved commitment)',
      ['invalid', 'chip_cashtokens_invalid'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { category: '0000000000000000000000000000000000000000000000000000000000000004', nft: { commitment: '04050607' } }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { category: '0000000000000000000000000000000000000000000000000000000000000004', nft: { commitment: '0405060708' } }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], valueSatoshis: 10_000 },
        ],
        transaction: {
          inputs: [
            { outpointIndex: 1, unlockingBytecode: { script: 'unlockEmptyP2sh20' } },
            { outpointIndex: 2, unlockingBytecode: { script: 'unlockEmptyP2sh20' } },
            { outpointIndex: 0, outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] },
          ],
          outputs: [
            { token: { nft: { commitment: '04050607' } }, valueSatoshis: 1_000 },
            { token: { nft: { commitment: '0405060708' } }, valueSatoshis: 1_000 },
            { token: { category: '0000000000000000000000000000000000000000000000000000000000000004', nft: { commitment: '04050607' } }, valueSatoshis: 1_000 },
            { token: { category: '0000000000000000000000000000000000000000000000000000000000000004', nft: { commitment: '04050607' } }, valueSatoshis: 1_000 },
          ],
        },
      },
    ],
    // test commitment lengths
    ['', '<1>', 'mint immutable NFT (0-byte commitment)', ['invalid', 'p2sh_nonstandard', 'chip_cashtokens'], { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ token: { category: '0000000000000000000000000000000000000000000000000000000000000001', nft: { commitment: '' } }, valueSatoshis: 1_000 }] } }],
    ['', '<1>', 'mint immutable NFT (1-byte commitment)', ['invalid', 'p2sh_nonstandard', 'chip_cashtokens'], { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ token: { category: '0000000000000000000000000000000000000000000000000000000000000001', nft: { commitment: '01' } }, valueSatoshis: 1_000 }] } }],
    ['', '<1>', 'mint immutable NFT (2-byte commitment)', ['invalid', 'p2sh_nonstandard', 'chip_cashtokens'], { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ token: { category: '0000000000000000000000000000000000000000000000000000000000000001', nft: { commitment: '0102' } }, valueSatoshis: 1_000 }] } }],
    [
      '',
      '<1>',
      'mint immutable NFT (3-byte commitment)',
      ['invalid', 'p2sh_nonstandard', 'chip_cashtokens'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ token: { category: '0000000000000000000000000000000000000000000000000000000000000001', nft: { commitment: '010203' } }, valueSatoshis: 1_000 }] } },
    ],
    ['', '<1>', 'mint immutable NFT (4-byte commitment)', ['nonstandard', 'chip_cashtokens'], { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ token: { category: '0000000000000000000000000000000000000000000000000000000000000001', nft: { commitment: '01020304' } }, valueSatoshis: 1_000 }] } }],
    ['', '<1>', 'mint immutable NFT (5-byte commitment)', ['nonstandard', 'chip_cashtokens'], { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ token: { category: '0000000000000000000000000000000000000000000000000000000000000001', nft: { commitment: '0102030405' } }, valueSatoshis: 1_000 }] } }],
    [
      '',
      '<1>',
      'mint immutable NFT (10-byte commitment)',
      ['nonstandard', 'chip_cashtokens'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ token: { category: '0000000000000000000000000000000000000000000000000000000000000001', nft: { commitment: '01020304050607080900' } }, valueSatoshis: 1_000 }] } },
    ],
    [
      '',
      '<1>',
      'mint immutable NFT (20-byte commitment)',
      ['nonstandard', 'chip_cashtokens'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ token: { category: '0000000000000000000000000000000000000000000000000000000000000001', nft: { commitment: '0102030405060708090001020304050607080900' } }, valueSatoshis: 1_000 }] } },
    ],
    [
      '',
      '<1>',
      'mint immutable NFT (30-byte commitment)',
      ['nonstandard', 'chip_cashtokens'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ token: { category: '0000000000000000000000000000000000000000000000000000000000000001', nft: { commitment: '010203040506070809000102030405060708090001020304050607080900' } }, valueSatoshis: 1_000 }] } },
    ],
    [
      '',
      '<1>',
      'mint immutable NFT (40-byte commitment)',
      ['nonstandard', 'chip_cashtokens'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ token: { category: '0000000000000000000000000000000000000000000000000000000000000001', nft: { commitment: '01020304050607080900010203040506070809000102030405060708090001020304050607080900' } }, valueSatoshis: 1_000 }] } },
    ],
    [
      '',
      '<1>',
      'mint immutable NFT (41-byte commitment)',
      ['nonstandard', 'chip_cashtokens_invalid'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ token: { category: '0000000000000000000000000000000000000000000000000000000000000001', nft: { commitment: '0102030405060708090001020304050607080900010203040506070809000102030405060708090001' } }, valueSatoshis: 1_000 }] } },
    ],
    [
      '',
      '<1>',
      'mint immutable NFT (253-byte commitment)',
      ['nonstandard', 'chip_cashtokens_invalid'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 100_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ token: { category: '0000000000000000000000000000000000000000000000000000000000000001', nft: { commitment: binToHex(Uint8Array.from(range(253))) } }, valueSatoshis: 10_000 }] } },
    ],
    // test fungible tokens
    ['', '<1>', 'implicitly destroy fungible tokens', ['invalid', 'chip_cashtokens'], { sourceOutputs: [{ lockingBytecode: ['slot'], token: { amount: 1000, category: '0000000000000000000000000000000000000000000000000000000000000001' }, valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }, { valueSatoshis: 1_000 }] } }],
    [
      '',
      '<1>',
      'implicitly destroy fungible tokens (destroy all but 1)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [{ lockingBytecode: ['slot'], token: { amount: 1000, category: '0000000000000000000000000000000000000000000000000000000000000001' }, valueSatoshis: 10_000 }],
        transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ token: { amount: 1, category: '0000000000000000000000000000000000000000000000000000000000000001' }, valueSatoshis: 1_000 }] },
      },
    ],
    [
      '',
      '<1>',
      'implicitly destroy fungible tokens (0 amount is invalid)',
      ['invalid', 'chip_cashtokens_invalid'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], token: { amount: 1000, category: '0000000000000000000000000000000000000000000000000000000000000001' }, valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ lockingBytecode: 'ef010000000000000000000000000000000000000000000000000000000000000010006a', valueSatoshis: 1_000 }] } },
    ],
    ['', '<1>', 'send fungible token', ['invalid', 'chip_cashtokens'], { sourceOutputs: [{ lockingBytecode: ['slot'], token: { amount: 1 }, valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ token: { amount: 1 }, valueSatoshis: 1_000 }] } }],
    ['', '<1>', 'attempt to overspend fungible token amount (1 to 2)', ['invalid', 'chip_cashtokens_invalid'], { sourceOutputs: [{ lockingBytecode: ['slot'], token: { amount: 1 }, valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ token: { amount: 2 }, valueSatoshis: 1_000 }] } }],
    ['', '<1>', 'attempt to overspend fungible token amount (253 to 254)', ['invalid', 'chip_cashtokens_invalid'], { sourceOutputs: [{ lockingBytecode: ['slot'], token: { amount: 253 }, valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ token: { amount: 254 }, valueSatoshis: 1_000 }] } }],
    ['', '<1>', 'attempt to overspend fungible token amount (65535 to 65536)', ['invalid', 'chip_cashtokens_invalid'], { sourceOutputs: [{ lockingBytecode: ['slot'], token: { amount: 65535 }, valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ token: { amount: 65536 }, valueSatoshis: 1_000 }] } }],
    ['', '<1>', 'attempt to overspend fungible token amount (4294967295 to 4294967296)', ['invalid', 'chip_cashtokens_invalid'], { sourceOutputs: [{ lockingBytecode: ['slot'], token: { amount: 4294967295 }, valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ token: { amount: 4294967296 }, valueSatoshis: 1_000 }] } }],
    [
      '',
      '<1>',
      'split fungible token outputs (1,000,000 to 2 * 500,000)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [{ lockingBytecode: ['slot'], token: { amount: 1_000_000 }, valueSatoshis: 10_000 }],
        transaction: {
          inputs: [{ unlockingBytecode: ['slot'] }],
          outputs: [
            { token: { amount: 500_000 }, valueSatoshis: 1_000 },
            { token: { amount: 500_000 }, valueSatoshis: 1_000 },
          ],
        },
      },
    ],
    [
      '',
      '<1>',
      'split fungible token outputs (attempt 1,000,000 to 1,000,001)',
      ['invalid', 'chip_cashtokens_invalid'],
      {
        sourceOutputs: [{ lockingBytecode: ['slot'], token: { amount: 1_000_000 }, valueSatoshis: 10_000 }],
        transaction: {
          inputs: [{ unlockingBytecode: ['slot'] }],
          outputs: [
            { token: { amount: 500_000 }, valueSatoshis: 1_000 },
            { token: { amount: 500_001 }, valueSatoshis: 1_000 },
          ],
        },
      },
    ],
    [
      '',
      '<1>',
      'split fungible token outputs (1,000,000 to 500,000, implicit burn 500,000)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [{ lockingBytecode: ['slot'], token: { amount: 1_000_000 }, valueSatoshis: 10_000 }],
        transaction: {
          inputs: [{ unlockingBytecode: ['slot'] }],
          outputs: [{ token: { amount: 500_000 }, valueSatoshis: 1_000 }, { valueSatoshis: 1_000 }],
        },
      },
    ],
    [
      '',
      '<1>',
      'split fungible token outputs (100,000 over 5 outputs)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [{ lockingBytecode: ['slot'], token: { amount: 100_000 }, valueSatoshis: 10_000 }],
        transaction: {
          inputs: [{ unlockingBytecode: ['slot'] }],
          outputs: [
            { token: { amount: 20_000 }, valueSatoshis: 1_000 },
            { token: { amount: 20_000 }, valueSatoshis: 1_000 },
            { token: { amount: 20_000 }, valueSatoshis: 1_000 },
            { token: { amount: 20_000 }, valueSatoshis: 1_000 },
            { token: { amount: 20_000 }, valueSatoshis: 1_000 },
          ],
        },
      },
    ],
    [
      '',
      '<1>',
      'split fungible token outputs (attempt 100,000 to 100,001)',
      ['invalid', 'chip_cashtokens_invalid'],
      {
        sourceOutputs: [{ lockingBytecode: ['slot'], token: { amount: 100_000 }, valueSatoshis: 10_000 }],
        transaction: {
          inputs: [{ unlockingBytecode: ['slot'] }],
          outputs: [
            { token: { amount: 20_000 }, valueSatoshis: 1_000 },
            { token: { amount: 20_000 }, valueSatoshis: 1_000 },
            { token: { amount: 20_000 }, valueSatoshis: 1_000 },
            { token: { amount: 20_001 }, valueSatoshis: 1_000 },
            { token: { amount: 20_000 }, valueSatoshis: 1_000 },
          ],
        },
      },
    ],
    [
      '',
      '<1>',
      'split fungible token outputs (10,000 unevenly)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [{ lockingBytecode: ['slot'], token: { amount: 10_000 }, valueSatoshis: 10_000 }],
        transaction: {
          inputs: [{ unlockingBytecode: ['slot'] }],
          outputs: [
            { token: { amount: 1_000 }, valueSatoshis: 1_000 },
            { token: { amount: 2_000 }, valueSatoshis: 1_000 },
            { token: { amount: 3_000 }, valueSatoshis: 1_000 },
            { token: { amount: 4_000 }, valueSatoshis: 1_000 },
          ],
        },
      },
    ],
    [
      '',
      '<1>',
      'split fungible token outputs (attempt 10,000 to 10,001)',
      ['invalid', 'chip_cashtokens_invalid'],
      {
        sourceOutputs: [{ lockingBytecode: ['slot'], token: { amount: 10_000 }, valueSatoshis: 10_000 }],
        transaction: {
          inputs: [{ unlockingBytecode: ['slot'] }],
          outputs: [
            { token: { amount: 1_000 }, valueSatoshis: 1_000 },
            { token: { amount: 2_000 }, valueSatoshis: 1_000 },
            { token: { amount: 3_000 }, valueSatoshis: 1_000 },
            { token: { amount: 4_001 }, valueSatoshis: 1_000 },
          ],
        },
      },
    ],
    [
      '',
      '<1>',
      'merge fungible token outputs (1 + 1 == 2)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: 1 }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { amount: 1 }, valueSatoshis: 10_000 },
        ],
        transaction: {
          inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }],
          outputs: [{ token: { amount: 2 }, valueSatoshis: 1_000 }],
        },
      },
    ],
    [
      '',
      '<1>',
      'merge fungible token outputs (1 + 1 == 3)',
      ['invalid', 'chip_cashtokens_invalid'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: 1 }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { amount: 1 }, valueSatoshis: 10_000 },
        ],
        transaction: {
          inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }],
          outputs: [{ token: { amount: 3 }, valueSatoshis: 1_000 }],
        },
      },
    ],
    [
      '',
      '<1>',
      'merge fungible token outputs (252 + 1 == 253)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: 252 }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { amount: 1 }, valueSatoshis: 10_000 },
        ],
        transaction: {
          inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }],
          outputs: [{ token: { amount: 253 }, valueSatoshis: 1_000 }],
        },
      },
    ],
    [
      '',
      '<1>',
      'merge fungible token outputs (252 + 1 == 254)',
      ['invalid', 'chip_cashtokens_invalid'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: 252 }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { amount: 1 }, valueSatoshis: 10_000 },
        ],
        transaction: {
          inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }],
          outputs: [{ token: { amount: 254 }, valueSatoshis: 1_000 }],
        },
      },
    ],
    [
      '',
      '<1>',
      'merge fungible token outputs (65535 + 1 == 65536)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: 65535 }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { amount: 1 }, valueSatoshis: 10_000 },
        ],
        transaction: {
          inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }],
          outputs: [{ token: { amount: 65536 }, valueSatoshis: 1_000 }],
        },
      },
    ],
    [
      '',
      '<1>',
      'merge fungible token outputs (65535 + 1 == 65537)',
      ['invalid', 'chip_cashtokens_invalid'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: 65535 }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { amount: 1 }, valueSatoshis: 10_000 },
        ],
        transaction: {
          inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }],
          outputs: [{ token: { amount: 65537 }, valueSatoshis: 1_000 }],
        },
      },
    ],
    [
      '',
      '<1>',
      'merge fungible token outputs (4294967295 + 1 == 4294967296)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: 4294967295 }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { amount: 1 }, valueSatoshis: 10_000 },
        ],
        transaction: {
          inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }],
          outputs: [{ token: { amount: 4294967296 }, valueSatoshis: 1_000 }],
        },
      },
    ],
    [
      '',
      '<1>',
      'merge fungible token outputs (4294967295 + 1 == 4294967297)',
      ['invalid', 'chip_cashtokens_invalid'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: 4294967295 }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { amount: 1 }, valueSatoshis: 10_000 },
        ],
        transaction: {
          inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }],
          outputs: [{ token: { amount: 4294967297 }, valueSatoshis: 1_000 }],
        },
      },
    ],
    [
      '',
      '<1>',
      'merge fungible token outputs (9223372036854775807 == 1 + 9223372036854775806)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [{ lockingBytecode: ['slot'], token: { amount: '9223372036854775807' }, valueSatoshis: 10_000 }],
        transaction: {
          inputs: [{ unlockingBytecode: ['slot'] }],
          outputs: [
            { token: { amount: 1 }, valueSatoshis: 1_000 },
            { token: { amount: '9223372036854775806' }, valueSatoshis: 1_000 },
          ],
        },
      },
    ],
    [
      '',
      '<1>',
      'merge fungible token outputs (9223372036854775807 == 1 + 9223372036854775807)',
      ['invalid', 'chip_cashtokens_invalid'],
      {
        sourceOutputs: [{ lockingBytecode: ['slot'], token: { amount: '9223372036854775807' }, valueSatoshis: 10_000 }],
        transaction: {
          inputs: [{ unlockingBytecode: ['slot'] }],
          outputs: [
            { token: { amount: 1 }, valueSatoshis: 1_000 },
            { token: { amount: '9223372036854775807' }, valueSatoshis: 1_000 },
          ],
        },
      },
    ],
    [
      '',
      '<1>',
      'merge fungible token outputs (2 * 500,000 to 1,000,000)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: 500_000 }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { amount: 500_000 }, valueSatoshis: 10_000 },
        ],
        transaction: {
          inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }],
          outputs: [{ token: { amount: 1_000_000 }, valueSatoshis: 1_000 }],
        },
      },
    ],
    [
      '',
      '<1>',
      'merge fungible token outputs (attempt 1,000,000 to 1,000,001)',
      ['invalid', 'chip_cashtokens_invalid'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: 500_000 }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { amount: 500_000 }, valueSatoshis: 10_000 },
        ],
        transaction: {
          inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }],
          outputs: [{ token: { amount: 1_000_001 }, valueSatoshis: 1_000 }],
        },
      },
    ],
    [
      '',
      '<1>',
      'merge fungible token outputs (2 * 500,000 to 900,000, implicit burn 100,000)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: 500_000 }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { amount: 500_000 }, valueSatoshis: 10_000 },
        ],
        transaction: {
          inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }],
          outputs: [{ token: { amount: 900_000 }, valueSatoshis: 1_000 }],
        },
      },
    ],
    [
      '',
      '<1>',
      'merge fungible token outputs (5 inputs to 100,000)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: 20_000 }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: 20_000 }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { amount: 20_000 }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: 20_000 }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: 20_000 }, valueSatoshis: 10_000 },
        ],
        transaction: {
          inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }, { unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: { script: 'unlockEmptyP2sh20' } }],
          outputs: [{ token: { amount: 100_000 }, valueSatoshis: 1_000 }],
        },
      },
    ],
    [
      '',
      '<1>',
      'merge fungible token outputs (attempt 100,000 to 100,001)',
      ['invalid', 'chip_cashtokens_invalid'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: 20_000 }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: 20_000 }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { amount: 20_000 }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: 20_000 }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: 20_000 }, valueSatoshis: 10_000 },
        ],
        transaction: {
          inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }, { unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: { script: 'unlockEmptyP2sh20' } }],
          outputs: [{ token: { amount: 100_001 }, valueSatoshis: 1_000 }],
        },
      },
    ],
    [
      '',
      '<1>',
      'merge fungible token outputs (10,000 unevenly)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: 1_000 }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { amount: 2_000 }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: 3_000 }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: 4_000 }, valueSatoshis: 10_000 },
        ],
        transaction: {
          inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }, { unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: { script: 'unlockEmptyP2sh20' } }],
          outputs: [{ token: { amount: 10_000 }, valueSatoshis: 1_000 }],
        },
      },
    ],
    [
      '',
      '<1>',
      'merge fungible token outputs (attempt 10,000 to 10,001)',
      ['invalid', 'chip_cashtokens_invalid'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: 1_000 }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { amount: 2_000 }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: 3_000 }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: 4_000 }, valueSatoshis: 10_000 },
        ],
        transaction: {
          inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }, { unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: { script: 'unlockEmptyP2sh20' } }],
          outputs: [{ token: { amount: 10_001 }, valueSatoshis: 1_000 }],
        },
      },
    ],
    [
      '',
      '<1>',
      'merge/split fungible token outputs of multiple categories',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: 3_000, category: '0000000000000000000000000000000000000000000000000000000000000003' }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { amount: 3_000, category: '0000000000000000000000000000000000000000000000000000000000000003' }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: 3_000 }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: 4_000 }, valueSatoshis: 10_000 },
        ],
        transaction: {
          inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }, { unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: { script: 'unlockEmptyP2sh20' } }],
          outputs: [
            { token: { amount: 2_000, category: '0000000000000000000000000000000000000000000000000000000000000003' }, valueSatoshis: 1_000 },
            { token: { amount: 2_000, category: '0000000000000000000000000000000000000000000000000000000000000003' }, valueSatoshis: 1_000 },
            { token: { amount: 2_000, category: '0000000000000000000000000000000000000000000000000000000000000003' }, valueSatoshis: 1_000 },
            { token: { amount: 7_000 }, valueSatoshis: 1_000 },
          ],
        },
      },
    ],
    [
      '',
      '<1>',
      'merge/split fungible token outputs of multiple categories (attempt amount increase)',
      ['invalid', 'chip_cashtokens_invalid'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: 3_000, category: '0000000000000000000000000000000000000000000000000000000000000003' }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { amount: 3_000, category: '0000000000000000000000000000000000000000000000000000000000000003' }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: 3_000 }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: 4_000 }, valueSatoshis: 10_000 },
        ],
        transaction: {
          inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }, { unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: { script: 'unlockEmptyP2sh20' } }],
          outputs: [
            { token: { amount: 2_000, category: '0000000000000000000000000000000000000000000000000000000000000003' }, valueSatoshis: 1_000 },
            { token: { amount: 2_000, category: '0000000000000000000000000000000000000000000000000000000000000003' }, valueSatoshis: 1_000 },
            { token: { amount: 2_000, category: '0000000000000000000000000000000000000000000000000000000000000003' }, valueSatoshis: 1_000 },
            { token: { amount: 7_001 }, valueSatoshis: 1_000 },
          ],
        },
      },
    ],
    // test minting tokens
    ['', '<1>', 'implicitly destroy minting token', ['invalid', 'chip_cashtokens'], { sourceOutputs: [{ lockingBytecode: ['slot'], token: { nft: { capability: 'minting' } }, valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }, { valueSatoshis: 1_000 }] } }],
    ['', '<1>', 'move minting token', ['invalid', 'chip_cashtokens'], { sourceOutputs: [{ lockingBytecode: ['slot'], token: { nft: { capability: 'minting' } }, valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ token: { nft: { capability: 'minting' } }, valueSatoshis: 1_000 }] } }],
    [
      '',
      '<1>',
      'duplicate minting token',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [{ lockingBytecode: ['slot'], token: { nft: { capability: 'minting' } }, valueSatoshis: 10_000 }],
        transaction: {
          inputs: [{ unlockingBytecode: ['slot'] }],
          outputs: [
            { token: { nft: { capability: 'minting' } }, valueSatoshis: 1_000 },
            { token: { nft: { capability: 'minting' } }, valueSatoshis: 1_000 },
          ],
        },
      },
    ],
    [
      '',
      '<1>',
      'duplicate minting token (from 2 to 3)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: ['slot'], token: { nft: { capability: 'minting' } }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { nft: { capability: 'minting' } }, valueSatoshis: 10_000 },
        ],
        transaction: {
          inputs: [{ unlockingBytecode: ['slot'] }, { unlockingBytecode: { script: 'unlockEmptyP2sh20' } }],
          outputs: [
            { token: { nft: { capability: 'minting' } }, valueSatoshis: 1_000 },
            { token: { nft: { capability: 'minting' } }, valueSatoshis: 1_000 },
            { token: { nft: { capability: 'minting' } }, valueSatoshis: 1_000 },
          ],
        },
      },
    ],
    [
      '',
      '<1>',
      'mint 1 immutable token, destroy minting token',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [{ lockingBytecode: ['slot'], token: { nft: { capability: 'minting' } }, valueSatoshis: 10_000 }],
        transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ token: { nft: { commitment: '01' } }, valueSatoshis: 1_000 }] },
      },
    ],
    [
      '',
      '<1>',
      'mint 1 immutable token, destroy minting token (attempt with minting token of wrong category)',
      ['invalid', 'chip_cashtokens_invalid'],
      {
        sourceOutputs: [{ lockingBytecode: ['slot'], token: { category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { capability: 'minting' } }, valueSatoshis: 10_000 }],
        transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ token: { nft: { commitment: '01' } }, valueSatoshis: 1_000 }] },
      },
    ],
    [
      '',
      '<1>',
      'mint 1 immutable token, keep minting token',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [{ lockingBytecode: ['slot'], token: { nft: { capability: 'minting' } }, valueSatoshis: 10_000 }],
        transaction: {
          inputs: [{ unlockingBytecode: ['slot'] }],
          outputs: [
            { token: { nft: {} }, valueSatoshis: 1_000 },
            { token: { nft: { capability: 'minting' } }, valueSatoshis: 1_000 },
          ],
        },
      },
    ],
    [
      '',
      '<1>',
      'mint 1 immutable token, keep minting token (with modified commitment)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [{ lockingBytecode: ['slot'], token: { nft: { capability: 'minting' } }, valueSatoshis: 10_000 }],
        transaction: {
          inputs: [{ unlockingBytecode: ['slot'] }],
          outputs: [
            { token: { nft: {} }, valueSatoshis: 1_000 },
            { token: { nft: { capability: 'minting', commitment: '01' } }, valueSatoshis: 1_000 },
          ],
        },
      },
    ],
    [
      '',
      '<1>',
      'mint 9 immutable tokens, destroy minting token',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [{ lockingBytecode: ['slot'], token: { nft: { capability: 'minting' } }, valueSatoshis: 10_000 }],
        transaction: {
          inputs: [{ unlockingBytecode: ['slot'] }],
          outputs: [
            { token: { nft: {} }, valueSatoshis: 1_000 },
            { token: { nft: {} }, valueSatoshis: 1_000 },
            { token: { nft: { commitment: '01' } }, valueSatoshis: 1_000 },
            { token: { nft: { commitment: '02' } }, valueSatoshis: 1_000 },
            { token: { nft: { commitment: '03' } }, valueSatoshis: 1_000 },
            { token: { nft: { commitment: '04' } }, valueSatoshis: 1_000 },
            { token: { nft: { commitment: '05' } }, valueSatoshis: 1_000 },
            { token: { nft: { commitment: '06' } }, valueSatoshis: 1_000 },
            { token: { nft: { commitment: '07' } }, valueSatoshis: 1_000 },
          ],
        },
      },
    ],
    [
      '',
      '<1>',
      'mint 9 immutable tokens, keep minting token',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [{ lockingBytecode: ['slot'], token: { nft: { capability: 'minting' } }, valueSatoshis: 10_000 }],
        transaction: {
          inputs: [{ unlockingBytecode: ['slot'] }],
          outputs: [
            { token: { nft: {} }, valueSatoshis: 1_000 },
            { token: { nft: {} }, valueSatoshis: 1_000 },
            { token: { nft: { commitment: '01' } }, valueSatoshis: 1_000 },
            { token: { nft: { commitment: '02' } }, valueSatoshis: 1_000 },
            { token: { nft: { commitment: '03' } }, valueSatoshis: 1_000 },
            { token: { nft: { commitment: '04' } }, valueSatoshis: 1_000 },
            { token: { nft: { commitment: '05' } }, valueSatoshis: 1_000 },
            { token: { nft: { commitment: '06' } }, valueSatoshis: 1_000 },
            { token: { nft: { capability: 'minting', commitment: '07' } }, valueSatoshis: 1_000 },
          ],
        },
      },
    ],
    [
      '',
      '<1>',
      'mint multiple, maximum-sized immutable tokens, destroy minting token (limited by maximum transaction size)',
      ['invalid', 'chip_cashtokens'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], token: { nft: { capability: 'minting' } }, valueSatoshis: 100_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [...range(20).map(() => ({ token: { nft: { commitment: binToHex(Uint8Array.from(range(40))) } }, valueSatoshis: 1_000 }))] } },
    ],
    [
      '',
      '<1>',
      'mint mutable tokens, destroy minting token',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [{ lockingBytecode: ['slot'], token: { nft: { capability: 'minting' } }, valueSatoshis: 10_000 }],
        transaction: {
          inputs: [{ unlockingBytecode: ['slot'] }],
          outputs: [
            { token: { nft: {} }, valueSatoshis: 1_000 },
            { token: { nft: {} }, valueSatoshis: 1_000 },
            { token: { nft: { capability: 'mutable' } }, valueSatoshis: 1_000 },
            { token: { nft: { capability: 'mutable' } }, valueSatoshis: 1_000 },
            { token: { nft: { capability: 'mutable' } }, valueSatoshis: 1_000 },
          ],
        },
      },
    ],
    [
      '',
      '<1>',
      'mint multiple NFTs, various capabilities',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [{ lockingBytecode: ['slot'], token: { nft: { capability: 'minting' } }, valueSatoshis: 10_000 }],
        transaction: {
          inputs: [{ unlockingBytecode: ['slot'] }],
          outputs: [
            { token: { nft: {} }, valueSatoshis: 1_000 },
            { token: { nft: {} }, valueSatoshis: 1_000 },
            { token: { nft: { capability: 'minting' } }, valueSatoshis: 1_000 },
            { token: { nft: { capability: 'minting' } }, valueSatoshis: 1_000 },
            { token: { nft: { capability: 'mutable' } }, valueSatoshis: 1_000 },
            { token: { nft: { capability: 'mutable' } }, valueSatoshis: 1_000 },
            { token: { nft: { capability: 'mutable' } }, valueSatoshis: 1_000 },
          ],
        },
      },
    ],
    [
      '',
      '<1>',
      'mint multiple NFTs, various capabilities (attempt to mint a fungible token after genesis transaction)',
      ['invalid', 'chip_cashtokens_invalid'],
      {
        sourceOutputs: [{ lockingBytecode: ['slot'], token: { nft: { capability: 'minting' } }, valueSatoshis: 10_000 }],
        transaction: {
          inputs: [{ unlockingBytecode: ['slot'] }],
          outputs: [
            { token: { nft: {} }, valueSatoshis: 1_000 },
            { token: { nft: {} }, valueSatoshis: 1_000 },
            { token: { amount: 1, nft: { capability: 'minting' } }, valueSatoshis: 1_000 },
            { token: { nft: { capability: 'minting' } }, valueSatoshis: 1_000 },
            { token: { nft: { capability: 'mutable' } }, valueSatoshis: 1_000 },
            { token: { nft: { capability: 'mutable' } }, valueSatoshis: 1_000 },
            { token: { nft: { capability: 'mutable' } }, valueSatoshis: 1_000 },
          ],
        },
      },
    ],
    [
      '',
      '<1>',
      'mint 2 immutable tokens while moving an mutable token (of the same category, burn minting token)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { nft: { capability: 'mutable' } }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { nft: { capability: 'minting' } }, valueSatoshis: 10_000 },
        ],
        transaction: {
          inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }],
          outputs: [
            { token: { nft: {} }, valueSatoshis: 1_000 },
            { token: { nft: {} }, valueSatoshis: 1_000 },
            { token: { nft: { capability: 'mutable' } }, valueSatoshis: 1_000 },
          ],
        },
      },
    ],
    [
      '',
      '<1>',
      'mint 3 immutable tokens while dropping an immutable token (of the same category, burn minting token)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { nft: { commitment: '040506' } }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { nft: { capability: 'minting' } }, valueSatoshis: 10_000 },
        ],
        transaction: {
          inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }],
          outputs: [
            { token: { nft: {} }, valueSatoshis: 1_000 },
            { token: { nft: {} }, valueSatoshis: 1_000 },
            { token: { nft: {} }, valueSatoshis: 1_000 },
          ],
        },
      },
    ],
    [
      '',
      '<1>',
      'mint an immutable token while splitting fungible token outputs (of the same category)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: 10, nft: { commitment: '040506' } }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { nft: { capability: 'minting' } }, valueSatoshis: 10_000 },
        ],
        transaction: {
          inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }],
          outputs: [
            { token: { nft: { capability: 'minting' } }, valueSatoshis: 1_000 },
            { token: { amount: 5, nft: { commitment: '040506' } }, valueSatoshis: 1_000 },
            { token: { amount: 5, nft: {} }, valueSatoshis: 1_000 },
          ],
        },
      },
    ],
    [
      '',
      '<1>',
      'mint an immutable token while minting fungible and minting tokens (genesis transaction) of a new category',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [{ lockingBytecode: ['slot'], token: { nft: { capability: 'minting' } }, valueSatoshis: 10_000 }],
        transaction: {
          inputs: [{ unlockingBytecode: ['slot'] }],
          outputs: [
            { token: { category: '0000000000000000000000000000000000000000000000000000000000000001', nft: { capability: 'minting' } }, valueSatoshis: 1_000 },
            { token: { amount: 1000, category: '0000000000000000000000000000000000000000000000000000000000000001', nft: { capability: 'minting' } }, valueSatoshis: 1_000 },
            { token: { nft: { capability: 'minting' } }, valueSatoshis: 1_000 },
            { token: { nft: {} }, valueSatoshis: 1_000 },
          ],
        },
      },
    ],
    [
      '',
      '<1>',
      'mint an immutable token while minting fungible and minting tokens (genesis transaction) of a new category (attempt to add fungible tokens of original category)',
      ['invalid', 'chip_cashtokens_invalid'],
      {
        sourceOutputs: [{ lockingBytecode: ['slot'], token: { nft: { capability: 'minting' } }, valueSatoshis: 10_000 }],
        transaction: {
          inputs: [{ unlockingBytecode: ['slot'] }],
          outputs: [
            { token: { category: '0000000000000000000000000000000000000000000000000000000000000001', nft: { capability: 'minting' } }, valueSatoshis: 1_000 },
            { token: { amount: 1000, category: '0000000000000000000000000000000000000000000000000000000000000001', nft: { capability: 'minting' } }, valueSatoshis: 1_000 },
            { token: { nft: { capability: 'minting' } }, valueSatoshis: 1_000 },
            { token: { amount: 1, nft: {} }, valueSatoshis: 1_000 },
          ],
        },
      },
    ],
    [
      '',
      '<1>',
      'mint an immutable token while modifying a mutable token of another category',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { capability: 'mutable', commitment: '040506' } }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { nft: { capability: 'minting' } }, valueSatoshis: 10_000 },
        ],
        transaction: {
          inputs: [{ outpointIndex: 2, unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }],
          outputs: [
            { token: { nft: { capability: 'minting' } }, valueSatoshis: 1_000 },
            { token: { nft: {} }, valueSatoshis: 1_000 },
            { token: { category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { capability: 'mutable', commitment: '050607' } }, valueSatoshis: 1_000 },
          ],
        },
      },
    ],
    [
      '',
      '<1>',
      'mint an immutable token while downgrading a mutable token of another category',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { capability: 'mutable', commitment: '040506' } }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { nft: { capability: 'minting' } }, valueSatoshis: 10_000 },
        ],
        transaction: {
          inputs: [{ outpointIndex: 2, unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }],
          outputs: [
            { token: { nft: { capability: 'minting' } }, valueSatoshis: 1_000 },
            { token: { nft: {} }, valueSatoshis: 1_000 },
            { token: { category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { commitment: '050607' } }, valueSatoshis: 1_000 },
          ],
        },
      },
    ],
    // test mutable tokens
    ['', '<1>', 'implicitly destroy mutable token', ['invalid', 'chip_cashtokens'], { sourceOutputs: [{ lockingBytecode: ['slot'], token: { nft: { capability: 'mutable' } }, valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }, { valueSatoshis: 1_000 }] } }],
    ['', '<1>', 'move mutable token', ['invalid', 'chip_cashtokens'], { sourceOutputs: [{ lockingBytecode: ['slot'], token: { nft: { capability: 'mutable' } }, valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ token: { nft: { capability: 'mutable' } }, valueSatoshis: 1_000 }] } }],
    [
      '',
      '<1>',
      'attempt to duplicate mutable token',
      ['invalid', 'chip_cashtokens_invalid'],
      {
        sourceOutputs: [{ lockingBytecode: ['slot'], token: { nft: { capability: 'mutable' } }, valueSatoshis: 10_000 }],
        transaction: {
          inputs: [{ unlockingBytecode: ['slot'] }],
          outputs: [
            { token: { nft: { capability: 'mutable' } }, valueSatoshis: 1_000 },
            { token: { nft: { capability: 'mutable' } }, valueSatoshis: 1_000 },
          ],
        },
      },
    ],
    [
      '',
      '<1>',
      'attempt to duplicate mutable token (from 2 to 3)',
      ['invalid', 'chip_cashtokens_invalid'],
      {
        sourceOutputs: [
          { lockingBytecode: ['slot'], token: { nft: { capability: 'mutable' } }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { nft: { capability: 'mutable' } }, valueSatoshis: 10_000 },
        ],
        transaction: {
          inputs: [{ unlockingBytecode: ['slot'] }, { unlockingBytecode: { script: 'unlockEmptyP2sh20' } }],
          outputs: [
            { token: { nft: { capability: 'mutable' } }, valueSatoshis: 1_000 },
            { token: { nft: { capability: 'mutable' } }, valueSatoshis: 1_000 },
            { token: { nft: { capability: 'mutable' } }, valueSatoshis: 1_000 },
          ],
        },
      },
    ],
    ['', '<1>', 'modify mutable token', ['invalid', 'chip_cashtokens'], { sourceOutputs: [{ lockingBytecode: ['slot'], token: { nft: { capability: 'mutable' } }, valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ token: { nft: { capability: 'mutable', commitment: '01' } }, valueSatoshis: 1_000 }] } }],
    ['', '<1>', 'downgrade mutable token to immutable token', ['invalid', 'chip_cashtokens'], { sourceOutputs: [{ lockingBytecode: ['slot'], token: { nft: { capability: 'mutable' } }, valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ token: { nft: {} }, valueSatoshis: 1_000 }] } }],
    ['', '<1>', 'modify and downgrade mutable token to immutable token', ['invalid', 'chip_cashtokens'], { sourceOutputs: [{ lockingBytecode: ['slot'], token: { nft: { capability: 'mutable' } }, valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ token: { nft: { commitment: '01' } }, valueSatoshis: 1_000 }] } }],
    [
      '',
      '<1>',
      'modify 2 mutable tokens of the same category',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { nft: { capability: 'mutable', commitment: '040506' } }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { nft: { capability: 'mutable', commitment: '050607' } }, valueSatoshis: 10_000 },
        ],
        transaction: {
          inputs: [{ outpointIndex: 2, unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }],
          outputs: [
            { token: { nft: { capability: 'mutable' } }, valueSatoshis: 1_000 },
            { token: { nft: { capability: 'mutable' } }, valueSatoshis: 1_000 },
          ],
        },
      },
    ],
    [
      '',
      '<1>',
      'modify 1 of 2 mutable tokens of the same category',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { nft: { capability: 'mutable', commitment: '040506' } }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { nft: { capability: 'mutable', commitment: '050607' } }, valueSatoshis: 10_000 },
        ],
        transaction: {
          inputs: [{ outpointIndex: 2, unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }],
          outputs: [
            { token: { nft: { capability: 'mutable' } }, valueSatoshis: 1_000 },
            { token: { nft: { capability: 'mutable', commitment: '050607' } }, valueSatoshis: 1_000 },
          ],
        },
      },
    ],
    [
      '',
      '<1>',
      'downgrade 2 mutable tokens of the same category (modify one)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { nft: { capability: 'mutable', commitment: '040506' } }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { nft: { capability: 'mutable', commitment: '050607' } }, valueSatoshis: 10_000 },
        ],
        transaction: {
          inputs: [{ outpointIndex: 2, unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }],
          outputs: [
            { token: { nft: {} }, valueSatoshis: 1_000 },
            { token: { nft: { commitment: '040506' } }, valueSatoshis: 1_000 },
          ],
        },
      },
    ],
    [
      '',
      '<1>',
      'downgrade 2 mutable tokens of the same category (modify both)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { nft: { capability: 'mutable', commitment: '040506' } }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { nft: { capability: 'mutable', commitment: '050607' } }, valueSatoshis: 10_000 },
        ],
        transaction: {
          inputs: [{ outpointIndex: 2, unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }],
          outputs: [
            { token: { nft: { commitment: '04050607' } }, valueSatoshis: 1_000 },
            { token: { nft: { commitment: '05060708' } }, valueSatoshis: 1_000 },
          ],
        },
      },
    ],
    [
      '',
      '<1>',
      'downgrade and modify 1 mutable token while moving 1 immutable token (of the same category)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { nft: { commitment: '040506' } }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { nft: { capability: 'mutable', commitment: '050607' } }, valueSatoshis: 10_000 },
        ],
        transaction: {
          inputs: [{ outpointIndex: 2, unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }],
          outputs: [
            { token: { nft: { commitment: '040506' } }, valueSatoshis: 1_000 },
            { token: { nft: { commitment: '05060708' } }, valueSatoshis: 1_000 },
          ],
        },
      },
    ],
    [
      '',
      '<1>',
      'downgrade and modify 1 mutable token while moving 1 immutable token (of another category)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { commitment: '040506' } }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { nft: { capability: 'mutable', commitment: '050607' } }, valueSatoshis: 10_000 },
        ],
        transaction: {
          inputs: [{ outpointIndex: 2, unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }],
          outputs: [
            { token: { category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { commitment: '040506' } }, valueSatoshis: 1_000 },
            { token: { nft: { commitment: '05060708' } }, valueSatoshis: 1_000 },
          ],
        },
      },
    ],
    [
      '',
      '<1>',
      'attempt to swap commitments of one mutable and one immutable token of the same category',
      ['invalid', 'chip_cashtokens_invalid'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { nft: { commitment: '040506' } }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { nft: { capability: 'mutable', commitment: '050607' } }, valueSatoshis: 10_000 },
        ],
        transaction: {
          inputs: [{ outpointIndex: 2, unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }],
          outputs: [
            { token: { nft: { capability: 'mutable', commitment: '040506' } }, valueSatoshis: 1_000 },
            { token: { nft: { commitment: '050607' } }, valueSatoshis: 1_000 },
          ],
        },
      },
    ],
    [
      '',
      '<1>',
      'modify 2 mutable tokens while dropping 1 immutable token of the same category',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { nft: { commitment: '040506' } }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { nft: { capability: 'mutable' } }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { nft: { capability: 'mutable' } }, valueSatoshis: 10_000 },
        ],
        transaction: {
          inputs: [{ outpointIndex: 5, unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }],
          outputs: [{ valueSatoshis: 1_000 }, { token: { nft: { capability: 'mutable', commitment: '040506' } }, valueSatoshis: 1_000 }, { token: { nft: { capability: 'mutable', commitment: '040506' } }, valueSatoshis: 1_000 }],
        },
      },
    ],
    [
      '',
      '<1>',
      'modify 2 mutable tokens while dropping 1 immutable token of the same category (attempt to only swap commitments)',
      ['invalid', 'chip_cashtokens_invalid'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { nft: { commitment: '040506' } }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { nft: { capability: 'mutable' } }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { nft: { capability: 'mutable' } }, valueSatoshis: 10_000 },
        ],
        transaction: {
          inputs: [{ outpointIndex: 5, unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }],
          outputs: [
            { token: { nft: {} }, valueSatoshis: 1_000 },
            { token: { nft: { capability: 'mutable', commitment: '040506' } }, valueSatoshis: 1_000 },
            { token: { nft: { capability: 'mutable', commitment: '040506' } }, valueSatoshis: 1_000 },
          ],
        },
      },
    ],
    [
      '',
      '<1>',
      'downgrade 2 mutable tokens while moving 1 immutable token of the same category',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { nft: { commitment: '040506' } }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { nft: { capability: 'mutable' } }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { nft: { capability: 'mutable' } }, valueSatoshis: 10_000 },
        ],
        transaction: {
          inputs: [{ outpointIndex: 5, unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }],
          outputs: [
            { token: { nft: {} }, valueSatoshis: 1_000 },
            { token: { nft: { commitment: '040506' } }, valueSatoshis: 1_000 },
            { token: { nft: {} }, valueSatoshis: 1_000 },
          ],
        },
      },
    ],
    [
      '',
      '<1>',
      'downgrade 2 mutable tokens while moving 1 immutable token of the same category (attempt to modify immutable token)',
      ['invalid', 'chip_cashtokens_invalid'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { nft: { commitment: '040506' } }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { nft: { capability: 'mutable' } }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { nft: { capability: 'mutable' } }, valueSatoshis: 10_000 },
        ],
        transaction: {
          inputs: [{ outpointIndex: 5, unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }],
          outputs: [
            { token: { nft: {} }, valueSatoshis: 1_000 },
            { token: { nft: {} }, valueSatoshis: 1_000 },
            { token: { nft: {} }, valueSatoshis: 1_000 },
          ],
        },
      },
    ],
    [
      '',
      '<1>',
      'modify, downgrade, and/or destroy mutable tokens of multiple categories',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { commitment: '040506' } }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { capability: 'mutable', commitment: '040506' } }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { capability: 'mutable' } }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { nft: { capability: 'mutable' } }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { nft: { capability: 'mutable' } }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { nft: {} }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { nft: {} }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { nft: {} }, valueSatoshis: 10_000 },
        ],
        transaction: {
          inputs: [
            { outpointIndex: 100, unlockingBytecode: { script: 'unlockEmptyP2sh20' } },
            { unlockingBytecode: { script: 'unlockEmptyP2sh20' } },
            { unlockingBytecode: { script: 'unlockEmptyP2sh20' } },
            { unlockingBytecode: { script: 'unlockEmptyP2sh20' } },
            { unlockingBytecode: { script: 'unlockEmptyP2sh20' } },
            { unlockingBytecode: { script: 'unlockEmptyP2sh20' } },
            { unlockingBytecode: { script: 'unlockEmptyP2sh20' } },
            { unlockingBytecode: ['slot'] },
          ],
          outputs: [
            { token: { category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { commitment: '040506' } }, valueSatoshis: 1_000 },
            { token: { category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { capability: 'mutable' } }, valueSatoshis: 1_000 },
            { token: { nft: { capability: 'mutable', commitment: '010203' } }, valueSatoshis: 1_000 },
            { token: { nft: { commitment: '010203' } }, valueSatoshis: 1_000 },
            { token: { nft: {} }, valueSatoshis: 1_000 },
          ],
        },
      },
    ],
    [
      '',
      '<1>',
      'modify, downgrade, and/or destroy mutable tokens of multiple categories (attempt with insufficient mutable tokens)',
      ['invalid', 'chip_cashtokens_invalid'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { commitment: '040506' } }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { capability: 'mutable', commitment: '040506' } }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { capability: 'mutable' } }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { nft: { capability: 'mutable' } }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { nft: { capability: 'mutable' } }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { nft: {} }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { nft: {} }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { nft: {} }, valueSatoshis: 10_000 },
        ],
        transaction: {
          inputs: [
            { outpointIndex: 100, unlockingBytecode: { script: 'unlockEmptyP2sh20' } },
            { unlockingBytecode: { script: 'unlockEmptyP2sh20' } },
            { unlockingBytecode: { script: 'unlockEmptyP2sh20' } },
            { unlockingBytecode: { script: 'unlockEmptyP2sh20' } },
            { unlockingBytecode: { script: 'unlockEmptyP2sh20' } },
            { unlockingBytecode: { script: 'unlockEmptyP2sh20' } },
            { unlockingBytecode: { script: 'unlockEmptyP2sh20' } },
            { unlockingBytecode: ['slot'] },
          ],
          outputs: [
            { token: { category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { commitment: '040506' } }, valueSatoshis: 1_000 },
            { token: { category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { capability: 'mutable' } }, valueSatoshis: 1_000 },
            { token: { nft: { capability: 'mutable', commitment: '010203' } }, valueSatoshis: 1_000 },
            { token: { nft: { commitment: '010203' } }, valueSatoshis: 1_000 },
            { token: { nft: { capability: 'mutable' } }, valueSatoshis: 1_000 },
          ],
        },
      },
    ],
    // test immutable tokens
    ['', '<1>', 'implicitly destroy immutable token (4-byte commitment)', ['invalid', 'chip_cashtokens'], { sourceOutputs: [{ lockingBytecode: ['slot'], token: { nft: { commitment: '010203ff' } }, valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }, { valueSatoshis: 1_000 }] } }],
    ['', '<1>', 'implicitly destroy immutable token (zero-length commitment)', ['invalid', 'chip_cashtokens'], { sourceOutputs: [{ lockingBytecode: ['slot'], token: { nft: {} }, valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }, { valueSatoshis: 1_000 }] } }],
    ['', '<1>', 'move immutable token', ['invalid', 'chip_cashtokens'], { sourceOutputs: [{ lockingBytecode: ['slot'], token: { nft: { commitment: '010203ff' } }, valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ token: { nft: { commitment: '010203ff' } }, valueSatoshis: 693 }] } }],
    [
      '',
      '<1>',
      'move immutable token (P2SH32 and P2SH20 dust)',
      ['invalid', 'chip_cashtokens', 'chip_cashtokens_p2sh20_nonstandard', 'chip_cashtokens_p2sh32_nonstandard'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], token: { nft: { commitment: '010203ff' } }, valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ token: { nft: { commitment: '010203ff' } }, valueSatoshis: 656 }] } },
    ],
    ['', '<1>', 'move immutable token (P2SH32 dust, 657)', ['invalid', 'chip_cashtokens', 'chip_cashtokens_p2sh32_nonstandard'], { sourceOutputs: [{ lockingBytecode: ['slot'], token: { nft: { commitment: '010203ff' } }, valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ token: { nft: { commitment: '010203ff' } }, valueSatoshis: 657 }] } }],
    ['', '<1>', 'move immutable token (P2SH32 dust, 692)', ['invalid', 'chip_cashtokens', 'chip_cashtokens_p2sh32_nonstandard'], { sourceOutputs: [{ lockingBytecode: ['slot'], token: { nft: { commitment: '010203ff' } }, valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ token: { nft: { commitment: '010203ff' } }, valueSatoshis: 692 }] } }],
    [
      '',
      '<1>',
      'attempt to duplicate immutable token',
      ['invalid', 'chip_cashtokens_invalid'],
      {
        sourceOutputs: [{ lockingBytecode: ['slot'], token: { nft: {} }, valueSatoshis: 10_000 }],
        transaction: {
          inputs: [{ unlockingBytecode: ['slot'] }],
          outputs: [
            { token: { nft: {} }, valueSatoshis: 1_000 },
            { token: { nft: {} }, valueSatoshis: 1_000 },
          ],
        },
      },
    ],
    [
      '',
      '<1>',
      'attempt to duplicate immutable token (from 2 to 3)',
      ['invalid', 'chip_cashtokens_invalid'],
      {
        sourceOutputs: [
          { lockingBytecode: ['slot'], token: { nft: {} }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { nft: {} }, valueSatoshis: 10_000 },
        ],
        transaction: {
          inputs: [{ unlockingBytecode: ['slot'] }, { unlockingBytecode: { script: 'unlockEmptyP2sh20' } }],
          outputs: [
            { token: { nft: {} }, valueSatoshis: 1_000 },
            { token: { nft: {} }, valueSatoshis: 1_000 },
            { token: { nft: {} }, valueSatoshis: 1_000 },
          ],
        },
      },
    ],
    ['', '<1>', 'attempt to modify immutable token (slice off byte)', ['invalid', 'chip_cashtokens_invalid'], { sourceOutputs: [{ lockingBytecode: ['slot'], token: { nft: { commitment: '010203ff' } }, valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ token: { nft: { commitment: '010203' } }, valueSatoshis: 1_000 }] } }],
    ['', '<1>', 'attempt to modify immutable token (append byte)', ['invalid', 'chip_cashtokens_invalid'], { sourceOutputs: [{ lockingBytecode: ['slot'], token: { nft: { commitment: '010203ff' } }, valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ token: { nft: { commitment: '010203ff00' } }, valueSatoshis: 1_000 }] } }],
    ['', '<1>', 'attempt to upgrade immutable token to mutable', ['invalid', 'chip_cashtokens_invalid'], { sourceOutputs: [{ lockingBytecode: ['slot'], token: { nft: { commitment: '010203ff' } }, valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ token: { nft: { capability: 'mutable', commitment: '010203ff' } }, valueSatoshis: 1_000 }] } }],
    ['', '<1>', 'attempt to upgrade immutable token to minting', ['invalid', 'chip_cashtokens_invalid'], { sourceOutputs: [{ lockingBytecode: ['slot'], token: { nft: { commitment: '010203ff' } }, valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ token: { nft: { capability: 'minting', commitment: '010203ff' } }, valueSatoshis: 1_000 }] } }],
    [
      '',
      '<1>',
      'move multiple immutable tokens with different commitments',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { nft: { commitment: '01' } }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { nft: { commitment: '02' } }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { nft: { commitment: '03' } }, valueSatoshis: 10_000 },
        ],
        transaction: {
          inputs: [{ outpointIndex: 100, unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }, { unlockingBytecode: { script: 'unlockEmptyP2sh20' } }],
          outputs: [
            { token: { nft: { commitment: '03' } }, valueSatoshis: 1_000 },
            { token: { nft: { commitment: '02' } }, valueSatoshis: 1_000 },
            { token: { nft: { commitment: '01' } }, valueSatoshis: 1_000 },
          ],
        },
      },
    ],
    [
      '',
      '<1>',
      'move multiple immutable tokens with the same commitment',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { nft: { commitment: '01' } }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { nft: { commitment: '01' } }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { nft: { commitment: '01' } }, valueSatoshis: 10_000 },
        ],
        transaction: {
          inputs: [{ outpointIndex: 100, unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }, { unlockingBytecode: { script: 'unlockEmptyP2sh20' } }],
          outputs: [
            { token: { nft: { commitment: '01' } }, valueSatoshis: 1_000 },
            { token: { nft: { commitment: '01' } }, valueSatoshis: 1_000 },
            { token: { nft: { commitment: '01' } }, valueSatoshis: 1_000 },
          ],
        },
      },
    ],
    [
      '',
      '<1>',
      'move multiple immutable tokens with the same commitment (attempt to drop a commitment)',
      ['invalid', 'chip_cashtokens_invalid'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { nft: { commitment: '01' } }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { nft: { commitment: '01' } }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { nft: { commitment: '01' } }, valueSatoshis: 10_000 },
        ],
        transaction: {
          inputs: [{ outpointIndex: 100, unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }, { unlockingBytecode: { script: 'unlockEmptyP2sh20' } }],
          outputs: [
            { token: { nft: { commitment: '01' } }, valueSatoshis: 1_000 },
            { token: { nft: { commitment: '01' } }, valueSatoshis: 1_000 },
            { token: { nft: {} }, valueSatoshis: 1_000 },
          ],
        },
      },
    ],
    [
      '',
      '<1>',
      'move 2 immutable tokens, drop 1 of the same category',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { nft: { commitment: '040506' } }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { nft: { commitment: '050607' } }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { nft: { commitment: '060708' } }, valueSatoshis: 10_000 },
        ],
        transaction: {
          inputs: [{ outpointIndex: 100, unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }, { unlockingBytecode: { script: 'unlockEmptyP2sh20' } }],
          outputs: [{ token: { nft: { commitment: '040506' } }, valueSatoshis: 1_000 }, { token: { nft: { commitment: '060708' } }, valueSatoshis: 1_000 }, { valueSatoshis: 1_000 }],
        },
      },
    ],
    [
      '',
      '<1>',
      'move multiple immutable tokens of multiple categories',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { nft: { commitment: '01' } }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { commitment: '01' } }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { nft: { commitment: '02' } }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { nft: { commitment: '02' } }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { commitment: '02' } }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { commitment: '02' } }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { nft: { commitment: '03' } }, valueSatoshis: 10_000 },
        ],
        transaction: {
          inputs: [
            { outpointIndex: 100, unlockingBytecode: { script: 'unlockEmptyP2sh20' } },
            { unlockingBytecode: ['slot'] },
            { unlockingBytecode: { script: 'unlockEmptyP2sh20' } },
            { unlockingBytecode: { script: 'unlockEmptyP2sh20' } },
            { unlockingBytecode: { script: 'unlockEmptyP2sh20' } },
            { unlockingBytecode: { script: 'unlockEmptyP2sh20' } },
            { unlockingBytecode: { script: 'unlockEmptyP2sh20' } },
          ],
          outputs: [
            { token: { category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { commitment: '01' } }, valueSatoshis: 1_000 },
            { token: { nft: { commitment: '01' } }, valueSatoshis: 1_000 },
            { token: { category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { commitment: '02' } }, valueSatoshis: 1_000 },
            { token: { category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { commitment: '02' } }, valueSatoshis: 1_000 },
            { token: { nft: { commitment: '02' } }, valueSatoshis: 1_000 },
            { token: { nft: { commitment: '02' } }, valueSatoshis: 1_000 },
            { token: { nft: { commitment: '03' } }, valueSatoshis: 1_000 },
          ],
        },
      },
    ],
    [
      '',
      '<1>',
      'move multiple immutable tokens of multiple categories (attempt to swap categories for duplicate commitments)',
      ['invalid', 'chip_cashtokens_invalid'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { nft: { commitment: '01' } }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { commitment: '01' } }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { nft: { commitment: '02' } }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { nft: { commitment: '02' } }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { commitment: '02' } }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { commitment: '02' } }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { nft: { commitment: '03' } }, valueSatoshis: 10_000 },
        ],
        transaction: {
          inputs: [
            { outpointIndex: 100, unlockingBytecode: { script: 'unlockEmptyP2sh20' } },
            { unlockingBytecode: ['slot'] },
            { unlockingBytecode: { script: 'unlockEmptyP2sh20' } },
            { unlockingBytecode: { script: 'unlockEmptyP2sh20' } },
            { unlockingBytecode: { script: 'unlockEmptyP2sh20' } },
            { unlockingBytecode: { script: 'unlockEmptyP2sh20' } },
            { unlockingBytecode: { script: 'unlockEmptyP2sh20' } },
          ],
          outputs: [
            { token: { category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { commitment: '01' } }, valueSatoshis: 1_000 },
            { token: { nft: { commitment: '01' } }, valueSatoshis: 1_000 },
            { token: { category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { commitment: '02' } }, valueSatoshis: 1_000 },
            { token: { nft: { commitment: '02' } }, valueSatoshis: 1_000 },
            { token: { nft: { commitment: '02' } }, valueSatoshis: 1_000 },
            { token: { nft: { commitment: '02' } }, valueSatoshis: 1_000 },
            { token: { nft: { commitment: '03' } }, valueSatoshis: 1_000 },
          ],
        },
      },
    ],
    [
      '',
      '<1>',
      'move multiple immutable tokens of multiple categories (attempt to swap commitments across categories)',
      ['invalid', 'chip_cashtokens_invalid'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { nft: { commitment: '01' } }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { commitment: '01' } }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { nft: { commitment: '02' } }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { nft: { commitment: '02' } }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { commitment: '02' } }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { commitment: '02' } }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { nft: { commitment: '03' } }, valueSatoshis: 10_000 },
        ],
        transaction: {
          inputs: [
            { outpointIndex: 100, unlockingBytecode: { script: 'unlockEmptyP2sh20' } },
            { unlockingBytecode: ['slot'] },
            { unlockingBytecode: { script: 'unlockEmptyP2sh20' } },
            { unlockingBytecode: { script: 'unlockEmptyP2sh20' } },
            { unlockingBytecode: { script: 'unlockEmptyP2sh20' } },
            { unlockingBytecode: { script: 'unlockEmptyP2sh20' } },
            { unlockingBytecode: { script: 'unlockEmptyP2sh20' } },
          ],
          outputs: [
            { token: { category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { commitment: '03' } }, valueSatoshis: 1_000 },
            { token: { nft: { commitment: '01' } }, valueSatoshis: 1_000 },
            { token: { category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { commitment: '02' } }, valueSatoshis: 1_000 },
            { token: { category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { commitment: '02' } }, valueSatoshis: 1_000 },
            { token: { nft: { commitment: '02' } }, valueSatoshis: 1_000 },
            { token: { nft: { commitment: '02' } }, valueSatoshis: 1_000 },
            { token: { nft: { commitment: '01' } }, valueSatoshis: 1_000 },
          ],
        },
      },
    ],
    // OP_UTXOTOKENCATEGORY
    [
      '<0>',
      'OP_UTXOTOKENCATEGORY <0x2200000000000000000000000000000000000000000000000000000000000022> OP_EQUAL',
      'OP_UTXOTOKENCATEGORY accepts an index and returns the category and capability (palindrome category to test without endianness)',
      ['invalid', 'chip_cashtokens'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], token: { category: '2200000000000000000000000000000000000000000000000000000000000022', nft: {} }, valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] } },
    ],
    [
      '<0>',
      'OP_UTXOTOKENCATEGORY <0x0200000000000000000000000000000000000000000000000000000000000000> OP_EQUAL',
      'OP_UTXOTOKENCATEGORY accepts an index and returns the category and capability (expect correct endianness)',
      ['invalid', 'chip_cashtokens'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], token: { nft: {} }, valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] } },
    ],
    [
      '<0> <0>',
      'OP_OUTPOINTTXHASH <0x0200000000000000000000000000000000000000000000000000000000000000> OP_DUP OP_TOALTSTACK OP_EQUALVERIFY OP_UTXOTOKENCATEGORY OP_FROMALTSTACK OP_EQUAL',
      'OP_UTXOTOKENCATEGORY endianness matches OP_OUTPOINTTXHASH',
      ['invalid', 'chip_cashtokens'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], token: { nft: {} }, valueSatoshis: 10_000 }], transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] } },
    ],
    ['', 'OP_UTXOTOKENCATEGORY <0x0200000000000000000000000000000000000000000000000000000000000000> OP_EQUAL', 'OP_UTXOTOKENCATEGORY requires an index from the stack', ['invalid', 'chip_cashtokens_invalid'], { sourceOutputs: [{ lockingBytecode: ['slot'], token: { nft: {} }, valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] } }],
    [
      '<0x80>',
      'OP_UTXOTOKENCATEGORY <0x0200000000000000000000000000000000000000000000000000000000000000> OP_EQUAL',
      'OP_UTXOTOKENCATEGORY requires a minimally-encoded index from the stack (attempt negative zero)',
      ['invalid', 'chip_cashtokens_invalid'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], token: { nft: {} }, valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] } },
    ],
    [
      '<1>',
      'OP_UTXOTOKENCATEGORY <0x0200000000000000000000000000000000000000000000000000000000000000> OP_EQUAL',
      'OP_UTXOTOKENCATEGORY (at index 1)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { nft: {} }, valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<-1>',
      'OP_UTXOTOKENCATEGORY <0x0200000000000000000000000000000000000000000000000000000000000000> OP_EQUAL',
      'OP_UTXOTOKENCATEGORY requires a positive index from the stack (attempt negative one)',
      ['invalid', 'chip_cashtokens_invalid'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { nft: {} }, valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<2>',
      'OP_UTXOTOKENCATEGORY <0x0200000000000000000000000000000000000000000000000000000000000000> OP_EQUAL',
      'OP_UTXOTOKENCATEGORY (excessive index)',
      ['invalid', 'chip_cashtokens_invalid'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { nft: {} }, valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] },
      },
    ],
    ['<0>', 'OP_UTXOTOKENCATEGORY <0> OP_EQUAL', 'OP_UTXOTOKENCATEGORY (transaction without tokens)', ['invalid', 'chip_cashtokens', 'nop2sh_invalid'], { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] } }],
    [
      '<0>',
      'OP_UTXOTOKENCATEGORY <0> OP_EQUAL',
      'OP_UTXOTOKENCATEGORY (at index without tokens)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { nft: {} }, valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<0>',
      'OP_UTXOTOKENCATEGORY <0x0200000000000000000000000000000000000000000000000000000000000000> OP_EQUAL',
      'OP_UTXOTOKENCATEGORY (expect category at index without tokens)',
      ['invalid', 'chip_cashtokens_invalid'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { nft: {} }, valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<1> <0>',
      'OP_UTXOTOKENCATEGORY <0> OP_EQUALVERIFY OP_UTXOTOKENCATEGORY <0x0200000000000000000000000000000000000000000000000000000000000000> OP_EQUAL',
      'OP_UTXOTOKENCATEGORY (at two indexes)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { nft: {} }, valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<0> <1>',
      'OP_UTXOTOKENCATEGORY <0> OP_EQUALVERIFY OP_UTXOTOKENCATEGORY <0x0200000000000000000000000000000000000000000000000000000000000000> OP_EQUAL',
      'OP_UTXOTOKENCATEGORY (at two indexes, expect swapped)',
      ['invalid', 'chip_cashtokens_invalid'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { nft: {} }, valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] },
      },
    ],
    ['<0>', 'OP_UTXOTOKENCATEGORY <0x0200000000000000000000000000000000000000000000000000000000000000> OP_EQUAL', 'OP_UTXOTOKENCATEGORY (only fungible tokens, index 0)', ['invalid', 'chip_cashtokens'], { sourceOutputs: [{ lockingBytecode: ['slot'], token: { amount: 100 }, valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] } }],
    ['<0>', 'OP_UTXOTOKENCATEGORY <0> OP_EQUAL', 'OP_UTXOTOKENCATEGORY (only fungible tokens, index 0, expect none)', ['invalid', 'chip_cashtokens_invalid'], { sourceOutputs: [{ lockingBytecode: ['slot'], token: { amount: 100 }, valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] } }],
    [
      '<1>',
      'OP_UTXOTOKENCATEGORY <0x0200000000000000000000000000000000000000000000000000000000000000> OP_EQUAL',
      'OP_UTXOTOKENCATEGORY (only fungible tokens, index 1)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { amount: 1 }, valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<1>',
      'OP_UTXOTOKENCATEGORY <0x0300000000000000000000000000000000000000000000000000000000000000> OP_EQUAL',
      'OP_UTXOTOKENCATEGORY (only fungible tokens, index 1, category 0x00...03)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { amount: 1, category: '0000000000000000000000000000000000000000000000000000000000000003' }, valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<0>',
      'OP_UTXOTOKENCATEGORY <0x0200000000000000000000000000000000000000000000000000000000000000> OP_EQUAL',
      'OP_UTXOTOKENCATEGORY (immutable and fungible tokens, index 0)',
      ['invalid', 'chip_cashtokens'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], token: { amount: 100, nft: {} }, valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] } },
    ],
    ['<0>', 'OP_UTXOTOKENCATEGORY <0> OP_EQUAL', 'OP_UTXOTOKENCATEGORY (immutable and fungible tokens, index 0, expect none)', ['invalid', 'chip_cashtokens_invalid'], { sourceOutputs: [{ lockingBytecode: ['slot'], token: { amount: 100, nft: {} }, valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] } }],
    [
      '<1>',
      'OP_UTXOTOKENCATEGORY <0x0200000000000000000000000000000000000000000000000000000000000000> OP_EQUAL',
      'OP_UTXOTOKENCATEGORY (immutable and fungible tokens, index 1)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { amount: 1, nft: {} }, valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<1>',
      'OP_UTXOTOKENCATEGORY <0x0300000000000000000000000000000000000000000000000000000000000000> OP_EQUAL',
      'OP_UTXOTOKENCATEGORY (immutable and fungible tokens, index 1, category 0x00...03)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { amount: 1, category: '0000000000000000000000000000000000000000000000000000000000000003', nft: {} }, valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<0>',
      'OP_UTXOTOKENCATEGORY <0x020000000000000000000000000000000000000000000000000000000000000001> OP_EQUAL',
      'OP_UTXOTOKENCATEGORY (only mutable token, index 0)',
      ['invalid', 'chip_cashtokens'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], token: { nft: { capability: 'mutable' } }, valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] } },
    ],
    [
      '<0>',
      'OP_UTXOTOKENCATEGORY <0x0200000000000000000000000000000000000000000000000000000000000000> OP_EQUAL',
      'OP_UTXOTOKENCATEGORY (only mutable token, index 0, expect no capability)',
      ['invalid', 'chip_cashtokens_invalid'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], token: { nft: { capability: 'mutable' } }, valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] } },
    ],
    [
      '<1>',
      'OP_UTXOTOKENCATEGORY <0x020000000000000000000000000000000000000000000000000000000000000001> OP_EQUAL',
      'OP_UTXOTOKENCATEGORY (only mutable token, index 1)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { nft: { capability: 'mutable' } }, valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<1>',
      'OP_UTXOTOKENCATEGORY <0x03000000000000000000000000000000000000000000000000000000000000001> OP_EQUAL',
      'OP_UTXOTOKENCATEGORY (only mutable token, index 1, category 0x00...03)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { capability: 'mutable' } }, valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<0>',
      'OP_UTXOTOKENCATEGORY <0x020000000000000000000000000000000000000000000000000000000000000001> OP_EQUAL',
      'OP_UTXOTOKENCATEGORY (mutable and fungible tokens, index 0)',
      ['invalid', 'chip_cashtokens'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], token: { amount: 100, nft: { capability: 'mutable' } }, valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] } },
    ],
    ['<0>', 'OP_UTXOTOKENCATEGORY <0> OP_EQUAL', 'OP_UTXOTOKENCATEGORY (mutable and fungible tokens, index 0, expect none)', ['invalid', 'chip_cashtokens_invalid'], { sourceOutputs: [{ lockingBytecode: ['slot'], token: { amount: 100, nft: { capability: 'mutable' } }, valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] } }],
    [
      '<1>',
      'OP_UTXOTOKENCATEGORY <0x020000000000000000000000000000000000000000000000000000000000000001> OP_EQUAL',
      'OP_UTXOTOKENCATEGORY (mutable and fungible tokens, index 1)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { amount: 1, nft: { capability: 'mutable' } }, valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<1>',
      'OP_UTXOTOKENCATEGORY <0x030000000000000000000000000000000000000000000000000000000000000001> OP_EQUAL',
      'OP_UTXOTOKENCATEGORY (mutable and fungible tokens, index 1, category 0x00...03)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { amount: 1, category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { capability: 'mutable' } }, valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<0>',
      'OP_UTXOTOKENCATEGORY <0x020000000000000000000000000000000000000000000000000000000000000002> OP_EQUAL',
      'OP_UTXOTOKENCATEGORY (only minting token, index 0)',
      ['invalid', 'chip_cashtokens'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], token: { nft: { capability: 'minting' } }, valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] } },
    ],
    [
      '<0>',
      'OP_UTXOTOKENCATEGORY <0x020000000000000000000000000000000000000000000000000000000000000001> OP_EQUAL',
      'OP_UTXOTOKENCATEGORY (only minting token, index 0, expect mutable capability)',
      ['invalid', 'chip_cashtokens_invalid'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], token: { nft: { capability: 'minting' } }, valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] } },
    ],
    [
      '<1>',
      'OP_UTXOTOKENCATEGORY <0x020000000000000000000000000000000000000000000000000000000000000002> OP_EQUAL',
      'OP_UTXOTOKENCATEGORY (only minting token, index 1)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { nft: { capability: 'minting' } }, valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<1>',
      'OP_UTXOTOKENCATEGORY <0x03000000000000000000000000000000000000000000000000000000000000002> OP_EQUAL',
      'OP_UTXOTOKENCATEGORY (only minting token, index 1, category 0x00...03)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { capability: 'minting' } }, valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<0>',
      'OP_UTXOTOKENCATEGORY <0x020000000000000000000000000000000000000000000000000000000000000002> OP_EQUAL',
      'OP_UTXOTOKENCATEGORY (minting and fungible tokens, index 0)',
      ['invalid', 'chip_cashtokens'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], token: { amount: 100, nft: { capability: 'minting' } }, valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] } },
    ],
    ['<0>', 'OP_UTXOTOKENCATEGORY <0> OP_EQUAL', 'OP_UTXOTOKENCATEGORY (minting and fungible tokens, index 0, expect none)', ['invalid', 'chip_cashtokens_invalid'], { sourceOutputs: [{ lockingBytecode: ['slot'], token: { amount: 100, nft: { capability: 'minting' } }, valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] } }],
    [
      '<1>',
      'OP_UTXOTOKENCATEGORY <0x020000000000000000000000000000000000000000000000000000000000000002> OP_EQUAL',
      'OP_UTXOTOKENCATEGORY (minting and fungible tokens, index 1)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { amount: 1, nft: { capability: 'minting' } }, valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<1>',
      'OP_UTXOTOKENCATEGORY <0x030000000000000000000000000000000000000000000000000000000000000002> OP_EQUAL',
      'OP_UTXOTOKENCATEGORY (minting and fungible tokens, index 1, category 0x00...03)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { amount: 1, category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { capability: 'minting' } }, valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] },
      },
    ],
    ['<0>', 'OP_UTXOTOKENCATEGORY OP_SIZE <32> OP_EQUAL OP_NIP', 'OP_UTXOTOKENCATEGORY (immutable result length is 32)', ['invalid', 'chip_cashtokens'], { sourceOutputs: [{ lockingBytecode: ['slot'], token: { nft: {} }, valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] } }],
    ['<0>', 'OP_UTXOTOKENCATEGORY OP_SIZE <33> OP_EQUAL OP_NIP', 'OP_UTXOTOKENCATEGORY (immutable result length is 32, expect 33)', ['invalid', 'chip_cashtokens_invalid'], { sourceOutputs: [{ lockingBytecode: ['slot'], token: { nft: {} }, valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] } }],
    ['<0>', 'OP_UTXOTOKENCATEGORY OP_SIZE <33> OP_EQUAL OP_NIP', 'OP_UTXOTOKENCATEGORY (mutable result length is 33)', ['invalid', 'chip_cashtokens'], { sourceOutputs: [{ lockingBytecode: ['slot'], token: { nft: { capability: 'mutable' } }, valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] } }],
    ['<0>', 'OP_UTXOTOKENCATEGORY OP_SIZE <32> OP_EQUAL OP_NIP', 'OP_UTXOTOKENCATEGORY (mutable result length is 33, expect 32)', ['invalid', 'chip_cashtokens_invalid'], { sourceOutputs: [{ lockingBytecode: ['slot'], token: { nft: { capability: 'mutable' } }, valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] } }],
    ['<0>', 'OP_UTXOTOKENCATEGORY OP_SIZE <33> OP_EQUAL OP_NIP', 'OP_UTXOTOKENCATEGORY (minting result length is 33)', ['invalid', 'chip_cashtokens'], { sourceOutputs: [{ lockingBytecode: ['slot'], token: { nft: { capability: 'minting' } }, valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] } }],
    ['<0>', 'OP_UTXOTOKENCATEGORY OP_SIZE <32> OP_EQUAL OP_NIP', 'OP_UTXOTOKENCATEGORY (minting result length is 33, expect 32)', ['invalid', 'chip_cashtokens_invalid'], { sourceOutputs: [{ lockingBytecode: ['slot'], token: { nft: { capability: 'minting' } }, valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] } }],
    [
      '<6> <5> <4> <3> <2> <0> <1>',
      'OP_UTXOTOKENCATEGORY <0x0300000000000000000000000000000000000000000000000000000000000000> OP_EQUALVERIFY OP_UTXOTOKENCATEGORY <0> OP_EQUALVERIFY OP_UTXOTOKENCATEGORY <0x0400000000000000000000000000000000000000000000000000000000000000> OP_EQUALVERIFY OP_UTXOTOKENCATEGORY <0x0500000000000000000000000000000000000000000000000000000000000000> OP_EQUALVERIFY OP_UTXOTOKENCATEGORY <0x060000000000000000000000000000000000000000000000000000000000000001> OP_EQUALVERIFY OP_UTXOTOKENCATEGORY <0x070000000000000000000000000000000000000000000000000000000000000002> OP_EQUALVERIFY OP_UTXOTOKENCATEGORY <0x080000000000000000000000000000000000000000000000000000000000000002> OP_EQUAL',
      'OP_UTXOTOKENCATEGORY (at multiple indexes, unordered)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { category: '0000000000000000000000000000000000000000000000000000000000000003', nft: {} }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: '1', category: '0000000000000000000000000000000000000000000000000000000000000004' }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: '1', category: '0000000000000000000000000000000000000000000000000000000000000005', nft: {} }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: '1', category: '0000000000000000000000000000000000000000000000000000000000000006', nft: { capability: 'mutable' } }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: '1', category: '0000000000000000000000000000000000000000000000000000000000000007', nft: { capability: 'minting' } }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { category: '0000000000000000000000000000000000000000000000000000000000000008', nft: { capability: 'minting' } }, valueSatoshis: 10_000 },
        ],
        transaction: {
          inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }, { unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: { script: 'unlockEmptyP2sh20' } }],
          outputs: [{ valueSatoshis: 1_000 }],
        },
      },
    ],
    [
      '<6> <5> <4> <3> <2> <0> <1>',
      'OP_UTXOTOKENCATEGORY <0x0300000000000000000000000000000000000000000000000000000000000000> OP_EQUALVERIFY OP_UTXOTOKENCATEGORY <0> OP_EQUALVERIFY OP_UTXOTOKENCATEGORY <0x0400000000000000000000000000000000000000000000000000000000000000> OP_EQUALVERIFY OP_UTXOTOKENCATEGORY <0x0500000000000000000000000000000000000000000000000000000000000000> OP_EQUALVERIFY OP_UTXOTOKENCATEGORY <0x060000000000000000000000000000000000000000000000000000000000000001> OP_EQUALVERIFY OP_UTXOTOKENCATEGORY <0x070000000000000000000000000000000000000000000000000000000000000002> OP_EQUALVERIFY OP_UTXOTOKENCATEGORY <0x0800000000000000000000000000000000000000000000000000000000000000> OP_EQUAL',
      'OP_UTXOTOKENCATEGORY (at multiple indexes, unordered, expect missing capability)',
      ['invalid', 'chip_cashtokens_invalid'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { category: '0000000000000000000000000000000000000000000000000000000000000003', nft: {} }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: '1', category: '0000000000000000000000000000000000000000000000000000000000000004' }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: '1', category: '0000000000000000000000000000000000000000000000000000000000000005', nft: {} }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: '1', category: '0000000000000000000000000000000000000000000000000000000000000006', nft: { capability: 'mutable' } }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: '1', category: '0000000000000000000000000000000000000000000000000000000000000007', nft: { capability: 'minting' } }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { category: '0000000000000000000000000000000000000000000000000000000000000008', nft: { capability: 'minting' } }, valueSatoshis: 10_000 },
        ],
        transaction: {
          inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }, { unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: { script: 'unlockEmptyP2sh20' } }],
          outputs: [{ valueSatoshis: 1_000 }],
        },
      },
    ],
    // OP_OUTPUTTOKENCATEGORY
    [
      '<0>',
      'OP_OUTPUTTOKENCATEGORY <0x2200000000000000000000000000000000000000000000000000000000000022> OP_EQUAL',
      'OP_OUTPUTTOKENCATEGORY accepts an index and returns the category and capability (palindrome category to test without endianness)',
      ['invalid', 'chip_cashtokens'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ outpointTransactionHash: '2200000000000000000000000000000000000000000000000000000000000022', unlockingBytecode: ['slot'] }], outputs: [{ token: { category: '2200000000000000000000000000000000000000000000000000000000000022', nft: {} }, valueSatoshis: 1_000 }] } },
    ],
    [
      '<0>',
      'OP_OUTPUTTOKENCATEGORY <0x0200000000000000000000000000000000000000000000000000000000000000> OP_EQUAL',
      'OP_OUTPUTTOKENCATEGORY accepts an index and returns the category and capability (expect correct endianness)',
      ['invalid', 'chip_cashtokens'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ token: { nft: {} }, valueSatoshis: 1_000 }] } },
    ],
    [
      '<0> <0>',
      'OP_OUTPOINTTXHASH <0x0200000000000000000000000000000000000000000000000000000000000000> OP_DUP OP_TOALTSTACK OP_EQUALVERIFY OP_OUTPUTTOKENCATEGORY OP_FROMALTSTACK OP_EQUAL',
      'OP_OUTPUTTOKENCATEGORY endianness matches OP_OUTPOINTTXHASH (in a genesis transaction)',
      ['invalid', 'chip_cashtokens'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ token: { nft: {} }, valueSatoshis: 1_000 }] } },
    ],
    [
      '',
      'OP_OUTPUTTOKENCATEGORY <0x0200000000000000000000000000000000000000000000000000000000000000> OP_EQUAL',
      'OP_OUTPUTTOKENCATEGORY requires an index from the stack',
      ['invalid', '2022_p2sh32_nonstandard', 'chip_cashtokens_invalid'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ token: { nft: {} }, valueSatoshis: 1_000 }] } },
    ],
    [
      '<0x80>',
      'OP_OUTPUTTOKENCATEGORY <0x0200000000000000000000000000000000000000000000000000000000000000> OP_EQUAL',
      'OP_OUTPUTTOKENCATEGORY requires a minimally-encoded index from the stack (attempt negative zero)',
      ['invalid', 'chip_cashtokens_invalid'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ token: { nft: {} }, valueSatoshis: 1_000 }] } },
    ],
    [
      '<1>',
      'OP_OUTPUTTOKENCATEGORY <0x0200000000000000000000000000000000000000000000000000000000000000> OP_EQUAL',
      'OP_OUTPUTTOKENCATEGORY (at index 1)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }],
        transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }, { token: { nft: {} }, valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<-1>',
      'OP_OUTPUTTOKENCATEGORY <0x0200000000000000000000000000000000000000000000000000000000000000> OP_EQUAL',
      'OP_OUTPUTTOKENCATEGORY requires a positive index from the stack (attempt negative one)',
      ['invalid', 'chip_cashtokens_invalid'],
      {
        sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }],
        transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }, { token: { nft: {} }, valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<2>',
      'OP_OUTPUTTOKENCATEGORY <0x0200000000000000000000000000000000000000000000000000000000000000> OP_EQUAL',
      'OP_OUTPUTTOKENCATEGORY (excessive index)',
      ['invalid', 'chip_cashtokens_invalid'],
      {
        sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }],
        transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }, { token: { nft: {} }, valueSatoshis: 1_000 }] },
      },
    ],
    ['<0>', 'OP_OUTPUTTOKENCATEGORY <0> OP_EQUAL', 'OP_OUTPUTTOKENCATEGORY (transaction without tokens)', ['invalid', 'chip_cashtokens', 'nop2sh_invalid'], { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] } }],
    [
      '<0>',
      'OP_OUTPUTTOKENCATEGORY <0> OP_EQUAL',
      'OP_OUTPUTTOKENCATEGORY (at index without tokens)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }],
        transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }, { token: { nft: {} }, valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<0>',
      'OP_OUTPUTTOKENCATEGORY <0x0200000000000000000000000000000000000000000000000000000000000000> OP_EQUAL',
      'OP_OUTPUTTOKENCATEGORY (expect category at index without tokens)',
      ['invalid', 'chip_cashtokens_invalid'],
      {
        sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }],
        transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }, { token: { nft: {} }, valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<1>',
      'OP_OUTPUTTOKENCATEGORY <0x0200000000000000000000000000000000000000000000000000000000000000> OP_EQUAL',
      'OP_OUTPUTTOKENCATEGORY (non-genesis transaction, index 1)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { nft: {} }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }, { token: { nft: {} }, valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<0>',
      'OP_OUTPUTTOKENCATEGORY <0> OP_EQUAL',
      'OP_OUTPUTTOKENCATEGORY (non-genesis transaction, at index without tokens)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { nft: {} }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }, { token: { nft: {} }, valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<0>',
      'OP_OUTPUTTOKENCATEGORY <0x0200000000000000000000000000000000000000000000000000000000000000> OP_EQUAL',
      'OP_OUTPUTTOKENCATEGORY (non-genesis transaction, expect category at index without tokens)',
      ['invalid', 'chip_cashtokens_invalid'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { nft: {} }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }, { token: { nft: {} }, valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<1> <0>',
      'OP_OUTPUTTOKENCATEGORY <0> OP_EQUALVERIFY OP_OUTPUTTOKENCATEGORY <0x0200000000000000000000000000000000000000000000000000000000000000> OP_EQUAL',
      'OP_OUTPUTTOKENCATEGORY (at two indexes)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }],
        transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }, { token: { nft: {} }, valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<0> <1>',
      'OP_OUTPUTTOKENCATEGORY <0> OP_EQUALVERIFY OP_OUTPUTTOKENCATEGORY <0x0200000000000000000000000000000000000000000000000000000000000000> OP_EQUAL',
      'OP_OUTPUTTOKENCATEGORY (at two indexes, expect swapped)',
      ['invalid', 'chip_cashtokens_invalid'],
      {
        sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }],
        transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }, { token: { nft: {} }, valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<1> <0>',
      'OP_OUTPUTTOKENCATEGORY <0> OP_EQUALVERIFY OP_OUTPUTTOKENCATEGORY <0x0200000000000000000000000000000000000000000000000000000000000000> OP_EQUAL',
      'OP_OUTPUTTOKENCATEGORY (non-genesis transaction, at two indexes)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { nft: {} }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }, { token: { nft: {} }, valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<0> <1>',
      'OP_OUTPUTTOKENCATEGORY <0> OP_EQUALVERIFY OP_OUTPUTTOKENCATEGORY <0x0200000000000000000000000000000000000000000000000000000000000000> OP_EQUAL',
      'OP_OUTPUTTOKENCATEGORY (non-genesis transaction, at two indexes, expect swapped)',
      ['invalid', 'chip_cashtokens_invalid'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { nft: {} }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }, { token: { nft: {} }, valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<0>',
      'OP_OUTPUTTOKENCATEGORY <0x0200000000000000000000000000000000000000000000000000000000000000> OP_EQUAL',
      'OP_OUTPUTTOKENCATEGORY (only fungible tokens, index 0)',
      ['invalid', 'chip_cashtokens'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ token: { amount: 100 }, valueSatoshis: 1_000 }] } },
    ],
    [
      '<0>',
      'OP_OUTPUTTOKENCATEGORY <0> OP_EQUAL',
      'OP_OUTPUTTOKENCATEGORY (only fungible tokens, index 0, expect none)',
      ['invalid', 'chip_cashtokens_invalid'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ token: { amount: 100 }, valueSatoshis: 1_000 }] } },
    ],
    [
      '<1>',
      'OP_OUTPUTTOKENCATEGORY <0x0200000000000000000000000000000000000000000000000000000000000000> OP_EQUAL',
      'OP_OUTPUTTOKENCATEGORY (non-genesis transaction, only fungible tokens, index 1)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: 1 }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }, { token: { amount: 1 }, valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<1>',
      'OP_OUTPUTTOKENCATEGORY <0x0300000000000000000000000000000000000000000000000000000000000000> OP_EQUAL',
      'OP_OUTPUTTOKENCATEGORY (non-genesis transaction, only fungible tokens, index 1, category 0x00...03)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: 1, category: '0000000000000000000000000000000000000000000000000000000000000003' }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }, { token: { amount: 1, category: '0000000000000000000000000000000000000000000000000000000000000003' }, valueSatoshis: 1_000 }] },
      },
    ],

    [
      '<0>',
      'OP_OUTPUTTOKENCATEGORY <0x0200000000000000000000000000000000000000000000000000000000000000> OP_EQUAL',
      'OP_OUTPUTTOKENCATEGORY (immutable and fungible tokens, index 0)',
      ['invalid', 'chip_cashtokens'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ token: { amount: 100, nft: {} }, valueSatoshis: 1_000 }] } },
    ],
    [
      '<0>',
      'OP_OUTPUTTOKENCATEGORY <0> OP_EQUAL',
      'OP_OUTPUTTOKENCATEGORY (immutable and fungible tokens, index 0, expect none)',
      ['invalid', 'chip_cashtokens_invalid'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ token: { amount: 100, nft: {} }, valueSatoshis: 1_000 }] } },
    ],
    [
      '<1>',
      'OP_OUTPUTTOKENCATEGORY <0x0200000000000000000000000000000000000000000000000000000000000000> OP_EQUAL',
      'OP_OUTPUTTOKENCATEGORY (non-genesis transaction, immutable and fungible tokens, index 1)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: 1, nft: {} }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }, { token: { amount: 1, nft: {} }, valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<1>',
      'OP_OUTPUTTOKENCATEGORY <0x0300000000000000000000000000000000000000000000000000000000000000> OP_EQUAL',
      'OP_OUTPUTTOKENCATEGORY (non-genesis transaction, immutable and fungible tokens, index 1, category 0x00...03)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: 1, category: '0000000000000000000000000000000000000000000000000000000000000003', nft: {} }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }, { token: { amount: 1, category: '0000000000000000000000000000000000000000000000000000000000000003', nft: {} }, valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<0>',
      'OP_OUTPUTTOKENCATEGORY <0x020000000000000000000000000000000000000000000000000000000000000001> OP_EQUAL',
      'OP_OUTPUTTOKENCATEGORY (only mutable token, index 0)',
      ['invalid', 'chip_cashtokens'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ token: { nft: { capability: 'mutable' } }, valueSatoshis: 1_000 }] } },
    ],
    [
      '<0>',
      'OP_OUTPUTTOKENCATEGORY <0x0200000000000000000000000000000000000000000000000000000000000000> OP_EQUAL',
      'OP_OUTPUTTOKENCATEGORY (only mutable token, index 0, expect no capability)',
      ['invalid', 'chip_cashtokens_invalid'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ token: { nft: { capability: 'mutable' } }, valueSatoshis: 1_000 }] } },
    ],
    [
      '<1>',
      'OP_OUTPUTTOKENCATEGORY <0x020000000000000000000000000000000000000000000000000000000000000001> OP_EQUAL',
      'OP_OUTPUTTOKENCATEGORY (non-genesis transaction, only mutable token, index 1)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { nft: { capability: 'mutable' } }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }, { token: { nft: { capability: 'mutable' } }, valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<1>',
      'OP_OUTPUTTOKENCATEGORY <0x030000000000000000000000000000000000000000000000000000000000000001> OP_EQUAL',
      'OP_OUTPUTTOKENCATEGORY (non-genesis transaction, only mutable token, index 1, category 0x00...03)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { capability: 'mutable' } }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }, { token: { category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { capability: 'mutable' } }, valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<0>',
      'OP_OUTPUTTOKENCATEGORY <0x020000000000000000000000000000000000000000000000000000000000000001> OP_EQUAL',
      'OP_OUTPUTTOKENCATEGORY (mutable and fungible tokens, index 0)',
      ['invalid', 'chip_cashtokens'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ token: { amount: 100, nft: { capability: 'mutable' } }, valueSatoshis: 1_000 }] } },
    ],
    [
      '<0>',
      'OP_OUTPUTTOKENCATEGORY <0> OP_EQUAL',
      'OP_OUTPUTTOKENCATEGORY (mutable and fungible tokens, index 0, expect none)',
      ['invalid', 'chip_cashtokens_invalid'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ token: { amount: 100, nft: { capability: 'mutable' } }, valueSatoshis: 1_000 }] } },
    ],
    [
      '<1>',
      'OP_OUTPUTTOKENCATEGORY <0x020000000000000000000000000000000000000000000000000000000000000001> OP_EQUAL',
      'OP_OUTPUTTOKENCATEGORY (non-genesis transaction, mutable and fungible tokens, index 1)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: 1, nft: { capability: 'mutable' } }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }, { token: { amount: 1, nft: { capability: 'mutable' } }, valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<1>',
      'OP_OUTPUTTOKENCATEGORY <0x030000000000000000000000000000000000000000000000000000000000000001> OP_EQUAL',
      'OP_OUTPUTTOKENCATEGORY (non-genesis transaction, mutable and fungible tokens, index 1, category 0x00...03)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: 1, category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { capability: 'mutable' } }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }, { token: { amount: 1, category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { capability: 'mutable' } }, valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<0>',
      'OP_OUTPUTTOKENCATEGORY <0x020000000000000000000000000000000000000000000000000000000000000002> OP_EQUAL',
      'OP_OUTPUTTOKENCATEGORY (only minting token, index 0)',
      ['invalid', 'chip_cashtokens'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ token: { nft: { capability: 'minting' } }, valueSatoshis: 1_000 }] } },
    ],
    [
      '<0>',
      'OP_OUTPUTTOKENCATEGORY <0x0200000000000000000000000000000000000000000000000000000000000000> OP_EQUAL',
      'OP_OUTPUTTOKENCATEGORY (only minting token, index 0, expect no capability)',
      ['invalid', 'chip_cashtokens_invalid'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ token: { nft: { capability: 'minting' } }, valueSatoshis: 1_000 }] } },
    ],
    [
      '<1>',
      'OP_OUTPUTTOKENCATEGORY <0x020000000000000000000000000000000000000000000000000000000000000002> OP_EQUAL',
      'OP_OUTPUTTOKENCATEGORY (non-genesis transaction, only minting token, index 1)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { nft: { capability: 'minting' } }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }, { token: { nft: { capability: 'minting' } }, valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<1>',
      'OP_OUTPUTTOKENCATEGORY <0x030000000000000000000000000000000000000000000000000000000000000002> OP_EQUAL',
      'OP_OUTPUTTOKENCATEGORY (non-genesis transaction, only minting token, index 1, category 0x00...03)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { capability: 'minting' } }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }, { token: { category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { capability: 'minting' } }, valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<0>',
      'OP_OUTPUTTOKENCATEGORY <0x020000000000000000000000000000000000000000000000000000000000000002> OP_EQUAL',
      'OP_OUTPUTTOKENCATEGORY (minting and fungible tokens, index 0)',
      ['invalid', 'chip_cashtokens'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ token: { amount: 100, nft: { capability: 'minting' } }, valueSatoshis: 1_000 }] } },
    ],
    [
      '<0>',
      'OP_OUTPUTTOKENCATEGORY <0> OP_EQUAL',
      'OP_OUTPUTTOKENCATEGORY (minting and fungible tokens, index 0, expect none)',
      ['invalid', 'chip_cashtokens_invalid'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ token: { amount: 100, nft: { capability: 'minting' } }, valueSatoshis: 1_000 }] } },
    ],
    [
      '<1>',
      'OP_OUTPUTTOKENCATEGORY <0x020000000000000000000000000000000000000000000000000000000000000002> OP_EQUAL',
      'OP_OUTPUTTOKENCATEGORY (non-genesis transaction, minting and fungible tokens, index 1)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: 1, nft: { capability: 'minting' } }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }, { token: { amount: 1, nft: { capability: 'minting' } }, valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<1>',
      'OP_OUTPUTTOKENCATEGORY <0x030000000000000000000000000000000000000000000000000000000000000002> OP_EQUAL',
      'OP_OUTPUTTOKENCATEGORY (non-genesis transaction, minting and fungible tokens, index 1, category 0x00...03)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: 1, category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { capability: 'minting' } }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }, { token: { amount: 1, category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { capability: 'minting' } }, valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<0>',
      'OP_OUTPUTTOKENCATEGORY OP_SIZE <32> OP_EQUAL OP_NIP',
      'OP_OUTPUTTOKENCATEGORY (immutable result length is 32)',
      ['invalid', 'chip_cashtokens'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ token: { nft: {} }, valueSatoshis: 1_000 }] } },
    ],
    [
      '<0>',
      'OP_OUTPUTTOKENCATEGORY OP_SIZE <33> OP_EQUAL OP_NIP',
      'OP_OUTPUTTOKENCATEGORY (immutable result length is 32, expect 33)',
      ['invalid', 'chip_cashtokens_invalid'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ token: { nft: {} }, valueSatoshis: 1_000 }] } },
    ],
    [
      '<0>',
      'OP_OUTPUTTOKENCATEGORY OP_SIZE <33> OP_EQUAL OP_NIP',
      'OP_OUTPUTTOKENCATEGORY (mutable result length is 33)',
      ['invalid', 'chip_cashtokens'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ token: { nft: { capability: 'mutable' } }, valueSatoshis: 1_000 }] } },
    ],
    [
      '<0>',
      'OP_OUTPUTTOKENCATEGORY OP_SIZE <32> OP_EQUAL OP_NIP',
      'OP_OUTPUTTOKENCATEGORY (mutable result length is 33, expect 32)',
      ['invalid', 'chip_cashtokens_invalid'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ token: { nft: { capability: 'mutable' } }, valueSatoshis: 1_000 }] } },
    ],
    [
      '<0>',
      'OP_OUTPUTTOKENCATEGORY OP_SIZE <33> OP_EQUAL OP_NIP',
      'OP_OUTPUTTOKENCATEGORY (minting result length is 33)',
      ['invalid', 'chip_cashtokens'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ token: { nft: { capability: 'minting' } }, valueSatoshis: 1_000 }] } },
    ],
    [
      '<0>',
      'OP_OUTPUTTOKENCATEGORY OP_SIZE <32> OP_EQUAL OP_NIP',
      'OP_OUTPUTTOKENCATEGORY (minting result length is 33, expect 32)',
      ['invalid', 'chip_cashtokens_invalid'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ token: { nft: { capability: 'minting' } }, valueSatoshis: 1_000 }] } },
    ],
    [
      '<6> <5> <4> <3> <2> <0> <1>',
      'OP_OUTPUTTOKENCATEGORY <0x0300000000000000000000000000000000000000000000000000000000000000> OP_EQUALVERIFY OP_OUTPUTTOKENCATEGORY <0> OP_EQUALVERIFY OP_OUTPUTTOKENCATEGORY <0x0400000000000000000000000000000000000000000000000000000000000000> OP_EQUALVERIFY OP_OUTPUTTOKENCATEGORY <0x0500000000000000000000000000000000000000000000000000000000000000> OP_EQUALVERIFY OP_OUTPUTTOKENCATEGORY <0x060000000000000000000000000000000000000000000000000000000000000001> OP_EQUALVERIFY OP_OUTPUTTOKENCATEGORY <0x070000000000000000000000000000000000000000000000000000000000000002> OP_EQUALVERIFY OP_OUTPUTTOKENCATEGORY <0x080000000000000000000000000000000000000000000000000000000000000002> OP_EQUAL',
      'OP_OUTPUTTOKENCATEGORY (at multiple indexes, unordered)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: '1', category: '0000000000000000000000000000000000000000000000000000000000000004' }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { category: '0000000000000000000000000000000000000000000000000000000000000003', nft: {} }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: '1', category: '0000000000000000000000000000000000000000000000000000000000000005', nft: {} }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: '1', category: '0000000000000000000000000000000000000000000000000000000000000007', nft: { capability: 'minting' } }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { category: '0000000000000000000000000000000000000000000000000000000000000008', nft: { capability: 'minting' } }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: '1', category: '0000000000000000000000000000000000000000000000000000000000000006', nft: { capability: 'mutable' } }, valueSatoshis: 10_000 },
        ],
        transaction: {
          inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }, { unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: { script: 'unlockEmptyP2sh20' } }],
          outputs: [
            { valueSatoshis: 1_000 },
            { token: { category: '0000000000000000000000000000000000000000000000000000000000000003', nft: {} }, valueSatoshis: 1_000 },
            { token: { amount: '1', category: '0000000000000000000000000000000000000000000000000000000000000004' }, valueSatoshis: 1_000 },
            { token: { amount: '1', category: '0000000000000000000000000000000000000000000000000000000000000005', nft: {} }, valueSatoshis: 1_000 },
            { token: { amount: '1', category: '0000000000000000000000000000000000000000000000000000000000000006', nft: { capability: 'mutable' } }, valueSatoshis: 1_000 },
            { token: { amount: '1', category: '0000000000000000000000000000000000000000000000000000000000000007', nft: { capability: 'minting' } }, valueSatoshis: 1_000 },
            { token: { category: '0000000000000000000000000000000000000000000000000000000000000008', nft: { capability: 'minting' } }, valueSatoshis: 1_000 },
          ],
        },
      },
    ],
    [
      '<6> <5> <4> <3> <2> <0> <1>',
      'OP_OUTPUTTOKENCATEGORY <0x0300000000000000000000000000000000000000000000000000000000000000> OP_EQUALVERIFY OP_OUTPUTTOKENCATEGORY <0> OP_EQUALVERIFY OP_OUTPUTTOKENCATEGORY <0x0400000000000000000000000000000000000000000000000000000000000000> OP_EQUALVERIFY OP_OUTPUTTOKENCATEGORY <0x0500000000000000000000000000000000000000000000000000000000000000> OP_EQUALVERIFY OP_OUTPUTTOKENCATEGORY <0x060000000000000000000000000000000000000000000000000000000000000001> OP_EQUALVERIFY OP_OUTPUTTOKENCATEGORY <0x070000000000000000000000000000000000000000000000000000000000000002> OP_EQUALVERIFY OP_OUTPUTTOKENCATEGORY <0x0800000000000000000000000000000000000000000000000000000000000000> OP_EQUAL',
      'OP_OUTPUTTOKENCATEGORY (at multiple indexes, unordered, expect missing capability)',
      ['invalid', 'chip_cashtokens_invalid'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: '1', category: '0000000000000000000000000000000000000000000000000000000000000004' }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { category: '0000000000000000000000000000000000000000000000000000000000000003', nft: {} }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: '1', category: '0000000000000000000000000000000000000000000000000000000000000005', nft: {} }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: '1', category: '0000000000000000000000000000000000000000000000000000000000000007', nft: { capability: 'minting' } }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { category: '0000000000000000000000000000000000000000000000000000000000000008', nft: { capability: 'minting' } }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: '1', category: '0000000000000000000000000000000000000000000000000000000000000006', nft: { capability: 'mutable' } }, valueSatoshis: 10_000 },
        ],
        transaction: {
          inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }, { unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: { script: 'unlockEmptyP2sh20' } }],
          outputs: [
            { valueSatoshis: 1_000 },
            { token: { category: '0000000000000000000000000000000000000000000000000000000000000003', nft: {} }, valueSatoshis: 1_000 },
            { token: { amount: '1', category: '0000000000000000000000000000000000000000000000000000000000000004' }, valueSatoshis: 1_000 },
            { token: { amount: '1', category: '0000000000000000000000000000000000000000000000000000000000000005', nft: {} }, valueSatoshis: 1_000 },
            { token: { amount: '1', category: '0000000000000000000000000000000000000000000000000000000000000006', nft: { capability: 'mutable' } }, valueSatoshis: 1_000 },
            { token: { amount: '1', category: '0000000000000000000000000000000000000000000000000000000000000007', nft: { capability: 'minting' } }, valueSatoshis: 1_000 },
            { token: { category: '0000000000000000000000000000000000000000000000000000000000000008', nft: { capability: 'minting' } }, valueSatoshis: 1_000 },
          ],
        },
      },
    ],
    // OP_UTXOTOKENCOMMITMENT
    ['<0>', 'OP_UTXOTOKENCOMMITMENT <0> OP_EQUAL', 'OP_UTXOTOKENCOMMITMENT accepts an index and returns the commitment (zero-length commitment)', ['invalid', 'chip_cashtokens', 'nop2sh_invalid'], { sourceOutputs: [{ lockingBytecode: ['slot'], token: { nft: {} }, valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] } }],
    ['<0>', 'OP_UTXOTOKENCOMMITMENT <0x00> OP_EQUAL', 'OP_UTXOTOKENCOMMITMENT accepts an index and returns the commitment (zero-length commitment, expect 0x00)', ['invalid', 'chip_cashtokens_invalid'], { sourceOutputs: [{ lockingBytecode: ['slot'], token: { nft: {} }, valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] } }],
    [
      '<0>',
      'OP_UTXOTOKENCOMMITMENT <1> OP_EQUAL',
      'OP_UTXOTOKENCOMMITMENT accepts an index and returns the commitment (1-byte commitment)',
      ['invalid', 'chip_cashtokens', 'nop2sh_invalid'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], token: { nft: { commitment: '01' } }, valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] } },
    ],
    ['', 'OP_UTXOTOKENCOMMITMENT <1> OP_EQUAL', 'OP_UTXOTOKENCOMMITMENT requires an index from the stack', ['invalid', 'chip_cashtokens_invalid'], { sourceOutputs: [{ lockingBytecode: ['slot'], token: { nft: { commitment: '01' } }, valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] } }],
    [
      '<0x80>',
      'OP_UTXOTOKENCOMMITMENT <1> OP_EQUAL',
      'OP_UTXOTOKENCOMMITMENT requires a minimally-encoded index from the stack (attempt negative zero)',
      ['invalid', 'chip_cashtokens_invalid'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], token: { nft: { commitment: '01' } }, valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] } },
    ],
    [
      '<0>',
      'OP_UTXOTOKENCOMMITMENT <0x01020304050607080900> OP_EQUAL',
      'OP_UTXOTOKENCOMMITMENT accepts an index and returns the commitment (10-byte commitment, tests endianness)',
      ['invalid', 'chip_cashtokens'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], token: { nft: { commitment: '01020304050607080900' } }, valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] } },
    ],
    [
      '<0>',
      'OP_UTXOTOKENCOMMITMENT <0x01020304050607080900010203040506070809000102030405060708090001020304050607080900> OP_EQUAL',
      'OP_UTXOTOKENCOMMITMENT accepts an index and returns the commitment (40-byte commitment)',
      ['invalid', 'chip_cashtokens'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], token: { nft: { commitment: '01020304050607080900010203040506070809000102030405060708090001020304050607080900' } }, valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] } },
    ],
    [
      '<0>',
      'OP_UTXOTOKENCOMMITMENT <0x0102030405060708090001020304050607080900010203040506070809000102030405060708090001> OP_EQUAL',
      'OP_UTXOTOKENCOMMITMENT accepts an index and returns the commitment (41-byte commitment: excessive length)',
      ['invalid', 'chip_cashtokens_invalid'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], token: { nft: { commitment: '0102030405060708090001020304050607080900010203040506070809000102030405060708090001' } }, valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] } },
    ],
    [
      '<0>',
      `OP_UTXOTOKENCOMMITMENT <0x${binToHex(Uint8Array.from(range(253)))}> OP_EQUAL`,
      'OP_UTXOTOKENCOMMITMENT accepts an index and returns the commitment (253-byte commitment: must be parsable by all implementations, but disabled by consensus)',
      ['invalid', 'chip_cashtokens_invalid'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], token: { nft: { commitment: binToHex(Uint8Array.from(range(253))) } }, valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] } },
    ],
    [
      '<1>',
      'OP_UTXOTOKENCOMMITMENT <0xff> OP_EQUAL',
      'OP_UTXOTOKENCOMMITMENT (at index 1)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { nft: { commitment: 'ff' } }, valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<-1>',
      'OP_UTXOTOKENCOMMITMENT <0xff> OP_EQUAL',
      'OP_UTXOTOKENCOMMITMENT requires a positive index from the stack (attempt negative one)',
      ['invalid', 'chip_cashtokens_invalid'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { nft: { commitment: 'ff' } }, valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<2>',
      'OP_UTXOTOKENCOMMITMENT <0xff> OP_EQUAL',
      'OP_UTXOTOKENCOMMITMENT (excessive index)',
      ['invalid', 'chip_cashtokens_invalid'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { nft: { commitment: 'ff' } }, valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] },
      },
    ],
    ['<0>', 'OP_UTXOTOKENCOMMITMENT <0> OP_EQUAL', 'OP_UTXOTOKENCOMMITMENT (transaction without tokens)', ['invalid', 'chip_cashtokens', 'nop2sh_invalid'], { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] } }],
    [
      '<0>',
      'OP_UTXOTOKENCOMMITMENT <0> OP_EQUAL',
      'OP_UTXOTOKENCOMMITMENT (at index without tokens)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { nft: { commitment: 'ff' } }, valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<0>',
      'OP_UTXOTOKENCOMMITMENT <0xff> OP_EQUAL',
      'OP_UTXOTOKENCOMMITMENT (expect commitment at index without tokens)',
      ['invalid', 'chip_cashtokens_invalid'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { nft: { commitment: 'ff' } }, valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<1> <0>',
      'OP_UTXOTOKENCOMMITMENT <0> OP_EQUALVERIFY OP_UTXOTOKENCOMMITMENT <0xff> OP_EQUAL',
      'OP_UTXOTOKENCOMMITMENT (at two indexes)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { nft: { commitment: 'ff' } }, valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<0> <1>',
      'OP_UTXOTOKENCOMMITMENT <0> OP_EQUALVERIFY OP_UTXOTOKENCOMMITMENT <0xff> OP_EQUAL',
      'OP_UTXOTOKENCOMMITMENT (at two indexes, expect swapped)',
      ['invalid', 'chip_cashtokens_invalid'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { nft: { commitment: 'ff' } }, valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] },
      },
    ],
    ['<0>', 'OP_UTXOTOKENCOMMITMENT <0> OP_EQUAL', 'OP_UTXOTOKENCOMMITMENT (only fungible tokens, index 0)', ['invalid', 'chip_cashtokens', 'nop2sh_invalid'], { sourceOutputs: [{ lockingBytecode: ['slot'], token: { amount: 100 }, valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] } }],
    [
      '<1>',
      'OP_UTXOTOKENCOMMITMENT <0> OP_EQUAL',
      'OP_UTXOTOKENCOMMITMENT (only fungible tokens, index 1)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { amount: 1 }, valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<1>',
      'OP_UTXOTOKENCOMMITMENT <0> OP_EQUAL',
      'OP_UTXOTOKENCOMMITMENT (only fungible tokens, index 1, category 0x00...03)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { amount: 1, category: '0000000000000000000000000000000000000000000000000000000000000003' }, valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] },
      },
    ],
    ['<0>', 'OP_UTXOTOKENCOMMITMENT <0xff> OP_EQUAL', 'OP_UTXOTOKENCOMMITMENT (immutable and fungible tokens, index 0)', ['invalid', 'chip_cashtokens'], { sourceOutputs: [{ lockingBytecode: ['slot'], token: { amount: 100, nft: { commitment: 'ff' } }, valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] } }],
    [
      '<0>',
      'OP_UTXOTOKENCOMMITMENT <0> OP_EQUAL',
      'OP_UTXOTOKENCOMMITMENT (immutable and fungible tokens, index 0, expect zero-length)',
      ['invalid', 'chip_cashtokens_invalid'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], token: { amount: 100, nft: { commitment: 'ff' } }, valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] } },
    ],
    [
      '<1>',
      'OP_UTXOTOKENCOMMITMENT <0xff> OP_EQUAL',
      'OP_UTXOTOKENCOMMITMENT (immutable and fungible tokens, index 1)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { amount: 1, nft: { commitment: 'ff' } }, valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<1>',
      'OP_UTXOTOKENCOMMITMENT <0xff> OP_EQUAL',
      'OP_UTXOTOKENCOMMITMENT (immutable and fungible tokens, index 1, category 0x00...03)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { amount: 1, category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { commitment: 'ff' } }, valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] },
      },
    ],
    ['<0>', 'OP_UTXOTOKENCOMMITMENT <0xee> OP_EQUAL', 'OP_UTXOTOKENCOMMITMENT (only mutable token, index 0)', ['invalid', 'chip_cashtokens'], { sourceOutputs: [{ lockingBytecode: ['slot'], token: { nft: { capability: 'mutable', commitment: 'ee' } }, valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] } }],
    [
      '<1>',
      'OP_UTXOTOKENCOMMITMENT <0xee> OP_EQUAL',
      'OP_UTXOTOKENCOMMITMENT (only mutable token, index 1)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { nft: { capability: 'mutable', commitment: 'ee' } }, valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<1>',
      'OP_UTXOTOKENCOMMITMENT <0xee> OP_EQUAL',
      'OP_UTXOTOKENCOMMITMENT (only mutable token, index 1, category 0x00...03)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { capability: 'mutable', commitment: 'ee' } }, valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] },
      },
    ],
    ['<0>', 'OP_UTXOTOKENCOMMITMENT <0xff> OP_EQUAL', 'OP_UTXOTOKENCOMMITMENT (mutable and fungible tokens, index 0)', ['invalid', 'chip_cashtokens'], { sourceOutputs: [{ lockingBytecode: ['slot'], token: { amount: 100, nft: { capability: 'mutable', commitment: 'ff' } }, valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] } }],
    [
      '<0>',
      'OP_UTXOTOKENCOMMITMENT <0> OP_EQUAL',
      'OP_UTXOTOKENCOMMITMENT (mutable and fungible tokens, index 0, expect zero-length)',
      ['invalid', 'chip_cashtokens_invalid'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], token: { amount: 100, nft: { capability: 'mutable', commitment: 'ff' } }, valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] } },
    ],
    [
      '<1>',
      'OP_UTXOTOKENCOMMITMENT <0xff> OP_EQUAL',
      'OP_UTXOTOKENCOMMITMENT (mutable and fungible tokens, index 1)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { amount: 1, nft: { capability: 'mutable', commitment: 'ff' } }, valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<1>',
      'OP_UTXOTOKENCOMMITMENT <0xff> OP_EQUAL',
      'OP_UTXOTOKENCOMMITMENT (mutable and fungible tokens, index 1, category 0x00...03)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { amount: 1, category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { capability: 'mutable', commitment: 'ff' } }, valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] },
      },
    ],
    ['<0>', 'OP_UTXOTOKENCOMMITMENT <0xee> OP_EQUAL', 'OP_UTXOTOKENCOMMITMENT (only minting token, index 0)', ['invalid', 'chip_cashtokens'], { sourceOutputs: [{ lockingBytecode: ['slot'], token: { nft: { capability: 'minting', commitment: 'ee' } }, valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] } }],
    [
      '<1>',
      'OP_UTXOTOKENCOMMITMENT <0xee> OP_EQUAL',
      'OP_UTXOTOKENCOMMITMENT (only minting token, index 1)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { nft: { capability: 'minting', commitment: 'ee' } }, valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<1>',
      'OP_UTXOTOKENCOMMITMENT <0xee> OP_EQUAL',
      'OP_UTXOTOKENCOMMITMENT (only minting token, index 1, category 0x00...03)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { capability: 'minting', commitment: 'ee' } }, valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] },
      },
    ],
    ['<0>', 'OP_UTXOTOKENCOMMITMENT <0xff> OP_EQUAL', 'OP_UTXOTOKENCOMMITMENT (minting and fungible tokens, index 0)', ['invalid', 'chip_cashtokens'], { sourceOutputs: [{ lockingBytecode: ['slot'], token: { amount: 100, nft: { capability: 'minting', commitment: 'ff' } }, valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] } }],
    [
      '<0>',
      'OP_UTXOTOKENCOMMITMENT <0> OP_EQUAL',
      'OP_UTXOTOKENCOMMITMENT (minting and fungible tokens, index 0, expect zero-length)',
      ['invalid', 'chip_cashtokens_invalid'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], token: { amount: 100, nft: { capability: 'minting', commitment: 'ff' } }, valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] } },
    ],
    [
      '<1>',
      'OP_UTXOTOKENCOMMITMENT <0xff> OP_EQUAL',
      'OP_UTXOTOKENCOMMITMENT (minting and fungible tokens, index 1)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { amount: 1, nft: { capability: 'minting', commitment: 'ff' } }, valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<1>',
      'OP_UTXOTOKENCOMMITMENT <0xff> OP_EQUAL',
      'OP_UTXOTOKENCOMMITMENT (minting and fungible tokens, index 1, category 0x00...03)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { amount: 1, category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { capability: 'minting', commitment: 'ff' } }, valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<6> <5> <4> <3> <2> <0> <1>',
      'OP_UTXOTOKENCOMMITMENT <0> OP_EQUALVERIFY OP_UTXOTOKENCOMMITMENT <0> OP_EQUALVERIFY OP_UTXOTOKENCOMMITMENT <0> OP_EQUALVERIFY OP_UTXOTOKENCOMMITMENT <1> OP_EQUALVERIFY OP_UTXOTOKENCOMMITMENT <0x0102> OP_EQUALVERIFY OP_UTXOTOKENCOMMITMENT <0x010203> OP_EQUALVERIFY OP_UTXOTOKENCOMMITMENT <0x01020304> OP_EQUAL',
      'OP_UTXOTOKENCOMMITMENT (at multiple indexes, multiple categories, unordered)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { nft: {} }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: '1', nft: {} }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: '1', nft: { commitment: '01' } }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: '1', category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { capability: 'mutable', commitment: '0102' } }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: '1', category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { capability: 'minting', commitment: '010203' } }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { capability: 'minting', commitment: '01020304' } }, valueSatoshis: 10_000 },
        ],
        transaction: {
          inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }, { unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: { script: 'unlockEmptyP2sh20' } }],
          outputs: [{ valueSatoshis: 1_000 }],
        },
      },
    ],
    [
      '<6> <5> <4> <3> <2> <0> <1>',
      'OP_UTXOTOKENCOMMITMENT <0x00> OP_EQUALVERIFY OP_UTXOTOKENCOMMITMENT <0> OP_EQUALVERIFY OP_UTXOTOKENCOMMITMENT <0> OP_EQUALVERIFY OP_UTXOTOKENCOMMITMENT <1> OP_EQUALVERIFY OP_UTXOTOKENCOMMITMENT <0x0102> OP_EQUALVERIFY OP_UTXOTOKENCOMMITMENT <0x010203> OP_EQUALVERIFY OP_UTXOTOKENCOMMITMENT <0x01020304> OP_EQUAL',
      'OP_UTXOTOKENCOMMITMENT (at multiple indexes, multiple categories, unordered, expect padding for zero-length)',
      ['invalid', 'chip_cashtokens_invalid'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { nft: {} }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: '1', nft: {} }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: '1', nft: { commitment: '01' } }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: '1', category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { capability: 'mutable', commitment: '0102' } }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: '1', category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { capability: 'minting', commitment: '010203' } }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { capability: 'minting', commitment: '01020304' } }, valueSatoshis: 10_000 },
        ],
        transaction: {
          inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }, { unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: { script: 'unlockEmptyP2sh20' } }],
          outputs: [{ valueSatoshis: 1_000 }],
        },
      },
    ],
    // OP_OUTPUTTOKENCOMMITMENT
    [
      '<0>',
      'OP_OUTPUTTOKENCOMMITMENT <0> OP_EQUAL',
      'OP_OUTPUTTOKENCOMMITMENT accepts an index and returns the commitment (zero-length commitment)',
      ['invalid', 'chip_cashtokens'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ token: { nft: {} }, valueSatoshis: 1_000 }] } },
    ],
    [
      '<0>',
      'OP_OUTPUTTOKENCOMMITMENT <0> OP_EQUAL',
      'OP_OUTPUTTOKENCOMMITMENT accepts an index and returns the commitment (non-genesis transaction, zero-length commitment)',
      ['invalid', 'chip_cashtokens'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], token: { nft: {} }, valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ token: { nft: {} }, valueSatoshis: 1_000 }] } },
    ],
    [
      '<0>',
      'OP_OUTPUTTOKENCOMMITMENT <0x00> OP_EQUAL',
      'OP_OUTPUTTOKENCOMMITMENT accepts an index and returns the commitment (zero-length commitment, expect 0x00)',
      ['invalid', 'chip_cashtokens_invalid'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ token: { nft: {} }, valueSatoshis: 1_000 }] } },
    ],
    [
      '<0>',
      'OP_OUTPUTTOKENCOMMITMENT <1> OP_EQUAL',
      'OP_OUTPUTTOKENCOMMITMENT accepts an index and returns the commitment (1-byte commitment)',
      ['invalid', 'chip_cashtokens'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ token: { nft: { commitment: '01' } }, valueSatoshis: 1_000 }] } },
    ],
    [
      '',
      'OP_OUTPUTTOKENCOMMITMENT <1> OP_EQUAL',
      'OP_OUTPUTTOKENCOMMITMENT requires an index from the stack',
      ['invalid', '2022_p2sh32_nonstandard', 'chip_cashtokens_invalid'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ token: { nft: { commitment: '01' } }, valueSatoshis: 1_000 }] } },
    ],
    [
      '<0x80>',
      'OP_OUTPUTTOKENCOMMITMENT <1> OP_EQUAL',
      'OP_OUTPUTTOKENCOMMITMENT requires a minimally-encoded index from the stack (attempt negative zero)',
      ['invalid', 'chip_cashtokens_invalid'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ token: { nft: { commitment: '01' } }, valueSatoshis: 1_000 }] } },
    ],
    [
      '<0>',
      'OP_OUTPUTTOKENCOMMITMENT <0x01020304050607080900> OP_EQUAL',
      'OP_OUTPUTTOKENCOMMITMENT accepts an index and returns the commitment (10-byte commitment, tests endianness)',
      ['invalid', 'chip_cashtokens'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ token: { nft: { commitment: '01020304050607080900' } }, valueSatoshis: 1_000 }] } },
    ],
    [
      '<0>',
      'OP_OUTPUTTOKENCOMMITMENT <0x01020304050607080900010203040506070809000102030405060708090001020304050607080900> OP_EQUAL',
      'OP_OUTPUTTOKENCOMMITMENT accepts an index and returns the commitment (40-byte commitment)',
      ['invalid', 'chip_cashtokens'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ token: { nft: { commitment: '01020304050607080900010203040506070809000102030405060708090001020304050607080900' } }, valueSatoshis: 1_000 }] } },
    ],
    [
      '<0>',
      'OP_OUTPUTTOKENCOMMITMENT <0x0102030405060708090001020304050607080900010203040506070809000102030405060708090001> OP_EQUAL',
      'OP_OUTPUTTOKENCOMMITMENT accepts an index and returns the commitment (41-byte commitment: excessive length)',
      ['invalid', 'chip_cashtokens_invalid'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ token: { nft: { commitment: '0102030405060708090001020304050607080900010203040506070809000102030405060708090001' } }, valueSatoshis: 1_000 }] } },
    ],
    [
      '<0>',
      `OP_OUTPUTTOKENCOMMITMENT <0x${binToHex(Uint8Array.from(range(253)))}> OP_EQUAL`,
      'OP_OUTPUTTOKENCOMMITMENT accepts an index and returns the commitment (253-byte commitment: must be parsable by all implementations, but disabled by consensus)',
      ['invalid', 'chip_cashtokens_invalid'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 100_000 }], transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ token: { nft: { commitment: binToHex(Uint8Array.from(range(253))) } }, valueSatoshis: 10_000 }] } },
    ],
    [
      '<1>',
      'OP_OUTPUTTOKENCOMMITMENT <0xff> OP_EQUAL',
      'OP_OUTPUTTOKENCOMMITMENT (at index 1)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }],
        transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }, { token: { nft: { commitment: 'ff' } }, valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<-1>',
      'OP_OUTPUTTOKENCOMMITMENT <0xff> OP_EQUAL',
      'OP_OUTPUTTOKENCOMMITMENT requires a positive index from the stack (attempt negative one)',
      ['invalid', 'chip_cashtokens_invalid'],
      {
        sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }],
        transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }, { token: { nft: { commitment: 'ff' } }, valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<2>',
      'OP_OUTPUTTOKENCOMMITMENT <0xff> OP_EQUAL',
      'OP_OUTPUTTOKENCOMMITMENT (excessive index)',
      ['invalid', 'chip_cashtokens_invalid'],
      {
        sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }],
        transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }, { token: { nft: { commitment: 'ff' } }, valueSatoshis: 1_000 }] },
      },
    ],
    ['<0>', 'OP_OUTPUTTOKENCOMMITMENT <0> OP_EQUAL', 'OP_OUTPUTTOKENCOMMITMENT (transaction without tokens)', ['invalid', 'chip_cashtokens', 'nop2sh_invalid'], { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] } }],
    [
      '<0>',
      'OP_OUTPUTTOKENCOMMITMENT <0> OP_EQUAL',
      'OP_OUTPUTTOKENCOMMITMENT (at index without tokens)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }],
        transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }, { token: { nft: { commitment: 'ff' } }, valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<0>',
      'OP_OUTPUTTOKENCOMMITMENT <0xff> OP_EQUAL',
      'OP_OUTPUTTOKENCOMMITMENT (expect commitment at index without tokens)',
      ['invalid', 'chip_cashtokens_invalid'],
      {
        sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }],
        transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }, { token: { nft: { commitment: 'ff' } }, valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<1>',
      'OP_OUTPUTTOKENCOMMITMENT <0xff> OP_EQUAL',
      'OP_OUTPUTTOKENCOMMITMENT (non-genesis transaction, index 1)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { nft: { commitment: 'ff' } }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }, { token: { nft: { commitment: 'ff' } }, valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<0>',
      'OP_OUTPUTTOKENCOMMITMENT <0> OP_EQUAL',
      'OP_OUTPUTTOKENCOMMITMENT (non-genesis transaction, at index without tokens)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { nft: { commitment: 'ff' } }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }, { token: { nft: { commitment: 'ff' } }, valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<0>',
      'OP_OUTPUTTOKENCOMMITMENT <0xff> OP_EQUAL',
      'OP_OUTPUTTOKENCOMMITMENT (non-genesis transaction, expect commitment at index without tokens)',
      ['invalid', 'chip_cashtokens_invalid'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { nft: { commitment: 'ff' } }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }, { token: { nft: { commitment: 'ff' } }, valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<1> <0>',
      'OP_OUTPUTTOKENCOMMITMENT <0> OP_EQUALVERIFY OP_OUTPUTTOKENCOMMITMENT <0xff> OP_EQUAL',
      'OP_OUTPUTTOKENCOMMITMENT (at two indexes)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }],
        transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }, { token: { nft: { commitment: 'ff' } }, valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<0> <1>',
      'OP_OUTPUTTOKENCOMMITMENT <0> OP_EQUALVERIFY OP_OUTPUTTOKENCOMMITMENT <0xff> OP_EQUAL',
      'OP_OUTPUTTOKENCOMMITMENT (at two indexes, expect swapped)',
      ['invalid', 'chip_cashtokens_invalid'],
      {
        sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }],
        transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }, { token: { nft: { commitment: 'ff' } }, valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<1> <0>',
      'OP_OUTPUTTOKENCOMMITMENT <0> OP_EQUALVERIFY OP_OUTPUTTOKENCOMMITMENT <0xff> OP_EQUAL',
      'OP_OUTPUTTOKENCOMMITMENT (non-genesis transaction, at two indexes)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { nft: { commitment: 'ff' } }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }, { token: { nft: { commitment: 'ff' } }, valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<0> <1>',
      'OP_OUTPUTTOKENCOMMITMENT <0> OP_EQUALVERIFY OP_OUTPUTTOKENCOMMITMENT <0xff> OP_EQUAL',
      'OP_OUTPUTTOKENCOMMITMENT (non-genesis transaction, at two indexes, expect swapped)',
      ['invalid', 'chip_cashtokens_invalid'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { nft: { commitment: 'ff' } }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }, { token: { nft: { commitment: 'ff' } }, valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<0>',
      'OP_OUTPUTTOKENCOMMITMENT <0> OP_EQUAL',
      'OP_OUTPUTTOKENCOMMITMENT (only fungible tokens, index 0)',
      ['invalid', 'chip_cashtokens'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ token: { amount: 100 }, valueSatoshis: 1_000 }] } },
    ],
    [
      '<1>',
      'OP_OUTPUTTOKENCOMMITMENT <0> OP_EQUAL',
      'OP_OUTPUTTOKENCOMMITMENT (non-genesis transaction, only fungible tokens, index 1)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: 1 }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }, { token: { amount: 1 }, valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<1>',
      'OP_OUTPUTTOKENCOMMITMENT <0> OP_EQUAL',
      'OP_OUTPUTTOKENCOMMITMENT (non-genesis transaction, only fungible tokens, index 1, category 0x00...03)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: 1, category: '0000000000000000000000000000000000000000000000000000000000000003' }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }, { token: { amount: 1, category: '0000000000000000000000000000000000000000000000000000000000000003' }, valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<0>',
      'OP_OUTPUTTOKENCOMMITMENT <0> OP_EQUAL',
      'OP_OUTPUTTOKENCOMMITMENT (immutable and fungible tokens, index 0, zero-length commitment)',
      ['invalid', 'chip_cashtokens'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ token: { amount: 100, nft: {} }, valueSatoshis: 1_000 }] } },
    ],
    [
      '<0>',
      'OP_OUTPUTTOKENCOMMITMENT <0xff> OP_EQUAL',
      'OP_OUTPUTTOKENCOMMITMENT (immutable and fungible tokens, index 0, 1-byte commitment)',
      ['invalid', 'chip_cashtokens'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ token: { amount: 100, nft: { commitment: 'ff' } }, valueSatoshis: 1_000 }] } },
    ],
    [
      '<0>',
      'OP_OUTPUTTOKENCOMMITMENT <0> OP_EQUAL',
      'OP_OUTPUTTOKENCOMMITMENT (immutable and fungible tokens, index 0, 1-byte commitment, expect 0)',
      ['invalid', 'chip_cashtokens_invalid'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ token: { amount: 100, nft: { commitment: 'ff' } }, valueSatoshis: 1_000 }] } },
    ],
    [
      '<1>',
      'OP_OUTPUTTOKENCOMMITMENT <0xff> OP_EQUAL',
      'OP_OUTPUTTOKENCOMMITMENT (non-genesis transaction, immutable and fungible tokens, index 1)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: 1, nft: { commitment: 'ff' } }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }, { token: { amount: 1, nft: { commitment: 'ff' } }, valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<1>',
      'OP_OUTPUTTOKENCOMMITMENT <0xff> OP_EQUAL',
      'OP_OUTPUTTOKENCOMMITMENT (non-genesis transaction, immutable and fungible tokens, index 1, category 0x00...03)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: 1, category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { commitment: 'ff' } }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }, { token: { amount: 1, category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { commitment: 'ff' } }, valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<0>',
      'OP_OUTPUTTOKENCOMMITMENT <0> OP_EQUAL',
      'OP_OUTPUTTOKENCOMMITMENT (only mutable token, index 0, zero-length commitment)',
      ['invalid', 'chip_cashtokens'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ token: { nft: { capability: 'mutable' } }, valueSatoshis: 1_000 }] } },
    ],
    [
      '<0>',
      'OP_OUTPUTTOKENCOMMITMENT <0x0102> OP_EQUAL',
      'OP_OUTPUTTOKENCOMMITMENT (only mutable token, index 0, 2-byte commitment)',
      ['invalid', 'chip_cashtokens'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ token: { nft: { capability: 'mutable', commitment: '0102' } }, valueSatoshis: 1_000 }] } },
    ],
    [
      '<1>',
      'OP_OUTPUTTOKENCOMMITMENT <0x0102> OP_EQUAL',
      'OP_OUTPUTTOKENCOMMITMENT (non-genesis transaction, only mutable token, index 1)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { nft: { capability: 'mutable', commitment: '0102' } }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }, { token: { nft: { capability: 'mutable', commitment: '0102' } }, valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<1>',
      'OP_OUTPUTTOKENCOMMITMENT <0x0102> OP_EQUAL',
      'OP_OUTPUTTOKENCOMMITMENT (non-genesis transaction, only mutable token, index 1, category 0x00...03)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { capability: 'mutable', commitment: '0102' } }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }, { token: { category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { capability: 'mutable', commitment: '0102' } }, valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<0>',
      'OP_OUTPUTTOKENCOMMITMENT <0> OP_EQUAL',
      'OP_OUTPUTTOKENCOMMITMENT (mutable and fungible tokens, index 0, zero-length commitment)',
      ['invalid', 'chip_cashtokens'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ token: { amount: 100, nft: { capability: 'mutable' } }, valueSatoshis: 1_000 }] } },
    ],
    [
      '<0>',
      'OP_OUTPUTTOKENCOMMITMENT <0xff> OP_EQUAL',
      'OP_OUTPUTTOKENCOMMITMENT (mutable and fungible tokens, index 0, 1-byte commitment)',
      ['invalid', 'chip_cashtokens'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ token: { amount: 100, nft: { capability: 'mutable', commitment: 'ff' } }, valueSatoshis: 1_000 }] } },
    ],
    [
      '<0>',
      'OP_OUTPUTTOKENCOMMITMENT <0> OP_EQUAL',
      'OP_OUTPUTTOKENCOMMITMENT (mutable and fungible tokens, index 0, 1-byte commitment, expect 0)',
      ['invalid', 'chip_cashtokens_invalid'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ token: { amount: 100, nft: { capability: 'mutable', commitment: 'ff' } }, valueSatoshis: 1_000 }] } },
    ],
    [
      '<1>',
      'OP_OUTPUTTOKENCOMMITMENT <0xff> OP_EQUAL',
      'OP_OUTPUTTOKENCOMMITMENT (non-genesis transaction, mutable and fungible tokens, index 1)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: 1, nft: { capability: 'mutable', commitment: 'ff' } }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }, { token: { amount: 1, nft: { capability: 'mutable', commitment: 'ff' } }, valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<1>',
      'OP_OUTPUTTOKENCOMMITMENT <0xff> OP_EQUAL',
      'OP_OUTPUTTOKENCOMMITMENT (non-genesis transaction, mutable and fungible tokens, index 1, category 0x00...03)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: 1, category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { capability: 'mutable', commitment: 'ff' } }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }, { token: { amount: 1, category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { capability: 'mutable', commitment: 'ff' } }, valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<0>',
      'OP_OUTPUTTOKENCOMMITMENT <0> OP_EQUAL',
      'OP_OUTPUTTOKENCOMMITMENT (only minting token, index 0, zero-length commitment)',
      ['invalid', 'chip_cashtokens'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ token: { nft: { capability: 'minting' } }, valueSatoshis: 1_000 }] } },
    ],
    [
      '<0>',
      'OP_OUTPUTTOKENCOMMITMENT <0x0102> OP_EQUAL',
      'OP_OUTPUTTOKENCOMMITMENT (only minting token, index 0, 2-byte commitment)',
      ['invalid', 'chip_cashtokens'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ token: { nft: { capability: 'minting', commitment: '0102' } }, valueSatoshis: 1_000 }] } },
    ],
    [
      '<1>',
      'OP_OUTPUTTOKENCOMMITMENT <0x0102> OP_EQUAL',
      'OP_OUTPUTTOKENCOMMITMENT (non-genesis transaction, only minting token, index 1)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { nft: { capability: 'minting', commitment: '0102' } }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }, { token: { nft: { capability: 'minting', commitment: '0102' } }, valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<1>',
      'OP_OUTPUTTOKENCOMMITMENT <0x0102> OP_EQUAL',
      'OP_OUTPUTTOKENCOMMITMENT (non-genesis transaction, only minting token, index 1, category 0x00...03)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { capability: 'minting', commitment: '0102' } }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }, { token: { category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { capability: 'minting', commitment: '0102' } }, valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<0>',
      'OP_OUTPUTTOKENCOMMITMENT <0> OP_EQUAL',
      'OP_OUTPUTTOKENCOMMITMENT (minting and fungible tokens, index 0, zero-length commitment)',
      ['invalid', 'chip_cashtokens'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ token: { amount: 100, nft: { capability: 'minting' } }, valueSatoshis: 1_000 }] } },
    ],
    [
      '<0>',
      'OP_OUTPUTTOKENCOMMITMENT <0xff> OP_EQUAL',
      'OP_OUTPUTTOKENCOMMITMENT (minting and fungible tokens, index 0, 1-byte commitment)',
      ['invalid', 'chip_cashtokens'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ token: { amount: 100, nft: { capability: 'minting', commitment: 'ff' } }, valueSatoshis: 1_000 }] } },
    ],
    [
      '<0>',
      'OP_OUTPUTTOKENCOMMITMENT <0> OP_EQUAL',
      'OP_OUTPUTTOKENCOMMITMENT (minting and fungible tokens, index 0, 1-byte commitment, expect 0)',
      ['invalid', 'chip_cashtokens_invalid'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ token: { amount: 100, nft: { capability: 'minting', commitment: 'ff' } }, valueSatoshis: 1_000 }] } },
    ],
    [
      '<1>',
      'OP_OUTPUTTOKENCOMMITMENT <0xff> OP_EQUAL',
      'OP_OUTPUTTOKENCOMMITMENT (non-genesis transaction, minting and fungible tokens, index 1)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: 1, nft: { capability: 'minting', commitment: 'ff' } }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }, { token: { amount: 1, nft: { capability: 'minting', commitment: 'ff' } }, valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<1>',
      'OP_OUTPUTTOKENCOMMITMENT <0xff> OP_EQUAL',
      'OP_OUTPUTTOKENCOMMITMENT (non-genesis transaction, minting and fungible tokens, index 1, category 0x00...03)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: 1, category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { capability: 'minting', commitment: 'ff' } }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }, { token: { amount: 1, category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { capability: 'minting', commitment: 'ff' } }, valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<7> <6> <5> <4> <3> <2> <0> <1>',
      'OP_OUTPUTTOKENCOMMITMENT <0x01020304> OP_EQUALVERIFY OP_OUTPUTTOKENCOMMITMENT <0> OP_EQUALVERIFY OP_OUTPUTTOKENCOMMITMENT <0x010203> OP_EQUALVERIFY OP_OUTPUTTOKENCOMMITMENT <0x0102> OP_EQUALVERIFY OP_OUTPUTTOKENCOMMITMENT <0x0102030405> OP_EQUALVERIFY OP_OUTPUTTOKENCOMMITMENT <0x01> OP_EQUALVERIFY OP_OUTPUTTOKENCOMMITMENT <0> OP_EQUALVERIFY OP_OUTPUTTOKENCOMMITMENT <0> OP_EQUAL',
      'OP_OUTPUTTOKENCOMMITMENT (at multiple indexes, multiple categories, unordered)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { nft: {} }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { nft: {} }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { commitment: '01' } }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: '1', category: '0000000000000000000000000000000000000000000000000000000000000004', nft: { capability: 'minting' } }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { category: '0000000000000000000000000000000000000000000000000000000000000004', nft: { capability: 'minting' } }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: '1', category: '0000000000000000000000000000000000000000000000000000000000000004', nft: { capability: 'mutable' } }, valueSatoshis: 10_000 },
        ],
        transaction: {
          inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }, { unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: { script: 'unlockEmptyP2sh20' } }],
          outputs: [
            { valueSatoshis: 1_000 },
            { token: { category: '0000000000000000000000000000000000000000000000000000000000000004', nft: { capability: 'minting', commitment: '01020304' } }, valueSatoshis: 1_000 },
            { token: { category: '0000000000000000000000000000000000000000000000000000000000000004', nft: { capability: 'minting', commitment: '010203' } }, valueSatoshis: 1_000 },
            { token: { category: '0000000000000000000000000000000000000000000000000000000000000004', nft: { capability: 'mutable', commitment: '0102' } }, valueSatoshis: 1_000 },
            { token: { amount: 2, category: '0000000000000000000000000000000000000000000000000000000000000004', nft: { commitment: '0102030405' } }, valueSatoshis: 1_000 },
            { token: { category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { commitment: '01' } }, valueSatoshis: 1_000 },
            { token: { nft: {} }, valueSatoshis: 1_000 },
            { token: { nft: {} }, valueSatoshis: 1_000 },
          ],
        },
      },
    ],
    [
      '<7> <6> <5> <4> <3> <2> <0> <1>',
      'OP_OUTPUTTOKENCOMMITMENT <0> OP_EQUALVERIFY OP_OUTPUTTOKENCOMMITMENT <0> OP_EQUALVERIFY OP_OUTPUTTOKENCOMMITMENT <0x010203> OP_EQUALVERIFY OP_OUTPUTTOKENCOMMITMENT <0x0102> OP_EQUALVERIFY OP_OUTPUTTOKENCOMMITMENT <0x0102030405> OP_EQUALVERIFY OP_OUTPUTTOKENCOMMITMENT <0x01> OP_EQUALVERIFY OP_OUTPUTTOKENCOMMITMENT <0> OP_EQUALVERIFY OP_OUTPUTTOKENCOMMITMENT <0> OP_EQUAL',
      'OP_OUTPUTTOKENCOMMITMENT (at multiple indexes, multiple categories, unordered, expect zero-length commitment at index 1)',
      ['invalid', 'chip_cashtokens_invalid'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { nft: {} }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { nft: {} }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { commitment: '01' } }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: '1', category: '0000000000000000000000000000000000000000000000000000000000000004', nft: { capability: 'minting' } }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { category: '0000000000000000000000000000000000000000000000000000000000000004', nft: { capability: 'minting' } }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: '1', category: '0000000000000000000000000000000000000000000000000000000000000004', nft: { capability: 'mutable' } }, valueSatoshis: 10_000 },
        ],
        transaction: {
          inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }, { unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: { script: 'unlockEmptyP2sh20' } }],
          outputs: [
            { valueSatoshis: 1_000 },
            { token: { category: '0000000000000000000000000000000000000000000000000000000000000004', nft: { capability: 'minting', commitment: '01020304' } }, valueSatoshis: 1_000 },
            { token: { category: '0000000000000000000000000000000000000000000000000000000000000004', nft: { capability: 'minting', commitment: '010203' } }, valueSatoshis: 1_000 },
            { token: { category: '0000000000000000000000000000000000000000000000000000000000000004', nft: { capability: 'mutable', commitment: '0102' } }, valueSatoshis: 1_000 },
            { token: { amount: 2, category: '0000000000000000000000000000000000000000000000000000000000000004', nft: { commitment: '0102030405' } }, valueSatoshis: 1_000 },
            { token: { category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { commitment: '01' } }, valueSatoshis: 1_000 },
            { token: { nft: {} }, valueSatoshis: 1_000 },
            { token: { nft: {} }, valueSatoshis: 1_000 },
          ],
        },
      },
    ],
    // OP_UTXOTOKENAMOUNT
    ['<0>', 'OP_UTXOTOKENAMOUNT <1> OP_EQUAL', 'OP_UTXOTOKENAMOUNT accepts an index and returns the token amount (1 fungible token)', ['invalid', 'chip_cashtokens', 'nop2sh_invalid'], { sourceOutputs: [{ lockingBytecode: ['slot'], token: { amount: 1 }, valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] } }],
    ['<0>', 'OP_UTXOTOKENAMOUNT <2> OP_EQUAL', 'OP_UTXOTOKENAMOUNT accepts an index and returns the token amount (1 fungible token, expect 2)', ['invalid', 'chip_cashtokens_invalid'], { sourceOutputs: [{ lockingBytecode: ['slot'], token: { amount: 1 }, valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] } }],
    ['<0>', 'OP_UTXOTOKENAMOUNT <253> OP_EQUAL', 'OP_UTXOTOKENAMOUNT accepts an index and returns the token amount (253 fungible tokens)', ['invalid', 'chip_cashtokens'], { sourceOutputs: [{ lockingBytecode: ['slot'], token: { amount: 253 }, valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] } }],
    ['<0>', 'OP_UTXOTOKENAMOUNT <65536> OP_EQUAL', 'OP_UTXOTOKENAMOUNT accepts an index and returns the token amount (65536 fungible tokens)', ['invalid', 'chip_cashtokens'], { sourceOutputs: [{ lockingBytecode: ['slot'], token: { amount: 65536 }, valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] } }],
    ['<0>', 'OP_UTXOTOKENAMOUNT <4294967296> OP_EQUAL', 'OP_UTXOTOKENAMOUNT accepts an index and returns the token amount (4294967296 fungible tokens)', ['invalid', 'chip_cashtokens'], { sourceOutputs: [{ lockingBytecode: ['slot'], token: { amount: 4294967296 }, valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] } }],
    [
      '<0>',
      'OP_UTXOTOKENAMOUNT <9223372036854775807> OP_EQUAL',
      'OP_UTXOTOKENAMOUNT accepts an index and returns the token amount (maximum fungible tokens)',
      ['invalid', 'chip_cashtokens'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], token: { amount: '9223372036854775807' }, valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] } },
    ],
    [
      '<0>',
      'OP_UTXOTOKENAMOUNT <9223372036854775808> OP_EQUAL',
      'OP_UTXOTOKENAMOUNT accepts an index and returns the token amount (excessive fungible tokens)',
      ['invalid', 'chip_cashtokens_invalid'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], token: { amount: '9223372036854775808' }, valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] } },
    ],
    ['', 'OP_UTXOTOKENAMOUNT <1> OP_EQUAL', 'OP_UTXOTOKENAMOUNT requires an index from the stack', ['invalid', 'chip_cashtokens_invalid'], { sourceOutputs: [{ lockingBytecode: ['slot'], token: { amount: 1 }, valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] } }],
    ['<0x80>', 'OP_UTXOTOKENAMOUNT <1> OP_EQUAL', 'OP_UTXOTOKENAMOUNT requires a minimally-encoded index from the stack (attempt negative zero)', ['invalid', 'chip_cashtokens_invalid'], { sourceOutputs: [{ lockingBytecode: ['slot'], token: { amount: 1 }, valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] } }],
    [
      '<1>',
      'OP_UTXOTOKENAMOUNT <1> OP_EQUAL',
      'OP_UTXOTOKENAMOUNT (at index 1)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { amount: 1 }, valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<-1>',
      'OP_UTXOTOKENAMOUNT <1> OP_EQUAL',
      'OP_UTXOTOKENAMOUNT requires a positive index from the stack (attempt negative one)',
      ['invalid', 'chip_cashtokens_invalid'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { amount: 1 }, valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<2>',
      'OP_UTXOTOKENAMOUNT <1> OP_EQUAL',
      'OP_UTXOTOKENAMOUNT (excessive index)',
      ['invalid', 'chip_cashtokens_invalid'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { amount: 1 }, valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] },
      },
    ],
    ['<0>', 'OP_UTXOTOKENAMOUNT <0> OP_EQUAL', 'OP_UTXOTOKENAMOUNT (transaction without tokens)', ['invalid', 'chip_cashtokens', 'nop2sh_invalid'], { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] } }],

    [
      '<0>',
      'OP_UTXOTOKENAMOUNT <0> OP_EQUAL',
      'OP_UTXOTOKENAMOUNT (at index without tokens)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { amount: 1 }, valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<0>',
      'OP_UTXOTOKENAMOUNT <1> OP_EQUAL',
      'OP_UTXOTOKENAMOUNT (expect amount at index without tokens)',
      ['invalid', 'chip_cashtokens_invalid'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { amount: 1 }, valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<1> <0>',
      'OP_UTXOTOKENAMOUNT <0> OP_EQUALVERIFY OP_UTXOTOKENAMOUNT <1> OP_EQUAL',
      'OP_UTXOTOKENAMOUNT (at two indexes)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { amount: 1 }, valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<0> <1>',
      'OP_UTXOTOKENAMOUNT <0> OP_EQUALVERIFY OP_UTXOTOKENAMOUNT <1> OP_EQUAL',
      'OP_UTXOTOKENAMOUNT (at two indexes, expect swapped)',
      ['invalid', 'chip_cashtokens_invalid'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { amount: 1 }, valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] },
      },
    ],
    ['<0>', 'OP_UTXOTOKENAMOUNT <1000> OP_EQUAL', 'OP_UTXOTOKENAMOUNT (only fungible tokens, index 0)', ['invalid', 'chip_cashtokens'], { sourceOutputs: [{ lockingBytecode: ['slot'], token: { amount: 1000 }, valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] } }],
    [
      '<1>',
      'OP_UTXOTOKENAMOUNT <1000> OP_EQUAL',
      'OP_UTXOTOKENAMOUNT (only fungible tokens, index 1)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { amount: 1000 }, valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<1>',
      'OP_UTXOTOKENAMOUNT <1000> OP_EQUAL',
      'OP_UTXOTOKENAMOUNT (only fungible tokens, index 1, category 0x00...03)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { amount: 1000, category: '0000000000000000000000000000000000000000000000000000000000000003' }, valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] },
      },
    ],
    ['<0>', 'OP_UTXOTOKENAMOUNT <1000> OP_EQUAL', 'OP_UTXOTOKENAMOUNT (immutable and fungible tokens, index 0)', ['invalid', 'chip_cashtokens'], { sourceOutputs: [{ lockingBytecode: ['slot'], token: { amount: 1000, nft: { commitment: 'ff' } }, valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] } }],
    ['<0>', 'OP_UTXOTOKENAMOUNT <0> OP_EQUAL', 'OP_UTXOTOKENAMOUNT (immutable and fungible tokens, index 0, expect 0)', ['invalid', 'chip_cashtokens_invalid'], { sourceOutputs: [{ lockingBytecode: ['slot'], token: { amount: 1000, nft: { commitment: 'ff' } }, valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] } }],
    [
      '<1>',
      'OP_UTXOTOKENAMOUNT <1000> OP_EQUAL',
      'OP_UTXOTOKENAMOUNT (immutable and fungible tokens, index 1)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { amount: 1000, nft: { commitment: 'ff' } }, valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<1>',
      'OP_UTXOTOKENAMOUNT <1000> OP_EQUAL',
      'OP_UTXOTOKENAMOUNT (immutable and fungible tokens, index 1, category 0x00...03)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { amount: 1000, category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { commitment: 'ff' } }, valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] },
      },
    ],
    ['<0>', 'OP_UTXOTOKENAMOUNT <0> OP_EQUAL', 'OP_UTXOTOKENAMOUNT (only mutable token, index 0)', ['invalid', 'chip_cashtokens', 'nop2sh_invalid'], { sourceOutputs: [{ lockingBytecode: ['slot'], token: { nft: { capability: 'mutable', commitment: 'ee' } }, valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] } }],
    [
      '<1>',
      'OP_UTXOTOKENAMOUNT <0> OP_EQUAL',
      'OP_UTXOTOKENAMOUNT (only mutable token, index 1)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { nft: { capability: 'mutable', commitment: 'ee' } }, valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<1>',
      'OP_UTXOTOKENAMOUNT <0> OP_EQUAL',
      'OP_UTXOTOKENAMOUNT (only mutable token, index 1, category 0x00...03)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { capability: 'mutable', commitment: 'ee' } }, valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] },
      },
    ],
    ['<0>', 'OP_UTXOTOKENAMOUNT <1000> OP_EQUAL', 'OP_UTXOTOKENAMOUNT (mutable and fungible tokens, index 0)', ['invalid', 'chip_cashtokens'], { sourceOutputs: [{ lockingBytecode: ['slot'], token: { amount: 1000, nft: { capability: 'mutable', commitment: 'ff' } }, valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] } }],
    [
      '<0>',
      'OP_UTXOTOKENAMOUNT <0> OP_EQUAL',
      'OP_UTXOTOKENAMOUNT (mutable and fungible tokens, index 0, expect 0)',
      ['invalid', 'chip_cashtokens_invalid'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], token: { amount: 1000, nft: { capability: 'mutable', commitment: 'ff' } }, valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] } },
    ],
    [
      '<1>',
      'OP_UTXOTOKENAMOUNT <1000> OP_EQUAL',
      'OP_UTXOTOKENAMOUNT (mutable and fungible tokens, index 1)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { amount: 1000, nft: { capability: 'mutable', commitment: 'ff' } }, valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<1>',
      'OP_UTXOTOKENAMOUNT <1000> OP_EQUAL',
      'OP_UTXOTOKENAMOUNT (mutable and fungible tokens, index 1, category 0x00...03)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { amount: 1000, category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { capability: 'mutable', commitment: 'ff' } }, valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] },
      },
    ],
    ['<0>', 'OP_UTXOTOKENAMOUNT <0> OP_EQUAL', 'OP_UTXOTOKENAMOUNT (only minting token, index 0)', ['invalid', 'chip_cashtokens', 'nop2sh_invalid'], { sourceOutputs: [{ lockingBytecode: ['slot'], token: { nft: { capability: 'minting', commitment: 'ee' } }, valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] } }],
    [
      '<1>',
      'OP_UTXOTOKENAMOUNT <0> OP_EQUAL',
      'OP_UTXOTOKENAMOUNT (only minting token, index 1)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { nft: { capability: 'minting', commitment: 'ee' } }, valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<1>',
      'OP_UTXOTOKENAMOUNT <0> OP_EQUAL',
      'OP_UTXOTOKENAMOUNT (only minting token, index 1, category 0x00...03)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { capability: 'minting', commitment: 'ee' } }, valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] },
      },
    ],
    ['<0>', 'OP_UTXOTOKENAMOUNT <1000> OP_EQUAL', 'OP_UTXOTOKENAMOUNT (minting and fungible tokens, index 0)', ['invalid', 'chip_cashtokens'], { sourceOutputs: [{ lockingBytecode: ['slot'], token: { amount: 1000, nft: { capability: 'minting', commitment: 'ff' } }, valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] } }],
    [
      '<0>',
      'OP_UTXOTOKENAMOUNT <0> OP_EQUAL',
      'OP_UTXOTOKENAMOUNT (minting and fungible tokens, index 0, expect amount of 0)',
      ['invalid', 'chip_cashtokens_invalid'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], token: { amount: 1000, nft: { capability: 'minting', commitment: 'ff' } }, valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] } },
    ],
    [
      '<1>',
      'OP_UTXOTOKENAMOUNT <1000> OP_EQUAL',
      'OP_UTXOTOKENAMOUNT (minting and fungible tokens, index 1)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { amount: 1000, nft: { capability: 'minting', commitment: 'ff' } }, valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<1>',
      'OP_UTXOTOKENAMOUNT <1000> OP_EQUAL',
      'OP_UTXOTOKENAMOUNT (minting and fungible tokens, index 1, category 0x00...03)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { amount: 1000, category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { capability: 'minting', commitment: 'ff' } }, valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<8> <7> <6> <5> <4> <3> <2> <0> <1>',
      'OP_UTXOTOKENAMOUNT <0> OP_EQUALVERIFY OP_UTXOTOKENAMOUNT <0> OP_EQUALVERIFY OP_UTXOTOKENAMOUNT <1> OP_EQUALVERIFY OP_UTXOTOKENAMOUNT <252> OP_EQUALVERIFY OP_UTXOTOKENAMOUNT <253> OP_EQUALVERIFY OP_UTXOTOKENAMOUNT <65535> OP_EQUALVERIFY OP_UTXOTOKENAMOUNT <4294967295> OP_EQUALVERIFY OP_UTXOTOKENAMOUNT <4294967296> OP_EQUALVERIFY OP_UTXOTOKENAMOUNT <9223372036854775807> OP_EQUAL',
      'OP_UTXOTOKENAMOUNT (at multiple indexes, multiple categories, unordered)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { nft: {} }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: 1, nft: {} }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: 252, nft: { commitment: '01' } }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: 253, category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { capability: 'mutable' } }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: 65535, category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { capability: 'minting' } }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: 4294967295, category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { capability: 'minting' } }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: 4294967296 }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: '9223372036854775807', category: '0000000000000000000000000000000000000000000000000000000000000004' }, valueSatoshis: 10_000 },
        ],
        transaction: {
          inputs: [
            { unlockingBytecode: { script: 'unlockEmptyP2sh20' } },
            { unlockingBytecode: ['slot'] },
            { unlockingBytecode: { script: 'unlockEmptyP2sh20' } },
            { unlockingBytecode: { script: 'unlockEmptyP2sh20' } },
            { unlockingBytecode: { script: 'unlockEmptyP2sh20' } },
            { unlockingBytecode: { script: 'unlockEmptyP2sh20' } },
            { unlockingBytecode: { script: 'unlockEmptyP2sh20' } },
            { unlockingBytecode: { script: 'unlockEmptyP2sh20' } },
            { unlockingBytecode: { script: 'unlockEmptyP2sh20' } },
          ],
          outputs: [{ token: { amount: 1 }, valueSatoshis: 1_000 }],
        },
      },
    ],
    [
      '<8> <7> <6> <5> <4> <3> <2> <0> <1>',
      'OP_UTXOTOKENAMOUNT <0> OP_EQUALVERIFY OP_UTXOTOKENAMOUNT <1> OP_EQUALVERIFY OP_UTXOTOKENAMOUNT <1> OP_EQUALVERIFY OP_UTXOTOKENAMOUNT <252> OP_EQUALVERIFY OP_UTXOTOKENAMOUNT <253> OP_EQUALVERIFY OP_UTXOTOKENAMOUNT <65535> OP_EQUALVERIFY OP_UTXOTOKENAMOUNT <4294967295> OP_EQUALVERIFY OP_UTXOTOKENAMOUNT <4294967296> OP_EQUALVERIFY OP_UTXOTOKENAMOUNT <9223372036854775807> OP_EQUAL',
      'OP_UTXOTOKENAMOUNT (at multiple indexes, multiple categories, unordered, expect incorrect amount of 1 at index 0)',
      ['invalid', 'chip_cashtokens_invalid'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { nft: {} }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: 1, nft: {} }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: 252, nft: { commitment: '01' } }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: 253, category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { capability: 'mutable' } }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: 65535, category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { capability: 'minting' } }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: 4294967295, category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { capability: 'minting' } }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: 4294967296 }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: '9223372036854775807', category: '0000000000000000000000000000000000000000000000000000000000000004' }, valueSatoshis: 10_000 },
        ],
        transaction: {
          inputs: [
            { unlockingBytecode: { script: 'unlockEmptyP2sh20' } },
            { unlockingBytecode: ['slot'] },
            { unlockingBytecode: { script: 'unlockEmptyP2sh20' } },
            { unlockingBytecode: { script: 'unlockEmptyP2sh20' } },
            { unlockingBytecode: { script: 'unlockEmptyP2sh20' } },
            { unlockingBytecode: { script: 'unlockEmptyP2sh20' } },
            { unlockingBytecode: { script: 'unlockEmptyP2sh20' } },
            { unlockingBytecode: { script: 'unlockEmptyP2sh20' } },
            { unlockingBytecode: { script: 'unlockEmptyP2sh20' } },
          ],
          outputs: [{ token: { amount: 1 }, valueSatoshis: 1_000 }],
        },
      },
    ],
    // OP_OUTPUTTOKENAMOUNT
    [
      '<0>',
      'OP_OUTPUTTOKENAMOUNT <1> OP_EQUAL',
      'OP_OUTPUTTOKENAMOUNT accepts an index and returns the token amount (1 fungible token)',
      ['invalid', 'chip_cashtokens'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ token: { amount: 1 }, valueSatoshis: 1_000 }] } },
    ],
    [
      '<0>',
      'OP_OUTPUTTOKENAMOUNT <2> OP_EQUAL',
      'OP_OUTPUTTOKENAMOUNT accepts an index and returns the token amount (1 fungible token, expect 2)',
      ['invalid', 'chip_cashtokens_invalid'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ token: { amount: 1 }, valueSatoshis: 1_000 }] } },
    ],
    [
      '<0>',
      'OP_OUTPUTTOKENAMOUNT <1> OP_EQUAL',
      'OP_OUTPUTTOKENAMOUNT accepts an index and returns the token amount (non-genesis transaction, 1 fungible token)',
      ['invalid', 'chip_cashtokens'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], token: { amount: 1 }, valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ token: { amount: 1 }, valueSatoshis: 1_000 }] } },
    ],
    [
      '<0>',
      'OP_OUTPUTTOKENAMOUNT <2> OP_EQUAL',
      'OP_OUTPUTTOKENAMOUNT accepts an index and returns the token amount (non-genesis transaction, 1 fungible token, expect 2)',
      ['invalid', 'chip_cashtokens_invalid'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], token: { amount: 1 }, valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ token: { amount: 1 }, valueSatoshis: 1_000 }] } },
    ],
    [
      '<0>',
      'OP_OUTPUTTOKENAMOUNT <250> OP_EQUAL',
      'OP_OUTPUTTOKENAMOUNT accepts an index and returns the token amount (250 fungible tokens)',
      ['invalid', 'chip_cashtokens'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ token: { amount: 250 }, valueSatoshis: 1_000 }] } },
    ],
    [
      '<0>',
      'OP_OUTPUTTOKENAMOUNT <65530> OP_EQUAL',
      'OP_OUTPUTTOKENAMOUNT accepts an index and returns the token amount (65530 fungible tokens)',
      ['invalid', 'chip_cashtokens'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ token: { amount: 65530 }, valueSatoshis: 1_000 }] } },
    ],
    [
      '<0>',
      'OP_OUTPUTTOKENAMOUNT <4294967290> OP_EQUAL',
      'OP_OUTPUTTOKENAMOUNT accepts an index and returns the token amount (4294967290 fungible tokens)',
      ['invalid', 'chip_cashtokens'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ token: { amount: 4294967290 }, valueSatoshis: 1_000 }] } },
    ],
    [
      '<0>',
      'OP_OUTPUTTOKENAMOUNT <9223372036854775807> OP_EQUAL',
      'OP_OUTPUTTOKENAMOUNT accepts an index and returns the token amount (maximum fungible tokens)',
      ['invalid', 'chip_cashtokens'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ token: { amount: '9223372036854775807' }, valueSatoshis: 1_000 }] } },
    ],
    [
      '<0>',
      'OP_OUTPUTTOKENAMOUNT <9223372036854775808> OP_EQUAL',
      'OP_OUTPUTTOKENAMOUNT accepts an index and returns the token amount (excessive fungible tokens)',
      ['invalid', 'chip_cashtokens_invalid'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ token: { amount: '9223372036854775808' }, valueSatoshis: 1_000 }] } },
    ],
    [
      '',
      'OP_OUTPUTTOKENAMOUNT <1> OP_EQUAL',
      'OP_OUTPUTTOKENAMOUNT requires an index from the stack',
      ['invalid', '2022_p2sh32_nonstandard', 'chip_cashtokens_invalid'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ token: { amount: 1 }, valueSatoshis: 1_000 }] } },
    ],
    [
      '<0x80>',
      'OP_OUTPUTTOKENAMOUNT <1> OP_EQUAL',
      'OP_OUTPUTTOKENAMOUNT requires a minimally-encoded index from the stack (attempt negative zero)',
      ['invalid', 'chip_cashtokens_invalid'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ token: { amount: 1 }, valueSatoshis: 1_000 }] } },
    ],
    [
      '<1>',
      'OP_OUTPUTTOKENAMOUNT <1> OP_EQUAL',
      'OP_OUTPUTTOKENAMOUNT (at index 1)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }],
        transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }, { token: { amount: 1 }, valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<-1>',
      'OP_OUTPUTTOKENAMOUNT <1> OP_EQUAL',
      'OP_OUTPUTTOKENAMOUNT requires a positive index from the stack (attempt negative one)',
      ['invalid', 'chip_cashtokens_invalid'],
      {
        sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }],
        transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }, { token: { amount: 1 }, valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<2>',
      'OP_OUTPUTTOKENAMOUNT <1> OP_EQUAL',
      'OP_OUTPUTTOKENAMOUNT (excessive index)',
      ['invalid', 'chip_cashtokens_invalid'],
      {
        sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }],
        transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }, { token: { amount: 1 }, valueSatoshis: 1_000 }] },
      },
    ],
    ['<0>', 'OP_OUTPUTTOKENAMOUNT <0> OP_EQUAL', 'OP_OUTPUTTOKENAMOUNT (transaction without tokens)', ['invalid', 'chip_cashtokens', 'nop2sh_invalid'], { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }] } }],
    [
      '<0>',
      'OP_OUTPUTTOKENAMOUNT <0> OP_EQUAL',
      'OP_OUTPUTTOKENAMOUNT (at index without tokens)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }],
        transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }, { token: { amount: 1 }, valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<0>',
      'OP_OUTPUTTOKENAMOUNT <1> OP_EQUAL',
      'OP_OUTPUTTOKENAMOUNT (expect amount at index without tokens)',
      ['invalid', 'chip_cashtokens_invalid'],
      {
        sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }],
        transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }, { token: { amount: 1 }, valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<1>',
      'OP_OUTPUTTOKENAMOUNT <1> OP_EQUAL',
      'OP_OUTPUTTOKENAMOUNT (non-genesis transaction, index 1)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: 1 }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }, { token: { amount: 1 }, valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<0>',
      'OP_OUTPUTTOKENAMOUNT <0> OP_EQUAL',
      'OP_OUTPUTTOKENAMOUNT (non-genesis transaction, at index without tokens)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: 1 }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }, { token: { amount: 1 }, valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<0>',
      'OP_OUTPUTTOKENAMOUNT <1> OP_EQUAL',
      'OP_OUTPUTTOKENAMOUNT (non-genesis transaction, expect commitment at index without tokens)',
      ['invalid', 'chip_cashtokens_invalid'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: 1 }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }, { token: { amount: 1 }, valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<1> <0>',
      'OP_OUTPUTTOKENAMOUNT <0> OP_EQUALVERIFY OP_OUTPUTTOKENAMOUNT <1> OP_EQUAL',
      'OP_OUTPUTTOKENAMOUNT (at two indexes)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }],
        transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }, { token: { amount: 1 }, valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<0> <1>',
      'OP_OUTPUTTOKENAMOUNT <0> OP_EQUALVERIFY OP_OUTPUTTOKENAMOUNT <1> OP_EQUAL',
      'OP_OUTPUTTOKENAMOUNT (at two indexes, expect swapped)',
      ['invalid', 'chip_cashtokens_invalid'],
      {
        sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }],
        transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }, { token: { amount: 1 }, valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<1> <0>',
      'OP_OUTPUTTOKENAMOUNT <0> OP_EQUALVERIFY OP_OUTPUTTOKENAMOUNT <1> OP_EQUAL',
      'OP_OUTPUTTOKENAMOUNT (non-genesis transaction, at two indexes)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: 1 }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }, { token: { amount: 1 }, valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<0> <1>',
      'OP_OUTPUTTOKENAMOUNT <0> OP_EQUALVERIFY OP_OUTPUTTOKENAMOUNT <1> OP_EQUAL',
      'OP_OUTPUTTOKENAMOUNT (non-genesis transaction, at two indexes, expect swapped)',
      ['invalid', 'chip_cashtokens_invalid'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: 1 }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }, { token: { amount: 1 }, valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<0>',
      'OP_OUTPUTTOKENAMOUNT <1000> OP_EQUAL',
      'OP_OUTPUTTOKENAMOUNT (only fungible tokens, index 0)',
      ['invalid', 'chip_cashtokens'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ token: { amount: 1000 }, valueSatoshis: 1_000 }] } },
    ],
    [
      '<1>',
      'OP_OUTPUTTOKENAMOUNT <1000> OP_EQUAL',
      'OP_OUTPUTTOKENAMOUNT (non-genesis transaction, only fungible tokens, index 1)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: 1000 }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }, { token: { amount: 1000 }, valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<1>',
      'OP_OUTPUTTOKENAMOUNT <1000> OP_EQUAL',
      'OP_OUTPUTTOKENAMOUNT (non-genesis transaction, only fungible tokens, index 1, category 0x00...03)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: 1000, category: '0000000000000000000000000000000000000000000000000000000000000003' }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }, { token: { amount: 1000, category: '0000000000000000000000000000000000000000000000000000000000000003' }, valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<0>',
      'OP_OUTPUTTOKENAMOUNT <1000> OP_EQUAL',
      'OP_OUTPUTTOKENAMOUNT (immutable and fungible tokens, index 0)',
      ['invalid', 'chip_cashtokens'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ token: { amount: 1000, nft: {} }, valueSatoshis: 1_000 }] } },
    ],
    [
      '<0>',
      'OP_OUTPUTTOKENAMOUNT <0> OP_EQUAL',
      'OP_OUTPUTTOKENAMOUNT (immutable and fungible tokens, index 0, expect 0)',
      ['invalid', 'chip_cashtokens_invalid'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ token: { amount: 1000, nft: {} }, valueSatoshis: 1_000 }] } },
    ],
    [
      '<0>',
      'OP_OUTPUTTOKENAMOUNT <10000> OP_EQUAL',
      'OP_OUTPUTTOKENAMOUNT (immutable and fungible tokens, index 0, 1-byte commitment)',
      ['invalid', 'chip_cashtokens'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ token: { amount: 10000, nft: { commitment: 'ff' } }, valueSatoshis: 1_000 }] } },
    ],
    [
      '<0>',
      'OP_OUTPUTTOKENAMOUNT <0> OP_EQUAL',
      'OP_OUTPUTTOKENAMOUNT (immutable and fungible tokens, index 0, 1-byte commitment, expect 0)',
      ['invalid', 'chip_cashtokens_invalid'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ token: { amount: 10000, nft: { commitment: 'ff' } }, valueSatoshis: 1_000 }] } },
    ],
    [
      '<1>',
      'OP_OUTPUTTOKENAMOUNT <1000> OP_EQUAL',
      'OP_OUTPUTTOKENAMOUNT (immutable and fungible tokens, index 1)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }],
        transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }, { token: { amount: 1000, nft: { commitment: 'ff' } }, valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<1>',
      'OP_OUTPUTTOKENAMOUNT <1000> OP_EQUAL',
      'OP_OUTPUTTOKENAMOUNT (non-genesis transaction, immutable and fungible tokens, index 1)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: 1000, nft: { commitment: 'ff' } }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }, { token: { amount: 1000, nft: { commitment: 'ff' } }, valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<1>',
      'OP_OUTPUTTOKENAMOUNT <1000> OP_EQUAL',
      'OP_OUTPUTTOKENAMOUNT (immutable and fungible tokens, index 1, category 0x00...03)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }],
        transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000003', unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }, { token: { amount: 1000, category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { commitment: 'ff' } }, valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<1>',
      'OP_OUTPUTTOKENAMOUNT <1000> OP_EQUAL',
      'OP_OUTPUTTOKENAMOUNT (non-genesis transaction, immutable and fungible tokens, index 1, category 0x00...03)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: 1000, category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { commitment: 'ff' } }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }, { token: { amount: 1000, category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { commitment: 'ff' } }, valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<0>',
      'OP_OUTPUTTOKENAMOUNT <0> OP_EQUAL',
      'OP_OUTPUTTOKENAMOUNT (only mutable token, index 0)',
      ['invalid', 'chip_cashtokens'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ token: { nft: { capability: 'mutable' } }, valueSatoshis: 1_000 }] } },
    ],
    [
      '<1>',
      'OP_OUTPUTTOKENAMOUNT <0> OP_EQUAL',
      'OP_OUTPUTTOKENAMOUNT (non-genesis transaction, only mutable token, index 1)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: 1000, nft: { capability: 'mutable' } }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }, { token: { nft: { capability: 'mutable' } }, valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<1>',
      'OP_OUTPUTTOKENAMOUNT <0> OP_EQUAL',
      'OP_OUTPUTTOKENAMOUNT (non-genesis transaction, only mutable token, index 1, category 0x00...03)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: 1000, category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { capability: 'mutable' } }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }, { token: { category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { capability: 'mutable' } }, valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<0>',
      'OP_OUTPUTTOKENAMOUNT <1000> OP_EQUAL',
      'OP_OUTPUTTOKENAMOUNT (mutable and fungible tokens, index 0)',
      ['invalid', 'chip_cashtokens'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ token: { amount: 1000, nft: { capability: 'mutable' } }, valueSatoshis: 1_000 }] } },
    ],
    [
      '<0>',
      'OP_OUTPUTTOKENAMOUNT <0> OP_EQUAL',
      'OP_OUTPUTTOKENAMOUNT (mutable and fungible tokens, index 0, expect 0)',
      ['invalid', 'chip_cashtokens_invalid'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ token: { amount: 1000, nft: { capability: 'mutable' } }, valueSatoshis: 1_000 }] } },
    ],
    [
      '<0>',
      'OP_OUTPUTTOKENAMOUNT <10000> OP_EQUAL',
      'OP_OUTPUTTOKENAMOUNT (mutable and fungible tokens, index 0, 1-byte commitment)',
      ['invalid', 'chip_cashtokens'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ token: { amount: 10000, nft: { capability: 'mutable', commitment: 'ff' } }, valueSatoshis: 1_000 }] } },
    ],
    [
      '<0>',
      'OP_OUTPUTTOKENAMOUNT <0> OP_EQUAL',
      'OP_OUTPUTTOKENAMOUNT (mutable and fungible tokens, index 0, 1-byte commitment, expect 0)',
      ['invalid', 'chip_cashtokens_invalid'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ token: { amount: 10000, nft: { capability: 'mutable', commitment: 'ff' } }, valueSatoshis: 1_000 }] } },
    ],
    [
      '<1>',
      'OP_OUTPUTTOKENAMOUNT <1000> OP_EQUAL',
      'OP_OUTPUTTOKENAMOUNT (mutable and fungible tokens, index 1)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }],
        transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }, { token: { amount: 1000, nft: { capability: 'mutable', commitment: 'ff' } }, valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<1>',
      'OP_OUTPUTTOKENAMOUNT <1000> OP_EQUAL',
      'OP_OUTPUTTOKENAMOUNT (non-genesis transaction, mutable and fungible tokens, index 1)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: 1000, nft: { capability: 'mutable', commitment: 'ff' } }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }, { token: { amount: 1000, nft: { capability: 'mutable', commitment: 'ff' } }, valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<1>',
      'OP_OUTPUTTOKENAMOUNT <1000> OP_EQUAL',
      'OP_OUTPUTTOKENAMOUNT (mutable and fungible tokens, index 1, category 0x00...03)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }],
        transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000003', unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }, { token: { amount: 1000, category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { capability: 'mutable', commitment: 'ff' } }, valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<1>',
      'OP_OUTPUTTOKENAMOUNT <1000> OP_EQUAL',
      'OP_OUTPUTTOKENAMOUNT (non-genesis transaction, mutable and fungible tokens, index 1, category 0x00...03)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: 1000, category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { capability: 'mutable', commitment: 'ff' } }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }, { token: { amount: 1000, category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { capability: 'mutable', commitment: 'ff' } }, valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<0>',
      'OP_OUTPUTTOKENAMOUNT <0> OP_EQUAL',
      'OP_OUTPUTTOKENAMOUNT (only minting token, index 0)',
      ['invalid', 'chip_cashtokens'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ token: { nft: { capability: 'minting' } }, valueSatoshis: 1_000 }] } },
    ],
    [
      '<1>',
      'OP_OUTPUTTOKENAMOUNT <0> OP_EQUAL',
      'OP_OUTPUTTOKENAMOUNT (non-genesis transaction, only minting token, index 1)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: 1000, nft: { capability: 'minting' } }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }, { token: { nft: { capability: 'minting' } }, valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<1>',
      'OP_OUTPUTTOKENAMOUNT <0> OP_EQUAL',
      'OP_OUTPUTTOKENAMOUNT (non-genesis transaction, only minting token, index 1, category 0x00...03)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: 1000, category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { capability: 'minting' } }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }, { token: { category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { capability: 'minting' } }, valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<0>',
      'OP_OUTPUTTOKENAMOUNT <1000> OP_EQUAL',
      'OP_OUTPUTTOKENAMOUNT (minting and fungible tokens, index 0)',
      ['invalid', 'chip_cashtokens'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ token: { amount: 1000, nft: { capability: 'minting' } }, valueSatoshis: 1_000 }] } },
    ],
    [
      '<0>',
      'OP_OUTPUTTOKENAMOUNT <0> OP_EQUAL',
      'OP_OUTPUTTOKENAMOUNT (minting and fungible tokens, index 0, expect 0)',
      ['invalid', 'chip_cashtokens_invalid'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ token: { amount: 1000, nft: { capability: 'minting' } }, valueSatoshis: 1_000 }] } },
    ],
    [
      '<0>',
      'OP_OUTPUTTOKENAMOUNT <10000> OP_EQUAL',
      'OP_OUTPUTTOKENAMOUNT (minting and fungible tokens, index 0, 1-byte commitment)',
      ['invalid', 'chip_cashtokens'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ token: { amount: 10000, nft: { capability: 'minting', commitment: 'ff' } }, valueSatoshis: 1_000 }] } },
    ],
    [
      '<0>',
      'OP_OUTPUTTOKENAMOUNT <0> OP_EQUAL',
      'OP_OUTPUTTOKENAMOUNT (minting and fungible tokens, index 0, 1-byte commitment, expect 0)',
      ['invalid', 'chip_cashtokens_invalid'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ token: { amount: 10000, nft: { capability: 'minting', commitment: 'ff' } }, valueSatoshis: 1_000 }] } },
    ],
    [
      '<1>',
      'OP_OUTPUTTOKENAMOUNT <1000> OP_EQUAL',
      'OP_OUTPUTTOKENAMOUNT (minting and fungible tokens, index 1)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }],
        transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }, { token: { amount: 1000, nft: { capability: 'minting', commitment: 'ff' } }, valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<1>',
      'OP_OUTPUTTOKENAMOUNT <1000> OP_EQUAL',
      'OP_OUTPUTTOKENAMOUNT (non-genesis transaction, minting and fungible tokens, index 1)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: 1000, nft: { capability: 'minting', commitment: 'ff' } }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }, { token: { amount: 1000, nft: { capability: 'minting', commitment: 'ff' } }, valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<1>',
      'OP_OUTPUTTOKENAMOUNT <1000> OP_EQUAL',
      'OP_OUTPUTTOKENAMOUNT (minting and fungible tokens, index 1, category 0x00...03)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }],
        transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000003', unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }, { token: { amount: 1000, category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { capability: 'minting', commitment: 'ff' } }, valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<1>',
      'OP_OUTPUTTOKENAMOUNT <1000> OP_EQUAL',
      'OP_OUTPUTTOKENAMOUNT (non-genesis transaction, minting and fungible tokens, index 1, category 0x00...03)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: 1000, category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { capability: 'minting', commitment: 'ff' } }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], valueSatoshis: 10_000 },
        ],
        transaction: { inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }], outputs: [{ valueSatoshis: 1_000 }, { token: { amount: 1000, category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { capability: 'minting', commitment: 'ff' } }, valueSatoshis: 1_000 }] },
      },
    ],
    [
      '<8> <7> <6> <5> <4> <3> <2> <0> <1>',
      'OP_OUTPUTTOKENAMOUNT <0> OP_EQUALVERIFY OP_OUTPUTTOKENAMOUNT <0> OP_EQUALVERIFY OP_OUTPUTTOKENAMOUNT <1> OP_EQUALVERIFY OP_OUTPUTTOKENAMOUNT <4294967296> OP_EQUALVERIFY OP_OUTPUTTOKENAMOUNT <252> OP_EQUALVERIFY OP_OUTPUTTOKENAMOUNT <253> OP_EQUALVERIFY OP_OUTPUTTOKENAMOUNT <9223372036854775807> OP_EQUALVERIFY OP_OUTPUTTOKENAMOUNT <65535> OP_EQUALVERIFY OP_OUTPUTTOKENAMOUNT <4294967295> OP_EQUAL',
      'OP_OUTPUTTOKENAMOUNT (at multiple indexes, multiple categories, unordered)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { nft: {} }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: 1, nft: {} }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: 252, nft: { commitment: '01' } }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: 253, category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { capability: 'mutable' } }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: 65535, category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { capability: 'minting' } }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: 4294967295, category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { capability: 'minting' } }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: 4294967296 }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: '9223372036854775807', category: '0000000000000000000000000000000000000000000000000000000000000004' }, valueSatoshis: 10_000 },
        ],
        transaction: {
          inputs: [
            { unlockingBytecode: { script: 'unlockEmptyP2sh20' } },
            { unlockingBytecode: ['slot'] },
            { unlockingBytecode: { script: 'unlockEmptyP2sh20' } },
            { unlockingBytecode: { script: 'unlockEmptyP2sh20' } },
            { unlockingBytecode: { script: 'unlockEmptyP2sh20' } },
            { unlockingBytecode: { script: 'unlockEmptyP2sh20' } },
            { unlockingBytecode: { script: 'unlockEmptyP2sh20' } },
            { unlockingBytecode: { script: 'unlockEmptyP2sh20' } },
            { unlockingBytecode: { script: 'unlockEmptyP2sh20' } },
          ],
          outputs: [
            { valueSatoshis: 1_000 },
            { token: { nft: {} }, valueSatoshis: 1_000 },
            { token: { amount: 1, nft: {} }, valueSatoshis: 1_000 },
            { token: { amount: 4294967296 }, valueSatoshis: 1_000 },
            { token: { amount: 252, nft: { commitment: '01' } }, valueSatoshis: 1_000 },
            { token: { amount: 253, category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { capability: 'mutable' } }, valueSatoshis: 1_000 },
            { token: { amount: '9223372036854775807', category: '0000000000000000000000000000000000000000000000000000000000000004' }, valueSatoshis: 1_000 },
            { token: { amount: 65535, category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { capability: 'minting' } }, valueSatoshis: 1_000 },
            { token: { amount: 4294967295, category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { capability: 'minting' } }, valueSatoshis: 1_000 },
          ],
        },
      },
    ],
    [
      '<8> <7> <6> <5> <4> <3> <2> <0> <1>',
      'OP_OUTPUTTOKENAMOUNT <1> OP_EQUALVERIFY OP_OUTPUTTOKENAMOUNT <0> OP_EQUALVERIFY OP_OUTPUTTOKENAMOUNT <1> OP_EQUALVERIFY OP_OUTPUTTOKENAMOUNT <4294967296> OP_EQUALVERIFY OP_OUTPUTTOKENAMOUNT <252> OP_EQUALVERIFY OP_OUTPUTTOKENAMOUNT <253> OP_EQUALVERIFY OP_OUTPUTTOKENAMOUNT <9223372036854775807> OP_EQUALVERIFY OP_OUTPUTTOKENAMOUNT <65535> OP_EQUALVERIFY OP_OUTPUTTOKENAMOUNT <4294967295> OP_EQUAL',
      'OP_OUTPUTTOKENAMOUNT (at multiple indexes, multiple categories, unordered, expect incorrect amount at index 1)',
      ['invalid', 'chip_cashtokens_invalid'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { nft: {} }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: 1, nft: {} }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: 252, nft: { commitment: '01' } }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: 253, category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { capability: 'mutable' } }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: 65535, category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { capability: 'minting' } }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: 4294967295, category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { capability: 'minting' } }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: 4294967296 }, valueSatoshis: 10_000 },
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { amount: '9223372036854775807', category: '0000000000000000000000000000000000000000000000000000000000000004' }, valueSatoshis: 10_000 },
        ],
        transaction: {
          inputs: [
            { unlockingBytecode: { script: 'unlockEmptyP2sh20' } },
            { unlockingBytecode: ['slot'] },
            { unlockingBytecode: { script: 'unlockEmptyP2sh20' } },
            { unlockingBytecode: { script: 'unlockEmptyP2sh20' } },
            { unlockingBytecode: { script: 'unlockEmptyP2sh20' } },
            { unlockingBytecode: { script: 'unlockEmptyP2sh20' } },
            { unlockingBytecode: { script: 'unlockEmptyP2sh20' } },
            { unlockingBytecode: { script: 'unlockEmptyP2sh20' } },
            { unlockingBytecode: { script: 'unlockEmptyP2sh20' } },
          ],
          outputs: [
            { valueSatoshis: 1_000 },
            { token: { nft: {} }, valueSatoshis: 1_000 },
            { token: { amount: 1, nft: {} }, valueSatoshis: 1_000 },
            { token: { amount: 4294967296 }, valueSatoshis: 1_000 },
            { token: { amount: 252, nft: { commitment: '01' } }, valueSatoshis: 1_000 },
            { token: { amount: 253, category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { capability: 'mutable' } }, valueSatoshis: 1_000 },
            { token: { amount: '9223372036854775807', category: '0000000000000000000000000000000000000000000000000000000000000004' }, valueSatoshis: 1_000 },
            { token: { amount: 65535, category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { capability: 'minting' } }, valueSatoshis: 1_000 },
            { token: { amount: 4294967295, category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { capability: 'minting' } }, valueSatoshis: 1_000 },
          ],
        },
      },
    ],
    // OP_UTXOBYTECODE, OP_ACTIVEBYTECODE, and OP_OUTPUTBYTECODE remain unchanged
    [
      '<0xa914b472a266d0bd89c13706a4132ccfb16f7c3b9fcb87>',
      '<0> OP_UTXOBYTECODE OP_EQUAL',
      'OP_UTXOBYTECODE (sibling with token prefix)',
      ['invalid', 'chip_cashtokens'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockEmptyP2sh20' }, token: { nft: {} }, valueSatoshis: 10_000 },
          { lockingBytecode: ['slot'], token: { nft: {} }, valueSatoshis: 10_000 },
        ],
        transaction: {
          inputs: [{ unlockingBytecode: { script: 'unlockEmptyP2sh20' } }, { unlockingBytecode: ['slot'] }],
          outputs: [
            { token: { nft: {} }, valueSatoshis: 1_000 },
            { token: { nft: {} }, valueSatoshis: 1_000 },
          ],
        },
      },
    ],
    ['<OP_ACTIVEBYTECODE OP_EQUAL>', 'OP_ACTIVEBYTECODE OP_EQUAL', 'OP_ACTIVEBYTECODE returns the bytecode currently being evaluated (with token prefix)', ['invalid', 'chip_cashtokens'], { sourceOutputs: [{ lockingBytecode: ['slot'], token: { nft: {} }, valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ token: { nft: {} }, valueSatoshis: 1_000 }] } }],
    [
      '<OP_RETURN <"vmb_test">>',
      '<0> OP_OUTPUTBYTECODE OP_EQUAL',
      'OP_OUTPUTBYTECODE (sibling with token prefix)',
      ['invalid', 'chip_cashtokens'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], token: { nft: {} }, valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ lockingBytecode: binToHex(cashAssemblyToBin('OP_RETURN <"vmb_test">') as Uint8Array), token: { nft: {} }, valueSatoshis: 1_000 }] } },
    ],
    [
      '',
      '<0> OP_OUTPUTBYTECODE OP_SIZE <47> OP_EQUAL OP_NIP',
      'OP_OUTPUTBYTECODE includes token prefix before upgrade (length 47, expect 47)',
      ['nonstandard', 'chip_cashtokens_invalid'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ lockingBytecode: binToHex(cashAssemblyToBin('OP_RETURN <"vmb_test">') as Uint8Array), token: { amount: 253 }, valueSatoshis: 1_000 }] } },
    ],
    [
      '',
      '<0> OP_OUTPUTBYTECODE OP_SIZE <46> OP_EQUAL OP_NIP',
      'OP_OUTPUTBYTECODE includes token prefix before upgrade (length 47, expect 46)',
      ['invalid', '2022_p2sh32_nonstandard', 'chip_cashtokens_invalid'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ lockingBytecode: binToHex(cashAssemblyToBin('OP_RETURN <"vmb_test">') as Uint8Array), token: { amount: 253 }, valueSatoshis: 1_000 }] } },
    ],
    [
      '',
      '<0> OP_OUTPUTBYTECODE OP_SIZE <520> OP_EQUAL OP_NIP',
      'OP_OUTPUTBYTECODE includes token prefix before upgrade (length 520, expect 520)',
      ['nonstandard', 'chip_cashtokens_invalid'],
      {
        sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }],
        transaction: {
          inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }],
          outputs: [
            {
              lockingBytecode: binToHex(
                cashAssemblyToBin(
                  `OP_RETURN <0x${range(479)
                    .map((i) => binToHex(Uint8Array.of(i)))
                    .join('')}>`,
                ) as Uint8Array,
              ),
              token: { amount: 253 },
              valueSatoshis: 1_000,
            },
          ],
        },
      },
    ],
    [
      '',
      '<0> OP_OUTPUTBYTECODE OP_SIZE <521> OP_EQUAL OP_NIP',
      'OP_OUTPUTBYTECODE includes token prefix before upgrade (length 521, expect 521)',
      ['invalid', '2022_p2sh32_nonstandard', 'chip_cashtokens_invalid'],
      {
        sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }],
        transaction: {
          inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }],
          outputs: [
            {
              lockingBytecode: binToHex(
                cashAssemblyToBin(
                  `OP_RETURN <0x${range(480)
                    .map((i) => binToHex(Uint8Array.of(i)))
                    .join('')}>`,
                ) as Uint8Array,
              ),
              token: { amount: 253 },
              valueSatoshis: 1_000,
            },
          ],
        },
      },
    ],
    [
      '',
      '<0> OP_OUTPUTBYTECODE OP_SIZE <10> OP_EQUAL OP_NIP',
      'OP_OUTPUTBYTECODE excludes token prefix after upgrade (length 10, expect 10)',
      ['invalid', '2022_p2sh32_nonstandard', 'chip_cashtokens'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ lockingBytecode: binToHex(cashAssemblyToBin('OP_RETURN <"vmb_test">') as Uint8Array), token: { amount: 253 }, valueSatoshis: 1_000 }] } },
    ],
    [
      '',
      '<0> OP_OUTPUTBYTECODE OP_SIZE <11> OP_EQUAL OP_NIP',
      'OP_OUTPUTBYTECODE excludes token prefix after upgrade (length 10, expect 11)',
      ['invalid', '2022_p2sh32_nonstandard', 'chip_cashtokens_invalid'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }], outputs: [{ lockingBytecode: binToHex(cashAssemblyToBin('OP_RETURN <"vmb_test">') as Uint8Array), token: { amount: 253 }, valueSatoshis: 1_000 }] } },
    ],
    [
      '',
      '<0> OP_OUTPUTBYTECODE OP_SIZE <520> OP_EQUAL OP_NIP',
      'OP_OUTPUTBYTECODE excludes token prefix after upgrade (length 520, expect 520)',
      ['invalid', '2022_p2sh32_nonstandard', 'chip_cashtokens_nonstandard'],
      {
        sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }],
        transaction: {
          inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }],
          outputs: [
            {
              lockingBytecode: binToHex(
                cashAssemblyToBin(
                  `OP_RETURN <0x${range(516)
                    .map((i) => binToHex(Uint8Array.of(i)))
                    .join('')}>`,
                ) as Uint8Array,
              ),
              token: { amount: 253 },
              valueSatoshis: 1_000,
            },
          ],
        },
      },
    ],
    [
      '',
      '<0> OP_OUTPUTBYTECODE OP_SIZE <521> OP_EQUAL OP_NIP',
      'OP_OUTPUTBYTECODE excludes token prefix after upgrade (length 521, expect 521)',
      ['invalid', '2022_p2sh32_nonstandard', 'chip_cashtokens_invalid'],
      {
        sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }],
        transaction: {
          inputs: [{ outpointTransactionHash: '0000000000000000000000000000000000000000000000000000000000000002', unlockingBytecode: ['slot'] }],
          outputs: [
            {
              lockingBytecode: binToHex(
                cashAssemblyToBin(
                  `OP_RETURN <0x${range(517)
                    .map((i) => binToHex(Uint8Array.of(i)))
                    .join('')}>`,
                ) as Uint8Array,
              ),
              token: { amount: 253 },
              valueSatoshis: 1_000,
            },
          ],
        },
      },
    ],
  ],
];
