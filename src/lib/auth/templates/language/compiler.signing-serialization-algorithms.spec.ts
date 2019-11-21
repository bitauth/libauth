// tslint:disable:no-expression-statement no-magic-numbers max-file-line-count
import test, { Macro } from 'ava';

import { hexToBin, stringify } from '../../../utils/utils';
import { createAuthenticationProgramExternalStateCommonEmpty } from '../../auth';

import { createCompilerBCH } from './compiler';

// prettier-ignore
const privkey = new Uint8Array([0xf8, 0x5d, 0x4b, 0xd8, 0xa0, 0x3c, 0xa1, 0x06, 0xc9, 0xde, 0xb4, 0x7b, 0x79, 0x18, 0x03, 0xda, 0xc7, 0xf0, 0x33, 0x38, 0x09, 0xe3, 0xf1, 0xdd, 0x04, 0xd1, 0x82, 0xe0, 0xab, 0xa6, 0xe5, 0x53]);

const signingSerializationType: Macro<[string, string]> = async (
  t,
  unlockScript,
  bytecodeHex
) => {
  const compiler = await createCompilerBCH({
    scripts: {
      lock:
        'OP_DUP OP_HASH160 <$(<a.public_key> OP_HASH160)> OP_EQUALVERIFY OP_CHECKSIG',
      unlock: unlockScript
    },
    variables: {
      a: {
        type: 'Key'
      }
    }
  });
  const resultLock = compiler.generate('lock', {
    keys: { privateKeys: { a: privkey } }
  });
  t.deepEqual(resultLock, {
    bytecode: hexToBin('76a91415d16c84669ab46059313bf0747e781f1d13936d88ac'),
    success: true
  });
  // tslint:disable-next-line: no-if-statement
  if (resultLock.success) {
    const resultUnlock = compiler.generate('unlock', {
      keys: { privateKeys: { a: privkey } },
      operationData: {
        ...createAuthenticationProgramExternalStateCommonEmpty(),
        coveredBytecode: resultLock.bytecode
      }
    });
    t.log(stringify(resultUnlock));
    t.deepEqual(resultUnlock, {
      bytecode: hexToBin(bytecodeHex),
      success: true
    });
  }
};

test(
  'BCH compiler: signing serialization algorithms – all_outputs',
  signingSerializationType,
  '<a.signature.all_outputs> <a.public_key>',
  '47304402206aa4183e0d831a01d2d22174cd4434c5dcb4d58d1c079e2f36ed0f09c6265eba022075024ac787395a32f1886d92a033319a15813c4eb93c2e38a60884760c5dad4741210376ea9e36a75d2ecf9c93a0be76885e36f822529db22acfdc761c9b5b4544f5c5'
);

test(
  'BCH compiler: signing serialization algorithms – all_outputs_single_input',
  signingSerializationType,
  '<a.signature.all_outputs_single_input> <a.public_key>',
  '473044022044558c7b56ce9c1828893c125a9fc7dbda8754d3ebee03fa677037e0583502c3022025cea82fe5cedb5021a9c305fc7f550e644f2efe2e33a73ca28844ba2b047502c1210376ea9e36a75d2ecf9c93a0be76885e36f822529db22acfdc761c9b5b4544f5c5'
);

test(
  'BCH compiler: signing serialization algorithms corresponding_output',
  signingSerializationType,
  '<a.signature.corresponding_output> <a.public_key>',
  '4730440220416ef55f114fd52fb905e628736561e8e625875cdf08d4176e630fe934a35e5e02207010aadd53b4d6eb208817405eb1cb2d7c7268401a81b42abfb436a1e9a6541643210376ea9e36a75d2ecf9c93a0be76885e36f822529db22acfdc761c9b5b4544f5c5'
);

test(
  'BCH compiler: signing serialization algorithms corresponding_output_single_input',
  signingSerializationType,
  '<a.signature.corresponding_output_single_input> <a.public_key>',
  '473044022059dc37d1a00db22d7f7342f391eda79e483b88490f94d5f84c384b362486f8c902204739d184eb80bc32619baad91cc218c28fbe4c03af79a418d1681b7ef91ea270c3210376ea9e36a75d2ecf9c93a0be76885e36f822529db22acfdc761c9b5b4544f5c5'
);

test(
  'BCH compiler: signing serialization algorithms no_outputs',
  signingSerializationType,
  '<a.signature.no_outputs> <a.public_key>',
  '47304402207fc82c00f63d5435747180e7feed1e34669476607a120c3abb566c2a5478e47802201c979bd0ad6550d20953d8970b4a7ebfdab99709f1c0ba9cfafc3445f474bc0f42210376ea9e36a75d2ecf9c93a0be76885e36f822529db22acfdc761c9b5b4544f5c5'
);

test(
  'BCH compiler: signing serialization algorithms no_outputs_single_input',
  signingSerializationType,
  '<a.signature.no_outputs_single_input> <a.public_key>',
  '483045022100bf73fa9557d725441b35af93ba2ae49e3afe3bd93cbddf9555e179fcc0b52d6f02203d7fb85de9ba6347ac87fe400819455c3a9f1a5c310f4e2dd32c00ae353a1981c2210376ea9e36a75d2ecf9c93a0be76885e36f822529db22acfdc761c9b5b4544f5c5'
);
