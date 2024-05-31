/* eslint-disable no-console */
import test from 'ava';

import {
  assertSuccess,
  decodeTransaction,
  decodeTransactionOutputs,
  hexToBin,
  stringify,
} from '../lib.js';

import type { VmbTestMasterBch } from './bch-vmb-test-utils.js';
import {
  baselineBenchmarkId,
  baselineBenchmarkTransactionSize,
  vms,
} from './bch-vmb-tests.spec.helper.js';
/* eslint-disable import/no-restricted-paths, import/no-internal-modules */
import vmbTestsBchJson from './generated/bch_vmb_tests.json' with { type: 'json' };
/* eslint-enable import/no-restricted-paths, import/no-internal-modules */

import { Bench } from 'tinybench';

const benchmarks = (vmbTestsBchJson as VmbTestMasterBch[]).filter((testCase) =>
  testCase[1].includes('[benchmark]'),
);
const baseline = benchmarks.filter((testCase) =>
  testCase[1].includes('[baseline]'),
);
const otherBenchmarks = benchmarks.filter(
  (testCase) => !testCase[1].includes('[baseline]'),
);

const sleep = async (ms: number) =>
  new Promise((res) => {
    setTimeout(res, ms);
  });

const allowPrintTime = async () => sleep(1);

test('Baseline benchmark has expected VMB test ID', (t) => {
  t.true(otherBenchmarks.length > 1);
  t.true(baseline.length === 1);
  t.deepEqual(baseline[0]?.[0], baselineBenchmarkId);
  t.deepEqual(baseline[0]?.[4].length, baselineBenchmarkTransactionSize * 2);
});

test('Run VMB tests marked with "[benchmark]"', async (t) => {
  const sixtyMinutes = 3_600_000;
  t.timeout(sixtyMinutes);
  const plannedBenchmarks = benchmarks.map((testDefinition) => {
    const [
      shortId,
      testDescription,
      _unlockingScriptAsm,
      _redeemOrLockingScriptAsm,
      txHex,
      sourceOutputsHex,
      _testSets,
      inputIndex,
    ] = testDefinition;
    const testedIndex = inputIndex ?? 0;
    const transaction = assertSuccess(decodeTransaction(hexToBin(txHex)));
    const sourceOutputs = assertSuccess(
      decodeTransactionOutputs(hexToBin(sourceOutputsHex)),
    );
    const initialNegativeDigests = 1000000000;
    const debugResult = vms.bch_spec_standard.debug(
      { inputIndex: testedIndex, sourceOutputs, transaction },
      {
        metrics: {
          executedInstructionCount: 0,
          hashDigestIterations: -initialNegativeDigests,
          signatureCheckCount: 0,
        },
      },
    );
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const lastState = debugResult[debugResult.length - 1]!;
    const { hashDigestIterations, signatureCheckCount } = lastState.metrics;

    const stackSize = (stack: Uint8Array[]) =>
      stack.reduce((sum, item) => sum + item.length, 0);
    const maxStackSize = debugResult.reduce((max, next) => {
      const nextSize = stackSize(next.stack) + stackSize(next.alternateStack);
      return max < nextSize ? nextSize : max;
    }, 0);

    /**
     * We assume all benchmarks repeat the same contract across all inputs:
     */
    const assumedTotalHashDigests =
      (hashDigestIterations + initialNegativeDigests) *
      transaction.inputs.length;

    return {
      resolvedTransaction: { sourceOutputs, transaction },
      shortId,
      stats: {
        hashDigestIterations: assumedTotalHashDigests,
        maxStackSize,
        signatureCheckCount,
        transactionSize: txHex.length / 2,
      },
      testDescription,
    };
  });
  const vmSet = Object.entries(vms).map(([vmName, vm]) => {
    const bench = new Bench();
    plannedBenchmarks.forEach((benchmark) => {
      bench.add(benchmark.shortId, () =>
        vm.verify(benchmark.resolvedTransaction),
      );
    });
    return { bench, vmName: vmName as keyof typeof vms };
  });
  // TODO: limit by VM year
  const excessiveCostPerByteStandard = 50;
  const excessiveCostPerByteNonStandard = 150;
  const failingCases: {
    costPerByte: number;
    description: string;
    excessiveCostPerByte: number;
    shortId: string;
    vmName: string;
  }[] = [];
  // eslint-disable-next-line functional/no-loop-statements
  for await (const { bench, vmName } of vmSet) {
    console.log(`Warming up benchmarks for ${vmName}...`);
    await bench.warmup();
    console.log(`Running benchmarks for ${vmName}...`);
    await allowPrintTime();
    await bench.run();

    const baselineResult = bench.getTask(baselineBenchmarkId)?.result;
    // eslint-disable-next-line complexity
    const table = bench.results.map((result, i) => {
      const plan = plannedBenchmarks[i];
      if (
        result === undefined ||
        plan === undefined ||
        baselineResult === undefined
      )
        // eslint-disable-next-line functional/no-throw-statements
        throw new Error('Unexpected undefined value');

      const baselineTimePerByte =
        baselineResult.mean / baselineBenchmarkTransactionSize;
      const testTimePerByte = result.mean / plan.stats.transactionSize;
      const relativeTime = result.mean / baselineResult.mean;
      const relativeTimePerByte = testTimePerByte / baselineTimePerByte;
      const hdiPerByte =
        plan.stats.hashDigestIterations / plan.stats.transactionSize;
      const maxMemPerByte =
        plan.stats.maxStackSize / plan.stats.transactionSize;
      const sigChecksPerByte =
        plan.stats.signatureCheckCount / plan.stats.transactionSize;

      const excessiveCostPerByte = vmName.includes('nonstandard')
        ? excessiveCostPerByteNonStandard
        : excessiveCostPerByteStandard;
      if (relativeTimePerByte > excessiveCostPerByte) {
        failingCases.push({
          costPerByte: relativeTimePerByte,
          description: plan.testDescription,
          excessiveCostPerByte,
          shortId: plan.shortId,
          vmName,
        });
      }
      return {
        /* eslint-disable sort-keys */
        'Test ID': plan.shortId,
        Description: plan.testDescription.replace(
          '[benchmark] Transaction validation benchmarks: ',
          '',
        ),
        Hz: result.hz.toFixed(2),
        'Relative Cost': relativeTime.toFixed(2),
        'Cost/Byte': relativeTimePerByte.toFixed(2),
        'TX Bytes': plan.stats.transactionSize,
        'Hash Dig. Iter.': plan.stats.hashDigestIterations,
        'HDI/Byte': hdiPerByte.toFixed(2),
        'Max Mem.': plan.stats.maxStackSize,
        'MM/Byte': maxMemPerByte.toFixed(2),
        SigChecks: plan.stats.signatureCheckCount,
        'SigChecks/Byte': sigChecksPerByte.toFixed(2),
        /* eslint-enable sort-keys */
      };
    });
    console.table(table);
    await allowPrintTime();
  }
  t.true(
    failingCases.length === 0,
    `One or more benchmarks failed with an excessive, per-byte validation time ("Cost/Byte") when compared to the baseline benchmark: ${stringify(
      failingCases,
    )}`,
  );
  t.pass();
});
