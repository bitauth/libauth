import test from 'ava';

import type { Output, TransactionCommon } from '../lib.js';
import {
  decodeTransactionCommon,
  encodeTokenPrefix,
  encodeTransactionCommon,
  hashTransaction,
  hashTransactionP2pOrder,
  hashTransactionUiOrder,
  hexToBin,
  readTokenPrefix,
  sha256,
} from '../lib.js';

// eslint-disable-next-line import/no-restricted-paths, import/no-internal-modules
import tokenPrefixInvalidJson from './fixtures/token-prefix-invalid.json' assert { type: 'json' };
// eslint-disable-next-line import/no-restricted-paths, import/no-internal-modules
import tokenPrefixValidJson from './fixtures/token-prefix-valid.json' assert { type: 'json' };

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
   * 06 ← bytecodeLength (CompactUint)
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
   * 02 ← bytecodeLength (CompactUint)
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
    '3eb87070042d16f9469b0080a3c1fe8de0feae345200beef8b1e0d7c62501ae0df899dca1e03000000066a0065525365ffffffffd14a9a335e8babddd89b5d0b6a0f41dd6b18848050a0fc48ce32d892e11817fd030000000863acac00535200527ff62cf3ad30d9064e180eaed5e6303950121a8086b5266b55156e4f7612f2c7ebf223e0020000000100ffffffff6273ca3aceb55931160fa7a3064682b4790ee016b4a5c0c0d101fd449dff88ba01000000055351ac526aa3b8223d0421f25b0400000000026552f92db70500000000075253516a656a53c4a908010000000000b5192901000000000652525251516aa148ca38',
  );
  t.deepEqual(decodeTransactionCommon(tx), {
    inputs: [
      {
        outpointIndex: 3,
        outpointTransactionHash: hexToBin(
          '1eca9d89dfe01a50627c0d1e8befbe005234aefee08dfec1a380009b46f9162d',
        ),
        sequenceNumber: 4294967295,
        unlockingBytecode: hexToBin('6a0065525365'),
      },
      {
        outpointIndex: 3,
        outpointTransactionHash: hexToBin(
          'fd1718e192d832ce48fca0508084186bdd410f6a0b5d9bd8ddab8b5e339a4ad1',
        ),
        sequenceNumber: 4079810175,
        unlockingBytecode: hexToBin('63acac0053520052'),
      },
      {
        outpointIndex: 2,
        outpointTransactionHash: hexToBin(
          'e023f2ebc7f212764f6e15556b26b586801a12503930e6d5ae0e184e06d930ad',
        ),
        sequenceNumber: 4294967295,
        unlockingBytecode: hexToBin('00'),
      },
      {
        outpointIndex: 1,
        outpointTransactionHash: hexToBin(
          'ba88ff9d44fd01d1c0c0a5b416e00e79b4824606a3a70f163159b5ce3aca7362',
        ),
        sequenceNumber: 1025685667,
        unlockingBytecode: hexToBin('5351ac526a'),
      },
    ],
    locktime: 952780961,
    outputs: [
      {
        lockingBytecode: hexToBin('6552'),
        valueSatoshis: 73134625n,
      },
      {
        lockingBytecode: hexToBin('5253516a656a53'),
        valueSatoshis: 95890937n,
      },
      {
        lockingBytecode: hexToBin(''),
        valueSatoshis: 17344964n,
      },
      {
        lockingBytecode: hexToBin('52525251516a'),
        valueSatoshis: 19470773n,
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
          '1eca9d89dfe01a50627c0d1e8befbe005234aefee08dfec1a380009b46f9162d',
        ),
        sequenceNumber: 4294967295,
        unlockingBytecode: hexToBin('6a0065525365'),
      },
      {
        outpointIndex: 3,
        outpointTransactionHash: hexToBin(
          'fd1718e192d832ce48fca0508084186bdd410f6a0b5d9bd8ddab8b5e339a4ad1',
        ),
        sequenceNumber: 4079810175,
        unlockingBytecode: hexToBin('63acac0053520052'),
      },
      {
        outpointIndex: 2,
        outpointTransactionHash: hexToBin(
          'e023f2ebc7f212764f6e15556b26b586801a12503930e6d5ae0e184e06d930ad',
        ),
        sequenceNumber: 4294967295,
        unlockingBytecode: hexToBin('00'),
      },
      {
        outpointIndex: 1,
        outpointTransactionHash: hexToBin(
          'ba88ff9d44fd01d1c0c0a5b416e00e79b4824606a3a70f163159b5ce3aca7362',
        ),
        sequenceNumber: 1025685667,
        unlockingBytecode: hexToBin('5351ac526a'),
      },
    ],
    locktime: 952780961,
    outputs: [
      {
        lockingBytecode: hexToBin('6552'),
        valueSatoshis: 73134625n,
      },
      {
        lockingBytecode: hexToBin('5253516a656a53'),
        valueSatoshis: 95890937n,
      },
      {
        lockingBytecode: hexToBin(''),
        valueSatoshis: 17344964n,
      },
      {
        lockingBytecode: hexToBin('52525251516a'),
        valueSatoshis: 19470773n,
      },
    ],
    version: 1886435390,
  };
  t.deepEqual(
    encodeTransactionCommon(tx),
    hexToBin(
      '3eb87070042d16f9469b0080a3c1fe8de0feae345200beef8b1e0d7c62501ae0df899dca1e03000000066a0065525365ffffffffd14a9a335e8babddd89b5d0b6a0f41dd6b18848050a0fc48ce32d892e11817fd030000000863acac00535200527ff62cf3ad30d9064e180eaed5e6303950121a8086b5266b55156e4f7612f2c7ebf223e0020000000100ffffffff6273ca3aceb55931160fa7a3064682b4790ee016b4a5c0c0d101fd449dff88ba01000000055351ac526aa3b8223d0421f25b0400000000026552f92db70500000000075253516a656a53c4a908010000000000b5192901000000000652525251516aa148ca38',
    ),
  );
});

