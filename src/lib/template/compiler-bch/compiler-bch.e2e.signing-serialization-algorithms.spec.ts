/* eslint-disable functional/no-expression-statement */
import test, { Macro } from 'ava';

import {
  AuthenticationProgramStateBCH,
  BytecodeGenerationResult,
  CompilationEnvironmentBCH,
  compilerOperationsBCH,
  createAuthenticationProgramEvaluationCommon,
  createCompiler,
  createTransactionContextCommonTesting,
  generateBytecodeMap,
  hexToBin,
  instantiateRipemd160,
  instantiateSecp256k1,
  instantiateSha256,
  instantiateSha512,
  instantiateVirtualMachineBCH,
  instructionSetBCHCurrentStrict,
  OpcodesBCH,
  stringify,
  TransactionContextBCH,
} from '../../lib';

import { hdPrivateKey, privkey } from './compiler-bch.e2e.spec.helper';

const ripemd160Promise = instantiateRipemd160();
const sha256Promise = instantiateSha256();
const sha512Promise = instantiateSha512();
const secp256k1Promise = instantiateSecp256k1();
const vmPromise = instantiateVirtualMachineBCH(instructionSetBCHCurrentStrict);

/**
 * Uses `createCompiler` rather than `createCompilerBCH` for performance.
 */
const testSigningSerializationAlgorithms: Macro<[string, string]> = async (
  t,
  unlockScript,
  bytecodeHex
) => {
  const ripemd160 = await ripemd160Promise;
  const sha256 = await sha256Promise;
  const sha512 = await sha512Promise;
  const secp256k1 = await secp256k1Promise;
  const vm = await vmPromise;

  const compiler = createCompiler<
    TransactionContextBCH,
    CompilationEnvironmentBCH,
    OpcodesBCH,
    AuthenticationProgramStateBCH
  >({
    createAuthenticationProgram: createAuthenticationProgramEvaluationCommon,
    entityOwnership: {
      b: 'entity',
    },
    opcodes: generateBytecodeMap(OpcodesBCH),
    operations: compilerOperationsBCH,
    ripemd160,
    scripts: {
      lock:
        'OP_DUP OP_HASH160 <$(<a.public_key> OP_HASH160)> OP_EQUALVERIFY OP_CHECKSIG',
      lockHd:
        'OP_DUP OP_HASH160 <$(<b.public_key> OP_HASH160)> OP_EQUALVERIFY OP_CHECKSIG',
      unlock: unlockScript,
      unlockHd: unlockScript.replace(/a\./gu, 'b.'),
    },
    secp256k1,
    sha256,
    sha512,
    unlockingScripts: {
      unlock: 'lock',
      unlockHd: 'lockHd',
    },
    variables: {
      a: {
        type: 'Key',
      },
      b: {
        privateDerivationPath: 'm/i',
        type: 'HdKey',
      },
    },
    vm,
  });

  const resultUnlock = compiler.generateBytecode('unlock', {
    keys: { privateKeys: { a: privkey } },
    transactionContext: createTransactionContextCommonTesting(),
  });
  t.deepEqual(
    resultUnlock,
    {
      bytecode: hexToBin(bytecodeHex),
      success: true,
    },
    `Expected bytecode:\n ${stringify(bytecodeHex)} \n\nResult: ${stringify(
      resultUnlock
    )}`
  );
  const resultUnlockHd = compiler.generateBytecode('unlockHd', {
    hdKeys: { addressIndex: 0, hdPrivateKeys: { entity: hdPrivateKey } },
    transactionContext: createTransactionContextCommonTesting(),
  });
  t.deepEqual(
    resultUnlockHd,
    {
      bytecode: hexToBin(bytecodeHex),
      success: true,
    },
    `Expected bytecode:\n ${stringify(bytecodeHex)} \n\nResult: ${stringify(
      resultUnlockHd
    )}`
  );
};

