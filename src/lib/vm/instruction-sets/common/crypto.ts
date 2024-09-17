import {
  hash256,
  ripemd160 as internalRipemd160,
  secp256k1 as internalSecp256k1,
  sha1 as internalSha1,
  sha256 as internalSha256,
} from '../../../crypto/crypto.js';
import { binToHex, formatError } from '../../../format/format.js';
import type {
  AuthenticationProgramStateCommon,
  AuthenticationProgramStateError,
  AuthenticationProgramStateMinimum,
  AuthenticationProgramStateResourceLimits,
  AuthenticationProgramStateSignatureAnalysis,
  AuthenticationProgramStateStack,
  Operation,
  Ripemd160,
  Secp256k1,
  Sha1,
  Sha256,
} from '../../../lib.js';

import {
  combineOperations,
  incrementHashDigestIterations,
  lengthToHashDigestIterationCount,
  pushToStack,
  useOneStackItem,
  useOneVmNumber,
  useThreeStackItems,
  useTwoStackItems,
} from './combinators.js';
import { ConsensusCommon, SigningSerializationTypesBch } from './consensus.js';
import {
  decodeBitcoinSignature,
  isValidSignatureEncodingBchTransaction,
  isValidSignatureEncodingDER,
} from './encoding.js';
import { applyError, AuthenticationErrorCommon } from './errors.js';
import { opVerify } from './flow-control.js';
import {
  booleanToVmNumber,
  encodeAuthenticationInstructions,
  isValidPublicKeyEncoding,
} from './instruction-sets-utils.js';
import { generateSigningSerializationBch } from './signing-serialization.js';

export const opRipemd160 =
  <
    State extends AuthenticationProgramStateError &
      AuthenticationProgramStateMinimum &
      AuthenticationProgramStateResourceLimits &
      AuthenticationProgramStateStack,
  >(
    { ripemd160 }: { ripemd160: { hash: Ripemd160['hash'] } } = {
      ripemd160: internalRipemd160,
    },
  ): Operation<State> =>
  (state: State) =>
    useOneStackItem(state, (nextState, [value]) =>
      incrementHashDigestIterations(
        nextState,
        { messageLength: value.length, resultIsHashed: false },
        (finalState) => pushToStack(finalState, [ripemd160.hash(value)]),
      ),
    );

export const opSha1 =
  <
    State extends AuthenticationProgramStateError &
      AuthenticationProgramStateMinimum &
      AuthenticationProgramStateResourceLimits &
      AuthenticationProgramStateStack,
  >(
    { sha1 }: { sha1: { hash: Sha1['hash'] } } = { sha1: internalSha1 },
  ): Operation<State> =>
  (state: State) =>
    useOneStackItem(state, (nextState, [value]) =>
      incrementHashDigestIterations(
        nextState,
        { messageLength: value.length, resultIsHashed: false },
        (finalState) => pushToStack(finalState, [sha1.hash(value)]),
      ),
    );

export const opSha256 =
  <
    State extends AuthenticationProgramStateError &
      AuthenticationProgramStateMinimum &
      AuthenticationProgramStateResourceLimits &
      AuthenticationProgramStateStack,
  >(
    { sha256 }: { sha256: { hash: Sha256['hash'] } } = {
      sha256: internalSha256,
    },
  ): Operation<State> =>
  (state: State) =>
    useOneStackItem(state, (nextState, [value]) =>
      incrementHashDigestIterations(
        nextState,
        { messageLength: value.length, resultIsHashed: false },
        (finalState) => pushToStack(finalState, [sha256.hash(value)]),
      ),
    );

export const opHash160 =
  <
    State extends AuthenticationProgramStateError &
      AuthenticationProgramStateMinimum &
      AuthenticationProgramStateResourceLimits &
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
      incrementHashDigestIterations(
        nextState,
        { messageLength: value.length, resultIsHashed: true },
        (finalState) =>
          pushToStack(finalState, [ripemd160.hash(sha256.hash(value))]),
      ),
    );

