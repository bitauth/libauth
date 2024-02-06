import { isPayToScriptHash20 } from '../../../../address/address.js';
import {
  ripemd160 as internalRipemd160,
  secp256k1 as internalSecp256k1,
  sha1 as internalSha1,
  sha256 as internalSha256,
} from '../../../../crypto/crypto.js';
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
  ConsensusBCH,
  createAuthenticationProgramStateCommon,
  decodeAuthenticationInstructions,
  disabledOperation,
  incrementOperationCount,
  isArbitraryDataOutput,
  isPushOnly,
  isStandardOutputBytecode,
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
  opCheckMultiSig,
  opCheckMultiSigVerify,
  opCheckSequenceVerify,
  opCheckSig,
  opCheckSigVerify,
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
import { OpcodesBCH } from '../2023/bch-2023.js';

/**
 * create an instance of the BCH 2022 virtual machine instruction set.
 *
 * @param standard - If `true`, the additional `isStandard` validations will be
 * enabled. Transactions that fail these rules are often called "non-standard"
 * and can technically be included by miners in valid blocks, but most network
 * nodes will refuse to relay them. (Default: `true`)
 */
export const createInstructionSetBCH2022 = (
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
        createAuthenticationProgramStateCommon({
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
      ConsensusBCH.maximumStackDepth
        ? applyError(state, AuthenticationErrorCommon.exceededMaximumStackDepth)
        : state.operationCount > ConsensusBCH.maximumOperationCount
          ? applyError(
              state,
              AuthenticationErrorCommon.exceededMaximumOperationCount,
            )
          : state,
    operations: {
      [OpcodesBCH.OP_0]: conditionallyPush,
      [OpcodesBCH.OP_PUSHBYTES_1]: conditionallyPush,
      [OpcodesBCH.OP_PUSHBYTES_2]: conditionallyPush,
      [OpcodesBCH.OP_PUSHBYTES_3]: conditionallyPush,
      [OpcodesBCH.OP_PUSHBYTES_4]: conditionallyPush,
      [OpcodesBCH.OP_PUSHBYTES_5]: conditionallyPush,
      [OpcodesBCH.OP_PUSHBYTES_6]: conditionallyPush,
      [OpcodesBCH.OP_PUSHBYTES_7]: conditionallyPush,
      [OpcodesBCH.OP_PUSHBYTES_8]: conditionallyPush,
      [OpcodesBCH.OP_PUSHBYTES_9]: conditionallyPush,
      [OpcodesBCH.OP_PUSHBYTES_10]: conditionallyPush,
      [OpcodesBCH.OP_PUSHBYTES_11]: conditionallyPush,
      [OpcodesBCH.OP_PUSHBYTES_12]: conditionallyPush,
      [OpcodesBCH.OP_PUSHBYTES_13]: conditionallyPush,
      [OpcodesBCH.OP_PUSHBYTES_14]: conditionallyPush,
      [OpcodesBCH.OP_PUSHBYTES_15]: conditionallyPush,
      [OpcodesBCH.OP_PUSHBYTES_16]: conditionallyPush,
      [OpcodesBCH.OP_PUSHBYTES_17]: conditionallyPush,
      [OpcodesBCH.OP_PUSHBYTES_18]: conditionallyPush,
      [OpcodesBCH.OP_PUSHBYTES_19]: conditionallyPush,
      [OpcodesBCH.OP_PUSHBYTES_20]: conditionallyPush,
      [OpcodesBCH.OP_PUSHBYTES_21]: conditionallyPush,
      [OpcodesBCH.OP_PUSHBYTES_22]: conditionallyPush,
      [OpcodesBCH.OP_PUSHBYTES_23]: conditionallyPush,
      [OpcodesBCH.OP_PUSHBYTES_24]: conditionallyPush,
      [OpcodesBCH.OP_PUSHBYTES_25]: conditionallyPush,
      [OpcodesBCH.OP_PUSHBYTES_26]: conditionallyPush,
      [OpcodesBCH.OP_PUSHBYTES_27]: conditionallyPush,
      [OpcodesBCH.OP_PUSHBYTES_28]: conditionallyPush,
      [OpcodesBCH.OP_PUSHBYTES_29]: conditionallyPush,
      [OpcodesBCH.OP_PUSHBYTES_30]: conditionallyPush,
      [OpcodesBCH.OP_PUSHBYTES_31]: conditionallyPush,
      [OpcodesBCH.OP_PUSHBYTES_32]: conditionallyPush,
      [OpcodesBCH.OP_PUSHBYTES_33]: conditionallyPush,
      [OpcodesBCH.OP_PUSHBYTES_34]: conditionallyPush,
      [OpcodesBCH.OP_PUSHBYTES_35]: conditionallyPush,
      [OpcodesBCH.OP_PUSHBYTES_36]: conditionallyPush,
      [OpcodesBCH.OP_PUSHBYTES_37]: conditionallyPush,
      [OpcodesBCH.OP_PUSHBYTES_38]: conditionallyPush,
      [OpcodesBCH.OP_PUSHBYTES_39]: conditionallyPush,
      [OpcodesBCH.OP_PUSHBYTES_40]: conditionallyPush,
      [OpcodesBCH.OP_PUSHBYTES_41]: conditionallyPush,
      [OpcodesBCH.OP_PUSHBYTES_42]: conditionallyPush,
      [OpcodesBCH.OP_PUSHBYTES_43]: conditionallyPush,
      [OpcodesBCH.OP_PUSHBYTES_44]: conditionallyPush,
      [OpcodesBCH.OP_PUSHBYTES_45]: conditionallyPush,
      [OpcodesBCH.OP_PUSHBYTES_46]: conditionallyPush,
      [OpcodesBCH.OP_PUSHBYTES_47]: conditionallyPush,
      [OpcodesBCH.OP_PUSHBYTES_48]: conditionallyPush,
      [OpcodesBCH.OP_PUSHBYTES_49]: conditionallyPush,
      [OpcodesBCH.OP_PUSHBYTES_50]: conditionallyPush,
      [OpcodesBCH.OP_PUSHBYTES_51]: conditionallyPush,
      [OpcodesBCH.OP_PUSHBYTES_52]: conditionallyPush,
      [OpcodesBCH.OP_PUSHBYTES_53]: conditionallyPush,
      [OpcodesBCH.OP_PUSHBYTES_54]: conditionallyPush,
      [OpcodesBCH.OP_PUSHBYTES_55]: conditionallyPush,
      [OpcodesBCH.OP_PUSHBYTES_56]: conditionallyPush,
      [OpcodesBCH.OP_PUSHBYTES_57]: conditionallyPush,
      [OpcodesBCH.OP_PUSHBYTES_58]: conditionallyPush,
      [OpcodesBCH.OP_PUSHBYTES_59]: conditionallyPush,
      [OpcodesBCH.OP_PUSHBYTES_60]: conditionallyPush,
      [OpcodesBCH.OP_PUSHBYTES_61]: conditionallyPush,
      [OpcodesBCH.OP_PUSHBYTES_62]: conditionallyPush,
      [OpcodesBCH.OP_PUSHBYTES_63]: conditionallyPush,
      [OpcodesBCH.OP_PUSHBYTES_64]: conditionallyPush,
      [OpcodesBCH.OP_PUSHBYTES_65]: conditionallyPush,
      [OpcodesBCH.OP_PUSHBYTES_66]: conditionallyPush,
      [OpcodesBCH.OP_PUSHBYTES_67]: conditionallyPush,
      [OpcodesBCH.OP_PUSHBYTES_68]: conditionallyPush,
      [OpcodesBCH.OP_PUSHBYTES_69]: conditionallyPush,
      [OpcodesBCH.OP_PUSHBYTES_70]: conditionallyPush,
      [OpcodesBCH.OP_PUSHBYTES_71]: conditionallyPush,
      [OpcodesBCH.OP_PUSHBYTES_72]: conditionallyPush,
      [OpcodesBCH.OP_PUSHBYTES_73]: conditionallyPush,
      [OpcodesBCH.OP_PUSHBYTES_74]: conditionallyPush,
      [OpcodesBCH.OP_PUSHBYTES_75]: conditionallyPush,
      [OpcodesBCH.OP_PUSHDATA_1]: conditionallyPush,
      [OpcodesBCH.OP_PUSHDATA_2]: conditionallyPush,
      [OpcodesBCH.OP_PUSHDATA_4]: conditionallyPush,
      [OpcodesBCH.OP_1NEGATE]: conditionallyEvaluate(pushNumberOperation(-1)),
      [OpcodesBCH.OP_RESERVED]: conditionallyEvaluate(reservedOperation),
      [OpcodesBCH.OP_1]: conditionallyEvaluate(pushNumberOperation(1)),
      /* eslint-disable @typescript-eslint/no-magic-numbers */
      [OpcodesBCH.OP_2]: conditionallyEvaluate(pushNumberOperation(2)),
      [OpcodesBCH.OP_3]: conditionallyEvaluate(pushNumberOperation(3)),
      [OpcodesBCH.OP_4]: conditionallyEvaluate(pushNumberOperation(4)),
      [OpcodesBCH.OP_5]: conditionallyEvaluate(pushNumberOperation(5)),
      [OpcodesBCH.OP_6]: conditionallyEvaluate(pushNumberOperation(6)),
      [OpcodesBCH.OP_7]: conditionallyEvaluate(pushNumberOperation(7)),
      [OpcodesBCH.OP_8]: conditionallyEvaluate(pushNumberOperation(8)),
      [OpcodesBCH.OP_9]: conditionallyEvaluate(pushNumberOperation(9)),
      [OpcodesBCH.OP_10]: conditionallyEvaluate(pushNumberOperation(10)),
      [OpcodesBCH.OP_11]: conditionallyEvaluate(pushNumberOperation(11)),
      [OpcodesBCH.OP_12]: conditionallyEvaluate(pushNumberOperation(12)),
      [OpcodesBCH.OP_13]: conditionallyEvaluate(pushNumberOperation(13)),
      [OpcodesBCH.OP_14]: conditionallyEvaluate(pushNumberOperation(14)),
      [OpcodesBCH.OP_15]: conditionallyEvaluate(pushNumberOperation(15)),
      [OpcodesBCH.OP_16]: conditionallyEvaluate(pushNumberOperation(16)),
      /* eslint-enable @typescript-eslint/no-magic-numbers */
      ...mapOverOperations<AuthenticationProgramStateBCH>(
        [incrementOperationCount],
        {
          [OpcodesBCH.OP_NOP]: conditionallyEvaluate(opNop),
          [OpcodesBCH.OP_VER]: conditionallyEvaluate(reservedOperation),
          [OpcodesBCH.OP_IF]: opIf,
          [OpcodesBCH.OP_NOTIF]: opNotIf,
          [OpcodesBCH.OP_VERIF]: reservedOperation,
          [OpcodesBCH.OP_VERNOTIF]: reservedOperation,
          [OpcodesBCH.OP_ELSE]: opElse,
          [OpcodesBCH.OP_ENDIF]: opEndIf,
          [OpcodesBCH.OP_VERIFY]: conditionallyEvaluate(opVerify),
          [OpcodesBCH.OP_RETURN]: conditionallyEvaluate(opReturn),
          [OpcodesBCH.OP_TOALTSTACK]: conditionallyEvaluate(opToAltStack),
          [OpcodesBCH.OP_FROMALTSTACK]: conditionallyEvaluate(opFromAltStack),
          [OpcodesBCH.OP_2DROP]: conditionallyEvaluate(op2Drop),
          [OpcodesBCH.OP_2DUP]: conditionallyEvaluate(op2Dup),
          [OpcodesBCH.OP_3DUP]: conditionallyEvaluate(op3Dup),
          [OpcodesBCH.OP_2OVER]: conditionallyEvaluate(op2Over),
          [OpcodesBCH.OP_2ROT]: conditionallyEvaluate(op2Rot),
          [OpcodesBCH.OP_2SWAP]: conditionallyEvaluate(op2Swap),
          [OpcodesBCH.OP_IFDUP]: conditionallyEvaluate(opIfDup),
          [OpcodesBCH.OP_DEPTH]: conditionallyEvaluate(opDepth),
          [OpcodesBCH.OP_DROP]: conditionallyEvaluate(opDrop),
          [OpcodesBCH.OP_DUP]: conditionallyEvaluate(opDup),
          [OpcodesBCH.OP_NIP]: conditionallyEvaluate(opNip),
          [OpcodesBCH.OP_OVER]: conditionallyEvaluate(opOver),
          [OpcodesBCH.OP_PICK]: conditionallyEvaluate(opPick),
          [OpcodesBCH.OP_ROLL]: conditionallyEvaluate(opRoll),
          [OpcodesBCH.OP_ROT]: conditionallyEvaluate(opRot),
          [OpcodesBCH.OP_SWAP]: conditionallyEvaluate(opSwap),
          [OpcodesBCH.OP_TUCK]: conditionallyEvaluate(opTuck),
          [OpcodesBCH.OP_CAT]: conditionallyEvaluate(opCat),
          [OpcodesBCH.OP_SPLIT]: conditionallyEvaluate(opSplit),
          [OpcodesBCH.OP_NUM2BIN]: conditionallyEvaluate(opNum2Bin),
          [OpcodesBCH.OP_BIN2NUM]: conditionallyEvaluate(opBin2Num),
          [OpcodesBCH.OP_SIZE]: conditionallyEvaluate(opSize),
          [OpcodesBCH.OP_INVERT]: disabledOperation,
          [OpcodesBCH.OP_AND]: conditionallyEvaluate(opAnd),
          [OpcodesBCH.OP_OR]: conditionallyEvaluate(opOr),
          [OpcodesBCH.OP_XOR]: conditionallyEvaluate(opXor),
          [OpcodesBCH.OP_EQUAL]: conditionallyEvaluate(opEqual),
          [OpcodesBCH.OP_EQUALVERIFY]: conditionallyEvaluate(opEqualVerify),
          [OpcodesBCH.OP_RESERVED1]: conditionallyEvaluate(reservedOperation),
          [OpcodesBCH.OP_RESERVED2]: conditionallyEvaluate(reservedOperation),
          [OpcodesBCH.OP_1ADD]: conditionallyEvaluate(op1Add),
          [OpcodesBCH.OP_1SUB]: conditionallyEvaluate(op1Sub),
          [OpcodesBCH.OP_2MUL]: disabledOperation,
          [OpcodesBCH.OP_2DIV]: disabledOperation,
          [OpcodesBCH.OP_NEGATE]: conditionallyEvaluate(opNegate),
          [OpcodesBCH.OP_ABS]: conditionallyEvaluate(opAbs),
          [OpcodesBCH.OP_NOT]: conditionallyEvaluate(opNot),
          [OpcodesBCH.OP_0NOTEQUAL]: conditionallyEvaluate(op0NotEqual),
          [OpcodesBCH.OP_ADD]: conditionallyEvaluate(opAdd),
          [OpcodesBCH.OP_SUB]: conditionallyEvaluate(opSub),
          [OpcodesBCH.OP_MUL]: conditionallyEvaluate(opMul),
          [OpcodesBCH.OP_DIV]: conditionallyEvaluate(opDiv),
          [OpcodesBCH.OP_MOD]: conditionallyEvaluate(opMod),
          [OpcodesBCH.OP_LSHIFT]: disabledOperation,
          [OpcodesBCH.OP_RSHIFT]: disabledOperation,
          [OpcodesBCH.OP_BOOLAND]: conditionallyEvaluate(opBoolAnd),
          [OpcodesBCH.OP_BOOLOR]: conditionallyEvaluate(opBoolOr),
          [OpcodesBCH.OP_NUMEQUAL]: conditionallyEvaluate(opNumEqual),
          [OpcodesBCH.OP_NUMEQUALVERIFY]:
            conditionallyEvaluate(opNumEqualVerify),
          [OpcodesBCH.OP_NUMNOTEQUAL]: conditionallyEvaluate(opNumNotEqual),
          [OpcodesBCH.OP_LESSTHAN]: conditionallyEvaluate(opLessThan),
          [OpcodesBCH.OP_GREATERTHAN]: conditionallyEvaluate(opGreaterThan),
          [OpcodesBCH.OP_LESSTHANOREQUAL]:
            conditionallyEvaluate(opLessThanOrEqual),
          [OpcodesBCH.OP_GREATERTHANOREQUAL]:
            conditionallyEvaluate(opGreaterThanOrEqual),
          [OpcodesBCH.OP_MIN]: conditionallyEvaluate(opMin),
          [OpcodesBCH.OP_MAX]: conditionallyEvaluate(opMax),
          [OpcodesBCH.OP_WITHIN]: conditionallyEvaluate(opWithin),
          [OpcodesBCH.OP_RIPEMD160]: conditionallyEvaluate(
            opRipemd160({ ripemd160 }),
          ),
          [OpcodesBCH.OP_SHA1]: conditionallyEvaluate(opSha1({ sha1 })),
          [OpcodesBCH.OP_SHA256]: conditionallyEvaluate(opSha256({ sha256 })),
          [OpcodesBCH.OP_HASH160]: conditionallyEvaluate(
            opHash160({ ripemd160, sha256 }),
          ),
          [OpcodesBCH.OP_HASH256]: conditionallyEvaluate(opHash256({ sha256 })),
          [OpcodesBCH.OP_CODESEPARATOR]: conditionallyEvaluate(opCodeSeparator),
          [OpcodesBCH.OP_CHECKSIG]: conditionallyEvaluate(
            opCheckSig({ secp256k1, sha256 }),
          ),
          [OpcodesBCH.OP_CHECKSIGVERIFY]: conditionallyEvaluate(
            opCheckSigVerify({ secp256k1, sha256 }),
          ),
          [OpcodesBCH.OP_CHECKMULTISIG]: conditionallyEvaluate(
            opCheckMultiSig({ secp256k1, sha256 }),
          ),
          [OpcodesBCH.OP_CHECKMULTISIGVERIFY]: conditionallyEvaluate(
            opCheckMultiSigVerify({ secp256k1, sha256 }),
          ),
          ...(standard
            ? {
                [OpcodesBCH.OP_NOP1]: conditionallyEvaluate(opNopDisallowed),
                [OpcodesBCH.OP_CHECKLOCKTIMEVERIFY]: conditionallyEvaluate(
                  opCheckLockTimeVerify,
                ),
                [OpcodesBCH.OP_CHECKSEQUENCEVERIFY]: conditionallyEvaluate(
                  opCheckSequenceVerify,
                ),
                [OpcodesBCH.OP_NOP4]: conditionallyEvaluate(opNopDisallowed),
                [OpcodesBCH.OP_NOP5]: conditionallyEvaluate(opNopDisallowed),
                [OpcodesBCH.OP_NOP6]: conditionallyEvaluate(opNopDisallowed),
                [OpcodesBCH.OP_NOP7]: conditionallyEvaluate(opNopDisallowed),
                [OpcodesBCH.OP_NOP8]: conditionallyEvaluate(opNopDisallowed),
                [OpcodesBCH.OP_NOP9]: conditionallyEvaluate(opNopDisallowed),
                [OpcodesBCH.OP_NOP10]: conditionallyEvaluate(opNopDisallowed),
              }
            : {
                [OpcodesBCH.OP_NOP1]: conditionallyEvaluate(opNop),
                [OpcodesBCH.OP_CHECKLOCKTIMEVERIFY]: conditionallyEvaluate(
                  opCheckLockTimeVerify,
                ),
                [OpcodesBCH.OP_CHECKSEQUENCEVERIFY]: conditionallyEvaluate(
                  opCheckSequenceVerify,
                ),
                [OpcodesBCH.OP_NOP4]: conditionallyEvaluate(opNop),
                [OpcodesBCH.OP_NOP5]: conditionallyEvaluate(opNop),
                [OpcodesBCH.OP_NOP6]: conditionallyEvaluate(opNop),
                [OpcodesBCH.OP_NOP7]: conditionallyEvaluate(opNop),
                [OpcodesBCH.OP_NOP8]: conditionallyEvaluate(opNop),
                [OpcodesBCH.OP_NOP9]: conditionallyEvaluate(opNop),
                [OpcodesBCH.OP_NOP10]: conditionallyEvaluate(opNop),
              }),
          [OpcodesBCH.OP_CHECKDATASIG]: conditionallyEvaluate(
            opCheckDataSig({ secp256k1, sha256 }),
          ),
          [OpcodesBCH.OP_CHECKDATASIGVERIFY]: conditionallyEvaluate(
            opCheckDataSigVerify({ secp256k1, sha256 }),
          ),
          [OpcodesBCH.OP_REVERSEBYTES]: conditionallyEvaluate(opReverseBytes),
          [OpcodesBCH.OP_INPUTINDEX]: conditionallyEvaluate(opInputIndex),
          [OpcodesBCH.OP_ACTIVEBYTECODE]:
            conditionallyEvaluate(opActiveBytecode),
          [OpcodesBCH.OP_TXVERSION]: conditionallyEvaluate(opTxVersion),
          [OpcodesBCH.OP_TXINPUTCOUNT]: conditionallyEvaluate(opTxInputCount),
          [OpcodesBCH.OP_TXOUTPUTCOUNT]: conditionallyEvaluate(opTxOutputCount),
          [OpcodesBCH.OP_TXLOCKTIME]: conditionallyEvaluate(opTxLocktime),
          [OpcodesBCH.OP_UTXOVALUE]: conditionallyEvaluate(opUtxoValue),
          [OpcodesBCH.OP_UTXOBYTECODE]: conditionallyEvaluate(opUtxoBytecode),
          [OpcodesBCH.OP_OUTPOINTTXHASH]:
            conditionallyEvaluate(opOutpointTxHash),
          [OpcodesBCH.OP_OUTPOINTINDEX]: conditionallyEvaluate(opOutpointIndex),
          [OpcodesBCH.OP_INPUTBYTECODE]: conditionallyEvaluate(opInputBytecode),
          [OpcodesBCH.OP_INPUTSEQUENCENUMBER]: conditionallyEvaluate(
            opInputSequenceNumber,
          ),
          [OpcodesBCH.OP_OUTPUTVALUE]: conditionallyEvaluate(opOutputValue),
          [OpcodesBCH.OP_OUTPUTBYTECODE]:
            conditionallyEvaluate(opOutputBytecode),
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
