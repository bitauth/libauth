import {
  hash256,
  secp256k1 as internalSecp256k1,
  sha256 as internalSha256,
} from '../../../../crypto/crypto.js';
import { binToHex } from '../../../../format/format.js';
import type {
  AuthenticationProgramStateCommon,
  Operation,
  Secp256k1,
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
  isValidSignatureEncodingBCHTransaction,
  opVerify,
  pushToStack,
  useOneStackItem,
  useOneVmNumber,
  useTwoStackItems,
} from '../../common/common.js';

import { SigningSerializationTypesBCH2023 } from './bch-2023-consensus.js';

export const opCheckSigBCH2023 =
  <State extends AuthenticationProgramStateCommon>(
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
          `Transaction signature (including signing serialization): ${binToHex(
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
export const opCheckMultiSigBCH2023 =
  <State extends AuthenticationProgramStateCommon>(
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

      // eslint-disable-next-line functional/no-expression-statements, functional/immutable-data
      state.operationCount += potentialPublicKeys;

      return state.operationCount > ConsensusCommon.maximumOperationCount
        ? applyError(
            state,
            AuthenticationErrorCommon.exceededMaximumOperationCount,
          )
        : useOneVmNumber(
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
                    const digest = hash256(serialization, sha256);

                    // eslint-disable-next-line functional/no-expression-statements, functional/immutable-data
                    finalState.signedMessages.push({ digest, serialization });

                    if (
                      signature.length ===
                      ConsensusCommon.schnorrSignatureLength
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

export const opCheckSigVerifyBCH2023 = <
  State extends AuthenticationProgramStateCommon,
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
  combineOperations(opCheckSigBCH2023<State>({ secp256k1, sha256 }), opVerify);

export const opCheckMultiSigVerifyBCH2023 = <
  State extends AuthenticationProgramStateCommon,
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
    opCheckMultiSigBCH2023<State>({ secp256k1, sha256 }),
    opVerify,
  );
