/* eslint-disable @typescript-eslint/no-magic-numbers, functional/no-expression-statement */
import test, { Macro } from 'ava';
import * as fc from 'fast-check';

import {
  attemptCashAddressFormatErrorCorrection,
  CashAddressAvailableSizesInBits,
  CashAddressAvailableTypes,
  CashAddressCorrectionError,
  CashAddressDecodingError,
  CashAddressEncodingError,
  CashAddressNetworkPrefix,
  CashAddressType,
  CashAddressVersionByte,
  CashAddressVersionByteDecodingError,
  decodeBase58AddressFormat,
  decodeCashAddress,
  decodeCashAddressFormat,
  decodeCashAddressFormatWithoutPrefix,
  decodeCashAddressVersionByte,
  encodeCashAddress,
  encodeCashAddressFormat,
  encodeCashAddressVersionByte,
  hexToBin,
  instantiateSha256,
  maskCashAddressPrefix,
  splitEvery,
} from '../lib';

import * as cashAddrJson from './fixtures/cashaddr.json';

const maxUint8Number = 255;
const fcUint8Array = (length: number) =>
  fc
    .array(fc.integer(0, maxUint8Number), length, length)
    .map((a) => Uint8Array.from(a));

const lowercaseLetter = () =>
  fc.integer(97, 122).map((i) => String.fromCharCode(i));

const cashAddressTestVectors = Object.values(cashAddrJson).filter(
  (item) => !Array.isArray(item)
);

test('maskCashAddressPrefix', (t) => {
  // prettier-ignore
  const payloadPrefix = [2, 9, 20, 3, 15, 9, 14, 3, 1, 19, 8];
  t.deepEqual(maskCashAddressPrefix('bitcoincash'), payloadPrefix);
});

test('encodeCashAddressVersionByte', (t) => {
  t.deepEqual(
    encodeCashAddressVersionByte(0, 160),
    CashAddressVersionByte.P2PKH
  );
  t.deepEqual(
    encodeCashAddressVersionByte(1, 160),
    CashAddressVersionByte.P2SH
  );
});

test('decodeCashAddressVersionByte', (t) => {
  t.deepEqual(decodeCashAddressVersionByte(CashAddressVersionByte.P2PKH), {
    bitLength: 160,
    type: 0,
  });
  t.deepEqual(decodeCashAddressVersionByte(CashAddressVersionByte.P2SH), {
    bitLength: 160,
    type: 1,
  });
  t.deepEqual(
    decodeCashAddressVersionByte(0b10000000),
    CashAddressVersionByteDecodingError.reservedBitSet
  );
  t.deepEqual(decodeCashAddressVersionByte(0b01000011), {
    bitLength: 256,
    type: 8,
  });

  t.deepEqual(decodeCashAddressVersionByte(0b01111111), {
    bitLength: 512,
    type: 15,
  });
});

test('encodeCashAddress: works', (t) => {
  const hash = hexToBin('15d16c84669ab46059313bf0747e781f1d13936d');

  t.deepEqual(
    encodeCashAddress(
      CashAddressNetworkPrefix.testnet,
      CashAddressVersionByte.P2PKH,
      hash
    ),
    'bchtest:qq2azmyyv6dtgczexyalqar70q036yund53jvfde0x'
  );
  t.deepEqual(
    encodeCashAddress('bchtest', 0, hash),
    'bchtest:qq2azmyyv6dtgczexyalqar70q036yund53jvfde0x'
  );

  t.deepEqual(
    encodeCashAddress(
      CashAddressNetworkPrefix.mainnet,
      CashAddressVersionByte.P2PKH,
      hash
    ),
    'bitcoincash:qq2azmyyv6dtgczexyalqar70q036yund54qgw0wg6'
  );
  t.deepEqual(
    encodeCashAddress('bitcoincash', 0, hash),
    'bitcoincash:qq2azmyyv6dtgczexyalqar70q036yund54qgw0wg6'
  );

  t.deepEqual(
    encodeCashAddress(
      CashAddressNetworkPrefix.regtest,
      CashAddressVersionByte.P2PKH,
      hash
    ),
    'bchreg:qq2azmyyv6dtgczexyalqar70q036yund5tw6gw2vq'
  );
  t.deepEqual(
    encodeCashAddress('bchreg', 0, hash),
    'bchreg:qq2azmyyv6dtgczexyalqar70q036yund5tw6gw2vq'
  );

  t.deepEqual(
    encodeCashAddressFormat(
      'bitauth',
      encodeCashAddressVersionByte(0, 256),
      hexToBin(
        '978306aa4e02fd06e251b38d2e961f78f4af2ea6524a3e4531126776276a6af1'
      )
    ),
    'bitauth:qwtcxp42fcp06phz2xec6t5krau0ftew5efy50j9xyfxwa38df40zp58z6t5w'
  );

  t.deepEqual(
    encodeCashAddress('broken', 0, hexToBin('97')),
    CashAddressEncodingError.unsupportedHashLength
  );
});

