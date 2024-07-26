/**
 * Consensus settings for the `BCH_2023_05` instruction set.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const ConsensusBch2023 = {
  /**
   * A.K.A. `MAX_SCRIPT_SIZE`
   */
  maximumBytecodeLength: 10000,
  maximumCommitmentLength: 40,
  /**
   * A.K.A. `MAX_CONSENSUS_VERSION`
   */
  maximumConsensusVersion: 2,
  /**
   * A.K.A. `MAX_OP_RETURN_RELAY`, `nMaxDatacarrierBytes`
   */
  maximumDataCarrierBytes: 223,
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
  maximumVmNumber: '9223372036854775807',
  /**
   * A.K.A. `MAXIMUM_ELEMENT_SIZE_64_BIT`
   */
  maximumVmNumberLength: 8,
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
  minimumVmNumber: '-9223372036854775807',
  schnorrSignatureLength: 64,
};
