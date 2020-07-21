/* eslint-disable max-lines, @typescript-eslint/ban-types */
import { hexToBin } from '../format/hex';
import { validateSecp256k1PrivateKey } from '../key/key-utils';

import { CompilerDefaults } from './compiler-defaults';
import { BuiltInVariables } from './language/resolve';
import {
  AuthenticationTemplate,
  AuthenticationTemplateAddressData,
  AuthenticationTemplateEntity,
  AuthenticationTemplateHdKey,
  AuthenticationTemplateKey,
  AuthenticationTemplateScenario,
  AuthenticationTemplateScenarioData,
  AuthenticationTemplateScenarioInput,
  AuthenticationTemplateScenarioOutput,
  AuthenticationTemplateScript,
  AuthenticationTemplateScriptLocking,
  AuthenticationTemplateScriptTest,
  AuthenticationTemplateScriptTested,
  AuthenticationTemplateScriptUnlocking,
  AuthenticationTemplateVariable,
  AuthenticationTemplateWalletData,
  AuthenticationVirtualMachineIdentifier,
} from './template-types';

const listIds = (ids: string[]) =>
  ids
    .map((id) => `"${id}"`)
    .sort((a, b) => a.localeCompare(b))
    .join(', ');

/**
 * Verify that the provided value is an array which is not sparse.
 */
const isDenseArray = (maybeArray: unknown): maybeArray is unknown[] =>
  Array.isArray(maybeArray) && !maybeArray.includes(undefined);

/**
 * Check that a value is an array which contains only strings and has no empty
 * items (is not a sparse array, e.g. `[1, , 3]`).
 */
const isStringArray = (maybeArray: unknown): maybeArray is string[] =>
  isDenseArray(maybeArray) &&
  !maybeArray.some((item) => typeof item !== 'string');

const isObject = (maybeObject: unknown): maybeObject is object =>
  typeof maybeObject === 'object' && maybeObject !== null;

const isStringObject = (
  maybeStringObject: object
): maybeStringObject is { [key: string]: string } =>
  !Object.values(maybeStringObject).some((value) => typeof value !== 'string');

const hasNonHexCharacter = /[^a-fA-F0-9]/u;
const isHexString = (maybeHexString: unknown): maybeHexString is string =>
  typeof maybeHexString === 'string' &&
  !hasNonHexCharacter.test(maybeHexString);

const characterLength32BytePrivateKey = 64;
const isObjectOfValidPrivateKeys = (
  maybePrivateKeysObject: object
): maybePrivateKeysObject is { [key: string]: string } =>
  !Object.values(maybePrivateKeysObject).some(
    (value) =>
      !isHexString(value) ||
      value.length !== characterLength32BytePrivateKey ||
      !validateSecp256k1PrivateKey(hexToBin(value))
  );

const isInteger = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value);

const isPositiveInteger = (value: unknown): value is number =>
  isInteger(value) && value >= 0;

const isRangedInteger = (
  value: unknown,
  minimum: number,
  maximum: number
): value is number => isInteger(value) && value >= minimum && value <= maximum;

/**
 * Verify that a value is a valid `satoshi` value: either a number between `0`
 * and `Number.MAX_SAFE_INTEGER` or a 16-character, hexadecimal-encoded string.
 *
 * @param maybeSatoshis - the value to verify
 */
