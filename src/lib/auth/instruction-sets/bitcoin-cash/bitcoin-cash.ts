/* istanbul ignore file */ // TODO: stabilize & test

// TODO: unimplemented consensus rules – sig op count, max script length, etc.
// TODO: error if missing ENDIF
/*
// before: (state: BitcoinCashAuthenticationProgramState) => {
//   // tslint:disable-next-line:no-object-mutation no-expression-statement
//   state.ip++;
//   const operation = state.instructions[state.ip];
//   // tslint:disable-next-line:no-if-statement
//   if (operation !== undefined) {
//     // tslint:disable-next-line:no-object-mutation no-expression-statement
//     state.operationCount++;
//     // tslint:disable-next-line:no-if-statement
//     if (state.operationCount > CommonConsensus.maximumOperationCount) {
//       return applyError(
//         BitcoinCashAuthenticationError.exceededMaximumOperationCount,
//         state
//       );
//     }
//   }
//   return state;
// },
*/

import {
  instantiateRipemd160,
  instantiateSecp256k1,
  instantiateSha256,
  Secp256k1
} from '../../../crypto/crypto';
import {
  AuthenticationVirtualMachine,
  createAuthenticationVirtualMachine,
  InstructionSet
} from '../../virtual-machine';
import {
  AuthenticationProgram,
  cloneStack,
  commonOperations,
  CommonProgramInternalState,
  createCommonInternalProgramState,
  createEmptyCommonProgramState,
  Ripemd160,
  Sha256,
  stackElementIsTruthy,
  TransactionInputState,
  undefinedOperation
} from '../common/common';
import {
  AuthenticationInstruction,
  authenticationInstructionsAreMalformed,
  parseScript
} from '../instruction-sets';
import { BitcoinCashOpcodes } from './bitcoin-cash-opcodes';

export { BitcoinCashOpcodes };

export enum BitcoinCashAuthenticationError {
  exceededMaximumOperationCount = 'Script exceeded the maximum operation count (201 operations).',
  malformedP2shScript = 'Redeem script was malformed prior to P2SH evaluation.'
}

// tslint:disable-next-line:no-empty-interface
export interface BitcoinCashAuthenticationProgramExternalState
  extends TransactionInputState {}

export interface BitcoinCashAuthenticationProgramInternalState<
  Opcodes = BitcoinCashOpcodes,
  Errors = BitcoinCashAuthenticationError
> extends CommonProgramInternalState<Opcodes, Errors> {}

export interface BitcoinCashAuthenticationProgramState<
  Opcodes = BitcoinCashOpcodes,
  Errors = BitcoinCashAuthenticationError
>
  extends BitcoinCashAuthenticationProgramExternalState,
    BitcoinCashAuthenticationProgramInternalState<Opcodes, Errors> {}

export const bitcoinCashInstructionSet = (
  sha256: Sha256,
  ripemd160: Ripemd160,
  secp256k1: Secp256k1
): InstructionSet<BitcoinCashAuthenticationProgramState> => ({
  clone: (state: BitcoinCashAuthenticationProgramState) => ({
    ...(state.error !== undefined ? { error: state.error } : {}),
    alternateStack: state.alternateStack.slice(),
    correspondingOutputHash: state.correspondingOutputHash.slice(),
    executionStack: state.executionStack.slice(),
    instructions: state.instructions.slice(),
    ip: state.ip,
    lastCodeSeparator: state.lastCodeSeparator,
    locktime: state.locktime,
    operationCount: state.operationCount,
    outpointIndex: state.outpointIndex,
    outpointTransactionHash: state.outpointTransactionHash.slice(),
    outputValue: state.outputValue,
    sequenceNumber: state.sequenceNumber,
    signatureOperationsCount: state.signatureOperationsCount,
    stack: state.stack.slice(),
    transactionOutpointsHash: state.transactionOutpointsHash.slice(),
    transactionOutputsHash: state.transactionOutputsHash.slice(),
    transactionSequenceNumbersHash: state.transactionSequenceNumbersHash.slice(),
    version: state.version
  }),
  continue: (state: BitcoinCashAuthenticationProgramState) =>
    state.error === undefined && state.ip < state.instructions.length,
  operations: {
    ...commonOperations<
      BitcoinCashOpcodes,
      BitcoinCashAuthenticationProgramState,
      BitcoinCashAuthenticationError
    >(sha256, ripemd160, secp256k1)
  },
  ...undefinedOperation<
    BitcoinCashAuthenticationProgramState,
    BitcoinCashAuthenticationError
  >()
});

const enum PayToScriptHash {
  length = 3,
  lastElement = 2
}

