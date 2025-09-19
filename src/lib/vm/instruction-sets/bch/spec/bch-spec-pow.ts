import type {
  AuthenticationProgramStateError,
  AuthenticationProgramStateResourceLimits,
  AuthenticationProgramStateStack,
} from '../../../../lib.js';
import {
  applyError,
  ConsensusCommon,
  numericOperationBinary,
  vmNumberToBigInt,
} from '../../common/common.js';

import { AuthenticationErrorBchSpec } from './bch-spec-errors.js';

const enum Constants {
  lastTwoItems = -2,
  bitsPerByte = 8,
}

export const createOpPow =
  <
    State extends AuthenticationProgramStateError &
      AuthenticationProgramStateResourceLimits &
      AuthenticationProgramStateStack,
  >({
    maximumVmNumberByteLength = ConsensusCommon.maximumVmNumberByteLength as number,
  } = {}) =>
  (state: State) => {
    const [base, maybeExponent] = state.stack.slice(Constants.lastTwoItems);
    const baseLength = base?.length ?? 0;
    const exponent = maybeExponent ?? new Uint8Array(0);

    const exponentValue = vmNumberToBigInt(exponent, {
      maximumVmNumberByteLength: 8,
    });
    if (typeof exponentValue !== 'bigint') {
      return applyError(
        state,
        AuthenticationErrorBchSpec.invalidVmNumber,
        `Attempted an OP_POW operation with an invalid exponent. ${exponentValue}`,
      );
    }
    // eslint-disable-next-line functional/no-expression-statements, functional/immutable-data
    state.metrics.arithmeticCost +=
      baseLength * baseLength * Constants.bitsPerByte * Number(exponentValue);

    if (
      state.metrics.operationCost + state.metrics.arithmeticCost >
      state.metrics.maximumOperationCost
    ) {
      return applyError(
        state,
        AuthenticationErrorBchSpec.excessiveOperationCostOpPow,
        `Maximum operation cost: ${state.metrics.maximumOperationCost} (density control length: ${state.metrics.densityControlLength}); minimum operation cost following operation: ${state.metrics.operationCost} (excludes costs following rejected OP_POW).`,
      );
    }
    return numericOperationBinary(([a, b]) => a ** b, {
      hasEncodingCost: true,
      maximumVmNumberByteLength,
    })(state);
  };

export const opPow = createOpPow();
