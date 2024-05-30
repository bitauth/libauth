/**
 * This script generates all bch_vmb_tests, run it with: `yarn gen:tests`.
 */
import { encodeBech32, regroupBits } from '../address/address.js';
import { createCompilerBch } from '../compiler/compiler-bch/compiler-bch.js';
import { walletTemplateToCompilerConfiguration } from '../compiler/compiler-utils.js';
import { sha256 } from '../crypto/crypto.js';
import { binToHex, flattenBinArray } from '../format/format.js';
import type { WalletTemplate, WalletTemplateScenario } from '../lib.js';
import {
  encodeTransaction,
  encodeTransactionOutputs,
} from '../message/message.js';

import { slot1Scenario } from './bch-vmb-test-mixins.js';

/**
 * These are the VM versions for which tests are currently generated.
 *
 * A new 4-digit year should be added to prepare for each annual upgrade in
 * which the VM is modified.
 *
 * Libauth can also support testing of draft proposals by specifying a short
 * identifier for each independent proposal beginning with the prefix `chip_`.
 */
const vmVersionsBch = [
  '2023',
  '2025',
  '2026',
  'chip_limits',
  'chip_loops',
  'chip_zce',
  'chip_txv5',
] as const;
/**
 * These are the VM "modes" for which tests can be generated.
 */
const vmModes = ['nop2sh', 'p2sh', 'p2sh20', 'p2sh32'] as const;
type TestSetType = 'invalid' | 'nonstandard' | 'standard';
type TestSetOverrideType = TestSetType | 'ignore';
type VmVersionBch = (typeof vmVersionsBch)[number];
type VmMode = (typeof vmModes)[number];
type TestSetOverrideLabelBch =
  | 'default'
  | `${TestSetOverrideType}`
  | `${VmMode}_${TestSetOverrideType}`
  | `${VmMode}`
  | `${VmVersionBch}_${TestSetOverrideType}`
  | `${VmVersionBch}_${VmMode}_${TestSetOverrideType}`
  | `${VmVersionBch}`;

export type TestSetIdBch = `${VmVersionBch}_${TestSetType}`;

export type VmbTestMasterBch = [
  shortId: string,
  testDescription: string,
  unlockingScriptAsm: string,
  redeemOrLockingScriptAsm: string,
  testTransactionHex: string,
  sourceOutputsHex: string,
  testSets: TestSetIdBch[],
  /**
   * This isn't required for testing (implementations should always validate the
   * full test transaction), but it can allow downstream applications to
   * identify which source output/transaction input index is the focus of each
   * test. This is sometimes useful for debugging or for VM documentation
   * projects that extract usage examples from vmb tests.
   *
   * This field is left undefined for `inputIndex`s of `0` (the default).
   */
  inputIndex?: number,
];

export type VmbTest = [
  shortId: string,
  testDescription: string,
  unlockingScriptAsm: string,
  redeemOrLockingScriptAsm: string,
  testTransactionHex: string,
  sourceOutputsHex: string,
  inputIndex?: number,
];

/**
 * Not used currently, but these are the defaults that inform
 * {@link supportedTestSetOverridesBch}.
 */
export const vmbTestDefinitionDefaultBehaviorBch: TestSetOverrideLabelBch[] = [
  'nop2sh_nonstandard',
  'p2sh20_standard',
  'p2sh32_standard',
];

/* eslint-disable @typescript-eslint/naming-convention */
/**
 * The list of test set overrides currently supported. We could implement
 * support for any combination of {@link TestSetOverrideLabelBch}s, but this
 * implementation improves consistency and clarity across test files
 *
 * Test sets for a particular test definition are found by `join`ing this list
 * and looking up the result in {@link supportedTestSetOverridesBch}.
 */
const testSetOverrideListBch = [
  ['2023_invalid'],
  ['2023_invalid', 'nop2sh_ignore'],
  ['chip_loops_invalid'],
  ['chip_loops'],
  ['invalid', '2025_nonstandard', 'p2sh_ignore'],
  ['invalid', 'nop2sh_ignore', '2023_p2sh_standard', '2025_p2sh_nonstandard'],
  [
    'invalid',
    'nop2sh_ignore',
    'p2sh32_ignore',
    '2023_p2sh20_standard',
    '2025_p2sh20_nonstandard',
  ],
  ['invalid', 'p2sh_ignore', '2023_nop2sh_nonstandard'],
  ['invalid', 'nop2sh_nonstandard'],
  ['invalid', 'nop2sh_nonstandard'],
  ['invalid', 'p2sh_ignore'],
  ['invalid', 'p2sh_standard'],
  ['invalid', 'p2sh20_standard'],
  ['invalid', 'p2sh32_standard'],
  ['invalid'],
  ['nop2sh_ignore'],
  ['nop2sh_invalid'],
  ['nop2sh_standard', 'p2sh_ignore'],
  ['nonstandard', 'p2sh_ignore'],
  ['nonstandard', 'p2sh_invalid'],
  ['nonstandard'],
  ['p2sh_ignore'],
  ['p2sh_invalid'],
  ['p2sh32_nonstandard'],
  [],
] as const;

