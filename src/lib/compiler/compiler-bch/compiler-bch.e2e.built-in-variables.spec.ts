import test from 'ava';

import type {
  AuthenticationProgramStateBch,
  BytecodeGenerationResult,
  CompilerConfigurationBch,
} from '../../lib.js';
import {
  compilerConfigurationToCompilerBch,
  compilerOperationsBch,
  createAuthenticationProgramEvaluationCommon,
  createCompilationContextCommonTesting,
  createVirtualMachineBch,
  dateToLocktime,
  generateBytecodeMap,
  hexToBin,
  OpcodesBch,
  sha256,
} from '../../lib.js';

import {
  expectCompilationResult,
  privateKeyM0,
} from './compiler-bch.e2e.spec.helper.js';

test(
  '[BCH compiler] built-in variables - current_block_time - error',
  expectCompilationResult,
  '<current_block_time>',
  {},
  {
    errorType: 'resolve',
    errors: [
      {
        error:
          'Cannot resolve "current_block_time" - the "currentBlockTime" property was not provided in the compilation data.',
        range: {
          endColumn: 20,
          endLineNumber: 1,
          startColumn: 2,
          startLineNumber: 1,
        },
      },
    ],
    success: false,
  } as BytecodeGenerationResult<AuthenticationProgramStateBch>,
);

test(
  '[BCH compiler] built-in variables - current_block_time',
  expectCompilationResult,
  '<current_block_time>',
  {
    currentBlockTime: dateToLocktime(
      new Date('2019-10-13T00:00:00.000Z'),
    ) as number,
  },
  { bytecode: hexToBin('040069a25d'), success: true },
);

test(
  '[BCH compiler] built-in variables - current_block_height - error',
  expectCompilationResult,
  '<current_block_height>',
  {},
  {
    errorType: 'resolve',
    errors: [
      {
        error:
          'Cannot resolve "current_block_height" - the "currentBlockHeight" property was not provided in the compilation data.',
        range: {
          endColumn: 22,
          endLineNumber: 1,
          startColumn: 2,
          startLineNumber: 1,
        },
      },
    ],
    success: false,
  } as BytecodeGenerationResult<AuthenticationProgramStateBch>,
);

test(
  '[BCH compiler] built-in variables - current_block_height',
  expectCompilationResult,
  '<current_block_height>',
  { currentBlockHeight: 1 },
  { bytecode: hexToBin('51'), success: true },
);

test(
  '[BCH compiler] timeLockType - requires a height-based locktime',
  expectCompilationResult,
  '',
  {
    compilationContext: {
      ...createCompilationContextCommonTesting({ locktime: 500000000 }),
    },
  },
  {
    errorType: 'parse',
    errors: [
      {
        error:
          'The script "test" requires a height-based locktime (less than 500,000,000), but this transaction uses a timestamp-based locktime ("500000000").',
        range: {
          endColumn: 0,
          endLineNumber: 0,
          startColumn: 0,
          startLineNumber: 0,
        },
      },
    ],
    success: false,
  } as BytecodeGenerationResult<AuthenticationProgramStateBch>,
  {},
  { unlockingScriptTimeLockTypes: { test: 'height' } },
);

test(
  '[BCH compiler] timeLockType - requires a timestamp-based locktime',
  expectCompilationResult,
  '',
  {
    compilationContext: {
      ...createCompilationContextCommonTesting({ locktime: 0 }),
    },
  },
  {
    errorType: 'parse',
    errors: [
      {
        error:
          'The script "test" requires a timestamp-based locktime (greater than or equal to 500,000,000), but this transaction uses a height-based locktime ("0").',
        range: {
          endColumn: 0,
          endLineNumber: 0,
          startColumn: 0,
          startLineNumber: 0,
        },
      },
    ],
    success: false,
  } as BytecodeGenerationResult<AuthenticationProgramStateBch>,
  {},
  { unlockingScriptTimeLockTypes: { test: 'timestamp' } },
);

test(
  '[BCH compiler] timeLockType - locktime disabled by sequenceNumber',
  expectCompilationResult,
  '',
  {
    compilationContext: {
      ...createCompilationContextCommonTesting({
        inputs: [
          {
            outpointIndex: 0,
            outpointTransactionHash: Uint8Array.of(0),
            sequenceNumber: 0xffffffff,
            unlockingBytecode: undefined,
          },
        ],
      }),
    },
  },
  {
    errorType: 'parse',
    errors: [
      {
        error:
          'The script "test" requires a locktime, but this input\'s sequence number is set to disable transaction locktime (0xffffffff). This will cause the OP_CHECKLOCKTIMEVERIFY operation to error when the transaction is verified. To be valid, this input must use a sequence number that does not disable locktime.',
        range: {
          endColumn: 0,
          endLineNumber: 0,
          startColumn: 0,
          startLineNumber: 0,
        },
      },
    ],
    success: false,
  } as BytecodeGenerationResult<AuthenticationProgramStateBch>,
  {},
  { unlockingScriptTimeLockTypes: { test: 'height' } },
);

