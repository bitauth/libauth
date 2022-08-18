export enum AuthenticationErrorBCH2023 {
  exceededMaximumVmNumberLength = 'Program attempted an OP_BIN2NUM operation on a byte sequence that cannot be encoded within the maximum VM Number length (8 bytes).',
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export const AuthenticationErrorBCH = AuthenticationErrorBCH2023;
