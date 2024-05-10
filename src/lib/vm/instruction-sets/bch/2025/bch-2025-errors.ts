import { AuthenticationErrorBch2023 } from '../2023/bch-2023-errors.js';

export enum AuthenticationErrorBch2025Additions {
  exceededMaximumStackItemLength = 'Program attempted to push a stack item that exceeded the maximum stack item length (10,000 bytes).',
  excessiveHashing = 'Program attempted a hashing operation that would exceed the hashing limit (1000 hash digest iterations).',
}

/**
 * Errors for the `BCH_SPEC` instruction set.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const AuthenticationErrorBch2025 = {
  ...AuthenticationErrorBch2023,
  ...AuthenticationErrorBch2025Additions,
};
