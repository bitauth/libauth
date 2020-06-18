/* eslint-disable functional/no-expression-statement, @typescript-eslint/no-magic-numbers */
import test from 'ava';

import {
  binToHex,
  createTransactionContextCommon,
  decodeTransactionUnsafe,
  generateSigningSerializationBCH,
  hexToBin,
  instantiateSha256,
  isLegacySigningSerialization,
  numberToBinInt32TwosCompliment,
} from '../../../lib';
import * as sighashTests from '../bch/fixtures/bitcoin-abc/sighash.json';

const tests = Object.values(sighashTests)
  .filter((e) => e.length !== 1 && e.length < 8)
  .map((expectation, testIndex) => ({
    inputIndex: expectation[2] as number,
    scriptHex: expectation[1] as string,
    signingSerializationBCHDigestHex: expectation[4] as string,
    signingSerializationType: expectation[3] as number,
    testIndex,
    transactionHex: expectation[0] as string,
  }))
  .filter(
    (expectation) =>
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
// const pendingTests = tests.filter(e => e.testIndex === 999);
const pendingTests = tests;

const sha256Promise = instantiateSha256();

pendingTests.map((expectation, currentTest) => {
  test(`[signing-serialization tests] sighash.json ${currentTest}/${pendingTests.length} (#${expectation.testIndex})`, async (t) => {
    const sha256 = await sha256Promise;
    const tx = decodeTransactionUnsafe(hexToBin(expectation.transactionHex));
    const lockingBytecode = hexToBin(expectation.scriptHex);

    const signingSerializationType = numberToBinInt32TwosCompliment(
      expectation.signingSerializationType
    );
    const state = createTransactionContextCommon({
      inputIndex: expectation.inputIndex,
      sourceOutput: { satoshis: new Uint8Array(8) },
      spendingTransaction: tx,
    });
    const serialization = generateSigningSerializationBCH({
      correspondingOutput: state.correspondingOutput,
      coveredBytecode: lockingBytecode,
      forkId: signingSerializationType.slice(1, 4),
      locktime: state.locktime,
      outpointIndex: state.outpointIndex,
      outpointTransactionHash: state.outpointTransactionHash,
      outputValue: state.outputValue,
      sequenceNumber: state.sequenceNumber,
      sha256,
      signingSerializationType: signingSerializationType.slice(0, 1),
      transactionOutpoints: state.transactionOutpoints,
      transactionOutputs: state.transactionOutputs,
      transactionSequenceNumbers: state.transactionSequenceNumbers,
      version: state.version,
    });
    const digest = sha256.hash(sha256.hash(serialization));
    t.deepEqual(
      digest,
      hexToBin(expectation.signingSerializationBCHDigestHex).reverse(),
      `failed serialization: ${binToHex(serialization)}`
    );
  });
  return undefined;
});
