import {
  ripemd160 as internalRipemd160,
  secp256k1 as internalSecp256k1,
  sha1 as internalSha1,
  sha256 as internalSha256,
} from '../../../crypto/crypto.js';
import type {
  AuthenticationProgramBch,
  AuthenticationProgramStateBch,
  InstructionSet,
  ResolvedTransactionBch,
  Ripemd160,
  Secp256k1,
  Sha1,
  Sha256,
} from '../../../lib.js';
import { createInstructionSetBch2023 } from '../bch/2023/bch-2023-instruction-set.js';
import { undefinedOperation } from '../common/common.js';

import { ConsensusXec } from './xec-2020-consensus.js';
import { OpcodesXec } from './xec-opcodes.js';

/**
 * create an instance of the XEC virtual machine instruction set.
 *
 * @param standard - If `true`, the additional `isStandard` validations will be
 * enabled. Transactions that fail these rules are often called "non-standard"
 * and can technically be included by miners in valid blocks, but most network
 * nodes will refuse to relay them. (Default: `true`)
 */
export const createInstructionSetXec = <
  AuthenticationProgramState extends AuthenticationProgramStateBch,
  Consensus extends typeof ConsensusXec = typeof ConsensusXec,
>(
  standard = true,
  {
    consensus = ConsensusXec as Consensus,
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
  const instructionSet = createInstructionSetBch2023<
    AuthenticationProgramState,
    Consensus
  >(standard, {
    consensus,
    ripemd160,
    secp256k1,
    sha1,
    sha256,
  });
  return {
    ...instructionSet,
    operations: {
      ...instructionSet.operations,
      [OpcodesXec.OP_MUL]: undefinedOperation,
      [OpcodesXec.OP_UNKNOWN192]: undefinedOperation,
      [OpcodesXec.OP_UNKNOWN193]: undefinedOperation,
      [OpcodesXec.OP_UNKNOWN194]: undefinedOperation,
      [OpcodesXec.OP_UNKNOWN195]: undefinedOperation,
      [OpcodesXec.OP_UNKNOWN196]: undefinedOperation,
      [OpcodesXec.OP_UNKNOWN197]: undefinedOperation,
      [OpcodesXec.OP_UNKNOWN198]: undefinedOperation,
      [OpcodesXec.OP_UNKNOWN199]: undefinedOperation,
      [OpcodesXec.OP_UNKNOWN200]: undefinedOperation,
      [OpcodesXec.OP_UNKNOWN201]: undefinedOperation,
      [OpcodesXec.OP_UNKNOWN202]: undefinedOperation,
      [OpcodesXec.OP_UNKNOWN203]: undefinedOperation,
      [OpcodesXec.OP_UNKNOWN204]: undefinedOperation,
      [OpcodesXec.OP_UNKNOWN205]: undefinedOperation,
      [OpcodesXec.OP_UNKNOWN206]: undefinedOperation,
      [OpcodesXec.OP_UNKNOWN207]: undefinedOperation,
      [OpcodesXec.OP_UNKNOWN208]: undefinedOperation,
      [OpcodesXec.OP_UNKNOWN209]: undefinedOperation,
      [OpcodesXec.OP_UNKNOWN210]: undefinedOperation,
      [OpcodesXec.OP_UNKNOWN211]: undefinedOperation,
    },
  };
};
