# Libauth Errors

In Libauth, expected errors use the type `string` rather than `Error` (or other objects that inherit from `Error`) to simplify the resulting function types and typechecking requirements.

This convention ensures consistency of returned errors in all environments, avoids exposing internal details like stack traces and line numbers, and allows error messages to be recorded or displayed as text without an explicit or implicit `toString()` method call (e.g. for cleaner compatibility with [`restrict-template-expressions`](https://typescript-eslint.io/rules/restrict-template-expressions/)).

The text contents of Libauth errors messages may change between non-major version upgrades. To consistently detect a particular error message, check that the error message `includes()` the enum member that represents the error type, e.g.:

```ts
import { CashAddressDecodingError, decodeCashAddress } from '@bitauth/libauth';

const decoded = decodeCashAddress('prefix:broken');
if (typeof decoded === 'string') {
  if (decoded.includes(CashAddressDecodingError.invalidCharacters)) {
    return 'Matched error';
  }
  return 'Some other error';
}
```
