import {
  flattenBinArray,
  formatError,
  numberToBinUint32LE,
  readMultiple
} from "../lib.js";
import {
  type MaybeReadResult,
  type ReadPosition,
} from "../lib.js"
import {
  readBytes,
  readUint32LE,
} from "./read-components.js";

const SHA256HASHLEN = 32;

export enum HeaderDecodingError {
  version = "Error reading version.",
  previousBlock = "Error reading previous block.",
  merkleRootHash = "Error reading merkle root hash",
  time = "Error reading time",
  difficultyTarget = "Error reading difficulty target",
  nonce = "Error reading nonce",
  generic = "Error reading header.",
  endsWithUnexpectedBytes = "Error decoding header: the provided header includes unexpected bytes.",
}

/**
 * Represents the header of a block in a blockchain.
 */
export type BlockHeader = {
  /**
   * The version of the block.
   */
  version: number;

  /**
   * The hash of the previous block in the blockchain.
   */
  previousBlockHash: Uint8Array;

  /**
   * The hash of the Merkle root of the transactions in the block.
   */
  merkleRootHash: Uint8Array;

  /**
   * The Unix epoch time at which the block was created.
   */
  time: number;

  /**
   * The target value for the block's proof-of-work.
   */
  difficultyTarget: number;

  /**
   * A random value used in the proof-of-work calculation.
   */
  nonce: number;
};

/**
 * Attempts to read a BlockHeader from the provided binary data at the given position.
 *
 * @param {ReadPosition} position - The position in the binary data from which to start reading.
 * @returns {MaybeReadResult<BlockHeader>} A parsed BlockHeader object if successful, or an error message if not.
 */
export const readHeader = (
  position: ReadPosition,
): MaybeReadResult<BlockHeader> => {
  const headerRead = readMultiple(position, [
    readUint32LE,
    readBytes(SHA256HASHLEN), // previous block hash
    readBytes(SHA256HASHLEN), // merkle root
    readUint32LE, // Unix epoch time
    readUint32LE, //  target difficulty A.K.A bits
    readUint32LE, // nonce
  ]);
  if (typeof headerRead === "string") {
    return formatError(HeaderDecodingError.generic, headerRead);
  }
  const {
    position: nextPosition,
    result: [
      version,
      previousBlockHash,
      merkleRootHash,
      time,
      difficultyTarget,
      nonce,
    ],
  } = headerRead;
  return {
    position: nextPosition,
    result: {
      version,
      previousBlockHash: previousBlockHash.reverse(),
      merkleRootHash: merkleRootHash.reverse(),
      time,
      difficultyTarget,
      nonce,
    },
  };
};

/**
 * Decodes a BlockHeader from a given Uint8Array containing its binary representation.
 *
 * @param {Uint8Array} bin - The binary data containing the encoded BlockHeader.
 * @returns {BlockHeader | string} A parsed BlockHeader object if successful, or an error message if not.
 */
export const decodeHeader = (bin: Uint8Array): BlockHeader | string => {
  const headerRead = readHeader({ bin, index: 0 });
  if (typeof headerRead === "string") {
    return headerRead;
  }
  if (headerRead.position.index !== bin.length) {
    return formatError(
      HeaderDecodingError.endsWithUnexpectedBytes,
      `Encoded header ends at index ${headerRead.position.index - 1}, leaving ${bin.length - headerRead.position.index
      } remaining bytes.`,
    );
  }
  return headerRead.result;
};

/**
 * Encodes a BlockHeader object into its binary representation.
 *
 * This function takes a `BlockHeader` object and returns a new `Uint8Array` containing its
 * serialized form. The encoding process follows the little-endian convention for all numerical
 * values (version, time, difficultyTarget, and nonce).
 *
 * @param {BlockHeader} header - The BlockHeader object to encode.
 * @returns {Uint8Array} A new Uint8Array containing the binary representation of the BlockHeader.
 */
export const encodeHeader = (header: BlockHeader) =>
  flattenBinArray([
    numberToBinUint32LE(header.version),
    header.previousBlockHash.reverse(),
    header.merkleRootHash.reverse(),
    numberToBinUint32LE(header.time),
    numberToBinUint32LE(header.difficultyTarget),
    numberToBinUint32LE(header.nonce),
  ]);
