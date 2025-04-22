import type { VmbTestDefinitionGroup } from '../../lib.js';
import { minimalScenarioStandard, packedTransactionScenario } from '../bch-vmb-test-mixins.js';

export default [
  [
    'Transaction validation benchmarks',
    [
      ['<key1.schnorr_signature.all_outputs> <key1.public_key>', 'OP_DUP OP_HASH160 <$(<key1.public_key> OP_HASH160)> OP_EQUALVERIFY OP_CHECKSIG', 'Within BCH_2023_05 standard limits, P2PKH input, 1 output (Schnorr signature)', ['p2s_standard', 'p2sh_ignore'], minimalScenarioStandard],
      ['<key1.schnorr_signature.all_outputs> <key1.public_key>', 'OP_DUP OP_HASH160 <$(<key1.public_key> OP_HASH160)> OP_EQUALVERIFY OP_CHECKSIG', 'Within BCH_2023_05 standard limits, packed P2PKH inputs, 1 output (all Schnorr signatures)', ['p2s_standard', 'p2sh_ignore'], packedTransactionScenario('p2s', 708)],
      ['<key1.ecdsa_signature.all_outputs> <key1.public_key>', 'OP_DUP OP_HASH160 <$(<key1.public_key> OP_HASH160)> OP_EQUALVERIFY OP_CHECKSIG', 'Within BCH_2023_05 standard limits, P2PKH input, 1 output (ECDSA signature)', ['p2s_standard', 'p2sh_ignore'], minimalScenarioStandard],
      ['<key1.ecdsa_signature.all_outputs> <key1.public_key>', 'OP_DUP OP_HASH160 <$(<key1.public_key> OP_HASH160)> OP_EQUALVERIFY OP_CHECKSIG', 'Within BCH_2023_05 standard limits, packed P2PKH inputs, 1 output (all ECDSA signatures)', ['p2s_standard', 'p2sh_ignore'], packedTransactionScenario('p2s', 676)],
    ],
  ],
] as const satisfies VmbTestDefinitionGroup[];
