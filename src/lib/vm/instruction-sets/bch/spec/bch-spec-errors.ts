import { AuthenticationErrorBch2026 } from '../2026/bch-2026-errors.js';

export enum AuthenticationErrorBchSpecAdditions {}

/**
 * Errors for the `BCH_SPEC` instruction set.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const AuthenticationErrorBchSpec = {
  ...AuthenticationErrorBch2026,
  ...AuthenticationErrorBchSpecAdditions,
};
