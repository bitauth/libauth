/* eslint-disable functional/no-expression-statement */

import test from 'ava';

import {
  deserializeTransaction,
  hexToBin,
  instantiateVirtualMachineBCH,
  Output,
  stringify,
  verifyTransaction,
} from '../lib';

const vmPromise = instantiateVirtualMachineBCH();

test('verifyTransaction', async (t) => {
  const vm = await vmPromise;

  const transaction = deserializeTransaction(
    hexToBin(
      '0200000001600a1b6b0563bbd5b9bef124ff634600df774559da6c51e34a6b97a178be233401000000fc0047304402205e7d56c4e7854f9c672977d6606dd2f0af5494b8e61108e2a92fc920bf8049fc022065262675b0e1a3850d88bd3c56e0eb5fb463d9cdbe49f2f625da5c0f82c765304147304402200d167d5ed77fa169346d295f6fb742e80ae391f0ae086d42b99152bdb23edf4102202c8b85c2583b07b66485b88cacdd14f680bd3aa3f3f12e9f63bc02b4d1cc6d15414c6952210349c17cce8a460f013fdcd286f90f7b0330101d0f3ab4ced44a5a3db764e465882102a438b1662aec9c35f85794600e1d2d3683a43cbb66307cf825fc4486b84695452103d9fffac162e9e15aecbe4f937b951815ccb4f940c850fff9ee52fa70805ae7de53ae000000000100000000000000000d6a0b68656c6c6f20776f726c6400000000'
    )
  );

  const spentOutputs: Output[] = [
    {
      lockingBytecode: hexToBin(
        'a9147ff682419764f7d0e6df75884c28334b9729864387'
      ),
      satoshis: 10000,
    },
  ];

  const result = verifyTransaction({ spentOutputs, transaction, vm });

  t.deepEqual(result, true, stringify(result));
});
