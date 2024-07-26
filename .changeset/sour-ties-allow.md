---
'@bitauth/libauth': patch
---

Begin implementation of BCH_2025_05 and BCH_SPEC

- Revised `AuthenticationVirtualMachine` to remove `clone` (obviated by wide availability of `structuredClone`) and add `initialize`, allowing VM proposals to add to the program state of an existing VM (in a type-safe way) without duplicating its unchanged logic.
- Clarified documentation around contributing upgrade proposals to Libauth VMs
- Allow usage of any `BCH_SPEC` opcodes in `assembleBytecodeBch`/`disassembleBytecodeBch`
