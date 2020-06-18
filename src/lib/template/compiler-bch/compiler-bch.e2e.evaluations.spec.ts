/* eslint-disable functional/no-expression-statement, @typescript-eslint/no-magic-numbers */
import test from 'ava';

import {
  AuthenticationProgramStateBCH,
  BytecodeGenerationResult,
} from '../../lib';

import { expectCompilationResult } from './compiler-bch.e2e.spec.helper';

test(
  '[BCH compiler] evaluations – simple evaluation',
  expectCompilationResult,
  '$(<1> <2> OP_ADD)',
  {},
  {
    bytecode: Uint8Array.of(0x03),
    success: true,
  }
);

test(
  '[BCH compiler] evaluations – nested evaluations',
  expectCompilationResult,
  '$( $(<1> <2> OP_ADD) 0xaabbcc )',
  {},
  {
    bytecode: Uint8Array.from([0xaa, 0xbb, 0xcc]),
    success: true,
  }
);

test(
  '[BCH compiler] evaluations – empty results are erased',
  expectCompilationResult,
  '$( OP_0 )',
  {},
  {
    bytecode: Uint8Array.of(),
    success: true,
  }
);

test(
  '[BCH compiler] evaluations – error if evaluation completes with more than one stack item',
  expectCompilationResult,
  '$( OP_1 OP_2 )',
  {},
  {
    errorType: 'reduce',
    errors: [
      {
        error:
          'Failed to reduce evaluation: Program completed with an unexpected number of items on the stack (must be exactly 1).',
        range: {
          endColumn: 15,
          endLineNumber: 1,
          startColumn: 1,
          startLineNumber: 1,
        },
      },
    ],
    success: false,
  } as BytecodeGenerationResult<AuthenticationProgramStateBCH>
);

test(
  '[BCH compiler] evaluations – requires vm',
  expectCompilationResult,
  '$( OP_1 OP_2 )',
  {},
  {
    errorType: 'reduce',
    errors: [
      {
        error:
          'Both a VM and a createState method are required to reduce evaluations.',
        range: {
          endColumn: 15,
          endLineNumber: 1,
          startColumn: 1,
          startLineNumber: 1,
        },
      },
    ],
    success: false,
  } as BytecodeGenerationResult<AuthenticationProgramStateBCH>,
  {},
  { vm: undefined }
);

test(
  '[BCH compiler] evaluations – requires createState',
  expectCompilationResult,
  '$( OP_1 OP_2 )',
  {},
  {
    errorType: 'reduce',
    errors: [
      {
        error:
          'Both a VM and a createState method are required to reduce evaluations.',
        range: {
          endColumn: 15,
          endLineNumber: 1,
          startColumn: 1,
          startLineNumber: 1,
        },
      },
    ],
    success: false,
  } as BytecodeGenerationResult<AuthenticationProgramStateBCH>,
  {},
  { createAuthenticationProgram: undefined }
);

test(
  '[BCH compiler] evaluations – error if evaluation completes with no stack items',
  expectCompilationResult,
  '$( OP_1 OP_2 OP_2DROP )',
  {},
  {
    errorType: 'reduce',
    errors: [
      {
        error:
          'Failed to reduce evaluation: Program completed with an unexpected number of items on the stack (must be exactly 1).',
        range: {
          endColumn: 24,
          endLineNumber: 1,
          startColumn: 1,
          startLineNumber: 1,
        },
      },
    ],
    success: false,
  } as BytecodeGenerationResult<AuthenticationProgramStateBCH>
);

test(
  '[BCH compiler] evaluations – error if evaluation ends with an error',
  expectCompilationResult,
  '$( OP_1 OP_RETURN )',
  {},
  {
    errorType: 'reduce',
    errors: [
      {
        error:
          'Failed to reduce evaluation: Program called an OP_RETURN operation.',
        range: {
          endColumn: 20,
          endLineNumber: 1,
          startColumn: 1,
          startLineNumber: 1,
        },
      },
    ],
    success: false,
  } as BytecodeGenerationResult<AuthenticationProgramStateBCH>
);

test(
  '[BCH compiler] evaluations – error if nested evaluation begins with an error',
  expectCompilationResult,
  '$( $( OP_RETURN ) )',
  {},
  {
    errorType: 'reduce',
    errors: [
      {
        error:
          'Failed to reduce evaluation: Program called an OP_RETURN operation.',
        range: {
          endColumn: 18,
          endLineNumber: 1,
          startColumn: 4,
          startLineNumber: 1,
        },
      },
    ],
    success: false,
  } as BytecodeGenerationResult<AuthenticationProgramStateBCH>
);

