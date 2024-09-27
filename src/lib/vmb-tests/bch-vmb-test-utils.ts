/* eslint-disable max-lines */
/**
 * This script generates all bch_vmb_tests, run it with: `yarn gen:tests`.
 */
import { encodeBech32, regroupBits } from '../address/address.js';
import { createCompilerBch } from '../compiler/compiler-bch/compiler-bch.js';
import { walletTemplateToCompilerConfiguration } from '../compiler/compiler-utils.js';
import { sha256 } from '../crypto/crypto.js';
import { binToHex, flattenBinArray, sortObjectKeys } from '../format/format.js';
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
  'spec',
  'chip_bigint',
  'chip_limits',
  'chip_loops',
  'chip_zce',
  'chip_txv5',
  /* For error reporting in combinatorial test generation: */ 'unknown',
  /* For skipping in combinatorial test generation: */ 'skip',
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
  ['chip_bigint_invalid'],
  ['chip_bigint'],
  ['chip_bigint', 'nonstandard'],
  ['chip_bigint', 'nonstandard', 'nop2sh_invalid'],
  ['chip_bigint', 'nonstandard', 'p2sh_invalid'],
  ['chip_bigint', 'nop2sh_invalid'],
  ['spec'],
  ['2023_invalid'],
  ['2023_invalid', '2025_nonstandard', 'p2sh_ignore'],
  ['2023_invalid', 'nop2sh_ignore'],
  ['2023_invalid', 'nop2sh_ignore', 'p2sh20_ignore'],
  ['2023_invalid', 'nop2sh_ignore', 'p2sh32_ignore'],
  ['2023_invalid', 'p2sh_ignore'],
  ['2023_p2sh_invalid'],
  ['chip_loops_invalid'],
  ['chip_loops'],
  ['invalid', '2023_nonstandard'],
  ['invalid', '2023_nonstandard', 'p2sh_ignore'],
  ['invalid', '2025_nonstandard', 'p2sh_ignore'],
  ['invalid', 'nop2sh_ignore'],
  ['invalid', 'nop2sh_nonstandard'],
  ['invalid', 'p2sh_ignore', '2023_nop2sh_nonstandard'],
  ['invalid', 'p2sh_ignore'],
  ['invalid', 'p2sh_standard'],
  ['invalid', 'p2sh20_standard'],
  ['invalid', 'p2sh32_standard'],
  ['invalid'],
  ['nop2sh_ignore'],
  ['nop2sh_ignore', 'p2sh32_ignore'],
  ['nop2sh_invalid'],
  ['nop2sh_invalid', '2023_p2sh_invalid'],
  ['nop2sh_invalid', '2023_p2sh_nonstandard'],
  ['nop2sh_invalid', '2023_nop2sh_nonstandard'],
  ['nop2sh_standard'],
  ['nop2sh_standard', 'p2sh_ignore'],
  ['nonstandard'],
  ['nonstandard', '2023_invalid'],
  ['nonstandard', '2023_invalid', 'p2sh_ignore'],
  ['nonstandard', 'nop2sh_ignore', '2023_p2sh_standard'],
  ['nonstandard', 'nop2sh_ignore', '2023_p2sh_standard', 'p2sh32_ignore'],
  ['nonstandard', 'nop2sh_ignore', 'p2sh32_ignore'],
  ['nonstandard', 'nop2sh_invalid', '2023_invalid'],
  ['nonstandard', 'p2sh_ignore'],
  ['nonstandard', 'p2sh_invalid'],
  ['p2sh_ignore'],
  ['p2sh_invalid'],
  ['p2sh32_nonstandard'],
  ['skip'],
  ['unknown'],
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
  '2023_invalid,2025_nonstandard,p2sh_ignore': [
    {
      mode: 'nonP2SH',
      sets: ['2023_invalid', '2025_nonstandard', '2026_nonstandard'],
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
  '2023_invalid,nop2sh_ignore,p2sh20_ignore': [
    {
      mode: 'P2SH32',
      sets: ['2023_invalid', '2025_standard', '2026_standard'],
    },
  ],
  '2023_invalid,nop2sh_ignore,p2sh32_ignore': [
    {
      mode: 'P2SH20',
      sets: ['2023_invalid', '2025_standard', '2026_standard'],
    },
  ],
  '2023_invalid,p2sh_ignore': [
    {
      mode: 'nonP2SH',
      sets: ['2023_invalid', '2025_nonstandard', '2026_nonstandard'],
    },
  ],
  '2023_p2sh_invalid': [
    {
      mode: 'nonP2SH',
      sets: ['2023_nonstandard', '2025_nonstandard', '2026_nonstandard'],
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
  /**
   * `chip_*` values exclude the marked test from
   * {@link vmbTestDefinitionDefaultBehaviorBch}.
   */
  chip_bigint: [
    {
      mode: 'nonP2SH',
      sets: ['chip_bigint_nonstandard', '2023_invalid', '2025_nonstandard'],
    },
    {
      mode: 'P2SH20',
      sets: ['chip_bigint_standard', '2023_invalid', '2025_standard'],
    },
    {
      mode: 'P2SH32',
      sets: ['chip_bigint_standard', '2023_invalid', '2025_standard'],
    },
  ],
  'chip_bigint,nonstandard': [
    {
      mode: 'nonP2SH',
      sets: ['chip_bigint_nonstandard', '2023_invalid', '2025_nonstandard'],
    },
    {
      mode: 'P2SH20',
      sets: ['chip_bigint_nonstandard', '2023_invalid', '2025_nonstandard'],
    },
    {
      mode: 'P2SH32',
      sets: ['chip_bigint_nonstandard', '2023_invalid', '2025_nonstandard'],
    },
  ],
  'chip_bigint,nonstandard,nop2sh_invalid': [
    {
      mode: 'nonP2SH',
      sets: ['chip_bigint_invalid', '2023_invalid', '2025_invalid'],
    },
    {
      mode: 'P2SH20',
      sets: ['chip_bigint_nonstandard', '2023_invalid', '2025_nonstandard'],
    },
    {
      mode: 'P2SH32',
      sets: ['chip_bigint_nonstandard', '2023_invalid', '2025_nonstandard'],
    },
  ],
  'chip_bigint,nonstandard,p2sh_invalid': [
    {
      mode: 'nonP2SH',
      sets: ['chip_bigint_nonstandard', '2023_invalid', '2025_nonstandard'],
    },
    {
      mode: 'P2SH20',
      sets: ['chip_bigint_invalid', '2023_invalid', '2025_invalid'],
    },
    {
      mode: 'P2SH32',
      sets: ['chip_bigint_invalid', '2023_invalid', '2025_invalid'],
    },
  ],
  'chip_bigint,nop2sh_invalid': [
    {
      mode: 'nonP2SH',
      sets: ['chip_bigint_invalid', '2023_invalid', '2025_invalid'],
    },
    {
      mode: 'P2SH20',
      sets: ['chip_bigint_standard', '2023_invalid', '2025_standard'],
    },
    {
      mode: 'P2SH32',
      sets: ['chip_bigint_standard', '2023_invalid', '2025_standard'],
    },
  ],
  chip_bigint_invalid: [
    {
      mode: 'nonP2SH',
      sets: ['chip_bigint_invalid', '2023_invalid', '2025_invalid'],
    },
    {
      mode: 'P2SH20',
      sets: ['chip_bigint_invalid', '2023_invalid', '2025_invalid'],
    },
    {
      mode: 'P2SH32',
      sets: ['chip_bigint_invalid', '2023_invalid', '2025_invalid'],
    },
  ],
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
  'invalid,2023_nonstandard': [
    {
      mode: 'nonP2SH',
      sets: ['2023_nonstandard', '2025_invalid', '2026_invalid'],
    },
    {
      mode: 'P2SH20',
      sets: ['2023_nonstandard', '2025_invalid', '2026_invalid'],
    },
    {
      mode: 'P2SH32',
      sets: ['2023_nonstandard', '2025_invalid', '2026_invalid'],
    },
  ],
  'invalid,2023_nonstandard,p2sh_ignore': [
    {
      mode: 'nonP2SH',
      sets: ['2023_nonstandard', '2025_invalid', '2026_invalid'],
    },
  ],
  'invalid,2025_nonstandard,p2sh_ignore': [
    {
      mode: 'nonP2SH',
      sets: ['2023_invalid', '2025_nonstandard', '2026_invalid'],
    },
  ],
  'invalid,nop2sh_ignore': [
    { mode: 'P2SH20', sets: ['2023_invalid', '2025_invalid', '2026_invalid'] },
    { mode: 'P2SH32', sets: ['2023_invalid', '2025_invalid', '2026_invalid'] },
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
  'nonstandard,2023_invalid': [
    {
      mode: 'nonP2SH',
      sets: ['2023_invalid', '2025_nonstandard', '2026_nonstandard'],
    },
    {
      mode: 'P2SH20',
      sets: ['2023_invalid', '2025_nonstandard', '2026_nonstandard'],
    },
    {
      mode: 'P2SH32',
      sets: ['2023_invalid', '2025_nonstandard', '2026_nonstandard'],
    },
  ],
  'nonstandard,2023_invalid,p2sh_ignore': [
    {
      mode: 'nonP2SH',
      sets: ['2023_invalid', '2025_nonstandard', '2026_nonstandard'],
    },
  ],
  'nonstandard,nop2sh_ignore,2023_p2sh_standard': [
    {
      mode: 'P2SH20',
      sets: ['2023_standard', '2025_nonstandard', '2026_nonstandard'],
    },
    {
      mode: 'P2SH32',
      sets: ['2023_standard', '2025_nonstandard', '2026_nonstandard'],
    },
  ],
  'nonstandard,nop2sh_ignore,2023_p2sh_standard,p2sh32_ignore': [
    {
      mode: 'P2SH20',
      sets: ['2023_standard', '2025_nonstandard', '2026_nonstandard'],
    },
  ],
  'nonstandard,nop2sh_ignore,p2sh32_ignore': [
    {
      mode: 'P2SH20',
      sets: ['2023_nonstandard', '2025_nonstandard', '2026_nonstandard'],
    },
  ],
  'nonstandard,nop2sh_invalid,2023_invalid': [
    {
      mode: 'nonP2SH',
      sets: ['2023_invalid', '2025_invalid', '2026_invalid'],
    },
    {
      mode: 'P2SH20',
      sets: ['2023_invalid', '2025_nonstandard', '2026_nonstandard'],
    },
    {
      mode: 'P2SH32',
      sets: ['2023_invalid', '2025_nonstandard', '2026_nonstandard'],
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
  'nop2sh_ignore,p2sh32_ignore': [
    {
      mode: 'P2SH20',
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
  'nop2sh_invalid,2023_nop2sh_nonstandard': [
    {
      mode: 'nonP2SH',
      sets: ['2023_nonstandard', '2025_invalid', '2026_invalid'],
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
  'nop2sh_invalid,2023_p2sh_invalid': [
    {
      mode: 'nonP2SH',
      sets: ['2023_nonstandard', '2025_invalid', '2026_invalid'],
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
  'nop2sh_invalid,2023_p2sh_nonstandard': [
    { mode: 'nonP2SH', sets: ['2023_invalid', '2025_invalid', '2026_invalid'] },
    {
      mode: 'P2SH20',
      sets: ['2023_nonstandard', '2025_standard', '2026_standard'],
    },
    {
      mode: 'P2SH32',
      sets: ['2023_nonstandard', '2025_standard', '2026_standard'],
    },
  ],
  nop2sh_standard: [
    {
      mode: 'nonP2SH',
      sets: ['2023_standard', '2025_standard', '2026_standard'],
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
  /**
   * `spec_*` values exclude the marked test from
   * {@link vmbTestDefinitionDefaultBehaviorBch}.
   */
  spec: [
    { mode: 'nonP2SH', sets: ['spec_nonstandard'] },
    { mode: 'P2SH20', sets: ['spec_standard'] },
    { mode: 'P2SH32', sets: ['spec_standard'] },
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
const defaultShortIdLength = 6;

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
          key4: { privateDerivationPath: 'm/4/i', type: 'HdKey' },
          key5: { privateDerivationPath: 'm/5/i', type: 'HdKey' },
          key6: { privateDerivationPath: 'm/6/i', type: 'HdKey' },
          key7: { privateDerivationPath: 'm/7/i', type: 'HdKey' },
          key8: { privateDerivationPath: 'm/8/i', type: 'HdKey' },
          key9: { privateDerivationPath: 'm/9/i', type: 'HdKey' },
          ...{
            key10: { privateDerivationPath: 'm/10/i', type: 'HdKey' },
            key11: { privateDerivationPath: 'm/11/i', type: 'HdKey' },
            key12: { privateDerivationPath: 'm/12/i', type: 'HdKey' },
            key13: { privateDerivationPath: 'm/13/i', type: 'HdKey' },
            key14: { privateDerivationPath: 'm/14/i', type: 'HdKey' },
            key15: { privateDerivationPath: 'm/15/i', type: 'HdKey' },
            key16: { privateDerivationPath: 'm/16/i', type: 'HdKey' },
            key17: { privateDerivationPath: 'm/17/i', type: 'HdKey' },
            key18: { privateDerivationPath: 'm/18/i', type: 'HdKey' },
            key19: { privateDerivationPath: 'm/18/i', type: 'HdKey' },
          },
          ...{
            key20: { privateDerivationPath: 'm/20/i', type: 'HdKey' },
          },
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
      lockBareMultisig1of3: {
        lockingType: 'standard',
        script:
          '<1> <key1.public_key> <key2.public_key> <key3.public_key> OP_3 OP_CHECKMULTISIG',
      },
      lockEmptyP2sh20: { lockingType: 'p2sh20', script: '' },
      lockP2pk: {
        lockingType: 'standard',
        script: '<key1.public_key> OP_CHECKSIG',
      },
      lockP2pkh: {
        lockingType: 'standard',
        script:
          'OP_DUP OP_HASH160 <$(<key1.public_key> OP_HASH160)> OP_EQUALVERIFY OP_CHECKSIG',
      },
      lockP2sh20: { lockingType: 'p2sh20', script: redeemOrLockingScript },
      lockP2sh32: { lockingType: 'p2sh32', script: redeemOrLockingScript },
      lockStandard: { lockingType: 'standard', script: redeemOrLockingScript },
      unlockBareMultisig1of3Ecdsa: {
        script: '<0> <key1.ecdsa_signature.all_outputs>',
        unlocks: 'lockBareMultisig1of3',
      },
      unlockBareMultisig1of3Schnorr: {
        script: '<0b001> <key1.schnorr_signature.all_outputs>',
        unlocks: 'lockBareMultisig1of3',
      },
      unlockEmptyP2sh20: { script: '<1>', unlocks: 'lockEmptyP2sh20' },
      unlockP2pkStandardEcdsa: {
        script: '<key1.ecdsa_signature.all_outputs>',
        unlocks: 'lockP2pk',
      },
      unlockP2pkStandardSchnorr: {
        script: '<key1.schnorr_signature.all_outputs>',
        unlocks: 'lockP2pk',
      },
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
        `Error while generating "${description}" - ${result.scenario}. Unlocking script: ${unlockingScript}. Redeem or locking script: ${redeemOrLockingScript}.`,
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

export type PossibleTestValue = [description: string, value: string];
export type TestValues = PossibleTestValue[];

/**
 * Given an array of arrays, produce an array of all possible combinations.
 * E.g.: `[['a', 'b'], [1, 2], ['x']]` produces:
 * `[ [ 'a', 1, 'x' ], [ 'a', 2, 'x' ], [ 'b', 1, 'x' ], [ 'b', 2, 'x' ] ]`.
 * @param arrays - an array of arrays
 */
export const generateCombinations = <T>(arrays: T[][]): T[][] =>
  arrays.reduce<T[][]>(
    (acc, curr) => acc.flatMap((combo) => curr.map((item) => [...combo, item])),
    [[]],
  );

/**
 * Map an array of value arrays onto a a template test case.
 * @param templates - templates for unlockingScript, lockingScript, and
 * test description.
 * @param possibleValues - an array of arrays of `PossibleValue`s
 */
export const mapTestCases = (
  templates: [
    unlockingScript: string,
    lockingScript: string,
    description: string,
  ],
  combinations: TestValues[],
  {
    prefixAsHexLiterals = false,
    scenario,
  }: { prefixAsHexLiterals?: boolean; scenario?: WalletTemplateScenario } = {},
): VmbTestDefinition[] =>
  combinations.map((values) => {
    const replace = (template: string, useLabel = false) =>
      // eslint-disable-next-line complexity
      template.replace(/\$(?<index>\d+)/gu, (_, index) => {
        const raw = `${prefixAsHexLiterals && !useLabel ? '0x' : ''}${
          values[Number(index)]?.[useLabel ? 0 : 1] ??
          'LIBAUTH_GENERATION_ERROR_UNKNOWN_INDEX'
        }`;
        return raw === '0x' ? '0' : raw;
      });
    return [
      replace(templates[0]),
      replace(templates[1]),
      replace(templates[2], true),
      [],
      scenario,
    ];
  });

/**
 * Given a template test case and an array of possible-value arrays, produce a
 * combinatorial set of test cases.
 * @param templates - templates for unlockingScript, lockingScript, and
 * test description.
 * @param possibleValues - an array of arrays of `PossibleValue`s
 */
export const generateTestCases = (
  templates: [
    unlockingScript: string,
    lockingScript: string,
    description: string,
  ],
  possibleValues: PossibleTestValue[][],
  { scenario }: { scenario?: WalletTemplateScenario } = {},
): VmbTestDefinition[] => {
  const combinations = generateCombinations(possibleValues);
  return mapTestCases(templates, combinations, { scenario });
};

type TestSetOverrideListBchIndex = 3;
/**
 * Given a generated set of tests, set expected results using a dictionary of
 * descriptions.
 *
 * To make updating tests easier, the test definitions include tests that aren't
 * included in the dictionary, this function logs the new dictionary and throws
 * (to exit early).
 *
 * To exclude a particular case from the resulting set, mark it as `['skip']`,
 * (e.g. if that particular test is already manually defined elsewhere.)
 */
export const setExpectedResults = (
  generatedDefinitions: VmbTestDefinition[],
  resultDictionary: {
    [description: string]:
      | VmbTestDefinition[TestSetOverrideListBchIndex]
      | ['skip'];
  },
  /**
   * A place to drop quick functions to bulk edit the dictionary. If set, the
   * corrected dictionary will be logged quickly and an error thrown.
   */
  macroEdit?: (
    description: string,
    currentSets: VmbTestDefinition[TestSetOverrideListBchIndex],
  ) => VmbTestDefinition[TestSetOverrideListBchIndex],
): VmbTestDefinition[] => {
  const results = generatedDefinitions.map((definition) => {
    const [_unlockingScript, _redeemOrLockingScript, testDescription, _labels] =
      definition;
    // eslint-disable-next-line functional/no-expression-statements, functional/immutable-data
    definition[3] = resultDictionary[testDescription] ?? ['unknown'];
    return definition;
  });
  const descriptions = generatedDefinitions.map((def) => def[2]);
  const extraKeys = Object.keys(resultDictionary).filter(
    (key) => !descriptions.includes(key),
  );
  const hasUnknownResults = results.some(
    (definition) => definition[3]?.[0] === 'unknown',
  );
  if (macroEdit !== undefined || extraKeys.length > 0 || hasUnknownResults) {
    const newDictionary = results.reduce<{
      [description: string]: VmbTestDefinition[TestSetOverrideListBchIndex];
    }>(
      (dict, def) =>
        macroEdit === undefined
          ? { ...dict, [def[2]]: def[3] }
          : { ...dict, [def[2]]: macroEdit(def[2], def[3]) },
      {},
    );
    const sorted = sortObjectKeys(newDictionary) as typeof newDictionary;
    // eslint-disable-next-line functional/no-expression-statements, no-console
    console.log(sorted);
    // eslint-disable-next-line functional/no-expression-statements, no-console
    console.log(`Generated test count: ${Object.keys(sorted).length}`);
    // eslint-disable-next-line functional/no-throw-statements
    throw new Error(
      `Libauth test generation error: one or more test cases in the above set have not been reviewed for expected behavior. Please update the above result dictionary for the relevant "setExpectedResults" and regenerate the tests.`,
    );
  }
  return results.filter((def) => def[3]?.[0] !== 'skip');
};
