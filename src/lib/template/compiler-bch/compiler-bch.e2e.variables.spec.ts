/* eslint-disable functional/no-expression-statement, @typescript-eslint/no-magic-numbers */
import test from 'ava';

import {
  AuthenticationProgramStateBCH,
  BytecodeGenerationResult,
  hexToBin,
} from '../../lib';

import { expectCompilationResult } from './compiler-bch.e2e.spec.helper';

test(
  '[BCH compiler] variables – AddressData',
  expectCompilationResult,
  '<data>',
  {
    bytecode: {
      data: Uint8Array.from([0xab, 0xcd]),
    },
  },
  { bytecode: hexToBin('02abcd'), success: true },
  {
    data: {
      description: 'the description',
      name: 'Data',
      type: 'AddressData',
    },
  }
);

test(
  '[BCH compiler] variables – multiple AddressData',
  expectCompilationResult,
  '<one> <two>',
  {
    bytecode: {
      one: Uint8Array.from([0xab, 0xcd]),
      two: Uint8Array.from([0xef, 0xab]),
    },
  },
  { bytecode: hexToBin('02abcd02efab'), success: true },
  {
    one: {
      description: 'no name',
      type: 'AddressData',
    },
    two: {
      name: 'no description',
      type: 'AddressData',
    },
  }
);

test(
  '[BCH compiler] variables – missing AddressData',
  expectCompilationResult,
  '<one> <two>',
  {},
  {
    errorType: 'resolve',
    errors: [
      {
        error:
          'Cannot resolve "one" – the "bytecode" property was not provided in the compilation data.',
        range: {
          endColumn: 5,
          endLineNumber: 1,
          startColumn: 2,
          startLineNumber: 1,
        },
      },
      {
        error:
          'Cannot resolve "two" – the "bytecode" property was not provided in the compilation data.',
        range: {
          endColumn: 11,
          endLineNumber: 1,
          startColumn: 8,
          startLineNumber: 1,
        },
      },
    ],
    success: false,
  } as BytecodeGenerationResult<AuthenticationProgramStateBCH>,
  {
    one: { type: 'AddressData' },
    two: { type: 'AddressData' },
  }
);

test(
  '[BCH compiler] variables – incomplete bytecode',
  expectCompilationResult,
  '<one> <two>',
  {
    bytecode: {},
  },
  {
    errorType: 'resolve',
    errors: [
      {
        error:
          'Identifier "one" refers to an AddressData, but "one" was not provided in the CompilationData "bytecode".',
        missingIdentifier: 'one',
        owningEntity: 'ownerEntityOne',
        range: {
          endColumn: 5,
          endLineNumber: 1,
          startColumn: 2,
          startLineNumber: 1,
        },
      },
      {
        error:
          'Identifier "two" refers to an AddressData, but "two" was not provided in the CompilationData "bytecode".',
        missingIdentifier: 'two',
        owningEntity: 'ownerEntityTwo',
        range: {
          endColumn: 11,
          endLineNumber: 1,
          startColumn: 8,
          startLineNumber: 1,
        },
      },
    ],
    success: false,
  } as BytecodeGenerationResult<AuthenticationProgramStateBCH>,
  {
    one: { type: 'AddressData' },
    two: { type: 'AddressData' },
  }
);

test(
  '[BCH compiler] variables – WalletData',
  expectCompilationResult,
  '<data>',
  {
    bytecode: {
      data: Uint8Array.from([0xab, 0xcd]),
    },
  },
  { bytecode: hexToBin('02abcd'), success: true },
  {
    data: {
      description: 'the description',
      name: 'Data',
      type: 'WalletData',
    },
  }
);

test(
  '[BCH compiler] variables – multiple WalletData',
  expectCompilationResult,
  '<one> <two>',
  {
    bytecode: {
      one: Uint8Array.from([0xab, 0xcd]),
      two: Uint8Array.from([0xef, 0xab]),
    },
  },
  { bytecode: hexToBin('02abcd02efab'), success: true },
  {
    one: {
      description: 'no name',
      type: 'WalletData',
    },
    two: {
      name: 'no description',
      type: 'WalletData',
    },
  }
);

test(
  '[BCH compiler] variables – missing WalletData',
  expectCompilationResult,
  '<one> <two>',
  {},
  {
    errorType: 'resolve',
    errors: [
      {
        error:
          'Cannot resolve "one" – the "bytecode" property was not provided in the compilation data.',
        range: {
          endColumn: 5,
          endLineNumber: 1,
          startColumn: 2,
          startLineNumber: 1,
        },
      },
      {
        error:
          'Cannot resolve "two" – the "bytecode" property was not provided in the compilation data.',
        range: {
          endColumn: 11,
          endLineNumber: 1,
          startColumn: 8,
          startLineNumber: 1,
        },
      },
    ],
    success: false,
  } as BytecodeGenerationResult<AuthenticationProgramStateBCH>,
  {
    one: { type: 'WalletData' },
    two: { type: 'WalletData' },
  }
);

