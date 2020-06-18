import { binToNumberUint32LE, numberToBinUint32LE } from './numbers';

const msPerLocktimeSecond = 1000;

/**
 * The minimum Unix timestamp (inclusive) which can be encoded by a
 * transaction's `locktime`.
 */
export const minimumLocktimeTimestamp = 500000000;

/**
 * The maximum Unix timestamp (inclusive) which can be encoded by a
 * transaction's `locktime`.
 */
export const maximumLocktimeTimestamp = 0xffffffff;

/**
 * The minimum Date (inclusive) which can be encoded by a transaction's
 * `locktime`.
 */
export const minimumLocktimeDate = new Date(
  minimumLocktimeTimestamp * msPerLocktimeSecond
);

/**
 * The maximum Date (inclusive) which can be encoded by a transaction's
 * `locktime`.
 */
export const maximumLocktimeDate = new Date(
  maximumLocktimeTimestamp * msPerLocktimeSecond
);

export enum LocktimeError {
  dateOutOfRange = 'The provided Date is outside of the range which can be encoded in locktime.',
  locktimeOutOfRange = 'The provided locktime is outside of the range which can be encoded as a Date (greater than or equal to 500000000 and less than or equal to 4294967295).',
  incorrectLength = 'The provided locktime is not the correct length (4 bytes).',
}

/**
 * Convert a JavaScript `Date` object to its equivalent transaction `locktime`
 * representation. The `date` is rounded to the nearest second (the precision of
 * `locktime` Dates).
 *
 * Note, a locktime values greater than or equal to `500000000`
 * See `Transaction.locktime` for details.
 *
 * @param date - the Date to convert to a locktime number
 */
export const dateToLocktime = (date: Date) =>
  date < minimumLocktimeDate || date > maximumLocktimeDate
    ? LocktimeError.dateOutOfRange
    : Math.round(date.getTime() / msPerLocktimeSecond);

/**
 * Convert a transaction `locktime` to its equivalent JavaScript `Date` object.
 * If locktime is outside the possible range (greater than or equal to
 * `500000000` and less than or equal to `4294967295`), an error message is
 * returned.
 *
 * @param locktime - a positive integer between `500000000` and `4294967295`,
 * inclusive
 */
export const locktimeToDate = (locktime: number) =>
  locktime < minimumLocktimeTimestamp || locktime > maximumLocktimeTimestamp
    ? LocktimeError.locktimeOutOfRange
    : new Date(locktime * msPerLocktimeSecond);

/**
 * Convert a JavaScript `Date` object to its equivalent transaction `locktime`
 * bytecode representation. The `date` is rounded to the nearest second (the
 * precision of `locktime` Dates).
 *
 * Note: a block-based locktime can simply be encoded with `numberToBinUint32LE`
 * (provided it is no larger than the maximum, `499999999`).
 *
 * @param date - the Date to convert to a locktime Uint8Array
 */
export const dateToLocktimeBin = (date: Date) => {
  const result = dateToLocktime(date);
  return typeof result === 'string' ? result : numberToBinUint32LE(result);
};

const locktimeByteLength = 4;
/**
 * Parse a locktime, returning a `number` for block heights, a `Date` for block
 * times, or a string for parsing errors.
 *
 * @param bin - the 4-byte Uint8Array locktime to parse
 */
export const parseLocktimeBin = (bin: Uint8Array) => {
  if (bin.length !== locktimeByteLength) return LocktimeError.incorrectLength;
  const parsed = binToNumberUint32LE(bin);
  return parsed >= minimumLocktimeTimestamp
    ? new Date(parsed * msPerLocktimeSecond)
    : parsed;
};
