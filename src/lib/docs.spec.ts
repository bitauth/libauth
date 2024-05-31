/**
 * This file tests all examples included in the repo's `docs` directory.
 */

import test from 'ava';

import type { AuthenticationProgramStateStack } from './lib.js';
import {
  assertSuccess,
  attemptCashAddressFormatErrorCorrection,
  binsAreEqual,
  binToHex,
  CashAddressDecodingError,
  cashAddressToLockingBytecode,
  crackHdPrivateNodeFromHdPublicNodeAndChildPrivateNode,
  createInstructionSetBch,
  createVirtualMachine,
  createVirtualMachineBch,
  decodeCashAddress,
  decodeCashAddressFormat,
  decodeHdPrivateKey,
  decodeHdPublicKey,
  decodePrivateKeyWif,
  decodeTransaction,
  decodeTransactionOutputs,
  deriveHdPath,
  deriveHdPathRelative,
  deriveHdPrivateNodeFromBip39Mnemonic,
  deriveHdPublicKey,
  deriveHdPublicNode,
  encodeBip39Mnemonic,
  encodeCashAddress,
  encodeCashAddressFormat,
  encodeHdPrivateKey,
  encodeHdPublicKey,
  encodePrivateKeyWif,
  generateBip39Mnemonic,
  generateDeterministicEntropy,
  generatePrivateKey,
  hdPrivateKeyToP2pkhCashAddress,
  hdPublicKeyToP2pkhCashAddress,
  hexToBin,
  lockingBytecodeToCashAddress,
  OpcodesBch,
  privateKeyToP2pkhCashAddress,
  publicKeyToP2pkhCashAddress,
  pushToStack,
  range,
  ripemd160,
  secp256k1,
  sha256,
  splitEvery,
  stringify,
  stringifyDebugTraceSummary,
  summarizeDebugTrace,
  useThreeStackItems,
  utf8ToBin,
  walletTemplateToCompilerBch,
} from './lib.js';

test('addresses.md: encode CashAddresses', (t) => {
  const publicKeyHash = hexToBin('15d16c84669ab46059313bf0747e781f1d13936d');
  const { address } = encodeCashAddress({
    payload: publicKeyHash,
    type: 'p2pkh',
    /* throwErrors: false // (for type-safe handling of untrusted `payload`s) */
  });
  // eslint-disable-next-line no-console
  console.log(address);
  // => bitcoincash:qq2azmyyv6dtgczexyalqar70q036yund54qgw0wg6
  t.deepEqual(
    address,
    'bitcoincash:qq2azmyyv6dtgczexyalqar70q036yund54qgw0wg6',
  );

  const testnet = encodeCashAddress({
    payload: publicKeyHash,
    prefix: 'bchtest',
    type: 'p2pkh',
  }).address;
  // eslint-disable-next-line no-console
  console.log(testnet);
  // => bchtest:qq2azmyyv6dtgczexyalqar70q036yund53jvfde0x
  t.deepEqual(testnet, 'bchtest:qq2azmyyv6dtgczexyalqar70q036yund53jvfde0x');

  const acceptsTokens = encodeCashAddress({
    payload: publicKeyHash,
    prefix: 'bitcoincash',
    type: 'p2pkhWithTokens',
  }).address;
  // eslint-disable-next-line no-console
  console.log(acceptsTokens);
  // => bitcoincash:zq2azmyyv6dtgczexyalqar70q036yund5j2mspghf
  t.deepEqual(
    acceptsTokens,
    'bitcoincash:zq2azmyyv6dtgczexyalqar70q036yund5j2mspghf',
  );
});

test('addresses.md: decode CashAddresses', (t) => {
  const address = 'bitcoincash:zq2azmyyv6dtgczexyalqar70q036yund5j2mspghf';
  /**
   * If encoding is always expected to succeed, i.e. no user input is involved,
   * we can `assertSuccess` to remove the error `string` possibility from the
   * return type and use the address immediately (if an encoding error occurs at
   * runtime, `assertSuccess` will simply throw it in a new `Error` object).
   */
  const tokenAddress = assertSuccess(decodeCashAddress(address));
  // eslint-disable-next-line no-console
  console.log(stringify(tokenAddress));
  /* eslint-disable tsdoc/syntax */
  /**
   * => {
   *  "payload": "<Uint8Array: 0x15d16c84669ab46059313bf0747e781f1d13936d>",
   *  "prefix": "bitcoincash",
   *  "type": "p2pkhWithTokens"
   * }
   */
  /* eslint-enable tsdoc/syntax */
  t.deepEqual(
    stringify(tokenAddress),
    `{
  "payload": "<Uint8Array: 0x15d16c84669ab46059313bf0747e781f1d13936d>",
  "prefix": "bitcoincash",
  "type": "p2pkhWithTokens"
}`,
  );

  // Handling a possibly-invalid CashAddress:
  const decoded = decodeCashAddress('bitcoincash:not_a_valid_address');
  // Handle any decoding errors:
  if (typeof decoded === 'string') {
    const handleError = (error: string) =>
      t.deepEqual(
        error,
        'CashAddress decoding error: the payload contains unexpected characters. Invalid characters: o, _, i.',
      );
    // eslint-disable-next-line line-comment-position
    handleError(decoded); // => 'CashAddress decoding error: the payload contains unexpected characters. Invalid characters: o, _, i.'
    return;
  }
  const { payload, prefix, type } = decoded;
  t.fail(`Should be unreachable. (${stringify(payload)}; ${prefix}; ${type})`);
});

