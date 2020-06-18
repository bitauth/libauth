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
  privkey,
} from './compiler-bch.e2e.spec.helper';

test(
  '[BCH compiler] data signatures – use a private key',
  expectCompilationResult,
  '<owner.data_signature.another> <another>',
  { keys: { privateKeys: { owner: privkey } } },
  {
    bytecode: hexToBin(
      '463044022100de1a02c286421ca34e854b9a01449ff8f19c46dfa4397de563d5f694db9d3855021f55b7bf7cd14189f6e1dca08d9a7cdf9b5c38a5bddbd0168aa33d34666950a003abcdef'
    ),
    success: true,
  },
  { owner: { type: 'Key' } }
);

test(
  '[BCH compiler] data signatures – use a provided signature',
  expectCompilationResult,
  '<owner.data_signature.another> <another>',
  {
    bytecode: {
      'owner.data_signature.another': hexToBin(
        '3044022100de1a02c286421ca34e854b9a01449ff8f19c46dfa4397de563d5f694db9d3855021f55b7bf7cd14189f6e1dca08d9a7cdf9b5c38a5bddbd0168aa33d34666950a0'
      ),
    },
  },
  {
    bytecode: hexToBin(
      '463044022100de1a02c286421ca34e854b9a01449ff8f19c46dfa4397de563d5f694db9d3855021f55b7bf7cd14189f6e1dca08d9a7cdf9b5c38a5bddbd0168aa33d34666950a003abcdef'
    ),
    success: true,
  },
  { owner: { type: 'Key' } }
);

test(
  '[BCH compiler] data signatures – require a script ID',
  expectCompilationResult,
  '<owner.data_signature>',
  { keys: { privateKeys: { owner: privkey } } },
  {
    errorType: 'resolve',
    errors: [
      {
        error:
          'Invalid data signature identifier. Data signatures must be of the form: "[variable_id].data_signature.[target_script_id]".',
        range: {
          endColumn: 22,
          endLineNumber: 1,
          startColumn: 2,
          startLineNumber: 1,
        },
      },
    ],
    success: false,
  } as BytecodeGenerationResult<AuthenticationProgramStateBCH>,
  { owner: { type: 'Key' } }
);

test(
  '[BCH compiler] data signatures – error on unknown script ID',
  expectCompilationResult,
  '<owner.data_signature.wrong>',
  { keys: { privateKeys: { owner: privkey } } },
  {
    errorType: 'resolve',
    errors: [
      {
        error:
          'Data signature tried to sign an unknown target script, "wrong".',
        range: {
          endColumn: 28,
          endLineNumber: 1,
          startColumn: 2,
          startLineNumber: 1,
        },
      },
    ],
    success: false,
  } as BytecodeGenerationResult<AuthenticationProgramStateBCH>,
  { owner: { type: 'Key' } }
);

