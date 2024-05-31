import test from 'ava';

import type {
  AuthenticationProgramStateBch,
  BytecodeGenerationResult,
  CompilerConfigurationBch,
} from '../../lib.js';
import {
  compilerConfigurationToCompilerBch,
  compilerOperationsBch,
  createAuthenticationProgramEvaluationCommon,
  createCompilationContextCommonTesting,
  createVirtualMachineBch,
  generateBytecodeMap,
  hexToBin,
  OpcodesBch,
  ripemd160,
  secp256k1,
  sha256,
  sha512,
  stringify,
} from '../../lib.js';

import { hdPrivateKey, privateKeyM0 } from './compiler-bch.e2e.spec.helper.js';

const vm = createVirtualMachineBch();

const testSigningSerializationAlgorithms = test.macro<[string, string]>(
  (t, unlockScript, bytecodeHex) => {
    const compiler = compilerConfigurationToCompilerBch<
      CompilerConfigurationBch,
      AuthenticationProgramStateBch
    >({
      createAuthenticationProgram: createAuthenticationProgramEvaluationCommon,
      entityOwnership: {
        b: 'entity',
      },
      opcodes: generateBytecodeMap(OpcodesBch),
      operations: compilerOperationsBch,
      ripemd160,
      scripts: {
        lock: 'OP_DUP OP_HASH160 <$(<a.public_key> OP_HASH160)> OP_EQUALVERIFY OP_CHECKSIG',
        lockHd:
          'OP_DUP OP_HASH160 <$(<b.public_key> OP_HASH160)> OP_EQUALVERIFY OP_CHECKSIG',
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

    const resultUnlock = compiler.generateBytecode({
      data: {
        compilationContext: createCompilationContextCommonTesting(),
        keys: { privateKeys: { a: privateKeyM0 } },
      },
      scriptId: 'unlock',
    });
    t.deepEqual(
      resultUnlock,
      {
        bytecode: hexToBin(bytecodeHex),
        success: true,
      },
      `Expected bytecode:\n ${stringify(bytecodeHex)} \n\nResult: ${stringify(
        resultUnlock,
      )}`,
    );
    const resultUnlockHd = compiler.generateBytecode({
      data: {
        compilationContext: createCompilationContextCommonTesting(),
        hdKeys: { addressIndex: 0, hdPrivateKeys: { entity: hdPrivateKey } },
      },
      scriptId: 'unlockHd',
    });
    t.deepEqual(
      resultUnlockHd,
      {
        bytecode: hexToBin(bytecodeHex),
        success: true,
      },
      `Expected bytecode:\n ${stringify(bytecodeHex)} \n\nResult: ${stringify(
        resultUnlockHd,
      )}`,
    );
  },
);

test(
  '[BCH compiler] signing serialization algorithms - ECDSA all_outputs',
  testSigningSerializationAlgorithms,
  '<a.ecdsa_signature.all_outputs> <a.public_key>',
  '483045022100f129fea5cb875fe5f35e3b2cf919aaf2211340cb49de5253db1d0726cf5f3b7c0220747c59400a81473510883199f59a3f957adf0418dff9d1549ed985bf0b66c4af41210376ea9e36a75d2ecf9c93a0be76885e36f822529db22acfdc761c9b5b4544f5c5',
);

test(
  '[BCH compiler] signing serialization algorithms - ECDSA all_outputs_single_input',
  testSigningSerializationAlgorithms,
  '<a.ecdsa_signature.all_outputs_single_input> <a.public_key>',
  '47304402200bae7a74222909fd730299721e1b9b845ddff659416d21ef3b49ec3e2f6085a7022000d7de7820222acac078a757f80bc0849de0bfd33f99578735066853a20a9b62c1210376ea9e36a75d2ecf9c93a0be76885e36f822529db22acfdc761c9b5b4544f5c5',
);

test(
  '[BCH compiler] signing serialization algorithms - ECDSA corresponding_output',
  testSigningSerializationAlgorithms,
  '<a.ecdsa_signature.corresponding_output> <a.public_key>',
  '47304402204d4861ddd785319eeed198dfe58b39504a72669f9790d2e5d73b24c38cd3710d02200217272f27334ccf5526d51a599c55577dd7b7d2195f1fcf6766bf04d55d9b1643210376ea9e36a75d2ecf9c93a0be76885e36f822529db22acfdc761c9b5b4544f5c5',
);

test(
  '[BCH compiler] signing serialization algorithms - ECDSA corresponding_output_single_input',
  testSigningSerializationAlgorithms,
  '<a.ecdsa_signature.corresponding_output_single_input> <a.public_key>',
  '483045022100ee40b9616c0b7a9fca7456581f52c5e8ece708b4192cc4631193accc66b5874402200c2b86872c9aaba0363e5cc224e8e18d989cb7b0cb2d13700d730126de6eb842c3210376ea9e36a75d2ecf9c93a0be76885e36f822529db22acfdc761c9b5b4544f5c5',
);

test(
  '[BCH compiler] signing serialization algorithms - ECDSA no_outputs',
  testSigningSerializationAlgorithms,
  '<a.ecdsa_signature.no_outputs> <a.public_key>',
  '47304402207402dd45907e09b8691ff1deac8699e1fa7c1a7d186021fab7867b1356f35ecc022012db0b990cce2bfc9a9ce12e5dc5d176ec118254d23169c5f7fcd49431e8cfc342210376ea9e36a75d2ecf9c93a0be76885e36f822529db22acfdc761c9b5b4544f5c5',
);

test(
  '[BCH compiler] signing serialization algorithms - ECDSA no_outputs_single_input',
  testSigningSerializationAlgorithms,
  '<a.ecdsa_signature.no_outputs_single_input> <a.public_key>',
  '4730440220046fb453891c53a4d0a6a1df4f04a93977c214af364dc1de5eb6d681d054f11b02207cdef4f66779d5569ec3afceeca2b4cc6eb1f76eaea29034f0b301688f83021bc2210376ea9e36a75d2ecf9c93a0be76885e36f822529db22acfdc761c9b5b4544f5c5',
);

test(
  '[BCH compiler] signing serialization algorithms - Schnorr all_outputs',
  testSigningSerializationAlgorithms,
  '<a.schnorr_signature.all_outputs> <a.public_key>',
  '412000c439d7eb94cb7b501560a2e96fe9eb7d9a4083f0ab84408fb0fab97e51f6ed4d8a4d7aae3bc805afe3aa8b75f6bf74fa102529349c9d0d112d2c34ec9b2b41210376ea9e36a75d2ecf9c93a0be76885e36f822529db22acfdc761c9b5b4544f5c5',
);

test(
  '[BCH compiler] signing serialization algorithms - Schnorr all_outputs_single_input',
  testSigningSerializationAlgorithms,
  '<a.schnorr_signature.all_outputs_single_input> <a.public_key>',
  '417c0b312ffcc4be4d725e4badfef5735cf77027962ab0ac40d1327299d421299be9b04679a86ad296c4ca6cf7797d3ece597ba99ccab9792f8dabafb6cae66dc3c1210376ea9e36a75d2ecf9c93a0be76885e36f822529db22acfdc761c9b5b4544f5c5',
);

test(
  '[BCH compiler] signing serialization algorithms - Schnorr corresponding_output',
  testSigningSerializationAlgorithms,
  '<a.schnorr_signature.corresponding_output> <a.public_key>',
  '410e510e6138c0f865555b103bee209d38d688c7cf7530f05d1ecdfb4bc8e0dcddf64d8b996c8d4b1f60e362e3c49686a6fd69d871774aa147e790b86470389f8c43210376ea9e36a75d2ecf9c93a0be76885e36f822529db22acfdc761c9b5b4544f5c5',
);

test(
  '[BCH compiler] signing serialization algorithms - Schnorr corresponding_output_single_input',
  testSigningSerializationAlgorithms,
  '<a.schnorr_signature.corresponding_output_single_input> <a.public_key>',
  '4177d54e3b26ea81f0dfe49f9eb244af888abc9a7efc36da3087f3c014f0105bbd62a45831b3c786df4aa33593b3d325847cd2c0bbefc2e795cd6bd6f6c04949cfc3210376ea9e36a75d2ecf9c93a0be76885e36f822529db22acfdc761c9b5b4544f5c5',
);

test(
  '[BCH compiler] signing serialization algorithms - Schnorr no_outputs',
  testSigningSerializationAlgorithms,
  '<a.schnorr_signature.no_outputs> <a.public_key>',
  '4174f12e5c9bf9bb1e6c81e7d59b049392e39ddb9f4da5b411e3e6e6d0947ac18cf4a83d99014f297637472d1195a95eb06c3afa2ea70da1c7ff4b6c09bdae270042210376ea9e36a75d2ecf9c93a0be76885e36f822529db22acfdc761c9b5b4544f5c5',
);

test(
  '[BCH compiler] signing serialization algorithms - Schnorr no_outputs_single_input',
  testSigningSerializationAlgorithms,
  '<a.schnorr_signature.no_outputs_single_input> <a.public_key>',
  '41813954aa765ca52b752f65870f4b6026ebdbfb3a49054f42811b6abd2255262ea925d70168a776c04c2993bbaa894391f2acc05e23112853aa74633868bd28f4c2210376ea9e36a75d2ecf9c93a0be76885e36f822529db22acfdc761c9b5b4544f5c5',
);

test('[BCH compiler] signing serialization algorithms - no signing serialization data', (t) => {
  const compiler = compilerConfigurationToCompilerBch<
    CompilerConfigurationBch,
    AuthenticationProgramStateBch
  >({
    createAuthenticationProgram: createAuthenticationProgramEvaluationCommon,
    opcodes: generateBytecodeMap(OpcodesBch),
    operations: compilerOperationsBch,
    scripts: {
      lock: 'OP_DUP OP_HASH160 <$(<a.public_key> OP_HASH160)> OP_EQUALVERIFY OP_CHECKSIG',
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

  const resultUnlock = compiler.generateBytecode({
    data: {
      compilationContext: undefined,
      keys: { privateKeys: { a: privateKeyM0 } },
    },
    scriptId: 'unlock',
  });
  t.deepEqual(resultUnlock, {
    errorType: 'resolve',
    errors: [
      {
        error:
          'Cannot resolve "a.schnorr_signature.all_outputs" - the "compilationContext" property was not provided in the compilation data.',
        range: {
          endColumn: 33,
          endLineNumber: 1,
          startColumn: 2,
          startLineNumber: 1,
        },
      },
    ],
    success: false,
  } as BytecodeGenerationResult<AuthenticationProgramStateBch>);
});
