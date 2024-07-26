import { ConsensusBch2026 } from '../2026/bch-2026-consensus.js';

/**
 * Consensus setting overrides for the `BCH_SPEC` instruction set.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const ConsensusBchSpecOverrides = {
  maximumBytecodeLength: 100_000,
};

/**
 * Consensus settings for the `BCH_SPEC` instruction set.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const ConsensusBchSpec = {
  ...ConsensusBch2026,
  ...ConsensusBchSpecOverrides,
};
