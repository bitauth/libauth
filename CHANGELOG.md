# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

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
