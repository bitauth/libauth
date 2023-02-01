/* eslint-disable camelcase, max-lines */
import test from 'ava';

import type {
  AuthenticationTemplate,
  ExtendedScenarioDefinition,
  PartialExactOptional,
  Scenario,
} from '../lib.js';
import {
  authenticationTemplateP2pkh,
  authenticationTemplateP2pkhNonHd,
  authenticationTemplateToCompilerBCH,
  authenticationTemplateToCompilerConfiguration,
  extendedScenarioDefinitionToCompilationData,
  extendScenarioDefinition,
  extendScenarioDefinitionData,
  generateDefaultScenarioDefinition,
  generateExtendedScenario,
  hexToBin,
  importAuthenticationTemplate,
  sha256,
  sha512,
  stringifyTestVector,
} from '../lib.js';
import { cashChannelsJson } from '../transaction/transaction-e2e.spec.helper.js';

import { createCompilerBCH } from './compiler.js';

test('generateDefaultScenarioDefinition: empty', (t) => {
  const scenario = generateDefaultScenarioDefinition({ scripts: {} });
  t.deepEqual(
    scenario,
    {
      data: {
        currentBlockHeight: 2,
        currentBlockTime: 1231469665,
      },
      sourceOutputs: [
        {
          lockingBytecode: ['slot'],
        },
      ],
      transaction: {
        inputs: [
          {
            unlockingBytecode: ['slot'],
          },
        ],
        locktime: 0,
        outputs: [
          {
            lockingBytecode: {},
          },
        ],
        version: 2,
      },
    },
    stringifyTestVector(scenario)
  );
});

test('generateDefaultScenarioDefinition: missing sha256', (t) => {
  const scenario = generateDefaultScenarioDefinition({
    scripts: {},
    sha512,
    variables: {
      key: {
        description: 'The private key that controls this wallet.',
        name: 'Key',
        type: 'HdKey',
      },
    },
  });
  t.deepEqual(
    scenario,
    'An implementations of "sha256" is required to generate defaults for HD keys, but the "sha256" property is not included in this compiler configuration.',
    stringifyTestVector(scenario)
  );
});

test('generateDefaultScenarioDefinition: missing sha512', (t) => {
  const scenario = generateDefaultScenarioDefinition({
    scripts: {},
    sha256,
    variables: {
      key: {
        description: 'The private key that controls this wallet.',
        name: 'Key',
        type: 'HdKey',
      },
    },
  });
  t.deepEqual(
    scenario,
    'An implementations of "sha512" is required to generate defaults for HD keys, but the "sha512" property is not included in this compiler configuration.',
    stringifyTestVector(scenario)
  );
});

test('extendScenarioDefinitionData: empty', (t) => {
  const extended = extendScenarioDefinitionData({}, {});
  t.deepEqual(extended, {}, stringifyTestVector(extended));
});

test('extendScenarioDefinitionData: 1', (t) => {
  const extended = extendScenarioDefinitionData(
    { hdKeys: { hdPublicKeys: { b: '(hd public key)' } } },
    { bytecode: { test: '<"abc">' } }
  );
  t.deepEqual(
    extended,
    {
      bytecode: { test: '<"abc">' },
      hdKeys: { hdPublicKeys: { b: '(hd public key)' } },
    },
    stringifyTestVector(extended)
  );
});

test('extendScenarioDefinition: empty', (t) => {
  const extended = extendScenarioDefinition({}, {});
  t.deepEqual(extended, {}, stringifyTestVector(extended));
});

test('extendScenarioDefinition: default', (t) => {
  const scenarioParent = generateDefaultScenarioDefinition({
    scripts: {},
  }) as ExtendedScenarioDefinition;
  const extended = extendScenarioDefinition(scenarioParent, {});
  t.deepEqual(
    extended,
    {
      data: {
        currentBlockHeight: 2,
        currentBlockTime: 1231469665,
      },
      sourceOutputs: [
        {
          lockingBytecode: ['slot'],
        },
      ],
      transaction: {
        inputs: [
          {
            unlockingBytecode: ['slot'],
          },
        ],
        locktime: 0,
        outputs: [
          {
            lockingBytecode: {},
          },
        ],
        version: 2,
      },
    },
    stringifyTestVector(extended)
  );
});

