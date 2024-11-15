import type { AuthenticationErrorBchSpec } from '../../lib.js';

/**
 * A mapping of Libauth VM error messages to BCHN error messages in
 * standard validation.
 */
export const libauthErrorPrefixToBchnErrorStandard: {
  [key in keyof typeof AuthenticationErrorBchSpec]: string;
} = {
  calledReserved:
    'mandatory-script-verify-flag-failed (Opcode missing or not understood)',
  calledReturn:
    'mandatory-script-verify-flag-failed (OP_RETURN was encountered)',
  calledUpgradableNop:
    'non-mandatory-script-verify-flag (NOPx reserved for soft-fork upgrades)',
  checkSequenceUnavailable: '',
  disabledOpcode: '',
  divisionByZero: '',
  emptyAlternateStack: '',
  emptyStack:
    'mandatory-script-verify-flag-failed (Operation not valid with the current stack size)',
  exceededMaximumBytecodeLengthLocking: 'Missing inputs',
  exceededMaximumBytecodeLengthUnlocking:
    'mandatory-script-verify-flag-failed (Script is too big)',
  exceededMaximumControlStackDepth: '',
  exceededMaximumOperationCount:
    'mandatory-script-verify-flag-failed (Operation limit exceeded)',
  exceededMaximumSignatureCheckCount:
    'non-mandatory-script-verify-flag (Input SigChecks limit exceeded)',
  exceededMaximumStackDepth: '',
  exceededMaximumStackItemLength:
    'mandatory-script-verify-flag-failed (Push value size limit exceeded)',
  exceededMaximumVmNumberByteLength: '',
  exceedsMaximumMultisigPublicKeyCount: '',
  excessiveHashing:
    'mandatory-script-verify-flag-failed (Hash iteration limit exceeded)',
  excessiveLooping: '',
  excessiveOperationCost:
    'mandatory-script-verify-flag-failed (VM cost limit exceeded)',
  failedVerify:
    'mandatory-script-verify-flag-failed (Script failed an OP_EQUALVERIFY operation)',
  incompatibleLocktimeType: '',
  incompatibleSequenceType: '',
  insufficientLength: '',
  insufficientPublicKeys: '',
  invalidCheckBitsSignatureCount:
    'mandatory-script-verify-flag-failed (Invalid number of bit set in OP_CHECKMULTISIG)',
  invalidCheckBitsValue: '',
  invalidNaturalNumber: '',
  invalidPublicKeyEncoding: '',
  invalidSignatureEncoding: '',
  invalidSplitIndex: '',
  invalidStackIndex: '',
  invalidTransactionInputIndex: '',
  invalidTransactionOutputIndex:
    'mandatory-script-verify-flag-failed (The specified transaction output index is out of range)',
  invalidTransactionUtxoIndex: '',
  invalidVmNumber:
    'mandatory-script-verify-flag-failed (Number encoding must be minimal)',
  locktimeDisabled: '',
  malformedLockingBytecode: '',
  malformedP2shBytecode: '',
  malformedPush: '',
  malformedUnlockingBytecode: 'scriptsig-not-pushonly',
  mismatchedBitwiseOperandLength: '',
  negativeLocktime: '',
  nonEmptyControlStackLockingBytecode: '',
  nonEmptyControlStackRedeemBytecode: '',
  nonEmptyControlStackUnlockingBytecode: '',
  nonMinimalPush: '',
  nonNullSignatureFailure:
    'mandatory-script-verify-flag-failed (Signature must be zero for failed CHECK(MULTI)SIG operation)',
  nonSchnorrSizedSignatureInSchnorrMultiSig:
    'mandatory-script-verify-flag-failed (Only Schnorr signatures allowed in this operation)',
  overflowsVmNumberRange: '',
  requiresCleanStackLockingBytecode:
    'non-mandatory-script-verify-flag (Extra items left on stack after execution)',
  requiresCleanStackRedeemBytecode:
    'non-mandatory-script-verify-flag (Extra items left on stack after execution)',
  requiresPushOnly:
    'mandatory-script-verify-flag-failed (Data push larger than necessary)',
  schnorrSizedSignatureInEcdsaMultiSig:
    'mandatory-script-verify-flag-failed (Signature cannot be 65 bytes in CHECKMULTISIG)',
  tokenValidationExcessiveAmount: '',
  tokenValidationExcessiveCommitmentLength: '',
  tokenValidationExcessiveImmutableTokens: '',
  tokenValidationExcessiveMutableTokens: '',
  tokenValidationInvalidFungibleMint: '',
  tokenValidationInvalidMintingToken: '',
  tokenValidationOutputsExceedInputs: '',
  unexpectedElse: '',
  unexpectedEndIf: '',
  unexpectedUntil: '',
  unexpectedUntilMissingEndIf: '',
  unknownOpcode:
    'mandatory-script-verify-flag-failed (Attempted to use a disabled opcode)',
  unmatchedP2shRedeemBytecode:
    'mandatory-script-verify-flag-failed (Script evaluated without error but finished with a false/empty top stack element)',
  unmatchedSequenceDisable: '',
  unsatisfiedLocktime: '',
  unsatisfiedSequenceNumber: '',
  unsuccessfulEvaluation:
    'mandatory-script-verify-flag-failed (Script evaluated without error but finished with a false/empty top stack element)',
  verifyFailedDuplicateSourceOutputs: '',
  verifyFailedExcessiveLength: '',
  verifyFailedExcessiveSigChecks: '',
  verifyFailedInputsExceedMaxMoney: '',
  verifyFailedInsufficientLength: '',
  verifyFailedInvalidVersion: '',
  verifyFailedMismatchedSourceOutputs: '',
  verifyFailedNoInputs: '',
  verifyFailedNoOutputs: '',
  verifyFailedOutputsExceedInputs: '',
  verifyFailedOutputsExceedMaxMoney: '',
  verifyStandardFailedDustOutput: '',
  verifyStandardFailedExcessiveDataCarrierBytes: 'oversize-op-return',
  verifyStandardFailedExcessiveLength: '',
  verifyStandardFailedExcessiveUnlockingBytecodeLength: 'scriptsig-size',
  verifyStandardFailedNonPushUnlockingBytecode: 'scriptsig-not-pushonly',
  verifyStandardFailedNonstandardOutput: '',
  verifyStandardFailedNonstandardSourceOutput: 'scriptsig-not-pushonly',
};

