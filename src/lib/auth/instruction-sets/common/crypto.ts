/* istanbul ignore file */ // TODO: stabilize & test

import { Ripemd160, Secp256k1, Sha256 } from '../../../crypto/crypto';
import { CommonState, StackState } from '../../state';
import { Operation } from '../../virtual-machine';
import { serializeAuthenticationInstructions } from '../instruction-sets';
import { combineOperations, pushToStack, useOneStackItem } from './combinators';
import {
  applyError,
  booleanToScriptNumber,
  CommonAuthenticationError,
  CommonConsensus,
  ErrorState,
  isScriptNumberError,
  MinimumProgramState,
  parseBytesAsScriptNumber
} from './common';
import {
  decodeBitcoinSignature,
  isValidPublicKeyEncoding,
  isValidSignatureEncoding
} from './encoding';
import { opVerify } from './flow-control';
import { CommonOpcodes } from './opcodes';
import { generateBitcoinCashSigningSerialization } from './signing-serialization';

export { Ripemd160, Sha256, Secp256k1 };

// export const codeSeparator = <
// todo  ProgramState extends MinimumProgramState & CommonProgramState
// >(): Operator<ProgramState> => ({
//   asm: 'OP_CODESEPARATOR',
//   description: 'Mark this byte as the beginning of this scripts signed data.',
//   operation: (state: ProgramState) => {
//     // tslint:disable-next-line:no-expression-statement no-object-mutation
//     state.lastCodeSeparator = state.ip;
//     return state;
//   }
// });

export const opHash160 = <
  Opcodes,
  ProgramState extends MinimumProgramState<Opcodes> &
    StackState &
    ErrorState<InstructionSetError>,
  InstructionSetError
>(
  sha256: Sha256,
  ripemd160: Ripemd160
): Operation<ProgramState> => (state: ProgramState) =>
  useOneStackItem(state, (nextState, value) =>
    pushToStack(nextState, ripemd160.hash(sha256.hash(value)))
  );

export const opCheckSig = <
  Opcodes,
  ProgramState extends CommonState<Opcodes, InstructionSetError>,
  InstructionSetError
>(
  sha256: Sha256,
  secp256k1: Secp256k1
): Operation<ProgramState> => (state: ProgramState) => {
  const publicKey = state.stack.pop();
  const bitcoinEncodedSignature = state.stack.pop();
  // tslint:disable-next-line:no-if-statement
  if (publicKey === undefined || bitcoinEncodedSignature === undefined) {
    return applyError<ProgramState, InstructionSetError>(
      CommonAuthenticationError.emptyStack,
      state
    );
  }
  // tslint:disable-next-line:no-if-statement
  if (!isValidPublicKeyEncoding(publicKey)) {
    return applyError<ProgramState, InstructionSetError>(
      CommonAuthenticationError.invalidPublicKeyEncoding,
      state
    );
  }
  // tslint:disable-next-line:no-if-statement
  if (!isValidSignatureEncoding(bitcoinEncodedSignature)) {
    return applyError<ProgramState, InstructionSetError>(
      CommonAuthenticationError.invalidSignatureEncoding,
      state
    );
  }
  const coveredScript = serializeAuthenticationInstructions(
    state.instructions
  ).subarray(state.lastCodeSeparator + 1);
  const { signingSerializationType, signature } = decodeBitcoinSignature(
    bitcoinEncodedSignature
  );

  const serialization = generateBitcoinCashSigningSerialization(
    state.version,
    state.transactionOutpointsHash,
    state.transactionSequenceNumbersHash,
    state.outpointTransactionHash,
    state.outpointIndex,
    coveredScript,
    state.outputValue,
    state.sequenceNumber,
    state.correspondingOutputHash,
    state.transactionOutputsHash,
    state.locktime,
    signingSerializationType
  );
  const digest = sha256.hash(sha256.hash(serialization));
  // tslint:disable-next-line:no-expression-statement
  state.stack.push(
    booleanToScriptNumber(
      secp256k1.verifySignatureDERLowS(signature, publicKey, digest)
    )
  );
  return state;
};

const enum Multisig {
  maximumPublicKeys = 20
}

