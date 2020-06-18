/* eslint-disable functional/no-expression-statement */
import test from 'ava';

import {
  compilerOperationHelperGenerateCoveredBytecode,
  compilerOperationRequires,
  stringifyTestVector,
} from '../lib';

test('attemptCompilerOperations: can skip environment property check', (t) => {
  t.deepEqual(
    compilerOperationRequires({
      canBeSkipped: true,
      dataProperties: [],
      environmentProperties: ['entityOwnership'],
      operation: () => ({ error: 'test failed', status: 'error' }),
    })('', {}, { scripts: {} }),
    { status: 'skip' }
  );
});

test('compilerOperationHelperGenerateCoveredBytecode: empty sourceScriptIds', (t) => {
  const result = compilerOperationHelperGenerateCoveredBytecode({
    data: {},
    environment: { scripts: {} },
    identifier: 'test',
    sourceScriptIds: [],
    unlockingScripts: {},
  });
  t.deepEqual(
    result,
    {
      error:
        'Identifier "test" requires a signing serialization, but "coveredBytecode" cannot be determined because the compilation environment\'s "sourceScriptIds" is empty.',
      status: 'error',
    },
    stringifyTestVector(result)
  );
});
