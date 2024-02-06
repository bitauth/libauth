import type { WalletTemplate } from '../../lib.js';

/**
 * A standard single-factor wallet template that uses
 * Pay-to-Public-Key-Hash (P2PKH), the most common authentication scheme in use
 * on the network.
 *
 * This P2PKH template uses BCH Schnorr signatures, reducing the size of
 * transactions.
 *
 * Note, this wallet template uses only a single `Key`. For HD key
 * support, see {@link walletTemplateP2pkhHd}.
 */
export const walletTemplateP2pkhNonHd: WalletTemplate = {
  $schema: 'https://libauth.org/schemas/wallet-template-v0.schema.json',
  description:
    'A standard single-factor wallet template that uses Pay-to-Public-Key-Hash (P2PKH), the most common authentication scheme in use on the network.\n\nThis P2PKH template uses BCH Schnorr signatures, reducing the size of transactions.',
  entities: {
    owner: {
      description: 'The individual who can spend from this wallet.',
      name: 'Owner',
      scripts: ['lock', 'unlock'],
      variables: {
        key: {
          description: 'The private key that controls this wallet.',
          name: 'Key',
          type: 'Key',
        },
      },
    },
  },
  name: 'Single Signature (P2PKH)',
  scripts: {
    lock: {
      lockingType: 'standard',
      name: 'P2PKH Lock',
      script:
        'OP_DUP\nOP_HASH160 <$(<key.public_key> OP_HASH160\n)> OP_EQUALVERIFY\nOP_CHECKSIG',
    },
    unlock: {
      name: 'Unlock',
      script: '<key.schnorr_signature.all_outputs>\n<key.public_key>',
      unlocks: 'lock',
    },
  },
  supported: ['BCH_2020_05', 'BCH_2021_05', 'BCH_2022_05'],
  version: 0,
};

/**
 * A standard single-factor wallet template that uses
 * Pay-to-Public-Key-Hash (P2PKH), the most common authentication scheme in use
 * on the network.
 *
 * This P2PKH template uses BCH Schnorr signatures, reducing the size of
 * transactions.
 *
 * Because the template uses a Hierarchical Deterministic (HD) key, it also
 * supports watch-only clients.
 */
export const walletTemplateP2pkh: WalletTemplate = {
  $schema: 'https://libauth.org/schemas/wallet-template-v0.schema.json',
  description:
    'A standard single-factor wallet template that uses Pay-to-Public-Key-Hash (P2PKH), the most common authentication scheme in use on the network.\n\nThis P2PKH template uses BCH Schnorr signatures, reducing the size of transactions. Because the template uses a Hierarchical Deterministic (HD) key, it also supports watch-only clients.',
  entities: {
    owner: {
      description: 'The individual who can spend from this wallet.',
      name: 'Owner',
      scripts: ['lock', 'unlock'],
      variables: {
        key: {
          description: 'The private key that controls this wallet.',
          name: 'Key',
          type: 'HdKey',
        },
      },
    },
  },
  name: 'Single Signature (P2PKH)',
  scripts: {
    lock: {
      lockingType: 'standard',
      name: 'P2PKH Lock',
      script:
        'OP_DUP\nOP_HASH160 <$(<key.public_key> OP_HASH160\n)> OP_EQUALVERIFY\nOP_CHECKSIG',
    },
    unlock: {
      name: 'Unlock',
      script: '<key.schnorr_signature.all_outputs>\n<key.public_key>',
      unlocks: 'lock',
    },
  },
  supported: ['BCH_2020_05', 'BCH_2021_05', 'BCH_2022_05'],
  version: 0,
};
