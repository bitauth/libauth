import { lossyNormalize } from '../../format/format.js';

import type { AjvValidator, LibauthAjvError } from './ajv-types.js';
import walletTemplateValidator from './validate-wallet-template.js';

const avjErrorsToDescription = (errors: LibauthAjvError[]): string =>
  // TODO: translate instancePath
  errors.map((error) => `${error.instancePath}: ${error.message}`).join(',');

/**
 * Given an untrusted JSON string or object and an AJV validator, verify that
 * the untrusted value is of the expected shape. Note, this method first
 * normalizes all characters in the input using `Normalization Form KC`
 * (Compatibility Decomposition, followed by Canonical Composition).
 */
export const ajvStandaloneJsonParse = <T>(
  untrustedJsonOrObject: unknown,
  validator: AjvValidator<T>,
) => {
  // eslint-disable-next-line functional/no-try-statements
  try {
    const stringified =
      typeof untrustedJsonOrObject === 'string'
        ? untrustedJsonOrObject
        : JSON.stringify(untrustedJsonOrObject);
    const normalized = lossyNormalize(stringified);
    const parsed = JSON.parse(normalized) as unknown;
    if (validator(parsed)) {
      return parsed;
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return avjErrorsToDescription(walletTemplateValidator.errors!);
  } catch (e) {
    return `Invalid JSON. ${String(e)}`;
  }
};
