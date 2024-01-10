import { formatError } from './error.js';
import { readCompactUintMinimal } from './number.js';

/**
 * A reference to a particular position within a referenced `Uint8Array`.
 * `ReadPosition`s are the only input of Libauth's read functions, and each read
 * function returns a new `ReadPosition` after a successful result.
 */
export type ReadPosition = {
  /**
   * The `Uint8Array` from which bytes are being read.
   */
  bin: Uint8Array;
  /**
   * The index at which the next byte should be read.
   */
  index: number;
};

/**
 * The successful result of a read function, includes the result and the next
 * {@link ReadPosition}.
 */
export type ReadResult<Type> = {
  /**
   * The new read position after the successfully-read bytes.
   */
  position: ReadPosition;
  /**
   * The successfully-read value.
   */
  result: Type;
};

/**
 * The return type of a read function that may fail. May be a {@link ReadResult}
 * or an error message (string).
 */
export type MaybeReadResult<Type> = ReadResult<Type> | string;

/**
 * A function that reads some data beginning at a {@link ReadPosition}.
 */
export type ReadFunction<Type> = (
  position: ReadPosition,
) => MaybeReadResult<Type>;

type ExtractReadFunctionResults<T extends ReadFunction<unknown>[]> = {
  [K in keyof T]: T[K] extends ReadFunction<infer V> ? V : never;
};

/**
 * Given an initial {@link ReadPosition} and a list of {@link ReadFunction}s,
 * apply each {@link ReadFunction} in order, aggregating each result and passing
 * the next {@link ReadPosition} into the next {@link ReadFunction}. If an error
 * occurs, immediately return the error message (`string`), otherwise, return
 * the array of results.
 *
 * @param position - the {@link ReadPosition} at which to start the first read
 * @param readFunctions - the ordered list of {@link ReadFunction}s to apply to
 * the {@link ReadPosition}
 */
export const readMultiple = <ReadFunctionList extends ReadFunction<unknown>[]>(
  position: ReadPosition,
  readFunctions: [...ReadFunctionList],
): MaybeReadResult<ExtractReadFunctionResults<ReadFunctionList>> => {
  // eslint-disable-next-line functional/no-let
  let nextPosition = position;
  const results = [];
  // eslint-disable-next-line functional/no-loop-statements
  for (const readFunction of readFunctions) {
    const out = readFunction(nextPosition);
    if (typeof out === 'string') {
      return out;
    }
    // eslint-disable-next-line functional/no-expression-statements, functional/immutable-data
    results.push(out.result);
    // eslint-disable-next-line functional/no-expression-statements
    nextPosition = out.position;
  }
  return {
    position: nextPosition,
    result: results as ExtractReadFunctionResults<ReadFunctionList>,
  };
};

export enum ReadItemCountError {
  itemCount = 'Error reading item count.',
  item = 'Error reading item.',
}

/**
 * Read a count of items indicated by the CompactUint at {@link ReadPosition}.
 * The CompactUint will be read to determine the number of items, and the read
 * function will be applied in series, aggregated each result and passing the
 * next {@link ReadPosition} into each iteration. If an error occurs,
 * immediately return the error message (`string`), otherwise, return the array
 * of results.
 */
export const readItemCount = <Type>(
  position: ReadPosition,
  readFunction: ReadFunction<Type>,
): MaybeReadResult<Type[]> => {
  const countRead = readCompactUintMinimal(position);
  if (typeof countRead === 'string') {
    return formatError(ReadItemCountError.itemCount, countRead);
  }
  // eslint-disable-next-line functional/no-let
  let nextPosition = countRead.position;
  const result: Type[] = [];
  // eslint-disable-next-line functional/no-loop-statements, functional/no-let, no-plusplus
  for (let remaining = Number(countRead.result); remaining > 0; remaining--) {
    const read = readFunction(nextPosition);
    if (typeof read === 'string') {
      return formatError(ReadItemCountError.item, read);
    }
    // eslint-disable-next-line functional/no-expression-statements, functional/immutable-data
    result.push(read.result);
    // eslint-disable-next-line functional/no-expression-statements
    nextPosition = read.position;
  }
  return { position: nextPosition, result };
};
