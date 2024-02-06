/* eslint-disable @typescript-eslint/no-non-null-assertion */
import test from 'ava';

import type { AuthenticationProgramStateBCH } from '../../../lib.js';
import {
  assembleBitcoinSatoshiScript,
  createTestAuthenticationProgramBCH,
  createVirtualMachineXEC,
  disassembleBytecodeBCH,
  stackItemIsTruthy,
  stringify,
  stringifyDebugTraceSummary,
  summarizeDebugTrace,
} from '../../../lib.js';

// eslint-disable-next-line import/no-restricted-paths, import/no-internal-modules
import scriptTestsAddendum from './fixtures/satoshi-client/script-tests-addendum.json' assert { type: 'json' };
// eslint-disable-next-line import/no-restricted-paths, import/no-internal-modules
import scriptTests from './fixtures/satoshi-client/script_tests.json' assert { type: 'json' };

const tests = Object.values(scriptTests)
  .filter((e) => e.length !== 1 && e.length < 7)
  .map((expectation, testIndex) => {
    const valueSatoshis =
      typeof expectation[0] === 'string'
        ? 0
        : (expectation.shift() as number[])[0]! * 1e8;
    return {
      expectedError:
        expectation[3] === 'OK' ? (false as const) : (expectation[3] as string),
      flags: { dirtyStack: false, failRequiresReview: false, useStrict: false },
      lockingBytecodeText: expectation[1] as string,
      message: expectation[4] as string | undefined,
      testIndex,
      unlockingBytecodeText: expectation[0] as string,
      valueSatoshis,
    };
  });

const failRequiresReviewTests = scriptTestsAddendum.failRequiresReview;
const { requiresMinimalEncoding } = scriptTestsAddendum;
const invalidUnlockTests = scriptTestsAddendum.invalidUnlock;
const dirtyStackTests = scriptTestsAddendum.dirtyStack;
const strictTests = scriptTestsAddendum.useStrict;
const expectedFailureTests = scriptTestsAddendum.fail
  .concat(failRequiresReviewTests)
  .concat(requiresMinimalEncoding);
/**
 * BCH doesn't currently use the `SCRIPT_VERIFY_MINIMALIF` flag (even in "strict
 * mode"), so there's no reason to implement or test it here.
 */
const minimalIfTests = scriptTestsAddendum.minimalIf;
const expectedPassTests = scriptTestsAddendum.pass.concat(minimalIfTests);
invalidUnlockTests.map((index) => {
  tests[index]!.lockingBytecodeText = `${tests[index]!.unlockingBytecodeText} ${
    tests[index]!.lockingBytecodeText
  }`;
  tests[index]!.unlockingBytecodeText = '';
  return undefined;
});
failRequiresReviewTests.forEach((index) => {
  tests[index]!.flags.failRequiresReview = true;
});
dirtyStackTests.forEach((index) => {
  tests[index]!.flags.dirtyStack = true;
});
strictTests.forEach((index) => {
  tests[index]!.flags.useStrict = true;
});
expectedFailureTests.forEach((index) => {
  tests[index]!.expectedError = 'OVERRIDDEN_FAIL';
});
expectedPassTests.forEach((index) => {
  tests[index]!.expectedError = false;
});
const { overrides } = scriptTestsAddendum;
Object.entries(overrides.unlocking).forEach(([index, script]) => {
  tests[Number(index)]!.unlockingBytecodeText = script;
});
Object.entries(overrides.locking).forEach(([index, script]) => {
  tests[Number(index)]!.lockingBytecodeText = script;
});

const validateDirtyStackState = (state: AuthenticationProgramStateBCH) =>
  state.error === undefined &&
  state.stack.length > 0 &&
  stackItemIsTruthy(state.stack[state.stack.length - 1]!);

/**
 * Isolate a single test for debugging
 */
// const pendingTests = tests.filter((e) => e.testIndex === 436);
const pendingTests = tests;

const elide = (text: string, length: number) =>
  text.length > length ? `${text.slice(0, length)}...` : text;

const vmNonStandard = createVirtualMachineXEC(false);
const vmStandard = createVirtualMachineXEC(true);

pendingTests.map((expectation) => {
  const description = `[script_tests] ${expectation.testIndex}/${
    pendingTests.length
  } - "${elide(expectation.unlockingBytecodeText, 100)}" | "${elide(
    expectation.lockingBytecodeText,
    100,
  )}" ${
    expectation.expectedError === false ? 'passes' : expectation.expectedError
  } ${expectation.message === undefined ? '' : ` # ${expectation.message}`}`;
  if (expectation.flags.failRequiresReview) {
    test.todo(`Review failure: ${description}`);
  }
  test(
    description,
    // eslint-disable-next-line complexity
    (t) => {
      const unlockingBytecode = assembleBitcoinSatoshiScript(
        expectation.unlockingBytecodeText,
      );
      const lockingBytecode = assembleBitcoinSatoshiScript(
        expectation.lockingBytecodeText,
      );
      const vm = expectation.flags.useStrict ? vmStandard : vmNonStandard;
      const program = createTestAuthenticationProgramBCH({
        lockingBytecode,
        unlockingBytecode,
        valueSatoshis: BigInt(expectation.valueSatoshis),
      });
      const result = vm.evaluate(program);
      const valid = expectation.flags.dirtyStack
        ? validateDirtyStackState(result)
        : vm.stateSuccess(result) === true;
      const pass =
        (valid && expectation.expectedError === false) ||
        (!valid && expectation.expectedError !== false);
      if (!pass) {
        t.log(`unlockingBytecodeText: "${expectation.unlockingBytecodeText}"`);
        t.log(`disassembled: "${disassembleBytecodeBCH(unlockingBytecode)}"`);
        t.log(`lockingBytecodeText: "${expectation.lockingBytecodeText}"`);
        t.log(`disassembled: "${disassembleBytecodeBCH(lockingBytecode)}"`);
        t.log('result:', stringify(result));
        t.log(
          'debug:',
          stringifyDebugTraceSummary(summarizeDebugTrace(vm.debug(program))),
        );
        if (expectation.expectedError === false) {
          t.fail('Expected a valid state, but this result is invalid.');
          return;
        }
        t.fail(`Expected error reason: ${expectation.expectedError}`);
        return;
      }
      t.pass();
    },
  );
  return undefined;
});
