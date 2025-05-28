import { OpcodeDescriptionsBch2026 } from '../2026/bch-2026-descriptions.js';

/**
 * Descriptions for the opcodes added to the `BCH_SPEC` instruction set beyond
 * those present in `BCH_2026_05`.
 */
export enum OpcodeDescriptionsBchSpecAdditions {
  OP_EVAL = 'Pop the top item from the stack as bytecode. Preserve the active bytecode at the top of the control stack, then evaluate the stack-provided bytecode as if it were the active bytecode (without modifying the stack, alternate stack, or evaluation limits). When the evaluation is complete, restore the original bytecode and continue evaluation after the OP_EVAL instruction. If the bytecode is malformed, error. (Note: OP_EVAL is only available for experimentation in the Libauth BCH_SPEC VM, it is not currently proposed for BCH consensus upgrade.)',
  OP_POW = 'Pop the top item from the stack as an exponent (VM Number) and the next as a base (VM Number). Raise the base to the power of the exponent and push the result to the stack. (Note: OP_POW is only available for experimentation in the Libauth BCH_SPEC VM, it is not currently proposed for BCH consensus upgrade.)',
}

/**
 * Descriptions for the `BCH_SPEC` instruction set.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const OpcodeDescriptionsBchSpec = {
  ...OpcodeDescriptionsBch2026,
  ...OpcodeDescriptionsBchSpecAdditions,
};
