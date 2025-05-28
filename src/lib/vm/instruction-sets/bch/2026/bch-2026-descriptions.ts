import { OpcodeDescriptionsBch2023 } from '../2023/bch-2023-descriptions.js';

/**
 * Descriptions for the opcodes added to the `BCH_2026_05` instruction set
 * beyond those present in `BCH_2025_05`.
 */
export enum OpcodeDescriptionsBch2026Additions {
  OP_BEGIN = 'Push the current instruction pointer index to the control stack as an integer (to be read by OP_UNTIL).',
  OP_UNTIL = 'Pop the top item from the control stack (if the control value is not an integer, error). Add the difference between the control value and the current instruction pointer index to the repeated bytes counter, if the sum of the repeated bytes counter and the active bytecode length is greater than the maximum bytecode length, error. Pop the top item from the stack, if the value is not truthy, move the instruction pointer to the control value (and re-evaluate the OP_BEGIN).',
  OP_DEFINE = 'Pop the top item from the stack to interpret as a function identifier (VM number between 0 and 999, inclusive). Pop the next item from the stack (the function body), and save it to the function table at the index equal to the function identifier. If that function index is out of range or already defined, error.',
  OP_INVOKE = 'Pop the top item from the stack to interpret as a function table index (VM number between 0 and 999, inclusive). If no function is defined at that index, error. Preserve the active bytecode at the top of the control stack, then evaluate the function body at that function table index as if it were the active bytecode (without resetting the stack, alternate stack, or evaluation limits). When the evaluation is complete, restore the original bytecode and continue evaluation after the OP_INVOKE instruction. If the bytecode is malformed, error.',
}

/**
 * Descriptions for the `BCH_2026_05` instruction set.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const OpcodeDescriptionsBch2026 = {
  ...OpcodeDescriptionsBch2023,
  ...OpcodeDescriptionsBch2026Additions,
};
