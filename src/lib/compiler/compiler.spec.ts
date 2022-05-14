/* eslint-disable camelcase */
import test from 'ava';

import type { AuthenticationTemplate } from '../lib';
import {
  authenticationTemplateP2pkh,
  authenticationTemplateP2pkhNonHd,
  authenticationTemplateToCompilerConfiguration,
  createCompilerCommon,
  hexToBin,
  stringify,
  stringifyTestVector,
} from '../lib.js';

test('createCompilerCommon', (t) => {
  const compiler = createCompilerCommon({
    scripts: {
      lock: 'OP_DUP OP_HASH160 <some_public_key> OP_EQUALVERIFY OP_CHECKSIG',
    },
    variables: {
      some_public_key: {
        type: 'AddressData',
      },
    },
  });
  const resultLock = compiler.generateBytecode({
    data: {
      bytecode: {
        some_public_key: hexToBin('15d16c84669ab46059313bf0747e781f1d13936d'),
      },
    },
    scriptId: 'lock',
  });
  t.deepEqual(resultLock, {
    bytecode: hexToBin('76a91415d16c84669ab46059313bf0747e781f1d13936d88ac'),
    success: true,
  });
});

test('authenticationTemplateToCompilerConfiguration: authenticationTemplateP2pkhNonHd', (t) => {
  const configuration = authenticationTemplateToCompilerConfiguration(
    authenticationTemplateP2pkhNonHd
  );
  t.deepEqual(
    configuration,
    {
      entityOwnership: {
        key: 'owner',
      },
      lockingScriptTypes: {
        lock: 'standard',
      },
      scripts: {
        lock: 'OP_DUP\nOP_HASH160 <$(<key.public_key> OP_HASH160\n)> OP_EQUALVERIFY\nOP_CHECKSIG',
        unlock: '<key.schnorr_signature.all_outputs>\n<key.public_key>',
      },
      unlockingScriptTimeLockTypes: {},
      unlockingScripts: {
        unlock: 'lock',
      },
      variables: {
        key: {
          description: 'The private key that controls this wallet.',
          name: 'Key',
          type: 'Key',
        },
      },
    },
    stringify(configuration)
  );
});

test('authenticationTemplateToCompilerConfiguration: authenticationTemplateP2pkh', (t) => {
  const configuration = authenticationTemplateToCompilerConfiguration(
    authenticationTemplateP2pkh
  );
  t.deepEqual(
    configuration,
    {
      entityOwnership: {
        key: 'owner',
      },
      lockingScriptTypes: {
        lock: 'standard',
      },
      scripts: {
        lock: 'OP_DUP\nOP_HASH160 <$(<key.public_key> OP_HASH160\n)> OP_EQUALVERIFY\nOP_CHECKSIG',
        unlock: '<key.schnorr_signature.all_outputs>\n<key.public_key>',
      },
      unlockingScriptTimeLockTypes: {},
      unlockingScripts: {
        unlock: 'lock',
      },
      variables: {
        key: {
          description: 'The private key that controls this wallet.',
          name: 'Key',
          type: 'HdKey',
        },
      },
    },
    stringify(configuration)
  );
});

test('authenticationTemplateToCompilerConfiguration: virtualized tests', (t) => {
  const configuration = authenticationTemplateToCompilerConfiguration({
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
  } as AuthenticationTemplate);

  t.deepEqual(
    configuration,
    {
      entityOwnership: {},
      lockingScriptTypes: {},
      scripts: {
        add_two: '<2> OP_ADD',
        'add_two.0.check': '<3> OP_EQUAL',
        'add_two.0.lock': 'add_two add_two.0.check',
        'add_two.0.unlock': '<1>',
        'add_two.1.check': '<4> OP_EQUAL',
        'add_two.1.lock': 'add_two add_two.1.check',
        'add_two.1.unlock': '<2>',
        message: '"abc"',
        'message.0.check': '<"abc"> OP_EQUAL',
        'message.0.lock': '<message> message.0.check',
        'message.0.unlock': '',
        push_three: '<3>',
        'push_three.0.check': '<3> OP_EQUAL',
        'push_three.0.lock': 'push_three push_three.0.check',
        'push_three.0.unlock': '',
        unrelated: '<1>',
      },
      unlockingScriptTimeLockTypes: {},
      unlockingScripts: {
        'add_two.0.unlock': 'add_two.0.lock',
        'add_two.1.unlock': 'add_two.1.lock',
        'message.0.unlock': 'message.0.lock',
        'push_three.0.unlock': 'push_three.0.lock',
      },
      variables: {},
    },
    stringifyTestVector(configuration)
  );
});