test('addresses.md: CashAddress to locking bytecode', (t) => {
  const address = 'bitcoincash:zq2azmyyv6dtgczexyalqar70q036yund5j2mspghf';
  // With `assertSuccess`, any errors are simply thrown
  const { bytecode, prefix, tokenSupport } = assertSuccess(
    cashAddressToLockingBytecode(address),
  );

  // eslint-disable-next-line no-console
  console.log(`
Network: ${prefix}
Supports tokens: ${tokenSupport}
Locking bytecode: ${binToHex(bytecode)}
`);
  /* eslint-disable tsdoc/syntax */
  /**
   * =>
   * Network: bitcoincash
   * Supports tokens: true
   * Locking bytecode: 76a91415d16c84669ab46059313bf0747e781f1d13936d88ac
   */
  /* eslint-enable tsdoc/syntax */
  t.deepEqual(
    `
Network: ${prefix}
Supports tokens: ${tokenSupport}
Locking bytecode: ${binToHex(bytecode)}
`,
    `
Network: bitcoincash
Supports tokens: true
Locking bytecode: 76a91415d16c84669ab46059313bf0747e781f1d13936d88ac
`,
  );
});

test('addresses.md: locking bytecode to CashAddress', (t) => {
  const p2pkhBytecode = hexToBin(
    '76a914fc916f213a3d7f1369313d5fa30f6168f9446a2d88ac',
  );
  const p2pkh = lockingBytecodeToCashAddress({
    bytecode: p2pkhBytecode,
    prefix: 'bitcoincash',
  });
  // With `assertSuccess`, any errors are simply thrown
  // eslint-disable-next-line no-console
  console.log(assertSuccess(p2pkh).address);
  // => "bitcoincash:qr7fzmep8g7h7ymfxy74lgc0v950j3r2959lhtxxsl"
  t.deepEqual(
    assertSuccess(p2pkh).address,
    'bitcoincash:qr7fzmep8g7h7ymfxy74lgc0v950j3r2959lhtxxsl',
  );

  const p2pk = hexToBin(
    '4104678afdb0fe5548271967f1a67130b7105cd6a828e03909a67962e0ea1f61deb649f6bc3f4cef38c4f35504e51ec112de5c384df7ba0b8d578a4c702b6bf11d5fac',
  );
  const genesisCoinbase = lockingBytecodeToCashAddress({
    bytecode: p2pk,
    prefix: 'bitcoincash',
  });
  // eslint-disable-next-line no-console
  console.log(genesisCoinbase);
  // => "CashAddress encoding error: no CashAddress type bit has been standardized for P2PK locking bytecode."
  t.deepEqual(
    genesisCoinbase,
    'CashAddress encoding error: no CashAddress type bit has been standardized for P2PK locking bytecode.',
  );

  const p2sh32 = hexToBin(
    'aa20000000000000000000000000000012345678900000000000000000000000000087',
  );
  const p2sh32WithTokens = lockingBytecodeToCashAddress({
    bytecode: p2sh32,
    prefix: 'bchtest',
    tokenSupport: true,
  });
  // eslint-disable-next-line no-console
  console.log(assertSuccess(p2sh32WithTokens).address);
  // => "bchtest:rvqqqqqqqqqqqqqqqqqqqqqqzg69v7ysqqqqqqqqqqqqqqqqqqqqqszvpgjlk"
  t.deepEqual(
    assertSuccess(p2sh32WithTokens).address,
    'bchtest:rvqqqqqqqqqqqqqqqqqqqqqqzg69v7ysqqqqqqqqqqqqqqqqqqqqqszvpgjlk',
  );

  const nonStandard = hexToBin('52935387');
  const nonStandardAddress = lockingBytecodeToCashAddress({
    bytecode: nonStandard,
    prefix: 'bitcoincash',
  });
  // eslint-disable-next-line no-console
  console.log(nonStandardAddress);
  // => "CashAddress encoding error: unknown locking bytecode type."
  t.deepEqual(
    nonStandardAddress,
    'CashAddress encoding error: unknown locking bytecode type.',
  );
});