test('decode and encode transaction', (t) => {
  const tx =
    '3eb87070042d16f9469b0080a3c1fe8de0feae345200beef8b1e0d7c62501ae0df899dca1e03000000066a0065525365ffffffffd14a9a335e8babddd89b5d0b6a0f41dd6b18848050a0fc48ce32d892e11817fd030000000863acac00535200527ff62cf3ad30d9064e180eaed5e6303950121a8086b5266b55156e4f7612f2c7ebf223e0020000000100ffffffff6273ca3aceb55931160fa7a3064682b4790ee016b4a5c0c0d101fd449dff88ba01000000055351ac526aa3b8223d0421f25b0400000000026552f92db70500000000075253516a656a53c4a908010000000000b5192901000000000652525251516aa148ca38';
  t.deepEqual(
    hexToBin(tx),
    encodeTransactionCommon(
      decodeTransactionCommon(hexToBin(tx)) as TransactionCommon,
    ),
  );
});

test('decodeTransaction: invalid', (t) => {
  t.deepEqual(
    decodeTransactionCommon(hexToBin('00')),
    'Error reading transaction. Error reading Uint32LE: requires 4 bytes. Provided length: 1',
  );
});

test('hashTransaction, hashTransactionUiOrder, hashTransactionP2pOrder', (t) => {
  const tx =
    '3eb87070042d16f9469b0080a3c1fe8de0feae345200beef8b1e0d7c62501ae0df899dca1e03000000066a0065525365ffffffffd14a9a335e8babddd89b5d0b6a0f41dd6b18848050a0fc48ce32d892e11817fd030000000863acac00535200527ff62cf3ad30d9064e180eaed5e6303950121a8086b5266b55156e4f7612f2c7ebf223e0020000000100ffffffff6273ca3aceb55931160fa7a3064682b4790ee016b4a5c0c0d101fd449dff88ba01000000055351ac526aa3b8223d0421f25b0400000000026552f92db70500000000075253516a656a53c4a908010000000000b5192901000000000652525251516aa148ca38';
  const txId =
    '67adfe4f2b374e770584d2d0beb8eacc7b29287a47d2ffe511fa81f48e0ec4fb';
  const halTx =
    '0100000001c997a5e56e104102fa209c6a852dd90660a20b2d9c352423edce25857fcd3704000000004847304402204e45e16932b8af514961a1d3a1a25fdf3f4f7732e9d624c6c61548ab5fb8cd410220181522ec8eca07de4860a4acdd12909d831cc56cbbac4622082221a8768d1d0901ffffffff0200ca9a3b00000000434104ae1a62fe09c5f51b13905f07f06b99a2f7159b2225f374cd378d71302fa28414e7aab37397f554a7df5f142c21c1b7303b8a0626f1baded5c72a704f7e6cd84cac00286bee0000000043410411db93e1dcdb8a016b49840f8c53bc1eb68a382e97b1482ecad7b148a6909a5cb2e0eaddfb84ccf9744464f82e160bfa9b8b64f9d4c03f999b8643f656b412a3ac00000000';
  const halTxId =
    'f4184fc596403b9d638783cf57adfe4c75c605f6356fbc91338530e9831e9e16';

  t.deepEqual(hashTransaction(hexToBin(tx)), txId);
  t.deepEqual(hashTransactionUiOrder(hexToBin(tx)), hexToBin(txId));
  t.deepEqual(hashTransactionUiOrder(hexToBin(tx), sha256), hexToBin(txId));
  t.deepEqual(hashTransactionP2pOrder(hexToBin(tx)), hexToBin(txId).reverse());
  t.deepEqual(
    hashTransactionP2pOrder(hexToBin(tx), sha256),
    hexToBin(txId).reverse(),
  );

  t.deepEqual(hashTransaction(hexToBin(halTx)), halTxId);
  t.deepEqual(hashTransactionUiOrder(hexToBin(halTx)), hexToBin(halTxId));
  t.deepEqual(
    hashTransactionUiOrder(hexToBin(halTx), sha256),
    hexToBin(halTxId),
  );
  t.deepEqual(
    hashTransactionP2pOrder(hexToBin(halTx)),
    hexToBin(halTxId).reverse(),
  );
  t.deepEqual(
    hashTransactionP2pOrder(hexToBin(halTx), sha256),
    hexToBin(halTxId).reverse(),
  );
});

