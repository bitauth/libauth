import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import test from 'ava';

import {
  binToHex,
  Bip39Error,
  bip39WordListChineseSimplified,
  bip39WordListChineseTraditional,
  bip39WordListCzech,
  bip39WordListEnglish,
  bip39WordListFrench,
  bip39WordListItalian,
  bip39WordListJapanese,
  bip39WordListKorean,
  bip39WordListPortuguese,
  bip39WordListSpanish,
  decodeBip39Mnemonic,
  decodeBip39MnemonicNonStandard,
  decodeHdKey,
  deriveBip39ChecksumBits,
  deriveHdPrivateNodeFromBip39Mnemonic,
  deriveHdPrivateNodeFromSeed,
  deriveSeedFromBip39Mnemonic,
  encodeBip39Mnemonic,
  encodeBip39MnemonicNonStandard,
  encodeHdPrivateKey,
  generateBip39Mnemonic,
  generateBip39MnemonicNonStandard,
  hexToBin,
  isValidBip39EntropyLength,
  isValidBip39WordList,
  range,
} from '../lib.js';

// eslint-disable-next-line import/no-restricted-paths, import/no-internal-modules
import bip39ExtendedVectors from './fixtures/bip39.extended-vectors.json' with { type: 'json' };
// eslint-disable-next-line import/no-restricted-paths, import/no-internal-modules
import bip39TrezorVectorsRaw from './fixtures/bip39.trezor.json' with { type: 'json' };

import { fc, testProp } from '@fast-check/ava';
import { entropyToMnemonic, mnemonicToSeedSync } from 'bip39';

const invalidWordList = ['word', 'list', 'must', 'have', '2048', 'words'];
const zeros =
  'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
const short =
  'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon';
const broken =
  'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon banana';
const unknownWord =
  'UNKNOWN abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
const angstrom = 'Å';
const notNfkdNormalized = `${angstrom} abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about`;
const withSpace =
  'abandon  abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
const withMixedCase =
  'ABANDON abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
const zeros20Bytes =
  'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon address';
const zeros24Bytes =
  'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon agent';
const zeros28Bytes =
  'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon admit';
const zeros32Bytes =
  'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon art';

const wordListByLanguage: { [key: string]: string[] } = {
  // eslint-disable-next-line camelcase
  chinese_simplified: bip39WordListChineseSimplified,
  // eslint-disable-next-line camelcase
  chinese_traditional: bip39WordListChineseTraditional,
  czech: bip39WordListCzech,
  english: bip39WordListEnglish,
  french: bip39WordListFrench,
  italian: bip39WordListItalian,
  japanese: bip39WordListJapanese,
  korean: bip39WordListKorean,
  portuguese: bip39WordListPortuguese,
  spanish: bip39WordListSpanish,
};
const wordLists = Object.values(wordListByLanguage);
test('All word lists are exported and valid', (t) => {
  wordLists.forEach((list) => {
    t.true(isValidBip39WordList(list));
  });
});

const validEntropyLength = [16, 20, 24, 28, 32];

test('isValidBip39EntropyLength', (t) => {
  range(40).forEach((i) =>
    validEntropyLength.includes(i)
      ? t.true(isValidBip39EntropyLength(new Uint8Array(i)))
      : t.false(isValidBip39EntropyLength(new Uint8Array(i))),
  );
});

test('deriveBip39ChecksumBits', (t) => {
  const expectedChecksums = ['0011', '11011', '100111', '0011101', '01100110'];
  validEntropyLength.forEach((length) => {
    t.deepEqual(
      deriveBip39ChecksumBits(Uint8Array.from(range(length).map(() => 0))),
      expectedChecksums[validEntropyLength.indexOf(length)],
      `Failed on ${length}`,
    );
  });
});

