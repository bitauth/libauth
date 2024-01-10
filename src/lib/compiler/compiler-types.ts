import type {
  AuthenticationProgramCommon,
  AuthenticationVirtualMachine,
  CompilationContextBCH,
  CompilationResult,
  CompilationResultError,
  Ripemd160,
  Secp256k1,
  Sha256,
  Sha512,
  WalletTemplateScenario,
  WalletTemplateVariable,
} from '../lib.js';

export type CompilerOperationDebug = {
  /**
   * An additional, complex property that may be returned by custom compiler
   * operations. For use in extending the compiler to support additional return
   * information like {@link CompilerOperationSuccessSignature}.
   */
  debug?: unknown;
};

/**
 * A non-recoverable error in a compiler operation. This is any error that
 * cannot be resolved by simply providing a missing variable.
 */
export type CompilerOperationErrorFatal = CompilerOperationDebug & {
  status: 'error';
  error: string;
};

/**
 * A recoverable error in a compiler operation. This occurs when a required
 * variable was not provided.
 */
export type CompilerOperationErrorRecoverable = CompilerOperationErrorFatal & {
  /**
   * The full identifier (including any compilation operations) of the variable
   * missing from compilation, e.g. `my_key.signature.all_outputs` or
   * `my_key.public_key`.
   */
  recoverable: true;
};

/**
 * An unsuccessful compiler operation result.
 */
export type CompilerOperationError =
  | CompilerOperationErrorFatal
  | CompilerOperationErrorRecoverable;

/**
 * A successful compiler operation result.
 */
export type CompilerOperationSuccess =
  | CompilerOperationSuccessGeneric
  | CompilerOperationSuccessSignatureType;

export type CompilerOperationSuccessGeneric = CompilerOperationDebug & {
  status: 'success';
  bytecode: Uint8Array;
};

/**
 * A successful signature-generation compiler operation. This provides slightly
 * more debugging information than {@link CompilerOperationSuccessGeneric}. The
 * signing serialization or data message that was hashed to produce the
 * to-be-signed message is also provided in the result.
 */
export type CompilerOperationSuccessSignatureType =
  | CompilerOperationSuccessDataSignature
  | CompilerOperationSuccessSignature;

/**
 * The result of a successful `signature` compiler operation.
 */
export type CompilerOperationSuccessSignature =
  CompilerOperationSuccessGeneric & {
    signature: {
      /**
       * The transaction signing serialization signed by a signature. This signing
       * serialization is hashed twice with `sha256`, and the digest is signed.
       */
      serialization: Uint8Array;
    };
  };

/**
 * The result of a successful `data_signature` compiler operation.
 */
export type CompilerOperationSuccessDataSignature =
  CompilerOperationSuccessGeneric & {
    signature: {
      /**
       * The digest of the raw message signed by a data signature.
       */
      digest: Uint8Array;
      /**
       * The raw message signed by a data signature. This message is hashed once
       * with `sha256`, and the digest is signed.
       */
      message: Uint8Array;
    };
  };

/**
 * An unsuccessful compiler operation result that should be skipped by the
 * compiler. See {@link attemptCompilerOperations} for details.
 */
export type CompilerOperationSkip = {
  status: 'skip';
};

export type CompilerOperationResult<CanBeSkipped extends boolean = false> =
  CanBeSkipped extends true
    ? CompilerOperationError | CompilerOperationSkip | CompilerOperationSuccess
    : CompilerOperationError | CompilerOperationSuccess;

/**
 * A compiler operation method that accepts the identifier being evaluated, the
 * compilation data, and the compiler configuration, and returns a
 * {@link CompilerOperationResult}.
 *
 * @typeParam CompilationContext - the type of the {@link CompilationContext} in
 * `CompilationData<CompilationContext>` expected by this operation
 * @typeParam CanBeSkipped - if true, this operation may return
 * `CompilerOperationSkip` to indicate that it cannot be applied and should be
 * skipped
 * @typeParam Data - the type of the {@link CompilationData} expected by this
 * operation
 * @typeParam Configuration - the type of the {@link CompilerConfiguration}
 * expected by this operation
 * @param identifier - The full identifier used to describe this operation, e.g.
 * `owner.signature.all_outputs`.
 * @param data - The {@link CompilationData} provided to the compiler
 * @param configuration - The {@link CompilerConfiguration} provided to
 * the compiler
 */
