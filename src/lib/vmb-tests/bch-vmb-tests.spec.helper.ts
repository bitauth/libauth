import {
  type AuthenticationVirtualMachineBch,
  type AuthenticationVirtualMachineBch2025,
  type AuthenticationVirtualMachineBchSpec,
  createVirtualMachineBch2023,
  createVirtualMachineBch2025,
  createVirtualMachineBch2026,
  createVirtualMachineBchSpec,
} from '../lib.js';

export type VmName =
  | 'bch_2023_nonstandard'
  | 'bch_2023_standard'
  | 'bch_2025_nonstandard'
  | 'bch_2025_standard'
  | 'bch_2026_nonstandard'
  | 'bch_2026_standard'
  | 'bch_spec_nonstandard'
  | 'bch_spec_standard';

export type TestedVM =
  | AuthenticationVirtualMachineBch
  | AuthenticationVirtualMachineBch2025
  | AuthenticationVirtualMachineBchSpec;

/**
 * The test ID of the "baseline" VMB test: a typical 2-input, 2-output, P2PKH
 * transaction. A VM implementation's performance in validating this transaction
 * can be considered it's baseline, per-transaction validation performance; the
 * VM's performance in validating all other VMB tests should be compared to this
 * baseline to identify performance bottlenecks.
 */
// cspell:ignore trxhzt
export const baselineBenchmarkId = 'trxhzt';
export const baselineBenchmarkTransactionByteLength = 366;

export const vms = {
  /* eslint-disable @typescript-eslint/naming-convention, camelcase */
  bch_2023_nonstandard: createVirtualMachineBch2023(false),
  bch_2023_standard: createVirtualMachineBch2023(true),
  bch_2025_nonstandard: createVirtualMachineBch2025(false),
  bch_2025_standard: createVirtualMachineBch2025(true),
  bch_2026_nonstandard: createVirtualMachineBch2026(false),
  bch_2026_standard: createVirtualMachineBch2026(true),
  bch_spec_nonstandard: createVirtualMachineBchSpec(false),
  bch_spec_standard: createVirtualMachineBchSpec(true),
  /* eslint-enable @typescript-eslint/naming-convention, camelcase */
};
export const isVm = (vmId: string): vmId is keyof typeof vms =>
  Object.keys(vms).includes(vmId);
