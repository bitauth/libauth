/* eslint-disable functional/no-expression-statement, camelcase, @typescript-eslint/naming-convention */

import test from 'ava';

import {
  authenticationTemplateToCompilerBCH,
  bigIntToBinUint64LE,
  BytecodeGenerationCompletionInput,
  CashAddressNetworkPrefix,
  CompilationData,
  compileBtl,
  dateToLocktime,
  decodeTransaction,
  encodeTransaction,
  extractMissingVariables,
  generateTransaction,
  hexToBin,
  instantiateVirtualMachineBCH,
  lockingBytecodeToCashAddress,
  stringify,
  validateAuthenticationTemplate,
  verifyTransaction,
} from '../lib';

import {
  hdPrivateKey0H,
  hdPrivateKey1H,
  hdPrivateKey2H,
  hdPublicKey0H,
  hdPublicKey1H,
  hdPublicKey2H,
  twoOfTwoRecoverableJson,
} from './transaction-e2e.spec.helper';

const vmPromise = instantiateVirtualMachineBCH();

// eslint-disable-next-line complexity
test('transaction e2e tests: 2-of-2 Recoverable Vault', async (t) => {
  const template = validateAuthenticationTemplate(twoOfTwoRecoverableJson);
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
    trusted_party: hdPublicKey2H,
  };

  const creationDate = dateToLocktime(
    new Date('2020-01-01T00:00:00.000Z')
  ) as number;
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  const threeMonths = 60 * 60 * 24 * 90;
  const locktimeFourMonthsLater = dateToLocktime(
    new Date('2020-04-01T00:00:00.000Z')
  ) as number;

  const lockingData: CompilationData<never> = {
    bytecode: { delay_seconds: compileBtl(`${threeMonths}`) as Uint8Array },
    currentBlockTime: creationDate,
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

  t.deepEqual(address, 'bchtest:pz8p649zg3a492hxy86sh0ccvc7sptrlx5cp3eapah');

  const satoshis = 10000;
  const utxoOutput1 = {
    lockingBytecode: lockingBytecode.bytecode,
    satoshis: bigIntToBinUint64LE(BigInt(satoshis)),
  };

  const utxoOutput2 = {
    lockingBytecode: lockingBytecode.bytecode,
    satoshis: bigIntToBinUint64LE(BigInt(satoshis)),
  };

  /**
   * Test standard spend:
   */
  const input1 = {
    outpointIndex: 0,
    outpointTransactionHash: hexToBin(
      '6168cbf5d24784df4fef46e1e5cfacaee14cda4c29dd8114b9cfc44972aea46a'
    ),
    sequenceNumber: 0,
    unlockingBytecode: {
      compiler,
      satoshis: utxoOutput1.satoshis,
      script: 'spend',
    },
  };

  /**
   * Test delayed recovery (in the same TX to make a useful reference TX):
   */
  const input2 = {
    outpointIndex: 1,
    outpointTransactionHash: hexToBin(
      '0ce50e17e71dadd8ba59e89a291cf3082862b32b229c5fbfc8dee3288165d97c'
    ),
    sequenceNumber: 0,
    unlockingBytecode: {
      compiler,
      satoshis: utxoOutput2.satoshis,
      script: 'recover_1',
    },
  };

  const transactionProposal = {
    locktime: locktimeFourMonthsLater,
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
      {
        ...input2,
        unlockingBytecode: {
          ...input2.unlockingBytecode,
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
    'second.signature.all_outputs': 'signer_2',
    'trusted.signature.all_outputs': 'trusted_party',
  });

  t.deepEqual(signer1Attempt.completions, []);

  const expectedSigner1SignatureInput1 = hexToBin(
    '304402200a34f3387a8aa3d7ed55506fbddb6957e27cc42063410306ac82e7a77f4d7030022065b08d5a07fac82d1cd6c90ff126f1af965e541525676538eab088b99daa897b41'
  );
  const expectedSigner1SignatureInput2 = hexToBin(
    '3044022028141930f622819de84cf1a1b42fc2ea15c56bafd45e768c72fd84b4d0fe5b7e022066f659c79e6d8b6c53561be0b472bbeb355ffa443828fd8fb083148ffd26e8c841'
  );

  /**
   * Signer 2 adds their signature, pulling in missing variables from signer 1
   */

  const signer2UnlockingData: CompilationData<never> = {
    ...lockingData,
    hdKeys: {
      ...lockingData.hdKeys,
      hdPrivateKeys: {
        signer_2: hdPrivateKey1H,
      },
    },
  };

  const signer2Attempt = generateTransaction({
    ...transactionProposal,
    inputs: [
      {
        ...input1,
        unlockingBytecode: {
          ...input1.unlockingBytecode,
          data: signer2UnlockingData,
        },
      },
      {
        ...input2,
        unlockingBytecode: {
          ...input2.unlockingBytecode,
          data: signer2UnlockingData,
        },
      },
    ],
  });

  if (signer2Attempt.success) {
    t.log('signer2Attempt:', stringify(signer2Attempt));
    t.fail();
    return;
  }

  const signer2Attempt2 = generateTransaction({
    ...transactionProposal,
    inputs: [
      {
        ...input1,
        unlockingBytecode: {
          ...input1.unlockingBytecode,
          data: {
            ...signer2UnlockingData,
            bytecode: {
              ...signer2UnlockingData.bytecode,
              'first.signature.all_outputs': expectedSigner1SignatureInput1,
            },
          },
        },
      },
      {
        ...input2,
        unlockingBytecode: {
          ...input2.unlockingBytecode,
          data: {
            ...signer2UnlockingData,
            bytecode: {
              ...signer2UnlockingData.bytecode,
              'first.signature.all_outputs': expectedSigner1SignatureInput2,
            },
          },
        },
      },
    ],
  });

  if (signer2Attempt2.success) {
    t.log('signer2Attempt2:', stringify(signer2Attempt2));
    t.fail();
    return;
  }

  const signer2Attempt2MissingVariables = extractMissingVariables(
    signer2Attempt2
  );

  t.deepEqual(signer2Attempt2MissingVariables, {
    'trusted.signature.all_outputs': 'trusted_party',
  });

  t.deepEqual(
    signer2Attempt2.completions,
    [
      {
        index: 0,
        input: {
          ...input1,
          unlockingBytecode: hexToBin(
            '0047304402200a34f3387a8aa3d7ed55506fbddb6957e27cc42063410306ac82e7a77f4d7030022065b08d5a07fac82d1cd6c90ff126f1af965e541525676538eab088b99daa897b4147304402207d987a4d736fb6abb5f90109da05411e515c212c3b2c8527d15e8d863fe83957022004ad83f50e7b1ae87665c211717caca4b9e9714cd2d27bc4759cf6482394c9f641004c7563040088825eb1752103d9fffac162e9e15aecbe4f937b951815ccb4f940c850fff9ee52fa70805ae7dead51675268210349c17cce8a460f013fdcd286f90f7b0330101d0f3ab4ced44a5a3db764e465882102a438b1662aec9c35f85794600e1d2d3683a43cbb66307cf825fc4486b846954552ae'
          ),
        },
        type: 'input',
      },
    ],
    stringify(signer2Attempt2.completions)
  );

  const completedInput1 = (signer2Attempt2
    .completions[0] as BytecodeGenerationCompletionInput).input;

  /**
   * Signer 3 adds their signature, pulling in the completed first input
   */

  const signer3UnlockingData: CompilationData<never> = {
    ...lockingData,
    hdKeys: {
      ...lockingData.hdKeys,
      hdPrivateKeys: {
        trusted_party: hdPrivateKey2H,
      },
    },
  };

  const signer3Attempt = generateTransaction({
    ...transactionProposal,
    inputs: [
      completedInput1,
      {
        ...input2,
        unlockingBytecode: {
          ...input2.unlockingBytecode,
          data: signer3UnlockingData,
        },
      },
    ],
  });

  if (signer3Attempt.success) {
    t.log('signer3Attempt:', stringify(signer3Attempt));
    t.fail();
    return;
  }

  const successfulCompilation = generateTransaction({
    ...transactionProposal,
    inputs: [
      completedInput1,
      {
        ...input2,
        unlockingBytecode: {
          ...input2.unlockingBytecode,
          data: {
            ...signer3UnlockingData,
            bytecode: {
              ...signer3UnlockingData.bytecode,
              'first.signature.all_outputs': expectedSigner1SignatureInput2,
            },
          },
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
    spentOutputs: [utxoOutput1, utxoOutput2],
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
         * tx: e6c808adcb3cfc06461e962373659554bf6c447ea7b25ac503ff429e21050755
         */
        hexToBin(
          '02000000026aa4ae7249c4cfb91481dd294cda4ce1aeaccfe5e146ef4fdf8447d2f5cb686100000000fd09010047304402200a34f3387a8aa3d7ed55506fbddb6957e27cc42063410306ac82e7a77f4d7030022065b08d5a07fac82d1cd6c90ff126f1af965e541525676538eab088b99daa897b4147304402207d987a4d736fb6abb5f90109da05411e515c212c3b2c8527d15e8d863fe83957022004ad83f50e7b1ae87665c211717caca4b9e9714cd2d27bc4759cf6482394c9f641004c7563040088825eb1752103d9fffac162e9e15aecbe4f937b951815ccb4f940c850fff9ee52fa70805ae7dead51675268210349c17cce8a460f013fdcd286f90f7b0330101d0f3ab4ced44a5a3db764e465882102a438b1662aec9c35f85794600e1d2d3683a43cbb66307cf825fc4486b846954552ae000000007cd9658128e3dec8bf5f9c222bb3622808f31c299ae859bad8ad1de7170ee50c01000000fd0a0100473044022028141930f622819de84cf1a1b42fc2ea15c56bafd45e768c72fd84b4d0fe5b7e022066f659c79e6d8b6c53561be0b472bbeb355ffa443828fd8fb083148ffd26e8c841483045022100d62f54380b58b99677467a4016fceffd1cd85adabe6d2ffffab61a7e599dc5d302207a43e7809e5afae5069cef08d5f4960adcb9d245d295bbdf6bb8ab9a9056d11441514c7563040088825eb1752103d9fffac162e9e15aecbe4f937b951815ccb4f940c850fff9ee52fa70805ae7dead51675268210349c17cce8a460f013fdcd286f90f7b0330101d0f3ab4ced44a5a3db764e465882102a438b1662aec9c35f85794600e1d2d3683a43cbb66307cf825fc4486b846954552ae000000000100000000000000000d6a0b68656c6c6f20776f726c6480d9835e'
        )
      ),
    },
    `${stringify(successfulCompilation)} - ${stringify(
      encodeTransaction(successfulCompilation.transaction)
    )}`
  );
});
