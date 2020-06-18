import { AuthenticationProgramStateError } from '../../vm-types';

import { applyError, AuthenticationErrorCommon } from './errors';
import { OpcodesCommon } from './opcodes';

export const opNop = <State>(flags: { disallowUpgradableNops: boolean }) => (
  state: State
) =>
  flags.disallowUpgradableNops
    ? applyError(AuthenticationErrorCommon.calledUpgradableNop, state)
    : state;

export const nonOperations = <State>(flags: {
  disallowUpgradableNops: boolean;
}) => ({
  [OpcodesCommon.OP_NOP]: opNop<State>(flags),
  [OpcodesCommon.OP_NOP1]: opNop<State>(flags),
  [OpcodesCommon.OP_NOP4]: opNop<State>(flags),
  [OpcodesCommon.OP_NOP5]: opNop<State>(flags),
  [OpcodesCommon.OP_NOP6]: opNop<State>(flags),
  [OpcodesCommon.OP_NOP7]: opNop<State>(flags),
  [OpcodesCommon.OP_NOP8]: opNop<State>(flags),
  [OpcodesCommon.OP_NOP9]: opNop<State>(flags),
  [OpcodesCommon.OP_NOP10]: opNop<State>(flags),
});

/**
 * "Disabled" operations are explicitly forbidden from occurring anywhere in a
 * script, even within an unexecuted branch.
 */
export const disabledOperation = <
  State extends AuthenticationProgramStateError<Errors>,
  Errors
>() => (state: State) =>
  applyError<State, Errors>(AuthenticationErrorCommon.unknownOpcode, state);

export const disabledOperations = <
  State extends AuthenticationProgramStateError<Errors>,
  Errors
>() => ({
  [OpcodesCommon.OP_CAT]: disabledOperation<State, Errors>(),
  [OpcodesCommon.OP_SUBSTR]: disabledOperation<State, Errors>(),
  [OpcodesCommon.OP_LEFT]: disabledOperation<State, Errors>(),
  [OpcodesCommon.OP_RIGHT]: disabledOperation<State, Errors>(),
  [OpcodesCommon.OP_INVERT]: disabledOperation<State, Errors>(),
  [OpcodesCommon.OP_AND]: disabledOperation<State, Errors>(),
  [OpcodesCommon.OP_OR]: disabledOperation<State, Errors>(),
  [OpcodesCommon.OP_XOR]: disabledOperation<State, Errors>(),
  [OpcodesCommon.OP_2MUL]: disabledOperation<State, Errors>(),
  [OpcodesCommon.OP_2DIV]: disabledOperation<State, Errors>(),
  [OpcodesCommon.OP_MUL]: disabledOperation<State, Errors>(),
  [OpcodesCommon.OP_DIV]: disabledOperation<State, Errors>(),
  [OpcodesCommon.OP_MOD]: disabledOperation<State, Errors>(),
  [OpcodesCommon.OP_LSHIFT]: disabledOperation<State, Errors>(),
  [OpcodesCommon.OP_RSHIFT]: disabledOperation<State, Errors>(),
});
