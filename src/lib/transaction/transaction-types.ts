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
   * and user interfaces.
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
   * evaluated with the locking bytecode – completes in valid state.
   *
   * A.K.A. `scriptPubKey` or "locking script"
   */
  readonly lockingBytecode: Bytecode;
  /**
   * The value of the output in satoshis, the smallest unit of bitcoin. There
   * are 100 satoshis in a bit, and 100,000,000 satoshis in a bitcoin.
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
   * The locktime at which this transaction is considered valid.
   *
   * Locktime can be provided as either a timestamp or a block height. Values
   * less than `500000000` are understood to be a block height (the current
   * block number in the chain, beginning from block 0). Values greater than or
   * equal to `500000000` are understood to be a UNIX timestamp.
   *
   * For validating timestamp values, the median timestamp of the last 11 blocks
   * is used. The precise behavior is defined in BIP113.
   *
   * If the `sequenceNumber` of every transaction input is set to `0xffffffff`
   * (4294967295), locktime is ignored, and the transaction may be added to a
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