test(
  '[BCH compiler] signing serialization algorithms – ECDSA all_outputs',
  testSigningSerializationAlgorithms,
  '<a.signature.all_outputs> <a.public_key>',
  '47304402200bda982d5b1a2a42d4568cf180ea1e4042397b02a77d5039b4b620dbc5ba1141022008f2a4f13ff538221cbf79d676f55fbe0c05617dea57877b648037b8dae939f141210376ea9e36a75d2ecf9c93a0be76885e36f822529db22acfdc761c9b5b4544f5c5'
);

test(
  '[BCH compiler] signing serialization algorithms – ECDSA all_outputs_single_input',
  testSigningSerializationAlgorithms,
  '<a.signature.all_outputs_single_input> <a.public_key>',
  '483045022100b30fb165fa511b6ff3718a4dcc6dd25dd916620e08e207c47a54bae56a3dbd5402202cf24193d51a9cd11be879eb1da063ad22ac30b355855e5c8147bf1e5f2e2cf1c1210376ea9e36a75d2ecf9c93a0be76885e36f822529db22acfdc761c9b5b4544f5c5'
);

test(
  '[BCH compiler] signing serialization algorithms – ECDSA corresponding_output',
  testSigningSerializationAlgorithms,
  '<a.signature.corresponding_output> <a.public_key>',
  '483045022100cea4e9fe270b4337c3c0cffdf57b2ccba11245752a860f9ff5c06cd3bfa399d902203ebef34068efe7e9bd2a334f886bc720e975fd4485df9d8b8e0b98e671c1d02243210376ea9e36a75d2ecf9c93a0be76885e36f822529db22acfdc761c9b5b4544f5c5'
);

test(
  '[BCH compiler] signing serialization algorithms – ECDSA corresponding_output_single_input',
  testSigningSerializationAlgorithms,
  '<a.signature.corresponding_output_single_input> <a.public_key>',
  '473044022075bdb3381383221ea3073b2cc806b9f63ce0f1c1c5276f72a7b58922df2e69e40220075ec2497b9fa291ab028eed556fdc3591d93c52da80a35410731de40de8a0a6c3210376ea9e36a75d2ecf9c93a0be76885e36f822529db22acfdc761c9b5b4544f5c5'
);

test(
  '[BCH compiler] signing serialization algorithms – ECDSA no_outputs',
  testSigningSerializationAlgorithms,
  '<a.signature.no_outputs> <a.public_key>',
  '47304402206e41f758eb74d0b679a5747c50a3e0c361dee4249ccc82ee491c862455a973e802204056bc00f207a7fb8ef3e2e068c09ca0d71f70685c66af7231a2aa0fb3e335f242210376ea9e36a75d2ecf9c93a0be76885e36f822529db22acfdc761c9b5b4544f5c5'
);

test(
  '[BCH compiler] signing serialization algorithms – ECDSA no_outputs_single_input',
  testSigningSerializationAlgorithms,
  '<a.signature.no_outputs_single_input> <a.public_key>',
  '483045022100bf73fa9557d725441b35af93ba2ae49e3afe3bd93cbddf9555e179fcc0b52d6f02203d7fb85de9ba6347ac87fe400819455c3a9f1a5c310f4e2dd32c00ae353a1981c2210376ea9e36a75d2ecf9c93a0be76885e36f822529db22acfdc761c9b5b4544f5c5'
);

test(
  '[BCH compiler] signing serialization algorithms – Schnorr all_outputs',
  testSigningSerializationAlgorithms,
  '<a.schnorr_signature.all_outputs> <a.public_key>',
  '419adccdbb9b0242938a08900238e302c446dcde0415cc3252c2371da1f827090171ed051c9c121030c37caacc81217b979de766b69d04f64c67219c8ebc45fd2541210376ea9e36a75d2ecf9c93a0be76885e36f822529db22acfdc761c9b5b4544f5c5'
);

test(
  '[BCH compiler] signing serialization algorithms – Schnorr all_outputs_single_input',
  testSigningSerializationAlgorithms,
  '<a.schnorr_signature.all_outputs_single_input> <a.public_key>',
  '41a8ffa79bd74f44780b6679cbc177735691d85ea86129909b4943e1541594babafab8433943b71de881d8ac6114da4c6095528d93b77cc570a61102ec6352b2ffc1210376ea9e36a75d2ecf9c93a0be76885e36f822529db22acfdc761c9b5b4544f5c5'
);

