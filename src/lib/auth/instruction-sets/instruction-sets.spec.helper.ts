// tslint:disable:no-expression-statement
import test from 'ava';
import { AuthenticationVirtualMachine } from '../virtual-machine';
import { MinimumProgramState } from './common/common';

export type Expectation<ProgramState> = [ProgramState, Partial<ProgramState>];

const orderedSpread = <ProgramState>(
  first: ProgramState,
  second: Partial<ProgramState>
) =>
  // https://github.com/Microsoft/TypeScript/issues/10727
  (({
    ...(first as {}),
    ...(second as {})
    // tslint:disable-next-line:no-any
  } as any) as ProgramState);

// export const testOperator = <ProgramState>(
//   operator: Operation<ProgramState>,
//   testName: string,
//   expectedAsm: string,
//   expectedDescription: string,
//   expectation: Expectation<ProgramState>,
//   clone: (state: ProgramState) => ProgramState
// ) => {
//   test(`${testName}`, t => {
//     const beforeState = expectation[0];
//     const afterState = orderedSpread(beforeState, expectation[1]);
//     t.deepEqual(
//       typeof operator.asm === 'function'
//         ? operator.asm(clone(beforeState))
//         : operator.asm,
//       expectedAsm
//     );
//     t.deepEqual(
//       typeof operator.description === 'function'
//         ? operator.description(clone(beforeState))
//         : operator.description,
//       expectedDescription
//     );
//     t.deepEqual(operator.operation(beforeState), afterState);
//   });
// };

export const testVMOperation = <ProgramState extends MinimumProgramState>(
  name: string,
  getVm: () => AuthenticationVirtualMachine<ProgramState>,
  steps: ReadonlyArray<Expectation<ProgramState>>
) => {
  const vm = getVm();
  steps.map((set, index) => {
    test(`${name}: test ${index + 1}`, t => {
      const before = set[0];
      const after = orderedSpread(before, set[1]);
      t.deepEqual(vm.evaluate(before), after);
    });
  });
};
