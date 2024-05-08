import type {
  AuthenticationProgramBch,
  AuthenticationProgramStateBch,
  InstructionSet,
  ResolvedTransactionBch,
} from '../../../../lib.js';
import { createInstructionSetBch2023 } from '../2023/bch-2023-instruction-set.js';

/**
 * Initialize a virtual machine using the `BCH_2025_05` instruction set.
 *
 * @param standard - If `true`, the additional `isStandard` validations will be
 * enabled. Transactions that fail these rules are often called "non-standard"
 * and can technically be included by miners in valid blocks, but most network
 * nodes will refuse to relay them. (Default: `true`)
 */
export const createInstructionSetBch2025 = (
  standard = true,
): InstructionSet<
  ResolvedTransactionBch,
  AuthenticationProgramBch,
  AuthenticationProgramStateBch
> => {
  const instructionSet = createInstructionSetBch2023(standard);
  return { ...instructionSet };
};
