export enum AuthenticationErrorBCH {
  exceededMaximumOperationCount = 'Program exceeded the maximum operation count (201 operations).',
  exceededMaximumStackItemLength = 'Program attempted to push a stack item which exceeded the maximum stack item length (520 bytes).',
  exceededMaximumScriptNumberLength = 'Program attempted an OP_BIN2NUM operation on a byte sequence which cannot be encoded within the maximum Script Number length (4 bytes).',
  divisionByZero = 'Program attempted to divide a number by zero.',
  insufficientLength = 'Program called an OP_NUM2BIN operation with an insufficient byte length to re-encode the provided number.',
  invalidSplitIndex = 'Program called an OP_SPLIT operation with an invalid index.',
  malformedP2shBytecode = 'Redeem bytecode was malformed prior to P2SH evaluation.',
  mismatchedBitwiseOperandLength = 'Program attempted a bitwise operation on operands of different lengths.',
  requiresPushOnly = 'Unlocking bytecode may contain only push operations.',
}