export const opHash256 =
  <
    State extends AuthenticationProgramStateError &
      AuthenticationProgramStateMinimum &
      AuthenticationProgramStateResourceLimits &
      AuthenticationProgramStateStack,
  >(
    { sha256 }: { sha256: { hash: Sha256['hash'] } } = {
      sha256: internalSha256,
    },
  ): Operation<State> =>
  (state: State) =>
    useOneStackItem(state, (nextState, [value]) =>
      incrementHashDigestIterations(
        nextState,
        { messageLength: value.length, resultIsHashed: true },
        (finalState) => pushToStack(finalState, [hash256(value, sha256)]),
      ),
    );

export const opCodeSeparator = <
  State extends AuthenticationProgramStateMinimum & {
    lastCodeSeparator: number;
  },
>(
  state: State,
) => {
  // eslint-disable-next-line functional/no-expression-statements, functional/immutable-data
  state.lastCodeSeparator = state.ip;
  return state;
};

export const opCheckSig =
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
        !isValidSignatureEncodingBchTransaction(
          bitcoinEncodedSignature,
          SigningSerializationTypesBch,
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
      if (bitcoinEncodedSignature.length === 0) {
        return pushToStack(state, [booleanToVmNumber(false)]);
      }

      const coveredBytecode = encodeAuthenticationInstructions(
        state.instructions.slice(state.lastCodeSeparator + 1),
      );
      const { signingSerializationType, signature } = decodeBitcoinSignature(
        bitcoinEncodedSignature,
      );

      const serialization = generateSigningSerializationBch(
        state.program,
        { coveredBytecode, signingSerializationType },
        sha256,
      );
      const digest = hash256(serialization, sha256);
      /* eslint-disable functional/no-expression-statements, functional/immutable-data */
      state.metrics.signatureCheckCount += 1;
      const doubleHashed = 1;
      state.metrics.hashDigestIterations +=
        doubleHashed + lengthToHashDigestIterationCount(serialization.length);
      state.signedMessages.push({ digest, serialization });
      /* eslint-enable functional/no-expression-statements, functional/immutable-data */

      const useSchnorr =
        signature.length === ConsensusCommon.schnorrSignatureLength;
      const success = useSchnorr
        ? secp256k1.verifySignatureSchnorr(signature, publicKey, digest)
        : secp256k1.verifySignatureDERLowS(signature, publicKey, digest);

      return success
        ? pushToStack(state, [booleanToVmNumber(success)])
        : applyError(
            state,
            AuthenticationErrorCommon.nonNullSignatureFailure,
            `Algorithm used: ${useSchnorr ? 'Schnorr' : 'ECDSA'}.`,
          );
    });

const enum Multisig {
  maximumPublicKeys = 20,
  binary = 2,
  maximumBitfieldBitLength = 32,
}

/**
 * Return the number of `1` bits in the number `n`.
 * @param n - the number
 */
export const countBits = (n: bigint) =>
  n.toString(Multisig.binary).replace(/0/gu, '').length;

export enum BitfieldDecodeError {
  invalidBitfieldSize = 'BitfieldDecode error: bitfield exceeds maximum length (32 bits).',
  bitsSetBeyondExpectedRange = 'BitfieldDecode error: the decoded bitfield includes bits set beyond the expected range.',
}

/**
 * Decode a non-null `OP_CHECKMULTISIG` bitfield (A.K.A. `CheckBits`)
 * representing the positions of public keys against which the provided
 * signatures must be verified.
 * @param bin - the stack item from which to decode the bitfield
 * @param expectedBitLength - the number of bits expected
 */