test(
  '[BCH compiler] built-in variables - signing_serialization.full_all_outputs - error',
  expectCompilationResult,
  '<signing_serialization.full_all_outputs>',
  { compilationContext: undefined },
  {
    errorType: 'resolve',
    errors: [
      {
        error:
          'Cannot resolve "signing_serialization.full_all_outputs" - the "compilationContext" property was not provided in the compilation data.',
        range: {
          endColumn: 40,
          endLineNumber: 1,
          startColumn: 2,
          startLineNumber: 1,
        },
      },
    ],
    success: false,
  } as BytecodeGenerationResult<AuthenticationProgramStateBch>,
);

test(
  '[BCH compiler] built-in variables - signing_serialization - no component or algorithm',
  expectCompilationResult,
  '<signing_serialization>',
  { compilationContext: undefined },
  {
    errorType: 'resolve',
    errors: [
      {
        error:
          'This "signing_serialization" variable could not be resolved because this compiler\'s "signingSerialization" operations require an operation identifier, e.g. \'signing_serialization.version\'.',
        range: {
          endColumn: 23,
          endLineNumber: 1,
          startColumn: 2,
          startLineNumber: 1,
        },
      },
    ],
    success: false,
  } as BytecodeGenerationResult<AuthenticationProgramStateBch>,
);

/**
 * While this can't work in a locking or unlocking script (a transaction may
 * have only one locktime value, and OP_CHECKLOCKTIMEVERIFY must test against
 * the same type), this must still be supported by the compiler for use cases
 * such as attestation (for data signatures).
 */
test(
  '[BCH compiler] built-in variables - current_block_height and current_block_time',
  expectCompilationResult,
  '<current_block_height> <current_block_time>',
  {
    currentBlockHeight: 1,
    currentBlockTime: dateToLocktime(
      new Date('2019-10-13T00:00:00.000Z'),
    ) as number,
  },
  { bytecode: hexToBin('51040069a25d'), success: true },
);

test(
  '[BCH compiler] errors - multiple reduction errors',
  expectCompilationResult,
  '<current_block_height> <current_block_time>',
  {},
  {
    errorType: 'resolve',
    errors: [
      {
        error:
          'Cannot resolve "current_block_height" - the "currentBlockHeight" property was not provided in the compilation data.',
        range: {
          endColumn: 22,
          endLineNumber: 1,
          startColumn: 2,
          startLineNumber: 1,
        },
      },
      {
        error:
          'Cannot resolve "current_block_time" - the "currentBlockTime" property was not provided in the compilation data.',
        range: {
          endColumn: 43,
          endLineNumber: 1,
          startColumn: 25,
          startLineNumber: 1,
        },
      },
    ],
    success: false,
  } as BytecodeGenerationResult<AuthenticationProgramStateBch>,
);

test(
  '[BCH compiler] built-in variables - signing_serialization - error',
  expectCompilationResult,
  '<signing_serialization>',
  { compilationContext: undefined },
  {
    errorType: 'resolve',
    errors: [
      {
        error:
          'This "signing_serialization" variable could not be resolved because this compiler\'s "signingSerialization" operations require an operation identifier, e.g. \'signing_serialization.version\'.',
        range: {
          endColumn: 23,
          endLineNumber: 1,
          startColumn: 2,
          startLineNumber: 1,
        },
      },
    ],
    success: false,
  } as BytecodeGenerationResult<AuthenticationProgramStateBch>,
);

test(
  '[BCH compiler] built-in variables - signing_serialization.full_all_outputs',
  expectCompilationResult,
  '<signing_serialization.full_all_outputs>',
  {},
  {
    bytecode: hexToBin(
      '4c9d000000002d6c6135bed260db00d1b9ad203fbd17ee6c8b009850fc407bfec29fc45e3d4d8cb9012517c817fead650287d61bdd9c68803b6bf9c64133dcab3e65b5a50cb901010101010101010101010101010101010101010101010101010101010101010000000000ffffffffffffffff00000000dd2aed19e2aa2ddc93b21ca9e9bb5e89016be12113ea1746ebb4e1d0417eca550000000041000000',
    ),
    success: true,
  },
);

