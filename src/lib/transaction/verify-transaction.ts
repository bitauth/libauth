import {
  AuthenticationErrorBCH,
  AuthenticationProgramCommon,
  AuthenticationProgramStateCommon,
  AuthenticationVirtualMachine,
  OpcodesBCH,
} from '../vm/vm';

import { Output, Transaction } from './transaction-types';

/**
 * Statelessly verify a transaction given an `AuthenticationVirtualMachine` and
 * a list of spent outputs (the `lockingBytecode` and `satoshis` being spent by
 * each input).
 *
 * Note, while the virtual machine will evaluate locktime-related operations
 * against the transactions own `locktime`, this method does not verify the
 * transaction's `locktime` property itself (allowing verification to be
 * stateless).
 *
 * Before a statelessly verified transaction can be added to the blockchain,
 * node implementations must confirm that:
 * - all `spentOutputs` are still unspent, and
 * - both relative and absolute locktime consensus requirements have been met.
 * (See BIP65, BIP68, and BIP112 for details.)
 *
 * @param spentOutputs - an array of the `Output`s spent by the transaction's
 * `inputs` in matching order (`inputs[0]` spends `spentOutputs[0]`, etc.)
 * @param transaction - the transaction to verify
 * @param vm - the authentication virtual machine to use in validation
 */
export const verifyTransaction = <
  VirtualMachine extends AuthenticationVirtualMachine<
    AuthenticationProgram,
    ProgramState
  >,
  AuthenticationProgram extends AuthenticationProgramCommon,
  ProgramState extends AuthenticationProgramStateCommon<Opcodes, Errors>,
  Opcodes = OpcodesBCH,
  Errors = AuthenticationErrorBCH
>({
  spentOutputs,
  transaction,
  vm,
}: {
  transaction: Transaction;
  spentOutputs: Output[];
  vm: VirtualMachine;
}) => {
  if (transaction.inputs.length !== spentOutputs.length) {
    return [
      'Unable to verify transaction: a spent output must be provided for each transaction input.',
    ];
  }
  const errors = transaction.inputs.reduce<string[]>((all, _, index) => {
    const program = {
      inputIndex: index,
      sourceOutput: spentOutputs[index],
      spendingTransaction: transaction,
    } as AuthenticationProgram;
    const state = vm.evaluate(program);
    const verify = vm.verify(state);
    if (verify === true) {
      return all;
    }
    return [...all, `Error in evaluating input index "${index}": ${verify}`];
  }, []);

  return errors.length === 0 ? true : errors;
};
