/* eslint-disable no-console, functional/no-expression-statements, @typescript-eslint/no-non-null-assertion */
import {
  assertSuccess,
  decodeTransaction,
  decodeTransactionOutputs,
  hexToBin,
  isPayToScriptHash20,
  stringify,
  stringifyDebugTraceSummary,
  summarizeDebugTrace,
} from '../lib.js';

import { baselineBenchmarkId, isVm, vms } from './bch-vmb-tests.spec.helper.js';
// eslint-disable-next-line import/no-internal-modules
import vmbTestsBchJson from './generated/bch_vmb_tests.json' with { type: 'json' };

import { Bench } from 'tinybench';

// cspell:ignore trxhzt
const usageInfo = `
This script runs a single VMB test on the requested VM, logging the results and debugging information. Use the "--verbose" (-v) flag to output the full debug trace, or use the "--bench" (-b) flag to benchmark the VM's validation performance for the specified test.

Available VMs: ${Object.keys(vms).join(', ')}

Usage: yarn test:unit:vmb_test <vm> <test_id> [-v OR -b]
E.g.: yarn test:unit:vmb_test bch_2023_standard trxhzt
      yarn test:unit:vmb_test bch_2025_standard trxhzt --verbose  # or -v
      yarn test:unit:vmb_test bch_spec_standard 2v2wf --bench    # or -b
`;

const [, , vmId, testId, flag] = process.argv;
if (vmId === undefined || testId === undefined) {
  console.log(usageInfo);
  process.exit(1);
}
const useVerbose = flag?.includes('v') ?? false;
const runBenchmark = flag?.includes('b') ?? false;

if (!isVm(vmId)) {
  console.log(`Error: the VM "${vmId}" is unknown.\n${usageInfo}`);
  process.exit(1);
}

const vm = vms[vmId];
const testDefinition = (
  vmbTestsBchJson as [
    shortId: string,
    testDescription: string,
    unlockingScriptAsm: string,
    redeemOrLockingScriptAsm: string,
    testTransactionHex: string,
    sourceOutputsHex: string,
    testSets: string[],
    inputIndex?: number,
  ][]
).find(([shortId]) => shortId === testId);

if (testDefinition === undefined) {
  console.log(`Error: the test ID "${testId}" is unknown.\n${usageInfo}`);
  process.exit(1);
}

const [
  shortId,
  testDescription,
  unlockingScriptAsm,
  redeemOrLockingScriptAsm,
  txHex,
  sourceOutputsHex,
  testSets,
  inputIndex,
] = testDefinition;

const testedIndex = inputIndex ?? 0;
const transaction = assertSuccess(decodeTransaction(hexToBin(txHex)));
const sourceOutputs = assertSuccess(
  decodeTransactionOutputs(hexToBin(sourceOutputsHex)),
);
const result = vm.verify({ sourceOutputs, transaction });

const program = {
  inputIndex: testedIndex,
  sourceOutputs,
  transaction,
};

const highMemory = testDescription.includes('[high-memory]');
const debugResult = highMemory
  ? []
  : vm.debug(program, { maskProgramState: true });
const failingIndex =
  typeof result === 'string'
    ? /evaluating input index (?<index>\d+)/u.exec(result)?.groups?.['index']
    : undefined;
const unexpectedFailingIndexDebugTrace =
  failingIndex !== undefined && Number(failingIndex) !== testedIndex
    ? highMemory
      ? []
      : vm.debug({
          inputIndex: Number(failingIndex),
          sourceOutputs,
          transaction,
        })
    : undefined;

const isP2sh20 = isPayToScriptHash20(
  sourceOutputs[testedIndex]!.lockingBytecode,
);

console.log(`
${
  useVerbose
    ? `
Verbose information (-v):
=========================

${
  unexpectedFailingIndexDebugTrace === undefined
    ? ''
    : `
Full debug trace at failing index ${failingIndex!}:
${stringify(
  unexpectedFailingIndexDebugTrace.map((state) => ({
    ...state,
    instructions: '...',
  })),
)}

----------
`
}

Full debug trace at index ${testedIndex}:
${stringify(debugResult.map((state) => ({ ...state, instructions: '...' })))}

----------

Source outputs (hex): ${sourceOutputsHex}
Decoded:
${stringify(sourceOutputs)}

----------

Transaction (hex): ${txHex}
Decoded:
${stringify(transaction)}

Standard information:
=====================
`
    : ''
}

VMB test ID: ${shortId}
Description: ${testDescription}
Test sets: ${testSets.join(', ')}

Unlocking ASM: ${unlockingScriptAsm}
${isP2sh20 ? 'Redeem (P2SH20)' : 'Locking'} ASM: ${redeemOrLockingScriptAsm}
Result (VM: ${vmId}): ${
  result === true ? 'Transaction accepted' : `Transaction rejected: ${result}`
}${
  unexpectedFailingIndexDebugTrace === undefined
    ? ''
    : `
Note: an unexpected index is failing; the input index under test is ${testedIndex}, but input index ${failingIndex!} failed.

Evaluation at failing index (${failingIndex!}):
${stringifyDebugTraceSummary(
  summarizeDebugTrace(unexpectedFailingIndexDebugTrace),
)}
`
}
Evaluation at index ${testedIndex}:

${stringifyDebugTraceSummary(summarizeDebugTrace(debugResult))}
`);

if (!runBenchmark) {
  process.exit(0);
}

const baselineDefinition = (
  vmbTestsBchJson as [
    shortId: string,
    testDescription: string,
    unlockingScriptAsm: string,
    redeemOrLockingScriptAsm: string,
    testTransactionHex: string,
    sourceOutputsHex: string,
    testSets: string[],
    inputIndex?: number,
  ][]
).find(([id]) => id === baselineBenchmarkId);
if (baselineDefinition === undefined) {
  // eslint-disable-next-line functional/no-throw-statements
  throw new Error(
    `Error: the benchmark baseline ID "${baselineBenchmarkId}" could not be found. Was the baseline modified?`,
  );
}
const [, , , , baselineTxHex, baselineSourceOutputsHex] = baselineDefinition;
const baselineTx = assertSuccess(decodeTransaction(hexToBin(baselineTxHex)));
const baselineSourceOutputs = assertSuccess(
  decodeTransactionOutputs(hexToBin(baselineSourceOutputsHex)),
);
vm.verify({ sourceOutputs, transaction });

const bench = new Bench();
const baselineName = `Baseline ID: ${baselineBenchmarkId} (${vmId})`;
const testName = `VMB Test ID: ${shortId} (${vmId})`;
bench.add(baselineName, () =>
  vm.verify({ sourceOutputs: baselineSourceOutputs, transaction: baselineTx }),
);
bench.add(testName, () => vm.verify({ sourceOutputs, transaction }));
await bench.warmup();
console.log('Benchmarking...');
await bench.run();
console.table(bench.table());
const baselineMean = bench.results[0]!.mean;
const testMean = bench.results[1]!.mean;
console.log(
  `Test ID ${shortId} verifies in ${
    testMean / baselineMean
  } baseline validations (${baselineBenchmarkId}).`,
);
