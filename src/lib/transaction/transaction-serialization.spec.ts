/* eslint-disable functional/no-expression-statement, @typescript-eslint/no-magic-numbers */
import test from 'ava';

import {
  bigIntToBinUint64LE,
  decodeTransaction,
  encodeTransaction,
  getTransactionHash,
  getTransactionHashBE,
  getTransactionHashLE,
  hexToBin,
  instantiateSha256,
  Transaction,
  TransactionDecodingError,
} from '../lib';

const sha256Promise = instantiateSha256();

test('decodeTransaction', (t) => {
  /**
   * Example transaction:
   *
   * 3eb87070 ← version
   *
   * 04 ← number of inputs
   *
   * Input 1 outpointTransactionHash (reverse byte order):
   * 2d16f9469b0080a3c1fe8de0feae345200beef8b1e0d7c62501ae0df899dca1e
   * 03000000 ← outpointIndex (BinUint32LE)
   * 06 ← bytecodeLength (Bitcoin VarInt)
   * 6a0065525365 ← bytecode
   * ffffffff ← sequence number (BinUint32LE)
   *
   * Input 2:
   * d14a9a335e8babddd89b5d0b6a0f41dd6b18848050a0fc48ce32d892e11817fd
   * 03000000
   * 08
   * 63acac0053520052
   * 7ff62cf3
   *
   * Input 3:
   * ad30d9064e180eaed5e6303950121a8086b5266b55156e4f7612f2c7ebf223e0
   * 02000000
   * 01
   * 00
   * ffffffff
   *
   * Input 4:
   * 6273ca3aceb55931160fa7a3064682b4790ee016b4a5c0c0d101fd449dff88ba
   * 01000000
   * 05
   * 5351ac526a
   * a3b8223d
   *
   * 04 ← number of outputs
   *
   * Output 1:
   * 21f25b0400000000 ← satoshis (BinUint64LE)
   * 02 ← bytecodeLength (Bitcoin VarInt)
   * 6552 ← lockingBytecode
   *
   * Output 2:
   * f92db70500000000
   * 07
   * 5253516a656a53
   *
   * Output 3:
   * c4a9080100000000
   * 00
   *
   * Output 4:
   * b519290100000000
   * 06
   * 52525251516a
   *
   * a148ca38 ← locktime (BinUint32LE)
   */
  const tx = hexToBin(
    '3eb87070042d16f9469b0080a3c1fe8de0feae345200beef8b1e0d7c62501ae0df899dca1e03000000066a0065525365ffffffffd14a9a335e8babddd89b5d0b6a0f41dd6b18848050a0fc48ce32d892e11817fd030000000863acac00535200527ff62cf3ad30d9064e180eaed5e6303950121a8086b5266b55156e4f7612f2c7ebf223e0020000000100ffffffff6273ca3aceb55931160fa7a3064682b4790ee016b4a5c0c0d101fd449dff88ba01000000055351ac526aa3b8223d0421f25b0400000000026552f92db70500000000075253516a656a53c4a908010000000000b5192901000000000652525251516aa148ca38'
  );
  t.deepEqual(decodeTransaction(tx), {
    inputs: [
      {
        outpointIndex: 3,
        outpointTransactionHash: hexToBin(
          '1eca9d89dfe01a50627c0d1e8befbe005234aefee08dfec1a380009b46f9162d'
        ),
        sequenceNumber: 4294967295,
        unlockingBytecode: hexToBin('6a0065525365'),
      },
      {
        outpointIndex: 3,
        outpointTransactionHash: hexToBin(
          'fd1718e192d832ce48fca0508084186bdd410f6a0b5d9bd8ddab8b5e339a4ad1'
        ),
        sequenceNumber: 4079810175,
        unlockingBytecode: hexToBin('63acac0053520052'),
      },
      {
        outpointIndex: 2,
        outpointTransactionHash: hexToBin(
          'e023f2ebc7f212764f6e15556b26b586801a12503930e6d5ae0e184e06d930ad'
        ),
        sequenceNumber: 4294967295,
        unlockingBytecode: hexToBin('00'),
      },
      {
        outpointIndex: 1,
        outpointTransactionHash: hexToBin(
          'ba88ff9d44fd01d1c0c0a5b416e00e79b4824606a3a70f163159b5ce3aca7362'
        ),
        sequenceNumber: 1025685667,
        unlockingBytecode: hexToBin('5351ac526a'),
      },
    ],
    locktime: 952780961,
    outputs: [
      {
        lockingBytecode: hexToBin('6552'),
        satoshis: bigIntToBinUint64LE(BigInt(73134625)),
      },
      {
        lockingBytecode: hexToBin('5253516a656a53'),
        satoshis: bigIntToBinUint64LE(BigInt(95890937)),
      },
      {
        lockingBytecode: hexToBin(''),
        satoshis: bigIntToBinUint64LE(BigInt(17344964)),
      },
      {
        lockingBytecode: hexToBin('52525251516a'),
        satoshis: bigIntToBinUint64LE(BigInt(19470773)),
      },
    ],
    version: 1886435390,
  });
});

