/* eslint-disable no-console, functional/no-expression-statements */

// TODO: finish this simple wallet CLI

import { randomBytes } from 'node:crypto';

import {
  assertSuccess,
  binsAreEqual,
  binToHex,
  cashAddressToLockingBytecode,
  cashAssemblyToBin,
  createCompilerBch,
  createVirtualMachineBch2025,
  decodeTransactionUnsafe,
  deriveHdPrivateNodeFromSeed,
  encodeHdPrivateKey,
  encodeTransaction,
  hashTransaction,
  hdPrivateKeyToIdentifier,
  hdPrivateKeyToP2pkhCashAddress,
  hdPrivateKeyToP2pkhLockingBytecode,
  hexToBin,
  isHex,
  lockingBytecodeToBase58Address,
  lockingBytecodeToCashAddress,
  stringify,
  stringifyDebugTraceSummary,
  summarizeDebugTrace,
  walletTemplateToCompilerConfiguration,
} from '../lib.js';

const usageInfo = `
Usage:

# Generate an HD private key
============================
Command: yarn wallet private [optional-hex-encoded-seed]

Generate a new private key to use when funding tests. To provide entropy from another source, a hex-encoded seed can optionally be provided. A seed should include between 16 bytes and 64 bytes of entropy (recommended: 32 bytes).


# Generate a funding address
============================
Command: yarn wallet address <prefix> <hd_private_key> [optional-address-index]
   E.g.: yarn wallet address bitcoincash xprv9s21ZrQH143K2JbpEjGU94NcdKSASB7LuXvJCTsxuENcGN1nVG7QjMnBZ6zZNcJaiJogsRaLaYFFjs48qt4Fg7y1GnmrchQt1zFNu6QVnta

To generate an address, provide the CashAddress prefix and the xprv of the HD key to use when generating the funding transaction. Typical prefixes are: bitcoincash, bchtest, bchreg


# Generate the transaction(s)
====================
Command: yarn wallet generate <hd_private_key> <transaction_hex>
   E.g.: yarn wallet generate xprv9s21ZrQH143K2JbpEjGU94NcdKSASB7LuXvJCTsxuENcGN1nVG7QjMnBZ6zZNcJaiJogsRaLaYFFjs48qt4Fg7y1GnmrchQt1zFNu6QVnta 020000...

For <transaction_hex>, provide the full, encoded funding transaction. The generate command will use the first output paying to index 0 of the provided address.
`;

const [, , arg1, arg2, arg3] = process.argv;

if (arg1 === undefined) {
  console.log(usageInfo);
  process.exit(0);
}

const defaultSeedLength = 32;
const fundingAddressIndex = 0;

if (arg1 === 'private') {
  if (arg2 !== undefined && !isHex(arg2)) {
    console.log(
      'Seed must be hex encoded. To use a random seed, omit this option.',
    );
    process.exit(1);
  }
  const seed =
    arg2 === undefined ? randomBytes(defaultSeedLength) : hexToBin(arg2);

  const node = deriveHdPrivateNodeFromSeed(seed);
  const { hdPrivateKey } = encodeHdPrivateKey({ network: 'mainnet', node });
  console.log(`
Derived a new HD private key from seed: ${binToHex(seed)}

HD private key: ${hdPrivateKey}

To use it, run: yarn wallet address <prefix> <hd_private_key> [index]

For <prefix> provide the CashAddress prefix to use. Typical prefixes are: bitcoincash, bchtest, bchreg
For [index], optionally provide an address index to use (default: 0)

E.g. for a mainnet address:
yarn wallet address bitcoincash ${hdPrivateKey}
  `);

  process.exit(0);
}

if (arg1 === 'address') {
  if (arg2 === undefined || arg3 === undefined) {
    console.log('Required arguments for "address": <prefix> <hd_private_key>');
    console.log(usageInfo);
    process.exit(1);
  }
  const keyId = hdPrivateKeyToIdentifier(arg3);
  if (typeof keyId === 'string') {
    console.log('\n', keyId);
    process.exit(1);
  }
  const { address } = hdPrivateKeyToP2pkhCashAddress({
    addressIndex: fundingAddressIndex,
    hdPrivateKey: arg3,
    prefix: arg2 as 'bchreg' | 'bchtest' | 'bitcoincash',
  });
  const { bytecode } = assertSuccess(cashAddressToLockingBytecode(address));
  const legacyAddress = lockingBytecodeToBase58Address(
    bytecode,
    'mainnet',
  ) as string;
  const copayAddress = lockingBytecodeToBase58Address(
    bytecode,
    'copayBCH',
  ) as string;
  console.log(`
Derived address index ${fundingAddressIndex} from key ID: ${binToHex(keyId)}.

Send funds to this address:
${address}

(Legacy format: ${legacyAddress}, Copay legacy format: ${copayAddress})

When the funding transaction has been created, run the "generate" command:
yarn wallet generate ${arg3} <transaction_hex>

For <transaction_hex>, provide the full, encoded funding transaction. The generate command will use the first output paying to index 0 of the provided address.
`);
  process.exit(0);
}

