/* eslint-disable functional/no-expression-statement */
import test, { Macro } from 'ava';

import {
  addressContentsToLockingBytecode,
  AddressType,
  Base58AddressError,
  Base58AddressFormatVersion,
  base58AddressToLockingBytecode,
  CashAddressDecodingError,
  CashAddressNetworkPrefix,
  cashAddressToLockingBytecode,
  hexToBin,
  instantiateSha256,
  LockingBytecodeEncodingError,
  lockingBytecodeToAddressContents,
  lockingBytecodeToBase58Address,
  lockingBytecodeToCashAddress,
} from '../lib';

const sha256Promise = instantiateSha256();

test('lockingBytecode <-> AddressContents: P2PK', (t) => {
  const genesisCoinbase = hexToBin(
    '4104678afdb0fe5548271967f1a67130b7105cd6a828e03909a67962e0ea1f61deb649f6bc3f4cef38c4f35504e51ec112de5c384df7ba0b8d578a4c702b6bf11d5fac'
  );
  const genesisPublicKey = hexToBin(
    '04678afdb0fe5548271967f1a67130b7105cd6a828e03909a67962e0ea1f61deb649f6bc3f4cef38c4f35504e51ec112de5c384df7ba0b8d578a4c702b6bf11d5f'
  );

  t.deepEqual(lockingBytecodeToAddressContents(genesisCoinbase), {
    payload: genesisPublicKey,
    type: AddressType.p2pk,
  });

  t.deepEqual(
    addressContentsToLockingBytecode({
      payload: genesisPublicKey,
      type: AddressType.p2pk,
    }),
    genesisCoinbase
  );

  const genesisCoinbaseCompressed = hexToBin(
    '2103678afdb0fe5548271967f1a67130b7105cd6a828e03909a67962e0ea1f61deb6ac'
  );
  const compressedPublicKey = hexToBin(
    '03678afdb0fe5548271967f1a67130b7105cd6a828e03909a67962e0ea1f61deb6'
  );
  t.deepEqual(lockingBytecodeToAddressContents(genesisCoinbaseCompressed), {
    payload: compressedPublicKey,
    type: AddressType.p2pk,
  });

  t.deepEqual(
    addressContentsToLockingBytecode({
      payload: compressedPublicKey,
      type: AddressType.p2pk,
    }),
    genesisCoinbaseCompressed
  );
});

test('lockingBytecode <-> AddressContents: P2PKH', (t) => {
  const p2pkh = hexToBin('76a91465a16059864a2fdbc7c99a4723a8395bc6f188eb88ac');
  const expectedPayload = hexToBin('65a16059864a2fdbc7c99a4723a8395bc6f188eb');
  t.deepEqual(lockingBytecodeToAddressContents(p2pkh), {
    payload: expectedPayload,
    type: AddressType.p2pkh,
  });
  t.deepEqual(
    addressContentsToLockingBytecode({
      payload: expectedPayload,
      type: AddressType.p2pkh,
    }),
    p2pkh
  );
});

test('lockingBytecode <-> AddressContents: P2SH', (t) => {
  const p2sh = hexToBin('a91474f209f6ea907e2ea48f74fae05782ae8a66525787');
  const expectedPayload = hexToBin('74f209f6ea907e2ea48f74fae05782ae8a665257');
  t.deepEqual(lockingBytecodeToAddressContents(p2sh), {
    payload: expectedPayload,
    type: AddressType.p2sh,
  });
  t.deepEqual(
    addressContentsToLockingBytecode({
      payload: expectedPayload,
      type: AddressType.p2sh,
    }),
    p2sh
  );
});

