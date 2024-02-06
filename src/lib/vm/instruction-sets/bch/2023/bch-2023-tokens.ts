import { binToHex, flattenBinArray } from '../../../../format/format.js';
import type {
  AuthenticationProgramStateError,
  AuthenticationProgramStateStack,
  AuthenticationProgramStateTransactionContext,
  Input,
  Output,
  Transaction,
} from '../../../../lib.js';
import {
  pushToStackChecked,
  pushToStackVmNumber,
  pushToStackVmNumberChecked,
  useTransactionOutput,
  useTransactionUtxo,
} from '../../common/common.js';

import { ConsensusBCH2023 } from './bch-2023-consensus.js';

/**
 * Given a list of transaction inputs, extract a hex-encoded list of all
 * {@link Input.outpointTransactionHash}es from inputs that spend output `0` of
 * that transaction (i.e. where {@link Input.outpointIndex} is `0`).
 * @param inputs - a list of transaction inputs
 * @returns a hex-encoded list of {@link Input.outpointTransactionHash}es
 */
export const extractGenesisCategories = (inputs: Input[]) =>
  inputs.reduce<string[]>(
    (agg, input) =>
      input.outpointIndex === 0
        ? [...agg, binToHex(input.outpointTransactionHash)]
        : agg,
    [],
  );

type ImmutableToken = {
  categoryHex: string;
  commitmentHex: string;
};

type FungibleTokensByCategory = {
  [categoryHex: string]: bigint;
};

type MutableTokensByCategory = {
  [categoryHex: string]: number;
};

/**
 * Given the resolved list of a transaction's source outputs – the Unspent
 * Transaction Outputs (UTXOs) spent by the transaction, extract all token data
 * for token-aware validation. See CHIP-2022-02-CashTokens for details.
 * @param sourceOutputs - a list of resolved source outputs (UTXOs)
 * @returns an object containing `availableImmutableTokens`,
 * `availableMutableTokensByCategory`, `availableSumsByCategory`, and
 * `inputMintingCategories`. See CHIP-2022-02-CashTokens for details.
 */
export const extractSourceOutputTokenData = (sourceOutputs: Output[]) =>
  sourceOutputs.reduce(
    // eslint-disable-next-line complexity
    (agg, sourceOutput) => {
      if (sourceOutput.token === undefined) return agg;
      const categoryHex = binToHex(sourceOutput.token.category);
      return {
        availableImmutableTokens: [
          ...agg.availableImmutableTokens,
          ...(sourceOutput.token.nft?.capability === 'none'
            ? [
                {
                  categoryHex: binToHex(sourceOutput.token.category),
                  commitmentHex: binToHex(sourceOutput.token.nft.commitment),
                },
              ]
            : []),
        ],
        availableMutableTokensByCategory:
          sourceOutput.token.nft?.capability === 'mutable'
            ? {
                ...agg.availableMutableTokensByCategory,
                [categoryHex]:
                  (agg.availableMutableTokensByCategory[categoryHex] ?? 0) + 1,
              }
            : agg.availableMutableTokensByCategory,
        availableSumsByCategory: {
          ...agg.availableSumsByCategory,
          [categoryHex]:
            (agg.availableSumsByCategory[categoryHex] ?? 0n) +
            sourceOutput.token.amount,
        },
        inputMintingCategories: [
          ...agg.inputMintingCategories,
          ...(sourceOutput.token.nft?.capability === 'minting'
            ? [binToHex(sourceOutput.token.category)]
            : []),
        ],
      };
    },
    {
      availableImmutableTokens: [] as ImmutableToken[],
      availableMutableTokensByCategory: {} as MutableTokensByCategory,
      availableSumsByCategory: {} as FungibleTokensByCategory,
      inputMintingCategories: [] as string[],
    },
  );

/**
 * Given a transaction's outputs, extract all token data for token-aware
 * validation. See CHIP-2022-02-CashTokens for details.
 * @param outputs - a list of transaction outputs
 * @returns an object containing `outputImmutableTokens`,
 * `outputMintingCategories`, `outputMutableTokensByCategory`, and
 * `outputSumsByCategory`. See CHIP-2022-02-CashTokens for details.
 */