/**
 * A mapping of Libauth VM error messages to BCHN error messages in
 * nonstandard validation.
 */
export const libauthErrorPrefixToBchnErrorNonstandard: {
  [key in keyof typeof AuthenticationErrorBchSpec]: string;
} = {
  calledReserved:
    'mandatory-script-verify-flag-failed (Opcode missing or not understood)',
  calledReturn:
    'mandatory-script-verify-flag-failed (OP_RETURN was encountered)',
  calledUpgradableNop:
    'non-mandatory-script-verify-flag (NOPx reserved for soft-fork upgrades)',
  checkSequenceUnavailable: '',
  disabledOpcode: '',
  divisionByZero: '',
  emptyAlternateStack: '',
  emptyStack:
    'mandatory-script-verify-flag-failed (Operation not valid with the current stack size)',
  exceededMaximumBytecodeLengthLocking: 'Missing inputs',
  exceededMaximumBytecodeLengthUnlocking:
    'mandatory-script-verify-flag-failed (Script is too big)',
  exceededMaximumControlStackDepth: '',
  exceededMaximumOperationCount:
    'mandatory-script-verify-flag-failed (Operation limit exceeded)',
  exceededMaximumSignatureCheckCount:
    'non-mandatory-script-verify-flag (Input SigChecks limit exceeded)',
  exceededMaximumStackDepth: '',
  exceededMaximumStackItemLength:
    'mandatory-script-verify-flag-failed (Push value size limit exceeded)',
  exceededMaximumVmNumberByteLength: '',
  exceedsMaximumMultisigPublicKeyCount: '',
  excessiveHashing:
    'mandatory-script-verify-flag-failed (Hash iteration limit exceeded)',
  excessiveLooping: '',
  excessiveOperationCost:
    'mandatory-script-verify-flag-failed (VM cost limit exceeded)',
  failedVerify:
    'mandatory-script-verify-flag-failed (Script failed an OP_EQUALVERIFY operation)',
  incompatibleLocktimeType: '',
  incompatibleSequenceType: '',
  insufficientLength: '',
  insufficientPublicKeys: '',
  invalidCheckBitsSignatureCount:
    'mandatory-script-verify-flag-failed (Invalid number of bit set in OP_CHECKMULTISIG)',
  invalidCheckBitsValue: '',
  invalidNaturalNumber: '',
  invalidPublicKeyEncoding: '',
  invalidSignatureEncoding: '',
  invalidSplitIndex: '',
  invalidStackIndex: '',
  invalidTransactionInputIndex: '',
  invalidTransactionOutputIndex:
    'mandatory-script-verify-flag-failed (The specified transaction output index is out of range)',
  invalidTransactionUtxoIndex: '',
  invalidVmNumber:
    'mandatory-script-verify-flag-failed (Number encoding must be minimal)',
  locktimeDisabled: '',
  malformedLockingBytecode: '',
  malformedP2shBytecode: '',
  malformedPush: '',
  malformedUnlockingBytecode:
    'mandatory-script-verify-flag-failed (Opcode missing or not understood)',
  mismatchedBitwiseOperandLength: '',
  negativeLocktime: '',
  nonEmptyControlStackLockingBytecode: '',
  nonEmptyControlStackRedeemBytecode: '',
  nonEmptyControlStackUnlockingBytecode: '',
  nonMinimalPush: '',
  nonNullSignatureFailure:
    'mandatory-script-verify-flag-failed (Signature must be zero for failed CHECK(MULTI)SIG operation)',
  nonSchnorrSizedSignatureInSchnorrMultiSig:
    'mandatory-script-verify-flag-failed (Only Schnorr signatures allowed in this operation)',
  overflowsVmNumberRange: '',
  requiresCleanStackLockingBytecode:
    'non-mandatory-script-verify-flag (Extra items left on stack after execution)',
  requiresCleanStackRedeemBytecode:
    'non-mandatory-script-verify-flag (Extra items left on stack after execution)',
  requiresPushOnly:
    'mandatory-script-verify-flag-failed (Data push larger than necessary)',
  schnorrSizedSignatureInEcdsaMultiSig:
    'mandatory-script-verify-flag-failed (Signature cannot be 65 bytes in CHECKMULTISIG)',
  tokenValidationExcessiveAmount: '',
  tokenValidationExcessiveCommitmentLength: '',
  tokenValidationExcessiveImmutableTokens: '',
  tokenValidationExcessiveMutableTokens: '',
  tokenValidationInvalidFungibleMint: '',
  tokenValidationInvalidMintingToken: '',
  tokenValidationOutputsExceedInputs: '',
  unexpectedElse: '',
  unexpectedEndIf: '',
  unexpectedUntil: '',
  unexpectedUntilMissingEndIf: '',
  unknownOpcode:
    'mandatory-script-verify-flag-failed (Attempted to use a disabled opcode)',
  unmatchedP2shRedeemBytecode:
    'mandatory-script-verify-flag-failed (Script evaluated without error but finished with a false/empty top stack element)',
  unmatchedSequenceDisable: '',
  unsatisfiedLocktime: '',
  unsatisfiedSequenceNumber: '',
  unsuccessfulEvaluation:
    'mandatory-script-verify-flag-failed (Script evaluated without error but finished with a false/empty top stack element)',
  verifyFailedDuplicateSourceOutputs: '',
  verifyFailedExcessiveLength: '',
  verifyFailedExcessiveSigChecks: '',
  verifyFailedInputsExceedMaxMoney: '',
  verifyFailedInsufficientLength: '',
  verifyFailedInvalidVersion: '',
  verifyFailedMismatchedSourceOutputs: '',
  verifyFailedNoInputs: '',
  verifyFailedNoOutputs: '',
  verifyFailedOutputsExceedInputs: '',
  verifyFailedOutputsExceedMaxMoney: '',
  verifyStandardFailedDustOutput: '',
  verifyStandardFailedExcessiveDataCarrierBytes: 'oversize-op-return',
  verifyStandardFailedExcessiveLength: '',
  verifyStandardFailedExcessiveUnlockingBytecodeLength: 'scriptsig-size',
  verifyStandardFailedNonPushUnlockingBytecode: 'scriptsig-not-pushonly',
  verifyStandardFailedNonstandardOutput: '',
  verifyStandardFailedNonstandardSourceOutput: 'bad-txns-nonstandard-inputs',
};
