import { Ripemd160, Secp256k1, Sha1, Sha256 } from '../../../crypto/crypto';
import { InstructionSet } from '../../virtual-machine';
import {
  conditionallyEvaluate,
  incrementOperationCount,
  mapOverOperations,
} from '../common/combinators';
import {
  applyError,
  AuthenticationErrorCommon,
  checkLimitsCommon,
  cloneAuthenticationProgramStateCommon,
  cloneStack,
  commonOperations,
  ConsensusCommon,
  createAuthenticationProgramStateCommon,
  createTransactionContextCommon,
  stackItemIsTruthy,
  undefinedOperation,
} from '../common/common';
import { AuthenticationInstruction } from '../instruction-sets-types';
import {
  authenticationInstructionsAreMalformed,
  parseBytecode,
} from '../instruction-sets-utils';

import { AuthenticationErrorBCH } from './bch-errors';
import { OpcodesBCH } from './bch-opcodes';
import { bitcoinCashOperations } from './bch-operations';
import {
  AuthenticationProgramBCH,
  AuthenticationProgramStateBCH,
} from './bch-types';

export { OpcodesBCH };

const enum PayToScriptHash {
  length = 3,
  lastElement = 2,
}

export const isPayToScriptHash = <Opcodes>(
  verificationInstructions: readonly AuthenticationInstruction<Opcodes>[]
) =>
  verificationInstructions.length === PayToScriptHash.length &&
  ((verificationInstructions[0].opcode as unknown) as number) ===
    OpcodesBCH.OP_HASH160 &&
  ((verificationInstructions[1].opcode as unknown) as number) ===
    OpcodesBCH.OP_PUSHBYTES_20 &&
  ((verificationInstructions[PayToScriptHash.lastElement]
    .opcode as unknown) as number) === OpcodesBCH.OP_EQUAL;

const enum SegWit {
  minimumLength = 4,
  maximumLength = 42,
  OP_0 = 0,
  OP_1 = 81,
  OP_16 = 96,
  versionAndLengthBytes = 2,
}

/**
 * Test a stack item for the SegWit Recovery Rules activated in `BCH_2019_05`.
 *
 * @param bytecode - the stack item to test
 */
// eslint-disable-next-line complexity
export const isWitnessProgram = (bytecode: Uint8Array) => {
  const correctLength =
    bytecode.length >= SegWit.minimumLength &&
    bytecode.length <= SegWit.maximumLength;
  const validVersionPush =
    bytecode[0] === SegWit.OP_0 ||
    (bytecode[0] >= SegWit.OP_1 && bytecode[0] <= SegWit.OP_16);
  const correctLengthByte =
    bytecode[1] + SegWit.versionAndLengthBytes === bytecode.length;
  return correctLength && validVersionPush && correctLengthByte;
};

/**
 * From C++ implementation:
 * Note that IsPushOnly() *does* consider OP_RESERVED to be a push-type
 * opcode, however execution of OP_RESERVED fails, so it's not relevant to
 * P2SH/BIP62 as the scriptSig would fail prior to the P2SH special
 * validation code being executed.
 */
const isPushOperation = (opcode: number) => opcode < OpcodesBCH.OP_16;

/**
 * This library's supported versions of the BCH virtual machine. "Strict"
 * versions (A.K.A. `isStandard` from the C++ implementations) enable additional
 * validation which is commonly used on the P2P network before relaying
 * transactions. Transactions which fail these rules are often called
 * "non-standard" – the transactions can technically be included by miners in
 * valid blocks, but most network nodes will refuse to relay them.
 *
 * BCH instruction sets marked `SPEC` ("specification") have not yet been
 * deployed on the main network and are subject to change. After deployment, the
 * `SPEC` suffix is removed. This change only effects the name of the TypeScript
 * enum member – the value remains the same. E.g.
 * `InstructionSetBCH.BCH_2020_05_SPEC` became `InstructionSetBCH.BCH_2020_05`,
 * but the value remained `BCH_2020_05`.
 *
 * This allows consumers to select an upgrade policy: when a version of Libauth
 * is released in which compatibility with a deployed virtual machine is
 * confirmed, this change can help to identify downstream code which requires
 * review.
 *  - Consumers which prefer to upgrade manually should specify a `SPEC` type,
 * e.g. `InstructionSetBCH.BCH_2020_05_SPEC`.
 *  - Consumers which prefer full compatibility between Libauth version should
 * specify a precise instruction set value (e.g. `BCH_2020_05`) or use the
 * dedicated "current" value: `instructionSetBCHCurrentStrict`.
 */
