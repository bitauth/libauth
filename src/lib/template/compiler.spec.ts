/* eslint-disable functional/no-expression-statement */
import test from 'ava';

import { createCompilerCommonSynchronous, hexToBin } from '../lib';

test('createCompilerCommonSynchronous', (t) => {
  const compiler = createCompilerCommonSynchronous({
    scripts: {
      lock: 'OP_DUP OP_HASH160 <some_public_key> OP_EQUALVERIFY OP_CHECKSIG',
    },
    variables: {
      // eslint-disable-next-line camelcase
      some_public_key: {
        type: 'AddressData',
      },
    },
  });
  const resultLock = compiler.generateBytecode('lock', {
    addressData: {
      // eslint-disable-next-line camelcase
      some_public_key: hexToBin('15d16c84669ab46059313bf0747e781f1d13936d'),
    },
  });
  t.deepEqual(resultLock, {
    bytecode: hexToBin('76a91415d16c84669ab46059313bf0747e781f1d13936d88ac'),
    success: true,
  });
});
