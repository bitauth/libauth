import { ConsensusBch2025 } from '../2025/bch-2025-consensus.js';

/**
 * Consensus setting overrides for the `BCH_SPEC` instruction set.
 */
export enum ConsensusBchSpecOverrides {}

/**
 * Consensus settings for the `BCH_SPEC` instruction set.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const ConsensusBchSpec = {
  ...ConsensusBch2025,
  ...ConsensusBchSpecOverrides,
};
