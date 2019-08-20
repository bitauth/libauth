// tslint:disable:no-expression-statement no-magic-numbers no-unsafe-any
import { AuthenticationTemplate, AuthenticationTemplateEntity } from './types';

export const singleSig: AuthenticationTemplate = {
  ...{
    name: 'Single-Factor'
  },
  description:
    'A standard single-factor authentication template which uses Pay-to-Public-Key-Hash (P2PKH).\nThis is currently the most common template in use on the network.',
  entities: {
    observer: {
      description:
        'An entity which can generate addresses but cannot spend funds from this wallet.',
      name: 'Observer (Watch-Only)',
      scripts: ['lock']
    },
    owner: {
      description: 'The individual who can spend from this wallet.',
      name: 'Owner',
      variables: {
        key: {
          description: 'The private key which controls this wallet.',
          mock: '0x0000',
          name: 'Key',
          templateDerivationHardened: false,
          templateDerivationIndex: 0,
          type: 'HDKey'
        }
      }
    }
  },
  scripts: {
    lock: {
      script:
        'OP_DUP OP_HASH160 <$(<key.public> OP_HASH160)> OP_EQUALVERIFY OP_CHECKSIG'
    },
    unlock: {
      script: '<key.signature.all> <key.public>',
      unlocks: 'lock'
    }
  },
  supported: ['BCH_2019_05'],
  version: 0
};