if (arg1 !== 'generate') {
  console.log(`Unknown command: ${arg1}`);
  console.log(usageInfo);
  process.exit(1);
}
if (arg2 === undefined || arg3 === undefined) {
  console.log(
    'Required arguments for "generate": <hd_private_key> <transaction_hex>',
  );
  console.log(usageInfo);
  process.exit(1);
}

const hdPrivateKey = arg2;
const keyId = hdPrivateKeyToIdentifier(arg2);
if (typeof keyId === 'string') {
  console.log('\n', keyId);
  process.exit(1);
}
const fundingTransactionBin = hexToBin(arg3);
const fundingTxId = hashTransaction(fundingTransactionBin);
const fundingTransaction = decodeTransactionUnsafe(fundingTransactionBin);
const fundingLockingBytecode = hdPrivateKeyToP2pkhLockingBytecode({
  addressIndex: fundingAddressIndex,
  hdPrivateKey,
});
const fundingAddress = assertSuccess(
  lockingBytecodeToCashAddress({
    bytecode: fundingLockingBytecode,
    prefix: 'bitcoincash',
  }),
).address;
const fundingUtxoIndex = fundingTransaction.outputs.findIndex((output) =>
  binsAreEqual(output.lockingBytecode, fundingLockingBytecode),
);

if (fundingUtxoIndex === -1) {
  console.log(
    `The provided funding transaction does not have an output which pays to address index ${fundingAddressIndex} of the provided HD private key. Is this the correct transaction?
Expected locking bytecode: ${binToHex(fundingLockingBytecode)}
CashAddress: ${fundingAddress}
`,
  );
  process.exit(1);
}
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const fundingUtxo = fundingTransaction.outputs[fundingUtxoIndex]!;

console.log('Funding UTXO:', stringify(fundingUtxo));

// const outputAddress = 'bitcoincash:qq2pq6z974lrdq8s0zkrl79efs3xap98fqvz9f30fl';
const outputAddress = 'bchtest:qrz7khw7pml90zzgzrf7ttdp934d56sxkyxgwhre99';
const outputLockingBytecode = cashAddressToLockingBytecode(outputAddress);
if (typeof outputLockingBytecode === 'string') {
  console.log(
    `The output address "${outputAddress}" is invalid: ${outputLockingBytecode}`,
  );
  process.exit(1);
}

const fundingUtxoValue = Number(fundingUtxo.valueSatoshis);
const setupSizeBytes = 183;
const setupOutputValue = fundingUtxoValue - setupSizeBytes;
const testSizeBytes = 106;
const finalOutputValue = setupOutputValue - testSizeBytes;

const setupTxId =
  'bec7a1507cc76495f005dcc71652cbb388c9adb10da7acdf89caa56c0c45da9e';
const setupUtxoIndex = 0;

