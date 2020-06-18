import {
  Input,
  Output,
  Transaction,
  TransactionContextCommon,
} from '../transaction/transaction-types';

import { AuthenticationErrorCommon } from './instruction-sets/common/errors';
import { AuthenticationInstruction } from './instruction-sets/instruction-sets-types';

export interface AuthenticationProgramStateMinimum<Opcodes = number> {
  /**
   * The full list of instructions to be evaluated by the virtual machine.
   */
  readonly instructions: readonly AuthenticationInstruction<Opcodes>[];
  /**
   * Instruction Pointer – the array index of `instructions` which will be read
   * to identify the next instruction. Once `ip` exceeds the last index of
   * `instructions` (`ip === instructions.length`), evaluation is complete.
   */
  ip: number;
}

export interface AuthenticationProgramStateStack<StackType = Uint8Array> {
  /**
   * The stack is the primary workspace of the virtual machine. Most virtual
   * machine operations create, read, update, or delete bytecode values
   * held on the stack.
   */
  stack: StackType[];
}

export interface AuthenticationProgramStateAlternateStack<
  StackType = Uint8Array
> {
  /**
   * The "alternate stack" is separate stack on which `OP_TOALTSTACK` and
   * `OP_FROMALTSTACK` operate in bitcoin virtual machines.
   */
  alternateStack: StackType[];
}

export interface AuthenticationProgramStateExecutionStack {
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

export interface AuthenticationProgramStateError<
  InstructionSetError,
  CommonError = AuthenticationErrorCommon
> {
  /**
   * If present, the error returned by the most recent virtual machine
   * operation.
   */
  error?: CommonError | InstructionSetError;
}

type MakeOptional<T, K extends keyof T> = Partial<Pick<T, K>> & Omit<T, K>;

/**
 * A reduced version of `AuthenticationProgramCommon` including only the
 * information required to generate a `TransactionContextCommon`.
 */
export interface AuthenticationProgramTransactionContextCommon {
  inputIndex: number;
  sourceOutput: Pick<Output, 'satoshis'>;
  spendingTransaction: Transaction<MakeOptional<Input, 'unlockingBytecode'>>;
}

/**
 * A complete view of the information necessary to validate a specified input on
 * the provided transaction.
 */
export interface AuthenticationProgramCommon {
  inputIndex: number;
  sourceOutput: Output;
  spendingTransaction: Transaction;
}

export interface AuthenticationProgramStateSignatureAnalysis {
  /**
   * An array of the `Uint8Array` values used in signature verification over the
   * course of this program. Each raw signing serialization and data signature
   * message should be pushed to this array in the order it was computed.
   *
   * This property is not used within any `AuthenticationVirtualMachine`, but it
   * is provided in the program state to assist with analysis. Because these
   * messages must always be computed and hashed during evaluation, recording
   * them in the state does not meaningfully affect performance.
   */
  signedMessages: Uint8Array[];
}

export interface AuthenticationProgramStateInternalCommon<
  Opcodes,
  InstructionSetError,
  StackType = Uint8Array
>
  extends AuthenticationProgramStateMinimum<Opcodes>,
    AuthenticationProgramStateStack<StackType>,
    AuthenticationProgramStateAlternateStack<StackType>,
    AuthenticationProgramStateExecutionStack,
    AuthenticationProgramStateError<InstructionSetError>,
    AuthenticationProgramStateSignatureAnalysis {
  /**
   * The `lastCodeSeparator` indicates the index of the most recently executed
   * `OP_CODESEPARATOR` instruction. In each of the signing serialization
   * algorithms, the `instructions` are sliced at `lastCodeSeparator`, and the
   * subarray is re-serialized. The resulting bytecode is called the
   * `coveredBytecode` (A.K.A. `scriptCode`), and is part of the data hashed to
   * create the signing serialization digest.
   *
   * By default, this is `-1`, which indicates that the whole `instructions`
   * array is included in the signing serialization.
   */
  lastCodeSeparator: number;
  operationCount: number;
  signatureOperationsCount: number;
}

export interface AuthenticationProgramStateCommon<Opcodes, Errors>
  extends AuthenticationProgramStateInternalCommon<Opcodes, Errors>,
    TransactionContextCommon {}
