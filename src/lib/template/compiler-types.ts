import { Ripemd160, Secp256k1, Sha256, Sha512 } from '../crypto/crypto';
import { AuthenticationInstruction } from '../vm/instruction-sets/instruction-sets-types';
import { AuthenticationVirtualMachine } from '../vm/virtual-machine';

import {
  CompilationResult,
  CompilationResultError,
} from './language/language-types';
import { AuthenticationTemplateVariable } from './template-types';

/**
 * Returns the bytecode result on success or an error message on failure.
 *
 * @typeParam OperationData - the type of the `CompilerOperationData` in
 * `CompilationData<CompilerOperationData>` expected by this operation
 * @typeParam CanBeSkipped - if true, this operation may return `false` to
 * indicate that it cannot be applied and should be skipped
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
  OperationData = {},
  CanBeSkipped extends boolean = false,
  Data extends CompilationData<OperationData> = CompilationData<OperationData>,
  Environment extends AnyCompilationEnvironment<
    OperationData
  > = CompilationEnvironment<OperationData>
> = (
  identifier: string,
  data: Data,
  environment: Environment
) => CanBeSkipped extends true
  ? Uint8Array | string | false
  : Uint8Array | string;

export type CompilerOperationsKeysCommon = 'public_key' | 'signature';

export interface CompilerOperationDataCommon {
  correspondingOutput?: Uint8Array;
  coveredBytecode: Uint8Array;
  locktime: number;
  outpointIndex: number;
  outpointTransactionHash: Uint8Array;
  outputValue: number;
  sequenceNumber: number;
  transactionOutpoints: Uint8Array;
  transactionOutputs: Uint8Array;
  transactionSequenceNumbers: Uint8Array;
  version: number;
}

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
 * @typeParam CompilerOperationData - additional data available to compiler
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
  CompilerOperationData = {},
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
   * A method which accepts an array of `AuthenticationInstruction`s, and
   * returns a ProgramState. This method will be used to generate the initial
   * ProgramState for `evaluation`s.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createState?: (instructions: AuthenticationInstruction<any>[]) => any;

  /**
   * An object mapping template variable identifiers to the entity identifiers
   * responsible for them. This is required for `HdKey` support, as each entity
   * uses a single HD private key (provided in `hdKeys.hdPrivateKeys`) or HD
   * public key (provided in `hdKeys.hdPublicKeys`) per compilation, and each
   * `HdKey` variable is derived from this key.
   *
   * To avoid compilation errors, this object must contain all `HdKey` variables
   * referenced by the script being compiled (including in child scripts).
   */
  // eslint-disable-next-line functional/no-mixed-type
  entityOwnership?: {
    [variableId: string]: string;
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
            CompilerOperationData
          >;
        }
      : CompilerOperation<CompilerOperationData>;
    key?: CompilerKeyOperations extends string
      ? {
          [operationId in CompilerKeyOperations]?: CompilerOperation<
            CompilerOperationData
          >;
        }
      : CompilerOperation<CompilerOperationData>;
    addressData?: CompilerAddressDataOperations extends string
      ? {
          [operationId in CompilerAddressDataOperations]?: CompilerOperation<
            CompilerOperationData
          >;
        }
      : CompilerOperation<CompilerOperationData>;
    walletData?: CompilerWalletDataOperations extends string
      ? {
          [operationId in CompilerWalletDataOperations]?: CompilerOperation<
            CompilerOperationData
          >;
        }
      : CompilerOperation<CompilerOperationData>;
    currentBlockHeight?: CompilerCurrentBlockHeightOperations extends string
      ? {
          [operationId in CompilerCurrentBlockHeightOperations]?: CompilerOperation<
            CompilerOperationData
          >;
        }
      : CompilerOperation<CompilerOperationData>;
    currentBlockTime?: CompilerCurrentBlockTimeOperations extends string
      ? {
          [operationId in CompilerCurrentBlockTimeOperations]?: CompilerOperation<
            CompilerOperationData
          >;
        }
      : CompilerOperation<CompilerOperationData>;
    signingSerialization?: CompilerSigningSerializationOperations extends string
      ? {
          [operationId in CompilerSigningSerializationOperations]?: CompilerOperation<
            CompilerOperationData
          >;
        }
      : CompilerOperation<CompilerOperationData>;
  };
  /**
   * An implementation of ripemd160 is required for any scripts which include
   * `HdKey`s. This can be instantiated with `instantiateRipemd160`.
   */
  ripemd160?: { hash: Ripemd160['hash'] };
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
   * The "breadcrumb" path of script IDs currently being resolved. (E.g.
   * `["grandparentId", "parentId"]`) BTL identifier resolution must be acyclic.
   *
   * To prevent an infinite loop, `IdentifierResolutionFunction`s must abort
   * resolution if they encounter their own `id` while resolving another
   * identifier. Likewise, child scripts being resolved by a parent script
   * may not reference any script which is already in the process of being
   * resolved.
   */
  sourceScriptIds?: string[];
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
export interface CompilationData<CompilerOperationData> {
  /**
   * A map of `AddressData` variable IDs and their values for this compilation.
   */
  addressData?: {
    [id: string]: Uint8Array;
  };
  /**
   * The current block height at compile time.
   */
  currentBlockHeight?: number;
  /**
   * The current block time at compile time. Note: this is not a current
   * timestamp, but the median timestamp of the last 11 blocks.
   *
   * This value only changes when a new block is found. See BIP113 for details.
   */
  currentBlockTime?: Date;
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
     * This is required for any compiler operation which requires derivation
     * (all operations except `public_key`s provided in `derivedPublicKeys` or
     * signatures provided in `signatures`). Typically, the value is incremented
     * by one for each address in a wallet.
     */
    addressIndex?: number;
    /**
     * A map of `HdKey` variable IDs to the derived public keys provided to us
     * by other entities for this compilation. These public keys are derived
     * according to each `HdKey` variable's `derivationPath`.
     *
     * This mapping allows us to fill public keys without requiring access to
     * the HD public key (or for hardened derivation, the HD private key). Since
     * we're not able to derive these public keys ourselves, other entities must
     * send us the derived public keys to include in the proper locations.
     */
    derivedPublicKeys?: {
      [id: string]: Uint8Array;
    };
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
     * (not recommended), only the HD private key is used.
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
    /**
     * Pre-computed signatures provided by other entities for this compilation.
     * Since they shouldn't share their private keys, they must share valid
     * signatures to include in the proper locations.
     *
     * The provided `fullIdentifier` should match the complete identifier for
     * each signature, e.g. `variable_id.signature.all_outputs`.
     */
    signatures?: {
      [fullIdentifier: string]: Uint8Array;
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
      [id: string]: Uint8Array;
    };
    /**
     * A map of `Key` variable IDs to their public keys for this compilation.
     */
    publicKeys?: {
      [id: string]: Uint8Array;
    };
    /**
     * Pre-computed signatures provided by other entities for this compilation.
     * Since they shouldn't share their private keys, they must share valid
     * signatures to include in the proper locations.
     *
     * The provided `fullIdentifier` should match the complete identifier for
     * each signature, e.g. `variable_id.signature.all_outputs`.
     */
    signatures?: {
      [fullIdentifier: string]: Uint8Array;
    };
  };
  /**
   * The `CompilerOperationData` expected by this particular compiler for any
   * operations used in the compilation.
   */
  operationData?: CompilerOperationData;
  /**
   * A map of `WalletData` variable IDs and their values for this compilation.
   */
  walletData?: {
    [id: string]: Uint8Array;
  };
}

export type AnyCompilationEnvironment<
  CompilerOperationData
> = CompilationEnvironment<
  CompilerOperationData,
  string | false,
  string | false,
  string | false,
  string | false,
  string | false,
  string | false
>;

export type BytecodeGenerationResult<ProgramState> =
  | {
      bytecode: Uint8Array;
      success: true;
    }
  | CompilationResultError<ProgramState>;

/**
 * A `Compiler` is a wrapper around a specific `CompilationEnvironment` which
 * exposes a purely-functional interface and allows for stronger type checking.
 */
export interface Compiler<CompilerOperationData, ProgramState> {
  // eslint-disable-next-line functional/no-method-signature
  generateBytecode(
    script: string,
    data: CompilationData<CompilerOperationData>,
    debug: true
  ): CompilationResult<ProgramState>;
  // eslint-disable-next-line functional/no-method-signature
  generateBytecode(
    script: string,
    data: CompilationData<CompilerOperationData>,
    debug?: false
  ): BytecodeGenerationResult<ProgramState>;
}
