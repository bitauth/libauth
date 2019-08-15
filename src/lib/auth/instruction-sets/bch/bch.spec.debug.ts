// TODO: try against: c99c49da4c38af669dea436d3e73780dfdb6c1ecf9958baa52960e8baee30e73
// tslint:disable:no-expression-statement no-magic-numbers no-unsafe-any

import { instantiateSha256 } from '../../../crypto/crypto';
import {
  deserializeTransaction,
  getBitcoinTransactionId
} from '../../../transaction';
import { binToHex, hexToBin } from '../../../utils/utils';
import { instantiateVirtualMachineBCH } from '../../auth';

(async () => {
  // TODO: consider making a util
  const stringifyBinAndBigInt = (jsonObject: object) =>
    JSON.stringify(
      jsonObject,
      // tslint:disable-next-line:cyclomatic-complexity
      (_, value) =>
        value && value.constructor && value.constructor.name === 'Uint8Array'
          ? `<Uint8Array: 0x${binToHex(value)}>`
          : value && value.constructor && value.constructor.name === 'BigInt'
          ? `<BigInt: ${value.toString()}>`
          : value,
      2
    );

  const sha256 = await instantiateSha256();
  const vm = await instantiateVirtualMachineBCH();

  // /*
  // first non-coinbase TX from first Bitcoin Cash block - https://blockchair.com/bitcoin-cash/transaction/dff40f79cef322369d1d7ab9dc20f71a75dd333dc30eb2d77c08dafdbd1a7e86
  const sourceTxRaw = hexToBin(
    '010000000323fe8680e5f2f69577d55d883c0432ac0ff10f823954b6a9014325c102bade85000000006a47304402205925d96a648b07f383b495d093f155e3aabdfa816a5a0b3e2268671d815455ff022002e464cfaec46597d6c3dea8487843593b89ed2e9b3d9a7ca86c5dd0b616f5740121021af6713649ef24d4381f22b410f149a3f891f0735f31d23e1f18b65f8ea69ce2feffffff2b6c6f1620b057668b2e98b06a237d3e863735449a2d9790e9887b167d09839c000000006b483045022100887c0f8eaf0572515bb1140b2e0aea7c812eb71e726c7f5161e1234588c9a8db02205dadf0ddfbe8009a559b4ab18745599539221803004a9b5b573cec28dd3c64880121034eba6caed152b8e662a2b8bb4156638446c55b86fa0cd0c91d4338e40fbc6702feffffff25ff42e3475744fe8d17789c74cbe4ea393b9ec26d352eb0b3bfb1361d825818010000006a47304402205c733982700c0461e931e444db4ff938c6e62f8853bb51f0170ca71546aa687f02204355149df20383c80ffddf66d6e5218339bcc5ce94ed62d9b42e7e6960e0aa0a012103ba15cd466e195a234448ee8b25c1b27b4f815c20d94242d3eef93c6ac475dc9bfeffffff0300e1f505000000001976a9145638f9a56d28aad91177a1b545f394ef4255459a88ac00e1f505000000001976a91421b5aba6468723ae0a9c5b9653a5c174359e8c8588acb98d3d00000000001976a914189cfc7912f06cc8215d5eb4fd771936dde9c04088acea480700'
  );
  const sourceTx = deserializeTransaction(sourceTxRaw);
  const spendingTxRaw = hexToBin(
    '0200000001a81cda1aaa250c43b2b5a7e782898d6b41eb1638c3042ef39b139280fb9e47fe000000006b483045022100cd990173ded4abe8761e28f1fb31fc395434c49a7b90e3b4bebcc79f988c91ec02206783b794ada488a11a8b694ec129d863ebecbf9646c1e5b55f16652f1ff069e541210304143552e66475c8500c8a54565a4fb2c8586c9861c6ffa63d402bbbc54aca64ffffffff0280969800000000001976a91408c82cb3a87aa92967e2f4dec86f97f5b84cf11288ac24773b05000000001976a91427c8ce6010408cc9b9ae36bf5378a9bfb24bb45088ac00000000'
  );
  const spendingTransaction = deserializeTransaction(spendingTxRaw);
  const inputIndex = 0;
  const sourceOutput =
    sourceTx.outputs[spendingTransaction.inputs[inputIndex].outpointIndex];
  const result = vm.evaluate({
    inputIndex,
    sourceOutput,
    spendingTransaction
  });

  // tslint:disable-next-line:no-console
  console.log(
    `
    ##### sourceTx #####
    `,
    'ID: ',
    getBitcoinTransactionId(sourceTxRaw, sha256),
    stringifyBinAndBigInt(sourceTx),
    `
  ##### spendingTx #####
  `,
    'ID: ',
    getBitcoinTransactionId(spendingTxRaw, sha256),
    stringifyBinAndBigInt(spendingTransaction),
    `
  ##### result #####
  `,
    stringifyBinAndBigInt(result)
  );

  // */

  // next test - P2SH:

  // /*

  const sourceTx2Raw = hexToBin(
    '010000000235ab90a39a7f78ea423da2eb23d3764a051b4dd395b0c88b0e6063e984ca98360c0000009200483045022100b94226a436842b91ccf4ead38d37529b45436f85ef9f3374178d43d5b818e9140220794b3dc37f51253fd1ff7a1a4ab9e3d979fb7b0e9e9aec9bf3c6d23647e1f51041475121027bd84930f179dcd6f0d1e84e6e4254ca773262c33ccff6cde54c90b5a1d7ad772102c5a381b9a7841533485db2d7152901c49d5073b2b5e50131dc445abcaa53dd4a52aeffffffffdab40f4bb1701ae4322588385999ad6460a492e0cc3e02ac248fb6fc203620ce0800000092004830450221008de626b5f09a9b9ec3f045a6510e2d8c6bad03b5e61c2cfc7f2bdb9eeba8880702202ae1f5456505a17a9c3ad4ec2cf1569224dd7b4e34d0eba719a9c55a6f4fbd1e41475121027bd84930f179dcd6f0d1e84e6e4254ca773262c33ccff6cde54c90b5a1d7ad772102c5a381b9a7841533485db2d7152901c49d5073b2b5e50131dc445abcaa53dd4a52aeffffffff022e5234000000000017a914ba43dae86ed97191b29a6c2dc0cd9f8822a6d53e87dc0540000000000017a914c5945bd51b7c8626ea6bde38031451a2ebede1278700000000'
  );
  const spendingTx2Raw = hexToBin(
    '0100000001b7bf2653ad48b86c23eded0f50e3497b43283c498c259b766bb22e02c6d57990000000009200483045022100b17a7b3108ca44d6596cb8a98163935f6212cfe3d32672e79e06b18e22856685022022a65a80e674354f6aca462e604441ce36d857d3de07acf4b142875d840af83a4147512102758583598625eaf8d4d0ccd94060c48595ab8a6b07777523f316739aa1b240492102a838507aa93adee28c8526b505aa275d189463a7d84f7951ec5906e2b04a97cb52aeffffffff0292a31a000000000017a914d203a8a1741f36b10a40ca024b3624a4dc70f55f8780ad19000000000017a91428627d9e33623ee16a049d8327ad2c300b3be9ca8700000000'
  );

  const sourceTx2 = deserializeTransaction(sourceTx2Raw);
  const spendingTx2 = deserializeTransaction(spendingTx2Raw);
  const inputIndex2 = 0;
  const output2 =
    sourceTx2.outputs[spendingTx2.inputs[inputIndex2].outpointIndex];

  const trace = vm.debug({
    inputIndex: inputIndex2,
    sourceOutput: output2,
    spendingTransaction: spendingTx2
  });

  // tslint:disable-next-line:no-console
  console.log(
    `
    ##### sourceTx #####
    `,
    'ID: ',
    getBitcoinTransactionId(sourceTx2Raw, sha256),
    stringifyBinAndBigInt(sourceTx2),
    `
  ##### spendingTx #####
  `,
    'ID: ',
    getBitcoinTransactionId(spendingTx2Raw, sha256),
    stringifyBinAndBigInt(spendingTx2),
    `
  ##### result #####
  `,
    stringifyBinAndBigInt(trace)
  );

  // */

  // testing individual opcodes:

  return true;
})().catch(error => {
  // tslint:disable-next-line:no-console
  console.error(error);
});
