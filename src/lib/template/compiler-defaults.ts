export enum CompilerDefaults {
  /**
   * The `addressIndex` used by default scenarios.
   */
  defaultScenarioAddressIndex = 0,
  /**
   *
   * The value of `currentBlockHeight` in the default authentication template
   * scenario. This is the height of the second mined block after the genesis
   * block: `000000006a625f06636b8bb6ac7b960a8d03705d1ace08b1a19da3fdcc99ddbd`.
   *
   * This default value was chosen to be low enough to simplify the debugging of
   * block height offsets while remaining differentiated from `0` and `1` which
   * are used both as boolean return values and for control flow.
   */
  defaultScenarioCurrentBlockHeight = 2,
  /**
   * The value of `currentBlockTime` in the default authentication template
   * scenario. This is the Median Time-Past block time (BIP113) of block `2`
   * (the block used in `defaultScenarioCurrentBlockHeight`).
   */
  defaultScenarioCurrentBlockTime = 1231469665,
  /**
   * The default `outpointIndex` of inputs in scenarios.
   */
  defaultScenarioInputOutpointIndex = 0,
  /**
   * The default `outpointTransactionHash` of inputs in scenarios.
   */
  defaultScenarioInputOutpointTransactionHash = '0000000000000000000000000000000000000000000000000000000000000000',
  /**
   * The default `sequenceNumber` of inputs in scenarios.
   */
  defaultScenarioInputSequenceNumber = 0,
  /**
   * The default `unlockingBytecode` of untested inputs in scenarios.
   */
  defaultScenarioInputUnlockingBytecodeHex = '',
  /**
   * The default `satoshis` of outputs in scenarios.
   */
  defaultScenarioOutputSatoshis = 0,
  /**
   * The hexadecimal-encoded value of the `lockingBytecode` in the single
   * default output (`transaction.outputs`) of the default authentication
   * template scenario.
   */
  defaultScenarioTransactionOutputsLockingBytecodeHex = '',
  /**
   * The value of `transaction.locktime` in the default authentication template
   * scenario.
   */
  defaultScenarioTransactionLocktime = 0,
  /**
   * The value of `transaction.version` in the default authentication template
   * scenario. Transaction version `2` enables `OP_CHECKSEQUENCEVERIFY` as
   * described in BIP68, BIP112, and BIP113.
   */
  defaultScenarioTransactionVersion = 2,
  /**
   * The default value of the hypothetical UTXO being spent by the input under
   * test in a scenario.
   */
  defaultScenarioValue = 0,
  /**
   * If unset, each `HdKey` uses this `addressOffset`.
   */
  hdKeyAddressOffset = 0,
  /**
   * If unset, each `HdKey` uses this `hdPublicKeyDerivationPath`.
   */
  hdKeyHdPublicKeyDerivationPath = 'm',
  /**
   * If unset, each `HdKey` uses this `privateDerivationPath`.
   */
  hdKeyPrivateDerivationPath = 'm/i',

  /**
   * The prefix used to refer to other scenario bytecode scripts from within a
   * bytecode script. See `AuthenticationTemplateScenarioData.bytecode` for
   * details.
   */
  scenarioBytecodeScriptPrefix = '_scenario_',

  /**
   * The prefix used to identify the `check` script from a virtualized
   * `AuthenticationTemplateScriptTest`. For details, see
   * `authenticationTemplateToCompilationEnvironmentVirtualizedTests`.
   */
  virtualizedTestCheckScriptPrefix = '__virtualized_test_check_',

  /**
   * The prefix used to identify the concatenated tested and `check` script from
   * a virtualized `AuthenticationTemplateScriptTest`. For details, see
   * `authenticationTemplateToCompilationEnvironmentVirtualizedTests`.
   */
  virtualizedTestLockingScriptPrefix = '__virtualized_test_lock_',

  /**
   * The prefix used to identify the `setup` script from a virtualized
   * `AuthenticationTemplateScriptTest`. For details, see
   * `authenticationTemplateToCompilationEnvironmentVirtualizedTests`.
   */
  virtualizedTestUnlockingScriptPrefix = '__virtualized_test_unlock_',
}
