import test from 'ava';

import type {
  AuthenticationProgramStateBch,
  BytecodeGenerationResult,
} from '../../lib.js';
import { hexToBin } from '../../lib.js';

import {
  expectCompilationResult,
  privateKeyM0,
} from './compiler-bch.e2e.spec.helper.js';

test(
  '[BCH compiler] Key - errors on deprecated "signature" operation',
  expectCompilationResult,
  '<owner.signature.anything>',
  { keys: { privateKeys: { owner: privateKeyM0 } } },
  {
    errorType: 'resolve',
    errors: [
      {
        error:
          'The "signature" compiler operation was renamed to "ecdsa_signature". Consider fixing this error by changing "owner.signature.anything" to "owner.schnorr_signature.anything" (schnorr signatures reduce transaction sizes and enable multi-party signature aggregation).',
        range: {
          endColumn: 26,
          endLineNumber: 1,
          startColumn: 2,
          startLineNumber: 1,
        },
      },
    ],
    success: false,
  } as BytecodeGenerationResult<AuthenticationProgramStateBch>,
  {
    owner: { type: 'Key' },
  },
);

test(
  '[BCH compiler] Key - ECDSA: use a private key (".ecdsa_signature")',
  expectCompilationResult,
  '<owner.ecdsa_signature.all_outputs>',
  { keys: { privateKeys: { owner: privateKeyM0 } } },
  {
    bytecode: hexToBin(
      '473044022023aafaded9a737022375e895d752466760c98fdd40841dc0b1c9dff6eb884469022035672abd7d7402d9b9791805d78581fa1e23cea7f1887ee80ea346ca75ee3f1f41',
    ),
    success: true,
  },
  {
    owner: { type: 'Key' },
  },
);

test(
  '[BCH compiler] Key - schnorr: use a private key',
  expectCompilationResult,
  '<owner.schnorr_signature.all_outputs>',
  { keys: { privateKeys: { owner: privateKeyM0 } } },
  {
    bytecode: hexToBin(
      '41dc748427ac03d7436efeed4a8a2deef63522dd60f2b401302e7120b6117b440e858571c17d5a4b66646c52093100f9242569767cc1a510c522ccfc36019eea8641',
    ),
    success: true,
  },
  {
    owner: { type: 'Key' },
  },
);

test(
  '[BCH compiler] Key - derive a public key from a private key',
  expectCompilationResult,
  '<owner.public_key>',
  { keys: { privateKeys: { owner: privateKeyM0 } } },
  {
    bytecode: hexToBin(
      '210376ea9e36a75d2ecf9c93a0be76885e36f822529db22acfdc761c9b5b4544f5c5',
    ),
    success: true,
  },
  {
    owner: { type: 'Key' },
  },
);

test(
  '[BCH compiler] Key - derive a public key: no secp256k1',
  expectCompilationResult,
  '<owner.public_key>',
  { keys: { privateKeys: { owner: privateKeyM0 } } },
  {
    errorType: 'resolve',
    errors: [
      {
        error:
          'Cannot resolve "owner.public_key" - the "secp256k1" property was not provided in the compiler configuration.',
        range: {
          endColumn: 18,
          endLineNumber: 1,
          startColumn: 2,
          startLineNumber: 1,
        },
      },
    ],
    success: false,
  } as BytecodeGenerationResult<AuthenticationProgramStateBch>,
  {
    owner: { type: 'Key' },
  },
  { secp256k1: undefined },
);

test(
  '[BCH compiler] Key - use a provided public key (without secp256k1)',
  expectCompilationResult,
  '<owner.public_key>',
  {
    bytecode: {
      'owner.public_key': hexToBin(
        '0376ea9e36a75d2ecf9c93a0be76885e36f822529db22acfdc761c9b5b4544f5c5',
      ),
    },
  },
  {
    errorType: 'parse',
    errors: [
      {
        error:
          'Could not validate compilation data: the public key provided for "owner.public_key" could not be validated because the "secp256k1" property was not provided in the compiler configuration.',
        range: {
          endColumn: 0,
          endLineNumber: 0,
          startColumn: 0,
          startLineNumber: 0,
        },
      },
    ],
    success: false,
  } as BytecodeGenerationResult<AuthenticationProgramStateBch>,
  {
    owner: { type: 'Key' },
  },
  { secp256k1: undefined },
);

