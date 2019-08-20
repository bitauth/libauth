import { Ripemd160, Secp256k1, Sha1, Sha256 } from '../../../crypto/crypto';
import { InstructionSet } from '../../virtual-machine';
import {
  conditionallyEvaluate,
  incrementOperationCount,
  mapOverOperations
} from '../common/combinators';
import {
  applyError,
  AuthenticationErrorCommon,
  checkLimitsCommon,
  cloneAuthenticationProgramStateCommon,
  cloneStack,
  commonOperations,
  ConsensusCommon,
  createAuthenticationProgramExternalStateCommon,
  createAuthenticationProgramStateCommon,
  stackItemIsTruthy,
  undefinedOperation
} from '../common/common';
import {
  AuthenticationInstruction,
  authenticationInstructionsAreMalformed,
  parseBytecode
} from '../instruction-sets';

import { AuthenticationErrorBCH } from './bch-errors';
import { OpcodesBCH } from './bch-opcodes';
import { bitcoinCashOperations } from './bch-operations';
import {
  AuthenticationProgramBCH,
  AuthenticationProgramStateBCH
} from './bch-types';

export { OpcodesBCH };

const enum PayToScriptHash {
  length = 3,
  lastElement = 2
}

export const isPayToScriptHash = <Opcodes>(
  verificationInstructions: ReadonlyArray<AuthenticationInstruction<Opcodes>>
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
  versionAndLengthBytes = 2
}

/**
 * Test a stack item for the SegWit Recovery Rules activated in `BCH_2019_05`.
 *
 * @param bytecode the stack item to test
 */
// tslint:disable-next-line: cyclomatic-complexity
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
 */
export enum InstructionSetBCH {
  BCH_2019_05 = 'BCH_2019_05',
  BCH_2019_05_STRICT = 'BCH_2019_05_STRICT',
  BCH_2019_11_SPEC = 'BCH_2019_11',
  BCH_2019_11_STRICT_SPEC = 'BCH_2019_11_STRICT'
}

export const instructionSetBCHCurrentStrict =
  InstructionSetBCH.BCH_2019_05_STRICT;

export const getFlagsForInstructionSetBCH = (
  instructionSet: InstructionSetBCH
) => {
  // tslint:disable-next-line: switch-default
  switch (instructionSet) {
    case InstructionSetBCH.BCH_2019_05:
      return {
        disallowUpgradableNops: false,
        requireBugValueZero: false,
        requireMinimalEncoding: false,
        requireNullSignatureFailures: true
      };
    case InstructionSetBCH.BCH_2019_05_STRICT:
      return {
        disallowUpgradableNops: true,
        requireBugValueZero: false,
        requireMinimalEncoding: true,
        requireNullSignatureFailures: true
      };
    case InstructionSetBCH.BCH_2019_11_SPEC:
      return {
        disallowUpgradableNops: false,
        requireBugValueZero: true,
        requireMinimalEncoding: true,
        requireNullSignatureFailures: true
      };
    case InstructionSetBCH.BCH_2019_11_STRICT_SPEC:
      return {
        disallowUpgradableNops: true,
        requireBugValueZero: true,
        requireMinimalEncoding: true,
        requireNullSignatureFailures: true
      };
  }
};

/**
 * Initialize a new instruction set for the BCH virtual machine.
 *
 * @param flags an object configuring the flags for this vm (see
 * `getFlagsForInstructionSetBCH`)
 * @param sha1 a Sha1 implementation
 * @param sha256 a Sha256 implementation
 * @param ripemd160 a Ripemd160 implementation
 * @param secp256k1 a Secp256k1 implementation
 */
// tslint:disable-next-line: variable-name
export const createInstructionSetBCH = (
  flags: {
    disallowUpgradableNops: boolean;
    requireBugValueZero: boolean;
    requireMinimalEncoding: boolean;
    requireNullSignatureFailures: boolean;
  },
  sha1: Sha1,
  sha256: Sha256,
  ripemd160: Ripemd160,
  secp256k1: Secp256k1
): InstructionSet<AuthenticationProgramBCH, AuthenticationProgramStateBCH> => ({
  clone: cloneAuthenticationProgramStateCommon,
  continue: (state: AuthenticationProgramStateBCH) =>
    state.error === undefined && state.ip < state.instructions.length,
  // tslint:disable-next-line: cyclomatic-complexity
  evaluate: (program, stateEvaluate) => {
    const unlockingBytecode =
      program.spendingTransaction.inputs[program.inputIndex].unlockingBytecode;
    const lockingBytecode = program.sourceOutput.lockingBytecode;
    const unlockingInstructions = parseBytecode<OpcodesBCH>(unlockingBytecode);
    const lockingInstructions = parseBytecode<OpcodesBCH>(lockingBytecode);
    const externalState = createAuthenticationProgramExternalStateCommon(
      program,
      sha256
    );
    const initialState = createAuthenticationProgramStateCommon<
      OpcodesBCH,
      AuthenticationErrorBCH
    >(unlockingInstructions, [], externalState);

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
        : initialState.instructions.every(instruction =>
            isPushOperation((instruction.opcode as unknown) as number)
          )
        ? stateEvaluate(initialState)
        : applyError<AuthenticationProgramStateBCH, AuthenticationErrorBCH>(
            AuthenticationErrorBCH.requiresPushOnly,
            initialState
          );

    // tslint:disable-next-line:no-if-statement
    if (unlockingResult.error !== undefined) {
      return unlockingResult;
    }
    const lockingResult = stateEvaluate(
      createAuthenticationProgramStateCommon<
        OpcodesBCH,
        AuthenticationErrorBCH
      >(lockingInstructions, unlockingResult.stack, externalState)
    );
    // tslint:disable-next-line:no-if-statement
    if (!isPayToScriptHash(lockingInstructions)) {
      return lockingResult;
    }

    const p2shStack = cloneStack(unlockingResult.stack);
    // tslint:disable-next-line: strict-boolean-expressions
    const p2shScript = p2shStack.pop() || Uint8Array.of();

    // tslint:disable-next-line: no-if-statement
    if (p2shStack.length === 0 && isWitnessProgram(p2shScript)) {
      return lockingResult;
    }

    const p2shInstructions = parseBytecode<OpcodesBCH>(p2shScript);
    return authenticationInstructionsAreMalformed(p2shInstructions)
      ? {
          ...lockingResult,
          error: AuthenticationErrorBCH.malformedP2shBytecode
        }
      : stateEvaluate(
          createAuthenticationProgramStateCommon<
            OpcodesBCH,
            AuthenticationErrorBCH
          >(p2shInstructions, p2shStack, externalState)
        );
  },
  operations: {
    ...commonOperations<
      OpcodesBCH,
      AuthenticationProgramStateBCH,
      AuthenticationErrorBCH
    >(sha1, sha256, ripemd160, secp256k1, flags),
    ...mapOverOperations<AuthenticationProgramStateBCH>(
      bitcoinCashOperations<OpcodesBCH, AuthenticationProgramStateBCH>(
        sha256,
        secp256k1,
        flags
      ),
      conditionallyEvaluate,
      incrementOperationCount,
      checkLimitsCommon
    )
  },
  ...undefinedOperation(),
  verify: (state: AuthenticationProgramStateBCH) =>
    state.error === undefined &&
    state.executionStack.length === 0 &&
    state.stack.length === 1 &&
    stackItemIsTruthy(state.stack[0])
});
