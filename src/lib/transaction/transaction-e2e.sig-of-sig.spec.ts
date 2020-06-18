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
  stringify,
  validateAuthenticationTemplate,
  verifyTransaction,
} from '../lib';

import {
  hdPrivateKey0H,
  hdPrivateKey1H,
  hdPublicKey0H,
  hdPublicKey1H,
  sigOfSigJson,
} from './transaction-e2e.spec.helper';

const vmPromise = instantiateVirtualMachineBCH();

// eslint-disable-next-line complexity
test('transaction e2e tests: Sig-of-Sig Example', async (t) => {
  const template = validateAuthenticationTemplate(sigOfSigJson);
  if (typeof template === 'string') {
    t.fail(stringify(template));
    return;
  }

  /**
   * The HD public keys shared between the entities at wallet creation time
   */
  const hdPublicKeys = {
    signer_1: hdPublicKey0H,
    signer_2: hdPublicKey1H,
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

  t.deepEqual(address, 'bchtest:ppcvyjuqwhuz06np4us443l26dzck305psl0dw6as9');

  const satoshis = 10000;
  const utxoOutput = {
    lockingBytecode: lockingBytecode.bytecode,
    satoshis: bigIntToBinUint64LE(BigInt(satoshis)),
  };

  const input = {
    outpointIndex: 1,
    outpointTransactionHash: hexToBin(
      '1a3c3f950738c23de2461f04b2acd4dfb6b6eb80daeb457f24a6084c45c7da01'
    ),
    sequenceNumber: 0,
    unlockingBytecode: {
      compiler,
      satoshis: utxoOutput.satoshis,
      script: 'spend',
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
        ...input,
        unlockingBytecode: {
          ...input.unlockingBytecode,
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

  t.deepEqual(signer1Attempt.completions, []);

  const signer1MissingVariables = extractMissingVariables(signer1Attempt);

  t.deepEqual(
    signer1MissingVariables,
    {
      'second.data_signature.first_signature': 'signer_2',
    },
    stringify(signer1MissingVariables)
  );

  const signer1ResolvedVariables = extractResolvedVariables(signer1Attempt);

  const expectedSigner1Signature = hexToBin(
    '30440220097cf5732181c1b398909993b4e7794d6f1dc2d40fa803e4e92665e929ce75d40220208df3ba16d67f20f3063bde3234a131845f21a724ef29dad5086d75d76385ec41'
  );

  t.deepEqual(
    signer1ResolvedVariables,
    {
      'first.public_key': hexToBin(
        '0349c17cce8a460f013fdcd286f90f7b0330101d0f3ab4ced44a5a3db764e46588'
      ),
      'first.signature.all_outputs': expectedSigner1Signature,
    },
    stringify(signer1ResolvedVariables)
  );

  /**
   * Signer 2 tries to sign (but needs Signer 1's signature)
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
        ...input,
        unlockingBytecode: {
          ...input.unlockingBytecode,
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

  const successfulCompilation = generateTransaction({
    ...transactionProposal,
    inputs: [
      {
        ...input,
        unlockingBytecode: {
          ...input.unlockingBytecode,
          data: {
            ...signer2UnlockingData,
            bytecode: {
              ...signer2UnlockingData.bytecode,
              'first.signature.all_outputs': expectedSigner1Signature,
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
    spentOutputs: [utxoOutput],
    transaction,
    vm,
  });
  t.true(result, stringify(result));

  t.deepEqual(
    successfulCompilation,
    {
      success: true,
      /**
       * tx: 47623fba38548005eb8e5773a288d3fa5898b80178e94296f7b9f82ee053560c
       */
      transaction: decodeTransaction(
        hexToBin(
          '020000000101dac7454c08a6247f45ebda80ebb6b6dfd4acb2041f46e23dc23807953f3c1a01000000f04730440220097cf5732181c1b398909993b4e7794d6f1dc2d40fa803e4e92665e929ce75d40220208df3ba16d67f20f3063bde3234a131845f21a724ef29dad5086d75d76385ec41210349c17cce8a460f013fdcd286f90f7b0330101d0f3ab4ced44a5a3db764e4658846304402201673c0f6e8741bf2fd259411c212a2d7e326fe4c238118c0dbcab662ef439de10220259d9cf3414f662b83f5d7210e5b5890cdb64ee7e36f2187e6377c9e88a484613e52792102a438b1662aec9c35f85794600e1d2d3683a43cbb66307cf825fc4486b8469545bb76a91433c4f1d1e60cbe8eda7cf976752bbb313780c7db88ac000000000100000000000000000d6a0b68656c6c6f20776f726c6400000000'
        )
      ),
    },
    `${stringify(successfulCompilation)} - ${stringify(
      encodeTransaction(successfulCompilation.transaction)
    )}`
  );
});
