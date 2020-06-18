import { CompilationData } from '../template/compiler-types';
import {
  CompilationError,
  ResolvedScript,
} from '../template/language/language-types';

/**
 * The partial transaction context which is shared between all of the inputs in
 * a transaction.
 */
export interface TransactionContextSharedCommon {
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
 * The complete transaction context in which a single transaction input exists.
 */
export interface TransactionContextCommon
  extends TransactionContextSharedCommon {
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
   * The 8-byte `Uint64LE`-encoded value of the outpoint in satoshis (see
   * `bigIntToBinUint64LE`).
   */
  readonly outputValue: Uint8Array;
  /**
   * The `sequenceNumber` associated with the input being validated. See
   * `Input.sequenceNumber` for details.
   */
  readonly sequenceNumber: number;
}

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
   * The hash of the raw transaction from which this input is spent in
   * big-endian byte order. This is the byte order typically seen in block
   * explorers and user interfaces (as opposed to little-endian byte order,
   * which is used in standard P2P network messages).
   *
   * A.K.A. `Transaction ID`
   *
   * @remarks
   * An "outpoint" is a reference (A.K.A. "pointer") to a specific output in a
   * previous transaction.
   *
   * Encoded raw bitcoin transactions serialize this value in little-endian byte
   * order. However, it is more common to use big-endian byte order when
   * displaying transaction hashes. (In part because the SHA-256 specification
   * defines its output as big-endian, so this byte order is output by most
   * cryptographic libraries.)
   */
  outpointTransactionHash: HashRepresentation;
  /**
   * The positive, 32-bit unsigned integer used as the "sequence number" for
   * this input.
   *
   * A sequence number is a complex bitfield which can encode several properties
   * about an input:
   * - **sequence age support** – whether or not the input can use
   * `OP_CHECKSEQUENCEVERIFY`, and the minimum number of blocks or length of
   * time which has passed since this input's source transaction was mined (up
   * to approximately 1 year).
   * - **locktime support** – whether or not the input can use
   * `OP_CHECKLOCKTIMEVERIFY`
   *
   * **Sequence Age Support**
   *
   * Sequence number age is enforced by mining consensus – a transaction is
   * invalid until it has "aged" such that all outputs referenced by its
   * age-enabled inputs are at least as old as claimed by their respective
   * sequence numbers.
   *
   * This allows sequence numbers to function as a "relative locktime" for each
   * input: a `lockingBytecode` can use the `OP_CHECKSEQUENCEVERIFY` operation
   * to verify that the funds being spent have been "locked" for a minimum
   * required amount of time (or block count). This can be used in protocols
   * which require a reliable "proof-of-publication", like escrow, time-delayed
   * withdrawals, and various payment channel protocols.
   *
   * Sequence age support is enabled unless the "disable bit" – the most
   * significant bit – is set (i.e. the sequence number is less than
   * `(1 << 31) >>> 0`/`0b10000000000000000000000000000000`/`2147483648`).
   *
   * If sequence age is enabled, the "type bit" – the most significant bit in
   * the second-most significant byte
   * (`1 << 22`/`0b1000000000000000000000`/`2097152`) – indicates the unit type
   * of the specified age:
   *  - if set, the age is in units of `512` seconds (using Median Time-Past)
   *  - if not set, the age is a number of blocks
   *
   * The least significant 16 bits specify the age (i.e.
   * `age = sequenceNumber & 0x0000ffff`). This makes the maximum age either
   * `65535` blocks (about 1.25 years) or `33553920` seconds (about 1.06 years).
   *
   * **Locktime Support**
   *
   * Locktime support is disabled for an input if the sequence number is exactly
   * `0xffffffff` (`4294967295`). Because this value requires the "disable bit"
   * to be set, disabling locktime support also disables sequence age support.
   *
   * With locktime support disabled, if  either `OP_CHECKLOCKTIMEVERIFY` or
   * `OP_CHECKSEQUENCEVERIFY` are encountered during the validation of
   * `unlockingBytecode`, an error is produced, and the transaction is invalid.
   *
   * @remarks
   * The term "sequence number" was the name given to this field in the Satoshi
   * implementation of the bitcoin transaction format. The field was originally
   * intended for use in a multi-party signing protocol where parties updated
   * the "sequence number" to indicate to miners that this input should replace
   * a previously-signed input in an existing, not-yet-mined transaction. The
   * original use-case was not completed and relied on behavior which can not be
   * enforced by mining consensus, so the field was mostly-unused until it was
   * repurposed by BIP68 in block `419328`. See BIP68, BIP112, and BIP113 for
   * details.
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
 *
 * @typeParam Bytecode - the type of `lockingBytecode` - this can be configured
 * to allow for defining compilation directives
 * @typeParam Amount - the type of `satoshis`
 */
export interface Output<Bytecode = Uint8Array, Amount = Uint8Array> {
  /**
   * The bytecode used to encumber this transaction output. To spend the output,
   * unlocking bytecode must be included in a transaction input which – when
   * evaluated before the locking bytecode – completes in a valid state.
   *
   * A.K.A. `scriptPubKey` or "locking script"
   */
  readonly lockingBytecode: Bytecode;
  /**
   * The 8-byte `Uint64LE`-encoded value of the output in satoshis, the smallest
   * unit of bitcoin.
   *
   * There are 100 satoshis in a bit, and 100,000,000 satoshis in a bitcoin.
   *
   * This value could be defined using a `number`, as `Number.MAX_SAFE_INTEGER`
   * (`9007199254740991`) is about 4 times larger than the maximum number of
   * satoshis which should ever exist. I.e. even if all satoshis were
   * consolidated into a single output, the transaction spending this output
   * could still be defined with a numeric `satoshis` value.
   *
   * However, because the encoded output format for version 1 and 2 transactions
   * (used in both transaction encoding and signing serialization) uses a 64-bit
   * unsigned, little-endian integer to serialize `satoshis`, this property is
   * encoded in the same format, allowing it to cover the full possible range.
   *
   * This is useful for encoding values using schemes for fractional satoshis
   * (for which no finalized specification yet exists) or for encoding
   * intentionally excessive values. For example, `invalidSatoshis`
   * (`0xffffffffffffffff` - the maximum uint64 value) is a clearly impossible
   * `satoshis` value for version 1 and 2 transactions. As such, this value can
   * safely by used by transaction signing and verification implementations to
   * ensure that an otherwise properly-signed transaction can never be included
   * n the blockchain, e.g. for transaction size estimation or off-chain Bitauth
   * signatures.
   *
   * To convert this value to and from a `BigInt` use `bigIntToBinUint64LE` and
   * `binToBigIntUint64LE`, respectively.
   */
  readonly satoshis: Amount;
}

/**
 * The maximum uint64 value – an impossibly large, intentionally invalid value
 * for `satoshis`. See `Transaction.satoshis` for details.
 */
// prettier-ignore
// eslint-disable-next-line @typescript-eslint/no-magic-numbers
export const invalidSatoshis = Uint8Array.from([255, 255, 255, 255, 255, 255, 255, 255]);

/**
 * Data type representing a transaction.
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
   * (Median Time-Past) is used. The precise behavior is defined in BIP113.
   *
   * If the `sequenceNumber` of every transaction input is set to `0xffffffff`
   * (`4294967295`), locktime is disabled, and the transaction may be added to a
   * block even if the specified locktime has not yet been reached. When
   * locktime is disabled, if an `OP_CHECKLOCKTIMEVERIFY` operation is
   * encountered during the verification of any input, an error is produced, and
   * the transaction is invalid.
   *
   * @remarks
   * There is a subtle difference in how `locktime` is disabled for a
   * transaction and how it is "disabled" for a single input: `locktime` is only
   * disabled for a transaction if every input has a sequence number of
   * `0xffffffff`; however, within each input, if the sequence number is set to
   * `0xffffffff`, locktime is disabled for that input (and
   * `OP_CHECKLOCKTIMEVERIFY` operations will error if encountered).
   *
   * This difference is a minor virtual machine optimization – it allows inputs
   * to be properly validated without requiring the virtual machine to check the
   * sequence number of every other input (only that of the current input).
   *
   * This is inconsequential for valid transactions, since any transaction which
   * disables `locktime` must have disabled locktime for all of its inputs;
   * `OP_CHECKLOCKTIMEVERIFY` is always properly enforced. However, because an
   * input can individually "disable locktime" without the full transaction
   * *actually disabling locktime*, it is possible that a carefully-crafted
   * transaction may fail to verify because "locktime is disabled" for the input
   * – even if locktime is actually enforced on the transaction level.
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
   * The version of this transaction – a positive integer from `0` to a maximum
   * of `4294967295`. Since BIP68, most transactions use a version of `2`.
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
   * The `satoshis` value of the `Output` being spent by this input. Required
   * for use in signing serializations.
   */
  satoshis: Output['satoshis'];
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
 * `invalidSatoshis`).
 */
