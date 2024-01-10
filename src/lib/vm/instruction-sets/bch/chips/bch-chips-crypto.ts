import {
  hash256,
  ripemd160 as internalRipemd160,
  secp256k1 as internalSecp256k1,
  sha1 as internalSha1,
  sha256 as internalSha256,
} from '../../../../crypto/crypto.js';
import { binToHex } from '../../../../format/format.js';
import type {
  AuthenticationProgramStateError,
  AuthenticationProgramStateMinimum,
  AuthenticationProgramStateResourceLimitsBCHCHIPs,
  AuthenticationProgramStateSignatureAnalysis,
  AuthenticationProgramStateStack,
  Operation,
  Ripemd160,
  Secp256k1,
  Sha1,
  Sha256,
} from '../../../../lib.js';
import {
  applyError,
  AuthenticationErrorCommon,
  booleanToVmNumber,
  combineOperations,
  ConsensusCommon,
  decodeBitcoinSignature,
  encodeAuthenticationInstructions,
  generateSigningSerializationBCH,
  isValidPublicKeyEncoding,
  isValidSignatureEncodingBCHRaw,
  isValidSignatureEncodingBCHTransaction,
  opVerify,
  pushToStack,
  useOneStackItem,
  useOneVmNumber,
  useThreeStackItems,
  useTwoStackItems,
} from '../../common/common.js';
import { SigningSerializationTypesBCH2023 } from '../2023/bch-2023.js';

import { AuthenticationErrorBCHCHIPs } from './bch-chips-errors.js';
import type { AuthenticationProgramStateBCHCHIPs } from './bch-chips-types.js';
import { ConsensusBCHCHIPs } from './bch-chips-types.js';

/**
 * Given a message length, compute and return the number of hash digest
 * iterations required. (See `CHIP-2021-05-vm-limits`)
 */
export const hashDigestIterations = (messageLength: number) =>
  // eslint-disable-next-line no-bitwise, @typescript-eslint/no-magic-numbers
  1 + (((messageLength + 8) / 64) | 0);

/**
 * Given a program state, increment the hash digest iteration count for a
 * message of the provided length. If the total would exceed the maximum, append
 * an error.
 *
 * @param state - the program state
 * @param messageLength - the message length
 * @param operation - the operation to execute if no error occurred
 */
export const incrementHashDigestIterations = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateResourceLimitsBCHCHIPs,
>(
  state: State,
  messageLength: number,
  operation: (nextState: State) => State,
) => {
  const requiredTotalIterations =
    state.hashDigestIterations + hashDigestIterations(messageLength);
  if (requiredTotalIterations > ConsensusBCHCHIPs.maximumHashDigestIterations) {
    return applyError(
      state,
      AuthenticationErrorBCHCHIPs.excessiveHashing,
      `Required cumulative iterations: ${requiredTotalIterations}`,
    );
  }
  return operation(state);
};

export const opRipemd160ChipLimits =
  <
    State extends AuthenticationProgramStateError &
      AuthenticationProgramStateMinimum &
      AuthenticationProgramStateResourceLimitsBCHCHIPs &
      AuthenticationProgramStateStack,
  >(
    {
      ripemd160,
    }: {
      ripemd160: { hash: Ripemd160['hash'] };
    } = { ripemd160: internalRipemd160 },
  ): Operation<State> =>
  (state: State) =>
    useOneStackItem(state, (nextState, [value]) =>
      incrementHashDigestIterations(nextState, value.length, (finalState) =>
        pushToStack(finalState, ripemd160.hash(value)),
      ),
    );

export const opSha1ChipLimits =
  <
    State extends AuthenticationProgramStateError &
      AuthenticationProgramStateMinimum &
      AuthenticationProgramStateResourceLimitsBCHCHIPs &
      AuthenticationProgramStateStack,
  >(
    {
      sha1,
    }: {
      sha1: { hash: Sha1['hash'] };
    } = { sha1: internalSha1 },
  ): Operation<State> =>
  (state: State) =>
    useOneStackItem(state, (nextState, [value]) =>
      incrementHashDigestIterations(nextState, value.length, (finalState) =>
        pushToStack(finalState, sha1.hash(value)),
      ),
    );

export const opSha256ChipLimits =
  <
    State extends AuthenticationProgramStateError &
      AuthenticationProgramStateMinimum &
      AuthenticationProgramStateResourceLimitsBCHCHIPs &
      AuthenticationProgramStateStack,
  >(
    {
      sha256,
    }: {
      sha256: {
        hash: Sha256['hash'];
      };
    } = { sha256: internalSha256 },
  ): Operation<State> =>
  (state: State) =>
    useOneStackItem(state, (nextState, [value]) =>
      incrementHashDigestIterations(nextState, value.length, (finalState) =>
        pushToStack(finalState, sha256.hash(value)),
      ),
    );

