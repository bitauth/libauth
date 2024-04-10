# Installation

Welcome! Libauth is designed to be low-level and lightweight: all functionality is exported as simple functions, so your bundler can eliminate the code you don't use.

Libauth is a [pure ESM package](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c), so Node.js v12 or higher is required (or Deno), and [using ESM is recommended](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c#how-can-i-move-my-commonjs-project-to-esm).

## Node.js Usage

To get started, install `@bitauth/libauth` in your environment:

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

### Web Usage

For web projects, a bundler with [dead-code elimination](https://rollupjs.org/guide/en/#tree-shaking) (A.K.A. "tree shaking") is **strongly recommended** – Libauth is designed to minimize application code size, and dead-code elimination will improve load performance in nearly all applications.

Consider **[Vite](https://vitejs.dev/) (recommended)**, [Parcel](https://parceljs.org/), [Rollup](https://rollupjs.org/), [Webpack](https://webpack.js.org/), or a bundler designed for your web framework.

### Deno Usage

For Deno usage, Libauth can be imported with the `npm:` protocol:

```ts
import { hexToBin } from 'npm:@bitauth/libauth';

console.log(hexToBin('beef'));
```

### Using Typescript Types

**Libauth should work with modern TypeScript projects without any configuration.**

If you're having trouble, note that Libauth uses [`BigInt`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt), [`WebAssembly`](https://developer.mozilla.org/en-US/docs/WebAssembly), and `es2017` features for some functionality. To type-check this library in you application (without [`skipLibCheck`](https://www.typescriptlang.org/tsconfig#skipLibCheck)), your `tsconfig.json` will need a minimum `target` of `es2020` or `lib` must include `es2017` and `esnext.bigint`. If your application is not already importing types for `WebAssembly`, you may also need to add `dom` to `lib`.
