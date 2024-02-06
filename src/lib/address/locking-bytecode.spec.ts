import test from 'ava';

import {
  addressContentsToLockingBytecode,
  Base58AddressError,
  Base58AddressFormatVersion,
  base58AddressToLockingBytecode,
  CashAddressDecodingError,
  CashAddressEncodingError,
  CashAddressNetworkPrefix,
  cashAddressToLockingBytecode,
  hexToBin,
  lockingBytecodeToAddressContents,
  lockingBytecodeToBase58Address,
  lockingBytecodeToCashAddress,
  LockingBytecodeType,
  sha256,
} from '../lib.js';

test('lockingBytecode <-> AddressContents: P2PK', (t) => {
  const genesisCoinbase = hexToBin(
    '4104678afdb0fe5548271967f1a67130b7105cd6a828e03909a67962e0ea1f61deb649f6bc3f4cef38c4f35504e51ec112de5c384df7ba0b8d578a4c702b6bf11d5fac',
  );
  const genesisPublicKey = hexToBin(
    '04678afdb0fe5548271967f1a67130b7105cd6a828e03909a67962e0ea1f61deb649f6bc3f4cef38c4f35504e51ec112de5c384df7ba0b8d578a4c702b6bf11d5f',
  );

  t.deepEqual(lockingBytecodeToAddressContents(genesisCoinbase), {
    payload: genesisPublicKey,
    type: LockingBytecodeType.p2pk,
  });

  t.deepEqual(
    addressContentsToLockingBytecode({
      payload: genesisPublicKey,
      type: 'P2PK',
    }),
    genesisCoinbase,
  );
  t.deepEqual(
    addressContentsToLockingBytecode({
      payload: genesisPublicKey,
      type: LockingBytecodeType.p2pk,
    }),
    genesisCoinbase,
  );

  const genesisCoinbaseCompressed = hexToBin(
    '2103678afdb0fe5548271967f1a67130b7105cd6a828e03909a67962e0ea1f61deb6ac',
  );
  const compressedPublicKey = hexToBin(
    '03678afdb0fe5548271967f1a67130b7105cd6a828e03909a67962e0ea1f61deb6',
  );
  t.deepEqual(lockingBytecodeToAddressContents(genesisCoinbaseCompressed), {
    payload: compressedPublicKey,
    type: LockingBytecodeType.p2pk,
  });

  t.deepEqual(
    addressContentsToLockingBytecode({
      payload: compressedPublicKey,
      type: LockingBytecodeType.p2pk,
    }),
    genesisCoinbaseCompressed,
  );
});

test('lockingBytecode <-> AddressContents: P2PKH', (t) => {
  const p2pkh = hexToBin('76a91465a16059864a2fdbc7c99a4723a8395bc6f188eb88ac');
  const expectedPayload = hexToBin('65a16059864a2fdbc7c99a4723a8395bc6f188eb');
  t.deepEqual(lockingBytecodeToAddressContents(p2pkh), {
    payload: expectedPayload,
    type: LockingBytecodeType.p2pkh,
  });
  t.deepEqual(
    addressContentsToLockingBytecode({
      payload: expectedPayload,
      type: 'P2PKH',
    }),
    p2pkh,
  );
  t.deepEqual(
    addressContentsToLockingBytecode({
      payload: expectedPayload,
      type: LockingBytecodeType.p2pkh,
    }),
    p2pkh,
  );
});

test('lockingBytecode <-> AddressContents: P2SH20', (t) => {
  const p2sh20 = hexToBin('a91474f209f6ea907e2ea48f74fae05782ae8a66525787');
  const expectedPayload = hexToBin('74f209f6ea907e2ea48f74fae05782ae8a665257');
  t.deepEqual(lockingBytecodeToAddressContents(p2sh20), {
    payload: expectedPayload,
    type: LockingBytecodeType.p2sh20,
  });
  t.deepEqual(
    addressContentsToLockingBytecode({
      payload: expectedPayload,
      type: 'P2SH20',
    }),
    p2sh20,
  );
  t.deepEqual(
    addressContentsToLockingBytecode({
      payload: expectedPayload,
      type: LockingBytecodeType.p2sh20,
    }),
    p2sh20,
  );
});