test('encodeTransaction', (t) => {
  const tx = {
    inputs: [
      {
        outpointIndex: 3,
        outpointTransactionHash: hexToBin(
          '1eca9d89dfe01a50627c0d1e8befbe005234aefee08dfec1a380009b46f9162d'
        ),
        sequenceNumber: 4294967295,
        unlockingBytecode: hexToBin('6a0065525365'),
      },
      {
        outpointIndex: 3,
        outpointTransactionHash: hexToBin(
          'fd1718e192d832ce48fca0508084186bdd410f6a0b5d9bd8ddab8b5e339a4ad1'
        ),
        sequenceNumber: 4079810175,
        unlockingBytecode: hexToBin('63acac0053520052'),
      },
      {
        outpointIndex: 2,
        outpointTransactionHash: hexToBin(
          'e023f2ebc7f212764f6e15556b26b586801a12503930e6d5ae0e184e06d930ad'
        ),
        sequenceNumber: 4294967295,
        unlockingBytecode: hexToBin('00'),
      },
      {
        outpointIndex: 1,
        outpointTransactionHash: hexToBin(
          'ba88ff9d44fd01d1c0c0a5b416e00e79b4824606a3a70f163159b5ce3aca7362'
        ),
        sequenceNumber: 1025685667,
        unlockingBytecode: hexToBin('5351ac526a'),
      },
    ],
    locktime: 952780961,
    outputs: [
      {
        lockingBytecode: hexToBin('6552'),
        satoshis: bigIntToBinUint64LE(BigInt(73134625)),
      },
      {
        lockingBytecode: hexToBin('5253516a656a53'),
        satoshis: bigIntToBinUint64LE(BigInt(95890937)),
      },
      {
        lockingBytecode: hexToBin(''),
        satoshis: bigIntToBinUint64LE(BigInt(17344964)),
      },
      {
        lockingBytecode: hexToBin('52525251516a'),
        satoshis: bigIntToBinUint64LE(BigInt(19470773)),
      },
    ],
    version: 1886435390,
  };
  t.deepEqual(
    encodeTransaction(tx),
    hexToBin(
      '3eb87070042d16f9469b0080a3c1fe8de0feae345200beef8b1e0d7c62501ae0df899dca1e03000000066a0065525365ffffffffd14a9a335e8babddd89b5d0b6a0f41dd6b18848050a0fc48ce32d892e11817fd030000000863acac00535200527ff62cf3ad30d9064e180eaed5e6303950121a8086b5266b55156e4f7612f2c7ebf223e0020000000100ffffffff6273ca3aceb55931160fa7a3064682b4790ee016b4a5c0c0d101fd449dff88ba01000000055351ac526aa3b8223d0421f25b0400000000026552f92db70500000000075253516a656a53c4a908010000000000b5192901000000000652525251516aa148ca38'
    )
  );
});

test('decode and encode transaction', (t) => {
  const tx =
    '3eb87070042d16f9469b0080a3c1fe8de0feae345200beef8b1e0d7c62501ae0df899dca1e03000000066a0065525365ffffffffd14a9a335e8babddd89b5d0b6a0f41dd6b18848050a0fc48ce32d892e11817fd030000000863acac00535200527ff62cf3ad30d9064e180eaed5e6303950121a8086b5266b55156e4f7612f2c7ebf223e0020000000100ffffffff6273ca3aceb55931160fa7a3064682b4790ee016b4a5c0c0d101fd449dff88ba01000000055351ac526aa3b8223d0421f25b0400000000026552f92db70500000000075253516a656a53c4a908010000000000b5192901000000000652525251516aa148ca38';
  t.deepEqual(
    hexToBin(tx),
    encodeTransaction(decodeTransaction(hexToBin(tx)) as Transaction)
  );
});

test('decodeTransaction: invalid', (t) => {
  t.deepEqual(
    decodeTransaction(hexToBin('00')),
    TransactionDecodingError.invalidFormat
  );
});

test('getTransactionHash, getTransactionHashBE, getTransactionHashLE', async (t) => {
  const sha256 = await sha256Promise;
  const tx =
    '3eb87070042d16f9469b0080a3c1fe8de0feae345200beef8b1e0d7c62501ae0df899dca1e03000000066a0065525365ffffffffd14a9a335e8babddd89b5d0b6a0f41dd6b18848050a0fc48ce32d892e11817fd030000000863acac00535200527ff62cf3ad30d9064e180eaed5e6303950121a8086b5266b55156e4f7612f2c7ebf223e0020000000100ffffffff6273ca3aceb55931160fa7a3064682b4790ee016b4a5c0c0d101fd449dff88ba01000000055351ac526aa3b8223d0421f25b0400000000026552f92db70500000000075253516a656a53c4a908010000000000b5192901000000000652525251516aa148ca38';
  const txid =
    'fbc40e8ef481fa11e5ffd2477a28297bcceab8bed0d28405774e372b4ffead67';
  t.deepEqual(getTransactionHash(sha256, hexToBin(tx)), txid);
  t.deepEqual(getTransactionHashBE(sha256, hexToBin(tx)), hexToBin(txid));
  t.deepEqual(
    getTransactionHashLE(sha256, hexToBin(tx)),
    hexToBin(txid).reverse()
  );
});
