import { decodeHdPrivateKey, deriveHdPath } from '../key/key.js';
import { resolveScriptIdentifier } from '../language/language.js';
import type {
  AnyCompilerConfiguration,
  CompilationContextBCH,
  CompilationData,
  CompilerConfiguration,
  CompilerOperation,
  CompilerOperationErrorFatal,
  CompilerOperationResult,
  CompilerOperationSkip,
  WalletTemplateHdKey,
} from '../lib.js';

import { CompilerDefaults } from './compiler-defaults.js';

/**
 * Attempt a series of compiler operations, skipping to the next operation if
 * the current operation returns a {@link CompilerOperationSkip} (indicating it
 * failed and can be skipped). The `finalOperation` may not be skipped, and must
 * either return {@link CompilerOperationSuccess} or
 * {@link CompilerOperationError}.
 *
 * @param operations - an array of skippable operations to try
 * @param finalOperation - a final, un-skippable operation
 */
export const attemptCompilerOperations =
  <CompilationContext = CompilationContextBCH>(
    operations: CompilerOperation<CompilationContext, true>[],
    finalOperation: CompilerOperation<CompilationContext>,
  ): CompilerOperation<CompilationContext> =>
  (identifier, data, configuration) => {
    // eslint-disable-next-line functional/no-loop-statements
    for (const operation of operations) {
      const result = operation(identifier, data, configuration);
      if (result.status !== 'skip') return result;
    }
    return finalOperation(identifier, data, configuration);
  };

/**
 * Modify a compiler operation to verify that certain properties exist in the
 * {@link CompilationData} and {@link CompilerConfiguration} before executing
 * the provided operation. If the properties don't exist, an error message
 * is returned.
 *
 * This is useful for eliminating repetitive existence checks.
 */
export const compilerOperationRequires =
  <
    CanBeSkipped extends boolean,
    RequiredDataProperties extends keyof CompilationData<unknown>,
    RequiredConfigurationProperties extends keyof CompilerConfiguration,
    CompilationContext = CompilationContextBCH,
  >({
    /**
     * If `true`, the accepted operation may return `false`, and any missing
     * properties will cause the returned operation to return `false` (meaning
     * the operation should be skipped)
     */
    canBeSkipped,
    /**
     * An array of the top-level properties required in the
     * {@link CompilationData}.
     */
    dataProperties,
    /**
     * An array of the top-level properties required in the
     * {@link CompilerConfiguration}
     */
    configurationProperties,
    /**
     * The operation to run if all required properties exist
     */
    operation,
  }: {
    canBeSkipped: CanBeSkipped;
    dataProperties: RequiredDataProperties[];
    configurationProperties: RequiredConfigurationProperties[];
    operation: (
      identifier: string,
      data: CompilationData<CompilationContext> &
        Required<
          Pick<CompilationData<CompilationContext>, RequiredDataProperties>
        >,
      configuration: CompilerConfiguration<CompilationContext> &
        Required<
          Pick<
            CompilerConfiguration<CompilationContext>,
            RequiredConfigurationProperties
          >
        >,
    ) => CompilerOperationResult<CanBeSkipped>;
  }): CompilerOperation<CompilationContext, CanBeSkipped> =>
  // eslint-disable-next-line complexity
  (identifier, data, configuration) => {
    // eslint-disable-next-line functional/no-loop-statements
    for (const property of configurationProperties) {
      if (configuration[property] === undefined)
        return (
          canBeSkipped
            ? { status: 'skip' }
            : {
                error: `Cannot resolve "${identifier}" - the "${property}" property was not provided in the compiler configuration.`,
                status: 'error',
              }
        ) as CanBeSkipped extends true
          ? CompilerOperationSkip
          : CompilerOperationErrorFatal;
    }
    // eslint-disable-next-line functional/no-loop-statements
    for (const property of dataProperties) {
      if (
        (data[property] as (typeof data)[typeof property] | undefined) ===
        undefined
      )
        return (
          canBeSkipped
            ? { status: 'skip' }
            : {
                error: `Cannot resolve "${identifier}" - the "${property}" property was not provided in the compilation data.`,
                status: 'error',
              }
        ) as CanBeSkipped extends true
          ? CompilerOperationSkip
          : CompilerOperationErrorFatal;
    }

    return operation(
      identifier,
      data as Required<
        Pick<CompilationData<CompilationContext>, RequiredDataProperties>
      >,
      configuration as CompilerConfiguration<CompilationContext> &
        Required<
          Pick<
            CompilerConfiguration<CompilationContext>,
            RequiredConfigurationProperties
          >
        >,
    );
  };