test(
  '[BCH compiler] Key - public_key: no matching public or private keys',
  expectCompilationResult,
  '<owner.public_key>',
  {
    bytecode: {},
    keys: {
      privateKeys: {},
    },
  },
  {
    errorType: 'resolve',
    errors: [
      {
        error:
          'Identifier "owner.public_key" refers to a public key, but no public or private keys for "owner" were provided in the compilation data.',
        missingIdentifier: 'owner.public_key',
        owningEntity: 'ownerEntityId',
        range: {
          endColumn: 18,
          endLineNumber: 1,
          startColumn: 2,
          startLineNumber: 1,
        },
      },
    ],
    success: false,
  } as BytecodeGenerationResult<AuthenticationProgramStateBch>,
  {
    owner: { type: 'Key' },
  },
);

test(
  '[BCH compiler] Key - public_key: invalid private key (insufficient length)',
  expectCompilationResult,
  '<owner.public_key>',
  {
    bytecode: {},
    keys: {
      privateKeys: { owner: Uint8Array.from([1, 2, 3]) },
    },
  },
  {
    errorType: 'parse',
    errors: [
      {
        error:
          'Invalid compilation data detected: the private key provided for the "owner" variable is not a valid Secp256k1 private key.',
        range: {
          endColumn: 0,
          endLineNumber: 0,
          startColumn: 0,
          startLineNumber: 0,
        },
      },
    ],
    success: false,
  } as BytecodeGenerationResult<AuthenticationProgramStateBch>,
  {
    owner: { type: 'Key' },
  },
);

test(
  '[BCH compiler] Key - public_key: invalid private key (exceeds maximum)',
  expectCompilationResult,
  '<owner.public_key>',
  {
    bytecode: {},
    keys: {
      privateKeys: {
        owner: hexToBin(
          'fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141',
        ),
      },
    },
  },
  {
    errorType: 'parse',
    errors: [
      {
        error:
          'Invalid compilation data detected: the private key provided for the "owner" variable is not a valid Secp256k1 private key.',
        range: {
          endColumn: 0,
          endLineNumber: 0,
          startColumn: 0,
          startLineNumber: 0,
        },
      },
    ],
    success: false,
  } as BytecodeGenerationResult<AuthenticationProgramStateBch>,
  {
    owner: { type: 'Key' },
  },
);

test(
  '[BCH compiler] Key - ECDSA: use a provided signature (without secp256k1)',
  expectCompilationResult,
  '<owner.ecdsa_signature.all_outputs>',
  {
    bytecode: {
      'owner.ecdsa_signature.all_outputs': hexToBin(
        '3044022059e9ad8fabd511fa2ef6935dae6395d5d3ce93b929436c835c9c8372b353bd3d0220527c17e2e4ec12f7b8969a9bb80e58ab1a24e44c2e5512916d1bcb3fc4dc2f2241',
      ),
    },
    keys: {},
  },
  {
    bytecode: hexToBin(
      '473044022059e9ad8fabd511fa2ef6935dae6395d5d3ce93b929436c835c9c8372b353bd3d0220527c17e2e4ec12f7b8969a9bb80e58ab1a24e44c2e5512916d1bcb3fc4dc2f2241',
    ),
    success: true,
  },
  {
    owner: { type: 'Key' },
  },
  { secp256k1: undefined },
);

test(
  '[BCH compiler] Key - schnorr: use a provided signature',
  expectCompilationResult,
  '<owner.schnorr_signature.all_outputs>',
  {
    bytecode: {
      'owner.schnorr_signature.all_outputs': hexToBin(
        '313d8a853bd82f5fe251d6b04581333800001ee7680c5e4775db3afabf4873360b3481802d8d656cc608e4625d6568bf1a8801bb1efff19a8306267681177aed41',
      ),
    },
  },
  {
    bytecode: hexToBin(
      '41313d8a853bd82f5fe251d6b04581333800001ee7680c5e4775db3afabf4873360b3481802d8d656cc608e4625d6568bf1a8801bb1efff19a8306267681177aed41',
    ),
    success: true,
  },
  {
    owner: { type: 'Key' },
  },
);

