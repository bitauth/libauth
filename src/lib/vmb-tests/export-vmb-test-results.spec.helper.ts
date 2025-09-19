/* eslint-disable no-console, functional/no-expression-statements, functional/no-return-void, functional/immutable-data, functional/no-conditional-statements, @typescript-eslint/no-non-null-assertion, functional/no-throw-statements */
/**
 * This script compiles all VMB benchmarking results into single-file CSVs in
 * the `export` directory, e.g.:
 *  - `export/bench/bch_2025.libauth.standard_bench.csv`,
 *  - `export/stats/bch_2025.standard_stats.csv`, and
 *
 * Then, separately, all `bench/VM_NAME.*.[non]standard_bench.csv` files in the
 * export directory are extended using the matching
 * `stats/VM_NAME.*.[non]standard_stats.csv` file to
 * produce `extended/VM_NAME.*.[non]standard.csv`.
 *
 * This approach allows for extending benchmark results produced by other
 * implementations: save any externally-produced benchmark results using a
 * matching pattern, and the results will be extended with matching stats data,
 * e.g. `bench/bch_2025.bchn.standard_bench.csv` will be extended with data
 * from `stats/bch_2025.standard_stats.csv` to
 * produce `extended/bch_2025.bchn.standard.csv`.
 */

import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { benchHeader, resultDir } from './generate-vmb-tests.spec.helper.js';

const exportDir = resolve(resultDir, '../export');
const benchDir = resolve(exportDir, 'bench');
const statsDir = resolve(exportDir, 'stats');
const extendedDir = resolve(exportDir, 'extended');

const statsHeader =
  'Test ID,Description,Transaction Length,UTXOs Length,UTXO Count,Tested Input Index,Density Control Length,Maximum Operation Cost,Operation Cost,Maximum SigChecks,SigChecks,Maximum Hash Digest Iterations,Hash Digest Iterations,Evaluated Instructions,Stack Pushed Bytes,Arithmetic Cost';
