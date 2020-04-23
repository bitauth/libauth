/* eslint-disable functional/no-expression-statement */
import test, { Macro } from 'ava';

import { stringify, validateAuthenticationTemplate } from '../lib';

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
  'all IDs must be unique',
  testValidation,
  {
    entities: { a: {}, b: {}, d: {} },
    scenarios: { b: {} },
    scripts: { c: {}, d: {} },
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  'The ID of each entity, script, and scenario in an authentication template must be unique. The following IDs are re-used: "b", "d".'
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
  'If defined, the "tests" property of tested script "a" must be an Array.'
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
  'tested script, valid test',
  testValidation,
  {
    entities: {},
    scenarios: {},
    scripts: { a: { script: '', tests: [{ check: '' }] } },
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  {
    entities: {},
    scenarios: {},
    scripts: { a: { script: '', tests: [{ check: '' }] } },
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
    scripts: {
      a: { name: 42, script: '' },
    },
    supported: ['BCH_2022_11_SPEC'],
    version: 0,
  },
  'If defined, the "name" property of script "a" must be a string.'
);
