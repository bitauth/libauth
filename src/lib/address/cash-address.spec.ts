import test from 'ava';

import type {
  CashAddressAvailableTypeBits,
  CashAddressSupportedLength,
} from '../lib.js';
import {
  attemptCashAddressFormatErrorCorrection,
  CashAddressCorrectionError,
  CashAddressDecodingError,
  CashAddressNetworkPrefix,
  CashAddressType,
  CashAddressTypeBits,
  CashAddressVersionByte,
  CashAddressVersionByteDecodingError,
  decodeBase58AddressFormat,
  decodeCashAddress,
  decodeCashAddressFormat,
  decodeCashAddressFormatWithoutPrefix,
  decodeCashAddressNonStandard,
  decodeCashAddressVersionByte,
  encodeCashAddress,
  encodeCashAddressFormat,
  encodeCashAddressNonStandard,
  encodeCashAddressVersionByte,
  hexToBin,
  maskCashAddressPrefix,
  splitEvery,
} from '../lib.js';

// eslint-disable-next-line import/no-restricted-paths, import/no-internal-modules
import cashAddrJson from './fixtures/cashaddr.json' assert { type: 'json' };

import fc from 'fast-check';

const lowercaseLetter = () =>
  fc.integer({ max: 122, min: 97 }).map((i) => String.fromCharCode(i));

test('maskCashAddressPrefix', (t) => {
  // prettier-ignore
  const payloadPrefix = [2, 9, 20, 3, 15, 9, 14, 3, 1, 19, 8];
  t.deepEqual(maskCashAddressPrefix('bitcoincash'), payloadPrefix);
});

test('encodeCashAddressVersionByte', (t) => {
  t.deepEqual(
    encodeCashAddressVersionByte(CashAddressTypeBits.p2pkh, 20),
    CashAddressVersionByte.p2pkh,
  );
  t.deepEqual(
    encodeCashAddressVersionByte(0, 20),
    CashAddressVersionByte.p2pkh,
  );
  t.deepEqual(
    encodeCashAddressVersionByte(CashAddressTypeBits.p2sh, 20),
    CashAddressVersionByte.p2sh20,
  );
  t.deepEqual(
    encodeCashAddressVersionByte(1, 20),
    CashAddressVersionByte.p2sh20,
  );
  t.deepEqual(
    encodeCashAddressVersionByte(CashAddressTypeBits.p2sh, 32),
    CashAddressVersionByte.p2sh32,
  );
  t.deepEqual(
    encodeCashAddressVersionByte(CashAddressTypeBits.p2pkhWithTokens, 20),
    CashAddressVersionByte.p2pkhWithTokens,
  );
  t.deepEqual(
    encodeCashAddressVersionByte(CashAddressTypeBits.p2shWithTokens, 20),
    CashAddressVersionByte.p2sh20WithTokens,
  );
  t.deepEqual(
    encodeCashAddressVersionByte(CashAddressTypeBits.p2shWithTokens, 32),
    CashAddressVersionByte.p2sh32WithTokens,
  );
});

test('decodeCashAddressVersionByte', (t) => {
  t.deepEqual(decodeCashAddressVersionByte(CashAddressVersionByte.p2pkh), {
    length: 20,
    typeBits: 0,
  });
  t.deepEqual(decodeCashAddressVersionByte(CashAddressVersionByte.p2sh20), {
    length: 20,
    typeBits: 1,
  });
  t.deepEqual(decodeCashAddressVersionByte(CashAddressVersionByte.p2sh32), {
    length: 32,
    typeBits: 1,
  });
  t.deepEqual(
    decodeCashAddressVersionByte(0b10000000),
    CashAddressVersionByteDecodingError.reservedBitSet,
  );
  t.deepEqual(
    decodeCashAddressVersionByte(CashAddressVersionByte.p2pkhWithTokens),
    { length: 20, typeBits: 2 },
  );
  t.deepEqual(
    decodeCashAddressVersionByte(CashAddressVersionByte.p2sh20WithTokens),
    { length: 20, typeBits: 3 },
  );
  t.deepEqual(
    decodeCashAddressVersionByte(CashAddressVersionByte.p2sh32WithTokens),
    { length: 32, typeBits: 3 },
  );
  t.deepEqual(decodeCashAddressVersionByte(0b01000011), {
    length: 32,
    typeBits: 8,
  });

  t.deepEqual(decodeCashAddressVersionByte(0b01111111), {
    length: 64,
    typeBits: 15,
  });
});

