/* eslint-disable functional/no-expression-statement, @typescript-eslint/naming-convention */
import test from 'ava';

import {
  AuthenticationProgramStateBCH,
  BytecodeGenerationResult,
  hexToBin,
} from '../../lib';

import {
  expectCompilationResult,
  privkey,
} from './compiler-bch.e2e.spec.helper';

test(
  '[BCH compiler] Key – ECDSA: use a private key',
  expectCompilationResult,
  '<owner.signature.all_outputs>',
  { keys: { privateKeys: { owner: privkey } } },
  {
    bytecode: hexToBin(
      '473044022059e9ad8fabd511fa2ef6935dae6395d5d3ce93b929436c835c9c8372b353bd3d0220527c17e2e4ec12f7b8969a9bb80e58ab1a24e44c2e5512916d1bcb3fc4dc2f2241'
    ),
    success: true,
  },
  {
    owner: { type: 'Key' },
  }
);

test(
  '[BCH compiler] Key – schnorr: use a private key',
  expectCompilationResult,
  '<owner.schnorr_signature.all_outputs>',
  { keys: { privateKeys: { owner: privkey } } },
  {
    bytecode: hexToBin(
      '41313d8a853bd82f5fe251d6b04581333800001ee7680c5e4775db3afabf4873360b3481802d8d656cc608e4625d6568bf1a8801bb1efff19a8306267681177aed41'
    ),
    success: true,
  },
  {
    owner: { type: 'Key' },
  }
);

test(
  '[BCH compiler] Key – derive a public key from a private key',
  expectCompilationResult,
  '<owner.public_key>',
  { keys: { privateKeys: { owner: privkey } } },
  {
    bytecode: hexToBin(
      '210376ea9e36a75d2ecf9c93a0be76885e36f822529db22acfdc761c9b5b4544f5c5'
    ),
    success: true,
  },
  {
    owner: { type: 'Key' },
  }
);

test(
  '[BCH compiler] Key – derive a public key: no secp256k1',
  expectCompilationResult,
  '<owner.public_key>',
  { keys: { privateKeys: { owner: privkey } } },
  {
    errorType: 'resolve',
    errors: [
      {
        error:
          'Cannot resolve "owner.public_key" – the "secp256k1" property was not provided in the compilation environment.',
        range: {
          endColumn: 18,
          endLineNumber: 1,
          startColumn: 2,
          startLineNumber: 1,
        },
      },
    ],
    success: false,
  } as BytecodeGenerationResult<AuthenticationProgramStateBCH>,
  {
    owner: { type: 'Key' },
  },
  { secp256k1: undefined }
);

test(
  '[BCH compiler] Key – use a provided public key (without secp256k1)',
  expectCompilationResult,
  '<owner.public_key>',
  {
    bytecode: {
      'owner.public_key': hexToBin(
        '0376ea9e36a75d2ecf9c93a0be76885e36f822529db22acfdc761c9b5b4544f5c5'
      ),
    },
  },
  {
    bytecode: hexToBin(
      '210376ea9e36a75d2ecf9c93a0be76885e36f822529db22acfdc761c9b5b4544f5c5'
    ),
    success: true,
  },
  {
    owner: { type: 'Key' },
  },
  { secp256k1: undefined }
);

test(
  '[BCH compiler] Key – public_key: no matching public or private keys',
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
  } as BytecodeGenerationResult<AuthenticationProgramStateBCH>,
  {
    owner: { type: 'Key' },
  }
);

test(
  '[BCH compiler] Key – ECDSA: use a provided signature (without secp256k1)',
  expectCompilationResult,
  '<owner.signature.all_outputs>',
  {
    bytecode: {
      'owner.signature.all_outputs': hexToBin(
        '3044022059e9ad8fabd511fa2ef6935dae6395d5d3ce93b929436c835c9c8372b353bd3d0220527c17e2e4ec12f7b8969a9bb80e58ab1a24e44c2e5512916d1bcb3fc4dc2f2241'
      ),
    },
    keys: {},
  },
  {
    bytecode: hexToBin(
      '473044022059e9ad8fabd511fa2ef6935dae6395d5d3ce93b929436c835c9c8372b353bd3d0220527c17e2e4ec12f7b8969a9bb80e58ab1a24e44c2e5512916d1bcb3fc4dc2f2241'
    ),
    success: true,
  },
  {
    owner: { type: 'Key' },
  },
  { secp256k1: undefined }
);

