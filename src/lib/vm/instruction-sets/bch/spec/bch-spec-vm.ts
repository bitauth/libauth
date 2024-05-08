import { createVirtualMachine } from '../../../virtual-machine.js';

import { createInstructionSetBchSpec } from './bch-spec-instruction-set.js';

/**
 * Initialize a virtual machine using the BCH `SPEC` instruction set, an
 * informal, speculative instruction set that implements a variety of future
 * Bitcoin Cash Improvement Proposals (CHIPs).
 *
 * @param standard - If `true`, the additional `isStandard` validations will be
 * enabled. Transactions that fail these rules are often called "non-standard"
 * and can technically be included by miners in valid blocks, but most network
 * nodes will refuse to relay them. (Default: `true`)
 */
export const createVirtualMachineBchSpec = (standard = true) =>
  createVirtualMachine(createInstructionSetBchSpec(standard));
