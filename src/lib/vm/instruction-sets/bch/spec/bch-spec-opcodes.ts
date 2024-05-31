import { OpcodesBch2023 } from '../2023/bch-2023-opcodes.js';

/**
 * The opcodes added to the `BCH_SPEC` instruction set beyond those present in
 * `BCH_2023_05`.
 */
export enum OpcodesBchSpecAdditions {
  OP_BEGIN = 0x65,
  OP_UNTIL = 0x66,
}

/**
 * The `BCH_SPEC` instruction set.
 *
 * Note: to maximize script compilation compatibility, this instruction set also
 * includes the previous names for new opcodes (e.g. `OP_VERIF` for `OP_BEGIN`).
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const OpcodesBchSpec = { ...OpcodesBch2023, ...OpcodesBchSpecAdditions };
