import type { VmbTestDefinitionGroup } from '../../lib.js';

export default [
  [
    'Transaction validation benchmarks',
    [
      [
        '<key1.schnorr_signature.all_outputs> <key1.public_key>',
        'OP_DUP OP_HASH160 <$(<key1.public_key> OP_HASH160)> OP_EQUALVERIFY OP_CHECKSIG',
        '[baseline] 2 P2PKH inputs, 2 P2PKH outputs (one Schnorr signature, one ECDSA signature)',
        ['nop2sh_standard', 'p2sh_ignore', 'spec'],
        {
          sourceOutputs: [
            { lockingBytecode: { script: 'lockP2pkh' }, valueSatoshis: 100_000 },
            { lockingBytecode: ['slot'], valueSatoshis: 100_000 },
          ],
          transaction: {
            inputs: [{ unlockingBytecode: { script: 'unlockP2pkhStandardEcdsa' } }, { unlockingBytecode: ['slot'] }],
            outputs: [
              { lockingBytecode: { script: 'lockP2pkh' }, valueSatoshis: 100_000 },
              { lockingBytecode: { script: 'lockP2pkh' }, valueSatoshis: 99_634 },
            ],
          },
        },
      ],
    ],
  ],
] as const satisfies VmbTestDefinitionGroup[];
