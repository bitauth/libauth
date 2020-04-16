import { CompilationData } from '../template/compiler-types';
import {
  CompilationError,
  ResolvedScript,
} from '../template/language/language-types';

/**
 * Data type representing a Transaction Input.
 */
export interface Input<Bytecode = Uint8Array, HashRepresentation = Uint8Array> {
  /**
   * The index of the output in the transaction from which this input is spent.
   *
   * @remarks
   * An "outpoint" is a reference (A.K.A. "pointer") to a specific output in a
   * previous transaction.
   */
  outpointIndex: number;
  /**
   * A.K.A. `Transaction ID`
   *
   * The hash of the raw transaction from which this input is spent in
   * big-endian byte order. This is the order typically seen in block explorers
   * and user interfaces (as opposed to little-endian byte order, which is used
   * in standard P2P network messages).
   *
   * @remarks
   * An "outpoint" is a reference (A.K.A. "pointer") to a specific output in a
   * previous transaction.
   *
   * Serialized raw bitcoin transactions encode this value in little-endian byte
   * order. However, it is more common to use big-endian byte order when
   * displaying transaction hashes. (In part because the SHA-256 specification
   * defines its output as big-endian, so this byte order is output by most
   * cryptographic libraries.)
   */
  outpointTransactionHash: HashRepresentation;
  /**
   * TODO: summarize BIP 68
   */
  sequenceNumber: number;
  /**
   * The bytecode used to unlock a transaction output. To spend an output,
   * unlocking bytecode must be included in a transaction input which – when
   * evaluated in the authentication virtual machine with the locking bytecode –
   * completes in valid state.
   *
   * A.K.A. `scriptSig` or "unlocking script"
   */
  unlockingBytecode: Bytecode;
}

/**
 * Data type representing a Transaction Output.
 */
export interface Output<Bytecode = Uint8Array, Amount = number> {
  /**
   * The bytecode used to encumber a transaction output. To spend the output,
   * unlocking bytecode must be included in a transaction input which – when
   * evaluated before the locking bytecode – completes in a valid state.
   *
   * A.K.A. `scriptPubKey` or "locking script"
   */
  readonly lockingBytecode: Bytecode;
  /**
   * The value of the output in satoshis, the smallest unit of bitcoin.
   *
   * This is a positive integer, from `0` to the maximum number of satoshis
   * available to the transaction. (Note, the maximum number of satoshis in
   * existence is about 1/4 of `Number.MAX_SAFE_INTEGER`.)
   *
   * There are 100 satoshis in a bit, and 100,000,000 satoshis in a bitcoin.
   */
  readonly satoshis: Amount;
}

/**
 * Data type representing a Transaction.
 */
export interface Transaction<InputType = Input, OutputType = Output> {
  /**
   * An array of inputs included in this transaction.
   *
   * Input order is critical to signing serializations, and reordering inputs
   * may invalidate transactions.
   */
  inputs: InputType[];
  /**
   * The locktime at which this transaction is considered valid – a positive
   * integer from `0` to a maximum of `4294967295`.
   *
   * Locktime can be provided as either a timestamp or a block height. Values
   * less than `500000000` are understood to be a block height (the current
   * block number in the chain, beginning from block `0`). Values greater than
   * or equal to `500000000` are understood to be a UNIX timestamp.
   *
   * For validating timestamp values, the median timestamp of the last 11 blocks
   * is used. The precise behavior is defined in BIP113.
   *
   * If the `sequenceNumber` of every transaction input is set to `0xffffffff`
   * (`4294967295`), locktime is ignored, and the transaction may be added to a
   * block (even if the specified locktime has not yet been reached).
   */
  locktime: number;

  /**
   * An array of outputs included in this transaction.
   *
   * Output order is critical to signing serializations, and reordering outputs
   * may invalidate transactions.
   */
  outputs: OutputType[];
  /**
   * The version of this transaction. Since BIP68, most transactions use a
   * version of `2`.
   */
  version: number;
}

export interface CompilationDirectiveLocking<
  CompilerType,
  CompilationDataType
> {
  /**
   * The `Compiler` with which to generate bytecode.
   */
  compiler: CompilerType;
  /**
   * The `CompilationData` required to compile the specified script.
   */
  data?: CompilationDataType;
  /**
   * The script ID to compile.
   */
  script: string;
}