export const extractTransactionOutputTokenData = (
  outputs: Transaction['outputs'],
) =>
  outputs.reduce(
    // eslint-disable-next-line complexity
    (agg, output) => {
      if (output.token === undefined) return agg;
      const categoryHex = binToHex(output.token.category);
      return {
        outputImmutableTokens: [
          ...agg.outputImmutableTokens,
          ...(output.token.nft?.capability === 'none'
            ? [
                {
                  categoryHex: binToHex(output.token.category),
                  commitmentHex: binToHex(output.token.nft.commitment),
                },
              ]
            : []),
        ],
        outputMintingCategories: [
          ...agg.outputMintingCategories,
          ...(output.token.nft?.capability === 'minting'
            ? [binToHex(output.token.category)]
            : []),
        ],
        outputMutableTokensByCategory:
          output.token.nft?.capability === 'mutable'
            ? {
                ...agg.outputMutableTokensByCategory,
                [categoryHex]:
                  (agg.outputMutableTokensByCategory[categoryHex] ?? 0) + 1,
              }
            : agg.outputMutableTokensByCategory,
        outputSumsByCategory: {
          ...agg.outputSumsByCategory,
          [categoryHex]:
            (agg.outputSumsByCategory[categoryHex] ?? 0n) + output.token.amount,
        },
      };
    },
    {
      outputImmutableTokens: [] as ImmutableToken[],
      outputMintingCategories: [] as string[],
      outputMutableTokensByCategory: {} as MutableTokensByCategory,
      outputSumsByCategory: {} as FungibleTokensByCategory,
    },
  );

/**
 * Given a transaction and its resolved source outputs – the Unspent Transaction
 * Outputs (UTXOs) it spends – verify that the transaction passes token-aware
 * validation.
 * @param transaction - the transaction to verify
 * @param sourceOutputs - the resolved list of the transaction's source outputs
 * @returns `true` on success, or an error message (string) on failure.
 */
// eslint-disable-next-line complexity
export const verifyTransactionTokens = (
  transaction: Transaction,
  sourceOutputs: Output[],
) => {
  const excessiveCommitment = [...sourceOutputs, ...transaction.outputs].find(
    (output) =>
      output.token?.nft?.commitment !== undefined &&
      output.token.nft.commitment.length >
        ConsensusBCH2023.maximumCommitmentLength,
  );
  if (excessiveCommitment !== undefined) {
    return `Transaction violates token validation: a token commitment exceeds the consensus limit of ${
      ConsensusBCH2023.maximumCommitmentLength
    } bytes. Excessive token commitment length: ${
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      excessiveCommitment.token!.nft!.commitment.length
    }`;
  }
  const genesisCategories = extractGenesisCategories(transaction.inputs);
  const {
    availableSumsByCategory,
    availableMutableTokensByCategory,
    inputMintingCategories,
    availableImmutableTokens,
  } = extractSourceOutputTokenData(sourceOutputs);
  const {
    outputSumsByCategory,
    outputMutableTokensByCategory,
    outputMintingCategories,
    outputImmutableTokens,
  } = extractTransactionOutputTokenData(transaction.outputs);
  const availableMintingCategories = [
    ...genesisCategories,
    ...inputMintingCategories,
  ];

  const missingMintingCategory = outputMintingCategories.find(
    (category) => !availableMintingCategories.includes(category),
  );
  if (missingMintingCategory !== undefined) {
    return `Transaction violates token validation: the transaction outputs include a minting token that is not substantiated by the transaction's inputs. Invalid output minting token category: ${missingMintingCategory}`;
  }

  // eslint-disable-next-line functional/no-loop-statements
  for (const [categoryHex, sum] of Object.entries(outputSumsByCategory)) {
    if (sum > BigInt(ConsensusBCH2023.maxVmNumber)) {
      return `Transaction violates token validation: the transaction outputs include a sum of fungible tokens for a category exceeding the maximum supply (${
        ConsensusBCH2023.maxVmNumber
      }). Category: ${categoryHex}, total amount: ${sum.toString()}.`;
    }
    const availableSum = availableSumsByCategory[categoryHex];
    if (
      availableSum === undefined &&
      sum > 0 &&
      !genesisCategories.includes(categoryHex)
    ) {
      return `Transaction violates token validation: the transaction creates new fungible tokens for a category without a matching genesis input. Category: ${categoryHex}, tokens created: ${sum}`;
    }
    if (availableSum !== undefined && sum > availableSum) {
      return `Transaction violates token validation: the sum of fungible tokens in the transaction's outputs exceed that of the transactions inputs for a category. Category: ${categoryHex}, input amount: ${availableSum}, output amount: ${sum}`;
    }
  }

  const remainingMutableTokens = Object.entries(
    outputMutableTokensByCategory,
  ).reduce<MutableTokensByCategory>((agg, [categoryHex, sum]) => {
    if (availableMintingCategories.includes(categoryHex)) {
      return agg;
    }
    return { ...agg, [categoryHex]: (agg[categoryHex] ?? 0) - sum };
  }, availableMutableTokensByCategory);

  // eslint-disable-next-line functional/no-loop-statements
  for (const [categoryHex, sum] of Object.entries(remainingMutableTokens)) {
    if (sum < 0) {
      return `Transaction violates token validation: the transaction creates more mutable tokens than are available for a category without a matching minting token. Category: ${categoryHex}, excess mutable tokens: ${
        0 - sum
      }`;
    }
  }

  const { unmatchedImmutableTokens } = outputImmutableTokens.reduce(
    (agg, token) => {
      const { categoryHex, commitmentHex } = token;
      if (availableMintingCategories.includes(categoryHex)) {
        return agg;
      }
      const firstMatch = availableImmutableTokens.findIndex(
        (available) =>
          available.categoryHex === categoryHex &&
          available.commitmentHex === commitmentHex,
      );
      if (firstMatch === -1) {
        return {
          availableImmutableTokens: agg.availableImmutableTokens,
          unmatchedImmutableTokens: [...agg.unmatchedImmutableTokens, token],
        };
      }
      // eslint-disable-next-line functional/no-expression-statements, functional/immutable-data
      agg.availableImmutableTokens.splice(firstMatch, 1);
      return agg;
    },
    {
      availableImmutableTokens,
      unmatchedImmutableTokens: [] as ImmutableToken[],
    },
  );
  const requiredMutableTokens =
    unmatchedImmutableTokens.reduce<MutableTokensByCategory>(
      (agg, token) => ({
        ...agg,
        [token.categoryHex]: (agg[token.categoryHex] ?? 0) + 1,
      }),
      {},
    );

  // eslint-disable-next-line functional/no-loop-statements
  for (const [categoryHex, required] of Object.entries(requiredMutableTokens)) {
    const available = remainingMutableTokens[categoryHex] ?? 0;
    if (available < required) {
      return `Transaction violates token validation: the transaction creates an immutable token for a category without a matching minting token or sufficient mutable tokens. Category ${categoryHex}, available mutable tokens: ${available}, new immutable tokens: ${required}`;
    }
  }

  return true;
};

