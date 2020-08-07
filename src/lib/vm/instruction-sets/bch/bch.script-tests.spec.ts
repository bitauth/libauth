/* eslint-disable functional/no-expression-statement, @typescript-eslint/no-magic-numbers, functional/immutable-data */
import test from 'ava';

import {
  assembleBitcoinABCScript,
  AuthenticationProgramStateBCH,
  bigIntToBinUint64LE,
  createTestAuthenticationProgramBCH,
  disassembleBytecodeBCH,
  instantiateSha256,
  instantiateVirtualMachineBCH,
  InstructionSetBCH,
  stackItemIsTruthy,
} from '../../../lib';

import * as scriptTestsAddendum from './fixtures/bitcoin-abc/script-tests-addendum.json';
import * as scriptTests from './fixtures/bitcoin-abc/script_tests.json';

const tests = Object.values(scriptTests)
  .filter((e) => e.length !== 1 && e.length < 7)
  .map((expectation, testIndex) => {
    const satoshis =
      typeof expectation[0] === 'string'
        ? 0
        : (expectation.shift() as number[])[0] * 1e8;
    return {
      expectedError:
        expectation[3] === 'OK' ? (false as const) : (expectation[3] as string),
      flags: { dirtyStack: false, failRequiresReview: false, useStrict: false },
      lockingBytecodeText: expectation[1] as string,
      message: expectation[4] as string | undefined,
      satoshis,
      testIndex,
      unlockingBytecodeText: expectation[0] as string,
    };
  });

const failRequiresReviewTests = scriptTestsAddendum.failRequiresReview;
const invalidUnlockTests = scriptTestsAddendum.invalidUnlock;
const dirtyStackTests = scriptTestsAddendum.dirtyStack;
const strictTests = scriptTestsAddendum.useStrict;
const expectedFailureTests = scriptTestsAddendum.fail.concat(
  failRequiresReviewTests
);
/**
 * BCH doesn't currently use the `SCRIPT_VERIFY_MINIMALIF` flag (even in "strict
 * mode"), so there's no reason to implement or test it here.
 */
const minimalIfTests = scriptTestsAddendum.minimalIf;
const expectedPassTests = scriptTestsAddendum.pass.concat(minimalIfTests);
invalidUnlockTests.map((index) => {
  tests[
    index
  ].lockingBytecodeText = `${tests[index].unlockingBytecodeText} ${tests[index].lockingBytecodeText}`;
  tests[index].unlockingBytecodeText = '';
  return undefined;
});
failRequiresReviewTests.map((index) => {
  tests[index].flags.failRequiresReview = true;
  return undefined;
});
dirtyStackTests.map((index) => {
  tests[index].flags.dirtyStack = true;
  return undefined;
});
strictTests.map((index) => {
  tests[index].flags.useStrict = true;
  return undefined;
});
expectedFailureTests.map((index) => {
  tests[index].expectedError = 'OVERRIDDEN_FAIL';
  return undefined;
});
expectedPassTests.map((index) => {
  tests[index].expectedError = false;
  return undefined;
});
const { overrides } = scriptTestsAddendum;
Object.entries(overrides.unlocking).map(([index, script]) => {
  tests[Number(index)].unlockingBytecodeText = script;
  return undefined;
});
Object.entries(overrides.locking).map(([index, script]) => {
  tests[Number(index)].lockingBytecodeText = script;
  return undefined;
});

const validateDirtyStackState = (state: AuthenticationProgramStateBCH) =>
  state.error === undefined &&
  stackItemIsTruthy(state.stack[state.stack.length - 1]);

/**
 * Isolate a single test for debugging
 */
// const pendingTests = tests.filter(e => e.testIndex === 1399);
const pendingTests = tests;

const elide = (text: string, length: number) =>
  text.length > length ? `${text.slice(0, length)}...` : text;

const vmPromise = instantiateVirtualMachineBCH(InstructionSetBCH.BCH_2020_05);
const vmStrictPromise = instantiateVirtualMachineBCH(
  InstructionSetBCH.BCH_2020_05_STRICT
);
const sha256Promise = instantiateSha256();

pendingTests.map((expectation) => {
  const description = `[script_tests] ${expectation.testIndex}/${
    pendingTests.length
  } – "${elide(expectation.unlockingBytecodeText, 100)}" | "${elide(
    expectation.lockingBytecodeText,
    100
  )}"${expectation.message === undefined ? '' : ` # ${expectation.message}`}`;
  // eslint-disable-next-line functional/no-conditional-statement
  if (expectation.flags.failRequiresReview) {
    test.todo(`Review failure: ${description}`);
  }
  test(
    description,
    // eslint-disable-next-line complexity
    async (t) => {
      const unlockingBytecode = assembleBitcoinABCScript(
        expectation.unlockingBytecodeText
      );
      const lockingBytecode = assembleBitcoinABCScript(
        expectation.lockingBytecodeText
      );
      const vm = expectation.flags.useStrict
        ? await vmStrictPromise
        : await vmPromise;
      const sha256 = await sha256Promise;
      const program = createTestAuthenticationProgramBCH({
        lockingBytecode,
        satoshis: bigIntToBinUint64LE(BigInt(expectation.satoshis)),
        sha256,
        unlockingBytecode,
      });
      const result = vm.evaluate(program);
      const valid = expectation.flags.dirtyStack
        ? validateDirtyStackState(result)
        : vm.verify(result) === true;
      const pass =
        (valid && expectation.expectedError === false) ||
        (!valid && expectation.expectedError !== false);
      if (!pass) {
        t.log(`unlockingBytecodeText: "${expectation.unlockingBytecodeText}"`);
        t.log(`disassembled: "${disassembleBytecodeBCH(unlockingBytecode)}"`);
        t.log(`lockingBytecodeText: "${expectation.lockingBytecodeText}"`);
        t.log(`disassembled: "${disassembleBytecodeBCH(lockingBytecode)}"`);
        t.log('result:', result);
        if (expectation.expectedError === false) {
          t.fail('Expected a valid state, but this result is invalid.');
          return;
        }
        t.fail(`Expected error reason: ${expectation.expectedError}`);
        return;
      }
      t.pass();
    }
  );
  return undefined;
});
