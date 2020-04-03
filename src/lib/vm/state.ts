import { Output, Transaction } from '../transaction/transaction-types';

import { AuthenticationErrorCommon } from './instruction-sets/common/errors';
import { AuthenticationInstruction } from './instruction-sets/instruction-sets-types';

/**
 * State which applies to every input in a given transaction.
 */
export interface TransactionState {
  /**
   * A time or block height at which the transaction is considered valid (and
   * can be added to the block chain). This allows signers to create time-locked
   * transactions which may only become valid in the future.
   */
  readonly locktime: number;
  /**
   * A.K.A. the serialization for `hashPrevouts`
   *
   * The signing serialization of all input outpoints. (See BIP143 or Bitcoin
   * Cash's Replay Protected Sighash spec for details.)
   */
  readonly transactionOutpoints: Uint8Array;
  /*
   * A.K.A. the serialization for `hashOutputs` with `SIGHASH_ALL`
   *
   * The signing serialization of output amounts and locking scripts. (See
   * BIP143 or Bitcoin Cash's Replay Protected Sighash spec for details.)
   */
  readonly transactionOutputs: Uint8Array;
  /*
   * A.K.A. the serialization for `hashSequence`
   *
   * The signing serialization of all input sequence numbers. (See BIP143 or
   * Bitcoin Cash's Replay Protected Sighash spec for details.)
   */
  readonly transactionSequenceNumbers: Uint8Array;
  readonly version: number;
}

/**
 * The state of a single transaction input.
 */
export interface TransactionInputState extends TransactionState {
  /*
   * A.K.A. the serialization for `hashOutputs` with `SIGHASH_SINGLE`
   *
   * The signing serialization of the output at the same index as this input. If
   * this input's index is larger than the total number of outputs (such that
   * there is no corresponding output), this should be `undefined`. (See BIP143
   * or Bitcoin Cash's Replay Protected Sighash spec for details.)
   */
  readonly correspondingOutput?: Uint8Array;
  /**
   * The index (within the previous transaction) of the outpoint being spent by
   * this input.
   */
  readonly outpointIndex: number;
  /**
   * The hash/ID of the transaction from which the outpoint being spent by this
   * input originated.
   */
  readonly outpointTransactionHash: Uint8Array;
  /**
   * The value of the outpoint being spent by this input.
   */
  readonly outputValue: number;
  /**
   * The `sequenceNumber` associated with the input being validated. See
   * `Input.sequenceNumber` for details.
   */
  readonly sequenceNumber: number;
}

export interface MinimumProgramState<Opcodes = number> {
  readonly instructions: readonly AuthenticationInstruction<Opcodes>[];
  /**
   * Instruction Pointer – the array index of `instructions` which will be read
   * to identify the next instruction. Once `ip` exceeds the last index of
   * `instructions` (`ip === instructions.length`), evaluation is complete.
   */
  ip: number;
}

export interface StackState<StackType = Uint8Array> {
  stack: StackType[];
}

export interface AlternateStackState<StackType = Uint8Array> {
  alternateStack: StackType[];
}

export interface ExecutionStackState {
  /**
   * An array of boolean values representing the current execution status of the
   * program. This allows the state to track nested conditional branches.
   *
   * The `OP_IF` and `OP_NOTIF` operations push a new boolean onto the
   * `executionStack`, `OP_ELSE` flips the top boolean, and `OP_ENDIF` removes
   * the top boolean from the `executionStack`.
   *
   * Other instructions are only evaluated if `executionStack` contains no
   * `false` items.
   *
   * A.K.A. `vfExec` in the C++ implementation.
   */
  executionStack: boolean[];
}

export interface ErrorState<
  InstructionSetError,
  CommonError = AuthenticationErrorCommon
> {
  error?: CommonError | InstructionSetError;
}

export interface AuthenticationProgramCommon {
  inputIndex: number;
  sourceOutput: Output;
  spendingTransaction: Transaction;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface AuthenticationProgramExternalStateCommon
  extends TransactionInputState {}

export interface AuthenticationProgramInternalStateCommon<
  Opcodes,
  InstructionSetError,
  StackType = Uint8Array
>
  extends MinimumProgramState<Opcodes>,
    StackState<StackType>,
    AlternateStackState<StackType>,
    ExecutionStackState,
    ErrorState<InstructionSetError> {
  /**
   * The `lastCodeSeparator` indicates the index of the most recently executed
   * `OP_CODESEPARATOR` instruction. In each of the signing serialization
   * algorithms, the `instructions` are sliced at `lastCodeSeparator`, and the
   * subarray is re-serialized. The resulting bytecode is called the
   * `scriptCode`, and is part of the data hashed to create the signing
   * serialization digest.
   *
   * By default, this is `-1`, which indicates that the whole `instructions`
   * array is included in the signing serialization.
   */
  lastCodeSeparator: number;
  operationCount: number;
  signatureOperationsCount: number;
}

export interface AuthenticationProgramStateCommon<Opcodes, Errors>
  extends AuthenticationProgramInternalStateCommon<Opcodes, Errors>,
    AuthenticationProgramExternalStateCommon {}
