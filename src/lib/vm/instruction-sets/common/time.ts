import type {
  AuthenticationProgramStateError,
  AuthenticationProgramStateStack,
  AuthenticationProgramStateTransactionContext,
} from '../../../lib.js';

import { applyError, AuthenticationErrorCommon } from './errors.js';
import { isVmNumberError, vmNumberToBigInt } from './instruction-sets-utils.js';

const enum Bits {
  sequenceLocktimeDisableFlag = 31,
  sequenceLocktimeTypeFlag = 22,
}

const enum Constants {
  locktimeVmNumberByteLength = 5,
  locktimeThreshold = 500_000_000,
  locktimeDisablingSequenceNumber = 0xffffffff,
  sequenceLocktimeTransactionVersionMinimum = 2,
  // eslint-disable-next-line no-bitwise, @typescript-eslint/prefer-literal-enum-member
  sequenceLocktimeDisableFlag = (1 << Bits.sequenceLocktimeDisableFlag) >>> 0,
  // eslint-disable-next-line no-bitwise, @typescript-eslint/prefer-literal-enum-member
  sequenceLocktimeTypeFlag = 1 << Bits.sequenceLocktimeTypeFlag,
  sequenceGranularity = 9,
  sequenceLocktimeMask = 0x0000ffff,
}

export const useLocktime = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack,
>(
  state: State,
  operation: (nextState: State, locktime: number) => State,
) => {
  const item = state.stack[state.stack.length - 1];
  if (item === undefined) {
    return applyError(state, AuthenticationErrorCommon.emptyStack);
  }
  const decodedLocktime = vmNumberToBigInt(item, {
    maximumVmNumberByteLength: Constants.locktimeVmNumberByteLength,
    requireMinimalEncoding: true,
  });
  if (isVmNumberError(decodedLocktime)) {
    return applyError(state, AuthenticationErrorCommon.invalidVmNumber);
  }
  const locktime = Number(decodedLocktime);
  if (locktime < 0) {
    return applyError(state, AuthenticationErrorCommon.negativeLocktime);
  }
  return operation(state, locktime);
};

const locktimeTypesAreCompatible = (
  locktime: number,
  requiredLocktime: number,
) =>
  (locktime < Constants.locktimeThreshold &&
    requiredLocktime < Constants.locktimeThreshold) ||
  (locktime >= Constants.locktimeThreshold &&
    requiredLocktime >= Constants.locktimeThreshold);

export const opCheckLockTimeVerify = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack &
    AuthenticationProgramStateTransactionContext,
>(
  state: State,
) =>
  useLocktime(state, (nextState, requiredLocktime) => {
    if (
      !locktimeTypesAreCompatible(
        nextState.program.transaction.locktime,
        requiredLocktime,
      )
    ) {
      return applyError(
        nextState,
        AuthenticationErrorCommon.incompatibleLocktimeType,
      );
    }
    if (requiredLocktime > nextState.program.transaction.locktime) {
      return applyError(
        nextState,
        AuthenticationErrorCommon.unsatisfiedLocktime,
      );
    }
    const { sequenceNumber } =
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      nextState.program.transaction.inputs[nextState.program.inputIndex]!;
    if (sequenceNumber === Constants.locktimeDisablingSequenceNumber) {
      return applyError(nextState, AuthenticationErrorCommon.locktimeDisabled);
    }
    return nextState;
  });

// eslint-disable-next-line no-bitwise
const includesFlag = (value: number, flag: number) => (value & flag) !== 0;

export const opCheckSequenceVerify = <
  State extends AuthenticationProgramStateError &
    AuthenticationProgramStateStack &
    AuthenticationProgramStateTransactionContext,
>(
  state: State,
) =>
  useLocktime(
    state,
    // eslint-disable-next-line complexity
    (nextState, requiredSequence) => {
      const { sequenceNumber } =
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        nextState.program.transaction.inputs[nextState.program.inputIndex]!;
      const sequenceLocktimeDisabled = includesFlag(
        requiredSequence,
        Constants.sequenceLocktimeDisableFlag,
      );
      if (sequenceLocktimeDisabled) {
        return nextState;
      }

      if (
        nextState.program.transaction.version <
        Constants.sequenceLocktimeTransactionVersionMinimum
      ) {
        return applyError(
          nextState,
          AuthenticationErrorCommon.checkSequenceUnavailable,
        );
      }

      if (includesFlag(sequenceNumber, Constants.sequenceLocktimeDisableFlag)) {
        return applyError(
          nextState,
          AuthenticationErrorCommon.unmatchedSequenceDisable,
        );
      }

      if (
        includesFlag(requiredSequence, Constants.sequenceLocktimeTypeFlag) !==
        includesFlag(sequenceNumber, Constants.sequenceLocktimeTypeFlag)
      ) {
        return applyError(
          nextState,
          AuthenticationErrorCommon.incompatibleSequenceType,
        );
      }

      if (
        // eslint-disable-next-line no-bitwise
        (requiredSequence & Constants.sequenceLocktimeMask) >
        // eslint-disable-next-line no-bitwise
        (sequenceNumber & Constants.sequenceLocktimeMask)
      ) {
        return applyError(
          nextState,
          AuthenticationErrorCommon.unsatisfiedSequenceNumber,
        );
      }

      return nextState;
    },
  );