test('decodeBip39Mnemonic: works', (t) => {
  t.deepEqual(
    decodeBip39Mnemonic(zeros),
    hexToBin('00000000000000000000000000000000'),
  );
  t.is(
    decodeBip39Mnemonic(short),
    `${Bip39Error.invalidMnemonicLength} Word count: 11.`,
  );
  t.is(
    decodeBip39Mnemonic('abandon abandon abandon'),
    `${Bip39Error.invalidMnemonicLength} Word count: 3.`,
  );
  t.is(
    decodeBip39Mnemonic(`abandon ${zeros32Bytes}`),
    `${Bip39Error.invalidMnemonicLength} Word count: 25.`,
  );
  t.is(
    decodeBip39Mnemonic(unknownWord),
    `${Bip39Error.unknownWord} Unknown word(s): UNKNOWN.`,
  );
  t.is(
    decodeBip39Mnemonic(broken),
    `${Bip39Error.invalidChecksum} Encoded: 0001; computed: 1100.`,
  );
});
test('decodeBip39MnemonicNonStandard: works', (t) => {
  t.deepEqual(
    decodeBip39MnemonicNonStandard(zeros, bip39WordListEnglish),
    hexToBin('00000000000000000000000000000000'),
  );
  t.is(
    decodeBip39MnemonicNonStandard(short, bip39WordListEnglish),
    `${Bip39Error.invalidMnemonicLength} Word count: 11.`,
  );
  t.is(
    decodeBip39MnemonicNonStandard(broken, bip39WordListEnglish),
    `${Bip39Error.invalidChecksum} Encoded: 0001; computed: 1100.`,
  );
  t.is(
    decodeBip39MnemonicNonStandard(zeros, invalidWordList),
    `${Bip39Error.invalidWordListLength} Word list length: 6.`,
  );
  t.is(
    decodeBip39MnemonicNonStandard(unknownWord, bip39WordListEnglish),
    `${Bip39Error.unknownWord} Unknown word(s): UNKNOWN.`,
  );
});

test('encodeBip39Mnemonic: works', (t) => {
  t.is(
    encodeBip39Mnemonic(hexToBin('000000000000000000000000000000')),
    `${Bip39Error.invalidEntropyLength} Entropy length: 15.`,
  );
  t.deepEqual(
    encodeBip39Mnemonic(hexToBin('00000000000000000000000000000000')),
    { phrase: zeros },
  );
  t.is(
    encodeBip39Mnemonic(hexToBin('0000000000000000000000000000000000')),
    `${Bip39Error.invalidEntropyLength} Entropy length: 17.`,
  );
  t.deepEqual(
    encodeBip39Mnemonic(hexToBin('0000000000000000000000000000000000000000')),
    { phrase: zeros20Bytes },
  );
  t.deepEqual(
    encodeBip39Mnemonic(
      hexToBin('000000000000000000000000000000000000000000000000'),
    ),
    { phrase: zeros24Bytes },
  );
  t.deepEqual(
    encodeBip39Mnemonic(
      hexToBin('00000000000000000000000000000000000000000000000000000000'),
    ),
    { phrase: zeros28Bytes },
  );
  t.deepEqual(
    encodeBip39Mnemonic(
      hexToBin(
        '0000000000000000000000000000000000000000000000000000000000000000',
      ),
    ),
    { phrase: zeros32Bytes },
  );
});
test('encodeBip39MnemonicNonStandard: works', (t) => {
  t.deepEqual(
    encodeBip39MnemonicNonStandard(
      hexToBin('00000000000000000000000000000000'),
      bip39WordListEnglish,
    ),
    { phrase: zeros },
  );
  t.is(
    encodeBip39MnemonicNonStandard(
      hexToBin('000000000000000000000000000000'),
      bip39WordListEnglish,
    ),
    `${Bip39Error.invalidEntropyLength} Entropy length: 15.`,
  );
  t.is(
    encodeBip39MnemonicNonStandard(
      hexToBin('00000000000000000000000000000000'),
      invalidWordList,
    ),
    `${Bip39Error.invalidWordListLength} Word list length: 6.`,
  );
});

