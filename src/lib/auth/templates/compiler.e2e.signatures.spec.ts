/* eslint-disable functional/no-expression-statement */
import test from 'ava';

import {
  AuthenticationProgramStateBCH,
  BytecodeGenerationResult,
  hexToBin,
} from '../../lib';

import { expectCompilationResult, privkey } from './compiler.e2e.spec.helper';

test(
  '[BCH compiler] signatures – ECDSA: use a private key',
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
  '[BCH compiler] signatures – schnorr: use a private key',
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
  '[BCH compiler] signatures – derive a public key from a private key',
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
  '[BCH compiler] signatures – derive a public key: no secp256k1',
  expectCompilationResult,
  '<owner.public_key>',
  { keys: { privateKeys: { owner: privkey } } },
  {
    errorType: 'resolve',
    errors: [
      {
        error: 'Secp256k1 is required, but no implementation was provided.',
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
  '[BCH compiler] signatures – use a provided public key',
  expectCompilationResult,
  '<owner.public_key>',
  {
    keys: {
      publicKeys: {
        owner: hexToBin(
          '0376ea9e36a75d2ecf9c93a0be76885e36f822529db22acfdc761c9b5b4544f5c5'
        ),
      },
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
  }
);

test(
  '[BCH compiler] signatures – ECDSA: use a provided signature',
  expectCompilationResult,
  '<owner.signature.all_outputs>',
  {
    keys: {
      signatures: {
        'owner.signature.all_outputs': hexToBin(
          '3044022059e9ad8fabd511fa2ef6935dae6395d5d3ce93b929436c835c9c8372b353bd3d0220527c17e2e4ec12f7b8969a9bb80e58ab1a24e44c2e5512916d1bcb3fc4dc2f2241'
        ),
      },
    },
  },
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
  '[BCH compiler] signatures – schnorr: use a provided signature',
  expectCompilationResult,
  '<owner.schnorr_signature.all_outputs>',
  {
    keys: {
      signatures: {
        'owner.schnorr_signature.all_outputs': hexToBin(
          '313d8a853bd82f5fe251d6b04581333800001ee7680c5e4775db3afabf4873360b3481802d8d656cc608e4625d6568bf1a8801bb1efff19a8306267681177aed41'
        ),
      },
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
  '[BCH compiler] signatures – malformed identifier',
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
  '[BCH compiler] signatures – ECDSA: wrong private key',
  expectCompilationResult,
  '<owner.signature.all_outputs>',
  { keys: { privateKeys: { wrong: privkey } } },
  {
    errorType: 'resolve',
    errors: [
      {
        error:
          'Identifier "owner.signature.all_outputs" refers to a signature, but no matching signatures or private keys for "owner" were provided in the compilation data.',
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
  '[BCH compiler] signatures – schnorr: wrong private key',
  expectCompilationResult,
  '<owner.schnorr_signature.all_outputs>',
  { keys: { privateKeys: { wrong: privkey } } },
  {
    errorType: 'resolve',
    errors: [
      {
        error:
          'Identifier "owner.schnorr_signature.all_outputs" refers to a signature, but no matching signatures or private keys for "owner" were provided in the compilation data.',
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
  '[BCH compiler] signatures – ECDSA: unknown signing serialization algorithm',
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
  '[BCH compiler] signatures – schnorr: unknown signing serialization algorithm',
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
  '[BCH compiler] signatures – ECDSA: no secp256k1',
  expectCompilationResult,
  '<owner.signature.all_outputs>',
  { keys: { privateKeys: { owner: privkey } } },
  {
    errorType: 'resolve',
    errors: [
      {
        error: 'Secp256k1 is required, but no implementation was provided.',
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
  '[BCH compiler] signatures – schnorr: no secp256k1',
  expectCompilationResult,
  '<owner.schnorr_signature.all_outputs>',
  { keys: { privateKeys: { owner: privkey } } },
  {
    errorType: 'resolve',
    errors: [
      {
        error: 'Secp256k1 is required, but no implementation was provided.',
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
  '[BCH compiler] signatures – ECDSA: no sha256',
  expectCompilationResult,
  '<owner.signature.all_outputs>',
  { keys: { privateKeys: { owner: privkey } } },
  {
    errorType: 'resolve',
    errors: [
      {
        error: 'Sha256 is required, but no implementation was provided.',
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
  '[BCH compiler] signatures – schnorr: no sha256',
  expectCompilationResult,
  '<owner.schnorr_signature.all_outputs>',
  { keys: { privateKeys: { owner: privkey } } },
  {
    errorType: 'resolve',
    errors: [
      {
        error: 'Sha256 is required, but no implementation was provided.',
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