const createCosigner = (
  name: string,
  suffix: string,
  scripts: string[]
): AuthenticationTemplateEntity => ({
  name,
  scripts: ['checksum', 'lock', ...scripts],
  variables: {
    [`key${suffix}`]: {
      templateDerivationHardened: false,
      templateDerivationIndex: 0,
      type: 'HDKey'
    }
  }
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
  entities: {
    cosigner_1: createCosigner('Cosigner 1', '1', ['1_and_2', '1_and_3']),
    cosigner_2: createCosigner('Cosigner 2', '2', ['1_and_2', '2_and_3']),
    cosigner_3: createCosigner('Cosigner 3', '3', ['1_and_3', '2_and_3'])
  },
  scripts: {
    '1_and_2': {
      name: 'Cosigner 1 & 2',
      script: 'OP_0 <key1.signature.all> <key2.signature.all> <redeem_script>',
      unlocks: 'lock'
    },
    '1_and_3': {
      name: 'Cosigner 1 & 3',
      script: 'OP_0 <key1.signature.all> <key3.signature.all> <redeem_script>',
      unlocks: 'lock'
    },
    '2_and_3': {
      name: 'Cosigner 2 & 3',
      script: 'OP_0 <key2.signature.all> <key3.signature.all> <redeem_script>',
      unlocks: 'lock'
    },
    checksum: {
      script:
        '$(<key1.public> OP_SHA256 <key2.public> OP_SHA256 OP_CAT OP_SHA256 <key3.public> OP_SHA256 OP_CAT OP_SHA256 OP_HASH160)',
      tests: [
        {
          check: '<TODO:checksum> OP_EQUAL'
        }
      ]
    },
    lock: {
      script: 'OP_HASH160 <$(<redeem_script> OP_HASH160)> OP_EQUAL'
    },
    redeem_script: {
      script:
        'OP_2 <key2.public> <key2.public> <key3.public> OP_3 OP_CHECKMULTISIG'
    }
  },
  supported: ['BCH_2019_05'],
  version: 0
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
  entities: [1, 2, 3, 4, 5, 6, 7, 8].reduce<{}>(
    (acc, i) => ({
      ...acc,
      [`signer_${i}`]: {
        name: `Signer ${i}`,
        scripts: [`Key ${i}`],
        variables: {
          [`key${i}`]: {
            derivationHardened: false,
            derivationIndex: 0,
            type: 'HDKey' as 'HDKey'
          }
        }
      }
    }),
    {}
  ),
  scripts: {
    checksum: {
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
    ].reduce<{}>(
      (acc, [id, left, right]) => ({
        ...acc,
        [id]: {
          script: `${left} ${right} hash_node`
        }
      }),
      {}
    ),
    ...[1, 2, 3, 4, 5, 6, 7, 8].reduce<{}>(
      (acc, i) => ({
        ...acc,
        [`c${i}`]: { script: `<key${i}.public> OP_HASH160` }
      }),
      {}
    ),
    hash_node: {
      script: 'sort_cat OP_HASH160'
    },
    lock: {
      script:
        'OP_HASH160 <$(<OP_4 OP_PICK OP_HASH160 sort_cat OP_HASH160 sort_cat OP_HASH160 sort_cat OP_HASH160 <$(root)> OP_EQUALVERIFY OP_CHECKSIG> OP_HASH160)> OP_EQUAL'
    },
    sort_cat: {
      script: 'OP_LESSTHAN OP_IF OP_SWAP OP_ENDIF OP_CAT'
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
    ].reduce<{}>(
      (acc, [key, sibling, bSibling, aSibling]) => ({
        ...acc,
        [`unlock_${key}`]: {
          script: `<key${key}.signature.all> <key${key}.public> <$(a${aSibling})> <$(b${bSibling})> <$(c${sibling})> <redeem_script>`,
          unlocks: 'lock'
        }
      }),
      {}
    )
  },
  supported: ['BCH_2019_05'],
  version: 0
};

export const sigOfSig: AuthenticationTemplate = {
  ...{
    name: 'Sig-of-Sig Example (2-of-2)'
  },
  description:
    'A contrived example of a template which must be signed in a specific order. Credit: Antony Zegers',
  entities: {
    signer_1: {
      name: 'First Signer',
      variables: {
        first: {
          templateDerivationHardened: false,
          templateDerivationIndex: 0,
          type: 'HDKey'
        }
      }
    },
    signer_2: {
      name: 'Second Signer',
      variables: {
        second: {
          templateDerivationHardened: false,
          templateDerivationIndex: 0,
          type: 'HDKey'
        }
      }
    }
  },
  scripts: {
    checksum: {
      script:
        '$(<key1.public> OP_SHA256 <key2.public> OP_SHA256 OP_CAT OP_SHA256 OP_HASH160)'
    },
    lock: {
      script:
        'OP_HASH160 <$(<OP_2 OP_PICK <second.public> OP_CHECKDATASIGVERIFY OP_DUP OP_HASH160 <$(<key.public> OP_HASH160)> OP_EQUALVERIFY OP_CHECKSIG> OP_HASH160)> OP_EQUAL'
    },
    spend: {
      script:
        '<first.signature.all> <first.public> <second.signature.data.first.signature.all> <redeem_script>'
    }
  },
  supported: ['BCH_2019_05'],
  version: 0
};

export const trustedRecovery: AuthenticationTemplate = {
  ...{
    name: '2-of-2 with Business Continuity'
  },
  description:
    'A 2-of-2 wallet, which after a specified delay, can be recovered by either of the original two keys and a signature from a trusted user (e.g. an attorney).\nThis scheme is described in more detail in BIP-65.',
  entities: {
    signer_1: {
      name: 'Signer 1',
      scripts: ['checksum', 'spend', 'recover_1'],
      variables: {
        block_time: {
          type: 'CurrentBlockTime'
        },
        delay_seconds: {
          description:
            'The waiting period (from the time the wallet is created) after which the Trusted Party can assist with delayed recoveries. The delay is measured in seconds, e.g. 1 day is `86400`.',
          name: 'Recovery Delay (Seconds)',
          type: 'WalletData'
        },
        first: {
          templateDerivationHardened: false,
          templateDerivationIndex: 0,
          type: 'HDKey'
        }
      }
    },
    signer_2: {
      name: 'Signer 2',
      scripts: ['checksum', 'spend', 'recover_2'],
      variables: {
        second: {
          templateDerivationHardened: false,
          templateDerivationIndex: 0,
          type: 'HDKey'
        }
      }
    },
    trusted_party: {
      name: 'Trusted Party',
      scripts: ['checksum', 'recover_1', 'recover_2'],
      variables: {
        trusted: {
          templateDerivationHardened: false,
          templateDerivationIndex: 0,
          type: 'HDKey'
        }
      }
    }
  },
  scripts: {
    checksum: {
      script:
        '$(<hot.public> OP_SHA256 <delayed.public> OP_SHA256 OP_CAT OP_SHA256 OP_HASH160)'
    },
    lock: {
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
    recover_1: {
      name: 'Recovery – Signer 1',
      script:
        '<0>\n<first.signature.all>\n<trusted.signature.all>\n<1> <lock.redeem_script>',
      unlocks: 'lock'
    },
    recover_2: {
      name: 'Recovery – Signer 2',
      script:
        '<0> <second.signature.all> <trusted.signature.all> <1> <lock.redeem_script>',
      unlocks: 'lock'
    },
    spend: {
      name: 'Standard Spend',
      script:
        '<0> <first.signature.all> <second.signature.all> <0> <lock.redeem_script>',
      unlocks: 'lock'
    }
  },
  supported: ['BCH_2019_05'],
  version: 0
};

export const zeroConfirmationForfeits: AuthenticationTemplate = {
  ...{ name: 'Zero-Confirmation Forfeits (ZCF)' },
  description: `TODO`,
  entities: {},
  scripts: {
    lock: {
      script: 'TODO'
    }
  },
  supported: ['BCH_2019_05'],
  version: 0
};

// tslint:disable-next-line:no-console
// console.log(JSON.stringify(singleSig, undefined, 2));

// (async () => {
//   //
// })().catch(error => {
//   // tslint:disable-next-line:no-console
//   console.error(error);
// });