test('decodeCashAddress: works', (t) => {
  const hash = hexToBin('15d16c84669ab46059313bf0747e781f1d13936d');
  const result = decodeCashAddress(
    'bchtest:qq2azmyyv6dtgczexyalqar70q036yund53jvfde0x'
  );
  // eslint-disable-next-line functional/no-conditional-statement
  if (typeof result === 'string') {
    t.log(result);
    t.fail();
  }
  t.deepEqual(result, { hash, prefix: 'bchtest', type: 0 });
  t.deepEqual(
    decodeCashAddress('bchtest:qq2azmyyv6dtgczexyalqar70q036yund53jvfde0x'),
    {
      hash,
      prefix: CashAddressNetworkPrefix.testnet,
      type: CashAddressType.P2PKH,
    }
  );

  t.deepEqual(
    decodeCashAddress('bitcoincash:qq2azmyyv6dtgczexyalqar70q036yund54qgw0wg6'),
    {
      hash,
      prefix: CashAddressNetworkPrefix.mainnet,
      type: CashAddressType.P2PKH,
    }
  );
  t.deepEqual(
    decodeCashAddress('bitcoincash:qq2azmyyv6dtgczexyalqar70q036yund54qgw0wg6'),
    { hash, prefix: 'bitcoincash', type: 0 }
  );

  t.deepEqual(
    decodeCashAddress('bchreg:qq2azmyyv6dtgczexyalqar70q036yund5tw6gw2vq'),
    {
      hash,
      prefix: CashAddressNetworkPrefix.regtest,
      type: CashAddressType.P2PKH,
    }
  );
  t.deepEqual(
    decodeCashAddress('bchreg:qq2azmyyv6dtgczexyalqar70q036yund5tw6gw2vq'),
    { hash, prefix: 'bchreg', type: 0 }
  );

  t.deepEqual(
    decodeCashAddressFormat(
      'bitauth:qwtcxp42fcp06phz2xec6t5krau0ftew5efy50j9xyfxwa38df40zp58z6t5w'
    ),
    {
      hash: hexToBin(
        '978306aa4e02fd06e251b38d2e961f78f4af2ea6524a3e4531126776276a6af1'
      ),
      prefix: 'bitauth',
      version: encodeCashAddressVersionByte(0, 256),
    }
  );

  t.deepEqual(
    decodeCashAddressFormat(
      ':qwtcxp42fcp06phz2xec6t5krau0ftew5efy50j9xyfxwa38df40zp58z6t5w'
    ),
    CashAddressDecodingError.invalidFormat
  );

  t.deepEqual(
    decodeCashAddress('prefix:broken'),
    CashAddressDecodingError.invalidCharacters
  );

  t.deepEqual(
    decodeCashAddressFormat('prefix:broken'),
    CashAddressDecodingError.invalidCharacters
  );

  t.deepEqual(
    // cspell: disable-next-line
    decodeCashAddressFormat('verybroken:lll30n6j98m5'),
    CashAddressDecodingError.improperPadding
  );

  t.deepEqual(
    // cspell: disable-next-line
    decodeCashAddressFormat('bchtest:testnetaddress4d6njnut'),
    CashAddressDecodingError.improperPadding
  );
  t.deepEqual(
    decodeCashAddress(
      'bchreg:555555555555555555555555555555555555555555555udxmlmrz'
    ),
    CashAddressDecodingError.reservedByte
  );
  t.deepEqual(
    decodeCashAddress('bitcoincash:qu2azmyyv6dtgczexyalqar70q036yund53an46hf6'),
    CashAddressDecodingError.mismatchedHashLength
  );
});

