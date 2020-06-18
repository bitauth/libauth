import { Sha256 } from '../../../crypto/sha256';
import { hexToBin } from '../../../format/format';
import {
  encodeTransaction,
  getTransactionHashBE,
} from '../../../transaction/transaction-serialization';
import {
  Input,
  Output,
  Transaction,
} from '../../../transaction/transaction-types';
import {
  AuthenticationProgramCommon,
  AuthenticationProgramStateCommon,
} from '../../vm-types';

import { AuthenticationErrorBCH } from './bch-errors';
import { OpcodesBCH } from './bch-opcodes';

export enum ConsensusBCH {
  schnorrSignatureLength = 64,
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface AuthenticationProgramBCH extends AuthenticationProgramCommon {}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface AuthenticationProgramStateBCH
  extends AuthenticationProgramStateCommon<
    OpcodesBCH,
    AuthenticationErrorBCH
  > {}

export const createTestAuthenticationProgramBCH = ({
  lockingBytecode,
  satoshis,
  sha256,
  unlockingBytecode,
}: {
  /**
   * An implementation of sha256. Available via `instantiateSha256`.
   */
  sha256: { hash: Sha256['hash'] };
} & Output &
  Pick<Input, 'unlockingBytecode'>) => {
  const testFundingTransaction: Transaction = {
    inputs: [
      {
        outpointIndex: 0xffffffff,
        outpointTransactionHash: hexToBin(
          '0000000000000000000000000000000000000000000000000000000000000000'
        ),
        sequenceNumber: 0xffffffff,
        unlockingBytecode: Uint8Array.of(0, 0),
      },
    ],
    locktime: 0,
    outputs: [{ lockingBytecode, satoshis }],
    version: 1,
  };
  const testSpendingTransaction: Transaction = {
    inputs: [
      {
        outpointIndex: 0,
        outpointTransactionHash: getTransactionHashBE(
          sha256,
          encodeTransaction(testFundingTransaction)
        ),

        sequenceNumber: 0xffffffff,
        unlockingBytecode,
      },
    ],
    locktime: 0,
    outputs: [{ lockingBytecode: Uint8Array.of(), satoshis }],
    version: 1,
  };
  return {
    inputIndex: 0,
    sourceOutput: testFundingTransaction.outputs[0],
    spendingTransaction: testSpendingTransaction,
  };
};