test('extendScenarioDefinition: complex extend', (t) => {
  const extended = extendScenarioDefinition(
    {
      sourceOutputs: [
        {
          lockingBytecode: '',
          valueSatoshis: 'ffffffffffffffff',
        },
      ],
      transaction: {
        inputs: [
          {
            unlockingBytecode: ['slot'],
          },
        ],
        locktime: 0,
        outputs: [
          {
            lockingBytecode: '',
          },
        ],
        version: 2,
      },
    },
    {
      data: {
        bytecode: {
          a: 'beef',
        },
        hdKeys: {
          addressIndex: 1,
          hdPrivateKeys: {
            entity1: '(hd private key)',
          },
          hdPublicKeys: {
            entity2: '(hd public key)',
          },
        },
        keys: {
          privateKeys: {
            key: '(key)',
          },
        },
      },
      transaction: {},
    }
  );
  t.deepEqual(
    extended,
    {
      data: {
        bytecode: {
          a: 'beef',
        },
        hdKeys: {
          addressIndex: 1,
          hdPrivateKeys: {
            entity1: '(hd private key)',
          },
          hdPublicKeys: {
            entity2: '(hd public key)',
          },
        },
        keys: {
          privateKeys: {
            key: '(key)',
          },
        },
      },
      sourceOutputs: [
        {
          lockingBytecode: '',
          valueSatoshis: 'ffffffffffffffff',
        },
      ],
      transaction: {
        inputs: [
          {
            unlockingBytecode: ['slot'],
          },
        ],
        locktime: 0,
        outputs: [
          {
            lockingBytecode: '',
          },
        ],
        version: 2,
      },
    },
    stringifyTestVector(extended)
  );
});

test('extendScenarioDefinition: complex extend (2)', (t) => {
  const extended = extendScenarioDefinition(
    {
      data: {
        bytecode: {
          a: 'beef',
        },
        hdKeys: {
          addressIndex: 1,
          hdPrivateKeys: {
            entity1: '(hd private key)',
          },
          hdPublicKeys: {
            entity2: '(hd public key)',
          },
        },
        keys: {
          privateKeys: {
            key: '(key)',
          },
        },
      },
    },
    {
      data: {
        currentBlockHeight: 2,
        currentBlockTime: 1231469665,
      },
      sourceOutputs: [{ valueSatoshis: 'ffffffffffffffff' }],
    }
  );
  t.deepEqual(
    extended,
    {
      data: {
        bytecode: {
          a: 'beef',
        },
        currentBlockHeight: 2,
        currentBlockTime: 1231469665,
        hdKeys: {
          addressIndex: 1,
          hdPrivateKeys: {
            entity1: '(hd private key)',
          },
          hdPublicKeys: {
            entity2: '(hd public key)',
          },
        },
        keys: {
          privateKeys: {
            key: '(key)',
          },
        },
      },
      sourceOutputs: [{ valueSatoshis: 'ffffffffffffffff' }],
    },
    stringifyTestVector(extended)
  );
});

test('generateExtendedScenario: unknown scenario identifier', (t) => {
  const extended = generateExtendedScenario({
    configuration: { scripts: {} },
    scenarioId: 'unknown',
  });
  t.deepEqual(
    extended,
    'Cannot extend scenario "unknown": a scenario with the identifier unknown is not included in this compiler configuration.',
    stringifyTestVector(extended)
  );
});

test('extendedScenarioDefinitionToCompilationData: empty', (t) => {
  const extended = extendedScenarioDefinitionToCompilationData({ data: {} });
  t.deepEqual(extended, {}, stringifyTestVector(extended));
});

test('extendedScenarioDefinitionToCompilationData: empty hdKeys', (t) => {
  const extended = extendedScenarioDefinitionToCompilationData({
    data: { hdKeys: {} },
  });
  t.deepEqual(extended, { hdKeys: {} }, stringifyTestVector(extended));
});