test('CashAddress test vectors', (t) => {
  cashAddressTestVectors.forEach((vector) => {
    const { cashaddr } = vector;
    const [prefix] = cashaddr.split(':');
    const payload = hexToBin(vector.payload);
    const type = vector.type as CashAddressAvailableTypes;
    const encodeResult = encodeCashAddress(prefix, type, payload);
    // eslint-disable-next-line functional/no-conditional-statement
    if (cashaddr !== encodeResult) {
      t.log('expected vector', vector.cashaddr);
      t.log('type', type);
      t.log('prefix', prefix);
      t.log('payload', payload);
      t.log('encodeResult', encodeResult);
    }
    t.deepEqual(vector.cashaddr, encodeResult);

    const decodeResult = decodeCashAddress(cashaddr);
    // eslint-disable-next-line functional/no-conditional-statement
    if (typeof decodeResult === 'string') {
      t.log(decodeResult);
      t.fail();
    }
    t.deepEqual(decodeResult, { hash: payload, prefix, type });
  });
});

test('decodeCashAddressWithoutPrefix', (t) => {
  const hash = hexToBin('15d16c84669ab46059313bf0747e781f1d13936d');
  t.deepEqual(
    decodeCashAddressFormatWithoutPrefix(
      'qq2azmyyv6dtgczexyalqar70q036yund53jvfde0x'
    ),
    { hash, prefix: 'bchtest', version: 0 }
  );

  t.deepEqual(
    decodeCashAddressFormatWithoutPrefix(
      'qq2azmyyv6dtgczexyalqar70q036yund54qgw0wg6'
    ),
    { hash, prefix: 'bitcoincash', version: 0 }
  );

  t.deepEqual(
    decodeCashAddressFormatWithoutPrefix(
      'qq2azmyyv6dtgczexyalqar70q036yund5tw6gw2vq'
    ),
    { hash, prefix: 'bchreg', version: 0 }
  );

  t.deepEqual(
    decodeCashAddressFormatWithoutPrefix(
      'qwtcxp42fcp06phz2xec6t5krau0ftew5efy50j9xyfxwa38df40zp58z6t5w',
      ['bitauth']
    ),
    {
      hash: hexToBin(
        '978306aa4e02fd06e251b38d2e961f78f4af2ea6524a3e4531126776276a6af1'
      ),
      prefix: 'bitauth',
      version: encodeCashAddressVersionByte(0, 256),
    }
  );

  t.deepEqual(
    // cspell: disable-next-line
    decodeCashAddressFormatWithoutPrefix('qwtcxp42fcp06phz', ['bitauth']),
    CashAddressDecodingError.invalidChecksum
  );
});

test('[fast-check] encodeCashAddress <-> decodeCashAddress', (t) => {
  const roundTripWithHashLength = (
    hashLength: CashAddressAvailableSizesInBits
  ) =>
    fc.property(
      fc.array(lowercaseLetter(), 1, 50).map((arr) => arr.join('')),
      fc.nat(15),
      fcUint8Array(hashLength / 8),
      (prefix, type, hash) => {
        // t.log(decodeCashAddressVersionByte(version));
        t.deepEqual(
          decodeCashAddress(
            encodeCashAddress(prefix, type as CashAddressAvailableTypes, hash)
          ),
          { hash, prefix, type }
        );
      }
    );
  t.notThrows(() => {
    fc.assert(roundTripWithHashLength(160));
    fc.assert(roundTripWithHashLength(192));
    fc.assert(roundTripWithHashLength(224));
    fc.assert(roundTripWithHashLength(256));
    fc.assert(roundTripWithHashLength(320));
    fc.assert(roundTripWithHashLength(384));
    fc.assert(roundTripWithHashLength(448));
    fc.assert(roundTripWithHashLength(512));
  });
});

test('attemptCashAddressErrorCorrection', (t) => {
  t.deepEqual(
    attemptCashAddressFormatErrorCorrection(
      // cspell: disable-next-line
      ':qq2azmyyv6dtgczexyalqar70q036yund53jvfde0c'
    ),
    CashAddressDecodingError.invalidFormat
  );

  t.deepEqual(
    attemptCashAddressFormatErrorCorrection(
      // cspell: disable-next-line
      'broken:broken'
    ),
    CashAddressDecodingError.invalidCharacters
  );

  t.deepEqual(
    attemptCashAddressFormatErrorCorrection(
      // cspell: disable-next-line
      'achtest:qq2azmyyv6dtgczexyalqar70q036yund53jvfde0c'
    ),
    {
      address: 'bchtest:qq2azmyyv6dtgczexyalqar70q036yund53jvfde0x',
      corrections: [0, 49],
    }
  );
  t.deepEqual(
    attemptCashAddressFormatErrorCorrection(
      // cspell: disable-next-line
      'btcbest:qq2azmyyv6dtgczexyalqar70q036yund53jvfde0x'
    ),
    CashAddressCorrectionError.tooManyErrors
  );
});

