/**
 * To debug an individual vmb tests, set the `debug` variable below. All other
 * tests will be skipped.
 *
 * Considering using the `Debug Active Spec` launch configuration with Visual
 * Studio Code.
 */

import test from 'ava';

import type { VmbTest } from '../lib.js';
import {
  createVirtualMachineBch2023,
  createVirtualMachineBch2025,
  createVirtualMachineBch2026,
  createVirtualMachineBchSpec,
  hexToBin,
  maskStaticProgramState,
  readTransactionCommon,
  readTransactionOutputs,
  stringify,
  stringifyDebugTraceSummary,
  summarizeDebugTrace,
} from '../lib.js';

import { vmbTestsBch } from './bch-vmb-tests.js';
import type { TestedVM, VmName } from './bch-vmb-tests.spec.helper.js';
/* eslint-disable import/no-restricted-paths, import/no-internal-modules */
import vmbTestsBchChipLoopsInvalidJson from './generated/CHIPs/bch_vmb_tests_chip_loops_invalid.json' with { type: 'json' };
import vmbTestsBchChipLoopsNonstandardJson from './generated/CHIPs/bch_vmb_tests_chip_loops_nonstandard.json' with { type: 'json' };
import vmbTestsBchChipLoopsStandardJson from './generated/CHIPs/bch_vmb_tests_chip_loops_standard.json' with { type: 'json' };
import vmbTestsBchJson from './generated/bch_vmb_tests.json' with { type: 'json' };
import vmbTestsBch2023InvalidJson from './generated/bch_vmb_tests_2023_invalid.json' with { type: 'json' };
import vmbTestsBch2023NonstandardJson from './generated/bch_vmb_tests_2023_nonstandard.json' with { type: 'json' };
import vmbTestsBch2023StandardJson from './generated/bch_vmb_tests_2023_standard.json' with { type: 'json' };
import vmbTestsBch2025InvalidJson from './generated/bch_vmb_tests_2025_invalid.json' with { type: 'json' };
import vmbTestsBch2025NonstandardJson from './generated/bch_vmb_tests_2025_nonstandard.json' with { type: 'json' };
import vmbTestsBch2025StandardJson from './generated/bch_vmb_tests_2025_standard.json' with { type: 'json' };
import vmbTestsBch2026InvalidJson from './generated/bch_vmb_tests_2026_invalid.json' with { type: 'json' };
import vmbTestsBch2026NonstandardJson from './generated/bch_vmb_tests_2026_nonstandard.json' with { type: 'json' };
import vmbTestsBch2026StandardJson from './generated/bch_vmb_tests_2026_standard.json' with { type: 'json' };

/* eslint-enable import/no-restricted-paths, import/no-internal-modules */

type DebugInfo = { testId: string; vmName: VmName } | undefined;
/**
 * =========== Debugging Info ===========
 */
const debug = undefined as DebugInfo;
/* spell-checker:disable-next-line */
// const debug = { testId: '12345', vmName: 'bch_spec_standard' } as DebugInfo;

const { FILTER_VMB_TESTS, FILTER_VMB_TEST_VM } = process.env;

if (FILTER_VMB_TESTS !== undefined) {
  // eslint-disable-next-line no-console
  console.log(
    `The 'FILTER_VMB_TESTS' environment variable is configured to filter VMB tests to descriptions matching: ${FILTER_VMB_TESTS}`,
  );
}
if (FILTER_VMB_TEST_VM !== undefined) {
  // eslint-disable-next-line no-console
  console.log(
    `The 'FILTER_VMB_TEST_VM' environment variable is configured to limit VMB tests to VM version: ${FILTER_VMB_TEST_VM}`,
  );
}

test('bch_vmb_tests.json is up to date and contains no test ID collisions', async (t) => {
  /* Trim any stack traces returned AVA */
  await Promise.resolve();
  const testGroupsAndTypes = 2;
  const allTestCases = vmbTestsBch.flat(testGroupsAndTypes);
  t.deepEqual(
    allTestCases,
    vmbTestsBchJson,
    'New test definitions were added to `bch-vmb.tests.ts`, but the generated tests were not updated. Run "yarn gen:vmb_tests" to correct this issue. (Note: tsc watch tasks don\'t always update cached JSON imports when the source file changes. You may need to restart tsc to clear this error after re-generating tests.)',
  );

  const testCaseIds = allTestCases.map((testCase) => testCase[0]);
  const descriptions = allTestCases.map((testCase) => testCase[1]);
  const idDup = testCaseIds.findIndex(
    (id, i) => testCaseIds.lastIndexOf(id) !== i,
  );
  const descDup = descriptions.findIndex(
    (desc, i) => descriptions.lastIndexOf(desc) !== i,
  );

  /* eslint-disable @typescript-eslint/no-non-null-assertion */
  if (idDup !== -1) {
    const lastCollisionId = testCaseIds.lastIndexOf(testCaseIds[idDup]!);
    return t.fail(`Multiple VMB test vectors share a short ID. Either increase the short ID length, or tweak one of the test definitions to eliminate the collision.

    Collision:
    ${allTestCases[idDup]![0]}: ${allTestCases[idDup]![1]}
    ${allTestCases[lastCollisionId]![0]}: ${allTestCases[lastCollisionId]![1]}
    `);
  }
  if (descDup !== -1) {
    const lastCollisionId = descriptions.lastIndexOf(descriptions[descDup]!);
    return t.fail(`Multiple VMB test vectors share a description. Please either include additional detail or remove the unnecessary test.

    Collision:
    ${allTestCases[descDup]![0]}: ${allTestCases[descDup]![1]}
    ${allTestCases[lastCollisionId]![0]}: ${allTestCases[lastCollisionId]![1]}
    `);
  }
  /* eslint-enable @typescript-eslint/no-non-null-assertion */
  return t.pass();
});