testProp(
  '[fast-check] [crypto] encodeBip39Mnemonic <-> decodeBip39Mnemonic',
  [
    fc.integer({ max: 4, min: 0 }),
    fc.uint8Array({ maxLength: 32, minLength: 32 }),
  ],
  (t, selectLength: number, entropySource: Uint8Array) => {
    const entropy = entropySource.slice(0, [16, 20, 24, 28, 32][selectLength]);
    const result = encodeBip39Mnemonic(entropy);
    if (typeof result === 'string') {
      t.fail(result);
      return;
    }
    t.deepEqual(decodeBip39Mnemonic(result.phrase), entropy);
  },
);

testProp(
  '[fast-check] [crypto] encodeBip39MnemonicNonStandard <-> decodeBip39MnemonicNonStandard',
  [
    fc.integer({ max: 4, min: 0 }),
    fc.uint8Array({ maxLength: 32, minLength: 32 }),
    fc.integer({ max: wordLists.length - 1, min: 0 }),
  ],
  (
    t,
    selectLength: number,
    entropySource: Uint8Array,
    selectLanguage: number,
    // eslint-disable-next-line @typescript-eslint/max-params
  ) => {
    const entropy = entropySource.slice(0, [16, 20, 24, 28, 32][selectLength]);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const list = wordLists[selectLanguage]!;
    const result = encodeBip39MnemonicNonStandard(entropy, list);
    if (typeof result === 'string') {
      t.fail(result);
      return;
    }
    t.deepEqual(decodeBip39MnemonicNonStandard(result.phrase, list), entropy);
  },
);

test('deriveSeedFromBip39Mnemonic: works', (t) => {
  t.deepEqual(
    deriveSeedFromBip39Mnemonic(''),
    hexToBin(
      '4ed8d4b17698ddeaa1f1559f152f87b5d472f725ca86d341bd0276f1b61197e21dd5a391f9f5ed7340ff4d4513aab9cce44f9497a5e7ed85fd818876b6eb402e',
    ),
  );
  t.deepEqual(
    deriveSeedFromBip39Mnemonic(zeros),
    hexToBin(
      '5eb00bbddcf069084889a8ab9155568165f5c453ccb85e70811aaed6f6da5fc19a5ac40b389cd370d086206dec8aa6c43daea6690f20ad3d8d48b2d2ce9e38e4',
    ),
  );
  t.deepEqual(
    deriveSeedFromBip39Mnemonic(short),
    hexToBin(
      'c010601f44235bce0eac58d966084f7e79a1691c54156578ef7908c10ee66d62f608254c1863b71a3dc8cf7f846cc6e0a746513751f39a4d66ceee3b623348a4',
    ),
  );
  t.deepEqual(
    deriveSeedFromBip39Mnemonic(broken),
    hexToBin(
      'aeaafed4b67ef003954fbb9a907be3c6e892fe41c2397092ddcd8e01ea65ec3781a5bb9db23b14c3d0d119486929d515c7525549c814bb969a1bb7fc01d30dc7',
    ),
  );
  t.deepEqual(
    deriveSeedFromBip39Mnemonic(unknownWord),
    hexToBin(
      '5e5827cd9b89e7f7ab20accb162f2cca98cbc199d31c38469600bbc8987c9f71d198328fdbd3cda24cda0d8f56d48cc3c77c635d8207d734f7355e48acd1bcf0',
    ),
  );
  t.deepEqual(
    deriveSeedFromBip39Mnemonic(withSpace),
    hexToBin(
      '1525a8d0b3e08e7bc38044293b6c7ce3e82cd344f27f294976c5179bc0505c4230f55dfa9bb326d89f1d7e8931d3c70e2dc2ebe808d8fbb32923a747d0860379',
    ),
  );
  t.deepEqual(
    deriveSeedFromBip39Mnemonic(withMixedCase),
    hexToBin(
      'ae8ff977c55c498bd3e509b5587772dc6ecb6b65ced45156dbf5342d514172821e252e02cbd656e05244b65371b6bd542c491ec4152968bd9ba962f7e9f77d6a',
    ),
  );
  t.deepEqual(
    deriveSeedFromBip39Mnemonic(zeros20Bytes),
    hexToBin(
      '6e9360e8d511f85adcda7bf6078207f0b2d12933845953bc766041cb71ac3bf644ffadd57caac244066657e8ebe01efa0e394d1afa7331379a3c1aebd68f6645',
    ),
  );
  t.deepEqual(
    deriveSeedFromBip39Mnemonic(zeros24Bytes),
    hexToBin(
      '4975bb3d1faf5308c86a30893ee903a976296609db223fd717e227da5a813a34dc1428b71c84a787fc51f3b9f9dc28e9459f48c08bd9578e9d1b170f2d7ea506',
    ),
  );
  t.deepEqual(
    deriveSeedFromBip39Mnemonic(zeros28Bytes),
    hexToBin(
      '277fe8691c965d8a47439d1ff771d9bad603575b8e8d8cee6cb907a1359992c22ab736b36859f9edcfd33bfef94e0d21ad295ff81194652c6e87bd68289b3522',
    ),
  );
  t.deepEqual(
    deriveSeedFromBip39Mnemonic(zeros32Bytes),
    hexToBin(
      '408b285c123836004f4b8842c89324c1f01382450c0d439af345ba7fc49acf705489c6fc77dbd4e3dc1dd8cc6bc9f043db8ada1e243c4a0eafb290d399480840',
    ),
  );
  t.deepEqual(
    deriveSeedFromBip39Mnemonic(notNfkdNormalized, { passphrase: angstrom }),
    hexToBin(
      '61d33f77132f19034d761b651c6230d293cfeb1894b8e83abb63baef2e5f9f420b0c9f2256a25cb655c33ee389e4dc7121c48eb8e0921d6b8a4dbe167c7e7421',
    ),
  );
});

