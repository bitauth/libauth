// tslint:disable:no-expression-statement no-magic-numbers no-unsafe-any
import { stringify } from '../../../utils/log';
import {
  createEmptyBitcoinCashProgramState,
  instantiateBitcoinCashVirtualMachine
} from './bitcoin-cash';
import { BitcoinCashOpcodes } from './bitcoin-cash-opcodes';

(async () => {
  const vm = await instantiateBitcoinCashVirtualMachine();

  const program = createEmptyBitcoinCashProgramState([
    { opcode: BitcoinCashOpcodes.OP_1 },
    { opcode: BitcoinCashOpcodes.OP_DROP }
  ]);

  // tslint:disable-next-line:no-console
  console.log(stringify(vm.debug(program)));
  // /*

  // testing individual opcodes:

  return true;
})().catch(error => {
  // tslint:disable-next-line:no-console
  console.error(error);
});