test('encodeCashAddress: works', (t) => {
  const payload = hexToBin('15d16c84669ab46059313bf0747e781f1d13936d');

  t.deepEqual(
    encodeCashAddress('bchtest', CashAddressType.p2pkh, payload),
    'bchtest:qq2azmyyv6dtgczexyalqar70q036yund53jvfde0x',
  );
  t.deepEqual(
    encodeCashAddress('bchtest', 'p2pkh', payload),
    'bchtest:qq2azmyyv6dtgczexyalqar70q036yund53jvfde0x',
  );
  t.deepEqual(
    encodeCashAddress('bitcoincash', CashAddressType.p2pkh, payload),
    'bitcoincash:qq2azmyyv6dtgczexyalqar70q036yund54qgw0wg6',
  );
  t.deepEqual(
    encodeCashAddress('bitcoincash', 'p2pkh', payload),
    'bitcoincash:qq2azmyyv6dtgczexyalqar70q036yund54qgw0wg6',
  );
  t.deepEqual(
    encodeCashAddress('bitcoincash', CashAddressType.p2pkhWithTokens, payload),
    'bitcoincash:zq2azmyyv6dtgczexyalqar70q036yund5j2mspghf',
  );
  t.deepEqual(
    encodeCashAddress('bitcoincash', 'p2pkhWithTokens', payload),
    'bitcoincash:zq2azmyyv6dtgczexyalqar70q036yund5j2mspghf',
  );
  t.deepEqual(
    encodeCashAddress('bchreg', 'p2pkh', payload),
    'bchreg:qq2azmyyv6dtgczexyalqar70q036yund5tw6gw2vq',
  );
  t.deepEqual(
    encodeCashAddress('bchreg', 'p2pkh', payload),
    'bchreg:qq2azmyyv6dtgczexyalqar70q036yund5tw6gw2vq',
  );

  t.deepEqual(
    encodeCashAddressFormat(
      'bitauth',
      encodeCashAddressVersionByte(0, 32),
      hexToBin(
        '978306aa4e02fd06e251b38d2e961f78f4af2ea6524a3e4531126776276a6af1',
      ),
    ),
    'bitauth:qwtcxp42fcp06phz2xec6t5krau0ftew5efy50j9xyfxwa38df40zp58z6t5w',
  );

  t.throws(() => encodeCashAddress('bitcoincash', 'p2sh', hexToBin('97')), {
    message:
      'Error encoding CashAddress: a payload of this length can not be encoded as a valid CashAddress. Payload length: 1.',
  });
});

test('decodeCashAddress: works', (t) => {
  const payload = hexToBin('15d16c84669ab46059313bf0747e781f1d13936d');
  const result = decodeCashAddress(
    'bchtest:qq2azmyyv6dtgczexyalqar70q036yund53jvfde0x',
  );
  if (typeof result === 'string') {
    t.log(result);
    t.fail();
    return;
  }
  t.deepEqual(result, {
    payload,
    prefix: 'bchtest',
    type: CashAddressType.p2pkh,
  });
  t.deepEqual(
    decodeCashAddress('bchtest:qq2azmyyv6dtgczexyalqar70q036yund53jvfde0x'),
    {
      payload,
      prefix: CashAddressNetworkPrefix.testnet,
      type: CashAddressType.p2pkh,
    },
  );

  t.deepEqual(
    decodeCashAddress('bitcoincash:qq2azmyyv6dtgczexyalqar70q036yund54qgw0wg6'),
    {
      payload,
      prefix: CashAddressNetworkPrefix.mainnet,
      type: CashAddressType.p2pkh,
    },
  );
  t.deepEqual(
    decodeCashAddress('bitcoincash:qq2azmyyv6dtgczexyalqar70q036yund54qgw0wg6'),
    { payload, prefix: 'bitcoincash', type: CashAddressType.p2pkh },
  );

  t.deepEqual(
    decodeCashAddress('bchreg:qq2azmyyv6dtgczexyalqar70q036yund5tw6gw2vq'),
    {
      payload,
      prefix: CashAddressNetworkPrefix.regtest,
      type: CashAddressType.p2pkh,
    },
  );
  t.deepEqual(
    decodeCashAddress('bchreg:qq2azmyyv6dtgczexyalqar70q036yund5tw6gw2vq'),
    { payload, prefix: 'bchreg', type: CashAddressType.p2pkh },
  );

  t.deepEqual(
    decodeCashAddressFormat(
      'bitauth:qwtcxp42fcp06phz2xec6t5krau0ftew5efy50j9xyfxwa38df40zp58z6t5w',
    ),
    {
      payload: hexToBin(
        '978306aa4e02fd06e251b38d2e961f78f4af2ea6524a3e4531126776276a6af1',
      ),
      prefix: 'bitauth',
      version: encodeCashAddressVersionByte(0, 32),
    },
  );

  t.deepEqual(
    decodeCashAddressFormat(
      ':qwtcxp42fcp06phz2xec6t5krau0ftew5efy50j9xyfxwa38df40zp58z6t5w',
    ),
    CashAddressDecodingError.invalidFormat,
  );

  t.deepEqual(
    decodeCashAddress('prefix:broken'),
    CashAddressDecodingError.invalidCharacters,
  );

  t.deepEqual(
    decodeCashAddressFormat('prefix:broken'),
    CashAddressDecodingError.invalidCharacters,
  );

  t.deepEqual(
    // cspell: disable-next-line
    decodeCashAddressFormat('verybroken:lll30n6j98m5'),
    CashAddressDecodingError.improperPadding,
  );

  t.deepEqual(
    // cspell: disable-next-line
    decodeCashAddressFormat('bchtest:testnetaddress4d6njnut'),
    CashAddressDecodingError.improperPadding,
  );
  t.deepEqual(
    decodeCashAddress(
      'bchreg:555555555555555555555555555555555555555555555udxmlmrz',
    ),
    CashAddressDecodingError.reservedByte,
  );
  t.deepEqual(
    decodeCashAddress('bitcoincash:qu2azmyyv6dtgczexyalqar70q036yund53an46hf6'),
    CashAddressDecodingError.mismatchedPayloadLength,
  );
});

