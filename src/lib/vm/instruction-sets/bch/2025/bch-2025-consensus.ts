import { ConsensusBch2023 } from '../2023/bch-2023-consensus.js';

/**
 * Consensus setting overrides for the `BCH_2025_05` instruction set.
 */
export enum ConsensusBch2025Overrides {
  /**
   * A.K.A. `MAX_SCRIPT_ELEMENT_SIZE`
   */
  maximumStackItemLength = 10_000,

  hashDigestIterationsPerByteStandard = 0.5,
  hashDigestIterationsPerByteNonstandard = 4,
  bytesPerCodeSeparatorStandard = 65,
}

/**
 * Consensus settings for the `BCH_2025_05` instruction set.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const ConsensusBch2025 = {
  ...ConsensusBch2023,
  ...ConsensusBch2025Overrides,
  ...{ maximumOperationCount: undefined },
};
