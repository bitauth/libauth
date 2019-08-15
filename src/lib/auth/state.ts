import { Output, Transaction } from '../transaction';

import { AuthenticationErrorCommon } from './instruction-sets/common/errors';
import { AuthenticationInstruction } from './instruction-sets/instruction-sets';

/**
 * State which applies to every input in a given transaction.
 */
export interface TransactionState {
  /**
   * A.K.A. `hashPrevouts`
   *
   * The double SHA256 of the serialization of all input outpoints. (See
   * BIP143 or Bitcoin Cash's Replay Protected Sighash spec for details.)
   */
  readonly hashTransactionOutpoints: () => Uint8Array;
  /*
   * A.K.A. `hashOutputs` with `SIGHASH_ALL`
   *
   * The double SHA256 of the serialization of output amounts and locking
   * scripts. (See BIP143 or Bitcoin Cash's Replay Protected Sighash spec for
   * details.)
   */
  readonly hashTransactionOutputs: () => Uint8Array;
  /*
   * A.K.A. `hashSequence`
   *
   * The double SHA256 of the serialization of all input sequence numbers. (See
   * BIP143 or Bitcoin Cash's Replay Protected Sighash spec for details.)
   */
  readonly hashTransactionSequenceNumbers: () => Uint8Array;
  /**
   * A time or block height at which the transaction is considered valid (and
   * can be added to the block chain). This allows signers to create time-locked
   * transactions which may only become valid in the future.
   */
  // tslint:disable-next-line: no-mixed-interface
  readonly locktime: number;
  readonly version: number;
}

/**
 * The state of a single transaction input.
 */
export interface TransactionInputState extends TransactionState {
  /*
   * A.K.A. `hashOutputs` with `SIGHASH_SINGLE`
   *
   * The double SHA256 of the serialization of the output at the same index as
   * this input. If this input's index is larger than the total number of
   * outputs (such that there is no corresponding output), 32 bytes of zero
   * padding should be used instead. (See BIP143 or Bitcoin Cash's Replay
   * Protected Sighash spec for details.)
   */
  readonly hashCorrespondingOutput: () => Uint8Array;
  /**
   * The index (within the previous transaction) of the outpoint being spent by
   * this input.
   */
  // tslint:disable-next-line: no-mixed-interface
  readonly outpointIndex: number;
  /**
   * The hash/ID of the transaction from which the outpoint being spent by this
   * input originated.
   */
  readonly outpointTransactionHash: Uint8Array;
  /**
   * The value of the outpoint being spent by this input.
   */
  readonly outputValue: bigint;
  /**
   * The `sequenceNumber` associated with the input being validated. See
   * `Input.sequenceNumber` for details.
   */
  readonly sequenceNumber: number;
}

export interface MinimumProgramState<Opcodes = number> {
  readonly instructions: ReadonlyArray<AuthenticationInstruction<Opcodes>>;
  /**
   * Instruction Pointer – the array index of `instructions` which will be read
   * to identify the next instruction. Once `ip` exceeds the last index of
   * `instructions` (`ip === instructions.length`), evaluation is complete.
   */
  // tslint:disable-next-line:readonly-keyword
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
  // tslint:disable-next-line:readonly-keyword
  error?: CommonError | InstructionSetError;
}

export interface AuthenticationProgramCommon {
  inputIndex: number;
  sourceOutput: Output;
  spendingTransaction: Transaction;
}

// tslint:disable-next-line:no-empty-interface
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
  // tslint:disable-next-line:readonly-keyword
  lastCodeSeparator: number;
  // tslint:disable-next-line:readonly-keyword
  operationCount: number;
  // tslint:disable-next-line:readonly-keyword
  signatureOperationsCount: number;
}

export interface AuthenticationProgramStateCommon<Opcodes, Errors>
  extends AuthenticationProgramInternalStateCommon<Opcodes, Errors>,
    AuthenticationProgramExternalStateCommon {}