type TestSetOverrideListBch = (typeof testSetOverrideListBch)[number];
const testList = (_list: Readonly<Readonly<TestSetOverrideLabelBch[]>[]>) => 0;
// eslint-disable-next-line functional/no-expression-statements
testList(testSetOverrideListBch);

type TestPlan = {
  mode: 'nonP2SH' | 'P2SH20' | 'P2SH32';
  sets: TestSetIdBch[];
}[];
/**
 * Given one of these values and the
 * {@link vmbTestDefinitionDefaultBehaviorBch}, return these test plans.
 */
export const supportedTestSetOverridesBch: {
  [joinedList: string]: TestPlan;
} = {
  /* eslint-disable camelcase */
  /**
   * The "default" test sets, see {@link vmbTestDefinitionDefaultBehaviorBch}.
   */
  '': [
    {
      mode: 'nonP2SH',
      sets: ['2023_nonstandard', '2025_nonstandard', '2026_nonstandard'],
    },
    {
      mode: 'P2SH20',
      sets: ['2023_standard', '2025_standard', '2026_standard'],
    },
    {
      mode: 'P2SH32',
      sets: ['2023_standard', '2025_standard', '2026_standard'],
    },
  ],
  '2023_invalid': [
    {
      mode: 'nonP2SH',
      sets: ['2023_invalid', '2025_nonstandard', '2026_nonstandard'],
    },
    {
      mode: 'P2SH20',
      sets: ['2023_invalid', '2025_standard', '2026_standard'],
    },
    {
      mode: 'P2SH32',
      sets: ['2023_invalid', '2025_standard', '2026_standard'],
    },
  ],
  '2023_invalid,nop2sh_ignore': [
    {
      mode: 'P2SH20',
      sets: ['2023_invalid', '2025_standard', '2026_standard'],
    },
    {
      mode: 'P2SH32',
      sets: ['2023_invalid', '2025_standard', '2026_standard'],
    },
  ],
  /**
   * `chip_*` values exclude the marked test from
   * {@link vmbTestDefinitionDefaultBehaviorBch}.
   */
  chip_loops: [
    { mode: 'nonP2SH', sets: ['chip_loops_nonstandard'] },
    { mode: 'P2SH20', sets: ['chip_loops_standard'] },
    { mode: 'P2SH32', sets: ['chip_loops_standard'] },
  ],
  chip_loops_invalid: [
    { mode: 'nonP2SH', sets: ['chip_loops_invalid'] },
    { mode: 'P2SH20', sets: ['chip_loops_invalid'] },
    { mode: 'P2SH32', sets: ['chip_loops_invalid'] },
  ],
  invalid: [
    { mode: 'nonP2SH', sets: ['2023_invalid', '2025_invalid', '2026_invalid'] },
    { mode: 'P2SH20', sets: ['2023_invalid', '2025_invalid', '2026_invalid'] },
    { mode: 'P2SH32', sets: ['2023_invalid', '2025_invalid', '2026_invalid'] },
  ],
  'invalid,2025_nonstandard,p2sh_ignore': [
    {
      mode: 'nonP2SH',
      sets: ['2023_invalid', '2025_nonstandard', '2026_invalid'],
    },
  ],
  'invalid,nop2sh_ignore,2023_p2sh_standard,2025_p2sh_nonstandard': [
    {
      mode: 'P2SH20',
      sets: ['2023_standard', '2025_nonstandard', '2026_invalid'],
    },
    {
      mode: 'P2SH32',
      sets: ['2023_standard', '2025_nonstandard', '2026_invalid'],
    },
  ],

  'invalid,nop2sh_ignore,p2sh32_ignore,2023_p2sh20_standard,2025_p2sh20_nonstandard':
    [
      {
        mode: 'P2SH20',
        sets: ['2023_standard', '2025_nonstandard', '2026_invalid'],
      },
    ],
  'invalid,nop2sh_nonstandard': [
    {
      mode: 'nonP2SH',
      sets: ['2023_nonstandard', '2025_nonstandard', '2026_nonstandard'],
    },
    { mode: 'P2SH20', sets: ['2023_invalid', '2025_invalid', '2026_invalid'] },
    { mode: 'P2SH32', sets: ['2023_invalid', '2025_invalid', '2026_invalid'] },
  ],
  'invalid,p2sh20_standard': [
    { mode: 'nonP2SH', sets: ['2023_invalid', '2025_invalid', '2026_invalid'] },
    {
      mode: 'P2SH20',
      sets: ['2023_standard', '2025_standard', '2026_standard'],
    },
    { mode: 'P2SH32', sets: ['2023_invalid', '2025_invalid', '2026_invalid'] },
  ],
  'invalid,p2sh32_standard': [
    { mode: 'nonP2SH', sets: ['2023_invalid', '2025_invalid', '2026_invalid'] },
    { mode: 'P2SH20', sets: ['2023_invalid', '2025_invalid', '2026_invalid'] },
    {
      mode: 'P2SH32',
      sets: ['2023_standard', '2025_standard', '2026_standard'],
    },
  ],
  'invalid,p2sh_ignore': [
    { mode: 'nonP2SH', sets: ['2023_invalid', '2025_invalid', '2026_invalid'] },
  ],
  'invalid,p2sh_ignore,2023_nop2sh_nonstandard': [
    {
      mode: 'nonP2SH',
      sets: ['2023_nonstandard', '2025_invalid', '2026_invalid'],
    },
  ],
  'invalid,p2sh_standard': [
    { mode: 'nonP2SH', sets: ['2023_invalid', '2025_invalid', '2026_invalid'] },
    {
      mode: 'P2SH20',
      sets: ['2023_standard', '2025_standard', '2026_standard'],
    },
    {
      mode: 'P2SH32',
      sets: ['2023_standard', '2025_standard', '2026_standard'],
    },
  ],
  nonstandard: [
    {
      mode: 'nonP2SH',
      sets: ['2023_nonstandard', '2025_nonstandard', '2026_nonstandard'],
    },
    {
      mode: 'P2SH20',
      sets: ['2023_nonstandard', '2025_nonstandard', '2026_nonstandard'],
    },
    {
      mode: 'P2SH32',
      sets: ['2023_nonstandard', '2025_nonstandard', '2026_nonstandard'],
    },
  ],
  'nonstandard,p2sh_ignore': [
    {
      mode: 'nonP2SH',
      sets: ['2023_nonstandard', '2025_nonstandard', '2026_nonstandard'],
    },
  ],
  'nonstandard,p2sh_invalid': [
    {
      mode: 'nonP2SH',
      sets: ['2023_nonstandard', '2025_nonstandard', '2026_nonstandard'],
    },
    { mode: 'P2SH20', sets: ['2023_invalid', '2025_invalid', '2026_invalid'] },
    { mode: 'P2SH32', sets: ['2023_invalid', '2025_invalid', '2026_invalid'] },
  ],
  nop2sh_ignore: [
    {
      mode: 'P2SH20',
      sets: ['2023_standard', '2025_standard', '2026_standard'],
    },
    {
      mode: 'P2SH32',
      sets: ['2023_standard', '2025_standard', '2026_standard'],
    },
  ],
  nop2sh_invalid: [
    { mode: 'nonP2SH', sets: ['2023_invalid', '2025_invalid', '2026_invalid'] },
    {
      mode: 'P2SH20',
      sets: ['2023_standard', '2025_standard', '2026_standard'],
    },
    {
      mode: 'P2SH32',
      sets: ['2023_standard', '2025_standard', '2026_standard'],
    },
  ],
  'nop2sh_standard,p2sh_ignore': [
    {
      mode: 'nonP2SH',
      sets: ['2023_standard', '2025_standard', '2026_standard'],
    },
  ],
  p2sh32_nonstandard: [
    {
      mode: 'nonP2SH',
      sets: ['2023_nonstandard', '2025_nonstandard', '2026_nonstandard'],
    },
    {
      mode: 'P2SH20',
      sets: ['2023_standard', '2025_standard', '2026_standard'],
    },
    {
      mode: 'P2SH32',
      sets: ['2023_nonstandard', '2025_nonstandard', '2026_nonstandard'],
    },
  ],
  p2sh_ignore: [
    {
      mode: 'nonP2SH',
      sets: ['2023_nonstandard', '2025_nonstandard', '2026_nonstandard'],
    },
  ],
  p2sh_invalid: [
    {
      mode: 'nonP2SH',
      sets: ['2023_nonstandard', '2025_nonstandard', '2026_nonstandard'],
    },
    { mode: 'P2SH20', sets: ['2023_invalid', '2025_invalid', '2026_invalid'] },
    { mode: 'P2SH32', sets: ['2023_invalid', '2025_invalid', '2026_invalid'] },
  ],
  /* eslint-enable camelcase */
};
/* eslint-enable @typescript-eslint/naming-convention */