export const opCheckMultiSig = <
  Opcodes,
  ProgramState extends CommonState<Opcodes, InstructionSetError>,
  InstructionSetError
>(
  sha256: Sha256,
  secp256k1: Secp256k1
) =>
  // tslint:disable-next-line:cyclomatic-complexity
  (state: ProgramState) => {
    const potentialPublicKeysBytes = state.stack.pop();

    // tslint:disable-next-line:no-if-statement
    if (potentialPublicKeysBytes === undefined) {
      return applyError<ProgramState, InstructionSetError>(
        CommonAuthenticationError.emptyStack,
        state
      );
    }
    const potentialPublicKeysParsed = parseBytesAsScriptNumber(
      potentialPublicKeysBytes
    );
    const potentialPublicKeys = Number(potentialPublicKeysParsed);

    // tslint:disable-next-line:no-if-statement
    if (
      isScriptNumberError(potentialPublicKeysParsed) ||
      potentialPublicKeys < 0
    ) {
      return applyError<ProgramState, InstructionSetError>(
        CommonAuthenticationError.invalidNaturalNumber,
        state
      );
    }
    // tslint:disable-next-line:no-if-statement
    if (potentialPublicKeys > Multisig.maximumPublicKeys) {
      return applyError<ProgramState, InstructionSetError>(
        CommonAuthenticationError.exceedsMaximumMultisigPublicKeyCount,
        state
      );
    }
    const publicKeys = state.stack.splice(-potentialPublicKeys);

    // tslint:disable-next-line:no-expression-statement no-object-mutation
    state.operationCount += potentialPublicKeys;
    // tslint:disable-next-line:no-if-statement
    if (state.operationCount > CommonConsensus.maximumOperationCount) {
      return applyError<ProgramState, InstructionSetError>(
        CommonAuthenticationError.exceededMaximumOperationCount,
        state
      );
    }

    const requiredApprovingPublicKeysBytes = state.stack.pop();
    if (requiredApprovingPublicKeysBytes === undefined) {
      // tslint:disable-line:no-if-statement
      return applyError<ProgramState, InstructionSetError>(
        CommonAuthenticationError.emptyStack,
        state
      );
    }
    const requiredApprovingPublicKeysParsed = parseBytesAsScriptNumber(
      requiredApprovingPublicKeysBytes
    );
    const requiredApprovingPublicKeys = Number(
      requiredApprovingPublicKeysParsed
    );

    // tslint:disable-next-line:no-if-statement
    if (
      isScriptNumberError(requiredApprovingPublicKeysParsed) ||
      requiredApprovingPublicKeys < 0
    ) {
      return applyError<ProgramState, InstructionSetError>(
        CommonAuthenticationError.invalidNaturalNumber,
        state
      );
    }

    // tslint:disable-next-line:no-if-statement
    if (requiredApprovingPublicKeys > potentialPublicKeys) {
      return applyError<ProgramState, InstructionSetError>(
        CommonAuthenticationError.insufficientPublicKeys,
        state
      );
    }

    const signatures = state.stack.splice(-requiredApprovingPublicKeys);

    const protocolBugValue = state.stack.pop();

    // tslint:disable-next-line:no-if-statement
    if (protocolBugValue === undefined) {
      return applyError<ProgramState, InstructionSetError>(
        CommonAuthenticationError.emptyStack,
        state
      );
    }

    // TODO: this is enforced for BTC, but will only be enforced on BCH in 2019May
    // tslint:disable-next-line:no-if-statement
    if (protocolBugValue.length !== 0) {
      return applyError<ProgramState, InstructionSetError>(
        CommonAuthenticationError.invalidProtocolBugValue,
        state
      );
    }

    const coveredScript = serializeAuthenticationInstructions(
      state.instructions
    ).subarray(state.lastCodeSeparator + 1);

    let approvingPublicKeys = 0; // tslint:disable-line:no-let
    let remainingSignatures = signatures.length; // tslint:disable-line:no-let
    let remainingPublicKeys = publicKeys.length; // tslint:disable-line:no-let
    while (
      remainingSignatures > 0 &&
      approvingPublicKeys + remainingPublicKeys >= remainingSignatures &&
      approvingPublicKeys !== requiredApprovingPublicKeys
    ) {
      const publicKey = publicKeys[remainingPublicKeys - 1];
      const bitcoinEncodedSignature = signatures[remainingSignatures - 1];

      // tslint:disable-next-line:no-if-statement
      if (!isValidPublicKeyEncoding(publicKey)) {
        return applyError<ProgramState, InstructionSetError>(
          CommonAuthenticationError.invalidPublicKeyEncoding,
          state
        );
      }

      // tslint:disable-next-line:no-if-statement
      if (!isValidSignatureEncoding(bitcoinEncodedSignature)) {
        return applyError<ProgramState, InstructionSetError>(
          CommonAuthenticationError.invalidSignatureEncoding,
          state
        );
      }

      const { signingSerializationType, signature } = decodeBitcoinSignature(
        bitcoinEncodedSignature
      );

      const serialization = generateBitcoinCashSigningSerialization(
        state.version,
        state.transactionOutpointsHash,
        state.transactionSequenceNumbersHash,
        state.outpointTransactionHash,
        state.outpointIndex,
        coveredScript,
        state.outputValue,
        state.sequenceNumber,
        state.correspondingOutputHash,
        state.transactionOutputsHash,
        state.locktime,
        signingSerializationType
      );
      const digest = sha256.hash(sha256.hash(serialization));

      const signed = secp256k1.verifySignatureDERLowS(
        signature,
        publicKey,
        digest
      );

      // tslint:disable-next-line:no-if-statement
      if (signed) {
        approvingPublicKeys++; // tslint:disable-line:no-expression-statement
        remainingSignatures--; // tslint:disable-line:no-expression-statement
      }
      remainingPublicKeys--; // tslint:disable-line:no-expression-statement
    }

    return pushToStack(
      state,
      booleanToScriptNumber(approvingPublicKeys === requiredApprovingPublicKeys)
    );
  };