test('CashAddress test vectors', (t) => {
  Object.values(cashAddrJson)
    .filter((item) => !Array.isArray(item))
    .forEach((vector) => {
      const { cashaddr } = vector;
      const [prefix] = cashaddr.split(':') as [string];
      const payload = hexToBin(vector.payload);
      const typeBits = vector.type as CashAddressAvailableTypeBits;
      const version = encodeCashAddressVersionByte(
        typeBits,
        payload.length as CashAddressSupportedLength,
      );
      const encodeResult = encodeCashAddressFormat(prefix, version, payload);
      if (cashaddr !== encodeResult) {
        t.log('expected vector', vector.cashaddr);
        t.log('typeBits', typeBits);
        t.log('prefix', prefix);
        t.log('payload', payload);
        t.log('encodeResult', encodeResult);
      }
      t.deepEqual(vector.cashaddr, encodeResult);

      const decodeResult = decodeCashAddressNonStandard(cashaddr);
      if (typeof decodeResult === 'string') {
        t.log(decodeResult);
        t.fail();
      }
      t.deepEqual(decodeResult, { payload, prefix, typeBits });
    });
});

test('decodeCashAddressWithoutPrefix', (t) => {
  const payload = hexToBin('15d16c84669ab46059313bf0747e781f1d13936d');
  t.deepEqual(
    decodeCashAddressFormatWithoutPrefix(
      'qq2azmyyv6dtgczexyalqar70q036yund53jvfde0x',
    ),
    { payload, prefix: 'bchtest', version: 0 },
  );

  t.deepEqual(
    decodeCashAddressFormatWithoutPrefix(
      'qq2azmyyv6dtgczexyalqar70q036yund54qgw0wg6',
    ),
    { payload, prefix: 'bitcoincash', version: 0 },
  );

  t.deepEqual(
    decodeCashAddressFormatWithoutPrefix(
      'qq2azmyyv6dtgczexyalqar70q036yund5tw6gw2vq',
    ),
    { payload, prefix: 'bchreg', version: 0 },
  );

  t.deepEqual(
    decodeCashAddressFormatWithoutPrefix(
      'qwtcxp42fcp06phz2xec6t5krau0ftew5efy50j9xyfxwa38df40zp58z6t5w',
      ['bitauth'],
    ),
    {
      payload: hexToBin(
        '978306aa4e02fd06e251b38d2e961f78f4af2ea6524a3e4531126776276a6af1',
      ),
      prefix: 'bitauth',
      version: encodeCashAddressVersionByte(0, 32),
    },
  );

  t.deepEqual(
    // cspell: disable-next-line
    decodeCashAddressFormatWithoutPrefix('qwtcxp42fcp06phz', ['bitauth']),
    CashAddressDecodingError.invalidChecksum,
  );
});

