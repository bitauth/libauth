import test from 'ava';

import {
  binToHex,
  decodeTransactionUnsafeCommon,
  encodeSigningSerializationBCH,
  generateSigningSerializationComponentsBCH,
  hexToBin,
  instantiateSha256,
  isLegacySigningSerialization,
  numberToBinInt32TwosCompliment,
} from '../../../lib.js';
// eslint-disable-next-line import/no-internal-modules, import/no-restricted-paths
import sighashTests from '../bch/2021/fixtures/bchn/sighash.json' assert { type: 'json' };

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
    const tx = decodeTransactionUnsafeCommon(
      hexToBin(expectation.transactionHex)
    );
    const lockingBytecode = hexToBin(expectation.scriptHex);

    const signingSerializationType = numberToBinInt32TwosCompliment(
      expectation.signingSerializationType
    );
    const sourceOutputs = [];
    sourceOutputs[expectation.inputIndex] = {
      lockingBytecode: Uint8Array.of(),
      valueSatoshis: new Uint8Array(8),
    };

    const components = generateSigningSerializationComponentsBCH({
      inputIndex: expectation.inputIndex,
      sourceOutputs,
      transaction: tx,
    });
    const serialization = encodeSigningSerializationBCH({
      correspondingOutput: components.correspondingOutput,
      coveredBytecode: lockingBytecode,
      forkId: signingSerializationType.slice(1, 4),
      locktime: components.locktime,
      outpointIndex: components.outpointIndex,
      outpointTransactionHash: components.outpointTransactionHash,
      outputValue: components.outputValue,
      sequenceNumber: components.sequenceNumber,
      signingSerializationType: signingSerializationType.slice(0, 1),
      transactionOutpoints: components.transactionOutpoints,
      transactionOutputs: components.transactionOutputs,
      transactionSequenceNumbers: components.transactionSequenceNumbers,
      version: components.version,
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
