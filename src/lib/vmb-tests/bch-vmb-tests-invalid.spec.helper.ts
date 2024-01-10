/* eslint-disable functional/no-expression-statements */
/**
 * This script produces a `*reasons.json` file for every VMB test that is
 * expected to fail. Run it with: `yarn gen:vmb-tests`.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import type {
  AuthenticationVirtualMachineBCH,
  AuthenticationVirtualMachineBCHCHIPs,
  VmbTest,
} from '../lib.js';
import {
  createVirtualMachineBCH2022,
  createVirtualMachineBCH2023,
  createVirtualMachineBCHCHIPs,
  hexToBin,
  readTransactionCommon,
  readTransactionNonTokenAware,
  readTransactionOutputs,
  readTransactionOutputsNonTokenAware,
} from '../lib.js';

// eslint-disable-next-line functional/no-return-void
const writeReasonsFile = (
  invalidJsonPath: string,
  reasonsPath: string,
  {
    supportsTokens,
    vm,
  }: {
    supportsTokens: boolean;
    vm: AuthenticationVirtualMachineBCH | AuthenticationVirtualMachineBCHCHIPs;
  },
) => {
  const vmbTests = JSON.parse(
    readFileSync(invalidJsonPath, { encoding: 'utf8' }),
  ) as VmbTest[];
  const getReason = ({
    sourceOutputsHex,
    txHex,
  }: {
    sourceOutputsHex: string;
    txHex: string;
  }) => {
    const sourceOutputsRead = (
      supportsTokens
        ? readTransactionOutputs
        : readTransactionOutputsNonTokenAware
    )({ bin: hexToBin(sourceOutputsHex), index: 0 });
    const transactionRead = (
      supportsTokens ? readTransactionCommon : readTransactionNonTokenAware
    )({ bin: hexToBin(txHex), index: 0 });
    if (typeof sourceOutputsRead === 'string') return sourceOutputsRead;
    if (typeof transactionRead === 'string') return transactionRead;
    const sourceOutputs = sourceOutputsRead.result;
    const transaction = transactionRead.result;
    return vm.verify({ sourceOutputs, transaction });
  };
  const reasons = vmbTests.reduce<{ [shortId: string]: string | true }>(
    (aggReasons, testCase) => {
      const [shortId, , , , txHex, sourceOutputsHex] = testCase;
      return {
        ...aggReasons,
        [shortId]: getReason({ sourceOutputsHex, txHex }),
      };
    },
    {},
  );
  writeFileSync(reasonsPath, JSON.stringify(reasons), { encoding: 'utf8' });
};

const basePath = 'src/lib/vmb-tests/generated/bch';
const rel = (path: string) => resolve(basePath, path);

writeReasonsFile(
  rel('./bch_vmb_tests_2022_invalid.json'),
  rel('./bch_vmb_tests_2022_invalid_reasons.json'),
  { supportsTokens: false, vm: createVirtualMachineBCH2022(false) },
);
writeReasonsFile(
  rel('./bch_vmb_tests_2022_nonstandard.json'),
  rel('./bch_vmb_tests_2022_nonstandard_reasons.json'),
  { supportsTokens: false, vm: createVirtualMachineBCH2022(true) },
);
writeReasonsFile(
  rel('./CHIPs/bch_vmb_tests_before_chip_cashtokens_invalid.json'),
  rel('./CHIPs/bch_vmb_tests_before_chip_cashtokens_invalid_reasons.json'),
  { supportsTokens: false, vm: createVirtualMachineBCH2022(false) },
);
writeReasonsFile(
  rel('./CHIPs/bch_vmb_tests_before_chip_cashtokens_nonstandard.json'),
  rel('./CHIPs/bch_vmb_tests_before_chip_cashtokens_nonstandard_reasons.json'),
  { supportsTokens: false, vm: createVirtualMachineBCH2022(true) },
);
writeReasonsFile(
  rel('./CHIPs/bch_vmb_tests_chip_cashtokens_invalid.json'),
  rel('./CHIPs/bch_vmb_tests_chip_cashtokens_invalid_reasons.json'),
  { supportsTokens: true, vm: createVirtualMachineBCH2023(false) },
);
writeReasonsFile(
  rel('./CHIPs/bch_vmb_tests_chip_cashtokens_nonstandard.json'),
  rel('./CHIPs/bch_vmb_tests_chip_cashtokens_nonstandard_reasons.json'),
  { supportsTokens: true, vm: createVirtualMachineBCH2023(true) },
);
writeReasonsFile(
  rel('./CHIPs/bch_vmb_tests_chip_loops_invalid.json'),
  rel('./CHIPs/bch_vmb_tests_chip_loops_invalid_reasons.json'),
  { supportsTokens: true, vm: createVirtualMachineBCHCHIPs(false) },
);
writeReasonsFile(
  rel('./CHIPs/bch_vmb_tests_chip_loops_nonstandard.json'),
  rel('./CHIPs/bch_vmb_tests_chip_loops_nonstandard_reasons.json'),
  { supportsTokens: true, vm: createVirtualMachineBCHCHIPs(true) },
);