export const opHash160ChipLimits =
  <
    State extends AuthenticationProgramStateError &
      AuthenticationProgramStateMinimum &
      AuthenticationProgramStateResourceLimitsBCHCHIPs &
      AuthenticationProgramStateStack,
  >(
    {
      ripemd160,
      sha256,
    }: {
      sha256: { hash: Sha256['hash'] };
      ripemd160: { hash: Ripemd160['hash'] };
    } = { ripemd160: internalRipemd160, sha256: internalSha256 },
  ): Operation<State> =>
  (state: State) =>
    useOneStackItem(state, (nextState, [value]) =>
      incrementHashDigestIterations(nextState, value.length, (finalState) =>
        pushToStack(finalState, ripemd160.hash(sha256.hash(value))),
      ),
    );

export const opHash256ChipLimits =
  <
    State extends AuthenticationProgramStateError &
      AuthenticationProgramStateMinimum &
      AuthenticationProgramStateResourceLimitsBCHCHIPs &
      AuthenticationProgramStateStack,
  >(
    {
      sha256,
    }: {
      sha256: {
        hash: Sha256['hash'];
      };
    } = { sha256: internalSha256 },
  ): Operation<State> =>
  (state: State) =>
    useOneStackItem(state, (nextState, [value]) =>
      incrementHashDigestIterations(nextState, value.length, (finalState) =>
        pushToStack(finalState, hash256(value, sha256)),
      ),
    );

export const opCheckSigChipLimits =
  <State extends AuthenticationProgramStateBCHCHIPs>(
    {
      secp256k1,
      sha256,
    }: {
      sha256: { hash: Sha256['hash'] };
      secp256k1: {
        verifySignatureSchnorr: Secp256k1['verifySignatureSchnorr'];
        verifySignatureDERLowS: Secp256k1['verifySignatureDERLowS'];
      };
    } = { secp256k1: internalSecp256k1, sha256: internalSha256 },
  ): Operation<State> =>
  (s: State) =>
    // eslint-disable-next-line complexity
    useTwoStackItems(s, (state, [bitcoinEncodedSignature, publicKey]) => {
      if (!isValidPublicKeyEncoding(publicKey)) {
        return applyError(
          state,
          AuthenticationErrorCommon.invalidPublicKeyEncoding,
        );
      }
      if (
        !isValidSignatureEncodingBCHTransaction(
          bitcoinEncodedSignature,
          SigningSerializationTypesBCH2023,
        )
      ) {
        return applyError(
          state,
          AuthenticationErrorCommon.invalidSignatureEncoding,
          `Transaction signature (including signing serialization type): ${binToHex(
            bitcoinEncodedSignature,
          )}`,
        );
      }
      const coveredBytecode = encodeAuthenticationInstructions(
        state.instructions,
      ).subarray(state.lastCodeSeparator + 1);
      const { signingSerializationType, signature } = decodeBitcoinSignature(
        bitcoinEncodedSignature,
      );

      const serialization = generateSigningSerializationBCH(
        state.program,
        { coveredBytecode, signingSerializationType },
        sha256,
      );
      const requiredTotalIterations =
        state.hashDigestIterations + hashDigestIterations(serialization.length);
      if (
        requiredTotalIterations > ConsensusBCHCHIPs.maximumHashDigestIterations
      ) {
        return applyError(
          state,
          AuthenticationErrorBCHCHIPs.excessiveHashing,
          `Required cumulative iterations: ${requiredTotalIterations}`,
        );
      }
      const digest = hash256(serialization, sha256);

      // eslint-disable-next-line functional/no-expression-statements, functional/immutable-data
      state.signedMessages.push({ digest, serialization });

      const useSchnorr =
        signature.length === ConsensusCommon.schnorrSignatureLength;
      const success = useSchnorr
        ? secp256k1.verifySignatureSchnorr(signature, publicKey, digest)
        : secp256k1.verifySignatureDERLowS(signature, publicKey, digest);

      return !success && signature.length !== 0
        ? applyError(state, AuthenticationErrorCommon.nonNullSignatureFailure)
        : pushToStack(state, booleanToVmNumber(success));
    });

const enum Multisig {
  maximumPublicKeys = 20,
}

