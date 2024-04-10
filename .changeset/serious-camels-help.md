---
'@bitauth/libauth': major
---

CashAssembly: `.signature` is now `.ecdsa_signature`

All CashAssembly scripts using the `.signature` operation should instead call `.ecdsa_signature` or switch to `.schnorr_signature`.

Additionally, `signing_serialization.token_prefix` is now available.
