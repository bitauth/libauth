import test from 'ava';

import type { AuthenticationProgramBch, Output } from '../../../lib.js';
import {
  createAuthenticationProgramStateBch2020,
  createCompilationContextCommonTesting,
  createTestAuthenticationProgramBch,
  createVirtualMachineXec,
  decodeAuthenticationInstructions,
  decodeTransactionCommon,
  hexToBin,
  OpcodesXec,
  stringify,
} from '../../../lib.js';

const program = createCompilationContextCommonTesting({
  inputs: [
    {
      outpointIndex: 0,
      outpointTransactionHash: Uint8Array.of(1),
      sequenceNumber: 0,
      unlockingBytecode: Uint8Array.of(),
    },
  ],
}) as AuthenticationProgramBch;

test('[BCH VM] vm.stateEvaluate: OP_2 OP_2 OP_ADD', (t) => {
  const vm = createVirtualMachineXec();
  const state = createAuthenticationProgramStateBch2020({
    instructions: decodeAuthenticationInstructions(
      Uint8Array.from([OpcodesXec.OP_2, OpcodesXec.OP_2, OpcodesXec.OP_ADD]),
    ),
    program,
    stack: [],
    transactionLengthBytes: 200,
  });
  const result = vm.stateEvaluate(state);
  t.deepEqual(result, {
    alternateStack: [],
    controlStack: [],
    instructions: [{ opcode: 82 }, { opcode: 82 }, { opcode: 147 }],
    ip: 3,
    lastCodeSeparator: -1,
    metrics: { executedInstructionCount: 3, signatureCheckCount: 0 },
    operationCount: 1,
    program,
    signedMessages: [],
    stack: [Uint8Array.of(0x04)],
    transactionLengthBytes: 200,
  });
});

test('[BCH VM] vm.stateDebug: OP_2 OP_2 OP_ADD', (t) => {
  const vm = createVirtualMachineXec();
  const state = createAuthenticationProgramStateBch2020({
    instructions: decodeAuthenticationInstructions(
      Uint8Array.from([OpcodesXec.OP_2, OpcodesXec.OP_2, OpcodesXec.OP_ADD]),
    ),
    program,
    stack: [],
    transactionLengthBytes: 200,
  });
  const result = vm.stateDebug(state);
  t.deepEqual(result, [
    {
      alternateStack: [],
      controlStack: [],
      instructions: [{ opcode: 82 }, { opcode: 82 }, { opcode: 147 }],
      ip: 0,
      lastCodeSeparator: -1,
      metrics: { executedInstructionCount: 0, signatureCheckCount: 0 },
      operationCount: 0,
      program,
      signedMessages: [],
      stack: [],
      transactionLengthBytes: 200,
    },
    {
      alternateStack: [],
      controlStack: [],
      instructions: [{ opcode: 82 }, { opcode: 82 }, { opcode: 147 }],
      ip: 1,
      lastCodeSeparator: -1,
      metrics: { executedInstructionCount: 1, signatureCheckCount: 0 },
      operationCount: 0,
      program,
      signedMessages: [],
      stack: [Uint8Array.of(0x02)],
      transactionLengthBytes: 200,
    },
    {
      alternateStack: [],
      controlStack: [],
      instructions: [{ opcode: 82 }, { opcode: 82 }, { opcode: 147 }],
      ip: 2,
      lastCodeSeparator: -1,
      metrics: { executedInstructionCount: 2, signatureCheckCount: 0 },
      operationCount: 0,
      program,
      signedMessages: [],
      stack: [Uint8Array.of(0x02), Uint8Array.of(0x02)],
      transactionLengthBytes: 200,
    },
    {
      alternateStack: [],
      controlStack: [],
      instructions: [{ opcode: 82 }, { opcode: 82 }, { opcode: 147 }],
      ip: 3,
      lastCodeSeparator: -1,
      metrics: { executedInstructionCount: 3, signatureCheckCount: 0 },
      operationCount: 1,
      program,
      signedMessages: [],
      stack: [Uint8Array.of(0x04)],
      transactionLengthBytes: 200,
    },
  ]);
});

