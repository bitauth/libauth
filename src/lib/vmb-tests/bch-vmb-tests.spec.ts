/**
 * To debug an individual vmb tests, set the `debug` variable below. All other
 * tests will be skipped.
 *
 * Considering using the `Debug Active Spec` launch configuration with Visual
 * Studio Code.
 */

import test from 'ava';

import type {
  AuthenticationProgramStateCommon,
  AuthenticationVirtualMachineBch,
  AuthenticationVirtualMachineBchSpec,
  VmbTest,
} from '../lib.js';
import {
  createVirtualMachineBch2023,
  createVirtualMachineBch2025,
  hexToBin,
  readTransactionCommon,
  readTransactionOutputs,
  stringify,
  stringifyDebugTraceSummary,
  summarizeDebugTrace,
} from '../lib.js';
import { createVirtualMachineBchSpec } from '../vm/instruction-sets/bch/spec/bch-spec-vm.js';

import { vmbTestsBch } from './bch-vmb-tests.js';
/* eslint-disable import/no-restricted-paths, import/no-internal-modules */
import vmbTestsBchChipLoopsInvalidJson from './generated/bch/CHIPs/bch_vmb_tests_chip_loops_invalid.json' assert { type: 'json' };
import vmbTestsBchChipLoopsNonstandardJson from './generated/bch/CHIPs/bch_vmb_tests_chip_loops_nonstandard.json' assert { type: 'json' };
import vmbTestsBchChipLoopsStandardJson from './generated/bch/CHIPs/bch_vmb_tests_chip_loops_standard.json' assert { type: 'json' };
import vmbTestsBchJson from './generated/bch/bch_vmb_tests.json' assert { type: 'json' };
import vmbTestsBch2023InvalidJson from './generated/bch/bch_vmb_tests_2023_invalid.json' assert { type: 'json' };
import vmbTestsBch2023NonstandardJson from './generated/bch/bch_vmb_tests_2023_nonstandard.json' assert { type: 'json' };
import vmbTestsBch2023StandardJson from './generated/bch/bch_vmb_tests_2023_standard.json' assert { type: 'json' };
import vmbTestsBch2025InvalidJson from './generated/bch/bch_vmb_tests_2025_invalid.json' assert { type: 'json' };
import vmbTestsBch2025NonstandardJson from './generated/bch/bch_vmb_tests_2025_nonstandard.json' assert { type: 'json' };
import vmbTestsBch2025StandardJson from './generated/bch/bch_vmb_tests_2025_standard.json' assert { type: 'json' };
/* eslint-enable import/no-restricted-paths, import/no-internal-modules */

/**
 * =========== Debugging Info ===========
 */
const debug = undefined as DebugInfo;
/* spell-checker:disable-next-line */
// const debug = { testId: 'dv5k4', vmName: 'bch_2023_standard' } as DebugInfo;

type VmName =
  | 'bch_2023_nonstandard'
  | 'bch_2023_standard'
  | 'bch_2025_nonstandard'
  | 'bch_2025_standard'
  | 'bch_spec_nonstandard'
  | 'bch_spec_standard';

type DebugInfo = { testId: string; vmName: VmName } | undefined;

test('bch_vmb_tests.json is up to date and contains no test ID collisions', async (t) => {
  /* Trim any stack traces returned AVA */
  await Promise.resolve();
  const testGroupsAndTypes = 2;
  const allTestCases = vmbTestsBch.flat(testGroupsAndTypes);
  t.deepEqual(
    allTestCases,
    vmbTestsBchJson,
    'New test definitions were added to `bch-vmb.tests.ts`, but the generated tests were not updated. Run "yarn gen:vmb-tests" to correct this issue. (Note: tsc watch tasks don\'t always update cached JSON imports when the source file changes. You may need to restart tsc to clear this error after re-generating tests.)',
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
  vm: AuthenticationVirtualMachineBch | AuthenticationVirtualMachineBchSpec;
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
        const debugResult = vm.debug(program);
        t.deepEqual(
          evaluateResult,
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
            stringifyDebugTraceSummary(
              summarizeDebugTrace(
                vm.debug({
                  inputIndex: Number(failingIndex),
                  sourceOutputs,
                  transaction,
                }) as AuthenticationProgramStateCommon[],
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
  expectedPass.forEach((testCase, index) => {
    (debug === undefined
      ? test
      : vmName === debug.vmName && debug.testId === testCase[0]
        ? test
        : test.skip)(
      `(${index + 1}/${expectedPass.length + expectedFail.length} valid)`,
      runCase,
      testCase,
      true,
    );
  });
  expectedFail.forEach((testCase, index) => {
    (debug === undefined
      ? test
      : vmName === debug.vmName && debug.testId === testCase[0]
        ? test
        : test.skip)(
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
