import { Secp256k1, Sha256 } from '../../../crypto/crypto';
import { flattenBinArray } from '../../../format/hex';
import {
  AuthenticationProgramStateCommon,
  AuthenticationProgramStateError,
  AuthenticationProgramStateSignatureAnalysis,
  AuthenticationProgramStateStack,
} from '../../vm-types';
import {
  combineOperations,
  pushToStack,
  useOneScriptNumber,
  useOneStackItem,
  useThreeStackItems,
  useTwoScriptNumbers,
  useTwoStackItems,
} from '../common/combinators';
import { ConsensusCommon } from '../common/common';
import {
  isValidPublicKeyEncoding,
  isValidSignatureEncodingDER,
} from '../common/encoding';
import { applyError, AuthenticationErrorCommon } from '../common/errors';
import { opVerify } from '../common/flow-control';
import { bigIntToScriptNumber, booleanToScriptNumber } from '../common/types';

import { AuthenticationErrorBCH } from './bch-errors';
import { OpcodesBCH } from './bch-opcodes';
import { ConsensusBCH } from './bch-types';

export const opCat = <
  State extends AuthenticationProgramStateStack &
    AuthenticationProgramStateError<AuthenticationErrorBCH>
>() => (state: State) =>
  useTwoStackItems(state, (nextState, [a, b]) =>
    a.length + b.length > ConsensusCommon.maximumStackItemLength
      ? applyError<State, AuthenticationErrorBCH>(
          AuthenticationErrorBCH.exceededMaximumStackItemLength,
          nextState
        )
      : pushToStack(nextState, flattenBinArray([a, b]))
  );

export const opSplit = <
  State extends AuthenticationProgramStateStack &
    AuthenticationProgramStateError<AuthenticationErrorBCH>
>({
  requireMinimalEncoding,
}: {
  requireMinimalEncoding: boolean;
}) => (state: State) =>
  useOneScriptNumber(
    state,
    (nextState, value) => {
      const index = Number(value);
      return useOneStackItem(nextState, (finalState, [item]) =>
        index < 0 || index > item.length
          ? applyError<State, AuthenticationErrorBCH>(
              AuthenticationErrorBCH.invalidSplitIndex,
              finalState
            )
          : pushToStack(finalState, item.slice(0, index), item.slice(index))
      );
    },
    { requireMinimalEncoding }
  );

enum Constants {
  positiveSign = 0x00,
  negativeSign = 0x80,
}

export const padMinimallyEncodedScriptNumber = (
  scriptNumber: Uint8Array,
  length: number
) => {
  // eslint-disable-next-line functional/no-let
  let signBit = Constants.positiveSign;
  // eslint-disable-next-line functional/no-conditional-statement
  if (scriptNumber.length > 0) {
    // eslint-disable-next-line functional/no-expression-statement, no-bitwise
    signBit = scriptNumber[scriptNumber.length - 1] & Constants.negativeSign;
    // eslint-disable-next-line functional/no-expression-statement, no-bitwise, functional/immutable-data
    scriptNumber[scriptNumber.length - 1] &= Constants.negativeSign - 1;
  }
  const result = Array.from(scriptNumber);
  // eslint-disable-next-line functional/no-loop-statement
  while (result.length < length - 1) {
    // eslint-disable-next-line functional/no-expression-statement, functional/immutable-data
    result.push(0);
  }
  // eslint-disable-next-line functional/no-expression-statement, functional/immutable-data
  result.push(signBit);
  return Uint8Array.from(result);
};

export const opNum2Bin = <
  State extends AuthenticationProgramStateStack &
    AuthenticationProgramStateError<AuthenticationErrorBCH>
