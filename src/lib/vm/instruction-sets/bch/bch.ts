import {
  instantiateRipemd160,
  instantiateSecp256k1,
  instantiateSha1,
  instantiateSha256,
} from '../../../crypto/crypto';
import { createAuthenticationVirtualMachine } from '../../virtual-machine';

import {
  createInstructionSetBCH,
  getFlagsForInstructionSetBCH,
  instructionSetBCHCurrentStrict,
} from './bch-instruction-sets';

export * from './bch-descriptions';
export * from './bch-errors';
export * from './bch-instruction-sets';
export * from './bch-opcodes';
export * from './bch-operations';
export * from './bch-types';
export * from './fixtures/bitcoin-abc/bitcoin-abc-utils';

/**
 * Initialize a virtual machine using the provided BCH instruction set.
 *
 * @param instructionSet - the VM version to instantiate – by default, the
 * current "strict" VM is used (`instructionSetBCHCurrentStrict`)
 */
export const instantiateVirtualMachineBCH = async (
  instructionSet = instructionSetBCHCurrentStrict
) => {
  const [sha1, sha256, ripemd160, secp256k1] = await Promise.all([
    instantiateSha1(),
    instantiateSha256(),
    instantiateRipemd160(),
    instantiateSecp256k1(),
  ]);
  return createAuthenticationVirtualMachine(
    createInstructionSetBCH({
      flags: getFlagsForInstructionSetBCH(instructionSet),
      ripemd160,
      secp256k1,
      sha1,
      sha256,
    })
  );
};
