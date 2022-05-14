import {
  binToBigIntUint64LE,
  int32UnsignedToSigned,
} from '../../../format/format.js';
import type {
  AuthenticationProgramStateCommon,
  Input,
  Output,
} from '../../../lib';

import {
  pushToStackChecked,
  pushToStackVmNumberChecked,
  useOneVmNumber,
} from './combinators.js';
import { applyError, AuthenticationErrorCommon } from './errors.js';
import { encodeAuthenticationInstructions } from './instruction-sets-utils.js';

export const opInputIndex = <State extends AuthenticationProgramStateCommon>(
  state: State
) => pushToStackVmNumberChecked(state, BigInt(state.program.inputIndex));

export const opActiveBytecode = <
  State extends AuthenticationProgramStateCommon
>(
  state: State
) =>
  pushToStackChecked(
    state,
    encodeAuthenticationInstructions(
      state.instructions.slice(state.lastCodeSeparator + 1)
    )
  );

export const opTxVersion = <State extends AuthenticationProgramStateCommon>(
  state: State
) =>
  pushToStackVmNumberChecked(
    state,
    BigInt(int32UnsignedToSigned(state.program.transaction.version))
  );

export const opTxInputCount = <State extends AuthenticationProgramStateCommon>(
  state: State
) =>
  pushToStackVmNumberChecked(
    state,
    BigInt(state.program.transaction.inputs.length)
  );

export const opTxOutputCount = <State extends AuthenticationProgramStateCommon>(
  state: State
) =>
  pushToStackVmNumberChecked(
    state,
    BigInt(state.program.transaction.outputs.length)
  );

export const opTxLocktime = <State extends AuthenticationProgramStateCommon>(
  state: State
) =>
  pushToStackVmNumberChecked(state, BigInt(state.program.transaction.locktime));

export const useTransactionUtxo = <
  State extends AuthenticationProgramStateCommon
>(
  state: State,
  operation: (nextState: State, [utxo]: [Output]) => State
) =>
  useOneVmNumber(state, (nextState, [index]) => {
    const utxo = nextState.program.sourceOutputs[Number(index)];
    if (utxo === undefined) {
      return applyError(
        nextState,
        AuthenticationErrorCommon.invalidTransactionUtxoIndex
      );
    }
    return operation(state, [utxo]);
  });

export const opUtxoValue = <State extends AuthenticationProgramStateCommon>(
  state: State
) =>
  useTransactionUtxo(state, (nextState, [utxo]) =>
    pushToStackVmNumberChecked(
      nextState,
      binToBigIntUint64LE(utxo.valueSatoshis)
    )
  );

export const opUtxoBytecode = <State extends AuthenticationProgramStateCommon>(
  state: State
) =>
  useTransactionUtxo(state, (nextState, [utxo]) =>
    pushToStackChecked(nextState, utxo.lockingBytecode.slice())
  );

export const useTransactionInput = <
  State extends AuthenticationProgramStateCommon
>(
  state: State,
  operation: (nextState: State, [input]: [Input]) => State
) =>
  useOneVmNumber(state, (nextState, [index]) => {
    const input = nextState.program.transaction.inputs[Number(index)];
    if (input === undefined) {
      return applyError(
        nextState,
        AuthenticationErrorCommon.invalidTransactionInputIndex
      );
    }
    return operation(state, [input]);
  });

export const opOutpointTxHash = <
  State extends AuthenticationProgramStateCommon
>(
  state: State
) =>
  useTransactionInput(state, (nextState, [input]) =>
    pushToStackChecked(
      nextState,
      input.outpointTransactionHash.slice().reverse()
    )
  );

export const opOutpointIndex = <State extends AuthenticationProgramStateCommon>(
  state: State
) =>
  useTransactionInput(state, (nextState, [input]) =>
    pushToStackVmNumberChecked(nextState, BigInt(input.outpointIndex))
  );

export const opInputBytecode = <State extends AuthenticationProgramStateCommon>(
  state: State
) =>
  useTransactionInput(state, (nextState, [input]) =>
    pushToStackChecked(nextState, input.unlockingBytecode.slice())
  );

export const opInputSequenceNumber = <
  State extends AuthenticationProgramStateCommon
>(
  state: State
) =>
  useTransactionInput(state, (nextState, [input]) =>
    pushToStackVmNumberChecked(nextState, BigInt(input.sequenceNumber))
  );

export const useTransactionOutput = <
  State extends AuthenticationProgramStateCommon
>(
  state: State,
  operation: (nextState: State, [output]: [Output]) => State
) =>
  useOneVmNumber(state, (nextState, [index]) => {
    const input = nextState.program.transaction.outputs[Number(index)];
    if (input === undefined) {
      return applyError(
        nextState,
        AuthenticationErrorCommon.invalidTransactionOutputIndex
      );
    }
    return operation(state, [input]);
  });

export const opOutputValue = <State extends AuthenticationProgramStateCommon>(
  state: State
) =>
  useTransactionOutput(state, (nextState, [output]) =>
    pushToStackVmNumberChecked(
      nextState,
      binToBigIntUint64LE(output.valueSatoshis)
    )
  );

export const opOutputBytecode = <
  State extends AuthenticationProgramStateCommon
>(
  state: State
) =>
  useTransactionOutput(state, (nextState, [output]) =>
    pushToStackChecked(nextState, output.lockingBytecode.slice())
  );
