import {
  ripemd160 as internalRipemd160,
  secp256k1 as internalSecp256k1,
  sha1 as internalSha1,
  sha256 as internalSha256,
} from '../../../../crypto/crypto.js';
import type {
  AuthenticationProgramBch,
  AuthenticationProgramStateBch2025,
  InstructionSet,
  ResolvedTransactionBch,
  Ripemd160,
  Secp256k1,
  Sha1,
  Sha256,
} from '../../../../lib.js';
import {
  applyError,
  conditionallyEvaluate,
  createOpBin2Num,
  createOpNum2Bin,
  pushOperation,
} from '../../common/common.js';
import { createInstructionSetBch2023 } from '../2023/bch-2023-instruction-set.js';
import { OpcodesBch2023 } from '../2023/bch-2023-opcodes.js';

import { opCodeSeparatorChipLimits } from './bch-2025-code-separator.js';
import { ConsensusBch2025 } from './bch-2025-consensus.js';
import {
  opHash160ChipLimits,
  opHash256ChipLimits,
  opRipemd160ChipLimits,
  opSha1ChipLimits,
  opSha256ChipLimits,
} from './bch-2025-crypto.js';
import { AuthenticationErrorBch2025 } from './bch-2025-errors.js';

/**
 * Initialize a virtual machine using the `BCH_2025_05` instruction set.
 *
 * @param standard - If `true`, the additional `isStandard` validations will be
 * enabled. Transactions that fail these rules are often called "non-standard"
 * and can technically be included by miners in valid blocks, but most network
 * nodes will refuse to relay them. (Default: `true`)
 */
export const createInstructionSetBch2025 = <
  AuthenticationProgramState extends AuthenticationProgramStateBch2025,
>(
  standard = true,
  {
    ripemd160,
    secp256k1,
    sha1,
    sha256,
  }: {
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
    createInstructionSetBch2023<AuthenticationProgramState>(standard, {
      ripemd160,
      secp256k1,
      sha1,
      sha256,
    });
  const conditionallyPush = pushOperation<AuthenticationProgramState>();
  return {
    ...instructionSet,
    every: (state) => {
      if (
        state.stack.length + state.alternateStack.length >
        ConsensusBch2025.maximumStackDepth
      ) {
        return applyError(
          state,
          AuthenticationErrorBch2025.exceededMaximumStackDepth,
        );
      }
      return state;
    },
    initialize: () =>
      ({
        ...instructionSet.initialize?.(),
        hashDigestIterations: 0,
      }) as Partial<AuthenticationProgramStateBch2025> as Partial<AuthenticationProgramState>,
    operations: {
      ...instructionSet.operations,
      [OpcodesBch2023.OP_0]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_1]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_2]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_3]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_4]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_5]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_6]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_7]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_8]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_9]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_10]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_11]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_12]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_13]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_14]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_15]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_16]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_17]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_18]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_19]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_20]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_21]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_22]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_23]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_24]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_25]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_26]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_27]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_28]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_29]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_30]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_31]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_32]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_33]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_34]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_35]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_36]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_37]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_38]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_39]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_40]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_41]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_42]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_43]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_44]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_45]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_46]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_47]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_48]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_49]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_50]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_51]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_52]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_53]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_54]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_55]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_56]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_57]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_58]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_59]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_60]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_61]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_62]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_63]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_64]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_65]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_66]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_67]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_68]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_69]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_70]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_71]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_72]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_73]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_74]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHBYTES_75]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHDATA_1]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHDATA_2]: conditionallyPush,
      [OpcodesBch2023.OP_PUSHDATA_4]: conditionallyPush,
      [OpcodesBch2023.OP_NUM2BIN]: conditionallyEvaluate(
        createOpNum2Bin({
          exceededMaximumStackItemLengthError:
            AuthenticationErrorBch2025.exceededMaximumStackItemLength,
          maximumStackItemLength: ConsensusBch2025.maximumStackItemLength,
        }),
      ),
      [OpcodesBch2023.OP_BIN2NUM]: conditionallyEvaluate(
        createOpBin2Num({
          maximumStackItemLength: ConsensusBch2025.maximumStackItemLength,
        }),
      ),
      [OpcodesBch2023.OP_RIPEMD160]: conditionallyEvaluate(
        opRipemd160ChipLimits({ ripemd160 }),
      ),
      [OpcodesBch2023.OP_SHA1]: conditionallyEvaluate(
        opSha1ChipLimits({ sha1 }),
      ),
      [OpcodesBch2023.OP_SHA256]: conditionallyEvaluate(
        opSha256ChipLimits({ sha256 }),
      ),
      [OpcodesBch2023.OP_HASH160]: conditionallyEvaluate(
        opHash160ChipLimits({ ripemd160, sha256 }),
      ),
      [OpcodesBch2023.OP_HASH256]: conditionallyEvaluate(
        opHash256ChipLimits({ sha256 }),
      ),
      [OpcodesBch2023.OP_CODESEPARATOR]: conditionallyEvaluate(
        opCodeSeparatorChipLimits,
      ),
    },
  };
};