// TODO: implement schnorr multisig https://gitlab.com/bitcoin-cash-node/bchn-sw/bitcoincash-upgrade-specifications/-/blob/master/spec/2019-11-15-schnorrmultisig.md
export const opCheckMultiSigChipLimits =
  <State extends AuthenticationProgramStateBCHCHIPs>(
    {
      secp256k1,
      sha256,
    }: {
      sha256: { hash: Sha256['hash'] };
      secp256k1: {
        verifySignatureDERLowS: Secp256k1['verifySignatureDERLowS'];
      };
    } = { secp256k1: internalSecp256k1, sha256: internalSha256 },
  ) =>
  (s: State) =>
    useOneVmNumber(s, (state, publicKeysValue) => {
      const potentialPublicKeys = Number(publicKeysValue);

      if (potentialPublicKeys < 0) {
        return applyError(
          state,
          AuthenticationErrorCommon.invalidNaturalNumber,
        );
      }
      if (potentialPublicKeys > Multisig.maximumPublicKeys) {
        return applyError(
          state,
          AuthenticationErrorCommon.exceedsMaximumMultisigPublicKeyCount,
        );
      }
      const publicKeys =
        // eslint-disable-next-line functional/immutable-data
        potentialPublicKeys > 0 ? state.stack.splice(-potentialPublicKeys) : [];

      return useOneVmNumber(
        state,

        (nextState, approvingKeys) => {
          const requiredApprovingPublicKeys = Number(approvingKeys);

          if (requiredApprovingPublicKeys < 0) {
            return applyError(
              nextState,
              AuthenticationErrorCommon.invalidNaturalNumber,
            );
          }

          if (requiredApprovingPublicKeys > potentialPublicKeys) {
            return applyError(
              nextState,
              AuthenticationErrorCommon.insufficientPublicKeys,
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
              if (protocolBugValue.length !== 0) {
                return applyError(
                  finalState,
                  AuthenticationErrorCommon.invalidProtocolBugValue,
                );
              }

              const coveredBytecode = encodeAuthenticationInstructions(
                finalState.instructions,
              ).subarray(finalState.lastCodeSeparator + 1);

              let approvingPublicKeys = 0; // eslint-disable-line functional/no-let
              let remainingSignatures = signatures.length; // eslint-disable-line functional/no-let
              let remainingPublicKeys = publicKeys.length; // eslint-disable-line functional/no-let
              // eslint-disable-next-line functional/no-loop-statements
              while (
                remainingSignatures > 0 &&
                remainingPublicKeys > 0 &&
                approvingPublicKeys + remainingPublicKeys >=
                  remainingSignatures &&
                approvingPublicKeys !== requiredApprovingPublicKeys
              ) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                const publicKey = publicKeys[remainingPublicKeys - 1]!;
                const bitcoinEncodedSignature =
                  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                  signatures[remainingSignatures - 1]!;

                if (!isValidPublicKeyEncoding(publicKey)) {
                  return applyError(
                    finalState,
                    AuthenticationErrorCommon.invalidPublicKeyEncoding,
                  );
                }

                if (
                  !isValidSignatureEncodingBCHTransaction(
                    bitcoinEncodedSignature,
                    SigningSerializationTypesBCH2023,
                  )
                ) {
                  return applyError(
                    finalState,
                    AuthenticationErrorCommon.invalidSignatureEncoding,
                    `Transaction signature (including signing serialization type): ${binToHex(
                      bitcoinEncodedSignature,
                    )}`,
                  );
                }

                const { signingSerializationType, signature } =
                  decodeBitcoinSignature(bitcoinEncodedSignature);

                const serialization = generateSigningSerializationBCH(
                  state.program,
                  { coveredBytecode, signingSerializationType },
                  sha256,
                );
                const requiredTotalIterations =
                  state.hashDigestIterations +
                  hashDigestIterations(serialization.length);
                if (
                  requiredTotalIterations >
                  ConsensusBCHCHIPs.maximumHashDigestIterations
                ) {
                  return applyError(
                    state,
                    AuthenticationErrorBCHCHIPs.excessiveHashing,
                    `Required cumulative iterations: ${requiredTotalIterations}`,
                  );
                }
                const digest = hash256(serialization, sha256);

                // eslint-disable-next-line functional/no-expression-statements, functional/immutable-data
                finalState.signedMessages.push({ digest, serialization });

                if (
                  signature.length === ConsensusCommon.schnorrSignatureLength
                ) {
                  return applyError(
                    finalState,
                    AuthenticationErrorCommon.schnorrSizedSignatureInCheckMultiSig,
                  );
                }

                const signed = secp256k1.verifySignatureDERLowS(
                  signature,
                  publicKey,
                  digest,
                );

                // eslint-disable-next-line functional/no-conditional-statements
                if (signed) {
                  approvingPublicKeys += 1; // eslint-disable-line functional/no-expression-statements
                  remainingSignatures -= 1; // eslint-disable-line functional/no-expression-statements
                }
                remainingPublicKeys -= 1; // eslint-disable-line functional/no-expression-statements
              }

              const success =
                approvingPublicKeys === requiredApprovingPublicKeys;

              if (
                !success &&
                !signatures.every((signature) => signature.length === 0)
              ) {
                return applyError(
                  finalState,
                  AuthenticationErrorCommon.nonNullSignatureFailure,
                );
              }

              return pushToStack(finalState, booleanToVmNumber(success));
            },
          );
        },
      );
    });

