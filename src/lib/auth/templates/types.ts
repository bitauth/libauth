/**
 * An `AuthenticationTemplate` (a.k.a. `Bitauth Template`) specifies a set of
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
   * An optionally multi-line, free-form, human-readable description of this
   * authentication template (for use in user interfaces).
   */
  description?: string;

  /**
   * A mapping of entities defined in this authentication template. Object keys
   * are used as entity identifiers, and by convention, should use `snake_case`.
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
   * A mapping of scripts used in this authentication template. Object keys
   * are used as script identifiers, and by convention, should use `snake_case`.
   */
  scripts: { [scriptId: string]: AuthenticationTemplateScript };

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

export type AuthenticationVirtualMachineIdentifier =
  | 'BCH_2019_05'
  | 'BCH_2019_11'
  | 'BSV_2018_11'
  | 'BTC_2017_08';

export interface AuthenticationTemplateEntity {
  /**
   * A single-line, human readable description for this entity.
   */
  description?: string;
  /**
   * A single-line, Title Case, human-readable identifier for this entity, e.g.:
   * `Trusted Third-Party`
   */
  name: string;
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
   * An array of variables which must be provided by this entity for use in the
   * this template's scripts. Some variables are required before locking script
   * generation, while some variables can or must be resolved only before
   * unlocking script generation.
   */
  variables?: { [variableId: string]: AuthenticationTemplateVariable };
}

export interface AuthenticationTemplateScript {
  /**
   * A single-line, human-readable name for this unlocking script (for use in
   * user interfaces).
   */
  name?: string;
  /**
   * The script definition in BTL (Bitauth Templating Language).
   */
  script: string;
  /**
   * One or more tests which can be used during development and during template
   * validation to confirm the correctness of this inline script.
   */
  tests?: AuthenticationTemplateScriptTest[];
  /**
   * The `id` of the script which can be unlocked by this script.
   *
   * (The presence of the `unlocks` property indicates that this script is an
   * unlocking script, and the script it unlocks is a locking script.)
   */
  unlocks?: string;
}

// TODO: keep?
// export interface AuthenticationTemplateChecksumScript
//   extends AuthenticationTemplateScript {
//   /**
//    * If provided, the `checksum` script should digest all variable data provided
//    * at wallet creation time.
//    *
//    * When using a template with a checksum script, each entity must first
//    * compute the checksum and compare its result with the results of each other
//    * entity. This allows clients to avoid creating wallets using malicious or
//    * corrupted data.
//    */
//   // id: 'checksum'; // TODO: finalized removal of 'id' property
// }

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
   * The BTL-encoded test value for this variable. This test value is used
   * during development and can provide validation when importing this template
   * into a new system.
   *
   * When testing, all variables for all entities are initialized to their
   * `mock` and each unlocking script is tested against the locking script,
   * ensuring it is able to unlock it. For inline scripts, variables are also
   * initialized to their `mock`s when evaluating inline script tests.
   *
   * Note, `mock` is itself defined in BTL syntax, but mock scripts do not have
   * access to evaluations, other variables, or scripts. (Hex, BigInt, and UTF8
   * literals are permissible, as well as push notation and comments.)
   */
  mock?: string;
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

/**
 * Separated from `AuthenticationTemplateVariableBase` to provide better
 * contextual TypeDocs.
 */
// TODO: keep?
// export interface AuthenticationTemplateVariableKey
//   extends AuthenticationTemplateVariableBase {
//   /**
//    * The identifier used as a prefix when referring to this key in the scripts.
//    *
//    * Each Key exports its own `public`, `private`, and `signature`
//    * properties. The `signature` property contains a property for each possible
//    * signature serialization flag: `all`, `single`, `none`
//    *
//    * For example, with an id of `keyA`, the following are all valid data pushes:
//    * `<keyA.private>`, `<keyA.public>`, `<keyA.signature.all>`,
//    * `<keyA.signature.single>`, `<keyA.signature.none>`
//    *
//    * TODO: for data signatures, accept any identifier after signature, e.g.
//    * `<keyA.signature.myTXData>`
//    *
//    * TODO: new syntax: signature:all_outputs signature:corresponding_output:anyone_can_pay, signature:no_outputs:anyone_can_pay, data_signature:IDENTIFIER
//    */
//   // id: string; // TODO: finalized removal of 'id' property
// }

export interface HDKey extends AuthenticationTemplateVariableBase {
  /**
   * TODO: describe – this turns on/off hardening of the script derivation index:
   * `m / template derivation index' / script derivation index[']`
   */
  scriptDerivationHardened?: boolean;
  /**
   * A "hardened" child key is derived using an extended *private key*, while a
   * non-hardened child key is derived using only an extended *public key*.
   *
   * Non-hardened keys are more useful for some templates, e.g. to allow for
   * new locking scripts to be generated without communicating new public keys
   * between entities for each. **However, using a non-hardened key has critical
   * security implications.** If an attacker gains possession of both a parent
   * extended *public key* and any child private key, the attacker can easily
   * derive the parent extended *private key*, and with it, all hardened and
   * non-hardened child keys.
   *
   * Because this security consideration should be evaluated for any template
   * using `HDKey`s, `derivationHardened` defaults to `true`.
   */
  templateDerivationHardened?: boolean;
  /**
   * All `HDKey`s are hardened-derivations of the entity's root `HDKey`. The
   * resulting branches are then used to generate child keys scripts:
   *
   * `m / template derivation index' / script derivation index`
   *
   * By default, `derivationIndex` is `0`. For a single entity to use multiple
   * `HDKey`s, a different `derivationIndex` must be used for each.
   *
   * For greater control over key generation and mapping, use `Key`.
   */
  templateDerivationIndex?: number;
  /**
   * The `HDKey` (Hierarchical-Deterministic Key) type automatically manages key
   * generation and mapping in a standard way. For greater control, use `Key`.
   */
  type: 'HDKey';
}

export interface Key extends AuthenticationTemplateVariableBase {
  /**
   * The `Key` type provides fine-grained control over key generation and mapping.
   * Most templates should instead use `HDKey`.
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
  description: string;
  /**
   * A single-line, Title Case, human-readable name for this wallet data.
   */
  name: string;
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
  description: string;
  /**
   * A single-line, Title Case, human-readable name for this address data.
   */
  name: string;

  /**
   * `AddressData` is the most low-level variable type. It must be collected
   * and stored each time a script is generated (usually, a locking script).
   * `AddressData` can include any type of data, and can be used in any way.
   *
   * For more persistent data, use `WalletData`.
   */
  type: 'AddressData';
}

export interface CurrentBlockTime extends AuthenticationTemplateVariableBase {
  /**
   * The `CurrentBlockTime` type provides the current block time as a Script
   * Number. This is useful when computing a time for OP_CHECKLOCKTIMEVERIFY
   * which is relative to the current time at the moment a script is created
   * (usually, a locking script).
   *
   * TODO: not available, see: https://github.com/bitauth/bitauth-ide/issues/17
   */
  type: 'CurrentBlockTime';
}

export interface CurrentBlockHeight extends AuthenticationTemplateVariableBase {
  /**
   * The `CurrentBlockHeight` type provides the current block height as a Script
   * Number. This is useful when computing a height for OP_CHECKLOCKTIMEVERIFY
   * which is relative to the height at the moment a script is created (usually,
   * a locking script).
   */
  type: 'CurrentBlockHeight';
}

export type AuthenticationTemplateVariable =
  | HDKey
  | Key
  | WalletData
  | AddressData
  | CurrentBlockTime
  | CurrentBlockHeight;
