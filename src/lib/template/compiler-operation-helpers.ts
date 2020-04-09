import { decodeHdPrivateKey, deriveHdPath } from '../key/hd-key';

import { CompilerDefaults } from './compiler-defaults';
import {
  CompilationData,
  CompilationEnvironment,
  CompilerOperation,
  CompilerOperationDataCommon,
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
    if (result !== false) return result;
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
  ) => CanBeSkipped extends true
    ? Uint8Array | string | false
    : Uint8Array | string;
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
        ? false
        : `Cannot resolve "${identifier}" – the "${property}" property was not provided in the compilation environment.`) as CanBeSkipped extends true
        ? false
        : string;
  }
  // eslint-disable-next-line functional/no-loop-statement
  for (const property of dataProperties) {
    if (data[property] === undefined)
      return (canBeSkipped
        ? false
        : `Cannot resolve "${identifier}" – the "${property}" property was not provided in the compilation data.`) as CanBeSkipped extends true
        ? false
        : string;
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
        return signatures[identifier];

      return false;
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
        return signatures[identifier];

      return false;
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
}) => {
  const addressOffset =
    hdKey.addressOffset ?? CompilerDefaults.hdKeyAddressOffset;
  const privateDerivationPath =
    hdKey.privateDerivationPath ?? CompilerDefaults.hdKeyPrivateDerivationPath;
  const i = addressIndex + addressOffset;
  const instancePath = privateDerivationPath.replace('i', i.toString());

  const masterContents = decodeHdPrivateKey(environment, entityHdPrivateKey);
  if (typeof masterContents === 'string') {
    return `Could not generate ${identifier} – the HD private key provided for ${entityId} could not be decoded: ${masterContents}`;
  }

  const instanceNode = deriveHdPath(
    environment,
    masterContents.node,
    instancePath
  );

  if (typeof instanceNode === 'string') {
    return `Could not generate ${identifier} – the path "${instancePath}" could not be derived for entity "${entityId}": ${instanceNode}`;
  }

  return instanceNode.privateKey;
};

export const compilerOperationHelperUnknownEntity = (
  identifier: string,
  variableId: string
) =>
  `Identifier "${identifier}" refers to an HdKey, but the "entityOwnership" for "${variableId}" is not available in this compilation environment.`;

export const compilerOperationHelperAddressIndex = (identifier: string) =>
  `Identifier "${identifier}" refers to an HdKey, but "hdKeys.addressIndex" was not provided in the compilation data.`;

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
  hdKeys: NonNullable<CompilationData<CompilerOperationDataCommon>['hdKeys']>;
  identifier: string;
}) => {
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
    return `Identifier "${identifier}" refers to an HdKey owned by "${entityId}", but an HD private key for this entity (or an existing signature) was not provided in the compilation data.`;
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
