/* eslint-disable functional/no-expression-statement */

import test from 'ava';

import {
  authenticationTemplateToCompilerBCH,
  bigIntToBinUint64LE,
  CashAddressNetworkPrefix,
  CompilationData,
  decodeTransaction,
  generateTransaction,
  hexToBin,
  lockingBytecodeToCashAddress,
  validateAuthenticationTemplate,
} from '../lib';

import {
  hdPrivateKey,
  hdPublicKey,
  p2pkhJson,
} from './transaction-e2e.spec.helper';

test('transaction e2e tests: P2PKH (authenticationTemplateP2pkhHd)', async (t) => {
  const template = validateAuthenticationTemplate(p2pkhJson);
  if (typeof template === 'string') {
    t.fail(template);
    return;
  }

  const lockingScript = 'lock';

  /**
   * Available to observer
   */
  const lockingData: CompilationData<never> = {
    hdKeys: { addressIndex: 0, hdPublicKeys: { owner: hdPublicKey } },
  };

  /**
   * Only available to owner
   */
  const unlockingData: CompilationData<never> = {
    hdKeys: { addressIndex: 0, hdPrivateKeys: { owner: hdPrivateKey } },
  };

  const compiler = await authenticationTemplateToCompilerBCH(template);
  const lockingBytecode = compiler.generateBytecode(lockingScript, lockingData);

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
          compiler,
          data: unlockingData,
          satoshis: bigIntToBinUint64LE(BigInt(satoshis)),
          script: 'unlock',
        },
      },
    ],
    locktime: 0,
    outputs: [
      {
        lockingBytecode: hexToBin('6a0b68656c6c6f20776f726c64'),
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
