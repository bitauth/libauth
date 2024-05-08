import { isPayToScriptHash20 } from '../../../../address/address.js';
import {
  ripemd160 as internalRipemd160,
  secp256k1 as internalSecp256k1,
  sha1 as internalSha1,
  sha256 as internalSha256,
} from '../../../../crypto/crypto.js';
import type {
  AuthenticationProgramBch,
  AuthenticationProgramStateBchSpec,
  InstructionSet,
  ResolvedTransactionBch,
  Ripemd160,
  Secp256k1,
  Sha1,
  Sha256,
} from '../../../../lib.js';
import { encodeTransactionBch } from '../../../../message/message.js';
import {
  applyError,
  AuthenticationErrorCommon,
  authenticationInstructionsAreMalformed,
  ConsensusBch,
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
} from './bch-spec-crypto.js';
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
} from './bch-spec-loops.js';
import { OpcodesBchSpec } from './bch-spec-opcodes.js';
import { createAuthenticationProgramStateBchSpec } from './bch-spec-types.js';

/**
 * create an instance of the `BCH_SPEC` virtual machine instruction set, an
 * informal, speculative instruction set that implements a variety of future
 * Bitcoin Cash Improvement Proposals (CHIPs).
 *
 * @param standard - If `true`, the additional `isStandard` validations will be
 * enabled. Transactions that fail these rules are often called "non-standard"
 * and can technically be included by miners in valid blocks, but most network
 * nodes will refuse to relay them. (Default: `true`)
 */