export type CompilerOperation<
  CompilationContext = unknown,
  CanBeSkipped extends boolean = false,
  Data extends
    CompilationData<CompilationContext> = CompilationData<CompilationContext>,
  Configuration extends
    AnyCompilerConfiguration<CompilationContext> = AnyCompilerConfiguration<CompilationContext>,
> = (
  identifier: string,
  data: Data,
  configuration: Configuration,
) => CompilerOperationResult<CanBeSkipped>;

export type CompilerOperationsKeysCommon = 'public_key' | 'signature';

/**
 * Valid identifiers for full transaction signing serialization algorithms. Each
 * full serialization is double-sha256 hashed to produce the digest that is
 * signed.
 */
export type CompilerOperationsSigningSerializationFull =
  | 'full_all_outputs_all_utxos'
  | 'full_all_outputs_single_input_INVALID_all_utxos'
  | 'full_all_outputs_single_input'
  | 'full_all_outputs'
  | 'full_corresponding_output_all_utxos'
  | 'full_corresponding_output_single_input_INVALID_all_utxos'
  | 'full_corresponding_output_single_input'
  | 'full_corresponding_output'
  | 'full_default'
  | 'full_no_outputs_all_utxos'
  | 'full_no_outputs_single_input_INVALID_all_utxos'
  | 'full_no_outputs_single_input'
  | 'full_no_outputs';

/**
 * Valid identifiers for components of transaction signing serializations.
 * Components are combined in various orders to produce each of the valid
 * "full" signing serializations.
 */
export type CompilerOperationsSigningSerializationComponent =
  | 'corresponding_output_hash'
  | 'corresponding_output'
  | 'covered_bytecode_length'
  | 'covered_bytecode'
  | 'locktime'
  | 'outpoint_index'
  | 'outpoint_transaction_hash'
  | 'output_value'
  | 'sequence_number'
  | 'transaction_outpoints_hash'
  | 'transaction_outpoints'
  | 'transaction_outputs_hash'
  | 'transaction_outputs'
  | 'transaction_sequence_numbers_hash'
  | 'transaction_sequence_numbers'
  | 'version';

/**
 * Valid identifiers describing the various full and partial signing
 * serializations available to the compiler.
 */
export type CompilerOperationsSigningSerializationCommon =
  | CompilerOperationsSigningSerializationComponent
  | CompilerOperationsSigningSerializationFull;

/**
 * The full context required to compile a given CashAssembly Template script –
 * everything required for the compiler to understand the CompilationData and
 * generate the compiled bytecode (targeting a specific
 * {@link AuthenticationVirtualMachine}).
 *
 * @remarks
 * A {@link CompilerConfiguration} must include a subset of the script's
 * {@link WalletTemplate} – all the variables and scripts referenced
 * (including children of children) by the script in question.
 *
 * The context must also include an object mapping of opcode identifiers to the
 * bytecode they generate.
 *
 * If keys are used, an implementation of `sha256` and `secp256k1` is
 * required. If the script requires evaluations during compilation, the
 * evaluating {@link AuthenticationVirtualMachine} must also be included.
 *
 * @typeParam CompilationContext - additional data available to compiler
 * operations, e.g. transaction signing serialization components
 * @typeParam CompilerKeyOperations - a list of valid compiler operations for
 * `Key` and `HdKey` variables, e.g. `'public_key' | 'signature'`, or `false` if
 * only a single compiler operation is used for all instances
 * @typeParam CompilerSigningSerializationOperations - a list of valid compiler
 * operations for `Key` and `HdKey` variables, e.g.
 * `"version" | "transaction_outpoints" | ...`, or `false` if only a single
 * compiler operation is used for all `signing_serialization` instances
 * @typeParam CompilerAddressDataOperations - a list of valid compiler
 * operations for `AddressData` variables or `false` if only a single compiler
 * operation is used for all `AddressData` instances (default: `false`)
 * @typeParam CompilerWalletDataOperations - a list of valid compiler
 * operations for `WalletData` variables or `false` if only a single compiler
 * operation is used for all `WalletData` instances (default: `false`)
 * @typeParam CompilerCurrentBlockHeightOperations - a list of valid compiler
 * operations for `current_block_height` variables or `false` if only a single
 * compiler operation is used for all instances (default: `false`)
 * @typeParam CompilerCurrentBlockTimeOperations - a list of valid compiler
 * operations for `current_block_time` variables or `false` if only a single
 * compiler operation is used for all instances (default: `false`)
 */
