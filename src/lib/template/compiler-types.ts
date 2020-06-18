import { Ripemd160, Secp256k1, Sha256, Sha512 } from '../crypto/crypto';
import { TransactionContextCommon } from '../transaction/transaction-types';
import { AuthenticationVirtualMachine } from '../vm/virtual-machine';
import { AuthenticationProgramTransactionContextCommon } from '../vm/vm-types';

import {
  CompilationResult,
  CompilationResultError,
} from './language/language-types';
import {
  AuthenticationTemplateScenario,
  AuthenticationTemplateVariable,
} from './template-types';

export interface CompilerOperationDebug {
  /**
   * An additional, complex property which may be returned by custom compiler
   * operations. For use in extending the compiler to support additional return
   * information like `CompilerOperationSuccessSignature`.
   */
  debug?: unknown;
}

/**
 * A non-recoverable error in a compiler operation. This is any error which
 * cannot be resolved by simply providing a missing variable.
 */
export interface CompilerOperationErrorFatal extends CompilerOperationDebug {
  status: 'error';
  error: string;
}

/**
 * A recoverable error in a compiler operation. This occurs when a required
 * variable was not provided.
 */
export interface CompilerOperationErrorRecoverable
  extends CompilerOperationErrorFatal {
  /**
   * The full identifier (including any compilation operations) of the variable
   * missing from compilation, e.g. `my_key.signature.all_outputs` or
   * `my_key.public_key`.
   */
  recoverable: true;
}

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

export interface CompilerOperationSuccessGeneric
  extends CompilerOperationDebug {
  status: 'success';
  bytecode: Uint8Array;
}

/**
 * A successful signature-generation compiler operation. This provides slightly
 * more debugging information than `CompilerOperationSuccessGeneric`. The
 * signing serialization or data message which was hashed to produce the
 * to-be-signed message is also provided in the result.
 */
export type CompilerOperationSuccessSignatureType =
  | CompilerOperationSuccessSignature
  | CompilerOperationSuccessDataSignature;

/**
 * The result of a successful `signature` compiler operation.
 */
export interface CompilerOperationSuccessSignature
  extends CompilerOperationSuccessGeneric {
  signature: {
    /**
     * The transaction signing serialization signed by a signature. This signing
     * serialization is hashed twice with `sha256`, and the digest is signed.
     */
    serialization: Uint8Array;
  };
}

/**
 * The result of a successful `data_signature` compiler operation.
 */
export interface CompilerOperationSuccessDataSignature
  extends CompilerOperationSuccessGeneric {
  signature: {
    /**
     * The raw message signed by a data signature. This message is hashed once
     * with `sha256`, and the digest is signed.
     */
    message: Uint8Array;
  };
}

/**
 * An unsuccessful compiler operation result which should be skipped by the
 * compiler. See `attemptCompilerOperations` for details.
 */
export interface CompilerOperationSkip {
  status: 'skip';
}

export type CompilerOperationResult<
  CanBeSkipped extends boolean = false
> = CanBeSkipped extends true
  ? CompilerOperationError | CompilerOperationSuccess | CompilerOperationSkip
  : CompilerOperationError | CompilerOperationSuccess;

/**
 * A compiler operation method which accepts the identifier being evaluated, the
 * compilation data, and the compilation environment, and returns a
 * `CompilerOperationResult`.
 *
 * @typeParam TransactionContext - the type of the `TransactionContext` in
 * `CompilationData<TransactionContext>` expected by this operation
 * @typeParam CanBeSkipped - if true, this operation may return
 * `CompilerOperationSkip` to indicate that it cannot be applied and should be
 * skipped
 * @typeParam Data - the type of the `CompilationData` expected by this
 * operation
 * @typeParam Environment - the type of the `CompilationEnvironment` expected by
 * this operation
 * @param identifier - The full identifier used to describe this operation, e.g.
 * `owner.signature.all_outputs`.
 * @param data - The `CompilationData` provided to the compiler
 * @param environment - The `CompilationEnvironment` provided to the compiler
 */
