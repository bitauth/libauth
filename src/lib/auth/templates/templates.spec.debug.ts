// tslint:disable:no-expression-statement no-magic-numbers no-unsafe-any readonly-array
import { AuthenticationTemplate, AuthenticationTemplateEntity } from './types';

export const singleSig: AuthenticationTemplate = {
  ...{
    name: 'Single-Factor'
  },
  description:
    'A standard single-factor authentication template which uses Pay-to-Public-Key-Hash (P2PKH).\nThis is currently the most common template in use on the network.',
  entities: [
    {
      description: 'The individual who can spend from this wallet.',
      id: 'owner',
      name: 'Owner',
      variables: [
        {
          derivationHardened: false,
          derivationIndex: 0,
          description: 'The private key which controls this wallet.',
          id: 'key',
          mock: '0x0000',
          name: 'Key',
          type: 'HDKey'
        }
      ]
    },
    {
      description:
        'An entity which can generate addresses but cannot spend funds from this wallet.',
      id: 'observer',
      name: 'Observer (Watch-Only)',
      scripts: ['lock']
    }
  ],
  scripts: [
    {
      id: 'lock',
      script:
        'OP_DUP OP_HASH160 <$(<key.public> OP_HASH160)> OP_EQUALVERIFY OP_CHECKSIG'
    },
    {
      id: 'unlock',
      script: '<key.signature.all> <key.public>',
      unlocks: 'lock'
    }
  ],
  supported: ['BCH_2018_11', 'BCH_2019_05'],
  version: 1
};

const createCosigner = (
  id: string,
  name: string,
  suffix: string,
  scripts: string[]
): AuthenticationTemplateEntity => ({
  id,
  name,
  scripts: ['checksum', 'lock', ...scripts],
  variables: [
    {
      derivationHardened: false,
      derivationIndex: 0,
      id: `key${suffix}`,
      type: 'HDKey'
    }
  ]
});

/**
 * 2-of-3 P2SH
 * This is a mostly-hard-coded 2-of-3 example. A more general function could be written to generate m-of-n wallets
 */
export const twoOfThree: AuthenticationTemplate = {
  ...{
    name: 'Multi-Factor (2-of-3)'
  },
  description:
    'A multi-factor template using standard 2-of-3 P2SH authentication template',
  entities: [
    createCosigner('cosigner_1', 'Cosigner 1', '1', ['1_and_2', '1_and_3']),
    createCosigner('cosigner_2', 'Cosigner 2', '2', ['1_and_2', '2_and_3']),
    createCosigner('cosigner_3', 'Cosigner 3', '3', ['1_and_3', '2_and_3'])
  ],
  scripts: [
    {
      id: 'checksum',
      script:
        '$(<key1.public> OP_SHA256 <key2.public> OP_SHA256 OP_CAT OP_SHA256 <key3.public> OP_SHA256 OP_CAT OP_SHA256 OP_HASH160)',
      tests: [
        {
          check: '<TODO:checksum> OP_EQUAL'
        }
      ]
    },
    {
      id: 'redeem_script',
      script:
        'OP_2 <key2.public> <key2.public> <key3.public> OP_3 OP_CHECKMULTISIG'
    },
    {
      id: 'lock',
      script: 'OP_HASH160 <$(<redeem_script> OP_HASH160)> OP_EQUAL'
    },
    {
      id: '1_and_2',
      name: 'Cosigner 1 & 2',
      script: 'OP_0 <key1.signature.all> <key2.signature.all> <redeem_script>',
      unlocks: 'lock'
    },
    {
      id: '1_and_3',
      name: 'Cosigner 1 & 3',
      script: 'OP_0 <key1.signature.all> <key3.signature.all> <redeem_script>',
      unlocks: 'lock'
    },
    {
      id: '2_and_3',
      name: 'Cosigner 2 & 3',
      script: 'OP_0 <key2.signature.all> <key3.signature.all> <redeem_script>',
      unlocks: 'lock'
    }
  ],
  supported: ['BCH_2018_11', 'BCH_2019_05'],
  version: 1
};

/**
 * This is a mostly-hard-coded 1-of-8 example. A more general function could
 * be written to create m-of-n wallets.
 */

