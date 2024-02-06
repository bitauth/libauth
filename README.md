<p align="center">
  <a href="https://libauth.org/">
    <img src="https://libauth.org/assets/libauth.svg" alt="Libauth logo" width="200">
  </a>
</p>

<p align="center">
  An ultra-lightweight JavaScript library for Bitcoin Cash, Bitcoin, and Bitauth
  applications.
  <br />
  <br />
  <a href="https://libauth.org/"><strong>Explore API Reference »</strong></a>
  <br />
  <br />
  <a href="https://www.npmjs.com/package/@bitauth/libauth"><img src="https://img.shields.io/npm/v/@bitauth/libauth.svg" alt="NPM version" /></a>
  <a href="https://codecov.io/gh/bitauth/libauth"><img src="https://img.shields.io/codecov/c/github/bitauth/libauth/master.svg" alt="Codecov" /></a>
  <a href="https://github.com/bitauth/libauth/actions/workflows/ci.yaml"><img src="https://img.shields.io/github/actions/workflow/status/bitauth/libauth/ci.yaml?branch=master" alt="CI" /></a>
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

## Getting Started

To get started, install `@bitauth/libauth`:

```sh
npm install @bitauth/libauth
# OR
yarn add @bitauth/libauth
```

And import the functionality you need:

```typescript
import { secp256k1 } from '@bitauth/libauth';
import { msgHash, pubkey, sig } from './somewhere';

secp256k1.verifySignatureDERLowS(sig, pubkey, msgHash)
  ? console.log('🚀 Signature valid')
  : console.log('❌ Signature invalid');
```

Note, Libauth is a [pure ESM package](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c), so Node.js v12 or higher is required (or Deno), and [using ESM is recommended](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c#how-can-i-move-my-commonjs-project-to-esm).

### Web Usage

For web projects, a bundler with [dead-code elimination](https://rollupjs.org/guide/en/#tree-shaking) (A.K.A. "tree shaking") is **strongly recommended** – Libauth is designed to minimize application code size, and dead-code elimination will improve load performance in nearly all applications.

Consider [Vite](https://vitejs.dev/), [Parcel](https://parceljs.org/), [Rollup](https://rollupjs.org/), [Webpack](https://webpack.js.org/), or a bundler designed for your web framework.

### Deno Usage

Deno is a great runtime for working with Libauth. You can import the library from `unpkg.com`:

```ts
import { hexToBin } from 'https://unpkg.com/@bitauth/libauth/build/index.js';

console.log(hexToBin('beef'));
```

### Typescript Types

Libauth uses [`BigInt`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt), [`WebAssembly`](https://developer.mozilla.org/en-US/docs/WebAssembly), and `es2017` features for some functionality. To type-check this library in you application (without [`skipLibCheck`](https://www.typescriptlang.org/tsconfig#skipLibCheck)), your `tsconfig.json` will need a minimum `target` of `es2020` or `lib` must include `es2017` and `esnext.bigint`. If your application is not already importing types for `WebAssembly`, you may also need to add `dom` to `lib`.

## Contributing

Pull Requests welcome! Please see [`CONTRIBUTING.md`](.github/CONTRIBUTING.md) for details.

This library requires [Yarn](https://yarnpkg.com/) for development. With `Node.js` installed, the `yarn` package manager can be installed by running `corepack enable`. Once `yarn` is installed:

```sh
# note the use of --recursive to clone submodules
git clone --recursive https://github.com/bitauth/libauth.git
cd libauth
yarn
```

Libauth uses [Yarn's Zero-Installs strategy](https://yarnpkg.com/features/zero-installs) – all of [Libauth's dependencies are tracked in an independent git repository](https://github.com/bitauth/libauth-dependencies), and the dependency repo is automatically shallow-cloned into the `.yarn` directory.

Try running the test suite:

```
yarn test
```

You can also run the benchmarks (this will take a while):

```sh
yarn bench
```

During development, you may find it helpful to use the `watch` tasks:

```sh
# rebuild everything on save:
yarn watch
# run a subset of tests:
yarn watch:test --match='*encode*' --match='*decode*' --match='!*[script_tests]*' --match='!*[vmb_tests]*'
```