const isValidSatoshisValue = (
  maybeSatoshis: unknown
): maybeSatoshis is number | string | undefined => {
  const uint64HexLength = 16;
  if (
    maybeSatoshis === undefined ||
    isRangedInteger(maybeSatoshis, 0, Number.MAX_SAFE_INTEGER) ||
    (isHexString(maybeSatoshis) && maybeSatoshis.length === uint64HexLength)
  ) {
    return true;
  }
  return false;
};

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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
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
        ageLock,
        estimate,
        fails,
        invalid,
        name,
        passes,
        script: scriptContents,
        timeLockType,
        unlocks,
      } = script as {
        ageLock: unknown;
        estimate: unknown;
        fails: unknown;
        invalid: unknown;
        name: unknown;
        passes: unknown;
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

      if (ageLock !== undefined && typeof ageLock !== 'string') {
        return `If defined, the "ageLock" property of unlocking script "${id}" must be a string.`;
      }

      if (estimate !== undefined && typeof estimate !== 'string') {
        return `If defined, the "estimate" property of unlocking script "${id}" must be a string.`;
      }

      if (name !== undefined && typeof name !== 'string') {
        return `If defined, the "name" property of unlocking script "${id}" must be a string.`;
      }

      if (fails !== undefined && !isStringArray(fails)) {
        return `If defined, the "fails" property of unlocking script "${id}" must be an array containing only scenario identifiers (strings).`;
      }

      if (invalid !== undefined && !isStringArray(invalid)) {
        return `If defined, the "invalid" property of unlocking script "${id}" must be an array containing only scenario identifiers (strings).`;
      }

      if (passes !== undefined && !isStringArray(passes)) {
        return `If defined, the "passes" property of unlocking script "${id}" must be an array containing only scenario identifiers (strings).`;
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
          ...(ageLock === undefined ? {} : { ageLock }),
          ...(estimate === undefined ? {} : { estimate }),
          ...(fails === undefined ? {} : { fails }),
          ...(invalid === undefined ? {} : { invalid }),
          ...(passes === undefined ? {} : { passes }),
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
  const validUnlockingResults = unlockingResults as {
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
  const validLockingResults = lockingResults as {
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
      const { tests, script: scriptContents, name, pushed } = script as {
        name: unknown;
        script: unknown;
        tests: unknown;
        pushed: unknown;
      };

      if (typeof scriptContents !== 'string') {
        return `The "script" property of tested script "${id}" must be a string.`;
      }

      if (name !== undefined && typeof name !== 'string') {
        return `If defined, the "name" property of tested script "${id}" must be a string.`;
      }

      if (pushed !== undefined && pushed !== true && pushed !== false) {
        return `If defined, the "pushed" property of tested script "${id}" must be a boolean value.`;
      }

      if (!Array.isArray(tests)) {
        return `If defined, the "tests" property of tested script "${id}" must be an array.`;
      }

      const extractedTests =
        // eslint-disable-next-line complexity
        tests.map<string | AuthenticationTemplateScriptTest>((test) => {
          const {
            check,
            fails,
            invalid,
            name: testName,
            passes,
            setup,
          } = test as {
            check: unknown;
            fails: unknown;
            invalid: unknown;
            name: unknown;
            passes: unknown;
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

          if (fails !== undefined && !isStringArray(fails)) {
            return `If defined, the "fails" property of each test in tested script "${id}" must be an array containing only scenario identifiers (strings).`;
          }

          if (invalid !== undefined && !isStringArray(invalid)) {
            return `If defined, the "invalid" property of each test in tested script "${id}" must be an array containing only scenario identifiers (strings).`;
          }

          if (passes !== undefined && !isStringArray(passes)) {
            return `If defined, the "passes" property of each test in tested script "${id}" must be an array containing only scenario identifiers (strings).`;
          }

          return {
            check,
            ...(fails === undefined ? {} : { fails }),
            ...(invalid === undefined ? {} : { invalid }),
            ...(passes === undefined ? {} : { passes }),
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
          ...(pushed === undefined ? {} : { pushed }),
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
  const validTestedResults = testedResults as {
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
  const validOtherResults = otherResults as {
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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
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
          } as AuthenticationTemplateHdKey,
        };
      }

      return {
        id,
        variable: {
          ...(description === undefined ? {} : { description }),
          ...(name === undefined ? {} : { name }),
          type,
        } as
          | AuthenticationTemplateWalletData
          | AuthenticationTemplateAddressData
          | AuthenticationTemplateKey,
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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
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

      if (scripts !== undefined && !isStringArray(scripts)) {
        return `If defined, the "scripts" property of entity "${id}" must be an array containing only script identifiers (strings).`;
      }

      if (variables !== undefined && !isObject(variables)) {
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
          ...(variableResult === undefined
            ? {}
            : { variables: variableResult }),
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
  const validEntityResults = entityResults as {
    id: string;
    entity: AuthenticationTemplateEntity;
  }[];
  const clonedEntities = validEntityResults.reduce<{
    [id: string]: AuthenticationTemplateEntity;
  }>((all, result) => ({ ...all, [result.id]: result.entity }), {});

  return clonedEntities;
};

/**
 * Validate and clone an Authentication Template Scenario `data.hdKeys` object.
 *
 * @param hdKeys - the `data.hdKeys` object to validate and clone
 * @param location - the location of the error to specify in error messages,
 * e.g. `scenario "test"` or
 * `'lockingBytecode.override' in output 2 of scenario "test"`
 */
// eslint-disable-next-line complexity
export const parseAuthenticationTemplateScenarioDataHdKeys = (
  hdKeys: object,
  location: string
): string | AuthenticationTemplateScenarioData['hdKeys'] => {
  const { addressIndex, hdPublicKeys, hdPrivateKeys } = hdKeys as {
    addressIndex: unknown;
    hdPublicKeys: unknown;
    hdPrivateKeys: unknown;
  };

  const maximumAddressIndex = 2147483648;
  if (
    addressIndex !== undefined &&
    !isRangedInteger(addressIndex, 0, maximumAddressIndex)
  ) {
    return `If defined, the "data.hdKeys.addressIndex" property of ${location} must be a positive integer between 0 and 2,147,483,648 (inclusive).`;
  }

  if (
    hdPublicKeys !== undefined &&
    !(isObject(hdPublicKeys) && isStringObject(hdPublicKeys))
  ) {
    return `If defined, the "data.hdKeys.hdPublicKeys" property of ${location} must be an object, and each value must be a string.`;
  }

  if (
    hdPrivateKeys !== undefined &&
    !(isObject(hdPrivateKeys) && isStringObject(hdPrivateKeys))
  ) {
    return `If defined, the "data.hdKeys.hdPrivateKeys" property of ${location} must be an object, and each value must be a string.`;
  }

  return {
    ...(addressIndex === undefined ? {} : { addressIndex }),
    ...(hdPublicKeys === undefined
      ? {}
      : { hdPublicKeys: { ...hdPublicKeys } }),
    ...(hdPrivateKeys === undefined
      ? {}
      : { hdPrivateKeys: { ...hdPrivateKeys } }),
  };
};

/**
 * Validate and clone an Authentication Template Scenario `data.keys` object.
 *
 * @param keys - the `data.keys` object to validate and clone
 * @param location - the location of the error to specify in error messages,
 * e.g. `scenario "test"` or
 * `'lockingBytecode.override' in output 2 of scenario "test"`
 */
export const parseAuthenticationTemplateScenarioDataKeys = (
  keys: object,
  location: string
): string | AuthenticationTemplateScenarioData['keys'] => {
  const { privateKeys } = keys as { privateKeys: unknown };

  if (
    privateKeys !== undefined &&
    !(isObject(privateKeys) && isObjectOfValidPrivateKeys(privateKeys))
  ) {
    return `If defined, the "data.keys.privateKeys" property of ${location} must be an object, and each value must be a 32-byte, hexadecimal-encoded private key.`;
  }

  return { ...(privateKeys === undefined ? {} : { privateKeys }) };
};

/**
 * Validate and clone an Authentication Template Scenario `data` object.
 *
 * @param data - the `data` object to validate and clone
 * @param location - the location of the error to specify in error messages,
 * e.g. `scenario "test"` or
 * `'lockingBytecode.override' in output 2 of scenario "test"`
 */
// eslint-disable-next-line complexity
export const parseAuthenticationTemplateScenarioData = (
  data: object,
  location: string
): string | AuthenticationTemplateScenarioData => {
  const {
    bytecode,
    currentBlockHeight,
    currentBlockTime,
    hdKeys,
    keys,
  } = data as {
    bytecode: unknown;
    currentBlockHeight: unknown;
    currentBlockTime: unknown;
    hdKeys: unknown;
    keys: unknown;
  };
  if (
    bytecode !== undefined &&
    (!isObject(bytecode) || !isStringObject(bytecode))
  ) {
    return `If defined, the "data.bytecode" property of ${location} must be an object, and each value must be a string.`;
  }

  const minimumBlockTime = 500000000;
  const maximumBlockTime = 4294967295;
  if (
    currentBlockHeight !== undefined &&
    !isRangedInteger(currentBlockHeight, 0, minimumBlockTime - 1)
  ) {
    return `If defined, the "currentBlockHeight" property of ${location} must be a positive integer from 0 to 499,999,999 (inclusive).`;
  }

  if (
    currentBlockTime !== undefined &&
    !isRangedInteger(currentBlockTime, minimumBlockTime, maximumBlockTime)
  ) {
    return `If defined, the "currentBlockTime" property of ${location} must be a positive integer from 500,000,000 to 4,294,967,295 (inclusive).`;
  }

  const hdKeysResult =
    hdKeys === undefined
      ? undefined
      : isObject(hdKeys)
      ? parseAuthenticationTemplateScenarioDataHdKeys(hdKeys, location)
      : `If defined, the "data.hdKeys" property of ${location} must be an object.`;

  if (typeof hdKeysResult === 'string') {
    return hdKeysResult;
  }

  const keysResult =
    keys === undefined
      ? undefined
      : isObject(keys)
      ? parseAuthenticationTemplateScenarioDataKeys(keys, location)
      : `If defined, the "data.keys" property of ${location} must be an object.`;

  if (typeof keysResult === 'string') {
    return keysResult;
  }

  return {
    ...(bytecode === undefined ? {} : { bytecode: { ...bytecode } }),
    ...(currentBlockHeight === undefined ? {} : { currentBlockHeight }),
    ...(currentBlockTime === undefined ? {} : { currentBlockTime }),
    ...(hdKeysResult === undefined ? {} : { hdKeys: hdKeysResult }),
    ...(keysResult === undefined ? {} : { keys: keysResult }),
  };
};

/**
 * Validate and clone an Authentication Template Scenario `transaction.inputs`
 * array.
 *
 * @param inputs - the `transaction.inputs` array to validate and clone
 * @param location - the location of the error to specify in error messages,
 * e.g. `scenario "test"`
 */
export const parseAuthenticationTemplateScenarioTransactionInputs = (
  inputs: unknown,
  location: string
): undefined | string | AuthenticationTemplateScenarioInput[] => {
  if (inputs === undefined) {
    return undefined;
  }

  if (!isDenseArray(inputs)) {
    return `If defined, the "transaction.inputs" property of ${location} must be an array of scenario input objects.`;
  }

  const inputResults: (AuthenticationTemplateScenarioInput | string)[] = inputs
    // eslint-disable-next-line complexity
    .map((maybeInput, inputIndex) => {
      const {
        outpointIndex,
        outpointTransactionHash,
        sequenceNumber,
        unlockingBytecode,
      } = maybeInput as {
        outpointIndex: unknown;
        outpointTransactionHash: unknown;
        sequenceNumber: unknown;
        unlockingBytecode: unknown;
      };
      const newLocation = `input ${inputIndex} in ${location}`;
      if (outpointIndex !== undefined && !isPositiveInteger(outpointIndex)) {
        return `If defined, the "outpointIndex" property of ${newLocation} must be a positive integer.`;
      }

      const characterLength32ByteHash = 64;
      if (
        outpointTransactionHash !== undefined &&
        !(
          isHexString(outpointTransactionHash) &&
          outpointTransactionHash.length === characterLength32ByteHash
        )
      ) {
        return `If defined, the "outpointTransactionHash" property of ${newLocation} must be a 32-byte, hexadecimal-encoded hash (string).`;
      }

      const maxSequenceNumber = 0xffffffff;
      if (
        sequenceNumber !== undefined &&
        !isRangedInteger(sequenceNumber, 0, maxSequenceNumber)
      ) {
        return `If defined, the "sequenceNumber" property of ${newLocation} must be a number between 0 and 4294967295 (inclusive).`;
      }

      if (
        unlockingBytecode !== undefined &&
        unlockingBytecode !== null &&
        !isHexString(unlockingBytecode)
      ) {
        return `If defined, the "unlockingBytecode" property of ${newLocation} must be either a null value or a hexadecimal-encoded string.`;
      }

      return {
        ...(outpointIndex === undefined ? {} : { outpointIndex }),
        ...(outpointTransactionHash === undefined
          ? {}
          : { outpointTransactionHash }),
        ...(sequenceNumber === undefined ? {} : { sequenceNumber }),
        ...(unlockingBytecode === undefined ? {} : { unlockingBytecode }),
      };
    });

  const invalidInputResults = inputResults.filter(
    (result): result is string => typeof result === 'string'
  );
  if (invalidInputResults.length > 0) {
    return invalidInputResults.join(' ');
  }
  const clonedInputs = inputResults as AuthenticationTemplateScenarioInput[];
  return clonedInputs;
};

/**
 * Validate and clone an Authentication Template Scenario transaction output
 * `lockingBytecode` object.
 *
 * @param outputs - the `transaction.outputs[outputIndex].lockingBytecode`
 * object to validate and clone
 * @param location - the location of the error to specify in error messages,
 * e.g. `output 2 in scenario "test"`
 */
// eslint-disable-next-line complexity
export const parseAuthenticationTemplateScenarioTransactionOutputLockingBytecode = (
  lockingBytecode: object,
  location: string
): string | AuthenticationTemplateScenarioOutput['lockingBytecode'] => {
  const { overrides, script } = lockingBytecode as {
    overrides: unknown;
    script: unknown;
  };

  if (script !== undefined && script !== null && !isHexString(script)) {
    return `If defined, the "script" property of ${location} must be a hexadecimal-encoded string or "null".`;
  }

  const clonedOverrides =
    overrides === undefined
      ? undefined
      : isObject(overrides)
      ? parseAuthenticationTemplateScenarioData(
          overrides,
          `'lockingBytecode.override' in ${location}`
        )
      : `If defined, the "overrides" property of ${location} must be an object.`;

  if (typeof clonedOverrides === 'string') {
    return clonedOverrides;
  }

  return {
    ...(script === undefined ? {} : { script }),
    ...(clonedOverrides === undefined ? {} : { overrides: clonedOverrides }),
  };
};

/**
 * Validate and clone an Authentication Template Scenario `transaction.outputs`
 * array.
 *
 * @param outputs - the `transaction.outputs` array to validate and clone
 * @param location - the location of the error to specify in error messages,
 * e.g. `of output 2 in scenario "test"`
 */
export const parseAuthenticationTemplateScenarioTransactionOutputs = (
  outputs: unknown,
  location: string
): undefined | string | AuthenticationTemplateScenarioOutput[] => {
  if (outputs === undefined) {
    return undefined;
  }

  if (!isDenseArray(outputs)) {
    return `If defined, the "transaction.outputs" property of ${location} must be an array of scenario output objects.`;
  }

  const outputResults: (
    | AuthenticationTemplateScenarioOutput
    | string
  )[] = outputs
    // eslint-disable-next-line complexity
    .map((maybeOutput, outputIndex) => {
      const { lockingBytecode, satoshis } = maybeOutput as {
        lockingBytecode: unknown;
        satoshis: unknown;
      };

      const newLocation = `output ${outputIndex} in ${location}`;
      if (
        lockingBytecode !== undefined &&
        typeof lockingBytecode !== 'string' &&
        !isObject(lockingBytecode)
      ) {
        return `If defined, the "lockingBytecode" property of ${newLocation} must be a string or an object.`;
      }

      if (
        typeof lockingBytecode === 'string' &&
        !isHexString(lockingBytecode)
      ) {
        return `If the "lockingBytecode" property of ${newLocation} is a string, it must be a valid, hexadecimal-encoded locking bytecode.`;
      }

      const clonedLockingBytecode =
        lockingBytecode === undefined || typeof lockingBytecode === 'string'
          ? undefined
          : parseAuthenticationTemplateScenarioTransactionOutputLockingBytecode(
              lockingBytecode,
              newLocation
            );

      if (typeof clonedLockingBytecode === 'string') {
        return clonedLockingBytecode;
      }

      if (!isValidSatoshisValue(satoshis)) {
        return `If defined, the "satoshis" property of ${newLocation} must be either a number or a little-endian, unsigned 64-bit integer as a hexadecimal-encoded string (16 characters).`;
      }

      return {
        ...(lockingBytecode === undefined
          ? {}
          : typeof lockingBytecode === 'string'
          ? { lockingBytecode }
          : { lockingBytecode: clonedLockingBytecode }),
        ...(satoshis === undefined ? {} : { satoshis }),
      };
    });

  const invalidOutputResults = outputResults.filter(
    (result): result is string => typeof result === 'string'
  );
  if (invalidOutputResults.length > 0) {
    return invalidOutputResults.join(' ');
  }
  const clonedOutputs = outputResults as AuthenticationTemplateScenarioOutput[];

  if (clonedOutputs.length === 0) {
    return `If defined, the "transaction.outputs" property of ${location} must be have at least one output.`;
  }
  return clonedOutputs;
};

/**
 * Validate and clone an Authentication Template Scenario `transaction` object.
 *
 * @param transaction - the `transaction` object to validate and clone
 * @param location - the location of the error to specify in error messages,
 * e.g. `of output 2 in scenario "test"`
 */
// eslint-disable-next-line complexity
export const parseAuthenticationTemplateScenarioTransaction = (
  transaction: object,
  location: string
): string | AuthenticationTemplateScenario['transaction'] => {
  const { inputs, locktime, outputs, version } = transaction as {
    inputs: unknown;
    locktime: unknown;
    outputs: unknown;
    version: unknown;
  };

  const maximumLocktime = 4294967295;
  if (
    locktime !== undefined &&
    !isRangedInteger(locktime, 0, maximumLocktime)
  ) {
    return `If defined, the "locktime" property of ${location} must be an integer between 0 and 4,294,967,295 (inclusive).`;
  }

  const maximumVersion = 4294967295;
  if (version !== undefined && !isRangedInteger(version, 0, maximumVersion)) {
    return `If defined, the "version" property of ${location} must be an integer between 0 and 4,294,967,295 (inclusive).`;
  }

  const clonedInputs = parseAuthenticationTemplateScenarioTransactionInputs(
    inputs,
    location
  );

  if (typeof clonedInputs === 'string') {
    return clonedInputs;
  }

  const clonedOutputs = parseAuthenticationTemplateScenarioTransactionOutputs(
    outputs,
    location
  );

  if (typeof clonedOutputs === 'string') {
    return clonedOutputs;
  }

  return {
    ...(locktime === undefined ? {} : { locktime }),
    ...(clonedInputs === undefined ? {} : { inputs: clonedInputs }),
    ...(clonedOutputs === undefined ? {} : { outputs: clonedOutputs }),
    ...(version === undefined ? {} : { version }),
  };
};

/**
 * Validate and clone an object of Authentication Template scenarios.
 *
 * @param scenarios - the scenarios object to validate and clone
 */
export const parseAuthenticationTemplateScenarios = (scenarios: object) => {
  const unknownScenarios = Object.entries(scenarios).map<{
    id: string;
    scenario: unknown;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  }>(([id, scenario]) => ({ id, scenario }));

  const nonObjectScenarios = unknownScenarios
    .filter(({ scenario }) => typeof scenario !== 'object' || scenario === null)
    .map(({ id }) => id);
  if (nonObjectScenarios.length > 0) {
    return `All authentication template scenarios must be objects, but the following scenarios are not objects: ${listIds(
      nonObjectScenarios
    )}.`;
  }
  const allScenarios = unknownScenarios as { id: string; scenario: object }[];

  const scenarioResults: (
    | { id: string; scenario: AuthenticationTemplateScenario }
    | string
  )[] = allScenarios
    // eslint-disable-next-line complexity
    .map(({ id, scenario }) => {
      const {
        data,
        description,
        extends: extendsProp,
        name,
        transaction,
        value,
      } = scenario as {
        data: unknown;
        description: unknown;
        extends: unknown;
        name: unknown;
        transaction: unknown;
        value: unknown;
      };

      const location = `scenario "${id}"`;
      if (description !== undefined && typeof description !== 'string') {
        return `If defined, the "description" property of ${location} must be a string.`;
      }

      if (name !== undefined && typeof name !== 'string') {
        return `If defined, the "name" property of ${location} must be a string.`;
      }

      if (extendsProp !== undefined && typeof extendsProp !== 'string') {
        return `If defined, the "extends" property of ${location} must be a string.`;
      }

      if (!isValidSatoshisValue(value)) {
        return `If defined, the "value" property of ${location} must be either a number or a little-endian, unsigned 64-bit integer as a hexadecimal-encoded string (16 characters).`;
      }

      if (data !== undefined && !isObject(data)) {
        return `If defined, the "data" property of ${location} must be an object.`;
      }

      if (transaction !== undefined && !isObject(transaction)) {
        return `If defined, the "transaction" property of ${location} must be an object.`;
      }

      const dataResult =
        data === undefined
          ? undefined
          : parseAuthenticationTemplateScenarioData(data, location);

      if (typeof dataResult === 'string') {
        return dataResult;
      }

      const transactionResult =
        transaction === undefined
          ? undefined
          : parseAuthenticationTemplateScenarioTransaction(
              transaction,
              location
            );

      if (typeof transactionResult === 'string') {
        return transactionResult;
      }

      const inputsUnderTest = transactionResult?.inputs?.filter(
        (input) =>
          input.unlockingBytecode === undefined ||
          input.unlockingBytecode === null
      );
      if (inputsUnderTest !== undefined && inputsUnderTest.length !== 1) {
        return `If defined, the "transaction.inputs" array of ${location} must have exactly one input under test (an "unlockingBytecode" set to "null").`;
      }

      return {
        id,
        scenario: {
          ...(dataResult === undefined ? {} : { data: dataResult }),
          ...(description === undefined ? {} : { description }),
          ...(extendsProp === undefined ? {} : { extends: extendsProp }),
          ...(name === undefined ? {} : { name }),
          ...(transactionResult === undefined
            ? {}
            : { transaction: transactionResult }),
          ...(value === undefined ? {} : { value }),
        },
      };
    });

  const invalidScenarioResults = scenarioResults.filter(
    (result): result is string => typeof result === 'string'
  );
  if (invalidScenarioResults.length > 0) {
    return invalidScenarioResults.join(' ');
  }
  const validScenarioResults = scenarioResults as {
    id: string;
    scenario: AuthenticationTemplateScenario;
  }[];
  const clonedScenarios = validScenarioResults.reduce<{
    [id: string]: AuthenticationTemplateScenario;
  }>((all, result) => ({ ...all, [result.id]: result.scenario }), {});

  const unknownExtends = Object.values(clonedScenarios).reduce<string[]>(
    (all, scenario) =>
      scenario.extends !== undefined &&
      (clonedScenarios[scenario.extends] as
        | AuthenticationTemplateScenario
        | undefined) === undefined
        ? [...all, scenario.extends]
        : all,
    []
  );
  if (unknownExtends.length > 0) {
    return `If defined, each scenario ID referenced by another scenario's "extends" property must exist. Unknown scenario IDs: ${listIds(
      unknownExtends
    )}.`;
  }
  return clonedScenarios;
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
 * compilation, evaluate `AuthenticationTemplateScriptTest`s, or test scenario
 * generation. Unknown properties are ignored and excluded from the final
 * result.
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
  if (
    !supportsOnlyValidVmIdentifiers(maybeTemplate, vmIdentifiers) ||
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    maybeTemplate.supported.includes(undefined as any)
  ) {
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

  const clonedScenarios =
    scenarios === undefined
      ? undefined
      : parseAuthenticationTemplateScenarios(scenarios);
  if (typeof clonedScenarios === 'string') {
    return clonedScenarios;
  }

  const variableIds = Object.values(clonedEntities).reduce<string[]>(
    (all, entity) =>
      entity.variables === undefined
        ? all
        : [...all, ...Object.keys(entity.variables)],
    []
  );
  const entityIds = Object.keys(clonedEntities);
  const scriptIds = Object.keys(clonedScripts);
  const scenarioIds =
    clonedScenarios === undefined ? [] : Object.keys(clonedScenarios);

  const usedIds = [...variableIds, ...entityIds, ...scriptIds, ...scenarioIds];
  const builtInIds = [
    BuiltInVariables.currentBlockHeight,
    BuiltInVariables.currentBlockTime,
    BuiltInVariables.signingSerialization,
  ];

  const usedBuiltInIds = builtInIds.filter((builtInIdentifier) =>
    usedIds.includes(builtInIdentifier)
  );
  if (usedBuiltInIds.length > 0) {
    return `Built-in identifiers may not be re-used by any entity, variable, script, or scenario. The following built-in identifiers are re-used: ${listIds(
      usedBuiltInIds
    )}.`;
  }

  const idUsageCount = usedIds.reduce<{ [id: string]: number }>(
    (count, id) => ({
      ...count,
      [id]: ((count[id] as number | undefined) ?? 0) + 1,
    }),
    {}
  );
  const duplicateIds = Object.entries(idUsageCount)
    .filter(([, count]) => count > 1)
    .map(([id]) => id);

  if (duplicateIds.length > 0) {
    return `The ID of each entity, variable, script, and scenario in an authentication template must be unique. The following IDs are re-used: ${listIds(
      duplicateIds
    )}.`;
  }

  const unknownScriptIds = Object.values(clonedEntities)
    .reduce<string[]>(
      (all, entity) =>
        entity.scripts === undefined ? all : [...all, ...entity.scripts],
      []
    )
    .reduce<string[]>(
      (unique, id) =>
        scriptIds.includes(id) || unique.includes(id)
          ? unique
          : [...unique, id],
      []
    );

  if (unknownScriptIds.length > 0) {
    return `Only known scripts may be assigned to entities. The following script IDs are not provided in this template: ${listIds(
      unknownScriptIds
    )}.`;
  }

  const unknownScenarioIds = [
    ...Object.values(parsedScripts.unlocking).reduce<string[]>(
      (all, script) => [
        ...all,
        ...(script.estimate === undefined ? [] : [script.estimate]),
        ...(script.fails === undefined ? [] : script.fails),
        ...(script.invalid === undefined ? [] : script.invalid),
        ...(script.passes === undefined ? [] : script.passes),
      ],
      []
    ),
    ...Object.values(parsedScripts.tested).reduce<string[]>(
      (all, script) => [
        ...all,
        ...script.tests.reduce<string[]>(
          (fromScript, test) => [
            ...fromScript,
            ...(test.fails === undefined ? [] : test.fails),
            ...(test.invalid === undefined ? [] : test.invalid),
            ...(test.passes === undefined ? [] : test.passes),
          ],
          []
        ),
      ],
      []
    ),
  ].reduce<string[]>(
    (unique, id) =>
      scenarioIds.includes(id) || unique.includes(id)
        ? unique
        : [...unique, id],
    []
  );

  if (unknownScenarioIds.length > 0) {
    return `Only known scenarios may be referenced by scripts. The following scenario IDs are not provided in this template: ${listIds(
      unknownScenarioIds
    )}.`;
  }

  const entityIdsReferencedByScenarioData = (
    data: AuthenticationTemplateScenarioData | undefined
  ) => {
    const hdPublicKeyEntityIds =
      data?.hdKeys?.hdPublicKeys === undefined
        ? []
        : Object.keys(data.hdKeys.hdPublicKeys);
    const hdPrivateKeyEntityIds =
      data?.hdKeys?.hdPrivateKeys === undefined
        ? []
        : Object.keys(data.hdKeys.hdPrivateKeys);
    return [...hdPublicKeyEntityIds, ...hdPrivateKeyEntityIds];
  };
  const unknownEntityIds =
    clonedScenarios === undefined
      ? []
      : Object.values(clonedScenarios)
          .reduce<string[]>(
            (all, scenario) => [
              ...all,
              ...entityIdsReferencedByScenarioData(scenario.data),
              ...(scenario.transaction?.outputs ?? []).reduce<string[]>(
                (fromOverrides, output) =>
                  isObject(output.lockingBytecode)
                    ? [
                        ...fromOverrides,
                        ...entityIdsReferencedByScenarioData(
                          output.lockingBytecode.overrides
                        ),
                      ]
                    : fromOverrides,
                []
              ),
            ],
            []
          )
          .reduce<string[]>(
            (unique, id) =>
              entityIds.includes(id) || unique.includes(id)
                ? unique
                : [...unique, id],
            []
          );

  if (unknownEntityIds.length > 0) {
    return `Only known entities may be referenced by hdKeys properties within scenarios. The following entity IDs are not provided in this template: ${listIds(
      unknownEntityIds
    )}.`;
  }

  return {
    ...(maybeTemplate.$schema === undefined
      ? {}
      : { $schema: maybeTemplate.$schema }),
    ...(maybeTemplate.description === undefined
      ? {}
      : { description: maybeTemplate.description }),
    entities: clonedEntities,
    ...(maybeTemplate.name === undefined ? {} : { name: maybeTemplate.name }),
    scenarios: clonedScenarios,
    scripts: clonedScripts,
    supported: maybeTemplate.supported,
    version: maybeTemplate.version,
  } as AuthenticationTemplate;
};
