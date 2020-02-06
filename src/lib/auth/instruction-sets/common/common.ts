import {
  serializeOutpoints,
  serializeOutput,
  serializeOutputsForSigning,
  serializeSequenceNumbers
} from '../../../transaction';
import {
  AlternateStackState,
  AuthenticationProgramCommon,
  AuthenticationProgramExternalStateCommon,
  AuthenticationProgramInternalStateCommon,
  AuthenticationProgramStateCommon,
  ErrorState,
  ExecutionStackState,
  StackState
} from '../../state';
import { Operation } from '../../virtual-machine';
import { AuthenticationInstruction } from '../instruction-sets';

import { arithmeticOperations } from './arithmetic';
import { bitwiseOperations } from './bitwise';
import {
  conditionallyEvaluate,
  incrementOperationCount,
  mapOverOperations
} from './combinators';
import { cryptoOperations, Ripemd160, Secp256k1, Sha1, Sha256 } from './crypto';
import { applyError, AuthenticationErrorCommon } from './errors';
import {
  conditionalFlowControlOperations,
  reservedOperation,
  unconditionalFlowControlOperations
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
  maximumStackDepth = 1000
}

export const undefinedOperation = <
  State extends ExecutionStackState & ErrorState<Errors>,
  Errors
>() => ({
  undefined: conditionallyEvaluate((state: State) =>
    applyError<State, Errors>(AuthenticationErrorCommon.unknownOpcode, state)
  )
});

export const checkLimitsCommon = <
  State extends ErrorState<Errors> &
    StackState &
    AlternateStackState & { operationCount: number },
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
>(
  sha1: Sha1,
  sha256: Sha256,
  ripemd160: Ripemd160,
  secp256k1: Secp256k1,
  flags: {
    disallowUpgradableNops: boolean;
    requireBugValueZero: boolean;
    requireMinimalEncoding: boolean;
    requireNullSignatureFailures: boolean;
  }
): { readonly [opcodes: number]: Operation<State> } => {
  const unconditionalOperations = {
    ...disabledOperations<State, Errors>(),
    ...pushOperations<Opcodes, State, Errors>(flags),
    ...mapOverOperations<State>(
      unconditionalFlowControlOperations<Opcodes, State, Errors>(flags),
      incrementOperationCount
    )
  };
  const conditionalOperations = mapOverOperations<State>(
    {
      ...pushNumberOperations<Opcodes, State>(),
      [OpcodesCommon.OP_RESERVED]: reservedOperation<State, Errors>()
    },
    conditionallyEvaluate
  );
  const incrementingOperations = mapOverOperations<State>(
    {
      ...arithmeticOperations<Opcodes, State, Errors>(flags),
      ...bitwiseOperations<Opcodes, State, Errors>(),
      ...cryptoOperations<Opcodes, State, Errors>(
        sha1,
        sha256,
        ripemd160,
        secp256k1,
        flags
      ),
      ...conditionalFlowControlOperations<Opcodes, State, Errors>(),
      ...stackOperations<State, Errors>(flags),
      ...spliceOperations<State, Errors>(),
      ...timeOperations<Opcodes, State, Errors>(flags),
      ...nonOperations<State>(flags)
    },
    conditionallyEvaluate,
    incrementOperationCount
  );

  return mapOverOperations<State>(
    {
      ...unconditionalOperations,
      ...incrementingOperations,
      ...conditionalOperations
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

export const createAuthenticationProgramInternalStateCommon = <Opcodes, Errors>(
  instructions: readonly AuthenticationInstruction<Opcodes>[],
  stack: Uint8Array[] = []
): AuthenticationProgramInternalStateCommon<Opcodes, Errors> => ({
  alternateStack: [],
  executionStack: [],
  instructions,
  ip: 0,
  lastCodeSeparator: -1,
  operationCount: 0,
  signatureOperationsCount: 0,
  stack
});

const enum Fill {
  length = 32,
  correspondingOutput = 1,
  transactionOutpoints = 2,
  transactionOutputs = 3,
  transactionSequenceNumbers = 4,
  outpointTransactionHash = 5
}

export const createAuthenticationProgramExternalStateCommon = (
  program: AuthenticationProgramCommon
): AuthenticationProgramExternalStateCommon => ({
  correspondingOutput:
    program.inputIndex < program.spendingTransaction.outputs.length
      ? serializeOutput(program.spendingTransaction.outputs[program.inputIndex])
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
  transactionOutpoints: serializeOutpoints(program.spendingTransaction.inputs),
  transactionOutputs: serializeOutputsForSigning(
    program.spendingTransaction.outputs
  ),
  transactionSequenceNumbers: serializeSequenceNumbers(
    program.spendingTransaction.inputs
  ),
  version: program.spendingTransaction.version
});

export const createAuthenticationProgramStateCommon = <Opcodes, Errors>(
  instructions: readonly AuthenticationInstruction<Opcodes>[],
  stack: Uint8Array[],
  externalState: AuthenticationProgramExternalStateCommon
): AuthenticationProgramStateCommon<Opcodes, Errors> => ({
  ...createAuthenticationProgramInternalStateCommon<Opcodes, Errors>(
    instructions,
    stack
  ),
  ...externalState
});

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
  stack: state.stack.slice(),
  transactionOutpoints: state.transactionOutpoints,
  transactionOutputs: state.transactionOutputs,
  transactionSequenceNumbers: state.transactionSequenceNumbers,
  version: state.version
});

/**
 * This is a meaningless but complete `CommonExternalProgramState`, useful for
 * testing and debugging.
 */
export const createAuthenticationProgramExternalStateCommonEmpty = () => ({
  correspondingOutput: Uint8Array.of(Fill.correspondingOutput),
  locktime: 0,
  outpointIndex: 0,
  outpointTransactionHash: new Uint8Array(Fill.length).fill(
    Fill.outpointTransactionHash
  ),
  outputValue: BigInt(0),
  sequenceNumber: 0,
  transactionOutpoints: Uint8Array.of(Fill.transactionOutpoints),
  transactionOutputs: Uint8Array.of(Fill.transactionOutputs),
  transactionSequenceNumbers: Uint8Array.of(Fill.transactionSequenceNumbers),
  version: 0
});

/**
 * Create an "empty" CommonProgramState, suitable for testing a VM/compiler.
 */
export const createAuthenticationProgramStateCommonEmpty = <Opcodes, Errors>(
  instructions: readonly AuthenticationInstruction<Opcodes>[],
  stack: Uint8Array[] = []
): AuthenticationProgramStateCommon<Opcodes, Errors> => ({
  ...createAuthenticationProgramInternalStateCommon(instructions, stack),
  ...createAuthenticationProgramExternalStateCommonEmpty()
});