const testVm = ({
  fails,
  succeeds,
  vm,
  vmName,
}: {
  vmName: VmName;
  succeeds: VmbTest[][];
  fails: VmbTest[][];
  vm: TestedVM;
}) => {
  const runCase = test.macro<[VmbTest, boolean]>({
    // eslint-disable-next-line complexity
    exec: async (t, testCase, expectedToSucceed) => {
      /* Trim any stack traces returned AVA */
      await Promise.resolve();
      const [
        shortId,
        description,
        unlockingAsm,
        lockingAsm,
        txHex,
        sourceOutputsHex,
        inputIndex,
      ] = testCase;
      const testedIndex = inputIndex ?? 0;
      const sourceOutputsRead = readTransactionOutputs({
        bin: hexToBin(sourceOutputsHex),
        index: 0,
      });
      const transactionRead = readTransactionCommon({
        bin: hexToBin(txHex),
        index: 0,
      });
      if (typeof sourceOutputsRead === 'string') {
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        expectedToSucceed ? t.fail(sourceOutputsRead) : t.pass();
        return;
      }
      if (typeof transactionRead === 'string') {
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        expectedToSucceed ? t.fail(transactionRead) : t.pass();
        return;
      }
      const sourceOutputs = sourceOutputsRead.result;
      const transaction = transactionRead.result;
      if (debug !== undefined) debugger; // eslint-disable-line no-debugger
      const highMemory = description.includes('[high-memory]');
      const result = vm.verify({ sourceOutputs, transaction });
      const moreDetails = `For more detailed debugging information, run: "yarn test:unit:vmb_test ${vmName} ${shortId} -v"`;
      const logDebugInfo = () => {
        t.log(`unlockingAsm: ${unlockingAsm}`);
        t.log(`lockingAsm: ${lockingAsm}`);
        const program = {
          inputIndex: testedIndex,
          sourceOutputs,
          transaction,
        };
        const evaluateResult = vm.evaluate(program);
        if (highMemory) return;
        const debugResult = vm.debug(program, { maskProgramState: true });
        t.deepEqual(
          maskStaticProgramState(evaluateResult),
          debugResult[debugResult.length - 1],
          `vm.evaluate and the final result of vm.debug differ: is something being unexpectedly mutated? evaluateResult:\n\n${stringify(
            evaluateResult,
          )}\n\nFinal debugResult:\n\n${stringify(
            debugResult[debugResult.length - 1],
          )}`,
        );
        t.log(stringifyDebugTraceSummary(summarizeDebugTrace(debugResult)));
        t.log(moreDetails);
      };
      if (expectedToSucceed && typeof result === 'string') {
        const inputIssueRegExp = /evaluating input index (?<index>\d+)/u;
        const failingIndex = inputIssueRegExp.exec(result)?.groups?.['index'];
        if (
          failingIndex !== undefined &&
          Number(failingIndex) !== testedIndex
        ) {
          t.fail(
            `An unexpected input index caused VMB test "${shortId}" to fail for ${vmName}: the input index under test is ${testedIndex}, but input index ${failingIndex} failed. Error: ${result}`,
          );
          t.log(
            `Failing input at index ${failingIndex}:`,
            highMemory
              ? '(Skipped vm.debug due to "[high-memory]" label.)'
              : stringifyDebugTraceSummary(
                  summarizeDebugTrace(
                    vm.debug(
                      {
                        inputIndex: Number(failingIndex),
                        sourceOutputs,
                        transaction,
                      },
                      { maskProgramState: true },
                    ),
                  ),
                ),
          );
          t.log(moreDetails);
          return;
        }
        logDebugInfo();
        t.fail(
          `VMB test "${shortId}" - "${description}" - for ${vmName} is expected to succeed but failed. Error: ${result}`,
        );
        return;
      }
      if (!expectedToSucceed && typeof result !== 'string') {
        logDebugInfo();
        t.fail(
          `VMB test "${shortId}" - "${description}" - for ${vmName} is expected to fail but succeeded.`,
        );
        return;
      }
      t.pass();
    },
    title: (
      // eslint-disable-next-line @typescript-eslint/default-param-last
      caseNumberOfCaseCount = '(unknown/unknown)',
      [shortId, description],
    ) =>
      `[vmb_tests] [${vmName}] ${shortId} ${caseNumberOfCaseCount}: ${description}`,
  });
  const expectedPass = succeeds.flat(1);
  const expectedFail = fails.flat(1);

  // eslint-disable-next-line complexity
  const testOrSkip = ({
    description,
    testId,
  }: {
    description: string;
    testId: string;
  }): typeof test | typeof test.skip =>
    (FILTER_VMB_TEST_VM === undefined || vmName.includes(FILTER_VMB_TEST_VM)) &&
    (FILTER_VMB_TESTS === undefined ||
      description.includes(FILTER_VMB_TESTS)) &&
    (debug === undefined ||
      (vmName === debug.vmName && debug.testId === testId))
      ? test
      : test.skip;
  expectedPass.forEach((testCase, index) => {
    testOrSkip({ description: testCase[1], testId: testCase[0] })(
      `(${index + 1}/${expectedPass.length + expectedFail.length} valid)`,
      runCase,
      testCase,
      true,
    );
  });
  expectedFail.forEach((testCase, index) => {
    testOrSkip({ description: testCase[1], testId: testCase[0] })(
      `(${expectedPass.length + index + 1}/${
        expectedPass.length + expectedFail.length
      } invalid)`,
      runCase,
      testCase,
      false,
    );
  });
};