export const treeSig: AuthenticationTemplate = {
  ...{
    name: '1-of-8 Tree Signature'
  },
  description: `A 1-of-8 P2SH tree signature authentication template, based on: https://www.yours.org/content/tree-signature-variations-using-commutative-hash-trees-8a898830203a

         root
        /    \
       a1     a2
      / \     / \
    b1  b2   b3  b4
    /\  /\   /\   /\
 c | |  | |  | |  | |
   1 2  3 4  5 6  7 8

 The tree contains 5 levels:
 - root
 - a - concat and hash of b
 - b - concat and hash of c
 - c - hash of each respective public key
 - # - each respective public key`,
  entities: [1, 2, 3, 4, 5, 6, 7, 8].map(id => ({
    id: `signer_${id}`,
    name: `Signer ${id}`,
    scripts: [`Key ${id}`],
    variables: [
      {
        derivationHardened: false,
        derivationIndex: 0,
        id: `key${id}`,
        type: 'HDKey' as 'HDKey'
      }
    ]
  })),
  scripts: [
    {
      id: 'checksum',
      script:
        '$(<key1.public> OP_SHA256 <key2.public> OP_SHA256 OP_CAT OP_SHA256 <key3.public> OP_SHA256 OP_CAT OP_SHA256 <key4.public> OP_SHA256 OP_CAT OP_SHA256 <key5.public> OP_SHA256 OP_CAT OP_SHA256 <key6.public> OP_SHA256 OP_CAT OP_SHA256 <key7.public> OP_SHA256 OP_CAT OP_SHA256 <key8.public> OP_SHA256 OP_CAT OP_SHA256 OP_HASH160)'
    },
    ...[
      ['root', 'a1', 'a2'],
      ['a1', 'b1', 'b2'],
      ['a2', 'b3', 'b4'],
      ['b1', 'c1', 'c2'],
      ['b2', 'c3', 'c4'],
      ['b3', 'c5', 'c6'],
      ['b4', 'c7', 'c8']
    ].map(([id, left, right]) => ({
      id,
      script: `${left} ${right} hash_node`
    })),
    ...[1, 2, 3, 4, 5, 6, 7, 8].map(i => ({
      id: `c${i}`,
      script: `<key${i}.public> OP_HASH160`
    })),
    {
      id: 'hash_node',
      script: 'sort_cat OP_HASH160'
    },
    {
      id: 'sort_cat',
      script: 'OP_LESSTHAN OP_IF OP_SWAP OP_ENDIF OP_CAT'
    },
    {
      id: 'lock',
      script:
        'OP_HASH160 <$(<OP_4 OP_PICK OP_HASH160 sort_cat OP_HASH160 sort_cat OP_HASH160 sort_cat OP_HASH160 <$(root)> OP_EQUALVERIFY OP_CHECKSIG> OP_HASH160)> OP_EQUAL'
    },
    ...[
      [1, 2, 2, 2],
      [2, 1, 2, 2],
      [3, 4, 1, 2],
      [4, 3, 1, 2],
      [5, 6, 4, 1],
      [6, 5, 4, 1],
      [7, 8, 3, 1],
      [8, 7, 3, 1]
    ].map(([key, sibling, bSibling, aSibling]) => ({
      id: `unlock_${key}`,
      script: `<key${key}.signature.all> <key${key}.public> <$(a${aSibling})> <$(b${bSibling})> <$(c${sibling})> <redeem_script>`,
      unlocks: 'lock'
    }))
  ],
  supported: ['BCH_2018_11', 'BCH_2019_05'],
  version: 1
};

export const sigOfSig: AuthenticationTemplate = {
  ...{
    name: 'Sig-of-Sig Example (2-of-2)'
  },
  description:
    'A contrived example of a template which must be signed in a specific order. Credit: Antony Zegers',
  entities: [
    {
      id: 'signer_1',
      name: 'First Signer',
      variables: [
        {
          derivationHardened: false,
          derivationIndex: 0,
          id: 'first',
          type: 'HDKey'
        }
      ]
    },
    {
      id: 'signer_2',
      name: 'Second Signer',
      variables: [
        {
          derivationHardened: false,
          derivationIndex: 0,
          id: 'second',
          type: 'HDKey'
        }
      ]
    }
  ],
  scripts: [
    {
      id: 'checksum',
      script:
        '$(<key1.public> OP_SHA256 <key2.public> OP_SHA256 OP_CAT OP_SHA256 OP_HASH160)'
    },
    {
      id: 'lock',
      script:
        'OP_HASH160 <$(<OP_2 OP_PICK <second.public> OP_CHECKDATASIGVERIFY OP_DUP OP_HASH160 <$(<key.public> OP_HASH160)> OP_EQUALVERIFY OP_CHECKSIG> OP_HASH160)> OP_EQUAL'
    },
    {
      id: 'spend',
      script:
        '<first.signature.all> <first.public> <second.signature.data.first.signature.all> <redeem_script>'
    }
  ],
  supported: ['BCH_2018_11', 'BCH_2019_05'],
  version: 1
};