test('addresses.md: CashAddress format', (t) => {
  const txId =
    '978306aa4e02fd06e251b38d2e961f78f4af2ea6524a3e4531126776276a6af1';
  // With `assertSuccess`, any errors are simply thrown
  const { address } = assertSuccess(
    encodeCashAddressFormat({
      payload: hexToBin(txId),
      prefix: 'bitauth',
      version: 3,
    }),
  );
  // eslint-disable-next-line no-console
  console.log(`Encoded authbase: ${address}`);
  t.deepEqual(
    `Encoded authbase: ${address}`,
    'Encoded authbase: bitauth:qwtcxp42fcp06phz2xec6t5krau0ftew5efy50j9xyfxwa38df40zp58z6t5w',
  );

  const { payload } = assertSuccess(decodeCashAddressFormat(address));
  // eslint-disable-next-line no-console
  console.log(`Encoded TXID: ${binToHex(payload)}`);

  t.deepEqual(
    `Encoded TXID: ${binToHex(payload)}`,
    'Encoded TXID: 978306aa4e02fd06e251b38d2e961f78f4af2ea6524a3e4531126776276a6af1',
  );
});

test('addresses.md: CashAddress error correction', (t) => {
  const askUserToTryAgain = (message: string) => {
    t.deepEqual(
      message,
      `You entered:  bch-est:qq2azmyyv6dtgczexyalqar70q036yund53jvfde0z
Errors:       ---^---------------------------------------------^

Please review the address for errors and try again.`,
    );
  };
  const maybeAddress = 'bch-est:qq2azmyyv6dtgczexyalqar70q036yund53jvfde0z';
  /* result.address is 'bchtest:qq2azmyyv6dtgczexyalqar70q036yund53jvfde0x' */

  const result = attemptCashAddressFormatErrorCorrection(maybeAddress);
  if (typeof result === 'string') {
    askUserToTryAgain(result);
    return undefined;
  }

  if (result.corrections.length === 0) {
    return maybeAddress;
  }

  const pointToCorrections = (c: number[]) =>
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    Array.from({ length: c[c.length - 1]! + 1 }, (_, i) =>
      c.includes(i) ? '^' : '-',
    ).join('');
  const message =
    typeof result === 'string'
      ? result
      : `You entered:  ${maybeAddress}
Errors:       ${pointToCorrections(result.corrections)}

Please review the address for errors and try again.`;
  askUserToTryAgain(message);
  return undefined;
});

test('addresses.md: libauth-secret-key error correction', (t) => {
  const promptUserToBackup = (message: string) => {
    t.deepEqual(
      message,
      'secret-key:qqqq-zqsr-qszs-vpcg-py9q-krqd-pc8s-5c6s-605f',
    );
  };
  const askUserToTryAgain = (error: string) => {
    t.fail(error);
  };

  const payload = Uint8Array.from(range(16));
  const prefix = 'secretkey';
  const raw = encodeCashAddressFormat({ payload, prefix, version: 0 }).address;
  const hyphenated = `secret-key:${splitEvery(raw.slice(10), 4).join('-')}`;
  promptUserToBackup(hyphenated);
  // => 'secret-key:qqqq-zqsr-qszs-vpcg-py9q-krqd-pc8s-5c6s-605f'

  /* Later, to restore from the backup: */

  const userEnters = 'secret-key:qqqq-zasr-qszs-vpcg-py9q-krqd-pc8s-sc6s-605f';
  /* `q` mistakenly transcribed as `a` ^,    `5` transcribed as `s` ^  */

  const compressed = userEnters.replace(/-/gu, '');
  const result = attemptCashAddressFormatErrorCorrection(compressed);
  if (typeof result === 'string') {
    askUserToTryAgain(result);
    return;
  }

  const corrected = assertSuccess(decodeCashAddressFormat(result.address));
  // eslint-disable-next-line no-console
  console.log(binsAreEqual(payload, corrected.payload));
  // => true
});

test('crypto.md: utf8ToBin -> sha256', (t) => {
  const message = utf8ToBin('Hello world!');
  const hash = sha256.hash(message);
  const hex = binToHex(hash);
  // eslint-disable-next-line no-console
  console.log(hex);
  // => 'c0535e4be2b79ffd93291305436bf889314e4a3faec05ecffcbb7df31ad9e51a'
  t.deepEqual(
    hex,
    'c0535e4be2b79ffd93291305436bf889314e4a3faec05ecffcbb7df31ad9e51a',
  );
});

test('crypto.md: hexToBin -> ripemd160', (t) => {
  const message = hexToBin('01020304');
  const hash = ripemd160.hash(message);
  const hex = binToHex(hash);
  // eslint-disable-next-line no-console
  console.log(hex);
  // => '179bb366e5e224b8bf4ce302cefc5744961839c5'
  t.deepEqual(hex, '179bb366e5e224b8bf4ce302cefc5744961839c5');
});

