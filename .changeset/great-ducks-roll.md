---
'@bitauth/libauth': minor
---

Deprecate `BCH_2022_05` VM, add `BCH_2023_05`, `BCH_2025_05`, and `BCH_SPEC` VMs, update vmb_tests

Additionally, all exports have been renamed to more consistently adhere to the `camelCase` capitalization style, without exceptions for abbreviations. For example `assembleBytecodeBCH` is now `assembleBytecodeBch`. To ensure backwards-compatibility, aliases (marked with `@deprecated` TSdoc tags) are also exported using the old capitalization. These aliases will be removed in a future major version.
