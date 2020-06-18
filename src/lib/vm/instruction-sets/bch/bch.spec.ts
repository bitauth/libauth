/* eslint-disable functional/no-expression-statement, @typescript-eslint/no-magic-numbers */

import test from 'ava';

import {
  AuthenticationProgramStateBCH,
  createAuthenticationProgramStateCommonEmpty,
  createTestAuthenticationProgramBCH,
  hexToBin,
  instantiateSha256,
  instantiateVirtualMachineBCH,
  OpcodesBCH,
  parseBytecode,
} from '../../../lib';

test('[BCH VM] vm.stateEvaluate: OP_2 OP_2 OP_ADD', async (t) => {
  const vm = await instantiateVirtualMachineBCH();
  const state = createAuthenticationProgramStateCommonEmpty({
    instructions: parseBytecode(
      Uint8Array.from([OpcodesBCH.OP_2, OpcodesBCH.OP_2, OpcodesBCH.OP_ADD])
    ),
  }) as AuthenticationProgramStateBCH;
  const result = vm.stateEvaluate(state);
  t.deepEqual(result, {
    alternateStack: [],
    correspondingOutput: Uint8Array.of(0),
    executionStack: [],
    instructions: [
      {
        opcode: 82,
      },
      {
        opcode: 82,
      },
      {
        opcode: 147,
      },
    ],
    ip: 3,
    lastCodeSeparator: -1,
    locktime: 0,
    operationCount: 1,
    outpointIndex: 0,
    outpointTransactionHash: hexToBin(
      '0000000000000000000000000000000000000000000000000000000000000000'
    ),
    outputValue: hexToBin('0000000000000000'),
    sequenceNumber: 0,
    signatureOperationsCount: 0,
    signedMessages: [],
    stack: [Uint8Array.of(0x04)],
    transactionOutpoints: Uint8Array.of(0),
    transactionOutputs: Uint8Array.of(0),
    transactionSequenceNumbers: Uint8Array.of(0),
    version: 0,
  });
});

