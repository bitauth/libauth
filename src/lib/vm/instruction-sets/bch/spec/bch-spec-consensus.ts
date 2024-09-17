import { ConsensusBch2026 } from '../2026/bch-2026-consensus.js';

/**
 * Consensus setting overrides for the `BCH_SPEC` instruction set.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const ConsensusBchSpecOverrides = {
  /**
   * Because BCH_SPEC is used to compile CashAssembly internal evaluations,
   * setting a per-input overhead value equal to the current (BCH_2025)
   * `maximumBytecodeLength` ensures that any reasonable internal evaluation can
   * be compiled without exceeding operation cost limits.
   */
  densityControlBaseLength: 10_000,
  maximumBytecodeLength: 100_000,
  maximumStackItemLength: 100_000,
  maximumVmNumberByteLength: 100_000,
};

/**
 * Consensus settings for the `BCH_SPEC` instruction set.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const ConsensusBchSpec = {
  ...ConsensusBch2026,
  ...ConsensusBchSpecOverrides,
};
