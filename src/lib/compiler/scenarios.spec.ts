/* eslint-disable camelcase, max-lines */
import test from 'ava';

import type {
  ExtendedScenarioDefinition,
  PartialExactOptional,
  Scenario,
  WalletTemplate,
} from '../lib.js';
import {
  extendedScenarioDefinitionToCompilationData,
  extendScenarioDefinition,
  extendScenarioDefinitionData,
  generateDefaultScenarioDefinition,
  generateExtendedScenario,
  hexToBin,
  importWalletTemplate,
  sha256,
  sha512,
  stringifyTestVector,
  walletTemplateP2pkh,
  walletTemplateP2pkhNonHd,
  walletTemplateToCompilerBCH,
  walletTemplateToCompilerConfiguration,
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
            lockingBytecode: '6a076c696261757468',
          },
        ],
        version: 2,
      },
    },
    stringifyTestVector(scenario),
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
    stringifyTestVector(scenario),
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
    stringifyTestVector(scenario),
  );
});

test('extendScenarioDefinitionData: empty', (t) => {
  const extended = extendScenarioDefinitionData({}, {});
  t.deepEqual(extended, {}, stringifyTestVector(extended));
});

test('extendScenarioDefinitionData: 1', (t) => {
  const extended = extendScenarioDefinitionData(
    { hdKeys: { hdPublicKeys: { b: '(hd public key)' } } },
    { bytecode: { test: '<"abc">' } },
  );
  t.deepEqual(
    extended,
    {
      bytecode: { test: '<"abc">' },
      hdKeys: { hdPublicKeys: { b: '(hd public key)' } },
    },
    stringifyTestVector(extended),
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
            lockingBytecode: '6a076c696261757468',
          },
        ],
        version: 2,
      },
    },
    stringifyTestVector(extended),
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
    },
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
    stringifyTestVector(extended),
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
    },
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
    stringifyTestVector(extended),
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
    stringifyTestVector(extended),
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

test('generateDefaultScenarioDefinition: walletTemplateP2pkhNonHd', (t) => {
  const configuration = walletTemplateToCompilerConfiguration(
    walletTemplateP2pkhNonHd,
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
        outputs: [{ lockingBytecode: '6a076c696261757468' }],
        version: 2,
      },
    },
    stringifyTestVector(scenario),
  );
});

test('generateDefaultScenarioDefinition: walletTemplateP2pkh', (t) => {
  const configuration = {
    ...walletTemplateToCompilerConfiguration(walletTemplateP2pkh),
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
        outputs: [{ lockingBytecode: '6a076c696261757468' }],
        version: 2,
      },
    },
    stringifyTestVector(scenario),
  );
});

export const expectScenarioGenerationResult = test.macro<
  [
    string | undefined,
    string | undefined,
    PartialExactOptional<WalletTemplate>,
    Scenario | string,
    PartialExactOptional<
      ReturnType<typeof walletTemplateToCompilerConfiguration>
    >?,
  ]
