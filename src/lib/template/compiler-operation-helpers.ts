import { decodeHdPrivateKey, deriveHdPath } from '../key/hd-key';

import { CompilerDefaults } from './compiler-defaults';
import {
  CompilationData,
  CompilationEnvironment,
  CompilerOperation,
  CompilerOperationDataCommon,
  CompilerOperationErrorFatal,
  CompilerOperationResult,
  CompilerOperationSkip,
} from './compiler-types';
import { HdKey } from './template-types';

/**
 * Attempt a series of compiler operations, skipping to the next operation if
 * the current operation returns `false` (indicating it failed and can be
 * skipped, see `CompilerOperation`). The `finalOperation` may not be skipped,
 * and must either return bytecode or an error message.
 *
 * @param operations - an array of skippable operations to try
 * @param finalOperation - a final, un-skippable operation
 */
export const attemptCompilerOperations = <
  OperationData = CompilerOperationDataCommon
>(
  operations: CompilerOperation<OperationData, true>[],
  finalOperation: CompilerOperation<OperationData>
): CompilerOperation<OperationData> => (identifier, data, environment) => {
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
  RequiredDataProperties extends keyof CompilationData<{}>,
  RequiredEnvironmentProperties extends keyof CompilationEnvironment,
  OperationData = CompilerOperationDataCommon
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
      Pick<CompilationData<OperationData>, RequiredDataProperties>
    > &
      CompilationData<OperationData>,
    environment: Required<
      Pick<CompilationEnvironment<OperationData>, RequiredEnvironmentProperties>
    > &
      CompilationEnvironment<OperationData>
  ) => CompilerOperationResult<CanBeSkipped>;
  // eslint-disable-next-line complexity
}): CompilerOperation<OperationData, CanBeSkipped> => (
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
    if (data[property] === undefined)
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
      Pick<CompilationData<OperationData>, RequiredDataProperties>
    >,
    environment as Required<
      Pick<CompilationEnvironment<OperationData>, RequiredEnvironmentProperties>
    > &
      CompilationEnvironment<OperationData>
  );
};

export const compilerOperationHdKeyPrecomputedSignature = compilerOperationRequires(
  {
    canBeSkipped: true,
    dataProperties: ['hdKeys'],
    environmentProperties: [],
    operation: (identifier, data) => {
      const { hdKeys } = data;
      const { signatures } = hdKeys;
      if (
        signatures !== undefined &&
        (signatures[identifier] as Uint8Array | undefined) !== undefined
      )
        return { bytecode: signatures[identifier], status: 'success' };

      return { status: 'skip' };
    },
  }
);

export const compilerOperationKeyPrecomputedSignature = compilerOperationRequires(
  {
    canBeSkipped: true,
    dataProperties: ['keys'],
    environmentProperties: [],
    operation: (identifier, data) => {
      const { keys } = data;
      const { signatures } = keys;
      if (
        signatures !== undefined &&
        (signatures[identifier] as Uint8Array | undefined) !== undefined
      )
        return { bytecode: signatures[identifier], status: 'success' };

      return { status: 'skip' };
    },
  }
);

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
  hdKey: HdKey;
  identifier: string;
}): CompilerOperationResult => {
  const addressOffset =
    hdKey.addressOffset ?? CompilerDefaults.hdKeyAddressOffset;
  const privateDerivationPath =
    hdKey.privateDerivationPath ?? CompilerDefaults.hdKeyPrivateDerivationPath;
  const i = addressIndex + addressOffset;
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
  const hdKey = environment.variables[variableId] as HdKey;

  return compilerOperationHelperDeriveHdPrivateNode({
    addressIndex,
    entityHdPrivateKey,
    entityId,
    environment,
    hdKey,
    identifier,
  });
};