test('crypto.md: incremental ripemd160', (t) => {
  const step1 = ripemd160.update(ripemd160.init(), Uint8Array.of(0x01));
  const step2 = ripemd160.update(step1, Uint8Array.of(0x02));
  const step3 = ripemd160.update(step2, Uint8Array.of(0x03));
  const step4 = ripemd160.update(step3, Uint8Array.of(0x04));
  const hash = ripemd160.final(step4);
  const hex = binToHex(hash);
  // eslint-disable-next-line no-console
  console.log(hex);
  // => '179bb366e5e224b8bf4ce302cefc5744961839c5'
  t.deepEqual(hex, '179bb366e5e224b8bf4ce302cefc5744961839c5');
});

test('crypto.md: secp256k1.verifySignatureDERLowS', (t) => {
  const sig = hexToBin('');
  const pubkey = hexToBin('');
  const msgHash = hexToBin('');
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  secp256k1.verifySignatureDERLowS(sig, pubkey, msgHash)
    ? // eslint-disable-next-line no-console
      console.log('🚀 Signature valid')
    : // eslint-disable-next-line no-console, no-sequences
      console.log('❌ Signature invalid'),
    t.pass();
});

test('errors.md: check for errors', (t) => {
  const askUserToTryAgain = (_: string) => {
    t.pass();
  };
  const getUtxosByLockingBytecode = (_: Uint8Array) => {
    t.fail();
  };
  // ---
  const address = 'bitcoincash:not_a_valid_address';
  const result = cashAddressToLockingBytecode(address);

  // `decoded` is either a `string` or the result type:
  if (typeof result === 'string') {
    askUserToTryAgain(result);
    return;
  }
  // `result.bytecode` can now be safely accessed:
  getUtxosByLockingBytecode(result.bytecode);
});

test('errors.md: assertSuccess', async (t) => {
  const askUserToSelectFromAddressBook = async () =>
    Promise.resolve('bchtest:qq2azmyyv6dtgczexyalqar70q036yund53jvfde0x');
  const getUtxosByLockingBytecode = (_: Uint8Array) => {
    t.pass();
  };
  // ---
  const address = await askUserToSelectFromAddressBook();
  // assertSuccess: all address book entries are valid addresses
  const result = assertSuccess(cashAddressToLockingBytecode(address));

  // `result.bytecode` can now be safely accessed:
  getUtxosByLockingBytecode(result.bytecode);
});

test('errors.md: detect specific error', (t) => {
  const decoded = cashAddressToLockingBytecode(
    'bitcoincash:not_a_valid_address',
  );
  if (typeof decoded === 'string') {
    if (decoded.includes(CashAddressDecodingError.invalidCharacters)) {
      // handle matched error
      t.pass();
      return;
    }
    // handle other errors
    return;
  }
  t.fail();
});

test('errors.md: configure throwErrors #1', (t) => {
  const handleError = (error: string) => t.fail(error);
  const publicKeyHash = hexToBin('15d16c84669ab46059313bf0747e781f1d13936d');
  const result = encodeCashAddress({
    payload: publicKeyHash,
    throwErrors: false,
    type: 'p2pkh',
  });
  if (typeof result === 'string') {
    handleError(result);
    return;
  }
  // eslint-disable-next-line no-console
  console.log(result.address);
  // => bitcoincash:qq2azmyyv6dtgczexyalqar70q036yund54qgw0wg6
  t.deepEqual(
    result.address,
    'bitcoincash:qq2azmyyv6dtgczexyalqar70q036yund54qgw0wg6',
  );
});

test('errors.md: configure throwErrors #2', (t) => {
  const handleError = (error: string) =>
    t.deepEqual(
      error,
      'CashAddress encoding error: no CashAddress type bit has been standardized for P2PK locking bytecode.',
    );

  const genesisCoinbase = hexToBin(
    '4104678afdb0fe5548271967f1a67130b7105cd6a828e03909a67962e0ea1f61deb649f6bc3f4cef38c4f35504e51ec112de5c384df7ba0b8d578a4c702b6bf11d5fac',
  );
  const result = lockingBytecodeToCashAddress({
    bytecode: genesisCoinbase,
    prefix: 'bitcoincash',
  });
  if (typeof result === 'string') {
    handleError(result);
    return;
  }
  // eslint-disable-next-line no-console
  console.log(result.address);
  // (unreachable)
  t.fail(result.address);
});

test('keys.md: WIF encode', (t) => {
  const privateKey = generatePrivateKey();
  const wif = encodePrivateKeyWif(privateKey, 'mainnet');
  // eslint-disable-next-line no-console
  console.log(wif);
  // => "L1RrrnXkcKut5DEMwtDthjwRcTTwED36thyL1DebVrKuwvohjMNi"

  t.deepEqual(decodePrivateKeyWif(wif), { privateKey, type: 'mainnet' });
});

