import { int32UnsignedToSigned } from '../../../format/format.js';
import type {
  AuthenticationProgramStateError,
  AuthenticationProgramStateMinimum,
  AuthenticationProgramStateStack,
  AuthenticationProgramStateTransactionContext,
  Input,
  Output,
} from '../../../lib.js';
import type { AuthenticationProgramStateCodeSeparator } from '../../vm-types.js';

import {
  pushToStack,
  pushToStackChecked,
  pushToStackVmNumber,
  useOneVmNumber,
} from './combinators.js';
import { ConsensusCommon } from './consensus.js';
import { applyError, AuthenticationErrorCommon } from './errors.js';
import { encodeAuthenticationInstructions } from './instruction-sets-utils.js';

export const opInputIndex = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack &
    AuthenticationProgramStateTransactionContext,
>(
  state: State,
) => pushToStackVmNumber(state, BigInt(state.program.inputIndex));

export const createOpActiveBytecode =
  ({
    maximumStackItemLength = ConsensusCommon.maximumStackItemLength as number,
  } = {}) =>
  <
    State extends AuthenticationProgramStateCodeSeparator &
      AuthenticationProgramStateError &
      AuthenticationProgramStateMinimum &
      AuthenticationProgramStateStack &
      AuthenticationProgramStateTransactionContext,
  >(
    state: State,
  ) =>
    pushToStackChecked(
      state,
      encodeAuthenticationInstructions(
        state.instructions.slice(state.lastCodeSeparator + 1),
      ),
      { maximumStackItemLength },
    );
export const opActiveBytecode = createOpActiveBytecode();

export const opTxVersion = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack &
    AuthenticationProgramStateTransactionContext,
>(
  state: State,
) =>
  pushToStackVmNumber(
    state,
    BigInt(int32UnsignedToSigned(state.program.transaction.version)),
  );

export const opTxInputCount = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack &
    AuthenticationProgramStateTransactionContext,
>(
  state: State,
) =>
  pushToStackVmNumber(state, BigInt(state.program.transaction.inputs.length));

export const opTxOutputCount = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack &
    AuthenticationProgramStateTransactionContext,
>(
  state: State,
) =>
  pushToStackVmNumber(state, BigInt(state.program.transaction.outputs.length));

export const opTxLocktime = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack &
    AuthenticationProgramStateTransactionContext,
>(
  state: State,
) => pushToStackVmNumber(state, BigInt(state.program.transaction.locktime));

export const useTransactionUtxo = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack &
    AuthenticationProgramStateTransactionContext,
>(
  state: State,
  operation: (nextState: State, [utxo]: [Output]) => State,
) =>
  useOneVmNumber(state, (nextState, [index]) => {
    const utxo = nextState.program.sourceOutputs[Number(index)];
    if (utxo === undefined) {
      return applyError(
        nextState,
        AuthenticationErrorCommon.invalidTransactionUtxoIndex,
        `Transaction UTXO count: ${nextState.program.sourceOutputs.length}; requested index: ${index}.`,
      );
    }
    return operation(state, [utxo]);
  });

export const opUtxoValue = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack &
    AuthenticationProgramStateTransactionContext,
>(
  state: State,
) =>
  useTransactionUtxo(state, (nextState, [utxo]) =>
    pushToStackVmNumber(nextState, utxo.valueSatoshis),
  );

export const createOpUtxoBytecode =
  ({
    maximumStackItemLength = ConsensusCommon.maximumStackItemLength as number,
  } = {}) =>
  <
    State extends AuthenticationProgramStateError &
      AuthenticationProgramStateStack &
      AuthenticationProgramStateTransactionContext,
  >(
    state: State,
  ) =>
    useTransactionUtxo(state, (nextState, [utxo]) =>
      pushToStackChecked(nextState, utxo.lockingBytecode.slice(), {
        maximumStackItemLength,
      }),
    );
export const opUtxoBytecode = createOpUtxoBytecode();

export const useTransactionInput = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack &
    AuthenticationProgramStateTransactionContext,
>(
  state: State,
  operation: (nextState: State, [input]: [Input]) => State,
) =>
  useOneVmNumber(state, (nextState, [index]) => {
    const input = nextState.program.transaction.inputs[Number(index)];
    if (input === undefined) {
      return applyError(
        nextState,
        AuthenticationErrorCommon.invalidTransactionInputIndex,
        `Transaction input count: ${nextState.program.transaction.inputs.length}; requested index: ${index}.`,
      );
    }
    return operation(state, [input]);
  });

export const opOutpointTxHash = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack &
    AuthenticationProgramStateTransactionContext,
>(
  state: State,
) =>
  useTransactionInput(state, (nextState, [input]) =>
    pushToStack(nextState, [input.outpointTransactionHash.slice().reverse()]),
  );

export const opOutpointIndex = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack &
    AuthenticationProgramStateTransactionContext,
>(
  state: State,
) =>
  useTransactionInput(state, (nextState, [input]) =>
    pushToStackVmNumber(nextState, BigInt(input.outpointIndex)),
  );

export const createOpInputBytecode =
  ({
    maximumStackItemLength = ConsensusCommon.maximumStackItemLength as number,
  } = {}) =>
  <
    State extends AuthenticationProgramStateError &
      AuthenticationProgramStateStack &
      AuthenticationProgramStateTransactionContext,
  >(
    state: State,
  ) =>
    useTransactionInput(state, (nextState, [input]) =>
      pushToStackChecked(nextState, input.unlockingBytecode.slice(), {
        maximumStackItemLength,
      }),
    );
export const opInputBytecode = createOpInputBytecode();

export const opInputSequenceNumber = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack &
    AuthenticationProgramStateTransactionContext,
>(
  state: State,
) =>
  useTransactionInput(state, (nextState, [input]) =>
    pushToStackVmNumber(nextState, BigInt(input.sequenceNumber)),
  );

export const useTransactionOutput = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack &
    AuthenticationProgramStateTransactionContext,
>(
  state: State,
  operation: (nextState: State, [output]: [Output]) => State,
) =>
  useOneVmNumber(state, (nextState, [index]) => {
    const input = nextState.program.transaction.outputs[Number(index)];
    if (input === undefined) {
      return applyError(
        nextState,
        AuthenticationErrorCommon.invalidTransactionOutputIndex,
        `Transaction output count: ${nextState.program.transaction.outputs.length}; requested index: ${index}.`,
      );
    }
    return operation(state, [input]);
  });

export const opOutputValue = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack &
    AuthenticationProgramStateTransactionContext,
>(
  state: State,
) =>
  useTransactionOutput(state, (nextState, [output]) =>
    pushToStackVmNumber(nextState, output.valueSatoshis),
  );

export const createOpOutputBytecode =
  ({
    maximumStackItemLength = ConsensusCommon.maximumStackItemLength as number,
  } = {}) =>
  <
    State extends AuthenticationProgramStateError &
      AuthenticationProgramStateStack &
      AuthenticationProgramStateTransactionContext,
  >(
    state: State,
  ) =>
    useTransactionOutput(state, (nextState, [output]) =>
      pushToStackChecked(nextState, output.lockingBytecode.slice(), {
        maximumStackItemLength,
      }),
    );
export const opOutputBytecode = createOpOutputBytecode();