test(
  '[BCH compiler] Key - malformed identifier',
  expectCompilationResult,
  '<owner.ecdsa_signature>',
  { keys: { privateKeys: { owner: privateKeyM0 } } },
  {
    errorType: 'resolve',
    errors: [
      {
        error:
          'Invalid signature identifier. Signatures must be of the form: "[variable_id].ecdsa_signature.[signing_serialization_type]".',
        range: {
          endColumn: 23,
          endLineNumber: 1,
          startColumn: 2,
          startLineNumber: 1,
        },
      },
    ],
    success: false,
  } as BytecodeGenerationResult<AuthenticationProgramStateBch>,
  {
    owner: { type: 'Key' },
  },
);

test(
  '[BCH compiler] Key - ECDSA: wrong private key',
  expectCompilationResult,
  '<owner.ecdsa_signature.all_outputs>',
  { keys: { privateKeys: { wrong: privateKeyM0 } } },
  {
    errorType: 'resolve',
    errors: [
      {
        error:
          'Identifier "owner.ecdsa_signature.all_outputs" refers to a Key, but a private key for "owner" (or an existing signature) was not provided in the compilation data.',
        missingIdentifier: 'owner.ecdsa_signature.all_outputs',
        owningEntity: 'ownerEntityId',
        range: {
          endColumn: 35,
          endLineNumber: 1,
          startColumn: 2,
          startLineNumber: 1,
        },
      },
    ],
    success: false,
  } as BytecodeGenerationResult<AuthenticationProgramStateBch>,
  {
    owner: { type: 'Key' },
  },
);

test(
  '[BCH compiler] Key - schnorr: wrong private key',
  expectCompilationResult,
  '<owner.schnorr_signature.all_outputs>',
  { keys: { privateKeys: { wrong: privateKeyM0 } } },
  {
    errorType: 'resolve',
    errors: [
      {
        error:
          'Identifier "owner.schnorr_signature.all_outputs" refers to a Key, but a private key for "owner" (or an existing signature) was not provided in the compilation data.',
        missingIdentifier: 'owner.schnorr_signature.all_outputs',
        owningEntity: 'ownerEntityId',
        range: {
          endColumn: 37,
          endLineNumber: 1,
          startColumn: 2,
          startLineNumber: 1,
        },
      },
    ],
    success: false,
  } as BytecodeGenerationResult<AuthenticationProgramStateBch>,
  {
    owner: { type: 'Key' },
  },
);

test(
  '[BCH compiler] Key - signature with no "privateKeys"',
  expectCompilationResult,
  '<owner.schnorr_signature.all_outputs>',
  { keys: {} },
  {
    errorType: 'resolve',
    errors: [
      {
        error:
          'Identifier "owner.schnorr_signature.all_outputs" refers to a Key, but a private key for "owner" (or an existing signature) was not provided in the compilation data.',
        missingIdentifier: 'owner.schnorr_signature.all_outputs',
        owningEntity: 'ownerEntityId',
        range: {
          endColumn: 37,
          endLineNumber: 1,
          startColumn: 2,
          startLineNumber: 1,
        },
      },
    ],
    success: false,
  } as BytecodeGenerationResult<AuthenticationProgramStateBch>,
  {
    owner: { type: 'Key' },
  },
);

test(
  '[BCH compiler] Key - ECDSA: unknown signing serialization algorithm',
  expectCompilationResult,
  '<owner.ecdsa_signature.another>',
  { keys: { privateKeys: { owner: privateKeyM0 } } },
  {
    errorType: 'resolve',
    errors: [
      {
        error: 'Unknown signing serialization algorithm, "another".',
        range: {
          endColumn: 31,
          endLineNumber: 1,
          startColumn: 2,
          startLineNumber: 1,
        },
      },
    ],
    success: false,
  } as BytecodeGenerationResult<AuthenticationProgramStateBch>,
  {
    owner: { type: 'Key' },
  },
);

test(
  '[BCH compiler] Key - schnorr: unknown signing serialization algorithm',
  expectCompilationResult,
  '<owner.schnorr_signature.another>',
  { keys: { privateKeys: { owner: privateKeyM0 } } },
  {
    errorType: 'resolve',
    errors: [
      {
        error: 'Unknown signing serialization algorithm, "another".',
        range: {
          endColumn: 33,
          endLineNumber: 1,
          startColumn: 2,
          startLineNumber: 1,
        },
      },
    ],
    success: false,
  } as BytecodeGenerationResult<AuthenticationProgramStateBch>,
  {
    owner: { type: 'Key' },
  },
);

