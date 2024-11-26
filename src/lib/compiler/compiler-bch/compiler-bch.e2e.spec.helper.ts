import test from 'ava';

import type {
  AuthenticationProgramStateBch,
  BytecodeGenerationResult,
  CompilationContextBch,
  CompilationData,
  CompilerConfiguration,
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
  stringifyTestVector,
} from '../../lib.js';

/**
 * `m`
 */
export const hdPrivateKey =
  'xprv9s21ZrQH143K2PfMvkNViFc1fgumGqBew45JD8SxA59Jc5M66n3diqb92JjvaR61zT9P89Grys12kdtV4EFVo6tMwER7U2hcUmZ9VfMYPLC';
/**
 * `M`
 */
export const hdPublicKey =
  'xpub661MyMwAqRbcEsjq2muW5PYkDikFgHuWJGzu1WrZiQgHUsgEeKMtGducsZe1iRsGAGNGDzmWYDM69ya24LMyR7mDhtzqQsc286XEQfM2kkV';

/**
 * HD key at `m/0'`
 */
export const hdPrivateKeyM0H =
  'xprv9uNAm3qC8EoibXd3mwgQ9rxF8XJdfA9V9sF25DpLtYcf1u51Rpf8tfV4n2PdChXM97miXGiJf6UL2SsathXbiVbF6tSgmAVGM3XNb6Yn2EZ';

/**
 * The public key derived from {@link hdPrivateKeyM0H}.
 */
export const hdPublicKeyM0H =
  'xpub68MXAZN5xcN1p1hWsyDQWztygZ984csLX6AcscDxSt9dthQ9yMyPSToYdJ24jCS5jaVMGSiLeGuP2cWvgKKYQsNXyg988XGGQYgk1FjDv4P';

/**
 * `m/0`
 */
export const privateKeyM0 = hexToBin(
  'f85d4bd8a03ca106c9deb47b791803dac7f0333809e3f1dd04d182e0aba6e553',
);

const vm = createVirtualMachineBch();

export const expectCompilationResult = test.macro<
  [
    string,
    CompilationData,
    BytecodeGenerationResult<AuthenticationProgramStateBch>,
    CompilerConfiguration['variables']?,
    Partial<CompilerConfiguration<CompilationContextBch>>?,
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
    const compiler = compilerConfigurationToCompilerBch<
      CompilerConfigurationBch,
      AuthenticationProgramStateBch
    >({
      createAuthenticationProgram: createAuthenticationProgramEvaluationCommon,
      entityOwnership: {
        one: 'ownerEntityOne',
        owner: 'ownerEntityId',
        two: 'ownerEntityTwo',
      },
      opcodes: generateBytecodeMap(OpcodesBch),
      operations: compilerOperationsBch,
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
