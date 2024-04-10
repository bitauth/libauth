<p align="center">
  <a href="https://libauth.org/">
    <img src="https://libauth.org/assets/libauth.svg" alt="Libauth logo" width="200">
  </a>
</p>

<p align="center">
  An ultra-lightweight JavaScript library for Bitcoin Cash, Bitcoin, and Bitauth
  applications.
</p>
<p align="center"><a href="https://github.com/bitauth/libauth/tree/master/docs"><strong>Docs: Getting Started →</strong></a></p>
<p align="center"><a href="https://libauth.org/#md:api-overview">API Reference</a></p>

<p align="center">
  <a href="https://www.npmjs.com/package/@bitauth/libauth"><img src="https://img.shields.io/npm/v/@bitauth/libauth.svg" alt="NPM version" /></a>
  <a href="https://codecov.io/gh/bitauth/libauth"><img src="https://img.shields.io/codecov/c/github/bitauth/libauth/master.svg" alt="Codecov" /></a>
  <a href="https://github.com/bitauth/libauth/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/bitauth/libauth/ci.yml?branch=master" alt="CI" /></a>
  <a href="https://twitter.com/libauth"><img alt="Follow Libauth on Twitter" src="https://img.shields.io/badge/follow-@libauth-1DA1F2?logo=twitter"></a>
  <a href="https://t.me/libauth_dev"><img alt="Join Chat on Telegram" src="https://img.shields.io/badge/chat-Libauth%20Devs-0088CC?logo=telegram"></a>
  <a href="https://www.npmjs.com/package/@bitauth/libauth"><img alt="npm downloads" src="https://img.shields.io/npm/dm/@bitauth/libauth"></a>
  <a href="https://github.com/bitauth/libauth"><img src="https://img.shields.io/github/stars/bitauth/libauth.svg?style=social&logo=github&label=Stars" alt="GitHub stars" /></a>
</p>

# Libauth

**An ultra-lightweight JavaScript library for Bitcoin Cash, Bitcoin, and Bitauth applications.**

