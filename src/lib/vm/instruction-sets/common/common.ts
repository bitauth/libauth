import {
  encodeOutpoints,
  encodeOutput,
  encodeOutputsForSigning,
  encodeSequenceNumbersForSigning,
} from '../../../transaction/transaction-serialization';
import { TransactionContextCommon } from '../../../transaction/transaction-types';
import { Operation } from '../../virtual-machine';
import {
  AuthenticationProgramStateAlternateStack,
  AuthenticationProgramStateCommon,
  AuthenticationProgramStateError,
  AuthenticationProgramStateExecutionStack,
  AuthenticationProgramStateInternalCommon,
  AuthenticationProgramStateStack,
  AuthenticationProgramTransactionContextCommon,
} from '../../vm-types';
import { AuthenticationInstruction } from '../instruction-sets-types';

import { arithmeticOperations } from './arithmetic';
import { bitwiseOperations } from './bitwise';
import {
  conditionallyEvaluate,
  incrementOperationCount,
  mapOverOperations,
} from './combinators';
import { cryptoOperations, Ripemd160, Secp256k1, Sha1, Sha256 } from './crypto';
import { applyError, AuthenticationErrorCommon } from './errors';
import {
  conditionalFlowControlOperations,
  reservedOperation,
  unconditionalFlowControlOperations,
} from './flow-control';
import { disabledOperations, nonOperations } from './nop';
import { OpcodesCommon } from './opcodes';
import { pushNumberOperations, pushOperations } from './push';
import { spliceOperations } from './splice';
import { stackOperations } from './stack';
import { timeOperations } from './time';

export * from './arithmetic';
export * from './bitwise';
export * from './combinators';
export * from './crypto';
export * from './descriptions';
export * from './encoding';
export * from './errors';
export * from './flow-control';
export * from './nop';
export * from './opcodes';
export * from './push';
export * from './signing-serialization';
export * from './splice';
export * from './stack';
export * from './time';
export * from './types';

export enum ConsensusCommon {
  /**
   * A.K.A. `MAX_SCRIPT_ELEMENT_SIZE`
   */
  maximumStackItemLength = 520,
  maximumScriptNumberLength = 4,
  /**
   * A.K.A. `MAX_OPS_PER_SCRIPT`
   */
  maximumOperationCount = 201,
  /**
   * A.K.A. `MAX_SCRIPT_SIZE`
   */
  maximumBytecodeLength = 10000,
  /**
   * A.K.A. `MAX_STACK_SIZE`
   */
  maximumStackDepth = 1000,
}

export const undefinedOperation = <
  State extends AuthenticationProgramStateExecutionStack &
    AuthenticationProgramStateError<Errors>,
  Errors
>() => ({
  undefined: conditionallyEvaluate((state: State) =>
    applyError<State, Errors>(AuthenticationErrorCommon.unknownOpcode, state)
  ),
});

export const checkLimitsCommon = <
  State extends AuthenticationProgramStateError<Errors> &
    AuthenticationProgramStateStack &
    AuthenticationProgramStateAlternateStack & { operationCount: number },
  Errors
>(
  operation: Operation<State>
): Operation<State> => (state: State) => {
  const nextState = operation(state);
  return nextState.stack.length + nextState.alternateStack.length >
    ConsensusCommon.maximumStackDepth
    ? applyError<State, Errors>(
        AuthenticationErrorCommon.exceededMaximumStackDepth,
        nextState
      )
    : nextState.operationCount > ConsensusCommon.maximumOperationCount
    ? applyError<State, Errors>(
        AuthenticationErrorCommon.exceededMaximumOperationCount,
        nextState
      )
    : nextState;
};

export const commonOperations = <
  Opcodes,
  State extends AuthenticationProgramStateCommon<Opcodes, Errors>,
  Errors
