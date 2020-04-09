/* eslint-disable functional/no-expression-statement */
import test from 'ava';

import {
  CompilerOperationDataCommon,
  compilerOperationSigningSerializationFullBCH,
} from '../../lib';

test('compilerOperationSigningSerializationFullBCH: requires an algorithm', (t) => {
  t.deepEqual(
    compilerOperationSigningSerializationFullBCH(
      '',
      { operationData: {} as CompilerOperationDataCommon },
      { scripts: {}, sha256: { hash: () => Uint8Array.of() } }
    ),
    'Invalid signing serialization operation. Include the desired component or algorithm, e.g. "signing_serialization.version".'
  );
});
test('compilerOperationSigningSerializationFullBCH: error on unknown algorithms', (t) => {
  t.deepEqual(
    compilerOperationSigningSerializationFullBCH(
      'signing_serialization.full_unknown_serialization',
      { operationData: {} as CompilerOperationDataCommon },
      { scripts: {}, sha256: { hash: () => Uint8Array.of() } }
    ),
    'Unknown signing serialization algorithm, "full_unknown_serialization".'
  );
});
