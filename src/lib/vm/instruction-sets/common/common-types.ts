import type {
  AuthenticationProgramCommon,
  AuthenticationProgramStateAlternateStack,
  AuthenticationProgramStateControlStack,
  AuthenticationProgramStateError,
  AuthenticationProgramStateStack,
  Input,
  Operation,
  Output,
  TransactionCommon,
} from '../../../lib.js';

import { conditionallyEvaluate } from './combinators.js';
import { ConsensusCommon } from './consensus.js';
import { applyError, AuthenticationErrorCommon } from './errors.js';

export const undefinedOperation = conditionallyEvaluate(
  <
    State extends AuthenticationProgramStateControlStack<unknown> &
      AuthenticationProgramStateError,
  >(
    state: State,
  ) => applyError(state, AuthenticationErrorCommon.unknownOpcode),
);

export const checkLimitsCommon =
  <
    State extends AuthenticationProgramStateAlternateStack &
      AuthenticationProgramStateError &
      AuthenticationProgramStateStack & { operationCount: number },
  >(
    operation: Operation<State>,
  ): Operation<State> =>
  (state: State) => {
    const nextState = operation(state);
    return nextState.stack.length + nextState.alternateStack.length >
      ConsensusCommon.maximumStackDepth
      ? applyError(
          nextState,
          AuthenticationErrorCommon.exceededMaximumStackDepth,
        )
      : nextState.operationCount > ConsensusCommon.maximumOperationCount
        ? applyError(
            nextState,
            AuthenticationErrorCommon.exceededMaximumOperationCount,
          )
        : nextState;
  };

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
export type CompilationContext<
  TransactionType extends TransactionCommon<Input<Uint8Array | undefined>>,
> = {
  inputIndex: number;
  sourceOutputs: Output[];
  transaction: TransactionType;
};

export type CompilationContextCommon = CompilationContext<
  TransactionCommon<Input<Uint8Array | undefined>>
>;

const sha256HashLength = 32;
/**
 * This is a meaningless but complete {@link CompilationContextCommon} that uses
 * a default value for each property. This is useful for testing
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
          valueSatoshis: 0xffffffffffffffffn,
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
    locktime: locktime ?? 0,
    outputs: outputs ?? [
      {
        lockingBytecode: Uint8Array.from([]),
        valueSatoshis: 0xffffffffffffffffn,
      },
    ],
    version: version ?? 0,
  },
});