test('generateDefaultScenarioDefinition: authenticationTemplateP2pkhNonHd', (t) => {
  const configuration = authenticationTemplateToCompilerConfiguration(
    authenticationTemplateP2pkhNonHd
  );
  const scenario = generateDefaultScenarioDefinition(configuration);

  t.deepEqual(
    scenario,
    {
      data: {
        currentBlockHeight: 2,
        currentBlockTime: 1231469665,
        keys: {
          privateKeys: {
            key: '0000000000000000000000000000000000000000000000000000000000000001',
          },
        },
      },
      sourceOutputs: [{ lockingBytecode: ['slot'] }],
      transaction: {
        inputs: [{ unlockingBytecode: ['slot'] }],
        locktime: 0,
        outputs: [{ lockingBytecode: {} }],
        version: 2,
      },
    },
    stringifyTestVector(scenario)
  );
});

test('generateDefaultScenarioDefinition: authenticationTemplateP2pkh', (t) => {
  const configuration = {
    ...authenticationTemplateToCompilerConfiguration(
      authenticationTemplateP2pkh
    ),
    sha256,
    sha512,
  };
  const scenario = generateDefaultScenarioDefinition(configuration);
  t.deepEqual(
    scenario,
    {
      data: {
        currentBlockHeight: 2,
        currentBlockTime: 1231469665,
        hdKeys: {
          addressIndex: 0,
          hdPrivateKeys: {
            owner:
              'xprv9s21ZrQH143K3w1RdaeDYJjQpiA1vmm3MBNbpFyRGCP8wf7CvY3rgfLGGpw8YBgb7PitSoXBnRRyAYo8fm24T5to52JAv9mgbvXc82Z3EH3',
          },
        },
      },
      sourceOutputs: [{ lockingBytecode: ['slot'] }],
      transaction: {
        inputs: [{ unlockingBytecode: ['slot'] }],
        locktime: 0,
        outputs: [{ lockingBytecode: {} }],
        version: 2,
      },
    },
    stringifyTestVector(scenario)
  );
});

export const expectScenarioGenerationResult = test.macro<
  [
    string | undefined,
    string | undefined,
    PartialExactOptional<AuthenticationTemplate>,
    Scenario | string,
    PartialExactOptional<
      ReturnType<typeof authenticationTemplateToCompilerConfiguration>
    >?
  ]
>(
  (
    t,
    scenarioId,
    unlockingScriptId,
    templateOverrides,
    expectedResult,
    configurationOverrides
    // eslint-disable-next-line max-params
  ) => {
    const configuration = authenticationTemplateToCompilerConfiguration({
      ...{
        entities: {
          owner: {
            variables: {
              another: { type: 'Key' },
              key1: { type: 'HdKey' },
              var1: { type: 'AddressData' },
            },
          },
        },
        scripts: {
          lock: {
            lockingType: 'standard',
            script: '<var1> OP_DROP OP_DROP OP_1',
          },
          unlock: {
            script: '<key1.schnorr_signature.all_outputs>',
            unlocks: 'lock',
          },
        },
        supported: ['BCH_2020_05'],
        version: 0,
      },
      ...templateOverrides,
    } as AuthenticationTemplate);

    const compiler = createCompilerBCH({
      ...configuration,
      ...(configurationOverrides as Partial<
        ReturnType<typeof authenticationTemplateToCompilerConfiguration>
      >),
    });

    const scenario = compiler.generateScenario({
      scenarioId,
      unlockingScriptId,
    });

    t.deepEqual(
      scenario,
      expectedResult,
      `- \nResult: ${stringifyTestVector(
        scenario
      )}\n\nExpected:\n ${stringifyTestVector(expectedResult)}\n`
    );
  }
);