test('deriveHdPrivateNodeFromBip39Mnemonic: works', (t) => {
  t.deepEqual(
    deriveHdPrivateNodeFromBip39Mnemonic(''),
    deriveHdPrivateNodeFromSeed(
      hexToBin(
        '4ed8d4b17698ddeaa1f1559f152f87b5d472f725ca86d341bd0276f1b61197e21dd5a391f9f5ed7340ff4d4513aab9cce44f9497a5e7ed85fd818876b6eb402e',
      ),
    ),
  );
  t.deepEqual(
    deriveHdPrivateNodeFromBip39Mnemonic(zeros),
    deriveHdPrivateNodeFromSeed(
      hexToBin(
        '5eb00bbddcf069084889a8ab9155568165f5c453ccb85e70811aaed6f6da5fc19a5ac40b389cd370d086206dec8aa6c43daea6690f20ad3d8d48b2d2ce9e38e4',
      ),
    ),
  );
});

test('generateBip39Mnemonic and generateBip39MnemonicNonStandard: works', (t) => {
  const valid12WordMnemonic = generateBip39Mnemonic();
  const decoded = decodeBip39MnemonicNonStandard(
    valid12WordMnemonic,
    bip39WordListEnglish,
  );
  if (typeof decoded === 'string') {
    t.fail(decoded);
    return;
  }
  t.is(valid12WordMnemonic.split(' ').length, 12, 'Expected 12 words');
  const valid24WordMnemonic = generateBip39MnemonicNonStandard(
    bip39WordListEnglish,
    32,
  );
  if (typeof valid24WordMnemonic === 'string') {
    t.fail(valid24WordMnemonic);
    return;
  }
  t.is(valid24WordMnemonic.phrase.split(' ').length, 24, 'Expected 24 words');
  t.is(
    generateBip39MnemonicNonStandard(bip39WordListEnglish, 17 as 16),
    `${Bip39Error.invalidEntropyLength} Entropy length: 17.`,
  );
  t.is(
    generateBip39MnemonicNonStandard(invalidWordList),
    `${Bip39Error.invalidWordListLength} Word list length: 6.`,
  );
});