export enum InstructionSetBCH {
  BCH_2019_05 = 'BCH_2019_05',
  BCH_2019_05_STRICT = 'BCH_2019_05_STRICT',
  BCH_2019_11 = 'BCH_2019_11',
  BCH_2019_11_STRICT = 'BCH_2019_11_STRICT',
  BCH_2020_05 = 'BCH_2020_05',
  BCH_2020_05_STRICT = 'BCH_2020_05_STRICT',
  BCH_2020_11_SPEC = 'BCH_2020_11',
  BCH_2020_11_STRICT_SPEC = 'BCH_2020_11_STRICT',
  BCH_2021_05_SPEC = 'BCH_2021_05',
  BCH_2021_05_STRICT_SPEC = 'BCH_2021_05_STRICT',
  BCH_2021_11_SPEC = 'BCH_2021_11',
  BCH_2021_11_STRICT_SPEC = 'BCH_2021_11_STRICT',
  BCH_2022_05_SPEC = 'BCH_2022_05',
  BCH_2022_05_STRICT_SPEC = 'BCH_2022_05_STRICT',
  BCH_2022_11_SPEC = 'BCH_2022_11',
  BCH_2022_11_STRICT_SPEC = 'BCH_2022_11_STRICT',
}

/**
 * The current strict virtual machine version used by the Bitcoin Cash (BCH)
 * network.
 */
export const instructionSetBCHCurrentStrict =
  InstructionSetBCH.BCH_2020_05_STRICT;

// eslint-disable-next-line complexity
export const getFlagsForInstructionSetBCH = (
  instructionSet: InstructionSetBCH
) => {
  switch (instructionSet) {
    case InstructionSetBCH.BCH_2019_05:
      return {
        disallowUpgradableNops: false,
        opReverseBytes: false,
        requireBugValueZero: false,
        requireMinimalEncoding: false,
        requireNullSignatureFailures: true,
      };
    case InstructionSetBCH.BCH_2019_05_STRICT:
      return {
        disallowUpgradableNops: true,
        opReverseBytes: false,
        requireBugValueZero: false,
        requireMinimalEncoding: true,
        requireNullSignatureFailures: true,
      };
    case InstructionSetBCH.BCH_2019_11:
      return {
        disallowUpgradableNops: false,
        opReverseBytes: false,
        requireBugValueZero: true,
        requireMinimalEncoding: true,
        requireNullSignatureFailures: true,
      };
    case InstructionSetBCH.BCH_2019_11_STRICT:
      return {
        disallowUpgradableNops: true,
        opReverseBytes: false,
        requireBugValueZero: true,
        requireMinimalEncoding: true,
        requireNullSignatureFailures: true,
      };
    case InstructionSetBCH.BCH_2020_05:
      return {
        disallowUpgradableNops: false,
        opReverseBytes: true,
        requireBugValueZero: false,
        requireMinimalEncoding: false,
        requireNullSignatureFailures: true,
      };
    case InstructionSetBCH.BCH_2020_05_STRICT:
      return {
        disallowUpgradableNops: true,
        opReverseBytes: true,
        requireBugValueZero: true,
        requireMinimalEncoding: true,
        requireNullSignatureFailures: true,
      };
    default:
      return new Error(
        `${instructionSet as string} is not a known instruction set.`
      ) as never;
  }
};

/**
 * Initialize a new instruction set for the BCH virtual machine.
 *
 * @param flags - an object configuring the flags for this vm (see
 * `getFlagsForInstructionSetBCH`)
 * @param sha1 - a Sha1 implementation
 * @param sha256 - a Sha256 implementation
 * @param ripemd160 - a Ripemd160 implementation
 * @param secp256k1 - a Secp256k1 implementation
 */
export const createInstructionSetBCH = ({
  flags,
  ripemd160,
  secp256k1,
  sha1,
  sha256,
}: {
  flags: {
    readonly disallowUpgradableNops: boolean;
    readonly opReverseBytes: boolean;
    readonly requireBugValueZero: boolean;
    readonly requireMinimalEncoding: boolean;
    readonly requireNullSignatureFailures: boolean;
  };
  sha1: { hash: Sha1['hash'] };
  sha256: { hash: Sha256['hash'] };
  ripemd160: { hash: Ripemd160['hash'] };
  secp256k1: {
    verifySignatureSchnorr: Secp256k1['verifySignatureSchnorr'];
    verifySignatureDERLowS: Secp256k1['verifySignatureDERLowS'];
  };
}): InstructionSet<
  AuthenticationProgramBCH,
  AuthenticationProgramStateBCH
