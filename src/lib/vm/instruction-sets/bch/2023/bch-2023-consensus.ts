/**
 * Consensus settings for the `BCH_2023_05` instruction set.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const ConsensusBch2023 = {
  baseInstructionCost: 100,
  /**
   * The constant added to the unlocking bytecode length to determine a
   * contract's density control length (for operation cost and hashing budgets).
   */
  densityControlBaseLength: 41,
  hashDigestIterationCostConsensus: 64,
  hashDigestIterationCostStandard: 192,
  hashDigestIterationsPerByteNonstandard: 3.5,
  hashDigestIterationsPerByteStandard: 0.5,
  /**
   * A.K.A. `MAX_SCRIPT_SIZE`
   */
  maximumBytecodeLength: 10000,
  maximumCommitmentLength: 40,
  /**
   * A.K.A. `MAX_CONSENSUS_VERSION`
   */
  maximumConsensusVersion: 2,
  maximumControlStackDepth: 100,
  /**
   * A.K.A. `MAX_OP_RETURN_RELAY`, `nMaxDatacarrierBytes`
   */
  maximumDataCarrierBytes: 223,
  maximumFungibleTokenAmount: '9223372036854775807',
  /**
   * A.K.A. `MAX_OPS_PER_SCRIPT`
   */
  maximumOperationCount: 201,
  /**
   * A.K.A. `MAX_STACK_SIZE`
   */
  maximumStackDepth: 1000,
  /**
   * A.K.A. `MAX_SCRIPT_ELEMENT_SIZE`
   */
  maximumStackItemLength: 520,
  /**
   * A.K.A. `MAX_STANDARD_TX_SIZE`
   */
  maximumStandardTransactionSize: 100_000,
  /**
   * A.K.A. `MAX_TX_IN_SCRIPT_SIG_SIZE`
   */
  maximumStandardUnlockingBytecodeLength: 1650,
  /**
   * A.K.A. `MAX_TX_SIZE`
   */
  maximumTransactionLengthBytes: 1_000_000,
  /**
   * A.K.A. `MAX_TX_SIGCHECKS`
   */
  maximumTransactionSignatureChecks: 3_000,
  /**
   * A.K.A. `nMaxNumSize`
   */
  maximumVmNumberByteLength: 8,
  /**
   * A.K.A. `MIN_CONSENSUS_VERSION`
   */
  minimumConsensusVersion: 1,
  /**
   * Transactions smaller than 65 bytes are forbidden to prevent exploits of the
   * transaction Merkle tree design.
   *
   * A.K.A. `MIN_TX_SIZE`
   */
  minimumTransactionLengthBytes: 65,
  operationCostBudgetPerByte: 800,
  schnorrSignatureLength: 64,
  signatureCheckCost: 26000,
};

/**
 * Calculate the maximum signature check count (A.K.A. "SigChecks") as defined
 * by the `BCH_2020_05` upgrade.
 */
export const maximumSignatureCheckCount = (unlockingBytecodeLength: number) =>
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  Math.floor((unlockingBytecodeLength + 60) / 43);