type Bip39TestVector = {
  entropy: string;
  hdKey?: string;
  hdKeyUsingPassphrase: string;
  mnemonic: string;
  passphrase: string;
  seed?: string;
  seedUsingPassphrase: string;
  wordList: string;
};

const bip39Vector = test.macro<[Bip39TestVector]>({
  // eslint-disable-next-line complexity
  exec: (t, vector) => {
    const wordList = wordListByLanguage[vector.wordList];
    if (wordList === undefined) {
      t.fail(`Failed to find word list for language ${vector.wordList}`);
      return;
    }
    const mnemonic = encodeBip39MnemonicNonStandard(
      hexToBin(vector.entropy),
      wordList,
    );
    if (typeof mnemonic === 'string') {
      t.fail(mnemonic);
      return;
    }
    const entropy = decodeBip39MnemonicNonStandard(vector.mnemonic, wordList);
    const seed = deriveSeedFromBip39Mnemonic(mnemonic.phrase);
    const hdKey = deriveHdPrivateNodeFromSeed(seed);
    const seedUsingPassphrase = deriveSeedFromBip39Mnemonic(mnemonic.phrase, {
      passphrase: vector.passphrase,
    });
    if (typeof seedUsingPassphrase === 'string') {
      t.fail(seedUsingPassphrase);
      return;
    }
    t.deepEqual(mnemonic.phrase, vector.mnemonic);
    t.deepEqual(seedUsingPassphrase, hexToBin(vector.seedUsingPassphrase));
    t.deepEqual(entropy, hexToBin(vector.entropy));
    const hdKeyUsingPassphrase = deriveHdPrivateNodeFromBip39Mnemonic(
      vector.mnemonic,
      { passphrase: vector.passphrase },
    );
    if (typeof hdKeyUsingPassphrase === 'string') {
      t.fail(hdKeyUsingPassphrase);
      return;
    }
    const hdKeyFromSeedUsingPassphrase =
      deriveHdPrivateNodeFromSeed(seedUsingPassphrase);
    t.deepEqual(hdKeyUsingPassphrase, hdKeyFromSeedUsingPassphrase);
    const keyParametersUsingPassphrase = decodeHdKey(
      vector.hdKeyUsingPassphrase,
    );
    if (typeof keyParametersUsingPassphrase === 'string') {
      t.fail(keyParametersUsingPassphrase);
      return;
    }
    t.deepEqual(hdKeyUsingPassphrase, keyParametersUsingPassphrase.node);
    if (vector.seed !== undefined) {
      t.deepEqual(seed, hexToBin(vector.seed));
      if (typeof seed === 'string' || vector.hdKey === undefined) {
        t.fail('Broken test vector');
        return;
      }
      const hdKeyFromSeed = deriveHdPrivateNodeFromSeed(seed);
      t.deepEqual(hdKey, hdKeyFromSeed);
      const keyParameters = decodeHdKey(vector.hdKey);
      if (typeof keyParameters === 'string') {
        t.fail(keyParameters);
      }
    }
  },
  title: (providedTitle, validVector) =>
    `${providedTitle}: ${validVector.mnemonic}`,
});

const convertedVectors = Object.entries(bip39TrezorVectorsRaw).flatMap(
  ([wordList, set]) =>
    (set as [string, string, string, string][]).flatMap(
      ([entropy, mnemonic, seedUsingPassphrase, hdKeyUsingPassphrase]) =>
        ({
          entropy,
          hdKey: undefined,
          hdKeyUsingPassphrase,
          mnemonic,
          passphrase: 'TREZOR',
          seed: undefined,
          seedUsingPassphrase,
          wordList,
        }) as Bip39TestVector,
    ),
);

convertedVectors.forEach((vector, i) => {
  test(`BIP39 Test Vectors (Trezor) #${i}`, bip39Vector, vector);
});

bip39ExtendedVectors.forEach((vector, i) => {
  test(`BIP39 Test Vectors (Extended) #${i}`, bip39Vector, vector);
});

/**
 * Mixed case (`Libauth`) to verify case-sensitivity.
 */