test('[BCH VM] vm.stateStep through: OP_2 OP_2 OP_ADD', (t) => {
  const vm = createVirtualMachineXec();
  const state0 = createAuthenticationProgramStateBch2020({
    instructions: decodeAuthenticationInstructions(
      Uint8Array.from([OpcodesXec.OP_2, OpcodesXec.OP_2, OpcodesXec.OP_ADD]),
    ),
    program,
    stack: [],
    transactionLengthBytes: 200,
  });
  const state1 = vm.stateStep(state0);
  const state2 = vm.stateStep(state1);
  t.deepEqual(vm.stateContinue(state2), true);
  const state3 = vm.stateStep(state2);
  t.deepEqual(vm.stateContinue(state3), false);

  t.deepEqual(state0, {
    alternateStack: [],
    controlStack: [],
    instructions: [{ opcode: 82 }, { opcode: 82 }, { opcode: 147 }],
    ip: 0,
    lastCodeSeparator: -1,
    metrics: { executedInstructionCount: 0, signatureCheckCount: 0 },
    operationCount: 0,
    program,
    signedMessages: [],
    stack: [],
    transactionLengthBytes: 200,
  });
  t.deepEqual(state1, {
    alternateStack: [],
    controlStack: [],
    instructions: [{ opcode: 82 }, { opcode: 82 }, { opcode: 147 }],
    ip: 1,
    lastCodeSeparator: -1,
    metrics: { executedInstructionCount: 1, signatureCheckCount: 0 },
    operationCount: 0,
    program,
    signedMessages: [],
    stack: [Uint8Array.of(0x02)],
    transactionLengthBytes: 200,
  });
  t.deepEqual(state2, {
    alternateStack: [],
    controlStack: [],
    instructions: [{ opcode: 82 }, { opcode: 82 }, { opcode: 147 }],
    ip: 2,
    lastCodeSeparator: -1,
    metrics: { executedInstructionCount: 2, signatureCheckCount: 0 },
    operationCount: 0,
    program,
    signedMessages: [],
    stack: [Uint8Array.of(0x02), Uint8Array.of(0x02)],
    transactionLengthBytes: 200,
  });
  t.deepEqual(state3, {
    alternateStack: [],
    controlStack: [],
    instructions: [{ opcode: 82 }, { opcode: 82 }, { opcode: 147 }],
    ip: 3,
    lastCodeSeparator: -1,
    metrics: { executedInstructionCount: 3, signatureCheckCount: 0 },
    operationCount: 1,
    program,
    signedMessages: [],
    stack: [Uint8Array.of(0x04)],
    transactionLengthBytes: 200,
  });
});

test('[BCH VM] vm.evaluate: only lockingBytecode: OP_2 OP_2 OP_ADD', (t) => {
  const vm = createVirtualMachineXec();
  const testProgram = createTestAuthenticationProgramBch({
    lockingBytecode: Uint8Array.from([
      OpcodesXec.OP_2,
      OpcodesXec.OP_2,
      OpcodesXec.OP_ADD,
    ]),
    unlockingBytecode: Uint8Array.of(),
    valueSatoshis: 0n,
  });
  const result = vm.evaluate(testProgram);
  t.deepEqual(result, {
    alternateStack: [],
    controlStack: [],
    instructions: [{ opcode: 82 }, { opcode: 82 }, { opcode: 147 }],
    ip: 3,
    lastCodeSeparator: -1,
    metrics: { executedInstructionCount: 3, signatureCheckCount: 0 },
    operationCount: 1,
    program: testProgram,
    signedMessages: [],
    stack: [Uint8Array.of(0x04)],
    transactionLengthBytes: 60,
  });
});