export interface CompilationDirectiveUnlocking<
  CompilerType,
  CompilationDataType
> extends CompilationDirectiveLocking<CompilerType, CompilationDataType> {
  /**
   * The locking bytecode (or a locking compilation directive) which this
   * unlocking script unlocks.
   */
  output: OutputTemplate<CompilerType, false, CompilationDataType>;
}

export interface CompilationDirectiveUnlockingEstimate<
  CompilerType,
  CompilationDataType
> extends CompilationDirectiveUnlocking<CompilerType, CompilationDataType> {
  /**
   * The scenario ID which can be used to estimate the final size of this
   * unlocking script. This is required when using fee estimation.
   */
  estimate: string;
}

/**
 * An input which may optionally use a `CompilationDirectiveUnlocking` as its
 * `unlockingBytecode` property. During compilation, the final `lockingBytecode`
 * will be generated from this directive.
 *
 * If `RequireEstimate` is `true`, all input directives must include an
 * `estimate` scenario ID. See `estimateTransaction` for details.
 */
export type InputTemplate<
  CompilerType,
  RequireEstimate = false,
  CompilationDataType = CompilationData<never>
> = Input<
  | (RequireEstimate extends true
      ? CompilationDirectiveUnlockingEstimate<CompilerType, CompilationDataType>
      : CompilationDirectiveUnlocking<CompilerType, CompilationDataType>)
  | Uint8Array
>;

/**
 * An output which may optionally use a `CompilationDirectiveLocking` as its
 * `lockingBytecode` property. During compilation, the final `lockingBytecode`
 * will be generated from this directive.
 *
 * If `EnableFeeEstimation` is `true`, the `satoshis` value may also be
 * `undefined` (as estimated transactions always set output values to
 * `impossibleSatoshis`).
 */
export type OutputTemplate<
  CompilerType,
  EnableFeeEstimation = false,
  CompilationDataType = CompilationData<never>
> = Output<
  CompilationDirectiveLocking<CompilerType, CompilationDataType> | Uint8Array,
  EnableFeeEstimation extends true ? number | undefined : number
>;

/**
 * A `Transaction` which may optionally use compilation directives in place of
 * `lockingBytecode` and `unlockingBytecode` instances. During transaction
 * generation, these directives will be generated from these directives.
 *
 *  If `EnableFeeEstimation` is `true`, all input directives must include an
 * `estimate` scenario ID, and the `satoshis` value of each output may also be
 * `undefined` (as estimated transactions always set output values to
 * `impossibleSatoshis`).
 */
export type TransactionTemplate<
  CompilerType,
  EnableFeeEstimation = false,
  CompilationDataType = CompilationData<never>
> = Transaction<
  InputTemplate<CompilerType, EnableFeeEstimation, CompilationDataType>,
  OutputTemplate<CompilerType, EnableFeeEstimation, CompilationDataType>
>;

/**
 * A transaction template where all output amounts are provided (i.e. the values
 * of each "change" output has been decided). To estimate the final transaction
 * size given a transaction template (and from it, the required transaction
 * fee), see `estimateTransaction`.
 */
export type TransactionTemplateFixed<CompilerType> = TransactionTemplate<
  CompilerType
>;

/**
 * A transaction template which enables fee estimation. The template must
 * include an `inputSatoshis` value (the total satoshi value of all
 * transaction inputs); all unlocking compilation directives must provide an
 * `estimate` scenario ID which is used to estimate the size of the resulting
 * unlocking bytecode; and the `satoshis` value of outputs is optional (all
 * satoshi values will be set to `impossibleSatoshis` in the estimated
 * transaction).
 */
export type TransactionTemplateEstimated<CompilerType> = TransactionTemplate<
  CompilerType,
  true
> & {
  /**
   * The total satoshi value of all transaction inputs. This is required when
   * using fee estimation, and is used to calculate the appropriate value of
   * change outputs (outputs with `satoshis` set to `undefined`).
   */
  inputSatoshis: number;
};

// TODO: document types below (stages begin with outputs, finish with inputs, how indexes are reported)

export interface BytecodeGenerationError {
  index: number;
  resolved?: ResolvedScript;
  errors: CompilationError[];
}

export type TransactionGenerationResult =
  | { success: true; transaction: Transaction }
  | {
      success: false;
      errors: BytecodeGenerationError[];
      stage: 'outputs' | 'inputs';
    };
