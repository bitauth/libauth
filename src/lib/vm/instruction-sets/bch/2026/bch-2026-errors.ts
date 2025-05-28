import { AuthenticationErrorBch2025 } from '../2025/bch-2025-errors.js';

export enum AuthenticationErrorBch2026Additions {
  unexpectedUntil = 'Encountered an OP_UNTIL that is not preceded by a matching OP_BEGIN.',
  unexpectedUntilMissingEndIf = 'Encountered an OP_UNTIL before the previous OP_IF was closed by an OP_ENDIF.',
  excessiveLooping = 'Program attempted an OP_UNTIL operation that would exceed the limit of repeated bytes.',
  functionIdentifierInvalid = 'Program attempted to OP_DEFINE an invalid function identifier.',
  functionIdentifierPreviouslyDefined = 'Program attempted to OP_DEFINE a previously-defined function identifier.',
  functionIdentifierUndefined = 'Program attempted to OP_INVOKE an undefined function identifier.',
  malformedFunction = 'Program attempted to OP_INVOKE malformed bytecode.',
}

/**
 * Errors for the `BCH_SPEC` instruction set.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const AuthenticationErrorBch2026 = {
  ...AuthenticationErrorBch2025,
  ...AuthenticationErrorBch2026Additions,
};
