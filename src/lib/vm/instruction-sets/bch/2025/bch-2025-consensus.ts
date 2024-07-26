import { ConsensusBch2023 } from '../2023/bch-2023-consensus.js';

import type { AuthenticationProgramStateBch2025 } from './bch-2025-types.js';

/**
 * Consensus setting overrides for the `BCH_2025_05` instruction set.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const ConsensusBch2025Overrides = {
  bytesPerCodeSeparatorStandard: 65,
  hashDigestIterationsPerByteNonstandard: 4,
  hashDigestIterationsPerByteStandard: 0.5,
  maximumControlStackDepth: 100,
  /**
   * A.K.A. `MAX_SCRIPT_ELEMENT_SIZE`
   */
  maximumStackItemLength: 10_000,
  maximumVmNumberLength: 258,
};

const base = 2n;
const maxLength = BigInt(ConsensusBch2025Overrides.maximumVmNumberLength);
const bytes = 8n;
const signed = 2n;
const maxVmNumber = base ** (maxLength * bytes) - 1n / signed;

export const bigIntRange = { maxVmNumber, minVmNumber: -maxVmNumber };

/**
 * Consensus settings for the `BCH_2025_05` instruction set.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const ConsensusBch2025 = {
  ...ConsensusBch2023,
  ...ConsensusBch2025Overrides,
};

const enum Constants {
  opcodeOverheadMultiplier = 100,
  hashDigestAlgorithmsBlockSize = 64,
}
export const measureOperationCost = <
  Metrics extends Pick<
    AuthenticationProgramStateBch2025['metrics'],
    | 'arithmeticCost'
    | 'bitwiseCost'
    | 'executedInstructionCount'
    | 'hashDigestIterations'
    | 'signatureCheckCount'
    | 'stackPushedBytes'
  >,
>(
  metrics: Metrics,
) =>
  metrics.executedInstructionCount * Constants.opcodeOverheadMultiplier +
  metrics.arithmeticCost +
  metrics.bitwiseCost +
  metrics.hashDigestIterations * Constants.hashDigestAlgorithmsBlockSize +
  metrics.stackPushedBytes;
