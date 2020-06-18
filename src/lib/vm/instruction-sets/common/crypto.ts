import { Ripemd160, Secp256k1, Sha1, Sha256 } from '../../../crypto/crypto';
import { Operation } from '../../virtual-machine';
import {
  AuthenticationProgramStateCommon,
  AuthenticationProgramStateError,
  AuthenticationProgramStateMinimum,
  AuthenticationProgramStateStack,
} from '../../vm-types';
import { ConsensusBCH } from '../bch/bch-types';
import { serializeAuthenticationInstructions } from '../instruction-sets-utils';

import {
  combineOperations,
  pushToStack,
  useOneScriptNumber,
  useOneStackItem,
  useTwoStackItems,
} from './combinators';
import { booleanToScriptNumber, ConsensusCommon } from './common';
import {
  decodeBitcoinSignature,
  isValidPublicKeyEncoding,
  isValidSignatureEncodingBCHTransaction,
} from './encoding';
import { applyError, AuthenticationErrorCommon } from './errors';
import { opVerify } from './flow-control';
import { OpcodesCommon } from './opcodes';
import { generateSigningSerializationBCH } from './signing-serialization';

export { Ripemd160, Sha1, Sha256, Secp256k1 };

export const opRipemd160 = <
  Opcodes,
  State extends AuthenticationProgramStateMinimum<Opcodes> &
    AuthenticationProgramStateStack &
    AuthenticationProgramStateError<Errors>,
  Errors
>({
  ripemd160,
}: {
  ripemd160: { hash: Ripemd160['hash'] };
}): Operation<State> => (state: State) =>
  useOneStackItem(state, (nextState, [value]) =>
    pushToStack(nextState, ripemd160.hash(value))
  );

export const opSha1 = <
  Opcodes,
  State extends AuthenticationProgramStateMinimum<Opcodes> &
    AuthenticationProgramStateStack &
    AuthenticationProgramStateError<Errors>,
  Errors
>({
  sha1,
}: {
  sha1: { hash: Sha1['hash'] };
}): Operation<State> => (state: State) =>
  useOneStackItem(state, (nextState, [value]) =>
    pushToStack(nextState, sha1.hash(value))
  );

export const opSha256 = <
  Opcodes,
  State extends AuthenticationProgramStateMinimum<Opcodes> &
    AuthenticationProgramStateStack &
    AuthenticationProgramStateError<Errors>,
  Errors
>({
  sha256,
}: {
  sha256: {
    hash: Sha256['hash'];
  };
}): Operation<State> => (state: State) =>
  useOneStackItem(state, (nextState, [value]) =>
    pushToStack(nextState, sha256.hash(value))
  );

export const opHash160 = <
  Opcodes,
  State extends AuthenticationProgramStateMinimum<Opcodes> &
    AuthenticationProgramStateStack &
    AuthenticationProgramStateError<Errors>,
  Errors
>({
  ripemd160,
  sha256,
}: {
  sha256: { hash: Sha256['hash'] };
  ripemd160: { hash: Ripemd160['hash'] };
}): Operation<State> => (state: State) =>
  useOneStackItem(state, (nextState, [value]) =>
    pushToStack(nextState, ripemd160.hash(sha256.hash(value)))
  );

export const opHash256 = <
  Opcodes,
  State extends AuthenticationProgramStateMinimum<Opcodes> &
    AuthenticationProgramStateStack &
    AuthenticationProgramStateError<Errors>,
  Errors
>({
  sha256,
}: {
  sha256: {
    hash: Sha256['hash'];
  };
}): Operation<State> => (state: State) =>
  useOneStackItem(state, (nextState, [value]) =>
    pushToStack(nextState, sha256.hash(sha256.hash(value)))
  );

export const opCodeSeparator = <
  Opcodes,
  State extends AuthenticationProgramStateMinimum<Opcodes> & {
    lastCodeSeparator: number;
  }
>(): Operation<State> => (state: State) => {
  // eslint-disable-next-line functional/no-expression-statement, functional/immutable-data
  state.lastCodeSeparator = state.ip;
  return state;
};

export const opCheckSig = <
  Opcodes,
  State extends AuthenticationProgramStateCommon<Opcodes, Errors>,
  Errors
