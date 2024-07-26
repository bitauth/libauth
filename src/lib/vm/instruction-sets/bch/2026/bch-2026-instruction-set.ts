import {
  ripemd160 as internalRipemd160,
  secp256k1 as internalSecp256k1,
  sha1 as internalSha1,
  sha256 as internalSha256,
} from '../../../../crypto/crypto.js';
import type {
  AuthenticationProgramBch,
  InstructionSet,
  ResolvedTransactionBch,
  Ripemd160,
  Secp256k1,
  Sha1,
  Sha256,
} from '../../../../lib.js';
import {
  AuthenticationErrorCommon,
  conditionallyEvaluate,
  incrementOperationCount,
  mapOverOperations,
} from '../../common/common.js';
import { OpcodesBch2023 } from '../2023/bch-2023-opcodes.js';
import {
  opHash160ChipLimits,
  opHash256ChipLimits,
  opRipemd160ChipLimits,
  opSha1ChipLimits,
  opSha256ChipLimits,
} from '../2025/bch-2025-crypto.js';
import { createInstructionSetBch2025 } from '../2025/bch-2025-instruction-set.js';
import { AuthenticationErrorBch2026 } from '../2026/bch-2026-errors.js';
import { opBegin, opUntil } from '../2026/bch-2026-loops.js';

import { ConsensusBch2026 } from './bch-2026-consensus.js';
import { OpcodesBch2026 } from './bch-2026-opcodes.js';
import type { AuthenticationProgramStateBch2026 } from './bch-2026-types.js';
/**
 * * Initialize a virtual machine using the `BCH_2026_05` instruction set.
 *
 * @param standard - If `true`, the additional `isStandard` validations will be
 * enabled. Transactions that fail these rules are often called "non-standard"
 * and can technically be included by miners in valid blocks, but most network
 * nodes will refuse to relay them. (Default: `true`)
 */
export const createInstructionSetBch2026 = <
  AuthenticationProgramState extends AuthenticationProgramStateBch2026,
  Consensus extends typeof ConsensusBch2026 = typeof ConsensusBch2026,
>(
  standard = true,
  {
    consensus = ConsensusBch2026 as Consensus,
    ripemd160,
    secp256k1,
    sha1,
    sha256,
  }: {
    consensus?: Consensus;
    /**
     * a Ripemd160 implementation
     */
    ripemd160: { hash: Ripemd160['hash'] };
    /**
     * a Secp256k1 implementation
     */
    secp256k1: {
      verifySignatureSchnorr: Secp256k1['verifySignatureSchnorr'];
      verifySignatureDERLowS: Secp256k1['verifySignatureDERLowS'];
    };
    /**
     * a Sha1 implementation
     */
    sha1: { hash: Sha1['hash'] };
    /**
     * a Sha256 implementation
     */
    sha256: { hash: Sha256['hash'] };
  } = {
    ripemd160: internalRipemd160,
    secp256k1: internalSecp256k1,
    sha1: internalSha1,
    sha256: internalSha256,
  },
): InstructionSet<
  ResolvedTransactionBch,
  AuthenticationProgramBch,
  AuthenticationProgramState
> => {
  const instructionSet =
    createInstructionSetBch2025<AuthenticationProgramState>(standard, {
      consensus,
      ripemd160,
      secp256k1,
      sha1,
      sha256,
    });
  return {
    ...instructionSet,
    initialize: () =>
      ({
        ...instructionSet.initialize?.(),
        repeatedBytes: 0,
      }) as Partial<AuthenticationProgramStateBch2026> as Partial<AuthenticationProgramState>,
    operations: {
      ...instructionSet.operations,
      ...mapOverOperations<AuthenticationProgramState>(
        [incrementOperationCount],
        {
          [OpcodesBch2023.OP_RIPEMD160]: conditionallyEvaluate(
            opRipemd160ChipLimits({ ripemd160, strict: true }),
          ),
          [OpcodesBch2023.OP_SHA1]: conditionallyEvaluate(
            opSha1ChipLimits({ sha1, strict: true }),
          ),
          [OpcodesBch2023.OP_SHA256]: conditionallyEvaluate(
            opSha256ChipLimits({ sha256, strict: true }),
          ),
          [OpcodesBch2023.OP_HASH160]: conditionallyEvaluate(
            opHash160ChipLimits({ ripemd160, sha256, strict: true }),
          ),
          [OpcodesBch2023.OP_HASH256]: conditionallyEvaluate(
            opHash256ChipLimits({ sha256, strict: true }),
          ),
        },
      ),
      [OpcodesBch2026.OP_BEGIN]: opBegin,
      [OpcodesBch2026.OP_UNTIL]: opUntil,
    },
    success: (state) => {
      const result = instructionSet.success(state);
      if (
        typeof result === 'string' &&
        result.includes(AuthenticationErrorCommon.nonEmptyControlStack)
      )
        return result.replace(
          AuthenticationErrorCommon.nonEmptyControlStack,
          AuthenticationErrorBch2026.nonEmptyControlStack,
        );
      return result;
    },
  };
};