test(
  '[BCH compiler] evaluations – nested error within first sample',
  expectCompilationResult,
  '$( $( 0x6a0000 ) )',
  {},
  {
    errorType: 'reduce',
    errors: [
      {
        error:
          'Failed to reduce evaluation: Program called an OP_RETURN operation.',
        range: {
          endColumn: 17,
          endLineNumber: 1,
          startColumn: 4,
          startLineNumber: 1,
        },
      },
    ],
    success: false,
  } as BytecodeGenerationResult<AuthenticationProgramStateBCH>
);

test(
  '[BCH compiler] evaluations – malformed first sample',
  expectCompilationResult,
  '$( $( 0x01 ) )',
  {},
  {
    errorType: 'reduce',
    errors: [
      {
        error:
          'Failed to reduce evaluation: The provided locking bytecode is malformed.',
        range: {
          endColumn: 13,
          endLineNumber: 1,
          startColumn: 4,
          startLineNumber: 1,
        },
      },
    ],
    success: false,
  } as BytecodeGenerationResult<AuthenticationProgramStateBCH>
);

test(
  '[BCH compiler] evaluations – malformed later sample',
  expectCompilationResult,
  '$( $( OP_1 0x01 ) )',
  {},
  {
    errorType: 'reduce',
    errors: [
      {
        error:
          'Failed to reduce evaluation: The provided locking bytecode is malformed.',
        range: {
          endColumn: 18,
          endLineNumber: 1,
          startColumn: 4,
          startLineNumber: 1,
        },
      },
    ],
    success: false,
  } as BytecodeGenerationResult<AuthenticationProgramStateBCH>
);

test(
  '[BCH compiler] evaluations – nested erasure',
  expectCompilationResult,
  '$( < $( "" <""> ) $(OP_0) > )',
  {},
  {
    bytecode: Uint8Array.of(),
    success: true,
  }
);

test(
  '[BCH compiler] evaluations – ignore empty instruction aggregations',
  expectCompilationResult,
  '$( "" ""  OP_1 OP_2 "" OP_ADD )',
  {},
  {
    bytecode: Uint8Array.of(0x03),
    success: true,
  }
);

test(
  '[BCH compiler] evaluations – error in the middle of an evaluation',
  expectCompilationResult,
  '$( OP_1 OP_2 OP_ADD OP_DUP OP_RETURN OP_DROP )',
  {},
  {
    errorType: 'reduce',
    errors: [
      {
        error:
          'Failed to reduce evaluation: Program called an OP_RETURN operation.',
        range: {
          endColumn: 47,
          endLineNumber: 1,
          startColumn: 1,
          startLineNumber: 1,
        },
      },
    ],
    success: false,
  } as BytecodeGenerationResult<AuthenticationProgramStateBCH>
);

test(
  '[BCH compiler] evaluations – evaluation with non-empty execution stack',
  expectCompilationResult,
  '$( OP_1 OP_IF <"abc"> )',
  {},
  {
    errorType: 'reduce',
    errors: [
      {
        error:
          'Failed to reduce evaluation: Program completed with a non-empty execution stack (missing `OP_ENDIF`).',
        range: {
          endColumn: 24,
          endLineNumber: 1,
          startColumn: 1,
          startLineNumber: 1,
        },
      },
    ],
    success: false,
  } as BytecodeGenerationResult<AuthenticationProgramStateBCH>
);

test(
  '[BCH compiler] evaluations – multiple evaluation errors',
  expectCompilationResult,
  '$( $( OP_RETURN ) $( OP_RETURN ) OP_1 )',
  {},
  {
    errorType: 'reduce',
    errors: [
      {
        error:
          'Failed to reduce evaluation: Program called an OP_RETURN operation.',
        range: {
          endColumn: 18,
          endLineNumber: 1,
          startColumn: 4,
          startLineNumber: 1,
        },
      },
      {
        error:
          'Failed to reduce evaluation: Program called an OP_RETURN operation.',
        range: {
          endColumn: 33,
          endLineNumber: 1,
          startColumn: 19,
          startLineNumber: 1,
        },
      },
    ],
    success: false,
  } as BytecodeGenerationResult<AuthenticationProgramStateBCH>
);

test(
  '[BCH compiler] evaluations – push an evaluation with an error',
  expectCompilationResult,
  '<$()>',
  {},
  {
    errorType: 'reduce',
    errors: [
      {
        error:
          'Failed to reduce evaluation: Program completed with an unexpected number of items on the stack (must be exactly 1).',
        range: {
          endColumn: 5,
          endLineNumber: 1,
          startColumn: 2,
          startLineNumber: 1,
        },
      },
    ],
    success: false,
  } as BytecodeGenerationResult<AuthenticationProgramStateBCH>
);
