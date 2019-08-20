[![NPM version](https://img.shields.io/npm/v/bitcoin-ts.svg)](https://www.npmjs.com/package/bitcoin-ts)
[![Codecov](https://img.shields.io/codecov/c/github/bitauth/bitcoin-ts/master.svg)](https://codecov.io/gh/bitauth/bitcoin-ts)
[![CircleCI](https://img.shields.io/circleci/project/github/bitauth/bitcoin-ts/master.svg)](https://circleci.com/gh/bitauth/bitcoin-ts)
[![GitHub stars](https://img.shields.io/github/stars/bitauth/bitcoin-ts.svg?style=social&logo=github&label=Stars)](https://github.com/bitauth/bitcoin-ts)

# bitcoin-ts

A flexible, strongly-typed, FP-inspired, highly-portable, typescript bitcoin library.

## Work in Progress

While this library is under active development, current functionality is production-ready (WASM implementations of secp256k1, ripemd160, sha256, sha512, and sha1).

More functionality will be exposed and stabilized in future versions.

## Design Goals

This library should provide the primitives needed to [hack](http://www.paulgraham.com/gh.html) on Bitcoin and Bitcoin-related ideas.

1.  **flexible** - Consumers should be able to import only the functionality they need
2.  **simple** - Functions should be simple and return one type
3.  **portable** – All code should work on every platform (no Node.js bindings or separate browser versions)

Please see the [Design Guidelines](.github/CONTRIBUTING.md) for more info.

## Usage

To use, simply install `bitcoin-ts`:

```sh
npm install bitcoin-ts
# OR
yarn add bitcoin-ts
```

And import the functionality you need:

```typescript
import { instantiateSecp256k1 } from 'bitcoin-ts';
import { msgHash, pubkey, sig } from './somewhere';

(async () => {
  const secp256k1 = await instantiateSecp256k1();
  secp256k1.verifySignatureDERLowS(sig, pubkey, msgHash)
    ? console.log('🚀 Signature valid')
    : console.log('❌ Signature invalid');
})();
```

**Note**: `bitcoin-ts` uses [`BigInt`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt), [`WebAssembly`](https://developer.mozilla.org/en-US/docs/WebAssembly), and es2017 features for some functionality. While support is required to use this functionality (Node.js v10 LTS or later), other parts of the library will continue to work in older environments.

To include the necessary TypeScript library files in you application, add `"lib": ["es2017", "esnext.bigint", "dom"]` to your `tsconfig.json`.

## API

The following APIs are considered stable, and will only include breaking changes in major version upgrades.

[**API Documentation →**](https://bitauth.github.io/bitcoin-ts/)

### ECDSA

- [instantiateSecp256k1](https://bitauth.github.io/bitcoin-ts/globals.html#instantiatesecp256k1)
- [Secp256k1 Interface](https://bitauth.github.io/bitcoin-ts/interfaces/secp256k1.html)

### Hashing Functions

- [instantiateRipemd160](https://bitauth.github.io/bitcoin-ts/globals.html#instantiateripemd160)
- [Ripemd160 Interface](https://bitauth.github.io/bitcoin-ts/interfaces/ripemd160.html)
- [instantiateSha1](https://bitauth.github.io/bitcoin-ts/globals.html#instantiatesha1)
- [Sha1 Interface](https://bitauth.github.io/bitcoin-ts/interfaces/sha1.html)
- [instantiateSha256](https://bitauth.github.io/bitcoin-ts/globals.html#instantiatesha256)
- [Sha256 Interface](https://bitauth.github.io/bitcoin-ts/interfaces/sha256.html)
- [instantiateSha512](https://bitauth.github.io/bitcoin-ts/globals.html#instantiatesha512)
- [Sha512 Interface](https://bitauth.github.io/bitcoin-ts/interfaces/sha512.html)

### Unstable APIs

The master branch of this repo also contains new, potentially unstable APIs. As these APIs stabilize, they will be included in the above Stable APIs.

## Contributing

Pull Requests welcome! Please see [`CONTRIBUTING.md`](.github/CONTRIBUTING.md) for details.

This library requires [Yarn](https://yarnpkg.com/) for development. If you don't have Yarn, make sure you have `Node.js` installed (which ships with `npm`), then run `npm install -g yarn`. Once Yarn is installed:

```sh
# use --recursive to clone the secp256k1 submodule
git clone --recursive https://github.com/bitjson/bitcoin-ts.git && cd bitcoin-ts
```

Install the development dependencies:

```
yarn
```

Then try running the test suite:

```
yarn test
```

You can also run the benchmarks (this may take a while):

```sh
yarn bench
```

During development, you may find it helpful to use one of the testing `watch` tasks:

```sh
yarn watch
# OR
yarn watch:with-crypto # when working on the crypto APIs
```

For more information about the available package scripts, run:

```sh
yarn run info
```
