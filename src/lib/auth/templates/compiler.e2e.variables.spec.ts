/* eslint-disable functional/no-expression-statement, @typescript-eslint/no-magic-numbers */
import test from 'ava';

import {
  AuthenticationProgramStateBCH,
  BytecodeGenerationResult,
  hexToBin,
} from '../../lib';

import { expectCompilationResult } from './compiler.e2e.spec.helper';

test(
  '[BCH compiler] variables – AddressData',
  expectCompilationResult,
  '<data>',
  {
    addressData: {
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
    addressData: {
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
  '[BCH compiler] variables – missing addressData',
  expectCompilationResult,
  '<one> <two>',
  {},
  {
    errorType: 'resolve',
    errors: [
      {
        error:
          'Identifier "one" is an "AddressData", but the compilation data does not include an "addressData" property.',
        range: {
          endColumn: 5,
          endLineNumber: 1,
          startColumn: 2,
          startLineNumber: 1,
        },
      },
      {
        error:
          'Identifier "two" is an "AddressData", but the compilation data does not include an "addressData" property.',
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
  '[BCH compiler] variables – incomplete addressData',
  expectCompilationResult,
  '<one> <two>',
  {
    addressData: {},
  },
  {
    errorType: 'resolve',
    errors: [
      {
        error:
          'Identifier "one" refers to an "AddressData", but "one" was not provided in the compilation data "addressData".',
        range: {
          endColumn: 5,
          endLineNumber: 1,
          startColumn: 2,
          startLineNumber: 1,
        },
      },
      {
        error:
          'Identifier "two" refers to an "AddressData", but "two" was not provided in the compilation data "addressData".',
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
    walletData: {
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
    walletData: {
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
  '[BCH compiler] variables – missing walletData',
  expectCompilationResult,
  '<one> <two>',
  {},
  {
    errorType: 'resolve',
    errors: [
      {
        error:
          'Identifier "one" is a "WalletData", but the compilation data does not include a "walletData" property.',
        range: {
          endColumn: 5,
          endLineNumber: 1,
          startColumn: 2,
          startLineNumber: 1,
        },
      },
      {
        error:
          'Identifier "two" is a "WalletData", but the compilation data does not include a "walletData" property.',
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
  '[BCH compiler] variables – incomplete walletData',
  expectCompilationResult,
  '<one> <two>',
  {
    addressData: {},
  },
  {
    errorType: 'resolve',
    errors: [
      {
        error:
          'Identifier "one" is a "WalletData", but the compilation data does not include a "walletData" property.',
        range: {
          endColumn: 5,
          endLineNumber: 1,
          startColumn: 2,
          startLineNumber: 1,
        },
      },
      {
        error:
          'Identifier "two" is a "WalletData", but the compilation data does not include a "walletData" property.',
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