export const createInstructionSetBchSpec = (
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
  ResolvedTransactionBch,
  AuthenticationProgramBch,
  AuthenticationProgramStateBchSpec
> => {
  const conditionallyPush =
    pushOperationChipLoops<AuthenticationProgramStateBchSpec>();
  return {
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
      const initialState = createAuthenticationProgramStateBchSpec({
        instructions: unlockingInstructions,
        program,
        stack: [],
      });

      if (unlockingBytecode.length > ConsensusBch.maximumBytecodeLength) {
        return applyError(
          initialState,
          `The provided unlocking bytecode (${unlockingBytecode.length} bytes) exceeds the maximum bytecode length (${ConsensusBch.maximumBytecodeLength} bytes).`,
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
      if (lockingBytecode.length > ConsensusBch.maximumBytecodeLength) {
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
        createAuthenticationProgramStateBchSpec({
          instructions: lockingInstructions,
          program,
          stack: unlockingResult.stack,
        }),
      );
      if (!isPayToScriptHash20(lockingBytecode)) {
        return lockingResult;
      }
      const p2shStack = structuredClone(unlockingResult.stack);

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
            createAuthenticationProgramStateBchSpec({
              instructions: p2shInstructions,
              program,
              stack: p2shStack,
            }),
          );
    },
    every: (state) => {
      if (
        state.stack.length + state.alternateStack.length >
        ConsensusBch.maximumStackDepth
      ) {
        return applyError(
          state,
          AuthenticationErrorCommon.exceededMaximumStackDepth,
        );
      }
      return state;
    },
    operations: {
      [OpcodesBchSpec.OP_0]: conditionallyPush,
      [OpcodesBchSpec.OP_PUSHBYTES_1]: conditionallyPush,
      [OpcodesBchSpec.OP_PUSHBYTES_2]: conditionallyPush,
      [OpcodesBchSpec.OP_PUSHBYTES_3]: conditionallyPush,
      [OpcodesBchSpec.OP_PUSHBYTES_4]: conditionallyPush,
      [OpcodesBchSpec.OP_PUSHBYTES_5]: conditionallyPush,
      [OpcodesBchSpec.OP_PUSHBYTES_6]: conditionallyPush,
      [OpcodesBchSpec.OP_PUSHBYTES_7]: conditionallyPush,
      [OpcodesBchSpec.OP_PUSHBYTES_8]: conditionallyPush,
      [OpcodesBchSpec.OP_PUSHBYTES_9]: conditionallyPush,
      [OpcodesBchSpec.OP_PUSHBYTES_10]: conditionallyPush,
      [OpcodesBchSpec.OP_PUSHBYTES_11]: conditionallyPush,
      [OpcodesBchSpec.OP_PUSHBYTES_12]: conditionallyPush,
      [OpcodesBchSpec.OP_PUSHBYTES_13]: conditionallyPush,
      [OpcodesBchSpec.OP_PUSHBYTES_14]: conditionallyPush,
      [OpcodesBchSpec.OP_PUSHBYTES_15]: conditionallyPush,
      [OpcodesBchSpec.OP_PUSHBYTES_16]: conditionallyPush,
      [OpcodesBchSpec.OP_PUSHBYTES_17]: conditionallyPush,
      [OpcodesBchSpec.OP_PUSHBYTES_18]: conditionallyPush,
      [OpcodesBchSpec.OP_PUSHBYTES_19]: conditionallyPush,
      [OpcodesBchSpec.OP_PUSHBYTES_20]: conditionallyPush,
      [OpcodesBchSpec.OP_PUSHBYTES_21]: conditionallyPush,
      [OpcodesBchSpec.OP_PUSHBYTES_22]: conditionallyPush,
      [OpcodesBchSpec.OP_PUSHBYTES_23]: conditionallyPush,
      [OpcodesBchSpec.OP_PUSHBYTES_24]: conditionallyPush,
      [OpcodesBchSpec.OP_PUSHBYTES_25]: conditionallyPush,
      [OpcodesBchSpec.OP_PUSHBYTES_26]: conditionallyPush,
      [OpcodesBchSpec.OP_PUSHBYTES_27]: conditionallyPush,
      [OpcodesBchSpec.OP_PUSHBYTES_28]: conditionallyPush,
      [OpcodesBchSpec.OP_PUSHBYTES_29]: conditionallyPush,
      [OpcodesBchSpec.OP_PUSHBYTES_30]: conditionallyPush,
      [OpcodesBchSpec.OP_PUSHBYTES_31]: conditionallyPush,
      [OpcodesBchSpec.OP_PUSHBYTES_32]: conditionallyPush,
      [OpcodesBchSpec.OP_PUSHBYTES_33]: conditionallyPush,
      [OpcodesBchSpec.OP_PUSHBYTES_34]: conditionallyPush,
      [OpcodesBchSpec.OP_PUSHBYTES_35]: conditionallyPush,
      [OpcodesBchSpec.OP_PUSHBYTES_36]: conditionallyPush,
      [OpcodesBchSpec.OP_PUSHBYTES_37]: conditionallyPush,
      [OpcodesBchSpec.OP_PUSHBYTES_38]: conditionallyPush,
      [OpcodesBchSpec.OP_PUSHBYTES_39]: conditionallyPush,
      [OpcodesBchSpec.OP_PUSHBYTES_40]: conditionallyPush,
      [OpcodesBchSpec.OP_PUSHBYTES_41]: conditionallyPush,
      [OpcodesBchSpec.OP_PUSHBYTES_42]: conditionallyPush,
      [OpcodesBchSpec.OP_PUSHBYTES_43]: conditionallyPush,
      [OpcodesBchSpec.OP_PUSHBYTES_44]: conditionallyPush,
      [OpcodesBchSpec.OP_PUSHBYTES_45]: conditionallyPush,
      [OpcodesBchSpec.OP_PUSHBYTES_46]: conditionallyPush,
      [OpcodesBchSpec.OP_PUSHBYTES_47]: conditionallyPush,
      [OpcodesBchSpec.OP_PUSHBYTES_48]: conditionallyPush,
      [OpcodesBchSpec.OP_PUSHBYTES_49]: conditionallyPush,
      [OpcodesBchSpec.OP_PUSHBYTES_50]: conditionallyPush,
      [OpcodesBchSpec.OP_PUSHBYTES_51]: conditionallyPush,
      [OpcodesBchSpec.OP_PUSHBYTES_52]: conditionallyPush,
      [OpcodesBchSpec.OP_PUSHBYTES_53]: conditionallyPush,
      [OpcodesBchSpec.OP_PUSHBYTES_54]: conditionallyPush,
      [OpcodesBchSpec.OP_PUSHBYTES_55]: conditionallyPush,
      [OpcodesBchSpec.OP_PUSHBYTES_56]: conditionallyPush,
      [OpcodesBchSpec.OP_PUSHBYTES_57]: conditionallyPush,
      [OpcodesBchSpec.OP_PUSHBYTES_58]: conditionallyPush,
      [OpcodesBchSpec.OP_PUSHBYTES_59]: conditionallyPush,
      [OpcodesBchSpec.OP_PUSHBYTES_60]: conditionallyPush,
      [OpcodesBchSpec.OP_PUSHBYTES_61]: conditionallyPush,
      [OpcodesBchSpec.OP_PUSHBYTES_62]: conditionallyPush,
      [OpcodesBchSpec.OP_PUSHBYTES_63]: conditionallyPush,
      [OpcodesBchSpec.OP_PUSHBYTES_64]: conditionallyPush,
      [OpcodesBchSpec.OP_PUSHBYTES_65]: conditionallyPush,
      [OpcodesBchSpec.OP_PUSHBYTES_66]: conditionallyPush,
      [OpcodesBchSpec.OP_PUSHBYTES_67]: conditionallyPush,
      [OpcodesBchSpec.OP_PUSHBYTES_68]: conditionallyPush,
      [OpcodesBchSpec.OP_PUSHBYTES_69]: conditionallyPush,
      [OpcodesBchSpec.OP_PUSHBYTES_70]: conditionallyPush,
      [OpcodesBchSpec.OP_PUSHBYTES_71]: conditionallyPush,
      [OpcodesBchSpec.OP_PUSHBYTES_72]: conditionallyPush,
      [OpcodesBchSpec.OP_PUSHBYTES_73]: conditionallyPush,
      [OpcodesBchSpec.OP_PUSHBYTES_74]: conditionallyPush,
      [OpcodesBchSpec.OP_PUSHBYTES_75]: conditionallyPush,
      [OpcodesBchSpec.OP_PUSHDATA_1]: conditionallyPush,
      [OpcodesBchSpec.OP_PUSHDATA_2]: conditionallyPush,
      [OpcodesBchSpec.OP_PUSHDATA_4]: conditionallyPush,
      [OpcodesBchSpec.OP_1NEGATE]: conditionallyEvaluateChipLoops(
        pushNumberOperation(-1),
      ),
      [OpcodesBchSpec.OP_RESERVED]:
        conditionallyEvaluateChipLoops(reservedOperation),
      [OpcodesBchSpec.OP_1]: conditionallyEvaluateChipLoops(
        pushNumberOperation(1),
      ),
      /* eslint-disable @typescript-eslint/no-magic-numbers */
      [OpcodesBchSpec.OP_2]: conditionallyEvaluateChipLoops(
        pushNumberOperation(2),
      ),
      [OpcodesBchSpec.OP_3]: conditionallyEvaluateChipLoops(
        pushNumberOperation(3),
      ),
      [OpcodesBchSpec.OP_4]: conditionallyEvaluateChipLoops(
        pushNumberOperation(4),
      ),
      [OpcodesBchSpec.OP_5]: conditionallyEvaluateChipLoops(
        pushNumberOperation(5),
      ),
      [OpcodesBchSpec.OP_6]: conditionallyEvaluateChipLoops(
        pushNumberOperation(6),
      ),
      [OpcodesBchSpec.OP_7]: conditionallyEvaluateChipLoops(
        pushNumberOperation(7),
      ),
      [OpcodesBchSpec.OP_8]: conditionallyEvaluateChipLoops(
        pushNumberOperation(8),
      ),
      [OpcodesBchSpec.OP_9]: conditionallyEvaluateChipLoops(
        pushNumberOperation(9),
      ),
      [OpcodesBchSpec.OP_10]: conditionallyEvaluateChipLoops(
        pushNumberOperation(10),
      ),
      [OpcodesBchSpec.OP_11]: conditionallyEvaluateChipLoops(
        pushNumberOperation(11),
      ),
      [OpcodesBchSpec.OP_12]: conditionallyEvaluateChipLoops(
        pushNumberOperation(12),
      ),
      [OpcodesBchSpec.OP_13]: conditionallyEvaluateChipLoops(
        pushNumberOperation(13),
      ),
      [OpcodesBchSpec.OP_14]: conditionallyEvaluateChipLoops(
        pushNumberOperation(14),
      ),
      [OpcodesBchSpec.OP_15]: conditionallyEvaluateChipLoops(
        pushNumberOperation(15),
      ),
      [OpcodesBchSpec.OP_16]: conditionallyEvaluateChipLoops(
        pushNumberOperation(16),
      ),
      /* eslint-enable @typescript-eslint/no-magic-numbers */

      [OpcodesBchSpec.OP_NOP]: conditionallyEvaluateChipLoops(opNop),
      [OpcodesBchSpec.OP_VER]:
        conditionallyEvaluateChipLoops(reservedOperation),
      [OpcodesBchSpec.OP_IF]: opIfChipLoops,
      [OpcodesBchSpec.OP_NOTIF]: opNotIfChipLoops,
      [OpcodesBchSpec.OP_BEGIN]: conditionallyEvaluateChipLoops(opBegin),
      [OpcodesBchSpec.OP_UNTIL]: conditionallyEvaluateChipLoops(opUntil),
      [OpcodesBchSpec.OP_ELSE]: opElseChipLoops,
      [OpcodesBchSpec.OP_ENDIF]: opEndIfChipLoops,
      [OpcodesBchSpec.OP_VERIFY]: conditionallyEvaluateChipLoops(opVerify),
      [OpcodesBchSpec.OP_RETURN]: conditionallyEvaluateChipLoops(opReturn),
      [OpcodesBchSpec.OP_TOALTSTACK]:
        conditionallyEvaluateChipLoops(opToAltStack),
      [OpcodesBchSpec.OP_FROMALTSTACK]:
        conditionallyEvaluateChipLoops(opFromAltStack),
      [OpcodesBchSpec.OP_2DROP]: conditionallyEvaluateChipLoops(op2Drop),
      [OpcodesBchSpec.OP_2DUP]: conditionallyEvaluateChipLoops(op2Dup),
      [OpcodesBchSpec.OP_3DUP]: conditionallyEvaluateChipLoops(op3Dup),
      [OpcodesBchSpec.OP_2OVER]: conditionallyEvaluateChipLoops(op2Over),
      [OpcodesBchSpec.OP_2ROT]: conditionallyEvaluateChipLoops(op2Rot),
      [OpcodesBchSpec.OP_2SWAP]: conditionallyEvaluateChipLoops(op2Swap),
      [OpcodesBchSpec.OP_IFDUP]: conditionallyEvaluateChipLoops(opIfDup),
      [OpcodesBchSpec.OP_DEPTH]: conditionallyEvaluateChipLoops(opDepth),
      [OpcodesBchSpec.OP_DROP]: conditionallyEvaluateChipLoops(opDrop),
      [OpcodesBchSpec.OP_DUP]: conditionallyEvaluateChipLoops(opDup),
      [OpcodesBchSpec.OP_NIP]: conditionallyEvaluateChipLoops(opNip),
      [OpcodesBchSpec.OP_OVER]: conditionallyEvaluateChipLoops(opOver),
      [OpcodesBchSpec.OP_PICK]: conditionallyEvaluateChipLoops(opPick),
      [OpcodesBchSpec.OP_ROLL]: conditionallyEvaluateChipLoops(opRoll),
      [OpcodesBchSpec.OP_ROT]: conditionallyEvaluateChipLoops(opRot),
      [OpcodesBchSpec.OP_SWAP]: conditionallyEvaluateChipLoops(opSwap),
      [OpcodesBchSpec.OP_TUCK]: conditionallyEvaluateChipLoops(opTuck),
      [OpcodesBchSpec.OP_CAT]: conditionallyEvaluateChipLoops(opCat),
      [OpcodesBchSpec.OP_SPLIT]: conditionallyEvaluateChipLoops(opSplit),
      [OpcodesBchSpec.OP_NUM2BIN]: conditionallyEvaluateChipLoops(opNum2Bin),
      [OpcodesBchSpec.OP_BIN2NUM]: conditionallyEvaluateChipLoops(opBin2Num),
      [OpcodesBchSpec.OP_SIZE]: conditionallyEvaluateChipLoops(opSize),
      [OpcodesBchSpec.OP_INVERT]: disabledOperation,
      [OpcodesBchSpec.OP_AND]: conditionallyEvaluateChipLoops(opAnd),
      [OpcodesBchSpec.OP_OR]: conditionallyEvaluateChipLoops(opOr),
      [OpcodesBchSpec.OP_XOR]: conditionallyEvaluateChipLoops(opXor),
      [OpcodesBchSpec.OP_EQUAL]: conditionallyEvaluateChipLoops(opEqual),
      [OpcodesBchSpec.OP_EQUALVERIFY]:
        conditionallyEvaluateChipLoops(opEqualVerify),
      [OpcodesBchSpec.OP_RESERVED1]:
        conditionallyEvaluateChipLoops(reservedOperation),
      [OpcodesBchSpec.OP_RESERVED2]:
        conditionallyEvaluateChipLoops(reservedOperation),
      [OpcodesBchSpec.OP_1ADD]: conditionallyEvaluateChipLoops(op1Add),
      [OpcodesBchSpec.OP_1SUB]: conditionallyEvaluateChipLoops(op1Sub),
      [OpcodesBchSpec.OP_2MUL]: disabledOperation,
      [OpcodesBchSpec.OP_2DIV]: disabledOperation,
      [OpcodesBchSpec.OP_NEGATE]: conditionallyEvaluateChipLoops(opNegate),
      [OpcodesBchSpec.OP_ABS]: conditionallyEvaluateChipLoops(opAbs),
      [OpcodesBchSpec.OP_NOT]: conditionallyEvaluateChipLoops(opNot),
      [OpcodesBchSpec.OP_0NOTEQUAL]:
        conditionallyEvaluateChipLoops(op0NotEqual),
      [OpcodesBchSpec.OP_ADD]: conditionallyEvaluateChipLoops(opAdd),
      [OpcodesBchSpec.OP_SUB]: conditionallyEvaluateChipLoops(opSub),
      [OpcodesBchSpec.OP_MUL]: conditionallyEvaluateChipLoops(opMul),
      [OpcodesBchSpec.OP_DIV]: conditionallyEvaluateChipLoops(opDiv),
      [OpcodesBchSpec.OP_MOD]: conditionallyEvaluateChipLoops(opMod),
      [OpcodesBchSpec.OP_LSHIFT]: disabledOperation,
      [OpcodesBchSpec.OP_RSHIFT]: disabledOperation,
      [OpcodesBchSpec.OP_BOOLAND]: conditionallyEvaluateChipLoops(opBoolAnd),
      [OpcodesBchSpec.OP_BOOLOR]: conditionallyEvaluateChipLoops(opBoolOr),
      [OpcodesBchSpec.OP_NUMEQUAL]: conditionallyEvaluateChipLoops(opNumEqual),
      [OpcodesBchSpec.OP_NUMEQUALVERIFY]:
        conditionallyEvaluateChipLoops(opNumEqualVerify),
      [OpcodesBchSpec.OP_NUMNOTEQUAL]:
        conditionallyEvaluateChipLoops(opNumNotEqual),
      [OpcodesBchSpec.OP_LESSTHAN]: conditionallyEvaluateChipLoops(opLessThan),
      [OpcodesBchSpec.OP_GREATERTHAN]:
        conditionallyEvaluateChipLoops(opGreaterThan),
      [OpcodesBchSpec.OP_LESSTHANOREQUAL]:
        conditionallyEvaluateChipLoops(opLessThanOrEqual),
      [OpcodesBchSpec.OP_GREATERTHANOREQUAL]:
        conditionallyEvaluateChipLoops(opGreaterThanOrEqual),
      [OpcodesBchSpec.OP_MIN]: conditionallyEvaluateChipLoops(opMin),
      [OpcodesBchSpec.OP_MAX]: conditionallyEvaluateChipLoops(opMax),
      [OpcodesBchSpec.OP_WITHIN]: conditionallyEvaluateChipLoops(opWithin),
      [OpcodesBchSpec.OP_RIPEMD160]: conditionallyEvaluateChipLoops(
        opRipemd160({ ripemd160 }),
      ),
      [OpcodesBchSpec.OP_SHA1]: conditionallyEvaluateChipLoops(
        opSha1({ sha1 }),
      ),
      [OpcodesBchSpec.OP_SHA256]: conditionallyEvaluateChipLoops(
        opSha256({ sha256 }),
      ),
      [OpcodesBchSpec.OP_HASH160]: conditionallyEvaluateChipLoops(
        opHash160({ ripemd160, sha256 }),
      ),
      [OpcodesBchSpec.OP_HASH256]: conditionallyEvaluateChipLoops(
        opHash256({ sha256 }),
      ),
      [OpcodesBchSpec.OP_CODESEPARATOR]:
        conditionallyEvaluateChipLoops(opCodeSeparator),
      [OpcodesBchSpec.OP_CHECKSIG]: conditionallyEvaluateChipLoops(
        opCheckSigChipLimits({ secp256k1, sha256 }),
      ),
      [OpcodesBchSpec.OP_CHECKSIGVERIFY]: conditionallyEvaluateChipLoops(
        opCheckSigVerifyChipLimits({ secp256k1, sha256 }),
      ),
      [OpcodesBchSpec.OP_CHECKMULTISIG]: conditionallyEvaluateChipLoops(
        opCheckMultiSigChipLimits({ secp256k1, sha256 }),
      ),
      [OpcodesBchSpec.OP_CHECKMULTISIGVERIFY]: conditionallyEvaluateChipLoops(
        opCheckMultiSigVerifyChipLimits({ secp256k1, sha256 }),
      ),
      ...(standard
        ? {
            [OpcodesBchSpec.OP_NOP1]:
              conditionallyEvaluateChipLoops(opNopDisallowed),
            [OpcodesBchSpec.OP_CHECKLOCKTIMEVERIFY]:
              conditionallyEvaluateChipLoops(opCheckLockTimeVerify),
            [OpcodesBchSpec.OP_CHECKSEQUENCEVERIFY]:
              conditionallyEvaluateChipLoops(opCheckSequenceVerify),
            [OpcodesBchSpec.OP_NOP4]:
              conditionallyEvaluateChipLoops(opNopDisallowed),
            [OpcodesBchSpec.OP_NOP5]:
              conditionallyEvaluateChipLoops(opNopDisallowed),
            [OpcodesBchSpec.OP_NOP6]:
              conditionallyEvaluateChipLoops(opNopDisallowed),
            [OpcodesBchSpec.OP_NOP7]:
              conditionallyEvaluateChipLoops(opNopDisallowed),
            [OpcodesBchSpec.OP_NOP8]:
              conditionallyEvaluateChipLoops(opNopDisallowed),
            [OpcodesBchSpec.OP_NOP9]:
              conditionallyEvaluateChipLoops(opNopDisallowed),
            [OpcodesBchSpec.OP_NOP10]:
              conditionallyEvaluateChipLoops(opNopDisallowed),
          }
        : {
            [OpcodesBchSpec.OP_NOP1]: conditionallyEvaluateChipLoops(opNop),
            [OpcodesBchSpec.OP_CHECKLOCKTIMEVERIFY]:
              conditionallyEvaluateChipLoops(opCheckLockTimeVerify),
            [OpcodesBchSpec.OP_CHECKSEQUENCEVERIFY]:
              conditionallyEvaluateChipLoops(opCheckSequenceVerify),
            [OpcodesBchSpec.OP_NOP4]: conditionallyEvaluateChipLoops(opNop),
            [OpcodesBchSpec.OP_NOP5]: conditionallyEvaluateChipLoops(opNop),
            [OpcodesBchSpec.OP_NOP6]: conditionallyEvaluateChipLoops(opNop),
            [OpcodesBchSpec.OP_NOP7]: conditionallyEvaluateChipLoops(opNop),
            [OpcodesBchSpec.OP_NOP8]: conditionallyEvaluateChipLoops(opNop),
            [OpcodesBchSpec.OP_NOP9]: conditionallyEvaluateChipLoops(opNop),
            [OpcodesBchSpec.OP_NOP10]: conditionallyEvaluateChipLoops(opNop),
          }),
      [OpcodesBchSpec.OP_CHECKDATASIG]: conditionallyEvaluateChipLoops(
        opCheckDataSig({ secp256k1, sha256 }),
      ),
      [OpcodesBchSpec.OP_CHECKDATASIGVERIFY]: conditionallyEvaluateChipLoops(
        opCheckDataSigVerify({ secp256k1, sha256 }),
      ),
      [OpcodesBchSpec.OP_REVERSEBYTES]:
        conditionallyEvaluateChipLoops(opReverseBytes),
      [OpcodesBchSpec.OP_INPUTINDEX]:
        conditionallyEvaluateChipLoops(opInputIndex),
      [OpcodesBchSpec.OP_ACTIVEBYTECODE]:
        conditionallyEvaluateChipLoops(opActiveBytecode),
      [OpcodesBchSpec.OP_TXVERSION]:
        conditionallyEvaluateChipLoops(opTxVersion),
      [OpcodesBchSpec.OP_TXINPUTCOUNT]:
        conditionallyEvaluateChipLoops(opTxInputCount),
      [OpcodesBchSpec.OP_TXOUTPUTCOUNT]:
        conditionallyEvaluateChipLoops(opTxOutputCount),
      [OpcodesBchSpec.OP_TXLOCKTIME]:
        conditionallyEvaluateChipLoops(opTxLocktime),
      [OpcodesBchSpec.OP_UTXOVALUE]:
        conditionallyEvaluateChipLoops(opUtxoValue),
      [OpcodesBchSpec.OP_UTXOBYTECODE]:
        conditionallyEvaluateChipLoops(opUtxoBytecode),
      [OpcodesBchSpec.OP_OUTPOINTTXHASH]:
        conditionallyEvaluateChipLoops(opOutpointTxHash),
      [OpcodesBchSpec.OP_OUTPOINTINDEX]:
        conditionallyEvaluateChipLoops(opOutpointIndex),
      [OpcodesBchSpec.OP_INPUTBYTECODE]:
        conditionallyEvaluateChipLoops(opInputBytecode),
      [OpcodesBchSpec.OP_INPUTSEQUENCENUMBER]: conditionallyEvaluateChipLoops(
        opInputSequenceNumber,
      ),
      [OpcodesBchSpec.OP_OUTPUTVALUE]:
        conditionallyEvaluateChipLoops(opOutputValue),
      [OpcodesBchSpec.OP_OUTPUTBYTECODE]:
        conditionallyEvaluateChipLoops(opOutputBytecode),
      [OpcodesBchSpec.OP_UTXOTOKENCATEGORY]:
        conditionallyEvaluateChipLoops(opUtxoTokenCategory),
      [OpcodesBchSpec.OP_UTXOTOKENCOMMITMENT]: conditionallyEvaluateChipLoops(
        opUtxoTokenCommitment,
      ),
      [OpcodesBchSpec.OP_UTXOTOKENAMOUNT]:
        conditionallyEvaluateChipLoops(opUtxoTokenAmount),
      [OpcodesBchSpec.OP_OUTPUTTOKENCATEGORY]: conditionallyEvaluateChipLoops(
        opOutputTokenCategory,
      ),
      [OpcodesBchSpec.OP_OUTPUTTOKENCOMMITMENT]: conditionallyEvaluateChipLoops(
        opOutputTokenCommitment,
      ),
      [OpcodesBchSpec.OP_OUTPUTTOKENAMOUNT]:
        conditionallyEvaluateChipLoops(opOutputTokenAmount),
    },
    success: (state: AuthenticationProgramStateBchSpec) => {
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

      const transactionSize = encodeTransactionBch(transaction).length;
      if (transactionSize < ConsensusBch.minimumTransactionSize) {
        return `Transaction does not meet minimum size: the transaction is ${transactionSize} bytes, but the minimum transaction size is ${ConsensusBch.minimumTransactionSize} bytes.`;
      }
      if (transactionSize > ConsensusBch.maximumTransactionSize) {
        return `Transaction exceeds maximum size: the transaction is ${transactionSize} bytes, but the maximum transaction size is ${ConsensusBch.maximumTransactionSize} bytes.`;
      }

      if (standard) {
        if (
          transaction.version < 1 ||
          transaction.version > ConsensusBch.maximumStandardVersion
        ) {
          return `Standard transactions must have a version no less than 1 and no greater than ${ConsensusBch.maximumStandardVersion}.`;
        }
        if (transactionSize > ConsensusBch.maximumStandardTransactionSize) {
          return `Transaction exceeds maximum standard size: this transaction is ${transactionSize} bytes, but the maximum standard transaction size is ${ConsensusBch.maximumStandardTransactionSize} bytes.`;
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
        if (totalArbitraryDataBytes > ConsensusBch.maximumDataCarrierBytes) {
          return `Standard transactions may carry no more than ${ConsensusBch.maximumDataCarrierBytes} bytes in arbitrary data outputs; this transaction includes ${totalArbitraryDataBytes} bytes of arbitrary data.`;
        }

        // eslint-disable-next-line functional/no-loop-statements
        for (const [index, input] of transaction.inputs.entries()) {
          if (
            input.unlockingBytecode.length >
            ConsensusBch.maximumStandardUnlockingBytecodeLength
          ) {
            return `Input index ${index} is non-standard: the unlocking bytecode (${input.unlockingBytecode.length} bytes) exceeds the maximum standard unlocking bytecode length (${ConsensusBch.maximumStandardUnlockingBytecodeLength} bytes).`;
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