>({
  flags,
  ripemd160,
  secp256k1,
  sha1,
  sha256,
}: {
  sha1: { hash: Sha1['hash'] };
  sha256: { hash: Sha256['hash'] };
  ripemd160: { hash: Ripemd160['hash'] };
  secp256k1: {
    verifySignatureSchnorr: Secp256k1['verifySignatureSchnorr'];
    verifySignatureDERLowS: Secp256k1['verifySignatureDERLowS'];
  };
  flags: {
    disallowUpgradableNops: boolean;
    requireBugValueZero: boolean;
    requireMinimalEncoding: boolean;
    requireNullSignatureFailures: boolean;
  };
}): { readonly [opcodes: number]: Operation<State> } => {
  const unconditionalOperations = {
    ...disabledOperations<State, Errors>(),
    ...pushOperations<Opcodes, State, Errors>(flags),
    ...mapOverOperations<State>(
      unconditionalFlowControlOperations<Opcodes, State, Errors>(flags),
      incrementOperationCount
    ),
  };
  const conditionalOperations = mapOverOperations<State>(
    {
      ...pushNumberOperations<Opcodes, State>(),
      [OpcodesCommon.OP_RESERVED]: reservedOperation<State, Errors>(),
    },
    conditionallyEvaluate
  );
  const incrementingOperations = mapOverOperations<State>(
    {
      ...arithmeticOperations<Opcodes, State, Errors>(flags),
      ...bitwiseOperations<Opcodes, State, Errors>(),
      ...cryptoOperations<Opcodes, State, Errors>({
        flags,
        ripemd160,
        secp256k1,
        sha1,
        sha256,
      }),
      ...conditionalFlowControlOperations<Opcodes, State, Errors>(),
      ...stackOperations<State, Errors>(flags),
      ...spliceOperations<State, Errors>(),
      ...timeOperations<Opcodes, State, Errors>(flags),
      ...nonOperations<State>(flags),
    },
    conditionallyEvaluate,
    incrementOperationCount
  );

  return mapOverOperations<State>(
    {
      ...unconditionalOperations,
      ...incrementingOperations,
      ...conditionalOperations,
    },
    checkLimitsCommon
  );
};

export const cloneStack = (stack: readonly Readonly<Uint8Array>[]) =>
  stack.reduce<Uint8Array[]>((newStack, element) => {
    // eslint-disable-next-line functional/no-expression-statement, functional/immutable-data
    newStack.push(element.slice());
    return newStack;
  }, []);

export const createAuthenticationProgramInternalStateCommon = <
  Opcodes,
  Errors
>({
  instructions,
  stack = [],
}: {
  instructions: readonly AuthenticationInstruction<Opcodes>[];
  stack?: Uint8Array[];
}): AuthenticationProgramStateInternalCommon<Opcodes, Errors> => ({
  alternateStack: [],
  executionStack: [],
  instructions,
  ip: 0,
  lastCodeSeparator: -1,
  operationCount: 0,
  signatureOperationsCount: 0,
  signedMessages: [],
  stack,
});

export const createTransactionContextCommon = (
  program: AuthenticationProgramTransactionContextCommon
): TransactionContextCommon => ({
  correspondingOutput:
    program.inputIndex < program.spendingTransaction.outputs.length
      ? encodeOutput(program.spendingTransaction.outputs[program.inputIndex])
      : undefined,
  locktime: program.spendingTransaction.locktime,
  outpointIndex:
    program.spendingTransaction.inputs[program.inputIndex].outpointIndex,
  outpointTransactionHash:
    program.spendingTransaction.inputs[program.inputIndex]
      .outpointTransactionHash,
  outputValue: program.sourceOutput.satoshis,
  sequenceNumber:
    program.spendingTransaction.inputs[program.inputIndex].sequenceNumber,
  transactionOutpoints: encodeOutpoints(program.spendingTransaction.inputs),
  transactionOutputs: encodeOutputsForSigning(
    program.spendingTransaction.outputs
  ),
  transactionSequenceNumbers: encodeSequenceNumbersForSigning(
    program.spendingTransaction.inputs
  ),
  version: program.spendingTransaction.version,
});