test(
  'generateScenario: deep extend',
  expectScenarioGenerationResult,
  'c',
  'unlock',
  {
    scenarios: {
      a: {
        data: {
          bytecode: {
            var1: '0x010203',
          },
        },
      },
      b: {
        data: {
          keys: {
            privateKeys: {
              another:
                '00000000000000000000000000000000000000000000000000000000000000ff',
            },
          },
        },
        extends: 'a',
      },
      c: { extends: 'b' },
    },
  },
  {
    data: {
      bytecode: {
        var1: hexToBin('010203'),
      },
      currentBlockHeight: 2,
      currentBlockTime: 1231469665,
      hdKeys: {
        addressIndex: 0,
        hdPrivateKeys: {
          owner:
            'xprv9s21ZrQH143K3Dfym3ZPsqraXhUokyNALDNHuaDZo14vDW86EpWxTq7ypGDgHCsZNCzsMtJb6xSDWEKmGYfGUZ1edNXGmfxNVaK5aNpBVMJ',
        },
      },
      keys: {
        privateKeys: {
          another: hexToBin(
            '00000000000000000000000000000000000000000000000000000000000000ff'
          ),
        },
      },
    },
    program: {
      inputIndex: 0,
      sourceOutputs: [
        {
          lockingBytecode: hexToBin('03010203757551'),
          valueSatoshis: 0n,
        },
      ],
      transaction: {
        inputs: [
          {
            outpointIndex: 0,
            outpointTransactionHash: hexToBin(
              '0000000000000000000000000000000000000000000000000000000000000001'
            ),
            sequenceNumber: 0,
            unlockingBytecode: hexToBin(
              '41d1851c0a464c5d6b5b15452327e187f5c19d0805a2ce821b00b239dcc2de2112335cf481bed0f69c780adf9eda30c3e0706b893b53e0a58fa9fad0628e30d0da41'
            ),
          },
        ],
        locktime: 0,
        outputs: [
          {
            lockingBytecode: hexToBin('03010203757551'),
            valueSatoshis: 0n,
          },
        ],
        version: 2,
      },
    },
  }
);

test(
  'generateScenario: cyclical extend',
  expectScenarioGenerationResult,
  'c',
  'unlock',
  {
    scenarios: {
      a: { extends: 'c' },
      b: { extends: 'a' },
      c: { extends: 'b' },
    },
  },
  'Cannot generate scenario "c": Cannot extend scenario "c": scenario "c" extends itself. Scenario inheritance path: c → b → a'
);

test(
  'generateScenario: no scenarios',
  expectScenarioGenerationResult,
  'does_not_exist',
  'unlock',
  { scenarios: undefined },
  'Cannot generate scenario "does_not_exist": a scenario definition with the identifier does_not_exist is not included in this compiler configuration.'
);

test(
  'generateScenario: unknown scenario ID',
  expectScenarioGenerationResult,
  'does_not_exist',
  'unlock',
  {
    scenarios: { another: {} },
  },
  'Cannot generate scenario "does_not_exist": a scenario definition with the identifier does_not_exist is not included in this compiler configuration.'
);

test(
  'generateScenario: invalid bytecode value',
  expectScenarioGenerationResult,
  'a',
  'unlock',
  {
    scenarios: {
      a: { data: { bytecode: { var1: 'invalid' } } },
    },
  },
  'Cannot generate scenario "a". Compilation error while generating bytecode for "var1": [1, 1] Unknown identifier "invalid".'
);

test.failing(
  'generateScenario: no scenario ID',
  expectScenarioGenerationResult,
  undefined,
  'unlock',
  {
    scenarios: {
      a: {},
    },
  },
  {
    data: {
      currentBlockHeight: 2,
      currentBlockTime: 1231469665,
      hdKeys: {
        addressIndex: 0,
        hdPrivateKeys: {
          owner:
            'xprv9s21ZrQH143K3Dfym3ZPsqraXhUokyNALDNHuaDZo14vDW86EpWxTq7ypGDgHCsZNCzsMtJb6xSDWEKmGYfGUZ1edNXGmfxNVaK5aNpBVMJ',
        },
      },
      keys: {
        privateKeys: {
          another: hexToBin(
            '0000000000000000000000000000000000000000000000000000000000000001'
          ),
        },
      },
    },
    program: {
      inputIndex: 0,
      sourceOutputs: [
        {
          lockingBytecode: hexToBin(''),
          valueSatoshis: 0n,
        },
      ],
      transaction: {
        inputs: [
          {
            outpointIndex: 0,
            outpointTransactionHash: hexToBin(
              '0000000000000000000000000000000000000000000000000000000000000000'
            ),
            sequenceNumber: 0,
            unlockingBytecode: hexToBin(''),
          },
        ],
        locktime: 0,
        outputs: [
          {
            lockingBytecode: hexToBin(''),
            valueSatoshis: 0n,
          },
        ],
        version: 2,
      },
    },
  }
);