export const compilerOperationAttemptBytecodeResolution =
  compilerOperationRequires({
    canBeSkipped: true,
    configurationProperties: [],
    dataProperties: ['bytecode'],
    operation: (identifier, data) => {
      const bytecode = data.bytecode[identifier];
      if (bytecode !== undefined) {
        return { bytecode, status: 'success' };
      }
      return { status: 'skip' };
    },
  });

// eslint-disable-next-line complexity
export const compilerOperationHelperDeriveHdPrivateNode = ({
  addressIndex,
  entityId,
  entityHdPrivateKey,
  configuration,
  hdKey,
  identifier,
}: {
  addressIndex: number;
  entityId: string;
  entityHdPrivateKey: string;
  configuration: {
    ripemd160: NonNullable<CompilerConfiguration['ripemd160']>;
    secp256k1: NonNullable<CompilerConfiguration['secp256k1']>;
    sha256: NonNullable<CompilerConfiguration['sha256']>;
    sha512: NonNullable<CompilerConfiguration['sha512']>;
  };
  hdKey: WalletTemplateHdKey;
  identifier: string;
}): CompilerOperationResult => {
  const addressOffset =
    hdKey.addressOffset ?? CompilerDefaults.hdKeyAddressOffset;
  const privateDerivationPath =
    hdKey.privateDerivationPath ?? CompilerDefaults.hdKeyPrivateDerivationPath;
  const i = addressIndex + addressOffset;

  const validPrivatePathWithIndex = /^m(?:\/(?:[0-9]+|i)'?)*$/u;
  if (!validPrivatePathWithIndex.test(privateDerivationPath)) {
    return {
      error: `Could not generate ${identifier} - the path "${privateDerivationPath}" is not a valid "privateDerivationPath".`,
      status: 'error',
    };
  }

  const instancePath = privateDerivationPath.replace('i', i.toString());

  const masterContents = decodeHdPrivateKey(entityHdPrivateKey, configuration);
  if (typeof masterContents === 'string') {
    return {
      error: `Could not generate ${identifier} - the HD private key provided for ${entityId} could not be decoded: ${masterContents}`,
      status: 'error',
    };
  }

  const instanceNode = deriveHdPath(
    masterContents.node,
    instancePath,
    configuration,
  );

  if (typeof instanceNode === 'string') {
    return {
      error: `Could not generate ${identifier} - the path "${instancePath}" could not be derived for entity "${entityId}": ${instanceNode}`,
      status: 'error',
    };
  }

  return {
    bytecode: instanceNode.privateKey,
    status: 'success',
  };
};

export const compilerOperationHelperUnknownEntity = (
  identifier: string,
  variableId: string,
) => ({
  error: `Identifier "${identifier}" refers to an HdKey, but the "entityOwnership" for "${variableId}" is not available in this compiler configuration.`,
  status: 'error' as const,
});

export const compilerOperationHelperAddressIndex = (identifier: string) => ({
  error: `Identifier "${identifier}" refers to an HdKey, but "hdKeys.addressIndex" was not provided in the compilation data.`,
  status: 'error' as const,
});

export const compilerOperationHelperDeriveHdKeyPrivate = ({
  configuration,
  hdKeys,
  identifier,
}: {
  configuration: {
    entityOwnership: NonNullable<CompilerConfiguration['entityOwnership']>;
    ripemd160: NonNullable<CompilerConfiguration['ripemd160']>;
    secp256k1: NonNullable<CompilerConfiguration['secp256k1']>;
    sha256: NonNullable<CompilerConfiguration['sha256']>;
    sha512: NonNullable<CompilerConfiguration['sha512']>;
    variables: NonNullable<CompilerConfiguration['variables']>;
  };
  hdKeys: NonNullable<CompilationData['hdKeys']>;
  identifier: string;
}): CompilerOperationResult => {
  const { addressIndex, hdPrivateKeys } = hdKeys;
  const [variableId] = identifier.split('.') as [string];

  const entityId = configuration.entityOwnership[variableId];
  if (entityId === undefined) {
    return compilerOperationHelperUnknownEntity(identifier, variableId);
  }

  if (addressIndex === undefined) {
    return compilerOperationHelperAddressIndex(identifier);
  }

  const entityHdPrivateKey =
    hdPrivateKeys === undefined ? undefined : hdPrivateKeys[entityId];

  if (entityHdPrivateKey === undefined) {
    return {
      error: `Identifier "${identifier}" refers to an HdKey owned by "${entityId}", but an HD private key for this entity (or an existing signature) was not provided in the compilation data.`,
      recoverable: true,
      status: 'error',
    };
  }

  /**
   * Guaranteed to be an `HdKey` if this method is reached in the compiler.
   */
  const hdKey = configuration.variables[variableId] as WalletTemplateHdKey;

  return compilerOperationHelperDeriveHdPrivateNode({
    addressIndex,
    configuration,
    entityHdPrivateKey,
    entityId,
    hdKey,
    identifier,
  });
};

/**
 * Returns `false` if the target script ID doesn't exist in the compiler
 * configuration (allows for the caller to generate the error message).
 *
 * If the compilation produced errors, returns a
 * {@link CompilerOperationErrorFatal}.
 *
 * If the compilation was successful, returns the compiled bytecode as a
 * `Uint8Array`.
 */
export const compilerOperationHelperCompileScript = <CompilationContext>({
  targetScriptId,
  data,
  configuration,
}: {
  targetScriptId: string;
  data: CompilationData<CompilationContext>;
  configuration: AnyCompilerConfiguration<CompilationContext>;
}) => {
  const signingTarget = configuration.scripts[targetScriptId];

  const compiledTarget = resolveScriptIdentifier({
    configuration,
    data,
    identifier: targetScriptId,
  });
  if (signingTarget === undefined || compiledTarget === false) {
    return false;
  }
  if (typeof compiledTarget === 'string') {
    return {
      error: compiledTarget,
      status: 'error',
    } as CompilerOperationErrorFatal;
  }
  return compiledTarget.bytecode;
};

/**
 * Returns either the properly generated `coveredBytecode` or a
 * {@link CompilerOperationErrorFatal}.
 */
export const compilerOperationHelperGenerateCoveredBytecode = <
  CompilationContext,
>({
  data,
  configuration,
  identifier,
  sourceScriptIds,
  unlockingScripts,
}: {
  data: CompilationData<CompilationContext>;
  configuration: AnyCompilerConfiguration<CompilationContext>;
  identifier: string;
  sourceScriptIds: string[];
  unlockingScripts: { [unlockingScriptId: string]: string };
}): CompilerOperationErrorFatal | Uint8Array => {
  const currentScriptId = sourceScriptIds[sourceScriptIds.length - 1];
  if (currentScriptId === undefined) {
    return {
      error: `Identifier "${identifier}" requires a signing serialization, but "coveredBytecode" cannot be determined because the compiler configuration's "sourceScriptIds" is empty.`,
      status: 'error',
    };
  }

  const targetLockingScriptId = unlockingScripts[currentScriptId];
  if (targetLockingScriptId === undefined) {
    return {
      error: `Identifier "${identifier}" requires a signing serialization, but "coveredBytecode" cannot be determined because "${currentScriptId}" is not present in the compiler configuration's "unlockingScripts".`,
      status: 'error',
    };
  }

  const result = compilerOperationHelperCompileScript({
    configuration,
    data,
    targetScriptId: targetLockingScriptId,
  });

  if (result === false) {
    return {
      error: `Identifier "${identifier}" requires a signing serialization that covers an unknown locking script, "${targetLockingScriptId}".`,
      status: 'error',
    };
  }

  return result;
};
