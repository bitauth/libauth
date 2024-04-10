# `@bitauth/libauth`

## 3.0.1

### Patch Changes

- [#130](https://github.com/bitauth/libauth/pull/130) [`ade0151`](https://github.com/bitauth/libauth/commit/ade015123b2bfdbca721602cda19191c6f12252d) Thanks [@bitjson](https://github.com/bitjson)! - clarify `generateDeterministicEntropy` usage examples

## 3.0.0

### Major Changes

- [#127](https://github.com/bitauth/libauth/pull/127) [`e5c275f`](https://github.com/bitauth/libauth/commit/e5c275fdc8c9007a443958454346c46e647cf26c) Thanks [@bitjson](https://github.com/bitjson)! - Add support for relative BIP32 derivation

  Relative BIP32 Hierarchical Deterministic (HD) derivation is now supported via the [`deriveHdPathRelative`](https://libauth.org/functions/deriveHdPathRelative.html) utility, and the Libauth compiler has been updated to explicitly use relative derivation by default for `HdKey`s. Absolute derivation has also been enhanced to validate the expected depth of provided HD keys.

  If you application relies on relative derivation but uses [`deriveHdPath`](https://libauth.org/functions/deriveHdPath.html), you'll need to switch to using the new [`deriveHdPathRelative`](https://libauth.org/functions/deriveHdPathRelative.html), as absolute derivation will now fail if provided with a non-zero depth HD key.

  Fixes [#49](https://github.com/bitauth/libauth/issues/49).

- [#127](https://github.com/bitauth/libauth/pull/127) [`e5c275f`](https://github.com/bitauth/libauth/commit/e5c275fdc8c9007a443958454346c46e647cf26c) Thanks [@bitjson](https://github.com/bitjson)! - CashAssembly: `.signature` is now `.ecdsa_signature`

  All CashAssembly scripts using the `.signature` operation should instead call `.ecdsa_signature` or switch to `.schnorr_signature`.

  Additionally, `signing_serialization.token_prefix` is now available.

- [#127](https://github.com/bitauth/libauth/pull/127) [`e5c275f`](https://github.com/bitauth/libauth/commit/e5c275fdc8c9007a443958454346c46e647cf26c) Thanks [@bitjson](https://github.com/bitjson)! - Unify object parameters and error handling across library

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

### Minor Changes

- [#127](https://github.com/bitauth/libauth/pull/127) [`e5c275f`](https://github.com/bitauth/libauth/commit/e5c275fdc8c9007a443958454346c46e647cf26c) Thanks [@bitjson](https://github.com/bitjson)! - Add usage guides and API overview

- [#127](https://github.com/bitauth/libauth/pull/127) [`e5c275f`](https://github.com/bitauth/libauth/commit/e5c275fdc8c9007a443958454346c46e647cf26c) Thanks [@bitjson](https://github.com/bitjson)! - Add P2PKH CashAddress utilities

  The following utilities are now available:

  - [`hdPrivateKeyToP2pkhLockingBytecode`](https://libauth.org/functions/hdPrivateKeyToP2pkhLockingBytecode.html)
  - [`hdPrivateKeyToP2pkhCashAddress`](https://libauth.org/functions/hdPrivateKeyToP2pkhCashAddress.html)
  - [`hdPublicKeyToP2pkhLockingBytecode`](https://libauth.org/functions/hdPublicKeyToP2pkhLockingBytecode.html)
  - [`hdPublicKeyToP2pkhCashAddress`](https://libauth.org/functions/hdPublicKeyToP2pkhCashAddress.html)
  - [`privateKeyToP2pkhLockingBytecode`](https://libauth.org/functions/privateKeyToP2pkhLockingBytecode.html)
  - [`privateKeyToP2pkhCashAddress`](https://libauth.org/functions/privateKeyToP2pkhCashAddress.html)
  - [`publicKeyToP2pkhLockingBytecode`](https://libauth.org/functions/publicKeyToP2pkhLockingBytecode.html)
  - [`publicKeyToP2pkhCashAddress`](https://libauth.org/functions/publicKeyToP2pkhCashAddress.html)

  For usage examples, see [`wallets.md`](https://github.com/bitauth/libauth/blob/master/docs/wallets.md).

- [#127](https://github.com/bitauth/libauth/pull/127) [`e5c275f`](https://github.com/bitauth/libauth/commit/e5c275fdc8c9007a443958454346c46e647cf26c) Thanks [@bitjson](https://github.com/bitjson)! - Validate all keys prior to compilation, expose `validateCompilationData`

  The compiler now validates all compilation data (i.e. validate all public and private keys), prior to compilation, regardless of whether or not the offending public or private key material is used. This is intended to surface software defects (particularly in the software used by counterparties) as early as possible.

- [#127](https://github.com/bitauth/libauth/pull/127) [`e5c275f`](https://github.com/bitauth/libauth/commit/e5c275fdc8c9007a443958454346c46e647cf26c) Thanks [@bitjson](https://github.com/bitjson)! - Add support for `decodeTransactionOutputs`

### Patch Changes

- [#127](https://github.com/bitauth/libauth/pull/127) [`e5c275f`](https://github.com/bitauth/libauth/commit/e5c275fdc8c9007a443958454346c46e647cf26c) Thanks [@bitjson](https://github.com/bitjson)! - `generateRandomBytes`: always verify unique results across two runs

  Fixes [#119](https://github.com/bitauth/libauth/issues/119). Old behavior is available at `generateRandomBytesUnchecked`.

## 2.1.0

### Minor Changes

- [#117](https://github.com/bitauth/libauth/pull/109) [`8e032c2`](https://github.com/bitauth/libauth/commits/8e032c2f9878d6f20cf805be6b21274534622d56) Thanks [@jimtendo](https://github.com/jimtendo)! - Add PBKDF2 and BIP39 Support

### Patch Changes

- [#117](https://github.com/bitauth/libauth/pull/117) [`51c7ee3`](https://github.com/bitauth/libauth/commit/51c7ee36e2e8f14a1a18a54b4b8c770498c788cf) Thanks [@bitjson](https://github.com/bitjson)! - Use `@changesets/cli`, remove `standard-version`
- [#117](https://github.com/bitauth/libauth/pull/117) [`7ddad21`](https://github.com/bitauth/libauth/commit/7ddad21d062ab9af6407f6fb3037cf8ed19fc080) Thanks [@bitjson](https://github.com/bitjson)! - Publish with provenance via GitHub Actions

## 2.0.0

Libauth is now a [pure ESM package](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c), simplifying the developer experience by allowing WASM crypto to be instantiated internally/automatically by default 🎉. This refactor also simplifies the usage of and types surrounding Libauth virtual machines and compilers, and several other APIs have been improved.

New, dedicated Telegram channels are also available for [Libauth release announcements](https://t.me/libauth) and [Libauth developer discussions](https://t.me/libauth_devs).

### Simplified Virtual Machine Types

Previously, Libauth VMs were very strictly-typed such that error messages and opcodes used chain-specific enums (e.g. `AuthenticationErrorBCH` and `OpcodesBCH`). While this configuration did ensure that VMs and VM results were strictly-typed with chain information, the configuration ultimately made library components much harder to remix without deep knowledge of TypeScript's type system. In both cases, such type information rarely catches downstream implementation bugs:

- Differing opcode enums effectively only narrow the real-time type from `number` to `0 | 1 | 2 | ... | 254 | 255`.
- Differing error enums only offer a slight benefit in making error matching slightly simpler, and they present a significant disadvantage in that they preclude the contextualization of errors – each error string must be fully defined at compile time.

In both cases, the differing types offer only very marginal benefit at the cost of exceptional added complexity (widespread proliferation of generic types throughout the codebase). This refactor migrates the opcode type to `number` and the error type to `string | undefined`, leaving the opcode and error enums primarily as a form of documentation.

### Simplified VM Usage

Transaction validation infrastructure is now a part of each VM instance, so transaction validation is as simple as `vm.verify({ transaction, sourceOutputs })` (returning either `true` or an error `string`). This behavior offers individual VMs full control of transaction parsing and validation, allowing Libauth VMs to implement proposals for significant modifications like new transaction formats or high-level transaction validation changes.

### Simplified VM Operations and Instruction Sets

Beginning with this version, Libauth will no longer maintain support for defunct VM versions. For example, `BCH_2019_05` was an upgrade which enabled Schnorr signature support in CHECKSIG and CHECKDATASIG and a clean-stack exception for SegWit recovery. The `BCH_2019_05` VM was replaced without a network split by the `BCH_2019_11` upgrade, meaning `BCH_2019_05` is no longer in use by any public network. As such, relevant code paths, flags, and other VM-specific functionality for `BCH_2019_05` has been removed to simplify currently supported Libauth VMs. (Of course, historical implementations will always remain available in previously-released versions of Libauth.)

With this change, the existing VM implementations have been significantly simplified, removing unused code and reducing type complexity. Built-in VM instruction sets are now specified in a single file, making them easier to review and copy.

### Additional Changes

Several other improvements have been made:

- **Default crypto interface instances** – because Libauth is now pure ESM, all of Libauth's WebAssembly cryptography implementations can now be automatically instantiated internally by the library. All Libauth methods that require crypto now use these automatically-instantiated implementations by default (as a default parameter), but consumers can opt-out of the behavior by providing a replacement implementation (and build tools that support dead code elimination/tree shaking of default parameters can automatically drop the unused crypto implementations.) To support this functionality, the parameter ordering of many functions have been modified to shift crypto implementations to the end (as optional parameters).
- **`Secp256k1` doesn't throw** - the `Secp256k1` interface previously threw errors, breaking from Libauth's convention of well-typed errors. All `Secp256k1` methods now return error messages as `string`s where applicable.
- **CashAssembly** – is the new name for Bitauth Templating Language (BTL), the simple language used within Libauth templates.
- **Consistent capitalization, miscellaneous corrections** – some exports have been renamed to consistently use camelCase (for functions) or PascalCase (for types/interfaces), respectively. Several exports have been renamed for discoverability and consistency with other exports.
- **Expanded state available to VMs and compilers** – VM and compiler operations can now access all raw contents of transactions and source outputs.
- **Expanded capabilities of template scenarios** – scenarios can now represent any transaction shape and generate full, serializable transactions.
- **New VM bytecode test vector generation** – Libauth includes a new `vmb_tests` test vector generation system to produce sets of cross-implementation test vectors as serialized transactions; this allows for sets of test vectors that fully test all transaction validation infrastructure without making assumptions about implementation internals.
- **Improved CashAddress utilities** – cash address utilities no longer require enums, hash lengths are measured in bytes rather than bits, and `type` is distinguished from `typeBit`.
- **More consistent [encoding/decoding utilities](./docs/encodings-and-formats.md)** – Several decoding methods have been renamed and refactored to use the new ReadPosition API.
- **More consistent [error handling](./docs/errors.md)** – all possible errors are surfaced in type signatures as `string`s.

## [2.0.0](https://github.com/bitauth/libauth/compare/v2.0.0-alpha.8...v2.0.0) (2024-01-12)

### ⚠ BREAKING CHANGES

- exposes script source compilations in ResolvedScript and renames
  authenticationTemplate -> walletTemplate

### Features

- key generation utilities, utf8 normalization, API improvements ([5ad6520](https://github.com/bitauth/libauth/commit/5ad6520abcc03b8f3775e374d271f3a25622f7ff))

### [1.19.1](https://github.com/bitauth/libauth/compare/v1.19.0...v1.19.1) (2022-02-01)

### Bug Fixes

- **secp256k1:** prevent vulnerabilities in consumers which don't validate input lengths ([7fc75c9](https://github.com/bitauth/libauth/commit/7fc75c90be441cf22f3bb7946363e78fa0a61b17))

## [2.0.0-alpha.8](https://github.com/bitauth/libauth/compare/v2.0.0-alpha.7...v2.0.0-alpha.8) (2023-01-10)

## [2.0.0-alpha.7](https://github.com/bitauth/libauth/compare/v2.0.0-alpha.6...v2.0.0-alpha.7) (2022-12-08)

### Features

- add dust and duplicate outpoint validation, vmb tests to BCH_2023 VM ([01587f7](https://github.com/bitauth/libauth/commit/01587f7955a2ba66e0254a1f473778c6e18d6482))
- token signing serialization support (compiler, VM, tests) ([9dfa6cc](https://github.com/bitauth/libauth/commit/9dfa6cc0b8710dedfe007b47bd018f5a47079df5))

### Bug Fixes

- add token support to legacy transaction generation API ([#104](https://github.com/bitauth/libauth/issues/104)) ([e718430](https://github.com/bitauth/libauth/commit/e71843064580a6ff2e44ac1cd81cf5f9c649a623))
- update schemas ([5742b12](https://github.com/bitauth/libauth/commit/5742b121291f2bc0092bc825a11545e61d02821c))

## [2.0.0-alpha.6](https://github.com/bitauth/libauth/compare/v2.0.0-alpha.5...v2.0.0-alpha.6) (2022-08-18)

### ⚠ BREAKING CHANGES

- Several decoding methods have been renamed and refactored to use the new
  ReadPosition API.

### Features

- support CashTokens ([8e99139](https://github.com/bitauth/libauth/commit/8e99139accb973f1df82b4cbcc92eeb81af77e0c))
- support decoding error messages, support token prefixes ([fd9b4d2](https://github.com/bitauth/libauth/commit/fd9b4d22c4581e12dfc6a0950501149481ec0b0f))
- support token-aware CashAddresses ([5ee0fff](https://github.com/bitauth/libauth/commit/5ee0fffb3ce8aa92ac593d13c0b0e24ecb1a50e6))

## [2.0.0-alpha.5](https://github.com/bitauth/libauth/compare/v2.0.0-alpha.4...v2.0.0-alpha.5) (2022-06-27)

### ⚠ BREAKING CHANGES

- Binary literals are now compiled as bytes rather than numbers.

### Features

- improve VM errors, correct binary literals, add vmb_tests ([e146a94](https://github.com/bitauth/libauth/commit/e146a9467194aa23b35e7f900b509d70e08e20ad))

## [2.0.0-alpha.4](https://github.com/bitauth/libauth/compare/v2.0.0-alpha.2...v2.0.0-alpha.4) (2022-06-16)

### ⚠ BREAKING CHANGES

- cash address utilities no longer require enums, hash lengths are measured in bytes
  rather than bits, and type is distinguished from typeBit

### Features

- add hash160, hash256, and encodeLockingBytecode\* utils ([c2a787c](https://github.com/bitauth/libauth/commit/c2a787cbdd96354edc4245601e23051ef4ee8e5e))

- simplify cash address utilities ([be45abd](https://github.com/bitauth/libauth/commit/be45abdaca451fa1b80746b1b8979fd90a0bc663))

## [2.0.0-alpha.3](https://github.com/bitauth/libauth/compare/v2.0.0-alpha.2...v2.0.0-alpha.3) (2022-05-20)

### Features

- add hash160, hash256, and encodeLockingBytecode\* utils ([c2a787c](https://github.com/bitauth/libauth/commit/c2a787cbdd96354edc4245601e23051ef4ee8e5e))

## [2.0.0-alpha.2](https://github.com/bitauth/libauth/compare/v2.0.0-alpha.1...v2.0.0-alpha.2) (2022-05-19)

## [2.0.0-alpha.1](https://github.com/bitauth/libauth/compare/v2.0.0-alpha.0...v2.0.0-alpha.1) (2022-05-19)

### Features

- improve BCH VMB tests, add basic P2PKH utils, export more aliases ([087de5a](https://github.com/bitauth/libauth/commit/087de5a91af12fa62fc438ce88a256d0ee83238b))

### Bug Fixes

- rename format utils for consistency, improve vmb_tests, fix issues in BCH vm ([6f2e782](https://github.com/bitauth/libauth/commit/6f2e782752234625c646a70318f74132afbbaa42))

## [2.0.0-alpha.0](https://github.com/bitauth/libauth/compare/v1.19.0...v2.0.0-alpha.0) (2022-05-14)

### ⚠ BREAKING CHANGES

- requires esm, modifies some crypto interfaces, renames many exports for
  consistency, expands the program state available to vms and compilers

### Features

- switch to pure esm, simplify types, simplify crypto, update vms and compiler ([c80044f](https://github.com/bitauth/libauth/commit/c80044f003b31e88b9d526242ecfcac02add6971)), closes [#31](https://github.com/bitauth/libauth/issues/31) [#53](https://github.com/bitauth/libauth/issues/53) [#72](https://github.com/bitauth/libauth/issues/72)

### Bug Fixes

- clarify endianness of outpointTransactionHash around library ([04c8c52](https://github.com/bitauth/libauth/commit/04c8c52ac555954d5e40775ded758df84993759b))

## [1.19.0](https://github.com/bitauth/libauth/compare/v1.18.1...v1.19.0) (2021-12-08)

### Features

- expose validatePublicKey method on secp256k1 ([#83](https://github.com/bitauth/libauth/issues/83)) ([0f84420](https://github.com/bitauth/libauth/commit/0f84420483ca0d8782e49bd97d503066f95b0dbe))

### [1.18.1](https://github.com/bitauth/libauth/compare/v1.18.0...v1.18.1) (2021-02-26)

### Bug Fixes

- refactor binToBigIntUint64LE to support safari ([#71](https://github.com/bitauth/libauth/issues/71)) ([d41f3cc](https://github.com/bitauth/libauth/commit/d41f3cc7dfcbefe8a8bd04ce855122836eb47417))

## [1.18.0](https://github.com/bitauth/libauth/compare/v1.17.3...v1.18.0) (2021-02-11)

### Features

- add Int16LE and Int32LE bin <-> Number utilities ([60c6580](https://github.com/bitauth/libauth/commit/60c6580f2be517545555940c3f71b389afd35eed)), closes [#66](https://github.com/bitauth/libauth/issues/66)

### Bug Fixes

- make bigIntToBinUint64LE compatible with Safari ([a884702](https://github.com/bitauth/libauth/commit/a88470284684a1a21709f78a067ab529cb01ca42)), closes [#70](https://github.com/bitauth/libauth/issues/70) [#69](https://github.com/bitauth/libauth/issues/69)

### [1.17.3](https://github.com/bitauth/libauth/compare/v1.17.2...v1.17.3) (2020-10-23)

### [1.17.2](https://github.com/bitauth/libauth/compare/v1.17.1...v1.17.2) (2020-09-15)

### [1.17.1](https://github.com/bitauth/libauth/compare/v1.17.0...v1.17.1) (2020-08-08)

### Bug Fixes

- **OP_REVERSEBYTES:** clone stack item before reversing ([071f9cd](https://github.com/bitauth/libauth/commit/071f9cddfdba7e326eb69886cf4ddefd985b0f24))

## [1.17.0](https://github.com/bitauth/libauth/compare/v1.16.0...v1.17.0) (2020-08-07)

### Features

- add support for OP_REVERSEBYTES to BCH VM ([965bd6f](https://github.com/bitauth/libauth/commit/965bd6f9680c20015ff18a3d29348a2fdce8bc56)), closes [#56](https://github.com/bitauth/libauth/issues/56)

### Bug Fixes

- update current BCH instruction set ([d0bff0c](https://github.com/bitauth/libauth/commit/d0bff0c68e543f62abadd81b01d0f69ebd3b2841))

## [1.16.0](https://github.com/bitauth/libauth/compare/v1.15.4...v1.16.0) (2020-07-21)

### Features

- **scenarios:** support "pushed" and "invalid" properties ([a38544a](https://github.com/bitauth/libauth/commit/a38544a797711175d0cc18cd967fb9f1fc88c827))

### [1.15.4](https://github.com/bitauth/libauth/compare/v1.15.3...v1.15.4) (2020-07-14)

### [1.15.3](https://github.com/bitauth/libauth/compare/v1.15.2...v1.15.3) (2020-06-19)

### [1.15.2](https://github.com/bitauth/libauth/compare/v1.15.1...v1.15.2) (2020-06-19)

### [1.15.1](https://github.com/bitauth/libauth/compare/v1.15.0...v1.15.1) (2020-06-19)

## [1.15.0](https://github.com/bitauth/libauth/compare/v1.14.2...v1.15.0) (2020-06-18)

### Features

- **compiler:** add support for scenarios, binary literals, numeric separators, p2sh transformation, ([17bfd1e](https://github.com/bitauth/libauth/commit/17bfd1e5f25c7bd1be0e9b55d6baa6704d915515))
- add compileBtl, more locktime utils ([7657647](https://github.com/bitauth/libauth/commit/765764781b2b45750cca2d8f98767d766f801d25))
- add serialization contents to compiler output and vm state ([8592e9b](https://github.com/bitauth/libauth/commit/8592e9b3862b93710f2ab15c1bba3f3afadd6935))
- add transaction generation support, increase compiler coverage ([2225f4b](https://github.com/bitauth/libauth/commit/2225f4b9cf4a100709603770307eff5eaecf9fb7))
- improve authentication template validation, improve types ([9fbec21](https://github.com/bitauth/libauth/commit/9fbec21204ca871b36a9043a9f90d0c2bce50169))
- **compiler:** add built-in support for P2SH ([d7ba2ef](https://github.com/bitauth/libauth/commit/d7ba2ef7137f1a43d9531c243d3bd3c7d36a252c))
- **compiler:** add HdKey support to the compiler ([0412caf](https://github.com/bitauth/libauth/commit/0412cafb417a5b169bddfbe0afca572c0763df08))
- **transaction:** report missing variables during compilation ([9eee817](https://github.com/bitauth/libauth/commit/9eee817409c02e346c961599b0466ac5955caac9))

### Bug Fixes

- **compiler:** better error messages for cyclical compilations ([4bbd1bd](https://github.com/bitauth/libauth/commit/4bbd1bdc34d747ba7166cb25bda318bec231dec9))
- **compiler:** require evaluations to return exactly one stack item ([86c4c19](https://github.com/bitauth/libauth/commit/86c4c197234639cf6fadebb3788acf3eda425aa5))
- **parseBytesAsScriptNumber:** accept options as an object ([8a73752](https://github.com/bitauth/libauth/commit/8a73752c526da67e1de069e02aa613d98f93a59c))

### [1.14.2](https://github.com/bitauth/libauth/compare/v1.14.1...v1.14.2) (2020-03-30)

### Bug Fixes

- **deriveHdPrivateNodeFromSeed:** account for validity in return type ([90848d9](https://github.com/bitauth/libauth/commit/90848d96ba8cdd2b58efdb1aa578464b697ccba2))

### [1.14.1](https://github.com/bitauth/libauth/compare/v1.14.0...v1.14.1) (2020-03-29)

## [1.14.0](https://github.com/bitauth/libauth/compare/v1.13.0...v1.14.0) (2020-03-29)

### Features

- add support for BIP32 HD keys and node derivation ([c047e55](https://github.com/bitauth/libauth/commit/c047e55bcc9d7ba212d0fb54a1a4031762285a49))
- **WIF:** add support for Wallet Import Format (WIF) ([87cfb6f](https://github.com/bitauth/libauth/commit/87cfb6fa105b776d139a5d53c585b55cd130c457))
- add locking bytecode <-> address utilities ([2117181](https://github.com/bitauth/libauth/commit/21171813cb1ba52643973df1db3faaeac725007c))
- **Base58Address:** add support for the Base58Address format ([84cc241](https://github.com/bitauth/libauth/commit/84cc2418c7a76792fb55c95f9378571c5ec61ec8))
- **format:** add base58 support ([9dec946](https://github.com/bitauth/libauth/commit/9dec946b69d506a7541a41e15f6d212a8c5cbf68))

### Bug Fixes

- **binToBigIntUintLE:** use only BigInts internally ([3842373](https://github.com/bitauth/libauth/commit/3842373a453328dd5aa96a81a8051a132706a05c))
- **format:** fix locktime format utilities, improve tests ([58b2f73](https://github.com/bitauth/libauth/commit/58b2f73027dbcef0a60d484c68b497710a80b86d))
- **format:** utils -> format, fix number formatting methods and tests ([3901ce6](https://github.com/bitauth/libauth/commit/3901ce6641be4af033849f3bbbd3c09466d8a3bf))
- **stringify:** improve types to get full coverage ([c4359d5](https://github.com/bitauth/libauth/commit/c4359d572abd329be7a56eb9c2c05dac62a9e6ac))

## [1.13.0](https://github.com/bitauth/libauth/compare/v1.12.0...v1.13.0) (2020-03-06)

### Features

- **hmac:** add HMAC support (HMAC-SHA256 and HMAC-SHA512) ([27d08b0](https://github.com/bitauth/libauth/commit/27d08b093457d5ca9117a6b30e79da320671fd99))
- **key:** add generatePrivateKey method ([ccd26dc](https://github.com/bitauth/libauth/commit/ccd26dcbdc0649bfb4d9b76be285b369f4cb1f2b))

## [1.12.0](https://github.com/bitauth/libauth/compare/v1.11.1...v1.12.0) (2020-02-07)

### Features

- **base64:** improve base64 utils, tests, and docs ([ac9d3e0](https://github.com/bitauth/libauth/commit/ac9d3e0138551178ef05eb331f4a3fe7de43c5bd))
- **CashAddress:** add support for CashAddress encoding, decoding, and error-correction ([85f640f](https://github.com/bitauth/libauth/commit/85f640ff4fc9258ccd10f8b4036f99790c0193e4))
- **utils:** add time-related utils ([e2c95d1](https://github.com/bitauth/libauth/commit/e2c95d1d234e41e38839e827e7ab28cd57217a1f))

### Bug Fixes

- **address:** export address in lib ([93e6d99](https://github.com/bitauth/libauth/commit/93e6d99556311e894c003c8f3ca0983a5604c87d))
- **imports:** clean up imports, expose bitcoin-abc-utils ([312c667](https://github.com/bitauth/libauth/commit/312c667fe3ff3085f0658f0ee1cce5041be0ec59))
- **vm:** avoid throwing on undefined unlocking bytecode, add tests ([339f1e5](https://github.com/bitauth/libauth/commit/339f1e59c56cbd32b0ae2df1b17b02dcd3262b42)), closes [#41](https://github.com/bitauth/libauth/issues/41)

### [1.11.1](https://github.com/bitauth/libauth/compare/v1.11.0...v1.11.1) (2019-11-22)

### Bug Fixes

- **compiler:** make correspondingOutput optional (in case it doesn't exist) ([1803848](https://github.com/bitauth/libauth/commit/1803848))

### Tests

- reduce wasm memory needed for tests ([43c833c](https://github.com/bitauth/libauth/commit/43c833c))

## [1.11.0](https://github.com/bitauth/libauth/compare/v1.10.0...v1.11.0) (2019-11-22)

### Features

- use preimages instead of hashes in VM, add preimage components to compiler ([8949d5b](https://github.com/bitauth/libauth/commit/8949d5b))

## [1.10.0](https://github.com/bitauth/libauth/compare/v1.9.0...v1.10.0) (2019-11-21)

### Features

- **compiler:** add signing_serialization.covered_bytecode_prefix to operations ([8989592](https://github.com/bitauth/libauth/commit/8989592))

## [1.9.0](https://github.com/bitauth/libauth/compare/v1.8.2...v1.9.0) (2019-11-21)

### Features

- **compiler:** add built-in variables ([d68aea4](https://github.com/bitauth/libauth/commit/d68aea4))

### Tests

- add tests for utf8 utils ([0f73587](https://github.com/bitauth/libauth/commit/0f73587))

### [1.8.2](https://github.com/bitauth/libauth/compare/v1.8.1...v1.8.2) (2019-11-15)

### Bug Fixes

- **compiler:** stringify error messages inside resolved scripts ([d147c75](https://github.com/bitauth/libauth/commit/d147c75))
- **parser:** fix crash on improper negative BigIntLiterals, e.g. "42-" ([5547ee7](https://github.com/bitauth/libauth/commit/5547ee7))

### [1.8.1](https://github.com/bitauth/libauth/compare/v1.8.0...v1.8.1) (2019-11-12)

### Bug Fixes

- **compiler:** avoid crash if 0th sample is the error ([06d86d8](https://github.com/bitauth/libauth/commit/06d86d8))

## [1.8.0](https://github.com/bitauth/libauth/compare/v1.7.1...v1.8.0) (2019-11-12)

### Bug Fixes

- typo ([5820369](https://github.com/bitauth/libauth/commit/5820369))

### Features

- **compiler:** add source property to ResolvedSegmentScriptBytecode ([74d8625](https://github.com/bitauth/libauth/commit/74d8625))

### [1.7.1](https://github.com/bitauth/libauth/compare/v1.7.0...v1.7.1) (2019-11-05)

### Bug Fixes

- **types:** export ResolvedSegment types ([830d63e](https://github.com/bitauth/libauth/commit/830d63e))

## [1.7.0](https://github.com/bitauth/libauth/compare/v1.6.7...v1.7.0) (2019-11-05)

### Features

- **compiler:** include source type in all bytecode resolve segments ([754ae88](https://github.com/bitauth/libauth/commit/754ae88))

### [1.6.7](https://github.com/bitauth/libauth/compare/v1.6.6...v1.6.7) (2019-11-05)

### Bug Fixes

- **parser:** make whitespace optional between recognized parsers ([1f28d29](https://github.com/bitauth/libauth/commit/1f28d29))

### [1.6.6](https://github.com/bitauth/libauth/compare/v1.6.5...v1.6.6) (2019-11-02)

### Bug Fixes

- **compiler:** use CompilerKeyOperationsMinimal by default ([0d27b48](https://github.com/bitauth/libauth/commit/0d27b48))

### [1.6.5](https://github.com/bitauth/libauth/compare/v1.6.4...v1.6.5) (2019-11-01)

### [1.6.4](https://github.com/bitauth/libauth/compare/v1.6.3...v1.6.4) (2019-11-01)

### [1.6.3](https://github.com/bitauth/libauth/compare/v1.6.2...v1.6.3) (2019-10-31)

### Bug Fixes

- **compiler:** only attempt to return bytecode on successful compilations ([a987d54](https://github.com/bitauth/libauth/commit/a987d54))

### Build System

- **deps:** bump lodash.merge from 4.6.1 to 4.6.2 ([#35](https://github.com/bitauth/libauth/issues/35)) ([fbd038d](https://github.com/bitauth/libauth/commit/fbd038d))
- **deps:** bump lodash.template from 4.4.0 to 4.5.0 ([#36](https://github.com/bitauth/libauth/issues/36)) ([0cffd2f](https://github.com/bitauth/libauth/commit/0cffd2f))
- **deps:** bump mixin-deep from 1.3.1 to 1.3.2 ([#34](https://github.com/bitauth/libauth/issues/34)) ([c5c835f](https://github.com/bitauth/libauth/commit/c5c835f))
- **scripts:** add watch:module-only task ([8ae64fe](https://github.com/bitauth/libauth/commit/8ae64fe))

### [1.6.2](https://github.com/bitauth/libauth/compare/v1.6.1...v1.6.2) (2019-10-30)

### Bug Fixes

- **parser:** fix several parser bugs, add parseScript tests ([bf56ea9](https://github.com/bitauth/libauth/commit/bf56ea9))

### [1.6.1](https://github.com/bitauth/libauth/compare/v1.6.0...v1.6.1) (2019-10-30)

### Bug Fixes

- **AuthenticationTemplate:** add \$schema as optional field on AuthenticationTemplate ([875cc11](https://github.com/bitauth/libauth/commit/875cc11))

### Build System

- **package:** switch typings from main to module build ([bccab5f](https://github.com/bitauth/libauth/commit/bccab5f))

## [1.6.0](https://github.com/bitauth/libauth/compare/v1.5.5...v1.6.0) (2019-10-30)

### Bug Fixes

- **compiler:** correct use of "a" vs. "an" in error messages ([4892685](https://github.com/bitauth/libauth/commit/4892685))

### Build System

- **hashes:** pin sha256 of rustup docker image ([98b2a13](https://github.com/bitauth/libauth/commit/98b2a13))

### Features

- add JSON schema for authentication templates ([f054757](https://github.com/bitauth/libauth/commit/f054757))

### [1.5.5](https://github.com/bitauth/libauth/compare/v1.5.4...v1.5.5) (2019-08-23)

### Bug Fixes

- **opCheckMultiSig:** fix potential undefined public key ([dda926a](https://github.com/bitauth/libauth/commit/dda926a))
- **sampledEvaluateReductionTraceNodes:** allow empty scripts to be debugged properly ([f6f8347](https://github.com/bitauth/libauth/commit/f6f8347))

### [1.5.4](https://github.com/bitauth/libauth/compare/v1.5.3...v1.5.4) (2019-08-21)

### Bug Fixes

- **compiler:** allow empty programs to be compiled ([41275c0](https://github.com/bitauth/libauth/commit/41275c0))

### [1.5.3](https://github.com/bitauth/libauth/compare/v1.5.2...v1.5.3) (2019-08-20)

### Bug Fixes

- **module:** include parsimmon in module build ([eab7b87](https://github.com/bitauth/libauth/commit/eab7b87))

### [1.5.2](https://github.com/bitauth/libauth/compare/v1.5.1...v1.5.2) (2019-08-20)

### Tests

- **stringify:** improve docs, add tests ([f599364](https://github.com/bitauth/libauth/commit/f599364))

### [1.5.1](https://github.com/bitauth/libauth/compare/v1.5.0...v1.5.1) (2019-08-15)

### Bug Fixes

- **schnorr:** spelling ([6a08fb4](https://github.com/bitauth/libauth/commit/6a08fb4))

## [1.5.0](https://github.com/bitauth/libauth/compare/v1.4.0...v1.5.0) (2019-08-15)

### Features

- **auth:** complete BCH auth vm, schnorr, and BTL compiler ([7d917e4](https://github.com/bitauth/libauth/commit/7d917e4))
- **auth:** draft authentication-related APIs ([c9fdf8e](https://github.com/bitauth/libauth/commit/c9fdf8e))

<a name="1.4.0"></a>

# [1.4.0](https://github.com/bitauth/libauth/compare/v1.3.0...v1.4.0) (2018-11-12)

### Bug Fixes

- **secp256k1:** Finalize implementation for tweak functions, compile new WASM ([7726bae](https://github.com/bitauth/libauth/commit/7726bae))
- **secp256k1:** prettier ([54e20a5](https://github.com/bitauth/libauth/commit/54e20a5))

### Features

- **secp256k1:** Add public and private key tweaking functions ([bcc639e](https://github.com/bitauth/libauth/commit/bcc639e))
- **secp256k1:** export tweak methods ([f763916](https://github.com/bitauth/libauth/commit/f763916))

<a name="1.3.0"></a>

# [1.3.0](https://github.com/bitauth/libauth/compare/v1.2.0...v1.3.0) (2018-10-04)

### Features

- **secp256k1:** add recoverable ECDSA signature support ([#13](https://github.com/bitauth/libauth/issues/13)) ([ae03dd4](https://github.com/bitauth/libauth/commit/ae03dd4))

<a name="1.2.0"></a>

# [1.2.0](https://github.com/bitauth/libauth/compare/v1.1.1...v1.2.0) (2018-07-08)

### Features

- **utils:** export common utility functions for working with libauth ([0124a2e](https://github.com/bitauth/libauth/commit/0124a2e))

<a name="1.1.1"></a>

## [1.1.1](https://github.com/bitauth/libauth/compare/v1.1.0...v1.1.1) (2018-06-27)

<a name="1.1.0"></a>

# [1.1.0](https://github.com/bitauth/libauth/compare/v1.0.3...v1.1.0) (2018-06-27)

### Features

- **hashes:** expose WebAssembly sha256, sha512, and sha1 implementations ([797f738](https://github.com/bitauth/libauth/commit/797f738))
- **ripemd160:** add a purely-functional, incremental, rust ripemd160 implementation ([b7f4e37](https://github.com/bitauth/libauth/commit/b7f4e37))
- **ripemd160:** expose a purely-functional, WebAssembly ripemd160 implementation ([315bf23](https://github.com/bitauth/libauth/commit/315bf23))
- **ripemd160:** include a rust ripemd160 implementation ([792a01c](https://github.com/bitauth/libauth/commit/792a01c))
- **sha256:** include a rust sha256 implementation ([76d8a30](https://github.com/bitauth/libauth/commit/76d8a30))

<a name="1.0.3"></a>

## [1.0.3](https://github.com/bitauth/libauth/compare/v1.0.2...v1.0.3) (2018-06-04)

<a name="1.0.2"></a>

## [1.0.2](https://github.com/bitauth/libauth/compare/v1.0.1...v1.0.2) (2018-06-04)

### Bug Fixes

- **Secp256k1:** copy the underlying buffer when returning values from Secp256k1 ([62bfe06](https://github.com/bitauth/libauth/commit/62bfe06))

<a name="1.0.1"></a>

## [1.0.1](https://github.com/bitauth/libauth/compare/v1.0.0...v1.0.1) (2018-05-29)

### Bug Fixes

- **package:** allow consumers to install libauth with npm ([e7a0c37](https://github.com/bitauth/libauth/commit/e7a0c37))

<a name="1.0.0"></a>

# 1.0.0 (2018-05-29)

### Features

- **secp256k1Wasm:** expose a WebAssembly version of libsecp256k1 ([31f768e](https://github.com/bitauth/libauth/commit/31f768e))
