// tslint:disable:no-expression-statement no-magic-numbers
import test from 'ava';

import { instantiateSha256 } from '../../../crypto/sha256';
import { deserializeTransaction } from '../../../transaction';
import { binToHex, hexToBin } from '../../../utils/hex';
import { numberToBinUint32LE } from '../../../utils/utils';
import * as sighashTests from '../bch/fixtures/bitcoin-abc/sighash.json';

import { createAuthenticationProgramExternalStateCommon } from './common';
import {
  generateSigningSerializationBCH,
  isLegacySigningSerialization
} from './signing-serialization';

const tests = Object.values(sighashTests)
  .filter(e => e.length !== 1 && e.length < 8)
  .map((expectation, testIndex) => ({
    inputIndex: expectation[2] as number,
    scriptHex: expectation[1] as string,
    signingSerializationBCHDigestHex: expectation[4] as string,
    signingSerializationType: expectation[3] as number,
    testIndex,
    transactionHex: expectation[0] as string
  }))
  .filter(
    expectation =>
      /**
       * Currently, this library only supports the new BCH signing serialization
       * algorithm. If the legacy algorithm is implemented, we can re-enable the
       * rest of these tests.
       */
      !isLegacySigningSerialization(expectation.signingSerializationType)
  );

/**
 * Isolate a single test for debugging
 */
// const pendingTests = tests.filter(e => e.testIndex === 123);
const pendingTests = tests;

const sha256Promise = instantiateSha256();

pendingTests.map((expectation, currentTest) => {
  test(`signing-serialization tests: sighash.json ${currentTest}/${pendingTests.length} (#${expectation.testIndex})`, async t => {
    const sha256 = await sha256Promise;
    const tx = deserializeTransaction(hexToBin(expectation.transactionHex));
    const script = hexToBin(expectation.scriptHex);
    const signingSerializationType = numberToBinUint32LE(
      expectation.signingSerializationType
    );
    const state = createAuthenticationProgramExternalStateCommon(
      {
        inputIndex: expectation.inputIndex,
        sourceOutput: {
          lockingBytecode: script,
          satoshis: BigInt(0)
        },
        spendingTransaction: tx
      },
      sha256
    );
    const serialization = generateSigningSerializationBCH(
      state.version,
      state.hashTransactionOutpoints,
      state.hashTransactionSequenceNumbers,
      state.outpointTransactionHash,
      state.outpointIndex,
      script,
      state.outputValue,
      state.sequenceNumber,
      state.hashCorrespondingOutput,
      state.hashTransactionOutputs,
      state.locktime,
      signingSerializationType.slice(0, 1),
      signingSerializationType.slice(1, 4)
    );
    const digest = sha256.hash(sha256.hash(serialization));
    t.deepEqual(
      digest,
      hexToBin(expectation.signingSerializationBCHDigestHex).reverse(),
      `failed serialization: ${binToHex(serialization)}`
    );
  });
});
