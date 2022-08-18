/**
 * Consensus settings for the `BCH_2023_05` instruction set.
 */
export enum ConsensusBCH2023 {
  /**
   * A.K.A. `MAX_SCRIPT_SIZE`
   */
  maximumBytecodeLength = 10000,
  /**
   * A.K.A. `MAX_OP_RETURN_RELAY`, `nMaxDatacarrierBytes`
   */
  maximumDataCarrierBytes = 223,
  /**
   * A.K.A. `MAX_OPS_PER_SCRIPT`
   */
  maximumOperationCount = 201,
  /**
   * A.K.A. `MAX_STACK_SIZE`
   */
  maximumStackDepth = 1000,
  /**
   * A.K.A. `MAX_SCRIPT_ELEMENT_SIZE`
   */
  maximumStackItemLength = 520,
  /**
   * A.K.A. `MAX_STANDARD_VERSION`
   */
  maximumStandardVersion = 2,
  /**
   * A.K.A. `MAX_TX_IN_SCRIPT_SIG_SIZE`
   */
  maximumStandardUnlockingBytecodeLength = 1650,
  /**
   * Transactions of this size are forbidden to prevent exploits of the
   * transaction Merkle tree design. This constant replaces
   * `minimumTransactionSize` (A.K.A. `MIN_TX_SIZE`) in the
   * `BCH_2023_05` upgrade.
   */
  forbiddenTransactionSize = 64,
  /**
   * A.K.A. `MAX_STANDARD_TX_SIZE`
   */
  maximumStandardTransactionSize = 100_000,
  /**
   * A.K.A. `MAX_TX_SIZE`
   */
  maximumTransactionSize = 1_000_000,
  /**
   * A.K.A. `MAXIMUM_ELEMENT_SIZE_64_BIT`
   */
  maximumVmNumberLength = 8,
  minVmNumber = '-9223372036854775807',
  maxVmNumber = '9223372036854775807',
  // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
  schnorrSignatureLength = 64,
  maximumCommitmentLength = 40,
}