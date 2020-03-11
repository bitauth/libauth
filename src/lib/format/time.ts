import {
  bigIntToScriptNumber,
  parseBytesAsScriptNumber
} from '../auth/instruction-sets/common/types';

enum Constants {
  msPerLocktimeSecond = 1000,
  minimumTimestamp = 500000000
}

/**
 * Convert a Javascript `Date` object to its equivalent LockTime
 * representation in an `AuthenticationVirtualMachine`.
 *
 * TODO: this method should error past the overflow Date and for dates which
 * would become BlockHeights when encoded.
 *
 * @param date - the Date to convert to a BlockTime Uint8Array
 */
export const dateToLockTime = (date: Date) =>
  bigIntToScriptNumber(
    BigInt(Math.round(date.getTime() / Constants.msPerLocktimeSecond))
  );

/**
 * Parse a locktime, returning a `number` for block heights, a `Date` for block
 * times, and a string for parsing errors.
 *
 * Note: this method does not check the length of locktime
 *
 * @param bin - the 4-byte Uint8Array locktime to parse
 */
export const parseLockTime = (bin: Uint8Array) => {
  const parsed = parseBytesAsScriptNumber(bin);
  return typeof parsed === 'string'
    ? parsed
    : parsed >= BigInt(Constants.minimumTimestamp)
    ? new Date(Number(parsed) * Constants.msPerLocktimeSecond)
    : Number(parsed);
};
