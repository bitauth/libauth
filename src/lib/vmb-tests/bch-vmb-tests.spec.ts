import test from 'ava';

import type { AuthenticationVirtualMachineBCH, VmbTest } from '../lib';
import {
  createVirtualMachineBCH2021,
  createVirtualMachineBCH2022,
  decodeTransactionOutputsUnsafe,
  decodeTransactionUnsafeBCH,
  hexToBin,
  stringify,
  stringifyDebugTraceSummary,
  summarizeDebugTrace,
} from '../lib.js';

import { vmbTestsBCH } from './bch-vmb-tests.js';
/* eslint-disable import/no-restricted-paths, import/no-internal-modules */
import vmbTestsBCHJson from './generated/bch/bch_vmb_tests.json' assert { type: 'json' };
import vmbTestsBCH2021InvalidJson from './generated/bch/bch_vmb_tests_2021_invalid.json' assert { type: 'json' };
import vmbTestsBCH2021NonstandardJson from './generated/bch/bch_vmb_tests_2021_nonstandard.json' assert { type: 'json' };
import vmbTestsBCH2021StandardJson from './generated/bch/bch_vmb_tests_2021_standard.json' assert { type: 'json' };
import vmbTestsBCH2022InvalidJson from './generated/bch/bch_vmb_tests_2022_invalid.json' assert { type: 'json' };
import vmbTestsBCH2022NonstandardJson from './generated/bch/bch_vmb_tests_2022_nonstandard.json' assert { type: 'json' };
import vmbTestsBCH2022StandardJson from './generated/bch/bch_vmb_tests_2022_standard.json' assert { type: 'json' };
/* eslint-enable import/no-restricted-paths, import/no-internal-modules */

test('bch_vmb_tests.json is up to date and contains no test ID collisions', (t) => {
  const testGroupsAndTypes = 2;
  const allTestCases = vmbTestsBCH.flat(testGroupsAndTypes);
  t.deepEqual(
    allTestCases,
    vmbTestsBCHJson,
    'New test definitions were added to `bch-vmb.tests.ts`, but the generated tests were not updated. Run "yarn gen:vmb-tests" to correct this issue. (Note: tsc watch tasks don\'t always update cached JSON imports when the source file changes. You may need to restart tsc to clear this error after re-generating tests.)'
  );

  const testCaseIds = allTestCases.map((testCase) => testCase[0]);
  const descriptions = allTestCases.map((testCase) => testCase[1]);
  const idDup = testCaseIds.findIndex(
    (id, i) => testCaseIds.lastIndexOf(id) !== i
  );
  const descDup = descriptions.findIndex(
    (desc, i) => descriptions.lastIndexOf(desc) !== i
  );

  /* eslint-disable @typescript-eslint/no-non-null-assertion */
  if (idDup !== -1) {
    return t.fail(`Multiple VMB test vectors share a short ID. Either increase the short ID length, or tweak one of the test definitions to eliminate the collision.

    Collision: ${allTestCases[idDup]![0]}: ${allTestCases[idDup]![1]}`);
  }
  if (descDup !== -1) {
    return t.fail(`Multiple VMB test vectors share a description. Please either include additional detail or remove the unnecessary test.

    Collision: ${allTestCases[descDup]![0]}: ${allTestCases[descDup]![1]}`);
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
  vmName: string;
  succeeds: VmbTest[][];
  fails: VmbTest[][];
  vm: AuthenticationVirtualMachineBCH;
}) => {
  const runCase = test.macro({
    // eslint-disable-next-line complexity
    exec: (t, testCase: VmbTest, expectedToSucceed: boolean) => {
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
      const transaction = decodeTransactionUnsafeBCH(hexToBin(txHex));
      const { outputs: sourceOutputs } = decodeTransactionOutputsUnsafe(
        hexToBin(sourceOutputsHex)
      );
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
            evaluateResult
          )}\n\nFinal debugResult:\n\n${stringify(
            debugResult[debugResult.length - 1]
          )}`
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
            `An unexpected input index caused VMB test "${shortId}" to fail for ${vmName}: the input index under test is ${testedIndex}, but input index ${failingIndex} failed. Error: ${result}`
          );
          t.log(
            `Failing input at index ${failingIndex}:`,
            stringifyDebugTraceSummary(
              summarizeDebugTrace(
                vm.debug({
                  inputIndex: Number(failingIndex),
                  sourceOutputs,
                  transaction,
                })
              )
            )
          );
          t.log(moreDetails);
          return;
        }
        logDebugInfo();
        t.fail(
          `VMB test "${shortId}" – "${description}" – for ${vmName} is expected to succeed but failed. Error: ${result}`
        );
        return;
      }
      if (!expectedToSucceed && typeof result !== 'string') {
        logDebugInfo();
        t.fail(
          `VMB test "${shortId}" – "${description}" – for ${vmName} is expected to fail but succeeded.`
        );
        return;
      }
      t.pass();
    },
    title: (
      // eslint-disable-next-line @typescript-eslint/default-param-last
      caseNumberOfCaseCount = '(unknown/unknown)',
      [shortId, description]
    ) =>
      `[vmb_tests] [${vmName}] ${shortId} ${caseNumberOfCaseCount}: ${description}`,
  });
  const expectedPass = succeeds.flat(1);
  const expectedFail = fails.flat(1);
  expectedPass.forEach((testCase, index) => {
    test(
      `(${index + 1}/${expectedPass.length + expectedFail.length} S)`,
      runCase,
      testCase,
      true
    );
  });
  expectedFail.forEach((testCase, index) => {
    test(
      `(${expectedPass.length + index + 1}/${
        expectedPass.length + expectedFail.length
      } F)`,
      runCase,
      testCase,
      false
    );
  });
};

testVm({
  fails: [
    vmbTestsBCH2021InvalidJson as VmbTest[],
    vmbTestsBCH2021NonstandardJson as VmbTest[],
  ],
  succeeds: [vmbTestsBCH2021StandardJson as VmbTest[]],
  vm: createVirtualMachineBCH2021(true),
  vmName: 'bch_2021_standard',
});

testVm({
  fails: [vmbTestsBCH2021InvalidJson as VmbTest[]],
  succeeds: [
    vmbTestsBCH2021StandardJson as VmbTest[],
    vmbTestsBCH2021NonstandardJson as VmbTest[],
  ],
  vm: createVirtualMachineBCH2021(false),
  vmName: 'bch_2021_nonstandard',
});

testVm({
  fails: [
    vmbTestsBCH2022InvalidJson as VmbTest[],
    vmbTestsBCH2022NonstandardJson as VmbTest[],
  ],
  succeeds: [vmbTestsBCH2022StandardJson as VmbTest[]],
  vm: createVirtualMachineBCH2022(true),
  vmName: 'bch_2022_standard',
});

testVm({
  fails: [vmbTestsBCH2022InvalidJson as VmbTest[]],
  succeeds: [
    vmbTestsBCH2022StandardJson as VmbTest[],
    vmbTestsBCH2022NonstandardJson as VmbTest[],
  ],
  vm: createVirtualMachineBCH2022(false),
  vmName: 'bch_2022_nonstandard',
});

test.todo('test CHIP limits VM');