test('lockingBytecode <-> AddressContents: unknown', (t) => {
  const simpleMath = hexToBin('52935387');
  t.deepEqual(lockingBytecodeToAddressContents(simpleMath), {
    payload: simpleMath,
    type: 'unknown',
  });
  t.throws(
    () =>
      addressContentsToLockingBytecode({
        payload: simpleMath,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        type: 'unknown',
      }),
    { message: 'Unrecognized addressContents type: unknown' },
  );

  const almostP2pk = hexToBin('0100ac');
  const almostP2pkh = hexToBin('76a9010088ac');
  const almostP2sh20 = hexToBin('a9010087');
  const almostP2sh32 = hexToBin('aa010087');

  t.deepEqual(lockingBytecodeToAddressContents(almostP2pk), {
    payload: almostP2pk,
    type: 'unknown',
  });

  t.deepEqual(lockingBytecodeToAddressContents(almostP2pkh), {
    payload: almostP2pkh,
    type: 'unknown',
  });

  t.deepEqual(lockingBytecodeToAddressContents(almostP2sh20), {
    payload: almostP2sh20,
    type: 'unknown',
  });

  t.deepEqual(lockingBytecodeToAddressContents(almostP2sh32), {
    payload: almostP2sh32,
    type: 'unknown',
  });
});

test('lockingBytecodeToAddressContents: improperly sized scripts return AddressType.unknown', (t) => {
  const almostP2pk = hexToBin('0100ac');
  const almostP2pkh = hexToBin('76a9010088ac');
  const almostP2sh20 = hexToBin('a9010087');

  t.deepEqual(lockingBytecodeToAddressContents(almostP2pk), {
    payload: almostP2pk,
    type: 'unknown',
  });

  t.deepEqual(lockingBytecodeToAddressContents(almostP2pkh), {
    payload: almostP2pkh,
    type: 'unknown',
  });

  t.deepEqual(lockingBytecodeToAddressContents(almostP2sh20), {
    payload: almostP2sh20,
    type: 'unknown',
  });
});

const cashVectors = test.macro<[string, string]>({
  exec: (t, cashAddress, bytecode) => {
    t.deepEqual(
      cashAddressToLockingBytecode(cashAddress),
      {
        bytecode: hexToBin(bytecode),
        options: { tokenSupport: false },
        prefix: 'bitcoincash',
      },
      'cashAddressToLockingBytecode',
    );
    t.deepEqual(
      lockingBytecodeToCashAddress(hexToBin(bytecode), 'bitcoincash'),
      cashAddress,
      'lockingBytecodeToCashAddress',
    );
  },
  title: (_, cashAddress) =>
    `cashAddressToLockingBytecode <-> lockingBytecodeToCashAddress: ${cashAddress}`,
});

test(
  cashVectors,
  'bitcoincash:qpm2qsznhks23z7629mms6s4cwef74vcwvy22gdx6a',
  '76a91476a04053bda0a88bda5177b86a15c3b29f55987388ac',
);

test(
  cashVectors,
  'bitcoincash:qr95sy3j9xwd2ap32xkykttr4cvcu7as4y0qverfuy',
  '76a914cb481232299cd5743151ac4b2d63ae198e7bb0a988ac',
);

test(
  cashVectors,
  'bitcoincash:qqq3728yw0y47sqn6l2na30mcw6zm78dzqre909m2r',
  '76a914011f28e473c95f4013d7d53ec5fbc3b42df8ed1088ac',
);

test(
  cashVectors,
  'bitcoincash:ppm2qsznhks23z7629mms6s4cwef74vcwvn0h829pq',
  'a91476a04053bda0a88bda5177b86a15c3b29f55987387',
);

test(
  cashVectors,
  'bitcoincash:pr95sy3j9xwd2ap32xkykttr4cvcu7as4yc93ky28e',
  'a914cb481232299cd5743151ac4b2d63ae198e7bb0a987',
);

test(
  cashVectors,
  'bitcoincash:pqq3728yw0y47sqn6l2na30mcw6zm78dzq5ucqzc37',
  'a914011f28e473c95f4013d7d53ec5fbc3b42df8ed1087',
);

test('lockingBytecodeToCashAddress: P2PK', (t) => {
  const genesisCoinbase = hexToBin(
    '4104678afdb0fe5548271967f1a67130b7105cd6a828e03909a67962e0ea1f61deb649f6bc3f4cef38c4f35504e51ec112de5c384df7ba0b8d578a4c702b6bf11d5fac',
  );

  t.deepEqual(lockingBytecodeToCashAddress(genesisCoinbase, 'bitcoincash'), {
    error: CashAddressEncodingError.noTypeBitsValueStandardizedForP2pk,
  });

  const genesisCoinbaseCompressed = hexToBin(
    '2103678afdb0fe5548271967f1a67130b7105cd6a828e03909a67962e0ea1f61deb6ac',
  );
  t.deepEqual(
    lockingBytecodeToCashAddress(
      genesisCoinbaseCompressed,
      CashAddressNetworkPrefix.mainnet,
    ),
    {
      error: CashAddressEncodingError.noTypeBitsValueStandardizedForP2pk,
    },
  );
});

