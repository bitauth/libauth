---
'@bitauth/libauth': major
---

Unify object parameters and error handling across library

A number of existing Libauth utilities have been modified to adhere to Libauth's object parameter and error handling conventions:

- CashAddress utilities:
  - [`encodeCashAddress`](https://libauth.org/functions/encodeCashAddress.html)/[`decodeCashAddress`](https://libauth.org/functions/decodeCashAddress.html)
  - [`lockingBytecodeToCashAddress`](https://libauth.org/functions/lockingBytecodeToCashAddress.html)/[`cashAddressToLockingBytecode`](https://libauth.org/functions/cashAddressToLockingBytecode.html)
  - [`encodeCashAddressFormat`](https://libauth.org/functions/encodeCashAddressFormat.html)/[`decodeCashAddressFormat`](https://libauth.org/functions/decodeCashAddressFormat.html)
- BIP32 (HD Key) utilities:
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
- BIP39 (Mnemonic Phrase) Utilities:
  - [`deriveHdPrivateNodeFromBip39Mnemonic`](https://libauth.org/functions/deriveHdPrivateNodeFromBip39Mnemonic.html)
  - [`deriveSeedFromBip39Mnemonic`](https://libauth.org/functions/deriveSeedFromBip39Mnemonic.html)
  - [`encodeBip39Mnemonic`](https://libauth.org/functions/encodeBip39Mnemonic.html)/[`decodeBip39Mnemonic`](https://libauth.org/functions/decodeBip39Mnemonic.html)
  - [`generateBip39Mnemonic`](https://libauth.org/functions/generateBip39Mnemonic.html)
- Key Utilities:
  - [`generateDeterministicEntropy`](https://libauth.org/functions/generateDeterministicEntropy.html)

Please see the relevant guide(s) for usage examples:

- [Handling Errors](https://github.com/bitauth/libauth/blob/master/docs/errors.md)
- [Keys](https://github.com/bitauth/libauth/blob/master/docs/keys.md)
- [Addresses](https://github.com/bitauth/libauth/blob/master/docs/addresses.md)
- [Wallets & Transaction Creation](https://github.com/bitauth/libauth/blob/master/docs/wallets.md)
