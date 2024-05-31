/* eslint-disable @typescript-eslint/no-magic-numbers */
/**
 * See `bch-vmb-tests.ts` for details about modifying this file.
 */

import type { VmbTestDefinitionGroup, WalletTemplateScenario } from '../../lib.js';
import { binToHex, cashAssemblyToBin, range } from '../../lib.js';

const repeat = (cashAssembly: string, count: number) =>
  range(count)
    .map(() => cashAssembly)
    .join(' ');

const cashAssemblyToHex = (cashAssembly: string) => binToHex(cashAssemblyToBin(cashAssembly) as Uint8Array);

/**
 * A scenario for the minimal-possible standard transaction: a single input evaluating the construction under test, and a single, 1-byte output. Because the output is a data-carrier output (A.K.A. "OP_RETURN" output), it's considered valid without including a `valueSatoshis` exceeding the dust threshold.
 *
 * Note that in v1 and v2 transactions, `valueSatoshis` is encoded in a fixed width, so the arbitrary 10,000-satoshi, source output value is chosen here simply for consistency across benchmarks.
 */
const minimalScenarioStandard: WalletTemplateScenario = {
  sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }],
  transaction: {
    inputs: [{ unlockingBytecode: ['slot'] }],
    outputs: [{ lockingBytecode: cashAssemblyToHex('OP_RETURN'), valueSatoshis: 0 }],
  },
};

/**
 * A scenario for padding the size of {@link minimalScenarioStandard} (by appending additional bytes to the OP_RETURN output) to meet the minimum transaction size of 65 bytes.
 * @param bytes - the number of bytes to append
 */
const minimalScenarioStandardPlusBytes = (bytes: number): WalletTemplateScenario => ({
  sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }],
  transaction: {
    inputs: [{ unlockingBytecode: ['slot'] }],
    outputs: [{ lockingBytecode: cashAssemblyToHex(`OP_RETURN <${repeat('"a"', bytes)}>`), valueSatoshis: 0 }],
  },
});

/**
 * A scenario to pack a full transaction with the contract in question. The last
 * input is marked as the input under test to ensure that `metrics` returned by
 * VMB unit tests aggregate results from all transaction inputs.
 * @param using - the locking script type to use (P2SH20 is always more byte
 * efficient than P2SH32, so it's used for packed-transaction P2SH benchmarks)
 * @param repeatCount - the number of inputs across which to repeat the contract
 * under test
 */
const packedTransactionScenario = (using: 'nop2sh' | 'p2sh20', repeatCount: number): WalletTemplateScenario => ({
  sourceOutputs: [...range(repeatCount, 1).map((i) => ({ lockingBytecode: { script: using === 'nop2sh' ? 'lockStandard' : 'lockP2sh20' }, valueSatoshis: i + 10_000 })), { lockingBytecode: ['slot'], valueSatoshis: 10_000 }],
  transaction: {
    inputs: [...range(repeatCount, 1).map(() => ({ unlockingBytecode: { script: using === 'nop2sh' ? 'unlockStandard' : 'unlockP2sh20' } })), { unlockingBytecode: ['slot'] }],
    outputs: [{ lockingBytecode: cashAssemblyToHex('OP_RETURN'), valueSatoshis: 0 }],
  },
});

/**
 * A scenario for the minimal-possible nonstandard transaction: equivalent to {@link minimalScenarioStandard}, but saves one final byte by omitting the `OP_RETURN` (making this transaction fail standard dust limit validation).
 */
const minimalScenarioNonStandard: WalletTemplateScenario = {
  sourceOutputs: [{ lockingBytecode: ['slot'], valueSatoshis: 10_000 }],
  transaction: {
    inputs: [{ unlockingBytecode: ['slot'] }],
    outputs: [{ lockingBytecode: '', valueSatoshis: 0 }],
  },
};

