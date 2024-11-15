/* This is a watch task for VMB test development, run it with `yarn dev:vmb_tests` */

/* eslint-disable functional/no-expression-statements, no-console, functional/no-conditional-statements, functional/no-loop-statements */
import { watch } from 'node:fs/promises';
import { cpus } from 'node:os';

import {
  compiledDir,
  createWorkers,
  generateVmbTests,
} from './generate-vmb-tests.spec.helper.js';

const [, , flags] = process.argv;
const benchmark = flags?.includes('b') ?? false;
const watchFiles = flags?.includes('w') ?? false;
const deleteUnexpected = flags?.includes('d') ?? false;

console.log(`Benchmarking ${benchmark ? 'enabled' : 'disabled'}.`);

const main = async () => {
  const availableCPUs = cpus().length;
  const most = 0.5;
  const workerCount = Math.floor(most * availableCPUs);
  console.log(`Spawning ${workerCount} workers...`);
  const workers = createWorkers(workerCount, benchmark);
  const settings = { benchmark, deleteUnexpected };
  await generateVmbTests(workers, settings);
  if (watchFiles) {
    const watcher = watch(compiledDir);
    console.log(`Watching for changes in: ${compiledDir}`);
    for await (const event of watcher) {
      if (
        typeof event.filename === 'string' &&
        event.filename.endsWith('.js')
      ) {
        console.log(`File changed: ${event.filename}`);
        await generateVmbTests(workers, settings);
      }
    }
  }
  // eslint-disable-next-line functional/no-return-void
  workers.forEach(({ worker }) => {
    worker.postMessage({ type: 'shutdown' });
  });
};

// eslint-disable-next-line functional/no-return-void
main().catch((err) => {
  console.error(err);
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  watchFiles
    ? console.info(
        `\n\nPlease ensure "yarn watch" is running in another process.`,
      )
    : console.info(
        `\n\nPlease run "yarn build" to recompile the latest changes.`,
      );
});