export const decodeBitfield = (bin: Uint8Array, expectedBitLength: number) => {
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  const expectedBitfieldLength = Math.floor((expectedBitLength + 7) / 8);
  if (bin.length !== expectedBitfieldLength) {
    return formatError(
      BitfieldDecodeError.invalidBitfieldSize,
      `Bitfield length: ${bin.length}, expected length: ${expectedBitfieldLength}.`,
    );
  }

  // eslint-disable-next-line functional/no-let
  let bitfield = 0n;
  // eslint-disable-next-line functional/no-loop-statements, functional/no-let, no-plusplus
  for (let i = 0; i < expectedBitfieldLength; i++) {
    // Decode the bitfield as little endian.
    // eslint-disable-next-line functional/no-expression-statements, no-bitwise, @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-magic-numbers
    bitfield |= BigInt(bin[i]!) << BigInt(8 * i);
  }

  // eslint-disable-next-line no-bitwise
  const mask = (1n << BigInt(expectedBitLength)) - 1n;
  // eslint-disable-next-line no-bitwise
  if ((bitfield & mask) !== bitfield) {
    return formatError(
      BitfieldDecodeError.bitsSetBeyondExpectedRange,
      `Bitfield: ${bitfield}, expected bit length: ${expectedBitLength}.`,
    );
  }
  return bitfield;
};

