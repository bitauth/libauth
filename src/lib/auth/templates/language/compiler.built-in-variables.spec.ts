// tslint:disable:no-expression-statement no-magic-numbers max-file-line-count
import test, { Macro } from 'ava';

import { hexToBin, stringify } from '../../../utils/utils';
import {
  CompilationData,
  createAuthenticationProgramExternalStateCommonEmpty
} from '../../auth';

import { CompilerOperationDataBCH, createCompilerBCH } from './compiler';

const expectCompilationResult: Macro<
  [string, CompilationData<CompilerOperationDataBCH>, object]
> = async (t, testScript, otherData = {}, expectedResult) => {
  const compiler = await createCompilerBCH({ scripts: { test: testScript } });
  const resultUnlock = compiler.generate('test', {
    operationData: {
      ...createAuthenticationProgramExternalStateCommonEmpty(),
      coveredBytecode: Uint8Array.of()
    },
    ...otherData
  });
  t.log(stringify(resultUnlock));
  t.deepEqual(resultUnlock, expectedResult);
};

test(
  'BCH compiler: built-in variables – current_block_time - error',
  expectCompilationResult,
  '<current_block_time>',
  {},
  {
    errorType: 'resolve',
    errors: [
      {
        error:
          'Tried to resolve the built-in variable "current_block_time", but the "currentBlockTime" property was not provided in the compilation data.',
        range: {
          endColumn: 20,
          endLineNumber: 1,
          startColumn: 2,
          startLineNumber: 1
        }
      }
    ],
    success: false
  }
);

test(
  'BCH compiler: built-in variables – current_block_time',
  expectCompilationResult,
  '<current_block_time>',
  { currentBlockTime: new Date('2019-10-13T00:00:00.000Z') },
  {
    bytecode: hexToBin('040069a25d'),
    success: true
  }
);

test(
  'BCH compiler: built-in variables – current_block_height - error',
  expectCompilationResult,
  '<current_block_height>',
  {},
  {
    errorType: 'resolve',
    errors: [
      {
        error:
          'Tried to resolve the built-in variable "current_block_height", but the "currentBlockHeight" property was not provided in the compilation data.',
        range: {
          endColumn: 22,
          endLineNumber: 1,
          startColumn: 2,
          startLineNumber: 1
        }
      }
    ],
    success: false
  }
);

test(
  'BCH compiler: built-in variables – signing_serialization.all_outputs - error',
  expectCompilationResult,
  '<signing_serialization.corresponding_output_hash>',
  { operationData: undefined },
  {
    errorType: 'resolve',
    errors: [
      {
        error:
          'Could not construct the signing serialization "signing_serialization.corresponding_output_hash", signing serialization data was not provided in the compilation data.',
        range: {
          endColumn: 49,
          endLineNumber: 1,
          startColumn: 2,
          startLineNumber: 1
        }
      }
    ],
    success: false
  }
);

test(
  'BCH compiler: built-in variables – signing_serialization - error',
  expectCompilationResult,
  '<signing_serialization>',
  { operationData: undefined },
  {
    errorType: 'resolve',
    errors: [
      {
        error:
          'Tried to resolve an operation for the built-in variable "signing_serialization", but no operation was provided. Provide an operation like "signing_serialization.[operation]".',
        range: {
          endColumn: 23,
          endLineNumber: 1,
          startColumn: 2,
          startLineNumber: 1
        }
      }
    ],
    success: false
  }
);

test(
  'BCH compiler: built-in variables – signing_serialization.all_outputs',
  expectCompilationResult,
  '<signing_serialization.all_outputs>',
  {},
  {
    bytecode: hexToBin(
      '4c9d00000000020202020202020202020202020202020202020202020202020202020202020204040404040404040404040404040404040404040404040404040404040404040505050505050505050505050505050505050505050505050505050505050505000000000000000000000000000000000003030303030303030303030303030303030303030303030303030303030303030000000041000000'
    ),
    success: true
  }
);

test(
  'BCH compiler: built-in variables – signing_serialization.all_outputs_single_input',
  expectCompilationResult,
  '<signing_serialization.all_outputs_single_input>',
  {},
  {
    bytecode: hexToBin(
      '4c9d000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005050505050505050505050505050505050505050505050505050505050505050000000000000000000000000000000000030303030303030303030303030303030303030303030303030303030303030300000000c1000000'
    ),
    success: true
  }
);

test(
  'BCH compiler: built-in variables – signing_serialization.corresponding_output',
  expectCompilationResult,
  '<signing_serialization.corresponding_output>',
  {},
  {
    bytecode: hexToBin(
      '4c9d00000000020202020202020202020202020202020202020202020202020202020202020200000000000000000000000000000000000000000000000000000000000000000505050505050505050505050505050505050505050505050505050505050505000000000000000000000000000000000001010101010101010101010101010101010101010101010101010101010101010000000043000000'
    ),
    success: true
  }
);

