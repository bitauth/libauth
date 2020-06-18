/* eslint-disable functional/no-expression-statement */

import test from 'ava';

import {
  authenticationTemplateToCompilerBCH,
  bigIntToBinUint64LE,
  CashAddressNetworkPrefix,
  decodeTransaction,
  generateTransaction,
  hexToBin,
  lockingBytecodeToCashAddress,
  validateAuthenticationTemplate,
} from '../lib';
import { privkey } from '../template/compiler-bch/compiler-bch.e2e.spec.helper';

const maybeP2pkhTemplate: unknown = {
  entities: {
    ownerEntity: {
      name: 'Owner',
      scripts: ['lock', 'unlock'],
      variables: {
        owner: {
          description: 'The private key which controls this wallet.',
          name: "Owner's Key",
          type: 'Key',
        },
      },
    },
  },
  scripts: {
    celebrate: {
      script: 'OP_RETURN <"hello world">',
    },
    lock: {
      lockingType: 'standard',
      name: 'P2PKH Lock',
      script:
        'OP_DUP\nOP_HASH160 <$( <owner.public_key> OP_HASH160\n)> OP_EQUALVERIFY\nOP_CHECKSIG',
    },
    unlock: {
      name: 'Unlock',
      script: '<owner.schnorr_signature.all_outputs>\n<owner.public_key>',
      unlocks: 'lock',
    },
  },
  supported: ['BCH_2019_05', 'BCH_2019_11'],
  version: 0,
};

test('createCompilerBCH: generateTransaction', async (t) => {
  const p2pkhTemplate = validateAuthenticationTemplate(maybeP2pkhTemplate);

  if (typeof p2pkhTemplate === 'string') {
    t.fail(p2pkhTemplate);
    return;
  }

  const p2pkh = await authenticationTemplateToCompilerBCH(p2pkhTemplate);
  const lockingBytecode = p2pkh.generateBytecode('lock', {
    keys: { privateKeys: { owner: privkey } },
  });

  if (!lockingBytecode.success) {
    t.log(lockingBytecode.errors);
    t.fail();
    return;
  }

  t.deepEqual(
    lockingBytecodeToCashAddress(
      lockingBytecode.bytecode,
      CashAddressNetworkPrefix.testnet
    ),
    'bchtest:qq2azmyyv6dtgczexyalqar70q036yund53jvfde0x'
  );

  const utxoOutpointTransactionHash = hexToBin(
    '68127de83d2ab77d7f5fd8d2ac6181d94473c0cbb2d0776084bf28884f6ecd77'
  );

  const satoshis = 1000000;
  const result = generateTransaction({
    inputs: [
      {
        outpointIndex: 1,
        outpointTransactionHash: utxoOutpointTransactionHash,
        sequenceNumber: 0,
        unlockingBytecode: {
          compiler: p2pkh,
          data: {
            keys: { privateKeys: { owner: privkey } },
          },
          satoshis: bigIntToBinUint64LE(BigInt(satoshis)),
          script: 'unlock',
        },
      },
    ],
    locktime: 0,
    outputs: [
      {
        lockingBytecode: {
          compiler: p2pkh,
          script: 'celebrate',
        },
        satoshis: bigIntToBinUint64LE(BigInt(0)),
      },
    ],
    version: 2,
  });

  if (!result.success) {
    t.log(result.errors);
    t.fail();
    return;
  }

  t.deepEqual(result, {
    success: true,
    transaction: decodeTransaction(
      hexToBin(
        '020000000177cd6e4f8828bf846077d0b2cbc07344d98161acd2d85f7f7db72a3de87d1268010000006441f87a1dc0fb4a30443fdfcc678e713d99cffb963bd52b497377e81abe2cc2b5ac6e9837fab0a23f4d05fd06b80e7673a68bfa8d2f66b7ec5537e88696d7bae1b841210376ea9e36a75d2ecf9c93a0be76885e36f822529db22acfdc761c9b5b4544f5c5000000000100000000000000000d6a0b68656c6c6f20776f726c6400000000'
      )
    ),
  });
});
