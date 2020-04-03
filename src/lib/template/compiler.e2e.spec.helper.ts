/* eslint-disable functional/no-expression-statement, @typescript-eslint/no-magic-numbers */
import { Macro } from 'ava';

import {
  AuthenticationProgramStateBCH,
  BytecodeGenerationResult,
  CompilationData,
  CompilationEnvironment,
  compilerCreateStateCommon,
  CompilerOperationDataBCH,
  createAuthenticationProgramExternalStateCommonEmpty,
  createCompiler,
  generateBytecodeMap,
  getCompilerOperationsBCH,
  instantiateSecp256k1,
  instantiateSha256,
  instantiateVirtualMachineBCH,
  instructionSetBCHCurrentStrict,
  OpcodesBCH,
  stringify,
} from '../lib';

// prettier-ignore
export const privkey = new Uint8Array([0xf8, 0x5d, 0x4b, 0xd8, 0xa0, 0x3c, 0xa1, 0x06, 0xc9, 0xde, 0xb4, 0x7b, 0x79, 0x18, 0x03, 0xda, 0xc7, 0xf0, 0x33, 0x38, 0x09, 0xe3, 0xf1, 0xdd, 0x04, 0xd1, 0x82, 0xe0, 0xab, 0xa6, 0xe5, 0x53]);

const sha256Promise = instantiateSha256();
const secp256k1Promise = instantiateSecp256k1();
const vmPromise = instantiateVirtualMachineBCH(instructionSetBCHCurrentStrict);

/**
 * Uses `createCompiler` rather than `createCompilerBCH` for performance.
 */
export const expectCompilationResult: Macro<[
  string,
  CompilationData<CompilerOperationDataBCH>,
  BytecodeGenerationResult<AuthenticationProgramStateBCH>,
  CompilationEnvironment['variables']?,
  Partial<CompilationEnvironment<CompilerOperationDataBCH>>?
]> = async (
  t,
  testScript,
  otherData,
  expectedResult,
  variables,
  overwrites
  // eslint-disable-next-line max-params
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
      another: '0xabcdef',
      broken: 'does_not_exist',
      test: testScript,
    },
    secp256k1,
    sha256,
    variables,
    vm,
    ...overwrites,
  });

  const resultUnlock = compiler.generateBytecode('test', {
    operationData: {
      ...createAuthenticationProgramExternalStateCommonEmpty(),
      coveredBytecode: Uint8Array.of(),
    },
    ...otherData,
  });
  t.deepEqual(
    resultUnlock,
    expectedResult,
    `– \nResult: ${stringify(resultUnlock)}\n\nExpected:\n ${stringify(
      expectedResult
    )}\n`
  );
};
