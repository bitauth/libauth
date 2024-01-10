/* eslint-disable max-lines */
/**
 * Because this file is consumed by the `doc:generate-json-schema` package
 * script to produce a JSON schema, large sections of the below documentation
 * are copied from this library's `Transaction` and `CompilationData` types.
 *
 * This is preferable to importing those types, as most documentation needs to
 * be slightly modified for this context, and avoiding imports in this file
 * makes it easier to provide a stable API.
 */

/**
 * A `WalletTemplate` specifies a set of locking scripts, unlocking scripts, and
 * other information required to use a certain wallet protocol. Templates
 * fully describe wallet protocols in a way that can be shared between
 * software clients.
 */
export type WalletTemplate = {
  /**
   * The URI that identifies the JSON Schema used by this template. Try:
   * `https://libauth.org/schemas/wallet-template-v0.schema.json`
   * to enable documentation, autocompletion, and validation in JSON documents.
   */
  $schema?: string;
  /**
   * An optionally multi-line, free-form, human-readable description for this
   * wallet template (for use in user interfaces). If displayed, this
   * description should use a monospace font to properly render ASCII diagrams.
   *
   * Descriptions have no length limit, but in user interfaces with limited
   * space, they should be hidden beyond the first newline character or `140`
   * characters until revealed by the user (e.g. by hiding the remaining
   * description until the user activates a "show more" link).
   */
  description?: string;
  /**
   * A map of entities defined in this wallet template.
   *
   * Object keys are used as entity identifiers, and by convention, should use
   * `snake_case`.
   */
  entities: { [entityId: string]: WalletTemplateEntity };
  /**
   * A single-line, Title Case, human-readable name for this authentication
   * template (for use in user interfaces).
   */
  name?: string;
  /**
   * A scenario describes a context in which one or more scripts might be used.
   * Scenarios are used for transaction estimation and as an integrated testing
   * system for wallet templates.
   *
   * Object keys are used as scenario identifiers, and by convention, should use
   * `snake_case`.
   */
  scenarios?: { [scenarioId: string]: WalletTemplateScenario };
  /**
   * A map of scripts used in this wallet template.
   *
   * Object keys are used as script identifiers, and by convention, should use
   * `snake_case`.
   */
  scripts: {
    [scriptId: string]:
      | WalletTemplateScript
      | WalletTemplateScriptLocking
      | WalletTemplateScriptTested
      | WalletTemplateScriptUnlocking;
  };
  /**
   * A list of authentication virtual machine versions supported by this
   * template.
   *
   * Virtual machine identifiers use the format `CODE_YYYY_MM`, where `CODE` is
   * the currency code used to identify the network, and `YYYY_MM` is the year
   * and month in which the specified VM version became active on the indicated
   * network.
   *
   * Identifiers with the `_SPEC` suffix indicate that this template is intended
   * for compatibility with a future virtual machine version, but at the time
   * the template was created, that virtual machine had not yet become active on
   * the specified chain.
   */
  supported: AuthenticationVirtualMachineIdentifier[];
  /**
   * A number identifying the format of this WalletTemplate.
   * Currently, this implementation requires `version` be set to `0`.
   */
  version: 0;
};

/**
 * Allowable identifiers for authentication virtual machine versions. The `BCH`
 * prefix identifies the Bitcoin Cash network, the `XEC` prefix identifies the
 * eCash network, the `BSV` prefix identifies the Bitcoin SV network, and the
 * `BTC` prefix identifies the Bitcoin Core network. VM versions are named
 * according to the date they were deployed on the indicated network.
 *
 * For each network prefix, a `_SPEC` VM version is reserved to indicate that
 * the template requires a custom, not-yet-deployed VM version (e.g. one or more
 * CHIPs). By convention, templates marked for `_SPEC` VMs should indicate their
 * requirements in the template description. After deployment of the `_SPEC` VM,
 * when template compatibility is verified, the template's `supported` array
 * should be updated to indicate compatibility with the live VM version.
 */
export type AuthenticationVirtualMachineIdentifier =
  | 'BCH_2020_05'
  | 'BCH_2021_05'
  | 'BCH_2022_05'
  | 'BCH_2023_05'
  | 'BCH_SPEC'
  | 'BSV_2020_02'
  | 'BSV_SPEC'
  | 'BTC_2017_08'
  | 'BTC_SPEC'
  | 'XEC_2020_05'
  | 'XEC_SPEC';

/**
 * An object describing the configuration for a particular entity within an
 * wallet template.
 */
export type WalletTemplateEntity = {
  /**
   * An optionally multi-line, free-form, human-readable description for this
   * entity (for use in user interfaces). If displayed, this description
   * should use a monospace font to properly render ASCII diagrams.
   */
  description?: string;
  /**
   * A single-line, Title Case, human-readable name for this entity for use in
   * user interfaces and error messages, e.g.: `Trusted Third-Party`.
   */
  name?: string;
  /**
   * An array of the identifiers of each script the entity must be capable of
   * generating, e.g. each of the unlocking scripts this entity might use.
   *
   * Provided the necessary variables, any entity can construct any script, but
   * this option allows us to hint to more advanced wallets which scripts to
   * recommend to users. (Especially when many scripts require inter-entity
   * communication initiated by a user.)
   *
   * If not provided, this property is assumed to include all scripts in the
   * template.
   */
  scripts?: string[];
  /**
   * A map of variables that must be provided by this entity for use in the
   * template's scripts. Some variables are required before locking script
   * generation, while some variables can or must be resolved only before
   * unlocking script generation.
   *
   * Object keys are used as variable identifiers, and by convention, should use
   * `snake_case`.
   */
  variables?: { [variableId: string]: WalletTemplateVariable };
};