test('keys.md: WIF decode', (t) => {
  const wif = 'L1RrrnXkcKut5DEMwtDthjwRcTTwED36thyL1DebVrKuwvohjMNi';
  // (`assertSuccess` simply throws any decoding errors)
  const { privateKey } = assertSuccess(decodePrivateKeyWif(wif));

  const { address } = privateKeyToP2pkhCashAddress({ privateKey });
  // eslint-disable-next-line no-console
  console.log(address);
  // => "bitcoincash:qrfdnw009wga3yg5ann9v930s8upw2h33s9ahmklw6"

  t.deepEqual(
    address,
    'bitcoincash:qrfdnw009wga3yg5ann9v930s8upw2h33s9ahmklw6',
  );
});

test('keys.md: Generate a Random BIP39 Mnemonic Phrase', (t) => {
  const phrase = generateBip39Mnemonic();
  // eslint-disable-next-line no-console
  console.log(phrase);
  // => "legal winner thank year wave sausage worth useful legal winner thank yellow"

  t.deepEqual(phrase.split(' ').length, 12);
});

test('keys.md: BIP39 Mnemonic Phrase from Coin Flips', (t) => {
  /* 128 simulate coin flips (`binToBinString(generateRandomBytes(16))`) */
  const flip128 =
    '11101000100010110101110111110111000110000001011110001110111011001001111011010011000111000110000010100110101101110100110000001111';

  const faces = 2;
  const events = splitEvery(flip128, 1).map(parseInt);
  /* `assertSuccess` simply throws any errors */
  const entropy = assertSuccess(generateDeterministicEntropy(faces, events));
  /* Slice produced entropy at 16 bytes (128 bits) for 12 words: */
  const { phrase } = assertSuccess(encodeBip39Mnemonic(entropy.slice(0, 16)));
  // eslint-disable-next-line no-console
  console.log(phrase);
  // => "crawl actual tool rally crazy lab work paper fragile favorite draft income"
  t.deepEqual(
    phrase,
    'crawl actual tool rally crazy lab work paper fragile favorite draft income',
  );
});

test('keys.md: BIP39 Mnemonic Phrase from Coin Flips (error)', (t) => {
  const flip10 = '1110100010';
  const faces = 2;
  const events = splitEvery(flip10, 1).map(parseInt);
  const result = generateDeterministicEntropy(faces, events);
  // eslint-disable-next-line no-console
  console.log(result);
  // => "Entropy generation error: the provided list of events contains insufficient entropy. With 2 possible results per event, a minimum of 128 events are required to obtain sufficient entropy. Events provided: 10."
  t.deepEqual(
    result,
    'Entropy generation error: the provided list of events contains insufficient entropy. With 2 possible results per event, a minimum of 128 events are required to obtain sufficient entropy. Events provided: 10.',
  );
});

test('keys.md: BIP39 Mnemonic Phrase from Dice Rolls', (t) => {
  /* Fifty, 6-sided dice rolls */
  const events = [
    1, 5, 5, 2, 2, 3, 6, 4, 4, 3, 2, 4, 4, 6, 3, 3, 6, 3, 6, 5, 3, 5, 1, 4, 2,
    5, 1, 1, 3, 1, 3, 2, 3, 5, 5, 6, 5, 6, 2, 2, 5, 2, 5, 5, 4, 3, 5, 3, 6, 3,
  ];
  const faces = 6;
  /**
   * `generateDeterministicEntropy` is designed to be easily verified, e.g.:
   * $ echo -n 15522364432446336365351425113132355656225255435363 | sha256sum
   * 8d270d32340c28d8708023a5becf5dd8d55da45808c2ba97cfb7c2b0dcfefad1
   */
  const entropy = assertSuccess(generateDeterministicEntropy(faces, events));
  // eslint-disable-next-line no-console
  console.log(binToHex(entropy));
  // => "8d270d32340c28d8708023a5becf5dd8d55da45808c2ba97cfb7c2b0dcfefad1"
  t.deepEqual(
    binToHex(entropy),
    '8d270d32340c28d8708023a5becf5dd8d55da45808c2ba97cfb7c2b0dcfefad1',
  );
  /* Slice produced entropy at 16 bytes (128 bits) for 12 words: */
  const { phrase } = assertSuccess(encodeBip39Mnemonic(entropy.slice(0, 16)));
  // eslint-disable-next-line no-console
  console.log(phrase);
  // => "minor debris erode gym secret history search afford pizza wait student ranch"
  t.deepEqual(
    phrase,
    'minor debris erode gym secret history search afford pizza wait student ranch',
  );
});

