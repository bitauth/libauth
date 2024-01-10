import { isPayToScriptHash20 } from '../../../../address/address.js';
import {
  ripemd160 as internalRipemd160,
  secp256k1 as internalSecp256k1,
  sha1 as internalSha1,
  sha256 as internalSha256,
} from '../../../../crypto/crypto.js';
import type {
  AuthenticationProgramBCH,
  AuthenticationProgramStateBCHCHIPs,
  InstructionSet,
  ResolvedTransactionBCH,
  Ripemd160,
  Secp256k1,
  Sha1,
  Sha256,
} from '../../../../lib.js';
import { encodeTransactionBCH } from '../../../../message/message.js';
import {
  applyError,
  AuthenticationErrorCommon,
  authenticationInstructionsAreMalformed,
  cloneStack,
  ConsensusBCH,
  decodeAuthenticationInstructions,
  disabledOperation,
  isArbitraryDataOutput,
  isPushOnly,
  isStandardOutputBytecode,
  isWitnessProgram,
  op0NotEqual,
  op1Add,
  op1Sub,
  op2Drop,
  op2Dup,
  op2Over,
  op2Rot,
  op2Swap,
  op3Dup,
  opAbs,
  opActiveBytecode,
  opAdd,
  opAnd,
  opBin2Num,
  opBoolAnd,
  opBoolOr,
  opCat,
  opCheckDataSig,
  opCheckDataSigVerify,
  opCheckLockTimeVerify,
  opCheckSequenceVerify,
  opCodeSeparator,
  opDepth,
  opDiv,
  opDrop,
  opDup,
  opEqual,
  opEqualVerify,
  opFromAltStack,
  opGreaterThan,
  opGreaterThanOrEqual,
  opHash160,
  opHash256,
  opIfDup,
  opInputBytecode,
  opInputIndex,
  opInputSequenceNumber,
  opLessThan,
  opLessThanOrEqual,
  opMax,
  opMin,
  opMod,
  opMul,
  opNegate,
  opNip,
  opNop,
  opNopDisallowed,
  opNot,
  opNum2Bin,
  opNumEqual,
  opNumEqualVerify,
  opNumNotEqual,
  opOr,
  opOutpointIndex,
  opOutpointTxHash,
  opOutputBytecode,
  opOutputValue,
  opOver,
  opPick,
  opReturn,
  opReverseBytes,
  opRipemd160,
  opRoll,
  opRot,
  opSha1,
  opSha256,
  opSize,
  opSplit,
  opSub,
  opSwap,
  opToAltStack,
  opTuck,
  opTxInputCount,
  opTxLocktime,
  opTxOutputCount,
  opTxVersion,
  opUtxoBytecode,
  opUtxoValue,
  opVerify,
  opWithin,
  opXor,
  pushNumberOperation,
  reservedOperation,
  stackItemIsTruthy,
} from '../../common/common.js';
import {
  opOutputTokenAmount,
  opOutputTokenCategory,
  opOutputTokenCommitment,
  opUtxoTokenAmount,
  opUtxoTokenCategory,
  opUtxoTokenCommitment,
} from '../2023/bch-2023.js';

import {
  opCheckMultiSigChipLimits,
  opCheckMultiSigVerifyChipLimits,
  opCheckSigChipLimits,
  opCheckSigVerifyChipLimits,
} from './bch-chips-crypto.js';
import {
  conditionallyEvaluateChipLoops,
  opBegin,
  opElseChipLoops,
  opEndIfChipLoops,
  opIfChipLoops,
  opNotIfChipLoops,
  opUntil,
  pushOperationChipLoops,
  undefinedOperationChipLoops,
} from './bch-chips-loops.js';
import { OpcodesBCHCHIPs } from './bch-chips-opcodes.js';
import {
  cloneAuthenticationProgramStateBCHCHIPs,
  createAuthenticationProgramStateBCHCHIPs,
} from './bch-chips-types.js';

/**
 * create an instance of the BCH CHIPs virtual machine instruction set, an
 * informal, speculative instruction set that implements a variety of future
 * Bitcoin Cash Improvement Proposals (CHIPs).
 *
 * @param standard - If `true`, the additional `isStandard` validations will be
 * enabled. Transactions that fail these rules are often called "non-standard"
 * and can technically be included by miners in valid blocks, but most network
 * nodes will refuse to relay them. (Default: `true`)
 */
export const createInstructionSetBCHCHIPs = (
  standard = true,
  {
    ripemd160,
    secp256k1,
    sha1,
    sha256,
  }: {
    /**
     * a Ripemd160 implementation
     */
    ripemd160: { hash: Ripemd160['hash'] };
    /**
     * a Secp256k1 implementation
     */
    secp256k1: {
      verifySignatureSchnorr: Secp256k1['verifySignatureSchnorr'];
      verifySignatureDERLowS: Secp256k1['verifySignatureDERLowS'];
    };
    /**
     * a Sha1 implementation
     */
    sha1: { hash: Sha1['hash'] };
    /**
     * a Sha256 implementation
     */
    sha256: { hash: Sha256['hash'] };
  } = {
    ripemd160: internalRipemd160,
    secp256k1: internalSecp256k1,
    sha1: internalSha1,
    sha256: internalSha256,
  },
): InstructionSet<
  ResolvedTransactionBCH,
  AuthenticationProgramBCH,
  AuthenticationProgramStateBCHCHIPs
