/* eslint-disable functional/no-expression-statement, camelcase, max-lines, @typescript-eslint/naming-convention */
import test, { Macro } from 'ava';

import {
  AuthenticationProgramStateBCH,
  AuthenticationTemplate,
  authenticationTemplateP2pkh,
  authenticationTemplateP2pkhNonHd,
  authenticationTemplateToCompilationEnvironment,
  authenticationTemplateToCompilerBCH,
  CompilationEnvironmentBCH,
  compilerOperationsBCH,
  createAuthenticationProgramEvaluationCommon,
  createCompiler,
  ExtendedScenarioDefinition,
  extendedScenarioDefinitionToCompilationData,
  extendScenarioDefinition,
  extendScenarioDefinitionData,
  generateBytecodeMap,
  generateDefaultScenarioDefinition,
  generateExtendedScenario,
  hexToBin,
  instantiateRipemd160,
  instantiateSecp256k1,
  instantiateSha256,
  instantiateSha512,
  instantiateVirtualMachineBCH,
  instructionSetBCHCurrentStrict,
  OpcodesBCH,
  Scenario,
  stringifyTestVector,
  TransactionContextBCH,
  validateAuthenticationTemplate,
} from '../lib';
import { cashChannelsJson } from '../transaction/transaction-e2e.spec.helper';

const sha256Promise = instantiateSha256();
const sha512Promise = instantiateSha512();

