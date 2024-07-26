import { AuthenticationErrorCommon } from '../../common/errors.js';

export enum AuthenticationErrorBch2023Additions {
  exceededMaximumVmNumberLength = 'Program attempted an OP_BIN2NUM operation on a byte sequence that cannot be encoded within the maximum VM Number length (8 bytes).',
}

/**
 * Errors for the `BCH_2023_05` instruction set.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const AuthenticationErrorBch2023 = {
  ...AuthenticationErrorCommon,
  ...AuthenticationErrorBch2023Additions,
};
