import { decodeHdPrivateKey, deriveHdPath } from '../key/hd-key';
import { TransactionContextCommon } from '../transaction/transaction-types';

import { CompilerDefaults } from './compiler-defaults';
import {
  AnyCompilationEnvironment,
  CompilationData,
  CompilationEnvironment,
  CompilerOperation,
  CompilerOperationErrorFatal,
  CompilerOperationResult,
  CompilerOperationSkip,
} from './compiler-types';
import { resolveScriptIdentifier } from './language/resolve';
import { AuthenticationTemplateHdKey } from './template-types';

/**
 * Attempt a series of compiler operations, skipping to the next operation if
 * the current operation returns a `CompilerOperationSkip` (indicating it failed
 * and can be skipped). The `finalOperation` may not be skipped, and must either
 * return `CompilerOperationSuccess` or `CompilerOperationError`.
 *
 * @param operations - an array of skippable operations to try
 * @param finalOperation - a final, un-skippable operation
 */
export const attemptCompilerOperations = <
  TransactionContext = TransactionContextCommon
>(
  operations: CompilerOperation<TransactionContext, true>[],
  finalOperation: CompilerOperation<TransactionContext>
): CompilerOperation<TransactionContext> => (identifier, data, environment) => {
  // eslint-disable-next-line functional/no-loop-statement
  for (const operation of operations) {
    const result = operation(identifier, data, environment);
    if (result.status !== 'skip') return result;
  }
  return finalOperation(identifier, data, environment);
};

/**
 * Modify a compiler operation to verify that certain properties exist in the
 * `CompilationData` and `CompilationEnvironment` before executing the provided
 * operation. If the properties don't exist, an error message is returned.
 *
 * This is useful for eliminating repetitive existence checks.
 *
 * @param canBeSkipped - if `true`, the accepted operation may return `false`,
 * and any missing properties will cause the returned operation to return
 * `false` (meaning the operation should be skipped)
 * @param dataProperties - an array of the top-level properties required in the
 * `CompilationData`
 * @param environmentProperties - an array of the top-level properties required
 * in the `CompilationEnvironment`
 * @param operation - the operation to run if all required properties exist
 */
export const compilerOperationRequires = <
  CanBeSkipped extends boolean,
  RequiredDataProperties extends keyof CompilationData<unknown>,
  RequiredEnvironmentProperties extends keyof CompilationEnvironment,
  TransactionContext = TransactionContextCommon
>({
  canBeSkipped,
  dataProperties,
  environmentProperties,
  operation,
}: {
  canBeSkipped: CanBeSkipped;
  dataProperties: RequiredDataProperties[];
  environmentProperties: RequiredEnvironmentProperties[];
  operation: (
    identifier: string,
    data: Required<
      Pick<CompilationData<TransactionContext>, RequiredDataProperties>
    > &
      CompilationData<TransactionContext>,
    environment: Required<
      Pick<
        CompilationEnvironment<TransactionContext>,
        RequiredEnvironmentProperties
      >
    > &
      CompilationEnvironment<TransactionContext>
  ) => CompilerOperationResult<CanBeSkipped>;
  // eslint-disable-next-line complexity
}): CompilerOperation<TransactionContext, CanBeSkipped> => (
  identifier,
  data,
  environment
) => {
  // eslint-disable-next-line functional/no-loop-statement
  for (const property of environmentProperties) {
    if (environment[property] === undefined)
      return (canBeSkipped
        ? { status: 'skip' }
        : {
            error: `Cannot resolve "${identifier}" – the "${property}" property was not provided in the compilation environment.`,
            status: 'error',
          }) as CanBeSkipped extends true
        ? CompilerOperationSkip
        : CompilerOperationErrorFatal;
  }
  // eslint-disable-next-line functional/no-loop-statement
  for (const property of dataProperties) {
    if (
      (data[property] as typeof data[typeof property] | undefined) === undefined
    )
      return (canBeSkipped
        ? { status: 'skip' }
        : {
            error: `Cannot resolve "${identifier}" – the "${property}" property was not provided in the compilation data.`,
            status: 'error',
          }) as CanBeSkipped extends true
        ? CompilerOperationSkip
        : CompilerOperationErrorFatal;
  }

  return operation(
    identifier,
    data as Required<
      Pick<CompilationData<TransactionContext>, RequiredDataProperties>
    >,
    environment as Required<
      Pick<
        CompilationEnvironment<TransactionContext>,
        RequiredEnvironmentProperties
      >
    > &
      CompilationEnvironment<TransactionContext>
  );
};

export const compilerOperationAttemptBytecodeResolution = compilerOperationRequires(
  {
    canBeSkipped: true,
    dataProperties: ['bytecode'],
    environmentProperties: [],
    operation: (identifier, data) => {
      const { bytecode } = data;
      if ((bytecode[identifier] as Uint8Array | undefined) !== undefined) {
        return { bytecode: bytecode[identifier], status: 'success' };
      }
      return { status: 'skip' };
    },
  }
);

