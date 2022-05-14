import test from 'ava';

import type { CompilationContextBCH } from '../../lib';
import { compilerOperationSigningSerializationFullBCH } from '../../lib.js';

test('compilerOperationSigningSerializationFullBCH: requires an algorithm', (t) => {
  t.deepEqual(
    compilerOperationSigningSerializationFullBCH(
      '',
      { compilationContext: {} as CompilationContextBCH },
      {
        scripts: { lock: '' },
        sha256: { hash: () => Uint8Array.of() },
        sourceScriptIds: ['test'],
        unlockingScripts: { test: 'lock' },
      }
    ),
    {
      error:
        'Invalid signing serialization operation. Include the desired component or algorithm, e.g. "signing_serialization.version".',
      status: 'error',
    }
  );
});
test('compilerOperationSigningSerializationFullBCH: error on unknown algorithms', (t) => {
  t.deepEqual(
    compilerOperationSigningSerializationFullBCH(
      'signing_serialization.full_unknown_serialization',
      { compilationContext: {} as CompilationContextBCH },
      {
        scripts: { lock: '' },
        sha256: { hash: () => Uint8Array.of() },
        sourceScriptIds: ['test'],
        unlockingScripts: { test: 'lock' },
      }
    ),
    {
      error:
        'Unknown signing serialization algorithm, "full_unknown_serialization".',
      status: 'error',
    }
  );
});
