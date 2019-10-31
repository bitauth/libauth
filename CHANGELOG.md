# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

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
