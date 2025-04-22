import { secp256k1 } from '../../crypto/crypto.js';
import { assertSuccess, binToHex, hexToBin } from '../../format/format.js';
import type { VmbTestDefinitionGroup } from '../../lib.js';

const key1Compressed = hexToBin('03a524f43d6166ad3567f18b0a5c769c6ab4dc02149f4d5095ccf4e8ffa293e785');
const key1Uncompressed = assertSuccess(secp256k1.uncompressPublicKey(key1Compressed));
const key2Compressed = hexToBin('03c23083dccdc50247ebc5725c88d6d550cc49c9cb94e4bd4c485a1c6715a5dbfd');
const key2Uncompressed = assertSuccess(secp256k1.uncompressPublicKey(key2Compressed));
const key3Compressed = hexToBin('0369fb8ddd38ab04cfb912a76c1bde5c7d0c1415ff4caf199461878d5fb03dc3f8');
const key3Uncompressed = assertSuccess(secp256k1.uncompressPublicKey(key3Compressed));

const longestTokenPrefix = { amount: '9223372036854775807', category: '0102030400000000000000000000000000000000000000000000000001020304', nft: { capability: 'minting', commitment: 'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc' } } as const;

const oneBeyondLongestTokenCommitment2025 = { amount: '9223372036854775807', category: '0102030400000000000000000000000000000000000000000000000001020304', nft: { capability: 'minting', commitment: 'ccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccdd' } } as const;

export default [
  [
    'Pay to Script',
    [
      [
        `<0> <key1.ecdsa_signature.default> <key2.ecdsa_signature.default> <key3.ecdsa_signature.default>`,
        `<3> <0x${binToHex(key1Uncompressed)}> <0x${binToHex(key2Uncompressed)}> <0x${binToHex(key3Uncompressed)}> OP_3 OP_CHECKMULTISIG`,
        'Maximum length BCH_2025_05 standard UTXO and output (3-of-3 bare multisig, uncompressed keys), ECDSA signatures',
        ['p2s_standard', 'p2sh_ignore'],
        {
          sourceOutputs: [{ lockingBytecode: ['slot'], token: longestTokenPrefix, valueSatoshis: 1_898 }],
          transaction: {
            inputs: [{ unlockingBytecode: ['slot'] }],
            outputs: [{ lockingBytecode: { script: ['copy'] }, token: longestTokenPrefix, valueSatoshis: 1_332 }],
          },
        },
      ],
      [
        `<0b111> <key1.schnorr_signature.default> <key2.schnorr_signature.default> <key3.schnorr_signature.default>`,
        `<3> <0x${binToHex(key1Uncompressed)}> <0x${binToHex(key2Uncompressed)}> <0x${binToHex(key3Uncompressed)}> OP_3 OP_CHECKMULTISIG`,
        'Maximum length BCH_2025_05 standard UTXO and output (3-of-3 bare multisig, uncompressed keys), Schnorr signatures',
        ['p2s_standard', 'p2sh_ignore'],
        {
          sourceOutputs: [{ lockingBytecode: ['slot'], token: longestTokenPrefix, valueSatoshis: 1_898 }],
          transaction: {
            inputs: [{ unlockingBytecode: ['slot'] }],
            outputs: [{ lockingBytecode: { script: ['copy'] }, token: longestTokenPrefix, valueSatoshis: 1_332 }],
          },
        },
      ],
      [
        `<0> <key1.ecdsa_signature.default> <key2.ecdsa_signature.default> <key3.ecdsa_signature.default>`,
        `<3> <0x${binToHex(key1Uncompressed)}> <0x${binToHex(key2Uncompressed)}> <0x${binToHex(key3Uncompressed)}> OP_3 OP_CHECKMULTISIG`,
        'Maximum length BCH_2025_05 standard UTXO and output (3-of-3 bare multisig, uncompressed keys), ECDSA signatures, 41-byte commitment',
        ['chip_p2s', 'p2sh_ignore'],
        {
          sourceOutputs: [{ lockingBytecode: ['slot'], token: oneBeyondLongestTokenCommitment2025, valueSatoshis: 1_902 }],
          transaction: {
            inputs: [{ unlockingBytecode: ['slot'] }],
            outputs: [{ lockingBytecode: { script: ['copy'] }, token: oneBeyondLongestTokenCommitment2025, valueSatoshis: 1_335 }],
          },
        },
      ],
      [
        `<0b111> <key1.schnorr_signature.default> <key2.schnorr_signature.default> <key3.schnorr_signature.default>`,
        `<3> <0x${binToHex(key1Uncompressed)}> <0x${binToHex(key2Uncompressed)}> <0x${binToHex(key3Uncompressed)}> OP_3 OP_CHECKMULTISIG`,
        'Maximum length BCH_2025_05 standard UTXO and output (3-of-3 bare multisig, uncompressed keys), Schnorr signatures, 41-byte commitment',
        ['chip_p2s', 'p2sh_ignore'],
        {
          sourceOutputs: [{ lockingBytecode: ['slot'], token: oneBeyondLongestTokenCommitment2025, valueSatoshis: 1_902 }],
          transaction: {
            inputs: [{ unlockingBytecode: ['slot'] }],
            outputs: [{ lockingBytecode: { script: ['copy'] }, token: oneBeyondLongestTokenCommitment2025, valueSatoshis: 1_335 }],
          },
        },
      ],
    ],
  ],
] as const satisfies VmbTestDefinitionGroup[];