testVm({
  fails: [
    vmbTestsBch2023InvalidJson as VmbTest[],
    vmbTestsBch2023NonstandardJson as VmbTest[],
  ],
  succeeds: [vmbTestsBch2023StandardJson as VmbTest[]],
  vm: createVirtualMachineBch2023(true),
  vmName: 'bch_2023_standard',
});

testVm({
  fails: [vmbTestsBch2023InvalidJson as VmbTest[]],
  succeeds: [
    vmbTestsBch2023StandardJson as VmbTest[],
    vmbTestsBch2023NonstandardJson as VmbTest[],
  ],
  vm: createVirtualMachineBch2023(false),
  vmName: 'bch_2023_nonstandard',
});

testVm({
  fails: [
    vmbTestsBch2025InvalidJson as VmbTest[],
    vmbTestsBch2025NonstandardJson as VmbTest[],
  ],
  succeeds: [vmbTestsBch2025StandardJson as VmbTest[]],
  vm: createVirtualMachineBch2025(true),
  vmName: 'bch_2025_standard',
});

testVm({
  fails: [vmbTestsBch2025InvalidJson as VmbTest[]],
  succeeds: [
    vmbTestsBch2025StandardJson as VmbTest[],
    vmbTestsBch2025NonstandardJson as VmbTest[],
  ],
  vm: createVirtualMachineBch2025(false),
  vmName: 'bch_2025_nonstandard',
});

testVm({
  fails: [
    vmbTestsBch2026InvalidJson as VmbTest[],
    vmbTestsBch2026NonstandardJson as VmbTest[],
  ],
  succeeds: [vmbTestsBch2026StandardJson as VmbTest[]],
  vm: createVirtualMachineBch2026(true),
  vmName: 'bch_2026_standard',
});

testVm({
  fails: [vmbTestsBch2026InvalidJson as VmbTest[]],
  succeeds: [
    vmbTestsBch2026StandardJson as VmbTest[],
    vmbTestsBch2026NonstandardJson as VmbTest[],
  ],
  vm: createVirtualMachineBch2026(false),
  vmName: 'bch_2026_nonstandard',
});

testVm({
  fails: [
    vmbTestsBchChipLoopsInvalidJson as VmbTest[],
    vmbTestsBchChipLoopsNonstandardJson as VmbTest[],
  ],
  succeeds: [vmbTestsBchChipLoopsStandardJson as VmbTest[]],
  vm: createVirtualMachineBchSpec(true),
  vmName: 'bch_spec_standard',
});

testVm({
  fails: [vmbTestsBchChipLoopsInvalidJson as VmbTest[]],
  succeeds: [
    vmbTestsBchChipLoopsStandardJson as VmbTest[],
    vmbTestsBchChipLoopsNonstandardJson as VmbTest[],
  ],
  vm: createVirtualMachineBchSpec(false),
  vmName: 'bch_spec_nonstandard',
});