const ourPassphrase = 'Libauth';
const extendedVectors = convertedVectors.map((vector) => {
  const seed = deriveSeedFromBip39Mnemonic(vector.mnemonic);
  const seedUsingPassphrase = deriveSeedFromBip39Mnemonic(vector.mnemonic, {
    passphrase: ourPassphrase,
  });
  const node = deriveHdPrivateNodeFromSeed(seed);
  const nodeWithPassphrase = deriveHdPrivateNodeFromSeed(seedUsingPassphrase);
  const hdKey = encodeHdPrivateKey({ network: 'mainnet', node }).hdPrivateKey;
  const hdKeyUsingPassphrase = encodeHdPrivateKey({
    network: 'mainnet',
    node: nodeWithPassphrase,
  }).hdPrivateKey;
  return {
    entropy: vector.entropy,
    hdKey,
    hdKeyUsingPassphrase,
    mnemonic: vector.mnemonic,
    passphrase: ourPassphrase,
    seed: binToHex(seed),
    seedUsingPassphrase: binToHex(seedUsingPassphrase),
    wordList: vector.wordList,
  } as Bip39TestVector;
});

test('BIP39 Test Vectors (Extended) are up to date', (t) => {
  const solution =
    'Run "export GENERATE_TEST_VECTORS=1; yarn test:fast src/lib/key/bip39.spec.ts" to correct this issue. (Note: watch tasks don\'t always update cached JSON imports when the source file changes. You may need to restart tsc.)';
  t.deepEqual(bip39ExtendedVectors, extendedVectors, solution);
});

if (process.env['GENERATE_TEST_VECTORS'] === '1') {
  const path = fileURLToPath(
    new URL(
      '../../../src/lib/key/fixtures/bip39.extended-vectors.json',
      import.meta.url,
    ),
  );
  test.after(`Write BIP39 Test Vectors (Extended) to: ${path}`, () => {
    writeFileSync(path, JSON.stringify(extendedVectors));
  });
}

testProp(
  '[fast-check] [crypto] encodeBip39MnemonicNonStandard and bip39-npm produce equivalent results',
  [
    fc.integer({ max: 4, min: 0 }),
    fc.uint8Array({ maxLength: 32, minLength: 32 }),
    fc.integer({ max: wordLists.length - 1, min: 0 }),
  ],
  (
    t,
    selectLength: number,
    entropySource: Uint8Array,
    selectLanguage: number,
    // eslint-disable-next-line @typescript-eslint/max-params
  ) => {
    const entropy = entropySource.slice(0, [16, 20, 24, 28, 32][selectLength]);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const list = wordLists[selectLanguage]!;
    const result = encodeBip39MnemonicNonStandard(entropy, list);
    if (typeof result === 'string') {
      t.fail(result);
      return;
    }
    const npmBip39 = entropyToMnemonic(Buffer.from(entropy), list);
    t.deepEqual(result.phrase, npmBip39);
  },
);

testProp(
  '[fast-check] [crypto] deriveSeedFromBip39Mnemonic and bip39-npm produce equivalent results',
  [
    fc.string({ maxLength: 1000, minLength: 0 }),
    fc.string({ maxLength: 1000, minLength: 0 }),
  ],
  (t, mnemonic: string, passphrase: string) => {
    t.notThrows(() => {
      const libauth = deriveSeedFromBip39Mnemonic(mnemonic);
      const npmBip39 = mnemonicToSeedSync(mnemonic);
      t.deepEqual(libauth, Uint8Array.from(npmBip39));
      const libauthPass = deriveSeedFromBip39Mnemonic(mnemonic, { passphrase });
      const npmBip39Pass = mnemonicToSeedSync(mnemonic, passphrase);
      t.deepEqual(libauthPass, Uint8Array.from(npmBip39Pass));
    });
  },
);

test.todo('attemptBip39MnemonicErrorCorrection: works');
test.todo('[fast-check] attemptBip39MnemonicErrorCorrection');