export type CompilerConfiguration<
  CompilationContext = unknown,
  CompilerKeyOperations extends string | false = CompilerOperationsKeysCommon,
  CompilerSigningSerializationOperations extends
    | string
    | false = CompilerOperationsSigningSerializationCommon,
  CompilerAddressDataOperations extends string | false = false,
  CompilerWalletDataOperations extends string | false = false,
  CompilerCurrentBlockHeightOperations extends string | false = false,
  CompilerCurrentBlockTimeOperations extends string | false = false,
> = {
  /**
   * A method that accepts the compiled bytecode contents of a CashAssembly
   * evaluation and produces the equivalent {@link AuthenticationProgram} to be
   * evaluated by the VM. This method is used internally to compute CashAssembly
   * evaluations. See {@link createAuthenticationProgramEvaluationCommon}
   * for details.
   */
  createAuthenticationProgram?:
    | ((
        evaluationBytecode: Uint8Array,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ) => any)
    | undefined;

  /**
   * An object mapping template variable identifiers to the entity identifiers
   * responsible for them. This is required for `HdKey` support, as each entity
   * uses a single HD private key (provided in `hdKeys.hdPrivateKeys`) or HD
   * public key (provided in `hdKeys.hdPublicKeys`) per compilation, and each
   * `HdKey` variable is derived from this key.
   *
   * To avoid compilation errors, this object must contain all `HdKey` variables
   * referenced by the script being compiled (including in child scripts). To
   * enable support for error handling like {@link extractMissingVariables},
   * it's recommended that all variables be provided here.
   */

  entityOwnership?: { [variableId: string]: string } | undefined;

  /**
   * An object mapping the script identifiers of locking scripts to their
   * locking script type, either `standard` or `p2sh20`.
   *
   * This is used to transform compilation results into the proper structure for
   * P2SH20 locking and unlocking scripts.
   *
   * When compiling locking scripts of type `p2sh20`, the result will be placed
   * in a P2SH20 "redeemScript" format:
   * `OP_HASH160 <$(<result> OP_HASH160)> OP_EQUAL`
   *
   * When compiling unlocking scripts that unlock locking scripts of type
   * `p2sh20`, the result will be transformed into the P2SH20 unlocking format:
   * `result <locking_script>` (where `locking_script` is the compiled bytecode
   * of the locking script, without the "redeemScript" transformation.)
   *
   * By default, all scripts are assumed to have the type `standard`.
   */
  lockingScriptTypes?:
    | { [lockingScriptId: string]: 'p2sh20' | 'p2sh32' | 'standard' }
    | undefined;

  /**
   * An object mapping opcode identifiers to the bytecode they generate.
   */
  opcodes?: { [opcodeIdentifier: string]: Uint8Array } | undefined;
  /**
   * An object specifying the operations made available by this compiler
   * configuration for each variable type. For example, keys typically support
   * public key derivation (`.public_key`) and several signature types.
   *
   * Compiler operations can be specified as a single operation for all
   * instances of a variable type (as is the default for `AddressData` or
   * `WalletData`), or they can be specified as an object, where each key is a
   * valid operation name (as is the default for `Key` and `HdKey`).
   */
  operations?: {
    hdKey?:
      | (CompilerKeyOperations extends string
          ? {
              [operationId in CompilerKeyOperations]?: CompilerOperation<CompilationContext>;
            }
          : CompilerOperation<CompilationContext>)
      | undefined;
    key?:
      | (CompilerKeyOperations extends string
          ? {
              [operationId in CompilerKeyOperations]?: CompilerOperation<CompilationContext>;
            }
          : CompilerOperation<CompilationContext>)
      | undefined;
    addressData?:
      | (CompilerAddressDataOperations extends string
          ? {
              [operationId in CompilerAddressDataOperations]?: CompilerOperation<CompilationContext>;
            }
          : CompilerOperation<CompilationContext>)
      | undefined;
    walletData?:
      | (CompilerWalletDataOperations extends string
          ? {
              [operationId in CompilerWalletDataOperations]?: CompilerOperation<CompilationContext>;
            }
          : CompilerOperation<CompilationContext>)
      | undefined;
    currentBlockHeight?:
      | (CompilerCurrentBlockHeightOperations extends string
          ? {
              [operationId in CompilerCurrentBlockHeightOperations]?: CompilerOperation<CompilationContext>;
            }
          : CompilerOperation<CompilationContext>)
      | undefined;
    currentBlockTime?:
      | (CompilerCurrentBlockTimeOperations extends string
          ? {
              [operationId in CompilerCurrentBlockTimeOperations]?: CompilerOperation<CompilationContext>;
            }
          : CompilerOperation<CompilationContext>)
      | undefined;
    signingSerialization?:
      | (CompilerSigningSerializationOperations extends string
          ? {
              [operationId in CompilerSigningSerializationOperations]?: CompilerOperation<CompilationContext>;
            }
          : CompilerOperation<CompilationContext>)
      | undefined;
  };

  /**
   * An implementation of ripemd160 is required for any scripts that include
   * `HdKey`s. This can be instantiated with {@link instantiateRipemd160}.
   */
  ripemd160?: { hash: Ripemd160['hash'] } | undefined;
  /**
   * An object mapping scenario identifiers to the
   * {@link WalletTemplateScenario}s they represent.
   */
  scenarios?: { [scriptId: string]: WalletTemplateScenario } | undefined;
  /**
   * An object mapping script identifiers to the text of script in CashAssembly.
   *
   * To avoid compilation errors, this object must contain all scripts
   * referenced by the script being compiled (including children of children).
   */
  scripts: { [scriptId: string]: string };
  /**
   * An implementation of secp256k1 is required for any scripts that include
   * signatures. This can be instantiated with {@link instantiateSecp256k1}.
   */
  secp256k1?:
    | {
        addTweakPrivateKey: Secp256k1['addTweakPrivateKey'];
        addTweakPublicKeyCompressed: Secp256k1['addTweakPublicKeyCompressed'];
        derivePublicKeyCompressed: Secp256k1['derivePublicKeyCompressed'];
        signMessageHashSchnorr: Secp256k1['signMessageHashSchnorr'];
        signMessageHashDER: Secp256k1['signMessageHashDER'];
      }
    | undefined;
  /**
   * An implementation of sha256 is required for any scripts that include
   * signatures. This can be instantiated with {@link instantiateSha256}.
   */
  sha256?: { hash: Sha256['hash'] } | undefined;
  /**
   * An implementation of sha512 is required for any scripts that include
   * `HdKey`s. This can be instantiated with {@link instantiateSha512}.
   */
  sha512?: { hash: Sha512['hash'] } | undefined;
  /**
   * Only for use when recursively calling {@link compileScript} (e.g. in
   * compiler operations).
   *
   * The "breadcrumb" path of script IDs currently being compiled, including the
   * current script. (E.g. `["grandparentId", "parentId", "scriptId"]`)
   *
   * CashAssembly identifier resolution must be acyclic. To prevent an infinite
   * loop, {@link IdentifierResolutionFunction}s must abort resolution if they
   * encounter their own `id` while resolving another identifier. Likewise,
   * child scripts being resolved by a parent script may not reference any
   * script that is already in the process of being resolved.
   */
  sourceScriptIds?: string[] | undefined;

  /**
   * An object mapping the identifiers of unlocking scripts to the identifiers
   * of the locking scripts they unlock. This is used to identify the
   * `coveredBytecode` used in signing serializations, and it is required for
   * all signature operations and many signing serialization operations.
   */
  unlockingScripts?: { [unlockingScriptId: string]: string } | undefined;

  /**
   * An object mapping the identifiers of unlocking scripts to their
   * `timeLockType`.
   *
   * The `timestamp` type indicates that the transaction's locktime is provided
   * as a UNIX timestamp (the `locktime` value is greater than or equal to
   * `500000000`).
   *
   * The `height` type indicates that the transaction's locktime is provided as
   * a block height (the `locktime` value is less than `500000000`).
   *
   * See {@link WalletTemplateScript.timeLockType} for details.
   */
  unlockingScriptTimeLockTypes?:
    | {
        [unlockingScriptId: string]: 'height' | 'timestamp';
      }
    | undefined;

  /**
   * An object mapping template variable identifiers to the
   * {@link WalletTemplateVariable} describing them.
   *
   * To avoid compilation errors, this object must contain all variables
   * referenced by the script being compiled (including in child scripts).
   */
  variables?: { [variableId: string]: WalletTemplateVariable } | undefined;
  /**
   * The {@link AuthenticationVirtualMachine} on which CashAssembly `evaluation`
   * results will be computed.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  vm?: AuthenticationVirtualMachine<any, any, any> | undefined;
};

/**
 * Data required at compilation time to generate the bytecode for a particular
 * CashAssembly Template script.
 */
export type CompilationData<CompilationContext = CompilationContextBCH> = {
  /**
   * A map of full identifiers to pre-computed bytecode for this compilation.
   *
   * This is always used to provide bytecode for `AddressData` and `WalletData`,
   * and it can also be used to provide public keys and signatures that have
   * been pre-computed by other entities (e.g. when computing these would
   * require access to private keys held by another entities).
   *
   * The provided `fullIdentifier` should match the complete identifier for
   * each item, e.g. `some_wallet_data`, `variable_id.public_key`, or
   * `variable_id.signature.all_outputs`.
   *
   * To provide `AddressData` or `WalletData` from advanced user interfaces,
   * consider parsing input with `compileCashAssembly`.
   *
   * @remarks
   * It is security-critical that only identifiers provided by the entities
   * expected to provide them are included here. For example:
   *
   * 1. When generating a `lockingBytecode` for a 2-of-2 wallet, a
   * malicious entity could provide a pre-computed value for `us.public_key`
   * that is equal to `them.public_key` such that the resulting
   * `lockingBytecode` is entirely controlled by that entity.
   *
   * 2. When generating an `unlockingBytecode` that includes a data signature,
   * if a malicious entity can provide a pre-computed value for identifiers
   * present in the message, the malicious entity can trick the compiling entity
   * into signing an unintended message, e.g. creating a false attestation or
   * releasing funds from an unrelated wallet. (This can be partially mitigated
   * by avoiding key reuse.)
   *
   * To safely include identifiers from external entities, the compilation must
   * first be evaluated only with trusted information (variables owned by or
   * previously validated by the compiling entity). On unsuccessful
   * compilations, missing variables can be extracted with
   * {@link extractMissingVariables}, and each missing variable should be filled
   * only by bytecode values provided by entities from which they were expected.
   */
  bytecode?: { [fullIdentifier: string]: Uint8Array };
  /**
   * The current block height at address creation time.
   */
  currentBlockHeight?: number;
  /**
   * The current MTP block time as a UNIX timestamp at address creation time.
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
   * compilation.
   */
  hdKeys?: {
    /**
     * The current address index to be used for this compilation. The
     * `addressIndex` gets added to each `HdKey`s `addressOffset` to calculate
     * the dynamic index (`i`) used in each `privateDerivationPath` or
     * `publicDerivationPath`.
     *
     * This is required for any compiler operation that requires derivation.
     * Typically, the value is incremented by one for each address in a wallet.
     */
    addressIndex?: number;
    /**
     * A map of entity IDs to HD public keys. These HD public keys are used to
     * derive public keys for each `HdKey` variable assigned to that entity (as
     * specified in {@link CompilerConfiguration.entityOwnership}) according to
     * its `publicDerivationPath`.
     *
     * HD public keys may be encoded for either mainnet or testnet (the network
     * information is ignored).
     *
     * If both an HD private key (in `hdPrivateKeys`) and HD public key (in
     * `hdPublicKeys`) are provided for the same entity in the same compilation
     * (not recommended), the HD private key is used.
     */
    hdPublicKeys?: { [entityId: string]: string };
    /**
     * A map of entity IDs to master HD private keys. These master HD private
     * keys are used to derive each `HdKey` variable assigned to that entity (as
     * specified in {@link CompilerConfiguration.entityOwnership}) according to
     * its `privateDerivationPath`.
     *
     * HD private keys may be encoded for either mainnet or testnet (the network
     * information is ignored).
     *
     * If both an HD private key (in `hdPrivateKeys`) and HD public key (in
     * `hdPublicKeys`) are provided for the same entity in the same compilation
     * (not recommended), only the HD private key is used.
     */
    hdPrivateKeys?: { [entityId: string]: string };
  };
  /**
   * An object describing the settings used for `Key` variables in this
   * compilation.
   */
  keys?: {
    /**
     * A map of `Key` variable IDs to their private keys for this compilation.
     */
    privateKeys?: { [variableId: string]: Uint8Array };
  };
  /**
   * The {@link CompilationContext} expected by this particular compiler for any
   * operations used in the compilation.
   */
  compilationContext?: CompilationContext;
};

/**
 * Any compiler configuration, where each data type may use either a single or
 * multiple operations.
 */
export type AnyCompilerConfiguration<CompilationContext> =
  CompilerConfiguration<
    CompilationContext,
    string | false,
    string | false,
    string | false,
    string | false,
    string | false,
    string | false
  >;

/**
 * Any compiler configuration where the type of the `operations` value is
 * irrelevant.
 */
export type AnyCompilerConfigurationIgnoreOperations<
  CompilationContext = CompilationContextBCH,
> = Omit<AnyCompilerConfiguration<CompilationContext>, 'operations'>;

export type BytecodeGenerationResult<ProgramState> =
  | CompilationResultError<ProgramState>
  | {
      bytecode: Uint8Array;
      success: true;
    };

/**
 * A fully-generated wallet template scenario. Useful for estimating
 * transactions and testing/debugging wallet templates. See
 * {@link WalletTemplateScenario} for details.
 */
export type Scenario = {
  data: CompilationData;
  program: AuthenticationProgramCommon;
};

/**
 * A scenario generation result that includes all compilation information for
 * the scripts under test (in the scenario's "slot"s). This allows
 * wallet template editors to display debugging information in context.
 *
 * Note, scenarios can also include compilations for source outputs, inputs, and
 * outputs that are not under test – while debugging information is not
 * provided for these other compilations, any errors will result in `scenario`
 * being set to an error message (`string`).
 */
export type ScenarioGenerationDebuggingResult<ProgramState> = {
  /**
   * Either the compiled scenario or an error message describing the scenario
   * generation failure.
   */
  scenario: Scenario | string;
  /**
   * The locking script, redeem script, or virtualized locking script
   * compilation result.
   */
  lockingCompilation: CompilationResult<ProgramState>;
  /**
   * The unlocking script or virtualized unlocking script compilation result.
   * May be `undefined` if scenario generation failed prior to unlocking
   * compilation (due to a failure in source output or transaction output
   * compilation).
   */
  unlockingCompilation?: CompilationResult<ProgramState>;
};

/**
 * A {@link Compiler} is a wrapper around a specific
 * {@link CompilerConfiguration} that exposes a purely-functional interface and
 * allows for stronger type checking.
 */
export type Compiler<
  CompilationContext,
  Configuration extends AnyCompilerConfiguration<CompilationContext>,
  ProgramState,
> = {
  configuration: Configuration;
  /**
   * Generate the bytecode for the given script and compilation data.
   */
  generateBytecode: <Debug extends boolean>({
    data,
    debug,
    scriptId,
  }: {
    /**
     * The compilation data required to compile this script
     */
    data: CompilationData<CompilationContext>;
    /**
     * Enable compilation debugging information (default: `false`)
     */
    debug?: Debug;
    /**
     * The identifier of the script to compile
     */
    scriptId: string;
  }) => Debug extends true
    ? CompilationResult<ProgramState>
    : BytecodeGenerationResult<ProgramState>;
  /**
   * Generate a scenario given this compiler's configuration.
   *
   * If no `scenarioId` is specified, the default scenario is used. If no
   * `unlockingScriptId` is used, an empty script is used for all `["slot"]` and
   * `["copy"]` locations in the generated transaction (useful for testing
   * isolated scripts, i.e. scripts without either tests or any corresponding
   * unlocking scripts).
   */
  generateScenario: <Debug extends boolean>({
    debug,
    lockingScriptId,
    scenarioId,
    unlockingScriptId,
  }: {
    /**
     * Enable compilation debugging information (default: `false`)
     */
    debug?: Debug;
    /**
     * If no unlocking script is used in the scenario, the identifier of the
     * locking script to use in the source output slot. (Note: `lockingScriptId`
     * should only be defined if `unlockingScriptId` is undefined.)
     */
    lockingScriptId?: string | undefined;
    /**
     * The identifier of the scenario to generate
     */
    scenarioId?: string | undefined;
    /**
     * The identifier of the unlocking script to use in the scenario's input
     * slot (the matching locking script will be used in the source output slot)
     */
    unlockingScriptId?: string | undefined;
  }) =>
    | string
    | (Debug extends true
        ? ScenarioGenerationDebuggingResult<ProgramState>
        : Scenario);
};