test('lockingBytecode <-> AddressContents: unknown', (t) => {
  const simpleMath = hexToBin('52935387');
  t.deepEqual(lockingBytecodeToAddressContents(simpleMath), {
    payload: simpleMath,
    type: AddressType.unknown,
  });
  t.deepEqual(
    addressContentsToLockingBytecode({
      payload: simpleMath,
      type: AddressType.unknown,
    }),
    simpleMath
  );

  const almostP2pk = hexToBin('0100ac');
  const almostP2pkh = hexToBin('76a9010088ac');
  const almostP2sh = hexToBin('a9010087');

  t.deepEqual(lockingBytecodeToAddressContents(almostP2pk), {
    payload: almostP2pk,
    type: AddressType.unknown,
  });

  t.deepEqual(lockingBytecodeToAddressContents(almostP2pkh), {
    payload: almostP2pkh,
    type: AddressType.unknown,
  });

  t.deepEqual(lockingBytecodeToAddressContents(almostP2sh), {
    payload: almostP2sh,
    type: AddressType.unknown,
  });
});

test('lockingBytecodeToAddressContents: improperly sized scripts return AddressType.unknown', (t) => {
  const almostP2pk = hexToBin('0100ac');
  const almostP2pkh = hexToBin('76a9010088ac');
  const almostP2sh = hexToBin('a9010087');

  t.deepEqual(lockingBytecodeToAddressContents(almostP2pk), {
    payload: almostP2pk,
    type: AddressType.unknown,
  });

  t.deepEqual(lockingBytecodeToAddressContents(almostP2pkh), {
    payload: almostP2pkh,
    type: AddressType.unknown,
  });

  t.deepEqual(lockingBytecodeToAddressContents(almostP2sh), {
    payload: almostP2sh,
    type: AddressType.unknown,
  });
});

const cashVectors: Macro<[string, string]> = (t, cashAddress, bytecode) => {
  t.deepEqual(cashAddressToLockingBytecode(cashAddress), {
    bytecode: hexToBin(bytecode),
    prefix: 'bitcoincash',
  });
  t.deepEqual(
    lockingBytecodeToCashAddress(hexToBin(bytecode), 'bitcoincash'),
    cashAddress
  );
};

// eslint-disable-next-line functional/immutable-data
cashVectors.title = (_, cashAddress) =>
  `cashAddressToLockingBytecode <-> lockingBytecodeToCashAddress: ${cashAddress}`;

test(
  cashVectors,
  'bitcoincash:qpm2qsznhks23z7629mms6s4cwef74vcwvy22gdx6a',
  '76a91476a04053bda0a88bda5177b86a15c3b29f55987388ac'
);

test(
  cashVectors,
  'bitcoincash:qr95sy3j9xwd2ap32xkykttr4cvcu7as4y0qverfuy',
  '76a914cb481232299cd5743151ac4b2d63ae198e7bb0a988ac'
);

test(
  cashVectors,
  'bitcoincash:qqq3728yw0y47sqn6l2na30mcw6zm78dzqre909m2r',
  '76a914011f28e473c95f4013d7d53ec5fbc3b42df8ed1088ac'
);

test(
  cashVectors,
  'bitcoincash:ppm2qsznhks23z7629mms6s4cwef74vcwvn0h829pq',
  'a91476a04053bda0a88bda5177b86a15c3b29f55987387'
);

test(
  cashVectors,
  'bitcoincash:pr95sy3j9xwd2ap32xkykttr4cvcu7as4yc93ky28e',
  'a914cb481232299cd5743151ac4b2d63ae198e7bb0a987'
);

test(
  cashVectors,
  'bitcoincash:pqq3728yw0y47sqn6l2na30mcw6zm78dzq5ucqzc37',
  'a914011f28e473c95f4013d7d53ec5fbc3b42df8ed1087'
);

