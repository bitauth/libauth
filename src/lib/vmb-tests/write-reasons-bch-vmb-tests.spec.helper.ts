/* eslint-disable functional/no-expression-statements */
/**
 * This script produces a `*reasons.json` file for every VMB test that is
 * expected to fail. Run it with: `yarn gen:vmb-tests`.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import type { VmbTest } from '../lib.js';
import {
  createVirtualMachineBch2023,
  createVirtualMachineBch2025,
  createVirtualMachineBch2026,
  createVirtualMachineBchSpec,
  hexToBin,
  readTransactionCommon,
  readTransactionOutputs,
} from '../lib.js';

import type { TestedVM } from './bch-vmb-tests.spec.helper.js';

// eslint-disable-next-line functional/no-return-void
const writeReasonsFile = (
  invalidJsonPath: string,
  reasonsPath: string,
  { vm }: { vm: TestedVM },
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
    const sourceOutputsRead = readTransactionOutputs({
      bin: hexToBin(sourceOutputsHex),
      index: 0,
    });
    const transactionRead = readTransactionCommon({
      bin: hexToBin(txHex),
      index: 0,
    });
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

const basePath = 'src/lib/vmb-tests/generated';
const rel = (path: string) => resolve(basePath, path);

writeReasonsFile(
  rel('./bch_vmb_tests_2023_invalid.json'),
  rel('./bch_vmb_tests_2023_invalid_reasons.json'),
  { vm: createVirtualMachineBch2023(false) },
);
writeReasonsFile(
  rel('./bch_vmb_tests_2023_nonstandard.json'),
  rel('./bch_vmb_tests_2023_nonstandard_reasons.json'),
  { vm: createVirtualMachineBch2023(true) },
);
writeReasonsFile(
  rel('./bch_vmb_tests_2025_invalid.json'),
  rel('./bch_vmb_tests_2025_invalid_reasons.json'),
  { vm: createVirtualMachineBch2025(false) },
);
writeReasonsFile(
  rel('./bch_vmb_tests_2025_nonstandard.json'),
  rel('./bch_vmb_tests_2025_nonstandard_reasons.json'),
  { vm: createVirtualMachineBch2025(true) },
);
writeReasonsFile(
  rel('./bch_vmb_tests_2026_invalid.json'),
  rel('./bch_vmb_tests_2026_invalid_reasons.json'),
  { vm: createVirtualMachineBch2026(false) },
);
writeReasonsFile(
  rel('./bch_vmb_tests_2026_nonstandard.json'),
  rel('./bch_vmb_tests_2026_nonstandard_reasons.json'),
  { vm: createVirtualMachineBch2026(true) },
);
writeReasonsFile(
  rel('./CHIPs/bch_vmb_tests_chip_loops_invalid.json'),
  rel('./CHIPs/bch_vmb_tests_chip_loops_invalid_reasons.json'),
  { vm: createVirtualMachineBchSpec(false) },
);
writeReasonsFile(
  rel('./CHIPs/bch_vmb_tests_chip_loops_nonstandard.json'),
  rel('./CHIPs/bch_vmb_tests_chip_loops_nonstandard_reasons.json'),
  { vm: createVirtualMachineBchSpec(true) },
);
