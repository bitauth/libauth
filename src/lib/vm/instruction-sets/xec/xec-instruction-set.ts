import type {
  AuthenticationProgramBch,
  AuthenticationProgramStateBch,
  InstructionSet,
  ResolvedTransactionBch,
} from '../../../lib.js';
import {
  conditionallyEvaluate,
  disabledOperation,
  incrementOperationCount,
  mapOverOperations,
  undefinedOperation,
} from '../common/common.js';

import { createInstructionSetBch2022 } from './bch-2022-instruction-set.js';
import { OpcodesXec } from './xec-opcodes.js';
import {
  op0NotEqual4Byte,
  op1Add4Byte,
  op1Sub4Byte,
  opAbs4Byte,
  opAdd4Byte,
  opBin2Num4Byte,
  opBoolAnd4Byte,
  opBoolOr4Byte,
  opDiv4Byte,
  opGreaterThan4Byte,
  opGreaterThanOrEqual4Byte,
  opLessThan4Byte,
  opLessThanOrEqual4Byte,
  opMax4Byte,
  opMin4Byte,
  opMod4Byte,
  opNegate4Byte,
  opNot4Byte,
  opNum2Bin4Byte,
  opNumEqual4Byte,
  opNumEqualVerify4Byte,
  opNumNotEqual4Byte,
  opPick4Byte,
  opRoll4Byte,
  opSplit4Byte,
  opSub4Byte,
  opWithin4Byte,
} from './xec-vm-number-operations.js';

/**
 * create an instance of the XEC virtual machine instruction set.
 *
 * @param standard - If `true`, the additional `isStandard` validations will be
 * enabled. Transactions that fail these rules are often called "non-standard"
 * and can technically be included by miners in valid blocks, but most network
 * nodes will refuse to relay them. (Default: `true`)
 */
export const createInstructionSetXec = (
  standard = true,
): InstructionSet<
  ResolvedTransactionBch,
  AuthenticationProgramBch,
  AuthenticationProgramStateBch
> => {
  const instructionSet = createInstructionSetBch2022(standard);
  return {
    ...instructionSet,
    operations: {
      ...instructionSet.operations,
      ...mapOverOperations<AuthenticationProgramStateBch>(
        [conditionallyEvaluate, incrementOperationCount],
        {
          [OpcodesXec.OP_PICK]: opPick4Byte,
          [OpcodesXec.OP_ROLL]: opRoll4Byte,
          [OpcodesXec.OP_SPLIT]: opSplit4Byte,
          [OpcodesXec.OP_NUM2BIN]: opNum2Bin4Byte,
          [OpcodesXec.OP_BIN2NUM]: opBin2Num4Byte,
          [OpcodesXec.OP_1ADD]: op1Add4Byte,
          [OpcodesXec.OP_1SUB]: op1Sub4Byte,
          [OpcodesXec.OP_NEGATE]: opNegate4Byte,
          [OpcodesXec.OP_ABS]: opAbs4Byte,
          [OpcodesXec.OP_NOT]: opNot4Byte,
          [OpcodesXec.OP_0NOTEQUAL]: op0NotEqual4Byte,
          [OpcodesXec.OP_ADD]: opAdd4Byte,
          [OpcodesXec.OP_SUB]: opSub4Byte,
          [OpcodesXec.OP_MUL]: disabledOperation,
          [OpcodesXec.OP_DIV]: opDiv4Byte,
          [OpcodesXec.OP_MOD]: opMod4Byte,
          [OpcodesXec.OP_BOOLAND]: opBoolAnd4Byte,
          [OpcodesXec.OP_BOOLOR]: opBoolOr4Byte,
          [OpcodesXec.OP_NUMEQUAL]: opNumEqual4Byte,
          [OpcodesXec.OP_NUMEQUALVERIFY]: opNumEqualVerify4Byte,
          [OpcodesXec.OP_NUMNOTEQUAL]: opNumNotEqual4Byte,
          [OpcodesXec.OP_LESSTHAN]: opLessThan4Byte,
          [OpcodesXec.OP_GREATERTHAN]: opGreaterThan4Byte,
          [OpcodesXec.OP_LESSTHANOREQUAL]: opLessThanOrEqual4Byte,
          [OpcodesXec.OP_GREATERTHANOREQUAL]: opGreaterThanOrEqual4Byte,
          [OpcodesXec.OP_MIN]: opMin4Byte,
          [OpcodesXec.OP_MAX]: opMax4Byte,
          [OpcodesXec.OP_WITHIN]: opWithin4Byte,
        },
      ),
      [OpcodesXec.OP_UNKNOWN192]: undefinedOperation,
      [OpcodesXec.OP_UNKNOWN193]: undefinedOperation,
      [OpcodesXec.OP_UNKNOWN194]: undefinedOperation,
      [OpcodesXec.OP_UNKNOWN195]: undefinedOperation,
      [OpcodesXec.OP_UNKNOWN196]: undefinedOperation,
      [OpcodesXec.OP_UNKNOWN197]: undefinedOperation,
      [OpcodesXec.OP_UNKNOWN198]: undefinedOperation,
      [OpcodesXec.OP_UNKNOWN199]: undefinedOperation,
      [OpcodesXec.OP_UNKNOWN200]: undefinedOperation,
      [OpcodesXec.OP_UNKNOWN201]: undefinedOperation,
      [OpcodesXec.OP_UNKNOWN202]: undefinedOperation,
      [OpcodesXec.OP_UNKNOWN203]: undefinedOperation,
      [OpcodesXec.OP_UNKNOWN204]: undefinedOperation,
      [OpcodesXec.OP_UNKNOWN205]: undefinedOperation,
    },
  };
};