test('[BCH VM] vm.stateDebug: OP_2 OP_2 OP_ADD', async (t) => {
  const vm = await instantiateVirtualMachineBCH();
  const state = createAuthenticationProgramStateCommonEmpty({
    instructions: parseBytecode(
      Uint8Array.from([OpcodesBCH.OP_2, OpcodesBCH.OP_2, OpcodesBCH.OP_ADD])
    ),
  }) as AuthenticationProgramStateBCH;
  const result = vm.stateDebug(state);
  t.deepEqual(result, [
    {
      alternateStack: [],
      correspondingOutput: Uint8Array.of(0),
      executionStack: [],
      instructions: [
        {
          opcode: 82,
        },
        {
          opcode: 82,
        },
        {
          opcode: 147,
        },
      ],
      ip: 0,
      lastCodeSeparator: -1,
      locktime: 0,
      operationCount: 0,
      outpointIndex: 0,
      outpointTransactionHash: hexToBin(
        '0000000000000000000000000000000000000000000000000000000000000000'
      ),
      outputValue: hexToBin('0000000000000000'),
      sequenceNumber: 0,
      signatureOperationsCount: 0,
      signedMessages: [],
      stack: [],
      transactionOutpoints: Uint8Array.of(0),
      transactionOutputs: Uint8Array.of(0),
      transactionSequenceNumbers: Uint8Array.of(0),
      version: 0,
    },
    {
      alternateStack: [],
      correspondingOutput: Uint8Array.of(0),
      executionStack: [],
      instructions: [
        {
          opcode: 82,
        },
        {
          opcode: 82,
        },
        {
          opcode: 147,
        },
      ],
      ip: 1,
      lastCodeSeparator: -1,
      locktime: 0,
      operationCount: 0,
      outpointIndex: 0,
      outpointTransactionHash: hexToBin(
        '0000000000000000000000000000000000000000000000000000000000000000'
      ),
      outputValue: hexToBin('0000000000000000'),
      sequenceNumber: 0,
      signatureOperationsCount: 0,
      signedMessages: [],
      stack: [Uint8Array.of(0x02)],
      transactionOutpoints: Uint8Array.of(0),
      transactionOutputs: Uint8Array.of(0),
      transactionSequenceNumbers: Uint8Array.of(0),
      version: 0,
    },
    {
      alternateStack: [],
      correspondingOutput: Uint8Array.of(0),
      executionStack: [],
      instructions: [
        {
          opcode: 82,
        },
        {
          opcode: 82,
        },
        {
          opcode: 147,
        },
      ],
      ip: 2,
      lastCodeSeparator: -1,
      locktime: 0,
      operationCount: 0,
      outpointIndex: 0,
      outpointTransactionHash: hexToBin(
        '0000000000000000000000000000000000000000000000000000000000000000'
      ),
      outputValue: hexToBin('0000000000000000'),
      sequenceNumber: 0,
      signatureOperationsCount: 0,
      signedMessages: [],
      stack: [Uint8Array.of(0x02), Uint8Array.of(0x02)],
      transactionOutpoints: Uint8Array.of(0),
      transactionOutputs: Uint8Array.of(0),
      transactionSequenceNumbers: Uint8Array.of(0),
      version: 0,
    },
    {
      alternateStack: [],
      correspondingOutput: Uint8Array.of(0),
      executionStack: [],
      instructions: [
        {
          opcode: 82,
        },
        {
          opcode: 82,
        },
        {
          opcode: 147,
        },
      ],
      ip: 3,
      lastCodeSeparator: -1,
      locktime: 0,
      operationCount: 1,
      outpointIndex: 0,
      outpointTransactionHash: hexToBin(
        '0000000000000000000000000000000000000000000000000000000000000000'
      ),
      outputValue: hexToBin('0000000000000000'),
      sequenceNumber: 0,
      signatureOperationsCount: 0,
      signedMessages: [],
      stack: [Uint8Array.of(0x04)],
      transactionOutpoints: Uint8Array.of(0),
      transactionOutputs: Uint8Array.of(0),
      transactionSequenceNumbers: Uint8Array.of(0),
      version: 0,
    },
  ]);
});

