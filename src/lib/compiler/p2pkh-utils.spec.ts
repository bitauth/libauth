import test from 'ava';

import {
  assertSuccess,
  decodeHdPrivateKey,
  decodePrivateKeyWif,
  deriveHdPath,
  deriveHdPublicNode,
  encodeHdPublicKey,
  hdPrivateKeyToP2pkhCashAddress,
  hdPrivateKeyToP2pkhLockingBytecode,
  hdPublicKeyToP2pkhCashAddress,
  hdPublicKeyToP2pkhLockingBytecode,
  hexToBin,
  P2pkhUtilityError,
  privateKeyToP2pkhCashAddress,
  privateKeyToP2pkhLockingBytecode,
  publicKeyToP2pkhCashAddress,
  publicKeyToP2pkhLockingBytecode,
} from '../lib.js';

const hdPrivateKey =
  'xprv9s21ZrQH143K3GJpoapnV8SFfukcVBSfeCficPSGfubmSFDxo1kuHnLisriDvSnRRuL2Qrg5ggqHKNVpxR86QEC8w35uxmGoggxtQTPvfUu';
const hdPublicKey =
  'xpub661MyMwAqRbcFkPHucMnrGNzDwb6teAX1RbKQmqtEF8kK3Z7LZ59qafCjB9eCRLiTVG3uxBxgKvRgbubRhqSKXnGGb1aoaqLrpMBDrVxga8';
const m0Wif = 'L3UYuE3vUJ9DXZ6fyiJL4b991cZGFpawcbF7YZiw94QcKKtQ4C8g';
const m0PublicKey = hexToBin(
  '0376bf533d4b15510fa9f4124b6e48616f07debcf2ef0cfb185cdc4a576450b475',
);
const m0PrivateKey = hexToBin(
  'baa89a8bdd61c5e22b9f10601d8791c9f8fc4b2fa6df9d68d336f0eb03b06eb6',
);
const m0LockingBytecode = hexToBin(
  '76a9145525def68633f742eb828a3eb27419ea9815f73588ac',
);
const { node } = assertSuccess(decodeHdPrivateKey(hdPrivateKey));
const publicNode = deriveHdPublicNode(node);
const M = encodeHdPublicKey({
  network: 'mainnet',
  node: publicNode,
}).hdPublicKey;
const M0 = deriveHdPath(publicNode, 'M/0');
const { publicKey } = M0;
const m0 = deriveHdPath(node, 'm/0');
const { privateKey } = m0;
const m0Mainnet = 'bitcoincash:qp2jthhkscelwshts29ravn5r84fs90hx5td9vqu73';
const m0Testnet = 'bchtest:qp2jthhkscelwshts29ravn5r84fs90hx50lptzted';
const m0Regtest = 'bchreg:qp2jthhkscelwshts29ravn5r84fs90hx54rh2pc6t';
const m0Tokens = 'bitcoincash:zp2jthhkscelwshts29ravn5r84fs90hx5v8kjw6pz';
const m0TestnetTokens = 'bchtest:zp2jthhkscelwshts29ravn5r84fs90hx5g4j4vdx7';

test('P2PKH utility test vectors', (t) => {
  t.deepEqual(
    assertSuccess(decodePrivateKeyWif(m0Wif)).privateKey,
    m0PrivateKey,
  );
  t.deepEqual(m0PrivateKey, privateKey);
  t.deepEqual(m0PublicKey, publicKey);
  t.deepEqual(hdPublicKey, M);
});

test('privateKeyToP2pkhLockingBytecode', (t) => {
  t.deepEqual(
    privateKeyToP2pkhLockingBytecode({ privateKey }),
    m0LockingBytecode,
  );
  const message = `${P2pkhUtilityError.privateKeyToP2pkhLockingBytecodeCompilation} [0, 0] Invalid compilation data detected: the private key provided for the "key" variable is not a valid Secp256k1 private key.`;
  t.throws(
    () => {
      privateKeyToP2pkhLockingBytecode({ privateKey: new Uint8Array(32) });
    },
    { message },
  );
  t.deepEqual(
    privateKeyToP2pkhLockingBytecode({
      privateKey: new Uint8Array(32),
      throwErrors: false,
    }),
    message,
  );
  const tooShort = Uint8Array.of(1, 2, 3);
  t.deepEqual(
    privateKeyToP2pkhLockingBytecode({
      privateKey: tooShort,
      throwErrors: false,
    }),
    message,
  );
  t.throws(
    () => {
      privateKeyToP2pkhLockingBytecode({ privateKey: tooShort });
    },
    { message },
  );
  const exceedsMax = hexToBin(
    'fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141',
  );
  t.deepEqual(
    privateKeyToP2pkhLockingBytecode({
      privateKey: exceedsMax,
      throwErrors: false,
    }),
    message,
  );
  t.throws(
    () => {
      privateKeyToP2pkhLockingBytecode({ privateKey: exceedsMax });
    },
    { message },
  );
});

