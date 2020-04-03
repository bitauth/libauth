import { Input, Output, Transaction } from '../transaction/transaction-types';

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
   * A map of scripts used in this authentication template. Object keys are used
   * as scenario identifiers, and by convention, should use `snake_case`.
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

/**
 * Allowable identifiers for Bitcoin virtual machine versions. Identifiers are
 * based upon the month the VM version became active on the specified chain.
 */
export type AuthenticationVirtualMachineIdentifier =
  | 'BCH_2020_05'
  | 'BCH_2019_11'
  | 'BCH_2019_05'
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
  transaction?: Partial<
    Transaction<
      Input<Uint8Array | ScenarioDirective, string>,
      Output<Uint8Array | ScenarioDirective>
    >
  >;
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
  /**
   * The `id` of the script which can be unlocked by this script.
   *
   * (The presence of the `unlocks` property indicates that this script is an
   * unlocking script, and the script it unlocks is a locking script.)
   */
  unlocks?: string;
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
  // mock?: string; // TODO: delete – replaced by scenarios
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

export interface HDKey extends AuthenticationTemplateVariableBase {
  /**
   * If `false`, the script-level derivation will use the non-hardened
   * derivation algorithm. This has critical security implications, see
   * `templateDerivationHardened` for details.
   *
   * Because this security consideration should be evaluated for any template
   * using `HDKey`s, `derivationHardened` defaults to `true`.
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
   * non-hardened child keys. See BIP32 for details.
   *
   * Because this security consideration should be evaluated for any template
   * using `HDKey`s, `derivationHardened` defaults to `true`.
   */
  templateDerivationHardened?: boolean;
  /**
   * All `HDKey`s use a derivation of a hierarchical-deterministic key. The
   * resulting branch is then incremented to generate child keys for scripts:
   *
   * `m/templateDerivationIndex/scriptDerivationIndex`
   *
   * The template-level derivation algorithm is controlled by
   * `templateDerivationHardened`, while the script-level derivation algorithm
   * is controlled by `scriptDerivationHardened`.
   *
   * The `scriptDerivationIndex` is provided at compile time to derive the
   * precise key used for that particular compilation.
   *
   * By default, `templateDerivationIndex` is `0`. If a single entity owns
   * multiple `HDKey`s, each variable must specify a different
   * `templateDerivationIndex`. (Otherwise, each key would derive the same child
   * keys.)
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
   * `AddressData` is the most low-level variable type. It must be collected
   * and stored each time a script is generated (usually, a locking script).
   * `AddressData` can include any type of data, and can be used in any way.
   *
   * For more persistent data, use `WalletData`.
   */
  type: 'AddressData';
}

export type AuthenticationTemplateVariable =
  | HDKey
  | Key
  | WalletData
  | AddressData;