test('[BCH VM] vm.stateStep through: OP_2 OP_2 OP_ADD', async (t) => {
  const vm = await instantiateVirtualMachineBCH();
  const state0 = createAuthenticationProgramStateCommonEmpty({
    instructions: parseBytecode(
      Uint8Array.from([OpcodesBCH.OP_2, OpcodesBCH.OP_2, OpcodesBCH.OP_ADD])
    ),
  }) as AuthenticationProgramStateBCH;
  const state1 = vm.stateStep(state0);
  const state2 = vm.stateStep(state1);
  t.deepEqual(vm.stateContinue(state2), true);
  const state3 = vm.stateStep(state2);
  t.deepEqual(vm.stateContinue(state3), false);

  t.deepEqual(state0, {
    alternateStack: [],
    correspondingOutput: Uint8Array.of(0),
    executionStack: [],
    instructions: [
      {
        opcode: 82,
      },
      {
        opcode: 82,
      },
      {
        opcode: 147,
      },
    ],
    ip: 0,
    lastCodeSeparator: -1,
    locktime: 0,
    operationCount: 0,
    outpointIndex: 0,
    outpointTransactionHash: hexToBin(
      '0000000000000000000000000000000000000000000000000000000000000000'
    ),
    outputValue: hexToBin('0000000000000000'),
    sequenceNumber: 0,
    signatureOperationsCount: 0,
    signedMessages: [],
    stack: [],
    transactionOutpoints: Uint8Array.of(0),
    transactionOutputs: Uint8Array.of(0),
    transactionSequenceNumbers: Uint8Array.of(0),
    version: 0,
  });
  t.deepEqual(state1, {
    alternateStack: [],
    correspondingOutput: Uint8Array.of(0),
    executionStack: [],
    instructions: [
      {
        opcode: 82,
      },
      {
        opcode: 82,
      },
      {
        opcode: 147,
      },
    ],
    ip: 1,
    lastCodeSeparator: -1,
    locktime: 0,
    operationCount: 0,
    outpointIndex: 0,
    outpointTransactionHash: hexToBin(
      '0000000000000000000000000000000000000000000000000000000000000000'
    ),
    outputValue: hexToBin('0000000000000000'),
    sequenceNumber: 0,
    signatureOperationsCount: 0,
    signedMessages: [],
    stack: [Uint8Array.of(0x02)],
    transactionOutpoints: Uint8Array.of(0),
    transactionOutputs: Uint8Array.of(0),
    transactionSequenceNumbers: Uint8Array.of(0),
    version: 0,
  });
  t.deepEqual(state2, {
    alternateStack: [],
    correspondingOutput: Uint8Array.of(0),
    executionStack: [],
    instructions: [
      {
        opcode: 82,
      },
      {
        opcode: 82,
      },
      {
        opcode: 147,
      },
    ],
    ip: 2,
    lastCodeSeparator: -1,
    locktime: 0,
    operationCount: 0,
    outpointIndex: 0,
    outpointTransactionHash: hexToBin(
      '0000000000000000000000000000000000000000000000000000000000000000'
    ),
    outputValue: hexToBin('0000000000000000'),
    sequenceNumber: 0,
    signatureOperationsCount: 0,
    signedMessages: [],
    stack: [Uint8Array.of(0x02), Uint8Array.of(0x02)],
    transactionOutpoints: Uint8Array.of(0),
    transactionOutputs: Uint8Array.of(0),
    transactionSequenceNumbers: Uint8Array.of(0),
    version: 0,
  });
  t.deepEqual(state3, {
    alternateStack: [],
    correspondingOutput: Uint8Array.of(0),
    executionStack: [],
    instructions: [
      {
        opcode: 82,
      },
      {
        opcode: 82,
      },
      {
        opcode: 147,
      },
    ],
    ip: 3,
    lastCodeSeparator: -1,
    locktime: 0,
    operationCount: 1,
    outpointIndex: 0,
    outpointTransactionHash: hexToBin(
      '0000000000000000000000000000000000000000000000000000000000000000'
    ),
    outputValue: hexToBin('0000000000000000'),
    sequenceNumber: 0,
    signatureOperationsCount: 0,
    signedMessages: [],
    stack: [Uint8Array.of(0x04)],
    transactionOutpoints: Uint8Array.of(0),
    transactionOutputs: Uint8Array.of(0),
    transactionSequenceNumbers: Uint8Array.of(0),
    version: 0,
  });
});

test('[BCH VM] vm.evaluate: only lockingBytecode: OP_2 OP_2 OP_ADD', async (t) => {
  const sha256 = await instantiateSha256();
  const vm = await instantiateVirtualMachineBCH();
  const program = createTestAuthenticationProgramBCH({
    lockingBytecode: Uint8Array.from([
      OpcodesBCH.OP_2,
      OpcodesBCH.OP_2,
      OpcodesBCH.OP_ADD,
    ]),
    satoshis: hexToBin('0000000000000000'),
    sha256,
    unlockingBytecode: Uint8Array.of(),
  });
  const result = vm.evaluate(program);
  t.deepEqual(result, {
    alternateStack: [],
    correspondingOutput: hexToBin('000000000000000000'),
    executionStack: [],
    instructions: [
      {
        opcode: 82,
      },
      {
        opcode: 82,
      },
      {
        opcode: 147,
      },
    ],
    ip: 3,
    lastCodeSeparator: -1,
    locktime: 0,
    operationCount: 1,
    outpointIndex: 0,
    outpointTransactionHash: hexToBin(
      'e3d27808b1d16719d2690e9a30de9d69c52c33916a0c491d0aa0a98c56d6c2af'
    ),
    outputValue: hexToBin('0000000000000000'),
    sequenceNumber: 4294967295,
    signatureOperationsCount: 0,
    signedMessages: [],
    stack: [Uint8Array.of(0x04)],
    transactionOutpoints: hexToBin(
      'afc2d6568ca9a00a1d490c6a91332cc5699dde309a0e69d21967d1b10878d2e300000000'
    ),
    transactionOutputs: hexToBin('000000000000000000'),
    transactionSequenceNumbers: hexToBin('ffffffff'),
    version: 1,
  });
});