test('publicKeyToP2pkhLockingBytecode', (t) => {
  t.deepEqual(
    publicKeyToP2pkhLockingBytecode({ publicKey }),
    m0LockingBytecode,
  );
  const message = `${P2pkhUtilityError.publicKeyToP2pkhLockingBytecodeCompilation} [0, 0] Invalid compilation data detected: the public key provided for "key.public_key" is not a valid Secp256k1 public key.`;
  t.deepEqual(
    publicKeyToP2pkhLockingBytecode({
      publicKey: Uint8Array.of(1),
      throwErrors: false,
    }),
    message,
  );
  t.deepEqual(
    publicKeyToP2pkhLockingBytecode({
      publicKey: new Uint8Array(33),
      throwErrors: false,
    }),
    message,
  );
  t.throws(
    () => {
      publicKeyToP2pkhLockingBytecode({ publicKey: new Uint8Array(33) });
    },
    { message },
  );
  t.deepEqual(
    publicKeyToP2pkhLockingBytecode({
      publicKey: hexToBin(
        '020000000000000000000000000000000000000000000000000000000000000007',
      ),
      throwErrors: false,
    }),
    message,
  );
  t.throws(
    () => {
      publicKeyToP2pkhLockingBytecode({
        publicKey: hexToBin(
          '020000000000000000000000000000000000000000000000000000000000000007',
        ),
      });
    },
    { message },
  );
  t.throws(
    () => {
      publicKeyToP2pkhLockingBytecode({
        publicKey: hexToBin(
          '020000000000000000000000000000000000000000000000000000000000000007',
        ),
        throwErrors: true,
      });
    },
    { message },
  );
});

test('hdPrivateKeyToP2pkhLockingBytecode', (t) => {
  t.deepEqual(
    hdPrivateKeyToP2pkhLockingBytecode({
      addressIndex: 0,
      hdPrivateKey,
    }),
    m0LockingBytecode,
  );
  const message = `${P2pkhUtilityError.hdPrivateKeyToP2pkhLockingBytecodeCompilation} [0, 0] Invalid compilation data detected: the HD private key provided for the "owner" entity is not a valid HD private key. HD key decoding error: length is incorrect (must encode 82 bytes). Length: 0.`;
  t.deepEqual(
    hdPrivateKeyToP2pkhLockingBytecode({
      addressIndex: 0,
      hdPrivateKey: '',
      throwErrors: false,
    }),
    message,
  );
  t.deepEqual(
    hdPrivateKeyToP2pkhLockingBytecode({
      addressIndex: 0,
      hdPrivateKey:
        'xprv9s2SPatNQ9Vc6GTbVMFPFo7jsaZySyzk7L8n2uqKXJen3KUmvQNTuLh3fhZMBoG3G4ZW1N2kZuHEPY53qmbZzCHshoQnNf4GvELZfqTUrcv',
      throwErrors: false,
    }),
    `${P2pkhUtilityError.hdPrivateKeyToP2pkhLockingBytecodeCompilation} [0, 0] Invalid compilation data detected: the HD private key provided for the "owner" entity is not a valid HD private key. HD key decoding error: key encodes a depth of zero with a non-zero parent fingerprint. Parent fingerprint: 1,1,1,1.`,
  );
  t.deepEqual(
    hdPrivateKeyToP2pkhLockingBytecode({
      addressIndex: -1,
      hdPrivateKey,
      throwErrors: false,
    }),
    `${P2pkhUtilityError.hdPrivateKeyToP2pkhLockingBytecodeCompilation} [2, 16] Could not generate "key.public_key" - the path "-1" could not be derived for entity "owner": HD node derivation error: invalid relative derivation path; path must contain only positive child index numbers, separated by forward slashes ("/"), with zero or one apostrophe ("'") after each child index number. Invalid path: "-1".`,
  );
  t.deepEqual(
    hdPrivateKeyToP2pkhLockingBytecode({
      addressIndex: 1.1,
      hdPrivateKey,
      throwErrors: false,
    }),
    `${P2pkhUtilityError.hdPrivateKeyToP2pkhLockingBytecodeCompilation} [2, 16] Could not generate "key.public_key" - the path "1.1" could not be derived for entity "owner": HD node derivation error: invalid relative derivation path; path must contain only positive child index numbers, separated by forward slashes ("/"), with zero or one apostrophe ("'") after each child index number. Invalid path: "1.1".`,
  );
  t.throws(
    () => {
      hdPrivateKeyToP2pkhLockingBytecode({ addressIndex: 0, hdPrivateKey: '' });
    },
    { message },
  );
  t.throws(
    () => {
      hdPrivateKeyToP2pkhLockingBytecode({
        addressIndex: 0,
        hdPrivateKey: '',
        throwErrors: true,
      });
    },
    { message },
  );
});

