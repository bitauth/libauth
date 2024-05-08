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

const signatureTypes = [
  ['schnorr signature', 'schnorr_signature'],
  ['ECDSA signature', 'ecdsa_signature'],
] as const;

const opcodePatterns = [
  ['single sig', 'OP_2DUP OP_CHECKSIG OP_VERIFY OP_2DUP OP_CHECKSIGVERIFY'],
  ['1-of-1 multisig', 'OP_2DUP OP_0 OP_ROT OP_ROT OP_1 OP_SWAP OP_1 OP_CHECKMULTISIG OP_VERIFY OP_2DUP OP_0 OP_ROT OP_ROT OP_1 OP_SWAP OP_1 OP_CHECKMULTISIGVERIFY'],
  ['1-of-2 multisig (second key)', 'OP_2DUP <0> OP_ROT OP_ROT <1> OP_SWAP <key2.public_key> OP_SWAP <2> OP_CHECKMULTISIG OP_VERIFY OP_2DUP <0> OP_ROT OP_ROT <1> OP_SWAP <key2.public_key> OP_SWAP <2> OP_CHECKMULTISIGVERIFY'],
  ['1-of-3 multisig (middle key)', 'OP_2DUP <0> OP_ROT OP_ROT <1> OP_SWAP <key2.public_key> OP_SWAP <key3.public_key> <3> OP_CHECKMULTISIG OP_VERIFY OP_2DUP <0> OP_ROT OP_ROT <1> OP_SWAP <key2.public_key> OP_SWAP <key3.public_key> <3> OP_CHECKMULTISIGVERIFY'],
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

// TODO: implement and verify schnorr multisig
const combinatorial = algorithms.flatMap((algorithm) => signatureTypes.flatMap((signatureType) => opcodePatterns.flatMap((pattern) => [true, false].map((valid) => [algorithm, signatureType, pattern, valid] as const)))).filter(([_, signatureType, pattern]) => signatureType !== signatureTypes[0] || pattern === opcodePatterns[0]);

const verifyAlgorithm = combinatorial.map<VmbTestDefinition>(([algorithm, signatureType, pattern, valid]) => [
  `<signing_serialization.full_${algorithm}> <${valid ? 'key1' : 'key2'}.${signatureType[1]}.${algorithm}>`,
  `<key1.public_key> ${pattern[1]} OP_SWAP OP_SIZE <1> OP_SUB OP_SPLIT OP_DROP OP_ROT OP_SHA256 OP_ROT OP_3DUP OP_CHECKDATASIGVERIFY OP_CHECKDATASIG`,
  `verify algorithm - ${algorithm} (${akaMap[algorithm]}), ${signatureType[0]}, ${pattern[0]}, ${valid ? 'valid' : 'check failure'}`,
  !valid || algorithm.includes('INVALID') ? ['invalid'] : [],
  { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ lockingBytecode: { script: 'vmbTestNullData' }, valueSatoshis: 0 }] } },
]);

// eslint-disable-next-line @typescript-eslint/max-params
const changeScenario = (testDefinitions: VmbTestDefinition[], appendDescription: string, newScenario: WalletTemplateScenario, labelChanger: (labels: NonNullable<VmbTestDefinition['3']>) => NonNullable<VmbTestDefinition['3']> = (labels) => labels) =>
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  testDefinitions.map<VmbTestDefinition>(([unlockingScript, redeemOrLockingScript, testDescription, testSetOverrideLabels]) => [unlockingScript, redeemOrLockingScript, `${testDescription}${appendDescription}`, labelChanger(testSetOverrideLabels!), newScenario]);

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

const verifyAlgorithmWithTokensInMultipleInputsAndOutputs = changeScenario(verifyAlgorithm, ' (with all token types in multiple inputs and outputs)', {
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
});

export const signingSerializationTestDefinitionsBch: VmbTestDefinitionGroup = [
  'Signing serializations',
  [
    ...verifyAlgorithm,
    [
      `<signing_serialization.full_default> <key1.schnorr_signature.default>`,
      '<key1.public_key> OP_2DUP OP_CHECKSIGVERIFY OP_SWAP OP_SIZE <1> OP_SUB OP_SPLIT OP_DROP OP_ROT OP_SHA256 OP_ROT OP_CHECKDATASIG',
      `verify algorithm - default (A.K.A. all_outputs_all_utxos, SIGHASH_ALL|SIGHASH_UTXOS|SIGHASH_FORKID)`,
      [],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 11_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ lockingBytecode: { script: 'vmbTestNullData' }, valueSatoshis: 0 }] } },
    ],
    [
      `<signing_serialization.full_default> <0x199d5a593615f64e79b912f310984280dd90482b97d257230bc9d3ce36c09c70d6d47b35a6a3e71471d8cffb705c97208d8cd49621142e696532a6c9cf37ca9061>`,
      '<key1.public_key> OP_2DUP OP_CHECKSIGVERIFY OP_SWAP OP_SIZE <1> OP_SUB OP_SPLIT OP_DROP OP_ROT OP_SHA256 OP_ROT OP_CHECKDATASIG',
      `verify algorithm - all_outputs_all_utxos test with SIGHASH_FORKID (A.K.A. SIGHASH_ALL|SIGHASH_UTXOS|SIGHASH_FORKID)`,
      ['p2sh_ignore'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 12_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ lockingBytecode: { script: 'vmbTestNullData' }, valueSatoshis: 0 }] } },
    ],
    [
      `<signing_serialization.full_default> <0x199d5a593615f64e79b912f310984280dd90482b97d257230bc9d3ce36c09c70d6d47b35a6a3e71471d8cffb705c97208d8cd49621142e696532a6c9cf37ca9021>`,
      '<key1.public_key> OP_2DUP OP_CHECKSIGVERIFY OP_SWAP OP_SIZE <1> OP_SUB OP_SPLIT OP_DROP OP_ROT OP_SHA256 OP_ROT OP_CHECKDATASIG',
      `verify algorithm - all_outputs_all_utxos test without SIGHASH_FORKID (invalid) (A.K.A. SIGHASH_ALL|SIGHASH_UTXOS)`,
      ['invalid', 'p2sh_ignore'],
      { sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 12_000 }], transaction: { inputs: [{ unlockingBytecode: ['slot'] }], outputs: [{ lockingBytecode: { script: 'vmbTestNullData' }, valueSatoshis: 0 }] } },
    ],
    ...verifyAlgorithmWithP2pkhInput,
    ...verifyAlgorithmWithP2pkhInputAndOutput,
    ...verifyAlgorithmWithP2pkhInputAndTwoOutputs,
    ...verifyAlgorithmWithMultipleInputsAndOutputs,
    ...verifyAlgorithmWithTokensInMultipleInputsAndOutputs,
  ],
];
