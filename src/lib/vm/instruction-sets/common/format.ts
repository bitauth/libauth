import { flattenBinArray } from '../../../format/format.js';
import type {
  AuthenticationProgramStateError,
  AuthenticationProgramStateStack,
} from '../../../lib.js';

import {
  pushToStack,
  pushToStackChecked,
  useOneStackItem,
  useOneVmNumber,
  useTwoStackItems,
} from './combinators.js';
import { ConsensusCommon } from './consensus.js';
import { applyError, AuthenticationErrorCommon } from './errors.js';
import { bigIntToVmNumber } from './instruction-sets-utils.js';

export const opCat = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack,
>(
  state: State,
) =>
  useTwoStackItems(state, (nextState, [a, b]) =>
    pushToStackChecked(nextState, flattenBinArray([a, b])),
  );

export const opSplit = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack,
>(
  state: State,
) =>
  useOneVmNumber(state, (nextState, value) => {
    const index = Number(value);
    return useOneStackItem(nextState, (finalState, [item]) =>
      index < 0 || index > item.length
        ? applyError(finalState, AuthenticationErrorCommon.invalidSplitIndex)
        : pushToStack(finalState, item.slice(0, index), item.slice(index)),
    );
  });

const enum Constants {
  positiveSign = 0x00,
  negativeSign = 0x80,
}

/**
 * Pad a minimally-encoded VM number for `OP_NUM2BIN`.
 */
export const padMinimallyEncodedVmNumber = (
  vmNumber: Uint8Array,
  length: number,
) => {
  // eslint-disable-next-line functional/no-let
  let signBit = Constants.positiveSign;
  // eslint-disable-next-line functional/no-conditional-statements
  if (vmNumber.length > 0) {
    // eslint-disable-next-line functional/no-expression-statements, no-bitwise, @typescript-eslint/no-non-null-assertion
    signBit = vmNumber[vmNumber.length - 1]! & Constants.negativeSign;
    // eslint-disable-next-line functional/no-expression-statements, no-bitwise, functional/immutable-data
    vmNumber[vmNumber.length - 1] &= Constants.negativeSign - 1;
  }
  const result = Array.from(vmNumber);
  // eslint-disable-next-line functional/no-loop-statements
  while (result.length < length - 1) {
    // eslint-disable-next-line functional/no-expression-statements, functional/immutable-data
    result.push(0);
  }
  // eslint-disable-next-line functional/no-expression-statements, functional/immutable-data
  result.push(signBit);
  return Uint8Array.from(result);
};

export const opNum2Bin = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack,
>(
  state: State,
) =>
  useOneVmNumber(state, (nextState, value) => {
    const targetLength = Number(value);
    return targetLength > ConsensusCommon.maximumStackItemLength
      ? applyError(
          nextState,
          `${AuthenticationErrorCommon.exceededMaximumStackItemLength} Item length: ${targetLength} bytes.`,
        )
      : useOneVmNumber(
          nextState,
          (finalState, [target]) => {
            const minimallyEncoded = bigIntToVmNumber(target);
            return minimallyEncoded.length > targetLength
              ? applyError(
                  finalState,
                  AuthenticationErrorCommon.insufficientLength,
                )
              : minimallyEncoded.length === targetLength
                ? pushToStack(finalState, minimallyEncoded)
                : pushToStack(
                    finalState,
                    padMinimallyEncodedVmNumber(minimallyEncoded, targetLength),
                  );
          },
          {
            maximumVmNumberByteLength:
              // TODO: is this right?
              ConsensusCommon.maximumStackItemLength as number,
            requireMinimalEncoding: false,
          },
        );
  });

export const opBin2Num = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack,
>(
  state: State,
) =>
  useOneVmNumber(
    state,
    (nextState, [target]) => {
      const minimallyEncoded = bigIntToVmNumber(target);
      return minimallyEncoded.length > ConsensusCommon.maximumVmNumberLength
        ? applyError(
            nextState,
            AuthenticationErrorCommon.exceededMaximumVmNumberLength,
          )
        : pushToStack(nextState, minimallyEncoded);
    },
    {
      // TODO: is this right?
      maximumVmNumberByteLength:
        ConsensusCommon.maximumStackItemLength as number,
      requireMinimalEncoding: false,
    },
  );