>({
  flags,
  secp256k1,
  sha256,
}: {
  sha256: { hash: Sha256['hash'] };
  secp256k1: {
    verifySignatureSchnorr: Secp256k1['verifySignatureSchnorr'];
    verifySignatureDERLowS: Secp256k1['verifySignatureDERLowS'];
  };
  flags: { requireNullSignatureFailures: boolean };
}): Operation<State> => (s: State) =>
  // eslint-disable-next-line complexity
  useTwoStackItems(s, (state, [bitcoinEncodedSignature, publicKey]) => {
    if (!isValidPublicKeyEncoding(publicKey)) {
      return applyError<State, Errors>(
        AuthenticationErrorCommon.invalidPublicKeyEncoding,
        state
      );
    }
    if (!isValidSignatureEncodingBCHTransaction(bitcoinEncodedSignature)) {
      return applyError<State, Errors>(
        AuthenticationErrorCommon.invalidSignatureEncoding,
        state
      );
    }
    const coveredBytecode = serializeAuthenticationInstructions(
      state.instructions
    ).subarray(state.lastCodeSeparator + 1);
    const { signingSerializationType, signature } = decodeBitcoinSignature(
      bitcoinEncodedSignature
    );

    const serialization = generateSigningSerializationBCH({
      correspondingOutput: state.correspondingOutput,
      coveredBytecode,
      locktime: state.locktime,
      outpointIndex: state.outpointIndex,
      outpointTransactionHash: state.outpointTransactionHash,
      outputValue: state.outputValue,
      sequenceNumber: state.sequenceNumber,
      sha256,
      signingSerializationType,
      transactionOutpoints: state.transactionOutpoints,
      transactionOutputs: state.transactionOutputs,
      transactionSequenceNumbers: state.transactionSequenceNumbers,
      version: state.version,
    });
    const digest = sha256.hash(sha256.hash(serialization));

    // eslint-disable-next-line functional/no-expression-statement, functional/immutable-data
    state.signedMessages.push(serialization);

    const useSchnorr = signature.length === ConsensusBCH.schnorrSignatureLength;
    const success = useSchnorr
      ? secp256k1.verifySignatureSchnorr(signature, publicKey, digest)
      : secp256k1.verifySignatureDERLowS(signature, publicKey, digest);

    return !success &&
      flags.requireNullSignatureFailures &&
      signature.length !== 0
      ? applyError<State, Errors>(
          AuthenticationErrorCommon.nonNullSignatureFailure,
          state
        )
      : pushToStack(state, booleanToScriptNumber(success));
  });

const enum Multisig {
  maximumPublicKeys = 20,
}

export const opCheckMultiSig = <
  Opcodes,
  State extends AuthenticationProgramStateCommon<Opcodes, Errors>,
  Errors
