import test from 'ava';

import {
  binToHex,
  decodeTransactionUnsafeCommon,
  encodeSigningSerializationBCH,
  generateSigningSerializationComponentsBCH,
  hash256,
  hexToBin,
  isLegacySigningSerialization,
  numberToBinInt32TwosCompliment,
} from '../../../lib.js';
// eslint-disable-next-line import/no-internal-modules, import/no-restricted-paths
import sighashTests from '../xec/fixtures/satoshi-client/sighash.json' assert { type: 'json' };

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
      !isLegacySigningSerialization(expectation.signingSerializationType),
  );

/**
 * Isolate a single test for debugging
 */
// const pendingTests = tests.filter(e => e.testIndex === 999);
const pendingTests = tests;

pendingTests.map((expectation, currentTest) => {
  test.skip(`[signing-serialization tests] sighash.json ${currentTest}/${pendingTests.length} (#${expectation.testIndex})`, (t) => {
    const tx = decodeTransactionUnsafeCommon(
      hexToBin(expectation.transactionHex),
    );
    const lockingBytecode = hexToBin(expectation.scriptHex);

    const signingSerializationType = numberToBinInt32TwosCompliment(
      expectation.signingSerializationType,
    );
    const sourceOutputs = [];
    sourceOutputs[expectation.inputIndex] = {
      lockingBytecode: Uint8Array.of(),
      valueSatoshis: 0n,
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
      outputTokenPrefix: components.outputTokenPrefix,
      outputValue: components.outputValue,
      sequenceNumber: components.sequenceNumber,
      signingSerializationType: signingSerializationType.slice(0, 1),
      transactionOutpoints: components.transactionOutpoints,
      transactionOutputs: components.transactionOutputs,
      transactionSequenceNumbers: components.transactionSequenceNumbers,
      transactionUtxos: components.transactionUtxos,
      version: components.version,
    });
    const digest = hash256(serialization);
    t.deepEqual(
      digest,
      hexToBin(expectation.signingSerializationBCHDigestHex).reverse(),
      `failed serialization: ${binToHex(serialization)}`,
    );
  });
  return undefined;
});
