import test from 'ava';
import { hexToBin } from '../lib.js';
import { decodeHeader, encodeHeader } from './block-header-encoding.js';
import type { BlockHeader } from './block-header-encoding.js'

export const uahfHeader = hexToBin(
  "02000020e42980330b7294bef6527af576e5cfe2c97d55f9c19beb0000000000000000004a88016082f466735a0f4bc9e5e42725fbc3d0ac28d4ab9547bf18654f14655b1e7f80593547011816dd5975",
);

const genesisHeader = hexToBin(
  "0100000000000000000000000000000000000000000000000000000000000000000000003ba3edfd7a7b12b27ac72c3e67768f617fc81bc3888a51323a9fb8aa4b1e5e4a29ab5f49ffff001d1dac2b7c",
);
const genesisDecoded: BlockHeader = {
  version: 1,
  previousBlockHash: hexToBin("0000000000000000000000000000000000000000000000000000000000000000"),
  merkleRootHash: hexToBin("4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b"),
  time: 1231006505,
  difficultyTarget: 486604799,
  nonce: 2083236893,
};
const uahfDecoded: BlockHeader = {
  version: 536870914,
  previousBlockHash: hexToBin("000000000000000000eb9bc1f9557dc9e2cfe576f57a52f6be94720b338029e4"),
  merkleRootHash: hexToBin("5b65144f6518bf4795abd428acd0c3fb2527e4e5c94b0f5a7366f4826001884a"),
  time: 1501593374,
  difficultyTarget: 402736949,
  nonce: 1968823574,
};
test("decodeHeader genesis", (t) => {
  t.deepEqual(decodeHeader(genesisHeader), genesisDecoded)
})
test("encodeHeader genesis", (t) => {
  t.deepEqual(encodeHeader(genesisDecoded), genesisHeader)
})
test("decodeHeader uahf", (t) => {
  t.deepEqual(decodeHeader(uahfHeader), uahfDecoded)
})
test("encodeHeader uahf", (t) => {
  t.deepEqual(encodeHeader(uahfDecoded), uahfHeader)
})

test("decodeHeader invalid version byte length", (t) => {
  t.deepEqual(decodeHeader(Uint8Array.from([])), "Error reading header. Error reading Uint32LE: requires 4 bytes. Remaining bytes: 0")
})
test("decodeHeader invalid previousHash byte length", (t) => {
  t.deepEqual(decodeHeader(Uint8Array.from([0, 0, 0, 0, 0])), "Error reading header. Error reading bytes: insufficient length. Bytes requested: 32; remaining bytes: 1")
})
test("decodeHeader invalid merkle byte length", (t) => {
  t.deepEqual(decodeHeader(new Uint8Array(40)), "Error reading header. Error reading bytes: insufficient length. Bytes requested: 32; remaining bytes: 4")
})
test("decodeHeader invalid time length", (t) => {
  t.deepEqual(decodeHeader(new Uint8Array(68)), "Error reading header. Error reading Uint32LE: requires 4 bytes. Remaining bytes: 0")
})
test("decodeHeader invalid target length", (t) => {
  t.deepEqual(decodeHeader(new Uint8Array(72)), "Error reading header. Error reading Uint32LE: requires 4 bytes. Remaining bytes: 0")
})
test("decodeHeader invalid nonce length", (t) => {
  t.deepEqual(decodeHeader(new Uint8Array(76)), "Error reading header. Error reading Uint32LE: requires 4 bytes. Remaining bytes: 0")
})
