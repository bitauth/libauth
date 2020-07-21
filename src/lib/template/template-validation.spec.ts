/* eslint-disable max-lines, functional/no-expression-statement */
import test, { Macro } from 'ava';

import {
  BuiltInVariables,
  stringify,
  validateAuthenticationTemplate,
} from '../lib';

const testValidation: Macro<[
  unknown,
  ReturnType<typeof validateAuthenticationTemplate>
]> = (t, input, expected) => {
  const result = validateAuthenticationTemplate(input);
  t.deepEqual(result, expected, stringify(result));
};

// eslint-disable-next-line functional/immutable-data
testValidation.title = (title) =>
  `validateAuthenticationTemplate: ${title ?? '?'}`;

test(
  'must be an object',
  testValidation,
  'a string',
  'A valid authentication template must be an object.'
);

test(
  'must be version 0',
  testValidation,
  { version: 1 },
  'Only version 0 authentication templates are currently supported.'
);

test(
  'must provide a "supported" property',
  testValidation,
  { supported: 42, version: 0 },
  'Version 0 authentication templates must include a "supported" list of authentication virtual machine versions. Available identifiers are: BCH_2022_11_SPEC, BCH_2022_11, BCH_2022_05_SPEC, BCH_2022_05, BCH_2021_11_SPEC, BCH_2021_11, BCH_2021_05_SPEC, BCH_2021_05, BCH_2020_11_SPEC, BCH_2020_11, BCH_2020_05, BCH_2019_11, BCH_2019_05, BSV_2018_11, BTC_2017_08.'
);

test(
  'must use only known virtual machine identifiers in "supported"',
  testValidation,
  { supported: ['not supported'], version: 0 },
  'Version 0 authentication templates must include a "supported" list of authentication virtual machine versions. Available identifiers are: BCH_2022_11_SPEC, BCH_2022_11, BCH_2022_05_SPEC, BCH_2022_05, BCH_2021_11_SPEC, BCH_2021_11, BCH_2021_05_SPEC, BCH_2021_05, BCH_2020_11_SPEC, BCH_2020_11, BCH_2020_05, BCH_2019_11, BCH_2019_05, BSV_2018_11, BTC_2017_08.'
);

test(
  'may not have empty items in "supported"',
  testValidation,
  // eslint-disable-next-line no-sparse-arrays
  { supported: ['BCH_2020_05', , 'BCH_2020_11_SPEC'], version: 0 },
  'Version 0 authentication templates must include a "supported" list of authentication virtual machine versions. Available identifiers are: BCH_2022_11_SPEC, BCH_2022_11, BCH_2022_05_SPEC, BCH_2022_05, BCH_2021_11_SPEC, BCH_2021_11, BCH_2021_05_SPEC, BCH_2021_05, BCH_2020_11_SPEC, BCH_2020_11, BCH_2020_05, BCH_2019_11, BCH_2019_05, BSV_2018_11, BTC_2017_08.'
);

test(
  '"$schema" must be a string (if present)',
  testValidation,
  { $schema: 42, supported: ['BCH_2022_11_SPEC'], version: 0 },
  'The "$schema" property of an authentication template must be a string.'
);

test(
  '"name" must be a string (if present)',
  testValidation,
  { name: 42, supported: ['BCH_2022_11_SPEC'], version: 0 },
  'The "name" property of an authentication template must be a string.'
);

test(
  '"description" must be a string (if present)',
  testValidation,
  { description: 42, supported: ['BCH_2022_11_SPEC'], version: 0 },
  'The "description" property of an authentication template must be a string.'
);

test(
  '"entities" must be a an object',
  testValidation,
  { entities: 42, scripts: {}, supported: ['BCH_2022_11_SPEC'], version: 0 },
  'The "entities" property of an authentication template must be an object.'
);

test(
  '"scripts" must be a an object',
  testValidation,
  { entities: {}, scripts: 42, supported: ['BCH_2022_11_SPEC'], version: 0 },
  'The "scripts" property of an authentication template must be an object.'
);

