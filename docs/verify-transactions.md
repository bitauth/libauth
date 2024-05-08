# Verifying Transactions

Libauth includes extensive support for verifying transactions and debugging Virtual Machine (VM) evaluations using multiple VM versions, including patched and custom VMs.

## Simple Verification

To verify a transaction using Bitcoin Cash's latest standard VM, use `createVirtualMachineBch` with the initial `standard` parameter set to `true`. (For details on the difference between standard and non-standard VMs, see [`Standard Vs. Non-Standard VMs`](../src/lib/vmb-tests/readme.md#standard-vs-non-standard-vms).)

```ts
import {
  assertSuccess,
  decodeTransaction,
  decodeTransactionOutputs,
  createVirtualMachineBch,
} from '@bitauth/libauth';

const vm = createVirtualMachineBch(true);
/* Example transaction from Virtual Machine Bytecode (VMB) test ID: "dv5k4" */
const vmbTest = {
  description:
    'Basic push operations: OP_0 (A.K.A. OP_PUSHBYTES_0, OP_FALSE): zero is represented by an empty stack item (P2SH20)',
  id: 'dv5k4',
  tx: hexToBin(
    '020000000201000000000000000000000000000000000000000000000000000000000000000000000064417dfb529d352908ee0a88a0074c216b09793d6aa8c94c7640bb4ced51eaefc75d0aef61f7685d0307491e2628da3d4f91e86329265a4a58ca27a41ec0b8910779c32103a524f43d6166ad3567f18b0a5c769c6ab4dc02149f4d5095ccf4e8ffa293e7850000000001000000000000000000000000000000000000000000000000000000000000000100000006000482008777000000000100000000000000000a6a08766d625f7465737400000000',
  ),
  utxos: hexToBin(
    '0210270000000000001976a91460011c6bf3f1dd98cff576437b9d85de780f497488ac102700000000000017a91498e86c508e780cfb822bba3d5ab9b3e30450196b87',
  ),
};

/* Decode the transaction, throwing any errors */
const transaction = assertSuccess(decodeTransaction(vmbTest.tx));
/* Decode the serialized outputs, throwing any errors */
const sourceOutputs = assertSuccess(decodeTransactionOutputs(vmbTest.utxos));

// Result is either `true` or an error message (`string`)
const result = vm.verify({ sourceOutputs, transaction });

if (typeof result === 'string') {
  console.error(result);
} else {
  console.log('Transaction verified 🚀');
}
```

For examples of the kind of error messages that `vm.verify` might return, see [`bch_vmb_tests_2022_invalid_reasons.json`](../src/lib/vmb-tests/generated/bch/bch_vmb_tests_2022_invalid_reasons.json) and [`bch_vmb_tests_2022_nonstandard_reasons.json`](../src/lib/vmb-tests/generated/bch/bch_vmb_tests_2022_nonstandard_reasons.json)/.

## Debugging Evaluations

A complete example of transaction verification and evaluation debugging is available in [`bch-vmb-test.spec.helper.ts`](src/lib/vmb-tests/bch-vmb-test.spec.helper.ts), which is used by the `yarn test:unit:vmb_test` CLI command. E.g.:

```sh
❯ yarn test:unit:vmb_test bch_2023_standard dv5k4

VMB test ID: dv5k4
Description: Basic push operations: OP_0 (A.K.A. OP_PUSHBYTES_0, OP_FALSE): zero is represented by an empty stack item (P2SH20)
Test sets: 2022_standard

Unlocking ASM: OP_0
Redeem (P2SH20) ASM: OP_SIZE <0> OP_EQUAL OP_NIP
Result: Success
Evaluation at index 1:

0. OP_0:                0x(0)
1. OP_PUSHBYTES_4:      0x(0) 0x82008777(2005336194)
=>                      0x(0) 0x82008777(2005336194)
0. OP_HASH160:          0x(0) 0x98e86c508e780cfb822bba3d5ab9b3e30450196b
1. OP_PUSHBYTES_20:     0x(0) 0x98e86c508e780cfb822bba3d5ab9b3e30450196b 0x98e86c508e780cfb822bba3d5ab9b3e30450196b
2. OP_EQUAL:            0x(0) 0x01(1)
=>                      0x(0)
0. OP_SIZE:             0x(0) 0x(0)
1. OP_0:                0x(0) 0x(0) 0x(0)
2. OP_EQUAL:            0x(0) 0x01(1)
3. OP_NIP:              0x01(1)
=>                      0x01(1)

```

For extended debugging information, try the `-v` flag, e.g. `yarn test:unit:vmb_test bch_2023_standard dv5k4 -v`.

