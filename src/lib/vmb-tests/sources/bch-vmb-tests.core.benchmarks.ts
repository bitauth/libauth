/* eslint-disable @typescript-eslint/no-magic-numbers */
/**
 * See `bch-vmb-tests.ts` for details about modifying this file.
 */

import type { VmbTestDefinitionGroup, WalletTemplateScenario } from '../../lib.js';
import { range } from '../../lib.js';
import { cashAssemblyToHex, repeat } from '../bch-vmb-test-mixins.js';

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

    /* Benchmark various signature checking combinations */
    ['<key1.schnorr_signature.all_outputs> <key1.public_key>', 'OP_DUP OP_HASH160 <$(<key1.public_key> OP_HASH160)> OP_EQUALVERIFY OP_CHECKSIG', 'Within BCH_2023_05 standard limits, packed P2PKH inputs, 1 output (all Schnorr signatures)', ['nop2sh_standard', 'p2sh_ignore'], packedTransactionScenario('nop2sh', 708)],
    ['<key1.ecdsa_signature.all_outputs> <key1.public_key>', 'OP_DUP OP_HASH160 <$(<key1.public_key> OP_HASH160)> OP_EQUALVERIFY OP_CHECKSIG', 'Within BCH_2023_05 standard limits, packed P2PKH inputs, 1 output (all ECDSA signatures)', ['nop2sh_standard', 'p2sh_ignore'], packedTransactionScenario('nop2sh', 676)],
    ['<key1.schnorr_signature.default>', '<key1.public_key> OP_CHECKSIG', 'Within BCH_2023_05 standard limits, packed P2PK inputs, 1 output (all Schnorr signatures)', ['nop2sh_standard', 'p2sh_ignore'], packedTransactionScenario('nop2sh', 933)],
    ['<key1.ecdsa_signature.default>', '<key1.public_key> OP_CHECKSIG', 'Within BCH_2023_05 standard limits, packed P2PK inputs, 1 output (all ECDSA signatures)', ['nop2sh_standard', 'p2sh_ignore'], packedTransactionScenario('nop2sh', 879)],
    ['<0b001> <key1.schnorr_signature.default>', '<1> <key1.public_key> <key2.public_key> <key3.public_key> OP_3 OP_CHECKMULTISIG', 'Within BCH_2023_05 standard limits, packed 1-of-3 bare multisig inputs, 1 output (all Schnorr signatures)', ['nop2sh_standard', 'p2sh_ignore'], packedTransactionScenario('nop2sh', 924)],
    ['<0> <key1.ecdsa_signature.default>', '<1> <key1.public_key> <key2.public_key> <key3.public_key> OP_3 OP_CHECKMULTISIG', 'Within BCH_2023_05 standard limits, packed 1-of-3 bare multisig inputs, 1 output (all ECDSA signatures, first slot)', ['nop2sh_standard', 'p2sh_ignore'], packedTransactionScenario('nop2sh', 872)],
    ['<0> <key1.ecdsa_signature.default>', '<1> <key3.public_key> <key2.public_key> <key1.public_key> OP_3 OP_CHECKMULTISIG', 'Within BCH_2023_05 standard limits, packed 1-of-3 bare multisig inputs, 1 output (all ECDSA signatures, last slot)', ['nop2sh_standard', 'p2sh_ignore'], packedTransactionScenario('nop2sh', 872)],
    ['<0> <key3.ecdsa_signature.default>', '<1> <key3.public_key> <key1.public_key> OP_DUP OP_2DUP OP_3DUP OP_3DUP OP_3DUP OP_3DUP OP_3DUP <20> OP_CHECKMULTISIG', 'Within BCH_2023_05 standard limits, packed 1-of-20 P2SH multisig inputs, 1 output (all ECDSA signatures, first slot)', ['nop2sh_ignore', 'p2sh32_ignore'], packedTransactionScenario('p2sh20', 145)],
    ['<0> <key3.ecdsa_signature.default>', '<1> <key1.public_key> OP_DUP OP_2DUP OP_3DUP OP_3DUP OP_3DUP OP_3DUP OP_3DUP <key3.public_key> <20> OP_CHECKMULTISIG', 'Within BCH_2023_05 standard limits, packed 1-of-20 P2SH multisig inputs, 1 output (all ECDSA signatures, last slot)', ['nop2sh_ignore', 'p2sh32_ignore'], packedTransactionScenario('p2sh20', 510)],

    /* Maximize stack pushing density: */
    ['<1> <1> <520>', `OP_NUM2BIN OP_DUP OP_2DUP ${repeat('OP_3DUP', 78)} ${repeat('OP_2DROP', 119)}`, 'Within BCH_2023_05 P2SH/standard, single-input limits, maximize bytes pushed to the stack', ['nop2sh_ignore'], minimalScenarioStandard],
    ['<1> <1> <520>', `OP_NUM2BIN OP_DUP OP_2DUP ${repeat('OP_3DUP', 78)} ${repeat('OP_2DROP', 119)}`, 'Within BCH_2023_05 nonP2SH/nonstandard, single-input limits, maximize bytes pushed to the stack', ['p2sh_ignore'], minimalScenarioStandardPlusBytes(2)],
    ['<1> <1> <520>', `OP_NUM2BIN OP_DUP OP_2DUP ${repeat('OP_3DUP', 78)} ${repeat('OP_2DROP', 119)}`, 'Within BCH_2023_05 P2SH20/standard, single-input limits, maximize bytes pushed to the stack (packed transaction)', ['nop2sh_ignore', 'p2sh32_ignore'], packedTransactionScenario('p2sh20', 402)],

    /* Maximize hashing density: */
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

    /* Maximize stack memory usage checking */
    ['<0>', `OP_DUP OP_2DUP ${repeat('OP_3DUP', 332)} ${repeat('OP_1ADD', 1174)} OP_DROP ${repeat('<20> OP_CHECKMULTISIGVERIFY', 45)} <7> OP_CHECKMULTISIG`, 'Within BCH_2025_05 P2SH/standard, single-input limits, maximize stack memory usage checking (OP_1ADD)', ['2023_invalid', 'nop2sh_ignore'], minimalScenarioStandard],
    ['<0>', `OP_DUP OP_2DUP ${repeat('OP_3DUP', 332)} ${repeat('OP_1ADD', 9528)} OP_DROP ${repeat('<20> OP_CHECKMULTISIGVERIFY', 45)} <7> OP_CHECKMULTISIG`, 'Within BCH_2025_05 nonP2SH/nonstandard, single-input limits, maximize stack memory usage checking (OP_1ADD)', ['2023_invalid', '2025_nonstandard', 'p2sh_ignore'], minimalScenarioStandardPlusBytes(2)],

    /* Maximize alternate stack memory usage checking */
    ['<0>', `OP_DUP OP_2DUP ${repeat('OP_3DUP', 332)} ${repeat('OP_TOALTSTACK', 999)} ${repeat('OP_1ADD', 312)} OP_0NOTEQUAL`, 'Within BCH_2025_05 P2SH/standard, single-input limits, maximize alternate stack memory usage checking (OP_1ADD)', ['2023_invalid', 'nop2sh_ignore'], minimalScenarioStandard],
    ['<0>', `OP_DUP OP_2DUP ${repeat('OP_3DUP', 332)} ${repeat('OP_TOALTSTACK', 999)} ${repeat('OP_1ADD', 8666)} OP_0NOTEQUAL`, 'Within BCH_2025_05 nonP2SH/nonstandard, single-input limits, maximize alternate stack memory usage checking (OP_1ADD)', ['2023_invalid', '2025_nonstandard', 'p2sh_ignore'], minimalScenarioStandardPlusBytes(2)],

    /* Maximize control stack + stack usage checking */
    [
      '<0>',
      `OP_DUP OP_2DUP ${repeat('OP_3DUP', 332)} ${repeat('OP_NOTIF OP_NOTIF OP_NOTIF OP_3DUP', 33)} OP_NOTIF OP_DUP ${repeat('OP_1ADD', 940)} ${repeat('OP_ENDIF', 100)} OP_DROP ${repeat('<20> OP_CHECKMULTISIGVERIFY', 45)} <7> OP_CHECKMULTISIG`,
      'Within BCH_2025_05 P2SH/standard, single-input limits, maximize control stack and stack memory usage checking (OP_1ADD)',
      ['2023_invalid', 'nop2sh_ignore'],
      minimalScenarioStandard,
    ],
    [
      '<0>',
      `OP_DUP OP_2DUP ${repeat('OP_3DUP', 332)} ${repeat('OP_NOTIF OP_NOTIF OP_NOTIF OP_3DUP', 33)} OP_NOTIF OP_DUP ${repeat('OP_1ADD', 9294)} ${repeat('OP_ENDIF', 100)} OP_DROP ${repeat('<20> OP_CHECKMULTISIGVERIFY', 45)} <7> OP_CHECKMULTISIG`,
      'Within BCH_2025_05 nonP2SH/nonstandard, single-input limits, maximize control stack and stack memory usage checking (OP_1ADD)',
      ['2023_invalid', '2025_nonstandard', 'p2sh_ignore'],
      minimalScenarioStandardPlusBytes(2),
    ],

    /* Maximize control stack usage checking */
    ['<1>', `OP_DUP OP_2DUP ${repeat('OP_3DUP', 234)} ${repeat('OP_IF', 100)} ${repeat('OP_ENDIF OP_IF', 605)} ${repeat('OP_ENDIF', 100)}`, 'Within BCH_2025_05 P2SH/standard, single-input limits, maximize control stack usage checking (OP_IF)', ['2023_invalid', 'nop2sh_ignore'], minimalScenarioStandard],
    ['<1>', `OP_DUP OP_2DUP ${repeat('OP_3DUP', 32)} ${repeat('OP_IF', 100)} ${repeat('OP_ELSE', 1411)} ${repeat('OP_ENDIF', 100)} <1>`, 'Within BCH_2025_05 P2SH/standard, single-input limits, maximize control stack usage checking (OP_ELSE)', ['2023_invalid', 'nop2sh_ignore'], minimalScenarioStandard],
    ['<1>', `OP_DUP OP_2DUP ${repeat('OP_3DUP', 32)} ${repeat('OP_IF', 100)} ${repeat('OP_ELSE', 9765)} ${repeat('OP_ENDIF', 100)} <1>`, 'Within BCH_2025_05 nonP2SH/nonstandard, single-input limits, maximize control stack usage checking (OP_ELSE)', ['2023_invalid', '2025_nonstandard', 'p2sh_ignore'], minimalScenarioStandardPlusBytes(2)],

    /* Bitwise operations: */
    ['<1> <520>', `OP_NUM2BIN OP_DUP OP_2DUP ${repeat('OP_3DUP OP_AND OP_AND OP_AND', 48)} OP_2DUP OP_AND OP_AND OP_AND OP_AND OP_AND`, 'Within BCH_2023_05 P2SH/standard, single-input limits, maximize OP_AND', ['nop2sh_ignore'], minimalScenarioStandard],
    ['<1> <520>', `OP_NUM2BIN OP_DUP OP_2DUP ${repeat('OP_3DUP OP_AND OP_AND OP_AND', 48)} OP_2DUP OP_AND OP_AND OP_AND OP_AND OP_AND`, 'Within BCH_2023_05 nonP2SH/nonstandard, single-input limits, maximize OP_AND', ['nonstandard', 'p2sh_ignore'], minimalScenarioStandardPlusBytes(2)],
    ['<1> <520>', `OP_NUM2BIN OP_DUP OP_2DUP ${repeat('OP_3DUP OP_AND OP_AND OP_AND', 48)} OP_2DUP OP_AND OP_AND OP_AND OP_AND OP_AND`, 'Within BCH_2023_05 P2SH20/standard, single-input limits, maximize OP_AND (packed transaction)', ['nop2sh_ignore', 'p2sh32_ignore'], packedTransactionScenario('p2sh20', 402)],
    ['<1> <10_000>', `OP_NUM2BIN OP_DUP OP_2DUP ${repeat('OP_3DUP OP_AND OP_AND OP_AND', 409)} OP_AND OP_AND OP_AND`, 'Within BCH_2025_05 P2SH/standard, single-input limits, maximize OP_AND [high-memory]', ['2023_invalid', 'nop2sh_ignore'], minimalScenarioStandard],
    ['<1> <10_000>', `OP_NUM2BIN OP_DUP OP_2DUP ${repeat('OP_3DUP OP_AND OP_AND OP_AND', 2498)} OP_AND OP_AND OP_AND`, 'Within BCH_2025_05 nonP2SH/nonstandard, single-input limits, maximize OP_AND [high-memory]', ['2023_invalid', '2025_nonstandard', 'p2sh_ignore'], minimalScenarioStandardPlusBytes(2)],

    ['<1> <520>', `OP_NUM2BIN OP_DUP OP_2DUP ${repeat('OP_3DUP OP_OR OP_OR OP_OR', 48)} OP_2DUP OP_OR OP_OR OP_OR OP_OR OP_OR`, 'Within BCH_2023_05 P2SH/standard, single-input limits, maximize OP_OR', ['nop2sh_ignore'], minimalScenarioStandard],
    ['<1> <520>', `OP_NUM2BIN OP_DUP OP_2DUP ${repeat('OP_3DUP OP_OR OP_OR OP_OR', 48)} OP_2DUP OP_OR OP_OR OP_OR OP_OR OP_OR`, 'Within BCH_2023_05 nonP2SH/nonstandard, single-input limits, maximize OP_OR', ['nonstandard', 'p2sh_ignore'], minimalScenarioStandardPlusBytes(2)],
    ['<1> <520>', `OP_NUM2BIN OP_DUP OP_2DUP ${repeat('OP_3DUP OP_OR OP_OR OP_OR', 48)} OP_2DUP OP_OR OP_OR OP_OR OP_OR OP_OR`, 'Within BCH_2023_05 P2SH20/standard, single-input limits, maximize OP_OR (packed transaction)', ['nop2sh_ignore', 'p2sh32_ignore'], packedTransactionScenario('p2sh20', 402)],
    ['<1> <10_000>', `OP_NUM2BIN OP_DUP OP_2DUP ${repeat('OP_3DUP OP_OR OP_OR OP_OR', 409)} OP_OR OP_OR OP_OR`, 'Within BCH_2025_05 P2SH/standard, single-input limits, maximize OP_OR [high-memory]', ['2023_invalid', 'nop2sh_ignore'], minimalScenarioStandard],
    ['<1> <10_000>', `OP_NUM2BIN OP_DUP OP_2DUP ${repeat('OP_3DUP OP_OR OP_OR OP_OR', 2498)} OP_OR OP_OR OP_OR`, 'Within BCH_2025_05 nonP2SH/nonstandard, single-input limits, maximize OP_OR [high-memory]', ['2023_invalid', '2025_nonstandard', 'p2sh_ignore'], minimalScenarioStandardPlusBytes(2)],

    ['<1> <520>', `OP_NUM2BIN OP_DUP OP_2DUP ${repeat('OP_3DUP OP_XOR OP_XOR OP_XOR', 48)} OP_2DUP OP_XOR OP_XOR OP_XOR OP_XOR OP_DROP`, 'Within BCH_2023_05 P2SH/standard, single-input limits, maximize OP_XOR', ['nop2sh_ignore'], minimalScenarioStandard],
    ['<1> <520>', `OP_NUM2BIN OP_DUP OP_2DUP ${repeat('OP_3DUP OP_XOR OP_XOR OP_XOR', 48)} OP_2DUP OP_XOR OP_XOR OP_XOR OP_XOR OP_DROP`, 'Within BCH_2023_05 nonP2SH/nonstandard, single-input limits, maximize OP_XOR', ['nonstandard', 'p2sh_ignore'], minimalScenarioStandardPlusBytes(2)],
    ['<1> <520>', `OP_NUM2BIN OP_DUP OP_2DUP ${repeat('OP_3DUP OP_XOR OP_XOR OP_XOR', 48)} OP_2DUP OP_XOR OP_XOR OP_XOR OP_XOR OP_DROP`, 'Within BCH_2023_05 P2SH20/standard, single-input limits, maximize OP_XOR (packed transaction)', ['nop2sh_ignore', 'p2sh32_ignore'], packedTransactionScenario('p2sh20', 402)],
    ['<1> <10_000>', `OP_NUM2BIN OP_DUP OP_2DUP ${repeat('OP_3DUP OP_XOR OP_XOR OP_XOR', 409)} OP_XOR OP_XOR OP_DROP`, 'Within BCH_2025_05 P2SH/standard, single-input limits, maximize OP_XOR [high-memory]', ['2023_invalid', 'nop2sh_ignore'], minimalScenarioStandard],
    ['<1> <10_000>', `OP_NUM2BIN OP_DUP OP_2DUP ${repeat('OP_3DUP OP_XOR OP_XOR OP_XOR', 2498)} OP_XOR OP_XOR OP_DROP`, 'Within BCH_2025_05 nonP2SH/nonstandard, single-input limits, maximize OP_XOR [high-memory]', ['2023_invalid', '2025_nonstandard', 'p2sh_ignore'], minimalScenarioStandardPlusBytes(2)],

    /** OP_EQUAL */
    ['<1> <520>', `OP_NUM2BIN OP_DUP OP_2DUP ${repeat('OP_3DUP OP_3DUP OP_EQUALVERIFY OP_EQUALVERIFY OP_EQUALVERIFY', 39)} OP_EQUALVERIFY OP_EQUAL`, 'Within BCH_2023_05 P2SH/standard, single-input limits, maximize OP_EQUAL', ['nop2sh_ignore'], minimalScenarioStandard],
    ['<1> <520>', `OP_NUM2BIN OP_DUP OP_2DUP ${repeat('OP_3DUP OP_3DUP OP_EQUALVERIFY OP_EQUALVERIFY OP_EQUALVERIFY', 39)} OP_EQUALVERIFY OP_EQUAL`, 'Within BCH_2023_05 nonP2SH/nonstandard, single-input limits, maximize OP_EQUAL', ['nonstandard', 'p2sh_ignore'], minimalScenarioStandardPlusBytes(2)],
    ['<1> <520>', `OP_NUM2BIN OP_DUP OP_2DUP ${repeat('OP_3DUP OP_3DUP OP_EQUALVERIFY OP_EQUALVERIFY OP_EQUALVERIFY', 39)} OP_EQUALVERIFY OP_EQUAL`, 'Within BCH_2023_05 P2SH20/standard, single-input limits, maximize OP_EQUAL (packed transaction)', ['nop2sh_ignore', 'p2sh32_ignore'], packedTransactionScenario('p2sh20', 403)],

    /* Arithmetic operations: */
    ['<0xffffffffff7f>', `OP_DUP OP_2DUP ${repeat('OP_3DUP', 49)} ${repeat('OP_ADD OP_ADD OP_ADD', 50)}`, 'Within BCH_2023_05 P2SH/standard, single-input limits, maximize OP_ADD', ['nop2sh_ignore'], minimalScenarioStandard],
    ['<0xffffffffff7f>', `OP_DUP OP_2DUP ${repeat('OP_3DUP', 49)} ${repeat('OP_ADD OP_ADD OP_ADD', 50)}`, 'Within BCH_2023_05 nonP2SH/nonstandard, single-input limits, maximize OP_ADD', ['nonstandard', 'p2sh_ignore'], minimalScenarioStandardPlusBytes(2)],
    ['<0xffffffffff7f>', `OP_DUP OP_2DUP ${repeat('OP_3DUP', 49)} ${repeat('OP_ADD OP_ADD OP_ADD', 50)}`, 'Within BCH_2023_05 P2SH20/standard, single-input limits, maximize OP_ADD (packed transaction)', ['nop2sh_ignore', 'p2sh32_ignore'], packedTransactionScenario('p2sh20', 397)],
    ['<0xffffffff7f>', `OP_DUP OP_2DUP ${repeat('OP_3DUP', 332)} ${repeat('OP_ADD OP_ADD OP_ADD', 332)} OP_DROP ${repeat('OP_3DUP', 76)} OP_2DUP ${repeat('OP_ADD OP_ADD OP_ADD', 77)} OP_ADD`, 'Within BCH_2025_05 P2SH/standard, single-input limits, maximize OP_ADD', ['2023_invalid', 'nop2sh_ignore'], minimalScenarioStandard],
    ['<0xffffffffffffff7f> <0xffffffffffff7f>', `OP_2DUP ${repeat('OP_3DUP', 49)} ${repeat('OP_SUB', 150)}`, 'Within BCH_2023_05 P2SH/standard, single-input limits, maximize OP_SUB', ['nop2sh_ignore'], minimalScenarioStandard],
    ['<0xffffffffffffff7f> <0xffffffffffff7f>', `OP_2DUP ${repeat('OP_3DUP', 49)} ${repeat('OP_SUB', 150)}`, 'Within BCH_2023_05 P2SH20/standard, single-input limits, maximize OP_SUB (packed transaction)', ['nop2sh_ignore', 'p2sh32_ignore'], packedTransactionScenario('p2sh20', 383)],
    ['<-2>', `OP_DUP OP_2DUP ${repeat('OP_3DUP', 47)} OP_DUP ${repeat(`<0xffffffff7f> ${repeat('OP_MUL', 24)} OP_DROP`, 5)} <0xffffff7f> ${repeat('OP_MUL', 26)}`, 'Within BCH_2023_05 P2SH/standard, single-input limits, maximize OP_MUL', ['nop2sh_ignore'], minimalScenarioStandard],
    ['<-2>', `OP_DUP OP_2DUP ${repeat('OP_3DUP', 47)} OP_DUP ${repeat(`<0xffffffff7f> ${repeat('OP_MUL', 24)} OP_DROP`, 5)} <0xffffff7f> ${repeat('OP_MUL', 26)}`, 'Within BCH_2023_05 P2SH20/standard, single-input limits, maximize OP_MUL (packed transaction)', ['nop2sh_ignore', 'p2sh32_ignore'], packedTransactionScenario('p2sh20', 354)],
    ['<0xffffffffff7f> <0x00ffffff7e>', `OP_2DUP ${repeat('OP_3DUP', 49)} ${repeat('OP_DIV OP_DIV OP_DIV OP_DIV OP_SUB OP_DIV OP_DIV OP_DIV OP_SUB', 16)} OP_DIV OP_DIV OP_DIV OP_DIV OP_SUB OP_DIV OP_0NOTEQUAL`, 'Within BCH_2023_05 P2SH/standard, single-input limits, maximize OP_DIV', ['nop2sh_ignore'], minimalScenarioStandard],
    ['<0xffffffffff7f> <0x00ffffff7e>', `OP_2DUP ${repeat('OP_3DUP', 49)} ${repeat('OP_DIV OP_DIV OP_DIV OP_DIV OP_SUB OP_DIV OP_DIV OP_DIV OP_SUB', 16)} OP_DIV OP_DIV OP_DIV OP_DIV OP_SUB OP_DIV OP_0NOTEQUAL`, 'Within BCH_2023_05 P2SH20/standard, single-input limits, maximize OP_DIV (packed transaction)', ['nop2sh_ignore', 'p2sh32_ignore'], packedTransactionScenario('p2sh20', 388)],

    /**
     * BigInt arithmetic limits
     */
    ['<0xffff>', `${repeat('OP_DUP OP_DUP OP_MUL OP_DUP OP_DIV OP_DROP', 273)} OP_0NOTEQUAL`, 'Within BCH_2025_05 P2SH/standard, single-input limits, maximize 4-byte OP_MUL + OP_DIV', ['2023_invalid', 'nop2sh_ignore'], minimalScenarioStandard],
    ['<0xffffffff>', `${repeat('OP_DUP OP_DUP OP_MUL OP_DUP OP_DIV OP_DROP', 273)} OP_0NOTEQUAL`, 'Within BCH_2025_05 P2SH/standard, single-input limits, maximize 8-byte OP_MUL + OP_DIV', ['2023_invalid', 'nop2sh_ignore'], minimalScenarioStandard],
    ['<0xffff>', `${repeat('OP_DUP OP_CAT', 2)} ${repeat('OP_DUP OP_DUP OP_MUL OP_DUP OP_DIV OP_DROP', 273)} OP_0NOTEQUAL`, 'Within BCH_2025_05 P2SH/standard, single-input limits, maximize 16-byte OP_MUL + OP_DIV', ['2023_invalid', 'nop2sh_ignore'], minimalScenarioStandard],
    ['<0xffff>', `${repeat('OP_DUP OP_CAT', 3)} ${repeat('OP_DUP OP_DUP OP_MUL OP_DUP OP_DIV OP_DROP', 272)} OP_0NOTEQUAL`, 'Within BCH_2025_05 P2SH/standard, single-input limits, maximize 32-byte OP_MUL + OP_DIV', ['2023_invalid', 'nop2sh_ignore'], minimalScenarioStandard],
    ['<0xffff>', `${repeat('OP_DUP OP_CAT', 4)} ${repeat('OP_DUP OP_DUP OP_MUL OP_DUP OP_DIV OP_DROP', 272)} OP_0NOTEQUAL`, 'Within BCH_2025_05 P2SH/standard, single-input limits, maximize 64-byte OP_MUL + OP_DIV', ['2023_invalid', 'nop2sh_ignore'], minimalScenarioStandard],
    ['<0xffff>', `${repeat('OP_DUP OP_CAT', 5)} ${repeat('OP_DUP OP_DUP OP_MUL OP_DUP OP_DIV OP_DROP', 272)} OP_0NOTEQUAL`, 'Within BCH_2025_05 P2SH/standard, single-input limits, maximize 128-byte OP_MUL + OP_DIV', ['2023_invalid', 'nop2sh_ignore'], minimalScenarioStandard],
    ['<0xffff>', `${repeat('OP_DUP OP_CAT', 6)} ${repeat('OP_DUP OP_DUP OP_MUL OP_DUP OP_DIV OP_DROP', 271)} OP_0NOTEQUAL`, 'Within BCH_2025_05 P2SH/standard, single-input limits, maximize 256-byte OP_MUL + OP_DIV', ['2023_invalid', 'nop2sh_ignore'], minimalScenarioStandard],

    /* Maximize every other opcode: */
    ['<1>', repeat('OP_NOP', 1646), 'Within BCH_2025_05 P2SH/standard, single-input limits, maximize OP_NOP', ['2023_invalid', 'nop2sh_ignore'], minimalScenarioStandard],
    ['<1>', repeat('OP_NOP', 10_000), 'Within BCH_2025_05 nonP2SH/nonstandard, single-input limits, maximize OP_NOP', ['2023_invalid', '2025_nonstandard', 'p2sh_ignore'], minimalScenarioStandardPlusBytes(2)],
  ],
];
