import {
  isPayToScriptHash20,
  isPayToScriptHash32,
} from '../../../../address/address.js';
import {
  ripemd160 as internalRipemd160,
  secp256k1 as internalSecp256k1,
  sha1 as internalSha1,
  sha256 as internalSha256,
} from '../../../../crypto/crypto.js';
import { binToHex } from '../../../../format/format.js';
import type {
  AuthenticationProgramBCH,
  AuthenticationProgramStateBCH,
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
  cloneAuthenticationProgramStateBCH,
  cloneStack,
  conditionallyEvaluate,
  createAuthenticationProgramStateCommon,
  decodeAuthenticationInstructions,
  disabledOperation,
  getDustThreshold,
  incrementOperationCount,
  isArbitraryDataOutput,
  isDustOutput,
  isPushOnly,
  isStandardOutputBytecode2023,
  isWitnessProgram,
  mapOverOperations,
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
  opElse,
  opEndIf,
  opEqual,
  opEqualVerify,
  opFromAltStack,
  opGreaterThan,
  opGreaterThanOrEqual,
  opHash160,
  opHash256,
  opIf,
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
  opNotIf,
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
  pushOperation,
  reservedOperation,
  stackItemIsTruthy,
  undefinedOperation,
} from '../../common/common.js';

import { ConsensusBCH2023 } from './bch-2023-consensus.js';
import {
  opCheckMultiSigBCH2023,
  opCheckMultiSigVerifyBCH2023,
  opCheckSigBCH2023,
  opCheckSigVerifyBCH2023,
} from './bch-2023-crypto.js';
import { OpcodesBCH2023 } from './bch-2023-opcodes.js';
import {
  opOutputTokenAmount,
  opOutputTokenCategory,
  opOutputTokenCommitment,
  opUtxoTokenAmount,
  opUtxoTokenCategory,
  opUtxoTokenCommitment,
  verifyTransactionTokens,
} from './bch-2023-tokens.js';

/**
 * create an instance of the BCH 2023 virtual machine instruction set.
 *
 * @param standard - If `true`, the additional `isStandard` validations will be
 * enabled. Transactions that fail these rules are often called "non-standard"
 * and can technically be included by miners in valid blocks, but most network
 * nodes will refuse to relay them. (Default: `true`)
 */
