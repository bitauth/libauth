/**
 * This script generates all bch_vmb_tests, run it with: `yarn gen:tests`.
 */
import { encodeBech32, regroupBits } from '../address/address.js';
import { createCompilerBCH } from '../compiler/compiler-bch/compiler-bch.js';
import { authenticationTemplateToCompilerConfiguration } from '../compiler/compiler-utils.js';
import { sha256 } from '../crypto/default-crypto-instances.js';
import { binToHex, flattenBinArray } from '../format/format.js';
import type {
  AuthenticationTemplate,
  AuthenticationTemplateScenario,
} from '../lib';
import {
  encodeTransaction,
  encodeTransactionOutputs,
} from '../message/message.js';

import { slot1Scenario } from './bch-vmb-test-mixins.js';

/**
 * These are the VM versions for which tests are currently generated.
 *
 * A new 4-digit year should be added to prepare for each annual upgrade.
 * Libauth can also support testing of draft proposals by specifying a short
 * identifier for each independent proposal.
 */
const vmVersions = [
  '2021',
  '2022',
  'chip_cashtokens',
  'chip_limits',
  'chip_loops',
  'chip_minimalbool',
  'chip_p2sh32',
  'chip_strict_checkmultisig',
  'chip_zce',
] as const;
/**
 * These are the VM "modes" for which tests can be generated.
 */
const vmModes = ['nop2sh', 'p2sh20', 'p2sh32'] as const;

type TestSetType = 'invalid' | 'standard' | 'valid';
type TestSetOverrideType = TestSetType | 'ignore';
type VmVersion = typeof vmVersions[number];
type VmMode = typeof vmModes[number];
type TestSetOverride =
  | `${TestSetOverrideType}`
  | `${VmMode}_${TestSetOverrideType}`
  | `${VmVersion}_${TestSetOverrideType}`
  | `${VmVersion}_${VmMode}_${TestSetOverrideType}`;

export const vmbTestDefinitionDefaultBehavior: TestSetOverride[] = [
  'nop2sh_valid',
  'p2sh20_standard',
  'p2sh32_ignore',
];

export type TestSet = `${VmVersion}_${TestSetType}`;

export type VmbTestMaster = [
  shortId: string,
  testDescription: string,
  unlockingScriptAsm: string,
  redeemOrLockingScriptAsm: string,
  testTransactionHex: string,
  sourceOutputsHex: string,
  testSets: TestSet[],
  /**
   * This isn't required for testing (implementations should always validate the
   * full test transaction), but it can allow downstream applications to
   * identify which source output/transaction input index is the focus of each
   * test. This is sometimes useful for debugging or for VM documentation
   * projects that extract usage examples from vmb tests.
   *
   * This field is left undefined for `inputIndex`s of `0` (the default).
   */
  inputIndex?: number
];

export type VmbTest = [
  shortId: string,
  testDescription: string,
  unlockingScriptAsm: string,
  redeemOrLockingScriptAsm: string,
  testTransactionHex: string,
  sourceOutputsHex: string,
  inputIndex?: number
];

/* eslint-disable @typescript-eslint/naming-convention */
/**
 * The list of test set overrides currently supported. Eventually this should be
 * `TestSetOverride`.
 *
 * For now, this implementation simplifies VMB test generation – we just
 * `join()` the provided overrides and look up resulting modes/test sets here.
 */
type SupportedTestSetOverrideLists =
  | ['2021_invalid', '2022_valid', 'p2sh_ignore']
  | ['2021_invalid', '2022_valid']
  | ['2021_invalid', 'nonP2sh_invalid']
  | ['2021_invalid', 'nonP2sh20_invalid']
  | ['2021_invalid', 'p2sh_ignore']
  | ['2021_invalid', 'p2sh_invalid']
  | ['2021_invalid']
  | ['invalid', '2022_nonP2sh_valid']
  | ['invalid', '2022_p2sh_standard']
  | ['invalid', 'nonP2sh_valid']
  | ['invalid', 'p2sh_ignore']
  | ['invalid']
  | ['valid']
  | [];