export type VmbTestDefinition = [
  /**
   * This script (defined using CashAssembly) is compiled to `unlockingBytecode`
   * in the test transaction(s) produced by this test definition.
   */
  unlockingScript: string,
  /**
   * This script (defined using CashAssembly) is compiled to the
   * `redeemBytecode` and/or `lockingBytecode` to be satisfied by
   * `unlockingScript`.
   *
   * By default, each test definitions generates two tests, one test uses this
   * value as a simple `lockingBytecode`, the other test encodes this value as
   * the `redeemBytecode` of a P2SH20 UTXO (properly appending it to
   * `unlockingBytecode` in the test transaction).
   *
   * For `standard` test definitions, the P2SH evaluation is tested in standard
   * mode and the non-P2SH evaluation is tested in non-standard mode (marked as
   * only a `valid` test). For `valid` test definitions, both tests are marked
   * as `valid`.
   */
  redeemOrLockingScript: string,
  testDescription: string,
  testSetOverrideLabels?: TestSetOverrideListBch,
  /**
   * A scenario that extends the default scenario for use with this test.
   */
  scenario?: WalletTemplateScenario,
  /**
   * An additional mapping of scripts to make available during scenario
   * generation.
   */
  additionalScripts?: WalletTemplate['scripts'],
];
export type VmbTestDefinitionGroup = [
  groupDescription: string,
  tests: VmbTestDefinition[],
];

