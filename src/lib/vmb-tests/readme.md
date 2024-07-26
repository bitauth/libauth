# Libauth VMB Tests

Libauth's test suite includes a set of cross-implementation Virtual Machine Bytecode (VMB) test vectors for each supported VM. All VMB test files can be found in the [`vmb-tests/generated` directory](./generated/).

Libauth aims to provide support for the Virtual Machine (VM) used by every public bitcoin-like network and for public upgrade proposals with stable technical specifications. See [Libauth Instruction Sets](../vm/instruction-sets/readme.md) for details.

### Comparison to `script_tests.json`

Like the C++ implementation's [`script_tests.json`](../vm/instruction-sets/xec/fixtures/satoshi-client/script_tests.json), VMB tests are encoded in a standard JSON format. While `script_tests` generally focused on testing only the "script" (VM bytecode) system, `vmb_tests` are designed to test the entire transaction validation infrastructure of a VM implementation: each test is encoded in a complete test transaction, and the test vector includes the UTXOs for which the test transaction must be verified.

### VMB Test Contents

Each VMB test is an array including:

0. **`shortId`** - A short, unique identifier for the test (based on the hash of the test contents)
1. **`testDescription`** - A string describing the purpose/behavior of the test
2. **`unlockingScriptAsm`** - The unlocking script under test (disassembled, i.e. human-readable)
3. **`redeemOrLockingScriptAsm`** - The locking script under test (disassembled)
4. **`testTransactionHex`** - The full, encoded test transaction
5. **`sourceOutputsHex`** - An encoded list of unspent transaction outputs (UTXOs) with which to verify the test transaction (ordered to match the input order of the test transaction)
6. **`inputIndex` (default: `0`)** - The input index of the primary input under test (evaluating the scripts from array index `2` and `3` above); if not specified, the primary input under test is input `0`.

Every test vector in each VM's master test file (e.g. [`bch_vmb_tests.json`](./generated/bch_vmb_tests.json)) also includes a list of labels indicating the VM configurations for which the test vector applies. This master test file is automatically broken up into a variety of smaller, single-configuration test files for easier use (e.g. [`bch_vmb_tests_2025_standard.json`](./generated/bch_vmb_tests_2025_standard.json)).

## Testing with `vmb_tests`

VMB tests are designed to be very portable between VM implementations, encouraging better compatibility and cooperation in testing efforts across projects.

### Standard Vs. Non-Standard VMs

All of Libauth's supported VMs currently support both a `standard` and `non-standard` mode.

The **`standard` mode** should be used by practically all applications. It is the strictest mode of operation, and it is used to validate transactions before accepting or relaying them over the P2P network.

The **`non-standard` mode** is slightly more lax, and is only used to validate newly mined blocks. Because they cannot typically be relayed, non-standard transactions must be manually included by a miner. (By definition, any transaction that is valid in standard mode is also valid in non-standard mode.)

This distinction between standard and non-standard modes offers the network [defense in depth](<https://en.wikipedia.org/wiki/Defense_in_depth_(computing)>) against various kinds of attacks.

For example, on some networks, it's possible to prepare thousands of UTXOs with non-standard locking scripts that can be unlocked using very small (non-P2SH) transactions but require unusually excessive resources to validate (e.g. the maximum number of `OP_HASH256` operations). If these non-standard redeem transactions were relayed and automatically accepted by a miner, the miner could inadvertently create an unusually slow-to-validate block. If another block is found before most miners are able to validate the slow-to-validate block, the first miner's hashing power would be wasted (and they would lose mining revenue).

By maintaining this standard/non-standard distinction, the BCH ecosystem retains the flexibility to experiment with unusual, non-standard transactions while ensuring such activity is unlikely to negatively impact honest miners or the wider network.

### Single-Implementation VMB Test Files

For ease of use, VMB tests are divided into files by expected testing "mode", e.g. [`bch_vmb_tests_2025_standard.json`](./generated/bch_vmb_tests_2025_standard.json). This is the recommended way to use VMB tests (rather than the VM's "master" test file, e.g. [`bch_vmb_tests.json`](./generated/bch_vmb_tests.json), that requires more parsing).

Three files are available for each VM corresponding with the modes in which the contained tests should be run:

- **`standard`** – these tests must pass in both standard and non-standard mode.
- **`nonstandard`** – these tests must pass in non-standard mode but fail in standard mode.
- **`invalid`** – these tests must fail in both standard and non-standard mode.

For an example of VMB test usage, see [`bch-vmb-tests.spec.ts`](./bch-vmb-tests.spec.ts).

### Generating VMB Tests

Libauth's VMB tests are generated by the `yarn gen:vmb_tests` package script and committed to the repo. (Libauth's continuous integration tests also ensure that VMB tests remain up to date and passing on Libauth's VM implementations.)

### VMB Benchmarks

Libauth includes an extensive suite of VMB tests which are also designed to be used as benchmarks of worst-case performance across
