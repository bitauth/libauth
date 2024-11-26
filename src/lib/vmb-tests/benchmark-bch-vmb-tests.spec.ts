/* eslint-disable no-console */
import test from 'ava';

import {
  assertSuccess,
  decodeTransaction,
  decodeTransactionOutputs,
  hexToBin,
  measureOperationCost,
  stringify,
} from '../lib.js';

import type { VmbTestMasterBch } from './bch-vmb-test-utils.js';
import {
  baselineBenchmarkId,
  baselineBenchmarkTransactionByteLength,
  vms,
} from './bch-vmb-tests.spec.helper.js';
/* eslint-disable import/no-restricted-paths, import/no-internal-modules */
import vmbTestsBchJson from './generated/bch_vmb_tests.json' with { type: 'json' };
/* eslint-enable import/no-restricted-paths, import/no-internal-modules */

import { Bench } from 'tinybench';

const { BENCH_DEBUG_PROFILE, BENCH_DEBUG_TEST, BENCH_DEBUG_VM } = process.env;

if (BENCH_DEBUG_VM !== undefined) {
  console.log(
    `The 'BENCH_DEBUG_VM' environment variable is configured to limit benchmarking to VM version: ${BENCH_DEBUG_VM}`,
  );
}
if (BENCH_DEBUG_TEST !== undefined) {
  console.log(
    `The 'BENCH_DEBUG_TEST' environment variable is configured to limit benchmarking to VMB test ID: ${BENCH_DEBUG_TEST}`,
  );
}
const collectProfile = BENCH_DEBUG_PROFILE === 'Yes';
if (collectProfile) {
  console.log(
    `The 'BENCH_DEBUG_PROFILE' environment variable is configured to profile performance.`,
  );
}
const benchmarks = (vmbTestsBchJson as VmbTestMasterBch[]).filter((testCase) =>
  testCase[1].includes('[benchmark]'),
);
const baseline = benchmarks.filter((testCase) =>
  testCase[1].includes('[baseline]'),
);
const otherBenchmarks = benchmarks.filter(
  (testCase) =>
    !testCase[1].includes('[baseline]') &&
    (BENCH_DEBUG_TEST === undefined || BENCH_DEBUG_TEST === testCase[0]),
);

const sleep = async (ms: number) =>
  new Promise((res) => {
    setTimeout(res, ms);
  });

const allowPrintTime = async () => sleep(1);
test('Baseline benchmark has expected VMB test ID', (t) => {
  t.true(otherBenchmarks.length > 0);
  t.true(baseline.length === 1);
  t.deepEqual(baseline[0]?.[0], baselineBenchmarkId);
  const hexPerByte = 2;
  t.deepEqual(
    baseline[0]?.[4].length,
    baselineBenchmarkTransactionByteLength * hexPerByte,
  );
});

