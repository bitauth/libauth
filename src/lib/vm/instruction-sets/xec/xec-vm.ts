import { createVirtualMachine } from '../../virtual-machine.js';

import { createInstructionSetXEC } from './xec-instruction-set.js';

/**
 * Initialize a virtual machine using the XEC instruction set.
 *
 * @param standard - If `true`, the additional `isStandard` validations will be
 * enabled. Transactions that fail these rules are often called "non-standard"
 * and can technically be included by miners in valid blocks, but most network
 * nodes will refuse to relay them. (Default: `true`)
 */
export const createVirtualMachineXEC = (standard = true) =>
  createVirtualMachine(createInstructionSetXEC(standard));
