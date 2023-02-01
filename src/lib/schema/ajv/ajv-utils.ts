import type { AjvValidator, LibauthAjvError } from './ajv-types.js';
import AuthenticationTemplateValidator from './validate-authentication-template.js';

const avjErrorsToDescription = (errors: LibauthAjvError[]): string =>
  // TODO: translate instancePath
  errors.map((error) => `${error.instancePath}: ${error.message}`).join(',');

export const ajvStandaloneJsonParse = <T>(
  untrustedJsonOrObject: unknown,
  validator: AjvValidator<T>
) => {
  // eslint-disable-next-line functional/no-try-statement
  try {
    const parsed =
      typeof untrustedJsonOrObject === 'string'
        ? (JSON.parse(untrustedJsonOrObject) as unknown)
        : untrustedJsonOrObject;
    if (validator(parsed)) {
      return parsed;
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return avjErrorsToDescription(AuthenticationTemplateValidator.errors!);
  } catch (e) {
    return `Invalid JSON. ${String(e)}`;
  }
};
