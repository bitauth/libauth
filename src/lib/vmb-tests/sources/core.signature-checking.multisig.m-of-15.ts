import type { PossibleTestValue, VmbTestDefinitionGroup } from '../../lib.js';
import { generateTestCases, setExpectedResults } from '../bch-vmb-test-utils.js';

const signatureAlgorithms: PossibleTestValue[] = [
  ['ECDSA', 'ecdsa'],
  ['Schnorr', 'schnorr'],
];

export default [
  [
    'Signature checking',
    [
      ...setExpectedResults(
        generateTestCases(
          ['<$0> <$1.$2_signature.all_outputs>', '<1> <key1.public_key> <key2.public_key> <key3.public_key> <key4.public_key> <key5.public_key> <key6.public_key> <key7.public_key> <key8.public_key> <key9.public_key> <key10.public_key> <key11.public_key> <key12.public_key> <key13.public_key> <key14.public_key> <key15.public_key> <15> OP_CHECKMULTISIG', '1-of-15 multisig with $0 ($2 $1)'],
          [
            [
              ['checkBits of zero', '0'],
              ['checkBits of padded zero', '0x0000'],
              ['checkBits of key 1', '0b00000001 0x00'],
              ['checkBits of key 7', '0b1000000 0x00'],
              ['checkBits of key 15', '0x00 0b1000000'],
            ],
            [
              ['key 1', 'key1'],
              ['key 7', 'key7'],
              ['key 15', 'key15'],
            ],
            signatureAlgorithms,
          ],
        ),
        {
          '1-of-15 multisig with checkBits of key 1 (ECDSA key 1)': ['invalid'],
          '1-of-15 multisig with checkBits of key 1 (ECDSA key 15)': ['invalid'],
          '1-of-15 multisig with checkBits of key 1 (ECDSA key 7)': ['invalid'],
          '1-of-15 multisig with checkBits of key 1 (Schnorr key 1)': ['nop2sh_standard'],
          '1-of-15 multisig with checkBits of key 1 (Schnorr key 15)': ['invalid'],
          '1-of-15 multisig with checkBits of key 1 (Schnorr key 7)': ['invalid'],
          '1-of-15 multisig with checkBits of key 15 (ECDSA key 1)': ['invalid'],
          '1-of-15 multisig with checkBits of key 15 (ECDSA key 15)': ['invalid'],
          '1-of-15 multisig with checkBits of key 15 (ECDSA key 7)': ['invalid'],
          '1-of-15 multisig with checkBits of key 15 (Schnorr key 1)': ['invalid'],
          '1-of-15 multisig with checkBits of key 15 (Schnorr key 15)': ['nop2sh_standard'],
          '1-of-15 multisig with checkBits of key 15 (Schnorr key 7)': ['invalid'],
          '1-of-15 multisig with checkBits of key 7 (ECDSA key 1)': ['invalid'],
          '1-of-15 multisig with checkBits of key 7 (ECDSA key 15)': ['invalid'],
          '1-of-15 multisig with checkBits of key 7 (ECDSA key 7)': ['invalid'],
          '1-of-15 multisig with checkBits of key 7 (Schnorr key 1)': ['invalid'],
          '1-of-15 multisig with checkBits of key 7 (Schnorr key 15)': ['invalid'],
          '1-of-15 multisig with checkBits of key 7 (Schnorr key 7)': ['nop2sh_standard'],
          '1-of-15 multisig with checkBits of padded zero (ECDSA key 1)': ['invalid'],
          '1-of-15 multisig with checkBits of padded zero (ECDSA key 15)': ['invalid'],
          '1-of-15 multisig with checkBits of padded zero (ECDSA key 7)': ['invalid'],
          '1-of-15 multisig with checkBits of padded zero (Schnorr key 1)': ['invalid'],
          '1-of-15 multisig with checkBits of padded zero (Schnorr key 15)': ['invalid'],
          '1-of-15 multisig with checkBits of padded zero (Schnorr key 7)': ['invalid'],
          '1-of-15 multisig with checkBits of zero (ECDSA key 1)': ['nop2sh_invalid', '2023_nop2sh_nonstandard'],
          '1-of-15 multisig with checkBits of zero (ECDSA key 15)': ['nop2sh_invalid', '2023_nop2sh_nonstandard'],
          '1-of-15 multisig with checkBits of zero (ECDSA key 7)': ['nop2sh_invalid', '2023_nop2sh_nonstandard'],
          '1-of-15 multisig with checkBits of zero (Schnorr key 1)': ['invalid'],
          '1-of-15 multisig with checkBits of zero (Schnorr key 15)': ['invalid'],
          '1-of-15 multisig with checkBits of zero (Schnorr key 7)': ['invalid'],
        },
      ),
      [
        '<0> <key1.ecdsa_signature.all_outputs> <key2.ecdsa_signature.all_outputs>',
        '<2> <key1.public_key> <key2.public_key> <key3.public_key> <key4.public_key> <key5.public_key> <key6.public_key> <key7.public_key> <key8.public_key> <key9.public_key> <key10.public_key> <key11.public_key> <key12.public_key> <key13.public_key> <key14.public_key> <key15.public_key> <15> OP_CHECKMULTISIG',
        '2-of-15 ECDSA multisig (keys 1 and 2)',
        ['nop2sh_invalid', '2023_nop2sh_nonstandard'],
      ],
      ['<0> <0> <0>', '<2> <key1.public_key> <key2.public_key> <key3.public_key> <key4.public_key> <key5.public_key> <key6.public_key> <key7.public_key> <key8.public_key> <key9.public_key> <key10.public_key> <key11.public_key> <key12.public_key> <key13.public_key> <key14.public_key> <key15.public_key> <15> OP_CHECKMULTISIG OP_NOT', '2-of-15 ECDSA multisig (null signatures)', []],
      [
        '<0b11 0x00> <key1.schnorr_signature.all_outputs> <key2.schnorr_signature.all_outputs>',
        '<2> <key1.public_key> <key2.public_key> <key3.public_key> <key4.public_key> <key5.public_key> <key6.public_key> <key7.public_key> <key8.public_key> <key9.public_key> <key10.public_key> <key11.public_key> <key12.public_key> <key13.public_key> <key14.public_key> <key15.public_key> <15> OP_CHECKMULTISIG',
        '2-of-15 Schnorr multisig (keys 1 and 2)',
        ['nop2sh_standard'],
      ],
      [
        '<0b11 0x00> <0> <0>',
        '<2> <key1.public_key> <key2.public_key> <key3.public_key> <key4.public_key> <key5.public_key> <key6.public_key> <key7.public_key> <key8.public_key> <key9.public_key> <key10.public_key> <key11.public_key> <key12.public_key> <key13.public_key> <key14.public_key> <key15.public_key> <15> OP_CHECKMULTISIG OP_NOT',
        '2-of-15 Schnorr multisig (null signatures)',
        ['invalid'],
      ],
    ],
  ],
] as const satisfies VmbTestDefinitionGroup[];
