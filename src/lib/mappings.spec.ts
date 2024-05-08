/**
 * Libauth is designed to simultaneously support multiple chains/versions of
 * bitcoin without patches to the Libauth codebase. As such, Libauth can
 * potentially include support for multiple implementations of a particular data
 * structure. By convention, Libauth identifies chain-specific implementations
 * with an uppercase currency symbol suffix.
 *
 * For example, a "transaction" may include different properties depending on
 * the chain for which it is created. The type {@link TransactionBch} specifies
 * a transaction intended for the BCH network, while the type
 * {@link TransactionBtc} specifies a transaction intended for BTC.
 *
 * For convenience, unless another chain is specified, Libauth types refer to
 * their BCH implementation, e.g. {@link Transaction} is an alias for
 * {@link TransactionBch}.
 *
 * This file tests these default mappings.
 */

import test from 'ava';

import type {
  AssertTypesEqual,
  AuthenticationProgram,
  AuthenticationProgramBch,
  AuthenticationProgramCommon,
  AuthenticationProgramState,
  AuthenticationProgramStateBch,
  AuthenticationProgramStateCommon,
  ResolvedTransaction,
  ResolvedTransactionBch,
  ResolvedTransactionCommon,
  Transaction,
  TransactionBch,
  TransactionCommon,
} from './lib.js';
import {
  AuthenticationErrorBch,
  AuthenticationErrorBch2023,
  compilerConfigurationToCompiler,
  compilerConfigurationToCompilerBch,
  ConsensusBch,
  ConsensusCommon,
  createCompiler,
  createCompilerBch,
  createInstructionSetBch,
  createInstructionSetBch2023,
  createVirtualMachineBch,
  createVirtualMachineBch2023,
  decodeTransaction,
  decodeTransactionBch,
  decodeTransactionCommon,
  decodeTransactionUnsafe,
  decodeTransactionUnsafeBch,
  decodeTransactionUnsafeCommon,
  encodeTransaction,
  encodeTransactionBch,
  encodeTransactionCommon,
  OpcodeDescriptions,
  OpcodeDescriptionsBch,
  OpcodeDescriptionsBch2023,
  Opcodes,
  OpcodesBch,
  OpcodesBch2023,
  SigningSerializationType,
  SigningSerializationTypeBch,
} from './lib.js';

/* eslint-disable @typescript-eslint/no-duplicate-type-constituents */
type TypeTests =
  | AssertTypesEqual<
      AuthenticationProgramStateBch,
      AuthenticationProgramStateCommon
    >
  | AssertTypesEqual<AuthenticationProgramBch, AuthenticationProgram>
  | AssertTypesEqual<AuthenticationProgramBch, AuthenticationProgramCommon>
  | AssertTypesEqual<AuthenticationProgramStateBch, AuthenticationProgramState>
  | AssertTypesEqual<ResolvedTransactionBch, ResolvedTransaction>
  | AssertTypesEqual<ResolvedTransactionBch, ResolvedTransactionCommon>
  | AssertTypesEqual<TransactionBch, Transaction>
  | AssertTypesEqual<TransactionBch, TransactionCommon>
  | AssertTypesEqual<typeof ConsensusCommon, typeof ConsensusBch>
  | AssertTypesEqual<typeof OpcodeDescriptionsBch, typeof OpcodeDescriptions>
  | AssertTypesEqual<typeof OpcodesBch, typeof Opcodes>;
/* eslint-enable @typescript-eslint/no-duplicate-type-constituents */

test('Libauth exposes all expected mappings', (t) => {
  const testTypes: TypeTests = true;
  t.true(testTypes);
  t.deepEqual(AuthenticationErrorBch2023, AuthenticationErrorBch);
  t.deepEqual(
    compilerConfigurationToCompilerBch,
    compilerConfigurationToCompiler,
  );
  t.deepEqual(createInstructionSetBch2023, createInstructionSetBch);
  t.deepEqual(createVirtualMachineBch2023, createVirtualMachineBch);
  t.deepEqual(ConsensusCommon, ConsensusBch);
  t.deepEqual(createCompilerBch, createCompiler);
  t.deepEqual(decodeTransactionCommon, decodeTransactionBch);
  t.deepEqual(decodeTransaction, decodeTransactionBch);
  t.deepEqual(decodeTransactionUnsafeCommon, decodeTransactionUnsafeBch);
  t.deepEqual(decodeTransactionUnsafe, decodeTransactionUnsafeBch);
  t.deepEqual(encodeTransactionCommon, encodeTransactionBch);
  t.deepEqual(encodeTransaction, encodeTransactionBch);
  t.deepEqual(OpcodeDescriptionsBch2023, OpcodeDescriptionsBch);
  t.deepEqual(OpcodeDescriptionsBch, OpcodeDescriptions);
  t.deepEqual(OpcodesBch2023, OpcodesBch);
  t.deepEqual(Opcodes, OpcodesBch);
  t.deepEqual(SigningSerializationType, SigningSerializationTypeBch);
});
