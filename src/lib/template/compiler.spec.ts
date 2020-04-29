/* eslint-disable functional/no-expression-statement */
import test from 'ava';

import {
  authenticationTemplateP2pkh,
  authenticationTemplateP2pkhNonHd,
  authenticationTemplateToCompilationEnvironment,
  createCompilerCommonSynchronous,
  hexToBin,
  stringify,
} from '../lib';

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
    bytecode: {
      // eslint-disable-next-line camelcase
      some_public_key: hexToBin('15d16c84669ab46059313bf0747e781f1d13936d'),
    },
  });
  t.deepEqual(resultLock, {
    bytecode: hexToBin('76a91415d16c84669ab46059313bf0747e781f1d13936d88ac'),
    success: true,
  });
});

test('authenticationTemplateToCompilationEnvironment: authenticationTemplateP2pkhNonHd', (t) => {
  const environment = authenticationTemplateToCompilationEnvironment(
    authenticationTemplateP2pkhNonHd
  );
  t.deepEqual(
    environment,
    {
      entityOwnership: {
        key: 'owner',
      },
      lockingScriptTypes: {
        lock: 'standard',
      },
      scripts: {
        lock:
          'OP_DUP\nOP_HASH160 <$(<key.public_key> OP_HASH160\n)> OP_EQUALVERIFY\nOP_CHECKSIG',
        unlock: '<key.schnorr_signature.all_outputs>\n<key.public_key>',
      },
      unlockingScriptTimeLockTypes: {},
      unlockingScripts: {
        unlock: 'lock',
      },
      variables: {
        key: {
          description: 'The private key which controls this wallet.',
          name: 'Key',
          type: 'Key',
        },
      },
    },
    stringify(environment)
  );
});

test('authenticationTemplateToCompilationEnvironment: authenticationTemplateP2pkh', (t) => {
  const environment = authenticationTemplateToCompilationEnvironment(
    authenticationTemplateP2pkh
  );
  t.deepEqual(
    environment,
    {
      entityOwnership: {
        key: 'owner',
      },
      lockingScriptTypes: {
        lock: 'standard',
      },
      scripts: {
        lock:
          'OP_DUP\nOP_HASH160 <$(<key.public_key> OP_HASH160\n)> OP_EQUALVERIFY\nOP_CHECKSIG',
        unlock: '<key.schnorr_signature.all_outputs>\n<key.public_key>',
      },
      unlockingScriptTimeLockTypes: {},
      unlockingScripts: {
        unlock: 'lock',
      },
      variables: {
        key: {
          description: 'The private key which controls this wallet.',
          name: 'Key',
          type: 'HdKey',
        },
      },
    },
    stringify(environment)
  );
});