test('[fast-check] encodeCashAddressFormat <-> decodeCashAddressFormat', (t) => {
  const roundTripWithPayloadLength = (length: CashAddressSupportedLength) =>
    fc.property(
      fc
        .array(lowercaseLetter(), { maxLength: 50, minLength: 1 })
        .map((arr) => arr.join('')),
      fc.nat(0xff),
      fc.uint8Array({ maxLength: length, minLength: length }),
      (prefix, version, payload) => {
        t.deepEqual(
          decodeCashAddressFormat(
            encodeCashAddressFormat(prefix, version, payload),
          ),
          { payload, prefix, version },
        );
      },
    );
  t.notThrows(() => {
    fc.assert(roundTripWithPayloadLength(20));
    fc.assert(roundTripWithPayloadLength(24));
    fc.assert(roundTripWithPayloadLength(28));
    fc.assert(roundTripWithPayloadLength(32));
    fc.assert(roundTripWithPayloadLength(40));
    fc.assert(roundTripWithPayloadLength(48));
    fc.assert(roundTripWithPayloadLength(56));
    fc.assert(roundTripWithPayloadLength(64));
  });
});

test('[fast-check] encodeCashAddressNonStandard <-> decodeCashAddressNonStandard', (t) => {
  const roundTripWithPayloadLength = (length: CashAddressSupportedLength) =>
    fc.property(
      fc
        .array(lowercaseLetter(), { maxLength: 50, minLength: 1 })
        .map((arr) => arr.join('')),
      fc.nat(15),
      fc.uint8Array({ maxLength: length, minLength: length }),
      (prefix, typeBits, payload) => {
        t.deepEqual(
          decodeCashAddressNonStandard(
            encodeCashAddressNonStandard(
              prefix,
              typeBits as CashAddressAvailableTypeBits,
              payload,
            ),
          ),
          { payload, prefix, typeBits },
        );
      },
    );
  t.notThrows(() => {
    fc.assert(roundTripWithPayloadLength(20));
    fc.assert(roundTripWithPayloadLength(24));
    fc.assert(roundTripWithPayloadLength(28));
    fc.assert(roundTripWithPayloadLength(32));
    fc.assert(roundTripWithPayloadLength(40));
    fc.assert(roundTripWithPayloadLength(48));
    fc.assert(roundTripWithPayloadLength(56));
    fc.assert(roundTripWithPayloadLength(64));
  });
});

test('[fast-check] encodeCashAddress <-> decodeCashAddress', (t) => {
  const prefixes = Object.keys(
    CashAddressNetworkPrefix,
  ) as CashAddressNetworkPrefix[];
  const types = Object.keys(CashAddressType) as CashAddressType[];
  const roundTripWithPayloadLength = (length: CashAddressSupportedLength) =>
    fc.property(
      fc.nat(prefixes.length - 1),
      fc.nat(types.length - 1),
      fc.uint8Array({ maxLength: length, minLength: length }),
      (prefixIndex, typeIndex, payload) => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const prefix = prefixes[prefixIndex]!;
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const type = types[typeIndex]!;
        t.deepEqual(
          decodeCashAddress(encodeCashAddress(prefix, type, payload)),
          { payload, prefix, type },
        );
      },
    );
  t.notThrows(() => {
    fc.assert(roundTripWithPayloadLength(20));
    fc.assert(roundTripWithPayloadLength(24));
    fc.assert(roundTripWithPayloadLength(28));
    fc.assert(roundTripWithPayloadLength(32));
    fc.assert(roundTripWithPayloadLength(40));
    fc.assert(roundTripWithPayloadLength(48));
    fc.assert(roundTripWithPayloadLength(56));
    fc.assert(roundTripWithPayloadLength(64));
  });
});

test('attemptCashAddressErrorCorrection', (t) => {
  t.deepEqual(
    attemptCashAddressFormatErrorCorrection(
      // cspell: disable-next-line
      ':qq2azmyyv6dtgczexyalqar70q036yund53jvfde0c',
    ),
    CashAddressDecodingError.invalidFormat,
  );

  t.deepEqual(
    attemptCashAddressFormatErrorCorrection(
      // cspell: disable-next-line
      'broken:broken',
    ),
    CashAddressDecodingError.invalidCharacters,
  );

  t.deepEqual(
    attemptCashAddressFormatErrorCorrection(
      // cspell: disable-next-line
      'achtest:qq2azmyyv6dtgczexyalqar70q036yund53jvfde0c',
    ),
    {
      address: 'bchtest:qq2azmyyv6dtgczexyalqar70q036yund53jvfde0x',
      corrections: [0, 49],
    },
  );
  t.deepEqual(
    attemptCashAddressFormatErrorCorrection(
      // cspell: disable-next-line
      'btcbest:qq2azmyyv6dtgczexyalqar70q036yund53jvfde0x',
    ),
    CashAddressCorrectionError.tooManyErrors,
  );
});

