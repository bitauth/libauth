import { binToNumberUint32LE, numberToBinUint32LE } from './numbers';

enum Constants {
  msPerLocktimeSecond = 1000,
  minimumTimestamp = 500000000,
  maximumLocktime = 0xffffffff,
  byteLength = 4
}

/**
 * The minimum Date (inclusive) which can be encoded by a transaction's
 * `locktime`.
 */
export const minimumLocktimeDate = new Date(
  Constants.minimumTimestamp * Constants.msPerLocktimeSecond
);

/**
 * The maximum Date (inclusive) which can be encoded by a transaction's
 * `locktime`.
 */
export const maximumLocktimeDate = new Date(
  Constants.maximumLocktime * Constants.msPerLocktimeSecond
);

export enum LocktimeError {
  outOfRange = 'The provided Date is outside of the range which can be encoded in locktime.',
  incorrectLength = 'The provided locktime is not the correct length (4 bytes).'
}

/**
 * Convert a Javascript `Date` object to its equivalent transaction `locktime`
 * representation. The `date` is rounded to the nearest second (the precision of
 * `locktime` Dates).
 *
 * Note: a block-based locktime can simply be encoded with `numberToBinUint32LE`
 * (provided it is no larger than the maximum, `499999999`).
 *
 * @param date - the Date to convert to a locktime Uint8Array
 */
export const dateToLocktime = (date: Date) =>
  date < minimumLocktimeDate || date > maximumLocktimeDate
    ? LocktimeError.outOfRange
    : numberToBinUint32LE(
        Math.round(date.getTime() / Constants.msPerLocktimeSecond)
      );

/**
 * Parse a locktime, returning a `number` for block heights, a `Date` for block
 * times, or a string for parsing errors.
 *
 * @param bin - the 4-byte Uint8Array locktime to parse
 */
export const parseLocktime = (bin: Uint8Array) => {
  if (bin.length !== Constants.byteLength) return LocktimeError.incorrectLength;
  const parsed = binToNumberUint32LE(bin);
  return parsed >= Constants.minimumTimestamp
    ? new Date(parsed * Constants.msPerLocktimeSecond)
    : parsed;
};