test(
  'generateScenario: no unlocking script ID, no scenario ID',
  expectScenarioGenerationResult,
  undefined,
  undefined,
  { scenarios: { a: {} } },
  {
    data: {
      currentBlockHeight: 2,
      currentBlockTime: 1231469665,
      hdKeys: {
        addressIndex: 0,
        hdPrivateKeys: {
          owner:
            'xprv9s21ZrQH143K3Dfym3ZPsqraXhUokyNALDNHuaDZo14vDW86EpWxTq7ypGDgHCsZNCzsMtJb6xSDWEKmGYfGUZ1edNXGmfxNVaK5aNpBVMJ',
        },
      },
      keys: {
        privateKeys: {
          another: hexToBin(
            '0000000000000000000000000000000000000000000000000000000000000001'
          ),
        },
      },
    },
    program: {
      inputIndex: 0,
      sourceOutputs: [
        {
          lockingBytecode: hexToBin(''),
          valueSatoshis: 0n,
        },
      ],
      transaction: {
        inputs: [
          {
            outpointIndex: 0,
            outpointTransactionHash: hexToBin(
              '0000000000000000000000000000000000000000000000000000000000000001'
            ),
            sequenceNumber: 0,
            unlockingBytecode: hexToBin(''),
          },
        ],
        locktime: 0,
        outputs: [
          {
            lockingBytecode: hexToBin(''),
            valueSatoshis: 0n,
          },
        ],
        version: 2,
      },
    },
  }
);

test(
  'generateScenario: mismatched source outputs and transaction inputs',
  expectScenarioGenerationResult,
  'a',
  'unlock',
  {
    scenarios: {
      a: { transaction: { inputs: [{}, {}] } },
    },
  },
  'Cannot generate scenario "a": could not match source outputs with inputs - "sourceOutputs" must be the same length as "transaction.inputs".'
);

test(
  'generateScenario: ambiguous input under test',
  expectScenarioGenerationResult,
  'a',
  'unlock',
  {
    scenarios: {
      a: {
        transaction: { outputs: [{ lockingBytecode: { script: 'unknown' } }] },
      },
    },
  },
  'Cannot generate scenario "a": Failed compilation of source output at index 0: Cannot resolve "var1" - the "bytecode" property was not provided in the compilation data. Failed compilation of transaction output at index 0: No script with an ID of "unknown" was provided in the compiler configuration.'
);

test(
  'generateScenario: no locking script',
  expectScenarioGenerationResult,
  'a',
  'unlock',
  {
    scenarios: {
      a: {
        transaction: { outputs: [{ lockingBytecode: {} }] },
      },
    },
  },
  'Cannot generate scenario "a" using unlocking script "unlock": the locking script unlocked by "unlock" is not provided in this compiler configuration.',
  {
    unlockingScripts: undefined,
  }
);

test.failing(
  'generateScenario: no locking script, no specified unlocking script',
  expectScenarioGenerationResult,
  'a',
  undefined,
  {
    scenarios: {
      a: {
        transaction: { outputs: [{ lockingBytecode: {} }] },
      },
    },
  },
  'Cannot generate scenario "a": Cannot generate locking bytecode for output 0: this output is set to use the script unlocked by the unlocking script under test, but an unlocking script ID was not provided for scenario generation.',
  {
    unlockingScripts: undefined,
  }
);