export type CompilerOperation<
  TransactionContext = unknown,
  CanBeSkipped extends boolean = false,
  Data extends CompilationData<TransactionContext> = CompilationData<
    TransactionContext
  >,
  Environment extends AnyCompilationEnvironment<
    TransactionContext
  > = CompilationEnvironment<TransactionContext>
> = (
  identifier: string,
  data: Data,
  environment: Environment
) => CompilerOperationResult<CanBeSkipped>;

export type CompilerOperationsKeysCommon = 'public_key' | 'signature';

/**
 * Valid identifiers for full transaction signing serialization algorithms. Each
 * full serialization is double-sha256 hashed to produce the digest which is
 * signed.
 */
export type CompilerOperationsSigningSerializationFull =
  | 'full_all_outputs'
  | 'full_all_outputs_single_input'
  | 'full_corresponding_output'
  | 'full_corresponding_output_single_input'
  | 'full_no_outputs'
  | 'full_no_outputs_single_input';

/**
 * Valid identifiers for components of transaction signing serializations.
 * Components are combined in various orders to produce each of the valid
 * "full" signing serializations.
 */
export type CompilerOperationsSigningSerializationComponent =
  | 'version'
  | 'transaction_outpoints'
  | 'transaction_outpoints_hash'
  | 'transaction_sequence_numbers'
  | 'transaction_sequence_numbers_hash'
  | 'outpoint_transaction_hash'
  | 'outpoint_index'
  | 'covered_bytecode_length'
  | 'covered_bytecode'
  | 'output_value'
  | 'sequence_number'
  | 'corresponding_output'
  | 'corresponding_output_hash'
  | 'transaction_outputs'
  | 'transaction_outputs_hash'
  | 'locktime';

/**
 * Valid identifiers describing the various full and partial signing
 * serializations available to the compiler.
 */
export type CompilerOperationsSigningSerializationCommon =
  | CompilerOperationsSigningSerializationComponent
  | CompilerOperationsSigningSerializationFull;