test('CashTokens: token-prefix-valid.json', (t) => {
  Object.values(tokenPrefixValidJson)
    .filter((item) => !Array.isArray(item))
    .forEach((vector, index) => {
      const { prefix: prefixHex, data } = vector as {
        prefix: string;
        data: {
          amount: string;
          category: string;
          nft?: {
            capability: 'minting' | 'mutable' | 'none';
            commitment: string;
          };
        };
      };
      const failMessage = `Failure on test vector #${index}: "${prefixHex}"`;
      const token: NonNullable<Output['token']> = {
        amount: BigInt(data.amount),
        category: hexToBin(data.category),
        ...(data.nft === undefined
          ? {}
          : {
              nft: {
                capability: data.nft.capability,
                commitment: hexToBin(data.nft.commitment),
              },
            }),
      };
      const expectedPrefix = hexToBin(prefixHex);
      t.deepEqual(expectedPrefix, encodeTokenPrefix(token), failMessage);

      const decoded = readTokenPrefix({ bin: expectedPrefix, index: 0 });
      if (typeof decoded === 'string') {
        return t.fail(decoded);
      }
      if (decoded.position.bin.length !== decoded.position.index) {
        return t.fail(
          `${failMessage} Prefix "${prefixHex}" includes unexpected bytes. Bytes remaining after read: ${
            decoded.position.bin.length - decoded.position.index
          }, `,
        );
      }
      return t.deepEqual(decoded.result.token, token);
    });
});

test('CashTokens: token-prefix-invalid.json', (t) => {
  Object.values(tokenPrefixInvalidJson)
    .filter((item) => !Array.isArray(item))
    .forEach((vector, index) => {
      const { prefix: prefixHex, error } = vector as {
        prefix: string;
        error: string;
      };
      const failMessage = `Failure on test vector #${index}: "${prefixHex}"`;
      const expectedPrefix = hexToBin(prefixHex);
      const decoded = readTokenPrefix({ bin: expectedPrefix, index: 0 });
      return t.deepEqual(decoded, error, failMessage);
    });
});
