/* eslint-disable max-lines */
import test from 'ava';

import type {
  AssertTypesEqual,
  DecodedHdKey,
  HdKeyNetwork,
  HdPrivateNode,
  HdPrivateNodeInvalid,
  HdPrivateNodeKnownParent,
  HdPrivateNodeValid,
  HdPublicNode,
  HdPublicNodeInvalid,
  HdPublicNodeKnownParent,
  HdPublicNodeValid,
} from '../lib.js';
import {
  assertSuccess,
  BaseConversionError,
  crackHdPrivateNodeFromHdPublicNodeAndChildPrivateNode,
  decodeHdKey,
  decodeHdKeyUnchecked,
  decodeHdPrivateKey,
  decodeHdPublicKey,
  deriveHdPath,
  deriveHdPathRelative,
  deriveHdPrivateNodeChild,
  deriveHdPrivateNodeFromSeed,
  deriveHdPrivateNodeIdentifier,
  deriveHdPublicKey,
  deriveHdPublicNode,
  deriveHdPublicNodeChild,
  deriveHdPublicNodeIdentifier,
  encodeHdPrivateKey,
  encodeHdPublicKey,
  HdKeyDecodingError,
  HdKeyEncodingError,
  HdKeyVersion,
  hdKeyVersionIsPrivateKey,
  hdKeyVersionIsPublicKey,
  HdNodeCrackingError,
  HdNodeDerivationError,
  hdPrivateKeyToIdentifier,
  hdPublicKeyToIdentifier,
  hexToBin,
  ripemd160,
  secp256k1,
  Secp256k1Error,
  sha256,
  sha512,
  stringify,
  stringifyTestVector,
  unknownValue,
  validateSecp256k1PrivateKey,
} from '../lib.js';

import { fc, testProp } from '@fast-check/ava';
import bitcoreLibCash from 'bitcore-lib-cash';

