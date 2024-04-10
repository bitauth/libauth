/**
 * A simple method used throughout Libauth to format error messages. By
 * formatting errors this way, downstream consumers can detect specific error
 * types by matching the `errorType`. For example, the error:
 *
 * ```ts
 * formatError(SomeTypeOfError.exceedsMaximum, `Provided value: ${value}`);
 * ```
 *
 * Can be detected with `String.includes()`, even if the
 * `SomeTypeOfError.exceedsMaximum` error message changes:
 * ```ts
 * error.includes(SomeTypeOfError.exceedsMaximum);
 * // => true
 * ```
 *
 * Using this method ensures consistency across the library.
 *
 * @remarks
 * In Libauth, expected errors use the type `string` rather than `Error` (or
 * other objects that inherit from `Error`) to simplify the resulting types and
 * typechecking requirements. This ensures consistency of returned errors in all
 * environments, avoids exposing internal details like stack traces and line
 * numbers, and allows error messages to be recorded or used as text without an
 * intermediate `toString()` method.
 *
 * @param errorType - the error enum member representing this error type
 * @param errorDetails - optional, additional details to include in the error
 * message
 * @param throwError - if `true`, the function will throw an `Error` rather than
 * returning the string (defaults to `false`).
 */
export const formatError = <Throws extends boolean>(
  errorType: string,
  errorDetails?: string,
  throwError = false as Throws,
): Throws extends true ? never : string => {
  const message = `${errorType}${
    errorDetails === undefined ? '' : ` ${errorDetails}`
  }`;
  if (throwError) {
    // eslint-disable-next-line functional/no-throw-statements
    throw new Error(message);
  }
  return message as Throws extends true ? never : string;
};

/**
 *
 * @param value - the unexpected value
 * @param message - an optional error message
 */
export const unknownValue = (
  value: never,
  message = `Received an unknown value; this should have been caught by TypeScript - are your types correct?`,
) => formatError(message, String(value), true);

/**
 * A utility to handle error results by throwing an `Error` object.
 *
 * If the provided value is of type `string`, the contents of the string are
 * thrown as a new `Error`, otherwise, the value is returned unmodified.
 *
 * This method is useful for eliminating `string` as a possible type from a
 * resulting value, particularly in places where an error is never expected to
 * occur in practice (i.e. no user or runtime input is involved), e.g.:
 *
 * ```ts
 * import { assertSuccess, decodeCashAddress, binToHex } from '@bitauth/libauth';
 * const address = 'bitcoincash:zq2azmyyv6dtgczexyalqar70q036yund5j2mspghf';
 *
 * // Might be either a string or a decoded address:
 * const decoded = decodeCashAddress(address);
 * // Now guaranteed to be a decoded address (error messages are thrown):
 * const tokenAddress = assertSuccess(decoded);
 * // The result can be used immediately:
 * console.log(binToHex(tokenAddress.payload));
 * ```
 *
 * @param result - A result which might be a string.
 * @param expectation - An optional, descriptive prefix for the error message
 * thrown in failure cases. By default,
 * `Expected a successful result, but encountered an error: `.
 */
export const assertSuccess = <T>(
  result: T | string,
  expectation = 'Expected a successful result, but encountered an error: ',
) => {
  // eslint-disable-next-line functional/no-throw-statements
  if (typeof result === 'string') throw new Error(`${expectation}${result}`);
  return result;
};
