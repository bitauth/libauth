---
'@bitauth/libauth': minor
---

Validate all keys prior to compilation, expose `validateCompilationData`

The compiler now validates all compilation data (i.e. validate all public and private keys), prior to compilation, regardless of whether or not the offending public or private key material is used. This is intended to surface software defects (particularly in the software used by counterparties) as early as possible.
