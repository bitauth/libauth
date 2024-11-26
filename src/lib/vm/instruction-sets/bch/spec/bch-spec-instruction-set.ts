import {
  ripemd160 as internalRipemd160,
  secp256k1 as internalSecp256k1,
  sha1 as internalSha1,
  sha256 as internalSha256,
} from '../../../../crypto/crypto.js';
import type {
  AuthenticationProgramBch,
  AuthenticationProgramStateBchSpec,
  InstructionSet,
  ResolvedTransactionBch,
  Ripemd160,
  Secp256k1,
  Sha1,
  Sha256,
} from '../../../../lib.js';
import { createInstructionSetBch2026 } from '../2026/bch-2026-instruction-set.js';

import { ConsensusBchSpec } from './bch-spec-consensus.js';

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
  Consensus extends typeof ConsensusBchSpec = typeof ConsensusBchSpec,
>(
  standard = true,
  {
    consensus = ConsensusBchSpec as Consensus,
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
    createInstructionSetBch2026<AuthenticationProgramState>(standard, {
      consensus,
      ripemd160,
      secp256k1,
      sha1,
      sha256,
    });
  const stackSize = (stack: Uint8Array[]) =>
    stack.reduce((sum, item) => sum + item.length, 0);
  return {
    ...instructionSet,
    every: (state) => {
      const nextState = instructionSet.every?.(state) ?? state;
      /**
       * For benchmarking/research purposes only, not required by the protocol.
       */
      const memoryUsage =
        stackSize(nextState.stack) + stackSize(nextState.alternateStack);
      // eslint-disable-next-line functional/no-conditional-statements
      if (nextState.metrics.maxMemoryUsage < memoryUsage) {
        // eslint-disable-next-line functional/no-expression-statements, functional/immutable-data
        nextState.metrics.maxMemoryUsage = memoryUsage;
      }
      return nextState;
    },
  };
};