> => ({
  clone: cloneAuthenticationProgramStateCommon,
  continue: (state: AuthenticationProgramStateBCH) =>
    state.error === undefined && state.ip < state.instructions.length,
  // eslint-disable-next-line complexity
  evaluate: (program, stateEvaluate) => {
    const { unlockingBytecode } = program.spendingTransaction.inputs[
      program.inputIndex
    ];
    const { lockingBytecode } = program.sourceOutput;
    const unlockingInstructions = parseBytecode<OpcodesBCH>(unlockingBytecode);
    const lockingInstructions = parseBytecode<OpcodesBCH>(lockingBytecode);
    const externalState = createTransactionContextCommon(program);
    const initialState = createAuthenticationProgramStateCommon<
      OpcodesBCH,
      AuthenticationErrorBCH
    >({
      instructions: unlockingInstructions,
      stack: [],
      transactionContext: externalState,
    });

    const unlockingResult =
      unlockingBytecode.length > ConsensusCommon.maximumBytecodeLength
        ? applyError<AuthenticationProgramStateBCH, AuthenticationErrorBCH>(
            AuthenticationErrorCommon.exceededMaximumBytecodeLengthUnlocking,
            initialState
          )
        : authenticationInstructionsAreMalformed(unlockingInstructions)
        ? applyError<AuthenticationProgramStateBCH, AuthenticationErrorBCH>(
            AuthenticationErrorCommon.malformedUnlockingBytecode,
            initialState
          )
        : lockingBytecode.length > ConsensusCommon.maximumBytecodeLength
        ? applyError<AuthenticationProgramStateBCH, AuthenticationErrorBCH>(
            AuthenticationErrorCommon.exceededMaximumBytecodeLengthLocking,
            initialState
          )
        : authenticationInstructionsAreMalformed(lockingInstructions)
        ? applyError<AuthenticationProgramStateBCH, AuthenticationErrorBCH>(
            AuthenticationErrorCommon.malformedLockingBytecode,
            initialState
          )
        : initialState.instructions.every((instruction) =>
            isPushOperation((instruction.opcode as unknown) as number)
          )
        ? stateEvaluate(initialState)
        : applyError<AuthenticationProgramStateBCH, AuthenticationErrorBCH>(
            AuthenticationErrorBCH.requiresPushOnly,
            initialState
          );

    if (unlockingResult.error !== undefined) {
      return unlockingResult;
    }
    const lockingResult = stateEvaluate(
      createAuthenticationProgramStateCommon<
        OpcodesBCH,
        AuthenticationErrorBCH
      >({
        instructions: lockingInstructions,
        stack: unlockingResult.stack,
        transactionContext: externalState,
      })
    );
    if (!isPayToScriptHash(lockingInstructions)) {
      return lockingResult;
    }

    const p2shStack = cloneStack(unlockingResult.stack);
    // eslint-disable-next-line functional/immutable-data
    const p2shScript = p2shStack.pop() ?? Uint8Array.of();

    if (p2shStack.length === 0 && isWitnessProgram(p2shScript)) {
      return lockingResult;
    }

    const p2shInstructions = parseBytecode<OpcodesBCH>(p2shScript);
    return authenticationInstructionsAreMalformed(p2shInstructions)
      ? {
          ...lockingResult,
          error: AuthenticationErrorBCH.malformedP2shBytecode,
        }
      : stateEvaluate(
          createAuthenticationProgramStateCommon<
            OpcodesBCH,
            AuthenticationErrorBCH
          >({
            instructions: p2shInstructions,
            stack: p2shStack,
            transactionContext: externalState,
          })
        );
  },
  operations: {
    ...commonOperations<
      OpcodesBCH,
      AuthenticationProgramStateBCH,
      AuthenticationErrorBCH
    >({ flags, ripemd160, secp256k1, sha1, sha256 }),
    ...mapOverOperations<AuthenticationProgramStateBCH>(
      bitcoinCashOperations<OpcodesBCH, AuthenticationProgramStateBCH>({
        flags,
        secp256k1,
        sha256,
      }),
      conditionallyEvaluate,
      incrementOperationCount,
      checkLimitsCommon
    ),
  },
  ...undefinedOperation(),
  verify: (state: AuthenticationProgramStateBCH) => {
    if (state.error !== undefined) {
      return state.error;
    }
    if (state.executionStack.length !== 0) {
      return AuthenticationErrorCommon.nonEmptyExecutionStack;
    }
    if (state.stack.length !== 1) {
      return AuthenticationErrorCommon.requiresCleanStack;
    }
    if (!stackItemIsTruthy(state.stack[0])) {
      return AuthenticationErrorCommon.unsuccessfulEvaluation;
    }
    return true;
  },
});
