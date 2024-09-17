/* eslint-disable functional/no-expression-statements, no-console */
/* This file exports the utilities required for VMB test generation. */

import { createHash } from 'node:crypto';
import {
  promises as fs,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import { Worker } from 'worker_threads';

import type { AssertTypesEqual, ResolvedTransaction } from '../lib.js';
import {
  assertNonNull,
  assertSuccess,
  hexToBin,
  range,
  readTransactionCommon,
  readTransactionOutputs,
} from '../lib.js';

import {
  vmbTestGroupToVmbTests,
  vmbTestPartitionMasterTestList,
} from './bch-vmb-test-utils.js';
import type { VmbTest, VmbTestDefinitionGroup } from './bch-vmb-test-utils.js';
import { type baselineBenchmarkId, vms } from './vmb-tests.spec.helper.js';

import { Bench } from 'tinybench';

/**
 * A list of directories for which annotation and benchmarking should be
 * skipped (e.g. test sets that aren't ready to publish and excluded
 * by `.gitignore`).
 */
const skipDirectoryPrefixes = ['bch_chip', 'bch_2026'];
// eslint-disable-next-line functional/no-let
let warnedOnce = false;

/**
 * Note, this path reads from the compiled JS, so any changes to source files
 * will only be reflected following TS compilation.
 */
export const compiledDir = resolve('build/lib/vmb-tests/sources');
/**
 * We compare against the source TS files to exclude any outdated JS files
 * compiled from now-deleted TS source files. This also excludes other build
 * artifacts that aren't needed in this context (`.d.ts`, `.map`, etc.)
 */
const sourcesDir = resolve('src/lib/vmb-tests/sources');
const resultDir = resolve('src/lib/vmb-tests/generated');
const buildInfoFile = '.vmb-build-info.json';
const benchInfoFile = '.vmb-bench-info.json';
const buildInfoPath = resolve(resultDir, buildInfoFile);
const benchInfoPath = resolve(resultDir, benchInfoFile);

type Manifest = {
  [filePath: string]: string;
};
const getPreviousManifest = (path: string) => {
  // eslint-disable-next-line functional/no-try-statements
  try {
    const data = readFileSync(path, 'utf8');
    return JSON.parse(data) as Manifest;
  } catch (err) {
    console.log(`No manifest for this build type. Creating: ${path}`);
    return {};
  }
};
const utf8 = { encoding: 'utf8' } as const;
// eslint-disable-next-line functional/no-return-void
const saveManifest = (path: string, buildInfo: Manifest) => {
  writeFileSync(path, JSON.stringify(buildInfo), utf8);
};
const hashFile = (filePath: string) => {
  const fileBuffer = readFileSync(filePath);
  return createHash('sha256').update(fileBuffer).digest('hex');
};
const getSources = () =>
  readdirSync(sourcesDir).filter(
    (name) => name.endsWith('.ts') && !name.includes('.skip.'),
  );
const getLatestManifest = (): Manifest => {
  const files = readdirSync(compiledDir);
  const matches = getSources().map((name) => name.replace('.ts', '.js'));
  // eslint-disable-next-line functional/no-return-void
  matches.forEach((match) => {
    if (!files.includes(match)) {
      // eslint-disable-next-line functional/no-throw-statements
      throw new Error(
        `Could not find compiled file "${match}" in: ${compiledDir}. Please run "tsc" and try again.`,
      );
    }
  });
  return Object.fromEntries(
    matches.map((filename) => [
      filename,
      hashFile(join(compiledDir, filename)),
    ]),
  );
};

const sleep = async (ms: number) =>
  // eslint-disable-next-line functional/no-return-void
  new Promise((res) => {
    setTimeout(res, ms);
  });

const allowPrintTime = async () => sleep(1);

/**
 * From `core.benchmarks.baseline.vmb_tests.json`
 */
// prettier-ignore
const baselineVmbTest = ["trxhzt","Transaction validation benchmarks: [baseline] 2 P2PKH inputs, 2 P2PKH outputs (one Schnorr signature, one ECDSA signature) (nonP2SH)","<key1.schnorr_signature.all_outputs> <key1.public_key>","OP_DUP OP_HASH160 <$(<key1.public_key> OP_HASH160)> OP_EQUALVERIFY OP_CHECKSIG","02000000020100000000000000000000000000000000000000000000000000000000000000000000006a47304402204a86326ea6e2abb2ba73d490cd3293bdb7ff35886f9571064fb61e3dc64cb28b0220239338de5a5b1d54f7ff07196e16d10456da74b11ef1a79fc1bb02a084a977fd412103a524f43d6166ad3567f18b0a5c769c6ab4dc02149f4d5095ccf4e8ffa293e785000000000100000000000000000000000000000000000000000000000000000000000000010000006441de6174892e09d0b5d48c69d76cd4510d0254fd4a35edb6283454b0be48aa8db13c7d5b4cc84019cdf82a87c5bef2fc7768a7f249b681be49480e61a0b093b2a6412103a524f43d6166ad3567f18b0a5c769c6ab4dc02149f4d5095ccf4e8ffa293e7850000000002a0860100000000001976a9144af864646d46ee5a12f4695695ae78f993cad77588ac32850100000000001976a9144af864646d46ee5a12f4695695ae78f993cad77588ac00000000","02a0860100000000001976a91460011c6bf3f1dd98cff576437b9d85de780f497488aca0860100000000001976a91460011c6bf3f1dd98cff576437b9d85de780f497488ac",1] as const;
const [baselineId, , , , baselineTxHex, baselineSourceOutputsHex] =
  baselineVmbTest;
type TypeTest = AssertTypesEqual<typeof baselineId, typeof baselineBenchmarkId>;
true satisfies TypeTest;
const baselineSourceOutputsBin = hexToBin(baselineSourceOutputsHex);
const baselineTxBin = hexToBin(baselineTxHex);
const baseline: ResolvedTransaction = {
  sourceOutputs: assertSuccess(
    readTransactionOutputs({ bin: baselineSourceOutputsBin, index: 0 }),
  ).result,
  transaction: assertSuccess(
    readTransactionCommon({ bin: baselineTxBin, index: 0 }),
  ).result,
};

/**
 * A custom formatter to quickly and correctly format VMB test JSON files. Line
 * numbers intentionally align with test count: line one begins with `[[...` and
 * the last line ends with `]]`. (Placing the final closing `]` on the following
 * line does not reduce diffs, as a trailing comma must be added to the final
 * test if a new test is appended to the list (standard JSON does not support
 * trailing commas). To reduce file size, no additional spaces are added between
 * VMB test definition array elements.
 */
const formatVmbTestSet = (testSet: VmbTest[]) =>
  `[${testSet.map((vmbTest) => JSON.stringify(vmbTest)).join(',\n')}]`;

/**
 * A custom formatter to quickly and correctly format the auxiliary VMB
 * dictionary JSON files. To minimize diffs, the initial `{` and trailing `}`
 * are placed on their own lines; each dictionary item is then printed on a
 * single line (with no indentation or additional spaces between terms).
 */
const formatVmbDictionary = (dictionary: { [shortId: string]: unknown }) =>
  `{\n${Object.entries(dictionary)
    .map(([key, value]) => `"${key}":${JSON.stringify(value)}`)
    .join(',\n')}\n}`;

const defaultConsole = { error: console.error, log: console.log };

/**
 * (Re)generate and run a VMB tests defined in `filename`, formatting and
 * writing all output files to the generated results directory.
 * @param filename - the filename of the source `.js` file
 * @returns a `string[]` describing any errors or an empty array if
 * (re)generation and all testing was successful.
 */
// eslint-disable-next-line complexity
export const generateVmbTestsFromSourceFile = async (
  filename: string,
  cacheHash: string,
  {
    benchmark = false,
    console = defaultConsole,
    logPrefix = '',
  }: {
    benchmark?: boolean;
    console?: {
      // eslint-disable-next-line functional/no-return-void
      error: (...args: unknown[]) => void;
      // eslint-disable-next-line functional/no-return-void
      log: (...args: unknown[]) => void;
    };
    logPrefix?: string;
  } = {},
) => {
  // eslint-disable-next-line functional/no-try-statements
  try {
    console.log(`${logPrefix}Generating VMB tests from ${filename}...`);
    const importStart = performance.now();
    const imported: unknown = await import(
      `${join(compiledDir, filename)}?h=${cacheHash}`
    );
    if (
      !(
        typeof imported === 'object' &&
        imported !== null &&
        'default' in imported &&
        Array.isArray(imported.default)
      )
    ) {
      // eslint-disable-next-line functional/no-throw-statements
      throw new Error(
        `Error: the default export of ${filename} must an array of test definition groups.`,
      );
    }
    const importEnd = performance.now();
    const importTime = (importEnd - importStart).toFixed(0);
    console.log(`${logPrefix}${filename}: imported in ${importTime}ms...`);
    const generationStart = performance.now();
    const testGroups = imported.default as VmbTestDefinitionGroup[];
    const tests = testGroups.map(vmbTestGroupToVmbTests);
    const testGroupsAndTypes = 2;
    const allTestCases = tests.flat(testGroupsAndTypes);
    const partitionedTestCases = vmbTestPartitionMasterTestList(allTestCases);
    const filenameWithoutJs = filename.replace('.js', '');
    const generationEnd = performance.now();
    const generationTime = (generationEnd - generationStart).toFixed(0);
    console.log(
      `${logPrefix}${filename}: test generation complete in ${generationTime}ms...`,
    );

    /**
     * A mapping of unexpected VMB test results (i.e. tests that pass but are
     * expected to fail, or vice versa.) to the test set(s) in which the
     * issues occur.
     */
    const issues: {
      [issue: string]: [using: string, testSet: string][];
    } = {};
    /**
     * Queue up benchmarks to run after any issues have been logged (for faster
     * results).
     */
    const benchmarkFunctions: (() => Promise<void>)[] = [];

    const annotationStart = performance.now();

    // eslint-disable-next-line functional/no-loop-statements
    for (const [testSetName, testSet] of Object.entries(partitionedTestCases)) {
      const fullTestSetName = `bch_${testSetName}`;
      if (
        skipDirectoryPrefixes.some((prefix) =>
          fullTestSetName.startsWith(prefix),
        )
      ) {
        // eslint-disable-next-line functional/no-conditional-statements
        if (!warnedOnce) {
          warnedOnce = true;
          console.log(
            `${logPrefix}Note that annotation and benchmarking are currently being skipped for test sets with prefixes: ${skipDirectoryPrefixes.join(
              ', ',
            )}.`,
          );
        }
        // eslint-disable-next-line no-continue
        continue;
      }
      const testSetDir = join(resultDir, fullTestSetName);
      const fileBase = join(testSetDir, filenameWithoutJs);
      const testContents = formatVmbTestSet(testSet);
      const testFile = `${fileBase}.vmb_tests.json`;
      mkdirSync(testSetDir, { recursive: true });
      writeFileSync(testFile, testContents, utf8);
      const testSetBase = fullTestSetName.slice(
        0,
        fullTestSetName.lastIndexOf('_'),
      );
      const nonStdVmId = `${testSetBase}_nonstandard`;
      const standardVmId = `${testSetBase}_standard`;
      if (!(nonStdVmId in vms))
        // eslint-disable-next-line functional/no-throw-statements
        throw new Error(`Could not find a nonstandard VM for ${nonStdVmId}.`);
      const nonstandardVm = vms[nonStdVmId as keyof typeof vms];
      if (!(standardVmId in vms))
        // eslint-disable-next-line functional/no-throw-statements
        throw new Error(`Could not find a standard VM for ${standardVmId}.`);
      const standardVm = vms[standardVmId as keyof typeof vms];

      /**
       * A mapping of test IDs to the result of vm.verify for that VMB test.
       */
      type ResultMap = { [shortId: string]: string | true };
      const results: { standard: ResultMap; nonstandard: ResultMap } = {
        nonstandard: {},
        standard: {},
      };
      /**
       * A mapping of test IDs to the summarized limit information for the input
       * under test. Note that VMB tests with no indicated input index are
       * test input 0 by default.
       *
       * Limit information is an array of 3 integers:
       * 1. The Density Control Length of the input under test.
       * 2. The maximum allowed operation cost given the input length.
       * 3. The measured cumulative operation cost following evaluation.
       */
      type LimitMap = {
        [shortId: string]: [
          densityControlLength: number,
          maximumOperationCost: number,
          operationCost: number,
          testDescription: string,
        ];
      };
      const limits: { standard: LimitMap; nonstandard: LimitMap } = {
        nonstandard: {},
        standard: {},
      };
      // eslint-disable-next-line functional/no-let
      let header = '';
      /**
       * CSV breakdown of all measured stats
       */
      type CsvList = (number | string)[][];
      const stats: { standard: CsvList; nonstandard: CsvList } = {
        nonstandard: [],
        standard: [],
      };
      const bench = { nonstandard: new Bench(), standard: new Bench() };
      bench.standard.add(baselineId, () => standardVm.verify(baseline));
      bench.nonstandard.add(baselineId, () => nonstandardVm.verify(baseline));
      // eslint-disable-next-line functional/no-loop-statements
      for (const testCase of testSet) {
        const [shortId, description, , , txHex, sourceOutputsHex, testedIndex] =
          testCase;
        const inputIndex = testedIndex ?? 0;
        const sourceOutputsBin = hexToBin(sourceOutputsHex);
        const txBin = hexToBin(txHex);

        const sourceOutputsRead = readTransactionOutputs({
          bin: sourceOutputsBin,
          index: 0,
        });
        const transactionRead = readTransactionCommon({
          bin: txBin,
          index: 0,
        });
        if (typeof sourceOutputsRead === 'string') {
          // eslint-disable-next-line functional/immutable-data
          results.nonstandard[shortId] = sourceOutputsRead;
          // eslint-disable-next-line functional/immutable-data
          results.standard[shortId] = sourceOutputsRead;
          /**
           * Since this test is designed to fail UTXO parsing, it will be
           * excluded from the `*.limits.json` and `*.stats.csv` files.
           */
          // eslint-disable-next-line no-continue
          continue;
        }
        if (typeof transactionRead === 'string') {
          // eslint-disable-next-line functional/immutable-data
          results.nonstandard[shortId] = transactionRead;
          // eslint-disable-next-line functional/immutable-data
          results.standard[shortId] = transactionRead;
          /**
           * Since this test is designed to fail transaction parsing, it will be
           * excluded from the `*.limits.json` and `*.stats.csv` files.
           */
          // eslint-disable-next-line no-continue
          continue;
        }
        const sourceOutputs = sourceOutputsRead.result;
        const transaction = transactionRead.result;

        [
          { mode: 'standard' as const, vm: standardVm },
          { mode: 'nonstandard' as const, vm: nonstandardVm },
          // eslint-disable-next-line functional/no-return-void, @typescript-eslint/no-loop-func, complexity
        ].forEach(({ mode, vm }) => {
          const resolvedTx = { sourceOutputs, transaction };
          bench[mode].add(shortId, () => vm.verify(resolvedTx));
          const result = vm.verify(resolvedTx);
          // eslint-disable-next-line functional/immutable-data
          results[mode][shortId] = result;
          const finalState = vm.evaluate({
            inputIndex,
            sourceOutputs,
            transaction,
          });
          const {
            densityControlLength,
            arithmeticCost,
            evaluatedInstructionCount,
            hashDigestIterations,
            maximumHashDigestIterations,
            maximumOperationCost,
            maximumSignatureCheckCount,
            operationCost,
            signatureCheckCount,
            stackPushedBytes,
          } = finalState.metrics;
          // eslint-disable-next-line functional/immutable-data
          limits[mode][shortId] = [
            densityControlLength,
            maximumOperationCost,
            operationCost,
            description,
          ];
          const statsConfig = [
            ['Test ID', shortId],
            ['Description', `"${description}"`],
            ['Transaction Length', txBin.length],
            ['UTXOs Length', sourceOutputsBin.length],
            ['UTXO Count', sourceOutputs.length],
            ['Tested Input Index', inputIndex],
            ['Density Control Length', densityControlLength],
            ['Maximum Operation Cost', maximumOperationCost],
            ['Operation Cost', operationCost],
            ['Maximum SigChecks', maximumSignatureCheckCount],
            ['SigChecks', signatureCheckCount],
            ['Maximum Hash Digest Iterations', maximumHashDigestIterations],
            ['Hash Digest Iterations', hashDigestIterations],
            ['Evaluated Instructions', evaluatedInstructionCount],
            ['Stack Pushed Bytes', stackPushedBytes],
            ['Arithmetic Cost', arithmeticCost],
          ] as const;
          if (header === '')
            // eslint-disable-next-line functional/no-conditional-statements
            header = statsConfig.map(([label]) => label).join(',');
          const statsEntry = statsConfig.map(([_key, value]) => value);
          // eslint-disable-next-line functional/immutable-data
          stats[mode].push(statsEntry);
          /**
           * In standard mode:
           * - `standard` tests are expected to succeed,
           * - `nonstandard` and `invalid` tests are expected to reject.
           *
           * In nonstandard mode:
           * - `standard` and `nonstandard` tests are expected to succeed,
           * - `invalid` tests are expected to reject.
           */
          const expectedToSucceed =
            mode === 'standard'
              ? fullTestSetName.includes('_standard')
              : !fullTestSetName.includes('invalid');
          const using = mode === 'standard' ? standardVmId : nonStdVmId;
          const message =
            expectedToSucceed && result !== true
              ? `VMB test failure in ${filename}: test ID "${shortId}" ("${description}") was expected to succeed but rejected with error: ${result}`
              : !expectedToSucceed && result === true
                ? `VMB test failure in ${filename}: test ID "${shortId}" ("${description}") was expected to fail but succeeded.`
                : undefined;
          // eslint-disable-next-line functional/no-conditional-statements
          if (message !== undefined) {
            // eslint-disable-next-line functional/immutable-data
            issues[message] = [
              ...(issues[message] ?? []),
              [using, fullTestSetName],
            ];
          }
        });
      }

      // eslint-disable-next-line functional/no-return-void
      (['standard', 'nonstandard'] as const).forEach((mode) => {
        const resultsFile = `${fileBase}.${mode}_results.json`;
        const resultsContents = formatVmbDictionary(results[mode]);
        writeFileSync(resultsFile, resultsContents, utf8);
        const limitsFile = `${fileBase}.${mode}_limits.json`;
        const limitsContents = formatVmbDictionary(limits[mode]);
        writeFileSync(limitsFile, limitsContents, utf8);
        const statsFile = `${fileBase}.${mode}_stats.csv`;
        const csv = `${header}\n${stats[mode]
          .map((row) => row.join(','))
          .join('\n')}`;
        writeFileSync(statsFile, csv, utf8);
      });

      // eslint-disable-next-line functional/no-conditional-statements
      if (benchmark) {
        // eslint-disable-next-line functional/immutable-data
        benchmarkFunctions.push(async () => {
          // eslint-disable-next-line functional/no-loop-statements
          for (const mode of ['standard', 'nonstandard'] as const) {
            const using = mode === 'standard' ? standardVmId : nonStdVmId;
            console.log(
              `${logPrefix}${filename}: benchmarking ${fullTestSetName} using ${using}...`,
            );
            const start = performance.now();
            // eslint-disable-next-line no-await-in-loop
            await bench[mode].warmup();
            // eslint-disable-next-line no-await-in-loop
            await bench[mode].run();
            const baselineMean = assertNonNull(
              bench[mode].getTask(baselineId)?.result?.mean,
            );
            const benchResults = bench[mode].tasks.map((task) => {
              const { hz, mean, samples, rme } = assertNonNull(task.result);
              const relativeTime = mean / baselineMean;
              const id = task.name;
              const passes = results[mode][id] === true;
              return { hz, id, mean, passes, relativeTime, rme, samples };
            });
            const benchFile = `${fileBase}.${mode}_bench.csv`;
            const digits = 6;
            const csv = `Test ID,Relative Time,Hz,Average Time (ns),Margin (+/- %),Samples,Accepted/Rejected\n${benchResults
              .map(
                ({ hz, id, mean, samples, passes, relativeTime, rme }) =>
                  `${id},${[relativeTime, hz, mean, rme, samples.length]
                    .map((n) => n.toPrecision(digits))
                    .join(',')},${passes ? 'A' : 'R'}`,
              )
              .join('\n')}`;
            writeFileSync(benchFile, csv, utf8);
            const ms = (performance.now() - start).toFixed(0);
            console.log(
              `${logPrefix}${filename}: benchmarked ${fullTestSetName} using ${using} in ${ms}ms.`,
            );
            // eslint-disable-next-line no-await-in-loop
            await allowPrintTime();
          }
        });
      }
    }

    const issueMessages = Object.entries(issues).map(
      ([issue, occurrences], index) => {
        const runs = Object.entries(
          occurrences.reduce<{ [key: string]: string[] }>(
            (acc, [vm, set]) => ({ ...acc, [set]: [...(acc[set] ?? []), vm] }),
            {},
          ),
        )
          .map(([set, vm]) => `${vm.join(', ')}${set ? ` (${set})` : ''}`)
          .join('; ');
        const message = `${index}. ${issue} Occurred in: ${runs}`;
        const firstVm = occurrences[0]?.[0];
        const id = /test ID "(?<id>\w+)"/u.exec(message)?.groups?.['id'];
        console.error(
          `${message}\nFor more detailed debugging information, try e.g.: "yarn test:unit:vmb_test ${firstVm} ${id} [-v]"\n`,
        );
        return message;
      },
    );

    const annotationEnd = performance.now();
    const annotationTime = (annotationEnd - annotationStart).toFixed(0);
    const buildTime = (annotationEnd - importStart).toFixed(0);
    console.log(
      `${logPrefix}${filename}: finished in ${buildTime}ms: imported in ${importTime}ms, generated in ${generationTime}ms, annotated in ${annotationTime}ms.`,
    );
    await allowPrintTime();

    // eslint-disable-next-line functional/no-conditional-statements
    if (benchmark) {
      const benchStart = performance.now();
      console.log(`${logPrefix}${filename}: Benchmarking...`);
      // eslint-disable-next-line functional/no-loop-statements
      for (const benchmarkFn of benchmarkFunctions) {
        // eslint-disable-next-line no-await-in-loop
        await benchmarkFn();
      }
      const benchEnd = performance.now();
      const benchTime = (benchEnd - benchStart).toFixed(0);
      console.log(
        `${logPrefix}${filename}: finished and benchmarked in ${
          buildTime + benchTime
        }ms: imported in ${importTime}ms, generated in ${generationTime}ms, annotated in ${annotationTime}ms, benchmarked in ${benchTime}ms.`,
      );
    }
    return issueMessages;
  } catch (error) {
    const message = `Error generating ${filename}: ${String(error)}`;
    console.error(message, error);
    return [message];
  }
};

/**
 * Read, parse, and return the full contents of all `.vmb_tests.json` files.
 * @param filterDirectories - if provided, only the VMB tests within directories
 * matching this filter will be returned.
 */
export const importVmbTests = async (
  filterDirectories: string | undefined = undefined,
) => {
  const generatedDir = readdirSync(resultDir, { withFileTypes: true });
  const vmDirectories: string[] = generatedDir
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);
  const filteredDirectories =
    filterDirectories === undefined
      ? vmDirectories
      : vmDirectories.filter((name) => name.includes(filterDirectories));
  const vmDirectoryContents = await Promise.all(
    filteredDirectories.map(async (vmDirectory) => {
      const dirPath = resolve(resultDir, vmDirectory);
      const filePromises = readdirSync(dirPath)
        .filter((file) => file.endsWith('.vmb_tests.json'))
        .map(async (file) => {
          const filePath = resolve(dirPath, file);
          const content = await fs.readFile(filePath, 'utf8');
          // eslint-disable-next-line functional/no-try-statements
          try {
            const tests = JSON.parse(content) as VmbTest[];
            return { file, tests };
          } catch (error) {
            // eslint-disable-next-line functional/no-throw-statements
            throw new Error(
              `Failed to parse contents of ${filePath}: ${String(error)}`,
            );
          }
        });
      const files = await Promise.all(filePromises);
      return { directory: vmDirectory, files };
    }),
  );
  return vmDirectoryContents;
};

