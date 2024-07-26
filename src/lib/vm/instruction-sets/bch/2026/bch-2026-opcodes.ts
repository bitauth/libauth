import { OpcodesBch2023 } from '../2023/bch-2023-opcodes.js';

/**
 * The opcodes added to the `BCH_2026_05` instruction set beyond those present in
 * `BCH_2023_05`.
 */
export enum OpcodesBch2026Additions {
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
export const OpcodesBch2026 = { ...OpcodesBch2023, ...OpcodesBch2026Additions };