test.failing(
  'generateScenario: simple transaction, locking bytecode override',
  expectScenarioGenerationResult,
  'a',
  'unlock',
  {
    scenarios: {
      a: {
        data: {
          currentBlockHeight: 5,
          hdKeys: { hdPublicKeys: {} },
          keys: {
            privateKeys: {
              another:
                '00000000000000000000000000000000000000000000000000000000000000ff',
            },
          },
        },
        sourceOutputs: [{ valueSatoshis: 'ffffffffffffffff' }],
        transaction: {
          outputs: [
            {
              lockingBytecode: { overrides: { currentBlockHeight: 9 } },
              valueSatoshis: 'ffffffffffffffff',
            },
            {
              lockingBytecode: { overrides: {} },
              valueSatoshis: 'ffffffffffffffff',
            },
          ],
          version: 3,
        },
      },
    },
    scripts: {
      lock: {
        lockingType: 'standard',
        script: 'OP_DROP <current_block_height> OP_DROP OP_1',
      },
      unlock: {
        script: '<key1.schnorr_signature.all_outputs>',
        unlocks: 'lock',
      },
    },
  },
  {
    data: {
      currentBlockHeight: 5,
      currentBlockTime: 1231469665,
      hdKeys: {
        addressIndex: 0,
        hdPrivateKeys: {
          owner:
            'xprv9s21ZrQH143K3Dfym3ZPsqraXhUokyNALDNHuaDZo14vDW86EpWxTq7ypGDgHCsZNCzsMtJb6xSDWEKmGYfGUZ1edNXGmfxNVaK5aNpBVMJ',
        },
        hdPublicKeys: {},
      },
      keys: {
        privateKeys: {
          another: hexToBin(
            '00000000000000000000000000000000000000000000000000000000000000ff'
          ),
        },
      },
    },
    program: {
      inputIndex: 0,
      sourceOutputs: [
        {
          lockingBytecode: hexToBin(''),
          valueSatoshis: 0xffffffffffffffffn,
        },
      ],
      transaction: {
        inputs: [
          {
            outpointIndex: 0,
            outpointTransactionHash: hexToBin(
              '0000000000000000000000000000000000000000000000000000000000000000'
            ),
            sequenceNumber: 0,
            unlockingBytecode: hexToBin(''),
          },
        ],
        locktime: 0,
        outputs: [
          {
            lockingBytecode: hexToBin('75597551'),
            valueSatoshis: 0xffffffffffffffffn,
          },
          {
            lockingBytecode: hexToBin('75557551'),
            valueSatoshis: 0xffffffffffffffffn,
          },
        ],
        version: 3,
      },
    },
  }
);

test.failing(
  'generateScenario: complex transaction, locking bytecode variable override',
  expectScenarioGenerationResult,
  'a',
  'unlock',
  {
    scenarios: {
      a: {
        data: { bytecode: { var1: '0x010203' } },
        transaction: {
          inputs: [
            {
              outpointIndex: 1,
              outpointTransactionHash:
                '0000000000000000000000000000000000000000000000000000000000000001',
              sequenceNumber: 1,
              unlockingBytecode: 'beef',
            },
            { unlockingBytecode: ['slot'] },
          ],
          locktime: 4294967295,
          outputs: [
            {
              lockingBytecode: {},
              valueSatoshis: 1000,
            },
            {
              lockingBytecode: {
                overrides: { currentBlockHeight: 0 },
              },
            },
            {
              lockingBytecode: {
                overrides: { bytecode: { var1: '0x030405' } },
              },
              valueSatoshis: 'ffffffffffffffff',
            },
          ],
          version: 3,
        },
      },
    },
  },
  {
    data: {
      bytecode: {
        var1: hexToBin('010203'),
      },
      currentBlockHeight: 2,
      currentBlockTime: 1231469665,
      hdKeys: {
        addressIndex: 0,
        hdPrivateKeys: {
          owner:
            'xprv9s21ZrQH143K3Dfym3ZPsqraXhUokyNALDNHuaDZo14vDW86EpWxTq7ypGDgHCsZNCzsMtJb6xSDWEKmGYfGUZ1edNXGmfxNVaK5aNpBVMJ',
        },
      },
      keys: {
        privateKeys: {
          another: hexToBin(
            '0000000000000000000000000000000000000000000000000000000000000001'
          ),
        },
      },
    },
    program: {
      inputIndex: 1,
      sourceOutputs: [
        {
          lockingBytecode: hexToBin(''),
          valueSatoshis: 0n,
        },
      ],
      transaction: {
        inputs: [
          {
            outpointIndex: 1,
            outpointTransactionHash: hexToBin(
              '0000000000000000000000000000000000000000000000000000000000000001'
            ),
            sequenceNumber: 1,
            unlockingBytecode: hexToBin('beef'),
          },
          {
            outpointIndex: 0,
            outpointTransactionHash: hexToBin(
              '0000000000000000000000000000000000000000000000000000000000000000'
            ),
            sequenceNumber: 0,
            unlockingBytecode: hexToBin(''),
          },
        ],
        locktime: 4294967295,
        outputs: [
          {
            lockingBytecode: hexToBin('03010203757551'),
            valueSatoshis: 1000n,
          },
          {
            lockingBytecode: hexToBin('03010203757551'),
            valueSatoshis: 0n,
          },
          {
            lockingBytecode: hexToBin('03030405757551'),
            valueSatoshis: 0xffffffffffffffffn,
          },
        ],
        version: 3,
      },
    },
  }
);

