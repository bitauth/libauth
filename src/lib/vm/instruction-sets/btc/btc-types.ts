import type { AuthenticationProgramStateCommon } from '../../../lib.js';

export type SegWitState = {
  witnessBytecode: Uint8Array;
};

export type AuthenticationProgramStateBTC = AuthenticationProgramStateCommon &
  SegWitState;