/**
 * The full context required to compile a given Bitauth Template script –
 * everything required for the compiler to understand the CompilationData and
 * generate the compiled bytecode (targeting a specific
 * `AuthenticationVirtualMachine`).
 *
 * @remarks
 * A `CompilationEnvironment` must include a subset of the script's
 * `AuthenticationTemplate` – all the variables and scripts referenced
 * (including children of children) by the script in question.
 *
 * The context must also include an object mapping of opcode identifiers to the
 * bytecode they generate.
 *
 * If keys are used, an implementation of `sha256` and `secp256k1` is
 * required. If the script requires evaluations during compilation, the
 * evaluating `AuthenticationVirtualMachine` must also be included.
 *
 * @typeParam TransactionContext - additional data available to compiler
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
export interface CompilationEnvironment<
  TransactionContext = unknown,
  CompilerKeyOperations extends string | false = CompilerOperationsKeysCommon,
  CompilerSigningSerializationOperations extends
    | string
    | false = CompilerOperationsSigningSerializationCommon,
  CompilerAddressDataOperations extends string | false = false,
  CompilerWalletDataOperations extends string | false = false,
  CompilerCurrentBlockHeightOperations extends string | false = false,
  CompilerCurrentBlockTimeOperations extends string | false = false
> {
  /**
   * A method which accepts the compiled bytecode contents of a BTL evaluation
   * and produces the equivalent `AuthenticationProgram` to be evaluated by the
   * VM. This method is used internally to compute BTL evaluations. See
   * `createAuthenticationProgramEvaluationCommon` for details.
   */
  createAuthenticationProgram?: (
    evaluationBytecode: Uint8Array
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ) => any;

  /**
   * An object mapping template variable identifiers to the entity identifiers
   * responsible for them. This is required for `HdKey` support, as each entity
   * uses a single HD private key (provided in `hdKeys.hdPrivateKeys`) or HD
   * public key (provided in `hdKeys.hdPublicKeys`) per compilation, and each
   * `HdKey` variable is derived from this key.
   *
   * To avoid compilation errors, this object must contain all `HdKey` variables
   * referenced by the script being compiled (including in child scripts). To
   * enable support for error handling like `extractMissingVariables`, it's
   * recommended that all variables be provided here.
   */
  // eslint-disable-next-line functional/no-mixed-type
  entityOwnership?: {
    [variableId: string]: string;
  };

  /**
   * An object mapping the script identifiers of locking scripts to their
   * locking script type, either `standard` or `p2sh`.
   *
   * This is used to transform compilation results into the proper structure for
   * P2SH locking and unlocking scripts.
   *
   * When compiling locking scripts of type `p2sh`, the result will be placed in
   * a P2SH "redeemScript" format:
   * `OP_HASH160 <$(<result> OP_HASH160)> OP_EQUAL`
   *
   * When compiling unlocking scripts which unlock locking scripts of type
   * `p2sh`, the result will be transformed into the P2SH unlocking format:
   * `result <locking_script>` (where `locking_script` is the compiled bytecode
   * of the locking script, without the "redeemScript" transformation.)
   *
   * By default, all scripts are assumed to have the type `standard`.
   */
  lockingScriptTypes?: {
    [lockingScriptId: string]: 'p2sh' | 'standard';
  };

  /**
   * An object mapping opcode identifiers to the bytecode they generate.
   */
  opcodes?: {
    [opcodeIdentifier: string]: Uint8Array;
  };
  /**
   * An object specifying the operations made available by this compilation
   * environment for each variable type. For example, keys typically support
   * public key derivation (`.public_key`) and several signature types.
   *
   * Compiler operations can be specified as a single operation for all
   * instances of a variable type (as is the default for `AddressData` or
   * `WalletData`), or they can be specified as an object, where each key is a
   * valid operation name (as is the default for `Key` and `HdKey`).
   */
  operations?: {
    hdKey?: CompilerKeyOperations extends string
      ? {
          [operationId in CompilerKeyOperations]?: CompilerOperation<
            TransactionContext
          >;
        }
      : CompilerOperation<TransactionContext>;
    key?: CompilerKeyOperations extends string
      ? {
          [operationId in CompilerKeyOperations]?: CompilerOperation<
            TransactionContext
          >;
        }
      : CompilerOperation<TransactionContext>;
    addressData?: CompilerAddressDataOperations extends string
      ? {
          [operationId in CompilerAddressDataOperations]?: CompilerOperation<
            TransactionContext
          >;
        }
      : CompilerOperation<TransactionContext>;
    walletData?: CompilerWalletDataOperations extends string
      ? {
          [operationId in CompilerWalletDataOperations]?: CompilerOperation<
            TransactionContext
          >;
        }
      : CompilerOperation<TransactionContext>;
    currentBlockHeight?: CompilerCurrentBlockHeightOperations extends string
      ? {
          [operationId in CompilerCurrentBlockHeightOperations]?: CompilerOperation<
            TransactionContext
          >;
        }
      : CompilerOperation<TransactionContext>;
    currentBlockTime?: CompilerCurrentBlockTimeOperations extends string
      ? {
          [operationId in CompilerCurrentBlockTimeOperations]?: CompilerOperation<
            TransactionContext
          >;
        }
      : CompilerOperation<TransactionContext>;
    signingSerialization?: CompilerSigningSerializationOperations extends string
      ? {
          [operationId in CompilerSigningSerializationOperations]?: CompilerOperation<
            TransactionContext
          >;
        }
      : CompilerOperation<TransactionContext>;
  };

  /**
   * An implementation of ripemd160 is required for any scripts which include
   * `HdKey`s. This can be instantiated with `instantiateRipemd160`.
   */
  ripemd160?: { hash: Ripemd160['hash'] };
  /**
   * An object mapping scenario identifiers to the
   * `AuthenticationTemplateScenario`s they represent.
   */
  scenarios?: {
    [scriptId: string]: AuthenticationTemplateScenario;
  };
  /**
   * An object mapping script identifiers to the text of script in Bitauth
   * Templating Language.
   *
   * To avoid compilation errors, this object must contain all scripts
   * referenced by the script being compiled (including children of children).
   */
  scripts: {
    [scriptId: string]: string;
  };
  /**
   * An implementation of secp256k1 is required for any scripts which include
   * signatures. This can be instantiated with `instantiateSecp256k1`.
   */
  secp256k1?: {
    addTweakPrivateKey: (
      privateKey: Uint8Array,
      tweakValue: Uint8Array
    ) => Uint8Array;
    addTweakPublicKeyCompressed: (
      publicKey: Uint8Array,
      tweakValue: Uint8Array
    ) => Uint8Array;
    derivePublicKeyCompressed: Secp256k1['derivePublicKeyCompressed'];
    signMessageHashSchnorr: Secp256k1['signMessageHashSchnorr'];
    signMessageHashDER: Secp256k1['signMessageHashDER'];
  };
  /**
   * An implementation of sha256 is required for any scripts which include
   * signatures. This can be instantiated with `instantiateSha256`.
   */
  sha256?: { hash: Sha256['hash'] };
  /**
   * An implementation of sha512 is required for any scripts which include
   * `HdKey`s. This can be instantiated with `instantiateSha512`.
   */
  sha512?: { hash: Sha512['hash'] };
  /**
   * Only for use when recursively calling `compileScript` (e.g. in compiler
   * operations).
   *
   * The "breadcrumb" path of script IDs currently being compiled, including the
   * current script. (E.g. `["grandparentId", "parentId", "scriptId"]`)
   *
   * BTL identifier resolution must be acyclic. To prevent an infinite loop,
   * `IdentifierResolutionFunction`s must abort resolution if they encounter
   * their own `id` while resolving another identifier. Likewise, child scripts
   * being resolved by a parent script may not reference any script which is
   * already in the process of being resolved.
   */
  sourceScriptIds?: string[];

  /**
   * An object mapping the identifiers of unlocking scripts to the identifiers
   * of the locking scripts they unlock. This is used to identify the
   * `coveredBytecode` used in signing serializations, and it is required for
   * all signature operations and many signing serialization operations.
   */
  unlockingScripts?: {
    [unlockingScriptId: string]: string;
  };

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
   * See `AuthenticationTemplateScript.timeLockType` for details.
   */
  unlockingScriptTimeLockTypes?: {
    [unlockingScriptId: string]: 'timestamp' | 'height';
  };

  /**
   * An object mapping template variable identifiers to the
   * `AuthenticationTemplateVariable` describing them.
   *
   * To avoid compilation errors, this object must contain all variables
   * referenced by the script being compiled (including in child scripts).
   */
  variables?: {
    [variableId: string]: AuthenticationTemplateVariable;
  };
  /**
   * The AuthenticationVirtualMachine on which BTL `evaluation` results will be
   * computed.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  vm?: AuthenticationVirtualMachine<any, any>;
}

/**
 * Data required at compilation time to generate the bytecode for a particular
 * Bitauth Template script.
 */