test(
  '[BCH compiler] data signatures – error on script ID of broken script',
  expectCompilationResult,
  '<owner.data_signature.broken>',
  { keys: { privateKeys: { owner: privkey } } },
  {
    errorType: 'resolve',
    errors: [
      {
        error:
          'Compilation error in resolved script "broken": [1, 1] Unknown identifier "does_not_exist".',
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
  { owner: { type: 'Key' } }
);

test(
  '[BCH compiler] data signatures – no private keys',
  expectCompilationResult,
  '<owner.data_signature.another> <another>',
  { keys: {} },
  {
    errorType: 'resolve',
    errors: [
      {
        error:
          'Identifier "owner.data_signature.another" refers to a Key, but a private key for "owner" (or an existing signature) was not provided in the compilation data.',
        missingIdentifier: 'owner.data_signature.another',
        owningEntity: 'ownerEntityId',
        range: {
          endColumn: 30,
          endLineNumber: 1,
          startColumn: 2,
          startLineNumber: 1,
        },
      },
    ],
    success: false,
  } as BytecodeGenerationResult<AuthenticationProgramStateBCH>,
  { owner: { type: 'Key' } }
);

test(
  '[BCH compiler] data signatures – necessary private key not provided',
  expectCompilationResult,
  '<owner.data_signature.another> <another>',
  { keys: { privateKeys: { wrong: privkey } } },
  {
    errorType: 'resolve',
    errors: [
      {
        error:
          'Cannot resolve "owner.data_signature.another" – the "secp256k1" property was not provided in the compilation environment.',
        range: {
          endColumn: 30,
          endLineNumber: 1,
          startColumn: 2,
          startLineNumber: 1,
        },
      },
    ],
    success: false,
  } as BytecodeGenerationResult<AuthenticationProgramStateBCH>,
  { owner: { type: 'Key' } },
  { secp256k1: undefined }
);

test(
  '[BCH compiler] data signatures – no secp256k1',
  expectCompilationResult,
  '<owner.data_signature.another> <another>',
  { keys: { privateKeys: { owner: privkey } } },
  {
    errorType: 'resolve',
    errors: [
      {
        error:
          'Cannot resolve "owner.data_signature.another" – the "secp256k1" property was not provided in the compilation environment.',
        range: {
          endColumn: 30,
          endLineNumber: 1,
          startColumn: 2,
          startLineNumber: 1,
        },
      },
    ],
    success: false,
  } as BytecodeGenerationResult<AuthenticationProgramStateBCH>,
  { owner: { type: 'Key' } },
  { secp256k1: undefined }
);

test(
  '[BCH compiler] data signatures – no sha256',
  expectCompilationResult,
  '<owner.data_signature.another> <another>',
  { keys: { privateKeys: { owner: privkey } } },
  {
    errorType: 'resolve',
    errors: [
      {
        error:
          'Cannot resolve "owner.data_signature.another" – the "sha256" property was not provided in the compilation environment.',
        range: {
          endColumn: 30,
          endLineNumber: 1,
          startColumn: 2,
          startLineNumber: 1,
        },
      },
    ],
    success: false,
  } as BytecodeGenerationResult<AuthenticationProgramStateBCH>,
  { owner: { type: 'Key' } },
  { sha256: undefined }
);

test(
  '[BCH compiler] data signatures – unrecognized identifier fragment',
  expectCompilationResult,
  '<owner.data_signature.some.future_operation.with_more_levels>',
  { keys: { privateKeys: { owner: privkey } } },
  {
    errorType: 'resolve',
    errors: [
      {
        error:
          'Unknown component in "owner.data_signature.some.future_operation.with_more_levels" – the fragment "future_operation" is not recognized.',
        range: {
          endColumn: 61,
          endLineNumber: 1,
          startColumn: 2,
          startLineNumber: 1,
        },
      },
    ],
    success: false,
  } as BytecodeGenerationResult<AuthenticationProgramStateBCH>,
  { owner: { type: 'Key' } }
);

test(
  '[BCH compiler] data signatures – use an HD private key',
  expectCompilationResult,
  '<owner.data_signature.another> <another>',
  {
    hdKeys: { addressIndex: 0, hdPrivateKeys: { ownerEntityId: hdPrivateKey } },
  },
  {
    bytecode: hexToBin(
      '463044022100de1a02c286421ca34e854b9a01449ff8f19c46dfa4397de563d5f694db9d3855021f55b7bf7cd14189f6e1dca08d9a7cdf9b5c38a5bddbd0168aa33d34666950a003abcdef'
    ),
    success: true,
  },
  { owner: { type: 'HdKey' } }
);

test(
  '[BCH compiler] data signatures – HD private key derivation error',
  expectCompilationResult,
  '<owner.data_signature.another> <another>',
  { hdKeys: { addressIndex: 0, hdPrivateKeys: { ownerEntityId: 'xbad' } } },
  {
    errorType: 'resolve',
    errors: [
      {
        error:
          'Could not generate owner.data_signature.another – the HD private key provided for ownerEntityId could not be decoded: HD key decoding error: length is incorrect (must encode 82 bytes).',
        range: {
          endColumn: 30,
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
