---
'@bitauth/libauth': patch
---

`generateRandomBytes`: always verify unique results across two runs

Fixes [#119](https://github.com/bitauth/libauth/issues/119). Old behavior is available at `generateRandomBytesUnchecked`.