/**
 * Short IDs use bech32 encoding, so birthday collisions will happen
 * approximately every `Math.sqrt(2 * (32 ** defaultShortIdLength))` tests.
 */
const defaultShortIdLength = 5;

const planTestsBch = (labels?: readonly string[]) => {
  const labelList = (labels ?? []).join(',');
  const sets = supportedTestSetOverridesBch[labelList];
  if (sets === undefined)
    // eslint-disable-next-line functional/no-throw-statements
    throw new Error(
      `Missing label list: ${labelList} in 'supportedTestSetOverridesBch'.`,
    );
  return sets;
};

/**
 * Given a VMB test definition, generate a full VMB test vector. Note, this
 * method throws immediately on the first test vector generation failure.
 */
export const vmbTestDefinitionToVmbTests = (
  testDefinition: VmbTestDefinition,
  groupName = '',
  shortIdLength = defaultShortIdLength,
): VmbTestMasterBch[] => {
  const [
    unlockingScript,
    redeemOrLockingScript,
    testDescription,
    testSetOverrideLabels,
    scenarioOverride,
    additionalScripts,
  ] = testDefinition;
  const scenarioId = 'test';

  const testGenerationPlan = planTestsBch(testSetOverrideLabels);

  const scenarioDefinition = { extends: 'vmb_default', ...scenarioOverride };

  const configuration = walletTemplateToCompilerConfiguration({
    entities: {
      tester: {
        variables: {
          key1: { type: 'HdKey' },
          key2: { privateDerivationPath: 'm/2/i', type: 'HdKey' },
          key3: { privateDerivationPath: 'm/3/i', type: 'HdKey' },
        },
      },
    },
    scenarios: {
      [scenarioId]: scenarioDefinition,
      // eslint-disable-next-line @typescript-eslint/naming-convention, camelcase
      vmb_default: slot1Scenario,
    },
    scripts: {
      ...additionalScripts,
      lockEmptyP2sh20: { lockingType: 'p2sh20', script: '' },
      lockP2pkh: {
        lockingType: 'standard',
        script:
          'OP_DUP OP_HASH160 <$(<key1.public_key> OP_HASH160)> OP_EQUALVERIFY OP_CHECKSIG',
      },
      lockP2sh20: { lockingType: 'p2sh20', script: redeemOrLockingScript },
      lockP2sh32: { lockingType: 'p2sh32', script: redeemOrLockingScript },
      lockStandard: { lockingType: 'standard', script: redeemOrLockingScript },
      unlockEmptyP2sh20: { script: '<1>', unlocks: 'lockEmptyP2sh20' },
      unlockP2pkh: {
        /**
         * Uses `corresponding_output_single_input` to reuse the same signature
         * as much as possible (making VMB test files more compressible).
         */
        script:
          '<key1.schnorr_signature.corresponding_output_single_input> <key1.public_key>',
        unlocks: 'lockP2pkh',
      },
      unlockP2pkhStandardEcdsa: {
        script: '<key1.ecdsa_signature.all_outputs> <key1.public_key>',
        unlocks: 'lockP2pkh',
      },
      unlockP2pkhStandardSchnorr: {
        script: '<key1.schnorr_signature.all_outputs> <key1.public_key>',
        unlocks: 'lockP2pkh',
      },
      unlockP2sh20: { script: unlockingScript, unlocks: 'lockP2sh20' },
      unlockP2sh32: { script: unlockingScript, unlocks: 'lockP2sh32' },
      unlockStandard: { script: unlockingScript, unlocks: 'lockStandard' },
      vmbTestNullData: {
        lockingType: 'standard',
        script: 'OP_RETURN <"vmb_test">',
      },
    },
    supported: ['BCH_2022_05'],
  });
  const compiler = createCompilerBch(configuration);

  const tests = testGenerationPlan.map((planItem) => {
    const description = `${groupName}: ${testDescription} (${planItem.mode})`;
    const result = compiler.generateScenario({
      debug: true,
      scenarioId,
      unlockingScriptId: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        P2SH20: 'unlockP2sh20',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        P2SH32: 'unlockP2sh32',
        nonP2SH: 'unlockStandard',
      }[planItem.mode],
    });
    if (typeof result === 'string') {
      // eslint-disable-next-line functional/no-throw-statements
      throw new Error(`Error while generating "${description}" - ${result}`);
    }
    if (typeof result.scenario === 'string') {
      // eslint-disable-next-line functional/no-throw-statements
      throw new Error(
        `Error while generating "${description}" - ${result.scenario}`,
      );
    }
    const encodedTx = encodeTransaction(result.scenario.program.transaction);
    const encodedSourceOutputs = encodeTransactionOutputs(
      result.scenario.program.sourceOutputs,
    );
    const shortId = encodeBech32(
      regroupBits({
        bin: sha256.hash(flattenBinArray([encodedTx, encodedSourceOutputs])),
        resultWordLength: 5,
        sourceWordLength: 8,
      }) as number[],
    ).slice(0, shortIdLength);

    const testCase = [
      shortId,
      description,
      unlockingScript,
      redeemOrLockingScript,
      binToHex(encodedTx),
      binToHex(encodedSourceOutputs),
      planItem.sets,
    ];

    return (
      result.scenario.program.inputIndex === 0
        ? testCase
        : [...testCase, result.scenario.program.inputIndex]
    ) as VmbTestMasterBch;
  });

  return tests;
};

