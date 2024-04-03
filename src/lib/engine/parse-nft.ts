import { hexToBin } from '../format/format.js';
import type {
  AuthenticationProgramCommon,
  AuthenticationProgramStateCommon,
  AuthenticationVirtualMachine,
  Output,
  ResolvedTransactionCommon,
} from '../lib.js';
import { createVirtualMachineBCHCHIPs } from '../vm/instruction-sets/bch/chips/bch-chips-vm.js';

export type VMCreator = () => AuthenticationVirtualMachine<
  ResolvedTransactionCommon,
  AuthenticationProgramCommon,
  AuthenticationProgramStateCommon
>;

/**
 * Returns the {@link AltStack} as a result of parsing the NFT's commitment using the
 * provided bytecode.
 *
 * @param utxo - the NFT to parse
 * @param bytecode - the bytecode as hex string
 * @param createVirtualMachine - a function that returns an {@link AuthenticationVirtualMachine}
 */
export const parseNft = (
  utxo: Output,
  bytecode: string,
  createVirtualMachine?: VMCreator,
): Uint8Array[] => {
  const vm = createVirtualMachine
    ? createVirtualMachine()
    : createVirtualMachineBCHCHIPs();

  const { alternateStack } = vm.evaluate({
    inputIndex: 1,
    sourceOutputs: [
      utxo,
      {
        lockingBytecode: hexToBin(bytecode),
        valueSatoshis: BigInt(0),
      },
    ],
    transaction: {
      inputs: [
        {
          outpointIndex: 0,
          outpointTransactionHash: hexToBin(''),
          sequenceNumber: 0,
          unlockingBytecode: hexToBin(''),
        },
        {
          outpointIndex: 0,
          outpointTransactionHash: hexToBin(''),
          sequenceNumber: 0,
          unlockingBytecode: hexToBin('51'),
        },
      ],
      locktime: 0,
      outputs: [
        {
          lockingBytecode: hexToBin('6a'),
          valueSatoshis: BigInt(0),
        },
      ],
      version: 2,
    },
  });
  return alternateStack;
};
