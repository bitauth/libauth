import type {
  AuthenticationTemplateScenario,
  AuthenticationTemplateScenarioInput,
  AuthenticationTemplateScenarioSourceOutput,
  AuthenticationTemplateScenarioTransactionOutput,
} from '../lib';

export const simpleP2pkhOutput: AuthenticationTemplateScenarioSourceOutput = {
  lockingBytecode: { script: 'lockP2pkh' },
  valueSatoshis: 10_000,
};
export const simpleP2pkhInput: AuthenticationTemplateScenarioInput = {
  unlockingBytecode: { script: 'unlockP2pkh' },
};
export const emptyP2sh20Output: AuthenticationTemplateScenarioSourceOutput = {
  lockingBytecode: { script: 'lockEmptyP2sh20' },
  valueSatoshis: 10_000,
};
export const emptyP2sh20Input: AuthenticationTemplateScenarioInput = {
  unlockingBytecode: { script: 'unlockEmptyP2sh20' },
};

export const vmbTestOutput: AuthenticationTemplateScenarioTransactionOutput = {
  lockingBytecode: { script: 'vmbTestNullData' },
  valueSatoshis: 0,
};

export const slotOutput: AuthenticationTemplateScenarioSourceOutput = {
  lockingBytecode: ['slot'],
  valueSatoshis: 10_000,
};

export const slotInput: AuthenticationTemplateScenarioInput = {
  unlockingBytecode: ['slot'],
};

export const slot0Scenario: AuthenticationTemplateScenario = {
  sourceOutputs: [slotOutput, simpleP2pkhOutput],
  transaction: {
    inputs: [slotInput, simpleP2pkhInput],
    outputs: [vmbTestOutput],
  },
};
export const slot1Scenario: AuthenticationTemplateScenario = {
  sourceOutputs: [simpleP2pkhOutput, slotOutput],
  transaction: {
    inputs: [simpleP2pkhInput, slotInput],
    outputs: [vmbTestOutput],
  },
};
export const slot2Scenario: AuthenticationTemplateScenario = {
  sourceOutputs: [simpleP2pkhOutput, simpleP2pkhOutput, slotOutput],
  transaction: {
    inputs: [simpleP2pkhInput, simpleP2pkhInput, slotInput],
    outputs: [vmbTestOutput],
  },
};
export const slot9Scenario: AuthenticationTemplateScenario = {
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
