/* eslint-disable camelcase, @typescript-eslint/naming-convention */
import {
  AuthenticationTemplate,
  AuthenticationTemplateEntity,
} from '../../template/template-types';

const createSigner = (
  name: string,
  signerIndex: string,
  scripts: string[]
): AuthenticationTemplateEntity => ({
  name,
  scripts: ['lock', ...scripts],
  variables: { [`key${signerIndex}`]: { type: 'HdKey' } },
});

/**
 * 2-of-3 P2SH
 * This is a mostly-hard-coded 2-of-3 example. A more general function could be written to generate m-of-n wallets
 */
export const twoOfThree: AuthenticationTemplate = {
  ...{ name: '2-of-3 Multisig' },
  $schema: 'https://bitauth.com/schemas/authentication-template-v0.schema.json',
  entities: {
    signer_1: createSigner('Signer 1', '1', ['1_and_2', '1_and_3']),
    signer_2: createSigner('Signer 2', '2', ['1_and_2', '2_and_3']),
    signer_3: createSigner('Signer 3', '3', ['1_and_3', '2_and_3']),
  },
  scripts: {
    '1_and_2': {
      name: 'Cosigner 1 & 2',
      script:
        'OP_0\n<key1.signature.all_outputs>\n<key2.signature.all_outputs>',
      unlocks: 'lock',
    },
    '1_and_3': {
      name: 'Cosigner 1 & 3',
      script:
        'OP_0\n<key1.signature.all_outputs>\n<key3.signature.all_outputs>',
      unlocks: 'lock',
    },
    '2_and_3': {
      name: 'Cosigner 2 & 3',
      script:
        'OP_0\n<key2.signature.all_outputs>\n<key3.signature.all_outputs>',
      unlocks: 'lock',
    },
    lock: {
      lockingType: 'p2sh',
      name: '2-of-3 Vault',
      script:
        'OP_2\n<key1.public_key>\n<key2.public_key>\n<key3.public_key>\nOP_3\nOP_CHECKMULTISIG',
    },
  },
  supported: ['BCH_2019_11'],
  version: 0,
};
