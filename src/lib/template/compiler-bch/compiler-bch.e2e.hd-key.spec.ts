/* eslint-disable functional/no-expression-statement, @typescript-eslint/naming-convention */
import test from 'ava';

import {
  AuthenticationProgramStateBCH,
  BytecodeGenerationResult,
  hexToBin,
} from '../../lib';

import {
  expectCompilationResult,
  hdPrivateKey,
  hdPublicKey,
} from './compiler-bch.e2e.spec.helper';

/**
 * `m/0` public key push
 */
const m0PublicPush = hexToBin(
  '210376ea9e36a75d2ecf9c93a0be76885e36f822529db22acfdc761c9b5b4544f5c5'
);
/**
 * `m/0/0` public key push
 */
const m00PublicPush = hexToBin(
  '2102df61d0e0ca2d1f02670cd94941d1f3299e10a01f0cc008b695e73006e4b28bfc'
);
/**
 * `m/0'` HD public key
 */
const m0HardenedHdPublicKeyTestnet =
  'tpubD8j9goBmftKU5otNLACVivEM1gEn41NQ4ikvEAH6nnuXdz4s3apUauUNsL6rFhPKXV2Ft2EDBNjRio1Y5BAnJJpq3GtRp3vVzWH9mDRF7ac';

/**
 * `m/0'/1` public key push
 */
const m0H1PublicPush = hexToBin(
  '21034f4d20bf3a18f6deb0109c20e0ab7328b22ff0d5a29ce85595344012ebca41e6'
);

/**
 * `m/1` public key push
 */
const m1PublicPush = hexToBin(
  '21034002efc4f44014b116a986faa63b741b0b894a45ccf3f30c671e4146fb1c1954'
);

test(
  '[BCH compiler] HdKey – ECDSA: use an HD private key, addressIndex (`0`)',
  expectCompilationResult,
  '<owner.signature.all_outputs>',
  {
    hdKeys: { addressIndex: 0, hdPrivateKeys: { ownerEntityId: hdPrivateKey } },
  },
  {
    bytecode: hexToBin(
      '473044022059e9ad8fabd511fa2ef6935dae6395d5d3ce93b929436c835c9c8372b353bd3d0220527c17e2e4ec12f7b8969a9bb80e58ab1a24e44c2e5512916d1bcb3fc4dc2f2241'
    ),
    success: true,
  },
  { owner: { type: 'HdKey' } }
);

test(
  '[BCH compiler] HdKey – schnorr: use a private key',
  expectCompilationResult,
  '<owner.schnorr_signature.all_outputs>',
  {
    hdKeys: { addressIndex: 0, hdPrivateKeys: { ownerEntityId: hdPrivateKey } },
  },
  {
    bytecode: hexToBin(
      '41313d8a853bd82f5fe251d6b04581333800001ee7680c5e4775db3afabf4873360b3481802d8d656cc608e4625d6568bf1a8801bb1efff19a8306267681177aed41'
    ),
    success: true,
  },
  { owner: { type: 'HdKey' } }
);

