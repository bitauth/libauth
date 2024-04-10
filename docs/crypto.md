# Cryptography

Libauth includes a variety of fast, efficient, WebAssembly-based cryptographic primitives:

- [`ripemd160`](https://libauth.org/types/Ripemd160.html)
- [`secp256k1`](https://libauth.org/types/Secp256k1.html)
- [`sha1`](https://libauth.org/types/Sha1.html)
- [`sha256`](https://libauth.org/types/Sha256.html)
- [`sha512`](https://libauth.org/types/Sha512.html)

Several higher-level utilities are also composed from these primitives:

- [`hash160`](https://libauth.org/functions/hash160.html) (`sha256` -> `ripemd160`)
- [`hash256`](https://libauth.org/functions/hash256.html) (`sha256` -> `sha256`)
- [`hmacSha256`](https://libauth.org/functions/hmacSha256.html)
- [`hmacSha512`](https://libauth.org/functions/hmacSha512.html)
- [`instantiateHmacFunction`](https://libauth.org/functions/instantiateHmacFunction.html)
- [`instantiatePbkdf2Function`](https://libauth.org/functions/instantiatePbkdf2Function.html)
- [`pbkdf2HmacSha256`](https://libauth.org/functions/pbkdf2HmacSha256.html)
- [`pbkdf2HmacSha512`](https://libauth.org/functions/pbkdf2HmacSha512.html)

## Hashing Primitives

The [`ripemd160`](https://libauth.org/types/Ripemd160.html), [`sha1`](https://libauth.org/types/Sha1.html), [`sha256`](https://libauth.org/types/Sha256.html), and [`sha512`](https://libauth.org/types/Sha512.html) utilities each share an identical interface. For each, Libauth exports an internal instance of the relevant WebAssembly implementation which can be used immediately after import, e.g. to sha256 hash a utf8-encoded message:

```ts
import { binToHex, sha256, utf8ToBin } from '@bitauth/libauth';

const message = utf8ToBin('Hello world!');
const hash = sha256.hash(message);
const hex = binToHex(hash);
console.log(hex);
// => 'c0535e4be2b79ffd93291305436bf889314e4a3faec05ecffcbb7df31ad9e51a'
```

To ripemd160 hash a message from a hex-encoded string:

```ts
import { binToHex, hexToBin, ripemd160 } from '@bitauth/libauth';

const message = hexToBin('01020304');
const hash = ripemd160.hash(message);
const hex = binToHex(hash);
console.log(hex);
// => '179bb366e5e224b8bf4ce302cefc5744961839c5'
```

Note that each hashing primitive also supports an incremental/stream hashing API:

```ts
import { binToHex, ripemd160 } from '@bitauth/libauth';
const step1 = ripemd160.update(ripemd160.init(), Uint8Array.of(0x01));
const step2 = ripemd160.update(step1, Uint8Array.of(0x02));
const step3 = ripemd160.update(step2, Uint8Array.of(0x03));
const step4 = ripemd160.update(step3, Uint8Array.of(0x04));
const hash = ripemd160.final(step4);
const hex = binToHex(hash);
console.log(hex);
// => '179bb366e5e224b8bf4ce302cefc5744961839c5'
```

## Secp256k1

Like the [hashing primitives](#hashing-primitives), Libauth exports an internal instance of the [`Secp256k1`](https://libauth.org/types/Secp256k1.html) WebAssembly implementation which can be used immediately after import, e.g.:

```ts
import { secp256k1 } from '@bitauth/libauth';
import { msgHash, pubkey, sig } from 'somewhere';

secp256k1.verifySignatureDERLowS(sig, pubkey, msgHash)
  ? console.log('🚀 Signature valid')
  : console.log('❌ Signature invalid');
```

> [!TIP]
> Libauth offers a wide variety of higher-level utilities which make use of `secp256k1`; few applications need to use `secp256k1` directly. See, for example, [Verifying Transactions](./verify-transactions.md) or [Wallets & Transaction Creation](./wallets.md).

The `secp256k1` object includes the following methods:

- `addTweakPrivateKey`
- `addTweakPublicKeyCompressed`
- `addTweakPublicKeyUncompressed`
- `compressPublicKey`
- `derivePublicKeyCompressed`
- `derivePublicKeyUncompressed`
- `malleateSignatureCompact`
- `malleateSignatureDER`
- `mulTweakPrivateKey`
- `mulTweakPublicKeyCompressed`
- `mulTweakPublicKeyUncompressed`
- `normalizeSignatureCompact`
- `normalizeSignatureDER`
- `recoverPublicKeyCompressed`
- `recoverPublicKeyUncompressed`
- `signMessageHashCompact`
- `signMessageHashDER`
- `signMessageHashRecoverableCompact`
- `signMessageHashSchnorr`
- `signatureCompactToDER`
- `signatureDERToCompact`
- `uncompressPublicKey`
- `validatePrivateKey`
- `validatePublicKey`
- `verifySignatureCompact`
- `verifySignatureCompactLowS`
- `verifySignatureDER`
- `verifySignatureDERLowS`
- `verifySignatureSchnorr`

For details on each method, see [`Secp256k1`](https://libauth.org/types/Secp256k1.html) in the API reference.

Note that Libauth also includes a [`validateSecp256k1PrivateKey`](https://libauth.org/functions/validateSecp256k1PrivateKey.html) function which does not require the `Secp256k1` WebAssembly implementation.