test('[BCH VM] vm.debug: only lockingBytecode: OP_2 OP_2 OP_ADD', async (t) => {
  const sha256 = await instantiateSha256();
  const vm = await instantiateVirtualMachineBCH();
  const program = createTestAuthenticationProgramBCH({
    lockingBytecode: Uint8Array.from([
      OpcodesBCH.OP_2,
      OpcodesBCH.OP_2,
      OpcodesBCH.OP_ADD,
    ]),
    satoshis: hexToBin('0000000000000000'),
    sha256,
    unlockingBytecode: Uint8Array.of(),
  });
  const result = vm.debug(program);
  t.deepEqual(result, [
    {
      alternateStack: [],
      correspondingOutput: hexToBin('000000000000000000'),
      executionStack: [],
      instructions: [],
      ip: 0,
      lastCodeSeparator: -1,
      locktime: 0,
      operationCount: 0,
      outpointIndex: 0,
      outpointTransactionHash: hexToBin(
        'e3d27808b1d16719d2690e9a30de9d69c52c33916a0c491d0aa0a98c56d6c2af'
      ),
      outputValue: hexToBin('0000000000000000'),
      sequenceNumber: 4294967295,
      signatureOperationsCount: 0,
      signedMessages: [],
      stack: [],
      transactionOutpoints: hexToBin(
        'afc2d6568ca9a00a1d490c6a91332cc5699dde309a0e69d21967d1b10878d2e300000000'
      ),
      transactionOutputs: hexToBin('000000000000000000'),
      transactionSequenceNumbers: hexToBin('ffffffff'),
      version: 1,
    },
    {
      alternateStack: [],
      correspondingOutput: hexToBin('000000000000000000'),
      executionStack: [],
      instructions: [
        {
          opcode: 82,
        },
        {
          opcode: 82,
        },
        {
          opcode: 147,
        },
      ],
      ip: 0,
      lastCodeSeparator: -1,
      locktime: 0,
      operationCount: 0,
      outpointIndex: 0,
      outpointTransactionHash: hexToBin(
        'e3d27808b1d16719d2690e9a30de9d69c52c33916a0c491d0aa0a98c56d6c2af'
      ),
      outputValue: hexToBin('0000000000000000'),
      sequenceNumber: 4294967295,
      signatureOperationsCount: 0,
      signedMessages: [],
      stack: [],
      transactionOutpoints: hexToBin(
        'afc2d6568ca9a00a1d490c6a91332cc5699dde309a0e69d21967d1b10878d2e300000000'
      ),
      transactionOutputs: hexToBin('000000000000000000'),
      transactionSequenceNumbers: hexToBin('ffffffff'),
      version: 1,
    },
    {
      alternateStack: [],
      correspondingOutput: hexToBin('000000000000000000'),
      executionStack: [],
      instructions: [
        {
          opcode: 82,
        },
        {
          opcode: 82,
        },
        {
          opcode: 147,
        },
      ],
      ip: 1,
      lastCodeSeparator: -1,
      locktime: 0,
      operationCount: 0,
      outpointIndex: 0,
      outpointTransactionHash: hexToBin(
        'e3d27808b1d16719d2690e9a30de9d69c52c33916a0c491d0aa0a98c56d6c2af'
      ),
      outputValue: hexToBin('0000000000000000'),
      sequenceNumber: 4294967295,
      signatureOperationsCount: 0,
      signedMessages: [],
      stack: [Uint8Array.of(0x02)],
      transactionOutpoints: hexToBin(
        'afc2d6568ca9a00a1d490c6a91332cc5699dde309a0e69d21967d1b10878d2e300000000'
      ),
      transactionOutputs: hexToBin('000000000000000000'),
      transactionSequenceNumbers: hexToBin('ffffffff'),
      version: 1,
    },
    {
      alternateStack: [],
      correspondingOutput: hexToBin('000000000000000000'),
      executionStack: [],
      instructions: [
        {
          opcode: 82,
        },
        {
          opcode: 82,
        },
        {
          opcode: 147,
        },
      ],
      ip: 2,
      lastCodeSeparator: -1,
      locktime: 0,
      operationCount: 0,
      outpointIndex: 0,
      outpointTransactionHash: hexToBin(
        'e3d27808b1d16719d2690e9a30de9d69c52c33916a0c491d0aa0a98c56d6c2af'
      ),
      outputValue: hexToBin('0000000000000000'),
      sequenceNumber: 4294967295,
      signatureOperationsCount: 0,
      signedMessages: [],
      stack: [Uint8Array.of(0x02), Uint8Array.of(0x02)],
      transactionOutpoints: hexToBin(
        'afc2d6568ca9a00a1d490c6a91332cc5699dde309a0e69d21967d1b10878d2e300000000'
      ),
      transactionOutputs: hexToBin('000000000000000000'),
      transactionSequenceNumbers: hexToBin('ffffffff'),
      version: 1,
    },
    {
      alternateStack: [],
      correspondingOutput: hexToBin('000000000000000000'),
      executionStack: [],
      instructions: [
        {
          opcode: 82,
        },
        {
          opcode: 82,
        },
        {
          opcode: 147,
        },
      ],
      ip: 3,
      lastCodeSeparator: -1,
      locktime: 0,
      operationCount: 1,
      outpointIndex: 0,
      outpointTransactionHash: hexToBin(
        'e3d27808b1d16719d2690e9a30de9d69c52c33916a0c491d0aa0a98c56d6c2af'
      ),
      outputValue: hexToBin('0000000000000000'),
      sequenceNumber: 4294967295,
      signatureOperationsCount: 0,
      signedMessages: [],
      stack: [Uint8Array.of(0x04)],
      transactionOutpoints: hexToBin(
        'afc2d6568ca9a00a1d490c6a91332cc5699dde309a0e69d21967d1b10878d2e300000000'
      ),
      transactionOutputs: hexToBin('000000000000000000'),
      transactionSequenceNumbers: hexToBin('ffffffff'),
      version: 1,
    },
    {
      alternateStack: [],
      correspondingOutput: hexToBin('000000000000000000'),
      executionStack: [],
      instructions: [
        {
          opcode: 82,
        },
        {
          opcode: 82,
        },
        {
          opcode: 147,
        },
      ],
      ip: 3,
      lastCodeSeparator: -1,
      locktime: 0,
      operationCount: 1,
      outpointIndex: 0,
      outpointTransactionHash: hexToBin(
        'e3d27808b1d16719d2690e9a30de9d69c52c33916a0c491d0aa0a98c56d6c2af'
      ),
      outputValue: hexToBin('0000000000000000'),
      sequenceNumber: 4294967295,
      signatureOperationsCount: 0,
      signedMessages: [],
      stack: [Uint8Array.of(0x04)],
      transactionOutpoints: hexToBin(
        'afc2d6568ca9a00a1d490c6a91332cc5699dde309a0e69d21967d1b10878d2e300000000'
      ),
      transactionOutputs: hexToBin('000000000000000000'),
      transactionSequenceNumbers: hexToBin('ffffffff'),
      version: 1,
    },
  ]);
});
