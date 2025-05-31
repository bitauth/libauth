import { OpcodeDescriptionsBch2023 } from '../2023/bch-2023-descriptions.js';

/**
 * Descriptions for the opcodes added to the `BCH_2026_05` instruction set
 * beyond those present in `BCH_2025_05`.
 */
export enum OpcodeDescriptionsBch2026Additions {
  OP_BEGIN = 'Push the current instruction pointer index to the control stack as an integer (to be read by OP_UNTIL).',
  OP_UNTIL = 'Pop the top item from the control stack (if the control value is not an integer, error). Add the difference between the control value and the current instruction pointer index to the repeated bytes counter, if the sum of the repeated bytes counter and the active bytecode length is greater than the maximum bytecode length, error. Pop the top item from the stack, if the value is not truthy, move the instruction pointer to the control value (and re-evaluate the OP_BEGIN).',
  OP_INVERT = `Pop the top item from the stack. Invert (bitwise "NOT") each byte of the item, then push the result to the stack.`,
  OP_DEFINE = 'Pop the top item from the stack to interpret as a function identifier (VM number between 0 and 999, inclusive). Pop the next item from the stack (the function body), and save it to the function table at the index equal to the function identifier. If that function index is out of range or already defined, error.',
  OP_INVOKE = 'Pop the top item from the stack to interpret as a function table index (VM number between 0 and 999, inclusive). If no function is defined at that index, error. Preserve the active bytecode at the top of the control stack, then evaluate the function body at that function table index as if it were the active bytecode (without resetting the stack, alternate stack, or evaluation limits). When the evaluation is complete, restore the original bytecode and continue evaluation after the OP_INVOKE instruction. If the bytecode is malformed, error.',
  OP_LSHIFTNUM = 'Pop the top item from the stack as a bit count (VM number). Pop the next item from the stack as the value (VM number) to shift. Perform an arithmetic left shift of the value by the bit count (`result = value * (2 ^ bit_count)`), then push the result to the stack.',
  OP_RSHIFTNUM = 'Pop the top item from the stack as a bit count (VM number). Pop the next item from the stack as the value (VM number) to shift. Perform an arithmetic right shift of the value by the bit count (`result = value / (2 ^ bit_count)`) rounding towards negative infinity, then push the resulting VM number to the stack.',
  OP_LSHIFTBIN = 'Pop the top item from the stack as a bit count (VM number). Pop the next item from the stack as the binary data to shift. Perform a fixed-length, logical left shift of the data by the bit count, shifting-in `0` bits from the right and dropping shifted-out bits on the left, then push the result to the stack.',
  OP_RSHIFTBIN = 'Pop the top item from the stack as a bit count (VM number). Pop the next item from the stack as the binary data to shift. Perform a fixed-length, logical right shift of the data by the bit count, shifting-in `0` bits from the left and dropping shifted-out bits on the right, then push the result to the stack.',
}

/**
 * Descriptions for the `BCH_2026_05` instruction set.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const OpcodeDescriptionsBch2026 = {
  ...OpcodeDescriptionsBch2023,
  ...OpcodeDescriptionsBch2026Additions,
};