test('cashAddressToLockingBytecode <-> lockingBytecodeToCashAddress: P2PKH', (t) => {
  const p2pkh = hexToBin('76a914fc916f213a3d7f1369313d5fa30f6168f9446a2d88ac');
  const address = 'bitcoincash:qr7fzmep8g7h7ymfxy74lgc0v950j3r2959lhtxxsl';
  const tokenAddress = 'bitcoincash:zr7fzmep8g7h7ymfxy74lgc0v950j3r295z4y4gq0v';
  t.deepEqual(lockingBytecodeToCashAddress(p2pkh, 'bitcoincash'), address);
  t.deepEqual(
    lockingBytecodeToCashAddress(p2pkh, 'bitcoincash', { tokenSupport: true }),
    tokenAddress,
  );
  t.deepEqual(cashAddressToLockingBytecode(address), {
    bytecode: p2pkh,
    options: { tokenSupport: false },
    prefix: 'bitcoincash',
  });
  t.deepEqual(cashAddressToLockingBytecode(tokenAddress), {
    bytecode: p2pkh,
    options: { tokenSupport: true },
    prefix: 'bitcoincash',
  });
});

test('cashAddressToLockingBytecode <-> lockingBytecodeToCashAddress: P2SH20', (t) => {
  const p2sh20 = hexToBin('a91474f209f6ea907e2ea48f74fae05782ae8a66525787');
  const address = 'bitcoincash:pp60yz0ka2g8ut4y3a604czhs2hg5ejj2ugn82jfsr';
  const tokenAddress = 'bitcoincash:rp60yz0ka2g8ut4y3a604czhs2hg5ejj2u0e55u00s';
  t.deepEqual(lockingBytecodeToCashAddress(p2sh20, 'bitcoincash'), address);
  t.deepEqual(
    lockingBytecodeToCashAddress(p2sh20, 'bitcoincash', { tokenSupport: true }),
    tokenAddress,
  );
  t.deepEqual(cashAddressToLockingBytecode(address), {
    bytecode: p2sh20,
    options: { tokenSupport: false },
    prefix: 'bitcoincash',
  });
  t.deepEqual(cashAddressToLockingBytecode(tokenAddress), {
    bytecode: p2sh20,
    options: { tokenSupport: true },
    prefix: 'bitcoincash',
  });
});

test('cashAddressToLockingBytecode <-> lockingBytecodeToCashAddress: P2SH32', (t) => {
  const p2sh32 = hexToBin(
    'aa20000000000000000000000000000012345678900000000000000000000000000087',
  );
  const address =
    'bitcoincash:pvqqqqqqqqqqqqqqqqqqqqqqzg69v7ysqqqqqqqqqqqqqqqqqqqqqpkp7fqn0';
  const tokenAddress =
    'bitcoincash:rvqqqqqqqqqqqqqqqqqqqqqqzg69v7ysqqqqqqqqqqqqqqqqqqqqqn9alsp2y';
  t.deepEqual(lockingBytecodeToCashAddress(p2sh32, 'bitcoincash'), address);
  t.deepEqual(
    lockingBytecodeToCashAddress(p2sh32, 'bitcoincash', { tokenSupport: true }),
    tokenAddress,
  );
  t.deepEqual(cashAddressToLockingBytecode(address), {
    bytecode: p2sh32,
    options: { tokenSupport: false },
    prefix: 'bitcoincash',
  });
  t.deepEqual(cashAddressToLockingBytecode(tokenAddress), {
    bytecode: p2sh32,
    options: { tokenSupport: true },
    prefix: 'bitcoincash',
  });
});

test('lockingBytecodeToCashAddress: error', (t) => {
  const simpleMath = hexToBin('52935387');

  t.deepEqual(lockingBytecodeToCashAddress(simpleMath, 'bitcoincash'), {
    error: CashAddressEncodingError.unknownLockingBytecodeType,
  });
  const genesisCoinbase = hexToBin(
    '4104678afdb0fe5548271967f1a67130b7105cd6a828e03909a67962e0ea1f61deb649f6bc3f4cef38c4f35504e51ec112de5c384df7ba0b8d578a4c702b6bf11d5fac',
  );
  t.deepEqual(lockingBytecodeToCashAddress(genesisCoinbase, 'bitcoincash'), {
    error: CashAddressEncodingError.noTypeBitsValueStandardizedForP2pk,
  });
});

test('cashAddressToLockingBytecode: error', (t) => {
  t.deepEqual(
    cashAddressToLockingBytecode('bad:address'),
    CashAddressDecodingError.invalidChecksum,
  );
  t.deepEqual(
    cashAddressToLockingBytecode(
      'bitcoincash:dp60yz0ka2g8ut4y3a604czhs2hg5ejj2u6xkulaqj',
    ),
    `${CashAddressDecodingError.unknownAddressType} Type bit value: 13.`,
  );
});

