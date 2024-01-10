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
 */
export const formatError = (errorType: string, errorDetails?: string) =>
  `${errorType}${errorDetails === undefined ? '' : ` ${errorDetails}`}`;

export const unknownValue = (
  value: never,
  message = `Received an unknown value: ${String(
    value,
  )}. This should have been caught by TypeScript - are your types correct?`,
) => {
  // eslint-disable-next-line functional/no-throw-statements
  throw new Error(message);
};
