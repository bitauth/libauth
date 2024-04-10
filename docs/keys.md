# Keys

Libauth includes a variety of utilities for creating and working with private keys, including support for Wallet Import Format (WIF), BIP32 Hierarchical Deterministic (HD) Keys, and BIP39 Mnemonic Phrases.

> [!TIP]
> This guide introduces the most commonly used Key-related utilities. See [API Overview: Keys](../README.md#keys) for more, or the [API Reference](https://libauth.org/#md:api-overview) for a complete listing.

## Wallet Import Format (WIF)

Wallet Import Format (WIF) is the oldest format for encoding bitcoin private keys, [introduced in 2011](https://gitlab.com/bitcoin-cash-node/bitcoin-cash-node/-/commit/15a8590ecf6610387502be14d26657cb154d6201).

WIF can encode only one private key and does not guarantee any particular degree of error correction, though it does include a checksum with a very high likelihood of detecting short errors.

To generate and encode a private key using WIF:

```ts
import { encodePrivateKeyWif, generatePrivateKey } from '@bitauth/libauth';

const privateKey = generatePrivateKey();
const wif = encodePrivateKeyWif(privateKey, 'mainnet');

console.log(wif);
// => "L1RrrnXkcKut5DEMwtDthjwRcTTwED36thyL1DebVrKuwvohjMNi"
```

To derive a P2PKH address from a WIF-encoded private key:

```ts
import {
  assertSuccess,
  decodePrivateKeyWif,
  privateKeyToP2pkhCashAddress,
} from '@bitauth/libauth';

const wif = 'L1RrrnXkcKut5DEMwtDthjwRcTTwED36thyL1DebVrKuwvohjMNi';

// `assertSuccess` simply throws any decoding errors
const { privateKey } = assertSuccess(decodePrivateKeyWif(wif));

const { address } = privateKeyToP2pkhCashAddress({ privateKey });

console.log(address);
// => "bitcoincash:qrfdnw009wga3yg5ann9v930s8upw2h33s9ahmklw6"
```

## Hierarchical Deterministic (HD) Keys

Hierarchical Deterministic (HD) Keys are standardized by [BIP32](https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki) and provide a way to generate structured trees of key pairs from a single master HD key.

HD keys allow for the creation of sub-accounts, where parts of the HD key tree can be delegated to other entities with either a child **extended private key** or a **child extended public key**.

Extended private keys can be used to sign transactions spending from any descendant private key, while extended public keys can only be used to derive public keys (and therefore, addresses) for all non-hardened descendant keys.

Libauth includes a variety of utilities for deriving, encoding, and decoding BIP32 HD keys:

- [`crackHdPrivateNodeFromHdPublicNodeAndChildPrivateNode`](https://libauth.org/functions/crackHdPrivateNodeFromHdPublicNodeAndChildPrivateNode.html)
- [`decodeHdKey`](https://libauth.org/functions/decodeHdKey.html) ([`decodeHdKeyUnchecked`](https://libauth.org/functions/decodeHdKeyUnchecked.html))
- [`decodeHdPrivateKey`](https://libauth.org/functions/decodeHdPrivateKey.html)/[`encodeHdPrivateKey`](https://libauth.org/functions/encodeHdPrivateKey.html)
- [`decodeHdPublicKey`](https://libauth.org/functions/decodeHdPublicKey.html)/[`encodeHdPrivateKey`](https://libauth.org/functions/encodeHdPrivateKey.html)
- [`deriveHdPath`](https://libauth.org/functions/deriveHdPath.html)
- [`deriveHdPathRelative`](https://libauth.org/functions/deriveHdPathRelative.html)
- [`deriveHdPrivateNodeFromSeed`](https://libauth.org/functions/deriveHdPrivateNodeFromSeed.html)
- [`deriveHdPrivateNodeIdentifier`](https://libauth.org/functions/deriveHdPrivateNodeIdentifier.html)/[`deriveHdPublicNodeIdentifier`](https://libauth.org/functions/deriveHdPublicNodeIdentifier.html)
- [`deriveHdPrivateNodeChild`](https://libauth.org/functions/deriveHdPrivateNodeChild.html)/[`deriveHdPublicNodeChild`](https://libauth.org/functions/deriveHdPublicNodeChild.html)
- [`deriveHdPublicKey`](https://libauth.org/functions/deriveHdPublicKey.html)
- [`deriveHdPublicNode`](https://libauth.org/functions/deriveHdPublicNode.html)
- [`hdKeyVersionIsPrivateKey`](https://libauth.org/functions/hdKeyVersionIsPrivateKey.html)/[`hdKeyVersionIsPublicKey`](https://libauth.org/functions/hdKeyVersionIsPublicKey.html)
- [`hdPrivateKeyToIdentifier`](https://libauth.org/functions/hdPrivateKeyToIdentifier.html)/[`hdPublicKeyToIdentifier`](https://libauth.org/functions/hdPublicKeyToIdentifier.html)

### BIP39 Mnemonic Phrases

[BIP39 Mnemonic Phrases](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki) were introduced in 2013 and remain a widely-supported standard for generating and backing up private keys.

> [!CAUTION]
> A BIP39 mnemonic phrase is only sufficient to recover funds from single-signature wallets following a widely-used derivation standard (like [BIP44/SLIP44](#bip44slip44-multi-currency-wallet-backups)).
>
> Wallets holding funds in multi-signature or specialized contract addresses can only be recovered with sufficient ancillary information like HD public keys, derivation paths, contract data elements, etc. See [Shortcomings of BIP39](https://bitcoincashresearch.org/t/shortcomings-of-bip39/1190?u=bitjson) for details.

Libauth includes a variety of utilities for working with BIP39 mnemonic phrases:

- [`deriveHdPrivateNodeFromBip39Mnemonic`](https://libauth.org/functions/deriveHdPrivateNodeFromBip39Mnemonic.html)
- [`deriveSeedFromBip39Mnemonic`](https://libauth.org/functions/deriveSeedFromBip39Mnemonic.html)
- [`encodeBip39Mnemonic`](https://libauth.org/functions/encodeBip39Mnemonic.html)/[`decodeBip39Mnemonic`](https://libauth.org/functions/decodeBip39Mnemonic.html)
- [`generateBip39Mnemonic`](https://libauth.org/functions/generateBip39Mnemonic.html)

### BIP44/SLIP44 Multi-Currency Wallet Backups

[BIP44](https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki) and [SLIP44](https://github.com/satoshilabs/slips/blob/master/slip-0044.md) standardize a common hierarchy of derivation paths for use across multiple networks and cryptocurrencies.

For widest compatibility, all software which exposes BIP39 mnemonic phrases to users should scan for assets across appropriate derivation paths as standardized in BIP44/SLIP44, e.g. [BIP39 Mnemonic Phrase to BCH Wallet](#bip39-mnemonic-phrase-to-bch-wallet).

### Examples

#### Generate a Random BIP39 Mnemonic Phrase

```ts
import { generateBip39Mnemonic } from '@bitauth/libauth';

const phrase = generateBip39Mnemonic();
console.log(phrase);
// => "legal winner thank year wave sausage worth useful legal winner thank yellow"
```

#### BIP39 Mnemonic Phrase from Coin Flips

Libauth includes an easily-verifiable function for deterministically extracting entropy from random events: [`generateDeterministicEntropy`](https://libauth.org/functions/generateDeterministicEntropy.html). To create a BIP39 mnemonic phrase from a series of coin flips:

```ts
import {
  assertSuccess,
  encodeBip39Mnemonic,
  generateDeterministicEntropy,
  splitEvery,
} from '@bitauth/libauth';

/* 128 simulate coin flips (`binToBinString(generateRandomBytes(16))`) */
const flip128 =
  '11101000100010110101110111110111000110000001011110001110111011001001111011010011000111000110000010100110101101110100110000001111';

const faces = 2;
const events = splitEvery(flip128, 1).map(parseInt);
// `assertSuccess` simply throws any errors
const entropy = assertSuccess(generateDeterministicEntropy(faces, events));

const { phrase } = assertSuccess(encodeBip39Mnemonic(entropy));
console.log(phrase);
// => "crawl actual tool rally crazy lab work paper fragile favorite draft initial amount lawsuit task pupil clean crater genre rotate shoulder plate prevent bone"
```

Note that `generateDeterministicEntropy` will return an error if the provided events do not include sufficient entropy for safe key generation (configurable via [`requiredEntropyBits`](https://libauth.org/functions/generateDeterministicEntropy.html)):

```ts
import { generateDeterministicEntropy, splitEvery } from '@bitauth/libauth';

const flip10 = '1110100010';
const faces = 2;
const events = splitEvery(flip10, 1).map(parseInt);
const result = generateDeterministicEntropy(faces, events);
console.log(result);
// => "Entropy generation error: the provided list of events contains insufficient entropy. With 2 possible results per event, a minimum of 128 events are required to obtain sufficient entropy. Events provided: 10."
```

#### BIP39 Mnemonic Phrase from Dice Rolls

```ts
import {
  assertSuccess,
  binToHex,
  encodeBip39Mnemonic,
  generateDeterministicEntropy,
} from '@bitauth/libauth';

/* Fifty, 6-sided dice rolls */
const events = [
  1, 5, 5, 2, 2, 3, 6, 4, 4, 3, 2, 4, 4, 6, 3, 3, 6, 3, 6, 5, 3, 5, 1, 4, 2, 5,
  1, 1, 3, 1, 3, 2, 3, 5, 5, 6, 5, 6, 2, 2, 5, 2, 5, 5, 4, 3, 5, 3, 6, 3,
];
const faces = 6;
/**
 * `generateDeterministicEntropy` is designed to be easily verified, e.g.:
 * $ echo -n 15522364432446336365351425113132355656225255435363 | sha256sum
 * 8d270d32340c28d8708023a5becf5dd8d55da45808c2ba97cfb7c2b0dcfefad1
 */
const entropy = assertSuccess(generateDeterministicEntropy(faces, events));
console.log(binToHex(entropy));
// => "8d270d32340c28d8708023a5becf5dd8d55da45808c2ba97cfb7c2b0dcfefad1"
const { phrase } = assertSuccess(encodeBip39Mnemonic(entropy));
console.log(phrase);
// => "minor debris erode gym secret history search afford pizza wait student random fiction split gasp blue ritual salmon unknown lyrics assist legal twice cactus"
```

#### BIP39 Mnemonic Phrase to BCH Wallet

```ts
import {
  assertSuccess,
  deriveHdPrivateNodeFromBip39Mnemonic,
  deriveHdPath,
  deriveHdPathRelative,
  privateKeyToP2pkhCashAddress,
} from '@bitauth/libauth';

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
const { address } = assertSuccess(privateKeyToP2pkhCashAddress({ privateKey }));
console.log(address);
// => "bitcoincash:qpdtccrxx78kcuc65mceurfwg60gmmqu9cwpjdt25n"
```

> [!TIP]
> Consider using [`hdPrivateKeyToP2pkhCashAddress`](https://libauth.org/functions/hdPrivateKeyToP2pkhCashAddress.html) and/or [`hdPublicKeyToP2pkhCashAddress`](https://libauth.org/functions/hdPublicKeyToP2pkhCashAddress.html) to derive P2PKH addresses from HD private keys; these utilities include additional validation to safeguard against erroneous derivations. See [Wallets: P2PKH Wallets](./wallets.md#p2pkh-wallets) for examples.

#### Derive a Watch-only Wallet

A signing device can allow a "watch-only" observer to monitor a wallet's transactions without authorizing the observer to create new transactions. First, the signing device must derive an HD public key to share with the observer:

```ts
import {
  deriveHdPrivateNodeFromBip39Mnemonic,
  deriveHdPath,
  deriveHdPublicKey,
  encodeHdPrivateKey,
} from '@bitauth/libauth';

const node = deriveHdPath(
  deriveHdPrivateNodeFromBip39Mnemonic(
    'legal winner thank year wave sausage worth useful legal winner thank yellow',
  ),
  "m/44'/145'/0'",
);
const { hdPrivateKey } = encodeHdPrivateKey({ network: 'mainnet', node });
// hdPrivateKey: "xprv9yG4X8zfB77WS2vwx49tbDtHE1Cyq5wQe2iFcGy5jhizqSEgh22ZXzBaFpMYbLJN4EK459UgFWAxb5rSwzqzx6gw7xxH8z5vvcvUi4oFQqj"

const { hdPublicKey } = deriveHdPublicKey(hdPrivateKey);
console.log(hdPublicKey);
// => "xpub6CFQveXZ1UfoeX1R45gtxMq1n33UEYfG1FdrQfNhJ3FyiEZqEZLp5nW474QiDWfVQ6NGk5iPv1h14Vhz2CtzNkGNhimgUucyUtWGdMdofhe"
```

Given the HD public key, the observer can derive descendant public keys without gaining the ability to spend from the wallet:

```ts
import {
  assertSuccess,
  decodeHdPublicKey,
  deriveHdPathRelative,
  publicKeyToP2pkhCashAddress,
} from '@bitauth/libauth';

const hdPublicKey =
  'xpub6CFQveXZ1UfoeX1R45gtxMq1n33UEYfG1FdrQfNhJ3FyiEZqEZLp5nW474QiDWfVQ6NGk5iPv1h14Vhz2CtzNkGNhimgUucyUtWGdMdofhe';

const { node } = assertSuccess(decodeHdPublicKey(hdPublicKey));
const { publicKey } = deriveHdPathRelative(node, '0/0');
const { address } = publicKeyToP2pkhCashAddress({ publicKey });
console.log(address);
// => "bitcoincash:qpdtccrxx78kcuc65mceurfwg60gmmqu9cwpjdt25n"
```

> [!CAUTION]
> Though private keys cannot be derived from HD public keys, sharing HD public keys still carries risk. Along with allowing an attacker to associate wallet addresses together (breaking privacy), should an attacker gain knowledge of a single child private key, **it's possible to derive all parent HD private keys**. See [`crackHdPrivateNodeFromHdPublicNodeAndChildPrivateNode`](https://libauth.org/functions/crackHdPrivateNodeFromHdPublicNodeAndChildPrivateNode.html) for details.

```ts
import {
  assertSuccess,
  deriveHdPublicKey,
  decodeHdPrivateKey,
  decodeHdPublicKey,
  encodeHdPrivateKey,
  deriveHdPathRelative,
  crackHdPrivateNodeFromHdPublicNodeAndChildPrivateNode,
} from '@bitauth/libauth';

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
console.log(parentKey);
// => "xprv9yG4X8zfB77WS2vwx49tbDtHE1Cyq5wQe2iFcGy5jhizqSEgh22ZXzBaFpMYbLJN4EK459UgFWAxb5rSwzqzx6gw7xxH8z5vvcvUi4oFQqj"
```
