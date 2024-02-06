/**
 * See `bch-vmb-tests.ts` for details about modifying this file.
 */

import type { VmbTestDefinition, VmbTestDefinitionGroup, WalletTemplateScenario } from '../lib.js';

import { emptyP2sh20Input, emptyP2sh20Output, simpleP2pkhInput, simpleP2pkhOutput } from './bch-vmb-test-mixins.js';

const algorithms = [
  'all_outputs_all_utxos',
  'all_outputs_single_input_INVALID_all_utxos',
  'all_outputs_single_input',
  'all_outputs',
  'corresponding_output_all_utxos',
  'corresponding_output_single_input_INVALID_all_utxos',
  'corresponding_output_single_input',
  'corresponding_output',
  'no_outputs_all_utxos',
  'no_outputs_single_input_INVALID_all_utxos',
  'no_outputs_single_input',
  'no_outputs',
] as const;

/* eslint-disable @typescript-eslint/naming-convention, camelcase */
const akaMap: { [key in (typeof algorithms)[number]]: string } = {
  all_outputs: 'SIGHASH_ALL|SIGHASH_FORKID',
  all_outputs_all_utxos: 'SIGHASH_ALL|SIGHASH_UTXOS|SIGHASH_FORKID',
  all_outputs_single_input: 'SIGHASH_ALL|SIGHASH_FORKID|ANYONECANPAY',
  all_outputs_single_input_INVALID_all_utxos: 'SIGHASH_ALL|SIGHASH_UTXOS|SIGHASH_FORKID|ANYONECANPAY',
  corresponding_output: 'SIGHASH_SINGLE|SIGHASH_FORKID',
  corresponding_output_all_utxos: 'SIGHASH_SINGLE|SIGHASH_UTXOS|SIGHASH_FORKID',
  corresponding_output_single_input: 'SIGHASH_SINGLE|SIGHASH_FORKID|ANYONECANPAY',
  corresponding_output_single_input_INVALID_all_utxos: 'SIGHASH_SINGLE|SIGHASH_UTXOS|SIGHASH_FORKID|ANYONECANPAY',
  no_outputs: 'SIGHASH_NONE|SIGHASH_FORKID',
  no_outputs_all_utxos: 'SIGHASH_NONE|SIGHASH_UTXOS|SIGHASH_FORKID',
  no_outputs_single_input: 'SIGHASH_NONE|SIGHASH_FORKID|ANYONECANPAY',
  no_outputs_single_input_INVALID_all_utxos: 'SIGHASH_NONE|SIGHASH_UTXOS|SIGHASH_FORKID|ANYONECANPAY',
};
/* eslint-enable @typescript-eslint/naming-convention, camelcase */

const verifyAlgorithm = algorithms.map<VmbTestDefinition>((algorithm) => [
  `<signing_serialization.full_${algorithm}> <key1.schnorr_signature.${algorithm}>`,
  '<key1.public_key> OP_2DUP OP_CHECKSIGVERIFY OP_SWAP OP_SIZE <1> OP_SUB OP_SPLIT OP_DROP OP_ROT OP_SHA256 OP_ROT OP_CHECKDATASIG',
  `verify algorithm - ${algorithm} (${akaMap[algorithm]})`,
  algorithm.includes('all_utxos') ? (algorithm.includes('INVALID') ? ['chip_cashtokens_invalid'] : ['chip_cashtokens']) : ['default', 'chip_cashtokens'],
  { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ lockingBytecode: { script: 'vmbTestNullData' }, valueSatoshis: 0 }] } },
]);

const changeScenario = (testDefinitions: VmbTestDefinition[], appendDescription: string, newScenario: WalletTemplateScenario) => testDefinitions.map<VmbTestDefinition>(([unlockingScript, redeemOrLockingScript, testDescription, testSetOverrideLabels]) => [unlockingScript, redeemOrLockingScript, `${testDescription}${appendDescription}`, testSetOverrideLabels, newScenario]);