>(
  (
    t,
    scenarioId,
    unlockingScriptId,
    templateOverrides,
    expectedResult,
    configurationOverrides,
    // eslint-disable-next-line @typescript-eslint/max-params
  ) => {
    const configuration = walletTemplateToCompilerConfiguration({
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
          compileTimeAssert: {
            name: 'Var1 Padded',
            pushed: true,
            script:
              '$(<var1> OP_DUP <0> OP_GREATERTHAN OP_VERIFY OP_DUP <0xff7f> OP_LESSTHANOREQUAL OP_VERIFY <2> OP_NUM2BIN)',
            tests: {
              is_within_range: {
                check: 'OP_SIZE <2> OP_EQUALVERIFY OP_BIN2NUM <var1> OP_EQUAL',
                invalid: ['above', 'below'],
                name: 'Is Within Range',
                passes: ['within'],
              },
            },
          },
          p2pkhLock: {
            script:
              'OP_DUP OP_HASH160 <$(<key1.public_key> OP_HASH160)> OP_EQUALVERIFY OP_CHECKSIG',
          },
          p2pkhUnlock: {
            script: '<key1.schnorr_signature.all_outputs> <key1.public_key>',
            unlocks: 'p2pkhLock',
          },
          p2sh20Lock: {
            lockingType: 'p2sh20',
            script: '<var1> OP_DROP OP_DROP OP_1',
          },
          p2sh20Unlock: {
            script: '<key1.schnorr_signature.all_outputs>',
            unlocks: 'p2sh20Lock',
          },
        },
        supported: ['BCH_2020_05'],
        version: 0,
      },
      ...templateOverrides,
    } as WalletTemplate);

    const compiler = createCompilerBCH({
      ...configuration,
      ...(configurationOverrides as Partial<
        ReturnType<typeof walletTemplateToCompilerConfiguration>
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
        scenario,
      )}\n\nExpected:\n ${stringifyTestVector(
        expectedResult,
      )}\n\nConfiguration: ${stringifyTestVector(configuration)}`,
    );
  },
);

test(
  'generateScenario: deep extend',
  expectScenarioGenerationResult,
  'c',
  'p2sh20Unlock',
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
            '00000000000000000000000000000000000000000000000000000000000000ff',
          ),
        },
      },
    },
    program: {
      inputIndex: 0,
      sourceOutputs: [
        {
          lockingBytecode: hexToBin(
            'a9147ab197d4888698145e7a0af625f8181a95604cd887',
          ),
          valueSatoshis: 0n,
        },
      ],
      transaction: {
        inputs: [
          {
            outpointIndex: 0,
            outpointTransactionHash: hexToBin(
              '0000000000000000000000000000000000000000000000000000000000000001',
            ),
            sequenceNumber: 0,
            unlockingBytecode: hexToBin(
              '41fd8c2293325a5e85ba2683aa41a3ad483a3917db24b512c396b696a5ccf023ffdbf3883a589271ff90589f0bcbc1ab69b966257df71c0dba78aea4e4064c5c00410703010203757551',
            ),
          },
        ],
        locktime: 0,
        outputs: [
          {
            lockingBytecode: hexToBin('6a076c696261757468'),
            valueSatoshis: 0n,
          },
        ],
        version: 2,
      },
    },
  },
);

test(
  'generateScenario: cyclical extend',
  expectScenarioGenerationResult,
  'c',
  'p2sh20Unlock',
  {
    scenarios: {
      a: { extends: 'c' },
      b: { extends: 'a' },
      c: { extends: 'b' },
    },
  },
  'Cannot generate scenario "c": Cannot extend scenario "c": scenario "c" extends itself. Scenario inheritance path: c → b → a',
);

test(
  'generateScenario: no scenarios',
  expectScenarioGenerationResult,
  'does_not_exist',
  'p2sh20Unlock',
  { scenarios: undefined },
  'Cannot generate scenario "does_not_exist": a scenario definition with the identifier does_not_exist is not included in this compiler configuration.',
);

test(
  'generateScenario: unknown scenario ID',
  expectScenarioGenerationResult,
  'does_not_exist',
  'p2sh20Unlock',
  {
    scenarios: { another: {} },
  },
  'Cannot generate scenario "does_not_exist": a scenario definition with the identifier does_not_exist is not included in this compiler configuration.',
);

test(
  'generateScenario: invalid bytecode value',
  expectScenarioGenerationResult,
  'a',
  'p2sh20Unlock',
  {
    scenarios: {
      a: { data: { bytecode: { var1: 'invalid' } } },
    },
  },
  'Cannot generate scenario "a". Compilation error while generating bytecode for "var1": [1, 1] Unknown identifier "invalid".',
);

test(
  'generateScenario: no scenario ID',
  expectScenarioGenerationResult,
  undefined,
  'p2pkhUnlock',
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
            '0000000000000000000000000000000000000000000000000000000000000001',
          ),
        },
      },
    },
    program: {
      inputIndex: 0,
      sourceOutputs: [
        {
          lockingBytecode: hexToBin(
            '76a9141431b2926e6c7953f3dc3f2c5c19fe2d2dc57cfc88ac',
          ),
          valueSatoshis: 0n,
        },
      ],
      transaction: {
        inputs: [
          {
            outpointIndex: 0,
            outpointTransactionHash: hexToBin(
              '0000000000000000000000000000000000000000000000000000000000000001',
            ),
            sequenceNumber: 0,
            unlockingBytecode: hexToBin(
              '4133afdb65a3c9d2b50f32bc0d6750473425b3c21b138c66596182f072cc2f49d956b71e0183f1aa5620616405ebff584a1e3d4584e9c83b3cd8cc669295db73f641210309c64e4fbc61f4ddc950eb0acff2047850b864d6fb8198070a946cda5d72e5ba',
            ),
          },
        ],
        locktime: 0,
        outputs: [
          {
            lockingBytecode: hexToBin('6a076c696261757468'),
            valueSatoshis: 0n,
          },
        ],
        version: 2,
      },
    },
  },
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
            '0000000000000000000000000000000000000000000000000000000000000001',
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
              '0000000000000000000000000000000000000000000000000000000000000001',
            ),
            sequenceNumber: 0,
            unlockingBytecode: hexToBin(''),
          },
        ],
        locktime: 0,
        outputs: [
          {
            lockingBytecode: hexToBin('6a076c696261757468'),
            valueSatoshis: 0n,
          },
        ],
        version: 2,
      },
    },
  },
);

test(
  'generateScenario: mismatched source outputs and transaction inputs',
  expectScenarioGenerationResult,
  'a',
  'p2sh20Unlock',
  {
    scenarios: {
      a: { transaction: { inputs: [{}, {}] } },
    },
  },
  'Cannot generate scenario "a": could not match source outputs with inputs - "sourceOutputs" must be the same length as "transaction.inputs".',
);

test(
  'generateScenario: ambiguous input under test',
  expectScenarioGenerationResult,
  'a',
  'p2sh20Unlock',
  {
    scenarios: {
      a: {
        transaction: { outputs: [{ lockingBytecode: { script: 'unknown' } }] },
      },
    },
  },
  'Cannot generate scenario "a": Failed compilation of source output at index 0: Cannot resolve "var1" - the "bytecode" property was not provided in the compilation data. Failed compilation of transaction output at index 0: No script with an ID of "unknown" was provided in the compiler configuration.',
);

test(
  'generateScenario: no locking script',
  expectScenarioGenerationResult,
  'a',
  'p2sh20Unlock',
  {
    scenarios: {
      a: {
        transaction: { outputs: [{ lockingBytecode: {} }] },
      },
    },
  },
  'Cannot generate scenario "a" using unlocking script "p2sh20Unlock": the locking script unlocked by "p2sh20Unlock" is not provided in this compiler configuration.',
  {
    unlockingScripts: undefined,
  },
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
  },
);

test(
  'generateScenario: simple transaction, locking bytecode override',
  expectScenarioGenerationResult,
  'a',
  'p2sh20Unlock',
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
        sourceOutputs: [
          { lockingBytecode: ['slot'], valueSatoshis: 'ffffffffffffffff' },
        ],
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
      p2sh20Lock: {
        lockingType: 'standard',
        script: 'OP_DROP <current_block_height> OP_DROP OP_1',
      },
      p2sh20Unlock: {
        script: '<key1.schnorr_signature.all_outputs>',
        unlocks: 'p2sh20Lock',
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
            '00000000000000000000000000000000000000000000000000000000000000ff',
          ),
        },
      },
    },
    program: {
      inputIndex: 0,
      sourceOutputs: [
        {
          lockingBytecode: hexToBin('75557551'),
          valueSatoshis: 0xffffffffffffffffn,
        },
      ],
      transaction: {
        inputs: [
          {
            outpointIndex: 0,
            outpointTransactionHash: hexToBin(
              '0000000000000000000000000000000000000000000000000000000000000001',
            ),
            sequenceNumber: 0,
            unlockingBytecode: hexToBin(
              '419f16a55d6a75256ed6618a12d058f13d3792a3970ea75f11f670a886341bbd9d6e48b9f0cc6ff5074a1b15dd2e398150d4dcc184af8aaecbdc26fb16d15d8b7441',
            ),
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
  },
);

test(
  'generateScenario: complex transaction, locking bytecode variable override',
  expectScenarioGenerationResult,
  'a',
  'p2sh20Unlock',
  {
    scenarios: {
      a: {
        data: { bytecode: { var1: '0x010203' } },
        sourceOutputs: [{}, { lockingBytecode: ['slot'] }],
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
            '0000000000000000000000000000000000000000000000000000000000000001',
          ),
        },
      },
    },
    program: {
      inputIndex: 1,
      sourceOutputs: [
        {
          lockingBytecode: hexToBin(
            'a9147ab197d4888698145e7a0af625f8181a95604cd887',
          ),
          valueSatoshis: 0n,
        },
        {
          lockingBytecode: hexToBin(
            'a9147ab197d4888698145e7a0af625f8181a95604cd887',
          ),
          valueSatoshis: 0n,
        },
      ],
      transaction: {
        inputs: [
          {
            outpointIndex: 1,
            outpointTransactionHash: hexToBin(
              '0000000000000000000000000000000000000000000000000000000000000001',
            ),
            sequenceNumber: 1,
            unlockingBytecode: hexToBin('beef'),
          },
          {
            outpointIndex: 1,
            outpointTransactionHash: hexToBin(
              '0000000000000000000000000000000000000000000000000000000000000001',
            ),
            sequenceNumber: 0,
            unlockingBytecode: hexToBin(
              '41ceed7320920a9b4035bc4afbb6118635113595a46bd5d64ee3651bb2e88986177b677219e864d639a405c4d0ab28a103a8b3df0cf49b6a0f1cd8d6d95dd9aa71410703010203757551',
            ),
          },
        ],
        locktime: 4294967295,
        outputs: [
          {
            lockingBytecode: hexToBin(
              'a9147ab197d4888698145e7a0af625f8181a95604cd887',
            ),
            valueSatoshis: 1000n,
          },
          {
            lockingBytecode: hexToBin(
              'a9147ab197d4888698145e7a0af625f8181a95604cd887',
            ),
            valueSatoshis: 0n,
          },
          {
            lockingBytecode: hexToBin(
              'a9144e6f989ad736aaffd2f895768f274579722fc73b87',
            ),
            valueSatoshis: 0xffffffffffffffffn,
          },
        ],
        version: 3,
      },
    },
  },
);

test(
  'generateScenario: locking bytecode generation failure',
  expectScenarioGenerationResult,
  'a',
  'p2sh20Unlock',
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
  'Cannot generate scenario "a": Failed compilation of source output at index 0: Cannot resolve "var1" - the "bytecode" property was not provided in the compilation data. Failed compilation of transaction output at index 0: Could not compile scenario "data.bytecode": Compilation error while generating bytecode for "var1": [1, 1] Unknown identifier "broken".',
);

test(
  'generateScenario: invalid scenario for tested script',
  expectScenarioGenerationResult,
  'above',
  'compileTimeAssert.is_within_range.unlock',
  {
    scenarios: {
      above: {
        data: {
          bytecode: {
            var1: '32768',
          },
        },
      },
    },
  },
  'Cannot generate scenario "above": Failed compilation of source output at index 0: Compilation error in resolved script "compileTimeAssert": [1, 1] Failed to reduce evaluation: Program failed an OP_VERIFY operation.',
);

test('generateScenario: cash-channels-v1 - after_payment_time', (t) => {
  const template = importWalletTemplate(cashChannelsJson);
  if (typeof template === 'string') {
    t.fail(template);
    return;
  }
  const compiler = walletTemplateToCompilerBCH(template);
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
              '0000000000000000000000000000000000000000000000000000000000000001',
            ),
            rate_oracle: hexToBin(
              '0000000000000000000000000000000000000000000000000000000000000003',
            ),
            receiver: hexToBin(
              '0000000000000000000000000000000000000000000000000000000000000005',
            ),
          },
        },
      },
      program: {
        inputIndex: 0,
        sourceOutputs: [
          {
            lockingBytecode: hexToBin(
              'a914582d988b353dbe4d34863606fc7fac13a026f30187',
            ),
            valueSatoshis: 20000n,
          },
        ],
        transaction: {
          inputs: [
            {
              outpointIndex: 0,
              outpointTransactionHash: hexToBin(
                '0000000000000000000000000000000000000000000000000000000000000001',
              ),
              sequenceNumber: 0,
              unlockingBytecode: hexToBin(
                '412f8a7bef0803cf707cd971e50c3d0ecd432f361d40b22dddb548972522c49cf7d4d55c8eea3ce2e69e6db08857ebd503fc0f0bfecc1ba2fc29fd48d51b5f5a9f414c6902000000d5a45bffe65ef500725b4bc16e60ba39910d364324f702be75ed825c1c78a50c8cb9012517c817fead650287d61bdd9c68803b6bf9c64133dcab3e65b5a50cb9000000000000000000000000000000000000000000000000000000000000000100000000e24c4e210279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f817987c63766b56795f795779765c79a26958805779588057795880577958807e7e766b7e7e7e7cbbb16d6d5879020202004c92886c537958807e7c6c21022f8bde4d1a07209355b4a7250a5c5128e88b84bddc619ab7cba8d569b240efe4766b7ea9882102f9308a019258c31049344f85f89d5229b531c845836f99b08601f113bce036f9bb57795779815193528057797e7ea9011702a9147b01877e7e7e5579817b9458807c7e7c7eaa7c7e7e7e7e7e7e7ea86c7653797bad7b01407f757b7bba67ac6808204e00000000000004000000000880bf345e4100000000021027473045022100a42985db397f96f2dbec3846026c7e0d77a9de8e7a3239e6d241e1123e123e9602202bc889045417638a75ba423d567fa50a6f49ab9d23657dacdf09311db37b9be51477bf07ad61ce9c0ed3b026db9f6201a80a6afcec02042902e803035553440480bf345e473045022100f32fb0c45c9b0915455b6c8dbadb61f05f6b6e5cd74bce81e9fcadadbae466ba02207f7aa8052816478fc104d44b14161bbdc9011cadcc69b52f60337c0767e6622b514ce2210279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f817987c63766b56795f795779765c79a26958805779588057795880577958807e7e766b7e7e7e7cbbb16d6d5879020200886c537958807e7c6c21022f8bde4d1a07209355b4a7250a5c5128e88b84bddc619ab7cba8d569b240efe4766b7ea9882102f9308a019258c31049344f85f89d5229b531c845836f99b08601f113bce036f9bb57795779815193528057797e7ea9011702a9147b01877e7e7e5579817b9458807c7e7c7eaa7c7e7e7e7e7e7e7ea86c7653797bad7b01407f757b7bba67ac68',
              ),
            },
          ],
          locktime: 1580515200,
          outputs: [
            {
              lockingBytecode: hexToBin(
                'a91456e3217f1b623d9d566ee2e648cf6c74ac6a9b1687',
              ),
              valueSatoshis: 10000n,
            },
          ],
          version: 2,
        },
      },
    },
    stringifyTestVector(scenario),
  );
});