export const opCheckMultiSig =
  <State extends AuthenticationProgramStateCommon>(
    {
      secp256k1,
      sha256,
      enforceOperationLimit,
    }: {
      enforceOperationLimit: boolean;
      sha256: { hash: Sha256['hash'] };
      secp256k1: {
        verifySignatureSchnorr: Secp256k1['verifySignatureSchnorr'];
        verifySignatureDERLowS: Secp256k1['verifySignatureDERLowS'];
      };
    } = {
      enforceOperationLimit: true,
      secp256k1: internalSecp256k1,
      sha256: internalSha256,
    },
  ) =>
  (s: State) =>
    // eslint-disable-next-line complexity
    useOneVmNumber(s, (state, publicKeysValue) => {
      const potentialPublicKeys = Number(publicKeysValue);

      if (potentialPublicKeys < 0) {
        return applyError(
          state,
          AuthenticationErrorCommon.invalidNaturalNumber,
          `Indicated public key count: ${potentialPublicKeys}.`,
        );
      }
      if (potentialPublicKeys > Multisig.maximumPublicKeys) {
        return applyError(
          state,
          AuthenticationErrorCommon.exceedsMaximumMultisigPublicKeyCount,
          `Indicated public key count: ${potentialPublicKeys}.`,
        );
      }
      const publicKeys =
        // eslint-disable-next-line functional/immutable-data
        potentialPublicKeys > 0 ? state.stack.splice(-potentialPublicKeys) : [];

      // eslint-disable-next-line functional/no-expression-statements, functional/immutable-data
      state.operationCount += potentialPublicKeys;

      if (
        enforceOperationLimit &&
        state.operationCount > ConsensusCommon.maximumOperationCount
      ) {
        return applyError(
          state,
          AuthenticationErrorCommon.exceededMaximumOperationCount,
        );
      }

      return useOneVmNumber(state, (nextState, approvingKeys) => {
        const requiredApprovingPublicKeys = Number(approvingKeys);

        if (requiredApprovingPublicKeys < 0) {
          return applyError(
            nextState,
            AuthenticationErrorCommon.invalidNaturalNumber,
            `Indicated signature count: ${requiredApprovingPublicKeys}.`,
          );
        }

        if (requiredApprovingPublicKeys > potentialPublicKeys) {
          return applyError(
            nextState,
            AuthenticationErrorCommon.insufficientPublicKeys,
            `Indicated signature count: ${requiredApprovingPublicKeys}.`,
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
          (finalState, [dummyValue]) => {
            const coveredBytecode =
              signatures.length > 0
                ? encodeAuthenticationInstructions(
                    finalState.instructions.slice(state.lastCodeSeparator + 1),
                  )
                : Uint8Array.of();

            if (dummyValue.length !== 0) {
              // Schnorr-mode multisig
              const checkBits = decodeBitfield(dummyValue, publicKeys.length);
              if (typeof checkBits === 'string') {
                return applyError(
                  finalState,
                  AuthenticationErrorCommon.invalidCheckBitsValue,
                  checkBits,
                );
              }
              const bitCount = countBits(checkBits);
              if (bitCount !== signatures.length) {
                return applyError(
                  finalState,
                  AuthenticationErrorCommon.invalidCheckBitsSignatureCount,
                  `CheckBits signatures configured: ${bitCount}; signatures required: ${signatures.length}.`,
                );
              }

              // eslint-disable-next-line functional/no-let
              let iKey = 0;
              // eslint-disable-next-line functional/no-loop-statements, functional/no-let, no-plusplus
              for (let iSig = 0; iSig < signatures.length; iSig++, iKey++) {
                // eslint-disable-next-line no-bitwise
                if (checkBits >> BigInt(iKey) === 0n) {
                  return applyError(
                    finalState,
                    'Expected to be unreachable: unexpected end of bitfield.',
                  );
                }

                // eslint-disable-next-line functional/no-loop-statements, no-bitwise
                while (((checkBits >> BigInt(iKey)) & 1n) === 0n) {
                  // eslint-disable-next-line functional/no-expression-statements, no-plusplus
                  iKey++;
                }

                if (iKey >= publicKeys.length) {
                  return applyError(
                    finalState,
                    'Expected to be unreachable: more set bits than available public keys.',
                  );
                }

                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                const bitcoinEncodedSignature = signatures[iSig]!;
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                const publicKey = publicKeys[iKey]!;

                if (!isValidPublicKeyEncoding(publicKey)) {
                  return applyError(
                    finalState,
                    AuthenticationErrorCommon.invalidPublicKeyEncoding,
                    `Provided public key: ${binToHex(publicKey)}`,
                  );
                }

                if (
                  !isValidSignatureEncodingBchTransaction(
                    bitcoinEncodedSignature,
                    SigningSerializationTypesBch,
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

                const serialization = generateSigningSerializationBch(
                  state.program,
                  { coveredBytecode, signingSerializationType },
                  sha256,
                );
                const digest = hash256(serialization, sha256);
                /* eslint-disable functional/no-expression-statements, functional/immutable-data */
                finalState.metrics.signatureCheckCount += 1;
                const doubleHashed = 1;
                finalState.metrics.hashDigestIterations +=
                  doubleHashed +
                  lengthToHashDigestIterationCount(serialization.length);
                finalState.signedMessages.push({ digest, serialization });
                /* eslint-enable functional/no-expression-statements, functional/immutable-data */

                if (
                  signature.length !== ConsensusCommon.schnorrSignatureLength
                ) {
                  return applyError(
                    finalState,
                    AuthenticationErrorCommon.nonSchnorrSizedSignatureInSchnorrMultiSig,
                    `Provided signature: ${binToHex(signature)}`,
                  );
                }
                const success = secp256k1.verifySignatureSchnorr(
                  signature,
                  publicKey,
                  digest,
                );
                if (!success) {
                  return applyError(
                    finalState,
                    AuthenticationErrorCommon.nonNullSignatureFailure,
                    `Algorithm used: 'Schnorr'. CheckBits: ${checkBits.toString(
                      Multisig.binary,
                    )}.`,
                  );
                }
              }

              // eslint-disable-next-line no-bitwise
              if (checkBits >> BigInt(iKey) !== 0n) {
                return applyError(
                  finalState,
                  'Expected to be unreachable: unexpected bits set after processing all signatures.',
                );
              }

              return pushToStack(finalState, [booleanToVmNumber(true)]);
            }
            // Legacy ECDSA multisig
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
                  `Provided public key: ${binToHex(publicKey)}`,
                );
              }

              if (
                !isValidSignatureEncodingBchTransaction(
                  bitcoinEncodedSignature,
                  SigningSerializationTypesBch,
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

              const serialization = generateSigningSerializationBch(
                state.program,
                { coveredBytecode, signingSerializationType },
                sha256,
              );
              const digest = hash256(serialization, sha256);
              /* eslint-disable functional/no-expression-statements, functional/immutable-data */
              const doubleHashed = 1;
              finalState.metrics.hashDigestIterations +=
                doubleHashed +
                lengthToHashDigestIterationCount(serialization.length);
              finalState.signedMessages.push({ digest, serialization });
              /* eslint-enable functional/no-expression-statements, functional/immutable-data */

              if (signature.length === ConsensusCommon.schnorrSignatureLength) {
                return applyError(
                  finalState,
                  AuthenticationErrorCommon.schnorrSizedSignatureInEcdsaMultiSig,
                  `Provided signature: ${binToHex(signature)}`,
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

            const success = approvingPublicKeys === requiredApprovingPublicKeys;

            const allSignaturesAreNull = signatures.every(
              (signature) => signature.length === 0,
            );

            if (!allSignaturesAreNull) {
              // eslint-disable-next-line functional/no-expression-statements, functional/immutable-data
              finalState.metrics.signatureCheckCount += publicKeys.length;
              if (!success) {
                return applyError(
                  finalState,
                  AuthenticationErrorCommon.nonNullSignatureFailure,
                );
              }
            }

            return pushToStack(finalState, [booleanToVmNumber(success)]);
          },
        );
      });
    });

export const opCheckSigVerify = <
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
  combineOperations(opCheckSig<State>({ secp256k1, sha256 }), opVerify);

export const opCheckMultiSigVerify = <
  State extends AuthenticationProgramStateCommon,
>({
  enforceOperationLimit,
  secp256k1,
  sha256,
}: {
  enforceOperationLimit: boolean;
  sha256: { hash: Sha256['hash'] };
  secp256k1: {
    verifySignatureSchnorr: Secp256k1['verifySignatureSchnorr'];
    verifySignatureDERLowS: Secp256k1['verifySignatureDERLowS'];
  };
}): Operation<State> =>
  combineOperations(
    opCheckMultiSig<State>({ enforceOperationLimit, secp256k1, sha256 }),
    opVerify,
  );

/**
 * Validate the encoding of a raw signature – a signature without a signing
 * serialization type byte (A.K.A. "sighash" byte).
 *
 * @param signature - the raw signature
 */
export const isValidSignatureEncodingBchRaw = (signature: Uint8Array) =>
  signature.length === 0 ||
  signature.length === ConsensusCommon.schnorrSignatureLength ||
  isValidSignatureEncodingDER(signature);

export const opCheckDataSig =
  <
    State extends AuthenticationProgramStateError &
      AuthenticationProgramStateResourceLimits &
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
      if (!isValidSignatureEncodingBchRaw(signature)) {
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
          `Provided public key: ${binToHex(publicKey)}`,
        );
      }
      if (signature.length === 0) {
        return pushToStack(state, [booleanToVmNumber(false)]);
      }

      const digest = sha256.hash(message);
      /* eslint-disable functional/no-expression-statements, functional/immutable-data */
      nextState.metrics.signatureCheckCount += 1;
      nextState.metrics.hashDigestIterations +=
        lengthToHashDigestIterationCount(message.length);
      nextState.signedMessages.push({ digest, message });
      /* eslint-enable functional/no-expression-statements, functional/immutable-data */

      const useSchnorr =
        signature.length === ConsensusCommon.schnorrSignatureLength;
      const success = useSchnorr
        ? secp256k1.verifySignatureSchnorr(signature, publicKey, digest)
        : secp256k1.verifySignatureDERLowS(signature, publicKey, digest);

      return success
        ? pushToStack(nextState, [booleanToVmNumber(success)])
        : applyError(
            nextState,
            AuthenticationErrorCommon.nonNullSignatureFailure,
          );
    });

export const opCheckDataSigVerify = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateResourceLimits &
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
) => combineOperations(opCheckDataSig<State>({ secp256k1, sha256 }), opVerify);

export const opReverseBytes = <State extends AuthenticationProgramStateStack>(
  state: State,
) =>
  useOneStackItem(state, (nextState, [item]) =>
    pushToStack(nextState, [item.slice().reverse()]),
  );
