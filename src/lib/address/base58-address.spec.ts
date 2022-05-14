import test from 'ava';
import { fc, testProp } from 'ava-fast-check';

import {
  Base58AddressError,
  Base58AddressFormatVersion,
  decodeBase58Address,
  decodeBase58AddressFormat,
  decodePrivateKeyWif,
  encodeBase58Address,
  encodeBase58AddressFormat,
  hexToBin,
  lockingBytecodeToBase58Address,
  sha256,
} from '../lib.js';

// eslint-disable-next-line import/no-restricted-paths, import/no-internal-modules
import keyIoInvalid from './fixtures/key_io_invalid.json' assert { type: 'json' };
// eslint-disable-next-line import/no-restricted-paths, import/no-internal-modules
import keyIoValid from './fixtures/key_io_valid.json' assert { type: 'json' };

const invalidVectors = Object.values(keyIoInvalid).filter(
  (item) => Array.isArray(item) && item.every((x) => typeof x === 'string')
);

const validVectors = Object.values(keyIoValid).filter((item) =>
  item.every((x) => !Array.isArray(x))
);

test('encodeBase58AddressFormat', (t) => {
  const payload = hexToBin('65a16059864a2fdbc7c99a4723a8395bc6f188eb');
  t.deepEqual(
    encodeBase58AddressFormat(Base58AddressFormatVersion.p2pkh, payload),
    // cspell: disable-next-line
    '1AGNa15ZQXAZUgFiqJ2i7Z2DPU2J6hW62i'
  );
  t.deepEqual(
    encodeBase58AddressFormat(
      Base58AddressFormatVersion.p2pkh,
      payload,
      sha256
    ),
    // cspell: disable-next-line
    '1AGNa15ZQXAZUgFiqJ2i7Z2DPU2J6hW62i'
  );
});

test('encodeBase58Address', (t) => {
  const payload = hexToBin('76a04053bda0a88bda5177b86a15c3b29f559873');
  t.deepEqual(
    encodeBase58Address('p2pkh', payload, sha256),
    // cspell: disable-next-line
    '1BpEi6DfDAUFd7GtittLSdBeYJvcoaVggu'
  );
  t.deepEqual(
    encodeBase58Address('p2pkhTestnet', payload, sha256),
    // cspell: disable-next-line
    'mrLC19Je2BuWQDkWSTriGYPyQJXKkkBmCx'
  );
  t.deepEqual(
    encodeBase58Address('p2pkhCopayBCH', payload),
    // cspell: disable-next-line
    'CTH8H8Zj6DSnXFBKQeDG28ogAS92iS16Bp'
  );
  t.deepEqual(
    encodeBase58Address('p2sh20', payload, sha256),
    // cspell: disable-next-line
    '3CWFddi6m4ndiGyKqzYvsFYagqDLPVMTzC'
  );
  t.deepEqual(
    encodeBase58Address('p2sh20Testnet', payload),
    // cspell: disable-next-line
    '2N44ThNe8NXHyv4bsX8AoVCXquBRW94Ls7W'
  );
  t.deepEqual(
    encodeBase58Address('p2sh20CopayBCH', payload, sha256),
    // cspell: disable-next-line
    'HHLN6S9BcP1JLSrMhgD5qe57iVEMFMLCBT'
  );
});

test('decodeBase58AddressFormat', (t) => {
  const payload = hexToBin('65a16059864a2fdbc7c99a4723a8395bc6f188eb');
  t.deepEqual(
    // cspell: disable-next-line
    decodeBase58AddressFormat('1AGNa15ZQXAZUgFiqJ2i7Z2DPU2J6hW62i'),
    { payload, version: Base58AddressFormatVersion.p2pkh }
  );
  t.deepEqual(
    // cspell: disable-next-line
    decodeBase58AddressFormat('1AGNa15ZQXAZUgFiqJ2i7Z2DPU2J6hW62i', sha256),
    { payload, version: Base58AddressFormatVersion.p2pkh }
  );
});

