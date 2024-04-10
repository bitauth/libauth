---
'@bitauth/libauth': major
---

Add support for relative BIP32 derivation

Relative BIP32 Hierarchical Deterministic (HD) derivation is now supported via the [`deriveHdPathRelative`](https://libauth.org/functions/deriveHdPathRelative.html) utility, and the Libauth compiler has been updated to explicitly use relative derivation by default for `HdKey`s. Absolute derivation has also been enhanced to validate the expected depth of provided HD keys.

If you application relies on relative derivation but uses [`deriveHdPath`](https://libauth.org/functions/deriveHdPath.html), you'll need to switch to using the new [`deriveHdPathRelative`](https://libauth.org/functions/deriveHdPathRelative.html), as absolute derivation will now fail if provided with a non-zero depth HD key.

Fixes [#49](https://github.com/bitauth/libauth/issues/49).
