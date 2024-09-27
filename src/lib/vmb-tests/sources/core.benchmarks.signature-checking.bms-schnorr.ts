import type { VmbTestDefinitionGroup } from '../../lib.js';
import { minimalScenarioStandard, packedTransactionScenario } from '../bch-vmb-test-mixins.js';

export default [
  [
    'Transaction validation benchmarks',
    [
      ['<0b001> <key1.schnorr_signature.default>', '<1> <key1.public_key> <key2.public_key> <key3.public_key> OP_3 OP_CHECKMULTISIG', 'Within BCH_2023_05 standard limits, 1-of-3 bare multisig input, 1 output (Schnorr signature)', ['nop2sh_standard', 'p2sh_ignore'], minimalScenarioStandard],
      ['<0b001> <key1.schnorr_signature.default>', '<1> <key1.public_key> <key2.public_key> <key3.public_key> OP_3 OP_CHECKMULTISIG', 'Within BCH_2023_05 standard limits, packed 1-of-3 bare multisig inputs, 1 output (all Schnorr signatures)', ['nop2sh_standard', 'p2sh_ignore'], packedTransactionScenario('nop2sh', 924)],
    ],
  ],
] as const satisfies VmbTestDefinitionGroup[];