>() => (state: State) =>
  useOneScriptNumber(
    state,
    (nextState, value) => {
      const targetLength = Number(value);
      return targetLength > ConsensusCommon.maximumStackItemLength
        ? applyError<State, AuthenticationErrorBCH>(
            AuthenticationErrorBCH.exceededMaximumStackItemLength,
            nextState
          )
        : useOneScriptNumber(
            nextState,
            (finalState, [target]) => {
              const minimallyEncoded = bigIntToScriptNumber(target);
              return minimallyEncoded.length > targetLength
                ? applyError<State, AuthenticationErrorBCH>(
                    AuthenticationErrorBCH.insufficientLength,
                    finalState
                  )
                : minimallyEncoded.length === targetLength
                ? pushToStack(finalState, minimallyEncoded)
                : pushToStack(
                    finalState,
                    padMinimallyEncodedScriptNumber(
                      minimallyEncoded,
                      targetLength
                    )
                  );
            },
            {
              maximumScriptNumberByteLength:
                // TODO: is this right?
                ConsensusCommon.maximumStackItemLength,
              requireMinimalEncoding: false,
            }
          );
    },
    { requireMinimalEncoding: true }
  );

export const opBin2Num = <
  State extends AuthenticationProgramStateStack &
    AuthenticationProgramStateError<AuthenticationErrorBCH>
>() => (state: State) =>
  useOneScriptNumber(
    state,
    (nextState, [target]) => {
      const minimallyEncoded = bigIntToScriptNumber(target);
      return minimallyEncoded.length > ConsensusCommon.maximumScriptNumberLength
        ? applyError<State, AuthenticationErrorBCH>(
            AuthenticationErrorBCH.exceededMaximumScriptNumberLength,
            nextState
          )
        : pushToStack(nextState, minimallyEncoded);
    },
    {
      // TODO: is this right?
      maximumScriptNumberByteLength: ConsensusCommon.maximumStackItemLength,
      requireMinimalEncoding: false,
    }
  );

export const bitwiseOperation = <
  State extends AuthenticationProgramStateStack &
    AuthenticationProgramStateError<AuthenticationErrorBCH>
>(
  combine: (a: Uint8Array, b: Uint8Array) => Uint8Array
) => (state: State) =>
  useTwoStackItems(state, (nextState, [a, b]) =>
    a.length === b.length
      ? pushToStack(nextState, combine(a, b))
      : applyError<State, AuthenticationErrorBCH>(
          AuthenticationErrorBCH.mismatchedBitwiseOperandLength,
          nextState
        )
  );

export const opAnd = <
  State extends AuthenticationProgramStateStack &
    AuthenticationProgramStateError<AuthenticationErrorBCH>
  // eslint-disable-next-line no-bitwise
>() => bitwiseOperation<State>((a, b) => a.map((v, i) => v & b[i]));

export const opOr = <
  State extends AuthenticationProgramStateStack &
    AuthenticationProgramStateError<AuthenticationErrorBCH>
  // eslint-disable-next-line no-bitwise
>() => bitwiseOperation<State>((a, b) => a.map((v, i) => v | b[i]));

export const opXor = <
  State extends AuthenticationProgramStateStack &
    AuthenticationProgramStateError<AuthenticationErrorBCH>
  // eslint-disable-next-line no-bitwise
>() => bitwiseOperation<State>((a, b) => a.map((v, i) => v ^ b[i]));

export const opDiv = <
  State extends AuthenticationProgramStateStack &
    AuthenticationProgramStateError<AuthenticationErrorBCH>
>({
  requireMinimalEncoding,
}: {
  requireMinimalEncoding: boolean;
}) => (state: State) =>
  useTwoScriptNumbers(
    state,
    (nextState, [a, b]) =>
      b === BigInt(0)
        ? applyError<State, AuthenticationErrorBCH>(
            AuthenticationErrorBCH.divisionByZero,
            nextState
          )
        : pushToStack(nextState, bigIntToScriptNumber(a / b)),
    { requireMinimalEncoding }
  );

export const opMod = <
  State extends AuthenticationProgramStateStack &
    AuthenticationProgramStateError<AuthenticationErrorBCH>
>({
  requireMinimalEncoding,
}: {
  requireMinimalEncoding: boolean;
}) => (state: State) =>
  useTwoScriptNumbers(
    state,
    (nextState, [a, b]) =>
      b === BigInt(0)
        ? applyError<State, AuthenticationErrorBCH>(
            AuthenticationErrorBCH.divisionByZero,
            nextState
          )
        : pushToStack(nextState, bigIntToScriptNumber(a % b)),
    { requireMinimalEncoding }
  );

/**
 * Validate the encoding of a raw signature – a signature without a signing
 * serialization type byte (A.K.A. "sighash" byte).
 *
 * @param signature - the raw signature
 */
