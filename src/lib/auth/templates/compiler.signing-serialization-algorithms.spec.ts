/* eslint-disable functional/no-expression-statement, @typescript-eslint/no-magic-numbers */
import test, { Macro } from 'ava';

import {
  AuthenticationProgramStateBCH,
  compilerCreateStateCommon,
  CompilerOperationDataBCH,
  createAuthenticationProgramExternalStateCommonEmpty,
  createCompiler,
  generateBytecodeMap,
  getCompilerOperationsBCH,
  hexToBin,
  instantiateSecp256k1,
  instantiateSha256,
  instantiateVirtualMachineBCH,
  instructionSetBCHCurrentStrict,
  OpcodesBCH,
  stringify
} from '../../lib';

// prettier-ignore
const privkey = new Uint8Array([0xf8, 0x5d, 0x4b, 0xd8, 0xa0, 0x3c, 0xa1, 0x06, 0xc9, 0xde, 0xb4, 0x7b, 0x79, 0x18, 0x03, 0xda, 0xc7, 0xf0, 0x33, 0x38, 0x09, 0xe3, 0xf1, 0xdd, 0x04, 0xd1, 0x82, 0xe0, 0xab, 0xa6, 0xe5, 0x53]);

const sha256Promise = instantiateSha256();
const secp256k1Promise = instantiateSecp256k1();
const vmPromise = instantiateVirtualMachineBCH(instructionSetBCHCurrentStrict);
const signingSerializationType: Macro<[string, string]> = async (
  t,
  unlockScript,
  bytecodeHex
) => {
  const sha256 = await sha256Promise;
  const secp256k1 = await secp256k1Promise;
  const vm = await vmPromise;
  const compiler = createCompiler<
    CompilerOperationDataBCH,
    AuthenticationProgramStateBCH
  >({
    createState: compilerCreateStateCommon,
    opcodes: generateBytecodeMap(OpcodesBCH),
    operations: getCompilerOperationsBCH(),
    scripts: {
      lock:
        'OP_DUP OP_HASH160 <$(<a.public_key> OP_HASH160)> OP_EQUALVERIFY OP_CHECKSIG',
      unlock: unlockScript
    },
    secp256k1,
    sha256,
    variables: {
      a: {
        type: 'Key'
      }
    },
    vm
  });

  const resultLock = compiler.generateBytecode('lock', {
    keys: { privateKeys: { a: privkey } }
  });
  t.deepEqual(resultLock, {
    bytecode: hexToBin('76a91415d16c84669ab46059313bf0747e781f1d13936d88ac'),
    success: true
  });
  // eslint-disable-next-line functional/no-conditional-statement
  if (resultLock.success) {
    const resultUnlock = compiler.generateBytecode('unlock', {
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
  '[BCH compiler] signing serialization algorithms – all_outputs',
  signingSerializationType,
  '<a.signature.all_outputs> <a.public_key>',
  '47304402200bda982d5b1a2a42d4568cf180ea1e4042397b02a77d5039b4b620dbc5ba1141022008f2a4f13ff538221cbf79d676f55fbe0c05617dea57877b648037b8dae939f141210376ea9e36a75d2ecf9c93a0be76885e36f822529db22acfdc761c9b5b4544f5c5'
);

test(
  '[BCH compiler] signing serialization algorithms – all_outputs_single_input',
  signingSerializationType,
  '<a.signature.all_outputs_single_input> <a.public_key>',
  '483045022100b30fb165fa511b6ff3718a4dcc6dd25dd916620e08e207c47a54bae56a3dbd5402202cf24193d51a9cd11be879eb1da063ad22ac30b355855e5c8147bf1e5f2e2cf1c1210376ea9e36a75d2ecf9c93a0be76885e36f822529db22acfdc761c9b5b4544f5c5'
);

test(
  '[BCH compiler] signing serialization algorithms corresponding_output',
  signingSerializationType,
  '<a.signature.corresponding_output> <a.public_key>',
  '483045022100cea4e9fe270b4337c3c0cffdf57b2ccba11245752a860f9ff5c06cd3bfa399d902203ebef34068efe7e9bd2a334f886bc720e975fd4485df9d8b8e0b98e671c1d02243210376ea9e36a75d2ecf9c93a0be76885e36f822529db22acfdc761c9b5b4544f5c5'
);

test(
  '[BCH compiler] signing serialization algorithms corresponding_output_single_input',
  signingSerializationType,
  '<a.signature.corresponding_output_single_input> <a.public_key>',
  '473044022075bdb3381383221ea3073b2cc806b9f63ce0f1c1c5276f72a7b58922df2e69e40220075ec2497b9fa291ab028eed556fdc3591d93c52da80a35410731de40de8a0a6c3210376ea9e36a75d2ecf9c93a0be76885e36f822529db22acfdc761c9b5b4544f5c5'
);

test(
  '[BCH compiler] signing serialization algorithms no_outputs',
  signingSerializationType,
  '<a.signature.no_outputs> <a.public_key>',
  '47304402206e41f758eb74d0b679a5747c50a3e0c361dee4249ccc82ee491c862455a973e802204056bc00f207a7fb8ef3e2e068c09ca0d71f70685c66af7231a2aa0fb3e335f242210376ea9e36a75d2ecf9c93a0be76885e36f822529db22acfdc761c9b5b4544f5c5'
);

test(
  '[BCH compiler] signing serialization algorithms no_outputs_single_input',
  signingSerializationType,
  '<a.signature.no_outputs_single_input> <a.public_key>',
  '483045022100bf73fa9557d725441b35af93ba2ae49e3afe3bd93cbddf9555e179fcc0b52d6f02203d7fb85de9ba6347ac87fe400819455c3a9f1a5c310f4e2dd32c00ae353a1981c2210376ea9e36a75d2ecf9c93a0be76885e36f822529db22acfdc761c9b5b4544f5c5'
);