export interface CompilationData<
  TransactionContext = TransactionContextCommon
> {
  /**
   * A map of full identifiers to pre-computed bytecode for this compilation.
   *
   * This is always used to provide bytecode for `AddressData` and `WalletData`,
   * and it can also be used to provide public keys and signatures which have
   * been pre-computed by other entities (e.g. when computing these would
   * require access to private keys held by another entities).
   *
   * The provided `fullIdentifier` should match the complete identifier for
   * each item, e.g. `some_wallet_data`, `variable_id.public_key`, or
   * `variable_id.signature.all_outputs`.
   *
   * To provide `AddressData` or `WalletData` from advanced user interfaces,
   * consider parsing input with `compileBtl`.
   *
   * @remarks
   * It is security-critical that only identifiers provided by the entities
   * expected to provide them are included here. For example:
   *
   * 1. When generating a `lockingBytecode` for a 2-of-2 wallet, a
   * malicious entity could provide a pre-computed value for `us.public_key`
   * which is equal to `them.public_key` such that the resulting
   * `lockingBytecode` is entirely controlled by that entity.
   *
   * 2. When generating an `unlockingBytecode` which includes a data signature,
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
   * `extractMissingVariables`, and each missing variable should be filled only
   * by bytecode values provided by entities from which they were expected.
   */
  bytecode?: {
    [fullIdentifier: string]: Uint8Array;
  };
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
     * This is required for any compiler operation which requires derivation.
     * Typically, the value is incremented by one for each address in a wallet.
     */
    addressIndex?: number;
    /**
     * A map of entity IDs to HD public keys. These HD public keys are used to
     * derive public keys for each `HdKey` variable assigned to that entity (as
     * specified in `CompilationEnvironment.entityOwnership`) according to its
     * `publicDerivationPath`.
     *
     * HD public keys may be encoded for either mainnet or testnet (the network
     * information is ignored).
     *
     * If both an HD private key (in `hdPrivateKeys`) and HD public key (in
     * `hdPublicKeys`) are provided for the same entity in the same compilation
     * (not recommended), the HD private key is used.
     */
    hdPublicKeys?: {
      [entityId: string]: string;
    };
    /**
     * A map of entity IDs to master HD private keys. These master HD private
     * keys are used to derive each `HdKey` variable assigned to that entity (as
     * specified in `CompilationEnvironment.entityOwnership`) according to its
     * `privateDerivationPath`.
     *
     * HD private keys may be encoded for either mainnet or testnet (the network
     * information is ignored).
     *
     * If both an HD private key (in `hdPrivateKeys`) and HD public key (in
     * `hdPublicKeys`) are provided for the same entity in the same compilation
     * (not recommended), only the HD private key is used.
     */
    hdPrivateKeys?: {
      [entityId: string]: string;
    };
  };
  /**
   * An object describing the settings used for `Key` variables in this
   * compilation.
   */
  keys?: {
    /**
     * A map of `Key` variable IDs to their private keys for this compilation.
     */
    privateKeys?: {
      [variableId: string]: Uint8Array;
    };
  };
  /**
   * The `TransactionContext` expected by this particular compiler for any
   * operations used in the compilation.
   */
  transactionContext?: TransactionContext;
}

