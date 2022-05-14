import type { AuthenticationProgramStateCommon } from '../../../lib';

export interface SegWitState {
  readonly witnessBytecode: Uint8Array;
}

export interface AuthenticationProgramStateBTC
  extends AuthenticationProgramStateCommon,
    SegWitState {}