test('decodeBase58Address', (t) => {
  const payload = hexToBin('65a16059864a2fdbc7c99a4723a8395bc6f188eb');
  t.deepEqual(
    // cspell: disable-next-line
    decodeBase58Address('1AGNa15ZQXAZUgFiqJ2i7Z2DPU2J6hW62i'),
    { payload, version: Base58AddressFormatVersion.p2pkh }
  );
  t.deepEqual(
    // cspell: disable-next-line
    decodeBase58Address('1AGNa15ZQXAZUgFiqJ2i7Z2DPU2J6hW62i', sha256),
    { payload, version: Base58AddressFormatVersion.p2pkh }
  );
});

const maxUint8Number = 255;
const fcUint8Array = (minLength: number, maxLength: number) =>
  fc
    .array(fc.integer(0, maxUint8Number), minLength, maxLength)
    .map((a) => Uint8Array.from(a));
const maxBinLength = 100;

testProp(
  '[fast-check] encodeBase58Address <-> decodeBase58Address',
  [fc.integer({ max: maxUint8Number, min: 0 }), fcUint8Array(0, maxBinLength)],
  (t, version: number, payload: Uint8Array) => {
    const address = encodeBase58AddressFormat(version, payload);
    const decoded = decodeBase58AddressFormat(address);
    if (typeof decoded === 'string') {
      t.fail(decoded);
      return;
    }
    t.deepEqual(decoded, {
      payload,
      version,
    });
  }
);

test('decodeBase58AddressFormat: errors', (t) => {
  t.deepEqual(
    // cspell: disable-next-line
    decodeBase58AddressFormat('1AGNa15ZQXAZUgFiqJ2i7Z2DPU2J6hW62a'),
    Base58AddressError.invalidChecksum
  );
  t.deepEqual(decodeBase58AddressFormat('1234'), Base58AddressError.tooShort);
  t.deepEqual(
    // cspell: disable-next-line
    decodeBase58AddressFormat('1AGNa15ZQXAZUgFiqJ2i7Z2DPU2J6hW62I'),
    Base58AddressError.unknownCharacter
  );
});
test('decodeBase58Address: errors', (t) => {
  t.deepEqual(
    // cspell: disable-next-line
    decodeBase58Address('6PfDNQxJdsBx7K4r9kMrRBZSa2NZKVNUZn'),
    Base58AddressError.unknownAddressVersion
  );
  t.deepEqual(
    // cspell: disable-next-line
    decodeBase58Address('2DqXtydYdu9pq6uXcy3Tbw3pUscCiPC6F'),
    // Base58AddressError.incorrectLength
    Base58AddressError.unknownAddressVersion
  );
});

test('Base58Address Invalid Vectors', (t) => {
  invalidVectors.forEach(([invalid]) => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const result = decodeBase58Address(invalid!);
    const hasError = typeof result === 'string';
    if (!hasError) {
      /*
       * cspell: disable-next-line
       * HPhFUhUAh8ZQQisH8QQWafAxtQYju3SFTX
       */
      t.deepEqual(result, {
        payload: hexToBin('bc6437e3089918c9cb7e3d3ddd7ca83969b1e0bc'),
        version: Base58AddressFormatVersion.p2sh20CopayBCH,
      });
      return;
    }
    t.true(hasError);
  });
});

test('Base58Address Valid Vectors (from C++ implementation – includes WIF vectors)', (t) => {
  // eslint-disable-next-line complexity
  validVectors.forEach((vectors) => {
    const [base58Address, data, meta] = vectors as [
      string,
      string,
      {
        isCompressed?: boolean;
        isPrivkey: boolean;
        chain: 'main' | 'regtest' | 'test';
      }
    ];

    const testnet = meta.chain !== 'main';
    // eslint-disable-next-line functional/no-conditional-statement
    if (meta.isPrivkey) {
      const wifKey = base58Address;
      const compressed = Boolean(meta.isCompressed);
      const privateKey = hexToBin(data);
      const type = testnet
        ? compressed
          ? 'testnet'
          : 'testnetUncompressed'
        : compressed
        ? 'mainnet'
        : 'mainnetUncompressed';
      t.deepEqual(decodePrivateKeyWif(wifKey), { privateKey, type });

      // eslint-disable-next-line functional/no-conditional-statement
    } else {
      const lockingBytecode = data;
      t.deepEqual(
        lockingBytecodeToBase58Address(
          hexToBin(lockingBytecode),
          testnet ? 'testnet' : 'mainnet',
          sha256
        ),
        base58Address
      );
    }
  });
});