test('lockingBytecodeToBase58Address: P2PK', (t) => {
  const genesisCoinbase = hexToBin(
    '4104678afdb0fe5548271967f1a67130b7105cd6a828e03909a67962e0ea1f61deb649f6bc3f4cef38c4f35504e51ec112de5c384df7ba0b8d578a4c702b6bf11d5fac',
  );
  const genesisPublicKey = hexToBin(
    '04678afdb0fe5548271967f1a67130b7105cd6a828e03909a67962e0ea1f61deb649f6bc3f4cef38c4f35504e51ec112de5c384df7ba0b8d578a4c702b6bf11d5f',
  );

  t.deepEqual(
    lockingBytecodeToBase58Address(genesisCoinbase, 'mainnet', sha256),
    {
      payload: genesisPublicKey,
      type: LockingBytecodeType.p2pk,
    },
  );

  const genesisCoinbaseCompressed = hexToBin(
    '2103678afdb0fe5548271967f1a67130b7105cd6a828e03909a67962e0ea1f61deb6ac',
  );
  const compressedPublicKey = hexToBin(
    '03678afdb0fe5548271967f1a67130b7105cd6a828e03909a67962e0ea1f61deb6',
  );
  t.deepEqual(
    lockingBytecodeToBase58Address(
      genesisCoinbaseCompressed,
      'testnet',
      sha256,
    ),
    {
      payload: compressedPublicKey,
      type: LockingBytecodeType.p2pk,
    },
  );
});

test('base58AddressToLockingBytecode <-> lockingBytecodeToBase58Address: P2PKH', (t) => {
  const p2pkh = hexToBin('76a91476a04053bda0a88bda5177b86a15c3b29f55987388ac');
  // cspell: disable-next-line
  const address = '1BpEi6DfDAUFd7GtittLSdBeYJvcoaVggu';
  // cspell: disable-next-line
  const addressTestnet = 'mrLC19Je2BuWQDkWSTriGYPyQJXKkkBmCx';
  // cspell: disable-next-line
  const addressCopay = 'CTH8H8Zj6DSnXFBKQeDG28ogAS92iS16Bp';
  t.deepEqual(lockingBytecodeToBase58Address(p2pkh, 'mainnet'), address);
  t.deepEqual(
    lockingBytecodeToBase58Address(p2pkh, 'testnet', sha256),
    addressTestnet,
  );
  t.deepEqual(lockingBytecodeToBase58Address(p2pkh, 'copayBCH'), addressCopay);

  t.deepEqual(base58AddressToLockingBytecode(address), {
    bytecode: p2pkh,
    version: Base58AddressFormatVersion.p2pkh,
  });
  t.deepEqual(base58AddressToLockingBytecode(addressTestnet), {
    bytecode: p2pkh,
    version: Base58AddressFormatVersion.p2pkhTestnet,
  });
  t.deepEqual(base58AddressToLockingBytecode(addressCopay, sha256), {
    bytecode: p2pkh,
    version: Base58AddressFormatVersion.p2pkhCopayBCH,
  });
});

test('base58AddressToLockingBytecode <-> lockingBytecodeToBase58Address: P2SH20', (t) => {
  const p2sh20 = hexToBin('a91476a04053bda0a88bda5177b86a15c3b29f55987387');
  // cspell: disable-next-line
  const address = '3CWFddi6m4ndiGyKqzYvsFYagqDLPVMTzC';
  // cspell: disable-next-line
  const addressTestnet = '2N44ThNe8NXHyv4bsX8AoVCXquBRW94Ls7W';
  // cspell: disable-next-line
  const addressCopay = 'HHLN6S9BcP1JLSrMhgD5qe57iVEMFMLCBT';
  t.deepEqual(lockingBytecodeToBase58Address(p2sh20, 'mainnet'), address);
  t.deepEqual(
    lockingBytecodeToBase58Address(p2sh20, 'testnet', sha256),
    addressTestnet,
  );
  t.deepEqual(lockingBytecodeToBase58Address(p2sh20, 'copayBCH'), addressCopay);

  t.deepEqual(base58AddressToLockingBytecode(address), {
    bytecode: p2sh20,
    version: Base58AddressFormatVersion.p2sh20,
  });
  t.deepEqual(base58AddressToLockingBytecode(addressTestnet), {
    bytecode: p2sh20,
    version: Base58AddressFormatVersion.p2sh20Testnet,
  });
  t.deepEqual(base58AddressToLockingBytecode(addressCopay, sha256), {
    bytecode: p2sh20,
    version: Base58AddressFormatVersion.p2sh20CopayBCH,
  });
});

test('base58AddressToLockingBytecode: error', (t) => {
  t.deepEqual(
    base58AddressToLockingBytecode('bad:address'),
    Base58AddressError.unknownCharacter,
  );
});
