[![NPM version](https://img.shields.io/npm/v/@bitauth/libauth.svg)](https://www.npmjs.com/package/@bitauth/libauth)
[![Codecov](https://img.shields.io/codecov/c/github/bitauth/libauth/master.svg)](https://codecov.io/gh/bitauth/libauth)
[![CircleCI](https://img.shields.io/circleci/project/github/bitauth/libauth/master.svg)](https://circleci.com/gh/bitauth/libauth)
[![GitHub stars](https://img.shields.io/github/stars/bitauth/libauth.svg?style=social&logo=github&label=Stars)](https://github.com/bitauth/libauth)

# Libauth

**An ultra-lightweight JavaScript library for Bitcoin, Bitcoin Cash, and Bitauth applications.**

Libauth has **no dependencies** and works in all JavaScript environments, including [Node.js](https://nodejs.org/), [Deno](https://deno.land/), and browsers.

## Purpose

Libauth is designed to be **flexible**, **lightweight**, and **easily auditable**. Rather than providing a single, overarching object-oriented API, all functionality is composed from simple functions. This has several benefits:

- **Flexibility** – Even highly-complex functionality is built-up from simpler functions. These lower-level functions can be used to experiment, tweak, and remix your own higher-level methods without maintaining a fork of the library.
- **Smaller application bundles** – Applications can import only the methods they need, eliminating the unused code (via [dead-code elimination](https://webpack.js.org/guides/tree-shaking/)).
- **Better auditability** – Beyond having no dependencies of its own, Libauth's [functional programming](https://en.wikipedia.org/wiki/Functional_programming) approach makes auditing critical code easier: smaller bundles, smaller functions, and less churn between versions (fewer cascading changes to object-oriented interfaces).
- **Fully-portable** – No platform-specific APIs are ever used, so the same code paths are used across all JavaScript environments (reducing the auditable "surface area" and simplifying library development).

## Getting Started

To get started, install `@bitauth/libauth`:

```sh
npm install @bitauth/libauth
# OR
yarn add @bitauth/libauth
```

And import the functionality you need:

```typescript
import { instantiateSecp256k1 } from '@bitauth/libauth';
import { msgHash, pubkey, sig } from './somewhere';

(async () => {
  const secp256k1 = await instantiateSecp256k1();
  secp256k1.verifySignatureDERLowS(sig, pubkey, msgHash)
    ? console.log('🚀 Signature valid')
    : console.log('❌ Signature invalid');
})();
```

**Note**: `@bitauth/libauth` uses [`BigInt`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt), [`WebAssembly`](https://developer.mozilla.org/en-US/docs/WebAssembly), and `es2017` features for some functionality. While support is required to use this functionality (Node.js v10 LTS or later), other parts of the library will continue to work in older environments. To include the necessary TypeScript library files in you application, add `"lib": ["es2017", "esnext.bigint", "dom"]` to your `tsconfig.json`.

## Stable API

The following APIs are considered stable, and will only include breaking changes in major version upgrades.

### WebAssembly ECDSA & Schnorr

- [instantiateSecp256k1](https://libauth.org/globals.html#instantiatesecp256k1)
- [Secp256k1 Interface](https://libauth.org/interfaces/secp256k1.html)

### WebAssembly Hashing Functions

- [instantiateRipemd160](https://libauth.org/globals.html#instantiateripemd160)
- [Ripemd160 Interface](https://libauth.org/interfaces/ripemd160.html)
- [instantiateSha1](https://libauth.org/globals.html#instantiatesha1)
- [Sha1 Interface](https://libauth.org/interfaces/sha1.html)
- [instantiateSha256](https://libauth.org/globals.html#instantiatesha256)
- [Sha256 Interface](https://libauth.org/interfaces/sha256.html)
- [instantiateSha512](https://libauth.org/globals.html#instantiatesha512)
- [Sha512 Interface](https://libauth.org/interfaces/sha512.html)

### Unstable APIs

Libauth also exports new, potentially unstable APIs. As these APIs stabilize, they will be included in the above reference.

[**Full API Documentation →**](https://libauth.org/)

---

<details>
<summary><strong>Contributing</strong></summary>

Pull Requests welcome! Please see [`CONTRIBUTING.md`](.github/CONTRIBUTING.md) for details.

This library requires [Yarn](https://yarnpkg.com/) for development. If you don't have Yarn, make sure you have `Node.js` installed (which ships with `npm`), then run `npm install -g yarn`. Once Yarn is installed:

```sh
# use --recursive to clone the secp256k1 submodule
git clone --recursive https://github.com/bitauth/libauth.git && cd libauth
```

Install the development dependencies:

```
yarn
```

Then try running the test suite:

```
yarn test
```

You can also run the benchmarks (this will take a while):

```sh
yarn bench
```

During development, you may find it helpful to use the testing `watch` tasks:

```sh
yarn watch # rebuild everything on save
yarn watch:test # run only the fast tests
yarn watch:test-slow # test everything
```

For more information about the available package scripts, run:

```sh
yarn run info
```

</details>
