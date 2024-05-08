import { isPayToScriptHash20 } from '../../../address/address.js';
import {
  ripemd160 as internalRipemd160,
  secp256k1 as internalSecp256k1,
  sha1 as internalSha1,
  sha256 as internalSha256,
} from '../../../crypto/crypto.js';
import type {
  AuthenticationProgramBch,
  AuthenticationProgramStateBch,
  InstructionSet,
  ResolvedTransactionBch,
  Ripemd160,
  Secp256k1,
  Sha1,
  Sha256,
} from '../../../lib.js';
import { encodeTransactionBch } from '../../../message/message.js';
import { OpcodesBch } from '../bch/bch.js';
import {
  applyError,
  AuthenticationErrorCommon,
  authenticationInstructionsAreMalformed,
  conditionallyEvaluate,
  ConsensusBch,
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
} from '../common/common.js';

/**
 * create an instance of the BCH 2022 virtual machine instruction set.
 *
 * @param standard - If `true`, the additional `isStandard` validations will be
 * enabled. Transactions that fail these rules are often called "non-standard"
 * and can technically be included by miners in valid blocks, but most network
 * nodes will refuse to relay them. (Default: `true`)
 */
export const createInstructionSetBch2022 = (
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
  AuthenticationProgramStateBch
> => {
  const conditionallyPush = pushOperation<AuthenticationProgramStateBch>();
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
      const initialState = createAuthenticationProgramStateCommon({
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
        createAuthenticationProgramStateCommon({
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
      ConsensusBch.maximumStackDepth
        ? applyError(state, AuthenticationErrorCommon.exceededMaximumStackDepth)
        : state.operationCount > ConsensusBch.maximumOperationCount
          ? applyError(
              state,
              AuthenticationErrorCommon.exceededMaximumOperationCount,
            )
          : state,
    operations: {
      [OpcodesBch.OP_0]: conditionallyPush,
      [OpcodesBch.OP_PUSHBYTES_1]: conditionallyPush,
      [OpcodesBch.OP_PUSHBYTES_2]: conditionallyPush,
      [OpcodesBch.OP_PUSHBYTES_3]: conditionallyPush,
      [OpcodesBch.OP_PUSHBYTES_4]: conditionallyPush,
      [OpcodesBch.OP_PUSHBYTES_5]: conditionallyPush,
      [OpcodesBch.OP_PUSHBYTES_6]: conditionallyPush,
      [OpcodesBch.OP_PUSHBYTES_7]: conditionallyPush,
      [OpcodesBch.OP_PUSHBYTES_8]: conditionallyPush,
      [OpcodesBch.OP_PUSHBYTES_9]: conditionallyPush,
      [OpcodesBch.OP_PUSHBYTES_10]: conditionallyPush,
      [OpcodesBch.OP_PUSHBYTES_11]: conditionallyPush,
      [OpcodesBch.OP_PUSHBYTES_12]: conditionallyPush,
      [OpcodesBch.OP_PUSHBYTES_13]: conditionallyPush,
      [OpcodesBch.OP_PUSHBYTES_14]: conditionallyPush,
      [OpcodesBch.OP_PUSHBYTES_15]: conditionallyPush,
      [OpcodesBch.OP_PUSHBYTES_16]: conditionallyPush,
      [OpcodesBch.OP_PUSHBYTES_17]: conditionallyPush,
      [OpcodesBch.OP_PUSHBYTES_18]: conditionallyPush,
      [OpcodesBch.OP_PUSHBYTES_19]: conditionallyPush,
      [OpcodesBch.OP_PUSHBYTES_20]: conditionallyPush,
      [OpcodesBch.OP_PUSHBYTES_21]: conditionallyPush,
      [OpcodesBch.OP_PUSHBYTES_22]: conditionallyPush,
      [OpcodesBch.OP_PUSHBYTES_23]: conditionallyPush,
      [OpcodesBch.OP_PUSHBYTES_24]: conditionallyPush,
      [OpcodesBch.OP_PUSHBYTES_25]: conditionallyPush,
      [OpcodesBch.OP_PUSHBYTES_26]: conditionallyPush,
      [OpcodesBch.OP_PUSHBYTES_27]: conditionallyPush,
      [OpcodesBch.OP_PUSHBYTES_28]: conditionallyPush,
      [OpcodesBch.OP_PUSHBYTES_29]: conditionallyPush,
      [OpcodesBch.OP_PUSHBYTES_30]: conditionallyPush,
      [OpcodesBch.OP_PUSHBYTES_31]: conditionallyPush,
      [OpcodesBch.OP_PUSHBYTES_32]: conditionallyPush,
      [OpcodesBch.OP_PUSHBYTES_33]: conditionallyPush,
      [OpcodesBch.OP_PUSHBYTES_34]: conditionallyPush,
      [OpcodesBch.OP_PUSHBYTES_35]: conditionallyPush,
      [OpcodesBch.OP_PUSHBYTES_36]: conditionallyPush,
      [OpcodesBch.OP_PUSHBYTES_37]: conditionallyPush,
      [OpcodesBch.OP_PUSHBYTES_38]: conditionallyPush,
      [OpcodesBch.OP_PUSHBYTES_39]: conditionallyPush,
      [OpcodesBch.OP_PUSHBYTES_40]: conditionallyPush,
      [OpcodesBch.OP_PUSHBYTES_41]: conditionallyPush,
      [OpcodesBch.OP_PUSHBYTES_42]: conditionallyPush,
      [OpcodesBch.OP_PUSHBYTES_43]: conditionallyPush,
      [OpcodesBch.OP_PUSHBYTES_44]: conditionallyPush,
      [OpcodesBch.OP_PUSHBYTES_45]: conditionallyPush,
      [OpcodesBch.OP_PUSHBYTES_46]: conditionallyPush,
      [OpcodesBch.OP_PUSHBYTES_47]: conditionallyPush,
      [OpcodesBch.OP_PUSHBYTES_48]: conditionallyPush,
      [OpcodesBch.OP_PUSHBYTES_49]: conditionallyPush,
      [OpcodesBch.OP_PUSHBYTES_50]: conditionallyPush,
      [OpcodesBch.OP_PUSHBYTES_51]: conditionallyPush,
      [OpcodesBch.OP_PUSHBYTES_52]: conditionallyPush,
      [OpcodesBch.OP_PUSHBYTES_53]: conditionallyPush,
      [OpcodesBch.OP_PUSHBYTES_54]: conditionallyPush,
      [OpcodesBch.OP_PUSHBYTES_55]: conditionallyPush,
      [OpcodesBch.OP_PUSHBYTES_56]: conditionallyPush,
      [OpcodesBch.OP_PUSHBYTES_57]: conditionallyPush,
      [OpcodesBch.OP_PUSHBYTES_58]: conditionallyPush,
      [OpcodesBch.OP_PUSHBYTES_59]: conditionallyPush,
      [OpcodesBch.OP_PUSHBYTES_60]: conditionallyPush,
      [OpcodesBch.OP_PUSHBYTES_61]: conditionallyPush,
      [OpcodesBch.OP_PUSHBYTES_62]: conditionallyPush,
      [OpcodesBch.OP_PUSHBYTES_63]: conditionallyPush,
      [OpcodesBch.OP_PUSHBYTES_64]: conditionallyPush,
      [OpcodesBch.OP_PUSHBYTES_65]: conditionallyPush,
      [OpcodesBch.OP_PUSHBYTES_66]: conditionallyPush,
      [OpcodesBch.OP_PUSHBYTES_67]: conditionallyPush,
      [OpcodesBch.OP_PUSHBYTES_68]: conditionallyPush,
      [OpcodesBch.OP_PUSHBYTES_69]: conditionallyPush,
      [OpcodesBch.OP_PUSHBYTES_70]: conditionallyPush,
      [OpcodesBch.OP_PUSHBYTES_71]: conditionallyPush,
      [OpcodesBch.OP_PUSHBYTES_72]: conditionallyPush,
      [OpcodesBch.OP_PUSHBYTES_73]: conditionallyPush,
      [OpcodesBch.OP_PUSHBYTES_74]: conditionallyPush,
      [OpcodesBch.OP_PUSHBYTES_75]: conditionallyPush,
      [OpcodesBch.OP_PUSHDATA_1]: conditionallyPush,
      [OpcodesBch.OP_PUSHDATA_2]: conditionallyPush,
      [OpcodesBch.OP_PUSHDATA_4]: conditionallyPush,
      [OpcodesBch.OP_1NEGATE]: conditionallyEvaluate(pushNumberOperation(-1)),
      [OpcodesBch.OP_RESERVED]: conditionallyEvaluate(reservedOperation),
      [OpcodesBch.OP_1]: conditionallyEvaluate(pushNumberOperation(1)),
      /* eslint-disable @typescript-eslint/no-magic-numbers */
      [OpcodesBch.OP_2]: conditionallyEvaluate(pushNumberOperation(2)),
      [OpcodesBch.OP_3]: conditionallyEvaluate(pushNumberOperation(3)),
      [OpcodesBch.OP_4]: conditionallyEvaluate(pushNumberOperation(4)),
      [OpcodesBch.OP_5]: conditionallyEvaluate(pushNumberOperation(5)),
      [OpcodesBch.OP_6]: conditionallyEvaluate(pushNumberOperation(6)),
      [OpcodesBch.OP_7]: conditionallyEvaluate(pushNumberOperation(7)),
      [OpcodesBch.OP_8]: conditionallyEvaluate(pushNumberOperation(8)),
      [OpcodesBch.OP_9]: conditionallyEvaluate(pushNumberOperation(9)),
      [OpcodesBch.OP_10]: conditionallyEvaluate(pushNumberOperation(10)),
      [OpcodesBch.OP_11]: conditionallyEvaluate(pushNumberOperation(11)),
      [OpcodesBch.OP_12]: conditionallyEvaluate(pushNumberOperation(12)),
      [OpcodesBch.OP_13]: conditionallyEvaluate(pushNumberOperation(13)),
      [OpcodesBch.OP_14]: conditionallyEvaluate(pushNumberOperation(14)),
      [OpcodesBch.OP_15]: conditionallyEvaluate(pushNumberOperation(15)),
      [OpcodesBch.OP_16]: conditionallyEvaluate(pushNumberOperation(16)),
      /* eslint-enable @typescript-eslint/no-magic-numbers */
      ...mapOverOperations<AuthenticationProgramStateBch>(
        [incrementOperationCount],
        {
          [OpcodesBch.OP_NOP]: conditionallyEvaluate(opNop),
          [OpcodesBch.OP_VER]: conditionallyEvaluate(reservedOperation),
          [OpcodesBch.OP_IF]: opIf,
          [OpcodesBch.OP_NOTIF]: opNotIf,
          [OpcodesBch.OP_VERIF]: reservedOperation,
          [OpcodesBch.OP_VERNOTIF]: reservedOperation,
          [OpcodesBch.OP_ELSE]: opElse,
          [OpcodesBch.OP_ENDIF]: opEndIf,
          [OpcodesBch.OP_VERIFY]: conditionallyEvaluate(opVerify),
          [OpcodesBch.OP_RETURN]: conditionallyEvaluate(opReturn),
          [OpcodesBch.OP_TOALTSTACK]: conditionallyEvaluate(opToAltStack),
          [OpcodesBch.OP_FROMALTSTACK]: conditionallyEvaluate(opFromAltStack),
          [OpcodesBch.OP_2DROP]: conditionallyEvaluate(op2Drop),
          [OpcodesBch.OP_2DUP]: conditionallyEvaluate(op2Dup),
          [OpcodesBch.OP_3DUP]: conditionallyEvaluate(op3Dup),
          [OpcodesBch.OP_2OVER]: conditionallyEvaluate(op2Over),
          [OpcodesBch.OP_2ROT]: conditionallyEvaluate(op2Rot),
          [OpcodesBch.OP_2SWAP]: conditionallyEvaluate(op2Swap),
          [OpcodesBch.OP_IFDUP]: conditionallyEvaluate(opIfDup),
          [OpcodesBch.OP_DEPTH]: conditionallyEvaluate(opDepth),
          [OpcodesBch.OP_DROP]: conditionallyEvaluate(opDrop),
          [OpcodesBch.OP_DUP]: conditionallyEvaluate(opDup),
          [OpcodesBch.OP_NIP]: conditionallyEvaluate(opNip),
          [OpcodesBch.OP_OVER]: conditionallyEvaluate(opOver),
          [OpcodesBch.OP_PICK]: conditionallyEvaluate(opPick),
          [OpcodesBch.OP_ROLL]: conditionallyEvaluate(opRoll),
          [OpcodesBch.OP_ROT]: conditionallyEvaluate(opRot),
          [OpcodesBch.OP_SWAP]: conditionallyEvaluate(opSwap),
          [OpcodesBch.OP_TUCK]: conditionallyEvaluate(opTuck),
          [OpcodesBch.OP_CAT]: conditionallyEvaluate(opCat),
          [OpcodesBch.OP_SPLIT]: conditionallyEvaluate(opSplit),
          [OpcodesBch.OP_NUM2BIN]: conditionallyEvaluate(opNum2Bin),
          [OpcodesBch.OP_BIN2NUM]: conditionallyEvaluate(opBin2Num),
          [OpcodesBch.OP_SIZE]: conditionallyEvaluate(opSize),
          [OpcodesBch.OP_INVERT]: disabledOperation,
          [OpcodesBch.OP_AND]: conditionallyEvaluate(opAnd),
          [OpcodesBch.OP_OR]: conditionallyEvaluate(opOr),
          [OpcodesBch.OP_XOR]: conditionallyEvaluate(opXor),
          [OpcodesBch.OP_EQUAL]: conditionallyEvaluate(opEqual),
          [OpcodesBch.OP_EQUALVERIFY]: conditionallyEvaluate(opEqualVerify),
          [OpcodesBch.OP_RESERVED1]: conditionallyEvaluate(reservedOperation),
          [OpcodesBch.OP_RESERVED2]: conditionallyEvaluate(reservedOperation),
          [OpcodesBch.OP_1ADD]: conditionallyEvaluate(op1Add),
          [OpcodesBch.OP_1SUB]: conditionallyEvaluate(op1Sub),
          [OpcodesBch.OP_2MUL]: disabledOperation,
          [OpcodesBch.OP_2DIV]: disabledOperation,
          [OpcodesBch.OP_NEGATE]: conditionallyEvaluate(opNegate),
          [OpcodesBch.OP_ABS]: conditionallyEvaluate(opAbs),
          [OpcodesBch.OP_NOT]: conditionallyEvaluate(opNot),
          [OpcodesBch.OP_0NOTEQUAL]: conditionallyEvaluate(op0NotEqual),
          [OpcodesBch.OP_ADD]: conditionallyEvaluate(opAdd),
          [OpcodesBch.OP_SUB]: conditionallyEvaluate(opSub),
          [OpcodesBch.OP_MUL]: conditionallyEvaluate(opMul),
          [OpcodesBch.OP_DIV]: conditionallyEvaluate(opDiv),
          [OpcodesBch.OP_MOD]: conditionallyEvaluate(opMod),
          [OpcodesBch.OP_LSHIFT]: disabledOperation,
          [OpcodesBch.OP_RSHIFT]: disabledOperation,
          [OpcodesBch.OP_BOOLAND]: conditionallyEvaluate(opBoolAnd),
          [OpcodesBch.OP_BOOLOR]: conditionallyEvaluate(opBoolOr),
          [OpcodesBch.OP_NUMEQUAL]: conditionallyEvaluate(opNumEqual),
          [OpcodesBch.OP_NUMEQUALVERIFY]:
            conditionallyEvaluate(opNumEqualVerify),
          [OpcodesBch.OP_NUMNOTEQUAL]: conditionallyEvaluate(opNumNotEqual),
          [OpcodesBch.OP_LESSTHAN]: conditionallyEvaluate(opLessThan),
          [OpcodesBch.OP_GREATERTHAN]: conditionallyEvaluate(opGreaterThan),
          [OpcodesBch.OP_LESSTHANOREQUAL]:
            conditionallyEvaluate(opLessThanOrEqual),
          [OpcodesBch.OP_GREATERTHANOREQUAL]:
            conditionallyEvaluate(opGreaterThanOrEqual),
          [OpcodesBch.OP_MIN]: conditionallyEvaluate(opMin),
          [OpcodesBch.OP_MAX]: conditionallyEvaluate(opMax),
          [OpcodesBch.OP_WITHIN]: conditionallyEvaluate(opWithin),
          [OpcodesBch.OP_RIPEMD160]: conditionallyEvaluate(
            opRipemd160({ ripemd160 }),
          ),
          [OpcodesBch.OP_SHA1]: conditionallyEvaluate(opSha1({ sha1 })),
          [OpcodesBch.OP_SHA256]: conditionallyEvaluate(opSha256({ sha256 })),
          [OpcodesBch.OP_HASH160]: conditionallyEvaluate(
            opHash160({ ripemd160, sha256 }),
          ),
          [OpcodesBch.OP_HASH256]: conditionallyEvaluate(opHash256({ sha256 })),
          [OpcodesBch.OP_CODESEPARATOR]: conditionallyEvaluate(opCodeSeparator),
          [OpcodesBch.OP_CHECKSIG]: conditionallyEvaluate(
            opCheckSig({ secp256k1, sha256 }),
          ),
          [OpcodesBch.OP_CHECKSIGVERIFY]: conditionallyEvaluate(
            opCheckSigVerify({ secp256k1, sha256 }),
          ),
          [OpcodesBch.OP_CHECKMULTISIG]: conditionallyEvaluate(
            opCheckMultiSig({ secp256k1, sha256 }),
          ),
          [OpcodesBch.OP_CHECKMULTISIGVERIFY]: conditionallyEvaluate(
            opCheckMultiSigVerify({ secp256k1, sha256 }),
          ),
          ...(standard
            ? {
                [OpcodesBch.OP_NOP1]: conditionallyEvaluate(opNopDisallowed),
                [OpcodesBch.OP_CHECKLOCKTIMEVERIFY]: conditionallyEvaluate(
                  opCheckLockTimeVerify,
                ),
                [OpcodesBch.OP_CHECKSEQUENCEVERIFY]: conditionallyEvaluate(
                  opCheckSequenceVerify,
                ),
                [OpcodesBch.OP_NOP4]: conditionallyEvaluate(opNopDisallowed),
                [OpcodesBch.OP_NOP5]: conditionallyEvaluate(opNopDisallowed),
                [OpcodesBch.OP_NOP6]: conditionallyEvaluate(opNopDisallowed),
                [OpcodesBch.OP_NOP7]: conditionallyEvaluate(opNopDisallowed),
                [OpcodesBch.OP_NOP8]: conditionallyEvaluate(opNopDisallowed),
                [OpcodesBch.OP_NOP9]: conditionallyEvaluate(opNopDisallowed),
                [OpcodesBch.OP_NOP10]: conditionallyEvaluate(opNopDisallowed),
              }
            : {
                [OpcodesBch.OP_NOP1]: conditionallyEvaluate(opNop),
                [OpcodesBch.OP_CHECKLOCKTIMEVERIFY]: conditionallyEvaluate(
                  opCheckLockTimeVerify,
                ),
                [OpcodesBch.OP_CHECKSEQUENCEVERIFY]: conditionallyEvaluate(
                  opCheckSequenceVerify,
                ),
                [OpcodesBch.OP_NOP4]: conditionallyEvaluate(opNop),
                [OpcodesBch.OP_NOP5]: conditionallyEvaluate(opNop),
                [OpcodesBch.OP_NOP6]: conditionallyEvaluate(opNop),
                [OpcodesBch.OP_NOP7]: conditionallyEvaluate(opNop),
                [OpcodesBch.OP_NOP8]: conditionallyEvaluate(opNop),
                [OpcodesBch.OP_NOP9]: conditionallyEvaluate(opNop),
                [OpcodesBch.OP_NOP10]: conditionallyEvaluate(opNop),
              }),
          [OpcodesBch.OP_CHECKDATASIG]: conditionallyEvaluate(
            opCheckDataSig({ secp256k1, sha256 }),
          ),
          [OpcodesBch.OP_CHECKDATASIGVERIFY]: conditionallyEvaluate(
            opCheckDataSigVerify({ secp256k1, sha256 }),
          ),
          [OpcodesBch.OP_REVERSEBYTES]: conditionallyEvaluate(opReverseBytes),
          [OpcodesBch.OP_INPUTINDEX]: conditionallyEvaluate(opInputIndex),
          [OpcodesBch.OP_ACTIVEBYTECODE]:
            conditionallyEvaluate(opActiveBytecode),
          [OpcodesBch.OP_TXVERSION]: conditionallyEvaluate(opTxVersion),
          [OpcodesBch.OP_TXINPUTCOUNT]: conditionallyEvaluate(opTxInputCount),
          [OpcodesBch.OP_TXOUTPUTCOUNT]: conditionallyEvaluate(opTxOutputCount),
          [OpcodesBch.OP_TXLOCKTIME]: conditionallyEvaluate(opTxLocktime),
          [OpcodesBch.OP_UTXOVALUE]: conditionallyEvaluate(opUtxoValue),
          [OpcodesBch.OP_UTXOBYTECODE]: conditionallyEvaluate(opUtxoBytecode),
          [OpcodesBch.OP_OUTPOINTTXHASH]:
            conditionallyEvaluate(opOutpointTxHash),
          [OpcodesBch.OP_OUTPOINTINDEX]: conditionallyEvaluate(opOutpointIndex),
          [OpcodesBch.OP_INPUTBYTECODE]: conditionallyEvaluate(opInputBytecode),
          [OpcodesBch.OP_INPUTSEQUENCENUMBER]: conditionallyEvaluate(
            opInputSequenceNumber,
          ),
          [OpcodesBch.OP_OUTPUTVALUE]: conditionallyEvaluate(opOutputValue),
          [OpcodesBch.OP_OUTPUTBYTECODE]:
            conditionallyEvaluate(opOutputBytecode),
        },
      ),
    },
    success: (state: AuthenticationProgramStateBch) => {
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
