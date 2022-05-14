/* eslint-disable functional/no-expression-statement */

/**
 * This script generates all bch_vmb_tests, run it with: `yarn gen:vmb-tests`.
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import type { TestSet, VmbTest } from '../lib';

import { vmbTestsBCH } from './bch-vmb-tests.js';

/**
 * Script accepts one argument: an `outputDir` to which all generated files will
 * be saved.
 */
const [, , outputDir] = process.argv;
if (outputDir === undefined) {
  // eslint-disable-next-line functional/no-throw-statement
  throw new Error('Script requires an output directory.');
}
const outputAbsolutePath = resolve(outputDir);

const testGroupsAndTypes = 2;
const allTestCases = vmbTestsBCH.flat(testGroupsAndTypes);

writeFileSync(
  `${outputAbsolutePath}/bch_vmb_tests.json`,
  JSON.stringify(allTestCases),
  { encoding: 'utf8' }
);

// iterate over allTestCases, split into files by testSets (case[6])

const partitionedTestCases = allTestCases.reduce<{
  [key in TestSet]?: VmbTest[];
}>((accumulatedTestSets, testCase) => {
  const [
    shortId,
    testDescription,
    unlockingScriptAsm,
    redeemOrLockingScriptAsm,
    testTransactionHex,
    sourceOutputsHex,
    testSets,
    inputIndex,
  ] = testCase;

  const withoutSets = [
    shortId,
    testDescription,
    unlockingScriptAsm,
    redeemOrLockingScriptAsm,
    testTransactionHex,
    sourceOutputsHex,
    ...(inputIndex === undefined ? [] : [inputIndex]),
  ] as VmbTest;

  // eslint-disable-next-line functional/no-return-void
  testSets.forEach((testSet) => {
    // eslint-disable-next-line functional/immutable-data
    accumulatedTestSets[testSet] = [
      ...(accumulatedTestSets[testSet] ?? []),
      withoutSets,
    ];
  });
  return accumulatedTestSets;
}, {});

// eslint-disable-next-line functional/no-return-void
Object.entries(partitionedTestCases).forEach(([testSetName, testSet]) => {
  const filepath = testSetName.startsWith('CHIP')
    ? `${outputAbsolutePath}/CHIPs/bch_vmb_tests_${testSetName}.json`
    : `${outputAbsolutePath}/bch_vmb_tests_${testSetName}.json`;
  writeFileSync(filepath, JSON.stringify(testSet), { encoding: 'utf8' });
});