For a more advanced example of transaction debugging, including mapping of evaluation results to CashAssembly source positions ([`extractEvaluationSamplesRecursive`](https://libauth.org/functions/extractEvaluationSamplesRecursive.html)), see [Bitauth IDE's `editor-state.ts`](https://github.com/bitauth/bitauth-ide/blob/master/src/editor/editor-state.ts).

## Custom Virtual Machines

Libauth's Virtual Machine (VM) tooling is generalized to support creating and using custom VMs in your application code. This is particularly useful for testing VM upgrade proposals or instrumenting the VM with additional specialized tooling.

To patch an existing VM, simply import the instruction set and modify the relevant operation or lifecycle method:

```ts
import type { AuthenticationProgramStateStack } from '@bitauth/libauth';
import {
  assertSuccess,
  binToHex,
  createInstructionSetBch,
  createVirtualMachine,
  OpcodesBch,
  pushToStack,
  stringifyDebugTraceSummary,
  summarizeDebugTrace,
  useThreeStackItems,
  walletTemplateToCompilerBch,
} from '@bitauth/libauth';

const instructionSet = createInstructionSetBch(true);
/**
 * A hypothetical "OP_UNROT" which rotates the top stack items in the
 * direction opposite that of OP_ROT. (The generic `<State extends ...>`
 * is only necessary for TypeScript usage.)
 */
const opUnRot = <State extends AuthenticationProgramStateStack>(state: State) =>
  useThreeStackItems(state, (nextState, [a, b, c]) =>
    pushToStack(nextState, c, a, b),
  );

/* We assign "OP_UNROT" at the index held by "OP_RESERVED1" */
const opcode = OpcodesBch.OP_RESERVED1;
/* All other features of the BCH instruction set are unmodified: */
const vm = createVirtualMachine({
  ...instructionSet,
  operations: {
    ...instructionSet.operations,
    [opcode]: opUnRot,
  },
});

const OP_UNROT = `0x${binToHex(Uint8Array.of(opcode))}`;
/* A compiler for a simple wallet template to test the new opcode: */
const compiler = walletTemplateToCompilerBch({
  entities: {},
  scripts: {
    lock: {
      lockingType: 'p2sh20',
      script: `${OP_UNROT} OP_CAT OP_CAT <0x030102> OP_EQUAL`,
    },
    unlock: { script: '<1> <2> <3>', unlocks: 'lock' },
  },
  supported: ['BCH_SPEC'],
});

/* Generate a testing scenario, throwing any errors */
const { program } = assertSuccess(
  compiler.generateScenario({ unlockingScriptId: 'unlock' }),
);

/* Debug the `program`: an inputIndex, sourceOutputs, and transaction */
const trace = vm.debug(program);
const summary = summarizeDebugTrace(trace);
const formatted = stringifyDebugTraceSummary(summary, {
  opcodes: { ...OpcodesBch, [opcode]: 'OP_UNROT' },
});
console.log(formatted); /*

Notice the `OP_UNROT` in the logged result 🚀:

1. OP_1:                0x01(1)
2. OP_2:                0x01(1) 0x02(2)
3. OP_3:                0x01(1) 0x02(2) 0x03(3)
4. OP_PUSHBYTES_8:      0x01(1) 0x02(2) 0x03(3) 0x897e7e0303010287(-504967220674068105)
=>                      0x01(1) 0x02(2) 0x03(3) 0x897e7e0303010287(-504967220674068105)
1. OP_HASH160:          0x01(1) 0x02(2) 0x03(3) 0x1e2083f589fd7943289cfaba1dcdc50e395f3019
2. OP_PUSHBYTES_20:     0x01(1) 0x02(2) 0x03(3) 0x1e2083f589fd7943289cfaba1dcdc50e395f3019 0x1e2083f589fd7943289cfaba1dcdc50e395f3019
3. OP_EQUAL:            0x01(1) 0x02(2) 0x03(3) 0x01(1)
=>                      0x01(1) 0x02(2) 0x03(3)
1. OP_UNROT:            0x03(3) 0x01(1) 0x02(2)
2. OP_CAT:              0x03(3) 0x0102(513)
3. OP_CAT:              0x030102(131331)
4. OP_PUSHBYTES_3:      0x030102(131331) 0x030102(131331)
5. OP_EQUAL:            0x01(1)
=>                      0x01(1) */
```

To make deeper changes to a particular instruction set, like modifying or extending the `AuthenticationProgramState` it uses, consider duplicating and modifying the instruction set in your own application code (e.g. the [`bch-2023-instruction-set.ts`](src/lib/vm/instruction-sets/bch/2023/bch-2023-instruction-set.ts) file). This generally simplifies maintenance of the modified/extended TypeScript types and avoids complex type casting.