export const vmbTestGroupToVmbTests = (testGroup: VmbTestDefinitionGroup) =>
  testGroup[1].map((testDefinition) =>
    vmbTestDefinitionToVmbTests(testDefinition, testGroup[0]),
  );

/**
 * Partition a master test list (produced by {@link vmbTestGroupToVmbTests} or
 * {@link vmbTestDefinitionToVmbTests}) into sets. E.g.:
 * ```ts
 * const definitions: VmbTestDefinitionGroup[] = [...]
 * const master = [
 *   vmbTestDefinitionToVmbTests(...),
 *   vmbTestDefinitionToVmbTests(...),
 * ];
 * const partitioned = vmbTestPartitionMasterTestList(master);
 * ```
 * Or:
 * ```ts
 * const definitions: VmbTestDefinitionGroup[] = [...]
 * const master = definitions.map(vmbTestGroupToVmbTests).flat(2);
 * const partitioned = vmbTestPartitionMasterTestList(master);
 * ```
 * Tests are aggregated by set into a map of test sets (e.g. to export to
 * separate files).
 */
export const vmbTestPartitionMasterTestList = (
  masterTestList: VmbTestMasterBch[],
) =>
  masterTestList.reduce<{
    [key in TestSetIdBch]?: VmbTest[];
  }>((accumulatedTestSets, testCase) => {
    const [
      shortId,
      testDescription,
      unlockingScriptAsm,
      redeemOrLockingScriptAsm,
      testTransactionHex,
      sourceOutputsHex,
      testSets,
      inputIndex,
    ] = testCase;

    const withoutSets = [
      shortId,
      testDescription,
      unlockingScriptAsm,
      redeemOrLockingScriptAsm,
      testTransactionHex,
      sourceOutputsHex,
      ...(inputIndex === undefined ? [] : [inputIndex]),
    ] as VmbTest;

    // eslint-disable-next-line functional/no-return-void, functional/no-expression-statements
    testSets.forEach((testSet) => {
      // eslint-disable-next-line functional/immutable-data, functional/no-expression-statements
      accumulatedTestSets[testSet] = [
        ...(accumulatedTestSets[testSet] ?? []),
        withoutSets,
      ];
    });
    return accumulatedTestSets;
  }, {});
