import type { AuthenticationProgramStateCommon } from '../../../lib.js';

export interface SegWitState {
  readonly witnessBytecode: Uint8Array;
}

export interface AuthenticationProgramStateBTC
  extends AuthenticationProgramStateCommon,
    SegWitState {}
