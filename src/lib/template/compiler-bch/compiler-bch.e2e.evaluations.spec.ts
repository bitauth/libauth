/* eslint-disable functional/no-expression-statement, @typescript-eslint/no-magic-numbers */
import test from 'ava';

/*
 * import {
 *   AuthenticationProgramStateBCH,
 *   BytecodeGenerationResult,
 * } from '../../lib';
 */

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
