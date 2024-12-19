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
const showHelp = flags?.includes('help') ?? false;
const benchmark = flags?.includes('b') ?? false;
const watchFiles = flags?.includes('w') ?? false;
const deleteUnexpected = flags?.includes('d') ?? false;
const ignoreWarnings = flags?.includes('i') ?? false;

if (showHelp) {
  console.log(`Usage examples:
       yarn gen:vmb_tests         # re-generate outdated VMB tests
       yarn gen:vmb_tests -b      # enable benchmarks           (alias: yarn bench:vmb_tests)
       yarn gen:vmb_tests -w      # re-generate on watch task   (alias: yarn dev:vmb_tests)
       yarn gen:vmb_tests -wb     # watch + bench            (alias: dev:vmb_tests:bench)
       yarn gen:vmb_tests -d      # perform any deletions (dry-run happens automatically)
       yarn gen:vmb_tests -i      # ignore generation warnings
       yarn gen:vmb_tests -wi     # watch + ignore warnings
       yarn gen:vmb_tests --help  # show this message
`);
  process.exit(0);
}

console.log(
  `Benchmarking ${benchmark ? 'enabled' : 'disabled'}. ${
    ignoreWarnings ? '\nWarnings are disabled.' : ''
  }`,
);

const main = async () => {
  const availableCPUs = cpus().length;
  const most = 0.5;
  const workerCount = Math.floor(most * availableCPUs);
  console.log(`Spawning ${workerCount} workers...`);
  const settings = { benchmark, deleteUnexpected, ignoreWarnings };
  const workers = createWorkers(workerCount, settings);
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
