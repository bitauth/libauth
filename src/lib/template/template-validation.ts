import { CompilerDefaults } from './compiler-defaults';
import {
  AddressData,
  AuthenticationTemplate,
  AuthenticationTemplateEntity,
  AuthenticationTemplateScript,
  AuthenticationTemplateScriptLocking,
  AuthenticationTemplateScriptTest,
  AuthenticationTemplateScriptTested,
  AuthenticationTemplateScriptUnlocking,
  AuthenticationTemplateVariable,
  AuthenticationVirtualMachineIdentifier,
  HdKey,
  Key,
  WalletData,
} from './template-types';

const listIds = (ids: string[]) =>
  ids
    .map((id) => `"${id}"`)
    .sort((a, b) => a.localeCompare(b))
    .join(', ');

/**
 * Parse an authentication template `scripts` object into its component scripts,
 * validating the shape of each script object. Returns either an error message
 * as a string or an object of cloned and sorted scripts.
 *
 * @param scripts - the `scripts` property of an `AuthenticationTemplate`
 */
// eslint-disable-next-line complexity
export const parseAuthenticationTemplateScripts = (scripts: object) => {
  const unknownScripts = Object.entries(scripts).map<{
    id: string;
    script: unknown;
  }>(([id, script]) => ({ id, script }));

  const nonObjectScripts = unknownScripts
    .filter(({ script }) => typeof script !== 'object' || script === null)
    .map(({ id }) => id);
  if (nonObjectScripts.length > 0) {
    return `All authentication template scripts must be objects, but the following scripts are not objects: ${listIds(
      nonObjectScripts
    )}.`;
  }
  const allScripts = unknownScripts as { id: string; script: object }[];

  const unlockingResults: (
    | { id: string; script: AuthenticationTemplateScriptUnlocking }
    | string
  )[] = allScripts
    .filter(({ script }) => 'unlocks' in script)
    // eslint-disable-next-line complexity
    .map(({ id, script }) => {
      const {
        timeLockType,
        unlocks,
        script: scriptContents,
        name,
      } = script as {
        name: unknown;
        script: unknown;
        timeLockType: unknown;
        unlocks: unknown;
      };
      if (typeof unlocks !== 'string') {
        return `The "unlocks" property of unlocking script "${id}" must be a string.`;
      }
      if (typeof scriptContents !== 'string') {
        return `The "script" property of unlocking script "${id}" must be a string.`;
      }

      if (name !== undefined && typeof name !== 'string') {
        return `If defined, the "name" property of unlocking script "${id}" must be a string.`;
      }

      if (
        timeLockType !== undefined &&
        timeLockType !== ('timestamp' as const) &&
        timeLockType !== ('height' as const)
      ) {
        return `If defined, the "timeLockType" property of unlocking script "${id}" must be either "timestamp" or "height".`;
      }
      return {
        id,
        script: {
          ...(name === undefined ? {} : { name }),
          script: scriptContents,
          ...(timeLockType === undefined ? {} : { timeLockType }),
          unlocks,
        },
      };
    });

  const invalidUnlockingResults = unlockingResults.filter(
    (result): result is string => typeof result === 'string'
  );
  if (invalidUnlockingResults.length > 0) {
    return invalidUnlockingResults.join(' ');
  }
  const validUnlockingResults = (unlockingResults as unknown) as {
    id: string;
    script: AuthenticationTemplateScriptUnlocking;
  }[];
  const unlocking = validUnlockingResults.reduce<{
    [id: string]: AuthenticationTemplateScriptUnlocking;
  }>((all, result) => ({ ...all, [result.id]: result.script }), {});
  const unlockingIds = validUnlockingResults.map(({ id }) => id);
  const impliedLockingIds = validUnlockingResults.map(
    ({ script }) => script.unlocks
  );

  const lockingResults: (
    | { id: string; script: AuthenticationTemplateScriptLocking }
    | string
  )[] = allScripts
    .filter(
      ({ id, script }) =>
        'lockingType' in script || impliedLockingIds.includes(id)
    )
    // eslint-disable-next-line complexity
    .map(({ id, script }) => {
      const { lockingType, script: scriptContents, name } = script as {
        name: unknown;
        script: unknown;
        lockingType: unknown;
      };

      if (lockingType !== 'standard' && lockingType !== 'p2sh') {
        return `The "lockingType" property of locking script "${id}" must be either "standard" or "p2sh".`;
      }
      if (typeof scriptContents !== 'string') {
        return `The "script" property of locking script "${id}" must be a string.`;
      }

      if (name !== undefined && typeof name !== 'string') {
        return `If defined, the "name" property of locking script "${id}" must be a string.`;
      }

      return {
        id,
        script: {
          lockingType,
          ...(name === undefined ? {} : { name }),
          script: scriptContents,
        },
      };
    });

  const invalidLockingResults = lockingResults.filter(
    (result): result is string => typeof result === 'string'
  );
  if (invalidLockingResults.length > 0) {
    return invalidLockingResults.join(' ');
  }
  const validLockingResults = (lockingResults as unknown) as {
    id: string;
    script: AuthenticationTemplateScriptLocking;
  }[];
  const locking = validLockingResults.reduce<{
    [id: string]: AuthenticationTemplateScriptLocking;
  }>((all, result) => ({ ...all, [result.id]: result.script }), {});
  const lockingIds = validLockingResults.map(({ id }) => id);

  const unknownLockingIds = Object.values(unlocking)
    .map((script) => script.unlocks)
    .filter((unlocks) => !lockingIds.includes(unlocks));

  if (unknownLockingIds.length > 0) {
    return `The following locking scripts (referenced in "unlocks" properties) were not provided: ${listIds(
      unknownLockingIds
    )}.`;
  }

  const testedResults: (
    | { id: string; script: AuthenticationTemplateScriptTested }
    | string
  )[] = allScripts
    .filter(({ script }) => 'tests' in script)
    // eslint-disable-next-line complexity
    .map(({ id, script }) => {
      const { tests, script: scriptContents, name } = script as {
        name: unknown;
        script: unknown;
        tests: unknown;
      };

      if (typeof scriptContents !== 'string') {
        return `The "script" property of tested script "${id}" must be a string.`;
      }

      if (name !== undefined && typeof name !== 'string') {
        return `If defined, the "name" property of tested script "${id}" must be a string.`;
      }

      if (!Array.isArray(tests)) {
        return `If defined, the "tests" property of tested script "${id}" must be an array.`;
      }

      const extractedTests =
        // eslint-disable-next-line complexity
        tests.map<string | AuthenticationTemplateScriptTest>((test) => {
          const { check, name: testName, setup } = test as {
            check: unknown;
            name: unknown;
            setup: unknown;
          };
          if (typeof check !== 'string') {
            return `The "check" properties of all tests in tested script "${id}" must be a strings.`;
          }

          if (testName !== undefined && typeof testName !== 'string') {
            return `If defined, the "name" properties of all tests in tested script "${id}" must be strings.`;
          }

          if (setup !== undefined && typeof setup !== 'string') {
            return `If defined, the "setup" properties of all tests in tested script "${id}" must be strings.`;
          }

          return {
            check,
            ...(testName === undefined ? {} : { name: testName }),
            ...(setup === undefined ? {} : { setup }),
          };
        });

      const invalidTests = extractedTests.filter(
        (result): result is string => typeof result === 'string'
      );

      if (invalidTests.length > 0) {
        return invalidTests.join(' ');
      }

      const validTests = extractedTests as AuthenticationTemplateScriptTest[];

      return {
        id,
        script: {
          ...(name === undefined ? {} : { name }),
          script: scriptContents,
          tests: validTests,
        },
      };
    });

  const invalidTestedResults = testedResults.filter(
    (result): result is string => typeof result === 'string'
  );
  if (invalidTestedResults.length > 0) {
    return invalidTestedResults.join(' ');
  }
  const validTestedResults = (testedResults as unknown) as {
    id: string;
    script: AuthenticationTemplateScriptTested;
  }[];
  const tested = validTestedResults.reduce<{
    [id: string]: AuthenticationTemplateScriptTested;
  }>((all, result) => ({ ...all, [result.id]: result.script }), {});

  const testedIds = validTestedResults.map(({ id }) => id);
  const lockingAndUnlockingIds = [...lockingIds, ...unlockingIds];

  const lockingAndUnlockingIdsWithTests = lockingAndUnlockingIds.filter((id) =>
    testedIds.includes(id)
  );

  if (lockingAndUnlockingIdsWithTests.length > 0) {
    return `Locking and unlocking scripts may not have tests, but the following scripts include a "tests" property: ${listIds(
      lockingAndUnlockingIdsWithTests
    )}`;
  }

  const alreadySortedIds = [...lockingAndUnlockingIds, testedIds];

  const otherResults: (
    | { id: string; script: AuthenticationTemplateScript }
    | string
  )[] = allScripts
    .filter(({ id }) => !alreadySortedIds.includes(id))
    .map(({ id, script }) => {
      const { script: scriptContents, name } = script as {
        name: unknown;
        script: unknown;
        timeLockType: unknown;
        unlocks: unknown;
      };
      if (typeof scriptContents !== 'string') {
        return `The "script" property of script "${id}" must be a string.`;
      }

      if (name !== undefined && typeof name !== 'string') {
        return `If defined, the "name" property of script "${id}" must be a string.`;
      }

      return {
        id,
        script: {
          ...(name === undefined ? {} : { name }),
          script: scriptContents,
        },
      };
    });

  const invalidOtherResults = otherResults.filter(
    (result): result is string => typeof result === 'string'
  );
  if (invalidOtherResults.length > 0) {
    return invalidOtherResults.join(' ');
  }
  const validOtherResults = (otherResults as unknown) as {
    id: string;
    script: AuthenticationTemplateScript;
  }[];
  const other = validOtherResults.reduce<{
    [id: string]: AuthenticationTemplateScript;
  }>((all, result) => ({ ...all, [result.id]: result.script }), {});

  return {
    locking,
    other,
    tested,
    unlocking,
  };
};

