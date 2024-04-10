# Libauth Documentation

These guides introduce some of the high-level concepts and functionality provided by Libauth.

- [Installation](./install.md)
- [Handling Errors](./errors.md)
- [Cryptography](./crypto.md)
- [Keys](./keys.md)
- [Addresses](./addresses.md)
- [Verifying Transactions](./verify-transactions.md)
- [Wallets & Transaction Creation](./wallets.md)

## More Examples

In addition to the usage examples in these guides, note that **Libauth includes comprehensive tests that can help demonstrate usage of all functionality**.

For example, utilities related to hexadecimal-encoded strings are defined in [`hex.ts`](../src/lib/format/hex.ts); for thorough usage examples, see the co-located [`hex.spec.ts`](../src/lib/format/hex.spec.ts). You can also use GitHub search to see how a particular utility is used throughout the library, e.g. [`splitEvery`](https://github.com/search?q=repo%3Abitauth%2Flibauth+splitEvery&type=code).
