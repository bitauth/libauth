import { OpcodeDescriptionsCommon } from '../common/descriptions';

export enum OpcodeDescriptionsUniqueBCH {
  OP_CAT = 'Pop the top 2 items from the stack and concatenate them, pushing the result.',
  OP_SPLIT = 'Pop the top item from the stack as an index (Script Number) and the next item as a byte array. Split the byte array into two stack items at the index (zero-based), pushing the results.',
  OP_NUM2BIN = 'Pop the top item from the stack as an item length (Script Number) and the next item as a Script Number (without encoding restrictions). Re-encode the number using a byte array of the provided length, filling any unused bytes with zeros. (If the requested length is too short to encode the number, error.)',
  OP_BIN2NUM = "Pop the top item from the stack as a Script Number without encoding restrictions. Minimally-encode the number and push the result. (If the number can't be encoded in 4 bytes or less, error.)",
  OP_AND = 'Pop the top 2 items from the stack and perform a bitwise AND on each byte, pushing the result. If the length of the items are not equal, error.',
  OP_OR = 'Pop the top 2 items from the stack and perform a bitwise OR on each byte, pushing the result. If the length of the items are not equal, error.',
  OP_XOR = 'Pop the top 2 items from the stack and perform a bitwise XOR on each byte, pushing the result. If the length of the items are not equal, error.',
  OP_DIV = 'Pop the top item from the stack as a denominator (Script Number) and the next as a numerator (Script Number). Divide and push the result to the stack.',
  OP_MOD = 'Pop the top item from the stack as a denominator (Script Number) and the next as a numerator (Script Number). Divide and push the remainder to the stack.',
  OP_CHECKDATASIG = 'Pop the top 3 items from the stack. Treat the top as a public key, the second as a message, and the third as a signature. If the signature is valid, push a Script Number 1, otherwise push a Script Number 0.',
  OP_CHECKDATASIGVERIFY = 'Pop the top 3 items from the stack. Treat the top as a public key, the second as a message, and the third as a signature. If the signature is not valid, error. (This operation is a combination of OP_CHECKDATASIG followed by OP_VERIFY.)',
  OP_REVERSEBYTES = 'Pop the top item from the stack and reverse it, pushing the result.',
}

/**
 * A map of descriptions for each Bitcoin Cash opcode.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const OpcodeDescriptionsBCH = {
  ...OpcodeDescriptionsCommon,
  ...OpcodeDescriptionsUniqueBCH,
};