> => {
  const conditionallyPush =
    pushOperationChipLoops<AuthenticationProgramStateBCHCHIPs>();
  return {
    clone: cloneAuthenticationProgramStateBCHCHIPs,
    continue: (state) =>
      state.error === undefined && state.ip < state.instructions.length,
    // eslint-disable-next-line complexity
    evaluate: (program, stateEvaluate) => {
      const { unlockingBytecode } =
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        program.transaction.inputs[program.inputIndex]!;
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const { lockingBytecode } = program.sourceOutputs[program.inputIndex]!;
      const unlockingInstructions =
        decodeAuthenticationInstructions(unlockingBytecode);
      const lockingInstructions =
        decodeAuthenticationInstructions(lockingBytecode);
      const initialState = createAuthenticationProgramStateBCHCHIPs({
        instructions: unlockingInstructions,
        program,
        stack: [],
      });

      if (unlockingBytecode.length > ConsensusBCH.maximumBytecodeLength) {
        return applyError(
          initialState,
          `The provided unlocking bytecode (${unlockingBytecode.length} bytes) exceeds the maximum bytecode length (${ConsensusBCH.maximumBytecodeLength} bytes).`,
        );
      }
      if (authenticationInstructionsAreMalformed(unlockingInstructions)) {
        return applyError(
          initialState,
          AuthenticationErrorCommon.malformedUnlockingBytecode,
        );
      }
      if (!isPushOnly(unlockingBytecode)) {
        return applyError(
          initialState,
          AuthenticationErrorCommon.requiresPushOnly,
        );
      }
      if (lockingBytecode.length > ConsensusBCH.maximumBytecodeLength) {
        return applyError(
          initialState,
          AuthenticationErrorCommon.exceededMaximumBytecodeLengthLocking,
        );
      }
      if (authenticationInstructionsAreMalformed(lockingInstructions)) {
        return applyError(
          initialState,
          AuthenticationErrorCommon.malformedLockingBytecode,
        );
      }
      const unlockingResult = stateEvaluate(initialState);
      if (unlockingResult.error !== undefined) {
        return unlockingResult;
      }
      if (unlockingResult.controlStack.length !== 0) {
        return applyError(
          initialState,
          AuthenticationErrorCommon.nonEmptyControlStack,
        );
      }
      const lockingResult = stateEvaluate(
        createAuthenticationProgramStateBCHCHIPs({
          instructions: lockingInstructions,
          program,
          stack: unlockingResult.stack,
        }),
      );
      if (!isPayToScriptHash20(lockingBytecode)) {
        return lockingResult;
      }
      const p2shStack = cloneStack(unlockingResult.stack);
      // eslint-disable-next-line functional/immutable-data
      const p2shScript = p2shStack.pop() ?? Uint8Array.of();

      if (p2shStack.length === 0 && isWitnessProgram(p2shScript)) {
        return lockingResult;
      }

      const p2shInstructions = decodeAuthenticationInstructions(p2shScript);
      return authenticationInstructionsAreMalformed(p2shInstructions)
        ? {
            ...lockingResult,
            error: AuthenticationErrorCommon.malformedP2shBytecode,
          }
        : stateEvaluate(
            createAuthenticationProgramStateBCHCHIPs({
              instructions: p2shInstructions,
              program,
              stack: p2shStack,
            }),
          );
    },
    every: (state) => {
      if (
        state.stack.length + state.alternateStack.length >
        ConsensusBCH.maximumStackDepth
      ) {
        return applyError(
          state,
          AuthenticationErrorCommon.exceededMaximumStackDepth,
        );
      }
      return state;
    },
    operations: {
      [OpcodesBCHCHIPs.OP_0]: conditionallyPush,
      [OpcodesBCHCHIPs.OP_PUSHBYTES_1]: conditionallyPush,
      [OpcodesBCHCHIPs.OP_PUSHBYTES_2]: conditionallyPush,
      [OpcodesBCHCHIPs.OP_PUSHBYTES_3]: conditionallyPush,
      [OpcodesBCHCHIPs.OP_PUSHBYTES_4]: conditionallyPush,
      [OpcodesBCHCHIPs.OP_PUSHBYTES_5]: conditionallyPush,
      [OpcodesBCHCHIPs.OP_PUSHBYTES_6]: conditionallyPush,
      [OpcodesBCHCHIPs.OP_PUSHBYTES_7]: conditionallyPush,
      [OpcodesBCHCHIPs.OP_PUSHBYTES_8]: conditionallyPush,
      [OpcodesBCHCHIPs.OP_PUSHBYTES_9]: conditionallyPush,
      [OpcodesBCHCHIPs.OP_PUSHBYTES_10]: conditionallyPush,
      [OpcodesBCHCHIPs.OP_PUSHBYTES_11]: conditionallyPush,
      [OpcodesBCHCHIPs.OP_PUSHBYTES_12]: conditionallyPush,
      [OpcodesBCHCHIPs.OP_PUSHBYTES_13]: conditionallyPush,
      [OpcodesBCHCHIPs.OP_PUSHBYTES_14]: conditionallyPush,
      [OpcodesBCHCHIPs.OP_PUSHBYTES_15]: conditionallyPush,
      [OpcodesBCHCHIPs.OP_PUSHBYTES_16]: conditionallyPush,
      [OpcodesBCHCHIPs.OP_PUSHBYTES_17]: conditionallyPush,
      [OpcodesBCHCHIPs.OP_PUSHBYTES_18]: conditionallyPush,
      [OpcodesBCHCHIPs.OP_PUSHBYTES_19]: conditionallyPush,
      [OpcodesBCHCHIPs.OP_PUSHBYTES_20]: conditionallyPush,
      [OpcodesBCHCHIPs.OP_PUSHBYTES_21]: conditionallyPush,
      [OpcodesBCHCHIPs.OP_PUSHBYTES_22]: conditionallyPush,
      [OpcodesBCHCHIPs.OP_PUSHBYTES_23]: conditionallyPush,
      [OpcodesBCHCHIPs.OP_PUSHBYTES_24]: conditionallyPush,
      [OpcodesBCHCHIPs.OP_PUSHBYTES_25]: conditionallyPush,
      [OpcodesBCHCHIPs.OP_PUSHBYTES_26]: conditionallyPush,
      [OpcodesBCHCHIPs.OP_PUSHBYTES_27]: conditionallyPush,
      [OpcodesBCHCHIPs.OP_PUSHBYTES_28]: conditionallyPush,
      [OpcodesBCHCHIPs.OP_PUSHBYTES_29]: conditionallyPush,
      [OpcodesBCHCHIPs.OP_PUSHBYTES_30]: conditionallyPush,
      [OpcodesBCHCHIPs.OP_PUSHBYTES_31]: conditionallyPush,
      [OpcodesBCHCHIPs.OP_PUSHBYTES_32]: conditionallyPush,
      [OpcodesBCHCHIPs.OP_PUSHBYTES_33]: conditionallyPush,
      [OpcodesBCHCHIPs.OP_PUSHBYTES_34]: conditionallyPush,
      [OpcodesBCHCHIPs.OP_PUSHBYTES_35]: conditionallyPush,
      [OpcodesBCHCHIPs.OP_PUSHBYTES_36]: conditionallyPush,
      [OpcodesBCHCHIPs.OP_PUSHBYTES_37]: conditionallyPush,
      [OpcodesBCHCHIPs.OP_PUSHBYTES_38]: conditionallyPush,
      [OpcodesBCHCHIPs.OP_PUSHBYTES_39]: conditionallyPush,
      [OpcodesBCHCHIPs.OP_PUSHBYTES_40]: conditionallyPush,
      [OpcodesBCHCHIPs.OP_PUSHBYTES_41]: conditionallyPush,
      [OpcodesBCHCHIPs.OP_PUSHBYTES_42]: conditionallyPush,
      [OpcodesBCHCHIPs.OP_PUSHBYTES_43]: conditionallyPush,
      [OpcodesBCHCHIPs.OP_PUSHBYTES_44]: conditionallyPush,
      [OpcodesBCHCHIPs.OP_PUSHBYTES_45]: conditionallyPush,
      [OpcodesBCHCHIPs.OP_PUSHBYTES_46]: conditionallyPush,
      [OpcodesBCHCHIPs.OP_PUSHBYTES_47]: conditionallyPush,
      [OpcodesBCHCHIPs.OP_PUSHBYTES_48]: conditionallyPush,
      [OpcodesBCHCHIPs.OP_PUSHBYTES_49]: conditionallyPush,
      [OpcodesBCHCHIPs.OP_PUSHBYTES_50]: conditionallyPush,
      [OpcodesBCHCHIPs.OP_PUSHBYTES_51]: conditionallyPush,
      [OpcodesBCHCHIPs.OP_PUSHBYTES_52]: conditionallyPush,
      [OpcodesBCHCHIPs.OP_PUSHBYTES_53]: conditionallyPush,
      [OpcodesBCHCHIPs.OP_PUSHBYTES_54]: conditionallyPush,
      [OpcodesBCHCHIPs.OP_PUSHBYTES_55]: conditionallyPush,
      [OpcodesBCHCHIPs.OP_PUSHBYTES_56]: conditionallyPush,
      [OpcodesBCHCHIPs.OP_PUSHBYTES_57]: conditionallyPush,
      [OpcodesBCHCHIPs.OP_PUSHBYTES_58]: conditionallyPush,
      [OpcodesBCHCHIPs.OP_PUSHBYTES_59]: conditionallyPush,
      [OpcodesBCHCHIPs.OP_PUSHBYTES_60]: conditionallyPush,
      [OpcodesBCHCHIPs.OP_PUSHBYTES_61]: conditionallyPush,
      [OpcodesBCHCHIPs.OP_PUSHBYTES_62]: conditionallyPush,
      [OpcodesBCHCHIPs.OP_PUSHBYTES_63]: conditionallyPush,
      [OpcodesBCHCHIPs.OP_PUSHBYTES_64]: conditionallyPush,
      [OpcodesBCHCHIPs.OP_PUSHBYTES_65]: conditionallyPush,
      [OpcodesBCHCHIPs.OP_PUSHBYTES_66]: conditionallyPush,
      [OpcodesBCHCHIPs.OP_PUSHBYTES_67]: conditionallyPush,
      [OpcodesBCHCHIPs.OP_PUSHBYTES_68]: conditionallyPush,
      [OpcodesBCHCHIPs.OP_PUSHBYTES_69]: conditionallyPush,
      [OpcodesBCHCHIPs.OP_PUSHBYTES_70]: conditionallyPush,
      [OpcodesBCHCHIPs.OP_PUSHBYTES_71]: conditionallyPush,
      [OpcodesBCHCHIPs.OP_PUSHBYTES_72]: conditionallyPush,
      [OpcodesBCHCHIPs.OP_PUSHBYTES_73]: conditionallyPush,
      [OpcodesBCHCHIPs.OP_PUSHBYTES_74]: conditionallyPush,
      [OpcodesBCHCHIPs.OP_PUSHBYTES_75]: conditionallyPush,
      [OpcodesBCHCHIPs.OP_PUSHDATA_1]: conditionallyPush,
      [OpcodesBCHCHIPs.OP_PUSHDATA_2]: conditionallyPush,
      [OpcodesBCHCHIPs.OP_PUSHDATA_4]: conditionallyPush,
      [OpcodesBCHCHIPs.OP_1NEGATE]: conditionallyEvaluateChipLoops(
        pushNumberOperation(-1),
      ),
      [OpcodesBCHCHIPs.OP_RESERVED]:
        conditionallyEvaluateChipLoops(reservedOperation),
      [OpcodesBCHCHIPs.OP_1]: conditionallyEvaluateChipLoops(
        pushNumberOperation(1),
      ),
      /* eslint-disable @typescript-eslint/no-magic-numbers */
      [OpcodesBCHCHIPs.OP_2]: conditionallyEvaluateChipLoops(
        pushNumberOperation(2),
      ),
      [OpcodesBCHCHIPs.OP_3]: conditionallyEvaluateChipLoops(
        pushNumberOperation(3),
      ),
      [OpcodesBCHCHIPs.OP_4]: conditionallyEvaluateChipLoops(
        pushNumberOperation(4),
      ),
      [OpcodesBCHCHIPs.OP_5]: conditionallyEvaluateChipLoops(
        pushNumberOperation(5),
      ),
      [OpcodesBCHCHIPs.OP_6]: conditionallyEvaluateChipLoops(
        pushNumberOperation(6),
      ),
      [OpcodesBCHCHIPs.OP_7]: conditionallyEvaluateChipLoops(
        pushNumberOperation(7),
      ),
      [OpcodesBCHCHIPs.OP_8]: conditionallyEvaluateChipLoops(
        pushNumberOperation(8),
      ),
      [OpcodesBCHCHIPs.OP_9]: conditionallyEvaluateChipLoops(
        pushNumberOperation(9),
      ),
      [OpcodesBCHCHIPs.OP_10]: conditionallyEvaluateChipLoops(
        pushNumberOperation(10),
      ),
      [OpcodesBCHCHIPs.OP_11]: conditionallyEvaluateChipLoops(
        pushNumberOperation(11),
      ),
      [OpcodesBCHCHIPs.OP_12]: conditionallyEvaluateChipLoops(
        pushNumberOperation(12),
      ),
      [OpcodesBCHCHIPs.OP_13]: conditionallyEvaluateChipLoops(
        pushNumberOperation(13),
      ),
      [OpcodesBCHCHIPs.OP_14]: conditionallyEvaluateChipLoops(
        pushNumberOperation(14),
      ),
      [OpcodesBCHCHIPs.OP_15]: conditionallyEvaluateChipLoops(
        pushNumberOperation(15),
      ),
      [OpcodesBCHCHIPs.OP_16]: conditionallyEvaluateChipLoops(
        pushNumberOperation(16),
      ),
      /* eslint-enable @typescript-eslint/no-magic-numbers */

      [OpcodesBCHCHIPs.OP_NOP]: conditionallyEvaluateChipLoops(opNop),
      [OpcodesBCHCHIPs.OP_VER]:
        conditionallyEvaluateChipLoops(reservedOperation),
      [OpcodesBCHCHIPs.OP_IF]: opIfChipLoops,
      [OpcodesBCHCHIPs.OP_NOTIF]: opNotIfChipLoops,
      [OpcodesBCHCHIPs.OP_BEGIN]: conditionallyEvaluateChipLoops(opBegin),
      [OpcodesBCHCHIPs.OP_UNTIL]: conditionallyEvaluateChipLoops(opUntil),
      [OpcodesBCHCHIPs.OP_ELSE]: opElseChipLoops,
      [OpcodesBCHCHIPs.OP_ENDIF]: opEndIfChipLoops,
      [OpcodesBCHCHIPs.OP_VERIFY]: conditionallyEvaluateChipLoops(opVerify),
      [OpcodesBCHCHIPs.OP_RETURN]: conditionallyEvaluateChipLoops(opReturn),
      [OpcodesBCHCHIPs.OP_TOALTSTACK]:
        conditionallyEvaluateChipLoops(opToAltStack),
      [OpcodesBCHCHIPs.OP_FROMALTSTACK]:
        conditionallyEvaluateChipLoops(opFromAltStack),
      [OpcodesBCHCHIPs.OP_2DROP]: conditionallyEvaluateChipLoops(op2Drop),
      [OpcodesBCHCHIPs.OP_2DUP]: conditionallyEvaluateChipLoops(op2Dup),
      [OpcodesBCHCHIPs.OP_3DUP]: conditionallyEvaluateChipLoops(op3Dup),
      [OpcodesBCHCHIPs.OP_2OVER]: conditionallyEvaluateChipLoops(op2Over),
      [OpcodesBCHCHIPs.OP_2ROT]: conditionallyEvaluateChipLoops(op2Rot),
      [OpcodesBCHCHIPs.OP_2SWAP]: conditionallyEvaluateChipLoops(op2Swap),
      [OpcodesBCHCHIPs.OP_IFDUP]: conditionallyEvaluateChipLoops(opIfDup),
      [OpcodesBCHCHIPs.OP_DEPTH]: conditionallyEvaluateChipLoops(opDepth),
      [OpcodesBCHCHIPs.OP_DROP]: conditionallyEvaluateChipLoops(opDrop),
      [OpcodesBCHCHIPs.OP_DUP]: conditionallyEvaluateChipLoops(opDup),
      [OpcodesBCHCHIPs.OP_NIP]: conditionallyEvaluateChipLoops(opNip),
      [OpcodesBCHCHIPs.OP_OVER]: conditionallyEvaluateChipLoops(opOver),
      [OpcodesBCHCHIPs.OP_PICK]: conditionallyEvaluateChipLoops(opPick),
      [OpcodesBCHCHIPs.OP_ROLL]: conditionallyEvaluateChipLoops(opRoll),
      [OpcodesBCHCHIPs.OP_ROT]: conditionallyEvaluateChipLoops(opRot),
      [OpcodesBCHCHIPs.OP_SWAP]: conditionallyEvaluateChipLoops(opSwap),
      [OpcodesBCHCHIPs.OP_TUCK]: conditionallyEvaluateChipLoops(opTuck),
      [OpcodesBCHCHIPs.OP_CAT]: conditionallyEvaluateChipLoops(opCat),
      [OpcodesBCHCHIPs.OP_SPLIT]: conditionallyEvaluateChipLoops(opSplit),
      [OpcodesBCHCHIPs.OP_NUM2BIN]: conditionallyEvaluateChipLoops(opNum2Bin),
      [OpcodesBCHCHIPs.OP_BIN2NUM]: conditionallyEvaluateChipLoops(opBin2Num),
      [OpcodesBCHCHIPs.OP_SIZE]: conditionallyEvaluateChipLoops(opSize),
      [OpcodesBCHCHIPs.OP_INVERT]: disabledOperation,
      [OpcodesBCHCHIPs.OP_AND]: conditionallyEvaluateChipLoops(opAnd),
      [OpcodesBCHCHIPs.OP_OR]: conditionallyEvaluateChipLoops(opOr),
      [OpcodesBCHCHIPs.OP_XOR]: conditionallyEvaluateChipLoops(opXor),
      [OpcodesBCHCHIPs.OP_EQUAL]: conditionallyEvaluateChipLoops(opEqual),
      [OpcodesBCHCHIPs.OP_EQUALVERIFY]:
        conditionallyEvaluateChipLoops(opEqualVerify),
      [OpcodesBCHCHIPs.OP_RESERVED1]:
        conditionallyEvaluateChipLoops(reservedOperation),
      [OpcodesBCHCHIPs.OP_RESERVED2]:
        conditionallyEvaluateChipLoops(reservedOperation),
      [OpcodesBCHCHIPs.OP_1ADD]: conditionallyEvaluateChipLoops(op1Add),
      [OpcodesBCHCHIPs.OP_1SUB]: conditionallyEvaluateChipLoops(op1Sub),
      [OpcodesBCHCHIPs.OP_2MUL]: disabledOperation,
      [OpcodesBCHCHIPs.OP_2DIV]: disabledOperation,
      [OpcodesBCHCHIPs.OP_NEGATE]: conditionallyEvaluateChipLoops(opNegate),
      [OpcodesBCHCHIPs.OP_ABS]: conditionallyEvaluateChipLoops(opAbs),
      [OpcodesBCHCHIPs.OP_NOT]: conditionallyEvaluateChipLoops(opNot),
      [OpcodesBCHCHIPs.OP_0NOTEQUAL]:
        conditionallyEvaluateChipLoops(op0NotEqual),
      [OpcodesBCHCHIPs.OP_ADD]: conditionallyEvaluateChipLoops(opAdd),
      [OpcodesBCHCHIPs.OP_SUB]: conditionallyEvaluateChipLoops(opSub),
      [OpcodesBCHCHIPs.OP_MUL]: conditionallyEvaluateChipLoops(opMul),
      [OpcodesBCHCHIPs.OP_DIV]: conditionallyEvaluateChipLoops(opDiv),
      [OpcodesBCHCHIPs.OP_MOD]: conditionallyEvaluateChipLoops(opMod),
      [OpcodesBCHCHIPs.OP_LSHIFT]: disabledOperation,
      [OpcodesBCHCHIPs.OP_RSHIFT]: disabledOperation,
      [OpcodesBCHCHIPs.OP_BOOLAND]: conditionallyEvaluateChipLoops(opBoolAnd),
      [OpcodesBCHCHIPs.OP_BOOLOR]: conditionallyEvaluateChipLoops(opBoolOr),
      [OpcodesBCHCHIPs.OP_NUMEQUAL]: conditionallyEvaluateChipLoops(opNumEqual),
      [OpcodesBCHCHIPs.OP_NUMEQUALVERIFY]:
        conditionallyEvaluateChipLoops(opNumEqualVerify),
      [OpcodesBCHCHIPs.OP_NUMNOTEQUAL]:
        conditionallyEvaluateChipLoops(opNumNotEqual),
      [OpcodesBCHCHIPs.OP_LESSTHAN]: conditionallyEvaluateChipLoops(opLessThan),
      [OpcodesBCHCHIPs.OP_GREATERTHAN]:
        conditionallyEvaluateChipLoops(opGreaterThan),
      [OpcodesBCHCHIPs.OP_LESSTHANOREQUAL]:
        conditionallyEvaluateChipLoops(opLessThanOrEqual),
      [OpcodesBCHCHIPs.OP_GREATERTHANOREQUAL]:
        conditionallyEvaluateChipLoops(opGreaterThanOrEqual),
      [OpcodesBCHCHIPs.OP_MIN]: conditionallyEvaluateChipLoops(opMin),
      [OpcodesBCHCHIPs.OP_MAX]: conditionallyEvaluateChipLoops(opMax),
      [OpcodesBCHCHIPs.OP_WITHIN]: conditionallyEvaluateChipLoops(opWithin),
      [OpcodesBCHCHIPs.OP_RIPEMD160]: conditionallyEvaluateChipLoops(
        opRipemd160({ ripemd160 }),
      ),
      [OpcodesBCHCHIPs.OP_SHA1]: conditionallyEvaluateChipLoops(
        opSha1({ sha1 }),
      ),
      [OpcodesBCHCHIPs.OP_SHA256]: conditionallyEvaluateChipLoops(
        opSha256({ sha256 }),
      ),
      [OpcodesBCHCHIPs.OP_HASH160]: conditionallyEvaluateChipLoops(
        opHash160({ ripemd160, sha256 }),
      ),
      [OpcodesBCHCHIPs.OP_HASH256]: conditionallyEvaluateChipLoops(
        opHash256({ sha256 }),
      ),
      [OpcodesBCHCHIPs.OP_CODESEPARATOR]:
        conditionallyEvaluateChipLoops(opCodeSeparator),
      [OpcodesBCHCHIPs.OP_CHECKSIG]: conditionallyEvaluateChipLoops(
        opCheckSigChipLimits({ secp256k1, sha256 }),
      ),
      [OpcodesBCHCHIPs.OP_CHECKSIGVERIFY]: conditionallyEvaluateChipLoops(
        opCheckSigVerifyChipLimits({ secp256k1, sha256 }),
      ),
      [OpcodesBCHCHIPs.OP_CHECKMULTISIG]: conditionallyEvaluateChipLoops(
        opCheckMultiSigChipLimits({ secp256k1, sha256 }),
      ),
      [OpcodesBCHCHIPs.OP_CHECKMULTISIGVERIFY]: conditionallyEvaluateChipLoops(
        opCheckMultiSigVerifyChipLimits({ secp256k1, sha256 }),
      ),
      ...(standard
        ? {
            [OpcodesBCHCHIPs.OP_NOP1]:
              conditionallyEvaluateChipLoops(opNopDisallowed),
            [OpcodesBCHCHIPs.OP_CHECKLOCKTIMEVERIFY]:
              conditionallyEvaluateChipLoops(opCheckLockTimeVerify),
            [OpcodesBCHCHIPs.OP_CHECKSEQUENCEVERIFY]:
              conditionallyEvaluateChipLoops(opCheckSequenceVerify),
            [OpcodesBCHCHIPs.OP_NOP4]:
              conditionallyEvaluateChipLoops(opNopDisallowed),
            [OpcodesBCHCHIPs.OP_NOP5]:
              conditionallyEvaluateChipLoops(opNopDisallowed),
            [OpcodesBCHCHIPs.OP_NOP6]:
              conditionallyEvaluateChipLoops(opNopDisallowed),
            [OpcodesBCHCHIPs.OP_NOP7]:
              conditionallyEvaluateChipLoops(opNopDisallowed),
            [OpcodesBCHCHIPs.OP_NOP8]:
              conditionallyEvaluateChipLoops(opNopDisallowed),
            [OpcodesBCHCHIPs.OP_NOP9]:
              conditionallyEvaluateChipLoops(opNopDisallowed),
            [OpcodesBCHCHIPs.OP_NOP10]:
              conditionallyEvaluateChipLoops(opNopDisallowed),
          }
        : {
            [OpcodesBCHCHIPs.OP_NOP1]: conditionallyEvaluateChipLoops(opNop),
            [OpcodesBCHCHIPs.OP_CHECKLOCKTIMEVERIFY]:
              conditionallyEvaluateChipLoops(opCheckLockTimeVerify),
            [OpcodesBCHCHIPs.OP_CHECKSEQUENCEVERIFY]:
              conditionallyEvaluateChipLoops(opCheckSequenceVerify),
            [OpcodesBCHCHIPs.OP_NOP4]: conditionallyEvaluateChipLoops(opNop),
            [OpcodesBCHCHIPs.OP_NOP5]: conditionallyEvaluateChipLoops(opNop),
            [OpcodesBCHCHIPs.OP_NOP6]: conditionallyEvaluateChipLoops(opNop),
            [OpcodesBCHCHIPs.OP_NOP7]: conditionallyEvaluateChipLoops(opNop),
            [OpcodesBCHCHIPs.OP_NOP8]: conditionallyEvaluateChipLoops(opNop),
            [OpcodesBCHCHIPs.OP_NOP9]: conditionallyEvaluateChipLoops(opNop),
            [OpcodesBCHCHIPs.OP_NOP10]: conditionallyEvaluateChipLoops(opNop),
          }),
      [OpcodesBCHCHIPs.OP_CHECKDATASIG]: conditionallyEvaluateChipLoops(
        opCheckDataSig({ secp256k1, sha256 }),
      ),
      [OpcodesBCHCHIPs.OP_CHECKDATASIGVERIFY]: conditionallyEvaluateChipLoops(
        opCheckDataSigVerify({ secp256k1, sha256 }),
      ),
      [OpcodesBCHCHIPs.OP_REVERSEBYTES]:
        conditionallyEvaluateChipLoops(opReverseBytes),
      [OpcodesBCHCHIPs.OP_INPUTINDEX]:
        conditionallyEvaluateChipLoops(opInputIndex),
      [OpcodesBCHCHIPs.OP_ACTIVEBYTECODE]:
        conditionallyEvaluateChipLoops(opActiveBytecode),
      [OpcodesBCHCHIPs.OP_TXVERSION]:
        conditionallyEvaluateChipLoops(opTxVersion),
      [OpcodesBCHCHIPs.OP_TXINPUTCOUNT]:
        conditionallyEvaluateChipLoops(opTxInputCount),
      [OpcodesBCHCHIPs.OP_TXOUTPUTCOUNT]:
        conditionallyEvaluateChipLoops(opTxOutputCount),
      [OpcodesBCHCHIPs.OP_TXLOCKTIME]:
        conditionallyEvaluateChipLoops(opTxLocktime),
      [OpcodesBCHCHIPs.OP_UTXOVALUE]:
        conditionallyEvaluateChipLoops(opUtxoValue),
      [OpcodesBCHCHIPs.OP_UTXOBYTECODE]:
        conditionallyEvaluateChipLoops(opUtxoBytecode),
      [OpcodesBCHCHIPs.OP_OUTPOINTTXHASH]:
        conditionallyEvaluateChipLoops(opOutpointTxHash),
      [OpcodesBCHCHIPs.OP_OUTPOINTINDEX]:
        conditionallyEvaluateChipLoops(opOutpointIndex),
      [OpcodesBCHCHIPs.OP_INPUTBYTECODE]:
        conditionallyEvaluateChipLoops(opInputBytecode),
      [OpcodesBCHCHIPs.OP_INPUTSEQUENCENUMBER]: conditionallyEvaluateChipLoops(
        opInputSequenceNumber,
      ),
      [OpcodesBCHCHIPs.OP_OUTPUTVALUE]:
        conditionallyEvaluateChipLoops(opOutputValue),
      [OpcodesBCHCHIPs.OP_OUTPUTBYTECODE]:
        conditionallyEvaluateChipLoops(opOutputBytecode),
      [OpcodesBCHCHIPs.OP_UTXOTOKENCATEGORY]:
        conditionallyEvaluateChipLoops(opUtxoTokenCategory),
      [OpcodesBCHCHIPs.OP_UTXOTOKENCOMMITMENT]: conditionallyEvaluateChipLoops(
        opUtxoTokenCommitment,
      ),
      [OpcodesBCHCHIPs.OP_UTXOTOKENAMOUNT]:
        conditionallyEvaluateChipLoops(opUtxoTokenAmount),
      [OpcodesBCHCHIPs.OP_OUTPUTTOKENCATEGORY]: conditionallyEvaluateChipLoops(
        opOutputTokenCategory,
      ),
      [OpcodesBCHCHIPs.OP_OUTPUTTOKENCOMMITMENT]:
        conditionallyEvaluateChipLoops(opOutputTokenCommitment),
      [OpcodesBCHCHIPs.OP_OUTPUTTOKENAMOUNT]:
        conditionallyEvaluateChipLoops(opOutputTokenAmount),
    },
    success: (state: AuthenticationProgramStateBCHCHIPs) => {
      if (state.error !== undefined) {
        return state.error;
      }
      if (state.controlStack.length !== 0) {
        return AuthenticationErrorCommon.nonEmptyControlStack;
      }
      if (state.stack.length !== 1) {
        return AuthenticationErrorCommon.requiresCleanStack;
      }
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      if (!stackItemIsTruthy(state.stack[0]!)) {
        return AuthenticationErrorCommon.unsuccessfulEvaluation;
      }
      return true;
    },
    undefined: undefinedOperationChipLoops,
    // eslint-disable-next-line complexity
    verify: ({ sourceOutputs, transaction }, evaluate, stateSuccess) => {
      if (transaction.inputs.length === 0) {
        return 'Transactions must have at least one input.';
      }
      if (transaction.outputs.length === 0) {
        return 'Transactions must have at least one output.';
      }
      if (transaction.inputs.length !== sourceOutputs.length) {
        return 'Unable to verify transaction: a single spent output must be provided for each transaction input.';
      }

      const transactionSize = encodeTransactionBCH(transaction).length;
      if (transactionSize < ConsensusBCH.minimumTransactionSize) {
        return `Transaction does not meet minimum size: the transaction is ${transactionSize} bytes, but the minimum transaction size is ${ConsensusBCH.minimumTransactionSize} bytes.`;
      }
      if (transactionSize > ConsensusBCH.maximumTransactionSize) {
        return `Transaction exceeds maximum size: the transaction is ${transactionSize} bytes, but the maximum transaction size is ${ConsensusBCH.maximumTransactionSize} bytes.`;
      }

      if (standard) {
        if (
          transaction.version < 1 ||
          transaction.version > ConsensusBCH.maximumStandardVersion
        ) {
          return `Standard transactions must have a version no less than 1 and no greater than ${ConsensusBCH.maximumStandardVersion}.`;
        }
        if (transactionSize > ConsensusBCH.maximumStandardTransactionSize) {
          return `Transaction exceeds maximum standard size: this transaction is ${transactionSize} bytes, but the maximum standard transaction size is ${ConsensusBCH.maximumStandardTransactionSize} bytes.`;
        }

        // eslint-disable-next-line functional/no-loop-statements
        for (const [index, output] of sourceOutputs.entries()) {
          if (!isStandardOutputBytecode(output.lockingBytecode)) {
            return `Standard transactions may only spend standard output types, but source output ${index} is non-standard.`;
          }
        }

        // eslint-disable-next-line functional/no-let
        let totalArbitraryDataBytes = 0;
        // eslint-disable-next-line functional/no-loop-statements
        for (const [index, output] of transaction.outputs.entries()) {
          if (!isStandardOutputBytecode(output.lockingBytecode)) {
            return `Standard transactions may only create standard output types, but transaction output ${index} is non-standard.`;
          }

          // eslint-disable-next-line functional/no-conditional-statements
          if (isArbitraryDataOutput(output.lockingBytecode)) {
            // eslint-disable-next-line functional/no-expression-statements
            totalArbitraryDataBytes += output.lockingBytecode.length + 1;
          }
          /*
           * TODO: disallow dust outputs
           * if(IsDustOutput(output)) {
           *   return ``;
           * }
           */
        }
        if (totalArbitraryDataBytes > ConsensusBCH.maximumDataCarrierBytes) {
          return `Standard transactions may carry no more than ${ConsensusBCH.maximumDataCarrierBytes} bytes in arbitrary data outputs; this transaction includes ${totalArbitraryDataBytes} bytes of arbitrary data.`;
        }

        // eslint-disable-next-line functional/no-loop-statements
        for (const [index, input] of transaction.inputs.entries()) {
          if (
            input.unlockingBytecode.length >
            ConsensusBCH.maximumStandardUnlockingBytecodeLength
          ) {
            return `Input index ${index} is non-standard: the unlocking bytecode (${input.unlockingBytecode.length} bytes) exceeds the maximum standard unlocking bytecode length (${ConsensusBCH.maximumStandardUnlockingBytecodeLength} bytes).`;
          }
          if (!isPushOnly(input.unlockingBytecode)) {
            return `Input index ${index} is non-standard: unlocking bytecode may contain only push operations.`;
          }
        }
      }

      // eslint-disable-next-line functional/no-loop-statements
      for (const index of transaction.inputs.keys()) {
        const state = evaluate({
          inputIndex: index,
          sourceOutputs,
          transaction,
        });
        const result = stateSuccess(state);
        if (typeof result === 'string') {
          return `Error in evaluating input index ${index}: ${result}`;
        }
      }

      return true;
    },
  };
};
