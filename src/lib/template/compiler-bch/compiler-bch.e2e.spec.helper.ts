/* eslint-disable functional/no-expression-statement, @typescript-eslint/no-magic-numbers */
import { Macro } from 'ava';

import {
  AuthenticationProgramStateBCH,
  BytecodeGenerationResult,
  CompilationData,
  CompilationEnvironment,
  CompilationEnvironmentBCH,
  compilerOperationsBCH,
  createAuthenticationProgramEvaluationCommon,
  createCompiler,
  createTransactionContextCommonTesting,
  generateBytecodeMap,
  instantiateRipemd160,
  instantiateSecp256k1,
  instantiateSha256,
  instantiateSha512,
  instantiateVirtualMachineBCH,
  instructionSetBCHCurrentStrict,
  OpcodesBCH,
  stringifyTestVector,
  TransactionContextBCH,
  TransactionContextCommon,
} from '../../lib';

/**
 * `m`
 */
export const hdPrivateKey =
  'xprv9s21ZrQH143K2PfMvkNViFc1fgumGqBew45JD8SxA59Jc5M66n3diqb92JjvaR61zT9P89Grys12kdtV4EFVo6tMwER7U2hcUmZ9VfMYPLC';
/**
 * `m`
 */
export const hdPublicKey =
  'xpub661MyMwAqRbcEsjq2muW5PYkDikFgHuWJGzu1WrZiQgHUsgEeKMtGducsZe1iRsGAGNGDzmWYDM69ya24LMyR7mDhtzqQsc286XEQfM2kkV';

/**
 * `m/0`
 */
// prettier-ignore
export const privkey = new Uint8Array([0xf8, 0x5d, 0x4b, 0xd8, 0xa0, 0x3c, 0xa1, 0x06, 0xc9, 0xde, 0xb4, 0x7b, 0x79, 0x18, 0x03, 0xda, 0xc7, 0xf0, 0x33, 0x38, 0x09, 0xe3, 0xf1, 0xdd, 0x04, 0xd1, 0x82, 0xe0, 0xab, 0xa6, 0xe5, 0x53]);

const ripemd160Promise = instantiateRipemd160();
const sha256Promise = instantiateSha256();
const sha512Promise = instantiateSha512();
const secp256k1Promise = instantiateSecp256k1();
const vmPromise = instantiateVirtualMachineBCH(instructionSetBCHCurrentStrict);

/**
 * Uses `createCompiler` rather than `createCompilerBCH` for performance.
 */
export const expectCompilationResult: Macro<[
  string,
  CompilationData,
  BytecodeGenerationResult<AuthenticationProgramStateBCH>,
  CompilationEnvironment['variables']?,
  Partial<CompilationEnvironment<TransactionContextCommon>>?
]> = async (
  t,
  testScript,
  otherData,
  expectedResult,
  variables,
  environmentOverrides
  // eslint-disable-next-line max-params
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
      one: 'ownerEntityOne',
      owner: 'ownerEntityId',
      two: 'ownerEntityTwo',
    },
    opcodes: generateBytecodeMap(OpcodesBCH),
    operations: compilerOperationsBCH,
    ripemd160,
    scripts: {
      another: '0xabcdef',
      broken: 'does_not_exist',
      lock: '',
      test: testScript,
    },
    secp256k1,
    sha256,
    sha512,
    unlockingScripts: {
      test: 'lock',
    },
    variables,
    vm,
    ...environmentOverrides,
  });

  const resultUnlock = compiler.generateBytecode('test', {
    transactionContext: createTransactionContextCommonTesting(),
    ...otherData,
  });
  t.deepEqual(
    resultUnlock,
    expectedResult,
    `– \nResult: ${stringifyTestVector(
      resultUnlock
    )}\n\nExpected:\n ${stringifyTestVector(expectedResult)}\n`
  );
};
