import type {
  WalletTemplateScenario,
  WalletTemplateScenarioInput,
  WalletTemplateScenarioSourceOutput,
  WalletTemplateScenarioTransactionOutput,
} from '../lib.js';

export const simpleP2pkhOutput: WalletTemplateScenarioSourceOutput = {
  lockingBytecode: { script: 'lockP2pkh' },
  valueSatoshis: 10_000,
};
export const simpleP2pkhInput: WalletTemplateScenarioInput = {
  unlockingBytecode: { script: 'unlockP2pkh' },
};
export const emptyP2sh20Output: WalletTemplateScenarioSourceOutput = {
  lockingBytecode: { script: 'lockEmptyP2sh20' },
  valueSatoshis: 10_000,
};
export const emptyP2sh20Input: WalletTemplateScenarioInput = {
  unlockingBytecode: { script: 'unlockEmptyP2sh20' },
};

export const vmbTestOutput: WalletTemplateScenarioTransactionOutput = {
  lockingBytecode: { script: 'vmbTestNullData' },
  valueSatoshis: 0,
};

export const slotOutput: WalletTemplateScenarioSourceOutput = {
  lockingBytecode: ['slot'],
  valueSatoshis: 10_000,
};

export const slotInput: WalletTemplateScenarioInput = {
  unlockingBytecode: ['slot'],
};

export const slot0Scenario: WalletTemplateScenario = {
  sourceOutputs: [slotOutput, simpleP2pkhOutput],
  transaction: {
    inputs: [slotInput, simpleP2pkhInput],
    outputs: [vmbTestOutput],
  },
};
export const slot1Scenario: WalletTemplateScenario = {
  sourceOutputs: [simpleP2pkhOutput, slotOutput],
  transaction: {
    inputs: [simpleP2pkhInput, slotInput],
    outputs: [vmbTestOutput],
  },
};
export const slot2Scenario: WalletTemplateScenario = {
  sourceOutputs: [simpleP2pkhOutput, simpleP2pkhOutput, slotOutput],
  transaction: {
    inputs: [simpleP2pkhInput, simpleP2pkhInput, slotInput],
    outputs: [vmbTestOutput],
  },
};
export const slot9Scenario: WalletTemplateScenario = {
  sourceOutputs: [
    simpleP2pkhOutput,
    simpleP2pkhOutput,
    simpleP2pkhOutput,
    simpleP2pkhOutput,
    simpleP2pkhOutput,
    simpleP2pkhOutput,
    simpleP2pkhOutput,
    simpleP2pkhOutput,
    simpleP2pkhOutput,
    slotOutput,
  ],
  transaction: {
    inputs: [
      simpleP2pkhInput,
      simpleP2pkhInput,
      simpleP2pkhInput,
      simpleP2pkhInput,
      simpleP2pkhInput,
      simpleP2pkhInput,
      simpleP2pkhInput,
      simpleP2pkhInput,
      simpleP2pkhInput,
      slotInput,
    ],
    outputs: [vmbTestOutput],
  },
};