test(
  '[BCH compiler] signing serialization algorithms – Schnorr corresponding_output',
  testSigningSerializationAlgorithms,
  '<a.schnorr_signature.corresponding_output> <a.public_key>',
  '4157130313297ff18f71e123522f6e673258aad57b02bc963350fb59490cde160ebb9da2cdef624d6efa447a297a4d46e56b0035012de361b9902565231782aa8f43210376ea9e36a75d2ecf9c93a0be76885e36f822529db22acfdc761c9b5b4544f5c5'
);

test(
  '[BCH compiler] signing serialization algorithms – Schnorr corresponding_output_single_input',
  testSigningSerializationAlgorithms,
  '<a.schnorr_signature.corresponding_output_single_input> <a.public_key>',
  '41476031c21a9fe94b33135f7e7107a532de49956b0abf16a3bd941dad494b5e507274d50d2f2a67d30d2d26b76465be5bcc42a13b61d16e44068c3d1d905ac628c3210376ea9e36a75d2ecf9c93a0be76885e36f822529db22acfdc761c9b5b4544f5c5'
);

test(
  '[BCH compiler] signing serialization algorithms – Schnorr no_outputs',
  testSigningSerializationAlgorithms,
  '<a.schnorr_signature.no_outputs> <a.public_key>',
  '41c3e465fa4b26870a817aeb29ebce6d697fa76c39454b9bd7d85875ca2a742e47660ce169087d0ac90b7ff35b7854efa1dcfe85fcf5080f6754d69585ab45875f42210376ea9e36a75d2ecf9c93a0be76885e36f822529db22acfdc761c9b5b4544f5c5'
);

test(
  '[BCH compiler] signing serialization algorithms – Schnorr no_outputs_single_input',
  testSigningSerializationAlgorithms,
  '<a.schnorr_signature.no_outputs_single_input> <a.public_key>',
  '413c24af0348f4eedba198f146fcfd3a099f67d4b17e690321bd038a3fd0ff8340200ab71722d2dd7fa3a513902c04362ff5ea41e4a7548e7733b377678bddcceac2210376ea9e36a75d2ecf9c93a0be76885e36f822529db22acfdc761c9b5b4544f5c5'
);

test('[BCH compiler] signing serialization algorithms – no signing serialization data', async (t) => {
  const sha256 = await sha256Promise;
  const secp256k1 = await secp256k1Promise;
  const vm = await vmPromise;
  const compiler = createCompiler<
    TransactionContextBCH,
    CompilationEnvironmentBCH,
    OpcodesBCH,
    AuthenticationProgramStateBCH
  >({
    createAuthenticationProgram: createAuthenticationProgramEvaluationCommon,
    opcodes: generateBytecodeMap(OpcodesBCH),
    operations: compilerOperationsBCH,
    scripts: {
      lock:
        'OP_DUP OP_HASH160 <$(<a.public_key> OP_HASH160)> OP_EQUALVERIFY OP_CHECKSIG',
      unlock: '<a.schnorr_signature.all_outputs> <a.public_key>',
    },
    secp256k1,
    sha256,
    unlockingScripts: {
      unlock: 'lock',
    },
    variables: {
      a: {
        type: 'Key',
      },
    },
    vm,
  });

  const resultUnlock = compiler.generateBytecode('unlock', {
    keys: { privateKeys: { a: privkey } },
    transactionContext: undefined,
  });
  t.deepEqual(resultUnlock, {
    errorType: 'resolve',
    errors: [
      {
        error:
          'Cannot resolve "a.schnorr_signature.all_outputs" – the "transactionContext" property was not provided in the compilation data.',
        range: {
          endColumn: 33,
          endLineNumber: 1,
          startColumn: 2,
          startLineNumber: 1,
        },
      },
    ],
    success: false,
  } as BytecodeGenerationResult<AuthenticationProgramStateBCH>);
});
