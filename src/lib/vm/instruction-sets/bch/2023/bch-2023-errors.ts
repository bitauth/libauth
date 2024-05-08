export enum AuthenticationErrorBch2023 {
  exceededMaximumVmNumberLength = 'Program attempted an OP_BIN2NUM operation on a byte sequence that cannot be encoded within the maximum VM Number length (8 bytes).',
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export const AuthenticationErrorBch = AuthenticationErrorBch2023;

/**
 * @deprecated Alias of `AuthenticationErrorBch2023` for backwards-compatibility.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const AuthenticationErrorBCH2023 = AuthenticationErrorBch2023;

/**
 * @deprecated Alias of `AuthenticationErrorBch` for backwards-compatibility.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const AuthenticationErrorBCH = AuthenticationErrorBch;
