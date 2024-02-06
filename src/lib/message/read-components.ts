import {
  binToBigIntUint64LE,
  binToNumberUint32LE,
  formatError,
  readCompactUintMinimal,
} from '../format/format.js';
import type { MaybeReadResult, ReadPosition } from '../lib.js';

const enum ReadConstants {
  bytesPerUint32 = 4,
  bytesPerUint64 = 8,
}

export enum ReadBytesError {
  insufficientLength = 'Error reading bytes: insufficient length.',
}

/**
 * Returns a function that reads the requested number of bytes from a
 * {@link ReadPosition}, returning either an error message (as a string) or an
 * object containing the `Uint8Array` and the next {@link ReadPosition}.
 *
 * @param length - the number of bytes to read
 */
export const readBytes =
  (length: number) =>
  (
    /**
     * the {@link ReadPosition} at which to start reading the bytes.
     */
    position: ReadPosition,
  ): MaybeReadResult<Uint8Array> => {
    const nextPosition: ReadPosition = {
      bin: position.bin,
      index: position.index + length,
    };
    const result = position.bin.slice(position.index, nextPosition.index);
    if (result.length !== length) {
      return formatError(
        ReadBytesError.insufficientLength,
        `Provided length: ${result.length}`,
      );
    }
    return { position: nextPosition, result };
  };

export enum ReadUint32LEError {
  insufficientBytes = 'Error reading Uint32LE: requires 4 bytes.',
}

/**
 * Read a 4-byte, Uint32LE from the provided {@link ReadPosition},
 * returning either an error message (as a string) or an object containing the
 * number and the next {@link ReadPosition}.
 *
 * @param position - the {@link ReadPosition} at which to start reading
 */
export const readUint32LE = (
  position: ReadPosition,
): MaybeReadResult<number> => {
  const nextPosition: ReadPosition = {
    bin: position.bin,
    index: position.index + ReadConstants.bytesPerUint32,
  };
  const uint32LEBin = position.bin.subarray(position.index, nextPosition.index);
  if (uint32LEBin.length !== ReadConstants.bytesPerUint32) {
    return formatError(
      ReadUint32LEError.insufficientBytes,
      `Provided length: ${uint32LEBin.length}`,
    );
  }
  const result = binToNumberUint32LE(uint32LEBin);
  return { position: nextPosition, result };
};

export enum ReadUint64LEError {
  insufficientBytes = 'Error reading Uint64LE: requires 8 bytes.',
}

/**
 * Read {@link Output.valueSatoshis} from the provided {@link ReadPosition},
 * returning either an error message (as a string) or an object containing the
 * {@link Output.valueSatoshis} and the next {@link ReadPosition}.
 * @param position - the {@link ReadPosition} at which to start reading
 * {@link Output.valueSatoshis}
 */
export const readUint64LE = (
  position: ReadPosition,
): MaybeReadResult<bigint> => {
  const nextPosition: ReadPosition = {
    bin: position.bin,
    index: position.index + ReadConstants.bytesPerUint64,
  };
  const uint64LEBin = position.bin.subarray(position.index, nextPosition.index);
  if (uint64LEBin.length !== ReadConstants.bytesPerUint64) {
    return formatError(
      ReadUint64LEError.insufficientBytes,
      `Provided length: ${uint64LEBin.length}`,
    );
  }
  const result = binToBigIntUint64LE(uint64LEBin);
  return { position: nextPosition, result };
};

export enum CompactUintPrefixedBinError {
  invalidCompactUint = 'Error reading CompactUint-prefixed bin: invalid CompactUint.',
  insufficientBytes = 'Error reading CompactUint-prefixed bin: insufficient bytes.',
}

/**
 * Read a bin (`Uint8Array`) that is prefixed by a minimally-encoded
 * `CompactUint` starting at the provided {@link ReadPosition}, returning either
 * an error message (as a string) or an object containing the `Uint8Array` and
 * the next {@link ReadPosition}. (In the transaction format,
 * `CompactUint`-prefixes are used to indicate the length of unlocking bytecode,
 * locking bytecode, and non-fungible token commitments.)
 *
 * @param position - the {@link ReadPosition} at which to start reading the
 * `CompactUint`-prefixed bin (`Uint8Array`)
 */
export const readCompactUintPrefixedBin = (
  position: ReadPosition,
): MaybeReadResult<Uint8Array> => {
  const read = readCompactUintMinimal(position);
  if (typeof read === 'string') {
    return formatError(CompactUintPrefixedBinError.invalidCompactUint, read);
  }
  const { result, position: p2 } = read;
  const length = Number(result);
  const nextPosition = { bin: position.bin, index: p2.index + length };
  const contents = position.bin.slice(p2.index, nextPosition.index);
  if (contents.length !== length) {
    return formatError(
      CompactUintPrefixedBinError.insufficientBytes,
      `Required bytes: ${length}, remaining bytes: ${contents.length}`,
    );
  }
  return { position: nextPosition, result: contents };
};

/**
 * Read the remaining bytes from the provided {@link ReadPosition}, returning
 * an object containing the `Uint8Array` and the next {@link ReadPosition}
 * (with `index === bin.length`).
 *
 * @param position - the {@link ReadPosition} at which to start reading the
 * remaining bytes
 */
export const readRemainingBytes = (position: ReadPosition) => {
  const nextPosition: ReadPosition = {
    bin: position.bin,
    index: position.bin.length,
  };
  const result = position.bin.subarray(position.index, nextPosition.index);
  return { position: nextPosition, result };
};