/**
 * An object defining the data to use while compiling a scenario.
 */
export type WalletTemplateScenarioData = {
  /**
   * A map of full identifiers to CashAssembly scripts that compile to each
   * identifier's value for this scenario. Allowing `bytecode` to be specified
   * as scripts (rather than e.g. hex) offers greater power and flexibility.
   *
   * Bytecode scripts have access to each other and all other template scripts
   * and defined variables, however, cyclical references will produce an error
   * at compile time. Also, because the results of these compilations will be
   * used to generate the compilation context for this scenario, these scripts
   * may not use compiler operations that themselves require access to
   * compilation context (e.g. signatures).
   *
   * The provided `fullIdentifier` should match the complete identifier for
   * each item, e.g. `some_wallet_data`, `variable_id.public_key`, or
   * `variable_id.signature.all_outputs`.
   *
   * All `AddressData` and `WalletData` variables must be provided via
   * `bytecode` (though the default scenario automatically includes reasonable
   * values), and pre-computed results for operations of other variable types
   * (e.g. `key.public_key`) may also be provided via this property.
   *
   * Because each bytecode identifier may precisely match the identifier of the
   * variable it defines for this scenario, references between these scripts
   * must refer to the target script with a `_scenario.` prefix. E.g. to
   * reference a sibling script `my_foo` from `my_bar`, the `my_bar` script must
   * use the identifier `_scenario.my_foo`.
   */
  bytecode?: { [fullIdentifier: string]: string };
  /**
   * The current block height at the "address creation time" implied in this
   * scenario.
   */
  currentBlockHeight?: number;
  /**
   * The current MTP block time as a UNIX timestamp at the "address creation
   * time" implied in this scenario.
   *
   * Note, this is never a current timestamp, but rather the median timestamp of
   * the last 11 blocks. It is therefore approximately one hour in the past.
   *
   * Every block has a precise MTP block time, much like a block height. See
   * BIP113 for details.
   */
  currentBlockTime?: number;
  /**
   * An object describing the settings used for `HdKey` variables in this
   * scenario.
   */
  hdKeys?: {
    /**
     * The current address index to be used for this scenario. The
     * `addressIndex` gets added to each `HdKey`s `addressOffset` to calculate
     * the dynamic index (`i`) used in each `privateDerivationPath` or
     * `publicDerivationPath`.
     *
     * This is required for any compiler operation that requires derivation.
     * Typically, the value is incremented by one for each address in a wallet.
     *
     * Defaults to `0`.
     */
    addressIndex?: number;
    /**
     * A map of entity IDs to HD public keys. These HD public keys are used to
     * derive public keys for each `HdKey` variable assigned to that entity
     * according to its `publicDerivationPath`.
     *
     * HD public keys may be encoded for either mainnet or testnet (the network
     * information is ignored).
     *
     * If both an HD private key (in `hdPrivateKeys`) and HD public key (in
     * `hdPublicKeys`) are provided for the same entity in the same scenario
     * (not recommended), the HD private key is used.
     */
    hdPublicKeys?: { [entityId: string]: string };
    /**
     * A map of entity IDs to master HD private keys. These master HD private
     * keys are used to derive each `HdKey` variable assigned to that entity
     * according to its `privateDerivationPath`.
     *
     * HD private keys may be encoded for either mainnet or testnet (the network
     * information is ignored).
     *
     * If both an HD private key (in `hdPrivateKeys`) and HD public key (in
     * `hdPublicKeys`) are provided for the same entity in the same scenario
     * (not recommended), the HD private key is used.
     */
    hdPrivateKeys?: { [entityId: string]: string };
  };
  /**
   * An object describing the settings used for `Key` variables in this
   * scenario.
   */
  keys?: {
    /**
     * A map of `Key` variable IDs to their 32-byte, hexadecimal-encoded private
     * key values.
     */
    privateKeys?: { [variableId: string]: string };
  };
};

/**
 * A type that describes the configuration for a particular locking or
 * unlocking bytecode within a wallet template scenario.
 *
 * Bytecode may be specified as either a hexadecimal-encoded string or an object
 * describing the required compilation.
 *
 * For `sourceOutputs` and `transaction.inputs`, defaults to
 * `{ script: ["copy"], overrides: {} }`. For `transaction.outputs`, defaults to
 * `{ script: ["copy"], overrides: { "hdKeys": { "addressIndex": 1 } } }`.
 */
