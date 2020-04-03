/* eslint-disable functional/no-expression-statement */
import test from 'ava';

import {
  AuthenticationProgramStateBCH,
  BytecodeGenerationResult,
  hexToBin,
} from '../../lib';

import { expectCompilationResult, privkey } from './compiler.e2e.spec.helper';

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
  {
    owner: { type: 'Key' },
  }
);

test(
  '[BCH compiler] data signatures – use a provided signature',
  expectCompilationResult,
  '<owner.data_signature.another> <another>',
  {
    keys: {
      signatures: {
        'owner.data_signature.another': hexToBin(
          '3044022100de1a02c286421ca34e854b9a01449ff8f19c46dfa4397de563d5f694db9d3855021f55b7bf7cd14189f6e1dca08d9a7cdf9b5c38a5bddbd0168aa33d34666950a0'
        ),
      },
    },
  },
  {
    bytecode: hexToBin(
      '463044022100de1a02c286421ca34e854b9a01449ff8f19c46dfa4397de563d5f694db9d3855021f55b7bf7cd14189f6e1dca08d9a7cdf9b5c38a5bddbd0168aa33d34666950a003abcdef'
    ),
    success: true,
  },
  {
    owner: { type: 'Key' },
  }
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
  {
    owner: { type: 'Key' },
  }
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
  {
    owner: { type: 'Key' },
  }
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
          'Compilation error in resolved script, "broken": Unknown identifier \'does_not_exist\'. [1, 1]',
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
  '[BCH compiler] data signatures – no private keys',
  expectCompilationResult,
  '<owner.data_signature.another> <another>',
  { keys: {} },
  {
    errorType: 'resolve',
    errors: [
      {
        error:
          'Identifier "owner.data_signature.another" refers to a data signature, but no matching signatures or private keys for "owner" were provided in the compilation data.',
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
  {
    owner: { type: 'Key' },
  },
  { secp256k1: undefined }
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
          'Identifier "owner.data_signature.another" refers to a data signature, but no matching signatures or private keys for "owner" were provided in the compilation data.',
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
  {
    owner: { type: 'Key' },
  },
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
        error: 'Secp256k1 is required, but no implementation was provided.',
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
  {
    owner: { type: 'Key' },
  },
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
        error: 'Sha256 is required, but no implementation was provided.',
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
  {
    owner: { type: 'Key' },
  },
  { sha256: undefined }
);