test(
  '[BCH compiler] Key - unrecognized identifier fragment',
  expectCompilationResult,
  '<owner.ecdsa_signature.some.future_operation.with_more_levels>',
  { keys: { privateKeys: { owner: privateKeyM0 } } },
  {
    errorType: 'resolve',
    errors: [
      {
        error:
          'Unknown component in "owner.ecdsa_signature.some.future_operation.with_more_levels" - the fragment "future_operation" is not recognized.',
        range: {
          endColumn: 62,
          endLineNumber: 1,
          startColumn: 2,
          startLineNumber: 1,
        },
      },
    ],
    success: false,
  } as BytecodeGenerationResult<AuthenticationProgramStateBch>,
  {
    owner: { type: 'Key' },
  },
);

test(
  '[BCH compiler] Key - ECDSA: no secp256k1',
  expectCompilationResult,
  '<owner.ecdsa_signature.all_outputs>',
  { keys: { privateKeys: { owner: privateKeyM0 } } },
  {
    errorType: 'resolve',
    errors: [
      {
        error:
          'Cannot resolve "owner.ecdsa_signature.all_outputs" - the "secp256k1" property was not provided in the compiler configuration.',
        range: {
          endColumn: 35,
          endLineNumber: 1,
          startColumn: 2,
          startLineNumber: 1,
        },
      },
    ],
    success: false,
  } as BytecodeGenerationResult<AuthenticationProgramStateBch>,
  {
    owner: { type: 'Key' },
  },
  { secp256k1: undefined },
);

test(
  '[BCH compiler] Key - schnorr: no secp256k1',
  expectCompilationResult,
  '<owner.schnorr_signature.all_outputs>',
  { keys: { privateKeys: { owner: privateKeyM0 } } },
  {
    errorType: 'resolve',
    errors: [
      {
        error:
          'Cannot resolve "owner.schnorr_signature.all_outputs" - the "secp256k1" property was not provided in the compiler configuration.',
        range: {
          endColumn: 37,
          endLineNumber: 1,
          startColumn: 2,
          startLineNumber: 1,
        },
      },
    ],
    success: false,
  } as BytecodeGenerationResult<AuthenticationProgramStateBch>,
  {
    owner: { type: 'Key' },
  },
  { secp256k1: undefined },
);

test(
  '[BCH compiler] Key - ECDSA: no sha256',
  expectCompilationResult,
  '<owner.ecdsa_signature.all_outputs>',
  { keys: { privateKeys: { owner: privateKeyM0 } } },
  {
    errorType: 'resolve',
    errors: [
      {
        error:
          'Cannot resolve "owner.ecdsa_signature.all_outputs" - the "sha256" property was not provided in the compiler configuration.',
        range: {
          endColumn: 35,
          endLineNumber: 1,
          startColumn: 2,
          startLineNumber: 1,
        },
      },
    ],
    success: false,
  } as BytecodeGenerationResult<AuthenticationProgramStateBch>,
  {
    owner: { type: 'Key' },
  },
  { sha256: undefined },
);

test(
  '[BCH compiler] Key - schnorr: no sha256',
  expectCompilationResult,
  '<owner.schnorr_signature.all_outputs>',
  { keys: { privateKeys: { owner: privateKeyM0 } } },
  {
    errorType: 'resolve',
    errors: [
      {
        error:
          'Cannot resolve "owner.schnorr_signature.all_outputs" - the "sha256" property was not provided in the compiler configuration.',
        range: {
          endColumn: 37,
          endLineNumber: 1,
          startColumn: 2,
          startLineNumber: 1,
        },
      },
    ],
    success: false,
  } as BytecodeGenerationResult<AuthenticationProgramStateBch>,
  {
    owner: { type: 'Key' },
  },
  { sha256: undefined },
);

test(
  '[BCH compiler] Key - error in coveredBytecode compilation',
  expectCompilationResult,
  '',
  { keys: { privateKeys: { owner: privateKeyM0 } } },
  {
    errorType: 'resolve',
    errors: [
      {
        error:
          'Compilation error in resolved script "lock": [1, 1] Unknown identifier "invalid".',
        range: {
          endColumn: 35,
          endLineNumber: 1,
          startColumn: 2,
          startLineNumber: 1,
        },
      },
    ],
    success: false,
  } as BytecodeGenerationResult<AuthenticationProgramStateBch>,
  {
    owner: { type: 'Key' },
  },
  {
    scripts: {
      lock: 'invalid',
      test: '<owner.ecdsa_signature.all_outputs>',
    },
  },
);
