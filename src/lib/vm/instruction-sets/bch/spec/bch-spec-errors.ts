import { AuthenticationErrorBch2026 } from '../2026/bch-2026-errors.js';

export enum AuthenticationErrorBchSpecAdditions {
  excessiveOperationCostOpPow = 'Program attempted an OP_POW operation that would have exceed the operation cost density limit.',
  malformedEval = 'Program attempted to OP_EVAL malformed bytecode.',
}

/**
 * Errors for the `BCH_SPEC` instruction set.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const AuthenticationErrorBchSpec = {
  ...AuthenticationErrorBch2026,
  ...AuthenticationErrorBchSpecAdditions,
};
