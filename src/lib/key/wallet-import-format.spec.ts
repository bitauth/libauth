import test from 'ava';

import type { WalletImportFormatType } from '../lib.js';
import {
  Base58AddressError,
  decodePrivateKeyWif,
  encodePrivateKeyWif,
  hexToBin,
  sha256 as internalSha256,
} from '../lib.js';

test('decodePrivateKeyWif: pass through errors', (t) => {
  t.deepEqual(
    decodePrivateKeyWif('not a key'),
    Base58AddressError.unknownCharacter,
  );
});

const wifVectors = test.macro<[WalletImportFormatType, string, string]>({
  // eslint-disable-next-line @typescript-eslint/max-params
  exec: (t, type, wif, key) => {
    t.deepEqual(encodePrivateKeyWif(hexToBin(key), type), wif);
    t.deepEqual(decodePrivateKeyWif(wif), {
      privateKey: hexToBin(key),
      type,
    });
    t.deepEqual(encodePrivateKeyWif(hexToBin(key), type, internalSha256), wif);
    t.deepEqual(decodePrivateKeyWif(wif, internalSha256), {
      privateKey: hexToBin(key),
      type,
    });
  },
  title: (_, type, base58) =>
    `encodePrivateKeyWif <-> decodePrivateKeyWif ${type} - ${base58.slice(
      0,

      6,
    )}...`,
});

test(
  wifVectors,
  'mainnet',
  'L1RrrnXkcKut5DEMwtDthjwRcTTwED36thyL1DebVrKuwvohjMNi',
  '7d998b45c219a1e38e99e7cbd312ef67f77a455a9b50c730c27f02c6f730dfb4',
);

test(
  wifVectors,
  'mainnet',
  'KwV9KAfwbwt51veZWNscRTeZs9CKpojyu1MsPnaKTF5kz69H1UN2',
  '07f0803fc5399e773555ab1e8939907e9badacc17ca129e67a2f5f2ff84351dd',
);

test(
  wifVectors,
  'testnet',
  'cTpB4YiyKiBcPxnefsDpbnDxFDffjqJob8wGCEDXxgQ7zQoMXJdH',
  'b9f4892c9e8282028fea1d2667c4dc5213564d41fc5783896a0d843fc15089f3',
);

test(
  wifVectors,
  'mainnetUncompressed',
  '5Kd3NBUAdUnhyzenEwVLy9pBKxSwXvE9FMPyR4UKZvpe6E3AgLr',
  'eddbdc1168f1daeadbd3e44c1e3f8f5a284c2029f78ad26af98583a499de5b19',
);

test(
  wifVectors,
  'testnetUncompressed',
  '9213qJab2HNEpMpYNBa7wHGFKKbkDn24jpANDs2huN3yi4J11ko',
  '36cb93b9ab1bdabf7fb9f2c04f1b9cc879933530ae7842398eef5a63a56800c2',
);
