import { ConsensusBch2025 } from '../2025/bch-2025-consensus.js';

/**
 * Consensus setting overrides for the `BCH_SPEC` instruction set.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const ConsensusBch2026Overrides = {
  baseInstructionCost: 100,
  maximumFunctionIdentifier: 999,
  maximumStandardLockingBytecodeLength: 201,
  maximumStandardUnlockingBytecodeLength: 10000,
  maximumTokenCommitmentLength: 128,
  minimumFunctionIdentifier: 0,
};

/**
 * Consensus settings for the `BCH_SPEC` instruction set.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const ConsensusBch2026 = {
  ...ConsensusBch2025,
  ...ConsensusBch2026Overrides,
};
