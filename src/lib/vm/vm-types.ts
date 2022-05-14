import type {
  AuthenticationInstruction,
  Output,
  TransactionCommon,
} from '../lib';

export interface AuthenticationProgramStateMinimum {
  /**
   * The full list of instructions to be evaluated by the virtual machine.
   */
  readonly instructions: readonly AuthenticationInstruction[];
  /**
   * Instruction Pointer – the array index of `instructions` that will be read
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

export interface AuthenticationProgramStateControlStack {
  /**
   * An array of boolean values representing the current execution status of the
   * program. This allows the state to track nested conditional branches.
   *
   * The `OP_IF` and `OP_NOTIF` operations push a new boolean onto the
   * `controlStack`, `OP_ELSE` flips the top boolean, and `OP_ENDIF` removes
   * the top boolean from the `controlStack`.
   *
   * Other instructions are only evaluated if `controlStack` contains no
   * `false` items.
   *
   * A.K.A. `vfExec` in the C++ implementation.
   */
  controlStack: boolean[];
}

export interface AuthenticationProgramStateError {
  /**
   * If present, the error returned by the most recent virtual machine
   * operation.
   */
  error?: string;
}

/**
 * A complete view of the information necessary to validate a transaction.
 */
export interface ResolvedTransactionCommon {
  sourceOutputs: Output[];
  transaction: TransactionCommon;
}

/**
 * A complete view of the information necessary to validate a specified input in
 * a transaction.
 */
export interface AuthenticationProgramCommon extends ResolvedTransactionCommon {
  inputIndex: number;
}

export interface AuthenticationProgramStateSignatureAnalysis {
  /**
   * An array of the `Uint8Array` values used in signature verification over the
   * course of this program. Each raw signing serialization and data signature
   * message should be pushed to this array in the order it was computed.
   *
   * This property is not used within any {@link AuthenticationVirtualMachine},
   * but it is provided in the program state to assist with analysis. Because
   * these messages must always be computed and hashed during evaluation,
   * recording them in the state does not meaningfully affect performance.
   */
  signedMessages: Uint8Array[];
}

export interface AuthenticationProgramStateInternalCommon<
  StackType = Uint8Array
> extends AuthenticationProgramStateMinimum,
    AuthenticationProgramStateStack<StackType>,
    AuthenticationProgramStateAlternateStack<StackType>,
    AuthenticationProgramStateControlStack,
    AuthenticationProgramStateError,
    AuthenticationProgramStateSignatureAnalysis {
  /**
   * The `lastCodeSeparator` indicates the index of the most recently executed
   * `OP_CODESEPARATOR` instruction. In each of the signing serialization
   * algorithms, the `instructions` are sliced at `lastCodeSeparator`, and the
   * subarray is re-encoded. The resulting bytecode is called the
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

export interface AuthenticationProgramStateCommon
  extends AuthenticationProgramStateInternalCommon {
  program: Readonly<AuthenticationProgramCommon>;
}