test('hdPublicKeyToP2pkhLockingBytecode', (t) => {
  t.deepEqual(
    hdPublicKeyToP2pkhLockingBytecode({
      addressIndex: 0,
      hdPublicKey,
    }),
    m0LockingBytecode,
  );
  t.deepEqual(
    hdPublicKeyToP2pkhLockingBytecode({
      addressIndex: 0,
      hdPublicKey,
      publicDerivationPath: 'i',
    }),
    m0LockingBytecode,
  );
  const message = `${P2pkhUtilityError.hdPublicKeyToP2pkhLockingBytecodeCompilation} [0, 0] Invalid compilation data detected: the HD public key provided for the "owner" entity is not a valid HD public key. HD key decoding error: length is incorrect (must encode 82 bytes). Length: 0.`;
  t.deepEqual(
    hdPublicKeyToP2pkhLockingBytecode({
      addressIndex: 0,
      hdPublicKey: '',
      throwErrors: false,
    }),
    message,
  );
  t.deepEqual(
    hdPublicKeyToP2pkhLockingBytecode({
      addressIndex: 0,
      hdPublicKey:
        'xpub661no6RGEX3uJkY4bNnPcw4URcQTrSibUZ4NqJEw5eBkv7ovTwgiT91XX27VbEXGENhYRCf7hyEbWrR3FewATdCEebj6znwMfQkhRYHRLpJ',
      throwErrors: false,
    }),
    `${P2pkhUtilityError.hdPublicKeyToP2pkhLockingBytecodeCompilation} [0, 0] Invalid compilation data detected: the HD public key provided for the "owner" entity is not a valid HD public key. HD key decoding error: key encodes a depth of zero with a non-zero parent fingerprint. Parent fingerprint: 1,1,1,1.`,
  );
  t.deepEqual(
    hdPublicKeyToP2pkhLockingBytecode({
      addressIndex: 0,
      hdPublicKey:
        'xpub661MyMwAqRbcEYS8w7XLSVeEsBXy79zSzH1J8vCdxAZningWLdN3zgtU6Q5JXayek4PRsn35jii4veMimro1xefsM58PgBMrvdYre8QyULY',
      throwErrors: false,
    }),
    `${P2pkhUtilityError.hdPublicKeyToP2pkhLockingBytecodeCompilation} [0, 0] Invalid compilation data detected: the HD public key provided for the "owner" entity is not a valid HD public key. HD key decoding error: the public key for this HD public node is not a valid Secp256k1 public key. Invalid public key: 020000000000000000000000000000000000000000000000000000000000000007.`,
  );
  t.deepEqual(
    hdPublicKeyToP2pkhLockingBytecode({
      addressIndex: -1,
      hdPublicKey,
      throwErrors: false,
    }),
    `${P2pkhUtilityError.hdPublicKeyToP2pkhLockingBytecodeCompilation} [2, 16] Could not generate "key.public_key" - the path "-1" could not be derived for entity "owner": HD node derivation error: invalid relative derivation path; path must contain only positive child index numbers, separated by forward slashes ("/"), with zero or one apostrophe ("'") after each child index number. Invalid path: "-1".`,
  );
  t.deepEqual(
    hdPublicKeyToP2pkhLockingBytecode({
      addressIndex: 1.1,
      hdPublicKey,
      throwErrors: false,
    }),
    `${P2pkhUtilityError.hdPublicKeyToP2pkhLockingBytecodeCompilation} [2, 16] Could not generate "key.public_key" - the path "1.1" could not be derived for entity "owner": HD node derivation error: invalid relative derivation path; path must contain only positive child index numbers, separated by forward slashes ("/"), with zero or one apostrophe ("'") after each child index number. Invalid path: "1.1".`,
  );
  t.throws(
    () => {
      hdPublicKeyToP2pkhLockingBytecode({ addressIndex: 0, hdPublicKey: '' });
    },
    { message },
  );
  t.throws(
    () => {
      hdPublicKeyToP2pkhLockingBytecode({
        addressIndex: 0,
        hdPublicKey: '',
        throwErrors: true,
      });
    },
    { message },
  );
});

