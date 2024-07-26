import { OpcodesBch2026 } from '../2026/bch-2026-opcodes.js';

/**
 * The opcodes added to the `BCH_SPEC` instruction set beyond those present in
 * `BCH_2026_05`.
 */
export enum OpcodesBchSpecAdditions {}

/**
 * The `BCH_SPEC` instruction set.
 *
 * Note: to maximize script compilation compatibility, this instruction set also
 * includes the previous names for new opcodes (e.g. `OP_VERIF` for `OP_BEGIN`).
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const OpcodesBchSpec = { ...OpcodesBch2026, ...OpcodesBchSpecAdditions };