test(
  '[BCH compiler] built-in variables - signing_serialization.full_all_outputs_single_input',
  expectCompilationResult,
  '<signing_serialization.full_all_outputs_single_input>',
  {},
  {
    bytecode: hexToBin(
      '4c9d000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001010101010101010101010101010101010101010101010101010101010101010000000000ffffffffffffffff00000000dd2aed19e2aa2ddc93b21ca9e9bb5e89016be12113ea1746ebb4e1d0417eca5500000000c1000000',
    ),
    success: true,
  },
);

test(
  '[BCH compiler] built-in variables - signing_serialization.full_corresponding_output',
  expectCompilationResult,
  '<signing_serialization.full_corresponding_output>',
  {},
  {
    bytecode: hexToBin(
      '4c9d000000002d6c6135bed260db00d1b9ad203fbd17ee6c8b009850fc407bfec29fc45e3d4d000000000000000000000000000000000000000000000000000000000000000001010101010101010101010101010101010101010101010101010101010101010000000000ffffffffffffffff00000000dd2aed19e2aa2ddc93b21ca9e9bb5e89016be12113ea1746ebb4e1d0417eca550000000043000000',
    ),
    success: true,
  },
);

test(
  '[BCH compiler] built-in variables - signing_serialization.full_corresponding_output_single_input',
  expectCompilationResult,
  '<signing_serialization.full_corresponding_output_single_input>',
  {},
  {
    bytecode: hexToBin(
      '4c9d000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001010101010101010101010101010101010101010101010101010101010101010000000000ffffffffffffffff00000000dd2aed19e2aa2ddc93b21ca9e9bb5e89016be12113ea1746ebb4e1d0417eca5500000000c3000000',
    ),
    success: true,
  },
);

test(
  '[BCH compiler] built-in variables - signing_serialization.full_no_outputs',
  expectCompilationResult,
  '<signing_serialization.full_no_outputs>',
  {},
  {
    bytecode: hexToBin(
      '4c9d000000002d6c6135bed260db00d1b9ad203fbd17ee6c8b009850fc407bfec29fc45e3d4d000000000000000000000000000000000000000000000000000000000000000001010101010101010101010101010101010101010101010101010101010101010000000000ffffffffffffffff0000000000000000000000000000000000000000000000000000000000000000000000000000000042000000',
    ),
    success: true,
  },
);

test(
  '[BCH compiler] built-in variables - signing_serialization.full_no_outputs_single_input',
  expectCompilationResult,
  '<signing_serialization.full_no_outputs_single_input>',
  {},
  {
    bytecode: hexToBin(
      '4c9d000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001010101010101010101010101010101010101010101010101010101010101010000000000ffffffffffffffff00000000000000000000000000000000000000000000000000000000000000000000000000000000c2000000',
    ),
    success: true,
  },
);

test(
  '[BCH compiler] built-in variables - signing_serialization.corresponding_output',
  expectCompilationResult,
  '<signing_serialization.corresponding_output>',
  {},
  {
    bytecode: hexToBin('09ffffffffffffffff00'),
    success: true,
  },
);

test(
  '[BCH compiler] built-in variables - signing_serialization.corresponding_output_hash',
  expectCompilationResult,
  '<signing_serialization.corresponding_output_hash>',
  {},
  {
    bytecode: hexToBin(
      '20dd2aed19e2aa2ddc93b21ca9e9bb5e89016be12113ea1746ebb4e1d0417eca55',
    ),
    success: true,
  },
);

test(
  '[BCH compiler] built-in variables - signing_serialization.covered_bytecode_length',
  expectCompilationResult,
  '<signing_serialization.covered_bytecode_length>',
  {},
  {
    bytecode: hexToBin('0100'),
    success: true,
  },
);

test(
  '[BCH compiler] built-in variables - signing_serialization.covered_bytecode',
  expectCompilationResult,
  '<signing_serialization.covered_bytecode>',
  {},
  {
    bytecode: hexToBin('00'),
    success: true,
  },
);

test(
  '[BCH compiler] built-in variables - signing_serialization.locktime',
  expectCompilationResult,
  '<signing_serialization.locktime>',
  {},
  {
    bytecode: hexToBin('0400000000'),
    success: true,
  },
);

test(
  '[BCH compiler] built-in variables - signing_serialization.outpoint_index',
  expectCompilationResult,
  '<signing_serialization.outpoint_index>',
  {},
  {
    bytecode: hexToBin('0400000000'),
    success: true,
  },
);

