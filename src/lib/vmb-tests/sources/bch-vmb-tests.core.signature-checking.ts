/**
 * See `bch-vmb-tests.ts` for details about modifying this file.
 */

import type { VmbTestDefinitionGroup } from '../../lib.js';

export const limitsTestDefinitionsBch: VmbTestDefinitionGroup = [
  'Signature checking',
  [
    ['<0> <key1.schnorr_signature.all_outputs>', '<1> <key1.public_key> <key2.public_key> <key3.public_key> OP_3 OP_CHECKMULTISIG', '1-of-3 ECDSA multisig'],
    ['<0b001> <key1.schnorr_signature.all_outputs>', '<1> <key1.public_key> <key2.public_key> <key3.public_key> OP_3 OP_CHECKMULTISIG', '1-of-3 Schnorr multisig'],
    ['<0> <key7.schnorr_signature.all_outputs>', '<1> <key1.public_key> <key2.public_key> <key3.public_key> <key4.public_key> <key5.public_key> <key6.public_key> <key7.public_key> <key8.public_key> <key9.public_key> <key10.public_key> <key11.public_key> <key12.public_key> <key13.public_key> <key14.public_key> <key15.public_key> <15> OP_CHECKMULTISIG', '1-of-15 ECDSA multisig'],
    ['<0b1> <key1.schnorr_signature.all_outputs>', '<1> <key1.public_key> <key2.public_key> <key3.public_key> <key4.public_key> <key5.public_key> <key6.public_key> <key7.public_key> <key8.public_key> <key9.public_key> <key10.public_key> <key11.public_key> <key12.public_key> <key13.public_key> <key14.public_key> <key15.public_key> <15> OP_CHECKMULTISIG', '1-of-15 Schnorr multisig (key 1)'],
    ['<0b10000000> <key7.schnorr_signature.all_outputs>', '<1> <key1.public_key> <key2.public_key> <key3.public_key> <key4.public_key> <key5.public_key> <key6.public_key> <key7.public_key> <key8.public_key> <key9.public_key> <key10.public_key> <key11.public_key> <key12.public_key> <key13.public_key> <key14.public_key> <key15.public_key> <15> OP_CHECKMULTISIG', '1-of-15 Schnorr multisig (key 7)'],
    [
      '<0b00000000 0b01000000> <key15.schnorr_signature.all_outputs>',
      '<1> <key1.public_key> <key2.public_key> <key3.public_key> <key4.public_key> <key5.public_key> <key6.public_key> <key7.public_key> <key8.public_key> <key9.public_key> <key10.public_key> <key11.public_key> <key12.public_key> <key13.public_key> <key14.public_key> <key15.public_key> <15> OP_CHECKMULTISIG',
      '1-of-15 Schnorr multisig (key 7)',
    ],
    ['<0b00000000 0b01000000 0b00001000> <key2.schnorr_signature.all_outputs> <key3.schnorr_signature.all_outputs>', '<2> <key1.public_key> OP_DUP OP_DUP OP_DUP OP_DUP OP_DUP OP_DUP OP_DUP OP_DUP OP_DUP OP_DUP OP_DUP OP_DUP OP_DUP <key2.public_key> OP_OVER OP_DUP OP_DUP OP_DUP <key3.public_key> <20> OP_CHECKMULTISIG', '1-of-20 Schnorr multisig (keys 15 and 20)'],
    ['<0b00000000 0b01000000 0b00001000> <key2.schnorr_signature.all_outputs> <key3.schnorr_signature.all_outputs>', '<2> <0> OP_DUP OP_DUP OP_DUP OP_DUP OP_DUP OP_DUP OP_DUP OP_DUP OP_DUP OP_DUP OP_DUP OP_DUP OP_DUP <key2.public_key> OP_OVER OP_DUP OP_DUP OP_DUP <key3.public_key> <20> OP_CHECKMULTISIG', '1-of-20 Schnorr multisig (keys 15 and 20, others invalid)'],
  ],
];
