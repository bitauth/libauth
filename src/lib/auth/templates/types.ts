/**
 * An `AuthenticationTemplate` (a.k.a. `BitAuth Template`) specifies a set of
 * locking scripts, unlocking scripts, and other information required to use a
 * certain authentication scheme. Templates fully describe wallets and protocols
 * in a way that can be shared between software clients.
 */
export interface AuthenticationTemplate {
  /**
   * An optionally multi-line, free-form, human-readable description of this
   * authentication template (for use in user interfaces).
   */
  readonly description?: string;
  /**
   * An array of entities defined in this authentication template. See
   * `AuthenticationTemplateEntity` for more information.
   */
  readonly entities: ReadonlyArray<AuthenticationTemplateEntity>;

  /**
   * A single-line, Title Case, human-readable name for this authentication template (for
   * use in user interfaces).
   */
  readonly name?: string;

  /**
   * An array of scripts used in this template.
   */
  readonly scripts: ReadonlyArray<AuthenticationTemplateScript>;

  /**
   * A list of supported AuthenticationVirtualMachines for this template.
   */
  readonly supported: ReadonlyArray<AuthenticationVirtualMachineIdentifier>;

  /**
   * A number identifying the format of this AuthenticationTemplate.
   * Currently, this implementation requires `version` be set to `1`.
   */
  readonly version: 1;
}

export type AuthenticationVirtualMachineIdentifier =
  | 'BCH_2018_11'
  | 'BCH_2019_05'
  | 'BSV_2018_11'
  | 'BTC_2017_08';

export interface AuthenticationTemplateEntity {
  /**
   * A single-line, human readable description for this entity.
   */
  readonly description?: string;
  /**
   * The identifier used externally refer to this entity. By convention,
   * identifiers should use `snake_case`.
   *
   */
  readonly id: string;
  /**
   * A single-line, Title Case, human-readable identifier for this entity, e.g.:
   * `Trusted Third-Party`
   */
  readonly name: string;
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
  readonly scripts?: ReadonlyArray<string>;
  /**
   * An array of variables which must be provided by this entity for use in the
   * this template's scripts. Some variables are required before locking script
   * generation, while some variables can or must be resolved only before
   * unlocking script generation.
   */
  readonly variables?: ReadonlyArray<AuthenticationTemplateVariable>;
}

export interface AuthenticationTemplateScript {
  /**
   * The identifier used to refer to this script in other scripts. By
   * convention, identifiers should use `snake_case`.
   *
   */
  readonly id: string;
  /**
   * A single-line, human-readable name for this unlocking script (for use in
   * user interfaces).
   */
  readonly name?: string;
  /**
   * The script definition in BitAuth Script.
   */
  readonly script: string;
  /**
   * One or more tests which can be used during development and during template
   * validation to confirm the correctness of this inline script.
   */
  readonly tests?: ReadonlyArray<AuthenticationTemplateScriptTest>;
  /**
   * The `id` of the script which can be unlocked by this script.
   *
   * (The presence of the `unlocks` property indicates that this script is an
   * unlocking script, and the script it unlocks is a locking script.)
   */
  readonly unlocks?: string;
}

export interface AuthenticationTemplateChecksumScript
  extends AuthenticationTemplateScript {
  /**
   * If provided, the `checksum` script should digest all variable data provided
   * at wallet creation time.
   *
   * When using a template with a checksum script, each entity must first
   * compute the checksum and compare its result with the results of each other
   * entity. This allows clients to avoid creating wallets using malicious or
   * corrupted data.
   */
  readonly id: 'checksum';
}

export interface AuthenticationTemplateScriptTest {
  /**
   * The script to evaluate after the script being tested. The test passes if
   * this script leaves only a 1 (ScriptNumber) on the stack.
   */
  readonly check: string;
  /**
   * A single-line, Title Case, human-readable name for this test (for use in
   * user interfaces).
   */
  readonly name?: string;
  /**
   * A script to evaluate before the script being tested. This can be used to
   * push values to the stack which are operated on by the inline script.
   */
  readonly setup?: string;
}

export interface AuthenticationTemplateVariableBase {
  /**
   * A single-line, human readable description for this variable (for use in
   * user interfaces).
   */
  readonly description?: string;
  /**
   * The identifier used to refer to this variable in the scripts. By
   * convention, identifiers should use `snake_case`.
   */
  readonly id: string;
  /**
   * The hexadecimal string-encoded test value for this variable. This test
   * value is used during development and can provide validation when
   * importing this template into a new system.
   *
   * When testing, all variables for all entities are initialized to their
   * `mock` and each unlocking script is tested against the locking script,
   * ensuring it is able to unlock it. For inline scripts, variables are also
   * initialized to their `mock`s when evaluating inline script tests.
   *
   * TODO: should `mock` actually be a script? (To allow for hex or BigInt
   * literals.)
   */
  readonly mock?: string;
  /**
   * A single-line, Title Case, human-readable name for this variable (for use
   * in user interfaces).
   */
  readonly name?: string;
  readonly type: string;
  /**
   * TODO: revisit in future versions
   *
   * a script which must leave a 1 on the stack if the variable input is valid
   * (e.g. to check unusual signatures from each signer as they are received)
   */
  // readonly validate?: string;
}