const finalOutputBytecode = binToHex(
  assertSuccess(cashAssemblyToBin('OP_RETURN <"BigInt">')),
);
const configuration = walletTemplateToCompilerConfiguration({
  entities: { owner: { variables: { key: { type: 'HdKey' } } } },
  scenarios: {
    setupTx: {
      data: { hdKeys: { hdPrivateKeys: { owner: hdPrivateKey } } },
      sourceOutputs: [
        { lockingBytecode: ['slot'], valueSatoshis: fundingUtxoValue },
      ],
      transaction: {
        inputs: [
          {
            outpointIndex: fundingUtxoIndex,
            outpointTransactionHash: fundingTxId,
            unlockingBytecode: ['slot'],
          },
        ],
        outputs: [
          {
            lockingBytecode: { script: 'testLock' },
            valueSatoshis: setupOutputValue,
          },
        ],
      },
    },
    testSpend: {
      data: { hdKeys: { hdPrivateKeys: { owner: hdPrivateKey } } },
      sourceOutputs: [
        { lockingBytecode: ['slot'], valueSatoshis: setupOutputValue },
      ],
      transaction: {
        inputs: [
          {
            outpointIndex: setupUtxoIndex,
            outpointTransactionHash: setupTxId,
            unlockingBytecode: ['slot'],
          },
        ],
        outputs: [
          {
            lockingBytecode: finalOutputBytecode,
            valueSatoshis: finalOutputValue,
          },
        ],
      },
    },
  },
  scripts: {
    p2pkhLock: {
      lockingType: 'standard',
      name: 'P2PKH Lock',
      script:
        'OP_DUP\nOP_HASH160 <$(<key.public_key> OP_HASH160\n)> OP_EQUALVERIFY\nOP_CHECKSIG',
    },
    p2pkhUnlock: {
      name: 'Unlock',
      script: '<key.schnorr_signature.all_outputs>\n<key.public_key>',
      unlocks: 'p2pkhLock',
    },
    testLock: {
      lockingType: 'p2sh20',
      script:
        '<0xffffffffffffffff> OP_MUL <0x0100000000000000ffffffffffffff3f> OP_EQUAL',
    },
    testUnlock: {
      script: '<0xffffffffffffffff>',
      unlocks: 'testLock',
    },
  },
  supported: ['BCH_2023_05', 'BCH_2025_05'],
});
const compiler = createCompilerBch(configuration);
const setupTx = compiler.generateScenario({
  debug: true,
  scenarioId: 'setupTx',
  unlockingScriptId: 'p2pkhUnlock',
});

if (typeof setupTx === 'string') {
  console.log(`Error while generating setupTransaction: ${setupTx}`);
  process.exit(1);
}
if (typeof setupTx.scenario === 'string') {
  console.log(
    `Error while generating setupTransaction.scenario - ${setupTx.scenario}`,
  );
  process.exit(1);
}

const vm = createVirtualMachineBch2025(true);
const firstProgram = {
  sourceOutputs: [fundingUtxo],
  transaction: setupTx.scenario.program.transaction,
};
const testFirstTx = vm.verify(firstProgram);
if (testFirstTx !== true) {
  console.log(`First transaction is invalid: ${testFirstTx}`);
  const trace = vm.debug({ ...firstProgram, inputIndex: fundingUtxoIndex });
  console.log(stringifyDebugTraceSummary(summarizeDebugTrace(trace)));
  process.exit(1);
}

const encodedSetupTx = encodeTransaction(setupTx.scenario.program.transaction);
const newSetupTxId = hashTransaction(encodedSetupTx);

if (newSetupTxId !== setupTxId) {
  console.error('Update "setupTxId" to:', newSetupTxId);
  process.exit(1);
}

if (setupSizeBytes !== encodedSetupTx.length) {
  console.error(
    `Set "setupSizeBytes" to the new value: ${encodedSetupTx.length}`,
  );
  process.exit(1);
}

console.log(`
First TX ID: ${setupTxId}
Hex: ${binToHex(encodedSetupTx)}
`);

const secondTx = compiler.generateScenario({
  debug: true,
  scenarioId: 'testSpend',
  unlockingScriptId: 'testUnlock',
});

if (typeof secondTx === 'string') {
  console.log(`Error while generating setupTransaction: ${secondTx}`);
  process.exit(1);
}
if (typeof secondTx.scenario === 'string') {
  console.log(
    `Error while generating setupTransaction.scenario - ${secondTx.scenario}`,
  );
  process.exit(1);
}

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const setupUtxo = setupTx.scenario.program.transaction.outputs[setupUtxoIndex]!;

console.log('Setup UTXO:', stringify(setupUtxo));

const secondProgram = {
  sourceOutputs: [setupUtxo],
  transaction: secondTx.scenario.program.transaction,
};

const encodedSecondTx = encodeTransaction(
  secondTx.scenario.program.transaction,
);
const secondTxId = hashTransaction(encodedSetupTx);

console.log(`
  Second TX ID: ${secondTxId}
  Hex: ${binToHex(encodedSecondTx)}
  `);

console.log('verifying second transaction:');

const testSecondTx = vm.verify(secondProgram);

const trace = vm.debug({ ...secondProgram, inputIndex: setupUtxoIndex });
console.log(stringifyDebugTraceSummary(summarizeDebugTrace(trace)));

if (testSecondTx !== true) {
  console.log(`Second transaction is invalid: ${testSecondTx}`);
  process.exit(1);
}

if (testSizeBytes !== encodedSecondTx.length) {
  console.error(
    `Set "testSizeBytes" to the new value: ${encodedSecondTx.length}`,
  );
  process.exit(1);
}
