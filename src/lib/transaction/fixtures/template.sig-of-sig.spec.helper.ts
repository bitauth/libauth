/* eslint-disable camelcase, @typescript-eslint/naming-convention */
import type { WalletTemplate } from '../../lib.js';

export const sigOfSig: WalletTemplate = {
  ...{
    name: 'Sig-of-Sig Vault (2-of-2)',
  },
  description:
    'An unusual example of a template that must be signed in a specific order: Second Signer may only sign after First Signer. This construction could be useful in scenarios where a particular signing order must be guaranteed, e.g. proving that a "most-responsible" party only signed for a transaction knowing they were the final signer.',
  entities: {
    signer_1: {
      name: 'First Signer',
      variables: {
        first: {
          type: 'HdKey',
        },
      },
    },
    signer_2: {
      name: 'Second Signer',
      variables: {
        second: {
          type: 'HdKey',
        },
      },
    },
  },
  scripts: {
    first_signature: {
      script: 'first.signature.all_outputs',
    },
    lock: {
      lockingType: 'p2sh20',
      name: 'Sig-of-Sig Vault',
      script:
        'OP_2 OP_PICK <second.public_key> OP_CHECKDATASIGVERIFY OP_DUP OP_HASH160 <$(<first.public_key> OP_HASH160)> OP_EQUALVERIFY OP_CHECKSIG',
    },
    spend: {
      script:
        '<first.signature.all_outputs> <first.public_key> <second.data_signature.first_signature>',
      unlocks: 'lock',
    },
  },
  supported: ['BCH_2021_05', 'BCH_2022_05'],
  version: 0,
};
