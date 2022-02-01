# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [1.19.1](https://github.com/bitauth/libauth/compare/v1.19.0...v1.19.1) (2022-02-01)


### Bug Fixes

* **secp256k1:** prevent vulnerabilities in consumers which don't validate input lengths ([7fc75c9](https://github.com/bitauth/libauth/commit/7fc75c90be441cf22f3bb7946363e78fa0a61b17))

## [1.19.0](https://github.com/bitauth/libauth/compare/v1.18.1...v1.19.0) (2021-12-08)


### Features

* expose validatePublicKey method on secp256k1 ([#83](https://github.com/bitauth/libauth/issues/83)) ([0f84420](https://github.com/bitauth/libauth/commit/0f84420483ca0d8782e49bd97d503066f95b0dbe))

### [1.18.1](https://github.com/bitauth/libauth/compare/v1.18.0...v1.18.1) (2021-02-26)


### Bug Fixes

* refactor binToBigIntUint64LE to support safari ([#71](https://github.com/bitauth/libauth/issues/71)) ([d41f3cc](https://github.com/bitauth/libauth/commit/d41f3cc7dfcbefe8a8bd04ce855122836eb47417))

## [1.18.0](https://github.com/bitauth/libauth/compare/v1.17.3...v1.18.0) (2021-02-11)


### Features

* add Int16LE and Int32LE bin <-> Number utilities ([60c6580](https://github.com/bitauth/libauth/commit/60c6580f2be517545555940c3f71b389afd35eed)), closes [#66](https://github.com/bitauth/libauth/issues/66)


### Bug Fixes

* make bigIntToBinUint64LE compatible with Safari ([a884702](https://github.com/bitauth/libauth/commit/a88470284684a1a21709f78a067ab529cb01ca42)), closes [#70](https://github.com/bitauth/libauth/issues/70) [#69](https://github.com/bitauth/libauth/issues/69)

### [1.17.3](https://github.com/bitauth/libauth/compare/v1.17.2...v1.17.3) (2020-10-23)

### [1.17.2](https://github.com/bitauth/libauth/compare/v1.17.1...v1.17.2) (2020-09-15)

### [1.17.1](https://github.com/bitauth/libauth/compare/v1.17.0...v1.17.1) (2020-08-08)


### Bug Fixes

* **OP_REVERSEBYTES:** clone stack item before reversing ([071f9cd](https://github.com/bitauth/libauth/commit/071f9cddfdba7e326eb69886cf4ddefd985b0f24))

## [1.17.0](https://github.com/bitauth/libauth/compare/v1.16.0...v1.17.0) (2020-08-07)


### Features

* add support for OP_REVERSEBYTES to BCH VM ([965bd6f](https://github.com/bitauth/libauth/commit/965bd6f9680c20015ff18a3d29348a2fdce8bc56)), closes [#56](https://github.com/bitauth/libauth/issues/56)


### Bug Fixes

* update current BCH instruction set ([d0bff0c](https://github.com/bitauth/libauth/commit/d0bff0c68e543f62abadd81b01d0f69ebd3b2841))

## [1.16.0](https://github.com/bitauth/libauth/compare/v1.15.4...v1.16.0) (2020-07-21)


### Features

* **scenarios:** support "pushed" and "invalid" properties ([a38544a](https://github.com/bitauth/libauth/commit/a38544a797711175d0cc18cd967fb9f1fc88c827))

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
