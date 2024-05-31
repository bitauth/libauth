import test from 'ava';

import type { CompilationContextBch } from '../../lib.js';
import { compilerOperationSigningSerializationFullBch } from '../../lib.js';

test('compilerOperationSigningSerializationFullBch: requires an algorithm', (t) => {
  t.deepEqual(
    compilerOperationSigningSerializationFullBch(
      '',
      { compilationContext: {} as CompilationContextBch },
      {
        scripts: { lock: '' },
        sha256: { hash: () => Uint8Array.of() },
        sourceScriptIds: ['test'],
        unlockingScripts: { test: 'lock' },
      },
    ),
    {
      error:
        'Invalid signing serialization operation. Include the desired component or algorithm, e.g. "signing_serialization.version".',
      status: 'error',
    },
  );
});
test('compilerOperationSigningSerializationFullBch: error on unknown algorithms', (t) => {
  t.deepEqual(
    compilerOperationSigningSerializationFullBch(
      'signing_serialization.full_unknown_serialization',
      { compilationContext: {} as CompilationContextBch },
      {
        scripts: { lock: '' },
        sha256: { hash: () => Uint8Array.of() },
        sourceScriptIds: ['test'],
        unlockingScripts: { test: 'lock' },
      },
    ),
    {
      error:
        'Unknown signing serialization algorithm, "full_unknown_serialization".',
      status: 'error',
    },
  );
});
