import { createAuthenticationVirtualMachine } from '../../../virtual-machine.js';

import { createInstructionSetBCH2022 } from './bch-2022-instruction-set.js';

/**
 * Initialize a virtual machine using the BCH instruction set.
 *
 * @param standard - If `true`, the additional `isStandard` validations will be
 * enabled. Transactions that fail these rules are often called "non-standard"
 * and can technically be included by miners in valid blocks, but most network
 * nodes will refuse to relay them. (Default: `true`)
 */
export const createVirtualMachineBCH2022 = (standard = true) =>
  createAuthenticationVirtualMachine(createInstructionSetBCH2022(standard));

export const createVirtualMachineBCH = createVirtualMachineBCH2022;