test(
  '[BCH compiler] built-in variables - signing_serialization.outpoint_transaction_hash',
  expectCompilationResult,
  '<signing_serialization.outpoint_transaction_hash>',
  {},
  {
    bytecode: hexToBin(
      '200101010101010101010101010101010101010101010101010101010101010101',
    ),
    success: true,
  },
);

test(
  '[BCH compiler] built-in variables - signing_serialization.output_value',
  expectCompilationResult,
  '<signing_serialization.output_value>',
  {},
  {
    bytecode: hexToBin('08ffffffffffffffff'),
    success: true,
  },
);

test(
  '[BCH compiler] built-in variables - signing_serialization.sequence_number',
  expectCompilationResult,
  '<signing_serialization.sequence_number>',
  {},
  {
    bytecode: hexToBin('0400000000'),
    success: true,
  },
);

test(
  '[BCH compiler] built-in variables - signing_serialization.transaction_outpoints',
  expectCompilationResult,
  '<signing_serialization.transaction_outpoints>',
  {},
  {
    bytecode: hexToBin(
      '24010101010101010101010101010101010101010101010101010101010101010100000000',
    ),
    success: true,
  },
);

test(
  '[BCH compiler] built-in variables - signing_serialization.transaction_outpoints_hash',
  expectCompilationResult,
  '<signing_serialization.transaction_outpoints_hash>',
  {},
  {
    bytecode: hexToBin(
      '202d6c6135bed260db00d1b9ad203fbd17ee6c8b009850fc407bfec29fc45e3d4d',
    ),
    success: true,
  },
);

test(
  '[BCH compiler] built-in variables - signing_serialization.transaction_outputs',
  expectCompilationResult,
  '<signing_serialization.transaction_outputs>',
  {},
  {
    bytecode: hexToBin('09ffffffffffffffff00'),
    success: true,
  },
);

test(
  '[BCH compiler] built-in variables - signing_serialization.transaction_outputs_hash',
  expectCompilationResult,
  '<signing_serialization.transaction_outputs_hash>',
  {},
  {
    bytecode: hexToBin(
      '20dd2aed19e2aa2ddc93b21ca9e9bb5e89016be12113ea1746ebb4e1d0417eca55',
    ),
    success: true,
  },
);

test(
  '[BCH compiler] built-in variables - signing_serialization.transaction_sequence_numbers',
  expectCompilationResult,
  '<signing_serialization.transaction_sequence_numbers>',
  {},
  {
    bytecode: hexToBin('0400000000'),
    success: true,
  },
);

test(
  '[BCH compiler] built-in variables - signing_serialization.transaction_sequence_numbers_hash',
  expectCompilationResult,
  '<signing_serialization.transaction_sequence_numbers_hash>',
  {},
  {
    bytecode: hexToBin(
      '208cb9012517c817fead650287d61bdd9c68803b6bf9c64133dcab3e65b5a50cb9',
    ),
    success: true,
  },
);

test(
  '[BCH compiler] built-in variables - signing_serialization.version',
  expectCompilationResult,
  '<signing_serialization.version>',
  {},
  {
    bytecode: hexToBin('0400000000'),
    success: true,
  },
);

test(
  '[BCH compiler] built-in variables - signing_serialization.token_prefix - no token',
  expectCompilationResult,
  '<signing_serialization.token_prefix>',
  {},
  {
    bytecode: hexToBin('00'),
    success: true,
  },
);

test(
  '[BCH compiler] built-in variables - signing_serialization.token_prefix - complex token prefix',
  expectCompilationResult,
  '<signing_serialization.token_prefix>',
  {
    compilationContext: createCompilationContextCommonTesting({
      sourceOutputs: [
        {
          lockingBytecode: Uint8Array.from([]),
          token: {
            amount: 9223372036854775807n,
            category: hexToBin(
              'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
            ),
            nft: {
              capability: 'minting',
              commitment: hexToBin(
                'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
              ),
            },
          },
          valueSatoshis: 0xffffffffffffffffn,
        },
      ],
    }),
  },
  {
    bytecode: hexToBin(
      '4c54efbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb7228ccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccffffffffffffffff7f',
    ),
    success: true,
  },
);

test(
  '[BCH compiler] built-in variables - signing_serialization.covered_bytecode - unlocking script not in unlockingScripts',
  expectCompilationResult,
  '<signing_serialization.covered_bytecode>',
  {},
  {
    errorType: 'resolve',
    errors: [
      {
        error:
          'Identifier "signing_serialization.covered_bytecode" requires a signing serialization, but "coveredBytecode" cannot be determined because "test" is not present in the compiler configuration\'s "unlockingScripts".',
        range: {
          endColumn: 40,
          endLineNumber: 1,
          startColumn: 2,
          startLineNumber: 1,
        },
      },
    ],
    success: false,
  } as BytecodeGenerationResult<AuthenticationProgramStateBch>,
  {},
  {
    unlockingScripts: {},
  },
);

