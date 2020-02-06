import {
  AuthenticationProgramStateCommon,
  ErrorState,
  StackState
} from '../../state';

import { isScriptNumberError, parseBytesAsScriptNumber } from './common';
import { applyError, AuthenticationErrorCommon } from './errors';
import { OpcodesCommon } from './opcodes';

enum Bits {
  sequenceLocktimeDisableFlag = 31,
  sequenceLocktimeTypeFlag = 22
}

enum Constants {
  LocktimeScriptNumberByteLength = 5,
  LocktimeThreshold = 500_000_000,
  maximumSequenceNumber = 0xffffffff,
  sequenceLocktimeTransactionVersionMinimum = 2,
  // eslint-disable-next-line no-bitwise
  sequenceLocktimeDisableFlag = (1 << Bits.sequenceLocktimeDisableFlag) >>> 0,
  // eslint-disable-next-line no-bitwise
  sequenceLocktimeTypeFlag = 1 << Bits.sequenceLocktimeTypeFlag,
  sequenceGranularity = 9,
  sequenceLocktimeMask = 0x0000ffff
}

export const readLocktime = <
  State extends StackState & ErrorState<Errors>,
  Errors
>(
  state: State,
  operation: (nextState: State, locktime: number) => State,
  flags: {
    requireMinimalEncoding: boolean;
  }
) => {
  const item = state.stack[state.stack.length - 1] as Uint8Array | undefined;
  if (item === undefined) {
    return applyError<State, Errors>(
      AuthenticationErrorCommon.emptyStack,
      state
    );
  }
  const parsedLocktime = parseBytesAsScriptNumber(
    item,
    flags.requireMinimalEncoding,
    Constants.LocktimeScriptNumberByteLength
  );
  if (isScriptNumberError(parsedLocktime)) {
    return applyError<State, Errors>(
      AuthenticationErrorCommon.invalidScriptNumber,
      state
    );
  }
  const locktime = Number(parsedLocktime);
  if (locktime < 0) {
    return applyError<State, Errors>(
      AuthenticationErrorCommon.negativeLocktime,
      state
    );
  }
  return operation(state, locktime);
};

const locktimeTypesAreCompatible = (
  locktime: number,
  requiredLocktime: number
) =>
  (locktime < Constants.LocktimeThreshold &&
    requiredLocktime < Constants.LocktimeThreshold) ||
  (locktime >= Constants.LocktimeThreshold &&
    requiredLocktime >= Constants.LocktimeThreshold);

export const opCheckLockTimeVerify = <
  State extends StackState &
    ErrorState<Errors> & {
      readonly locktime: number;
      readonly sequenceNumber: number;
    },
  Errors
>(flags: {
  requireMinimalEncoding: boolean;
}) => (state: State) =>
  readLocktime(
    state,
    (nextState, requiredLocktime) => {
      if (!locktimeTypesAreCompatible(nextState.locktime, requiredLocktime)) {
        return applyError<State, Errors>(
          AuthenticationErrorCommon.incompatibleLocktimeType,
          nextState
        );
      }
      if (requiredLocktime > nextState.locktime) {
        return applyError<State, Errors>(
          AuthenticationErrorCommon.unsatisfiedLocktime,
          nextState
        );
      }
      if (nextState.sequenceNumber === Constants.maximumSequenceNumber) {
        return applyError<State, Errors>(
          AuthenticationErrorCommon.locktimeDisabled,
          nextState
        );
      }
      return nextState;
    },
    flags
  );

// eslint-disable-next-line no-bitwise
const includesFlag = (value: number, flag: number) => (value & flag) !== 0;

export const opCheckSequenceVerify = <
  State extends StackState &
    ErrorState<Errors> & {
      readonly sequenceNumber: number;
      readonly version: number;
    },
  Errors
>(flags: {
  requireMinimalEncoding: boolean;
}) => (state: State) =>
  readLocktime(
    state,
    // eslint-disable-next-line complexity
    (nextState, requiredSequence) => {
      const sequenceLocktimeDisabled = includesFlag(
        requiredSequence,
        Constants.sequenceLocktimeDisableFlag
      );
      if (sequenceLocktimeDisabled) {
        return nextState;
      }

      if (
        nextState.version < Constants.sequenceLocktimeTransactionVersionMinimum
      ) {
        return applyError<State, Errors>(
          AuthenticationErrorCommon.checkSequenceUnavailable,
          nextState
        );
      }

      if (
        includesFlag(
          nextState.sequenceNumber,
          Constants.sequenceLocktimeDisableFlag
        )
      ) {
        return applyError<State, Errors>(
          AuthenticationErrorCommon.unmatchedSequenceDisable,
          nextState
        );
      }

      if (
        includesFlag(requiredSequence, Constants.sequenceLocktimeTypeFlag) !==
        includesFlag(
          nextState.sequenceNumber,
          Constants.sequenceLocktimeTypeFlag
        )
      ) {
        return applyError<State, Errors>(
          AuthenticationErrorCommon.incompatibleSequenceType,
          nextState
        );
      }

      if (
        // eslint-disable-next-line no-bitwise
        (requiredSequence & Constants.sequenceLocktimeMask) >
        // eslint-disable-next-line no-bitwise
        (nextState.sequenceNumber & Constants.sequenceLocktimeMask)
      ) {
        return applyError<State, Errors>(
          AuthenticationErrorCommon.unsatisfiedSequenceNumber,
          nextState
        );
      }

      return nextState;
    },
    flags
  );

export const timeOperations = <
  Opcodes,
  State extends AuthenticationProgramStateCommon<Opcodes, Errors>,
  Errors
>(flags: {
  requireMinimalEncoding: boolean;
}) => ({
  [OpcodesCommon.OP_CHECKLOCKTIMEVERIFY]: opCheckLockTimeVerify<State, Errors>(
    flags
  ),
  [OpcodesCommon.OP_CHECKSEQUENCEVERIFY]: opCheckSequenceVerify<State, Errors>(
    flags
  )
});