test(
  '"scenarios" must be a an object (if present)',
  testValidation,
  {
    entities: {},
    scenarios: 42,
    scripts: {},
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  'If defined, the "scenarios" property of an authentication template must be an object.'
);

test(
  'script shapes are checked',
  testValidation,
  {
    entities: {},
    scenarios: {},
    scripts: { a: 42 },
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  'All authentication template scripts must be objects, but the following scripts are not objects: "a".'
);

test(
  'empty script object',
  testValidation,
  {
    entities: {},
    scenarios: {},
    scripts: { a: {} },
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  'The "script" property of script "a" must be a string.'
);

test(
  'unlocking script, no content',
  testValidation,
  {
    entities: {},
    scenarios: {},
    scripts: { a: { unlocks: 'b' } },
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  'The "script" property of unlocking script "a" must be a string.'
);

test(
  'unlocking script, invalid unlocks',
  testValidation,
  {
    entities: {},
    scenarios: {},
    scripts: { a: { unlocks: 42 } },
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  'The "unlocks" property of unlocking script "a" must be a string.'
);

test(
  'unknown locking script',
  testValidation,
  {
    entities: {},
    scenarios: {},
    scripts: { a: { script: '', unlocks: 'b' } },
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  'The following locking scripts (referenced in "unlocks" properties) were not provided: "b".'
);

test(
  'unlocking script, invalid timeLockType',
  testValidation,
  {
    entities: {},
    scenarios: {},
    scripts: {
      a: { script: '', timeLockType: 'democracy', unlocks: 'b' },
      b: { lockingType: 'p2sh' },
    },
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  'If defined, the "timeLockType" property of unlocking script "a" must be either "timestamp" or "height".'
);

test(
  'unlocking script, invalid name',
  testValidation,
  {
    entities: {},
    scenarios: {},
    scripts: {
      a: { name: 42, script: '', unlocks: 'b' },
      b: { lockingType: 'p2sh' },
    },
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  'If defined, the "name" property of unlocking script "a" must be a string.'
);

test(
  'unlocking script, invalid ageLock',
  testValidation,
  {
    entities: {},
    scenarios: {},
    scripts: {
      a: { ageLock: 42, script: '', unlocks: 'b' },
      b: { lockingType: 'p2sh' },
    },
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  'If defined, the "ageLock" property of unlocking script "a" must be a string.'
);

test(
  'unlocking script, invalid estimate',
  testValidation,
  {
    entities: {},
    scenarios: {},
    scripts: {
      a: { estimate: 42, script: '', unlocks: 'b' },
      b: { lockingType: 'p2sh' },
    },
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  'If defined, the "estimate" property of unlocking script "a" must be a string.'
);

test(
  'unlocking script, invalid passes',
  testValidation,
  {
    entities: {},
    scenarios: {},
    scripts: {
      a: { passes: 42, script: '', unlocks: 'b' },
      b: { lockingType: 'p2sh' },
    },
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  'If defined, the "passes" property of unlocking script "a" must be an array containing only scenario identifiers (strings).'
);

test(
  'unlocking script, invalid fails',
  testValidation,
  {
    entities: {},
    scenarios: {},
    scripts: {
      a: { fails: 42, script: '', unlocks: 'b' },
      b: { lockingType: 'p2sh' },
    },
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  'If defined, the "fails" property of unlocking script "a" must be an array containing only scenario identifiers (strings).'
);

test(
  'unlocking script, invalid "invalid"',
  testValidation,
  {
    entities: {},
    scenarios: {},
    scripts: {
      a: { invalid: 42, script: '', unlocks: 'b' },
      b: { lockingType: 'p2sh' },
    },
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  'If defined, the "invalid" property of unlocking script "a" must be an array containing only scenario identifiers (strings).'
);

test(
  'unlocking script, empty passes item',
  testValidation,
  {
    entities: {},
    scenarios: {},
    scripts: {
      // eslint-disable-next-line no-sparse-arrays
      a: { passes: ['s1', , 's2'], script: '', unlocks: 'b' },
      b: { lockingType: 'p2sh' },
    },
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  'If defined, the "passes" property of unlocking script "a" must be an array containing only scenario identifiers (strings).'
);

test(
  'unlocking script, non-string fails item',
  testValidation,
  {
    entities: {},
    scenarios: {},
    scripts: {
      a: { fails: [0], script: '', unlocks: 'b' },
      b: { lockingType: 'p2sh' },
    },
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  'If defined, the "fails" property of unlocking script "a" must be an array containing only scenario identifiers (strings).'
);

test(
  'unlocking script, non-string invalid item',
  testValidation,
  {
    entities: {},
    scenarios: {},
    scripts: {
      a: { invalid: [0], script: '', unlocks: 'b' },
      b: { lockingType: 'p2sh' },
    },
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  'If defined, the "invalid" property of unlocking script "a" must be an array containing only scenario identifiers (strings).'
);

test(
  'unlocking script, valid ageLock',
  testValidation,
  {
    entities: {},
    scenarios: {},
    scripts: {
      a: { ageLock: '0xffffff', script: '', unlocks: 'b' },
      b: { lockingType: 'p2sh', script: '' },
    },
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  {
    entities: {},
    scenarios: {},
    scripts: {
      a: { ageLock: '0xffffff', script: '', unlocks: 'b' },
      b: { lockingType: 'p2sh', script: '' },
    },
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  }
);

test(
  'locking script, no type',
  testValidation,
  {
    entities: {},
    scenarios: {},
    scripts: { a: { script: '', unlocks: 'b' }, b: {} },
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  'The "lockingType" property of locking script "b" must be either "standard" or "p2sh".'
);

test(
  'locking script, no contents',
  testValidation,
  {
    entities: {},
    scenarios: {},
    scripts: { a: { script: '', unlocks: 'b' }, b: { lockingType: 'p2sh' } },
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  'The "script" property of locking script "b" must be a string.'
);

test(
  'locking script, invalid name',
  testValidation,
  {
    entities: {},
    scenarios: {},
    scripts: {
      a: { script: '', unlocks: 'b' },
      b: { lockingType: 'p2sh', name: 42, script: '' },
    },
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  'If defined, the "name" property of locking script "b" must be a string.'
);

test(
  'tested script, no contents',
  testValidation,
  {
    entities: {},
    scenarios: {},
    scripts: {
      a: { tests: [] },
    },
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  'The "script" property of tested script "a" must be a string.'
);

test(
  'tested script, invalid name',
  testValidation,
  {
    entities: {},
    scenarios: {},
    scripts: {
      a: { name: 42, script: '', tests: [] },
    },
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  'If defined, the "name" property of tested script "a" must be a string.'
);

test(
  'tested script, invalid tests',
  testValidation,
  {
    entities: {},
    scenarios: {},
    scripts: {
      a: { script: '', tests: 42 },
    },
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  'If defined, the "tests" property of tested script "a" must be an array.'
);

test(
  'tested script, test with no check',
  testValidation,
  {
    entities: {},
    scenarios: {},
    scripts: {
      a: { script: '', tests: [{ name: '' }] },
    },
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  'The "check" properties of all tests in tested script "a" must be a strings.'
);

test(
  'tested script, invalid test name',
  testValidation,
  {
    entities: {},
    scenarios: {},
    scripts: {
      a: { script: '', tests: [{ check: '', name: 42 }] },
    },
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  'If defined, the "name" properties of all tests in tested script "a" must be strings.'
);

test(
  'tested script, invalid test setup',
  testValidation,
  {
    entities: {},
    scenarios: {},
    scripts: {
      a: { script: '', tests: [{ check: '', setup: 42 }] },
    },
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  'If defined, the "setup" properties of all tests in tested script "a" must be strings.'
);

test(
  'tested script, invalid passes',
  testValidation,
  {
    entities: {},
    scenarios: {},
    scripts: {
      a: { script: '', tests: [{ check: '', passes: [0] }] },
    },
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  'If defined, the "passes" property of each test in tested script "a" must be an array containing only scenario identifiers (strings).'
);

test(
  'tested script, invalid fails',
  testValidation,
  {
    entities: {},
    scenarios: {},
    scripts: {
      a: { script: '', tests: [{ check: '', fails: [0] }] },
    },
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  'If defined, the "fails" property of each test in tested script "a" must be an array containing only scenario identifiers (strings).'
);

test(
  'tested script, invalid "invalid"',
  testValidation,
  {
    entities: {},
    scenarios: {},
    scripts: {
      a: { script: '', tests: [{ check: '', invalid: [0] }] },
    },
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  'If defined, the "invalid" property of each test in tested script "a" must be an array containing only scenario identifiers (strings).'
);

test(
  'tested script, invalid pushed',
  testValidation,
  {
    entities: {},
    scenarios: {},
    scripts: {
      a: { pushed: 0, script: '', tests: [{ check: '' }] },
    },
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  'If defined, the "pushed" property of tested script "a" must be a boolean value.'
);

test(
  'tested script, valid test',
  testValidation,
  {
    entities: {},
    scenarios: { s1: {}, s2: {}, s3: {} },
    scripts: {
      a: {
        pushed: true,
        script: '',
        tests: [{ check: '' }, { check: '', name: '', setup: '' }],
      },
      b: {
        name: '',
        pushed: false,
        script: '',
        tests: [
          { check: '', fails: ['s1'] },
          { check: '', passes: ['s2'] },
          { check: '', invalid: ['s3'] },
        ],
      },
    },
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  {
    entities: {},
    scenarios: { s1: {}, s2: {}, s3: {} },
    scripts: {
      a: {
        pushed: true,
        script: '',
        tests: [{ check: '' }, { check: '', name: '', setup: '' }],
      },
      b: {
        name: '',
        pushed: false,
        script: '',
        tests: [
          { check: '', fails: ['s1'] },
          { check: '', passes: ['s2'] },
          { check: '', invalid: ['s3'] },
        ],
      },
    },
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  }
);

test(
  "tested script, can't test a locking script",
  testValidation,
  {
    entities: {},
    scenarios: {},
    scripts: {
      a: { script: '', tests: [], unlocks: 'b' },
      b: { lockingType: 'p2sh', script: '', tests: [] },
    },
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  'Locking and unlocking scripts may not have tests, but the following scripts include a "tests" property: "a", "b"'
);

test(
  'other script, invalid name',
  testValidation,
  {
    entities: {},
    scenarios: {},
    scripts: { a: { name: 42, script: '' } },
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  'If defined, the "name" property of script "a" must be a string.'
);

test(
  'invalid entity',
  testValidation,
  {
    entities: { e: 42 },
    scenarios: {},
    scripts: { a: { script: '' } },
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  'All authentication template entities must be objects, but the following entities are not objects: "e".'
);

test(
  'invalid entity description',
  testValidation,
  {
    entities: { e: { description: 42 } },
    scenarios: {},
    scripts: { a: { script: '' } },
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  'If defined, the "description" property of entity "e" must be a string.'
);

test(
  'invalid entity name',
  testValidation,
  {
    entities: { e: { name: 42 } },
    scenarios: {},
    scripts: { a: { script: '' } },
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  'If defined, the "name" property of entity "e" must be a string.'
);

test(
  'invalid entity scripts',
  testValidation,
  {
    entities: { e: { scripts: '' } },
    scenarios: {},
    scripts: { a: { script: '' } },
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  'If defined, the "scripts" property of entity "e" must be an array containing only script identifiers (strings).'
);

test(
  'invalid entity scripts items',
  testValidation,
  {
    // eslint-disable-next-line no-sparse-arrays
    entities: { e: { scripts: ['', , 0, ''] } },
    scenarios: {},
    scripts: { a: { script: '' } },
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  'If defined, the "scripts" property of entity "e" must be an array containing only script identifiers (strings).'
);

test(
  'invalid entity variables',
  testValidation,
  {
    entities: { e: { variables: 42 } },
    scenarios: {},
    scripts: { a: { script: '' } },
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  'If defined, the "variables" property of entity "e" must be an object.'
);

test(
  'variable, wrong type',
  testValidation,
  {
    entities: { e: { variables: { v: 42 } } },
    scenarios: {},
    scripts: { a: { script: '' } },
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  'All authentication template variables must be objects, but the following variables owned by entity "e" are not objects: "v".'
);

test(
  'variable, no type',
  testValidation,
  {
    entities: { e: { variables: { v: {} } } },
    scenarios: {},
    scripts: { a: { script: '' } },
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  'The "type" property of variable "v" must be a valid authentication template variable type. Available types are: "AddressData", "HdKey", "Key", "WalletData".'
);

test(
  'variable, invalid description',
  testValidation,
  {
    entities: {
      e: { variables: { v: { description: 42, type: 'AddressData' } } },
    },
    scenarios: {},
    scripts: { a: { script: '' } },
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  'If defined, the "description" property of variable "v" must be a string.'
);

test(
  'variable, invalid name',
  testValidation,
  {
    entities: {
      e: { variables: { v: { name: 42, type: 'AddressData' } } },
    },
    scenarios: {},
    scripts: { a: { script: '' } },
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  'If defined, the "name" property of variable "v" must be a string.'
);

test(
  'HdKey variable, invalid addressOffset',
  testValidation,
  {
    entities: {
      e: { variables: { v: { addressOffset: '0', type: 'HdKey' } } },
    },
    scenarios: {},
    scripts: { a: { script: '' } },
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  'If defined, the "addressOffset" property of HdKey "v" must be a number.'
);

test(
  'HdKey variable, invalid hdPublicKeyDerivationPath',
  testValidation,
  {
    entities: {
      e: { variables: { v: { hdPublicKeyDerivationPath: 42, type: 'HdKey' } } },
    },
    scenarios: {},
    scripts: { a: { script: '' } },
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  'If defined, the "hdPublicKeyDerivationPath" property of HdKey "v" must be a string.'
);

test(
  'HdKey variable, invalid privateDerivationPath',
  testValidation,
  {
    entities: {
      e: { variables: { v: { privateDerivationPath: 42, type: 'HdKey' } } },
    },
    scenarios: {},
    scripts: { a: { script: '' } },
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  'If defined, the "privateDerivationPath" property of HdKey "v" must be a string.'
);

test(
  'HdKey variable, invalid publicDerivationPath',
  testValidation,
  {
    entities: {
      e: { variables: { v: { publicDerivationPath: 42, type: 'HdKey' } } },
    },
    scenarios: {},
    scripts: { a: { script: '' } },
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  'If defined, the "publicDerivationPath" property of HdKey "v" must be a string.'
);

test(
  'HdKey variable, invalid privateDerivationPath content',
  testValidation,
  {
    entities: {
      e: { variables: { v: { privateDerivationPath: 'bad', type: 'HdKey' } } },
    },
    scenarios: {},
    scripts: { a: { script: '' } },
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  'If defined, the "privateDerivationPath" property of HdKey "v" must be a valid private derivation path, but the provided value is "m". A valid path must begin with "m" and include only "/", "\'", a single "i" address index character, and numbers.'
);

test(
  'HdKey variable, invalid hdPublicKeyDerivationPath content',
  testValidation,
  {
    entities: {
      e: {
        variables: { v: { hdPublicKeyDerivationPath: 'M/0', type: 'HdKey' } },
      },
    },
    scenarios: {},
    scripts: { a: { script: '' } },
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  'If defined, the "hdPublicKeyDerivationPath" property of an HdKey must be a valid private derivation path for the HdKey\'s HD public node, but the provided value for HdKey "v" is "M/0". A valid path must begin with "m" and include only "/", "\'", and numbers (the "i" character cannot be used in "hdPublicKeyDerivationPath").'
);

test(
  'HdKey variable, invalid publicDerivationPath content',
  testValidation,
  {
    entities: {
      e: {
        variables: { v: { publicDerivationPath: 'm/0', type: 'HdKey' } },
      },
    },
    scenarios: {},
    scripts: { a: { script: '' } },
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  'The "publicDerivationPath" property of HdKey "v" must be a valid public derivation path, but the current value is "m/0". Public derivation paths must begin with "M" and include only "/", a single "i" address index character, and numbers. If the "privateDerivationPath" uses hardened derivation, the "publicDerivationPath" should be set to enable public derivation from the "hdPublicKeyDerivationPath".'
);

test(
  'HdKey variable, invalid implied private derivation path',
  testValidation,
  {
    entities: {
      e: {
        variables: {
          v: {
            addressOffset: 0,
            hdPublicKeyDerivationPath: "m/1'",
            privateDerivationPath: "m/2'/i",
            publicDerivationPath: 'M/i',
            type: 'HdKey',
          },
        },
      },
    },
    scenarios: {},
    scripts: { a: { script: '' } },
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  'The "privateDerivationPath" property of HdKey "v" is "m/2\'/i", but the implied private derivation path of "hdPublicKeyDerivationPath" and "publicDerivationPath" is "m/1\'/i". The "publicDerivationPath" property must be set to allow for public derivation of the same HD node derived by "privateDerivationPath" beginning from the HD public key derived at "hdPublicKeyDerivationPath".'
);

test(
  'AddressData variable, valid',
  testValidation,
  {
    entities: { e: { variables: { v: { type: 'AddressData' } } } },
    scenarios: {},
    scripts: { a: { script: '' } },
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  {
    entities: { e: { variables: { v: { type: 'AddressData' } } } },
    scenarios: {},
    scripts: { a: { script: '' } },
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  }
);

test(
  'HdKey variable, valid',
  testValidation,
  {
    entities: {
      e: {
        variables: {
          v: {
            addressOffset: 0,
            hdPublicKeyDerivationPath: "m/0'",
            privateDerivationPath: "m/0'/i",
            publicDerivationPath: 'M/i',
            type: 'HdKey',
          },
        },
      },
    },
    scenarios: {},
    scripts: { a: { script: '' } },
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  {
    entities: {
      e: {
        variables: {
          v: {
            addressOffset: 0,
            hdPublicKeyDerivationPath: "m/0'",
            privateDerivationPath: "m/0'/i",
            publicDerivationPath: 'M/i',
            type: 'HdKey',
          },
        },
      },
    },
    scenarios: {},
    scripts: { a: { script: '' } },
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  }
);

test(
  'Scenario, invalid type',
  testValidation,
  {
    entities: {},
    scenarios: { a: '' },
    scripts: {},
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  'All authentication template scenarios must be objects, but the following scenarios are not objects: "a".'
);

test(
  'Scenario, invalid name',
  testValidation,
  {
    entities: {},
    scenarios: { a: { name: 1 } },
    scripts: {},
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  'If defined, the "name" property of scenario "a" must be a string.'
);

test(
  'Scenario, invalid description',
  testValidation,
  {
    entities: {},
    scenarios: { a: { description: 1 } },
    scripts: {},
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  'If defined, the "description" property of scenario "a" must be a string.'
);

test(
  'Scenario, invalid extends',
  testValidation,
  {
    entities: {},
    scenarios: { a: { extends: 1 } },
    scripts: {},
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  'If defined, the "extends" property of scenario "a" must be a string.'
);

test(
  'Scenario, unknown extends',
  testValidation,
  {
    entities: {},
    scenarios: { a: { extends: 'c' }, b: { extends: 'd' } },
    scripts: {},
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  'If defined, each scenario ID referenced by another scenario\'s "extends" property must exist. Unknown scenario IDs: "c", "d".'
);

test(
  'Scenario, invalid value (negative)',
  testValidation,
  {
    entities: {},
    scenarios: { a: { value: -1 } },
    scripts: {},
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  'If defined, the "value" property of scenario "a" must be either a number or a little-endian, unsigned 64-bit integer as a hexadecimal-encoded string (16 characters).'
);

test(
  'Scenario, invalid value (greater than Number.MAX_SAFE_INTEGER)',
  testValidation,
  {
    entities: {},
    scenarios: { a: { value: Number.MAX_SAFE_INTEGER + 1 } },
    scripts: {},
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  'If defined, the "value" property of scenario "a" must be either a number or a little-endian, unsigned 64-bit integer as a hexadecimal-encoded string (16 characters).'
);

test(
  'Scenario, invalid value (insufficient hex)',
  testValidation,
  {
    entities: {},
    scenarios: { a: { value: '' } },
    scripts: {},
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  'If defined, the "value" property of scenario "a" must be either a number or a little-endian, unsigned 64-bit integer as a hexadecimal-encoded string (16 characters).'
);

test(
  'Scenario, value (hex)',
  testValidation,
  {
    entities: {},
    scenarios: { a: { value: 'ffffffffffffffff' } },
    scripts: {},
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  {
    entities: {},
    scenarios: { a: { value: 'ffffffffffffffff' } },
    scripts: {},
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  }
);

test(
  'Scenario, invalid data',
  testValidation,
  {
    entities: {},
    scenarios: { a: { data: '' } },
    scripts: {},
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  'If defined, the "data" property of scenario "a" must be an object.'
);

test(
  'Scenario, empty data',
  testValidation,
  {
    entities: {},
    scenarios: { a: { data: {} } },
    scripts: {},
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  {
    entities: {},
    scenarios: { a: { data: {} } },
    scripts: {},
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  }
);

test(
  'Scenario, invalid bytecode',
  testValidation,
  {
    entities: {},
    scenarios: { a: { data: { bytecode: 1 } } },
    scripts: {},
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  'If defined, the "data.bytecode" property of scenario "a" must be an object, and each value must be a string.'
);

test(
  'Scenario, valid bytecode',
  testValidation,
  {
    entities: {},
    scenarios: { a: { data: { bytecode: { a: '' } } } },
    scripts: {},
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  {
    entities: {},
    scenarios: { a: { data: { bytecode: { a: '' } } } },
    scripts: {},
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  }
);

test(
  'Scenario, invalid currentBlockHeight (string)',
  testValidation,
  {
    entities: {},
    scenarios: { a: { data: { currentBlockHeight: '42' } } },
    scripts: {},
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  'If defined, the "currentBlockHeight" property of scenario "a" must be a positive integer from 0 to 499,999,999 (inclusive).'
);

test(
  'Scenario, invalid currentBlockHeight (negative)',
  testValidation,
  {
    entities: {},
    scenarios: { a: { data: { currentBlockHeight: -1 } } },
    scripts: {},
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  'If defined, the "currentBlockHeight" property of scenario "a" must be a positive integer from 0 to 499,999,999 (inclusive).'
);

test(
  'Scenario, invalid currentBlockHeight (decimal)',
  testValidation,
  {
    entities: {},
    scenarios: { a: { data: { currentBlockHeight: 1.1 } } },
    scripts: {},
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  'If defined, the "currentBlockHeight" property of scenario "a" must be a positive integer from 0 to 499,999,999 (inclusive).'
);

test(
  'Scenario, invalid currentBlockHeight (exceeds maximum)',
  testValidation,
  {
    entities: {},
    scenarios: { a: { data: { currentBlockHeight: 500000000 } } },
    scripts: {},
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  'If defined, the "currentBlockHeight" property of scenario "a" must be a positive integer from 0 to 499,999,999 (inclusive).'
);

test(
  'Scenario, valid currentBlockHeight',
  testValidation,
  {
    entities: {},
    scenarios: { a: { data: { currentBlockHeight: 0 } } },
    scripts: {},
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  {
    entities: {},
    scenarios: { a: { data: { currentBlockHeight: 0 } } },
    scripts: {},
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  }
);

test(
  'Scenario, invalid currentBlockTime (below minimum)',
  testValidation,
  {
    entities: {},
    scenarios: { a: { data: { currentBlockTime: 1 } } },
    scripts: {},
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  'If defined, the "currentBlockTime" property of scenario "a" must be a positive integer from 500,000,000 to 4,294,967,295 (inclusive).'
);

test(
  'Scenario, valid currentBlockTime',
  testValidation,
  {
    entities: {},
    scenarios: { a: { data: { currentBlockTime: 500000000 } } },
    scripts: {},
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  {
    entities: {},
    scenarios: { a: { data: { currentBlockTime: 500000000 } } },
    scripts: {},
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  }
);

test(
  'Scenario, invalid data.hdKeys',
  testValidation,
  {
    entities: {},
    scenarios: { a: { data: { hdKeys: '' } } },
    scripts: {},
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  'If defined, the "data.hdKeys" property of scenario "a" must be an object.'
);

test(
  'Scenario, invalid data.hdKeys.addressIndex (string)',
  testValidation,
  {
    entities: {},
    scenarios: { a: { data: { hdKeys: { addressIndex: '1' } } } },
    scripts: {},
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  'If defined, the "data.hdKeys.addressIndex" property of scenario "a" must be a positive integer between 0 and 2,147,483,648 (inclusive).'
);

test(
  'Scenario, invalid data.hdKeys.addressIndex (negative)',
  testValidation,
  {
    entities: {},
    scenarios: { a: { data: { hdKeys: { addressIndex: -1 } } } },
    scripts: {},
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  'If defined, the "data.hdKeys.addressIndex" property of scenario "a" must be a positive integer between 0 and 2,147,483,648 (inclusive).'
);

test(
  'Scenario, invalid data.hdKeys.addressIndex (decimal)',
  testValidation,
  {
    entities: {},
    scenarios: { a: { data: { hdKeys: { addressIndex: 1.3 } } } },
    scripts: {},
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  'If defined, the "data.hdKeys.addressIndex" property of scenario "a" must be a positive integer between 0 and 2,147,483,648 (inclusive).'
);

test(
  'Scenario, invalid data.hdKeys.addressIndex (exceeds maximum)',
  testValidation,
  {
    entities: {},
    scenarios: { a: { data: { hdKeys: { addressIndex: 2147483649 } } } },
    scripts: {},
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  'If defined, the "data.hdKeys.addressIndex" property of scenario "a" must be a positive integer between 0 and 2,147,483,648 (inclusive).'
);

test(
  'Scenario, invalid data.hdKeys.hdPublicKeys',
  testValidation,
  {
    entities: {},
    scenarios: { a: { data: { hdKeys: { hdPublicKeys: 1 } } } },
    scripts: {},
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  'If defined, the "data.hdKeys.hdPublicKeys" property of scenario "a" must be an object, and each value must be a string.'
);

test(
  'Scenario, invalid data.hdKeys.hdPublicKeys (non-string value)',
  testValidation,
  {
    entities: {},
    scenarios: { a: { data: { hdKeys: { hdPublicKeys: { e: 1 } } } } },
    scripts: {},
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  'If defined, the "data.hdKeys.hdPublicKeys" property of scenario "a" must be an object, and each value must be a string.'
);

test(
  'Scenario, invalid data.hdKeys.hdPrivateKeys',
  testValidation,
  {
    entities: {},
    scenarios: { a: { data: { hdKeys: { hdPrivateKeys: 1 } } } },
    scripts: {},
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  'If defined, the "data.hdKeys.hdPrivateKeys" property of scenario "a" must be an object, and each value must be a string.'
);

test(
  'Scenario, invalid data.hdKeys.hdPrivateKeys (non-string value)',
  testValidation,
  {
    entities: {},
    scenarios: { a: { data: { hdKeys: { hdPrivateKeys: { e: 1 } } } } },
    scripts: {},
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  'If defined, the "data.hdKeys.hdPrivateKeys" property of scenario "a" must be an object, and each value must be a string.'
);

test(
  'Scenario, valid data.hdKeys',
  testValidation,
  {
    entities: { e: {}, f: {} },
    scenarios: {
      a: {
        data: {
          hdKeys: {
            addressIndex: 1,
            hdPrivateKeys: { f: '' },
            hdPublicKeys: { e: '' },
          },
        },
      },
      b: {
        data: { hdKeys: {} },
      },
    },
    scripts: {},
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  {
    entities: { e: {}, f: {} },
    scenarios: {
      a: {
        data: {
          hdKeys: {
            addressIndex: 1,
            hdPrivateKeys: { f: '' },
            hdPublicKeys: { e: '' },
          },
        },
      },
      b: {
        data: { hdKeys: {} },
      },
    },
    scripts: {},
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  }
);

test(
  'Scenario, invalid data.keys',
  testValidation,
  {
    entities: {},
    scenarios: { a: { data: { keys: '' } } },
    scripts: {},
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  'If defined, the "data.keys" property of scenario "a" must be an object.'
);

test(
  'Scenario, empty data.keys',
  testValidation,
  {
    entities: {},
    scenarios: { a: { data: { keys: {} } } },
    scripts: {},
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  {
    entities: {},
    scenarios: { a: { data: { keys: {} } } },
    scripts: {},
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  }
);

test(
  'Scenario, invalid data.keys.privateKeys',
  testValidation,
  {
    entities: {},
    scenarios: { a: { data: { keys: { privateKeys: 1 } } } },
    scripts: {},
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  'If defined, the "data.keys.privateKeys" property of scenario "a" must be an object, and each value must be a 32-byte, hexadecimal-encoded private key.'
);

test(
  'Scenario, invalid data.keys.privateKeys (non-string value)',
  testValidation,
  {
    entities: {},
    scenarios: { a: { data: { keys: { privateKeys: { b: 1 } } } } },
    scripts: {},
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  'If defined, the "data.keys.privateKeys" property of scenario "a" must be an object, and each value must be a 32-byte, hexadecimal-encoded private key.'
);

test(
  'Scenario, valid data.keys',
  testValidation,
  {
    entities: {},
    scenarios: {
      a: {
        data: {
          keys: {
            privateKeys: {
              b:
                '0000000000000000000000000000000000000000000000000000000000000001',
            },
          },
        },
      },
    },
    scripts: {},
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  {
    entities: {},
    scenarios: {
      a: {
        data: {
          keys: {
            privateKeys: {
              b:
                '0000000000000000000000000000000000000000000000000000000000000001',
            },
          },
        },
      },
    },
    scripts: {},
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  }
);

test(
  'Scenario, invalid transaction',
  testValidation,
  {
    entities: {},
    scenarios: { a: { transaction: '' } },
    scripts: {},
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  'If defined, the "transaction" property of scenario "a" must be an object.'
);

test(
  'Scenario, empty transaction',
  testValidation,
  {
    entities: {},
    scenarios: { a: { transaction: {} } },
    scripts: {},
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  {
    entities: {},
    scenarios: { a: { transaction: {} } },
    scripts: {},
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  }
);

test(
  'Scenario, invalid transaction.locktime',
  testValidation,
  {
    entities: {},
    scenarios: { a: { transaction: { locktime: '' } } },
    scripts: {},
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  'If defined, the "locktime" property of scenario "a" must be an integer between 0 and 4,294,967,295 (inclusive).'
);

test(
  'Scenario, valid transaction.locktime',
  testValidation,
  {
    entities: {},
    scenarios: { a: { transaction: { locktime: 1 } } },
    scripts: {},
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  {
    entities: {},
    scenarios: { a: { transaction: { locktime: 1 } } },
    scripts: {},
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  }
);

test(
  'Scenario, invalid transaction.version',
  testValidation,
  {
    entities: {},
    scenarios: { a: { transaction: { version: '' } } },
    scripts: {},
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  'If defined, the "version" property of scenario "a" must be an integer between 0 and 4,294,967,295 (inclusive).'
);

test(
  'Scenario, valid transaction.version',
  testValidation,
  {
    entities: {},
    scenarios: { a: { transaction: { version: 1 } } },
    scripts: {},
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  {
    entities: {},
    scenarios: { a: { transaction: { version: 1 } } },
    scripts: {},
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  }
);

test(
  'Scenario, invalid transaction.inputs (no inputs)',
  testValidation,
  {
    entities: {},
    scenarios: { a: { transaction: { inputs: [] } } },
    scripts: {},
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  'If defined, the "transaction.inputs" array of scenario "a" must have exactly one input under test (an "unlockingBytecode" set to "null").'
);

test(
  'Scenario, invalid transaction.inputs (sparse array)',
  testValidation,
  {
    entities: {},
    scenarios: {
      // eslint-disable-next-line no-sparse-arrays
      a: { transaction: { inputs: [, { unlockingBytecode: true }] } },
    },
    scripts: {},
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  'If defined, the "transaction.inputs" property of scenario "a" must be an array of scenario input objects.'
);

test(
  'Scenario, invalid transaction input outpointIndex (negative)',
  testValidation,
  {
    entities: {},
    scenarios: {
      a: {
        transaction: {
          inputs: [{ outpointIndex: -1, unlockingBytecode: true }],
        },
      },
    },
    scripts: {},
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  'If defined, the "outpointIndex" property of input 0 in scenario "a" must be a positive integer.'
);

test(
  'Scenario, invalid transaction input outpointTransactionHash (non-string)',
  testValidation,
  {
    entities: {},
    scenarios: {
      a: {
        transaction: {
          inputs: [{ outpointTransactionHash: 1, unlockingBytecode: true }],
        },
      },
    },
    scripts: {},
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  'If defined, the "outpointTransactionHash" property of input 0 in scenario "a" must be a 32-byte, hexadecimal-encoded hash (string).'
);

test(
  'Scenario, invalid transaction input outpointTransactionHash (incorrect length)',
  testValidation,
  {
    entities: {},
    scenarios: {
      a: {
        transaction: {
          inputs: [
            { outpointTransactionHash: 'beef', unlockingBytecode: true },
          ],
        },
      },
    },
    scripts: {},
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  'If defined, the "outpointTransactionHash" property of input 0 in scenario "a" must be a 32-byte, hexadecimal-encoded hash (string).'
);

test(
  'Scenario, invalid transaction input sequenceNumber',
  testValidation,
  {
    entities: {},
    scenarios: {
      a: {
        transaction: {
          inputs: [{ sequenceNumber: -1, unlockingBytecode: true }],
        },
      },
    },
    scripts: {},
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  'If defined, the "sequenceNumber" property of input 0 in scenario "a" must be a number between 0 and 4294967295 (inclusive).'
);

test(
  'Scenario, invalid transaction input unlockingBytecode',
  testValidation,
  {
    entities: {},
    scenarios: {
      a: {
        transaction: {
          inputs: [{ unlockingBytecode: 1 }],
        },
      },
    },
    scripts: {},
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  'If defined, the "unlockingBytecode" property of input 0 in scenario "a" must be either a null value or a hexadecimal-encoded string.'
);

test(
  'Scenario, valid transaction.inputs',
  testValidation,
  {
    entities: {},
    scenarios: {
      a: {
        transaction: {
          inputs: [
            {
              outpointIndex: 0,
              outpointTransactionHash:
                '0000000000000000000000000000000000000000000000000000000000000000',
              sequenceNumber: 0,
              unlockingBytecode: 'beef',
            },
            {},
          ],
        },
      },
    },
    scripts: {},
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  {
    entities: {},
    scenarios: {
      a: {
        transaction: {
          inputs: [
            {
              outpointIndex: 0,
              outpointTransactionHash:
                '0000000000000000000000000000000000000000000000000000000000000000',
              sequenceNumber: 0,
              unlockingBytecode: 'beef',
            },
            {},
          ],
        },
      },
    },
    scripts: {},
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  }
);

test(
  'Scenario, empty transaction.outputs',
  testValidation,
  {
    entities: {},
    scenarios: {
      a: {
        transaction: {
          outputs: [],
        },
      },
    },
    scripts: {},
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  'If defined, the "transaction.outputs" property of scenario "a" must be have at least one output.'
);

test(
  'Scenario, invalid transaction.outputs (sparse array)',
  testValidation,
  {
    entities: {},
    scenarios: {
      // eslint-disable-next-line no-sparse-arrays
      a: { transaction: { outputs: [, { lockingBytecode: 'beef' }] } },
    },
    scripts: {},
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  'If defined, the "transaction.outputs" property of scenario "a" must be an array of scenario output objects.'
);

test(
  'Scenario, invalid transaction output lockingBytecode type',
  testValidation,
  {
    entities: {},
    scenarios: {
      a: {
        transaction: {
          outputs: [{ lockingBytecode: 1 }],
        },
      },
    },
    scripts: {},
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  'If defined, the "lockingBytecode" property of output 0 in scenario "a" must be a string or an object.'
);

test(
  'Scenario, invalid transaction output lockingBytecode (non-hex)',
  testValidation,
  {
    entities: {},
    scenarios: {
      a: {
        transaction: {
          outputs: [{ lockingBytecode: 'g' }],
        },
      },
    },
    scripts: {},
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  'If the "lockingBytecode" property of output 0 in scenario "a" is a string, it must be a valid, hexadecimal-encoded locking bytecode.'
);

test(
  'Scenario, invalid transaction output lockingBytecode.script',
  testValidation,
  {
    entities: {},
    scenarios: {
      a: {
        transaction: {
          outputs: [{ lockingBytecode: { script: false } }],
        },
      },
    },
    scripts: {},
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  'If defined, the "script" property of output 0 in scenario "a" must be a hexadecimal-encoded string or "null".'
);

test(
  'Scenario, invalid transaction output lockingBytecode.override',
  testValidation,
  {
    entities: {},
    scenarios: {
      a: {
        transaction: {
          outputs: [{ lockingBytecode: { overrides: false } }],
        },
      },
    },
    scripts: {},
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  'If defined, the "overrides" property of output 0 in scenario "a" must be an object.'
);

test(
  'Scenario, invalid transaction output satoshis',
  testValidation,
  {
    entities: {},
    scenarios: {
      a: {
        transaction: {
          outputs: [{ satoshis: false }],
        },
      },
    },
    scripts: {},
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  'If defined, the "satoshis" property of output 0 in scenario "a" must be either a number or a little-endian, unsigned 64-bit integer as a hexadecimal-encoded string (16 characters).'
);

test(
  'Scenario, valid transaction output',
  testValidation,
  {
    entities: {},
    scenarios: {
      a: {
        transaction: {
          outputs: [
            {
              lockingBytecode: {
                overrides: { bytecode: { a: 'beef' } },
                script: 'beef',
              },
              satoshis: 'ffffffffffffffff',
            },
            {
              lockingBytecode: {},
            },
            {
              lockingBytecode: 'beef',
            },
          ],
        },
      },
    },
    scripts: {},
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  {
    entities: {},
    scenarios: {
      a: {
        transaction: {
          outputs: [
            {
              lockingBytecode: {
                overrides: { bytecode: { a: 'beef' } },
                script: 'beef',
              },
              satoshis: 'ffffffffffffffff',
            },
            {
              lockingBytecode: {},
            },
            {
              lockingBytecode: 'beef',
            },
          ],
        },
      },
    },
    scripts: {},
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  }
);

test(
  'built-in identifiers may not be re-used',
  testValidation,
  {
    entities: { [BuiltInVariables.currentBlockHeight]: {} },
    scripts: { [BuiltInVariables.signingSerialization]: { script: '' } },
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  'Built-in identifiers may not be re-used by any entity, variable, script, or scenario. The following built-in identifiers are re-used: "current_block_height", "signing_serialization".'
);

test(
  'all IDs must be unique',
  testValidation,
  {
    entities: { a: {}, b: {}, d: {} },
    scenarios: { b: {} },
    scripts: { c: { script: '' }, d: { script: '' } },
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  'The ID of each entity, variable, script, and scenario in an authentication template must be unique. The following IDs are re-used: "b", "d".'
);

test(
  'all entity script IDs must exist',
  testValidation,
  {
    entities: { a: { scripts: ['b', 'c'] } },
    scripts: {},
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  'Only known scripts may be assigned to entities. The following script IDs are not provided in this template: "b", "c".'
);

test(
  'all scenarios reference by scripts must exist',
  testValidation,
  {
    entities: {},
    scenarios: {},
    scripts: {
      a: {
        estimate: 's3',
        fails: ['s1', 's4'],
        invalid: ['s6'],
        passes: ['s3', 's5'],
        script: '',
        unlocks: 'c',
      },
      b: {
        script: '',
        tests: [
          { check: '', fails: ['s1'] },
          { check: '', passes: ['s2'] },
          { check: '', invalid: ['s7'] },
        ],
      },
      c: {
        lockingType: 'p2sh',
        script: '',
      },
    },
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  'Only known scenarios may be referenced by scripts. The following scenario IDs are not provided in this template: "s1", "s2", "s3", "s4", "s5", "s6", "s7".'
);

test(
  'all entities referenced by data.hdKeys must exist',
  testValidation,
  {
    entities: { a: {}, b: {} },
    scenarios: {
      s: {
        data: {
          hdKeys: {
            hdPrivateKeys: { b: '', c: '' },
            hdPublicKeys: { a: '', d: '' },
          },
        },
        transaction: {
          outputs: [
            {
              lockingBytecode: {
                overrides: {
                  hdKeys: {
                    hdPrivateKeys: { b: '', c: '', f: '' },
                    hdPublicKeys: { a: '', e: '' },
                  },
                },
              },
            },
            {
              lockingBytecode: {},
            },
          ],
        },
      },
    },
    scripts: {},
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  'Only known entities may be referenced by hdKeys properties within scenarios. The following entity IDs are not provided in this template: "c", "d", "e", "f".'
);
