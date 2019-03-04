// tslint:disable:no-expression-statement no-magic-numbers readonly-array
import test from 'ava';

import { AuthenticationInstruction } from './instruction-sets/instruction-sets';
import { MinimumProgramState, StackState } from './state';
import {
  createAuthenticationVirtualMachine,
  InstructionSet
} from './virtual-machine';

enum simpleOps {
  OP_0 = 0,
  OP_INCREMENT = 1,
  OP_DECREMENT = 2,
  OP_ADD = 3
}

enum SimpleError {
  UNDEFINED = 'The program called an undefined opcode.',
  EMPTY_STACK = 'The program tried to pop from an empty stack.'
}

interface SimpleEvaluationState
  extends MinimumProgramState,
    StackState<number> {
  // tslint:disable-next-line:readonly-keyword
  error?: SimpleError;
}

const simpleInstructionSet: InstructionSet<SimpleEvaluationState> = {
  clone: (state: SimpleEvaluationState) => ({
    ...(state.error !== undefined ? { error: state.error } : {}),
    instructions: state.instructions.slice(),
    ip: state.ip,
    stack: state.stack.slice()
  }),
  continue: (state: SimpleEvaluationState) =>
    state.error === undefined && state.ip < state.instructions.length,
  operations: {
    [simpleOps.OP_0]: (state: SimpleEvaluationState) => {
      state.stack.push(0);
      return state;
    },
    [simpleOps.OP_INCREMENT]: (state: SimpleEvaluationState) => {
      const top = state.stack.pop();
      top === undefined
        ? // tslint:disable-next-line:no-object-mutation
          (state.error = SimpleError.EMPTY_STACK)
        : state.stack.push(top + 1);
      return state;
    },
    [simpleOps.OP_DECREMENT]: (state: SimpleEvaluationState) => {
      const top = state.stack.pop();
      top === undefined
        ? // tslint:disable-next-line:no-object-mutation
          (state.error = SimpleError.EMPTY_STACK)
        : state.stack.push(top - 1);
      return state;
    },
    [simpleOps.OP_ADD]: (state: SimpleEvaluationState) => {
      const a = state.stack.pop();
      const b = state.stack.pop();
      a === undefined || b === undefined
        ? // tslint:disable-next-line:no-object-mutation
          (state.error = SimpleError.EMPTY_STACK)
        : state.stack.push(a + b);
      return state;
    }
  },
  undefined: (state: SimpleEvaluationState) => {
    // tslint:disable-next-line:no-object-mutation
    state.error = SimpleError.UNDEFINED;
    return state;
  }
};
// tslint:enable: no-object-mutation

const vm = createAuthenticationVirtualMachine(simpleInstructionSet);

const instructions: ReadonlyArray<AuthenticationInstruction<simpleOps>> = [
  { opcode: simpleOps.OP_0 },
  { opcode: simpleOps.OP_INCREMENT },
  { opcode: simpleOps.OP_INCREMENT },
  { opcode: simpleOps.OP_0 },
  { opcode: simpleOps.OP_DECREMENT },
  { opcode: simpleOps.OP_ADD }
];

test('vm.debug with a simple instruction set', t => {
  t.deepEqual(vm.debug({ instructions, ip: 0, stack: [] }), [
    { instructions, ip: 1, stack: [0] },
    { instructions, ip: 2, stack: [1] },
    { instructions, ip: 3, stack: [2] },
    { instructions, ip: 4, stack: [2, 0] },
    { instructions, ip: 5, stack: [2, -1] },
    { instructions, ip: 6, stack: [1] }
  ]);
});

test('vm.evaluate does not mutate the original state', t => {
  const unchanged = { instructions, ip: 0, stack: [] };
  t.deepEqual(vm.evaluate(unchanged), { instructions, ip: 6, stack: [1] });
  t.deepEqual(unchanged, { instructions, ip: 0, stack: [] });
});

test('vm.step does not mutate the original state', t => {
  const unchanged = { instructions, ip: 5, stack: [2, -1] };
  t.deepEqual(vm.step(unchanged), { instructions, ip: 6, stack: [1] });
  t.deepEqual(unchanged, { instructions, ip: 5, stack: [2, -1] });
});

test('vm.stepMutate does not clone (mutating the original state)', t => {
  const changed = { instructions, ip: 5, stack: [2, -1] };
  t.deepEqual(vm.stepMutate(changed), { instructions, ip: 6, stack: [1] });
  t.deepEqual(changed, { instructions, ip: 6, stack: [1] });
});