const authenticationTemplateVariableTypes = [
  'AddressData',
  'HdKey',
  'Key',
  'WalletData',
] as AuthenticationTemplateVariable['type'][];

const isAuthenticationTemplateVariableType = (
  type: unknown
): type is AuthenticationTemplateVariable['type'] =>
  authenticationTemplateVariableTypes.includes(
    type as AuthenticationTemplateVariable['type']
  );

/**
 * Parse an authentication template entity `variables` object into its component
 * variables, validating the shape of each variable object. Returns either an
 * error message as a string or the cloned variables object.
 *
 * @param scripts - the `scripts` property of an `AuthenticationTemplate`
 */
export const parseAuthenticationTemplateVariable = (
  variables: object,
  entityId: string
) => {
  const unknownVariables = Object.entries(variables).map<{
    id: string;
    variable: unknown;
  }>(([id, variable]) => ({ id, variable }));

  const nonObjectVariables = unknownVariables
    .filter(({ variable }) => typeof variable !== 'object' || variable === null)
    .map(({ id }) => id);
  if (nonObjectVariables.length > 0) {
    return `All authentication template variables must be objects, but the following variables owned by entity "${entityId}" are not objects: ${listIds(
      nonObjectVariables
    )}.`;
  }
  const allEntities = unknownVariables as { id: string; variable: object }[];

  const variableResults: (
    | { id: string; variable: AuthenticationTemplateVariable }
    | string
  )[] = allEntities
    // eslint-disable-next-line complexity
    .map(({ id, variable }) => {
      const { description, name, type } = variable as {
        description: unknown;
        name: unknown;
        type: unknown;
      };

      if (!isAuthenticationTemplateVariableType(type)) {
        return `The "type" property of variable "${id}" must be a valid authentication template variable type. Available types are: ${listIds(
          authenticationTemplateVariableTypes
        )}.`;
      }

      if (description !== undefined && typeof description !== 'string') {
        return `If defined, the "description" property of variable "${id}" must be a string.`;
      }

      if (name !== undefined && typeof name !== 'string') {
        return `If defined, the "name" property of variable "${id}" must be a string.`;
      }

      if (type === 'HdKey') {
        const {
          addressOffset,
          hdPublicKeyDerivationPath,
          privateDerivationPath,
          publicDerivationPath,
        } = variable as {
          addressOffset: unknown;
          hdPublicKeyDerivationPath: unknown;
          privateDerivationPath: unknown;
          publicDerivationPath: unknown;
        };

        if (addressOffset !== undefined && typeof addressOffset !== 'number') {
          return `If defined, the "addressOffset" property of HdKey "${id}" must be a number.`;
        }

        if (
          hdPublicKeyDerivationPath !== undefined &&
          typeof hdPublicKeyDerivationPath !== 'string'
        ) {
          return `If defined, the "hdPublicKeyDerivationPath" property of HdKey "${id}" must be a string.`;
        }

        if (
          privateDerivationPath !== undefined &&
          typeof privateDerivationPath !== 'string'
        ) {
          return `If defined, the "privateDerivationPath" property of HdKey "${id}" must be a string.`;
        }

        if (
          publicDerivationPath !== undefined &&
          typeof publicDerivationPath !== 'string'
        ) {
          return `If defined, the "publicDerivationPath" property of HdKey "${id}" must be a string.`;
        }

        const hdPublicKeyPath =
          hdPublicKeyDerivationPath ??
          CompilerDefaults.hdKeyHdPublicKeyDerivationPath;
        const privatePath =
          privateDerivationPath ?? CompilerDefaults.hdKeyPrivateDerivationPath;
        const publicPath =
          publicDerivationPath ?? privatePath.replace('m', 'M');

        const validPrivatePathWithIndex = /^m(?:\/(?:[0-9]+|i)'?)*$/u;
        const validPrivatePath = /^m(?:\/[0-9]+'?)*$/u;
        const replacedPrivatePath = privatePath.replace('i', '0');
        if (
          !validPrivatePathWithIndex.test(privatePath) &&
          !validPrivatePath.test(replacedPrivatePath)
        ) {
          return `If defined, the "privateDerivationPath" property of HdKey "${id}" must be a valid private derivation path, but the provided value is "${hdPublicKeyPath}". A valid path must begin with "m" and include only "/", "'", a single "i" address index character, and numbers.`;
        }
        if (!validPrivatePath.test(hdPublicKeyPath)) {
          return `If defined, the "hdPublicKeyDerivationPath" property of an HdKey must be a valid private derivation path for the HdKey's HD public node, but the provided value for HdKey "${id}" is "${hdPublicKeyPath}". A valid path must begin with "m" and include only "/", "'", and numbers (the "i" character cannot be used in "hdPublicKeyDerivationPath").`;
        }
        const validPublicPathWithIndex = /^M(?:\/(?:[0-9]+|i))*$/u;
        const validPublicPath = /^M(?:\/[0-9]+)*$/u;
        const replacedPublicPath = publicPath.replace('i', '0');
        if (
          !validPublicPathWithIndex.test(publicPath) &&
          !validPublicPath.test(replacedPublicPath)
        ) {
          return `The "publicDerivationPath" property of HdKey "${id}" must be a valid public derivation path, but the current value is "${publicPath}". Public derivation paths must begin with "M" and include only "/", a single "i" address index character, and numbers. If the "privateDerivationPath" uses hardened derivation, the "publicDerivationPath" should be set to enable public derivation from the "hdPublicKeyDerivationPath".`;
        }
        const publicPathSuffix = publicPath.replace('M/', '');
        const impliedPrivatePath = `${hdPublicKeyPath}/${publicPathSuffix}`;
        if (impliedPrivatePath !== privatePath) {
          return `The "privateDerivationPath" property of HdKey "${id}" is "${privatePath}", but the implied private derivation path of "hdPublicKeyDerivationPath" and "publicDerivationPath" is "${impliedPrivatePath}". The "publicDerivationPath" property must be set to allow for public derivation of the same HD node derived by "privateDerivationPath" beginning from the HD public key derived at "hdPublicKeyDerivationPath".`;
        }

        return {
          id,
          variable: {
            ...(addressOffset === undefined ? {} : { addressOffset }),
            ...(description === undefined ? {} : { description }),
            ...(hdPublicKeyDerivationPath === undefined
              ? {}
              : { hdPublicKeyDerivationPath }),
            ...(name === undefined ? {} : { name }),
            ...(privateDerivationPath === undefined
              ? {}
              : { privateDerivationPath }),
            ...(publicDerivationPath === undefined
              ? {}
              : { publicDerivationPath }),
            type,
          } as HdKey,
        };
      }

      return {
        id,
        variable: {
          ...(description === undefined ? {} : { description }),
          ...(name === undefined ? {} : { name }),
          type,
        } as WalletData | AddressData | Key,
      };
    });

  const invalidVariableResults = variableResults.filter(
    (result): result is string => typeof result === 'string'
  );
  if (invalidVariableResults.length > 0) {
    return invalidVariableResults.join(' ');
  }
  const validVariableResults = (variableResults as unknown) as {
    id: string;
    variable: AuthenticationTemplateVariable;
  }[];
  const clonedVariables = validVariableResults.reduce<{
    [id: string]: AuthenticationTemplateVariable;
  }>((all, result) => ({ ...all, [result.id]: result.variable }), {});

  return clonedVariables;
};

/**
 * Parse an authentication template `entities` object into its component
 * entities, validating the shape of each entity object. Returns either an error
 * message as a string or the cloned entities object.
 *
 * @param scripts - the `scripts` property of an `AuthenticationTemplate`
 */
export const parseAuthenticationTemplateEntities = (entities: object) => {
  const unknownEntities = Object.entries(entities).map<{
    id: string;
    entity: unknown;
  }>(([id, entity]) => ({ entity, id }));

  const nonObjectEntities = unknownEntities
    .filter(({ entity }) => typeof entity !== 'object' || entity === null)
    .map(({ id }) => id);
  if (nonObjectEntities.length > 0) {
    return `All authentication template entities must be objects, but the following entities are not objects: ${listIds(
      nonObjectEntities
    )}.`;
  }
  const allEntities = unknownEntities as { id: string; entity: object }[];

  const entityResults: (
    | { id: string; entity: AuthenticationTemplateEntity }
    | string
  )[] = allEntities
    // eslint-disable-next-line complexity
    .map(({ id, entity }) => {
      const { description, name, scripts, variables } = entity as {
        description: unknown;
        name: unknown;
        scripts: unknown;
        variables: unknown;
      };
      if (description !== undefined && typeof description !== 'string') {
        return `If defined, the "description" property of entity "${id}" must be a string.`;
      }

      if (name !== undefined && typeof name !== 'string') {
        return `If defined, the "name" property of entity "${id}" must be a string.`;
      }

      if (scripts !== undefined && !Array.isArray(scripts)) {
        return `If defined, the "scripts" property of entity "${id}" must be an array.`;
      }

      if (scripts?.some((item) => typeof item !== 'string') ?? false) {
        return `The "scripts" property of entity "${id}" should contain only script identifiers (strings).`;
      }

      if (
        variables !== undefined &&
        (typeof variables !== 'object' || variables === null)
      ) {
        return `If defined, the "variables" property of entity "${id}" must be an object.`;
      }

      const variableResult =
        variables === undefined
          ? undefined
          : parseAuthenticationTemplateVariable(variables, id);

      if (typeof variableResult === 'string') {
        return variableResult;
      }

      return {
        entity: {
          ...(description === undefined ? {} : { description }),
          ...(name === undefined ? {} : { name }),
          ...(scripts === undefined ? {} : { scripts }),
          variables: variableResult,
        },
        id,
      };
    });

  const invalidEntityResults = entityResults.filter(
    (result): result is string => typeof result === 'string'
  );
  if (invalidEntityResults.length > 0) {
    return invalidEntityResults.join(' ');
  }
  const validEntityResults = (entityResults as unknown) as {
    id: string;
    entity: AuthenticationTemplateEntity;
  }[];
  const clonedEntities = validEntityResults.reduce<{
    [id: string]: AuthenticationTemplateEntity;
  }>((all, result) => ({ ...all, [result.id]: result.entity }), {});

  return clonedEntities;
};

const isVersion0 = (maybeTemplate: object): maybeTemplate is { version: 0 } =>
  (maybeTemplate as { version?: unknown }).version === 0;

const schemaIsOptionalString = (
  maybeTemplate: object
): maybeTemplate is { $schema?: string } => {
  const property = (maybeTemplate as { $schema?: unknown }).$schema;
  return property === undefined || typeof property === 'string';
};

const nameIsOptionalString = (
  maybeTemplate: object
): maybeTemplate is { name?: string } => {
  const property = (maybeTemplate as { name?: unknown }).name;
  return property === undefined || typeof property === 'string';
};

const descriptionIsOptionalString = (
  maybeTemplate: object
): maybeTemplate is { description?: string } => {
  const property = (maybeTemplate as { description?: unknown }).description;
  return property === undefined || typeof property === 'string';
};

const supportsOnlyValidVmIdentifiers = <Identifiers>(
  maybeTemplate: object,
  availableIdentifiers: Identifiers[]
): maybeTemplate is { supported: Identifiers[] } => {
  const { supported } = maybeTemplate as { supported?: unknown };
  return (
    Array.isArray(supported) &&
    supported.every((value) => availableIdentifiers.includes(value))
  );
};

/**
 * Parse and validate an authentication template, returning either an error
 * message as a string or a valid, safely-cloned `AuthenticationTemplate`.
 *
 * This method validates both the structure and the contents of a template:
 * - All properties and sub-properties are verified to be of the expected type.
 * - The ID of each entity, script, and scenario is confirmed to be unique.
 * - Script IDs referenced by entities and other scripts (via `unlocks`) are
 * confirmed to exist.
 * - The derivation paths of each HdKey are validated against each other.
 *
 * This method does not validate the BTL contents of scripts (by attempting
 * compilation, evaluating `AuthenticationTemplateScriptTest`s, or evaluating
 * scenarios).
 *
 * TODO: finish validation of `scenarios`
 *
 * @param maybeTemplate - object to validate as an authentication template
 */
// eslint-disable-next-line complexity
export const validateAuthenticationTemplate = (
  maybeTemplate: unknown
): string | AuthenticationTemplate => {
  if (typeof maybeTemplate !== 'object' || maybeTemplate === null) {
    return 'A valid authentication template must be an object.';
  }
  if (!isVersion0(maybeTemplate)) {
    return 'Only version 0 authentication templates are currently supported.';
  }

  const vmIdentifiers = [
    'BCH_2022_11_SPEC',
    'BCH_2022_11',
    'BCH_2022_05_SPEC',
    'BCH_2022_05',
    'BCH_2021_11_SPEC',
    'BCH_2021_11',
    'BCH_2021_05_SPEC',
    'BCH_2021_05',
    'BCH_2020_11_SPEC',
    'BCH_2020_11',
    'BCH_2020_05',
    'BCH_2019_11',
    'BCH_2019_05',
    'BSV_2018_11',
    'BTC_2017_08',
  ] as AuthenticationVirtualMachineIdentifier[];
  if (!supportsOnlyValidVmIdentifiers(maybeTemplate, vmIdentifiers)) {
    return `Version 0 authentication templates must include a "supported" list of authentication virtual machine versions. Available identifiers are: ${vmIdentifiers.join(
      ', '
    )}.`;
  }

  if (!schemaIsOptionalString(maybeTemplate)) {
    return 'The "$schema" property of an authentication template must be a string.';
  }

  if (!nameIsOptionalString(maybeTemplate)) {
    return 'The "name" property of an authentication template must be a string.';
  }
  if (!descriptionIsOptionalString(maybeTemplate)) {
    return 'The "description" property of an authentication template must be a string.';
  }

  const { entities, scenarios, scripts } = (maybeTemplate as unknown) as {
    entities: unknown;
    scenarios: unknown;
    scripts: unknown;
  };

  if (typeof entities !== 'object' || entities === null) {
    return `The "entities" property of an authentication template must be an object.`;
  }

  if (typeof scripts !== 'object' || scripts === null) {
    return `The "scripts" property of an authentication template must be an object.`;
  }

  if (
    scenarios !== undefined &&
    (typeof scenarios !== 'object' || scenarios === null)
  ) {
    return `If defined, the "scenarios" property of an authentication template must be an object.`;
  }

  const parsedScripts = parseAuthenticationTemplateScripts(scripts);
  if (typeof parsedScripts === 'string') {
    return parsedScripts;
  }
  const clonedScripts = [
    ...Object.entries(parsedScripts.locking),
    ...Object.entries(parsedScripts.other),
    ...Object.entries(parsedScripts.tested),
    ...Object.entries(parsedScripts.unlocking),
  ].reduce((all, [id, script]) => ({ ...all, [id]: script }), {});

  const clonedEntities = parseAuthenticationTemplateEntities(entities);
  if (typeof clonedEntities === 'string') {
    return clonedEntities;
  }

  const variableIds = Object.values(clonedEntities).reduce<string[]>(
    (all, entity) =>
      entity.variables === undefined
        ? all
        : [...all, ...Object.keys(entity.variables)],
    []
  );
  const entityIds = Object.keys(clonedEntities);
  const scriptsIds = Object.keys(clonedScripts);

  const idCount = [
    ...variableIds,
    ...entityIds,
    ...scriptsIds,
    ...(scenarios === undefined ? [] : Object.keys(scenarios)),
  ].reduce<{ [id: string]: number }>(
    (count, id) => ({
      ...count,
      [id]: ((count[id] as number | undefined) ?? 0) + 1,
    }),
    {}
  );
  const duplicateIds = Object.entries(idCount)
    .filter(([, count]) => count > 1)
    .map(([id]) => id);

  if (duplicateIds.length > 0) {
    return `The ID of each entity, variable, script, and scenario in an authentication template must be unique. The following IDs are re-used: ${listIds(
      duplicateIds
    )}.`;
  }

  // TODO: confirm entities[id].scripts all exist

  // TODO: confirm every specified scenario in unlocking scripts exists (`estimate`, `passes`, and `fails`), every defined `scenario` in tests exists

  // TODO: return the cloned scenarios object

  return {
    ...(maybeTemplate.$schema === undefined
      ? {}
      : { $schema: maybeTemplate.$schema }),
    ...(maybeTemplate.description === undefined
      ? {}
      : { description: maybeTemplate.description }),
    entities: clonedEntities,
    ...(maybeTemplate.name === undefined ? {} : { name: maybeTemplate.name }),
    scenarios,
    scripts: clonedScripts,
    supported: maybeTemplate.supported,
    version: maybeTemplate.version,
  } as AuthenticationTemplate;
};
