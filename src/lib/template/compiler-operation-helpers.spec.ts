/* eslint-disable functional/no-expression-statement */
import test from 'ava';

import { compilerOperationRequires } from '../lib';

test('attemptCompilerOperations: can skip environment property check', (t) => {
  t.deepEqual(
    compilerOperationRequires({
      canBeSkipped: true,
      dataProperties: [],
      environmentProperties: ['entityOwnership'],
      operation: () => 'test failed',
    })('', {}, { scripts: {} }),
    false
  );
});
