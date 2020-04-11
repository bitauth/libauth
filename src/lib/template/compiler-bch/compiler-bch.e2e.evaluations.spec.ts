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
          'Evaluations return a single item from the stack, but this evaluation completed with more than one stack item.',
        range: {
          endColumn: 13,
          endLineNumber: 1,
          startColumn: 9,
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
  { createState: undefined }
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
          'An evaluation must leave an item on the stack, but this evaluation completed with an empty stack. To return an empty result, push an empty stack item ("OP_0").',
        range: {
          endColumn: 22,
          endLineNumber: 1,
          startColumn: 14,
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
          endColumn: 18,
          endLineNumber: 1,
          startColumn: 9,
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
          endColumn: 16,
          endLineNumber: 1,
          startColumn: 7,
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
          endColumn: 15,
          endLineNumber: 1,
          startColumn: 7,
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
          'An evaluation must leave an item on the stack, but this evaluation contains no operations. To return an empty result, push an empty stack item ("OP_0").',
        range: {
          endColumn: 11,
          endLineNumber: 1,
          startColumn: 7,
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
          'An instruction is malformed and cannot be evaluated: OP_PUSHBYTES_1 [missing 1 byte]',
        range: {
          endColumn: 16,
          endLineNumber: 1,
          startColumn: 12,
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
          endColumn: 37,
          endLineNumber: 1,
          startColumn: 28,
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
          endColumn: 16,
          endLineNumber: 1,
          startColumn: 7,
          startLineNumber: 1,
        },
      },
      {
        error:
          'Failed to reduce evaluation: Program called an OP_RETURN operation.',
        range: {
          endColumn: 31,
          endLineNumber: 1,
          startColumn: 22,
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
          'An evaluation must leave an item on the stack, but this evaluation contains no operations. To return an empty result, push an empty stack item ("OP_0").',
        range: {
          endColumn: 4,
          endLineNumber: 1,
          startColumn: 4,
          startLineNumber: 1,
        },
      },
    ],
    success: false,
  } as BytecodeGenerationResult<AuthenticationProgramStateBCH>
);