test('keys.md: BIP39 Mnemonic Phrase to BCH Wallet', (t) => {
  const mnemonic =
    'legal winner thank year wave sausage worth useful legal winner thank yellow';
  const node = deriveHdPrivateNodeFromBip39Mnemonic(mnemonic);
  /**
   * SLIP44 standardizes `m/44'/145'` as the derivation path for BCH accounts,
   * followed by a hardened index for te account number (here, account `0`).
   */
  const bchAccount0 = deriveHdPath(node, "m/44'/145'/0'");
  /**
   * From account 0, derive the private key for external address 0 (as
   * standardized by BIP44):
   */
  const { privateKey } = deriveHdPathRelative(bchAccount0, '0/0');
  const { address } = assertSuccess(
    privateKeyToP2pkhCashAddress({ privateKey }),
  );
  // eslint-disable-next-line no-console
  console.log(address);
  // => "bitcoincash:qpdtccrxx78kcuc65mceurfwg60gmmqu9cwpjdt25n"
  t.deepEqual(
    address,
    'bitcoincash:qpdtccrxx78kcuc65mceurfwg60gmmqu9cwpjdt25n',
  );
});

test('keys.md: Derive a Watch-only Wallet #1', (t) => {
  const node = deriveHdPath(
    deriveHdPrivateNodeFromBip39Mnemonic(
      'legal winner thank year wave sausage worth useful legal winner thank yellow',
    ),
    "m/44'/145'/0'",
  );
  const { hdPrivateKey } = encodeHdPrivateKey({ network: 'mainnet', node });
  // hdPrivateKey: "xprv9yG4X8zfB77WS2vwx49tbDtHE1Cyq5wQe2iFcGy5jhizqSEgh22ZXzBaFpMYbLJN4EK459UgFWAxb5rSwzqzx6gw7xxH8z5vvcvUi4oFQqj"
  t.deepEqual(
    hdPrivateKey,
    'xprv9yG4X8zfB77WS2vwx49tbDtHE1Cyq5wQe2iFcGy5jhizqSEgh22ZXzBaFpMYbLJN4EK459UgFWAxb5rSwzqzx6gw7xxH8z5vvcvUi4oFQqj',
  );
  const { hdPublicKey } = deriveHdPublicKey(hdPrivateKey);
  // eslint-disable-next-line no-console
  console.log(hdPublicKey);
  // => "xpub6CFQveXZ1UfoeX1R45gtxMq1n33UEYfG1FdrQfNhJ3FyiEZqEZLp5nW474QiDWfVQ6NGk5iPv1h14Vhz2CtzNkGNhimgUucyUtWGdMdofhe"
  t.deepEqual(
    hdPublicKey,
    'xpub6CFQveXZ1UfoeX1R45gtxMq1n33UEYfG1FdrQfNhJ3FyiEZqEZLp5nW474QiDWfVQ6NGk5iPv1h14Vhz2CtzNkGNhimgUucyUtWGdMdofhe',
  );
});

test('keys.md: Derive a Watch-only Wallet #2', (t) => {
  const hdPublicKey =
    'xpub6CFQveXZ1UfoeX1R45gtxMq1n33UEYfG1FdrQfNhJ3FyiEZqEZLp5nW474QiDWfVQ6NGk5iPv1h14Vhz2CtzNkGNhimgUucyUtWGdMdofhe';

  const { node } = assertSuccess(decodeHdPublicKey(hdPublicKey));
  const { publicKey } = deriveHdPathRelative(node, '0/0');
  const { address } = publicKeyToP2pkhCashAddress({ publicKey });
  // eslint-disable-next-line no-console
  console.log(address);
  // => "bitcoincash:qpdtccrxx78kcuc65mceurfwg60gmmqu9cwpjdt25n"
  t.deepEqual(
    address,
    'bitcoincash:qpdtccrxx78kcuc65mceurfwg60gmmqu9cwpjdt25n',
  );
});

test('keys.md: crackHdPrivateNodeFromHdPublicNodeAndChildPrivateNode', (t) => {
  const hdPrivateKey =
    'xprv9yG4X8zfB77WS2vwx49tbDtHE1Cyq5wQe2iFcGy5jhizqSEgh22ZXzBaFpMYbLJN4EK459UgFWAxb5rSwzqzx6gw7xxH8z5vvcvUi4oFQqj';
  const { hdPublicKey } = deriveHdPublicKey(hdPrivateKey);
  const hdPrivateNode = assertSuccess(decodeHdPrivateKey(hdPrivateKey)).node;
  const hdPublicNode = assertSuccess(decodeHdPublicKey(hdPublicKey)).node;

  /**
   * The HD public key is shared with an observer, and somehow, the observer
   * gains access to a non-hardened child private key (in this case, the key at
   * index `1234`.)
   */
  const someChildNode = deriveHdPathRelative(hdPrivateNode, '1234');

  /**
   * The observer can now trivially derive the parent HD private key using the
   * HD public key:
   */
  const parentKey = encodeHdPrivateKey({
    network: 'mainnet',
    node: assertSuccess(
      crackHdPrivateNodeFromHdPublicNodeAndChildPrivateNode(
        hdPublicNode,
        someChildNode,
      ),
    ),
  }).hdPrivateKey;
  // eslint-disable-next-line no-console
  console.log(parentKey);
  // => "xprv9yG4X8zfB77WS2vwx49tbDtHE1Cyq5wQe2iFcGy5jhizqSEgh22ZXzBaFpMYbLJN4EK459UgFWAxb5rSwzqzx6gw7xxH8z5vvcvUi4oFQqj"
  t.deepEqual(
    parentKey,
    'xprv9yG4X8zfB77WS2vwx49tbDtHE1Cyq5wQe2iFcGy5jhizqSEgh22ZXzBaFpMYbLJN4EK459UgFWAxb5rSwzqzx6gw7xxH8z5vvcvUi4oFQqj',
  );
});

