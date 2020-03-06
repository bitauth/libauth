import { Sha256 } from '../../../crypto/sha256';
import {
  getBitcoinTransactionId,
  serializeTransaction,
  Transaction
} from '../../../transaction';
import { hexToBin, swapEndianness } from '../../../utils/utils';
import {
  AuthenticationProgramCommon,
  AuthenticationProgramStateCommon
} from '../../state';

import { AuthenticationErrorBCH } from './bch-errors';
import { OpcodesBCH } from './bch-opcodes';

export enum ConsensusBCH {
  schnorrSignatureLength = 64
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
  satoshis = 0,
  sha256,
  unlockingBytecode
}: {
  unlockingBytecode: Uint8Array;
  lockingBytecode: Uint8Array;
  sha256: { hash: Sha256['hash'] };
  satoshis: number;
}) => {
  const testFundingTransaction: Transaction = {
    inputs: [
      {
        outpointIndex: 0xffffffff,
        outpointTransactionHash: hexToBin(
          '0000000000000000000000000000000000000000000000000000000000000000'
        ),
        sequenceNumber: 0xffffffff,
        unlockingBytecode: Uint8Array.of(0, 0)
      }
    ],
    locktime: 0,
    outputs: [{ lockingBytecode, satoshis }],
    version: 1
  };
  const testSpendingTransaction: Transaction = {
    inputs: [
      {
        outpointIndex: 0,
        outpointTransactionHash: hexToBin(
          swapEndianness(
            getBitcoinTransactionId(
              serializeTransaction(testFundingTransaction),
              sha256
            )
          )
        ),
        sequenceNumber: 0xffffffff,
        unlockingBytecode
      }
    ],
    locktime: 0,
    outputs: [{ lockingBytecode: Uint8Array.of(), satoshis }],
    version: 1
  };
  return {
    inputIndex: 0,
    sourceOutput: testFundingTransaction.outputs[0],
    spendingTransaction: testSpendingTransaction
  };
};
