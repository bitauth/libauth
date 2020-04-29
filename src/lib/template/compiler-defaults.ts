export enum CompilerDefaults {
  /**
   * If unset, `variable.current_block_height` is set to `2` in each scenario.
   * This is the height of the second mined block after the genesis block:
   * `000000006a625f06636b8bb6ac7b960a8d03705d1ace08b1a19da3fdcc99ddbd`.
   *
   * This default value was chosen to be low enough to simplify the debugging of
   * block height offsets while remaining differentiated from `0` and `1` which
   * are used both as boolean return values and for control flow.
   */
  defaultScenarioCurrentBlockHeight = 2,
  /**
   * If unset, `variable.current_block_time` is set to `1231469665` in each
   * scenario. This is the Median Time-Past block time (BIP113) of block `2`
   * (the block used in `defaultScenarioCurrentBlockHeight`).
   */
  defaultScenarioCurrentBlockTime = 1231469665,
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
}
