import { AuthenticationErrorBch2025 } from '../2025/bch-2025-errors.js';

export enum AuthenticationErrorBchSpecAdditions {
  unexpectedUntil = 'Encountered an OP_UNTIL that is not following a matching OP_BEGIN.',
  excessiveLooping = 'Program attempted an OP_UNTIL operation that would exceed the limit of repeated bytes (10,000 bytes minus active bytecode length).',
  nonEmptyControlStack = 'The active bytecode completed with a non-empty control stack (missing `OP_ENDIF` or `OP_UNTIL`).',
}

/**
 * Errors for the `BCH_SPEC` instruction set.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const AuthenticationErrorBchSpec = {
  ...AuthenticationErrorBch2025,
  ...AuthenticationErrorBchSpecAdditions,
};