test(
  '[BCH compiler] built-in variables - signing_serialization.covered_bytecode - unknown covered script',
  expectCompilationResult,
  '<signing_serialization.covered_bytecode>',
  {},
  {
    errorType: 'resolve',
    errors: [
      {
        error:
          'Identifier "signing_serialization.covered_bytecode" requires a signing serialization that covers an unknown locking script, "some_unknown_script".',
        range: {
          endColumn: 40,
          endLineNumber: 1,
          startColumn: 2,
          startLineNumber: 1,
        },
      },
    ],
    success: false,
  } as BytecodeGenerationResult<AuthenticationProgramStateBch>,
  {},
  {
    unlockingScripts: {
      test: 'some_unknown_script',
    },
  },
);

test(
  '[BCH compiler] built-in variables - signing_serialization.covered_bytecode - error in coveredBytecode compilation',
  expectCompilationResult,
  '',
  {},
  {
    errorType: 'resolve',
    errors: [
      {
        error:
          'Compilation error in resolved script "lock": [1, 1] Unknown identifier "invalid".',
        range: {
          endColumn: 40,
          endLineNumber: 1,
          startColumn: 2,
          startLineNumber: 1,
        },
      },
    ],
    success: false,
  } as BytecodeGenerationResult<AuthenticationProgramStateBch>,
  {},
  {
    scripts: {
      lock: 'invalid',
      test: '<signing_serialization.full_all_outputs>',
    },
  },
);

test(
  '[BCH compiler] built-in variables - signing_serialization.unknown',
  expectCompilationResult,
  '<signing_serialization.unknown>',
  {},
  {
    errorType: 'resolve',
    errors: [
      {
        error:
          'The identifier "signing_serialization.unknown" could not be resolved because the "signing_serialization.unknown" operation is not available to this compiler.',
        range: {
          endColumn: 31,
          endLineNumber: 1,
          startColumn: 2,
          startLineNumber: 1,
        },
      },
    ],
    success: false,
  } as BytecodeGenerationResult<AuthenticationProgramStateBch>,
);

test(
  '[BCH compiler] built-in variables - signing_serialization: unrecognized identifier fragment',
  expectCompilationResult,
  '<signing_serialization.full_all_outputs.future_operation.with_more_levels>',
  {},
  {
    errorType: 'resolve',
    errors: [
      {
        error:
          'Unknown component in "signing_serialization.full_all_outputs.future_operation.with_more_levels" - the fragment "future_operation" is not recognized.',
        range: {
          endColumn: 74,
          endLineNumber: 1,
          startColumn: 2,
          startLineNumber: 1,
        },
      },
    ],
    success: false,
  } as BytecodeGenerationResult<AuthenticationProgramStateBch>,
);

test.failing(
  '[BCH compiler] signing_serialization.corresponding_output and signing_serialization.corresponding_output_hash - returns empty bytecode if no corresponding output',
  (t) => {
    const compiler = compilerConfigurationToCompilerBch<
      CompilerConfigurationBch,
      AuthenticationProgramStateBch
    >({
      createAuthenticationProgram: createAuthenticationProgramEvaluationCommon,
      opcodes: generateBytecodeMap(OpcodesBch),
      operations: compilerOperationsBch,
      scripts: {
        // eslint-disable-next-line camelcase
        corresponding_output:
          '<1> <signing_serialization.corresponding_output> <2>',
        // eslint-disable-next-line camelcase
        corresponding_output_hash:
          '<1> <signing_serialization.corresponding_output_hash> <2>',
      },
      sha256,
      variables: {
        a: {
          type: 'Key',
        },
      },
      vm: createVirtualMachineBch(),
    });

    const data = {
      compilationContext: {
        ...createCompilationContextCommonTesting(),
        inputIndex: 1,
      },
      keys: { privateKeys: { a: privateKeyM0 } },
    };

    t.deepEqual(
      compiler.generateBytecode({ data, scriptId: 'corresponding_output' }),
      {
        bytecode: hexToBin('510052'),
        success: true,
      },
    );

    t.deepEqual(
      compiler.generateBytecode({
        data,
        scriptId: 'corresponding_output_hash',
      }),
      {
        bytecode: hexToBin('510052'),
        success: true,
      },
    );
  },
);
