// tslint:disable:no-expression-statement no-magic-numbers
import test from 'ava';
import { hexToBin } from '../../../utils/utils';

test('P2PKH Bitcoin Cash script', t => {
  // const vm = createAuthenticationVirtualMachine(bitcoinCashInstructionSet);
  // const vm = createBitcoinCashAuthenticationVM();

  const unlockingScript = hexToBin(
    '483045022100ab4c6d9ba51da83072615c33a9887b756478e6f9de381085f5183c97603fc6ff022029722188bd937f54c861582ca6fc685b8da2b40d05f06b368374d35e4af2b76401210376ea9e36a75d2ecf9c93a0be76885e36f822529db22acfdc761c9b5b4544f5c5'
  );
  const lockingScript = hexToBin(
    '76a91415d16c84669ab46059313bf0747e781f1d13936d88ac'
  );

  t.truthy(lockingScript);
  t.truthy(unlockingScript);
});
