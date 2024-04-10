# Contributing to Libauth

Thanks for your interest! Contributions are very welcome.

## Getting Started

This library requires [Yarn](https://yarnpkg.com/) for development. With `Node.js` installed, the `yarn` package manager can be installed by running `corepack enable`. Once `yarn` is available:

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

# Libauth's Conventions

Below you'll find the conventions we're trying to follow. Of course, please feel free to send PRs to improve these guidelines too.

## Design Goals

This library should provide the primitives needed to hack on bitcoin and bitcoin-related ideas.

1.  **Flexible** - Consumers should be able to import only the functionality they need.
2.  **Simple** - Functions should be simple and return one type (or an error `string`).
3.  **Portable** – All code should work on every platform (no Node.js bindings or separate browser versions).

## Design Guidelines

- **Start small, compose** - Compose larger functions from their smallest possible components.
- **Export early and often** - Let consumers access functionality at all levels of complexity (for maximum remix-ability). Make it reasonable for consumers to substitute their own implementations where possible. For consumers where code-size is an issue, this library should be easily tree-shakable to the minimum possible code needed.
- **Check types with TypeScript** - Runtime type-checking is a code smell. If the function accepts a string, assume it's been given a string. TypeScript definitions should expose improperly called functions to the developer at compile time, don't re-implement it at runtime.
  - Exception: where TypeScript's lack of dependant types makes validating certain properties of a type (e.g. the length of a `Uint8Array`), runtime type-checking should be used to detect and return errors.
- **Simple > ergonomic** - Clever, javascript-y interfaces are fun until they're limiting. We export simple primitives; other projects can wrap this library to provide friendlier interfaces.
- **Clarity > performance** - Performance is a secondary goal. If our consumers need to squeeze out performance from a single machine, they should switch to something lower-level. The best way to speed up a consumer of this library is to parallelize it across more hardware.
- **Don't overvalue historical names** - Many bitcoin implementations make imprecise (and even misleading) naming choices for historical reasons. We make little effort to match the type/function names of other bitcoin implementations; names should be chosen to improve clarity.
- **Don't add package dependencies** - This library should be as simple and stable as possible. Generally, if something is hard enough to warrant bringing in a dependency, it's something this library should provide. (Can you compile and expose a WASM version?)

## Some Practical Details

- **Use `eslint-disable-next-line` or `eslint-disable-line`** - It's ok to disable eslint; in some cases, rules should be disabled every time they're hit (e.g. `no-bitwise`). By using single-line disables, we clearly mark intentional deviations from our conventions.
- **Avoid Hungarian notation & name prefixing** – Including the type of a variable in its name is a code smell: a name should clearly describe only one concept, and types are the business of the type system. Likewise, using prefixes to distinguish between an interface and an instance typically indicates the concepts should be simplified. E.g. `IChecker` and `Checker` – this is likely made unnecessarily complex to accommodate an object-oriented style. Consider replacing with a single function (or if instantiation is required, an object containing only stateless functions).
- **Don't throw things** (see also: [`errors.md`](../docs/errors.md)) – instead, return a result that can be either a success or error type. This strategy encourages a more functional approach to problems, and pragmatically, [TypeScript does not yet offer a `throws` clause or otherwise](https://github.com/microsoft/TypeScript/issues/13219), so only this strategy allows errors to be well-typed.
  - A good pattern is `() => string | ResultType`, where ResultType is the desired output, and error messages are returned as a string. Consumers can easily use `typeof result === 'string'` to narrow the resulting type.
  - When `ResultType` is also a string, use an object with a logically-named result property, e.g. `() => string | { phrase: string }`.
  - **Exception**: errors that should never happen during correct usage of a function may be either 1) detected by type checking or 2) thrown. For example, if a function always expects 32-byte Uint8Array inputs (like `encodeCashAddress`), an incorrectly sized Uint8Array implies incorrect usage of the function by the implementing application. Such implementation errors should ideally be detected at development time and never occur at runtime. In these cases, Libauth defaults to throwing an `Error` to avoid complicating consumer code with error handling details, but an optional `throwErrors` parameter should usually allow for fully type-safe operation (when set to `false`). In these cases, ensure that the successful result retains the same shape regardless of error handling behavior, e.g. `ThrowErrors extends true ? CashAddressResult : CashAddressResult | string` rather than `ThrowErrors extends true ? string : CashAddressResult | string`.
- **Use object parameters for non-trivial utilities** – While object parameters would be excessively verbose for some simple utilities (e.g. `splitEvery('abcde', 2)` vs. a hypothetical `splitEvery({ input: 'abcde', chunkLength: 2 })`), higher-level utilities should almost always accept a single object parameter. This 1) makes it easier for consumers to identify usage mistakes (particularly where multiple parameters share a type; if [typescript-eslint#8608](https://github.com/typescript-eslint/typescript-eslint/issues/8608#issuecomment-2007697830) lands, we can enforce this with eslint) and 2) allows us to later add new optional parameters without breaking backwards compatibility or requiring excessive parameter counts.
- **Test the import** – when importing modules within the library, aim to import from a sibling or a sibling of the closest mutual parent module (this helps to avoid import cycles), rather than importing from a higher-level export (like `lib.ts`). When importing modules within test files, always import directly from the top-level `lib.ts` file – this ensures that intended public functionality is available and working as expected. (Note: this is also enforced by our eslint configuration.)
- **Try the formatting utilities** – especially when writing tests for large, complex objects, the `stringify` and `stringifyTestVector` utilities can save you a lot of time.
