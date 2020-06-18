import { binToHex } from './hex';

const defaultStringifySpacing = 2;

/**
 * A safe method to `JSON.stringify` a value, useful for debugging and logging
 * purposes.
 *
 * @remarks
 * Without modifications, `JSON.stringify` has several shortcomings in
 * debugging and logging usage:
 * - throws when serializing anything containing a `bigint`
 * - `Uint8Array`s are often serialized in base 10 with newlines between each
 *   index item
 * - `functions` and `symbols` are not clearly marked
 *
 * This method is more helpful in these cases:
 * - `bigint`: `0n` → `<bigint: 0n>`
 * - `Uint8Array`: `Uint8Array.of(0,0)` → `<Uint8Array: 0x0000>`
 * - `function`: `(x) => x * 2` → `<function: (x) => x * 2>`
 * - `symbol`: `Symbol(A)` → `<symbol: Symbol(A)>`
 *
 * @param value - the data to serialize
 * @param spacing - the number of spaces to use in
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const stringify = (value: any, spacing = defaultStringifySpacing) =>
  JSON.stringify(
    value,
    // eslint-disable-next-line complexity
    (_, item: unknown) => {
      const type = typeof item;
      const name =
        typeof item === 'object' && item !== null
          ? item.constructor.name
          : type;
      switch (name) {
        case 'Uint8Array':
          return `<Uint8Array: 0x${binToHex(item as Uint8Array)}>`;
        case 'bigint':
          return `<bigint: ${(item as bigint).toString()}n>`;
        case 'function':
        case 'symbol':
          // eslint-disable-next-line @typescript-eslint/ban-types
          return `<${name}: ${(item as symbol | Function).toString()}>`;
        default:
          return item;
      }
    },
    spacing
  );

/**
 * Given a value, recursively sort the keys of all objects it references
 * (without sorting arrays).
 *
 * @param objectOrArray - the object or array in which to sort object keys
 */
export const sortObjectKeys = (
  objectOrArray: unknown
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any => {
  if (Array.isArray(objectOrArray)) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return objectOrArray.map(sortObjectKeys);
  }
  if (
    typeof objectOrArray !== 'object' ||
    objectOrArray === null ||
    objectOrArray.constructor.name !== 'Object'
  ) {
    return objectOrArray;
  }
  // eslint-disable-next-line functional/immutable-data
  const keys = Object.keys(objectOrArray).sort((a, b) => a.localeCompare(b));
  return keys.reduce(
    (all, key) => ({
      ...all,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      [key]: sortObjectKeys((objectOrArray as { [key: string]: unknown })[key]),
    }),
    {}
  );
};

const uint8ArrayRegex = /"<Uint8Array: 0x(?<hex>[0-9a-f]*)>"/gu;
const bigIntRegex = /"<bigint: (?<bigint>[0-9]*)n>"/gu;

/**
 * An alternative to `stringify` which produces valid JavaScript for use as a
 * test vector in this library. `Uint8Array`s are constructed using `hexToBin`
 * and `bigint` values use the `BigInt` constructor. If `alphabetize` is `true`,
 * all objects will be sorted in the output.
 *
 * Note, this assumes all strings which match the expected regular expressions
 * are values of type `Uint8Array` and `bigint` respectively. String values
 * which otherwise happen to match these regular expressions will be converted
 * incorrectly.
 *
 * @param stringified - the result of `stringify`
 */
export const stringifyTestVector = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any,
  alphabetize = true
) => {
  const stringified = alphabetize
    ? stringify(sortObjectKeys(value))
    : stringify(value);
  return stringified
    .replace(uint8ArrayRegex, "hexToBin('$1')")
    .replace(bigIntRegex, "BigInt('$1')");
};
