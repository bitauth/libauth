/* eslint-disable @typescript-eslint/no-magic-numbers, functional/no-expression-statement */
import test from 'ava';

import {
  encodeDataPush,
  hexToBin,
  PushOperationConstants,
  range,
} from '../../../lib';

const prefixDataPushVectors = [
  ['', '00'],
  ['81', '4f'],
  ['01', '51'],
  ['02', '52'],
  ['03', '53'],
  ['04', '54'],
  ['05', '55'],
  ['06', '56'],
  ['07', '57'],
  ['08', '58'],
  ['09', '59'],
  ['0a', '5a'],
  ['0b', '5b'],
  ['0c', '5c'],
  ['0d', '5d'],
  ['0e', '5e'],
  ['0f', '5f'],
  ['10', '60'],
  ['00', '0100'],
  ['0000', '020000'],
  ['80', '0180'],
  ['0081', '020081'],
  ['123456', '03123456'],
  ['123456789012345678901234567890', '0f123456789012345678901234567890'],
];

test('prefixDataPush', (t) => {
  prefixDataPushVectors.map(([inputHex, outputHex]) => {
    t.deepEqual(encodeDataPush(hexToBin(inputHex)), hexToBin(outputHex));
    return undefined;
  });
  t.deepEqual(
    encodeDataPush(
      Uint8Array.from(range(PushOperationConstants.maximumPushData1Size))
    ),
    Uint8Array.from([
      PushOperationConstants.OP_PUSHDATA_1,
      0xff,
      ...range(PushOperationConstants.maximumPushData1Size),
    ])
  );
  t.deepEqual(
    encodeDataPush(
      Uint8Array.from(range(PushOperationConstants.maximumPushData1Size + 1))
    ),
    Uint8Array.from([
      PushOperationConstants.OP_PUSHDATA_2,
      0,
      1,
      ...range(PushOperationConstants.maximumPushData1Size + 1),
    ])
  );
  t.deepEqual(
    encodeDataPush(
      Uint8Array.from(range(PushOperationConstants.maximumPushData2Size))
    ),
    Uint8Array.from([
      PushOperationConstants.OP_PUSHDATA_2,
      0xff,
      0xff,
      ...range(PushOperationConstants.maximumPushData2Size),
    ])
  );
  t.deepEqual(
    encodeDataPush(
      Uint8Array.from(range(PushOperationConstants.maximumPushData2Size + 1))
    ),
    Uint8Array.from([
      PushOperationConstants.OP_PUSHDATA_4,
      0,
      0,
      1,
      0,
      ...range(PushOperationConstants.maximumPushData2Size + 1),
    ])
  );
});
