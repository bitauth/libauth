import { flattenBinArray } from '../../../../format/format.js';
import type {
  AuthenticationProgramStateError,
  AuthenticationProgramStateStack,
  AuthenticationProgramStateTransactionContext,
  Output,
} from '../../../../lib';
import {
  pushToStackChecked,
  pushToStackVmNumber,
  pushToStackVmNumberChecked,
  useTransactionOutput,
  useTransactionUtxo,
} from '../../common/common.js';

const enum CashTokens {
  mintingCapabilityByte = 0x01,
  mutableCapabilityByte = 0x02,
}

export const pushTokenExtendedCategory = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack &
    AuthenticationProgramStateTransactionContext
>(
  state: State,
  utxo: Output
) => {
  const { token } = utxo;
  if (token === undefined) {
    return pushToStackVmNumber(state, 0n);
  }
  const capabilityByte =
    token.nft?.capability === 'minting'
      ? [CashTokens.mintingCapabilityByte]
      : token.nft?.capability === 'mutable'
      ? [CashTokens.mutableCapabilityByte]
      : [];
  const extendedCategory = flattenBinArray([
    token.category,
    Uint8Array.from(capabilityByte),
  ]);
  return pushToStackChecked(state, extendedCategory);
};

export const pushTokenCommitment = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack &
    AuthenticationProgramStateTransactionContext
>(
  state: State,
  utxo: Output
) => {
  const { token } = utxo;
  if (token === undefined || token.nft === undefined) {
    return pushToStackVmNumber(state, 0n);
  }
  return pushToStackChecked(
    state,
    token.nft.commitment.length === 0
      ? Uint8Array.of(0x00)
      : token.nft.commitment
  );
};

export const pushTokenAmount = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack &
    AuthenticationProgramStateTransactionContext
>(
  state: State,
  utxo: Output
) => {
  const { token } = utxo;
  if (token === undefined) {
    return pushToStackVmNumber(state, 0n);
  }
  return pushToStackVmNumberChecked(state, token.amount);
};

export const opUtxoTokenCategory = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack &
    AuthenticationProgramStateTransactionContext
>(
  state: State
) =>
  useTransactionUtxo(state, (nextState, [utxo]) =>
    pushTokenExtendedCategory(nextState, utxo)
  );

export const opUtxoTokenCommitment = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack &
    AuthenticationProgramStateTransactionContext
>(
  state: State
) =>
  useTransactionUtxo(state, (nextState, [utxo]) =>
    pushTokenCommitment(nextState, utxo)
  );

export const opUtxoTokenAmount = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack &
    AuthenticationProgramStateTransactionContext
>(
  state: State
) =>
  useTransactionUtxo(state, (nextState, [utxo]) =>
    pushTokenAmount(nextState, utxo)
  );

export const opOutputTokenCategory = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack &
    AuthenticationProgramStateTransactionContext
>(
  state: State
) =>
  useTransactionOutput(state, (nextState, [output]) =>
    pushTokenExtendedCategory(nextState, output)
  );

export const opOutputTokenCommitment = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack &
    AuthenticationProgramStateTransactionContext
>(
  state: State
) =>
  useTransactionOutput(state, (nextState, [output]) =>
    pushTokenCommitment(nextState, output)
  );

export const opOutputTokenAmount = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack &
    AuthenticationProgramStateTransactionContext
>(
  state: State
) =>
  useTransactionOutput(state, (nextState, [output]) =>
    pushTokenAmount(nextState, output)
  );