const enum Constants {
  mutableCapabilityByte = 0x01,
  mintingCapabilityByte = 0x02,
}

export const pushTokenExtendedCategory = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack &
    AuthenticationProgramStateTransactionContext,
>(
  state: State,
  utxo: Output,
) => {
  const { token } = utxo;
  if (token === undefined) {
    return pushToStackVmNumber(state, 0n);
  }
  const capabilityByte =
    token.nft?.capability === 'minting'
      ? [Constants.mintingCapabilityByte]
      : token.nft?.capability === 'mutable'
        ? [Constants.mutableCapabilityByte]
        : [];
  const extendedCategory = flattenBinArray([
    token.category.slice().reverse(),
    Uint8Array.from(capabilityByte),
  ]);
  return pushToStackChecked(state, extendedCategory);
};

type TokenOpState = AuthenticationProgramStateError &
  AuthenticationProgramStateStack &
  AuthenticationProgramStateTransactionContext;

export const pushTokenCommitment = <State extends TokenOpState>(
  state: State,
  utxo: Output,
) => {
  const { token } = utxo;
  if (token?.nft === undefined) {
    return pushToStackVmNumber(state, 0n);
  }
  return pushToStackChecked(state, token.nft.commitment);
};

export const pushTokenAmount = <State extends TokenOpState>(
  state: State,
  utxo: Output,
) => {
  const { token } = utxo;
  if (token === undefined) {
    return pushToStackVmNumber(state, 0n);
  }
  return pushToStackVmNumberChecked(state, token.amount);
};

export const opUtxoTokenCategory = <State extends TokenOpState>(state: State) =>
  useTransactionUtxo(state, (nextState, [utxo]) =>
    pushTokenExtendedCategory(nextState, utxo),
  );

export const opUtxoTokenCommitment = <State extends TokenOpState>(
  state: State,
) =>
  useTransactionUtxo(state, (nextState, [utxo]) =>
    pushTokenCommitment(nextState, utxo),
  );

export const opUtxoTokenAmount = <State extends TokenOpState>(state: State) =>
  useTransactionUtxo(state, (nextState, [utxo]) =>
    pushTokenAmount(nextState, utxo),
  );

export const opOutputTokenCategory = <State extends TokenOpState>(
  state: State,
) =>
  useTransactionOutput(state, (nextState, [output]) =>
    pushTokenExtendedCategory(nextState, output),
  );

export const opOutputTokenCommitment = <State extends TokenOpState>(
  state: State,
) =>
  useTransactionOutput(state, (nextState, [output]) =>
    pushTokenCommitment(nextState, output),
  );

export const opOutputTokenAmount = <State extends TokenOpState>(state: State) =>
  useTransactionOutput(state, (nextState, [output]) =>
    pushTokenAmount(nextState, output),
  );