test('verify-transactions.md: simple verification', (t) => {
  const vm = createVirtualMachineBch(true);
  /* Example transaction from Virtual Machine Bytecode (VMB) test ID: "dv5k4" */
  const vmbTest = {
    description:
      'Basic push operations: OP_0 (A.K.A. OP_PUSHBYTES_0, OP_FALSE): zero is represented by an empty stack item (P2SH20)',
    id: 'dv5k4',
    tx: hexToBin(
      '020000000201000000000000000000000000000000000000000000000000000000000000000000000064417dfb529d352908ee0a88a0074c216b09793d6aa8c94c7640bb4ced51eaefc75d0aef61f7685d0307491e2628da3d4f91e86329265a4a58ca27a41ec0b8910779c32103a524f43d6166ad3567f18b0a5c769c6ab4dc02149f4d5095ccf4e8ffa293e7850000000001000000000000000000000000000000000000000000000000000000000000000100000006000482008777000000000100000000000000000a6a08766d625f7465737400000000',
    ),
    utxos: hexToBin(
      '0210270000000000001976a91460011c6bf3f1dd98cff576437b9d85de780f497488ac102700000000000017a91498e86c508e780cfb822bba3d5ab9b3e30450196b87',
    ),
  };

  /* Decode the transaction, throwing any errors */
  const transaction = assertSuccess(decodeTransaction(vmbTest.tx));
  /* Decode the serialized outputs, throwing any errors */
  const sourceOutputs = assertSuccess(decodeTransactionOutputs(vmbTest.utxos));

  // Result is either `true` or an error message (`string`)
  const result = vm.verify({ sourceOutputs, transaction });

  if (typeof result === 'string') {
    // eslint-disable-next-line no-console
    console.error(result);
    t.fail();
  } else {
    // eslint-disable-next-line no-console
    console.log('Transaction verified 🚀');
    t.pass();
  }
});

test('verify-transactions.md: add OP_UNROT', (t) => {
  const instructionSet = createInstructionSetBch(true);
  /**
   * A hypothetical "OP_UNROT" which rotates the top stack items in the
   * direction opposite that of OP_ROT. (The generic `<State extends ...>`
   * is only necessary for TypeScript usage.)
   */
  const opUnRot = <State extends AuthenticationProgramStateStack>(
    state: State,
  ) =>
    useThreeStackItems(state, (nextState, [a, b, c]) =>
      pushToStack(nextState, c, a, b),
    );

  /* We assign "OP_UNROT" at the index held by "OP_RESERVED1" */
  const opcode = OpcodesBch.OP_RESERVED1;
  /* All other features of the BCH instruction set are unmodified: */
  const vm = createVirtualMachine({
    ...instructionSet,
    operations: {
      ...instructionSet.operations,
      [opcode]: opUnRot,
    },
  });

  const OP_UNROT = `0x${binToHex(Uint8Array.of(opcode))}`;
  /* A compiler for a simple wallet template to test the new opcode: */
  const compiler = walletTemplateToCompilerBch({
    entities: {},
    scripts: {
      lock: {
        lockingType: 'p2sh20',
        script: `${OP_UNROT} OP_CAT OP_CAT <0x030102> OP_EQUAL`,
      },
      unlock: { script: '<1> <2> <3>', unlocks: 'lock' },
    },
    supported: ['BCH_SPEC'],
  });

  /* Generate a testing scenario, throwing any errors */
  const { program } = assertSuccess(
    compiler.generateScenario({ unlockingScriptId: 'unlock' }),
  );

  /* Debug the `program`: an inputIndex, sourceOutputs, and transaction */
  const trace = vm.debug(program);
  const summary = summarizeDebugTrace(trace);
  const formatted = stringifyDebugTraceSummary(summary, {
    opcodes: { ...OpcodesBch, [opcode]: 'OP_UNROT' },
  });
  // eslint-disable-next-line no-console
  console.log(formatted);

  t.deepEqual(
    formatted,
    `0. OP_1:                0x01(1)
1. OP_2:                0x01(1) 0x02(2)
2. OP_3:                0x01(1) 0x02(2) 0x03(3)
3. OP_PUSHBYTES_8:      0x01(1) 0x02(2) 0x03(3) 0x897e7e0303010287(-504967220674068105)
=>                      0x01(1) 0x02(2) 0x03(3) 0x897e7e0303010287(-504967220674068105)
0. OP_HASH160:          0x01(1) 0x02(2) 0x03(3) 0x1e2083f589fd7943289cfaba1dcdc50e395f3019
1. OP_PUSHBYTES_20:     0x01(1) 0x02(2) 0x03(3) 0x1e2083f589fd7943289cfaba1dcdc50e395f3019 0x1e2083f589fd7943289cfaba1dcdc50e395f3019
2. OP_EQUAL:            0x01(1) 0x02(2) 0x03(3) 0x01(1)
=>                      0x01(1) 0x02(2) 0x03(3)
0. OP_UNROT:            0x03(3) 0x01(1) 0x02(2)
1. OP_CAT:              0x03(3) 0x0102(513)
2. OP_CAT:              0x030102(131331)
3. OP_PUSHBYTES_3:      0x030102(131331) 0x030102(131331)
4. OP_EQUAL:            0x01(1)
=>                      0x01(1)`,
  );
});

