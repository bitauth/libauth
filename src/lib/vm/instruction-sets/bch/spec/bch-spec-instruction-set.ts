import type {
  AuthenticationProgramBch,
  AuthenticationProgramStateBchSpec,
  InstructionSet,
  ResolvedTransactionBch,
} from '../../../../lib.js';
import {
  AuthenticationErrorCommon,
  conditionallyEvaluate,
} from '../../common/common.js';
import { createInstructionSetBch2025 } from '../2025/bch-2025-instruction-set.js';

import { AuthenticationErrorBchSpec } from './bch-spec-errors.js';
import { opBegin, opUntil } from './bch-spec-loops.js';
import { OpcodesBchSpec } from './bch-spec-opcodes.js';

/**
 * create an instance of the `BCH_SPEC` virtual machine instruction set, an
 * informal, speculative instruction set that implements a variety of future
 * Bitcoin Cash Improvement Proposals (CHIPs).
 *
 * @param standard - If `true`, the additional `isStandard` validations will be
 * enabled. Transactions that fail these rules are often called "non-standard"
 * and can technically be included by miners in valid blocks, but most network
 * nodes will refuse to relay them. (Default: `true`)
 */
export const createInstructionSetBchSpec = <
  AuthenticationProgramState extends AuthenticationProgramStateBchSpec,
>(
  standard = true,
): InstructionSet<
  ResolvedTransactionBch,
  AuthenticationProgramBch,
  AuthenticationProgramState
> => {
  const instructionSet =
    createInstructionSetBch2025<AuthenticationProgramState>(standard);
  return {
    ...instructionSet,
    initialize: () =>
      ({
        ...instructionSet.initialize?.(),
        repeatedBytes: 0,
      }) as Partial<AuthenticationProgramStateBchSpec> as Partial<AuthenticationProgramState>,
    operations: {
      ...instructionSet.operations,
      [OpcodesBchSpec.OP_BEGIN]: conditionallyEvaluate(opBegin),
      [OpcodesBchSpec.OP_UNTIL]: conditionallyEvaluate(opUntil),
    },
    success: (state) => {
      const result = instructionSet.success(state);
      if (result === AuthenticationErrorCommon.nonEmptyControlStack)
        return AuthenticationErrorBchSpec.nonEmptyControlStack;
      return result;
    },
  };
};
