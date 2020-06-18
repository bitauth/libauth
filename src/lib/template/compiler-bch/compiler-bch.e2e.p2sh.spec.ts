/* eslint-disable functional/no-expression-statement */
import test from 'ava';

import {
  AuthenticationProgramStateBCH,
  BytecodeGenerationResult,
  hexToBin,
} from '../../lib';

import { expectCompilationResult } from './compiler-bch.e2e.spec.helper';

test(
  '[BCH compiler] transformation – unlocking script – standard locking type',
  expectCompilationResult,
  '',
  {},
  {
    bytecode: hexToBin('51'),
    success: true,
  },
  {},
  {
    lockingScriptTypes: {
      lock: 'standard',
    },
    scripts: {
      lock: 'OP_DROP OP_1',
      test: 'OP_1',
    },
    unlockingScripts: {
      test: 'lock',
    },
  }
);

test(
  '[BCH compiler] transformation – unlocking script – p2sh locking type',
  expectCompilationResult,
  '',
  {},
  {
    bytecode: hexToBin('51027551'),
    success: true,
  },
  {},
  {
    lockingScriptTypes: {
      lock: 'p2sh',
    },
    scripts: {
      lock: 'OP_DROP OP_1',
      test: 'OP_1',
    },
    unlockingScripts: {
      test: 'lock',
    },
  }
);

test(
  '[BCH compiler] transformation – locking script – standard locking type',
  expectCompilationResult,
  '',
  {},
  {
    bytecode: hexToBin('7551'),
    success: true,
  },
  {},
  {
    lockingScriptTypes: {
      test: 'standard',
    },
    scripts: {
      test: 'OP_DROP OP_1',
      unlock: 'OP_1',
    },
    unlockingScripts: {
      unlock: 'test',
    },
  }
);

test(
  '[BCH compiler] transformation – locking script – p2sh locking type',
  expectCompilationResult,
  '',
  {},
  {
    bytecode: hexToBin('a914ca2bb4a2729927a38a0f266dc890d2bb5990769e87'),
    success: true,
  },
  {},
  {
    lockingScriptTypes: {
      test: 'p2sh',
    },
    scripts: {
      test: 'OP_DROP OP_1',
      unlock: 'OP_1',
    },
    unlockingScripts: {
      unlock: 'test',
    },
  }
);

test(
  '[BCH compiler] transformation – unlocking script – p2sh locking type - failed locking bytecode compilation',
  expectCompilationResult,
  '',
  {},
  {
    errorType: 'resolve',
    errors: [
      {
        error: 'Unknown identifier "unknown".',
        range: {
          endColumn: 21,
          endLineNumber: 1,
          startColumn: 14,
          startLineNumber: 1,
        },
      },
    ],
    success: false,
  } as BytecodeGenerationResult<AuthenticationProgramStateBCH>,
  {},
  {
    lockingScriptTypes: {
      lock: 'p2sh',
    },
    scripts: {
      lock: 'OP_DROP OP_1 unknown',
      test: 'OP_1',
    },
    unlockingScripts: {
      test: 'lock',
    },
  }
);

test(
  '[BCH compiler] transformation – locking script – p2sh locking type - failed raw compilation',
  expectCompilationResult,
  'unknown',
  {},
  {
    errorType: 'resolve',
    errors: [
      {
        error: 'Unknown identifier "unknown".',
        range: {
          endColumn: 8,
          endLineNumber: 1,
          startColumn: 1,
          startLineNumber: 1,
        },
      },
    ],
    success: false,
  } as BytecodeGenerationResult<AuthenticationProgramStateBCH>,
  {},
  {
    lockingScriptTypes: {
      test: 'p2sh',
    },
  }
);

test(
  '[BCH compiler] transformation – locking script – p2sh locking type - failed hash160 (bad vm)',
  expectCompilationResult,
  '',
  {},
  {
    errorType: 'reduce',
    errors: [
      {
        error:
          'Both a VM and a createState method are required to reduce evaluations.',
        range: {
          endColumn: 44,
          endLineNumber: 1,
          startColumn: 13,
          startLineNumber: 1,
        },
      },
    ],
    success: false,
  } as BytecodeGenerationResult<AuthenticationProgramStateBCH>,
  {},
  {
    lockingScriptTypes: {
      test: 'p2sh',
    },
    scripts: {
      test: 'OP_DROP OP_1',
      unlock: 'OP_1',
    },
    unlockingScripts: {
      unlock: 'test',
    },
    vm: undefined,
  }
);
