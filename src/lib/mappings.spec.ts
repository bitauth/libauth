/**
 * Libauth is designed to simultaneously support multiple chains/versions of
 * bitcoin without patches to the Libauth codebase. As such, Libauth can
 * potentially include support for multiple implementations of a particular data
 * structure. By convention, Libauth identifies chain-specific implementations
 * with an uppercase currency symbol suffix.
 *
 * For example, a "transaction" may include different properties depending on
 * the chain for which it is created. The type {@link TransactionBCH} specifies
 * a transaction intended for the BCH network, while the type
 * {@link TransactionBTC} specifies a transaction intended for BTC.
 *
 * For convenience, unless another chain is specified, Libauth types refer to
 * their BCH implementation, e.g. {@link Transaction} is an alias for
 * {@link TransactionBCH}.
 *
 * This file tests these default mappings.
 */

import test from 'ava';

import type {
  AssertTypesEqual,
  AuthenticationProgram,
  AuthenticationProgramBCH,
  AuthenticationProgramCommon,
  AuthenticationProgramStateBCH,
  AuthenticationProgramStateCommon,
  ResolvedTransaction,
  ResolvedTransactionBCH,
  ResolvedTransactionCommon,
  Transaction,
  TransactionBCH,
  TransactionCommon,
} from './lib';
import {
  AuthenticationErrorBCH,
  AuthenticationErrorBCH2022,
  cloneAuthenticationProgramState,
  cloneAuthenticationProgramStateBCH,
  cloneAuthenticationProgramStateCommon,
  compilerConfigurationToCompiler,
  compilerConfigurationToCompilerBCH,
  ConsensusBCH,
  ConsensusCommon,
  createCompiler,
  createCompilerBCH,
  createInstructionSetBCH,
  createInstructionSetBCH2022,
  createVirtualMachineBCH,
  createVirtualMachineBCH2022,
  decodeTransaction,
  decodeTransactionBCH,
  decodeTransactionCommon,
  decodeTransactionUnsafe,
  decodeTransactionUnsafeBCH,
  decodeTransactionUnsafeCommon,
  encodeTransaction,
  encodeTransactionBCH,
  encodeTransactionCommon,
  OpcodeDescriptions,
  OpcodeDescriptionsBCH,
  OpcodeDescriptionsBCH2022,
  Opcodes,
  OpcodesBCH,
  OpcodesBCH2022,
} from './lib.js';

type TypeTests =
  | AssertTypesEqual<
      AuthenticationProgramStateBCH,
      AuthenticationProgramStateCommon
    >
  | AssertTypesEqual<AuthenticationProgramBCH, AuthenticationProgram>
  | AssertTypesEqual<AuthenticationProgramBCH, AuthenticationProgramCommon>
  | AssertTypesEqual<ResolvedTransactionBCH, ResolvedTransaction>
  | AssertTypesEqual<ResolvedTransactionBCH, ResolvedTransactionCommon>
  | AssertTypesEqual<TransactionBCH, Transaction>
  | AssertTypesEqual<TransactionBCH, TransactionCommon>
  | AssertTypesEqual<typeof ConsensusCommon, typeof ConsensusBCH>
  | AssertTypesEqual<typeof OpcodeDescriptionsBCH, typeof OpcodeDescriptions>
  | AssertTypesEqual<typeof OpcodesBCH, typeof Opcodes>;
// TODO: AssertTypesEqual<AuthenticationProgramStateBCH, AuthenticationProgramState>`

test('Libauth exposes all expected mappings', (t) => {
  const testTypes: TypeTests = true;
  t.true(testTypes);
  t.deepEqual(AuthenticationErrorBCH2022, AuthenticationErrorBCH);
  t.deepEqual(
    cloneAuthenticationProgramStateCommon,
    cloneAuthenticationProgramStateBCH
  );
  t.deepEqual(
    cloneAuthenticationProgramState,
    cloneAuthenticationProgramStateBCH
  );
  t.deepEqual(
    compilerConfigurationToCompilerBCH,
    compilerConfigurationToCompiler
  );
  t.deepEqual(createInstructionSetBCH2022, createInstructionSetBCH);
  t.deepEqual(createVirtualMachineBCH2022, createVirtualMachineBCH);
  t.deepEqual(ConsensusCommon, ConsensusBCH);
  t.deepEqual(createCompilerBCH, createCompiler);
  t.deepEqual(decodeTransactionCommon, decodeTransactionBCH);
  t.deepEqual(decodeTransaction, decodeTransactionBCH);
  t.deepEqual(decodeTransactionUnsafeCommon, decodeTransactionUnsafeBCH);
  t.deepEqual(decodeTransactionUnsafe, decodeTransactionUnsafeBCH);
  t.deepEqual(encodeTransactionCommon, encodeTransactionBCH);
  t.deepEqual(encodeTransaction, encodeTransactionBCH);
  t.deepEqual(OpcodeDescriptionsBCH2022, OpcodeDescriptionsBCH);
  t.deepEqual(OpcodeDescriptionsBCH, OpcodeDescriptions);
  t.deepEqual(OpcodesBCH2022, OpcodesBCH);
  t.deepEqual(Opcodes, OpcodesBCH);
});