test('[fast-check] attemptCashAddressErrorCorrection', (t) => {
  const correctsUpToTwoErrors = (payloadLength: CashAddressSupportedLength) =>
    fc.property(
      fc
        .array(lowercaseLetter(), { maxLength: 50, minLength: 1 })
        .map((arr) => arr.join('')),
      fc.nat(15),
      fc.uint8Array({ maxLength: payloadLength, minLength: payloadLength }),
      fc.array(fc.nat(payloadLength), { maxLength: 2, minLength: 0 }),
      // eslint-disable-next-line @typescript-eslint/max-params
      (prefix, typeBits, payload, randomErrors) => {
        const address = encodeCashAddressNonStandard(
          prefix,
          typeBits as CashAddressAvailableTypeBits,
          payload,
        );
        const addressChars = splitEvery(address, 1);
        const errors = [
          ...new Set(
            randomErrors
              .filter((i) => i !== prefix.length)
              .sort((a, b) => a - b),
          ),
        ];
        const broken = addressChars
          .map((char, i) =>
            errors.includes(i) ? (char === 'q' ? 'p' : 'q') : char,
          )
          .join('');

        t.deepEqual(attemptCashAddressFormatErrorCorrection(broken), {
          address,
          corrections: errors,
        });
      },
    );
  t.notThrows(() => {
    fc.assert(correctsUpToTwoErrors(20));
    fc.assert(correctsUpToTwoErrors(24));
    fc.assert(correctsUpToTwoErrors(28));
    fc.assert(correctsUpToTwoErrors(32));
    fc.assert(correctsUpToTwoErrors(40));
    fc.assert(correctsUpToTwoErrors(48));
    fc.assert(correctsUpToTwoErrors(56));
    fc.assert(correctsUpToTwoErrors(64));
  });
});

const legacyVectors = test.macro<[string, string]>({
  exec: (t, base58Address, cashAddress) => {
    const decodedBase58Address = decodeBase58AddressFormat(base58Address);
    const decodedCashAddress = decodeCashAddress(cashAddress);
    if (typeof decodedCashAddress === 'string') {
      t.fail(decodedCashAddress);
      return;
    }
    if (typeof decodedBase58Address === 'string') {
      t.fail(decodedBase58Address);
      return;
    }
    t.deepEqual(decodedBase58Address.payload, decodedCashAddress.payload);
  },

  title: (_, base58Address) =>
    `CashAddress <-> Legacy Base58 Vectors: ${base58Address}`,
});

test(
  legacyVectors,
  // cspell: disable-next-line
  '1BpEi6DfDAUFd7GtittLSdBeYJvcoaVggu',
  'bitcoincash:qpm2qsznhks23z7629mms6s4cwef74vcwvy22gdx6a',
);

test(
  legacyVectors,
  // cspell: disable-next-line
  '1KXrWXciRDZUpQwQmuM1DbwsKDLYAYsVLR',
  'bitcoincash:qr95sy3j9xwd2ap32xkykttr4cvcu7as4y0qverfuy',
);

test(
  legacyVectors,
  // cspell: disable-next-line
  '16w1D5WRVKJuZUsSRzdLp9w3YGcgoxDXb',
  'bitcoincash:qqq3728yw0y47sqn6l2na30mcw6zm78dzqre909m2r',
);

test(
  legacyVectors,
  // cspell: disable-next-line
  '3CWFddi6m4ndiGyKqzYvsFYagqDLPVMTzC',
  'bitcoincash:ppm2qsznhks23z7629mms6s4cwef74vcwvn0h829pq',
);

test(
  legacyVectors,
  // cspell: disable-next-line
  '3LDsS579y7sruadqu11beEJoTjdFiFCdX4',
  'bitcoincash:pr95sy3j9xwd2ap32xkykttr4cvcu7as4yc93ky28e',
);

test(
  legacyVectors,
  // cspell: disable-next-line
  '31nwvkZwyPdgzjBJZXfDmSWsC4ZLKpYyUw',
  'bitcoincash:pqq3728yw0y47sqn6l2na30mcw6zm78dzq5ucqzc37',
);

test(
  legacyVectors,
  // cspell: disable-next-line
  '1Q2TWHE3GMdB6BZKafqwxXtWAWgFt5Jvm3',
  'bitcoincash:qr7fzmep8g7h7ymfxy74lgc0v950j3r2959lhtxxsl',
);