test(
  '[BCH compiler] Key – schnorr: use a provided signature',
  expectCompilationResult,
  '<owner.schnorr_signature.all_outputs>',
  {
    bytecode: {
      'owner.schnorr_signature.all_outputs': hexToBin(
        '313d8a853bd82f5fe251d6b04581333800001ee7680c5e4775db3afabf4873360b3481802d8d656cc608e4625d6568bf1a8801bb1efff19a8306267681177aed41'
      ),
    },
  },
  {
    bytecode: hexToBin(
      '41313d8a853bd82f5fe251d6b04581333800001ee7680c5e4775db3afabf4873360b3481802d8d656cc608e4625d6568bf1a8801bb1efff19a8306267681177aed41'
    ),
    success: true,
  },
  {
    owner: { type: 'Key' },
  }
);

test(
  '[BCH compiler] Key – malformed identifier',
  expectCompilationResult,
  '<owner.signature>',
  { keys: { privateKeys: { owner: privkey } } },
  {
    errorType: 'resolve',
    errors: [
      {
        error:
          'Invalid signature identifier. Signatures must be of the form: "[variable_id].signature.[signing_serialization_type]".',
        range: {
          endColumn: 17,
          endLineNumber: 1,
          startColumn: 2,
          startLineNumber: 1,
        },
      },
    ],
    success: false,
  } as BytecodeGenerationResult<AuthenticationProgramStateBCH>,
  {
    owner: { type: 'Key' },
  }
);

test(
  '[BCH compiler] Key – ECDSA: wrong private key',
  expectCompilationResult,
  '<owner.signature.all_outputs>',
  { keys: { privateKeys: { wrong: privkey } } },
  {
    errorType: 'resolve',
    errors: [
      {
        error:
          'Identifier "owner.signature.all_outputs" refers to a Key, but a private key for "owner" (or an existing signature) was not provided in the compilation data.',
        missingIdentifier: 'owner.signature.all_outputs',
        owningEntity: 'ownerEntityId',
        range: {
          endColumn: 29,
          endLineNumber: 1,
          startColumn: 2,
          startLineNumber: 1,
        },
      },
    ],
    success: false,
  } as BytecodeGenerationResult<AuthenticationProgramStateBCH>,
  {
    owner: { type: 'Key' },
  }
);

test(
  '[BCH compiler] Key – schnorr: wrong private key',
  expectCompilationResult,
  '<owner.schnorr_signature.all_outputs>',
  { keys: { privateKeys: { wrong: privkey } } },
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
  } as BytecodeGenerationResult<AuthenticationProgramStateBCH>,
  {
    owner: { type: 'Key' },
  }
);

test(
  '[BCH compiler] Key – signature with no "privateKeys"',
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
  } as BytecodeGenerationResult<AuthenticationProgramStateBCH>,
  {
    owner: { type: 'Key' },
  }
);

test(
  '[BCH compiler] Key – ECDSA: unknown signing serialization algorithm',
  expectCompilationResult,
  '<owner.signature.another>',
  { keys: { privateKeys: { owner: privkey } } },
  {
    errorType: 'resolve',
    errors: [
      {
        error: 'Unknown signing serialization algorithm, "another".',
        range: {
          endColumn: 25,
          endLineNumber: 1,
          startColumn: 2,
          startLineNumber: 1,
        },
      },
    ],
    success: false,
  } as BytecodeGenerationResult<AuthenticationProgramStateBCH>,
  {
    owner: { type: 'Key' },
  }
);

test(
  '[BCH compiler] Key – schnorr: unknown signing serialization algorithm',
  expectCompilationResult,
  '<owner.schnorr_signature.another>',
  { keys: { privateKeys: { owner: privkey } } },
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
  } as BytecodeGenerationResult<AuthenticationProgramStateBCH>,
  {
    owner: { type: 'Key' },
  }
);

