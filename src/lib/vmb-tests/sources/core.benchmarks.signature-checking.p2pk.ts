import type { VmbTestDefinitionGroup } from '../../lib.js';
import { minimalScenarioStandard, packedTransactionScenario } from '../bch-vmb-test-mixins.js';

export default [
  [
    'Transaction validation benchmarks',
    [
      ['<key1.schnorr_signature.default>', '<key1.public_key> OP_CHECKSIG', 'Within BCH_2023_05 standard limits, P2PK input, 1 output (Schnorr signature)', ['p2s_standard', 'p2sh_ignore'], minimalScenarioStandard],
      ['<key1.schnorr_signature.default>', '<key1.public_key> OP_CHECKSIG', 'Within BCH_2023_05 standard limits, packed P2PK inputs, 1 output (all Schnorr signatures)', ['p2s_standard', 'p2sh_ignore'], packedTransactionScenario('p2s', 933)],
      ['<key1.ecdsa_signature.default>', '<key1.public_key> OP_CHECKSIG', 'Within BCH_2023_05 standard limits, P2PK input, 1 output (ECDSA signature)', ['p2s_standard', 'p2sh_ignore'], minimalScenarioStandard],
      ['<key1.ecdsa_signature.default>', '<key1.public_key> OP_CHECKSIG', 'Within BCH_2023_05 standard limits, packed P2PK inputs, 1 output (all ECDSA signatures)', ['p2s_standard', 'p2sh_ignore'], packedTransactionScenario('p2s', 879)],
    ],
  ],
] as const satisfies VmbTestDefinitionGroup[];
