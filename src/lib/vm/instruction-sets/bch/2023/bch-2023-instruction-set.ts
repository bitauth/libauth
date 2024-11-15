/* eslint-disable max-lines */
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
import { binToHex, formatError } from '../../../../format/format.js';
import type {
  AuthenticationInstructionMalformed,
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
  createOp0NotEqual,
  createOp1Add,
  createOp1Sub,
  createOpAbs,
  createOpActiveBytecode,
  createOpAdd,
  createOpBin2Num,
  createOpBoolAnd,
  createOpBoolOr,
  createOpCat,
  createOpDiv,
  createOpGreaterThan,
  createOpGreaterThanOrEqual,
  createOpInputBytecode,
  createOpLessThan,
  createOpLessThanOrEqual,
  createOpMax,
  createOpMin,
  createOpMod,
  createOpMul,
  createOpNegate,
  createOpNot,
  createOpNum2Bin,
  createOpNumEqual,
  createOpNumEqualVerify,
  createOpNumNotEqual,
  createOpOutputBytecode,
  createOpSub,
  createOpUtxoBytecode,
  createOpWithin,
  decodeAuthenticationInstructions,
  disabledOperation,
  disassembleAuthenticationInstructionMalformed,
  getDustThreshold,
  incrementOperationCount,
  isArbitraryDataOutput,
  isDustOutput,
  isPushOnly,
  isStandardOutputBytecode,
  isStandardUtxoBytecode,
  isWitnessProgram,
  mapOverOperations,
  op2Drop,
  op2Dup,
  op2Over,
  op2Rot,
  op2Swap,
  op3Dup,
  opAnd,
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
  opDrop,
  opDup,
  opElse,
  opEndIf,
  opEqual,
  opEqualVerify,
  opFromAltStack,
  opHash160,
  opHash256,
  opIf,
  opIfDup,
  opInputIndex,
  opInputSequenceNumber,
  opNip,
  opNop,
  opNopDisallowed,
  opNotIf,
  opOr,
  opOutpointIndex,
  opOutpointTxHash,
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
  opSwap,
  opToAltStack,
  opTuck,
  opTxInputCount,
  opTxLocktime,
  opTxOutputCount,
  opTxVersion,
  opUtxoValue,
  opVerify,
  opXor,
  pushNumberOperation,
  pushOperation,
  reservedOperation,
  stackItemIsTruthy,
  undefinedOperation,
} from '../../common/common.js';

import {
  ConsensusBch2023,
  maximumSignatureCheckCount,
} from './bch-2023-consensus.js';
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

const satoshisPerCoin = 100_000_000;
const maxCoins = 21_000_000;
const maxMoney = maxCoins * satoshisPerCoin;

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
  Consensus extends typeof ConsensusBch2023 = typeof ConsensusBch2023,