test(
  '[BCH compiler] HdKey – schnorr: use a private key (no address index)',
  expectCompilationResult,
  '<owner.schnorr_signature.all_outputs>',
  { hdKeys: { hdPrivateKeys: { ownerEntityId: hdPrivateKey } } },
  {
    errorType: 'resolve',
    errors: [
      {
        error:
          'Identifier "owner.schnorr_signature.all_outputs" refers to an HdKey, but "hdKeys.addressIndex" was not provided in the compilation data.',
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
  { owner: { type: 'HdKey' } }
);

test(
  '[BCH compiler] HdKey – derive a public key from an HD private key',
  expectCompilationResult,
  '<owner.public_key>',
  {
    hdKeys: { addressIndex: 0, hdPrivateKeys: { ownerEntityId: hdPrivateKey } },
  },
  { bytecode: m0PublicPush, success: true },
  { owner: { type: 'HdKey' } }
);

test(
  '[BCH compiler] HdKey – derive a public key from an HD public key',
  expectCompilationResult,
  '<owner.public_key>',
  {
    hdKeys: { addressIndex: 0, hdPublicKeys: { ownerEntityId: hdPublicKey } },
  },
  { bytecode: m0PublicPush, success: true },
  { owner: { type: 'HdKey' } }
);

test(
  '[BCH compiler] HdKey – derive m/1 from an HD public key with addressIndex of 0, addressOffset of 1',
  expectCompilationResult,
  '<owner.public_key>',
  { hdKeys: { addressIndex: 0, hdPublicKeys: { ownerEntityId: hdPublicKey } } },
  { bytecode: m1PublicPush, success: true },
  { owner: { type: 'HdKey' } },
  { variables: { owner: { addressOffset: 1, type: 'HdKey' } } }
);

test(
  '[BCH compiler] HdKey – derive a public key from an HD private key (no address index)',
  expectCompilationResult,
  '<owner.public_key>',
  { hdKeys: { hdPrivateKeys: { ownerEntityId: hdPrivateKey } } },
  {
    errorType: 'resolve',
    errors: [
      {
        error:
          'Identifier "owner.public_key" refers to an HdKey, but "hdKeys.addressIndex" was not provided in the compilation data.',
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
    owner: { type: 'HdKey' },
  }
);

test(
  '[BCH compiler] HdKey – derive a public key: no secp256k1',
  expectCompilationResult,
  '<owner.public_key>',
  {},
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
  { owner: { type: 'HdKey' } },
  { secp256k1: undefined }
);

test(
  '[BCH compiler] HdKey – use a provided derived public key (without secp256k1)',
  expectCompilationResult,
  '<owner.public_key>',
  {
    bytecode: {
      'owner.public_key': hexToBin(
        '0376ea9e36a75d2ecf9c93a0be76885e36f822529db22acfdc761c9b5b4544f5c5'
      ),
    },
  },
  { bytecode: m0PublicPush, success: true },
  { owner: { type: 'HdKey' } },
  { secp256k1: undefined }
);

test(
  '[BCH compiler] HdKey – ECDSA: use a provided signature',
  expectCompilationResult,
  '<owner.signature.all_outputs>',
  {
    bytecode: {
      'owner.signature.all_outputs': hexToBin(
        '3044022059e9ad8fabd511fa2ef6935dae6395d5d3ce93b929436c835c9c8372b353bd3d0220527c17e2e4ec12f7b8969a9bb80e58ab1a24e44c2e5512916d1bcb3fc4dc2f2241'
      ),
    },
  },
  {
    bytecode: hexToBin(
      '473044022059e9ad8fabd511fa2ef6935dae6395d5d3ce93b929436c835c9c8372b353bd3d0220527c17e2e4ec12f7b8969a9bb80e58ab1a24e44c2e5512916d1bcb3fc4dc2f2241'
    ),
    success: true,
  },
  { owner: { type: 'HdKey' } },
  { secp256k1: undefined }
);

test(
  '[BCH compiler] HdKey – schnorr: use a provided signature',
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
  { owner: { type: 'HdKey' } },
  { secp256k1: undefined }
);

test(
  '[BCH compiler] HdKey – malformed identifier',
  expectCompilationResult,
  '<owner.signature>',
  {
    hdKeys: { addressIndex: 0, hdPrivateKeys: { ownerEntityId: hdPrivateKey } },
  },
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
  { owner: { type: 'HdKey' } }
);

test(
  '[BCH compiler] HdKey – ECDSA: wrong private key',
  expectCompilationResult,
  '<owner.signature.all_outputs>',
  { hdKeys: { addressIndex: 0, hdPrivateKeys: { wrong: hdPrivateKey } } },
  {
    errorType: 'resolve',
    errors: [
      {
        error:
          'Identifier "owner.signature.all_outputs" refers to an HdKey owned by "ownerEntityId", but an HD private key for this entity (or an existing signature) was not provided in the compilation data.',
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
  { owner: { type: 'HdKey' } }
);

test(
  '[BCH compiler] HdKey – schnorr: wrong private key',
  expectCompilationResult,
  '<owner.schnorr_signature.all_outputs>',
  { hdKeys: { addressIndex: 0, hdPrivateKeys: { wrong: hdPrivateKey } } },
  {
    errorType: 'resolve',
    errors: [
      {
        error:
          'Identifier "owner.schnorr_signature.all_outputs" refers to an HdKey owned by "ownerEntityId", but an HD private key for this entity (or an existing signature) was not provided in the compilation data.',
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
  { owner: { type: 'HdKey' } }
);

test(
  '[BCH compiler] HdKey – schnorr: no "hdPrivateKeys"',
  expectCompilationResult,
  '<owner.schnorr_signature.all_outputs>',
  { hdKeys: { addressIndex: 0 } },
  {
    errorType: 'resolve',
    errors: [
      {
        error:
          'Identifier "owner.schnorr_signature.all_outputs" refers to an HdKey owned by "ownerEntityId", but an HD private key for this entity (or an existing signature) was not provided in the compilation data.',
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
  { owner: { type: 'HdKey' } }
);

test(
  '[BCH compiler] HdKey – ECDSA: unknown signing serialization algorithm',
  expectCompilationResult,
  '<owner.signature.another>',
  {
    hdKeys: { addressIndex: 0, hdPrivateKeys: { ownerEntityId: hdPrivateKey } },
  },
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
  { owner: { type: 'HdKey' } }
);

test(
  '[BCH compiler] HdKey – schnorr: unknown signing serialization algorithm',
  expectCompilationResult,
  '<owner.schnorr_signature.another>',
  {
    hdKeys: { addressIndex: 0, hdPrivateKeys: { ownerEntityId: hdPrivateKey } },
  },
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
  { owner: { type: 'HdKey' } }
);

test(
  '[BCH compiler] HdKey – ECDSA: no secp256k1',
  expectCompilationResult,
  '<owner.signature.all_outputs>',
  {
    hdKeys: { addressIndex: 0, hdPrivateKeys: { ownerEntityId: hdPrivateKey } },
  },
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
  { owner: { type: 'HdKey' } },
  { secp256k1: undefined }
);

test(
  '[BCH compiler] HdKey – schnorr: no secp256k1',
  expectCompilationResult,
  '<owner.schnorr_signature.all_outputs>',
  {
    hdKeys: { addressIndex: 0, hdPrivateKeys: { ownerEntityId: hdPrivateKey } },
  },
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
  { owner: { type: 'HdKey' } },
  { secp256k1: undefined }
);

test(
  '[BCH compiler] HdKey – ECDSA: no sha256',
  expectCompilationResult,
  '<owner.signature.all_outputs>',
  {
    hdKeys: { addressIndex: 0, hdPrivateKeys: { ownerEntityId: hdPrivateKey } },
  },
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
  { owner: { type: 'HdKey' } },
  { sha256: undefined }
);

test(
  '[BCH compiler] HdKey – schnorr: no sha256',
  expectCompilationResult,
  '<owner.schnorr_signature.all_outputs>',
  {
    hdKeys: { addressIndex: 0, hdPrivateKeys: { ownerEntityId: hdPrivateKey } },
  },
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
  { owner: { type: 'HdKey' } },
  { sha256: undefined }
);

test(
  '[BCH compiler] HdKey – m/0 via addressIndex of 1, addressOffset of -1',
  expectCompilationResult,
  '<owner.public_key>',
  {
    hdKeys: { addressIndex: 1, hdPrivateKeys: { ownerEntityId: hdPrivateKey } },
  },
  { bytecode: m0PublicPush, success: true },
  { owner: { type: 'HdKey' } },
  { variables: { owner: { addressOffset: -1, type: 'HdKey' } } }
);

test(
  '[BCH compiler] HdKey – m/1 via addressIndex of 1, default addressOffset (0)',
  expectCompilationResult,
  '<owner.public_key>',
  {
    hdKeys: { addressIndex: 1, hdPrivateKeys: { ownerEntityId: hdPrivateKey } },
  },
  { bytecode: m1PublicPush, success: true },
  { owner: { type: 'HdKey' } }
);

test(
  '[BCH compiler] HdKey – m/1 via addressIndex of 0, addressOffset of 1',
  expectCompilationResult,
  '<owner.public_key>',
  {
    hdKeys: { addressIndex: 0, hdPrivateKeys: { ownerEntityId: hdPrivateKey } },
  },
  { bytecode: m1PublicPush, success: true },
  { owner: { type: 'HdKey' } },
  { variables: { owner: { addressOffset: 1, type: 'HdKey' } } }
);

test(
  '[BCH compiler] HdKey – m/1 via addressIndex of 2, addressOffset of -1',
  expectCompilationResult,
  '<owner.public_key>',
  {
    hdKeys: { addressIndex: 2, hdPrivateKeys: { ownerEntityId: hdPrivateKey } },
  },
  { bytecode: m1PublicPush, success: true },
  { owner: { type: 'HdKey' } },
  { variables: { owner: { addressOffset: -1, type: 'HdKey' } } }
);

test(
  '[BCH compiler] HdKey – invalid HD private key',
  expectCompilationResult,
  '<owner.public_key>',
  { hdKeys: { addressIndex: 2, hdPrivateKeys: { ownerEntityId: 'xbad' } } },
  {
    errorType: 'resolve',
    errors: [
      {
        error:
          'Could not generate owner.public_key – the HD private key provided for ownerEntityId could not be decoded: HD key decoding error: length is incorrect (must encode 82 bytes).',
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
  { owner: { type: 'HdKey' } }
);

test(
  '[BCH compiler] HdKey – bad privateDerivationPath',
  expectCompilationResult,
  '<owner.public_key>',
  {
    hdKeys: { addressIndex: 0, hdPrivateKeys: { ownerEntityId: hdPrivateKey } },
  },
  {
    errorType: 'resolve',
    errors: [
      {
        error:
          'Could not generate owner.public_key – the path "m/-1" could not be derived for entity "ownerEntityId": HD key derivation error: invalid derivation path – paths must begin with "m" or "M" and contain only forward slashes ("/"), apostrophes ("\'"), or positive child index numbers.',
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
    owner: { type: 'HdKey' },
  },
  { variables: { owner: { addressOffset: -1, type: 'HdKey' } } }
);

test(
  '[BCH compiler] HdKey – error in coveredBytecode compilation',
  expectCompilationResult,
  '',
  {
    hdKeys: { addressIndex: 0, hdPrivateKeys: { ownerEntityId: hdPrivateKey } },
  },
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
    owner: { type: 'HdKey' },
  },
  {
    scripts: {
      lock: 'invalid',
      test: '<owner.signature.all_outputs>',
    },
  }
);

test(
  '[BCH compiler] HdKey – signature no "entityOwnership"',
  expectCompilationResult,
  '<owner.signature.all_outputs>',
  {
    hdKeys: { addressIndex: 0, hdPrivateKeys: { ownerEntityId: hdPrivateKey } },
  },
  {
    errorType: 'resolve',
    errors: [
      {
        error:
          'Cannot resolve "owner.signature.all_outputs" – the "entityOwnership" property was not provided in the compilation environment.',
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
    owner: { type: 'HdKey' },
  },
  {
    entityOwnership: undefined,
  }
);

test(
  '[BCH compiler] HdKey – signature unknown entity',
  expectCompilationResult,
  '<owner.signature.all_outputs>',
  {
    hdKeys: { addressIndex: 0, hdPrivateKeys: { unknown: hdPrivateKey } },
  },
  {
    errorType: 'resolve',
    errors: [
      {
        error:
          'Identifier "owner.signature.all_outputs" refers to an HdKey, but the "entityOwnership" for "owner" is not available in this compilation environment.',
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
  { owner: { type: 'HdKey' } },
  { entityOwnership: {} }
);

test(
  '[BCH compiler] HdKey – public_key no "entityOwnership"',
  expectCompilationResult,
  '<owner.public_key>',
  {
    hdKeys: { addressIndex: 0, hdPrivateKeys: { ownerEntityId: hdPrivateKey } },
  },
  {
    errorType: 'resolve',
    errors: [
      {
        error:
          'Cannot resolve "owner.public_key" – the "entityOwnership" property was not provided in the compilation environment.',
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
  { owner: { type: 'HdKey' } },
  { entityOwnership: undefined }
);

test(
  '[BCH compiler] HdKey – HD key not included in "entityOwnership"',
  expectCompilationResult,
  '<owner.public_key>',
  {
    hdKeys: { addressIndex: 0, hdPrivateKeys: { ownerEntityId: hdPrivateKey } },
  },
  {
    errorType: 'resolve',
    errors: [
      {
        error:
          'Identifier "owner.public_key" refers to an HdKey, but the "entityOwnership" for "owner" is not available in this compilation environment.',
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
  { owner: { type: 'HdKey' } },
  { entityOwnership: {} }
);

test(
  '[BCH compiler] HdKey – no "hdPrivateKeys"',
  expectCompilationResult,
  '<owner.public_key>',
  { hdKeys: { addressIndex: 0 } },
  {
    errorType: 'resolve',
    errors: [
      {
        error:
          'Identifier "owner.public_key" refers to an HdKey owned by "ownerEntityId", but an HD private key or HD public key for this entity was not provided in the compilation data.',
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
  { owner: { type: 'HdKey' } }
);

test(
  '[BCH compiler] HdKey – invalid HD public key',
  expectCompilationResult,
  '<owner.public_key>',
  { hdKeys: { addressIndex: 2, hdPublicKeys: { ownerEntityId: 'xbad' } } },
  {
    errorType: 'resolve',
    errors: [
      {
        error:
          'Could not generate "owner.public_key" – the HD public key provided for "ownerEntityId" could not be decoded: HD key decoding error: length is incorrect (must encode 82 bytes).',
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
  { owner: { type: 'HdKey' } }
);

test(
  '[BCH compiler] HdKey – public_key at m/0/0 using HD public key',
  expectCompilationResult,
  '<owner.public_key>',
  {
    hdKeys: {
      addressIndex: 0,
      hdPublicKeys: { ownerEntityId: hdPublicKey },
    },
  },
  { bytecode: m00PublicPush, success: true },
  { owner: { type: 'HdKey' } },
  {
    variables: {
      owner: {
        privateDerivationPath: 'm/0/i',
        type: 'HdKey',
      },
    },
  }
);

test(
  "[BCH compiler] HdKey – attempt public_key at m/0'/1 using HD public key",
  expectCompilationResult,
  '<owner.public_key>',
  {
    hdKeys: {
      addressIndex: 0,
      hdPublicKeys: { ownerEntityId: hdPublicKey },
    },
  },
  {
    errorType: 'resolve',
    errors: [
      {
        error:
          'Could not generate owner.public_key – the path "M/0\'/i" is not a valid "publicDerivationPath".',
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
  { owner: { type: 'HdKey' } },
  {
    variables: {
      owner: {
        privateDerivationPath: "m/0'/i",
        type: 'HdKey',
      },
    },
  }
);

test(
  '[BCH compiler] HdKey – public_key derivation failure using HD public key',
  expectCompilationResult,
  '<owner.public_key>',
  {
    hdKeys: {
      addressIndex: 0,
      hdPublicKeys: { ownerEntityId: hdPublicKey },
    },
  },
  {
    errorType: 'resolve',
    errors: [
      {
        error:
          'Could not generate "owner.public_key" – the path "M/2147483649/0" could not be derived for entity "ownerEntityId": HD key derivation error: derivation for hardened child indexes (indexes greater than or equal to 2147483648) requires an HD private node.',
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
  { owner: { type: 'HdKey' } },
  {
    variables: {
      owner: {
        publicDerivationPath: 'M/2147483649/i',
        type: 'HdKey',
      },
    },
  }
);

test(
  '[BCH compiler] HdKey – attempt public_key at invalid path using HD private key',
  expectCompilationResult,
  '<owner.public_key>',
  {
    hdKeys: {
      addressIndex: 0,
      hdPrivateKeys: { ownerEntityId: hdPrivateKey },
    },
  },
  {
    errorType: 'resolve',
    errors: [
      {
        error:
          'Could not generate owner.public_key – the path "bad/i" is not a valid "privateDerivationPath".',
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
  { owner: { type: 'HdKey' } },
  {
    variables: {
      owner: {
        privateDerivationPath: 'bad/i',
        type: 'HdKey',
      },
    },
  }
);

test(
  "[BCH compiler] HdKey – public_key at m/0'/1 using HD private key",
  expectCompilationResult,
  '<owner.public_key>',
  {
    hdKeys: {
      addressIndex: 1,
      hdPrivateKeys: { ownerEntityId: hdPrivateKey },
    },
  },
  { bytecode: m0H1PublicPush, success: true },
  { owner: { type: 'HdKey' } },
  {
    variables: {
      owner: {
        privateDerivationPath: "m/0'/i",
        type: 'HdKey',
      },
    },
  }
);

test(
  "[BCH compiler] HdKey – public_key at m/0'/1 using custom publicDerivationPath (and testnet HD public key)",
  expectCompilationResult,
  '<owner.public_key>',
  {
    hdKeys: {
      addressIndex: 1,
      hdPublicKeys: { ownerEntityId: m0HardenedHdPublicKeyTestnet },
    },
  },
  { bytecode: m0H1PublicPush, success: true },
  { owner: { type: 'HdKey' } },
  {
    variables: {
      owner: {
        hdPublicKeyDerivationPath: "m/0'",
        publicDerivationPath: 'M/i',
        type: 'HdKey',
      },
    },
  }
);