test('[fast-check] attemptCashAddressErrorCorrection', (t) => {
  const correctsUpToTwoErrors = (hashLength: CashAddressAvailableSizesInBits) =>
    fc.property(
      fc.array(lowercaseLetter(), 1, 50).map((arr) => arr.join('')),
      fc.nat(15),
      fcUint8Array(hashLength / 8),
      fc.array(fc.nat(hashLength / 8), 0, 2),
      // eslint-disable-next-line max-params
      (prefix, type, hash, randomErrors) => {
        const address = encodeCashAddress(
          prefix,
          type as CashAddressAvailableTypes,
          hash
        );
        const addressChars = splitEvery(address, 1);
        const errors = [
          ...new Set(
            randomErrors
              .filter((i) => i !== prefix.length)
              .sort((a, b) => a - b)
          ),
        ];
        const broken = addressChars
          .map((char, i) =>
            errors.includes(i) ? (char === 'q' ? 'p' : 'q') : char
          )
          .join('');

        t.deepEqual(attemptCashAddressFormatErrorCorrection(broken), {
          address,
          corrections: errors,
        });
      }
    );
  t.notThrows(() => {
    fc.assert(correctsUpToTwoErrors(160));
    fc.assert(correctsUpToTwoErrors(192));
    fc.assert(correctsUpToTwoErrors(224));
    fc.assert(correctsUpToTwoErrors(256));
    fc.assert(correctsUpToTwoErrors(320));
    fc.assert(correctsUpToTwoErrors(384));
    fc.assert(correctsUpToTwoErrors(448));
    fc.assert(correctsUpToTwoErrors(512));
  });
});

const sha256Promise = instantiateSha256();

const legacyVectors: Macro<[string, string]> = async (
  t,
  base58Address,
  cashAddress
) => {
  const sha256 = await sha256Promise;
  const decodedBase58Address = decodeBase58AddressFormat(sha256, base58Address);
  const decodedCashAddress = decodeCashAddress(cashAddress);
  if (
    typeof decodedCashAddress === 'string' ||
    typeof decodedBase58Address === 'string'
  ) {
    t.fail();
    return undefined;
  }
  t.deepEqual(decodedBase58Address.payload, decodedCashAddress.hash);
  return undefined;
};

// eslint-disable-next-line functional/immutable-data
legacyVectors.title = (_, base58Address) =>
  `CashAddress <-> Legacy Base58 Vectors: ${base58Address}`;

test(
  legacyVectors,
  // cspell: disable-next-line
  '1BpEi6DfDAUFd7GtittLSdBeYJvcoaVggu',
  'bitcoincash:qpm2qsznhks23z7629mms6s4cwef74vcwvy22gdx6a'
);

test(
  legacyVectors,
  // cspell: disable-next-line
  '1KXrWXciRDZUpQwQmuM1DbwsKDLYAYsVLR',
  'bitcoincash:qr95sy3j9xwd2ap32xkykttr4cvcu7as4y0qverfuy'
);

test(
  legacyVectors,
  // cspell: disable-next-line
  '16w1D5WRVKJuZUsSRzdLp9w3YGcgoxDXb',
  'bitcoincash:qqq3728yw0y47sqn6l2na30mcw6zm78dzqre909m2r'
);

test(
  legacyVectors,
  // cspell: disable-next-line
  '3CWFddi6m4ndiGyKqzYvsFYagqDLPVMTzC',
  'bitcoincash:ppm2qsznhks23z7629mms6s4cwef74vcwvn0h829pq'
);

test(
  legacyVectors,
  // cspell: disable-next-line
  '3LDsS579y7sruadqu11beEJoTjdFiFCdX4',
  'bitcoincash:pr95sy3j9xwd2ap32xkykttr4cvcu7as4yc93ky28e'
);

test(
  legacyVectors,
  // cspell: disable-next-line
  '31nwvkZwyPdgzjBJZXfDmSWsC4ZLKpYyUw',
  'bitcoincash:pqq3728yw0y47sqn6l2na30mcw6zm78dzq5ucqzc37'
);
