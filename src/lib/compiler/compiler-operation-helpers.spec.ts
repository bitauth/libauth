import test from 'ava';

import {
  compilerOperationHelperGenerateCoveredBytecode,
  compilerOperationRequires,
  stringifyTestVector,
} from '../lib.js';

test('attemptCompilerOperations: can skip configuration property check', (t) => {
  t.deepEqual(
    compilerOperationRequires({
      canBeSkipped: true,
      configurationProperties: ['entityOwnership'],
      dataProperties: [],
      operation: () => ({ error: 'test failed', status: 'error' }),
    })('', {}, { scripts: {} }),
    { status: 'skip' }
  );
});

test('compilerOperationHelperGenerateCoveredBytecode: empty sourceScriptIds', (t) => {
  const result = compilerOperationHelperGenerateCoveredBytecode({
    configuration: { scripts: {} },
    data: {},
    identifier: 'test',
    sourceScriptIds: [],
    unlockingScripts: {},
  });
  t.deepEqual(
    result,
    {
      error:
        'Identifier "test" requires a signing serialization, but "coveredBytecode" cannot be determined because the compiler configuration\'s "sourceScriptIds" is empty.',
      status: 'error',
    },
    stringifyTestVector(result)
  );
});
