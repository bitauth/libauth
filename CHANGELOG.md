# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [1.12.0](https://github.com/bitjson/bitcoin-ts/compare/v1.11.1...v1.12.0) (2020-02-07)


### Features

* **base64:** improve base64 utils, tests, and docs ([ac9d3e0](https://github.com/bitjson/bitcoin-ts/commit/ac9d3e0138551178ef05eb331f4a3fe7de43c5bd))
* **CashAddress:** add support for CashAddress encoding, decoding, and error-correction ([85f640f](https://github.com/bitjson/bitcoin-ts/commit/85f640ff4fc9258ccd10f8b4036f99790c0193e4))
* **utils:** add time-related utils ([e2c95d1](https://github.com/bitjson/bitcoin-ts/commit/e2c95d1d234e41e38839e827e7ab28cd57217a1f))


### Bug Fixes

* **address:** export address in lib ([93e6d99](https://github.com/bitjson/bitcoin-ts/commit/93e6d99556311e894c003c8f3ca0983a5604c87d))
* **imports:** clean up imports, expose bitcoin-abc-utils ([312c667](https://github.com/bitjson/bitcoin-ts/commit/312c667fe3ff3085f0658f0ee1cce5041be0ec59))
* **vm:** avoid throwing on undefined unlocking bytecode, add tests ([339f1e5](https://github.com/bitjson/bitcoin-ts/commit/339f1e59c56cbd32b0ae2df1b17b02dcd3262b42)), closes [#41](https://github.com/bitjson/bitcoin-ts/issues/41)

### [1.11.1](https://github.com/bitjson/bitcoin-ts/compare/v1.11.0...v1.11.1) (2019-11-22)


### Bug Fixes

* **compiler:** make correspondingOutput optional (in case it doesn't exist) ([1803848](https://github.com/bitjson/bitcoin-ts/commit/1803848))


### Tests

* reduce wasm memory needed for tests ([43c833c](https://github.com/bitjson/bitcoin-ts/commit/43c833c))



## [1.11.0](https://github.com/bitjson/bitcoin-ts/compare/v1.10.0...v1.11.0) (2019-11-22)


### Features

* use preimages instead of hashes in VM, add preimage components to compiler ([8949d5b](https://github.com/bitjson/bitcoin-ts/commit/8949d5b))



## [1.10.0](https://github.com/bitjson/bitcoin-ts/compare/v1.9.0...v1.10.0) (2019-11-21)


### Features

* **compiler:** add signing_serialization.covered_bytecode_prefix to operations ([8989592](https://github.com/bitjson/bitcoin-ts/commit/8989592))



## [1.9.0](https://github.com/bitjson/bitcoin-ts/compare/v1.8.2...v1.9.0) (2019-11-21)


### Features

* **compiler:** add built-in variables ([d68aea4](https://github.com/bitjson/bitcoin-ts/commit/d68aea4))


### Tests

* add tests for utf8 utils ([0f73587](https://github.com/bitjson/bitcoin-ts/commit/0f73587))



### [1.8.2](https://github.com/bitjson/bitcoin-ts/compare/v1.8.1...v1.8.2) (2019-11-15)


### Bug Fixes

* **compiler:** stringify error messages inside resolved scripts ([d147c75](https://github.com/bitjson/bitcoin-ts/commit/d147c75))
* **parser:** fix crash on improper negative BigIntLiterals, e.g. "42-" ([5547ee7](https://github.com/bitjson/bitcoin-ts/commit/5547ee7))



### [1.8.1](https://github.com/bitjson/bitcoin-ts/compare/v1.8.0...v1.8.1) (2019-11-12)


### Bug Fixes

* **compiler:** avoid crash if 0th sample is the error ([06d86d8](https://github.com/bitjson/bitcoin-ts/commit/06d86d8))



## [1.8.0](https://github.com/bitjson/bitcoin-ts/compare/v1.7.1...v1.8.0) (2019-11-12)


### Bug Fixes

* typo ([5820369](https://github.com/bitjson/bitcoin-ts/commit/5820369))


### Features

* **compiler:** add source property to ResolvedSegmentScriptBytecode ([74d8625](https://github.com/bitjson/bitcoin-ts/commit/74d8625))



### [1.7.1](https://github.com/bitjson/bitcoin-ts/compare/v1.7.0...v1.7.1) (2019-11-05)


### Bug Fixes

* **types:** export ResolvedSegment types ([830d63e](https://github.com/bitjson/bitcoin-ts/commit/830d63e))



## [1.7.0](https://github.com/bitjson/bitcoin-ts/compare/v1.6.7...v1.7.0) (2019-11-05)


### Features

* **compiler:** include source type in all bytecode resolve segments ([754ae88](https://github.com/bitjson/bitcoin-ts/commit/754ae88))



### [1.6.7](https://github.com/bitjson/bitcoin-ts/compare/v1.6.6...v1.6.7) (2019-11-05)


### Bug Fixes

* **parser:** make whitespace optional between recognized parsers ([1f28d29](https://github.com/bitjson/bitcoin-ts/commit/1f28d29))



### [1.6.6](https://github.com/bitjson/bitcoin-ts/compare/v1.6.5...v1.6.6) (2019-11-02)


### Bug Fixes

* **compiler:** use CompilerKeyOperationsMinimal by default ([0d27b48](https://github.com/bitjson/bitcoin-ts/commit/0d27b48))



### [1.6.5](https://github.com/bitjson/bitcoin-ts/compare/v1.6.4...v1.6.5) (2019-11-01)



### [1.6.4](https://github.com/bitjson/bitcoin-ts/compare/v1.6.3...v1.6.4) (2019-11-01)



### [1.6.3](https://github.com/bitjson/bitcoin-ts/compare/v1.6.2...v1.6.3) (2019-10-31)


### Bug Fixes

* **compiler:** only attempt to return bytecode on successful compilations ([a987d54](https://github.com/bitjson/bitcoin-ts/commit/a987d54))


### Build System

* **deps:** bump lodash.merge from 4.6.1 to 4.6.2 ([#35](https://github.com/bitjson/bitcoin-ts/issues/35)) ([fbd038d](https://github.com/bitjson/bitcoin-ts/commit/fbd038d))
* **deps:** bump lodash.template from 4.4.0 to 4.5.0 ([#36](https://github.com/bitjson/bitcoin-ts/issues/36)) ([0cffd2f](https://github.com/bitjson/bitcoin-ts/commit/0cffd2f))
* **deps:** bump mixin-deep from 1.3.1 to 1.3.2 ([#34](https://github.com/bitjson/bitcoin-ts/issues/34)) ([c5c835f](https://github.com/bitjson/bitcoin-ts/commit/c5c835f))
* **scripts:** add watch:module-only task ([8ae64fe](https://github.com/bitjson/bitcoin-ts/commit/8ae64fe))



### [1.6.2](https://github.com/bitjson/bitcoin-ts/compare/v1.6.1...v1.6.2) (2019-10-30)


### Bug Fixes

* **parser:** fix several parser bugs, add parseScript tests ([bf56ea9](https://github.com/bitjson/bitcoin-ts/commit/bf56ea9))



### [1.6.1](https://github.com/bitjson/bitcoin-ts/compare/v1.6.0...v1.6.1) (2019-10-30)


### Bug Fixes

* **AuthenticationTemplate:** add $schema as optional field on AuthenticationTemplate ([875cc11](https://github.com/bitjson/bitcoin-ts/commit/875cc11))


### Build System

* **package:** switch typings from main to module build ([bccab5f](https://github.com/bitjson/bitcoin-ts/commit/bccab5f))



## [1.6.0](https://github.com/bitjson/bitcoin-ts/compare/v1.5.5...v1.6.0) (2019-10-30)


### Bug Fixes

* **compiler:** correct use of "a" vs. "an" in error messages ([4892685](https://github.com/bitjson/bitcoin-ts/commit/4892685))


### Build System

* **hashes:** pin sha256 of rustup docker image ([98b2a13](https://github.com/bitjson/bitcoin-ts/commit/98b2a13))


### Features

* add JSON schema for authentication templates ([f054757](https://github.com/bitjson/bitcoin-ts/commit/f054757))



### [1.5.5](https://github.com/bitjson/bitcoin-ts/compare/v1.5.4...v1.5.5) (2019-08-23)


### Bug Fixes

* **opCheckMultiSig:** fix potential undefined public key ([dda926a](https://github.com/bitjson/bitcoin-ts/commit/dda926a))
* **sampledEvaluateReductionTraceNodes:** allow empty scripts to be debugged properly ([f6f8347](https://github.com/bitjson/bitcoin-ts/commit/f6f8347))



### [1.5.4](https://github.com/bitjson/bitcoin-ts/compare/v1.5.3...v1.5.4) (2019-08-21)


### Bug Fixes

* **compiler:** allow empty programs to be compiled ([41275c0](https://github.com/bitjson/bitcoin-ts/commit/41275c0))



### [1.5.3](https://github.com/bitjson/bitcoin-ts/compare/v1.5.2...v1.5.3) (2019-08-20)


### Bug Fixes

* **module:** include parsimmon in module build ([eab7b87](https://github.com/bitjson/bitcoin-ts/commit/eab7b87))



### [1.5.2](https://github.com/bitjson/bitcoin-ts/compare/v1.5.1...v1.5.2) (2019-08-20)


### Tests

* **stringify:** improve docs, add tests ([f599364](https://github.com/bitjson/bitcoin-ts/commit/f599364))



### [1.5.1](https://github.com/bitjson/bitcoin-ts/compare/v1.5.0...v1.5.1) (2019-08-15)


### Bug Fixes

* **schnorr:** spelling ([6a08fb4](https://github.com/bitjson/bitcoin-ts/commit/6a08fb4))



## [1.5.0](https://github.com/bitjson/bitcoin-ts/compare/v1.4.0...v1.5.0) (2019-08-15)


### Features

* **auth:** complete BCH auth vm, schnorr, and BTL compiler ([7d917e4](https://github.com/bitjson/bitcoin-ts/commit/7d917e4))
* **auth:** draft authentication-related APIs ([c9fdf8e](https://github.com/bitjson/bitcoin-ts/commit/c9fdf8e))



<a name="1.4.0"></a>
# [1.4.0](https://github.com/bitjson/bitcoin-ts/compare/v1.3.0...v1.4.0) (2018-11-12)


### Bug Fixes

* **secp256k1:** Finalize implementation for tweak functions, compile new WASM ([7726bae](https://github.com/bitjson/bitcoin-ts/commit/7726bae))
* **secp256k1:** prettier ([54e20a5](https://github.com/bitjson/bitcoin-ts/commit/54e20a5))


### Features

* **secp256k1:** Add public and private key tweaking functions ([bcc639e](https://github.com/bitjson/bitcoin-ts/commit/bcc639e))
* **secp256k1:** export tweak methods ([f763916](https://github.com/bitjson/bitcoin-ts/commit/f763916))



<a name="1.3.0"></a>
# [1.3.0](https://github.com/bitjson/bitcoin-ts/compare/v1.2.0...v1.3.0) (2018-10-04)


### Features

* **secp256k1:** add recoverable ECDSA signature support ([#13](https://github.com/bitjson/bitcoin-ts/issues/13)) ([ae03dd4](https://github.com/bitjson/bitcoin-ts/commit/ae03dd4))



<a name="1.2.0"></a>
# [1.2.0](https://github.com/bitjson/bitcoin-ts/compare/v1.1.1...v1.2.0) (2018-07-08)


### Features

* **utils:** export common utility functions for working with bitcoin-ts ([0124a2e](https://github.com/bitjson/bitcoin-ts/commit/0124a2e))



<a name="1.1.1"></a>
## [1.1.1](https://github.com/bitjson/bitcoin-ts/compare/v1.1.0...v1.1.1) (2018-06-27)



<a name="1.1.0"></a>
# [1.1.0](https://github.com/bitjson/bitcoin-ts/compare/v1.0.3...v1.1.0) (2018-06-27)


### Features

* **hashes:** expose WebAssembly sha256, sha512, and sha1 implementations ([797f738](https://github.com/bitjson/bitcoin-ts/commit/797f738))
* **ripemd160:** add a purely-functional, incremental, rust ripemd160 implementation ([b7f4e37](https://github.com/bitjson/bitcoin-ts/commit/b7f4e37))
* **ripemd160:** expose a purely-functional, WebAssembly ripemd160 implementation ([315bf23](https://github.com/bitjson/bitcoin-ts/commit/315bf23))
* **ripemd160:** include a rust ripemd160 implementation ([792a01c](https://github.com/bitjson/bitcoin-ts/commit/792a01c))
* **sha256:** include a rust sha256 implementation ([76d8a30](https://github.com/bitjson/bitcoin-ts/commit/76d8a30))



<a name="1.0.3"></a>
## [1.0.3](https://github.com/bitjson/bitcoin-ts/compare/v1.0.2...v1.0.3) (2018-06-04)



<a name="1.0.2"></a>
## [1.0.2](https://github.com/bitjson/bitcoin-ts/compare/v1.0.1...v1.0.2) (2018-06-04)


### Bug Fixes

* **Secp256k1:** copy the underlying buffer when returning values from Secp256k1 ([62bfe06](https://github.com/bitjson/bitcoin-ts/commit/62bfe06))



<a name="1.0.1"></a>
## [1.0.1](https://github.com/bitjson/bitcoin-ts/compare/v1.0.0...v1.0.1) (2018-05-29)


### Bug Fixes

* **package:** allow consumers to install bitcoin-ts with npm ([e7a0c37](https://github.com/bitjson/bitcoin-ts/commit/e7a0c37))



<a name="1.0.0"></a>
# 1.0.0 (2018-05-29)


### Features

* **secp256k1Wasm:** expose a WebAssembly version of libsecp256k1 ([31f768e](https://github.com/bitjson/bitcoin-ts/commit/31f768e))
