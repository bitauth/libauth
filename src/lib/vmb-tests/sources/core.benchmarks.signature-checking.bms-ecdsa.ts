import type { VmbTestDefinitionGroup } from '../../lib.js';
import { minimalScenarioStandard, packedTransactionScenario } from '../bch-vmb-test-mixins.js';

export default [
  [
    'Transaction validation benchmarks',
    [
      ['<0> <key1.ecdsa_signature.default>', '<1> <key1.public_key> <key2.public_key> <key3.public_key> OP_3 OP_CHECKMULTISIG', 'Within BCH_2023_05 standard limits, 1-of-3 bare multisig input, 1 output (ECDSA signature, bottom slot)', ['nop2sh_standard', 'p2sh_ignore'], minimalScenarioStandard],
      ['<0> <key1.ecdsa_signature.default>', '<1> <key1.public_key> <key2.public_key> <key3.public_key> OP_3 OP_CHECKMULTISIG', 'Within BCH_2023_05 standard limits, packed 1-of-3 bare multisig inputs, 1 output (all ECDSA signatures, bottom slot)', ['nop2sh_standard', 'p2sh_ignore'], packedTransactionScenario('nop2sh', 872)],
      ['<0> <key1.ecdsa_signature.default>', '<1> <key3.public_key> <key2.public_key> <key1.public_key> OP_3 OP_CHECKMULTISIG', 'Within BCH_2023_05 standard limits, 1-of-3 bare multisig input, 1 output (ECDSA signature, top slot)', ['nop2sh_standard', 'p2sh_ignore'], minimalScenarioStandard],
      ['<0> <key1.ecdsa_signature.default>', '<1> <key3.public_key> <key2.public_key> <key1.public_key> OP_3 OP_CHECKMULTISIG', 'Within BCH_2023_05 standard limits, packed 1-of-3 bare multisig inputs, 1 output (all ECDSA signatures, top slot)', ['nop2sh_standard', 'p2sh_ignore'], packedTransactionScenario('nop2sh', 872)],
    ],
  ],
] as const satisfies VmbTestDefinitionGroup[];