test('Run VMB tests marked with "[benchmark]"', async (t) => {
  const sixtyMinutes = 3_600_000;
  t.timeout(sixtyMinutes);
  const plannedBenchmarks = [...baseline, ...otherBenchmarks].map(
    (testDefinition) => {
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
      const initialNegativeCost = 1000000000;
      const debugResult = vms.bch_spec_standard.debug(
        { inputIndex: testedIndex, sourceOutputs, transaction },
        {
          stateOverride: {
            metrics: {
              arithmeticCost: -initialNegativeCost,
              bitwiseCost: -initialNegativeCost,
              executedInstructionCount: 0,
              hashDigestIterations: -initialNegativeCost,
              maxMemoryUsage: 0,
              operationCost: 0,
              signatureCheckCount: -initialNegativeCost,
              stackPushedBytes: -initialNegativeCost,
            },
          },
        },
      );
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const lastState = debugResult[debugResult.length - 1]!;
      const {
        arithmeticCost,
        bitwiseCost,
        hashDigestIterations,
        maxMemoryUsage,
        signatureCheckCount,
        stackPushedBytes,
      } = lastState.metrics;

      /**
       * We assume all benchmarks repeat the same contract across all inputs:
       */
      const assumedTotalHashDigests =
        (hashDigestIterations + initialNegativeCost) *
        transaction.inputs.length;
      const assumedTotalArithmeticCost =
        (arithmeticCost + initialNegativeCost) * transaction.inputs.length;
      const assumedTotalBitwiseCost =
        (bitwiseCost + initialNegativeCost) * transaction.inputs.length;
      const assumedTotalSignatureCheckCount =
        (signatureCheckCount + initialNegativeCost) * transaction.inputs.length;
      const assumedTotalStackPushedBytes =
        (stackPushedBytes + initialNegativeCost) * transaction.inputs.length;
      const assumedTotalOperationCost =
        measureOperationCost({
          arithmeticCost: arithmeticCost + initialNegativeCost,
          bitwiseCost: bitwiseCost + initialNegativeCost,
          executedInstructionCount: lastState.metrics.executedInstructionCount,
          hashDigestIterations: hashDigestIterations + initialNegativeCost,
          signatureCheckCount: signatureCheckCount + initialNegativeCost,
          stackPushedBytes: stackPushedBytes + initialNegativeCost,
        }) * transaction.inputs.length;

      return {
        resolvedTransaction: { sourceOutputs, transaction },
        shortId,
        stats: {
          arithmeticCost: assumedTotalArithmeticCost,
          bitwiseCost: assumedTotalBitwiseCost,
          hashDigestIterations: assumedTotalHashDigests,
          maxMemoryUsage,
          operationCost: assumedTotalOperationCost,
          signatureCheckCount: assumedTotalSignatureCheckCount,
          stackPushedBytes: assumedTotalStackPushedBytes,
          transactionSize: txHex.length / 2,
        },
        testDescription,
      };
    },
  );
  const vmSet = Object.entries(vms)
    .map(([vmName, vm]) => {
      const bench = new Bench();
      plannedBenchmarks.forEach((benchmark) => {
        bench.add(benchmark.shortId, () =>
          vm.verify(benchmark.resolvedTransaction),
        );
      });
      return { bench, vmName: vmName as keyof typeof vms };
    })
    .filter(
      (setConfig) =>
        BENCH_DEBUG_VM === undefined || setConfig.vmName === BENCH_DEBUG_VM,
    );
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
    if (collectProfile) console.profile();
    await bench.run();
    if (collectProfile) console.profileEnd();

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
        baselineResult.mean / baselineBenchmarkTransactionByteLength;
      const testTimePerByte = result.mean / plan.stats.transactionSize;
      const relativeTime = result.mean / baselineResult.mean;
      const relativeTimePerByte = testTimePerByte / baselineTimePerByte;
      const operationCostPerByte =
        plan.stats.operationCost / plan.stats.transactionSize;
      const hdiPerByte =
        plan.stats.hashDigestIterations / plan.stats.transactionSize;
      const arithmeticCostPerByte =
        plan.stats.arithmeticCost / plan.stats.transactionSize;
      const bitwiseCostPerByte =
        plan.stats.bitwiseCost / plan.stats.transactionSize;
      const pushedBytesPerByte =
        plan.stats.stackPushedBytes / plan.stats.transactionSize;
      const maxMemPerByte =
        plan.stats.maxMemoryUsage / plan.stats.transactionSize;
      const bytesPerSigCheck =
        plan.stats.signatureCheckCount === 0
          ? '-'
          : (
              plan.stats.transactionSize / plan.stats.signatureCheckCount
            ).toFixed(2);

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
        'TX Bytes': plan.stats.transactionSize,
        'Rel. Time': relativeTime.toFixed(2),
        'RT/Byte': relativeTimePerByte.toFixed(2),
        'Op. Cost': plan.stats.operationCost,
        'OC/Byte': operationCostPerByte.toFixed(2),
        'OC/B:RT/B': (operationCostPerByte / relativeTimePerByte).toFixed(2),
        'Hash D. Iter.': plan.stats.hashDigestIterations,
        'HDI/Byte': hdiPerByte.toFixed(2),
        'Pushed Bytes': plan.stats.stackPushedBytes,
        'PB/Byte': pushedBytesPerByte.toFixed(2),
        'Max Mem.': plan.stats.maxMemoryUsage,
        'MM/Byte': maxMemPerByte.toFixed(2),
        'Arith. Cost': plan.stats.arithmeticCost,
        'AC/Byte': arithmeticCostPerByte.toFixed(2),
        'Bit. Cost': plan.stats.bitwiseCost,
        'BC/Byte': bitwiseCostPerByte.toFixed(2),
        SigChecks: plan.stats.signatureCheckCount,
        'bytes/SigCheck': bytesPerSigCheck,
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