>({
  flags: {
    requireMinimalEncoding,
    requireBugValueZero,
    requireNullSignatureFailures,
  },
  secp256k1,
  sha256,
}: {
  sha256: { hash: Sha256['hash'] };
  secp256k1: {
    verifySignatureDERLowS: Secp256k1['verifySignatureDERLowS'];
  };
  flags: {
    requireBugValueZero: boolean;
    requireMinimalEncoding: boolean;
    requireNullSignatureFailures: boolean;
  };
}) => (s: State) =>
  useOneScriptNumber(
    s,
    (state, publicKeysValue) => {
      const potentialPublicKeys = Number(publicKeysValue);

      if (potentialPublicKeys < 0) {
        return applyError<State, Errors>(
          AuthenticationErrorCommon.invalidNaturalNumber,
          state
        );
      }
      if (potentialPublicKeys > Multisig.maximumPublicKeys) {
        return applyError<State, Errors>(
          AuthenticationErrorCommon.exceedsMaximumMultisigPublicKeyCount,
          state
        );
      }
      const publicKeys =
        // eslint-disable-next-line functional/immutable-data
        potentialPublicKeys > 0 ? state.stack.splice(-potentialPublicKeys) : [];

      // eslint-disable-next-line functional/no-expression-statement, functional/immutable-data
      state.operationCount += potentialPublicKeys;

      return state.operationCount > ConsensusCommon.maximumOperationCount
        ? applyError<State, Errors>(
            AuthenticationErrorCommon.exceededMaximumOperationCount,
            state
          )
        : useOneScriptNumber(
            state,

            (nextState, approvingKeys) => {
              const requiredApprovingPublicKeys = Number(approvingKeys);

              if (requiredApprovingPublicKeys < 0) {
                return applyError<State, Errors>(
                  AuthenticationErrorCommon.invalidNaturalNumber,
                  nextState
                );
              }

              if (requiredApprovingPublicKeys > potentialPublicKeys) {
                return applyError<State, Errors>(
                  AuthenticationErrorCommon.insufficientPublicKeys,
                  nextState
                );
              }

              const signatures =
                requiredApprovingPublicKeys > 0
                  ? // eslint-disable-next-line functional/immutable-data
                    nextState.stack.splice(-requiredApprovingPublicKeys)
                  : [];

              return useOneStackItem(
                nextState,
                // eslint-disable-next-line complexity
                (finalState, [protocolBugValue]) => {
                  if (requireBugValueZero && protocolBugValue.length !== 0) {
                    return applyError<State, Errors>(
                      AuthenticationErrorCommon.invalidProtocolBugValue,
                      finalState
                    );
                  }

                  const coveredBytecode = serializeAuthenticationInstructions(
                    finalState.instructions
                  ).subarray(finalState.lastCodeSeparator + 1);

                  let approvingPublicKeys = 0; // eslint-disable-line functional/no-let
                  let remainingSignatures = signatures.length; // eslint-disable-line functional/no-let
                  let remainingPublicKeys = publicKeys.length; // eslint-disable-line functional/no-let
                  // eslint-disable-next-line functional/no-loop-statement
                  while (
                    remainingSignatures > 0 &&
                    remainingPublicKeys > 0 &&
                    approvingPublicKeys + remainingPublicKeys >=
                      remainingSignatures &&
                    approvingPublicKeys !== requiredApprovingPublicKeys
                  ) {
                    const publicKey = publicKeys[remainingPublicKeys - 1];
                    const bitcoinEncodedSignature =
                      signatures[remainingSignatures - 1];

                    if (!isValidPublicKeyEncoding(publicKey)) {
                      return applyError<State, Errors>(
                        AuthenticationErrorCommon.invalidPublicKeyEncoding,
                        finalState
                      );
                    }

                    if (
                      !isValidSignatureEncodingBCHTransaction(
                        bitcoinEncodedSignature
                      )
                    ) {
                      return applyError<State, Errors>(
                        AuthenticationErrorCommon.invalidSignatureEncoding,
                        finalState
                      );
                    }

                    const {
                      signingSerializationType,
                      signature,
                    } = decodeBitcoinSignature(bitcoinEncodedSignature);

                    const serialization = generateSigningSerializationBCH({
                      correspondingOutput: state.correspondingOutput,
                      coveredBytecode,
                      locktime: state.locktime,
                      outpointIndex: state.outpointIndex,
                      outpointTransactionHash: state.outpointTransactionHash,
                      outputValue: state.outputValue,
                      sequenceNumber: state.sequenceNumber,
                      sha256,
                      signingSerializationType,
                      transactionOutpoints: state.transactionOutpoints,
                      transactionOutputs: state.transactionOutputs,
                      transactionSequenceNumbers:
                        state.transactionSequenceNumbers,
                      version: state.version,
                    });
                    const digest = sha256.hash(sha256.hash(serialization));

                    // eslint-disable-next-line functional/no-expression-statement, functional/immutable-data
                    finalState.signedMessages.push(serialization);

                    if (
                      signature.length === ConsensusBCH.schnorrSignatureLength
                    ) {
                      return applyError<State, Errors>(
                        AuthenticationErrorCommon.schnorrSizedSignatureInCheckMultiSig,
                        finalState
                      );
                    }

                    const signed = secp256k1.verifySignatureDERLowS(
                      signature,
                      publicKey,
                      digest
                    );

                    // eslint-disable-next-line functional/no-conditional-statement
                    if (signed) {
                      approvingPublicKeys += 1; // eslint-disable-line functional/no-expression-statement
                      remainingSignatures -= 1; // eslint-disable-line functional/no-expression-statement
                    }
                    remainingPublicKeys -= 1; // eslint-disable-line functional/no-expression-statement
                  }

                  const success =
                    approvingPublicKeys === requiredApprovingPublicKeys;

                  if (
                    !success &&
                    requireNullSignatureFailures &&
                    !signatures.every((signature) => signature.length === 0)
                  ) {
                    return applyError<State, Errors>(
                      AuthenticationErrorCommon.nonNullSignatureFailure,
                      finalState
                    );
                  }

                  return pushToStack(
                    finalState,
                    booleanToScriptNumber(success)
                  );
                }
              );
            },
            { requireMinimalEncoding }
          );
    },
    { requireMinimalEncoding }
  );