/**
 * Any compilation environment, where each data type may use either a single or
 * multiple operations.
 */
export type AnyCompilationEnvironment<
  TransactionContext
> = CompilationEnvironment<
  TransactionContext,
  string | false,
  string | false,
  string | false,
  string | false,
  string | false,
  string | false
>;

/**
 * Any compilation environment where the type of the `operations` value is
 * irrelevant.
 */
export type AnyCompilationEnvironmentIgnoreOperations<
  TransactionContext = TransactionContextCommon
> = Omit<AnyCompilationEnvironment<TransactionContext>, 'operations'>;

export type BytecodeGenerationResult<ProgramState> =
  | {
      bytecode: Uint8Array;
      success: true;
    }
  | CompilationResultError<ProgramState>;

/**
 * A fully-generated authentication template scenario. Useful for estimating
 * transactions and testing of authentication templates. See
 * `AuthenticationTemplateScenario` for details.
 */
export interface Scenario {
  data: CompilationData;
  program: AuthenticationProgramTransactionContextCommon;
}

/**
 * A `Compiler` is a wrapper around a specific `CompilationEnvironment` which
 * exposes a purely-functional interface and allows for stronger type checking.
 */
export interface Compiler<
  TransactionContext,
  CompilationEnvironment,
  ProgramState
> {
  environment: CompilationEnvironment;
  /**
   * Generate the bytecode for the given script and compilation data.
   *
   * @param script - the identifer of the script to compile
   * @param data - the compilation data required to compile this script
   * @param debug - enable compilation debugging information (default: `false`)
   */
  // eslint-disable-next-line functional/no-mixed-type
  generateBytecode: <Debug extends boolean>(
    scriptId: string,
    data: CompilationData<TransactionContext>,
    debug?: Debug
  ) => Debug extends true
    ? CompilationResult<ProgramState>
    : BytecodeGenerationResult<ProgramState>;
  /**
   * Generate the compilation data for a scenario specified in this compilation
   * environment. Returns either the full `CompilationData` for the selected
   * scenario or an error message (as a `string`).
   *
   * Note, generated compilation data always uses a `transactionContext` of type
   * `TransactionContextCommon`.
   *
   * @param scenario - the identifer of the scenario to generate
   */
  generateScenario: ({
    scenarioId,
    unlockingScriptId,
  }: {
    scenarioId?: string;
    unlockingScriptId?: string;
  }) => Scenario | string;
}