export const createInstructionSetBCH2023 = (
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
  AuthenticationProgramStateBCH
> => {
  const conditionallyPush = pushOperation<AuthenticationProgramStateBCH>();
  return {
    clone: cloneAuthenticationProgramStateBCH,
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
      const initialState = createAuthenticationProgramStateCommon({
        instructions: unlockingInstructions,
        program,
        stack: [],
      });

      if (unlockingBytecode.length > ConsensusBCH2023.maximumBytecodeLength) {
        return applyError(
          initialState,
          `The provided unlocking bytecode (${unlockingBytecode.length} bytes) exceeds the maximum bytecode length (${ConsensusBCH2023.maximumBytecodeLength} bytes).`,
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
      if (lockingBytecode.length > ConsensusBCH2023.maximumBytecodeLength) {
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
        createAuthenticationProgramStateCommon({
          instructions: lockingInstructions,
          program,
          stack: unlockingResult.stack,
        }),
      );

      const p2sh20 = isPayToScriptHash20(lockingBytecode);
      const p2sh32 = isPayToScriptHash32(lockingBytecode);
      if (!p2sh20 && !p2sh32) {
        return lockingResult;
      }
      const p2shStack = cloneStack(unlockingResult.stack);
      // eslint-disable-next-line functional/immutable-data
      const p2shScript = p2shStack.pop() ?? Uint8Array.of();

      if (p2sh20 && p2shStack.length === 0 && isWitnessProgram(p2shScript)) {
        return lockingResult;
      }

      const p2shInstructions = decodeAuthenticationInstructions(p2shScript);
      return authenticationInstructionsAreMalformed(p2shInstructions)
        ? {
            ...lockingResult,
            error: AuthenticationErrorCommon.malformedP2shBytecode,
          }
        : stateEvaluate(
            createAuthenticationProgramStateCommon({
              instructions: p2shInstructions,
              program,
              stack: p2shStack,
            }),
          );
    },
    every: (state) =>
      // TODO: implement sigchecks https://gitlab.com/bitcoin-cash-node/bchn-sw/bitcoincash-upgrade-specifications/-/blob/master/spec/2020-05-15-sigchecks.md
      state.stack.length + state.alternateStack.length >
      ConsensusBCH2023.maximumStackDepth
        ? applyError(state, AuthenticationErrorCommon.exceededMaximumStackDepth)
        : state.operationCount > ConsensusBCH2023.maximumOperationCount
          ? applyError(
              state,
              AuthenticationErrorCommon.exceededMaximumOperationCount,
            )
          : state,
    operations: {
      [OpcodesBCH2023.OP_0]: conditionallyPush,
      [OpcodesBCH2023.OP_PUSHBYTES_1]: conditionallyPush,
      [OpcodesBCH2023.OP_PUSHBYTES_2]: conditionallyPush,
      [OpcodesBCH2023.OP_PUSHBYTES_3]: conditionallyPush,
      [OpcodesBCH2023.OP_PUSHBYTES_4]: conditionallyPush,
      [OpcodesBCH2023.OP_PUSHBYTES_5]: conditionallyPush,
      [OpcodesBCH2023.OP_PUSHBYTES_6]: conditionallyPush,
      [OpcodesBCH2023.OP_PUSHBYTES_7]: conditionallyPush,
      [OpcodesBCH2023.OP_PUSHBYTES_8]: conditionallyPush,
      [OpcodesBCH2023.OP_PUSHBYTES_9]: conditionallyPush,
      [OpcodesBCH2023.OP_PUSHBYTES_10]: conditionallyPush,
      [OpcodesBCH2023.OP_PUSHBYTES_11]: conditionallyPush,
      [OpcodesBCH2023.OP_PUSHBYTES_12]: conditionallyPush,
      [OpcodesBCH2023.OP_PUSHBYTES_13]: conditionallyPush,
      [OpcodesBCH2023.OP_PUSHBYTES_14]: conditionallyPush,
      [OpcodesBCH2023.OP_PUSHBYTES_15]: conditionallyPush,
      [OpcodesBCH2023.OP_PUSHBYTES_16]: conditionallyPush,
      [OpcodesBCH2023.OP_PUSHBYTES_17]: conditionallyPush,
      [OpcodesBCH2023.OP_PUSHBYTES_18]: conditionallyPush,
      [OpcodesBCH2023.OP_PUSHBYTES_19]: conditionallyPush,
      [OpcodesBCH2023.OP_PUSHBYTES_20]: conditionallyPush,
      [OpcodesBCH2023.OP_PUSHBYTES_21]: conditionallyPush,
      [OpcodesBCH2023.OP_PUSHBYTES_22]: conditionallyPush,
      [OpcodesBCH2023.OP_PUSHBYTES_23]: conditionallyPush,
      [OpcodesBCH2023.OP_PUSHBYTES_24]: conditionallyPush,
      [OpcodesBCH2023.OP_PUSHBYTES_25]: conditionallyPush,
      [OpcodesBCH2023.OP_PUSHBYTES_26]: conditionallyPush,
      [OpcodesBCH2023.OP_PUSHBYTES_27]: conditionallyPush,
      [OpcodesBCH2023.OP_PUSHBYTES_28]: conditionallyPush,
      [OpcodesBCH2023.OP_PUSHBYTES_29]: conditionallyPush,
      [OpcodesBCH2023.OP_PUSHBYTES_30]: conditionallyPush,
      [OpcodesBCH2023.OP_PUSHBYTES_31]: conditionallyPush,
      [OpcodesBCH2023.OP_PUSHBYTES_32]: conditionallyPush,
      [OpcodesBCH2023.OP_PUSHBYTES_33]: conditionallyPush,
      [OpcodesBCH2023.OP_PUSHBYTES_34]: conditionallyPush,
      [OpcodesBCH2023.OP_PUSHBYTES_35]: conditionallyPush,
      [OpcodesBCH2023.OP_PUSHBYTES_36]: conditionallyPush,
      [OpcodesBCH2023.OP_PUSHBYTES_37]: conditionallyPush,
      [OpcodesBCH2023.OP_PUSHBYTES_38]: conditionallyPush,
      [OpcodesBCH2023.OP_PUSHBYTES_39]: conditionallyPush,
      [OpcodesBCH2023.OP_PUSHBYTES_40]: conditionallyPush,
      [OpcodesBCH2023.OP_PUSHBYTES_41]: conditionallyPush,
      [OpcodesBCH2023.OP_PUSHBYTES_42]: conditionallyPush,
      [OpcodesBCH2023.OP_PUSHBYTES_43]: conditionallyPush,
      [OpcodesBCH2023.OP_PUSHBYTES_44]: conditionallyPush,
      [OpcodesBCH2023.OP_PUSHBYTES_45]: conditionallyPush,
      [OpcodesBCH2023.OP_PUSHBYTES_46]: conditionallyPush,
      [OpcodesBCH2023.OP_PUSHBYTES_47]: conditionallyPush,
      [OpcodesBCH2023.OP_PUSHBYTES_48]: conditionallyPush,
      [OpcodesBCH2023.OP_PUSHBYTES_49]: conditionallyPush,
      [OpcodesBCH2023.OP_PUSHBYTES_50]: conditionallyPush,
      [OpcodesBCH2023.OP_PUSHBYTES_51]: conditionallyPush,
      [OpcodesBCH2023.OP_PUSHBYTES_52]: conditionallyPush,
      [OpcodesBCH2023.OP_PUSHBYTES_53]: conditionallyPush,
      [OpcodesBCH2023.OP_PUSHBYTES_54]: conditionallyPush,
      [OpcodesBCH2023.OP_PUSHBYTES_55]: conditionallyPush,
      [OpcodesBCH2023.OP_PUSHBYTES_56]: conditionallyPush,
      [OpcodesBCH2023.OP_PUSHBYTES_57]: conditionallyPush,
      [OpcodesBCH2023.OP_PUSHBYTES_58]: conditionallyPush,
      [OpcodesBCH2023.OP_PUSHBYTES_59]: conditionallyPush,
      [OpcodesBCH2023.OP_PUSHBYTES_60]: conditionallyPush,
      [OpcodesBCH2023.OP_PUSHBYTES_61]: conditionallyPush,
      [OpcodesBCH2023.OP_PUSHBYTES_62]: conditionallyPush,
      [OpcodesBCH2023.OP_PUSHBYTES_63]: conditionallyPush,
      [OpcodesBCH2023.OP_PUSHBYTES_64]: conditionallyPush,
      [OpcodesBCH2023.OP_PUSHBYTES_65]: conditionallyPush,
      [OpcodesBCH2023.OP_PUSHBYTES_66]: conditionallyPush,
      [OpcodesBCH2023.OP_PUSHBYTES_67]: conditionallyPush,
      [OpcodesBCH2023.OP_PUSHBYTES_68]: conditionallyPush,
      [OpcodesBCH2023.OP_PUSHBYTES_69]: conditionallyPush,
      [OpcodesBCH2023.OP_PUSHBYTES_70]: conditionallyPush,
      [OpcodesBCH2023.OP_PUSHBYTES_71]: conditionallyPush,
      [OpcodesBCH2023.OP_PUSHBYTES_72]: conditionallyPush,
      [OpcodesBCH2023.OP_PUSHBYTES_73]: conditionallyPush,
      [OpcodesBCH2023.OP_PUSHBYTES_74]: conditionallyPush,
      [OpcodesBCH2023.OP_PUSHBYTES_75]: conditionallyPush,
      [OpcodesBCH2023.OP_PUSHDATA_1]: conditionallyPush,
      [OpcodesBCH2023.OP_PUSHDATA_2]: conditionallyPush,
      [OpcodesBCH2023.OP_PUSHDATA_4]: conditionallyPush,
      [OpcodesBCH2023.OP_1NEGATE]: conditionallyEvaluate(
        pushNumberOperation(-1),
      ),
      [OpcodesBCH2023.OP_RESERVED]: conditionallyEvaluate(reservedOperation),
      [OpcodesBCH2023.OP_1]: conditionallyEvaluate(pushNumberOperation(1)),
      /* eslint-disable @typescript-eslint/no-magic-numbers */
      [OpcodesBCH2023.OP_2]: conditionallyEvaluate(pushNumberOperation(2)),
      [OpcodesBCH2023.OP_3]: conditionallyEvaluate(pushNumberOperation(3)),
      [OpcodesBCH2023.OP_4]: conditionallyEvaluate(pushNumberOperation(4)),
      [OpcodesBCH2023.OP_5]: conditionallyEvaluate(pushNumberOperation(5)),
      [OpcodesBCH2023.OP_6]: conditionallyEvaluate(pushNumberOperation(6)),
      [OpcodesBCH2023.OP_7]: conditionallyEvaluate(pushNumberOperation(7)),
      [OpcodesBCH2023.OP_8]: conditionallyEvaluate(pushNumberOperation(8)),
      [OpcodesBCH2023.OP_9]: conditionallyEvaluate(pushNumberOperation(9)),
      [OpcodesBCH2023.OP_10]: conditionallyEvaluate(pushNumberOperation(10)),
      [OpcodesBCH2023.OP_11]: conditionallyEvaluate(pushNumberOperation(11)),
      [OpcodesBCH2023.OP_12]: conditionallyEvaluate(pushNumberOperation(12)),
      [OpcodesBCH2023.OP_13]: conditionallyEvaluate(pushNumberOperation(13)),
      [OpcodesBCH2023.OP_14]: conditionallyEvaluate(pushNumberOperation(14)),
      [OpcodesBCH2023.OP_15]: conditionallyEvaluate(pushNumberOperation(15)),
      [OpcodesBCH2023.OP_16]: conditionallyEvaluate(pushNumberOperation(16)),
      /* eslint-enable @typescript-eslint/no-magic-numbers */
      ...mapOverOperations<AuthenticationProgramStateBCH>(
        [incrementOperationCount],
        {
          [OpcodesBCH2023.OP_NOP]: conditionallyEvaluate(opNop),
          [OpcodesBCH2023.OP_VER]: conditionallyEvaluate(reservedOperation),
          [OpcodesBCH2023.OP_IF]: opIf,
          [OpcodesBCH2023.OP_NOTIF]: opNotIf,
          [OpcodesBCH2023.OP_VERIF]: reservedOperation,
          [OpcodesBCH2023.OP_VERNOTIF]: reservedOperation,
          [OpcodesBCH2023.OP_ELSE]: opElse,
          [OpcodesBCH2023.OP_ENDIF]: opEndIf,
          [OpcodesBCH2023.OP_VERIFY]: conditionallyEvaluate(opVerify),
          [OpcodesBCH2023.OP_RETURN]: conditionallyEvaluate(opReturn),
          [OpcodesBCH2023.OP_TOALTSTACK]: conditionallyEvaluate(opToAltStack),
          [OpcodesBCH2023.OP_FROMALTSTACK]:
            conditionallyEvaluate(opFromAltStack),
          [OpcodesBCH2023.OP_2DROP]: conditionallyEvaluate(op2Drop),
          [OpcodesBCH2023.OP_2DUP]: conditionallyEvaluate(op2Dup),
          [OpcodesBCH2023.OP_3DUP]: conditionallyEvaluate(op3Dup),
          [OpcodesBCH2023.OP_2OVER]: conditionallyEvaluate(op2Over),
          [OpcodesBCH2023.OP_2ROT]: conditionallyEvaluate(op2Rot),
          [OpcodesBCH2023.OP_2SWAP]: conditionallyEvaluate(op2Swap),
          [OpcodesBCH2023.OP_IFDUP]: conditionallyEvaluate(opIfDup),
          [OpcodesBCH2023.OP_DEPTH]: conditionallyEvaluate(opDepth),
          [OpcodesBCH2023.OP_DROP]: conditionallyEvaluate(opDrop),
          [OpcodesBCH2023.OP_DUP]: conditionallyEvaluate(opDup),
          [OpcodesBCH2023.OP_NIP]: conditionallyEvaluate(opNip),
          [OpcodesBCH2023.OP_OVER]: conditionallyEvaluate(opOver),
          [OpcodesBCH2023.OP_PICK]: conditionallyEvaluate(opPick),
          [OpcodesBCH2023.OP_ROLL]: conditionallyEvaluate(opRoll),
          [OpcodesBCH2023.OP_ROT]: conditionallyEvaluate(opRot),
          [OpcodesBCH2023.OP_SWAP]: conditionallyEvaluate(opSwap),
          [OpcodesBCH2023.OP_TUCK]: conditionallyEvaluate(opTuck),
          [OpcodesBCH2023.OP_CAT]: conditionallyEvaluate(opCat),
          [OpcodesBCH2023.OP_SPLIT]: conditionallyEvaluate(opSplit),
          [OpcodesBCH2023.OP_NUM2BIN]: conditionallyEvaluate(opNum2Bin),
          [OpcodesBCH2023.OP_BIN2NUM]: conditionallyEvaluate(opBin2Num),
          [OpcodesBCH2023.OP_SIZE]: conditionallyEvaluate(opSize),
          [OpcodesBCH2023.OP_INVERT]: disabledOperation,
          [OpcodesBCH2023.OP_AND]: conditionallyEvaluate(opAnd),
          [OpcodesBCH2023.OP_OR]: conditionallyEvaluate(opOr),
          [OpcodesBCH2023.OP_XOR]: conditionallyEvaluate(opXor),
          [OpcodesBCH2023.OP_EQUAL]: conditionallyEvaluate(opEqual),
          [OpcodesBCH2023.OP_EQUALVERIFY]: conditionallyEvaluate(opEqualVerify),
          [OpcodesBCH2023.OP_RESERVED1]:
            conditionallyEvaluate(reservedOperation),
          [OpcodesBCH2023.OP_RESERVED2]:
            conditionallyEvaluate(reservedOperation),
          [OpcodesBCH2023.OP_1ADD]: conditionallyEvaluate(op1Add),
          [OpcodesBCH2023.OP_1SUB]: conditionallyEvaluate(op1Sub),
          [OpcodesBCH2023.OP_2MUL]: disabledOperation,
          [OpcodesBCH2023.OP_2DIV]: disabledOperation,
          [OpcodesBCH2023.OP_NEGATE]: conditionallyEvaluate(opNegate),
          [OpcodesBCH2023.OP_ABS]: conditionallyEvaluate(opAbs),
          [OpcodesBCH2023.OP_NOT]: conditionallyEvaluate(opNot),
          [OpcodesBCH2023.OP_0NOTEQUAL]: conditionallyEvaluate(op0NotEqual),
          [OpcodesBCH2023.OP_ADD]: conditionallyEvaluate(opAdd),
          [OpcodesBCH2023.OP_SUB]: conditionallyEvaluate(opSub),
          [OpcodesBCH2023.OP_MUL]: conditionallyEvaluate(opMul),
          [OpcodesBCH2023.OP_DIV]: conditionallyEvaluate(opDiv),
          [OpcodesBCH2023.OP_MOD]: conditionallyEvaluate(opMod),
          [OpcodesBCH2023.OP_LSHIFT]: disabledOperation,
          [OpcodesBCH2023.OP_RSHIFT]: disabledOperation,
          [OpcodesBCH2023.OP_BOOLAND]: conditionallyEvaluate(opBoolAnd),
          [OpcodesBCH2023.OP_BOOLOR]: conditionallyEvaluate(opBoolOr),
          [OpcodesBCH2023.OP_NUMEQUAL]: conditionallyEvaluate(opNumEqual),
          [OpcodesBCH2023.OP_NUMEQUALVERIFY]:
            conditionallyEvaluate(opNumEqualVerify),
          [OpcodesBCH2023.OP_NUMNOTEQUAL]: conditionallyEvaluate(opNumNotEqual),
          [OpcodesBCH2023.OP_LESSTHAN]: conditionallyEvaluate(opLessThan),
          [OpcodesBCH2023.OP_GREATERTHAN]: conditionallyEvaluate(opGreaterThan),
          [OpcodesBCH2023.OP_LESSTHANOREQUAL]:
            conditionallyEvaluate(opLessThanOrEqual),
          [OpcodesBCH2023.OP_GREATERTHANOREQUAL]:
            conditionallyEvaluate(opGreaterThanOrEqual),
          [OpcodesBCH2023.OP_MIN]: conditionallyEvaluate(opMin),
          [OpcodesBCH2023.OP_MAX]: conditionallyEvaluate(opMax),
          [OpcodesBCH2023.OP_WITHIN]: conditionallyEvaluate(opWithin),
          [OpcodesBCH2023.OP_RIPEMD160]: conditionallyEvaluate(
            opRipemd160({ ripemd160 }),
          ),
          [OpcodesBCH2023.OP_SHA1]: conditionallyEvaluate(opSha1({ sha1 })),
          [OpcodesBCH2023.OP_SHA256]: conditionallyEvaluate(
            opSha256({ sha256 }),
          ),
          [OpcodesBCH2023.OP_HASH160]: conditionallyEvaluate(
            opHash160({ ripemd160, sha256 }),
          ),
          [OpcodesBCH2023.OP_HASH256]: conditionallyEvaluate(
            opHash256({ sha256 }),
          ),
          [OpcodesBCH2023.OP_CODESEPARATOR]:
            conditionallyEvaluate(opCodeSeparator),
          [OpcodesBCH2023.OP_CHECKSIG]: conditionallyEvaluate(
            opCheckSigBCH2023({ secp256k1, sha256 }),
          ),
          [OpcodesBCH2023.OP_CHECKSIGVERIFY]: conditionallyEvaluate(
            opCheckSigVerifyBCH2023({ secp256k1, sha256 }),
          ),
          [OpcodesBCH2023.OP_CHECKMULTISIG]: conditionallyEvaluate(
            opCheckMultiSigBCH2023({ secp256k1, sha256 }),
          ),
          [OpcodesBCH2023.OP_CHECKMULTISIGVERIFY]: conditionallyEvaluate(
            opCheckMultiSigVerifyBCH2023({ secp256k1, sha256 }),
          ),
          ...(standard
            ? {
                [OpcodesBCH2023.OP_NOP1]:
                  conditionallyEvaluate(opNopDisallowed),
                [OpcodesBCH2023.OP_CHECKLOCKTIMEVERIFY]: conditionallyEvaluate(
                  opCheckLockTimeVerify,
                ),
                [OpcodesBCH2023.OP_CHECKSEQUENCEVERIFY]: conditionallyEvaluate(
                  opCheckSequenceVerify,
                ),
                [OpcodesBCH2023.OP_NOP4]:
                  conditionallyEvaluate(opNopDisallowed),
                [OpcodesBCH2023.OP_NOP5]:
                  conditionallyEvaluate(opNopDisallowed),
                [OpcodesBCH2023.OP_NOP6]:
                  conditionallyEvaluate(opNopDisallowed),
                [OpcodesBCH2023.OP_NOP7]:
                  conditionallyEvaluate(opNopDisallowed),
                [OpcodesBCH2023.OP_NOP8]:
                  conditionallyEvaluate(opNopDisallowed),
                [OpcodesBCH2023.OP_NOP9]:
                  conditionallyEvaluate(opNopDisallowed),
                [OpcodesBCH2023.OP_NOP10]:
                  conditionallyEvaluate(opNopDisallowed),
              }
            : {
                [OpcodesBCH2023.OP_NOP1]: conditionallyEvaluate(opNop),
                [OpcodesBCH2023.OP_CHECKLOCKTIMEVERIFY]: conditionallyEvaluate(
                  opCheckLockTimeVerify,
                ),
                [OpcodesBCH2023.OP_CHECKSEQUENCEVERIFY]: conditionallyEvaluate(
                  opCheckSequenceVerify,
                ),
                [OpcodesBCH2023.OP_NOP4]: conditionallyEvaluate(opNop),
                [OpcodesBCH2023.OP_NOP5]: conditionallyEvaluate(opNop),
                [OpcodesBCH2023.OP_NOP6]: conditionallyEvaluate(opNop),
                [OpcodesBCH2023.OP_NOP7]: conditionallyEvaluate(opNop),
                [OpcodesBCH2023.OP_NOP8]: conditionallyEvaluate(opNop),
                [OpcodesBCH2023.OP_NOP9]: conditionallyEvaluate(opNop),
                [OpcodesBCH2023.OP_NOP10]: conditionallyEvaluate(opNop),
              }),
          [OpcodesBCH2023.OP_CHECKDATASIG]: conditionallyEvaluate(
            opCheckDataSig({ secp256k1, sha256 }),
          ),
          [OpcodesBCH2023.OP_CHECKDATASIGVERIFY]: conditionallyEvaluate(
            opCheckDataSigVerify({ secp256k1, sha256 }),
          ),
          [OpcodesBCH2023.OP_REVERSEBYTES]:
            conditionallyEvaluate(opReverseBytes),
          [OpcodesBCH2023.OP_INPUTINDEX]: conditionallyEvaluate(opInputIndex),
          [OpcodesBCH2023.OP_ACTIVEBYTECODE]:
            conditionallyEvaluate(opActiveBytecode),
          [OpcodesBCH2023.OP_TXVERSION]: conditionallyEvaluate(opTxVersion),
          [OpcodesBCH2023.OP_TXINPUTCOUNT]:
            conditionallyEvaluate(opTxInputCount),
          [OpcodesBCH2023.OP_TXOUTPUTCOUNT]:
            conditionallyEvaluate(opTxOutputCount),
          [OpcodesBCH2023.OP_TXLOCKTIME]: conditionallyEvaluate(opTxLocktime),
          [OpcodesBCH2023.OP_UTXOVALUE]: conditionallyEvaluate(opUtxoValue),
          [OpcodesBCH2023.OP_UTXOBYTECODE]:
            conditionallyEvaluate(opUtxoBytecode),
          [OpcodesBCH2023.OP_OUTPOINTTXHASH]:
            conditionallyEvaluate(opOutpointTxHash),
          [OpcodesBCH2023.OP_OUTPOINTINDEX]:
            conditionallyEvaluate(opOutpointIndex),
          [OpcodesBCH2023.OP_INPUTBYTECODE]:
            conditionallyEvaluate(opInputBytecode),
          [OpcodesBCH2023.OP_INPUTSEQUENCENUMBER]: conditionallyEvaluate(
            opInputSequenceNumber,
          ),
          [OpcodesBCH2023.OP_OUTPUTVALUE]: conditionallyEvaluate(opOutputValue),
          [OpcodesBCH2023.OP_OUTPUTBYTECODE]:
            conditionallyEvaluate(opOutputBytecode),
          [OpcodesBCH2023.OP_UTXOTOKENCATEGORY]:
            conditionallyEvaluate(opUtxoTokenCategory),
          [OpcodesBCH2023.OP_UTXOTOKENCOMMITMENT]: conditionallyEvaluate(
            opUtxoTokenCommitment,
          ),
          [OpcodesBCH2023.OP_UTXOTOKENAMOUNT]:
            conditionallyEvaluate(opUtxoTokenAmount),
          [OpcodesBCH2023.OP_OUTPUTTOKENCATEGORY]: conditionallyEvaluate(
            opOutputTokenCategory,
          ),
          [OpcodesBCH2023.OP_OUTPUTTOKENCOMMITMENT]: conditionallyEvaluate(
            opOutputTokenCommitment,
          ),
          [OpcodesBCH2023.OP_OUTPUTTOKENAMOUNT]:
            conditionallyEvaluate(opOutputTokenAmount),
        },
      ),
    },
    success: (state: AuthenticationProgramStateBCH) => {
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
    undefined: undefinedOperation,
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
      if (transactionSize < ConsensusBCH2023.minimumTransactionSize) {
        return `Invalid transaction size: the transaction is ${transactionSize} bytes, but transactions must be no smaller than ${ConsensusBCH2023.minimumTransactionSize} bytes to prevent an exploit of the transaction Merkle tree design.`;
      }
      if (transactionSize > ConsensusBCH2023.maximumTransactionSize) {
        return `Transaction exceeds maximum size: the transaction is ${transactionSize} bytes, but the maximum transaction size is ${ConsensusBCH2023.maximumTransactionSize} bytes.`;
      }

      const inputValue = sourceOutputs.reduce(
        (sum, utxo) => sum + utxo.valueSatoshis,
        0n,
      );
      const outputValue = transaction.outputs.reduce(
        (sum, output) => sum + output.valueSatoshis,
        0n,
      );
      if (outputValue > inputValue) {
        return `Unable to verify transaction: the sum of transaction outputs exceeds the sum of transaction inputs. Input value: ${inputValue}, output value: ${outputValue}`;
      }

      const outpointList = transaction.inputs.map(
        (input) =>
          `outpointTransactionHash: ${binToHex(
            input.outpointTransactionHash,
          )}, outpointIndex: ${input.outpointIndex}`,
      );
      const firstDuplicate = outpointList.find(
        (outpoint, index) => outpointList.lastIndexOf(outpoint) !== index,
      );
      /**
       * This check isn't strictly necessary to perform in the VM (assuming the
       * provider of `sourceOutputs` is checking for double spends), but it's
       * included here for debugging purposes.
       */
      if (firstDuplicate !== undefined) {
        return `Unable to verify transaction: the transaction attempts to spend the same outpoint in multiple inputs. ${firstDuplicate}`;
      }

      if (standard) {
        if (
          transaction.version < 1 ||
          transaction.version > ConsensusBCH2023.maximumStandardVersion
        ) {
          return `Standard transactions must have a version no less than 1 and no greater than ${ConsensusBCH2023.maximumStandardVersion}.`;
        }
        if (transactionSize > ConsensusBCH2023.maximumStandardTransactionSize) {
          return `Transaction exceeds maximum standard size: this transaction is ${transactionSize} bytes, but the maximum standard transaction size is ${ConsensusBCH2023.maximumStandardTransactionSize} bytes.`;
        }

        // eslint-disable-next-line functional/no-loop-statements
        for (const [index, output] of sourceOutputs.entries()) {
          if (!isStandardOutputBytecode2023(output.lockingBytecode)) {
            return `Standard transactions may only spend standard output types, but source output ${index} is non-standard.`;
          }
        }

        // eslint-disable-next-line functional/no-let
        let totalArbitraryDataBytes = 0;
        // eslint-disable-next-line functional/no-loop-statements
        for (const [index, output] of transaction.outputs.entries()) {
          if (!isStandardOutputBytecode2023(output.lockingBytecode)) {
            return `Standard transactions may only create standard output types, but transaction output ${index} is non-standard.`;
          }
          // eslint-disable-next-line functional/no-conditional-statements
          if (isArbitraryDataOutput(output.lockingBytecode)) {
            // eslint-disable-next-line functional/no-expression-statements
            totalArbitraryDataBytes += output.lockingBytecode.length + 1;
          }
          if (isDustOutput(output)) {
            return `Standard transactions may not have dust outputs, but transaction output ${index} is a dust output. Output ${index} must have a value of at least ${getDustThreshold(
              output,
            )} satoshis. Current value: ${output.valueSatoshis}`;
          }
        }
        if (
          totalArbitraryDataBytes > ConsensusBCH2023.maximumDataCarrierBytes
        ) {
          return `Standard transactions may carry no more than ${ConsensusBCH2023.maximumDataCarrierBytes} bytes in arbitrary data outputs; this transaction includes ${totalArbitraryDataBytes} bytes of arbitrary data.`;
        }

        // eslint-disable-next-line functional/no-loop-statements
        for (const [index, input] of transaction.inputs.entries()) {
          if (
            input.unlockingBytecode.length >
            ConsensusBCH2023.maximumStandardUnlockingBytecodeLength
          ) {
            return `Input index ${index} is non-standard: the unlocking bytecode (${input.unlockingBytecode.length} bytes) exceeds the maximum standard unlocking bytecode length (${ConsensusBCH2023.maximumStandardUnlockingBytecodeLength} bytes).`;
          }
          if (!isPushOnly(input.unlockingBytecode)) {
            return `Input index ${index} is non-standard: unlocking bytecode may contain only push operations.`;
          }
        }
      }

      const tokenValidationResult = verifyTransactionTokens(
        transaction,
        sourceOutputs,
      );
      if (tokenValidationResult !== true) {
        return tokenValidationResult;
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

export const createInstructionSetBCH = createInstructionSetBCH2023;
