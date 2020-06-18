/* eslint-disable functional/no-expression-statement, camelcase, @typescript-eslint/naming-convention */

import test from 'ava';

import {
  authenticationTemplateToCompilerBCH,
  bigIntToBinUint64LE,
  CashAddressNetworkPrefix,
  CompilationData,
  decodeTransaction,
  encodeTransaction,
  extractMissingVariables,
  extractResolvedVariables,
  generateTransaction,
  hexToBin,
  instantiateVirtualMachineBCH,
  lockingBytecodeToCashAddress,
  safelyExtendCompilationData,
  stringify,
  validateAuthenticationTemplate,
  verifyTransaction,
} from '../lib';

import {
  hdPrivateKey0H,
  hdPrivateKey2H,
  hdPublicKey0H,
  hdPublicKey1H,
  hdPublicKey2H,
  twoOfThreeJson,
} from './transaction-e2e.spec.helper';

const vmPromise = instantiateVirtualMachineBCH();

// eslint-disable-next-line complexity
test('transaction e2e tests: 2-of-3 multisig', async (t) => {
  const template = validateAuthenticationTemplate(twoOfThreeJson);
  if (typeof template === 'string') {
    t.fail(template);
    return;
  }

  /**
   * The HD public keys shared between the entities at wallet creation time
   */
  const hdPublicKeys = {
    signer_1: hdPublicKey0H,
    signer_2: hdPublicKey1H,
    signer_3: hdPublicKey2H,
  };

  const lockingData: CompilationData<never> = {
    hdKeys: { addressIndex: 0, hdPublicKeys },
  };

  const lockingScript = 'lock';
  const compiler = await authenticationTemplateToCompilerBCH(template);
  const lockingBytecode = compiler.generateBytecode(lockingScript, lockingData);

  if (!lockingBytecode.success) {
    t.log('lockingBytecode', stringify(lockingBytecode));
    t.fail();
    return;
  }

  const address = lockingBytecodeToCashAddress(
    lockingBytecode.bytecode,
    CashAddressNetworkPrefix.testnet
  );

  t.deepEqual(address, 'bchtest:pplldqjpjaj0058xma6csnpgxd9ew2vxgv26n639yk');

  const satoshis = 10000;
  const utxoOutput = {
    lockingBytecode: lockingBytecode.bytecode,
    satoshis: bigIntToBinUint64LE(BigInt(satoshis)),
  };

  const input1 = {
    outpointIndex: 1,
    outpointTransactionHash: hexToBin(
      '3423be78a1976b4ae3516cda594577df004663ff24f1beb9d5bb63056b1b0a60'
    ),
    sequenceNumber: 0,
    unlockingBytecode: {
      compiler,
      satoshis: utxoOutput.satoshis,
      script: '1_and_3',
    },
  };

  const transactionProposal = {
    locktime: 0,
    outputs: [
      {
        lockingBytecode: hexToBin('6a0b68656c6c6f20776f726c64'),
        satoshis: bigIntToBinUint64LE(BigInt(0)),
      },
    ],
    version: 2,
  };

  const signer1UnlockingData: CompilationData<never> = {
    ...lockingData,
    hdKeys: {
      ...lockingData.hdKeys,
      hdPrivateKeys: {
        signer_1: hdPrivateKey0H,
      },
    },
  };

  const signer1Attempt = generateTransaction({
    ...transactionProposal,
    inputs: [
      {
        ...input1,
        unlockingBytecode: {
          ...input1.unlockingBytecode,
          data: signer1UnlockingData,
        },
      },
    ],
  });

  if (signer1Attempt.success) {
    t.log('signer1Attempt:', stringify(signer1Attempt));
    t.fail();
    return;
  }

  const signer1MissingVariables = extractMissingVariables(signer1Attempt);

  t.deepEqual(signer1MissingVariables, {
    'key3.signature.all_outputs': 'signer_3',
  });

  t.deepEqual(signer1Attempt.completions, []);

  const signer1ResolvedVariables = extractResolvedVariables(signer1Attempt);

  const expectedSigner1Signature = hexToBin(
    '304402205e7d56c4e7854f9c672977d6606dd2f0af5494b8e61108e2a92fc920bf8049fc022065262675b0e1a3850d88bd3c56e0eb5fb463d9cdbe49f2f625da5c0f82c7653041'
  );

  t.deepEqual(
    signer1ResolvedVariables,
    {
      'key1.signature.all_outputs': expectedSigner1Signature,
    },
    stringify(signer1ResolvedVariables)
  );

  const signer3UnlockingData: CompilationData<never> = {
    hdKeys: {
      addressIndex: 0,
      hdPrivateKeys: {
        signer_3: hdPrivateKey2H,
      },
      hdPublicKeys,
    },
  };

  const signer3Attempt = generateTransaction({
    ...transactionProposal,
    inputs: [
      {
        ...input1,
        unlockingBytecode: {
          ...input1.unlockingBytecode,
          data: signer3UnlockingData,
        },
      },
    ],
  });

  if (signer3Attempt.success) {
    t.log('signer3Attempt:', stringify(signer1Attempt));
    t.fail();
    return;
  }

  const signer3UnlockingDataWithMissingVariables = safelyExtendCompilationData(
    signer3Attempt,
    signer3UnlockingData,
    {
      signer_1: signer1ResolvedVariables,
    }
  ) as CompilationData<never>;

  t.deepEqual(
    signer3UnlockingDataWithMissingVariables,
    {
      ...signer3UnlockingData,
      bytecode: {
        'key1.signature.all_outputs': expectedSigner1Signature,
      },
    },
    stringify(signer3UnlockingDataWithMissingVariables)
  );

  const successfulCompilation = generateTransaction({
    ...transactionProposal,
    inputs: [
      {
        ...input1,
        unlockingBytecode: {
          ...input1.unlockingBytecode,
          data: signer3UnlockingDataWithMissingVariables,
        },
      },
    ],
  });

  if (!successfulCompilation.success) {
    t.log('successfulCompilation:', stringify(successfulCompilation));
    t.fail();
    return;
  }

  const { transaction } = successfulCompilation;
  const vm = await vmPromise;
  const result = verifyTransaction({
    spentOutputs: [utxoOutput],
    transaction,
    vm,
  });
  t.true(result, stringify(result));

  t.deepEqual(
    successfulCompilation,
    {
      success: true,
      transaction: decodeTransaction(
        /**
         * tx: c903aba46b4069e485b51292fd68eefdc95110fb95461b118c650fb454c34a9c
         */
        hexToBin(
          '0200000001600a1b6b0563bbd5b9bef124ff634600df774559da6c51e34a6b97a178be233401000000fc0047304402205e7d56c4e7854f9c672977d6606dd2f0af5494b8e61108e2a92fc920bf8049fc022065262675b0e1a3850d88bd3c56e0eb5fb463d9cdbe49f2f625da5c0f82c765304147304402200d167d5ed77fa169346d295f6fb742e80ae391f0ae086d42b99152bdb23edf4102202c8b85c2583b07b66485b88cacdd14f680bd3aa3f3f12e9f63bc02b4d1cc6d15414c6952210349c17cce8a460f013fdcd286f90f7b0330101d0f3ab4ced44a5a3db764e465882102a438b1662aec9c35f85794600e1d2d3683a43cbb66307cf825fc4486b84695452103d9fffac162e9e15aecbe4f937b951815ccb4f940c850fff9ee52fa70805ae7de53ae000000000100000000000000000d6a0b68656c6c6f20776f726c6400000000'
        )
      ),
    },
    `${stringify(successfulCompilation)} - ${stringify(
      encodeTransaction(successfulCompilation.transaction)
    )}`
  );
});