export type WalletTemplateScenarioBytecode =
  | string
  | {
      /**
       * The identifier of the script to compile when generating this bytecode.
       * May also be set to `["copy"]`, which is automatically replaced with the
       * identifier of the locking or unlocking script under test, respectively.
       *
       * If undefined, defaults to `["copy"]`.
       */
      script?: string | ['copy'];
      /**
       * Scenario data that extends the scenario's top-level `data` during
       * script compilation.
       *
       * Each property is extended individually – to modify a property set by
       * the top-level scenario `data`, the new value must be listed here.
       *
       * Defaults to `{}` for `sourceOutputs` and `transaction.inputs`; defaults
       * to `{ "hdKeys": { "addressIndex": 1 } }` for `transaction.outputs`.
       */
      overrides?: WalletTemplateScenarioData;
    };

/**
 * An example input used to define a scenario for a wallet template.
 */
export type WalletTemplateScenarioInput = {
  /**
   * The index of the output in the transaction from which this input is spent.
   *
   * If undefined, this defaults to the same index as the input itself (so that
   * by default, every outpoint in the produced transaction is different, even
   * if an empty `outpointTransactionHash` is used for each transaction).
   */
  outpointIndex?: number;
  /**
   * A 32-byte, hexadecimal-encoded hash of the transaction from which this
   * input is spent in big-endian byte order. This is the byte order typically
   * seen in block explorers and user interfaces (as opposed to little-endian
   * byte order, which is used in standard P2P network messages).
   *
   * If undefined, this defaults to the value:
   * `0000000000000000000000000000000000000000000000000000000000000001`
   *
   * A.K.A. Outpoint `Transaction ID`
   */
  outpointTransactionHash?: string;
  /**
   * The positive, 32-bit unsigned integer used as the "sequence number" for
   * this input.
   *
   * If undefined, this defaults to `0`.
   *
   * @remarks
   * A sequence number is a complex bitfield that can encode several properties
   * about an input:
   * - **sequence age support** – whether or not the input can use
   * `OP_CHECKSEQUENCEVERIFY`, and the minimum number of blocks or length of
   * time that has passed since this input's source transaction was mined (up
   * to approximately 1 year).
   * - **locktime support** – whether or not the input can use
   * `OP_CHECKLOCKTIMEVERIFY`
   *
   * **Sequence Age Support**
   *
   * Sequence number age is enforced by mining consensus – a transaction is
   * invalid until it has "aged" such that all outputs referenced by its
   * age-enabled inputs are at least as old as claimed by their respective
   * sequence numbers.
   *
   * This allows sequence numbers to function as a "relative locktime" for each
   * input: a `lockingBytecode` can use the `OP_CHECKSEQUENCEVERIFY` operation
   * to verify that the funds being spent have been "locked" for a minimum
   * required amount of time (or block count). This can be used in protocols
   * that require a reliable "proof-of-publication", like escrow, time-delayed
   * withdrawals, and various payment channel protocols.
   *
   * Sequence age support is enabled unless the "disable bit" – the most
   * significant bit – is set (i.e. the sequence number is less than
   * `(1 << 31) >>> 0`/`0b10000000000000000000000000000000`/`2147483648`).
   *
   * If sequence age is enabled, the "type bit" – the most significant bit in
   * the second-most significant byte
   * (`1 << 22`/`0b1000000000000000000000`/`2097152`) – indicates the unit type
   * of the specified age:
   *  - if set, the age is in units of `512` seconds (using Median Time-Past)
   *  - if not set, the age is a number of blocks
   *
   * The least significant 16 bits specify the age (i.e.
   * `age = sequenceNumber & 0x0000ffff`). This makes the maximum age either
   * `65535` blocks (about 1.25 years) or `33553920` seconds (about 1.06 years).
   *
   * **Locktime Support**
   *
   * Locktime support is disabled for an input if the sequence number is exactly
   * `0xffffffff` (`4294967295`). Because this value requires the "disable bit"
   * to be set, disabling locktime support also disables sequence age support.
   *
   * With locktime support disabled, if  either `OP_CHECKLOCKTIMEVERIFY` or
   * `OP_CHECKSEQUENCEVERIFY` are encountered during the validation of
   * `unlockingBytecode`, an error is produced, and the transaction is invalid.
   *
   * ---
   *
   * The term "sequence number" was the name given to this field in the Satoshi
   * implementation of the bitcoin transaction format. The field was originally
   * intended for use in a multi-party signing protocol where parties updated
   * the "sequence number" to indicate to miners that this input should replace
   * a previously-signed input in an existing, not-yet-mined transaction. The
   * original use-case was not completed and relied on behavior that can not be
   * enforced by mining consensus, so the field was mostly-unused until it was
   * repurposed by BIP68 in block `419328`. See BIP68, BIP112, and BIP113 for
   * details.
   */
  sequenceNumber?: number;
  /**
   * The `unlockingBytecode` value of this input for this scenario. This must be
   * either `["slot"]`, indicating that this input contains the
   * `unlockingBytecode` under test by the scenario, or an
   * `WalletTemplateScenarioBytecode`.
   *
   * For a scenario to be valid, `unlockingBytecode` must be `["slot"]` for
   * exactly one input in the scenario.
   *
   * Defaults to `["slot"]`.
   */
  unlockingBytecode?: WalletTemplateScenarioBytecode | ['slot'];
};

/**
 * An example output used to define a scenario for a wallet template.
 */
