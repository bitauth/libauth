/* eslint-disable camelcase */
/* eslint-disable functional/no-expression-statement */

import test from 'ava';

import {
  allErrorsAreRecoverable,
  authenticationTemplateToCompilerBCH,
  CashAddressNetworkPrefix,
  CompilationData,
  CompilationError,
  generateTransaction,
  hexToBin,
  lockingBytecodeToCashAddress,
  stringify,
  validateAuthenticationTemplate,
} from '../lib';

import { twoOfThree } from './fixtures/template.2-of-3.spec.helper';
import {
  hdPrivateKey0H,
  hdPublicKey0H,
  hdPublicKey1H,
  hdPublicKey2H,
} from './transaction-e2e.spec.helper';

test('transaction e2e tests: 2-of-3 multisig', async (t) => {
  const template = validateAuthenticationTemplate(twoOfThree);
  if (typeof template === 'string') {
    t.fail(template);
    return;
  }

  const lockingScript = 'lock';

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

  const utxoOutpointTransactionHash = hexToBin(
    '68127de83d2ab77d7f5fd8d2ac6181d94473c0cbb2d0776084bf28884f6ecd77'
  );

  const signer1UnlockingData: CompilationData<never> = {
    hdKeys: {
      addressIndex: 0,
      hdPrivateKeys: {
        signer_1: hdPrivateKey0H,
      },
      hdPublicKeys,
    },
  };

  const signer1Attempt = generateTransaction({
    inputs: [
      {
        outpointIndex: 1,
        outpointTransactionHash: utxoOutpointTransactionHash,
        sequenceNumber: 0,
        unlockingBytecode: {
          compiler,
          data: signer1UnlockingData,
          output: {
            lockingBytecode: {
              compiler,
              data: lockingData,
              script: 'lock',
            },
            satoshis: 1000000,
          },
          script: '1_and_3',
        },
      },
    ],
    locktime: 0,
    outputs: [
      {
        lockingBytecode: hexToBin('6a0b68656c6c6f20776f726c64'),
        satoshis: 0,
      },
    ],
    version: 2,
  });

  if (signer1Attempt.success) {
    t.log('signer1Attempt:', stringify(signer1Attempt));
    t.fail();
    return;
  }
  const allErrors = signer1Attempt.errors.reduce<CompilationError[]>(
    (all, error) => [...all, ...error.errors],
    []
  );

  if (!allErrorsAreRecoverable(allErrors)) {
    t.log(stringify(allErrors));
    t.fail();
    return;
  }

  const missingVariables = allErrors.reduce(
    (all, error) => ({
      ...all,
      [error.missingIdentifier]:
        compiler.environment.entityOwnership?.[
          error.missingIdentifier.split('.')[0]
        ],
    }),
    {}
  );

  t.deepEqual(missingVariables, {
    'key3.signature.all_outputs': 'signer_3',
  });

  // TODO: extract the resolved variables, and pass to the next signer

  t.deepEqual(1, 1);

  // signer 3: attempt again, but with signer 1's resolved variables (their signature), should succeed

  /*
   * t.deepEqual(signer3Attempt, {
   *   success: true,
   *   transaction: deserializeTransaction(hexToBin('todo')),
   * });
   */
});
