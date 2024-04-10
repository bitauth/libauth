# Libauth Errors

In Libauth, errors that are likely to be encountered at runtime in production applications are typically returned as `string`s rather than thrown as `Error` objects. (Other functions accept a [`throwErrors` parameter](#configuring-throwerrors) to enable this behavior.)

This convention makes runtime errors type-safe, ensures consistency of returned errors in all environments, avoids exposing internal details like stack traces and line numbers, and allows error messages to be recorded or displayed as text without an explicit or implicit `toString()` method call (e.g. cleaner compatibility with [`restrict-template-expressions`](https://typescript-eslint.io/rules/restrict-template-expressions/)).

## Detecting Errors

To check for errors in most results, simply check if the result is a string:

```ts
import { cashAddressToLockingBytecode } from '@bitauth/libauth';
import { askUserToTryAgain, getUtxosByLockingBytecode } from './my/app';

const address = 'bitcoincash:not_a_valid_address';
const result = cashAddressToLockingBytecode(address);

// `decoded` is either a `string` or the result type:
if (typeof result === 'string') {
  return askUserToTryAgain(result);
}
// `result.bytecode` can now be safely accessed:
getUtxosByLockingBytecode(result.bytecode);
```

## Using `assertSuccess`

For simple scripts, or for instances when the developer expects an error should never occur, Libauth also provides an `assertSuccess` function which simply throws any runtime errors, allowing the expected result to be used immediately:

```ts
import { assertSuccess, cashAddressToLockingBytecode } from '@bitauth/libauth';
import {
  askUserToSelectFromAddressBook,
  getUtxosByLockingBytecode,
} from './my/app';

const address = await askUserToSelectFromAddressBook();
// assertSuccess: all address book entries are valid addresses
const result = assertSuccess(cashAddressToLockingBytecode(address));

// `result.bytecode` can now be safely accessed:
getUtxosByLockingBytecode(result.bytecode);
```

## Detecting Specific Errors

**Please note that the text contents of Libauth error messages may change between non-major version upgrades.**

To consistently detect a particular error message, check that the error message `includes()` the enum member that represents the specific error type, e.g.:

```ts
import {
  CashAddressDecodingError,
  cashAddressToLockingBytecode,
} from '@bitauth/libauth';

const decoded = cashAddressToLockingBytecode('bitcoincash:not_a_valid_address');
if (typeof decoded === 'string') {
  if (decoded.includes(CashAddressDecodingError.invalidCharacters)) {
    // handle matched error
    return;
  }
  // handle other errors
  return;
}
const { payload, prefix, type } = decoded;
```

## Configuring `throwErrors`

To simplify error handling, some Libauth functions default to throwing errors that are not expected to occur in recoverable situations.

For example, [`encodeCashAddress`](https://libauth.org/functions/encodeCashAddress.html) can only produce an error if the `Uint8Array` provided in the `payload` parameter is not a valid length. Since most applications are likely to produce or otherwise validate the payload prior to encoding, an invalid length would generally indicate an earlier, likely-unrecoverable, software implementation error.

To avoid unnecessary error handling boilerplate in these applications, `encodeCashAddress` defaults to throwing this kind of implementation error, making it's only possible return type a successful result: `{ address: string }`. To instead handle this error in a fully type-safe way, set the optional `throwErrors` parameter to `false` (making the return type `string | { address: string }`), then handle the possible `string` type before attempting to access the resulting `address`:

```ts
import { hexToBin, encodeCashAddress } from '@bitauth/libauth';
import { handleError } from './my/app';

const publicKeyHash = hexToBin('15d16c84669ab46059313bf0747e781f1d13936d');
const result = encodeCashAddress({
  payload: publicKeyHash,
  throwErrors: false, // when set, the result may be of type `string`
  type: 'p2pkh',
});
if (typeof result === 'string') {
  handleError(result);
  return;
}
console.log(result.address);
// => bitcoincash:qq2azmyyv6dtgczexyalqar70q036yund54qgw0wg6
```

Compare this behavior to [`lockingBytecodeToCashAddress`](https://libauth.org/functions/lockingBytecodeToCashAddress.html), which might be commonly used for either internally-produced locking bytecode or to visualized untrusted, externally-produced locking bytecode in user interfaces like block explorers, where some locking bytecode patterns are not representable as standardized addresses. In this case, the return type is always `string | { address: string }` to ensure that applications appropriately handle errors:

```ts
const genesisCoinbase = hexToBin(
  '4104678afdb0fe5548271967f1a67130b7105cd6a828e03909a67962e0ea1f61deb649f6bc3f4cef38c4f35504e51ec112de5c384df7ba0b8d578a4c702b6bf11d5fac',
);
const result = lockingBytecodeToCashAddress({
  bytecode: genesisCoinbase,
  prefix: 'bitcoincash',
});
if (typeof result === 'string') {
  handleError(result);
  // => "CashAddress encoding error: no CashAddress type bit has been standardized for P2PK locking bytecode."
  return;
}
console.log(result.address);
```