export type OutputTemplate<
  CompilerType,
  EnableFeeEstimation = false,
  CompilationDataType = CompilationData<never>
> = Output<
  CompilationDirectiveLocking<CompilerType, CompilationDataType> | Uint8Array,
  EnableFeeEstimation extends true ? Uint8Array | undefined : Uint8Array
>;

/**
 * A `Transaction` which may optionally use compilation directives in place of
 * `lockingBytecode` and `unlockingBytecode` instances. During transaction
 * generation, these directives will be generated from these directives.
 *
 *  If `EnableFeeEstimation` is `true`, all input directives must include an
 * `estimate` scenario ID, and the `satoshis` value of each output may also be
 * `undefined` (as estimated transactions always set output values to
 * `invalidSatoshis`).
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

/**
 * An error resulting from unsuccessful bytecode generation. Includes the
 * generation type (`locking` or `unlocking`), and the output or input index
 */
export interface BytecodeGenerationErrorBase {
  /**
   * The type of bytecode that was being generated when this error occurred.
   */
  type: 'locking' | 'unlocking';
  /**
   * The input or output index for which this bytecode was being generated. (To )
   */
  index: number;
  /**
   * The stage of generation at which this error occurred – the `outputs` stage
   * must complete before the `inputs` can begin.
   */
  // stage: 'outputs' | 'inputs';
  /**
   * If the error occurred after the `parse` stage, the resolved script is
   * provided for analysis or processing (e.g. `getResolvedBytecode`).
   */
  resolved?: ResolvedScript;
  /**
   * The compilation errors which occurred while generating this bytecode.
   */
  errors: CompilationError[];
}