export type WalletTemplateScenarioOutput<IsSourceOutput extends boolean> = {
  /**
   * The locking bytecode used to encumber this output.
   *
   * `lockingBytecode` values may be provided as a hexadecimal-encoded string or
   * as an object describing the required compilation. If undefined, defaults to
   *  `{}`, which uses the default values for `script` and `overrides`,
   * respectively.
   *
   * Only source outputs may specify a `lockingBytecode` of `["slot"]`; this
   * identifies the source output in which the locking script under test will be
   * placed. (To be valid, every scenario's `sourceOutputs` property must have
   * exactly one source output slot and one input slot at the same index.)
   */
  readonly lockingBytecode?: IsSourceOutput extends true
    ? WalletTemplateScenarioBytecode | ['slot']
    : WalletTemplateScenarioBytecode;
  /**
   * The value of the output in satoshis, the smallest unit of bitcoin.
   *
   * In a valid transaction, this is a positive integer, from `0` to the maximum
   * number of satoshis available to the transaction.
   *
   * The maximum number of satoshis in existence is about 1/4 of
   * `Number.MAX_SAFE_INTEGER` (`9007199254740991`), so typically, this value
   * is defined using a `number`. However, this value may also be defined using
   * a 16-character, hexadecimal-encoded `string`, to allow for the full range
   * of the 64-bit unsigned, little-endian integer used to encode
   * `valueSatoshis` in the encoded output format, e.g. `"ffffffffffffffff"`.
   * This is useful for representing scenarios where intentionally excessive
   * values are provided (to ensure an otherwise properly-signed transaction can
   * never be included in the blockchain), e.g. transaction size estimations or
   * off-chain Bitauth signatures.
   *
   * If undefined, this defaults to: `0`.
   */
  valueSatoshis?: number | string;

  /**
   * The CashToken contents of this output. This property is only defined if the
   * output contains one or more tokens. For details, see
   * `CHIP-2022-02-CashTokens`.
   */
  token?: {
    /**
     * The number of fungible tokens (of `category`) held in this output.
     *
     * Because `Number.MAX_SAFE_INTEGER` (`9007199254740991`) is less than the
     * maximum token amount (`9223372036854775807`), this value may also be
     * provided as a string, e.g. `"9223372036854775807"`.
     *
     * If undefined, this defaults to: `0`.
     */
    amount?: number | string;
    /**
     * The 32-byte, hexadecimal-encoded token category ID to which the token(s)
     * in this output belong in big-endian byte order. This is the byte order
     * typically seen in block explorers and user interfaces (as opposed to
     * little-endian byte order, which is used in standard P2P
     * network messages).
     *
     * If undefined, this defaults to the value:
     * `0000000000000000000000000000000000000000000000000000000000000002`
     */
    category?: string;
    /**
     * If present, the non-fungible token (NFT) held by this output. If the
     * output does not include a non-fungible token, `undefined`.
     */
    nft?: {
      /**
       * The capability of this non-fungible token, must be either `minting`,
       * `mutable`, or `none`.
       *
       * If undefined, this defaults to: `none`.
       */
      capability?: 'minting' | 'mutable' | 'none';
      /**
       * The hex-encoded commitment contents included in the non-fungible token
       * held in this output.
       *
       * If undefined, this defaults to: `""` (a zero-length commitment).
       */
      commitment?: string;
    };
  };
};

/**
 * A transaction output used to define a wallet template scenario
 * transaction.
 */
export type WalletTemplateScenarioTransactionOutput =
  WalletTemplateScenarioOutput<false>;

/**
 * A source output used by a wallet template scenario.
 */
export type WalletTemplateScenarioSourceOutput =
  WalletTemplateScenarioOutput<true>;

/**
 * An object describing the configuration for a particular scenario within an
 * wallet template.
 */