// eslint-disable-next-line complexity
export const compilerOperationHelperDeriveHdPrivateNode = ({
  addressIndex,
  entityId,
  entityHdPrivateKey,
  environment,
  hdKey,
  identifier,
}: {
  addressIndex: number;
  entityId: string;
  entityHdPrivateKey: string;
  environment: {
    ripemd160: NonNullable<CompilationEnvironment['ripemd160']>;
    secp256k1: NonNullable<CompilationEnvironment['secp256k1']>;
    sha256: NonNullable<CompilationEnvironment['sha256']>;
    sha512: NonNullable<CompilationEnvironment['sha512']>;
  };
  hdKey: AuthenticationTemplateHdKey;
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
      error: `Could not generate ${identifier} – the path "${privateDerivationPath}" is not a valid "privateDerivationPath".`,
      status: 'error',
    };
  }

  const instancePath = privateDerivationPath.replace('i', i.toString());

  const masterContents = decodeHdPrivateKey(environment, entityHdPrivateKey);
  if (typeof masterContents === 'string') {
    return {
      error: `Could not generate ${identifier} – the HD private key provided for ${entityId} could not be decoded: ${masterContents}`,
      status: 'error',
    };
  }

  const instanceNode = deriveHdPath(
    environment,
    masterContents.node,
    instancePath
  );

  if (typeof instanceNode === 'string') {
    return {
      error: `Could not generate ${identifier} – the path "${instancePath}" could not be derived for entity "${entityId}": ${instanceNode}`,
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
  variableId: string
) => ({
  error: `Identifier "${identifier}" refers to an HdKey, but the "entityOwnership" for "${variableId}" is not available in this compilation environment.`,
  status: 'error' as const,
});

export const compilerOperationHelperAddressIndex = (identifier: string) => ({
  error: `Identifier "${identifier}" refers to an HdKey, but "hdKeys.addressIndex" was not provided in the compilation data.`,
  status: 'error' as const,
});

export const compilerOperationHelperDeriveHdKeyPrivate = ({
  environment,
  hdKeys,
  identifier,
}: {
  environment: {
    entityOwnership: NonNullable<CompilationEnvironment['entityOwnership']>;
    ripemd160: NonNullable<CompilationEnvironment['ripemd160']>;
    secp256k1: NonNullable<CompilationEnvironment['secp256k1']>;
    sha256: NonNullable<CompilationEnvironment['sha256']>;
    sha512: NonNullable<CompilationEnvironment['sha512']>;
    variables: NonNullable<CompilationEnvironment['variables']>;
  };
  hdKeys: NonNullable<CompilationData['hdKeys']>;
  identifier: string;
}): CompilerOperationResult => {
  const { addressIndex, hdPrivateKeys } = hdKeys;
  const [variableId] = identifier.split('.');

  const entityId = environment.entityOwnership[variableId] as
    | string
    | undefined;
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
  const hdKey = environment.variables[
    variableId
  ] as AuthenticationTemplateHdKey;

  return compilerOperationHelperDeriveHdPrivateNode({
    addressIndex,
    entityHdPrivateKey,
    entityId,
    environment,
    hdKey,
    identifier,
  });
};

/**
 * Returns `false` if the target script ID doesn't exist in the compilation
 * environment (allows for the caller to generate the error message).
 *
 * If the compilation produced errors, returns a `CompilerOperationErrorFatal`.
 *
 * If the compilation was successful, returns the compiled bytecode as a
 * `Uint8Array`.
 */
export const compilerOperationHelperCompileScript = <TransactionContext>({
  targetScriptId,
  data,
  environment,
}: {
  targetScriptId: string;
  data: CompilationData<TransactionContext>;
  environment: AnyCompilationEnvironment<TransactionContext>;
}) => {
  const signingTarget = environment.scripts[targetScriptId] as
    | string
    | undefined;

  const compiledTarget = resolveScriptIdentifier({
    data,
    environment,
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
 * `CompilerOperationErrorFatal`.
 */
export const compilerOperationHelperGenerateCoveredBytecode = <
  TransactionContext
>({
  data,
  environment,
  identifier,
  sourceScriptIds,
  unlockingScripts,
}: {
  data: CompilationData<TransactionContext>;
  environment: AnyCompilationEnvironment<TransactionContext>;
  identifier: string;
  sourceScriptIds: string[];
  unlockingScripts: {
    [unlockingScriptId: string]: string;
  };
}): CompilerOperationErrorFatal | Uint8Array => {
  const currentScriptId = sourceScriptIds[sourceScriptIds.length - 1] as
    | string
    | undefined;
  if (currentScriptId === undefined) {
    return {
      error: `Identifier "${identifier}" requires a signing serialization, but "coveredBytecode" cannot be determined because the compilation environment's "sourceScriptIds" is empty.`,
      status: 'error',
    };
  }

  const targetLockingScriptId = unlockingScripts[currentScriptId] as
    | string
    | undefined;
  if (targetLockingScriptId === undefined) {
    return {
      error: `Identifier "${identifier}" requires a signing serialization, but "coveredBytecode" cannot be determined because "${currentScriptId}" is not present in the compilation environment "unlockingScripts".`,
      status: 'error',
    };
  }

  const result = compilerOperationHelperCompileScript({
    data,
    environment,
    targetScriptId: targetLockingScriptId,
  });

  if (result === false) {
    return {
      error: `Identifier "${identifier}" requires a signing serialization which covers an unknown locking script, "${targetLockingScriptId}".`,
      status: 'error',
    };
  }

  return result;
};
