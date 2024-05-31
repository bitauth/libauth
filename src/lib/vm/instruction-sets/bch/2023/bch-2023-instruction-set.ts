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
  AuthenticationProgramBch,
  AuthenticationProgramStateBch,
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
  conditionallyEvaluate,
  createOpBin2Num,
  createOpNum2Bin,
  decodeAuthenticationInstructions,
  disabledOperation,
  getDustThreshold,
  incrementOperationCount,
  isArbitraryDataOutput,
  isDustOutput,
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

import { ConsensusBch2023 } from './bch-2023-consensus.js';
import {
  opCheckMultiSigBch2023,
  opCheckMultiSigVerifyBch2023,
  opCheckSigBch2023,
  opCheckSigVerifyBch2023,
} from './bch-2023-crypto.js';
import { OpcodesBch2023 } from './bch-2023-opcodes.js';
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
export const createInstructionSetBch2023 = <
  AuthenticationProgramState extends AuthenticationProgramStateBch,
>(
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
  AuthenticationProgramState
> => {
  const conditionallyPush = pushOperation<AuthenticationProgramState>();
  return {
    continue: (state) =>
      state.error === undefined && state.ip < state.instructions.length,
    // eslint-disable-next-line complexity
    evaluate: (program, { stateEvaluate, stateInitialize, stateOverride }) => {
      const { unlockingBytecode } =
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        program.transaction.inputs[program.inputIndex]!;
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const { lockingBytecode } = program.sourceOutputs[program.inputIndex]!;
      const unlockingInstructions =
        decodeAuthenticationInstructions(unlockingBytecode);
      const lockingInstructions =
        decodeAuthenticationInstructions(lockingBytecode);
      const transactionLengthBytes = encodeTransactionBch(
        program.transaction,
      ).length;
      const initialState = {
        ...(stateInitialize() as AuthenticationProgramState),
        transactionLengthBytes,
        ...stateOverride,
        ...{
          instructions: unlockingInstructions,
          program,
          stack: [],
        },
      } as AuthenticationProgramState;

      if (unlockingBytecode.length > ConsensusBch2023.maximumBytecodeLength) {
        return applyError(
          initialState,
          `The provided unlocking bytecode (${unlockingBytecode.length} bytes) exceeds the maximum bytecode length (${ConsensusBch2023.maximumBytecodeLength} bytes).`,
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
      if (lockingBytecode.length > ConsensusBch2023.maximumBytecodeLength) {
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
      const lockingResult = stateEvaluate({
        ...(stateInitialize() as AuthenticationProgramState),
        transactionLengthBytes,
        ...stateOverride,
        ...{
          instructions: lockingInstructions,
          metrics: unlockingResult.metrics,
          program,
          stack: unlockingResult.stack,
        },
      } as AuthenticationProgramState);

      const p2sh20 = isPayToScriptHash20(lockingBytecode);
      const p2sh32 = isPayToScriptHash32(lockingBytecode);
      if (!p2sh20 && !p2sh32) {
        return lockingResult;
      }
      const p2shStack = structuredClone(unlockingResult.stack);
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
        : stateEvaluate({
            ...(stateInitialize() as AuthenticationProgramState),
            transactionLengthBytes,
            ...stateOverride,
            ...{
              instructions: p2shInstructions,
              metrics: lockingResult.metrics,
              program,
              stack: p2shStack,
            },
          } as AuthenticationProgramState);
    },
    every: (state) =>
      state.stack.length + state.alternateStack.length >
      ConsensusBch2023.maximumStackDepth
        ? applyError(state, AuthenticationErrorCommon.exceededMaximumStackDepth)
        : state.operationCount > ConsensusBch2023.maximumOperationCount
          ? applyError(
              state,
              AuthenticationErrorCommon.exceededMaximumOperationCount,
            )
          : state,

    initialize: () =>
      ({
        alternateStack: [],
        controlStack: [],
        ip: 0,
        lastCodeSeparator: -1,
        metrics: {
          executedInstructionCount: 0,
          signatureCheckCount: 0,
        },
        operationCount: 0,
        signedMessages: [],
      }) as Partial<AuthenticationProgramStateBch> as Partial<AuthenticationProgramState>,
    operations: {
      [OpcodesBch2023.OP_0]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_1]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_2]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_3]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_4]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_5]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_6]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_7]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_8]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_9]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_10]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_11]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_12]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_13]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_14]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_15]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_16]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_17]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_18]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_19]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_20]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_21]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_22]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_23]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_24]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_25]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_26]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_27]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_28]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_29]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_30]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_31]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_32]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_33]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_34]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_35]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_36]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_37]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_38]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_39]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_40]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_41]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_42]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_43]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_44]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_45]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_46]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_47]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_48]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_49]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_50]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_51]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_52]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_53]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_54]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_55]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_56]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_57]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_58]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_59]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_60]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_61]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_62]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_63]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_64]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_65]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_66]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_67]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_68]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_69]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_70]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_71]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_72]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_73]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_74]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_75]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHDATA_1]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHDATA_2]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHDATA_4]: conditionallyPush,
      [OpcodesBch2023.OP_1NEGATE]: conditionallyEvaluate(
        pushNumberOperation(-1),
      ),
      [OpcodesBch2023.OP_RESERVED]: conditionallyEvaluate(reservedOperation),
      [OpcodesBch2023.OP_1]: conditionallyEvaluate(pushNumberOperation(1)),
      /* eslint-disable @typescript-eslint/no-magic-numbers */
      [OpcodesBch2023.OP_2]: conditionallyEvaluate(pushNumberOperation(2)),
      [OpcodesBch2023.OP_3]: conditionallyEvaluate(pushNumberOperation(3)),
      [OpcodesBch2023.OP_4]: conditionallyEvaluate(pushNumberOperation(4)),
      [OpcodesBch2023.OP_5]: conditionallyEvaluate(pushNumberOperation(5)),
      [OpcodesBch2023.OP_6]: conditionallyEvaluate(pushNumberOperation(6)),
      [OpcodesBch2023.OP_7]: conditionallyEvaluate(pushNumberOperation(7)),
      [OpcodesBch2023.OP_8]: conditionallyEvaluate(pushNumberOperation(8)),
      [OpcodesBch2023.OP_9]: conditionallyEvaluate(pushNumberOperation(9)),
      [OpcodesBch2023.OP_10]: conditionallyEvaluate(pushNumberOperation(10)),
      [OpcodesBch2023.OP_11]: conditionallyEvaluate(pushNumberOperation(11)),
      [OpcodesBch2023.OP_12]: conditionallyEvaluate(pushNumberOperation(12)),
      [OpcodesBch2023.OP_13]: conditionallyEvaluate(pushNumberOperation(13)),
      [OpcodesBch2023.OP_14]: conditionallyEvaluate(pushNumberOperation(14)),
      [OpcodesBch2023.OP_15]: conditionallyEvaluate(pushNumberOperation(15)),
      [OpcodesBch2023.OP_16]: conditionallyEvaluate(pushNumberOperation(16)),
      /* eslint-enable @typescript-eslint/no-magic-numbers */
      ...mapOverOperations<AuthenticationProgramStateBch>(
        [incrementOperationCount],
        {
          [OpcodesBch2023.OP_NOP]: conditionallyEvaluate(opNop),
          [OpcodesBch2023.OP_VER]: conditionallyEvaluate(reservedOperation),
          [OpcodesBch2023.OP_IF]: opIf,
          [OpcodesBch2023.OP_NOTIF]: opNotIf,
          [OpcodesBch2023.OP_VERIF]: reservedOperation,
          [OpcodesBch2023.OP_VERNOTIF]: reservedOperation,
          [OpcodesBch2023.OP_ELSE]: opElse,
          [OpcodesBch2023.OP_ENDIF]: opEndIf,
          [OpcodesBch2023.OP_VERIFY]: conditionallyEvaluate(opVerify),
          [OpcodesBch2023.OP_RETURN]: conditionallyEvaluate(opReturn),
          [OpcodesBch2023.OP_TOALTSTACK]: conditionallyEvaluate(opToAltStack),
          [OpcodesBch2023.OP_FROMALTSTACK]:
            conditionallyEvaluate(opFromAltStack),
          [OpcodesBch2023.OP_2DROP]: conditionallyEvaluate(op2Drop),
          [OpcodesBch2023.OP_2DUP]: conditionallyEvaluate(op2Dup),
          [OpcodesBch2023.OP_3DUP]: conditionallyEvaluate(op3Dup),
          [OpcodesBch2023.OP_2OVER]: conditionallyEvaluate(op2Over),
          [OpcodesBch2023.OP_2ROT]: conditionallyEvaluate(op2Rot),
          [OpcodesBch2023.OP_2SWAP]: conditionallyEvaluate(op2Swap),
          [OpcodesBch2023.OP_IFDUP]: conditionallyEvaluate(opIfDup),
          [OpcodesBch2023.OP_DEPTH]: conditionallyEvaluate(opDepth),
          [OpcodesBch2023.OP_DROP]: conditionallyEvaluate(opDrop),
          [OpcodesBch2023.OP_DUP]: conditionallyEvaluate(opDup),
          [OpcodesBch2023.OP_NIP]: conditionallyEvaluate(opNip),
          [OpcodesBch2023.OP_OVER]: conditionallyEvaluate(opOver),
          [OpcodesBch2023.OP_PICK]: conditionallyEvaluate(opPick),
          [OpcodesBch2023.OP_ROLL]: conditionallyEvaluate(opRoll),
          [OpcodesBch2023.OP_ROT]: conditionallyEvaluate(opRot),
          [OpcodesBch2023.OP_SWAP]: conditionallyEvaluate(opSwap),
          [OpcodesBch2023.OP_TUCK]: conditionallyEvaluate(opTuck),
          [OpcodesBch2023.OP_CAT]: conditionallyEvaluate(opCat),
          [OpcodesBch2023.OP_SPLIT]: conditionallyEvaluate(opSplit),
          [OpcodesBch2023.OP_NUM2BIN]: conditionallyEvaluate(createOpNum2Bin()),
          [OpcodesBch2023.OP_BIN2NUM]: conditionallyEvaluate(createOpBin2Num()),
          [OpcodesBch2023.OP_SIZE]: conditionallyEvaluate(opSize),
          [OpcodesBch2023.OP_INVERT]: disabledOperation,
          [OpcodesBch2023.OP_AND]: conditionallyEvaluate(opAnd),
          [OpcodesBch2023.OP_OR]: conditionallyEvaluate(opOr),
          [OpcodesBch2023.OP_XOR]: conditionallyEvaluate(opXor),
          [OpcodesBch2023.OP_EQUAL]: conditionallyEvaluate(opEqual),
          [OpcodesBch2023.OP_EQUALVERIFY]: conditionallyEvaluate(opEqualVerify),
          [OpcodesBch2023.OP_RESERVED1]:
            conditionallyEvaluate(reservedOperation),
          [OpcodesBch2023.OP_RESERVED2]:
            conditionallyEvaluate(reservedOperation),
          [OpcodesBch2023.OP_1ADD]: conditionallyEvaluate(op1Add),
          [OpcodesBch2023.OP_1SUB]: conditionallyEvaluate(op1Sub),
          [OpcodesBch2023.OP_2MUL]: disabledOperation,
          [OpcodesBch2023.OP_2DIV]: disabledOperation,
          [OpcodesBch2023.OP_NEGATE]: conditionallyEvaluate(opNegate),
          [OpcodesBch2023.OP_ABS]: conditionallyEvaluate(opAbs),
          [OpcodesBch2023.OP_NOT]: conditionallyEvaluate(opNot),
          [OpcodesBch2023.OP_0NOTEQUAL]: conditionallyEvaluate(op0NotEqual),
          [OpcodesBch2023.OP_ADD]: conditionallyEvaluate(opAdd),
          [OpcodesBch2023.OP_SUB]: conditionallyEvaluate(opSub),
          [OpcodesBch2023.OP_MUL]: conditionallyEvaluate(opMul),
          [OpcodesBch2023.OP_DIV]: conditionallyEvaluate(opDiv),
          [OpcodesBch2023.OP_MOD]: conditionallyEvaluate(opMod),
          [OpcodesBch2023.OP_LSHIFT]: disabledOperation,
          [OpcodesBch2023.OP_RSHIFT]: disabledOperation,
          [OpcodesBch2023.OP_BOOLAND]: conditionallyEvaluate(opBoolAnd),
          [OpcodesBch2023.OP_BOOLOR]: conditionallyEvaluate(opBoolOr),
          [OpcodesBch2023.OP_NUMEQUAL]: conditionallyEvaluate(opNumEqual),
          [OpcodesBch2023.OP_NUMEQUALVERIFY]:
            conditionallyEvaluate(opNumEqualVerify),
          [OpcodesBch2023.OP_NUMNOTEQUAL]: conditionallyEvaluate(opNumNotEqual),
          [OpcodesBch2023.OP_LESSTHAN]: conditionallyEvaluate(opLessThan),
          [OpcodesBch2023.OP_GREATERTHAN]: conditionallyEvaluate(opGreaterThan),
          [OpcodesBch2023.OP_LESSTHANOREQUAL]:
            conditionallyEvaluate(opLessThanOrEqual),
          [OpcodesBch2023.OP_GREATERTHANOREQUAL]:
            conditionallyEvaluate(opGreaterThanOrEqual),
          [OpcodesBch2023.OP_MIN]: conditionallyEvaluate(opMin),
          [OpcodesBch2023.OP_MAX]: conditionallyEvaluate(opMax),
          [OpcodesBch2023.OP_WITHIN]: conditionallyEvaluate(opWithin),
          [OpcodesBch2023.OP_RIPEMD160]: conditionallyEvaluate(
            opRipemd160({ ripemd160 }),
          ),
          [OpcodesBch2023.OP_SHA1]: conditionallyEvaluate(opSha1({ sha1 })),
          [OpcodesBch2023.OP_SHA256]: conditionallyEvaluate(
            opSha256({ sha256 }),
          ),
          [OpcodesBch2023.OP_HASH160]: conditionallyEvaluate(
            opHash160({ ripemd160, sha256 }),
          ),
          [OpcodesBch2023.OP_HASH256]: conditionallyEvaluate(
            opHash256({ sha256 }),
          ),
          [OpcodesBch2023.OP_CODESEPARATOR]:
            conditionallyEvaluate(opCodeSeparator),
          [OpcodesBch2023.OP_CHECKSIG]: conditionallyEvaluate(
            opCheckSigBch2023({ secp256k1, sha256 }),
          ),
          [OpcodesBch2023.OP_CHECKSIGVERIFY]: conditionallyEvaluate(
            opCheckSigVerifyBch2023({ secp256k1, sha256 }),
          ),
          [OpcodesBch2023.OP_CHECKMULTISIG]: conditionallyEvaluate(
            opCheckMultiSigBch2023({ secp256k1, sha256 }),
          ),
          [OpcodesBch2023.OP_CHECKMULTISIGVERIFY]: conditionallyEvaluate(
            opCheckMultiSigVerifyBch2023({ secp256k1, sha256 }),
          ),
          ...(standard
            ? {
                [OpcodesBch2023.OP_NOP1]:
                  conditionallyEvaluate(opNopDisallowed),
                [OpcodesBch2023.OP_CHECKLOCKTIMEVERIFY]: conditionallyEvaluate(
                  opCheckLockTimeVerify,
                ),
                [OpcodesBch2023.OP_CHECKSEQUENCEVERIFY]: conditionallyEvaluate(
                  opCheckSequenceVerify,
                ),
                [OpcodesBch2023.OP_NOP4]:
                  conditionallyEvaluate(opNopDisallowed),
                [OpcodesBch2023.OP_NOP5]:
                  conditionallyEvaluate(opNopDisallowed),
                [OpcodesBch2023.OP_NOP6]:
                  conditionallyEvaluate(opNopDisallowed),
                [OpcodesBch2023.OP_NOP7]:
                  conditionallyEvaluate(opNopDisallowed),
                [OpcodesBch2023.OP_NOP8]:
                  conditionallyEvaluate(opNopDisallowed),
                [OpcodesBch2023.OP_NOP9]:
                  conditionallyEvaluate(opNopDisallowed),
                [OpcodesBch2023.OP_NOP10]:
                  conditionallyEvaluate(opNopDisallowed),
              }
            : {
                [OpcodesBch2023.OP_NOP1]: conditionallyEvaluate(opNop),
                [OpcodesBch2023.OP_CHECKLOCKTIMEVERIFY]: conditionallyEvaluate(
                  opCheckLockTimeVerify,
                ),
                [OpcodesBch2023.OP_CHECKSEQUENCEVERIFY]: conditionallyEvaluate(
                  opCheckSequenceVerify,
                ),
                [OpcodesBch2023.OP_NOP4]: conditionallyEvaluate(opNop),
                [OpcodesBch2023.OP_NOP5]: conditionallyEvaluate(opNop),
                [OpcodesBch2023.OP_NOP6]: conditionallyEvaluate(opNop),
                [OpcodesBch2023.OP_NOP7]: conditionallyEvaluate(opNop),
                [OpcodesBch2023.OP_NOP8]: conditionallyEvaluate(opNop),
                [OpcodesBch2023.OP_NOP9]: conditionallyEvaluate(opNop),
                [OpcodesBch2023.OP_NOP10]: conditionallyEvaluate(opNop),
              }),
          [OpcodesBch2023.OP_CHECKDATASIG]: conditionallyEvaluate(
            opCheckDataSig({ secp256k1, sha256 }),
          ),
          [OpcodesBch2023.OP_CHECKDATASIGVERIFY]: conditionallyEvaluate(
            opCheckDataSigVerify({ secp256k1, sha256 }),
          ),
          [OpcodesBch2023.OP_REVERSEBYTES]:
            conditionallyEvaluate(opReverseBytes),
          [OpcodesBch2023.OP_INPUTINDEX]: conditionallyEvaluate(opInputIndex),
          [OpcodesBch2023.OP_ACTIVEBYTECODE]:
            conditionallyEvaluate(opActiveBytecode),
          [OpcodesBch2023.OP_TXVERSION]: conditionallyEvaluate(opTxVersion),
          [OpcodesBch2023.OP_TXINPUTCOUNT]:
            conditionallyEvaluate(opTxInputCount),
          [OpcodesBch2023.OP_TXOUTPUTCOUNT]:
            conditionallyEvaluate(opTxOutputCount),
          [OpcodesBch2023.OP_TXLOCKTIME]: conditionallyEvaluate(opTxLocktime),
          [OpcodesBch2023.OP_UTXOVALUE]: conditionallyEvaluate(opUtxoValue),
          [OpcodesBch2023.OP_UTXOBYTECODE]:
            conditionallyEvaluate(opUtxoBytecode),
          [OpcodesBch2023.OP_OUTPOINTTXHASH]:
            conditionallyEvaluate(opOutpointTxHash),
          [OpcodesBch2023.OP_OUTPOINTINDEX]:
            conditionallyEvaluate(opOutpointIndex),
          [OpcodesBch2023.OP_INPUTBYTECODE]:
            conditionallyEvaluate(opInputBytecode),
          [OpcodesBch2023.OP_INPUTSEQUENCENUMBER]: conditionallyEvaluate(
            opInputSequenceNumber,
          ),
          [OpcodesBch2023.OP_OUTPUTVALUE]: conditionallyEvaluate(opOutputValue),
          [OpcodesBch2023.OP_OUTPUTBYTECODE]:
            conditionallyEvaluate(opOutputBytecode),
          [OpcodesBch2023.OP_UTXOTOKENCATEGORY]:
            conditionallyEvaluate(opUtxoTokenCategory),
          [OpcodesBch2023.OP_UTXOTOKENCOMMITMENT]: conditionallyEvaluate(
            opUtxoTokenCommitment,
          ),
          [OpcodesBch2023.OP_UTXOTOKENAMOUNT]:
            conditionallyEvaluate(opUtxoTokenAmount),
          [OpcodesBch2023.OP_OUTPUTTOKENCATEGORY]: conditionallyEvaluate(
            opOutputTokenCategory,
          ),
          [OpcodesBch2023.OP_OUTPUTTOKENCOMMITMENT]: conditionallyEvaluate(
            opOutputTokenCommitment,
          ),
          [OpcodesBch2023.OP_OUTPUTTOKENAMOUNT]:
            conditionallyEvaluate(opOutputTokenAmount),
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
    verify: (
      { sourceOutputs, transaction },
      { evaluate, success, initialize },
    ) => {
      if (transaction.inputs.length === 0) {
        return 'Transactions must have at least one input.';
      }
      if (transaction.outputs.length === 0) {
        return 'Transactions must have at least one output.';
      }
      if (transaction.inputs.length !== sourceOutputs.length) {
        return 'Unable to verify transaction: a single spent output must be provided for each transaction input.';
      }

      const transactionLengthBytes = encodeTransactionBch(transaction).length;
      if (
        transactionLengthBytes < ConsensusBch2023.minimumTransactionLengthBytes
      ) {
        return `Invalid transaction byte length: the transaction is ${transactionLengthBytes} bytes, but transactions must be no smaller than ${ConsensusBch2023.minimumTransactionLengthBytes} bytes to prevent an exploit of the transaction Merkle tree design.`;
      }
      if (
        transactionLengthBytes > ConsensusBch2023.maximumTransactionLengthBytes
      ) {
        return `Transaction exceeds maximum byte length: the transaction is ${transactionLengthBytes} bytes, but the maximum transaction size is ${ConsensusBch2023.maximumTransactionLengthBytes} bytes.`;
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
        return `Unable to verify transaction: the transaction attempts to spend the same outpoint in multiple inputs. ${firstDuplicate}.`;
      }
      if (
        transaction.version < ConsensusBch2023.minimumConsensusVersion ||
        transaction.version > ConsensusBch2023.maximumConsensusVersion
      ) {
        return `Transaction version must be either 1 or 2. Encoded version number: ${transaction.version}.`;
      }
      if (standard) {
        if (
          transactionLengthBytes >
          ConsensusBch2023.maximumStandardTransactionSize
        ) {
          return `Transaction exceeds maximum standard size: this transaction is ${transactionLengthBytes} bytes, but the maximum standard transaction size is ${ConsensusBch2023.maximumStandardTransactionSize} bytes.`;
        }

        // eslint-disable-next-line functional/no-loop-statements
        for (const [index, output] of sourceOutputs.entries()) {
          if (!isStandardOutputBytecode(output.lockingBytecode)) {
            return `Standard transactions may only spend standard output types, but source output ${index} is non-standard: locking bytecode does not match a standard pattern: P2PKH, P2PK, P2SH, P2MS, or arbitrary data (OP_RETURN).`;
          }
        }

        // eslint-disable-next-line functional/no-let
        let totalArbitraryDataBytes = 0;
        // eslint-disable-next-line functional/no-loop-statements
        for (const [index, output] of transaction.outputs.entries()) {
          if (!isStandardOutputBytecode(output.lockingBytecode)) {
            return `Standard transactions may only create standard output types, but transaction output ${index} is non-standard: locking bytecode does not match a standard pattern: P2PKH, P2PK, P2SH, P2MS, or arbitrary data (OP_RETURN).`;
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
          totalArbitraryDataBytes > ConsensusBch2023.maximumDataCarrierBytes
        ) {
          return `Standard transactions may carry no more than ${ConsensusBch2023.maximumDataCarrierBytes} bytes in arbitrary data outputs; this transaction includes ${totalArbitraryDataBytes} bytes of arbitrary data.`;
        }

        // eslint-disable-next-line functional/no-loop-statements
        for (const [index, input] of transaction.inputs.entries()) {
          if (
            input.unlockingBytecode.length >
            ConsensusBch2023.maximumStandardUnlockingBytecodeLength
          ) {
            return `Input index ${index} is non-standard: the unlocking bytecode (${input.unlockingBytecode.length} bytes) exceeds the maximum standard unlocking bytecode length (${ConsensusBch2023.maximumStandardUnlockingBytecodeLength} bytes).`;
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

      const initialState: Partial<AuthenticationProgramState> = initialize();
      // eslint-disable-next-line functional/no-let
      let stateOverride = {
        metrics: initialState.metrics,
      } as Partial<AuthenticationProgramState>;
      // eslint-disable-next-line functional/no-loop-statements
      for (const index of transaction.inputs.keys()) {
        const state = evaluate(
          { inputIndex: index, sourceOutputs, transaction },
          stateOverride,
        );
        const result = success(state);
        if (typeof result === 'string') {
          return `Error in evaluating input index ${index}: ${result}`;
        }
        // eslint-disable-next-line functional/no-expression-statements
        stateOverride = {
          metrics: state.metrics,
        } as Partial<AuthenticationProgramState>;
      }
      return true;
    },
  };
};

export const createInstructionSetBch = createInstructionSetBch2023;
