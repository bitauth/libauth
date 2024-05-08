/* eslint-disable no-console, functional/no-expression-statements, @typescript-eslint/no-non-null-assertion */
import {
  assertSuccess,
  createVirtualMachineBch2023,
  createVirtualMachineBch2025,
  createVirtualMachineBchSpec,
  decodeTransaction,
  decodeTransactionOutputs,
  hexToBin,
  isPayToScriptHash20,
  stringify,
  stringifyDebugTraceSummary,
  summarizeDebugTrace,
} from '../lib.js';

// eslint-disable-next-line import/no-internal-modules
import vmbTestsBchJson from './generated/bch/bch_vmb_tests.json' assert { type: 'json' };

const vms = {
  /* eslint-disable @typescript-eslint/naming-convention, camelcase */
  bch_2023_nonstandard: createVirtualMachineBch2023(false),
  bch_2023_standard: createVirtualMachineBch2023(true),
  bch_2025_nonstandard: createVirtualMachineBch2025(false),
  bch_2025_standard: createVirtualMachineBch2025(true),
  bch_spec_nonstandard: createVirtualMachineBchSpec(false),
  bch_spec_standard: createVirtualMachineBchSpec(true),
  /* eslint-enable @typescript-eslint/naming-convention, camelcase */
};
const isVm = (vmId: string): vmId is keyof typeof vms =>
  Object.keys(vms).includes(vmId);

// cspell:ignore qwfvt
const usageInfo = `
This script runs a single VMB test on the requested VM, logging the results and debugging information. Use the "-v" flag to output the full debug trace.

Available VMs: ${Object.keys(vms).join(', ')}

Usage: yarn test:unit:vmb_test <vm> <test_id> [-v]
E.g.: yarn test:unit:vmb_test bch_2023_standard qwfvt
`;

const [, , vmId, testId, useVerbose] = process.argv;
if (vmId === undefined || testId === undefined) {
  console.log(usageInfo);
  process.exit(1);
}

if (!isVm(vmId)) {
  console.log(`Error: the VM "${vmId}" is unknown.\n${usageInfo}`);
  process.exit(1);
}

const vm = vms[vmId];
const testDefinition = (
  vmbTestsBchJson as [
    shortId: string,
    testDescription: string,
    unlockingScriptAsm: string,
    redeemOrLockingScriptAsm: string,
    testTransactionHex: string,
    sourceOutputsHex: string,
    testSets: string[],
    inputIndex?: number,
  ][]
).find(([shortId]) => shortId === testId);

if (testDefinition === undefined) {
  console.log(`Error: the test ID "${testId}" is unknown.\n${usageInfo}`);
  process.exit(1);
}

const [
  shortId,
  testDescription,
  unlockingScriptAsm,
  redeemOrLockingScriptAsm,
  txHex,
  sourceOutputsHex,
  testSets,
  inputIndex,
] = testDefinition;

const testedIndex = inputIndex ?? 0;
const transaction = assertSuccess(decodeTransaction(hexToBin(txHex)));
const sourceOutputs = assertSuccess(
  decodeTransactionOutputs(hexToBin(sourceOutputsHex)),
);
const result = vm.verify({ sourceOutputs, transaction });

const program = {
  inputIndex: testedIndex,
  sourceOutputs,
  transaction,
};

const debugResult = vm.debug(program);
const failingIndex =
  typeof result === 'string'
    ? /evaluating input index (?<index>\d+)/u.exec(result)?.groups?.['index']
    : undefined;
const unexpectedFailingIndexDebugTrace =
  failingIndex !== undefined && Number(failingIndex) !== testedIndex
    ? vm.debug({
        inputIndex: Number(failingIndex),
        sourceOutputs,
        transaction,
      })
    : undefined;

const isP2sh20 = isPayToScriptHash20(
  sourceOutputs[testedIndex]!.lockingBytecode,
);

const verbose = `
Verbose information (-v):
=========================

${
  unexpectedFailingIndexDebugTrace === undefined
    ? ''
    : `
Full debug trace at failing index ${failingIndex!}:
${stringify(unexpectedFailingIndexDebugTrace)}

----------
`
}

Full debug trace at index ${testedIndex}:
${stringify(debugResult)}

----------

Source outputs (hex): ${sourceOutputsHex}
Decoded:
${stringify(sourceOutputs)}

----------

Transaction (hex): ${txHex}
Decoded:
${stringify(transaction)}

Standard information:
=====================
`;

console.log(`
${useVerbose === undefined ? '' : verbose}

VMB test ID: ${shortId}
Description: ${testDescription}
Test sets: ${testSets.join(', ')}

Unlocking ASM: ${unlockingScriptAsm}
${isP2sh20 ? 'Redeem (P2SH20)' : 'Locking'} ASM: ${redeemOrLockingScriptAsm}
Result (VM: ${vmId}): ${
  result === true ? 'Transaction accepted' : `Transaction rejected: ${result}`
}${
  unexpectedFailingIndexDebugTrace === undefined
    ? ''
    : `
Note: an unexpected index is failing; the input index under test is ${testedIndex}, but input index ${failingIndex!} failed.

Evaluation at failing index (${failingIndex!}):
${stringifyDebugTraceSummary(
  summarizeDebugTrace(unexpectedFailingIndexDebugTrace),
)}
`
}
Evaluation at index ${testedIndex}:

${stringifyDebugTraceSummary(summarizeDebugTrace(debugResult))}
`);
