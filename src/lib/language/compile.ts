import type {
  AnyCompilerConfiguration,
  AuthenticationProgramStateControlStack,
  AuthenticationProgramStateMinimum,
  AuthenticationProgramStateStack,
  CompilationContextBCH,
  CompilationContextCommon,
  CompilationData,
  CompilationResult,
  CompilationResultSuccess,
} from '../lib.js';

import { compileScriptRaw, createEmptyRange } from './resolve.js';

/**
 * Parse, resolve, and reduce the selected script using the provided `data` and
 * `configuration`.
 *
 * Note, locktime validation only occurs if `compilationContext` is provided in
 * the configuration.
 */
// eslint-disable-next-line complexity
export const compileScript = <
  ProgramState extends AuthenticationProgramStateControlStack &
    AuthenticationProgramStateMinimum &
    AuthenticationProgramStateStack = AuthenticationProgramStateControlStack &
    AuthenticationProgramStateMinimum &
    AuthenticationProgramStateStack,
  CompilationContext extends CompilationContextCommon = CompilationContextBCH,
>(
  scriptId: string,
  data: CompilationData<CompilationContext>,
  configuration: AnyCompilerConfiguration<CompilationContext>,
): CompilationResult<ProgramState> => {
  const locktimeDisablingSequenceNumber = 0xffffffff;
  const lockTimeTypeBecomesTimestamp = 500000000;
  if (data.compilationContext?.transaction.locktime !== undefined) {
    if (
      configuration.unlockingScriptTimeLockTypes?.[scriptId] === 'height' &&
      data.compilationContext.transaction.locktime >=
        lockTimeTypeBecomesTimestamp
    ) {
      return {
        errorType: 'parse',
        errors: [
          {
            error: `The script "${scriptId}" requires a height-based locktime (less than 500,000,000), but this transaction uses a timestamp-based locktime ("${data.compilationContext.transaction.locktime}").`,
            range: createEmptyRange(),
          },
        ],
        success: false,
      };
    }
    if (
      configuration.unlockingScriptTimeLockTypes?.[scriptId] === 'timestamp' &&
      data.compilationContext.transaction.locktime <
        lockTimeTypeBecomesTimestamp
    ) {
      return {
        errorType: 'parse',
        errors: [
          {
            error: `The script "${scriptId}" requires a timestamp-based locktime (greater than or equal to 500,000,000), but this transaction uses a height-based locktime ("${data.compilationContext.transaction.locktime}").`,
            range: createEmptyRange(),
          },
        ],
        success: false,
      };
    }
  }

  if (
    data.compilationContext?.transaction.inputs[
      data.compilationContext.inputIndex
    ]?.sequenceNumber !== undefined &&
    configuration.unlockingScriptTimeLockTypes?.[scriptId] !== undefined &&
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    data.compilationContext.transaction.inputs[
      data.compilationContext.inputIndex
    ]!.sequenceNumber === locktimeDisablingSequenceNumber
  ) {
    return {
      errorType: 'parse',
      errors: [
        {
          error: `The script "${scriptId}" requires a locktime, but this input's sequence number is set to disable transaction locktime (0xffffffff). This will cause the OP_CHECKLOCKTIMEVERIFY operation to error when the transaction is verified. To be valid, this input must use a sequence number that does not disable locktime.`,
          range: createEmptyRange(),
        },
      ],
      success: false,
    };
  }

  const rawResult = compileScriptRaw<ProgramState, CompilationContext>({
    configuration,
    data,
    scriptId,
  });

  if (!rawResult.success) {
    return rawResult;
  }

  const unlocks = configuration.unlockingScripts?.[scriptId];
  const unlockingScriptType =
    unlocks === undefined
      ? undefined
      : configuration.lockingScriptTypes?.[unlocks];
  const isP2shUnlock =
    unlockingScriptType === 'p2sh20' || unlockingScriptType === 'p2sh32';
  const lockingScriptType = configuration.lockingScriptTypes?.[scriptId];
  const isP2shLock =
    lockingScriptType === 'p2sh20' || lockingScriptType === 'p2sh32';
  if (isP2shLock) {
    const transformedResult = compileScriptRaw<
      ProgramState,
      CompilationContext
    >({
      configuration: {
        ...configuration,
        scripts: {
          p2sh20Locking:
            'OP_HASH160 <$(<lockingBytecode> OP_HASH160)> OP_EQUAL',
          p2sh32Locking:
            'OP_HASH256 <$(<lockingBytecode> OP_HASH256)> OP_EQUAL',
        },
        variables: { lockingBytecode: { type: 'AddressData' } },
      },
      data: { bytecode: { lockingBytecode: rawResult.bytecode } },
      scriptId:
        lockingScriptType === 'p2sh20' ? 'p2sh20Locking' : 'p2sh32Locking',
    });

    if (!transformedResult.success) {
      return transformedResult;
    }
    return {
      ...rawResult,
      bytecode: transformedResult.bytecode,
      transformed:
        lockingScriptType === 'p2sh20' ? 'p2sh20-locking' : 'p2sh32-locking',
    };
  }

  if (isP2shUnlock) {
    const lockingBytecodeResult = compileScriptRaw<
      ProgramState,
      CompilationContext
    >({
      configuration,
      data,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      scriptId: unlocks!,
    });
    if (!lockingBytecodeResult.success) {
      return lockingBytecodeResult;
    }
    const transformedResult = compileScriptRaw<
      ProgramState,
      CompilationContext
    >({
      configuration: {
        ...configuration,
        scripts: {
          p2shUnlocking: 'unlockingBytecode <lockingBytecode>',
        },
        variables: {
          lockingBytecode: { type: 'AddressData' },
          unlockingBytecode: { type: 'AddressData' },
        },
      },
      data: {
        bytecode: {
          lockingBytecode: lockingBytecodeResult.bytecode,
          unlockingBytecode: rawResult.bytecode,
        },
      },
      scriptId: 'p2shUnlocking',
    }) as CompilationResultSuccess<ProgramState>;

    return {
      ...rawResult,
      bytecode: transformedResult.bytecode,
      transformed:
        unlockingScriptType === 'p2sh20'
          ? 'p2sh20-unlocking'
          : 'p2sh32-unlocking',
    };
  }

  return rawResult;
};
