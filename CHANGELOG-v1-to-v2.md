# Migrating from v1 to v2

Libauth is now a [pure ESM package](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c), simplifying the developer experience by allowing WASM crypto to be instantiated internally/automatically by default 🎉. This refactor also simplifies the usage of and types surrounding Libauth virtual machines and compilers, and several other APIs have been improved.

New, dedicated Telegram channels are also available for [Libauth release announcements](https://t.me/libauth) and [Libauth developer discussions](https://t.me/libauth_devs).

## Simplified Virtual Machine Types

Previously, Libauth VMs were very strictly-typed such that error messages and opcodes used chain-specific enums (e.g. `AuthenticationErrorBCH` and `OpcodesBCH`). While this configuration did ensure that VMs and VM results were strictly-typed with chain information, the configuration ultimately made library components much harder to remix without deep knowledge of TypeScript's type system. In both cases, such type information rarely catches downstream implementation bugs:

- Differing opcode enums effectively only narrow the real-time type from `number` to `0 | 1 | 2 | ... | 254 | 255`.
- Differing error enums only offer a slight benefit in making error matching slightly simpler, and they present a significant disadvantage in that they preclude the contextualization of errors – each error string must be fully defined at compile time.

In both cases, the differing types offer only very marginal benefit at the cost of exceptional added complexity (widespread proliferation of generic types throughout the codebase). This refactor migrates the opcode type to `number` and the error type to `string | undefined`, leaving the opcode and error enums primarily as a form of documentation.

## Simplified VM Usage

Transaction validation infrastructure is now a part of each VM instance, so transaction validation is as simple as `vm.verify({ transaction, sourceOutputs })` (returning either `true` or an error `string`). This behavior offers individual VMs full control of transaction parsing and validation, allowing Libauth VMs to implement proposals for significant modifications like new transaction formats or high-level transaction validation changes.

## Simplified VM Operations and Instruction Sets

Beginning with this version, Libauth will no longer maintain support for defunct VM versions. For example, `BCH_2019_05` was an upgrade which enabled Schnorr signature support in CHECKSIG and CHECKDATASIG and a clean-stack exception for SegWit recovery. The `BCH_2019_05` VM was replaced without a network split by the `BCH_2019_11` upgrade, meaning `BCH_2019_05` is no longer in use by any public network. As such, relevant code paths, flags, and other VM-specific functionality for `BCH_2019_05` has been removed to simplify currently supported Libauth VMs. (Of course, historical implementations will always remain available in previously-released versions of Libauth.)

With this change, the existing VM implementations have been significantly simplified, removing unused code and reducing type complexity. Built-in VM instruction sets are now specified in a single file, making them easier to review and copy.

## Additional Changes

Several other improvements have been made:

- **Default crypto interface instances** – because Libauth is now pure ESM, all of Libauth's WebAssembly cryptography implementations can now be automatically instantiated internally by the library. All Libauth methods that require crypto now use these automatically-instantiated implementations by default (as a default parameter), but consumers can opt-out of the behavior by providing a replacement implementation (and build tools that support dead code elimination/tree shaking of default parameters can automatically drop the unused crypto implementations.) To support this functionality, the parameter ordering of many functions have been modified to shift crypto implementations to the end (as optional parameters).
- **`Secp256k1` doesn't throw** - the `Secp256k1` interface previously threw errors, breaking from Libauth's convention of well-typed errors. All `Secp256k1` methods now return error messages as `string`s where applicable.
- **CashAssembly** – is the new name for Bitauth Templating Language (BTL), the simple language used within Libauth templates.
- **Consistent capitalization, miscellaneous corrections** – some exports have been renamed to consistently use camelCase (for functions) or PascalCase (for types/interfaces), respectively. Several exports have been renamed for discoverability and consistency with other exports.
- **Expanded state available to VMs and compilers** – VM and compiler operations can now access all raw contents of transactions and source outputs.
- **Expanded capabilities of template scenarios** – scenarios can now represent any transaction shape and generate full, serializable transactions.
- **New VM bytecode test vector generation** – Libauth includes a new `vmb_tests` test vector generation system to produce sets of cross-implementation test vectors as serialized transactions; this allows for sets of test vectors that fully test all transaction validation infrastructure without making assumptions about implementation internals.
- **Improved CashAddress utilities** – cash address utilities no longer require enums, hash lengths are measured in bytes rather than bits, and `type` is distinguished from `typeBit`.
- **More consistent [encoding/decoding utilities](./docs/encodings-and-formats.md)** – Several decoding methods have been renamed and refactored to use the new ReadPosition API.
- **More consistent [error handling](./docs/errors.md)** – all possible errors are surfaced in type signatures as `string`s.