test(
  '[BCH compiler] variables – incomplete WalletData',
  expectCompilationResult,
  '<one> <two>',
  {
    bytecode: {},
  },
  {
    errorType: 'resolve',
    errors: [
      {
        error:
          'Identifier "one" refers to a WalletData, but "one" was not provided in the CompilationData "bytecode".',
        missingIdentifier: 'one',
        owningEntity: 'ownerEntityOne',
        range: {
          endColumn: 5,
          endLineNumber: 1,
          startColumn: 2,
          startLineNumber: 1,
        },
      },
      {
        error:
          'Identifier "two" refers to a WalletData, but "two" was not provided in the CompilationData "bytecode".',
        missingIdentifier: 'two',
        owningEntity: 'ownerEntityTwo',
        range: {
          endColumn: 11,
          endLineNumber: 1,
          startColumn: 8,
          startLineNumber: 1,
        },
      },
    ],
    success: false,
  } as BytecodeGenerationResult<AuthenticationProgramStateBCH>,
  {
    one: { type: 'WalletData' },
    two: { type: 'WalletData' },
  }
);

test(
  '[BCH compiler] variables – missing operation: currentBlockHeight',
  expectCompilationResult,
  '<current_block_height>',
  {},
  {
    errorType: 'resolve',
    errors: [
      {
        error:
          'The "current_block_height" variable type can not be resolved because the "currentBlockHeight" operation has not been included in this compiler\'s CompilationEnvironment.',
        range: {
          endColumn: 22,
          endLineNumber: 1,
          startColumn: 2,
          startLineNumber: 1,
        },
      },
    ],
    success: false,
  } as BytecodeGenerationResult<AuthenticationProgramStateBCH>,
  {},
  { operations: undefined }
);

test(
  '[BCH compiler] variables – missing operation: currentBlockTime',
  expectCompilationResult,
  '<current_block_time>',
  {},
  {
    errorType: 'resolve',
    errors: [
      {
        error:
          'The "current_block_time" variable type can not be resolved because the "currentBlockTime" operation has not been included in this compiler\'s CompilationEnvironment.',
        range: {
          endColumn: 20,
          endLineNumber: 1,
          startColumn: 2,
          startLineNumber: 1,
        },
      },
    ],
    success: false,
  } as BytecodeGenerationResult<AuthenticationProgramStateBCH>,
  {},
  { operations: undefined }
);

test(
  '[BCH compiler] variables – missing operation: signingSerialization',
  expectCompilationResult,
  '<signing_serialization.version>',
  {},
  {
    errorType: 'resolve',
    errors: [
      {
        error:
          'The "signing_serialization" variable type can not be resolved because the "signingSerialization" operation has not been included in this compiler\'s CompilationEnvironment.',
        range: {
          endColumn: 31,
          endLineNumber: 1,
          startColumn: 2,
          startLineNumber: 1,
        },
      },
    ],
    success: false,
  } as BytecodeGenerationResult<AuthenticationProgramStateBCH>,
  {},
  { operations: undefined }
);

test(
  '[BCH compiler] variables – missing operation: addressData',
  expectCompilationResult,
  '<a>',
  {},
  {
    errorType: 'resolve',
    errors: [
      {
        error:
          'The "a" variable type can not be resolved because the "addressData" operation has not been included in this compiler\'s CompilationEnvironment.',
        range: {
          endColumn: 3,
          endLineNumber: 1,
          startColumn: 2,
          startLineNumber: 1,
        },
      },
    ],
    success: false,
  } as BytecodeGenerationResult<AuthenticationProgramStateBCH>,
  {
    a: { type: 'AddressData' },
  },
  { operations: undefined }
);

test(
  '[BCH compiler] variables – missing operation: hdKey',
  expectCompilationResult,
  '<a>',
  {},
  {
    errorType: 'resolve',
    errors: [
      {
        error:
          'The "a" variable type can not be resolved because the "hdKey" operation has not been included in this compiler\'s CompilationEnvironment.',
        range: {
          endColumn: 3,
          endLineNumber: 1,
          startColumn: 2,
          startLineNumber: 1,
        },
      },
    ],
    success: false,
  } as BytecodeGenerationResult<AuthenticationProgramStateBCH>,
  {
    a: { type: 'HdKey' },
  },
  { operations: undefined }
);

test(
  '[BCH compiler] variables – missing operation: key',
  expectCompilationResult,
  '<a>',
  {},
  {
    errorType: 'resolve',
    errors: [
      {
        error:
          'The "a" variable type can not be resolved because the "key" operation has not been included in this compiler\'s CompilationEnvironment.',
        range: {
          endColumn: 3,
          endLineNumber: 1,
          startColumn: 2,
          startLineNumber: 1,
        },
      },
    ],
    success: false,
  } as BytecodeGenerationResult<AuthenticationProgramStateBCH>,
  {
    a: { type: 'Key' },
  },
  { operations: undefined }
);

test(
  '[BCH compiler] variables – missing operation: walletData',
  expectCompilationResult,
  '<a>',
  {},
  {
    errorType: 'resolve',
    errors: [
      {
        error:
          'The "a" variable type can not be resolved because the "walletData" operation has not been included in this compiler\'s CompilationEnvironment.',
        range: {
          endColumn: 3,
          endLineNumber: 1,
          startColumn: 2,
          startLineNumber: 1,
        },
      },
    ],
    success: false,
  } as BytecodeGenerationResult<AuthenticationProgramStateBCH>,
  {
    a: { type: 'WalletData' },
  },
  { operations: undefined }
);
