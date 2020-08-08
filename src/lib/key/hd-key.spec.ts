/* eslint-disable functional/no-expression-statement */

import test, { Macro } from 'ava';
import { fc, testProp } from 'ava-fast-check';
import * as bitcoreLibCash from 'bitcore-lib-cash';

import {
  crackHdPrivateNodeFromHdPublicNodeAndChildPrivateNode,
  decodeHdKey,
  decodeHdPrivateKey,
  decodeHdPublicKey,
  deriveHdPath,
  deriveHdPrivateNodeChild,
  deriveHdPrivateNodeFromSeed,
  deriveHdPrivateNodeIdentifier,
  deriveHdPublicNode,
  deriveHdPublicNodeChild,
  deriveHdPublicNodeIdentifier,
  encodeHdPrivateKey,
  encodeHdPublicKey,
  HdKeyDecodingError,
  HdKeyParameters,
  HdKeyVersion,
  HdNodeCrackingError,
  HdNodeDerivationError,
  HdPrivateNode,
  HdPrivateNodeInvalid,
  HdPrivateNodeKnownParent,
  HdPrivateNodeValid,
  HdPublicNode,
  hexToBin,
  instantiateBIP32Crypto,
  validateSecp256k1PrivateKey,
} from '../lib';

const seed = Uint8Array.from([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

const xprv =
  'xprv9s21ZrQH143K2JbpEjGU94NcdKSASB7LuXvJCTsxuENcGN1nVG7QjMnBZ6zZNcJaiJogsRaLaYFFjs48qt4Fg7y1GnmrchQt1zFNu6QVnta';
const tprv =
  'tprv8ZgxMBicQKsPd7qLuJ7yJhzbwSrNfh9MF5qR4tJRPCs63xksUdTAF79dUHADNygu5kLTsXC6jtq4Cibsy6QCVBEboRzAH48vw5zoLkJTuso';
const xpub =
  'xpub661MyMwAqRbcEngHLkoUWCKMBMGeqdqCGkqtzrHaTZub9ALw2oRfHA6fQP5n5X9VHStaNTBYomkSb8BFhUGavwD3RG1qvMkEKceTavTp2Tm';
const tpub =
  'tpubD6NzVbkrYhZ4Was8nwnZi7eiWUNJq2LFpPSCMQLioUfUtT1e72GkRbmVeRAZc26j5MRUz2hRLsaVHJfs6L7ppNfLUrm9btQTuaEsLrT7D87';

const maxUint8Number = 255;
const fcUint8Array = (minLength: number, maxLength: number) =>
  fc
    .array(fc.integer(0, maxUint8Number), minLength, maxLength)
    .map((a) => Uint8Array.from(a));

const maximumDepth = 255;
const maximumChildIndex = 0xffffffff;
const fingerprintLength = 4;
const chainCodeLength = 32;
const privateKeyLength = 32;
const publicKeyLength = 33;
const hardenedIndexOffset = 0x80000000;
const maximumNonHardenedIndex = hardenedIndexOffset - 1;

test('[crypto] deriveHdPrivateNodeFromSeed', async (t) => {
  const crypto = await instantiateBIP32Crypto();
  const valid = {
    chainCode: hexToBin(
      '18aab7e9ef169f3029d93651d0c85303cbcc2ac559ccd04c324a2e678ef26dc9'
    ),
    childIndex: 0,
    depth: 0,
    parentFingerprint: hexToBin('00000000'),
    privateKey: hexToBin(
      '330fd355e141910d33bbe84c369b87a209dd18b81095912be766b2b5a9d72bc4'
    ),
    valid: true,
  } as HdPrivateNodeValid;
  const invalid = {
    chainCode: hexToBin(
      '18aab7e9ef169f3029d93651d0c85303cbcc2ac559ccd04c324a2e678ef26dc9'
    ),
    childIndex: 0,
    depth: 0,
    invalidPrivateKey: hexToBin(
      '330fd355e141910d33bbe84c369b87a209dd18b81095912be766b2b5a9d72bc4'
    ),
    parentFingerprint: hexToBin('00000000'),
    valid: false,
  } as HdPrivateNodeInvalid;
  const either = deriveHdPrivateNodeFromSeed(crypto, seed);
  const validNode = deriveHdPrivateNodeFromSeed(crypto, seed, true);
  const invalidNode = deriveHdPrivateNodeFromSeed(crypto, seed, false);

  t.deepEqual(either, valid as HdPrivateNode);
  t.deepEqual(validNode, valid);
  t.deepEqual(invalidNode, invalid);
});

test('[crypto] deriveHdPrivateNodeIdentifier', async (t) => {
  const crypto = await instantiateBIP32Crypto();
  const { node } = decodeHdPrivateKey(crypto, xprv) as HdKeyParameters<
    HdPrivateNodeValid
  >;
  t.deepEqual(
    deriveHdPrivateNodeIdentifier(crypto, node),
    hexToBin('15c918d389673c6cd0660050f268a843361e1111')
  );
});

test('[crypto] deriveHdPublicNodeIdentifier', async (t) => {
  const crypto = await instantiateBIP32Crypto();
  const { node } = decodeHdPublicKey(crypto, xpub) as HdKeyParameters<
    HdPublicNode
  >;
  t.deepEqual(
    deriveHdPublicNodeIdentifier(crypto, node),
    hexToBin('15c918d389673c6cd0660050f268a843361e1111')
  );
});

test('[crypto] decodeHdKey', async (t) => {
  const crypto = await instantiateBIP32Crypto();
  t.deepEqual(decodeHdKey(crypto, xprv), {
    node: {
      chainCode: hexToBin(
        '18aab7e9ef169f3029d93651d0c85303cbcc2ac559ccd04c324a2e678ef26dc9'
      ),
      childIndex: 0,
      depth: 0,
      parentFingerprint: hexToBin('00000000'),
      privateKey: hexToBin(
        '330fd355e141910d33bbe84c369b87a209dd18b81095912be766b2b5a9d72bc4'
      ),
      valid: true,
    },
    version: HdKeyVersion.mainnetPrivateKey,
  });
  t.deepEqual(decodeHdKey(crypto, xpub), {
    node: {
      chainCode: hexToBin(
        '18aab7e9ef169f3029d93651d0c85303cbcc2ac559ccd04c324a2e678ef26dc9'
      ),
      childIndex: 0,
      depth: 0,
      parentFingerprint: hexToBin('00000000'),
      publicKey: hexToBin(
        '02be99138b48b430a8ee40bf8b56c8ebc584c363774010a9bfe549a87126e61746'
      ),
    },
    version: HdKeyVersion.mainnetPublicKey,
  });
});

test('[crypto] decodeHdKey: errors', async (t) => {
  const crypto = await instantiateBIP32Crypto();
  t.deepEqual(
    decodeHdKey(crypto, '#badKey'),
    HdKeyDecodingError.unknownCharacter
  );
  t.deepEqual(
    decodeHdKey(crypto, 'xprv1234'),
    HdKeyDecodingError.incorrectLength
  );
  t.deepEqual(
    decodeHdKey(
      crypto,
      'xpub661MyMwAqRbcEngHLkoUWCKMBMGeqdqCGkqtzrHaTZub9ALw2oRfHA6fQP5n5X9VHStaNTBYomkSb8BFhUGavwD3RG1qvMkEKceTavTp2Ta'
    ),
    HdKeyDecodingError.invalidChecksum
  );
});

test('[crypto] decodeHdPrivateKey', async (t) => {
  const crypto = await instantiateBIP32Crypto();
  t.deepEqual(decodeHdPrivateKey(crypto, xprv), {
    network: 'mainnet',
    node: {
      chainCode: hexToBin(
        '18aab7e9ef169f3029d93651d0c85303cbcc2ac559ccd04c324a2e678ef26dc9'
      ),
      childIndex: 0,
      depth: 0,
      parentFingerprint: hexToBin('00000000'),
      privateKey: hexToBin(
        '330fd355e141910d33bbe84c369b87a209dd18b81095912be766b2b5a9d72bc4'
      ),
      valid: true,
    },
  });
  t.deepEqual(decodeHdPrivateKey(crypto, tprv), {
    network: 'testnet',
    node: {
      chainCode: hexToBin(
        '18aab7e9ef169f3029d93651d0c85303cbcc2ac559ccd04c324a2e678ef26dc9'
      ),
      childIndex: 0,
      depth: 0,
      parentFingerprint: hexToBin('00000000'),
      privateKey: hexToBin(
        '330fd355e141910d33bbe84c369b87a209dd18b81095912be766b2b5a9d72bc4'
      ),
      valid: true,
    },
  });
});

test('[crypto] decodeHdPrivateKey: errors', async (t) => {
  const crypto = await instantiateBIP32Crypto();
  t.deepEqual(
    decodeHdPrivateKey(crypto, xpub),
    HdKeyDecodingError.privateKeyExpected
  );
  t.deepEqual(
    decodeHdPrivateKey(
      crypto,
      '1111111111111FF9QeH94hg7KAjgjUqkHUqbrw5wWQLoRNfRhB4cHUDCJxx2HfNb5qDiAjpbKjXeLJSknuzDmja42174H9Es1XbY24sZts9'
    ),
    HdKeyDecodingError.unknownVersion
  );
  const xprvWith0FilledKey =
    'xprv9s21ZrQH143K2JbpEjGU94NcdKSASB7LuXvJCTsxuENcGN1nVG7QjMnBZ6c54tCKNErugtr5mi7oyGaDVrYe4SE5u1GnzYHmjDKuKg4vuNm';
  t.deepEqual(
    decodeHdPrivateKey(crypto, xprvWith0FilledKey),
    HdKeyDecodingError.invalidPrivateNode
  );
  const xprvWith255FilledKey =
    'xprv9s21ZrQH143K2JbpEjGU94NcdKSASB7LuXvJCTsxuENcGN1nVG7QjMnBZ8YpF7eMDfY8piRngHjovbAzQyAMi94xgeLuEgyfisLHpC7G5ST';

  t.deepEqual(
    decodeHdPrivateKey(crypto, xprvWith255FilledKey),
    HdKeyDecodingError.invalidPrivateNode
  );
  t.deepEqual(
    decodeHdPrivateKey(
      crypto,
      'xprv9s21ZrQH143K2JbpEjGU94NcdKSASB7LuXvJCTsxuENcGN1nVG7QjMnBhegPMjkj1oGSFcmBkMX3xdwcMy6NSgrHvmqJptpUW5xGjg7kifZ'
    ),
    HdKeyDecodingError.missingPrivateKeyPaddingByte
  );
});

test('[crypto] decodeHdPublicKey', async (t) => {
  const crypto = await instantiateBIP32Crypto();
  t.deepEqual(decodeHdPublicKey(crypto, xpub), {
    network: 'mainnet',
    node: {
      chainCode: hexToBin(
        '18aab7e9ef169f3029d93651d0c85303cbcc2ac559ccd04c324a2e678ef26dc9'
      ),
      childIndex: 0,
      depth: 0,
      parentFingerprint: hexToBin('00000000'),
      publicKey: hexToBin(
        '02be99138b48b430a8ee40bf8b56c8ebc584c363774010a9bfe549a87126e61746'
      ),
    },
  });
  t.deepEqual(decodeHdPublicKey(crypto, tpub), {
    network: 'testnet',
    node: {
      chainCode: hexToBin(
        '18aab7e9ef169f3029d93651d0c85303cbcc2ac559ccd04c324a2e678ef26dc9'
      ),
      childIndex: 0,
      depth: 0,
      parentFingerprint: hexToBin('00000000'),
      publicKey: hexToBin(
        '02be99138b48b430a8ee40bf8b56c8ebc584c363774010a9bfe549a87126e61746'
      ),
    },
  });
});

test('[crypto] decodeHdPublicKey: errors', async (t) => {
  const crypto = await instantiateBIP32Crypto();
  t.deepEqual(
    decodeHdPublicKey(crypto, xprv),
    HdKeyDecodingError.publicKeyExpected
  );
  t.deepEqual(
    decodeHdPublicKey(
      crypto,
      '1111111111111FF9QeH94hg7KAjgjUqkHUqbrw5wWQLoRNfRhB4cHUDCJxx2HfNb5qDiAjpbKjXeLJSknuzDmja42174H9Es1XbY24sZts9'
    ),
    HdKeyDecodingError.unknownVersion
  );
});

test('[crypto] encodeHdPrivateKey', async (t) => {
  const crypto = await instantiateBIP32Crypto();
  t.deepEqual(
    encodeHdPrivateKey(crypto, {
      network: 'mainnet',
      node: {
        chainCode: hexToBin(
          '18aab7e9ef169f3029d93651d0c85303cbcc2ac559ccd04c324a2e678ef26dc9'
        ),
        childIndex: 0,
        depth: 0,
        parentFingerprint: hexToBin('00000000'),
        privateKey: hexToBin(
          '330fd355e141910d33bbe84c369b87a209dd18b81095912be766b2b5a9d72bc4'
        ),
        valid: true,
      },
    }),
    xprv
  );

  t.deepEqual(
    encodeHdPrivateKey(crypto, {
      network: 'testnet',
      node: {
        chainCode: hexToBin(
          '18aab7e9ef169f3029d93651d0c85303cbcc2ac559ccd04c324a2e678ef26dc9'
        ),
        childIndex: 0,
        depth: 0,
        parentFingerprint: hexToBin('00000000'),
        privateKey: hexToBin(
          '330fd355e141910d33bbe84c369b87a209dd18b81095912be766b2b5a9d72bc4'
        ),
        valid: true,
      },
    }),
    tprv
  );
});

test('[crypto] encodeHdPublicKey', async (t) => {
  const crypto = await instantiateBIP32Crypto();
  t.deepEqual(
    encodeHdPublicKey(crypto, {
      network: 'mainnet',
      node: {
        chainCode: hexToBin(
          '18aab7e9ef169f3029d93651d0c85303cbcc2ac559ccd04c324a2e678ef26dc9'
        ),
        childIndex: 0,
        depth: 0,
        parentFingerprint: hexToBin('00000000'),
        publicKey: hexToBin(
          '02be99138b48b430a8ee40bf8b56c8ebc584c363774010a9bfe549a87126e61746'
        ),
      },
    }),
    xpub
  );
  t.deepEqual(
    encodeHdPublicKey(crypto, {
      network: 'testnet',
      node: {
        chainCode: hexToBin(
          '18aab7e9ef169f3029d93651d0c85303cbcc2ac559ccd04c324a2e678ef26dc9'
        ),
        childIndex: 0,
        depth: 0,
        parentFingerprint: hexToBin('00000000'),
        publicKey: hexToBin(
          '02be99138b48b430a8ee40bf8b56c8ebc584c363774010a9bfe549a87126e61746'
        ),
      },
    }),
    tpub
  );
});

test('[crypto] deriveHdPublicNode', async (t) => {
  const crypto = await instantiateBIP32Crypto();
  const privateParams = decodeHdPrivateKey(crypto, xprv);
  if (typeof privateParams === 'string') {
    t.fail(privateParams);
    return;
  }
  t.deepEqual(deriveHdPublicNode(crypto, privateParams.node), {
    chainCode: hexToBin(
      '18aab7e9ef169f3029d93651d0c85303cbcc2ac559ccd04c324a2e678ef26dc9'
    ),
    childIndex: 0,
    depth: 0,
    parentFingerprint: hexToBin('00000000'),
    publicKey: hexToBin(
      '02be99138b48b430a8ee40bf8b56c8ebc584c363774010a9bfe549a87126e61746'
    ),
  });
});

test('[crypto] deriveHdPrivateNodeChild', async (t) => {
  const crypto = await instantiateBIP32Crypto();
  const master = decodeHdPrivateKey(crypto, xprv);

  const hardenedIndex0Child = decodeHdPrivateKey(
    crypto,
    'xprv9u4S6TaiPQaF7FS24QFpRP6hjff4jXNwwYTkVNC6f6YzHj2a6G28aRN1D6Az82SxMeBivpVS3gDDXyQiu3RANTqWy34Zxi9JN76zSwkjqPF'
  );

  const index1GrandChild = decodeHdPrivateKey(
    crypto,
    'xprv9w8PdihBAeR4xgGYWWqBnmDTrpWEW1QjuYAUkR7A6X48q1iQVgN433aSFxQGgtureVz7cCyi5zfuMTtBF3AkanjtvNs9m8u2JobxNfphSi3'
  );

  if (
    typeof master === 'string' ||
    typeof hardenedIndex0Child === 'string' ||
    typeof index1GrandChild === 'string'
  ) {
    t.fail();
    return;
  }

  const hardenedIndex0 = 0x80000000;
  const result0 = deriveHdPrivateNodeChild(
    crypto,
    master.node,
    hardenedIndex0
  ) as HdPrivateNodeValid;

  const result1 = deriveHdPrivateNodeChild(crypto, result0, 1);

  t.deepEqual(result0, {
    ...hardenedIndex0Child.node,
    parentIdentifier: hexToBin('15c918d389673c6cd0660050f268a843361e1111'),
  });
  t.deepEqual(result1, {
    ...index1GrandChild.node,
    parentIdentifier: hexToBin('2f2bc501c943dd7f17904b612c090dd88270cc59'),
  });
});

test('[crypto] deriveHdPrivateNodeChild: errors', async (t) => {
  const crypto = await instantiateBIP32Crypto();
  const { node } = decodeHdPrivateKey(crypto, xprv) as HdKeyParameters<
    HdPrivateNodeValid
  >;

  const max = 0xffffffff;
  t.deepEqual(
    deriveHdPrivateNodeChild(crypto, node, max + 1),
    HdNodeDerivationError.childIndexExceedsMaximum
  );
});

test('[crypto] deriveHdPublicNodeChild', async (t) => {
  const crypto = await instantiateBIP32Crypto();
  const { node } = decodeHdPrivateKey(crypto, xprv) as HdKeyParameters<
    HdPrivateNodeValid
  >;

  const parentPublic = deriveHdPublicNode(crypto, node);

  const derivationIndex = 0;

  const child = deriveHdPrivateNodeChild(
    crypto,
    node,
    derivationIndex
  ) as HdPrivateNodeKnownParent;

  const expectedPublic = deriveHdPublicNode(crypto, child);

  t.deepEqual(
    deriveHdPublicNodeChild(crypto, parentPublic, derivationIndex),
    expectedPublic
  );
});

test('[crypto] deriveHdPublicNodeChild: errors', async (t) => {
  const crypto = await instantiateBIP32Crypto();
  const { node } = decodeHdPublicKey(crypto, xpub) as HdKeyParameters<
    HdPublicNode
  >;
  const hardened0 = 0x80000000;
  t.deepEqual(
    deriveHdPublicNodeChild(crypto, node, hardened0),
    HdNodeDerivationError.hardenedDerivationRequiresPrivateNode
  );
});

test('[crypto] deriveHdPath', async (t) => {
  const crypto = await instantiateBIP32Crypto();
  const { node: privateNode } = decodeHdPrivateKey(
    crypto,
    xprv
  ) as HdKeyParameters<HdPrivateNodeValid>;
  const publicNode = deriveHdPublicNode(crypto, privateNode);
  t.deepEqual(
    deriveHdPath(crypto, privateNode, 'm') as HdPrivateNodeValid,
    privateNode
  );
  t.deepEqual(
    deriveHdPath(crypto, publicNode, 'M') as HdPublicNode,
    publicNode
  );
  t.deepEqual(deriveHdPath(crypto, privateNode, "m/0'/1"), {
    ...(decodeHdPrivateKey(
      crypto,
      'xprv9w8PdihBAeR4xgGYWWqBnmDTrpWEW1QjuYAUkR7A6X48q1iQVgN433aSFxQGgtureVz7cCyi5zfuMTtBF3AkanjtvNs9m8u2JobxNfphSi3'
    ) as HdKeyParameters<HdPrivateNodeValid>).node,
    parentIdentifier: hexToBin('2f2bc501c943dd7f17904b612c090dd88270cc59'),
  });
  t.deepEqual(
    deriveHdPath(crypto, publicNode, 'M/0/1/2/3'),
    deriveHdPublicNode(
      crypto,
      deriveHdPath(crypto, privateNode, 'm/0/1/2/3') as HdPrivateNodeKnownParent
    )
  );
  t.deepEqual(
    deriveHdPath(crypto, privateNode, "m/0'/1'/2'/3'"),
    deriveHdPath(
      crypto,
      privateNode,
      'm/2147483648/2147483649/2147483650/2147483651'
    )
  );
});

test('[crypto] deriveHdPath: errors', async (t) => {
  const crypto = await instantiateBIP32Crypto();
  const { node: privateNode } = decodeHdPrivateKey(
    crypto,
    xprv
  ) as HdKeyParameters<HdPrivateNodeValid>;
  const publicNode = deriveHdPublicNode(crypto, privateNode);

  t.deepEqual(
    deriveHdPath(crypto, privateNode, 'm/bad/1'),
    HdNodeDerivationError.invalidDerivationPath
  );
  t.deepEqual(
    deriveHdPath(crypto, privateNode, 'M'),
    HdNodeDerivationError.invalidPrivateDerivationPrefix
  );
  t.deepEqual(
    deriveHdPath(crypto, publicNode, 'm'),
    HdNodeDerivationError.invalidPublicDerivationPrefix
  );
  t.deepEqual(
    deriveHdPath(crypto, privateNode, 'm/0/4294967296/0'),
    HdNodeDerivationError.childIndexExceedsMaximum
  );
  t.deepEqual(
    deriveHdPath(crypto, publicNode, "M/0/0'/0"),
    HdNodeDerivationError.hardenedDerivationRequiresPrivateNode
  );
  t.deepEqual(
    deriveHdPath(crypto, publicNode, 'M/0/2147483648/0'),
    HdNodeDerivationError.hardenedDerivationRequiresPrivateNode
  );
});

test('[crypto] crackHdPrivateNodeFromHdPublicNodeAndChildPrivateNode', async (t) => {
  const crypto = await instantiateBIP32Crypto();
  const { node: parentPrivateNode } = decodeHdPrivateKey(
    crypto,
    xprv
  ) as HdKeyParameters<HdPrivateNodeValid>;
  const parentPublicNode = deriveHdPublicNode(crypto, parentPrivateNode);

  const nonHardenedChildNode = deriveHdPath(
    crypto,
    parentPrivateNode,
    'm/1234'
  ) as HdPrivateNodeKnownParent;

  const hardenedChildNode = deriveHdPath(
    crypto,
    parentPrivateNode,
    "m/1234'"
  ) as HdPrivateNodeKnownParent;

  const hardenedChildPublicNode = deriveHdPublicNode(crypto, hardenedChildNode);

  const nonHardenedGrandchildNode = deriveHdPath(
    crypto,
    hardenedChildNode,
    'm/1234'
  ) as HdPrivateNodeKnownParent;

  t.deepEqual(
    crackHdPrivateNodeFromHdPublicNodeAndChildPrivateNode(
      crypto,
      parentPublicNode,
      nonHardenedChildNode
    ),
    parentPrivateNode
  );

  t.deepEqual(
    crackHdPrivateNodeFromHdPublicNodeAndChildPrivateNode(
      crypto,
      hardenedChildPublicNode,
      nonHardenedGrandchildNode
    ),
    hardenedChildNode
  );

  t.deepEqual(
    crackHdPrivateNodeFromHdPublicNodeAndChildPrivateNode(
      crypto,
      parentPublicNode,
      hardenedChildNode
    ),
    HdNodeCrackingError.cannotCrackHardenedDerivation
  );
});

// eslint-disable-next-line complexity
const bip32Vector: Macro<[string, string, string, string]> = async (
  t,
  seedHex,
  path,
  hdPrivateKey,
  hdPublicKey
  // eslint-disable-next-line max-params
) => {
  const crypto = await instantiateBIP32Crypto();

  const master = deriveHdPrivateNodeFromSeed(crypto, hexToBin(seedHex));

  if (!master.valid) {
    t.log(seedHex, master.invalidPrivateKey);
    t.fail('Astronomically rare hash found!');
    return;
  }

  const childNode = deriveHdPath(crypto, master, path);

  if (typeof childNode === 'string') {
    t.fail(childNode);
    return;
  }

  const vectorXprv = encodeHdPrivateKey(crypto, {
    network: 'mainnet',
    node: childNode,
  });
  t.deepEqual(vectorXprv, hdPrivateKey);

  const decodedPrivate = decodeHdPrivateKey(crypto, hdPrivateKey);
  if (typeof decodedPrivate === 'string') {
    t.fail(decodedPrivate);
    return;
  }
  t.deepEqual(
    childNode.parentIdentifier?.slice(0, fingerprintLength),
    path === 'm' ? undefined : decodedPrivate.node.parentFingerprint
  );
  t.deepEqual(childNode, {
    ...decodedPrivate.node,
    ...(path === 'm' ? {} : { parentIdentifier: childNode.parentIdentifier }),
  });

  const decodedPublic = decodeHdPublicKey(crypto, hdPublicKey);
  if (typeof decodedPublic === 'string') {
    t.fail(decodedPublic);
    return;
  }
  const publicNode = deriveHdPublicNode(crypto, childNode);
  t.deepEqual(
    publicNode.parentIdentifier?.slice(0, fingerprintLength),
    path === 'm' ? undefined : decodedPublic.node.parentFingerprint
  );
  t.deepEqual(publicNode, {
    ...decodedPublic.node,
    ...(path === 'm' ? {} : { parentIdentifier: publicNode.parentIdentifier }),
  });

  const vectorXpub = encodeHdPublicKey(crypto, {
    network: 'mainnet',
    node: publicNode,
  });
  t.deepEqual(vectorXpub, hdPublicKey);
};

// eslint-disable-next-line functional/immutable-data
bip32Vector.title = (title, _, path) =>
  `[crypto] BIP32 Vector – ${title ?? ''}: ${path}`;

test(
  '#1.1',
  bip32Vector,
  '000102030405060708090a0b0c0d0e0f',
  'm',
  'xprv9s21ZrQH143K3QTDL4LXw2F7HEK3wJUD2nW2nRk4stbPy6cq3jPPqjiChkVvvNKmPGJxWUtg6LnF5kejMRNNU3TGtRBeJgk33yuGBxrMPHi',
  'xpub661MyMwAqRbcFtXgS5sYJABqqG9YLmC4Q1Rdap9gSE8NqtwybGhePY2gZ29ESFjqJoCu1Rupje8YtGqsefD265TMg7usUDFdp6W1EGMcet8'
);

test(
  '#1.2',
  bip32Vector,
  '000102030405060708090a0b0c0d0e0f',
  "m/0'",
  'xprv9uHRZZhk6KAJC1avXpDAp4MDc3sQKNxDiPvvkX8Br5ngLNv1TxvUxt4cV1rGL5hj6KCesnDYUhd7oWgT11eZG7XnxHrnYeSvkzY7d2bhkJ7',
  'xpub68Gmy5EdvgibQVfPdqkBBCHxA5htiqg55crXYuXoQRKfDBFA1WEjWgP6LHhwBZeNK1VTsfTFUHCdrfp1bgwQ9xv5ski8PX9rL2dZXvgGDnw'
);

test(
  '#1.3',
  bip32Vector,
  '000102030405060708090a0b0c0d0e0f',
  "m/0'/1",
  'xprv9wTYmMFdV23N2TdNG573QoEsfRrWKQgWeibmLntzniatZvR9BmLnvSxqu53Kw1UmYPxLgboyZQaXwTCg8MSY3H2EU4pWcQDnRnrVA1xe8fs',
  'xpub6ASuArnXKPbfEwhqN6e3mwBcDTgzisQN1wXN9BJcM47sSikHjJf3UFHKkNAWbWMiGj7Wf5uMash7SyYq527Hqck2AxYysAA7xmALppuCkwQ'
);

test(
  '#1.4',
  bip32Vector,
  '000102030405060708090a0b0c0d0e0f',
  "m/0'/1/2'",
  'xprv9z4pot5VBttmtdRTWfWQmoH1taj2axGVzFqSb8C9xaxKymcFzXBDptWmT7FwuEzG3ryjH4ktypQSAewRiNMjANTtpgP4mLTj34bhnZX7UiM',
  'xpub6D4BDPcP2GT577Vvch3R8wDkScZWzQzMMUm3PWbmWvVJrZwQY4VUNgqFJPMM3No2dFDFGTsxxpG5uJh7n7epu4trkrX7x7DogT5Uv6fcLW5'
);

test(
  '#1.5',
  bip32Vector,
  '000102030405060708090a0b0c0d0e0f',
  "m/0'/1/2'/2",
  'xprvA2JDeKCSNNZky6uBCviVfJSKyQ1mDYahRjijr5idH2WwLsEd4Hsb2Tyh8RfQMuPh7f7RtyzTtdrbdqqsunu5Mm3wDvUAKRHSC34sJ7in334',
  'xpub6FHa3pjLCk84BayeJxFW2SP4XRrFd1JYnxeLeU8EqN3vDfZmbqBqaGJAyiLjTAwm6ZLRQUMv1ZACTj37sR62cfN7fe5JnJ7dh8zL4fiyLHV'
);

test(
  '#1.6',
  bip32Vector,
  '000102030405060708090a0b0c0d0e0f',
  "m/0'/1/2'/2/1000000000",
  'xprvA41z7zogVVwxVSgdKUHDy1SKmdb533PjDz7J6N6mV6uS3ze1ai8FHa8kmHScGpWmj4WggLyQjgPie1rFSruoUihUZREPSL39UNdE3BBDu76',
  'xpub6H1LXWLaKsWFhvm6RVpEL9P4KfRZSW7abD2ttkWP3SSQvnyA8FSVqNTEcYFgJS2UaFcxupHiYkro49S8yGasTvXEYBVPamhGW6cFJodrTHy'
);

test(
  '#2.1',
  bip32Vector,
  'fffcf9f6f3f0edeae7e4e1dedbd8d5d2cfccc9c6c3c0bdbab7b4b1aeaba8a5a29f9c999693908d8a8784817e7b7875726f6c696663605d5a5754514e4b484542',
  'm',
  'xprv9s21ZrQH143K31xYSDQpPDxsXRTUcvj2iNHm5NUtrGiGG5e2DtALGdso3pGz6ssrdK4PFmM8NSpSBHNqPqm55Qn3LqFtT2emdEXVYsCzC2U',
  'xpub661MyMwAqRbcFW31YEwpkMuc5THy2PSt5bDMsktWQcFF8syAmRUapSCGu8ED9W6oDMSgv6Zz8idoc4a6mr8BDzTJY47LJhkJ8UB7WEGuduB'
);

test(
  '#2.2',
  bip32Vector,
  'fffcf9f6f3f0edeae7e4e1dedbd8d5d2cfccc9c6c3c0bdbab7b4b1aeaba8a5a29f9c999693908d8a8784817e7b7875726f6c696663605d5a5754514e4b484542',
  'm/0',
  'xprv9vHkqa6EV4sPZHYqZznhT2NPtPCjKuDKGY38FBWLvgaDx45zo9WQRUT3dKYnjwih2yJD9mkrocEZXo1ex8G81dwSM1fwqWpWkeS3v86pgKt',
  'xpub69H7F5d8KSRgmmdJg2KhpAK8SR3DjMwAdkxj3ZuxV27CprR9LgpeyGmXUbC6wb7ERfvrnKZjXoUmmDznezpbZb7ap6r1D3tgFxHmwMkQTPH'
);

test(
  '#2.3',
  bip32Vector,
  'fffcf9f6f3f0edeae7e4e1dedbd8d5d2cfccc9c6c3c0bdbab7b4b1aeaba8a5a29f9c999693908d8a8784817e7b7875726f6c696663605d5a5754514e4b484542',
  "m/0/2147483647'",
  'xprv9wSp6B7kry3Vj9m1zSnLvN3xH8RdsPP1Mh7fAaR7aRLcQMKTR2vidYEeEg2mUCTAwCd6vnxVrcjfy2kRgVsFawNzmjuHc2YmYRmagcEPdU9',
  'xpub6ASAVgeehLbnwdqV6UKMHVzgqAG8Gr6riv3Fxxpj8ksbH9ebxaEyBLZ85ySDhKiLDBrQSARLq1uNRts8RuJiHjaDMBU4Zn9h8LZNnBC5y4a'
);

test(
  '#2.4',
  bip32Vector,
  'fffcf9f6f3f0edeae7e4e1dedbd8d5d2cfccc9c6c3c0bdbab7b4b1aeaba8a5a29f9c999693908d8a8784817e7b7875726f6c696663605d5a5754514e4b484542',
  "m/0/2147483647'/1",
  'xprv9zFnWC6h2cLgpmSA46vutJzBcfJ8yaJGg8cX1e5StJh45BBciYTRXSd25UEPVuesF9yog62tGAQtHjXajPPdbRCHuWS6T8XA2ECKADdw4Ef',
  'xpub6DF8uhdarytz3FWdA8TvFSvvAh8dP3283MY7p2V4SeE2wyWmG5mg5EwVvmdMVCQcoNJxGoWaU9DCWh89LojfZ537wTfunKau47EL2dhHKon'
);

test(
  '#2.5',
  bip32Vector,
  'fffcf9f6f3f0edeae7e4e1dedbd8d5d2cfccc9c6c3c0bdbab7b4b1aeaba8a5a29f9c999693908d8a8784817e7b7875726f6c696663605d5a5754514e4b484542',
  "m/0/2147483647'/1/2147483646'",
  'xprvA1RpRA33e1JQ7ifknakTFpgNXPmW2YvmhqLQYMmrj4xJXXWYpDPS3xz7iAxn8L39njGVyuoseXzU6rcxFLJ8HFsTjSyQbLYnMpCqE2VbFWc',
  'xpub6ERApfZwUNrhLCkDtcHTcxd75RbzS1ed54G1LkBUHQVHQKqhMkhgbmJbZRkrgZw4koxb5JaHWkY4ALHY2grBGRjaDMzQLcgJvLJuZZvRcEL'
);

test(
  '#2.6',
  bip32Vector,
  'fffcf9f6f3f0edeae7e4e1dedbd8d5d2cfccc9c6c3c0bdbab7b4b1aeaba8a5a29f9c999693908d8a8784817e7b7875726f6c696663605d5a5754514e4b484542',
  "m/0/2147483647'/1/2147483646'/2",
  'xprvA2nrNbFZABcdryreWet9Ea4LvTJcGsqrMzxHx98MMrotbir7yrKCEXw7nadnHM8Dq38EGfSh6dqA9QWTyefMLEcBYJUuekgW4BYPJcr9E7j',
  'xpub6FnCn6nSzZAw5Tw7cgR9bi15UV96gLZhjDstkXXxvCLsUXBGXPdSnLFbdpq8p9HmGsApME5hQTZ3emM2rnY5agb9rXpVGyy3bdW6EEgAtqt'
);

test(
  '#3.1',
  bip32Vector,
  '4b381541583be4423346c643850da4b320e46a87ae3d2a4e6da11eba819cd4acba45d239319ac14f863b8d5ab5a0d0c64d2e8a1e7d1457df2e5a3c51c73235be',
  'm',
  'xprv9s21ZrQH143K25QhxbucbDDuQ4naNntJRi4KUfWT7xo4EKsHt2QJDu7KXp1A3u7Bi1j8ph3EGsZ9Xvz9dGuVrtHHs7pXeTzjuxBrCmmhgC6',
  'xpub661MyMwAqRbcEZVB4dScxMAdx6d4nFc9nvyvH3v4gJL378CSRZiYmhRoP7mBy6gSPSCYk6SzXPTf3ND1cZAceL7SfJ1Z3GC8vBgp2epUt13'
);

test(
  '#3.2',
  bip32Vector,
  '4b381541583be4423346c643850da4b320e46a87ae3d2a4e6da11eba819cd4acba45d239319ac14f863b8d5ab5a0d0c64d2e8a1e7d1457df2e5a3c51c73235be',
  "m/0'",
  'xprv9uPDJpEQgRQfDcW7BkF7eTya6RPxXeJCqCJGHuCJ4GiRVLzkTXBAJMu2qaMWPrS7AANYqdq6vcBcBUdJCVVFceUvJFjaPdGZ2y9WACViL4L',
  'xpub68NZiKmJWnxxS6aaHmn81bvJeTESw724CRDs6HbuccFQN9Ku14VQrADWgqbhhTHBaohPX4CjNLf9fq9MYo6oDaPPLPxSb7gwQN3ih19Zm4Y'
);

const fcBip32Path = () =>
  fc
    .array(fc.integer(0, maximumChildIndex), 1, maximumDepth)
    .map(
      (array) =>
        `m/${array
          .map((i) =>
            i > hardenedIndexOffset ? `${i - hardenedIndexOffset}'` : `${i}`
          )
          .join('/')}`
    );

testProp(
  '[fast-check] [crypto] HD key derivation is equivalent to bitcore-lib-cash',
  [fcBip32Path()],
  async (t, path: string) => {
    const crypto = await instantiateBIP32Crypto();
    const privateNode = (decodeHdPrivateKey(crypto, xprv) as HdKeyParameters<
      HdPrivateNodeValid
    >).node;
    const node = deriveHdPath(crypto, privateNode, path) as HdPrivateNodeValid;
    const publicNode = deriveHdPublicNode(crypto, node);

    const resultPrv = encodeHdPrivateKey(crypto, { network: 'mainnet', node });
    const resultPub = encodeHdPublicKey(crypto, {
      network: 'mainnet',
      node: publicNode,
    });
    // eslint-disable-next-line new-cap, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const bitcoreResult = bitcoreLibCash.HDPrivateKey(xprv).deriveChild(path);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const bitcorePrv = bitcoreResult.xprivkey;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const bitcorePub = bitcoreResult.xpubkey;

    t.deepEqual(resultPrv, bitcorePrv);
    t.deepEqual(resultPub, bitcorePub);
  },
  { numRuns: 10 }
);

testProp(
  '[fast-check] [crypto] encodeHdPublicKey <-> decodeHdPublicKey',
  [
    fc.boolean(),
    fc.integer(0, maximumDepth),
    fc.integer(0, maximumChildIndex),
    fcUint8Array(fingerprintLength, fingerprintLength),
    fcUint8Array(chainCodeLength, chainCodeLength),
    fcUint8Array(publicKeyLength, publicKeyLength),
  ],
  async (
    t,
    mainnet: boolean,
    depth: number,
    childIndex: number,
    parentFingerprint: Uint8Array,
    chainCode: Uint8Array,
    publicKey: Uint8Array
    // eslint-disable-next-line max-params
  ) => {
    const crypto = await instantiateBIP32Crypto();
    const encoded = encodeHdPublicKey(crypto, {
      network: mainnet ? 'mainnet' : 'testnet',
      node: {
        chainCode,
        childIndex,
        depth,
        parentFingerprint,
        publicKey,
      },
    });
    t.deepEqual(
      encoded,
      encodeHdPublicKey(
        crypto,
        decodeHdPublicKey(crypto, encoded) as HdKeyParameters<HdPublicNode>
      )
    );
  }
);

testProp(
  '[fast-check] [crypto] encodeHdPrivateKey <-> decodeHdPrivateKey',
  [
    fc.boolean(),
    fc.integer(0, maximumDepth),
    fc.integer(0, maximumChildIndex),
    fcUint8Array(fingerprintLength, fingerprintLength),
    fcUint8Array(chainCodeLength, chainCodeLength),
    fcUint8Array(privateKeyLength, privateKeyLength),
  ],
  async (
    t,
    mainnet: boolean,
    depth: number,
    childIndex: number,
    parentFingerprint: Uint8Array,
    chainCode: Uint8Array,
    privateKey: Uint8Array
    // eslint-disable-next-line max-params
  ) => {
    if (!validateSecp256k1PrivateKey(privateKey)) {
      t.pass();
      return;
    }
    const crypto = await instantiateBIP32Crypto();
    const encoded = encodeHdPrivateKey(crypto, {
      network: mainnet ? 'mainnet' : 'testnet',
      node: {
        chainCode,
        childIndex,
        depth,
        parentFingerprint,
        privateKey,
        valid: true,
      },
    });
    t.deepEqual(
      encoded,
      encodeHdPrivateKey(
        crypto,
        decodeHdPrivateKey(crypto, encoded) as HdKeyParameters<
          HdPrivateNodeValid
        >
      )
    );
  }
);

testProp(
  '[fast-check] [crypto] derive non-hardened HD node <-> crack HD node',
  [
    fc.integer(0, maximumDepth),
    fc.integer(0, maximumNonHardenedIndex),
    fcUint8Array(fingerprintLength, fingerprintLength),
    fcUint8Array(chainCodeLength, chainCodeLength),
    fcUint8Array(privateKeyLength, privateKeyLength),
  ],
  async (
    t,
    depth: number,
    childIndexes: number,
    parentFingerprint: Uint8Array,
    chainCode: Uint8Array,
    privateKey: Uint8Array
    // eslint-disable-next-line max-params
  ) => {
    const crypto = await instantiateBIP32Crypto();
    if (!validateSecp256k1PrivateKey(privateKey)) {
      t.pass();
      return;
    }
    const parentXprv = encodeHdPrivateKey(crypto, {
      network: 'mainnet',
      node: {
        chainCode,
        childIndex: childIndexes,
        depth,
        parentFingerprint,
        privateKey,
        valid: true,
      },
    });

    const { node: parentPrivateNode } = decodeHdPrivateKey(
      crypto,
      parentXprv
    ) as HdKeyParameters<HdPrivateNodeValid>;
    const parentPublicNode = deriveHdPublicNode(crypto, parentPrivateNode);

    const nonHardenedChildNode = deriveHdPrivateNodeChild(
      crypto,
      parentPrivateNode,
      childIndexes
    ) as HdPrivateNodeValid;

    const crackedParentNode = crackHdPrivateNodeFromHdPublicNodeAndChildPrivateNode(
      crypto,
      parentPublicNode,
      nonHardenedChildNode
    ) as HdPrivateNodeValid;
    const crackedXprv = encodeHdPrivateKey(crypto, {
      network: 'mainnet',
      node: crackedParentNode,
    });

    t.deepEqual(parentXprv, crackedXprv);
  }
);