Libauth has **no dependencies** and works in all JavaScript environments, including [Node.js](https://nodejs.org/), [Deno](https://deno.land/), and browsers.

## Purpose

Libauth is designed to be **flexible**, **lightweight**, and **easily auditable**. Rather than providing a single, overarching, object-oriented API, all functionality is composed from simple functions. This has several benefits:

- **Flexibility** – Even highly-complex functionality is built-up from simpler functions. These lower-level functions can be used to experiment, tweak, and remix your own higher-level methods without maintaining a fork of the library.
- **Smaller application bundles** – Applications can import only the methods they need, eliminating the unused code (via [dead-code elimination](https://rollupjs.org/guide/en/#tree-shaking)).
- **Better auditability** – Beyond having no dependencies of its own, Libauth's [functional programming](https://en.wikipedia.org/wiki/Functional_programming) approach makes auditing critical code easier: smaller bundles, smaller functions, and less churn between versions (fewer cascading changes to object-oriented interfaces).
- **Fully-portable** – No platform-specific APIs are ever used, so the same code paths are used across all JavaScript environments (reducing the auditable "surface area" and simplifying library development).

## Quick Start

To get started, install `@bitauth/libauth`:

```sh
npm install @bitauth/libauth
# OR
yarn add @bitauth/libauth
```

And import the functionality you need:

```ts
import { secp256k1 } from '@bitauth/libauth';
import { msgHash, pubkey, sig } from 'somewhere';

secp256k1.verifySignatureDERLowS(sig, pubkey, msgHash)
  ? console.log('🚀 Signature valid')
  : console.log('❌ Signature invalid');
```

See [Installation](./docs/install.md) for more guidance on getting set up.

## Guides

These guides introduce some of the high-level concepts and functionality provided by Libauth.

- [Installation](https://github.com/bitauth/libauth/blob/master/docs/install.md)
- [Handling Errors](https://github.com/bitauth/libauth/blob/master/docs/errors.md)
- [Cryptography](https://github.com/bitauth/libauth/blob/master/docs/crypto.md)
- [Keys](https://github.com/bitauth/libauth/blob/master/docs/keys.md)
- [Addresses](https://github.com/bitauth/libauth/blob/master/docs/addresses.md)
- [Verifying Transactions](https://github.com/bitauth/libauth/blob/master/docs/verify-transactions.md)
- [Wallets & Transaction Creation](https://github.com/bitauth/libauth/blob/master/docs/wallets.md)

### More Examples

In addition to the usage examples in these guides, note that **Libauth includes comprehensive tests that can help demonstrate usage of all functionality**.

For example, utilities related to hexadecimal-encoded strings are defined in [`hex.ts`](https://github.com/bitauth/libauth/blob/master/src/lib/format/hex.ts); for thorough usage examples, see the co-located [`hex.spec.ts`](https://github.com/bitauth/libauth/blob/master/src/lib/format/hex.spec.ts). You can also use GitHub search to see how a particular utility is used throughout the library, e.g. [`splitEvery`](https://github.com/search?q=repo%3Abitauth%2Flibauth+splitEvery&type=code).

## API Overview

Below is a partial selection of functionality provided by Libauth.
If you're looking for something else, be sure to search the [API Reference](https://libauth.org/#md:api-overview).

High-level utilities are composed from lower-level utilities which are also exported, so it's often possible to remix behavior in your own codebase with relatively little duplication or maintenance burden. See the `Defined in ...` link on each utility's API reference page to review and copy the implementation.

<details><summary>Table of Contents</summary>

- [Address Formats](#address-formats)
  - [Base58 Addresses](#base58-addresses)
  - [Bech32](#bech32)
  - [CashAddress](#cashaddress)
  - [CashAddress-like Formats](#cashaddress-like-formats)
- [Crypto](#crypto)
- [Formats](#formats)
  - [Base-N Conversion](#base-n-conversion)
  - [Base64](#base64)
  - [Binary Strings (e.g. `00101010`)](#binary-strings-eg-00101010)
  - [Hex (Hexadecimal-Encoded Strings)](#hex-hexadecimal-encoded-strings)
  - [Logging](#logging)
  - [Numbers](#numbers)
    - [CompactUint (A.K.A. "VarInt" or "CompactSize")](#compactuint-aka-varint-or-compactsize)
    - [Satoshi Values](#satoshi-values)
    - [VM Numbers (A.K.A. "ScriptNum")](#vm-numbers-aka-scriptnum)
  - [Miscellaneous](#miscellaneous)
  - [Time](#time)
  - [UTF8](#utf8)
- [Keys](#keys)
  - [BIP32 Hierarchical Deterministic (HD) Keys](#bip32-hierarchical-deterministic-hd-keys)
  - [BIP39 Mnemonic Phrases](#bip39-mnemonic-phrases)
  - [Wallet Import Format (WIF)](#wallet-import-format-wif)
  - [Key Utilities](#key-utilities)
- [P2P Messages](#p2p-messages)
  - [Decoding Utilities](#decoding-utilities)
  - [Transactions](#transactions)
  - [Outputs](#outputs)
    - [Dust Calculation](#dust-calculation)
- [Virtual Machines](#virtual-machines)
  - [Built-In VMs](#built-in-vms)
  - [Debugging](#debugging)
  - [Combinators](#combinators)
- [Wallet Engine](#wallet-engine)
  - [Bitcoin Cash Metadata Registries (BCMRs)](#bitcoin-cash-metadata-registries-bcmrs)
  - [CashAssembly Language \& Compiler](#cashassembly-language--compiler)
  - [Multi-Party Compilation](#multi-party-compilation)
  - [Wallet Templates](#wallet-templates)

</details>

### Address Formats

#### Base58 Addresses

- [`encodeBase58Address`](https://libauth.org/functions/encodeBase58Address.html)/[`decodeBase58Address`](https://libauth.org/functions/decodeBase58Address.html)
- [`encodeBase58AddressFormat`](https://libauth.org/functions/encodeBase58AddressFormat.html)/[`decodeBase58AddressFormat`](https://libauth.org/functions/decodeBase58AddressFormat.html)
- [`lockingBytecodeToBase58Address`](https://libauth.org/functions/lockingBytecodeToBase58Address.html)/[`base58AddressToLockingBytecode`](https://libauth.org/functions/base58AddressToLockingBytecode.html)

#### Bech32

- [`encodeBech32`](https://libauth.org/functions/encodeBech32.html)/[`decodeBech32`](https://libauth.org/functions/decodeBech32.html)
- [`bech32PaddedToBin`](https://libauth.org/functions/bech32PaddedToBin.html)/[`binToBech32Padded`](https://libauth.org/functions/binToBech32Padded.html)
- [`regroupBits`](https://libauth.org/functions/regroupBits.html)

#### CashAddress

- [`encodeCashAddress`](https://libauth.org/functions/encodeCashAddress.html)/[`decodeCashAddress`](https://libauth.org/functions/decodeCashAddress.html)
- [`lockingBytecodeToCashAddress`](https://libauth.org/functions/lockingBytecodeToCashAddress.html)/[`cashAddressToLockingBytecode`](https://libauth.org/functions/cashAddressToLockingBytecode.html)
- [`decodeCashAddressFormatWithoutPrefix`](https://libauth.org/functions/decodeCashAddressFormatWithoutPrefix.html)
- [`encodeCashAddressVersionByte`](https://libauth.org/functions/encodeCashAddressVersionByte.html)/[`decodeCashAddressVersionByte`](https://libauth.org/functions/decodeCashAddressVersionByte.html)

#### CashAddress-like Formats

- [`attemptCashAddressFormatErrorCorrection`](https://libauth.org/functions/attemptCashAddressFormatErrorCorrection.html)
- [`encodeCashAddressFormat`](https://libauth.org/functions/encodeCashAddressFormat.html)/[`decodeCashAddressFormat`](https://libauth.org/functions/decodeCashAddressFormat.html)
- [`encodeCashAddressNonStandard`](https://libauth.org/functions/encodeCashAddressNonStandard.html)/[`decodeCashAddressNonStandard`](https://libauth.org/functions/decodeCashAddressNonStandard.html)

### Crypto

- [`hash160`](https://libauth.org/functions/hash160.html) (`sha256` -> `ripemd160`)
- [`hash256`](https://libauth.org/functions/hash256.html) (`sha256` -> `sha256`)
- [`hmacSha256`](https://libauth.org/functions/hmacSha256.html)
- [`hmacSha512`](https://libauth.org/functions/hmacSha512.html)
- [`instantiateHmacFunction`](https://libauth.org/functions/instantiateHmacFunction.html)
- [`instantiatePbkdf2Function`](https://libauth.org/functions/instantiatePbkdf2Function.html)
- [`pbkdf2HmacSha256`](https://libauth.org/functions/pbkdf2HmacSha256.html)
- [`pbkdf2HmacSha512`](https://libauth.org/functions/pbkdf2HmacSha512.html)
- [`ripemd160`](https://libauth.org/types/Ripemd160.html)
- [`secp256k1`](https://libauth.org/types/Secp256k1.html)
- [`sha1`](https://libauth.org/types/Sha1.html)
- [`sha256`](https://libauth.org/types/Sha256.html)
- [`sha512`](https://libauth.org/types/Sha512.html)

### Formats

#### Base-N Conversion

- [`base58ToBin`](https://libauth.org/functions/base58ToBin.html)/[`binToBase58`](https://libauth.org/functions/binToBase58.html)
- [`createBaseConverter`](https://libauth.org/functions/createBaseConverter.html)

#### Base64

- [`base64ToBin`](https://libauth.org/functions/base64ToBin.html)/[`binToBase64`](https://libauth.org/functions/binToBase64.html)
- [`isBase64`](https://libauth.org/functions/isBase64.html)

#### Binary Strings (e.g. `00101010`)

- [`binStringToBin`](https://libauth.org/functions/binStringToBin.html)/[`binToBinString`](https://libauth.org/functions/binToBinString.html)
- [`isBinString`](https://libauth.org/functions/isBinString.html)

#### Hex (Hexadecimal-Encoded Strings)

- [`hexToBin`](https://libauth.org/functions/hexToBin.html)/[`binToHex`](https://libauth.org/functions/binToHex.html)
- [`isHex`](https://libauth.org/functions/isHex.html)
- [`swapEndianness`](https://libauth.org/functions/swapEndianness.html)

#### Logging

- [`sortObjectKeys`](https://libauth.org/functions/sortObjectKeys.html)
- [`stringify`](https://libauth.org/functions/stringify.html)
- [`stringifyTestVector`](https://libauth.org/functions/stringifyTestVector.html)

#### Numbers

- [`bigIntToBinUint256BEClamped`](https://libauth.org/functions/bigIntToBinUint256BEClamped.html)/[`binToBigIntUint256BE`](https://libauth.org/functions/binToBigIntUint256BE.html)
- [`bigIntToBinUint64LE`](https://libauth.org/functions/bigIntToBinUint64LE.html)([`bigIntToBinUint64LEClamped`](https://libauth.org/functions/bigIntToBinUint64LEClamped.html))/[`binToBigIntUint64LE`](https://libauth.org/functions/binToBigIntUint64LE.html)
- [`bigIntToBinUintLE`](https://libauth.org/functions/bigIntToBinUintLE.html)/[`binToBigIntUintLE`](https://libauth.org/functions/binToBigIntUintLE.html)
- [`binToBigIntUintBE`](https://libauth.org/functions/binToBigIntUintBE.html)/[`bigIntToBinUintBE`](https://libauth.org/functions/bigIntToBinUintBE.html)
- [`int32SignedToUnsigned`](https://libauth.org/functions/int32SignedToUnsigned.html)/[`int32UnsignedToSigned`](https://libauth.org/functions/int32UnsignedToSigned.html)
- [`numberToBinInt16LE`](https://libauth.org/functions/numberToBinInt16LE.html)/[`binToNumberInt16LE`](https://libauth.org/functions/binToNumberInt16LE.html)
- [`numberToBinInt32LE`](https://libauth.org/functions/numberToBinInt32LE.html)/[`binToNumberInt32LE`](https://libauth.org/functions/binToNumberInt32LE.html)
- [`numberToBinInt32TwosCompliment`](https://libauth.org/functions/numberToBinInt32TwosCompliment.html)
- [`numberToBinUintLE`](https://libauth.org/functions/numberToBinUintLE.html)/[`binToNumberUintLE`](https://libauth.org/functions/binToNumberUintLE.html)
- [`numberToBinUint16BE`](https://libauth.org/functions/numberToBinUint16BE.html)
- [`numberToBinUint16LE`](https://libauth.org/functions/numberToBinUint16LE.html)([`numberToBinUint16LEClamped`](https://libauth.org/functions/numberToBinUint16LEClamped.html))/[`binToNumberUint16LE`](https://libauth.org/functions/binToNumberUint16LE.html)
- [`numberToBinUint32BE`](https://libauth.org/functions/numberToBinUint32BE.html)
- [`numberToBinUint32LE`](https://libauth.org/functions/numberToBinUint32LE.html)([`numberToBinUint32LEClamped`](https://libauth.org/functions/numberToBinUint32LEClamped.html))/[`binToNumberUint32LE`](https://libauth.org/functions/binToNumberUint32LE.html)

##### CompactUint (A.K.A. "VarInt" or "CompactSize")

- [`compactUintToBigInt`](https://libauth.org/functions/compactUintToBigInt.html)/[`bigIntToCompactUint`](https://libauth.org/functions/bigIntToCompactUint.html)
- [`compactUintPrefixToSize`](https://libauth.org/functions/compactUintPrefixToSize.html)
- [`readCompactUint`](https://libauth.org/functions/readCompactUint.html)
- [`readCompactUintMinimal`](https://libauth.org/functions/readCompactUintMinimal.html)

##### Satoshi Values

- [`valueSatoshisToBin`](https://libauth.org/functions/valueSatoshisToBin.html)/[`binToValueSatoshis`](https://libauth.org/functions/binToValueSatoshis.html)

##### VM Numbers (A.K.A. "ScriptNum")

- [`vmNumberToBigInt`](https://libauth.org/functions/vmNumberToBigInt.html)/[`bigIntToVmNumber`](https://libauth.org/functions/bigIntToVmNumber.html)
- [`booleanToVmNumber`](https://libauth.org/functions/booleanToVmNumber.html)

#### Miscellaneous

- [`assertSuccess`](https://libauth.org/functions/assertSuccess.html)
- [`binsAreEqual`](https://libauth.org/functions/binsAreEqual.html)
- [`encodeDataPush`](https://libauth.org/functions/encodeDataPush.html)
- [`flattenBinArray`](https://libauth.org/functions/flattenBinArray.html)
- [`range`](https://libauth.org/functions/range-1.html)
- [`splitEvery`](https://libauth.org/functions/splitEvery.html)
- [`unknownValue`](https://libauth.org/functions/unknownValue.html)

#### Time

- [`dateToLocktime`](https://libauth.org/functions/dateToLocktime.html)/[`locktimeToDate`](https://libauth.org/functions/locktimeToDate.html)
- [`dateToLocktimeBin`](https://libauth.org/functions/dateToLocktimeBin.html)
- [`decodeLocktime`](https://libauth.org/functions/decodeLocktime.html)

#### UTF8

- [`length`](https://libauth.org/functions/length.html)
- [`lossyNormalize`](https://libauth.org/functions/lossyNormalize.html)
- [`segment`](https://libauth.org/functions/segment.html)
- [`utf8ToBin`](https://libauth.org/functions/utf8ToBin.html)/[`binToUtf8`](https://libauth.org/functions/binToUtf8.html)

### Keys

#### BIP32 Hierarchical Deterministic (HD) Keys

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

#### BIP39 Mnemonic Phrases

- [`deriveHdPrivateNodeFromBip39Mnemonic`](https://libauth.org/functions/deriveHdPrivateNodeFromBip39Mnemonic.html)
- [`deriveSeedFromBip39Mnemonic`](https://libauth.org/functions/deriveSeedFromBip39Mnemonic.html)
- [`encodeBip39Mnemonic`](https://libauth.org/functions/encodeBip39Mnemonic.html)/[`decodeBip39Mnemonic`](https://libauth.org/functions/decodeBip39Mnemonic.html)
- [`generateBip39Mnemonic`](https://libauth.org/functions/generateBip39Mnemonic.html)

#### Wallet Import Format (WIF)

- [`encodePrivateKeyWif`](https://libauth.org/functions/encodePrivateKeyWif.html)/[`decodePrivateKeyWif`](https://libauth.org/functions/decodePrivateKeyWif.html)

#### Key Utilities

- [`generateDeterministicEntropy`](https://libauth.org/functions/generateDeterministicEntropy.html)
- [`generateHdPrivateNode`](https://libauth.org/functions/generateHdPrivateNode.html)
- [`generatePrivateKey`](https://libauth.org/functions/generatePrivateKey.html)
- [`generateRandomBytes`](https://libauth.org/functions/generateRandomBytes.html)
- [`generateRandomSeed`](https://libauth.org/functions/generateRandomSeed.html)
- [`minimumEventsPerEntropyBits`](https://libauth.org/functions/minimumEventsPerEntropyBits.html)
- [`shannonEntropyPerEvent`](https://libauth.org/functions/shannonEntropyPerEvent.html)
- [`validateSecp256k1PrivateKey`](https://libauth.org/functions/validateSecp256k1PrivateKey.html)

### P2P Messages

#### Decoding Utilities

- [`readBytes`](https://libauth.org/functions/readBytes.html)
- [`readCompactUintPrefixedBin`](https://libauth.org/functions/readCompactUintPrefixedBin.html)
- [`readRemainingBytes`](https://libauth.org/functions/readRemainingBytes.html)
- [`readUint32LE`](https://libauth.org/functions/readUint32LE.html)
- [`readUint64LE`](https://libauth.org/functions/readUint64LE.html)
- [`readMultiple`](https://libauth.org/functions/readMultiple.html)
- [`readItemCount`](https://libauth.org/functions/readItemCount.html)

#### Transactions

- [`encodeTransaction`](https://libauth.org/functions/encodeTransaction.html)/[`decodeTransaction`](https://libauth.org/functions/decodeTransaction.html) ([`decodeTransactionUnsafe`](https://libauth.org/functions/decodeTransactionUnsafe.html))
- [`encodeTransactionOutputs`](https://libauth.org/functions/encodeTransactionOutputs.html)/[`decodeTransactionOutputs`](https://libauth.org/functions/decodeTransactionOutputs.html)
- [`hashTransaction`](https://libauth.org/functions/hashTransaction.html)
- [`hashTransactionP2pOrder`](https://libauth.org/functions/hashTransactionP2pOrder.html)
- [`hashTransactionUiOrder`](https://libauth.org/functions/hashTransactionUiOrder.html)

#### Outputs

- [`isArbitraryDataOutput`](https://libauth.org/functions/isArbitraryDataOutput.html)
- [`isSimpleMultisig`](https://libauth.org/functions/isSimpleMultisig.html)
- [`isStandardOutputBytecode`](https://libauth.org/functions/isStandardOutputBytecode.html)
- [`isStandardOutputBytecode2023`](https://libauth.org/functions/isStandardOutputBytecode2023.html)
- [`isStandardMultisig`](https://libauth.org/functions/isStandardMultisig.html)
- [`isWitnessProgram`](https://libauth.org/functions/isWitnessProgram.html)

##### Dust Calculation

- [`getDustThreshold`](https://libauth.org/functions/getDustThreshold.html)
- [`getDustThresholdForLength`](https://libauth.org/functions/getDustThresholdForLength.html)
- [`isDustOutput`](https://libauth.org/functions/isDustOutput.html)

### Virtual Machines

#### Built-In VMs

- [`createInstructionSetBCH`](https://libauth.org/functions/createInstructionSetBCH.html)
- [`createInstructionSetBCH2022`](https://libauth.org/functions/createInstructionSetBCH2022.html)
- [`createInstructionSetBCH2023`](https://libauth.org/functions/createInstructionSetBCH2023.html)
- [`createInstructionSetBCHCHIPs`](https://libauth.org/functions/createInstructionSetBCHCHIPs.html)
- [`createInstructionSetXEC`](https://libauth.org/functions/createInstructionSetXEC.html)
- [`createVirtualMachine`](https://libauth.org/functions/createVirtualMachine.html)
- [`createVirtualMachineBCH`](https://libauth.org/functions/createVirtualMachineBCH.html)
- [`createVirtualMachineBCH2022`](https://libauth.org/functions/createVirtualMachineBCH2022.html)
- [`createVirtualMachineBCH2023`](https://libauth.org/functions/createVirtualMachineBCH2023.html)
- [`createVirtualMachineBCHCHIPs`](https://libauth.org/functions/createVirtualMachineBCHCHIPs.html)
- [`createVirtualMachineXEC`](https://libauth.org/functions/createVirtualMachineXEC.html)

#### Debugging

- [`assembleBytecode`](https://libauth.org/functions/assembleBytecode.html)
- [`assembleBytecodeBCH`](https://libauth.org/functions/assembleBytecodeBCH.html)
- [`assembleBytecodeBTC`](https://libauth.org/functions/assembleBytecodeBTC.html)
- [`disassembleBytecode`](https://libauth.org/functions/disassembleBytecodeBCH.html)
- [`disassembleBytecodeBCH`](https://libauth.org/functions/disassembleBytecodeBCH.html)
- [`disassembleBytecodeBTC`](https://libauth.org/functions/disassembleBytecodeBTC.html)
- [`generateBytecodeMap`](https://libauth.org/functions/generateBytecodeMap.html)
- [`summarizeDebugTrace`](https://libauth.org/functions/summarizeDebugTrace.html)
- [`stringifyDebugTraceSummary`](https://libauth.org/functions/stringifyDebugTraceSummary.html)
- [`summarizeStack`](https://libauth.org/functions/summarizeStack.html)

#### Combinators

- [`combineOperations`](https://libauth.org/functions/combineOperations.html)
- [`mapOverOperations`](https://libauth.org/functions/mapOverOperations.html)
- [`pushToStack`](https://libauth.org/functions/pushToStack.html)
- [`pushToStackChecked`](https://libauth.org/functions/pushToStackChecked.html)
- [`pushToStackVmNumber`](https://libauth.org/functions/pushToStackVmNumber.html)
- [`pushToStackVmNumberChecked`](https://libauth.org/functions/pushToStackVmNumberChecked.html)
- [`useOneStackItem`](https://libauth.org/functions/useOneStackItem.html)
- [`useTwoStackItems`](https://libauth.org/functions/useTwoStackItems.html)
- [`useThreeStackItems`](https://libauth.org/functions/useThreeStackItems.html)
- [`useFourStackItems`](https://libauth.org/functions/useFourStackItems.html)
- [`useSixStackItems`](https://libauth.org/functions/useSixStackItems.html)
- [`useOneVmNumber`](https://libauth.org/functions/useSixStackItems.html)
- [`useTwoVmNumbers`](https://libauth.org/functions/useSixStackItems.html)
- [`useThreeVmNumbers`](https://libauth.org/functions/useSixStackItems.html)

### Wallet Engine

#### Bitcoin Cash Metadata Registries (BCMRs)

- [`importMetadataRegistry`](https://libauth.org/functions/importMetadataRegistry.html)

#### CashAssembly Language & Compiler

- [`allErrorsAreRecoverable`](https://libauth.org/functions/allErrorsAreRecoverable.html)
- [`cashAssemblyToBin`](https://libauth.org/functions/cashAssemblyToBin.html)
- [`compileScript`](https://libauth.org/functions/compileScript.html)
- [`containsRange`](https://libauth.org/functions/containsRange.html)
- [`createCompiler`](https://libauth.org/functions/createCompiler.html)
- [`extractBytecodeResolutions`](https://libauth.org/functions/extractBytecodeResolutions.html)
- [`extractEvaluationSamples`](https://libauth.org/functions/extractEvaluationSamples.html)
- [`extractEvaluationSamplesRecursive`](https://libauth.org/functions/extractEvaluationSamplesRecursive.html)
- [`extractUnexecutedRanges`](https://libauth.org/functions/extractUnexecutedRanges.html)
- [`getResolutionErrors`](https://libauth.org/functions/getResolutionErrors.html)
- [`mergeRanges`](https://libauth.org/functions/mergeRanges.html)
- [`parseScript`](https://libauth.org/functions/parseScript.html)
- [`resolveVariableIdentifier`](https://libauth.org/functions/resolveVariableIdentifier.html)
- [`stringifyErrors`](https://libauth.org/functions/stringifyErrors.html)
- [`verifyCashAssemblyEvaluationState`](https://libauth.org/functions/verifyCashAssemblyEvaluationState.html)
- [`walletTemplateToCompilerConfiguration`](https://libauth.org/functions/walletTemplateToCompilerConfiguration.html)
- [`walletTemplateToCompilerBCH`](https://libauth.org/functions/walletTemplateToCompilerBCH.html)

#### Multi-Party Compilation

- [`extractMissingVariables`](https://libauth.org/functions/extractMissingVariables.html)
- [`extractResolvedVariables`](https://libauth.org/functions/extractResolvedVariables.html)
- [`generateTransaction`](https://libauth.org/functions/generateTransaction.html)
- [`safelyExtendCompilationData`](https://libauth.org/functions/safelyExtendCompilationData.html)

#### P2PKH Utilities

- [`hdPrivateKeyToP2pkhLockingBytecode`](https://libauth.org/functions/hdPrivateKeyToP2pkhLockingBytecode.html)
- [`hdPrivateKeyToP2pkhCashAddress`](https://libauth.org/functions/hdPrivateKeyToP2pkhCashAddress.html)
- [`hdPublicKeyToP2pkhLockingBytecode`](https://libauth.org/functions/hdPublicKeyToP2pkhLockingBytecode.html)
- [`hdPublicKeyToP2pkhCashAddress`](https://libauth.org/functions/hdPublicKeyToP2pkhCashAddress.html)
- [`privateKeyToP2pkhLockingBytecode`](https://libauth.org/functions/privateKeyToP2pkhLockingBytecode.html)
- [`privateKeyToP2pkhCashAddress`](https://libauth.org/functions/privateKeyToP2pkhCashAddress.html)
- [`publicKeyToP2pkhLockingBytecode`](https://libauth.org/functions/publicKeyToP2pkhLockingBytecode.html)
- [`publicKeyToP2pkhCashAddress`](https://libauth.org/functions/publicKeyToP2pkhCashAddress.html)

#### Wallet Templates

- [`importWalletTemplate`](https://libauth.org/functions/importWalletTemplate.html)

## VMB Tests

Libauth's test suite includes a set of cross-implementation Virtual Machine Bytecode (VMB) test vectors for each supported VM. See [`Libauth VMB Tests`](https://github.com/bitauth/libauth/blob/master/src/lib/vmb-tests/readme.md) for details.

# CashAssembly

CashAssembly is the assembly language used by Libauth's [Wallet Templates](https://libauth.org/types/WalletTemplate.html). To learn more about CashAssembly, read the [Bitauth IDE Guide](https://ide.bitauth.com/guide).

## Contributing

Pull Requests welcome! Please see [`CONTRIBUTING.md`](https://github.com/bitauth/libauth/blob/master/.github/CONTRIBUTING.md) for details.