test(
  '[BCH compiler] Key – unrecognized identifier fragment',
  expectCompilationResult,
  '<owner.signature.some.future_operation.with_more_levels>',
  { keys: { privateKeys: { owner: privkey } } },
  {
    errorType: 'resolve',
    errors: [
      {
        error:
          'Unknown component in "owner.signature.some.future_operation.with_more_levels" – the fragment "future_operation" is not recognized.',
        range: {
          endColumn: 56,
          endLineNumber: 1,
          startColumn: 2,
          startLineNumber: 1,
        },
      },
    ],
    success: false,
  } as BytecodeGenerationResult<AuthenticationProgramStateBCH>,
  {
    owner: { type: 'Key' },
  }
);

test(
  '[BCH compiler] Key – ECDSA: no secp256k1',
  expectCompilationResult,
  '<owner.signature.all_outputs>',
  { keys: { privateKeys: { owner: privkey } } },
  {
    errorType: 'resolve',
    errors: [
      {
        error:
          'Cannot resolve "owner.signature.all_outputs" – the "secp256k1" property was not provided in the compilation environment.',
        range: {
          endColumn: 29,
          endLineNumber: 1,
          startColumn: 2,
          startLineNumber: 1,
        },
      },
    ],
    success: false,
  } as BytecodeGenerationResult<AuthenticationProgramStateBCH>,
  {
    owner: { type: 'Key' },
  },
  { secp256k1: undefined }
);

test(
  '[BCH compiler] Key – schnorr: no secp256k1',
  expectCompilationResult,
  '<owner.schnorr_signature.all_outputs>',
  { keys: { privateKeys: { owner: privkey } } },
  {
    errorType: 'resolve',
    errors: [
      {
        error:
          'Cannot resolve "owner.schnorr_signature.all_outputs" – the "secp256k1" property was not provided in the compilation environment.',
        range: {
          endColumn: 37,
          endLineNumber: 1,
          startColumn: 2,
          startLineNumber: 1,
        },
      },
    ],
    success: false,
  } as BytecodeGenerationResult<AuthenticationProgramStateBCH>,
  {
    owner: { type: 'Key' },
  },
  { secp256k1: undefined }
);

test(
  '[BCH compiler] Key – ECDSA: no sha256',
  expectCompilationResult,
  '<owner.signature.all_outputs>',
  { keys: { privateKeys: { owner: privkey } } },
  {
    errorType: 'resolve',
    errors: [
      {
        error:
          'Cannot resolve "owner.signature.all_outputs" – the "sha256" property was not provided in the compilation environment.',
        range: {
          endColumn: 29,
          endLineNumber: 1,
          startColumn: 2,
          startLineNumber: 1,
        },
      },
    ],
    success: false,
  } as BytecodeGenerationResult<AuthenticationProgramStateBCH>,
  {
    owner: { type: 'Key' },
  },
  { sha256: undefined }
);

test(
  '[BCH compiler] Key – schnorr: no sha256',
  expectCompilationResult,
  '<owner.schnorr_signature.all_outputs>',
  { keys: { privateKeys: { owner: privkey } } },
  {
    errorType: 'resolve',
    errors: [
      {
        error:
          'Cannot resolve "owner.schnorr_signature.all_outputs" – the "sha256" property was not provided in the compilation environment.',
        range: {
          endColumn: 37,
          endLineNumber: 1,
          startColumn: 2,
          startLineNumber: 1,
        },
      },
    ],
    success: false,
  } as BytecodeGenerationResult<AuthenticationProgramStateBCH>,
  {
    owner: { type: 'Key' },
  },
  { sha256: undefined }
);

test(
  '[BCH compiler] Key – error in coveredBytecode compilation',
  expectCompilationResult,
  '',
  { keys: { privateKeys: { owner: privkey } } },
  {
    errorType: 'resolve',
    errors: [
      {
        error:
          'Compilation error in resolved script "lock": [1, 1] Unknown identifier "invalid".',
        range: {
          endColumn: 29,
          endLineNumber: 1,
          startColumn: 2,
          startLineNumber: 1,
        },
      },
    ],
    success: false,
  } as BytecodeGenerationResult<AuthenticationProgramStateBCH>,
  {
    owner: { type: 'Key' },
  },
  {
    scripts: {
      lock: 'invalid',
      test: '<owner.signature.all_outputs>',
    },
  }
);