export type WalletTemplateScenario = {
  /**
   * An object defining the data to use while compiling this scenario. The
   * properties specified here are used to extend the existing scenario data
   * based on this scenario's `extends` property.
   *
   * Each property is extended individually – to unset a previously-set
   * property, the property must be individually overridden in this object.
   */
  data?: WalletTemplateScenarioData;

  /**
   * An optionally multi-line, free-form, human-readable description for this
   * scenario (for use in user interfaces). If displayed, this description
   * should use a monospace font to properly render ASCII diagrams.
   */
  description?: string;
  /**
   * The identifier of the scenario that this scenario extends. Any `data` or
   * `transaction` properties not defined in this scenario inherit from the
   * extended parent scenario.
   *
   * If undefined, this scenario is assumed to extend the default scenario:
   *
   * - The default values for `data` are set:
   *   - The identifiers of all `Key` variables and entities in this template
   * are lexicographically sorted, then each is assigned an incrementing
   * positive integer – beginning with `1` – encoded as an unsigned, 256-bit,
   * big-endian integer (i.e. `0x0000...0001` (32 bytes), `0x0000...0002`,
   * `0x0000...0003`, etc.). For `Key`s, this assigned value is used as the
   * private key; For entities, the assigned value is used as the master seed of
   * that entity's `HdPrivateKey`. If `hdKey` is set, the `addressIndex` is set
   * to `0`.
   *   - `currentBlockHeight` is set to `2`. This is the height of the second
   * mined block after the genesis block:
   * `000000006a625f06636b8bb6ac7b960a8d03705d1ace08b1a19da3fdcc99ddbd`. This
   * default value was chosen to be low enough to simplify the debugging of
   * block height offsets while remaining differentiated from `0` and `1`, which
   * are used both as boolean return values and for control flow.
   *   - `currentBlockTime` is set to `1231469665`. This is the Median Time-Past
   * block time (BIP113) of block `2`.
   *
   * - Then `transaction` is set based on use:
   *   - if the scenario is being used for transaction estimation, all
   * transaction properties are taken from the transaction being estimated.
   *   - if the scenario is being used for script testing and validation, the
   * default value for each `transaction` property is used.
   *
   * When a scenario is extended, each property of `data` and `transaction` is
   * extended individually: if the extending scenario does not provide a new
   * value for `data.bytecode.value` or `transaction.property`, the parent value
   * is used. To avoid inheriting a parent value, each child value must be
   * individually overridden.
   */
  extends?: string;
  /**
   * A single-line, Title Case, human-readable name for this scenario for use in
   * user interfaces, e.g.: `Delayed Recovery`.
   */
  name?: string;
  /**
   * The transaction within which this scenario should be evaluated. This is
   * used for script testing and validation.
   *
   * If undefined, inherits the default value for each property:
   * ```json
   * {
   *   "inputs": [{ "unlockingBytecode": ['slot'] }],
   *   "locktime": 0,
   *   "outputs": [{ "lockingBytecode": {} }],
   *   "version": 2
   * }
   * ```
   *
   * Any `transaction` property that is not set will be inherited from the
   * scenario specified by `extends`. when specifying the `inputs` and `outputs`
   * properties, each input and output extends the default values for inputs and
   * outputs, respectively.
   *
   * For example, an input of `{}` is interpreted as:
   * ```json
   * {
   *   "outpointIndex": 0,
   *   "outpointTransactionHash":
   *     "0000000000000000000000000000000000000000000000000000000000000000",
   *   "sequenceNumber": 0,
   *   "unlockingBytecode": ['slot']
   * }
   * ```
   * And an output of `{}` is interpreted as:
   * ```json
   * {
   *   "lockingBytecode": {
   *     "script": ['copy'],
   *     "overrides": { "hdKeys": { "addressIndex": 1 } }
   *   },
   *   "valueSatoshis": 0
   * }
   * ```
   */
  transaction?: {
    /**
     * The list of inputs to use when generating the transaction for this
     * scenario.
     *
     * To be valid the `inputs` property must have exactly one input with
     * `unlockingBytecode` set to `["slot"]`. This is the input in which the
     * unlocking script under test will be placed.
     *
     * If undefined, inherits the default scenario `inputs` value:
     * `[{ "unlockingBytecode": ["slot"] }]`.
     */
    inputs?: WalletTemplateScenarioInput[];
    /**
     * The locktime to use when generating the transaction for this scenario. A
     * positive integer from `0` to a maximum of `4294967295` – if undefined,
     * defaults to `0`.
     *
     * Locktime can be provided as either a timestamp or a block height. Values
     * less than `500000000` are understood to be a block height (the current
     * block number in the chain, beginning from block `0`). Values greater than
     * or equal to `500000000` are understood to be a UNIX timestamp.
     *
     * For validating timestamp values, the median timestamp of the last 11
     * blocks (Median Time-Past) is used. The precise behavior is defined in
     * BIP113.
     *
     * If the `sequenceNumber` of every transaction input is set to `0xffffffff`
     * (`4294967295`), locktime is disabled, and the transaction may be added to
     * a block even if the specified locktime has not yet been reached. When
     * locktime is disabled, if an `OP_CHECKLOCKTIMEVERIFY` operation is
     * encountered during the verification of any input, an error is produced,
     * and the transaction is invalid.
     *
     * @remarks
     * There is a subtle difference in how `locktime` is disabled for a
     * transaction and how it is "disabled" for a single input: `locktime` is
     * only disabled for a transaction if every input has a sequence number of
     * `0xffffffff`; however, within each input, if the sequence number is set
     * to `0xffffffff`, locktime is disabled for that input (and
     * `OP_CHECKLOCKTIMEVERIFY` operations will error if encountered).
     *
     * This difference is a minor virtual machine optimization – it allows
     * inputs to be properly validated without requiring the virtual machine to
     * check the sequence number of every other input (only that of the current
     * input).
     *
     * This is inconsequential for valid transactions, since any transaction
     * that disables `locktime` must have disabled locktime for all of its
     * inputs; `OP_CHECKLOCKTIMEVERIFY` is always properly enforced. However,
     * because an input can individually "disable locktime" without the full
     * transaction *actually disabling locktime*, it is possible that a
     * carefully-crafted transaction may fail to verify because "locktime is
     * disabled" for the input – even if locktime is actually enforced on the
     * transaction level.
     */
    locktime?: number;
    /**
     * The list of outputs to use when generating the transaction for this
     * scenario.
     *
     * If undefined, defaults to `[{ "lockingBytecode": {} }]`.
     */
    outputs?: WalletTemplateScenarioTransactionOutput[];
    /**
     * The version to use when generating the transaction for this scenario. A
     * positive integer from `0` to a maximum of `4294967295` – if undefined,
     * inherits the default scenario `version` value: `2`.
     */
    version?: number;
  };
  /**
   * The list of source outputs (a.k.a. UTXOs) to use when generating the
   * compilation context for this scenario.
   *
   * The `sourceOutputs` property must have the same length as
   * `transaction.inputs`, and each source output must be ordered to match the
   * index of the input that spends it.
   *
   * To be valid the `sourceOutputs` property must have exactly one source
   * output with `lockingBytecode` set to `["slot"]` – the output at the same
   * index as the `["slot"]` input in `transaction.inputs`.
   *
   * If undefined, defaults to `[{ "lockingBytecode": ["slot"] }]`.
   */
  sourceOutputs?: WalletTemplateScenarioSourceOutput[];
};