export const benchmarkTestDefinitionsBch: VmbTestDefinitionGroup = [
  '[benchmark] Transaction validation benchmarks',
  [
    [
      '<key1.schnorr_signature.all_outputs> <key1.public_key>',
      'OP_DUP OP_HASH160 <$(<key1.public_key> OP_HASH160)> OP_EQUALVERIFY OP_CHECKSIG',
      '[baseline] 2 P2PKH inputs, 2 P2PKH outputs (one Schnorr signature, one ECDSA signature)',
      ['nop2sh_standard', 'p2sh_ignore'],
      {
        sourceOutputs: [
          { lockingBytecode: { script: 'lockP2pkh' }, valueSatoshis: 100_000 },
          { lockingBytecode: ['slot'], valueSatoshis: 100_000 },
        ],
        transaction: {
          inputs: [{ unlockingBytecode: { script: 'unlockP2pkhStandardEcdsa' } }, { unlockingBytecode: ['slot'] }],
          outputs: [
            { lockingBytecode: { script: 'lockP2pkh' }, valueSatoshis: 100_000 },
            { lockingBytecode: { script: 'lockP2pkh' }, valueSatoshis: 99_634 },
          ],
        },
      },
    ],
    /* Maximize hashing in a single input: */
    ['<1>', `<0> ${repeat('<520> OP_NUM2BIN OP_HASH256', 100)} OP_DROP`, 'Within BCH_2023_05 P2SH/standard, single-input limits, maximize bytes OP_HASH256 hashed', ['invalid', 'nop2sh_ignore', '2023_p2sh_standard', '2025_p2sh_nonstandard'], minimalScenarioStandard],
    ['<1>', `<0> ${repeat('<520> OP_NUM2BIN OP_HASH256', 100)} OP_DROP`, 'Within BCH_2023_05 nonP2SH/nonstandard, single-input limits, maximize bytes OP_HASH256 hashed', ['invalid', 'p2sh_ignore', '2023_nop2sh_nonstandard'], minimalScenarioStandardPlusBytes(2)],
    ['<1>', `<0> ${repeat('<520> OP_NUM2BIN OP_HASH256', 100)} OP_DROP`, 'Within BCH_2023_05 P2SH20/standard, single-input limits, maximize bytes OP_HASH256 hashed (packed transaction)', ['invalid', 'nop2sh_ignore', 'p2sh32_ignore', '2023_p2sh20_standard', '2025_p2sh20_nonstandard'], packedTransactionScenario('p2sh20', 181)],
    ['<1>', `<0> ${repeat('<520> OP_NUM2BIN OP_RIPEMD160', 100)} OP_DROP`, 'Within BCH_2023_05 P2SH/standard, single-input limits, maximize bytes OP_RIPEMD160 hashed', ['invalid', 'nop2sh_ignore', '2023_p2sh_standard', '2025_p2sh_nonstandard'], minimalScenarioStandard],
    ['<1>', `<0> ${repeat('<520> OP_NUM2BIN OP_RIPEMD160', 100)} OP_DROP`, 'Within BCH_2023_05 nonP2SH/nonstandard, single-input limits, maximize bytes OP_RIPEMD160 hashed', ['invalid', 'p2sh_ignore', '2023_nop2sh_nonstandard'], minimalScenarioStandardPlusBytes(2)],
    ['<1>', `<0> ${repeat('<520> OP_NUM2BIN OP_RIPEMD160', 100)} OP_DROP`, 'Within BCH_2023_05 P2SH20/standard, single-input limits, maximize bytes OP_RIPEMD160 hashed (packed transaction)', ['invalid', 'nop2sh_ignore', 'p2sh32_ignore', '2023_p2sh20_standard', '2025_p2sh20_nonstandard'], packedTransactionScenario('p2sh20', 181)],
    ['<1>', `<0> ${repeat('<520> OP_NUM2BIN OP_HASH160', 100)} OP_DROP`, 'Within BCH_2023_05 P2SH/standard, single-input limits, maximize bytes OP_HASH160 hashed', ['invalid', 'nop2sh_ignore', '2023_p2sh_standard', '2025_p2sh_nonstandard'], minimalScenarioStandard],
    ['<1>', `<0> ${repeat('<520> OP_NUM2BIN OP_HASH160', 100)} OP_DROP`, 'Within BCH_2023_05 nonP2SH/nonstandard, single-input limits, maximize bytes OP_HASH160 hashed', ['invalid', 'p2sh_ignore', '2023_nop2sh_nonstandard'], minimalScenarioStandardPlusBytes(2)],
    ['<1>', `<0> ${repeat('<520> OP_NUM2BIN OP_HASH160', 100)} OP_DROP`, 'Within BCH_2023_05 P2SH20/standard, single-input limits, maximize bytes OP_HASH160 hashed (packed transaction)', ['invalid', 'nop2sh_ignore', 'p2sh32_ignore', '2023_p2sh20_standard', '2025_p2sh20_nonstandard'], packedTransactionScenario('p2sh20', 181)],
    ['<1>', `<0> ${repeat('<520> OP_NUM2BIN OP_SHA1', 100)} OP_DROP`, 'Within BCH_2023_05 P2SH/standard, single-input limits, maximize bytes OP_SHA1 hashed', ['invalid', 'nop2sh_ignore', '2023_p2sh_standard', '2025_p2sh_nonstandard'], minimalScenarioStandard],
    ['<1>', `<0> ${repeat('<520> OP_NUM2BIN OP_SHA1', 100)} OP_DROP`, 'Within BCH_2023_05 nonP2SH/nonstandard, single-input limits, maximize bytes OP_SHA1 hashed', ['invalid', 'p2sh_ignore', '2023_nop2sh_nonstandard'], minimalScenarioStandardPlusBytes(2)],
    ['<1>', `<0> ${repeat('<520> OP_NUM2BIN OP_SHA1', 100)} OP_DROP`, 'Within BCH_2023_05 P2SH20/standard, single-input limits, maximize bytes OP_SHA1 hashed (packed transaction)', ['invalid', 'nop2sh_ignore', 'p2sh32_ignore', '2023_p2sh20_standard', '2025_p2sh20_nonstandard'], packedTransactionScenario('p2sh20', 181)],
    /* Maximize hash digest iterations per byte: */
    ['<1>', `<0> <488> OP_NUM2BIN OP_DUP OP_2DUP ${repeat('OP_3DUP', 27)} ${repeat('OP_HASH256 OP_CAT', 84)} OP_HASH256 OP_DROP`, 'Within BCH_2023_05 P2SH/standard limits, maximize hash digests per byte, then total bytes OP_HASH256 hashed', ['invalid', 'nop2sh_ignore', '2023_p2sh_standard', '2025_p2sh_nonstandard'], minimalScenarioStandard],
    ['<1>', `<0> <488> OP_NUM2BIN OP_DUP OP_2DUP ${repeat('OP_3DUP', 27)} ${repeat('OP_HASH256 OP_CAT', 84)} OP_HASH256 OP_DROP`, 'Within BCH_2023_05 nonP2SH/nonstandard limits, maximize hash digests per byte, then total bytes OP_HASH256 hashed', ['invalid', 'p2sh_ignore', '2023_nop2sh_nonstandard'], minimalScenarioStandardPlusBytes(2)],
    [
      '<1>',
      `<0> <488> OP_NUM2BIN OP_DUP OP_2DUP ${repeat('OP_3DUP', 27)} ${repeat('OP_HASH256 OP_CAT', 84)} OP_HASH256 OP_DROP`,
      'Within BCH_2023_05 P2SH20/standard limits, maximize hash digests per byte, then total bytes OP_HASH256 hashed (packed transaction)',
      ['invalid', 'nop2sh_ignore', 'p2sh32_ignore', '2023_p2sh20_standard', '2025_p2sh20_nonstandard'],
      packedTransactionScenario('p2sh20', 402),
    ],
    ['<1>', `<0> <488> OP_NUM2BIN OP_DUP OP_2DUP ${repeat('OP_3DUP', 27)} ${repeat('OP_RIPEMD160 OP_CAT', 84)} OP_RIPEMD160 OP_DROP`, 'Within BCH_2023_05 P2SH/standard limits, maximize hash digests per byte, then total bytes OP_RIPEMD160 hashed', ['invalid', 'nop2sh_ignore', '2023_p2sh_standard', '2025_p2sh_nonstandard'], minimalScenarioStandard],
    ['<1>', `<0> <488> OP_NUM2BIN OP_DUP OP_2DUP ${repeat('OP_3DUP', 27)} ${repeat('OP_RIPEMD160 OP_CAT', 84)} OP_RIPEMD160 OP_DROP`, 'Within BCH_2023_05 nonP2SH/nonstandard limits, maximize hash digests per byte, then total bytes OP_RIPEMD160 hashed', ['invalid', 'p2sh_ignore', '2023_nop2sh_nonstandard'], minimalScenarioStandardPlusBytes(2)],
    [
      '<1>',
      `<0> <488> OP_NUM2BIN OP_DUP OP_2DUP ${repeat('OP_3DUP', 27)} ${repeat('OP_RIPEMD160 OP_CAT', 84)} OP_RIPEMD160 OP_DROP`,
      'Within BCH_2023_05 P2SH20/standard limits, maximize hash digests per byte, then total bytes OP_RIPEMD160 hashed (packed transaction)',
      ['invalid', 'nop2sh_ignore', 'p2sh32_ignore', '2023_p2sh20_standard', '2025_p2sh20_nonstandard'],
      packedTransactionScenario('p2sh20', 402),
    ],
    ['<1>', `<0> <488> OP_NUM2BIN OP_DUP OP_2DUP ${repeat('OP_3DUP', 27)} ${repeat('OP_HASH160 OP_CAT', 84)} OP_HASH160 OP_DROP`, 'Within BCH_2023_05 P2SH/standard limits, maximize hash digests per byte, then total bytes OP_HASH160 hashed', ['invalid', 'nop2sh_ignore', '2023_p2sh_standard', '2025_p2sh_nonstandard'], minimalScenarioStandard],
    ['<1>', `<0> <488> OP_NUM2BIN OP_DUP OP_2DUP ${repeat('OP_3DUP', 27)} ${repeat('OP_HASH160 OP_CAT', 84)} OP_HASH160 OP_DROP`, 'Within BCH_2023_05 nonP2SH/nonstandard limits, maximize hash digests per byte, then total bytes OP_HASH160 hashed', ['invalid', 'p2sh_ignore', '2023_nop2sh_nonstandard'], minimalScenarioStandardPlusBytes(2)],
    [
      '<1>',
      `<0> <488> OP_NUM2BIN OP_DUP OP_2DUP ${repeat('OP_3DUP', 27)} ${repeat('OP_HASH160 OP_CAT', 84)} OP_HASH160 OP_DROP`,
      'Within BCH_2023_05 P2SH20/standard limits, maximize hash digests per byte, then total bytes OP_HASH160 hashed (packed transaction)',
      ['invalid', 'nop2sh_ignore', 'p2sh32_ignore', '2023_p2sh20_standard', '2025_p2sh20_nonstandard'],
      packedTransactionScenario('p2sh20', 402),
    ],
    ['<1>', `<0> <488> OP_NUM2BIN OP_DUP OP_2DUP ${repeat('OP_3DUP', 27)} ${repeat('OP_SHA1 OP_CAT', 84)} OP_SHA1 OP_DROP`, 'Within BCH_2023_05 P2SH/standard limits, maximize hash digests per byte, then total bytes OP_SHA1 hashed', ['invalid', 'nop2sh_ignore', '2023_p2sh_standard', '2025_p2sh_nonstandard'], minimalScenarioStandard],
    ['<1>', `<0> <488> OP_NUM2BIN OP_DUP OP_2DUP ${repeat('OP_3DUP', 27)} ${repeat('OP_SHA1 OP_CAT', 84)} OP_SHA1 OP_DROP`, 'Within BCH_2023_05 nonP2SH/nonstandard limits, maximize hash digests per byte, then total bytes OP_SHA1 hashed', ['invalid', 'p2sh_ignore', '2023_nop2sh_nonstandard'], minimalScenarioStandardPlusBytes(2)],
    ['<1>', `<0> <488> OP_NUM2BIN OP_DUP OP_2DUP ${repeat('OP_3DUP', 27)} ${repeat('OP_SHA1 OP_CAT', 84)} OP_SHA1 OP_DROP`, 'Within BCH_2023_05 P2SH20/standard limits, maximize hash digests per byte, then total bytes OP_SHA1 hashed (packed transaction)', ['invalid', 'nop2sh_ignore', 'p2sh32_ignore', '2023_p2sh20_standard', '2025_p2sh20_nonstandard'], packedTransactionScenario('p2sh20', 402)],
    /* Invalid in 2023, standard after 2025: */
    ['<1>', `<0> <2039> OP_NUM2BIN OP_HASH256 OP_DROP`, 'Within BCH_2025_05 P2SH/standard, single-input limits, maximize bytes OP_HASH256 hashed', ['2023_invalid', 'nop2sh_ignore'], minimalScenarioStandard],
    ['<1>', `<0> <2039> OP_NUM2BIN OP_RIPEMD160 OP_DROP`, 'Within BCH_2025_05 P2SH/standard, single-input limits, maximize bytes OP_RIPEMD160 hashed', ['2023_invalid', 'nop2sh_ignore'], minimalScenarioStandard],
    ['<1>', `<0> <2039> OP_NUM2BIN OP_HASH160 OP_DROP`, 'Within BCH_2025_05 P2SH/standard, single-input limits, maximize bytes OP_HASH160 hashed', ['2023_invalid', 'nop2sh_ignore'], minimalScenarioStandard],
    ['<1>', `<0> <2039> OP_NUM2BIN OP_SHA1 OP_DROP`, 'Within BCH_2025_05 P2SH/standard, single-input limits, maximize bytes OP_SHA1 hashed', ['2023_invalid', 'nop2sh_ignore'], minimalScenarioStandard],
    /* Invalid in 2023, nonstandard in 2025, invalid in 2026: */
    ['<1>', `<0> <10_000> OP_NUM2BIN OP_HASH256 <6_455> OP_NUM2BIN OP_HASH256 OP_DROP`, 'Within BCH_2025_05 noP2SH/nonstandard, single-input limits, maximize bytes OP_HASH256 hashed', ['invalid', '2025_nonstandard', 'p2sh_ignore'], minimalScenarioStandardPlusBytes(2)],
    ['<1>', `<0> <10_000> OP_NUM2BIN OP_RIPEMD160 <6_583> OP_NUM2BIN OP_RIPEMD160 OP_DROP`, 'Within BCH_2025_05 noP2SH/nonstandard, single-input limits, maximize bytes OP_RIPEMD160 hashed', ['invalid', '2025_nonstandard', 'p2sh_ignore'], minimalScenarioStandardPlusBytes(2)],
    ['<1>', `<0> <10_000> OP_NUM2BIN OP_HASH160 <6_455> OP_NUM2BIN OP_HASH160 OP_DROP`, 'Within BCH_2025_05 noP2SH/nonstandard, single-input limits, maximize bytes OP_HASH160 hashed', ['invalid', '2025_nonstandard', 'p2sh_ignore'], minimalScenarioStandardPlusBytes(2)],
    ['<1>', `<0> <10_000> OP_NUM2BIN OP_SHA1 <6_583> OP_NUM2BIN OP_SHA1 OP_DROP`, 'Within BCH_2025_05 noP2SH/nonstandard, single-input limits, maximize bytes OP_SHA1 hashed', ['invalid', '2025_nonstandard', 'p2sh_ignore'], minimalScenarioStandardPlusBytes(2)],

    /* Maximize memory usage */
    ['<1> <$(<1> <397> OP_NUM2BIN)> <$(<1> <520> OP_NUM2BIN)> <$(<2> <520> OP_NUM2BIN)>', `OP_2DUP ${repeat('OP_3DUP', 79)} ${repeat('OP_2DROP', 121)}`, 'Within BCH_2023_05 P2SH/standard, single-input limits, maximize stack memory usage', ['nop2sh_ignore'], minimalScenarioStandard],
    ['<1> <$(<1> <397> OP_NUM2BIN)> <$(<1> <520> OP_NUM2BIN)> <$(<2> <520> OP_NUM2BIN)>', `OP_2DUP ${repeat('OP_3DUP', 79)} ${repeat('OP_2DROP', 121)}`, 'Within BCH_2023_05 nonP2SH/nonstandard, single-input limits, maximize stack memory usage', ['p2sh_ignore'], minimalScenarioNonStandard],
  ],
];