const verifyAlgorithmWithP2pkhInput = changeScenario(verifyAlgorithm, ' (with P2PKH input)', { sourceOutputs: [simpleP2pkhOutput, { lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [simpleP2pkhInput, { unlockingBytecode: ['slot'] }], outputs: [{ lockingBytecode: { script: 'vmbTestNullData' }, valueSatoshis: 0 }] } });

const verifyAlgorithmWithP2pkhInputAndOutput = changeScenario(verifyAlgorithm, ' (with P2PKH input, P2PKH output)', { sourceOutputs: [simpleP2pkhOutput, { lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [simpleP2pkhInput, { unlockingBytecode: ['slot'] }], outputs: [{ lockingBytecode: { script: 'lockP2pkh' }, valueSatoshis: 1_000 }] } });

const verifyAlgorithmWithP2pkhInputAndTwoOutputs = changeScenario(verifyAlgorithm, ' (with P2PKH input, 2 P2PKH outputs)', {
  sourceOutputs: [simpleP2pkhOutput, { lockingBytecode: ['slot'], valueSatoshis: 10_000 }],
  transaction: {
    inputs: [simpleP2pkhInput, { unlockingBytecode: ['slot'] }],
    outputs: [
      { lockingBytecode: { script: 'lockP2pkh' }, valueSatoshis: 1_000 },
      { lockingBytecode: { script: 'lockP2pkh' }, valueSatoshis: 1_000 },
    ],
  },
});

const verifyAlgorithmWithMultipleInputsAndOutputs = changeScenario(verifyAlgorithm, ' (with multiple inputs and outputs)', {
  sourceOutputs: [simpleP2pkhOutput, { lockingBytecode: ['slot'], valueSatoshis: 10_000 }, simpleP2pkhOutput, emptyP2sh20Output, emptyP2sh20Output],
  transaction: {
    inputs: [simpleP2pkhInput, { unlockingBytecode: ['slot'] }, simpleP2pkhInput, emptyP2sh20Input, emptyP2sh20Input],
    outputs: [
      { lockingBytecode: { script: 'lockP2pkh' }, valueSatoshis: 1_000 },
      { lockingBytecode: { script: 'lockP2pkh' }, valueSatoshis: 1_000 },
      { lockingBytecode: { script: 'lockP2pkh' }, valueSatoshis: 1_000 },
      { lockingBytecode: { script: 'lockP2pkh' }, valueSatoshis: 1_000 },
      { lockingBytecode: { script: 'lockP2pkh' }, valueSatoshis: 1_000 },
    ],
  },
});

const verifyAlgorithmWithTokensInMultipleInputsAndOutputs = algorithms.map<VmbTestDefinition>((algorithm) => [
  `<signing_serialization.full_${algorithm}> <key1.schnorr_signature.${algorithm}>`,
  '<key1.public_key> OP_2DUP OP_CHECKSIGVERIFY OP_SWAP OP_SIZE <1> OP_SUB OP_SPLIT OP_DROP OP_ROT OP_SHA256 OP_ROT OP_CHECKDATASIG',
  `verify algorithm - ${algorithm} (${akaMap[algorithm]}) (with all token types in multiple inputs and outputs)`,
  algorithm.includes('all_utxos') ? (algorithm.includes('INVALID') ? ['chip_cashtokens_invalid'] : ['chip_cashtokens']) : ['invalid', 'chip_cashtokens'],
  {
    sourceOutputs: [
      { ...simpleP2pkhOutput, token: { category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { capability: 'minting' } } },
      { lockingBytecode: ['slot'], token: { amount: 100, nft: { capability: 'mutable', commitment: 'ff' } }, valueSatoshis: 10_000 },
      { ...simpleP2pkhOutput, token: { nft: { commitment: '010203' } } },
      { ...emptyP2sh20Output, token: { amount: 1_000_000 } },
      emptyP2sh20Output,
    ],
    transaction: {
      inputs: [simpleP2pkhInput, { unlockingBytecode: ['slot'] }, simpleP2pkhInput, emptyP2sh20Input, emptyP2sh20Input],
      outputs: [
        { lockingBytecode: { script: 'lockP2pkh' }, token: { category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { capability: 'minting', commitment: 'abcdef' } }, valueSatoshis: 1_000 },
        { lockingBytecode: { script: 'lockP2pkh' }, token: { category: '0000000000000000000000000000000000000000000000000000000000000003', nft: { capability: 'minting', commitment: '0102030405' } }, valueSatoshis: 1_000 },
        { lockingBytecode: { script: 'lockP2pkh' }, token: { amount: 1_000_100, nft: { commitment: '010203' } }, valueSatoshis: 1_000 },
        { lockingBytecode: { script: 'lockP2pkh' }, token: { nft: { capability: 'mutable', commitment: 'ffffff' } }, valueSatoshis: 1_000 },
        { lockingBytecode: { script: 'lockP2pkh' }, valueSatoshis: 1_000 },
      ],
    },
  },
]);

export const signingSerializationTestDefinitionsBCH: VmbTestDefinitionGroup = [
  'Signing serializations',
  [
    ...verifyAlgorithm,
    [
      `<signing_serialization.full_default> <key1.schnorr_signature.default>`,
      '<key1.public_key> OP_2DUP OP_CHECKSIGVERIFY OP_SWAP OP_SIZE <1> OP_SUB OP_SPLIT OP_DROP OP_ROT OP_SHA256 OP_ROT OP_CHECKDATASIG',
      `verify algorithm - default (A.K.A. all_outputs_all_utxos, SIGHASH_ALL|SIGHASH_UTXOS|SIGHASH_FORKID)`,
      ['chip_cashtokens'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 11_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ lockingBytecode: { script: 'vmbTestNullData' }, valueSatoshis: 0 }] } },
    ],
    [
      `<signing_serialization.full_default> <0x199d5a593615f64e79b912f310984280dd90482b97d257230bc9d3ce36c09c70d6d47b35a6a3e71471d8cffb705c97208d8cd49621142e696532a6c9cf37ca9061>`,
      '<key1.public_key> OP_2DUP OP_CHECKSIGVERIFY OP_SWAP OP_SIZE <1> OP_SUB OP_SPLIT OP_DROP OP_ROT OP_SHA256 OP_ROT OP_CHECKDATASIG',
      `verify algorithm - all_outputs_all_utxos test with SIGHASH_FORKID (A.K.A. SIGHASH_ALL|SIGHASH_UTXOS|SIGHASH_FORKID)`,
      ['invalid', 'chip_cashtokens', 'p2sh_ignore'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 12_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ lockingBytecode: { script: 'vmbTestNullData' }, valueSatoshis: 0 }] } },
    ],
    [
      `<signing_serialization.full_default> <0x199d5a593615f64e79b912f310984280dd90482b97d257230bc9d3ce36c09c70d6d47b35a6a3e71471d8cffb705c97208d8cd49621142e696532a6c9cf37ca9021>`,
      '<key1.public_key> OP_2DUP OP_CHECKSIGVERIFY OP_SWAP OP_SIZE <1> OP_SUB OP_SPLIT OP_DROP OP_ROT OP_SHA256 OP_ROT OP_CHECKDATASIG',
      `verify algorithm - all_outputs_all_utxos test without SIGHASH_FORKID (invalid) (A.K.A. SIGHASH_ALL|SIGHASH_UTXOS)`,
      ['invalid', 'chip_cashtokens_invalid', 'p2sh_ignore'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 12_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ lockingBytecode: { script: 'vmbTestNullData' }, valueSatoshis: 0 }] } },
    ],
    ...verifyAlgorithmWithP2pkhInput,
    ...verifyAlgorithmWithP2pkhInputAndOutput,
    ...verifyAlgorithmWithP2pkhInputAndTwoOutputs,
    ...verifyAlgorithmWithMultipleInputsAndOutputs,
    ...verifyAlgorithmWithTokensInMultipleInputsAndOutputs,
  ],
];