const seed = Uint8Array.from([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

const xprv =
  'xprv9s21ZrQH143K2JbpEjGU94NcdKSASB7LuXvJCTsxuENcGN1nVG7QjMnBZ6zZNcJaiJogsRaLaYFFjs48qt4Fg7y1GnmrchQt1zFNu6QVnta';
const tprv =
  'tprv8ZgxMBicQKsPd7qLuJ7yJhzbwSrNfh9MF5qR4tJRPCs63xksUdTAF79dUHADNygu5kLTsXC6jtq4Cibsy6QCVBEboRzAH48vw5zoLkJTuso';
const xpub =
  'xpub661MyMwAqRbcEngHLkoUWCKMBMGeqdqCGkqtzrHaTZub9ALw2oRfHA6fQP5n5X9VHStaNTBYomkSb8BFhUGavwD3RG1qvMkEKceTavTp2Tm';
const tpub =
  'tpubD6NzVbkrYhZ4Was8nwnZi7eiWUNJq2LFpPSCMQLioUfUtT1e72GkRbmVeRAZc26j5MRUz2hRLsaVHJfs6L7ppNfLUrm9btQTuaEsLrT7D87';

const maximumDepth = 255;
const maximumChildIndex = 0xffffffff;
const fingerprintLength = 4;
const chainCodeLength = 32;
const privateKeyLength = 32;
const publicKeyLength = 33;
const hardenedIndexOffset = 0x80000000;
const maximumNonHardenedIndex = hardenedIndexOffset - 1;

const crypto = { ripemd160, secp256k1, sha256, sha512 };

/* eslint-disable @typescript-eslint/no-duplicate-type-constituents */
type TypeTests =
  | AssertTypesEqual<HdKeyNetwork, 'mainnet' | 'testnet'>
  | AssertTypesEqual<HdPrivateNode, HdPrivateNodeInvalid | HdPrivateNodeValid>
  | AssertTypesEqual<HdPublicNode, HdPublicNodeInvalid | HdPublicNodeValid>;
/* eslint-enable @typescript-eslint/no-duplicate-type-constituents */

test('Libauth exposes expected types', (t) => {
  const testTypes: TypeTests = true;
  t.true(testTypes);
});

test('[crypto] deriveHdPrivateNodeFromSeed', (t) => {
  const valid = {
    chainCode: hexToBin(
      '18aab7e9ef169f3029d93651d0c85303cbcc2ac559ccd04c324a2e678ef26dc9',
    ),
    childIndex: 0,
    depth: 0,
    parentFingerprint: hexToBin('00000000'),
    privateKey: hexToBin(
      '330fd355e141910d33bbe84c369b87a209dd18b81095912be766b2b5a9d72bc4',
    ),
  } as HdPrivateNodeValid;
  const invalid = {
    chainCode: hexToBin(
      '18aab7e9ef169f3029d93651d0c85303cbcc2ac559ccd04c324a2e678ef26dc9',
    ),
    childIndex: 0,
    depth: 0,
    invalidMaterial: hexToBin(
      '330fd355e141910d33bbe84c369b87a209dd18b81095912be766b2b5a9d72bc4',
    ),
    parentFingerprint: hexToBin('00000000'),
  } as HdPrivateNodeInvalid;
  const either = deriveHdPrivateNodeFromSeed(seed);
  const customCrypto = deriveHdPrivateNodeFromSeed(seed, { crypto });
  const validNode = deriveHdPrivateNodeFromSeed(seed, { assumeValidity: true });
  const invalidNode = deriveHdPrivateNodeFromSeed(seed, {
    assumeValidity: false,
    throwErrors: false,
  });
  t.deepEqual(either, valid);
  t.deepEqual(customCrypto, valid);
  t.deepEqual(validNode, valid);
  t.deepEqual(invalidNode, invalid);
  t.throws(() => {
    deriveHdPrivateNodeFromSeed(seed, { assumeValidity: false });
  });
});

test('[crypto] deriveHdPrivateNodeIdentifier', (t) => {
  const { node } = assertSuccess(decodeHdPrivateKey(xprv));
  t.deepEqual(
    deriveHdPrivateNodeIdentifier(node),
    hexToBin('15c918d389673c6cd0660050f268a843361e1111'),
  );
  t.deepEqual(
    deriveHdPrivateNodeIdentifier(node, { crypto }),
    hexToBin('15c918d389673c6cd0660050f268a843361e1111'),
  );
  t.deepEqual(
    deriveHdPrivateNodeIdentifier({ ...node, privateKey: Uint8Array.of() }),
    Secp256k1Error.derivePublicKeyFromInvalidPrivateKey,
  );
});

test('[crypto] deriveHdPublicNodeIdentifier', (t) => {
  const { node } = assertSuccess(decodeHdPublicKey(xpub));
  t.deepEqual(
    deriveHdPublicNodeIdentifier(node),
    hexToBin('15c918d389673c6cd0660050f268a843361e1111'),
  );
  t.deepEqual(
    deriveHdPublicNodeIdentifier(node, { crypto }),
    hexToBin('15c918d389673c6cd0660050f268a843361e1111'),
  );
});

test('[crypto] hdPrivateKeyToIdentifier', (t) => {
  t.deepEqual(
    hdPrivateKeyToIdentifier(xprv),
    hexToBin('15c918d389673c6cd0660050f268a843361e1111'),
  );
  t.deepEqual(
    hdPrivateKeyToIdentifier(xprv, { crypto }),
    hexToBin('15c918d389673c6cd0660050f268a843361e1111'),
  );
  t.deepEqual(
    hdPrivateKeyToIdentifier(xprv.slice(1)),
    `${HdKeyDecodingError.incorrectLength} Length: 81.`,
  );
});

test('[crypto] hdPublicKeyToIdentifier', (t) => {
  t.deepEqual(
    hdPublicKeyToIdentifier(xpub),
    hexToBin('15c918d389673c6cd0660050f268a843361e1111'),
  );
  t.deepEqual(
    hdPublicKeyToIdentifier(xpub, { crypto }),
    hexToBin('15c918d389673c6cd0660050f268a843361e1111'),
  );
  t.deepEqual(
    hdPublicKeyToIdentifier(xpub.slice(1), { crypto }),
    `${HdKeyDecodingError.incorrectLength} Length: 81.`,
  );
});

test('hdKeyVersionIsPrivateKey', (t) => {
  t.true(hdKeyVersionIsPrivateKey(HdKeyVersion.mainnetPrivateKey));
  t.false(hdKeyVersionIsPrivateKey(HdKeyVersion.mainnetPublicKey));
  t.true(hdKeyVersionIsPrivateKey(HdKeyVersion.testnetPrivateKey));
  t.false(hdKeyVersionIsPrivateKey(HdKeyVersion.testnetPublicKey));
});

test('hdKeyVersionIsPublicKey', (t) => {
  t.false(hdKeyVersionIsPublicKey(HdKeyVersion.mainnetPrivateKey));
  t.true(hdKeyVersionIsPublicKey(HdKeyVersion.mainnetPublicKey));
  t.false(hdKeyVersionIsPublicKey(HdKeyVersion.testnetPrivateKey));
  t.true(hdKeyVersionIsPublicKey(HdKeyVersion.testnetPublicKey));
});

test('[crypto] decodeHdKey', (t) => {
  t.deepEqual(decodeHdKey(xprv), {
    network: 'mainnet',
    node: {
      chainCode: hexToBin(
        '18aab7e9ef169f3029d93651d0c85303cbcc2ac559ccd04c324a2e678ef26dc9',
      ),
      childIndex: 0,
      depth: 0,
      parentFingerprint: hexToBin('00000000'),
      privateKey: hexToBin(
        '330fd355e141910d33bbe84c369b87a209dd18b81095912be766b2b5a9d72bc4',
      ),
    },
  });
  t.deepEqual(decodeHdKey(xpub, { crypto }), {
    network: 'mainnet',
    node: {
      chainCode: hexToBin(
        '18aab7e9ef169f3029d93651d0c85303cbcc2ac559ccd04c324a2e678ef26dc9',
      ),
      childIndex: 0,
      depth: 0,
      parentFingerprint: hexToBin('00000000'),
      publicKey: hexToBin(
        '02be99138b48b430a8ee40bf8b56c8ebc584c363774010a9bfe549a87126e61746',
      ),
    },
  });
});

test('[crypto] decodeHdKey: errors', (t) => {
  t.deepEqual(
    decodeHdKey('#badKey'),
    `${HdKeyDecodingError.unknownCharacter} ${BaseConversionError.unknownCharacter} Unknown character: "#".`,
  );
  t.deepEqual(
    decodeHdKey('xprv1234'),
    `${HdKeyDecodingError.incorrectLength} Length: 6.`,
  );
  t.deepEqual(
    decodeHdKey(
      'xpub661MyMwAqRbcEngHLkoUWCKMBMGeqdqCGkqtzrHaTZub9ALw2oRfHA6fQP5n5X9VHStaNTBYomkSb8BFhUGavwD3RG1qvMkEKceTavTp2Ta',
      { crypto },
    ),
    `${HdKeyDecodingError.invalidChecksum} Encoded: c695e081; computed: c695e08c.`,
  );
});

test('[crypto] decodeHdPrivateKey', (t) => {
  t.deepEqual(decodeHdPrivateKey(xprv), {
    network: 'mainnet',
    node: {
      chainCode: hexToBin(
        '18aab7e9ef169f3029d93651d0c85303cbcc2ac559ccd04c324a2e678ef26dc9',
      ),
      childIndex: 0,
      depth: 0,
      parentFingerprint: hexToBin('00000000'),
      privateKey: hexToBin(
        '330fd355e141910d33bbe84c369b87a209dd18b81095912be766b2b5a9d72bc4',
      ),
    },
  });
  t.deepEqual(decodeHdPrivateKey(tprv, { crypto }), {
    network: 'testnet',
    node: {
      chainCode: hexToBin(
        '18aab7e9ef169f3029d93651d0c85303cbcc2ac559ccd04c324a2e678ef26dc9',
      ),
      childIndex: 0,
      depth: 0,
      parentFingerprint: hexToBin('00000000'),
      privateKey: hexToBin(
        '330fd355e141910d33bbe84c369b87a209dd18b81095912be766b2b5a9d72bc4',
      ),
    },
  });
});

test('[crypto] decodeHdPrivateKey: errors', (t) => {
  t.deepEqual(decodeHdPrivateKey(xpub), HdKeyDecodingError.privateKeyExpected);
  t.deepEqual(
    decodeHdPrivateKey(
      '1111111111111FF9QeH94hg7KAjgjUqkHUqbrw5wWQLoRNfRhB4cHUDCJxx2HfNb5qDiAjpbKjXeLJSknuzDmja42174H9Es1XbY24sZts9',
    ),
    `${HdKeyDecodingError.unknownVersion} Version: 0`,
  );
  const xprvWith0FilledKey =
    'xprv9s21ZrQH143K2JbpEjGU94NcdKSASB7LuXvJCTsxuENcGN1nVG7QjMnBZ6c54tCKNErugtr5mi7oyGaDVrYe4SE5u1GnzYHmjDKuKg4vuNm';
  t.deepEqual(
    decodeHdPrivateKey(xprvWith0FilledKey),
    HdKeyDecodingError.invalidPrivateKey,
  );
  const xprvWith255FilledKey =
    'xprv9s21ZrQH143K2JbpEjGU94NcdKSASB7LuXvJCTsxuENcGN1nVG7QjMnBZ8YpF7eMDfY8piRngHjovbAzQyAMi94xgeLuEgyfisLHpC7G5ST';

  t.deepEqual(
    decodeHdPrivateKey(xprvWith255FilledKey),
    HdKeyDecodingError.invalidPrivateKey,
  );
  t.deepEqual(
    decodeHdPrivateKey(
      'xprv9s21ZrQH143K2JbpEjGU94NcdKSASB7LuXvJCTsxuENcGN1nVG7QjMnBhegPMjkj1oGSFcmBkMX3xdwcMy6NSgrHvmqJptpUW5xGjg7kifZ',
    ),
    HdKeyDecodingError.missingPrivateKeyPaddingByte,
  );
});

test('[crypto] decodeHdPublicKey', (t) => {
  t.deepEqual(decodeHdPublicKey(xpub), {
    network: 'mainnet',
    node: {
      chainCode: hexToBin(
        '18aab7e9ef169f3029d93651d0c85303cbcc2ac559ccd04c324a2e678ef26dc9',
      ),
      childIndex: 0,
      depth: 0,
      parentFingerprint: hexToBin('00000000'),
      publicKey: hexToBin(
        '02be99138b48b430a8ee40bf8b56c8ebc584c363774010a9bfe549a87126e61746',
      ),
    },
  });
  t.deepEqual(decodeHdPublicKey(tpub, { crypto }), {
    network: 'testnet',
    node: {
      chainCode: hexToBin(
        '18aab7e9ef169f3029d93651d0c85303cbcc2ac559ccd04c324a2e678ef26dc9',
      ),
      childIndex: 0,
      depth: 0,
      parentFingerprint: hexToBin('00000000'),
      publicKey: hexToBin(
        '02be99138b48b430a8ee40bf8b56c8ebc584c363774010a9bfe549a87126e61746',
      ),
    },
  });
});

test('[crypto] decodeHdPublicKey: errors', (t) => {
  t.deepEqual(decodeHdPublicKey(xprv), HdKeyDecodingError.publicKeyExpected);
  t.deepEqual(
    decodeHdPublicKey(
      '1111111111111FF9QeH94hg7KAjgjUqkHUqbrw5wWQLoRNfRhB4cHUDCJxx2HfNb5qDiAjpbKjXeLJSknuzDmja42174H9Es1XbY24sZts9',
    ),
    `${HdKeyDecodingError.unknownVersion} Version: 0`,
  );
});

test('[crypto] encodeHdPrivateKey', (t) => {
  const node = {
    chainCode: hexToBin(
      '18aab7e9ef169f3029d93651d0c85303cbcc2ac559ccd04c324a2e678ef26dc9',
    ),
    childIndex: 0,
    depth: 0,
    parentFingerprint: hexToBin('00000000'),
    privateKey: hexToBin(
      '330fd355e141910d33bbe84c369b87a209dd18b81095912be766b2b5a9d72bc4',
    ),
  } as const;
  t.deepEqual(encodeHdPrivateKey({ network: 'mainnet', node }), {
    hdPrivateKey: xprv,
  });

  t.deepEqual(encodeHdPrivateKey({ network: 'testnet', node }, { crypto }), {
    hdPrivateKey: tprv,
  });

  t.deepEqual(
    encodeHdPrivateKey(
      { network: 'mainnet', node: { ...node, privateKey: hexToBin('01') } },
      { throwErrors: false },
    ),
    `${HdKeyEncodingError.invalidPrivateKeyLength} Private key length: 1.`,
  );
  t.throws(
    () => {
      encodeHdPrivateKey({
        network: 'mainnet',
        node: { ...node, privateKey: hexToBin('01') },
      });
    },
    {
      message: `${HdKeyEncodingError.invalidPrivateKeyLength} Private key length: 1.`,
    },
  );
  t.throws(
    () => {
      encodeHdPrivateKey(
        {
          network: 'mainnet',
          node: { ...node, privateKey: hexToBin('01') },
        },
        { throwErrors: true },
      );
    },
    {
      message: `${HdKeyEncodingError.invalidPrivateKeyLength} Private key length: 1.`,
    },
  );

  t.deepEqual(
    encodeHdPrivateKey(
      { network: 'mainnet', node: { ...node, chainCode: hexToBin('18aab7') } },
      { throwErrors: false },
    ),
    `${HdKeyEncodingError.invalidChainCodeLength} Chain code length: 3.`,
  );
  t.throws(
    () => {
      encodeHdPrivateKey({
        network: 'mainnet',
        node: { ...node, chainCode: hexToBin('18') },
      });
    },
    {
      message: `${HdKeyEncodingError.invalidChainCodeLength} Chain code length: 1.`,
    },
  );
  t.throws(
    () => {
      encodeHdPrivateKey(
        {
          network: 'mainnet',
          node: { ...node, chainCode: hexToBin('18') },
        },
        { throwErrors: true },
      );
    },
    {
      message: `${HdKeyEncodingError.invalidChainCodeLength} Chain code length: 1.`,
    },
  );
  t.deepEqual(
    encodeHdPrivateKey(
      {
        network: 'mainnet',
        node: { ...node, depth: 1, parentFingerprint: hexToBin('') },
      },
      { throwErrors: false },
    ),
    `${HdKeyEncodingError.invalidParentFingerprintLength} Parent fingerprint length: 0.`,
  );
  t.throws(
    () => {
      encodeHdPrivateKey({
        network: 'mainnet',
        node: { ...node, depth: 1, parentFingerprint: hexToBin('00') },
      });
    },
    {
      message: `${HdKeyEncodingError.invalidParentFingerprintLength} Parent fingerprint length: 1.`,
    },
  );
  t.throws(
    () => {
      encodeHdPrivateKey(
        {
          network: 'mainnet',
          node: { ...node, depth: 1, parentFingerprint: hexToBin('0000') },
        },
        { throwErrors: true },
      );
    },
    {
      message: `${HdKeyEncodingError.invalidParentFingerprintLength} Parent fingerprint length: 2.`,
    },
  );
  t.deepEqual(
    encodeHdPrivateKey(
      {
        network: 'mainnet',
        node: { ...node, depth: -1 },
      },
      { throwErrors: false },
    ),
    `${HdKeyEncodingError.invalidChildDepth} Depth: -1.`,
  );
  t.throws(
    () => {
      encodeHdPrivateKey({ network: 'mainnet', node: { ...node, depth: 256 } });
    },
    {
      message: `${HdKeyEncodingError.invalidChildDepth} Depth: 256.`,
    },
  );
  t.throws(
    () => {
      encodeHdPrivateKey(
        {
          network: 'mainnet',
          node: { ...node, depth: 256 },
        },
        { throwErrors: true },
      );
    },
    {
      message: `${HdKeyEncodingError.invalidChildDepth} Depth: 256.`,
    },
  );
  t.deepEqual(
    encodeHdPrivateKey(
      {
        network: 'mainnet',
        node: { ...node, childIndex: -1, depth: 1 },
      },
      { throwErrors: false },
    ),
    `${HdKeyEncodingError.invalidChildIndex} Child index: -1.`,
  );
  t.throws(
    () => {
      encodeHdPrivateKey({
        network: 'mainnet',
        node: { ...node, childIndex: 4294967296, depth: 1 },
      });
    },
    {
      message: `${HdKeyEncodingError.invalidChildIndex} Child index: 4294967296.`,
    },
  );
  t.throws(
    () => {
      encodeHdPrivateKey(
        {
          network: 'mainnet',
          node: { ...node, childIndex: 4294967296, depth: 1 },
        },
        { throwErrors: true },
      );
    },
    {
      message: `${HdKeyEncodingError.invalidChildIndex} Child index: 4294967296.`,
    },
  );
  t.deepEqual(
    encodeHdPrivateKey(
      {
        network: 'mainnet',
        node: { ...node, childIndex: 1, depth: 0 },
      },
      { throwErrors: false },
    ),
    `${HdKeyEncodingError.zeroDepthWithNonZeroChildIndex} Child index: 1.`,
  );
  t.throws(
    () => {
      encodeHdPrivateKey({
        network: 'mainnet',
        node: { ...node, childIndex: 1, depth: 0 },
      });
    },
    {
      message: `${HdKeyEncodingError.zeroDepthWithNonZeroChildIndex} Child index: 1.`,
    },
  );
  t.throws(
    () => {
      encodeHdPrivateKey(
        {
          network: 'mainnet',
          node: { ...node, childIndex: 1, depth: 0 },
        },
        { throwErrors: true },
      );
    },
    {
      message: `${HdKeyEncodingError.zeroDepthWithNonZeroChildIndex} Child index: 1.`,
    },
  );
  t.deepEqual(
    encodeHdPrivateKey(
      {
        network: 'mainnet',
        node: { ...node, depth: 0, parentFingerprint: hexToBin('01020304') },
      },
      { throwErrors: false },
    ),
    `${HdKeyEncodingError.zeroDepthWithNonZeroParentFingerprint} Parent fingerprint: 1,2,3,4.`,
  );
  t.throws(
    () => {
      encodeHdPrivateKey({
        network: 'mainnet',
        node: { ...node, depth: 0, parentFingerprint: hexToBin('01020304') },
      });
    },
    {
      message: `${HdKeyEncodingError.zeroDepthWithNonZeroParentFingerprint} Parent fingerprint: 1,2,3,4.`,
    },
  );
  t.throws(
    () => {
      encodeHdPrivateKey(
        {
          network: 'mainnet',
          node: { ...node, depth: 0, parentFingerprint: hexToBin('01020304') },
        },
        { throwErrors: true },
      );
    },
    {
      message: `${HdKeyEncodingError.zeroDepthWithNonZeroParentFingerprint} Parent fingerprint: 1,2,3,4.`,
    },
  );
});

test('[crypto] encodeHdPublicKey', (t) => {
  const node = {
    chainCode: hexToBin(
      '18aab7e9ef169f3029d93651d0c85303cbcc2ac559ccd04c324a2e678ef26dc9',
    ),
    childIndex: 0,
    depth: 0,
    parentFingerprint: hexToBin('00000000'),
    publicKey: hexToBin(
      '02be99138b48b430a8ee40bf8b56c8ebc584c363774010a9bfe549a87126e61746',
    ),
  } as const;

  t.deepEqual(encodeHdPublicKey({ network: 'mainnet', node }), {
    hdPublicKey: xpub,
  });
  t.deepEqual(encodeHdPublicKey({ network: 'testnet', node }, { crypto }), {
    hdPublicKey: tpub,
  });

  t.deepEqual(
    encodeHdPublicKey(
      { network: 'mainnet', node: { ...node, publicKey: hexToBin('00') } },
      { throwErrors: false },
    ),
    `${HdKeyEncodingError.invalidPublicKey} Invalid public key: "00".`,
  );
  t.throws(
    () => {
      encodeHdPublicKey({
        network: 'mainnet',
        node: { ...node, publicKey: hexToBin('00') },
      });
    },
    {
      message: `${HdKeyEncodingError.invalidPublicKey} Invalid public key: "00".`,
    },
  );
  t.throws(
    () => {
      encodeHdPublicKey(
        {
          network: 'mainnet',
          node: { ...node, publicKey: hexToBin('00') },
        },
        { throwErrors: true },
      );
    },
    {
      message: `${HdKeyEncodingError.invalidPublicKey} Invalid public key: "00".`,
    },
  );

  t.deepEqual(
    encodeHdPublicKey(
      {
        network: 'mainnet',
        node: {
          ...node,
          publicKey: hexToBin(
            '0476ea9e36a75d2ecf9c93a0be76885e36f822529db22acfdc761c9b5b4544f5c56dd53b07c7a983bb2ddd71551f0633194a2fe330f90aaf675dde25b137efd285',
          ),
        },
      },
      { throwErrors: false },
    ),
    `${HdKeyEncodingError.invalidPublicKeyLength} Public key length: 65.`,
  );
  t.throws(
    () => {
      encodeHdPublicKey({
        network: 'mainnet',
        node: {
          ...node,
          publicKey: hexToBin(
            '0476ea9e36a75d2ecf9c93a0be76885e36f822529db22acfdc761c9b5b4544f5c56dd53b07c7a983bb2ddd71551f0633194a2fe330f90aaf675dde25b137efd285',
          ),
        },
      });
    },
    {
      message: `${HdKeyEncodingError.invalidPublicKeyLength} Public key length: 65.`,
    },
  );
  t.throws(
    () => {
      encodeHdPublicKey(
        {
          network: 'mainnet',
          node: {
            ...node,
            publicKey: hexToBin(
              '0476ea9e36a75d2ecf9c93a0be76885e36f822529db22acfdc761c9b5b4544f5c56dd53b07c7a983bb2ddd71551f0633194a2fe330f90aaf675dde25b137efd285',
            ),
          },
        },
        { throwErrors: true },
      );
    },
    {
      message: `${HdKeyEncodingError.invalidPublicKeyLength} Public key length: 65.`,
    },
  );

  t.deepEqual(
    encodeHdPublicKey(
      { network: 'mainnet', node: { ...node, chainCode: hexToBin('18aab7') } },
      { throwErrors: false },
    ),
    `${HdKeyEncodingError.invalidChainCodeLength} Chain code length: 3.`,
  );
  t.throws(
    () => {
      encodeHdPublicKey({
        network: 'mainnet',
        node: { ...node, chainCode: hexToBin('18') },
      });
    },
    {
      message: `${HdKeyEncodingError.invalidChainCodeLength} Chain code length: 1.`,
    },
  );
  t.throws(
    () => {
      encodeHdPublicKey(
        {
          network: 'mainnet',
          node: { ...node, chainCode: hexToBin('18') },
        },
        { throwErrors: true },
      );
    },
    {
      message: `${HdKeyEncodingError.invalidChainCodeLength} Chain code length: 1.`,
    },
  );
  t.deepEqual(
    encodeHdPublicKey(
      {
        network: 'mainnet',
        node: { ...node, depth: 1, parentFingerprint: hexToBin('') },
      },
      { throwErrors: false },
    ),
    `${HdKeyEncodingError.invalidParentFingerprintLength} Parent fingerprint length: 0.`,
  );
  t.throws(
    () => {
      encodeHdPublicKey({
        network: 'mainnet',
        node: { ...node, depth: 1, parentFingerprint: hexToBin('00') },
      });
    },
    {
      message: `${HdKeyEncodingError.invalidParentFingerprintLength} Parent fingerprint length: 1.`,
    },
  );
  t.throws(
    () => {
      encodeHdPublicKey(
        {
          network: 'mainnet',
          node: { ...node, depth: 1, parentFingerprint: hexToBin('0000') },
        },
        { throwErrors: true },
      );
    },
    {
      message: `${HdKeyEncodingError.invalidParentFingerprintLength} Parent fingerprint length: 2.`,
    },
  );
  t.deepEqual(
    encodeHdPublicKey(
      {
        network: 'mainnet',
        node: { ...node, depth: -1 },
      },
      { throwErrors: false },
    ),
    `${HdKeyEncodingError.invalidChildDepth} Depth: -1.`,
  );
  t.throws(
    () => {
      encodeHdPublicKey({ network: 'mainnet', node: { ...node, depth: 256 } });
    },
    {
      message: `${HdKeyEncodingError.invalidChildDepth} Depth: 256.`,
    },
  );
  t.throws(
    () => {
      encodeHdPublicKey(
        {
          network: 'mainnet',
          node: { ...node, depth: 256 },
        },
        { throwErrors: true },
      );
    },
    {
      message: `${HdKeyEncodingError.invalidChildDepth} Depth: 256.`,
    },
  );
  t.deepEqual(
    encodeHdPublicKey(
      {
        network: 'mainnet',
        node: { ...node, childIndex: -1, depth: 1 },
      },
      { throwErrors: false },
    ),
    `${HdKeyEncodingError.invalidChildIndex} Child index: -1.`,
  );
  t.throws(
    () => {
      encodeHdPublicKey({
        network: 'mainnet',
        node: { ...node, childIndex: 4294967296, depth: 1 },
      });
    },
    {
      message: `${HdKeyEncodingError.invalidChildIndex} Child index: 4294967296.`,
    },
  );
  t.throws(
    () => {
      encodeHdPublicKey(
        {
          network: 'mainnet',
          node: { ...node, childIndex: 4294967296, depth: 1 },
        },
        { throwErrors: true },
      );
    },
    {
      message: `${HdKeyEncodingError.invalidChildIndex} Child index: 4294967296.`,
    },
  );
  t.deepEqual(
    encodeHdPublicKey(
      {
        network: 'mainnet',
        node: { ...node, childIndex: 1, depth: 0 },
      },
      { throwErrors: false },
    ),
    `${HdKeyEncodingError.zeroDepthWithNonZeroChildIndex} Child index: 1.`,
  );
  t.throws(
    () => {
      encodeHdPublicKey({
        network: 'mainnet',
        node: { ...node, childIndex: 1, depth: 0 },
      });
    },
    {
      message: `${HdKeyEncodingError.zeroDepthWithNonZeroChildIndex} Child index: 1.`,
    },
  );
  t.throws(
    () => {
      encodeHdPublicKey(
        {
          network: 'mainnet',
          node: { ...node, childIndex: 1, depth: 0 },
        },
        { throwErrors: true },
      );
    },
    {
      message: `${HdKeyEncodingError.zeroDepthWithNonZeroChildIndex} Child index: 1.`,
    },
  );
  t.deepEqual(
    encodeHdPublicKey(
      {
        network: 'mainnet',
        node: { ...node, depth: 0, parentFingerprint: hexToBin('01020304') },
      },
      { throwErrors: false },
    ),
    `${HdKeyEncodingError.zeroDepthWithNonZeroParentFingerprint} Parent fingerprint: 1,2,3,4.`,
  );
  t.throws(
    () => {
      encodeHdPublicKey({
        network: 'mainnet',
        node: { ...node, depth: 0, parentFingerprint: hexToBin('01020304') },
      });
    },
    {
      message: `${HdKeyEncodingError.zeroDepthWithNonZeroParentFingerprint} Parent fingerprint: 1,2,3,4.`,
    },
  );
  t.throws(
    () => {
      encodeHdPublicKey(
        {
          network: 'mainnet',
          node: { ...node, depth: 0, parentFingerprint: hexToBin('01020304') },
        },
        { throwErrors: true },
      );
    },
    {
      message: `${HdKeyEncodingError.zeroDepthWithNonZeroParentFingerprint} Parent fingerprint: 1,2,3,4.`,
    },
  );
});

test('[crypto] deriveHdPublicNode', (t) => {
  const privateParams = decodeHdPrivateKey(xprv);
  if (typeof privateParams === 'string') {
    t.fail(privateParams);
    return;
  }
  t.deepEqual(deriveHdPublicNode(privateParams.node), {
    chainCode: hexToBin(
      '18aab7e9ef169f3029d93651d0c85303cbcc2ac559ccd04c324a2e678ef26dc9',
    ),
    childIndex: 0,
    depth: 0,
    parentFingerprint: hexToBin('00000000'),
    publicKey: hexToBin(
      '02be99138b48b430a8ee40bf8b56c8ebc584c363774010a9bfe549a87126e61746',
    ),
  });
});

test('[crypto] deriveHdPublicKey', (t) => {
  t.deepEqual(deriveHdPublicKey(xprv), { hdPublicKey: xpub });
  t.deepEqual(deriveHdPublicKey(tprv), { hdPublicKey: tpub });
  const error = `${HdKeyDecodingError.incorrectLength} Length: 81.`;
  t.deepEqual(deriveHdPublicKey(xprv.slice(1), { throwErrors: false }), error);
  t.throws(
    () => {
      deriveHdPublicKey(xprv.slice(1));
    },
    { message: error },
  );
  t.throws(
    () => {
      deriveHdPublicKey(xprv.slice(1), { throwErrors: true });
    },
    { message: error },
  );
});

test('[crypto] deriveHdPrivateNodeChild', (t) => {
  const master = assertSuccess(decodeHdPrivateKey(xprv));
  const hardenedIndex0Child = assertSuccess(
    decodeHdPrivateKey(
      'xprv9u4S6TaiPQaF7FS24QFpRP6hjff4jXNwwYTkVNC6f6YzHj2a6G28aRN1D6Az82SxMeBivpVS3gDDXyQiu3RANTqWy34Zxi9JN76zSwkjqPF',
    ),
  );
  const index1GrandChild = assertSuccess(
    decodeHdPrivateKey(
      'xprv9w8PdihBAeR4xgGYWWqBnmDTrpWEW1QjuYAUkR7A6X48q1iQVgN433aSFxQGgtureVz7cCyi5zfuMTtBF3AkanjtvNs9m8u2JobxNfphSi3',
    ),
  );

  const hardenedIndex0 = 0x80000000;
  const result0 = deriveHdPrivateNodeChild(
    master.node,
    hardenedIndex0,
  ) as HdPrivateNodeValid;

  const result1 = deriveHdPrivateNodeChild(result0, 1, {
    crypto,
  }) as HdPrivateNodeKnownParent;
  t.deepEqual(result0, {
    ...hardenedIndex0Child.node,
    parentIdentifier: hexToBin('15c918d389673c6cd0660050f268a843361e1111'),
  });
  t.deepEqual(result1, {
    ...index1GrandChild.node,
    parentIdentifier: hexToBin('2f2bc501c943dd7f17904b612c090dd88270cc59'),
  });

  const mockCrypto = {
    ripemd160,
    secp256k1: { ...secp256k1, addTweakPrivateKey: () => 'mock failure' },
    sha256,
    sha512,
  };
  t.deepEqual(
    deriveHdPrivateNodeChild(master.node, hardenedIndex0, {
      crypto: mockCrypto,
      returnInvalidNodes: true,
      throwErrors: false,
    }),
    {
      chainCode: hardenedIndex0Child.node.chainCode,
      childIndex: hardenedIndex0Child.node.childIndex,
      depth: hardenedIndex0Child.node.depth,
      invalidMaterial: hexToBin(
        'df936db251b869552fbed141a01dc3d5680dbba8846b000e58685fe6be409fa4',
      ),
      parentFingerprint: hardenedIndex0Child.node.parentFingerprint,
      parentIdentifier: hexToBin('15c918d389673c6cd0660050f268a843361e1111'),
    },
  );
  t.throws(
    () => {
      deriveHdPrivateNodeChild(master.node, hardenedIndex0, {
        crypto: mockCrypto,
        returnInvalidNodes: true,
      });
    },
    {
      message: `${HdNodeDerivationError.invalidDerivedKey} Invalid child index: 2147483648.`,
    },
  );
  t.deepEqual(
    deriveHdPrivateNodeChild(master.node, hardenedIndex0, {
      crypto: mockCrypto,
      returnInvalidNodes: false,
      throwErrors: false,
    }),
    `${HdNodeDerivationError.invalidDerivedKey} Invalid child index: 2147483648.`,
  );
  t.throws(
    () => {
      deriveHdPrivateNodeChild(master.node, hardenedIndex0, {
        crypto: mockCrypto,
      });
    },
    {
      message: `${HdNodeDerivationError.invalidDerivedKey} Invalid child index: 2147483648.`,
    },
  );
  t.throws(
    () => {
      deriveHdPrivateNodeChild(master.node, hardenedIndex0, {
        crypto: mockCrypto,
        throwErrors: true,
      });
    },
    {
      message: `${HdNodeDerivationError.invalidDerivedKey} Invalid child index: 2147483648.`,
    },
  );
});

test('[crypto] deriveHdPrivateNodeChild: errors', (t) => {
  const { node } = assertSuccess(decodeHdPrivateKey(xprv));

  const max = 0xffffffff;
  t.deepEqual(
    deriveHdPrivateNodeChild(node, max + 1, { throwErrors: false }),
    `${HdNodeDerivationError.childIndexExceedsMaximum} Child index: 4294967296.`,
  );
  t.throws(
    () => {
      deriveHdPrivateNodeChild(node, max + 1);
    },
    {
      message: `${HdNodeDerivationError.childIndexExceedsMaximum} Child index: 4294967296.`,
    },
  );
});

test('[crypto] deriveHdPublicNodeChild', (t) => {
  const { node } = assertSuccess(decodeHdPrivateKey(xprv));
  const parentPublic = deriveHdPublicNode(node);
  const derivationIndex = 0;
  const child = deriveHdPrivateNodeChild(node, derivationIndex);
  const expectedPublic = deriveHdPublicNode(child);

  t.deepEqual(
    deriveHdPublicNodeChild(parentPublic, derivationIndex),
    expectedPublic,
  );

  t.deepEqual(
    deriveHdPublicNodeChild(parentPublic, derivationIndex, { crypto }),
    expectedPublic,
  );

  const mockCrypto = {
    ripemd160,
    secp256k1: { addTweakPublicKeyCompressed: () => 'mock failure' },
    sha256,
    sha512,
  };

  const privateInvalid = deriveHdPrivateNodeChild(node, derivationIndex, {
    crypto: {
      ripemd160,
      secp256k1: { ...secp256k1, addTweakPrivateKey: () => 'mock failure' },
      sha256,
      sha512,
    },
    returnInvalidNodes: true,
    throwErrors: false,
  });
  if (
    typeof privateInvalid === 'string' ||
    !('invalidMaterial' in privateInvalid)
  ) {
    t.fail(stringify(privateInvalid));
    return;
  }
  t.deepEqual(
    privateInvalid.invalidMaterial,
    hexToBin(
      'e0a47856471d353842d4a660069d8fa49b7ed4e17caa1137605ed9adfbd70950',
    ),
  );
  t.deepEqual(
    deriveHdPublicNodeChild(parentPublic, derivationIndex, {
      crypto: mockCrypto,
      returnInvalidNodes: true,
      throwErrors: false,
    }),
    {
      chainCode: expectedPublic.chainCode,
      childIndex: expectedPublic.childIndex,
      depth: expectedPublic.depth,
      invalidMaterial: privateInvalid.invalidMaterial,
      parentFingerprint: expectedPublic.parentFingerprint,
      parentIdentifier: expectedPublic.parentIdentifier,
    },
  );
  t.throws(
    () => {
      deriveHdPublicNodeChild(parentPublic, derivationIndex, {
        crypto: mockCrypto,
        returnInvalidNodes: true,
      });
    },
    {
      message: `${HdNodeDerivationError.invalidDerivedKey} Invalid child index: 0.`,
    },
  );
  t.deepEqual(
    deriveHdPublicNodeChild(parentPublic, derivationIndex, {
      crypto: mockCrypto,
      returnInvalidNodes: false,
      throwErrors: false,
    }),
    `${HdNodeDerivationError.invalidDerivedKey} Invalid child index: 0.`,
  );
  t.throws(
    () => {
      deriveHdPublicNodeChild(parentPublic, derivationIndex, {
        crypto: mockCrypto,
      });
    },
    {
      message: `${HdNodeDerivationError.invalidDerivedKey} Invalid child index: 0.`,
    },
  );
  t.throws(
    () => {
      deriveHdPublicNodeChild(parentPublic, derivationIndex, {
        crypto: mockCrypto,
        throwErrors: true,
      });
    },
    {
      message: `${HdNodeDerivationError.invalidDerivedKey} Invalid child index: 0.`,
    },
  );
});

test('[crypto] deriveHdPublicNodeChild: errors', (t) => {
  const { node } = assertSuccess(decodeHdPublicKey(xpub));
  const hardened0 = 0x80000000;
  t.deepEqual(
    deriveHdPublicNodeChild(node, hardened0, { throwErrors: false }),
    `${HdNodeDerivationError.hardenedDerivationRequiresPrivateNode} Requested index: 2147483648.`,
  );
  t.throws(
    () => {
      deriveHdPublicNodeChild(node, hardened0);
    },
    {
      message: `${HdNodeDerivationError.hardenedDerivationRequiresPrivateNode} Requested index: 2147483648.`,
    },
  );
});

test('[crypto] deriveHdPath, deriveHdPath return types', (t) => {
  const { node: privateNode } = assertSuccess(decodeHdPrivateKey(xprv));
  const publicNode = deriveHdPublicNode(privateNode);
  const noOp = deriveHdPath(privateNode, 'm');
  t.deepEqual(noOp, privateNode);
  const noOpWithErrors = deriveHdPath(privateNode, 'm', { throwErrors: false });
  t.true(
    ((): AssertTypesEqual<typeof noOpWithErrors, HdPrivateNodeValid | string> =>
      true)(),
  );
  t.deepEqual(noOpWithErrors, privateNode);
  const attemptedInverse = deriveHdPath(publicNode, 'm', {
    throwErrors: false,
  });
  t.true(((): AssertTypesEqual<typeof attemptedInverse, string> => true)());
  t.deepEqual(
    attemptedInverse,
    `${HdNodeDerivationError.invalidPublicDerivationPrefix} Invalid path: "m".`,
  );
  const noOpPublic = deriveHdPath(publicNode, 'M', { crypto });
  t.true(
    ((): AssertTypesEqual<typeof noOpPublic, HdPublicNodeValid> => true)(),
  );
  t.deepEqual(noOpPublic, publicNode);
  const noOpPublicWithErrors = deriveHdPath(publicNode, 'M', {
    crypto,
    throwErrors: false,
  });
  t.true(
    ((): AssertTypesEqual<
      typeof noOpPublicWithErrors,
      HdPublicNodeValid | string
    > => true)(),
  );
  t.deepEqual(noOpPublicWithErrors, publicNode);
  const knownParent = deriveHdPath(privateNode, "m/0'/1");
  t.true(
    ((): AssertTypesEqual<
      typeof knownParent,
      HdPrivateNodeKnownParent | HdPrivateNodeValid
    > => true)(),
  );
  t.truthy(
    deriveHdPath(
      // @ts-expect-error test that invalid nodes fail typechecking
      privateNode as HdPrivateNode,
      "m/0'/1",
    ),
  );
  const knownParentPublic = deriveHdPath(publicNode, 'M/0');
  t.true(
    ((): AssertTypesEqual<
      typeof knownParentPublic,
      HdPublicNodeKnownParent | HdPublicNodeValid
    > => true)(),
  );
  t.truthy(
    deriveHdPath(
      // @ts-expect-error test that invalid nodes fail typechecking
      publicNode as HdPublicNode,
      'M/0',
    ),
  );
  t.deepEqual(knownParent, {
    ...assertSuccess(
      decodeHdPrivateKey(
        'xprv9w8PdihBAeR4xgGYWWqBnmDTrpWEW1QjuYAUkR7A6X48q1iQVgN433aSFxQGgtureVz7cCyi5zfuMTtBF3AkanjtvNs9m8u2JobxNfphSi3',
      ),
    ).node,
    parentIdentifier: hexToBin('2f2bc501c943dd7f17904b612c090dd88270cc59'),
  });
  t.throws(
    () => {
      const alsoKnownParent = deriveHdPath(
        assertSuccess(knownParent) as HdPrivateNodeKnownParent,
        'm',
      );
      unknownValue(alsoKnownParent);
    },
    {
      message: `${HdNodeDerivationError.requiresZeroDepthNode} Depth of provided HD node: 2.`,
    },
  );
  t.deepEqual(
    deriveHdPath(publicNode, 'M/0/1/2/3'),
    deriveHdPublicNode(deriveHdPath(privateNode, 'm/0/1/2/3')),
  );
  t.deepEqual(
    deriveHdPath(privateNode, "m/0'/1'/2'/3'"),
    deriveHdPath(privateNode, 'm/2147483648/2147483649/2147483650/2147483651'),
  );
});

test('[crypto] deriveHdPath: errors', (t) => {
  const { node: privateNode } = assertSuccess(decodeHdPrivateKey(xprv));
  const publicNode = deriveHdPublicNode(privateNode);
  t.deepEqual(
    deriveHdPath({ ...privateNode, depth: 1 }, "m/0'/1", {
      throwErrors: false,
    }),
    `${HdNodeDerivationError.requiresZeroDepthNode} Depth of provided HD node: 1.`,
  );
  t.throws(
    () => {
      deriveHdPath({ ...privateNode, depth: 1 }, "m/0'/1");
    },
    {
      message: `${HdNodeDerivationError.requiresZeroDepthNode} Depth of provided HD node: 1.`,
    },
  );
  t.deepEqual(
    deriveHdPath(privateNode, 'm/bad/1', { throwErrors: false }),
    `${HdNodeDerivationError.invalidAbsoluteDerivationPath} Invalid path: "m/bad/1".`,
  );
  t.throws(
    () => {
      deriveHdPath(privateNode, 'm/bad/1');
    },
    {
      message: `${HdNodeDerivationError.invalidAbsoluteDerivationPath} Invalid path: "m/bad/1".`,
    },
  );
  t.deepEqual(
    deriveHdPath(privateNode, 'M', { throwErrors: false }),
    `${HdNodeDerivationError.invalidPrivateDerivationPrefix} Invalid path: "M".`,
  );
  t.throws(
    () => {
      const impossible = deriveHdPath(privateNode, 'M');
      unknownValue(impossible);
    },
    {
      message: `${HdNodeDerivationError.invalidPrivateDerivationPrefix} Invalid path: "M".`,
    },
  );
  t.deepEqual(
    deriveHdPath(publicNode, 'm', { throwErrors: false }),
    `${HdNodeDerivationError.invalidPublicDerivationPrefix} Invalid path: "m".`,
  );
  t.throws(
    () => {
      const impossible = deriveHdPath(publicNode, 'm');
      unknownValue(impossible);
    },
    {
      message: `${HdNodeDerivationError.invalidPublicDerivationPrefix} Invalid path: "m".`,
    },
  );
  t.deepEqual(
    deriveHdPath(privateNode, 'm/0/4294967296/0', { throwErrors: false }),
    `${HdNodeDerivationError.childIndexExceedsMaximum} Child index: 4294967296.`,
  );
  t.throws(
    () => {
      deriveHdPath(privateNode, 'm/0/4294967296/0');
    },
    {
      message: `${HdNodeDerivationError.childIndexExceedsMaximum} Child index: 4294967296.`,
    },
  );
  t.deepEqual(
    deriveHdPath(publicNode, "M/0/0'/0", { throwErrors: false }),
    `${HdNodeDerivationError.hardenedDerivationRequiresPrivateNode} Requested index: 2147483648.`,
  );
  t.throws(
    () => {
      deriveHdPath(publicNode, "M/0/0'/0");
    },
    {
      message: `${HdNodeDerivationError.hardenedDerivationRequiresPrivateNode} Requested index: 2147483648.`,
    },
  );
  t.deepEqual(
    deriveHdPath(publicNode, 'M/0/2147483648/0', { throwErrors: false }),
    `${HdNodeDerivationError.hardenedDerivationRequiresPrivateNode} Requested index: 2147483648.`,
  );
  t.throws(
    () => {
      deriveHdPath(publicNode, 'M/0/2147483648/0');
    },
    {
      message: `${HdNodeDerivationError.hardenedDerivationRequiresPrivateNode} Requested index: 2147483648.`,
    },
  );
});

test('[crypto] deriveHdPathRelative', (t) => {
  const { node: privateNode } = assertSuccess(decodeHdPrivateKey(xprv));
  const publicNode = deriveHdPublicNode(privateNode);
  const basicPrivate = deriveHdPathRelative(privateNode, '0');
  t.deepEqual(basicPrivate, deriveHdPrivateNodeChild(privateNode, 0));
  t.true(
    ((): AssertTypesEqual<typeof basicPrivate, HdPrivateNodeKnownParent> =>
      true)(),
  );
  const basicPublic = deriveHdPathRelative(publicNode, '0');
  t.deepEqual(basicPublic, deriveHdPublicNodeChild(publicNode, 0));
  t.true(
    ((): AssertTypesEqual<typeof basicPublic, HdPublicNodeKnownParent> =>
      true)(),
  );
  const noOpPrivate = deriveHdPathRelative(privateNode, '');
  t.deepEqual(noOpPrivate, privateNode);
  t.true(
    ((): AssertTypesEqual<typeof noOpPrivate, HdPrivateNodeValid> => true)(),
  );
  const noOpPublic = deriveHdPathRelative(publicNode, '');
  t.deepEqual(noOpPublic, publicNode);
  t.true(
    ((): AssertTypesEqual<typeof noOpPublic, HdPublicNodeValid> => true)(),
  );
  t.deepEqual(
    deriveHdPathRelative(deriveHdPublicNodeChild(publicNode, 0), '0'),
    deriveHdPublicNodeChild(deriveHdPublicNodeChild(publicNode, 0), 0),
  );
  t.deepEqual(deriveHdPathRelative(privateNode, "0'/1"), {
    ...assertSuccess(
      decodeHdPrivateKey(
        'xprv9w8PdihBAeR4xgGYWWqBnmDTrpWEW1QjuYAUkR7A6X48q1iQVgN433aSFxQGgtureVz7cCyi5zfuMTtBF3AkanjtvNs9m8u2JobxNfphSi3',
      ),
    ).node,
    parentIdentifier: hexToBin('2f2bc501c943dd7f17904b612c090dd88270cc59'),
  });
  t.deepEqual(
    deriveHdPathRelative(publicNode, '0/1/2/3'),
    deriveHdPublicNode(
      deriveHdPathRelative(privateNode, '0/1/2/3') as HdPrivateNodeKnownParent,
    ),
  );
  t.deepEqual(
    deriveHdPathRelative(privateNode, "0'/1'/2'/3'"),
    deriveHdPathRelative(
      privateNode,
      '2147483648/2147483649/2147483650/2147483651',
    ),
  );
  const knownParent = deriveHdPathRelative(assertSuccess(privateNode), '0');
  const alsoKnownParent = deriveHdPathRelative(assertSuccess(knownParent), '');
  t.deepEqual(knownParent, alsoKnownParent);
});

test('[crypto] deriveHdPathRelative: errors', (t) => {
  const { node: privateNode } = assertSuccess(decodeHdPrivateKey(xprv));
  t.deepEqual(deriveHdPathRelative(privateNode, ''), privateNode);
  t.deepEqual(
    deriveHdPathRelative(privateNode, 'bad/1', { throwErrors: false }),
    `${HdNodeDerivationError.invalidRelativeDerivationPath} Invalid path: "bad/1".`,
  );
  t.throws(
    () => {
      deriveHdPathRelative(privateNode, 'bad/1');
    },
    {
      message: `${HdNodeDerivationError.invalidRelativeDerivationPath} Invalid path: "bad/1".`,
    },
  );
});

test('[crypto] crackHdPrivateNodeFromHdPublicNodeAndChildPrivateNode', (t) => {
  const { node: parentPrivateNode } = assertSuccess(decodeHdPrivateKey(xprv));
  const parentPublicNode = deriveHdPublicNode(parentPrivateNode);
  const nonHardenedChildNode = deriveHdPath(parentPrivateNode, 'm/1234');
  if (typeof nonHardenedChildNode === 'string') {
    t.fail(`hardenedChildNode: ${stringify(nonHardenedChildNode)}`);
    return;
  }
  const hardenedChildNode = deriveHdPath(parentPrivateNode, "m/1234'");
  if (typeof hardenedChildNode === 'string') {
    t.fail(`hardenedChildNode: ${stringify(hardenedChildNode)}`);
    return;
  }
  const hardenedChildPublicNode = deriveHdPublicNode(hardenedChildNode);
  if (typeof hardenedChildPublicNode === 'string') {
    t.fail(`hardenedChildPublicNode: ${stringify(hardenedChildPublicNode)}`);
    return;
  }
  const nonHardenedGrandchildNode = deriveHdPathRelative(
    hardenedChildNode,
    '1234',
  );
  if (typeof nonHardenedGrandchildNode === 'string') {
    t.fail(
      `nonHardenedGrandchildNode: ${stringify(nonHardenedGrandchildNode)}`,
    );
    return;
  }
  t.deepEqual(
    crackHdPrivateNodeFromHdPublicNodeAndChildPrivateNode(
      parentPublicNode,
      nonHardenedChildNode,
    ),
    parentPrivateNode,
  );

  t.deepEqual(
    crackHdPrivateNodeFromHdPublicNodeAndChildPrivateNode(
      hardenedChildPublicNode,
      nonHardenedGrandchildNode,
      { crypto },
    ),
    hardenedChildNode,
  );

  t.deepEqual(
    crackHdPrivateNodeFromHdPublicNodeAndChildPrivateNode(
      parentPublicNode,
      hardenedChildNode,
    ),
    HdNodeCrackingError.cannotCrackHardenedDerivation,
  );
});

const bip32Vector = test.macro<[string, string, string, string]>({
  // eslint-disable-next-line @typescript-eslint/max-params
  exec: (t, seedHex, path, hdPrivateKey, hdPublicKey) => {
    const master = deriveHdPrivateNodeFromSeed(hexToBin(seedHex));
    const childNode = deriveHdPath(master, path);
    const vectorXprv = encodeHdPrivateKey({
      network: 'mainnet',
      node: childNode,
    }).hdPrivateKey;
    t.deepEqual(vectorXprv, hdPrivateKey, 'vectorXprv === hdPrivateKey');
    const decodedPrivate = assertSuccess(
      decodeHdPrivateKey(hdPrivateKey),
      'decodedPrivate:',
    );
    t.deepEqual(
      childNode.parentIdentifier?.slice(0, fingerprintLength),
      path === 'm' ? undefined : decodedPrivate.node.parentFingerprint,
      'parentFingerprint (private)',
    );
    t.deepEqual(
      childNode,
      {
        ...decodedPrivate.node,
        ...(path === 'm'
          ? {}
          : { parentIdentifier: childNode.parentIdentifier }),
      },
      'childNode contents',
    );
    const decodedPublic = assertSuccess(
      decodeHdPublicKey(hdPublicKey),
      'decodedPublic:',
    );
    const publicNode = deriveHdPublicNode(childNode);
    t.deepEqual(
      publicNode.parentIdentifier?.slice(0, fingerprintLength),
      path === 'm' ? undefined : decodedPublic.node.parentFingerprint,
      'parentFingerprint (public)',
    );
    t.deepEqual(
      publicNode,
      {
        ...decodedPublic.node,
        ...(path === 'm'
          ? {}
          : { parentIdentifier: publicNode.parentIdentifier }),
      },
      'publicNode contents',
    );
    const vectorXpub = encodeHdPublicKey({
      network: 'mainnet',
      node: publicNode,
    }).hdPublicKey;
    t.deepEqual(vectorXpub, hdPublicKey, 'vectorXpub === hdPublicKey');
  },
  title: (title, _, path) => `[crypto] BIP32 Vector - ${title ?? ''}: ${path}`,
});

test(
  '#1.1',
  bip32Vector,
  '000102030405060708090a0b0c0d0e0f',
  'm',
  'xprv9s21ZrQH143K3QTDL4LXw2F7HEK3wJUD2nW2nRk4stbPy6cq3jPPqjiChkVvvNKmPGJxWUtg6LnF5kejMRNNU3TGtRBeJgk33yuGBxrMPHi',
  'xpub661MyMwAqRbcFtXgS5sYJABqqG9YLmC4Q1Rdap9gSE8NqtwybGhePY2gZ29ESFjqJoCu1Rupje8YtGqsefD265TMg7usUDFdp6W1EGMcet8',
);

test(
  '#1.2',
  bip32Vector,
  '000102030405060708090a0b0c0d0e0f',
  "m/0'",
  'xprv9uHRZZhk6KAJC1avXpDAp4MDc3sQKNxDiPvvkX8Br5ngLNv1TxvUxt4cV1rGL5hj6KCesnDYUhd7oWgT11eZG7XnxHrnYeSvkzY7d2bhkJ7',
  'xpub68Gmy5EdvgibQVfPdqkBBCHxA5htiqg55crXYuXoQRKfDBFA1WEjWgP6LHhwBZeNK1VTsfTFUHCdrfp1bgwQ9xv5ski8PX9rL2dZXvgGDnw',
);

test(
  '#1.3',
  bip32Vector,
  '000102030405060708090a0b0c0d0e0f',
  "m/0'/1",
  'xprv9wTYmMFdV23N2TdNG573QoEsfRrWKQgWeibmLntzniatZvR9BmLnvSxqu53Kw1UmYPxLgboyZQaXwTCg8MSY3H2EU4pWcQDnRnrVA1xe8fs',
  'xpub6ASuArnXKPbfEwhqN6e3mwBcDTgzisQN1wXN9BJcM47sSikHjJf3UFHKkNAWbWMiGj7Wf5uMash7SyYq527Hqck2AxYysAA7xmALppuCkwQ',
);

test(
  '#1.4',
  bip32Vector,
  '000102030405060708090a0b0c0d0e0f',
  "m/0'/1/2'",
  'xprv9z4pot5VBttmtdRTWfWQmoH1taj2axGVzFqSb8C9xaxKymcFzXBDptWmT7FwuEzG3ryjH4ktypQSAewRiNMjANTtpgP4mLTj34bhnZX7UiM',
  'xpub6D4BDPcP2GT577Vvch3R8wDkScZWzQzMMUm3PWbmWvVJrZwQY4VUNgqFJPMM3No2dFDFGTsxxpG5uJh7n7epu4trkrX7x7DogT5Uv6fcLW5',
);

test(
  '#1.5',
  bip32Vector,
  '000102030405060708090a0b0c0d0e0f',
  "m/0'/1/2'/2",
  'xprvA2JDeKCSNNZky6uBCviVfJSKyQ1mDYahRjijr5idH2WwLsEd4Hsb2Tyh8RfQMuPh7f7RtyzTtdrbdqqsunu5Mm3wDvUAKRHSC34sJ7in334',
  'xpub6FHa3pjLCk84BayeJxFW2SP4XRrFd1JYnxeLeU8EqN3vDfZmbqBqaGJAyiLjTAwm6ZLRQUMv1ZACTj37sR62cfN7fe5JnJ7dh8zL4fiyLHV',
);

test(
  '#1.6',
  bip32Vector,
  '000102030405060708090a0b0c0d0e0f',
  "m/0'/1/2'/2/1000000000",
  'xprvA41z7zogVVwxVSgdKUHDy1SKmdb533PjDz7J6N6mV6uS3ze1ai8FHa8kmHScGpWmj4WggLyQjgPie1rFSruoUihUZREPSL39UNdE3BBDu76',
  'xpub6H1LXWLaKsWFhvm6RVpEL9P4KfRZSW7abD2ttkWP3SSQvnyA8FSVqNTEcYFgJS2UaFcxupHiYkro49S8yGasTvXEYBVPamhGW6cFJodrTHy',
);

test(
  '#2.1',
  bip32Vector,
  'fffcf9f6f3f0edeae7e4e1dedbd8d5d2cfccc9c6c3c0bdbab7b4b1aeaba8a5a29f9c999693908d8a8784817e7b7875726f6c696663605d5a5754514e4b484542',
  'm',
  'xprv9s21ZrQH143K31xYSDQpPDxsXRTUcvj2iNHm5NUtrGiGG5e2DtALGdso3pGz6ssrdK4PFmM8NSpSBHNqPqm55Qn3LqFtT2emdEXVYsCzC2U',
  'xpub661MyMwAqRbcFW31YEwpkMuc5THy2PSt5bDMsktWQcFF8syAmRUapSCGu8ED9W6oDMSgv6Zz8idoc4a6mr8BDzTJY47LJhkJ8UB7WEGuduB',
);

test(
  '#2.2',
  bip32Vector,
  'fffcf9f6f3f0edeae7e4e1dedbd8d5d2cfccc9c6c3c0bdbab7b4b1aeaba8a5a29f9c999693908d8a8784817e7b7875726f6c696663605d5a5754514e4b484542',
  'm/0',
  'xprv9vHkqa6EV4sPZHYqZznhT2NPtPCjKuDKGY38FBWLvgaDx45zo9WQRUT3dKYnjwih2yJD9mkrocEZXo1ex8G81dwSM1fwqWpWkeS3v86pgKt',
  'xpub69H7F5d8KSRgmmdJg2KhpAK8SR3DjMwAdkxj3ZuxV27CprR9LgpeyGmXUbC6wb7ERfvrnKZjXoUmmDznezpbZb7ap6r1D3tgFxHmwMkQTPH',
);

test(
  '#2.3',
  bip32Vector,
  'fffcf9f6f3f0edeae7e4e1dedbd8d5d2cfccc9c6c3c0bdbab7b4b1aeaba8a5a29f9c999693908d8a8784817e7b7875726f6c696663605d5a5754514e4b484542',
  "m/0/2147483647'",
  'xprv9wSp6B7kry3Vj9m1zSnLvN3xH8RdsPP1Mh7fAaR7aRLcQMKTR2vidYEeEg2mUCTAwCd6vnxVrcjfy2kRgVsFawNzmjuHc2YmYRmagcEPdU9',
  'xpub6ASAVgeehLbnwdqV6UKMHVzgqAG8Gr6riv3Fxxpj8ksbH9ebxaEyBLZ85ySDhKiLDBrQSARLq1uNRts8RuJiHjaDMBU4Zn9h8LZNnBC5y4a',
);

test(
  '#2.4',
  bip32Vector,
  'fffcf9f6f3f0edeae7e4e1dedbd8d5d2cfccc9c6c3c0bdbab7b4b1aeaba8a5a29f9c999693908d8a8784817e7b7875726f6c696663605d5a5754514e4b484542',
  "m/0/2147483647'/1",
  'xprv9zFnWC6h2cLgpmSA46vutJzBcfJ8yaJGg8cX1e5StJh45BBciYTRXSd25UEPVuesF9yog62tGAQtHjXajPPdbRCHuWS6T8XA2ECKADdw4Ef',
  'xpub6DF8uhdarytz3FWdA8TvFSvvAh8dP3283MY7p2V4SeE2wyWmG5mg5EwVvmdMVCQcoNJxGoWaU9DCWh89LojfZ537wTfunKau47EL2dhHKon',
);

test(
  '#2.5',
  bip32Vector,
  'fffcf9f6f3f0edeae7e4e1dedbd8d5d2cfccc9c6c3c0bdbab7b4b1aeaba8a5a29f9c999693908d8a8784817e7b7875726f6c696663605d5a5754514e4b484542',
  "m/0/2147483647'/1/2147483646'",
  'xprvA1RpRA33e1JQ7ifknakTFpgNXPmW2YvmhqLQYMmrj4xJXXWYpDPS3xz7iAxn8L39njGVyuoseXzU6rcxFLJ8HFsTjSyQbLYnMpCqE2VbFWc',
  'xpub6ERApfZwUNrhLCkDtcHTcxd75RbzS1ed54G1LkBUHQVHQKqhMkhgbmJbZRkrgZw4koxb5JaHWkY4ALHY2grBGRjaDMzQLcgJvLJuZZvRcEL',
);

test(
  '#2.6',
  bip32Vector,
  'fffcf9f6f3f0edeae7e4e1dedbd8d5d2cfccc9c6c3c0bdbab7b4b1aeaba8a5a29f9c999693908d8a8784817e7b7875726f6c696663605d5a5754514e4b484542',
  "m/0/2147483647'/1/2147483646'/2",
  'xprvA2nrNbFZABcdryreWet9Ea4LvTJcGsqrMzxHx98MMrotbir7yrKCEXw7nadnHM8Dq38EGfSh6dqA9QWTyefMLEcBYJUuekgW4BYPJcr9E7j',
  'xpub6FnCn6nSzZAw5Tw7cgR9bi15UV96gLZhjDstkXXxvCLsUXBGXPdSnLFbdpq8p9HmGsApME5hQTZ3emM2rnY5agb9rXpVGyy3bdW6EEgAtqt',
);

test(
  '#3.1',
  bip32Vector,
  '4b381541583be4423346c643850da4b320e46a87ae3d2a4e6da11eba819cd4acba45d239319ac14f863b8d5ab5a0d0c64d2e8a1e7d1457df2e5a3c51c73235be',
  'm',
  'xprv9s21ZrQH143K25QhxbucbDDuQ4naNntJRi4KUfWT7xo4EKsHt2QJDu7KXp1A3u7Bi1j8ph3EGsZ9Xvz9dGuVrtHHs7pXeTzjuxBrCmmhgC6',
  'xpub661MyMwAqRbcEZVB4dScxMAdx6d4nFc9nvyvH3v4gJL378CSRZiYmhRoP7mBy6gSPSCYk6SzXPTf3ND1cZAceL7SfJ1Z3GC8vBgp2epUt13',
);

test(
  '#3.2',
  bip32Vector,
  '4b381541583be4423346c643850da4b320e46a87ae3d2a4e6da11eba819cd4acba45d239319ac14f863b8d5ab5a0d0c64d2e8a1e7d1457df2e5a3c51c73235be',
  "m/0'",
  'xprv9uPDJpEQgRQfDcW7BkF7eTya6RPxXeJCqCJGHuCJ4GiRVLzkTXBAJMu2qaMWPrS7AANYqdq6vcBcBUdJCVVFceUvJFjaPdGZ2y9WACViL4L',
  'xpub68NZiKmJWnxxS6aaHmn81bvJeTESw724CRDs6HbuccFQN9Ku14VQrADWgqbhhTHBaohPX4CjNLf9fq9MYo6oDaPPLPxSb7gwQN3ih19Zm4Y',
);

test(
  '#4.1',
  bip32Vector,
  '3ddd5602285899a946114506157c7997e5444528f3003f6134712147db19b678',
  'm',
  'xprv9s21ZrQH143K48vGoLGRPxgo2JNkJ3J3fqkirQC2zVdk5Dgd5w14S7fRDyHH4dWNHUgkvsvNDCkvAwcSHNAQwhwgNMgZhLtQC63zxwhQmRv',
  'xpub661MyMwAqRbcGczjuMoRm6dXaLDEhW1u34gKenbeYqAix21mdUKJyuyu5F1rzYGVxyL6tmgBUAEPrEz92mBXjByMRiJdba9wpnN37RLLAXa',
);

test(
  '#4.2',
  bip32Vector,
  '3ddd5602285899a946114506157c7997e5444528f3003f6134712147db19b678',
  "m/0'",
  'xprv9vB7xEWwNp9kh1wQRfCCQMnZUEG21LpbR9NPCNN1dwhiZkjjeGRnaALmPXCX7SgjFTiCTT6bXes17boXtjq3xLpcDjzEuGLQBM5ohqkao9G',
  'xpub69AUMk3qDBi3uW1sXgjCmVjJ2G6WQoYSnNHyzkmdCHEhSZ4tBok37xfFEqHd2AddP56Tqp4o56AePAgCjYdvpW2PU2jbUPFKsav5ut6Ch1m',
);

test(
  '#4.3',
  bip32Vector,
  '3ddd5602285899a946114506157c7997e5444528f3003f6134712147db19b678',
  "m/0'/1'",
  'xprv9xJocDuwtYCMNAo3Zw76WENQeAS6WGXQ55RCy7tDJ8oALr4FWkuVoHJeHVAcAqiZLE7Je3vZJHxspZdFHfnBEjHqU5hG1Jaj32dVoS6XLT1',
  'xpub6BJA1jSqiukeaesWfxe6sNK9CCGaujFFSJLomWHprUL9DePQ4JDkM5d88n49sMGJxrhpjazuXYWdMf17C9T5XnxkopaeS7jGk1GyyVziaMt',
);

const bip32InvalidVector = test.macro<[string, object | string, string]>({
  // eslint-disable-next-line @typescript-eslint/max-params
  exec: (t, hdKey, expectedUncheckedResult, expectedStrictResult) => {
    const unchecked = decodeHdKeyUnchecked(hdKey);
    t.deepEqual(
      unchecked,
      expectedUncheckedResult,
      `decodeHdKeyUnchecked produced an unexpected result: ${stringifyTestVector(
        unchecked,
      )}`,
    );
    const strict = decodeHdKey(hdKey);
    t.deepEqual(
      strict,
      expectedStrictResult,
      `decodeHdKey produced an unexpected result: ${stringifyTestVector(
        strict,
      )}`,
    );
  },
  title: (title) => `[crypto] BIP32 Invalid Vector - ${title ?? ''}`,
});

test(
  '#5.0 ("pubkey version / prv key mismatch")',
  bip32InvalidVector,
  'xpub661MyMwAqRbcEYS8w7XLSVeEsBXy79zSzH1J8vCdxAZningWLdN3zgtU6LBpB85b3D2yc8sfvZU521AAwdZafEz7mnzBBsz4wKY5fTtTQBm',
  {
    node: {
      chainCode: hexToBin(
        '0000000000000000000000000000000000000000000000000000000000000000',
      ),
      childIndex: 0,
      depth: 0,
      invalidMaterial: hexToBin(
        '00000000000000000000000000000000000000000000000000000000000000000c',
      ),
      parentFingerprint: hexToBin('00000000'),
    },
    version: HdKeyVersion.mainnetPublicKey,
  },
  `${HdKeyDecodingError.invalidPublicKey} Invalid public key: 00000000000000000000000000000000000000000000000000000000000000000c.`,
);
test(
  '#5.1 ("pubkey version / prv key mismatch")',
  bip32InvalidVector,
  'xprv9s21ZrQH143K24Mfq5zL5MhWK9hUhhGbd45hLXo2Pq2oqzMMo63oStZzFGTQQD3dC4H2D5GBj7vWvSQaaBv5cxi9gafk7NF3pnBju6dwKvH',
  HdKeyDecodingError.missingPrivateKeyPaddingByte,
  HdKeyDecodingError.missingPrivateKeyPaddingByte,
);
test(
  '#5.2 ("invalid pubkey prefix 04")',
  bip32InvalidVector,
  'xpub661MyMwAqRbcEYS8w7XLSVeEsBXy79zSzH1J8vCdxAZningWLdN3zgtU6Txnt3siSujt9RCVYsx4qHZGc62TG4McvMGcAUjeuwZdduYEvFn',
  {
    node: {
      chainCode: hexToBin(
        '0000000000000000000000000000000000000000000000000000000000000000',
      ),
      childIndex: 0,
      depth: 0,
      invalidMaterial: hexToBin(
        '04000000000000000000000000000000000000000000000000000000000000000c',
      ),
      parentFingerprint: hexToBin('00000000'),
    },
    version: HdKeyVersion.mainnetPublicKey,
  },
  `${HdKeyDecodingError.invalidPublicKey} Invalid public key: 04000000000000000000000000000000000000000000000000000000000000000c.`,
);
test(
  '#5.3 ("invalid pubkey prefix 04")',
  bip32InvalidVector,
  'xprv9s21ZrQH143K24Mfq5zL5MhWK9hUhhGbd45hLXo2Pq2oqzMMo63oStZzFGpWnsj83BHtEy5Zt8CcDr1UiRXuWCmTQLxEK9vbz5gPstX92JQ',
  HdKeyDecodingError.missingPrivateKeyPaddingByte,
  HdKeyDecodingError.missingPrivateKeyPaddingByte,
);
test(
  '#5.4 ("invalid pubkey prefix 01")',
  bip32InvalidVector,
  'xpub661MyMwAqRbcEYS8w7XLSVeEsBXy79zSzH1J8vCdxAZningWLdN3zgtU6N8ZMMXctdiCjxTNq964yKkwrkBJJwpzZS4HS2fxvyYUA4q2Xe4',
  {
    node: {
      chainCode: hexToBin(
        '0000000000000000000000000000000000000000000000000000000000000000',
      ),
      childIndex: 0,
      depth: 0,
      invalidMaterial: hexToBin(
        '01000000000000000000000000000000000000000000000000000000000000000c',
      ),
      parentFingerprint: hexToBin('00000000'),
    },
    version: HdKeyVersion.mainnetPublicKey,
  },
  `${HdKeyDecodingError.invalidPublicKey} Invalid public key: 01000000000000000000000000000000000000000000000000000000000000000c.`,
);
test(
  '#5.5 ("invalid pubkey prefix 01")',
  bip32InvalidVector,
  'xprv9s21ZrQH143K24Mfq5zL5MhWK9hUhhGbd45hLXo2Pq2oqzMMo63oStZzFAzHGBP2UuGCqWLTAPLcMtD9y5gkZ6Eq3Rjuahrv17fEQ3Qen6J',
  HdKeyDecodingError.missingPrivateKeyPaddingByte,
  HdKeyDecodingError.missingPrivateKeyPaddingByte,
);
test(
  '#5.6 ("zero depth with non-zero parent fingerprint")',
  bip32InvalidVector,
  'xprv9s2SPatNQ9Vc6GTbVMFPFo7jsaZySyzk7L8n2uqKXJen3KUmvQNTuLh3fhZMBoG3G4ZW1N2kZuHEPY53qmbZzCHshoQnNf4GvELZfqTUrcv',
  {
    node: {
      chainCode: hexToBin(
        '0000000000000000000000000000000000000000000000000000000000000000',
      ),
      childIndex: 0,
      depth: 0,
      parentFingerprint: hexToBin('01010101'),
      privateKey: hexToBin(
        '000000000000000000000000000000000000000000000000000000000000000c',
      ),
    },
    version: HdKeyVersion.mainnetPrivateKey,
  },
  `${HdKeyDecodingError.zeroDepthWithNonZeroParentFingerprint} Parent fingerprint: 1,1,1,1.`,
);
test(
  '#5.7 ("zero depth with non-zero parent fingerprint")',
  bip32InvalidVector,
  'xpub661no6RGEX3uJkY4bNnPcw4URcQTrSibUZ4NqJEw5eBkv7ovTwgiT91XX27VbEXGENhYRCf7hyEbWrR3FewATdCEebj6znwMfQkhRYHRLpJ',
  {
    node: {
      chainCode: hexToBin(
        '0000000000000000000000000000000000000000000000000000000000000000',
      ),
      childIndex: 0,
      depth: 0,
      parentFingerprint: hexToBin('01010101'),
      publicKey: hexToBin(
        '03d01115d548e7561b15c38f004d734633687cf4419620095bc5b0f47070afe85a',
      ),
    },
    version: HdKeyVersion.mainnetPublicKey,
  },
  `${HdKeyDecodingError.zeroDepthWithNonZeroParentFingerprint} Parent fingerprint: 1,1,1,1.`,
);
test(
  '#5.8 ("zero depth with non-zero index")',
  bip32InvalidVector,
  'xprv9s21ZrQH4r4TsiLvyLXqM9P7k1K3EYhA1kkD6xuquB5i39AU8KF42acDyL3qsDbU9NmZn6MsGSUYZEsuoePmjzsB3eFKSUEh3Gu1N3cqVUN',
  {
    node: {
      chainCode: hexToBin(
        '0000000000000000000000000000000000000000000000000000000000000000',
      ),
      childIndex: 16843009,
      depth: 0,
      parentFingerprint: hexToBin('00000000'),
      privateKey: hexToBin(
        '000000000000000000000000000000000000000000000000000000000000000c',
      ),
    },
    version: HdKeyVersion.mainnetPrivateKey,
  },
  `${HdKeyDecodingError.zeroDepthWithNonZeroChildIndex} Child index: 16843009.`,
);
test(
  '#5.9 ("zero depth with non-zero index")',
  bip32InvalidVector,
  'xpub661MyMwAuDcm6CRQ5N4qiHKrJ39Xe1R1NyfouMKTTWcguwVcfrZJaNvhpebzGerh7gucBvzEQWRugZDuDXjNDRmXzSZe4c7mnTK97pTvGS8',
  {
    node: {
      chainCode: hexToBin(
        '0000000000000000000000000000000000000000000000000000000000000000',
      ),
      childIndex: 16843009,
      depth: 0,
      parentFingerprint: hexToBin('00000000'),
      publicKey: hexToBin(
        '03d01115d548e7561b15c38f004d734633687cf4419620095bc5b0f47070afe85a',
      ),
    },
    version: HdKeyVersion.mainnetPublicKey,
  },
  `${HdKeyDecodingError.zeroDepthWithNonZeroChildIndex} Child index: 16843009.`,
);
test(
  '#5.10 ("unknown extended key version")',
  bip32InvalidVector,
  'DMwo58pR1QLEFihHiXPVykYB6fJmsTeHvyTp7hRThAtCX8CvYzgPcn8XnmdfHGMQzT7ayAmfo4z3gY5KfbrZWZ6St24UVf2Qgo6oujFktLHdHY4',
  `${HdKeyDecodingError.unknownVersion} Version: 16843009`,
  `${HdKeyDecodingError.unknownVersion} Version: 16843009`,
);
test(
  '#5.11 ("unknown extended key version")',
  bip32InvalidVector,
  'DMwo58pR1QLEFihHiXPVykYB6fJmsTeHvyTp7hRThAtCX8CvYzgPcn8XnmdfHPmHJiEDXkTiJTVV9rHEBUem2mwVbbNfvT2MTcAqj3nesx8uBf9',
  `${HdKeyDecodingError.unknownVersion} Version: 16843009`,
  `${HdKeyDecodingError.unknownVersion} Version: 16843009`,
);
test(
  '#5.12 ("private key 0 not in 1..n-1")',
  bip32InvalidVector,
  'xprv9s21ZrQH143K24Mfq5zL5MhWK9hUhhGbd45hLXo2Pq2oqzMMo63oStZzF93Y5wvzdUayhgkkFoicQZcP3y52uPPxFnfoLZB21Teqt1VvEHx',
  {
    node: {
      chainCode: hexToBin(
        '0000000000000000000000000000000000000000000000000000000000000000',
      ),
      childIndex: 0,
      depth: 0,
      invalidMaterial: hexToBin(
        '0000000000000000000000000000000000000000000000000000000000000000',
      ),
      parentFingerprint: hexToBin('00000000'),
    },
    version: HdKeyVersion.mainnetPrivateKey,
  },
  HdKeyDecodingError.invalidPrivateKey,
);
test(
  '#5.13 ("private key n not in 1..n-1")',
  bip32InvalidVector,
  'xprv9s21ZrQH143K24Mfq5zL5MhWK9hUhhGbd45hLXo2Pq2oqzMMo63oStZzFAzHGBP2UuGCqWLTAPLcMtD5SDKr24z3aiUvKr9bJpdrcLg1y3G',
  {
    node: {
      chainCode: hexToBin(
        '0000000000000000000000000000000000000000000000000000000000000000',
      ),
      childIndex: 0,
      depth: 0,
      invalidMaterial: hexToBin(
        'fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141',
      ),
      parentFingerprint: hexToBin('00000000'),
    },
    version: HdKeyVersion.mainnetPrivateKey,
  },
  HdKeyDecodingError.invalidPrivateKey,
);
test(
  '#5.14 ("invalid pubkey 020000000000000000000000000000000000000000000000000000000000000007")',
  bip32InvalidVector,
  'xpub661MyMwAqRbcEYS8w7XLSVeEsBXy79zSzH1J8vCdxAZningWLdN3zgtU6Q5JXayek4PRsn35jii4veMimro1xefsM58PgBMrvdYre8QyULY',
  {
    node: {
      chainCode: hexToBin(
        '0000000000000000000000000000000000000000000000000000000000000000',
      ),
      childIndex: 0,
      depth: 0,
      invalidMaterial: hexToBin(
        '020000000000000000000000000000000000000000000000000000000000000007',
      ),
      parentFingerprint: hexToBin('00000000'),
    },
    version: HdKeyVersion.mainnetPublicKey,
  },
  `${HdKeyDecodingError.invalidPublicKey} Invalid public key: 020000000000000000000000000000000000000000000000000000000000000007.`,
);
test(
  '#5.15 ("invalid checksum")',
  bip32InvalidVector,
  'xprv9s21ZrQH143K3QTDL4LXw2F7HEK3wJUD2nW2nRk4stbPy6cq3jPPqjiChkVvvNKmPGJxWUtg6LnF5kejMRNNU3TGtRBeJgk33yuGBxrMPHL',
  `${HdKeyDecodingError.invalidChecksum} Encoded: e77e9d5b; computed: e77e9d71.`,
  `${HdKeyDecodingError.invalidChecksum} Encoded: e77e9d5b; computed: e77e9d71.`,
);

const fcBip32Path = () =>
  fc
    .array(fc.integer({ max: maximumChildIndex, min: 0 }), {
      maxLength: maximumDepth,
      minLength: 1,
    })
    .map(
      (array) =>
        `m/${array
          .map((i) =>
            i > hardenedIndexOffset ? `${i - hardenedIndexOffset}'` : `${i}`,
          )
          .join('/')}`,
    );

testProp(
  '[fast-check] [crypto] HD node derivation is equivalent to bitcore-lib-cash',
  [fcBip32Path()],
  (t, path: string) => {
    const privateNode = assertSuccess(decodeHdPrivateKey(xprv)).node;
    const node = deriveHdPath(privateNode, path) as HdPrivateNodeValid;
    const publicNode = deriveHdPublicNode(node);

    const resultPrv = encodeHdPrivateKey({
      network: 'mainnet',
      node,
    }).hdPrivateKey;
    const resultPub = encodeHdPublicKey({
      network: 'mainnet',
      node: publicNode,
    }).hdPublicKey;
    // eslint-disable-next-line new-cap, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const bitcoreResult = bitcoreLibCash.HDPrivateKey(xprv).deriveChild(path);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const bitcorePrv = bitcoreResult.xprivkey;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const bitcorePub = bitcoreResult.xpubkey;

    t.deepEqual(resultPrv, bitcorePrv);
    t.deepEqual(resultPub, bitcorePub);
  },
  { numRuns: 10 },
);

testProp(
  '[fast-check] [crypto] encodeHdPrivateKey (with/without throwErrors) <-> decodeHdPrivateKey',
  [
    fc.boolean(),
    fc.integer({ max: maximumDepth, min: 0 }),
    fc.integer({ max: maximumChildIndex, min: 0 }),
    fc.uint8Array({
      maxLength: fingerprintLength,
      minLength: fingerprintLength,
    }),
    fc.uint8Array({ maxLength: chainCodeLength, minLength: chainCodeLength }),
    fc.uint8Array({ maxLength: privateKeyLength, minLength: privateKeyLength }),
  ],
  (
    t,
    mainnet: boolean,
    depth: number,
    childIndex: number,
    parentFingerprint: Uint8Array,
    chainCode: Uint8Array,
    privateKey: Uint8Array,
    // eslint-disable-next-line @typescript-eslint/max-params
  ) => {
    if (!validateSecp256k1PrivateKey(privateKey)) {
      t.pass();
      return;
    }
    const parameters: DecodedHdKey<HdPrivateNodeValid> = {
      network: mainnet ? 'mainnet' : 'testnet',
      node: {
        chainCode,
        childIndex,
        depth,
        parentFingerprint,
        privateKey,
      },
    };
    const encoded = encodeHdPrivateKey(parameters, { throwErrors: false });
    if (typeof encoded === 'string') {
      t.throws(
        () => {
          encodeHdPrivateKey(parameters);
        },
        { message: encoded },
        `parameters: ${stringifyTestVector(parameters)}`,
      );
      return;
    }
    const decoded = decodeHdPrivateKey(encoded.hdPrivateKey);
    if (typeof decoded === 'string') {
      t.fail(decoded);
      return;
    }
    t.deepEqual(encoded.hdPrivateKey, encodeHdPrivateKey(decoded).hdPrivateKey);
  },
);

testProp(
  '[fast-check] [crypto] encodeHdPublicKey (with/without throwErrors) <-> decodeHdPublicKey',
  [
    fc.boolean(),
    fc.integer({ max: maximumDepth, min: 0 }),
    fc.integer({ max: maximumChildIndex, min: 0 }),
    fc.uint8Array({
      maxLength: fingerprintLength,
      minLength: fingerprintLength,
    }),
    fc.uint8Array({ maxLength: chainCodeLength, minLength: chainCodeLength }),
    fc.uint8Array({ maxLength: publicKeyLength, minLength: publicKeyLength }),
  ],
  (
    t,
    mainnet: boolean,
    depth: number,
    childIndex: number,
    parentFingerprint: Uint8Array,
    chainCode: Uint8Array,
    publicKey: Uint8Array,
    // eslint-disable-next-line @typescript-eslint/max-params
  ) => {
    const parameters: DecodedHdKey<HdPublicNodeValid> = {
      network: mainnet ? 'mainnet' : 'testnet',
      node: {
        chainCode,
        childIndex,
        depth,
        parentFingerprint,
        publicKey,
      },
    };
    const encoded = encodeHdPublicKey(parameters, { throwErrors: false });
    if (typeof encoded === 'string') {
      t.throws(
        () => {
          encodeHdPublicKey(parameters);
        },
        { message: encoded },
        `parameters: ${stringifyTestVector(parameters)}`,
      );
      return;
    }
    const decoded = decodeHdPublicKey(encoded.hdPublicKey);
    if (typeof decoded === 'string') {
      t.fail(`decoded: ${stringify(decoded)}`);
      return;
    }
    t.deepEqual(encoded.hdPublicKey, encodeHdPublicKey(decoded).hdPublicKey);
  },
);

testProp(
  '[fast-check] [crypto] derive non-hardened HD node <-> crack HD node',
  [
    fc.integer({ max: maximumDepth, min: 0 }),
    fc.integer({ max: maximumNonHardenedIndex, min: 0 }),
    fc.uint8Array({
      maxLength: fingerprintLength,
      minLength: fingerprintLength,
    }),
    fc.uint8Array({ maxLength: chainCodeLength, minLength: chainCodeLength }),
    fc.uint8Array({ maxLength: privateKeyLength, minLength: privateKeyLength }),
  ],
  (
    t,
    depth: number,
    childIndexes: number,
    parentFingerprint: Uint8Array,
    chainCode: Uint8Array,
    privateKey: Uint8Array,
    // eslint-disable-next-line @typescript-eslint/max-params
  ) => {
    if (!validateSecp256k1PrivateKey(privateKey)) {
      t.pass();
      return;
    }
    const parameters: DecodedHdKey<HdPrivateNodeValid> = {
      network: 'mainnet',
      node: {
        chainCode,
        childIndex: childIndexes,
        depth,
        parentFingerprint,
        privateKey,
      },
    };
    const encoded = encodeHdPrivateKey(parameters, { throwErrors: false });
    if (typeof encoded === 'string') {
      t.pass();
      return;
    }
    const parentXprv = encoded.hdPrivateKey;
    const decoded = decodeHdPrivateKey(parentXprv);
    if (typeof decoded === 'string') {
      t.fail(
        `parameters: ${stringifyTestVector(
          parameters,
        )}\n\n parentXprv: ${parentXprv}\n\n decoded: ${decoded}`,
      );
      return;
    }
    const { node: parentPrivateNode } = decoded;
    const parentPublicNode = deriveHdPublicNode(parentPrivateNode);

    const nonHardenedChildNode = deriveHdPrivateNodeChild(
      parentPrivateNode,
      childIndexes,
    ) as HdPrivateNodeValid;

    const crackedParentNode =
      crackHdPrivateNodeFromHdPublicNodeAndChildPrivateNode(
        parentPublicNode,
        nonHardenedChildNode,
      ) as HdPrivateNodeValid;
    const crackedXprv = encodeHdPrivateKey({
      network: 'mainnet',
      node: crackedParentNode,
    }).hdPrivateKey;

    t.deepEqual(parentXprv, crackedXprv);
  },
);
