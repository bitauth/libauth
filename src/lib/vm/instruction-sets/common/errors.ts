import { formatError } from '../../../format/format.js';
import type { AuthenticationProgramStateError } from '../../../lib.js';

export enum AuthenticationErrorCommon {
  calledReserved = 'Program called an unassigned, reserved operation.',
  calledReturn = 'Program called an OP_RETURN operation.',
  calledUpgradableNop = 'Program called a disallowed upgradable non-operation (OP_NOP1-OP_NOP10).',
  checkSequenceUnavailable = 'Program called an OP_CHECKSEQUENCEVERIFY operation, but OP_CHECKSEQUENCEVERIFY requires transaction version 2 or higher.',
  disabledOpcode = 'Program contains a disabled opcode.',
  divisionByZero = 'Program attempted to divide a number by zero.',
  emptyAlternateStack = 'Tried to read from an empty alternate stack.',
  emptyStack = 'Tried to read from an empty stack.',
  exceededMaximumBytecodeLengthLocking = 'The provided locking bytecode exceeds the maximum bytecode length (10,000 bytes).',
  exceededMaximumBytecodeLengthUnlocking = 'The provided unlocking bytecode exceeds the maximum bytecode length (10,000 bytes).',
  exceededMaximumVmNumberLength = 'Program attempted an OP_BIN2NUM operation on a byte sequence that cannot be encoded within the maximum VM Number length.',
  exceededMaximumStackDepth = 'Program exceeded the maximum stack depth (1,000 items).',
  exceededMaximumStackItemLength = 'Program attempted to push a stack item that exceeded the maximum stack item length (520 bytes).',
  exceededMaximumOperationCount = 'Program exceeded the maximum operation count (201 operations).',
  exceedsMaximumMultisigPublicKeyCount = 'Program called an OP_CHECKMULTISIG that exceeds the maximum public key count (20 public keys).',
  failedVerify = 'Program failed an OP_VERIFY operation.',
  invalidStackIndex = 'Tried to read from an invalid stack index.',
  incompatibleLocktimeType = 'Program called an OP_CHECKLOCKTIMEVERIFY operation with an incompatible locktime type. The transaction locktime and required locktime must both refer to either a block height or a block time.',
  incompatibleSequenceType = 'Program called an OP_CHECKSEQUENCEVERIFY operation with an incompatible sequence type flag. The input sequence number and required sequence number must both use the same sequence locktime type.',
  insufficientLength = 'Program called an OP_NUM2BIN operation with an insufficient byte length to re-encode the provided number.',
  insufficientPublicKeys = 'Program called an OP_CHECKMULTISIG operation that requires signatures from more public keys than are provided.',
  invalidNaturalNumber = 'Invalid input: the key/signature count inputs for OP_CHECKMULTISIG require a natural number (n > 0).',
  invalidProtocolBugValue = 'The OP_CHECKMULTISIG protocol bug value must be a VM Number 0 (to comply with the "NULLDUMMY" rule).',
  invalidPublicKeyEncoding = 'Encountered an improperly encoded public key.',
  invalidVmNumber = 'Invalid input: this operation requires a valid VM Number.',
  invalidSignatureEncoding = 'Encountered an improperly encoded signature.',
  invalidSplitIndex = 'Program called an OP_SPLIT operation with an invalid index.',
  invalidTransactionInputIndex = 'Program attempted to read from an invalid transaction input index.',
  invalidTransactionOutputIndex = 'Program attempted to read from an invalid transaction output index.',
  invalidTransactionUtxoIndex = 'Program attempted to read from an invalid transaction UTXO index.',
  locktimeDisabled = 'Program called an OP_CHECKLOCKTIMEVERIFY operation, but locktime is disabled for this transaction.',
  mismatchedBitwiseOperandLength = 'Program attempted a bitwise operation on operands of different lengths.',
  malformedLockingBytecode = 'The provided locking bytecode is malformed.',
  malformedP2shBytecode = 'Redeem bytecode was malformed prior to P2SH evaluation.',
  malformedPush = 'Program must be long enough to push the requested number of bytes.',
  malformedUnlockingBytecode = 'The provided unlocking bytecode is malformed.',
  negativeLocktime = 'Program called an OP_CHECKLOCKTIMEVERIFY or OP_CHECKSEQUENCEVERIFY operation with a negative locktime.',
  nonEmptyControlStack = 'The active bytecode completed with a non-empty control stack (missing `OP_ENDIF`).',
  nonMinimalPush = 'Push operations must use the smallest possible encoding.',
  nonNullSignatureFailure = 'Program failed a signature verification with a non-null signature (violating the "NULLFAIL" rule).',
  overflowsVmNumberRange = 'Program attempted an arithmetic operation which exceeds the range of VM Numbers.',
  requiresCleanStack = 'Program completed with an unexpected number of items on the stack (must be exactly 1).',
  requiresPushOnly = 'Unlocking bytecode may contain only push operations.',
  schnorrSizedSignatureInCheckMultiSig = 'Program used a schnorr-sized signature (65 bytes) in an OP_CHECKMULTISIG operation.',
  unexpectedElse = 'Encountered an OP_ELSE outside of an OP_IF ... OP_ENDIF block.',
  unexpectedEndIf = 'Encountered an OP_ENDIF that is not following a matching OP_IF.',
  unknownOpcode = 'Called an unknown opcode.',
  unmatchedSequenceDisable = "Program called an OP_CHECKSEQUENCEVERIFY operation requiring the disable flag, but the input's sequence number is missing the disable flag.",
  unsatisfiedLocktime = "Program called an OP_CHECKLOCKTIMEVERIFY operation that requires a locktime greater than the transaction's locktime.",
  unsatisfiedSequenceNumber = "Program called an OP_CHECKSEQUENCEVERIFY operation that requires a sequence number greater than the input's sequence number.",
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
export const applyError = <State extends AuthenticationProgramStateError>(
  state: State,
  errorType: string,
  errorDetails?: string,
): State => ({
  ...state,
  error: state.error ?? formatError(errorType, errorDetails),
});