export const opCheckSigVerifyChipLimits = <
  State extends AuthenticationProgramStateBCHCHIPs,
>(
  {
    secp256k1,
    sha256,
  }: {
    sha256: { hash: Sha256['hash'] };
    secp256k1: {
      verifySignatureSchnorr: Secp256k1['verifySignatureSchnorr'];
      verifySignatureDERLowS: Secp256k1['verifySignatureDERLowS'];
    };
  } = { secp256k1: internalSecp256k1, sha256: internalSha256 },
): Operation<State> =>
  combineOperations(
    opCheckSigChipLimits<State>({ secp256k1, sha256 }),
    opVerify,
  );

export const opCheckMultiSigVerifyChipLimits = <
  State extends AuthenticationProgramStateBCHCHIPs,
>({
  secp256k1,
  sha256,
}: {
  sha256: { hash: Sha256['hash'] };
  secp256k1: {
    verifySignatureDERLowS: Secp256k1['verifySignatureDERLowS'];
  };
}): Operation<State> =>
  combineOperations(
    opCheckMultiSigChipLimits<State>({ secp256k1, sha256 }),
    opVerify,
  );

export const opCheckDataSigChipLimits =
  <
    State extends AuthenticationProgramStateError &
      AuthenticationProgramStateResourceLimitsBCHCHIPs &
      AuthenticationProgramStateSignatureAnalysis &
      AuthenticationProgramStateStack,
  >({
    secp256k1,
    sha256,
  }: {
    sha256: { hash: Sha256['hash'] };
    secp256k1: {
      verifySignatureSchnorr: Secp256k1['verifySignatureSchnorr'];
      verifySignatureDERLowS: Secp256k1['verifySignatureDERLowS'];
    };
  }) =>
  (state: State) =>
    // eslint-disable-next-line complexity
    useThreeStackItems(state, (nextState, [signature, message, publicKey]) => {
      if (!isValidSignatureEncodingBCHRaw(signature)) {
        return applyError(
          nextState,
          AuthenticationErrorCommon.invalidSignatureEncoding,
          `Data signature: ${binToHex(signature)}`,
        );
      }
      if (!isValidPublicKeyEncoding(publicKey)) {
        return applyError(
          nextState,
          AuthenticationErrorCommon.invalidPublicKeyEncoding,
        );
      }
      const requiredTotalIterations =
        state.hashDigestIterations + hashDigestIterations(message.length);
      if (
        requiredTotalIterations > ConsensusBCHCHIPs.maximumHashDigestIterations
      ) {
        return applyError(
          state,
          AuthenticationErrorBCHCHIPs.excessiveHashing,
          `Required cumulative iterations: ${requiredTotalIterations}`,
        );
      }
      const digest = sha256.hash(message);

      // eslint-disable-next-line functional/no-expression-statements, functional/immutable-data
      nextState.signedMessages.push({ digest, message });

      const useSchnorr =
        signature.length === ConsensusCommon.schnorrSignatureLength;
      const success = useSchnorr
        ? secp256k1.verifySignatureSchnorr(signature, publicKey, digest)
        : secp256k1.verifySignatureDERLowS(signature, publicKey, digest);

      return !success && signature.length !== 0
        ? applyError(
            nextState,
            AuthenticationErrorCommon.nonNullSignatureFailure,
          )
        : pushToStack(nextState, booleanToVmNumber(success));
    });

export const opCheckDataSigVerifyChipLimits = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateResourceLimitsBCHCHIPs &
    AuthenticationProgramStateSignatureAnalysis &
    AuthenticationProgramStateStack,
>(
  {
    secp256k1,
    sha256,
  }: {
    sha256: { hash: Sha256['hash'] };
    secp256k1: {
      verifySignatureSchnorr: Secp256k1['verifySignatureSchnorr'];
      verifySignatureDERLowS: Secp256k1['verifySignatureDERLowS'];
    };
  } = { secp256k1: internalSecp256k1, sha256: internalSha256 },
) =>
  combineOperations(
    opCheckDataSigChipLimits<State>({ secp256k1, sha256 }),
    opVerify,
  );
