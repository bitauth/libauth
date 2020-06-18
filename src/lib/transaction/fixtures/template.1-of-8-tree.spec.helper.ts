/* eslint-disable camelcase, @typescript-eslint/naming-convention, @typescript-eslint/no-magic-numbers */
import {
  AuthenticationTemplate,
  AuthenticationTemplateHdKey,
} from '../../template/template-types';

/**
 * This is a mostly-hard-coded 1-of-8 example. A more general function could
 * be written to create m-of-n wallets.
 *
 * TODO: this is very broken - OP_LESSTHAN requires a valid 4-byte script number, this script assumes it can accept a 20-byte hash. Probably should rework this template to provide the path in the unlocking script as in: https://www.reddit.com/r/btc/comments/8joo00/first_tree_signature_on_bitcoin_cash_using_new/
 */
export const oneOfEightTreeSig: AuthenticationTemplate = {
  ...{
    name: '1-of-8 Tree Signature',
  },
  description: `A 1-of-8 P2SH tree signature authentication template, based on: https://www.yours.org/content/tree-signature-variations-using-commutative-hash-trees-8a898830203a

         root
        /    \\
       a1     a2
      / \\     / \\
    b1  b2   b3  b4
    /\\  /\\   /\\   /\\
 c | |  | |  | |  | |
   1 2  3 4  5 6  7 8

 The tree contains 5 levels:
 - root
 - a - concat and hash of b
 - b - concat and hash of c
 - c - hash of each respective public key
 - # - each respective public key`,
  entities: [1, 2, 3, 4, 5, 6, 7, 8].reduce(
    (acc, i) => ({
      ...acc,
      [`signer_${i}`]: {
        name: `Signer ${i}`,
        scripts: ['lock', `unlock_${i}`],
        variables: {
          [`key${i}`]: {
            type: 'HdKey' as const,
          } as AuthenticationTemplateHdKey,
        },
      },
    }),
    {}
  ),
  scripts: {
    ...[
      ['root', 'a1', 'a2'],
      ['a1', 'b1', 'b2'],
      ['a2', 'b3', 'b4'],
      ['b1', 'c1', 'c2'],
      ['b2', 'c3', 'c4'],
      ['b3', 'c5', 'c6'],
      ['b4', 'c7', 'c8'],
    ].reduce(
      (acc, [id, left, right]) => ({
        ...acc,
        [id]: {
          name: id,
          script: `${left} ${right} hash_node`,
        },
      }),
      {}
    ),
    ...[1, 2, 3, 4, 5, 6, 7, 8].reduce(
      (acc, i) => ({
        ...acc,
        [`c${i}`]: { name: `c${i}`, script: `<key${i}.public_key> OP_HASH160` },
      }),
      {}
    ),
    hash_node: {
      name: 'hash_node',
      script: 'sort_cat OP_HASH160',
    },
    lock: {
      lockingType: 'p2sh',
      name: '1-of-8 Tree Vault',
      script:
        'OP_4 OP_PICK OP_HASH160 sort_cat OP_HASH160 sort_cat OP_HASH160 sort_cat OP_HASH160 <$(root)> OP_EQUALVERIFY OP_CHECKSIG',
    },
    sort_cat: {
      name: 'sort_cat',
      script: 'OP_LESSTHAN OP_IF OP_SWAP OP_ENDIF OP_CAT',
    },
    ...[
      [1, 2, 2, 2],
      [2, 1, 2, 2],
      [3, 4, 1, 2],
      [4, 3, 1, 2],
      [5, 6, 4, 1],
      [6, 5, 4, 1],
      [7, 8, 3, 1],
      [8, 7, 3, 1],
    ].reduce(
      (acc, [key, sibling, bSibling, aSibling]) => ({
        ...acc,
        [`unlock_${key}`]: {
          name: `Spend - Signer ${key}`,
          script: `<key${key}.signature.all_outputs> <key${key}.public_key> <$(a${aSibling})> <$(b${bSibling})> <$(c${sibling})>`,
          unlocks: 'lock',
        },
      }),
      {}
    ),
  },
  supported: ['BCH_2019_11'],
  version: 0,
};
