/**
 * An `AuthenticationTemplate` (A.K.A. `Bitauth Template`) specifies a set of
 * locking scripts, unlocking scripts, and other information required to use a
 * certain authentication scheme. Templates fully describe wallets and protocols
 * in a way that can be shared between software clients.
 */
export interface AuthenticationTemplate {
  /**
   * The URI which identifies the JSON Schema used by this template. Try:
   * `https://bitauth.com/schemas/authentication-template-v0.schema.json`
   * to enable documentation, autocompletion, and validation in JSON documents.
   */
  $schema?: string;

  /**
   * An optionally multi-line, free-form, human-readable description for this
   * authentication template (for use in user interfaces). When displayed, this
   * description should use a monospace font to properly render ASCII diagrams.
   */
  description?: string;

  /**
   * A map of entities defined in this authentication template. Object keys are
   * used as entity identifiers, and by convention, should use `snake_case`.
   *
   * See `AuthenticationTemplateEntity` for more information.
   */
  entities: { [entityId: string]: AuthenticationTemplateEntity };

  /**
   * A single-line, Title Case, human-readable name for this authentication
   * template (for use in user interfaces).
   */
  name?: string;

  /**
   * TODO: finish implementing scenarios
   *
   * Scenarios describe a complete environment for testing the authentication
   * template under certain conditions. They are most useful for development,
   * but they can also be used to validate the template in generalized wallets.
   */
  scenarios?: { [scenarioId: string]: AuthenticationTemplateScenario };

  /**
   * A map of scripts used in this authentication template. Object keys are used
   * as script identifiers, and by convention, should use `snake_case`.
   */
  scripts: {
    [scriptId: string]:
      | AuthenticationTemplateScript
      | AuthenticationTemplateScriptUnlocking
      | AuthenticationTemplateScriptLocking
      | AuthenticationTemplateScriptTested;
  };

  /**
   * A list of supported AuthenticationVirtualMachines for this template.
   */
  supported: AuthenticationVirtualMachineIdentifier[];

  /**
   * A number identifying the format of this AuthenticationTemplate.
   * Currently, this implementation requires `version` be set to `0`.
   */
  version: 0;
}

/**
 * Allowable identifiers for Bitcoin virtual machine versions. Identifiers are
 * based upon the month the VM version became active on the specified chain.
 *
 * Identifiers with the `_SPEC` suffix indicate that this template is intended
 * for compatibility with a future virtual machine version, but at the time the
 * template was create, that virtual machine had not yet become active on the
 * specified chain.
 *
 * The earliest possible `_SPEC` virtual machine version is `BCH_2020_11_SPEC`,
 * the first virtual machine version after the public release of the version `0`
 * AuthenticationTemplate format.
 */
export type AuthenticationVirtualMachineIdentifier =
  | 'BCH_2022_11_SPEC'
  | 'BCH_2022_11'
  | 'BCH_2022_05_SPEC'
  | 'BCH_2022_05'
  | 'BCH_2021_11_SPEC'
  | 'BCH_2021_11'
  | 'BCH_2021_05_SPEC'
  | 'BCH_2021_05'
  | 'BCH_2020_11_SPEC'
  | 'BCH_2020_11'
  | 'BCH_2020_05'
  | 'BCH_2019_11'
  | 'BCH_2019_05'
  | 'BSV_2020_02'
  | 'BSV_2018_11'
  | 'BTC_2017_08';

/**
 * An object describing the configuration for a particular entity within an
 * authentication template.
 */
export interface AuthenticationTemplateEntity {
  /**
   * A single-line, human readable description for this entity.
   */
  description?: string;
  /**
   * A single-line, Title Case, human-readable name for this entity, e.g.:
   * `Trusted Third-Party` (for use in user interfaces and error messages).
   */
  name?: string;
  /**
   * An array of the `id`s of each script the entity must be capable of
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
   * A map of variables which must be provided by this entity for use in the
   * template's scripts. Some variables are required before locking script
   * generation, while some variables can or must be resolved only before
   * unlocking script generation.
   */
  variables?: { [variableId: string]: AuthenticationTemplateVariable };
}

/**
 * A directive providing instructions for compiling a bytecode segment for use
 * in a scenario.
 */
export interface ScenarioDirective {
  script: string;
}

/**
 * An object describing the configuration for a particular scenario within an
 * authentication template.
 */
export interface AuthenticationTemplateScenario {
  /**
   * A single-line, human readable description for this scenario.
   */
  description?: string;
  /**
   * The identifier of the scenario which this scenario extends. Any properties
   * not defined in this scenario inherit from this parent scenario. By default,
   * all scenarios extend the built-in default scenario.
   */
  extends?: string;
  /**
   * A single-line, Title Case, human-readable name for this scenario, e.g.:
   * `Trusted Third-Party`
   */
  name?: string;
  /**
   * A transaction template to use when testing this scenario. Any properties
   * not defined in this transaction template inherit from the parent scenario.
   *
   * Scenario transaction templates are a variation of the `Transaction` type
   * modified for better compatibility with JSON and to add support for
   * `ScenarioDirectives`:
   * - In each input, the `outpointTransactionHash` is provided as a hex-encoded
   * string, and `unlockingBytecode` may be either a `Uint8Array` or a
   * `ScenarioDirective`.
   * - In each output, the `satoshis` value is provided as a number, and the
   * `lockingBytecode` may be either a `Uint8Array` or a `ScenarioDirective`.
   */
  /*
   * transaction?: Partial<
   *   Transaction<
   *     Input<string | ScenarioDirective, string>,
   *     Output<string | ScenarioDirective>
   *   >
   * >;
   */
  /**
   * A map of variable IDs to scripts defining their values in this scenario.
   * Scripts are encoded in BTL, and have access to all other template scripts
   * and variables. (However, cyclical references will produce an error at
   * compile time.)
   */
  variables?: {
    [id: string]: string;
  };
}