export const supportedTestSetOverrides: {
  [joinedList: string]: {
    mode: 'nonP2SH' | 'P2SH20' | 'P2SH32';
    sets: TestSet[];
  }[];
} = {
  '': [
    { mode: 'nonP2SH', sets: ['2021_valid', '2022_valid'] },
    { mode: 'P2SH20', sets: ['2021_standard', '2022_standard'] },
  ],
  '2021_invalid': [
    { mode: 'nonP2SH', sets: ['2021_invalid', '2022_valid'] },
    { mode: 'P2SH20', sets: ['2021_invalid', '2022_standard'] },
  ],
  '2021_invalid,2022_valid': [
    { mode: 'nonP2SH', sets: ['2021_invalid', '2022_valid'] },
    { mode: 'P2SH20', sets: ['2021_invalid', '2022_valid'] },
  ],
  '2021_invalid,2022_valid,p2sh_ignore': [
    { mode: 'nonP2SH', sets: ['2021_invalid', '2022_valid'] },
  ],
  '2021_invalid,nonP2sh20_invalid': [
    { mode: 'nonP2SH', sets: ['2021_invalid', '2022_invalid'] },
    { mode: 'P2SH20', sets: ['2021_invalid', '2022_standard'] },
  ],
  '2021_invalid,nonP2sh_invalid': [
    { mode: 'nonP2SH', sets: ['2021_invalid', '2022_invalid'] },
    { mode: 'P2SH20', sets: ['2021_invalid', '2022_standard'] },
  ],
  '2021_invalid,p2sh_ignore': [
    { mode: 'nonP2SH', sets: ['2021_invalid', '2022_valid'] },
  ],
  '2021_invalid,p2sh_invalid': [
    { mode: 'nonP2SH', sets: ['2021_invalid', '2022_valid'] },
    { mode: 'P2SH20', sets: ['2021_invalid', '2022_invalid'] },
  ],
  invalid: [
    { mode: 'nonP2SH', sets: ['2021_invalid', '2022_invalid'] },
    { mode: 'P2SH20', sets: ['2021_invalid', '2022_invalid'] },
  ],
  'invalid,2022_nonP2sh_valid': [
    { mode: 'nonP2SH', sets: ['2021_invalid', '2022_valid'] },
    { mode: 'P2SH20', sets: ['2021_invalid', '2022_invalid'] },
  ],
  'invalid,2022_p2sh_standard': [
    { mode: 'nonP2SH', sets: ['2021_invalid', '2022_invalid'] },
    { mode: 'P2SH20', sets: ['2021_invalid', '2022_standard'] },
  ],
  'invalid,nonP2sh_valid': [
    { mode: 'nonP2SH', sets: ['2021_valid', '2022_valid'] },
    { mode: 'P2SH20', sets: ['2021_invalid', '2022_invalid'] },
  ],
  'invalid,p2sh_ignore': [
    { mode: 'nonP2SH', sets: ['2021_invalid', '2022_invalid'] },
  ],
  valid: [
    { mode: 'nonP2SH', sets: ['2021_valid', '2022_valid'] },
    { mode: 'P2SH20', sets: ['2021_valid', '2022_valid'] },
  ],
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
  testSetOverrideLabels?: SupportedTestSetOverrideLists,
  /**
   * A scenario that extends the default scenario for use with this test.
   */
  scenario?: AuthenticationTemplateScenario,
  /**
   * An additional mapping of scripts to make available during scenario
   * generation.
   */
  additionalScripts?: AuthenticationTemplate['scripts']
];
export type VmbTestDefinitionGroup = [
  groupDescription: string,
  tests: VmbTestDefinition[]
];

/**
 * Short IDs use bech32 encoding, so birthday collisions will happen
 * approximately every `Math.sqrt(2 * (32 ** defaultShortIdLength))` tests.
 */
const defaultShortIdLength = 5;

/**
 * Given a VMB test definition, generate a full VMB test vector. Note, this
 * method throws immediately on the first test vector generation failure.
 */
export const vmbTestDefinitionToVmbTests = (
  testDefinition: VmbTestDefinition,
  groupName = '',
  shortIdLength = defaultShortIdLength
): VmbTestMaster[] => {
  const [
    unlockingScript,
    redeemOrLockingScript,
    testDescription,
    testSetOverrideLabels,
    scenarioOverride,
    additionalScripts,
  ] = testDefinition;
  const scenarioId = 'test';

  const testGenerationPlan =
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    supportedTestSetOverrides[(testSetOverrideLabels ?? []).join(',')]!;

  const scenarioDefinition = { extends: 'vmb_default', ...scenarioOverride };

  const configuration = authenticationTemplateToCompilerConfiguration({
    entities: { tester: { variables: { key1: { type: 'HdKey' } } } },
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
      unlockP2sh20: { script: unlockingScript, unlocks: 'lockP2sh20' },
      unlockStandard: { script: unlockingScript, unlocks: 'lockStandard' },
      vmbTestNullData: {
        lockingType: 'standard',
        script: 'OP_RETURN <"vmb_test">',
      },
    },
    supported: ['BCH_2022_05'],
    version: 0,
  });
  const compiler = createCompilerBCH(configuration);

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
      // eslint-disable-next-line functional/no-throw-statement
      throw new Error(`Error while generating "${description}" - ${result}`);
    }
    if (typeof result.scenario === 'string') {
      // eslint-disable-next-line functional/no-throw-statement
      throw new Error(
        `Error while generating "${description}" - ${result.scenario}`
      );
    }
    const encodedTx = encodeTransaction(result.scenario.program.transaction);
    const encodedSourceOutputs = encodeTransactionOutputs(
      result.scenario.program.sourceOutputs
    );
    const shortId = encodeBech32(
      regroupBits({
        bin: sha256.hash(flattenBinArray([encodedTx, encodedSourceOutputs])),
        resultWordLength: 5,
        sourceWordLength: 8,
      }) as number[]
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
    ) as VmbTestMaster;
  });

  return tests;
};

export const vmbTestGroupToVmbTests = (testGroup: VmbTestDefinitionGroup) =>
  testGroup[1].map((testDefinition) =>
    vmbTestDefinitionToVmbTests(testDefinition, testGroup[0])
  );