test('generateDefaultScenarioDefinition: empty', (t) => {
  const scenario = generateDefaultScenarioDefinition({ scripts: {} });
  t.deepEqual(
    scenario,
    {
      data: {
        currentBlockHeight: 2,
        currentBlockTime: 1231469665,
      },
      transaction: {
        inputs: [
          {
            unlockingBytecode: null,
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
      value: 0,
    },
    stringifyTestVector(scenario)
  );
});

test('generateDefaultScenarioDefinition: missing sha256', async (t) => {
  const sha512 = await sha512Promise;
  const scenario = generateDefaultScenarioDefinition({
    scripts: {},
    sha512,
    variables: {
      key: {
        description: 'The private key which controls this wallet.',
        name: 'Key',
        type: 'HdKey',
      },
    },
  });
  t.deepEqual(
    scenario,
    'An implementations of "sha256" is required to generate defaults for HD keys, but the "sha256" property is not included in this compilation environment.',
    stringifyTestVector(scenario)
  );
});

test('generateDefaultScenarioDefinition: missing sha512', async (t) => {
  const sha256 = await sha256Promise;
  const scenario = generateDefaultScenarioDefinition({
    scripts: {},
    sha256,
    variables: {
      key: {
        description: 'The private key which controls this wallet.',
        name: 'Key',
        type: 'HdKey',
      },
    },
  });
  t.deepEqual(
    scenario,
    'An implementations of "sha512" is required to generate defaults for HD keys, but the "sha512" property is not included in this compilation environment.',
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
      transaction: {
        inputs: [
          {
            unlockingBytecode: null,
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
      value: 0,
    },
    stringifyTestVector(extended)
  );
});

test('extendScenarioDefinition: complex extend', (t) => {
  const extended = extendScenarioDefinition(
    {
      transaction: {
        inputs: [
          {
            unlockingBytecode: null,
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
      value: 'ffffffffffffffff',
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
      transaction: {
        inputs: [
          {
            unlockingBytecode: null,
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
      value: 'ffffffffffffffff',
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
      value: 'ffffffffffffffff',
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
      value: 'ffffffffffffffff',
    },
    stringifyTestVector(extended)
  );
});

test('generateExtendedScenario: unknown scenario identifier', (t) => {
  const extended = generateExtendedScenario({
    environment: { scripts: {} },
    scenarioId: 'unknown',
  });
  t.deepEqual(
    extended,
    'Cannot extend scenario "unknown": a scenario with the identifier unknown is not included in this compilation environment.',
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
  const environment = authenticationTemplateToCompilationEnvironment(
    authenticationTemplateP2pkhNonHd
  );
  const scenario = generateDefaultScenarioDefinition(environment);

  t.deepEqual(
    scenario,
    {
      data: {
        currentBlockHeight: 2,
        currentBlockTime: 1231469665,
        keys: {
          privateKeys: {
            key:
              '0000000000000000000000000000000000000000000000000000000000000001',
          },
        },
      },
      transaction: {
        inputs: [
          {
            unlockingBytecode: null,
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
      value: 0,
    },
    stringifyTestVector(scenario)
  );
});

test('generateDefaultScenarioDefinition: authenticationTemplateP2pkh', async (t) => {
  const sha256 = await sha256Promise;
  const sha512 = await sha512Promise;
  const environment = {
    ...authenticationTemplateToCompilationEnvironment(
      authenticationTemplateP2pkh
    ),
    sha256,
    sha512,
  };
  const scenario = generateDefaultScenarioDefinition(environment);
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
      transaction: {
        inputs: [
          {
            unlockingBytecode: null,
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
      value: 0,
    },
    stringifyTestVector(scenario)
  );
});

const ripemd160Promise = instantiateRipemd160();
const secp256k1Promise = instantiateSecp256k1();
const vmPromise = instantiateVirtualMachineBCH(instructionSetBCHCurrentStrict);

/**
 * Uses `createCompiler` rather than `createCompilerBCH` for performance.
 */
export const expectScenarioGenerationResult: Macro<[
  string | undefined,
  string | undefined,
  Partial<AuthenticationTemplate>,
  string | Scenario,
  Partial<ReturnType<typeof authenticationTemplateToCompilationEnvironment>>?
]> = async (
  t,
  scenarioId,
  unlockingScriptId,
  templateOverrides,
  expectedResult,
  environmentOverrides
  // eslint-disable-next-line max-params
) => {
  const ripemd160 = await ripemd160Promise;
  const sha256 = await sha256Promise;
  const sha512 = await sha512Promise;
  const secp256k1 = await secp256k1Promise;
  const vm = await vmPromise;

  const environment = authenticationTemplateToCompilationEnvironment({
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
  });
  const compiler = createCompiler<
    TransactionContextBCH,
    CompilationEnvironmentBCH,
    OpcodesBCH,
    AuthenticationProgramStateBCH
  >({
    ...{
      createAuthenticationProgram: createAuthenticationProgramEvaluationCommon,
      opcodes: generateBytecodeMap(OpcodesBCH),
      operations: compilerOperationsBCH,
      ripemd160,
      secp256k1,
      sha256,
      sha512,
      vm,
    },
    ...environment,
    ...environmentOverrides,
  });

  const scenario = compiler.generateScenario({ scenarioId, unlockingScriptId });

  t.deepEqual(
    scenario,
    expectedResult,
    `– \nResult: ${stringifyTestVector(
      scenario
    )}\n\nExpected:\n ${stringifyTestVector(expectedResult)}\n`
  );
};

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
      sourceOutput: {
        satoshis: hexToBin('0000000000000000'),
      },
      spendingTransaction: {
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
        locktime: 0,
        outputs: [
          {
            lockingBytecode: hexToBin(''),
            satoshis: hexToBin('0000000000000000'),
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
  'Cannot generate scenario "does_not_exist": a scenario with the identifier does_not_exist is not included in this compilation environment.'
);

test(
  'generateScenario: unknown scenario ID',
  expectScenarioGenerationResult,
  'does_not_exist',
  'unlock',
  {
    scenarios: { another: {} },
  },
  'Cannot generate scenario "does_not_exist": a scenario with the identifier does_not_exist is not included in this compilation environment.'
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
  'Cannot generate scenario "a": Compilation error while generating bytecode for "var1": [1, 1] Unknown identifier "invalid".'
);

test(
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
      sourceOutput: {
        satoshis: hexToBin('0000000000000000'),
      },
      spendingTransaction: {
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
        locktime: 0,
        outputs: [
          {
            lockingBytecode: hexToBin(''),
            satoshis: hexToBin('0000000000000000'),
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
      sourceOutput: {
        satoshis: hexToBin('0000000000000000'),
      },
      spendingTransaction: {
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
        locktime: 0,
        outputs: [
          {
            lockingBytecode: hexToBin(''),
            satoshis: hexToBin('0000000000000000'),
          },
        ],
        version: 2,
      },
    },
  }
);

test(
  'generateScenario: unknown locking bytecode script',
  expectScenarioGenerationResult,
  'a',
  'unlock',
  {
    scenarios: {
      a: { transaction: { inputs: [{}, {}] } },
    },
  },
  'Cannot generate scenario "a": the specific input under test in this scenario is ambiguous – "transaction.inputs" must include exactly one input which has "unlockingBytecode" set to "null".'
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
  'Cannot generate scenario "a": Cannot generate locking bytecode for output 0: [0, 0] No script with an ID of "unknown" was provided in the compilation environment.'
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
  'Cannot generate scenario "a": Cannot generate locking bytecode for output 0: the locking script unlocked by "unlock" is not provided in this compilation environment.',
  {
    unlockingScripts: undefined,
  }
);

test(
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

test(
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
        transaction: {
          outputs: [
            {
              lockingBytecode: { overrides: { currentBlockHeight: 9 } },
              satoshis: 'ffffffffffffffff',
            },
            {
              lockingBytecode: { overrides: {} },
              satoshis: 'ffffffffffffffff',
            },
          ],
          version: 3,
        },
        value: 'ffffffffffffffff',
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
      sourceOutput: {
        satoshis: hexToBin('ffffffffffffffff'),
      },
      spendingTransaction: {
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
        locktime: 0,
        outputs: [
          {
            lockingBytecode: hexToBin('75597551'),
            satoshis: hexToBin('ffffffffffffffff'),
          },
          {
            lockingBytecode: hexToBin('75557551'),
            satoshis: hexToBin('ffffffffffffffff'),
          },
        ],
        version: 3,
      },
    },
  }
);

test(
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
            { unlockingBytecode: null },
          ],
          locktime: 4294967295,
          outputs: [
            {
              lockingBytecode: {},
              satoshis: 1000,
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
              satoshis: 'ffffffffffffffff',
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
      sourceOutput: {
        satoshis: hexToBin('0000000000000000'),
      },
      spendingTransaction: {
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
            unlockingBytecode: undefined,
          },
        ],
        locktime: 4294967295,
        outputs: [
          {
            lockingBytecode: hexToBin('03010203757551'),
            satoshis: hexToBin('e803000000000000'),
          },
          {
            lockingBytecode: hexToBin('03010203757551'),
            satoshis: hexToBin('0000000000000000'),
          },
          {
            lockingBytecode: hexToBin('03030405757551'),
            satoshis: hexToBin('ffffffffffffffff'),
          },
        ],
        version: 3,
      },
    },
  }
);

test(
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

test('generateScenario: cash-channels – after_payment_time', async (t) => {
  const template = validateAuthenticationTemplate(cashChannelsJson);
  if (typeof template === 'string') {
    t.fail(template);
    return;
  }
  const compiler = await authenticationTemplateToCompilerBCH(template);
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
        sourceOutput: {
          satoshis: hexToBin('204e000000000000'),
        },
        spendingTransaction: {
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
              satoshis: hexToBin('1027000000000000'),
            },
          ],
          version: 2,
        },
      },
    },
    stringifyTestVector(scenario)
  );
});
