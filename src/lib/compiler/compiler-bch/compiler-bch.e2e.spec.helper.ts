/* eslint-disable @typescript-eslint/no-magic-numbers */
import test from 'ava';

import type {
  AuthenticationProgramStateBCH,
  BytecodeGenerationResult,
  CompilationContextBCH,
  CompilationData,
  CompilerConfiguration,
  CompilerConfigurationBCH,
} from '../../lib.js';
import {
  compilerConfigurationToCompilerBCH,
  compilerOperationsBCH,
  createAuthenticationProgramEvaluationCommon,
  createCompilationContextCommonTesting,
  createVirtualMachineBCH,
  generateBytecodeMap,
  OpcodesBCH2022,
  ripemd160,
  secp256k1,
  sha256,
  sha512,
  stringifyTestVector,
} from '../../lib.js';

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

const vm = createVirtualMachineBCH();

/**
 * Uses `createCompiler` rather than `createCompilerBCH` for performance.
 */
export const expectCompilationResult = test.macro<
  [
    string,
    CompilationData,
    BytecodeGenerationResult<AuthenticationProgramStateBCH>,
    CompilerConfiguration['variables']?,
    Partial<CompilerConfiguration<CompilationContextBCH>>?,
  ]
>(
  (
    t,
    testScript,
    otherData,
    expectedResult,
    variables,
    configurationOverrides,
    // eslint-disable-next-line @typescript-eslint/max-params
  ) => {
    const compiler = compilerConfigurationToCompilerBCH<
      CompilerConfigurationBCH,
      AuthenticationProgramStateBCH
    >({
      createAuthenticationProgram: createAuthenticationProgramEvaluationCommon,
      entityOwnership: {
        one: 'ownerEntityOne',
        owner: 'ownerEntityId',
        two: 'ownerEntityTwo',
      },
      opcodes: generateBytecodeMap(OpcodesBCH2022),
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
      ...configurationOverrides,
    });

    const resultUnlock = compiler.generateBytecode({
      data: {
        compilationContext: createCompilationContextCommonTesting(),
        ...otherData,
      },
      scriptId: 'test',
    });
    return t.deepEqual(
      resultUnlock,
      expectedResult,
      `- \nResult: ${stringifyTestVector(
        resultUnlock,
      )}\n\nExpected:\n ${stringifyTestVector(expectedResult)}\n`,
    );
  },
);