test('wallets.md: hdPrivateKeyToP2pkhCashAddress', (t) => {
  const saveSomewhere = (_: string) => {
    t.pass();
  };

  // const mnemonic = generateBip39Mnemonic();
  const mnemonic =
    'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
  saveSomewhere(mnemonic);
  const { hdPrivateKey } = encodeHdPrivateKey({
    network: 'mainnet',
    node: deriveHdPrivateNodeFromBip39Mnemonic(mnemonic),
  });

  /* BCH account standardized by SLIP44 */
  const privateDerivationPath = "m/44'/145'/0'/0/i";
  const addressIndex = 0;
  const { address } = hdPrivateKeyToP2pkhCashAddress({
    addressIndex,
    hdPrivateKey,
    privateDerivationPath,
  });
  // eslint-disable-next-line no-console
  console.log(
    `The address at external BCH account (${privateDerivationPath}) index ${addressIndex} is: ${address}.`,
  );
  t.deepEqual(
    `The address at external BCH account (${privateDerivationPath}) index ${addressIndex} is: ${address}.`,
    `The address at external BCH account (m/44'/145'/0'/0/i) index 0 is: bitcoincash:qqyx49mu0kkn9ftfj6hje6g2wfer34yfnq5tahq3q6.`,
  );
});

test('wallets.md: hdPublicKeyToP2pkhCashAddress', (t) => {
  /* On the signing device: */
  const mnemonic =
    'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
  const masterNode = deriveHdPrivateNodeFromBip39Mnemonic(mnemonic);

  /* BCH account 0 as standardized by SLIP44 */
  const bchAccount0 = "m/44'/145'/0'";
  const node = deriveHdPublicNode(deriveHdPath(masterNode, bchAccount0));
  const { hdPublicKey } = encodeHdPublicKey({ network: 'mainnet', node });

  /* A watch-only observer can derive addresses given only the HD public key: */
  const addressIndex = 0;
  const externalAddresses = '0/i'; /* Change addresses use '1/i' */
  const { address } = hdPublicKeyToP2pkhCashAddress({
    addressIndex,
    hdPublicKey,
    hdPublicKeyDerivationPath: bchAccount0,
    publicDerivationPath: externalAddresses,
  });
  // eslint-disable-next-line no-console
  console.log(
    `The address at external BCH account 0 (${bchAccount0}) index ${addressIndex} is: ${address}.`,
  );
  t.deepEqual(
    `The address at BCH account 0, external index ${addressIndex} is: ${address}.`,
    `The address at BCH account 0, external index 0 is: bitcoincash:qqyx49mu0kkn9ftfj6hje6g2wfer34yfnq5tahq3q6.`,
  );
});

test('wallets.md: privateKeyToP2pkhCashAddress and publicKeyToP2pkhCashAddress', (t) => {
  const wif = 'KxbEv3FeYig2afQp7QEA9R3gwqdTBFwAJJ6Ma7j1SkmZoxC9bAXZ';

  // `assertSuccess` simply throws any decoding errors
  const { privateKey } = assertSuccess(decodePrivateKeyWif(wif));
  const { address } = privateKeyToP2pkhCashAddress({ privateKey });
  // eslint-disable-next-line no-console
  console.log(`The address is: ${address}.`);
  t.deepEqual(
    `The address is: ${address}.`,
    `The address is: bitcoincash:qqyx49mu0kkn9ftfj6hje6g2wfer34yfnq5tahq3q6.`,
  );

  /* Using only the public key: */
  const publicKey = assertSuccess(
    secp256k1.derivePublicKeyCompressed(privateKey),
  );

  const result = publicKeyToP2pkhCashAddress({ publicKey });
  // eslint-disable-next-line no-console
  console.log(`Address derived from the public key: ${result.address}.`);
  t.deepEqual(
    `Address derived from the public key: ${result.address}.`,
    `Address derived from the public key: bitcoincash:qqyx49mu0kkn9ftfj6hje6g2wfer34yfnq5tahq3q6.`,
  );
});