/**
 * Separated from `AuthenticationTemplateVariableBase` to provide better
 * contextual TypeDocs.
 */
export interface AuthenticationTemplateVariableKey
  extends AuthenticationTemplateVariableBase {
  /**
   * The identifier used as a prefix when referring to this key in the scripts.
   *
   * Each Key exports its own `public`, `private`, and `signature`
   * properties. The `signature` property contains a property for each possible
   * signature serialization flag: `all`, `single`, `none`
   *
   * For example, with an id of `keyA`, the following are all valid data pushes:
   * `<keyA.private>`, `<keyA.public>`, `<keyA.signature.all>`,
   * `<keyA.signature.single>`, `<keyA.signature.none>`
   *
   * TODO: for data signatures, accept any identifier after signature, e.g.
   * `<keyA.signature.myTXData>`
   *
   * TODO: new syntax: signature:all_outputs signature:corresponding_output:anyone_can_pay, signature:no_outputs:anyone_can_pay, data_signature:IDENTIFIER
   */
  readonly id: string;
}

export interface HDKey extends AuthenticationTemplateVariableKey {
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
  readonly derivationHardened?: boolean;
  /**
   * All `HDKey`s are hardened-derivations of the entity's root `HDKey`. The
   * resulting branches are then used to generate child keys scripts:
   *
   * `m / HDKey derivation index' / script index`
   *
   * By default, `derivationIndex` is `0`. For a single entity to use multiple
   * `HDKey`s, a different `derivationIndex` must be used for each.
   *
   * For greater control over key generation and mapping, use `Key`.
   */
  readonly derivationIndex?: number;
  /**
   * The `HDKey` (Hierarchical-Deterministic Key) type automatically manages key
   * generation and mapping in a standard way. For greater control, use `Key`.
   */
  readonly type: 'HDKey';
}

export interface Key extends AuthenticationTemplateVariableKey {
  /**
   * The `Key` type provides fine-grained control over key generation and mapping.
   * Most templates should instead use `HDKey`.
   *
   * Any HD (Hierarchical-Deterministic) derivation must be completed outside of
   * the templating system and provided at the time of use.
   */
  readonly type: 'Key';
}

export interface WalletData extends AuthenticationTemplateVariableBase {
  /**
   * A single-line, human readable description for this wallet data.
   */
  readonly description: string;
  /**
   * A single-line, Title Case, human-readable name for this wallet data.
   */
  readonly name: string;
  /**
   * The `WalletData` type provides a static piece of data which should be
   * collected once and stored at the time of wallet creation. `WalletData`
   * should be persistent for the life of the wallet, rather than changing from
   * locking script to locking script.
   *
   * For transaction-specific data, use `TransactionData`.
   */
  readonly type: 'WalletData';
}

export interface TransactionData extends AuthenticationTemplateVariableBase {
  /**
   * A single-line, human readable description for this transaction data.
   */
  readonly description: string;
  /**
   * A single-line, Title Case, human-readable name for this transaction data.
   */
  readonly name: string;

  /**
   * `TransactionData` is the most low-level variable type. It must be collected
   * and stored each time a script is generated (usually, a locking script).
   * `TransactionData` can include any type of data, and can be used in any way.
   *
   * For more persistent data, use `WalletData`.
   */
  readonly type: 'TransactionData';
}

export interface CurrentBlockTime extends AuthenticationTemplateVariableBase {
  /**
   * The `CurrentBlockTime` type provides the current block time as a Script
   * Number. This is useful when computing a time for OP_CHECKLOCKTIMEVERIFY
   * which is relative to the current time at the moment a script is created
   * (usually, a locking script).
   */
  readonly type: 'CurrentBlockTime';
}

export interface CurrentBlockHeight extends AuthenticationTemplateVariableBase {
  /**
   * The `CurrentBlockHeight` type provides the current block height as a Script
   * Number. This is useful when computing a height for OP_CHECKLOCKTIMEVERIFY
   * which is relative to the height at the moment a script is created (usually,
   * a locking script).
   */
  readonly type: 'CurrentBlockHeight';
}

export interface ExternalOperation extends AuthenticationTemplateVariableBase {
  /**
   * **NOTE: `ExternalOperation` is not yet implemented.**
   *
   * `ExternalOperation` allows for any operation to be injected into a
   * template. This can enable new types of script generation which would not
   * otherwise be possible or practical in the targeted VM. (Note,
   * `ExternalOperation`s are typically only useful inside `Evaluation`s, as
   * outside an evaluation, they'll be serialized into an opcode which is
   * unknown to the protocol VM.)
   *
   * For example, `ExternalOperation` allows a template to encode unusual
   * signature generation schemes, Proof of Work generation, and other unique
   * computations.
   *
   * Because the operation isn't standardized, using an `ExternalOperation`
   * makes a template much more difficult to integrate into clients. (Client
   * implementation changes are required for each unique `ExternalOperation`,
   * so it is only possible to automatically support templates without
   * `ExternalOperation`s.) `ExternalOperation` should therefore be avoided
   * whenever possible.
   */
  readonly type: 'ExternalOperation';
}

export type AuthenticationTemplateVariable =
  | HDKey
  | Key
  | WalletData
  | TransactionData
  | CurrentBlockTime
  | CurrentBlockHeight
  | ExternalOperation;