test('[BCH VM] vm.debug: only lockingBytecode: OP_2 OP_2 OP_ADD', (t) => {
  const vm = createVirtualMachineXec();
  const testProgram = createTestAuthenticationProgramBch({
    lockingBytecode: Uint8Array.from([
      OpcodesXec.OP_2,
      OpcodesXec.OP_2,
      OpcodesXec.OP_ADD,
    ]),
    unlockingBytecode: Uint8Array.of(),
    valueSatoshis: 0n,
  });
  const result = vm.debug(testProgram);
  t.deepEqual(result, [
    {
      alternateStack: [],
      controlStack: [],
      instructions: [],
      ip: 0,
      lastCodeSeparator: -1,
      metrics: { executedInstructionCount: 0, signatureCheckCount: 0 },
      operationCount: 0,
      program: testProgram,
      signedMessages: [],
      stack: [],
      transactionLengthBytes: 60,
    },
    {
      alternateStack: [],
      controlStack: [],
      instructions: [{ opcode: 82 }, { opcode: 82 }, { opcode: 147 }],
      ip: 0,
      lastCodeSeparator: -1,
      metrics: { executedInstructionCount: 0, signatureCheckCount: 0 },
      operationCount: 0,
      program: testProgram,
      signedMessages: [],
      stack: [],
      transactionLengthBytes: 60,
    },
    {
      alternateStack: [],
      controlStack: [],
      instructions: [{ opcode: 82 }, { opcode: 82 }, { opcode: 147 }],
      ip: 1,
      lastCodeSeparator: -1,
      metrics: { executedInstructionCount: 1, signatureCheckCount: 0 },
      operationCount: 0,
      program: testProgram,
      signedMessages: [],
      stack: [Uint8Array.of(0x02)],
      transactionLengthBytes: 60,
    },
    {
      alternateStack: [],
      controlStack: [],
      instructions: [{ opcode: 82 }, { opcode: 82 }, { opcode: 147 }],

      ip: 2,
      lastCodeSeparator: -1,
      metrics: { executedInstructionCount: 2, signatureCheckCount: 0 },
      operationCount: 0,
      program: testProgram,
      signedMessages: [],
      stack: [Uint8Array.of(0x02), Uint8Array.of(0x02)],
      transactionLengthBytes: 60,
    },
    {
      alternateStack: [],
      controlStack: [],
      instructions: [{ opcode: 82 }, { opcode: 82 }, { opcode: 147 }],
      ip: 3,
      lastCodeSeparator: -1,
      metrics: { executedInstructionCount: 3, signatureCheckCount: 0 },
      operationCount: 1,
      program: testProgram,
      signedMessages: [],
      stack: [Uint8Array.of(0x04)],
      transactionLengthBytes: 60,
    },
    {
      alternateStack: [],
      controlStack: [],
      instructions: [{ opcode: 82 }, { opcode: 82 }, { opcode: 147 }],
      ip: 3,
      lastCodeSeparator: -1,
      metrics: { executedInstructionCount: 3, signatureCheckCount: 0 },
      operationCount: 1,
      program: testProgram,
      signedMessages: [],
      stack: [Uint8Array.of(0x04)],
      transactionLengthBytes: 60,
    },
  ]);
});

test('verifyTransaction', (t) => {
  const vm = createVirtualMachineXec();
  const valueSatoshis = 10000;
  const transaction = decodeTransactionCommon(
    hexToBin(
      '0200000001600a1b6b0563bbd5b9bef124ff634600df774559da6c51e34a6b97a178be233401000000fc0047304402205e7d56c4e7854f9c672977d6606dd2f0af5494b8e61108e2a92fc920bf8049fc022065262675b0e1a3850d88bd3c56e0eb5fb463d9cdbe49f2f625da5c0f82c765304147304402200d167d5ed77fa169346d295f6fb742e80ae391f0ae086d42b99152bdb23edf4102202c8b85c2583b07b66485b88cacdd14f680bd3aa3f3f12e9f63bc02b4d1cc6d15414c6952210349c17cce8a460f013fdcd286f90f7b0330101d0f3ab4ced44a5a3db764e465882102a438b1662aec9c35f85794600e1d2d3683a43cbb66307cf825fc4486b84695452103d9fffac162e9e15aecbe4f937b951815ccb4f940c850fff9ee52fa70805ae7de53ae000000000100000000000000000d6a0b68656c6c6f20776f726c6400000000',
    ),
  );
  if (typeof transaction === 'string') {
    t.fail(transaction);
    return;
  }

  const sourceOutputs: Output[] = [
    {
      lockingBytecode: hexToBin(
        'a9147ff682419764f7d0e6df75884c28334b9729864387',
      ),
      valueSatoshis: BigInt(valueSatoshis),
    },
  ];

  const result = vm.verify({ sourceOutputs, transaction });
  t.deepEqual(result, true, stringify(result));
});