export const isValidSignatureEncodingBCHRaw = (signature: Uint8Array) =>
  signature.length === 0 ||
  signature.length === ConsensusBCH.schnorrSignatureLength ||
  isValidSignatureEncodingDER(signature);

export const opCheckDataSig = <
  State extends AuthenticationProgramStateStack &
    AuthenticationProgramStateError<Errors> &
    AuthenticationProgramStateSignatureAnalysis,
  Errors
>({
  secp256k1,
  sha256,
}: {
  sha256: { hash: Sha256['hash'] };
  secp256k1: {
    verifySignatureSchnorr: Secp256k1['verifySignatureSchnorr'];
    verifySignatureDERLowS: Secp256k1['verifySignatureDERLowS'];
  };
}) => (state: State) =>
  // eslint-disable-next-line complexity
  useThreeStackItems(state, (nextState, [signature, message, publicKey]) => {
    if (!isValidSignatureEncodingBCHRaw(signature)) {
      return applyError<State, Errors>(
        AuthenticationErrorCommon.invalidSignatureEncoding,
        nextState
      );
    }
    if (!isValidPublicKeyEncoding(publicKey)) {
      return applyError<State, Errors>(
        AuthenticationErrorCommon.invalidPublicKeyEncoding,
        nextState
      );
    }
    const digest = sha256.hash(message);

    // eslint-disable-next-line functional/no-expression-statement, functional/immutable-data
    nextState.signedMessages.push(message);

    const useSchnorr = signature.length === ConsensusBCH.schnorrSignatureLength;
    const success = useSchnorr
      ? secp256k1.verifySignatureSchnorr(signature, publicKey, digest)
      : secp256k1.verifySignatureDERLowS(signature, publicKey, digest);

    return !success && signature.length !== 0
      ? applyError<State, Errors>(
          AuthenticationErrorCommon.nonNullSignatureFailure,
          nextState
        )
      : pushToStack(nextState, booleanToScriptNumber(success));
  });

export const opCheckDataSigVerify = <
  State extends AuthenticationProgramStateStack &
    AuthenticationProgramStateError<Errors> &
    AuthenticationProgramStateSignatureAnalysis,
  Errors
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
  combineOperations(
    opCheckDataSig<State, Errors>({ secp256k1, sha256 }),
    opVerify<State, Errors>()
  );

export const opReverseBytes = <
  State extends AuthenticationProgramStateStack
>() => (state: State) =>
  useOneStackItem(state, (nextState, [item]) =>
    pushToStack(nextState, item.slice().reverse())
  );

export const bitcoinCashOperations = <
  Opcodes,
  State extends AuthenticationProgramStateCommon<
    Opcodes,
    AuthenticationErrorBCH
  >
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
    opReverseBytes: boolean;
    requireBugValueZero: boolean;
    requireMinimalEncoding: boolean;
    requireNullSignatureFailures: boolean;
  };
}) => {
  const operations = {
    [OpcodesBCH.OP_CAT]: opCat<State>(),
    [OpcodesBCH.OP_SPLIT]: opSplit<State>(flags),
    [OpcodesBCH.OP_NUM2BIN]: opNum2Bin<State>(),
    [OpcodesBCH.OP_BIN2NUM]: opBin2Num<State>(),
    [OpcodesBCH.OP_AND]: opAnd<State>(),
    [OpcodesBCH.OP_OR]: opOr<State>(),
    [OpcodesBCH.OP_XOR]: opXor<State>(),
    [OpcodesBCH.OP_DIV]: opDiv<State>(flags),
    [OpcodesBCH.OP_MOD]: opMod<State>(flags),
    [OpcodesBCH.OP_CHECKDATASIG]: opCheckDataSig<State, AuthenticationErrorBCH>(
      {
        secp256k1,
        sha256,
      }
    ),
    [OpcodesBCH.OP_CHECKDATASIGVERIFY]: opCheckDataSigVerify<
      State,
      AuthenticationErrorBCH
    >({ secp256k1, sha256 }),
  };
  return flags.opReverseBytes
    ? { ...operations, [OpcodesBCH.OP_REVERSEBYTES]: opReverseBytes<State>() }
    : operations;
};