test('lockingBytecodeToCashAddress: P2PK', (t) => {
  const genesisCoinbase = hexToBin(
    '4104678afdb0fe5548271967f1a67130b7105cd6a828e03909a67962e0ea1f61deb649f6bc3f4cef38c4f35504e51ec112de5c384df7ba0b8d578a4c702b6bf11d5fac'
  );
  const genesisPublicKey = hexToBin(
    '04678afdb0fe5548271967f1a67130b7105cd6a828e03909a67962e0ea1f61deb649f6bc3f4cef38c4f35504e51ec112de5c384df7ba0b8d578a4c702b6bf11d5f'
  );

  t.deepEqual(
    lockingBytecodeToCashAddress(
      genesisCoinbase,
      CashAddressNetworkPrefix.mainnet
    ),
    {
      payload: genesisPublicKey,
      type: AddressType.p2pk,
    }
  );

  const genesisCoinbaseCompressed = hexToBin(
    '2103678afdb0fe5548271967f1a67130b7105cd6a828e03909a67962e0ea1f61deb6ac'
  );
  const compressedPublicKey = hexToBin(
    '03678afdb0fe5548271967f1a67130b7105cd6a828e03909a67962e0ea1f61deb6'
  );
  t.deepEqual(
    lockingBytecodeToCashAddress(
      genesisCoinbaseCompressed,
      CashAddressNetworkPrefix.mainnet
    ),
    {
      payload: compressedPublicKey,
      type: AddressType.p2pk,
    }
  );
});

test('cashAddressToLockingBytecode <-> lockingBytecodeToCashAddress: P2SH', (t) => {
  const p2sh = hexToBin('a91474f209f6ea907e2ea48f74fae05782ae8a66525787');
  const address = 'bitcoincash:pp60yz0ka2g8ut4y3a604czhs2hg5ejj2ugn82jfsr';
  t.deepEqual(lockingBytecodeToCashAddress(p2sh, 'bitcoincash'), address);
  t.deepEqual(cashAddressToLockingBytecode(address), {
    bytecode: p2sh,
    prefix: 'bitcoincash',
  });
});

test('lockingBytecodeToCashAddress: error', (t) => {
  const simpleMath = hexToBin('52935387');
  t.deepEqual(lockingBytecodeToCashAddress(simpleMath, 'bitcoincash'), {
    payload: simpleMath,
    type: AddressType.unknown,
  });
  const genesisCoinbase = hexToBin(
    '4104678afdb0fe5548271967f1a67130b7105cd6a828e03909a67962e0ea1f61deb649f6bc3f4cef38c4f35504e51ec112de5c384df7ba0b8d578a4c702b6bf11d5fac'
  );
  t.deepEqual(lockingBytecodeToCashAddress(genesisCoinbase, 'bitcoincash'), {
    payload: hexToBin(
      '04678afdb0fe5548271967f1a67130b7105cd6a828e03909a67962e0ea1f61deb649f6bc3f4cef38c4f35504e51ec112de5c384df7ba0b8d578a4c702b6bf11d5f'
    ),
    type: AddressType.p2pk,
  });
});

test('cashAddressToLockingBytecode: error', (t) => {
  t.deepEqual(
    cashAddressToLockingBytecode('bad:address'),
    CashAddressDecodingError.invalidChecksum
  );
  t.deepEqual(
    cashAddressToLockingBytecode(
      'bitcoincash:dp60yz0ka2g8ut4y3a604czhs2hg5ejj2u6xkulaqj'
    ),
    LockingBytecodeEncodingError.unknownCashAddressType
  );
});

test('lockingBytecodeToBase58Address: P2PK', async (t) => {
  const sha256 = await sha256Promise;
  const genesisCoinbase = hexToBin(
    '4104678afdb0fe5548271967f1a67130b7105cd6a828e03909a67962e0ea1f61deb649f6bc3f4cef38c4f35504e51ec112de5c384df7ba0b8d578a4c702b6bf11d5fac'
  );
  const genesisPublicKey = hexToBin(
    '04678afdb0fe5548271967f1a67130b7105cd6a828e03909a67962e0ea1f61deb649f6bc3f4cef38c4f35504e51ec112de5c384df7ba0b8d578a4c702b6bf11d5f'
  );

  t.deepEqual(
    lockingBytecodeToBase58Address(sha256, genesisCoinbase, 'mainnet'),
    {
      payload: genesisPublicKey,
      type: AddressType.p2pk,
    }
  );

  const genesisCoinbaseCompressed = hexToBin(
    '2103678afdb0fe5548271967f1a67130b7105cd6a828e03909a67962e0ea1f61deb6ac'
  );
  const compressedPublicKey = hexToBin(
    '03678afdb0fe5548271967f1a67130b7105cd6a828e03909a67962e0ea1f61deb6'
  );
  t.deepEqual(
    lockingBytecodeToBase58Address(
      sha256,
      genesisCoinbaseCompressed,
      'testnet'
    ),
    {
      payload: compressedPublicKey,
      type: AddressType.p2pk,
    }
  );
});

