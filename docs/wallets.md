# Wallets

Libauth includes advanced support for multi-party wallet creation and transaction compilation, but the related APIs are currently very generalized and low-level.

**Libauth does not yet include simplified wallet management utilities**.

## P2PKH Wallets

> [!TIP]
> Applications requiring P2PKH wallet functionality may have more success with a higher-level library like [`mainnet-js`](https://mainnet.cash/).

Libauth includes a few convenience utilities for producing P2PKH CashAddresses from public or private key material:

- [`hdPrivateKeyToP2pkhCashAddress`](https://libauth.org/functions/hdPrivateKeyToP2pkhCashAddress.html)
- [`hdPublicKeyToP2pkhCashAddress`](https://libauth.org/functions/hdPublicKeyToP2pkhCashAddress.html)
- [`privateKeyToP2pkhCashAddress`](https://libauth.org/functions/privateKeyToP2pkhCashAddress.html)
- [`publicKeyToP2pkhCashAddress`](https://libauth.org/functions/publicKeyToP2pkhCashAddress.html)

For example, to derive P2PKH addresses from a new BIP39 mnemonic phrase:

```ts
import {
  deriveHdPrivateNodeFromBip39Mnemonic,
  encodeHdPrivateKey,
  generateBip39Mnemonic,
  hdPrivateKeyToP2pkhCashAddress,
} from '@bitauth/libauth';
import { saveSomewhere } from './my/app';

const mnemonic = generateBip39Mnemonic();
// => 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'

saveSomewhere(mnemonic);

const { hdPrivateKey } = encodeHdPrivateKey({
  network: 'mainnet',
  node: deriveHdPrivateNodeFromBip39Mnemonic(mnemonic),
});

/* BCH account standardized by SLIP44 */
const privateDerivationPath = "m/44'/145'/0'/0/i";
const addressIndex = 0;
const { address } = hdPrivateKeyToP2pkhCashAddress({
  addressIndex,
  hdPrivateKey,
  privateDerivationPath,
});

console.log(
  `The address at external BCH account (${privateDerivationPath}) index ${addressIndex} is: ${address}.`,
);
// => "The address at external BCH account (m/44'/145'/0'/0/i) index 0 is: bitcoincash:qqyx49mu0kkn9ftfj6hje6g2wfer34yfnq5tahq3q6."
```

Signing devices can derive an HD public key to share with a watch-only observer; the observer can derive new addresses without holding any private keys (e.g. a point-of-sale payment terminal):

```ts
import {
  deriveHdPath,
  deriveHdPrivateNodeFromBip39Mnemonic,
  deriveHdPublicNode,
  encodeHdPublicKey,
  hdPublicKeyToP2pkhCashAddress,
} from '@bitauth/libauth';

/* On the signing device: */
const mnemonic =
  'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
const masterNode = deriveHdPrivateNodeFromBip39Mnemonic(mnemonic);

/* BCH account 0 as standardized by SLIP44 */
const bchAccount0 = "m/44'/145'/0'";
const node = deriveHdPublicNode(deriveHdPath(masterNode, bchAccount0));
const { hdPublicKey } = encodeHdPublicKey({ network: 'mainnet', node });

/* A watch-only observer can derive addresses given only the HD public key: */
const addressIndex = 0;
const externalAddresses = '0/i'; /* Change addresses use '1/i' */
const { address } = hdPublicKeyToP2pkhCashAddress({
  addressIndex,
  hdPublicKey,
  hdPublicKeyDerivationPath: bchAccount0,
  publicDerivationPath: externalAddresses,
});
console.log(
  `The address at external BCH account 0 (${bchAccount0}) index ${addressIndex} is: ${address}.`,
);
// => "The address at BCH account 0, external index 0 is: bitcoincash:qqyx49mu0kkn9ftfj6hje6g2wfer34yfnq5tahq3q6."
```

Simpler utilities for working with non-HD private and public keys are also available:

```ts
import {
  assertSuccess,
  decodePrivateKeyWif,
  privateKeyToP2pkhCashAddress,
  publicKeyToP2pkhCashAddress,
  secp256k1,
} from '@bitauth/libauth';

const wif = 'KxbEv3FeYig2afQp7QEA9R3gwqdTBFwAJJ6Ma7j1SkmZoxC9bAXZ';

// `assertSuccess` simply throws any decoding errors
const { privateKey } = assertSuccess(decodePrivateKeyWif(wif));
const { address } = privateKeyToP2pkhCashAddress({ privateKey });

console.log(`The address is: ${address}.`);
// => "The address is: bitcoincash:qqyx49mu0kkn9ftfj6hje6g2wfer34yfnq5tahq3q6."

/* Using only the public key: */

const publicKey = assertSuccess(
  secp256k1.derivePublicKeyCompressed(privateKey),
);
const result = publicKeyToP2pkhCashAddress({ publicKey });
console.log(`Address derived from the public key: ${result.address}.`);
// => "Address derived from the public key: bitcoincash:qqyx49mu0kkn9ftfj6hje6g2wfer34yfnq5tahq3q6."
```

# Transaction Creation & Multi-Party Wallets

Currently, using these Libauth features directly requires some understanding of Libauth's compiler infrastructure, and **safe usage in multi-party applications requires deep understanding of the relevant security risks**.

The best examples of multi-entity transaction compilation are the end-to-end tests of compilation:

- [`transaction-e2e.p2pkh.spec.ts`](../src/lib/transaction/transaction-e2e.p2pkh.spec.ts)
- [`transaction-e2e.2-of-3.spec.ts`](../src/lib/transaction/transaction-e2e.2-of-3.spec.ts)
- [`transaction-e2e.sig-of-sig.spec.ts`](../src/lib/transaction/transaction-e2e.sig-of-sig.spec.ts)
- [`transaction-e2e.2-of-2-recoverable.spec.ts`](../src/lib/transaction/transaction-e2e.2-of-2-recoverable.spec.ts)

In particular, review [`transaction-e2e.2-of-2-recoverable.spec.ts`](../src/lib/transaction/transaction-e2e.2-of-2-recoverable.spec.ts), which demonstrates a scenario in which three entities create a `2-of-2 Recoverable Vault`, then proceed to incrementally compile both a standard spend and a vault recovery transaction using [`generateTransaction`](https://libauth.org/functions/generateTransaction.html), [`extractMissingVariables`](https://libauth.org/functions/extractMissingVariables.html), [`extractResolvedVariables`](https://libauth.org/functions/extractResolvedVariables.html), and [`safelyExtendCompilationData`](https://libauth.org/functions/safelyExtendCompilationData.html).

# CashAssembly

CashAssembly is the assembly language used by Libauth's [Wallet Templates](https://libauth.org/types/WalletTemplate.html). To learn more about CashAssembly, read the [Bitauth IDE Guide](https://ide.bitauth.com/guide).