export const trustedRecovery: AuthenticationTemplate = {
  ...{
    name: '2-of-2 with Business Continuity'
  },
  description:
    'A 2-of-2 wallet, which after a specified delay, can be recovered by either of the original two keys and a signature from a trusted user (e.g. an attorney).\nThis scheme is described in more detail in BIP-65.',
  entities: [
    {
      id: 'signer_1',
      name: 'Signer 1',
      scripts: ['checksum', 'spend', 'recover_1'],
      variables: [
        {
          derivationHardened: false,
          derivationIndex: 0,
          id: `first`,
          type: 'HDKey'
        },
        {
          id: 'block_time',
          type: 'CurrentBlockTime'
        },
        {
          description:
            'The waiting period (from the time the wallet is created) after which the Trusted Party can assist with delayed recoveries. The delay is measured in seconds, e.g. 1 day is `86400`.',
          id: 'delay_seconds',
          name: 'Recovery Delay (Seconds)',
          type: 'WalletData'
        }
      ]
    },
    {
      id: 'signer_2',
      name: 'Signer 2',
      scripts: ['checksum', 'spend', 'recover_2'],
      variables: [
        {
          derivationHardened: false,
          derivationIndex: 0,
          id: `second`,
          type: 'HDKey'
        }
      ]
    },
    {
      id: 'trusted_party',
      name: 'Trusted Party',
      scripts: ['checksum', 'recover_1', 'recover_2'],
      variables: [
        {
          derivationHardened: false,
          derivationIndex: 0,
          id: `trusted`,
          type: 'HDKey'
        }
      ]
    }
  ],
  scripts: [
    {
      id: 'checksum',
      script:
        '$(<hot.public> OP_SHA256 <delayed.public> OP_SHA256 OP_CAT OP_SHA256 OP_HASH160)'
    },
    {
      id: 'lock',
      script: `OP_HASH160 <$(<
OP_IF
  <$(
    <block_time>
    <delay_seconds>
    OP_ADD
  )>
  OP_CHECKLOCKTIMEVERIFY OP_DROP
  <trusted.public_key>
  OP_CHECKSIGVERIFY
  <1>
OP_ELSE
  <2>
OP_ENDIF
<first.public_key> <second.public_key> <2>
OP_CHECKMULTISIG
> OP_HASH160)> OP_EQUAL`
    },
    {
      id: 'spend',
      name: 'Standard Spend',
      script:
        '<0> <first.signature.all> <second.signature.all> <0> <lock.redeem_script>',
      unlocks: 'lock'
    },
    {
      id: 'recover_1',
      name: 'Recovery – Signer 1',
      script:
        '<0>\n<first.signature.all>\n<trusted.signature.all>\n<1> <lock.redeem_script>',
      unlocks: 'lock'
    },
    {
      id: 'recover_2',
      name: 'Recovery – Signer 2',
      script:
        '<0> <second.signature.all> <trusted.signature.all> <1> <lock.redeem_script>',
      unlocks: 'lock'
    }
  ],
  supported: ['BCH_2018_11', 'BCH_2019_05'],
  version: 1
};

export const zeroConfirmationForfeits: AuthenticationTemplate = {
  ...{ name: 'Zero-Confirmation Forfeits (ZCF)' },
  description: `TODO`,
  entities: [],
  scripts: [
    {
      id: 'lock',
      script: 'TODO'
    }
  ],
  supported: ['BCH_2018_11', 'BCH_2019_05'],
  version: 1
};

// tslint:disable-next-line:no-console
// console.log(JSON.stringify(singleSig, undefined, 2));

(async () => {
  //
})().catch(error => {
  // tslint:disable-next-line:no-console
  console.error(error);
});
