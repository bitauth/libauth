/**
 * An implementation of the built-in `Partial` utility that allows explicit
 * `undefined` values when
 * [exactOptionalPropertyTypes](https://www.typescriptlang.org/tsconfig#exactOptionalPropertyTypes)
 * is enabled.
 */
export type PartialExactOptional<T> = {
  [P in keyof T]?: T[P] | undefined;
};

export type ImmutablePrimitive =
  // eslint-disable-next-line @typescript-eslint/ban-types
  Function | boolean | number | string | null | undefined;
export type ImmutableArray<T> = readonly Immutable<T>[];
export type ImmutableMap<K, V> = ReadonlyMap<Immutable<K>, Immutable<V>>;
export type ImmutableSet<T> = ReadonlySet<Immutable<T>>;
export type ImmutableObject<T> = {
  readonly [K in keyof T]: Immutable<T[K]>;
};
// Derived from: https://www.growingwiththeweb.com/2020/10/typescript-readonly-typed-arrays.html
export interface ImmutableUint8Array
  extends Omit<Uint8Array, 'copyWithin' | 'fill' | 'reverse' | 'set' | 'sort'> {
  readonly [n: number]: number;
}

/**
 * A deep-readonly utility type. Supports objects, `Array`s, `Uint8Array`s,
 * `Map`s, and `Set`s.
 *
 * Note: `Uint8Array` is the only supported `TypedArray`.
 */
// Derived from: https://github.com/microsoft/TypeScript/issues/13923#issuecomment-557509399
export type Immutable<T> = T extends ImmutablePrimitive
  ? T
  : T extends (infer U)[]
  ? ImmutableArray<U>
  : T extends Uint8Array
  ? ImmutableUint8Array
  : T extends Map<infer K, infer V>
  ? ImmutableMap<K, V>
  : T extends Set<infer M>
  ? ImmutableSet<M>
  : ImmutableObject<T>;

type FunctionComparisonEqualsWrapped<T> = T extends ( // eslint-disable-next-line @typescript-eslint/ban-types, @typescript-eslint/no-unused-vars
  T extends {} ? infer R & {} : infer R
)
  ? {
      [P in keyof R]: R[P];
    }
  : never;
type FunctionComparisonEquals<A, B> = (<
  T
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
>() => T extends FunctionComparisonEqualsWrapped<A> ? 1 : 2) extends <
  T
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
>() => T extends FunctionComparisonEqualsWrapped<B> ? 1 : 2
  ? true
  : false;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type IsAny<T> = FunctionComparisonEquals<T, any>;
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions, functional/no-mixed-type
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

export const unknownValue = (value: never) => {
  // eslint-disable-next-line functional/no-throw-statement
  throw new Error(
    `Received an unknown value: ${String(
      value
    )}. This should have been caught by TypeScript – are your types correct?`
  );
};