/**
 * An object describing the configuration for a particular script within an
 * authentication template.
 */
export interface AuthenticationTemplateScript {
  /**
   * A single-line, human-readable name for this script (for use in user
   * interfaces).
   */
  name?: string;
  /**
   * The script definition in BTL (Bitauth Templating Language).
   */
  script: string;
}

export interface AuthenticationTemplateScriptUnlocking
  extends AuthenticationTemplateScript {
  /**
   * The `id` of the script which can be unlocked by this script.
   *
   * The presence of the `unlocks` property indicates that this script is an
   * unlocking script, and the script it unlocks must be a locking script.
   */
  unlocks: string;
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
  timeLockType?: 'timestamp' | 'height';
}

export interface AuthenticationTemplateScriptLocking
  extends AuthenticationTemplateScript {
  /**
   * Indicates if P2SH infrastructure should be used when producing bytecode
   * related to this script. For more information on P2SH, see BIP16.
   *
   * When compiling locking scripts of type `p2sh`, the result will be placed in
   * a P2SH "redeem script" format:
   * `OP_HASH160 <$(<lockingBytecode> OP_HASH160)> OP_EQUAL`
   *
   * When compiling unlocking scripts which unlock locking scripts of type
   * `p2sh`, the result will be transformed into the P2SH unlocking format:
   * `unlockingBytecode <lockingBytecode>` (where `lockingBytecode` is the
   * compiled bytecode of the locking script, without the "redeem script"
   * transformation.)
   *
   * The presence of the `lockingType` property indicates that this script is a
   * locking script. It must be present on any script referenced by the
   * `unlocks` property of another script.
   */
  lockingType: 'standard' | 'p2sh';
}

export interface AuthenticationTemplateScriptTested
  extends AuthenticationTemplateScript {
  /**
   * One or more tests which can be used during development and during template
   * validation to confirm the correctness of this inline script.
   */
  tests: AuthenticationTemplateScriptTest[];
}

export interface AuthenticationTemplateScriptTest {
  /**
   * The script to evaluate after the script being tested. The test passes if
   * this script leaves only a 1 (ScriptNumber) on the stack.
   */
  check: string;
  /**
   * A single-line, Title Case, human-readable name for this test (for use in
   * user interfaces).
   */
  name?: string;
  /**
   * A script to evaluate before the script being tested. This can be used to
   * push values to the stack which are operated on by the inline script.
   */
  setup?: string;
}

export interface AuthenticationTemplateVariableBase {
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
  /**
   * TODO: revisit in future versions
   *
   * a script which must leave a 1 on the stack if the variable input is valid
   * (e.g. to check unusual signatures from each signer as they are received)
   */
  // validate?: string;
}

export interface HdKey extends AuthenticationTemplateVariableBase {
  /**
   * The offset by which to increment the `addressIndex` provided in the
   * compilation data when deriving this `HdKey`. (Default: 0)
   *
   * This is useful for deriving the "next" (`1`) or "previous" (`-1`) address
   * to be used in the current compilation context.
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
   * variables with `derivationPath`s which include hardened derivation cannot
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
   * non-hardened segment of `privateDerivationPath` which follows
   * `hdPublicKeyDerivationPath`).
   *
   * The first character must be `M` (public derivation), followed by sets of
   * `/` and a number representing the child index used in the non-hardened
   * derivation at that depth.
   *
   * For example, if `privateDerivationPath` is `m/0'/i`, it is not possible to
   * derive the equivalent public key with only the HD public key `M`. (The path
   * "`M/0'/i`" is impossible). However, given the HD public key for `m/0'`, it
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
}

export interface Key extends AuthenticationTemplateVariableBase {
  /**
   * The `Key` type provides fine-grained control over key generation and mapping.
   * Most templates should instead use `HdKey`.
   *
   * Any HD (Hierarchical-Deterministic) derivation must be completed outside of
   * the templating system and provided at the time of use.
   */
  type: 'Key';
}

export interface WalletData extends AuthenticationTemplateVariableBase {
  /**
   * A single-line, human readable description for this wallet data.
   */
  description?: string;
  /**
   * A single-line, Title Case, human-readable name for this wallet data.
   */
  name?: string;
  /**
   * The `WalletData` type provides a static piece of data which should be
   * collected once and stored at the time of wallet creation. `WalletData`
   * should be persistent for the life of the wallet, rather than changing from
   * locking script to locking script.
   *
   * For address-specific data, use `AddressData`.
   */
  type: 'WalletData';
}

export interface AddressData extends AuthenticationTemplateVariableBase {
  /**
   * A single-line, human readable description for this address data.
   */
  description?: string;
  /**
   * A single-line, Title Case, human-readable name for this address data.
   */
  name?: string;
  /**
   * A script ID used to compile this AddressData. When a `source` is provided,
   * wallet implementations can automatically compile the expected value without
   * prompting users. This is particularly useful for sharing the result of a
   * script with other entities as a variable.
   *
   * TODO: not yet implemented - also requires support in data_signature
   */
  source?: string;

  /**
   * `AddressData` is the most low-level variable type. It must be collected
   * and stored each time a script is generated (usually, a locking script).
   * `AddressData` can include any type of data, and can be used in any way.
   *
   * For more persistent data, use `WalletData`.
   */
  type: 'AddressData';
}

export type AuthenticationTemplateVariable =
  | HdKey
  | Key
  | WalletData
  | AddressData;