test('verifyTransaction: ', (t) => {
  const vm = createVirtualMachineXec();
  const valueSatoshis = 10000;
  const transaction = decodeTransactionCommon(
    hexToBin(
      '0200000001600a1b6b0563bbd5b9bef124ff634600df774559da6c51e34a6b97a178be233401000000fc0047304402205e7d56c4e7854f9c672977d6606dd2f0af5494b8e61108e2a92fc920bf8049fc022065262675b0e1a3850d88bd3c56e0eb5fb463d9cdbe49f2f625da5c0f82c765304147304402200d167d5ed77fa169346d295f6fb742e80ae391f0ae086d42b99152bdb23edf4102202c8b85c2583b07b66485b88cacdd14f680bd3aa3f3f12e9f63bc02b4d1cc6d15414c6952210349c17cce8a460f013fdcd286f90f7b0330101d0f3ab4ced44a5a3db764e465882102a438b1662aec9c35f85794600e1d2d3683a43cbb66307cf825fc4486b84695452103d9fffac162e9e15aecbe4f937b951815ccb4f940c850fff9ee52fa70805ae7de53ae000000000100000000000000000d6a0b68656c6c6f20776f726c6400000000',
    ),
  );
  if (typeof transaction === 'string') {
    t.fail(transaction);
    return;
  }

  const sourceOutputs: Output[] = [
    {
      lockingBytecode: hexToBin(
        'a9147ff682419764f7d0e6df75884c28334b9729864387',
      ),
      valueSatoshis: BigInt(valueSatoshis),
    },
  ];

  const result = vm.verify({ sourceOutputs, transaction });
  t.deepEqual(result, true, stringify(result));
});

test('verifyTransaction: incorrect spentOutputs length', (t) => {
  const vm = createVirtualMachineXec();
  const transaction = decodeTransactionCommon(
    hexToBin(
      '0200000001600a1b6b0563bbd5b9bef124ff634600df774559da6c51e34a6b97a178be233401000000fc0047304402205e7d56c4e7854f9c672977d6606dd2f0af5494b8e61108e2a92fc920bf8049fc022065262675b0e1a3850d88bd3c56e0eb5fb463d9cdbe49f2f625da5c0f82c765304147304402200d167d5ed77fa169346d295f6fb742e80ae391f0ae086d42b99152bdb23edf4102202c8b85c2583b07b66485b88cacdd14f680bd3aa3f3f12e9f63bc02b4d1cc6d15414c6952210349c17cce8a460f013fdcd286f90f7b0330101d0f3ab4ced44a5a3db764e465882102a438b1662aec9c35f85794600e1d2d3683a43cbb66307cf825fc4486b84695452103d9fffac162e9e15aecbe4f937b951815ccb4f940c850fff9ee52fa70805ae7de53ae000000000100000000000000000d6a0b68656c6c6f20776f726c6400000000',
    ),
  );
  if (typeof transaction === 'string') {
    t.fail(transaction);
    return;
  }

  const sourceOutputs: Output[] = [];

  const result = vm.verify({ sourceOutputs, transaction });
  t.deepEqual(
    result,
    'Unable to verify transaction: a single spent output must be provided for each transaction input.',
    stringify(result),
  );
});

test('verifyTransaction: invalid input', (t) => {
  const vm = createVirtualMachineXec();
  const valueSatoshis = 10000;
  const transaction = decodeTransactionCommon(
    hexToBin(
      '0100000001600a1b6b0563bbd5b9bef124ff634600df774559da6c51e34a6b97a178be233401000000fc0047304402205e7d56c4e7854f9c672977d6606dd2f0af5494b8e61108e2a92fc920bf8049fc022065262675b0e1a3850d88bd3c56e0eb5fb463d9cdbe49f2f625da5c0f82c765304147304402200d167d5ed77fa169346d295f6fb742e80ae391f0ae086d42b99152bdb23edf4102202c8b85c2583b07b66485b88cacdd14f680bd3aa3f3f12e9f63bc02b4d1cc6d15414c6952210349c17cce8a460f013fdcd286f90f7b0330101d0f3ab4ced44a5a3db764e465882102a438b1662aec9c35f85794600e1d2d3683a43cbb66307cf825fc4486b84695452103d9fffac162e9e15aecbe4f937b951815ccb4f940c850fff9ee52fa70805ae7de53ae000000000100000000000000000d6a0b68656c6c6f20776f726c6400000000',
    ),
  );
  if (typeof transaction === 'string') {
    t.fail(transaction);
    return;
  }

  const sourceOutputs: Output[] = [
    {
      lockingBytecode: hexToBin(
        'a9147ff682419764f7d0e6df75884c28334b9729864387',
      ),
      valueSatoshis: BigInt(valueSatoshis),
    },
  ];

  const result = vm.verify({ sourceOutputs, transaction });
  t.deepEqual(
    result,
    'Error in evaluating input index 0: Program failed a signature verification with a non-null signature (violating the "NULLFAIL" rule).',
    stringify(result),
  );
});
