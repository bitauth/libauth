/**
 * An implementation of the built-in `Partial` utility that allows explicit
 * `undefined` values when
 * [exactOptionalPropertyTypes](https://www.typescriptlang.org/tsconfig#exactOptionalPropertyTypes)
 * is enabled.
 */
export type PartialExactOptional<T> = {
  [P in keyof T]?: T[P] | undefined;
};

type FunctionComparisonEqualsWrapped<T> = T extends ( // eslint-disable-next-line @typescript-eslint/ban-types
  T extends Readonly<{}> ? infer R & Readonly<{}> : infer R
)
  ? {
      [P in keyof R]: R[P];
    }
  : never;
type FunctionComparisonEquals<A, B> = (<
  T,
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
>() => T extends FunctionComparisonEqualsWrapped<A> ? 1 : 2) extends <
  T,
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
>() => T extends FunctionComparisonEqualsWrapped<B> ? 1 : 2
  ? true
  : false;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type IsAny<T> = FunctionComparisonEquals<T, any>;
// eslint-disable-next-line functional/no-mixed-types
type InvariantComparisonEqualsWrapped<T> = {
  value: T;
  setValue: (value: T) => never;
};
type InvariantComparisonEquals<Expected, Actual> =
  InvariantComparisonEqualsWrapped<Expected> extends InvariantComparisonEqualsWrapped<Actual>
    ? IsAny<Actual | Expected> extends true
      ? IsAny<Actual> | IsAny<Expected> extends true
        ? true
        : false
      : true
    : false;

// Derived from https://github.com/DetachHead/ts-helpers
type Equals<Expected, Actual> = InvariantComparisonEquals<
  Expected,
  Actual
> extends true
  ? FunctionComparisonEquals<Expected, Actual>
  : false;

export type AssertTypesEqual<T1, T2> = Equals<T1, T2> extends true
  ? true
  : never;
