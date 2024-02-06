import { hexToBin } from '../../../../format/format.js';
import type {
  AnyCompilerConfiguration,
  AuthenticationProgramCommon,
  AuthenticationProgramStateCommon,
  AuthenticationVirtualMachine,
  CompilationContext,
  Compiler,
  Input,
  Output,
  ResolvedTransactionCommon,
  TransactionCommon,
} from '../../../../lib.js';
import {
  encodeTransactionCommon,
  hashTransactionP2pOrder,
} from '../../../../message/message.js';

export type ResolvedTransactionBCH = ResolvedTransactionCommon;
export type ResolvedTransaction = ResolvedTransactionBCH;
export type AuthenticationProgramBCH = AuthenticationProgramCommon;
export type AuthenticationProgram = AuthenticationProgramBCH;
export type AuthenticationProgramStateBCH = AuthenticationProgramStateCommon;
export type AuthenticationProgramState = AuthenticationProgramStateBCH;
export type AuthenticationVirtualMachineBCH = AuthenticationVirtualMachine<
  ResolvedTransactionBCH,
  AuthenticationProgramBCH,
  AuthenticationProgramStateBCH
>;
export type TransactionBCH<
  InputType = Input,
  OutputType = Output,
> = TransactionCommon<InputType, OutputType>;
export type Transaction<
  InputType = Input,
  OutputType = Output,
> = TransactionBCH<InputType, OutputType>;
export type CompilationContextBCH = CompilationContext<
  TransactionBCH<Input<Uint8Array | undefined>>
>;
export type CompilerBCH = Compiler<
  CompilationContextBCH,
  AnyCompilerConfiguration<CompilationContextBCH>,
  AuthenticationProgramStateBCH
>;

// TODO: replace with scenarios
export const createTestAuthenticationProgramBCH = ({
  lockingBytecode,
  valueSatoshis,
  unlockingBytecode,
}: Output & Pick<Input, 'unlockingBytecode'>) => {
  const testFundingTransaction: TransactionBCH = {
    inputs: [
      {
        outpointIndex: 0xffffffff,
        outpointTransactionHash: hexToBin(
          '0000000000000000000000000000000000000000000000000000000000000000',
        ),
        sequenceNumber: 0xffffffff,
        unlockingBytecode: Uint8Array.of(0, 0),
      },
    ],
    locktime: 0,
    outputs: [{ lockingBytecode, valueSatoshis }],
    version: 1,
  };
  const testSpendingTransaction: TransactionBCH = {
    inputs: [
      {
        outpointIndex: 0,
        outpointTransactionHash: hashTransactionP2pOrder(
          encodeTransactionCommon(testFundingTransaction),
        ),

        sequenceNumber: 0xffffffff,
        unlockingBytecode,
      },
    ],
    locktime: 0,
    outputs: [{ lockingBytecode: Uint8Array.of(), valueSatoshis }],
    version: 1,
  };
  return {
    inputIndex: 0,
    sourceOutputs: testFundingTransaction.outputs,
    transaction: testSpendingTransaction,
  };
};
