/* eslint-disable functional/no-throw-statements, functional/no-expression-statements, functional/no-try-statements */
import { parentPort, workerData } from 'worker_threads';

import type {
  WorkerResult,
  WorkerTask,
} from './generate-vmb-tests.spec.helper.js';
import { generateVmbTestsFromSourceFile } from './generate-vmb-tests.spec.helper.js';

if (parentPort === null) {
  throw new Error(`This script must be run via a Worker.`);
}

const { benchmark, index } = workerData as {
  benchmark: boolean;
  index: number;
};
const logPrefix = `Worker ${index}: `;

/**
 * By sending errors to the main thread, we can log them using `console.error`
 * and colors
 */
const console = {
  // eslint-disable-next-line functional/no-return-void, functional/functional-parameters
  error: (...args: unknown[]) => {
    parentPort?.postMessage({ args, type: 'error' });
  },
  // eslint-disable-next-line functional/no-return-void, functional/functional-parameters
  log: (...args: unknown[]) => {
    parentPort?.postMessage({ args, type: 'log' });
  },
  // eslint-disable-next-line functional/no-return-void, functional/functional-parameters
  warn: (...args: unknown[]) => {
    parentPort?.postMessage({ args, type: 'warn' });
  },
};

const generateFile = async (file: string, hash: string) => {
  const { issues: fileIssues } = await generateVmbTestsFromSourceFile(
    file,
    hash,
    {
      benchmark,
      console,
      logPrefix,
    },
  );
  return { file, fileIssues, hash } as WorkerResult;
};

parentPort.on(
  'message',
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  async (message: { type: string; data: WorkerTask }) => {
    if (parentPort === null) {
      throw new Error(`This script must be run via a Worker.`);
    }
    if (message.type === 'generate') {
      const { file, hash } = message.data;
      try {
        const result = await generateFile(file, hash);
        parentPort.postMessage({ data: result, type: 'result' });
      } catch (error) {
        console.error(`${logPrefix}error:`, JSON.stringify(error));
        console.error(error);
      }
      return;
    }
    if (message.type === 'shutdown') {
      process.exit(0);
    }
    console.error(`${logPrefix}Unexpected message:`, JSON.stringify(message));
  },
);