/**
 * Check for duplicate VMB test IDs or descriptions among all `.vmb_tests.json`
 * files in each VM test set.
 * @returns a `string[]` describing all conflicts found or an empty array if no
 * conflicts are found.
 */
export const checkVmbTestsForConflicts = async () => {
  // eslint-disable-next-line functional/no-try-statements
  try {
    const directories = await importVmbTests();
    const conflicts: {
      [conflict: string]: string[];
    } = {};
    /* eslint-disable functional/no-return-void */
    const markConflict = (directory: string, message: string) => {
      // eslint-disable-next-line functional/immutable-data
      conflicts[message] = [...(conflicts[message] ?? []), directory];
    };
    directories.forEach(({ directory, files }) => {
      const idMap = new Map<string, { file: string; description: string }>();
      const descMap = new Map<string, { file: string; id: string }>();
      files.forEach(({ file, tests }) => {
        tests.forEach(([id, description]) => {
          const firstId = idMap.get(id);
          // eslint-disable-next-line @typescript-eslint/no-unused-expressions
          firstId === undefined
            ? idMap.set(id, { description, file })
            : markConflict(
                directory,
                `Duplicate VMB test ID: "${id}" is first found in \n${firstId.file}, description: "${firstId.description}" but later found in \n${file}, description: "${description}"`,
              );
          const firstDesc = descMap.get(description);
          // eslint-disable-next-line @typescript-eslint/no-unused-expressions
          firstDesc === undefined
            ? descMap.set(description, { file, id })
            : markConflict(
                directory,
                `Duplicate VMB test description: "${description}" is first found in \n${firstDesc.file}, test ID: "${firstDesc.id}" but later found in \n${file}, test ID: "${id}"`,
              );
        });
        /* eslint-enable functional/no-return-void */
      });
      const isStandardAnnualSet = directory.split('_')[2] === 'standard';
      const missingBaseline = !idMap.has(baselineId);
      // eslint-disable-next-line functional/no-conditional-statements
      if (isStandardAnnualSet && missingBaseline) {
        markConflict(
          directory,
          `The baseline VMB test ID, "${baselineId}" was not found. If it's been modified, please be sure to update it throughout the codebase.`,
        );
      }
    });

    return Object.entries(conflicts).map(([issue, sets], index) => {
      const message = `${index}. ${issue}\nTest sets: ${sets.join(', ')}\n`;
      console.error(message);
      return message;
    });
  } catch (error) {
    const message = `Error checking for duplicate test IDs and descriptions: ${String(
      error,
    )}`;
    console.error(message);
    return [message];
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any, functional/no-mixed-types, functional/no-return-void
type WorkerWrapper = { worker: Worker; handler?: (value: any) => void };
export type WorkerTask = { file: string; hash: string };
export type WorkerResult = { file: string; hash: string; fileIssues: string[] };

// eslint-disable-next-line functional/immutable-data
process.env['FORCE_COLOR'] = '3';
const cwd = dirname(fileURLToPath(import.meta.url));
export const createWorkers = (
  count: number,
  benchmark: boolean,
): WorkerWrapper[] =>
  range(count).map((index) => {
    const worker = new Worker(
      join(cwd, 'generate-vmb-tests-worker.spec.helper.js'),
      {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        env: { ...process.env, FORCE_COLOR: '3' },
        workerData: { benchmark, index },
      },
    );
    // eslint-disable-next-line functional/no-return-void
    worker.on('error', (error) => {
      console.error(`Error from worker ${index}:`, error);
    });
    // eslint-disable-next-line functional/no-return-void
    worker.on('log', (args) => {
      console.log(args);
    });

    // eslint-disable-next-line functional/no-return-void
    worker.on('exit', (code) => {
      // eslint-disable-next-line functional/no-conditional-statements
      if (code !== 0) {
        console.error(`Worker ${index} stopped with exit code ${code}.`);
      }
    });
    return { busy: false, worker };
  });

/**
 * (Re)generate all VMB tests, verifying all expected results and checking for
 * duplicate IDs/descriptions.
 * @param workers - if provided, these workers will be used during
 * generation rather than the current thread.
 * @returns a list of any regeneration or validation errors or – if no issues
 * are found – an empty array.
 */

// eslint-disable-next-line complexity
export const generateVmbTests = async (
  workers?: WorkerWrapper[],
  { benchmark = false, deleteUnexpected = false } = {},
) => {
  console.log('Generating vmb_tests...');
  const manifestPath = benchmark ? benchInfoPath : buildInfoPath;
  console.log(`Using manifest: ${manifestPath}`);

  const currentManifest = getPreviousManifest(manifestPath);
  const newManifest = getLatestManifest();
  const modifiedFiles = Object.entries(newManifest).filter(
    ([file, hash]) => currentManifest[file] !== hash,
  );
  const generationStart = performance.now();
  console.log(
    `${modifiedFiles.length} modified files: ${modifiedFiles
      .map(([file]) => file)
      .join(', ')}`,
  );
  const issues: string[] = [];
  // eslint-disable-next-line functional/no-return-void
  const saveOnSuccess = (
    fileName: string,
    newHash: string,
    fileIssues: string[],
  ) => {
    if (fileIssues.length === 0) {
      // eslint-disable-next-line functional/immutable-data
      currentManifest[fileName] = newHash;
      saveManifest(manifestPath, currentManifest);
      return;
    }
    // eslint-disable-next-line functional/immutable-data
    issues.push(...fileIssues);
  };

  /* eslint-disable functional/no-return-void, functional/no-conditional-statements, functional/immutable-data */
  if (workers === undefined) {
    console.log(`(Not using workers.)`);
    await Promise.all(
      modifiedFiles.map(async ([file, hash]) => {
        const fileIssues = await generateVmbTestsFromSourceFile(file, hash, {
          benchmark,
        });
        saveOnSuccess(file, hash, fileIssues);
      }),
    );
  } else {
    await new Promise<void>((allWorkIsDone) => {
      const waiting: WorkerTask[] = modifiedFiles.map(([file, hash]) => ({
        file,
        hash,
      }));
      const assigned: WorkerTask[] = [];
      const complete: WorkerTask[] = [];
      const assignNextItem = (wrapper: WorkerWrapper) => {
        const workItem = waiting.pop();
        if (workItem === undefined) {
          if (assigned.length === 0) {
            allWorkIsDone();
            return;
          }
          return;
        }
        assigned.push(workItem);
        const data: WorkerTask = { file: workItem.file, hash: workItem.hash };
        wrapper.worker.postMessage({ data, type: 'generate' });
      };
      workers.forEach((wrapper) => {
        const handler = (
          message:
            | { type: 'error' | 'log'; args: unknown[] }
            | { type: 'result'; data: WorkerResult },
        ) => {
          if (message.type === 'error') {
            console.error(...message.args);
            return;
          }
          if (message.type === 'log') {
            console.log(...message.args);
            return;
          }
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          if (message.type !== 'result') {
            // eslint-disable-next-line functional/no-throw-statements
            throw new Error(
              `Unexpected message from worker: ${JSON.stringify(message)}`,
            );
          }
          const { file, hash, fileIssues } = message.data;
          saveOnSuccess(file, hash, fileIssues);
          const time = (performance.now() - generationStart).toFixed(0);
          const [item] = assigned.splice(
            assigned.findIndex((i) => i.file === file),
            1,
          );
          complete.push(assertNonNull(item));
          console.log(
            `After ${time}ms: ${waiting.length} files waiting for a worker; ${
              assigned.length
            } currently being processed (${assigned
              .map(({ file: f }) => f)
              .join(', ')}); ${complete.length} files complete.`,
          );
          assignNextItem(wrapper);
        };
        wrapper.worker.on('message', handler);
        wrapper.handler = handler;
        assignNextItem(wrapper);
      });
    });
    workers.forEach((wrapper) => {
      if (wrapper.handler !== undefined) {
        wrapper.worker.off('message', wrapper.handler);
        wrapper.handler = undefined;
      }
    });
  }
  /* eslint-enable functional/no-return-void, functional/no-conditional-statements, functional/immutable-data */

  const generationEnd = performance.now();
  const generationTime = (generationEnd - generationStart).toFixed(0);
  console.log(`Regenerated all vmb_tests in ${generationTime}ms.`);

  if (issues.length > 0) {
    return issues;
  }

  const bases = getSources().map((name) => name.replace('.ts', ''));
  const suffixes = [
    '.nonstandard_bench.csv',
    '.nonstandard_limits.json',
    '.nonstandard_results.json',
    '.nonstandard_stats.csv',
    '.standard_bench.csv',
    '.standard_limits.json',
    '.standard_results.json',
    '.standard_stats.csv',
    '.vmb_tests.json',
  ];
  const resultSubDirs = readdirSync(resultDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);
  const unexpectedFiles = resultSubDirs.flatMap((subDir) => {
    const subDirPath = join(resultDir, subDir);
    return readdirSync(subDirPath)
      .filter(
        (file) =>
          !bases.some(
            (base) =>
              file.startsWith(base) &&
              suffixes.some((suffix) => file === `${base}${suffix}`),
          ),
      )
      .map((file) => join(subDirPath, file));
  });

  if (unexpectedFiles.length > 0) {
    // eslint-disable-next-line functional/no-conditional-statements
    if (deleteUnexpected) {
      await Promise.all(
        unexpectedFiles.map(async (file) => {
          await fs.unlink(file);
          console.log(`Deleted unexpected file: ${file}`);
        }),
      );
    } else {
      const message = `Found unexpected files in the result directory that do not correspond to any source files:\n${unexpectedFiles.join(
        '\n',
      )}\n\nTo automatically delete these unexpected files, re-run generation with the '-d' flag.`;
      console.error(message);
      return message;
    }
  }

  const dupCheckStart = performance.now();
  const conflicts = await checkVmbTestsForConflicts();
  const dupCheckEnd = performance.now();
  const dupCheckTime = (dupCheckEnd - dupCheckStart).toFixed(0);
  console.log(
    `Checked for duplicated IDs and duplicated descriptions in ${dupCheckTime}ms.`,
  );
  return conflicts;
};
