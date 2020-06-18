import { AuthenticationProgramStateError } from '../../vm-types';

export enum AuthenticationErrorCommon {
  calledReserved = 'Program called an unassigned, reserved operation.',
  calledReturn = 'Program called an OP_RETURN operation.',
  calledUpgradableNop = 'Program called a disallowed upgradable non-operation (OP_NOP1-OP_NOP10).',
  checkSequenceUnavailable = 'Program called an OP_CHECKSEQUENCEVERIFY operation, but OP_CHECKSEQUENCEVERIFY requires transaction version 2 or higher.',
  disabledOpcode = 'Program contains a disabled opcode.',
  emptyAlternateStack = 'Tried to read from an empty alternate stack.',
  emptyStack = 'Tried to read from an empty stack.',
  exceededMaximumBytecodeLengthLocking = 'The provided locking bytecode exceeds the maximum bytecode length (10,000 bytes).',
  exceededMaximumBytecodeLengthUnlocking = 'The provided unlocking bytecode exceeds the maximum bytecode length (10,000 bytes).',
  exceededMaximumStackDepth = 'Program exceeded the maximum stack depth (1,000 items).',
  exceededMaximumOperationCount = 'Program exceeded the maximum operation count (201 operations).',
  exceedsMaximumMultisigPublicKeyCount = 'Program called an OP_CHECKMULTISIG which exceeds the maximum public key count (20 public keys).',
  exceedsMaximumPush = 'Push exceeds the push size limit of 520 bytes.',
  failedVerify = 'Program failed an OP_VERIFY operation.',
  invalidStackIndex = 'Tried to read from an invalid stack index.',
  incompatibleLocktimeType = 'Program called an OP_CHECKLOCKTIMEVERIFY operation with an incompatible locktime type. The transaction locktime and required locktime must both refer to either a block height or a block time.',
  incompatibleSequenceType = 'Program called an OP_CHECKSEQUENCEVERIFY operation with an incompatible sequence type flag. The input sequence number and required sequence number must both use the same sequence locktime type.',
  insufficientPublicKeys = 'Program called an OP_CHECKMULTISIG operation which requires signatures from more public keys than are provided.',
  invalidNaturalNumber = 'Invalid input: the key/signature count inputs for OP_CHECKMULTISIG require a natural number (n > 0).',
  invalidProtocolBugValue = 'The OP_CHECKMULTISIG protocol bug value must be a Script Number 0 (to comply with the "NULLDUMMY" rule).',
  invalidPublicKeyEncoding = 'Encountered an improperly encoded public key.',
  invalidScriptNumber = 'Invalid input: this operation requires a valid Script Number.',
  invalidSignatureEncoding = 'Encountered an improperly encoded signature.',
  locktimeDisabled = 'Program called an OP_CHECKLOCKTIMEVERIFY operation, but locktime is disabled for this transaction.',
  malformedLockingBytecode = 'The provided locking bytecode is malformed.',
  malformedPush = 'Program must be long enough to push the requested number of bytes.',
  malformedUnlockingBytecode = 'The provided unlocking bytecode is malformed.',
  negativeLocktime = 'Program called an OP_CHECKLOCKTIMEVERIFY or OP_CHECKSEQUENCEVERIFY operation with a negative locktime.',
  nonEmptyExecutionStack = 'Program completed with a non-empty execution stack (missing `OP_ENDIF`).',
  nonMinimalPush = 'Push operations must use the smallest possible encoding.',
  nonNullSignatureFailure = 'Program failed a signature verification with a non-null signature (violating the "NULLFAIL" rule).',
  requiresCleanStack = 'Program completed with an unexpected number of items on the stack (must be exactly 1).',
  schnorrSizedSignatureInCheckMultiSig = 'Program used a schnorr-sized signature (65 bytes) in an OP_CHECKMULTISIG operation.',
  unexpectedElse = 'Encountered an OP_ELSE outside of an OP_IF ... OP_ENDIF block.',
  unexpectedEndIf = 'Encountered an OP_ENDIF which is not following a matching OP_IF.',
  unknownOpcode = 'Called an unknown opcode.',
  unmatchedSequenceDisable = "Program called an OP_CHECKSEQUENCEVERIFY operation requiring the disable flag, but the input's sequence number is missing the disable flag.",
  unsatisfiedLocktime = "Program called an OP_CHECKLOCKTIMEVERIFY operation which requires a locktime greater than the transaction's locktime.",
  unsatisfiedSequenceNumber = "Program called an OP_CHECKSEQUENCEVERIFY operation which requires a sequence number greater than the input's sequence number.",
  unsuccessfulEvaluation = 'Unsuccessful evaluation: completed with a non-truthy value on top of the stack.',
}

/**
 * Applies the `error` to a `state`.
 *
 * @remarks
 * If the state already has an error, this method does not override it.
 * (Evaluation should end after the first encountered error, so further errors
 * aren't relevant.)
 */
export const applyError = <
  State extends AuthenticationProgramStateError<Errors>,
  Errors
>(
  error: AuthenticationErrorCommon | Errors,
  state: State
): State => ({
  ...state,
  error: state.error === undefined ? error : state.error,
});
