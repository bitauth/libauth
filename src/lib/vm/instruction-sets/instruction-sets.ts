import { OpcodeDescriptionsBchSpec, OpcodesBchSpec } from './bch/bch.js';

export * from './xec/xec.js';
export * from './bch/bch.js';
export * from './btc/btc.js';
export * from './common/common.js';

// eslint-disable-next-line @typescript-eslint/naming-convention
export const Opcodes = OpcodesBchSpec;
// eslint-disable-next-line @typescript-eslint/naming-convention
export const OpcodeDescriptions = OpcodeDescriptionsBchSpec;