/**
 * An object describing the configuration for a particular script within an
 * wallet template.
 */
export type WalletTemplateScript = {
  /**
   * A single-line, human-readable name for this script (for use in user
   * interfaces).
   */
  name?: string;
  /**
   * The script definition in CashAssembly.
   */
  script: string;
};

export type WalletTemplateScriptUnlocking = WalletTemplateScript & {
  /**
   * TODO: not yet implemented
   *
   * The minimum input age required for this unlocking script to become valid.
   *
   * This value is provided as a CashAssembly script that must compile to the
   * least significant 3 bytes of the minimum sequence number required for this
   * unlocking script to be valid (the "type bit" and the 2-byte "value" – see
   * BIP68 for details). This script has access to all other template scripts
   * and variables, but cyclical references will produce an error at compile
   * time.
   *
   * In supporting wallets, this value can be computed at address creation
   * time, and the remaining time for which any UTXO remains "age-locked" can be
   * displayed in user interfaces (by parsing the "type bit" and "value" as
   * described in BIP68).
   *
   * Note, because the precise value used by `OP_CHECKSEQUENCEVERIFY` can be
   * provided in the unlocking script, it is trivial to create an unlocking
   * script for which a proper value for `ageLock` is not possible to determine
   * until the spending transaction is prepared. These cases are intentionally
   * out-of-scope for this property. Instead, `ageLock` should only be used
   * for unlocking scripts where the expected value can be compiled at address
   * creation time.
   */
  ageLock?: string;
  /**
   * The identifier of the scenario to use for this unlocking script when
   * compiling an estimated transaction.
   *
   * Using estimate scenarios, it's possible for wallet software to compute
   * an "estimated transaction", an invalid transaction that is guaranteed to
   * be the same byte length as the final transaction. This length can be used
   * to calculate the required transaction fee and assign values to the
   * transaction's change output(s). Because estimate scenarios provide
   * "estimated" values for all variables, this estimation can be done by a
   * single entity without input from other entities.
   *
   * If not provided, the default scenario will be used for estimation. The
   * default scenario only provides values for each `Key` and `HdKey` variable,
   * so compilations requiring other variables will produce errors. See
   * `WalletTemplateScenario.extends` for details.
   */
  estimate?: string;
  /**
   * A list of the scenario identifiers that – when used to compile this
   * unlocking script and the script it unlocks – result in bytecode that fails
   * program verification.
   *
   * These scenarios can be used to test this script in development and review.
   */
  fails?: string[];
  /**
   * A list of the scenario identifiers that – when used to compile this
   * unlocking script and the script it unlocks – result in a compilation error.
   *
   * These scenarios can be used to test this script in development and review.
   */
  invalid?: string[];
  /**
   * A list of the scenario identifiers that – when used to compile this
   * unlocking script and the script it unlocks – result in bytecode that
   * passes program verification.
   *
   * These scenarios can be used to test this script in development and review.
   */
  passes?: string[];
  /**
   * The expected type of time locks in this script.
   *
   * Because `OP_CHECKLOCKTIMEVERIFY` reads from a transaction's `locktime`
   * property, every input to a given transaction must share the same time lock
   * type. This differs from `OP_CHECKSEQUENCEVERIFY` in that each input has its
   * own `sequenceNumber`, so compatibility is not required.
   *
   * If a transaction includes multiple inputs using scripts with `timeLockType`
   * defined, and the types are not compatible, generation should fail.
   *
   * The `timestamp` type indicates that the transaction's locktime is provided
   * as a UNIX timestamp (the `locktime` value is greater than or equal to
   * `500000000`).
   *
   * The `height` type indicates that the transaction's locktime is provided as
   * a block height (the `locktime` value is less than `500000000`).
   *
   * If `timeLockType` is undefined, the script is assumed to have no reliance
   * on absolute time locks.
   */
  timeLockType?: 'height' | 'timestamp';
  /**
   * The identifier of the script that can be unlocked by this script.
   *
   * The presence of the `unlocks` property indicates that this script is an
   * unlocking script, and the script it unlocks must be a locking script.
   */
  unlocks: string;
};

