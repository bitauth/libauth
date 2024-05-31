import { createVirtualMachine } from '../../../virtual-machine.js';

import { createInstructionSetBch2026 } from './bch-2026-instruction-set.js';

/**
 * Initialize a virtual machine using the `BCH_2026_05` instruction set.
 *
 * @param standard - If `true`, the additional `isStandard` validations will be
 * enabled. Transactions that fail these rules are often called "non-standard"
 * and can technically be included by miners in valid blocks, but most network
 * nodes will refuse to relay them. (Default: `true`)
 */
export const createVirtualMachineBch2026 = (standard = true) =>
  createVirtualMachine(createInstructionSetBch2026(standard));