test('privateKeyToP2pkhCashAddress', (t) => {
  t.deepEqual(privateKeyToP2pkhCashAddress({ privateKey }).address, m0Mainnet);
  t.deepEqual(
    privateKeyToP2pkhCashAddress({ prefix: 'bchtest', privateKey }).address,
    m0Testnet,
  );
  t.deepEqual(
    privateKeyToP2pkhCashAddress({ prefix: 'bchreg', privateKey }).address,
    m0Regtest,
  );
  t.deepEqual(
    privateKeyToP2pkhCashAddress({
      privateKey,
      tokenSupport: true,
    }).address,
    m0Tokens,
  );
  t.deepEqual(
    privateKeyToP2pkhCashAddress({
      prefix: 'bchtest',
      privateKey,
      tokenSupport: true,
    }).address,
    m0TestnetTokens,
  );
  const message = `${P2pkhUtilityError.privateKeyToP2pkhLockingBytecodeCompilation} [0, 0] Invalid compilation data detected: the private key provided for the "key" variable is not a valid Secp256k1 private key.`;
  t.deepEqual(
    privateKeyToP2pkhCashAddress({
      privateKey: hexToBin(''),
      throwErrors: false,
    }),
    message,
  );
  t.throws(
    () => {
      privateKeyToP2pkhCashAddress({ privateKey: hexToBin('') });
    },
    { message },
  );
  t.throws(
    () => {
      privateKeyToP2pkhCashAddress({
        privateKey: hexToBin(''),
        throwErrors: true,
      });
    },
    { message },
  );
});

test('publicKeyToP2pkhCashAddress', (t) => {
  t.deepEqual(publicKeyToP2pkhCashAddress({ publicKey }).address, m0Mainnet);
  t.deepEqual(
    publicKeyToP2pkhCashAddress({ prefix: 'bchtest', publicKey }).address,
    m0Testnet,
  );
  t.deepEqual(
    publicKeyToP2pkhCashAddress({ prefix: 'bchreg', publicKey }).address,
    m0Regtest,
  );
  t.deepEqual(
    publicKeyToP2pkhCashAddress({
      publicKey,
      tokenSupport: true,
    }).address,
    m0Tokens,
  );
  t.deepEqual(
    publicKeyToP2pkhCashAddress({
      prefix: 'bchtest',
      publicKey,
      tokenSupport: true,
    }).address,
    m0TestnetTokens,
  );
  const message = `${P2pkhUtilityError.publicKeyToP2pkhLockingBytecodeCompilation} [0, 0] Invalid compilation data detected: the public key provided for "key.public_key" is not a valid Secp256k1 public key.`;
  t.deepEqual(
    publicKeyToP2pkhCashAddress({
      publicKey: hexToBin(''),
      throwErrors: false,
    }),
    message,
  );
  t.throws(
    () => {
      publicKeyToP2pkhCashAddress({ publicKey: hexToBin('') });
    },
    { message },
  );
  t.throws(
    () => {
      publicKeyToP2pkhCashAddress({
        publicKey: hexToBin(''),
        throwErrors: true,
      });
    },
    { message },
  );
});

