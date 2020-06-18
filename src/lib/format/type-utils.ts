type ImmutablePrimitive =
  | undefined
  | null
  | boolean
  | string
  | number
  // eslint-disable-next-line @typescript-eslint/ban-types
  | Function;
type ImmutableArray<T> = readonly Immutable<T>[];
type ImmutableMap<K, V> = ReadonlyMap<Immutable<K>, Immutable<V>>;
type ImmutableSet<T> = ReadonlySet<Immutable<T>>;
type ImmutableObject<T> = {
  readonly [K in keyof T]: Immutable<T[K]>;
};
type ImmutableUint8Array = Readonly<ArrayLike<number>> &
  Iterable<number> &
  ImmutableObject<Uint8Array>;

/**
 * A deep-readonly utility type. Can be removed when a built-in alternative is
 * added to TypeScript. Derived from:
 * https://github.com/microsoft/TypeScript/issues/13923#issuecomment-557509399
 */
export type Immutable<T> = T extends ImmutablePrimitive
  ? T
  : T extends (infer U)[]
  ? ImmutableArray<U>
  : T extends Map<infer K, infer V>
  ? ImmutableMap<K, V>
  : T extends Set<infer M>
  ? ImmutableSet<M>
  : T extends Uint8Array
  ? ImmutableUint8Array
  : ImmutableObject<T>;

/*
 * const canBeAssigned: Immutable<Uint8Array> = Uint8Array.of(0, 0);
 * const canBeSpread = [...canBeAssigned];
 * const spreadResultWorks = Uint8Array.from(canBeSpread);
 * const functionRequiringIt = (bin: Immutable<Uint8Array>) => bin;
 * const canAcceptNonMutable = functionRequiringIt(Uint8Array.of());
 */
