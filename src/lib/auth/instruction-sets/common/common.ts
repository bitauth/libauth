/* istanbul ignore file */ // TODO: stabilize & test

import {
  CommonProgramInternalState,
  CommonState,
  ErrorState
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
import { cryptoOperations, Ripemd160, Secp256k1, Sha256 } from './crypto';
import {
  conditionalFlowControlOperations,
  unconditionalFlowControlOperations
} from './flow-control';
import { pushNumberOperations, pushOperations } from './push';
import { stackOperations } from './stack';
import { timeOperations } from './time';

export * from './push';
export * from '../../state';
export * from './stack';
export * from './types';
export * from './encoding';
export * from './signing-serialization';

export { Ripemd160, Sha256, Secp256k1 };

export enum CommonAuthenticationError {
  calledReturn = 'Script called an OP_RETURN operation.',
  emptyStack = 'Tried to read from an empty stack.',
  malformedPush = 'Script must be long enough to push the requested number of bytes.',
  nonMinimalPush = 'Push operations must use the smallest possible encoding.',
  exceedsMaximumPush = 'Push exceeds the push size limit of 520 bytes.',
  failedVerify = 'Script failed an OP_VERIFY operation.',
  invalidPublicKeyEncoding = 'Encountered an improperly encoded public key.',
  invalidSignatureEncoding = 'Encountered an improperly encoded signature.',
  invalidNaturalNumber = 'Invalid input: this parameter requires a natural number.',
  insufficientPublicKeys = 'An OP_CHECKMULTISIG operation requires signatures from more public keys than are provided.',
  invalidProtocolBugValue = 'The protocol bug value must be a Script Number 0.',
  exceededMaximumOperationCount = 'Script exceeded the maximum operation count (201 operations).',
  exceedsMaximumMultisigPublicKeyCount = 'Script called an OP_CHECKMULTISIG which exceeds the maximum public key count (20 public keys).',
  unexpectedEndIf = 'Encountered an OP_ENDIF which is not following a matching OP_IF.',
  unexpectedElse = 'Encountered an OP_ELSE outside of an OP_IF ... OP_ENDIF block.',
  unknownOpcode = 'Called an unknown opcode.'
}

export enum CommonConsensus {
  maximumOperationCount = 201
}

export const applyError = <State extends ErrorState<Errors>, Errors>(
  error: CommonAuthenticationError | Errors,
  state: State
): State => ({
  ...state,
  error
});

export const undefinedOperation = <
  State extends ErrorState<Errors>,
  Errors
>() => ({
  undefined: (state: State) =>
    applyError<State, Errors>(CommonAuthenticationError.unknownOpcode, state)
});

export const commonOperations = <
  Opcodes,
  State extends CommonState<Opcodes, Errors>,
  Errors
>(
  sha256: Sha256,
  ripemd160: Ripemd160,
  secp256k1: Secp256k1
): { readonly [opcodes: number]: Operation<State> } => ({
  ...mapOverOperations<State>(
    {
      ...pushOperations<Opcodes, State>(),
      ...pushNumberOperations<Opcodes, State>(),
      ...mapOverOperations<State>(
        {
          ...arithmeticOperations<Opcodes, State, Errors>(),
          ...bitwiseOperations<Opcodes, State, Errors>(),
          ...cryptoOperations<Opcodes, State, Errors>(
            sha256,
            ripemd160,
            secp256k1
          ),
          ...conditionalFlowControlOperations<Opcodes, State, Errors>(),
          ...stackOperations<State, Errors>(),
          ...timeOperations<Opcodes, State, Errors>()
        },
        incrementOperationCount
      )
    },
    conditionallyEvaluate
  ),
  ...unconditionalFlowControlOperations<Opcodes, State, Errors>()
});

export const cloneStack = (stack: ReadonlyArray<Readonly<Uint8Array>>) =>
  // tslint:disable-next-line:readonly-array
  stack.reduce<Uint8Array[]>((newStack, element) => {
    // tslint:disable-next-line:no-expression-statement
    newStack.push(element.slice());
    return newStack;
  }, []);

/**
 * TODO: describe
 */
export const createCommonInternalProgramState = <Opcodes, Errors>(
  instructions: ReadonlyArray<AuthenticationInstruction<Opcodes>>,
  stack: Uint8Array[] = [] // tslint:disable-line:readonly-array
): CommonProgramInternalState<Opcodes, Errors> => ({
  alternateStack: [], // tslint:disable-line:readonly-array
  executionStack: [], // tslint:disable-line:readonly-array
  instructions,
  ip: 0,
  lastCodeSeparator: -1,
  operationCount: 0,
  signatureOperationsCount: 0,
  stack
});

const enum Fill {
  length = 32,
  correspondingOutputHash = 1,
  outpointTransactionHash = 2,
  transactionOutpointsHash = 3,
  transactionOutputsHash = 4,
  transactionSequenceNumbersHash = 5
}
/**
 * This is a meaningless but complete `CommonExternalProgramState`, useful for
 * testing and debugging.
 */
export const createEmptyCommonExternalProgramState = () => ({
  correspondingOutputHash: new Uint8Array(Fill.length).fill(
    Fill.correspondingOutputHash
  ),
  locktime: 0,
  outpointIndex: 0,
  outpointTransactionHash: new Uint8Array(Fill.length).fill(
    Fill.outpointTransactionHash
  ),
  outputValue: BigInt(0),
  sequenceNumber: 0,
  transactionOutpointsHash: new Uint8Array(Fill.length).fill(
    Fill.transactionOutpointsHash
  ),
  transactionOutputsHash: new Uint8Array(Fill.length).fill(
    Fill.transactionOutputsHash
  ),
  transactionSequenceNumbersHash: new Uint8Array(Fill.length).fill(
    Fill.transactionSequenceNumbersHash
  ),
  version: 0
});

/**
 * Create an "empty" CommonProgramState, suitable for testing a VM against short scripts
 *
 * TODO: describe
 */
export const createEmptyCommonProgramState = <Opcodes, Errors>(
  instructions: ReadonlyArray<AuthenticationInstruction<Opcodes>>,
  stack: Uint8Array[] = [] // tslint:disable-line:readonly-array
): CommonState<Opcodes, Errors> => ({
  ...createCommonInternalProgramState(instructions, stack),
  ...createEmptyCommonExternalProgramState()
});