test('hdPrivateKeyToP2pkhCashAddress', (t) => {
  t.deepEqual(
    hdPrivateKeyToP2pkhCashAddress({ addressIndex: 0, hdPrivateKey }).address,
    m0Mainnet,
  );
  t.deepEqual(
    hdPrivateKeyToP2pkhCashAddress({
      addressIndex: 0,
      hdPrivateKey,
      prefix: 'bchtest',
    }).address,
    m0Testnet,
  );
  t.deepEqual(
    hdPrivateKeyToP2pkhCashAddress({
      addressIndex: 0,
      hdPrivateKey,
      prefix: 'bchreg',
    }).address,
    m0Regtest,
  );
  t.deepEqual(
    hdPrivateKeyToP2pkhCashAddress({
      addressIndex: 0,
      hdPrivateKey,
      tokenSupport: true,
    }).address,
    m0Tokens,
  );
  t.deepEqual(
    hdPrivateKeyToP2pkhCashAddress({
      addressIndex: 0,
      hdPrivateKey,
      prefix: 'bchtest',
      tokenSupport: true,
    }).address,
    m0TestnetTokens,
  );
  const message = `${P2pkhUtilityError.hdPrivateKeyToP2pkhLockingBytecodeCompilation} [0, 0] Invalid compilation data detected: the HD private key provided for the "owner" entity is not a valid HD private key. HD key decoding error: length is incorrect (must encode 82 bytes). Length: 0.`;
  t.deepEqual(
    hdPrivateKeyToP2pkhCashAddress({
      addressIndex: 0,
      hdPrivateKey: '',
      throwErrors: false,
    }),
    message,
  );
  t.throws(
    () => {
      hdPrivateKeyToP2pkhCashAddress({ addressIndex: 0, hdPrivateKey: '' });
    },
    { message },
  );
  t.throws(
    () => {
      hdPrivateKeyToP2pkhCashAddress({
        addressIndex: 0,
        hdPrivateKey: '',
        throwErrors: true,
      });
    },
    { message },
  );
  t.deepEqual(
    hdPrivateKeyToP2pkhCashAddress({
      addressIndex: 2147483648,
      hdPrivateKey: hdPrivateKey.slice(1),
      throwErrors: false,
    }),
    'P2PKH utility error: could not derive P2PKH locking bytecode from the provided HD private key. [0, 0] Invalid compilation data detected: the HD private key provided for the "owner" entity is not a valid HD private key. HD key decoding error: length is incorrect (must encode 82 bytes). Length: 81.',
  );
  t.deepEqual(
    hdPrivateKeyToP2pkhCashAddress({
      addressIndex: 4294967296,
      hdPrivateKey,
      throwErrors: false,
    }),
    'P2PKH utility error: could not derive P2PKH locking bytecode from the provided HD private key. [2, 16] Could not generate "key.public_key" - the path "4294967296" could not be derived for entity "owner": HD node derivation error: child index exceeds maximum (4294967295). Child index: 4294967296.',
  );
});

test('hdPublicKeyToP2pkhCashAddress', (t) => {
  t.deepEqual(
    hdPublicKeyToP2pkhCashAddress({ addressIndex: 0, hdPublicKey }).address,
    m0Mainnet,
  );
  t.deepEqual(
    hdPublicKeyToP2pkhCashAddress({
      addressIndex: 0,
      hdPublicKey,
      prefix: 'bchtest',
    }).address,
    m0Testnet,
  );
  t.deepEqual(
    hdPublicKeyToP2pkhCashAddress({
      addressIndex: 0,
      hdPublicKey,
      prefix: 'bchreg',
    }).address,
    m0Regtest,
  );
  t.deepEqual(
    hdPublicKeyToP2pkhCashAddress({
      addressIndex: 0,
      hdPublicKey,
      tokenSupport: true,
    }).address,
    m0Tokens,
  );
  t.deepEqual(
    hdPublicKeyToP2pkhCashAddress({
      addressIndex: 0,
      hdPublicKey,
      prefix: 'bchtest',
      tokenSupport: true,
    }).address,
    m0TestnetTokens,
  );
  const message = `${P2pkhUtilityError.hdPublicKeyToP2pkhLockingBytecodeCompilation} [0, 0] Invalid compilation data detected: the HD public key provided for the "owner" entity is not a valid HD public key. HD key decoding error: length is incorrect (must encode 82 bytes). Length: 0.`;
  t.deepEqual(
    hdPublicKeyToP2pkhCashAddress({
      addressIndex: 0,
      hdPublicKey: '',
      throwErrors: false,
    }),
    message,
  );
  t.throws(
    () => {
      hdPublicKeyToP2pkhCashAddress({ addressIndex: 0, hdPublicKey: '' });
    },
    { message },
  );
  t.throws(
    () => {
      hdPublicKeyToP2pkhCashAddress({
        addressIndex: 0,
        hdPublicKey: '',
        throwErrors: true,
      });
    },
    { message },
  );
  t.deepEqual(
    hdPublicKeyToP2pkhCashAddress({
      addressIndex: 2147483648,
      hdPublicKey: hdPublicKey.slice(1),
      throwErrors: false,
    }),
    'P2PKH utility error: could not derive P2PKH locking bytecode from the provided HD public key. [0, 0] Invalid compilation data detected: the HD public key provided for the "owner" entity is not a valid HD public key. HD key decoding error: length is incorrect (must encode 82 bytes). Length: 81.',
  );
  t.deepEqual(
    hdPublicKeyToP2pkhCashAddress({
      addressIndex: 2147483648,
      hdPublicKey,
      throwErrors: false,
    }),
    'P2PKH utility error: could not derive P2PKH locking bytecode from the provided HD public key. [2, 16] Could not generate "key.public_key" - the path "2147483648" could not be derived for entity "owner": HD node derivation error: derivation for hardened child indexes (indexes greater than or equal to 2147483648) requires an HD private node. Requested index: 2147483648.',
  );
});
