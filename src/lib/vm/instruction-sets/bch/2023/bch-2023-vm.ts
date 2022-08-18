import { createAuthenticationVirtualMachine } from '../../../virtual-machine.js';

import { createInstructionSetBCH2023 } from './bch-2023-instruction-set.js';

/**
 * Initialize a virtual machine using the `BCH_2023_05` instruction set.
 *
 * @param standard - If `true`, the additional `isStandard` validations will be
 * enabled. Transactions that fail these rules are often called "non-standard"
 * and can technically be included by miners in valid blocks, but most network
 * nodes will refuse to relay them. (Default: `true`)
 */
export const createVirtualMachineBCH2023 = (standard = true) =>
  createAuthenticationVirtualMachine(createInstructionSetBCH2023(standard));

export const createVirtualMachineBCH = createVirtualMachineBCH2023;