test(
  'BCH compiler: built-in variables – signing_serialization.corresponding_output_single_input',
  expectCompilationResult,
  '<signing_serialization.corresponding_output_single_input>',
  {},
  {
    bytecode: hexToBin(
      '4c9d000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005050505050505050505050505050505050505050505050505050505050505050000000000000000000000000000000000010101010101010101010101010101010101010101010101010101010101010100000000c3000000'
    ),
    success: true
  }
);

test(
  'BCH compiler: built-in variables – signing_serialization.no_outputs',
  expectCompilationResult,
  '<signing_serialization.no_outputs>',
  {},
  {
    bytecode: hexToBin(
      '4c9d00000000020202020202020202020202020202020202020202020202020202020202020200000000000000000000000000000000000000000000000000000000000000000505050505050505050505050505050505050505050505050505050505050505000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000042000000'
    ),
    success: true
  }
);

test(
  'BCH compiler: built-in variables – signing_serialization.no_outputs_single_input',
  expectCompilationResult,
  '<signing_serialization.no_outputs_single_input>',
  {},
  {
    bytecode: hexToBin(
      '4c9d000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005050505050505050505050505050505050505050505050505050505050505050000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c2000000'
    ),
    success: true
  }
);

test(
  'BCH compiler: built-in variables – signing_serialization.corresponding_output_hash',
  expectCompilationResult,
  '<signing_serialization.corresponding_output_hash>',
  {},
  {
    bytecode: hexToBin(
      '200101010101010101010101010101010101010101010101010101010101010101'
    ),
    success: true
  }
);

test(
  'BCH compiler: built-in variables – signing_serialization.covered_bytecode_prefix',
  expectCompilationResult,
  '<signing_serialization.covered_bytecode_prefix>',
  {},
  {
    bytecode: hexToBin('0100'),
    success: true
  }
);

test(
  'BCH compiler: built-in variables – signing_serialization.covered_bytecode',
  expectCompilationResult,
  '<signing_serialization.covered_bytecode>',
  {},
  {
    bytecode: hexToBin('00'),
    success: true
  }
);

test(
  'BCH compiler: built-in variables – signing_serialization.locktime',
  expectCompilationResult,
  '<signing_serialization.locktime>',
  {},
  {
    bytecode: hexToBin('0400000000'),
    success: true
  }
);

test(
  'BCH compiler: built-in variables – signing_serialization.outpoint_index',
  expectCompilationResult,
  '<signing_serialization.outpoint_index>',
  {},
  {
    bytecode: hexToBin('0400000000'),
    success: true
  }
);

test(
  'BCH compiler: built-in variables – signing_serialization.outpoint_transaction_hash',
  expectCompilationResult,
  '<signing_serialization.outpoint_transaction_hash>',
  {},
  {
    bytecode: hexToBin(
      '200505050505050505050505050505050505050505050505050505050505050505'
    ),
    success: true
  }
);

test(
  'BCH compiler: built-in variables – signing_serialization.output_value',
  expectCompilationResult,
  '<signing_serialization.output_value>',
  {},
  {
    bytecode: hexToBin('080000000000000000'),
    success: true
  }
);

test(
  'BCH compiler: built-in variables – signing_serialization.sequence_number',
  expectCompilationResult,
  '<signing_serialization.sequence_number>',
  {},
  {
    bytecode: hexToBin('0400000000'),
    success: true
  }
);

test(
  'BCH compiler: built-in variables – signing_serialization.transaction_outpoints_hash',
  expectCompilationResult,
  '<signing_serialization.transaction_outpoints_hash>',
  {},
  {
    bytecode: hexToBin(
      '200202020202020202020202020202020202020202020202020202020202020202'
    ),
    success: true
  }
);

test(
  'BCH compiler: built-in variables – signing_serialization.transaction_outputs_hash',
  expectCompilationResult,
  '<signing_serialization.transaction_outputs_hash>',
  {},
  {
    bytecode: hexToBin(
      '200303030303030303030303030303030303030303030303030303030303030303'
    ),
    success: true
  }
);

test(
  'BCH compiler: built-in variables – signing_serialization.transaction_sequence_numbers_hash',
  expectCompilationResult,
  '<signing_serialization.transaction_sequence_numbers_hash>',
  {},
  {
    bytecode: hexToBin(
      '200404040404040404040404040404040404040404040404040404040404040404'
    ),
    success: true
  }
);

test(
  'BCH compiler: built-in variables – signing_serialization.version',
  expectCompilationResult,
  '<signing_serialization.version>',
  {},
  {
    bytecode: hexToBin('0400000000'),
    success: true
  }
);

test(
  'BCH compiler: built-in variables – signing_serialization.unknown',
  expectCompilationResult,
  '<signing_serialization.unknown>',
  {},
  {
    errorType: 'resolve',
    errors: [
      {
        error:
          'Identifer "signing_serialization.unknown" refers to a SigningSerialization operation "unknown" which is not available to this compiler.',
        range: {
          endColumn: 31,
          endLineNumber: 1,
          startColumn: 2,
          startLineNumber: 1
        }
      }
    ],
    success: false
  }
);
