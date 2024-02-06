# Contributing to Libauth

Thanks for your interest! Contributions are very welcome.

Below you'll find the conventions we're trying to follow. Of course, please feel free to send PRs to improve these guidelines too.

## Design Goals

This library should provide the primitives needed to hack on bitcoin and bitcoin-related ideas.

1.  **flexible** - Consumers should be able to import only the functionality they need
2.  **simple** - Functions should be simple and return one type
3.  **portable** – All code should work on every platform (no Node.js bindings or separate browser versions)

## Design Guidelines

- **start small, compose** - Compose larger functions from their smallest possible components.
- **export early and often** - Let consumers access functionality at all levels of complexity (for maximum remix-ability). Make it reasonable for consumers to substitute their own implementations where possible. For consumers where code-size is an issue, this library should be easily tree-shakable to the minimum possible code needed.
- **trust the caller** - Runtime type-checking is a code smell. If the function accepts a string, assume it's been given a string. TypeScript definitions should expose improperly called functions to the developer at compile time, don't re-implement it at runtime. (Where TypeScript's lack of dependent types prevents us from checking the validity of an input at compile time, resist the urge to check it at runtime. Trust that the caller can test their code themselves.)
- **simple > ergonomic** - Clever, javascript-y interfaces are fun until they're limiting. We export simple primitives; other projects can wrap this library to provide friendlier interfaces.
- **clarity > performance** - Performance is a secondary goal. If our consumers need to squeeze out performance from a single machine, they should switch to something lower-level. The best way to speed up a consumer of this library is to parallelize it across more hardware.
- **don't overvalue historical names** - Many bitcoin implementations make imprecise (and even misleading) naming choices for historical reasons. We make little effort to match the type/function names of other bitcoin implementations; names should be chosen to improve clarity.
- **don't add package dependencies** - This library should be as simple and stable as possible. Generally, if something is hard enough to warrant bringing in a dependency, it's something this library should provide. (Can you compile and expose a WASM version?)

## Some Practical Details

- **accept immutable, return mutable** - We should always return mutable types to allow consumers the option of mutating results without running afoul of type-checking. For the same reason, when we accept a value, we should generally avoid mutating it.
- **use `eslint-disable-next-line` or `eslint-disable-line`** - It's ok to disable eslint; in some cases, rules should be disabled every time they're hit (e.g. `no-bitwise`). By using single-line disables, we clearly mark intentional deviations from our conventions.
- **avoid Hungarian notation & name prefixing** – Including the type of a variable in its name is a code smell: a name should clearly describe only one concept, and types are the business of the type system. Likewise, using prefixes to distinguish between an interface and an instance typically indicates the concepts should be simplified. E.g. `IChecker` and `Checker` – this is likely made unnecessarily complex to accommodate an object-oriented style. Consider replacing with a single function (or if instantiation is required, an object containing only stateless functions).
- **don't throw things** – instead, return a result that can be either a success or error type. This strategy encourages a more functional approach to problems, and pragmatically, [TypeScript does not yet offer a `throws` clause or otherwise](https://github.com/microsoft/TypeScript/issues/13219), so only this strategy allows errors to be well-typed. A good pattern is `() => string | ResultType`, where ResultType is the desired output, and error messages are returned as a string. Consumers can easily use `typeof result === 'string'` to narrow the resulting type. When errors are more complex or `ResultType` is also a string, use an object with a `success` property, e.g. `() => { success: true, bytecode: Uint8Array } | { success: false, errors: ErrorType[] }`.
  - Exception: errors that can never happen during correct usage of a function may be either 1) detected by type checking or 2) thrown. For example, if a function always expects 32-byte Uint8Array inputs (like `encodeCashAddress`), an incorrectly sized Uint8Array implies incorrect usage of the function by the implementing application. Such implementation errors should ideally be detected at development time and never occur at runtime.
- **test the import** – when importing modules within the library, aim to import from a sibling or a sibling of the closest mutual parent module (this helps to avoid import cycles), rather than importing from a higher-level export (like `lib.ts`). When importing modules within test files, always import directly from the top-level `lib.ts` file – this ensures that intended public functionality is available and working as expected. (Note: this is also enforced by our eslint configuration.)
- **try the formatting utilities** – especially when writing tests for large, complex objects, the `stringify` and `stringifyTestVector` utilities can save you a lot of time.