const utf8 = { encoding: 'utf8' } as const;
const main = () => {
  console.log(`Reading all results from: ${resultDir}`);
  const generatedDir = readdirSync(resultDir, { withFileTypes: true });
  const vmDirectories: string[] = generatedDir
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

  const aggregated: {
    [vmName: string]: {
      [resultType in 'bench' | 'stats']: {
        nonstandard: string;
        standard: string;
      };
    };
  } = {};
  vmDirectories.forEach((vmDirectory) => {
    const dirPath = resolve(resultDir, vmDirectory);
    const fileList = readdirSync(dirPath);
    const vmBaseName = vmDirectory.slice(0, vmDirectory.lastIndexOf('_'));
    if (aggregated[vmBaseName] === undefined) {
      aggregated[vmBaseName] = {
        bench: { nonstandard: benchHeader, standard: benchHeader },
        stats: { nonstandard: statsHeader, standard: statsHeader },
      };
    }
    (['nonstandard', 'standard'] as const).forEach((mode) => {
      fileList
        .filter((file) => file.endsWith(`.${mode}_bench.csv`))
        .forEach((file) => {
          const filePath = resolve(dirPath, file);
          const content = readFileSync(filePath, utf8);
          const lines = content.split('\n');
          const [header] = lines;
          if (header !== benchHeader) {
            throw new Error(
              `Unexpected header in ${filePath}:\n"${header}"\nExpected:\n"${benchHeader}"`,
            );
          }
          const headerAndBaselineLines = 2;
          const trimmed = lines.slice(headerAndBaselineLines).join('\n');
          const newLineIfContent = trimmed === '' ? trimmed : `\n${trimmed}`;
          aggregated[vmBaseName]!.bench[mode] = `${
            aggregated[vmBaseName]!.bench[mode]
          }${newLineIfContent}`;
        });
      fileList
        .filter((file) => file.endsWith(`.${mode}_stats.csv`))
        .forEach((file) => {
          const filePath = resolve(dirPath, file);
          const content = readFileSync(filePath, utf8);
          const lines = content.split('\n');
          const [header] = lines;
          if (header !== statsHeader) {
            throw new Error(
              `Unexpected header in ${filePath}:\n"${header}"\nExpected:\n"${statsHeader}"`,
            );
          }
          const headerLine = 1;
          const trimmed = lines.slice(headerLine).join('\n');
          const newLineIfContent = trimmed === '' ? trimmed : `\n${trimmed}`;
          aggregated[vmBaseName]!.stats[mode] = `${
            aggregated[vmBaseName]!.stats[mode]
          }${newLineIfContent}`;
        });
    });
  });
  mkdirSync(benchDir, { recursive: true });
  mkdirSync(statsDir, { recursive: true });
  mkdirSync(extendedDir, { recursive: true });
  Object.keys(aggregated).forEach((vmBaseName) => {
    (['nonstandard', 'standard'] as const).forEach((mode) => {
      const benchFile = `${benchDir}/${vmBaseName}.libauth.${mode}_bench.csv`;
      const csv = aggregated[vmBaseName]!.bench[mode];
      writeFileSync(benchFile, csv, utf8);
      console.log(`Wrote: ${benchFile}`);
    });
    (['nonstandard', 'standard'] as const).forEach((mode) => {
      const statsFile = `${statsDir}/${vmBaseName}.${mode}_stats.csv`;
      const csv = aggregated[vmBaseName]!.stats[mode];
      writeFileSync(statsFile, csv, utf8);
      console.log(`Wrote: ${statsFile}`);
    });
  });
  const stats: {
    [vmName: string]: {
      [mode in 'nonstandard' | 'standard']: {
        /**
         * The stats line associated with the testId for that mode.
         */
        [testId: string]: string;
      };
    };
  } = {};
  Object.keys(aggregated).forEach((vmBaseName) => {
    stats[vmBaseName] = { nonstandard: {}, standard: {} };
    (['nonstandard', 'standard'] as const).forEach((mode) => {
      const lines = aggregated[vmBaseName]!.stats[mode].split('\n');
      const withoutHeader = lines.slice(1);
      const testStats: { [testId: string]: string } = {};
      withoutHeader.forEach((line) => {
        const [testId, ...theRest] = line.split(',');
        const restOfLine = theRest.join(',');
        if (testStats[testId!] === undefined) {
          testStats[testId!] = restOfLine;
          return;
        }
        throw new Error(
          `Stats were previously ingested for VM "${vmBaseName}", mode "${mode}", test ID "${testId}". Please review for duplicates: ${statsDir}/${vmBaseName}.${mode}_stats.csv
Old stats: ${testStats[testId!]}
New stats: ${restOfLine}`,
        );
      });
      stats[vmBaseName]![mode] = testStats;
    });
  });
  /**
   * Note, we re-read benchmarking results from disk here to pull in any results
   * produced externally. See the explanation at the top of this file.
   */
  readdirSync(benchDir)
    .filter((file) => file.endsWith('_bench.csv'))
    // eslint-disable-next-line complexity
    .forEach((file) => {
      const [requestedVmName, implementationId, resultType, ext] =
        file.split('.');
      const mode =
        resultType === 'nonstandard_bench' ? 'nonstandard' : 'standard';
      if (
        typeof requestedVmName !== 'string' ||
        typeof implementationId !== 'string' ||
        (mode === 'standard' && resultType !== 'standard_bench') ||
        ext !== 'csv'
      ) {
        throw new Error(
          `Unexpected filename, "${file}". Unified benchmark filenames should follow the pattern: VM_NAME.IMPLEMENTATION.[non]standard_bench.csv`,
        );
      }
      const relevantStats = stats[requestedVmName];
      if (relevantStats === undefined) {
        throw new Error(
          `Requested results for an unknown VM, "${requestedVmName}". Please rename "${file}" to extend it with stats from a known VM: ${Object.keys(
            stats,
          ).join(', ')}`,
        );
      }
      const filePath = resolve(benchDir, file);
      const content = readFileSync(filePath, utf8).trim();
      const [header, ...remainingLines] = content.split('\n');
      if (header !== benchHeader) {
        throw new Error(
          `Unexpected header in ${filePath}:\n"${header}"\nExpected:\n"${benchHeader}"`,
        );
      }
      const extendedLines = remainingLines.map((line, index) => {
        const [testId] = line.split(',');
        if (typeof testId !== 'string') {
          throw new Error(
            `Line ${index} of ${filePath} does not have a valid test ID.`,
          );
        }
        const lineStats = relevantStats[mode][testId];
        if (lineStats === undefined) {
          throw new Error(
            `Line ${index} of ${filePath} references an unknown test ID, "${testId}".`,
          );
        }
        return `${line},${lineStats}`;
      });
      const extendedFile = `${extendedDir}/${requestedVmName}.${mode}.${implementationId}.csv`;
      const extendedContents = `${header},${statsHeader.replace(
        'Test ID,',
        '',
      )}\n${extendedLines.join('\n')}`;
      writeFileSync(extendedFile, extendedContents, utf8);
      console.log(`Extended ${file}, wrote: ${extendedFile}`);
    });
};

main();
