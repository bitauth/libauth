import { ConsensusBch2023 } from '../bch/2023/bch-2023-consensus.js';

/**
 * Consensus setting overrides for the `BCH_2025_05` instruction set.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const ConsensusXec2020Overrides = {
  maximumVmNumberByteLength: 4,
};
/**
 * Consensus settings for the `XEC_2020_11` instruction set.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const ConsensusXec = {
  ...ConsensusBch2023,
  ...ConsensusXec2020Overrides,
};