export interface BytecodeGenerationErrorLocking
  extends BytecodeGenerationErrorBase {
  type: 'locking';
}

export interface BytecodeGenerationErrorUnlocking
  extends BytecodeGenerationErrorBase {
  type: 'unlocking';
}

export interface BytecodeGenerationCompletionBase {
  /**
   * If `output`, this bytecode was generated for the output at `index` (a
   * `lockingBytecode`). If `input`, the bytecode was generated for the input at
   * `index` (an `unlockingBytecode`).
   */
  type: 'output' | 'input';
  /**
   * The index of the input or output for which this bytecode was generated.
   */
  index: number;
}

export interface BytecodeGenerationCompletionInput
  extends BytecodeGenerationCompletionBase {
  type: 'input';
  /**
   * The successfully generated Input.
   */
  input: Input;
}

export interface BytecodeGenerationCompletionOutput
  extends BytecodeGenerationCompletionBase {
  type: 'output';
  /**
   * The successfully generated Output.
   */
  output: Output;
}

/**
 * A successfully generated `lockingBytecode` (for an output) or
 * `unlockingBytecode` (for an input). Because this bytecode generation was
 * successful, the associated compilation directive in the transaction template
 * can be replaced with this result for subsequent compilations. For example, if
 * most inputs were successfully compiled, but some inputs require keys held by
 * another entity, the transaction template can be updated such that only the
 * final inputs contain compilation directives.
 */
export type BytecodeGenerationCompletion =
  | BytecodeGenerationCompletionOutput
  | BytecodeGenerationCompletionInput;

export interface TransactionGenerationSuccess {
  success: true;
  transaction: Transaction;
}

export type TransactionGenerationError =
  | {
      success: false;
      completions: BytecodeGenerationCompletionOutput[];
      errors: BytecodeGenerationErrorLocking[];
      /**
       * Error(s) occurred at the `output` stage of compilation, so the `input`
       * stage never began.
       */
      stage: 'outputs';
    }
  | {
      success: false;
      completions: BytecodeGenerationCompletionInput[];
      errors: BytecodeGenerationErrorUnlocking[];
      /**
       * Error(s) occurred at the `input` stage of compilation, meaning the
       * `output` stage completed successfully.
       */
      stage: 'inputs';
    };

export type TransactionGenerationAttempt =
  | TransactionGenerationSuccess
  | TransactionGenerationError;
