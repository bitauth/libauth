import { OpcodesBch2023 } from '../2023/bch-2023-opcodes.js';

/**
 * The opcodes added to the `BCH_2026_05` instruction set beyond those present in
 * `BCH_2023_05`.
 */
export enum OpcodesBch2026Additions {
  /**
   * Formerly `OP_VERIF`
   */
  OP_BEGIN = 0x65,
  /**
   * Formerly `OP_VERNOTIF`
   */
  OP_UNTIL = 0x66,
  OP_INVERT = 0x83,
  /**
   * Formerly `OP_RESERVED1`
   */
  OP_DEFINE = 0x89,
  /**
   * Formerly `OP_RESERVED2`
   */
  OP_INVOKE = 0x8a,
  /**
   * Formerly `OP_2MUL`
   */
  OP_MULSHIFT = 0x8d,
  /**
   * Formerly `OP_2DIV`
   */
  OP_DIVSHIFT = 0x8e,
  /**
   *Formerly `OP_LSHIFT`
   */
  OP_PADRIGHT = 0x98,
  /**
   *Formerly `OP_RSHIFT`
   */
  OP_PADLEFT = 0x99,
}

/**
 * The `BCH_SPEC` instruction set.
 *
 * Note: to maximize script compilation compatibility, this instruction set also
 * includes the previous names for new opcodes (e.g. `OP_VERIF` for `OP_BEGIN`).
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const OpcodesBch2026 = { ...OpcodesBch2023, ...OpcodesBch2026Additions };
