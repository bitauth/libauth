/**
 * See `bch-vmb-tests.ts` for details about modifying this file.
 */

import type { AuthenticationTemplateScenario, VmbTestDefinition, VmbTestDefinitionGroup } from '../lib';

import { simpleP2pkhInput, simpleP2pkhOutput } from './bch-vmb-test-mixins.js';

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
const akaMap: { [key in typeof algorithms[number]]: string } = {
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

const changeScenario = (testDefinitions: VmbTestDefinition[], appendDescription: string, newScenario: AuthenticationTemplateScenario) => testDefinitions.map<VmbTestDefinition>(([unlockingScript, redeemOrLockingScript, testDescription, testSetOverrideLabels]) => [unlockingScript, redeemOrLockingScript, `${testDescription}${appendDescription}`, testSetOverrideLabels, newScenario]);

const verifyAlgorithmWithP2pkhInput = changeScenario(verifyAlgorithm, ' (with P2PKH input)', { sourceOutputs: [simpleP2pkhOutput, { lockingBytecode: ['slot'], valueSatoshis: 10_000 }], transaction: { inputs: [simpleP2pkhInput, { unlockingBytecode: ['slot'] }], outputs: [{ lockingBytecode: { script: 'vmbTestNullData' }, valueSatoshis: 0 }] } });

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
    ...verifyAlgorithmWithP2pkhInput,
  ],
];
