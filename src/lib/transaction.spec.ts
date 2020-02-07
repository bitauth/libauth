/* eslint-disable functional/no-expression-statement, @typescript-eslint/no-magic-numbers */
import test from 'ava';

import { deserializeTransaction, hexToBin, serializeTransaction } from './lib';

test('deserializeTransaction', t => {
  const tx = hexToBin(
    '3eb87070042d16f9469b0080a3c1fe8de0feae345200beef8b1e0d7c62501ae0df899dca1e03000000066a0065525365ffffffffd14a9a335e8babddd89b5d0b6a0f41dd6b18848050a0fc48ce32d892e11817fd030000000863acac00535200527ff62cf3ad30d9064e180eaed5e6303950121a8086b5266b55156e4f7612f2c7ebf223e0020000000100ffffffff6273ca3aceb55931160fa7a3064682b4790ee016b4a5c0c0d101fd449dff88ba01000000055351ac526aa3b8223d0421f25b0400000000026552f92db70500000000075253516a656a53c4a908010000000000b5192901000000000652525251516aa148ca38'
  );
  t.deepEqual(deserializeTransaction(tx), {
    inputs: [
      {
        outpointIndex: 3,
        outpointTransactionHash: hexToBin(
          '1eca9d89dfe01a50627c0d1e8befbe005234aefee08dfec1a380009b46f9162d'
        ),
        sequenceNumber: 4294967295,
        unlockingBytecode: hexToBin('6a0065525365')
      },
      {
        outpointIndex: 3,
        outpointTransactionHash: hexToBin(
          'fd1718e192d832ce48fca0508084186bdd410f6a0b5d9bd8ddab8b5e339a4ad1'
        ),
        sequenceNumber: 4079810175,
        unlockingBytecode: hexToBin('63acac0053520052')
      },
      {
        outpointIndex: 2,
        outpointTransactionHash: hexToBin(
          'e023f2ebc7f212764f6e15556b26b586801a12503930e6d5ae0e184e06d930ad'
        ),
        sequenceNumber: 4294967295,
        unlockingBytecode: hexToBin('00')
      },
      {
        outpointIndex: 1,
        outpointTransactionHash: hexToBin(
          'ba88ff9d44fd01d1c0c0a5b416e00e79b4824606a3a70f163159b5ce3aca7362'
        ),
        sequenceNumber: 1025685667,
        unlockingBytecode: hexToBin('5351ac526a')
      }
    ],
    locktime: 952780961,
    outputs: [
      {
        lockingBytecode: hexToBin('6552'),
        satoshis: BigInt(73134625)
      },
      {
        lockingBytecode: hexToBin('5253516a656a53'),
        satoshis: BigInt(95890937)
      },
      {
        lockingBytecode: hexToBin(''),
        satoshis: BigInt(17344964)
      },
      {
        lockingBytecode: hexToBin('52525251516a'),
        satoshis: BigInt(19470773)
      }
    ],
    version: 1886435390
  });
});

test('serializeTransaction', t => {
  const tx = {
    inputs: [
      {
        outpointIndex: 3,
        outpointTransactionHash: hexToBin(
          '1eca9d89dfe01a50627c0d1e8befbe005234aefee08dfec1a380009b46f9162d'
        ),
        sequenceNumber: 4294967295,
        unlockingBytecode: hexToBin('6a0065525365')
      },
      {
        outpointIndex: 3,
        outpointTransactionHash: hexToBin(
          'fd1718e192d832ce48fca0508084186bdd410f6a0b5d9bd8ddab8b5e339a4ad1'
        ),
        sequenceNumber: 4079810175,
        unlockingBytecode: hexToBin('63acac0053520052')
      },
      {
        outpointIndex: 2,
        outpointTransactionHash: hexToBin(
          'e023f2ebc7f212764f6e15556b26b586801a12503930e6d5ae0e184e06d930ad'
        ),
        sequenceNumber: 4294967295,
        unlockingBytecode: hexToBin('00')
      },
      {
        outpointIndex: 1,
        outpointTransactionHash: hexToBin(
          'ba88ff9d44fd01d1c0c0a5b416e00e79b4824606a3a70f163159b5ce3aca7362'
        ),
        sequenceNumber: 1025685667,
        unlockingBytecode: hexToBin('5351ac526a')
      }
    ],
    locktime: 952780961,
    outputs: [
      {
        lockingBytecode: hexToBin('6552'),
        satoshis: BigInt(73134625)
      },
      {
        lockingBytecode: hexToBin('5253516a656a53'),
        satoshis: BigInt(95890937)
      },
      {
        lockingBytecode: hexToBin(''),
        satoshis: BigInt(17344964)
      },
      {
        lockingBytecode: hexToBin('52525251516a'),
        satoshis: BigInt(19470773)
      }
    ],
    version: 1886435390
  };
  t.deepEqual(
    serializeTransaction(tx),
    hexToBin(
      '3eb87070042d16f9469b0080a3c1fe8de0feae345200beef8b1e0d7c62501ae0df899dca1e03000000066a0065525365ffffffffd14a9a335e8babddd89b5d0b6a0f41dd6b18848050a0fc48ce32d892e11817fd030000000863acac00535200527ff62cf3ad30d9064e180eaed5e6303950121a8086b5266b55156e4f7612f2c7ebf223e0020000000100ffffffff6273ca3aceb55931160fa7a3064682b4790ee016b4a5c0c0d101fd449dff88ba01000000055351ac526aa3b8223d0421f25b0400000000026552f92db70500000000075253516a656a53c4a908010000000000b5192901000000000652525251516aa148ca38'
    )
  );
});

test('deserialize and re-serialize transaction', t => {
  const tx =
    '3eb87070042d16f9469b0080a3c1fe8de0feae345200beef8b1e0d7c62501ae0df899dca1e03000000066a0065525365ffffffffd14a9a335e8babddd89b5d0b6a0f41dd6b18848050a0fc48ce32d892e11817fd030000000863acac00535200527ff62cf3ad30d9064e180eaed5e6303950121a8086b5266b55156e4f7612f2c7ebf223e0020000000100ffffffff6273ca3aceb55931160fa7a3064682b4790ee016b4a5c0c0d101fd449dff88ba01000000055351ac526aa3b8223d0421f25b0400000000026552f92db70500000000075253516a656a53c4a908010000000000b5192901000000000652525251516aa148ca38';
  t.deepEqual(
    hexToBin(tx),
    serializeTransaction(deserializeTransaction(hexToBin(tx)))
  );
});