>(
  standard = true,
  {
    consensus = ConsensusBch2023 as Consensus,
    ripemd160,
    secp256k1,
    sha1,
    sha256,
  }: {
    consensus?: Consensus;
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
  const conditionallyPush =
    pushOperation<AuthenticationProgramState>(consensus);
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
      const initialState = {
        ...(stateInitialize(program) as AuthenticationProgramState),
        ...stateOverride,
        ...{
          instructions: unlockingInstructions,
          program,
          stack: [],
        },
      } as AuthenticationProgramState;

      if (unlockingBytecode.length > consensus.maximumBytecodeLength) {
        return applyError(
          initialState,
          AuthenticationErrorCommon.exceededMaximumBytecodeLengthUnlocking,
          `Maximum bytecode length: ${consensus.maximumBytecodeLength} bytes. Unlocking bytecode length: ${unlockingBytecode.length} bytes.`,
        );
      }
      if (authenticationInstructionsAreMalformed(unlockingInstructions)) {
        return applyError(
          initialState,
          AuthenticationErrorCommon.malformedUnlockingBytecode,
          `Malformed instruction: ${disassembleAuthenticationInstructionMalformed(
            OpcodesBch2023,
            unlockingInstructions[
              unlockingInstructions.length - 1
            ] as AuthenticationInstructionMalformed,
          )}.`,
        );
      }
      if (!isPushOnly(unlockingBytecode)) {
        return applyError(
          initialState,
          AuthenticationErrorCommon.requiresPushOnly,
        );
      }
      if (lockingBytecode.length > consensus.maximumBytecodeLength) {
        return applyError(
          initialState,
          AuthenticationErrorCommon.exceededMaximumBytecodeLengthLocking,
          `Maximum bytecode length: ${consensus.maximumBytecodeLength} bytes. Locking bytecode length: ${lockingBytecode.length} bytes.`,
        );
      }
      if (authenticationInstructionsAreMalformed(lockingInstructions)) {
        return applyError(
          initialState,
          AuthenticationErrorCommon.malformedLockingBytecode,
          `Malformed instruction: ${disassembleAuthenticationInstructionMalformed(
            OpcodesBch2023,
            lockingInstructions[
              lockingInstructions.length - 1
            ] as AuthenticationInstructionMalformed,
          )}.`,
        );
      }
      const unlockingResult = stateEvaluate(initialState);
      if (unlockingResult.error !== undefined) {
        return unlockingResult;
      }
      if (unlockingResult.controlStack.length !== 0) {
        return applyError(
          unlockingResult,
          AuthenticationErrorCommon.nonEmptyControlStackUnlockingBytecode,
          `Remaining control stack depth: ${unlockingResult.controlStack.length}.`,
        );
      }
      const lockingResult = stateEvaluate({
        ...(stateInitialize(program) as AuthenticationProgramState),
        ...stateOverride,
        ...{
          instructions: lockingInstructions,
          metrics: unlockingResult.metrics,
          program,
          stack: unlockingResult.stack,
        },
      } as AuthenticationProgramState);

      if (lockingResult.controlStack.length !== 0) {
        return applyError(
          lockingResult,
          AuthenticationErrorCommon.nonEmptyControlStackLockingBytecode,
          `Remaining control stack depth: ${lockingResult.controlStack.length}.`,
        );
      }
      const p2sh20 = isPayToScriptHash20(lockingBytecode);
      const p2sh32 = isPayToScriptHash32(lockingBytecode);
      if (!p2sh20 && !p2sh32) {
        if (lockingResult.stack.length !== 1) {
          return applyError(
            lockingResult,
            AuthenticationErrorCommon.requiresCleanStackLockingBytecode,
            `Remaining stack depth: ${lockingResult.stack.length}.`,
          );
        }
        return lockingResult;
      }
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const top = lockingResult.stack[lockingResult.stack.length - 1]!;
      if (!stackItemIsTruthy(top)) {
        return applyError(
          lockingResult,
          AuthenticationErrorCommon.unmatchedP2shRedeemBytecode,
          `Top stack item: "${binToHex(top)}".`,
        );
      }
      const p2shStack = structuredClone(unlockingResult.stack);
      // eslint-disable-next-line functional/immutable-data
      const p2shScript = p2shStack.pop() ?? Uint8Array.of();

      if (p2sh20 && p2shStack.length === 0 && isWitnessProgram(p2shScript)) {
        return lockingResult;
      }

      const p2shInstructions = decodeAuthenticationInstructions(p2shScript);

      const p2shResult = authenticationInstructionsAreMalformed(
        p2shInstructions,
      )
        ? {
            ...lockingResult,
            error: AuthenticationErrorCommon.malformedP2shBytecode,
          }
        : stateEvaluate({
            ...(stateInitialize(program) as AuthenticationProgramState),
            ...stateOverride,
            ...{
              instructions: p2shInstructions,
              metrics: lockingResult.metrics,
              program,
              stack: p2shStack,
            },
          } as AuthenticationProgramState);

      if (p2shResult.controlStack.length !== 0) {
        return applyError(
          p2shResult,
          AuthenticationErrorCommon.nonEmptyControlStackRedeemBytecode,
          `Remaining control stack depth: ${p2shResult.controlStack.length}.`,
        );
      }
      if (p2shResult.stack.length !== 1) {
        return applyError(
          p2shResult,
          AuthenticationErrorCommon.requiresCleanStackRedeemBytecode,
          `Remaining stack depth: ${p2shResult.stack.length}.`,
        );
      }
      return p2shResult;
    },
    every: (state) => {
      const { unlockingBytecode } =
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        state.program.transaction.inputs[state.program.inputIndex]!;
      // eslint-disable-next-line functional/no-expression-statements, functional/immutable-data
      state.metrics.maximumSignatureCheckCount = maximumSignatureCheckCount(
        unlockingBytecode.length,
      );
      if (
        standard &&
        state.metrics.signatureCheckCount >
          state.metrics.maximumSignatureCheckCount
      ) {
        return applyError(
          state,
          AuthenticationErrorCommon.exceededMaximumSignatureCheckCount,
          `Maximum signature check count: ${state.metrics.maximumSignatureCheckCount}; signature check count following operation: ${state.metrics.signatureCheckCount}.`,
        );
      }
      if (
        state.stack.length + state.alternateStack.length >
        consensus.maximumStackDepth
      ) {
        return applyError(
          state,
          AuthenticationErrorCommon.exceededMaximumStackDepth,
          `Maximum stack depth: ${consensus.maximumStackDepth}.`,
        );
      }
      if (state.operationCount > consensus.maximumOperationCount) {
        return applyError(
          state,
          AuthenticationErrorCommon.exceededMaximumOperationCount,
        );
      }
      return state;
    },
    initialize: (program) => {
      const { unlockingBytecode } =
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        program.transaction.inputs[program.inputIndex]!;
      const densityControlLength =
        consensus.densityControlBaseLength + unlockingBytecode.length;
      const maximumIterationsPerByte = standard
        ? consensus.hashDigestIterationsPerByteStandard
        : consensus.hashDigestIterationsPerByteNonstandard;
      return {
        alternateStack: [],
        controlStack: [],
        ip: 0,
        lastCodeSeparator: -1,
        metrics: {
          arithmeticCost: 0,
          densityControlLength,
          evaluatedInstructionCount: 0,
          hashDigestIterations: 0,
          maximumHashDigestIterations: Math.floor(
            maximumIterationsPerByte * densityControlLength,
          ),
          maximumOperationCost: Math.floor(
            densityControlLength * consensus.operationCostBudgetPerByte,
          ),
          maximumSignatureCheckCount: maximumSignatureCheckCount(
            unlockingBytecode.length,
          ),
          operationCost: 0,
          signatureCheckCount: 0,
          stackPushedBytes: 0,
        },
        operationCount: 0,
        signedMessages: [],
      } as Partial<AuthenticationProgramStateBch> as Partial<AuthenticationProgramState>;
    },
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
          [OpcodesBch2023.OP_CAT]: conditionallyEvaluate(
            createOpCat(consensus),
          ),
          [OpcodesBch2023.OP_SPLIT]: conditionallyEvaluate(opSplit),
          [OpcodesBch2023.OP_NUM2BIN]: conditionallyEvaluate(
            createOpNum2Bin(consensus),
          ),
          [OpcodesBch2023.OP_BIN2NUM]: conditionallyEvaluate(
            createOpBin2Num(consensus),
          ),
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
          [OpcodesBch2023.OP_1ADD]: conditionallyEvaluate(
            createOp1Add(consensus),
          ),
          [OpcodesBch2023.OP_1SUB]: conditionallyEvaluate(
            createOp1Sub(consensus),
          ),
          [OpcodesBch2023.OP_2MUL]: disabledOperation,
          [OpcodesBch2023.OP_2DIV]: disabledOperation,
          [OpcodesBch2023.OP_NEGATE]: conditionallyEvaluate(
            createOpNegate(consensus),
          ),
          [OpcodesBch2023.OP_ABS]: conditionallyEvaluate(
            createOpAbs(consensus),
          ),
          [OpcodesBch2023.OP_NOT]: conditionallyEvaluate(
            createOpNot(consensus),
          ),
          [OpcodesBch2023.OP_0NOTEQUAL]: conditionallyEvaluate(
            createOp0NotEqual(consensus),
          ),
          [OpcodesBch2023.OP_ADD]: conditionallyEvaluate(
            createOpAdd(consensus),
          ),
          [OpcodesBch2023.OP_SUB]: conditionallyEvaluate(
            createOpSub(consensus),
          ),
          [OpcodesBch2023.OP_MUL]: conditionallyEvaluate(
            createOpMul(consensus),
          ),
          [OpcodesBch2023.OP_DIV]: conditionallyEvaluate(
            createOpDiv(consensus),
          ),
          [OpcodesBch2023.OP_MOD]: conditionallyEvaluate(
            createOpMod(consensus),
          ),
          [OpcodesBch2023.OP_LSHIFT]: disabledOperation,
          [OpcodesBch2023.OP_RSHIFT]: disabledOperation,
          [OpcodesBch2023.OP_BOOLAND]: conditionallyEvaluate(
            createOpBoolAnd(consensus),
          ),
          [OpcodesBch2023.OP_BOOLOR]: conditionallyEvaluate(
            createOpBoolOr(consensus),
          ),
          [OpcodesBch2023.OP_NUMEQUAL]: conditionallyEvaluate(
            createOpNumEqual(consensus),
          ),
          [OpcodesBch2023.OP_NUMEQUALVERIFY]: conditionallyEvaluate(
            createOpNumEqualVerify(consensus),
          ),
          [OpcodesBch2023.OP_NUMNOTEQUAL]: conditionallyEvaluate(
            createOpNumNotEqual(consensus),
          ),
          [OpcodesBch2023.OP_LESSTHAN]: conditionallyEvaluate(
            createOpLessThan(consensus),
          ),
          [OpcodesBch2023.OP_GREATERTHAN]: conditionallyEvaluate(
            createOpGreaterThan(consensus),
          ),
          [OpcodesBch2023.OP_LESSTHANOREQUAL]: conditionallyEvaluate(
            createOpLessThanOrEqual(consensus),
          ),
          [OpcodesBch2023.OP_GREATERTHANOREQUAL]: conditionallyEvaluate(
            createOpGreaterThanOrEqual(consensus),
          ),
          [OpcodesBch2023.OP_MIN]: conditionallyEvaluate(
            createOpMin(consensus),
          ),
          [OpcodesBch2023.OP_MAX]: conditionallyEvaluate(
            createOpMax(consensus),
          ),
          [OpcodesBch2023.OP_WITHIN]: conditionallyEvaluate(
            createOpWithin(consensus),
          ),
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
            opCheckSig({ secp256k1, sha256 }),
          ),
          [OpcodesBch2023.OP_CHECKSIGVERIFY]: conditionallyEvaluate(
            opCheckSigVerify({ secp256k1, sha256 }),
          ),
          [OpcodesBch2023.OP_CHECKMULTISIG]: conditionallyEvaluate(
            opCheckMultiSig({
              enforceOperationLimit: true,
              secp256k1,
              sha256,
            }),
          ),
          [OpcodesBch2023.OP_CHECKMULTISIGVERIFY]: conditionallyEvaluate(
            opCheckMultiSigVerify({
              enforceOperationLimit: true,
              secp256k1,
              sha256,
            }),
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
          [OpcodesBch2023.OP_ACTIVEBYTECODE]: conditionallyEvaluate(
            createOpActiveBytecode(consensus),
          ),
          [OpcodesBch2023.OP_TXVERSION]: conditionallyEvaluate(opTxVersion),
          [OpcodesBch2023.OP_TXINPUTCOUNT]:
            conditionallyEvaluate(opTxInputCount),
          [OpcodesBch2023.OP_TXOUTPUTCOUNT]:
            conditionallyEvaluate(opTxOutputCount),
          [OpcodesBch2023.OP_TXLOCKTIME]: conditionallyEvaluate(opTxLocktime),
          [OpcodesBch2023.OP_UTXOVALUE]: conditionallyEvaluate(opUtxoValue),
          [OpcodesBch2023.OP_UTXOBYTECODE]: conditionallyEvaluate(
            createOpUtxoBytecode(consensus),
          ),
          [OpcodesBch2023.OP_OUTPOINTTXHASH]:
            conditionallyEvaluate(opOutpointTxHash),
          [OpcodesBch2023.OP_OUTPOINTINDEX]:
            conditionallyEvaluate(opOutpointIndex),
          [OpcodesBch2023.OP_INPUTBYTECODE]: conditionallyEvaluate(
            createOpInputBytecode(consensus),
          ),
          [OpcodesBch2023.OP_INPUTSEQUENCENUMBER]: conditionallyEvaluate(
            opInputSequenceNumber,
          ),
          [OpcodesBch2023.OP_OUTPUTVALUE]: conditionallyEvaluate(opOutputValue),
          [OpcodesBch2023.OP_OUTPUTBYTECODE]: conditionallyEvaluate(
            createOpOutputBytecode(consensus),
          ),
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
    success: (state) => {
      if (state.error !== undefined) {
        return state.error;
      }
      const top = state.stack[state.stack.length - 1];
      if (top === undefined || !stackItemIsTruthy(top)) {
        return formatError(
          AuthenticationErrorCommon.unsuccessfulEvaluation,
          top === undefined
            ? `Stack is empty.`
            : `Top stack item: "${binToHex(top)}".`,
        );
      }
      return true;
    },
    undefined: undefinedOperation,
    // eslint-disable-next-line complexity
    verify: ({ sourceOutputs, transaction }, { evaluate, success }) => {
      if (transaction.inputs.length === 0) {
        return formatError(AuthenticationErrorCommon.verifyFailedNoInputs);
      }
      if (transaction.outputs.length === 0) {
        return formatError(AuthenticationErrorCommon.verifyFailedNoOutputs);
      }
      if (transaction.inputs.length !== sourceOutputs.length) {
        return formatError(
          AuthenticationErrorCommon.verifyFailedMismatchedSourceOutputs,
          `Transaction input count: ${transaction.inputs.length}; source outputs count: ${sourceOutputs.length}.`,
        );
      }

      const transactionLengthBytes = encodeTransactionBch(transaction).length;
      if (transactionLengthBytes < consensus.minimumTransactionLengthBytes) {
        return formatError(
          AuthenticationErrorCommon.verifyFailedInsufficientLength,
          `The transaction is ${transactionLengthBytes} bytes, but transactions must be no smaller than ${consensus.minimumTransactionLengthBytes} bytes to prevent an exploit of the transaction Merkle tree design.`,
        );
      }
      if (transactionLengthBytes > consensus.maximumTransactionLengthBytes) {
        return formatError(
          AuthenticationErrorCommon.verifyFailedExcessiveLength,
          `Transaction exceeds maximum byte length: the transaction is ${transactionLengthBytes} bytes, but the maximum transaction size is ${consensus.maximumTransactionLengthBytes} bytes.`,
        );
      }
      const inputValue = sourceOutputs.reduce(
        (sum, utxo) => sum + utxo.valueSatoshis,
        0n,
      );
      const outputValue = transaction.outputs.reduce(
        (sum, output) => sum + output.valueSatoshis,
        0n,
      );
      if (inputValue > maxMoney) {
        return formatError(
          AuthenticationErrorCommon.verifyFailedInputsExceedMaxMoney,
          `Maximum supply in satoshis: ${maxMoney}, cumulative input value: ${inputValue}.`,
        );
      }
      if (outputValue > maxMoney) {
        return formatError(
          AuthenticationErrorCommon.verifyFailedOutputsExceedMaxMoney,
          `Maximum supply in satoshis: ${maxMoney}, cumulative output value: ${outputValue}.`,
        );
      }
      if (outputValue > inputValue) {
        return formatError(
          AuthenticationErrorCommon.verifyFailedOutputsExceedInputs,
          `Cumulative input value: ${inputValue}, cumulative output value: ${outputValue}.`,
        );
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
        return formatError(
          AuthenticationErrorCommon.verifyFailedDuplicateSourceOutputs,
          firstDuplicate,
        );
      }
      if (
        transaction.version < consensus.minimumConsensusVersion ||
        transaction.version > consensus.maximumConsensusVersion
      ) {
        return formatError(
          AuthenticationErrorCommon.verifyFailedInvalidVersion,
          `Encoded version number: ${transaction.version}.`,
        );
      }
      if (standard) {
        if (transactionLengthBytes > consensus.maximumStandardTransactionSize) {
          return formatError(
            AuthenticationErrorCommon.verifyStandardFailedExcessiveLength,
            `This transaction is ${transactionLengthBytes} bytes, but the maximum standard transaction size is ${consensus.maximumStandardTransactionSize} bytes.`,
          );
        }

        // eslint-disable-next-line functional/no-loop-statements
        for (const [index, output] of sourceOutputs.entries()) {
          if (!isStandardUtxoBytecode(output.lockingBytecode)) {
            return formatError(
              AuthenticationErrorCommon.verifyStandardFailedNonstandardSourceOutput,
              `Source output ${index} is non-standard: locking bytecode does not match a standard pattern: P2PKH, P2PK, P2SH, P2MS, or arbitrary data (OP_RETURN).`,
            );
          }
        }

        // eslint-disable-next-line functional/no-let
        let totalArbitraryDataBytes = 0;
        // eslint-disable-next-line functional/no-loop-statements
        for (const [index, output] of transaction.outputs.entries()) {
          if (!isStandardOutputBytecode(output.lockingBytecode)) {
            return formatError(
              AuthenticationErrorCommon.verifyStandardFailedNonstandardOutput,
              `Transaction output ${index} is non-standard: locking bytecode does not match a standard pattern: P2PKH, P2PK, P2SH, P2MS, or arbitrary data (OP_RETURN).`,
            );
          }
          // eslint-disable-next-line functional/no-conditional-statements
          if (isArbitraryDataOutput(output.lockingBytecode)) {
            // eslint-disable-next-line functional/no-expression-statements
            totalArbitraryDataBytes += output.lockingBytecode.length + 1;
          }
          if (isDustOutput(output)) {
            return formatError(
              AuthenticationErrorCommon.verifyStandardFailedDustOutput,
              ` Transaction output ${index} must have a value of at least ${getDustThreshold(
                output,
              )} satoshis. Current value: ${output.valueSatoshis}`,
            );
          }
        }
        if (totalArbitraryDataBytes > consensus.maximumDataCarrierBytes) {
          return formatError(
            AuthenticationErrorCommon.verifyStandardFailedExcessiveDataCarrierBytes,
            `Standard transactions may carry no more than ${consensus.maximumDataCarrierBytes} bytes in arbitrary data outputs; this transaction includes ${totalArbitraryDataBytes} bytes of arbitrary data.`,
          );
        }

        // eslint-disable-next-line functional/no-loop-statements
        for (const [index, input] of transaction.inputs.entries()) {
          if (
            input.unlockingBytecode.length >
            consensus.maximumStandardUnlockingBytecodeLength
          ) {
            return formatError(
              AuthenticationErrorCommon.verifyStandardFailedExcessiveUnlockingBytecodeLength,
              `The maximum standard unlocking bytecode length is ${consensus.maximumStandardUnlockingBytecodeLength} bytes, but the unlocking bytecode at input index ${index} is ${input.unlockingBytecode.length} bytes.`,
            );
          }
          if (!isPushOnly(input.unlockingBytecode)) {
            return formatError(
              AuthenticationErrorCommon.verifyStandardFailedNonPushUnlockingBytecode,
              `The unlocking bytecode at input index ${index} contains non-push operations.`,
            );
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
      // eslint-disable-next-line functional/no-let
      let cumulativeSigChecks = 0;
      // eslint-disable-next-line functional/no-loop-statements
      for (const inputIndex of transaction.inputs.keys()) {
        const state = evaluate({ inputIndex, sourceOutputs, transaction });
        // eslint-disable-next-line functional/no-expression-statements
        cumulativeSigChecks += state.metrics.signatureCheckCount;
        if (cumulativeSigChecks > consensus.maximumTransactionSignatureChecks) {
          return formatError(
            AuthenticationErrorCommon.verifyFailedExcessiveSigChecks,
            `Transaction exceeded the per-transaction maximum of ${consensus.maximumTransactionSignatureChecks} signature checks while evaluating input index ${inputIndex} of ${transaction.inputs.length}.`,
          );
        }
        const result = success(state);
        if (typeof result === 'string') {
          return `Unable to verify transaction: error in evaluating input index ${inputIndex}: ${result}`;
        }
      }
      return true;
    },
  };
};

export const createInstructionSetBch = createInstructionSetBch2023;