export const isPayToScriptHash = <Opcodes>(
  verificationInstructions: ReadonlyArray<AuthenticationInstruction<Opcodes>>
) =>
  verificationInstructions.length === PayToScriptHash.length &&
  ((verificationInstructions[0].opcode as unknown) as number) ===
    BitcoinCashOpcodes.OP_HASH160 &&
  ((verificationInstructions[1].opcode as unknown) as number) ===
    BitcoinCashOpcodes.OP_PUSHBYTES_20 &&
  ((verificationInstructions[PayToScriptHash.lastElement]
    .opcode as unknown) as number) === BitcoinCashOpcodes.OP_EQUAL;

// const isPayToScriptHash = (lockingScript: Uint8Array) =>
//   lockingScript.length === PayToScriptHash.length &&
//   lockingScript[0] === BitcoinCashOpcodes.OP_HASH160 &&
//   lockingScript[1] === BitcoinCashOpcodes.OP_PUSHBYTES_20 &&
//   lockingScript[PayToScriptHash.lastElement] === BitcoinCashOpcodes.OP_EQUAL;

// const enum P2shError {
//   asm = '[P2SH error]',
//   pushOnly = 'P2SH error: unlockingScript must be push-only.',
//   emptyStack = 'P2SH error: unlockingScript must not leave an empty stack.'
// }

/**
 * From C++ implementation:
 * Note that IsPushOnly() *does* consider OP_RESERVED to be a push-type
 * opcode, however execution of OP_RESERVED fails, so it's not relevant to
 * P2SH/BIP62 as the scriptSig would fail prior to the P2SH special
 * validation code being executed.
 */
// const isPushOnly = (operations: ReadonlyArray<number>) =>
//   operations.every(value => value < BitcoinCashOpcodes.OP_16);

/**
 * TODO: describe
 * @param program TODO
 * @param instructions TODO
 * @param stack TODO
 */
export const createBitcoinCashProgramState = <Opcodes = BitcoinCashOpcodes>(
  instructions: ReadonlyArray<AuthenticationInstruction<Opcodes>>,
  stack: Uint8Array[], // tslint:disable-line:readonly-array
  programState: AuthenticationProgram<
    Opcodes,
    BitcoinCashAuthenticationProgramExternalState
  >['state']
): BitcoinCashAuthenticationProgramState<Opcodes> => ({
  ...createCommonInternalProgramState(instructions, stack),
  ...programState
});

export const createEmptyBitcoinCashProgramState = createEmptyCommonProgramState as (
  instructions: ReadonlyArray<AuthenticationInstruction<BitcoinCashOpcodes>>,
  stack?: Uint8Array[] // tslint:disable-line:readonly-array
) => BitcoinCashAuthenticationProgramState;

/**
 * Check whether a resulting `BitcoinCashAuthenticationProgramState` is valid
 * according to network consensus rules.
 *
 * @param state the `BitcoinCashAuthenticationProgramState` to validate
 */
export const validateBitcoinCashAuthenticationProgramState = (
  state: BitcoinCashAuthenticationProgramState
) =>
  state.error !== undefined &&
  state.stack.length === 1 &&
  stackElementIsTruthy(state.stack[0]);

export const evaluateBitcoinCashAuthenticationProgram = <
  Opcodes = BitcoinCashOpcodes
>(
  vm: AuthenticationVirtualMachine<
    BitcoinCashAuthenticationProgramState<Opcodes>
  >,
  program: AuthenticationProgram<
    Opcodes,
    BitcoinCashAuthenticationProgramExternalState
  >
): BitcoinCashAuthenticationProgramState<Opcodes> => {
  const unlockingResult = vm.evaluate(
    createBitcoinCashProgramState(
      program.initializationInstructions,
      [],
      program.state
    )
  );
  // tslint:disable-next-line:no-if-statement
  if (unlockingResult.error !== undefined) {
    return unlockingResult;
  }
  const lockingResult = vm.evaluate(
    createBitcoinCashProgramState(
      program.verificationInstructions,
      unlockingResult.stack,
      program.state
    )
  );
  // tslint:disable-next-line:no-if-statement
  if (!isPayToScriptHash(program.verificationInstructions)) {
    return lockingResult;
  }

  const p2shStack = cloneStack(unlockingResult.stack);
  // tslint:disable-next-line: strict-boolean-expressions
  const p2shScript = p2shStack.pop() || Uint8Array.of();
  const p2shInstructions = parseScript<Opcodes>(p2shScript);
  return authenticationInstructionsAreMalformed(p2shInstructions)
    ? {
        ...lockingResult,
        error: BitcoinCashAuthenticationError.malformedP2shScript
      }
    : vm.evaluate(
        createBitcoinCashProgramState(
          p2shInstructions,
          p2shStack,
          program.state
        )
      );
};

export const instantiateBitcoinCashVirtualMachine = async () => {
  const [sha256, ripemd160, secp256k1] = await Promise.all([
    instantiateSha256(),
    instantiateRipemd160(),
    instantiateSecp256k1()
  ]);
  return createAuthenticationVirtualMachine(
    bitcoinCashInstructionSet(sha256, ripemd160, secp256k1)
  );
};
