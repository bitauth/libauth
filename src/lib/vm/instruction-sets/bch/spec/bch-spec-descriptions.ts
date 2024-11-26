import { OpcodeDescriptionsBch2023 } from '../2023/bch-2023-descriptions.js';

/**
 * Descriptions for the opcodes added to the `BCH_SPEC` instruction set beyond
 * those present in `BCH_2025_05`.
 */
export enum OpcodeDescriptionsBchSpecAdditions {
  OP_BEGIN = 'Push the current instruction pointer index to the control stack as an integer (to be read by OP_UNTIL).',
  OP_UNTIL = 'Pop the top item from the control stack (if the control value is not an integer, error). Add the difference between the control value and the current instruction pointer index to the repeated bytes counter, if the sum of the repeated bytes counter and the active bytecode length is greater than the maximum bytecode length, error. Pop the top item from the stack, if the value is not truthy, move the instruction pointer to the control value (and re-evaluate the OP_BEGIN).',
}

/**
 * Descriptions for the `BCH_SPEC` instruction set.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const OpcodeDescriptionsBchSpec = {
  ...OpcodeDescriptionsBch2023,
  ...OpcodeDescriptionsBchSpecAdditions,
};