test('base58AddressToLockingBytecode <-> lockingBytecodeToBase58Address: P2PKH', async (t) => {
  const sha256 = await sha256Promise;
  const p2pkh = hexToBin('76a91476a04053bda0a88bda5177b86a15c3b29f55987388ac');
  // cspell: disable-next-line
  const address = '1BpEi6DfDAUFd7GtittLSdBeYJvcoaVggu';
  // cspell: disable-next-line
  const addressTestnet = 'mrLC19Je2BuWQDkWSTriGYPyQJXKkkBmCx';
  // cspell: disable-next-line
  const addressCopay = 'CTH8H8Zj6DSnXFBKQeDG28ogAS92iS16Bp';
  t.deepEqual(
    lockingBytecodeToBase58Address(sha256, p2pkh, 'mainnet'),
    address
  );
  t.deepEqual(
    lockingBytecodeToBase58Address(sha256, p2pkh, 'testnet'),
    addressTestnet
  );
  t.deepEqual(
    lockingBytecodeToBase58Address(sha256, p2pkh, 'copay-bch'),
    addressCopay
  );

  t.deepEqual(base58AddressToLockingBytecode(sha256, address), {
    bytecode: p2pkh,
    version: Base58AddressFormatVersion.p2pkh,
  });
  t.deepEqual(base58AddressToLockingBytecode(sha256, addressTestnet), {
    bytecode: p2pkh,
    version: Base58AddressFormatVersion.p2pkhTestnet,
  });
  t.deepEqual(base58AddressToLockingBytecode(sha256, addressCopay), {
    bytecode: p2pkh,
    version: Base58AddressFormatVersion.p2pkhCopayBCH,
  });
});

test('base58AddressToLockingBytecode <-> lockingBytecodeToBase58Address: P2SH', async (t) => {
  const sha256 = await sha256Promise;
  const p2sh = hexToBin('a91476a04053bda0a88bda5177b86a15c3b29f55987387');
  // cspell: disable-next-line
  const address = '3CWFddi6m4ndiGyKqzYvsFYagqDLPVMTzC';
  // cspell: disable-next-line
  const addressTestnet = '2N44ThNe8NXHyv4bsX8AoVCXquBRW94Ls7W';
  // cspell: disable-next-line
  const addressCopay = 'HHLN6S9BcP1JLSrMhgD5qe57iVEMFMLCBT';
  t.deepEqual(lockingBytecodeToBase58Address(sha256, p2sh, 'mainnet'), address);
  t.deepEqual(
    lockingBytecodeToBase58Address(sha256, p2sh, 'testnet'),
    addressTestnet
  );
  t.deepEqual(
    lockingBytecodeToBase58Address(sha256, p2sh, 'copay-bch'),
    addressCopay
  );

  t.deepEqual(base58AddressToLockingBytecode(sha256, address), {
    bytecode: p2sh,
    version: Base58AddressFormatVersion.p2sh,
  });
  t.deepEqual(base58AddressToLockingBytecode(sha256, addressTestnet), {
    bytecode: p2sh,
    version: Base58AddressFormatVersion.p2shTestnet,
  });
  t.deepEqual(base58AddressToLockingBytecode(sha256, addressCopay), {
    bytecode: p2sh,
    version: Base58AddressFormatVersion.p2shCopayBCH,
  });
});

test('base58AddressToLockingBytecode: error', async (t) => {
  const sha256 = await sha256Promise;
  t.deepEqual(
    base58AddressToLockingBytecode(sha256, 'bad:address'),
    Base58AddressError.unknownCharacter
  );
});