export const opCheckSigVerify = <
  Opcodes,
  State extends AuthenticationProgramStateCommon<Opcodes, Errors>,
  Errors
>({
  flags,
  secp256k1,
  sha256,
}: {
  sha256: { hash: Sha256['hash'] };
  secp256k1: {
    verifySignatureSchnorr: Secp256k1['verifySignatureSchnorr'];
    verifySignatureDERLowS: Secp256k1['verifySignatureDERLowS'];
  };
  flags: {
    requireNullSignatureFailures: boolean;
  };
}): Operation<State> =>
  combineOperations(
    opCheckSig<Opcodes, State, Errors>({ flags, secp256k1, sha256 }),
    opVerify<State, Errors>()
  );

export const opCheckMultiSigVerify = <
  Opcodes,
  State extends AuthenticationProgramStateCommon<Opcodes, Errors>,
  Errors
>({
  flags,
  secp256k1,
  sha256,
}: {
  sha256: { hash: Sha256['hash'] };
  secp256k1: {
    verifySignatureDERLowS: Secp256k1['verifySignatureDERLowS'];
  };
  flags: {
    requireBugValueZero: boolean;
    requireMinimalEncoding: boolean;
    requireNullSignatureFailures: boolean;
  };
}): Operation<State> =>
  combineOperations(
    opCheckMultiSig<Opcodes, State, Errors>({ flags, secp256k1, sha256 }),
    opVerify<State, Errors>()
  );

export const cryptoOperations = <
  Opcodes,
  State extends AuthenticationProgramStateCommon<Opcodes, Errors>,
  Errors
>({
  flags,
  ripemd160,
  secp256k1,
  sha1,
  sha256,
}: {
  sha1: { hash: Sha1['hash'] };
  sha256: { hash: Sha256['hash'] };
  ripemd160: { hash: Ripemd160['hash'] };
  secp256k1: {
    verifySignatureSchnorr: Secp256k1['verifySignatureSchnorr'];
    verifySignatureDERLowS: Secp256k1['verifySignatureDERLowS'];
  };
  flags: {
    requireBugValueZero: boolean;
    requireMinimalEncoding: boolean;
    requireNullSignatureFailures: boolean;
  };
}) => ({
  [OpcodesCommon.OP_RIPEMD160]: opRipemd160<Opcodes, State, Errors>({
    ripemd160,
  }),
  [OpcodesCommon.OP_SHA1]: opSha1<Opcodes, State, Errors>({ sha1 }),
  [OpcodesCommon.OP_SHA256]: opSha256<Opcodes, State, Errors>({ sha256 }),
  [OpcodesCommon.OP_HASH160]: opHash160<Opcodes, State, Errors>({
    ripemd160,
    sha256,
  }),
  [OpcodesCommon.OP_HASH256]: opHash256<Opcodes, State, Errors>({ sha256 }),
  [OpcodesCommon.OP_CODESEPARATOR]: opCodeSeparator<Opcodes, State>(),
  [OpcodesCommon.OP_CHECKSIG]: opCheckSig<Opcodes, State, Errors>({
    flags,
    secp256k1,
    sha256,
  }),
  [OpcodesCommon.OP_CHECKSIGVERIFY]: opCheckSigVerify<Opcodes, State, Errors>({
    flags,
    secp256k1,
    sha256,
  }),
  [OpcodesCommon.OP_CHECKMULTISIG]: opCheckMultiSig<Opcodes, State, Errors>({
    flags,
    secp256k1,
    sha256,
  }),
  [OpcodesCommon.OP_CHECKMULTISIGVERIFY]: opCheckMultiSigVerify<
    Opcodes,
    State,
    Errors
  >({ flags, secp256k1, sha256 }),
});