export type WalletTemplateScriptLocking = WalletTemplateScript & {
  /**
   * Indicates if P2SH20 infrastructure should be used when producing bytecode
   * related to this script. For more information on P2SH20, see BIP16.
   *
   * When compiling locking scripts of type `p2sh20`, the result will be placed
   * in a P2SH20 "redeem script" format:
   * `OP_HASH160 <$(<lockingBytecode> OP_HASH160)> OP_EQUAL`
   *
   * When compiling unlocking scripts that unlock locking scripts of type
   * `p2sh20`, the result will be transformed into the P2SH20 unlocking format:
   * `unlockingBytecode <lockingBytecode>` (where `lockingBytecode` is the
   * compiled bytecode of the locking script, without the "redeem script"
   * transformation.)
   *
   * The presence of the `lockingType` property indicates that this script is a
   * locking script. It must be present on any script referenced by the
   * `unlocks` property of another script.
   */
  lockingType: 'p2sh20' | 'p2sh32' | 'standard';
};

export type WalletTemplateScriptTested = WalletTemplateScript & {
  /**
   * If set to `true`, indicates that this script should be wrapped in a push
   * statement for testing.
   *
   * This is useful for scripts that serve as "bytecode templates" – e.g.
   * formatted messages or signature preimages. These scripts are typically not
   * evaluated as bytecode but appear within push statements elsewhere in the
   * template.
   *
   * Defaults to `false`.
   */
  pushed?: boolean;
  /**
   * One or more tests that can be used during development and during template
   * validation to confirm the correctness of this tested script.
   */
  tests: { [testId: string]: WalletTemplateScriptTest };
};

export type WalletTemplateScriptTest = {
  /**
   * The script to evaluate after the script being tested. This can be used to
   * check that the tested script leaves the expected results on the stack. For
   * example, if the tested script is expected to leave 3 items of a specific
   * size on the stack, the `check` script could pop each resulting item from
   * the stack and examine it for correctness.
   *
   * In scenario testing, this script is appended to the script under test, and
   * together they are treated as the locking script. Program evaluation is
   * considered successful if the resulting program state can be verified by the
   * virtual machine (e.g. the resulting stack contains a single `1`, no errors
   * are produced, etc.).
   */
  check: string;
  /**
   * A single-line, Title Case, human-readable name for this test (for use in
   * user interfaces).
   */
  name?: string;
  /**
   * A list of the scenario identifiers that – when used to compile this
   * test and the script it tests – result in bytecode that fails program
   * verification. The `setup` script is used in place of an unlocking
   * script, and the concatenation of the script under test and the `check`
   * script are used in place of a locking script.
   *
   * These scenarios can be used to test this script in development and review.
   */
  fails?: string[];
  /**
   * A list of the scenario identifiers that – when used to compile this
   * test and the script it tests – result in a compilation error. The `setup`
   * script is used in place of an unlocking script, and the concatenation of
   * the script under test and the `check` script are used in place of a locking
   * script.
   *
   * These scenarios can be used to test this script in development and review.
   */
  invalid?: string[];
  /**
   * A list of the scenario identifiers that – when used to compile this
   * test and the script it tests – result in bytecode that passes program
   * verification. The `setup` script is used in place of an unlocking
   * script, and the concatenation of the script under test and the `check`
   * script are used in place of a locking script.
   *
   * These scenarios can be used to test this script in development and review.
   */
  passes?: string[];
  /**
   * A script to evaluate before the script being tested. This can be used to
   * push values to the stack that are operated on by the tested script.
   *
   * In scenario testing, this script is treated as the unlocking script.
   */
  setup?: string;
};

export type WalletTemplateVariableBase = {
  /**
   * A single-line, human readable description for this variable (for use in
   * user interfaces).
   */
  description?: string;
  /**
   * A single-line, Title Case, human-readable name for this variable (for use
   * in user interfaces).
   */
  name?: string;
  type: string;
};

export type WalletTemplateKeyBase = {
  /**
   * If set to `true`, indicates that this key should never be used to sign two
   * different messages.
   *
   * This is useful for contracts that use zero-confirmation escrow systems to
   * guarantee against double-spend attempts. By indicating that the user could
   * be subjected to losses if a key were used in multiple signatures, templates
   * can ensure that wallet implementations apply appropriate safeguards around
   * use of the key.
   *
   * Defaults to `false`.
   */
  neverSignTwice?: boolean;
};

