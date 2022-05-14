import { hexToBin } from '../../../format/format.js';
import type {
  AuthenticationInstruction,
  AuthenticationProgramCommon,
  AuthenticationProgramStateAlternateStack,
  AuthenticationProgramStateCommon,
  AuthenticationProgramStateControlStack,
  AuthenticationProgramStateError,
  AuthenticationProgramStateInternalCommon,
  AuthenticationProgramStateStack,
  Input,
  Operation,
  Output,
  TransactionCommon,
} from '../../../lib';
import {
  cloneTransactionCommon,
  cloneTransactionOutputsCommon,
} from '../../../message/message.js';

import { conditionallyEvaluate } from './combinators.js';
import { ConsensusCommon } from './consensus.js';
import { applyError, AuthenticationErrorCommon } from './errors.js';
import { cloneAuthenticationInstruction } from './instruction-sets-utils.js';

export const undefinedOperation = conditionallyEvaluate(
  <
    State extends AuthenticationProgramStateControlStack &
      AuthenticationProgramStateError
  >(
    state: State
  ) => applyError(state, AuthenticationErrorCommon.unknownOpcode)
);

export const checkLimitsCommon =
  <
    State extends AuthenticationProgramStateAlternateStack &
      AuthenticationProgramStateError &
      AuthenticationProgramStateStack & { operationCount: number }
  >(
    operation: Operation<State>
  ): Operation<State> =>
  (state: State) => {
    const nextState = operation(state);
    return nextState.stack.length + nextState.alternateStack.length >
      ConsensusCommon.maximumStackDepth
      ? applyError(
          nextState,
          AuthenticationErrorCommon.exceededMaximumStackDepth
        )
      : nextState.operationCount > ConsensusCommon.maximumOperationCount
      ? applyError(
          nextState,
          AuthenticationErrorCommon.exceededMaximumOperationCount
        )
      : nextState;
  };

export const cloneStack = (stack: readonly Readonly<Uint8Array>[]) =>
  stack.map((item) => item.slice());

export const createAuthenticationProgramInternalStateCommon = ({
  instructions,
  stack = [],
}: {
  instructions: readonly AuthenticationInstruction[];
  stack?: Uint8Array[];
}): AuthenticationProgramStateInternalCommon => ({
  alternateStack: [],
  controlStack: [],
  instructions,
  ip: 0,
  lastCodeSeparator: -1,
  operationCount: 0,
  signatureOperationsCount: 0,
  signedMessages: [],
  stack,
});

export const createAuthenticationProgramStateCommon = ({
  program,
  instructions,
  stack,
}: {
  program: Readonly<AuthenticationProgramCommon>;
  instructions: readonly AuthenticationInstruction[];
  stack: Uint8Array[];
}): AuthenticationProgramStateCommon => ({
  ...createAuthenticationProgramInternalStateCommon({
    instructions,
    stack,
  }),
  program,
});

export const cloneAuthenticationProgramCommon = <
  Program extends AuthenticationProgramCommon
>(
  program: Readonly<Program>
) => ({
  inputIndex: program.inputIndex,
  sourceOutputs: cloneTransactionOutputsCommon(program.sourceOutputs),
  transaction: cloneTransactionCommon(program.transaction),
});

export const cloneAuthenticationProgramStateCommon = <
  State extends AuthenticationProgramStateCommon
>(
  state: Readonly<State>
) => ({
  ...(state.error === undefined ? {} : { error: state.error }),
  alternateStack: cloneStack(state.alternateStack),
  controlStack: state.controlStack.slice(),
  instructions: state.instructions.map(cloneAuthenticationInstruction),
  ip: state.ip,
  lastCodeSeparator: state.lastCodeSeparator,
  operationCount: state.operationCount,
  program: cloneAuthenticationProgramCommon(state.program),
  signatureOperationsCount: state.signatureOperationsCount,
  signedMessages: cloneStack(state.signedMessages),
  stack: cloneStack(state.stack),
});

export const cloneAuthenticationProgramStateBCH =
  cloneAuthenticationProgramStateCommon;
export const cloneAuthenticationProgramState =
  cloneAuthenticationProgramStateBCH;

/**
 * A reduced version of {@link AuthenticationProgramCommon} in which some
 * transaction input `unlockingBytecode` values may be undefined. This context
 * is required by the compiler to generate signatures.
 *
 * As of BCH 2022, `sourceOutputs.lockingBytecode` is not required for any
 * signing serialization algorithms. However, this type requires each to be
 * provided in anticipation of a future signing serialization algorithm that
 * supports committing to UTXO bytecode values.
 */
export interface CompilationContext<
  TransactionType extends TransactionCommon<Input<Uint8Array | undefined>>
> {
  inputIndex: number;
  sourceOutputs: Output[];
  transaction: TransactionType;
}

export type CompilationContextCommon = CompilationContext<
  TransactionCommon<Input<Uint8Array | undefined>>
>;

const sha256HashLength = 32;
/**
 * This is a meaningless but complete {@link CompilationContextCommon} that uses
 * a different value for each property. This is useful for testing
 * and debugging.
 */
// eslint-disable-next-line complexity
export const createCompilationContextCommonTesting = ({
  sourceOutputs,
  inputs,
  locktime,
  version,
  outputs,
}: {
  sourceOutputs?: CompilationContextCommon['sourceOutputs'];
  inputs?: CompilationContextCommon['transaction']['inputs'];
  locktime?: CompilationContextCommon['transaction']['locktime'];
  version?: CompilationContextCommon['transaction']['version'];
  outputs?: CompilationContextCommon['transaction']['outputs'];
} = {}): CompilationContextCommon => ({
  inputIndex: 0,
  sourceOutputs: sourceOutputs
    ? sourceOutputs
    : [
        {
          lockingBytecode: Uint8Array.from([]),
          valueSatoshis: hexToBin('ffffffffffffffff'),
        },
      ],
  transaction: {
    inputs: inputs
      ? inputs
      : [
          {
            outpointIndex: 0,
            outpointTransactionHash: new Uint8Array(sha256HashLength).fill(1),
            sequenceNumber: 0,
            unlockingBytecode: undefined,
          },
        ],
    locktime: locktime === undefined ? 0 : locktime,
    outputs:
      outputs === undefined
        ? [
            {
              lockingBytecode: Uint8Array.from([]),
              valueSatoshis: hexToBin('ffffffffffffffff'),
            },
          ]
        : outputs,
    version: version === undefined ? 0 : version,
  },
});
