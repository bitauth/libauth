import type {
  AuthenticationProgramBCH,
  AuthenticationProgramStateBCH,
  InstructionSet,
  ResolvedTransactionBCH,
} from '../../../lib.js';
import { createInstructionSetBCH2022 } from '../bch/2022/bch-2022-instruction-set.js';
import { OpcodesBCH2022 } from '../bch/2022/bch-2022-opcodes.js';
import {
  conditionallyEvaluate,
  disabledOperation,
  incrementOperationCount,
  mapOverOperations,
  undefinedOperation,
} from '../common/common.js';

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
export const createInstructionSetXEC = (
  standard = true,
): InstructionSet<
  ResolvedTransactionBCH,
  AuthenticationProgramBCH,
  AuthenticationProgramStateBCH
> => {
  const instructionSet = createInstructionSetBCH2022(standard);
  return {
    ...instructionSet,
    operations: {
      ...instructionSet.operations,
      ...mapOverOperations<AuthenticationProgramStateBCH>(
        [conditionallyEvaluate, incrementOperationCount],
        {
          [OpcodesBCH2022.OP_PICK]: opPick4Byte,
          [OpcodesBCH2022.OP_ROLL]: opRoll4Byte,
          [OpcodesBCH2022.OP_SPLIT]: opSplit4Byte,
          [OpcodesBCH2022.OP_NUM2BIN]: opNum2Bin4Byte,
          [OpcodesBCH2022.OP_BIN2NUM]: opBin2Num4Byte,
          [OpcodesBCH2022.OP_1ADD]: op1Add4Byte,
          [OpcodesBCH2022.OP_1SUB]: op1Sub4Byte,
          [OpcodesBCH2022.OP_NEGATE]: opNegate4Byte,
          [OpcodesBCH2022.OP_ABS]: opAbs4Byte,
          [OpcodesBCH2022.OP_NOT]: opNot4Byte,
          [OpcodesBCH2022.OP_0NOTEQUAL]: op0NotEqual4Byte,
          [OpcodesBCH2022.OP_ADD]: opAdd4Byte,
          [OpcodesBCH2022.OP_SUB]: opSub4Byte,
          [OpcodesBCH2022.OP_MUL]: disabledOperation,
          [OpcodesBCH2022.OP_DIV]: opDiv4Byte,
          [OpcodesBCH2022.OP_MOD]: opMod4Byte,
          [OpcodesBCH2022.OP_BOOLAND]: opBoolAnd4Byte,
          [OpcodesBCH2022.OP_BOOLOR]: opBoolOr4Byte,
          [OpcodesBCH2022.OP_NUMEQUAL]: opNumEqual4Byte,
          [OpcodesBCH2022.OP_NUMEQUALVERIFY]: opNumEqualVerify4Byte,
          [OpcodesBCH2022.OP_NUMNOTEQUAL]: opNumNotEqual4Byte,
          [OpcodesBCH2022.OP_LESSTHAN]: opLessThan4Byte,
          [OpcodesBCH2022.OP_GREATERTHAN]: opGreaterThan4Byte,
          [OpcodesBCH2022.OP_LESSTHANOREQUAL]: opLessThanOrEqual4Byte,
          [OpcodesBCH2022.OP_GREATERTHANOREQUAL]: opGreaterThanOrEqual4Byte,
          [OpcodesBCH2022.OP_MIN]: opMin4Byte,
          [OpcodesBCH2022.OP_MAX]: opMax4Byte,
          [OpcodesBCH2022.OP_WITHIN]: opWithin4Byte,
        },
      ),
      [OpcodesBCH2022.OP_INPUTINDEX]: undefinedOperation,
      [OpcodesBCH2022.OP_ACTIVEBYTECODE]: undefinedOperation,
      [OpcodesBCH2022.OP_TXVERSION]: undefinedOperation,
      [OpcodesBCH2022.OP_TXINPUTCOUNT]: undefinedOperation,
      [OpcodesBCH2022.OP_TXOUTPUTCOUNT]: undefinedOperation,
      [OpcodesBCH2022.OP_TXLOCKTIME]: undefinedOperation,
      [OpcodesBCH2022.OP_UTXOVALUE]: undefinedOperation,
      [OpcodesBCH2022.OP_UTXOBYTECODE]: undefinedOperation,
      [OpcodesBCH2022.OP_OUTPOINTTXHASH]: undefinedOperation,
      [OpcodesBCH2022.OP_OUTPOINTINDEX]: undefinedOperation,
      [OpcodesBCH2022.OP_INPUTBYTECODE]: undefinedOperation,
      [OpcodesBCH2022.OP_INPUTSEQUENCENUMBER]: undefinedOperation,
      [OpcodesBCH2022.OP_OUTPUTVALUE]: undefinedOperation,
      [OpcodesBCH2022.OP_OUTPUTBYTECODE]: undefinedOperation,
    },
  };
};
