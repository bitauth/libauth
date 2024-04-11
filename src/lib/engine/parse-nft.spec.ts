import test from 'ava';

import {
  binToHex,
  createVirtualMachineBCH,
  hexToBin,
  NonFungibleTokenCapability,
  parseNft,
} from '../lib.js';

test('parseNft: returns the expected value of altstack', (t) => {
  // Example parsable NFT from https://www.bitcoincashsite.com/blog/token-pioneers-cashtokens-tutorial-4/
  const nft1 = {
    lockingBytecode: hexToBin(''),
    token: {
      amount: BigInt(0),
      category: hexToBin(''),
      nft: {
        capability: NonFungibleTokenCapability.none,
        commitment: hexToBin(
          '30313130313031303131323032333132313231393030313034333030303030',
        ),
      },
    },
    valueSatoshis: BigInt(1000),
  };
  const bytecode =
    '00cf527f780230348763786b587f786b6b67780230378763786b5c7f786b6b67786b587f786b5c7f786b6b7568687575';
  const nft1AltStack: Uint8Array[] = parseNft(nft1, bytecode);
  t.is(binToHex(nft1AltStack[0] ?? new Uint8Array()), '3031');
  t.is(binToHex(nft1AltStack[1] ?? new Uint8Array()), '3130313031303131');
  t.is(
    binToHex(nft1AltStack[2] ?? new Uint8Array()),
    '323032333132313231393030',
  );
  t.is(binToHex(nft1AltStack[3] ?? new Uint8Array()), '313034333030303030');
});

test('parseNft: bottom of altstack contains the commitment if bytecode is 00cf6b', (t) => {
  // Example from bcmr-v2.schema.ts
  const nft2 = {
    lockingBytecode: hexToBin(''),
    token: {
      amount: BigInt(0),
      category: hexToBin(''),
      nft: {
        capability: NonFungibleTokenCapability.none,
        commitment: hexToBin('2021'),
      },
    },
    valueSatoshis: BigInt(1000),
  };
  const bytecode = '00cf6b';
  const nft2AltStack: Uint8Array[] = parseNft(nft2, bytecode);
  t.is(binToHex(nft2AltStack[0] ?? new Uint8Array()), '2021');
});

test('parseNft: works with compatible vm', (t) => {
  // Example from bcmr-v2.schema.ts
  const nft2 = {
    lockingBytecode: hexToBin(''),
    token: {
      amount: BigInt(0),
      category: hexToBin(''),
      nft: {
        capability: NonFungibleTokenCapability.none,
        commitment: hexToBin('2021'),
      },
    },
    valueSatoshis: BigInt(1000),
  };
  const bytecode = '00cf6b';
  const vmCreator = () => createVirtualMachineBCH();
  const nft2AltStack: Uint8Array[] = parseNft(nft2, bytecode, vmCreator);
  t.is(binToHex(nft2AltStack[0] ?? new Uint8Array()), '2021');
});
