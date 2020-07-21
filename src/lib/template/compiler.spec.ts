/* eslint-disable functional/no-expression-statement, camelcase, @typescript-eslint/naming-convention */
import test from 'ava';

import {
  AuthenticationTemplate,
  authenticationTemplateP2pkh,
  authenticationTemplateP2pkhNonHd,
  authenticationTemplateToCompilationEnvironment,
  authenticationTemplateToCompilationEnvironmentVirtualizedTests,
  createCompilerCommonSynchronous,
  hexToBin,
  stringify,
  stringifyTestVector,
} from '../lib';

test('createCompilerCommonSynchronous', (t) => {
  const compiler = createCompilerCommonSynchronous({
    scripts: {
      lock: 'OP_DUP OP_HASH160 <some_public_key> OP_EQUALVERIFY OP_CHECKSIG',
    },
    variables: {
      some_public_key: {
        type: 'AddressData',
      },
    },
  });
  const resultLock = compiler.generateBytecode('lock', {
    bytecode: {
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

test('authenticationTemplateToCompilationEnvironmentVirtualizedTests', (t) => {
  const environment = authenticationTemplateToCompilationEnvironmentVirtualizedTests(
    {
      entities: {},
      scripts: {
        add_two: {
          script: '<2> OP_ADD',
          tests: [
            { check: '<3> OP_EQUAL', setup: '<1>' },
            { check: '<4> OP_EQUAL', setup: '<2>' },
          ],
        },
        message: {
          pushed: true,
          script: '"abc"',
          tests: [{ check: '<"abc"> OP_EQUAL' }],
        },
        push_three: {
          script: '<3>',
          tests: [{ check: '<3> OP_EQUAL' }],
        },
        unrelated: {
          script: '<1>',
        },
      },
      supported: ['BCH_2019_05'],
      version: 0,
    } as AuthenticationTemplate
  );

  t.deepEqual(
    environment,
    {
      entityOwnership: {},
      lockingScriptTypes: {},
      scripts: {
        __virtualized_test_check_add_two_0: '<3> OP_EQUAL',
        __virtualized_test_check_add_two_1: '<4> OP_EQUAL',
        __virtualized_test_check_message_0: '<"abc"> OP_EQUAL',
        __virtualized_test_check_push_three_0: '<3> OP_EQUAL',
        __virtualized_test_lock_add_two_0:
          'add_two __virtualized_test_check_add_two_0',
        __virtualized_test_lock_add_two_1:
          'add_two __virtualized_test_check_add_two_1',
        __virtualized_test_lock_message_0:
          '<message> __virtualized_test_check_message_0',
        __virtualized_test_lock_push_three_0:
          'push_three __virtualized_test_check_push_three_0',
        __virtualized_test_unlock_add_two_0: '<1>',
        __virtualized_test_unlock_add_two_1: '<2>',
        __virtualized_test_unlock_message_0: '',
        __virtualized_test_unlock_push_three_0: '',
        add_two: '<2> OP_ADD',
        message: '"abc"',
        push_three: '<3>',
        unrelated: '<1>',
      },
      unlockingScriptTimeLockTypes: {},
      unlockingScripts: {
        __virtualized_test_unlock_add_two_0:
          '__virtualized_test_lock_add_two_0',
        __virtualized_test_unlock_add_two_1:
          '__virtualized_test_lock_add_two_1',
        __virtualized_test_unlock_message_0:
          '__virtualized_test_lock_message_0',
        __virtualized_test_unlock_push_three_0:
          '__virtualized_test_lock_push_three_0',
      },
      variables: {},
    },
    stringifyTestVector(environment)
  );
});