export const createAuthenticationProgramStateCommon = <Opcodes, Errors>({
  transactionContext,
  instructions,
  stack,
}: {
  transactionContext: TransactionContextCommon;
  instructions: readonly AuthenticationInstruction<Opcodes>[];
  stack: Uint8Array[];
}): AuthenticationProgramStateCommon<Opcodes, Errors> => ({
  ...createAuthenticationProgramInternalStateCommon<Opcodes, Errors>({
    instructions,
    stack,
  }),
  ...transactionContext,
});

/**
 * Note: this implementation does not safely clone elements within array
 * properties. Mutating values within arrays will mutate those values in cloned
 * program states.
 */
export const cloneAuthenticationProgramStateCommon = <
  Opcodes,
  State extends AuthenticationProgramStateCommon<Opcodes, Errors>,
  Errors
>(
  state: State
) => ({
  ...(state.error === undefined ? {} : { error: state.error }),
  alternateStack: state.alternateStack.slice(),
  correspondingOutput: state.correspondingOutput,
  executionStack: state.executionStack.slice(),
  instructions: state.instructions.slice(),
  ip: state.ip,
  lastCodeSeparator: state.lastCodeSeparator,
  locktime: state.locktime,
  operationCount: state.operationCount,
  outpointIndex: state.outpointIndex,
  outpointTransactionHash: state.outpointTransactionHash.slice(),
  outputValue: state.outputValue,
  sequenceNumber: state.sequenceNumber,
  signatureOperationsCount: state.signatureOperationsCount,
  signedMessages: state.signedMessages.slice(),
  stack: state.stack.slice(),
  transactionOutpoints: state.transactionOutpoints,
  transactionOutputs: state.transactionOutputs,
  transactionSequenceNumbers: state.transactionSequenceNumbers,
  version: state.version,
});

const sha256HashLength = 32;
const outputValueLength = 8;

/**
 * This is a meaningless but complete `TransactionContextCommon` which uses `0`
 * values for each property.
 */
export const createTransactionContextCommonEmpty = () => ({
  correspondingOutput: Uint8Array.of(0),
  locktime: 0,
  outpointIndex: 0,
  outpointTransactionHash: new Uint8Array(sha256HashLength),
  outputValue: new Uint8Array(outputValueLength),
  sequenceNumber: 0,
  transactionOutpoints: Uint8Array.of(0),
  transactionOutputs: Uint8Array.of(0),
  transactionSequenceNumbers: Uint8Array.of(0),
  version: 0,
});

const correspondingOutput = 1;
const transactionOutpoints = 2;
const transactionOutputs = 3;
const transactionSequenceNumbers = 4;
const outpointTransactionHashFill = 5;

/**
 * This is a meaningless but complete `TransactionContextCommon` which uses a
 * different value for each property. This is useful for testing and debugging.
 */
export const createTransactionContextCommonTesting = () => ({
  correspondingOutput: Uint8Array.of(correspondingOutput),
  locktime: 0,
  outpointIndex: 0,
  outpointTransactionHash: new Uint8Array(sha256HashLength).fill(
    outpointTransactionHashFill
  ),
  outputValue: new Uint8Array(outputValueLength),
  sequenceNumber: 0,
  transactionOutpoints: Uint8Array.of(transactionOutpoints),
  transactionOutputs: Uint8Array.of(transactionOutputs),
  transactionSequenceNumbers: Uint8Array.of(transactionSequenceNumbers),
  version: 0,
});

/**
 * Create an "empty" common authentication program state, suitable for testing a
 * VM/compiler.
 */
export const createAuthenticationProgramStateCommonEmpty = <Opcodes, Errors>({
  instructions,
  stack = [],
}: {
  instructions: readonly AuthenticationInstruction<Opcodes>[];
  stack?: Uint8Array[];
}): AuthenticationProgramStateCommon<Opcodes, Errors> => ({
  ...createAuthenticationProgramInternalStateCommon({ instructions, stack }),
  ...createTransactionContextCommonEmpty(),
});