export type WalletTemplateHdKey = WalletTemplateKeyBase &
  WalletTemplateVariableBase & {
    /**
     * A single-line, human readable description for this HD key.
     */
    description?: string;
    /**
     * A single-line, Title Case, human-readable name for this HD key.
     */
    name?: string;
    /**
     * The offset by which to increment the `addressIndex` provided in the
     * compilation data when deriving this `HdKey`. (Default: 0)
     *
     * This is useful for deriving the "next" (`1`) or "previous" (`-1`) address
     * to be used in the current compiler configuration.
     */
    addressOffset?: number;
    /**
     * The path to derive the entity's HD public key from the entity's master HD
     * private key. By default, `m` (i.e. the entity's HD public key represents
     * the same node in the HD tree as its HD private key).
     *
     * This can be used to specify another derivation path from which the
     * `publicDerivationPath` begins, e.g. `m/0'/1'/2'`. See
     * `publicDerivationPath` for details.
     *
     * This path must begin with an `m` (private derivation) and be fixed – it
     * cannot contain an `i` character to represent the address index, as a
     * dynamic hardened path would require a new HD public key for each address.
     */
    hdPublicKeyDerivationPath?: string;
    /**
     * The derivation path used to derive this `HdKey` from the owning entity's HD
     * private key. By default, `m/i`.
     *
     * This path uses the notation specified in BIP32 and the `i` character to
     * represent the location of the `addressIndex`:
     *
     * The first character must be `m` (private derivation), followed by sets of
     * `/` and a number representing the child index used in the derivation at
     * that depth. Hardened derivation is represented by a trailing `'`, and
     * hardened child indexes are represented with the hardened index offset
     * (`2147483648`) subtracted. The `i` character is replaced with the value of
     * `addressIndex` plus this `HdKey`'s `addressOffset`. If the `i` character is
     * followed by `'`, the hardened index offset is added (`2147483648`) and
     * hardened derivation is used.
     *
     * For example, `m/0/1'/i'` uses 3 levels of derivation, with child indexes in
     * the following order:
     *
     * `derive(derive(derive(node, 0), 2147483648 + 1), 2147483648 + addressIndex + addressOffset)`
     *
     * Because hardened derivation requires knowledge of the private key, `HdKey`
     * variables with `derivationPath`s that include hardened derivation cannot
     * use HD public derivation (the `hdPublicKeys` property in
     * `CompilationData`). Instead, compilation requires the respective HD private
     * key (`CompilationData.hdKeys.hdPrivateKeys`) or the fully-derived public
     * key (`CompilationData.hdKeys.derivedPublicKeys`).
     */
    privateDerivationPath?: string;
    /**
     * The derivation path used to derive this `HdKey`'s public key from the
     * owning entity's HD public key. If not set, the public equivalent of
     * `privateDerivationPath` is used. For the `privateDerivationPath` default of
     * `m/i`, this is `M/i`.
     *
     * If `privateDerivationPath` uses hardened derivation for some levels, but
     * later derivation levels use non-hardened derivation, `publicDerivationPath`
     * can be used to specify a public derivation path beginning from
     * `hdPublicKeyDerivationPath` (i.e. `publicDerivationPath` should always be a
     * non-hardened segment of `privateDerivationPath` that follows
     * `hdPublicKeyDerivationPath`).
     *
     * The first character must be `M` (public derivation), followed by sets of
     * `/` and a number representing the child index used in the non-hardened
     * derivation at that depth.
     *
     * For example, if `privateDerivationPath` is `m/0'/i`, it is not possible to
     * derive the equivalent public key with only the HD public key `M`. (The path
     * "`M/0'/i`" is impossible.) However, given the HD public key for `m/0'`, it
     * is possible to derive the public key of `m/0'/i` for any `i`. In this case,
     * `hdPublicKeyDerivationPath` would be `m/0'` and `publicDerivationPath`
     * would be the remaining `M/i`.
     *
     * @remarks
     * Non-hardened derivation paths are more useful for some templates, e.g. to
     * allow for new locking scripts to be generated without communicating new
     * public keys between entities for each. **However, using a non-hardened key
     * has critical security implications.** If an attacker gains possession of
     * both a parent HD *public key* and any child private key, the attacker can
     * easily derive the parent HD *private key*, and with it, all hardened and
     * non-hardened child keys. See BIP32 or
     * `crackHdPrivateNodeFromHdPublicNodeAndChildPrivateNode` for details.
     */
    publicDerivationPath?: string;
    /**
     * The `HdKey` (Hierarchical-Deterministic Key) type automatically manages key
     * generation and mapping in a standard way. For greater control, use `Key`.
     */
    type: 'HdKey';
  };

export type WalletTemplateKey = WalletTemplateKeyBase &
  WalletTemplateVariableBase & {
    /**
     * A single-line, human readable description for this key.
     */
    description?: string;
    /**
     * A single-line, Title Case, human-readable name for this key.
     */
    name?: string;
    /**
     * The `Key` type provides fine-grained control over key generation and
     * mapping. Most templates should instead use `HdKey`.
     *
     * Any HD (Hierarchical-Deterministic) derivation must be completed outside of
     * the templating system and provided at the time of use.
     */
    type: 'Key';
  };

export type WalletTemplateWalletData = WalletTemplateVariableBase & {
  /**
   * A single-line, human readable description for this wallet data.
   */
  description?: string;
  /**
   * A single-line, Title Case, human-readable name for this wallet data.
   */
  name?: string;
  /**
   * The `WalletData` type provides a static piece of data that should be
   * collected once and stored at the time of wallet creation. `WalletData`
   * should be persistent for the life of the wallet, rather than changing from
   * locking script to locking script.
   *
   * For address-specific data, use `AddressData`.
   */
  type: 'WalletData';
};

export type WalletTemplateAddressData = WalletTemplateVariableBase & {
  /**
   * A single-line, human readable description for this address data.
   */
  description?: string;
  /**
   * A single-line, Title Case, human-readable name for this address data.
   */
  name?: string;
  /**
   * `AddressData` is the most low-level variable type. It must be collected
   * and stored each time a script is generated (usually, a locking script).
   * `AddressData` can include any type of data, and can be used in any way.
   *
   * For more persistent data, use `WalletData`.
   */
  type: 'AddressData';
};

export type WalletTemplateVariable =
  | WalletTemplateAddressData
  | WalletTemplateHdKey
  | WalletTemplateKey
  | WalletTemplateWalletData;
