import {
  createInstructionSetBch,
  createInstructionSetBch2023,
  createVirtualMachineBch2023,
  OpcodeDescriptionsBch,
  OpcodeDescriptionsBch2023,
  OpcodesBch,
  OpcodesBch2023,
} from './2023/bch-2023.js';

export * from './2023/bch-2023.js';
export * from './2025/bch-2025.js';
export * from './spec/bch-spec.js';

export const createVirtualMachineBch = createVirtualMachineBch2023;

/* eslint-disable @typescript-eslint/naming-convention */
export const Opcodes = OpcodesBch;

/**
 * @deprecated Alias of `OpcodeDescriptionsBch2023` for backwards-compatibility.
 */
export const OpcodeDescriptionsBCH2023 = OpcodeDescriptionsBch2023;
/**
 * @deprecated Alias of `OpcodeDescriptionsBch` for backwards-compatibility.
 */
export const OpcodeDescriptionsBCH = OpcodeDescriptionsBch;
/**
 * @deprecated Alias of `OpcodesBch` for backwards-compatibility.
 */
export const OpcodesBCH = OpcodesBch;
/**
 * @deprecated Alias of `OpcodesBch2023` for backwards-compatibility.
 */
export const OpcodesBCH2023 = OpcodesBch2023;
/**
 * @deprecated Alias of `createInstructionSetBch` for backwards-compatibility.
 */
export const createInstructionSetBCH = createInstructionSetBch;
/**
 * @deprecated Alias of `createInstructionSetBch2023` for backwards-compatibility.
 */
export const createInstructionSetBCH2023 = createInstructionSetBch2023;
/**
 * @deprecated Alias of `createVirtualMachineBch` for backwards-compatibility.
 */
export const createVirtualMachineBCH = createVirtualMachineBch;
/**
 * @deprecated Alias of `createVirtualMachineBch2023` for backwards-compatibility.
 */
export const createVirtualMachineBCH2023 = createVirtualMachineBch2023;

/* eslint-enable @typescript-eslint/naming-convention */