test.failing(
  'generateScenario: locking bytecode generation failure',
  expectScenarioGenerationResult,
  'a',
  'unlock',
  {
    scenarios: {
      a: {
        transaction: {
          outputs: [
            {
              lockingBytecode: { overrides: { bytecode: { var1: 'broken' } } },
            },
          ],
        },
      },
    },
  },
  'Cannot generate scenario "a": Cannot generate locking bytecode for output 0: Compilation error while generating bytecode for "var1": [1, 1] Unknown identifier "broken".'
);

test.failing('generateScenario: cash-channels - after_payment_time', (t) => {
  const template = importAuthenticationTemplate(cashChannelsJson);
  if (typeof template === 'string') {
    t.fail(template);
    return;
  }
  const compiler = authenticationTemplateToCompilerBCH(template);
  const scenario = compiler.generateScenario({
    scenarioId: 'after_payment_time',
    unlockingScriptId: 'execute_authorization',
  });
  t.deepEqual(
    scenario,
    {
      data: {
        bytecode: {
          authorized_amount: hexToBin('e803'),
          denominating_asset: hexToBin('555344'),
          maximum_authorized_satoshis: hexToBin('0429'),
          payment_number: hexToBin('02'),
          payment_satoshis: hexToBin('1027'),
          payment_time: hexToBin('80bf345e'),
        },
        currentBlockHeight: 2,
        currentBlockTime: 1231469665,
        hdKeys: {
          addressIndex: 0,
        },
        keys: {
          privateKeys: {
            owner: hexToBin(
              '0000000000000000000000000000000000000000000000000000000000000001'
            ),
            rate_oracle: hexToBin(
              '0000000000000000000000000000000000000000000000000000000000000003'
            ),
            receiver: hexToBin(
              '0000000000000000000000000000000000000000000000000000000000000004'
            ),
          },
        },
      },
      program: {
        inputIndex: 0,
        sourceOutputs: [
          {
            lockingBytecode: undefined,
            valueSatoshis: hexToBin('204e000000000000'),
          },
        ],
        transaction: {
          inputs: [
            {
              outpointIndex: 0,
              outpointTransactionHash: hexToBin(
                '0000000000000000000000000000000000000000000000000000000000000000'
              ),
              sequenceNumber: 0,
              unlockingBytecode: undefined,
            },
          ],
          locktime: 1580515200,
          outputs: [
            {
              lockingBytecode: hexToBin(
                'a9149a97dc2531b9b9af6319aab57ea369284289998987'
              ),
              valueSatoshis: hexToBin('1027000000000000'),
            },
          ],
          version: 2,
        },
      },
    },
    stringifyTestVector(scenario)
  );
});
