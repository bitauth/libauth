import { OpcodeDescriptionsBch2026 } from '../2026/bch-2026-descriptions.js';

/**
 * Descriptions for the opcodes added to the `BCH_SPEC` instruction set beyond
 * those present in `BCH_2026_05`.
 */
export enum OpcodeDescriptionsBchSpecAdditions {
  OP_POW = 'Pop the top item from the stack as an exponent (VM Number) and the next as a base (VM Number). Raise the base to the power of the exponent and push the result to the stack.',
}

/**
 * Descriptions for the `BCH_SPEC` instruction set.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const OpcodeDescriptionsBchSpec = {
  ...OpcodeDescriptionsBch2026,
  ...OpcodeDescriptionsBchSpecAdditions,
};