export const opCheckSigVerify = <
  Opcodes,
  ProgramState extends CommonState<Opcodes, InstructionSetError>,
  InstructionSetError
>(
  sha256: Sha256,
  secp256k1: Secp256k1
): Operation<ProgramState> =>
  combineOperations(
    opCheckSig<Opcodes, ProgramState, InstructionSetError>(sha256, secp256k1),
    opVerify<ProgramState, InstructionSetError>()
  );

export const opCheckMultiSigVerify = <
  Opcodes,
  ProgramState extends CommonState<Opcodes, InstructionSetError>,
  InstructionSetError
>(
  sha256: Sha256,
  secp256k1: Secp256k1
): Operation<ProgramState> =>
  combineOperations(
    opCheckMultiSig<Opcodes, ProgramState, InstructionSetError>(
      sha256,
      secp256k1
    ),
    opVerify<ProgramState, InstructionSetError>()
  );

export const cryptoOperations = <
  Opcodes,
  ProgramState extends CommonState<Opcodes, InstructionSetError>,
  InstructionSetError
>(
  sha256: Sha256,
  ripemd160: Ripemd160,
  secp256k1: Secp256k1
) => ({
  [CommonOpcodes.OP_HASH160]: opHash160<
    Opcodes,
    ProgramState,
    InstructionSetError
  >(sha256, ripemd160),
  [CommonOpcodes.OP_CHECKSIG]: opCheckSig<
    Opcodes,
    ProgramState,
    InstructionSetError
  >(sha256, secp256k1),
  [CommonOpcodes.OP_CHECKSIGVERIFY]: opCheckSigVerify<
    Opcodes,
    ProgramState,
    InstructionSetError
  >(sha256, secp256k1),
  [CommonOpcodes.OP_CHECKMULTISIG]: opCheckMultiSig<
    Opcodes,
    ProgramState,
    InstructionSetError
  >(sha256, secp256k1),
  [CommonOpcodes.OP_CHECKMULTISIGVERIFY]: opCheckMultiSigVerify<
    Opcodes,
    ProgramState,
    InstructionSetError
  >(sha256, secp256k1)
});
