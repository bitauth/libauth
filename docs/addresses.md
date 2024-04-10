# Addresses

Libauth includes a variety of utilities for creating and working with addresses, including support for CashAddress and CashAddress-like formats, Bech32, and legacy Base58 Addresses.

> [!TIP]
> This guide introduces the most commonly used Address-related utilities. See [API Overview: Address Formats](../README.md#address-formats) for more, or the [API Reference](https://libauth.org/#md:api-overview) for a complete listing.

## CashAddress

[CashAddress](https://github.com/bitcoincashorg/bitcoincash.org/blob/master/spec/cashaddr.md) is the standard address format for Bitcoin Cash (BCH). CashAddress guarantees the detection of up to 5 random errors in any address or 6 errors within any span of 33 characters.

### Encoding CashAddresses

To encode CashAddresses, use [`encodeCashAddress`](https://libauth.org/functions/encodeCashAddress.html):

```ts
import { encodeCashAddress, hexToBin } from '@bitauth/libauth';

const publicKeyHash = hexToBin('15d16c84669ab46059313bf0747e781f1d13936d');
const { address } = encodeCashAddress({
  payload: publicKeyHash,
  type: 'p2pkh',
  /* throwErrors: false // (for type-safe handling of untrusted payloads) */
});
console.log(address);
// => bitcoincash:qq2azmyyv6dtgczexyalqar70q036yund54qgw0wg6

const testnet = encodeCashAddress({
  payload: publicKeyHash,
  prefix: 'bchtest',
  type: 'p2pkh',
}).address;
console.log(testnet);
// => bchtest:qq2azmyyv6dtgczexyalqar70q036yund53jvfde0x

const acceptsTokens = encodeCashAddress({
  payload: publicKeyHash,
  prefix: 'bitcoincash',
  type: 'p2pkhWithTokens',
}).address;
console.log(acceptsTokens);
// => bitcoincash:zq2azmyyv6dtgczexyalqar70q036yund5j2mspghf
```

### Decoding CashAddresses

To decode CashAddresses, use [`decodeCashAddress`](https://libauth.org/functions/decodeCashAddress.html):

```ts
import { assertSuccess, decodeCashAddress, stringify } from '@bitauth/libauth';

const address = 'bitcoincash:zq2azmyyv6dtgczexyalqar70q036yund5j2mspghf';
/**
 * If encoding is always expected to succeed, i.e. no user input is involved,
 * we can `assertSuccess` to remove the error `string` possibility from the
 * return type and use the address immediately (if an encoding error occurs at
 * runtime, `assertSuccess` will simply throw it in a new `Error` object).
 */
const tokenAddress = assertSuccess(decodeCashAddress(address));
console.log(stringify(tokenAddress));
/**
 * => {
 *  "payload": "<Uint8Array: 0x15d16c84669ab46059313bf0747e781f1d13936d>",
 *  "prefix": "bitcoincash",
 *  "type": "p2pkhWithTokens"
 * }
 */

// Handling a possibly-invalid CashAddress:
const decoded = decodeCashAddress('bitcoincash:not_a_valid_address');
// Handle any decoding errors:
if (typeof decoded === 'string') {
  handleError(decoded); // => 'CashAddress decoding error: the payload contains unexpected characters. Invalid characters: o, _, i.'
  return;
}
const { payload, prefix, type } = decoded;
```

### CashAddress to Locking Bytecode

To decode a CashAddress directly into equivalent transaction output locking bytecode information, use
[`cashAddressToLockingBytecode`](https://libauth.org/functions/cashAddressToLockingBytecode.html):

```ts
import {
  assertSuccess,
  binToHex,
  cashAddressToLockingBytecode,
} from '@bitauth/libauth';

const address = 'bitcoincash:zq2azmyyv6dtgczexyalqar70q036yund5j2mspghf';
// With `assertSuccess`, any errors are simply thrown
const { bytecode, prefix, tokenSupport } = assertSuccess(
  cashAddressToLockingBytecode(address),
);
console.log(`
Network: ${prefix}
Supports tokens: ${tokenSupport}
Locking bytecode: ${binToHex(bytecode)}
`);
/**
 * =>
 * Network: bitcoincash
 * Supports tokens: true
 * Locking bytecode: 76a91415d16c84669ab46059313bf0747e781f1d13936d88ac
 */
```

### Locking Bytecode to CashAddress

To encode locking bytecode (e.g. from a transaction output) directly into an equivalent CashAddress, use [`lockingBytecodeToCashAddress`](https://libauth.org/functions/lockingBytecodeToCashAddress.html):

```ts
import {
  assertSuccess,
  hexToBin,
  lockingBytecodeToCashAddress,
} from '@bitauth/libauth';

const p2pkhBytecode = hexToBin(
  '76a914fc916f213a3d7f1369313d5fa30f6168f9446a2d88ac',
);
const p2pkh = lockingBytecodeToCashAddress({
  bytecode: p2pkhBytecode,
  prefix: 'bitcoincash',
});
// With `assertSuccess`, any errors are simply thrown
console.log(assertSuccess(p2pkh).address);
// => "bitcoincash:qr7fzmep8g7h7ymfxy74lgc0v950j3r2959lhtxxsl"

const p2pk = hexToBin(
  '4104678afdb0fe5548271967f1a67130b7105cd6a828e03909a67962e0ea1f61deb649f6bc3f4cef38c4f35504e51ec112de5c384df7ba0b8d578a4c702b6bf11d5fac',
);
const genesisCoinbase = lockingBytecodeToCashAddress({
  bytecode: p2pk,
  prefix: 'bitcoincash',
});
console.log(genesisCoinbase);
// => "CashAddress encoding error: no CashAddress type bit has been standardized for P2PK locking bytecode."

const p2sh32 = hexToBin(
  'aa20000000000000000000000000000012345678900000000000000000000000000087',
);
const p2sh32WithTokens = lockingBytecodeToCashAddress({
  bytecode: p2sh32,
  prefix: 'bchtest',
  tokenSupport: true,
});
console.log(assertSuccess(p2sh32WithTokens).address);
// => "bchtest:rvqqqqqqqqqqqqqqqqqqqqqqzg69v7ysqqqqqqqqqqqqqqqqqqqqqszvpgjlk"

const nonStandard = hexToBin('52935387');
const nonStandardAddress = lockingBytecodeToCashAddress({
  bytecode: nonStandard,
  prefix: 'bitcoincash',
});
console.log(nonStandardAddress);
// => "CashAddress encoding error: unknown locking bytecode type."
```

### Key to P2PKH CashAddress

For applications needing to produce P2PKH CashAddress from public or private key material, note that the P2PKH Cash Address utilities are concise options:

- [`hdPrivateKeyToP2pkhCashAddress`](https://libauth.org/functions/hdPrivateKeyToP2pkhCashAddress.html)
- [`hdPublicKeyToP2pkhCashAddress`](https://libauth.org/functions/hdPublicKeyToP2pkhCashAddress.html)
- [`privateKeyToP2pkhCashAddress`](https://libauth.org/functions/privateKeyToP2pkhCashAddress.html)
- [`publicKeyToP2pkhCashAddress`](https://libauth.org/functions/publicKeyToP2pkhCashAddress.html)

See [P2PKH Wallets](./wallets.md) for usage examples.

## CashAddress-like Formats

The CashAddress format is independently useful for encoding and transmitting short strings of application-specific information like identifiers, public keys, and private key material. In many cases, payloads can even be safely [error corrected](#error-correction) to improve user experiences.

```ts
import {
  assertSuccess,
  binToHex,
  decodeCashAddressFormat,
  encodeCashAddressFormat,
  hexToBin,
} from '@bitauth/libauth';

const txId = '978306aa4e02fd06e251b38d2e961f78f4af2ea6524a3e4531126776276a6af1';

// With `assertSuccess`, any errors are simply thrown
const { address } = assertSuccess(
  encodeCashAddressFormat({
    payload: hexToBin(txId),
    prefix: 'bitauth',
    version: 3,
  }),
);

console.log(`Encoded authbase: ${address}`);
// => "Encoded authbase: bitauth:qwtcxp42fcp06phz2xec6t5krau0ftew5efy50j9xyfxwa38df40zp58z6t5w"

const { payload } = assertSuccess(decodeCashAddressFormat(address));
console.log(`Encoded TXID: ${binToHex(payload)}`);
// => "Encoded TXID: 978306aa4e02fd06e251b38d2e961f78f4af2ea6524a3e4531126776276a6af1"
```

### Error Correction

CashAddress Formats also support correction of up to 2 errors; this is particularly useful in offering automatic recovery strategies and improved user experiences after transcription failures.

> [!CAUTION]
> Using error correction of CashAddress-like formats degrades error detection, i.e. if the payload contains more than 2 errors, it is possible that error correction will "correct" the payload to a plausible but incorrect payload.
>
> For applications which proceed to take irreversible actions – like sending a payment – **naive usage of CashAddress Format error correction can lead to vulnerabilities and lost funds**.

```ts
import { attemptCashAddressFormatErrorCorrection } from '@bitauth/libauth';
import { askUserToTryAgain } from './my/app';

/**
 * CAUTION: CashAddress error correction is not fail-safe; instead of suggesting
 * corrections, prompt the user to review the source and manually re-enter
 * the characters at the error locations:
 */

const maybeAddress = 'bch-est:qq2azmyyv6dtgczexyalqar70q036yund53jvfde0z';
/* result.address is 'bchtest:qq2azmyyv6dtgczexyalqar70q036yund53jvfde0x' */

const result = attemptCashAddressFormatErrorCorrection(maybeAddress);
if (typeof result === 'string') {
  askUserToTryAgain(result);
  return undefined;
}

if (result.corrections.length === 0) {
  return maybeAddress;
}

const pointToCorrections = (c: number[]) =>
  Array.from({ length: c[c.length - 1]! + 1 }, (_, i) =>
    c.includes(i) ? '^' : '-',
  ).join('');
const message =
  typeof result === 'string'
    ? result
    : `You entered:  ${maybeAddress}
Errors:       ${pointToCorrections(result.corrections)}

Please review the address for errors and try again.`;
askUserToTryAgain(message);
return undefined;
/* =>
You entered:  bch-est:qq2azmyyv6dtgczexyalqar70q036yund53jvfde0z
Errors:       ---^---------------------------------------------^

Please review the address for errors and try again. */
```

Other error correction applications (like `libauth-secret-key:...`) have safe failure modes, so error correction can be automatically applied:

```ts
import {
  assertSuccess,
  binsAreEqual,
  decodeCashAddressFormat,
  encodeCashAddressFormat,
  splitEvery,
} from '@bitauth/libauth';
import { askUserToTryAgain, promptUserToBackup } from './my/app';

const payload = Uint8Array.from(range(16));
const prefix = 'secretkey';
const raw = encodeCashAddressFormat({ payload, prefix, version: 0 }).address;
const hyphenated = `secret-key:${splitEvery(raw.slice(10), 4).join('-')}`;
promptUserToBackup(hyphenated);
// => 'secret-key:qqqq-zqsr-qszs-vpcg-py9q-krqd-pc8s-5c6s-605f'

/* Later, to restore from the backup: */
const userEnters = 'secret-key:qqqq-zasr-qszs-vpcg-py9q-krqd-pc8s-sc6s-605f';
/* `q` mistakenly transcribed as `a` ^,    `5` transcribed as `s` ^  */

const compressed = userEnters.replace(/-/gu, '');
const result = attemptCashAddressFormatErrorCorrection(compressed);
if (typeof result === 'string') {
  askUserToTryAgain(result);
  return;
}

const corrected = assertSuccess(decodeCashAddressFormat(result.address));
console.log(binsAreEqual(payload, corrected.payload));
// => true
```

## Bech32

Bech32 is a checksummed, base32 format standardized by [BIP173](https://github.com/bitcoin/bips/blob/master/bip-0173.mediawiki); it is used in the [CashAddress](#cashaddress) and [SegWit address](https://github.com/bitcoin/bips/blob/master/bip-0173.mediawiki#segwit-address-format) formats.

Libauth's Bech32 utilities can be used to develop higher-level utilities for other address formats. Review the API reference for usage details:

- [`encodeBech32`](https://libauth.org/functions/encodeBech32.html)/[`decodeBech32`](https://libauth.org/functions/decodeBech32.html)
- [`bech32PaddedToBin`](https://libauth.org/functions/bech32PaddedToBin.html)/[`binToBech32Padded`](https://libauth.org/functions/binToBech32Padded.html)
- [`regroupBits`](https://libauth.org/functions/regroupBits.html)

## Base58

Base58 is a 58-character, alphanumeric encoding scheme used to represent legacy bitcoin addresses and [Wallet Import Format (WIF)](./keys.md#wallet-import-format-wif) private keys. Base58 excludes the zero digit (`0`), uppercase `I`, uppercase `O`, and lowercase `l` to reduce visual misidentification of characters.

To convert between binary (`Uint8Array`) values and Base58, see [`base58ToBin`](https://libauth.org/functions/base58ToBin.html)/[`binToBase58`](https://libauth.org/functions/binToBase58.html). To develop similar specialized encodings, see [`createBaseConverter`](https://libauth.org/functions/createBaseConverter.html).

### Base58 Address Format

The Base58 Address format (A.K.A. "Base58Check") is used by Base58 addresses and [Wallet Import Format (WIF)](./keys.md#wallet-import-format-wif) encoded private keys. To develop utilities for interacting with similar formats, see [`encodeBase58AddressFormat`](https://libauth.org/functions/encodeBase58AddressFormat.html) and [`decodeBase58AddressFormat`](https://libauth.org/functions/decodeBase58AddressFormat.html).

### Base58 Address

> [!CAUTION]
> To avoid loss of funds, Base58 Address support should only be used to offer compatibility with legacy software. New applications should avoid distributing Base58 addresses without special care in educating users about their risks.

Base58 Address is the legacy address format on all bitcoin-like networks. As consensus rules have diverged, addresses which are spendable on one network may not be safely spendable on other networks, even if the user has access to relevant private key material.

Review the API reference for usage details:

- [`encodeBase58Address`](https://libauth.org/functions/encodeBase58Address.html)/[`decodeBase58Address`](https://libauth.org/functions/decodeBase58Address.html)
- [`lockingBytecodeToBase58Address`](https://libauth.org/functions/lockingBytecodeToBase58Address.html)/[`base58AddressToLockingBytecode`](https://libauth.org/functions/base58AddressToLockingBytecode.html)
