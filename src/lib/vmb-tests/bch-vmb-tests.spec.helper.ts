/* eslint-disable functional/no-expression-statements */

/**
 * This script generates all bch_vmb_tests, run it with: `yarn gen:vmb-tests`.
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { vmbTestPartitionMasterTestList } from './bch-vmb-test-utils.js';
import { vmbTestsBCH } from './bch-vmb-tests.js';

/**
 * Script accepts one argument: an `outputDir` to which all generated files will
 * be saved.
 */
const [, , outputDir] = process.argv;
if (outputDir === undefined) {
  // eslint-disable-next-line functional/no-throw-statements
  throw new Error('Script requires an output directory.');
}
const outputAbsolutePath = resolve(outputDir);

const testGroupsAndTypes = 2;
const allTestCases = vmbTestsBCH.flat(testGroupsAndTypes);
writeFileSync(
  `${outputAbsolutePath}/bch_vmb_tests.json`,
  JSON.stringify(allTestCases),
  { encoding: 'utf8' },
);
const partitionedTestCases = vmbTestPartitionMasterTestList(allTestCases);

// eslint-disable-next-line functional/no-return-void
Object.entries(partitionedTestCases).forEach(([testSetName, testSet]) => {
  const filepath = testSetName.includes('chip')
    ? `${outputAbsolutePath}/CHIPs/bch_vmb_tests_${testSetName}.json`
    : `${outputAbsolutePath}/bch_vmb_tests_${testSetName}.json`;
  writeFileSync(filepath, JSON.stringify(testSet), { encoding: 'utf8' });
});
