import {
  AuthenticationTemplate,
  AuthenticationTemplateScript,
  AuthenticationTemplateScriptLocking,
  AuthenticationTemplateScriptTest,
  AuthenticationTemplateScriptTested,
  AuthenticationTemplateScriptUnlocking,
  AuthenticationVirtualMachineIdentifier,
} from './template-types';

const listIds = (ids: string[]) =>
  ids
    .map((id) => `"${id}"`)
    .sort((a, b) => a.localeCompare(b))
    .join(', ');

/**
 * Sort an authentication template `scripts` object into its component scripts,
 * validating the shape of each script object. Returns either an error message
 * as a string or the sorted scripts object.
 *
 * @param scripts - the `scripts` property of an `AuthenticationTemplate`
 */
// eslint-disable-next-line complexity
export const sortAuthenticationTemplateScripts = (scripts: object) => {
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
        script: { name, script: scriptContents, timeLockType, unlocks },
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

      return { id, script: { lockingType, name, script: scriptContents } };
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
        return `If defined, the "tests" property of tested script "${id}" must be an Array.`;
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

          return { check, name: testName, setup };
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
        script: { name, script: scriptContents, tests: validTests },
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
        script: { name, script: scriptContents },
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
 * message as a string or the validated `AuthenticationTemplate`.
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
 * TODO: finish validation of `entities` and `scenarios`
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

  const entityIds = Object.keys(entities);
  const scriptsIds = Object.keys(scripts);

  const idCount = [
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
    return `The ID of each entity, script, and scenario in an authentication template must be unique. The following IDs are re-used: ${listIds(
      duplicateIds
    )}.`;
  }

  const sortedScripts = sortAuthenticationTemplateScripts(scripts);
  if (typeof sortedScripts === 'string') {
    return sortedScripts;
  }

  return maybeTemplate as AuthenticationTemplate;
};
